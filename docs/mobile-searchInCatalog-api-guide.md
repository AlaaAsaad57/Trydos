# Mobile guide — `searchInCatalog` API request contract

> Audience: the mobile app team.
> Scope: **everything you send** to the catalog search / listing endpoint —
> sorting, filters, pagination, language, country. This is the request-building
> reference, including the no-duplicate/no-skip PIT pagination mode


---

## Endpoint

```
GET /api/products/searchInCatalog
```

- Method: **GET** only (plus `OPTIONS` preflight). No request body.
- Everything is passed as **HTTP headers** (locale/country/user) and
  **URL query params** (filters, sort, pagination).
- Response is always JSON: `{ data, appliedFilters, suggestion }`.

This is the same endpoint the web listing uses — "mobile parity" is intentional,
so the sort keys and filter shapes below match the website exactly.

---

## Headers

| Header     | Required | Default | Meaning |
|------------|----------|---------|---------|
| `country`  | no       | `sy`    | 2-letter country code. Drives per-country pricing/availability. Send the shopper's selected country (e.g. `sy`, `iq`, `tr`, `gb`). |
| `language` | no       | `en`    | UI language for product name/details. One of `en`, `ar`, `tr`, `ku`. |
| `lang`     | no       | —       | Fallback for `language` — used only if `language` is absent. Send `language`; `lang` exists for legacy callers. |
| `uid`      | no       | —       | Logged-in user id. Forwarded to the search engine and used for search-term logging.  |

> Note: country default is `sy` **for this endpoint**. Always send the real
> selected country — do not rely on the default.

---

## Query parameters

### Pagination

| Param      | Type | Default | What to send |
|------------|------|---------|--------------|
| `limit`    | int  | `20`    | Page size (products per page). |
| `offset`   | csv of numbers | `[]` (first page) | The **`data.offset`** array from the previous response, as a comma-separated string (e.g. `offset=12.34,84517`). This is a `search_after` cursor — **not** a numeric page/skip offset. Omit on the first page. |
| `use_pit`  | bool | —       | Send `use_pit=true` on **every** request of a scroll session (first page + all "load more") to page against one frozen snapshot — no duplicates, no skips. **PIT is on in production**, so send this. See [PIT pagination](#pit-pagination-no-duplicates-no-skips). |
| `pit_id`   | string | —     | The **`data.pit_id`** from the previous response, URL-encoded, sent back on every "load more" **after** the first page. Omit on the first page. |

**Paging is cursor-based, not page-number-based.** To load the next page, take
`data.offset` from the last response and send it back as `offset`. Repeat until
`data.products` comes back shorter than `limit` (or empty).

**PIT is enabled on the server** (`LISTING_PIT_ENABLED=true`), so you should use
it — send `use_pit=true` on every request and echo `pit_id` back. See
[PIT pagination](#pit-pagination-no-duplicates-no-skips) for the full session flow.

### Sorting

Send `sort=<key>`. Omit it (or send an unknown key) for the default **relevance**
order. All keys have a stable `id` tie-breaker so paging never repeats/skips.

| `sort` value  | Order |
|---------------|-------|
| *(omit)*      | Relevance (`_score` desc) — the default |
| `best_selling`| Most orders first |
| `newest`      | Newest first (`created_at` desc) |
| `oldest`      | Oldest first (`created_at` asc) |
| `price_asc`   | Price low → high |
| `price_desc`  | Price high → low |
| `name_asc`    | Name A → Z (in the requested `language`) |
| `name_desc`   | Name Z → A (in the requested `language`) |

> **When `sort` changes, start pagination over** — drop the stored `offset`
> (and `pit_id`). A cursor is only valid within one fixed sort + filter set.

### Filters

All filters are optional. Send only the ones the user selected. Array filters
accept a **comma-separated list** (bracket/quotes tolerated but not needed).

| Param           | Format | Example | Meaning |
|-----------------|--------|---------|---------|
| `search_text`   | string | `search_text=red dress` | Free-text query. Multi-word text is auto-analyzed server-side (may extract colour/size). |
| `category_slugs`| csv    | `category_slugs=women-shoes,sneakers` | Category **slugs** (not ids). |
| `boutique_slugs`| csv    | `boutique_slugs=nike-store` | Boutique/store slugs. |
| `brand_slugs`   | csv    | `brand_slugs=nike,adidas` | Brand slugs. |
| `colors`        | csv    | `colors=red,black` | Colour names. |
| `attributes`    | JSON   | `attributes=[{"options":["M","L"]}]` | Sizes. URL-encode the JSON; `options` array = the sizes. |
| `tags_names`    | csv    | `tags_names=summer` | Tag names. |
| `price`         | `min-max` | `price=10-500` | Price range, **dash-separated** (min then max). |
| `flash-deal`    | bool   | `flash-deal=true` | Only flash-deal products. Note the **hyphen** in the param name. |
| `featured`      | bool   | `featured=true` | Only featured products. |

**Context scoping:** on an in-listing search (inside a boutique, category,
featured or flash-deal page) keep sending that context's filters together with
`search_text`, so results stay scoped to that catalogue.

### Filter facet pagination (advanced)

| Param            | Type | Default | Meaning |
|------------------|------|---------|---------|
| `filters_offset` | int  | `1`     | Pages the returned **filter lists** (categories/brands/colours/sizes/boutiques) in blocks of 10. Increase to load more filter chips; leave at `1` for the first block. Independent of product pagination. |
| `recommended_offset` | int | `0` | Cursor for the recommended-products merge (currently inert on the server). Echo back `data.recommended_offset` if present. |

---

## Response shape

```jsonc
{
  "data": {
    "products": [ /* product cards (full field set for mobile) */ ],
    "offset": [12.34, 84517],     // ← send back as `offset` for the next page
    "limit": 20,
    "total_size": 1032,           // total matches (capped at 10000 — this endpoint always loads facets)
    "pit_id": "gcSHBAE...==",     // snapshot id → send back as `pit_id` next page (can rotate; null if PIT off)
    "categories": [ /* category filter facets */ ],
    "related_categories": [ ... ],
    "brands": [ ... ],
    "boutiques": [ ... ],
    "colors": [ ... ],
    "attributes": [ { "id": 1, "name": "Size", "options": ["M","L"] } ],
    "prices": { "min_price": 5, "max_price": 900, "priceRanges": [ ... ] },
    "isAnalyzed": false,          // search-text analysis result (object) or false; debug/diagnostic only
    "applied": { /* filters as understood by the engine */ },
    "recommended_offset": 0,
    "time": 42.1                  // server compute time (ms)
  },
  "appliedFilters": { /* filters parsed from your request */ },
  "suggestion": "red dress"       // inline autocomplete ghost text (best-effort; "" if none)
}
```

Read for the grid: `data.products`, `data.total_size`, `data.offset` (next cursor).
Read for the filter panel: `data.categories`, `data.brands`, `data.boutiques`,
`data.colors`, `data.attributes`, `data.prices`.
`suggestion` is a best-effort autocomplete string — safe to ignore; never fails
the search.

On error the endpoint returns HTTP 500 with `{ error, appliedFilters }`.

---

## Worked examples

**First page, women's shoes, price 10–500, newest first, Arabic, Syria (PIT on):**

```
GET /api/products/searchInCatalog?category_slugs=women-shoes&price=10-500&sort=newest&limit=20&use_pit=true
Headers:
  country: sy
  language: ar
  uid: 84213           
→ response returns data.offset=[1719446400000,50231], data.pit_id="gcSHBAE...=="
```

**Next page** (reuse the previous `data.offset` **and** `data.pit_id`, keep every
other param identical):

```
GET /api/products/searchInCatalog?category_slugs=women-shoes&price=10-500&sort=newest&limit=20&use_pit=true&offset=1719446400000,50231&pit_id=gcSHBAE...%3D%3D
Headers: (same as above)
```

**Free-text search inside a boutique, red + black, featured only:**

```
GET /api/products/searchInCatalog?boutique_slugs=nike-store&search_text=jacket&colors=red,black&featured=true
Headers: country=iq  language=en
```

---

## PIT pagination (no duplicates, no skips)

**PIT (Point-in-Time) is enabled in production**, so use it for every listing
scroll. It pins all pages of one scroll session to a single **frozen snapshot**
of the catalog, so results can't drift between pages. Without it, a product's
relevance score can shift between two "load more" calls and the boundary product
either **reappears** (duplicate) or gets **jumped** (skip). PIT removes both —
Elasticsearch guarantees it, not client code.

### What you send / read

- **Request:** `use_pit=true` on every request of the session; `pit_id` on every
  "load more" after the first page (URL-encoded, from the last response).
- **Response:** read `data.pit_id` and send it back next page. It **can rotate** —
  always overwrite your stored id with whatever the latest response returned.

### Session flow

A **session** = one fixed filter + sort set the user is scrolling.

```
First page   →  ...&use_pit=true                         (no pit_id, no offset)
                ← data.pit_id = P1, data.offset = O1

Load more    →  ...&use_pit=true&pit_id=P1&offset=O1
                ← data.pit_id = P1 (or rotated P2), data.offset = O2

Load more    →  ...&use_pit=true&pit_id=P2&offset=O2
                ← ...
```

Rules:

1. **First page:** send `use_pit=true`, **no** `pit_id`, **no** `offset`. Store the
   returned `pit_id` and `offset`.
2. **Each load-more:** send `use_pit=true` + the **latest** `pit_id` + the
   **latest** `offset`. After each response, overwrite both stored values.
3. **Filter/sort/search-text change = new session.** Discard the stored `pit_id`
   and `offset` and start again at step 1.

### Safe fallback

If a response comes back with `pit_id: null` (server flag flipped off, or PIT
couldn't open), just keep paging with `offset` alone — behaviour degrades to the
stateless cursor. So the robust implementation is: **always send `use_pit=true`,
and send `pit_id` only when the last response returned a non-null one.** No app
change is needed if the flag ever flips on or off.

> Background: [ADR-009](../.claude/docs/adr/ADR-009-elasticsearch-pit-listing-pagination.md).

---

## Rules of thumb

1. **Cursor, not page number.** Next page = send back `data.offset` (+ `pit_id`).
   Never compute a numeric skip.
2. **Any change to sort or filters = new session.** Discard the stored `offset`
   **and** `pit_id` and request from the first page.
3. **Send the real `country` and `language` headers** every request — don't rely
   on defaults.
4. **Slugs, not ids** for categories/boutiques/brands.
5. **Only send filters the user picked.** Empty filters return the full catalogue
   (scoped by any context you pass).
6. Stop paging when `data.products.length < limit`.
