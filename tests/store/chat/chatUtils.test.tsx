// Small chat helpers (store/chat/chatUtils.tsx): the tick under a message,
// the message time, delete, copy, and the "text avatar" check.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const { chatUser, deleteApi, logError, deleteMessage, storeState } = vi.hoisted(() => ({
  chatUser: { current: { id: 1 } as any },
  deleteApi: vi.fn(),
  logError: vi.fn(),
  deleteMessage: vi.fn(),
  storeState: { current: {} as any },
}));

vi.mock("utils/functions", () => ({
  getUserChat: () => chatUser.current,
  LogError: (...a: any[]) => logError(...a),
}));

vi.mock("store/chat/actions", () => ({
  DeleteMessageApi: (...a: any[]) => deleteApi(...a),
}));

vi.mock("store", () => ({
  useAppStore: { getState: () => storeState.current },
}));

import {
  copyText,
  DeleteMessage,
  getMessageStatus,
  getMessageTime,
  IsTextAvatar,
} from "store/chat/chatUtils";

const ME = 1;
const THEM = 2;

beforeEach(() => {
  chatUser.current = { id: ME };
  deleteApi.mockClear();
  logError.mockClear();
  deleteMessage.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

function statuses(other: Record<string, any>) {
  return [
    { user_id: ME, is_watched: false, is_received: 0 },
    { user_id: THEM, is_watched: false, is_received: 0, watched_at: null, received_at: null, ...other },
  ] as any;
}

function icon(el: ReturnType<typeof getMessageStatus>) {
  const { container } = render(el);
  return {
    src: container.querySelector("img")?.getAttribute("src") ?? null,
    spinner: !!container.querySelector("svg.animate-spin"),
    text: container.textContent,
  };
}

describe("getMessageStatus — the tick under my message", () => {
  const created_at = "2030-01-01T08:05:00";

  it("shows a spinner while the message is still pending", () => {
    const r = icon(getMessageStatus({ mid: "m1", message_status: statuses({}), created_at }));
    expect(r.spinner, "a pending message did not show the spinner").toBe(true);
    expect(r.src, "a pending message showed a tick").toBeNull();
  });

  it("shows the read tick when the other reader watched it", () => {
    const r = icon(
      getMessageStatus({ message_status: statuses({ is_watched: true, watched_at: "x" }), created_at }),
    );
    expect(r.src, "a watched message did not show the read tick").toBe("/icons/chat/read.svg");
    expect(r.text, "the send time was not shown").toBe("08:05");
  });

  it("shows the received tick when it reached the other reader", () => {
    const r = icon(
      getMessageStatus({ message_status: statuses({ is_received: 1, received_at: "x" }), created_at }),
    );
    expect(r.src, "a received message did not show the received tick").toBe("/icons/chat/recieved.svg");
  });

  it("shows the sent tick otherwise, even with no other reader", () => {
    const r = icon(getMessageStatus({ message_status: [], created_at }));
    expect(r.src, "a message nobody has seen did not show the sent tick").toBe("/icons/chat/sent.svg");
    chatUser.current = null;
    const r2 = icon(getMessageStatus({ message_status: statuses({}), created_at }));
    expect(r2.src, "with no chat user the sent tick was not shown").toBe("/icons/chat/sent.svg");
  });
});

describe("getMessageTime", () => {
  it("formats a local time as HH:MM with leading zeros", () => {
    expect(getMessageTime("2030-01-01T08:05:00", true), "a morning time lost its leading zeros").toBe("08:05");
    expect(getMessageTime("2030-01-01T18:45:00", true), "an evening time was wrong").toBe("18:45");
  });

  it("adds three hours to a server time", () => {
    expect(getMessageTime("2030-01-01T05:05:00", false), "the server time was not moved by three hours").toBe("08:05");
    expect(getMessageTime("2030-01-01T10:30:00", false), "a later server time was wrong").toBe("13:30");
  });

  it("uses the current time when there is none", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 0, 1, 7, 3));
    expect(getMessageTime(null, true), "no time did not fall back to now").toBe("07:03");
    vi.setSystemTime(new Date(2030, 0, 1, 21, 40));
    expect(getMessageTime(undefined, false), "no time did not fall back to now").toBe("21:40");
  });
});

describe("DeleteMessage", () => {
  it("removes the message locally and tells the chat backend", () => {
    storeState.current = { deleteMessage };
    DeleteMessage(3, 9, true);
    expect(deleteMessage, "the message was not removed from the store").toHaveBeenCalledWith({ ch_id: 3, msg_id: 9, bool: true });
    expect(deleteApi, "the chat backend was not asked to delete the message").toHaveBeenCalledWith(9, true);
  });
});

describe("copyText", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    document.body.innerHTML = "";
  });

  it("does nothing for a file message or an empty text", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await copyText({ message_content: [] as any });
    await copyText({ message_content: { content: "" } as any });
    expect(writeText, "an empty or file message was copied").not.toHaveBeenCalled();
  });

  it("copies the text with the clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await copyText({ message_content: { content: "hello" } as any });
    expect(writeText, "the text was not put on the clipboard").toHaveBeenCalledWith("hello");
  });

  it("falls back to the hidden textarea when there is no clipboard API", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    document.body.innerHTML = '<textarea id="text-copy"></textarea>';
    const exec = vi.fn();
    (document as any).execCommand = exec;
    await copyText({ message_content: { content: "hi" } as any });
    expect((document.querySelector("#text-copy") as HTMLTextAreaElement).value, "the text was not put in the copy field").toBe("hi");
    expect(exec, "the browser copy command was not run").toHaveBeenCalledWith("Copy");
  });

  it("logs to Sentry when there is no way to copy", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    await copyText({ message_content: { content: "hi" } as any });
    expect(logError.mock.calls[0]?.[0]?.scenario, "a failed copy was not reported").toBe("copyText in chat utils - chat widget");
  });
});

describe("IsTextAvatar", () => {
  function withMe(user: any) {
    storeState.current = {
      activeChat: { channel_members: [{ user_id: ME, user }, { user_id: THEM, user: { name: "x" } }] },
    };
  }

  it("is true when my member has a name and no photo, or a placeholder photo", () => {
    withMe({ name: "Me", photo_path: null });
    expect(IsTextAvatar(), "a named member with no photo did not get a text avatar").toBe(true);
    withMe({ name: "Me", photo_path: "https://eu.example/p.png" });
    expect(IsTextAvatar(), "a placeholder photo did not get a text avatar").toBe(true);
  });

  it("is false with a real photo or no name", () => {
    withMe({ name: "Me", photo_path: "/real.png" });
    expect(IsTextAvatar(), "a member with a real photo got a text avatar").toBe(false);
    withMe({ name: "", photo_path: null });
    expect(IsTextAvatar(), "a member with no name got a text avatar").toBe(false);
  });
});
