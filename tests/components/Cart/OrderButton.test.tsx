// The money the cart shows the shopper, from the shopper's side of the screen.
//
// AC-6 and AC-7 of _specs/checkout-address-totals-and-cart-lines.
//
// Two figures sit in this row and they are **not** the same number:
//
//   `offer-total-price`  the payable total — what the shop will charge.
//   `cart-total-price`   labelled "Price" / "Normal Price" — the payable total
//                        plus the discount minus the shipping, so the price
//                        before the shop took anything off and before delivery.
//
// The second is the one a reader mistakes for the total. It is not, and the
// browser suite had a locator called `cart.total` pointing straight at it.
//
// Three facts about the component decide how this file is written:
//
//   * The whole row draws nothing while the bag is empty
//     (components/Cart/OrderButton.tsx:267), so the store needs a `cart` row.
//   * It reads `currency.symbol` with no optional chaining (:388) while the
//     store's `currency` starts as `null`, so the store needs a currency.
//   * "Normal Price" and the shipping line live inside `{expanded && …}` (:325)
//     and `expanded` starts `false` (:41). Nothing shows them until
//     `total-expanded` (:520) is clicked, and that control is a toggle — click
//     it twice and they are hidden again. `offer-total-price` (:572) sits
//     outside that block and needs no click at all.
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrderButton from "components/Cart/OrderButton";

import { renderWithProviders, userEvent } from "../../render";

// The mount effect reports the discount to the order funnel whenever
// `total_discount > 0` (components/Cart/OrderButton.tsx:46-57), and this
// file's fixture sets 20. The real helper is replaced so the render stays a
// render — the sibling file does the same for the same reason.
const trackOrder = vi.fn();

vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: { DISCOUNT_TOTALS_SHOWN: "discount_totals_shown" },
  trackOrder: (...args: any[]) => trackOrder(...args),
}));

// The four figures the core backend sends. Written as constants, and asserted
// as literals below — never recomputed the way the component computes them,
// because then a wrong component and a wrong expectation would agree.
const TOTAL = 80;
const DISCOUNT = 20;
const SHIPPING = 15;

// 80 + 20 − 15 = 85. The point of these three numbers is that the wrong
// formulas all give something else: 80 + 20 = 100, 80 − 15 = 65,
// 80 + 15 = 95, and 80 on its own = 80. With the fixture's default shipping of
// 0 the right answer and "total + discount" would both be 100, and a dropped
// shipping term would pass.
const NORMAL_PRICE = 85;

/** One row in the bag — enough for the row to draw at all. */
const cartRow = {
  id: "cart-row-1",
  product_id: 101,
  name: "Blue shirt",
  price: 100,
  offer_price: 80,
  quantity: 1,
};

const money = (overrides: Record<string, unknown> = {}) => ({
  cart: [{ ...cartRow }],
  localCart: [{ id: 101, item_id: cartRow.id, quantity: 1 }],
  currency: { symbol: "$", exchange_rate: 1, decimal_digits: 2 },
  total: TOTAL,
  total_cash: TOTAL,
  total_discount: DISCOUNT,
  total_shipping_cost: SHIPPING,
  sub_total: TOTAL,
  orderData: null,
  cart_loading: false,
  cartShippingSuccess: null,
  ...overrides,
});

const openTheCart = (storeOverrides: Record<string, unknown> = {}) =>
  renderWithProviders(
    <OrderButton close={() => {}} toOrders={() => {}} />,
    { country: "sy", path: "/cart", store: money(storeOverrides) },
  );

// The markers in this app are `data-pw`, left from an earlier Cypress setup.
// Testing Library here is not configured to read them — that mapping lives in
// `playwright.config.ts` and applies to the browser suite only — so this file
// queries the DOM directly, the way tests/components/Cart/AddressListContainer.test.tsx
// already does.
const marked = (marker: string): HTMLElement | null =>
  document.querySelector(`[data-pw="${marker}"]`);

const mustFind = (marker: string): HTMLElement => {
  const found = marked(marker);
  if (!found) throw new Error(`the cart never drew the "${marker}" element`);
  return found;
};

/** The figures are drawn with a currency symbol beside them, so read the number. */
const figure = (marker: string) =>
  (mustFind(marker).textContent ?? "").replace(/[^0-9.]/g, "");

describe("the payable total on the cart", () => {
  beforeEach(() => {
    trackOrder.mockClear();
  });

  it("is the total the core backend sent", async () => {
    await openTheCart();

    expect(
      figure("offer-total-price"),
      "the cart drew a payable total that is not the total the core backend sent",
    ).toBe(String(TOTAL));
  });

  it("moves when the core backend sends a different total", async () => {
    // Without this the first case would pass against a component that draws a
    // constant, or that reads the sub-total, which happens to be 80 as well.
    await openTheCart({ total: 42, total_cash: 42 });

    expect(
      figure("offer-total-price"),
      "the core backend changed the total and the cart drew the old figure",
    ).toBe("42");
  });
});

describe("the Normal Price beside the total", () => {
  beforeEach(() => {
    trackOrder.mockClear();
  });

  it("is hidden until the shopper opens the breakdown", async () => {
    await openTheCart();

    expect(
      marked("cart-total-price"),
      "the price breakdown was on screen before anyone opened it",
    ).toBeNull();
  });

  it("is the payable total plus the discount minus the shipping", async () => {
    await openTheCart();

    // One click only. The control is a toggle, so a second click hides the
    // block again and the figure disappears.
    await userEvent.click(mustFind("total-expanded"));

    expect(
      figure("cart-total-price"),
      "the Normal Price is not the payable total plus the discount minus the shipping — with 80, 20 and 15 it must read 85",
    ).toBe(String(NORMAL_PRICE));
  });

  it("shows the shipping the core backend sent", async () => {
    await openTheCart();

    await userEvent.click(mustFind("total-expanded"));

    expect(
      figure("Shipping-RoundPrice"),
      "the cart drew a shipping cost that is not the one the core backend sent",
    ).toBe(String(SHIPPING));
  });
});
