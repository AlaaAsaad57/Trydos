import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchOrders, fetchOrdersCount, fetchHiddenOrders } from "services/orders";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
}));

describe("Orders Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchOrders", () => {
    it("fetches orders list with pagination parameters and updates totalOrders store", async () => {
      const mockResponse = {
        success: true,
        data: {
          total: 15,
          orders: [{ id: "ord-1" }],
        },
      };
      vi.mocked(fetchData).mockResolvedValueOnce(mockResponse);

      const result = await fetchOrders(1, 8, "completed");

      expect(fetchData, "should format API request with offset, limit, and status filter").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/list?offset=1&limit=8&order_group_status=completed",
          method: "GET",
          server: "market",
        }),
      );
      expect(result, "should return API response").toEqual(mockResponse);
    });

    it("handles failure gracefully and logs server error", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Failed to fetch orders",
      });

      const result = await fetchOrders(1, 8);
      expect(result, "should return undefined on error").toBeUndefined();
    });
  });

  describe("fetchOrdersCount", () => {
    it("requests offset=1&limit=1 and returns total_order_group count", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { total_order_group: 7 },
      });

      const count = await fetchOrdersCount();

      expect(fetchData, "should request limit=1 offset=1 with noMessage flag").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/list?offset=1&limit=1",
          noMessage: true,
        }),
      );
      expect(count, "should return order group count").toBe(7);
    });
  });

  describe("fetchHiddenOrders", () => {
    it("calls /customer/order/getHiddenOrders endpoint", async () => {
      const mockResponse = { success: true, data: [{ id: "hidden-1" }] };
      vi.mocked(fetchData).mockResolvedValueOnce(mockResponse);

      const result = await fetchHiddenOrders();

      expect(fetchData, "should call /customer/order/getHiddenOrders").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/getHiddenOrders",
          method: "GET",
        }),
      );
      expect(result, "should return hidden orders response").toEqual(mockResponse);
    });
  });
});
