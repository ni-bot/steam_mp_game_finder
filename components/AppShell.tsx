"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { FriendPicker, type FriendOption } from "@/components/FriendPicker";
import {
  FriendsLoadModal,
  type FriendsLoadCurrentFriend,
  type FriendsLoadPhase,
} from "@/components/FriendsLoadModal";
import { SelectedFriendsBar } from "@/components/SelectedFriendsBar";
import { ResultsPanel } from "@/components/ResultsPanel";
import { sortGames } from "@/lib/compare/sort";
import { consumeSseStream } from "@/lib/sse-parse";
import type {
  CompareGameResult,
  CompareResponse,
  MatchMode,
  SortMode,
} from "@/lib/steam/types";

function mergeGameUpdate(
  prev: CompareResponse,
  game: CompareGameResult,
  sort: SortMode
): CompareResponse {
  const games = [...prev.games];
  const idx = games.findIndex((g) => g.appid === game.appid);
  if (idx >= 0) games[idx] = game;
  else games.push(game);
  return { ...prev, games: sortGames(games, sort) };
}

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
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadPhase, setLoadPhase] = useState<FriendsLoadPhase | null>(null);
  const [loadTotal, setLoadTotal] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadCurrentFriend, setLoadCurrentFriend] =
    useState<FriendsLoadCurrentFriend | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const friendsStreamRef = useRef<EventSource | null>(null);
  const compareAbortRef = useRef<AbortController | null>(null);
  const friendsStreamGeneration = useRef(0);
  const friendsLoadDoneRef = useRef<(() => void) | null>(null);

  const connectFriendsStream = useCallback(
    (options?: { onDone?: () => void }) => {
      friendsStreamGeneration.current += 1;
      const generation = friendsStreamGeneration.current;

      friendsStreamRef.current?.close();
      friendsStreamRef.current = null;

      setLoadingFriends(true);
      setLoadPhase("friends");
      setLoadTotal(0);
      setLoadProgress(0);
      setLoadCurrentFriend(null);
      setError(null);

      const es = new EventSource("/api/friends/stream");
      friendsStreamRef.current = es;
      let completed = false;

      const finish = () => {
        if (generation !== friendsStreamGeneration.current) return;
        options?.onDone?.();
      };

      es.addEventListener("phase", (e) => {
        const data = JSON.parse(e.data) as { phase: FriendsLoadPhase };
        setLoadPhase(data.phase);
        if (data.phase === "metadata") {
          setLoadCurrentFriend(null);
        }
      });

      es.addEventListener("total", (e) => {
        const data = JSON.parse(e.data) as { total: number };
        setLoadTotal(data.total);
      });

      es.addEventListener("metadata_total", (e) => {
        const data = JSON.parse(e.data) as { total: number };
        setLoadTotal(data.total);
        setLoadProgress(0);
      });

      es.addEventListener("progress", (e) => {
        const data = JSON.parse(e.data) as {
          kind?: string;
          loaded: number;
          total: number;
          steamid?: string;
          personaname?: string;
          avatarfull?: string;
        };
        setLoadProgress(data.loaded);
        setLoadTotal(data.total);

        if (data.kind === "metadata" || !data.steamid) {
          setLoadCurrentFriend(null);
          return;
        }

        setLoadCurrentFriend({
          steamid: data.steamid,
          personaname: data.personaname ?? data.steamid,
          avatarfull: data.avatarfull ?? "",
        });
      });

      es.addEventListener("done", (e) => {
        if (generation !== friendsStreamGeneration.current) return;
        completed = true;
        const data = JSON.parse(e.data) as { friends: FriendOption[] };
        setFriends(data.friends ?? []);
        setLoadingFriends(false);
        setLoadPhase(null);
        es.close();
        friendsStreamRef.current = null;
        finish();
      });

      es.addEventListener("failed", () => {
        if (generation !== friendsStreamGeneration.current) return;
        completed = true;
        setError(tErrors("generic"));
        setLoadingFriends(false);
        setLoadPhase(null);
        es.close();
        friendsStreamRef.current = null;
        finish();
      });

      es.onerror = () => {
        if (generation !== friendsStreamGeneration.current) return;
        if (completed || friendsStreamRef.current !== es) return;
        completed = true;
        setError(tErrors("generic"));
        setLoadingFriends(false);
        setLoadPhase(null);
        es.close();
        friendsStreamRef.current = null;
        finish();
      };
    },
    [tErrors]
  );

  useEffect(() => {
    if (status !== "authenticated") return;

    connectFriendsStream();
    return () => {
      friendsStreamRef.current?.close();
      friendsStreamRef.current = null;
    };
  }, [status, connectFriendsStream]);

  const runCompare = useCallback(
    async (skipCache = false) => {
      if (selected.size < 1) return;

      compareAbortRef.current?.abort();
      const abort = new AbortController();
      compareAbortRef.current = abort;

      setLoadingCompare(true);
      setError(null);

      try {
        const res = await fetch("/api/compare/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            friendSteamIds: [...selected],
            multiplayerOnly,
            matchMode,
            sort,
            skipCache,
          }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          setError(tErrors("generic"));
          return;
        }

        let gotResult = false;

        await consumeSseStream(res.body, (event, data) => {
          if (event === "result") {
            const compare = data as CompareResponse;
            gotResult = true;
            setSelectedTags(new Set());
            setResult({
              ...compare,
              games: sortGames(compare.games, sort),
            });
          } else if (event === "game_update") {
            const { game } = data as { game: CompareGameResult };
            setResult((prev) =>
              prev ? mergeGameUpdate(prev, game, sort) : prev
            );
          } else if (event === "failed") {
            setError(tErrors("generic"));
          }
        });

        if (!gotResult) {
          setError(tErrors("generic"));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(tErrors("generic"));
      } finally {
        if (compareAbortRef.current === abort) {
          setLoadingCompare(false);
          compareAbortRef.current = null;
        }
      }
    },
    [selected, multiplayerOnly, matchMode, sort, tErrors]
  );

  const handleRefresh = useCallback(async () => {
    await fetch("/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        steamIds: session?.user?.steamId
          ? [session.user.steamId, ...selected]
          : [...selected],
      }),
    });

    await new Promise<void>((resolve) => {
      friendsLoadDoneRef.current = resolve;
      connectFriendsStream({ onDone: () => friendsLoadDoneRef.current?.() });
    });
    friendsLoadDoneRef.current = null;

    if (selected.size >= 1) {
      await runCompare(true);
    }
  }, [session?.user?.steamId, selected, connectFriendsStream, runCompare]);

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

      {loadingFriends && (
        <FriendsLoadModal
          phase={loadPhase}
          total={loadTotal}
          loaded={loadProgress}
          currentFriend={loadCurrentFriend}
        />
      )}

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
                selectedTags={selectedTags}
                onSelectedTagsChange={setSelectedTags}
                loading={loadingCompare}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
