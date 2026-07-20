"use server";
import { GetStarttingSetting } from "serverRequests";
import { HandleAuthedFetch } from "serverRequests/HandleAuthedFetch";
import { LogServerError } from "utils/serverErrorReporter";

export async function GetOrders({
  page = 1,
  pageSize = 10,
  selectedStatus = null,
}) {
  try {
    let res = await HandleAuthedFetch({
      url:
        process.env.BACKEND_URL +
        `/customer/order/list?offset=${page}&limit=${pageSize}${
          selectedStatus ? `&order_group_status=${selectedStatus}` : ""
        }`,
    });
    return res?.data;
  } catch (error) {
    console.log("Error fetching orders:", error);
    LogServerError({
      error: error,
      scenario: "Error In GetOrders in serverRequest/settings",
    });
    return null;
  }
}



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
    // The backend actually answered (200) or explicitly rejected the identity
    // (401/403) → the "does this user own shops?" question is answered.
    const conclusive = status === 200 || status === 401 || status === 403;
    return { shops, hasShops: shops.length > 0, conclusive };
  } catch (error) {
    LogServerError({
      error: error,
      scenario: "Error In GetSellerShops in serverRequest/settings",
    });
    return { shops: [], hasShops: false, conclusive: false };
  }
}
