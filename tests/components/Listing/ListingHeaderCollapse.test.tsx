// The boutique banner at the top of a listing folds away as the shopper scrolls
// down, so the sticky filter bar is not sitting on top of a tall header.
//
// It watches a sentinel element rather than scroll position, and there is one
// rule in it that is easy to lose: while the filter window is open, the header
// must not move at all. Opening the filter window changes the page height, which
// moves the sentinel, which would fold or unfold the header underneath an
// overlay the shopper is reading. The freeze is read through a ref so the
// observer, which is created once, always sees the current answer — rebuilding
// the observer on every change would reset the collapsed state with it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ListingHeaderCollapse from "components/Listing/ListingHeaderCollapse";
import { useAppStore } from "store";

import { act, renderWithProviders, screen } from "../../render";

/** The observer callbacks that are currently watching a sentinel. */
let watchers: ((entries: any[]) => void)[] = [];

/** Tell every watcher whether the sentinel is on screen. */
function reportSentinel(isIntersecting: boolean) {
  act(() => {
    watchers.forEach((watch) => watch([{ isIntersecting }]));
  });
}

async function renderHeader() {
  return renderWithProviders(
    <ListingHeaderCollapse
      filterBar={<div>the filter bar</div>}
      banner={<div>the boutique banner</div>}
      categoryFilters={<div>the category filters</div>}
      productList={<div>the products</div>}
    />,
    { path: "/filters/boutique/blue-boutique" },
  );
}

/** Whether the header is currently folded away. */
const isCollapsed = () =>
  document.querySelector(".listing-header")?.getAttribute("data-collapsed");

describe("the listing header that folds away on scroll", () => {
  beforeEach(() => {
    watchers = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: any[]) => void) {
          watchers.push(callback);
        }
        observe() {}
        disconnect() {
          watchers = watchers.filter(() => false);
        }
        unobserve() {}
        takeRecords() {
          return [];
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts open, with the banner showing", async () => {
    await renderHeader();

    expect(
      isCollapsed(),
      "a listing opens at the top of the page, where there is room for the boutique's banner",
    ).toBe("false");
  });

  it("keeps every part of the header on the page", async () => {
    await renderHeader();

    expect(
      screen.getByText("the filter bar"),
      "the filter bar is sticky and must be on the page whether the header is folded or not",
    ).toBeInTheDocument();
    expect(
      screen.getByText("the category filters"),
      "the category filters stay visible — only the banner folds away",
    ).toBeInTheDocument();
    expect(
      screen.getByText("the products"),
      "the grid is rendered inside the header so the sticky bar's containing block runs the whole length of the scroll",
    ).toBeInTheDocument();
  });

  it("folds away once the banner has scrolled under the pinned bar", async () => {
    await renderHeader();

    reportSentinel(false);

    expect(
      isCollapsed(),
      "once the banner is behind the pinned bar it is only taking up room, so the header folds and gives the grid the screen",
    ).toBe("true");
  });

  it("opens again when the shopper scrolls back to the top", async () => {
    await renderHeader();

    reportSentinel(false);
    reportSentinel(true);

    expect(
      isCollapsed(),
      "scrolling back to the top must bring the banner back — a header that folds once and never returns hides the boutique for the rest of the visit",
    ).toBe("false");
  });

  it("does not move while the filter window is open", async () => {
    await renderHeader();
    act(() => {
      useAppStore.getState().setFilterEnabled(true);
    });

    reportSentinel(false);

    expect(
      isCollapsed(),
      "opening the filter window changes the page height and moves the sentinel; letting that fold the header reshuffles the page underneath an overlay the shopper is reading",
    ).toBe("false");
  });

  it("starts moving again once the filter window is closed", async () => {
    await renderHeader();
    act(() => {
      useAppStore.getState().setFilterEnabled(true);
    });
    reportSentinel(false);
    act(() => {
      useAppStore.getState().setFilterEnabled(false);
    });

    reportSentinel(false);

    expect(
      isCollapsed(),
      "the freeze lasts only as long as the filter window; the header must answer the sentinel again afterwards, which is what the ref is for — rebuilding the observer instead would reset the folded state with it",
    ).toBe("true");
  });
});
