// The red unread dot on the orders entry (components/setting/orders/OrderNotified.tsx).
import { describe, expect, it } from "vitest";

import OrderNotified from "components/setting/orders/OrderNotified";
import { renderWithProviders } from "../../../render";

describe("the unread dot", () => {
  it("shows when there is an unread order message", async () => {
    const { container } = await renderWithProviders(<OrderNotified />, {
      store: { showNotificaionCircle: [{ order_id: 1 }] },
    });
    expect(container.querySelector(".animate-pulse"), "the unread dot is not shown").not.toBeNull();
  });

  it("stays hidden with no unread messages", async () => {
    const { container } = await renderWithProviders(<OrderNotified />, { store: { showNotificaionCircle: [] } });
    expect(container.innerHTML, "the unread dot showed with nothing unread").toBe("");
  });
});
