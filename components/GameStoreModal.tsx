"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { storeAppUrl, storeWidgetUrl } from "@/lib/steam/store-url";
import type { CompareGameResult } from "@/lib/steam/types";

interface GameStoreModalProps {
  game: CompareGameResult | null;
  onClose: () => void;
}

type WidgetState = "loading" | "loaded" | "error";

export function GameStoreModal({ game, onClose }: GameStoreModalProps) {
  const t = useTranslations("results.storeModal");
  const locale = useLocale();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [widgetState, setWidgetState] = useState<WidgetState>("loading");

  const appUrl = game ? storeAppUrl(game.appid, locale) : "";
  const widgetUrl = game ? storeWidgetUrl(game.appid, locale) : "";

  useEffect(() => {
    if (!game) return;
    setWidgetState("loading");
  }, [game, locale]);

  useEffect(() => {
    if (!game) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const elements = Array.from(focusable).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
      );
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [game, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!game) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="flex w-[min(90vw,900px)] max-h-[90vh] flex-col rounded-lg border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--steam-border)] px-5 py-4">
          <h2
            id={titleId}
            className="min-w-0 truncate text-lg font-semibold text-white"
          >
            {game.name}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded px-2 py-1 text-sm text-[var(--steam-muted)] hover:bg-[var(--steam-panel)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--steam-accent)]"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="relative min-h-[220px] overflow-auto px-5 py-4">
          {widgetState === "loading" && (
            <div
              className="absolute inset-0 flex items-center justify-center px-5 py-4"
              aria-hidden="true"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--steam-border)] border-t-[var(--steam-accent)]" />
            </div>
          )}

          {widgetState === "error" && (
            <p className="mb-4 text-center text-sm text-amber-200">
              {t("widgetLoadError")}
            </p>
          )}

          <iframe
            key={widgetUrl}
            src={widgetUrl}
            title={game.name}
            className={`mx-auto block w-full max-w-[646px] border-0 transition-opacity ${
              widgetState === "loaded" ? "opacity-100" : "opacity-0"
            }`}
            style={{ minHeight: 190 }}
            onLoad={() => setWidgetState("loaded")}
            onError={() => setWidgetState("error")}
          />
        </div>

        <div className="shrink-0 border-t border-[var(--steam-border)] px-5 py-4 text-center">
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded bg-[var(--steam-accent)] px-5 py-2.5 text-sm font-medium text-[var(--steam-bg)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--steam-accent)]"
          >
            {t("openInStore")}
          </a>
        </div>
      </div>
    </div>
  );
}
