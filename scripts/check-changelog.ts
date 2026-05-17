import { execSync } from "node:child_process";
import { CHANGELOG_ENTRIES } from "../lib/changelog/entries";

const CHANGELOG_MAINTENANCE_PATHS = new Set([
  "lib/changelog/entries.ts",
  "lib/changelog/index.ts",
  "lib/changelog/changelog.test.ts",
  "package.json",
  "package-lock.json",
  "scripts/check-changelog.ts",
]);

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

function isShallowRepository(): boolean {
  try {
    return (
      execSync("git rev-parse --is-shallow-repository", {
        encoding: "utf8",
        cwd: process.cwd(),
      }).trim() === "true"
    );
  } catch {
    return false;
  }
}

function changedFiles(commit: string): string[] {
  const out = execSync(`git diff-tree --no-commit-id --name-only -r ${commit}`, {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  return out
    .trim()
    .split("\n")
    .filter(Boolean);
}

function isChangelogMaintenanceCommit(commit: string): boolean {
  const files = changedFiles(commit);
  if (files.length === 0) return false;
  return files.every((file) => CHANGELOG_MAINTENANCE_PATHS.has(file));
}

function expectedVersion(index: number): string {
  return `0.${index + 1}`;
}

function fail(message: string): never {
  console.error(`check:changelog failed:\n${message}`);
  process.exit(1);
}

function validateEntryContent(): void {
  for (let i = 0; i < CHANGELOG_ENTRIES.length; i++) {
    const entry = CHANGELOG_ENTRIES[i];
    const version = expectedVersion(i);

    if (entry.version !== version) {
      fail(
        `Entry ${i + 1}: expected version "${version}", got "${entry.version}".`
      );
    }

    if (!entry.commit?.trim()) {
      fail(`Entry v${entry.version}: missing commit hash.`);
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
}

const entries = CHANGELOG_ENTRIES;
validateEntryContent();

let commits: string[];
try {
  commits = gitCommits();
} catch {
  console.warn(
    "check:changelog: git unavailable; validated entry structure only."
  );
  console.log(
    `check:changelog ok (${entries.length} entries, latest v${entries[entries.length - 1]?.version}).`
  );
  process.exit(0);
}

if (isShallowRepository() && commits.length < entries.length) {
  console.warn(
    `check:changelog: shallow clone (${commits.length} commits, ${entries.length} entries); ` +
      "skipped hash sync (full history checked locally in CI/dev)."
  );
  console.log(
    `check:changelog ok (${entries.length} entries, latest v${entries[entries.length - 1]?.version}).`
  );
  process.exit(0);
}

if (entries.length > commits.length) {
  fail(
    `Found ${entries.length} changelog entries but only ${commits.length} git commits.\n` +
      "Remove extra entries or restore full git history."
  );
}

const extraCommits = commits.slice(entries.length);

if (extraCommits.length > 0) {
  const nonMaintenance = extraCommits.filter(
    (commit) => !isChangelogMaintenanceCommit(commit)
  );
  if (nonMaintenance.length > 0) {
    fail(
      `Git has ${commits.length} commits but changelog has ${entries.length} entries.\n` +
        `Add an entry for: ${nonMaintenance[0]?.slice(0, 7)} (and any newer commits).`
    );
  }
}

for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  const commit = commits[i];

  if (!commit) {
    fail(`Missing git commit at index ${i} for v${entry.version}.`);
  }

  if (entry.commit !== commit) {
    fail(
      `Entry ${i + 1} (v${entry.version}): commit hash mismatch.\n` +
        `  changelog: ${entry.commit}\n` +
        `  git:       ${commit}`
    );
  }
}

const maintenanceNote =
  extraCommits.length > 0
    ? ` (${extraCommits.length} changelog-only commit(s) at HEAD skipped)`
    : "";

console.log(
  `check:changelog ok (${entries.length} entries, latest v${entries[entries.length - 1]?.version})${maintenanceNote}.`
);
