"use client";

import { useLocale, useTranslations } from "next-intl";
import { GameCard } from "@/components/GameCard";
import { FriendStatusBadge } from "@/components/FriendStatusBadge";
import type { CompareResponse, MatchMode, SortMode } from "@/lib/steam/types";

interface ResultsPanelProps {
  result: CompareResponse | null;
  multiplayerOnly: boolean;
  onMultiplayerOnlyChange: (value: boolean) => void;
  matchMode: MatchMode;
  onMatchModeChange: (value: MatchMode) => void;
  sort: SortMode;
  onSortChange: (value: SortMode) => void;
  loading?: boolean;
}

function formatTime(iso: string | undefined, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale);
}

export function ResultsPanel({
  result,
  multiplayerOnly,
  onMultiplayerOnlyChange,
  matchMode,
  onMatchModeChange,
  sort,
  onSortChange,
  loading,
}: ResultsPanelProps) {
  const t = useTranslations("results");
  const locale = useLocale();

  return (
    <main className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h2 className="text-lg font-semibold text-[var(--steam-accent)]">
          {t("title")}
        </h2>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={multiplayerOnly}
            onChange={(e) => onMultiplayerOnlyChange(e.target.checked)}
            className="accent-[var(--steam-accent)]"
          />
          {multiplayerOnly ? t("multiplayerOnly") : t("showAll")}
        </label>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={
              matchMode === "strict"
                ? "text-[#c7d5e0]"
                : "text-[var(--steam-muted)]"
            }
          >
            {t("matchStrict")}
          </span>
          <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              role="switch"
              aria-checked={matchMode === "near"}
              checked={matchMode === "near"}
              onChange={(e) =>
                onMatchModeChange(e.target.checked ? "near" : "strict")
              }
              className="peer sr-only"
            />
            <span
              className="absolute inset-0 rounded-full border border-[var(--steam-border)] bg-[var(--steam-panel)] transition-colors peer-checked:border-[var(--steam-accent)] peer-checked:bg-[var(--steam-accent)]/25 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--steam-accent)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--steam-bg-dark)]"
              aria-hidden
            />
            <span
              className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[#8f98a0] shadow transition-transform peer-checked:translate-x-5 peer-checked:bg-[var(--steam-accent)]"
              aria-hidden
            />
          </label>
          <span
            className={
              matchMode === "near"
                ? "text-[#c7d5e0]"
                : "text-[var(--steam-muted)]"
            }
          >
            {t("matchNear")}
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--steam-muted)]">
          {t("sort")}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortMode)}
            className="rounded border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] px-2 py-1 text-[#c7d5e0]"
          >
            <option value="low_playtime">{t("sortLowPlaytime")}</option>
            <option value="high_playtime">{t("sortHighPlaytime")}</option>
            <option value="alpha">{t("sortAlpha")}</option>
            <option value="recent">{t("sortRecent")}</option>
          </select>
        </label>
      </div>

      {matchMode === "near" && (
        <p className="mb-4 text-sm text-[var(--steam-muted)]">
          {t("matchNearHint")}
        </p>
      )}

      {result?.participants && result.participants.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {result.participants.map((p) => (
            <div
              key={p.steamId}
              className="flex items-center gap-2 rounded border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] px-3 py-2 text-sm"
            >
              {p.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatarUrl} alt="" className="h-6 w-6 rounded" />
              )}
              <span>{p.displayName}</span>
              <FriendStatusBadge status={p.status} />
              {p.lastUpdated && (
                <span className="text-xs text-[var(--steam-muted)]">
                  {t("lastUpdated", {
                    time: formatTime(p.lastUpdated, locale),
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-[var(--steam-muted)]">Loading…</p>
      )}

      {!loading && result && result.games.length === 0 && (
        <div className="rounded border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] p-8 text-center">
          <p className="text-lg">{t("empty")}</p>
          <p className="mt-2 text-sm text-[var(--steam-muted)]">{t("emptyHint")}</p>
        </div>
      )}

      {!loading && result && result.games.length > 0 && (
        <div className="grid gap-4 overflow-y-auto md:grid-cols-1 lg:grid-cols-2">
          {result.games.map((game) => (
            <GameCard
              key={game.appid}
              game={game}
              participants={result.participants
                .filter((p) => p.status === "ok")
                .map((p) => ({
                  steamId: p.steamId,
                  displayName: p.displayName,
                }))}
            />
          ))}
        </div>
      )}
    </main>
  );
}
