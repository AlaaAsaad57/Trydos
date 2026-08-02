---
ticket: boutique-availability-select
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Verify — boutique-availability-select

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `full-build` (resolved from
  `project-config.yaml > validation_profiles` → checks `typecheck`, `lint`,
  `build` in `validation_checks`; depth `all-ac` — MO-6/VF-4)

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Select rendered in both flows, after global info: `AvailabilitySection` mounted unconditionally (create & edit) as the first section after the header card (`BoutiqueEditor.tsx` "Sections" block) | code inspection + `pnpm exec tsc --noEmit` | 0 | no type errors | ✅ pass |
| AC-2 | Options from the flow's lookup data: edit `res.data?.lookups`, create `res.data?.lookups ?? res.data` → `lookups.availabilities`, filtered to the known `{value,label}` set | code inspection + typecheck | 0 | `BoutiqueLookups.availabilities` typed `AvailabilityOption[]`; whitelist filter in `AvailabilitySection` | ✅ pass |
| AC-3 | Localized labels, raw backend labels never rendered: `t(AVAILABILITY_LABEL_KEYS[value])`; keys `Availability`/`Web`/`Mobile`/`Web + Mobile` + desc present in ar/tr/ku | `pnpm lint` (key-existence rules) + `node scripts/i18n-parity.mjs` | 0 / 0 | 0 lint errors; "i18n parity OK — 1980 keys present in all three files" | ✅ pass |
| AC-4 | Create default = 3; edit hydrates stored value: `emptyBoutiqueForm` sets `DEFAULT_AVAILABILITY`; `buildFormFromEdit` reads `boutique.availability` | code inspection + typecheck | 0 | verified in `helpers.ts` | ✅ pass |
| AC-5 | Payload carries the user pick; constant gone: `buildUpdatePayload` → `availability: form.availability`; `grep FIXED_AVAILABILITY` finds no code references (workflow artifacts only) | code inspection (grep) | — | 0 code matches | ✅ pass |
| AC-6 | Disabled outside edit mode; RTL: `disabled={disabled}` on the `<select>` (same prop as `CountriesSection`); RTL via the form's existing `direction` container | code inspection + typecheck | 0 | consistent with neighboring sections | ✅ pass |
| AC-7 | Never empty: options whitelist-filtered to `AVAILABILITY_LABEL_KEYS`, `FALLBACK_AVAILABILITIES` when the list is absent/empty, unknown stored value → default 3, and the `<select>` has **no** empty option | code inspection + typecheck | 0 | fallback + filter verified in `sections.tsx`/`helpers.ts` | ✅ pass |
| AC-8 | Lint + build pass; files key-parallel | `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm build` / parity script | 0 / 0 / 0 / 0 | tsc clean; lint 0 errors (34 pre-existing warnings); "✓ Compiled successfully in 2.3min", 48/48 static pages; parity OK | ✅ pass |

## Commands run

- `pnpm exec tsc --noEmit` (check `typecheck`, pass_when exit-zero)
  ```
  exit 0 — no output (clean)
  ```
- `pnpm lint` (check `lint`, pass_when exit-zero)
  ```
  exit 0 — ✖ 34 problems (0 errors, 34 warnings) — all warnings pre-existing
  in files untouched by this ticket
  ```
- `pnpm build` (check `build`, pass_when exit-zero)
  ```
  exit 0 — ✓ Compiled successfully in 2.3min; TypeScript pass; 48/48 static
  pages generated; boutique routes present in the route manifest
  ```
- `node scripts/i18n-parity.mjs` (supporting evidence for AC-8)
  ```
  exit 0 — ✓ i18n parity OK — 1980 keys present in all three files.
  ```
- `git status --porcelain` after all commands (VP-2)
  ```
  unchanged — only the six planned implementation files modified + _specs/
  (validation introduced no working-tree change)
  ```

## Protected-path & runtime impact review

- Were any `protected_paths` files changed by this ticket? **No.**
  Changed files are `components/SellerDashboard/boutiqueEdit/{helpers.ts,
  sections.tsx, BoutiqueEditor.tsx}` and `public/translations/
  translations.{ar,tr,ku}.js` — none matches `protected_paths`
  (`proxy.ts`, `serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`,
  `services/auth.ts`, `services/cart.ts`, `services/order(s).ts`).
- Runtime impact: seller-dashboard boutique create/edit form only; no new
  network requests; payload key unchanged (integer `availability`).

## Sign-off

- Outcome: verified
- Final ticket state: closed   # reviewer transitions verified → closed
- Sign-off: developer (ticket owner, self sign-off; verify-gate comprehension
  3/3 — 2026-07-19)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: all 8 ACs pass at depth all-ac; changes remain uncommitted on
  `ticket/boutique-availability-select` awaiting `/publish-pr`.
