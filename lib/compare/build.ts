import { getMultiplayerTags } from "@/lib/steam/multiplayer";
import type {
  AppDetails,
  CompareGameResult,
  MatchMode,
  PersonLibrary,
} from "@/lib/steam/types";

export function intersectAppIds(libraries: PersonLibrary[]): Set<number> {
  const accessible = libraries.filter((l) => l.status === "ok");
  if (accessible.length === 0) return new Set();

  let intersection = new Set(accessible[0].games.map((g) => g.appid));

  for (let i = 1; i < accessible.length; i++) {
    const ids = new Set(accessible[i].games.map((g) => g.appid));
    intersection = new Set([...intersection].filter((id) => ids.has(id)));
  }

  return intersection;
}

export function collectNearSharedAppIds(
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

export function buildPlaytimeMap(
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

export function getGameName(libraries: PersonLibrary[], appId: number): string {
  for (const lib of libraries) {
    const game = lib.games.find((g) => g.appid === appId);
    if (game?.name) return game.name;
  }
  return `App ${appId}`;
}

export function resolveCompareAppIds(
  libraries: PersonLibrary[],
  matchMode: MatchMode
): { appIds: number[]; nearMap: Map<number, string[]> | null } {
  const nearMap =
    matchMode === "near" ? collectNearSharedAppIds(libraries) : null;
  const appIds =
    matchMode === "near"
      ? [...(nearMap?.keys() ?? [])]
      : [...intersectAppIds(libraries)];
  return { appIds, nearMap };
}

export function buildCompareGame(
  appId: number,
  libraries: PersonLibrary[],
  playtimeMap: Map<number, Record<string, number>>,
  meta: AppDetails | null | undefined,
  options: {
    multiplayerOnly: boolean;
    matchMode: MatchMode;
    nearMap: Map<number, string[]> | null;
  }
): CompareGameResult | null {
  if (meta && !meta.isPlayableGame) return null;
  if (options.multiplayerOnly && meta && !meta.isMultiplayer) return null;
  if (options.multiplayerOnly && !meta) return null;

  const playtimes = playtimeMap.get(appId) ?? {};
  const combinedPlaytime = Object.values(playtimes).reduce((a, b) => a + b, 0);
  const missingOwners =
    options.matchMode === "near" ? (options.nearMap?.get(appId) ?? []) : [];

  return {
    appid: appId,
    name: meta?.name ?? getGameName(libraries, appId),
    headerImage: meta?.header_image,
    storeUrl: `https://store.steampowered.com/app/${appId}`,
    multiplayerTags: meta ? getMultiplayerTags(meta.categories) : [],
    playtimes,
    combinedPlaytime,
    missingOwners,
  };
}
