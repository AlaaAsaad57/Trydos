// The QA mark, and the one clause that hides it from the catalogue.
//
// The end-to-end suite has to create real data on a real environment: a seller,
// a shop, a location, a product. That data must never reach a shopper. The way
// it is kept apart is **the mark travels inside the row**: a QA shop's slug
// starts with `trydos-qa-`. Nothing has to be synchronised, no second list is
// kept anywhere, and every service that can read a shop slug can filter on it
// alone.
//
// This module holds two things and nothing else: the prefix, and the
// Elasticsearch clause that excludes it. Both are pure, so a unit test can read
// them without a running index.
//
// **Filter discovery, never a direct lookup.** The clause goes into the queries
// that *find* products and shops — search, listing, recommended, the sitemap,
// the boutique list. It is deliberately not applied to a read by slug or by id.
// A guest who is handed the QA product's address still sees the page, which is
// what lets a guest test add it to a bag; a guest who is browsing never meets
// it, because browsing is discovery and discovery is filtered.

/** The mark. A shop whose slug starts with this is QA data.
 *
 *  It is a code constant, not configuration, on purpose. A configurable mark
 *  would be one more value that a new environment can get wrong, and getting it
 *  wrong is silent: the shop simply stops being hidden. */
export const QA_SHOP_SLUG_PREFIX = "trydos-qa-";

/** The clause that hides every QA shop from a catalogue query.
 *
 *  Goes in `must_not`. `custom_boutiques.slug.keyword` is queryable — the
 *  boutique filter already matches on exactly that field
 *  (`helpers.ts`, "Add boutique filter"). `prefix` rather than `term` because
 *  the slug carries the shop's own name after the mark.
 *
 *  **`ignore_unmapped` is deliberately not set.** It would be the softer choice,
 *  but the soft failure here is the wrong way round: an unmapped path would make
 *  this clause match nothing, `must_not` would exclude nothing, and every QA shop
 *  would quietly appear in the catalogue with no error anywhere. Left off, the
 *  index refuses the query loudly instead. The path is mapped today — the
 *  boutique filter queries the same field — so this only fires if a future index
 *  drops it, which is exactly when somebody needs to be told. */
export const qaShopMustNot = () => ({
  nested: {
    path: "custom_boutiques",
    query: {
      prefix: { "custom_boutiques.slug.keyword": QA_SHOP_SLUG_PREFIX },
    },
  },
});

/** True when this slug carries the mark. Used by the seed to bind every write
 *  to data it owns, and by tests. Case-insensitive, because a slug that only
 *  differs in case is the same shop to a person reading a log. */
export const isQaShopSlug = (slug: string | null | undefined): boolean =>
  typeof slug === "string" &&
  slug.trim().toLowerCase().startsWith(QA_SHOP_SLUG_PREFIX);
