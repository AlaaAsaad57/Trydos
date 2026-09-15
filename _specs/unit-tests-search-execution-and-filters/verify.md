---
ticket: unit-tests-search-execution-and-filters
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-09-15
links:
  clickup:
  github:
---

# Verify — unit-tests-search-execution-and-filters

## In plain words

- **The result:** every one of the 28 acceptance criteria is proved by a test
  that really ran. The `logic-change` profile passed all three of its checks with
  exit code 0.
- **What was built:** one new test file and nothing else. No application file
  changed, so the app behaves exactly as it did before this ticket.
- **The one thing that did not hold:** the plan said **seven** other modules
  import the search client. The real number is **eight**. The missed one is
  `services/elastic/sellerComments.ts`.
- **Why everybody missed it:** that file contains NUL bytes, so `grep` and
  `ripgrep` treat it as binary and skip it silently. Every search in this ticket
  missed it — mine, the claim checker's, and all three review panels'. An
  encoding-blind scan found it. It is the **only** file in the whole source tree
  with this problem.
- **What it costs:** nothing for the tests. `sellerComments.ts` is a different
  module that this test file never touches, and a stand-in is scoped to the file
  that declares it. No `AC-n` is affected. What it costs is trust in a number,
  and one gate question that had a wrong answer key — both recorded below.
- **Two guards were proved, not assumed.** The test was perturbed on purpose and
  watched to fail, twice. That matters more here than usual, because this ticket
  adds no source change and so cannot show the usual red-then-green.

## Acceptance criteria — all 28, at depth `all-ac` (VF-4)

**One command proved all 28**, because all 28 live in one file and the profile
runs the whole suite:

```
pnpm test:run     →  exit 0     158 files, 2,590 tests
```

and, for the file alone:

```
npx vitest run --project unit tests/services/elastic/elasticSearch.test.ts
                  →  exit 0     28 passed
```

| AC | Proved by | Exit | Guard held? (EV-5) |
|----|-----------|------|--------------------|
| AC-1 | `elasticSearch.test.ts::AC-1 asks the catalog index` | 0 | yes — compares against the imported `catalog_index`, not a literal |
| AC-2 | `::AC-2 sends the page size that was asked for` | 0 | yes — asks for 7, not the default 10 |
| AC-3 | `::AC-3 sends the order the shopper chose` | 0 | yes — asserts the price rule **and** that the relevance fallback is absent |
| AC-4 | `::AC-4 forwards a page cursor, and sends none on the first page` | 0 | yes — both halves in one case |
| AC-5 | `::AC-5 hands back the last hit's sort value, and an empty cursor with no hits` | 0 | yes — three hits with different sort values; the answer table is re-pointed for the no-hit half |
| AC-6 | `::AC-6 a grid-only request sends no facet work and no bounded total` | 0 | yes — reads the request, from a shape that would otherwise carry facets |
| AC-7 | `::AC-7 a facets-only request asks for zero products` | 0 | yes — reads the request's size, and asserts the facets are still present |
| AC-8 | `::AC-8 asking for snapshot paging while the setting is off changes nothing` | 0 | yes — the case asks for it, and the opener is asserted never called |
| AC-9 | `::AC-9 a one-word search text does not reach the analyzer` | 0 | yes — the same spy is shown reachable by `AC-10` |
| AC-10 | `::AC-10 a multi-word search text reaches the analyzer once, and its answer is used` | 0 | yes — asserts the analyzed name reached the filters |
| AC-11 | `::AC-11 analyzer colours merge into the filters with no repeats` | 0 | yes — starts from filters already holding the colour; runs single value and list |
| AC-12 | `::AC-12 a failing analyzer still returns a result` | 0 | yes — asserts the spy was called, and that the **search** failure was not reported |
| AC-13 | `::AC-13 a product with no row in the language asked for gives no card` | 0 | yes — the product has rows, in another language |
| AC-14 | `::AC-14 two rows for one language give exactly one card` | 0 | yes — names the surviving card, not a count |
| AC-15 | `::AC-15 the total is the search server's own` | 0 | yes — total 87 against 1 hit, on the facet request |
| AC-16 | `::AC-16 a term that found products is recorded` | 0 | yes — watches the recorder call; single-word term |
| AC-17 | `::AC-17 a term that found nothing is not recorded` | 0 | yes — total present **and** zero; proved by perturbation below |
| AC-18 | `::AC-18 the listing search raises, naming the failure` | 0 | yes — asserts the refusal's own words |
| AC-19 | `::AC-19 a refused recommendation read returns an empty list and raises nothing` | 0 | yes — routed refusal, reporter scenario **and** message; proved by perturbation below |
| AC-20 | `::AC-20 a refused related search raises, naming the failure` | 0 | yes — lookup answers, second search refuses, both calls asserted |
| AC-21 | `::AC-21 an unknown product id gives an empty result and stops` | 0 | yes — asserts the related-search marker was never asked for |
| AC-22 | `::AC-22 a product with no gender-and-age pair gives an empty result and stops` | 0 | yes — the product has categories, without the pair |
| AC-23 | `::AC-23 the related search excludes the product being viewed` | 0 | yes — reads the request's exclusion list |
| AC-24 | `::AC-24 the related search asks for each pair once` | 0 | yes — the product carries the same pair twice |
| AC-25 | `::AC-25 a visitor with no account reads the cold-start list` | 0 | yes — names the index, **and** the anti-swallow checks |
| AC-26 | `::AC-26 an account with no recommendation row falls back` | 0 | yes — order read from the spy's own call list |
| AC-27 | `::AC-27 candidates come back in score order, highest first` | 0 | yes — arrival order differs from score order; row `id` in no candidate list |
| AC-28 | `::AC-28 the cursor moves past every candidate looked at` | 0 | yes — one candidate dropped, so the two numbers differ |

**No `AC-n` was sampled or inferred. Every row is one real case with a real exit
code.**

### Guard proofs — the tests were shown to bite

This ticket changes no source, so "see it red, then green" cannot apply: the cases
pin behaviour that already works. Rather than report a red run that never
happened, two guards were perturbed and watched to fail.

| Guard | Perturbation | Result |
|-------|--------------|--------|
| `AC-19` / FB-1 | The routed refusal removed, leaving the "forgotten route" the guard exists to catch | **Red.** The finding that returned the plan at review is closed by experiment |
| `AC-17` / FB-1 | The facet reply's total changed from `0` to `5` | **Red** — "a search that found nothing was still recorded as a search term… actually been called 1 times" |

File restored from a copy afterwards; re-run green.

## Validation profile

Profile `logic-change`, from `.claude/project-config.yaml`.

| Check | Resolved command | Exit | Summary |
|-------|------------------|------|---------|
| lint | `pnpm lint` | **0** | 76 warnings, 0 errors, none from the new file |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | **0** | no output |
| unit-tests | `pnpm test:run` | **0** | 158 files, 2,590 tests |

## Integration surface — did it hold?

**No. It was wrong by one, and the error was invisible to every search this
ticket ran.**

Re-running the search terms from `research.md > Shared things` with an
encoding-blind scan (Python, reading bytes, not `grep`):

| Term | Plan said | Really | Difference |
|------|-----------|--------|------------|
| `elasticSearchClient` | seven other modules | **eight** | `services/elastic/sellerComments.ts` was missed |
| `logSearchTerm` | one caller outside the unit (`serverRequests/Search.tsx:21,415`) | same | held |
| `catalog_index` | seven uses inside the unit | same | held |

**Why it was missed.** `services/elastic/sellerComments.ts` contains NUL bytes.
`grep` reports `Binary file … matches` and ripgrep skips it by default, so it
never appears in a normal search. The encoding-blind scan shows it is the **only**
file of its kind in `services/`, `utils/`, `serverRequests/`, `app/`,
`components/`, `store/`, `hooks/` and `scaling/`.

**What it does not cost.** No `AC-n` is affected. The module is not under test,
this file never imports it, and `vi.mock` is scoped to the file that declares it.
The suite is green.

**What it does cost, and this is recorded rather than smoothed over:**

1. `plan.md > Integration surface` and its Out-of-scope line both say "seven". The
   number is wrong. The plan is an approved artifact and is not edited here
   (`VF-7`).
2. **The review gate asked a question whose answer key was wrong.** Attempt 2,
   question 1, asked how many other modules import the client and recorded
   "Seven" as correct. The owner answered "Seven" and it was marked right. The
   true answer is eight. That record is retired as `comprehension-review-2.md`
   and a retired attempt is never edited, so the correction lives here.

## Findings

> Carried forward from `implement.md` and added to by this run. None lies inside
> `plan.md > Files to change`, so `passed` is permitted (`VF-12`).

| # | Finding | Where | Status |
|---|---------|-------|--------|
| F-A | `services/elastic/sellerComments.ts` contains NUL bytes, so every `grep`/ripgrep search in this repository silently skips it. It imports `elasticSearchClient`, which is how it escaped the integration surface. **Worth its own ticket:** any future search-based audit of this repo has the same blind spot. | `services/elastic/sellerComments.ts` | new, this run |
| F-B | The analyzer failure log names the wrong service — the import at `elasticSearch.ts:3` is the current analyzer, the message at `:281` still carries the old vendor's name. | `services/elastic/elasticSearch.ts:281` | carried forward |
| F-C | The related-categories reply reads `GroupAgeEnum[...]` and `GenderEnum[...]` with no guard. No case reaches those lines, because the facet fixture keeps the related list empty. | `services/elastic/elasticSearch.ts:704-705` | carried forward |
| F-D | `elasticSearch.ts:886-889` (the in-loop "restore recommendation order" sort) is a deliberate no-op under FB-11 and stays **uncovered**. The roadmap must not count it as covered. | `services/elastic/elasticSearch.ts:886-889` | carried forward |

**No `BUG-n`.** Nothing showed the unit behaving differently from what the plan
described, so there is no expected-failure marker in the file.

## Numbers — plan against reality

| Number | Plan said | Really | Verdict |
|--------|-----------|--------|---------|
| Test files after | 158 | **158** | exact |
| Tests after | 2,569 | **2,590** | short by 21 |
| Cases added | 28 | **28** | exact |
| Application files changed | 0 | **0** | exact |

The test-count gap is not a defect in the change. The plan measured its base at
2,541; by the time the branch was cut, `develop` held 2,562 because two cart
commits landed during review. 2,562 + 28 = 2,590. The arithmetic was sound; the
starting number aged while the ticket sat at a gate.

## Gate

Comprehension gate **passed, 3/3** — `comprehension.md`, `stage: verify`,
`attempt: 1`. `degraded:` is not empty: four questions were drafted and one could
not clear falsification, so three were asked. The CG-5 integration question
survived clean and was answered correctly. There is no panel at this stage, so no
finding went unexamined because of the shortfall.

## Outcome

**PASSED.** All 28 acceptance criteria proved by tests that ran, the profile green
on all three checks, the guards shown to bite, and every finding outside the one
file this ticket changed.
