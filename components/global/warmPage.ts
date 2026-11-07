import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Readies an address for a tap: the router learns its route and its shell, so it
 * can move there at once. Used for the first cards of a page, and for any card at
 * the moment of the press, about 100 ms before the tap.
 *
 * The default prefetch on purpose, and not `kind: "full"`. On these routes
 * (`prefetch = "partial"`) "full" brought no product data, because the data is
 * not cached content, and it asked for a fresh render instead of the prerendered
 * shell: store to product became 300 ms slower (measured).
 */

/** How many cards of a page are warmed: about what the first screen shows. */
export const WARM_CARDS = 4;

/** The router keeps a prefetched page for 30 s (`staleTimes.dynamic`). */
const FRESH_MS = 25000;

const asked = new Map<string, number>();

export function warmPage(router: AppRouterInstance, href: string): void {
  // Never with the query: a finished prefetch of an address with a query turns
  // the next tap on it into a full page reload (measured on Next 16.3.8).
  const path = href.split(/[?#]/)[0];
  const now = Date.now();
  if (now - (asked.get(path) ?? 0) < FRESH_MS) return;
  asked.set(path, now);
  router.prefetch(path);
}
