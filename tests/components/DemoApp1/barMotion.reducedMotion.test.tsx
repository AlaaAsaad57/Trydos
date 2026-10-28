import { useEffect } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MotionValue } from "framer-motion";

// framer-motion reads requestAnimationFrame once, when it loads. jsdom has
// none, so the queue is installed before the import (see barMotion.test.tsx).
const rafQueue = vi.hoisted(() => {
  const q = { frames: [] as FrameRequestCallback[] };
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
    q.frames.push(cb);
    return q.frames.length;
  };
  (globalThis as any).cancelAnimationFrame = () => {};
  return q;
});

// `useReducedMotion` reads matchMedia once and caches it, so the hook itself
// is replaced: the shopper has asked their phone to stop things moving.
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return { ...actual, useReducedMotion: () => true };
});

import { BAR_SCROLL, useBarPulse, useScrollScale } from "components/DemoApp1/barMotion";

// framer-motion takes a frame's time from performance.now(), so it follows
// the same hand-driven clock as the frame queue. It starts past 0: the bar
// drops a press that comes within 260 ms of the last one, and the last one
// starts at 0, so a clock at 0 would drop the first press too.
let clock = 1000;
vi.spyOn(performance, "now").mockImplementation(() => clock);
const runFrames = (count: number, stepMs = 16, each?: () => void) => {
  for (let i = 0; i < count; i++) {
    clock += stepMs;
    const due = rafQueue.frames;
    rafQueue.frames = [];
    act(() => due.forEach((cb) => cb(clock)));
    each?.();
  }
};

let bar: { scale: MotionValue<number>; firePulse: () => void } | null = null;
function Bar() {
  const scroll = useScrollScale(BAR_SCROLL.minScale, BAR_SCROLL.distance, BAR_SCROLL.speedEffect);
  const pulse = useBarPulse(scroll);
  useEffect(() => {
    bar = pulse;
  }, [pulse]);
  return null;
}

describe("the bottom bar with reduced motion on", () => {
  it("a press does not pulse the bar", () => {
    render(<Bar />);
    let largest = bar!.scale.get();
    act(() => bar!.firePulse());
    runFrames(40, 16, () => {
      largest = Math.max(largest, bar!.scale.get());
    });
    expect(
      largest,
      `a press grew the bar to ${largest.toFixed(3)} with reduced motion on`,
    ).toBeCloseTo(1, 3);
  });
});
