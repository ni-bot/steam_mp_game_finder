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
  const uniqueIds = [...new Set(steamIds)];
  const statuses = await mapWithConcurrency(
    uniqueIds,
    probeLibraryStatus,
    concurrency
  );
  return new Map(uniqueIds.map((id, i) => [id, statuses[i]]));
}
