// @vitest-environment node
//
// The listing page's metadata (serverRequests/meta/listing.tsx): the <title>,
// the description, the canonical links and the share picture for /filters,
// /featured and /flashDeals.
//
// The builder reads the chosen boutique, category, brand and colour names from
// Elasticsearch (one small aggregation query), keeps the answer in Redis for
// five minutes, and falls back to the site name and the static share picture.
// Elasticsearch and Redis are replaced; the URL and image helpers are real.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cacheSpies } from "tests/mocks/serverRequests";

const io = vi.hoisted(() => ({ search: vi.fn(), logServerError: vi.fn() }));

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: { search: io.search },
  elasticSearchComment: {},
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));
// The barrel pulls in every translation table. The three helpers used here are
// the real ones from the pure helpers file.
vi.mock("utils/server", async () => {
  const helpers = await import("utils/server/helpers");
  return {
    buildOgImageUrl: helpers.buildOgImageUrl,
    GetImageUrl: helpers.GetImageUrl,
    parseFiltersFromParams: helpers.parseFiltersFromParams,
  };
});

import { generateMetadataForListing } from "serverRequests/meta/listing";

const SITE = "https://trydos.ramaaz.dev";

/** One aggregation's single top hit. */
const top = (source: any) => ({ filtered: { top: { hits: { hits: source ? [{ _source: source }] : [] } } } });

/** The label query's answer. */
const labelsAnswer = ({
  boutique,
  category,
  brand,
  colors = [],
}: {
  boutique?: any;
  category?: any;
  brand?: any;
  colors?: any[];
}) => ({
  aggregations: {
    boutique_info: top(boutique),
    category_info: top(category),
    brand_info: top(brand),
    color_info: { filtered: { top: { hits: { hits: colors.map((c) => ({ _source: c })) } } } },
  },
});

const build = (lang: string, filters?: string[], extra: Record<string, unknown> = {}) =>
  generateMetadataForListing({
    params: Promise.resolve({ lang, filters }),
    searchText: undefined,
    ...extra,
  } as any);

beforeEach(() => {
  vi.clearAllMocks();
  io.search.mockReset();
  cacheSpies.RedisGet.mockReset();
  cacheSpies.RedisGet.mockResolvedValue(null);
});

describe("the listing metadata", () => {
  it("answers the cached metadata without asking Elasticsearch", async () => {
    cacheSpies.RedisGet.mockResolvedValueOnce({ title: "cached" } as any);

    expect(await build("sy-en", ["brands", "acme"]), "the cached metadata was not used").toEqual({
      title: "cached",
    });
    expect(io.search, "Elasticsearch was asked although the cache had the answer").not.toHaveBeenCalled();
    expect((cacheSpies.RedisGet.mock.calls as any[])[0][0], "the cache key is wrong").toBe(
      "meta-listing-filters-sy-en-brands-acme-nosearch",
    );
  });

  it("titles the page from every chosen filter, in the page's language, with the boutique banner", async () => {
    io.search.mockResolvedValue(
      labelsAnswer({
        boutique: {
          name: "Shop A",
          description: "<p>Best shop in town</p>",
          banners: [{ file_path: "https://media_server.ramaaz.dev/upload/b.jpg" }],
        },
        category: { name: "Dresses", flat_photo_path: "/c.png" },
        brand: { name: "Acme" },
        colors: [{ name: "Red" }, { name: "Red" }, { name: "Blue" }],
      }),
    );

    const meta: any = await build(
      "sy-en",
      [
        "boutiques", "shop-a",
        "categories", "dresses",
        "brands", "acme",
        "colors", "ff0000,0000ff",
        "sizes", "M,L",
        "prices", "10,50",
        "tags_names", "summer",
        "search", "gown",
      ],
      { routeBase: "featured" },
    );

    expect(meta.title, "the page title is wrong").toBe(
      '"gown" - Shop A - Acme - Dresses - summer - Red, Blue - M, L - 10 - 50 | Trydos',
    );
    expect(meta.description, "the boutique description was not cleaned of markup").toBe("Best shop in town");
    expect(meta.openGraph.url, "the share link is not on the page's own path").toBe(
      `${SITE}/sy-en/featured/boutiques/shop-a/categories/dresses/brands/acme/colors/ff0000,0000ff/sizes/M,L/prices/10,50/tags_names/summer/search/gown`,
    );
    expect(meta.openGraph.images[0], "the boutique banner was not the share picture").toEqual({
      url: "https://media.ramaaz.dev/upload/w_1200,h_630,c_pad/f_jpg/q_90/b.jpg",
      width: 1200,
      height: 630,
      type: "image/jpeg",
    });
    const query = JSON.stringify(io.search.mock.calls[0][0].query);
    for (const [path, value] of [
      ["custom_boutiques", "shop-a"],
      ["custom_categories", "dresses"],
      ["custom_brands", "acme"],
      ["colors", "#ff0000"],
    ]) {
      expect(query, `the label query did not ask for ${path} = ${value}`).toContain(value);
    }
    expect(cacheSpies.RedisSet, "the metadata was not cached for five minutes").toHaveBeenCalledWith(
      expect.stringContaining("meta-listing-featured-sy-en-"),
      meta,
      300,
    );
  });

  it("uses the category picture when there is no boutique banner, and the given search text first", async () => {
    io.search.mockResolvedValue(labelsAnswer({ category: { name: "Shoes", fill_photo_path: "/shoes.png" } }));

    const meta: any = await build("iq-ar", ["categories", "shoes"], { searchText: "boots" });

    expect(meta.title, "the given search text or the category is missing from the title").toBe(
      '"boots" - Shoes | ترايدوس',
    );
    expect(meta.openGraph.images[0].url, "the category picture was not the share picture").toBe(
      "https://example.com/shoes.png",
    );
  });

  it("falls back to the outline picture, then to nothing", async () => {
    io.search.mockResolvedValueOnce(labelsAnswer({ category: { name: "Bags", outline_photo_path: "/o.png" } }));
    const outline: any = await build("sy-en", ["categories", "bags"]);
    expect(outline.openGraph.images[0].url, "the outline picture was not used").toBe("https://example.com/o.png");

    io.search.mockResolvedValueOnce(labelsAnswer({ category: { name: "Bags" } }));
    const none: any = await build("sy-en", ["categories", "bags"]);
    expect(none.openGraph.images[0], "a category with no picture did not use the static share picture").toEqual({
      url: `${SITE}/opengraph-image.png`,
      width: 1200,
      height: 630,
      type: "image/png",
    });
  });

  it("uses the site name and the static picture for a page with no filters, in an unknown language too", async () => {
    const meta: any = await build("sy-xx", undefined);

    expect(io.search, "Elasticsearch was asked about a page with no filters").not.toHaveBeenCalled();
    expect(meta.title, "a page with no filters is not titled by the site name").toBe("Trydos");
    expect(meta.openGraph.url, "the share link of the bare listing is wrong").toBe(`${SITE}/sy-xx/filters/`);
    expect((cacheSpies.RedisGet.mock.calls as any[])[0][0], "the cache key of a bare listing is wrong").toBe(
      "meta-listing-filters-sy-xx-none-nosearch",
    );
  });

  it("falls back to the site name, and reports it, when the label query fails", async () => {
    io.search.mockRejectedValue(new Error("down"));

    const meta: any = await build("sy-en", ["brands", "acme"]);

    expect(meta.title, "a failed label query did not fall back to the site name").toBe("Trydos");
    expect(
      io.logServerError.mock.calls[0]?.[0]?.scenario,
      "the failed label query was not reported",
    ).toBe("Error In getMetadataLabels in serverRequest/listing");
  });
});
