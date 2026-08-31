---
ticket: homepage-cache-components
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-08-31
links:
  clickup:
  github:
---

# Plan — homepage-cache-components (phase 1)

> Decide the approach before changing code. Plan only — no implementation here.

> **Fifth version.** `review.md` records the gate panel's read of the fourth,
> which found twelve `major` findings. Every one is closed in **Findings closed
> (round 4)** below. Two of them inverted this plan's own safety argument, so the
> wording changed: what was asserted as fact is now a question a measurement
> answers. The owner directed this revision while the work item sits at `review`;
> no lifecycle field was touched.

## Approach

Make the application build and run with `cacheComponents: true`. Delete every
route setting the flag refuses, opt every route out of validation, fix the
synchronous clock reads the prerender refuses, and satisfy the root-parameter
rule with the smallest legal answer.

No route is converted. No `use cache` is added. No cache profile is defined.

Its value is that it is **independently revertable** — which the combined plan
was not — and that it is a hard prerequisite for the conversion. Its value is
*not* that it answers the conversion's open questions.

## What changes that a shopper can see

**1. Component state stops resetting on navigation.** `cacheComponents` turns on
React `<Activity>` route retention, with no opt-out (intake R-15). From the
moment this ships, `components/Home/Search/SearchIcon.tsx` and the eleven
page-mounted modals keep their `useState`, form values and scroll position when a
shopper navigates away and back. The owner accepted this and will repair those
screens separately (D-22) — but it ships **here**.

**2. Possibly nothing else. Possibly an exposure that is already live.**

The fourth version asserted that seven document routes lose a `private,
no-store` response which masks the global `Cache-Control: public, s-maxage=60,
stale-while-revalidate=300` rule at `next.config.ts:97`. **That assertion is
withdrawn as unproven.** Around twenty personal routes under `[lang]` already
carry no `dynamic` export today — `settings/profile/info`,
`settings/profile/Bank-Cards`, `settings/wallet`, `settings/orders/[id]`, and the
whole `sellerProfile/sellerDashboard/**` tree — and they render the same
`AuthNavContainer`. Only two worlds fit that:

- **World A** — a dynamically rendered page never picks up the `/(.*)` rule. Then
  this ticket introduces nothing and the merge blocker is imaginary.
- **World B** — it does. Then the exposure is **already live on `develop`**, is
  far larger than seven routes, and is **not caused by this ticket** — though this
  ticket would extend it to seven more.

**Step 0 decides which world we are in, before any code changes.** It costs one
`curl` per route, and everything below hangs on the reading.

A third possibility, and why this is not academic: **the layout may not block at
all.** `utils/cookies/server-cookie-manager.ts:35-38` wraps `cookies()` in
`try/catch` and returns `null`, and Next's own guidance is that a `try/catch`
catches the prerender bail-out. If it does, the layout can prerender a real
static **guest** shell — which in World B would be marked `public, s-maxage=60`,
letting a signed-in shopper be served guest navigation. That is worse than
blocking, not safer. The same pattern is at
`utils/server/tokenManager.ts:145-150`. Both files are named in section G.

## What this phase does not deliver

`app/(client)/[lang]/page.tsx:77` awaits `searchParams` at the top level. With no
`use cache` anywhere, the prerender is expected to stop early.

| Measurement | Status after phase 1 |
|---|---|
| M-1 route list | **Produced.** The prerendered *count* is expected to be **0**, not "empty shells" — with the opt-out on every segment a dynamic route emits one fallback row and no per-param page |
| M-2 build duration, `.next` size | **Produced**, and meaningful only against step 0's baseline |
| M-3 does `error.tsx` save a build prerender | **Not produced.** Neither an error boundary nor a data prerender exists here |
| M-4 clock reads the prerender rejects | **Partial by construction** — see below |
| M-5 does a `Set-Cookie` stop a stored page being reused | **Not produced.** Nothing is stored |
| M-6 does a crawler get a complete document | **Produced for an empty shell only** |

**M-4 is the dangerous one.** A clock read only fails a prerender when it is
reached. With the render stopping early the build will report *no* clock errors,
and the next phase would inherit a false "complete" list. It must be recorded as
partial, naming these unproven candidates: `services/elastic/helpers.ts:1457`
(likeliest to fire — it runs before the Elasticsearch call on the flash-deal
branch), `helpers.ts:429`, `helpers.ts:2915`, `utils/server/index.tsx:55`.

**One correction to the above.** `generateMetadata` runs even when the page body
does not, and `app/(client)/[lang]/page.tsx` calls `GetHomeMetaData`, which
reaches Redis and Elasticsearch. So "no data reader runs" is **false**, and spec
`E-4` — a build while the search backend is down — is a real case, not a trivial
one.

## Findings closed (round 4)

| # | Finding | Closure |
|---|---|---|
| SR-1 / SEC-1 | "Seven routes" premise unverified; ~20 personal routes already lack `force-dynamic` | Assertion withdrawn. Restated as World A / World B, decided by step 0 over **both** groups. |
| SEC-2 | `getCookieServer` swallows the prerender bail-out, so the layout may prerender a guest shell | Named as the third possibility above; both files added to section G as a declared contingency. |
| SEC-3 | Step 0's baseline lacked today's header matrix | Step 0 now takes the full matrix on `develop` first. |
| SR-2 | `instant = false` throws in a Client Component | Section F corrected: the opt-out goes on the enclosing **server layout**, three named. |
| SR-3 | `generateMetadata` never mentioned; 11 files, 5 outside the plan | Named in section G with all 11; the "no data reader runs" claim corrected above. |
| SEC-4 | Step 7 named no candidate fix | Fix shape pre-decided below; `Vary: Cookie` explicitly rejected. |
| SEC-5 | Two conflicting header models held at once | Made an explicit step-0 question, with a pass/fail for the sitemaps. |
| SEC-6 | Local `pnpm start` does not model the Vercel CDN | The matrix is taken on a **preview deployment**, recording `x-vercel-cache` and `age`. |
| PERF-1 | Blanket `/ingest` `no-store` breaks `recorder.js` caching and re-adds a removed cost | Rule scoped to ingestion paths only; `/ingest/static/*` keeps its upstream headers. |
| PERF-2 | `sitemap-search.xml` is one of the six and carries the ~101-query N+1 | Named in section A; its cold duration recorded at step 6. |
| PERF-3 | The replay measurement cannot be taken — recording is disabled | Restated as a **synthetic** upload; unmeasurable asks dropped; the disabled state recorded. |
| SR-4 | Claim that only ~20 of 36 settings are truly rejected | **Disputed, evidence favours the plan** — a real build emitted 36 errors, one per setting. Recorded in `review.md`. |

Minors folded in: M-1's expected zero (PERF-5); D-23 reworded as cost *moved*
(PERF-6); the sitemap correction de-overcorrected (PERF-10); `wallet-token` and
`me` headers checked (SEC-7); `/` fetched for the logo page (SR-8); the codemod's
~45-file blast radius stated (SR-9); `helpers.ts` line aligned to 1457 (PERF-9).

## Steps

0. **Baseline on `develop`, before any change.** Record the route table, build
   duration and `.next` size — and the **header matrix**: `Cache-Control`,
   `Vary`, `x-vercel-cache`, `age`, signed out and signed in, for (a) the seven
   routes that will lose `force-dynamic`, (b) four personal routes that already
   lack it — `settings/wallet`, `settings/orders/[id]`, `settings/profile/info`,
   one `sellerProfile/sellerDashboard` page, (c) `/api/auth/wallet-token` and
   `/api/auth/me`, (d) each sitemap URL including `/sy-en/sitemap.xml`, and
   (e) `/ingest/static/*`. **This reading decides World A or World B.**
1. **Delete the 36 refused route settings** across 26 files.
2. **Prove the two GET auth routes stay dynamic** and still answer `no-store`.
3. **Fix the three synchronous clock reads** the opt-out cannot clear.
4. **Enable the flag**, add the scoped `/ingest` rule, add `generateStaticParams`.
5. **Run the opt-out codemod**; for client segments put the opt-out on the
   enclosing server layout.
6. **Run the full build and measure.** Record M-1, M-2, M-4 (partial), M-6; repeat
   step 0's matrix **on a preview deployment** and diff it; fetch `/` for the logo
   page; time `curl /sitemap-search.xml` cold; send the synthetic ingest upload.
7. **Fix what the diff shows**, using the pre-decided shape below.

## The pre-decided fix (SEC-4)

If step 6 shows a document route publicly cacheable **and** step 0 shows it was
not before, the fix is to **stop `/(.*)` applying its `Cache-Control` to document
routes** — narrow that rule to asset paths, or add an explicit `private,
no-store` rule for locale-prefixed pages after it. **`Vary: Cookie` is not an
accepted fix**; it is unreliable on the platform CDN.

If step 0 shows the routes were **already** public on `develop`, it is a
pre-existing defect, not this ticket's: record it, open a separate work item, and
do not widen this change to chase it.

## Files to change

### A. Delete refused route settings (23 files)

`app/(client)/[lang]/` — `page.tsx`, `compare/page.tsx`, `featured/…`,
`filters/…`, `flashDeals/…`, `products/[productId]/…`, and both `@modal` pages — 8.

`app/(special)/` — `call_direct/layout.jsx`, `call_direct/page.jsx`,
`callInProg/layout.jsx`, `endCall/layout.jsx` — 4.

`app/api/` — `auth/me/route.ts` (POST, sets its own `no-store`),
`mobile/product/details/[slug]/route.ts`, `mobile/product/qty/[slug]/route.ts`,
`related-products/[id]/route.ts` — 4.

`app/page.tsx` — verified: no `await`, no `fetch`, no dynamic API, not `async`.
**Exempt from the codemod.**

The six `app/sitemap*.xml/route.ts` handlers — delete `revalidate` only.
**Corrected:** five of the six already send `max-age=3600, s-maxage=3600`; only
`sitemap-static.xml:20` sends **43200**, against the config's 3600 — a real 12×
disagreement that step 0 resolves. `sitemap-products.xml:12` and
`sitemap-boutiques.xml:12` read `searchParams`, so their `revalidate` is likely
already inert; the other four are genuinely cached today.
**`sitemap-search.xml` is the expensive one**: `getTopSearchTerms(100)` awaits one
Elasticsearch query per term inside a loop (`sitemap.service.ts:493`) — about 101
sequential queries, moving from hourly to per CDN miss.

### A2. The seventh sitemap route — listed, not edited

`app/(client)/[lang]/sitemap.xml/route.ts` carries no refused setting. It runs the
product scroll, the boutique composite loop **and** the same 101-query N+1, and
`/sitemap.xml` advertises it 20 times. `next.config.ts:122` matches one root
segment only, so it falls under `/(.*)`. Its header is measured at step 0.

### B. The two GET auth routes — proof, not assumption

`app/api/auth/login/route.ts` (`cookies()` at :68) and
`app/api/auth/wallet-token/route.ts` (`getSecureCookie` at :11). Prove both stay
dynamic **and** still answer `no-store` — the second returns a raw token and sets
no header of its own.

### C. Analytics proxy — scoped, not blanket (PERF-1)

- `app/ingest/[...path]/route.ts` — remove `runtime = "edge"`.
- `next.config.ts` — add `no-store` for the **ingestion** paths only, after the
  `/(.*)` block. **`/ingest/static/:path*` keeps its upstream cache headers**:
  `route.ts:51-52` sends those to the PostHog assets host, and
  `utils/posthog.ts:66-71` records that replay was paused because per-chunk
  `/ingest` invocations dominated the bill.

### D. Synchronous clock reads the opt-out cannot clear — three

`ProductExpectedDeleiveryWrapper.tsx:29`, `ProductPhotoSliderWrapper.tsx:46`,
`app/api/mobile/product/details/[slug]/route.ts:74`.

### E. Configuration

- `next.config.ts` — **protected runtime path.** The flag, and the scoped
  `/ingest` rule.
- `app/(client)/[lang]/layout.tsx` — `generateStaticParams` returning
  `[{ lang: "sy-en" }]` **inline**. No shared constant module: `proxy.ts:282`
  fetches the country list from the backend, so a constant would mirror a
  fallback, not the live set.

### F. Opt-out sweep — corrected for client segments (SR-2)

The codemod over `app/`, exempting `app/page.tsx`. **`instant` throws in a Client
Component**, so for client pages the opt-out goes on the enclosing **server
layout**: `app/(special)/call_direct/layout.jsx`, `callInProg/layout.jsx`,
`endCall/layout.jsx` — all three already in section A. The codemod's real blast
radius is every page, layout and default under `app/` — roughly **45 files**;
`implement.md` must list every one it changed.

### G. Declared contingencies — in scope only if step 6 reports them

- **`generateMetadata` (SR-3).** Eleven files export it: `[lang]/page.tsx`,
  `about`, `compare`, `contact`, `featured`, `filters`, `flashDeals`,
  `privacy-policy`, `products/[productId]`, `settings`, `terms-of-service`. Five
  are outside section A. If the build refuses them, the documented fix (a
  `connection()` marker) is in scope here.
- **`useSearchParams` boundaries (OQ-10).** `components/Home/Init.tsx`,
  `components/PathTracker.tsx`, `components/Cart/CartProvider.tsx`,
  `components/global/NavigationLoaderSafetyNet.tsx`.
- **The swallowed bail-out (SEC-2).** `utils/cookies/server-cookie-manager.ts`
  and `utils/server/tokenManager.ts`. In scope only if step 6 shows a guest shell
  prerendered where the plan expects a block.

### H. Tests

No new test file. `tests/proxy.test.ts` — existing, unchanged, must still pass.

## Integration surface

- **Touched:** `next.config.ts` (protected); the global `Cache-Control` rule on
  `/(.*)`; the shared `[lang]` layout; the analytics ingest path; six public
  sitemap endpoints.
- **Depends on them:** every route depends on the layout and the flag. PostHog
  depends on the ingest route. `proxy.ts` depends on `app/page.tsx`. The mobile
  surface calls `related-products` and `mobile/product/*`.
- **Overlapping flows:** none of the product, cart, stories or luck flows —
  except through R-15, which touches every screen holding local state.
- **Ordering:** step 0's baseline must precede everything, or World A and World B
  cannot be told apart. The 36 deletions land before anything else builds.
- **What breaks if this is wrong:** the storefront fails to build; or a document
  route becomes publicly cacheable while carrying signed-in data — and a CDN that
  has stored it is not purged by a revert.

## Tests

| AC | Existing coverage found | Disposition | Test file | Test case |
|------|------|------|------|------|
| AC-1 | `none — searched tests/ by filename` | none — a build is not observable in the unit suite; proven by the `build` check and the unlisted-locale request | — | — |
| AC-2 | `none — searched tests/` | none — proven by the step 0 → step 6 header diff on a preview deployment; a merge blocker only where step 0 shows the route was not already public | — | — |
| AC-3 | `none — searched tests/app/` | none — proven by a **synthetic** upload to the ingestion path; session recording is disabled today, so live chunk counts are unavailable and are not claimed | — | — |
| AC-4 | `tests/proxy.test.ts` covers the gate redirect | existing | `tests/proxy.test.ts` | the gate cases pass unchanged; step 6 additionally fetches `/` for the logo page |
| AC-5 | `none — searched tests/` | none — an honesty property of a written record; proven by `implement.md` marking M-1's count, M-3, M-4 and M-5 as degraded or unavailable | — | — |
| AC-6 | `none — searched tests/` | none — proven by the step 0 → step 6 diff on `/ingest/*` **and** `/ingest/static/*`, which must stay cacheable | — | — |
| AC-7 | `none — searched tests/` | none — a recording obligation; proven by `implement.md` naming the affected screens | — | — |

Six of seven criteria have no unit test. That is the honest shape of a phase that
deletes settings and flips a flag: there is almost no new logic. Its proof is the
`build` check plus the recorded measurements. AC-4 is `existing`; this work item
creates no new test file.

## Validation strategy

- Validation profile: `full` — `lint`, `typecheck`, `unit-tests`, `build`.
- Manual measurements at steps 0 and 6, inside **implement** (VF-7). `/verify`
  re-reads the recorded results.
  1. The header matrix, baseline and after, **on a preview deployment** —
     `Cache-Control`, `Vary`, `x-vercel-cache`, `age`.
  2. An unlisted locale (`/gb-en`) answers 200.
  3. `/` serves the logo page.
  4. Each sitemap URL's surviving header, and `curl /sitemap-search.xml` timed cold.
  5. A synthetic upload to the ingestion path, and confirmation that
     `/ingest/static/*` is still cacheable.

## Answers to deferred questions

| OQ | Answer |
|---|---|
| OQ-1 | **Cannot be answered here.** No error boundary, no data prerender. |
| OQ-2 | **Not applicable.** Nothing is split or cached. |
| OQ-3 | **Partial, and labelled.** Three known reads fixed; the build's list will read empty because the render stops early, so four candidates are named as unproven. |
| OQ-5 | **Cannot be answered here.** Nothing is stored. |
| OQ-6 | **Answered for an empty shell only.** |
| OQ-10 | **Expected not to apply**; the four components are named in section G as a contingency. |

## Rollback

- Revert the merge. Deletions, one flag, one scoped header rule, one inline
  array, one codemod — one unit.
- This phase **is** individually revertable; there is no conversion to unwind.
- A CDN that has already stored a public document is not purged by a revert.
  That is why the header question is settled at step 0, before the change.

## Out of scope

- The conversion — `docs/homepage-cache-phase-2.md`.
- A pre-existing public-cache exposure, if step 0 shows one: record it and open a
  separate work item.
- The seventh sitemap route's N+1 and its unbounded `?page=`.
- `services/elastic/helpers.ts:1457` and the other cached-path clock reads.
- The recommendations endpoint's open cross-origin policy and error body.
- Repairing screens affected by R-15 (D-22).
- `use cache: remote`, `partialPrefetching`, client-cache timing changes, browser
  tests.
