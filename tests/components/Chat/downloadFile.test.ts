// Saving a chat attachment (components/Chat/downloadFile.ts).
//
// The media server is another origin, so a plain `<a download>` opens a tab
// instead of saving. The helper saves a blob, and falls back to the server's
// `?download=1` link when the fetch fails.
import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadFile, fileNameFromUrl } from "components/Chat/downloadFile";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Records every link the helper clicks. */
function spyOnClicks() {
  const clicked: { href: string; download: string }[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push({ href: this.href, download: this.download });
  });
  return clicked;
}

describe("fileNameFromUrl", () => {
  it("takes the last path part and ignores the query", () => {
    expect(fileNameFromUrl("https://m.example.com/chat/file/my%20doc.pdf?v=2"), "the file name was wrong").toBe("my doc.pdf");
  });
});

describe("downloadFile", () => {
  it("saves the fetched bytes as a blob with the file name", async () => {
    const clicked = spyOnClicks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["x"]) }));
    URL.createObjectURL = vi.fn(() => "blob:local/1");
    URL.revokeObjectURL = vi.fn();

    await downloadFile("https://m.example.com/chat/file/a.pdf");

    expect(clicked, "the download link was not clicked").toHaveLength(1);
    expect(clicked[0].href, "the file was not saved from a local blob").toBe("blob:local/1");
    expect(clicked[0].download, "the saved file got the wrong name").toBe("a.pdf");
  });

  it("falls back to the server's attachment link when the fetch fails", async () => {
    const clicked = spyOnClicks();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("blocked by CORS")));

    await downloadFile("https://m.example.com/chat/file/a.pdf");

    expect(clicked[0]?.href, "no fallback download happened after the fetch failed").toBe(
      "https://m.example.com/chat/file/a.pdf?download=1",
    );
  });

  it("does nothing for an empty url", async () => {
    const clicked = spyOnClicks();
    await downloadFile("");
    expect(clicked, "an empty url started a download").toHaveLength(0);
  });
});
