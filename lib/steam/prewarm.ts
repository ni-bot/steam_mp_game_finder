import { getAppDetails } from "@/lib/steam/client";
import { mapWithConcurrency } from "@/lib/steam/pool";
import type { OwnedGamesPayload } from "@/lib/steam/types";

const DEFAULT_CONCURRENCY = 4;

export function collectPairwiseAppIds(
  payloads: OwnedGamesPayload[]
): number[] {
  const counts = new Map<number, number>();

  for (const payload of payloads) {
    const seen = new Set<number>();
    for (const game of payload.games) {
      if (seen.has(game.appid)) continue;
      seen.add(game.appid);
      counts.set(game.appid, (counts.get(game.appid) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([appId]) => appId);
}

export async function prewarmAppDetails(
  appIds: number[],
  options?: {
    concurrency?: number;
    onProgress?: (info: { loaded: number; total: number; appId: number }) => void;
  }
): Promise<void> {
  const uniqueIds = [...new Set(appIds)];
  const total = uniqueIds.length;
  if (total === 0) return;

  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  let loaded = 0;

  await mapWithConcurrency(
    uniqueIds,
    async (appId) => {
      await getAppDetails(appId);
      loaded += 1;
      options?.onProgress?.({ loaded, total, appId });
    },
    concurrency
  );

}
