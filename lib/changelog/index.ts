import { CHANGELOG_ENTRIES, type ChangelogEntry } from "./entries";

export type { ChangelogEntry };
export { CHANGELOG_ENTRIES };

export type ChangelogLocale = "de" | "en";

export type LocalizedChangelogEntry = {
  version: string;
  title: string;
  bullets: string[];
};

export function getChangelogForLocale(
  locale: string
): LocalizedChangelogEntry[] {
  const lang: ChangelogLocale = locale === "de" ? "de" : "en";

  return [...CHANGELOG_ENTRIES]
    .reverse()
    .map((entry) => ({
      version: entry.version,
      title: entry.title[lang],
      bullets: entry.bullets[lang],
    }));
}

export const LATEST_CHANGELOG_VERSION =
  CHANGELOG_ENTRIES[CHANGELOG_ENTRIES.length - 1]?.version ?? "0.1";
