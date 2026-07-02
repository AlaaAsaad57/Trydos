// Client-safe sort-key vocabulary — the single source of truth shared by the ES
// query builder (server: services/elastic/helpers.ts › buildSortClause) and the
// sort widget (client: components/Listing/ListingSortControl). This module has
// NO server-only imports (no next/headers, no ES client), so it can be pulled
// into a "use client" bundle safely — helpers.ts cannot.
export const LISTING_SORT_KEYS = [
  "best_selling",
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
] as const;

export type ListingSortKey = (typeof LISTING_SORT_KEYS)[number];
