import { describe, expect, it, vi, beforeEach } from "vitest";
import { GetProductDeliveryTimes } from "services/products";
import { fetchData } from "utils/fetchData";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

describe("Products Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GetProductDeliveryTimes", () => {
    it("fetches product delivery distribution from endpoint and returns delivered_orders array", async () => {
      const deliveredOrders = [
        { days_count: 2, orders_count: 50 },
        { days_count: 3, orders_count: 20 },
      ];

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { delivered_orders: deliveredOrders },
      });

      const result = await GetProductDeliveryTimes({ productId: 101 });

      expect(fetchData, "should call fetchData with product delivery endpoint").toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          server: "market",
          useCached: true,
          noMessage: true,
        }),
      );
      expect(result, "should return delivered_orders array").toEqual(deliveredOrders);
    });

    it("returns empty array fallback when response success is false", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
      });

      const result = await GetProductDeliveryTimes({ productId: 101 });
      expect(result, "should return empty array on failed response").toEqual([]);
    });
  });
});
