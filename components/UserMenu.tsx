"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { ChangelogModal } from "@/components/ChangelogModal";
import { PersonLabel } from "@/components/PersonLabel";
import { useTheme } from "@/components/providers/ThemeProvider";
import { THEMES, type ThemeId } from "@/lib/theme";

interface UserMenuProps {
  name: string;
  steamId: string;
  image?: string | null;
}

export function UserMenu({ name, steamId, image }: UserMenuProps) {
  const tNav = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const tChangelog = useTranslations("changelog");
  const { theme, setTheme, lightMode, setLightMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const themeLabel: Record<ThemeId, string> = {
    harbor: tTheme("harbor"),
    grove: tTheme("grove"),
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded px-2 py-1.5 text-left hover:bg-[var(--steam-hover)] transition-colors"
      >
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-8 w-8 rounded" />
        )}
        <PersonLabel
          name={name}
          steamId={steamId}
          className="text-sm text-[var(--steam-text)]"
        />
        <span className="text-xs text-[var(--steam-muted)]" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--steam-muted)]">
            {tTheme("menuLabel")}
          </p>
          {THEMES.map((id) => (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === id}
              onClick={() => {
                setTheme(id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--steam-hover)] transition-colors"
            >
              <span
                className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs ${
                  theme === id
                    ? "border-[var(--steam-accent)] bg-[var(--steam-accent)]/20 text-[var(--steam-accent)]"
                    : "border-[var(--steam-border)]"
                }`}
                aria-hidden
              >
                {theme === id ? "✓" : ""}
              </span>
              {themeLabel[id]}
            </button>
          ))}
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-sm">{tTheme("lightMode")}</span>
            <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                role="switch"
                aria-checked={lightMode}
                checked={lightMode}
                onChange={(e) => setLightMode(e.target.checked)}
                className="peer sr-only"
              />
              <span
                className="absolute inset-0 rounded-full border border-[var(--steam-border)] bg-[var(--steam-panel)] transition-colors peer-checked:border-[var(--steam-accent)] peer-checked:bg-[var(--steam-accent)]/25 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--steam-accent)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--steam-bg-dark)]"
                aria-hidden
              />
              <span
                className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--steam-toggle-off)] shadow transition-transform peer-checked:translate-x-5 peer-checked:bg-[var(--steam-accent)]"
                aria-hidden
              />
            </label>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setChangelogOpen(true);
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--steam-hover)] transition-colors"
          >
            {tChangelog("menu")}
          </button>
          <div
            className="my-1 border-t border-[var(--steam-border)]"
            role="separator"
          />
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut()}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--steam-hover)] transition-colors"
          >
            {tNav("signOut")}
          </button>
        </div>
      )}

      <ChangelogModal
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
      />
    </div>
  );
}
