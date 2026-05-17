"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getChangelogForLocale } from "@/lib/changelog";

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangelogModal({ open, onClose }: ChangelogModalProps) {
  const t = useTranslations("changelog");
  const locale = useLocale();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const entries = getChangelogForLocale(locale);

  useEffect(() => {
    if (!open) return;

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
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="flex w-[min(90vw,520px)] max-h-[85vh] flex-col rounded-lg border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--steam-border)] px-5 py-4">
          <h2
            id={titleId}
            className="text-lg font-semibold text-[var(--steam-text)]"
          >
            {t("title")}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded px-2 py-1 text-sm text-[var(--steam-muted)] hover:bg-[var(--steam-panel)] hover:text-[var(--steam-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--steam-accent)]"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <ol className="flex flex-col gap-5">
            {entries.map((entry, index) => (
              <li
                key={entry.version}
                className={`rounded border px-4 py-3 ${
                  index === 0
                    ? "border-[var(--steam-accent)]/50 bg-[var(--steam-accent)]/5"
                    : "border-[var(--steam-border)] bg-[var(--steam-panel)]/30"
                }`}
              >
                <div className="mb-2 flex items-baseline gap-2">
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      index === 0
                        ? "bg-[var(--steam-accent)]/20 text-[var(--steam-accent)]"
                        : "bg-[var(--steam-panel)] text-[var(--steam-muted)]"
                    }`}
                  >
                    v{entry.version}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--steam-text)]">
                    {entry.title}
                  </h3>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--steam-muted)]">
                  {entry.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}