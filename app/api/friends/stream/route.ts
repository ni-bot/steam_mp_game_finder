import { auth } from "@/auth";
import { sseEncode } from "@/lib/sse";
import {
  collectPairwiseAppIds,
  prewarmAppDetails,
} from "@/lib/steam/prewarm";
import {
  fetchOwnedGames,
  getFriendList,
  getOwnedGames,
  getPlayerSummaries,
} from "@/lib/steam/client";
import { probeLibraryStatusMapWithProgress } from "@/lib/steam/library-status";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const session = await auth();
  if (!session?.user?.steamId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const mySteamId = session.user.steamId;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      try {
        send("phase", { phase: "friends" });
        const friends = await getFriendList(mySteamId);
        const friendIds = friends.map((f) => f.steamid);

        send("phase", { phase: "profiles" });
        const profiles =
          friendIds.length > 0
            ? await getPlayerSummaries(friendIds)
            : [];
        const profileMap = new Map(profiles.map((p) => [p.steamid, p]));

        if (friendIds.length > 0) {
          send("total", { total: friendIds.length });
        }

        send("phase", { phase: "libraries" });

        const [, libraryStatusMap] = await Promise.all([
          fetchOwnedGames(mySteamId),
          friendIds.length > 0
            ? probeLibraryStatusMapWithProgress(friendIds, {
                onProgress: ({ steamId, status, loaded, total }) => {
                  const profile = profileMap.get(steamId);
                  send("progress", {
                    kind: "library",
                    loaded,
                    total,
                    steamid: steamId,
                    personaname: profile?.personaname ?? steamId,
                    avatarfull: profile?.avatarfull ?? "",
                    libraryStatus: status,
                  });
                },
              })
            : Promise.resolve(new Map<string, "ok" | "private" | "error">()),
        ]);

        const result =
          friendIds.length === 0
            ? []
            : friends.map((f) => {
                const profile = profileMap.get(f.steamid);
                return {
                  steamid: f.steamid,
                  personaname: profile?.personaname ?? f.steamid,
                  avatarfull: profile?.avatarfull ?? "",
                  libraryStatus:
                    libraryStatusMap.get(f.steamid) ?? "error",
                };
              });

        result.sort((a, b) => a.personaname.localeCompare(b.personaname));

        const okFriendIds = friendIds.filter(
          (id) => libraryStatusMap.get(id) === "ok"
        );
        const friendPayloads = await Promise.all(
          okFriendIds.map((id) => getOwnedGames(id))
        );
        const pairwiseAppIds = collectPairwiseAppIds(
          friendPayloads.filter((p): p is NonNullable<typeof p> => p !== null)
        );

        if (pairwiseAppIds.length > 0) {
          send("phase", { phase: "metadata" });
          send("metadata_total", { total: pairwiseAppIds.length });

          await prewarmAppDetails(pairwiseAppIds, {
            onProgress: ({ loaded, total, appId }) => {
              send("progress", {
                kind: "metadata",
                loaded,
                total,
                appId,
              });
            },
          });
        }

        send("done", { friends: result });
      } catch (error) {
        console.error("Friends stream failed:", error);
        send("failed", { code: "generic" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
