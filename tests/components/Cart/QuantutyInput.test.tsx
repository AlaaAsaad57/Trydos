// Moving a cart row to Out-Of-Bag, from the shopper's side of the button.
//
// `QuantutyInput` is the row of controls under each cart item. The button
// labelled "Reschedule" moves the item out of the cart and into Out-Of-Bag.
//
// This file guards one finding: the row was deleted from the cart on screen
// whether or not the core backend actually moved it. The service swallowed the
// refusal and reported nothing, so the caller had nothing to check. The item
// then sat in neither list until the shopper reloaded the page.
//
// The cart service is replaced rather than answered, because this file is about
// what the screen does with the answer, not about the request.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuantutyInput } from "components/Cart";

import { renderWithProviders, screen, userEvent } from "../../render";

const ConvertToOldCart = vi.fn();
// The plus and minus controls go through `UpdateCart`
// (components/Cart/index.tsx:503-507). It is spied rather than answered,
// because these cases are about the number the screen asks for, not the
// request. It resolves true so the handler follows its success path.
const UpdateCart = vi.fn().mockResolvedValue(true);

vi.mock("services/cart", () => ({
  default: {
    ConvertToOldCart: (...args: any[]) => ConvertToOldCart(...args),
    UpdateCart: (...args: any[]) => UpdateCart(...args),
  },
}));

const trackOrder = vi.fn();

vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: {
    CART_ITEM_MOVED_TO_OLD: "cart_item_moved_to_old",
    CART_ITEM_QTY_INCREASED: "cart_item_qty_increased",
    CART_ITEM_QTY_DECREASED: "cart_item_qty_decreased",
    CART_ITEM_REMOVED: "cart_item_removed",
  },
  trackOrder: (...args: any[]) => trackOrder(...args),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  getOldCart: vi.fn().mockResolvedValue(undefined),
  // Both quantity handlers re-read the whole bag once the service answers
  // (components/Cart/index.tsx:570-575, :615-619). Left unanswered it would
  // reach the network, which the fake network turns into a failed test.
  getCart: vi.fn().mockResolvedValue({ cart: [] }),
}));

/** The one row in the cart, as the cart page holds it. */
const cartRow = {
  id: "cart-99",
  product_id: 101,
  name: "Blue shirt",
  price: 100,
  offer_price: 80,
  quantity: 1,
};

async function openTheCartRowAndReschedule() {
  const rendered = await renderWithProviders(
    <QuantutyInput
      value={1}
      setValue={() => {}}
      max={5}
      deleteFunction={() => {}}
      id={cartRow.id}
      disabled={false}
      updateData={() => {}}
      product={cartRow}
    />,
    {
      country: "sy",
      path: "/cart",
      store: {
        cart: [{ ...cartRow }],
        localCart: [{ id: 101, item_id: cartRow.id, quantity: 1 }],
        currency: { symbol: "$", exchange_rate: 1, decimal_digits: 2 },
      },
    },
  );

  await userEvent.click(screen.getByText("Reschedule"));
  return rendered;
}

describe("moving a cart row to Out-Of-Bag", () => {
  beforeEach(() => {
    trackOrder.mockClear();
  });

  it("keeps the row in the cart when the core backend refuses the move", async () => {
    // What the fixed service reports on a refusal: it did not move.
    ConvertToOldCart.mockResolvedValue(false);

    const { store } = await openTheCartRowAndReschedule();

    expect(
      store.getState().cart.map((s: any) => s.id),
      "the core backend refused the move and the cart page deleted the row anyway, so the item is in neither the cart nor Out-Of-Bag until the shopper reloads",
    ).toEqual(["cart-99"]);
  });

  it("takes the row out of the cart when the core backend moved it", async () => {
    ConvertToOldCart.mockResolvedValue(true);

    const { store } = await openTheCartRowAndReschedule();

    expect(
      store.getState().cart.map((s: any) => s.id),
      "the core backend moved the item to Out-Of-Bag and the cart page still lists it",
    ).toEqual([]);
  });

  it("reports the move to the order funnel only once the item has moved", async () => {
    ConvertToOldCart.mockResolvedValue(true);

    await openTheCartRowAndReschedule();

    expect(
      trackOrder.mock.calls.map(([event]: any) => event),
      "the order funnel was not told that the item moved to Out-Of-Bag",
    ).toEqual(["cart_item_moved_to_old"]);
  });

  it("does not report a move the core backend refused", async () => {
    ConvertToOldCart.mockResolvedValue(false);

    await openTheCartRowAndReschedule();

    expect(
      trackOrder.mock.calls.map(([event]: any) => event),
      "the order funnel was told the item moved to Out-Of-Bag, but the core backend refused the move",
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The plus and minus controls, and what a row draws at quantity 1.
//
// AC-12 and AC-13 of _specs/checkout-address-totals-and-cart-lines.
//
// The markers here are `data-pw`, and Testing Library in this suite is not
// configured to read them — that mapping is `playwright.config.ts`, for the
// browser suite. So these cases query the DOM directly, the way
// tests/components/Cart/AddressListContainer.test.tsx does.
const marked = (marker: string): HTMLElement | null =>
  document.querySelector(`[data-pw="${marker}"]`);

const mustFind = (marker: string): HTMLElement => {
  const found = marked(marker);
  if (!found) throw new Error(`the cart row never drew the "${marker}" control`);
  return found;
};

/** One cart row at the quantity given, with nothing pressed yet. */
async function openTheCartRowAt(quantity: number, deleteFunction = () => {}) {
  return renderWithProviders(
    <QuantutyInput
      value={quantity}
      setValue={() => {}}
      max={5}
      deleteFunction={deleteFunction}
      id={cartRow.id}
      disabled={false}
      updateData={() => {}}
      product={{ ...cartRow, quantity }}
    />,
    {
      country: "sy",
      path: "/cart",
      store: {
        cart: [{ ...cartRow, quantity }],
        localCart: [{ id: 101, item_id: cartRow.id, quantity }],
        currency: { symbol: "$", exchange_rate: 1, decimal_digits: 2 },
      },
    },
  );
}

describe("changing the quantity of a cart row", () => {
  beforeEach(() => {
    UpdateCart.mockClear();
    trackOrder.mockClear();
  });

  it("plus asks the core backend for one more than the row holds", async () => {
    await openTheCartRowAt(2);

    await userEvent.click(mustFind("PlusIcon_CartPage"));

    // The number inside the request is the point. Asserting only that the
    // service was called would pass on any off-by-one.
    expect(
      UpdateCart,
      "pressing plus never reached the cart service, so the core backend was never asked",
    ).toHaveBeenCalled();
    expect(
      UpdateCart.mock.calls[0]?.[0],
      "pressing plus on a row of 2 asked the core backend for the wrong quantity",
    ).toEqual({ cart_id: cartRow.id, qty: 3 });
  });

  it("minus asks the core backend for one fewer than the row holds", async () => {
    await openTheCartRowAt(2);

    await userEvent.click(mustFind("MinusIcon_CartPage"));

    expect(
      UpdateCart,
      "pressing minus never reached the cart service, so the core backend was never asked",
    ).toHaveBeenCalled();
    expect(
      UpdateCart.mock.calls[0]?.[0],
      "pressing minus on a row of 2 asked the core backend for the wrong quantity",
    ).toEqual({ cart_id: cartRow.id, qty: 1 });
  });
});

describe("which controls a cart row draws", () => {
  beforeEach(() => {
    UpdateCart.mockClear();
    trackOrder.mockClear();
  });

  it("a row of 1 offers delete and no minus", async () => {
    // At quantity 1 the delete control takes the minus control's place
    // (components/Cart/index.tsx:732). The two are branches of one ternary, so
    // only ever one of them is on screen.
    await openTheCartRowAt(1);

    expect(
      marked("MinusIcon_CartPage"),
      "a row holding one item still offers minus, which would ask the core backend for a quantity of 0",
    ).toBeNull();
    expect(
      marked("DeleteIcon_CartPage"),
      "a row holding one item offers no way to take it out of the bag",
    ).not.toBeNull();
  });

  it("a row above 1 offers both minus and delete", async () => {
    await openTheCartRowAt(2);

    expect(
      marked("MinusIcon_CartPage"),
      "a row holding more than one item offers no way to lower the quantity",
    ).not.toBeNull();
    expect(
      marked("DeleteIcon_CartPage"),
      "a row holding more than one item offers no way to take it out of the bag",
    ).not.toBeNull();
  });

  it("the delete control on a row of 1 removes the row", async () => {
    const deleteFunction = vi.fn();
    await openTheCartRowAt(1, deleteFunction);

    await userEvent.click(mustFind("DeleteIcon_CartPage"));

    expect(
      deleteFunction,
      "pressing delete on a row holding one item did not remove it",
    ).toHaveBeenCalled();
  });
});
