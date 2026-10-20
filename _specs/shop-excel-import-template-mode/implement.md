---
ticket: shop-excel-import-template-mode
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-10-17
links:
  clickup:
  github:
---

# Implement — shop-excel-import-template-mode

> Record of what was actually built, following `plan.md` and the follow-ups in
> `review.md`.

Branch: `ticket/shop-excel-import-template-mode`, created from `development` at
`2dd40b8e` (equal to `origin/development`). The owner ran `/wf:next`, which per
the saved branch rule allows the implement stage to branch.

## Changes made

- `shop-excel-template-mode.md` → `docs/shop-excel-template-mode.md` — moved into
  tracked docs (step 1, AC-28). Stack names replaced with role names (F-5): the
  Auth row, the Backend code row (controller path and backend test paths
  dropped), and "Passport token" (line 38). `grep -niE "laravel|passport|\.php"`
  finds nothing.
- `public/translations/translations.{ar,tr,ku}.js` — 22 new keys, the same in all
  three files (step 2, AC-27). Every key was checked in both forms (quoted and
  unquoted) first; none existed, `Yes` / `No` included.
- `utils/fetchData.ts` — one early return next to the RDB cart-lock branch: a
  `409` whose `data.category_mismatch === true` goes back as
  `{ ...body, success: false, httpStatus: 409 }`, with no toast and no `LogError`
  (step 3, AC-23). Field match kept (F-7).
- `services/sellerDashboard/index.ts` (step 4):
  - new module-level private helper `downloadShopFile(sellerId, targetUrl,
    fallbackName, errorText)`, holding the old proxy call, the one 401 exchange,
    the JSON-as-error read and the blob/name return. The error text is per caller
    (F-2): "Failed to download template" / "Failed to download the failed rows";
  - `downloadExcelTemplate(sellerId, categoryId, mode, fallbackName)` — `mode` is
    required and goes into the target as `?mode=`;
  - new `downloadFailedRows(sellerId, uploadedFileId, fallbackName)` →
    `/shop/excel/failedRows/<id>`;
  - `processExcel(sellerId, url, options = {})` — adds `expected_category_id` /
    `confirm_category` only when set.
- `components/SellerDashboard/ExcelUploadTab.tsx` (step 5):
  - types: `level`, `products_count`, `failed_rows_count`;
    `EXCEL_STATUS.COMPLETED_WITH_ERRORS`; `ExcelMode`;
  - category block: products-only checkbox with the count, search box, filtered
    native `<select>`; level indent with non-breaking spaces; `(N Products)`
    label; "No categories match". The picked option stays drawn **during a
    search** only. The checkbox still clears a hidden pick (F-4);
  - choice block: a `fieldset` with two radios. Each radio's name is its title
    (`aria-labelledby`), and its explanation is linked with `aria-describedby`.
    "Update my products" is disabled with no category or a count of 0, with the
    hint;
  - the FR-7 reset happens in the event handlers (category change, checkbox),
    not in an effect. A derived `effectiveMode` guards render and requests (F-3);
  - remember: `bulk-import:shop:<sellerId>`. The choice is restored on every
    successful category load, with category, box and choice set in one update.
    Nothing is written until this seller's stored choice has been read
    (`restoredFor === sellerId`), so the defaults never overwrite a stored choice
    and one seller's choice never reaches another's key (F-3). Only
    `"products"` restores as products; anything else is `"template"` (F-6).
    Every storage call is in `try/catch`;
  - download button label "Download empty template" / "Download {count}
    products"; busy label "Preparing file..."; file names built by the tab;
  - failed rows: "Download {count} failed rows" when `failed_rows_count > 0`,
    with the tooltip; reminder or error in an `InlineAlert` above the table;
  - status badge `completed_with_errors`: its own orange colour and the
    translated label;
  - upload: sends the picked category. A `409` with `category_mismatch` opens
    a confirm dialog (`role="dialog"`, `aria-modal`, focus on **Yes**, `Escape`
    or backdrop = **No**). **Yes** resends with `confirmCategory: true` and
    does not upload the file again. **No** shows the cancel text in an amber
    status box.
- `tests/e2e/selectors.ts` — `sellerExcel.modeTemplate` (step 7).
- `tests/e2e/actions/sellerExcel.ts` — `openExcelSection` removes the remembered
  key with an init script before the page's own scripts run (F-1, accepted).
  `downloadTemplate` ticks "Add new products", captures the `x-proxy-url` of the
  download request, and returns it as `proxyUrl`.
- `tests/e2e/sellerDashboard.live.spec.ts` — SD-16 has a new step "the download
  asked the core backend for the empty template (mode=template)". The first
  step's message now says "the download button".
- `docs/features/H-seller-dashboard/SL-12-bulk-upload-excel.md` — rewritten for
  the new flow (step 8, AC-29). It links the contract, and its "Last verified"
  line names this branch and date.

## Changes prepared (uncommitted)

No commit was made (IM-9). Working tree on `ticket/shop-excel-import-template-mode`:

- `docs/shop-excel-template-mode.md` (new — moved from the repo root)
- `docs/features/H-seller-dashboard/SL-12-bulk-upload-excel.md`
- `public/translations/translations.ar.js`, `translations.tr.js`, `translations.ku.js`
- `utils/fetchData.ts`
- `services/sellerDashboard/index.ts`
- `components/SellerDashboard/ExcelUploadTab.tsx`
- `tests/components/SellerDashboard/ExcelUploadTab.test.tsx`
- `tests/services/sellerDashboard/updateShopInfoBody.test.ts`
- `tests/utils/fetchData.test.ts`
- `tests/e2e/selectors.ts`
- `tests/e2e/actions/sellerExcel.ts`
- `tests/e2e/sellerDashboard.live.spec.ts`
- `_specs/shop-excel-import-template-mode/**` (workflow artifacts)

## Deviations from plan

1. **One more translation key: "Failed to download the failed rows".** It is the
   tab's fallback message when a failed-rows refusal carries no message, and the
   service's default error text for that call. Both come from review follow-up
   F-2, inside files the plan lists. The key is in all three files.
2. **Badge colour.** The plan said amber (`#fbf6e6` / `#b8860b`) with a border.
   That is the `processing` colour with only a border added. FR-18 asks for "its
   own badge colour", so I used orange (`bg-[#fff4e8] text-[#e07b00]`). The
   failed-rows button uses the same orange.
3. **The radios' accessible name.** The plan did not say how to name the radios.
   Because the `<label>` wraps both the title and the explanation, the name took
   both. Each radio now has `aria-labelledby` (its title) plus
   `aria-describedby` (its explanation). This serves NFR-2.
4. **AC-23 tab case split in two.** The planned case `sends the picked category
   with the upload, and none when no category is picked` is two cases:
   `sends the picked category with the upload` and
   `sends no expected category when no category is picked`. One upload per case.
   Same file, same assertions.
5. **AC-15 has a second case** (review follow-up F-3): `restores a choice that
   was stored before the tab opened`. It mounts a fresh tab over a key that is
   already stored, and checks that opening does not overwrite it.
6. **AC-16 case carries the F-6 check** (an unknown stored `mode` restores as
   "Add new products") inside the planned case.
7. **The existing `downloadExcelTemplate` service block** was renamed from
   "seller-dashboard service — downloadExcelTemplate" to "seller-dashboard
   service — Excel file downloads", because the failed-rows cases live in it too
   (shared `response` helper). Its 8 calls take the new arguments; target
   and fallback-name assertions were updated to `?mode=template` and the given
   name. No assertion was removed or loosened (F-2).
8. **The setup in the tab test file** now clears `localStorage` in `beforeEach`.
   Without this, one test's remembered choice would leak into the next.

## Tests written

"Tab" = `tests/components/SellerDashboard/ExcelUploadTab.test.tsx`;
"Service" = `tests/services/sellerDashboard/updateShopInfoBody.test.ts`;
"fetchData" = `tests/utils/fetchData.test.ts`.

Red-first: every new or changed unit case below was run **before** its code and
seen red, then green after. The runs:
- fetchData: 1 failed (the toast fired), then 96/96 passed;
- Service: 8 failed / 105 passed, then 113/113 passed;
- Tab: 31 failed / 25 passed, then 56/56 passed.

The one tab case that was green before is AC-26. It guards behaviour that
already existed, which is intended.

| AC   | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | Tab | `shows "(N Products)" after a category the seller has products in, and nothing for an empty one` | extend — red → green |
| AC-2 | Tab | `indents sub categories one step and sub-sub categories two steps` | extend — red → green |
| AC-3 | Tab | `the search box keeps only categories whose path matches, in any letter case` | extend — red → green |
| AC-4 | Tab | `"only categories that have my products" hides the empty ones and says how many are left` | extend — red → green |
| AC-5 | Tab | `the products-only box cannot be ticked when the seller has no products anywhere` | extend — red → green |
| AC-6 | Tab | `ticking the products-only box clears a picked category that has no products` | extend — red → green |
| AC-7 | Tab | `offers "Add new products" and "Update my products", with "Add new products" chosen first` | extend — red → green |
| AC-8 | Tab; Service | Tab: `"Add new products" asks for the empty template, even for a category with products`; adjusted `asks the backend for the template of the picked category`. Service: `downloadExcelTemplate puts the mode in the address it asks the proxy for`; adjusted `asks the proxy for the template with the shop, country and language` | extend — red → green |
| AC-9 | Tab; Service | Tab: `"Update my products" asks for the seller's products of the category`. Service: same case as AC-8 (both modes) | extend — red → green |
| AC-10 | Tab | `"Update my products" is off with no category, and off with a hint for a category with no products` | extend — red → green |
| AC-11 | Tab | `picking a category with no products moves the choice back to "Add new products"` | extend — red → green |
| AC-12 | Tab | adjusted `cannot be downloaded before a category is picked`; new `the button says "Download empty template" or "Download N products"` | extend — red → green |
| AC-13 | Tab | adjusted `says why the template could not be prepared` (button name only; same assertion) | extend — red → green |
| AC-14 | Tab; Service | Tab: `saves the downloaded file under an .xlsx name`. Service: adjusted `uses the default country and language, and the name it is given, when none come back` (tests the private helper through `downloadExcelTemplate`, F-2) | extend — red → green |
| AC-15 | Tab | `remembers category, box and choice for this seller, and not for another seller`; `restores a choice that was stored before the tab opened` (F-3) | extend — red → green |
| AC-16 | Tab | `does not restore a category that is gone, nor "Update my products" for a category now empty` (incl. F-6) | extend — red → green |
| AC-17 | Tab | `still works when the browser refuses to store or read the remembered choice` | extend — red → green |
| AC-18 | Tab | `offers "Download N failed rows" only for a sheet with failed rows` | extend — red → green |
| AC-19 | Tab; Service | Tab: `downloads the failed rows of the sheet that was clicked`. Service: `downloadFailedRows asks the proxy for that upload's failed rows`, `downloadFailedRows renews the session once on a 401 and asks again` (NFR-4) | extend — red → green |
| AC-20 | Tab | `after the failed rows download, reminds the seller how to upload the file again` | extend — red → green |
| AC-21 | Tab | `shows the backend's words when the failed rows cannot be downloaded` | extend — red → green |
| AC-22 | Tab | `shows "Completed with errors" in its own colour` | extend — red → green |
| AC-23 | fetchData; Tab; Service | fetchData: `hands a category-mismatch 409 back without a toast or an error report`. Tab: `sends the picked category with the upload`, `sends no expected category when no category is picked`, `asks before importing a file made for another category, without showing an error`. Service: `processExcel sends the expected category only when it is given` | extend — red → green |
| AC-24 | Tab; Service | Tab: `"Yes" imports the file into its own category without uploading it again`. Service: `processExcel sends confirm_category when asked to` | extend — red → green |
| AC-25 | Tab | `"No" cancels the import and sends nothing more` | extend — red → green |
| AC-26 | Tab | `a 409 that is not about the category is shown as an error, as before` | extend — green before and after (guards existing behaviour) |
| AC-27 | — | `pnpm lint:i18n-parity` (exit 0, "2578 keys present in all three files"); lint of the changed files (0 errors). The full `pnpm lint` runs at `/verify` in profile `full`. | none — checks |
| AC-28 | — | the file is under `docs/`, and the repo root has no copy; checked at `/verify` | none — docs-only |
| AC-29 | — | SL-12 rewritten; read at `/verify` | none — docs-only |
| AC-30 | `tests/e2e/sellerDashboard.live.spec.ts` (+ `tests/e2e/actions/sellerExcel.ts`, `tests/e2e/selectors.ts`) | SD-16 step `the download asked the core backend for the empty template (mode=template)` | extend — written; **not run here** (needs staging). `/verify` runs it: `pnpm e2e:health`, then `pnpm test:e2e:live --lane=account -g "SD-16"` |
| AC-31 | Tab | all 28 existing cases still present. Five were adjusted only in call shape or label (the AC-8, AC-12, AC-13 cases and the upload case's `processExcel` third argument `{}`) | existing — green |

## Findings — confirmed bugs, out of scope

none

## Validation run during implementation

- `pnpm vitest run --project unit tests/components/SellerDashboard/ExcelUploadTab.test.tsx tests/services/sellerDashboard/updateShopInfoBody.test.ts tests/utils/fetchData.test.ts` — 3 files, **265 passed**.
- `pnpm exec next typegen` then `node_modules/.bin/tsc --noEmit --pretty false` — **exit 0**, no errors.
- `pnpm exec eslint <the 9 changed source and test files>` — **0 errors**, 2 warnings on lines this change did not touch (`services/sellerDashboard/index.ts:1350` default export; `utils/fetchData.ts:676` `window.location.href`).
- `pnpm lint:i18n-parity` — **exit 0**.
- `pnpm test:run` (whole unit suite) — **exit 0**: 651 files passed; 7527 tests passed, 3 expected fail (the existing `it.fails` BUG markers); 786 s.
- SD-16 (live) — not run here; needs staging. Left for `/verify`.
