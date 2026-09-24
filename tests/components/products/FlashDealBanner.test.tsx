// The "Flash Deal" countdown badge on a product. It counts down to the end of
// the deal's last day, ticks only while on screen and while the tab is
// visible, and disappears once the deal is over. jsdom has no
// IntersectionObserver, so a hand-driven one is used here.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FlashDealBanner from "components/products/FlashDealBanner";

import { act, renderWithProviders, screen } from "../../render";

let observerCallback: (entries: any[]) => void = () => {};
const disconnect = vi.fn();
class FakeObserver {
  constructor(cb: any) {
    observerCallback = cb;
  }
  observe() {}
  disconnect() {
    disconnect();
  }
}

const time = () => document.querySelector('[data-pw="flash-deal-banner-time"]')?.textContent;
const setHidden = (hidden: boolean) =>
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });

describe("FlashDealBanner", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    vi.useFakeTimers({ now: new Date(2030, 0, 1, 23, 59, 50) });
    setHidden(false);
    disconnect.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setHidden(false);
  });

  it("counts down to the end of the deal day while on screen", async () => {
    const { unmount } = await renderWithProviders(<FlashDealBanner end_data="2030-01-02" language="en" />);
    expect(screen.getByText("Flash Deal"), "the badge is missing").toBeInTheDocument();
    expect(screen.getByText("| 01 d |"), "the days left are wrong").toBeInTheDocument();
    expect(time(), "the start time is wrong").toBe("00:00:09");

    // Off screen: no ticking.
    act(() => vi.advanceTimersByTime(3000));
    expect(time(), "the badge ticked while off screen").toBe("00:00:09");

    act(() => observerCallback([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(2000));
    expect(time(), "the badge did not tick on screen").toBe("00:00:04");
    // A second "visible" report does not start a second clock.
    act(() => observerCallback([{ isIntersecting: true }]));

    // Tab hidden: ticking stops.
    setHidden(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(2000));
    expect(time(), "the badge ticked in a hidden tab").toBe("00:00:04");

    unmount();
    expect(disconnect, "the observer was not disconnected").toHaveBeenCalled();
  });

  it("disappears once the deal is over, and sits on the right in Arabic", async () => {
    const { container } = await renderWithProviders(<FlashDealBanner end_data="2029-12-31" language="ar" />);
    expect(container.innerHTML, "an ended deal still shows a badge").toBe("");

    const live = await renderWithProviders(<FlashDealBanner end_data="2030-01-05" language="ar" top="top-0" />);
    const badge = live.container.querySelector('[data-pw="flash-deal-banner"]') as HTMLElement;
    expect(badge.className, "the Arabic badge is not on the right").toContain("right-0");
    expect(badge.className, "the given top is not used").toContain("top-0");
  });
});
