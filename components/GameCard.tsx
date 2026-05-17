"use client";

import { useTranslations } from "next-intl";
import { PersonLabel } from "@/components/PersonLabel";
import type { CompareGameResult } from "@/lib/steam/types";

interface GameCardProps {
  game: CompareGameResult;
  participants: { steamId: string; name: string }[];
}

function formatPlaytime(minutes: number, t: ReturnType<typeof useTranslations>) {
  if (minutes <= 0) return t("neverPlayed");
  if (minutes < 60) return t("playtimeMinutes", { minutes });
  return t("playtime", { hours: Math.round(minutes / 60) });
}

export function GameCard({ game, participants }: GameCardProps) {
  const t = useTranslations("results");

  return (
    <article className="flex gap-4 rounded border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] p-4 hover:border-[var(--steam-accent)] transition-colors">
      {game.headerImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.headerImage}
          alt=""
          className="h-[69px] w-[184px] shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-[69px] w-[184px] shrink-0 items-center justify-center rounded bg-[var(--steam-panel)] text-xs text-[var(--steam-muted)]">
          ?
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-medium text-white">{game.name}</h3>

        {game.multiplayerTags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {game.multiplayerTags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-[var(--steam-panel)] px-2 py-0.5 text-xs text-[var(--steam-accent)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 space-y-1 text-sm text-[var(--steam-muted)]">
          {participants.map((p) => {
            const doesNotOwn = game.missingOwners.includes(p.steamId);
            return (
              <div
                key={p.steamId}
                className={
                  doesNotOwn
                    ? "flex justify-between gap-4 rounded border-l-2 border-amber-500/80 bg-amber-500/10 px-2 py-1 text-amber-200"
                    : "flex justify-between gap-4"
                }
              >
                <PersonLabel
                  name={p.name}
                  steamId={p.steamId}
                  className="truncate"
                />
                <span className="shrink-0">
                  {doesNotOwn
                    ? t("doesNotOwn")
                    : formatPlaytime(game.playtimes[p.steamId] ?? 0, t)}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between gap-4 border-t border-[var(--steam-border)] pt-1 font-medium text-[var(--steam-accent)]">
            <span>{t("combined")}</span>
            <span>{formatPlaytime(game.combinedPlaytime, t)}</span>
          </div>
        </div>

        <a
          href={game.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-[var(--steam-accent)] hover:underline"
        >
          {t("storeLink")} →
        </a>
      </div>
    </article>
  );
}
