---
ticket: unit-tests-search-execution-and-filters
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-09-15
links:
  clickup:
  github:
---

# Implement — unit-tests-search-execution-and-filters

## In plain words

- **What was done:** one new test file, `tests/services/elastic/elasticSearch.test.ts`,
  with 28 cases — one per `AC-n`. No application file was touched, so the app
  behaves exactly as it did before.
- **Every `FB-n` from the review is applied.** All thirteen were binding on this
  stage, and each is marked in the file itself or in the table below.
- **One thing the usual rule cannot give here.** The project rule is "see the test
  red, then green". These tests change no source, so they are green from the
  moment they are written and cannot go red on old code. Instead of pretending
  otherwise, two of the riskiest guards were **proved to bite** by perturbing the
  test and watching it fail — see **Guard proofs** below.
- **One deviation**, and it was a mistake in my own assertion, not in the plan:
  the related-search check navigated to the wrong `nested` condition. The base
  conditions already push nested boutique and brand filters, so "the first nested
  entry" was the boutique one.
- **No bug found in the app.** Nothing this file drives disagrees with what the
  plan said the code does, so there is no `BUG-n` to record.

## Changes made

None committed. `IM-9` — this stage creates no commit and never pushes.

## Changes prepared (uncommitted)

| File | Planned? | What changed |
|------|----------|--------------|
| `tests/services/elastic/elasticSearch.test.ts` | yes — the only file under `plan.md > Files to change` | **New.** 28 cases in seven `describe` blocks, grouped by the requirement they map to. About 830 lines including the header notes. |

Branch `ticket/unit-tests-search-execution-and-filters`, cut from `develop`
(`IM-3`). No other file in the working tree was touched by this stage.

**A note on the base.** `develop` moved while this ticket was in review: two cart
commits landed (`1d3d49df`, `d4bc703a`), and the duplicate-test cleanup this
session did earlier landed as `d861a78c`. The branch is cut from that newer
`develop`, so the suite totals in `plan.md > Numbers` were measured against an
older base — see **Validation run** for what they are now.

## Deviations from plan

| # | Deviation | Evidence that forced it |
|---|-----------|-------------------------|
| D-1 | `AC-24` asserts the nested categories condition by matching `path === "categories"` **and** `minimum_should_match === 1`, not by taking the first `nested` entry as first drafted. | `services/elastic/helpers.ts:1333-1334` — `buildBaseConditions` pushes `{nested: {path: "boutique"}}` and `{nested: {path: "brand"}}` ahead of it, so the first `nested` entry is the boutique filter. Caught by the case failing on the first run. |
| D-2 | Both stand-in spies are declared with a parameter (`_payload?: any`) rather than no parameter. | `tsc --noEmit` reported `TS2493: Tuple type '[]' of length '0' has no element at index '0'` on five lines that read `mock.calls[0][0]`. A zero-parameter `vi.fn` types its calls as an empty tuple. |

Neither changes what is tested. Both are corrections to how the test reaches the
thing it was always meant to assert.

## Tests written

> Every row of `plan.md > Tests` was `new`, in the one declared file. All 28 were
> carried out (`IM-11`).
>
> **On "red then green".** The rule assumes a source change: run the test, see it
> fail, make the change, see it pass. This plan changes no source — these cases
> pin behaviour that already works. So there is no old code for them to be red
> against, and reporting a red run would be fiction. What is reported instead is
> the first run of each case and the guard proofs below.

| AC | Case | Disposition | First run | Now |
|----|------|-------------|-----------|-----|
| AC-1 | asks the catalog index | new | pass | pass |
| AC-2 | sends the page size that was asked for | new | pass | pass |
| AC-3 | sends the order the shopper chose | new | pass | pass |
| AC-4 | forwards a page cursor, and sends none on the first page | new | pass | pass |
| AC-5 | hands back the last hit's sort value, and an empty cursor with no hits | new | pass | pass |
| AC-6 | a grid-only request sends no facet work and no bounded total | new | pass | pass |
| AC-7 | a facets-only request asks for zero products | new | pass | pass |
| AC-8 | asking for snapshot paging while the setting is off changes nothing | new | pass | pass |
| AC-9 | a one-word search text does not reach the analyzer | new | pass | pass |
| AC-10 | a multi-word search text reaches the analyzer once, and its answer is used | new | pass | pass |
| AC-11 | analyzer colours merge into the filters with no repeats | new | pass | pass |
| AC-12 | a failing analyzer still returns a result | new | pass | pass |
| AC-13 | a product with no row in the language asked for gives no card | new | pass | pass |
| AC-14 | two rows for one language give exactly one card | new | pass | pass |
| AC-15 | the total is the search server's own | new | pass | pass |
| AC-16 | a term that found products is recorded | new | pass | pass |
| AC-17 | a term that found nothing is not recorded | new | pass | pass |
| AC-18 | the listing search raises, naming the failure | new | pass | pass |
| AC-19 | a refused recommendation read returns an empty list and raises nothing | new | pass | pass |
| AC-20 | a refused related search raises, naming the failure | new | pass | pass |
| AC-21 | an unknown product id gives an empty result and stops | new | pass | pass |
| AC-22 | a product with no gender-and-age pair gives an empty result and stops | new | pass | pass |
| AC-23 | the related search excludes the product being viewed | new | pass | pass |
| AC-24 | the related search asks for each pair once | new | **fail** (D-1) | pass |
| AC-25 | a visitor with no account reads the cold-start list | new | pass | pass |
| AC-26 | an account with no recommendation row falls back | new | pass | pass |
| AC-27 | candidates come back in score order, highest first | new | pass | pass |
| AC-28 | the cursor moves past every candidate looked at | new | pass | pass |

### Guard proofs — the tests are not vacuous

Two guards were perturbed on purpose and the case was watched to fail. The file
was restored from a copy afterwards, and the full file re-run green.

| Guard | Perturbation | Result |
|-------|--------------|--------|
| **FB-1** (`AC-19`) — the reported message must carry the refusal's own words | The routed refusal was removed, leaving the "forgotten route" the guard exists to catch. The router's own throw then produced the identical empty list. | **Red.** `AC-19` failed, so a forgotten route cannot pass as a refusal. This is the finding the review gate returned the plan for, now proved closed by experiment rather than by reading. |
| **FB-1** (`AC-17`) — the total must be present and zero | The facet reply's total was changed from `0` to `5`. | **Red** — *"a search that found nothing was still recorded as a search term: expected "vi.fn()" to not be called at all, but actually been called 1 times"*. The assertion bites; it is not passing because nothing happens. |

### Every `FB-n` from the review, and where it landed

| # | Applied |
|---|---------|
| FB-1 | The facet factory always carries `hits.total.value`; `AC-16` uses `12`, `AC-17` uses `0`. The "not because the code needs it" clause is gone. |
| FB-2 | `markerOf` routes the related search on `track_total_hits === true`, never on the presence of `sort`. |
| FB-3 | Every reply fixture on every path carries `hits.hits`. |
| FB-4 | `images`, `colors` and `sync_color_images` sit on the shared `product()` factory, so they bind all four fixture families. |
| FB-5 | `AC-19` uses `userId: 7` and routes the refusal on the account's own index (`rec-user`). |
| FB-6 | `AC-16` and `AC-17` use the single word `"shirt"`. |
| FB-7 | Recorded in the file header: a missed recorder stand-in surfaces as an unhandled rejection charged to another case. |
| FB-8 | `structuredClone` is used for both query and reply; the header names the retry mutation and the reply write, not "shared arrays". |
| FB-9 | The `facetReply` comment names `processCategoriesAggregation` (`helpers.ts:2585`) as the real throw site. |
| FB-10 | Not applicable in the end — the round count never reached the file, because every recommendation case sets `limit` equal to its candidate count. |
| FB-11 | Candidate ids and each row's `product_id` are digit-only strings; the row's `id` is `9000 + n`, which appears in no candidate list. |
| FB-12 | The header says why the closed loopback port diverges from the model's `.invalid` hosts. |
| FB-13 | The header says omitting `vi.unstubAllEnvs()` diverges from the model on purpose. |

## Findings — confirmed bugs, out of scope

**None.** No case showed the unit behaving differently from what `plan.md`
described, so there is no `BUG-n` and no expected-failure marker in the file.

Two defects were already recorded earlier in this ticket and are unchanged. They
are findings for separate tickets, not fixed here:

- The analyzer failure log names the wrong service (`elasticSearch.ts:3` imports
  the current analyzer, `:281` still says the old vendor's name).
- The related-categories reply reads `GroupAgeEnum[...]` and `GenderEnum[...]`
  with no guard (`:704-705`). The facet fixture keeps the related list empty, so
  no case reaches those lines.

Also recorded, as the review asked: `elasticSearch.ts:886-889` (the in-loop
"restore recommendation order" sort) is a deliberate no-op under FB-11, so it
stays **uncovered** by this ticket. The roadmap must not count it as covered.

## Validation run during implementation

| Check | Command | Result |
|-------|---------|--------|
| The new file | `npx vitest run --project unit tests/services/elastic/elasticSearch.test.ts` | **28 passed** |
| Types | `npx tsc --noEmit --pretty false` | clean for this file after D-2; five `TS2493` errors before it |
| Lint | `npx eslint tests/services/elastic/elasticSearch.test.ts` | clean |
| Whole suite | `pnpm test:run` | **158 files, 2,590 tests passed**, exit code 0 |

**The plan's test count was measured against an older base, and is now wrong.**
`plan.md > Numbers` predicted 2,541 + 28 = 2,569. The real total is **2,590**.
The file count is exactly right (157 + 1 = 158). The gap is 21 tests that landed
on `develop` while this ticket sat in review — the two cart commits `1d3d49df`
and `d4bc703a`. So the base was 2,562, not 2,541, and 2,562 + 28 = 2,590. The
arithmetic in the plan was sound; only its starting number aged. Nothing in the
change caused the difference, and no test was lost.

The `logic-change` profile named in `plan.md > Validation strategy` is what
`/verify` runs in full, per `AC-n`.
