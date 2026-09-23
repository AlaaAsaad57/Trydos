// The bottom bar of the checkout screen (components/Cart/PlaceOrderButtons.tsx):
// the "I read and agree" row, the Place Order button, and the Done button that
// replaces it once the order is placed.
//
// Place Order runs these steps, and each one is checked on its own below:
//   1. the shopper must have agreed to the policies (else the row shakes);
//   2. the cart is reloaded from the core backend;
//   3. a shopper whose phone is not verified is sent back to the cart;
//   4. an empty cart is sent back to the cart;
//   5. a cart with an unavailable row is sent back with an error;
//   6. otherwise the order goes on — through the RDB payment screen when the
//      RDB wallet (payment id 1) is picked, straight to `successOrder` if not.
import { beforeEach, describe, expect, it, vi } from "vitest";

import PlaceOrderButtons from "components/Cart/PlaceOrderButtons";
import { fetchData } from "utils/fetchData";
import { getCart, LogError } from "utils/functions";
import { trackOrder } from "utils/orderFunnel";
import { useNotificationStore } from "store/notifications/reducer";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

vi.mock("utils/fetchData", () => ({ fetchData: vi.fn() }));

vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("utils/functions")>();
  return { ...actual, getCart: vi.fn(), LogError: vi.fn() };
});

vi.mock("utils/orderFunnel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("utils/orderFunnel")>();
  return { ...actual, trackOrder: vi.fn() };
});

// The RDB payment screen has its own test file. Here it only hands back its
// two callbacks.
vi.mock("components/Cart/RdbPaymentModal", () => ({
  default: ({ onSuccess, onClose }: any) => (
    <div data-testid="rdb-modal">
      <button onClick={onSuccess}>rdb paid</button>
      <button onClick={onClose}>rdb close</button>
    </div>
  ),
}));

const okRow = { id: 1, check_availability: true, is_country_restricted: false, is_active: true };

const baseStore = (extra: Record<string, any> = {}) => ({
  orderData: {
    data: null,
    payment: [],
    coupon: false,
    agree: true,
    coupon_number: "",
    loading: false,
    success: false,
  },
  cart: [okRow],
  total: 100,
  total_cash: 110,
  currency: { symbol: "$", decimal_digits: 2 },
  userProfile: { is_phone_verified: 1 },
  initCart: vi.fn(),
  setIsNavigating: vi.fn(),
  setCouponDiscount: vi.fn(),
  ...extra,
});

const withOrderData = (orderData: Record<string, any>, extra: Record<string, any> = {}) => {
  const base = baseStore(extra);
  return { ...base, orderData: { ...base.orderData, ...orderData } };
};

const props = () => ({
  orderLoading: false,
  successOrder: vi.fn(),
  backToCart: vi.fn(),
  close: vi.fn(),
});

const placeOrderButton = () =>
  document.querySelector('[data-pw="Place-Order-Buttons"]') as HTMLElement;

const errorShown = (message: string) =>
  useNotificationStore
    .getState()
    .notifications.some((n) => n.type === "error" && n.message === message);

/** getCart calls its callback with [data] and resolves to the cart it loaded. */
const cartReload = (rows: any[] | undefined) =>
  vi.mocked(getCart).mockImplementationOnce(async ({ callback }: any) => {
    callback([rows ? { cart: rows } : undefined]);
    return { cart: rows ?? [] } as any;
  });

describe("PlaceOrderButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({ notifications: [] });
  });

  describe("the agree row", () => {
    it("records approval with the core backend when the shopper agrees", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });
      const { store } = await renderWithProviders(<PlaceOrderButtons {...props()} />, {
        store: withOrderData({ agree: false }),
      });

      fireEvent.click(document.querySelector('[data-pw="read-and-agree"]')!);
      await waitFor(() => {
        expect(store.getState().orderData.agree, "agreeing should set agree to true").toBe(true);
      });
      expect(fetchData, "agreeing should be sent to the core backend").toHaveBeenCalledWith(
        expect.objectContaining({ url: "/customer/approve-policies", server: "market" }),
      );
      expect(trackOrder, "agreeing should be reported").toHaveBeenCalledWith(
        "terms_agreed_toggled",
        { agreed: true },
      );
    });

    it("still records the tick and logs it when the core backend refuses the approval call", async () => {
      vi.mocked(fetchData).mockRejectedValueOnce(new Error("down"));
      const { store } = await renderWithProviders(<PlaceOrderButtons {...props()} />, {
        store: withOrderData({ agree: false }),
      });

      fireEvent.click(document.querySelector('[data-pw="read-and-agree"]')!);
      await waitFor(() => {
        expect(LogError, "a failed approval call should be logged").toHaveBeenCalledWith(
          expect.objectContaining({ scenario: "error in agree to policy - setAgree - cart widget" }),
        );
      });
      expect(store.getState().orderData.agree, "the tick should still be set").toBe(true);
    });

    it("un-ticks without calling the core backend, and ignores a tap while the first is running", async () => {
      let answer: (v: any) => void = () => {};
      vi.mocked(fetchData).mockReturnValueOnce(
        new Promise((resolve) => {
          answer = resolve;
        }) as any,
      );
      const { store } = await renderWithProviders(<PlaceOrderButtons {...props()} />, {
        store: withOrderData({ agree: false }),
      });
      const row = document.querySelector('[data-pw="read-and-agree"]')!;

      fireEvent.click(row);
      fireEvent.click(row);
      expect(fetchData, "a second tap while agreeing must not send a second call").toHaveBeenCalledTimes(1);
      await act(async () => answer({ success: true }));
      await waitFor(() => {
        expect(row.getAttribute("data-agreed"), "the row should now be ticked").toBe("true");
      });

      fireEvent.click(row);
      await waitFor(() => {
        expect(store.getState().orderData.agree, "a second tap should un-tick").toBe(false);
      });
      expect(fetchData, "un-ticking must not call the core backend").toHaveBeenCalledTimes(1);
    });
  });

  describe("Place Order", () => {
    it("shakes the agree row and does nothing else when the shopper has not agreed", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const p = props();
      await renderWithProviders(<PlaceOrderButtons {...p} />, { store: withOrderData({ agree: false }) });
      const row = document.querySelector(".agree-valid-border") as HTMLElement;
      row.scrollIntoView = vi.fn();

      fireEvent.click(placeOrderButton());
      expect(row.classList.contains("shake-anim"), "the agree row should shake").toBe(true);
      expect(trackOrder, "the block should be reported").toHaveBeenCalledWith(
        "place_order_blocked_terms_not_agreed",
      );
      expect(getCart, "no cart reload may start without agreement").not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1300);
      });
      expect(row.classList.contains("shake-anim"), "the shake should stop after 1.3 s").toBe(false);
      vi.useRealTimers();
    });

    it("does not shake when the agree row is not on the page", async () => {
      const p = props();
      await renderWithProviders(<PlaceOrderButtons {...p} />, { store: withOrderData({ agree: false }) });
      document.querySelector(".agree-valid-border")!.classList.remove("agree-valid-border");

      fireEvent.click(placeOrderButton());
      expect(trackOrder, "the block should still be reported").toHaveBeenCalledWith(
        "place_order_blocked_terms_not_agreed",
      );
    });

    it("places the order when the reloaded cart is all available and no RDB payment is picked", async () => {
      cartReload([okRow]);
      const p = props();
      const s = baseStore();
      await renderWithProviders(<PlaceOrderButtons {...p} />, { store: s });

      fireEvent.click(placeOrderButton());
      await waitFor(() => {
        expect(p.successOrder, "a good cart should go on to place the order").toHaveBeenCalled();
      });
      expect(s.initCart, "the reloaded cart should be stored").toHaveBeenCalledWith({ cart: [okRow] });
      expect(p.backToCart, "a good cart must not be sent back").not.toHaveBeenCalled();
    });

    it("opens the RDB payment screen when the RDB wallet is picked, and places the order once it is paid", async () => {
      cartReload([okRow]);
      const p = props();
      await renderWithProviders(<PlaceOrderButtons {...p} />, {
        store: withOrderData({ payment: [{ id: 1, balance: 100 }] }),
      });

      fireEvent.click(placeOrderButton());
      fireEvent.click(await screen.findByText("rdb paid"));
      expect(p.successOrder, "a paid RDB request should place the order").toHaveBeenCalled();
      expect(screen.queryByTestId("rdb-modal"), "the payment screen should close").toBeNull();
      expect(trackOrder, "opening the payment screen should be reported").toHaveBeenCalledWith(
        "wallet_modal_opened",
      );
    });

    it("closes the RDB payment screen without placing the order when the shopper closes it", async () => {
      cartReload([okRow]);
      const p = props();
      await renderWithProviders(<PlaceOrderButtons {...p} />, {
        store: withOrderData({ payment: [{ id: 1, balance: 100 }] }),
      });

      fireEvent.click(placeOrderButton());
      fireEvent.click(await screen.findByText("rdb close"));
      expect(screen.queryByTestId("rdb-modal"), "the payment screen should close").toBeNull();
      expect(p.successOrder, "closing must not place the order").not.toHaveBeenCalled();
    });

    it("sends a shopper with an unverified phone back to the cart", async () => {
      cartReload([okRow]);
      const p = props();
      await renderWithProviders(<PlaceOrderButtons {...p} />, {
        store: baseStore({ userProfile: { is_phone_verified: 0 } }),
      });

      fireEvent.click(placeOrderButton());
      await waitFor(() => {
        expect(p.backToCart, "an unverified phone should go back to the cart").toHaveBeenCalled();
      });
      expect(errorShown("Please Verify Your Phone Number"), "the shopper should be told why").toBe(true);
      expect(p.successOrder, "no order may be placed").not.toHaveBeenCalled();
    });

    it("sends the shopper back when the reloaded cart is empty", async () => {
      cartReload(undefined);
      const p = props();
      const s = baseStore();
      await renderWithProviders(<PlaceOrderButtons {...p} />, { store: s });

      fireEvent.click(placeOrderButton());
      await waitFor(() => {
        expect(p.backToCart, "an empty cart should go back to the cart").toHaveBeenCalled();
      });
      expect(s.initCart, "an empty reload should start an empty cart").toHaveBeenCalledWith({ cart: [] });
      expect(trackOrder, "the empty cart should be reported").toHaveBeenCalledWith(
        "place_order_empty_cart",
      );
    });

    it("sends the shopper back with an error when a cart row is not available", async () => {
      cartReload([okRow, { ...okRow, id: 2, is_active: false }]);
      const p = props();
      await renderWithProviders(<PlaceOrderButtons {...p} />, { store: baseStore() });

      fireEvent.click(placeOrderButton());
      await waitFor(() => {
        expect(
          errorShown("Please Review Your Cart Some Products Not Available"),
          "the shopper should be told some products are not available",
        ).toBe(true);
      });
      expect(p.backToCart, "the shopper should go back to the cart").toHaveBeenCalled();
      expect(trackOrder, "the block should be reported with its reason").toHaveBeenCalledWith(
        "place_order_blocked_cart_unavailable",
        { reason: "Please Review Your Cart Info" },
      );
    });

    it("reports a non-Error failure of the cart reload as text", async () => {
      vi.mocked(getCart).mockRejectedValueOnce("offline");
      const p = props();
      await renderWithProviders(<PlaceOrderButtons {...p} />, { store: baseStore() });

      fireEvent.click(placeOrderButton());
      await waitFor(() => {
        expect(trackOrder, "the reason should be the thrown text").toHaveBeenCalledWith(
          "place_order_blocked_cart_unavailable",
          { reason: "offline" },
        );
      });
    });

    it("shows a spinner and ignores taps while the order is loading", async () => {
      await renderWithProviders(<PlaceOrderButtons {...props()} orderLoading={true} />, {
        store: withOrderData({ loading: true }),
      });

      fireEvent.click(placeOrderButton());
      expect(getCart, "a tap while loading must not start a second check").not.toHaveBeenCalled();
      expect(screen.queryByText("Place Order"), "the label should give way to a spinner").toBeNull();
    });

    it("shows the cash total when cash on delivery is picked, and the normal total otherwise", async () => {
      await renderWithProviders(<PlaceOrderButtons {...props()} />, {
        store: withOrderData({ payment: [{ id: 0, balance: 110 }] }),
      });
      expect(placeOrderButton().textContent, "cash on delivery should show total_cash").toContain("110");
    });

    it("shows the normal total when no cash payment is picked, in Arabic order", async () => {
      await renderWithProviders(<PlaceOrderButtons {...props()} />, {
        store: baseStore({ language: "ar" }),
        language: "ar",
      });
      expect(placeOrderButton().textContent, "the normal total should be shown").toContain("100");
    });
  });

  describe("after the order is placed", () => {
    it("resets the checkout, empties the cart and goes home when Done is pressed", async () => {
      const p = props();
      const s = withOrderData({ success: true, agree: true, payment: [{ id: 0 }] });
      const { store } = await renderWithProviders(<PlaceOrderButtons {...p} />, { store: s });

      expect(placeOrderButton(), "Place Order must be gone once the order is placed").toBeNull();
      const done = document.querySelector('[data-pw="back-to-home-page"]') as HTMLAnchorElement;
      expect(done.getAttribute("href"), "Done should link to the home page of this locale").toBe("/gb-en");
      done.addEventListener("click", (e) => e.preventDefault());

      fireEvent.click(done);
      expect(s.setIsNavigating, "going home should show the navigation state").toHaveBeenCalledWith({
        is_full_home: true,
      });
      expect(store.getState().orderData.success, "the checkout should be reset").toBe(false);
      expect(s.initCart, "the cart should be emptied").toHaveBeenCalledWith({ cart: [] });
      expect(s.setCouponDiscount, "the coupon discount should be cleared").toHaveBeenCalledWith(null);
      expect(p.close, "the checkout should close").toHaveBeenCalled();
      expect(trackOrder, "Done should be reported").toHaveBeenCalledWith("order_success_done_clicked");
    });
  });
});
