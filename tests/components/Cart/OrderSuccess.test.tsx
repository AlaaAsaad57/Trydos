import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import OrderSuccess from "components/Cart/OrderSuccess";
import { GAevent } from "utils/gtag";
import { endOrderAttempt, ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { renderWithProviders } from "../../render";

vi.mock("utils/gtag", () => ({ GAevent: vi.fn() }));
vi.mock("utils/orderFunnel", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, trackOrder: vi.fn(), endOrderAttempt: vi.fn() };
});
vi.mock("services/auth", () => ({ default: { UserID: vi.fn(() => 42) } }));

const cart = [
  {
    product_id: 1,
    name: "Shoe",
    quantity: 2,
    offer_price: 10,
    brand: { name: "Acme", id: 5 },
    category_name: "Shoes",
    category: { id: 9 },
    variant: "Red-M",
  },
  { product_id: 2, name: "Hat", quantity: 1, offer_price: 4 },
];

const gaCall = (action: string) =>
  vi.mocked(GAevent).mock.calls.find(([arg]: any) => arg.action === action)?.[0] as any;

describe("OrderSuccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the order number and reports the purchase once the order succeeded", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    await renderWithProviders(<OrderSuccess />, {
      store: {
        orderData: {
          success: true,
          coupon_number: "SAVE5",
          coupon: 5,
          data: [
            { order_group_id: "GRP-1", order_amount: 30 },
            { order_group_id: "GRP-1", order_amount: 12 },
          ],
        },
        currency: { code: "USD", symbol: "$" },
        total_shipping_cost: 3,
        cart,
      },
    });

    expect(
      screen.getByText("GRP-1"),
      "the success screen must show the order group number",
    ).toBeInTheDocument();

    const purchase = gaCall(GA_EVENT_NAMES.PURCHASE);
    expect(purchase?.params.value, "the purchase value must add up every order in the group").toBe(42);
    expect(purchase?.params.transaction_id, "the purchase must carry the order group id").toBe("GRP-1");
    expect(
      purchase?.params.items[0],
      "a full cart row must be sent with its brand, category and variant",
    ).toMatchObject({ brand: "Acme", brand_id: 5, category: "Shoes", category_id: 9, item_variant: "Red-M" });
    expect(
      purchase?.params.items[1],
      "a cart row with no brand or category must say N/A, not crash",
    ).toMatchObject({ brand: "N/A", brand_id: "N/A", category: "N/A", category_id: "N/A", item_variant: "N/A" });
    expect(gaCall(GA_EVENT_NAMES.SCREEN_VIEW), "the success screen view must be reported").toBeDefined();
    expect(gaCall(GA_EVENT_NAMES.COUPON_USED)?.params.coupon_code, "a used coupon must be reported").toBe("SAVE5");
    expect(trackOrder, "the coupon use must reach the order funnel").toHaveBeenCalledWith(
      ORDER_EVENTS.COUPON_USED,
      expect.objectContaining({ coupon_code: "SAVE5" }),
    );
    expect(trackOrder, "the funnel must record the completed order").toHaveBeenCalledWith(
      ORDER_EVENTS.ORDER_COMPLETED,
      expect.objectContaining({ transaction_id: "GRP-1", value: 42, shipping: 3 }),
    );
    expect(endOrderAttempt, "the order attempt must be closed").toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(scrollIntoView, "the success screen should scroll into view").toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("does not report a coupon when none was used", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Element.prototype.scrollIntoView = vi.fn();
    await renderWithProviders(<OrderSuccess />, {
      store: {
        orderData: { success: true, coupon_number: "", data: [{ order_group_id: "G2", order_amount: 1 }] },
        currency: { code: "USD" },
        cart: [],
      },
    });
    expect(gaCall(GA_EVENT_NAMES.COUPON_USED), "no coupon event without a coupon").toBeUndefined();
    expect(gaCall(GA_EVENT_NAMES.PURCHASE), "the purchase is still reported").toBeDefined();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    vi.useRealTimers();
  });

  it(
    "BUG-cart-401: closing the success screen within 200 ms does not make its scroll timer throw",
    async () => {
      vi.useFakeTimers();
      Element.prototype.scrollIntoView = vi.fn();
      const { unmount } = await renderWithProviders(<OrderSuccess />, {
        store: {
          orderData: { success: true, data: [{ order_group_id: "G3", order_amount: 1 }] },
          currency: { code: "USD" },
          cart: [],
        },
      });
      unmount();
      try {
        expect(
          () => vi.advanceTimersByTime(250),
          "the scroll timer must not throw after the success screen is gone",
        ).not.toThrow();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("reports nothing and stays folded while the order has not succeeded", async () => {
    await renderWithProviders(<OrderSuccess />, {
      store: { orderData: { success: false, data: [] }, cart: [] },
    });
    expect(GAevent, "no purchase may be reported before success").not.toHaveBeenCalled();
    expect(
      document.querySelector(".order-sucess")?.className,
      "the success block must stay folded",
    ).toContain("h-0");
  });
});
