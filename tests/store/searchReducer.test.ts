import { describe, expect, it, beforeEach } from "vitest";
import { useAppStore } from "store";

describe("Search store reducer actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      value: "",
      searchWords: [],
      trending: [],
      searchResults: {
        products: [],
        prices: { min_price: null, max_price: null },
        brands: [],
        categories: [],
        boutiques: [],
        colors: [],
        sizes: [],
        search_text: "",
        prices_ranges: [],
      },
      searchFilters: {
        categories: [],
        brands: [],
        boutiques: [],
        prices: { min_price: null, max_price: null },
        sizes: [],
        colors: [],
        search_text: "",
      },
    });
  });

  it("setSearchCategory toggles category selection (adds when missing, removes when present)", () => {
    const cat1 = { slug: "shoes", name: "Shoes" };
    const cat2 = { slug: "shirts", name: "Shirts" };

    useAppStore.getState().setSearchCategory(cat1);
    expect(useAppStore.getState().searchFilters.categories, "should add cat1").toEqual([cat1]);

    useAppStore.getState().setSearchCategory(cat2);
    expect(useAppStore.getState().searchFilters.categories, "should contain cat1 and cat2").toEqual([cat1, cat2]);

    useAppStore.getState().setSearchCategory(cat1);
    expect(useAppStore.getState().searchFilters.categories, "should remove cat1 on second toggle").toEqual([cat2]);
  });

  it("setSearchBrand toggles brand selection correctly", () => {
    const brand1 = { slug: "nike", name: "Nike" };

    useAppStore.getState().setSearchBrand(brand1);
    expect(useAppStore.getState().searchFilters.brands, "should add brand1").toEqual([brand1]);

    useAppStore.getState().setSearchBrand(brand1);
    expect(useAppStore.getState().searchFilters.brands, "should remove brand1 on toggle").toEqual([]);
  });

  it("setSearchPrice sets min_price and max_price", () => {
    const priceRange = { min_price: 10, max_price: 200 };
    useAppStore.getState().setSearchPrice(priceRange);

    expect(useAppStore.getState().searchFilters.prices, "prices filter should update").toEqual(priceRange);
  });

  it("setSearchResults replaces searchResults when replace parameter is true", () => {
    const results = {
      products: [{ id: 1, name: "Sneakers" }],
      categories: [{ slug: "shoes" }],
      brands: [{ slug: "adidas" }],
      prices: { min_price: 50, max_price: 150 },
    };

    useAppStore.getState().setSearchResults(results as any, true);

    const searchResults = useAppStore.getState().searchResults;
    expect(searchResults.products, "products should be updated").toEqual([{ id: 1, name: "Sneakers" }]);
    expect(searchResults.prices, "prices range should be updated").toEqual({ min_price: 50, max_price: 150 });
  });
});

describe("Search store — the flags the search screen uses", () => {
  it("setSearchPartialLoading and setSearchLoading write their flags", () => {
    useAppStore.getState().setSearchPartialLoading(true);
    useAppStore.getState().setSearchLoading(true);
    expect(useAppStore.getState().partialLoading, "the partial-loading flag was not set").toBe(true);
    expect(useAppStore.getState().loading_search, "the search-loading flag was not set").toBe(true);
  });

  it("setEnableSearch opens the search, and closing it clears the word, filters and total", () => {
    useAppStore.setState({
      value: "shirt",
      totalProducts: 12,
      searchFilters: { ...useAppStore.getState().searchFilters, brands: [{ slug: "b" }] },
    } as any);
    useAppStore.getState().setEnableSearch(true);
    expect(useAppStore.getState().enable_search, "the search did not open").toBe(true);
    expect(useAppStore.getState().value, "opening the search cleared the word").toBe("shirt");
    useAppStore.getState().setEnableSearch(false);
    const s = useAppStore.getState();
    expect([s.enable_search, s.value, s.totalProducts], "closing the search left state behind").toEqual([false, "", null]);
    expect(s.searchFilters.brands, "closing the search kept the filters").toEqual([]);
  });
});
