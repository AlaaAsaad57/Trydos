// The orders screen with its in-place Hidden Orders view
// (components/setting/orders/OrdersView.tsx).
//
// The options menu opens the Hidden Orders view and pushes `?view=hidden`;
// the back arrow and the browser back pop it and return to the list. The
// list, the hidden view and the menu are stubbed.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("components/setting/orders/OrdersListWrapper", () => ({
  default: () => <div data-testid="orders-list" />,
}));
vi.mock("components/setting/orders/HiddenOrdersWidget", () => ({
  default: () => <div data-testid="hidden-orders" />,
}));
vi.mock("components/setting/orders/OrdersOptionsMenu", () => ({
  default: ({ close, onOpenHidden }: any) => (
    <div data-testid="orders-menu">
      <button onClick={close}>menu close</button>
      <button onClick={onOpenHidden}>menu hidden</button>
    </div>
  ),
}));

import OrdersView from "components/setting/orders/OrdersView";
import { act, renderWithProviders, screen, userEvent } from "../../../render";

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const renderView = (search = "") =>
  renderWithProviders(<OrdersView isRtl={false} language="en" local="gb-en" order_group_statuses={[]} />, {
    path: "/settings/orders",
    search,
  });

describe("the orders screen", () => {
  it("shows the list, and the menu can close", async () => {
    await renderView();
    expect(screen.getByTestId("orders-list"), "the orders list is not shown").toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(document.querySelector('[data-pw="screen-options-button"]')!);
    await user.click(screen.getByText("menu close"));
    expect(screen.queryByTestId("orders-menu"), "closing the menu left it open").not.toBeInTheDocument();
  });

  it("opens the hidden view from the menu and pushes ?view=hidden; the back arrow goes back", async () => {
    await renderView();
    const user = userEvent.setup();
    await user.click(document.querySelector('[data-pw="screen-options-button"]')!);
    await user.click(screen.getByText("menu hidden"));
    expect(screen.getByTestId("hidden-orders"), "the hidden view did not open").toBeInTheDocument();
    expect(window.location.search, "the hidden view did not add ?view=hidden").toBe("?view=hidden");

    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    await user.click(document.querySelector('[data-pw="hidden-orders-screen-back-button"]')!);
    expect(back, "the back arrow did not go back in history").toHaveBeenCalled();

    window.history.pushState({}, "", "/gb-en/settings/orders");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(screen.getByTestId("orders-list"), "going back did not return to the list").toBeInTheDocument();
  });

  it("opens straight into the hidden view after a reload with ?view=hidden", async () => {
    await renderView("?view=hidden");
    expect(screen.getByTestId("hidden-orders"), "a reload with ?view=hidden did not show the hidden view").toBeInTheDocument();
  });
});
