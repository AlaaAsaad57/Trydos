// @vitest-environment node
//
// The product page's server-side data reader — all nine exports of
// serverRequests/product.tsx, which no test executed before this file.
//
// Everything a product page shows comes through here: which backend is asked,
// what the price and stock payload carries, what the page does when a backend
// refuses, and the search-engine metadata. A break used to render an empty page
// with nothing to say where it came from.
//
// HOW THIS FILE IS BUILT, and why each piece is the way it is:
//
//   * The module is loaded with `await import()`, never statically. A static
//     import runs the next/headers mock factory before `headers` below has
//     initialised — a TDZ ReferenceError, not a slow test. tests/setup.ts:30-32
//     documents the same hazard.
//   * `vi.resetModules()` is never called, so that import is cached and the
//     heavy utils/server barrel loads once.
//   * NEXT_PUBLIC_SITE_URL is set in `vi.hoisted()`, above the imports.
//     General_Site_Data freezes it at module load, so a beforeEach stub would be
//     dead code and the REAL staging host would end up asserted — and a failure
//     diff from this suite is copied into the CI report and sent to the team
//     chat, so a real host must never reach an assertion.
//   * The backend chooser is deliberately NOT stood in. Standing it in would
//     reduce the routing case to "the reader joins two strings". The shopper's
//     profile is seeded through the cookie stand-in instead and the real chooser
//     decides. Side effect: getMarketFetchBase prints a [MarketRouting] line per
//     call outside production. That is noise, not a fault.
//   * The search stand-in answers by INDEX, never by call order: one client.get
//     spy serves two different queries inside a single GetProductGeneralData
//     call, and one client.search spy serves two inside GetSocialInfoForProduct.
//   * The cache stand-in is swept with mockReset(), which is the only call that
//     drains a queued mockResolvedValueOnce. mockClear() does not, and neither
//     does re-applying a default.
//
// Every host here is a `.invalid` name — reserved, cannot resolve, so a request
// that escapes a stand-in dies on this machine instead of leaving it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  comments_index,
  product_interactions_index,
  share_index,
  user_interactions_index,
  views_index,
} from "services/elastic/INDEXES";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { buildGlobalProduct, buildQtyPriceProduct } from "../fixtures/product";
import { makeNextHeadersMock } from "../mocks/nextHeaders";
import { cacheSpies } from "../mocks/serverRequests";

vi.setConfig({ testTimeout: 5000, hookTimeout: 5000 });

const SITE = "https://site.invalid";
const CORE = "https://core.invalid";
const GATEWAY = "https://gateway.invalid";
const STORIES = "https://stories.invalid";

// Must beat Constants.ts, which freezes the site origin at module load.
vi.hoisted(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.invalid");
});

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);

// Answers keyed by index, refilled per case. The reader is `vi.fn`'s own
// argument, so mockReset() restores the dispatcher rather than wiping it.
let esGetAnswers: Record<string, unknown> = {};
let esSearchAnswers: Record<string, unknown> = {};
let esCountAnswer: unknown = { count: 0 };
let lastCountQuery: any = null;
let lastUserInteractionQuery: any = null;

const answerFor = (table: Record<string, unknown>, index: string, call: string) => {
  const answer = table[index];
  if (answer === undefined) {
    throw new Error(`no stand-in answer for ${call} on index "${index}"`);
  }
  if (answer instanceof Error) throw answer;
  return answer;
};

const esGet = vi.fn(async ({ index }: any) => answerFor(esGetAnswers, index, "get"));
const esSearch = vi.fn(async (query: any) => {
  if (query?.index === user_interactions_index) lastUserInteractionQuery = query;
  return answerFor(esSearchAnswers, query?.index, "search");
});
const esCount = vi.fn(async (query: any) => {
  lastCountQuery = query;
  if (esCountAnswer instanceof Error) throw esCountAnswer;
  return esCountAnswer;
});

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    get: (...args: any[]) => esGet(...(args as [any])),
    search: (...args: any[]) => esSearch(...(args as [any])),
    count: (...args: any[]) => esCount(...(args as [any])),
  },
  elasticSearchComment: {},
}));

const LogServerError = vi.fn(async () => undefined);
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: any[]) => LogServerError(...(args as [])),
  default: (...args: any[]) => LogServerError(...(args as [])),
}));

const fetchServerData = vi.fn(async (_options: any) => ({ data: { data: {} } }) as any);
vi.mock("serverRequests/ServerFetch", () => ({
  fetchServerData: (...args: any[]) => fetchServerData(...(args as [any])),
}));

const load = () => import("serverRequests/product");

/** What the fetch layer returns when a backend refuses. It never raises. */
const refusedEnvelope = (status = 500) => ({
  data: null,
  error: `HTTP ${status} refused`,
  status,
  isError: true,
  url: `${CORE}/web/product/globalDetails/test-product`,
});

/** Store a profile the way the app stores it: URL-encoded JSON. */
const seedVerifiedShopper = () =>
  headers.__reset({
    cookies: {
      // Any non-empty value that is not "0" counts as verified, so no phone
      // number is needed here and none is used.
      [COOKIE_NAMES.USER_DATA]: encodeURIComponent(
        JSON.stringify({ phone: "verified-shopper" }),
      ),
    },
  });

const recommendationAggs = (recommend: number, notRecommend: number) => ({
  aggregations: {
    recommendation_status: {
      buckets: {
        recommend: { doc_count: recommend },
        not_recommend: { doc_count: notRecommend },
      },
    },
  },
});

beforeEach(() => {
  headers.__reset();
  Object.values(cacheSpies).forEach((spy) => spy.mockReset());
  fetchServerData.mockReset();
  fetchServerData.mockResolvedValue({ data: { data: {} } } as any);
  esGet.mockReset();
  esSearch.mockReset();
  esCount.mockReset();
  LogServerError.mockReset();
  esGetAnswers = {};
  esSearchAnswers = {};
  esCountAnswer = { count: 0 };
  lastCountQuery = null;
  lastUserInteractionQuery = null;
  vi.stubEnv("BACKEND_URL", CORE);
  vi.stubEnv("GO_BACKEND_URL", GATEWAY);
  vi.stubEnv("STORIES_BACKEND_URL", STORIES);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
describe("GetCountries", () => {
  it("AC-1 serves a cached list without asking a backend", async () => {
    const cached = [{ id: 1, name: "Syria" }];
    cacheSpies.RedisGet.mockResolvedValueOnce(cached as any);

    const { GetCountries } = await load();
    const result = await GetCountries({ language: "en", country: "sy" });

    expect(result, "the cached country list was not returned").toEqual(cached);
    expect(
      fetchServerData,
      "a country list was already cached, but a backend was asked anyway",
    ).not.toHaveBeenCalled();
  });

  it("AC-2 asks the backend on a miss and keeps the answer for the next reader", async () => {
    const countries = [{ id: 1, name: "Syria" }];
    fetchServerData.mockResolvedValueOnce({ data: { data: { countries } } } as any);

    const { GetCountries } = await load();
    const result = await GetCountries({ language: "en", country: "sy" });

    expect(result, "the country list the backend sent was not returned").toEqual(
      countries,
    );
    expect(
      cacheSpies.RedisSet,
      "the country list was fetched but never written to the cache",
    ).toHaveBeenCalledWith("countries-sy-en", countries);
  });

  it("AC-3 gives an empty list when the reply carries none, and the backend was asked", async () => {
    fetchServerData.mockResolvedValueOnce({ data: { data: {} } } as any);

    const { GetCountries } = await load();
    const result = await GetCountries({ language: "en", country: "sy" });

    expect(result, "a reply with no country list did not give an empty list").toEqual(
      [],
    );
    // Without this the case passes with the stand-in never configured: the
    // reader uses full optional chaining, so `undefined` also yields [].
    expect(
      fetchServerData.mock.calls[0]?.[0]?.url,
      "the country list endpoint was never asked — the empty list proves nothing",
    ).toBe(`${CORE}/countries`);
  });
});

// ---------------------------------------------------------------------------
describe("GetGlobalProduct", () => {
  const args = { slug: "test-product", country: "sy", language: "en" };
  const slugKey = "product-slug:test-product:en:sy";
  const recordKey = "product-id-1001-sy-en-global";

  it("AC-4 serves a cached record and says it came from the cache", async () => {
    const product = buildGlobalProduct();
    cacheSpies.GetFromRedis.mockResolvedValueOnce("1001" as any);
    cacheSpies.RedisGet.mockResolvedValueOnce(product as any);

    const { GetGlobalProduct } = await load();
    const result = await GetGlobalProduct(args);

    expect(result.id, "the cached product record was not returned").toBe(1001);
    expect(
      (result as any).globalFromRedis,
      "a cached record was served but reported as a fresh read",
    ).toBe(true);
    expect(
      fetchServerData,
      "the record was already cached, but a backend was asked anyway",
    ).not.toHaveBeenCalled();
  });

  it("AC-5 reads fresh when nothing is cached and says so", async () => {
    const product = buildGlobalProduct();
    cacheSpies.GetFromRedis.mockResolvedValueOnce(null as any);
    fetchServerData.mockResolvedValueOnce({ data: { data: product } } as any);

    const { GetGlobalProduct } = await load();
    const result = await GetGlobalProduct(args);

    expect(result.id, "the product the backend sent was not returned").toBe(1001);
    expect(
      (result as any).globalFromRedis,
      "a fresh read was reported as having come from the cache",
    ).toBe(false);
  });

  it("AC-6 writes both the slug key and the record key after a fresh read", async () => {
    const product = buildGlobalProduct();
    cacheSpies.GetFromRedis.mockResolvedValueOnce(null as any);
    fetchServerData.mockResolvedValueOnce({ data: { data: product } } as any);

    const { GetGlobalProduct } = await load();
    await GetGlobalProduct(args);

    expect(
      cacheSpies.RedisSet,
      "the slug-to-id key was not written, so the next read cannot find the record",
    ).toHaveBeenCalledWith(slugKey, 1001);
    expect(
      cacheSpies.RedisSet,
      "the product record itself was not written to the cache",
    ).toHaveBeenCalledWith(recordKey, product);
  });

  it("AC-7 skips the cache read when asked, and still writes the result back", async () => {
    const product = buildGlobalProduct();
    fetchServerData.mockResolvedValueOnce({ data: { data: product } } as any);

    const { GetGlobalProduct } = await load();
    await GetGlobalProduct({ ...args, noCache: true });

    expect(
      cacheSpies.GetFromRedis,
      "skipping the cache should skip the READ, and the read happened",
    ).not.toHaveBeenCalled();
    expect(
      cacheSpies.RedisSet,
      "skipping the cache read must still keep the cache warm, and nothing was written",
    ).toHaveBeenCalledWith(recordKey, product);
  });

  it("AC-8 sends a guest to the gateway", async () => {
    cacheSpies.GetFromRedis.mockResolvedValueOnce(null as any);
    fetchServerData.mockResolvedValueOnce({
      data: { data: buildGlobalProduct() },
    } as any);

    const { GetGlobalProduct } = await load();
    await GetGlobalProduct(args);

    expect(
      fetchServerData.mock.calls[0]?.[0]?.url,
      "a guest's product request did not go to the gateway",
    ).toBe(`${GATEWAY}/web/product/globalDetails/test-product`);
  });

  it("AC-8 sends a verified shopper to the core backend", async () => {
    seedVerifiedShopper();
    cacheSpies.GetFromRedis.mockResolvedValueOnce(null as any);
    fetchServerData.mockResolvedValueOnce({
      data: { data: buildGlobalProduct() },
    } as any);

    const { GetGlobalProduct } = await load();
    await GetGlobalProduct(args);

    expect(
      fetchServerData.mock.calls[0]?.[0]?.url,
      "a verified shopper's product request did not go to the core backend",
    ).toBe(`${CORE}/web/product/globalDetails/test-product`);
  });

  it("AC-9 reports a raising cache and re-raises it", async () => {
    cacheSpies.GetFromRedis.mockRejectedValueOnce(new Error("cache is down"));

    const { GetGlobalProduct } = await load();

    await expect(
      GetGlobalProduct(args),
      "a raising cache was swallowed — the caller was told nothing went wrong",
    ).rejects.toThrow("cache is down");
    expect(
      LogServerError,
      "a raising cache was re-raised but never reported",
    ).toHaveBeenCalled();
  });

  it("AC-37 BUG-2: a refused request returns a record with no id and no signal the caller can read", async () => {
    cacheSpies.GetFromRedis.mockResolvedValueOnce(null as any);
    fetchServerData.mockResolvedValueOnce(refusedEnvelope() as any);

    const { GetGlobalProduct } = await load();
    const result = await GetGlobalProduct(args);

    // BUG-2. What SHOULD happen: the caller learns the backend refused, so it
    // can tell a dead backend from a product that does not exist. What happens:
    // the refusal envelope is never inspected, its empty data is spread, and an
    // object shaped like a product comes back carrying neither an id nor an
    // error. GetProductMeta, in this same file, checks the envelope correctly.
    // Fixed in its own ticket; if either assertion below starts failing, BUG-2
    // is fixed and this case must be updated.
    expect(
      (result as any).id,
      "BUG-2 appears fixed: a refused product read now carries an id",
    ).toBeUndefined();
    expect(
      (result as any).error,
      "BUG-2 appears fixed: a refused product read now carries an error the caller can read",
    ).toBeUndefined();
    expect(
      (result as any).globalFromRedis,
      "a refused read was not even reported as a fresh read attempt",
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe("GetProductPriceQtyDetails", () => {
  const args = { slug: "test-product", country: "sy", language: "en" };

  it("AC-10 serves a cached payload and says it came from the cache", async () => {
    const payload = buildQtyPriceProduct();
    cacheSpies.GetFromRedis.mockResolvedValueOnce("1001" as any);
    cacheSpies.RedisGet.mockResolvedValueOnce(payload as any);

    const { GetProductPriceQtyDetails } = await load();
    const result = await GetProductPriceQtyDetails(args);

    expect(
      (result as any).qtyPricesDataFromRedis,
      "a cached price payload was served but reported as a fresh read",
    ).toBe(true);
    expect(
      fetchServerData,
      "the price payload was already cached, but a backend was asked anyway",
    ).not.toHaveBeenCalled();
  });

  it("AC-11 keeps price, offer price, variants and available quantity on a fresh read", async () => {
    const payload = buildQtyPriceProduct();
    cacheSpies.GetFromRedis.mockResolvedValueOnce(null as any);
    fetchServerData.mockResolvedValueOnce({ data: { data: payload } } as any);

    const { GetProductPriceQtyDetails } = await load();
    const result = await GetProductPriceQtyDetails(args);

    expect(result.price, "the price the backend sent did not survive the read").toBe(
      100,
    );
    expect(
      result.offer_price,
      "the offer price the backend sent did not survive the read",
    ).toBe(80);
    expect(
      result.available_quantity,
      "the available quantity did not survive the read — stock would be shown wrong",
    ).toBe(5);
    expect(
      result.variations,
      "the variant list did not survive the read",
    ).toEqual(payload.variations);
  });

  it("AC-12 reports a raising cache and returns nothing, unlike the main record read", async () => {
    cacheSpies.GetFromRedis.mockRejectedValueOnce(new Error("cache is down"));

    const { GetProductPriceQtyDetails } = await load();
    const result = await GetProductPriceQtyDetails(args);

    expect(
      result,
      "a raising cache should leave the price read with nothing to return",
    ).toBeUndefined();
    expect(
      LogServerError,
      "a raising cache was swallowed by the price read and never reported",
    ).toHaveBeenCalled();
  });

  it("AC-38 BUG-2: a refused request returns the price payload hollow, with no signal", async () => {
    cacheSpies.GetFromRedis.mockResolvedValueOnce(null as any);
    fetchServerData.mockResolvedValueOnce(refusedEnvelope() as any);

    const { GetProductPriceQtyDetails } = await load();
    const result = await GetProductPriceQtyDetails(args);

    // BUG-2, on the payload that carries the price. See AC-37.
    //
    // This positive assertion comes first on purpose: the three below all check
    // for `undefined`, and every one of them would also pass if the reader had
    // returned nothing at all. Proving an object came back is what stops this
    // case passing for the wrong reason.
    expect(
      (result as any)?.qtyPricesDataFromRedis,
      "no price payload came back at all, so the three checks below prove nothing",
    ).toBe(false);
    expect(
      (result as any).id,
      "BUG-2 appears fixed: a refused price read now carries an id",
    ).toBeUndefined();
    expect(
      (result as any).price,
      "BUG-2 appears fixed: a refused price read now carries a price",
    ).toBeUndefined();
    expect(
      (result as any).error,
      "BUG-2 appears fixed: a refused price read now carries an error the caller can read",
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
describe("GetProductMeta", () => {
  const args = {
    slug: "test-product",
    language: "en",
    country: "sy",
    searchParams: {} as any,
  };

  const metaProduct = (overrides: Record<string, unknown> = {}) => ({
    name: "Test Product",
    details: "A short one.",
    images: [],
    ...overrides,
  });

  it("AC-13 reports a product the backend does not have as not found", async () => {
    fetchServerData.mockResolvedValueOnce({ status: 404 } as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta(args);

    expect(
      (result as any)?.productNotFound,
      "a 404 from the metadata backend was not reported as a missing product",
    ).toBe(true);
  });

  it("AC-14 does not report a refused request as not found", async () => {
    fetchServerData.mockResolvedValueOnce(refusedEnvelope() as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta(args);

    expect(
      (result as any)?.productNotFound,
      "the metadata backend refused, and a working product was reported as missing",
    ).toBeUndefined();
    expect(
      LogServerError,
      "the metadata backend refused and the fault was never reported",
    ).toHaveBeenCalled();
  });

  it("AC-15 puts a chosen colour and size in the title", async () => {
    fetchServerData.mockResolvedValueOnce({
      data: { data: metaProduct() },
    } as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta({
      ...args,
      searchParams: { color: "black", size: "M" },
    });

    expect(
      String((result as any)?.title),
      "the chosen colour is missing from the metadata title",
    ).toContain("black");
    expect(
      String((result as any)?.title),
      "the chosen size is missing from the metadata title",
    ).toContain("M");
  });

  it("AC-16 appends brand and category to the title when the product has them", async () => {
    fetchServerData.mockResolvedValueOnce({
      data: { data: metaProduct({ brand: "Test Brand", category: "Shoes" }) },
    } as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta(args);

    expect(
      String((result as any)?.title),
      "the brand was not appended to a bare product name",
    ).toContain("Test Brand");
    expect(
      String((result as any)?.title),
      "the category was not appended to a bare product name",
    ).toContain("Shoes");
  });

  it("AC-17 replaces a description too short to be useful", async () => {
    fetchServerData.mockResolvedValueOnce({
      data: { data: metaProduct({ details: "milk" }) },
    } as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta(args);

    expect(
      String((result as any)?.description),
      "a one-word description was left as the metadata description",
    ).not.toBe("milk");
    expect(
      String((result as any)?.description),
      "the built fallback sentence does not name the product",
    ).toContain("Test Product");
  });

  it("AC-17 keeps a real description as it is", async () => {
    const real =
      "A properly written product description that runs well past the sixty " +
      "character mark and should therefore be kept exactly as it is.";
    fetchServerData.mockResolvedValueOnce({
      data: { data: metaProduct({ details: real }) },
    } as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta(args);

    expect(
      (result as any)?.description,
      "a real product description was replaced by the built fallback sentence",
    ).toBe(real);
  });

  it("AC-18 falls back to the site image when the product has no picture", async () => {
    fetchServerData.mockResolvedValueOnce({
      data: { data: metaProduct({ images: [] }) },
    } as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta(args);

    expect(
      (result as any)?.openGraph?.images?.[0]?.url,
      "a product with no picture did not fall back to the site image",
    ).toBe(`${SITE}/opengraph-image.png`);
  });

  it("AC-19 serves cached metadata without asking the backend", async () => {
    cacheSpies.RedisGet.mockResolvedValueOnce({ title: "Cached Title" } as any);

    const { GetProductMeta } = await load();
    const result = await GetProductMeta(args);

    expect((result as any)?.title, "the cached metadata was not returned").toBe(
      "Cached Title",
    );
    expect(
      (result as any)?.metaFromRedis,
      "cached metadata was served but reported as freshly built",
    ).toBe(true);
    expect(
      fetchServerData,
      "metadata was already cached, but the backend was asked anyway",
    ).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe("GetProductGeneralData", () => {
  it("AC-20 returns the empty shape without asking anything when there is no product id", async () => {
    const { GetProductGeneralData } = await load();
    const result = await GetProductGeneralData({ id: undefined });

    expect(
      result?.total_views,
      "a request with no product id did not return the empty shape",
    ).toBe(0);
    expect(
      esGet,
      "a request with no product id still went to the search server",
    ).not.toHaveBeenCalled();
  });

  it("AC-21 turns the star spread into rating groups with their counts", async () => {
    esGetAnswers[product_interactions_index] = {
      _source: { final_rating: 4.5, star_distribution: { star_1: 2, star_5: 7 } },
    };
    esGetAnswers[views_index] = { _source: { view_count: 9 } };
    esSearchAnswers[comments_index] = recommendationAggs(3, 1);

    const { GetProductGeneralData } = await load();
    const result = await GetProductGeneralData({ id: "1001" });

    expect(
      result?.ratingDetails,
      "the star spread was not turned into rating groups with their counts",
    ).toEqual([
      { ratingGroup: "1", count: 2 },
      { ratingGroup: "5", count: 7 },
    ]);
  });

  it("AC-22 counts a product with no view record as zero views, and does not report it", async () => {
    esGetAnswers[product_interactions_index] = {
      _source: { final_rating: 4, star_distribution: {} },
    };
    // A missing view record is an ordinary state. The reader suppresses the
    // report only for a 404, so the rejection has to carry that status —
    // a plain Error would still be reported and this case would fail for the
    // wrong reason.
    esGetAnswers[views_index] = Object.assign(new Error("not found"), {
      statusCode: 404,
    });
    esSearchAnswers[comments_index] = recommendationAggs(0, 0);

    const { GetProductGeneralData } = await load();
    const result = await GetProductGeneralData({ id: "1001" });

    expect(
      result?.total_views,
      "a product with no view record did not count as zero views",
    ).toBe(0);
    expect(
      LogServerError,
      "a product simply having no view record yet was reported as a fault",
    ).not.toHaveBeenCalled();
  });

  it("AC-23 BUG-1: a failed ratings query leaves the fallback figures unreachable", async () => {
    // The ratings query fails while views and recommendations succeed — which
    // is why the search stand-in answers by index rather than by call order.
    esGetAnswers[product_interactions_index] = new Error("search server is down");
    esGetAnswers[views_index] = { _source: { view_count: 9 } };
    esSearchAnswers[comments_index] = recommendationAggs(1, 1);

    const { GetProductGeneralData } = await load();
    const result = await GetProductGeneralData({ id: "1001" });

    // BUG-1. What SHOULD happen: the reader falls back to zeros, so
    // final_rating is 0 and size_analysis is null. What happens: the fallback
    // is built wrapped in a `_source` key while the caller reads the unwrapped
    // shape, so none of those values is reachable and undefined comes through.
    // Fixed in its own ticket; if these start failing, BUG-1 is fixed and this
    // case must be updated.
    expect(
      result?.final_rating,
      "BUG-1 appears fixed: the ratings fallback now reaches the caller as a rating",
    ).toBeUndefined();
    expect(
      result?.size_analysis,
      "BUG-1 appears fixed: the ratings fallback now reaches the caller as a size analysis",
    ).toBeUndefined();
    expect(
      result?.total_views,
      "the views query should be unaffected by a failed ratings query",
    ).toBe(9);
  });
});

// ---------------------------------------------------------------------------
describe("GetRecommendationCountForProduct", () => {
  it("AC-24 works the percentages out from the two totals", async () => {
    esSearchAnswers[comments_index] = recommendationAggs(3, 1);

    const { GetRecommendationCountForProduct } = await load();
    const result = await GetRecommendationCountForProduct({ product_id: "1001" });

    expect(
      result.stats.find((s: any) => s.category === "recommend")?.percentage,
      "the recommend share was not worked out from the two totals",
    ).toBe("75");
    expect(
      result.stats.find((s: any) => s.category === "not_recommend")?.percentage,
      "the not-recommend share was not worked out from the two totals",
    ).toBe("25");
    expect(
      result.total_buyers,
      "the buyer total is not the sum of the two totals",
    ).toBe(4);
  });

  it("AC-25 gives zero rather than dividing by zero when nobody has rated", async () => {
    esSearchAnswers[comments_index] = recommendationAggs(0, 0);

    const { GetRecommendationCountForProduct } = await load();
    const result = await GetRecommendationCountForProduct({ product_id: "1001" });

    expect(
      result.stats.find((s: any) => s.category === "recommend")?.percentage,
      "a product nobody rated did not give a zero recommend share",
    ).toBe("0");
    expect(
      result.total_buyers,
      "a product nobody rated did not give a zero buyer total",
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
describe("GetSocialInfoForProduct", () => {
  it("AC-26 gathers likes, comments and shares from their three sources", async () => {
    esGetAnswers[product_interactions_index] = {
      _source: { total_likes: 12, total_comments: 4 },
    };
    esSearchAnswers[share_index] = {
      hits: { hits: [{ _source: { shared_count: 6 } }] },
    };
    esSearchAnswers[user_interactions_index] = { hits: { hits: [] } };
    esCountAnswer = { count: 4 };

    const { GetSocialInfoForProduct } = await load();
    const result = await GetSocialInfoForProduct({ productId: "1001", userId: undefined });

    expect(result.total_likes, "the like count did not come back").toBe(12);
    expect(
      result.total_shares,
      "the share count did not come back from the share index",
    ).toBe(6);
    expect(
      result.total_comments,
      "the comment count did not come back from the comment index",
    ).toBe(4);
  });

  it("AC-27 reads this shopper's like from their most recent interaction", async () => {
    esGetAnswers[product_interactions_index] = {
      _source: { total_likes: 12, total_comments: 4 },
    };
    esSearchAnswers[share_index] = { hits: { hits: [] } };
    // Newest first, as the sort asks for. The older one says the shopper had
    // unliked; only the newest may decide.
    esSearchAnswers[user_interactions_index] = {
      hits: {
        hits: [
          { _source: { status: "active" } },
          { _source: { status: "deleted" } },
        ],
      },
    };
    esCountAnswer = { count: 4 };

    const { GetSocialInfoForProduct } = await load();
    const result = await GetSocialInfoForProduct({ productId: "1001", userId: "77" });

    expect(
      result.is_liked,
      "the shopper's most recent interaction says liked, and the answer says otherwise",
    ).toBe(true);
    // A single-hit fixture would prove only "reads a hit". Newest-first has to
    // have been asked for, or "most recent" is not what was read.
    expect(
      lastUserInteractionQuery?.body?.sort,
      "the interaction search did not ask for newest first, so 'most recent' is not proved",
    ).toEqual([{ interaction_date: { order: "desc" } }]);
  });
});

// ---------------------------------------------------------------------------
describe("GetProductCommentsCount", () => {
  it("AC-28 leaves out deleted comments and order ratings, shown by the query sent", async () => {
    esCountAnswer = { count: 7 };

    const { GetProductCommentsCount } = await load();
    const result = await GetProductCommentsCount({ productId: "1001" });

    expect(result.total, "the comment count did not come back").toBe(7);
    // The count itself comes from the stand-in, so asserting 7 proves nothing
    // about what was excluded. The query is the only evidence.
    const mustNot = lastCountQuery?.query?.bool?.must_not ?? [];
    expect(
      mustNot,
      "the comment count did not exclude deleted comments",
    ).toContainEqual({ term: { status: "deleted" } });
    expect(
      mustNot,
      "the comment count did not exclude order ratings",
    ).toContainEqual({ exists: { field: "order_details_id" } });
    expect(
      lastCountQuery?.index,
      "the comment count asked the wrong index",
    ).toBe(comments_index);
  });
});

// ---------------------------------------------------------------------------
describe("GetProductStoriesData", () => {
  const storiesReply = (stories: any[]) => ({
    data: { data: { data: stories } },
  });

  it("AC-29 sends the stories credential when the shopper has one", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.STORIES_TOKEN]: "stories-credential-for-tests" },
    });
    fetchServerData.mockResolvedValueOnce(storiesReply([]) as any);

    const { GetProductStoriesData } = await load();
    await GetProductStoriesData({ page: 1, productId: "1001" });

    expect(
      fetchServerData.mock.calls[0]?.[0]?.headers?.Authorization,
      "a signed-in shopper's stories request went out with no credential",
    ).toBeDefined();
  });

  it("AC-29 sends no credential for a guest", async () => {
    fetchServerData.mockResolvedValueOnce(storiesReply([]) as any);

    const { GetProductStoriesData } = await load();
    await GetProductStoriesData({ page: 1, productId: "1001" });

    expect(
      fetchServerData.mock.calls[0]?.[0]?.headers?.Authorization,
      "a guest's stories request carried a credential it should not have",
    ).toBeUndefined();
  });

  it("AC-30 gives empty lists when the stories request is refused", async () => {
    fetchServerData.mockResolvedValueOnce(refusedEnvelope() as any);

    const { GetProductStoriesData } = await load();
    const result = await GetProductStoriesData({ page: 1, productId: "1001" });

    expect(
      result.data,
      "a refused stories request did not give an empty list",
    ).toEqual([]);
    expect(
      result.stories,
      "a refused stories request did not give an empty story list",
    ).toEqual([]);
  });

  it("AC-31 marks a group as new when any story in it is unseen", async () => {
    fetchServerData.mockResolvedValueOnce(
      storiesReply([
        {
          id: 1,
          stories: [{ is_seen: true, photo_path: "a.jpg" }, { is_seen: false }],
        },
      ]) as any,
    );

    const { GetProductStoriesData } = await load();
    const result = await GetProductStoriesData({ page: 1, productId: "1001" });

    expect(
      result.stories[0]?.has_new,
      "a group holding an unseen story was not marked as new",
    ).toBe(true);
  });

  it("AC-31 leaves a group unmarked when every story in it is seen", async () => {
    fetchServerData.mockResolvedValueOnce(
      storiesReply([
        { id: 1, stories: [{ is_seen: true, photo_path: "a.jpg" }] },
      ]) as any,
    );

    const { GetProductStoriesData } = await load();
    const result = await GetProductStoriesData({ page: 1, productId: "1001" });

    expect(
      result.stories[0]?.has_new,
      "a group whose stories were all seen was still marked as new",
    ).toBe(false);
  });
});
