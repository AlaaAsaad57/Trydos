# SL-12 — Bulk Upload (Excel)

| | |
|---|---|
| **Feature ID** | SL-12 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-10-17 (against `ticket/shop-excel-import-template-mode`) |
| **Source of truth** | `components/SellerDashboard/ExcelUploadTab.tsx`, `services/sellerDashboard/index.ts` |
| **Backend contract** | [`docs/shop-excel-template-mode.md`](../../shop-excel-template-mode.md) |

---

## What it is

The **Upload Excel File** tab — a way to add or update products in bulk. The seller picks a
category and chooses what to download: an **empty template** (to add new products) or **their own
products of that category** (to update them). They fill in the file and upload it, and the backend
turns it into products. A table shows past uploads, and offers the rows that failed as a file to fix.

## Where it appears

- Inside the seller dashboard → **Upload Excel File** tab.

## Who uses it

**Sellers / shop staff** with `CREATE_PRODUCT` or `UPDATE_PRODUCT` (or `SUPER_ADMIN`).

## How it works (verified behaviour)

- **Pick a category.**
  - Each category shows its full path (`Clothes -> Men -> Shirts`), indented by level.
  - When the seller has products in it, the label adds **"(N Products)"**.
  - The category field is a **searchable dropdown**: opening it shows a search box on top and the
    list under it. The search filters by path; letter case does not matter. It works by keyboard
    (arrows, Enter, Escape).
  - A **"Show only categories that have my products"** box hides the empty ones and shows how many
    are left. It is off when the seller has no products at all. If it hides the picked category, the
    pick is cleared.
- **Choose what to download.**
  - **Add new products** (the default) downloads an **empty template**: headers and lists only, no
    product rows. It is sent as `mode=template`, also for a category that has products.
  - **Update my products** downloads the seller's products of that category, with their current
    values (`mode=products`). It is off when no category is picked or the category has no products,
    with the hint *"You have no products in this category yet. Use Add new products."*
  - The button says **"Download empty template"** or **"Download N products"**.
- **The tab remembers the last choice** (category, box, and choice) for each seller, in the
  browser's `localStorage` under `bulk-import:shop:<sellerId>`. On the next visit it restores them,
  but only a category that still exists, and "Update my products" only when that category still has
  products. If the browser blocks storage, the tab still works with its defaults.
- **Upload the filled file** (drag-drop or file picker). The file goes to the media server first;
  then its address goes to the backend, with the picked category.
- **Category check.** If the file was made for another category than the one picked, the backend
  asks first. The tab shows a question naming both categories:
  - **Yes** imports the file into its own category. The file is not uploaded again.
  - **No** shows *"Upload cancelled. Nothing was imported."*
  - The question is not an error: no error toast, and no Sentry report.
- **No client-side parsing.** The file isn't read in the browser; the backend parses it and creates
  or updates the products.
- **Client validation** is extension-only (`.xlsx/.xls/.xlsm/.xlsb`); there is no size or MIME check.
- **Past uploads table.** It shows each upload with a status badge: uploaded / processing /
  completed / **Completed with errors** (its own colour) / failed. It also has a Notes window with
  the backend's processing notes.
- **Failed rows.** An upload with rows that were not imported shows **"Download N failed rows"**.
  The file holds only those rows, with a Reason column. After the download the tab reminds the seller
  to fix the rows, keep the Id column, and upload the file again (the Reason column is ignored).

## Data source

| Item | Value |
|------|-------|
| Categories | `getExcelCategories` → **GET `/shop/excel/categories`** (each with `level` and `products_count`) |
| Template / products file | `downloadExcelTemplate(sellerId, categoryId, mode, fallbackName)` → **GET `/shop/excel/downloadExcel/{categoryId}?mode=template\|products`** (streamed `.xlsx`, routed via `/api/proxy`) |
| Failed rows file | `downloadFailedRows(sellerId, uploadedFileId, fallbackName)` → **GET `/shop/excel/failedRows/{uploadedFileId}`** (streamed `.xlsx`, routed via `/api/proxy`) |
| Upload file | `uploadExcelFile(file)` → **POST `{MEDIA_SERVER}/upload/excel?folder=excel`** (`x-api-key`) |
| Process | `processExcel(sellerId, fileUrl, { expectedCategoryId, confirmCategory })` → **POST `/shop/excel/processExcel`** (`{file_url, expected_category_id?, confirm_category?}`; `409` with `data.category_mismatch` asks the question) |
| Past uploads | `getExcelFiles` → **GET `/shop/excel/getUploadedExcelFiles`** (each with `failed_rows_count`) |

All shop endpoints on the `market-dashboard` backend, scoped by seller ID.

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/SellerDashboard/ExcelUploadTab.tsx` |
| Service | `services/sellerDashboard/index.ts` (Excel methods; both downloads share `downloadShopFile`) |
| Category question | `utils/fetchData.ts` hands a `409` with `data.category_mismatch` back with no toast and no Sentry report |
| Permission gate | `CREATE_PRODUCT` OR `UPDATE_PRODUCT` (or `SUPER_ADMIN`) |
| State | Local `useState` (no store slice), plus the remembered choice in `localStorage` |

## Current status & maturity

Live. The end-to-end path — pick category, choose template or products, download, upload, answer the
category question if asked, review results, download failed rows — works. **The actual parsing and
product creation happen on the backend, by design.** The widget's job is to collect the file and
pass its address to the backend. The results come back in the uploads table.

## Known gaps / notes

- **No client-side file-size check** despite a service comment referencing a 512 MB limit — the limit
  is neither enforced nor shown (a rejected file surfaces as a backend/upload error instead).
- The success banner says "processed successfully" on hand-off, even though backend processing is
  asynchronous (`processing` status) — actual per-row outcomes appear afterward in the uploads table
  / notes, not inline.
- The proxy doesn't forward the backend's file name, so the tab names downloads itself:
  `<category>_template.xlsx`, `<category>_products.xlsx`, `<file name>_failed_rows.xlsx`.
- `/api/proxy` reads a whole file into memory before it sends it on. A very large "Update my
  products" file (a top category with many products) could meet the platform's response size limit.
- Only the new "Completed with errors" status label is translated; the other status labels show the
  backend's raw value.
- Requires the media-server env vars (`NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` /
  `NEXT_PUBLIC_MEDIA_API_KEY`) to be set, or the upload/list-download URLs no-op.
- Minor (code hygiene): the media-upload helper still carries a "dummy implementation — replace with
  real upload logic" comment, though the POST itself is written and functional.

## Related features

SL-03 (Product management) · SL-04 (Product editing — the single-product equivalent).
