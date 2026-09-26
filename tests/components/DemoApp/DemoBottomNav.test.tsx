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
// transform the bar builds (scroll scale x press pulse).
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

/**
 * Frames with a microtask between them, as a browser runs them. framer-motion
 * keeps "now" in a cache it clears in a microtask; a test that never yields
 * keeps the old time, and an `animate` spring then reads as finished on its
 * first frame (or stops moving after it).
 */
const runFramesYielding = async (count: number) => {
  for (let i = 0; i < count; i++) {
    runFrames(1);
    await Promise.resolve();
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

/**
 * The width a tab's icon is drawn at: its box times the scale framer-motion
 * last wrote on it (jsdom paints nothing, so the transform is read back).
 */
const drawnSize = (container: HTMLElement, tab: string) => {
  const box = container.querySelector(
    `[data-pw="demo-tab-${tab}-icon"]`,
  ) as HTMLElement | null;
  if (!box) throw new Error(`the ${tab} tab has no icon box to size`);
  const scale = /scale\(([-\d.e]+)\)/.exec(box.style.transform);
  return parseFloat(box.style.width) * (scale ? parseFloat(scale[1]) : 1);
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

  it("scales down while a screen's own box scrolls down, and back up when it returns to the top", () => {
    render(nav());
    const box = scroller(true);
    for (let y = 100; y <= 1200; y += 100) {
      scrollBox(box, y);
      runFrames(2);
    }
    runFrames(60);
    expect(
      barScale(),
      "scrolling a screen's box down did not shrink the bar (the page itself never scrolls here)",
    ).toBeLessThan(0.8);

    scrollBox(box, 0);
    runFrames(80);
    expect(
      barScale(),
      "the bar did not come back to full size at the top of the box",
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
      "at the scroll cap the bar only scaled; the file moves it down 35 px (top at 38 above the edge instead of 73)",
    ).toBeCloseTo(35, 0);

    scrollBox(box, 0);
    runFrames(80);
    expect(
      barDrop(),
      "the bar did not come back up to its rest position at the top of the box",
    ).toBeCloseTo(0, 1);
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

  it("goes back to full size when the screen changes", () => {
    const { rerender } = render(nav());
    const box = scroller(true);
    for (let y = 100; y <= 1200; y += 100) {
      scrollBox(box, y);
      runFrames(2);
    }
    runFrames(60);
    expect(
      barScale(),
      "the bar did not shrink before the screen changed",
    ).toBeLessThan(0.8);

    rerender(nav({ resetKey: "search", active: "search" }));
    runFrames(80);
    expect(barScale(), "a new screen started with a shrunken bar").toBeCloseTo(
      1,
      2,
    );
  });

  it("draws the file's glass: no fill of its own, blur 30 with 15% brightness behind it, on a layer that is not the one that scales", () => {
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
    // The scroll scale lives on the element with the centred transform origin.
    // Safari on iPhone clips a backdrop filter wrongly when the same element
    // also carries a transform, so the glass must be a child of it.
    const scaled = glass!.parentElement as HTMLElement;
    expect(
      scaled.style.transformOrigin,
      "the glass is not a child of the element that scales with the scroll",
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
    const search = render(nav({ active: "search" })).container.querySelector(
      '[data-pw="demo-tab-search"] img[src="/assets/demo/xd/navSearchActive.svg"]',
    ) as HTMLElement | null;
    expect(
      search,
      "the active search tab does not draw the file's blue ring",
    ).not.toBeNull();
    expect(
      search!.style.opacity,
      "the active search tab draws the blue ring hidden",
    ).toBe("1");
  });

  it("draws the active icon bigger — 35 grows to the file's 43 (search `– 1`), the profile box 34 to 42 — and every idle one at its own size", () => {
    const { container } = render(nav({ active: "cart" }));
    runFrames(80);
    const sizes = Object.fromEntries(
      (["home", "search", "cart", "chat", "settings"] as const).map((tab) => [
        tab,
        drawnSize(container, tab),
      ]),
    );
    expect(sizes.cart, "the active cart icon is not drawn at 43 px").toBeCloseTo(
      43,
      0,
    );
    expect(sizes.home, "the idle home icon is not drawn at 35 px").toBeCloseTo(
      35,
      0,
    );
    expect(
      sizes.search,
      "the idle search icon is not drawn at 35 px",
    ).toBeCloseTo(35, 0);
    expect(sizes.chat, "the idle chat icon is not drawn at 34 px").toBeCloseTo(
      34,
      0,
    );
    expect(
      sizes.settings,
      "the idle profile box is not drawn at 34 px",
    ).toBeCloseTo(34, 0);

    for (const [tab, size] of [
      ["home", 43],
      ["search", 43],
      ["chat", 41.8],
      ["settings", 42],
    ] as const) {
      const { container: c } = render(nav({ active: tab }));
      runFrames(80);
      expect(
        drawnSize(c, tab),
        `the active ${tab} icon is not drawn at ${size} px`,
      ).toBeCloseTo(size, 0);
    }
  });

  it("grows the new active icon and shrinks the old one over several frames, not in one jump", async () => {
    const { container, rerender } = render(nav({ active: "cart" }));
    await runFramesYielding(80);
    rerender(nav({ active: "home" }));
    await runFramesYielding(6);
    const home = drawnSize(container, "home");
    const cart = drawnSize(container, "cart");
    expect(
      home > 35.5 && home < 42.5,
      `six frames (100 ms) after the tap the home icon is ${home.toFixed(2)} px; it should be on its way from 35 to 43, not jump`,
    ).toBe(true);
    expect(
      cart > 35.5 && cart < 42.5,
      `six frames (100 ms) after the tap the cart icon is ${cart.toFixed(2)} px; it should be on its way from 43 back to 35, not jump`,
    ).toBe(true);
    await runFramesYielding(80);
    expect(
      drawnSize(container, "home"),
      "the home icon did not settle at 43 px",
    ).toBeCloseTo(43, 0);
    expect(
      drawnSize(container, "cart"),
      "the cart icon did not settle back at 35 px",
    ).toBeCloseTo(35, 0);
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
