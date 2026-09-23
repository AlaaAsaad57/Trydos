// The sitemap generator, and how many Elasticsearch queries it costs.
//
// The bug this file was written for: getTopSearchTerms asked Elasticsearch for
// the top 100 search terms, then looped over the buckets and awaited one more
// query per term, one after another, to find that term's most common country and
// language. That is about 101 sequential queries for one sitemap request.
//
// Two routes pay it: app/(client)/[lang]/sitemap.xml, which is advertised 20
// times (once per locale), and /sitemap-search.xml.
//
// Every field the per-term query read is available as a sub-aggregation of the
// bucket that already exists, so the whole loop folds into the first query.

import { beforeEach, describe, expect, it, vi } from "vitest";

const search = vi.fn();
const es = vi.hoisted(() => ({
  exists: vi.fn(),
  stats: vi.fn(),
  count: vi.fn(),
  scroll: vi.fn(),
  clearScroll: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    search: (...args: unknown[]) => search(...args),
    indices: { exists: es.exists, stats: es.stats },
    count: es.count,
    // The product sitemap scrolls. Without these two the scroll loop throws on
    // a missing method and the cleanup prints a stack trace that looks like a
    // failure but is not one. `scroll` answers empty by default (see
    // beforeEach), so the loop ends after the first batch instead of spinning
    // to the case timeout.
    scroll: es.scroll,
    clearScroll: es.clearScroll,
  },
  elasticSearchComment: {},
}));
vi.mock("next/headers", () => ({ headers: () => new Map() }));
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: es.logServerError,
}));

import { generateSearchTermsSitemapUrls } from "services/elastic/sitemap.service";

/** 100 search terms, the number the sitemap asks for. */
const TERMS = Array.from({ length: 100 }, (_, i) => `term-${i}`);

/** The top-terms answer, with the country/language sub-aggregations folded in. */
const topTermsResponse = {
  aggregations: {
    top_search_terms: {
      buckets: TERMS.map((term, i) => ({
        key: term,
        doc_count: 100 - i,
        countries: { buckets: [{ key: "sy", doc_count: 5 }] },
        languages: { buckets: [{ key: "ar", doc_count: 5 }] },
      })),
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  search.mockReset();
  search.mockResolvedValue(topTermsResponse);
  es.scroll.mockReset();
  es.scroll.mockResolvedValue({ hits: { hits: [] } });
  es.clearScroll.mockReset();
  es.clearScroll.mockResolvedValue(undefined);
  es.exists.mockReset();
  es.stats.mockReset();
  es.count.mockReset();
});

describe("generateSearchTermsSitemapUrls", () => {
  it("asks Elasticsearch once, not once per search term", async () => {
    await generateSearchTermsSitemapUrls();

    expect(
      search.mock.calls.length,
      `building one search sitemap sent ${search.mock.calls.length} queries to ` +
        `the search backend for ${TERMS.length} terms; it needs one`,
    ).toBe(1);
  });

  it("still writes one url per search term", async () => {
    const urls = await generateSearchTermsSitemapUrls();

    expect(
      urls.map((url) => url.loc).filter((loc) => loc.includes("search=term-0")),
      "the first search term lost its sitemap url",
    ).not.toEqual([]);
    expect(
      urls.map((url) => url.loc).filter((loc) => loc.includes("search=term-99")),
      "the last search term lost its sitemap url",
    ).not.toEqual([]);
  });

  it("still uses the country and language most used with each term", async () => {
    const urls = await generateSearchTermsSitemapUrls();

    expect(
      urls[0]?.loc,
      `the url did not use the country and language the search log reported ` +
        `for that term (sy / ar): ${urls[0]?.loc}`,
    ).toContain("/sy-ar/filters?search=term-0");
  });

  it("falls back to tr/en when the search log reports neither", async () => {
    search.mockResolvedValue({
      aggregations: {
        top_search_terms: {
          buckets: [
            { key: "lonely", doc_count: 1, countries: { buckets: [] }, languages: { buckets: [] } },
          ],
        },
      },
    });

    const urls = await generateSearchTermsSitemapUrls();

    expect(
      urls[0]?.loc,
      `a term with no country or language in the search log did not fall back ` +
        `to tr/en: ${urls[0]?.loc}`,
    ).toContain("/tr-en/filters?search=lonely");
  });

  it("falls back to tr when the search log reports a country the app does not serve", async () => {
    search.mockResolvedValue({
      aggregations: {
        top_search_terms: {
          buckets: [
            {
              key: "faraway",
              doc_count: 1,
              countries: { buckets: [{ key: "jp", doc_count: 3 }] },
              languages: { buckets: [{ key: "en", doc_count: 3 }] },
            },
          ],
        },
      },
    });

    const urls = await generateSearchTermsSitemapUrls();

    expect(
      urls[0]?.loc,
      `an unsupported country was written into the sitemap instead of falling ` +
        `back to tr: ${urls[0]?.loc}`,
    ).toContain("/tr-en/filters?search=faraway");
  });
});

// ---------------------------------------------------------------------------
// The QA lock in the sitemap (AC-5).
//
// A sitemap is read by search engines, so a QA product reaching one would be
// indexed by Google — the one place where "hidden from the app" is not enough.
//
// Both chains are driven, because the sitemap builds its base query in two
// separate places and fixing one would leave the other open:
//
//   getProductsForSitemap    -> buildProductSearchParams -> buildProductBaseQuery
//   getHomeSitemapLocales    -> buildSitemapBaseConditions
// ---------------------------------------------------------------------------

describe("the sitemap excludes the QA shop", () => {
  /** Every QA clause anywhere in a query. */
  const qaClausesIn = (node: any): any[] => {
    const found: any[] = [];
    const walk = (value: any): void => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(walk);
        return;
      }
      if (
        value?.nested?.path === "custom_boutiques" &&
        value?.nested?.query?.prefix
      ) {
        found.push(value);
      }
      Object.values(value).forEach(walk);
    };
    walk(node);
    return found;
  };

  it("keeps QA products out of the product sitemap", async () => {
    const { getProductsForSitemap } = await import(
      "services/elastic/sitemap.service"
    );

    // One batch, then an empty one. Without the empty answer the scroll loop
    // spins until the 15-second case timeout instead of failing as itself.
    search.mockResolvedValueOnce({
      _scroll_id: "scroll-1",
      hits: { hits: [] },
    });

    await getProductsForSitemap(10);

    const sent = search.mock.calls[0]?.[0];
    expect(
      sent,
      "the product sitemap never asked the search server anything, so there is no query to check",
    ).toBeDefined();
    expect(
      qaClausesIn(sent).length,
      "the product sitemap query carried no clause excluding QA shops, so a test product would be published to search engines",
    ).toBeGreaterThan(0);
  });

  it("keeps QA products out of the home sitemap's locale list", async () => {
    const { getHomeSitemapLocales } = await import(
      "services/elastic/sitemap.service"
    );

    search.mockResolvedValueOnce({
      aggregations: {
        countries: { buckets: [{ key: "sy" }] },
        languages: { buckets: [{ key: "en" }] },
      },
      hits: { hits: [] },
    });

    await getHomeSitemapLocales();

    const sent = search.mock.calls[0]?.[0];
    expect(
      qaClausesIn(sent).length,
      "the home sitemap's locale query carried no clause excluding QA shops, so a QA product's country and language could add a whole locale to the sitemap",
    ).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// The rest of the generator: every sitemap the app serves, driven through the
// exported functions the route handlers call.
//
// The generator sends several different queries to the search backend. The
// router below answers each one by what it asks for, so a test only states the
// data, not the order the calls happen in.
// ---------------------------------------------------------------------------

type Answers = {
  locales?: any;
  localesFallback?: any;
  products?: any;
  boutiques?: any[] | Error;
  terms?: any;
  slugCount?: any;
  boutiqueCount?: any;
};

/** Answer every query the sitemap sends, by the kind of query it is. */
function routeSearch(answers: Answers) {
  let boutiquePage = 0;
  const answer = (value: any) =>
    value instanceof Error ? Promise.reject(value) : Promise.resolve(value);

  search.mockImplementation((params: any) => {
    if (params.scroll) return answer(answers.products ?? { hits: { hits: [] } });
    if (params.aggs?.boutiques_composite) {
      if (answers.boutiques instanceof Error) return answer(answers.boutiques);
      const pages = answers.boutiques ?? [];
      const page = pages[boutiquePage] ?? { aggregations: {} };
      boutiquePage += 1;
      return answer(page);
    }
    if (params.aggs?.unique_slugs) return answer(answers.slugCount ?? {});
    if (params.aggs?.unique_boutiques) return answer(answers.boutiqueCount ?? {});
    if (params.index === "search_logs_develop") {
      return answer(answers.terms ?? { aggregations: {} });
    }
    if (params.aggs?.countries) return answer(answers.locales ?? {});
    // The one-document probe the locale lookup sends when it found no country.
    return answer(answers.localesFallback ?? { hits: { hits: [] } });
  });
}

/** The locale aggregation, as the search backend nests it. */
const localesAnswer = (countries: string[], languages: string[]) => ({
  aggregations: {
    countries: { country_codes: { buckets: countries.map((key) => ({ key })) } },
    languages: { language_codes: { buckets: languages.map((key) => ({ key })) } },
  },
});

/** Every <loc> in a sitemap document. */
const locsIn = (xml: string) =>
  [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

const loggedScenarios = () =>
  es.logServerError.mock.calls.map((call: any[]) => call[0]?.scenario);

const BASE = "https://trydos.ramaaz.dev";

describe("the home sitemap", () => {
  it("writes one home url per country and supported language, lower-cased", async () => {
    const { generateHomeSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ locales: localesAnswer(["SY", "IQ"], ["EN", "FR"]) });

    const xml = await generateHomeSitemapXML();

    expect(
      locsIn(xml),
      "the home sitemap must hold exactly the Syrian and Iraqi English home pages (fr is not served)",
    ).toEqual([`${BASE}/sy-en`, `${BASE}/iq-en`]);
    expect(xml, "the home entries lost their daily change frequency").toContain(
      "<changefreq>daily</changefreq>",
    );
  });

  it("falls back to the four served countries and all languages when the index reports none", async () => {
    const { generateHomeSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ locales: localesAnswer([], []) });

    const locs = locsIn(await generateHomeSitemapXML());

    for (const locale of ["tr-en", "iq-ar", "lb-tr", "sy-ku"]) {
      expect(
        locs,
        `with no locales in the index, the fallback home url /${locale} is missing`,
      ).toContain(`${BASE}/${locale}`);
    }
    expect(
      es.logServerError,
      "a successful fallback probe was reported as an error",
    ).not.toHaveBeenCalled();
  });

  it("still falls back, and reports it, when the fallback probe itself fails", async () => {
    const { generateHomeSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      locales: localesAnswer([], ["en"]),
      localesFallback: new Error("probe down"),
    });

    const locs = locsIn(await generateHomeSitemapXML());

    expect(
      locs,
      "a failed fallback probe left the home sitemap without the fallback countries",
    ).toEqual([`${BASE}/tr-en`, `${BASE}/iq-en`, `${BASE}/lb-en`, `${BASE}/sy-en`]);
    expect(loggedScenarios(), "the failed fallback probe was not reported").toContain(
      "getHomeSitemapLocales simple query failed",
    );
  });

  it("uses the default locales and reports it when the search backend is down", async () => {
    const { generateHomeSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ locales: new Error("search backend down") });

    const locs = locsIn(await generateHomeSitemapXML());

    expect(locs, "with the search backend down, the default locale /lb-ku is missing").toContain(
      `${BASE}/lb-ku`,
    );
    expect(loggedScenarios(), "the failed locale lookup was not reported").toContain(
      "getHomeSitemapLocales failed",
    );
  });
});

describe("the static pages sitemap", () => {
  it("writes each static page once per locale with its own priority", async () => {
    const { generateStaticPagesSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ locales: localesAnswer(["sy"], ["ar"]) });

    const xml = await generateStaticPagesSitemapXML();

    expect(locsIn(xml), "the static page urls are wrong").toEqual([
      `${BASE}/sy-ar/about`,
      `${BASE}/sy-ar/contact`,
      `${BASE}/sy-ar/privacy-policy`,
      `${BASE}/sy-ar/terms-of-service`,
    ]);
    expect(xml, "the privacy page lost its 0.3 priority").toContain(
      "<priority>0.3</priority>",
    );
  });
});

describe("the product sitemap", () => {
  const productHits = [
    {
      _id: "p1",
      _source: {
        status: 1,
        updated_at: "2026-01-15T10:00:00Z",
        custom_products: [
          { slug: "red-shirt", language_code: "en", country_iso: "sy" },
          { slug: "   " },
          { slug: "red-shirt-ar" },
        ],
      },
    },
    { _id: "p2", _source: { status: 0, custom_products: [{ slug: "hidden" }] } },
    { _id: "p3", _source: { custom_products: [{ slug: "no-status" }] } },
    { _id: "p4", _source: { status: 1 } },
  ];

  it("writes a url per slug and locale, skips inactive products and blank slugs, and keeps scrolling", async () => {
    const { generateProductSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      locales: localesAnswer(["sy"], ["en"]),
      products: { _scroll_id: "scroll-1", hits: { hits: productHits } },
    });
    es.scroll
      .mockResolvedValueOnce({
        hits: {
          hits: [{ _id: "p5", _source: { status: 1, custom_products: [{ slug: "blue-hat" }] } }],
        },
      })
      .mockResolvedValueOnce({ hits: { hits: [] } });

    const xml = await generateProductSitemapXML();

    expect(
      locsIn(xml),
      "the product urls are wrong: the second scroll page, a blank slug or an inactive product was mishandled",
    ).toEqual([
      `${BASE}/sy-en/products/red-shirt`,
      `${BASE}/sy-en/products/red-shirt-ar`,
      `${BASE}/sy-en/products/blue-hat`,
    ]);
    expect(xml, "the product's own update date was not used as lastmod").toContain(
      "<lastmod>2026-01-15</lastmod>",
    );
    expect(
      es.clearScroll,
      "the scroll context was not released after the sitemap was built",
    ).toHaveBeenCalledWith({ scroll_id: "scroll-1" });
  });

  it("answers an empty page past the last one", async () => {
    const { generateProductSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      locales: localesAnswer(["sy"], ["en"]),
      products: { _scroll_id: "scroll-1", hits: { hits: productHits } },
    });

    const xml = await generateProductSitemapXML(1);

    expect(locsIn(xml), "page 1 of a one-page sitemap was not empty").toEqual([]);
  });

  it("still answers, and reports it, when the scroll context cannot be cleared", async () => {
    const { generateProductSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      locales: localesAnswer(["sy"], ["en"]),
      products: { _scroll_id: "scroll-1", hits: { hits: productHits } },
    });
    es.clearScroll.mockRejectedValueOnce(new Error("clear failed"));

    const locs = locsIn(await generateProductSitemapXML());

    expect(locs, "a failed scroll cleanup threw away the product sitemap").toContain(
      `${BASE}/sy-en/products/red-shirt`,
    );
    expect(loggedScenarios(), "the failed scroll cleanup was not reported").toContain(
      "getProductsForSitemap could not clear the scroll context",
    );
  });

  it("fails loudly when the search backend opens no scroll", async () => {
    const { generateProductSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ products: { hits: { hits: [] } } });

    await expect(
      generateProductSitemapXML(),
      "a product sitemap with no scroll id was served as if it were complete",
    ).rejects.toThrow("Failed to initialize scroll search");
    expect(es.clearScroll, "a scroll that was never opened was cleared").not.toHaveBeenCalled();
  });

  it("counts one page when the index reports no slugs, and more when the urls pass 50 000", async () => {
    const { getProductSitemapPageCount } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ locales: localesAnswer(["sy", "iq"], ["en", "ar"]) });
    expect(
      await getProductSitemapPageCount(),
      "an empty slug count did not give the one page that always exists",
    ).toBe(1);

    routeSearch({
      locales: localesAnswer(["sy", "iq"], ["en", "ar"]),
      slugCount: { aggregations: { unique_slugs: { count: { value: 25_001 } } } },
    });
    expect(
      await getProductSitemapPageCount(),
      "25 001 slugs x 4 locales = 100 004 urls need 3 pages of 50 000",
    ).toBe(3);
  });
});

describe("the search terms sitemap", () => {
  it("skips blank and non-text terms and cleans the rest", async () => {
    const { generateSearchTermsSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      terms: {
        aggregations: {
          top_search_terms: {
            buckets: [
              { key: 42, doc_count: 3 },
              { key: "   ", doc_count: 3 },
              {
                key: "  red shoes ",
                doc_count: 2,
                countries: { buckets: [{ key: "_missing" }] },
                languages: { buckets: [{ key: "_missing" }] },
              },
            ],
          },
        },
      },
    });

    const locs = locsIn(await generateSearchTermsSitemapXML());

    expect(locs, "the trimmed term did not get its url with the tr/en defaults").toEqual([
      `${BASE}/tr-en/filters?search=red%20shoes`,
    ]);
  });

  it("probes the search log when no term has results", async () => {
    const { generateSearchTermsSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({});
    es.exists.mockResolvedValue(true);
    es.stats.mockResolvedValue({});
    es.count.mockResolvedValue({ count: 0 });

    const locs = locsIn(await generateSearchTermsSitemapXML());

    expect(locs, "an empty search log still produced search urls").toEqual([]);
    expect(es.stats, "the search log's stats were not read").toHaveBeenCalled();
    expect(es.count, "the search log's documents were not counted").toHaveBeenCalled();
  });

  it("skips the probe when the search log index does not exist", async () => {
    const { generateSearchTermsSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({});
    es.exists.mockResolvedValue(false);

    await generateSearchTermsSitemapXML();

    expect(es.stats, "stats were read from an index that does not exist").not.toHaveBeenCalled();
  });

  it("reports a failed probe and a failed term query, and answers empty", async () => {
    const { generateSearchTermsSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({});
    es.exists.mockRejectedValue(new Error("no index api"));

    await generateSearchTermsSitemapXML();
    expect(loggedScenarios(), "the failed search-log probe was not reported").toContain(
      "getTopSearchTerms could not check the search-log index",
    );

    routeSearch({ terms: new Error("search log down") });
    const locs = locsIn(await generateSearchTermsSitemapXML());
    expect(locs, "a failed term query still produced search urls").toEqual([]);
    expect(loggedScenarios(), "the failed term query was not reported").toContain(
      "getTopSearchTerms failed",
    );
  });
});

describe("the boutique sitemap", () => {
  const shopHit = (source: any) => ({
    boutique_data: { hits: { hits: [{ _source: source }] } },
  });
  const boutiquePages = [
    {
      aggregations: {
        boutiques_composite: {
          after_key: { boutique_id: 2 },
          buckets: [
            shopHit({ custom_boutiques: [{ slug: "shop-a" }, { slug: "shop-a" }, {}] }),
            shopHit({ custom_boutiques: { slug: "shop-b" } }),
            shopHit({}),
          ],
        },
      },
    },
    {
      aggregations: {
        boutiques_composite: { buckets: [shopHit({ custom_boutiques: [{ slug: "shop-c" }] })] },
      },
    },
  ];

  it("writes each boutique once per locale, across every page of shops", async () => {
    const { generateBoutiqueSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ locales: localesAnswer(["sy"], ["en"]), boutiques: boutiquePages });

    const locs = locsIn(await generateBoutiqueSitemapXML());

    expect(locs, "the boutique urls are wrong: a shop is missing or repeated").toEqual([
      `${BASE}/sy-en/filters/boutiques/shop-a`,
      `${BASE}/sy-en/filters/boutiques/shop-b`,
      `${BASE}/sy-en/filters/boutiques/shop-c`,
    ]);
    const secondPage = search.mock.calls
      .map((call) => call[0])
      .filter((params: any) => params.aggs?.boutiques_composite)[1];
    expect(
      secondPage?.aggs.boutiques_composite.composite.after,
      "the second boutique page did not continue from the first page's after_key",
    ).toEqual({ boutique_id: 2 });
  });

  it("fails loudly, and reports it, when the boutique query fails", async () => {
    const { generateBoutiqueSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ boutiques: new Error("boutiques down") });

    await expect(
      generateBoutiqueSitemapXML(),
      "a failed boutique query was served as an empty boutique sitemap",
    ).rejects.toThrow("boutiques down");
    expect(loggedScenarios(), "the failed boutique query was not reported").toContain(
      "getBoutiquesForSitemap failed",
    );
  });

  it("counts boutique pages from the cardinality, with one page as the floor", async () => {
    const { getBoutiqueSitemapPageCount } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({ locales: localesAnswer(["sy"], ["en"]) });
    expect(
      await getBoutiqueSitemapPageCount(),
      "an empty boutique count did not give the one page that always exists",
    ).toBe(1);

    routeSearch({
      locales: localesAnswer(["sy"], ["en"]),
      boutiqueCount: { aggregations: { unique_boutiques: { value: 50_001 } } },
    });
    expect(
      await getBoutiqueSitemapPageCount(),
      "50 001 boutique urls need 2 pages of 50 000",
    ).toBe(2);
  });
});

describe("the per-locale sitemap", () => {
  it("lists the home page, the locale's products, every boutique and every search term", async () => {
    const { generateLocaleSpecificSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      products: {
        _scroll_id: "scroll-1",
        hits: {
          hits: [
            {
              _id: "p1",
              _source: {
                status: 1,
                updated_at: "2026-02-01T00:00:00Z",
                custom_products: [
                  { slug: "shirt-ar", language_code: "ar" },
                  { slug: "shirt-en", language_code: "en" },
                ],
              },
            },
            {
              _id: "p2",
              _source: { status: 1, custom_products: [{ slug: "hat-ar", language_code: "ar" }] },
            },
          ],
        },
      },
      boutiques: [
        {
          aggregations: {
            boutiques_composite: {
              buckets: [
                { boutique_data: { hits: { hits: [{ _source: { custom_boutiques: [{ slug: "shop-a" }] } }] } } },
              ],
            },
          },
        },
      ],
      terms: {
        aggregations: { top_search_terms: { buckets: [{ key: "dress", doc_count: 4 }] } },
      },
    });

    const xml = await generateLocaleSpecificSitemapXML("sy", "ar");

    expect(locsIn(xml), "the per-locale sitemap urls are wrong").toEqual([
      `${BASE}/sy-ar`,
      `${BASE}/sy-ar/products/shirt-ar`,
      `${BASE}/sy-ar/products/hat-ar`,
      `${BASE}/sy-ar/filters/boutiques/shop-a`,
      `${BASE}/sy-ar/filters/search/dress`,
    ]);
    expect(xml, "the product's update date was not used as lastmod").toContain(
      "<lastmod>2026-02-01</lastmod>",
    );
  });

  it("keeps the home page and reports each part that failed", async () => {
    const { generateLocaleSpecificSitemapXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      products: { hits: { hits: [] } },
      boutiques: new Error("boutiques down"),
    });

    const locs = locsIn(await generateLocaleSpecificSitemapXML("sy", "en"));

    expect(locs, "the home page did not survive the failed parts").toEqual([`${BASE}/sy-en`]);
    expect(loggedScenarios(), "the failed product part was not reported").toContain(
      "locale sitemap: products",
    );
    expect(loggedScenarios(), "the failed boutique part was not reported").toContain(
      "locale sitemap: boutiques",
    );
  });
});

describe("the sitemap index", () => {
  it("links every locale sitemap and every product and boutique page", async () => {
    const { generateLocaleSitemapIndexXML } = await import(
      "services/elastic/sitemap.service"
    );
    routeSearch({
      locales: localesAnswer(["sy"], ["en"]),
      slugCount: { aggregations: { unique_slugs: { count: { value: 60_000 } } } },
    });

    const locs = locsIn(await generateLocaleSitemapIndexXML());

    expect(locs, "the gb-ku locale sitemap is missing from the index").toContain(
      `${BASE}/gb-ku/sitemap.xml`,
    );
    expect(locs, "the second product page is missing from the index").toContain(
      `${BASE}/sitemap-products.xml?page=1`,
    );
    expect(locs, "the first boutique page is missing from the index").toContain(
      `${BASE}/sitemap-boutiques.xml?page=0`,
    );
    expect(locs, "a boutique page that does not exist was linked").not.toContain(
      `${BASE}/sitemap-boutiques.xml?page=1`,
    );
  });
});
