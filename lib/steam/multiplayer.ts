const MULTIPLAYER_CATEGORY_IDS = new Set([
  1, // Multi-player
  9, // Co-op
  38, // Online Co-op
  39, // LAN Co-op
  24, // Shared/Split Screen
  27, // Cross-Platform Multiplayer
  36, // Online Multi-Player (legacy)
  37, // Local Multi-Player (legacy)
]);

const MULTIPLAYER_KEYWORDS = [
  "multi-player",
  "multiplayer",
  "co-op",
  "coop",
  "mmo",
  "pvp",
  "online co-op",
  "lan co-op",
];

export function isMultiplayerCategory(
  categories: { id: number; description: string }[] | undefined
): boolean {
  if (!categories?.length) return false;

  return categories.some((cat) => {
    if (MULTIPLAYER_CATEGORY_IDS.has(cat.id)) return true;
    const desc = cat.description.toLowerCase();
    return MULTIPLAYER_KEYWORDS.some((kw) => desc.includes(kw));
  });
}

export function getMultiplayerTags(
  categories: { id: number; description: string }[] | undefined
): string[] {
  if (!categories?.length) return [];

  return categories
    .filter(
      (cat) =>
        MULTIPLAYER_CATEGORY_IDS.has(cat.id) ||
        MULTIPLAYER_KEYWORDS.some((kw) =>
          cat.description.toLowerCase().includes(kw)
        )
    )
    .map((cat) => cat.description);
}

export function isPlayableGameType(type: string | undefined): boolean {
  if (!type) return false;
  const normalized = type.toLowerCase();
  return normalized === "game" || normalized === "demo";
}
