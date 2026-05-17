import type { CompareGameResult } from "@/lib/steam/types";

export function filterGamesByTags(
  games: CompareGameResult[],
  selectedTags: ReadonlySet<string>
): CompareGameResult[] {
  if (selectedTags.size === 0) return games;
  return games.filter((g) =>
    g.multiplayerTags.some((tag) => selectedTags.has(tag))
  );
}

export function collectMultiplayerTags(
  games: CompareGameResult[],
  locale: string
): string[] {
  const tags = new Set<string>();
  for (const game of games) {
    for (const tag of game.multiplayerTags) {
      tags.add(tag);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b, locale));
}
