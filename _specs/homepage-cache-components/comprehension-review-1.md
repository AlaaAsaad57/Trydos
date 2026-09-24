---
ticket: homepage-cache-components
stage: review
attempt: 1
result: passed
score: 4/4
threshold: 1.0
min_questions: 3
max_questions: 5
questions_asked: 4
decision: approved
degraded: "yes — on the CG-5 axis only, not on count. Four questions survived
  falsification, which meets the floor of 3. But the integration / cross-flow
  question did NOT survive: three separate attempts were rejected because the
  falsifier answered them correctly blind (two construction-tell rejections on
  the World A / World B framing, one on the app/page.tsx dependency question).
  Both regeneration rounds are spent, so the set was administered without its
  CG-5 axis. This is recorded rather than papered over."
owner: developer
updated: 2026-08-31
---

# Comprehension Record — review gate, attempt 1

## Result

**Passed. 4 of 4 correct**, against a threshold of 100% (`CG-4`).

## How the set was built

Questions were drawn from `spec.md` (narrowed to phase 1 today) and `plan.md`
(fifth version). Four of the five drafts were seeded by `major` panel findings
(`CG-6`); one was the integration question (`CG-5`).

## Falsification (`CG-8`)

Every draft went to the `gate-falsifier` **blind** — questions and options only,
no artifacts, no ticket, and never told which option was correct. Any question it
answered correctly was rejected.

**It beat eight drafts across three rounds.** That is the check working: each one
sounded specific but was answerable from engineering convention alone.

| Round | Drafts | Rejected | Basis reported |
|---|---|---|---|
| 1 | 5 | 5 | 1 construction-tell, 4 domain-knowledge |
| 2 | 5 | 2 | 1 construction-tell, 1 domain-knowledge |
| 3 | 2 | 1 | 1 construction-tell |

Examples of what it defeated, and why they were bad gate questions:

- *"Which file's `try/catch` may swallow the prerender bail-out?"* — it reasoned
  that a server-side cookie reader is the obvious place, without reading anything.
- *"How is the session-replay upload produced?"* — it reasoned that only a
  synthetic upload is reproducible.
- *"Which fix is ruled out?"* — it knew `Vary: Cookie` is the classic rejected
  answer.
- *"Which measurement is dangerous?"* — it reasoned that "no errors found" is the
  classic false negative.

## Questions asked

Correct answers are deliberately **not** recorded here (`CG-7`), so this file
cannot serve as an answer key for a later attempt.

| # | Axis | Question | Falsified |
|---|---|---|---|
| 1 | traceability (spec ↔ plan) | The single `existing` disposition, and the file that proves it | yes |
| 2 | scope boundary | Which named clock read is deliberately **out** of scope while three are in | yes |
| 3 | panel findings (`CG-6`) | Which of the twelve major findings is recorded **disputed**, not closed | yes |
| 4 | plan precision | Which of the plan's several file counts belongs to the codemod | yes |

Three of the four require joining two places in the artifacts rather than reading
one sentence.

## CG-5 — the missing axis

The integration / cross-flow question was attempted three times and rejected
every time, because the falsifier answered it correctly without the artifacts:

1. *"What does the plan call the two possibilities step 0 tells apart?"* —
   construction tell: only one option was shaped like a pair of hypothetical
   states.
2. Same fact, options rewritten — construction tell again, same reason.
3. *"What depends on `app/page.tsx`?"* — construction tell: only a root-page and
   gate pairing was plausible.

Two option rewrites and both regeneration rounds are spent (`CG-8`). The set was
therefore administered without a `CG-5` question. The owner's understanding of
the integration surface is **not** evidenced by this record.

## Decision

`approved` — recorded by the owner at Step 4. See `review.md > Decision`.
