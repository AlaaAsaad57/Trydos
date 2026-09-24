---
ticket: otp-entry-three-attempt-lock
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-08-30
result: passed
score: 3/3
threshold: 1.0
decision: PASSED
missed:
degraded: "3 of 3 asked, but 1 row administered under CG-8 rather than cleared — 4 falsifier rounds were spent and only 2 questions cleared cleanly; the CG-5 integration question was NOT excluded"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — otp-entry-three-attempt-lock

> Gate record for the `verify` stage. The `review` round is preserved as
> `comprehension-review-1.md` and was retired on entry to this stage (§G E1).

## Review gate

Not this record — see `comprehension-review-1.md` (attempt 1, 2/2, passed).

## Verify gate

Four falsifier rounds ran before the owner saw anything. The set kept failing the
same way, and the fault was mine each time: the correct option was the
mechanically sensible one, so general engineering reasoning found it with no
artifact attached.

- **Round 1** — all five answered correctly. Two `construction-tell`, two
  `domain-knowledge`.
- **Round 2** — all five again, including the one question that had survived
  round 1. Options rewritten for the tells; facts replaced for the generic ones.
- **Round 3** — all three answered correctly. Two were drafting faults: in one,
  the distractors' reasons contradicted the stem; in another, three options shared
  a boilerplate reason while the correct one gave a real cause.
- **Round 4** — the last. All options reshaped to carry their own causal reason,
  and one fact replaced with a case where the sensible answer is the wrong one.
  The falsifier **missed all three**.

**Why this gate is short.** Of the final round, two questions cleared properly —
missed **and** reported `answerable: no`, which is the at-chance evidence the
check exists to obtain. The third was missed but reported `answerable: yes`, so it
was administered under the degraded rule rather than counted as cleared. Two clean
survivors is below `min_questions: 3`, so the rule to administer short applies;
asking the final round's misses brought the set to three. The CG-5 integration
question (row 1, which spans all three code surfaces and the shared flow) was
**not** among the excluded.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | A shopper types the right digits but the number has no account, and the backend says so. On which of the three code-entry screens does that reply spend one of the three tries? | `spec.md > C-5` + `AC-8` joined to `implement.md > Changes prepared` (where the increment sits in each copy) | integration (CG-5) | 2 | **The cart and re-verify screens, because the shared flow has no branch for that reply** / All three, because the count is raised before the reply is inspected at all / The login and signup screen, because its counter sits inside the failure branch it shares with wrong codes / The re-verify screen only, because it is the host that injects a different verify function | yes | The cart and re-verify screens | **Yes** |
| 2 | A code has run out of life, and the three tries have also run out. Both make the boxes dead. Which line does the shopper read? | `spec.md > EC-3` / `AC-11` joined to `implement.md` step 3 (the message branches left untouched) | behaviour precedence | 2 | **The expired line, because it is the older fact and is still true** / Neither line, because the boxes are dead and the message slot is left empty / The tries-ran-out line, because it names the thing the shopper can act on / Whichever landed last, because both write into the same message slot | yes | The expired line | **Yes** |
| 3 | One acceptance criterion was retired before the plan was approved, and its id was not reused. Which, and why? | `spec.md > Acceptance Criteria Mapping` (the retired row) | traceability | 1 | **AC-12, because a reload also wipes the id that ties a typed code to the sent one** / AC-13, because each of the three screens ended up proved in a file of its own / AC-3, because its two halves are observed in different units and had to be split / AC-9, because the double-fire guard already existed before this change began | short | AC-12 | **Yes** |

- Score: 3/3 (1.0), meets the `gate.threshold` of 1.0 for what was asked (CG-4).

### Facts retired at falsification, for the record

These were dropped because the falsifier answered them blind. Recorded so a later
reader can see what this gate did **not** manage to test.

| Fact it tested | Basis it leaked on |
|----------------|--------------------|
| Why the animation stand-in caches one component per element tag | domain-knowledge — generic React remounting |
| Which check enforces that translation keys exist before code uses them | domain-knowledge, after an options rewrite |
| Why the per-surface cases clear the code field between codes | domain-knowledge — general OTP-field reasoning |
| Which wiring change was reverted to see a test red first | correct blind pick on round 2 |
| Which file was changed with a comment and no logic | construction-tell, twice |
| Where the widget walk stops without the seeded route country | construction-tell — only one option mentioned country |
| Why the plan's type-checker claim turned out false | domain-knowledge — standard optional-prop behaviour |
| Which declared test was written but never run | domain-knowledge — browser suites need a build and staging |
