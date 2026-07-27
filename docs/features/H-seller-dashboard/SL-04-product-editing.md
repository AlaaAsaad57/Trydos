# SL-04 — Product Editing (add & edit)

| | |
|---|---|
| **Feature ID** | SL-04 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟡 Partial — fully functional today; "partial" only because it's slated to be replaced by a planned AI-driven editor |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/[productId]/page.tsx`, `…/products/new/page.tsx`, `components/SellerDashboard/productEdit/ProductEditor.tsx`, `…/sections.tsx`, `…/helpers.ts`, `components/SellerDashboard/ui/RichTextEditor.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The **product form** — one screen that both **creates a new product** and **edits an existing one**.
It covers the product's core details, pricing and stock, colour/size variants, images and video,
categories and attributes, labels/tags, country rules, SEO and per-language translations. It loads
the shop's real data and saves real changes back.

## Where it appears

- **Edit:** Products tab (SL-03) → tap a product card → `…/sellerDashboard/<sellerId>/products/<productId>`.
- **Add:** Products tab → **"+ Add Product"** (or "Add your first product" on the empty state) →
  `…/sellerDashboard/<sellerId>/products/new`.

## Who uses it

**Sellers / shop staff.** Viewing a product is available to anyone who can open it; **editing**
requires `UPDATE_PRODUCT` (otherwise the screen is "View only", with no Edit button). **Adding**
requires `CREATE_PRODUCT` — the "+ Add Product" button is hidden without it.

## How it works (verified behaviour)

- **Loads real data.** Edit fetches the product plus its lookup lists (brands, boutiques, categories,
  countries, colours, sizes, **locations**, attribute groups…) and fills the whole form. Add loads the
  same lookups against an empty form.
- **Editable fields (verified):** name, seller/product IDs, barcode, unit, brand, boutique, **location**,
  model, description; unit/discount/purchase/"luck" prices, stock, weight, pieces-per-unit, max
  quantity, shipping cost/days, tax; a colour×size **variant matrix** (per-row price/discount/luck/
  quantity/SKU/barcode, **per-variant location**, and colour→image mapping); multi-image upload/
  reorder/delete (first image = cover); main/sub/sub-sub categories; **product attributes**; up to 3
  labels + tags; country of origin, restricted countries and per-country extra price; SEO meta
  title/description/image; per-language name, description and search keywords; and product video
  upload/removal.
- **Rich-text descriptions.** Descriptions are written in a small formatting editor (bold, italic,
  underline, H2) instead of a plain textarea, and the HTML is **sanitised at save time** before it is
  sent. The editor itself is lazy-loaded, so it costs nothing until the form is opened.
- **Search keywords ("similar words").** Each language row accepts a list of extra words shoppers
  might search for, saved alongside that language's name and description.
- **Product attributes.** An **Attributes** section renders the attribute groups that belong to the
  chosen categories (single-select option lists or numeric inputs). Changing categories re-fetches the
  matching attribute groups and prunes any values that no longer apply. Attributes are saved through
  their **own endpoint**, and only when they actually changed — if that call fails, the rest of the
  product still saves and the form rolls the attribute values back so nothing shows as saved when it
  isn't.
- **Prices carry the shop's currency.** Every price input is labelled with the shop's currency code,
  read once per shop from the dashboard-wide shop-info load; if it can't be read, the inputs simply
  show no currency.
- **Approval gating on add.** Creating a product waits for the seller's approval standing before it
  renders any price field, so an unrestricted form is never shown and then withdrawn:
  - seller **not approved for new products** → only **purchase price** can be entered; unit, discount,
    luck, per-country extra and per-variant prices are hidden and skipped by validation (the backend
    drops them on this path too);
  - **no `READ_SHOP_INFO` permission** → the add screen explains the missing permission instead of
    offering a retry that cannot succeed;
  - **shop details failed to load** → an error state with a retry that re-issues the request once.
- **Approval banners on edit.** A product whose changes are awaiting admin approval shows a persistent
  banner saying the live product still shows the previous values; a product pending initial approval
  shows a "Pending Approval" pill. After a save that requires approval, a further note says the change
  goes live once approved.
- **Change-aware save.** Saving first validates, then computes a **diff** — if nothing changed it says
  "No changes to save." A confirmation dialog lists exactly what will change before submitting.
- **Validation (client-side, server re-validates):** name, brand, a valid unit and at least one image
  are required; weight is required for `pc`/`l` units; pieces-per-unit must be a whole number 1–100;
  discount must be ≤ unit price; every colour needs at least one image and every image must belong to
  a colour; every variant needs a quantity and a **unique SKU**. On **edit**, an English name is
  required and each language must have **either both name and description or neither** — a half-filled
  language is rejected. On **add**, only the chosen default language's name is required.
- **Add uses one language.** The add form asks for a **default language** and captures name,
  description and keywords for that language only — the backend translates the rest.
- **Drafts.** "Save Draft" / "Load Draft" keep a copy of the whole form in the browser's local storage
  (per shop and product), so a half-finished product survives a reload. Drafts are local to that
  browser — they are not stored on the server or shared with other staff.
- **Media** is uploaded to a separate media server; the rest is saved as one multipart submission.

## Data source

| Item | Value |
|------|-------|
| Load (edit) | `getProductForEdit(sellerId, productId)` → **GET `/shop/products/{id}/edit`** (`market-dashboard`) |
| Load (add) | `getProductLookups(sellerId)` → **GET `/shop/products/lookups`** |
| Category-scoped lookups | `getCategoryLookups(sellerId, categoryId)` → **GET `/shop/products/categories/{id}/lookups`** |
| Save (edit) | `updateProduct(sellerId, productId, formData)` → **POST `/shop/products/{id}/update`** (multipart) |
| Save (add) | `createProduct(sellerId, formData)` → **POST `/shop/products`** (same multipart body) |
| Attributes | `syncProductDescriptors(sellerId, productId, payload)` → **POST `/shop/products/{id}/descriptors`** (full replace) |
| Shop currency & approval standing | `getShopInfo(sellerId)` → **GET `/shop/info`**, loaded once per shop by `ShopInfoLoader` into the store |
| Image upload | `bulkUploadImages` → **POST `{MEDIA_SERVER}/upload/bulk`** (`x-api-key`); video → `{MEDIA_SERVER}/upload` |
| Permissions self-heal | on deep-link with empty context, `getSellerPermissions` → **GET `/shop/auth/permissions`** |

## Technical reference

| Item | Value |
|------|-------|
| Routes | `…/products/[productId]/page.tsx` (edit) · `…/products/new/page.tsx` (create) → `<ProductEditor mode="edit" \| "create">` |
| Editor | `components/SellerDashboard/productEdit/ProductEditor.tsx` |
| Sections | `sections.tsx` — General, Pricing & Stock, Categories, **Attributes**, Labels & Tags, Origin & Countries, SEO/Meta, Images, Variants, Translations, Video |
| Form logic | `helpers.ts` (`buildFormFromEdit`, `buildDiff`, `validate`, `buildUpdateFormData`, `buildDescriptorSyncPayload`, `parseSimilarWords`) |
| Rich text | `components/SellerDashboard/ui/RichTextEditor.tsx` (TipTap; lazy-loaded with a skeleton), sanitised via `utils/sanitizeHtml` |
| Draft storage | `localStorage` key `trydos_product_editor_draft_<sellerId>_<productId\|new>` |
| Gates | `UPDATE_PRODUCT` (edit) · `CREATE_PRODUCT` (add) · `READ_SHOP_INFO` (needed by the add path) · or `SUPER_ADMIN` |
| State | Local `useState` + `SellerProfileContext`; shop info in the `dashboardShopInfo` store slice |

## Current status & maturity

**Functional and complete in code for both add and edit** — it loads and saves real product data end
to end, with validation, a change diff, attribute syncing, approval gating and multi-language support.
The "🟡 Partial" label is a **roadmap decision, not a code limitation**: the index and status report
record that this form is planned to be replaced by a new AI-driven editor that extracts product info
from images, so it's treated as interim. There is **no "interim/AI/TODO" marker in the editor code
itself** — that note lives only in the docs.

## Known gaps / notes

- Treated as **interim** pending the planned AI-driven redesign (documented in the index and the PM
  status report, not in code).
- Changing a parent category does **not** live-reload its sub-categories — the UI tells the user to
  re-open the page; sub-category options are whatever the initial load returned. (Attribute groups
  *do* re-fetch per category.)
- **Drafts are browser-local.** They live in local storage only — clearing site data, switching device
  or switching browser loses them, and no one else on the shop can pick a draft up.
- Client-side validation is intentionally best-effort; the **server re-validates** on save.

## Related features

SL-03 (Product management — the list and the "Add Product" entry point) · SL-05 (Activate / allow
purchase — same screen) · SL-09 (Product image gallery) · SL-12 (Bulk upload) · SL-15 (Locations —
supplies the location options).
