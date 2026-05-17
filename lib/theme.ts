export const THEME_STORAGE_KEY = "steam-mp-theme";
export const LIGHT_MODE_STORAGE_KEY = "steam-mp-light";

export const THEMES = ["harbor", "grove"] as const;
export type ThemeId = (typeof THEMES)[number];

const LEGACY_THEME_IDS: Record<string, ThemeId> = {
  "steam-store": "harbor",
  "steam-client": "grove",
};

export function normalizeThemeId(value: string): ThemeId | null {
  if (isThemeId(value)) return value;
  return LEGACY_THEME_IDS[value] ?? null;
}

export function isThemeId(value: string): value is ThemeId {
  return (THEMES as readonly string[]).includes(value);
}

export const DEFAULT_THEME: ThemeId = "harbor";

export const themeInitScript = `(function(){try{var d=document.documentElement;var m={"steam-store":"harbor","steam-client":"grove"};var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t&&(t==="harbor"||t==="grove")){d.setAttribute("data-theme",t);}else if(t&&m[t]){d.setAttribute("data-theme",m[t]);}var l=localStorage.getItem("${LIGHT_MODE_STORAGE_KEY}");if(l==="true"){d.setAttribute("data-light","true");}}catch(e){}})();`;
