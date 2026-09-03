// Taking the last one of an item out of the bag, from the out-of-stock widget.
//
// `RemoveFromCart` used to crash on a refusal, so this handler jumped straight
// to its `catch`. Now the service reports the refusal instead of throwing, and
// the handler has to read that answer. If it does not, everything after the
// call runs on a removal that never happened: the analytics event, the cart
// refresh and the quantity roll-forward.
//
// The cart service is replaced rather than answered. This file is about what
// the widget does with the answer, not about the request.
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotifyButton from "components/Cart/AddToCart/NotifyButton";

import { renderWithProviders, userEvent } from "../../../render";

const RemoveFromCart = vi.fn();
const GAevent = vi.fn();

vi.mock("services/cart", () => ({
  default: {
    RemoveFromCart: (...args: any[]) => RemoveFromCart(...args),
    UpdateCart: vi.fn(),
  },
}));

vi.mock("utils/gtag", () => ({
  GAevent: (...args: any[]) => GAevent(...args),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  getCart: vi.fn().mockResolvedValue({ cart: [] }),
  LogError: vi.fn(),
}));

const product = { id: 101, name: "Blue shirt", slug: "blue-shirt" };
const selectedVariant = { product_variation_id: 7, offer_price: 80 };

/** Render the widget with one of this item in the bag, then tap the minus. */
async function tapTheMinus() {
  const updateQuantity = vi.fn();

  await renderWithProviders(
    <NotifyButton
      isNotified={false}
      notifyAction={() => {}}
      loading={false}
      id={product.id}
      product={product}
      selectedVariant={selectedVariant}
      setLoading={() => {}}
      colors={[]}
      sizes={[]}
      selectedColor={null}
      selectedSize={null}
      updateQuantity={updateQuantity}
    />,
    {
      country: "sy",
      path: "/product/blue-shirt",
      store: {
        localCart: [
          {
            id: 101,
            item_id: "cart-99",
            quantity: 1,
            product_variation_id: 7,
          },
        ],
      },
    },
  );

  const minus = document.querySelector(".minuse-qty-icon")!;
  await userEvent.click(minus);
  return { updateQuantity };
}

describe("taking the last one out of the bag from the out-of-stock widget", () => {
  beforeEach(() => {
    GAevent.mockClear();
  });

  it("does not report a removal the core backend refused", async () => {
    RemoveFromCart.mockResolvedValue(false);

    await tapTheMinus();

    expect(
      GAevent.mock.calls.map(([call]: any) => call?.action),
      "the item is still in the bag because the core backend refused to remove it, and analytics was told it was removed",
    ).toEqual([]);
  });

  it("reports the removal once the core backend has removed the item", async () => {
    RemoveFromCart.mockResolvedValue(true);

    await tapTheMinus();

    expect(
      GAevent.mock.calls.map(([call]: any) => call?.action),
      "the core backend removed the item and analytics was never told",
    ).toEqual(["remove_from_cart"]);
  });
});
