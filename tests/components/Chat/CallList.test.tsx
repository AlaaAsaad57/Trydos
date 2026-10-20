// The "Calls" tab while it is still loading.
//
// CallList starts with `loading` true, so the skeleton is the first thing the
// tab ever renders. If the skeleton throws, nobody ever sees the call log —
// not a wrong label, no list at all.
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import React from "react";

// The list asks the chat backend for calls as soon as it mounts. This test is
// about the first paint, not the request, so the call is stubbed out.
vi.mock("services/chat", () => ({
  default: { getCalls: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("store/chat/actions", () => ({ DeleteMessageApi: vi.fn() }));
// jsdom has no IntersectionObserver; the "load more calls" sentinel asks for one.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

import CallList from "components/Chat/pages/CallList";

import { renderWithProviders } from "../../render";

describe("CallList — the Calls tab", () => {
  it("renders its loading skeleton without throwing", async () => {
    await expect(
      renderWithProviders(<CallList />, { store: { userChat: { id: 657 } } }),
      "the Calls tab threw while painting its loading skeleton, so the call log never appears",
    ).resolves.toBeTruthy();

    expect(
      document.querySelectorAll(".call-conversation-item").length > 0,
      "the loading skeleton painted no placeholder rows",
    ).toBe(true);
  });
});

describe("CallList — the name and picture of a call row", () => {
  // The mobile app names a chat after `channel_name` and shows the other
  // person's own picture. A call row must show the same name and picture as
  // the chat it belongs to.
  it("shows the other person's own picture, taken from the chat in the list", async () => {
    await renderWithProviders(<CallList />, {
      store: {
        userChat: { id: 657 },
        calls: [
          {
            id: 900,
            channel_id: 40,
            created_at: "2026-09-26T10:00:00.000Z",
            duration_in_seconds: 12,
            sender_user_id: 672,
            message_type: { name: "VoiceCall" },
            channel: { id: 40, channel_name: "Bilal Shop", photo_path: "/channel.png" },
          },
        ],
        data: [
          {
            id: 40,
            channel_name: "Bilal Shop",
            messages: [],
            channel_members: [
              { user_id: 657, user: { name: "Me", photo_path: "/me.png" } },
              { user_id: 672, user: { name: "bilal seller id 8", photo_path: "/bilal.png" } },
            ],
          },
        ],
      },
    });

    const name = await screen.findByText("Bilal Shop");
    expect(name, "the call row did not use the chat's channel_name").toBeInTheDocument();
    const img = name.closest(".call-conversation-item")?.querySelector('img[alt="user-photo"]');
    const src = decodeURIComponent(img?.getAttribute("src") ?? "");
    expect(src, `the call row showed "${src}" instead of the other person's own picture`).toContain("/bilal.png");
  });
});
