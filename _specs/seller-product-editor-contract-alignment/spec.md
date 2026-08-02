---
ticket: seller-product-editor-contract-alignment
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-20
links:
  clickup:
  github:
---

# Spec — seller-product-editor-contract-alignment

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Seller product add/edit — backend body-contract alignment (roadmap phases P1–P4).

## Business Goal

The seller product form currently loses data silently and rejects saves without
saying why. Every edit overwrites the wrong translation rows; a toggle the seller
switches on never turns on; a seller who clears one price field can no longer
save at all; and when the backend rejects a submission, the seller is shown a
concatenated wall of server text instead of an error on the input that caused it.

Fixing this stops silent corruption of live product data, unblocks sellers who
are currently stuck, and turns rejected saves into something a seller can act on
without support. It also puts the verified body contract under version control,
so the knowledge this work depends on cannot be lost.

## User Story

> As a **seller using the dashboard product add/edit form**, I want **every field
> I fill in to be sent in the shape the backend expects, and every rejection to
> land on the input that caused it**, so that **my edits save as entered, and I
> can fix a rejected form without deciphering raw server text.**

## Functional Requirements

**Contract truth-base**

- **FR-1** — The verified body contract (the field-by-field contract document and
  its companion dummy-payload document) and the roadmap that governs this work
  are **preserved and protected from accidental loss**, and are **deliberately
  excluded from this repository**.
  *(Amended 2026-07-20. Originally "under version control, so they survive a
  clean of the working tree". The repository was found during implementation to
  be **public**, and the contract enumerates unpatched backend defects with
  backend `file:line` citations — committing it would publish an exploitation
  guide for a live system. Protection is now by explicit ignore rule plus an
  out-of-repo copy, not by tracking. The original risk — silent loss to
  `git clean` — is reduced but not eliminated: `git clean -fd` skips ignored
  files, `-fdx` does not.)*
- **FR-2** — The four superseded product documents are replaced by that contract.
  Any content in them that appears nowhere in the new contract is carried into it
  first; content the contract already covers is dropped rather than merged. No
  placeholder or tombstone files remain.
- **FR-2b** — Retained documents that contradict the contract are corrected to
  match it, rather than left standing (C-7). This applies in particular to the
  outbound backend follow-up document, whose leading blocker entry concerns tax
  handling that the contract has since settled.

**Body correctness**

- **FR-3** — Editing a product preserves the identity of its existing
  translations: each translation submitted on update carries the identifier the
  edit response supplied for it, so the backend updates the row it came from
  instead of creating or overwriting an unrelated one.
- **FR-4** — When a seller enables the "packed after ordering" option on an
  existing product and saves, the option is persisted and is still enabled when
  the product is reloaded.
- **FR-5** — The luck-price field is always submitted, including when the seller
  has cleared it, so that clearing it does not make the form unsavable.
- **FR-6** — Tax amount and tax type are submitted, with tax type restricted to
  the two values the backend recognises, and both appear in the
  save-confirmation summary in step with being sent.
- **FR-7** — The multiply-shipping-by-quantity encoding is unchanged; the
  contract confirms the current behaviour is correct.

**Error attribution**

- **FR-8** — The structured, field-attributed validation errors the backend
  already returns are **used** by the form, rather than collapsed into a single
  joined message string with their field identifiers discarded.
  *(Corrected 2026-07-20: this previously asserted the errors did not reach the
  form. They do — the transport already returns them. The defect is at the read
  site only.)*
- **FR-9** — A rejected save displays each field-attributed error on that field's
  own input, including errors that identify an item within a list of values.
- **FR-10** — The four image and colour-assignment failures that the backend
  reports without a field identifier are displayed against the image and
  colour-image inputs they concern.
- **FR-11** — No raw backend text is presented to the seller as the primary error
  message. A rejection the form cannot attribute to a field is still surfaced —
  as a translated general message — rather than silently swallowed.
- **FR-12** — The form checks, before submitting, the three fields the backend
  requires on create but the form did not previously validate: boutique, at least
  one category, and description. Each failure is displayed on its own input.

**Descriptors**

- **FR-13** — The descriptors/attributes section continues to render its groups
  and values exactly as it does today, but the seller can neither set nor change
  any value in it, in both add and edit modes.
- **FR-14** — Descriptor values are never submitted and never appear in the
  save-confirmation summary, so the seller is never told a descriptor change is
  about to be saved.

**Cross-cutting**

- **FR-15** — Every user-visible string introduced by this work exists in all
  three non-source translation files before it is used, and is resolved through
  the translation helper rather than being hardcoded.

## Non-Functional Requirements

- **NFR-1 — No regression of already-correct behaviour.** The behaviours the
  roadmap verified as already correct must still hold after this work: colours
  submitted as codes and sizes as names; the variant key construction; image
  filenames byte-identical between the image list and the colour-image
  assignment; no identifier sent when creating; the similar-words field omitted;
  status, request-status and user-identifier never sent; the weight requirement
  for piece and litre units; and unconditional submission of the fields the
  backend reads without checking for presence.
- **NFR-2 — Key-presence discipline is preserved.** Update submissions must not
  omit any key the backend reads unconditionally; a missing key produces an
  unattributable failure. No change may introduce a new conditional omission.
- **NFR-3 — WITHDRAWN (2026-07-20).** This required the error-surfacing change to
  be behaviour-neutral for every other caller, because it was believed to touch
  shared transport. It does not: the transport already returns the structured
  errors, so the work is confined to the product form and no other caller is
  involved. Retained as a withdrawn entry so the numbering stays stable.
- **NFR-4 — Translation parity holds.** All three non-source translation files
  remain key-parallel; the parity check passes.
- **NFR-5 — The codebase stays clean.** Type-checking, linting and a production
  build all succeed.
- **NFR-6 — Usability.** A rejected save shows the seller which inputs are at
  fault without requiring them to read backend terminology.

## Constraints

- **C-1** — No backend change is in scope. Where a defect can only be fixed
  server-side, this ticket records it and stops.
- **C-2** — No automated tests are added; the repository has no test suite by
  policy. Verification is manual.
- **C-3** — One submission builder serves both add and edit. Any change to it is
  double-exposure and must be correct for both paths.
- **C-4** — The approval-state signals (a product's request status and the
  seller's new-product-approval flag) are ignored entirely by this ticket.
- **C-5** — Descriptors are parked as a deliberate non-feature. Their write
  endpoint is not wired, and no descriptor read path exists to prefill from.
- **C-6** — No new runtime dependency is introduced.
- **C-8 — This repository is public.** Discovered during implementation
  (2026-07-20). Nothing describing an unpatched backend defect, and no backend
  source-line citation, may be committed. This constraint overrides any
  documentation goal in this ticket and is why FR-1/AC-1 were amended.
- **C-7 — The contract is authoritative, always.** Where the code-verified body
  contract disagrees with any tracked document, code comment, or earlier
  artifact, **the contract wins and the other side is treated as stale.** A
  conflict is never a reason to hedge, defer, or seek runtime confirmation; it is
  a reason to correct the stale source. This is a standing rule for this ticket,
  not a per-item judgement, and it governs the tax requirement (FR-6) and the
  document reconciliation (FR-2) in particular.

## Edge Cases

- **E-1** — A product whose edit response supplies no identifier for one or more
  translations: the save must still succeed and must not corrupt the entries that
  do have one.
- **E-2** — Creating a product, where no prior translations exist: no translation
  identifiers are available or expected, and none must be invented.
- **E-3** — A seller clearing the luck price to empty rather than zero.
- **E-4** — A rejection carrying a mix of field-attributed and unattributed
  errors in one response: both kinds must be visible simultaneously.
- **E-5** — A rejection identifying an item inside a list (for example the second
  entry of a list of values) rather than the list as a whole.
- **E-6** — A rejection arriving with no recognisable structure at all: the
  seller must still be told the save failed.
- **E-7** — A product whose categories supply no descriptor groups: the section's
  existing empty state still applies and must not read as an error.
- **E-8** — Enabling "packed after ordering" while **creating** a product: it
  will not persist, and this is expected — see AC-16.
- **E-9** — A seller who has never opened a field the form now validates on
  create: the new checks must not block a submission that was previously valid
  and remains valid.

## Open Questions

**None.** All fourteen questions raised across intake and research were resolved
before this spec was written — eight from the contract and the roadmap's own
deferrals, six by owner decision on 2026-07-20.

One **accepted risk** is carried forward deliberately. It is not an open
question; it is a decision with a known downside, recorded so it is not mistaken
for a verified outcome:

- **AR-1 — Approval visibility remains entirely broken.** With C-4 in force, a
  seller still cannot tell which of their edits applied immediately, which were
  queued for approval, and which were discarded outright. This ticket neither
  improves nor worsens it. **No criterion here may be read as closing it.**

*(A second accepted risk covering tax behaviour was recorded here and has been
withdrawn: the standing precedence rule in C-7 resolves it. The contract is
authoritative, so tax handling is a settled requirement — FR-6 — and not a
gamble to be hedged.)*

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|---|---|---|
| AC-1 | The contract document, its companion payload document, and the roadmap are explicitly excluded from the repository by an ignore rule, are absent from any stageable change, and exist in a copy held outside the repository. *(Amended 2026-07-20 — see FR-1.)* | FR-1 |
| AC-2 | The four superseded documents no longer exist, and every piece of their content absent from the new contract has been demonstrably carried into it. | FR-2 |
| AC-2b | No retained tracked document still contradicts the contract; in particular the outbound backend follow-up's tax blocker entry is corrected to match it. | FR-2b, C-7 |
| AC-3 | Editing a product with existing translations and saving leaves each translation attached to the row it came from — reloading shows the edited text on the correct languages, with no duplicated or blanked entries. | FR-3, E-1, E-2 |
| AC-4 | Enabling "packed after ordering" on an existing product and saving persists the setting; it is still enabled after reload. | FR-4 |
| AC-5 | Clearing the luck price on an existing product and saving succeeds, with no unattributable failure. | FR-5, E-3 |
| AC-6 | Tax amount and tax type are both submitted, tax type is only ever one of the two recognised values, and a changed tax appears in the save-confirmation summary. | FR-6 |
| AC-7 | The multiply-shipping-by-quantity submitted value is byte-identical to the value submitted before this work. | FR-7 |
| AC-8 | A rejected save uses the backend's structured, field-attributed error data instead of collapsing it into a single joined message string. | FR-8 |
| AC-9 | Each field-attributed error from a rejected save is displayed on that field's own input, including errors identifying an item within a list. | FR-9, E-5 |
| AC-10 | Each of the four unattributed image and colour-assignment failures is displayed against the image or colour-image input it concerns. | FR-10 |
| AC-11 | A rejection the form cannot attribute to any field still produces a translated general failure message; no raw backend text is shown as the primary message, and no rejection is silently swallowed. | FR-11, E-4, E-6 |
| AC-12 | Submitting a create form with no boutique, no category, or no description is blocked before submission, with the error shown on the offending input; a previously valid submission is still accepted. | FR-12, E-9 |
| AC-13 | In both add and edit modes the descriptors section renders its groups as before, and no descriptor value can be set or changed by any interaction. | FR-13, E-7 |
| AC-14 | No descriptor value is present in a submission, and no descriptor entry appears in the save-confirmation summary. | FR-14 |
| AC-15 | Every user-visible string added by this work resolves through the translation helper and exists in all three non-source translation files; the parity check passes. | FR-15, NFR-4 |
| AC-16 | Enabling "packed after ordering" while creating a product does not persist, and this limitation is recorded as a backend-side defect rather than reported as fixed. | C-1, E-8 |
| AC-17 | Every behaviour listed as already correct is re-confirmed unchanged, and no submission key that was previously always present has become conditional. | NFR-1, NFR-2 |
| AC-18 | **WITHDRAWN (2026-07-20)** — required an unrelated client operation to fail identically after the work. Moot: no shared transport is touched, so no unrelated operation is affected. Not verified at `/verify`. | NFR-3 (withdrawn) |
| AC-19 | Type-checking, linting and a production build all succeed. | NFR-5 |

## Out of Scope

- Any backend change, including the create-path defect behind AC-16 and the
  client-controllable identifier the contract flags.
- Approval-aware behaviour of any kind: the applied-now versus queued-for-approval
  distinction, and any indication that an unapproved seller's price or country
  edits will be discarded. The known defect is left exactly as it stands (AR-2).
- Wiring the descriptor write endpoint, or any descriptor read/prefill path.
- Per-variant location and external-system identifier keys — optional, and not
  applicable to our sellers.
- The bulk spreadsheet import path.
- The product image gallery tab, except insofar as it feeds the image list.
- The separate product status-change operation.
- Fixing the same unattributed-error defect in other seller-dashboard editors
  that share it; only the product form is in scope here.
- Adding automated tests.
