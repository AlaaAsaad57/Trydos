import { describe, expect, it, vi, beforeEach } from "vitest";
import cartService from "services/cart";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";
import { REQUESTS_DATA } from "utils/Requests";

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

  // ---------------------------------------------------------------------
  // Everything below was added by phase 16 of the unit-test roadmap.
  //
  // The tests above cover the happy path. These cover what the service does
  // when the core backend says no, or says yes to something other than what
  // was asked for. That is where the cart on screen and the cart the core
  // backend holds drift apart, and a shopper who cannot delete an item, or who
  // is charged for one they removed, never sees an error to report.
  // ---------------------------------------------------------------------

  /** The one call the service made to `url`, so a test can read what was sent. */
  function callTo(url: string) {
    const call = vi
      .mocked(fetchData)
      .mock.calls.find(([args]: any) => args?.url === url);
    return call?.[0] as any;
  }

  /** The JSON body the service sent to `url`, already parsed. */
  function bodySentTo(url: string) {
    const sent = callTo(url);
    return sent ? JSON.parse(sent.body) : null;
  }

  describe("AddToCart — what the core backend's answer decides", () => {
    it("stores the cart row id the core backend gave, not the product id", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1, id_cart: "cart-item-99" },
      });

      await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "https://example.com/image.jpg",
        type: "variant-1",
        offer_price: 50,
      });

      // Every later call — update, remove, convert — keys off `item_id`. If the
      // product id were stored instead, the shopper could add the item but
      // never change or delete it.
      expect(
        useAppStore.getState().localCart[0]?.item_id,
        "the cart row was stored under the wrong id, so updating or removing it would send an id the core backend does not know",
      ).toBe("cart-item-99");
    });

    it("adds nothing when the core backend answers without a cart row id", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1 },
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

      expect(
        success,
        "the core backend said yes but gave no cart row id, and AddToCart reported success anyway",
      ).toBe(false);
    });

    it("adds nothing when the core backend answers status 0", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 0, id_cart: "cart-item-99" },
      });

      await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "image.jpg",
        type: "variant-1",
        offer_price: 50,
      });

      expect(
        useAppStore.getState().localCart,
        "the core backend refused with status 0 and the item was put in the cart anyway",
      ).toEqual([]);
    });

    it("sends the image file name to the core backend, not the whole URL", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1, id_cart: "cart-item-99" },
      });

      await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "https://media.example.com/products/2026/shirt.jpg",
        type: "variant-1",
        offer_price: 50,
      });

      expect(
        bodySentTo("/cart/add")?.image,
        "the whole image URL was sent to the core backend; it stores the file name only",
      ).toBe("shirt.jpg");
    });

    it("keeps the full image URL in the store, because the cart draws it", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1, id_cart: "cart-item-99" },
      });

      await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "https://media.example.com/products/2026/shirt.jpg",
        type: "variant-1",
        offer_price: 50,
      });

      expect(
        useAppStore.getState().localCart[0]?.image,
        "the cart stored the file name instead of the URL, so the cart row would draw a broken image",
      ).toBe("https://media.example.com/products/2026/shirt.jpg");
    });

    it("labels the request as the add-to-cart widget when the widget asked", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1, id_cart: "cart-item-99" },
      });

      await cartService.AddToCart({
        product_id: 101,
        color: "Red",
        choice_1: "M",
        qty: 1,
        image: "image.jpg",
        type: "variant-1",
        offer_price: 50,
        isFromAddWidget: true,
      });

      // The label is what the request shows up as in the logs. Two different
      // screens add to the cart, and telling them apart only works if the label
      // follows the screen.
      expect(
        callTo("/cart/add")?.reqTitle,
        "a request from the add-to-cart widget was logged under the product-page label",
      ).toBe(REQUESTS_DATA.ADD_TO_CART_WIDGET);
    });
  });

  describe("UpdateCart — when the core backend confirms a different number", () => {
    it("writes the quantity the core backend confirmed, not the one asked for", async () => {
      useAppStore.setState({
        localCart: [{ id: 101, item_id: "cart-99", quantity: 1 }],
      } as any);

      // The shopper asked for 5. Only 2 are left, so the core backend confirms 2.
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 1, qty: "2" },
      });

      await cartService.UpdateCart({ cart_id: "cart-99", qty: 5 });

      expect(
        useAppStore
          .getState()
          .localCart.find((i: any) => i.item_id === "cart-99")?.quantity,
        "the cart shows the quantity the shopper asked for, not the smaller one the core backend confirmed",
      ).toBe(2);
    });

    it("leaves the quantity alone when the core backend answers status 0", async () => {
      useAppStore.setState({
        localCart: [{ id: 101, item_id: "cart-99", quantity: 1 }],
      } as any);

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { status: 0, qty: "5" },
      });

      const success = await cartService.UpdateCart({
        cart_id: "cart-99",
        qty: 5,
      });

      expect(
        success,
        "the core backend refused the quantity change with status 0 and UpdateCart reported success",
      ).toBe(false);
    });

    it("leaves the quantity alone when the core backend refuses the change", async () => {
      useAppStore.setState({
        localCart: [{ id: 101, item_id: "cart-99", quantity: 1 }],
      } as any);

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Only 1 left",
      });

      await cartService.UpdateCart({ cart_id: "cart-99", qty: 5 });

      expect(
        useAppStore
          .getState()
          .localCart.find((i: any) => i.item_id === "cart-99")?.quantity,
        "the core backend refused the change and the cart moved to the new quantity anyway",
      ).toBe(1);
    });
  });

  describe("RemoveFromCart — when the core backend refuses to remove the item", () => {
    // The screen deletes the row before the service is called — see
    // components/Cart/index.tsx:138, which runs `removeFromCart(product.id)`
    // and only then awaits RemoveFromCart. So when the core backend refuses,
    // the service has to put the row back. That is what errRemoveFromCart is
    // for.
    const refusedItem = {
      id: 101,
      item_id: "cart-99",
      quantity: 2,
      image: "shirt.jpg",
    };

    function theShopperAlreadySawItGo() {
      useAppStore.setState({ cart: [], localCart: [] } as any);
    }

    it("reports the refusal to the screen instead of throwing", async () => {
      theShopperAlreadySawItGo();
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Item is locked to an order",
      });

      const success = await cartService.RemoveFromCart({
        cart_item: refusedItem,
      });

      expect(
        success,
        "RemoveFromCart threw instead of returning false, so the screen never learns the core backend kept the item",
      ).toBe(false);
    });

    it("puts the item back in the cart the core backend refused to change", async () => {
      theShopperAlreadySawItGo();
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Item is locked to an order",
      });

      await cartService.RemoveFromCart({ cart_item: refusedItem });

      expect(
        useAppStore.getState().localCart.map((s: any) => s.item_id),
        "the core backend still holds the item but the cart on screen no longer lists it, so the shopper pays for something they deleted",
      ).toEqual(["cart-99"]);
    });

    it("puts the item back on the cart page the shopper is looking at", async () => {
      // `localCart` drives the badge and the +/- widget. The cart page itself
      // draws `cart` (components/Cart/index.tsx:330), so a rollback that only
      // repairs `localCart` leaves the page showing an item that is gone.
      useAppStore.setState({ cart: [], localCart: [] } as any);
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Item is locked to an order",
      });

      await cartService.RemoveFromCart({ cart_item: refusedItem });

      expect(
        useAppStore.getState().cart.map((s: any) => s.id),
        "the core backend refused the removal and the cart page still shows the item as gone",
      ).toEqual([101]);
    });

    it("does not list the item twice when the screen never took it away", async () => {
      // The add-to-cart widget (components/Cart/AddToCart/Button.tsx:378) does
      // not delete the row first. It waits. So on a refusal the row is still
      // there, and putting it back again would show it twice.
      useAppStore.setState({ cart: [], localCart: [refusedItem] } as any);
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Item is locked to an order",
      });

      await cartService.RemoveFromCart({ cart_item: refusedItem });

      expect(
        useAppStore.getState().localCart.map((s: any) => s.item_id),
        "a refused removal listed the item a second time in the cart",
      ).toEqual(["cart-99"]);
    });

    it("does not put a widget row on the cart page the widget never touched", async () => {
      // The widget hands over a `localCart` row, which carries fewer fields
      // than a row of `cart`. The cart page draws `cart`, so copying the
      // widget's row into it would draw a half-empty item.
      useAppStore.setState({ cart: [], localCart: [refusedItem] } as any);
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Item is locked to an order",
      });

      await cartService.RemoveFromCart({ cart_item: refusedItem });

      expect(
        useAppStore.getState().cart,
        "a refused removal from the add-to-cart widget put a row on the cart page that was never taken off it",
      ).toEqual([]);
    });

    it("labels the request as the add-to-cart widget when the widget asked", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await cartService.RemoveFromCart({
        cart_item: refusedItem,
        isFromAddWidget: true,
      });

      expect(
        callTo("/cart/remove")?.reqTitle,
        "a removal from the add-to-cart widget was logged under the cart-page label",
      ).toBe(REQUESTS_DATA.ADD_TO_CART_WIDGET);
    });
  });

  describe("ConvertToOldCart — moving an item to Out-Of-Bag", () => {
    // The cart page deletes the row as soon as this call comes back
    // (components/Cart/index.tsx:643-644). It can only be right to do that if
    // the answer says the core backend really moved the item. Its three
    // siblings all report true or false; this one has to as well.
    it("tells the screen the core backend moved the item", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      const moved = await cartService.ConvertToOldCart({
        cart_item: "cart-99",
      });

      expect(
        moved,
        "ConvertToOldCart gave no answer, so the screen cannot tell a move that worked from one that did not",
      ).toBe(true);
    });

    it("tells the screen the core backend refused to move the item", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Item is locked to an order",
      });

      const moved = await cartService.ConvertToOldCart({
        cart_item: "cart-99",
      });

      expect(
        moved,
        "the core backend refused the move and ConvertToOldCart reported nothing, so the cart page deletes the row anyway and the item is in neither list",
      ).toBe(false);
    });
  });
});
