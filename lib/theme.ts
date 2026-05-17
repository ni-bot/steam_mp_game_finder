export const THEME_STORAGE_KEY = "steam-mp-theme";

export const THEMES = ["steam-store", "steam-client"] as const;
export type ThemeId = (typeof THEMES)[number];

export function isThemeId(value: string): value is ThemeId {
  return (THEMES as readonly string[]).includes(value);
}

export const DEFAULT_THEME: ThemeId = "steam-store";

export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="steam-store"||t==="steam-client"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;
