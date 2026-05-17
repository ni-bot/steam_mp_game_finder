import { describe, expect, it } from "vitest";
import {
  steamStoreLanguage,
  storeAppUrl,
  storeWidgetUrl,
} from "./store-url";

describe("store-url", () => {
  it("maps de to german and others to english", () => {
    expect(steamStoreLanguage("de")).toBe("german");
    expect(steamStoreLanguage("en")).toBe("english");
    expect(steamStoreLanguage("fr")).toBe("english");
  });

  it("builds locale-aware app and widget URLs", () => {
    expect(storeAppUrl(570, "de")).toBe(
      "https://store.steampowered.com/app/570?l=german"
    );
    expect(storeWidgetUrl(570, "en")).toBe(
      "https://store.steampowered.com/widget/570?l=english"
    );
  });
});
