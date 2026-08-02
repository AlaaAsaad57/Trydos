---
ticket: boutique-availability-select
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Spec — boutique-availability-select

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Boutique availability select (lookup-driven)

## Business Goal

Sellers must be able to control where their boutique is exposed (Web, Mobile,
or both) instead of every boutique being silently forced to "Web + Mobile".
The choices come from the backend lookup so the storefront always offers
exactly the options the platform supports.

## User Story

> As a seller creating or editing my boutique, I want to pick the boutique's
> availability (Web / Mobile / Web + Mobile) from a select whose options come
> from the backend, so that my boutique is exposed only on the channels I
> choose.

## Functional Requirements

- **FR-1** The boutique form (both create and edit) shows an availability
  select, positioned **after the global info area and before the subsequent
  form sections**.
- **FR-2** The select's options are sourced from the backend lookup data:
  on **edit**, from the availabilities list in the edit response's lookups;
  on **create**, from the availabilities list in the lookups endpoint's
  response data. Options are `{value, label}` pairs
  (1 = Web, 2 = Mobile, 3 = WebMobile).
- **FR-3** Option labels are rendered from the app's **local translations**
  (all four app languages), not the raw backend `label` strings. Option 3
  reuses the **existing** "Web + Mobile" translation key; options 1 and 2 use
  "Web" / "Mobile" keys (added to the three translation files if absent).
- **FR-4** The field is **required**. On **create** it defaults to
  **3 (Web + Mobile)** — preserving today's effective behavior. On **edit**
  it is pre-selected with the boutique's **current stored availability**.
- **FR-5** On save (create and update alike), the payload's existing
  `availability` key carries the **value the user picked** — the hardcoded
  constant 3 is removed and replaced by real user data.
- **FR-6** The select respects the form's edit/read-only mode exactly like the
  neighboring fields (disabled when the form is not editable).

## Non-Functional Requirements

- **NFR-1** All user-visible text for this feature (field label, options, any
  validation message) is translatable per the project i18n policy — no
  hardcoded strings; the three non-English translation files stay
  key-parallel.
- **NFR-2** The select works in RTL locales (ar/ku) consistently with the rest
  of the form.
- **NFR-3** No additional network requests are introduced — options ride on
  the fetches the form already performs.
- **NFR-4** Lint and production build pass.

## Constraints

- The save payload contract is unchanged: the integer `availability` field is
  already accepted/required by the backend on create and update — only its
  source changes (user selection instead of a constant).
- The lookup response shapes are given: edit nests options inside the
  response's lookups object; create returns datasets directly under its data
  field.
- No backend or API contract changes; frontend-only.
- No protected paths are involved.
- No automated tests (repo policy); validation is lint/build + manual checks.

## Edge Cases

- **EC-1** Lookup list absent/empty (malformed or older backend response): the
  select must still function using the three known options as a fallback, so a
  save can never send an empty/undefined availability.
- **EC-2** Stored availability on edit does not match any lookup option
  (unexpected value): the select falls back to the default (3) rather than
  rendering an invalid/blank selection.
- **EC-3** Backend label wording ("WebMobile") is never shown to users — the
  local translation is always used, including when the lookup supplies
  unexpected label text.

## Open Questions

None — placement, translation approach, requiredness, and defaults were all
decided by the owner (see research.md, Open questions — resolved 2026-07-19).

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | The availability select is visible in **both** the create and the edit boutique form, placed after the global info area. | FR-1 |
| AC-2 | The select's options come from the backend lookup data of the respective flow (edit response lookups / create lookups data) and cover exactly the offered `{value,label}` pairs. | FR-2 |
| AC-3 | Options display localized labels in all four app languages; option 3 uses the existing "Web + Mobile" translation; raw backend labels are never rendered. | FR-3, NFR-1, EC-3 |
| AC-4 | On create, the select defaults to Web + Mobile (3); on edit, it shows the boutique's stored availability. | FR-4 |
| AC-5 | Saving create or edit sends the user-selected value in the existing `availability` payload key; the fixed constant is gone. | FR-5 |
| AC-6 | The select is disabled outside edit mode and behaves correctly in RTL locales. | FR-6, NFR-2 |
| AC-7 | With an absent/empty lookup list or an unrecognized stored value, the select still renders valid options and never submits an empty availability. | EC-1, EC-2 |
| AC-8 | `pnpm lint` (incl. i18n key checks) and `pnpm build` pass; the three translation files remain key-parallel. | NFR-1, NFR-4 |

## Out of Scope

- Any backend/API change (endpoints, payload keys, lookup shapes).
- Availability handling for products or any entity other than boutiques.
- Storefront-side filtering/behavior driven by the availability value
  (backend concern).
- Migrating/backfilling existing boutiques' stored availability values.
- The deferred related-products attachment feature and other boutique-form
  fields.
