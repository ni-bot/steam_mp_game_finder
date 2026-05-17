import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPublicProfile } from "@/lib/display/person-label";
import { getFriendList, getPlayerSummaries } from "@/lib/steam/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.steamId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const steamId = session.user.steamId;
  const friends = await getFriendList(steamId);
  const friendIds = friends.map((f) => f.steamid);

  if (friendIds.length === 0) {
    return NextResponse.json({ friends: [] });
  }

  const profiles = await getPlayerSummaries(friendIds);
  const profileMap = new Map(profiles.map((p) => [p.steamid, p]));

  const result = friends.map((f) => {
    const profile = profileMap.get(f.steamid);
    return {
      steamid: f.steamid,
      personaname: profile?.personaname ?? f.steamid,
      avatarfull: profile?.avatarfull ?? "",
      profilePrivate: profile
        ? !isPublicProfile(profile.communityvisibilitystate)
        : true,
    };
  });

  result.sort((a, b) => a.personaname.localeCompare(b.personaname));

  return NextResponse.json({ friends: result });
}
