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
  sendTextMessage: vi.fn(),
  openChatWith: vi.fn(() => "ch-11"),
  saveContact: vi.fn(async () => "11"),
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
vi.mock("components/DemoApp1/chat/chatSend", () => ({
  sendTextMessage: loads.sendTextMessage,
  openChatWith: loads.openChatWith,
  saveContact: loads.saveContact,
  forwardTo: vi.fn(),
  sendAnyFile: vi.fn(),
  sendMediaMessage: vi.fn(),
  sendTyping: vi.fn(),
  sendVideoFile: vi.fn(),
  sendVoiceNote: vi.fn(),
}));

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

  it("a text goes to the real send, with its reply", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME }, data: [chat("1", "Hi")] } },
    );
    act(() => api?.sendText("1", "Hello", { id: "100", text: "Hi" }));
    expect(loads.sendTextMessage, "the text did not reach the real send with its reply").toHaveBeenCalledWith(
      "1",
      "Hello",
      { id: "100", text: "Hi" },
    );
  });

  it("a location says 'Soon available' (no chat backend yet, CH-2) and sends nothing", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME }, data: [chat("1", "Hi")] } },
    );
    act(() => api?.sendLocation("1", { lat: 1, lng: 2 }));
    // translateFunction writes English in title case; step 9 sets the case rule (D-4).
    expect(api?.notice, "a location did not say 'Soon available'").toMatch(/^soon available$/i);
  });

  it("a new chat with a contact opens the chat with the store's contact and puts it on screen", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      {
        store: {
          userChat: { id: ME },
          data: [],
          contacts: [{ id: 1, name: "Friend", contact_user: { id: 11, name: "Friend" } }],
        },
      },
    );
    let id = "";
    act(() => {
      id = api?.newChat("11") ?? "";
    });
    expect(loads.openChatWith, "the new chat was not opened with the contact from the store").toHaveBeenCalledWith(
      expect.objectContaining({ id: "11", name: "Friend" }),
    );
    expect(id, "the new chat's id was not given back").toBe("ch-11");
    expect(api?.state.viewing, "the new chat is not on screen").toBe("ch-11");
  });

  it("a new chat with someone who is not a contact opens nothing", async () => {
    await renderWithProviders(
      <ChatDataProvider locale="sy-en">
        <Probe onApi={keep} />
      </ChatDataProvider>,
      { store: { userChat: { id: ME }, data: [], contacts: [] } },
    );
    let id = "x";
    act(() => {
      id = api?.newChat("404") ?? "x";
    });
    expect(loads.openChatWith, "a chat was opened with an unknown contact").not.toHaveBeenCalled();
    expect(id, "an unknown contact gave a chat id").toBe("");
  });
});
