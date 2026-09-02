# Baseline — `trydos.ramaaz.dev` before phase 2 merged

Taken 2026-09-02, as a guest with no cookies, from one machine over the public
internet. `trydos.ramaaz.dev` runs `main` — the flag is on (phase 1) but no route
is converted. Re-run the same commands after the merge and compare row for row.

Network distance and Cloudflare are in these numbers. Treat the **cache state**
and the **byte counts** as the reliable signals; treat the timings as a rough
guide only, because the site being compared against may sit behind different
infrastructure.

## Home page `/sy-en` — 10 runs

| run | TTFB (s) | total (s) | bytes | cache | age |
|---|---|---|---|---|---|
| 1 | 0.904 | 2.044 | 482,409 | MISS | 0 |
| 2 | 0.893 | 2.839 | 479,486 | MISS | 0 |
| 3 | 1.263 | 2.977 | 479,486 | MISS | 0 |
| 4 | 0.738 | 2.037 | 479,484 | MISS | 0 |
| 5 | 0.764 | 2.013 | 479,485 | MISS | 0 |
| 6 | 0.791 | 2.365 | 479,485 | MISS | 0 |
| 7 | 0.756 | 1.889 | 479,486 | MISS | 0 |
| 8 | 0.753 | 2.050 | 479,486 | MISS | 0 |
| 9 | 0.857 | 1.878 | 479,485 | MISS | 0 |
| 10 | 0.769 | 5.789 | 479,485 | MISS | 0 |

- TTFB: median **0.78s**, range 0.74–1.26.
- Total: median **2.04s**, range 1.88–5.79.
- **`MISS` and `age: 0` on all 10.** Nothing is cached. Every visit is a full
  render.
- The size moves by a few bytes between runs, which is the same point said
  another way: each response is built fresh.

## Other locales — 3 runs each

| path | TTFB (s) | total (s) | bytes | cache |
|---|---|---|---|---|
| `/sy-ar` | 0.889 / 0.995 / 0.903 | 2.302 / 1.983 / 2.429 | ~490,700 | MISS |
| `/lb-ar` | 0.880 / 0.816 / 0.792 | 2.862 / 2.044 / 2.268 | ~486,285 | MISS |
| `/sy-tr` | 1.885 / 1.187 / 0.891 | 7.647 / 3.309 / 1.857 | ~483,340 | MISS |

Every locale misses. There is no shared entry for anybody.

## Category view — 3 runs each

Before the merge the category view is `?mainCategory=`, not a route of its own.

| category | TTFB (s) | total (s) | bytes | cache |
|---|---|---|---|---|
| `accessories-37` | 1.346 / 1.500 / 0.914 | 2.908 / 2.475 / 2.119 | 320,605 | MISS |
| `books-512` | 1.232 / 0.906 / 0.843 | 2.342 / 1.859 / 1.713 | 257,438 | MISS |
| `electronics-technology-25` | 0.814 / 0.884 / 1.051 | 1.844 / 1.937 / 1.981 | ~290,790 | MISS |

## Headers on `/sy-en`

```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
age: 0
x-vercel-cache: MISS
cf-cache-status: DYNAMIC
x-matched-path: /[lang]
x-robots-tag: noindex, nofollow
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
server: cloudflare
```

`private, no-store` is what `dynamic = "force-dynamic"` sends. It **masks** the
global `public, s-maxage=60, stale-while-revalidate=300` rule that
`next.config.ts` sets on `/(.*)`. Phase 2 removes `force-dynamic`, so this line
is the single most important one to re-read after the merge — it is open
finding 1.

## The RSC payload — open finding 1's evidence

The response a client-side navigation fetches, not the first document:

```
content-type: text/x-component
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
x-vercel-cache: MISS
size: 220,536 bytes
Set-Cookie headers: 0
initialUserData occurrences: 2
```

Both halves of finding 1 are confirmed here, before any change:

1. The RSC payload carries **no `Set-Cookie`**, because `proxy.ts`'s `missing:`
   clause skips RSC requests. A `Set-Cookie` is the property that stops most
   shared caches storing a response.
2. The payload **does** contain `initialUserData`.

Today only `private, no-store` keeps that payload out of a shared cache. After
the merge, check this exact request again. If its `cache-control` becomes
`public`, finding 1 has turned from a risk into a real one.

## Content of the home document

| marker | count |
|---|---|
| `data-pw="product-name"` | 10 |
| `id="product_` | 10 |
| `data-pw="product_link"` | 28 |
| `react-loading-skeleton` | 54 |
| `$RC(` | 8 |
| `initialUserData` | 2 |
| `user_id` | 31 |

10 real product cards are in the HTML. That is the number to hold, not beat —
the `connection()` fix restores this, it does not improve on it.

## What to re-run after the merge

Same commands, same machine, guest, no cookies:

```bash
# home, 10 runs — expect HIT and a climbing age
for i in $(seq 1 10); do
  curl -s -o /tmp/a.html -D /tmp/a.hdr \
    -w "%{time_starttransfer} %{time_total} %{size_download}\n" https://<host>/sy-en
  grep -iE "^(age|cache-control|x-vercel-cache|x-nextjs)" /tmp/a.hdr
done

# the RSC payload — finding 1
curl -s -D - -o /tmp/rsc.txt -H "RSC: 1" \
  -H "Next-Router-State-Tree: %5B%22%22%2C%7B%7D%5D" https://<host>/sy-en
```

Pass looks like: `x-vercel-cache: HIT`, `age` climbing then resetting once a
minute, a document size that is **identical** byte for byte between runs, and
10 product cards still in the HTML.
