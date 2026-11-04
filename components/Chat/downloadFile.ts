import { toDownloadUrl } from "components/Chat/videoSupport";

// Saves a chat attachment on the user's machine, without opening a tab.
//
// WHY AN `<a download>` ALONE IS NOT ENOUGH. The media server is a different
// origin from the app, and browsers ignore the `download` attribute across
// origins. A plain link (or `target="_blank"`) then opens the photo or video in
// a tab and nothing is saved.
//
// So we do it in two steps:
//   1. Fetch the file and save the bytes as a blob. A blob URL is same-origin,
//      so the `download` attribute works and the file goes straight to the
//      downloads folder.
//   2. If the fetch fails (for example the media server sends no CORS headers),
//      click a hidden link to `?download=1`. The server then answers with
//      `Content-Disposition: attachment`, so the browser saves the file and the
//      page stays where it is. No `target`, so no new tab.
//
// BIG FILES. Step 1 holds the whole file in memory. A 300 MB video can crash a
// phone's tab. So when the server says the file is bigger than MAX_BLOB_BYTES,
// we stop the fetch and use step 2 at once. The browser then writes the file
// straight to disk.

const MAX_BLOB_BYTES = 50 * 1024 * 1024;

/** How the file was saved: from a blob, by the server's link, or not at all. */
export type DownloadResult = "blob" | "link" | "none";

/** The file name at the end of the URL path, or a safe default. */
export function fileNameFromUrl(url: string): string {
  try {
    const last = new URL(url, "http://local.invalid").pathname
      .split("/")
      .filter(Boolean)
      .pop();
    return last ? decodeURIComponent(last) : "download";
  } catch {
    return "download";
  }
}

function clickHiddenLink(href: string, fileName: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.rel = "noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** The size the server gave in `Content-Length`, or null when it gave none. */
function contentLength(response: Response): number | null {
  const value = Number(response.headers?.get?.("content-length"));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Download one attachment. Never throws: a failed fetch, or a file that is too
 * big to hold in memory, falls back to the server's `?download=1` link.
 */
export async function downloadFile(
  url: string,
  fileName?: string,
): Promise<DownloadResult> {
  if (!url || typeof document === "undefined") return "none";
  const name = fileName || fileNameFromUrl(url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`download failed: ${response.status}`);
    const size = contentLength(response);
    if (size != null && size > MAX_BLOB_BYTES) {
      // Stop reading the body, so the big file never comes into memory.
      response.body?.cancel().catch(() => {});
      throw new Error("file too big for a blob");
    }
    const blobUrl = URL.createObjectURL(await response.blob());
    clickHiddenLink(blobUrl, name);
    // The browser has started reading the blob by the next task.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return "blob";
  } catch {
    clickHiddenLink(toDownloadUrl(url), name);
    return "link";
  }
}
