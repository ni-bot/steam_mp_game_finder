"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_THEME,
  LIGHT_MODE_STORAGE_KEY,
  normalizeThemeId,
  THEME_STORAGE_KEY,
  type ThemeId,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  lightMode: boolean;
  setLightMode: (enabled: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const normalized = normalizeThemeId(stored);
      if (normalized) return normalized;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

function readStoredLightMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LIGHT_MODE_STORAGE_KEY) === "true";
  } catch {
    /* ignore */
  }
  return false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [lightMode, setLightModeState] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setLightModeState(readStoredLightMode());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (lightMode) {
      document.documentElement.setAttribute("data-light", "true");
    } else {
      document.documentElement.removeAttribute("data-light");
    }
    try {
      localStorage.setItem(LIGHT_MODE_STORAGE_KEY, String(lightMode));
    } catch {
      /* ignore */
    }
  }, [lightMode]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
  }, []);

  const setLightMode = useCallback((enabled: boolean) => {
    setLightModeState(enabled);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, lightMode, setLightMode }),
    [theme, setTheme, lightMode, setLightMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
