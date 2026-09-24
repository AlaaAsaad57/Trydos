// Refreshes the server data of the orders page when an order changed.
import { describe, expect, it } from "vitest";

import RouterRefresh from "components/global/RouterRefresh";

import { routerSpies } from "../../mocks/nextNavigation";
import { renderWithProviders } from "../../render";

describe("the orders refresher", () => {
  it("refreshes the page and resets the flag when orders changed", async () => {
    const { store } = await renderWithProviders(<RouterRefresh />, { store: { shouldUpdateOrders: 2 } });
    expect(routerSpies.refresh, "a changed order must refresh the server data").toHaveBeenCalledTimes(1);
    expect(store.getState().shouldUpdateOrders, "the refresh flag must be reset after the refresh").toBe(0);
  });

  it("does nothing when no order changed", async () => {
    await renderWithProviders(<RouterRefresh />, { store: { shouldUpdateOrders: 0 } });
    expect(routerSpies.refresh, "with no change the page must not refresh").not.toHaveBeenCalled();
  });
});
