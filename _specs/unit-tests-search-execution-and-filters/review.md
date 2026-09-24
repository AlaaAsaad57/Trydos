---
ticket: unit-tests-search-execution-and-filters
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-09-15
links:
  clickup:
  github:
---

# Review — unit-tests-search-execution-and-filters

## In plain words

> **Attempt 2.** Attempt 1 returned `CHANGES_REQUESTED` on two majors; its gate
> record is retired as `comprehension-review-1.md`. This section and Panel
> Findings were written **before** this round's gate ran (RP-4).

- **What the panel says:** the two majors from attempt 1 are **closed**, checked
  against the source by both lenses that raised them. The plan's instructions are
  sound. **One new `major`**, and it is the same false-green class in a third
  place.
- **The new major, in one sentence:** **`AC-17` can pass for the wrong reason.**
  The recorder only runs when the total is present **and** above zero
  (`services/elastic/elasticSearch.ts:680-683`). The plan tells the facet fixture
  to carry a total "because `AC-15` asserts it, **not because the code needs
  it**". If a fixture then omits the total, `AC-17` — "a term with no results is
  not recorded" — goes green because the total was *missing*, not because it was
  zero. What the owner can do: make the facet factory always carry
  `hits.total.value`, above zero for `AC-16` and exactly `0` for `AC-17`, and
  delete that clause.
- **Where it came from:** the clause was introduced by round 3's claim-check
  correction, which was itself right — `hits.total.value` really is
  optional-chained at `:381`. The correction fixed a wrong reason and created a
  wrong instruction. Worth naming, because it is the second time a narrow fix in
  this ticket has opened a hole somewhere else.
- **One minor worth a major's attention.** Step 7 routes the related-products
  search on "the presence of `sort`". The owner checked it: the main listing query
  and the related query carry the **same** `index`, `_source`, `track_scores`,
  `size` and `sort` (`:303-310` vs `:1105-1117`). The only clean separator is
  `track_total_hits` — `true` for related, `false` or `10000` for the listing. As
  written, the router would misroute the related cases.
- **What the panel did not find:** no integration concern, no scope concern, no
  protected runtime path, no way to reach a real service, no stall or budget risk.
  Two of three lenses found nothing major.

## Review Scope

The whole revised `plan.md` and `spec.md`, with `research.md` and
`plan.md > Plan check` (including the revision round and the two rows marked
SUPERSEDED). Read-only, attempt 2.

## Plan Summary

One new test file, `tests/services/elastic/elasticSearch.test.ts`, 28 cases, one
per `AC-n`, for `services/elastic/elasticSearch.ts`. No application file changes.
Rollback is deleting the file. Validation profile `logic-change`.

## Risks

- **The false-green class keeps reappearing.** It has now been found in five
  places across this ticket: `AC-25` and `AC-26` (plan check), `AC-19` and `AC-20`
  (review 1), `AC-17` (review 2). The unit hides failures in three different ways,
  so every criterion that drives an error path needs its own guard.
- **Two narrow fixes have each opened a new hole.** Round 3's correction created
  the `AC-17` clause; the revision's marker wording created the routing overlap.
- **Two flag-guarded paths stay uncovered**, as the spec records.

## Assumptions

Unchanged from attempt 1: today's behaviour is correct unless a test shows
otherwise; the four sibling test files are the convention; the suite is green at
157 files and 2,541 tests before this work starts.

## Open Questions

None. One risk is re-opened for an explicit answer — see the senior `minor` about
ticket size below.

## Panel Findings (advisory)

> Read-only lenses over the revised `plan.md` + `spec.md` (ADR-010 / RP-1),
> attempt 2. Written before this round's gate (RP-4). Advisory only (RP-2).
> Every `major` was checked against the source before being written here.

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| security | **major** | `AC-17` can pass for the wrong reason. The recorder gate is `total_size !== undefined && total_size > 0`, so a fixture with no total makes `AC-17` green by "no total sent" rather than "no results". Step 16's clause "not because the code needs it" invites exactly that. | `plan.md` step 16 vs `elasticSearch.ts:680-683`; `spec.md:208` | **Mitigate — FB-1.** Inside the approved scope: the fixture factory lives in the one file this plan already changes, so the fix is how that file builds its reply, not what the plan permits. |
| performance | minor | The related-search marker overlaps the main-listing marker: both queries carry `catalog_index`, `_source`, `track_scores`, `size` and `sort`. **Owner verified.** Only `track_total_hits` separates them. | `plan.md` step 7 vs `elasticSearch.ts:303-310`, `:1105-1117` | **Mitigate — FB-2.** Route on `track_total_hits`. Owner-verified; treat it as blocking for the related cases even though the lens filed it minor. |
| performance | minor | The grid-only and related reply shapes are never pinned — about 12 cases read `response.hits.hits` unguarded (`:380`, `:1033`). | `plan.md` steps 14 and 19 | **Mitigate — FB-3.** Every reply on every path carries `hits.hits`. |
| performance | minor | The `images` rule sits in step 16, so it binds only the facet fixture, though the normalizer reads `images` for every card. | `plan.md` step 16; `helpers.ts:332` | **Mitigate — FB-4.** The `images` rule binds all fixtures. |
| security | minor | `AC-19` does not say which recommendation index carries the refusal, and the two are chosen by `userId`. A refusal routed on the wrong one never fires. | `plan.md` `AC-19` row; `elasticSearch.ts:756`, `:761` | **Mitigate — FB-5.** Name the `userId` value and the index. |
| security | minor | `AC-16` / `AC-17` do not pin the word count of the search term. A multi-word term reaches the analyzer and can replace the term before the recorder sees it. | `plan.md` step 15; `elasticSearch.ts:240`, `:252` | **Mitigate — FB-6.** Single-word term for the two search-log cases. |
| security | minor | If the recorder stand-in ever misses, the real one rethrows out of an un-awaited call — an unhandled rejection charged to whichever case is running. | `plan.md` step 10; `helpers.ts:2945`, `:2958-2960` | **Accept — FB-7.** Record the failure shape so it is not chased as a flake. |
| senior | minor | Step 6's reason for cloning the query is false: the condition arrays are fresh per call and both pushes run before the search. The instruction is right; the reason is not. | `plan.md` step 6 vs `helpers.ts:1331-1336` | **Accept — FB-8.** Keep the clone, drop the false reason. |
| senior | minor | Step 16 names the wrong throw site: omitting the bucket path short-circuits harmlessly; the real failure lands in `processCategoriesAggregation`. | `plan.md` step 16 vs `helpers.ts:2585` | **Accept — FB-9.** Re-anchor the evidence. |
| senior | minor | Step 18's reason for one round is wrong: a short batch reply cannot fire a second round, because the cursor advances by the slice, not by what came back. | `plan.md` step 18 vs `elasticSearch.ts:851`, `:898` | **Accept — FB-10.** Restate the reason. |
| senior | minor | `AC-27` never says candidate ids and `product_id` must be digit-only strings; a non-numeric id is filtered out and the sort silently becomes a no-op. | `plan.md` step 18; `elasticSearch.ts:868`, `:904` | **Mitigate — FB-11.** Digit-only ids. |
| senior | minor | The research risk "one ticket for all three exports may be too big" was answered on cost and never re-tested against the final 28-case shape. | `research.md:201-205`; `spec.md:176` | **Dismiss.** The 28 cases share one file and one set of stand-ins; the differing fixtures are per-flow either way. Splitting now would cost a second roadmap row and gain nothing. Answered out loud, as the lens asked. |
| performance | info | FA-4 makes the in-loop sort a deliberate no-op, so `elasticSearch.ts:886-889` stays uncovered by this ticket. | `plan.md` `AC-27` row | **Accept, out of scope.** Record that `:886-889` stays uncovered so the roadmap does not count it. |
| senior | info | FA-6 diverges from the house pattern (the model file uses reserved `.invalid` hosts). Either is fine; say why. | `plan.md` step 3 vs `product.test.ts:36-37` | **Accept — FB-12.** Say why it diverges. |
| senior | info | The model file calls `vi.unstubAllEnvs()` in `afterEach`, which FA-9 forbids here. FA-9 is right; say it diverges on purpose. | `plan.md` step 12 vs `product.test.ts:164-171` | **Accept — FB-13.** Say it diverges on purpose. |
| security | info | The vendor name still reaches the published artifact as the **received** value on a real failure. It is the app's own log text, already recorded as a defect. | `plan.md` step 20; `research.md` F-29 | **Accept.** Already a recorded defect; nothing to do here. |
| security | info | Environment-stub leak across files verified harmless; no credential can reach output from the runner's own environment. | `plan.md` step 3 | **Accept** — no action. |
| senior + security | info | Both attempt-1 majors confirmed **closed** against the source, not the wording. | `elasticSearch.ts:927-930`, `:1182-1186` | **Accept** — the reason this attempt could be approved. |
| performance | info | All 28 cases are runnable in this harness; the added wall time is a conservative upper bound. | `plan.md > Numbers` | **Accept** — no action. |

## Decision

**APPROVED.**

The two majors this plan was returned for are closed, and both were checked
against the source rather than the wording. The approach, the file list, the
integration surface and the rollback have not moved since attempt 1, and two of
three lenses found nothing major this round.

The new `AC-17` major is accepted as a **mitigation inside the approved scope**,
not as a reason to return the plan a second time. The reasoning: the fixture
factory it concerns lives in the one file this plan already changes, so the fix is
how that file builds a reply — not a change to what the plan permits. `IM-4` is
satisfied because no unlisted file is touched. The same holds for the routing
marker and the other mitigations, `FB-1` to `FB-13` below.

**This is a judgement with a cost, and it should be named.** The false-green class
has now been found five times in this ticket, and twice a narrow fix opened a new
hole. Approving means the remaining fixes are applied at `implement` without
another panel reading them. The mitigations below are therefore binding on
`/implement`, and `/verify` checks each one by its `FB-n` id.

## Approvals

| Role | Who | Decision | Date |
|------|-----|----------|------|
| Owner (self-review, ADR-009) | developer | APPROVED | 2026-09-15 |

Comprehension gate: **passed, 3/3**, recorded in `comprehension.md` (attempt 2).
The count met the floor and the integration question was asked — but `degraded:`
is not empty: the `AC-17` major's own question could not clear falsification after
its rounds were spent, so **that finding was approved without the owner being
examined on it**. That is recorded rather than hidden, and it is the single
weakest point in this gate.

## ADR reference

- ADR-009 (single owner, self-review), ADR-010 (advisory panel), ADR-012 /
  ADR-022 (question count), ADR-025 / ADR-028 (question quality and
  falsification), ADR-029 (the decision is the owner's).

## Required Follow-up Actions

> **Binding on `/implement`.** Every line changes the one approved file. None adds
> a file, an `AC-n`, or an application change. `/verify` checks each by its id.

| # | Action |
|---|--------|
| **FB-1** | The facet factory always carries `hits.total.value` — above zero for `AC-16`, exactly `0` with empty `hits.hits` for `AC-17`. The recorder gate is `total_size !== undefined && total_size > 0` (`elasticSearch.ts:680-683`), so a missing total is a silent pass. Delete step 16's clause "not because the code needs it". |
| **FB-2** | Route the related-products search on `track_total_hits` (`true`) against the main listing (`false` or `10000`), not on the presence of `sort`. Both queries carry the same `index`, `_source`, `track_scores`, `size` and `sort`. |
| **FB-3** | Every reply on every path carries `hits.hits` (empty allowed), not only the facet and recommendation fixtures. |
| **FB-4** | The `images` / `colors` / `sync_color_images` rule binds all four fixture families, not only the facet one. |
| **FB-5** | `AC-19` names the `userId` value and the recommendation index the refusal is routed on. |
| **FB-6** | `AC-16` and `AC-17` use a single-word search term, so the analyzer branch cannot replace it before the recorder sees it. |
| **FB-7** | Record in the file that a missed recorder stand-in surfaces as an unhandled rejection charged to another case — so it is not chased as a flake. |
| **FB-8** | Keep `structuredClone`; drop the false "shared condition arrays" reason. The real need is the retry mutation and the reply write. |
| **FB-9** | Re-anchor step 16's throw site to `processCategoriesAggregation` (`helpers.ts:2585`). |
| **FB-10** | Restate step 18's reason: a second round needs `limit` below the candidate count, not a short batch reply. |
| **FB-11** | Candidate ids and each row's `product_id` are digit-only strings (`elasticSearch.ts:868`, `:904`). |
| **FB-12** | Say why the closed-loopback address diverges from the model file's `.invalid` hosts. |
| **FB-13** | Say that omitting `vi.unstubAllEnvs()` diverges from the model file on purpose. |

**Recorded, not actioned:** `elasticSearch.ts:886-889` (the in-loop sort) stays
uncovered by this ticket, because `FB-11` makes it a deliberate no-op. The
roadmap must not count it as covered.
