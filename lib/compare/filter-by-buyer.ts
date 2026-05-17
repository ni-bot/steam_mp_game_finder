import type { CompareGameResult } from "@/lib/steam/types";

export function filterGamesByBuyer(
  games: CompareGameResult[],
  steamId: string | null
): CompareGameResult[] {
  if (!steamId) return games;
  return games.filter(
    (g) =>
      g.missingOwners.length === 1 && g.missingOwners[0] === steamId
  );
}
