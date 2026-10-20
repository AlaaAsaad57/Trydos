// Open a page, and say what was wrong when it does not open in time.
//
// ---------------------------------------------------------------------------
// Why this exists
//
// `page.goto: Timeout 45000ms exceeded` names nothing, and this suite has met
// it for two faults that have nothing in common:
//
//   * **The app's own server was waiting.** CI runs 36403714599 and
//     36416474747: the connection to the cache store had died without a reset,
//     the client waited for an answer with no limit, and every page that reads
//     the store hung. Nine cases failed in each run, the same nine, with every
//     backend healthy.
//   * **A backend was not serving.** Run 36403714599, SST-01: the core backend
//     answered 522 for forty seconds, and the page's own server-side calls
//     waited with it.
//
// The lane asks staging again after a failed run (`Re-check staging`), but that
// is an hour later and a forty-second fault is long gone. So the question is
// asked here, once, at the moment the page failed to open.
//
// This file depends only on `@playwright/test` and `./health`.

import type { Page, Response } from "@playwright/test";

import { probeStaging, type HealthReport } from "./health";

/** The path of an address, with no origin and no query string. The query can
 *  carry a one-time code or a coupon, and a failure message is published. */
const pathOnly = (address: string): string => {
  try {
    return new URL(address, "http://local").pathname;
  } catch {
    return address.split("?")[0];
  }
};

/** Why a page did not open in time, in one sentence. */
export const pageTimeoutReason = (options: {
  path: string;
  seconds: number;
  health: HealthReport;
}): string => {
  const { seconds, health } = options;
  const opening = `the page ${pathOnly(options.path)} did not open within ${seconds} seconds`;

  if (health.skipped) {
    return `${opening}. No backend could be asked why: neither the search backend nor a storefront backend is configured on this machine`;
  }

  if (!health.up) {
    return `${opening}, and staging was not serving at that moment: ${health.reason} (${health.timings}). This is a backend fault, not a fault in the page`;
  }

  return `${opening}, while every backend answered when asked at that moment (${health.timings}). So the wait was inside the app's own server. Read this run's server log at this time for a call that never came back: \`[ioredis]\` is the cache store, \`Filling a cache during prerender timed out\` is a cached read`;
};

/** `page.goto`, with a timeout that names what was wrong.
 *
 *  Any other failure is passed on untouched. */
export const openPage = async (
  page: Page,
  address: string,
  options: Parameters<Page["goto"]>[1] = { waitUntil: "domcontentloaded" },
): Promise<Response | null> => {
  const startedAt = Date.now();
  try {
    return await page.goto(address, options);
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "TimeoutError") throw error;

    const seconds = Math.round((Date.now() - startedAt) / 1000);
    // One try each. The retried probe waits up to a minute for a backend to
    // come back, and would then report a fault that has passed as healthy.
    const health = await probeStaging({ once: true });

    const named = new Error(
      pageTimeoutReason({ path: address, seconds, health }),
    );
    named.name = "TimeoutError";
    named.stack = error.stack;
    throw named;
  }
};
