import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { verifySteamCallback } from "@/lib/auth/steam-openid";
import { getPlayerSummaries } from "@/lib/steam/client";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? request.nextUrl.origin;

  try {
    const fullUrl = request.url;
    const steamId = await verifySteamCallback(fullUrl);
    const players = await getPlayerSummaries([steamId]);
    const player = players[0];

    await signIn("steam", {
      steamId,
      name: player?.personaname ?? "Steam User",
      image: player?.avatarfull ?? "",
      redirectTo: `${baseUrl}/de`,
    });
  } catch {
    return NextResponse.redirect(`${baseUrl}/de?error=auth_failed`);
  }
}
