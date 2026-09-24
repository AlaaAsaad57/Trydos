// The "Chat with delivery worker" button (components/settings/OrderChatIcon.tsx).
//
// Hidden without an id. Shows a spinner while the chat is being fetched and
// ignores taps then. Shows a red dot when there is an unread message for the
// order.
import { afterEach, describe, expect, it, vi } from "vitest";

import OrderChatIcon from "components/settings/OrderChatIcon";
import { renderWithProviders, screen, userEvent } from "../../render";

afterEach(() => vi.clearAllMocks());

describe("the delivery chat button", () => {
  it("renders nothing without an id", async () => {
    const { container } = await renderWithProviders(<OrderChatIcon id={null} getChatWithShipping={vi.fn()} />);
    expect(container.innerHTML, "the chat button showed without an order id").toBe("");
  });

  it("opens the chat on tap and shows the unread dot for this order", async () => {
    const getChatWithShipping = vi.fn();
    await renderWithProviders(
      <OrderChatIcon id={5} isGettingChat={false} getChatWithShipping={getChatWithShipping} />,
      { store: { showNotificaionCircle: [{ order_id: 5 }] } },
    );
    expect(document.querySelector(".animate-pulse"), "the unread dot is not shown").not.toBeNull();
    await userEvent.setup().click(screen.getByText("Chat with delivery worker"));
    expect(getChatWithShipping, "the tap did not open the chat").toHaveBeenCalled();
  });

  it("ignores taps while the chat is loading, and shows no dot without unread messages", async () => {
    const getChatWithShipping = vi.fn();
    await renderWithProviders(
      <OrderChatIcon id={5} isGettingChat getChatWithShipping={getChatWithShipping} />,
      { store: { showNotificaionCircle: [] } },
    );
    await userEvent.setup().click(screen.getByRole("button"));
    expect(getChatWithShipping, "a tap while loading opened the chat again").not.toHaveBeenCalled();
    expect(screen.queryByText("Chat with delivery worker"), "the label showed while loading").not.toBeInTheDocument();
  });
});
