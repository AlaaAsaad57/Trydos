import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "@testing-library/react";
import { renderWithProviders } from "../../../render";

// The real chat provider: it loads the chat when it mounts, gives the screens
// the store's chat as their state, and remembers which chat is on screen.
// The chat backend calls are mocked; nothing leaves the test.

const loads = vi.hoisted(() => ({
  getChats: vi.fn(),
  getContacts: vi.fn(),
  getCalls: vi.fn(),
  GetArchivedChats: vi.fn(),
  GetMyReminders: vi.fn(),
  runChatAction: vi.fn(async () => undefined),
}));
vi.mock("services/chat", () => ({
  default: { getChats: loads.getChats, getContacts: loads.getContacts, getCalls: loads.getCalls },
}));
vi.mock("store/chat/actions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  GetArchivedChats: loads.GetArchivedChats,
  GetMyReminders: loads.GetMyReminders,
}));
vi.mock("components/DemoApp1/chat/chatActions", () => ({ runChatAction: loads.runChatAction }));

import { ChatDataProvider } from "components/DemoApp1/chat/ChatDataProvider";
import { useChat, type ChatApi } from "components/DemoApp1/chat/chatContext";
import { useAppStore } from "store";

const ME = 7;
const PEER = 9;

// Only the fields the provider reads; the full Channel type has many more.
const chat = (id: string, text: string): any => ({
  id,
  channel_name: `Chat ${id}`,
  updated_at: "2026-11-04T09:00:00",
  channel_members: [
    { id: 1, user_id: ME, pin: 0, mute: 0, is_blocked: 0, user: { id: ME, name: "Me" } },
    { id: 2, user_id: PEER, pin: 0, mute: 0, is_blocked: 0, user: { id: PEER, name: "Peer", photo_path: null } },
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

let api: ChatApi | null = null;
const keep = (value: ChatApi) => {
  api = value;
};
/** Hands the provider's value to the test on every render. */
function Probe({ onApi }: { onApi: (value: ChatApi) => void }) {
  onApi(useChat());
  return null;
}

const initial = useAppStore.getState();
beforeEach(() => {
  vi.clearAllMocks();
  api = null;
});
afterEach(() => {
  useAppStore.setState(initial, true);
});

describe("the real chat provider", () => {
  it("loads the chats, contacts, calls, archived chats and reminders when it mounts", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME } } },
    );
    expect(loads.getChats, "the chat list was not loaded from the chat backend").toHaveBeenCalledWith(false);
    expect(loads.getContacts, "the contacts were not loaded from the chat backend").toHaveBeenCalled();
    expect(loads.getCalls, "the calls were not loaded from the chat backend").toHaveBeenCalled();
    expect(loads.GetArchivedChats, "the archived chats were not loaded from the chat backend").toHaveBeenCalled();
    expect(loads.GetMyReminders, "the reminders were not loaded from the chat backend").toHaveBeenCalled();
  });

  it("loads nothing before the chat user is known", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: null } },
    );
    expect(loads.getChats, "the chat list was asked for with no chat user").not.toHaveBeenCalled();
  });

  it("gives the screens the store's chats, and follows the store when it changes", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME }, data: [chat("1", "First words")] } },
    );
    expect(api?.state.chats.map((c) => c.preview), "the screens did not get the store's chat 1").toEqual(["First words"]);
    act(() => {
      useAppStore.setState({ data: [chat("1", "First words"), chat("2", "Second words")] });
    });
    expect(api?.state.chats.map((c) => c.id), "the screens did not follow the store's new chat 2").toEqual(["1", "2"]);
  });

  it("an open puts the chat on screen and goes to the real chat; leave takes it off", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME }, data: [chat("1", "Hi")] } },
    );
    act(() => api?.dispatch({ type: "open", chat: "1" }));
    expect(api?.state.viewing, "the opened chat 1 is not on screen").toBe("1");
    expect(api?.state.active, "the opened chat 1 is not the active row").toBe("1");
    expect(loads.runChatAction, "the open did not reach the real chat").toHaveBeenCalledWith(
      { type: "open", chat: "1" },
      expect.anything(),
    );
    act(() => api?.dispatch({ type: "leave" }));
    expect(api?.state.viewing, "leaving did not take the chat off screen").toBeNull();
  });

  it("archiving or deleting the chat on screen takes it off screen", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME }, data: [chat("1", "Hi")] } },
    );
    act(() => api?.dispatch({ type: "open", chat: "1" }));
    act(() => api?.dispatch({ type: "archive", chat: "1" }));
    expect(api?.state.viewing, "the archived chat stayed on screen").toBeNull();
  });

  it("sending says 'Soon available' until step 3c, and sends nothing", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME }, data: [chat("1", "Hi")] } },
    );
    act(() => api?.sendText("1", "Hello"));
    // translateFunction writes English in title case; step 9 sets the case rule (D-4).
    expect(api?.notice, "sending a text did not say 'Soon available'").toMatch(/^soon available$/i);
    expect(loads.runChatAction, "sending a text reached the real chat").not.toHaveBeenCalled();
  });
});
