"use server";
import { GetStarttingSetting } from "serverRequests";
import { HandleAuthedFetch } from "serverRequests/HandleAuthedFetch";
import { LogServerError } from "utils/serverErrorReporter";

export async function getOrderStatues({ language, country }) {
  try {
    let res = await GetStarttingSetting({ language, country });
    return res?.order_group_statuses ?? [];
  } catch (error) {
    LogServerError({
      error: error,
      scenario: "Error In getOrderStatues in serverRequest/settings",
    });
  }
}

/**
 * Server-side seller-shops / permissions check for guarding the seller
 * dashboard routes. Mirrors the client `SellerDashboardService.getShopes()`
 * (`GET /shop/auth/permissions`, backend responds `{ success, data: [...] }`).
 *
 * Returns `conclusive` so the caller can distinguish "the backend confirmed
 * this user owns no shops" from "the request failed / was inconclusive". Only a
 * conclusive empty result should trigger a redirect — transient 5xx / network
 * errors must never bounce a legitimate seller off their dashboard.
 */
export async function GetSellerShops(local?: string) {
  try {
    const res = await HandleAuthedFetch({
      url: process.env.BACKEND_URL + "/shop/auth/permissions",
      method: "GET",
      ...(local ? { local } : {}),
    });
    const status = res?.status ?? 0;
    const shops = Array.isArray(res?.data?.data) ? res.data.data : [];
    // Conclusive = the backend actually answered (200) or knows the identity and
    // explicitly denies it (403). A 401 is NOT conclusive: this runs during a
    // Server Component render, where `HandleAuthedFetch` cannot persist a
    // rotated token (its cookie-writability probe throws) and therefore returns
    // the 401 *without attempting a refresh*. Counting that as "owns no shops"
    // bounced legitimate sellers home the moment their access token expired.
    // Falling through instead lets client-side recovery — refresh → retry, or
    // the seller re-auth prompt in `fetchData` — run as intended.
    const conclusive = status === 200 || status === 403;
    return { shops, hasShops: shops.length > 0, conclusive };
  } catch (error) {
    LogServerError({
      error: error,
      scenario: "Error In GetSellerShops in serverRequest/settings",
    });
    return { shops: [], hasShops: false, conclusive: false };
  }
}
