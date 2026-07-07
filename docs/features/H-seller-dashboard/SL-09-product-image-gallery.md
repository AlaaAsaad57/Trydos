# SL-09 — Product Image Gallery

| | |
|---|---|
| **Feature ID** | SL-09 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/GalleryTab.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The **Gallery** tab — a shop-wide image library where a seller can upload, browse, copy and delete
product images. It's a reusable pool of images for the shop (not tied to one specific product).

## Where it appears

- Inside the seller dashboard → **Gallery** tab.

## Who uses it

**Sellers / shop staff.** Browsing needs `READ_PRODUCT_IMAGES`; uploading needs
`UPLOAD_PRODUCT_IMAGES`; deleting needs `DELETE_PRODUCT_IMAGES`.

## How it works (verified behaviour)

- **Browse:** a responsive grid (3 columns on mobile, 6 on desktop) paged at **60 images per page**,
  with Prev/Next when there's more than one page. Each image has hover actions: **View** (lightbox),
  **Copy URL** (to clipboard), and **Delete** (if permitted).
- **Upload** (only shown with upload permission): pick multiple files or a whole folder, or
  drag-and-drop. Only files whose type starts with `image/` are kept. A confirmation modal previews
  the selection before uploading. Files go to the media server in bulk, then their URLs are saved to
  the shop; the grid refreshes to page 1.
- **Delete** (only with delete permission): single delete via the hover trash, or a **multi-select**
  mode (select-all + per-image checkboxes) for bulk delete. Both send image IDs as an array to the
  same endpoint.

## Data source

| Item | Value |
|------|-------|
| List | `getProductImages(sellerId, page, perPage, search)` → **GET `/shop/products/images`** (`?page=&per_page=&search=`) |
| Save uploaded | `saveProductImages` → **POST `/shop/products/images`** (`{images:[{url,name}]}`) |
| Delete (single/bulk) | `deleteProductImages` → **DELETE `/shop/products/images`** (`{ids:[…]}`) |
| Media upload | `bulkUploadImages` → **POST `{MEDIA_SERVER}/upload/bulk`** (`x-api-key`) |

All on the `market-dashboard` backend, shop-scoped by seller ID.

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/SellerDashboard/GalleryTab.tsx` (page size `PER_PAGE = 60`) |
| Permission gates | `READ_ / UPLOAD_ / DELETE_PRODUCT_IMAGES` (or `SUPER_ADMIN`) |
| State | Local `useState` (no store slice); permissions from `SellerProfileContext` |

## Current status & maturity

Live and stable. Upload (multi-file/folder/drag-drop), browse with pagination, copy-URL, and
single/bulk delete all work, each behind its own permission.

## Known gaps / notes

- It's a **shop-wide** image library, not a per-product gallery — there's no product filter; images
  are keyed to the shop.
- Upload validation is only a MIME-prefix check — **no max file size, count, or dimension limits**
  client-side; large folder selections are passed straight to the media server.
- Copy-to-clipboard failures are swallowed silently (no user feedback).
- Two older, unused image endpoints (`/seller/product/get-uploaded-images`,
  `/seller/product/delete-image/{id}`) still exist in the service but are superseded by the
  `/shop/products/images` API this tab uses.

## Related features

SL-03 (Product management) · SL-04 (Product editing) · SL-08 (Shop info / branding).
