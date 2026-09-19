---
ticket: e2e-production-safety-lock
stage: review
attempt: 1
result: passed
score: 4/4
threshold: 1.0
decision: approved
degraded: true
owner: developer
updated: 2026-09-19
---

# Comprehension record — review gate, attempt 1

## Result

**Passed. 4 of 4 correct, against a threshold of 100%.**

## Degraded — why the set was short

`gate.min_questions` is 3 and `max_questions` is 5. Five questions were drafted
and sent to the falsifier closed-book, with no artifacts attached (`CG-8`).

- **Round 1:** two survived (`answerable: no`, blind pick wrong). Three were
  rejected — one for a correct blind pick on `construction-tell`, two for
  `answerable: yes` on `domain-knowledge`.
- **Round 2:** all three replacements were rejected. Two more
  `domain-knowledge` failures spent those questions' rounds; one more
  `construction-tell`.
- **Round 3:** a final free option rewrite of the session-file question was
  rejected again — `answerable: yes`, `construction-tell` — though its blind
  pick was **wrong**.

With the rounds spent and only two clean survivors, `CG-8` directs that the gate
be **administered short rather than skipped**. The two questions whose blind
pick the falsifier got **wrong** in their final round were added, marked
`Falsified: short`, because a miss is at-chance evidence. No question was padded
in to reach the floor.

**The `CG-5` integration question was included, not excluded** — the story-reader
question is sourced from the Integration surface's story row. It carries
`Falsified: short`.

## Questions asked

| # | Axis | Falsified | Answer given | Correct |
|---|------|-----------|--------------|---------|
| 1 | Integration surface — which two of the four live story readers already carry the group filter (`CG-5`) | short | `StoriesBarClient.tsx` + `serverRequests/stories.ts` | yes |
| 2 | `spec.md` ↔ `plan.md` two-hop — the index-proof case and the criterion it protects | yes | `QA-10`, protecting `AC-18` | yes |
| 3 | Panel finding Sec-3 ↔ harness — the mechanism that makes an unnamed session file dangerous | short | `handOnSession` writes to whichever shared path it is handed | yes |
| 4 | Panel findings S-3 / Sec-5 — the two incompatible statements of `AC-23` | yes | Tests row says fails closed; step 10 says fails open | yes |

Four of the four required joining two places — the Integration surface with the
step list, `spec.md` with `plan.md`, a panel finding with the harness, and the
Tests table with the Steps table.

## Why two questions were thrown away

Both were true facts about this plan, and the falsifier reached them without it:
*"by convention an existing filter lives in the fetch layer"*, and *"a cold
first run is generically the slowest"*. A question answerable by being a
competent engineer tests competence, not whether the artifact was read.

## Decision

`approved`, recorded by the owner after the gate. The 13 major panel findings
are dispositioned in `review.md`.
