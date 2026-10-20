// The wallet page body (components/settings/WalletTransactions.tsx).
//
// It loads the balance and the first page of transactions on mount, and more
// pages on "Load More". A transaction tied to an order links to that order.
// The order service and fetchData are replaced.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderService = vi.hoisted(() => ({
  GetWallet: vi.fn(),
  GetWalletTransactions: vi.fn(),
}));
vi.mock("services/order", () => ({ default: orderService }));

const fetchDataMock = vi.hoisted(() => vi.fn());
vi.mock("utils/fetchData", () => ({
  fetchData: fetchDataMock,
  abortInFlightForLogout: vi.fn(),
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

import WalletTransactions from "components/settings/WalletTransactions";
import { routerSpies } from "../../mocks/nextNavigation";
import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const page = (list: any[], extra: any = {}) => ({
  wallet_transaction_list: list,
  total_wallet_transaction: 3,
  ...extra,
});

const amount = () =>
  document.querySelector('[data-pw="user-wallet-amount"]')!.textContent;

beforeEach(() => {
  orderService.GetWallet.mockReset();
  orderService.GetWalletTransactions.mockReset();
  fetchDataMock.mockReset();
  logError.mockReset();
});
afterEach(() => vi.clearAllMocks());

function renderWallet(store: any = { currency: { symbol: "$", decimal_digits: 2 } }, isRtl = false) {
  return renderWithProviders(<WalletTransactions isRtl={isRtl} local="gb-en" />, { store });
}

describe("the balance", () => {
  it("shows the balance and the backend's currency", async () => {
    orderService.GetWallet.mockResolvedValue({ wallet_balance: 12.5, currency_symbol: "SYP" });
    orderService.GetWalletTransactions.mockReturnValue(new Promise(() => {}));
    await renderWallet();
    await waitFor(() =>
      expect(amount(), "the wallet balance or its currency is wrong").toContain("12.50 SYP"),
    );
  });

  it(
    "BUG-settings-2: a transactions page with no balance does not wipe the balance the wallet call loaded",
    async () => {
      orderService.GetWallet.mockResolvedValue({ wallet_balance: 12.5, currency_symbol: "SYP" });
      let answerPage: (v: any) => void = () => {};
      orderService.GetWalletTransactions.mockReturnValue(new Promise((r) => (answerPage = r)));
      await renderWallet();
      await waitFor(() => expect(amount()).toContain("12.50 SYP"));

      answerPage(page([{ id: "t1", credit: 5, created_at: "2030-01-02 03:04:00", reference: "Top up" }]));
      await screen.findByText("Top up");
      expect(
        amount(),
        "the balance from the wallet call was replaced by 0 when the transactions page arrived",
      ).toContain("12.50 SYP");
    },
  );

  it("falls back to zero and the shop currency when the wallet answer is empty", async () => {
    orderService.GetWallet.mockResolvedValue({});
    orderService.GetWalletTransactions.mockResolvedValue(page([]));
    await renderWallet();
    await waitFor(() =>
      expect(amount(), "an empty wallet answer did not fall back to 0 in the shop currency").toContain("0.00 $"),
    );
  });

  it("keeps zero when there is no wallet answer, and logs a wallet call that throws", async () => {
    orderService.GetWallet.mockResolvedValueOnce(null);
    orderService.GetWalletTransactions.mockResolvedValue(null);
    const { unmount } = await renderWallet({ currency: null }, true);
    await waitFor(() => expect(amount(), "no wallet answer did not keep a zero balance").toContain("0"));
    unmount();

    orderService.GetWallet.mockRejectedValueOnce(new Error("wallet down"));
    await renderWallet();
    await waitFor(() =>
      expect(logError, "a failing wallet call was not logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In getWallet in WalletTransations" }),
      ),
    );
  });
});

describe("the transactions", () => {
  it("lists inflows and outflows, pages on Load More, and says when there are no more", async () => {
    orderService.GetWallet.mockResolvedValue({ wallet_balance: 1 });
    orderService.GetWalletTransactions
      .mockResolvedValueOnce(
        page(
          [
            { id: "t1", credit: 5, debit: 0, created_at: "2030-01-02 03:04:00", transaction_type: { name: "Refund" } },
            { id: "t2", credit: 0, debit: 3, created_at: "2030-01-02 03:04:00", reference: "REF-9" },
          ],
          { wallet_balance: 9 },
        ),
      )
      .mockResolvedValueOnce(page([{ id: "t3", credit: 0, debit: 0, created_at: undefined }]))
      .mockResolvedValueOnce(page([]));
    await renderWallet();

    expect(await screen.findByText("Refund"), "a transaction with a type name is not listed by it").toBeInTheDocument();
    expect(screen.getByText("REF-9"), "a transaction with only a reference is not listed by it").toBeInTheDocument();
    expect(screen.getByText("+5.00 $"), "a credit is not shown as a positive amount").toBeInTheDocument();
    expect(screen.getByText("-3.00 $"), "a debit is not shown as a negative amount").toBeInTheDocument();
    expect(screen.getByText("Outflow"), "a debit is not labelled as an outflow").toBeInTheDocument();
    expect(screen.getAllByText("2030-01-02 03:04")[0], "the date is not shown as year-month-day hour:minute").toBeInTheDocument();
    expect(orderService.GetWalletTransactions, "the first page was not asked for with 10 per page").toHaveBeenCalledWith(10, 1);

    const user = userEvent.setup();
    await user.click(screen.getByText("Load More"));
    expect(await screen.findByText("Transaction"), "a transaction with no name did not get the default label").toBeInTheDocument();
    expect(orderService.GetWalletTransactions, "the second page was not asked for").toHaveBeenCalledWith(10, 2);

    await user.click(screen.getByText("Load More"));
    expect(await screen.findByText("No More Orders"), "an empty page did not end the list").toBeInTheDocument();
  });

  it("treats a page with no list as empty", async () => {
    orderService.GetWallet.mockResolvedValue(null);
    orderService.GetWalletTransactions.mockResolvedValue({});
    await renderWallet();
    expect(await screen.findByText("No More Orders"), "a page with no list did not end the list").toBeInTheDocument();
  });

  it("logs a failing page and stops offering more", async () => {
    orderService.GetWallet.mockResolvedValue(null);
    orderService.GetWalletTransactions.mockRejectedValue(new Error("tx down"));
    await renderWallet();
    expect(await screen.findByText("No More Orders"), "a failing page still offered more").toBeInTheDocument();
    expect(logError, "a failing page was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "Error In loadMore in walletTransations" }),
    );
  });

  it("shows Loading while a page is on its way", async () => {
    orderService.GetWallet.mockResolvedValue(null);
    orderService.GetWalletTransactions.mockReturnValue(new Promise(() => {}));
    await renderWallet();
    expect(screen.getByText("Loading..."), "no loading label while the page loads").toBeInTheDocument();
  });
});

describe("opening the order of a transaction", () => {
  async function renderWithOrderLine() {
    orderService.GetWallet.mockResolvedValue(null);
    orderService.GetWalletTransactions.mockResolvedValueOnce(
      page([
        { id: "t1", credit: 5, created_at: "2030-01-02 03:04:00", order_id: 77, reference: "Order refund" },
        { id: "t2", credit: 1, created_at: "2030-01-02 03:04:00", reference: "Top up" },
      ]),
    );
    await renderWallet();
    await screen.findByText("Order refund");
  }

  it("opens the order group of the transaction, and ignores taps while it opens", async () => {
    let answer: (v: any) => void = () => {};
    fetchDataMock.mockReturnValue(new Promise((r) => (answer = r)));
    await renderWithOrderLine();
    const user = userEvent.setup();

    await user.click(screen.getByText("Top up"));
    expect(fetchDataMock, "a transaction with no order tried to open one").not.toHaveBeenCalled();

    await user.click(screen.getByText("Order refund"));
    await user.click(screen.getByText("Order refund"));
    expect(fetchDataMock, "a second tap asked for the order again").toHaveBeenCalledTimes(1);
    answer({ data: { order_group_id: "g-1" } });
    await waitFor(() =>
      expect(routerSpies.push, "the order of the transaction was not opened").toHaveBeenCalledWith(
        "/gb-en/settings/orders/g-1?order_id=77&is_from_wallet=true",
      ),
    );
  });

  it("does not navigate when there is no answer", async () => {
    fetchDataMock.mockResolvedValue(null);
    await renderWithOrderLine();
    await userEvent.setup().click(screen.getByText("Order refund"));
    await waitFor(() => expect(fetchDataMock).toHaveBeenCalled());
    expect(routerSpies.push, "an empty answer still navigated").not.toHaveBeenCalled();
  });

  it("logs a failing order lookup and lets the shopper tap again", async () => {
    fetchDataMock.mockRejectedValue(new Error("lookup down"));
    await renderWithOrderLine();
    const user = userEvent.setup();
    await user.click(screen.getByText("Order refund"));
    await waitFor(() =>
      expect(logError, "a failing order lookup was not logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In GoToOrders in WalletTransactions" }),
      ),
    );
    await user.click(screen.getByText("Order refund"));
    expect(fetchDataMock, "after a failed lookup, the next tap was ignored").toHaveBeenCalledTimes(2);
  });
});
