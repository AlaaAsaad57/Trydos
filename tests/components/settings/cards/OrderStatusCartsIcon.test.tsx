// The four-step progress row (components/settings/cards/OrderStatusCartsIcon.tsx).
//
// Every status the backend sends maps to one picture. The checks read which
// picture came out (the cancel image, or the step row), not the SVG paths.
import { describe, expect, it } from "vitest";

import OrderStatusCartsIcon from "components/settings/cards/OrderStatusCartsIcon";
import { renderWithProviders } from "../../../render";

const isCancelImage = (c: HTMLElement) =>
  !!c.querySelector('img[src="/icons/cancelOrderItemIcon.svg"]');

describe("the progress row (OrderStatusCartsIcon)", () => {
  it.each(["canceled", "CANCELED_ARCHIVED", "failed"])("%s shows the cancel picture", async (status) => {
    const { container } = await renderWithProviders(<OrderStatusCartsIcon status={status} isRtl={false} />);
    expect(isCancelImage(container), `${status} did not show the cancel picture`).toBe(true);
  });

  it.each([
    ["pending", 4],
    ["on_hold", 4],
    ["packaged", 4],
    ["shipping_center", 4],
    ["out_for_delivery", 4],
    ["delivered", 4],
    ["returned", 4],
    ["something_new", 4],
    [undefined, 4],
  ])("%s draws the four-step row", async (status, steps) => {
    const { container } = await renderWithProviders(
      <OrderStatusCartsIcon status={status as any} isRtl />,
    );
    expect(isCancelImage(container), `${status} showed the cancel picture`).toBe(false);
    expect(container.querySelectorAll(":scope > svg").length, `${status} did not draw four steps`).toBe(steps);
  });

  it("marks one more step for each later stage", async () => {
    const first = (await renderWithProviders(<OrderStatusCartsIcon status="pending" isRtl={false} />)).container.innerHTML;
    const second = (await renderWithProviders(<OrderStatusCartsIcon status="preparing" isRtl={false} />)).container.innerHTML;
    const third = (await renderWithProviders(<OrderStatusCartsIcon status="shipped" isRtl={false} />)).container.innerHTML;
    const fourth = (await renderWithProviders(<OrderStatusCartsIcon status="delivered" isRtl={false} />)).container.innerHTML;
    expect(new Set([first, second, third, fourth]).size, "two stages drew the same progress row").toBe(4);
  });
});
