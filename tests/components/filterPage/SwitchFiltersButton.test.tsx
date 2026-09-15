// The dots at the edge of the filter window. Tapping them walks the shopper
// through the filter rows — categories, then brands, then colours, and so on —
// and wraps back to the first row after the last one.
//
// The component finds the rows by class name (`.scrollable-area-0`,
// `.scrollable-area-1`, …) and calls `scrollIntoView` on them, so a test has to
// put those rows on the page itself. That is also where its one bug was: a row
// that is not on the page answers null, and the call threw. The last group in
// this file is the guard against it coming back.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SwitchFiltersButton from "components/filterPage/SwitchFiltersButton";

import { act, renderWithProviders, userEvent } from "../../render";

/** The colour the component fills the dot for the row being looked at. */
const ACTIVE_DOT = "#505050";

/**
 * Put the filter rows on the page, the way the filter window does.
 *
 * The component reaches for them by class name, so without them every tap
 * throws. Each row records the calls made against it, so a test can say which
 * row the shopper was taken to.
 */
function placeFilterRows(count: number) {
  const scrolledInto: string[] = [];
  for (let i = 0; i < count; i++) {
    const row = document.createElement("div");
    row.className = `scrollable-area-${i}`;
    (row as any).scrollIntoView = () => scrolledInto.push(`row-${i}`);
    document.body.appendChild(row);
  }
  return scrolledInto;
}

/**
 * Which row each dot stands for, and whether it is the one being looked at.
 *
 * The fill sits on the wrapping `<g>`, not on the circles inside it — both of
 * those carry a `fill`/`stroke` of "none" and would answer "none" for every dot.
 */
function dotStates() {
  return Array.from(
    document.querySelectorAll('[data-pw="countFilters"] g[fill]'),
  ).map((group) => group.getAttribute("fill"));
}

const theDots = () =>
  document.querySelector('[data-pw="rightScrool"]') as HTMLElement;

describe("the filter window's row dots", () => {
  beforeEach(() => {
    // jsdom implements no scrolling at all, so the component's own root — which
    // it also scrolls — needs one too.
    (Element.prototype as any).scrollIntoView = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    document
      .querySelectorAll('[class^="scrollable-area-"]')
      .forEach((node) => node.remove());
  });

  it("draws one dot per filter row", async () => {
    placeFilterRows(3);
    await renderWithProviders(
      <SwitchFiltersButton length={3} language="en" />,
      { path: "/filters" },
    );

    expect(
      dotStates().length,
      "the dots are how the shopper knows how many filter rows there are, so there must be exactly one per row",
    ).toBe(3);
  });

  it("starts on the first row", async () => {
    placeFilterRows(3);
    await renderWithProviders(
      <SwitchFiltersButton length={3} language="en" />,
      { path: "/filters" },
    );

    expect(
      dotStates(),
      "the filter window opens on the first row, so the first dot must be the filled one — a filled dot somewhere else says the shopper is looking at a row they are not",
    ).toEqual([ACTIVE_DOT, "#fff", "#fff"]);
  });

  it("moves to the next row on a tap", async () => {
    const scrolledInto = placeFilterRows(3);
    await renderWithProviders(
      <SwitchFiltersButton length={3} language="en" />,
      { path: "/filters" },
    );

    await userEvent.click(theDots());

    expect(
      scrolledInto,
      "a tap must take the shopper to the next filter row — that is the only thing this control does",
    ).toEqual(["row-1"]);
    expect(
      dotStates(),
      "and the filled dot must move with them, or the dots stop describing where they are",
    ).toEqual(["#fff", ACTIVE_DOT, "#fff"]);
  });

  it("keeps walking forward on each further tap", async () => {
    const scrolledInto = placeFilterRows(3);
    await renderWithProviders(
      <SwitchFiltersButton length={3} language="en" />,
      { path: "/filters" },
    );

    await userEvent.click(theDots());
    await userEvent.click(theDots());

    expect(
      scrolledInto,
      "two taps must reach the third row, not stall on the second",
    ).toEqual(["row-1", "row-2"]);
    expect(
      dotStates(),
      "the last dot is the one being looked at after two taps from the first row",
    ).toEqual(["#fff", "#fff", ACTIVE_DOT]);
  });

  it("wraps back to the first row after the last one", async () => {
    const scrolledInto = placeFilterRows(3);
    await renderWithProviders(
      <SwitchFiltersButton length={3} language="en" />,
      { path: "/filters" },
    );

    await userEvent.click(theDots());
    await userEvent.click(theDots());
    await userEvent.click(theDots());

    expect(
      scrolledInto,
      "the control is a loop — tapping past the last row must return to the first, not run off the end into a row that does not exist",
    ).toEqual(["row-1", "row-2", "row-0"]);
    expect(
      dotStates(),
      "and the filled dot must come back to the start with it",
    ).toEqual([ACTIVE_DOT, "#fff", "#fff"]);
  });

  it("wraps straight away when there is only one filter row", async () => {
    const scrolledInto = placeFilterRows(1);
    await renderWithProviders(
      <SwitchFiltersButton length={1} language="en" />,
      { path: "/filters" },
    );

    await userEvent.click(theDots());

    expect(
      scrolledInto,
      "with a single row the first row is also the last, so a tap must wrap to itself rather than reach for a second row that was never drawn",
    ).toEqual(["row-0"]);
  });

  // -------------------------------------------------------------------------
  // A filter row the component cannot find is a reason to do nothing, not a
  // reason to fail.
  //
  // The rows are found by class name through `document.querySelector`, which
  // answers null for a row that is not on the page — a row still streaming in,
  // or a `length` that does not match the rows actually drawn. Calling
  // `.scrollIntoView()` on that null threw a TypeError out of the click handler,
  // which React reports to the page: the tap did nothing the shopper could see
  // and left an uncaught error behind it.
  describe("a filter row that is not on the page", () => {
    /** Tap the dots and hand back anything React reported to the page. */
    function tapAndCatchErrors() {
      const reported: unknown[] = [];
      const catchIt = (event: ErrorEvent) => {
        reported.push(event.error);
        event.preventDefault();
      };
      window.addEventListener("error", catchIt);
      // Wrapped so React has flushed the new dot before the test reads it. A
      // bare click leaves the re-render pending and the dots look unmoved.
      act(() => {
        theDots().click();
      });
      window.removeEventListener("error", catchIt);
      return reported;
    }

    it("does not throw when the row the dots point at was never drawn", async () => {
      // Only two rows exist, but the window says there are three.
      placeFilterRows(2);
      await renderWithProviders(
        <SwitchFiltersButton length={3} language="en" />,
        { path: "/filters" },
      );

      // Walk to the dot that points at the row which was never drawn.
      await userEvent.click(theDots());

      expect(
        tapAndCatchErrors(),
        "a row that is not on the page is nothing to scroll to; throwing out of the click handler leaves an uncaught error on a tap the shopper cannot tell failed",
      ).toEqual([]);
    });

    it("still moves the filled dot on, so the next tap is not stuck on the same row", async () => {
      placeFilterRows(2);
      await renderWithProviders(
        <SwitchFiltersButton length={3} language="en" />,
        { path: "/filters" },
      );

      await userEvent.click(theDots());
      tapAndCatchErrors();

      // The first tap moved from row 0 to row 1. The second reaches for row 2,
      // which was never drawn — advancing means landing on it anyway.
      expect(
        dotStates(),
        "the dots are a loop; a tap that cannot scroll must still advance, or a single missing row traps the shopper on it for every further tap",
      ).toEqual(["#fff", "#fff", ACTIVE_DOT]);
    });

    it("does not throw when no filter rows have been drawn at all", async () => {
      await renderWithProviders(
        <SwitchFiltersButton length={2} language="en" />,
        { path: "/filters" },
      );

      expect(
        tapAndCatchErrors(),
        "the rows stream in after the window opens, so an early tap finds none of them — that is a normal moment, not a failure",
      ).toEqual([]);
    });
  });
});
