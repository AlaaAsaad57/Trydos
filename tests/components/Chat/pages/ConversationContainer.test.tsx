// The open conversation (components/Chat/pages/ConversationContainer.tsx).
//
// The container wires a dozen child widgets to the chat backend. Each child is
// replaced here by a stand-in that records the props it was given, so a test
// can press the child's buttons by calling those props — the same callbacks the
// real child would call. The chat backend calls (`SendMessage`, `getPage`, …),
// the media upload and firebase are replaced too; nothing reaches a network.
import React from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  props: {} as Record<string, any>,
  sendMessageApi: vi.fn(),
  getPage: vi.fn(),
  getBetween: vi.fn(),
  getChatDetails: vi.fn(),
  makeVideoCall: vi.fn(),
  makeVoiceCall: vi.fn(),
  showError: vi.fn(),
  logError: vi.fn(),
  track: vi.fn(),
  upload: vi.fn(),
  permission: { granted: true },
  dbQueue: Promise.resolve() as Promise<unknown>,
  // Kept from before any test fakes the clock, so the queue below keeps moving.
  realSetTimeout: globalThis.setTimeout.bind(globalThis),
  fb: {
    ref: vi.fn((_db: any, path: string) => ({ path })),
    push: vi.fn(() => Promise.resolve()),
    set: vi.fn(() => Promise.resolve()),
  },
}));

/** A child stand-in: records its props under `name` and renders a marker. */
function stub(name: string) {
  return {
    default: (p: any) => {
      h.props[name] = p;
      return <div data-testid={name} />;
    },
  };
}

vi.mock("components/Chat/components/Recorder", () => stub("Recorder"));
vi.mock("components/Chat/components/ChatHeader", () => stub("ChatHeader"));
vi.mock("components/Chat/components/ReplyMessage", () => stub("ReplyMessage"));
vi.mock("components/Chat/components/ChatInfo", () => stub("ChatInfo"));
vi.mock("components/Chat/components/ChatHistoryElement", () => stub("Observable"));
vi.mock("components/Chat/components/CameraComponent", () => stub("Camera"));
vi.mock("components/Chat/components/ChatSearch", () => stub("ChatSearch"));
vi.mock("components/Chat/components/ChatImagePreviewBeforeSend", () => stub("ImagePreview"));
vi.mock("components/Chat/components/MediaMessagePreview", () => stub("MediaPreview"));
vi.mock("components/global/Popup", () => stub("Popup"));
vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: (p: any) => {
    h.props.Crop = p;
    return <div data-testid="Crop" />;
  },
}));
// ChatMessage renders the anchor the "jump to quoted message" code scrolls to.
vi.mock("components/Chat/components/ChatMessage", () => ({
  default: (p: any) => {
    (h.props.messages ??= {})[p.id] = p;
    return <div id={`main-container-${p.id}`} data-testid="message" data-type={p.type} />;
  },
}));

vi.mock("store/chat/actions", () => ({
  SendMessage: (...a: any[]) => h.sendMessageApi(...a),
  getPage: (...a: any[]) => h.getPage(...a),
  getMessagesBetweenTwoMessages: (...a: any[]) => h.getBetween(...a),
  GetChatDetails: (...a: any[]) => h.getChatDetails(...a),
}));
vi.mock("store/chat/callActions", () => ({
  makeVideoCall: (...a: any[]) => h.makeVideoCall(...a),
  makeVoiceCall: (...a: any[]) => h.makeVoiceCall(...a),
}));
vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => h.showError(...a),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));
vi.mock("utils/posthogEvents", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackPosthog: (...a: any[]) => h.track(...a),
}));
vi.mock("components/Chat/chatsFunctions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  upload: (...a: any[]) => h.upload(...a),
}));
vi.mock("@/utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  requestPermissions: async () => h.permission.granted,
}));
// getDb hands out the fake database one caller at a time. When several of the
// container's status writes started in the same tick (focus, blur and cancel on
// the file input, for example), their `await import("firebase/database")` calls
// ran together and one of them was sometimes given the real package instead of
// the stand-in; the real `ref()` then threw on the fake database as an
// unhandled rejection.
vi.mock("utils/firebaseInitv1", () => ({
  getDb: () => {
    // One answer at a time, a macrotask apart, so the container never has two
    // of its own `import("firebase/database")` calls in flight together.
    const turn = h.dbQueue.then(() => new Promise((resolve) => h.realSetTimeout(resolve, 0)));
    h.dbQueue = turn;
    return turn.then(() => ({ db: true }));
  },
}));
vi.mock("firebase/database", () => h.fb);

import ConversationContainer from "components/Chat/pages/ConversationContainer";

const ME = 1;
const THEM = 2;

function msg(id: any, extra: Record<string, any> = {}) {
  return {
    id,
    sender_user_id: THEM,
    created_at: "2030-01-15T10:00:00",
    message_type: { name: "TextMessage" },
    message_content: { content: `text ${id}` },
    message_status: [],
    ...extra,
  };
}

function chatWith(messages: any[] = [msg(10)], extra: Record<string, any> = {}) {
  return {
    id: 7,
    messages,
    channel_members: [
      { user_id: ME, user: { name: "Me" } },
      { user_id: THEM, user: { name: "Them", photo_path: "/p.png", mobile_phone: "p" } },
    ],
    ...extra,
  };
}

function storeSpies() {
  return {
    sendMessage: vi.fn(),
    watchChannel: vi.fn(),
    deleteErrorMessage: vi.fn(),
    setQouted: vi.fn(),
    setMessagesPage: vi.fn(),
    setReplyMessage: vi.fn(),
  };
}

async function mount({
  chat = chatWith(),
  store = {},
  props = {},
}: { chat?: any; store?: Record<string, any>; props?: Record<string, any> } = {}) {
  const spies = storeSpies();
  const setSearch = vi.fn();
  const closeWidget = vi.fn();
  const utils = await renderWithProviders(
    <ConversationContainer
      ViewedScreen={true}
      loading={false}
      first={false}
      setSearch={setSearch}
      closeWidget={closeWidget}
      {...props}
    />,
    {
      store: {
        userChat: { id: ME },
        activeChat: chat,
        data: [chat],
        replyMessage: null,
        callLoading: null,
        ...spies,
        ...store,
      },
    },
  );
  return { ...utils, spies, setSearch, closeWidget };
}

function fileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

/** Put a file on the hidden input and fire change, the way the browser does. */
function pick(file: any, writable = true) {
  const input = fileInput();
  Object.defineProperty(input, "files", { value: file ? [file] : [], writable, configurable: true });
  fireEvent.change(input);
}

beforeEach(() => {
  h.props = {};
  h.dbQueue = Promise.resolve();
  [h.sendMessageApi, h.getPage, h.getBetween, h.getChatDetails, h.makeVideoCall, h.makeVoiceCall, h.showError, h.logError, h.track, h.upload, h.fb.push, h.fb.set, h.fb.ref].forEach((f) => f.mockClear());
  h.upload.mockResolvedValue({ path: "/up/file", name: "file.bin" });
  h.getBetween.mockResolvedValue(undefined);
  h.permission.granted = true;
  Element.prototype.scrollIntoView = vi.fn();
  (URL as any).createObjectURL = vi.fn(() => "blob:test");
});

afterEach(async () => {
  // Let the typing-status writes a test started finish inside that test, so
  // none of them runs while the next test is being set up.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ConversationContainer — the message list", () => {
  it("groups messages from one sender on one day and marks date changes", async () => {
    const chat = chatWith([
      msg(0, { created_at: "2030-01-15T09:59:00", sender_user_id: ME }),
      msg(1, { created_at: "2030-01-15T10:00:00" }),
      msg(2, { created_at: "2030-01-15T10:01:00" }),
      msg(3, { created_at: "2030-01-15T10:02:00" }),
      msg(4, { created_at: "2030-01-15T10:03:00", sender_user_id: ME }),
      msg(5, { created_at: "2030-01-15T10:04:00", sender_user_id: ME, parent_message: { id: 1 } }),
      msg(6, { created_at: "2030-01-15T10:05:00", type: "call" }),
      msg(7, { created_at: "2030-01-16T10:00:00", message_files: [{ file_path: "false" }] }),
      msg(8, { created_at: "2030-01-16T10:01:00" }),
    ]);
    await mount({ chat });
    const types = screen.getAllByTestId("message").map((el) => el.getAttribute("data-type"));
    expect(types, "the bubbles were not grouped by sender and day").toEqual([
      "lonely",
      "first-chat",
      "middle-chat",
      "last-chat",
      "lonely",
      "lonely",
      "lonely",
      "lonely",
      "lonely",
    ]);
    expect(document.querySelectorAll(".last-date-value").length, "a date line was not shown for each day").toBe(2);
  });

  it("starts a run after a call and ends a run before another sender", async () => {
    const chat = chatWith([
      msg(1, { created_at: "2030-01-15T10:00:00", sender_user_id: ME }),
      msg(2, { created_at: "2030-01-15T10:01:00" }),
      msg(3, { created_at: "2030-01-15T10:02:00" }),
      msg(4, { created_at: "2030-01-15T10:03:00", sender_user_id: ME }),
    ]);
    await mount({ chat });
    const types = screen.getAllByTestId("message").map((el) => el.getAttribute("data-type"));
    expect(types, "a run after another sender was not first/last").toEqual(["lonely", "first-chat", "last-chat", "lonely"]);
  });

  it("BUG-chat-4: a run at the very top of the chat starts with a first bubble", async () => {
    await mount({
      chat: chatWith([
        msg(1, { created_at: "2030-01-15T10:00:00" }),
        msg(2, { created_at: "2030-01-15T10:01:00" }),
        msg(3, { created_at: "2030-01-15T10:02:00" }),
      ]),
    });
    const types = screen.getAllByTestId("message").map((el) => el.getAttribute("data-type"));
    expect(types, "the top run started with a middle bubble and no first bubble").toEqual(["first-chat", "middle-chat", "last-chat"]);
  });

  it("labels a message from the day before as 'Yesterday'", async () => {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0);
    await mount({ chat: chatWith([msg(1, { created_at: yesterday.toString() })]) });
    expect(screen.getByText("Yesterday"), "a message from yesterday was not under a 'Yesterday' line").toBeInTheDocument();
  });

  it("a single message stands alone", async () => {
    await mount({ chat: chatWith([msg(1)]) });
    expect(screen.getByTestId("message").getAttribute("data-type"), "a single message was grouped").toBe("lonely");
  });

  it("scrolling closes every open message menu", async () => {
    await mount();
    const onClose = vi.fn();
    window.addEventListener("chat-message-close-all", onClose);
    fireEvent.scroll(document.querySelector(".chat-message-container")!);
    window.removeEventListener("chat-message-close-all", onClose);
    expect(onClose, "scrolling did not close the open menus").toHaveBeenCalled();
  });

  it("loads older messages once while a page is in flight", async () => {
    const { spies } = await mount({ chat: chatWith([msg(10), msg(11)]) });
    act(() => h.props.Observable.getNext());
    act(() => h.props.Observable.getNext());
    expect(h.getPage, "older messages were not asked for once").toHaveBeenCalledTimes(1);
    expect(h.getPage, "the page was not asked from the oldest message").toHaveBeenCalledWith(7, 10);
    expect(spies.setMessagesPage, "the paging id was not stored").toHaveBeenCalledWith(10);
  });

  it("does not page a chat with no messages, nor a draft chat", async () => {
    await mount({ chat: chatWith([]) });
    act(() => h.props.Observable.getNext());
    expect(h.getPage, "a chat with no messages asked for older ones").not.toHaveBeenCalled();
    h.props = {};
    await mount({ chat: chatWith([], { id: "ch-3" }) });
    expect(h.props.Observable, "a draft chat got a pager").toBeUndefined();
  });

  it("keeps the reader's place when older messages are prepended", async () => {
    const chat = chatWith([msg(10, { created_at: "2030-01-15T10:00:00" })]);
    const { store } = await mount({ chat });
    const box = document.querySelector(".chat-message-container") as HTMLElement;
    let height = 100;
    Object.defineProperty(box, "scrollHeight", { get: () => height, configurable: true });
    act(() => {
      store.setState({ activeChat: { ...chat, messages: [...chat.messages] } } as any);
    });
    height = 300;
    box.scrollTop = 0;
    act(() => {
      store.setState({
        activeChat: { ...chat, messages: [msg(9, { created_at: "2030-01-15T09:00:00" }), ...chat.messages] },
      } as any);
    });
    expect(box.scrollTop, "the view jumped instead of keeping the reader's place").toBe(200);
  });

  it("scrolls to the bottom a second after the first load", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await mount({ props: { first: true } });
    (Element.prototype.scrollIntoView as any).mockClear();
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(Element.prototype.scrollIntoView, "the first load did not scroll to the bottom").toHaveBeenCalled();
  });

  it("clears the search and marks the chat watched on a refresh", async () => {
    const { store, setSearch, spies } = await mount();
    expect(setSearch, "opening a chat did not clear the list search").toHaveBeenCalledWith("");
    act(() => store.setState({ refs: true } as any));
    expect(spies.watchChannel, "a refresh did not mark the chat watched").toHaveBeenCalledWith(7);
  });

  it("opens the image preview a message asks for", async () => {
    await mount();
    act(() => h.props.messages[10].setImg("/img.png"));
    expect(h.props.MediaPreview?.imgs, "the image preview did not open").toBe("/img.png");
  });
});

describe("ConversationContainer — jumping to a quoted message", () => {
  it("scrolls to and flashes a quoted message already on screen", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("requestAnimationFrame", (cb: any) => {
      cb(0);
      return 0;
    });
    await mount({ chat: chatWith([msg(10), msg(11)]) });
    const el = document.getElementById("main-container-11")!;
    await act(async () => {
      h.props.messages[10].GetMessage(10, 11);
    });
    expect(el.scrollIntoView, "the quoted message was not scrolled into view").toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(el.classList.contains("backdrop_msg"), "the quoted message was not highlighted").toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    expect(el.classList.contains("backdrop_msg"), "the highlight did not go away").toBe(false);
  });

  it("loads the gap first when the quoted message is not loaded, then scrolls to it", async () => {
    vi.stubGlobal("requestAnimationFrame", (cb: any) => {
      cb(0);
      return 0;
    });
    const chat = chatWith([msg(10)]);
    const { spies, store } = await mount({ chat });
    await act(async () => {
      await h.props.messages[10].GetMessage(10, 5);
    });
    expect(h.getBetween, "the messages between were not loaded").toHaveBeenCalledWith({ first: 10, second: 5, channel_id: 7 });
    expect(spies.setQouted, "the quoted id was not stored").toHaveBeenCalledWith(5);
    act(() => {
      store.setState({ activeChat: { ...chat, messages: [msg(5, { created_at: "2030-01-15T09:00:00" }), ...chat.messages] } } as any);
    });
    await waitFor(() =>
      expect(document.getElementById("main-container-5")!.scrollIntoView, "the loaded quoted message was not scrolled to").toHaveBeenCalled(),
    );
  });

  it("logs a failed gap load", async () => {
    h.getBetween.mockRejectedValueOnce(new Error("range refused"));
    await mount();
    await act(async () => {
      await h.props.messages[10].GetMessage(10, 99);
    });
    expect(h.logError.mock.calls.at(-1)?.[0]?.scenario, "a failed gap load was not logged").toBe(
      "get messages between two messages in conversation container - chat widget",
    );
  });
});

describe("ConversationContainer — sending text", () => {
  it("sends on Enter and on the send button, and tracks it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { spies } = await mount({ props: { isPrivate: 44 } });
    const input = screen.getByLabelText("Type") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "a" });
    expect(h.sendMessageApi, "a key other than Enter sent the message").not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(spies.sendMessage.mock.calls[0]?.[0]?.message?.message_content, "no pending copy was shown").toEqual({ content: "hello" });
    expect(h.sendMessageApi.mock.calls[0], "the text was not sent to the chat backend").toEqual([
      expect.objectContaining({ content: "hello", message_type: "TextMessage", cid: 7, receiver_user_id: THEM }),
      false,
      44,
    ]);
    expect(h.track, "the sent message was not tracked").toHaveBeenCalledWith("chat_message_sent", {
      conversation_id: 7,
      message_type: "TextMessage",
      is_order_chat: true,
      is_reply: false,
    });
    expect(input.value, "the input was not cleared").toBe("");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.change(input, { target: { value: "again" } });
    fireEvent.click(document.querySelector('img[src="/icons/chat/sendbutton.svg"]')!);
    expect(h.sendMessageApi.mock.calls[1]?.[0]?.content, "the send button did not send").toBe("again");
  });

  it("does not send blank text", async () => {
    await mount();
    const input = screen.getByLabelText("Type");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(h.sendMessageApi, "blank text was sent").not.toHaveBeenCalled();
  });

  it("says the message failed when the pending copy cannot be shown", async () => {
    const sendMessage = vi.fn(() => {
      throw new Error("store broke");
    });
    const { spies } = await mount({ store: { sendMessage } });
    const input = screen.getByLabelText("Type");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(h.showError, "the shopper was not told the message failed").toHaveBeenCalledWith("Failed to send message");
    expect(spies.deleteErrorMessage, "the failed copy was not removed").toHaveBeenCalled();
  });

  it("tells the other side I am typing, then stops after two seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await mount();
    const input = screen.getByLabelText("Type");
    await act(async () => {
      fireEvent.change(input, { target: { value: "h" } });
    });
    await waitFor(() => expect(h.fb.push, "typing was not sent").toHaveBeenCalledWith({ path: `Transaction/${ME}/${THEM}` }, "Typing..."));
    await act(async () => {
      fireEvent.change(input, { target: { value: "hi" } });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(h.fb.set, "typing was not cleared after two seconds").toHaveBeenCalledWith({ path: `Transaction/${ME}/${THEM}` }, null);
    h.fb.set.mockClear();
    fireEvent.blur(input);
    await waitFor(() => expect(h.fb.set, "leaving the input did not clear the status").toHaveBeenCalled());
  });

  it("sends no typing status in a chat with nobody else", async () => {
    await mount({ chat: chatWith([msg(1)], { channel_members: [{ user_id: ME }] }) });
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Type"), { target: { value: "h" } });
      fireEvent.blur(screen.getByLabelText("Type"));
    });
    expect(h.fb.push, "typing was sent to nobody").not.toHaveBeenCalled();
    expect(h.fb.set, "a status was cleared for nobody").not.toHaveBeenCalled();
  });

  it("shows the reply bar and cancels it", async () => {
    const { spies } = await mount({ store: { replyMessage: { id: 3 } } });
    act(() => h.props.ReplyMessage.cancel());
    expect(spies.setReplyMessage, "cancelling the reply did not clear it").toHaveBeenCalledWith(null);
    const input = screen.getByLabelText("Type");
    fireEvent.change(input, { target: { value: "re" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(h.sendMessageApi.mock.calls[0]?.[0]?.parent_message_id, "the reply was not sent as a reply").toBe(3);
  });
});

describe("ConversationContainer — attaching files", () => {
  it("the plus button opens the picker for any file", async () => {
    await mount();
    const input = fileInput();
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.click(document.querySelector(".chatplus")!);
    expect(input.accept, "the plus picker did not accept any file").toBe("*/*");
    expect(click, "the file picker was not opened").toHaveBeenCalled();
    await waitFor(() => expect(h.fb.push, "the other side was not told a file is coming").toHaveBeenCalledWith(expect.anything(), "Sending file..."));
    fireEvent.focus(input);
    fireEvent.blur(input);
    input.dispatchEvent(new Event("cancel"));
    expect(input.accept, "cancelling the picker did not reset it").toBe("*/*");
  });

  it("uploads a document and sends it as a file message", async () => {
    const { spies } = await mount();
    await act(async () => {
      pick(new File(["x"], "doc.pdf", { type: "application/pdf" }));
    });
    await waitFor(() => expect(h.sendMessageApi, "the file was not sent").toHaveBeenCalled());
    expect(h.upload, "the file was not uploaded").toHaveBeenCalled();
    expect(h.sendMessageApi.mock.calls[0][0], "the file message was wrong").toMatchObject({
      message_type: "FileMessage",
      content: [{ file_path: "/up/file", file_name: "file.bin" }],
    });
    await waitFor(() =>
      expect(spies.sendMessage.mock.calls[0]?.[0]?.message?.message_type, "no pending copy of the file was shown").toEqual({ name: "FileMessage" }),
    );
    expect(h.track.mock.calls.at(-1)?.[1]?.message_type, "the file was not tracked").toBe("FileMessage");
  });

  it("tells the shopper when the upload fails", async () => {
    h.upload.mockRejectedValueOnce(new Error("upload refused"));
    const { spies } = await mount();
    await act(async () => {
      pick(new File(["x"], "doc.pdf", { type: "application/pdf" }));
    });
    await waitFor(() => expect(h.showError, "the upload failure was not shown").toHaveBeenCalledWith("upload refused"));
    expect(spies.deleteErrorMessage, "the failed copy was not removed").toHaveBeenCalled();
    h.upload.mockRejectedValueOnce({});
    await act(async () => {
      pick(new File(["x"], "doc.pdf", { type: "application/pdf" }));
    });
    await waitFor(() => expect(h.showError, "an upload failure with no message used no default").toHaveBeenCalledWith("Failed to Upload file"));
  });

  it("does nothing when no file was chosen", async () => {
    await mount();
    await act(async () => {
      pick(null);
    });
    expect(h.upload, "an empty pick started an upload").not.toHaveBeenCalled();
  });

  it("reports a picker that cannot be reset", async () => {
    const { spies } = await mount();
    await act(async () => {
      pick(new File(["x"], "doc.pdf"), false);
    });
    expect(h.logError.mock.calls.at(-1)?.[0]?.scenario, "the picker failure was not logged").toBe(
      "handleFileChange in conversation container - chat widget",
    );
    expect(spies.deleteErrorMessage, "the failed copy was not removed").toHaveBeenCalled();
    expect(h.showError, "the picker failure was not shown").toHaveBeenCalled();
  });

  it("the media picker refuses a document and names an unplayable video", async () => {
    await mount();
    const input = fileInput();
    vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.click(document.querySelector(".camer-icon")!);
    const openFiles = () => act(() => h.props.Popup.options[0].onClick());
    openFiles();
    expect(input.accept, "the media picker did not limit the files").toContain("video/mp4");
    expect(h.props.Popup.options[0].render(), "the files option has no label").toBeTruthy();
    expect(h.props.Popup.options[1].render(), "the camera option has no label").toBeTruthy();
    await act(async () => {
      pick(new File(["x"], "doc.pdf", { type: "application/pdf" }));
    });
    expect(h.showError, "a document in the media picker was not refused").toHaveBeenCalledWith("Only image and video files are allowed");
    openFiles();
    await act(async () => {
      pick(new File(["x"], "clip.avi", { type: "video/x-msvideo" }));
    });
    expect(h.showError, "an unplayable video was not named").toHaveBeenCalledWith(
      "This video format is not supported. Send an MP4 video instead.",
    );
    expect(h.upload, "a refused file was uploaded").not.toHaveBeenCalled();
  });

  it("the media picker goes back to any file after a second", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await mount();
    const input = fileInput();
    vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.click(document.querySelector(".camer-icon")!);
    act(() => h.props.Popup.options[0].onClick());
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(input.accept, "the picker kept the media-only filter").toBe("*/*");
  });

  it("an image goes through crop and preview before it is sent", async () => {
    await mount();
    await act(async () => {
      pick(new File(["x"], "pic.png", { type: "image/png" }));
    });
    expect(h.props.Crop?.image?.name, "the crop widget did not open with the image").toBe("pic.png");
    await act(async () => {
      h.props.ImagePreview?.handleImagePreviewSend?.();
    });
    const cropped = new File(["y"], "cropped.png", { type: "image/png" });
    await act(async () => {
      h.props.Crop.onSave(cropped);
    });
    await waitFor(() => expect(h.props.ImagePreview?.croppedImagePreview, "the cropped preview was not shown").toMatch(/^data:/));
    await act(async () => {
      await h.props.ImagePreview.handleImagePreviewSend();
    });
    await waitFor(() => expect(h.sendMessageApi.mock.calls[0]?.[0]?.message_type, "the cropped image was not sent").toBe("ImageMessage"));
    expect(screen.queryByTestId("ImagePreview"), "the preview stayed open after sending").toBeNull();
  });

  it("closing the crop widget drops the image", async () => {
    await mount();
    await act(async () => {
      pick(new File(["x"], "pic.png", { type: "image/png" }));
    });
    act(() => h.props.Crop.onClose());
    expect(screen.queryByTestId("Crop"), "the crop widget stayed open").toBeNull();
  });

  it("closing the media menu clears the status after three seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await mount();
    fireEvent.click(document.querySelector(".camer-icon")!);
    act(() => h.props.Popup.close());
    expect(screen.queryByTestId("Popup"), "the menu stayed open").toBeNull();
    h.fb.set.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await waitFor(() => expect(h.fb.set, "the status was not cleared after the menu closed").toHaveBeenCalled());
  });
});

describe("ConversationContainer — the camera", () => {
  async function openCamera() {
    const r = await mount();
    fireEvent.click(document.querySelector(".camer-icon")!);
    await act(async () => {
      await h.props.Popup.options[1].onClick();
    });
    return r;
  }

  it("asks for camera permission and says so when it is refused", async () => {
    h.permission.granted = false;
    await openCamera();
    expect(h.showError, "a refused camera permission was not shown").toHaveBeenCalledWith(
      "Please enable camera permissions to use camera features",
    );
    expect(h.props.Camera, "the camera opened without permission").toBeUndefined();
  });

  it("a photo goes to the crop widget, a video is sent, and close hides it", async () => {
    await openCamera();
    expect(screen.getByTestId("Camera"), "the camera did not open").toBeInTheDocument();
    await act(async () => {
      h.props.Camera.send("data:image/png;base64,aGk=");
    });
    expect(h.props.Crop?.image?.type, "the camera photo did not go to the crop widget").toBe("image/png");
    act(() => h.props.Crop.onClose());

    await act(async () => {
      await h.props.Popup?.options?.[1]?.onClick?.();
    });
    fireEvent.click(document.querySelector(".camer-icon")!);
    await act(async () => {
      await h.props.Popup.options[1].onClick();
    });
    await act(async () => {
      h.props.Camera.send(new File(["v"], "clip.webm", { type: "video/webm" }));
    });
    await waitFor(() => expect(h.sendMessageApi.mock.calls.at(-1)?.[0]?.message_type, "the camera video was not sent").toBe("VideoMessage"));

    fireEvent.click(document.querySelector(".camer-icon")!);
    await act(async () => {
      await h.props.Popup.options[1].onClick();
    });
    await act(async () => {
      h.props.Camera.send(new File(["i"], "shot.jpg", { type: "image/jpeg" }));
    });
    expect(h.props.Crop?.image?.name, "a camera image file did not go to the crop widget").toBe("shot.jpg");
    act(() => h.props.Crop.onClose());

    fireEvent.click(document.querySelector(".camer-icon")!);
    await act(async () => {
      await h.props.Popup.options[1].onClick();
    });
    await act(async () => {
      h.props.Camera.send(42 as any);
    });
    fireEvent.click(document.querySelector(".camer-icon")!);
    await act(async () => {
      await h.props.Popup.options[1].onClick();
    });
    await act(async () => {
      await h.props.Camera.close();
    });
    expect(screen.queryByTestId("Camera"), "closing did not hide the camera").toBeNull();
  });
});

describe("ConversationContainer — voice notes", () => {
  class FakeRecorder {
    state = "inactive";
    ondataavailable: any;
    onstop: any;
    constructor(public stream: any) {}
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["a"]) });
      this.ondataavailable?.({ data: new Blob([]) });
      this.onstop?.();
    }
  }

  function stubMic(ok = true) {
    const track = { stop: vi.fn() };
    const getUserMedia = ok
      ? vi.fn(async () => ({ getTracks: () => [track] }))
      : vi.fn(async () => {
          throw new Error("no mic");
        });
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
    return { track, getUserMedia };
  }

  it("records, cancels, and records again then sends the note", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    const { track } = stubMic();
    await mount();
    await act(async () => {
      fireEvent.click(document.querySelector('img[src="/icons/chat/redmic.svg"]')!);
    });
    expect(screen.getByText("00:00"), "the recording timer was not shown").toBeInTheDocument();
    expect(screen.queryByTestId("Recorder"), "the fallback recorder stayed mounted during a native recording").toBeNull();
    fireEvent.mouseUp(screen.getByText("Cancel"));
    expect(track.stop, "cancelling did not release the microphone").toHaveBeenCalled();
    expect(screen.queryByText("Cancel"), "cancelling did not close the recorder").toBeNull();

    await act(async () => {
      fireEvent.click(document.querySelector('img[src="/icons/chat/redmic.svg"]')!);
    });
    fireEvent.click(document.querySelector('img[src="/icons/chat/sharechat.svg"]')!);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    await waitFor(() => expect(h.sendMessageApi.mock.calls.at(-1)?.[0]?.message_type, "the voice note was not sent").toBe("VoiceMessage"));
    expect(URL.createObjectURL, "the recording was not turned into a playable URL").toHaveBeenCalled();
  });

  it("falls back to the other recorder when native recording is not there", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("MediaRecorder", undefined);
    stubMic();
    await mount();
    await act(async () => {
      fireEvent.click(document.querySelector('img[src="/icons/chat/redmic.svg"]')!);
    });
    await waitFor(() => expect(h.props.Recorder?.isRecording, "the fallback recorder was not started").toBe(true));
    expect(h.logError.mock.calls.at(-1)?.[0]?.scenario, "the missing native recorder was not logged").toBe(
      "startNativeRecording in conversation container - chat widget",
    );
    // The fallback recorder hands the blob back through onStop.
    act(() => h.props.Recorder.onStop(new Blob(["b"])));
    expect(screen.queryByText("Cancel"), "the recorder stayed open after it stopped").toBeNull();
    await act(async () => {
      fireEvent.click(document.querySelector('img[src="/icons/chat/redmic.svg"]')!);
    });
    await waitFor(() => screen.getByText("Cancel"));
    h.upload.mockRejectedValueOnce(new Error("audio refused"));
    fireEvent.click(document.querySelector('img[src="/icons/chat/sharechat.svg"]')!);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    await waitFor(() => expect(h.showError, "a failed voice upload was not shown").toHaveBeenCalledWith("Failed to Upload audio"));
  });

  it("says there is no microphone when both recorders fail", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    stubMic(false);
    await mount();
    await act(async () => {
      fireEvent.click(document.querySelector('img[src="/icons/chat/redmic.svg"]')!);
    });
    await waitFor(() => expect(h.showError, "a missing microphone was not shown").toHaveBeenCalledWith("No available Microphone"));
  });

  it("sends nothing when there is no recording", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("MediaRecorder", undefined);
    stubMic();
    await mount();
    await act(async () => {
      fireEvent.click(document.querySelector('img[src="/icons/chat/redmic.svg"]')!);
    });
    await waitFor(() => screen.getByText("Cancel"));
    fireEvent.click(document.querySelector('img[src="/icons/chat/sharechat.svg"]')!);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(h.upload, "an empty recording was uploaded").not.toHaveBeenCalled();
  });
});

describe("ConversationContainer — header, details and calls", () => {
  it("opens the details drawer and loads the chat details", async () => {
    await mount();
    act(() => h.props.ChatHeader.openDetails());
    expect(h.getChatDetails, "the chat details were not loaded").toHaveBeenCalledWith(7);
    expect(screen.getByTestId("ChatInfo"), "the details drawer did not open").toBeInTheDocument();
    act(() => h.props.ChatInfo.enableSearch());
    expect(screen.getByTestId("ChatSearch"), "search did not open from the details").toBeInTheDocument();
    expect(screen.queryByTestId("ChatInfo"), "the details stayed open over the search").toBeNull();
    act(() => h.props.ChatSearch.close());
    expect(screen.queryByTestId("ChatSearch"), "closing the search did not hide it").toBeNull();
    act(() => h.props.ChatHeader.openDetails());
    act(() => h.props.ChatInfo.cancel());
    expect(screen.queryByTestId("ChatInfo"), "cancel did not close the details").toBeNull();
    act(() => h.props.ChatHeader.close());
  });

  it("places voice and video calls to the other member", async () => {
    await mount();
    act(() => h.props.ChatHeader.openDetails());
    act(() => h.props.ChatInfo.makeAudioCall());
    act(() => h.props.ChatInfo.makeVideoCall());
    expect(h.makeVoiceCall, "the voice call was not placed").toHaveBeenCalledWith(7, "Them", "/p.png", "p");
    expect(h.makeVideoCall, "the video call was not placed").toHaveBeenCalledWith(7, "Them", "/p.png", "p");
  });

  it("does not place a call while another is being placed", async () => {
    await mount({ store: { callLoading: "video" } });
    act(() => h.props.ChatHeader.openDetails());
    act(() => h.props.ChatInfo.makeAudioCall());
    act(() => h.props.ChatInfo.makeVideoCall());
    expect(h.makeVoiceCall, "a second voice call was placed").not.toHaveBeenCalled();
    expect(h.makeVideoCall, "a second video call was placed").not.toHaveBeenCalled();
  });

  it("a blocked chat refuses calls and hides the input", async () => {
    const chat = chatWith([msg(1)], {
      channel_members: [{ user_id: ME }, { user_id: THEM, is_blocked: 1 }],
    });
    await mount({ chat });
    expect(screen.getByText("You cannot send messages or calls to this user"), "the blocked notice was not shown").toBeInTheDocument();
    expect(screen.queryByLabelText("Type"), "a blocked chat still had an input").toBeNull();
    expect(h.props.ChatHeader.isBlockedEachOther, "the header was not told the chat is blocked").toBe(true);
    act(() => h.props.ChatHeader.openDetails());
    act(() => h.props.ChatInfo.makeAudioCall());
    act(() => h.props.ChatInfo.makeVideoCall());
    expect(h.showError.mock.calls.map((c) => c[0]), "the blocked calls were not refused with a message").toEqual([
      "You cannot send messages or calls to this user",
      "You cannot send messages or calls to this user",
    ]);
    expect(h.makeVoiceCall, "a blocked chat placed a call").not.toHaveBeenCalled();
  });
});
