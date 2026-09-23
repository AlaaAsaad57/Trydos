import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// framer-motion reads requestAnimationFrame once, when it loads. jsdom has
// none, so without this its frame loop is a no-op and no motion value ever
// reaches the page. The queue is installed before the import for that reason.
const rafQueue = vi.hoisted(() => {
  const q = { frames: [] as FrameRequestCallback[] };
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
    q.frames.push(cb);
    return q.frames.length;
  };
  (globalThis as any).cancelAnimationFrame = () => {};
  return q;
});

// jsdom never lets framer-motion paint a motion value onto the element, so the
// bar's size is read from the value framer would paint: the last transform the
// bar builds (scroll scale x press pulse).
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
const barScale = () => painted.values[painted.values.length - 1].get() as number;

import BottomNav, { buildSkin, DEFAULT_NAV_THEME } from "components/NavigationDemo/BottomNav";

// Each of the five slots is 66px wide, side by side from x = 0. jsdom has no
// layout, so the slot the finger is over has to be given by hand.
const SLOT = 66;
let rectSpy: ReturnType<typeof vi.spyOn>;

// One animation-frame queue shared by the bar's scroll loop and framer-motion,
// driven by hand so the test decides when time passes.
let clock = 0;
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

const tab = (label: string) => screen.getByRole("button", { name: label });
const activeTab = () =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-current") === "page")?.getAttribute("aria-label");

describe("buildSkin", () => {
  it("builds a light glass from the measured colour", () => {
    const skin = buildSkin(DEFAULT_NAV_THEME);
    expect(skin.bar, "the default bar colour is wrong").toBe("rgba(246,246,246,0.84)");
    expect(skin.filter, "the default filter is wrong").toBe("blur(15px) saturate(180%)");
    expect(skin.ink, "a light bar needs dark icons").toBe("#0a0a0a");
  });

  it("reads a three-digit colour and turns the icons light on a dark bar", () => {
    const skin = buildSkin({ ...DEFAULT_NAV_THEME, color: " #000 " });
    expect(skin.bar, "a #rgb colour was not expanded").toBe("rgba(0,0,0,0.84)");
    expect(skin.ink, "a dark bar needs light icons").toBe("#fafafa");
    expect(skin.pill, "a dark bar needs a light pill").toBe("rgba(255,255,255,0.16)");
  });

  it("falls back to the measured grey for a colour it cannot read", () => {
    expect(buildSkin({ ...DEFAULT_NAV_THEME, color: "zzzzzz" }).bar, "bad hex was not replaced").toBe("rgba(246,246,246,0.84)");
    expect(buildSkin({ ...DEFAULT_NAV_THEME, color: "#12" }).bar, "short hex was not replaced").toBe("rgba(246,246,246,0.84)");
  });
});

describe("BottomNav", () => {
  beforeEach(() => {
    // Never drop a queued frame: framer-motion remembers that it asked for one
    // and would not ask again, freezing every motion value in the next test.
    // Run what the last test left behind until the loop goes quiet.
    for (let i = 0; i < 500 && rafQueue.frames.length; i++) runFrames(1);
    painted.values = [];
    clock = 0;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    rectSpy = vi.spyOn(HTMLLIElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLLIElement) {
      const index = Array.from(this.parentElement!.children).indexOf(this);
      return { left: index * SLOT, width: SLOT, top: 0, height: 53, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} } as DOMRect;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts on Home, with the red dot on Cart and Profile", () => {
    const { container } = render(<BottomNav />);
    expect(activeTab(), "the bar should open on Home").toBe("Home");
    expect(container.querySelectorAll('span[style*="rgb(255, 48, 64)"]').length, "Cart and Profile should each carry a dot").toBe(2);
  });

  it("moves the pick with the keyboard, and ignores other keys and the tab already picked", () => {
    render(<BottomNav />);
    fireEvent.keyDown(tab("Cart"), { key: "Enter" });
    expect(activeTab(), "Enter on Cart did not pick it").toBe("Cart");
    clock += 1000;
    fireEvent.keyDown(tab("Search"), { key: " " });
    expect(activeTab(), "Space on Search did not pick it").toBe("Search");
    fireEvent.keyDown(tab("Search"), { key: " " });
    expect(activeTab(), "picking the same tab again changed the pick").toBe("Search");
    fireEvent.keyDown(tab("Live"), { key: "a" });
    expect(activeTab(), "a letter key picked a tab").toBe("Search");
  });

  it("follows a finger that presses, slides and lifts", () => {
    const { container } = render(<BottomNav />);
    const list = container.querySelector("ul")!;
    fireEvent.pointerDown(list, { clientX: SLOT * 1 + 10 });
    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: SLOT * 1 + 20 }));
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: SLOT * 4 + 30 }));
    });
    expect(activeTab(), "the pick changed before the finger lifted").toBe("Home");
    act(() => {
      window.dispatchEvent(new MouseEvent("pointerup"));
    });
    expect(activeTab(), "lifting over Profile did not pick it").toBe("Profile");
  });

  it("keeps the pick when the press is cancelled over the tab already picked", () => {
    const { container } = render(<BottomNav />);
    fireEvent.pointerDown(container.querySelector("ul")!, { clientX: 5 });
    act(() => {
      window.dispatchEvent(new MouseEvent("pointercancel"));
    });
    expect(activeTab(), "a cancelled press over Home moved the pick").toBe("Home");
  });

  it("scales down while scrolling down and back to full size at the top", () => {
    render(<BottomNav theme={{ ...DEFAULT_NAV_THEME, speedEffect: 0 }} />);
    for (let y = 100; y <= 1200; y += 100) {
      scrollTo(y);
      runFrames(2);
    }
    runFrames(60);
    expect(barScale(), "the bar did not shrink to its smallest size while scrolling down").toBeCloseTo(0.72, 2);

    scrollTo(0);
    runFrames(80);
    expect(barScale(), "the bar did not return to full size at the top").toBeCloseTo(1, 2);
  });
});
