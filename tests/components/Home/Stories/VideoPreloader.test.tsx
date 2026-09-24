import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import VideoPreloader from "components/Home/Stories/VideoPreloader";

// jsdom does not implement media loading, so load() is recorded instead.
let loaded: string[] = [];
let removed: string[] = [];

const stories = [
  { type: "video", url: "a.mp4" },
  { type: "video", url: "b.mp4" },
  { type: "image", url: "c.png" },
  { type: "video", url: "d.mp4" },
  { type: "video", url: "e.mp4" },
  { type: "video" },
];

describe("VideoPreloader", () => {
  beforeEach(() => {
    loaded = [];
    removed = [];
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(function (this: HTMLMediaElement) {
      loaded.push(this.getAttribute("src")!);
    });
    vi.spyOn(HTMLVideoElement.prototype, "remove").mockImplementation(function (this: HTMLVideoElement) {
      removed.push(this.getAttribute("src")!);
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the next two videos muted and hidden, once each, and drops the ones left behind", () => {
    const create = vi.spyOn(document, "createElement");
    const { rerender, unmount } = render(<VideoPreloader stories={stories} currentIndex={0} isPaused={false} />);
    expect(loaded, "the wrong videos were preloaded after story 1").toEqual(["b.mp4"]);
    const video = create.mock.results.find((r) => (r.value as HTMLElement).tagName === "VIDEO")!.value as HTMLVideoElement;
    expect(video.muted, "a preloaded video must be muted").toBe(true);
    expect(video.style.display, "a preloaded video must be hidden").toBe("none");
    expect(video.preload, "a preloaded video must load in full").toBe("auto");

    rerender(<VideoPreloader stories={stories} currentIndex={1} isPaused={false} />);
    expect(loaded, "a video already preloaded was loaded again").toEqual(["b.mp4", "d.mp4"]);

    rerender(<VideoPreloader stories={stories} currentIndex={3} isPaused={false} />);
    expect(removed, "a video far behind was not dropped").toContain("b.mp4");

    unmount();
    expect(removed, "closing the viewer did not drop the preloaded videos").toEqual(
      expect.arrayContaining(["d.mp4", "e.mp4"]),
    );
  });

  it("loads nothing while paused", () => {
    render(<VideoPreloader stories={stories} currentIndex={0} isPaused />);
    expect(loaded, "videos were preloaded while paused").toEqual([]);
  });
});
