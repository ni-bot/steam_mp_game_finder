import { cacheGet, appMetaCacheKey } from "@/lib/cache";
import { sortGames } from "@/lib/compare/sort";
import {
  buildCompareGame,
  buildPlaytimeMap,
  resolveCompareAppIds,
} from "@/lib/compare/build";
import {
  getAppDetails,
  getOwnedGames,
  getPlayerSummaries,
} from "@/lib/steam/client";
import type { AppDetails } from "@/lib/steam/types";
import type {
  CompareGameResult,
  CompareResponse,
  LibraryStatus,
  MatchMode,
  PersonLibrary,
  SortMode,
} from "@/lib/steam/types";

export { sortGames } from "@/lib/compare/sort";

async function loadLibrary(
  steamId: string,
  skipCache: boolean
): Promise<PersonLibrary> {
  const payload = await getOwnedGames(steamId, { skipCache });

  if (!payload) {
    return { steamId, status: "private", games: [] };
  }

  return {
    steamId,
    status: "ok",
    games: payload.games,
    lastUpdated: payload.lastUpdated,
  };
}

async function getCachedAppDetails(appId: number): Promise<AppDetails | null> {
  return cacheGet<AppDetails>(appMetaCacheKey(appId));
}

export type CompareStreamSend = (event: string, data: unknown) => void;

async function prepareCompareContext(options: {
  mySteamId: string;
  friendSteamIds: string[];
  skipCache?: boolean;
}) {
  const allIds = [options.mySteamId, ...options.friendSteamIds];
  const profiles = await getPlayerSummaries(allIds);
  const profileMap = new Map(profiles.map((p) => [p.steamid, p]));

  const libraries = await Promise.all(
    allIds.map((id) => loadLibrary(id, options.skipCache ?? false))
  );

  for (const lib of libraries) {
    const profile = profileMap.get(lib.steamId);
    if (profile) {
      lib.displayName = profile.personaname;
      lib.avatarUrl = profile.avatarfull;
    }
  }

  const excludedFriends = options.friendSteamIds.filter((friendId) => {
    const lib = libraries.find((l) => l.steamId === friendId);
    return lib?.status !== "ok";
  });

  return { libraries, excludedFriends };
}

function buildParticipants(libraries: PersonLibrary[]) {
  return libraries.map((lib) => ({
    steamId: lib.steamId,
    displayName: lib.displayName ?? lib.steamId,
    avatarUrl: lib.avatarUrl,
    status: lib.status as LibraryStatus,
    lastUpdated: lib.lastUpdated,
  }));
}

export async function compareLibraries(options: {
  mySteamId: string;
  friendSteamIds: string[];
  multiplayerOnly: boolean;
  sort: SortMode;
  matchMode?: MatchMode;
  skipCache?: boolean;
}): Promise<CompareResponse> {
  const { libraries, excludedFriends } = await prepareCompareContext(options);
  const matchMode = options.matchMode ?? "strict";
  const { appIds, nearMap } = resolveCompareAppIds(libraries, matchMode);
  const playtimeMap = buildPlaytimeMap(libraries);

  const games: CompareGameResult[] = [];
  const pendingIds: number[] = [];

  for (const appId of appIds) {
    const meta = await getCachedAppDetails(appId);
    if (!meta && options.multiplayerOnly) {
      pendingIds.push(appId);
      continue;
    }
    const details = meta ?? (await getAppDetails(appId));
    const game = buildCompareGame(appId, libraries, playtimeMap, details, {
      multiplayerOnly: options.multiplayerOnly,
      matchMode,
      nearMap,
    });
    if (game) games.push(game);
    else if (!meta) pendingIds.push(appId);
  }

  for (const appId of pendingIds) {
    if (games.some((g) => g.appid === appId)) continue;
    const details = await getAppDetails(appId);
    const game = buildCompareGame(appId, libraries, playtimeMap, details, {
      multiplayerOnly: options.multiplayerOnly,
      matchMode,
      nearMap,
    });
    if (game) games.push(game);
  }

  return {
    games: sortGames(games, options.sort),
    participants: buildParticipants(libraries),
    excludedFriends,
  };
}

export async function compareLibrariesStream(
  options: {
    mySteamId: string;
    friendSteamIds: string[];
    multiplayerOnly: boolean;
    sort: SortMode;
    matchMode?: MatchMode;
    skipCache?: boolean;
  },
  send: CompareStreamSend
): Promise<void> {
  const { libraries, excludedFriends } = await prepareCompareContext(options);
  const matchMode = options.matchMode ?? "strict";
  const { appIds, nearMap } = resolveCompareAppIds(libraries, matchMode);
  const playtimeMap = buildPlaytimeMap(libraries);

  const games: CompareGameResult[] = [];
  const pendingIds: number[] = [];

  for (const appId of appIds) {
    const meta = await getCachedAppDetails(appId);
    if (!meta && options.multiplayerOnly) {
      pendingIds.push(appId);
      continue;
    }
    const game = buildCompareGame(appId, libraries, playtimeMap, meta, {
      multiplayerOnly: options.multiplayerOnly,
      matchMode,
      nearMap,
    });
    if (game) games.push(game);
    else if (!meta) pendingIds.push(appId);
  }

  send("result", {
    games: sortGames(games, options.sort),
    participants: buildParticipants(libraries),
    excludedFriends,
  });

  const seen = new Set(games.map((g) => g.appid));

  for (const appId of pendingIds) {
    if (seen.has(appId)) continue;
    const details = await getAppDetails(appId);
    const game = buildCompareGame(appId, libraries, playtimeMap, details, {
      multiplayerOnly: options.multiplayerOnly,
      matchMode,
      nearMap,
    });
    if (!game) continue;
    seen.add(appId);
    send("game_update", { game });
  }

  send("done", {});
}
