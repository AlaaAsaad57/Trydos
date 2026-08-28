import { describe, expect, it, vi, beforeEach } from "vitest";
import orderService from "services/order";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
}));

describe("OrderService (services/order.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUploadSubPath", () => {
    it("extracts last path segment from media URL", () => {
      const path = orderService.getUploadSubPath("https://media.example.com/uploads/tickets/doc.pdf?v=1#tag");
      expect(path, "should extract doc.pdf").toBe("doc.pdf");
    });
  });

  describe("PlaceOrder", () => {
    it("posts checkout payload to /customer/order/checkout and sets order data on success", async () => {
      useAppStore.setState({
        addressLists: [{ id: "addr-1", is_default: 1 }],
      });

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: [{ id: "order-123" }],
      });

      await orderService.PlaceOrder({ pay_by_wallet: false });

      expect(fetchData, "should post to checkout endpoint").toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/customer/order/checkout"),
          method: "POST",
          server: "market",
        }),
      );
      expect(useAppStore.getState().orderData.success, "orderData.success should be true").toBe(true);
    });
  });
});
