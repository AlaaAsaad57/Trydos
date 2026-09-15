// The listing sort widget. It maps the seven sort keys the backend understands
// onto five human choices, and it is select-then-confirm: tapping a row stages a
// draft and nothing moves until Confirm is pressed.
//
// TWO THINGS HERE ARE EASY TO BREAK AND EXPENSIVE WHEN BROKEN.
//
// 1. Confirm writes the URL with `window.history.pushState`, NOT `router.push`.
//    `useSearchParams` reflects a pushState synchronously with no server round
//    trip, so the grid sees the new `?sort=` at once and paints its skeletons.
//    With `router.push` the whole swap waits behind the server, and the skeleton
//    only appears as the sorted results are already landing. A test that only
//    checked "the sort was applied" would pass either way, so this file asserts
//    the router was NOT used.
//
// 2. The default order is the absence of `?sort=`, not `?sort=relevance`.
//    Writing the word would send the backend a key it does not know.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ListingSortControl from "components/Listing/ListingSortControl";
import { routerSpies } from "tests/mocks/nextNavigation";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

/** Put the widget on a listing page, with whatever query string is under test. */
async function renderSortControl(search = "") {
  return renderWithProviders(<ListingSortControl language="en" />, {
    path: "/filters",
    search,
  });
}

const openTheSheet = async () => {
  await userEvent.click(screen.getByRole("button", { name: /^Sort products/ }));
};

const confirmButton = () => screen.getByRole("button", { name: "Confirm" });
const resetButton = () => screen.getByRole("button", { name: "Reset" });

/** What the browser's address bar holds now. */
const currentUrl = () => window.location.pathname + window.location.search;

describe("the listing sort widget", () => {
  beforeEach(() => {
    vi.spyOn(window.history, "pushState");
  });

  describe("what it says is selected", () => {
    it("names the default order when the page carries no sort", async () => {
      await renderSortControl();

      expect(
        screen.getByRole("button", { name: "Sort products — Default" }),
        "with no `?sort=` in the address the listing is in its default order, and the trigger's label is the only place a screen reader is told which order that is",
      ).toBeInTheDocument();
    });

    it("names the applied order when the page carries one", async () => {
      await renderSortControl("sort=price_asc");

      expect(
        screen.getByRole("button", {
          name: "Sort products — Price: Low to High",
        }),
        "a shared cheapest-first link must announce cheapest-first, not the default",
      ).toBeInTheDocument();
    });

    it("falls back to the default order when the sort in the address is not one the backend knows", async () => {
      await renderSortControl("sort=cheapest");

      expect(
        screen.getByRole("button", { name: "Sort products — Default" }),
        "a hand-edited or stale `?sort=` value must fall back to the default order rather than being passed to the backend as a key it does not know",
      ).toBeInTheDocument();
    });

    it("marks the applied order as chosen when the sheet opens", async () => {
      await renderSortControl("sort=name_desc");
      await openTheSheet();

      expect(
        screen.getByRole("radio", { name: "Name: Z to A" }),
        "the sheet must open showing what is actually applied, so the shopper can see the current order before changing it",
      ).toBeChecked();
    });
  });

  describe("select, then confirm", () => {
    it("does not change the address when a row is only tapped", async () => {
      await renderSortControl();
      await openTheSheet();

      await userEvent.click(
        screen.getByRole("radio", { name: "Price: High to Low" }),
      );

      expect(
        window.location.search,
        "tapping a row only stages a draft — the listing must not reorder under the shopper before they press Confirm",
      ).toBe("");
      expect(
        screen.getByRole("radio", { name: "Price: High to Low" }),
        "the tapped row must show as staged, otherwise the shopper cannot tell their tap registered",
      ).toBeChecked();
    });

    it("writes the chosen sort to the address when Confirm is pressed", async () => {
      await renderSortControl();
      await openTheSheet();

      await userEvent.click(
        screen.getByRole("radio", { name: "Price: Low to High" }),
      );
      await userEvent.click(confirmButton());

      expect(
        currentUrl(),
        "Confirm must put the chosen sort in the address, because `?sort=` is what makes the order server-rendered and shareable",
      ).toBe("/gb-en/filters?sort=price_asc");
    });

    it("removes the sort from the address instead of writing the word for the default order", async () => {
      await renderSortControl("sort=best_selling");
      await openTheSheet();

      await userEvent.click(screen.getByRole("radio", { name: /Default/ }));
      await userEvent.click(confirmButton());

      expect(
        currentUrl(),
        "the default order is the absence of `?sort=`; writing `sort=relevance` would send the backend a key it does not know",
      ).toBe("/gb-en/filters");
    });

    it("keeps the rest of the query string when it writes the sort", async () => {
      await renderSortControl("search=blue+shirt");
      await openTheSheet();

      await userEvent.click(screen.getByRole("radio", { name: "Name: A to Z" }));
      await userEvent.click(confirmButton());

      expect(
        window.location.search,
        "sorting must not throw away the shopper's search — dropping `?search=` here would silently widen the listing back to everything",
      ).toContain("search=blue+shirt");
      expect(
        window.location.search,
        "and the chosen sort must be there alongside it",
      ).toContain("sort=name_asc");
    });

    it("closes the sheet on Confirm", async () => {
      await renderSortControl();
      await openTheSheet();

      await userEvent.click(screen.getByRole("radio", { name: /Best sellers/ }));
      await userEvent.click(confirmButton());

      expect(
        screen.queryByRole("dialog", { name: "Sort products" }),
        "the sheet must close once the sort is applied, or it covers the results the shopper just asked to see",
      ).not.toBeInTheDocument();
    });

    it("offers no Confirm to press while the draft still matches what is applied", async () => {
      await renderSortControl("sort=newest");
      await openTheSheet();

      expect(
        confirmButton(),
        "confirming the order that is already applied would be a navigation that changes nothing, so the button stays disabled until the draft differs",
      ).toBeDisabled();
    });
  });

  describe("the address is changed without the router", () => {
    it("uses the history API, so the grid can swap to skeletons with no server round trip", async () => {
      await renderSortControl();
      await openTheSheet();

      await userEvent.click(screen.getByRole("radio", { name: /Best sellers/ }));
      await userEvent.click(confirmButton());

      expect(
        window.history.pushState,
        "`useSearchParams` reflects a pushState synchronously, which is what lets the grid paint its skeletons the moment Confirm is pressed",
      ).toHaveBeenCalled();
      expect(
        routerSpies.push,
        "router.push would commit the address through the server first, so the skeleton would only appear as the sorted results were already landing — the bug this widget was changed to fix",
      ).not.toHaveBeenCalled();
      expect(
        routerSpies.replace,
        "router.replace has the same server round trip as push and must not be used here either",
      ).not.toHaveBeenCalled();
    });
  });

  describe("Reset", () => {
    it("stages the default order without changing the address", async () => {
      await renderSortControl("sort=price_desc");
      await openTheSheet();

      await userEvent.click(resetButton());

      expect(
        screen.getByRole("radio", { name: /Default/ }),
        "Reset stages the default order like any other row, so the shopper can still change their mind before confirming",
      ).toBeChecked();
      expect(
        window.location.search,
        "Reset must not navigate on its own — it stages, and Confirm applies",
      ).toBe("?sort=price_desc");
    });

    it("cannot be pressed when the draft is already the default order", async () => {
      await renderSortControl();
      await openTheSheet();

      expect(
        resetButton(),
        "there is nothing to reset when the draft is already the default order",
      ).toBeDisabled();
    });
  });

  describe("a dismissed sheet", () => {
    // NOTE FOR THE NEXT READER. Escape does not close the sheet at once:
    // BottomSheet plays a 400ms slide-out and calls `onClose` on a timer at the
    // end of it. Reopening straight after the key press therefore clicks the
    // trigger while the sheet is still open, which does nothing — the draft then
    // looks like it survived, and the component gets blamed for a wait the test
    // forgot. Wait for the sheet to actually go before reopening.
    it("throws the draft away, so reopening shows what is really applied", async () => {
      await renderSortControl("sort=newest");
      await openTheSheet();

      // Stage something else, then dismiss without confirming.
      await userEvent.click(
        screen.getByRole("radio", { name: "Price: Low to High" }),
      );
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () =>
          expect(
            screen.queryByRole("dialog", { name: "Sort products" }),
            "Escape should close the sheet once its slide-out has played",
          ).not.toBeInTheDocument(),
        { timeout: 2000 },
      );
      await openTheSheet();

      expect(
        screen.getByRole("radio", { name: "New arrivals: Newest" }),
        "the applied sort is newest-first, so that is the row the reopened sheet must show as chosen — not the draft that was walked away from",
      ).toBeChecked();
      expect(
        screen.getByRole("radio", { name: "Price: Low to High" }),
        "the abandoned draft must not survive the sheet being dismissed",
      ).not.toBeChecked();
    });
  });
});
