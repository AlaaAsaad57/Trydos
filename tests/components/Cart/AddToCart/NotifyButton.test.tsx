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

import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../render";

const RemoveFromCart = vi.fn();
const UpdateCart = vi.fn();
const GAevent = vi.fn();

vi.mock("services/cart", () => ({
  default: {
    RemoveFromCart: (...args: any[]) => RemoveFromCart(...args),
    UpdateCart: (...args: any[]) => UpdateCart(...args),
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

/** Render the widget with custom props and bag rows. */
async function renderWidget(
  props: Record<string, any> = {},
  localCart: any[] = [],
) {
  const updateQuantity = vi.fn();
  const notifyAction = vi.fn();
  const setLoading = vi.fn();

  await renderWithProviders(
    <NotifyButton
      isNotified={false}
      notifyAction={notifyAction}
      loading={false}
      id={product.id}
      product={product}
      selectedVariant={selectedVariant}
      setLoading={setLoading}
      colors={[]}
      sizes={[]}
      selectedColor={null}
      selectedSize={null}
      updateQuantity={updateQuantity}
      {...props}
    />,
    { country: "sy", path: "/product/blue-shirt", store: { localCart } },
  );
  return { updateQuantity, notifyAction, setLoading };
}

function minus() {
  return document.querySelector(".minuse-qty-icon") as HTMLElement;
}

const productWithVariations = { ...product, variation: [{ id: 7 }] };

describe("lowering a quantity above one from the out-of-stock widget", () => {
  beforeEach(() => {
    UpdateCart.mockReset();
    RemoveFromCart.mockReset();
  });

  it("asks the core backend for one fewer of the picked variant", async () => {
    UpdateCart.mockResolvedValue(true);
    const { updateQuantity } = await renderWidget(
      { product: productWithVariations },
      [
        { id: 101, item_id: "cart-1", quantity: 5, product_variation_id: 3 },
        { id: 101, item_id: "cart-2", quantity: 2, product_variation_id: 7 },
      ],
    );

    await userEvent.click(minus());

    expect(
      UpdateCart.mock.calls[0]?.[0],
      "minus must lower the picked variant's row (cart-2) from 2 to 1",
    ).toEqual({ cart_id: "cart-2", qty: 1, isFromAddWidget: true });
    await waitFor(() =>
      expect(
        updateQuantity,
        "the widget did not roll the quantity down after the core backend agreed",
      ).toHaveBeenCalledWith(true, 7, "decrease"),
    );
  });

  it("rolls the quantity back when the core backend refuses the change", async () => {
    UpdateCart.mockResolvedValue(false);
    const { updateQuantity, setLoading } = await renderWidget(
      { product: productWithVariations },
      [{ id: 101, item_id: "cart-2", quantity: 2, product_variation_id: 7 }],
    );

    await userEvent.click(minus());

    await waitFor(() =>
      expect(
        updateQuantity,
        "the core backend refused and the widget did not roll back",
      ).toHaveBeenCalledWith(false),
    );
    expect(
      setLoading,
      "the spinner must stop after a refusal",
    ).toHaveBeenLastCalledWith(false);
  });

  it("falls back to the product's own row when the picked variant has no id", async () => {
    RemoveFromCart.mockResolvedValue(true);
    const { updateQuantity } = await renderWidget(
      { product: productWithVariations, selectedVariant: {} },
      [{ id: 101, item_id: "cart-9", quantity: 1, product_variation_id: 4 }],
    );

    await userEvent.click(minus());

    expect(
      RemoveFromCart.mock.calls[0]?.[0]?.cart_item?.item_id,
      "with no variant id the widget must remove the product's own row",
    ).toBe("cart-9");
    await waitFor(() =>
      expect(
        updateQuantity,
        "the quantity was not rolled down after the removal",
      ).toHaveBeenCalledWith(true, 4, "decrease"),
    );
  });

  it("minus falls back to the product's row when the picked variant is not in the bag", async () => {
    // A variant id that matches no bag row: the widget still shows the total
    // for the product, and minus finds the product's row by id.
    RemoveFromCart.mockResolvedValue(true);
    await renderWidget(
      {
        product: productWithVariations,
        selectedVariant: { id: 99 },
      },
      [{ id: 101, item_id: "cart-5", quantity: 1, product_variation_id: 4 }],
    );

    await userEvent.click(minus());

    expect(
      RemoveFromCart.mock.calls[0]?.[0]?.cart_item?.item_id,
      "minus must fall back to the product's row when the variant is not in the bag",
    ).toBe("cart-5");
  });
});

describe("the notify part of the out-of-stock widget", () => {
  it("asks to notify the shopper when the button is tapped", async () => {
    const { notifyAction } = await renderWidget();

    await userEvent.click(screen.getByText("Notify Me When Variant Is Available"));

    expect(notifyAction, "tapping the button did not ask to notify").toHaveBeenCalled();
  });

  it("does not ask to notify when the shopper taps minus", async () => {
    RemoveFromCart.mockResolvedValue(true);
    const { notifyAction } = await renderWidget({}, [
      { id: 101, item_id: "cart-1", quantity: 1, product_variation_id: 7 },
    ]);

    await userEvent.click(minus());

    expect(
      notifyAction,
      "tapping minus also asked to notify the shopper",
    ).not.toHaveBeenCalled();
  });

  it("says the shopper will be told once they asked", async () => {
    await renderWidget({ isNotified: true, loading: true });

    expect(
      screen.getByText("We Will Inform You When Variant Is Available"),
      "a shopper who asked was not told they will be informed",
    ).toBeInTheDocument();
  });
});
