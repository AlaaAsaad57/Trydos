---
ticket: e2e-seller-story-product-link
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-09-22
result: passed
score: 2/2
threshold: 1.0
decision: APPROVED
missed:
degraded: "2 of 3 administered — 3 questions could not clear CG-8 after both regeneration rounds were spent; the CG-5 integration question was among the excluded; of the 2 administered, 1 cleared CG-8 outright and 1 was admitted on the falsifier's miss"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — e2e-seller-story-product-link

## Review gate

Questions derived from `plan.md` (revision 4), `spec.md` and the panel findings
already written to `review.md > Panel Findings` before any question was asked
(`RP-4`).

### How this set was built, and why it is short

Five questions were drafted: one integration question (`CG-5`) and four seeded
from the largest-blast-radius majors (`CG-6`), seven majors being more than the
five-question ceiling allows. Three falsification rounds followed.

| Round | Outcome |
|---|---|
| 1 | All five rejected. Q2, Q4, Q5 `construction-tell` (options rewritten, no round spent); Q1, Q3 `domain-knowledge` (facts changed, round 1 spent). Sibling leak reported: Q2's options gave away Q3. |
| 2 | Q4 survived — blind pick wrong, `answerable: no`. Q1 fell to `domain-knowledge` (Playwright's alphabetical spec ordering is textbook). Q2, Q3, Q5 `construction-tell`; facts sound, options rewritten. Round 2 spent on Q1's fact. |
| 3 | Q4 survived again. **Q1 fell to `injected-context`** — the host had this project's auto-memory in the falsifier's window, so the fact was reachable without the artifact. Q2 and Q5 answered correctly from convention. Q3's blind pick was **wrong** but it reported `answerable: yes`. |

Rounds exhausted. Under `CG-8` the gate is then administered short rather than
skipped or padded: the questions asked are the final round's whose blind pick
the falsifier got **wrong** — Q3 and Q4. A miss is the at-chance evidence this
check exists to obtain.

**The `CG-5` integration question was excluded.** Degraded mode is the one place
that is permitted, and it is recorded here rather than passed over. Its fact fell
to `injected-context`, which is an authoring miss on my part: a fact reachable
from a file the host injects is not a gate.

**Two-hop share (`X7`): 2 of 2 — 100%.** Both administered questions join two
distinct locations, so the share is met and yields nothing to degraded mode.

### Record

| # | Question (from the artifact) | Sources (two when Hops is 2) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|---|---|---|---|---|---|---|---|
| 1 | `PF-2` says an existing guest check can never fail, because it collects elements that never carry a story link. Which element would it have to read instead, to prove the ring is actually hidden from a guest? | `review.md > Panel Findings > PF-2`; `plan.md > Tests`, `AC-4` row | correctness of an `existing` disposition | 2 | `[data-pw="StoriesIcon"]` in the product story section / `[data-pw="Story"]` cards on the product page / **`[data-pw="story-element"]` tiles in the home stories bar** / `[data-pw="story-product-link"]` in the opened story viewer | short | `[data-pw="story-element"]` tiles in the home stories bar | Yes |
| 2 | `spec.md` sets the journey's budget at four minutes. `PF-5` and `PF-7` both say `AC-11` cannot be judged yet. Which pair of corrections do those two findings require? | `spec.md > Addendum 2` (`NFR-3`, `AC-11`); `review.md > Panel Findings > PF-5`, `PF-7` | measurability of an acceptance criterion | 2 | **The bar-walk branch must be priced, and the seed must be excluded from the figure** / The ceilings must be summed, and the lane total must be recorded from CI / The close and video costs must be added, and the poll window must be counted / The context count must be fixed, and the hand-back cost must be added | yes | The bar-walk branch must be priced, and the seed must be excluded from the figure | Yes |

- Score: 2/2 (1.0) — meets `threshold`.

### Questions drafted but not administered

Recorded so a re-run does not rebuild the same failures, and without their
option lists, since three of them may be reused on a different axis.

| Draft | Axis | Why excluded |
|---|---|---|
| Q1 | integration / cross-flow (`CG-5`) | Fact 3 fell to `injected-context` — the project's auto-memory was in the falsifier's window. Facts 1 and 2 fell to `domain-knowledge`. |
| Q2 | the `PF-1` failure chain | Answered correctly from convention in round 3: "a guest fallback means no user id" needs no artifact. |
| Q5 | scope boundary under `IM-4` | Answered correctly from option shape in every round: only one option described a file deliberately left unchanged. |
