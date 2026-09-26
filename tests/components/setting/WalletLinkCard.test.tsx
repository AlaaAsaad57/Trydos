// The wallet card on the settings page (components/setting/WalletLinkCard.tsx).
//
// It loads the wallet balance (unless a re-authentication is pending), shows
// "--" and a Retry button when the balance cannot be read, and opens the
// wallet sheet on tap for a signed-in shopper (a guest gets sign-in).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getWalletBalanceToShow = vi.hoisted(() => vi.fn());
vi.mock("services/order", () => ({ default: { GetWalletBalanceToShow: getWalletBalanceToShow } }));

// The real sheet closes after its slide-out animation (a timer), not inside
// the click, so the stub defers onClose the same way.
vi.mock("components/global/BottomSheet", () => ({
  default: ({ children, onClose }: any) => (
    <div data-testid="wallet-sheet">
      <button onClick={() => setTimeout(onClose, 0)}>sheet close</button>
      {children}
    </div>
  ),
}));

import WalletLinkCard from "components/setting/WalletLinkCard";
import { buildUser } from "../../fixtures/user";
import { act, fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../render";

const amount = () => document.querySelector('[data-pw="user-wallet-amount"]') as HTMLElement;

/** A balance answer that breaks when read, so the card's own failure path runs. */
const breakingAnswer = (thrown: any) => ({
  get success(): any {
    throw thrown;
  },
});

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  getWalletBalanceToShow.mockReset();
  fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ token: "wallet-token-value" }) }));
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function renderCard(store: any = { userProfile: buildUser() }, isRtl = false) {
  return renderWithProviders(<WalletLinkCard isRtl={isRtl} language="en" country="sy" />, { store });
}

describe("the balance", () => {
  it("shows the balance with its decimals and symbol", async () => {
    getWalletBalanceToShow.mockResolvedValue({ success: true, totalAvailable: 12.5, decimal_digits: 2, symbol: "$" });
    await renderCard();
    await waitFor(() => expect(amount().textContent, "the wallet balance is not shown").toContain("12.50"));
    expect(amount().textContent, "the currency symbol is not shown").toContain("$");
    expect(getWalletBalanceToShow, "the balance was not asked for this country").toHaveBeenCalledWith({ country: "sy" });
  });

  it.each([
    [null, "Failed to load wallet balance"],
    [{ success: false, message: "Wallet locked" }, "Wallet locked"],
    [{ success: false, error: "Wallet error" }, "Wallet error"],
  ])("shows -- and the reason when the answer is %o", async (answer, reason) => {
    getWalletBalanceToShow.mockResolvedValue(answer);
    await renderCard();
    await waitFor(() => expect(screen.getByRole("status").textContent, "the failure reason is not shown").toBe(reason));
    expect(amount().textContent, "a failed balance did not show --").toContain("--");
  });

  it.each([
    [new Error("wallet down"), "wallet down"],
    [{}, "Failed to load wallet balance"],
  ])("shows the reason when reading the balance fails (%o)", async (thrown, reason) => {
    getWalletBalanceToShow.mockResolvedValue(breakingAnswer(thrown));
    await renderCard();
    await waitFor(() => expect(screen.getByRole("status").textContent, "the failure reason is not shown").toBe(reason));
  });

  it("Retry by click or by Enter/Space loads the balance again without opening the sheet", async () => {
    getWalletBalanceToShow.mockResolvedValue(null);
    await renderCard();
    const retry = await screen.findByLabelText("Retry Fetching Wallet Balance");
    await userEvent.setup().click(retry);
    await waitFor(() => expect(getWalletBalanceToShow).toHaveBeenCalledTimes(2));
    fireEvent.keyDown(await screen.findByLabelText("Retry Fetching Wallet Balance"), { key: "Enter" });
    await waitFor(() => expect(getWalletBalanceToShow).toHaveBeenCalledTimes(3));
    fireEvent.keyDown(await screen.findByLabelText("Retry Fetching Wallet Balance"), { key: " " });
    await waitFor(() => expect(getWalletBalanceToShow).toHaveBeenCalledTimes(4));
    fireEvent.keyDown(await screen.findByLabelText("Retry Fetching Wallet Balance"), { key: "a" });
    expect(getWalletBalanceToShow, "another key retried the balance").toHaveBeenCalledTimes(4);
    expect(screen.queryByTestId("wallet-sheet"), "Retry opened the wallet sheet").not.toBeInTheDocument();
  });

  it("does not load the balance while a re-authentication is pending", async () => {
    await renderCard({ userProfile: buildUser(), shouldAuthinticated: true });
    expect(getWalletBalanceToShow, "the balance was asked for during a re-authentication").not.toHaveBeenCalled();
  });
});

describe("tapping the card", () => {
  it("opens the wallet sheet for a signed-in shopper and fetches the wallet token; the sheet closes", async () => {
    getWalletBalanceToShow.mockResolvedValue({ success: true, totalAvailable: 1 });
    await renderCard({ userProfile: null, user: buildUser() }, true);
    const user = userEvent.setup();
    await user.click(screen.getByText("RDB Wallet"));
    expect(screen.getByTestId("wallet-sheet"), "the wallet sheet did not open").toBeInTheDocument();
    await waitFor(() =>
      expect(fetchSpy, "the wallet token was not fetched").toHaveBeenCalledWith("/api/auth/wallet-token", {
        credentials: "include",
      }),
    );
    await user.click(screen.getByText("sheet close"));
    await waitFor(() =>
      expect(screen.queryByTestId("wallet-sheet"), "the sheet did not close").not.toBeInTheDocument(),
    );
  });

  it.each([
    ["a refused token call", async () => ({ ok: false })],
    ["a token call that fails", async () => { throw new TypeError("offline"); }],
    ["an answer with no token", async () => ({ ok: true, json: async () => ({}) })],
  ])("keeps the sheet open after %s", async (_, reply) => {
    vi.stubGlobal("fetch", (...args: any[]) => (reply as any)(...args));
    getWalletBalanceToShow.mockResolvedValue({ success: true, totalAvailable: 1 });
    await renderCard();
    await act(async () => {
      fireEvent.click(screen.getByText("RDB Wallet"));
    });
    expect(screen.getByTestId("wallet-sheet"), "a token failure closed the sheet").toBeInTheDocument();
  });

  it.each([null, { phone: "0" }, { phone: 0 }, { phone: null }, { phone: undefined }, { phone: " " }, { phone: "12" }])(
    "a guest (%o) is sent to sign-in instead",
    async (profile) => {
      getWalletBalanceToShow.mockResolvedValue(null);
      const setLoginOpen = vi.fn();
      const { container } = await renderCard({ userProfile: profile, user: null, setLoginOpen });
      await userEvent.setup().click(screen.getByText("RDB Wallet"));
      expect(setLoginOpen, "a guest tap did not open sign-in").toHaveBeenCalledWith(true);
      expect(screen.queryByTestId("wallet-sheet"), "a guest opened the wallet sheet").not.toBeInTheDocument();
      expect((container.firstChild as HTMLElement).className, "the guest card is not faded").toContain("opacity-65");
    },
  );
});
