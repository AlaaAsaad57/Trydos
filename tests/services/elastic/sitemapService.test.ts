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

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    search: (...args: unknown[]) => search(...args),
    indices: { exists: vi.fn(), stats: vi.fn() },
    count: vi.fn(),
  },
  elasticSearchComment: {},
}));
vi.mock("next/headers", () => ({ headers: () => new Map() }));

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
  search.mockResolvedValue(topTermsResponse);
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
