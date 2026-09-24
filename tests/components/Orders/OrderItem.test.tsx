// One order card in the orders list: a link to the order's page, with a red
// dot when the order has an unread notification.
import { describe, expect, it, vi } from "vitest";

import OrderItem from "components/Orders/OrderItem";

import { buildOrder } from "../../fixtures/order";
import { renderWithProviders } from "../../render";

vi.mock("components/global/NextLink", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock("components/setting/orders/OrderItemTime", () => ({ default: () => null }));
vi.mock("components/setting/orders/OrderItemId", () => ({ default: () => null }));
vi.mock("components/setting/orders/OrderStatus", () => ({ default: () => null }));
vi.mock("components/setting/orders/OrderInvoice", () => ({
  default: ({ invoice }: any) => <span data-testid="invoice">{`${invoice.items}/${invoice.total}`}</span>,
}));
vi.mock("components/setting/orders/OrderProductSlider", () => ({ default: () => null }));

const ORDER = buildOrder({ order_group_id: 55 } as any);

describe("OrderItem", () => {
  it("links to the order page and shows no dot without a notification", async () => {
    const { container } = await renderWithProviders(<OrderItem order={ORDER} local="sy-en" isRtl={false} />);
    expect(container.querySelector("a")!.getAttribute("href"), "the card does not link to the order").toBe(
      "/sy-en/settings/orders/55",
    );
    expect(container.querySelector(".animate-pulse"), "a dot showed without a notification").toBeNull();
    expect(container.querySelector('[data-testid="invoice"]')!.textContent, "the invoice is wrong").toBe(
      `${ORDER.details.length}/${ORDER.order_amount}`,
    );
  });

  it("shows the red dot for an order with an unread notification, right-to-left", async () => {
    const { container } = await renderWithProviders(<OrderItem order={ORDER} local="sy-ar" isRtl />, {
      store: { showNotificaionCircle: [{ order_group_id: "55" }] },
    });
    expect(container.querySelector(".animate-pulse"), "the notification dot is missing").not.toBeNull();
    expect(container.querySelector(".flex-row-reverse"), "the RTL card is not flipped").not.toBeNull();
  });
});
