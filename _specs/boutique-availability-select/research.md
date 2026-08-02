---
ticket: boutique-availability-select
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-07-19
links:
  clickup:
  github:
---

# Research — boutique-availability-select

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Reintroduce an availability select in the boutique create/edit form, populated
from the backend lookup (`{value, label}` pairs: 1 Web / 2 Mobile / 3
WebMobile), replacing the hardcoded `FIXED_AVAILABILITY = 3` with the value the
user actually picks.

## Relevant directories

- `components/SellerDashboard/boutiqueEdit/` — the boutique editor.
  - `helpers.ts` — **the core of the change.** Holds `FIXED_AVAILABILITY = 3`
    (line 16, with the "selector was removed" comment), `BoutiqueLookups`
    (line 51 — currently only `countries`; needs `availabilities`),
    `BoutiqueForm` (line 73 — needs an `availability` field),
    `buildFormFromEdit` (line 206 — must read `boutique.availability`),
    `emptyBoutiqueForm` (line 194 — needs a default), and
    `buildUpdatePayload` (line 297 — currently sends `availability: FIXED_AVAILABILITY`).
  - `BoutiqueEditor.tsx` — loads lookups: edit path `res.data?.lookups`
    (line 162), create path `res.data?.lookups ?? res.data` (line 149);
    composes `sectionProps` (line 537) passed to sections.
  - `sections.tsx` — renders form sections (`CountriesSection`,
    `TranslationsSection`); the new availability select belongs here, driven by
    `lookups.availabilities`.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/boutiques/` —
  the two routes mounting `BoutiqueEditor`: `[boutiqueId]/page.tsx` (edit) and
  `new/page.tsx` (create). Likely untouched (props unchanged).
- `services/sellerDashboard/` — `index.ts` already exposes both fetches:
  `getBoutiqueForEdit` → `GET /shop/boutiques/{id}/edit` (line 911) and
  `getBoutiqueCreateForm` → `GET /shop/boutiques/lookups` (line 967). No new
  service call is needed.
- `public/translations/` — `translations.{ar,tr,ku}.js`; option labels are
  translated **locally** (owner decision). No `"Web"`, `"Mobile"`,
  `"WebMobile"`, or `"Availability"` keys exist today (only `"Web + Mobile"`);
  new keys must be added to all three files.

## Relevant config files

- `.claude/project-config.yaml > protected_paths` — protects `proxy.ts`,
  `serverRequests/**`, auth/cart/order services. **None of the boutique-editor
  files are protected.**
- `shop-seller-product-boutique-apis.md` — API contract. §4.1 documents the
  edit response: `lookups.availabilities = [{value:1,label:"Web"},
  {value:2,label:"Mobile"}, {value:3,label:"WebMobile"}]` (lines 367-371), the
  `availability` field semantics (line 382), and update payload requirement
  `boutique_global_data.availability` integer, required (line 448).
- `tsconfig.json` — path aliases (no change expected).

## Possibly affected services

- **Boutique edit flow** (`GET /shop/boutiques/{id}/edit` → form →
  `POST /shop/boutiques/{id}/update`) — form gains the availability select;
  saved value switches from constant 3 to user-picked; existing boutiques'
  current `availability` must hydrate the select.
- **Boutique create flow** (`GET /shop/boutiques/lookups` → blank form →
  `POST /shop/boutiques`) — same select, options from the lookups response
  (`data` directly, per owner; editor already handles `data.lookups ?? data`).
- **Storefront visibility** — `availability` governs where a boutique surfaces
  (Web/Mobile); a seller picking 2 (Mobile) would hide the boutique from web.
  UI-side only; no storefront code reads this field in this repo (backend
  concern).
- Payload key `availability` already exists in `boutique_global_data` on both
  create and update — no backend contract change.

## Test / validation commands available

- `pnpm lint` — ESLint incl. i18n key-presence check (errors on translate keys
  missing from ar/tr/ku; warns on hardcoded JSX text).
- `pnpm lint:i18n-parity` — verifies the three translation files stay
  key-parallel.
- `pnpm build` — production type-check + build.
- No automated test suite (repo policy); manual validation via the seller
  dashboard boutique create/edit pages.

## Risks and unknowns

- **Lookup shape drift between the two endpoints** — edit nests options under
  `lookups.availabilities`; create returns datasets directly under `data`
  (editor comment at BoutiqueEditor.tsx:147-149 confirms). The exact key name
  on the create endpoint (`availabilities`?) is assumed to match the edit
  lookups; low impact — the API doc §4.1 and the owner's response shape agree
  on `[{value,label}]`. Guard with a fallback if the key is absent.
- **Missing/empty lookup response** — if `availabilities` is absent, the select
  would render empty; needs a sensible fallback (e.g. the three known options
  or the previous default 3) so save never sends null/undefined
  (`availability` is required by the update contract).
- **Label translation vs backend labels** — owner chose local translation:
  map `value` → local key (e.g. 1→"Web", 2→"Mobile", 3→"Web + Mobile"
  wording TBD in spec) rather than rendering `label` raw. Backend label
  strings ("WebMobile") are not user-friendly and not localized.
- **Default for create** — previous behavior always sent 3; spec must decide
  the initial selection on the blank form (default 3 preserves current
  behavior).
- **i18n parity** — any new keys must land in all three translation files in
  the same edit or `pnpm lint` fails.

## Open questions

All resolved by the owner (2026-07-19):

- **Placement:** the select sits **after the global info** (the header/global
  data area), i.e. before the countries/translations sections. Exact component
  seam to be fixed in `/plan`. Editability follows the form's `editMode` like
  other fields.
- **Option labels:** use the **existing translations** — option 3 renders the
  existing `"Web + Mobile"` key; options 1/2 render "Web" / "Mobile" (keys to
  be added to ar/tr/ku if missing — "Web" and "Mobile" do not exist yet).
- **Required:** yes, the field is required. **Create default = 3 (Web +
  Mobile)**; **edit hydrates from the boutique's current `availability`
  value.**

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
