---
ticket: unit-tests-search-execution-and-filters
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-09-15
links:
  clickup:
  github:
---

# Intake — unit-tests-search-execution-and-filters


> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-search-execution-and-filters` — phase 24 of
`docs/testing/UNIT_TEST_ROADMAP.md`, Journey 4 (Find). No ClickUp task and no
GitHub issue; the roadmap row is the source of the request.

## Ticket Summary

Write unit tests for the code that runs a search and builds a listing page.
The roadmap names phase 24 as the next open phase on a shopper path, and its
main target — `services/elastic/elasticSearch.ts` — has no test at all today.

## Ticket Metadata

- id / slug: `unit-tests-search-execution-and-filters`
- title: Unit tests — search execution, pagination, and filter application
- owner: developer
- created: 2026-09-15
- links: none

## User Story

> As a shopper, I want the listing and the search results to come back correct
> and in the right order, so that I can find a product and trust the page I am
> looking at.

For the team the same story reads: a change to search must break a test in the
suite that gates every pull request, instead of reaching staging unnoticed.

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: the roadmap row names target files, not acceptance criteria. Writing
  `AC-n` is the `spec` stage's job. The row is specific enough to start:
  "execution, pagination, filter and sort application".

## Test Cases Presence Check

- Present? **no**
- Notes: this work item *is* tests, so the cases are the deliverable, not an
  input. The roadmap gives one standing instruction for this journey, recorded
  here so it is not lost: if a test shows the sort key and the shown price
  disagree, that is a finding and a separate ticket, never a fix inside this one.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the output
  is new test files, not an explanation.
- Is the goal to *choose between options*? **no** — no option is being weighed.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **no** — the unit suite is green: 157 files, 2,541 tests, run 2026-09-15.
  There is no incident, so this is not a `hotfix`.
- Is the change to make already known, leaving only building it? **yes** — write
  tests for named files.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` (fixed by the `/mw:start-ticket` alias) |

## Missing Information

Nothing blocks the start. Two facts the `research` stage has to settle, both
found while qualifying this request and recorded so the scope is not taken from
the roadmap row unchecked:

- **Part of the row is already covered.** The row lists six targets. Five of them
  have tests today: `store/search/reducer.ts`, `store/listing/reducer.ts`,
  `utils/listing/filterItemState.ts`, `normalizeListingProduct.ts` and
  `searchPathRedirect.ts`. Only `services/elastic/elasticSearch.ts` (1,188 lines,
  no test) is untouched. The roadmap allows a phase to be re-cut in `/research`
  when the scope is wrong, and that is expected here.
- **The file is not dead code.** All three of its exports have live callers, so
  the "no tests for dead code" rule does not block it:
  `getProductsAndFiltersFromElastic` (7 callers), `GetRecomendationsForUser` (2),
  `getRelatedProducts` (2).

## Readiness Status

`READY`

- Justification: the request names one file and the behaviour to pin. The suite
  it joins is green, the file has callers, and the roadmap states how a defect
  found on the way is handled. Nothing has to be asked before `research` starts.
