// The Orders entry card on the settings page (components/setting/orders/index.tsx).
//
// A signed-in shopper gets a link to the orders list and the count of their
// orders (fetched in the browser). A guest gets no count and a tap opens
// sign-in instead.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchOrdersCount = vi.hoisted(() => vi.fn());
vi.mock("services/orders", () => ({ fetchOrdersCount }));

import OrdersLinkCard from "components/setting/orders/index";
import { buildUser } from "../../../fixtures/user";
import { act, renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const card = () => document.querySelector('[data-pw="orders-page-button"]') as HTMLElement;

beforeEach(() => fetchOrdersCount.mockReset());
afterEach(() => vi.clearAllMocks());

describe("a signed-in shopper", () => {
  it("links to the orders list and shows the order count", async () => {
    fetchOrdersCount.mockResolvedValue(7);
    await renderWithProviders(<OrdersLinkCard isRtl language="en" local="gb-en" user={null} />, {
      store: { userProfile: buildUser() },
    });
    await waitFor(() => expect(screen.getByText(/^7/), "the order count is not shown").toBeInTheDocument());
    expect(card().getAttribute("href"), "the card does not link to the orders list").toBe("/gb-en/settings/orders");
  });

  it("keeps 0 when the count cannot be read, and ignores a count that arrives after leaving", async () => {
    fetchOrdersCount.mockResolvedValueOnce(null);
    const first = await renderWithProviders(<OrdersLinkCard isRtl={false} language="en" local="gb-en" user={buildUser()} />, {
      store: { userProfile: null },
    });
    await waitFor(() => expect(fetchOrdersCount).toHaveBeenCalled());
    expect(screen.getByText(/^0/), "an unreadable count did not show 0").toBeInTheDocument();
    first.unmount();

    let answer: (v: any) => void = () => {};
    fetchOrdersCount.mockReturnValueOnce(new Promise((r) => (answer = r)));
    const second = await renderWithProviders(<OrdersLinkCard isRtl={false} language="en" local="gb-en" user={buildUser()} />);
    second.unmount();
    await act(async () => answer(9));
    expect(screen.queryByText(/^9/), "a count that arrived after leaving was shown").not.toBeInTheDocument();
  });
});

describe("a guest", () => {
  it.each([null, { phone: "0" }, { phone: 0 }, { phone: null }, { phone: undefined }, { phone: " " }, { phone: "12" }])(
    "with %o gets no count, and a tap opens sign-in",
    async (user) => {
      const setLoginOpen = vi.fn();
      await renderWithProviders(<OrdersLinkCard isRtl={false} language="en" local="gb-en" user={user} />, {
        store: { userProfile: null, setLoginOpen },
      });
      expect(fetchOrdersCount, "a guest's orders were counted").not.toHaveBeenCalled();
      expect(card().className, "the guest card is not faded").toContain("opacity-65");
      await userEvent.setup().click(card());
      expect(setLoginOpen, "a guest's tap did not open sign-in").toHaveBeenCalledWith(true);
    },
  );
});
