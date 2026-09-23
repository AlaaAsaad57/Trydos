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
