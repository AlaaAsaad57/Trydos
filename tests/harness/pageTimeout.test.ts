// @vitest-environment node
//
// A page that did not open in time, and what the case says about it.
//
// `page.goto: Timeout 45000ms exceeded` names nothing. CI runs 36403714599 and
// 36416474747 printed it eighteen times for two different faults:
//
//   * the app's own server waiting on its cache store, with every backend
//     healthy (AUTH-02, CMT-01, CMT-09, PROF-07, QA-01, QA-02, QA-02b, QA-06,
//     QA-09a, in both runs);
//   * the core backend answering 522 for forty seconds (SST-01).
//
// Nobody could tell the two apart from the failure. So a page that times out
// now asks staging once, at that moment, and says which of the two it was.
import { describe, expect, it } from "vitest";

import { pageTimeoutReason } from "../e2e/harness/pageOpen";

describe("pageTimeoutReason", () => {
  it("names the backend that was not serving", () => {
    expect(
      pageTimeoutReason({
        path: "/sy-en/sellerProfile/sellerDashboard/34",
        seconds: 45,
        health: {
          up: false,
          skipped: false,
          reason: "the core backend answered 522",
          timings: "search 700ms, gateway 600ms, core backend 19476ms",
        },
      }),
    ).toBe(
      "the page /sy-en/sellerProfile/sellerDashboard/34 did not open within 45 seconds, and staging was not serving at that moment: the core backend answered 522 (search 700ms, gateway 600ms, core backend 19476ms). This is a backend fault, not a fault in the page",
    );
  });

  it("points at the app's own server when every backend answered", () => {
    expect(
      pageTimeoutReason({
        path: "/",
        seconds: 45,
        health: {
          up: true,
          skipped: false,
          reason: "",
          timings: "search 736ms, gateway 559ms, core backend 713ms",
        },
      }),
    ).toBe(
      "the page / did not open within 45 seconds, while every backend answered when asked at that moment (search 736ms, gateway 559ms, core backend 713ms). So the wait was inside the app's own server. Read this run's server log at this time for a call that never came back: `[ioredis]` is the cache store, `Filling a cache during prerender timed out` is a cached read",
    );
  });

  it("says so when no backend could be asked", () => {
    expect(
      pageTimeoutReason({
        path: "/",
        seconds: 45,
        health: { up: true, skipped: true, reason: "", timings: "" },
      }),
    ).toBe(
      "the page / did not open within 45 seconds. No backend could be asked why: neither the search backend nor a storefront backend is configured on this machine",
    );
  });

  it("leaves the query string out, because it can carry a one-time code", () => {
    expect(
      pageTimeoutReason({
        path: "/sy-en/products/a?otp=123456",
        seconds: 45,
        health: { up: true, skipped: true, reason: "", timings: "" },
      }),
    ).not.toContain("123456");
  });
});
