// The server side of the listing's filter panel: it waits for the currency and
// the filter data, and hands the filter lists to the panel in the shape it reads.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/ListingPage/filterComponents/FiltersWindow", () => ({
  default: () => null,
}));

import FilterWidgetServer from "components/Server/FilterWidgetServer";

describe("the listing filter panel (server side)", () => {
  it("passes every filter list, and the first attribute's options as the sizes", async () => {
    const element: any = await FilterWidgetServer({
      currencyPromise: Promise.resolve({ symbol: "$" }),
      filtersPromise: Promise.resolve({
        categories: ["c"],
        brands: ["b"],
        colors: ["red"],
        attributes: [{ options: ["M"] }],
        prices: { min: 1, max: 2 },
      }),
      parsedFilters: { brands: ["b"] },
      country: "sy",
      language: "en",
      isFeatured: true,
      isFlashDeal: false,
    });
    const panel = element.props.children.props;
    expect(panel.children, "the panel should get every filter list in its own slot").toEqual({
      categories: ["c"],
      brands: ["b"],
      colors: ["red"],
      sizes: ["M"],
      prices: { min: 1, max: 2 },
    });
    expect(panel.currency, "the resolved currency should reach the panel").toEqual({ symbol: "$" });
    expect(panel.serverSearch, "no search should be passed as an empty string").toBe("");
  });

  it("uses empty lists when the filter data has none", async () => {
    const element: any = await FilterWidgetServer({
      currencyPromise: Promise.resolve(null),
      filtersPromise: Promise.resolve({}),
      parsedFilters: {},
      country: "sy",
      language: "en",
      isFeatured: false,
      isFlashDeal: true,
      serverSearch: "shoe",
    });
    const panel = element.props.children.props;
    expect(panel.children, "missing lists should become empty lists, not undefined").toEqual({
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
      prices: undefined,
    });
    expect(panel.serverSearch, "the search should be passed through").toBe("shoe");
  });
});
