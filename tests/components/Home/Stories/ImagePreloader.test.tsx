import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ImagePreloader from "components/Home/Stories/ImagePreloader";

// Every picture the preloader asks the browser for, in order.
let requested: string[] = [];
class RecordingImage {
  loading = "";
  decoding = "";
  set src(url: string) {
    requested.push(url);
  }
}

const stories = [
  { type: "image", url: "a.png" },
  { type: "image", url: "b.png" },
  { type: "video", url: "c.mp4" },
  { type: "image", url: "d.png" },
  { type: "image", url: "e.png" },
  { type: "image", url: "f.png" },
  { type: "image" },
];

const preloadLinks = () =>
  Array.from(document.head.querySelectorAll('link[rel="preload"]')).map((l) => l.getAttribute("href"));

describe("ImagePreloader", () => {
  beforeEach(() => {
    requested = [];
    vi.stubGlobal("Image", RecordingImage);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for the next three pictures, skipping videos, and puts a high-priority link on the next one", () => {
    const { rerender, unmount } = render(<ImagePreloader stories={stories} currentIndex={0} isPaused={false} />);
    expect(requested, "the wrong pictures were preloaded after story 1").toEqual(["b.png", "d.png"]);
    expect(preloadLinks(), "the next picture has no preload link").toEqual(["b.png"]);

    rerender(<ImagePreloader stories={stories} currentIndex={1} isPaused={false} />);
    expect(requested, "a picture already preloaded was asked for again").toEqual(["b.png", "d.png", "e.png"]);
    expect(preloadLinks(), "the next story is a video and still got a picture link").toEqual([]);

    // Far ahead: b.png falls out of the window and is forgotten, so it is asked
    // for again when the shopper comes back to it.
    rerender(<ImagePreloader stories={stories} currentIndex={4} isPaused={false} />);
    rerender(<ImagePreloader stories={stories} currentIndex={0} isPaused={false} />);
    expect(requested.filter((u) => u === "b.png").length, "a picture far behind was not forgotten").toBe(2);

    unmount();
    expect(preloadLinks(), "the preload link was left in the page after closing").toEqual([]);
  });

  it("asks for nothing while paused and at the last story", () => {
    render(<ImagePreloader stories={stories} currentIndex={0} isPaused />);
    expect(requested, "pictures were preloaded while paused").toEqual([]);
    render(<ImagePreloader stories={stories} currentIndex={6} isPaused={false} />);
    expect(requested, "pictures were preloaded past the last story").toEqual([]);
  });

  it("does not fail when the link was already taken out of the page", () => {
    const { unmount } = render(<ImagePreloader stories={stories} currentIndex={0} isPaused={false} />);
    document.head.querySelectorAll('link[rel="preload"]').forEach((l) => l.remove());
    expect(() => unmount(), "closing failed when the link was already gone").not.toThrow();
  });
});
