import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// framer-motion reads requestAnimationFrame once, when it loads. jsdom has
// none, so the queue is installed before the import and driven by hand — the
// same set-up as tests/components/NavigationDemo/BottomNav.test.tsx.
const rafQueue = vi.hoisted(() => {
  const q = { frames: [] as FrameRequestCallback[] };
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
    q.frames.push(cb);
    return q.frames.length;
  };
  (globalThis as any).cancelAnimationFrame = () => {};
  return q;
});

// jsdom never paints a motion value, so the bar's size is read from the last
// transform the bar builds (full size x press pulse).
const painted = vi.hoisted(() => ({ values: [] as any[] }));
vi.mock("framer-motion", async (importOriginal) => {
  const real = await importOriginal<typeof import("framer-motion")>();
  return {
    ...real,
    useTransform: ((...args: any[]) => {
      const value = (real.useTransform as any)(...args);
      painted.values.push(value);
      return value;
    }) as typeof real.useTransform,
  };
});
const barScale = () =>
  painted.values[painted.values.length - 1].get() as number;
// The drop is built right before the pulse (the last transform), so it is the one before it.
const barDrop = () =>
  painted.values[painted.values.length - 2].get() as number;

import DemoBottomNav from "components/DemoApp/DemoBottomNav";

let clock = 0;
const runFrames = (count: number) => {
  for (let i = 0; i < count; i++) {
    clock += 16;
    const due = rafQueue.frames;
    rafQueue.frames = [];
    act(() => due.forEach((cb) => cb(clock)));
  }
};

/** A box that scrolls up and down (or only sideways), like a demo screen's scroll area. */
const scroller = (vertical: boolean) => {
  const box = document.createElement("div");
  Object.defineProperty(box, "clientHeight", {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(box, "scrollHeight", {
    value: vertical ? 3000 : 800,
    configurable: true,
  });
  document.body.appendChild(box);
  return box;
};
const scrollBox = (box: HTMLElement, y: number) => {
  box.scrollTop = y;
  act(() => {
    box.dispatchEvent(new Event("scroll"));
  });
};

const nav = (
  props: Partial<React.ComponentProps<typeof DemoBottomNav>> = {},
) => (
  <DemoBottomNav
    active="home"
    visible
    photo={null}
    resetKey="home"
    onSelect={() => {}}
    t={(key) => key}
    {...props}
  />
);

describe("DemoBottomNav", () => {
  beforeEach(() => {
    for (let i = 0; i < 500 && rafQueue.frames.length; i++) runFrames(1);
    painted.values = [];
    clock = 0;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("keeps its full size while a screen's own box scrolls down, as `Home Page – 9` draws the scrolled bar", () => {
    render(nav());
    const box = scroller(true);
    for (let y = 100; y <= 1200; y += 100) {
      scrollBox(box, y);
      runFrames(2);
    }
    runFrames(60);
    expect(
      barScale(),
      "scrolling a screen's box shrank the bar; the file draws the scrolled bar at full size (386 x 58) and only moves it down",
    ).toBeCloseTo(1, 2);
  });

  it("drops 35 px at the scroll cap, so 20 px of it hang below the screen edge as `Home Page – 9` draws it, and comes back at the top", () => {
    render(nav());
    const box = scroller(true);
    expect(barDrop(), "the bar does not start at its rest position").toBe(0);
    for (let y = 100; y <= 1200; y += 100) {
      scrollBox(box, y);
      runFrames(2);
    }
    runFrames(60);
    expect(
      barDrop(),
      "at the scroll cap the bar did not move down; the file moves it down 35 px (top at 38 above the edge instead of 73)",
    ).toBeCloseTo(35, 0);

    scrollBox(box, 0);
    runFrames(80);
    expect(
      barDrop(),
      "the bar did not come back up to its rest position at the top of the box",
    ).toBeCloseTo(0, 1);
  });

  it("is fully down at the end of the profile tab, which scrolls only 197 px (1129 - 932), as `Home Page – 9` draws it", () => {
    render(nav({ active: "settings", resetKey: "settings" }));
    const box = document.createElement("div");
    Object.defineProperty(box, "clientHeight", { value: 882 });
    Object.defineProperty(box, "scrollHeight", { value: 882 + 197 });
    document.body.appendChild(box);
    for (let y = 10; y <= 197; y += 10) {
      scrollBox(box, Math.min(y, 197));
      runFrames(2);
    }
    scrollBox(box, 197);
    runFrames(60);
    expect(
      barDrop(),
      "at the end of the profile tab the bar is not at the file's y (1091 on the 1129 board = 35 below its rest)",
    ).toBeCloseTo(35, 0);
  });

  it("does not move when a row that only scrolls sideways is swiped", () => {
    render(nav());
    const row = scroller(false);
    for (let x = 100; x <= 800; x += 100) {
      scrollBox(row, x);
      runFrames(2);
    }
    runFrames(40);
    expect(
      barScale(),
      "swiping a sideways row of chips shrank the bar",
    ).toBeCloseTo(1, 2);
  });

  it("comes back up to its rest position when the screen changes", () => {
    const { rerender } = render(nav());
    const box = scroller(true);
    for (let y = 100; y <= 1200; y += 100) {
      scrollBox(box, y);
      runFrames(2);
    }
    runFrames(60);
    expect(
      barDrop(),
      "the bar did not drop before the screen changed",
    ).toBeGreaterThan(30);

    rerender(nav({ resetKey: "search", active: "search" }));
    runFrames(80);
    expect(
      barDrop(),
      "a new screen started with the bar still dropped",
    ).toBeCloseTo(0, 1);
  });

  it("draws the file's glass: no fill of its own, blur 30 with 15% brightness behind it, on a layer that is not the one that moves", () => {
    const { container } = render(nav());
    const glass = container.querySelector(
      '[data-pw="demo-tab-glass"]',
    ) as HTMLElement | null;
    expect(glass, "the tab bar has no glass layer").not.toBeNull();
    expect(
      glass!.style.backgroundColor,
      "the glass has a solid fill; the file draws it at 0% fill opacity",
    ).toMatch(/^(transparent|rgba\(0, 0, 0, 0\)|)$/);
    const filter =
      glass!.style.backdropFilter ||
      glass!.style.getPropertyValue("-webkit-backdrop-filter") ||
      glass!.getAttribute("style") ||
      "";
    expect(filter, "the glass does not blur what is behind it by 30").toContain(
      "blur(30px)",
    );
    expect(
      filter,
      "the glass does not brighten what is behind it by 15%",
    ).toContain("brightness(1.15)");
    expect(
      glass!.style.borderRadius,
      "the glass has not got the file's 10 / 40 corners",
    ).toBe("10px 10px 40px 40px");
    // The drop and the press pulse live on the element with the centred
    // transform origin. Safari on iPhone clips a backdrop filter wrongly when
    // the same element also carries a transform, so the glass must be a child of it.
    const scaled = glass!.parentElement as HTMLElement;
    expect(
      scaled.style.transformOrigin,
      "the glass is not a child of the element that moves with the scroll",
    ).toBe("center center");
    expect(
      glass!.style.transform,
      "the glass layer carries a transform of its own",
    ).toBe("");
  });

  it("draws home, cart and chat with the same icon active or not (the file has no blue variant); only search changes", () => {
    const src = (container: HTMLElement, tab: string) =>
      (
        container.querySelector(`[data-pw="demo-tab-${tab}"] img`) as
          | HTMLImageElement
          | null
      )?.getAttribute("src");
    for (const tab of ["home", "cart", "chat"] as const) {
      const idle = src(render(nav({ active: "search" })).container, tab);
      const on = src(render(nav({ active: tab })).container, tab);
      expect(
        on,
        `the active ${tab} tab draws ${on}; the design file draws the same icon as when it is idle (${idle}) — the dark ring, not a blue one`,
      ).toBe(idle);
    }
    expect(
      src(render(nav({ active: "search" })).container, "search"),
      "the active search tab does not grow into the file's blue ring",
    ).toBe("/assets/demo/xd/navSearchActive.svg");
  });

  it("picks a tab with the keyboard and marks the active one", () => {
    const onSelect = vi.fn();
    const { container } = render(nav({ active: "cart", onSelect }));
    const cart = container.querySelector('[data-pw="demo-tab-cart"]')!;
    expect(
      cart.getAttribute("aria-current"),
      "the active tab is not marked as the current page",
    ).toBe("page");
    fireEvent.keyDown(container.querySelector('[data-pw="demo-tab-chat"]')!, {
      key: "Enter",
    });
    expect(
      onSelect,
      "Enter on the chat tab did not pick it",
    ).toHaveBeenCalledWith("chat");
  });
});
