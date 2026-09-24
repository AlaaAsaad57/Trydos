// The order summary card used by the change-address widget
// (components/setting/orders/OrderItemBanner.tsx).
import { describe, expect, it } from "vitest";

import OrderItemBanner from "components/setting/orders/OrderItemBanner";
import { buildOrder } from "../../../fixtures/order";
import { renderWithProviders, screen } from "../../../render";

describe("the order summary card", () => {
  it.each([false, true])("shows the group id, the status and the pictures (right-to-left %s)", async (isRtl) => {
    await renderWithProviders(<OrderItemBanner isRtl={isRtl} order={buildOrder()} />);
    expect(
      document.querySelector('[data-pw="order-group-id"]')!.textContent,
      "the order group id is not shown",
    ).toBe("test-order-group");
    expect(screen.getByText("Pending"), "the order status is not shown").toBeInTheDocument();
    expect(document.querySelectorAll('img[alt="OrderImage"]').length, "the product picture is not shown").toBe(1);
  });
});
