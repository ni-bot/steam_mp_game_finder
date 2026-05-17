"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { FriendPicker, type FriendOption } from "@/components/FriendPicker";
import { SelectedFriendsBar } from "@/components/SelectedFriendsBar";
import { ResultsPanel } from "@/components/ResultsPanel";
import { sortGames } from "@/lib/compare/sort";
import type { CompareResponse, MatchMode, SortMode } from "@/lib/steam/types";

export function AppShell() {
  const { data: session, status } = useSession();
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tErrors = useTranslations("errors");

  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [manualFriends, setManualFriends] = useState<FriendOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allFriends = useMemo(() => {
    const map = new Map<string, FriendOption>();
    for (const f of friends) map.set(f.steamid, f);
    for (const f of manualFriends) map.set(f.steamid, f);
    return [...map.values()];
  }, [friends, manualFriends]);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [multiplayerOnly, setMultiplayerOnly] = useState(true);
  const [matchMode, setMatchMode] = useState<MatchMode>("strict");
  const [buyerFilterSteamId, setBuyerFilterSteamId] = useState<string | null>(
    null
  );
  const [sort, setSort] = useState<SortMode>("low_playtime");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoadingFriends(true);
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        if (data.friends) setFriends(data.friends);
      })
      .catch(() => setError(tErrors("generic")))
      .finally(() => setLoadingFriends(false));
  }, [status, tErrors]);

  const runCompare = useCallback(
    async (skipCache = false) => {
      if (selected.size < 1) return;

      setLoadingCompare(true);
      setError(null);

      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            friendSteamIds: [...selected],
            multiplayerOnly,
            matchMode,
            skipCache,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(tErrors("generic"));
          return;
        }

        const compare = data as CompareResponse;
        setResult({
          ...compare,
          games: sortGames(compare.games, sort),
        });
      } catch {
        setError(tErrors("generic"));
      } finally {
        setLoadingCompare(false);
      }
    },
    [selected, multiplayerOnly, matchMode, sort, tErrors]
  );

  const handleRefresh = useCallback(async () => {
    const steamIds = session?.user?.steamId
      ? [session.user.steamId, ...selected]
      : [...selected];

    await fetch("/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamIds }),
    });

    await runCompare(true);
  }, [session?.user?.steamId, selected, runCompare]);

  const handleSortChange = useCallback((mode: SortMode) => {
    setSort(mode);
    setResult((prev) =>
      prev ? { ...prev, games: sortGames(prev.games, mode) } : null
    );
  }, []);

  useEffect(() => {
    if (matchMode === "near") {
      setBuyerFilterSteamId(null);
    }
  }, [matchMode]);

  useEffect(() => {
    if (!result || selected.size < 1) return;
    runCompare(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplayerOnly, matchMode]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--steam-muted)]">…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header
        onRefresh={session ? handleRefresh : undefined}
        showRefresh={!!session && !!result}
        onCompare={session ? () => runCompare(false) : undefined}
        showCompare={!!session}
        compareDisabled={selected.size < 1}
        compareLoading={loadingCompare}
      />

      {!session ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <p className="max-w-md text-center text-lg text-[var(--steam-muted)]">
            {t("signInPrompt")}
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/steam";
            }}
            className="rounded bg-[var(--steam-btn-primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--steam-btn-primary-hover)]"
          >
            {tNav("signIn")}
          </button>
        </div>
      ) : (
        <>
          <SelectedFriendsBar
            friends={allFriends}
            selected={selected}
            onSelectionChange={setSelected}
          />
          <div className="flex min-h-0 flex-1 overflow-hidden pt-14">
          <div className="flex h-full w-full max-w-sm shrink-0 flex-col overflow-hidden">
            {loadingFriends && (
              <p className="shrink-0 p-4 text-sm text-[var(--steam-muted)]">…</p>
            )}
            <FriendPicker
              friends={friends}
              manualFriends={manualFriends}
              onManualFriendsChange={setManualFriends}
              selected={selected}
              onSelectionChange={setSelected}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {error && (
              <p className="shrink-0 p-4 text-sm text-red-400">{error}</p>
            )}
            <ResultsPanel
              result={result}
              multiplayerOnly={multiplayerOnly}
              onMultiplayerOnlyChange={setMultiplayerOnly}
              matchMode={matchMode}
              onMatchModeChange={setMatchMode}
              buyerFilterSteamId={buyerFilterSteamId}
              onBuyerFilterChange={setBuyerFilterSteamId}
              sort={sort}
              onSortChange={handleSortChange}
              loading={loadingCompare}
            />
          </div>
        </div>
        </>
      )}
    </div>
  );
}
