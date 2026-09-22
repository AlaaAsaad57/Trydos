// @vitest-environment node
//
// The QA seed's image upload, and why it asks again.
//
// The seed is a **setup project**. When it throws, every case in the account
// lane is reported as "did not run" — and a case that never ran reports
// nothing at all, which is the worst outcome this suite has. That happened
// twice on 2026-09-22, in runs 35706254979 and 35694726437, both times for a
// single 503 from the media store:
//
//     the app would not issue an upload ticket (503)
//
// 11 passed, 2 failed, 61 never ran. Then again: 12 passed, 1 failed, 60 never
// ran. One transient refusal, two whole lanes lost.
//
// So the upload asks again — but only about refusals a second attempt can
// help. This file is that line. `uploadShopImage` itself needs a browser and
// belongs to the live suite; the decision does not, so it is proved here, in
// the suite that gates every pull request.
import { describe, expect, it } from "vitest";

import {
  UPLOAD_RETRY_WAITS_MS,
  worthRetrying,
} from "../e2e/harness/sellerDashboard";

describe("worthRetrying — which media-store refusal is worth asking again", () => {
  it("asks again about a 503, the refusal that cost two account lanes", () => {
    expect(
      worthRetrying(503),
      "a 503 is the media store being unwell, not a wrong request — the seed must ask again rather than take down the whole account lane",
    ).toBe(true);
  });

  it("asks again about any other 5xx, and about being told to wait", () => {
    expect(worthRetrying(500), "a 500 is the store's own fault").toBe(true);
    expect(worthRetrying(502), "a 502 is a gateway with no healthy store behind it").toBe(true);
    expect(worthRetrying(504), "a 504 is the store not answering in time").toBe(true);
    expect(worthRetrying(429), "a 429 is the store asking us to wait, which is exactly what a retry does").toBe(true);
  });

  it("asks again when no answer arrived at all", () => {
    expect(
      worthRetrying(0),
      "0 means the request never got an answer — a dropped connection is the most retryable refusal there is",
    ).toBe(true);
  });

  it("never asks again about a refused credential", () => {
    expect(
      worthRetrying(401),
      "a 401 means the upload ticket or the media key is wrong, and asking three times turns an instant clear failure into a slow one with the same message",
    ).toBe(false);
    expect(
      worthRetrying(403),
      "a 403 means this account may not upload, which a retry cannot change",
    ).toBe(false);
  });

  it("never asks again about a request the store refused on its content", () => {
    expect(
      worthRetrying(400),
      "a 400 means the form this suite built is wrong — retrying hides a bug in the harness behind a slow failure",
    ).toBe(false);
    expect(
      worthRetrying(404),
      "a 404 means the upload address is wrong, which is the same request every time",
    ).toBe(false);
    expect(
      worthRetrying(413),
      "a 413 means the file is too big, and it will be the same size on the second attempt",
    ).toBe(false);
  });

  it("gives the store real time to recover, and bounds the wait", () => {
    expect(
      UPLOAD_RETRY_WAITS_MS.length,
      "two retries: enough for a store that is restarting, few enough that a genuinely dead store fails the seed in seconds rather than minutes",
    ).toBe(2);

    expect(
      UPLOAD_RETRY_WAITS_MS.every((wait) => wait >= 1_000),
      "an immediate retry hits the same unhealthy store and proves nothing",
    ).toBe(true);

    const total = UPLOAD_RETRY_WAITS_MS.reduce((sum, wait) => sum + wait, 0);
    expect(
      total,
      `the whole retry budget is ${total}ms; the seed runs before every account-lane case, so it may not spend a minute waiting`,
    ).toBeLessThanOrEqual(30_000);
  });
});
