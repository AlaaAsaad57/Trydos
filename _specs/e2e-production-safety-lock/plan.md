---
ticket: e2e-production-safety-lock
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-19
links:
  clickup:
  github:
---

# Plan — e2e-production-safety-lock

## In plain words

- **What this plan decides:** one filter clause goes into four of the six
  catalogue base queries; one call site can switch it off; a setup project
  builds the QA seller, shop, location and product; and the four BUY cases buy
  that product instead of a stranger's.
- **Each file, and why it changes:**
  - `services/elastic/qaFilter.ts` (new) — the `trydos-qa-` constant and the
    catalogue clause
  - `utils/qaStoryFilter.ts` (new) — the story filter. No directive, so a client
    and a server module may both import it
  - `utils/server/qaMode.ts` (new) — reads `x-qa-view`, returns a boolean
  - `tests/e2e/laneConfig.ts` (new) — the lane lists, `parseRunFlags` and the
    tag rule, **with no import-time work**, so a unit test can import them
  - `tests/e2e/harness/qaMessages.ts` (new) — the seed's failure messages, with
    no Playwright import, for the same reason
  - `services/elastic/helpers.ts` — `buildBaseConditions` gains a **defaulted**
    `qaView`; its 8 call sites compile unchanged
  - `serverRequests/Search.tsx:210` — the **only** caller that passes the
    boolean, and it passes what `qaMode` returned, never a literal
  - the reader (`:630`) and both sitemap builders (`:708`, `:772`) — the clause
    is unconditional
  - `sentry.server.config.ts` — the only thing that stops the QA header reaching
    Sentry. A protected path, listed as `CLAUDE.md` requires
  - the **four live** story readers: `services/story.ts`,
    `serverRequests/stories.ts` (`fetchStoriesForUser` only),
    `StoriesBarClient.tsx`, `StoriesPaginationWrapper.tsx`
  - `playwright.config.ts` — a **setup project** for the seed, and
    `globalTimeout` 100 → 85 min
  - `adminApprove.ts` covers **two** admin screens: the vendor request and the
    seller boutique
  - `tests/e2e/harness/guard.ts` — **one pure export**, `isAllowedHost`, pulled
    out of the check it already performs. No behaviour change; it is what
    `AC-22` and `qaGrepFor` both ask
  - `qaSeed.ts`, `adminApprove.ts`, `qaProduct.ts`, `qaLock.live.spec.ts`,
    `qaHarness.test.ts`, `elasticsearchReader.test.ts` (new), plus `cart.ts`,
    `shopper.live.spec.ts`, `env.ts`, `redact.ts`, `cli.ts` and three documents
- **Each `AC-n` → its test:** `AC-1` `helpers.test.ts`; `AC-2`/`AC-4`
  `elasticSearch.test.ts`; `AC-3` `elasticsearchReader.test.ts`; `AC-5`
  `sitemapService.test.ts`; `AC-6` `story.test.ts`; `AC-8`
  `noRuntimeReadsInCachedTree.test.ts`; `AC-16`/`AC-17` the four BUY cases;
  `AC-20` QA-11 plus a `story.test.ts` row; `AC-21`, `AC-22`, `AC-23`, `AC-24`
  `qaHarness.test.ts`; the rest `qaLock.live.spec.ts` as **QA-01..QA-11**.
- **Integration surface:** 15 searched terms, every hit placed.
- **Rollback in one line:** revert the two commits; then deactivate the QA
  boutique by hand, because a location can never be deleted and Shopper B stays
  a seller.
- **Every number with its source:** lane job cap 100 min (`e2e-lane.yml:82`);
  `globalTimeout` 100 → **85 min**; account lane base **≈33 min**
  (`cli.ts:459-461` plus the seventh spec); density **64 s/case**
  (1800 s ÷ 28 counted cases); **15** lock cases cap at **1830 s ≈ 31 min**,
  expected **960 s ≈ 16 min**. The seed has two paths: **≈100 s** on any
  environment that already has the QA shop — which is every CI run — and
  **≈1080 s ≈ 18 min** the one time it builds a new environment, inside a
  1500 s deadline. So **CI runs ≈51 min**; the first run on a new environment
  is **≈67 min** and is the owner's manual run, not a lane job. **37 paths**
  change. The per-request query cost is **not measured**.
- **The majors, and what was done:** seven checks, ~127 majors. Round 6's worst were
  all mine: a unit test importing `cli.ts` would have run the **whole e2e suite
  against staging on every pull request**; the seed's sign-in had no mechanism
  where it was placed; `AC-20`'s teardown imported a client module a test cannot
  load; and I twice miscounted my own case list.
- **Easy to confuse:**
  - `helpers.ts buildBaseConditions` (listing, search, recommended) vs the
    reader's method of the same name (boutiques only).
  - **Step 6 is the Sentry step**, and it is the whole Sentry fix — the six
    handlers that forward headers reach nothing.
  - `AC-18` is the five live hiding paths; `AC-5` is the sitemap, at unit level.
  - `AC-19` is the index proof that stops `AC-18` passing for the wrong reason.
  - `AC-6` is "the filter works"; `AC-20` is "every live reader uses it".
  - Two story readers are **dead** and untouched: `fetchStoriesForGuest`,
    `getStoriesForProducts`.

> **Revised at the `review` stage, by owner instruction**, twice, and once more
> after `/implement` blocked. The stage history does not show those revisions,
> because the governed route — a `CHANGES_REQUESTED` outcome returning the item
> to `/mw:plan` — was skipped each time, by owner instruction. Checks so far:
> 22, 15, 12, 17, 16, 27, 18. **Round 7 was answered by a spike rather than
> another guess** — six runtime questions were settled by running them; see
> `Plan check > Spike`. **Round 8 is `implement.md > BLK-PLAN-01`**: the stage
> tried to execute this plan, found four instructions it could not carry out,
> and stopped without editing anything. See `Plan check > Round 8`.

## Approach

1. **One mark, in the data.** A shop slug starting `trydos-qa-`; a story whose
   `link` host matches the QA host.
2. **One clause, in four of the six base queries.** Two are deliberately left
   alone (step 5).
3. **One switch, at one call site.** `buildBaseConditions` takes
   `qaView = false`; only `GetSearchData` passes it, from `qaMode`.
4. **No response-level filtering.** Both routes already run a base query.
5. **The seed is a Playwright setup project**, not `globalSetup` — that is the
   only place it can sign in, and it stops a seed failure from reporting 28
   unrelated cases as never-run.
6. **The four BUY cases stop walking the catalogue.**

## Steps

| # | Step | Evidence |
|---|------|----------|
| 1 | Add `services/elastic/qaFilter.ts`: the `trydos-qa-` constant and `qaShopMustNot()` — the nested `prefix` clause on `custom_boutiques.slug.keyword`. Pure. | F-6; queryable per `services/elastic/helpers.ts:1389` |
| 2 | Add `utils/server/qaMode.ts`: read `x-qa-view`; **return `false` before any hashing when `QA_VIEW_SECRET` is unset or under 32 characters**, and say so once, loudly, without printing the value — otherwise the first symptom is `AC-19` reporting "the index never caught up", which names the wrong cause. Compare **SHA-256 digests**, because `crypto.timingSafeEqual` throws `RangeError` on unequal lengths. Import by full path only; never add it to a `utils/server` barrel. | searched `timingSafeEqual`: no hit; the barrel trap is a project memory |
| 3 | `services/elastic/helpers.ts` — `buildBaseConditions(filters, country, qaView = false)` pushes the clause when `qaView` is false. **8 call sites**, all compiling unchanged: `helpers.ts:2360`, `Search.tsx:55`, `:210`, `:214`, `elasticSearch.ts:294`, `:298`, `:809`, `:1077`. | F-1 (`:1332`), F-4 |
| 4 | `serverRequests/Search.tsx:210` — inside `GetSearchData` (`:142`), the results query — is the **only** caller passing `qaView`, and it passes the boolean from `qaMode`, **never a literal**. A literal would unfilter search for every customer. `:214` (related) and `:55` (`GetSearchSuggestion` `:34`, per-keystroke) keep the default. This answers `OQ-7`. | `serverRequests/Search.tsx:1` is `"use server"`; called only from `components/Home/Search/SearchIcon.tsx:173`, `:323` |
| 5 | Push the clause **unconditionally** in the reader's `buildBaseConditions` (`elasticsearch-reader.service.ts:630`) and **both** sitemap builders (`sitemap.service.ts:708`, `:772`). **Do not touch** the reader's `getRules` (`:53`) or `serverRequests/meta/home.ts:227`: their consumers keep category fields only (`serverRequests/cached/home.ts:63-75`, `app/api/home/mainCategories/route.ts:34-59`, `serverRequests/meta/home.ts:160-164`). The only effect left is a category tab that exists because of the QA product. | F-1, F-34 |
| 6 | `sentry.server.config.ts` — a `beforeSend` **and** `beforeSendTransaction` that remove `x-qa-view`, case-insensitively. `instrumentation.ts:13` exports `Sentry.captureRequestError` and `sentry.server.config.ts:24` sets `sendDefaultPii: true`, so headers attach to any server error by that route. **This is the whole Sentry fix** — the six handlers that forward `headers: request.headers` reach nothing, because `utils/errorReported.tsx:77-99` copies an allow-list with no `headers` key and `utils/errorSerialization.ts:82` walks `Object.keys()`, which a `Headers` instance has none of. A protected runtime path, permitted because `plan.md` lists it. Comment beside it naming `sentry.edge.config.ts:16` (untouched — no edge route today, `instrumentation.ts:8-10`) and `enableLogs: true` (`:20`, bypasses `beforeSend`), so a future edge route or logger call triggers a re-check. | F-33 |
| 7 | Add `utils/qaStoryFilter.ts` — **no directive**, so both `"use client"` and `"use server"` modules may import it. Drops items whose `link` **host** equals the QA host from a group's nested `stories`, then drops a group left empty. **Parses defensively:** an empty, relative or unparseable `link` is treated as *not QA* and never throws — a throw leaves `StoriesBarClient` on its skeleton (`:75-78`) and sends `serverRequests/stories.ts` into its catch, returning an empty feed and one `LogServerError` per request (`:76-87`). The host is a **code constant**, `qa-test.trydos.tech`, with an optional `NEXT_PUBLIC_QA_STORY_LINK_HOST` override that falls back to the constant when empty or unparseable. The value is **public by design** — it ships in the browser bundle, and it is not a secret. | F-32; `services/story.ts:13-14` shows the `NEXT_PUBLIC_` pattern |
| 8 | Apply the helper at the **four live readers, two different ways**: **replace** the existing group filter at `serverRequests/stories.ts:73` (`fetchStoriesForUser`) and `components/Home/Stories/StoriesBarClient.tsx:69-70`; **insert** it where there is none — `services/story.ts` on `data` before `setStoryData` (`:36`, `:38`), and `StoriesPaginationWrapper.tsx` on `newStories` **before both sinks** (`setAdditionalStories:58`, `setStoryData:59`). Inserting also introduces "drop an empty group" in those two, which is intended. **Do not touch `fetchStoriesForGuest` (`serverRequests/stories.ts:90`) or `getStoriesForProducts` (`services/story.ts:296`) — neither has a caller.** | F-37; verified reader by reader |
| 9 | Add `tests/e2e/laneConfig.ts` — the lane lists, `parseRunFlags`, and `qaGrepFor(target)`. **No import-time work.** `cli.ts` imports from it; **nothing under `tests/` may import `cli.ts`**, which calls `main()` at module scope with `const [command = "run"]` (`:614-615`, `:655`) — a unit test importing it would run preflight, a full `next build` and the whole Playwright suite against staging, inside `pnpm test:run`. | `tests/e2e/cli.ts:614-615`, `:655` |
| 9b | `tests/e2e/harness/guard.ts` — add **one pure export**, `isAllowedHost(host: string): boolean`, and have `assertStagingTarget` call it instead of touching `allowedHostSet` directly. The list and the comparison rule then have a single owner, and a unit file can ask the question without env: **`guard.ts` reads nothing at import time** — `ENV_FILE` is only a `resolve()` (`env.ts:19`) and `loadLiveEnv` is lazy (`:117-118`) — so importing it into the unit project loads no `.env.development`. Behaviour is unchanged; this is an extract, not a new rule. | `guard.ts:80`, `:125`; `env.ts:19`, `:117-118` |
| 10 | **`AC-23`'s mechanism, stated.** `laneConfig.ts` exports **`qaGrepFor(target: string): string \| undefined`** — pure, no env, no import-time work. It parses `target`; if the host is one `isAllowedHost` recognises it returns `undefined` (no grep, the whole suite runs); for **anything else — an unknown host, an unparseable value, or an empty string — it returns `"@prod-safe"`**, so the unknown case is the narrow one. That is the fail-closed direction, and it is what `AC-23` asserts. `cli.ts` applies it to `LIVE_ORIGIN` (step 15), and **the seed's own setup-test title carries `@prod-safe`**, because `--grep` does filter a setup project out (spike, runs 3 and 5) and a seed the grep drops kills the run with "No tests found". **What is still open is named, not hidden:** pointing the suite at production needs that host added to `ALLOWED_HOSTS`, and then `qaGrepFor` calls it known and drops the grep — see Residual risk 7. That is a defect of the **allow-list**, not of this function, and a separate staging-only list is the remedy. `AC-23` proves the function; the risk row carries the rest. | spike, runs 3 and 5; `guard.ts:31-71`, `:125-136`; `env.ts:28` |
| 11 | Add `tests/e2e/harness/qaMessages.ts` — the seed's three failure messages (missing / inactive / out of stock) as a pure function that **throws**, with **no Playwright import**, so `qaHarness.test.ts` can load it. | `AC-21`'s false-green case is "the run skipped instead of failing" |
| 12 | Add `tests/e2e/harness/qaSeed.ts`, run as a **Playwright setup project** (step 16), not in `globalSetup`. `globalSetup` has no browser, page or fixtures (`tests/e2e/globalSetup.ts:23-41`), every sign-in helper takes a `Page` (`actions/auth.ts:306`, `:362`, `:505`), and `liveSession.ts` needs `test.info()` (`:81`) — so a seed there could not sign in at all. Gated on `hasShopperB()`, `hasAdmin()` and `hasMedia()` (`env.ts:172`). **It runs only on an environment that has no QA shop**; on every later run it is the short find-and-verify path. **The order is the owner's, and it has two admin legs, not one:** sign in as Shopper B → read the seller id from `getShopes` (`/shop/auth/permissions`, `services/sellerDashboard/index.ts:11-19`; the `x-seller-id` header is set by `utils/fetchData.ts:634` from the `sellerId` option, `:108`) → become a seller (vendor request) → **approve the seller in the admin dashboard** → add the boutique → add the location → add the product → **approve the boutique in the admin dashboard** → enable the product → enable the boutique → **poll the app's own product search, with QA mode on, until the QA product comes back**. | F-19, F-22; owner |
| 12d | **What the sync poll asks for, and why it is the product and not the boutique.** The owner's order says "keep asking for the boutique till it is active in the ES catalogue using our search query". After step 5 that exact read is impossible on purpose: the reader's `buildBaseConditions` (`elasticsearch-reader.service.ts:630`) pushes the QA clause **unconditionally**, so a `trydos-qa-` boutique never comes back from the boutique list, for anybody, ever. The product search is the path that **can** be switched on (step 4, `x-qa-view`), and asking it is a **stronger** proof of the same thing: `helpers.ts:1333` requires `boutique.status: 1` through a nested join, and `:1439-1457` requires `seller_status: "approved"`. So the QA product appearing in search proves the boutique is indexed **and** active **and** the seller approved — all three at once. The poll runs with the QA header attached, or the clause this ticket adds hides the very row it is waiting for. | `helpers.ts:1333`, `:1439-1457`; `elasticsearch-reader.service.ts:630` |
| 12b | **The seed test must call `test.setTimeout()` itself.** Measured in a throwaway Playwright project this session: a setup test inherits the project `timeout`, so without it the seed dies at the 120 s per-case cap (`playwright.config.ts:60`) while its own budget is far larger. | spike, run 1 |
| 12c | **The seed must no-op when the lane is not `account`.** Measured this session: a positional file filter does **not** exclude a setup project, and `--project live` does not either, because `dependencies` pulls it in — so without a guard the seed runs in **both** concurrent lane jobs. Also measured: an env var set by the parent **is** visible inside the setup project. So the guard is **`process.env.E2E_LANE`**, which step 15 makes `cli.ts` set before it spawns Playwright. The seed reads it and returns immediately unless the value is `account`. **An unset value also means no-op**, so somebody running `playwright test` by hand never seeds by accident. | spike, runs 2, 4, 6 |
| 13 | Seed rules. **(a)** every write is bound to the mark by **slug**, re-read from the backend — a numeric id carries no prefix. **(b)** every **identity** read-back — "is this the row I just created, and does its slug carry the mark" — goes through the **seller-dashboard read, never the search index**, which steps 3–5 make hide `trydos-qa-` shops. That is a different question from the **sync** poll of step 12d, which asks the search index on purpose, with QA mode on, because proving the index caught up is the one thing the dashboard read cannot do. **(c)** the product carries a **`sy` price of 1,000 SYP** and stock, because cash on delivery is Syria-only (`actions/nav.ts:220`) and every BUY case runs there. **(d)** `brand_id`, `origin_country_iso`, `count_of_pieces` and `seller_product_id` come from the **create-form lookups, first valid option** — these are *save* requirements (`components/SellerDashboard/productEdit/helpers.ts:891`, `:895`, `:904`, `:908`, "Required on BOTH create and update"), separate from the documented **activation** checks, which are approval, an `en` translation, stock, boutique and synced colour images (`docs/mobile-seller-dashboard-api-guide.md:99-100`). The image upload satisfies the last of those. **(e)** `call()` is the **only** permitted write path; it records method, URL and slug — **never headers, never bodies**, because `NEXT_PUBLIC_MEDIA_API_KEY` is deliberately unmasked by `redact()` (`redact.ts:36-43`). **(f)** a **1500 s deadline** throwing with the step name — the first-run path is ≈1080 s once the two admin legs and the 5–10 minute sync are counted. **(g)** a refused OTP send is a **named seed failure**, never a hang inside the deadline. | review rounds 5–6 |
| 14 | Add `tests/e2e/harness/adminApprove.ts`, covering **two screens with the same select-and-modal shape**: the vendor request at `/admin/vendor-requests`, and the boutique at the Seller Boutiques list (`/admin/boutique/seller?status=0`, per `OLD-DASHBOARD-SECTIONS.md:131`). Sign in at `/admin/auth/login`, reach the QA row by **filtered URL plus `.first()`**, and **check its identity against a known QA value as a boolean with a fixed message** — never embedding the observed value, or a wrong row prints a real seller's details into a world-readable log. **If no per-row identity value can be read, refuse and fail; never approve an unmatched row.** Append page writes to the call record via `page.on("request")`, method and URL only. **The exact selectors, the option values and the confirm control are resolved at `/implement` against the live screen** — nothing in this repository describes either screen (`OQ-1`). | `redact.ts:20-34`; owner; `OLD-DASHBOARD-SECTIONS.md:131` |
| 14b | **`call()` and the story delete both use the repository's existing proxy pattern**, confirmed this session: `page.evaluate` → `fetch("/api/proxy", { credentials: "include", headers: { "x-proxy-server", "x-proxy-url", "x-proxy-method", "x-country", "x-language" } })`, exactly as `tests/e2e/actions/wishlist.ts:236-248` already does. A Node-side seed cannot import `services/sellerDashboard` or `services/story` — both reach `utils/fetchData`, which pulls in the store and issues a **relative** `/api/proxy` call. The story delete is `x-proxy-url: /api/v1/stories/delete_story` with `{ story_id }` (`services/story.ts:160-162`), **not** a direct call to that path, which has no Next.js route and would 404. | `wishlist.ts:236-248`; round-7 senior major |
| 15 | `tests/e2e/cli.ts` — four changes, each named. **(a)** import the lane lists, `parseRunFlags` and `qaGrepFor` from `laneConfig.ts`. **(b)** add `qaLock.live.spec.ts` to `ACCOUNT_LANE`. **(c)** `parseRunFlags` already reads `--lane=` (`:584`) but drops the value after building `laneArgs`; it now **returns `lane` as well**, and the `run` case (`:641-646`) sets **`process.env.E2E_LANE = lane`** before `runPlaywright`, which passes `env: process.env` straight to the child (`:607`). **This is the export step 12c depends on.** An absent `--lane=` leaves `E2E_LANE` unset, which step 12c treats as "do not seed". **(d)** apply `qaGrepFor(LIVE_ORIGIN)` — when it returns a string, push `--grep=<value>` ahead of the command-line arguments, so a typed `--grep` still wins. `laneSpecs` throws on an unknown lane (`:525-529`), a file in neither or both lanes (`:518-562`), and a listed file missing from disk (`:555-562`). **Position in the list is not load-bearing.** | F-31; `cli.ts:584`, `:602-607`, `:641-646` |
| 16 | `playwright.config.ts` — **(a)** add a `setup` project running `qaSeed.ts`, with the `live` project declaring `dependencies: ["setup"]`; that gives the seed a browser and makes `AC-18`'s ordering a guarantee instead of alphabetical luck. **(b)** lower `globalTimeout` 100 → **85 min** (`:77`): it currently equals the lane job cap (`e2e-lane.yml:82`), so Playwright can never stop first and a slow lane is killed with no report. `playwright.config.ts` is **not** a protected runtime path. | owner decision |
| 17 | Add `tests/e2e/actions/qaProduct.ts`: `gotoQaProduct()` by address, `findQaProductInSearch()` for `AC-7`. | F-5 |
| 18 | Add `tests/e2e/qaLock.live.spec.ts` — **15 cases**, each naming its own `test.setTimeout()`, and `test.use({ video: "retain-on-failure" })` at file level, or they inherit `video: "on"` (`playwright.config.ts:125`). | — |
| 19 | Add `tests/harness/qaHarness.test.ts` — **outside `tests/e2e/`**, so the unit project runs it (`vitest.config.mts:93` excludes only `tests/e2e/**`). Holds the pure halves of `AC-21`, `AC-22`, `AC-23` and `AC-24`. **It imports `laneConfig.ts`, `qaMessages.ts`, `guard.ts` and `redact.ts` — never `cli.ts`, never `qaSeed.ts`.** For `AC-22`/`AC-24` it passes values in as arguments rather than letting `loadLiveEnv()` read `.env.development` into the shared Vitest worker, which would expose the admin password and both test phones to every other unit file (`env.ts:117-136`). | owner decision |
| 20 | `tests/e2e/actions/cart.ts` — add `addQaProductToBag()`, calling the existing `addOpenProductToBag` (`:284`) so it keeps a caller. Remove `addFirstBuyableProduct` (`:389`); `gotoProductAtOrNull` and `leaveProductPage` keep callers elsewhere, so nothing is orphaned. | F-10 |
| 21 | `tests/e2e/shopper.live.spec.ts` — BUY-01..04 call the new action. | F-10 |
| 22 | `tests/e2e/harness/env.ts` — QA readers and `hasQaMode()`; correct the Shopper A comment (`:151`). `tests/e2e/harness/redact.ts` — mask `QA_VIEW_SECRET`. | F-25 |
| 23 | Attach `x-qa-view` with `page.route` on a **narrow pattern**: `GetSearchData` is a **Server Action**, so the request is a **POST to the current page URL carrying `next-action`** — plus document/RSC navigations under `LIVE_ORIGIN`. Never `extraHTTPHeaders`, never `"**/*"`. The handler adds the header and calls **`route.fallback({ headers })`**, never `continue()`, which ends the chain and would disable any other `page.route` in that spec. Registered last so it runs first. **Only the `live` project may attach it** — `scripted` records traces (`playwright.config.ts:137`), which archive every header. | `Search.tsx:1`, `SearchIcon.tsx:173` |
| 24 | Docs: `tests/e2e/README.md`, `docs/testing/E2E_SCENARIOS.md` (**15 new rows**, one per live case), and the root `E2E-PRODUCTION-SAFETY.md`, which has drifted — it still says the story host is a config value and that the header rides `extraHTTPHeaders`. | claim-checker |

## Files to change

**New (11):** `services/elastic/qaFilter.ts` · `utils/qaStoryFilter.ts` ·
`utils/server/qaMode.ts` · `tests/e2e/laneConfig.ts` ·
`tests/e2e/harness/qaMessages.ts` · `tests/e2e/harness/qaSeed.ts` ·
`tests/e2e/harness/adminApprove.ts` · `tests/e2e/actions/qaProduct.ts` ·
`tests/e2e/qaLock.live.spec.ts` · `tests/harness/qaHarness.test.ts` ·
`tests/services/elastic/elasticsearchReader.test.ts`

**Changed — 16 code files + 3 documents = 19 paths:**
`services/elastic/helpers.ts` · `services/elastic/elasticsearch-reader.service.ts` ·
`services/elastic/sitemap.service.ts` · `serverRequests/Search.tsx` ·
`sentry.server.config.ts` · `services/story.ts` · `serverRequests/stories.ts` ·
`components/Home/Stories/StoriesBarClient.tsx` ·
`components/Home/Stories/StoriesPaginationWrapper.tsx` ·
`tests/e2e/actions/cart.ts` · `tests/e2e/shopper.live.spec.ts` ·
`tests/e2e/harness/env.ts` · `tests/e2e/harness/redact.ts` ·
`tests/e2e/harness/guard.ts` (step 9b — one pure export, no behaviour change) ·
`tests/e2e/cli.ts` · `playwright.config.ts` · `tests/e2e/README.md` +
`docs/testing/E2E_SCENARIOS.md` + `E2E-PRODUCTION-SAFETY.md`

**Existing test files extended (7):** `tests/services/elastic/helpers.test.ts` ·
`tests/services/elastic/sitemapService.test.ts` ·
`tests/services/elastic/elasticSearch.test.ts` · `tests/services/story.test.ts` ·
`tests/cache/noRuntimeReadsInCachedTree.test.ts` ·
`tests/components/Home/storiesBarClient.test.tsx` ·
`tests/components/Home/storiesWrapper.test.tsx` — it tests `StoriesWrapper`,
which renders the pager that step 8 changes.

**Total: 37 paths** — 11 + 19 + 7.

**Not changed:** `utils/serverErrorReporter.ts` (the forwarded headers reach
nothing) · `tests/e2e/globalSetup.ts` (the seed is a setup project) ·
`services/elastic/elasticSearch.ts` and `app/api/products/recomended/route.tsx`
(already filtered through builders this plan changes) ·
`serverRequests/meta/home.ts` and the reader's `getRules` (step 5).

**One protected runtime path is changed: `sentry.server.config.ts` (step 6).**

## Integration surface

| Search term | In scope | What this plan does |
|---|---|---|
| `term: { status: 1 }` (6) | 4 of 6 | steps 3, 5; the other two read categories only |
| `buildBaseConditions` (8 call sites) | `helpers.ts`, `Search.tsx:210` | the rest keep the default and stay filtered |
| `getRules` (reader `:53`, `meta/home.ts:227`) | neither | deliberately unfiltered, step 5 |
| `added_by` (12, incl. `meta/home.ts:249`) / `seller_status` (10) | read only | five of six demand approval; the sitemap product query does not |
| `headers: request.headers` (6 handlers) | **none** | **not in scope.** The forwarded `Headers` serialises to `{}` (`utils/errorSerialization.ts:82`); step 6 is the only fix |
| `users_stories` (4 live readers + 2 dead) | the 4 live | step 8. `SellerDashboard/StoriesTab.tsx:42`, `:890` is the seller's own list, not the shopper feed — out of scope |
| `addFirstBuyableProduct` (7) | all | removed; callers updated |
| `hasShopperA` (14) | none | unchanged |
| `hasShopperB` (`env.ts:156` + indirect) | `env.ts`, `qaSeed.ts` | gains a direct caller |
| `hasAdmin` (`env.ts:184`) / `hasMedia` (`:172`) | `qaSeed.ts` | the seed's gates |
| `ALLOWED_HOSTS` (3 + `README.md:104`) | read by `qaGrepFor` | not widened |
| `"use cache"` (6) | none | they call always-filtered builders |
| lane lists (`cli.ts:474`, `:488`, `:577-580`) | moved to `laneConfig.ts` | steps 9, 15 |
| `playwright.config.ts` | steps 16, 23 | governs both lanes and both projects |
| `E2E-PRODUCTION-SAFETY.md` | step 24 | already drifted; brought back in line |

## Numbers

| Figure | Inputs (`path:line`) | Arithmetic |
|---|---|---|
| Lane job cap | `.github/workflows/e2e-lane.yml:82` | 100 min per lane, covering install, build, browser download, the suite, the 7z pack and the upload. **The pre-suite share is unmeasured** — the only in-repo figure, "about two minutes" (`playwright.config.ts:66-71`), sits in a comment that is stale (it still says a 45-min cap and a 38-min timeout) |
| `globalTimeout` | `playwright.config.ts:77`, step 16 | 100 → **85 min**, so Playwright stops and writes a report before GitHub kills the job |
| Account lane base | `tests/e2e/cli.ts:459-461` (run 34956076865) + the seventh spec (`wishlist-signed-in.live.spec.ts:86`, 180 s cap) | **≈33 min** |
| Density | 1800 s ÷ **28** counted cases (`auth.live` 3, `auth.scripted` 6, `profile.live` 8, `profile.scripted` 6, `shopper.live` 4, `session-recovery` 1) | ≈**64 s per case** |
| Lock cases, ceiling (**15**) | QA-01 180 + QA-02 120 + QA-03..06 & QA-08 5×60 + **QA-07 150** + QA-09a..e 5×120 + QA-10 300 + QA-11 180 | 180+120+300+150+600+300+180 = **1830 s ≈ 31 min**. QA-07 gets 150 s because proving `AC-14` needs a second seed pass, priced at 100 s |
| Lock cases, expected | 15 × 64 | **960 s ≈ 16 min** |
| Seed, **first run on a new environment only** | sign-in 60 + vendor request 30 + **admin approve seller 90** + boutique 30 + location 20 + lookups 20 + image 30 + product 90 + **admin approve boutique 90** + 2 status changes 20 + **index sync wait ≤600** | 60+30+90+30+20+20+30+90+90+20+600 = **1080 s ≈ 18 min**, needing a **1500 s deadline**. **The sync is 5–10 minutes** (owner), not the 180 s an earlier draft assumed, and there are **two** admin legs, not one. Both admin figures are estimates |
| Seed, later runs | 60 + 4×10 | **100 s ≈ 2 min** |
| Index sync wait | 10 s poll, 600 s ceiling | 60 requests. **The poll is itself the proof that syncing works** — it asks for the **QA product** through the app's own search query, with QA mode on, until it appears (step 12d). The 600 s ceiling covers the owner's stated 5–10 minute sync |
| Why `QA-10` is capped at 300 s, not 600 | step 12 (seed) vs `AC-19` row | **The two waits are not the same wait.** The seed pays the cold 5–10 minute sync **once**, on a new environment, before any case starts — that is the 600 s ceiling above. By the time `QA-10` runs, the row is already in the index, so its 180 s wait inside a 300 s cap is a **re-proof**, not a first proof. `QA-10` cannot be the thing that waits out a cold sync, because the seed is a `dependencies` prerequisite (step 16a) and fails the run before `QA-10` is reached |
| BUY saving | `cart.ts:393` walks up to 6; 4 cases | up to **20 fewer page loads** |
| Account lane in CI, steady state | 33 + 2 + 16 | **≈51 min** — this is what CI actually runs, because the seed's long path fires only on an environment with no QA shop |
| First run on a new environment | 33 + 18 + 16 | **≈67 min**. **That run is the owner's manual one** (see Rollback), not a CI job, so the 5–10 minute sync is paid once by a person, not twice a day by the lane |
| New work at cap, typical base | 33 + 25 + 31 | **≈89 min — above the 85-min `globalTimeout`.** Only reachable on a first run that also caps every case. CI never hits it; the manual first run is not bounded by the lane job |
| Query cost | not measured | **Unmeasured (EV-10).** The nested `must_not` `prefix` is a **new join on every listing, home, related, recommended and suggestion query** — `custom_boutiques` is joined today only when a boutique filter is set (`helpers.ts:1384-1393` is conditional; `:2128` is an aggregation body, not the per-query join). It also lands on every batch of the full-catalogue sitemap scroll. `/verify` profiles the suggestion query **and one listing query** (`"profile": true`, N warm-up then N measured, compare medians). **Threshold:** a median rise above **20 %** on either. **Remedy for the listing path:** a `must_not` `term` on the one known QA slug — cheaper, but it costs `TR-1`'s "no list of identifiers", so it is a trade needing owner sign-off. **Remedy for the suggestion path:** drop the clause there — but that lets the QA product's **name** complete in the ghost text, which `TR-2` forbids, so it too needs sign-off. Neither is free |
| Artifact footprint | `playwright.config.ts:125` (`video: "on"`) | the 15 lock cases set `retain-on-failure` (step 18); the four changed BUY cases keep `video: "on"` |

**`OQ-9` is answered, and the two paths must not be confused.**

- **Every CI run: ≈51 min**, because the QA shop already exists and the seed is
  the ≈100 s find-and-verify path.
- **The one first run on a new environment: ≈67 min**, of which 5–10 minutes is
  the index sync. That run is the owner's manual one (Rollback), not a lane job.
- **New work at cap on a first run: ≈89 min**, above the 85-min `globalTimeout`
  — unreachable in CI, and the timeout is what stops it if it ever is not.

If `/verify` measures the **CI** lane above **70 min**, apply a remedy — cut
QA-09a..e to route-handler checks (the largest block at 600 s), or split the
spec and add the second file to `SOLO_LANE`. Dropping QA-03..QA-08 is last: they
are the only tests for `AC-10`..`AC-15`. **Measure the pre-suite share at
`/verify` before trusting 85.**

## Tests

Profiles: **`unit`** (`vitest.config.mts:82`) and the **`live`** Playwright
project (`playwright.config.ts:113`).

`vitest.config.mts:93` excludes only `tests/e2e/**`, so `tests/harness/` runs in
the unit project — which is how `AC-21`..`AC-24` gate pull requests.

**There is no strict expected-failure marker in this repository** (searched
`.fails`, no hit). The convention for a known bug is an ordinary `it(` with a
message (`ChecklistView.loadMore.test.tsx:149-150`). No row needs one.

| AC | Existing coverage | Disposition | File :: case | Red on old code because | False-green guard |
|---|---|---|---|---|---|
| AC-1 | `helpers.test.ts:1076` | extend | `helpers.test.ts` :: "hides the QA shop from a normal search" | no clause exists | asserts the exact field and prefix **and** that it is absent when `qaView` is true |
| AC-2 | `elasticSearch.test.ts` | extend | `elasticSearch.test.ts` :: "listing hides the QA shop" | no clause | listing runs through `elasticSearch.ts` → `helpers.buildBaseConditions`, not the reader; the filter returns other shops so an empty result cannot pass |
| AC-3 | none usable — `cached/home.test.ts:9-13` stubs the reader | new | `elasticsearchReader.test.ts` :: "boutique rows hide the QA shop" | no clause | asserts the clause in the query the reader issues; this row owns the **boutique** path |
| AC-4 | `elasticSearch.test.ts:583`, `:763` | extend | `elasticSearch.test.ts` :: "recommended excludes the QA shop" | no clause | two real items survive beside one QA item |
| AC-5 | `sitemapService.test.ts`; both builders unexported (F-34) | extend | `sitemapService.test.ts` :: "the sitemap excludes the QA shop" | no clause | drives `getProductsForSitemap` (`:212` → `:221` → `:701`) **and** `getHomeSitemapLocales` (`:47` → `:50`) — two chains, so fixing one builder is not enough. The mocked client returns one batch then an empty one and `clearScroll` is mocked, so the loop at `:235` cannot spin to the 15 s `testTimeout` |
| AC-6 | `story.test.ts` | extend | `story.test.ts` :: "the web feed drops a QA-linked story" | no link filter | a group with one QA story and two real ones survives with only the QA item removed, so a filter at the wrong nesting level fails. Includes a **malformed-link input** that must be kept, not thrown on. Asserts the value passed to `setStoryData` |
| AC-7 | none | new | `qaLock.live.spec.ts` :: QA-01 | no QA mode | asserts the **result row's** shop slug carries the prefix — a suggestion string would not satisfy it — **and** that the header was observed on the Server Action POST |
| AC-8 | `noRuntimeReadsInCachedTree.test.ts` | extend | same file :: `describe.each(CACHED_MODULES)` | **`n/a` — a regression guard, green before and after.** The scan walks imports from `CACHED_MODULES` (`:130-163`), so an unreferenced module is never reached | asserts the walk's `seen` set never contains `utils/server/qaMode.ts`. The self-check at `:301-312` proves the walk reaches a real read |
| AC-9 | none | new | `qaLock.live.spec.ts` :: QA-02 | no QA product | asserts on an **observed request** that no `x-qa-view` was sent |
| AC-10 | none | new | QA-03 | no seed | reads the request status from the app's own endpoint, not the admin page it drove |
| AC-11 | none | new | QA-04 | no seed | re-reads the boutique **through the seller-dashboard read**, the same path as step 13(b), never the filtered index |
| AC-12 | none | new | QA-05 | no seed | asserts the owning shop id |
| AC-13 | none | new | QA-06 | no seed | asserts stock and status separately |
| AC-14 | none | new | QA-07 (150 s) | no seed | asserts the second seed pass returns the **same** boutique, location and product ids — not a count, which `CLAUDE.md` rule 5 forbids |
| AC-15 | none | new | QA-08 | no seed | asserts the **call record**: no `DELETE`, no write to a slug lacking `trydos-qa-`, and — **only when the record says `approved-by-this-run`** — that the row's phone was checked first. It does not require the approve path to have run, or it would be permanently red after the first environment |
| AC-16 | BUY-01/03/04 | extend | `shopper.live.spec.ts` | they call `addFirstBuyableProduct` | asserts the bag line is the QA product **by id and by name**, because a `sy` title has rendered empty for some data shapes |
| AC-17 | BUY-02 | extend | `shopper.live.spec.ts` | as above | as above |
| AC-18 | none | new | QA-09a..QA-09e — five cases | nothing hides it | each asserts its path **returned content** before asserting the QA product is absent. **QA-09c** must prove its home read is post-seed: `cacheLife("homepage")` has `stale` 60 and `expire` 300 (`next.config.ts:56-61`, `:39`), so a read after 60 s serves the stale entry and revalidates behind it — the case polls for a marker only a post-seed copy carries, inside its 120 s cap |
| AC-19 | none | new | QA-10 | no QA mode, no wait | the wait ends only on finding the QA product itself; 36 polls at 5 s, then a loud failure |
| AC-20 | the four live readers | new **+** extend | QA-11 **and** `story.test.ts` :: "every live reader applies the QA filter" | no filter, and only one reader would have it | QA-11 uploads a QA story as Shopper B, confirms it from the **`add_story` answer** — not a feed, which the filter hides from its own author — asserts the viewer's feed **carried another person's story** before asserting the QA one is absent, then deletes it by calling `POST /api/v1/stories/delete_story` **through the page** (`services/story.ts` is `"use client"` and cannot be imported by a spec), in a teardown registered the moment the id is known, and **fails the case if the delete is refused**. The unit row is a **source-text check** that all four live readers call the shared helper |
| AC-21 | none | new | `qaHarness.test.ts` :: "an unusable QA product is named, not skipped" | the helper does not exist | imports `qaMessages.ts`; asserts it **throws** for each of three inputs with three different messages |
| AC-22 | none | new | `qaHarness.test.ts` :: "the guard refuses an unknown host" | `isAllowedHost` does not exist (step 9b) | imports **`isAllowedHost` from `guard.ts`** and passes the host **in as an argument**, so `loadLiveEnv()` never populates the shared Vitest worker. Asserts **both** directions — a listed staging host is `true`, an unlisted one is `false` — because a function that always answered `false` would pass a one-sided check |
| AC-23 | none | new | `qaHarness.test.ts` :: "the grep follows the target" | `qaGrepFor` does not exist (step 10) | imports `laneConfig.ts`, **never `cli.ts`**. Asserts a known staging origin yields `undefined`, and that an unknown host, an unparseable value **and** an empty string each yield `@prod-safe` — so the fail-closed direction is proved on three inputs, not one |
| AC-24 | none | new | `qaHarness.test.ts` :: "the QA secret is masked" | `redact.ts` has no rule | sets a known secret as an argument and asserts `redact()` masks it |

## Validation strategy

`pnpm test:run` (unit) · `pnpm test:e2e:live` (live, account lane) ·
`pnpm lint`, `pnpm lint:i18n-parity`. `/verify` records the exit code per `AC-n`,
the account lane's measured duration, the pre-suite share, and the two query
profiles.

## Rollback

One revert, **two commits inside the branch** — filter plus unit rows first, seed
and browser work second — so the seed can be reverted alone.

**What a revert does not undo:** the QA shop on an environment. A location can
never be deleted (F-20), so the QA boutique must be deactivated by hand.
**Shopper B also stays a permanent seller**, and `auth.scripted.spec.ts` and
`profile.scripted.spec.ts` use that identity.

**Ordering:** the filter commit merges to `development`, is promoted to `main` (the
staging branch) and deploys **before** anyone runs the seed. The first seed run
is a deliberate manual `pnpm test:e2e:live` by the ticket owner against the
deployed staging app — not a CI run.

## Plan check

Seven checks plus one execution attempt. Majors by round: **22, 15, 12, 17, 16,
27, 18**, then **5 blockers** found by `/implement` trying to run it. Rounds 1–3
ran inside the plan stage; rounds 4–7 ran at the `review` stage by owner
instruction; round 8 is the implement block. This draft closes rounds 6, 7 and 8.

### Round 6 — 27 findings, all closed in this rewrite

| Finding | What changed |
|---|---|
| **A unit test importing `cli.ts` would run the whole e2e suite against staging on every pull request** — `main()` at module scope, command defaulting to `"run"` | Step 9: a new side-effect-free `laneConfig.ts`; nothing under `tests/` imports `cli.ts` |
| **The seed's sign-in had no mechanism** — `globalSetup` has no browser, and every helper needs a `Page` | Step 12: the seed becomes a **setup project** |
| **A seed failure would report 28 unrelated cases as never-run** | Same fix; a setup-project failure names itself |
| **`AC-20`'s teardown imported a `"use client"` module** a spec cannot load | Deletes through the page instead |
| **`qaSeed.ts` imports Playwright**, so `AC-21` could not import its helper | Step 11: `qaMessages.ts`, no Playwright import |
| **"The resolved target host" was undefined** and needed a second list — the two-switch problem again | Step 10: derived from the guard's own allow-list answer; **anything not provably staging is production** |
| **`AC-20`'s delete contradicted the spec constraint** "may only create" | `spec.md` now carves out a test deleting what it created in the same run |
| **`QA-14` existed only in the budget** — no `AC-n`, no test row | Removed. **15 cases, 1830 s** |
| **`QA-07` was priced at 60 s** but needs a 100 s second seed pass | 150 s, and the ceiling re-summed |
| **My query-cost correction was wrong in the other direction** — the join is conditional today (`helpers.ts:1384-1393`), so the clause adds a join to every query | Rewritten, with a threshold and remedy **for both** paths, and the `TR-1`/`TR-2` cost of each stated |
| **Step 9(d)'s activation claim was unsupported** — the cited doc names approval, `en` translation, stock, boutique, colour images; the four fields are *save* validation | Step 13(d) separates save requirements from activation checks |
| **The integration surface still named deleted step 6** — third round unfixed | Row now reads "not in scope", with the reason |
| **`X-Seller-ID` had no source** | From `getShopes` → `/shop/auth/permissions` |
| **`AC-11` might re-read through the filtered index** | Names the seller-dashboard path |
| **`QA-11` had no "feed had content" guard** | Added |
| **`storiesWrapper.test.tsx` was missing** though the pager it covers is changed | Added to extended files |
| **The unit file would pull `.env.development` into the shared Vitest worker** | Step 19: values passed as arguments |
| **The call record could publish the media key or admin password** | Step 13(e), step 14: method and URL only |
| **Counts disagreed in three places again** (32 vs 34 paths, 66 vs 82 majors, 18 vs 19 vs 16 cases) | Rebuilt from the lists: **36 paths, 15 cases** (round 8 adds `guard.ts`, making it **37**) |
| **Citation slips** — `cli.ts:445`→`:443`, `stories.ts:71-75`→`:76-87`, `story.ts:24`→`:19`, `env.ts:157`→`:156`, the `wishlist` cap read as `cli.ts:86` | All corrected |
| **Step 14b omitted `AC-23`**; step 20 said 19 doc rows for 16 cases; the header note was a round behind | All corrected |
| **A seller could take the `trydos-qa-` prefix** and vanish from the catalogue | Recorded in Residual risks; blocking it stays out of scope with the reason |
| **`playwright.config.ts` was listed both in and out of scope** | Now only in scope |
| **A refused OTP send had no defined outcome** | Step 13(g): a named seed failure |
| **The QA story host had no literal value** | `qa-test.trydos.tech`, stated as public by design |
| **The uploaded story media is never deleted** | Recorded in Out of scope beside `PROF-05` |
| **research.md F-37 still claimed all four readers share a filter** | Corrected there too |

**Kept on purpose:** the admin-screen facts stay `UNVERIFIED` from the
repository's point of view (`OQ-1`); they come from the owner and a read-only
probe of the live staging admin.

### Round 8 — the four things `/implement` could not do

This round is different from the seven before it. It was not a reading of the
plan; it was an attempt to **execute** it. The stage stopped at its first rule
and changed nothing — no branch, no file, no commit (`implement.md`,
`BLK-PLAN-01`). Each finding is a place where this document told the next stage
to do something it had not declared.

| Blocker | What the plan said | What changed here |
|---|---|---|
| **B-1** — step 12c named "the lane name `cli.ts` exports (step 15)", and step 15 declared no such export. Searched the plan for `E2E_LANE`, "lane name" and "export the lane": the only hits were step 12c itself and the spike row | a guard with no mechanism | Step 15(c) declares it: `parseRunFlags` returns `lane`, and the `run` case sets `process.env.E2E_LANE` before `runPlaywright`, which already passes `env: process.env` (`cli.ts:607`). Step 12c now names the variable and says an unset value means "do not seed" |
| **B-2** — `AC-22`'s test needed a pure export from `guard.ts`, and the plan listed `guard.ts` twice under *Not changed* and once under *Out of scope*. `IM-11` required the row; `IM-4` forbade the file | two rules that could not both hold | New step 9b puts `guard.ts` in *Files to change* for one extracted pure function, `isAllowedHost`. *Out of scope* now says the narrower true thing — **widening** the list is what stays out |
| **B-3** — `AC-23`'s test row said the grep "fails closed"; step 10 said the design fails **open** and deferred the mechanism to `/implement`. `IM-4` forbids inventing a declared test's mechanism | the same criterion stated two opposite ways | Step 10 states the mechanism: `qaGrepFor` is pure and fails closed on three input classes. The open-failure was never about this function — it is about **widening `ALLOWED_HOSTS`**, which is now Residual risk 7. `AC-23` proves the function; the risk row carries the rest |
| **B-4** — the seed's last leg had three incompatible descriptions (poll the index / the index is made to hide it / read back through the dashboard), and two budgets that disagreed (600 s vs `QA-10`'s 300 s) | no single reading of what to build | New step 12d: the poll asks for the **product** through search with QA mode on, which after step 5 is the only reachable path **and** a stronger proof — `helpers.ts:1333` and `:1439-1457` mean a product in search implies an active, indexed boutique and an approved seller. Step 13(b) now separates the **identity** read-back from the **sync** poll. A new Numbers row says why 600 s and 300 s are two different waits |
| **B-5** — `CLAUDE.md:321` names `develop` as the base branch; `development` is **13 commits ahead** and `origin/develop` does not exist | a governance question, not a plan defect | Settled outside the plan — see `implement.md`. `origin/develop` is gone, local `develop` is `[gone]` and 0 ahead / 13 behind. The base branch is **`development`**; `CLAUDE.md` was stale and is corrected |

**No new claim was invented to close these.** Every mechanism above is either an
existing line of this repository (`cli.ts:607`, `guard.ts:80`, `helpers.ts:1333`)
or a measurement already in the spike table.

### Spike — six runtime questions settled by running them

Round 7's majors were nearly all about behaviour that cannot be read out of a
file. Rather than guess a seventh time, a throwaway Playwright project was run
this session and then deleted. Nothing was written to the repository or to
staging.

| Question | Measured answer | What it fixed |
|---|---|---|
| Does a positional file filter exclude a setup project? | **No.** The filtered-out spec was skipped; the setup still ran | The seed fires in **both** lane jobs — the duplication is real |
| Does `--grep` exclude it? | **Yes** — "No tests found" until the setup's own title carried the tag | Step 10's grep would have silently killed the seed |
| Can `--project live` opt out of the dependency? | **No.** `dependencies` pulls setup in | Project selection is not a gate |
| Does a parent env var reach the setup project? | **Yes** — `E2E_LANE=solo` was visible inside it | **This is the lane gate** (step 12c) |
| Does a setup test inherit the project `timeout`? | **Yes** — it reported the project's value | The seed needs its own `test.setTimeout()` (step 12b) |
| How does a test write through `/api/proxy`? | `page.evaluate` → `fetch("/api/proxy", { headers: "x-proxy-*" })`, the pattern already at `wishlist.ts:236-248` | `call()` and the story delete (step 14b) |

**Two questions were deliberately not run**, because both write to staging and
one could approve a real seller: what `changeProductStatus(.., 1)` refuses, and
what the admin `<select>` posts. The owner's direction is that **exploration
happens at `/implement`, where code is the only source of truth** — so those,
`OQ-1` and `OQ-3` are resolved there against the running system, and steps 10
and 14 say so rather than specifying a mechanism nobody has seen.

## Residual risks — kept on purpose

1. **The story lock is web-only in this repository.** The mobile app applies the
   same host rule — the owner will coordinate it. Until it ships, mobile
   shoppers can see QA stories.
2. **Two of the six base queries are left unfiltered** (step 5). Both read
   categories only; the visible effect is a category tab.
3. **End-to-end proof does not gate pull requests.** The browser suite never
   does. `AC-1`..`AC-6` and `AC-21`..`AC-24` do.
4. **One work item, 37 paths, 24 criteria, 15 live cases.** Three lenses
   recommended splitting at the first check; the owner chose to keep it whole,
   three times. Six checks have found **109 majors**, and each round's fixes
   have introduced new ones. Recorded so the gate weighs the size knowingly.
5. **A real seller who names a shop so its slug starts `trydos-qa-` vanishes
   from the catalogue**, silently. Blocking the prefix at create time is out of
   scope because no `AC-n` covers it.
6. **`OQ-1`, `OQ-2` and `OQ-3` are still open** — the admin screen, whether a
   seller may buy from their own shop, and what else a boutique needs to
   activate. None changes a criterion; each surfaces as a named seed failure.
7. **`qaGrepFor` is only as good as `ALLOWED_HOSTS`.** The function fails closed
   on a host it does not know (step 10). But the only way to point the suite at
   production is to **add that host to the allow-list**, and from that moment
   `isAllowedHost` calls it known and the grep is dropped. So the protection
   holds against a typo and against a forgotten address; it does not hold
   against somebody deliberately adding production and then running the suite.
   The remedy is a **second, staging-only list** that `qaGrepFor` reads instead
   of the guard's list — deliberately out of scope, because no `AC-n` covers it
   and no production environment exists yet. Recorded here so the day a
   production host is added, this row is what says to split the list first.

## Out of scope

- **A production host list.** No production environment exists, and the guard
  compares hostname only. `qaGrepFor` reads the existing `ALLOWED_HOSTS` through
  `isAllowedHost` rather than adding a second list. Step 9b extracts that
  function; **widening or splitting the list is what stays out of scope**, and
  Residual risk 7 says what it costs.
- Blocking the `trydos-qa-` prefix in the boutique-create form — no `AC-n`.
- **Coverage knowingly given up:** no case adds a *real* catalogue product to a
  bag, and the sold-out walk (`cart.ts:396-407`) stops running.
- Excluding a QA order from fulfilment, finance or payouts.
- The media orphan `PROF-05` leaves; the guests `session.live.spec.ts`
  registers; **and the QA story's uploaded image, which `delete_story` does not
  remove** — one new orphan per run.
- **`utils/serverErrorReporter.ts:67-84` sends `marketToken`, `chatToken`,
  `storiesToken`, `walletToken` and `userIdHash` to the backend error log**
  (`:87` → `utils/server/mobileErrorLog.ts:18`) on every server error. Not to
  Sentry — `utils/errorReported.tsx:77-99` has no token key. This ticket no
  longer touches that file; the backend-log leak needs its own ticket.
- **Sentry still receives session cookies** on every server error
  (`sendDefaultPii: true`). Step 6 removes one header from an event that still
  carries them; `AC-24` must not be read as "the Sentry payload is clean".

## Traceability

| AC | Requirement | Steps |
|---|---|---|
| AC-1..AC-5 | TR-2 | 1, 3, 4, 5 |
| AC-6 | TR-2 (web feed) | 7, 8 |
| AC-7 | TR-3 | 2, 4, 23 |
| AC-8 | TR-3 | 2 |
| AC-9 | TR-6 | 17, 18 |
| AC-10..AC-13 | TR-4 | 12, 13, 14, 16 |
| AC-14, AC-15 | TR-5 | 13, 14 |
| AC-16, AC-17 | TR-6 | 17, 20, 21 |
| AC-18, AC-19 | TR-7 | 16, 18 |
| AC-20 | TR-2 / TR-7 | 7, 8, 18 |
| AC-21 | TR-8 | 11, 19 |
| AC-22 | TR-9 | 9b, 19 |
| AC-23 | TR-9 | 9, 9b, 10, 15, 19 |
| AC-24 | TR-3 | 6, 19, 22, 23 |
| — | TR-10 | 12, 22 |
