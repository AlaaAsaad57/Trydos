// The filter button in the listing bar. It opens and closes the filter window.
//
// The part worth a test is not the toggle — it is the scroll lock that travels
// with it. The filter window is a full-screen overlay; if the page underneath
// keeps scrolling, a drag inside the window scrolls the listing behind it and
// the shopper loses their place. So opening must lock the page and closing must
// release it, and the two must never drift apart.
import { describe, expect, it, vi } from "vitest";

import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import { useAppStore } from "store";

import { renderWithProviders, userEvent } from "../../render";

const DisableScroll = vi.fn();
const EnableScroll = vi.fn();

vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  DisableScroll: (...args: any[]) => DisableScroll(...args),
  EnableScroll: (...args: any[]) => EnableScroll(...args),
}));

/** Put the button on the page with the filter window already open, or not. */
async function renderButton(filterEnabled: boolean) {
  await renderWithProviders(<FilterBoutiquePageButton />, {
    store: { filterEnabled },
    path: "/filters",
  });
}

const theButton = () =>
  document.querySelector('[data-pw="filter-widget-button"]') as HTMLElement;

describe("the listing's filter button", () => {
  it("opens the filter window when it is closed", async () => {
    await renderButton(false);
    DisableScroll.mockClear();
    EnableScroll.mockClear();

    await userEvent.click(theButton());

    expect(
      useAppStore.getState().filterEnabled,
      "tapping the filter button on a listing with no filter window open must open it",
    ).toBe(true);
  });

  it("locks the page behind the filter window as it opens", async () => {
    await renderButton(false);
    DisableScroll.mockClear();
    EnableScroll.mockClear();

    await userEvent.click(theButton());

    expect(
      DisableScroll,
      "the filter window is a full-screen overlay — leaving the listing behind it scrollable means a drag inside the window moves the listing and the shopper loses their place",
    ).toHaveBeenCalled();
    expect(
      EnableScroll,
      "the page must not be released at the same moment it is locked, or the lock does nothing",
    ).not.toHaveBeenCalled();
  });

  it("closes the filter window when it is open", async () => {
    await renderButton(true);
    DisableScroll.mockClear();
    EnableScroll.mockClear();

    await userEvent.click(theButton());

    expect(
      useAppStore.getState().filterEnabled,
      "the same button closes the window again — it is a toggle, not an open-only control",
    ).toBe(false);
  });

  it("releases the page again as the filter window closes", async () => {
    await renderButton(true);
    DisableScroll.mockClear();
    EnableScroll.mockClear();

    await userEvent.click(theButton());

    expect(
      EnableScroll,
      "a lock that is never released leaves the whole listing frozen after the filter window has gone — the page would look fine and simply refuse to scroll",
    ).toHaveBeenCalled();
    expect(
      DisableScroll,
      "closing must not lock the page as well, or the release is undone in the same click",
    ).not.toHaveBeenCalled();
  });
});
