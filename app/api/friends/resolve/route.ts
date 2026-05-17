import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlayerSummaries, resolveVanityUrl } from "@/lib/steam/client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const url = body?.url;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const steamId = await resolveVanityUrl(url);
  if (!steamId) {
    return NextResponse.json({ error: "resolve_failed" }, { status: 404 });
  }

  if (steamId === session.user.steamId) {
    return NextResponse.json({ error: "self" }, { status: 400 });
  }

  const profiles = await getPlayerSummaries([steamId]);
  const profile = profiles[0];

  return NextResponse.json({
    friend: {
      steamid: steamId,
      personaname: profile?.personaname ?? steamId,
      avatarfull: profile?.avatarfull ?? "",
      manual: true,
    },
  });
}
