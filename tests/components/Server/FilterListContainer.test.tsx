// The listing filter chips container (server side). It merges what the backend
// applied (colours, sizes, search) into the shopper's filters and hands the
// filter lists to the chip row.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/Server/FilterListReactive", () => ({ default: () => null }));

import FilterListContainer from "components/Server/FilterListContainer";

const chipProps = async (filtersData: any, parsedFilters: any) => {
  const element: any = await FilterListContainer({
    filtersPromis: Promise.resolve(filtersData),
    currencyPromise: Promise.resolve({ symbol: "$" }),
    Params: { lang: "sy-en" },
    parsedFilters,
  });
  return element.props.children.props;
};

describe("the listing filter chips container", () => {
  it("merges the applied colours, sizes and search into the shopper's filters, without repeats", async () => {
    const props = await chipProps(
      {
        applied: { colors: ["red", "blue"], sizes: ["M"], search_text: "shoe" },
        categories: ["c"],
        brands: ["b"],
        colors: ["red"],
        prices: { priceRanges: [1] },
        attributes: [{ options: ["M"] }],
        boutiques: ["nike"],
        related_categories: ["r"],
        products: [1, 2],
      },
      { colors: ["red"], sizes: ["S"], search_text: ["path"] },
    );
    expect(props.parsedFilters.colors, "applied colours should be added once each").toEqual(["red", "blue"]);
    expect(props.parsedFilters.sizes, "applied sizes should be added to the shopper's").toEqual(["S", "M"]);
    expect(props.parsedFilters.search, "the applied search should win").toEqual(["shoe"]);
    expect(props.serverFilters, "every filter list should reach the chips").toEqual({
      categories: ["c"],
      brands: ["b"],
      colors: ["red"],
      prices: [1],
      sizes: ["M"],
      boutiques: ["nike"],
      search_text: "path",
      related_categories: ["r"],
    });
    expect(props.itemsLength, "the chips should know how many products came back").toBe(2);
    expect(props.currency, "the currency should reach the chips").toEqual({ symbol: "$" });
  });

  it("starts from nothing when the shopper had no colours or sizes, and uses the path search", async () => {
    const props = await chipProps(
      { applied: { colors: ["red"], sizes: ["M"] } },
      { search_text: ["path"] },
    );
    expect(props.parsedFilters.colors, "the applied colours alone should be used").toEqual(["red"]);
    expect(props.parsedFilters.sizes, "the applied sizes alone should be used").toEqual(["M"]);
    expect(props.parsedFilters.search, "the path search should be used when none was applied").toEqual([["path"]]);
    expect(props.itemsLength, "no product list should count as zero").toBe(0);
  });

  it("leaves the filters alone and uses empty lists when nothing was applied", async () => {
    const props = await chipProps({ applied: { sizes: [] } }, {});
    expect(props.parsedFilters.search, "no search anywhere should add none").toBeUndefined();
    expect(props.serverFilters, "missing lists should be empty").toEqual({
      categories: [],
      brands: [],
      colors: [],
      prices: [],
      sizes: [],
      boutiques: [],
      search_text: null,
      related_categories: [],
    });
  });
});
