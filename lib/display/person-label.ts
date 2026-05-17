/** Display name with Steam ID in parentheses, e.g. "Alice (76561198012345678)". */
export function formatPersonLabel(name: string, steamId: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === steamId) return steamId;
  return `${trimmed} (${steamId})`;
}

/** Steam communityvisibilitystate: 3 = public profile. */
export function isPublicProfile(communityvisibilitystate?: number): boolean {
  return communityvisibilitystate === 3;
}
