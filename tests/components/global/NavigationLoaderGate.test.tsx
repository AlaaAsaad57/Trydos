// Whether the navigation loader runs the overlay scroll handling (AC-11).
//
// WHAT THIS IS ABOUT
// `NavigationLoaderGate` hides the real page and shows a loader. It also called
// `enterOverlay` for EVERY navigation, and `enterOverlay` ends in
// `window.scrollTo(0, 0)`. That is right for an intercepted overlay and wrong
// for an ordinary page: the seller dashboard is an ordinary nested page —
// overlayScroll.ts names that exact route as not an intercept — so pressing back
// into it threw the scroll position away.
//
// WHY THE RULE IS OPT-IN AND NOT A GUESS
// At the moment this runs, `pathname` is still the page being LEFT, not the
// destination, and eight call sites set `isNavigating` without going through
// NextLink. There is no reliable record of where a given navigation is heading.
// So the gate skips only when the navigation itself says to. Anything unknown
// keeps today's behaviour — the third case below is the one that pins that, and
// it is the one that would catch this change breaking an overlay journey.
//
// Modelling note: jsdom's `window.scrollTo` throws "not implemented", so the
// position is modelled here the same way tests/components/ModalRoute/overlayScroll.test.ts
// models it.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, waitFor } from "@testing-library/react";

import NavigationLoaderGate from "components/global/NavigationLoaderGate";
import { useAppStore } from "store";

let position = 0;

beforeEach(() => {
  vi.resetModules();
  position = 0;
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => position,
  });
  window.scrollTo = ((_x: number, y: number) => {
    position = y;
  }) as typeof window.scrollTo;
  useAppStore.setState({ isNavigating: null });
});

/** Put the window part-way down a long page, the way a seller browsing a list is. */
const parkScrolledDown = () => {
  position = 4200;
};

const renderGate = () =>
  render(
    <NavigationLoaderGate>
      <p>the real page</p>
    </NavigationLoaderGate>,
  );

describe("the navigation loader gate and the window scroll", () => {
  it("leaves the scroll alone when the navigation says it is not an overlay (AC-11)", async () => {
    parkScrolledDown();
    renderGate();

    // What useDashboardDetailBack sets on the back journey.
    useAppStore.setState({
      isNavigating: { is_seller_dashboard: true, no_overlay_scroll: true },
    });

    await waitFor(() => {
      if (!document.querySelector('[data-pw="seller-dashboard-loader"]')) {
        throw new Error("the loader has not appeared yet");
      }
    });

    expect(
      position,
      `pressing back into the seller dashboard moved the window from 4200 to ${position}; the dashboard is an ordinary page and overlay scroll handling must not run for it`,
    ).toBe(4200);
  });

  it("still runs the overlay scroll handling when the navigation says nothing (AC-11)", async () => {
    parkScrolledDown();
    renderGate();

    // Any of the eight call sites that set the flag without a destination we can
    // classify — a search, a notification, place-order, a product back button.
    useAppStore.setState({ isNavigating: { is_boutique: true } });

    await waitFor(() => {
      if (position === 4200) throw new Error("the gate has not run yet");
    });

    expect(
      position,
      "a navigation that did not opt out stopped being scrolled to the top; skipping on anything but an explicit opt-out costs an overlay its base scroll and lands the seller at the top when they back out",
    ).toBe(0);
  });

  it("hides the real page while the loader is up, and brings it back after", async () => {
    const { container } = renderGate();

    expect(
      container.textContent,
      "the real page was not on screen before any navigation started",
    ).toContain("the real page");

    useAppStore.setState({
      isNavigating: { is_seller_dashboard: true, no_overlay_scroll: true },
    });

    await waitFor(() => {
      if (!document.querySelector('[data-pw="seller-dashboard-loader"]')) {
        throw new Error("the loader has not appeared yet");
      }
    });

    const slot = container.querySelector('div[style*="display"]');
    expect(
      slot?.getAttribute("style"),
      "the real page slot was not hidden while the loader was up, so both would be on screen at once",
    ).toContain("display: none");

    useAppStore.setState({ isNavigating: null });

    await waitFor(() => {
      if (document.querySelector('[data-pw="seller-dashboard-loader"]')) {
        throw new Error("the loader is still up");
      }
    });

    expect(
      container.textContent,
      "the real page did not come back once the navigation finished — the destination's own clearer ran and the page stayed hidden",
    ).toContain("the real page");
  });
});
