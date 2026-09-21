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
vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, LogError: vi.fn() };
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
