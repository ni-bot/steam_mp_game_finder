import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { compareLibraries } from "@/lib/compare";
import type { SortMode } from "@/lib/steam/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const friendSteamIds = body?.friendSteamIds;

  if (!Array.isArray(friendSteamIds) || friendSteamIds.length === 0) {
    return NextResponse.json({ error: "min_one_friend" }, { status: 400 });
  }

  const multiplayerOnly = body?.multiplayerOnly !== false;
  const sort = (body?.sort as SortMode) ?? "low_playtime";
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
    return NextResponse.json({ error: "min_one_friend" }, { status: 400 });
  }

  try {
    const result = await compareLibraries({
      mySteamId: session.user.steamId,
      friendSteamIds: uniqueFriends,
      multiplayerOnly,
      sort,
      skipCache,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Compare failed:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
