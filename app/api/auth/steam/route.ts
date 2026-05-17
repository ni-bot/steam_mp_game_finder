import { NextResponse } from "next/server";
import { getSteamLoginUrl } from "@/lib/auth/steam-openid";

export async function GET() {
  const url = await getSteamLoginUrl();
  return NextResponse.redirect(url);
}
