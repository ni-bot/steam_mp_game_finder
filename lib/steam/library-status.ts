import { fetchOwnedGames } from "@/lib/steam/client";
import { mapWithConcurrency } from "@/lib/steam/pool";
import type { LibraryStatus } from "@/lib/steam/types";

export type LibraryAccessStatus = LibraryStatus;

const DEFAULT_CONCURRENCY = 8;

export async function probeLibraryStatus(
  steamId: string
): Promise<LibraryAccessStatus> {
  const result = await fetchOwnedGames(steamId);
  if (result.kind === "ok") return "ok";
  if (result.kind === "private") return "private";
  return "error";
}

export async function probeLibraryStatusMap(
  steamIds: string[],
  concurrency = DEFAULT_CONCURRENCY
): Promise<Map<string, LibraryAccessStatus>> {
  return probeLibraryStatusMapWithProgress(steamIds, { concurrency });
}

export async function probeLibraryStatusMapWithProgress(
  steamIds: string[],
  options?: {
    concurrency?: number;
    onProgress?: (info: {
      steamId: string;
      status: LibraryAccessStatus;
      loaded: number;
      total: number;
    }) => void;
  }
): Promise<Map<string, LibraryAccessStatus>> {
  const uniqueIds = [...new Set(steamIds)];
  const total = uniqueIds.length;
  let loaded = 0;
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;

  const statuses = await mapWithConcurrency(
    uniqueIds,
    async (steamId) => {
      const status = await probeLibraryStatus(steamId);
      loaded += 1;
      options?.onProgress?.({ steamId, status, loaded, total });
      return status;
    },
    concurrency
  );

  return new Map(uniqueIds.map((id, i) => [id, statuses[i]]));
}
