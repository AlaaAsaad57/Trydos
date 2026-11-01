// Auto-saving incoming chat media (components/Chat/autoDownload.ts).
//
// The user turns the setting on. Then each NEW photo, video or file from
// someone else saves by itself, and the same file never saves twice.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const downloadFile = vi.fn(async (_url: string) => {});
vi.mock("components/Chat/downloadFile", () => ({
  downloadFile: (url: string) => downloadFile(url),
}));

import {
  autoSaveIncomingMedia,
  autoSaveMissedMedia,
  isAutoSaving,
  isAutoDownloadOn,
  resetAutoDownloadMemory,
  setAutoDownloadMode,
  getAutoDownloadMode,
} from "components/Chat/autoDownload";

const ME = 7;
const OTHER = 9;

function message(
  type: string,
  filePath: string,
  extra: Record<string, unknown> = {},
) {
  return {
    id: Math.floor(Math.random() * 1e6),
    sender_user: { id: OTHER },
    message_type: { name: type },
    message_files: [{ file_path: filePath }],
    ...extra,
  };
}

/** Lets the one-at-a-time save queue (and its pause) finish. */
async function flush() {
  await vi.runAllTimersAsync();
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  resetAutoDownloadMemory();
  downloadFile.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the setting", () => {
  it("is off until the user turns it on", () => {
    expect(isAutoDownloadOn(), "auto-download was on without the user asking").toBe(false);
    expect(getAutoDownloadMode(), "the default choice was not Never").toBe("never");
    setAutoDownloadMode("always");
    expect(getAutoDownloadMode(), "the choice Always did not stay after the user picked it").toBe("always");
    expect(isAutoDownloadOn(), "auto-download was not on after the user picked Always").toBe(true);
    setAutoDownloadMode("never");
    expect(isAutoDownloadOn(), "auto-download did not stop after the user picked Never").toBe(false);
  });

  it("saves nothing while it is off", async () => {
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/a.jpg"), ME);
    await flush();
    expect(downloadFile, "a file was saved although the setting is off").not.toHaveBeenCalled();
  });
});

describe("what it saves", () => {
  beforeEach(() => setAutoDownloadMode("always"));

  it("saves a photo, a video and a file, one after the other", async () => {
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/a.jpg"), ME);
    autoSaveIncomingMedia(message("VideoMessage", "https://m.example.com/b.mp4"), ME);
    autoSaveIncomingMedia(message("FileMessage", "https://m.example.com/c.pdf"), ME);
    await flush();

    const saved = downloadFile.mock.calls.map((call) => call[0]);
    expect(saved, "the photo was not saved").toContain("https://m.example.com/a.jpg");
    expect(saved, "the video was not saved").toContain("https://m.example.com/b.mp4");
    expect(saved, "the file was not saved").toContain("https://m.example.com/c.pdf");
  });

  it("does not save the user's own message", async () => {
    const mine = message("ImageMessage", "https://m.example.com/mine.jpg", {
      sender_user: { id: ME },
    });
    autoSaveIncomingMedia(mine, ME);
    await flush();
    expect(downloadFile, "the user's own photo was saved back to their machine").not.toHaveBeenCalled();
  });

  it("does not save a voice message", async () => {
    autoSaveIncomingMedia(message("VoiceMessage", "https://m.example.com/v.webm"), ME);
    await flush();
    expect(downloadFile, "a voice message was saved").not.toHaveBeenCalled();
  });

  it("does not save a message the sender deleted for everyone", async () => {
    autoSaveIncomingMedia(
      message("ImageMessage", "https://m.example.com/gone.jpg", { deleted_by_user_id: OTHER }),
      ME,
    );
    await flush();
    expect(downloadFile, "a deleted photo was saved").not.toHaveBeenCalled();
  });

  it("does not save a text message", async () => {
    autoSaveIncomingMedia(message("TextMessage", "https://m.example.com/x.jpg", { message_files: [] }), ME);
    await flush();
    expect(downloadFile, "a text message started a download").not.toHaveBeenCalled();
  });
});

describe("never the same file twice", () => {
  beforeEach(() => setAutoDownloadMode("always"));

  it("saves once when the same push arrives twice", async () => {
    const push = message("ImageMessage", "https://m.example.com/a.jpg");
    autoSaveIncomingMedia(push, ME);
    autoSaveIncomingMedia(push, ME);
    await flush();
    expect(downloadFile, "the photo was saved twice for one push").toHaveBeenCalledTimes(1);
  });

  it("saves once when the same file is sent again in a new message (a forward)", async () => {
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/a.jpg"), ME);
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/a.jpg"), ME);
    await flush();
    expect(downloadFile, "a forwarded copy of a saved photo was saved again").toHaveBeenCalledTimes(1);
  });

  it("saves once even after the page reloads", async () => {
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/a.jpg"), ME);
    await flush();

    // A reload clears memory but keeps localStorage.
    resetAutoDownloadMemory();
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/a.jpg"), ME);
    await flush();

    expect(downloadFile, "the photo was saved again after a page reload").toHaveBeenCalledTimes(1);
  });

  it("still saves a different file after a saved one", async () => {
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/a.jpg"), ME);
    autoSaveIncomingMedia(message("ImageMessage", "https://m.example.com/b.jpg"), ME);
    await flush();
    expect(
      downloadFile.mock.calls.map((call) => call[0]),
      "the second, different photo was not saved",
    ).toContain("https://m.example.com/b.jpg");
  });
});

// ---------------------------------------------------------------------------
// MISSED media: it came while the page was closed. The user opens the chat.
// ---------------------------------------------------------------------------

const CHAT = "ch1";
const DAY = 24 * 3600 * 1000;
const T0 = Date.parse("2026-10-01T10:00:00Z");

/** A chat message sent `days` days after T0. */
function sentAt(type: string, filePath: string, days: number, extra: Record<string, unknown> = {}) {
  return message(type, filePath, { created_at: new Date(T0 + days * DAY).toISOString(), ...extra });
}

/** The user looked at this chat once, so a "last visit" time is on record. */
function visitChatOnce() {
  autoSaveMissedMedia(CHAT, [sentAt("TextMessage", "", 0, { message_files: [] })], ME);
  // The next page load: memory is empty, localStorage stays.
  resetAutoDownloadMemory();
}

describe("media that came while the page was closed", () => {
  beforeEach(() => setAutoDownloadMode("always"));

  it("saves what is newer than the last visit, and not what is older", async () => {
    visitChatOnce();
    autoSaveMissedMedia(
      CHAT,
      [
        sentAt("ImageMessage", "https://m.example.com/old.jpg", -5),
        sentAt("ImageMessage", "https://m.example.com/new.jpg", 2),
      ],
      ME,
    );
    await flush();

    const saved = downloadFile.mock.calls.map((call) => call[0]);
    expect(saved, "the photo that came after the last visit was not saved").toContain(
      "https://m.example.com/new.jpg",
    );
    expect(saved, "a photo older than the last visit was saved").not.toContain(
      "https://m.example.com/old.jpg",
    );
  });

  it("saves nothing the first time it sees a chat (no old history)", async () => {
    autoSaveMissedMedia(CHAT, [sentAt("ImageMessage", "https://m.example.com/h.jpg", 1)], ME);
    await flush();
    expect(downloadFile, "old history was saved the first time the chat was seen").not.toHaveBeenCalled();
  });

  it("saves nothing when the choice is Never, and does not save it later either", async () => {
    visitChatOnce();
    setAutoDownloadMode("never");
    autoSaveMissedMedia(CHAT, [sentAt("ImageMessage", "https://m.example.com/n.jpg", 2)], ME);
    setAutoDownloadMode("always");
    autoSaveMissedMedia(CHAT, [sentAt("ImageMessage", "https://m.example.com/n.jpg", 2)], ME);
    await flush();
    expect(
      downloadFile,
      "a photo from before the user chose Always was saved after the switch",
    ).not.toHaveBeenCalled();
  });

  it("does not save the user's own media, voice messages or deleted media", async () => {
    visitChatOnce();
    autoSaveMissedMedia(
      CHAT,
      [
        sentAt("ImageMessage", "https://m.example.com/mine.jpg", 1, { sender_user: { id: ME } }),
        sentAt("VoiceMessage", "https://m.example.com/v.webm", 1),
        sentAt("ImageMessage", "https://m.example.com/gone.jpg", 1, { deleted_by_user_id: OTHER }),
        sentAt("ImageMessage", "https://m.example.com/hidden.jpg", 1, { auth_message_status: { is_deleted: 1 } }),
      ],
      ME,
    );
    await flush();
    expect(downloadFile, "own, voice or deleted media was saved").not.toHaveBeenCalled();
  });

  it("finds the new media when the messages load in two steps", async () => {
    visitChatOnce();
    // Step 1: the list in memory is old and has only a text message.
    autoSaveMissedMedia(CHAT, [sentAt("TextMessage", "", -5, { message_files: [] })], ME);
    // Step 2: the fresh list arrives with the photo.
    autoSaveMissedMedia(CHAT, [sentAt("ImageMessage", "https://m.example.com/late.jpg", 3)], ME);
    await flush();
    expect(
      downloadFile.mock.calls.map((call) => call[0]),
      "the photo that came with the second load was missed",
    ).toContain("https://m.example.com/late.jpg");
  });

  it("saves a file once when the live push and the chat open both find it", async () => {
    visitChatOnce();
    const photo = sentAt("ImageMessage", "https://m.example.com/both.jpg", 2);
    autoSaveIncomingMedia(photo, ME);
    autoSaveMissedMedia(CHAT, [photo], ME);
    await flush();
    expect(downloadFile, "one photo was saved twice (live and missed)").toHaveBeenCalledTimes(1);
  });

  it("saves at most 10 files, the newest ones", async () => {
    visitChatOnce();
    const many = Array.from({ length: 14 }, (_, i) =>
      sentAt("ImageMessage", `https://m.example.com/p${i}.jpg`, i + 1),
    );
    const started = autoSaveMissedMedia(CHAT, many, ME);
    await flush();

    const saved = downloadFile.mock.calls.map((call) => call[0]);
    expect(saved.length <= 10, "more than 10 files were saved for one chat open").toBe(true);
    expect(started, "the newest photo was left out of the 10").toContain("https://m.example.com/p13.jpg");
    expect(started, "an old photo took the place of a newer one").not.toContain("https://m.example.com/p0.jpg");
    expect(saved[0], "the files were not saved in the order they were sent").toBe("https://m.example.com/p4.jpg");
  });
});

describe("the blur while a missed file is saved", () => {
  beforeEach(() => setAutoDownloadMode("always"));

  it("blurs the file while it saves, then shows it clearly", async () => {
    visitChatOnce();
    const url = "https://m.example.com/blur.jpg";
    autoSaveMissedMedia(CHAT, [sentAt("ImageMessage", url, 2)], ME);
    expect(isAutoSaving(url), "the photo was not blurred while it was being saved").toBe(true);

    await flush();
    expect(isAutoSaving(url), "the photo stayed blurred after the save ended").toBe(false);
  });

  it("removes the blur even when the save hangs", async () => {
    visitChatOnce();
    downloadFile.mockImplementationOnce(() => new Promise<void>(() => {}));
    const url = "https://m.example.com/stuck.jpg";
    autoSaveMissedMedia(CHAT, [sentAt("ImageMessage", url, 2)], ME);
    expect(isAutoSaving(url), "the photo was not blurred while it was being saved").toBe(true);

    await vi.advanceTimersByTimeAsync(21_000);
    expect(isAutoSaving(url), "a stuck save kept the photo blurred for good").toBe(false);
  });

  it("does not blur a live message", async () => {
    const url = "https://m.example.com/live.jpg";
    autoSaveIncomingMedia(sentAt("ImageMessage", url, 1), ME);
    expect(isAutoSaving(url), "a live photo was blurred").toBe(false);
    await flush();
  });
});
