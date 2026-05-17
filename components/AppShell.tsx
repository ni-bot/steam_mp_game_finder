"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { FriendPicker, type FriendOption } from "@/components/FriendPicker";
import { ResultsPanel } from "@/components/ResultsPanel";
import type { CompareResponse, SortMode } from "@/lib/steam/types";

export function AppShell() {
  const { data: session, status } = useSession();
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tErrors = useTranslations("errors");

  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [multiplayerOnly, setMultiplayerOnly] = useState(true);
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
            sort,
            skipCache,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(tErrors("generic"));
          return;
        }

        setResult(data as CompareResponse);
      } catch {
        setError(tErrors("generic"));
      } finally {
        setLoadingCompare(false);
      }
    },
    [selected, multiplayerOnly, sort, tErrors]
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

  useEffect(() => {
    if (!result || selected.size < 1) return;
    runCompare(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplayerOnly, sort]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--steam-muted)]">…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onRefresh={session ? handleRefresh : undefined}
        showRefresh={!!session && !!result}
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
            className="rounded bg-[#5c7e10] px-6 py-3 font-medium text-white hover:bg-[#6a8f12] transition-colors"
          >
            {tNav("signIn")}
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="w-full max-w-sm shrink-0">
            {loadingFriends && (
              <p className="p-4 text-sm text-[var(--steam-muted)]">…</p>
            )}
            <FriendPicker
              friends={friends}
              selected={selected}
              onSelectionChange={setSelected}
              onCompare={() => runCompare(false)}
              loading={loadingCompare}
            />
          </div>

          <div className="min-w-0 flex-1">
            {error && (
              <p className="p-4 text-sm text-red-400">{error}</p>
            )}
            <ResultsPanel
              result={result}
              multiplayerOnly={multiplayerOnly}
              onMultiplayerOnlyChange={setMultiplayerOnly}
              sort={sort}
              onSortChange={setSort}
              loading={loadingCompare}
            />
          </div>
        </div>
      )}
    </div>
  );
}
