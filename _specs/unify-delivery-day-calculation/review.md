---
ticket: unify-delivery-day-calculation
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-07-26
links:
  clickup:
  github:
---

# Review — unify-delivery-day-calculation

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Review round 6 — APPROVED.** Rounds 1–4 returned defects in transient-render machinery
serving `AC-11`, a criterion added at `/spec` rather than requested at intake. The ticket was
narrowed (spec revision 2 removed `AC-11`), and rounds 5–6 covered the narrowed plan. Round 5
returned two minors; this round confirms both closed with no new findings.

## Review Scope

`spec.md` revision 2 (twelve criteria; `AC-11` deliberately absent) and `plan.md` as revised
after round 5. The panel was re-run over the five-edit delta (RP-4). Comprehension check
passed 3/3.

## Plan Summary

Normalise the starting-settings response at its three ingest points with a resolver that
accepts both backend envelope shapes, so the platform shipping duration stops resolving to
zero for signed-in shoppers. Two cart components move from parsing the session cache each
render to reading the store, coercing both operands so the row cannot render `NaN`.

Six files, one protected path. No hydration, no gating.

## Risks

- The resolver's `0` default makes a dropped or renamed duration field indistinguishable from
  a genuine zero (NFR-1). No runtime guard; the signed-in-versus-guest comparison at
  `/verify` is the standing detector, which is why that check runs twice.
- `NFR-2` has no acceptance criterion mapped since `AC-11` was removed, so nothing records
  against it. Knowingly accepted — the change improves the behaviour it describes.
- Order-status tabs begin rendering for signed-in shoppers with some labels untranslated.
  Deferred to its own ticket; recorded as a `/verify` observation.

## Assumptions

- The core backend's shape is the accepted contract; the gateway aligning is a separate
  deliverable this change must not depend on.
- Transient start-up behaviour is out of scope per `spec.md` revision 2.
- No automated tests are added; validation is the `full-build` profile plus manual checks run
  once signed in and once as a guest.

## Open Questions

- None.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| senior | info | Both round-5 minors closed: both operands now coerced (Steps 5–6, AC-8/AC-9 rows match), and Step 7 now hard-forbids translation-file edits with the labels pushed to their own ticket. The marquee note states the actual endpoint fact, and `NFR-2` as a recorded unmapped risk is the honest option. No new problems; scope, file list, protected path and rollback unchanged and coherent. | plan.md | **Accept — proceed.** |
| security | info | Delta is entirely defensive/narrowing: coercing both operands removes a `NaN` path with no new exposure, Step 7 shrinks the write surface, the corrections are documentation-only, and `NFR-2` is a verification gap rather than a risk. Blast radius unchanged at six revertable files; protected path still listed and justified; no new endpoints, inputs or credentials. | plan.md | **Accept — proceed.** |
| performance | info | Coercing the second operand is a per-item `Number()`/finite check on an already-rendering list, negligible beside the `JSON.parse` per render that Step 5 removes. Net reduction in render-path work, and it removes the `NaN` path that made the delivery row appear and disappear across re-renders. | plan.md Steps 5–6 | **Accept — proceed.** |

## Decision

`APPROVED`

- Rationale: the plan is the smallest change that fixes the reported defect — the platform
  shipping duration resolving to zero for signed-in shoppers because the core backend returns
  the settings object under a different key. Normalising at the three ingest points repairs
  every affected surface without touching the ~15 read sites; accepting both envelope shapes
  keeps guests from regressing and removes any dependency on the gateway release. Coverage of
  all twelve criteria was verified against the code, including the three surfaces claimed to
  need no edit. Both round-5 minors are closed and all three lenses returned clean. The
  protected-path edit is confined to a single return expression, listed and justified, and
  rollback is a single revert with each file independently revertable. Two known gaps are
  recorded rather than fixed — an unmapped `NFR-2` and untranslated order-status labels — both
  judged proportionate and deferred deliberately.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): `developer` — self-approval, 2026-07-26. Comprehension check passed 3/3
  (`comprehension.md`, CG-4).

## ADR reference

- ADR: none

## Required Follow-up Actions

- None blocking implementation.
- Separate tickets recommended: (1) add the missing order-status label keys to the three
  translation files; (2) gateway-side alignment to the accepted response shape, after which
  the resolver's fallback branch can be removed.
