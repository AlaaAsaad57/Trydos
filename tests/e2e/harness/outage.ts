// Did staging going down explain these failures?
//
// Its own module, and not part of `cli.ts`, for one reason: `cli.ts` runs
// `main()` the moment it is loaded, so a unit test importing it would execute
// a command. The rule below is the one thing in that file worth testing on its
// own, so it lives here and `tests/harness/outageShape.test.ts` covers it.

/** Just enough of the Playwright JSON reporter's shape to answer the question.
 *  Declared structurally so `cli.ts` can pass its own richer types straight in. */
export type TimedSuite = {
  title?: string;
  file?: string;
  specs?: {
    title?: string;
    ok?: boolean;
    tests?: {
      status?: string;
      results?: {
        status?: string;
        /** ISO timestamp. Written by the JSON reporter for every attempt, and
         *  the only ordering there is -- the suites are nested by file, not by
         *  the order the cases ran in. */
        startTime?: string;
      }[];
    }[];
  }[];
  suites?: TimedSuite[];
};

/** One case's outcome, reduced to the two things the question needs. */
type RunPoint = { startedAt: number; passed: boolean };

// ---------------------------------------------------------------------------
// Why the shape of the failures is the signal
//
// The lane asks the health probe again after a failed run. When it answered
// "down" the job used to be forgiven outright, and that was too generous: a
// probe at the end of a 35-minute lane says nothing about minute four. On
// 2026-09-22 the account lane failed 16 cases starting at 13:26:51, staging was
// found down at 13:52:55 -- 26 minutes later -- and the whole lane reported
// success. Sixteen real failures were hidden behind one late outage.
//
// **The shape of the failures is the signal, not the clock.** An outage that
// explains a failure explains every case after it too, because staging does not
// come back inside one run. So the failures form a contiguous *tail*: once the
// first one fails, nothing passes again.
//
// If cases kept passing after the first failure, then staging was serving in
// between, and the first failure was never about staging. That is a code
// failure, whatever the probe says at the end.
//
// No time window is needed, and that is the point -- a window would have to
// guess when the outage started, and guessing wrong in the generous direction
// is exactly the bug this replaces.
// ---------------------------------------------------------------------------

/** Every attempt in the run, flattened, with when it started and whether it
 *  passed. Skipped cases are left out: a case that never ran is evidence of
 *  nothing, and counting one as a "pass after the failure" would report a real
 *  outage as a code failure. */
const collectRunPoints = (suites: TimedSuite[] = []): RunPoint[] =>
  suites.flatMap((suite) => [
    ...(suite.specs ?? []).flatMap((spec) =>
      (spec.tests ?? []).flatMap((test) =>
        (test.results ?? [])
          .filter(
            (result) =>
              result.startTime !== undefined &&
              result.status !== undefined &&
              result.status !== "skipped",
          )
          .map((result) => ({
            startedAt: Date.parse(result.startTime as string),
            passed: result.status === "passed",
          }))
          .filter((point) => Number.isFinite(point.startedAt)),
      ),
    ),
    ...collectRunPoints(suite.suites),
  ]);

export type OutageShape = {
  /** True when nothing passed after the first failure started. */
  isTail: boolean;
  /** How many cases passed after the first failure started. The number is the
   *  whole argument, so it goes in the message. */
  passedAfter: number;
  /** False when the results carried no usable timestamps at all, in which case
   *  `isTail` means nothing and the caller must not trust it. */
  measured: boolean;
};

/** Are the failures a contiguous tail, as an outage would make them? */
export const outageShape = (suites: TimedSuite[] = []): OutageShape => {
  const points = collectRunPoints(suites);
  const failures = points.filter((point) => !point.passed);

  // Nothing failed, or nothing was timed. Either way there is no tail to judge,
  // and the caller falls back to treating the run as a code failure.
  if (points.length === 0 || failures.length === 0) {
    return { isTail: false, passedAfter: 0, measured: points.length > 0 };
  }

  const firstFailureAt = Math.min(...failures.map((point) => point.startedAt));
  const passedAfter = points.filter(
    (point) => point.passed && point.startedAt > firstFailureAt,
  ).length;

  return { isTail: passedAfter === 0, passedAfter, measured: true };
};
