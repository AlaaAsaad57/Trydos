---
ticket: unit-tests-search-execution-and-filters
stage: review
attempt: 2
status: complete
owner: developer
updated: 2026-09-15
result: passed
score: 3/3
threshold: 1.0
decision: APPROVED
missed:
degraded: "3 of 4 — the count met gate.min_questions and the CG-5 integration question was asked, but the CG-6 question for the AC-17 major could not clear falsification after its rounds were spent, so that major was approved without being examined"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — unit-tests-search-execution-and-filters

## Review gate

> Attempt 2. Attempt 1 is retired as `comprehension-review-1.md` (`result:
> passed`, `decision: CHANGES_REQUESTED`). New questions this round (CG-7) —
> replaying attempt 1's would test memory, not comprehension.
>
> Questions derived from `plan.md` + `spec.md` (CG-2), including
> `plan.md > Integration surface` and the panel findings, which were written into
> `review.md > Panel Findings` before these questions were asked (RP-4).

**How this set was built.**

Four questions were drafted: one integration (CG-5), one for the single `major`
(CG-6), and two more on the criteria and request-shape axes. Three falsification
rounds ran, with no artifacts attached.

| Round | Sent | Survived | Why the rest died |
|-------|------|----------|-------------------|
| 1 | 4 | Q4 | Q1, Q2, Q3 — blind pick **correct**, all three `construction-tell` |
| 2 | 3 rewritten options | Q1 | Q2 and Q3 — blind pick **correct** again, still `construction-tell` |
| 3 | 2 replacement facts | Q3 | Q2 — blind pick **correct** |

The tells were worth recording, because they are the ones ADR-028 warns about:
in round 1 one option literally echoed the stem ("search-term recorder" →
`Search.tsx`), one was the longest and most qualified, and one **leaked across
the set** — the falsifier eliminated two options using a fact another question in
the same set had revealed.

**Why `degraded:` is not empty on a passing three-question gate.** The count met
`gate.min_questions`, and the mandatory integration question was asked and
answered. What is missing is CG-6's extra question for the `AC-17` major. Its
rounds were spent — two option rewrites and one fact change — and every version
was answerable blind. So the owner approved that finding **without being examined
on it**. An empty `degraded:` here would hide exactly that.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The Integration surface says how many other modules import the same search client. How many? | `plan.md > Integration surface` | integration (CG-5) | 1 | `Five`; `Six`; **`Seven`** ✅; `Eight` | yes | `Seven` | **Yes** |
| 2 | Which criterion pins the off behaviour of the snapshot setting? | `spec.md > Acceptance Criteria Mapping`, `AC-8`; `plan.md > Steps`, step 3 | criteria ↔ settings | 2 | `AC-6`; `AC-7`; **`AC-8`** ✅; `AC-15` | yes | `AC-8` | **Yes** |
| 3 | The plan says four criteria need the facet request rather than the grid-only one. Which four? | `plan.md > Steps`, step 15; `spec.md` `AC-7`, `AC-15`, `AC-16`, `AC-17` | request shape | 2 | `AC-6, AC-7, AC-15, AC-16`; **`AC-7, AC-15, AC-16, AC-17`** ✅; `AC-13, AC-14, AC-16, AC-17`; `AC-15, AC-16, AC-17, AC-18` | yes | `AC-7, AC-15, AC-16, AC-17` | **Yes** |

- Score: 3/3 — 100% of what was asked (CG-4).

**Practice (LP-5, not scored, not part of the score above).** Two were asked
before the gate. The first was answered wrongly — the owner named `AC-25` and
`AC-26` where attempt 1 had actually bounced on `AC-19` and `AC-20` — and was
corrected against `review.md > In plain words` and the `ticket.md` history line
before the gate began. The second was correct.
