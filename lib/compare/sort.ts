import type { CompareGameResult, SortMode } from "@/lib/steam/types";

export function sortGames(
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
