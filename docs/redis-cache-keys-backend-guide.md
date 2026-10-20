# Redis cache keys — guide for the backend team

The storefront keeps a small read cache in Redis. When a product or a currency
changes in the backend, the storefront can keep showing the old value until the
key expires. This guide lists the keys to delete so the change shows at once.

Source of truth: `serverRequests/radis/index.ts`, `serverRequests/product.tsx`,
`serverRequests/currency.ts`. Last checked against the code on 2026-10-20.

## How to connect

Use the same Redis server the storefront uses. The storefront reads it from the
env values `REDIS_URL` (host), `REDIS_USERNAME`, `REDIS_PASS`, port `6379`.
Ask Ops for the values of the environment you are clearing (staging today).

There is **no HTTP route** for this any more. The old `GET /api/clearRedis` and
`GET /api/revalidate` routes were deleted on 2026-10-20 because they had no auth.
The backend deletes the keys itself, directly in Redis.

## 1. A currency changed (exchange rate or symbol)

Delete one key per country:

```
currency-<country>
```

Example: `currency-sy`, `currency-iq`, `currency-tr`.
`<country>` is the lower-case country code the storefront uses in the URL
(`/sy-en/...` → `sy`).

```
DEL currency-sy
```

If the change touches every country, delete all of them:

```
SCAN 0 MATCH currency-* COUNT 100   (repeat until the cursor is 0, DEL each key)
```

What the key holds: the JSON answer of `/mobile/home/currency` for that
country (`exchange_rate`, `symbol`, ...). TTL: `PRODUCT_REDIS_TTL_SECONDS`,
which is 120 seconds on every environment today. So without a delete, the old
rate stays for at most 2 minutes.

## 2. A product changed (price, stock, name, images, status, delete)

The storefront stores one product under several keys. Delete all of them for
the changed product, for **every language and every country**:

| Key | What it holds | TTL |
|---|---|---|
| `product-slug:<slug>:<lang>:<country>` | the product id for a slug | 120 s |
| `product-id-<id>-<country>-<lang>-global` | the product details | 120 s |
| `product-id-<id>-<country>-<lang>-qtyPrices` | quantities and prices | 120 s |
| `product-meta-v2-<slug>-<lang>-<country>` | the SEO meta (title, description, OG image) | **3600 s** |

`<lang>` is one of `en`, `ar`, `tr`, `ku`. `<country>` is the country code.
`<id>` is the numeric product id. `<slug>` is the product slug.

The simplest way is three pattern deletes per product:

```
SCAN 0 MATCH product-id-<id>-*         COUNT 100   → DEL each key
SCAN 0 MATCH product-slug:<slug>:*     COUNT 100   → DEL each key
SCAN 0 MATCH product-meta-v2-<slug>-*  COUNT 100   → DEL each key
```

Example for product id `4821` with slug `red-cotton-shirt`:

```
SCAN 0 MATCH product-id-4821-*
SCAN 0 MATCH product-slug:red-cotton-shirt:*
SCAN 0 MATCH product-meta-v2-red-cotton-shirt-*
```

Rules:

- **Slug change:** run the slug patterns for the **old** slug and the **new**
  slug. The old slug key still maps to the id, so the old URL keeps working
  until it is deleted.
- **Product deleted:** same three patterns. Until they are gone, the product
  page can still open from the cache for up to 2 minutes (meta: 1 hour).
- **Price in only one country:** you may delete only that country's keys
  (`product-id-<id>-<country>-*`). Deleting all countries is also fine.
- The `product-meta-v2` key lives **1 hour**. This is the one that matters most.
  Without a delete, Google and shared links can show an old title, price text
  or image for up to an hour.

## 3. Use SCAN, never KEYS

`KEYS pattern` blocks the whole Redis server while it runs. Use `SCAN` with
`MATCH` and `COUNT`, loop until the cursor comes back as `0`, and `DEL` the keys
each round returns. Most client libraries have a helper for this
(`scan_iter` in Python, `SCAN` + pipeline in Go, `scanStream` in Node).

## 4. Keys you must NOT delete

These keys are in the same Redis. They are not product or currency data.

| Pattern | What it is |
|---|---|
| `otp:cd:*`, `otp:sid:*`, `otp:ipc:*` | OTP abuse limits. Deleting them opens the OTP send flow to abuse. |
| `paid:*` | rate limits for the image search and voice search routes |
| `countries-<country>-<lang>` | the country list; harmless, but not needed |
| `colors-sizes` | colour and size lists for filters |
| `meta-obj-*`, `meta-listing-*` | SEO meta for the home page and listing pages (TTL 120 s / 300 s) |
| search analysis keys (a fixed prefix + a hash) | the stored search-text analysis |

Never run `FLUSHALL` or `FLUSHDB`.

## 5. What clearing Redis does NOT change

- **Listings, search, category pages and the product's reviews come from
  Elasticsearch**, not from Redis. A product edit shows there when the index
  takes the write, usually a few seconds later. Clearing Redis does nothing for
  them.
- **The home page blocks (categories, featured, flash deals, boutiques) and one
  copy of the currency are in the Next.js cache**, not in Redis. They refresh
  on their own every 60 seconds (`HOMEPAGE_CACHE_SECONDS`), and are thrown away
  after 300 seconds at most. The backend cannot clear that cache today. If the
  backend needs an instant purge there, ask the frontend team for a new
  secret-protected route; the old open route was removed on purpose.

## Quick checklist

Currency changed for country `X`:
1. `DEL currency-X`

Product `id` with slug `S` changed:
1. delete `product-id-<id>-*`
2. delete `product-slug:S:*` (and the old slug, if it changed)
3. delete `product-meta-v2-S-*` (and the old slug, if it changed)
