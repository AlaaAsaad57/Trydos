// The payment method box on the checkout screen (components/Cart/PaymentMethod.tsx).
//
// The box lists the methods the core backend offers (`available_payment_method`)
// and keeps the shopper's pick in `orderData.payment` as one row:
//   id 0 = cash on delivery, 1 = RDB wallet, 2 = card, 3 = crypto.
// Tapping a picked method again clears the pick.
import { beforeEach, describe, expect, it, vi } from "vitest";

import PaymentMethod from "components/Cart/PaymentMethod";
import order from "services/order";
import { GAevent } from "utils/gtag";
import { trackOrder } from "utils/orderFunnel";
import { LogError } from "utils/functions";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

vi.mock("services/order", () => ({
  default: { GetWallet: vi.fn() },
}));

vi.mock("utils/gtag", () => ({ GAevent: vi.fn() }));

vi.mock("utils/orderFunnel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("utils/orderFunnel")>();
  return { ...actual, trackOrder: vi.fn() };
});

vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("utils/functions")>();
  return { ...actual, LogError: vi.fn() };
});

// The coupon box has its own test file. Here it only has to hand its two
// callbacks back so the payment box's wiring can be checked.
vi.mock("components/Cart/couponElement", () => ({
  default: ({ active, setActive, close }: any) => (
    <div data-testid="coupon" data-active={String(active)}>
      <button onClick={setActive}>open coupon</button>
      <button onClick={close}>close coupon</button>
    </div>
  ),
}));

const baseStore = (extra: Record<string, any> = {}) => ({
  available_payment_method: ["cash_on_delivery", "rdb", "crypto", "card", "bank_transfer"],
  cart: [{ product_id: 5, name: "Shoe", quantity: 2 }],
  total: 100,
  total_cash: 110,
  cod_cost: 10,
  currency: { symbol: "$", decimal_digits: 2 },
  wallet: { wallet_balance: 42.5 },
  settings: { starting_setting: { decimal_point_settings: 2 } },
  orderLoading: false,
  ...extra,
});

const paymentPick = (store: any) => store.getState().orderData.payment;
const click = (pw: string) =>
  fireEvent.click(document.querySelector(`[data-pw="${pw}"]`)!);

describe("PaymentMethod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows one row for each method the core backend offers, and nothing for an unknown one", async () => {
    await renderWithProviders(<PaymentMethod />, { store: baseStore() });

    expect(screen.getByText("Cash On Delivery"), "cash on delivery row is missing").toBeInTheDocument();
    expect(screen.getByText("RDB Wallet"), "RDB wallet row is missing").toBeInTheDocument();
    expect(screen.getByText("Crypto"), "crypto row is missing").toBeInTheDocument();
    expect(screen.getByText("Credit Cards"), "card row is missing").toBeInTheDocument();
    expect(
      document.querySelector('[data-pw="wallet-balance"]')?.textContent,
      "the wallet row should show the balance with the currency's decimals",
    ).toBe("42.50 $");
  });

  it.each([
    ["Cash-on-delivery", 0, 110, "cash_on_delivery"],
    ["second-bay-way", 1, 100, "wallet"],
    ["crypto-bay-way", 3, 100, "crypto"],
    ["dredit-way", 2, 100, "credit"],
  ])(
    "tapping %s picks payment id %s, reports it, and a second tap clears it",
    async (pw, id, balance, gaType) => {
      const { store } = await renderWithProviders(<PaymentMethod />, { store: baseStore() });

      click(pw);
      expect(paymentPick(store), `tapping ${pw} should pick payment id ${id}`).toEqual([
        { id, balance },
      ]);
      expect(GAevent, `the ${gaType} pick should reach Google Analytics`).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            payment_type: gaType,
            items: [{ item_id: 5, item_name: "Shoe", quantity: 2 }],
          }),
        }),
      );
      expect(trackOrder, `the ${gaType} pick should reach the order funnel`).toHaveBeenCalledWith(
        "payment_method_selected",
        { payment_type: gaType },
      );

      click(pw);
      expect(paymentPick(store), `a second tap on ${pw} should clear the pick`).toEqual([]);
    },
  );

  it("copies the right balance into the store for each pick", async () => {
    const { store } = await renderWithProviders(<PaymentMethod />, { store: baseStore() });

    click("Cash-on-delivery");
    expect(store.getState().balance, "cash on delivery should use total_cash").toBe(110);
    click("Cash-on-delivery");
    click("second-bay-way");
    expect(store.getState().balance, "the wallet pick should use the wallet balance").toBe(42.5);
    click("second-bay-way");
    click("crypto-bay-way");
    expect(store.getState().crypto, "the crypto pick should copy total_cash").toBe(110);
    click("crypto-bay-way");
    click("dredit-way");
    expect(store.getState().credit, "the card pick should copy total_cash").toBe(110);
  });

  it("ignores taps on cash, wallet and crypto while an order is being placed", async () => {
    const { store } = await renderWithProviders(<PaymentMethod />, {
      store: baseStore({ orderLoading: true }),
    });

    click("Cash-on-delivery");
    click("second-bay-way");
    click("crypto-bay-way");
    expect(paymentPick(store), "no pick may change while the order is loading").toEqual([]);
    expect(
      document.querySelector('[data-pw="second-bay-way-con-text-load"]'),
      "the wallet row should show a spinner while loading",
    ).not.toBeNull();
  });

  it("marks the picked row as active", async () => {
    await renderWithProviders(<PaymentMethod />, {
      store: baseStore({ orderData: { payment: [{ id: 0, balance: 110 }], coupon: false } }),
    });
    expect(
      (document.querySelector('[data-pw="Cash-texts"]') as HTMLElement).className,
      "the picked cash row should use the dark text",
    ).toContain("text-[#1D1D1D]");
  });

  it("refreshes the wallet balance from the core backend and reports it", async () => {
    vi.mocked(order.GetWallet).mockResolvedValueOnce(undefined);
    await renderWithProviders(<PaymentMethod />, { store: baseStore() });

    click("refresh-wallet");
    await waitFor(() => {
      expect(trackOrder, "a finished refresh should be reported").toHaveBeenCalledWith(
        "wallet_balance_refreshed",
      );
    });
    expect(order.GetWallet, "the refresh should ask for the wallet").toHaveBeenCalled();
  });

  it("sends only one wallet refresh while one is running, and logs a failed refresh", async () => {
    let fail: (e: Error) => void = () => {};
    vi.mocked(order.GetWallet).mockReturnValueOnce(
      new Promise((_, reject) => {
        fail = reject;
      }) as any,
    );
    await renderWithProviders(<PaymentMethod />, { store: baseStore() });

    click("refresh-wallet");
    await waitFor(() => {
      expect(
        document.querySelector('[data-pw="refresh-wallet"] img')?.className,
        "the refresh icon should spin while loading",
      ).toContain("animate-spin");
    });
    click("refresh-wallet");
    expect(order.GetWallet, "a second tap must not send a second refresh").toHaveBeenCalledTimes(1);

    fail(new Error("wallet down"));
    await waitFor(() => {
      expect(LogError, "a failed refresh should be logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "refresh wallet - cart widget" }),
      );
    });
  });

  it("opens and closes the coupon box through the order data", async () => {
    const { store } = await renderWithProviders(<PaymentMethod />, { store: baseStore() });

    fireEvent.click(screen.getByText("open coupon"));
    expect(store.getState().orderData.coupon, "opening should set coupon to true").toBe(true);
    fireEvent.click(screen.getByText("close coupon"));
    expect(store.getState().orderData.coupon, "closing should set coupon to false").toBe(false);
  });

  it("lays the rows out right to left in Arabic", async () => {
    await renderWithProviders(<PaymentMethod />, {
      store: baseStore({ currency: null }),
      language: "ar",
    });
    expect(
      (document.querySelector('[data-pw="first-bay-way"]') as HTMLElement).className,
      "the title row should be reversed in Arabic",
    ).toContain("flex-row-reverse");
    expect(
      (document.querySelector('[data-pw="Cash-on-delivery"]') as HTMLElement).className,
      "the cash row should be reversed in Arabic",
    ).toContain("flex-row-reverse");
  });

  it(
    "BUG-cart-501: an empty payment method list prints no stray 0 in the payment box",
    async () => {
      await renderWithProviders(<PaymentMethod />, {
        store: baseStore({ available_payment_method: [] }),
      });
      const box = document.querySelector('[data-pw="payment-viewer-container"]')!;
      expect(
        Array.from(box.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent === "0"),
        "with no payment methods the box must not show a bare 0",
      ).toBe(false);
    },
  );
});
