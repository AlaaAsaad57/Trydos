import { cache } from "react";
import { GetSellerShops } from "./index";

/**
 * Request-memoized wrapper around `GetSellerShops` (`GET /shop/auth/permissions`).
 *
 * Two server-side guards live in the seller area: the `/sellerProfile` layout
 * (bounces users who own no shops) and the `/sellerProfile/sellerDashboard/[sellerId]`
 * layout (bounces users who own shops but not *this* one). When navigating into a
 * dashboard, both render in the same request — without memoization that is two
 * identical permission fetches. `cache()` dedupes them to a single call per
 * request (keyed on the `local` arg), while each guard still evaluates its own
 * redirect independently.
 */
export const getSellerShopsCached = cache((local?: string) =>
  GetSellerShops(local),
);
