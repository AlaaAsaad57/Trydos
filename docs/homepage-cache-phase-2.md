# Homepage caching — phase 2 (parked)

Split out of `_specs/homepage-cache-components` on 2026-08-31, after three
advisory review rounds found the single work item too large to keep factually
correct. Parked here rather than in a second `_specs/` workspace, because only
one work item is open at a time.

**Phase 1** (the work item that keeps the slug) turns the flag on. It is *not*
behaviour-neutral: `cacheComponents` also enables React `<Activity>` route
retention, so component state stops resetting on navigation (R-15) from the
moment phase 1 ships. **Phase 2 is this document** — the actual conversion. It
becomes its own work item once phase 1 has merged and produced its numbers.

---

## Amendments — read these before the rest of this file

Two decisions changed while the work was being done. The rest of this document
was written before them, so where it disagrees, this section is right.

### Amendment 1 — D-3's `expire` is 300, not 120

D-3 asked for `stale: 60`, `revalidate: 60`, `expire: 120`. `next.config.ts`
now sets `expire: Math.max(300, HOMEPAGE_CACHE_SECONDS * 5)`.

`expire` under five minutes takes a cached scope out of the build prerender
entirely and turns it into a dynamic hole resolved on every request. Measured
both ways: with `expire: 120` the route table said `ƒ` dynamic and the marker
text was not in the file the build wrote; with `expire: 300` it said `◐` and the
marker was there. Two independent signals, same answer. See
`docs/homepage-cache-phase-2-measurements.md`, section "D-3".

Freshness is unchanged. `revalidate: 60` still decides how often content
refreshes.

### Amendment 2 — an unknown category slug renders, it never 404s

Finding 2 said `notFound()` for an unknown slug contradicts AC-15, because the
list it would be checked against is itself cached for 60 seconds — so a genuinely
new category would 404 until the entry expired.

Settled as **shape check only**. `isValidCategorySlug` in
`serverRequests/meta/home.ts` accepts anything slug-shaped and nothing else;
`app/(client)/[lang]/categories/[slug]/page.tsx` calls `notFound()` only when the
shape is wrong. A slug-shaped name the catalog does not know renders the page
with no products, which is a correct page, not an error. A category created a
minute ago opens the moment somebody asks for it.

The cost is measured and it is real: see "An unlisted category slug" in the
measurements file, and the firewall note below.

---

## Why it was split

Phase 1 is independently revertable — which the combined plan was not — and it is
a hard prerequisite. It produces the route table, the prerendered count and the
build cost. It does **not** answer OQ-1 or OQ-5, and its clock-read result is
partial by construction; see the table below.

Phase 2's shape depends on those facts. Planning it first meant planning against
four deferred unknowns — and the plan that tried carried six statements about
this codebase that turned out to be false.

The decisive argument was rollback. The combined plan admitted there was no
partial revert: the flag line and all ~80 files were one unit. A phase 2 problem
in production would have cost phase 1 as well.

---

## What phase 1 must hand over

Phase 2 cannot be planned until these exist. **Only three of the six come from
phase 1.** Its build blocks at `await searchParams` and at the unwrapped
`AuthNavContainer`, so with no `use cache` anywhere the prerender writes an empty
shell — nothing is stored and no data reader runs. Read each row's status.

| # | Measurement | Why phase 2 needs it |
|---|---|---|
| M-1 | The full route table, with the prerendered page count per route | **Produced, shells empty.** Sizes the route set; the 239/370 numbers below already settle the category question |
| M-2 | Build duration and `.next` output size | Against the platform build and deployment limits |
| M-3 | Answer to OQ-1 — does `error.tsx` let a build prerender finish? | **NOT produced by phase 1** — no error boundary and no data prerender exist there. Phase 2's own first task. |
| M-4 | Answer to OQ-3 — clock reads the prerender rejects | **PARTIAL BY CONSTRUCTION.** Phase 1's build reports none, because the render blocks before reaching them. Do NOT read an empty result as complete. Unproven: `services/elastic/helpers.ts:1457` (likeliest to fire), `helpers.ts:429`, `helpers.ts:2915`, `utils/server/index.tsx:55`. |
| M-5 | Answer to OQ-5 — does a middleware `Set-Cookie` stop a stored page being reused? | **NOT produced by phase 1** — nothing is stored. Phase 2's own first task. |
| M-6 | Answer to OQ-6 — does a crawler still get a complete document? | **Produced for an empty shell only.** |

### Already measured, 2026-08-31

- Staging catalog: **239 documents** in `products_catalog_develop`.
- **370** distinct `custom_categories.id` in the nested field.
- So the page count is `20 locales × (1 + N)` — roughly **1,860 to 7,420 pages**
  depending on whether category ids are shared across languages.
- **Consequence:** prerendering is not viable at this scale, and D-23 settles it
  — prerender the minimum and build everything else on demand. The page count
  therefore stops being a blocking unknown.

---

## Decisions that carry over

From `_specs/homepage-cache-components/intake.md`. Still the owner's, still
binding unless changed.

| # | Decision |
|---|---|
| D-3 | Cache window: `stale: 60`, `revalidate: 60`, `expire: 120` |
| D-4 | A named `homepage` profile in `next.config.ts`, driven by `HOMEPAGE_CACHE_SECONDS`, fallback 60 |
| D-5 | Stories request starts during HTML parse, not after hydration |
| D-6 | Stories go through the existing `/api/proxy` |
| D-7 | The visitor's own story tile is decided from the Zustand store |
| D-8 | Lucky badges: an inline pre-paint script reads `redemed_ids` |
| D-9 | The signed-in navigation stays server-side and streams behind `Suspense` |
| D-11 | Currency is cached per country and language, on the gateway base |
| D-12 | Unit suite only; no browser test |
| D-13 | Category view moves to `/{lang}/categories/{slug}` |
| D-14 | No redirects from the old `?mainCategory=` addresses |
| D-17 | **SUPERSEDED 2026-08-31 — see D-23.** Originally: prerender all 20 locales. |
| D-23 | **Prerender the minimum, build the rest on demand.** `generateStaticParams` returns only what the framework demands (one locale). Every other locale and every category page is built on its first visit and cached from then on. Evidence: `cacheLife.md:92` — revalidation is triggered by *a request*, not a timer, so an unvisited page is never rebuilt; and `dynamic-routes.md:157` — "Pages rendered with runtime params are saved to disk after a successful first request." **This removes the build-cost blocker entirely**: deploys stop paying for 1,860–7,420 pages nobody may open, the build's dependence on Elasticsearch nearly disappears, and the chance of caching an error page drops to one page at a time. The only cost is that the first visitor to each URL sees the App Shell before it upgrades. |
| D-22 | State no longer resetting on navigation is recorded, not fixed here |

---

## Open findings phase 2 must answer

Numbered as the advisory panel raised them. None is closed.

### Must be settled in the plan, not at merge

1. **The global `Cache-Control` header.** `next.config.ts` sends
   `public, s-maxage=60, stale-while-revalidate=300` on `/(.*)`. Today
   `dynamic = "force-dynamic"` makes Next send `private, no-store`, which masks
   it. Phase 1 removes `force-dynamic`. Phase 2 starts streaming a personalised
   navigation inside that document. Worse, client-side navigations fetch the RSC
   payload, and `proxy.ts`'s `missing:` clause skips those requests — so they
   carry **no `Set-Cookie`**, removing the one property that stops most shared
   caches storing them. The RSC payload for `/sy-en` contains
   `UserNavTopSection`'s `initialUserData`. Decide: delete the rule, scope it to
   assets, or mark document routes `private`.
2. **`notFound()` for an unknown category slug contradicts AC-15.** Validating
   against a 60-second cached list means a genuinely new category 404s until the
   entry expires. AC-15 requires it to open. Both cannot be true. Pick one.
3. **`generateMetadata` runs regardless of the page's `notFound()`.**
   `serverRequests/meta/home.ts:15-17` builds `meta-obj-${category}-${lang}-${country}`
   from the raw slug and `RedisSet`s it at `:104`; `:44` puts the raw slug in the
   title, description and OpenGraph URL. The slug check must run there too.

### Facts to re-verify before writing anything

Each of these was asserted and proved false during phase 1 planning. Do not
trust the earlier text.

4. **`serverRequests/stories.ts` must not be deleted.** Four live callers:
   `components/Chat/pages/StoriesList.tsx:31`,
   `components/Home/Stories/AddStoryWidget.tsx:263` and `:311`,
   `components/Login/Enhanced/FullEnhancedLoginWidget.tsx:232`. Only
   `StoriesBarServer.tsx` goes.
5. **`is_flash_deal_active` is not dead output.** It ships to the mobile app
   through `app/api/related-products/[id]/route.ts` with wildcard CORS.
   **Confirm with the mobile team before removing it.** The intent — move the
   flash calculation to the client, as the lucky timer already is — remains
   right; `components/products/ProductCard/flashPrice.ts` already does it for the
   web.
6. **`services/elastic/helpers.ts:1458`** runs `new Date().toLocaleDateString()`
   inside `buildBaseConditions` on the `filters.flashdeal === true` branch — the
   homepage flash-deals path. It is the Elasticsearch range bound and **cannot**
   be deleted. Pass the date in from outside the cached scope so it joins the
   cache key.
7. **`getCurrency` callers** are `app/(client)/[lang]/page.tsx:81`,
   `components/Product/ProductPageContent.tsx:55` and
   `services/wallet/index.ts:485`. `featured` and `flashDeals` define their own
   local copy. Changing the failure mode changes the wallet path, where `{}` is
   currently truthy and walks on.
8. **`currency.ts` must keep `"use server"`.** `serverRequests/index.tsx` is
   imported by client components and re-exports it; a plain cached module there
   pulls `next/headers` into the client graph — passes `tsc`, fails the build.
9. **`ModalSlot` reads `usePathname` during render**
   (`components/ModalRoute/ModalSlot.tsx:44, 48, 56`), not in an effect, so the
   push-the-read-into-a-leaf fix does not apply. It is the hard case, not
   `NavigationLoaderGate` (whose read is effect-only).
10. **`app/api/products/recomended`** is not fixed by this work. It still has
    wildcard CORS, still trusts a browser-supplied `user_id`, and still returns
    an error body naming the search engine. Separate work item.

### Design points

11. **Do not create a shared sitemap cache module** — but not for the reason
    first written. Corrected facts: `app/sitemap-static.xml/route.ts:5,20` uses
    **43200**, not 3600, while `next.config.ts:122-134` sets 3600 for the same
    URL — they disagree by 12x and which one the CDN honours is unestablished.
    The real cost is **not** the catalog scroll (one batch at 239 documents); it
    is `getTopSearchTerms`, which awaits one Elasticsearch query per term inside
    a `for` loop (`sitemap.service.ts:493`) — about **101 sequential queries per
    request**. That N+1 lives in `app/(client)/[lang]/sitemap.xml/route.ts`, a
    **seventh** sitemap route missed by every earlier list, advertised 20 times
    (once per locale) and falling under `/(.*)`'s `s-maxage=60` because
    `next.config.ts:122` matches one root segment only. `/sitemap-search.xml`
    carries the same N+1. Also: `?page=` is unbounded AND costs the same for
    every value, because the generator builds all URLs then slices — clamp it
    whenever these routes are next touched, cached or not.
12. **Cache the derived category map, not the raw hits.** Caching
    `getCategories({country, size: 4000})` stores the whole hit set with all
    language variants. Cache the small derived list instead.
13. **`[lang]` becomes a cache key and is unvalidated.** `proxy.ts` validates the
    locale pair, but its matcher skips RSC and prefetch requests, so `/zz-qq/...`
    reaches the segment directly. Reject unknown locales.
14. **`Cart/AddToCart/Button.tsx:35, 57`** reports `is_luck` and a luck price to
    PostHog without re-checking the cookie. Moving the gate client-side makes
    cached cards carry `is_luck: true` for a shopper who already redeemed.
15. **The two inline scripts** push the deferred `script-src` CSP further out of
    reach — a nonce cannot be per-request inside a shared cached document. Note
    it for the CSP work item.

### Verification that must be designed properly

16. **The two-cookie-jar check** as first drafted could not fail. It needs: the
    signed-in request **first** to warm the shared entry, a positive control so
    an empty diff cannot pass, the correct wire cookie names (`User-Data`, not
    `USER_DATA`), and an explicit statement that `pnpm start` has no CDN so the
    header risk is out of its reach.
17. **The AC-16 import-graph assertion** must state its mechanism (source/AST
    scan, not runtime), must cover the cached *component* props and not only the
    reader module, and must assert it resolved a known-bad module first — the
    repo's `"*": ["./*"]` alias makes a naive walker silently skip
    `utils/...`, `store` and `serverRequests/...`.
18. **The performance measurement** must include aggregate load, not only
    per-visit numbers on a warm cache: Elasticsearch queries per minute across
    all routes, the revalidation rate, the cache hit ratio, a cold request, an
    unlisted slug, and a written threshold that would block the merge.

---

## The honest outcome statement

Carry this into phase 2's spec. The first version overstated the benefit.

- **Today:** 1 function invocation per homepage visit, full render, several
  Elasticsearch queries.
- **After:** 1 invocation for the document (the layout keeps dynamic holes, so no
  response is served CDN-only), plus 1 for stories and 1 for recommendations —
  **3 invocations**, but roughly **0 Elasticsearch queries on a cache hit**.

The win is Elasticsearch load and render duration, **not** invocation count. The
stories bar paints one round trip **later** than today. And below roughly one
visit per (locale × category) route per cache window, this change *raises* total
Elasticsearch load rather than lowering it — which matters, because no production
environment exists yet.

---

# What this change does not fix

Recording these is the deliverable. An unrecorded known problem cannot be told
apart from an unknown one.

### Finding 15 — the CSP nonce, still open, and this change made it harder

The document now carries two inline scripts: the image fallback (already there)
and the redeemed-luck script (added by this change). A Content-Security-Policy
`script-src` needs a nonce per response, and a nonce cannot be per-request
inside a document that is shared between shoppers — the nonce would be stored
with the page and reused, which is the same as having no nonce.

The CSP work item has to choose one of: a hash-based `script-src` for these two
scripts (they are fixed strings, so their hashes are stable), or moving both to
external files, or leaving `script-src` out of the policy. This change did not
make that choice.

### D-22 — state no longer resets on navigation

Cache Components enables React `<Activity>` route retention, so component state
survives a navigation away and back. This shipped with **phase 1**, not with
this change, and is recorded rather than fixed. It affects `SearchIcon` and the
eleven page-mounted modals.

### Finding 5 — `is_flash_deal_active` and the mobile app

The field is still returned by `app/api/related-products/[id]/route.ts`, and it
is still correct: the route handler computes it with a real clock. It was
removed from `formatProduct`, which is now reachable from a cached scope.
**Confirm with the mobile team** before anything removes it from the response
entirely.

### Finding 10 — `app/api/products/recomended`

Not touched by this change and not fixed by it. Wildcard CORS, a
browser-supplied `user_id`, and a 500 body that echoes the error message —
which names the search engine to the browser — plus every filter. It has its
own ticket.

Task 20 gives it a second reason to be picked up. Recommendations are the only
Elasticsearch query left on a warm home page: 30 requests, 30 queries, all of
them this reader. The rest of the page now costs nothing until the entry
expires.

### Finding 9 — `ModalSlot` reads `usePathname()` during render

`components/ModalRoute/ModalSlot.tsx` reads the route during render, not inside
an effect. It is a client component in the layout, so it is not inside a cached
server scope and it did not block this work. No task here touches it. It is the
hard case the finding named, and it stays open.

---

## Found while doing the work, not planned for

### The metadata cache adds less than finding 3 claimed

Finding 3 said `generateMetadata` runs on every request, including requests
served from a cached page, so an uncached reader there asks the search engine
for a title that did not change once per visit. The first half is true. The
second is not, and it was measured after the fix went in:

```
META-ENTER  redisHit=false
META-CACHED-SCOPE-RAN slug=bags
META-ES-QUERY slug=bags
META-ENTER  redisHit=true   (five more times)
```

The Redis check at the top of `GetHomeMetaData` already answers every repeat.
The new `use cache` scope was entered **once**, on the only request that got
past Redis. While Redis is up it removes no query at all.

What it does add is a fallback for when Redis misses or is down, and a
revalidation tag. That is worth four lines, and the plan approves it, so it
stayed. But the benefit is smaller than the finding stated, and anyone building
on it should know that.

### A cached scope leaks through ambient module state

Next refuses `cookies()` inside a `use cache` scope, and it puts every argument
and every closed-over binding into the cache key. So the obvious ways to leak
one shopper's data into another's page are blocked by the framework.

Module state is not. A cached scope that reads a module-level variable stores
whatever the first request happened to write there and hands it to everyone
afterwards. Demonstrated on a real build while proving
`tests/cache/sharedEntryIsNotPersonal.test.ts` can fail: a five-line probe in
`AuthNavContainer` put a signed-in shopper's profile into the next guest's
document.

Nothing in the code does this today. It is written down because it is the one
leak the framework will not catch for you.

### An unlisted category slug needs a firewall rule

Measured: about five Elasticsearch queries and one new cache entry per invented
slug-shaped name, at roughly one second each. Amendment 2 is why, and Amendment
2 is right — a new category has to open the day it is created. So the limit
belongs at the platform edge, in the Vercel Firewall, keyed on the path prefix
`/[lang]/categories/`. It is needed whether or not this change merges. Numbers
in `docs/homepage-cache-phase-2-measurements.md`, "An unlisted category slug".

### T-1 fails against the threshold that was written for it

`docs/homepage-cache-phase-2-measurements.md` carries the full verdict. In
short: the threshold asked for at most 4 Elasticsearch queries per 20 home
requests and the measurement is 20, because the personal recommendations reader
costs one per visit and is not cached on purpose. Against the load the
criterion was about, 700 queries became 20. T-2, T-3 and T-4 pass. Whether T-1's
number is restated is the owner's decision, not this document's.

### A stale comment names the backend technology

`serverRequests/products.ts:146` says "Verified users → Laravel, guests → Go".
CLAUDE.md's stack-agnostic rule forbids naming the backing technology anywhere
we control, comments included; the roles are the **core** backend and the
**gateway**. The file is not changed by this work, so the comment is recorded
here rather than edited, to keep this change small.

### `notFound()` on a partially prerendered route answers 200, not 404

Found at the final gate. `app/(client)/[lang]/categories/[slug]/page.tsx` calls
`notFound()` when the slug is not slug-shaped. The not-found page really does
render — the words are in the document — but the status is **200**.

Measured on the final build:

| request | status | body |
|---|---|---|
| `/sy-en/this-route-does-not-exist` (no such route) | **404** | not-found page |
| `/sy-en/categories/x!y` (route exists, `notFound()` runs) | **200** | not-found page |
| `/sy-en/categories/..%2F..%2Fetc%2Fpasswd` | **200** | not-found page |

The reason is partial prerendering. `/[lang]/categories/[slug]` is a `◐` route:
the shared shell is sent first, and by the time the page component runs and
calls `notFound()`, the status line has already gone out. A route the router
does not know at all never gets that far, so it still answers 404.

This is not a regression — before this change the category view was
`?mainCategory=`, which never 404ed either. But the guard does not do what its
author meant, and it will behave the same on **every** `◐` route in the app that
calls `notFound()`.

What it costs: a crawler sees a soft 404 — a 200 response with "not found"
content — so an invented URL can be indexed as a real page. Today
`X-Robots-Tag: noindex, nofollow` covers it, because `NEXT_PUBLIC_ALLOW_INDEXING`
is off everywhere. It stops covering it the day a production environment exists.

Not fixed here. A real 404 would mean making the route dynamic, which is the
opposite of this whole change, so the choice belongs to the owner. The cheapest
middle answer, if it is wanted, is to return `robots: { index: false }` from
`generateMetadata` for a slug that fails the shape check.

---

## The product rows were never sent as HTML (found after the merge review)

The featured row flashed on every home page load: its skeleton painted, the
section then collapsed to a bare 50px header, and the product cards appeared
about a second later — moving everything below them. An earlier change fixed a
real hydration mismatch in the flash-deal countdown, and the flash stayed. The
countdown was not the cause.

### What the server was actually sending

Measured on a production build (`pnpm build && pnpm start`), `/sy-en`:

```
document                                375,874 bytes
  data-pw="product-name"                      0     ← no real card anywhere
  id="product_"                               0
  data-pw="product_link"                     18     ← all of them the skeleton's
  react-loading-skeleton                     54
```

The skeleton reuses the real card's `data-pw` markers, which is why a first look
at those counts is misleading. There was **no product card in the HTML at all**.
The products were in the document only as streaming payload, so the browser had
to render the rows itself.

Reading React's own streaming markers made the shape exact. The featured
boundary resolved on the server as:

```html
<div hidden id="S:0"><a href="/sy-en/featured">…Featured Products</a></div>
<script>$RC("B:0","S:0")</script>
```

Header link, nothing else. `$RC` swaps a boundary's fallback for that content,
so a 457px skeleton became a 50px header. In a browser: boutiques top at 1301px,
then 417px, then 834px, with React error #418 in the console.

### Why

A product card cannot be prerendered. The two rows sat in a `<Suspense>`
boundary with nothing in it that asks for the request, so the prerender had no
point to stop at, and React gave up on server-rendering the boundary and left it
to the browser.

This was narrowed down by building the same page four ways and asking each one
for its HTML:

| what the row rendered | product cards in the HTML |
|---|---|
| the real `ProductCard` inside `HortiznalScrollBar` | no |
| the real `ProductCard` inside a plain `<div>` | no |
| a plain `<span>` per product | **yes** |
| the real `ProductCard`, with its two clock reads pinned to a fixed value | no |
| the real `ProductCard`, with `await connection()` in the wrapper | **yes** |

The clock was the first suspect — `ProductCard` calls `new Date()` and
`useLuckTimer` calls `Date.now()` during render, and the Next guide names those
as calls that cannot be deferred. Pinning both did **not** fix it, so the clock
is not the whole story and neither read was changed. What fixed it is giving the
prerender somewhere to stop.

### The fix

`await connection()` in `FeaturedProductWrapper` and `FlashProductWrapper`,
before any card renders. The prerender ends there; at request time the rest of
the row is rendered on the server and streamed as real HTML. It costs no backend
call — the products still come from the cached readers.

After: 10 product cards in the HTML, the featured row 457px from its first
paint, and no React #418.

### The second jump: a skeleton for a row that renders nothing

Fixing the featured row left a 467px jump. The flash-deal row shows the same
457px skeleton, and with no deal running it renders nothing, so the skeleton
collapsed to zero and pulled the boutiques section up.

A skeleton is a promise about the final size, and a wrong promise is a jump.
`CategoryHomeView` now asks the cached readers whether each row will have
anything in it, and renders the `<Suspense>` only when it will. Asking costs no
backend call: the wrappers read the same cache entry again inside the boundary.

The answer is as old as the shell, at most 60 seconds. A deal that starts inside
that window appears at the next revalidation — the same delay the row's own data
already has.

Measured after both fixes, `/sy-en` in a real browser:

| | boutiques top over the first 6 seconds |
|---|---|
| before | 1301 → 417 → 834 (moved 884px) |
| after `connection()` | 1301 → 834 (moved 467px) |
| after both | **834, never moves** |

### Still open: the recommendations row

The recommendations row below the boutiques has the same 457px skeleton and
renders nothing for a signed-out shopper. It is **not** fixed here, and cannot be
fixed the same way: it reads the shopper's own cookie, so a shell shared by every
visitor can never know its answer in advance. It sits below the fold on a 900px
viewport, so it does not move anything a visitor is looking at on load. The check
in `tests/cache/homeRowsRenderOnTheServer.test.ts` says out loud that it only
covers the two rows above the boutiques.

### What guards it

`tests/cache/homeRowsRenderOnTheServer.test.ts`:

- a source check, run by CI on every pull request, that every home row which can
  render a product card asks for the request first;
- a check against a running server that the home document carries real product
  cards, not only streaming payload;
- a check that every product-row skeleton above the boutiques is filled.

Both server checks skip loudly with no server on port 3111, the same as
`tests/cache/sharedEntryIsNotPersonal.test.ts`, because the unit suite gates
every pull request with nothing running.
