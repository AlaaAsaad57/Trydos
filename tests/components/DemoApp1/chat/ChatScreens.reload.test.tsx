import React from "react";
import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../render";

// A reload of one chat's URL (`/sy-en/chat/conversation?id=12`): the chat
// screens come up before the chat is loaded. They must wait for the chat the
// URL names, and never show (or open) another one in its place.

import ConversationScreen from "components/DemoApp1/screens/ConversationScreen";
import ContactScreen from "components/DemoApp1/screens/ContactScreen";
import { ChatContext, type ChatApi } from "components/DemoApp1/chat/chatContext";
import { toChatState } from "components/DemoApp1/chat/chatMapper";
import { NavCtx, type DemoNav } from "components/DemoApp1/screenNav";

// jsdom has no ResizeObserver and no Element.scrollTo.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
const element = HTMLElement.prototype as { scrollTo?: () => void };
element.scrollTo ??= () => {};

const ME = 7;
const PEER = 9;

// Only the fields the mapper reads.
const channel = (id: string, text: string): any => ({
  id,
  channel_name: `Chat ${id}`,
  updated_at: "2026-11-04T09:00:00",
  channel_members: [
    { id: 1, user_id: ME, pin: 0, mute: 0, is_blocked: 0, user: { id: ME, name: "Me" } },
    { id: 2, user_id: PEER, pin: 0, mute: 0, is_blocked: 0, user: { id: PEER, name: `Peer ${id}`, photo_path: null } },
  ],
  messages: [
    {
      id: `${id}00`,
      sender_user_id: PEER,
      created_at: "2026-11-04T10:00:00",
      message_type: { name: "TextMessage" },
      message_content: { content: text },
      message_status: [],
      auth_message_status: { is_deleted: 0, delete_for_all: false },
    },
  ],
});

const words = {
  photo: "Photo",
  voice: "Voice",
  video: "Video",
  file: "File",
  location: "Location",
  product: "Product",
  deleted: "Deleted",
  voiceCall: "Voice Call",
  videoCall: "Video Call",
};

/** The context a screen gets: the chats given, with chat `viewing` on screen. */
function api(chats: any[], viewing: string, dispatch: ChatApi["dispatch"]): ChatApi {
  const state = toChatState(
    { chats, archived: [], open: null, book: [] },
    { myId: String(ME), words, locale: "sy-en" },
    { active: null, viewing },
  );
  return {
    state,
    dispatch,
    sendText: vi.fn(),
    sendPhoto: vi.fn(),
    sendVoice: vi.fn(),
    sendVideo: vi.fn(),
    sendFile: vi.fn(),
    sendLocation: vi.fn(),
    forward: vi.fn(),
    newChat: vi.fn(() => ""),
    addContact: vi.fn(async () => null),
    typing: vi.fn(),
    notice: null,
    search: false,
    setSearch: vi.fn(),
  };
}

const nav: DemoNav = {
  shown: "chat/conversation",
  navigate: vi.fn(),
  back: vi.fn(),
  locale: "sy-en",
  t: (key) => key,
};

function Screen({ value, Body }: { value: ChatApi; Body: React.ComponentType }) {
  return (
    <NavCtx.Provider value={nav}>
      <ChatContext.Provider value={value}>
        <Body />
      </ChatContext.Provider>
    </NavCtx.Provider>
  );
}

const shows = (text: string) => document.body.textContent?.includes(text) ?? false;

describe("a reload of one chat's URL — the chat screens wait for the chat it names", () => {
  for (const [name, Body] of [
    ["the conversation", ConversationScreen],
    ["the contact screen", ContactScreen],
  ] as const) {
    it(`${name} comes up with no chat loaded yet, and opens nothing`, async () => {
      const dispatch = vi.fn();
      await renderWithProviders(<Screen value={api([], "12", dispatch)} Body={Body} />, {
        country: "sy",
        path: "/chat/conversation",
        search: "?id=12",
      });
      expect(
        dispatch.mock.calls.filter(([a]) => a.type === "open"),
        `${name} opened a chat before chat 12 was loaded`,
      ).toEqual([]);
    });

    it(`${name} does not show another loaded chat in place of chat 12`, async () => {
      const dispatch = vi.fn();
      await renderWithProviders(<Screen value={api([channel("1", "Hi")], "12", dispatch)} Body={Body} />, {
        country: "sy",
        path: "/chat/conversation",
        search: "?id=12",
      });
      expect(shows("Peer 1"), `${name} shows chat 1 while the URL names chat 12`).toBe(false);
      expect(
        dispatch.mock.calls.filter(([a]) => a.type === "open"),
        `${name} opened chat 1 while the URL names chat 12`,
      ).toEqual([]);
    });
  }

  it("the conversation shows chat 12 and opens it once it is loaded", async () => {
    const dispatch = vi.fn();
    const { rerender } = await renderWithProviders(
      <Screen value={api([], "12", dispatch)} Body={ConversationScreen} />,
      { country: "sy", path: "/chat/conversation", search: "?id=12" },
    );
    await act(async () => {
      rerender(<Screen value={api([channel("12", "Hello there")], "12", dispatch)} Body={ConversationScreen} />);
    });
    expect(shows("Hello there"), "chat 12's message is not on the conversation once it loaded").toBe(true);
    expect(dispatch, "chat 12 was not opened once it loaded").toHaveBeenCalledWith({ type: "open", chat: "12" });
  });
});
