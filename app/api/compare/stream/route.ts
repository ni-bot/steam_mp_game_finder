import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { compareLibrariesStream } from "@/lib/compare";
import { sseEncode } from "@/lib/sse";
import type { MatchMode, SortMode } from "@/lib/steam/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.steamId) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const friendSteamIds = body?.friendSteamIds;

  if (!Array.isArray(friendSteamIds) || friendSteamIds.length === 0) {
    return new Response(JSON.stringify({ error: "min_one_friend" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const multiplayerOnly = body?.multiplayerOnly !== false;
  const sort = (body?.sort as SortMode) ?? "low_playtime";
  const matchMode: MatchMode =
    body?.matchMode === "near" ? "near" : "strict";
  const skipCache = body?.skipCache === true;

  const uniqueFriends = [
    ...new Set(
      friendSteamIds.filter(
        (id: unknown): id is string =>
          typeof id === "string" && id !== session.user.steamId
      )
    ),
  ];

  if (uniqueFriends.length === 0) {
    return new Response(JSON.stringify({ error: "min_one_friend" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      try {
        await compareLibrariesStream(
          {
            mySteamId: session.user.steamId,
            friendSteamIds: uniqueFriends,
            multiplayerOnly,
            sort,
            matchMode,
            skipCache,
          },
          send
        );
      } catch (error) {
        console.error("Compare stream failed:", error);
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
