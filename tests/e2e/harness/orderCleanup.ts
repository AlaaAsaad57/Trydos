// The orphan net: an order this run created and never cancelled through the UI.
//
// ---------------------------------------------------------------------------
// Why it exists
//
// The buy journey places a **real** order on staging. The last case cancels it
// through the screens a shopper uses, which is the point of the case. But a case
// that dies between "the order exists" and "the order is cancelled" leaves a
// live order on a shared shop, and nothing else in this repository will ever
// clear it. Playwright retries are off (`playwright.config.ts`) for the same
// family of reasons, so there is no second attempt either.
//
// So the order id is registered the moment it is known, and whatever is still
// registered when the case ends is cancelled here — pass or fail.
//
// ---------------------------------------------------------------------------
// Why it is a fixture and not `globalTeardown`
//
// `globalTeardown` runs in the Playwright process; a spec runs in a worker.
// A module-level list written by a worker is not visible to the teardown, and a
// worker that crashes writes nothing at all. A test-scoped fixture teardown runs
// in the worker that owns the order, straight after the case, and it runs after
// a **failing** case too — which is the only case that needs it.
//
// ---------------------------------------------------------------------------
// Why it talks to the backend rather than driving the screens
//
// A case that failed left the browser somewhere unknown: mid-checkout, on an
// error, with a modal over the page. Driving the cancel screens from there is
// the least reliable thing available at exactly the moment reliability matters.
// The request below goes through the app's own `/api/proxy`, made by a page in
// a fresh browser context built from the cookies the case had. It must be a
// page: an authenticated call cannot be made from Node here — see
// `throughProxyInPage` for why. The credential stays where it already was and
// no token is read or printed by this file.
//
// ---------------------------------------------------------------------------
// Two ids, and this file needs the one no screen shows
//
// The success panel and the orders list both show the **group** id. The cancel
// call takes `order_id`, which is a **pack** id — one group can hold several.
// So this asks the backend which packs the group holds, then cancels each pack
// that says it can be cancelled. A pack that says it cannot is left alone: it is
// either already cancelled or past the point where cancelling is allowed, and
// both are answers rather than failures.

import type { Page } from "@playwright/test";

import { toServiceToken } from "utils/serviceTokens";

/** A pack, reduced to the two fields this file acts on. */
type CancellablePack = {
  id: number | string;
  can_cancele_order?: boolean;
  order_group_status?: { value?: string };
};

/** What happened to one group. Returned so a caller can say it out loud rather
 *  than clean up silently — a net that quietly catches something every run is a
 *  case that is quietly broken. */
export type CleanupOutcome = {
  groupId: string;
  /** Packs the backend reported for this group. */
  packs: number;
  /** Packs this file asked to cancel. */
  cancelled: number;
  /** Packs it left alone because the backend said they cannot be cancelled. */
  skipped: number;
  /** Set when the cleanup itself could not run. Never a credential — just the
   *  status or the message the backend answered with. */
  problem?: string;
};

/** Ceiling on one proxy call. Playwright's own default is 30 s, which is what
 *  made a four-call teardown able to overrun a 60 s allowance (P-2). */
const PROXY_CALL_MS = 15_000;

/** One call to a backend, made **by the page itself**.
 *
 *  Use this one for anything that needs the shopper's credential. It is the
 *  same request `throughProxy` below makes, but it runs inside the browser
 *  instead of in Node — and for an authenticated call that difference decides
 *  whether it works at all.
 *
 *  **Why.** `MARKET-TOKEN` is written `Secure`
 *  (`utils/server/tokenManager.ts:22-25`) because the suite runs a production
 *  server (`tests/e2e/harness/server.ts:56-62`), and it is served over plain
 *  `http://127.0.0.1:3100`. A browser sends a `Secure` cookie to a loopback
 *  address anyway — loopback counts as a trustworthy origin. Playwright's
 *  request object does not: it is Node's own networking, not Chromium's, even
 *  when it comes from `context.request` and shares the same cookie storage. So
 *  the cookie is held but never sent, the proxy attaches no `Authorization`
 *  header, and the core backend answers `401 Unauthorized` — correctly.
 *
 *  A live run showed exactly that: `/customer/address/list` answered `401`
 *  while the page beside it was drawing the shopper's own name.
 *
 *  `actions/auth.ts` already calls authenticated routes this way
 *  (`signedInSession`, `:592`), and those work. This is the same shape. */
export const throughProxyInPage = async (
  page: Page,
  options: {
    target: string;
    method: "GET" | "POST";
    body?: unknown;
    country: string;
    language: string;
    /** Per-call ceiling in ms, default 15 s. Without one a teardown of four
     *  calls can outlive the slot it is given (panel finding P-2). A call that
     *  runs out of time comes back as status `0` rather than throwing, so a
     *  tidy-up never replaces the failure a case is reporting. */
    timeout?: number;
  },
): Promise<{ status: number; json: unknown }> =>
  await page.evaluate(
    async (call) => {
      const headers: Record<string, string> = {
        "x-proxy-server": call.server,
        "x-proxy-url": encodeURI(call.target),
        "x-proxy-method": call.method,
        "x-country": call.country,
        "x-language": call.language,
        "x-need-decode": "true",
      };
      if (call.body !== undefined) headers["Content-Type"] = "application/json";

      try {
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers,
          credentials: "include",
          body: call.body === undefined ? undefined : JSON.stringify(call.body),
          signal: AbortSignal.timeout(call.timeout),
        });

        // Parsed in the browser, so a parser message quoting the body can
        // never reach the Node failure line.
        const json = await response.json().catch(() => null);
        return { status: response.status, json };
      } catch (error) {
        // Status `0` is "no answer", which is not the same as a refusal and
        // must not read like one.
        return {
          status: 0,
          json: {
            message:
              error instanceof Error && error.name === "TimeoutError"
                ? `the call did not answer within ${call.timeout}ms`
                : "the call could not be made",
          },
        };
      }
    },
    {
      server: toServiceToken("market"),
      target: options.target,
      method: options.method,
      body: options.body,
      country: options.country,
      language: options.language,
      timeout: options.timeout ?? PROXY_CALL_MS,
    },
  );

/** Cancel every pack of one order group that the backend says can be cancelled.
 *
 *  Never throws. It runs in a fixture teardown, where a throw would replace the
 *  failure the case is trying to report with a failure about tidying up. What it
 *  could not do comes back in `problem` instead. */
export const cancelOrderGroup = async (
  page: Page,
  options: { groupId: string; country: string; language: string },
): Promise<CleanupOutcome> => {
  const outcome: CleanupOutcome = {
    groupId: options.groupId,
    packs: 0,
    cancelled: 0,
    skipped: 0,
  };

  try {
    const found = await throughProxyInPage(page, {
      target: `/customer/order/getOrdersByOrderGroupID?order_group_id=${options.groupId}`,
      method: "GET",
      country: options.country,
      language: options.language,
    });

    const packs = (found.json as { data?: CancellablePack[] } | null)?.data;
    if (!Array.isArray(packs)) {
      outcome.problem = `the backend did not list the packs of this order (status ${found.status})`;
      return outcome;
    }

    outcome.packs = packs.length;

    for (const pack of packs) {
      if (pack.can_cancele_order !== true) {
        outcome.skipped += 1;
        continue;
      }

      const cancelled = await throughProxyInPage(page, {
        target: "/customer/order/cancel",
        method: "POST",
        body: { order_id: pack.id },
        country: options.country,
        language: options.language,
      });

      if (cancelled.status >= 200 && cancelled.status < 300) {
        outcome.cancelled += 1;
      } else {
        outcome.problem = `the backend refused to cancel a pack of this order (status ${cancelled.status})`;
      }
    }
  } catch (error) {
    outcome.problem = error instanceof Error ? error.message : String(error);
  }

  return outcome;
};
