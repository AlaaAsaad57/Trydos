// Taking the last one of an item out of the bag, from the add-to-cart button.
//
// `RemoveFromCart` used to crash on a refusal, so this handler jumped straight
// to its `catch`. Now the service reports the refusal instead of throwing, and
// the handler has to read that answer. If it does not, everything after the
// call runs on a removal that never happened: analytics, the order funnel, and
// the words "Removed From Your Bag" over an item still in the bag.
//
// The cart service is replaced rather than answered. This file is about what
// the button does with the answer, not about the request.
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddToCartButton from "components/Cart/AddToCart/Button";

import { renderWithProviders, userEvent } from "../../../render";

const RemoveFromCart = vi.fn();
const GAevent = vi.fn();
const trackOrder = vi.fn();

vi.mock("services/cart", () => ({
  default: {
    RemoveFromCart: (...args: any[]) => RemoveFromCart(...args),
    UpdateCart: vi.fn(),
    AddToCart: vi.fn(),
  },
}));

vi.mock("utils/gtag", () => ({
  GAevent: (...args: any[]) => GAevent(...args),
}));

vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: { CART_ITEM_REMOVED: "cart_item_removed" },
  trackOrder: (...args: any[]) => trackOrder(...args),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  getCart: vi.fn().mockResolvedValue({ cart: [] }),
  LogError: vi.fn(),
}));

/** One product, no variants, so the button reads the cart row by product id. */
const product = { id: 101, name: "Blue shirt", slug: "blue-shirt", price: 100 };

/** Render the button with one of this item in the bag, then tap the minus. */
async function tapTheMinus() {
  await renderWithProviders(
    <AddToCartButton
      colors={[]}
      sizes={[]}
      selectedSize={null}
      selectedColor={null}
      selectedVariant={{ offer_price: 80 }}
      fullQty={1}
      updateQuantity={vi.fn()}
      loading={false}
      setLoading={() => {}}
      id={product.id}
      product={product}
      reachedMaxQty={() => false}
      initialLoading={false}
      colorChanged={false}
      sizeChanged={false}
    />,
    {
      country: "sy",
      path: "/product/blue-shirt",
      store: {
        localCart: [{ id: 101, item_id: "cart-99", quantity: 1 }],
        currency: { symbol: "$", exchange_rate: 1, decimal_digits: 2 },
      },
    },
  );

  await userEvent.click(document.querySelector(".minuse-qty-icon")!);
}

describe("taking the last one out of the bag from the add-to-cart button", () => {
  beforeEach(() => {
    GAevent.mockClear();
    trackOrder.mockClear();
  });

  it("does not tell analytics about a removal the core backend refused", async () => {
    RemoveFromCart.mockResolvedValue(false);

    await tapTheMinus();

    expect(
      GAevent.mock.calls.map(([call]: any) => call?.action),
      "the item is still in the bag because the core backend refused to remove it, and analytics was told it was removed",
    ).toEqual([]);
  });

  it("does not tell the order funnel about a removal the core backend refused", async () => {
    RemoveFromCart.mockResolvedValue(false);

    await tapTheMinus();

    expect(
      trackOrder.mock.calls.map(([event]: any) => event),
      "the core backend refused to remove the item and the order funnel counted it as removed",
    ).toEqual([]);
  });

  it("tells analytics and the order funnel once the item has really gone", async () => {
    RemoveFromCart.mockResolvedValue(true);

    await tapTheMinus();

    expect(
      trackOrder.mock.calls.map(([event]: any) => event),
      "the core backend removed the item and the order funnel was never told",
    ).toEqual(["cart_item_removed"]);
  });
});
