// The order group id on an order card (components/setting/orders/OrderItemId.tsx).
import { describe, expect, it } from "vitest";

import OrderItemId from "components/setting/orders/OrderItemId";
import { renderWithProviders } from "../../../render";

describe("the order group id", () => {
  it.each([
    [false, "flex-row"],
    [true, "flex-row-reverse"],
  ])("shows the id (right-to-left %s)", async (isRtl, cls) => {
    const { container } = await renderWithProviders(<OrderItemId id="G-7" isRtl={isRtl} />);
    expect(
      document.querySelector('[data-pw="order-group-id"]')!.textContent,
      "the order group id is not shown",
    ).toBe("G-7");
    expect((container.firstChild as HTMLElement).className, "the row direction is wrong").toContain(cls);
  });
});
