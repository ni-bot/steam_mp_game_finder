import { describe, expect, it } from "vitest";
import { collectPairwiseAppIds } from "@/lib/steam/prewarm";
import type { OwnedGamesPayload } from "@/lib/steam/types";

function payload(appIds: number[]): OwnedGamesPayload {
  return {
    games: appIds.map((appid) => ({
      appid,
      playtime_forever: 0,
    })),
    lastUpdated: "2026-01-01T00:00:00.000Z",
  };
}

describe("collectPairwiseAppIds", () => {
  it("returns empty when fewer than two libraries", () => {
    expect(collectPairwiseAppIds([payload([1, 2])])).toEqual([]);
    expect(collectPairwiseAppIds([])).toEqual([]);
  });

  it("includes appids owned by at least two friends", () => {
    const result = collectPairwiseAppIds([
      payload([1, 2, 3]),
      payload([2, 3, 4]),
    ]);
    expect(result.sort((a, b) => a - b)).toEqual([2, 3]);
  });

  it("excludes appids owned by only one friend", () => {
    const result = collectPairwiseAppIds([
      payload([1, 2]),
      payload([3, 4]),
    ]);
    expect(result).toEqual([]);
  });

  it("counts each friend only once per appid", () => {
    const result = collectPairwiseAppIds([
      payload([1, 1, 1]),
      payload([1, 2]),
    ]);
    expect(result).toEqual([1]);
  });
});
