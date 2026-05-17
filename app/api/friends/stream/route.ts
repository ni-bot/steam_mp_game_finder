import { auth } from "@/auth";
import { sseEncode } from "@/lib/sse";
import { getFriendList, getPlayerSummaries } from "@/lib/steam/client";
import { probeLibraryStatusMapWithProgress } from "@/lib/steam/library-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.steamId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      try {
        send("phase", { phase: "friends" });
        const friends = await getFriendList(session.user.steamId);
        const friendIds = friends.map((f) => f.steamid);

        if (friendIds.length === 0) {
          send("done", { friends: [] });
          return;
        }

        send("total", { total: friendIds.length });
        send("phase", { phase: "profiles" });

        const profiles = await getPlayerSummaries(friendIds);
        const profileMap = new Map(profiles.map((p) => [p.steamid, p]));

        send("phase", { phase: "libraries" });

        const libraryStatusMap = await probeLibraryStatusMapWithProgress(
          friendIds,
          {
            onProgress: ({ steamId, status, loaded, total }) => {
              const profile = profileMap.get(steamId);
              send("progress", {
                loaded,
                total,
                steamid: steamId,
                personaname: profile?.personaname ?? steamId,
                avatarfull: profile?.avatarfull ?? "",
                libraryStatus: status,
              });
            },
          }
        );

        const result = friends.map((f) => {
          const profile = profileMap.get(f.steamid);
          return {
            steamid: f.steamid,
            personaname: profile?.personaname ?? f.steamid,
            avatarfull: profile?.avatarfull ?? "",
            libraryStatus: libraryStatusMap.get(f.steamid) ?? "error",
          };
        });

        result.sort((a, b) => a.personaname.localeCompare(b.personaname));
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
