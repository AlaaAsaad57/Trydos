// @vitest-environment node
//
// The seller dashboard's product-grid walk — the cases the environment cannot
// produce yet.
//
// **Why this file exists at all.** The QA shop has one product, so the live
// grid is always one page, no pagination control is drawn, and the browser case
// for `AC-11` finds the card without ever taking a step. It would report
// "found by walking the pages" having walked none. These cases are what make
// that criterion honest before a later ticket adds a second product.
//
// **Why it is outside `tests/e2e/`.** The unit project excludes `tests/e2e/**`
// from test discovery, so a spec file there would never run in `pnpm test:run`
// — which is the only suite that gates a pull request. Importing *from* there
// is fine, and `gridWalk.ts` deliberately imports no Playwright so it can be
// loaded here.

import { describe, expect, it } from "vitest";

import {
  nextWalkStep,
  pageCount,
  walkedSentence,
} from "../e2e/harness/gridWalk";

describe("the product-grid walk decides where to go next", () => {
  it("stops on the page holding the card, and says which page that was", () => {
    const step = nextWalkStep({ current: 1, last: 1, foundHere: true });

    expect(
      step.action,
      "the card was on the page being looked at, so the walk should have stopped rather than asking for another page",
    ).toBe("found");
    expect(
      step.action === "found" ? step.page : null,
      "the walk stopped but reported the wrong page as the one holding the card",
    ).toBe(1);
  });

  it("gives up after the only page when the card is not there", () => {
    const step = nextWalkStep({ current: 1, last: 1, foundHere: false });

    expect(
      step.action,
      "a one-page list with no card should be exhausted, not asked for a second page that does not exist",
    ).toBe("exhausted");
    expect(
      step.action === "exhausted" ? step.walked : null,
      "the walk gave up but reported the wrong number of pages looked at",
    ).toBe(1);
  });

  it("walks page by page and finds a card sitting on the last one", () => {
    // Four pages, card on page 4. Driven the way the action drives it.
    const visited: number[] = [];
    let current = 1;

    for (let guard = 0; guard < 10; guard += 1) {
      visited.push(current);
      const step = nextWalkStep({ current, last: 4, foundHere: current === 4 });
      if (step.action === "found") break;
      expect(
        step.action,
        `the walk gave up on page ${current} of 4, before reaching the page the card is on`,
      ).toBe("next");
      current = step.action === "next" ? step.to : current;
    }

    expect(
      visited,
      "the walk did not visit every page in order up to the one holding the card",
    ).toEqual([1, 2, 3, 4]);
  });

  it("reports exhaustion after the last page when no page holds the card", () => {
    const step = nextWalkStep({ current: 3, last: 3, foundHere: false });

    expect(
      step.action,
      "the walk was on the last page with no card, so it should be exhausted rather than asking for page 4",
    ).toBe("exhausted");
    expect(
      step.action === "exhausted" ? step.of : null,
      "the walk gave up but reported the wrong total page count",
    ).toBe(3);
  });

  it("keeps walking when the list grows a page mid-walk", () => {
    // The grid re-reads `last_page` on every page load, so a product added by
    // another ticket while the walk is running moves the target.
    const step = nextWalkStep({ current: 2, last: 5, foundHere: false });

    expect(
      step.action,
      "the list reported five pages and the walk was on page two, so it should have asked for the next page",
    ).toBe("next");
    expect(
      step.action === "next" ? step.to : null,
      "the walk continued but asked for the wrong page number",
    ).toBe(3);
  });

  it("treats a list with no pagination control as a single page", () => {
    // `Pagination` renders only when `last_page > 1`, so a one-page grid gives
    // the action nothing to read and `last` arrives undefined. Reading that as
    // "unbounded" would press a control that is not on the screen.
    expect(
      pageCount(undefined),
      "a grid that drew no pagination control was not read as a single page",
    ).toBe(1);
    expect(
      pageCount(0),
      "a page count of zero was not read as a single page",
    ).toBe(1);

    const step = nextWalkStep({ current: 1, foundHere: false });
    expect(
      step.action,
      "with no pagination control the walk should be exhausted after one page, not asking for a second",
    ).toBe("exhausted");
  });

  it("writes the walked-pages sentence a failure carries", () => {
    expect(
      walkedSentence(3, 7),
      "the failure sentence did not name both how far the walk got and how far it could have gone",
    ).toBe("walked 3 of 7 pages");
    expect(
      walkedSentence(1, 1),
      "the one-page failure sentence should read as a single page, not as plural pages",
    ).toBe("walked 1 of 1 page");
  });
});
