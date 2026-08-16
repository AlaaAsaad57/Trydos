// What a filter link does when a shopper clicks it.
//
// Every checkbox in the listing side panel is a link, and this decides where it
// points: which filters the click adds, which it takes away, and what the
// address ends up as. Getting it wrong means a click that appears to do nothing,
// or one that quietly drops the shopper's search.

import { describe, expect, it, vi } from "vitest";

import {
  getFilterStateForItem,
  getFilterStateForItemLegacy,
} from "utils/listing/filterItemState";

const BASE = "/filters";

const state = (
  parsedFilters: any,
  itemValue: string,
  filterKey: string,
  parentValue?: string[],
  activeQueryString?: string,
) =>
  getFilterStateForItem(
    parsedFilters,
    itemValue,
    filterKey,
    parentValue,
    "gb-en",
    BASE,
    activeQueryString,
  );

describe("clicking a filter on and off", () => {
  it("adds the choice to the address when it was not chosen", () => {
    expect(state({}, "nike", "brands")).toEqual({
      isFiltered: false,
      href: "/gb-en/filters/brands/nike",
    });
  });

  it("marks a choice already in the address as chosen", () => {
    expect(state({ brands: ["nike"] }, "nike", "brands").isFiltered).toBe(true);
  });

  it("takes the choice back out when it was already chosen", () => {
    expect(state({ brands: ["nike"] }, "nike", "brands").href).toBe("/gb-en/filters");
  });

  it("keeps the other choices of the same kind when one is added", () => {
    expect(state({ brands: ["nike"] }, "adidas", "brands").href).toBe(
      "/gb-en/filters/brands/nike,adidas",
    );
  });

  it("keeps the other choices of the same kind when one is removed", () => {
    expect(state({ brands: ["nike", "adidas"] }, "nike", "brands").href).toBe(
      "/gb-en/filters/brands/adidas",
    );
  });

  it("keeps the choices of every other kind untouched", () => {
    expect(state({ boutiques: ["shop-a"] }, "nike", "brands").href).toBe(
      "/gb-en/filters/boutiques/shop-a/brands/nike",
    );
  });
});

describe("clicking a colour", () => {
  it("stores a colour with its hash but writes it into the address without one", () => {
    expect(state({}, "ff0000", "colors").href).toBe("/gb-en/filters/colors/ff0000");
  });

  it("knows a colour is chosen whether or not the hash is written", () => {
    expect(state({ colors: ["#ff0000"] }, "ff0000", "colors").isFiltered).toBe(true);
    expect(state({ colors: ["ff0000"] }, "#ff0000", "colors").isFiltered).toBe(true);
  });

  it("takes a chosen colour back out in either form", () => {
    expect(state({ colors: ["#ff0000"] }, "ff0000", "colors").href).toBe(
      "/gb-en/filters",
    );
  });

  it("keeps the other colours when one is added", () => {
    expect(state({ colors: ["#ff0000"] }, "00ff00", "colors").href).toBe(
      "/gb-en/filters/colors/ff0000,00ff00",
    );
  });
});

describe("clicking a price band", () => {
  it("allows only one price band at a time", () => {
    expect(state({ prices: ["10-50"] }, "60-100", "prices").href).toBe(
      "/gb-en/filters/prices/60-100",
    );
  });

  it("clears the price band when the chosen one is clicked again", () => {
    expect(state({ prices: ["10-50"] }, "10-50", "prices").href).toBe("/gb-en/filters");
  });
});

describe("the rest of the address", () => {
  it("drops the parent category when a child of it is chosen", () => {
    expect(state({ categories: ["shoes"] }, "boots", "categories", ["shoes"]).href).toBe(
      "/gb-en/filters/categories/boots",
    );
  });

  it("carries the search and the sort order across the click", () => {
    expect(state({}, "nike", "brands", undefined, "search=nike&sort=price_asc").href).toBe(
      "/gb-en/filters/brands/nike?search=nike&sort=price_asc",
    );
  });

  it("leaves the language out of the address when there is none", () => {
    expect(
      getFilterStateForItem({}, "nike", "brands", undefined, undefined, BASE).href,
    ).toBe("/filters/brands/nike");
  });
});

describe("the older filter links, which use a query instead of a path", () => {
  const read = (href: string, key: string) =>
    JSON.parse(decodeURIComponent(new URLSearchParams(href.slice(1)).get(key) || ""));

  it("adds the choice to the query", () => {
    const result = getFilterStateForItemLegacy(new URLSearchParams(), "nike", "brands");
    expect(result.isFiltered).toBe(false);
    expect(read(result.href, "brands")).toEqual(["nike"]);
  });

  it("takes the choice back out of the query when it was already chosen", () => {
    const result = getFilterStateForItemLegacy(
      new URLSearchParams('brands=["nike"]'),
      "nike",
      "brands",
    );
    expect(result.isFiltered).toBe(true);
    expect(result.href).toBe("?");
  });

  it("allows only one price band at a time here too", () => {
    const result = getFilterStateForItemLegacy(
      new URLSearchParams('prices=["10-50"]'),
      "60-100",
      "prices",
    );
    expect(read(result.href, "prices")).toEqual(["60-100"]);
  });

  it("reports the fault and starts fresh when the query cannot be read", () => {
    const reported = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = getFilterStateForItemLegacy(
      new URLSearchParams("brands=not-a-list"),
      "nike",
      "brands",
    );
    expect(reported).toHaveBeenCalled();
    expect(read(result.href, "brands")).toEqual(["nike"]);
    reported.mockRestore();
  });

  it("reads the current filters when they arrive as a plain object", () => {
    // The plain-object route used to throw the caller's filters away and read
    // back an empty query, so "nike" read as not chosen and the link added it a
    // second time. The object is turned into a real query now, so both shapes
    // behave the same.
    const result = getFilterStateForItemLegacy(
      { brands: '["nike"]' },
      "nike",
      "brands",
    );
    expect(result.isFiltered).toBe(true);
    // Chosen already, so the link takes it off rather than adding it twice.
    expect(result.href).toBe("?");
  });
});
