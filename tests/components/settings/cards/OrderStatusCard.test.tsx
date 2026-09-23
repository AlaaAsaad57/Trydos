// The order status card (components/settings/cards/OrderStatusCard.tsx).
import { describe, expect, it } from "vitest";

import OrderStatusCard from "components/settings/cards/OrderStatusCard";
import { renderWithProviders, screen } from "../../../render";

const statusEl = () => document.querySelector('[data-pw="order-status"]') as HTMLElement;

describe("the order status card", () => {
  it("names who a delivered order went to, full width", async () => {
    const { container } = await renderWithProviders(
      <OrderStatusCard status={{ value: "delivered", label: "Delivered" }} fullWidth contact_person_name="Test User" />,
    );
    expect(statusEl().dataset.status, "the status value is not on the card").toBe("delivered");
    expect(screen.getByText("Test User"), "a delivered order does not name the recipient").toBeInTheDocument();
    expect((container.firstChild as HTMLElement).className, "the full-width card is not full width").toContain("w-full");
  });

  it("does not name a recipient before delivery, half width and right-to-left in Kurdish", async () => {
    const { container } = await renderWithProviders(
      <OrderStatusCard status={{ value: "pending", label: "Pending" }} fullWidth={false} contact_person_name="Test User" />,
      { language: "ku" },
    );
    expect(screen.queryByText("Test User"), "an undelivered order named the recipient").not.toBeInTheDocument();
    const card = container.firstChild as HTMLElement;
    expect(card.className, "the half card is not half width").toContain("w-1/2");
    expect(card.style.direction, "the card is not right-to-left in Kurdish").toBe("rtl");
  });
});
