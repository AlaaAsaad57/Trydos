import { describe, expect, it, vi, beforeEach } from "vitest";
import cartService from "services/cart";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
}));

describe("CartService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ localCart: [] });
  });

  describe("AddToCart", () => {
    it("posts payload to /cart/add and updates store localCart on success", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1, id_cart: "cart-item-99" },
      });

      const success = await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "https://example.com/image.jpg",
        type: "variant-1",
        offer_price: 50,
      });

      expect(success, "AddToCart should return true").toBe(true);
      expect(fetchData, "should call fetchData with /cart/add").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/cart/add",
          method: "POST",
          server: "market",
        }),
      );
      expect(useAppStore.getState().localCart, "store should contain newly added item").toHaveLength(1);
    });

    it("returns false and logs error on API failure", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Out of stock",
      });

      const success = await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "image.jpg",
        type: "variant-1",
        offer_price: 50,
      });

      expect(success, "AddToCart should return false on failure").toBe(false);
      expect(useAppStore.getState().localCart, "store cart should remain empty").toHaveLength(0);
    });
  });

  describe("UpdateCart", () => {
    it("posts payload to /cart/update and updates item quantity in store", async () => {
      useAppStore.setState({
        localCart: [{ id: 101, item_id: "cart-99", quantity: 1 }],
      });

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1, qty: "3" },
      });

      const success = await cartService.UpdateCart({
        cart_id: "cart-99",
        qty: 3,
      });

      expect(success, "UpdateCart should return true").toBe(true);
      expect(
        useAppStore.getState().localCart.find((i) => i.item_id === "cart-99")?.quantity,
        "quantity in store should be updated to 3",
      ).toBe(3);
    });
  });

  describe("RemoveFromCart & ConvertToOldCart", () => {
    it("RemoveFromCart calls /cart/remove and removes item from localCart", async () => {
      useAppStore.setState({
        localCart: [{ id: 101, item_id: "cart-99", quantity: 1 }],
      });

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
      });

      const success = await cartService.RemoveFromCart({
        cart_item: { item_id: "cart-99" },
      });

      expect(success, "RemoveFromCart should return true").toBe(true);
      expect(useAppStore.getState().localCart, "item should be removed from localCart").toHaveLength(0);
    });

    it("ConvertToOldCart calls /cart/convert_to_old with cart_item key", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
      });

      await cartService.ConvertToOldCart({ cart_item: "item-101" });

      expect(fetchData, "should call /cart/convert_to_old").toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/cart/convert_to_old",
          method: "POST",
        }),
      );
    });
  });
});
