import React from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MotionGlobalConfig, frameData } from "framer-motion";

// The chat reads the iPhone from the user agent once, when it loads: Safari's
// top area takes the wash's grey only there. "jsdom" stays in it, so the
// animated emojis still know they run with no player.
vi.hoisted(() => {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) jsdom",
  });
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/sy-en/demo/chat/conversation",
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ lang: "sy-en" }),
}));
vi.mock("NewLoginDesign/DemoDeviceInfoModal", () => ({ default: () => null }));

import Demo1Shell from "components/DemoApp1/Demo1Shell";
import { resetDemoDebug } from "components/DemoApp/demoDebug";

// jsdom has no ResizeObserver and no Element.scrollTo; the chat opens at its
// end with scrollTo, and nothing here changes size.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
const element = HTMLElement.prototype as { scrollTo?: () => void };
element.scrollTo ??= () => {};

// framer reads its own frame clock instead of the real one, and the test moves
// that clock 1/60 s per frame: a slow run cannot end the fade before the test
// looks at it.
beforeAll(() => {
  MotionGlobalConfig.useManualTiming = true;
});
afterAll(() => {
  MotionGlobalConfig.useManualTiming = false;
});

/** The wash over the page, the wash under Safari's bar, and Safari's top area. */
const page = () =>
  document.querySelector<HTMLElement>('[data-pw="demo-chat-menu-backdrop"]');
const underBar = () =>
  document.querySelector<HTMLElement>('[data-pw="demo-chat-menu-backdrop-bar"] > div');
const top = () => document.querySelector<HTMLElement>('[data-pw="demo-top-tint"]');

/** How strong the top's grey is, 0 to 1: its colour's alpha, 0 when hidden. */
const topAmount = () => {
  const strip = top();
  if (!strip || strip.style.visibility !== "visible") return 0;
  const parts = strip.style.backgroundColor.match(/[\d.]+/g) ?? [];
  return parts.length === 4 ? Number(parts[3]) : 1;
};

const nextFrame = () =>
  act(
    () =>
      new Promise((done) => {
        frameData.timestamp += 1000 / 60;
        requestAnimationFrame(() => done(null));
      }),
  );

/** Holds the note until its menu opens, then reads the three parts on each frame until `done`. */
async function holdAndWatch(done: (page: number) => boolean) {
  render(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
  const note = document.querySelector(
    '[data-pw="demo-chat-message-note"] [data-pw="demo-chat-swipe"]',
  );
  expect(note, "the conversation shows no note to hold").not.toBeNull();
  fireEvent.pointerDown(note!, { button: 0, clientX: 10, clientY: 10 });
  await waitFor(
    () => {
      expect(page(), "holding the note put no wash over the chat").not.toBeNull();
      expect(underBar(), "holding the note put no wash under Safari's bar").not.toBeNull();
    },
    { timeout: 2000, interval: 5 },
  );
  const frames: { page: number; underBar: number; top: number }[] = [];
  for (let i = 0; i < 60; i += 1) {
    const now = { page: Number(page()!.style.opacity), underBar: Number(underBar()!.style.opacity), top: topAmount() };
    frames.push(now);
    if (done(now.page)) break;
    await nextFrame();
  }
  expect(
    frames.some((f) => f.page > 0 && f.page < 1),
    `the test saw no frame in the middle of the fade (page wash: ${frames.map((f) => f.page).join(", ")}), so it compared nothing`,
  ).toBe(true);
  return frames;
}

/** Takes the shell off the page, so the next render is the only one. The debug state stays. */
const cleanupShell = () => cleanup();

const near = (a: number, b: number) => Math.abs(a - b) < 0.01;

describe("ConversationScreen — the wash behind a held message is one piece", () => {
  it("the wash under Safari's bar is as dark as the page's wash on every frame of the fade", async () => {
    const frames = await holdAndWatch((p) => p === 1);
    expect(
      frames
        .filter((f) => !near(f.page, f.underBar))
        .map((f) => `page ${f.page.toFixed(3)} / under the bar ${f.underBar.toFixed(3)}`),
      "the wash under Safari's bar and the page's wash were at different darkness during the fade, so they show as two pieces",
    ).toEqual([]);
  });

  it("on the iPhone, Safari's top area is as dark as the page's wash on every frame of the fade", async () => {
    const frames = await holdAndWatch((p) => p === 1);
    expect(
      frames
        .filter((f) => !near(f.page, f.top))
        .map((f) => `page ${f.page.toFixed(3)} / top ${f.top.toFixed(3)}`),
      "Safari's top area and the page's wash were at different darkness during the fade, so the top shows as a piece of its own",
    ).toEqual([]);
    expect(
      top()?.style.backgroundColor,
      "Safari's top area did not end on the wash's grey",
    ).toMatch(/^rgba?\(179, 179, 179(, 1)?\)$/);
  });
});

describe("ConversationScreen — the debug colour picker sets Safari's top area", () => {
  afterEach(() => resetDemoDebug());

  it("a colour picked in the debug menu is the colour Safari's top area ends on", async () => {
    render(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
    const picker = document.querySelector<HTMLInputElement>('[data-pw="demo-debug-top-tint"]');
    expect(picker, "the debug menu shows no colour picker for the top bar").not.toBeNull();
    fireEvent.input(picker!, { target: { value: "#204060" } });
    fireEvent.change(picker!, { target: { value: "#204060" } });
    cleanupShell();
    await holdAndWatch((p) => p === 1);
    expect(
      top()?.style.backgroundColor,
      "Safari's top area did not end on the colour picked in the debug menu",
    ).toMatch(/^rgba?\(32, 64, 96(, 1)?\)$/);
  });

  it("the reset button gives the top area the wash's own grey back", async () => {
    render(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
    const picker = document.querySelector<HTMLInputElement>('[data-pw="demo-debug-top-tint"]');
    expect(picker, "the debug menu shows no colour picker for the top bar").not.toBeNull();
    fireEvent.change(picker!, { target: { value: "#204060" } });
    const reset = document.querySelector<HTMLButtonElement>('[data-pw="demo-debug-top-tint-reset"]');
    expect(reset, "a picked top colour shows no reset button").not.toBeNull();
    fireEvent.click(reset!);
    expect(
      document.querySelector('[data-pw="demo-debug-top-tint-reset"]'),
      "the reset button stayed after the colour was reset",
    ).toBeNull();
    cleanupShell();
    await holdAndWatch((p) => p === 1);
    expect(
      top()?.style.backgroundColor,
      "Safari's top area did not go back to the wash's grey after the reset",
    ).toMatch(/^rgba?\(179, 179, 179(, 1)?\)$/);
  });
});
