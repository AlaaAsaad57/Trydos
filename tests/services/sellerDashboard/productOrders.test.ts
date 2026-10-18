// The request `getSellerProductOrders` sends for the product orders screen.
// Contract: shop-seller-orders-apis.md §4.1 — GET /shop/products/{id}/orders,
// optional `status` (default "all") and `page`.

import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchData = vi.fn().mockResolvedValue({ isSuccessful: true });

vi.mock("utils/fetchData", () => ({
  default: (...args: unknown[]) => fetchData(...args),
  fetchData: (...args: unknown[]) => fetchData(...args),
}));

vi.mock("services/auth", () => ({ default: { RefreshSession: vi.fn() } }));

import sellerDashboard from "services/sellerDashboard";

/** The request the service actually sent. */
const sent = () =>
  fetchData.mock.calls.at(-1)?.[0] as {
    url?: string;
    method?: string;
    server?: string;
    sellerId?: string;
  };

describe("getSellerProductOrders — GET /shop/products/{id}/orders", () => {
  beforeEach(() => fetchData.mockClear());

  it("asks the shop backend for page 1 of all orders with no query", async () => {
    await sellerDashboard.getSellerProductOrders("77", 2310);

    const req = sent();
    expect(req?.url, "page 1 of all orders must send no query string").toBe(
      "/shop/products/2310/orders",
    );
    expect(req?.method, "the product orders list is a read").toBe("GET");
    expect(
      req?.server,
      "the product orders list must go to the shop dashboard backend",
    ).toBe("market-dashboard");
    expect(
      req?.sellerId,
      "the seller id must travel with the request (it becomes X-Seller-ID)",
    ).toBe("77");
  });

  it("sends the status filter and the page together", async () => {
    await sellerDashboard.getSellerProductOrders("77", 2310, 3, "in_progress");

    expect(
      sent()?.url,
      "the in-progress filter or the page number was not sent",
    ).toBe("/shop/products/2310/orders?status=in_progress&page=3");
  });
});
