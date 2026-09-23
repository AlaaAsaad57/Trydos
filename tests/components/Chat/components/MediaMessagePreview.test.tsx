// The full-screen viewer for a chat photo or video
// (components/Chat/components/MediaMessagePreview.tsx).
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

import MediaMessagePreview from "components/Chat/components/MediaMessagePreview";

async function mount(media: { imgs?: string | null; vid?: string | null }) {
  const setImgs = vi.fn();
  const setVid = vi.fn();
  const r = await renderWithProviders(
    <MediaMessagePreview imgs={media.imgs ?? null} vid={media.vid ?? null} setImgs={setImgs} setVid={setVid} />,
  );
  return { ...r, setImgs, setVid };
}

describe("MediaMessagePreview", () => {
  it("shows a photo on top of the page and locks the scroll until it closes", async () => {
    document.body.style.overflow = "auto";
    const { unmount, setImgs, setVid } = await mount({ imgs: "https://example.com/p.png" });
    const dialog = screen.getByRole("dialog", { name: "Image" });
    expect(dialog.parentElement, "the viewer was not put at the end of the body").toBe(document.body);
    expect(document.body.style.overflow, "the page behind could still scroll").toBe("hidden");
    expect(screen.getByAltText("Image"), "the photo was not shown").toBeInTheDocument();
    expect(screen.getByLabelText("Download").getAttribute("href"), "the download link did not ask for a download").toBe(
      "https://example.com/p.png?download=1",
    );
    fireEvent.click(screen.getByAltText("Image"));
    expect(setImgs, "a tap on the photo did not close the viewer").toHaveBeenCalledWith(null);
    expect(setVid, "closing did not clear the video too").toHaveBeenCalledWith(null);
    unmount();
    expect(document.body.style.overflow, "the page scroll was not put back").toBe("auto");
  });

  it("plays a video, and a tap on it does not close the viewer", async () => {
    const { setImgs } = await mount({ vid: "https://example.com/v.mp4" });
    const video = document.querySelector("video")!;
    expect(video.getAttribute("src"), "the video was not shown").toBe("https://example.com/v.mp4");
    fireEvent.click(video);
    fireEvent.click(screen.getByLabelText("Download"));
    expect(setImgs, "a tap on the video or the download closed the viewer").not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Close"));
    expect(setImgs, "the close button did not close the viewer").toHaveBeenCalledWith(null);
  });

  it("closes on Escape only", async () => {
    const { setImgs } = await mount({ imgs: "https://example.com/p.png" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(setImgs, "a key other than Escape closed the viewer").not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(setImgs, "Escape did not close the viewer").toHaveBeenCalledWith(null);
  });

  it("shows an empty stage with nothing to show", async () => {
    await mount({});
    expect(screen.getByLabelText("Download").getAttribute("href"), "an empty viewer linked to something").toBe("");
    expect(document.querySelector("video, img"), "an empty viewer showed media").toBeNull();
  });
});
