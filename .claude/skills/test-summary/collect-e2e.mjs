#!/usr/bin/env node
// Gathers the numbers for the **browser** half of a test summary.
//
// It does not run Playwright and it never touches staging. The browser suite
// builds the app and drives real staging, which takes minutes and registers real
// guests, so it is run by hand (`pnpm test:e2e`) and this reads the spec files
// afterwards. What it reports is therefore *what the suite contains*, not the
// result of a run — the skill states that plainly in the summary.
//
// It reads:
//   - every tests/e2e/**/*.spec.ts        the cases the suite has today
//   - docs/testing/E2E_SCENARIOS.md       the cases already written up, and their ids
//   - the newest E2E-SUMMARY-*.md         the hidden index of what the last run listed
//
// and writes into the folder you point it at:
//   - e2e-digest.md        the brief you read
//   - e2e-index-block.txt  the hidden list, to append to the summary you write
//
// Usage:
//   node .claude/skills/test-summary/collect-e2e.mjs <work-folder>

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, sep } from "node:path";

import { latestSummary, nextSummaryName, readIndex, today } from "./summary-files.mjs";

const REPO = process.cwd();
const workDir = process.argv[2];
const E2E_DIR = join(REPO, "tests", "e2e");
const SCENARIOS = join(REPO, "docs", "testing", "E2E_SCENARIOS.md");

if (!workDir) {
  console.error("give me a folder to write e2e-digest.md and e2e-index-block.txt into");
  process.exit(1);
}
if (!existsSync(E2E_DIR)) {
  console.error(`no ${E2E_DIR} — there is no browser suite to summarise`);
  process.exit(1);
}

/** The marker that wraps the hidden list at the bottom of every e2e summary. */
const INDEX_START = "<!-- e2e-index v1 — written by the test-summary skill. Do not edit by hand.";
const INDEX_END = "-->";

const slashes = (p) => p.split(sep).join("/").split("\\").join("/");

// ------------------------------------------------------ reading the spec files

/** Every *.spec.ts under tests/e2e, as paths relative to tests/e2e (what the doc uses). */
function specFiles(dir = E2E_DIR, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === ".artifacts" || entry === "node_modules") continue;
      out.push(...specFiles(full, `${prefix}${entry}/`));
    } else if (/\.spec\.[jt]sx?$/.test(entry)) {
      out.push({ rel: `${prefix}${entry}`, full });
    }
  }
  return out;
}

// A test declaration is `test("title", …)`, and so are its .skip / .only / .fixme
// forms. `test.skip(condition, "reason")` inside a body looks almost the same, so
// the first argument must be a string literal for a line to count as a case.
const TEST_LINE = /^(\s*)test(?:\.(?:skip|only|fixme))?\(\s*(["'`])(.+?)\2\s*,/;
const DESCRIBE_LINE = /^(\s*)test\.describe(?:\.(?:skip|only|serial|parallel|configure))?\(\s*(["'`])(.+?)\2/;

/** Every case in the suite, in file and line order. */
function readCases() {
  const cases = [];
  for (const { rel, full } of specFiles()) {
    const lines = readFileSync(full, "utf8").split(/\r?\n/);
    /** Open describes, as { indent, title } — so a nested one reads "outer > inner". */
    const stack = [];
    lines.forEach((line, i) => {
      const d = DESCRIBE_LINE.exec(line);
      if (d) {
        const indent = d[1].length;
        while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
        stack.push({ indent, title: d[3] });
        return;
      }
      const t = TEST_LINE.exec(line);
      if (!t) return;
      const indent = t[1].length;
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      const suite = stack.map((s) => s.title).join(" > ");
      cases.push({
        file: rel,
        line: i + 1,
        suite,
        title: t[3],
        id: `${rel} :: ${suite ? `${suite} > ` : ""}${t[3]}`,
      });
    });
  }
  return cases;
}

const cases = readCases();

// -------------------------------------------------- reading the scenarios doc

// A row is: | GUEST-01 | Case in plain words | `guest.live.spec.ts:16` | What it proves |
const ROW = /^\|\s*([A-Z][A-Z0-9]*)-(\d+)\s*\|\s*(.+?)\s*\|\s*`?([\w./-]+\.spec\.[jt]sx?):(\d+)`?\s*\|\s*(.+?)\s*\|\s*$/;
const HEADING = /^##\s+(.+?)\s*$/;

/** The documented rows, plus the section each sits under. */
function readScenarios() {
  if (!existsSync(SCENARIOS)) return { rows: [], sections: [] };
  const rows = [];
  const sections = [];
  let section = null;
  for (const line of readFileSync(SCENARIOS, "utf8").split(/\r?\n/)) {
    const h = HEADING.exec(line);
    if (h) {
      section = { title: h[1], prefixes: new Set(), rows: 0 };
      sections.push(section);
      continue;
    }
    const m = ROW.exec(line);
    if (!m) continue;
    const row = {
      prefix: m[1],
      number: Number(m[2]),
      id: `${m[1]}-${m[2]}`,
      case: m[3],
      file: slashes(m[4]),
      line: Number(m[5]),
      proves: m[6],
      section: section?.title ?? "(no section)",
    };
    rows.push(row);
    if (section) {
      section.prefixes.add(row.prefix);
      section.rows += 1;
    }
  }
  return { rows, sections };
}

const { rows: docRows, sections } = readScenarios();

// ----------------------------------------------- what is new since last time

const TODAY = today();
const TARGET = nextSummaryName("E2E-SUMMARY", TODAY);

const prev = latestSummary("E2E-SUMMARY");
let knownIds = prev ? readIndex(prev.body, INDEX_START) : null;

/**
 * Pair the documented rows with the cases that are actually in the files.
 *
 * Only needed on the first run, when no e2e summary carries a hidden index yet:
 * without it every case already written up in E2E_SCENARIOS.md would be reported
 * as new. The recorded line numbers drift as specs are edited, so this does not
 * trust them:
 *
 *   - a file whose row count matches its case count is paired in order — the
 *     ordinary situation, and exact;
 *   - otherwise rows and cases are paired by how much of their wording they
 *     share, best pair first, and whatever is left over is reported.
 */
function pairRowsWithCases() {
  const paired = new Map(); // row id -> case
  const words = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );
  const overlap = (a, b) => {
    const A = words(a);
    const B = words(b);
    if (!A.size || !B.size) return 0;
    let hit = 0;
    for (const w of A) if (B.has(w)) hit += 1;
    return (2 * hit) / (A.size + B.size);
  };

  const byFile = new Map();
  for (const r of docRows) {
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file).push(r);
  }
  for (const [file, rows] of byFile) {
    const mine = cases.filter((c) => c.file === file);
    rows.sort((a, b) => a.line - b.line);
    if (rows.length === mine.length) {
      rows.forEach((r, i) => paired.set(r.id, mine[i]));
      continue;
    }
    const scored = [];
    for (const r of rows) for (const c of mine) scored.push({ r, c, score: overlap(r.case, c.title) });
    scored.sort((x, y) => y.score - x.score);
    const usedRow = new Set();
    const usedCase = new Set();
    for (const { r, c, score } of scored) {
      if (score < 0.3 || usedRow.has(r.id) || usedCase.has(c.id)) continue;
      usedRow.add(r.id);
      usedCase.add(c.id);
      paired.set(r.id, c);
    }
  }
  return paired;
}

const seededFromDoc = knownIds === null;
const pairing = pairRowsWithCases();
if (seededFromDoc) knownIds = new Set([...pairing.values()].map((c) => c.id));

const newCases = cases.filter((c) => !knownIds.has(c.id));
const goneIds = [...knownIds].filter((id) => !cases.some((c) => c.id === id));

/** Rows whose recorded line no longer points at the case they describe. */
const drifted = docRows
  .map((r) => ({ row: r, hit: pairing.get(r.id) }))
  .filter(({ row, hit }) => !hit || hit.line !== row.line);

// -------------------------------------------------------------- id numbering

/** The next free number in every id family the doc already uses. */
const families = new Map();
for (const r of docRows) {
  const f = families.get(r.prefix) ?? { prefix: r.prefix, highest: 0, count: 0 };
  f.highest = Math.max(f.highest, r.number);
  f.count += 1;
  families.set(r.prefix, f);
}
const pad = (n) => String(n).padStart(2, "0");

// --------------------------------------------------------------------- output

const out = [];

out.push("# Digest for the browser (e2e) test summary\n");
out.push(`Write this run to: **docs/testing/summaries/${TARGET}** — that name is free. Never edit an existing summary.\n`);
out.push(
  prev
    ? `Previous e2e summary: **${prev.name}** (${prev.date}, run ${prev.run})${seededFromDoc ? " — it carries no hidden index, so the doc was used instead" : ""}\n`
    : "Previous e2e summary: **none** — what counts as new was worked out from `docs/testing/E2E_SCENARIOS.md`\n",
);

out.push("## The suite\n");
out.push(`- spec files: **${specFiles().length}**`);
out.push(`- cases in the files: **${cases.length}**`);
out.push(`- cases already written up in E2E_SCENARIOS.md: **${docRows.length}**`);
out.push(`- **new cases: ${newCases.length}** <- this is the number of rows the summary needs\n`);
out.push(
  "These are the cases the suite *contains*. This collector does not run the browser suite, so it knows nothing about pass or fail — say so in the summary, and give a result only if the suite was run and you saw the output.\n",
);

out.push("## New cases\n");
if (newCases.length === 0) {
  out.push("No case in the files is missing from E2E_SCENARIOS.md. Nothing to write up.\n");
} else {
  let currentFile = null;
  let currentSuite = null;
  for (const c of newCases) {
    if (c.file !== currentFile) {
      currentFile = c.file;
      currentSuite = null;
      out.push(`\n**${c.file}**`);
    }
    if (c.suite !== currentSuite) {
      currentSuite = c.suite;
      if (c.suite) out.push(`\n_${c.suite}_`);
    }
    out.push(`- \`${c.file}:${c.line}\` — ${c.title}`);
  }
  out.push("");
}

out.push("## Ids to give them\n");
if (families.size === 0) {
  out.push("The doc uses no ids yet. Start a family at `01`.\n");
} else {
  out.push("| Family | Used | Highest | Next free |");
  out.push("|---|---|---|---|");
  for (const f of [...families.values()].sort((a, b) => a.prefix.localeCompare(b.prefix))) {
    out.push(`| ${f.prefix} | ${f.count} | ${f.prefix}-${pad(f.highest)} | **${f.prefix}-${pad(f.highest + 1)}** |`);
  }
  out.push("");
}
if (sections.length) {
  out.push("Sections in E2E_SCENARIOS.md, so a new row goes under the right one:\n");
  for (const s of sections) {
    if (!s.rows) continue;
    out.push(`- **${s.title}** — ${s.rows} rows, ids ${[...s.prefixes].join(", ")}`);
  }
  out.push("");
}

if (drifted.length) {
  out.push("## Line numbers in E2E_SCENARIOS.md that no longer match\n");
  out.push("Recorded when the row was written; the spec has moved since. Report these; do not quietly rewrite them unless asked.\n");
  for (const { row, hit } of drifted) {
    out.push(hit ? `- ${row.id} — doc says \`${row.file}:${row.line}\`, the case is at line **${hit.line}**` : `- ${row.id} — doc says \`${row.file}:${row.line}\`, no case there any more`);
  }
  out.push("");
}

if (goneIds.length) {
  out.push(`## Cases that are no longer in the files — ${goneIds.length}\n`);
  out.push("Renamed, moved, or deleted. Worth a line in the summary if a whole journey went.\n");
  for (const id of goneIds) out.push(`- ${id}`);
  out.push("");
}

writeFileSync(join(workDir, "e2e-digest.md"), out.join("\n"), "utf8");

const index = [INDEX_START, ...cases.map((c) => c.id).sort(), INDEX_END, ""].join("\n");
writeFileSync(join(workDir, "e2e-index-block.txt"), index, "utf8");

console.log(`write to         docs/testing/summaries/${TARGET}`);
console.log(`e2e-digest.md    ${out.length} lines`);
console.log(`index block      ${cases.length} cases`);
console.log(`new cases        ${newCases.length}  <- this is the number of rows the summary needs`);
console.log(`drifted rows     ${drifted.length}`);
