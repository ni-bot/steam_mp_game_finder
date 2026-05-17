import {
  cacheDelete,
  cacheGet,
  cacheSet,
  invalidateAllAppMeta,
  ownedGamesCacheKey,
  appMetaCacheKey,
} from "@/lib/cache";
import { mapWithConcurrency } from "@/lib/steam/pool";
import type {
  AppDetails,
  FriendEntry,
  OwnedGame,
  OwnedGamesPayload,
  SteamPlayer,
} from "./types";
import {
  getMultiplayerTags,
  isMultiplayerCategory,
  isPlayableGameType,
} from "./multiplayer";

const STEAM_API_BASE = "https://api.steampowered.com";
const STORE_API_BASE = "https://store.steampowered.com/api";

function getApiKey(): string {
  const key = process.env.STEAM_WEB_API_KEY;
  if (!key) throw new Error("STEAM_WEB_API_KEY is not configured");
  return key;
}

async function steamFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Steam API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Steam Web API allows at most 100 steamids per GetPlayerSummaries call. */
const PLAYER_SUMMARIES_BATCH_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function fetchPlayerSummariesBatch(
  steamIds: string[]
): Promise<SteamPlayer[]> {
  const key = getApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamIds.join(",")}`;
  const data = await steamFetch<{
    response: { players: SteamPlayer[] };
  }>(url);
  return data.response.players ?? [];
}

export async function getPlayerSummaries(
  steamIds: string[]
): Promise<SteamPlayer[]> {
  if (steamIds.length === 0) return [];

  const uniqueIds = [...new Set(steamIds)];
  const batches = chunk(uniqueIds, PLAYER_SUMMARIES_BATCH_SIZE);
  const results = await Promise.all(
    batches.map((batch) => fetchPlayerSummariesBatch(batch))
  );
  return results.flat();
}

export async function getFriendList(steamId: string): Promise<FriendEntry[]> {
  const key = getApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/GetFriendList/v1/?key=${key}&steamid=${steamId}&relationship=friend`;
  try {
    const data = await steamFetch<{
      friendslist?: { friends: FriendEntry[] };
    }>(url);
    return data.friendslist?.friends ?? [];
  } catch {
    return [];
  }
}

export async function resolveVanityUrl(input: string): Promise<string | null> {
  const vanity = extractVanityFromUrl(input);
  if (!vanity) return null;

  if (/^\d{17}$/.test(vanity)) return vanity;

  const key = getApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanity)}`;
  const data = await steamFetch<{
    response: { success: number; steamid?: string };
  }>(url);

  return data.response.success === 1 ? (data.response.steamid ?? null) : null;
}

function extractVanityFromUrl(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{17}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "profiles" && parts[1]) return parts[1];
    if (parts[0] === "id" && parts[1]) return parts[1];
  } catch {
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  }
  return null;
}

export type OwnedGamesFetchResult =
  | { kind: "ok"; payload: OwnedGamesPayload }
  | { kind: "private" }
  | { kind: "error" };

async function fetchOwnedGamesFromApi(
  steamId: string
): Promise<OwnedGamesFetchResult> {
  const apiKey = getApiKey();
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;

  try {
    const data = await steamFetch<{
      response: {
        game_count?: number;
        games?: OwnedGame[];
      };
    }>(url);

    if (
      data.response.game_count === undefined &&
      data.response.games === undefined
    ) {
      return { kind: "private" };
    }

    const payload: OwnedGamesPayload = {
      games: data.response.games ?? [],
      lastUpdated: new Date().toISOString(),
    };

    await cacheSet(ownedGamesCacheKey(steamId), payload);
    return { kind: "ok", payload };
  } catch {
    return { kind: "error" };
  }
}

export async function fetchOwnedGames(
  steamId: string,
  options?: { skipCache?: boolean }
): Promise<OwnedGamesFetchResult> {
  const cacheKey = ownedGamesCacheKey(steamId);

  if (!options?.skipCache) {
    const cached = await cacheGet<OwnedGamesPayload>(cacheKey);
    if (cached) return { kind: "ok", payload: cached };
  }

  return fetchOwnedGamesFromApi(steamId);
}

export async function getOwnedGames(
  steamId: string,
  options?: { skipCache?: boolean }
): Promise<OwnedGamesPayload | null> {
  const result = await fetchOwnedGames(steamId, options);
  if (result.kind === "ok") return result.payload;
  return null;
}

export async function invalidateOwnedGames(steamId: string): Promise<void> {
  await cacheDelete(ownedGamesCacheKey(steamId));
}

export async function invalidateAppMeta(appId: number): Promise<void> {
  await cacheDelete(appMetaCacheKey(appId));
}

export { invalidateAllAppMeta };

export async function getAppDetails(appId: number): Promise<AppDetails | null> {
  const cacheKey = appMetaCacheKey(appId);
  const cached = await cacheGet<AppDetails>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${STORE_API_BASE}/appdetails?appids=${appId}&l=english`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;

    const data = (await res.json()) as Record<
      string,
      { success: boolean; data?: Record<string, unknown> }
    >;

    const entry = data[String(appId)];
    if (!entry?.success || !entry.data) return null;

    const raw = entry.data;
    const categories = raw.categories as AppDetails["categories"];
    const type = (raw.type as string) ?? "unknown";
    const details: AppDetails = {
      appid: appId,
      name: (raw.name as string) ?? `App ${appId}`,
      type,
      categories,
      genres: raw.genres as AppDetails["genres"],
      header_image: raw.header_image as string | undefined,
      isMultiplayer: isMultiplayerCategory(categories),
      isPlayableGame: isPlayableGameType(type),
    };

    await cacheSet(cacheKey, details);
    return details;
  } catch {
    return null;
  }
}

export async function getAppDetailsBatch(
  appIds: number[],
  options?: { concurrency?: number }
): Promise<Map<number, AppDetails>> {
  const uniqueIds = [...new Set(appIds)];
  if (uniqueIds.length === 0) return new Map();

  const concurrency = options?.concurrency ?? 4;
  const detailsList = await mapWithConcurrency(
    uniqueIds,
    async (appId) => ({ appId, details: await getAppDetails(appId) }),
    concurrency
  );

  const result = new Map<number, AppDetails>();
  for (const { appId, details } of detailsList) {
    if (details) result.set(appId, details);
  }
  return result;
}

export { getMultiplayerTags };
