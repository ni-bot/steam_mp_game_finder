import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  invalidateAllAppMeta,
  invalidateOwnedGames,
} from "@/lib/steam/client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const steamIds: string[] = Array.isArray(body?.steamIds)
    ? body.steamIds
    : [session.user.steamId];

  const allIds = new Set([
    session.user.steamId,
    ...steamIds.filter((id): id is string => typeof id === "string"),
  ]);

  await Promise.all([
    ...[...allIds].map((id) => invalidateOwnedGames(id)),
    invalidateAllAppMeta(),
  ]);

  return NextResponse.json({ ok: true });
}
