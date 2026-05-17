import { getAppDetailsBatch, getOwnedGames, getPlayerSummaries } from "@/lib/steam/client";
import { getMultiplayerTags } from "@/lib/steam/multiplayer";
import type {
  CompareGameResult,
  CompareResponse,
  LibraryStatus,
  MatchMode,
  PersonLibrary,
  SortMode,
} from "@/lib/steam/types";

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

function intersectAppIds(libraries: PersonLibrary[]): Set<number> {
  const accessible = libraries.filter((l) => l.status === "ok");
  if (accessible.length === 0) return new Set();

  let intersection = new Set(accessible[0].games.map((g) => g.appid));

  for (let i = 1; i < accessible.length; i++) {
    const ids = new Set(accessible[i].games.map((g) => g.appid));
    intersection = new Set([...intersection].filter((id) => ids.has(id)));
  }

  return intersection;
}

function collectNearSharedAppIds(
  libraries: PersonLibrary[]
): Map<number, string[]> {
  const accessible = libraries.filter((l) => l.status === "ok");
  const result = new Map<number, string[]>();
  if (accessible.length === 0) return result;

  const ownerSets = accessible.map((lib) => ({
    steamId: lib.steamId,
    ids: new Set(lib.games.map((g) => g.appid)),
  }));

  const allAppIds = new Set<number>();
  for (const { ids } of ownerSets) {
    for (const id of ids) allAppIds.add(id);
  }

  for (const appId of allAppIds) {
    const missingOwners: string[] = [];
    for (const { steamId, ids } of ownerSets) {
      if (!ids.has(appId)) missingOwners.push(steamId);
    }
    if (missingOwners.length <= 1) {
      result.set(appId, missingOwners);
    }
  }

  return result;
}

function buildPlaytimeMap(
  libraries: PersonLibrary[]
): Map<number, Record<string, number>> {
  const map = new Map<number, Record<string, number>>();

  for (const lib of libraries) {
    if (lib.status !== "ok") continue;
    for (const game of lib.games) {
      const existing = map.get(game.appid) ?? {};
      existing[lib.steamId] = game.playtime_forever ?? 0;
      map.set(game.appid, existing);
    }
  }

  return map;
}

function buildLastPlayedMap(
  libraries: PersonLibrary[]
): Map<number, Record<string, number>> {
  const map = new Map<number, Record<string, number>>();

  for (const lib of libraries) {
    if (lib.status !== "ok") continue;
    for (const game of lib.games) {
      const existing = map.get(game.appid) ?? {};
      existing[lib.steamId] = game.rtime_last_played ?? 0;
      map.set(game.appid, existing);
    }
  }

  return map;
}

function getGameName(libraries: PersonLibrary[], appId: number): string {
  for (const lib of libraries) {
    const game = lib.games.find((g) => g.appid === appId);
    if (game?.name) return game.name;
  }
  return `App ${appId}`;
}

function sortGames(
  games: CompareGameResult[],
  mode: SortMode
): CompareGameResult[] {
  const sorted = [...games];

  switch (mode) {
    case "high_playtime":
      sorted.sort((a, b) => b.combinedPlaytime - a.combinedPlaytime);
      break;
    case "alpha":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "recent":
      sorted.sort((a, b) => b.maxLastPlayed - a.maxLastPlayed);
      break;
    case "low_playtime":
    default:
      sorted.sort((a, b) => a.combinedPlaytime - b.combinedPlaytime);
  }

  return sorted;
}

export async function compareLibraries(options: {
  mySteamId: string;
  friendSteamIds: string[];
  multiplayerOnly: boolean;
  sort: SortMode;
  matchMode?: MatchMode;
  skipCache?: boolean;
}): Promise<CompareResponse> {
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

  const matchMode = options.matchMode ?? "strict";
  const nearMap =
    matchMode === "near" ? collectNearSharedAppIds(libraries) : null;
  const appIds =
    matchMode === "near"
      ? [...(nearMap?.keys() ?? [])]
      : [...intersectAppIds(libraries)];

  const playtimeMap = buildPlaytimeMap(libraries);
  const lastPlayedMap = buildLastPlayedMap(libraries);

  const metaMap = await getAppDetailsBatch(appIds, 200);

  const games: CompareGameResult[] = [];

  for (const appId of appIds) {
    const meta = metaMap.get(appId);
    if (meta && !meta.isPlayableGame) continue;
    if (options.multiplayerOnly && meta && !meta.isMultiplayer) continue;
    if (options.multiplayerOnly && !meta) continue;

    const playtimes = playtimeMap.get(appId) ?? {};
    const lastPlayed = lastPlayedMap.get(appId) ?? {};
    const combinedPlaytime = Object.values(playtimes).reduce((a, b) => a + b, 0);
    const maxLastPlayed = Math.max(0, ...Object.values(lastPlayed));
    const missingOwners =
      matchMode === "near" ? (nearMap?.get(appId) ?? []) : [];

    games.push({
      appid: appId,
      name: meta?.name ?? getGameName(libraries, appId),
      headerImage: meta?.header_image,
      storeUrl: `https://store.steampowered.com/app/${appId}`,
      multiplayerTags: meta ? getMultiplayerTags(meta.categories) : [],
      playtimes,
      combinedPlaytime,
      maxLastPlayed,
      missingOwners,
    });
  }

  return {
    games: sortGames(games, options.sort),
    participants: libraries.map((lib) => ({
      steamId: lib.steamId,
      displayName: lib.displayName ?? lib.steamId,
      avatarUrl: lib.avatarUrl,
      status: lib.status as LibraryStatus,
      lastUpdated: lib.lastUpdated,
    })),
    excludedFriends,
  };
}
