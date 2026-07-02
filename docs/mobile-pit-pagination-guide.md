# Mobile guide — PIT pagination for `searchInCatalog`

> Audience: the mobile app team.
> Scope: **only** how to page `GET /api/products/searchInCatalog` without
> duplicates or skips using Point-in-Time (PIT). Nothing else about the endpoint
> changes.
> Background (optional): [ADR-009](../.claude/docs/adr/ADR-009-elasticsearch-pit-listing-pagination.md).

## Why

The catalog is sorted by relevance `[_score, id]` and paged with `search_after`.
Between two "load more" requests, a document's BM25 `_score` can drift (different
replica copy, or an index refresh/merge/catalog write in between). When it drifts:

- **up** → the boundary product reappears on the next page → **duplicate**
- **down** → the boundary product is jumped → **skip** (a product the user never sees)

This is intermittent ("sometimes, not always"). PIT fixes it by pinning every
page of one browsing session to a single **frozen snapshot** of the index, so
`_score` cannot move between pages. Result: **guaranteed no-duplicate, no-skip**
within a session — Elasticsearch guarantees it, not client code.

## The contract (what changed for you)

The endpoint is **backwards compatible**. If you send nothing new, behaviour is
exactly as today. To turn PIT on you add **two request params** and read back
**one response field**.

### Request — new query params

| Param    | When to send                                  | Value |
|----------|-----------------------------------------------|-------|
| `use_pit`| Every request of a PIT session (first + all "load more") | `true` |
| `pit_id` | Every "load more" **after** the first page    | the `pit_id` you got from the previous response (URL-encoded) |
| `offset` | Every "load more" (unchanged, already exists) | the `offset` array from the previous response |

Existing params (`limit`, `category_slugs`, `price`, `search_text`, filters, …)
are unchanged.

### Response — field to read

The response body is unchanged in shape; you now read one field inside `data`:

```jsonc
{
  "data": {
    "products": [ /* page items */ ],
    "offset": [12.3419, 84517],   // search_after cursor → send as `offset` next page
    "pit_id": "gcSHBAE...==",      // snapshot id → send as `pit_id` next page
    "total_size": 1032,
    // ...filters, prices, etc. unchanged
  },
  "appliedFilters": { ... },
  "suggestion": ""
}
```

- `data.pit_id` — send it back as `pit_id` on the next "load more".
  **It can rotate**: always overwrite your stored id with whatever the latest
  response returned. If it comes back `null`, see [Flag off](#flag-off) below.
- `data.offset` — the `search_after` cursor, exactly as you already use it today.

## Session lifecycle

A **session** = one fixed filter set the user is scrolling through.

```
First page   →  GET ...&use_pit=true                       (no pit_id, no offset)
                ← data.pit_id = P1, data.offset = O1

Load more    →  GET ...&use_pit=true&pit_id=P1&offset=O1
                ← data.pit_id = P1 (or rotated P2), data.offset = O2

Load more    →  GET ...&use_pit=true&pit_id=P2&offset=O2
                ← ...
```

Rules:

1. **First page:** send `use_pit=true`, **no** `pit_id`, **no** `offset`. Store
   the returned `pit_id` and `offset`.
2. **Each load-more:** send `use_pit=true` + the **latest** `pit_id` + the
   **latest** `offset`. After each response, overwrite both stored values(pid and offset).
3. **Filter change = new session.** Whenever the user changes ANY filter/sort/
   search text, **discard** the stored `pit_id` and `offset` and start again at
   step 1. (Mirrors the web client, which remounts the scroll on any filter change.)



So a safe mobile implementation is: *always* send `use_pit=true`; send `pit_id`
**only if** the last response returned a non-null one. That way the app needs no
change when the flag flips on or off.

