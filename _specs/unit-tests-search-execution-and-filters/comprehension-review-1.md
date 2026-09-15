---
ticket: unit-tests-search-execution-and-filters
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-09-15
result: passed
score: 3/3
threshold: 1.0
decision: CHANGES_REQUESTED
missed:
degraded: "3 of 5 — 2 questions could not clear CG-8 after their rounds were spent; the CG-5 integration question was NOT excluded and was answered correctly; the AC-20 major has no question of its own"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — unit-tests-search-execution-and-filters

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), including
> `plan.md > Integration surface` and the panel findings, which were written into
> `review.md > Panel Findings` before these questions were asked (RP-4).

**How this set was built, and why it is short.**

Five questions were drafted: one integration (CG-5), one per `major` panel
finding (CG-6, two majors), and two more on the files, tests and numbers axes.
The whole set went to the falsifier three times, with no artifacts attached.

| Round | Sent | Survived | Why the rest died |
|-------|------|----------|-------------------|
| 1 | 5 | Q1 | Q2 and Q5 — blind pick **correct**; Q3 and Q4 — `answerable: yes` |
| 2 | 4 regenerated | Q2 | Q3 and Q5 — blind pick **correct**; Q4 — `answerable: yes` (construction tell) |
| 3 | 3 regenerated | none | Q3 and Q4 — blind pick **correct**; Q5 — `answerable: yes` |

Rounds were then spent: two fact changes for the `domain-knowledge` rejections,
two option rewrites for the `construction-tell` ones. Under CG-8 / ADR-028 the
gate was **administered short rather than padded or skipped**, using the final
round's questions whose blind pick the falsifier got **wrong**. Question 3 below
is one the falsifier reported `answerable: yes` and still answered **wrongly** —
it reasoned from convention that the recursive category helper would be the
stand-in, and the real answer is the search-term recorder. That miss is the
at-chance evidence the check exists to obtain, so the row is marked
`Falsified: short`, not `yes`.

**What the shortfall cost.** The `AC-19` major kept its question (row 2). The
`AC-20` major did **not** — every question written for it was answerable blind.
It is still dispositioned in `review.md > Panel Findings`, and it is the first
item in the follow-up brief.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The plan's Integration surface names modules outside the unit that touch the same things. Which one does it name as reading the catalog index and importing the same client config? | `plan.md > Integration surface` | integration (CG-5) | 1 | `components/Listing/FiltersPageContent.tsx`; **`serverRequests/meta/home.ts`** ✅; `serverRequests/meta/listing.tsx`; `services/elastic/sitemap.service.ts` | yes | `serverRequests/meta/home.ts` | **Yes** |
| 2 | The panel says the plan check had already fixed this same false-green fault for two other criteria. Which two? | `review.md > In plain words`; panel:security `major` on `AC-19`; `plan.md > Tests` | major finding (CG-6) | 2 | `AC-13 and AC-14`; `AC-18 and AC-20`; `AC-21 and AC-22`; **`AC-25 and AC-26`** ✅ | yes | `AC-25 and AC-26` | **Yes** |
| 3 | The plan keeps the query-building helpers real and stands in only one of them. Which one? | `plan.md > Steps`, step 10; `research.md` F-20 | stand-ins / approach | 2 | `buildBaseConditions`; `buildSortClause`; `getChildrenAndGrandchildren`; **`logSearchTerm`** ✅ | short | `logSearchTerm` | **Yes** |

- Score: 3/3 — 100% of what was asked (CG-4).
