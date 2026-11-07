import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { renderWithProviders } from "../../../render";

// Saving a chat's media on the shopper's machine. A file from the media server
// is on another origin, where the browser ignores `download` and only opens a
// tab, so the save goes through `downloadFile` (90b9c36be).

const saved = vi.hoisted(() => ({ downloadFile: vi.fn(async () => "blob") }));
vi.mock("components/Chat/downloadFile", () => ({ downloadFile: saved.downloadFile }));

import { FileMessage } from "components/DemoApp1/chat/messages";
import ConversationScreen from "components/DemoApp1/screens/ConversationScreen";
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a file bubble", () => {
  const file = {
    id: "1",
    kind: "file",
    side: "in",
    src: "https://media.example/report.pdf",
    name: "report.pdf",
    time: "10:00",
  } as never;
  const bubble = () => document.querySelector<HTMLElement>('[data-pw="demo-chat-file-in"]')!;

  it("saves the file on a tap, under its own name", () => {
    render(<FileMessage message={file} t={(k: string) => k} />);
    fireEvent.pointerDown(bubble(), { clientX: 5, clientY: 5 });
    fireEvent.click(bubble(), { clientX: 5, clientY: 5 });
    expect(saved.downloadFile, "the tap did not save the file").toHaveBeenCalledWith(
      "https://media.example/report.pdf",
      "report.pdf",
    );
  });

  it("does not follow its link, which would open a tab as well", () => {
    render(<FileMessage message={file} t={(k: string) => k} />);
    fireEvent.pointerDown(bubble(), { clientX: 5, clientY: 5 });
    const followed = fireEvent.click(bubble(), { clientX: 5, clientY: 5 });
    expect(followed, "the tap also followed the link").toBe(false);
  });
});

describe("a held photo in the real chat", () => {
  const ME = 7;
  const PEER = 9;
  const SRC = "https://media.example/photo.jpg";
  const message = (id: string, type: string, file?: string) => ({
    id,
    sender_user_id: PEER,
    created_at: "2026-11-04T10:00:00",
    message_type: { name: type },
    message_content: { content: "Hello" },
    message_files: file ? [{ file_path: file, file_name: "" }] : [],
    message_status: [],
    auth_message_status: { is_deleted: 0, delete_for_all: false },
  });
  const chat: any = {
    id: "12",
    channel_name: "Chat 12",
    updated_at: "2026-11-04T09:00:00",
    channel_members: [
      { id: 1, user_id: ME, pin: 0, mute: 0, is_blocked: 0, user: { id: ME, name: "Me" } },
      { id: 2, user_id: PEER, pin: 0, mute: 0, is_blocked: 0, user: { id: PEER, name: "Peer" } },
    ],
    messages: [message("70", "ImageMessage", SRC), message("71", "TextMessage")],
  };
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
  const value = (real: boolean): ChatApi => ({
    state: toChatState(
      { chats: [chat], archived: [], open: null, book: [] },
      { myId: String(ME), words, locale: "sy-en" },
      { active: null, viewing: "12" },
    ),
    dispatch: vi.fn(),
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
    ...(real ? { call: vi.fn() } : {}),
  });
  const nav: DemoNav = {
    shown: "chat/conversation",
    navigate: vi.fn(),
    back: vi.fn(),
    locale: "sy-en",
    t: (key) => key,
  };

  async function hold(id: string, api: ChatApi) {
    await renderWithProviders(
      <NavCtx.Provider value={nav}>
        <ChatContext.Provider value={api}>
          <ConversationScreen />
        </ChatContext.Provider>
      </NavCtx.Provider>,
      { country: "sy", path: "/chat/conversation" },
    );
    const row = document.querySelector<HTMLElement>(`[data-pw="demo-chat-message-${id}"] [data-pw], [data-pw="demo-chat-message-${id}"] > *`);
    if (!row) throw new Error(`the conversation shows no message ${id}`);
    fireEvent.pointerDown(row, { clientX: 20, clientY: 20, pointerId: 1 });
    await act(() => new Promise((done) => setTimeout(done, 600)));
  }
  const download = () => document.querySelector<HTMLElement>('[data-pw="demo-chat-menu-download"]');

  it("offers Download, and saves the photo", async () => {
    await hold("70", value(true));
    expect(download(), "the held photo's menu has no Download row").not.toBeNull();
    await act(async () => {
      fireEvent.click(download()!);
    });
    expect(saved.downloadFile, "Download did not save the photo").toHaveBeenCalledWith(SRC);
  });

  it("offers no Download on a text", async () => {
    await hold("71", value(true));
    expect(document.querySelector('[data-pw="demo-chat-menu-copy"]'), "holding the text opened no menu").not.toBeNull();
    expect(download(), "a text offers Download").toBeNull();
  });

  it("leaves the /demo menu as it was", async () => {
    await hold("70", value(false));
    expect(document.querySelector('[data-pw="demo-chat-menu-copy"]'), "holding the photo opened no menu").not.toBeNull();
    expect(download(), "the /demo menu changed").toBeNull();
  });
});
