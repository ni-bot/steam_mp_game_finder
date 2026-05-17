"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PersonLabel } from "@/components/PersonLabel";
import { SelectableFriendAvatar } from "@/components/SelectableFriendAvatar";
import type { LibraryStatus } from "@/lib/steam/types";

export interface FriendOption {
  steamid: string;
  personaname: string;
  avatarfull: string;
  manual?: boolean;
  libraryStatus?: LibraryStatus;
}

const STORAGE_KEY = "steam-mp-selected-friends";

interface FriendPickerProps {
  friends: FriendOption[];
  manualFriends: FriendOption[];
  onManualFriendsChange: (friends: FriendOption[]) => void;
  selected: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

function FriendRow({
  friend,
  selected,
  onToggle,
  manualLabel,
}: {
  friend: FriendOption;
  selected: Set<string>;
  onToggle: (steamid: string) => void;
  manualLabel: string;
}) {
  const isSelected = selected.has(friend.steamid);

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(friend.steamid)}
      className={[
        "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-150",
        "border-l-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--steam-accent)]",
        isSelected
          ? "border-l-[var(--steam-accent)] bg-[var(--steam-hover)]"
          : "border-l-transparent hover:bg-[var(--steam-hover)]",
      ].join(" ")}
    >
      <SelectableFriendAvatar
        src={friend.avatarfull}
        selected={isSelected}
        size="md"
      />
      <PersonLabel
        name={friend.personaname}
        steamId={friend.steamid}
        className={[
          "min-w-0 flex-1 truncate text-sm",
          isSelected ? "font-medium" : "",
        ].join(" ")}
      />
      {friend.manual && (
        <span className="shrink-0 text-xs text-[var(--steam-muted)]">
          {manualLabel}
        </span>
      )}
    </button>
  );
}

export function FriendPicker({
  friends,
  manualFriends,
  onManualFriendsChange,
  selected,
  onSelectionChange,
}: FriendPickerProps) {
  const t = useTranslations("friends");
  const tErrors = useTranslations("errors");
  const [search, setSearch] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const allFriends = useMemo(() => {
    const map = new Map<string, FriendOption>();
    for (const f of friends) map.set(f.steamid, f);
    for (const f of manualFriends) map.set(f.steamid, f);
    return [...map.values()].sort((a, b) =>
      a.personaname.localeCompare(b.personaname)
    );
  }, [friends, manualFriends]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allFriends;
    return allFriends.filter(
      (f) =>
        f.personaname.toLowerCase().includes(q) ||
        f.steamid.includes(q)
    );
  }, [allFriends, search]);

  const publicLibraryFriends = useMemo(
    () => filtered.filter((f) => f.libraryStatus === "ok"),
    [filtered]
  );

  const privateLibraryFriends = useMemo(
    () => filtered.filter((f) => f.libraryStatus === "private"),
    [filtered]
  );

  const uncheckedLibraryFriends = useMemo(
    () =>
      filtered.filter(
        (f) => f.libraryStatus === "error" || f.libraryStatus === undefined
      ),
    [filtered]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const ids: string[] = JSON.parse(raw);
      if (Array.isArray(ids) && ids.length > 0) {
        onSelectionChange(new Set(ids));
      }
    } catch {
      // ignore
    }
    // Only restore once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
  }, [selected]);

  const toggle = useCallback(
    (steamid: string) => {
      const next = new Set(selected);
      if (next.has(steamid)) next.delete(steamid);
      else next.add(steamid);
      onSelectionChange(next);
    },
    [selected, onSelectionChange]
  );

  const addManual = async () => {
    if (!manualUrl.trim()) return;
    setResolveError(null);
    setResolving(true);
    try {
      const res = await fetch("/api/friends/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveError(
          data.error === "invalid_url"
            ? tErrors("invalidUrl")
            : tErrors("resolveFailed")
        );
        return;
      }
      const friend = data.friend as FriendOption;
      if (!manualFriends.some((f) => f.steamid === friend.steamid)) {
        onManualFriendsChange([...manualFriends, { ...friend, manual: true }]);
      }
      const next = new Set(selected);
      next.add(friend.steamid);
      onSelectionChange(next);
      setManualUrl("");
    } catch {
      setResolveError(tErrors("generic"));
    } finally {
      setResolving(false);
    }
  };

  const canCompare = selected.size >= 1;
  const manySelected = selected.size >= 10;

  return (
    <aside className="flex min-h-0 flex-1 flex-col border-r border-[var(--steam-border)] bg-[var(--steam-bg-dark)]">
      <div className="shrink-0 p-4 pb-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--steam-accent)]">
            {t("title")}
          </h2>
          {selected.size > 0 && (
            <span className="shrink-0 rounded-full bg-[var(--steam-panel)] px-2.5 py-0.5 text-xs font-medium text-[var(--steam-accent)]">
              {t("selected", { count: selected.size })}
            </span>
          )}
        </div>

        <p className="mb-3 text-xs text-[var(--steam-muted)]">{t("privacyHint")}</p>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className="w-full rounded border border-[var(--steam-border)] bg-[var(--steam-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--steam-accent)]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto space-y-3 px-4 pb-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--steam-muted)]">{t("noFriends")}</p>
        ) : (
          <>
            {publicLibraryFriends.length > 0 && (
              <section>
                <h3 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-[var(--steam-muted)]">
                  {t("publicLibraries")}
                </h3>
                <div className="space-y-1">
                  {publicLibraryFriends.map((friend) => (
                    <FriendRow
                      key={friend.steamid}
                      friend={friend}
                      selected={selected}
                      onToggle={toggle}
                      manualLabel={t("manualBadge")}
                    />
                  ))}
                </div>
              </section>
            )}
            {privateLibraryFriends.length > 0 && (
              <section>
                <h3 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-[var(--steam-muted)]">
                  {t("privateLibraries")}
                </h3>
                <div className="space-y-1">
                  {privateLibraryFriends.map((friend) => (
                    <FriendRow
                      key={friend.steamid}
                      friend={friend}
                      selected={selected}
                      onToggle={toggle}
                      manualLabel={t("manualBadge")}
                    />
                  ))}
                </div>
              </section>
            )}
            {uncheckedLibraryFriends.length > 0 && (
              <section>
                <h3 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-[var(--steam-muted)]">
                  {t("uncheckedLibraries")}
                </h3>
                <div className="space-y-1">
                  {uncheckedLibraryFriends.map((friend) => (
                    <FriendRow
                      key={friend.steamid}
                      friend={friend}
                      selected={selected}
                      onToggle={toggle}
                      manualLabel={t("manualBadge")}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--steam-border)] bg-[var(--steam-bg-dark)] p-4">
        <label className="mb-1 block text-xs text-[var(--steam-muted)]">
          {t("manualLabel")}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder={t("manualPlaceholder")}
            className="min-w-0 flex-1 rounded border border-[var(--steam-border)] bg-[var(--steam-bg)] px-2 py-1.5 text-sm outline-none focus:border-[var(--steam-accent)]"
          />
          <button
            type="button"
            onClick={addManual}
            disabled={resolving}
            className="shrink-0 rounded bg-[var(--steam-panel)] px-3 py-1.5 text-sm hover:bg-[var(--steam-hover)] disabled:opacity-50"
          >
            {t("add")}
          </button>
        </div>
        {resolveError && (
          <p className="mt-1 text-xs text-red-400">{resolveError}</p>
        )}
        {!canCompare && (
          <p className="mt-3 text-xs text-amber-400">{t("minOne")}</p>
        )}
        {manySelected && (
          <p className="mt-2 text-xs text-amber-400">{t("manyWarning")}</p>
        )}
      </div>
    </aside>
  );
}
