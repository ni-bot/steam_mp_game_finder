import { describe, expect, it } from "vitest";
import { CHANGELOG_ENTRIES, getChangelogForLocale } from "./index";

describe("changelog", () => {
  it("has 26 entries with versions 0.1 through 0.26", () => {
    expect(CHANGELOG_ENTRIES).toHaveLength(26);
    expect(CHANGELOG_ENTRIES[0]?.version).toBe("0.1");
    expect(CHANGELOG_ENTRIES[25]?.version).toBe("0.26");
  });

  it("returns entries newest first with localized text", () => {
    const de = getChangelogForLocale("de");
    expect(de).toHaveLength(26);
    expect(de[0]?.version).toBe("0.26");
    expect(de[0]?.title.length).toBeGreaterThan(0);
    expect(de[0]?.bullets.length).toBeGreaterThan(0);

    const en = getChangelogForLocale("en");
    expect(en[0]?.title).not.toBe(de[0]?.title);
  });

  it("falls back to English for unknown locales", () => {
    const entries = getChangelogForLocale("fr");
    expect(entries[0]?.title).toBe(
      CHANGELOG_ENTRIES[CHANGELOG_ENTRIES.length - 1]?.title.en
    );
  });
});
