---
ticket: boutique-availability-select
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Plan — boutique-availability-select

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Extend the existing boutique-editor form model instead of adding any new data
path: add `availability` to `BoutiqueForm` and `availabilities` to
`BoutiqueLookups` in `helpers.ts`, hydrate it from the fetches the editor
already performs (`GET /shop/boutiques/{id}/edit` → `lookups.availabilities`;
`GET /shop/boutiques/lookups` → `data` — `BoutiqueEditor.tsx` already
normalizes both shapes with `res.data?.lookups ?? res.data`), and render a new
`AvailabilitySection` between the header (global info) card and
`TranslationsSection`. Labels come from local translations keyed by option
`value` (1 → "Web", 2 → "Mobile", 3 → "Web + Mobile" — the last already exists
in all three files); backend `label` strings are never rendered. The
`FIXED_AVAILABILITY` constant becomes the *default* (create + invalid-value
fallback) rather than the forced payload value, and `buildUpdatePayload` sends
`form.availability`. Requiredness is guaranteed by construction: the select
always has a valid selection (default 3), so no new `validate()` rule or error
message is needed (AC-4/AC-7).

## Steps

1. **`helpers.ts` — types + mapping (AC-2, AC-4, AC-5, AC-7):**
   - Add `AvailabilityOption { value: number; label: string }`.
   - Add `availabilities?: AvailabilityOption[]` to `BoutiqueLookups`.
   - Rename `FIXED_AVAILABILITY` → `DEFAULT_AVAILABILITY = 3` (update the
     comment: default, no longer forced) and export
     `FALLBACK_AVAILABILITIES` = the three known options (EC-1).
   - Export `AVAILABILITY_LABEL_KEYS: Record<number, string>` =
     `{1: "Web", 2: "Mobile", 3: "Web + Mobile"}` (EC-3).
   - Add `availability: number` to `BoutiqueForm`.
   - `emptyBoutiqueForm`: `availability: DEFAULT_AVAILABILITY` (create default).
   - `buildFormFromEdit`: read `boutique.availability`; keep it only if it is
     one of the known option values, else fall back to `DEFAULT_AVAILABILITY`
     (EC-2).
   - `buildUpdatePayload`: `availability: form.availability` replaces the
     constant.
2. **`sections.tsx` — new `AvailabilitySection` (AC-1, AC-3, AC-6):**
   - New exported section using the existing `Section` wrapper (its
     `title`/`desc` are auto-translated) titled "Availability" with a short
     desc, rendering the options from
     `lookups.availabilities?.length ? lookups.availabilities : FALLBACK_AVAILABILITIES`.
   - Render as the existing `Segmented`-style choice or a `<select>` with
     `dashInputClass` (match neighboring form idiom); each option's visible
     text = `t(AVAILABILITY_LABEL_KEYS[value] ?? String(label))`; selection
     patches `{ availability: value }`; `disabled` prop respected like
     `CountriesSection`. RTL needs no special handling beyond the form's
     existing `direction` container.
3. **`BoutiqueEditor.tsx` — mount the section (AC-1):**
   - Import `AvailabilitySection` and render it first in the sections list
     (before `TranslationsSection`, i.e. immediately after the global-info
     header card).
   - No lookup-loading changes needed (both paths already populate `lookups`).
4. **Translations (AC-3, AC-8):** add the missing keys to **all three** of
   `public/translations/translations.{ar,tr,ku}.js` in the same edit:
   `"Web"`, `"Mobile"`, `"Availability"`, and the section desc string chosen in
   step 2 (e.g. `"Choose where this boutique is available."`). `"Web + Mobile"`
   already exists in all three — reuse, do not duplicate.
5. Run validation (profile below) and manually walk the create + edit flows.

## Files to change

- `components/SellerDashboard/boutiqueEdit/helpers.ts` — form/lookup types,
  default + fallback constants, label-key map, edit hydration, payload uses the
  picked value.
- `components/SellerDashboard/boutiqueEdit/sections.tsx` — new
  `AvailabilitySection` component.
- `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx` — render the new
  section after the global-info header card.
- `public/translations/translations.ar.js` — new keys (key-parallel).
- `public/translations/translations.tr.js` — new keys (key-parallel).
- `public/translations/translations.ku.js` — new keys (key-parallel).

## Validation strategy

- Validation profile: `full-build`   # typecheck + lint + production build
  (AC-8 explicitly requires lint and build to pass; lint also enforces the
  i18n key checks / parity).
- Manual walkthrough mapped to ACs:
  - Create flow (`/sellerProfile/sellerDashboard/{id}/boutiques/new`): select
    visible after global info, default "Web + Mobile", options localized
    (AC-1/3/4); save → request body `boutique_global_data.availability` equals
    the picked value (AC-5).
  - Edit flow (`.../boutiques/{boutiqueId}`): select pre-set to the stored
    value; disabled until Edit is pressed (AC-4/6); save sends the changed
    value (AC-5).
  - RTL check in `ar` locale (AC-6).
  - Fallback: with lookups lacking `availabilities` (simulated), the three
    known options still render and save sends a valid integer (AC-7).

## Rollback

- Single revert of the implementation commit (all changes are frontend-only,
  in one commit at `/publish-pr`). No data/schema migration; the backend
  already accepts any of 1/2/3 — boutiques saved meanwhile keep whatever
  value the user picked.

## Out of scope

- Backend/API changes, other lookup datasets, product availability.
- Storefront behavior driven by the availability value.
- Adding a `validate()` error message for availability (unreachable state —
  the select always holds a valid value).
- Backfilling existing boutiques' stored values.
- The deferred related-products feature and unrelated boutique-form fields.
