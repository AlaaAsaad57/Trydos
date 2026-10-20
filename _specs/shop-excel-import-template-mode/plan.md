---
ticket: shop-excel-import-template-mode
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-10-17
links:
  clickup:
  github:
---

# Plan — shop-excel-import-template-mode

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

All UI work stays inside the existing tab component. The Excel service learns the
new parameters, plus one new download method. Nothing new is shared across the
dashboard.

- **Category list (OQ-2).** Keep the native `<select>`, and add a search box and
  the checkbox above it. The box and the checkbox filter which `<option>`s are
  drawn. Level indent is a leading run of non-breaking spaces in the option text,
  because an `<option>` cannot take padding in every browser. The native control
  keeps keyboard and screen-reader support for free (NFR-2). SD-16's
  `selectOption` and the unit tests' `selectOptions` keep working, so the live
  helper needs no new picker logic. Two alternatives were rejected:
  - extracting the product editor's private `Select` would touch a second
    feature;
  - a custom listbox would need its own keyboard handling and would break SD-16.
- **The mismatch `409` (OQ-3).** `fetchData` gets one more early return, next to
  the RDB cart-lock one: a `409` whose `data.category_mismatch` is `true` goes
  back as `{ ...body, success: false, httpStatus: 409 }`. There is no toast and no
  `LogError`. The match is on the field, not the status, so every other `409`
  keeps today's path (FR-23).
- **File names (OQ-4).** The client builds them. `/api/proxy` is not touched.
  - The template is `<category name>_template.xlsx` or
    `<category name>_products.xlsx`.
  - The failed rows are `<original name without extension>_failed_rows.xlsx`.
  - Characters that are not allowed in a file name (`\ / : * ? " < > |`) become
    `_`.
  - The service still reads `Content-Disposition` first, so the backend's own
    name wins if the proxy ever forwards it.

## Steps

Every new or changed unit case is run and **seen red** before the code it covers
is written, and then seen green.

1. **Docs.**
   - Move `shop-excel-template-mode.md` from the repo root to
     `docs/shop-excel-template-mode.md`. This sits next to
     `docs/shop-seller-carts-apis.md`, the precedent.
   - While moving it, apply the stack-naming rule in CLAUDE.md:
     - the **Auth** row becomes "Bearer token from the core backend, guard
       `auth:api`";
     - the **Backend code** row drops the controller file path and keeps the
       method names under "core backend".
   - No other content changes (AC-28).
2. **Translations.** Check every new key in all three files, in **both** forms:
   quoted (`"<key>":`) and unquoted (`<key>:`). Reuse a key that exists, and add a
   missing one to `ar`, `tr` and `ku` in the same edit. The keys are listed under
   "Copy" below.
3. **`fetchData` pass-through.** First add the red case to
   `tests/utils/fetchData.test.ts`, then the early return (AC-23).
4. **Service** (`services/sellerDashboard/index.ts`):
   - Pull the body of `downloadExcelTemplate` into a private helper,
     `downloadShopFile(sellerId, targetUrl, fallbackName)`. The helper keeps the
     proxy call, the one 401 exchange (NFR-4), the JSON-as-error read, and the
     blob/name return.
   - `downloadExcelTemplate(sellerId, categoryId, mode, fallbackName)` — `mode`
     is `"template" | "products"`. It is required, so no call can leave it out
     (FR-6). It targets `/shop/excel/downloadExcel/<id>?mode=<mode>`.
   - New `downloadFailedRows(sellerId, uploadedFileId, fallbackName)` targets
     `/shop/excel/failedRows/<id>`. It needs no request title: like the
     template download, it calls the proxy directly, not through `fetchData`.
   - `processExcel(sellerId, url, options?)` — `options` is
     `{ expectedCategoryId?: number | string; confirmCategory?: boolean }`. A
     field is added to the body only when it is set (FR-19).
5. **Tab** (`components/SellerDashboard/ExcelUploadTab.tsx`):
   - **Types:**
     - `ExcelCategory` gets `level?: number` and `products_count?: number`.
     - `ExcelFile` gets `failed_rows_count?: number`.
     - `EXCEL_STATUS` gets `COMPLETED_WITH_ERRORS: "completed_with_errors"`.
   - **New state:** `search`, `onlyWithProducts`,
     `mode: "template" | "products"`, `pendingMismatch` (the uploaded file key
     plus both category names), `failedRowsBusy` (the file id being downloaded),
     and `tableNotice` (the reminder or the error shown in the table card).
   - **Category block:**
     - search input (`data-pw="seller-excel-search"`);
     - checkbox (`data-pw="seller-excel-only-with-products"`), with the count
       of categories that have products;
     - the filtered `<select>`. The selected option is always kept in the list,
       so typing never loses the selection (edge case). "No categories match"
       shows when the filter leaves nothing else;
     - option label: indent + `display_name`, plus ` (N Products)` when the count
       is above 0.
   - **Choice block:**
     - two radio inputs in a `fieldset` with a `legend` "What do you want to
       do?". Each has an explanation (`data-pw="seller-excel-mode-template"` /
       `-mode-products`);
     - "Update my products" is disabled with no category or a count of 0. The
       hint shows in the count-0 case;
     - an effect switches the choice back to `template` when "Update my
       products" becomes disabled (FR-7).
   - **Checkbox rule:** when the checkbox hides the selected category, the
     selection clears (FR-4).
   - **Download button:** label "Download empty template", or "Download {count}
     products". Calls `downloadExcelTemplate(sellerId, id, mode, fallbackName)`.
   - **Remember (UI-6):**
     - one `localStorage` key, `bulk-import:shop:<sellerId>`, holding
       `{ categoryId, onlyWithProducts, mode }`;
     - written when any of the three changes. Read once, after the categories
       load, with the FR-12 restore rules;
     - every storage call sits in `try/catch` (FR-13).
   - **Failed rows:** the table's Actions cell gets "Download {count} failed rows"
     when `failed_rows_count > 0`, with
     `title="Fix these rows and upload the file again"`. On success the table
     card shows the reminder in an `InlineAlert` with `tone="success"`. On
     refusal it shows the backend message with `tone="error"`.
   - **Status badge:** `completed_with_errors` gets the amber badge
     (`bg-[#fbf6e6] text-[#b8860b]` with a border, so it differs from
     `processing`). Its label is `translateFunction("Completed with errors")`.
     The four other statuses keep their raw label (spec Out of Scope).
   - **Upload:**
     - `processExcel(sellerId, key, { expectedCategoryId: selectedCategory || undefined })`;
     - on `httpStatus === 409 && data?.category_mismatch`, it stores
       `pendingMismatch` and stops;
     - a small confirm modal, built like the existing Notes modal
       (`role="dialog"`, `aria-modal`, focus on **Yes**, `Escape` = **No**),
       shows the translated question with both names;
     - **Yes** calls `processExcel` again with the same key and
       `confirmCategory: true`, then runs the normal success / error path;
     - **No** sets the status box to "Upload cancelled. Nothing was imported."
       with a neutral (amber) style. The chosen file stays chosen.
6. **Unit tests.** Write or adjust the cases in the Tests table. Each new case
   is seen red before its code.
7. **Live case.**
   - Add `modeTemplate` to `sellerExcel` in `tests/e2e/selectors.ts`.
   - `downloadTemplate` in `tests/e2e/actions/sellerExcel.ts`:
     - ticks "Add new products" explicitly, because a remembered choice from
       an earlier run in the same profile must not change the case;
     - catches the `/api/proxy` request whose `x-proxy-url` header targets
       `downloadExcel`;
     - returns that header as `proxyUrl` in `TemplateDownload`.
   - SD-16 asserts `mode=template` in it (AC-30).
8. **SL-12 doc.** Rewrite `docs/features/H-seller-dashboard/SL-12-bulk-upload-excel.md`
   for the new flow, and change its "Last verified" line to the branch and date
   (AC-29).

### Copy (all through `translateFunction`; English is the key)

Interpolated values use the `{name}` placeholder with `.replace(...)`. The repo
already does this: `components/DemoApp1/screens/WalletCashOutSheet.tsx:1636`. A
key is never built by joining strings.

- `Search categories` (placeholder + accessible name)
- `No categories match`
- `Show only categories that have my products`
- `{count} Products` (the option label suffix)
- `What do you want to do?`
- `Add new products`
- `Download an empty template: column headers and lists only, no product rows. Your existing products are not changed.`
- `Update my products`
- `Download your products of this category with their current values, edit them and upload the file. Do not change the Id.`
- `You have no products in this category yet. Use Add new products.`
- `Download empty template`
- `Download {count} products`
- `Download {count} failed rows`
- `Fix these rows and upload the file again`
- `Fix the rows, keep the Id column, and upload this file again. The Reason column is ignored.`
- `Completed with errors`
- `This file is for "{file}", but "{chosen}" is selected. Import it into "{file}"?`
- `Yes`, `No` (reuse if they exist in either form)
- `Upload cancelled. Nothing was imported.`
- `Preparing file...` (the busy label of both downloads; replaces nothing, the old
  `Preparing template...` key stays in the files)

> English shows every word title-cased (`translateFunction` → `titleCaseWords`).
> So the unit tests match these labels with case-insensitive regular
> expressions.

## Files to change

- `shop-excel-template-mode.md` → `docs/shop-excel-template-mode.md` — move the
  contract into tracked docs. Replace the two stack names with role names (AC-28).
- `docs/features/H-seller-dashboard/SL-12-bulk-upload-excel.md` — describe the
  new flow (AC-29).
- `public/translations/translations.ar.js`, `translations.tr.js`,
  `translations.ku.js` — the missing keys from "Copy" (AC-27).
- `utils/fetchData.ts` — one early return for a `409` with
  `data.category_mismatch` (AC-23).
- `services/sellerDashboard/index.ts` — the private `downloadShopFile` helper;
  `mode` on `downloadExcelTemplate`; new `downloadFailedRows`; `options` on
  `processExcel`.
- `components/SellerDashboard/ExcelUploadTab.tsx` — every UI change in step 5.
- `tests/components/SellerDashboard/ExcelUploadTab.test.tsx` — extend: new cases,
  and adjust the existing cases whose call shape or button name changes.
- `tests/services/sellerDashboard/updateShopInfoBody.test.ts` — extend: the
  service request shapes (this file holds the "request each method sends" table,
  including `processExcel` at line 182).
- `tests/utils/fetchData.test.ts` — extend: the `409` pass-through.
- `tests/e2e/selectors.ts` — add `sellerExcel.modeTemplate`.
- `tests/e2e/actions/sellerExcel.ts` — tick "Add new products", and capture the
  download request's target.
- `tests/e2e/sellerDashboard.live.spec.ts` — SD-16 asserts `mode=template`.

No protected runtime path is in this list. `app/api/proxy/route.ts` is not
changed.

## Integration surface

- **Components / shared config touched:**
  - `utils/fetchData.ts`, the client request function every service uses. One
    new branch.
  - `services/sellerDashboard/index.ts` — the template download body moves into
    a helper.
  - `public/translations/*.js` — keys are added, none changed.
  - `localStorage` — one new key, `bulk-import:shop:<sellerId>`.
  - The live helper `tests/e2e/actions/sellerExcel.ts` and
    `tests/e2e/selectors.ts`.
- **Who else depends on them:**
  - Every `fetchData` caller in the app (cart, checkout, chat, stories, seller
    dashboard…). The RDB cart-lock `409` branch is the nearest neighbour and
    must keep working (`tests/utils/fetchData.test.ts` already covers it, around
    line 1795).
  - `downloadExcelTemplate` has one caller, the tab. SD-16 drives it through the
    browser.
  - The translation files are read by the whole app and checked by
    `local/translate-key-exists` (lint) and `pnpm lint:i18n-parity`.
- **Overlapping flows:**
  - The `409` branch sits in the same block as the RDB cart-lock branch. Both
    return early before the `!res.ok` throw. If the new one matched on status
    alone, the "Already paid" `409` (test "still reports a 409 that is not a
    cart lock") and every other `409` would go quiet.
  - The 401 renewal for the downloads (`RefreshSession` with `sentAt`) moves
    into the helper. A wrong move would break the session renewal of the
    template download, which commit `5c24acbd` added.
- **Ordering / lockstep dependencies:**
  - The translation keys must exist before the tab uses them, or lint fails.
  - The service signatures change together with their one caller and the unit
    mocks, in the same change.
  - The SD-16 helper change and the tab's `data-pw="seller-excel-mode-template"`
    land together.
- **What breaks if this is wrong:**
  - A too-broad `fetchData` match hides real `409` errors app-wide: no toast, no
    Sentry event.
  - A broken helper makes "Download" fail for every seller. SD-16 goes red with
    the section's own message.
  - A missing key fails `pnpm lint`.
  - A bad restore rule could pre-select "Update my products" on a category with
    no products. AC-16 covers that.

## Tests

Search done in the layout `research.md` recorded:
- `tests/components/SellerDashboard/ExcelUploadTab.test.tsx` — 28 cases, none
  about counts, mode, failed rows, mismatch, status `completed_with_errors` or
  storage;
- `tests/services/sellerDashboard/*.test.ts` — only the `processExcel` row at
  line 182, body `{ file_url }`;
- `tests/utils/fetchData.test.ts` — `409` cases cover only the RDB lock and a
  plain `409`;
- `tests/e2e/sellerDashboard.live.spec.ts` — SD-16 (no mode check).

"Tab" = `tests/components/SellerDashboard/ExcelUploadTab.test.tsx`;
"Service" = `tests/services/sellerDashboard/updateShopInfoBody.test.ts`;
"fetchData" = `tests/utils/fetchData.test.ts`.

| AC   | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | none — searched Tab (only "lists the categories…", "falls back to the id…") | extend | Tab | `shows "(N Products)" after a category the seller has products in, and nothing for an empty one` |
| AC-2 | none — searched Tab | extend | Tab | `indents sub categories one step and sub-sub categories two steps` |
| AC-3 | none — searched Tab | extend | Tab | `the search box keeps only categories whose path matches, in any letter case` |
| AC-4 | none — searched Tab | extend | Tab | `"only categories that have my products" hides the empty ones and says how many are left` |
| AC-5 | none — searched Tab | extend | Tab | `the products-only box cannot be ticked when the seller has no products anywhere` |
| AC-6 | none — searched Tab | extend | Tab | `ticking the products-only box clears a picked category that has no products` |
| AC-7 | none — searched Tab | extend | Tab | `offers "Add new products" and "Update my products", with "Add new products" chosen first` |
| AC-8 | Tab::`asks the backend for the template of the picked category` (no mode) | extend | Tab; Service | Tab: `"Add new products" asks for the empty template, even for a category with products`; Service: `downloadExcelTemplate puts the mode in the address it asks the proxy for` |
| AC-9 | none — searched Tab, Service | extend | Tab; Service | Tab: `"Update my products" asks for the seller's products of the category`; Service: same case as AC-8 (both modes) |
| AC-10 | none — searched Tab | extend | Tab | `"Update my products" is off with no category, and off with a hint for a category with no products` |
| AC-11 | none — searched Tab | extend | Tab | `picking a category with no products moves the choice back to "Add new products"` |
| AC-12 | Tab::`cannot be downloaded before a category is picked` (old label) | extend | Tab | adjust that case to the new label, and add `the button says "Download empty template" or "Download N products"` |
| AC-13 | Tab::`says why the template could not be prepared` | extend | Tab | adjust that case to the new button name; same assertion (the backend's own words, no file) |
| AC-14 | none — searched Tab, Service | extend | Tab; Service | Tab: `saves the downloaded file under an .xlsx name`; Service: `downloadShopFile falls back to the name it is given when no file name comes back` |
| AC-15 | none — searched Tab | extend | Tab | `remembers category, box and choice for this seller, and not for another seller` |
| AC-16 | none — searched Tab | extend | Tab | `does not restore a category that is gone, nor "Update my products" for a category now empty` |
| AC-17 | none — searched Tab | extend | Tab | `still works when the browser refuses to store or read the remembered choice` |
| AC-18 | none — searched Tab | extend | Tab | `offers "Download N failed rows" only for a sheet with failed rows` |
| AC-19 | none — searched Tab, Service | extend | Tab; Service | Tab: `downloads the failed rows of the sheet that was clicked`; Service: `downloadFailedRows asks the proxy for that upload's failed rows` + `downloadFailedRows renews the session once on a 401 and asks again` (NFR-4) |
| AC-20 | none — searched Tab | extend | Tab | `after the failed rows download, reminds the seller how to upload the file again` |
| AC-21 | none — searched Tab | extend | Tab | `shows the backend's words when the failed rows cannot be downloaded` |
| AC-22 | Tab::`colours each processing status and shows a dash for a missing value` (four statuses) | extend | Tab | `shows "Completed with errors" in its own colour` |
| AC-23 | fetchData::`still reports a 409 that is not a cart lock` (opposite case); none for the mismatch | extend | fetchData; Tab; Service | fetchData: `hands a category-mismatch 409 back without a toast or an error report`; Tab: `sends the picked category with the upload, and none when no category is picked` + `asks before importing a file made for another category, without showing an error`; Service: `processExcel sends the expected category only when it is given` |
| AC-24 | none — searched Tab, Service | extend | Tab; Service | Tab: `"Yes" imports the file into its own category without uploading it again`; Service: `processExcel sends confirm_category when asked to` |
| AC-25 | none — searched Tab | extend | Tab | `"No" cancels the import and sends nothing more` |
| AC-26 | Tab::`names the shop backend when the sheet was stored but not processed`; fetchData::`still reports a 409 that is not a cart lock` | extend | Tab | `a 409 that is not about the category is shown as an error, as before` |
| AC-27 | none — not a test property | none — checks | — | Proven by `pnpm lint` (`local/translate-key-exists` fails on a key missing from any of the three files), in profile `full`, plus `pnpm lint:i18n-parity`, which `/verify` runs and records separately. Reason: copy presence is a lint property, not a behaviour. |
| AC-28 | none — docs | none — docs-only | — | Checked at `/verify` by `git status` / `git ls-files docs/shop-excel-template-mode.md` and no file at the root. Reason: a file move has no runtime behaviour. |
| AC-29 | none — docs | none — docs-only | — | Read at `/verify` against the AC's five items. Reason: documentation content. |
| AC-30 | `tests/e2e/sellerDashboard.live.spec.ts`::`SD-16 the Excel section downloads a real .xlsx template for a category` (no mode check) | extend | `tests/e2e/sellerDashboard.live.spec.ts` (+ helper `tests/e2e/actions/sellerExcel.ts`) | SD-16 gains the step `the download asked the core backend for the empty template (mode=template)` |
| AC-31 | Tab — the 28 existing cases | existing | Tab | All existing cases, with only the call-shape / label adjustments named in AC-8, AC-12, AC-13 and the upload cases' `processExcel` call (a third argument). No assertion is weakened. |

## Validation strategy

- Validation profile: `full` (lint, typecheck, unit-tests, build).
- Profile source: `pre-existing` — `.claude/project-config.yaml` already carries
  `full`. Not edited.
- Why `full`: the change touches `fetchData` and a service's imports, so a
  client/server boundary break is possible, and only `build` catches that.
- **Two declared checks sit outside the profile**, and `/verify` must run them by
  hand and record their exit codes:
  - `pnpm lint:i18n-parity` (AC-27). `full` does not include `i18n-parity`.
    Lint's `translate-key-exists` already fails on a missing key, so parity is a
    second proof, not the only one.
  - The live case for AC-30: `pnpm e2e:health`, then
    `pnpm test:e2e:live --lane=account -g "SD-16"`. SD-16 is in the account lane
    (`tests/e2e/laneConfig.ts` line 62). It needs staging up. The owner
    confirmed on 2026-10-17 that staging serves the new API. A red SD-16 caused
    by staging is reported as a backend fault, not loosened.
- The focused unit run during implement:
  `pnpm vitest run --project unit tests/components/SellerDashboard/ExcelUploadTab.test.tsx tests/services/sellerDashboard/updateShopInfoBody.test.ts tests/utils/fetchData.test.ts`.
- Red-first evidence: `implement.md` records, for each new case, the failing run
  before the code and the passing run after.
- `/verify` runs the **Tests** table through `full`. All of its commands are
  read-only and deterministic (`vitest run`, `tsc --noEmit`).

## Rollback

- One revert of the ticket's commit restores everything. No data migration, no
  backend change, no env var.
- The only state left behind is the `localStorage` key
  `bulk-import:shop:<sellerId>`. The old tab never reads it, so it is harmless
  after a revert.
- The backend change is backward compatible (contract §1). The old tab keeps
  working against the new API, apart from today's missing-`mode` behaviour.

## Out of scope

- Forwarding `Content-Disposition` in `/api/proxy` (OQ-4: the client builds the
  name).
- A shared searchable select or a shared confirm dialog for the dashboard.
- Translating the four existing status labels.
- Any backend file-content check (spec OQ-9).
- Uploading a file in the live suite.
- The `REQUESTS_DATA.PROCESS_EXCEL` title reused by `getExcelFiles`.

## Deferred questions answered (PL-12)

| OQ | Answer |
|----|--------|
| OQ-2 | Native `<select>` filtered by a search box and the checkbox. Indent is non-breaking spaces. The selected option always stays drawn. SD-16 and the unit tests keep picking with `selectOption(s)`. SD-16's helper only adds an explicit "Add new products" tick and the request capture. |
| OQ-3 | An early return in `fetchData` for `status === 409 && data.category_mismatch === true`, next to the RDB branch. No toast, no `LogError`. Proven by a new red-first case in `tests/utils/fetchData.test.ts`. |
| OQ-4 | The client builds the name: `<category name>_template.xlsx` / `_products.xlsx`, and `<original base name>_failed_rows.xlsx`, with unsafe characters replaced. `/api/proxy` is unchanged. The service still uses `Content-Disposition` when it is present. |

## Traceability

| Requirement | AC | Step |
|---|---|---|
| FR-1, FR-2, FR-3 | AC-1, AC-2, AC-3 | 5 (category block) |
| FR-4 | AC-4, AC-5, AC-6 | 5 (checkbox rule) |
| FR-5..FR-8 | AC-7..AC-12 | 4, 5 (choice block, button) |
| FR-9, FR-10 | AC-13, AC-14 | 4 (helper), 5 |
| FR-11..FR-13 | AC-15..AC-17 | 5 (remember) |
| FR-14..FR-17 | AC-18..AC-21 | 4 (`downloadFailedRows`), 5 (failed rows) |
| FR-18 | AC-22 | 5 (status badge) |
| FR-19..FR-23 | AC-23..AC-26 | 3, 4 (`processExcel`), 5 (upload) |
| FR-24 | AC-27 | 2 |
| FR-25 | AC-28 | 1 |
| FR-26 | AC-29 | 8 |
| FR-3, FR-6, FR-10 | AC-30 | 7 |
| FR-27 | AC-31 | 6 |
| NFR-2 | AC-7, AC-25 (radios in a fieldset; dialog keyboard) | 5 |
| NFR-1 | AC-1 (counts read from the one categories answer; the Tab cases mock a single `getExcelCategories` call) | 5 |
| NFR-3 | none — layout; checked by hand at `/verify` in `ar` at phone width (`/sy-ar/...`) | 5 |
| NFR-4 | AC-19 (Service case `downloadFailedRows renews the session once on a 401 and asks again`; the template download shares the same helper) | 4 |
