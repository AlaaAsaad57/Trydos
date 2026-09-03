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

vi.mock("services/cart", () => ({
  default: {
    ConvertToOldCart: (...args: any[]) => ConvertToOldCart(...args),
  },
}));

const trackOrder = vi.fn();

vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: { CART_ITEM_MOVED_TO_OLD: "cart_item_moved_to_old" },
  trackOrder: (...args: any[]) => trackOrder(...args),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  getOldCart: vi.fn().mockResolvedValue(undefined),
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
