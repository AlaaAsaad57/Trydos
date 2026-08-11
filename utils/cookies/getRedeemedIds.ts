import { cache } from "react";
import { getCookieServer } from "utils/cookies/server-cookie-manager";

/**
 * Request-scoped read of the guest's redeemed lottery ids.
 *
 * The home page reads this cookie from several parallel server wrappers
 * (featured products, flash deals, recommendations). React's cache() collapses
 * those to a single cookie read per request render instead of one per wrapper.
 */
export const getRedeemedIds = cache(
  async (): Promise<any[]> =>
    (await getCookieServer<any[]>("redemed_ids")) ?? [],
);
