export interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatarfull: string;
  avatar: string;
}

export interface OwnedGame {
  appid: number;
  name?: string;
  playtime_forever: number;
  rtime_last_played?: number;
  img_icon_url?: string;
}

export interface OwnedGamesPayload {
  games: OwnedGame[];
  lastUpdated: string;
}

export interface FriendEntry {
  steamid: string;
  friend_since: number;
}

export interface AppCategory {
  id: number;
  description: string;
}

export interface AppDetails {
  appid: number;
  name: string;
  type: string;
  categories?: AppCategory[];
  genres?: { id: string; description: string }[];
  header_image?: string;
  isMultiplayer: boolean;
  isPlayableGame: boolean;
}

export type LibraryStatus = "ok" | "private" | "error";

export interface PersonLibrary {
  steamId: string;
  status: LibraryStatus;
  games: OwnedGame[];
  lastUpdated?: string;
  displayName?: string;
  avatarUrl?: string;
}

export type SortMode =
  | "low_playtime"
  | "high_playtime"
  | "alpha"
  | "recent";

export type MatchMode = "strict" | "near";

export interface CompareGameResult {
  appid: number;
  name: string;
  headerImage?: string;
  storeUrl: string;
  multiplayerTags: string[];
  playtimes: Record<string, number>;
  combinedPlaytime: number;
  maxLastPlayed: number;
  missingOwners: string[];
}

export interface CompareResponse {
  games: CompareGameResult[];
  participants: {
    steamId: string;
    displayName: string;
    avatarUrl?: string;
    status: LibraryStatus;
    lastUpdated?: string;
  }[];
  excludedFriends: string[];
}
