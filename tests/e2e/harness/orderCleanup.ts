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
// The request below goes through the app's own `/api/proxy`, with the context's
// own cookies, so the credential stays where it already was and no token is read
// or printed by this file.
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

import type { APIRequestContext } from "@playwright/test";

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

/** One call to a backend, the same way the app's own client makes it.
 *
 *  Mirrors `utils/fetchData.ts`: POST to `/api/proxy`, the real target named in
 *  `x-proxy-url`, the service named by its opaque wire token, and the verb in
 *  `x-proxy-method`. The proxy reads `MARKET-TOKEN` from the cookies the request
 *  carries, so this needs the **context's** request object, not a bare one. */
const throughProxy = async (
  request: APIRequestContext,
  options: {
    target: string;
    method: "GET" | "POST";
    body?: unknown;
    country: string;
    language: string;
  },
): Promise<{ status: number; json: unknown }> => {
  const headers: Record<string, string> = {
    "x-proxy-server": toServiceToken("market"),
    "x-proxy-url": encodeURI(options.target),
    "x-proxy-method": options.method,
    "x-country": options.country,
    "x-language": options.language,
    "x-need-decode": "true",
  };

  const response = await request.post("/api/proxy", {
    headers:
      options.body === undefined
        ? headers
        : { ...headers, "Content-Type": "application/json" },
    data: options.body === undefined ? undefined : JSON.stringify(options.body),
    failOnStatusCode: false,
  });

  return {
    status: response.status(),
    json: await response.json().catch(() => null),
  };
};

/** Cancel every pack of one order group that the backend says can be cancelled.
 *
 *  Never throws. It runs in a fixture teardown, where a throw would replace the
 *  failure the case is trying to report with a failure about tidying up. What it
 *  could not do comes back in `problem` instead. */
export const cancelOrderGroup = async (
  request: APIRequestContext,
  options: { groupId: string; country: string; language: string },
): Promise<CleanupOutcome> => {
  const outcome: CleanupOutcome = {
    groupId: options.groupId,
    packs: 0,
    cancelled: 0,
    skipped: 0,
  };

  try {
    const found = await throughProxy(request, {
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

      const cancelled = await throughProxy(request, {
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
