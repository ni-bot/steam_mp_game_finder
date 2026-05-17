import { Redis } from "@upstash/redis";

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? 10800);

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    const raw = await redis.get<string>(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  const serialized = JSON.stringify(value);

  if (redis) {
    await redis.set(key, serialized, { ex: ttlSeconds });
    return;
  }

  memoryStore.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function cacheDelete(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }
  memoryStore.delete(key);
}

export async function cacheDeletePattern(prefix: string): Promise<void> {
  if (redis) {
    // Upstash doesn't support KEYS in REST; delete known key shapes via caller
    return;
  }
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
}

export function ownedGamesCacheKey(steamId: string): string {
  return `owned:${steamId}`;
}

export function appMetaCacheKey(appId: number): string {
  return `appmeta:${appId}`;
}

export async function invalidateAllAppMeta(): Promise<void> {
  if (redis) {
    return;
  }
  for (const key of memoryStore.keys()) {
    if (key.startsWith("appmeta:")) {
      memoryStore.delete(key);
    }
  }
}
