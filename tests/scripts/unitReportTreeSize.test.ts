// @vitest-environment node
//
// The size of the attached test list, and why it has a hard ceiling.
//
// The list travels from the test job to the Telegram job as a job output. The
// notifier receives it as an ENVIRONMENT VARIABLE, and Linux caps a single
// environment variable at MAX_ARG_STRLEN — 32 pages, 131072 bytes. Past that
// the step does not fail; it never starts:
//
//   An error occurred trying to start process '/usr/bin/bash' with working
//   directory '/home/runner/work/Trydos/Trydos'. Argument list too long
//
// That is what happened on 2026-08-27. The old ceiling was 2,000,000 and was
// reasoned about against the 1MB job-output limit, which is the wrong limit and
// eight times too generous. The real tree reached 134,683 bytes as the suite
// grew and the notification stopped being sent at all.
//
// It is measured in BYTES, not characters. The list is full of ✅ and ❌, three
// bytes each in UTF-8, so a character count reads about a third under the true
// size — which is more than the margin this ceiling has.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

/** Linux MAX_ARG_STRLEN: the most one environment variable may hold when a
 *  process is started. Not a limit this repository chose. */
const ENV_VAR_LIMIT = 32 * 4096;

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts", "unit-report.mjs");

let workspace: string;

/**
 * A vitest json report with `count` passing tests, each with a long enough name
 * that the tree comfortably passes the ceiling. 4000 tests is about twice the
 * real suite — the point is to be over the line, not to be realistic.
 */
const hugeResults = (count: number) => {
  const testResults = [];
  for (let file = 0; file < count / 20; file += 1) {
    testResults.push({
      name: `${ROOT}/tests/generated/suite-${file}.test.ts`,
      status: "passed",
      assertionResults: Array.from({ length: 20 }, (_unused, i) => ({
        ancestorTitles: [`a group of behaviours in file ${file}`],
        title: `does the ${i}th thing this file is responsible for, in full words`,
        status: "passed",
        failureMessages: [],
      })),
    });
  }
  return {
    numTotalTests: count,
    numPassedTests: count,
    numFailedTests: 0,
    numPendingTests: 0,
    testResults,
  };
};

/** Run the reporter against `results` and give back what it wrote for `tree`. */
const treeFrom = (results: unknown): string => {
  writeFileSync(
    path.join(workspace, "test-results.json"),
    JSON.stringify(results),
  );
  const outputFile = path.join(workspace, "github-output.txt");
  writeFileSync(outputFile, "");

  execFileSync(process.execPath, [SCRIPT], {
    cwd: workspace,
    env: { ...process.env, GITHUB_OUTPUT: outputFile },
    stdio: "pipe",
  });

  const written = readFileSync(outputFile, "utf8");
  const match = written.match(/^tree<<TRYDOS_EOF\r?\n([\s\S]*?)\r?\nTRYDOS_EOF\r?$/m);
  if (!match) {
    throw new Error("the reporter wrote no tree output at all");
  }
  return match[1];
};

beforeEach(() => {
  workspace = mkdtempSync(path.join(tmpdir(), "trydos-unit-report-"));
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

describe("the attached test list can always be passed to the notifier", () => {
  it("stays under the environment-variable limit for a suite far larger than this one", () => {
    const tree = treeFrom(hugeResults(4000));
    const bytes = Buffer.byteLength(tree, "utf8");

    expect(
      bytes,
      `the test list came to ${bytes} bytes; over ${ENV_VAR_LIMIT} the Telegram step cannot start at all ("Argument list too long") and no notification is sent`,
    ).toBeLessThanOrEqual(ENV_VAR_LIMIT);
  });

  it("says it was cut rather than ending mid-line", () => {
    // A list that stops without a word is read as "these are all the tests",
    // which is worse than a short list that admits what it left out.
    const tree = treeFrom(hugeResults(4000));

    expect(
      tree,
      "the test list was truncated with no note, so a reader cannot tell it is incomplete",
    ).toContain("cut here");
  });
});

describe("a suite small enough to send whole", () => {
  it("is not cut at all", () => {
    const tree = treeFrom(hugeResults(40));

    expect(
      tree,
      "a small test list was truncated even though it fits",
    ).not.toContain("cut here");
    expect(
      tree,
      "a small test list lost the tests it was supposed to name",
    ).toContain("does the 0th thing this file is responsible for");
  });
});
