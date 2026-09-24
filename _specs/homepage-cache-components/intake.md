---
ticket: homepage-cache-components
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-08-31
links:
  clickup:
  github:
---

# Intake — homepage-cache-components

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`homepage-cache-components` — no ClickUp task and no GitHub issue yet. The
request came directly from the Workflow Owner in a working session on
2026-08-31.

Direct follow-up to `_specs/next-16-3-upgrade`. That ticket upgraded the app to
Next.js 16.3 and **deliberately left Cache Components out** — see its
`spec.md > AC-12` ("No caching-migration feature is introduced: no cache
components, no partial prefetching, no loading shells") and
`research.md:168` ("Scope drift into Cache Components"). This ticket is the
piece that was held back.

## Ticket Summary

Make the storefront homepage cacheable. Today `app/(client)/[lang]/page.tsx`
exports `dynamic = "force-dynamic"`, so every visit renders the whole page on
the server. Nothing is reused between visitors.

The goal is a homepage whose shell is cached for one minute, with the parts
that depend on the visitor moved out of that shell. Two blocks are named
explicitly in the request: the **stories bar** and the **luck badges**. Both
read cookies on the server today, and both are why the page cannot be cached.

The category view moves from the query parameter `?mainCategory=<slug>` to a
real route, `/{lang}/categories/{slug}`, so that it can be cached the same way.

## Ticket Metadata

- id / slug: `homepage-cache-components`
- title: Cache the homepage for one minute using Next 16.3 Cache Components
- owner: developer
- created: 2026-08-31
- links: none yet
- base branch: `develop` (this repository's base; `main` is the staging branch)

## User Story

> As a shopper opening the Trydos homepage, I want the page to arrive already
> built, so that I see products in the first moment instead of waiting for the
> server to fetch everything again for me alone.

> As the team paying the hosting bill, I want one homepage render to serve many
> visitors for a minute, so that Function Duration stops scaling one-to-one with
> traffic.

## Acceptance Criteria Presence Check

- Present? **yes** — drafted below. The `spec` stage owns the final wording and
  the stable `AC-n` ids; this list is the requester's intent, not the spec.

Draft criteria:

1. The homepage shell is served from Next's route cache and is rebuilt at most
   once every 60 seconds. The 60 comes from an env var with a fallback.
2. The rendered product sections (featured, flash deals, boutiques) are part of
   that cached output, not streamed per visitor.
3. The category view lives at `/{lang}/categories/{slug}` and is cached the same
   way as the homepage.
4. The stories bar renders on the client. Its data request starts while the
   browser is still parsing the HTML — it must not wait for hydration.
5. The stories data request goes through the existing `/api/proxy` route
   handler, so the stories token stays in its HttpOnly cookie.
6. A visitor who already redeemed a luck product never sees that product's luck
   badge, not even for one frame, even though the HTML came from the cache.
7. The top navigation still shows the signed-in user. It streams in and does not
   block the cached shell.
8. Nothing that identifies a visitor is stored in a shared cache entry.
9. A failure from Elasticsearch on the homepage shows an error area instead of
   blanking the whole document.
10. Every other route in the app keeps working exactly as it does today.

## Test Cases Presence Check

- Present? **yes, as a decision** — the requester chose the **unit suite only**
  (`tests/`, Vitest). No browser test is added in this ticket.
- Notes: this choice is recorded with its cost. The unit suite can prove the
  cache *configuration* (the profile values, the env var and its fallback) and
  the client behaviour (the luck gate, the shape of the stories proxy request).
  It **cannot** prove that a running deployment actually serves a cached
  response. Draft criterion 1 therefore has no runtime evidence in this ticket.
  This is an accepted limitation, chosen by the owner, and the `spec` stage must
  write it down as such rather than claim coverage it does not have.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **No.** The current
  behaviour was already read during intake; nothing further needs studying.
- Is the goal to *choose between options*? **No.** Every option was put to the
  Workflow Owner during intake and answered. The choices are recorded below.
- Is the change to make already known, leaving only building it? **Yes.**

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` (via `/wf:start-ticket`, which fixes the type to `development`) |
| ClickUp field said | — (no ClickUp task) |
| Argument said | `development` |

## Decisions Already Made By The Requester

These were asked and answered during intake. They are **inputs**, not planning.
The `research` and `spec` stages must treat them as given and record any that
turn out to be impossible as a finding, not silently change them.

| # | Question asked | Decision |
|---|---|---|
| D-1 | What does "cached for one minute" mean? | Next 16.3 **Cache Components** (PPR), not a shared CDN `Cache-Control`. One ticket, not split. |
| D-2 | `cacheComponents` is a global flag. What about the rest of the app? | Turn the flag on, opt every other route out of validation with the documented `cache-components-instant-false` codemod, and convert **only** the homepage, the category route and the client layout. |
| D-3 | Which "one minute"? | Content is at most about 60 seconds old: `stale: 60`, `revalidate: 60`, `expire: 120`. |
| D-4 | Where does the duration live? | A named `homepage` cache profile declared in `next.config.ts`, called as `cacheLife("homepage")`. The requester also asked for an env var with a fallback, so the profile's numbers come from an env var read at build time, defaulting to 60. |
| D-5 | Stories — when does the request start? | An inline script starts the request while the browser parses the HTML, and the client component reads that promise. It must not wait for hydration. |
| D-6 | Stories — which endpoint? | The existing `/api/proxy` route handler. |
| D-7 | Stories — how does the client know which tile is the visitor's own? | From the Zustand store, the way `components/Home/AddStory.tsx` already does. Not from a server cookie read. |
| D-8 | Luck badges — how do we avoid showing a badge to someone who already redeemed? | An inline script that runs before the first paint reads the `redemed_ids` cookie and marks the document; CSS hides those badges. This is the pattern Next documents in `01-app/02-guides/preventing-flash-before-hydration.md`. |
| D-9 | Top navigation (`AuthNavContainer`) — it reads four cookies in the layout. | Keep it on the server and stream it behind `Suspense` as a dynamic hole. It was the only possible answer: all four cookies are HttpOnly (`utils/cookies/cookie-manager.ts:95-110`), so the browser cannot read them. |
| D-10 | Recommended products — they read the user id from a cookie. | Move the block to the client. `app/api/products/recomended/route.tsx` gains a server-side fallback that reads the user id from the cookie when the query parameter is absent, so the id never travels in a URL and no extra round trip is added. |
| D-11 | Currency — its base URL is chosen by reading a cookie. | Cache it per country and language, and always call the **gateway** base. Confirmed safe: see OQ-D below. |
| D-12 | How are the criteria proved? | Unit suite only. See the Test Cases check above for the gap this leaves. |
| D-13 | `?mainCategory=` keeps the products out of any cached shell. What replaces it? | A real route: **`/{lang}/categories/{slug}`**. The query parameter is dropped. |
| D-14 | Do the old `?mainCategory=` URLs need redirects? | **No.** The app has not launched, so there are no live URLs to keep working. The old query parameter simply stops doing anything. |
| D-15 | What happens to `generateMetadata`, which reads `?mainCategory=`? | It follows from D-13: the category route reads `params`, not `searchParams`, so per-category titles keep working with no dynamic-marker component. |
| D-16 | What happens to `experimental.staleTimes`? | Leave it alone. The `homepage` profile names all three values, so it inherits nothing from the `default` profile that `staleTimes.static` redefines. Touching `staleTimes` would change every other route, which is outside this ticket. |
| D-17 | `[lang]` is a root parameter. Does it need `generateStaticParams`? | **Yes — it is mandatory, not a choice.** `app/(client)/[lang]/layout.tsx` must export it, or the build fails. It returns **all 20 locales** (5 countries x 4 languages) so no visitor ever sees an App Shell before the products. The list is a constant mirrored from `proxy.ts`; it needs no backend call. |
| D-18 | Where do the category route's slugs come from at build time? | From `GetMainCategories`, wrapped in `use cache`. The same cached entry serves `generateStaticParams` and `MainCategoriesNavbar`, and the underlying Elasticsearch query keys only on `country`, so ~20 build-time calls become 5. |
| D-19 | What if that slug lookup returns nothing or throws? | **Let the build fail. No fallback list.** An Elasticsearch outage must be loud, not papered over with an invented list that can go stale. The cost is accepted: an Elasticsearch restart blocks every deploy until it recovers. |
| D-20 | What if Elasticsearch fails while the homepage itself is being prerendered? | Add **`app/(client)/[lang]/error.tsx`**. The build finishes with the error state prerendered, and the next revalidation in 60 seconds replaces it once Elasticsearch is back. The same boundary also fixes a known live problem: today one Elasticsearch throw blanks the entire document because no boundary exists under `app/(client)`. |
| D-22 | Component state stops resetting on navigation (R-15). Do we fix the affected modals here? | **No.** This ticket records the rule and the candidate list only. The owner will handle those components in separate work. |
| D-21 | Should `partialPrefetching` be turned on too? | **No — out of scope.** Serving an App Shell for an unlisted param works with `cacheComponents` alone. `partialPrefetching` only changes link prefetching, app-wide, for every route in the app. That is blast radius this ticket does not need. (`03-api-reference/05-config/01-next-config-js/partialPrefetching.md`) |

## Questions Resolved At Intake

Every open question raised at intake was answered before the ticket left this
stage. The evidence is recorded so `research` can re-check it rather than
re-open it.

| # | Question | Answer | Evidence |
|---|---|---|---|
| OQ-A | Are Route Handlers validated by `cacheComponents`? | **Yes.** `GET` handlers follow the same model as pages. The 6 sitemap routes that export `revalidate = 3600` must move the data into a `use cache` helper with `cacheLife`. The 3 auth routes are `POST` and only export `dynamic = "force-dynamic"`, which the guide calls "not needed" — a plain delete. **R-1 does not shrink.** | `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md:764` (Route Handlers), `:135` (`force-dynamic`), `:223` (`revalidate`) |
| OQ-B | Should `?mainCategory=` variants be cached? | Replaced by D-13. A component that reads `searchParams` is excluded from the prerendered shell and runs on every request, so the products could never be shared. Moving the category into the URL path removes the problem instead of working around it. | same guide, `:664` (`cookies`, `headers`, and `searchParams`); `01-getting-started/08-caching.md:204` (passing runtime values to cached functions) |
| OQ-C | Does a middleware `Set-Cookie` block Next's route cache? | **No.** Cache Components stores an RSC payload in Next's own store — prerendered HTML on disk or platform storage — and does not depend on the shared `Cache-Control` header. The `proxy.ts` cookie writes ride on the response and cannot stop the payload being reused. `research` still confirms this on a real build. | `01-getting-started/08-caching.md:587` (Where cached content is stored) |
| OQ-D | Does the gateway return the same currency as the core backend? | **Yes, identical for every supported country.** Tested against both staging bases with the same headers `serverRequests/ServerFetch.tsx` sends. sy → `SYP 100`, tr → `TRY 40`, iq → `IQD 1300`, lb → `LBP 89610`; both backends returned the same values. D-11 is safe. Note for whoever repeats this: both backends read the **`country` header**, not the query string, and each falls back to a different default when the header is missing. | live check on `GO_BACKEND_URL` and `BACKEND_URL`, 2026-08-31 |
| OQ-E | What happens to `experimental.staleTimes`? | Answered by D-16. `staleTimes.static` redefines only the **`default`** profile's `stale`; a named profile that sets all three values inherits nothing. | `03-api-reference/04-functions/cacheLife.md`, "Client cache behavior" |
| OQ-F | Does the inline stories script expose anything new? | **No.** `utils/serviceTokens.ts` states in its own comment that the token map "necessarily ships to the browser", and `utils/fetchData.ts:592` already sets `x-proxy-server` from client code today. The script uses only values the bundle already carries. | `utils/serviceTokens.ts:13-16`, `utils/fetchData.ts:590-618` |
| OQ-G | What do the Cache Components rules require of `generateMetadata`? | Answered by D-15. Under Cache Components `generateMetadata` follows the same rules as components: reading runtime data while the page is otherwise prerenderable is an error. Reading `params` on the new category route is not runtime data in that sense, so no dynamic marker is needed. | `migrating-to-cache-components.md:824` |

## Constraints And Risks Named At Intake

**Blocking the cache today — every runtime read on the homepage path**

| Where | What it reads |
|---|---|
| `app/(client)/[lang]/page.tsx:2` | `dynamic = "force-dynamic"` |
| `app/(client)/[lang]/page.tsx` | `searchParams` (`?mainCategory=`), in both the page and `generateMetadata` |
| `components/Home/AuthNavContainer.tsx` (rendered by the layout) | `USER_DATA`, `USER_CHAT`, `USER_STORIES`, `WALLET_USER` |
| `components/Server/StoriesBarServer.tsx` | `USER_STORIES`, `STORIES_TOKEN` |
| `components/ServerWrapper/FeaturedProduct.tsx`, `FlashDealsProduct.tsx` | `redemed_ids`, through `utils/cookies/getRedeemedIds.ts` |
| `components/ServerWrapper/BoutiquesListWrapper.tsx` | `USER_DATA` (for the recommendations user id) |
| `serverRequests/currency.ts` → `utils/server/tokenManager.ts:144` | `USER_DATA`, to pick the backend base |

**Where `mainCategory` is read today** — measured, so the size of D-13 is known:
`app/(client)/[lang]/page.tsx` (11), `components/Server/MainCategories/index.tsx` (8),
`components/ServerWrapper/BoutiquesListWrapper.tsx` (6),
`components/Home/CategoryNavMobile.tsx` (4),
`components/ServerWrapper/FlashDealsProduct.tsx` (3),
`components/ServerWrapper/FeaturedProduct.tsx` (3),
`components/global/InfinteScroll.tsx` (3),
`components/Server/OfferListServer.tsx` (2), `components/Server/Navbar.tsx` (2),
`serverRequests/meta/home.ts` (1), `serverRequests/meta/buildAlternates.ts` (1),
`components/Notifications/NotificationItem.tsx` (1),
`components/global/NavigationLoaderSafetyNet.tsx` (1).

Only **one** place builds the category link — `components/Home/CategoryNavMobile.tsx:31-35`.
No sitemap route emits a `?mainCategory=` URL. `buildAlternates` already takes a
free-form path suffix, so `/categories/{slug}` drops in where `?mainCategory=`
was.

**Risks**

- **R-1 — the flag is global. PROVEN by a real build, and larger than first
  written.** `cacheComponents: true` was set locally and `npx next build` was run
  on 2026-08-31. Result: `Turbopack build failed with 36 errors`, every one of
  them the same message — `Route segment config "<name>" is not compatible with
  nextConfig.cacheComponents. Please remove it.`

  **36 errors across 26 files:**

  | Config | Count |
  |---|---|
  | `runtime` | 14 |
  | `dynamic` | 12 |
  | `revalidate` | 7 |
  | `dynamicParams` | 3 |

  **Correction to an earlier note in this file: `runtime` is NOT exempt.** All 14
  must be removed, including the 13 that say `runtime = "nodejs"`, which an
  earlier draft wrongly called "no change needed". Node is the default under
  Cache Components, so removing them is a delete, not a rewrite — but the build
  refuses to start until every one is gone.

  The 26 files: the 8 pages under `app/(client)/[lang]/` (`page`, `compare`,
  `featured`, `filters`, `flashDeals`, `products/[productId]`, and both `@modal`
  slots), 4 files under `app/(special)/` (call_direct layout + page, callInProg
  layout, endCall layout), 6 route handlers under `app/api/` (auth login / me /
  wallet-token, mobile product details / qty, related-products),
  `app/ingest/[...path]/route.ts`, `app/page.tsx`, and the 6 sitemap routes.

- **R-1b — the build stops at config validation, before it renders anything.**
  This fixes the order of work and is worth stating in the plan: Turbopack
  rejects all 36 configs during compilation, so **no prerender runs and no other
  error can appear** until every config is deleted. R-2 (synchronous IO) and
  R-11 (`generateStaticParams`) were therefore **not reached** by this run and
  remain unproven — they can only surface after the 36 deletions land.
- **R-2 — synchronous IO cannot be deferred. Two cases, not three.**
  `instant = false` does not clear a synchronous-IO prerender error. An earlier
  draft listed `app/(client)/[lang]/layout.tsx:169` — that is **wrong**. The
  `new Date()` there sits inside a template string passed to
  `dangerouslySetInnerHTML`, so it is browser JavaScript text and is never
  evaluated on the server. The two real cases are
  `components/Server/product/ProductExpectedDeleiveryWrapper.tsx:29` (`Date.now()`)
  and `components/Server/product/ProductPhotoSliderWrapper.tsx:46` (`new Date()`),
  and **both are on the product page, not the homepage**. Neither was reached by
  the build run described in R-1b, so both are still unproven.
- **R-3 — `staleTimes` overlaps the new profile.** Closed by D-16, but recorded
  so nobody re-opens it: the named profile must set `stale`, `revalidate` and
  `expire` explicitly, or it starts inheriting from `default`.
- **R-4 — middleware cookie writes.** Downgraded by OQ-C from "may kill the
  ticket" to "confirm on a real build".
- **R-5 — `searchParams` keeps content out of the shell.** Closed by D-13.
- **R-6 — the two currency backends might differ.** Closed by OQ-D: they do not.
- **R-7 — moving recommendations to the client removes them from the HTML. No
  impact today.** A crawler will no longer see that block. But
  `NEXT_PUBLIC_ALLOW_INDEXING` is set in neither `.env.development` nor
  `.env.production`, so `next.config.ts` sends `X-Robots-Tag: noindex, nofollow`
  on every path and nothing is indexed at all. Re-check at launch; it cannot be a
  finding now.
- **R-8 — protected runtime paths.** This change touches `next.config.ts` and
  `app/(client)/[lang]/layout.tsx`. `CLAUDE.md` lists `next.config.ts` and
  `proxy.ts` as protected runtime paths. They may only be edited inside an
  approved `implement` stage, and only if the approved `plan.md` names them.
- **R-9 — two URLs one word apart.** `/{lang}/filters/categories/{slug}` already
  exists and is the listing/filters page (`utils/NotificationHandler.ts:302`).
  The new `/{lang}/categories/{slug}` is a different page. This is accepted, but
  it needs a comment at both routes so the next reader is not misled.
- **R-10 — crawlers skip the static shell.** Next detects bots by user agent and
  renders the whole page dynamically for them, so crawlers get no benefit from
  this work. Worse, the same doc warns that shell data which is not reachable at
  request time makes a page load for a person and fail for a crawler. The
  homepage's data all comes from Elasticsearch at request time, so this looks
  safe — `research` must confirm it. (`01-getting-started/08-caching.md:605`)
  Like R-7, it has no impact until indexing is switched on at launch.
- **R-11 — the build now depends on Elasticsearch, and it did not before.**
  This is the largest risk in the ticket. Today `force-dynamic` means the build
  never prerenders the homepage, so it never calls Elasticsearch. After this
  change, all 20 prerendered locales (D-17) run the real homepage render, which
  calls `GetFeaturedProducts`, `GetFlashDealProducts` and `GetHomeBoutiques` —
  all Elasticsearch. `services/elastic/elasticSearch.ts:731-741` and
  `services/elastic/elasticsearch-reader.service.ts:48` both **rethrow** on
  failure, and staging Elasticsearch is known to restart on its own.
  Two separate failure paths, handled two different ways:
  - **During the page render** — closed by D-20's `error.tsx`. The build finishes
    with the error state, and the next revalidation replaces it.
  - **Inside `generateStaticParams`** — **not** closed, and `error.tsx` cannot
    close it, because `generateStaticParams` is a build-time function and not a
    React render. D-19 accepts this: an empty array raises
    `empty-generate-static-params` and the deploy fails on purpose.
    (`migrating-to-cache-components.md:557`,
    `03-api-reference/04-functions/generate-static-params.md` > With Cache Components)
- **R-12 — closed. The error boundary needs no new translation keys.**
  `"Something went wrong"` and `"Try again"` already exist in all three of
  `public/translations/translations.{ar,tr,ku}.js` (checked 2026-08-31).
  `error.tsx` reuses them, so `pnpm lint`'s i18n rule has nothing to fail on.
- **R-13 — a prerendered error page is cached like any other.** If a build
  completes while Elasticsearch is down, the error state is what sits in the
  cache. With `revalidate: 60` it is replaced within about a minute of
  Elasticsearch recovering, but for that minute real visitors see it. Accepted as
  the cost of D-20.

- **R-14 — `runtime = "edge"` is not supported.** `app/ingest/[...path]/route.ts:18`
  sets it; it is one of the 14 `runtime` errors above.
  `migrating-to-cache-components.md:881` says: "**Not supported.** Cache
  Components requires the Node.js runtime." That route is the PostHog reverse
  proxy carrying analytics and session replay, so deleting the export also means
  confirming the handler still works on Node.
- **R-15 — component state stops resetting on navigation.** With Cache
  Components, Next keeps routes mounted with React `<Activity>` in `hidden` mode
  instead of unmounting them, so `useState`, form inputs and scroll position
  survive navigating away and back. There is **no opt-out**; it arrives with the
  flag, app-wide. Closed as record-only by D-22. The rule for judging any
  component is short:

  | Where the state lives | Changed by the flag? |
  |---|---|
  | In a layout (nav, login/OTP, notifications, cart, session widgets) | **No** — layouts already persist today |
  | In the Zustand store | **No** — the store lives outside React |
  | Local `useState` inside a page | **Yes** — this is the only affected case |

  Two examples that looked affected are **not**: the login/OTP widget reaches the
  tree through `layout.tsx:202` -> `NavbarClient` -> `AuthSections` ->
  `FullEnhancedLoginWidget`, and `NotificationWidget` through `Init`, both in the
  layout. The clearest real case is `components/Home/Search/SearchIcon.tsx`,
  mounted only by `app/(client)/[lang]/page.tsx` and holding its open state and
  typed text in local `useState`. Candidates to review later, all page-mounted:
  `AddStoryWidget`, `ReportStoryModal`, `QrScannerModal`, `TryOnModal`,
  `LocationFormModal`, `GalleryPickerModal`, `HiddenOrdersWidget`,
  `BecomeSellerModal`, `CameraWidget`, `ImageCropWidget`, `CallComponentWidget`.
- **R-16 — D-20 is still unproven, and the first attempt failed.** On 2026-08-31 a
  probe route was built with `cacheComponents: true` and
  `next build --debug-build-paths`: a server component that throws, with a
  sibling `error.tsx`. The build passed. So did the control with `error.tsx`
  removed, **and so did a third control that did not throw at all** — and none of
  the three wrote an HTML file or entered `prerender-manifest.json`. That proves
  the method, not the answer: `--debug-build-paths` compiles a route without
  prerendering it, so no version of the probe ever reached the code path being
  tested. **Whether `error.tsx` saves a build prerender remains unknown.** It can
  only be settled by a full build, which cannot run until the 36 config deletions
  in R-1 land — that is `implement` work. The plan must therefore carry a
  fallback for the case where the boundary does not save the build.

## Missing Information

**No decision is pending.** Every fork was answered (D-1 … D-21) and every open
question was resolved (OQ-A … OQ-G). What remains is one mechanical confirmation
that only `research` can make, and it cannot change the shape of the ticket:

- **C-1 — resolved, not pending.** Yes: `next-root-params.md:54` says each root
  parameter must have at least one value or the build fails. Recorded as D-17.
- **C-2** — Confirm R-4 and R-10 against a real `pnpm build` plus `pnpm start`
  run: that a middleware `Set-Cookie` does not stop the cached payload being
  reused, and that a bot user agent still renders the homepage completely.

## Readiness Status

`READY`

- Justification: the request is a change to source code, not a study and not a
  choice between options. Every fork was put to the Workflow Owner and answered.
  Every open question raised at intake is closed, with the evidence recorded.
  The blast radius of the largest decision (D-13, the category route) has been
  measured file by file. Two confirmations remain, and both are things `research`
  is built to do from the repository and a local build.
