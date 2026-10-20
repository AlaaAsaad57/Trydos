// @vitest-environment node
//
// When a case that placed a real order is failed for leaving it behind.
//
// BUY-01 used to end with `expect(orders.swept()).toEqual([])` in its own body.
// That check could never fail: the `orders` fixture fills `swept` in its
// teardown, and a fixture's teardown runs after the test body — so the body
// always read an empty list, even on a run where the net later had to cancel a
// live order. The judgement now happens in the teardown itself, after the sweep,
// through `strandedOrderFailure`. This file pins that decision.
import { describe, expect, it } from "vitest";

import {
  strandedOrderFailure,
  type CleanupOutcome,
} from "../e2e/harness/orderCleanup";

const swept = (groupId: string, extra: Partial<CleanupOutcome> = {}): CleanupOutcome => ({
  groupId,
  packs: 1,
  cancelled: 1,
  skipped: 0,
  ...extra,
});

describe("a case judged after the order net has run", () => {
  it("fails a passed case whose order the net had to cancel, naming the order", () => {
    const failure = strandedOrderFailure("passed", [swept("SA123")]);

    expect(
      failure,
      "a passed case left a live order for the net, and nothing failed it",
    ).not.toBeNull();
    expect(
      failure,
      "the failure does not name the order the net had to cancel",
    ).toContain("order SA123");
    expect(
      failure,
      "the failure does not say the net cancelled the order",
    ).toContain("1 cancelled by the net");
  });

  it("names every order the net acted on, with the net's own problem", () => {
    const failure = strandedOrderFailure("passed", [
      swept("SA1"),
      swept("SA2", {
        cancelled: 0,
        problem: "the backend did not list the packs of this order (status 0)",
      }),
    ]);

    expect(failure, "the first swept order is missing from the failure").toContain("order SA1");
    expect(failure, "the second swept order is missing from the failure").toContain("order SA2");
    expect(
      failure,
      "the net's own problem with an order is missing from the failure",
    ).toContain("did not list the packs of this order");
  });

  it("leaves a passed case alone when the net had nothing to do", () => {
    expect(strandedOrderFailure("passed", [])).toBeNull();
  });

  it("never replaces the error of a case that already failed", () => {
    expect(
      strandedOrderFailure("failed", [swept("SA123")]),
      "a failed case's own error would be replaced by the net's report",
    ).toBeNull();
    expect(
      strandedOrderFailure("timedOut", [swept("SA123")]),
      "a timed-out case's own error would be replaced by the net's report",
    ).toBeNull();
  });
});
