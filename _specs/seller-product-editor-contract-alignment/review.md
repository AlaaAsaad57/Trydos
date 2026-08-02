---
ticket: seller-product-editor-contract-alignment
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-07-20
links:
  clickup:
  github:
---

# Review — seller-product-editor-contract-alignment

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Round 2** (2026-07-20). Round 1 recorded `CHANGES_REQUESTED` against plan
revision 1; this round reviews **plan revision 2**. Round 1's findings are
preserved below under *Round 1 findings* so the history is not lost.

## Review Scope

`spec.md` (as corrected 2026-07-20 — FR-8 restated, NFR-3 and AC-18 withdrawn)
and `plan.md` revision 2, with `research.md` (R1 retracted, Q-A void) and
`intake.md` as context. The advisory panel re-ran all three lenses against the
revised plan. Comprehension gate: attempt 1 failed 2/3, attempt 2 passed 3/3
(`comprehension.md`).

## Plan Summary

Five units: preserve and stage the contract then retire the four superseded docs;
correct the body builder (translation ids, `luck_price` key presence,
`packed_after_ordering` as `'on'`/`''`, `tax`/`tax_type` restored in step with
`SCALARS`); attribute rejections to form fields from data the transport already
returns; freeze the descriptors section with a visible affordance; add the new
translation keys. Confined to three component files plus the three translation
files and the documentation set. No shared transport, no backend change.

## Risks

- The residual risks are small and named in the follow-ups below. None concerns
  the approach.
- The largest remaining operational risk is the three untracked contract
  documents during Unit 1: git cannot recover them, so the out-of-repo copy at
  step 1 is the only safety net, and `git add -N` makes a blanket `git restore .`
  actively destructive (empty blobs). This is the point the comprehension gate
  caught on attempt 1 and is called out as follow-up 3.
- Repo privacy is a precondition for committing the contract (it documents
  unpatched backend defects with source-line citations) and is not yet confirmed
  — follow-up 2.

## Assumptions

- The contract remains authoritative over any conflicting tracked doc or comment
  (`spec.md` C-7).
- The repository is and remains private. **Load-bearing** — see follow-up 2.
- `/implement` produces no commit (IM-9); `/publish-pr` is the single git
  delivery boundary (PB-8). Unit 1 is written accordingly.

## Open Questions

- None blocking. Repo privacy (follow-up 2) is an owner confirmation, gated
  before Unit 1's move rather than left open.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

### Round 2 — against plan revision 2

All three lenses independently confirmed that revision 2 lands the round-1
majors: the transport change is gone from Approach, Steps and Files to change and
is named in Out of scope; the rollback exclusion for untracked files is stated;
the three new checks are create-only with the C-3 reason; the minors are folded
in with citations. Scope shrank rather than grew.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| performance, senior, security (all three) | major | **R2-1 — The AC-19 coverage claim is false.** The plan states "AC-19 — covered by the `standard-frontend` profile's checks", but that profile is `typecheck` + `lint` only; AC-19 and NFR-5 both require a production build. | plan Validation strategy; spec NFR-5, AC-19; `project-config.yaml` validation_profiles | **Accept.** Keep `standard-frontend` (proportionate now that transport is untouched) and run `pnpm build` as a **named manual check recorded against AC-19**. Binding follow-up 1. The profile stays as-is; only the false claim is corrected. |
| security | major | **R2-2 — Repo privacy is load-bearing but unenforced.** Committing the contract publishes Laravel `file:line` citations for a boutique IDOR, `id` injection on create, barcode and approval-queue bypasses. The plan leaves this as an owner action with no step. | plan revision-log row 9; Unit 1 step 2; spec FR-1, AC-1 | **Accept.** Becomes an explicit **gate on Unit 1**: confirm private before the move. If it cannot be confirmed, the vulnerability citations are redacted from the committed copy and kept out-of-repo. Binding follow-up 2. |
| senior | minor | **R2-3 — `git add -N` entries are empty blobs**, so a blanket `git restore .` would truncate the three moved documents to zero bytes rather than leave them alone. The rollback text does not say this. | plan Rollback ¶1-2, step 3 | **Accept.** Add a "restore per-path, never `git restore .`" clause. Binding follow-up 3. Independently reinforced by the comprehension gate, which the owner failed on exactly this point at attempt 1. |
| senior | minor | **R2-4 — AC-2b, AC-8 and AC-16 have no entry in the Validation strategy's AC list**, a TR-2 gap that would surface at `/verify`. | plan Validation strategy vs spec AC table | **Accept.** One check each, added at implement time and recorded in `verify.md`. Binding follow-up 4. |
| senior, security | minor | **R2-5 — Revision-log row 2 is stale.** It says `spec.md` and `research.md` still encode the disproven premise; both were corrected in the pre-step immediately after the plan was written. | plan Revision log #2 vs spec FR-8/NFR-3/AC-18, research R1/Q-A | **Accept — already resolved.** `spec.md` (FR-8 restated, NFR-3 + AC-18 withdrawn) and `research.md` (R1 retracted, Q-A void) are corrected. Only the plan's log row is out of date; corrected at implement time. Follow-up 5. |
| security | minor | **R2-6 — "Allowlist-only" is asserted but not specified.** Step 13 reads as a passthrough of `detailed_error[].code`, so an unknown backend-chosen code could become a record key, and the record's *values* are not stated to be translated constants. | plan Approach decision 1, step 13; spec FR-11 | **Accept.** Unknown codes are **dropped, not mapped**; every value in the error record is a translated constant. Binding follow-up 6. |
| senior | minor | **R2-7 — Step 9 sends `"0"` for a cleared luck price**, where FR-5/E-3 require only key presence. If `0` were a meaningful promotional price this would change product data rather than just restore savability. | plan step 9; spec FR-5, E-3 | **Dismiss.** Contract §1b gives the server default as `0` and forces `0` for unapproved sellers, so `0` **is** the neutral no-luck-price value. `"0"` also matches the existing handling of the adjacent price fields. No change. |
| performance | minor | **R2-8 — The error-mapping helper is unbounded in the size of `detailed_error[]`.** | plan step 13 | **Dismiss.** Runs once per failed save, over a validation-error array. A length guard would be machinery for no realistic case. |
| security | info | **R2-9 — No `protected_paths` entry in Files to change**; re-checked against the revised list. `docs/` is not served at runtime. | plan Files to change; `project-config.yaml` | **Accept — no action.** |
| performance | info | **R2-10 — Remaining footprint is three component files plus ~5 keys × 3 translation files.** No runtime, bundle, request-path or memory implication; dropping `full-build` is proportionate. | plan Files to change | **Accept — no action.** |

### Round 1 findings (against plan revision 1) — retained

P-1 (transport premise false; all three lenses) · P-2 (Unit 1 rationale
unachievable — `/implement` makes no commit) · P-3 (rollback wrong for untracked
moves) · P-4 (new checks would block legacy edits) · P-5 (contract documents
unpatched backend vulnerabilities) · P-6 (never render backend text) · P-7
(`packed_after_ordering` off value unnamed) · P-8 (exact-text assert matching
brittle) · P-9 (four vs five units; per-hunk revert) · P-10 (orphan list before
deletion) · P-11 (silent dead descriptor controls) · P-12 (Sentry widening —
moot) · P-13 (AC-19 unnamed) · P-14 (credential skim) · P-15 (no auth surface) ·
P-16 (single `setErrors`) · P-17 (`descriptor_values` left dead — dismissed).

All accepted items were addressed in revision 2 and re-confirmed by the round-2
panel; P-12 is moot because the transport change is gone.

## Decision

`APPROVED`

- Rationale: The plan is now true to the code. Revision 2 removed a change to
  app-wide transport that would have done nothing, corrected a rollback section
  that was actively wrong about the ticket's most fragile files, and scoped a
  validation change that would otherwise have blocked editing legacy products.
  The result is materially smaller than revision 1 — three component files, three
  translation files and the documentation set — which is the right direction for
  a correctness fix.

  The eight residual findings are accuracy and specification items, not design
  concerns: one false coverage claim, one precondition needing a gate, three
  wording fixes and a stale log row, with two dismissed on the contract's own
  evidence. None warrants a third full cycle; all six accepted items are recorded
  as binding follow-ups below and are cheap to apply at implement time.

  The panel did not decide this (RP-2) — it surfaced R2-1 and R2-2, which were
  weighed and accepted as follow-ups rather than blockers. The comprehension gate
  is what gates this approval: attempt 1 failed 2/3 on the untracked-file rollback
  question and recorded no decision; attempt 2 passed 3/3 (CG-4).

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approval, 2026-07-20, after passing the
  comprehension gate at attempt 2 (3/3).

## ADR reference

- ADR: none

## Required Follow-up Actions

Binding on `/implement` — apply these as documented deviations from `plan.md` and
record each in `implement.md`. They do not change the approach or the file list.

1. **AC-19 (R2-1):** run `pnpm build` as an explicit manual check and record the
   result against AC-19 in `verify.md`. The `standard-frontend` profile stays;
   delete the plan's false "covered by the profile's checks" claim.
2. **Repo privacy gate (R2-2):** confirm the repository is private **before**
   Unit 1's move. If it cannot be confirmed, redact the backend vulnerability
   `file:line` citations from the committed copy and keep them out-of-repo.
   Record which path was taken.
3. **Rollback clause (R2-3):** restore per-path; never `git restore .` while the
   three documents are `git add -N` index entries with empty blobs.
4. **Traceability (R2-4):** add a validation check for AC-2b, AC-8 and AC-16 so
   every AC has a mapped result at `/verify` (TR-2).
5. **Stale log row (R2-5):** correct plan revision-log row 2 — `spec.md` and
   `research.md` are already corrected.
6. **Attribution specificity (R2-6):** unknown `detailed_error[].code` values are
   dropped, not mapped; every value in the error record is a translated constant.

Outside this ticket, carried forward from round 1:

7. **Raise the backend security defects separately** — boutique IDOR,
   client-controllable `id` on create, barcode uniqueness bypass on update,
   approval-queue bypass via `seller_product_id`. C-1 keeps them out of scope and
   AC-16 does not discharge them.
