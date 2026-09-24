// The status line of an order card (components/setting/orders/OrderStatus.tsx).
import { describe, expect, it } from "vitest";

import OrderStatus from "components/setting/orders/OrderStatus";
import { renderWithProviders, screen } from "../../../render";

describe("the order status line", () => {
  it.each([
    [false, "flex-row"],
    [true, "flex-row-reverse"],
  ])("shows the label and the status value (right-to-left %s)", async (isRtl, cls) => {
    const { container } = await renderWithProviders(
      <OrderStatus isRtl={isRtl} status={{ value: "shipped", label: "Shipped" }} />,
    );
    expect(screen.getByText("Shipped"), "the status label is not shown").toBeInTheDocument();
    expect(
      (document.querySelector('[data-pw="order-status"]') as HTMLElement).dataset.status,
      "the status value is not on the line",
    ).toBe("shipped");
    expect((container.firstChild as HTMLElement).className, "the line direction is wrong").toContain(cls);
  });
});
