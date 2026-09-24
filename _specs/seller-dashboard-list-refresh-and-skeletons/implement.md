---
ticket: seller-dashboard-list-refresh-and-skeletons
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-02
links:
  clickup:
  github:
---

# Implement — seller-dashboard-list-refresh-and-skeletons

> Record of what was actually built, following `plan.md` **revision 4**.

Branch `ticket/seller-dashboard-list-refresh-and-skeletons`, created from a clean
`develop` (this repository's base branch — the project profile in `CLAUDE.md`
overrides the shared `main` default). Nothing is committed.

**This work reached `implement` ungated.** Plan revision 4 was never reviewed:
the panel and the comprehension gate were skipped at the owner's instruction, and
the stage was moved by an owner override. `ticket.md > State History` carries that
entry. The `APPROVED` in `review.md` belongs to plan revision 2.

## Changes prepared (uncommitted)

Fourteen source files, exactly the set `plan.md > Files to change` names. No other
file was touched, and no protected runtime path was involved.

- `app/(client)/[lang]/sellerProfile/SellerProfileContext.tsx` — `loading` starts
  `true` (step 3).
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` — the
  five section flags and all eleven read sites; the eleven `setLoading` writer
  lines removed; `permissionsLoading` deleted; `fetchOnce` and the per-arrival
  map; `initializeData` routed through it with its permission checks; the
  social-counts id ref; the error-before-refusal branches; seven placeholder
  sites; the corrected comment (steps 2, 4, 4b, 5, 6, 7, 8, 13).
- `components/skeleton/loaders/SellerDashboardLoader.tsx` — **new**. The shared
  pulse block, six section shapes and the whole-dashboard shape (step 1).
- `components/SellerDashboard/ui/index.tsx` — `LoadingState` deleted (step 2).
- `components/SellerDashboard/CommentsTab.tsx` — placeholder site.
- `components/SellerDashboard/ExcelUploadTab.tsx` — placeholder site.
- `components/SellerDashboard/GalleryTab.tsx` — placeholder site.
- `components/SellerDashboard/StoriesTab.tsx` — two placeholder sites.
- `components/SellerDashboard/locations/LocationsTab.tsx` — placeholder site.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — placeholder site.
- `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx` — placeholder site.
- `components/SellerDashboard/useDashboardDetailBack.ts` — the two payload keys
  on the back journey only; corrected comment (steps 11, 13).
- `components/global/InFlowPageLoader.tsx` — the `is_seller_dashboard` branch
  (step 12).
- `components/global/NavigationLoaderGate.tsx` — `enterOverlay` skipped only on
  an explicit `no_overlay_scroll` (step 10).

Plus five new test files, all declared in the plan.

`components/ModalRoute/overlayScroll.ts` was **not** touched, as revision 4
requires.

## Deviations from plan

Two, both in the tests and both recorded rather than smoothed over.

1. **`AC-9`'s test was rewritten after it failed to confirm the bug.** The first
   version used `renderWithProviders`, which wraps the mount in `act` — so the
   fetch effect had already set `loading` to `true` before the first assertion
   could look, and the test **passed against the unfixed code**. That is the
   repo's "passes both before and after" case, so it never covered `AC-9`. It now
   uses `renderToStaticMarkup`, which never runs effects, so what it asserts on is
   genuinely the first paint. Seen red after the change, green after the fix.
2. **`AC-12` was carried out as `existing`, writing nothing** — as revision 4's
   Tests table declares, because `overlayScroll.ts` is unchanged. The eight cases
   in `tests/components/ModalRoute/overlayScroll.test.ts` were re-run and are
   green.

No deviation in the source: every step was carried out as written.

## Tests written

| AC | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `shows a product created while the list already had products` | new |
| AC-2 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `shows an edited product's new values after returning` | new |
| AC-3 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `shows a boutique created while the list already had boutiques` | new |
| AC-4 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `shows an edited boutique's new values after returning` | new |
| AC-5 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `drops a deleted boutique after returning` | new |
| AC-6 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `asks the core backend once per arrival, not once per tab switch` | new |
| AC-7 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `never says the shop has no products before the request comes back` | new |
| AC-8 | `tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx` | `draws placeholder blocks and no spinner` (×6 shapes) + `the whole-dashboard shape keeps the page tall` | new |
| AC-9 | `tests/app/sellerProfile/shopListFirstPaint.test.tsx` | `paints its placeholder, not an empty state, before any effect runs` | new |
| AC-10 | `tests/components/global/InFlowPageLoader.test.tsx` | `shows the dashboard shape for a seller-dashboard back navigation` + `does not show it for the forward click into an editor` | new |
| AC-11 | `tests/components/global/NavigationLoaderGate.test.tsx` | `leaves the scroll alone when the navigation says it is not an overlay` + `still runs the overlay scroll handling when the navigation says nothing` | new |
| AC-12 | `tests/components/ModalRoute/overlayScroll.test.ts` | the eight existing cases | **existing** — nothing written; `overlayScroll.ts` is unchanged |
| AC-13 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `waits rather than refusing while permissions are still on the way` + `refuses a section the seller really may not see` + `reads a failed permission fetch as an error, not as a refusal` | new |
| AC-14 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `shows the error and lets a retry replace it with the list` + `retries a failed arrival fetch on the next arrival` | new |
| AC-15 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `shows the empty message once the request has answered` | new |
| AC-16 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | `does not let the roles list finishing make the change-role list say it is empty` | new |
| AC-17 | `tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx` | `is hidden from assistive technology, inside a region that reports busy` (×6 shapes) | new |
| AC-18 | `tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx` | `is built from the one shared placeholder block` (×6 shapes) | new |

Every row was carried out. No test was written that the plan did not name.

### Seen red before the fix

The repo requires the confirming test to be seen failing against the unfixed
code. Done by stashing the source change and re-running, three times:

1. **The list and permission fixes** — `page.tsx`, `SellerProfileContext.tsx` and
   `ui/index.tsx` reverted: **9 failures**, each with its own message —
   `AC-1`, `AC-2`, `AC-3`, `AC-4`, `AC-5`, `AC-6` ("a second arrival did not
   re-request the list (still 1 call(s))"), `AC-7`, and both `AC-13` cases.
2. **The scroll fix** — `NavigationLoaderGate.tsx` reverted: `AC-11` failed with
   "pressing back into the seller dashboard moved the window from 4200 to 0".
3. **The loader-shape fix** — `InFlowPageLoader.tsx` reverted: `AC-10` failed with
   "a back navigation to the seller dashboard did not get the dashboard shape".
4. **`AC-9`** — `SellerProfileContext.tsx` reverted: failed with "the shop list's
   first paint has no placeholder in it". This is the rewritten test; the first
   version passed here, which is why it was rewritten.

`AC-8`, `AC-17` and `AC-18` cover a component that did not exist before, so they
are new-behaviour tests rather than bug confirmations. `AC-15` and the first
`AC-14` case are guards, green before and after, as the plan declared.

## Findings — confirmed bugs, out of scope

none

No test written here proved existing behaviour wrong in a file outside
`plan.md > Files to change`. The one wrong-behaviour case found during
implementation was in a **test**, not in the application — `AC-9`'s first version
could not see the bug it claimed to cover — and it is recorded under Deviations
above, not as a `BUG-n`.

## Validation run during implementation

Profile `full`, plus the three checks the plan added.

- `node_modules/.bin/tsc --noEmit --pretty false` — **pass**, no output.
- `pnpm lint:i18n-parity` — **pass**, "2171 keys present in all three files".
- `pnpm lint` — **pass**, exit zero. 76 warnings, all pre-existing; the only one
  in a changed file is `page.tsx:713` (`window.location.href` in `leaveShop`),
  which this change does not touch.
- `pnpm test:run` (`vitest run --project unit`) — **pass**, 138 files, 2235
  passed, 7 skipped. No regression anywhere in the suite.
- `pnpm build` — **pass**, production build completed.
- Plan check 1 — `SellerDashboardLoader.tsx` has **zero** import statements, so
  nothing from `components/SellerDashboard/**` reaches the app-wide chunk.
- Plan check 2 — `setLoading(` in the dashboard page: **0**.
- Plan check 3 — `permissionsLoading` in the dashboard page: **0**.
