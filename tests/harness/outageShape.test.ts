// @vitest-environment node
//
// When may a staging outage forgive a red browser lane?
//
// The lane asks a health probe again after a failed run. When it answers
// "down", the job used to be forgiven outright. That was too generous, and it
// cost a real morning: on 2026-09-22 the account lane (run 35732331099) failed
// 16 cases beginning at 13:26:51, kept passing cases for twenty more minutes,
// and staging was found down at 13:52:55. The probe said "down", the lane
// reported **success**, and sixteen real failures were never read.
//
// `outageShape` is the second question the verdict now asks. Staging does not
// come back inside one run, so an outage makes a contiguous *tail*: once the
// first case fails, nothing passes again. A pass in between proves staging was
// serving, so the first failure was never about staging.
//
// These cases are the whole contract. `.github/workflows/e2e-lane.yml` reads
// `failures_are_tail` and nothing else.
import { describe, expect, it } from "vitest";

import { outageShape } from "../e2e/harness/outage";

/** One case, at a moment, with an outcome. Minutes are easier to read than
 *  timestamps and the function only compares them. */
const at = (minute: number, status: "passed" | "failed" | "skipped") => ({
  title: `case at ${minute}`,
  ok: status === "passed",
  tests: [
    {
      status,
      results: [
        {
          status,
          startTime: new Date(Date.UTC(2026, 8, 22, 13, minute, 0)).toISOString(),
        },
      ],
    },
  ],
});

const run = (...specs: ReturnType<typeof at>[]) => [{ file: "x.spec.ts", specs }];

describe("outageShape — is a red lane explained by staging going down?", () => {
  it("calls scattered failures NOT an outage, so the lane stays red", () => {
    // The 2026-09-22 shape: it failed, then kept passing for twenty minutes.
    const shape = outageShape(
      run(
        at(26, "failed"),
        at(27, "passed"),
        at(39, "passed"),
        at(52, "failed"),
      ),
    );

    expect(
      shape.isTail,
      "cases passed after the first failure, so staging was serving in between — an outage found at the end must not forgive this run",
    ).toBe(false);
    expect(
      shape.passedAfter,
      "the verdict quotes this number to the reader, so it must be the real count of passes after the first failure",
    ).toBe(2);
  });

  it("calls a contiguous tail of failures an outage, so the lane is forgiven", () => {
    const shape = outageShape(
      run(
        at(10, "passed"),
        at(20, "passed"),
        at(30, "failed"),
        at(40, "failed"),
      ),
    );

    expect(
      shape.isTail,
      "nothing passed after the first failure, which is the shape an outage makes — this run must be forgiven when the probe says staging is down",
    ).toBe(true);
    expect(
      shape.passedAfter,
      "no case passed after the first failure in a tail",
    ).toBe(0);
  });

  it("calls a whole-run failure an outage, so a lane that never reached staging is forgiven", () => {
    const shape = outageShape(run(at(10, "failed"), at(11, "failed")));

    expect(
      shape.isTail,
      "every case failed, so there is no pass to prove staging was ever serving — this is the outage that starts before the suite does",
    ).toBe(true);
  });

  it("never forgives a run it could not measure", () => {
    // No timestamps at all: an older reporter, or a truncated file.
    const shape = outageShape([
      { file: "x.spec.ts", specs: [{ title: "a case", ok: false }] },
    ]);

    expect(
      shape.measured,
      "the results carried no usable timestamps, so the function must say it could not measure rather than guess",
    ).toBe(false);
    expect(
      shape.isTail,
      "an unmeasurable run must never be reported as an outage — the verdict would forgive a red lane on no evidence",
    ).toBe(false);
  });

  it("ignores cases that never ran, so a truncated lane is still judged on what it did", () => {
    // Playwright reports the cases after a serial failure as skipped. Counting
    // one as a "pass after the failure" would call a real outage a code
    // failure, which is the opposite mistake.
    const shape = outageShape(
      run(
        at(10, "passed"),
        at(20, "failed"),
        at(30, "skipped"),
      ),
    );

    expect(
      shape.isTail,
      "the only thing after the failure was a case that never ran, which proves nothing about staging — this must still read as an outage tail",
    ).toBe(true);
  });
});
