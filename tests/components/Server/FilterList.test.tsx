// The listing's filter area: one row of chips per filter kind, and under it the
// "active filters" bar that shows what is applied, with one "clear all" link.
import { describe, expect, it, vi } from "vitest";

const filterItem = vi.fn();
const moreFilters = vi.fn();
const switchButton = vi.fn();

vi.mock("components/ListingPage/FilterItem", () => ({
  default: (props: any) => {
    filterItem(props);
    return <span data-pw="chip" />;
  },
}));
vi.mock("components/ListingPage/filterComponents/InfiniteScrollFilters", () => ({
  default: (props: any) => {
    moreFilters(props);
    return null;
  },
}));
vi.mock("components/filterPage/SwitchFiltersButton", () => ({
  default: (props: any) => {
    switchButton(props);
    return null;
  },
}));

import FilterList from "components/Server/FilterList";

import { renderWithProviders } from "../../render";

const currency = { exchange_rate: 1, decimal_digits: 0, symbol: "$" };

const renderList = (props: Record<string, any>, store: Record<string, any> = {}) =>
  renderWithProviders(
    <FilterList
      params={{ lang: "sy-en" }}
      currency={currency}
      itemsLength={5}
      parsedFilters={{}}
      filters={{}}
      {...props}
    />,
    { store },
  );

const activeBar = () => document.querySelector('[data-pw="filterInfo"]');
const resetHref = () =>
  document.querySelector('[data-pw="reset_filter_button"]')?.getAttribute("href");

describe("the filter chip rows", () => {
  it("draws one row per non-empty filter kind, and counts them for the switch button", async () => {
    filterItem.mockClear();
    switchButton.mockClear();
    moreFilters.mockClear();
    const tenBrands = Array.from({ length: 10 }, (_, i) => ({ id: i, slug: `b${i}` }));
    const { container } = await renderList({
      filters: {
        categories: [{ slug: "men" }],
        brands: tenBrands,
        colors: ["red"],
        sizes: [{ min_price: 1, max_price: 2 }],
        prices: [],
        boutiques: [{ slug: "nike" }],
        search_text: "x",
        related_categories: [{ slug: "r" }],
      },
      searchText: "shoe",
      isFeatured: true,
    });
    expect(switchButton.mock.calls[0][0].length, "the switch should count kinds that have items, minus search and boutiques").toBe(5);
    expect(
      Array.from(container.querySelectorAll(".category-row-container")).map((n) => n.getAttribute("data-pw")),
      "each chip kind should get its own row, with its own test id",
    ).toEqual(["categoryBox", "BrandBox", "ColorBox", "SizesBox"]);
    expect(filterItem.mock.calls[0][0].baseUrlOfFiltersPage, "chips on the featured page should link inside featured").toBe("/featured");
    expect(moreFilters, "ten or more brands should offer loading more").toHaveBeenCalledTimes(1);
    expect(moreFilters.mock.calls[0][0].filters.search_text, "loading more must stay inside the active search").toBe("shoe");
    expect(
      container.querySelector('[data-pw="ColorBox"]')?.parentElement?.className,
      "rows other than categories and brands get extra top space",
    ).toContain("pt-[10px]");
  });

  it("links chips inside flash deals, and runs right to left in Arabic", async () => {
    filterItem.mockClear();
    const { container } = await renderList({
      params: { lang: "sy-ar" },
      filters: { brands: [{ id: 1 }] },
      isFlashDeals: true,
    });
    expect(filterItem.mock.calls[0][0].baseUrlOfFiltersPage, "chips on flash deals should link inside flash deals").toBe("/flashDeals");
    expect(container.querySelector("#filter-list-row-container")?.className, "the chip rows should run right to left in Arabic").toContain(
      "[direction:rtl]",
    );
  });

  it("links chips to the plain listing otherwise", async () => {
    filterItem.mockClear();
    await renderList({ filters: { brands: [{ id: 1 }] } });
    expect(filterItem.mock.calls[0][0].baseUrlOfFiltersPage, "chips should link to the plain listing").toBe("/filters");
  });

  it("hides the chip rows when there is at most one product, and dims everything while filters load", async () => {
    const { container } = await renderList({ itemsLength: 1, filters: { brands: [{ id: 1 }] } }, { isNavigating: { is_filter: true } });
    expect(container.querySelector('[data-pw="boutique_filter_options"]'), "one product has nothing to filter").toBeNull();
    expect((container.firstElementChild as HTMLElement).style.opacity, "the filter area should dim while a filter change loads").toBe("0.45");
  });
});

describe("the active filters bar", () => {
  it("is not drawn when nothing is applied", async () => {
    await renderList({ parsedFilters: { brands: [] } });
    expect(activeBar(), "no filter applied means no active bar").toBeNull();
  });

  it("is not drawn on a boutique page with nothing else applied", async () => {
    await renderList({ parsedFilters: { boutiques: ["nike"] } });
    expect(activeBar(), "a boutique page alone has nothing to clear").toBeNull();
  });

  it("shows the search alone, and clears everything to the plain listing", async () => {
    await renderList({ parsedFilters: {}, searchText: "red <b>shoe</b>" });
    expect(activeBar()?.textContent, "the search text should be shown").toContain("red");
    expect(resetHref(), "clearing should go to the plain listing").toBe("/sy-en/filters");
  });

  it("on a boutique page with other filters, clears back to the boutique and hides the boutique chip", async () => {
    await renderList({
      parsedFilters: { boutiques: ["nike"], brands: ["adidas"] },
      filters: { boutiques: [{ slug: "nike", name: "Nike" }], brands: [{ slug: "adidas", name: "Adidas", icon: "a.png" }] },
    });
    expect(resetHref(), "clearing should keep the one boutique").toBe("/sy-en/filters/boutiques/nike");
    expect(activeBar()?.textContent, "the boutique chip is redundant on its own page").not.toContain("Nike");
    expect(document.querySelector('[data-pw="mainFilterBrand"]')?.textContent, "the brand chip should be shown").toBe("Adidas");
  });

  it("shows every applied kind: boutiques, brands, colours, price, sizes, search and tags", async () => {
    await renderList({
      params: { lang: "sy-ar" },
      searchText: "shoe",
      parsedFilters: {
        boutiques: ["nike", "zara", "gone"],
        brands: ["adidas", "gone"],
        colors: ["#ff0000", "00ff00"],
        prices: [10, 20],
        sizes: ["m", "l"],
        tags_names: ["summer"],
        Search: ["shoe"],
        search: ["shoe"],
      },
      filters: {
        boutiques: [
          { slug: "nike", name: "Nike", banner: { file_path: "/upload/n.png" } },
          { slug: "zara", name: "Zara" },
        ],
        brands: [{ slug: "adidas", name: "Adidas" }],
      },
    });
    const bar = activeBar() as HTMLElement;
    expect(bar.className, "the bar should run right to left in Arabic").toContain("flex-row-reverse");
    expect(bar.textContent, "several boutiques should each get a chip").toContain("Nike");
    expect(bar.textContent, "several boutiques should each get a chip").toContain("Zara");
    expect(
      Array.from(bar.querySelectorAll(".rounded-full")).map((n) => (n as HTMLElement).style.backgroundColor),
      "colours should be drawn as swatches, with or without the # prefix",
    ).toEqual(["rgb(255, 0, 0)", "rgb(0, 255, 0)"]);
    expect(bar.textContent, "the price range should be shown with the currency").toMatch(/10.*\$.*-.*20.*\$/);
    expect(
      Array.from(bar.querySelectorAll('[data-pw="sizeFilterTitle"]')).map((n) => n.textContent),
      "each size should be shown",
    ).toEqual(["m", "l"]);
    expect(bar.textContent, "sizes should be separated by a dash").toContain(" - ");
    expect(bar.textContent, "the tag should be shown").toContain("#summer");
    expect(resetHref(), "several boutiques clear to the plain listing").toBe("/sy-ar/filters");
  });

  it("skips a brand chip instead of breaking when the brand list holds an empty entry", async () => {
    await renderList({
      itemsLength: 1,
      parsedFilters: { brands: ["adidas"] },
      filters: { brands: [null, { slug: "adidas", name: "Adidas" }] },
    });
    expect(activeBar(), "the bar should still be drawn").not.toBeNull();
    expect(
      document.querySelector('[data-pw="mainFilterBrand"]'),
      "a brand that cannot be looked up is left out",
    ).toBeNull();
  });

  it("shows the active category with its icon, falling back to its thumbnail and flat photo", async () => {
    await renderList({
      parsedFilters: { categories: ["men", "women", "kids", "unknown"] },
      filters: {
        categories: [
          { slug: "men", name: "Men", icon: { file_path: "/upload/men.png" } },
          {
            slug: "women",
            name: "Women",
            most_viewed_product_thumbnail: "/upload/w.png",
            childes: [
              { slug: "dresses", name: "Dresses", childes: [{ slug: "maxi", name: "Maxi" }, { name: "no slug" }] },
              { name: "no slug" },
            ],
          },
          // A category whose sub-list names another category by its slug.
          { slug: "kids", name: "Kids", flat_photo_path: { file_path: "/upload/k.png" }, childes: ["men"] },
          { slug: "men", name: "Men again" },
        ],
      },
    });
    const titles = Array.from(document.querySelectorAll('[data-pw="mainFilter"]')).map((n) => n.textContent);
    expect(titles, "each known active category should get a chip, the first entry winning a duplicate slug").toEqual([
      "Men",
      "Women",
      "Kids",
    ]);
    expect(
      document.querySelectorAll(".sub-category-icon").length,
      "a sub-category that is itself a known category should get a small chip",
    ).toBe(1);
  });
});
