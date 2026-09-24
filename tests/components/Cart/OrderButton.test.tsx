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

import { useNotificationStore } from "store/notifications/reducer";

import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../render";

// The checkout check (GoToOrders) reloads the cart, reads the profile from the
// core backend and asks the auth service who is signed in. All three are
// replaced so no request leaves the test.
const getCartMock = vi.fn();
const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getCart: (...args: any[]) => getCartMock(...args),
    LogError: (...args: any[]) => logError(...args),
  };
});
const getCustomerInfo = vi.fn();
vi.mock("services/home", () => ({
  default: { getCustomerInfo: (...args: any[]) => getCustomerInfo(...args) },
}));
const getUser = vi.fn();
vi.mock("services/auth", () => ({
  default: { getUser: (...args: any[]) => getUser(...args) },
}));
vi.mock("components/Login/Enhanced/InlineVerifyPanel", () => ({
  default: ({ onClose, onSuccess, phoneLocked }: any) => (
    <div data-testid="inline-verify" data-locked={String(Boolean(phoneLocked))}>
      <button onClick={onClose}>verify-close</button>
      <button onClick={onSuccess}>verify-success</button>
    </div>
  ),
}));

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

describe("the Confirm & Continue button", () => {
  const verifiedProfile = { is_phone_verified: 1, phone: "+000" };
  const availableRow = { id: "r1", check_availability: true, is_active: true };

  beforeEach(() => {
    trackOrder.mockClear();
    getCartMock.mockReset();
    getCustomerInfo.mockReset();
    getUser.mockReset();
    logError.mockClear();
    useNotificationStore.setState({ notifications: [] });
  });

  const errorShown = (message: string) =>
    useNotificationStore
      .getState()
      .notifications.some((n: any) => n.type === "error" && n.message === message);

  const renderButton = async (
    storeOverrides: Record<string, unknown> = {},
    props: { close?: () => void; toOrders?: () => void } = {},
  ) => {
    const close = props.close ?? vi.fn();
    const toOrders = props.toOrders ?? vi.fn();
    await renderWithProviders(<OrderButton close={close} toOrders={toOrders} />, {
      country: "sy",
      path: "/cart",
      store: money({ initCart: vi.fn(), ...storeOverrides }),
    });
    return { close, toOrders };
  };

  it("goes on to checkout when every item is available and the phone is verified", async () => {
    getUser.mockReturnValue({ id: 1 });
    getCustomerInfo.mockResolvedValue(verifiedProfile);
    getCartMock.mockImplementation(async ({ callback }: any) => {
      callback([undefined]);
      return { cart: [availableRow] };
    });
    const initCart = vi.fn();
    const { toOrders } = await renderButton({ user: { id: 1 }, userProfile: verifiedProfile, initCart });

    await userEvent.click(mustFind("Confirm-Order-Button"));

    await waitFor(() => {
      expect(toOrders, "a clean cart must move on to the checkout screen").toHaveBeenCalled();
    });
    expect(initCart, "an empty cart reload must start an empty cart").toHaveBeenCalledWith({ cart: [] });
  });

  it("stays on the cart when the reloaded cart turns out to be empty", async () => {
    getUser.mockReturnValue({ id: 1 });
    getCustomerInfo.mockResolvedValue(verifiedProfile);
    getCartMock.mockResolvedValue({ cart: [] });
    const { toOrders } = await renderButton({ user: { id: 1 }, userProfile: verifiedProfile });

    await userEvent.click(mustFind("Confirm-Order-Button"));

    await waitFor(() => {
      expect(marked("confirm-text"), "the button should come back after the check").not.toBeNull();
    });
    expect(toOrders, "an empty cart must not open the checkout").not.toHaveBeenCalled();
  });

  it("tells the shopper to review the cart when an item is not available", async () => {
    getUser.mockReturnValue({ id: 1 });
    getCustomerInfo.mockResolvedValue(verifiedProfile);
    getCartMock.mockResolvedValue({ cart: [{ ...availableRow, check_availability: false }] });
    const { toOrders } = await renderButton({ user: { id: 1 }, userProfile: verifiedProfile });

    await userEvent.click(mustFind("Confirm-Order-Button"));

    await waitFor(() => {
      expect(
        errorShown("Please Review Your Cart Some Products Not Available"),
        "an unavailable item must stop checkout with a message",
      ).toBe(true);
    });
    expect(toOrders, "checkout must not open with an unavailable item").not.toHaveBeenCalled();
  });

  it("opens the phone check without a message when the core backend says the phone is not verified", async () => {
    getUser.mockReturnValue({ id: 1 });
    getCustomerInfo.mockResolvedValue({ is_phone_verified: 0 });
    getCartMock.mockResolvedValue({ cart: [availableRow] });
    await renderButton({ user: { id: 1 }, userProfile: verifiedProfile });

    await userEvent.click(mustFind("Confirm-Order-Button"));

    expect(await screen.findByTestId("inline-verify"), "the phone check must open").toBeInTheDocument();
    expect(logError, "the refusal should be logged").toHaveBeenCalled();
    expect(
      useNotificationStore.getState().notifications,
      "an unverified phone is not an error message",
    ).toEqual([]);
  });

  it("shows the error when the cart reload fails", async () => {
    getUser.mockReturnValue({ id: 1 });
    getCartMock.mockRejectedValue(new Error("cart reload failed"));
    await renderButton({ user: { id: 1 }, userProfile: verifiedProfile });

    await userEvent.click(mustFind("Confirm-Order-Button"));

    await waitFor(() => {
      expect(errorShown("cart reload failed"), "the failure reason should be shown").toBe(true);
    });
  });

  it("asks a guest to verify first, then goes to checkout once verified", async () => {
    getUser.mockReturnValue(null);
    getCustomerInfo.mockResolvedValue(verifiedProfile);
    getCartMock.mockResolvedValue({ cart: [availableRow] });
    const { toOrders } = await renderButton({
      user: null,
      userProfile: { phone: "+000", is_phone_verified: 0 },
    });

    await userEvent.click(mustFind("Confirm-Order-Button"));
    const panel = await screen.findByTestId("inline-verify");
    expect(panel.getAttribute("data-locked"), "a known phone should be locked in the panel").toBe("true");

    // A second tap on the button while the panel is open does nothing.
    await userEvent.click(mustFind("Confirm-Order-Button"));
    expect(getCartMock, "tapping while the panel is open must not start checkout").not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("verify-success"));
    await waitFor(() => {
      expect(toOrders, "a verified guest must move on to checkout").toHaveBeenCalled();
    });
  });

  it("closes the phone check when the shopper closes it", async () => {
    getUser.mockReturnValue(null);
    await renderButton({ user: null, userProfile: { phone: null } });

    await userEvent.click(mustFind("Confirm-Order-Button"));
    const panel = await screen.findByTestId("inline-verify");
    expect(panel.getAttribute("data-locked"), "no known phone means the field is open").toBe("false");
    await userEvent.click(screen.getByText("verify-close"));
    expect(screen.queryByTestId("inline-verify"), "closing must hide the phone check").toBeNull();
  });

  it("asks a signed-in shopper with no user row in the store to verify after the check", async () => {
    getUser.mockReturnValue({ id: 1 });
    getCustomerInfo.mockResolvedValue(verifiedProfile);
    getCartMock.mockResolvedValue({ cart: [availableRow] });
    const { toOrders } = await renderButton({ user: null, userProfile: verifiedProfile });

    await userEvent.click(mustFind("Confirm-Order-Button"));

    expect(await screen.findByTestId("inline-verify"), "the phone check must open").toBeInTheDocument();
    expect(toOrders, "checkout must wait for the phone check").not.toHaveBeenCalled();
  });

  it("sends the shopper back when the bag is empty", async () => {
    const { close } = await renderButton({ cart: [] });
    expect(marked("backHome-text"), "an empty bag shows Back To HomePage").not.toBeNull();
    await userEvent.click(mustFind("Confirm-Order-Button"));
    expect(close, "an empty bag must close the cart").toHaveBeenCalled();
  });

  it("shows the cash total when cash on delivery is the chosen payment", async () => {
    await renderButton({ total_cash: 99, orderData: { payment: [{ id: 0 }] } });
    expect(figure("offer-total-price"), "cash on delivery must show the cash total").toBe("99");
  });

  it("folds the breakdown again when the dark backdrop is tapped", async () => {
    await renderButton();
    await userEvent.click(mustFind("total-expanded"));
    expect(marked("cart-total-price"), "the breakdown should be open").not.toBeNull();
    await userEvent.click(document.querySelector(".opacity-40")!);
    expect(marked("cart-total-price"), "a tap on the backdrop must fold the breakdown").toBeNull();
  });
  it("folds the breakdown when the shopper swipes it down", async () => {
    await renderButton();
    await userEvent.click(mustFind("total-expanded"));
    expect(marked("cart-total-price"), "the breakdown should be open").not.toBeNull();
    const area = mustFind("overflow-hidden-container");
    fireEvent.mouseDown(area, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 10, clientY: 120 });
    fireEvent.mouseUp(document, { clientX: 10, clientY: 120 });
    await waitFor(() => {
      expect(marked("cart-total-price"), "a downward swipe must fold the breakdown").toBeNull();
    });
  });
});
