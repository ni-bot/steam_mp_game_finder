import { execSync } from "node:child_process";
import { CHANGELOG_ENTRIES } from "../lib/changelog/entries";

function gitCommits(): string[] {
  const out = execSync("git log --format=%H --reverse", {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  return out
    .trim()
    .split("\n")
    .filter(Boolean);
}

function expectedVersion(index: number): string {
  return `0.${index + 1}`;
}

function fail(message: string): never {
  console.error(`check:changelog failed:\n${message}`);
  process.exit(1);
}

const commits = gitCommits();
const entries = CHANGELOG_ENTRIES;

if (entries.length !== commits.length) {
  fail(
    `Expected ${commits.length} changelog entries, found ${entries.length}.\n` +
      "Add or remove entries in lib/changelog/entries.ts to match git history."
  );
}

for (let i = 0; i < commits.length; i++) {
  const entry = entries[i];
  const commit = commits[i];
  const version = expectedVersion(i);

  if (!entry) {
    fail(`Missing changelog entry at index ${i} (commit ${commit.slice(0, 7)}).`);
  }

  if (entry.version !== version) {
    fail(
      `Entry ${i + 1}: expected version "${version}", got "${entry.version}".`
    );
  }

  if (entry.commit !== commit) {
    fail(
      `Entry ${i + 1} (v${entry.version}): commit hash mismatch.\n` +
        `  changelog: ${entry.commit}\n` +
        `  git:       ${commit}`
    );
  }

  for (const lang of ["de", "en"] as const) {
    if (!entry.title[lang]?.trim()) {
      fail(`Entry v${entry.version}: missing title.${lang}.`);
    }
    if (entry.bullets[lang].length === 0) {
      fail(`Entry v${entry.version}: bullets.${lang} is empty.`);
    }
  }
}

console.log(
  `check:changelog ok (${entries.length} entries, latest v${entries[entries.length - 1]?.version}).`
);
