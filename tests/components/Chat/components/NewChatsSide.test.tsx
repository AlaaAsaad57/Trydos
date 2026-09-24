// The strip of other chats with new messages, beside an open chat
// (components/Chat/components/NewChatsSide.tsx).
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ lastSeen: vi.fn() }));

vi.mock("store/chat/actions", () => ({ GetLastSeen: (...a: any[]) => h.lastSeen(...a) }));

import NewChatsSide from "components/Chat/components/NewChatsSide";

const ME = 1;

function unreadChat(id: number, user: Record<string, any> | undefined, extra: Record<string, any> = {}) {
  return {
    id,
    channel_members: [{ user_id: ME }, { user_id: 20 + id, user }],
    messages: [
      {
        sender_user_id: 20 + id,
        message_type: { name: "TextMessage" },
        message_status: [{ user_id: ME, is_watched: false }],
        auth_message_status: { delete_for_all: false },
      },
    ],
    ...extra,
  };
}

async function mount(chats: any[], activeChat: any = { id: 99 }) {
  const spies = { openChat: vi.fn(), watchChannel: vi.fn() };
  await renderWithProviders(<NewChatsSide activeChat={activeChat} chats={chats} />, {
    store: { userChat: { id: ME }, ...spies },
  });
  return spies;
}

describe("NewChatsSide", () => {
  it("shows a photo, initials or the empty picture for each new chat", async () => {
    await mount([
      unreadChat(1, { name: "Photo Person", photo_path: "/p.png" }),
      unreadChat(2, { name: "Name Only", photo_path: "/Name Only.png" }),
      unreadChat(3, { name: "", username: "user3" }),
      unreadChat(4, undefined),
      unreadChat(5, { name: "Team" }, { channel_type: { slug: "team" } }),
    ]);
    expect(document.querySelectorAll(".new-chat").length, "the team chat was not left out").toBe(4);
    expect(screen.getAllByAltText("new-user").length, "the photo and the empty picture were not shown").toBe(3);
    expect(document.querySelector(".min-text-avatar")?.textContent, "a placeholder photo did not fall back to initials").toBe("NO");
  });

  it("opens a new chat, marks it watched and follows the other person's status", async () => {
    const spies = await mount([unreadChat(1, { name: "A B" })]);
    fireEvent.click(document.querySelector(".new-chat")!);
    expect(h.lastSeen, "the other person's status was not followed").toHaveBeenCalledWith(1, 21);
    expect(spies.openChat.mock.calls[0][0].id, "the chat did not open").toBe(1);
    expect(spies.watchChannel, "the chat was not marked watched").toHaveBeenCalledWith(1);
  });

  it("shows nothing with no open chat", async () => {
    await mount([unreadChat(1, { name: "A" })], null);
    expect(document.querySelector(".new-chat"), "new chats were shown with no chat open").toBeNull();
  });
});
