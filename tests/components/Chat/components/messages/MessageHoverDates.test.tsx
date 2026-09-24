// The sent / delivered / read times shown beside my message
// (components/Chat/components/messages/MessageHoverDates.tsx).
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../../../render";

import MessageHoverDates from "components/Chat/components/messages/MessageHoverDates";

const ME = 1;

async function mount(props: Record<string, any>) {
  return renderWithProviders(<MessageHoverDates created_at="" {...props} />, { store: { userChat: { id: ME } } });
}

describe("MessageHoverDates", () => {
  it("shows when it was sent, delivered and read", async () => {
    await mount({
      created_at: "2030-01-15T08:05:00",
      message_status: [
        { user_id: ME, is_received: 1, received_at: "x" },
        { user_id: 2, is_received: 1, received_at: "2030-01-15T05:06:00", is_watched: true, watched_at: "2030-01-15T05:07:00" },
      ],
    });
    expect(screen.getByTitle("Sent").textContent, "the sent time was not shown").toBe("08:05");
    expect(screen.getByTitle("Delivered").textContent, "the delivered time was not shown").toBe("08:06");
    expect(screen.getByTitle("Read").textContent, "the read time was not shown").toBe("08:07");
  });

  it("shows nothing it does not know", async () => {
    await mount({ message_status: undefined });
    expect(screen.queryByTitle("Sent"), "a sent time showed with no time").toBeNull();
    expect(screen.queryByTitle("Delivered"), "a delivered time showed with no status").toBeNull();
    expect(screen.queryByTitle("Read"), "a read time showed with no status").toBeNull();
  });
});
