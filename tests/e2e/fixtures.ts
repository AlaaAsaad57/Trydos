// The test object every spec imports, instead of `@playwright/test` directly.
//
//   import { test, expect } from "./fixtures";
//
// Two reasons it exists rather than being added later:
//
//   * **Skipping is automatic.** A machine with no staging addresses started no
//     server, so every spec must skip rather than fail against nothing. Doing it
//     here means no spec has to remember, and no spec can forget.
//   * **It is where the write tracker goes.** The `orders` fixture registers a
//     created order the moment its id is known, and cancels it in teardown if
//     the spec died before it could. Fixtures are the only place that reliably
//     runs after a failing test.

import { test as base, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

import { hasBackends, LIVE_ORIGIN, loadLiveEnv } from "./harness/env";
import { cancelOrderGroup, type CleanupOutcome } from "./harness/orderCleanup";

/** What a spec registers, and what it says when it no longer needs to. */
export type OrderTracker = {
  /** Say an order now exists on staging. Call this the moment the id is on
   *  screen, before anything is asserted about it — an assertion that fails
   *  first would leave the order unregistered and uncancelled. */
  register: (options: { groupId: string; context: BrowserContext; page: Page }) => Promise<void>;
  /** Say a registered order has been cancelled through the screens, so the net
   *  has nothing left to do for it. */
  release: (groupId: string) => void;
  /** What the net actually had to cancel. Empty on a healthy run — a case that
   *  cancels its own order releases it — so anything in here is a case that did
   *  not finish, and the spec can say so. */
  swept: () => CleanupOutcome[];
};

/** One registered order, with everything needed to cancel it later.
 *
 *  The cookie jar is copied at registration rather than read at teardown: a spec
 *  may close its browser context in a `finally`, and the net has to work after
 *  it has. Kept in memory for the length of one case and never written to disk
 *  — the saved-session files are the ones `globalTeardown` exists to remove, and
 *  this deliberately does not add another. */
type Registered = {
  groupId: string;
  storageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
  country: string;
  language: string;
};

/** Read the country and language out of the address the app is on.
 *
 *  Every storefront path carries them as `/{country}-{language}/…`. Taken from
 *  the live page rather than assumed, because which country a run lands on is
 *  the app's choice, not the suite's — see the note at the top of
 *  `selectors.ts`. */
const localeFromUrl = (url: string): { country: string; language: string } => {
  const match = /\/([a-z]{2})-([a-z]{2})(\/|$|\?)/.exec(new URL(url).pathname + "/");
  return { country: match?.[1] ?? "sy", language: match?.[2] ?? "en" };
};

export const test = base.extend<{ orders: OrderTracker }>({
  // The second argument is Playwright's `use`, renamed here only because the
  // React lint rule reads a bare `use(...)` as the React hook and warns about a
  // function that is not a component. It is passed positionally, so the name is
  // ours to choose.
  orders: async ({ browser }, provide, testInfo) => {
    const live = new Map<string, Registered>();
    const swept: CleanupOutcome[] = [];

    const tracker: OrderTracker = {
      register: async ({ groupId, context, page }) => {
        live.set(groupId, {
          groupId,
          storageState: await context.storageState(),
          ...localeFromUrl(page.url()),
        });
      },
      release: (groupId) => {
        live.delete(groupId);
      },
      swept: () => [...swept],
    };

    await provide(tracker);

    // Whatever is still registered was never cancelled by the case itself.
    //
    // **A real browser, not a request context, and that is the whole fix.**
    // The cancel goes through `/api/proxy`, which reads `MARKET-TOKEN` from the
    // cookies the request carries. That cookie is written `Secure`
    // (`utils/server/tokenManager.ts:22-25`) because the suite runs a
    // production server (`tests/e2e/harness/server.ts:56-62`), and it is served
    // over plain `http://127.0.0.1:3100`. Chromium sends a `Secure` cookie to
    // loopback anyway — loopback is a trustworthy origin. Playwright's request
    // object does not, because it is Node's networking rather than the
    // browser's, and that holds even for `context.request`, which shares the
    // same cookie storage.
    //
    // So the old version of this loop sent no credential at all and every call
    // came back `401`. The net reported a `problem` and cancelled nothing,
    // which is worse than failing: the run says the order was caught while a
    // real order is still live on staging. Proved on a live run — the same
    // call answered `401` from Node twice and worked from inside a page.
    for (const order of live.values()) {
      const context = await browser.newContext({
        baseURL: LIVE_ORIGIN,
        storageState: order.storageState,
      });
      const page = await context.newPage();
      try {
        // The page has to be **on** the origin before a same-origin `fetch`
        // means anything — `about:blank` has no origin to be same as. Robots is
        // the cheapest page that is served from it: `proxy.ts`'s matcher skips
        // it, so there is no locale redirect and no storefront render.
        await page.goto("/robots.txt", { waitUntil: "domcontentloaded" });

        const outcome = await cancelOrderGroup(page, {
          groupId: order.groupId,
          country: order.country,
          language: order.language,
        });
        swept.push(outcome);

        // Say it in the report rather than only in memory. A swept order means
        // a case left a real order behind, and the next reader needs to know
        // whether the net caught it — not to discover it on the shop.
        testInfo.annotations.push({
          type: "orphan order",
          description:
            `order ${outcome.groupId}: ${outcome.packs} packs, ` +
            `${outcome.cancelled} cancelled, ${outcome.skipped} left alone` +
            (outcome.problem ? ` — ${outcome.problem}` : ""),
        });
      } finally {
        await context.close();
      }
    }
  },
});

// Registered when this module loads, which is once per spec file — so every spec
// that imports `test` from here inherits it, and none of them has to remember.
//
// `beforeEach` rather than an auto fixture on purpose: `test.skip(condition, …)`
// is supported in a test body and in a hook, and a fixture is neither.
test.beforeEach(() => {
  loadLiveEnv();
  test.skip(
    !hasBackends(),
    "No staging addresses configured — see tests/e2e/README.md.",
  );
});

export { expect };
