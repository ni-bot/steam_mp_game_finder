"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PersonLabel } from "@/components/PersonLabel";

const TIP_KEYS = [
  "tip0",
  "tip1",
  "tip2",
  "tip3",
  "tip4",
  "tip5",
  "tip6",
  "tip7",
  "tip8",
  "tip9",
] as const;

export type FriendsLoadPhase =
  | "friends"
  | "profiles"
  | "libraries"
  | "metadata";

export interface FriendsLoadCurrentFriend {
  steamid: string;
  personaname: string;
  avatarfull: string;
}

interface FriendsLoadModalProps {
  phase: FriendsLoadPhase | null;
  total: number;
  loaded: number;
  currentFriend: FriendsLoadCurrentFriend | null;
}

function progressPercent(
  phase: FriendsLoadPhase | null,
  loaded: number,
  total: number
): number {
  if (!phase) return 0;
  if (phase === "friends") return 8;
  if (phase === "profiles") return 18;
  if (phase === "libraries") {
    if (total <= 0) return 50;
    return 18 + (loaded / total) * 32;
  }
  if (phase === "metadata") {
    if (total <= 0) return 100;
    return 50 + (loaded / total) * 50;
  }
  return 100;
}

export function FriendsLoadModal({
  phase,
  total,
  loaded,
  currentFriend,
}: FriendsLoadModalProps) {
  const t = useTranslations("friends.loading");
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIP_KEYS.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, []);

  const percent = progressPercent(phase, loaded, total);
  const tipKey = TIP_KEYS[tipIndex];

  const phaseLabel = useMemo(() => {
    if (phase === "friends") return t("phaseFriends");
    if (phase === "profiles") return t("phaseProfiles");
    if (phase === "libraries") return t("phaseLibraries");
    if (phase === "metadata") return t("phaseMetadata");
    return t("phaseFriends");
  }, [phase, t]);

  const factsLine = useMemo(() => {
    if (phase === "metadata" && total > 0) {
      return t("progressMetadata", { loaded, total });
    }
    if (phase === "libraries" && total > 0) {
      return t("progressLibraries", { loaded, total });
    }
    if (total > 0 && phase === "profiles") {
      return t("progressProfiles", { total });
    }
    return null;
  }, [phase, loaded, total, t]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friends-load-title"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--steam-border)] bg-[var(--steam-bg-dark)] p-6 shadow-xl">
        <h2
          id="friends-load-title"
          className="mb-4 text-center text-lg font-semibold text-[var(--steam-accent)]"
        >
          {t("title")}
        </h2>

        <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--steam-bg)]">
          <div
            className="h-full rounded-full bg-[var(--steam-accent)] transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mb-1 text-center text-xs text-[var(--steam-muted)]">
          {phaseLabel}
          {(phase === "libraries" || phase === "metadata") && total > 0 && (
            <span className="ml-1 tabular-nums">({Math.round(percent)}%)</span>
          )}
        </p>

        {factsLine && (
          <p className="mb-4 text-center text-sm font-medium tabular-nums text-[var(--steam-text)]">
            {factsLine}
          </p>
        )}

        {currentFriend && phase === "libraries" && (
          <div className="mb-4 flex items-center justify-center gap-3 rounded-md bg-[var(--steam-panel)] px-3 py-2">
            {currentFriend.avatarfull ? (
              <img
                src={currentFriend.avatarfull}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--steam-bg)]" />
            )}
            <div className="min-w-0 text-left">
              <p className="text-xs text-[var(--steam-muted)]">
                {t("checkingFriend")}
              </p>
              <PersonLabel
                name={currentFriend.personaname}
                steamId={currentFriend.steamid}
                className="truncate text-sm font-medium"
              />
            </div>
          </div>
        )}

        <p className="min-h-[3rem] text-center text-sm italic text-[var(--steam-muted)]">
          {t(tipKey)}
        </p>
      </div>
    </div>
  );
}
