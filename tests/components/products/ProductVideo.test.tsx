// The small "Quick Video" player on a product photo. It plays only the video
// on the current slide, opens full size on a tap, and can be closed. The Embla
// carousel is replaced by a hand-driven stand-in, because jsdom has no layout.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductVideo from "components/products/ProductVideo";

import { act, fireEvent, renderWithProviders, screen } from "../../render";

const { embla } = vi.hoisted(() => {
  const listeners: Record<string, () => void> = {};
  return {
    embla: {
      listeners,
      snap: 0,
      withApi: true,
      options: null as any,
      api: {
        on: (name: string, cb: () => void) => {
          listeners[name] = cb;
        },
        selectedScrollSnap: () => embla.snap,
        reInit: vi.fn(),
        scrollPrev: vi.fn(),
        scrollNext: vi.fn(),
      },
    },
  };
});
vi.mock("embla-carousel-react", () => ({
  default: (options: any) => {
    embla.options = options;
    return [() => {}, embla.withApi ? embla.api : undefined];
  },
}));

const play = vi.fn();
const pause = vi.fn();

function select(index: number) {
  embla.snap = index;
  act(() => embla.listeners.select());
}

const videos = () => Array.from(document.querySelectorAll("video"));
const closeButton = () => document.querySelector(".cursor-pointer.w-\\[30px\\]") as HTMLElement;

describe("ProductVideo", () => {
  beforeEach(() => {
    embla.snap = 0;
    embla.withApi = true;
    embla.api.reInit.mockReset();
    embla.api.scrollPrev.mockReset();
    embla.api.scrollNext.mockReset();
    play.mockReset();
    play.mockResolvedValue(undefined);
    pause.mockReset();
    Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: play });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, value: pause });
    document.documentElement.style.overflow = "";
  });
  afterEach(() => {
    document.documentElement.style.overflow = "";
  });

  it("renders nothing without videos", async () => {
    const { container } = await renderWithProviders(<ProductVideo videos={[]} language="en" />);
    expect(container.innerHTML, "an empty video list rendered a player").toBe("");
  });

  it("plays only the current slide's video, muted, with dots for two videos", async () => {
    await renderWithProviders(<ProductVideo videos={["a.mp4", "b.mp4"]} language="en" />);
    expect(embla.options.direction, "English is not left-to-right").toBe("ltr");
    expect(videos()[0].muted, "the small player is not muted").toBe(true);
    expect(videos()[0].getAttribute("src"), "the small player is not cut to 10 seconds").toContain("a.mp4");
    expect(play, "the first video did not play").toHaveBeenCalledTimes(1);
    expect(pause, "the second video was not paused").toHaveBeenCalledTimes(1);
    const dots = document.querySelectorAll(".rounded-full.w-1\\.5");
    expect(dots[0].className, "the first dot is not active").toMatch(/bg-white$/);

    play.mockClear();
    select(1);
    expect(play, "the second slide's video did not play").toHaveBeenCalledTimes(1);
    expect(dots[1].className, "the second dot did not become active").toMatch(/bg-white$/);
  });

  it("opens full size from the video, the label and the border, with arrows in Arabic", async () => {
    await renderWithProviders(<ProductVideo videos={["a.mp4", "b.mp4"]} language="ar" />, { language: "ar" });
    expect(embla.options.direction, "Arabic is not right-to-left").toBe("rtl");

    fireEvent.click(screen.getByText("فيديو سريع"));
    expect(document.documentElement.style.overflow, "opening did not lock the page scroll").toBe("hidden");
    expect(embla.api.reInit, "the carousel was not re-measured full size").toHaveBeenCalled();
    expect(videos()[0].controls, "the full-size player has no controls").toBe(true);
    // A tap on the video while it is already big does nothing.
    fireEvent.click(videos()[0]);

    fireEvent.click(screen.getByText("→"));
    fireEvent.click(screen.getByText("←"));
    expect(embla.api.scrollPrev, "the previous arrow did not scroll").toHaveBeenCalled();
    expect(embla.api.scrollNext, "the next arrow did not scroll").toHaveBeenCalled();

    // Close button while big: back to small.
    fireEvent.click(closeButton());
    expect(videos()[0].controls, "the close button did not shrink the player").toBe(false);

    fireEvent.click(document.querySelector("svg.absolute.top-0") as Element);
    expect(videos()[0].controls, "the border did not open the player").toBe(true);
    fireEvent.click(document.querySelector(".backdrop-blur-md") as HTMLElement);
    expect(videos()[0].controls, "the backdrop did not shrink the player").toBe(false);

    fireEvent.click(videos()[0]);
    expect(videos()[0].controls, "a tap on the small video did not open it").toBe(true);
  });

  it("the close button on the small player hides it", async () => {
    const { container } = await renderWithProviders(<ProductVideo videos={["a.mp4"]} language="en" />);
    expect(document.querySelector(".rounded-full.w-1\\.5"), "one video showed dots").toBeNull();
    fireEvent.click(closeButton());
    expect(container.innerHTML, "the small player did not go away").toBe("");
  });

  it("keeps working before the carousel is ready", async () => {
    embla.withApi = false;
    await renderWithProviders(<ProductVideo videos={["a.mp4", "b.mp4"]} language="en" />);
    fireEvent.click(screen.getByText("Quick Video"));
    fireEvent.click(screen.getByText("←"));
    fireEvent.click(screen.getByText("→"));
    expect(embla.api.scrollPrev, "an arrow used a carousel that was not ready").not.toHaveBeenCalled();
  });

  it("ignores a video that is blocked from autoplay", async () => {
    play.mockRejectedValue(new Error("NotAllowedError"));
    await renderWithProviders(<ProductVideo videos={["a.mp4"]} language="en" />);
    await act(async () => {});
    expect(videos().length === 1, "a blocked autoplay broke the player").toBe(true);
  });

  // BUG-products-6: ProductVideo.tsx lines 50-55. Opening the video calls
  // DisableScroll() (html overflow: hidden), but nothing calls EnableScroll()
  // when it is closed again, so the product page stays unscrollable.
  it("BUG-products-6: closing the full-size video must let the page scroll again", async () => {
    await renderWithProviders(<ProductVideo videos={["a.mp4"]} language="en" />);
    fireEvent.click(screen.getByText("Quick Video"));
    fireEvent.click(closeButton());
    expect(
      document.documentElement.style.overflow,
      "the page is still locked (overflow hidden) after the video was closed",
    ).not.toBe("hidden");
  });
});
