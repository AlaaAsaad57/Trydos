import { beforeEach, describe, expect, it } from "vitest";
import {
  HOME_BRAND_COUNT,
  HOME_FIRST_READ,
  HOME_NEXT_READ,
  splitHomeStores,
  toHomeChips,
  toHomeStore,
  toHomeStores,
} from "components/DemoApp1/homeData";

const MEDIA = "https://media.test";

// A boutique as the Elasticsearch boutiques reader returns it (custom_boutiques).
const boutique = (slug: string, extra: Record<string, unknown> = {}) => ({
  id: 1,
  slug,
  name: `Shop ${slug}`,
  icon: `/boutiques/${slug}.png`,
  description: "",
  banners: [],
  ...extra,
});

describe("toHomeStore (one boutique from the search engine as a home card)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_MEDIA_URL = MEDIA;
  });

  it("keeps the slug", () => {
    expect(
      toHomeStore(boutique("zara"), "sy-en")?.slug,
      "the card lost the boutique's slug",
    ).toBe("zara");
  });

  it("keeps the name the search engine sent", () => {
    expect(
      toHomeStore(boutique("zara"), "sy-en")?.name,
      "the card does not show the boutique's own name",
    ).toBe("Shop zara");
  });

  it("turns the icon path into a full media address", () => {
    expect(
      toHomeStore(boutique("zara"), "sy-en")?.logo,
      "the card's logo is not the boutique icon on the media host",
    ).toBe(`${MEDIA}/boutiques/zara.png`);
  });

  it("gives no logo for a boutique with no icon", () => {
    expect(
      toHomeStore(boutique("zara", { icon: null }), "sy-en")?.logo,
      "a boutique with no icon must give logo null (the card then shows the name)",
    ).toBeNull();
  });

  it("links to the boutique's page in the page's locale", () => {
    expect(
      toHomeStore(boutique("zara"), "sy-ar")?.href,
      "the card must open /sy-ar/filters/boutiques/zara",
    ).toBe("/sy-ar/filters/boutiques/zara");
  });

  it("drops a boutique with no slug", () => {
    expect(
      toHomeStore(boutique(""), "sy-en"),
      "a boutique with no slug has no page to open, so it must give no card",
    ).toBeNull();
  });
});

describe("toHomeStores (a whole read)", () => {
  it("keeps the backend's order and drops the boutiques with no slug", () => {
    expect(
      toHomeStores([boutique("b"), boutique(""), boutique("a")], "sy-en").map(
        (s) => s.slug,
      ),
      "the cards must follow the backend's order (b, a) without the boutique that has no slug",
    ).toEqual(["b", "a"]);
  });

  it("gives no cards when the read is not a list", () => {
    expect(
      toHomeStores(undefined, "sy-en"),
      "a missing boutiques list must give no cards, not throw",
    ).toEqual([]);
  });
});

describe("splitHomeStores (S7-3: brand stores first, then the grid)", () => {
  const slugs = Array.from({ length: 12 }, (_, i) => `s${i + 1}`);
  const stores = toHomeStores(slugs.map((s) => boutique(s)), "sy-en");

  it("puts the first 9 boutiques in the Brand Stores carousel", () => {
    expect(
      splitHomeStores(stores).brands.map((s) => s.slug),
      "the carousel must hold the first 9 boutiques, in order",
    ).toEqual(slugs.slice(0, 9));
  });

  it("puts every boutique after the 9th in the Stores grid", () => {
    expect(
      splitHomeStores(stores).stores.map((s) => s.slug),
      "the grid must hold the boutiques after the first 9, in order",
    ).toEqual(["s10", "s11", "s12"]);
  });

  it("leaves the grid empty when there are 9 boutiques or fewer", () => {
    expect(
      splitHomeStores(stores.slice(0, 4)).stores,
      "with 4 boutiques every one belongs to the carousel, so the grid must be empty",
    ).toEqual([]);
  });
});

describe("read sizes (S7-7)", () => {
  it("the carousel takes 9 boutiques (3 pages of 3)", () => {
    expect(HOME_BRAND_COUNT, "the carousel must take 3 pages of 3").toBe(9);
  });

  it("the first read fills the carousel and the grid's 4 columns of 3", () => {
    expect(HOME_FIRST_READ, "the first read must be 9 + 12").toBe(21);
  });

  it("each next read adds 4 columns of 3 to the grid", () => {
    expect(HOME_NEXT_READ, "a next read must be 12").toBe(12);
  });
});

describe("toHomeChips (the main categories as header chips)", () => {
  const categories = [
    { slug: "men", name: "Men" },
    { slug: "women", name: "Women" },
    { slug: "kids", name: "Kids" },
  ];

  it("picks no chip on the home (S7-8)", () => {
    expect(
      toHomeChips(categories, "sy-en", null).filter((c) => c.picked),
      "no chip may be picked on /[lang]",
    ).toEqual([]);
  });

  it("keeps the backend's order on the home", () => {
    expect(
      toHomeChips(categories, "sy-en", null).map((c) => c.slug),
      "the chips must follow the backend's order on the home",
    ).toEqual(["men", "women", "kids"]);
  });

  it("picks the page's category on its own page (S7-4)", () => {
    expect(
      toHomeChips(categories, "sy-en", "kids").find((c) => c.picked)?.slug,
      "on /categories/kids the kids chip must be the picked one",
    ).toBe("kids");
  });

  it("moves the picked chip to the front, as the old category bar does", () => {
    expect(
      toHomeChips(categories, "sy-en", "kids").map((c) => c.slug),
      "the picked chip must come first, the rest in the backend's order",
    ).toEqual(["kids", "men", "women"]);
  });

  it("links each chip to its category's home in the page's locale", () => {
    expect(
      toHomeChips(categories, "sy-ar", null)[1].href,
      "the women chip must open /sy-ar/categories/women",
    ).toBe("/sy-ar/categories/women");
  });

  it("keeps the name the search engine sent", () => {
    expect(
      toHomeChips(categories, "sy-en", null)[0].name,
      "the chip must show the category's own name",
    ).toBe("Men");
  });

  it("drops a category with no slug or no name", () => {
    expect(
      toHomeChips(
        [{ slug: "", name: "X" }, { slug: "y", name: "" }, ...categories],
        "sy-en",
        null,
      ).map((c) => c.slug),
      "a category with no slug or no name must give no chip",
    ).toEqual(["men", "women", "kids"]);
  });

  it("picks nothing for a slug that is not a main category", () => {
    expect(
      toHomeChips(categories, "sy-en", "shoes").filter((c) => c.picked),
      "an unknown category slug must pick no chip",
    ).toEqual([]);
  });
});
