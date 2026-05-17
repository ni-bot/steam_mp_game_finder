import openid from "openid";

const STEAM_OPENID_REALM = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export function getSteamOpenId(): openid.RelyingParty {
  return new openid.RelyingParty(
    `${STEAM_OPENID_REALM}/api/auth/steam/callback`,
    STEAM_OPENID_REALM,
    true,
    false,
    []
  );
}

export function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(
    /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/
  );
  return match?.[1] ?? null;
}

export function getSteamLoginUrl(): Promise<string> {
  const relyingParty = getSteamOpenId();
  return new Promise((resolve, reject) => {
    relyingParty.authenticate(
      "https://steamcommunity.com/openid/login",
      false,
      (error, authUrl) => {
        if (error) reject(error);
        else if (!authUrl) reject(new Error("No auth URL returned"));
        else resolve(authUrl);
      }
    );
  });
}

export function verifySteamCallback(url: string): Promise<string> {
  const relyingParty = getSteamOpenId();
  return new Promise((resolve, reject) => {
    relyingParty.verifyAssertion(url, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      if (!result?.authenticated || !result.claimedIdentifier) {
        reject(new Error("Steam authentication failed"));
        return;
      }
      const steamId = extractSteamId(result.claimedIdentifier);
      if (!steamId) {
        reject(new Error("Could not extract Steam ID"));
        return;
      }
      resolve(steamId);
    });
  });
}
