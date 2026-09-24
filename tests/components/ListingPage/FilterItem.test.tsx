// One circle in the listing's filter row. The same component draws five very
// different things depending on `term`: a category, a brand, a colour, a size or
// a price band.
//
// WHAT THIS FILE IS AND IS NOT ABOUT.
// The rule that decides which filters end up in a link — toggle on, toggle off,
// drop the parent category, keep colours prefixed with "#" — lives in
// `utils/listing/filterItemState.ts` and is already covered by
// `tests/utils/listing/filterItemState.test.ts`. This file is about what the
// component itself does with that rule: which branch it draws, what the link
// points at, whether the circle shows as chosen, and — the part that is the
// component's own and nothing else's — that the live `?search=` / `?sort=` is
// carried across a filter click.
//
// That last one matters because filter links are PATH-based. The filters go in
// the path, so a link built without the query string silently drops the word the
// shopper searched for and widens the listing back to everything.
//
// WHY THE CIRCLES ARE FOUND BY `data-pw` AND NOT BY AN ACCESSIBLE NAME.
// Four of the five take their name from their own content, and a category's
// arrives twice over — the picture's alt text repeats the caption under it. So a
// name is not a stable handle here. `data-pw` is the same one the browser suite
// uses, and it names the circle rather than describing how it looks. What each
// circle is called is checked on its own, in the last group of this file.
import { describe, expect, it } from "vitest";

import FilterItem from "components/ListingPage/FilterItem";

import { renderWithProviders, screen } from "../../render";

const currency = { symbol: "$", exchange_rate: 1, decimal_digits: 2 };

/** The listing this filter row belongs to, as FilterItem is given it. */
const params = { lang: "gb-en" };
const baseUrl = "/filters";

type RenderArgs = {
  term: string;
  item: any;
  filterParams?: Record<string, any>;
  search?: string;
};

async function renderFilterItem({
  term,
  item,
  filterParams = {},
  search = "",
}: RenderArgs) {
  return renderWithProviders(
    <FilterItem
      term={term as any}
      item={item}
      filterParams={filterParams as any}
      isUsingParsedFilters={true}
      currency={currency}
      params={params as any}
      baseUrlOfFiltersPage={baseUrl}
    />,
    { path: "/filters", search },
  );
}

/** The circle this component drew, by the handle the browser suite uses. */
const circle = (kind: string) =>
  document.querySelector(`[data-pw="${kind}_filter_item"]`);

/** The tick the component puts on a circle that is already chosen. */
const chosenMarkersInside = (element: Element | null) =>
  element?.querySelectorAll('img[src="/icons/ActiveCategoryIcon.svg"]') ?? [];

describe("a circle in the listing's filter row", () => {
  describe("a category", () => {
    const shoes = { slug: "shoes", name: "Shoes", childes: [] };

    it("links to the listing with that category added", async () => {
      await renderFilterItem({ term: "categories", item: shoes });

      expect(
        circle("category"),
        "the category circle must be a real link, so the listing it leads to is server-rendered and can be shared",
      ).toHaveAttribute("href", "/gb-en/filters/categories/shoes");
    });

    it("shows the category name", async () => {
      await renderFilterItem({ term: "categories", item: shoes });

      expect(
        screen.getByText("Shoes"),
        "the shopper picks a category by its name, so the name has to be on the circle",
      ).toBeInTheDocument();
    });

    it("marks the circle as chosen when that category is already applied", async () => {
      await renderFilterItem({
        term: "categories",
        item: shoes,
        filterParams: { categories: ["shoes"] },
      });

      expect(
        chosenMarkersInside(circle("category")).length,
        "an applied category must carry the chosen tick, otherwise the shopper cannot tell which filters are narrowing the list they are looking at",
      ).toBe(1);
    });

    it("carries no chosen tick when that category is not applied", async () => {
      await renderFilterItem({ term: "categories", item: shoes });

      expect(
        chosenMarkersInside(circle("category")).length,
        "a tick on an unapplied category would tell the shopper the list is narrower than it is",
      ).toBe(0);
    });

    it("links to the listing with that category removed when it is already applied", async () => {
      await renderFilterItem({
        term: "categories",
        item: shoes,
        filterParams: { categories: ["shoes"] },
      });

      expect(
        circle("category"),
        "tapping a chosen category turns it off, so its link must lead back to the listing without it",
      ).toHaveAttribute("href", "/gb-en/filters");
    });

    it("drops the parent category when a sub-category is chosen", async () => {
      await renderFilterItem({
        term: "categories",
        item: {
          slug: "shoes",
          name: "Shoes",
          childes: [{ slug: "trainers", name: "Trainers", childes: [] }],
        },
        filterParams: { categories: ["shoes"] },
      });

      const subLink = document.querySelector('a[href*="trainers"]');

      expect(
        subLink?.getAttribute("href"),
        "choosing a sub-category replaces the parent rather than adding to it — keeping both would ask the backend for shoes AND trainers and widen the list instead of narrowing it",
      ).toBe("/gb-en/filters/categories/trainers");
    });
  });

  describe("a category chosen two levels down", () => {
    it("opens the sub-category row and links the grand-child with its parent chain", async () => {
      await renderFilterItem({
        term: "categories",
        item: {
          slug: "shoes",
          name: "Shoes",
          childes: [
            {
              slug: "trainers",
              name: "Trainers",
              childes: [{ slug: "runners", name: "Runners" }],
            },
          ],
        },
        filterParams: { categories: ["trainers", "runners"] },
      });

      expect(
        document.querySelector('a[href*="runners"]'),
        "a chosen sub-category must open the row so its own sub-categories can be tapped",
      ).not.toBeNull();
      expect(
        screen.getByText("Runners"),
        "the grand-child category should be shown by name",
      ).toBeInTheDocument();
    });
  });

  describe("a brand", () => {
    const brand = { slug: "nike", name: "Nike", icon: "brands/nike.png" };

    it("links to the listing with that brand added", async () => {
      await renderFilterItem({ term: "brands", item: brand });

      expect(
        circle("brand"),
        "the brand circle must lead to the listing narrowed to that brand",
      ).toHaveAttribute("href", "/gb-en/filters/brands/nike");
    });

    it("shows the brand name", async () => {
      await renderFilterItem({ term: "brands", item: brand });

      expect(
        screen.getByText("Nike"),
        "the brand logo alone is not enough to pick by — the name has to be on the circle",
      ).toBeInTheDocument();
    });

    it("marks the circle as chosen when that brand is already applied", async () => {
      await renderFilterItem({
        term: "brands",
        item: brand,
        filterParams: { brands: ["nike"] },
      });

      expect(
        chosenMarkersInside(circle("brand")).length,
        "an applied brand must carry the chosen tick like every other applied filter",
      ).toBe(1);
    });
  });

  describe("a colour", () => {
    it("links to the listing with the colour added, written without the hash", async () => {
      await renderFilterItem({ term: "colors", item: "ff0000" });

      expect(
        circle("color"),
        "a colour travels in the path, where a `#` would be read as the start of a fragment — so the path form drops it",
      ).toHaveAttribute("href", "/gb-en/filters/colors/ff0000");
    });

    it("recognises an applied colour that was written with the hash", async () => {
      await renderFilterItem({
        term: "colors",
        item: "ff0000",
        filterParams: { colors: ["#ff0000"] },
      });

      expect(
        chosenMarkersInside(circle("color")).length,
        "the applied colour is stored with a hash and the circle's own value has none; the circle must still recognise itself, or a chosen colour looks unchosen and a second tap adds it twice",
      ).toBe(1);
    });

    it("paints the swatch with the colour, putting the hash back for the browser", async () => {
      await renderFilterItem({ term: "colors", item: "ff0000" });

      const swatch = circle("color")?.querySelector(".brand-photo");

      expect(
        (swatch as HTMLElement | null)?.style.backgroundColor,
        "the swatch IS the label — there is no name and no image on a colour circle, so a swatch painted from a value the browser cannot read leaves an unidentifiable circle",
      ).toBe("rgb(255, 0, 0)");
    });
  });

  describe("a size", () => {
    it("links to the listing with that size added", async () => {
      await renderFilterItem({ term: "sizes", item: "XL" });

      expect(
        circle("size"),
        "the size circle must lead to the listing narrowed to that size",
      ).toHaveAttribute("href", "/gb-en/filters/sizes/XL");
    });

    it("shows the size itself", async () => {
      await renderFilterItem({ term: "sizes", item: "XL" });

      expect(
        screen.getAllByText("XL").length,
        "the size is the only thing that identifies the circle — there is no image and no other label",
      ).toBeGreaterThan(0);
    });
  });

  describe("a price band", () => {
    const band = { min_price: 10, max_price: 50 };

    it("links to the listing with the band added as one min-max token", async () => {
      await renderFilterItem({ term: "prices", item: band });

      expect(
        circle("price"),
        "a price band is one filter, not two, so both bounds travel as a single dash-joined token",
      ).toHaveAttribute("href", "/gb-en/filters/prices/10-50");
    });

    it("shows both bounds with the shopper's own currency symbol", async () => {
      await renderFilterItem({ term: "prices", item: band });

      const label = circle("price")?.textContent ?? "";

      expect(
        label,
        "the band is shown in the currency of the country being browsed, so the symbol has to come from the currency the listing was given",
      ).toContain("$");
      expect(
        label,
        "the lower bound must be on the circle — a band that shows only one number tells the shopper nothing",
      ).toContain("10");
      expect(label, "the upper bound must be on the circle too").toContain("50");
    });

    it("converts both bounds at the country's exchange rate", async () => {
      await renderWithProviders(
        <FilterItem
          term={"prices" as any}
          item={{ min_price: 10, max_price: 50 }}
          filterParams={{} as any}
          isUsingParsedFilters={true}
          currency={{ symbol: "﷼", exchange_rate: 10, decimal_digits: 0 }}
          params={params as any}
          baseUrlOfFiltersPage={baseUrl}
        />,
        { path: "/filters" },
      );

      const label = circle("price")?.textContent ?? "";

      expect(
        label,
        "the band is drawn from the listing's own prices, which are in the base currency — showing them unconverted would put the wrong numbers on the circle for every country but the base one",
      ).toContain("100");
      expect(
        label,
        "the same conversion must be applied to the upper bound, not only the lower one",
      ).toContain("500");
    });
  });

  describe("an unknown filter kind", () => {
    it("draws nothing rather than an empty circle", async () => {
      const { container } = await renderFilterItem({
        term: "ratings",
        item: { slug: "four-stars" },
      });

      expect(
        container.innerHTML,
        "a filter kind the component does not know must draw nothing at all — an empty circle would be a link the shopper can tap that goes nowhere",
      ).toBe("");
    });
  });

  describe("the shopper's search survives a filter tap", () => {
    it("carries the live query string into a category link", async () => {
      await renderFilterItem({
        term: "categories",
        item: { slug: "shoes", name: "Shoes", childes: [] },
        search: "search=nike&sort=price_asc",
      });

      expect(
        circle("category"),
        "filters live in the path and the search lives in the query, so a filter link built from the path alone drops the word the shopper searched for and widens the listing back to everything",
      ).toHaveAttribute(
        "href",
        "/gb-en/filters/categories/shoes?search=nike&sort=price_asc",
      );
    });

    it("carries the live query string into a price link too", async () => {
      await renderFilterItem({
        term: "prices",
        item: { min_price: 10, max_price: 50 },
        search: "search=nike",
      });

      expect(
        circle("price"),
        "every filter kind builds its link the same way, so the search must survive a price tap as well as a category tap",
      ).toHaveAttribute("href", "/gb-en/filters/prices/10-50?search=nike");
    });
  });

  // -------------------------------------------------------------------------
  // What each circle is called.
  //
  // Four of the five name themselves: a category and a brand carry their name, a
  // size carries the size, a price band carries both bounds. None of them takes
  // a label, because an `aria-label` REPLACES that content in the accessible
  // name — adding one would trade a real name for a worse one.
  //
  // The colour circle is the exception. It is a filled swatch with no text and
  // no image, so a label is the only name it can have.
  describe("what each circle is called", () => {
    it("names a colour circle, which has nothing else to name it", async () => {
      await renderFilterItem({ term: "colors", item: "ff0000" });

      expect(
        circle("color"),
        "a swatch is the whole circle; with no label the link reaches a screen reader as just 'link', and every colour in the row sounds identical",
      ).toHaveAccessibleName("Color: #ff0000");
    });

    it("says the colour in the language the shopper is reading", async () => {
      await renderWithProviders(
        <FilterItem
          term={"colors" as any}
          item={"ff0000"}
          filterParams={{} as any}
          isUsingParsedFilters={true}
          currency={currency}
          params={{ lang: "sy-ar" } as any}
          baseUrlOfFiltersPage={baseUrl}
        />,
        { country: "sy", language: "ar", path: "/filters" },
      );

      expect(
        circle("color"),
        "a label is copy the shopper hears, so it has to be translated like any other copy — the hex beside it is a value, not a word to translate",
      ).toHaveAccessibleName("لون: #ff0000");
    });

    it("lets a category circle keep the name its own text gives it", async () => {
      await renderFilterItem({
        term: "categories",
        item: { slug: "shoes", name: "Shoes", childes: [] },
      });

      // Matched loosely because the name arrives twice — the picture's alt text
      // repeats the caption under it. That repetition is untidy but it is not
      // what this case is about: the point is that the name comes from the
      // circle's own content and has not been replaced by a label.
      expect(
        circle("category"),
        "the category's name is already on the circle and is the best name it can have; a label here would replace 'Shoes' with whatever the label happened to say",
      ).toHaveAccessibleName(/Shoes/);
      expect(
        circle("category")?.hasAttribute("aria-label"),
        "and there must be no label to replace it with",
      ).toBe(false);
    });

    it("lets a brand circle keep its own name too", async () => {
      await renderFilterItem({
        term: "brands",
        item: { slug: "nike", name: "Nike", icon: "brands/nike.png" },
      });

      expect(
        circle("brand"),
        "the same holds for a brand — the name under the logo is what the shopper is choosing by",
      ).toHaveAccessibleName(/Nike/);
      expect(
        circle("brand")?.hasAttribute("aria-label"),
        "and no label may override it",
      ).toBe(false);
    });

    it("lets a size circle keep the size as its name", async () => {
      await renderFilterItem({ term: "sizes", item: "XL" });

      expect(
        circle("size"),
        "a size circle carries the size twice over, inside the circle and under it; that is already the name, and a label would hide it",
      ).toHaveAccessibleName(/XL/);
    });
  });
});
