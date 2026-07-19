---
ticket: seller-product-create-validation-fields
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-07-18
links:
  clickup:
  github:
---

# Spec — seller-product-create-validation-fields

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Seller product-create payload validation fields

## Business Goal

Sellers currently cannot create a product at all — every submission of a fully
completed form is rejected by the backend. This is a total block on adding
inventory, so the seller dashboard's core purpose is unavailable. Fixing the
three rejected fields restores product creation, and doing it without regressing
product editing protects the sellers who already have listings.

## User Story

> As a seller, I want to submit the product-create form and have it accepted, so
> that I can list a product instead of being blocked by backend validation errors.

## Functional Requirements

- **FR-1 — Base language is declared.** Every product submission declares its
  base language. The value is derived as `en` rather than chosen by the seller,
  so no new visible control and no new seller-facing copy is introduced for it.
- **FR-2 — Brand is required before submit, on both paths.** An unselected brand
  is caught by the form's own validation and reported to the seller in the same
  way as the other required fields, so submission is prevented rather than
  failing at the server. This applies to creating a product and to editing one.
- **FR-3 — The brand error is readable in every supported language.** Any new
  seller-visible message introduced by FR-2 resolves through the translation
  system in all four supported languages.
- **FR-4 — Quantity-multiplier flag is always declared as a boolean.** The
  multiply-quantity flag is present in every submission with an explicit
  `true` / `false` value, in both the enabled and the disabled case, rather than
  being omitted to mean "disabled". The enable-token spelling (`on` / `off`) and
  the numeric spelling (`1` / `0`) are both excluded.
- **FR-5 — Packed-after-ordering flag is always declared as a boolean.** The same
  always-present boolean rule applies to the packed-after-ordering flag.
- **FR-6 — Both submission paths are covered.** FR-1, FR-4, and FR-5 hold for
  product creation and product editing alike, because both paths are fed by the
  same payload construction.
- **FR-7 — A complete form succeeds.** A form filled with otherwise valid data,
  including a selected brand, is accepted by the backend and the product is
  created, with none of the three reported validation errors returned.

## Non-Functional Requirements

- **NFR-1 — No regression to product editing.** Editing an existing product
  continues to save correctly, and in particular the stored values of the two
  boolean flags are unchanged when a seller leaves them untouched, and are
  correctly cleared when a seller turns them off.
- **NFR-2 — Error feedback is immediate.** Brand validation is reported by the
  form before a network request is made, consistent with how the other required
  fields already behave.
- **NFR-3 — Type safety and lint are preserved.** The change introduces no type
  errors and no lint failures, including translation-parity lint.
- **NFR-4 — No new seller-facing concept.** The base language is not surfaced to
  the seller as something to understand or configure.

## Constraints

- **C-1** — The repository has no automated test suite by policy; verification is
  type-checking, linting, and manual exercise of the form.
- **C-2** — Creation and editing share one payload construction, so any encoding
  change necessarily reaches both. Divergent behaviour between the two paths must
  be deliberate and stated, not incidental.
- **C-3** — Any new seller-visible string must exist in all three non-English
  translation files before it is used, or lint fails.
- **C-4** — The backend is not modified by this ticket. Its acceptance rules are
  the constraint being satisfied, not something that can be changed to fit.
- **C-5** — The published backend contract document is known to be unreliable on
  payload shape, so it cannot be the sole authority for what the server accepts.

## Edge Cases

- **E-1 — Disabling a boolean flag.** Turning either flag off must actually
  disable it. A previously documented backend defect treats a truthy string sent
  for the multiply-quantity flag as "enable", which means an explicit false value
  could be misread as enable. If that defect is still live on the edit path, the
  always-present boolean rule would silently enable a flag the seller just turned
  off — the single most damaging failure mode in this ticket.
- **E-2 — Editing a product that has no brand.** Legacy products may have been
  stored without a brand. Brand is required on both paths (owner decision), so
  editing such a product now requires choosing a brand before it can be saved.
  This is accepted deliberately: it is a visible, self-explanatory prompt rather
  than a silent failure, and it brings legacy records up to the same standard as
  new ones.
- **E-3 — Submission without an English entry.** The base language is derived as
  `en` while a separate existing rule already requires an English name. These two
  rules are independent and could drift, leaving a declared base language with no
  matching content.
- **E-4 — Boolean encoding on the wire.** The submission format transmits text,
  so a boolean is carried as its string form. Whether the backend accepts that
  spelling or expects a numeric form is not settled by the reported error message.
- **E-5 — Brand supplied but not a valid brand.** A brand value that is present
  but does not correspond to an active brand is still rejected by the backend;
  client validation addresses the empty case, not validity.

## Open Questions

Resolved by the owner (2026-07-18):

- ~~Does the backend accept the string spelling of a boolean, or a numeric form
  (E-4)?~~ **Resolved:** boolean encoding only — `true` / `false`. Never the
  enable-token spelling (`on` / `off`), never `1` / `0`.
- ~~Is brand genuinely required when editing, or only when creating (E-2)?~~
  **Resolved:** brand is required on **both** creation and editing.

Still open:

- **Is the truthy-string defect described in E-1 live on the edit path?** The
  owner has decided *what to send* (always an explicit boolean), which settles
  the requirement, but not *how the server reads it* — that is an observable fact
  about the backend, not a decision available to this ticket. If the defect is a
  plain truthiness check, the string `false` is truthy and a flag switched off
  would be stored as on. This does not block planning, because the decision is
  made and the approach is fixed either way; it remains the primary risk carried
  into verification, and `AC-8` is the criterion that detects it.
- Does the always-present boolean rule apply to any other flag not exercised by
  the captured failing submission? Low impact — no other flag is currently
  suspected, and any such flag would surface as a new backend error rather than
  silent misbehaviour.
- Should the base language be a fixed `en`, or read from the English entry that
  existing validation already requires (E-3)? Both satisfy `AC-1`; the choice
  only matters if the two rules ever drift. An approach-level detail for `/plan`.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A submitted create payload contains a base-language field with the value `en`. | FR-1 |
| AC-2 | Submitting the create form with no brand selected is blocked by the form, showing a brand-required error next to the brand field, and issues no network request. | FR-2, NFR-2 |
| AC-3 | Any new brand-required message resolves in all four supported languages, and translation-parity lint passes. | FR-3, C-3 |
| AC-4 | A submitted payload contains the multiply-quantity flag with an explicit boolean value when the flag is enabled **and** when it is disabled — the key is never absent. | FR-4 |
| AC-5 | A submitted payload contains the packed-after-ordering flag under the same always-present boolean rule as AC-4. | FR-5 |
| AC-6 | AC-1, AC-4, and AC-5 hold for the edit submission as well as the create submission; any deliberate difference between the two paths is stated and justified. | FR-6, C-2 |
| AC-7 | Submitting a fully completed create form with a brand selected succeeds, and the backend returns none of `default_language_code`, `brand_id`, or `multiplyQTY` validation errors. | FR-7 |
| AC-8 | Saving an edit of an existing product still succeeds, and a boolean flag turned off by the seller is stored as off — not silently re-enabled. | NFR-1, E-1 |
| AC-9 | Type checking and linting both pass. | NFR-3 |
| AC-10 | Editing an existing product that has no brand stored prompts the seller to select one, with the same brand-required error as AC-2, and saves normally once a brand is chosen. | FR-2, E-2 |

## Out of Scope

- The debug helper that fills the product form from a saved payload, to avoid
  re-entering data by hand. Tracked separately.
- Descriptor values, which are collected by the form but deliberately not
  submitted pending an unresolved backend contract.
- Tax fields, which are deliberately withheld pending a separate backend defect.
- Any backend or DTO change; this ticket adapts the client to the server's
  existing rules.
- Broader validation coverage for fields not named in the reported errors.
- Correcting the published backend contract document.
