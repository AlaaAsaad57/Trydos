// @vitest-environment node
//
// The search execution layer: the request the app sends to the search server,
// the answer it builds from the reply, and what it does when the server refuses.
//
// Three exported entry points, nine callers between them, and no test until now.
// Everything here drives the real code — the query-building helpers stay real,
// because half the criteria are about a decision those helpers encode. Only four
// seams are stood in: the search client, the text analyzer, the error reporter,
// and the one helper that reaches for request headers.
//
// NOTES THAT COST TIME TO LEARN. Read these before changing anything.
//
//   * The answers are routed PER CALL, not per index. Three flows read the
//     catalog index more than once, and the main listing query and the related
//     search differ only by `track_total_hits` (`elasticSearch.ts:309` vs
//     `:1109`). `markerOf` below is the whole of that decision. An unrouted call
//     throws by name, so a wrong marker fails as itself instead of as
//     "Search failed:".
//   * Both replies AND queries are deep-copied. The unit writes INTO the reply
//     it is given — the card builder assigns the fixture's own brand object and
//     then sets `is_verified` on it (`helpers.ts:466-470`) — and it mutates the
//     query after the call on the retry path (`:204`).
//   * `beforeEach` resets the answer tables as well as the spies. `mockReset()`
//     only restores `vi.fn`'s own argument; a leftover answer would serve a call
//     the current case never routed, and the cases would depend on their order.
//   * The environment is pinned in `vi.hoisted()`. The two listing flags are read
//     ONCE at module load (`:151`, `:159`) and are `true` in `.env.development`.
//     The runner does not load that file today, so the pin is what stops that
//     from being luck. NEVER add `vi.resetModules()` — it would re-read the flags
//     after the stubs are gone.
//   * This file deliberately differs from its model, `tests/serverRequests/
//     product.test.ts`, in two places: it pins a closed loopback port rather than
//     a reserved `.invalid` host (faster behind a proxy, and this machine has
//     one), and it does NOT call `vi.unstubAllEnvs()` (the flags are read at
//     module load, so the pin only has to survive the first import). Do not
//     "fix" either to match the model.
//   * If the `logSearchTerm` stand-in ever stops applying, the real one runs,
//     `client.index` is missing from the stand-in, and it rethrows out of an
//     un-awaited call (`helpers.ts:2958-2960`) — an unhandled rejection charged
//     to whichever case happens to be running. That is the shape of the failure;
//     it is not a flake.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  catalog_index,
  recommendation_cold_index,
  recommendation_index,
} from "services/elastic/INDEXES";

vi.setConfig({ testTimeout: 5000, hookTimeout: 5000 });

// Above the imports on purpose: the unit reads both flags at module load.
vi.hoisted(() => {
  vi.stubEnv("ELASTIC_LISTING_PIT", "false");
  vi.stubEnv("LISTING_PRICE_AGG_ENABLED", "false");
  // Closed loopback port: if the client stand-in ever misses, the call fails at
  // once and locally instead of reaching a real cluster. The search client's own
  // transport is not global `fetch`, so the fake network may not catch it.
  vi.stubEnv("ELASTICSEARCH_NODE", "http://127.0.0.1:1");
  vi.stubEnv("ELASTICSEARCH_USERNAME", "not-a-real-user");
  vi.stubEnv("ELASTICSEARCH_PASSWORD", "not-a-real-password");
  vi.stubEnv("CEREBRAS_API_KEY", "not-a-real-key");
});

// The real helpers module imports next/headers at its second line.
vi.mock("next/headers", () => ({ headers: () => new Map() }));

// ---------------------------------------------------------------- the client

/** Answers for this case, keyed by the marker `markerOf` gives a query. */
let answers: Record<string, unknown> = {};
/** The query each marker was actually sent, deep-copied at the moment of the call. */
let sent: Record<string, any> = {};

/**
 * Which call this is. Index alone cannot tell three of the flows apart, and
 * `size` collides too — for a facets-only request the main query is `size: 0`
 * like the children query. These are the fields that really separate them.
 */
function markerOf(query: any): string {
  const index = query?.index;
  if (index === recommendation_index) return "rec-user";
  if (index === recommendation_cold_index) return "rec-cold";
  if (index !== catalog_index) return `unrouted-index:${String(index)}`;

  // `{ index, size: 1, query: { term: { id } } }` — the related-products lookup.
  if (query?.query?.term?.id !== undefined) return "related-lookup";
  // The related search asks for a real total; the listing sends false or 10000.
  if (query?.track_total_hits === true) return "related-search";
  // The children aggregation carries no track_scores, no sort and no _source.
  if (query?.aggs && query?.track_scores === undefined) return "children";
  // The recommendation batch asks for a fixed id list and nothing else.
  const must = query?.query?.bool?.must;
  if (Array.isArray(must) && must.some((c: any) => c?.terms?.id)) return "rec-batch";
  return "listing";
}

const esSearch = vi.fn(async (query: any) => {
  const marker = markerOf(query);
  sent[marker] = structuredClone(query);
  if (!(marker in answers)) {
    throw new Error(`no stand-in answer for ${marker}`);
  }
  const answer = answers[marker];
  if (answer instanceof Error) throw answer;
  return structuredClone(answer);
});

const esOpenPit = vi.fn(async (_options?: any) => ({ id: "pit-should-not-be-used" }));

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    search: (...args: any[]) => esSearch(...(args as [any])),
    openPointInTime: (...args: any[]) => esOpenPit(...(args as [any])),
  },
  elasticSearchComment: {},
}));

// ------------------------------------------------------------ the other seams

const analyze = vi.fn(async (_text: string) => ({}) as any);
vi.mock("services/elastic/analyzeSearchTextCerebras", () => ({
  default: (...args: any[]) => analyze(...(args as [string])),
}));

const LogServerError = vi.fn(async (_payload?: any) => undefined);
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: any[]) => LogServerError(...(args as [any])),
  default: (...args: any[]) => LogServerError(...(args as [any])),
}));

// Only the recorder is replaced. Every other helper stays real, including
// getChildrenAndGrandchildren, which runs its own search (routed as "children").
const logSearchTerm = vi.fn(async (_payload?: any) => undefined);
vi.mock("services/elastic/helpers", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  logSearchTerm: (...args: any[]) => logSearchTerm(...(args as [any])),
}));

// --------------------------------------------------------------- the fixtures

/** One product document, in the shape the index really returns. */
const product = (over: Record<string, any> = {}) => ({
  id: 11,
  unit_price: 120,
  offered_price: 100,
  current_stock: "5",
  boutique_id: 9,
  images: ["a.jpg"],
  colors: [],
  sync_color_images: [],
  thumbnail: "t.jpg",
  custom_products: [
    { id: 501, product_id: 11, language_code: "en", name: "Blue shirt", slug: "blue-shirt" },
  ],
  ...over,
});

const hit = (source: any, sort: any[] = [1]) => ({ _source: source, sort });

/** A grid-only reply: hits and a total, no aggregations. */
const gridReply = (hits: any[] = [hit(product())], total = 1) => ({
  hits: { hits, total: { value: total } },
});

/**
 * A facet reply. Built fresh per case on purpose — the unit writes into it.
 *
 * `categories_by_id.buckets` must be PRESENT: it is the one bucket array read
 * with no guard (`elasticSearch.ts:559-563`). Empty is fine and is what we want,
 * because a half-built bucket would throw inside processCategoriesAggregation
 * (`helpers.ts:2585`) and every facet case would fail as "Search failed:"
 * instead of by its own name. Keeping the related list empty also keeps the
 * unguarded enum reads at `:704-705` from ever running.
 */
const facetReply = (hits: any[] = [hit(product())], total = 1) => ({
  hits: { hits, total: { value: total } },
  aggregations: {
    filtered_results: {
      top_categories: { filtered_categories: { categories_by_id: { buckets: [] } } },
    },
  },
});

/** The children aggregation's own reply. Its result is read with no guard. */
const childrenReply = () => ({ aggregations: { filtered_results: {} } });

const load = async () => await import("services/elastic/elasticSearch");

beforeEach(() => {
  answers = {};
  sent = {};
  esSearch.mockReset();
  esOpenPit.mockReset();
  analyze.mockReset();
  LogServerError.mockReset();
  logSearchTerm.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// FR-1, FR-2, FR-3 — the request matches the ask
// ===========================================================================

describe("the request the listing search sends", () => {
  it("AC-1 asks the catalog index", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    await getProductsAndFiltersFromElastic({ noFilters: true });

    expect(
      sent.listing.index,
      "the listing search did not ask the catalog index the app imports",
    ).toBe(catalog_index);
  });

  it("AC-2 sends the page size that was asked for", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    // 7, not the default 10, so a dropped argument cannot pass.
    await getProductsAndFiltersFromElastic({ noFilters: true, limit: 7 });

    expect(
      sent.listing.size,
      "the search server was asked for a different number of products than the caller wanted",
    ).toBe(7);
  });

  it("AC-3 sends the order the shopper chose", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    await getProductsAndFiltersFromElastic({ noFilters: true, sort: "price_asc" });
    const chosen = sent.listing.sort[0];

    expect(
      chosen?.offered_price?.order,
      "the shopper asked for cheapest first and the search server was not told to order by price",
    ).toBe("asc");
    // The relevance fallback is a different rule, so "an order was sent" is not
    // enough on its own.
    expect(
      chosen?._score,
      "the chosen order was thrown away and the search server got the relevance fallback",
    ).toBeUndefined();
  });

  it("AC-4 forwards a page cursor, and sends none on the first page", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    await getProductsAndFiltersFromElastic({ noFilters: true, search_after: [42] });
    expect(
      sent.listing.search_after,
      "the page cursor the caller gave was not forwarded to the search server",
    ).toEqual([42]);

    sent = {};
    answers.listing = gridReply();
    await getProductsAndFiltersFromElastic({ noFilters: true });
    expect(
      "search_after" in sent.listing,
      "the first page sent a cursor, which the search server reads as a real position",
    ).toBe(false);
  });

  it("AC-5 hands back the last hit's sort value, and an empty cursor with no hits", async () => {
    answers.listing = gridReply(
      [hit(product({ id: 1 }), [10]), hit(product({ id: 2 }), [20]), hit(product({ id: 3 }), [30])],
      3,
    );
    const { getProductsAndFiltersFromElastic } = await load();

    const many = await getProductsAndFiltersFromElastic({ noFilters: true });
    expect(
      many.offset,
      "the next-page cursor is not the sort value of the last hit the search server returned",
    ).toEqual([30]);

    // Re-point the answer table: the router is a marker-to-answer map, not a
    // queue, so the second drive would otherwise read the three-hit reply.
    answers.listing = gridReply([], 0);
    const none = await getProductsAndFiltersFromElastic({ noFilters: true });
    expect(
      none.offset,
      "with no hits the next-page cursor was not empty",
    ).toEqual([]);
  });

  it("AC-6 a grid-only request sends no facet work and no bounded total", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    await getProductsAndFiltersFromElastic({ noFilters: true });

    expect(
      "aggs" in sent.listing,
      "a products-only request still asked the search server to build the facets",
    ).toBe(false);
    expect(
      sent.listing.track_total_hits,
      "a products-only request still asked the search server for a bounded total",
    ).toBe(false);
  });

  it("AC-7 a facets-only request asks for zero products", async () => {
    answers.listing = facetReply();
    answers.children = childrenReply();
    const { getProductsAndFiltersFromElastic } = await load();

    await getProductsAndFiltersFromElastic({ noProducts: true, noFilters: false });

    expect(
      sent.listing.size,
      "a facets-only request still asked the search server for product hits",
    ).toBe(0);
    expect(
      "aggs" in sent.listing,
      "a facets-only request dropped the facets it exists to fetch",
    ).toBe(true);
  });

  it("AC-8 asking for snapshot paging while the setting is off changes nothing", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    // The case asks for it on purpose, so the setting is seen to refuse rather
    // than the feature simply going unused.
    await getProductsAndFiltersFromElastic({ noFilters: true, usePit: true });

    expect(
      esOpenPit,
      "snapshot paging is switched off, but the app still opened a snapshot",
    ).not.toHaveBeenCalled();
    expect(
      sent.listing.index,
      "the request lost its index, which only a snapshot search may do",
    ).toBe(catalog_index);
    expect(
      "pit" in sent.listing,
      "the request carried a snapshot while snapshot paging was off",
    ).toBe(false);
  });
});

// ===========================================================================
// FR-4, FR-5 — the search text
// ===========================================================================

describe("analysing the search text", () => {
  it("AC-9 a one-word search text does not reach the analyzer", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    await getProductsAndFiltersFromElastic({
      noFilters: true,
      filters: { search_text: "shirt" },
    });

    expect(
      analyze,
      "a single-word search was sent to the text analyzer, which costs a paid call",
    ).not.toHaveBeenCalled();
  });

  it("AC-10 a multi-word search text reaches the analyzer once, and its answer is used", async () => {
    analyze.mockResolvedValue({ name: "blue shirt" });
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    const result = await getProductsAndFiltersFromElastic({
      noFilters: true,
      filters: { search_text: "a blue shirt" },
    });

    expect(
      analyze,
      "a multi-word search never reached the text analyzer",
    ).toHaveBeenCalledWith("a blue shirt");
    // A call that was made and then ignored is still a failure.
    expect(
      result.applied.search_text,
      "the text analyzer answered and the app carried on with the shopper's raw words",
    ).toBe("blue shirt");
  });

  it("AC-11 analyzer colours merge into the filters with no repeats", async () => {
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    // One value, and the filters already hold it — so a duplicate would show.
    analyze.mockResolvedValue({ color: "red" });
    const single = await getProductsAndFiltersFromElastic({
      noFilters: true,
      filters: { search_text: "a red shirt", colors: ["red"] },
    });
    expect(
      single.applied.colors,
      "a colour the shopper had already chosen was added a second time",
    ).toEqual(["red"]);

    answers.listing = gridReply();
    analyze.mockResolvedValue({ color: ["red", "blue"] });
    const list = await getProductsAndFiltersFromElastic({
      noFilters: true,
      filters: { search_text: "a red shirt", colors: ["red"] },
    });
    expect(
      list.applied.colors,
      "the analyzer answered with a list of colours and they were not all kept",
    ).toEqual(["red", "blue"]);
  });

  it("AC-12 a failing analyzer still returns a result, and the search is not reported as failed", async () => {
    const noisy = vi.spyOn(console, "error").mockImplementation(() => {});
    analyze.mockResolvedValue({ error: "the analyzer is over its quota" });
    answers.listing = gridReply();
    const { getProductsAndFiltersFromElastic } = await load();

    const result = await getProductsAndFiltersFromElastic({
      noFilters: true,
      filters: { search_text: "a blue shirt" },
    });

    expect(
      analyze,
      "the analyzer was never called, so this case did not reach the failure it is about",
    ).toHaveBeenCalled();
    expect(
      result.products,
      "the analyzer failed and the whole search was lost with it",
    ).toHaveLength(1);
    // The analyzer failure IS reported; a search failure is not.
    const scenarios = LogServerError.mock.calls.map((c) => (c[0] as any)?.scenario);
    expect(
      scenarios,
      "the search itself was reported as failed, although only the text analyzer failed",
    ).not.toContain("getProductAndFilters in elasticSearch");
    noisy.mockRestore();
  });
});

// ===========================================================================
// FR-6, FR-7 — turning the reply into cards
// ===========================================================================

describe("turning the reply into cards", () => {
  it("AC-13 a product with no row in the language asked for gives no card", async () => {
    // The product HAS rows — just not in the language asked for.
    answers.listing = gridReply([
      hit(
        product({
          custom_products: [
            { id: 501, product_id: 11, language_code: "tr", name: "Mavi gomlek", slug: "mavi" },
          ],
        }),
      ),
    ]);
    const { getProductsAndFiltersFromElastic } = await load();

    const result = await getProductsAndFiltersFromElastic({
      noFilters: true,
      language_code: "en",
    });

    expect(
      result.products,
      "a product with no row in the shopper's language was still turned into a card",
    ).toEqual([]);
  });

  it("AC-14 two rows for one language give exactly one card", async () => {
    answers.listing = gridReply([
      hit(
        product({
          custom_products: [
            { id: 501, product_id: 11, language_code: "en", name: "First row", slug: "first" },
            { id: 502, product_id: 11, language_code: "en", name: "Second row", slug: "second" },
          ],
        }),
      ),
    ]);
    const { getProductsAndFiltersFromElastic } = await load();

    const result = await getProductsAndFiltersFromElastic({ noFilters: true });

    // Name the card that survived: a count of one would pass even if the wrong
    // row won.
    expect(
      result.products?.map((p: any) => p.name),
      "a product document with two rows for one language did not give exactly the first card",
    ).toEqual(["First row"]);
  });

  it("AC-15 the total is the search server's own", async () => {
    answers.listing = facetReply([hit(product())], 87);
    answers.children = childrenReply();
    const { getProductsAndFiltersFromElastic } = await load();

    // The facet request is the only shape that asks for a total at all.
    const result = await getProductsAndFiltersFromElastic({ noFilters: false });

    expect(
      result.total_size,
      "the total came from somewhere other than the search server's own count",
    ).toBe(87);
  });
});

// ===========================================================================
// FR-8 — recording the search term
// ===========================================================================

describe("recording the search term", () => {
  it("AC-16 a term that found products is recorded", async () => {
    answers.listing = facetReply([hit(product())], 12);
    answers.children = childrenReply();
    const { getProductsAndFiltersFromElastic } = await load();

    // One word: a multi-word term would reach the analyzer, which can replace
    // the term before the recorder ever sees it.
    await getProductsAndFiltersFromElastic({
      noFilters: false,
      filters: { search_text: "shirt" },
    });

    const recorded = logSearchTerm.mock.calls[0]?.[0] as any;
    expect(
      recorded?.searchText,
      "a search that found products was not recorded against the shopper",
    ).toBe("shirt");
    expect(
      recorded?.productsCount,
      "the recorded search carried a different result count than the search returned",
    ).toBe(12);
  });

  it("AC-17 a term that found nothing is not recorded", async () => {
    // The total is PRESENT and zero. A missing total would also skip the
    // recorder, and this case would then pass for the wrong reason.
    answers.listing = facetReply([], 0);
    answers.children = childrenReply();
    const { getProductsAndFiltersFromElastic } = await load();

    await getProductsAndFiltersFromElastic({
      noFilters: false,
      filters: { search_text: "shirt" },
    });

    expect(
      logSearchTerm,
      "a search that found nothing was still recorded as a search term",
    ).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// FR-9 — what each entry point does when the search server refuses
// ===========================================================================

describe("when the search server refuses", () => {
  it("AC-18 the listing search raises, naming the failure", async () => {
    answers.listing = new Error("the search server refused the listing query");
    const { getProductsAndFiltersFromElastic } = await load();

    await expect(
      getProductsAndFiltersFromElastic({ noFilters: true }),
      "a refused listing search did not raise, or did not carry the search server's own words",
    ).rejects.toThrow("the search server refused the listing query");
  });

  it("AC-19 a refused recommendation read returns an empty list and raises nothing", async () => {
    // A ROUTED refusal on the index this userId selects — not an absent route.
    // The router's own throw is caught in the same place and gives the same
    // empty list, so only the reported message tells them apart.
    answers["rec-user"] = new Error("the search server refused the recommendation read");
    const { GetRecomendationsForUser } = await load();

    const result = await GetRecomendationsForUser({
      userId: 7,
      language: "en",
      country: "",
    });

    expect(
      result.products,
      "a refused recommendation read did not answer with an empty product list",
    ).toEqual([]);
    const reported = LogServerError.mock.calls.map((c) => c[0] as any);
    expect(
      reported.map((r) => r?.scenario),
      "the recommendation failure was not reported under its own name",
    ).toContain("getRecomendationsForUser in elasticSearch");
    expect(
      reported.map((r) => r?.error),
      "the reported failure did not carry the search server's own words, so a forgotten route would look the same",
    ).toContain("the search server refused the recommendation read");
  });

  it("AC-20 a refused related search raises, naming the failure", async () => {
    // The lookup answers; only the second search refuses. Otherwise the case
    // would pass on the lookup and never reach the related search at all.
    answers["related-lookup"] = {
      hits: { hits: [hit(product({ categories: [{ gender: 1, group_age: 2 }] }))] },
    };
    answers["related-search"] = new Error("the search server refused the related query");
    const { getRelatedProducts } = await load();

    await expect(
      getRelatedProducts({ productId: 11 }),
      "a refused related search did not raise, or did not carry the search server's own words",
    ).rejects.toThrow("the search server refused the related query");

    expect(
      sent["related-lookup"],
      "the product lookup never happened, so the refusal was not the related search's",
    ).toBeDefined();
    expect(
      sent["related-search"],
      "the related search never happened, so the case passed on the lookup instead",
    ).toBeDefined();
  });
});

// ===========================================================================
// FR-10 — related products
// ===========================================================================

describe("related products", () => {
  it("AC-21 an unknown product id gives an empty result and stops", async () => {
    answers["related-lookup"] = { hits: { hits: [] } };
    const { getRelatedProducts } = await load();

    const result = await getRelatedProducts({ productId: 999 });

    expect(
      result.products,
      "an unknown product id did not give an empty related list",
    ).toEqual([]);
    expect(
      sent["related-search"],
      "the app went on to ask the search server for related products for a product that does not exist",
    ).toBeUndefined();
  });

  it("AC-22 a product with no gender-and-age pair gives an empty result and stops", async () => {
    // The product HAS categories — they just carry no pair.
    answers["related-lookup"] = {
      hits: { hits: [hit(product({ categories: [{ gender: null, group_age: null }] }))] },
    };
    const { getRelatedProducts } = await load();

    const result = await getRelatedProducts({ productId: 11 });

    expect(
      result.products,
      "a product whose categories carry no gender-and-age pair did not give an empty related list",
    ).toEqual([]);
    expect(
      sent["related-search"],
      "the app asked for related products with nothing to match them on",
    ).toBeUndefined();
  });

  it("AC-23 the related search excludes the product being viewed", async () => {
    answers["related-lookup"] = {
      hits: { hits: [hit(product({ categories: [{ gender: 1, group_age: 2 }] }))] },
    };
    answers["related-search"] = { hits: { hits: [], total: { value: 0 } } };
    const { getRelatedProducts } = await load();

    await getRelatedProducts({ productId: 11 });

    const excluded = sent["related-search"].query.bool.must_not;
    expect(
      excluded,
      "the related search did not tell the search server to leave out the product being viewed",
    ).toContainEqual({ term: { id: 11 } });
  });

  it("AC-24 the related search asks for each gender-and-age pair once", async () => {
    answers["related-lookup"] = {
      hits: {
        hits: [
          hit(
            product({
              categories: [
                { gender: 1, group_age: 2 },
                { gender: 1, group_age: 2 },
                { gender: 3, group_age: 4 },
              ],
            }),
          ),
        ],
      },
    };
    answers["related-search"] = { hits: { hits: [], total: { value: 0 } } };
    const { getRelatedProducts } = await load();

    await getRelatedProducts({ productId: 11 });

    // The base conditions already push nested boutique and brand filters
    // (`helpers.ts:1333-1334`), so the first `nested` entry is not this one.
    const nested = sent["related-search"].query.bool.must.find(
      (c: any) =>
        c?.nested?.path === "categories" &&
        c?.nested?.query?.bool?.minimum_should_match === 1,
    );
    const pairs = nested?.nested?.query?.bool?.should;
    expect(
      pairs,
      "the repeated gender-and-age pair was asked for twice instead of once",
    ).toHaveLength(2);
  });
});

// ===========================================================================
// FR-11 — recommendations
// ===========================================================================

describe("recommendations", () => {
  const candidates = (rows: { product_id: string; score: number }[]) => ({
    hits: { hits: [{ _source: { recommended_products: rows } }] },
  });

  /**
   * A batch reply. The card is a spread of the localized row, so `product_id`
   * lives on that row. The row's own `id` must appear nowhere in the candidate
   * list, or the in-loop sort restores the order and the final sort — the thing
   * AC-27 is about — becomes a no-op. The ids are digit-only strings, because a
   * non-numeric id is filtered out before the sort ever sees it.
   */
  const batch = (productIds: string[]) => ({
    hits: {
      hits: productIds.map((pid) =>
        hit(
          product({
            id: Number(pid),
            custom_products: [
              {
                id: 9000 + Number(pid),
                product_id: pid,
                language_code: "en",
                name: `Product ${pid}`,
                slug: `p-${pid}`,
              },
            ],
          }),
        ),
      ),
    },
  });

  it("AC-25 a visitor with no account reads the cold-start list", async () => {
    answers["rec-cold"] = candidates([{ product_id: "1", score: 9 }]);
    answers["rec-batch"] = batch(["1"]);
    const { GetRecomendationsForUser } = await load();

    const result = await GetRecomendationsForUser({
      userId: null,
      language: "en",
      country: "",
    });

    expect(
      sent["rec-cold"],
      "a visitor with no account was not served from the cold-start list",
    ).toBeDefined();
    expect(
      sent["rec-user"],
      "a visitor with no account had their own recommendation row looked up",
    ).toBeUndefined();
    // The reader swallows every error into an empty list, so a request-only
    // check would pass even when the flow broke after the call.
    expect(
      result.products?.length,
      "the recommendation flow answered with nothing, so something failed after the request",
    ).toBeGreaterThan(0);
    expect(
      LogServerError.mock.calls.map((c) => (c[0] as any)?.scenario),
      "the recommendation flow reported a failure",
    ).not.toContain("getRecomendationsForUser in elasticSearch");
  });

  it("AC-26 an account with no recommendation row falls back to the cold-start list", async () => {
    answers["rec-user"] = { hits: { hits: [] } };
    answers["rec-cold"] = candidates([{ product_id: "1", score: 9 }]);
    answers["rec-batch"] = batch(["1"]);
    const { GetRecomendationsForUser } = await load();

    const result = await GetRecomendationsForUser({
      userId: 7,
      language: "en",
      country: "",
    });

    // Order comes from the spy's own call list; the router is a map and has none.
    const order = esSearch.mock.calls.map((c) => markerOf(c[0]));
    expect(
      order.indexOf("rec-user"),
      "the account's own recommendation row was never asked for",
    ).toBeGreaterThanOrEqual(0);
    expect(
      order.indexOf("rec-user") < order.indexOf("rec-cold"),
      "the cold-start list was read before the account's own row, not as a fallback",
    ).toBe(true);
    expect(
      result.products?.length,
      "the fallback answered with nothing, so something failed after the request",
    ).toBeGreaterThan(0);
    expect(
      LogServerError.mock.calls.map((c) => (c[0] as any)?.scenario),
      "the recommendation flow reported a failure",
    ).not.toContain("getRecomendationsForUser in elasticSearch");
  });

  it("AC-27 candidates come back in score order, highest first", async () => {
    answers["rec-cold"] = candidates([
      { product_id: "1", score: 1 },
      { product_id: "2", score: 9 },
      { product_id: "3", score: 5 },
    ]);
    // The search server answers in its own order, which is NOT the score order.
    answers["rec-batch"] = batch(["1", "2", "3"]);
    const { GetRecomendationsForUser } = await load();

    const result = await GetRecomendationsForUser({
      userId: null,
      language: "en",
      country: "",
      limit: 3,
    });

    expect(
      result.products?.map((p: any) => p.product_id),
      "the recommended products did not come back with the highest score first",
    ).toEqual(["2", "3", "1"]);
  });

  it("AC-28 the cursor moves past every candidate looked at, not only those kept", async () => {
    // "9x" is not a number, so it is dropped before the details are fetched —
    // which makes "looked at" and "kept" different numbers.
    answers["rec-cold"] = candidates([
      { product_id: "1", score: 9 },
      { product_id: "9x", score: 8 },
    ]);
    answers["rec-batch"] = batch(["1"]);
    const { GetRecomendationsForUser } = await load();

    const result = await GetRecomendationsForUser({
      userId: null,
      language: "en",
      country: "",
      limit: 2,
    });

    expect(
      result.products,
      "the candidate with a real id was not kept",
    ).toHaveLength(1);
    expect(
      result.offset,
      "the cursor stopped at what was kept instead of moving past everything that was looked at",
    ).toEqual([2]);
  });
});
