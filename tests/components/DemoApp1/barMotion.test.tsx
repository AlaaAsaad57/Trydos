import { useEffect } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MotionValue } from "framer-motion";

// framer-motion reads requestAnimationFrame once, when it loads. jsdom has
// none, so without this its frame loop is a no-op and no motion value ever
// changes. The queue is installed before the import for that reason.
const rafQueue = vi.hoisted(() => {
  const q = { frames: [] as FrameRequestCallback[] };
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
    q.frames.push(cb);
    return q.frames.length;
  };
  (globalThis as any).cancelAnimationFrame = () => {};
  return q;
});

import { BAR_SCROLL, useBarPulse, useScrollScale } from "components/DemoApp1/barMotion";

// One animation-frame queue shared by the bar's scroll loop and framer-motion,
// driven by hand so the test decides when time passes. framer-motion takes a
// frame's time from performance.now(), not from the time handed to the frame
// (motion-dom's frame loop), so performance.now() follows the same clock.
// It starts past 0: the bar drops a press within 260 ms of the last one, and
// the last one starts at 0.
let clock = 1000;
vi.spyOn(performance, "now").mockImplementation(() => clock);
const runFrames = (count: number, stepMs = 16) => {
  for (let i = 0; i < count; i++) {
    clock += stepMs;
    const due = rafQueue.frames;
    rafQueue.frames = [];
    act(() => due.forEach((cb) => cb(clock)));
  }
};

const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
};

// The bottom bar (Demo1BottomNav) draws this value; this reads it straight.
let scale: MotionValue<number> | null = null;
function Bar({ speedEffect }: { speedEffect: number }) {
  const value = useScrollScale(BAR_SCROLL.minScale, BAR_SCROLL.distance, speedEffect);
  useEffect(() => {
    scale = value;
  }, [value]);
  return null;
}

describe("useScrollScale (the bottom bar's scroll scale)", () => {
  // Moved from the deleted /navigation demo test (NavigationDemo/BottomNav.test.tsx),
  // where it covered the same hook through that demo's bar.
  it("scales down while scrolling down and back to full size at the top", () => {
    scrollTo(0);
    render(<Bar speedEffect={0} />);
    for (let y = 100; y <= 1200; y += 100) {
      scrollTo(y);
      runFrames(2);
    }
    runFrames(60);
    expect(scale!.get(), "the bar did not shrink to its smallest size while scrolling down").toBeCloseTo(
      BAR_SCROLL.minScale,
      2,
    );

    scrollTo(0);
    runFrames(80);
    expect(scale!.get(), "the bar did not return to full size at the top").toBeCloseTo(1, 2);
  });

  it("a press pulses the bar when reduced motion is off", () => {
    let bar: { scale: MotionValue<number>; firePulse: () => void } | null = null;
    function Pressed() {
      const pulse = useBarPulse(
        useScrollScale(BAR_SCROLL.minScale, BAR_SCROLL.distance, BAR_SCROLL.speedEffect),
      );
      useEffect(() => {
        bar = pulse;
      }, [pulse]);
      return null;
    }
    scrollTo(0);
    render(<Pressed />);
    let largest = bar!.scale.get();
    act(() => bar!.firePulse());
    for (let i = 0; i < 40; i++) {
      runFrames(1);
      largest = Math.max(largest, bar!.scale.get());
    }
    expect(largest, "a press did not pulse the bar").toBeGreaterThan(1.02);
  });
});
