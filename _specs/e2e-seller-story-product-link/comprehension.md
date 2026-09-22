---
ticket: e2e-seller-story-product-link
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-09-22
result: passed
score: 2/2
threshold: 1.0
decision: PASSED
missed:
degraded: "2 of 3 administered — 2 questions could not clear CG-8 after both regeneration rounds were spent; the CG-5 integration question WAS administered and is question 1; of the 2 administered, 1 cleared CG-8 outright and 1 was admitted on the falsifier's miss"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — e2e-seller-story-product-link

## Verify gate

Questions derived from `implement.md`, `spec.md` and `plan.md > Integration
surface` (`CG-2`). No reviewer panel runs at this stage, so `CG-6` does not
apply.

### How this set was built, and why it is short

Four questions were drafted and falsified blind in two rounds.

| Round | Outcome |
|---|---|
| 1 | All four rejected — but **three of the four blind picks were wrong**, so the facts were sound and the options were leaking. Q1 and Q2 were `construction-tell` (options rewritten, no round spent); Q3 and Q4 were `domain-knowledge` — "put the destructive case last" and "watchers match the proxy URL" are textbook, so those questions tested nothing. Both facts were replaced, spending round 1. |
| 2 | **Q1 survived** — blind pick wrong, `answerable: no`, basis `guess`. **Q2's pick was also wrong** but it could still justify the shape. Q3 and Q4 were answered **correctly** and are excluded. |

Rounds exhausted. Under `CG-8` the gate is then administered short rather than
skipped or padded: the questions asked are the final round's whose blind pick
the falsifier got **wrong**.

**The `CG-5` integration question was administered** — it is question 1, on the
shared saved session named in `plan.md > Integration surface`. That is a
difference from the `review` gate, which had to run without one.

**Two-hop share (`X7`): 2 of 2 — 100%.** Both questions join two distinct
locations.

### Record

| # | Question (from the artifact) | Sources (two when Hops is 2) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|---|---|---|---|---|---|---|---|
| 1 | The plan named the shared saved seller session as the single most likely way this ticket could break an existing test. When does the finished file write that session back? | `plan.md > Integration surface` (the risk); `implement.md > What was changed` and `verify.md > Did the plan's Integration surface hold?` (how it is discharged) | **integration (CG-5)** | 2 | From the clean-up sweep, after the last case has closed its context / **In `afterAll`, before the clean-up sweep runs** / Once, at the end of the last case that opens the dashboard / Once per case, after every case that opened it | yes | In `afterAll`, before the clean-up sweep runs | Yes |
| 2 | `AC-4` was declared as already covered by an existing case, then changed to a new one. What does that existing case read, which makes it unable to fail? | `spec.md > AC-4`; `implement.md > Deviations`, `D-4` | correctness of a test disposition | 2 | Bar tiles, which never carry the author's group id / **Page anchors, which never carry a story link** / The rendered viewer, which a signed-out visitor never opens / The unfiltered feed, which never has the filter applied to it | short | Page anchors, which never carry a story link | Yes |

- Score: 2/2 (1.0) — meets `threshold`.

### Questions drafted but not administered

Recorded without their option lists, since the facts may be reused on another
axis.

| Draft | Axis | Why excluded |
|---|---|---|
| Q3 | the `AC-11` measurement boundary | Round 2 pick was **correct**: the option naming both the narrowed scope and the excluded step read as the most qualified, so it was pickable by shape. |
| Q4 | what was done about the session finding | Round 2 pick was **correct**: "suspected" in the stem signalled an unconfirmed fault, and only one option reported a non-reproduction. |
