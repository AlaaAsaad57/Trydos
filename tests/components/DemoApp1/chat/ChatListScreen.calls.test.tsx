import { describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../render";
import ChatListScreen from "components/DemoApp1/screens/ChatListScreen";
import { ChatContext, type ChatApi, type ChatPaging } from "components/DemoApp1/chat/chatContext";
import { toChatState } from "components/DemoApp1/chat/chatMapper";
import { NavCtx, type DemoNav } from "components/DemoApp1/screenNav";

// The Calls tab: a deleted call keeps its row with nothing about the call on
// it (9fd9341a3, ae6df6dd1), and the older calls load near the end of the list.

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

const ME = 7;
const PEER = 9;
const words = {
  photo: "",
  voice: "",
  video: "",
  file: "",
  location: "",
  product: "",
  deleted: "",
  voiceCall: "",
  videoCall: "",
};
const call = (id: string, deleted: boolean): any => ({
  id,
  sender_user_id: PEER,
  channel_id: "1",
  created_at: "2026-11-04T10:00:00",
  duration_in_seconds: 60,
  message_type: { name: "VoiceCall" },
  channel: {
    id: "1",
    channel_name: "Secret Person",
    channel_members: [
      { id: 1, user_id: ME, user: { id: ME, name: "Me" } },
      { id: 2, user_id: PEER, user: { id: PEER, name: "Secret Person" } },
    ],
    messages: [],
  },
  message_status: [],
  auth_message_status: { is_deleted: deleted ? 1 : 0 },
});

function value(calls: any[], paging?: Partial<ChatPaging>, dispatch = vi.fn()): ChatApi {
  return {
    state: toChatState(
      { chats: [], archived: [], open: null, book: [], calls },
      { myId: String(ME), words, locale: "sy-en" },
      { active: null, viewing: null },
    ),
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
    ...(paging ? { paging: paging as ChatPaging } : {}),
  };
}

const navigate = vi.fn();
const nav: DemoNav = { shown: "chat", navigate, back: vi.fn(), locale: "sy-en", t: (key) => key };

async function callsTab(api: ChatApi) {
  await renderWithProviders(
    <NavCtx.Provider value={nav}>
      <ChatContext.Provider value={api}>
        <ChatListScreen />
      </ChatContext.Provider>
    </NavCtx.Provider>,
    { country: "sy", path: "/chat" },
  );
  await act(async () => {
    fireEvent.click(document.querySelector('[data-pw="demo-chat-tab-calls"]')!);
  });
}

const deletedRow = () => document.querySelector<HTMLElement>('[data-pw="demo-call-deleted-2"]');
const edge = () => document.querySelector('[data-pw="demo-chat-more-calls"]');

describe("the Calls tab — a deleted call", () => {
  it("keeps its row and says it is deleted", async () => {
    await callsTab(value([call("2", true)]));
    expect(deletedRow()?.textContent, "the deleted call has no row").toContain("Deleted Call");
    expect(deletedRow()?.textContent, "the row does not say the details are hidden").toContain(
      "Call Details Are Hidden",
    );
  });

  it("shows nothing about the call", async () => {
    await callsTab(value([call("2", true)]));
    expect(document.body.textContent, "the deleted call still shows who it was with").not.toContain("Secret Person");
    expect(deletedRow()?.querySelector("img"), "the deleted call still shows a picture").toBeNull();
  });

  it("opens nothing on a tap", async () => {
    const dispatch = vi.fn();
    await callsTab(value([call("2", true)], undefined, dispatch));
    await act(async () => {
      fireEvent.click(deletedRow()!);
    });
    expect(dispatch, "a tap on a deleted call opened its chat").not.toHaveBeenCalled();
    expect(navigate, "a tap on a deleted call left the list").not.toHaveBeenCalled();
  });

  it("leaves a live call's row as it was", async () => {
    await callsTab(value([call("1", false)]));
    expect(
      document.querySelector('[data-pw="demo-call-row-1"]')?.textContent,
      "a live call lost its name",
    ).toContain("Secret Person");
  });
});

describe("the Calls tab — older calls", () => {
  it("has a page edge while older calls may be there", async () => {
    await callsTab(value([call("1", false)], { moreCalls: true, loadMoreCalls: vi.fn() }));
    expect(edge(), "the list has nothing to ask for older calls").not.toBeNull();
  });

  it("has none at the end of the log", async () => {
    await callsTab(value([call("1", false)], { moreCalls: false, loadMoreCalls: vi.fn() }));
    expect(edge(), "the end of the log still asks for older calls").toBeNull();
  });

  it("has none on /demo, which holds all of its calls", async () => {
    await callsTab(value([call("1", false)]));
    expect(edge(), "the /demo list asks for older calls").toBeNull();
  });
});
