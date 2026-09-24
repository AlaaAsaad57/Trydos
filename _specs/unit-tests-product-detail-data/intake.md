---
ticket: unit-tests-product-detail-data
stage: intake
mode: standard
status: in_progress
owner: developer
updated: 2026-09-03
links:
  clickup:
  github:
---

# Intake — unit-tests-product-detail-data

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-product-detail-data` — Phase 13 of
`docs/testing/UNIT_TEST_ROADMAP.md`, Journey 3 (Buy). No ClickUp task, no
GitHub issue. The roadmap row is the source.

## Ticket Summary

Write unit tests for the two modules that build the product page's data:
`serverRequests/product.tsx` and `utils/pagesDataRequests/ProductPageData.ts`.
Neither module is executed by any test today, and together they hold 1,342
lines behind every product page, the product modal, two mobile API routes and
three comment API routes.

## Ticket Metadata

- id / slug: `unit-tests-product-detail-data`
- title: Unit tests for the product page data path
- owner: developer
- created: 2026-09-03
- links: none

## User Story

> As a shopper, I want the product page to show the right product, price,
> quantity and comments, so that I do not buy the wrong thing at the wrong
> price.

Read as a test ticket: as the person on call, I want a failure in the product
data path to name the function and the backend that broke, so that I do not
bisect a product page by hand.

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: the roadmap row names the target files, not the behaviour. The `spec`
  stage writes the `AC-n` list. The roadmap's Journey 3 note is the only
  standing steer: this journey is where "a wrong number is worse than a crash
  because nobody notices", so the criteria must assert values, not shapes.

## Test Cases Presence Check

- Present? **no**
- Notes: this ticket's whole output is test cases, so `spec` writes them and
  `plan` maps each one to an `AC-n`. Nothing exists to reuse — see the
  verified-vs-assumed table.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the
  reading is a means; the output is new test files.
- Is the goal to *choose between options*? **no**.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **no** — the unit suite is green (140 files, 2245 passed, 7 skipped, run
  2026-09-03). There is no incident. If a test written here proves existing
  behaviour wrong, that is a `BUG-n` finding under IM-12, not a reason to
  re-type this work item.
- Is the change to make already known, leaving only building it? **yes** — add
  test files for two named modules.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

No disagreement to record.

## Constraints I already know

- **Product direction:** nothing in the product is being removed, frozen or
  replaced. This ticket adds tests only. The product page keeps working exactly
  as it does today.
- **Hard boundaries:**
  - No application code changes. Roadmap rule 4 — if a module resists testing,
    that is a recorded finding, not licence to refactor.
  - No real I/O. Roadmap rule 5 — no network, no Redis, no Elasticsearch, no
    Firebase, no real cookie writes.
  - Test files go in the `tests/` mirror of the source path, never colocated.
  - The unit (`vitest`) suite only. Nothing is added to the browser suite and
    nothing is added to CI — `.github/workflows/tests.yml` already runs
    `pnpm test:run` and picks new files up on its own.
  - Every assertion carries a message naming the step, and the backend when the
    step crosses one (CLAUDE.md, Testing).
- **Must revert as:** one commit on `ticket/unit-tests-product-detail-data`,
  adding files under `tests/` only. Deleting those files restores today's state
  exactly, because no other file is touched.
- **Shared resources this spends:** none. No staging account, no rate limit, no
  run budget — every backend call is replaced by a stand-in. The only cost is
  the unit suite's runtime, which is 203s today and gates every PR.
- **Output safety:** no token, phone number, OTP or `MARKET-TOKEN` value may
  appear in an assertion message, a fixture that is printed, or a failure diff.
  `serverRequests/product.tsx` runs behind the auth cookie, so a naive fixture
  can carry one into output.

## Verified vs assumed

| Claim | verified / assumed | Evidence |
|---|---|---|
| `serverRequests/product.tsx` exists, 716 lines, 9 exported functions | verified | `wc -l`; `grep -nE "^export "` → `GetCountries:122`, `GetGlobalProduct:143`, `GetProductPriceQtyDetails:210`, `GetProductMeta:270`, `GetProductGeneralData:376`, `GetRecommendationCountForProduct:470`, `GetProductStoriesData:547`, `GetSocialInfoForProduct:585`, `GetProductCommentsCount:692` |
| `utils/pagesDataRequests/ProductPageData.ts` exists, 626 lines, 4 exported functions | verified | `wc -l`; `grep -nE "^export "` → `getProductDataFromElastic:17`, `GetRatingCommentsFromElastic:123`, `GetRatingCommentsForProduct:193`, `GetFQACommentsForProduct:310` |
| No test executes either module today | verified | `grep -rn "serverRequests/product\|ProductPageData" tests/` returns three lines, none of them an import of the real module: two are strings inside `tests/cache/noRuntimeReadsInCachedTree.test.ts` about the **different** file `serverRequests/products.ts`, and one is `vi.mock("serverRequests/product", …)` in `tests/components/products/ProductStories.test.tsx`, which replaces it |
| Every export has a real caller — no dead code | verified | `grep -rn` across the repo: 20+ call sites including `app/(client)/[lang]/products/[productId]/page.tsx`, the `@modal` intercepted route, `app/api/mobile/product/details/[slug]`, `app/api/mobile/product/qty/[slug]`, and `app/api/products/comments/{buyers_comments,fqa_comments,order_rating}` |
| The unit suite is green before this ticket starts | verified | `pnpm test:run` on `develop` at f300600e, 2026-09-03: 140 files passed, 2245 passed, 7 skipped, 203.07s |
| `develop` is the base branch and is clean and current | verified | `git checkout develop && git pull` → "Already up to date"; `git status --short` empty |
| The validation profile is `logic-change` | verified | `.claude/project-config.yaml > validation_profiles` defines exactly `ui-change`, `logic-change`, `full`; `logic-change` requires `lint`, `typecheck`, `unit-tests` |
| **This ticket edits no protected runtime path** | verified | CLAUDE.md > Project profile lists the protected runtime paths as `proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`, `.github/workflows/**`. None is a target here, and the only files written are new ones under `tests/` |
| `GetGlobalProduct` has a caller | assumed — check at research | It did not appear on its own line in the caller grep; `app/api/mobile/product/details/[slug]/route.ts` imports two names across a wrapped import. Confirm before writing a test for it — a test for code with no caller is forbidden |
| Both modules can be loaded under the harness without opening a socket | assumed — check at research | Phase 3 recorded that the client module graph reaches `serverRequests/radis` and that **ioredis connects the moment it is loaded**. `tests/setup.ts` cuts that chain, but neither target has been imported by a test before, so this is untried for these two files |
| 1,342 lines across 13 functions fits one honest ticket | assumed — check at research | The roadmap allows a re-cut at research when a phase does not fit (it says so for Phase 4 and again for Phase 21). If research finds two seams — the core-backend functions in `product.tsx` and the Elasticsearch functions in `ProductPageData.ts` — say so there and split, rather than writing a plan nobody can review |

## Neighbouring work

Out of scope, and why:

- **Phase 17 / 18 — `services/order.ts`.** The larger money gap (966 lines, 2
  of 33 methods tested). Deliberately not this ticket; one ticket, one outcome.
- **Phase 19 / 20 — the cart and checkout components.** Component tests, a
  different harness concern.
- **Phase 14 — the flash-deal rule.** Already closed
  (`tests/components/products/ProductCard/flashPrice.test.ts`). This ticket
  must not write a second copy of it. The roadmap records three *other*
  uncovered copies of the end-of-day logic, one of them in
  `Server/product/ProductPhotoSliderWrapper.tsx` — near this ticket's area, and
  still out of it.
- **`serverRequests/products.ts` (plural).** A different file, already named in
  `tests/cache/noRuntimeReadsInCachedTree.test.ts`. Not a target. Do not
  confuse the two — the names differ by one letter.
- **The browser suite.** No product-page e2e work here.
- **A refactor of either module.** Roadmap rule 4.

## Missing Information

- Nothing blocks the next stage. The three `assumed` rows above are exactly
  what `research` is for, and each names how to settle it.
- One discrepancy to settle at research, recorded here so it is not discovered
  late: `docs/testing/UNIT_TEST_ROADMAP.md` marks this phase 🔒 and lists
  "protected globs" that include `serverRequests/**`, but CLAUDE.md > Project
  profile lists a **different, shorter** set of protected runtime paths that
  does not include it. The two documents disagree. It changes nothing for this
  ticket — no source file is edited either way, and the `tests/` mirror is the
  repo convention regardless — but `plan.md` has to state which list it
  followed, so research should say which document governs.

## Readiness Status

`READY`

- Justification: the request is a named roadmap phase with two named target
  modules that exist, are called from real pages and routes, and are executed
  by no test. The base branch is clean and the suite is green, so any red test
  this ticket produces is its own. The boundaries are known and narrow — new
  files under `tests/`, no application code, no real I/O. The three open
  questions are all read-only checks that `research` performs by design, and
  none of them can change whether the work should be done.
