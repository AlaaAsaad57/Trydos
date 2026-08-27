/**
 * The unit suite, described for a chat message.
 * ---------------------------------------------
 * Reads what `pnpm test:ci` leaves behind — `test-results.json` (the json
 * reporter, Jest-shaped) and `coverage/coverage-summary.json` — and writes five
 * values for the Telegram notifier:
 *
 *   totals    one line of counts, e.g. "unit 1041 passed"
 *   coverage  the four percentages
 *   failures  the first few failing test names, with the file they are in
 *   rollup    one line per test file, with a tick or a cross and a count
 *   tree      every describe and every it, indented, ticked or crossed, with
 *             the reason printed under each failing test
 *
 * **The reason a test failed goes in the tree and nowhere else.** The message is
 * a notification — what ran, how much of it passed, which tests broke — and an
 * error message is not that: it is several lines of assertion text per failure,
 * it is what pushes a message past Telegram's 4096-character limit, and it is
 * the part a reader wants next to the test it belongs to, not in a list on its
 * own. So `failures` stays names-only and the tree carries the detail.
 *
 * In CI each one becomes a step output. Run locally with no GITHUB_OUTPUT set it
 * prints them instead, which is how to check a format change without pushing.
 *
 *   node scripts/unit-report.mjs        # or: pnpm test:report
 *
 * **It never fails.** A missing or malformed results file means the suite did
 * not get far enough to write one; that is worth saying, not worth turning a
 * green run red over. The exit code is always 0.
 *
 * Why the tree is a value here and not a file the notifier reads: the notifier
 * is a separate job on a separate machine with no checkout, so a file written
 * here does not exist there. It travels as a job output and is written back out
 * to a file at the far end, just before it is uploaded.
 */

import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RESULTS_FILE = path.join(ROOT, "test-results.json");
const COVERAGE_FILE = path.join(ROOT, "coverage", "coverage-summary.json");

const PASS = "✅";
const FAIL = "❌";
const SKIP = "⏭️";

/** How many failing test names go in the message. The message has a hard
 *  4096-character limit and a wall of names helps nobody — the attached tree
 *  has every one of them, and the run link is there too. */
const MAX_NAMED_FAILURES = 4;

/** How much of the message the per-file rollup may take.
 *
 *  The arithmetic, because Telegram's 4096 is a hard rejection: everything
 *  around the rollup — title, branch, subject, counts, coverage, four named
 *  failures, the link — comes to about 1000 characters in the worst case, and
 *  the notifier's own backstop trips at 3800. That leaves 2600 here, which is
 *  about 65 test files. Files past it are counted on a last line, never silently
 *  dropped, and the attached tree has all of them either way. */
const ROLLUP_BUDGET = 2600;

/** A hard ceiling on the attached tree, in BYTES.
 *
 *  The limit that binds is NOT the 1MB job-output ceiling this used to be
 *  reasoned about. The tree travels to the notifier job as an environment
 *  variable, and Linux caps a single environment variable at MAX_ARG_STRLEN —
 *  32 pages, 131072 bytes. Past that the notifier step does not fail, it never
 *  starts:
 *
 *    An error occurred trying to start process '/usr/bin/bash' … Argument
 *    list too long
 *
 *  which is exactly what happened once the suite grew and the tree reached
 *  134683 bytes. 120000 leaves room for the other variables the step carries
 *  and for the growth between one run and the next.
 *
 *  Bytes, not characters: the tree is full of ✅ and ❌, three bytes each in
 *  UTF-8, so a character count reads about a third under the true size — more
 *  than the margin this ceiling has. */
const TREE_BUDGET_BYTES = 120_000;

/** Cut `text` to at most `maxBytes`, or null when it already fits.
 *
 *  Slicing a JavaScript string by index cuts by UTF-16 code unit, which can
 *  split an emoji in half and leave a lone surrogate. Encoding, cutting and
 *  decoding drops the incomplete character at the end instead. */
const clipToBytes = (text, maxBytes) => {
  const encoded = new TextEncoder().encode(text);
  if (encoded.length <= maxBytes) return null;
  return new TextDecoder("utf-8").decode(encoded.subarray(0, maxBytes));
};

const icon = (status) => {
  if (status === "passed") return PASS;
  if (status === "failed") return FAIL;
  return SKIP; // pending, todo, skipped, and anything a future vitest adds
};

const clip = (line, max) => (line.length > max ? `${line.slice(0, max)}…` : line);

/** Repo-relative, forward slashes, so the same string reads the same on a
 *  Windows machine and on the runner. */
const relative = (file) =>
  path.relative(ROOT, file).split(path.sep).join("/") || file;

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Why a test failed
//
// vitest's json reporter gives `failureMessages`: the error text followed by a
// stack, as one string. All of it is far too much — the stack alone is a dozen
// frames deep inside vitest's own runner — and none of it belongs in the chat
// message. What a reader actually needs beside a crossed-out test is two things:
// what the assertion said, and the line of our code that raised it.
// ---------------------------------------------------------------------------

/** How many lines of the error text to keep. An `toEqual` on an object prints a
 *  small diff, and four lines is enough to hold one; past that it is the same
 *  information again, and the tree has one of these per failing test. */
const MAX_REASON_LINES = 4;

/** Long enough for a real assertion line, short enough that the tree stays
 *  readable when a test compares two long strings. */
const REASON_WIDTH = 160;

const STACK_FRAME = /^at\s/;

/** `at /home/runner/work/trydos/tests/x.test.ts:5:22` → `at tests/x.test.ts:5:22`.
 *
 *  Empty for anything outside the repository — a frame in `node_modules` is a
 *  vitest internal and points at nothing anyone can open. */
const repoFrame = (line) => {
  const location = line
    .replace(/^at\s+/, "")
    .replace(/^.*\((.*)\)$/, "$1")
    .replace(/^file:\/\/\//, "");

  if (location.includes("node_modules")) return "";

  const relativePath = relative(location);
  // path.relative climbs out with "../" for anything above the repository root.
  if (!relativePath || relativePath.startsWith("..")) return "";

  return `at ${relativePath}`;
};

/** The error text and the first frame in our own code, as lines.
 *
 *  Returns an array rather than a string because the caller indents each line
 *  to sit under the test it belongs to. */
const summariseFailure = (messages) => {
  const raw = (messages ?? []).find(
    (message) => typeof message === "string" && message.trim().length > 0,
  );

  if (!raw) return ["no error message recorded"];

  const lines = raw
    // Colour codes: vitest writes them, and Telegram renders them as literal
    // escape characters.
    .replace(/\x1b\[[0-9;]*m/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const text = [];
  let frame = "";

  for (const line of lines) {
    if (!STACK_FRAME.test(line)) {
      if (text.length < MAX_REASON_LINES) text.push(line);
      continue;
    }
    // The first frame that is ours. Later frames are how we got there, which is
    // the run log's job, not this file's.
    if (!frame) frame = repoFrame(line);
  }

  return [...text, frame]
    .filter(Boolean)
    .map((line) => clip(line, REASON_WIDTH));
};

// ---------------------------------------------------------------------------
// Shaping the results
// ---------------------------------------------------------------------------

/** One entry per test file: its path, its counts, and its tests in order.
 *
 *  Order matters twice over. Inside a file the reporter's order is the order the
 *  tests are written in, which is the order someone reading the tree expects.
 *  Between files, failing files come first — a red run must not make anyone
 *  scroll to find out what broke. */
const byFile = (results) =>
  (results.testResults ?? [])
    .map((file) => {
      const tests = (file.assertionResults ?? []).map((test) => ({
        path: test.ancestorTitles ?? [],
        title: test.title ?? "(unnamed test)",
        fullName: test.fullName ?? test.title ?? "(unnamed test)",
        status: test.status ?? "unknown",
        reason:
          test.status === "failed"
            ? summariseFailure(test.failureMessages)
            : [],
      }));

      return {
        file: relative(file.name ?? "(unknown file)"),
        tests,
        passed: tests.filter((t) => t.status === "passed").length,
        failed: tests.filter((t) => t.status === "failed").length,
        skipped: tests.filter(
          (t) => t.status !== "passed" && t.status !== "failed",
        ).length,
      };
    })
    .sort((a, b) => {
      if (Boolean(a.failed) !== Boolean(b.failed)) return a.failed ? -1 : 1;
      return a.file.localeCompare(b.file);
    });

const buildTotals = (results) => {
  const passed = results.numPassedTests ?? 0;
  const failed = results.numFailedTests ?? 0;
  const skipped = (results.numPendingTests ?? 0) + (results.numTodoTests ?? 0);

  return [
    `unit ${passed} passed`,
    failed ? `${failed} failed` : "",
    skipped ? `${skipped} skipped` : "",
  ]
    .filter(Boolean)
    .join(" · ");
};

const buildFailures = (files) => {
  const failed = files.flatMap((entry) =>
    entry.tests
      .filter((test) => test.status === "failed")
      .map((test) => ({ file: entry.file, name: test.fullName })),
  );

  if (failed.length === 0) return "";

  const shown = failed
    .slice(0, MAX_NAMED_FAILURES)
    // Two lines each: where it is, then what it is. The file on its own line is
    // what makes four failures across three files readable on a phone.
    .map((f) => `  • ${f.file}\n      ${clip(f.name, 110)}`);

  if (failed.length > shown.length) {
    shown.push(`  … and ${failed.length - shown.length} more`);
  }

  return shown.join("\n");
};

/** One line per file, ticked or crossed, cut off at a character budget.
 *
 *  Because failing files sort first, the budget can only ever eat into the
 *  passing ones — the thing you came to read is never the thing dropped. */
const buildRollup = (files) => {
  const lines = [];
  let used = 0;
  let dropped = 0;

  for (const entry of files) {
    const total = entry.tests.length;
    const notes = [
      entry.failed ? `${entry.failed} failed` : "",
      entry.skipped ? `${entry.skipped} skipped` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const mark = entry.failed ? FAIL : entry.skipped === total ? SKIP : PASS;
    // The full repo-relative path, not a shortened one. Stripping the leading
    // "tests/" would save six characters a line and make two different files
    // read as siblings: the suite has `utils/functions.test.ts` at the repo root
    // as well as `tests/utils/...`, and shortened they are indistinguishable.
    const line = `${mark} ${entry.file} · ${total}${notes ? ` (${notes})` : ""}`;

    if (used + line.length + 1 > ROLLUP_BUDGET) {
      dropped += 1;
      continue;
    }

    lines.push(line);
    used += line.length + 1;
  }

  if (dropped > 0) {
    lines.push(`… and ${dropped} more file(s) — see the attached list`);
  }

  return lines.join("\n");
};

/** Every describe and every it, nested the way they are written.
 *
 *  This is the whole point of the attachment: a thousand ticks cannot go in a
 *  chat message, but they fit in a file, and a file can be searched. */
const buildTree = (results, files, totals) => {
  const head = [
    "Trydos — unit tests",
    [process.env.GITHUB_REF_NAME, (process.env.GITHUB_SHA ?? "").slice(0, 7)]
      .filter(Boolean)
      .join(" · "),
    totals,
    `${files.length} file(s), ${results.numTotalTests ?? 0} test(s)`,
    "",
    `${PASS} passed    ${FAIL} failed    ${SKIP} skipped`,
  ];

  const body = files.flatMap((entry) => {
    const notes = entry.failed ? ` — ${entry.failed} failed` : "";
    const lines = [
      "",
      "─".repeat(60),
      `${entry.failed ? FAIL : PASS} ${entry.file} — ${entry.tests.length} test(s)${notes}`,
      "─".repeat(60),
    ];

    // A describe heading is printed only when it changes, so a file with one
    // describe and forty its does not repeat itself forty times.
    let open = [];
    for (const test of entry.tests) {
      test.path.forEach((title, depth) => {
        if (open[depth] === title) return;
        lines.push(`${"  ".repeat(depth)}${title}`);
        // Anything nested deeper belonged to the heading just replaced.
        open = [...open.slice(0, depth), title];
      });
      if (open.length > test.path.length) open = open.slice(0, test.path.length);

      const pad = "  ".repeat(test.path.length);
      lines.push(`${pad}${icon(test.status)} ${test.title}`);

      // The reason, directly under the test it belongs to. This is the only
      // place it is written — see the note at the top of this file.
      test.reason.forEach((line, index) => {
        lines.push(`${pad}   ${index === 0 ? "↳ " : "  "}${line}`);
      });
    }

    return lines;
  });

  const text = [...head, ...body, ""].join("\n");
  const clipped = clipToBytes(text, TREE_BUDGET_BYTES);
  return clipped === null
    ? text
    : `${clipped}\n\n[cut here — the list was too long to send]\n`;
};

const buildCoverage = () => {
  const total = readJson(COVERAGE_FILE)?.total;
  if (!total) return "";

  const pct = (metric) => `${(metric?.pct ?? 0).toFixed(1)}%`;
  return (
    `lines ${pct(total.lines)}  stmts ${pct(total.statements)}  ` +
    `funcs ${pct(total.functions)}  branches ${pct(total.branches)}`
  );
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** In CI, a step output. Anywhere else, something readable on a terminal.
 *
 *  The heredoc form of GITHUB_OUTPUT, because every one of these can be several
 *  lines and the `key=value` form silently keeps only the first. */
const emit = (values) => {
  const file = process.env.GITHUB_OUTPUT;

  if (!file) {
    for (const [key, value] of Object.entries(values)) {
      console.log(`\n=== ${key} ===`);
      console.log(value || "(empty)");
    }
    return;
  }

  appendFileSync(
    file,
    Object.entries(values)
      .map(([key, value]) => `${key}<<TRYDOS_EOF\n${value}\nTRYDOS_EOF\n`)
      .join(""),
  );
};

const main = () => {
  const results = readJson(RESULTS_FILE);

  if (!results) {
    // No file means the suite never got as far as producing one. Say so rather
    // than inventing numbers.
    console.log(
      "[unit-report] no readable test-results.json — the suite did not run.",
    );
    emit({ totals: "", coverage: "", failures: "", rollup: "", tree: "" });
    return;
  }

  const files = byFile(results);
  const totals = buildTotals(results);

  emit({
    totals,
    coverage: buildCoverage(),
    failures: buildFailures(files),
    rollup: buildRollup(files),
    tree: buildTree(results, files, totals),
  });

  console.log(`[unit-report] ${totals}`);
};

main();
