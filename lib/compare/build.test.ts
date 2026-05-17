import { describe, expect, it } from "vitest";
import {
  buildCompareGame,
  buildPlaytimeMap,
  intersectAppIds,
} from "@/lib/compare/build";
import type { PersonLibrary } from "@/lib/steam/types";

function library(
  steamId: string,
  appIds: number[],
  status: PersonLibrary["status"] = "ok"
): PersonLibrary {
  return {
    steamId,
    status,
    games: appIds.map((appid) => ({ appid, playtime_forever: 10 })),
  };
}

describe("intersectAppIds", () => {
  it("returns intersection across ok libraries", () => {
    const ids = intersectAppIds([
      library("a", [1, 2, 3]),
      library("b", [2, 3, 4]),
    ]);
    expect([...ids].sort((a, b) => a - b)).toEqual([2, 3]);
  });

  it("excludes private libraries from intersection", () => {
    const ids = intersectAppIds([
      library("a", [1, 2]),
      library("b", [2, 3], "private"),
    ]);
    expect([...ids].sort((a, b) => a - b)).toEqual([1, 2]);
  });
});

describe("buildCompareGame", () => {
  const libraries = [library("me", [42]), library("friend", [42])];
  const playtimeMap = buildPlaytimeMap(libraries);

  it("returns null for multiplayerOnly when meta is missing", () => {
    const game = buildCompareGame(42, libraries, playtimeMap, null, {
      multiplayerOnly: true,
      matchMode: "strict",
      nearMap: null,
    });
    expect(game).toBeNull();
  });

  it("builds game from cached meta without store fields when not multiplayerOnly", () => {
    const game = buildCompareGame(42, libraries, playtimeMap, null, {
      multiplayerOnly: false,
      matchMode: "strict",
      nearMap: null,
    });
    expect(game?.appid).toBe(42);
    expect(game?.name).toBeTruthy();
  });
});
