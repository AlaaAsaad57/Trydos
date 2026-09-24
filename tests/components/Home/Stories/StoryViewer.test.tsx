import { act, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

vi.mock("components/Home/Stories/VideoPreloader", () => ({ default: () => null }));
vi.mock("components/Home/Stories/ImagePreloader", () => ({ default: () => null }));
vi.mock("next/image", () => ({ default: ({ src, alt }: any) => <img src={src} alt={alt} /> }));
vi.mock("components/global/NextLink", () => ({
  default: ({ href, children }: any) => (
    <a href={href} data-pw="story-product-link" onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  ),
}));
const trackPosthog = vi.fn();
vi.mock("utils/posthogEvents", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackPosthog: (...a: any[]) => trackPosthog(...a),
}));

import StoryViewer from "components/Home/Stories/StoryViewer";

/** The parent the way StoryHolder uses it: it owns the index and follows
 *  onNext / onPrevious. Without it the viewer snaps back to currentIndex. */
function Holder(props: any) {
  const [i, setI] = useState(props.start ?? 0);
  return (
    <StoryViewer
      {...props}
      currentIndex={i}
      onNext={() => {
        setI((n: number) => n + 1);
        props.onNext?.();
      }}
      onPrevious={() => {
        setI((n: number) => Math.max(0, n - 1));
        props.onPrevious?.();
      }}
    />
  );
}

const images = [
  { id: 1, url: "a.png", type: "image" as const, duration: 1000 },
  { id: 2, url: "b.png", type: "image" as const },
];

const bars = () =>
  Array.from(document.querySelectorAll(".bg-white.h-full")).map((b) => (b as HTMLElement).style.width);
const leftZone = () => document.querySelector(".left-0.top-0.w-1\\/2") as HTMLElement;
const rightZone = () => document.querySelector(".right-0.top-0.w-1\\/2") as HTMLElement;
const storyImg = () => screen.getByAltText("story");
const loadImage = () => act(() => fireEvent.load(storyImg()));

describe("StoryViewer", () => {
  let play: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.useFakeTimers();
    trackPosthog.mockReset();
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows the loader until the picture loads, fills the bar, then moves on and reports the time spent", async () => {
    const onNext = vi.fn();
    const onStoryStart = vi.fn();
    const onStoryViewTime = vi.fn();
    await renderWithProviders(
      <Holder stories={images} onNext={onNext} onStoryStart={onStoryStart} onStoryViewTime={onStoryViewTime} loader={<i data-testid="loader" />} />,
    );
    expect(screen.getByTestId("loader"), "the loader is missing before the picture loads").toBeInTheDocument();
    expect(onStoryStart, "the first story start was not reported").toHaveBeenCalledWith(0);
    loadImage();
    expect(screen.queryByTestId("loader"), "the loader stayed after the picture loaded").toBeNull();
    act(() => vi.advanceTimersByTime(500));
    expect(parseFloat(bars()[0]), "the progress bar did not move").toBeGreaterThan(0);
    act(() => vi.advanceTimersByTime(600));
    expect(onNext, "the story did not move on after its duration").toHaveBeenCalled();
    expect(onStoryStart, "the second story start was not reported").toHaveBeenCalledWith(1);
    expect(bars()[0], "a finished story's bar is not full").toBe("100%");
    expect(onStoryViewTime.mock.calls[0][0].storyIndex, "the time spent on story 1 was not reported").toBe(0);
    expect(onStoryViewTime.mock.calls[0][0].storyType, "the story type was not reported").toBe("image");
  });

  it("uses five seconds for a picture with no duration and ends the ring after the last one", async () => {
    const onAllStoriesEnd = vi.fn();
    await renderWithProviders(<StoryViewer stories={images} currentIndex={1} onAllStoriesEnd={onAllStoriesEnd} />);
    loadImage();
    act(() => vi.advanceTimersByTime(4900));
    expect(onAllStoriesEnd, "the ring ended before five seconds").not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onAllStoriesEnd, "the ring did not end after the last story").toHaveBeenCalled();
  });

  it("moves back and forward with the tap zones", async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    await renderWithProviders(<Holder stories={images} onPrevious={onPrevious} onNext={onNext} />);
    fireEvent.click(leftZone());
    expect(onPrevious, "a back tap on the first story did not go to the previous author").toHaveBeenCalledTimes(1);
    fireEvent.click(rightZone());
    expect(onNext, "a forward tap did not move on").toHaveBeenCalledTimes(1);
    expect(bars()[0], "moving on did not fill the first bar").toBe("100%");
    fireEvent.click(leftZone());
    expect(onPrevious, "a back tap did not move back").toHaveBeenCalledTimes(2);
    expect(bars()[0], "moving back did not empty the first bar").toBe("0%");
  });

  it("follows the parent's index", async () => {
    const { rerender } = await renderWithProviders(<StoryViewer stories={images} />);
    rerender(<StoryViewer stories={images} currentIndex={1} />);
    expect(bars()[0], "the parent's index was not followed").toBe("100%");
  });

  it("pauses, counts the pause out of the viewing time, and resumes where it stopped", async () => {
    const onNext = vi.fn();
    const onStoryViewTime = vi.fn();
    const { rerender } = await renderWithProviders(<StoryViewer stories={images} onNext={onNext} onStoryViewTime={onStoryViewTime} />);
    loadImage();
    act(() => vi.advanceTimersByTime(500));
    rerender(<StoryViewer stories={images} isPaused onNext={onNext} onStoryViewTime={onStoryViewTime} />);
    expect(screen.queryByAltText("story"), "the story stayed on screen while paused").toBeNull();
    act(() => vi.advanceTimersByTime(5000));
    expect(onNext, "a paused story moved on").not.toHaveBeenCalled();
    rerender(<StoryViewer stories={images} onNext={onNext} onStoryViewTime={onStoryViewTime} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onNext, "the story did not move on after resuming").toHaveBeenCalled();
    const report = onStoryViewTime.mock.calls[0][0];
    expect(report.pausedTimeMs, "the pause was not counted").toBeGreaterThanOrEqual(5000);
    expect(report.viewingTimeMs, "the pause was counted as viewing time").toBeLessThan(2000);
  });

  // BUG-home-6: StoryViewer.tsx:142-161 — beginProgress(duration, initialProgress)
  // moves the progress start back by the part already watched, but the timer
  // that moves to the next story is still set to the FULL duration (line 160).
  // So after a pause the bar fills up and then the story stays on screen for
  // the part already watched again.
  it("BUG-home-6: after a pause the story waits only the time that was left", async () => {
    const onNext = vi.fn();
    const { rerender } = await renderWithProviders(<StoryViewer stories={images} onNext={onNext} />);
    loadImage();
    act(() => vi.advanceTimersByTime(500));
    rerender(<StoryViewer stories={images} isPaused onNext={onNext} />);
    rerender(<StoryViewer stories={images} onNext={onNext} />);
    act(() => vi.advanceTimersByTime(600));
    expect(onNext, "a 1 s story paused at 0.5 s must move on 0.5 s after resuming").toHaveBeenCalled();
  });

  it("reports the viewing time when closed, even while paused", async () => {
    const onStoryViewTime = vi.fn();
    const { rerender, unmount } = await renderWithProviders(<StoryViewer stories={images} onStoryViewTime={onStoryViewTime} />);
    loadImage();
    act(() => vi.advanceTimersByTime(300));
    rerender(<StoryViewer stories={images} isPaused onStoryViewTime={onStoryViewTime} />);
    act(() => vi.advanceTimersByTime(300));
    unmount();
    const report = onStoryViewTime.mock.calls.at(-1)![0];
    expect(report.pausedTimeMs, "the open pause was not counted when closing").toBeGreaterThanOrEqual(300);
  });

  it("moving on while paused counts the open pause for the story it leaves", async () => {
    const onStoryViewTime = vi.fn();
    const { rerender } = await renderWithProviders(<StoryViewer stories={images} onStoryViewTime={onStoryViewTime} />);
    loadImage();
    act(() => vi.advanceTimersByTime(400));
    rerender(<StoryViewer stories={images} isPaused onStoryViewTime={onStoryViewTime} />);
    act(() => vi.advanceTimersByTime(200));
    rerender(<StoryViewer stories={images} isPaused currentIndex={1} onStoryViewTime={onStoryViewTime} />);
    expect(onStoryViewTime.mock.calls[0][0].pausedTimeMs, "the pause was not counted for the story left").toBeGreaterThanOrEqual(200);
  });

  it("plays a video when it is ready, takes its length from the file, and moves on when it ends", async () => {
    const onStoryEnd = vi.fn();
    const onAllStoriesEnd = vi.fn();
    const videos = [{ id: 3, url: "v.mp4", type: "video" as const }];
    const { container, rerender } = await renderWithProviders(
      <StoryViewer stories={videos} activeId="1" id="1" onStoryEnd={onStoryEnd} onAllStoriesEnd={onAllStoriesEnd} />,
    );
    const video = container.querySelector("video")!;
    expect(video.getAttribute("src"), "the video address is wrong").toBe("v.mp4?target=story");
    expect(video.muted, "the active author's video was muted").toBe(false);
    Object.defineProperty(video, "duration", { value: 2, configurable: true });
    act(() => fireEvent.canPlay(video));
    expect(play, "the video did not start when it could play").toHaveBeenCalled();
    act(() => fireEvent.canPlay(video));
    act(() => fireEvent.loadedMetadata(video));
    rerender(<StoryViewer stories={videos} isPaused activeId="1" id="1" onStoryEnd={onStoryEnd} onAllStoriesEnd={onAllStoriesEnd} />);
    rerender(<StoryViewer stories={videos} activeId="1" id="1" onStoryEnd={onStoryEnd} onAllStoriesEnd={onAllStoriesEnd} />);
    const again = container.querySelector("video")!;
    Object.defineProperty(again, "duration", { value: 2, configurable: true });
    act(() => fireEvent.ended(again));
    expect(onStoryEnd, "the end of the video was not reported").toHaveBeenCalled();
    expect(onAllStoriesEnd, "the ring did not end after its only video").toHaveBeenCalled();
  });

  it("takes a paused video off screen and plays it again on resume", async () => {
    const videos = [{ id: 3, url: "v.mp4", type: "video" as const, duration: 3 }];
    const { container, rerender } = await renderWithProviders(<StoryViewer stories={videos} activeId="1" id="2" />);
    act(() => fireEvent.loadedMetadata(container.querySelector("video")!));
    rerender(<StoryViewer stories={videos} isPaused activeId="1" id="2" />);
    expect(container.querySelector("video"), "a paused viewer kept the video on screen").toBeNull();
    play.mockClear();
    rerender(<StoryViewer stories={videos} activeId="1" id="2" />);
    act(() => fireEvent.loadedMetadata(container.querySelector("video")!));
    expect(play, "the video did not play again after resuming").toHaveBeenCalled();
    expect(container.querySelector("video")!.muted, "a video of another author was not muted").toBe(true);
  });

  it("does not start the clock for a video with no length", async () => {
    const onAllStoriesEnd = vi.fn();
    const videos = [{ id: 3, url: "v.mp4", type: "video" as const }];
    const { container } = await renderWithProviders(<StoryViewer stories={videos} onAllStoriesEnd={onAllStoriesEnd} />);
    act(() => fireEvent.loadedMetadata(container.querySelector("video")!));
    act(() => vi.advanceTimersByTime(60_000));
    expect(onAllStoriesEnd, "a video with no length ended by the clock").not.toHaveBeenCalled();
  });

  it("shows the author header, with a placeholder when there is no picture", async () => {
    const { rerender } = await renderWithProviders(
      <StoryViewer stories={[{ url: "a.png", header: { heading: "Sara", subheading: "2h", profileImage: "me.png" } }]} />,
    );
    expect(screen.getByText("Sara"), "the author name is missing").toBeInTheDocument();
    expect(screen.getByAltText("avatar").getAttribute("src"), "the author picture is wrong").toBe("me.png");
    rerender(<StoryViewer stories={[{ url: "a.png" }]} header={{ heading: "Omar" } as any} />);
    expect(screen.getByText("Omar"), "the header prop was not used").toBeInTheDocument();
    expect(screen.getByAltText("avatar"), "the header with no picture has no avatar").toBeInTheDocument();
  });

  it("opens a story link with https added and records the tap", async () => {
    await renderWithProviders(<StoryViewer stories={[{ id: 9, url: "a.png", link: "shop.example.com" }]} />);
    const a = screen.getByLabelText("Story link");
    expect(a.getAttribute("href"), "the link did not get https in front").toBe("https://shop.example.com");
    fireEvent.click(a);
    expect(trackPosthog.mock.calls[0][1], "the link tap was not recorded").toEqual({ story_id: 9, story_type: "image", link: "shop.example.com" });
  });

  it("keeps a full link as it is", async () => {
    await renderWithProviders(<StoryViewer stories={[{ url: "a.png", link: "http://x.example.com" }]} />);
    expect(screen.getByLabelText("Story link").getAttribute("href"), "a full link was changed").toBe("http://x.example.com");
  });

  it("opens the story's product, closes the viewer and records the tap", async () => {
    const setSelectedStory = vi.fn();
    await renderWithProviders(<StoryViewer stories={[{ id: 4, url: "a.png", type: "video", product_slug: "shoe" }]} />, {
      store: { setSelectedStory },
    });
    const product = document.querySelector('[data-pw="story-product-link"]')!;
    expect(product.getAttribute("href"), "the product link is wrong").toBe("/gb-en/products/shoe");
    fireEvent.click(product);
    expect(setSelectedStory, "opening the product did not close the viewer").toHaveBeenCalledWith(null);
    expect(trackPosthog.mock.calls[0][1].story_type, "the product tap has the wrong story type").toBe("video");
  });

  it("marks that a story has a product even while paused, but hides the buttons", async () => {
    await renderWithProviders(<StoryViewer stories={[{ url: "a.png", product_slug: "shoe", link: "x.com" }]} isPaused />);
    expect(document.querySelector('[data-pw="story-actions"]')!.getAttribute("data-has-product"), "the product flag is wrong").toBe("true");
    expect(screen.queryByLabelText("Story link"), "the link showed while paused").toBeNull();
  });
});
