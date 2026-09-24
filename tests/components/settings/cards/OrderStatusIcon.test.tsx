// The small status icon and the bag icon (components/settings/cards/OrderStatusIcon.tsx).
//
// Every status the backend sends maps to one picture. The checks read which
// picture came out, not the SVG paths.
import { describe, expect, it } from "vitest";

import OrderStatusIcon, { BagStatusIcon } from "components/settings/cards/OrderStatusIcon";
import { renderWithProviders } from "../../../render";

const isCancelImage = (c: HTMLElement) =>
  !!c.querySelector('img[src="/icons/cancelOrderItemIcon.svg"]');

describe("the status icon (OrderStatusIcon)", () => {
  it.each([null, 5])("draws nothing for a missing or non-text status (%s)", async (status) => {
    const { container } = await renderWithProviders(<OrderStatusIcon status={status as any} />);
    expect(container.innerHTML, "a missing status drew an icon").toBe("");
  });

  it.each(["pending", "preparing", "shipping_center", "ready_to_shipping", "shipped", "out_for_delivery", "in_delivery_center", "delivered"])(
    "draws an icon for %s",
    async (status) => {
      const { container } = await renderWithProviders(<OrderStatusIcon status={status} isRtl />);
      expect(container.querySelector("svg"), `${status} drew no icon`).not.toBeNull();
    },
  );

  it("shows the cancel picture for canceled and nothing for an unknown status", async () => {
    const canceled = await renderWithProviders(<OrderStatusIcon status="canceled" />);
    expect(isCancelImage(canceled.container), "canceled did not show the cancel picture").toBe(true);
    canceled.unmount();
    const unknown = await renderWithProviders(<OrderStatusIcon status="mystery" />);
    expect(unknown.container.innerHTML, "an unknown status drew an icon").toBe("");
  });
});

describe("the bag icon (BagStatusIcon)", () => {
  it.each(["pending", "preparing", "shipped", "delivered", "mystery"])("draws a bag for %s", async (status) => {
    const { container } = await renderWithProviders(<BagStatusIcon status={status} />);
    expect(container.querySelector("svg"), `${status} drew no bag`).not.toBeNull();
  });

  it("shows the cancel picture for canceled", async () => {
    const { container } = await renderWithProviders(<BagStatusIcon status="canceled" />);
    expect(isCancelImage(container), "canceled did not show the cancel picture").toBe(true);
  });
});
