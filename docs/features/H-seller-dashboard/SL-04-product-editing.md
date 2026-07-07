# SL-04 — Product Editing

| | |
|---|---|
| **Feature ID** | SL-04 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟡 Partial — fully functional today; "partial" only because it's slated to be replaced by a planned AI-driven editor |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/[productId]/page.tsx`, `components/SellerDashboard/productEdit/ProductEditor.tsx`, `components/SellerDashboard/productEdit/sections.tsx`, `components/SellerDashboard/productEdit/helpers.ts`, `services/sellerDashboard/index.ts` |

---

## What it is

The **full edit form for a single product** — a comprehensive editor covering the product's core
details, pricing and stock, colour/size variants, images and video, categories, labels/tags,
country rules, SEO and per-language translations. It loads the product's real data and saves real
changes back to the shop.

## Where it appears

- Opened from the **Products** tab (SL-03) by tapping a product card:
  `…/sellerDashboard/<sellerId>/products/<productId>`.

## Who uses it

**Sellers / shop staff.** Viewing is available to anyone who can open the product; **editing**
requires the `UPDATE_PRODUCT` permission (otherwise the screen is "View only", with no Edit button).

## How it works (verified behaviour)

- **Loads real data.** On open it fetches the product plus its lookup lists (brands, boutiques,
  categories, countries…) and fills a full form.
- **Editable fields (verified):** name, seller/product IDs, barcode, unit, brand, boutique, model,
  description; unit/discount/purchase/"luck" prices, stock, weight, max quantity, shipping cost/days,
  tax; a colour×size **variant matrix** (per-row price/discount/extra/quantity/SKU/barcode + colour→
  image mapping); multi-image upload/reorder/delete (first image = cover); main/sub/sub-sub
  categories; up to 3 labels + tags; country of origin, restricted countries and per-country extra
  price; SEO meta title/description/image; en/ar/tr/ku name & description (English name required);
  and product video upload/removal.
- **Change-aware save.** Saving first validates, then computes a **diff** — if nothing changed it
  says "No changes to save." A confirmation dialog lists exactly what will change before submitting.
- **Approval-aware.** For sellers whose account requires it, edits are stored **pending admin
  approval** and the UI says so instead of showing a plain success message.
- **Media** is uploaded to a separate media server; the rest is saved as a multipart update.

## Data source

| Item | Value |
|------|-------|
| Load | `getProductForEdit(sellerId, productId)` → **GET `/shop/products/{id}/edit`** (`market-dashboard`) |
| Save | `updateProduct(sellerId, productId, formData)` → **POST `/shop/products/{id}/update`** (multipart) |
| Image upload | `bulkUploadImages` → **POST `{MEDIA_SERVER}/upload/bulk`** (`x-api-key`); video → `{MEDIA_SERVER}/upload` |
| Permissions self-heal | on deep-link with empty context, `getSellerPermissions` → **GET `/shop/auth/permissions`** |

## Technical reference

| Item | Value |
|------|-------|
| Route | `…/products/[productId]/page.tsx` → `<ProductEditor>` |
| Editor | `components/SellerDashboard/productEdit/ProductEditor.tsx` |
| Sections | `components/SellerDashboard/productEdit/sections.tsx` (Core, Pricing, Variants, Media, Categories, Classification, Countries, SEO, Translations, Videos) |
| Form logic | `helpers.ts` (`buildFormFromEdit`, `buildDiff`, `validate`, `buildUpdateFormData`) |
| Edit gate | `UPDATE_PRODUCT` (or `SUPER_ADMIN`) |
| State | Local `useState` + `SellerProfileContext` (no Zustand slice) |

## Current status & maturity

**Functional and complete in code** — it loads and saves real product data end to end, with
validation, a change diff, an approval path and multi-language support. The "🟡 Partial" label is a
**roadmap decision, not a code limitation**: the index/status report record that this form is
planned to be replaced by a new AI-driven editor that extracts product info from images, so it's
treated as interim. There is **no "interim/AI/TODO" marker in the editor code itself** — that note
lives only in the docs.

## Known gaps / notes

- Treated as **interim** pending the planned AI-driven redesign (documented in the index and the PM
  status report, not in code).
- Changing a parent category does **not** live-reload its sub-categories — the UI tells the user to
  re-open the page; sub-category options are whatever the initial load returned.
- Client-side validation is intentionally best-effort; the **server re-validates** on save.

## Related features

SL-03 (Product management) · SL-05 (Activate / allow purchase — same screen) · SL-09 (Product image
gallery) · SL-12 (Bulk upload).
