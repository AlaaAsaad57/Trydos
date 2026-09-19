---
ticket: e2e-production-safety-lock
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-19
links:
  clickup:
  github:
---

# Implement — e2e-production-safety-lock

## In plain words

- **The change is built and committed**, on `ticket/e2e-production-safety-lock`,
  in two commits — the filter layer first, then the seed and the browser work,
  so the seed can be reverted on its own.
- **The unit suite is green: 2915 tests, 188 files.** 40 of those rows are new.
  Typecheck is clean, lint has 0 errors, i18n parity passes.
- **The dangerous thing is gone.** Four BUY cases each bought a random real
  seller's product every night. They now buy the product this suite owns.
- **The two admin screens were read**, read-only, with the owner's agreement,
  and the locators now match what is on them.
- **The live run was made, and it found a real gap before writing anything.**
  The core backend refuses Shopper B's one-time code. The seed stopped at its
  first step, created nothing, and now names the missing setting.

## Entry path

**Resumed from `BLK-PLAN-01`.** The block was recorded when this stage first
ran: four instructions in `plan.md` could not be carried out, and a fifth
finding was about the base branch. All five are closed — see
`plan.md > Plan check > Round 8` — and the resume is recorded in `ticket.md`
with the evidence reference.

Branch cut from **`development`**, not `develop`. `origin/develop` does not
exist, the local `develop` is marked `[gone]` and sits 13 commits behind.
`CLAUDE.md:319-333` is corrected and now says so.

## What was changed

**Two commits.**

`b188311d` — **the filter layer.** The mark, the clause, QA mode, the story
filter, the Sentry scrub, and the unit rows that prove each one.

| Path | What |
|---|---|
| `services/elastic/qaFilter.ts` (new) | the `trydos-qa-` prefix and `qaShopMustNot()` |
| `services/elastic/helpers.ts` | `buildBaseConditions` gains `qaView = false`; 8 call sites compile unchanged |
| `services/elastic/elasticsearch-reader.service.ts` | the clause, unconditional, on the boutique path |
| `services/elastic/sitemap.service.ts` | the clause in **both** builders |
| `serverRequests/Search.tsx` | the one caller that passes the boolean, from `qaMode()` |
| `utils/server/qaMode.ts` (new) | reads `x-qa-view`, off unless the secret is ≥32 characters |
| `utils/qaStoryFilter.ts` (new) | no directive, so all four story readers can import it |
| `services/story.ts`, `serverRequests/stories.ts`, `StoriesBarClient.tsx`, `StoriesPaginationWrapper.tsx` | the four live readers |
| `sentry.server.config.ts` | `beforeSend` + `beforeSendTransaction` strip the QA header |

`877d3731` — **the seed and the browser work.**

| Path | What |
|---|---|
| `tests/e2e/laneConfig.ts` (new) | the lane tables, `qaGrepFor`, `parseRunFlags` — no import-time work |
| `tests/e2e/harness/qaSeed.ts` (new) | the setup project |
| `tests/e2e/harness/adminApprove.ts` (new) | the two admin approvals |
| `tests/e2e/harness/qaMessages.ts` (new) | the failure messages, no Playwright import |
| `tests/e2e/harness/qaSeedState.ts` (new) | the seed's record, shared with the spec |
| `tests/e2e/actions/qaProduct.ts` (new) | reach the product by address and by search; attach the header |
| `tests/e2e/qaLock.live.spec.ts` (new) | QA-01..QA-11, 15 cases |
| `tests/harness/qaHarness.test.ts` (new) | `AC-21`..`AC-24`, in the **unit** project |
| `tests/e2e/harness/guard.ts` | one pure export, `isAllowedHost` |
| `tests/e2e/harness/env.ts` | `hasQaMode`, `hasQaSeed`; the Shopper A comment corrected |
| `tests/e2e/harness/redact.ts` | `QA_VIEW_SECRET` masked |
| `tests/e2e/cli.ts` | lane tables moved out; exports `E2E_LANE`; applies `qaGrepFor` |
| `tests/e2e/actions/cart.ts` | `addFirstBuyableProduct` removed, `addQaProductToBag` added |
| `tests/e2e/shopper.live.spec.ts` | BUY-01..04 migrated |
| `playwright.config.ts` | the `setup` project; `globalTimeout` 100 → 85 min |
| three documents | `tests/e2e/README.md`, `docs/testing/E2E_SCENARIOS.md`, `E2E-PRODUCTION-SAFETY.md` |

## Tests written

**40 new rows, all run.** Every `Tests` row of the approved plan was carried out.

| AC | File | Result |
|---|---|---|
| AC-1 | `helpers.test.ts` — 4 rows | green. **Seen red first**: run against the unfiltered builder, 3 of the 4 failed with their own messages |
| AC-2, AC-4 | `elasticSearch.test.ts` — 2 rows | green |
| AC-3 | `elasticsearchReader.test.ts` (new) — 3 rows | green |
| AC-5 | `sitemapService.test.ts` — 2 rows | green, both chains driven |
| AC-6 | `story.test.ts` — 5 rows | green |
| AC-8 | `noRuntimeReadsInCachedTree.test.ts` — 3 rows | green. A regression guard, green before and after, as the plan says |
| AC-20 | `story.test.ts` — 4 source-text rows | green |
| AC-21..AC-24 | `qaHarness.test.ts` — 15 rows | green |
| — | `storiesBarClient.test.tsx`, `storiesWrapper.test.tsx` — 2 rows | green |
| AC-7, AC-9..AC-19 | `qaLock.live.spec.ts` — 15 cases | **registered, not run** — see below |

```
Test Files  188 passed (188)
     Tests  2915 passed (2915)
```

`npx tsc --noEmit` — clean. `pnpm lint` — 0 errors, 76 pre-existing warnings.
`pnpm lint:i18n-parity` — 2243 keys in all three files.

**Playwright validated the configuration**, without running anything against
staging:

```
npx playwright test --list                    -> 108 tests in 17 files
npx playwright test --list --grep=@prod-safe  ->  16 tests in 2 files
```

The second number is the fail-closed path: the seed plus the 15 QA cases, and
nothing else. It also proves the seed's own title carries the tag, which is what
stops a grep killing the run with "No tests found".

## Deviations

Seven, each with its reason. None changes an `AC-n`.

1. **`qaGrepFor` reads `BACKEND_URL`, not `LIVE_ORIGIN`** (plan step 15d said
   `LIVE_ORIGIN`). `LIVE_ORIGIN` is always `127.0.0.1:3100` — the server the
   harness itself starts — so it says nothing about which environment the app is
   pointed at. Using it would have tagged **every** run as unsafe and silently
   cut the suite to 16 cases. The core backend address is what identifies the
   environment.
2. **The sync poll asks the search overlay through the browser**, not a fetch to
   a route. `GetSearchData` is a Server Action; there is no `/search` page and no
   GET route that carries the QA-mode switch. The header is attached with
   `page.route` — which is step 23's own mechanism — and the seed then drives the
   same search a shopper would.
3. **`tests/e2e/harness/qaSeedState.ts` is a new file the plan did not list.**
   Playwright refuses to let one test file import another, and `qaSeed.ts` *is* a
   test file (it is the whole `setup` project). Without this module the live spec
   could not read the seed's record. The alternative was two copies of the same
   paths and type, which this repository already has a standing problem with.
4. **`seedLocale` in `actions/nav.ts` became exported.** `gotoQaProduct` opens
   the product by address rather than through any existing entry point, and the
   **cart** reads the country cookie — a bag filled in the wrong country is
   offered no cash on delivery. Exporting one function beat copying three cookie
   writes.
5. **`attachQaViewHeader` lives in `actions/qaProduct.ts`**, which the plan did
   list, rather than in a new file. Step 23 described the mechanism but named no
   home for it.
6. **BUY-04 no longer walks six products.** The plan said only "BUY-01..04 call
   the new action". The walk existed because a real seller can cap a product at
   one piece; the QA product's stock and limits belong to the seed, so the walk
   had nothing left to search for. `BUY_04_PRODUCTS_TO_TRY` was removed with it.
7. **`docs/OLD-DASHBOARD-SECTIONS.md` does not exist in this repository.** Plan
   step 14 cites it for the Seller Boutiques path. The path is kept as the
   default and made overridable instead.

## Findings

**No `BUG-n`.** No test written here proved existing behaviour wrong. The 2875
tests that existed before this change all still pass, unaltered.

## Left undone — and this is the important section

### 1. The live run — stopped at step one, wrote nothing

Run on 2026-09-19 with the owner's agreement:
`tsx tests/e2e/cli.ts run --lane=account`.

**Result: the seed failed at "sign in as Shopper B". Nothing was created.** No
seller, no shop, no location, no product, no admin approval. The other 12
account-lane cases in that run passed, so the change broke nothing that already
worked.

**What the backend said**, read from the run's own request log:

```
api=/auth/phone/verify_otp_from_guest  m=POST  st=422   backend=core
"message":"invalid_code"
```

**`TEST_ACCOUNT_OTP` is Shopper A's code, and Shopper B does not accept it.**

Nothing had ever noticed, and the reason is worth recording: the only specs that
use Shopper B are **scripted** ones, which fake every backend answer and never
get past the PIN screen. So before this run, **nothing in this suite had ever
really signed in as Shopper B** — the identity the whole seed is built on.

**What was changed in response** (commit follows):

- `TEST_ACCOUNT_OTP_2` — Shopper B's own code, with `shopperBOtp()` falling back
  to the shared one for an environment where they genuinely match.
- `hasShopperBCode()` asks for it **by name**. Falling back silently would turn
  a missing setting into a red run blaming the core backend for refusing a code
  it was right to refuse.
- The seed's six skips now each name **which** setting is missing, instead of one
  "the QA seed is not configured".
- A sign-in that ends on the PIN screen reports **"the core backend refused
  Shopper B's one-time code"** and quotes the endpoint, rather than "the widget
  ended on the enter-pin screen" — which is what the first run said, and it sent
  the reader to look at the login widget instead of at the account.
- The skips are **skips, not failures**, and that is load-bearing: the `live`
  project *depends* on this one, so a failing setup stops every live case in the
  lane. A skipped one does not. The first run showed exactly that — `32 did not
  run`.

**Re-run after the fix:** `16 skipped`, each naming the missing variable, and the
rest of the lane unaffected.

**So `AC-7` and `AC-9`..`AC-19` are written but still unproven.** They cannot be
proven until Shopper B has a code that works. That is the one thing left, and it
is not something this repository can supply.

### 2. The admin dashboard locators — **now read, no longer guessed**

Both screens were opened read-only against staging on 2026-09-19, with the
owner's agreement. The locators were replaced with what is actually there
(commit `c3070291`).

| Screen | What was found |
|---|---|
| `/admin/vendor-requests` | a plain **GET** filter form with `email` and `status`, so the pending list narrows to the one address this run generated. EMAIL is the 4th cell, PHONE the 5th. The control is `select.status-select`, `1` to approve, and it is `disabled` on a row already decided. The page draws **two** tables and the first has no rows |
| `/admin/boutique/seller?status=0` | NAME in the 4th cell, approve `<select>` (`0 New / 1 Approved / 2 Denied`) in the 14th. select2 hides that element, so the option is chosen with `force`; Playwright still dispatches `change`, which is what `updateRequestStatus` listens for |

**One thing the screen cannot give.** The boutique list does not draw the slug,
so that row is matched on the shop's marked **name**. Every write the seed makes
to a backend is still bound by slug, so the name is never the only thing holding
the identity together.

Every locator is still overridable from the environment, because that dashboard
belongs to a different product and can change without this repository hearing
about it. The refusal rule is unchanged: a row whose identity cannot be read is
refused, never approved.

### 3. `QA_VIEW_SECRET` was added locally only

Added to all four `.env*` files, which are gitignored and untracked — nothing was
committed. It must be set as a **repository secret** for CI, and it must
**never** be set in the deployed staging app.

### 4. The query cost is still unmeasured

The plan's own Numbers row says so. The nested `must_not` adds a join to every
listing, home, related, recommended and suggestion query. `/verify` profiles the
suggestion query and one listing query, with a 20 % median rise as the threshold
and two named remedies, each of which costs a `TR-n`.

## What `/verify` has to do

1. Run `pnpm test:run` and record the exit code per `AC-n` for `AC-1`..`AC-6`,
   `AC-8`, `AC-20`..`AC-24`.
2. Run the account lane against staging, **with the owner's agreement**, and
   record `AC-7`, `AC-9`..`AC-19` and the lane's measured duration.
3. Measure the pre-suite share before trusting the 85-minute `globalTimeout`.
4. Profile the two queries against the 20 % threshold.
