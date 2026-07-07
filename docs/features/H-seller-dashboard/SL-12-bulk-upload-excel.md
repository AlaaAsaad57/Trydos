# SL-12 — Bulk Upload (Excel)

| | |
|---|---|
| **Feature ID** | SL-12 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/ExcelUploadTab.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The **Upload Excel File** tab — a way to create products in bulk. The seller picks a category,
downloads a matching Excel template, fills it in, and uploads it for the backend to process into
products. A table shows the status of past uploads.

## Where it appears

- Inside the seller dashboard → **Upload Excel File** tab.

## Who uses it

**Sellers / shop staff** with `CREATE_PRODUCT` or `UPDATE_PRODUCT` (or `SUPER_ADMIN`).

## How it works (verified behaviour)

- **Three-step flow:** (1) pick a **category**; (2) **download** its Excel template — the backend
  streams a `.xlsx` file which the browser saves; (3) **upload** the filled file (drag-drop or file
  picker).
- **No client-side parsing.** The file isn't read in the browser (no SheetJS/xlsx); it's uploaded to
  the media server, then the resulting URL is handed to the backend to parse and create products.
- **Client validation** is extension-only (`.xlsx/.xls/.xlsm/.xlsb`); there is no size or MIME check.
- **Feedback:** a single success/error banner (not per-row). An **"Uploaded Excel Files"** table
  lists past uploads with status badges (uploaded / processing / completed / failed) and a Notes
  modal showing the backend's processing notes — that's where per-row results appear afterward.

## Data source

| Item | Value |
|------|-------|
| Categories | `getExcelCategories` → **GET `/shop/excel/categories`** |
| Template | `downloadExcelTemplate(categoryId)` → **GET `/shop/excel/downloadExcel/{categoryId}`** (streamed `.xlsx`, routed via `/api/proxy`) |
| Upload file | `uploadExcelFile(file)` → **POST `{MEDIA_SERVER}/upload/excel?folder=excel`** (`x-api-key`) |
| Process | `processExcel(sellerId, fileUrl)` → **POST `/shop/excel/processExcel`** (`{file_url}`) |
| Past uploads | `getExcelFiles` → **GET `/shop/excel/getUploadedExcelFiles`** |

All shop endpoints on the `market-dashboard` backend, scoped by seller ID.

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/SellerDashboard/ExcelUploadTab.tsx` |
| Service | `services/sellerDashboard/index.ts` (Excel methods) |
| Permission gate | `CREATE_PRODUCT` OR `UPDATE_PRODUCT` (or `SUPER_ADMIN`) |
| State | Local `useState` (no store slice) |

## Current status & maturity

Live. The end-to-end path — pick category, download template, upload, hand off, review results —
works. **The actual parsing and product creation happen on the backend, by design** — the widget's
job is only to collect the file and pass its URL to the backend; the results come back in the
uploads table.

## Known gaps / notes

- **No client-side file-size check** despite a service comment referencing a 512 MB limit — the limit
  is neither enforced nor shown (a rejected file surfaces as a backend/upload error instead).
- The success banner says "processed successfully" on hand-off, even though backend processing is
  asynchronous (`processing` status) — actual per-row outcomes appear afterward in the uploads table
  / notes, not inline.
- Template download hardcodes country `sy` / language `en` fallbacks and a `template-<id>.xlsx`
  filename fallback (the proxy doesn't forward the real filename).
- Requires the media-server env vars (`NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` /
  `NEXT_PUBLIC_MEDIA_API_KEY`) to be set, or the upload/list-download URLs no-op.
- Minor (code hygiene): the media-upload helper still carries a "dummy implementation — replace with
  real upload logic" comment, though the POST itself is written and functional.

## Related features

SL-03 (Product management) · SL-04 (Product editing — the single-product equivalent).
