export type SteamStoreLanguage = "german" | "english";

export function steamStoreLanguage(locale: string): SteamStoreLanguage {
  return locale === "de" ? "german" : "english";
}

export function storeAppUrl(appId: number, locale: string): string {
  const lang = steamStoreLanguage(locale);
  return `https://store.steampowered.com/app/${appId}?l=${lang}`;
}

export function storeWidgetUrl(appId: number, locale: string): string {
  const lang = steamStoreLanguage(locale);
  return `https://store.steampowered.com/widget/${appId}?l=${lang}`;
}
