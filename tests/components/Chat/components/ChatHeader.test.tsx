// The bar on top of an open chat (components/Chat/components/ChatHeader.tsx):
// back, the other person's name and status, and the call buttons.
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  voice: null as any,
  video: null as any,
  showError: null as any,
  logError: null as any,
}));

vi.mock("store/chat/callActions", () => ({
  makeVoiceCall: (...a: any[]) => h.voice(...a),
  makeVideoCall: (...a: any[]) => h.video(...a),
}));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => h.showError(...a),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));
vi.mock("components/Chat/components/ChatPhoto", () => ({
  default: (p: any) => <div data-testid="photo">{p.user?.name}</div>,
}));

// TypingIndicator.js holds JSX in a .js file, which the test build cannot parse.
vi.mock("components/Chat/components/TypingIndicator", () => ({
  typingLabel: (status: string) => `typing: ${status}`,
}));

import ChatHeader from "components/Chat/components/ChatHeader";

const ME = 1;

function chat(extra: Record<string, any> = {}) {
  return {
    id: 7,
    channel_members: [
      { user_id: ME, user: { name: "Me" } },
      { user_id: 2, user: { name: "Other Person", photo_path: "/p.png", mobile_phone: "p-0" } },
    ],
    messages: [],
    ...extra,
  };
}

async function mount(props: Record<string, any> = {}, store: Record<string, any> = {}, language: any = "en") {
  const spies = { setMain: vi.fn(), openChat: vi.fn(), setReplyMessage: vi.fn() };
  const p = {
    chats: [],
    activeChat: chat(),
    isBlockedEachOther: false,
    openDetails: vi.fn(),
    isPrivate: null,
    closeWidget: vi.fn(),
    close: vi.fn(),
    ...props,
  };
  await renderWithProviders(<ChatHeader {...(p as any)} />, {
    language,
    store: { userChat: { id: ME }, callLoading: null, isCallIncoming: false, Server_time: "2030-01-15T12:00:00", ...spies, ...store },
  });
  return { p, spies };
}

const videoBtn = () => document.querySelector(".vcall") as HTMLElement;
const voiceBtn = () => document.querySelector(".call") as HTMLElement;

beforeEach(() => {
  h.voice = vi.fn(async () => {});
  h.video = vi.fn(async () => {});
  h.showError = vi.fn();
  h.logError = vi.fn();
});

describe("ChatHeader — who and where", () => {
  it("shows the other person's name and photo, and opens the details", async () => {
    const { p } = await mount();
    expect(screen.getByTestId("photo").textContent, "the other person's photo was not shown").toBe("Other Person");
    expect(document.querySelector(".user-name-top-chat")?.textContent, "the other person's name was not shown").toBe("Other Person");
    fireEvent.click(document.querySelector(".user-top-chat")!);
    expect(p.openDetails, "the details did not open").toHaveBeenCalled();
  });

  it("falls back to the chat id when the other person has no name", async () => {
    await mount({ activeChat: chat({ channel_members: [{ user_id: ME }, { user_id: 2, user: {} }] }) });
    expect(screen.getByText("User-7"), "a nameless chat did not fall back to its id").toBeInTheDocument();
  });

  it("shows typing, 'Online' or 'last seen'", async () => {
    await mount({ activeChat: chat({ status: "Typing..." }) });
    expect(document.querySelector(".user-status")?.textContent, "typing was not shown").toMatch(/typing/i);
    await mount({ activeChat: chat({ status: "null", activeDate: "2030-01-15T11:58:00" }) });
    expect(screen.getByText("Online"), "someone seen two minutes ago was not online").toBeInTheDocument();
    await mount({ activeChat: chat({ activeDate: "2020-01-15T10:00:00" }) });
    expect(screen.getByText(/Last Seen/), "someone seen long ago did not show last seen").toBeInTheDocument();
  });

  it("hides the status of a blocked chat, and an empty status", async () => {
    await mount({ isBlockedEachOther: true, activeChat: chat({ status: "Typing..." }) });
    expect(document.querySelector(".user-status"), "a blocked chat showed a status").toBeNull();
    await mount({ activeChat: chat({ status: "null" }) });
    expect(document.querySelector(".user-status")?.textContent, "a 'null' status with no last-seen date showed text").toBe("");
  });

  it("shows how many other chats have new messages", async () => {
    const unread = {
      id: 9,
      messages: [
        {
          sender_user_id: 2,
          message_type: { name: "TextMessage" },
          message_status: [{ user_id: ME, is_watched: false }],
          auth_message_status: { delete_for_all: false },
        },
      ],
    };
    await mount({ chats: [unread] });
    expect(document.querySelector(".new-chat-num")?.textContent, "the new chat count was not shown").toBe("1");
  });

  it("the back arrow closes the chat, and the widget in an order chat", async () => {
    const { p, spies } = await mount({ isPrivate: 5 });
    fireEvent.click(document.querySelector('img[src="/icons/chat/arrow.svg"]')!);
    expect(spies.setMain, "the view did not go back to the list").toHaveBeenCalledWith("main");
    expect(spies.openChat, "the chat was not closed").toHaveBeenCalledWith(null);
    expect(spies.setReplyMessage, "the reply was not cleared").toHaveBeenCalledWith(null);
    expect(p.close, "the search was not closed").toHaveBeenCalled();
    expect(p.closeWidget, "the order chat widget did not close").toHaveBeenCalled();
    expect(videoBtn(), "an order chat offered a video call").toBeNull();
  });

  it("lays out right to left for Arabic", async () => {
    await mount({}, {}, "ar");
    expect(document.querySelector(".chat-screen-top")!.className, "the header did not flip for Arabic").toContain("flex-row-reverse");
  });
});

describe("ChatHeader — calls", () => {
  it("places voice and video calls to the other person", async () => {
    await mount();
    fireEvent.click(voiceBtn());
    fireEvent.click(videoBtn());
    expect(h.voice, "the voice call was not placed").toHaveBeenCalledWith(7, "Other Person", "/p.png", "p-0", null);
    expect(h.video, "the video call was not placed").toHaveBeenCalledWith(7, "Other Person", "/p.png", "p-0", null);
  });

  it("an order chat sends the order participant with the call", async () => {
    await mount({ isPrivate: 5, activeChat: chat({ order_chat_participant_id: 33 }) });
    fireEvent.click(voiceBtn());
    expect(h.voice.mock.calls[0][4], "the order call did not carry the participant").toEqual({
      order_chat_participant_id: 33,
      receiver_user_id: 2,
      is_private: true,
    });
  });

  it("does not call while a call is starting or ringing", async () => {
    await mount({}, { callLoading: "voice" });
    fireEvent.click(voiceBtn());
    fireEvent.click(videoBtn());
    expect(voiceBtn().className, "the call buttons were not dimmed").toContain("opacity-40");
    await mount({}, { isCallIncoming: true });
    fireEvent.click(document.querySelectorAll(".call")[1] as HTMLElement);
    fireEvent.click(document.querySelectorAll(".vcall")[1] as HTMLElement);
    expect(h.voice, "a voice call started during another").not.toHaveBeenCalled();
    expect(h.video, "a video call started during another").not.toHaveBeenCalled();
  });

  it("refuses calls in a blocked chat", async () => {
    await mount({ isBlockedEachOther: true });
    fireEvent.click(voiceBtn());
    fireEvent.click(videoBtn());
    expect(h.showError.mock.calls.map((c) => c[0]), "the blocked calls were not refused with a message").toEqual([
      "You Cannot Send Messages Or Calls To This User",
      "You Cannot Send Messages Or Calls To This User",
    ]);
    expect(h.voice, "a blocked chat placed a call").not.toHaveBeenCalled();
  });

  it("says the call failed when the chat has no member list", async () => {
    await mount({ activeChat: { id: 7 } });
    fireEvent.click(voiceBtn());
    fireEvent.click(videoBtn());
    expect(h.showError.mock.calls.map((c) => c[0]), "a call that could not start was not reported").toEqual([
      "Failed To Initialize Call",
      "Failed To Initialize Call",
    ]);
    expect(h.logError.mock.calls.map((c) => c[0].scenario), "the failed calls were not logged").toEqual([
      "initial audioCallFunction in chat header - chat widget",
      "initial videoCallFunction in chat header - chat widget",
    ]);
  });
});
