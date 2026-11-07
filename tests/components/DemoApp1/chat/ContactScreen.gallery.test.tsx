import { describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../render";
import ContactScreen from "components/DemoApp1/screens/ContactScreen";
import { ChatContext, type ChatApi, type ChatExtras } from "components/DemoApp1/chat/chatContext";
import { toChatState } from "components/DemoApp1/chat/chatMapper";
import { NavCtx, type DemoNav } from "components/DemoApp1/screenNav";

// The contact page's "Save To Gallery" row is the shopper's real auto-save
// choice in the real chat. On /demo it stays the design's "ALWAYS".

const ME = 7;
const PEER = 9;
const chat: any = {
  id: "12",
  channel_name: "Chat 12",
  updated_at: "2026-11-04T09:00:00",
  channel_members: [
    { id: 1, user_id: ME, pin: 0, mute: 0, is_blocked: 0, user: { id: ME, name: "Me" } },
    { id: 2, user_id: PEER, pin: 0, mute: 0, is_blocked: 0, user: { id: PEER, name: "Peer" } },
  ],
  messages: [],
};
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

function value(extras?: Partial<ChatExtras>): ChatApi {
  return {
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
    ...(extras ? { extras: extras as ChatExtras } : {}),
  };
}

const nav: DemoNav = { shown: "chat/contact", navigate: vi.fn(), back: vi.fn(), locale: "sy-en", t: (key) => key };

const show = (api: ChatApi) =>
  renderWithProviders(
    <NavCtx.Provider value={nav}>
      <ChatContext.Provider value={api}>
        <ContactScreen />
      </ChatContext.Provider>
    </NavCtx.Provider>,
    { country: "sy", path: "/chat/contact" },
  );

const row = () => {
  const found = document.querySelector<HTMLElement>('[data-pw="demo-contact-row-save-to-gallery"]');
  if (!found) throw new Error("the contact page shows no Save To Gallery row");
  return found;
};

describe("the contact page's Save To Gallery row", () => {
  it("shows the shopper's real choice, not the design's sample", async () => {
    await show(value({ autoDownload: { read: () => "never", write: vi.fn() } }));
    expect(row().textContent, "the row says ALWAYS while the shopper's choice is Never").toContain("NEVER");
  });

  it("a tap turns Never into Always, and saves it", async () => {
    const write = vi.fn();
    await show(value({ autoDownload: { read: () => "never", write } }));
    await act(async () => {
      fireEvent.click(row());
    });
    expect(write, "the choice Always was not saved").toHaveBeenCalledWith("always");
    expect(row().textContent, "the row did not change to ALWAYS").toContain("ALWAYS");
  });

  it("a tap turns Always into Never, so a shopper can stop the saving", async () => {
    const write = vi.fn();
    await show(value({ autoDownload: { read: () => "always", write } }));
    await act(async () => {
      fireEvent.click(row());
    });
    expect(write, "the choice Never was not saved").toHaveBeenCalledWith("never");
    expect(row().textContent, "the row did not change to NEVER").toContain("NEVER");
  });

  it("stays the design's ALWAYS on /demo, which has no real choice", async () => {
    await show(value());
    expect(row().textContent, "the /demo row changed").toContain("ALWAYS");
  });
});
