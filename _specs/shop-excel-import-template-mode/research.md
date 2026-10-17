---
ticket: shop-excel-import-template-mode
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-10-17
links:
  clickup:
  github:
---

# Research — shop-excel-import-template-mode

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Use the five new Shop API Excel features (contract: `shop-excel-template-mode.md`)
in the seller dashboard's "Upload Excel File" tab: product counts per category, a
template-or-products download, the failed-rows download, and the category
mismatch check on upload.

## Relevant directories

- `components/SellerDashboard/ExcelUploadTab.tsx` (602 lines) — the whole tab.
  One client component: category `<select>` (line 336), "Download Template"
  button (line 358), drop zone, upload button, and the "Uploaded Excel Files"
  table (line 462) with a Notes modal. Every UI change in this ticket lands here.
- `services/sellerDashboard/index.ts` lines 688–845 — the five Excel service
  methods:
  - `getExcelCategories(sellerId)` (line 693) — `fetchData`, `GET /shop/excel/categories`.
  - `downloadExcelTemplate(sellerId, categoryId)` (line 708) — **does not use
    `fetchData`**, because `fetchData` always parses JSON. It posts to
    `/api/proxy` directly with `x-proxy-url: /shop/excel/downloadExcel/<id>`,
    repeats the 401 exchange by hand (`RefreshSession`, commit `5c24acbd`),
    reads a JSON body as an error, and returns `{ blob, filename }`.
  - `processExcel(sellerId, url)` (line 775) — `fetchData`, `POST`, body
    `{ file_url }` only.
  - `uploadExcelFile(file)` (line 788) — the media server, not the Shop API.
    Not affected.
  - `getExcelFiles(sellerId)` (line 836) — `fetchData`,
    `GET /shop/excel/getUploadedExcelFiles`. Uses `REQUESTS_DATA.PROCESS_EXCEL`
    as its request title (copy-paste; harmless, noted only).
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` —
  mounts `ExcelUploadTab` as the `excel` tab. No change expected.
- `components/SellerDashboard/ui/index.tsx` — shared dashboard primitives
  (`DashButton`, `Segmented`, `EmptyState`, `InlineAlert`, `DashField`,
  `dashInputClass`). There is **no** shared searchable select, radio group,
  checkbox or confirm dialog here.
- `components/SellerDashboard/productEdit/sections.tsx` line 318 — a private
  `Select` with a search box (`placeholder={t("Search...")}`, line 403). It is
  not exported. It is the only type-to-filter picker in the dashboard.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` line 1477
  (`ConfirmDialog`) and `components/SellerDashboard/StoriesTab.tsx` line 177
  (`DeleteConfirmModal`) — two private confirm dialogs. Neither is exported.
- `public/translations/translations.{ar,tr,ku}.js` — copy for every new label.
- `tests/components/SellerDashboard/ExcelUploadTab.test.tsx` (579 lines, Vitest)
  — the tab's unit tests (see "Test layout").
- `tests/services/sellerDashboard/updateShopInfoBody.test.ts` line 182 — a table
  row that asserts the exact request `processExcel` sends (`url`, `method`,
  `server`, `sellerId`, `body: { file_url }`).
- `tests/e2e/actions/sellerExcel.ts` + `tests/e2e/sellerDashboard.live.spec.ts`
  line 1044 (SD-16) — the live browser case for the template download.
- `docs/features/H-seller-dashboard/SL-12-bulk-upload-excel.md` — the feature
  doc. It says "Last verified 2026-07-07 (against `develop`)" and describes the
  old three-step flow.

## Relevant config files

- `app/api/proxy/route.ts` — every client call goes through it. Two facts matter:
  - The query string in `x-proxy-url` is kept: the route parses
    `baseUrl + targetUrl` with `new URL` and forwards `resolvedUrl.href`
    (line 316). So `?mode=template` reaches the backend unchanged.
  - For a non-JSON answer it forwards only `Content-Type` and `Cache-Control`
    (lines 442–450). **It does not forward `Content-Disposition`.** So the
    backend's file name (`<CategoryName>_template_<date>.xlsx`,
    `<original>_failed_rows_<date>.xlsx`) never reaches the browser. Today the
    tab falls back to `template-<categoryId>.xlsx`
    (`services/sellerDashboard/index.ts` line 769).
- `utils/server/tokenManager.ts` line 192 — `market-dashboard` goes to the
  **core** backend (`BACKEND_URL`) unless the path is on the gateway list. SD-16
  names the core backend for `/shop/excel/categories`. Line 362 adds
  `X-Seller-ID` from the `sellerId` the caller passes.
- `utils/fetchData.ts` lines 652–836 — how a non-2xx answer reaches the caller.
  This decides how the `409` is handled (see Risks).
- `utils/Requests.ts` lines 283–285 — request titles `GET_EXCEL_CATEGORIES`
  (176), `DOWNLOAD_EXCEL_TEMPLATE` (177), `PROCESS_EXCEL` (178). A new endpoint
  would normally get its own title and code.
- Protected runtime paths (`proxy.ts`, `next.config.ts`, instrumentation,
  `.github/workflows/**`): **none is touched** by this work as far as research
  can see.

## Possibly affected services

- **Core backend, Shop API (`/api/v1/shop/excel/*`)** — the only backend this
  work calls. Five changes, all additive (contract §1).
- **Media server** — not affected. The upload to it and the "Download" link of
  the original file (`buildDownloadUrl`, line 56) stay as they are.
- **`/api/proxy`** — used as is. It changes only if the plan decides to forward
  `Content-Disposition` (OQ-4).
- **`fetchData`** — shared by the whole app. It changes only if the plan decides
  the `409` needs a pass-through like the existing RDB cart-lock one (OQ-3).
- **Sentry** — `fetchData` logs every non-2xx answer with `LogError`. A `409`
  category question would be logged as a backend exception today (OQ-3).

## Current behaviour, compared with the contract

| Contract item | Today in the app | Gap |
|---|---|---|
| `products_count` on categories | `ExcelCategory` type (line 18) has `id`, `display_name`, `name`, `title`. Label is `display_name \|\| name \|\| title \|\| #id` (line 87). | Count not read, not shown, no filter (UI-1, UI-2). |
| `level` on categories | Not read. Native `<select>`, flat list. | No indent (UI-1). |
| Searchable category list (UI-1) | Native `<select data-pw="seller-excel-category">`. Not searchable. | A searchable control is needed. See OQ-2. |
| `mode=template\|products` | `downloadExcelTemplate` sends no `mode`. The backend treats a missing `mode` as `products`. | **Today every "template" download carries the seller's existing rows** when the category has products. Contract §4 says to always send `mode`. |
| Download button label (UI-5) | Fixed text "Download Template" / "Preparing template...". | Needs "Download empty template" / "Download N products". |
| `failed_rows_count` on files | `ExcelFile` type (line 26) has no such field. | No "Download failed rows" button (UI-7, UI-8). |
| `GET /excel/failedRows/{id}` | No service method. | New method. Same binary-through-proxy shape as `downloadExcelTemplate`. |
| `expected_category_id`, `confirm_category` | `processExcel` sends `{ file_url }` only. | Two optional fields (UI-9). |
| `409` category mismatch | `handleUpload` (line 252) throws `response.message` when `success` is false and shows it in the red status box. | Needs a confirm dialog and a resend (UI-10). |
| Upload status `completed_with_errors` | `EXCEL_STATUS` (line 41) knows `uploaded`, `processing`, `completed`, `failed`. The badge shows the raw value. | `completed_with_errors` (contract §7.1 example) gets the grey default badge and shows as raw text. See OQ-6. |

## Test / validation commands available

Not run in this stage.

- `pnpm test:run` — the unit suite (Vitest, `--project unit`, config
  `vitest.config.mts`).
- `pnpm vitest run --project unit tests/components/SellerDashboard/ExcelUploadTab.test.tsx`
  — only the tab's tests.
- `pnpm lint` — ESLint; it also fails on a translation key missing from
  `ar` / `tr` / `ku` (memory "i18n lint enforcement").
- `pnpm lint:i18n-parity` — the three translation files have the same keys.
- `pnpm exec next typegen && pnpm exec tsc --noEmit` — type check (memory "GitHub
  Actions CI": `tsc` needs `next typegen` first).
- `pnpm knip` — unused files and exports.
- `pnpm test:e2e:live` (after `pnpm e2e:health`) — the live browser suite, SD-16
  included. Needs staging up.

## Test layout and naming convention

- **Unit suite:** `tests/` mirrors the source path.
  `components/SellerDashboard/ExcelUploadTab.tsx` →
  `tests/components/SellerDashboard/ExcelUploadTab.test.tsx`;
  `services/sellerDashboard/index.ts` → `tests/services/sellerDashboard/*.test.ts`
  (one file per concern, e.g. `updateShopInfoBody.test.ts`); `utils/fetchData.ts`
  → `tests/utils/fetchData.test.ts`.
- **File name:** `<Unit>.test.tsx` for components, `<concern>.test.ts` for
  services.
- **Runner:** Vitest. Component tests use `renderWithProviders`, `screen`,
  `userEvent` from `tests/render.tsx`. The tab's test file mocks
  `services/sellerDashboard` with one `vi.fn()` per method (lines 13–27). Every
  assertion carries a message.
- **Expected-failure marker:** `it.fails("BUG-<area>-<n>: …")`, e.g.
  `tests/components/SellerDashboard/productEdit/helpers.test.ts` line 571.
- **Browser suite:** `tests/e2e/*.live.spec.ts` with actions in
  `tests/e2e/actions/` and selectors in `tests/e2e/selectors.ts`
  (`sellerExcel.category`, `.download`, `.status`).
- **Existing coverage of this tab (unit):** 8 `describe` blocks, 28 cases —
  category list, template (disabled before a pick; called with
  `(SELLER_ID, "3")`; error text), file choice, upload (media server then shop
  backend; each refusal named), files table, drag, odd rows, notes window.
  Nothing covers `mode`, counts, failed rows or the `409`, because none of it
  exists yet.

## Integration surface found

These parts read the current markup or the current request shape, so a change
to the tab or the service touches them too:

1. **SD-16 (live browser case)** reads the category list with
   `sellerExcel.category(page).locator("option")` and picks with
   `.selectOption(categoryId)` (`tests/e2e/actions/sellerExcel.ts` lines 33–42
   and 63). Both only work on a native `<select>`. If UI-1 replaces the
   `<select>` with a custom searchable list, SD-16 breaks until its helper
   changes. Its step text also says "Download Template".
2. **Unit tests** pick a category with
   `userEvent.selectOptions(screen.getAllByRole("combobox")[0], "3")` and find
   the button by `/Download Template/`. They assert
   `downloadExcelTemplate` was called with exactly `(SELLER_ID, "3")`. Adding a
   `mode` argument changes that call.
3. **`updateShopInfoBody.test.ts` line 182** asserts the `processExcel` body is
   exactly `{ file_url: … }`. Adding `expected_category_id` changes that row.
4. **`fetchData`** is shared by every client call. A new `409` branch there
   reaches the whole app (OQ-3). The existing RDB branch (line 708) shows the
   pattern: it matches on a field in `data` (`rdb_request_reference`), not on
   the status alone.
5. **`/api/proxy`** is shared by every client call. Forwarding
   `Content-Disposition` would change every binary answer (OQ-4).

## Risks and unknowns

- **The `409` takes the generic error path today** — impact high, certain.
  `fetchData` (lines 708–717) passes a `409` back untouched only when
  `data.rdb_request_reference` is set. A category-mismatch `409` instead throws
  inside `fetchData`, which:
  1. shows an error toast with the message (`showErrorNotification`, line 789),
  2. sends a `backend-exception` event to Sentry (`LogError`, line 811),
  3. then returns `{ ...body, success: false, httpStatus: 409 }`.

  So the tab *can* read `data.category_mismatch` from the return value, but the
  seller first sees a red toast and Sentry records a fault for a normal
  question. The plan must decide how to avoid that (OQ-3).
- **A missing `mode` gives products, not a template** — impact medium, certain.
  Contract §4. Today's "Download Template" button already returns the seller's
  rows for any category where they have products. A seller who fills that file
  as "new products" may be updating existing ones instead. The ticket fixes this
  by always sending `mode`. The spec should say this is a behaviour change.
- **Staging may not serve the new API yet** — impact high, unknown. Research did
  not call staging: every Excel endpoint needs a signed-in seller with product
  permission, and research is read-only. If staging lacks the fields, the
  feature shows no counts and no failed-rows button, with no error (OQ-1).
- **The file name from the backend is lost** — impact low, certain. The proxy
  does not forward `Content-Disposition`, so both downloads get a name the
  client invents (OQ-4).
- **Searchable select has no shared component** — impact medium. The only one
  is private to the product editor. Building or extracting one grows the change
  (OQ-2).
- **Translation keys use two forms.** Keys appear both quoted (`"Typing...":`)
  and unquoted (`Confirm:`, `Products:`) in `translations.ar.js`. A
  `grep -F '"<key>":'` check misses the unquoted ones. The spec / plan must
  check both forms before adding a key. Found so far: `Search...`, `Cancel`,
  `Download Template` exist (quoted) in all three; `Confirm` and `Products` exist
  unquoted in `ar` (not yet checked in `tr` / `ku`); none of the new contract
  sentences (UI-1 to UI-10 copy) exist.
- **The contract file is untracked** at the repository root
  (`shop-excel-template-mode.md`). Artifacts that cite it point at a file that
  is not in git (OQ-7).

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does staging already serve all five changes: `products_count`, `mode`, `failed_rows_count`, `GET /excel/failedRows/{id}`, and the `409` with `expected_category_id`? Who confirms it, and how? | The unit tests can mock the API, but SD-16 and any manual check run against staging. If staging is behind, a live check of these ACs cannot pass yet, and the spec must say so. |
| OQ-2 | UI-1 asks for a searchable category list. Keep the native `<select>` (with level indent and the count in the label, no search), extract the private `Select` from `productEdit/sections.tsx` into a shared component, or build a small searchable list inside `ExcelUploadTab.tsx`? | Decides the size of the change, and whether SD-16's helper (`selectOption`, `locator("option")`) and the unit tests' `selectOptions` must change. |
| OQ-3 | How does the category-mismatch `409` reach the tab without a red toast and a Sentry event? (a) add a `category_mismatch` pass-through in `utils/fetchData.ts` next to the RDB one, (b) call the endpoint outside `fetchData`, or (c) accept the toast and the Sentry event. | `fetchData` is shared by the whole app; (a) touches a hot path, (b) duplicates the 401 handling like `downloadExcelTemplate` does, (c) shows the seller an error for a normal question. |
| OQ-4 | Should the downloads keep the backend's file name? That needs `/api/proxy` to forward `Content-Disposition`. Or does the client build the name (e.g. `<category>_template.xlsx`, `<original>_failed_rows.xlsx`)? | Forwarding changes a route every client call uses. Building the name keeps the change inside the tab and the service. |
| OQ-5 | Is UI-6 ("remember the last choice" in `localStorage` under `bulk-import:shop:<sellerId>`) in scope? The contract marks it optional. | Adds storage, restore rules and their tests. Leaving it out keeps the change smaller. |
| OQ-6 | Should the files table learn the `completed_with_errors` status (its own badge colour and a readable, translated label)? The contract uses it in §7.1, but no UI item asks for it. | Today it shows as grey raw text `completed_with_errors`, next to the new "Download failed rows" button. Scope decision. |
| OQ-7 | Where does the contract live for this ticket? Move `shop-excel-template-mode.md` under `docs/` (for example next to `SL-12`), or keep it at the root untracked? | Spec, plan and verify cite it. An untracked file can disappear, and then the ACs lose their source. |
| OQ-8 | Should `docs/features/H-seller-dashboard/SL-12-bulk-upload-excel.md` be updated in this ticket to describe the new flow? | The feature doc becomes wrong the moment this ships (it says "download its template", three steps, four statuses). |
| OQ-9 | Which items in contract §9 belong to the front end? Some check the backend's file content ("holds exactly those rows with a Reason column", "uploading the fixed file imports the rows", "exactly N product rows, only this seller's"). | The spec must not declare a front-end test for a backend property. Those items become backend checks or are out of scope. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No protected runtime path was read for change; `app/api/proxy/route.ts` and
  `utils/fetchData.ts` were read only to see how the answers reach the tab.
