"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PersonLabel } from "@/components/PersonLabel";
import { SelectableFriendAvatar } from "@/components/SelectableFriendAvatar";
import type { FriendOption } from "@/components/FriendPicker";

interface SelectedFriendsBarProps {
  friends: FriendOption[];
  selected: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

export function SelectedFriendsBar({
  friends,
  selected,
  onSelectionChange,
}: SelectedFriendsBarProps) {
  const t = useTranslations("friends");

  const friendMap = useMemo(
    () => new Map(friends.map((f) => [f.steamid, f])),
    [friends]
  );

  const selectedList = useMemo(
    () => [...selected].map((id) => friendMap.get(id) ?? { steamid: id, personaname: id, avatarfull: "" }),
    [selected, friendMap]
  );

  const removeOne = (steamid: string) => {
    const next = new Set(selected);
    next.delete(steamid);
    onSelectionChange(next);
  };

  const resetAll = () => onSelectionChange(new Set());

  return (
    <div
      role="region"
      aria-label={t("selectionBar")}
      className="fixed left-0 right-0 top-[4.75rem] z-30 flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-lg border border-[var(--steam-border)] bg-[var(--steam-bg-dark)]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        {selectedList.length === 0 ? (
          <span className="text-sm text-[var(--steam-muted)]">{t("noneSelected")}</span>
        ) : (
          selectedList.map((friend) => (
            <button
              key={friend.steamid}
              type="button"
              onClick={() => removeOne(friend.steamid)}
              className="flex max-w-xs items-center gap-1.5 rounded-full border border-[var(--steam-accent)]/40 bg-[var(--steam-panel)] px-2 py-1 text-xs transition-colors hover:border-[var(--steam-accent)] hover:bg-[var(--steam-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--steam-accent)]"
              title={t("removeOne")}
            >
              <SelectableFriendAvatar
                src={friend.avatarfull}
                selected
                size="sm"
              />
              <span className="truncate">
                <PersonLabel name={friend.personaname} steamId={friend.steamid} />
              </span>
              <span className="text-[var(--steam-muted)]" aria-hidden>
                ×
              </span>
            </button>
          ))
        )}

        <button
          type="button"
          onClick={resetAll}
          disabled={selected.size === 0}
          className="shrink-0 rounded px-2.5 py-1 text-xs text-[var(--steam-muted)] hover:bg-[var(--steam-hover)] hover:text-[var(--steam-text)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          {t("resetSelection")}
        </button>
      </div>
    </div>
  );
}
