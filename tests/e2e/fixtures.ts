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
  orders: async ({ playwright }, use, testInfo) => {
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

    await use(tracker);

    // Whatever is still registered was never cancelled by the case itself.
    for (const order of live.values()) {
      const request = await playwright.request.newContext({
        baseURL: LIVE_ORIGIN,
        storageState: order.storageState,
      });
      try {
        const outcome = await cancelOrderGroup(request, {
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
        await request.dispose();
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
