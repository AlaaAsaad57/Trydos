---
ticket: unit-tests-price-resolution
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-08-26
links:
  clickup:
  github:
---

# Intake — unit-tests-price-resolution

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-price-resolution` — phase 14 of `docs/testing/UNIT_TEST_ROADMAP.md`,
Journey 3 (Buy). No ClickUp task and no GitHub issue.

## Ticket Summary

Pin the price the shopper is shown on a product card. Two parts: the flash-deal
choice, and the rounding step that draws it. Research found the roadmap named the
wrong files, so the owner re-scoped this work item on 2026-08-26 — see **Scope,
as decided** below.

## Ticket Metadata

- id / slug: `unit-tests-price-resolution`
- title: Unit tests for the price a shopper sees — variant, country and flash-deal precedence
- owner: developer
- created: 2026-08-26
- links: none

## User Story

> As the team, we want the rules that choose a displayed price pinned by tests,
> so that a later change cannot show one price on a card and charge another.

## Scope, as decided

Research (`research.md`) showed the two files the roadmap names hold no price
rule. The owner settled the scope on 2026-08-26. This work item now covers:

1. **The flash-deal choice.** Lift the block at `ProductCard/index.tsx:92` to
   `:120` into a pure helper, then test the helper directly. The helper must
   return **both** the price and the countdown object — `isFlash` is passed to the
   countdown at line 402 and also decides the orange border at line 124, so a lift
   that returns the price alone changes what the card draws.
2. **The rounding step.** Test the client `RoundPrice` (`utils/functions.tsx:170`)
   — the exchange rate and decimal digits it reads from the store, and the
   non-finite guard that stops a shopper seeing `NaNM`. Only the server copy is
   tested today, and the two copies have drifted.
3. **The roadmap row.** Correct the phase 14 row in
   `docs/testing/UNIT_TEST_ROADMAP.md` so it names the files that really hold the
   rule.

Out: `derivedProps.ts` (copies fields, decides nothing), `store/Details/reducer.ts`
(the listing filter store, not pricing), the per-country rule (already covered by
`tests/services/elastic/helpers.test.ts`), and the variant to price rule (roadmap
phase 19). The known listing sort defect is a recorded backend finding and is not
touched.

**This work item is no longer test-only.** Item 1 changes application code in a
card that every listing renders. The change must be behaviour-preserving, it must
appear in `plan.md > Files to change`, and it must be revertable on its own.

## Acceptance Criteria Presence Check

- Present? no
- Notes: the `spec` stage writes the `AC-n` list. It now has a settled scope to
  write against — the three items above — rather than a roadmap row that pointed
  at the wrong files.

## Test Cases Presence Check

- Present? no
- Notes: this work item is mostly tests, so the cases are the deliverable, named
  at `spec` and mapped at `plan`. Two repository rules apply: look for the test
  that already exists before writing a new one (`PL-14` — the per-country rule is
  an `existing` row, not a new file), and never write a test for code with no
  caller.

## Workflow Type Check

- Is the goal to *understand* something that already exists? no — the outcome is
  files on disk.
- Is the goal to *choose between options*? no.
- Is the change to make already known, leaving only building it? yes — after the
  scope decision above, all three items are named down to the file and the lines.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

The type was right for a second reason found later: item 1 edits application code,
which only `development` may do.

## Missing Information

None. The three questions that decided the size of this work item were put to the
owner on 2026-08-26 and answered:

- **The flash-deal rule** — lift it into a pure helper first, then test the helper.
  (Rejected: a component test through `tests/render.tsx`, and dropping the rule.)
- **The client `RoundPrice`** — in scope here, not a separate ticket.
- **The roadmap row** — correct it in this work item.

The remaining questions are answered in `research.md > Answers`.

## Readiness Status

`READY`

- Justification: every file, rule and boundary is named, and the one application
  change is a single behaviour-preserving lift that the owner chose knowingly.
  Nothing else is in flight — `auth-closeout-tests` and
  `profile-closeout-scripted-and-live` are both `completed`.
