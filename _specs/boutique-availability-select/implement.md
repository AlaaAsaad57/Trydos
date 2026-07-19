---
ticket: boutique-availability-select
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Implement — boutique-availability-select

> Record of what was actually built, following `plan.md`.

## Changes made

- `components/SellerDashboard/boutiqueEdit/helpers.ts` —
  `FIXED_AVAILABILITY` → `DEFAULT_AVAILABILITY = 3` (default, no longer
  forced); new `AvailabilityOption` interface, `AVAILABILITY_LABEL_KEYS`
  (1→"Web", 2→"Mobile", 3→"Web + Mobile") and `FALLBACK_AVAILABILITIES`
  constants; `BoutiqueLookups.availabilities?`; `BoutiqueForm.availability`;
  `emptyBoutiqueForm` defaults it to 3 (create); `buildFormFromEdit` hydrates
  from `boutique.availability`, falling back to 3 for unknown values (EC-2);
  `buildUpdatePayload` sends `form.availability` (AC-5).
- `components/SellerDashboard/boutiqueEdit/sections.tsx` — new
  `AvailabilitySection`: `Section`-wrapped plain `<select>` (`dashInputClass`),
  options from `lookups.availabilities` filtered to known values (unknown
  values never offered — EC-3/AC-2), falling back to the three known options
  when the lookup list is empty/absent (EC-1); labels via
  `t(AVAILABILITY_LABEL_KEYS[value])`; respects `disabled` (AC-6).
- `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx` — renders
  `<AvailabilitySection />` first in the sections list, immediately after the
  global-info header card (AC-1). No lookup-loading changes (both fetch paths
  already populate `lookups`).
- `public/translations/translations.ar.js` — added
  `"Choose where this boutique is available."` (section desc).
- `public/translations/translations.tr.js` — same key added.
- `public/translations/translations.ku.js` — same key added.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `components/SellerDashboard/boutiqueEdit/helpers.ts`
- `components/SellerDashboard/boutiqueEdit/sections.tsx`
- `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx`
- `public/translations/translations.ar.js`
- `public/translations/translations.tr.js`
- `public/translations/translations.ku.js`

All on branch `ticket/boutique-availability-select` (created from clean
`develop`), left as uncommitted working-tree edits.

## Deviations from plan

- Plan step 4 anticipated adding `"Web"`, `"Mobile"`, `"Availability"` keys —
  all three (plus `"Web + Mobile"`) **already exist in all three translation
  files** (leftovers from the pre-hardening selector), so only the new section
  description key was added. This follows the review's pinned clarification
  ("add each key only where missing") and keeps the files key-parallel.
- The review's other two pinned clarifications were applied as bindings:
  plain `<select>` (not `Segmented`), and options filtered to
  `AVAILABILITY_LABEL_KEYS` so unknown values are neither rendered nor
  submittable.
- The existing `Select` control in `controls.tsx` was deliberately not reused:
  it always renders an empty "Select" placeholder option, which would let the
  user submit an empty availability (violates AC-7). The inline `<select>`
  has no empty option.

## Validation run during implementation

- `pnpm exec tsc --noEmit` — pass (no output, exit 0).
- `pnpm lint` — pass: 0 errors, 34 warnings, all pre-existing (unused
  eslint-disable directives / anonymous default exports in untouched files);
  the i18n key-existence checks passed for every key used by the new section.
- Full `full-build` profile (typecheck + lint + build) executes at `/verify`.
