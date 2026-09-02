// @vitest-environment node
//
// serverRequests/cached/home.ts carries `import "server-only"`, so it can only
// be loaded from a server-like test environment. See tests/mocks/serverOnly.ts.
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCategories = vi.fn();

vi.mock("services/elastic/elasticsearch-reader.service", () => ({
  ElasticsearchReader: class {
    getCategories = getCategories;
  },
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

const GetFeaturedProducts = vi.fn();
const GetFlashDealProducts = vi.fn();
const GetHomeBoutiques = vi.fn();

vi.mock("serverRequests/home", () => ({
  GetFeaturedProducts,
  GetFlashDealProducts,
  GetHomeBoutiques,
}));

function hit(categories: any[]) {
  return { _source: { custom_categories: categories } };
}

describe("getCachedCategories", () => {
  beforeEach(() => {
    getCategories.mockReset();
  });

  it("returns only the six fields the navbar renders", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([
            {
              id: 7,
              language_code: "en",
              name: "Shoes",
              slug: "shoes",
              flat_photo_path: { file_path: "/f.png" },
              outline_photo_path: { file_path: "/o.png" },
              fill_photo_path: { file_path: "/x.png" },
              position: 3,
              category_id: 99,
              description: "a long description nobody renders",
            },
          ]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      Object.keys(categories[0]).sort(),
      "the cached category carries fields the navbar never renders, so every cache entry stores more than it needs (finding 12)",
    ).toEqual([
      "fill_photo_path",
      "flat_photo_path",
      "id",
      "name",
      "outline_photo_path",
      "slug",
    ]);
  });

  it("keeps only the requested language", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([
            { id: 7, language_code: "en", name: "Shoes", slug: "shoes" },
            { id: 7, language_code: "ar", name: "أحذية", slug: "shoes" },
          ]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "ar");

    expect(
      categories.map((c) => c.name),
      "asking for Arabic returned a name in another language, so the navbar would render the wrong words",
    ).toEqual(["أحذية"]);
  });

  it("matches the language case-insensitively", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([{ id: 7, language_code: "EN", name: "Shoes", slug: "shoes" }]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      categories.map((c) => c.slug),
      "a category whose language_code is upper-case was dropped, so the navbar renders empty for that index",
    ).toEqual(["shoes"]);
  });

  it("returns each category once even when many products share it", async () => {
    const shoes = { id: 7, language_code: "en", name: "Shoes", slug: "shoes" };
    getCategories.mockResolvedValue({
      hits: { hits: [hit([shoes]), hit([shoes]), hit([shoes])] },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      categories.map((c) => c.slug),
      "the same category came back more than once, so the navbar would show a duplicate tab",
    ).toEqual(["shoes"]);
  });

  it("returns an empty list rather than throwing when the search engine answers nothing", async () => {
    getCategories.mockResolvedValue({ hits: { hits: [] } });

    const { getCachedCategories } = await import("serverRequests/cached/home");

    await expect(
      getCachedCategories("sy", "en"),
      "an empty answer from the search engine threw instead of returning an empty list, which would blank the whole page rather than the navbar",
    ).resolves.toEqual([]);
  });
});

describe("getCachedFeatured", () => {
  beforeEach(() => GetFeaturedProducts.mockReset());

  it("asks for one category when a slug is given", async () => {
    GetFeaturedProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFeatured } = await import("serverRequests/cached/home");
    await getCachedFeatured("sy", "en", "shoes");

    expect(
      GetFeaturedProducts.mock.calls[0][0].category,
      "the category slug did not reach the search engine, so a category page would show the whole catalog",
    ).toBe('["shoes"]');
  });

  it("asks for no category when the slug is null", async () => {
    GetFeaturedProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFeatured } = await import("serverRequests/cached/home");
    await getCachedFeatured("sy", "en", null);

    expect(
      GetFeaturedProducts.mock.calls[0][0].category,
      "a category filter was sent for the plain homepage, so the homepage would show one category's products",
    ).toBeUndefined();
  });

  it("passes the country and language the shopper asked for", async () => {
    GetFeaturedProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFeatured } = await import("serverRequests/cached/home");
    await getCachedFeatured("sy", "ar", null);

    expect(
      [
        GetFeaturedProducts.mock.calls[0][0].country,
        GetFeaturedProducts.mock.calls[0][0].language,
      ],
      "the featured reader ignored the country or the language, so one country's cached row would be served to every other — only the values a cached function reads join its cache key",
    ).toEqual(["sy", "ar"]);
  });

  it("returns products the caller can render without a cookie", async () => {
    GetFeaturedProducts.mockResolvedValue({
      data: {
        products: [
          { product_id: 1, name: "Shoe", is_luck: true, luck_price: 5 },
        ],
      },
    });
    const { getCachedFeatured } = await import("serverRequests/cached/home");
    const products = await getCachedFeatured("sy", "en", null);

    expect(
      products[0].is_luck,
      "the cached product lost its is_luck flag, so the luck badge would never be drawn for anybody",
    ).toBe(true);
  });

  it("returns an empty list rather than throwing when the search engine answers nothing", async () => {
    GetFeaturedProducts.mockResolvedValue({ data: {} });
    const { getCachedFeatured } = await import("serverRequests/cached/home");

    await expect(
      getCachedFeatured("sy", "en", null),
      "an empty answer from the search engine threw instead of returning an empty list, which would blank the whole page rather than one row",
    ).resolves.toEqual([]);
  });
});

describe("getCachedFlashDeals", () => {
  beforeEach(() => GetFlashDealProducts.mockReset());

  it("asks for one category when a slug is given", async () => {
    GetFlashDealProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFlashDeals } = await import("serverRequests/cached/home");
    await getCachedFlashDeals("sy", "en", "shoes");

    expect(
      GetFlashDealProducts.mock.calls[0][0].category,
      "the category slug did not reach the search engine, so a category page would show flash deals from the whole catalog",
    ).toBe('["shoes"]');
  });

  it("asks for no category when the slug is null", async () => {
    GetFlashDealProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFlashDeals } = await import("serverRequests/cached/home");
    await getCachedFlashDeals("sy", "en", null);

    expect(
      GetFlashDealProducts.mock.calls[0][0].category,
      "a category filter was sent for the plain homepage, so the flash-deal row would show one category only",
    ).toBeUndefined();
  });

  it("passes the country and language the shopper asked for", async () => {
    GetFlashDealProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFlashDeals } = await import("serverRequests/cached/home");
    await getCachedFlashDeals("sy", "ar", null);

    expect(
      [
        GetFlashDealProducts.mock.calls[0][0].country,
        GetFlashDealProducts.mock.calls[0][0].language,
      ],
      "the flash-deal reader ignored the country or the language, so one country's cached row would be served to every other — only the values a cached function reads join its cache key",
    ).toEqual(["sy", "ar"]);
  });

  it("returns products the caller can render without a cookie", async () => {
    GetFlashDealProducts.mockResolvedValue({
      data: {
        products: [{ product_id: 2, name: "Bag", is_luck: true, luck_price: 7 }],
      },
    });
    const { getCachedFlashDeals } = await import("serverRequests/cached/home");
    const products = await getCachedFlashDeals("sy", "en", null);

    expect(
      products[0].is_luck,
      "the cached product lost its is_luck flag, so the luck badge would never be drawn for anybody",
    ).toBe(true);
  });

  it("returns an empty list rather than throwing when the search engine answers nothing", async () => {
    GetFlashDealProducts.mockResolvedValue({ data: {} });
    const { getCachedFlashDeals } = await import("serverRequests/cached/home");

    await expect(
      getCachedFlashDeals("sy", "en", null),
      "an empty answer from the search engine threw instead of returning an empty list, which would blank the whole page rather than one row",
    ).resolves.toEqual([]);
  });
});

describe("getCachedBoutiques", () => {
  beforeEach(() => GetHomeBoutiques.mockReset());

  it("returns the boutiques and the offset the infinite scroll needs", async () => {
    GetHomeBoutiques.mockResolvedValue({
      data: { boutiques: [{ slug: "shop-a" }], offset: [42] },
    });
    const { getCachedBoutiques } = await import("serverRequests/cached/home");
    const result = await getCachedBoutiques("sy", "en", null);

    expect(
      result.boutiques.map((b: any) => b.slug),
      "the cached boutique list came back without its boutiques, so the home page would show an empty offers section",
    ).toEqual(["shop-a"]);
    expect(
      result.offset,
      "the cached boutique list came back without an offset, so the infinite scroll cannot ask for the next page",
    ).toEqual([42]);
  });

  it("asks for one category when a slug is given", async () => {
    GetHomeBoutiques.mockResolvedValue({ data: {} });
    const { getCachedBoutiques } = await import("serverRequests/cached/home");
    await getCachedBoutiques("sy", "en", "shoes");

    expect(
      GetHomeBoutiques.mock.calls[0][0].category,
      "the category slug did not reach the search engine, so a category page would list every boutique",
    ).toBe('["shoes"]');
  });

  it("returns an empty section rather than throwing when the search engine answers nothing", async () => {
    GetHomeBoutiques.mockResolvedValue({ data: {} });
    const { getCachedBoutiques } = await import("serverRequests/cached/home");

    await expect(
      getCachedBoutiques("sy", "en", null),
      "an empty answer from the search engine threw instead of returning an empty section, which would blank the whole page rather than the offers row",
    ).resolves.toEqual({ boutiques: [], offset: null });
  });
});
