#!/usr/bin/env node
// Gathers the numbers for a test summary. It does the counting; a person (or the
// agent running the `test-summary` skill) still writes the plain-English part.
//
// It reads two files the test run leaves behind:
//   - the run result   (vitest --reporter=json --outputFile=…)
//   - the coverage totals (vitest --coverage.reporter=json-summary)
//
// and writes two files into the folder you point it at:
//   - digest.md       a short, readable brief of the run — read this one
//   - index-block.txt the hidden list of every test, to paste at the end of the
//                     summary so the *next* run can tell what is new
//
// Usage:
//   node .claude/skills/test-summary/collect.mjs <work-folder> [results.json]
//
// Nothing here talks to the network, and it changes no file in the app.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const REPO = process.cwd();
const workDir = process.argv[2];
const resultsPath = process.argv[3] ?? join(workDir ?? "", "vitest-results.json");
const SUMMARY_DIR = join(REPO, "docs", "testing", "summaries");

if (!workDir) {
  console.error("give me a folder to write digest.md and index-block.txt into");
  process.exit(1);
}

// The marker that wraps the hidden list at the bottom of every summary. It is an
// HTML comment, so a reader never sees it, but the next run can find it.
const INDEX_START = "<!-- test-index v1 — written by the test-summary skill. Do not edit by hand.";
const INDEX_END = "-->";

/**
 * Turn any path the tools hand back into a repo-relative one with / separators.
 *
 * The two tools disagree on Windows: the run result uses forward slashes, the
 * coverage report uses backslashes. Both are compared with slashes here, or the
 * repo prefix never matches and every path stays absolute.
 */
const slashes = (p) => p.split(sep).join("/").split("\\").join("/");
const REPO_SLASHED = slashes(REPO);

function tidyPath(p) {
  const s = slashes(p);
  return (s.startsWith(REPO_SLASHED) ? s.slice(REPO_SLASHED.length) : s).replace(/^\//, "").replace(/^\.\//, "");
}

/** The area of the app a file belongs to, for the coverage rollup. */
function areaOf(file) {
  if (file === "proxy.ts") return "proxy.ts (every request)";
  const top = file.split("/")[0];
  const names = {
    app: "app — pages and API routes",
    components: "components — the screens people see",
    hooks: "hooks",
    scaling: "scaling",
    serverActions: "serverActions",
    serverRequests: "serverRequests — talking to the backends",
    services: "services — the business rules",
    store: "store — what the app remembers",
    utils: "utils — shared helpers",
  };
  return names[top] ?? top;
}

// ---------------------------------------------------------------- the test run

const run = JSON.parse(readFileSync(resultsPath, "utf8"));

/** Every test, as { id, file, suite, title, status }. `id` is what we compare on. */
const tests = [];
for (const file of run.testResults ?? []) {
  const path = tidyPath(file.name);
  for (const t of file.assertionResults ?? []) {
    const suite = (t.ancestorTitles ?? []).join(" > ");
    tests.push({
      id: `${path} :: ${t.fullName}`,
      file: path,
      suite,
      title: t.title,
      status: t.status,
    });
  }
}

const failed = tests.filter((t) => t.status === "failed");
const skipped = tests.filter((t) => t.status !== "passed" && t.status !== "failed");

// ------------------------------------------- what is new since the last summary

/** Today, as YYYY-MM-DD, so a second run on the same day replaces the first. */
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * The newest summary already written, or null on the very first run.
 *
 * Today's own file is left out on purpose. Running the skill twice in one day
 * writes the same filename, so counting it as "the previous run" would report no
 * new tests and blank the day's summary.
 */
function previousSummary() {
  if (!existsSync(SUMMARY_DIR)) return null;
  const files = readdirSync(SUMMARY_DIR)
    .filter((f) => /^TEST-SUMMARY-\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .filter((f) => f.slice(13, 23) !== TODAY)
    .sort();
  if (files.length === 0) return null;
  const name = files[files.length - 1];
  return { name, date: name.slice(13, 23), body: readFileSync(join(SUMMARY_DIR, name), "utf8") };
}

const prev = previousSummary();
let knownIds = null;
if (prev) {
  const start = prev.body.indexOf(INDEX_START);
  if (start !== -1) {
    const end = prev.body.indexOf(INDEX_END, start);
    knownIds = new Set(
      prev.body
        .slice(start + INDEX_START.length, end === -1 ? undefined : end)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    );
  }
}

const isFirstRun = knownIds === null;
const newTests = isFirstRun ? tests : tests.filter((t) => !knownIds.has(t.id));
const goneIds = isFirstRun ? [] : [...knownIds].filter((id) => !tests.some((t) => t.id === id));

// ------------------------------------------------------------------- coverage

const coveragePath = join(REPO, "coverage", "coverage-summary.json");
if (!existsSync(coveragePath)) {
  console.error("no coverage/coverage-summary.json — rerun with --coverage.reporter=json-summary");
  process.exit(1);
}
const cov = JSON.parse(readFileSync(coveragePath, "utf8"));
const total = cov.total;

/** Every app file in the coverage report, keyed by its name without the extension. */
const covStems = new Map();
for (const abs of Object.keys(cov)) {
  if (abs === "total") continue;
  const file = tidyPath(abs);
  covStems.set(file.replace(/\.[jt]sx?$/, ""), file);
}

/**
 * The app file each test file checks, or null when it checks the test kit itself
 * (the fixtures, the stand-ins, the render helper). Both layouts are handled:
 *   utils/functions.test.ts                    -> utils/functions.tsx
 *   tests/utils/cookies/cookie-manager.test.ts -> utils/cookies/cookie-manager.ts
 */
const sourceOfTestFile = new Map();
for (const t of tests) {
  if (sourceOfTestFile.has(t.file)) continue;
  const stem = t.file.replace(/\.(test|spec)\.[jt]sx?$/, "").replace(/^tests\//, "");
  sourceOfTestFile.set(t.file, covStems.get(stem) ?? null);
}

/** Files that own a test file, so their cover is deliberate rather than accidental. */
const testedFiles = new Set([...sourceOfTestFile.values()].filter(Boolean));

const fileRows = [];
for (const [abs, data] of Object.entries(cov)) {
  if (abs === "total") continue;
  const file = tidyPath(abs);
  fileRows.push({
    file,
    area: areaOf(file),
    pct: data.lines.pct,
    lines: data.lines.total,
    own: testedFiles.has(file),
  });
}

const withOwnTest = fileRows.filter((f) => f.own).sort((a, b) => b.pct - a.pct);
const incidental = fileRows.filter((f) => !f.own && f.pct > 0);
const untouched = fileRows.filter((f) => f.pct === 0);

/** Coverage per area, weighted by lines, so the rollup matches the headline. */
const areas = new Map();
for (const f of fileRows) {
  const a = areas.get(f.area) ?? { area: f.area, files: 0, withTest: 0, lines: 0, covered: 0 };
  a.files += 1;
  if (f.own) a.withTest += 1;
  a.lines += f.lines;
  a.covered += (f.lines * f.pct) / 100;
  areas.set(f.area, a);
}

// --------------------------------------------------------------------- output

const pct = (n) => `${n.toFixed(1)}%`;
const out = [];

out.push("# Digest for the test summary\n");
out.push(
  prev
    ? `Previous summary: **${prev.name}** (${prev.date})${knownIds ? "" : " — it carries no hidden index, so every test below counts as new"}\n`
    : "Previous summary: **none — this is the first run**\n",
);

out.push("## The run\n");
out.push(`- test files: **${run.testResults?.length ?? 0}**`);
out.push(`- tests: **${tests.length}** — ${tests.length - failed.length - skipped.length} passed, ${failed.length} failed, ${skipped.length} skipped`);
out.push(`- result: **${failed.length === 0 ? "everything passed" : "SOME TESTS FAILED"}**\n`);

if (failed.length) {
  out.push("### Failing tests — the summary must say so plainly\n");
  for (const t of failed) out.push(`- \`${t.file}\` — ${t.suite} > ${t.title}`);
  out.push("");
}

// Tests that check the test kit — the sample data, the stand-ins, the render
// helper — are counted but never listed. They protect the other tests, not the
// app, and a reader of the summary has no use for them.
const newAppTests = newTests.filter((t) => sourceOfTestFile.get(t.file));
const newKitTests = newTests.filter((t) => !sourceOfTestFile.get(t.file));

out.push(`## New tests since the last summary — ${newAppTests.length}\n`);
out.push(
  `Plus **${newKitTests.length}** new checks on the testing tools themselves. Those are counted here and nowhere else — **do not list them in the summary**.\n`,
);
if (newAppTests.length === 0) {
  out.push("No new test of the app itself since the last summary.\n");
} else {
  let currentFile = null;
  let currentSuite = null;
  for (const t of newAppTests) {
    if (t.file !== currentFile) {
      currentFile = t.file;
      currentSuite = null;
      out.push(`\n**${t.file}** — checks \`${sourceOfTestFile.get(t.file)}\``);
    }
    if (t.suite !== currentSuite) {
      currentSuite = t.suite;
      if (t.suite) out.push(`\n_${t.suite}_`);
    }
    out.push(`- ${t.title}`);
  }
  out.push("");
}

if (goneIds.length) {
  out.push(`## Tests that are no longer there — ${goneIds.length}\n`);
  out.push("Renamed, moved, or deleted. Worth a line in the summary if a whole area vanished.\n");
  for (const id of goneIds.slice(0, 40)) out.push(`- ${id}`);
  if (goneIds.length > 40) out.push(`- …and ${goneIds.length - 40} more`);
  out.push("");
}

out.push("## Coverage of the whole app\n");
out.push("| Measure | Covered | Total | Share |");
out.push("|---|---|---|---|");
for (const [label, key] of [["Lines", "lines"], ["Branches", "branches"], ["Functions", "functions"]]) {
  out.push(`| ${label} | ${total[key].covered} | ${total[key].total} | ${pct(total[key].pct)} |`);
}
out.push("");
out.push(`- app files in the coverage report: **${fileRows.length}**`);
out.push(`- files that have a test of their own: **${withOwnTest.length}**`);
out.push(`- files touched only because a tested file imports them: **${incidental.length}** (not deliberately checked)`);
out.push(`- files with nothing at all: **${untouched.length}**\n`);

out.push("### By area\n");
out.push("| Area | Files | With own test | Lines covered |");
out.push("|---|---|---|---|");
for (const a of [...areas.values()].sort((x, y) => y.lines - x.lines)) {
  out.push(`| ${a.area} | ${a.files} | ${a.withTest} | ${pct(a.lines ? (a.covered / a.lines) * 100 : 0)} |`);
}
out.push("");

out.push("### The files we set out to test\n");
out.push("| File | Lines covered |");
out.push("|---|---|");
for (const f of withOwnTest) out.push(`| ${f.file} | ${pct(f.pct)} |`);
out.push("");

writeFileSync(join(workDir, "digest.md"), out.join("\n"), "utf8");

const index = [INDEX_START, ...tests.map((t) => t.id).sort(), INDEX_END, ""].join("\n");
writeFileSync(join(workDir, "index-block.txt"), index, "utf8");

console.log(`digest.md        ${out.length} lines`);
console.log(`index-block.txt  ${tests.length} tests`);
console.log(`new app tests    ${newAppTests.length}  <- this is the number of bullets the summary needs`);
console.log(`new kit tests    ${newKitTests.length}  (counted, never listed)`);
console.log(`failing tests    ${failed.length}`);
console.log(`line coverage    ${pct(total.lines.pct)}`);
