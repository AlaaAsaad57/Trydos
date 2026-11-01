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

/**
 * Download one attachment. Never throws: a failed fetch falls back to the
 * server's `?download=1` link.
 */
export async function downloadFile(url: string, fileName?: string) {
  if (!url || typeof document === "undefined") return;
  const name = fileName || fileNameFromUrl(url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`download failed: ${response.status}`);
    const blobUrl = URL.createObjectURL(await response.blob());
    clickHiddenLink(blobUrl, name);
    // The browser has started reading the blob by the next task.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    clickHiddenLink(toDownloadUrl(url), name);
  }
}
