// The main-category bar. When the categories do not fit, arrows appear on the
// side(s) the shopper can still scroll to — mirrored in Arabic and Kurdish,
// where the browser counts scroll position from the right.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NavbarServer from "components/Server/Navbar";

import { fireEvent, renderWithProviders, screen } from "../../render";

class RecordingResizeObserver {
  static disconnects = 0;
  constructor(public cb: () => void) {}
  observe() {}
  disconnect() {
    RecordingResizeObserver.disconnects++;
  }
}

const bar = () => document.getElementById("categories-bar-container") as HTMLElement;

/** Give the bar a size and a scroll position, then tell it that it scrolled. */
function scrollTo(scrollLeft: number, scrollWidth = 1000, clientWidth = 400) {
  Object.defineProperty(bar(), "scrollWidth", { value: scrollWidth, configurable: true });
  Object.defineProperty(bar(), "clientWidth", { value: clientWidth, configurable: true });
  Object.defineProperty(bar(), "scrollLeft", { value: scrollLeft, configurable: true, writable: true });
  fireEvent.scroll(bar());
}

const arrow = (side: "left" | "right") =>
  document.querySelector(`[aria-label="Scroll categories ${side}"]`) as HTMLElement;
const shows = (side: "left" | "right") => arrow(side).getAttribute("aria-hidden") === "false";

const renderBar = (lang = "sy-en", store: Record<string, any> = {}) =>
  renderWithProviders(
    <NavbarServer lang={lang} mainCategory="women" categoriesData={[{ slug: "men" }, { slug: "women" }]}>
      <a href="/x">
        <span>Men</span>
      </a>
    </NavbarServer>,
    { store },
  );

describe("the main-category bar", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", RecordingResizeObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows no arrows when the categories fit", async () => {
    await renderBar();
    scrollTo(0, 400, 400);
    expect(shows("left"), "no left arrow when everything fits").toBe(false);
    expect(shows("right"), "no right arrow when everything fits").toBe(false);
  });

  it("left to right: shows the right arrow at the start and the left arrow at the end", async () => {
    await renderBar();
    scrollTo(0);
    expect(shows("right"), "at the start there is more to the right").toBe(true);
    expect(shows("left"), "at the start there is nothing to the left").toBe(false);
    scrollTo(600);
    expect(shows("left"), "at the end there is more to the left").toBe(true);
    expect(shows("right"), "at the end there is nothing to the right").toBe(false);
  });

  it("right to left: counts from the right edge", async () => {
    await renderBar("sy-ar", {});
    scrollTo(0);
    expect(shows("left"), "in Arabic the start is on the right, so more is to the left").toBe(true);
    expect(shows("right"), "in Arabic nothing is to the right at the start").toBe(false);
    scrollTo(-600);
    expect(shows("right"), "at the far left end, more is to the right").toBe(true);
    expect(bar().className, "the bar should be reversed in Arabic").toContain("flex-row-reverse");
  });

  it("scrolls by 200px when an arrow is tapped", async () => {
    await renderBar();
    const scrollBy = vi.fn();
    bar().scrollBy = scrollBy as any;
    fireEvent.click(arrow("left"));
    fireEvent.click(arrow("right"));
    expect(scrollBy.mock.calls.map(([o]) => o.left), "the arrows should scroll 200px each way").toEqual([-200, 200]);
  });

  it("does nothing when an arrow is tapped after the bar is gone", async () => {
    await renderBar();
    const left = arrow("left");
    bar().remove();
    expect(() => fireEvent.click(left), "tapping an arrow with no bar must not throw").not.toThrow();
  });

  it("hides the arrows while search is open, and lets category links be clicked", async () => {
    await renderBar("sy-en", { enable_search: true });
    expect(arrow("left").parentElement?.className, "the arrows should hide while search is open").toContain("hidden");
    expect(() => fireEvent.click(screen.getByText("Men")), "a click on a category link must go through").not.toThrow();
    fireEvent.click(bar());
  });

  it("stops listening when it leaves the page", async () => {
    RecordingResizeObserver.disconnects = 0;
    const { unmount } = await renderBar();
    unmount();
    expect(RecordingResizeObserver.disconnects, "the size watcher should be stopped on unmount").toBe(1);
  });
});
