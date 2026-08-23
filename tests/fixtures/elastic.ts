// Builder for a search-engine response that wraps product hits.
//
// Where the shape comes from (C-5): the `ElasticsearchHit` interface in
// services/elastic/elasticSearch.ts ({ _source, sort }) and the
// `response.hits.hits` reads throughout that same file. That interface is not
// exported, so the two shapes below repeat it here and name their source.
import type { CustomProduct } from "services/elastic/helpers";

import { buildSearchEngineProduct } from "./product";

/** One search-engine hit — mirrors `ElasticsearchHit` in elasticSearch.ts. */
export interface SearchEngineHit {
  _source: CustomProduct;
  sort: any[];
}

/** The part of a search-engine reply the app actually reads. */
export interface SearchEngineResponse {
  hits: {
    total: { value: number; relation: string };
    hits: SearchEngineHit[];
  };
}

/** One hit. The `sort` array is the cursor `search_after` pages on. */
export function buildSearchEngineHit(
  overrides: Partial<SearchEngineHit> = {},
): SearchEngineHit {
  return {
    _source: buildSearchEngineProduct(),
    sort: [1001],
    ...overrides,
  };
}

/**
 * A whole response. By default it wraps one hit, and `total.value` agrees with
 * the number of hits so a test does not have to keep the two in step by hand.
 */
export function buildSearchEngineResponse(
  overrides: Partial<SearchEngineResponse> = {},
): SearchEngineResponse {
  const hits = overrides.hits?.hits ?? [buildSearchEngineHit()];

  return {
    hits: {
      total: { value: hits.length, relation: "eq" },
      ...overrides.hits,
      hits,
    },
  };
}
