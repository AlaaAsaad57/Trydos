// Chat refuses a file that is over the 25 MB cap.
//
// Every chat attachment goes through one function: `upload` in
// components/Chat/chatsFunctions.tsx. Both call sites in
// components/Chat/pages/ConversationContainer.tsx use it — the file picker and
// the camera/crop path at line 380, the voice recorder at line 725 — so the cap
// is checked there once rather than at each screen.
//
// THE BUG THIS WAS WRITTEN FOR. There was no size check at all. A 30 MB file
// looked refused only because the media server itself refused it, and the media
// server's own cut-off sits above 25.9 MB, so a 25.9 MB file was accepted and
// sent. The cap has to be ours, and it has to be measured in bytes.
//
// The cap is 25 MiB = 26,214,400 bytes, the same 1024-based unit every other
// upload cap in this repo uses (components/Home/Stories/AddStoryWidget.tsx,
// components/SellerDashboard/StoriesTab.tsx,
// components/SellerDashboard/boutiqueEdit/helpers.ts).
//
// The two checks below are separate on purpose. A refusal that still sends the
// file to the media server is not a refusal, so "it threw" and "no request went
// out" are asked one at a time.
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../../msw/server";

// The upload ticket is fetched from /api/ticket before the file goes out. That
// is a different backend and a different failure, and the cap must be hit
// before it is even asked for — so it is replaced here, and the spy doubles as
// the proof that an over-size file never starts the upload at all.
// The rest parameter is what lets the wrapper below forward its arguments.
const getTicket = vi.fn(async (..._args: unknown[]) => "ticket-for-the-test");
vi.mock("utils/UploadUtils", () => ({
  GetTicket: (...args: any[]) => getTicket(...args),
}));

// Sentry. A refusal is not an app error and must not be reported as one, but
// that is not what this file measures; it is replaced so a test run never
// reaches the real reporter.
//
// `getUserChat` is read from this file's own holder. `vi.resetModules()` below
// gives every test a fresh store, but a mocked module is built once and keeps
// the store it saw first — so the real `getUserChat` would read a stale store.
const chatUserHolder = vi.hoisted(() => ({ current: null as any }));
vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    LogError: vi.fn(),
    getUserChat: () => chatUserHolder.current ?? {},
  };
});

/** The cap, in bytes. 25 MiB. */
const CAP_BYTES = 25 * 1024 * 1024;

/** Where the media server takes a chat attachment. */
const UPLOAD_URL = "https://example.com/gated/chat/upload_file";

/**
 * A file of exactly `size` bytes, as far as the code under test can tell.
 *
 * The bytes are not allocated. `upload` reads `file.size` and `file.name` and
 * nothing else about the contents, and allocating 26 MB per case would make the
 * run slower for no extra coverage. `size` is an own property here, which hides
 * the `Blob.prototype.size` getter underneath it.
 */
function fileOfSize(size: number, name = "attachment.bin"): File {
  const file = new File([new Uint8Array(1)], name);
  Object.defineProperty(file, "size", { value: size });
  return file;
}

/** Records every attachment that actually reached the media server. */
let uploadsReceived: number;

beforeEach(() => {
  uploadsReceived = 0;
  getTicket.mockClear();
  server.use(
    http.post(UPLOAD_URL, () => {
      uploadsReceived += 1;
      return HttpResponse.json({
        isSuccessful: true,
        code: 200,
        data: { file_path: "/chat/2026/attachment.bin" },
      });
    }),
  );
});

afterEach(() => {
  vi.resetModules();
});

describe("chat attachment size cap", () => {
  it("refuses a file one byte over 25 MB and tells the sender the size is the reason", async () => {
    const { upload } = await import("components/Chat/chatsFunctions");

    await expect(
      upload(fileOfSize(CAP_BYTES + 1)),
      "a file one byte over the 25 MB cap was accepted instead of refused",
    ).rejects.toThrow(/25 MB/);
  });

  it("does not send an over-size file to the media server", async () => {
    const { upload } = await import("components/Chat/chatsFunctions");

    await upload(fileOfSize(CAP_BYTES + 1)).catch(() => {});

    expect(
      getTicket,
      "an over-size file still asked the gateway for an upload ticket",
    ).not.toHaveBeenCalled();
    expect(
      uploadsReceived,
      "an over-size file was still sent to the media server, so it was never really refused",
    ).toBe(0);
  });

  it("refuses the 25.9 MB file that the media server used to accept", async () => {
    const { upload } = await import("components/Chat/chatsFunctions");

    // 25.9 MB as a file manager on Windows reports it — 25.9 × 1024 × 1024.
    const twentyFivePointNine = Math.round(25.9 * 1024 * 1024);

    await expect(
      upload(fileOfSize(twentyFivePointNine, "clip.mp4")),
      `a ${twentyFivePointNine}-byte file was accepted; the cap is ${CAP_BYTES} bytes`,
    ).rejects.toThrow(/25 MB/);
  });

  it("still uploads a file of exactly 25 MB, because the cap is a ceiling and not a bar", async () => {
    const { upload } = await import("components/Chat/chatsFunctions");

    const result = await upload(fileOfSize(CAP_BYTES, "exactly-at-the-cap.bin"));

    expect(
      result?.path,
      "a file of exactly 25 MB was refused, but the cap is 'more than 25 MB'",
    ).toBe("/chat/2026/attachment.bin");
    expect(
      uploadsReceived,
      "a file at the cap never reached the media server",
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// The rest of components/Chat/chatsFunctions.tsx. This file is the one test
// file for that module, so its other helpers are checked here too.
// ---------------------------------------------------------------------------

describe("upload — when the media server refuses", () => {
  it("fails the upload on an HTTP error from the media server", async () => {
    server.use(http.post(UPLOAD_URL, () => HttpResponse.json({ message: "too big for us" }, { status: 413 })));
    const { upload } = await import("components/Chat/chatsFunctions");
    await expect(upload(fileOfSize(10, "a.png")), "an HTTP refusal from the media server did not fail the upload").rejects.toThrow("Failed to upload file");
  });

  it("throws when the media server says it was not successful", async () => {
    server.use(http.post(UPLOAD_URL, () => HttpResponse.json({ isSuccessful: false })));
    const { upload } = await import("components/Chat/chatsFunctions");
    await expect(upload(fileOfSize(10, "a.png")), "an unsuccessful upload answer did not fail the upload").rejects.toThrow("Failed to upload file");
  });

  it("throws when the answer has no file path, and names a file with no name 'image'", async () => {
    let sentName: string | null = null;
    server.use(
      http.post(UPLOAD_URL, async ({ request }) => {
        sentName = (await request.formData()).get("file_name") as string;
        return HttpResponse.json({ isSuccessful: true, code: 201, message: "no path" });
      }),
    );
    const { upload } = await import("components/Chat/chatsFunctions");
    const nameless = fileOfSize(10, "");
    await expect(upload(nameless), "an answer with no file path was accepted").rejects.toThrow("no path");
    expect(sentName, "a file with no name was not sent as 'image'").toBe("image");
  });

  it("throws the default message when the answer carries none", async () => {
    server.use(http.post(UPLOAD_URL, () => HttpResponse.json({ isSuccessful: true, code: 500 })));
    const { upload } = await import("components/Chat/chatsFunctions");
    await expect(upload(fileOfSize(10, "a.png")), "a failed upload with no message did not use the default").rejects.toThrow("Failed to upload file");
  });
});

describe("chatsFunctions — small helpers", () => {
  const ME = 1;
  const THEM = 2;

  async function withChatUser(extra: Record<string, any> = {}) {
    const { useAppStore } = await import("store");
    useAppStore.setState({ userChat: { id: ME }, language: "en", ...extra } as any);
    chatUserHolder.current = { id: ME };
    return useAppStore;
  }

  it("getUser reads the chat user from the store", async () => {
    await withChatUser();
    const { getUser } = await import("components/Chat/chatsFunctions");
    expect(getUser(), "getUser did not return the chat user").toEqual({ id: ME });
  });

  it("getMessageStatusIcon picks pending, read, received or sent", async () => {
    await withChatUser();
    const { render } = await import("@testing-library/react");
    const { getMessageStatusIcon } = await import("components/Chat/chatsFunctions");
    const src = (el: any) => render(el).container.querySelector("img")?.getAttribute("src") ?? "svg";
    expect(src(getMessageStatusIcon([], "m1")), "a pending message did not show the clock").toBe("svg");
    expect(src(getMessageStatusIcon([{ user_id: THEM, is_watched: true }], null)), "a watched message was not read").toBe("/icons/chat/read.svg");
    expect(src(getMessageStatusIcon([{ user_id: THEM, watched_at: "x" }], null)), "a watched time did not count as read").toBe("/icons/chat/read.svg");
    expect(src(getMessageStatusIcon([{ user_id: THEM, is_received: 1 }], null)), "a received message was not received").toBe("/icons/chat/recieved.svg");
    expect(src(getMessageStatusIcon([{ user_id: THEM, received_at: "x" }], null)), "a received time did not count as received").toBe("/icons/chat/recieved.svg");
    expect(src(getMessageStatusIcon([{ user_id: ME, is_watched: true }], null)), "my own status counted as read").toBe("/icons/chat/sent.svg");
  });

  function incoming(extra: Record<string, any> = {}) {
    return {
      sender_user_id: THEM,
      message_type: { name: "TextMessage" },
      message_status: [{ user_id: ME, is_watched: false }],
      auth_message_status: { delete_for_all: false },
      ...extra,
    };
  }

  it("isNew, getNew and getNewCalls count unread incoming messages", async () => {
    await withChatUser();
    const { isNew, getNew, getNewCalls } = await import("components/Chat/chatsFunctions");
    const unread = incoming();
    const call = incoming({ message_type: { name: "VoiceCall" } });
    const mine = incoming({ sender_user_id: ME });
    const read = incoming({ message_status: [{ user_id: ME, is_watched: true }] });
    const deleted = incoming({ auth_message_status: { delete_for_all: true } });
    expect(isNew([unread, call, mine, read, deleted]), "only the one unread incoming text should count").toBe(1);
    expect(isNew(undefined), "no messages did not count as none").toBeUndefined();
    const a = { id: 1, messages: [unread] };
    const b = { id: 2, messages: [read] };
    const c = { id: 3, messages: [unread] };
    expect(getNew([a, b, null, c]).map((x: any) => x.id), "getNew did not list the chats with unread messages").toEqual([1, 3]);
    expect(getNew([a, c], { id: 3 }).map((x: any) => x.id), "the open chat was listed as new").toEqual([1]);
    expect(getNewCalls([unread]), "getNewCalls did not count like isNew").toBe(1);
  });

  it("getTwoLetters gives the initials of a name", async () => {
    const { getTwoLetters } = await import("components/Chat/chatsFunctions");
    expect(getTwoLetters("Alaa Test"), "two words did not give two initials").toBe("AT");
    expect(getTwoLetters("Alaa"), "one word did not give its first two letters").toBe("Al");
    expect(getTwoLetters(""), "no name did not give an empty avatar").toBe("");
    expect(getTwoLetters("UnKnown User"), "the unknown placeholder got initials").toBe("");
  });

  it("BUG-chat-2: a one-letter name gives one initial, not 'Aundefined'", async () => {
    const { getTwoLetters } = await import("components/Chat/chatsFunctions");
    expect(getTwoLetters("A"), "a one-letter name printed 'undefined' in the avatar").toBe("A");
  });

  it("dataURLtoFile turns a data URL into a typed file", async () => {
    const { dataURLtoFile } = await import("components/Chat/chatsFunctions");
    const file = dataURLtoFile("data:text/plain;base64,aGk=", "hi.txt");
    expect(file.name, "the file name was lost").toBe("hi.txt");
    expect(file.type, "the MIME type was not read from the data URL").toBe("text/plain");
    expect(await file.text(), "the bytes were not decoded").toBe("hi");
  });

  describe("showDate", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("says the time today, 'Yesterday', a weekday this week, else the date", async () => {
      await withChatUser();
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2030, 0, 15, 12, 0));
      const { showDate } = await import("components/Chat/chatsFunctions");
      expect(showDate(new Date(2030, 0, 15, 9, 5).toString()), "a time today was not shown as HH:MM").toBe("09:05");
      expect(showDate(new Date(2030, 0, 15, 14, 30).toString()), "an afternoon time today was wrong").toBe("14:30");
      expect(showDate(new Date(2030, 0, 14, 9, 5).toString()), "yesterday was not called 'Yesterday'").toBe("Yesterday");
      const weekday = showDate(new Date(2030, 0, 12, 9, 5).toString());
      expect(
        ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].includes(weekday),
        `a date three days ago was not a weekday name (${weekday})`,
      ).toBe(true);
      expect(showDate(new Date(2029, 11, 1, 9, 5).toString()), "an older date was not shown as a date").toBe("2029-12-01");
      vi.setSystemTime(new Date(2030, 10, 20, 12, 0));
      expect(showDate(new Date(2030, 9, 25, 9, 5).toString()), "a two-digit month date was wrong").toBe("2030-10-25");
    });

    it("BUG-chat-3: an old date is written with Arabic digits for an Arabic reader", async () => {
      await withChatUser({ language: "ar" });
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2030, 0, 15, 12, 0));
      const { showDate } = await import("components/Chat/chatsFunctions");
      expect(showDate(new Date(2029, 11, 1, 9, 5).toString()), "the Arabic date kept Western digits").not.toBe("2029-12-01");
    });
  });
});

describe("forwardMessage", () => {
  const ME = 1;
  const THEM = 2;
  const sendSpy = vi.fn();
  const active = { id: 9, channel_members: [{ user_id: ME }, { user_id: THEM }] };

  async function setup() {
    vi.doMock("store/chat/actions", () => ({ SendMessage: sendSpy }));
    const { useAppStore } = await import("store");
    const spies = { sendMessage: vi.fn(), setForwardMessage: vi.fn(), setMain: vi.fn() };
    useAppStore.setState({ userChat: { id: ME }, ...spies } as any);
    const { forwardMessage } = await import("components/Chat/chatsFunctions");
    return { forwardMessage, spies };
  }

  beforeEach(() => {
    sendSpy.mockClear();
  });

  afterEach(() => {
    vi.doUnmock("store/chat/actions");
  });

  it.each([
    ["TextMessage", { message_type: { name: "TextMessage" }, message_content: { content: "hi" } }],
    ["ImageMessage", { message_type: "ImageMessage", message_files: [{ file_path: "/i.png" }] }],
    ["VoiceMessage", { message_type: { name: "VoiceMessage" }, message_files: [{ file_path: "/v.mp3" }] }],
    ["VideoMessage", { message_type: "VideoMessage", message_files: [{ file_path: "/v.mp4" }] }],
    ["FileMessage", { message_type: { name: "FileMessage" }, message_files: [{ file_path: "/f.pdf" }] }],
    ["ShareProduct", { message_type: "ShareProduct", message_content: { content: { id: 5 } } }],
  ])("forwards a %s to the other member and returns to the chat", async (type, message) => {
    const { forwardMessage, spies } = await setup();
    await forwardMessage(message, active);
    const sent = sendSpy.mock.calls[0]?.[0];
    expect(sent?.message_type, `the ${type} was not sent with its type`).toBe(type);
    expect(sent?.receiver_user_id, `the ${type} was not sent to the other member`).toBe(THEM);
    expect(sent?.is_forward, `the ${type} was not marked as forwarded`).toBe(1);
    expect(spies.sendMessage.mock.calls[0]?.[0]?.message?.type, `no pending copy of the ${type} was shown`).toBe("pending");
    expect(spies.setForwardMessage, "the forward picker was not closed").toHaveBeenCalledWith(null);
    expect(spies.setMain, "the view did not go back to the chat").toHaveBeenCalledWith("chat");
  });
});
