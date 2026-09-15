// The bar at the bottom of the filter window: "Search (Total Products: 42)" and
// "Reset".
//
// The Search button is where every chip the shopper tapped and every drag of the
// price slider finally becomes an address. Nothing has been applied until it is
// pressed, so a filter this link forgets is a filter the shopper chose and never
// got.
//
// A NOTE ON THE URL BUILDER. This file carries its own private copy of
// `buildParamsFromFilters`, separate from the one in `utils/server/helpers.ts`,
// and the two are NOT the same: this copy also knows about `search`, and it
// writes a price band as one dash-joined token. So the shared helper's tests say
// nothing about this button, and this file cannot lean on them.
import { describe, expect, it, vi } from "vitest";

import FiltersButton from "components/ListingPage/filterComponents/FiltersWindow/FiltersButton";
import { useAppStore } from "store";

import { renderWithProviders, screen, userEvent } from "../../../../render";

const NOTHING_CHOSEN = {
  categories: [],
  brands: [],
  colors: [],
  sizes: [],
  boutiques: [],
  prices: [],
  search_text: "",
};

async function renderBar({
  filters = {},
  isChanged = true,
  loading = false,
  total_size = 42,
  isFeatured = false,
  isFlashDeal = false,
  onReset = vi.fn(),
}: Record<string, any> = {}) {
  await renderWithProviders(
    <FiltersButton
      filters={{ ...NOTHING_CHOSEN, ...filters }}
      isChanged={isChanged}
      loading={loading}
      total_size={total_size}
      isFeatured={isFeatured}
      isFlashDeal={isFlashDeal}
      onReset={onReset}
    />,
    { path: "/filters", store: { filterEnabled: true } },
  );
  return { onReset };
}

const applyLink = () =>
  document.querySelector('[data-pw="searchTotalProduct"]');
const resetButton = () =>
  document.querySelector('[data-pw="reset-filter-button"]') as HTMLElement;

describe("the filter window's bottom bar", () => {
  describe("the address the Search button applies", () => {
    it("carries a chosen category", async () => {
      await renderBar({ filters: { categories: ["shoes"] } });

      expect(
        applyLink(),
        "a category the shopper tapped has to end up in the address, or the window closes and nothing has changed",
      ).toHaveAttribute("href", "/gb-en/filters/categories/shoes");
    });

    it("carries several filter kinds at once, in a fixed order", async () => {
      await renderBar({
        filters: {
          categories: ["shoes"],
          brands: ["nike"],
          sizes: ["XL"],
        },
      });

      expect(
        applyLink(),
        "the order has to be the same every time, or the same set of filters makes several different addresses — which splits the cache and the analytics for one listing",
      ).toHaveAttribute(
        "href",
        "/gb-en/filters/categories/shoes/brands/nike/sizes/XL",
      );
    });

    it("writes a colour without its hash", async () => {
      await renderBar({ filters: { colors: ["#ff0000"] } });

      expect(
        applyLink(),
        "a `#` in a path is read by the browser as the start of a fragment, so the colour would be cut off the address entirely",
      ).toHaveAttribute("href", "/gb-en/filters/colors/ff0000");
    });

    it("writes the price band as one dash-joined token", async () => {
      await renderBar({ filters: { prices: [10, 50] } });

      expect(
        applyLink(),
        "a price band is one filter with two bounds; the listing page splits this token back apart, so both bounds have to travel together",
      ).toHaveAttribute("href", "/gb-en/filters/prices/10-50");
    });

    it("leaves the price out when only one bound was set", async () => {
      await renderBar({ filters: { prices: [10] } });

      expect(
        applyLink(),
        "half a band is not a band — sending it would narrow the listing by a bound the shopper never chose",
      ).toHaveAttribute("href", "/gb-en/filters");
    });

    it("carries the words the shopper searched for", async () => {
      await renderBar({ filters: { search_text: "blue shirt" } });

      expect(
        applyLink(),
        "the search is part of what the window is applying; dropping it here widens the listing back to everything the moment Search is pressed",
      ).toHaveAttribute("href", "/gb-en/filters/search/blue%20shirt");
    });

    it("keeps the shopper on the featured listing when that is where they are", async () => {
      await renderBar({
        isFeatured: true,
        filters: { categories: ["shoes"] },
      });

      expect(
        applyLink(),
        "filtering inside featured products must stay inside featured products — landing on the general listing silently drops the one thing that listing was about",
      ).toHaveAttribute("href", "/gb-en/featured/categories/shoes");
    });

    it("keeps the shopper on the flash deals listing when that is where they are", async () => {
      await renderBar({
        isFlashDeal: true,
        filters: { categories: ["shoes"] },
      });

      expect(
        applyLink(),
        "the same holds for flash deals — a deal listing that drops back to the general one shows products that are not on offer",
      ).toHaveAttribute("href", "/gb-en/flashDeals/categories/shoes");
    });

    it("stays on the listing's own locale", async () => {
      await renderWithProviders(
        <FiltersButton
          filters={{ ...NOTHING_CHOSEN, categories: ["shoes"] }}
          isChanged
          loading={false}
          total_size={5}
          isFeatured={false}
          isFlashDeal={false}
          onReset={vi.fn()}
        />,
        { country: "sy", language: "ar", path: "/filters", store: { filterEnabled: true } },
      );

      expect(
        applyLink(),
        "the locale is the first segment of every address here; losing it sends an Arabic shopper in Syria to the English listing",
      ).toHaveAttribute("href", "/sy-ar/filters/categories/shoes");
    });
  });

  describe("how many products the shopper will get", () => {
    it("says the count on the button", async () => {
      await renderBar({ total_size: 42 });

      expect(
        screen.getByText(/42/),
        "the count is what tells the shopper whether the filters they have staged are worth applying; without it Search is a guess",
      ).toBeInTheDocument();
    });
  });

  describe("when the bar shows at all", () => {
    it("shows nothing while the staged filters match what is already applied", async () => {
      await renderBar({ isChanged: false });

      expect(
        applyLink(),
        "with nothing changed, Search would re-apply the address the shopper is already on — the bar stays out of the way instead",
      ).not.toBeInTheDocument();
      expect(
        resetButton(),
        "and there is nothing to reset either",
      ).not.toBeInTheDocument();
    });

    it("shows nothing while the new count is still being fetched", async () => {
      await renderBar({ loading: true });

      expect(
        applyLink(),
        "the count on the button would be the count for the previous set of filters — offering it invites the shopper to apply filters on the strength of a number that is about to change",
      ).not.toBeInTheDocument();
    });

    it("offers no Search when the staged filters match nothing", async () => {
      await renderBar({ total_size: 0 });

      expect(
        applyLink(),
        "applying filters that match nothing takes the shopper to an empty listing; the window keeps them here, where they can still change a chip",
      ).not.toBeInTheDocument();
    });

    it("still offers Reset when the staged filters match nothing", async () => {
      await renderBar({ total_size: 0 });

      expect(
        resetButton(),
        "a shopper who has narrowed down to nothing is exactly the one who needs to undo it, so Reset must survive the case that removes Search",
      ).toBeInTheDocument();
    });
  });

  describe("pressing the buttons", () => {
    it("hands the reset back to the window", async () => {
      const { onReset } = await renderBar({ filters: { categories: ["shoes"] } });

      await userEvent.click(resetButton());

      expect(
        onReset,
        "the staged chips live in the window, not in this bar, so Reset can only ask the window to put them back",
      ).toHaveBeenCalled();
    });

    it("closes the filter window as the shopper applies", async () => {
      await renderBar({ filters: { categories: ["shoes"] } });

      await userEvent.click(applyLink() as HTMLElement);

      expect(
        useAppStore.getState().filterEnabled,
        "the window is a full-screen overlay — leaving it open over the results the shopper just asked for means they never see them",
      ).toBe(false);
    });
  });
});
