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
