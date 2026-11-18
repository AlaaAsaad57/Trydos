// @vitest-environment node
//
// Photo search by vector: the kNN query sent to the catalogue (search
// backend), and how its hits become result cards. The rules here were each
// checked against the staging index first; see the header of
// services/elastic/similarProducts.ts.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {},
  elasticSearchComment: {},
}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: vi.fn() }));

import {
  buildSimilarProductsQuery,
  colorOfImage,
  DEFAULT_MIN_SIMILARITY,
  minSimilarity,
  readPhotoSearchFilters,
  toPhotoSearchChips,
  toSimilarProducts,
} from "services/elastic/similarProducts";

const vector = Array.from({ length: 768 }, (_, i) => (i === 0 ? 1 : 0));

afterEach(() => vi.unstubAllEnvs());

describe("the photo search query", () => {
  const query = buildSimilarProductsQuery({ vector, country: "sy" }) as any;
  const text = JSON.stringify(query.knn.filter);

  it("searches the nested photo vectors with the shopper's vector", () => {
    expect(query.knn.field, "the query does not search the photo vectors").toBe("color_image_vectors.vector");
    expect(query.knn.query_vector, "the shopper's vector was not sent").toBe(vector);
    expect(query.knn.k, "kNN must return as many products as the page shows").toBe(query.size);
    expect(query.knn.num_candidates, "num_candidates must be well above k").toBeGreaterThanOrEqual(query.size * 10);
  });

  it("re-scores with the full vectors, because the 8-bit index alone ranked a wrong product first", () => {
    expect(query.knn.rescore_vector?.oversample, "rescore_vector is missing").toBeGreaterThanOrEqual(2);
  });

  it("filters with the shopper rules during the search, nested rules included", () => {
    expect(text, "inactive products are not filtered out").toContain('"status":1');
    expect(text, "deleted products are not filtered out").toContain('"deleted_at"');
    expect(text, "closed boutiques are not filtered out").toContain('"boutique.status"');
    expect(text, "closed brands are not filtered out").toContain('"brand.status"');
    expect(text, "unapproved seller products are not filtered out").toContain('"seller_status":"approved"');
    expect(text, "products blocked in the shopper's country are not filtered out").toContain('"countries_iso.iso":"SY"');
    expect(query.post_filter, "a post_filter drops results after the top k were picked").toBeUndefined();
  });

  it("never downloads the vectors", () => {
    expect(Array.isArray(query._source), "_source must list fields, not return everything").toBe(true);
    expect(query._source.some((f: string) => f.startsWith("color_image_vectors")), "the vectors are in _source").toBe(false);
    expect(query.knn.inner_hits._source, "inner_hits must return the photo name only").toEqual(["color_image_vectors.image"]);
  });

  it("drops weak matches at the default cosine floor, or the env value", () => {
    expect(query.knn.similarity, "the default floor is not used").toBe(DEFAULT_MIN_SIMILARITY);
    vi.stubEnv("IMAGE_SEARCH_MIN_SIMILARITY", "0.8");
    expect(minSimilarity(), "the env floor is not used").toBe(0.8);
    vi.stubEnv("IMAGE_SEARCH_MIN_SIMILARITY", "abc");
    expect(minSimilarity(), "a broken env value must fall back to the default").toBe(DEFAULT_MIN_SIMILARITY);
    vi.stubEnv("IMAGE_SEARCH_MIN_SIMILARITY", "5");
    expect(minSimilarity(), "a cosine above 1 must fall back to the default").toBe(DEFAULT_MIN_SIMILARITY);
  });
});

describe("the photo search query with shopper filters", () => {
  const filters = {
    categories: ["dresses-4"],
    brands: ["new-brand-4"],
    boutiques: ["fashion-Clothes-5"],
    colors: ["000000"],
    sizes: ["S"],
    priceRange: [9, 55] as [number, number],
  };
  const text = JSON.stringify((buildSimilarProductsQuery({ vector, country: "sy", filters }) as any).knn.filter);

  it.each([
    ["category", '"custom_categories.slug.keyword":["dresses-4"]'],
    ["brand", '"custom_brands.slug.keyword":["new-brand-4"]'],
    ["boutique", '"custom_boutiques.slug.keyword":["fashion-Clothes-5"]'],
    ["color", '"text_colors":"000000"'],
    ["size", '"available_size":"S"'],
    ["price in the shopper's country", '"country_offer_prices.country_iso":"SY"'],
    ["price range", '"gte":9,"lte":55'],
  ])("puts the %s filter inside knn.filter", (_name, part) => {
    expect(text, `the filter part ${part} is missing from knn.filter`).toContain(part);
  });

  it("keeps the shopper rules beside the filters", () => {
    expect(text, "the country block was lost when filters were added").toContain('"countries_iso.iso":"SY"');
    expect(text, "the active-product rule was lost when filters were added").toContain('"status":1');
  });
});

describe("the chip aggregations of the photo search query", () => {
  const filters = { categories: ["dresses-4"], brands: ["new-brand-4"] };
  const query = buildSimilarProductsQuery({ vector, country: "sy", language: "tr", filters }) as any;

  it("counts the chips over the kNN products only, with no condition of their own", () => {
    // With a top-level knn the aggregations see only the top k products; an
    // extra condition here could only drop chips of products on the screen.
    expect(query.aggs?.filtered_results?.filter, "the chip aggregation is missing").toEqual({ bool: { must: [], must_not: [] } });
    expect(query.aggs?.child_results?.filter, "the sub-category aggregation is missing").toEqual({ match_all: {} });
  });

  it("asks for the chips in the shopper's language", () => {
    expect(JSON.stringify(query.aggs.filtered_results), "brand chips are not in the shopper's language").toContain('"custom_brands.language_code":"tr"');
    expect(JSON.stringify(query.aggs.child_results), "sub-category chips are not in the shopper's language").toContain('"custom_categories.language_code":"tr"');
  });

  it("keeps the shopper rules on the related categories, which read the whole index", () => {
    const related = JSON.stringify(query.aggs.global_related_scope?.aggs?.related_filtered_results?.filter);
    expect(related, "related categories could show products blocked in the country").toContain('"countries_iso.iso":"SY"');
    expect(related, "related categories could show inactive products").toContain('"status":1');
    expect(related, "related categories lost the brand filter").toContain('"custom_brands.slug.keyword":["new-brand-4"]');
    expect(related, "related categories must not keep the category filter, as in text search").not.toContain("dresses-4");
  });
});

describe("toPhotoSearchChips", () => {
  const brand = (key: number, slug: string) => ({
    key,
    brand_details: { hits: { hits: [{ _source: { name: slug, slug, icon: "" } }] } },
  });

  it("reads the brand chips from the kNN aggregation", () => {
    const chips = toPhotoSearchChips({
      filtered_results: { top_brands: { filtered_brands: { brands_by_id: { buckets: [brand(1, "nike-1"), brand(2, "zara-2")] } } } },
    });
    expect(chips.brands.map((b: any) => b.slug), "the brand chips are not the kNN products' brands").toEqual(["nike-1", "zara-2"]);
  });

  it("gives empty lists for an answer with no aggregations", () => {
    const chips = toPhotoSearchChips(undefined);
    expect(chips, "a missing aggregation must give empty chip lists").toEqual({
      brands: [],
      boutiques: [],
      categories: [],
      related_categories: [],
    });
  });
});

describe("readPhotoSearchFilters", () => {
  it("reads the six known filters from the form text", () => {
    const read = readPhotoSearchFilters(
      JSON.stringify({ categories: ["a"], brands: ["b"], boutiques: ["c"], colors: ["000000"], sizes: ["S"], priceRange: [1, 5] }),
    );
    expect(read, "a valid filter set was changed").toEqual({
      categories: ["a"], brands: ["b"], boutiques: ["c"], colors: ["000000"], sizes: ["S"], priceRange: [1, 5],
    });
  });

  it("drops unknown names, wrong types, empty and long values", () => {
    const read = readPhotoSearchFilters(
      JSON.stringify({ search_text: "x", brands: ["", 5, "b", "x".repeat(101)], colors: "000000", featured: true }),
    );
    expect(read, "a value that is not a short text in a list was kept").toEqual({ brands: ["b"] });
  });

  it("keeps at most 30 values in a list", () => {
    const read = readPhotoSearchFilters({ sizes: Array.from({ length: 40 }, (_, i) => `s${i}`) });
    expect(read.sizes?.length === 30 && read.sizes[29] === "s29", "a list longer than 30 was not cut to the first 30").toBe(true);
  });

  it.each([
    ["one number", [5]],
    ["highest below lowest", [9, 1]],
    ["a negative price", [-1, 5]],
    ["text", ["1", "5"]],
    ["not finite", [0, null]],
  ])("drops a price range with %s", (_name, priceRange) => {
    expect(readPhotoSearchFilters({ priceRange }).priceRange, `the price range ${JSON.stringify(priceRange)} was kept`).toBeUndefined();
  });

  it.each([["broken JSON", "{"], ["a list", "[1]"], ["nothing", null], ["a number", 5]])(
    "gives no filters for %s",
    (_name, raw) => {
      expect(readPhotoSearchFilters(raw), `${String(raw)} gave filters`).toEqual({});
    },
  );
});

const sync = JSON.stringify([
  { color_name: "Black", images: ["black-1.jpg", "black-2.jpg"] },
  { color_name: "Blue", images: ["blue-1.jpg"] },
]);

describe("colorOfImage", () => {
  it("finds the color whose photo list holds the photo", () => {
    expect(colorOfImage(sync, "blue-1.jpg"), "the matched photo's color was not found").toBe("Blue");
    expect(colorOfImage(JSON.parse(sync), "black-2.jpg"), "an array form was not read").toBe("Black");
  });
  it("gives nothing for an unknown photo or broken data", () => {
    expect(colorOfImage(sync, "other.jpg"), "an unknown photo got a color").toBeUndefined();
    expect(colorOfImage("not json", "blue-1.jpg"), "broken data got a color").toBeUndefined();
    expect(colorOfImage(sync, undefined), "no photo got a color").toBeUndefined();
  });
});

const hit = (id: number, score: number, image: string, languages = ["en"]) => ({
  _id: String(id),
  _score: score,
  _source: {
    id,
    images: JSON.stringify(["black-1.jpg", "blue-1.jpg"]),
    colors: [{ name: "Black" }, { name: "Blue" }],
    sync_color_images: sync,
    offered_price: 10,
    unit_price: 12,
    custom_products: languages.map((language_code) => ({
      product_id: id,
      name: `product ${id} ${language_code}`,
      slug: `product-${id}`,
      language_code,
    })),
  },
  inner_hits: {
    color_image_vectors: { hits: { hits: [{ _source: { image } }] } },
  },
});

describe("toSimilarProducts", () => {
  const products = toSimilarProducts([hit(7, 0.99, "blue-1.jpg"), hit(3, 0.9, "black-2.jpg")], "en", "sy");

  it("keeps the search order, best match first", () => {
    expect(products.map((p) => p.product_id), "the order changed").toEqual([7, 3]);
  });

  it("shows the photo that matched, and opens on its color", () => {
    expect(products[0].images[0]?.file_path, "the card does not show the matched photo").toBe("/product/blue-1.jpg");
    expect(products[0].color, "the card does not carry the matched photo's color").toBe("Blue");
    expect(products[1].color, "the second card has the wrong color").toBe("Black");
  });

  it("turns the score back into the cosine", () => {
    expect(products[0].similarity, "the cosine is wrong: _score is (1 + cosine) / 2").toBeCloseTo(0.98, 5);
  });

  it("uses the shopper's language, and drops a product with no text in it", () => {
    const ar = toSimilarProducts([hit(7, 0.99, "blue-1.jpg", ["en"]), hit(3, 0.9, "black-2.jpg", ["en", "ar"])], "ar", "sy");
    expect(ar.map((p) => p.product_id), "a product with no Arabic text was kept").toEqual([3]);
    expect(ar[0].name, "the Arabic name was not used").toBe("product 3 ar");
  });

  it("falls back to the first photo when no photo matched", () => {
    const [p] = toSimilarProducts([{ ...hit(7, 0.9, "x.jpg"), inner_hits: undefined }], "en", "sy");
    expect(p.images[0]?.file_path, "no fallback photo was shown").toBe("/product/black-1.jpg");
  });
});
