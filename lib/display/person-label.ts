/** Display name with Steam ID in parentheses, e.g. "Alice (76561198012345678)". */
export function formatPersonLabel(name: string, steamId: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === steamId) return steamId;
  return `${trimmed} (${steamId})`;
}
