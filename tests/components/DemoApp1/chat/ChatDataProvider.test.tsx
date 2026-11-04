import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "@testing-library/react";
import { renderWithProviders } from "../../../render";

// The real chat provider: on a chat screen it loads the chat, gives the
// screens the store's chat as their state, and keeps the chat on screen and
// the URL's `?id=` in step. The chat backend calls are mocked; nothing leaves
// the test.

const loads = vi.hoisted(() => ({
  getChats: vi.fn(),
  getContacts: vi.fn(),
  getCalls: vi.fn(),
  GetArchivedChats: vi.fn(),
  GetMyReminders: vi.fn(),
  runChatAction: vi.fn(async () => undefined),
  findChannel: vi.fn((_id: string) => undefined as unknown),
  GAevent: vi.fn(),
  trackPosthog: vi.fn(),
  sendTextMessage: vi.fn(),
  openChatWith: vi.fn(() => "ch-11"),
  saveContact: vi.fn(async () => "11"),
  findChat: vi.fn(async (_id: string) => null as unknown),
  openChatFromList: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("components/Chat/findChat", () => ({ findChat: loads.findChat }));
vi.mock("components/Chat/openChatFromList", () => ({ openChatFromList: loads.openChatFromList }));
vi.mock("services/chat", () => ({
  default: { getChats: loads.getChats, getContacts: loads.getContacts, getCalls: loads.getCalls },
}));
vi.mock("store/chat/actions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  GetArchivedChats: loads.GetArchivedChats,
  GetMyReminders: loads.GetMyReminders,
}));
vi.mock("components/DemoApp1/chat/chatActions", () => ({
  runChatAction: loads.runChatAction,
  findChannel: loads.findChannel,
}));
vi.mock("utils/gtag", () => ({ GAevent: loads.GAevent }));
vi.mock("utils/posthogEvents", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackPosthog: loads.trackPosthog,
}));
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
import { GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { NavCtx, type DemoNav } from "components/DemoApp1/screenNav";

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

/** Puts the provider up on `screen`, with the store and the URL given. */
async function mount(
  screen: string | null,
  store: Record<string, unknown>,
  url?: { path: string; search?: string },
) {
  const nav = { shown: screen, navigate: loads.navigate, back: vi.fn(), locale: "sy-en", t: (k: string) => k } as DemoNav;
  return renderWithProviders(
    <NavCtx.Provider value={nav}>
      <ChatDataProvider locale="sy-en" screen={screen}>
        <Probe onApi={keep} />
      </ChatDataProvider>
    </NavCtx.Provider>,
    { store, country: "sy", ...(url ?? { path: screen ? `/${screen}` : "/" }) },
  );
}

const urlId = () => new URLSearchParams(window.location.search).get("id");

const initial = useAppStore.getState();
beforeEach(() => {
  vi.clearAllMocks();
  api = null;
  // The chat a URL names is "loaded" when the store's list holds it.
  loads.findChannel.mockImplementation((id: string) =>
    (useAppStore.getState().data ?? []).find((c: { id: unknown }) => String(c.id) === id),
  );
});
afterEach(() => {
  useAppStore.setState(initial, true);
});

describe("the real chat provider — on a chat screen only", () => {
  it("on a chat screen it loads the chats, contacts, calls, archived chats and reminders", async () => {
    await mount("chat", { userChat: { id: ME } });
    expect(loads.getChats, "the chat list was not loaded from the chat backend").toHaveBeenCalledWith(false);
    expect(loads.getContacts, "the contacts were not loaded from the chat backend").toHaveBeenCalled();
    expect(loads.getCalls, "the calls were not loaded from the chat backend").toHaveBeenCalled();
    expect(loads.GetArchivedChats, "the archived chats were not loaded from the chat backend").toHaveBeenCalled();
    expect(loads.GetMyReminders, "the reminders were not loaded from the chat backend").toHaveBeenCalled();
  });

  it("sends the old chat window's events: GA CHAT_SCREEN and PostHog chat_opened", async () => {
    await mount("chat", { userChat: { id: ME } });
    expect(loads.GAevent, "GA did not get the chat screen view").toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ screen_name: GA_GLOBAL_SCREEN.CHAT_SCREEN }) }),
    );
    expect(loads.trackPosthog, "PostHog did not get chat_opened").toHaveBeenCalledWith("chat_opened");
  });

  it("on another new screen it loads nothing and maps no chat", async () => {
    await mount("settings", { userChat: { id: ME }, data: [chat("1", "Hi")] });
    expect(loads.getChats, "the chat was loaded on a screen that is not the chat").not.toHaveBeenCalled();
    expect(api?.state.chats, "the chat was mapped on a screen that is not the chat").toEqual([]);
  });

  it("loads nothing before the chat user is known", async () => {
    await mount("chat", { userChat: null });
    expect(loads.getChats, "the chat list was asked for with no chat user").not.toHaveBeenCalled();
  });

  it("gives the screens the store's chats, and follows the store when it changes", async () => {
    await mount("chat", { userChat: { id: ME }, data: [chat("1", "First words")] });
    expect(api?.state.chats.map((c) => c.preview), "the screens did not get the store's chat 1").toEqual([
      "First words",
    ]);
    act(() => {
      useAppStore.setState({ data: [chat("1", "First words"), chat("2", "Second words")] });
    });
    expect(api?.state.chats.map((c) => c.id), "the screens did not follow the store's new chat 2").toEqual(["1", "2"]);
  });
});

describe("the real chat provider — the chat on screen and its URL", () => {
  it("the chat on screen is the store's open chat, on a screen of one chat only", async () => {
    await mount("chat/conversation", { userChat: { id: ME }, data: [chat("1", "Hi")], activeChat: chat("1", "Hi") });
    expect(api?.state.viewing, "the store's open chat 1 is not on screen").toBe("1");
    act(() => {
      useAppStore.setState({ activeChat: null });
    });
    expect(api?.state.viewing, "a closed chat stayed on screen").toBeNull();
  });

  it("on the list no chat is 'on screen', even with one open in the store", async () => {
    await mount("chat", { userChat: { id: ME }, data: [chat("1", "Hi")], activeChat: chat("1", "Hi") });
    expect(api?.state.viewing, "the list claims a chat is on screen").toBeNull();
  });

  it("an open goes to the real chat and marks the row", async () => {
    await mount("chat", { userChat: { id: ME }, data: [chat("1", "Hi"), chat("2", "Yo")] });
    act(() => api?.dispatch({ type: "open", chat: "2" }));
    expect(loads.runChatAction, "the open did not reach the real chat").toHaveBeenCalledWith(
      { type: "open", chat: "2" },
      expect.anything(),
    );
    expect(api?.state.active, "the opened chat 2 is not the marked row").toBe("2");
  });

  it("fill: a conversation URL with no id gets the open chat's id", async () => {
    await mount("chat/conversation", { userChat: { id: ME }, data: [chat("1", "Hi")], activeChat: chat("1", "Hi") });
    expect(urlId(), "the conversation URL did not get the open chat's id").toBe("1");
  });

  it("read: a conversation URL with an id opens that chat once it is loaded", async () => {
    await mount("chat/conversation", { userChat: { id: ME }, data: [] }, { path: "/chat/conversation", search: "?id=2" });
    expect(loads.runChatAction, "a chat that is not loaded yet was opened").not.toHaveBeenCalled();
    act(() => {
      useAppStore.setState({ data: [chat("2", "Yo")] });
    });
    expect(loads.runChatAction, "chat 2 from the URL was not opened once it loaded").toHaveBeenCalledWith(
      { type: "open", chat: "2" },
      expect.anything(),
    );
  });

  it("read: the browser's back to another chat's URL opens that chat", async () => {
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [chat("1", "Hi"), chat("2", "Yo")], activeChat: chat("1", "Hi") },
      { path: "/chat/conversation", search: "?id=1" },
    );
    expect(loads.runChatAction, "the chat already open was opened again").not.toHaveBeenCalled();
    act(() => {
      window.history.replaceState(null, "", "/sy-en/chat/conversation?id=2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(loads.runChatAction, "back to chat 2's URL did not open chat 2").toHaveBeenCalledWith(
      { type: "open", chat: "2" },
      expect.anything(),
    );
  });

  it("switch: another chat opened on a conversation takes the URL at once", async () => {
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [chat("1", "Hi"), chat("2", "Yo")], activeChat: chat("1", "Hi") },
      { path: "/chat/conversation", search: "?id=1" },
    );
    act(() => api?.dispatch({ type: "open", chat: "2" }));
    expect(urlId(), "the URL still names chat 1 after chat 2 opened").toBe("2");
  });

  it("archiving the chat on screen closes it, as on /demo", async () => {
    const openChat = vi.fn();
    await mount("chat/conversation", {
      userChat: { id: ME },
      data: [chat("1", "Hi")],
      activeChat: chat("1", "Hi"),
      openChat,
    });
    act(() => api?.dispatch({ type: "archive", chat: "1" }));
    expect(openChat, "the archived chat stayed open").toHaveBeenCalledWith(null);
  });
});

describe("the real chat provider — sending", () => {
  it("a text goes to the real send, with its reply", async () => {
    await mount("chat/conversation", { userChat: { id: ME }, data: [chat("1", "Hi")] });
    act(() => api?.sendText("1", "Hello", { id: "100", text: "Hi" }));
    expect(loads.sendTextMessage, "the text did not reach the real send with its reply").toHaveBeenCalledWith(
      "1",
      "Hello",
      { id: "100", text: "Hi" },
    );
  });

  it("a location says 'Soon available' (no chat backend yet, CH-2) and sends nothing", async () => {
    await mount("chat/conversation", { userChat: { id: ME }, data: [chat("1", "Hi")] });
    act(() => api?.sendLocation("1", { lat: 1, lng: 2 }));
    // translateFunction writes English in title case; step 9 sets the case rule (D-4).
    expect(api?.notice, "a location did not say 'Soon available'").toMatch(/^soon available$/i);
  });

  it("a new chat with a contact opens the chat with the store's contact", async () => {
    await mount("chat", {
      userChat: { id: ME },
      data: [],
      contacts: [{ id: 1, name: "Friend", contact_user: { id: 11, name: "Friend" } }],
    });
    let id = "";
    act(() => {
      id = api?.newChat("11") ?? "";
    });
    expect(loads.openChatWith, "the new chat was not opened with the contact from the store").toHaveBeenCalledWith(
      expect.objectContaining({ id: "11", name: "Friend" }),
    );
    expect(id, "the new chat's id was not given back").toBe("ch-11");
    expect(api?.state.active, "the new chat is not the marked row").toBe("ch-11");
  });

  it("a new chat with someone who is not a contact opens nothing", async () => {
    await mount("chat", { userChat: { id: ME }, data: [], contacts: [] });
    let id = "x";
    act(() => {
      id = api?.newChat("404") ?? "x";
    });
    expect(loads.openChatWith, "a chat was opened with an unknown contact").not.toHaveBeenCalled();
    expect(id, "an unknown contact gave a chat id").toBe("");
  });
});

describe("the real chat provider — a reload of one chat's URL", () => {
  it("while the URL's chat is not loaded, it is the chat on screen, so the screens wait for it", async () => {
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [chat("1", "Hi")], chat_loading: true },
      { path: "/chat/conversation", search: "?id=2" },
    );
    expect(api?.state.viewing, "the screens were not told to wait for chat 2 from the URL").toBe("2");
    expect(urlId(), "the URL lost chat 2's id while it loads").toBe("2");
  });

  it("a URL chat outside the loaded pages is found on the chat backend's pages, then opened", async () => {
    loads.findChat.mockResolvedValueOnce(chat("12", "Far down"));
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [chat("1", "Hi")], chat_loading: false },
      { path: "/chat/conversation", search: "?id=12" },
    );
    await act(async () => {});
    expect(loads.findChat, "the chat pages were not walked for chat 12").toHaveBeenCalledWith("12");
    expect(loads.openChatFromList, "chat 12 from the chat pages was not opened").toHaveBeenCalledWith(
      expect.objectContaining({ id: "12" }),
    );
  });

  it("does not walk the chat pages before the first page of chats is in", async () => {
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [], chat_loading: true },
      { path: "/chat/conversation", search: "?id=12" },
    );
    await act(async () => {});
    expect(loads.findChat, "the chat pages were walked while the first page was still loading").not.toHaveBeenCalled();
  });

  it("a URL chat no page holds: 'Could not open the chat', and back to the list", async () => {
    loads.findChat.mockResolvedValueOnce(null);
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [chat("1", "Hi")], chat_loading: false },
      { path: "/chat/conversation", search: "?id=404" },
    );
    await act(async () => {});
    expect(api?.notice?.toLowerCase(), "the shopper was not told the chat could not be opened").toBe(
      "could not open the chat",
    );
    expect(loads.navigate, "the screen did not go back to the chat list").toHaveBeenCalledWith("chat", -1);
    expect(api?.state.viewing, "the screens stopped waiting and could show another chat").toBe("404");
  });

  it("a new chat's URL (ch-9) opens the chat with that contact again", async () => {
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [chat("1", "Hi")], chat_loading: false },
      { path: "/chat/conversation", search: "?id=ch-9" },
    );
    expect(loads.openChatWith, "the chat with contact 9 was not opened from the new chat's URL").toHaveBeenCalledWith(
      expect.objectContaining({ id: "9" }),
    );
    expect(loads.findChat, "the chat pages were walked for a new chat's id").not.toHaveBeenCalled();
  });

  it("a new chat's URL waits for the contact book, then opens the chat with that contact", async () => {
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [], contacts: [], chat_loading: false },
      { path: "/chat/conversation", search: "?id=ch-30" },
    );
    expect(loads.navigate, "the new chat was given up before the contact book loaded").not.toHaveBeenCalled();
    act(() => {
      useAppStore.setState({ contacts: [{ id: 1, name: "Sam", contact_user: { id: 30, name: "Sam" } }] });
    });
    expect(loads.openChatWith, "the chat with contact 30 was not opened once the contact book loaded").toHaveBeenCalledWith(
      expect.objectContaining({ id: "30" }),
    );
  });

  it("follow: when the open chat changes by itself (a new chat got its real id), the URL follows", async () => {
    await mount(
      "chat/conversation",
      { userChat: { id: ME }, data: [chat("1", "Hi")], activeChat: chat("1", "Hi") },
      { path: "/chat/conversation", search: "?id=1" },
    );
    act(() => {
      useAppStore.setState({ activeChat: chat("5", "First message") });
    });
    expect(urlId(), "the URL still names chat 1 after chat 5 took its place").toBe("5");
  });
});
