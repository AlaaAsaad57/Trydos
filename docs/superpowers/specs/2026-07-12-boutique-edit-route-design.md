# Seller Dashboard — Boutique Show/Edit Route

**Date:** 2026-07-12
**Status:** Design approved (pending spec review)
**Author:** ai_agent
**Related API contract:** `shop-seller-product-boutique-apis.md` §4 (Boutiques)

## 1. Goal

Give a seller a dedicated route in the seller dashboard to **view and edit one of
their own boutiques**: global data, per-language translations (en/ar/tr/ku),
banners, and the active/inactive status — matching the existing dashboard design
language, fully responsive, RTL-aware, with no breaking changes to any other
section.

Explicitly **in scope**: name, availability, restricted countries, icon,
per-language name/description/bio, banners (upload + reorder + delete with a
pre-upload dimension warning), and the status toggle.

Explicitly **deferred** (future ticket): the attached-products picker
(`related_product_ids` / `product_resources`) — existing attached product ids are
preserved untouched on save.

## 2. Architecture

Mirror the **existing product-editor sub-route**, which is the only real edit
sub-route in the dashboard today and the established precedent.

### 2.1 Route (1 new page)

```
app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/
  └── boutiques/[boutiqueId]/page.tsx    ← NEW
```

Thin async server wrapper: `<BackBar previous_page=".../[sellerId]">` +
`<BoutiqueEditor sellerId boutiqueId language />` — identical structure to
`products/[productId]/page.tsx`.

### 2.2 New components (self-contained under `components/SellerDashboard/boutiqueEdit/`)

| File | Responsibility |
|------|----------------|
| `BoutiqueEditor.tsx` | `"use client"` shell: load via service, hold form state, orchestrate save + status, loading/error/empty states |
| `sections.tsx` | The section cards: Global, Translations, Banners |
| `controls.tsx` | Local `Txt` / `Area` / `Select` / `Toggle` / `Chip` (copied from the product-editor pattern) |
| `helpers.ts` | Types, GET→form and form→payload mapping, banner dimension validator |

Rationale for copying the controls rather than sharing the product editor's:
the product-editor form controls are **unexported locals** inside
`productEdit/sections.tsx`. Copying the (small) pattern into `boutiqueEdit`
guarantees **zero changes to the product form** and honours the no-breaking-changes
requirement. All controls still build on the shared kit
(`components/SellerDashboard/ui/index.tsx`: `DashCard`, `DashField`, `DashButton`,
`Section`, `Grid`, chips, `Toggle`, `dashInputClass`, `LoadingState`/`ErrorState`/
`EmptyState`), so the page is visually consistent with the rest of the dashboard.

### 2.3 Navigation (1 additive edit to existing code)

In the existing `renderBoutiques()` inside
`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`, wrap each
boutique card in a `next/link` to
`/${local}/sellerProfile/sellerDashboard/${sellerId}/boutiques/${boutiqueId}`,
exactly as product cards already link to the product editor. This is the only edit
to existing files and is purely additive (no behavior change to any other section).

## 3. UI layout

Follows the dashboard design tokens (`DASH`: primary `#5d5d5d`, accent `#388CFF`,
danger `#f85555`, tint `#f0f0f0`, cards `rounded-[15px]` + soft shadow).

- **Header** — `Monogram` + boutique name + a **status toggle** (`Toggle`/`StatusPill`).
  The toggle is staged in form state (see §5); it does not call the API on its own.
- **Global card** — name; availability as a `Segmented` control (Web / Mobile /
  Web+Mobile → values `1/2/3`); restricted countries as a chip grid (empty = all);
  icon upload (single, `accept="image/*"`).
- **Translations card** — a `Segmented` language sub-tab (en/ar/tr/ku); per active
  language: name / description / bio. English name required.
- **Banners card** — shared across all languages: reorderable grid + "Add banner"
  tile + delete, with the pre-upload dimension warning (§6).
- **Footer** — a primary `DashButton` Save (loading state) and a secondary Cancel /
  back.

## 4. Data layer

Add three methods to `services/sellerDashboard/index.ts`, using `fetchData` with
`server: "market-dashboard"` and the `sellerId` argument (→ `X-Seller-ID` header),
following the existing product-edit trio pattern. These paths resolve to the
Laravel backend (`/shop/*` is not in the Go allow-list) — no Go-list change needed.

| Method | Call |
|--------|------|
| `getBoutiqueForEdit(sellerId, boutiqueId)` | GET `/shop/boutiques/{id}/edit` → `{ boutique, lookups }` |
| `updateBoutique(sellerId, boutiqueId, payload)` | POST `/shop/boutiques/{id}/update` |
| `changeBoutiqueStatus(sellerId, boutiqueId, status)` | POST `/shop/boutiques/{id}/change-status` |

Banner/icon files are uploaded with the **existing `bulkUploadImages`** media-server
helper → returns filenames/urls → referenced in the payload. Add matching
`REQUESTS_DATA` entries in `utils/Requests.ts`.

### 4.1 Payload shape (banners folded into `custom_data`, per product-owner decision)

Banners and icon are uploaded **once** and duplicated into every language object:

```jsonc
{
  "boutique_global_data": {
    "name", "availability", "description", "bio", "icon",
    "countries_iso": [...],
    "product_resources": [...existing related_product_ids, unchanged]
  },
  "custom_data": [
    // one object per language present (ensure en exists)
    { "id"?, "language_code", "name", "description", "bio", "icon",
      "banners": [ { "id"?, "banner", "sequence" } ] }
  ]
}
```

## 5. Save orchestration (status bundled into Save)

On **Save**:
1. Upload any new banner/icon files first (`bulkUploadImages`), resolve to filenames.
2. `updateBoutique(...)` with the payload above.
3. **If** the staged status differs from the loaded status, then call
   `changeBoutiqueStatus(...)`.
4. If step 3 returns `422` (activation blocker: "you need to be approved",
   "Missing Translations", "This Boutique Didn't Have active Related Products."),
   surface it as an inline alert **but keep the saved edits** (update already
   succeeded); revert the toggle to its persisted value.
5. On full success show the success message; `requires_approval`-style messages
   surfaced if present.

Update-first-then-status ordering ensures newly-saved translations are in place
before an activation check runs.

## 6. Banner dimension validation

Recommended size **1280×750 (16:9)** — the only place a boutique banner's real
pixel dims are hardcoded (`BoutiqueWrapper.tsx` `width=1280 height=750`), and under
the largest Cloudinary width the app ever requests (`w_1356`).

Validator (in `helpers.ts`) uses the in-repo idiom
(`URL.createObjectURL` + `new Image()` → `naturalWidth/Height`, then
`revokeObjectURL`). Two tiers:

- **Hard block** (reject the file, no "ignore" option): file size > 10 MB
  (existing `StoriesTab` cap) or non-image type. Show a blocking error toast/alert.
- **Warn** (non-blocking, with "Ignore & upload"): aspect ratio ∉ ~1.6:1 – 2.9:1,
  or width < 1280 (low-res).

The warning is a `fixed inset-0` modal (the dashboard's standard inline-modal
pattern) showing the recommended size + a note to keep content centered (storefront
hero crops top/bottom), with **"Ignore & upload"** to proceed anyway and a Cancel.
All hard-block and warning strings (including the >10 MB message and the recommended
size text) are added to the translation files (§7).

## 7. i18n & RTL

- All user-facing text via `translateFunction`. English strings are the keys;
  add Arabic/Turkish/Kurdish values to `public/translations/translations.{ar,tr,ku}.js`.
- `isRtl = language === "ar" || language === "ku"`, applied via inline
  `style={{ direction }}` + mirrored padding, per the `orders.tsx` / `CommentsTab.tsx`
  pattern. `language` comes from the `[lang]` route segment.

## 8. Error / permission handling

- Edit gated by the boutique-update permission flag; status by the change-status
  flag — read from the page's existing `hasPermission()` / `PERMISSION_GROUPS` map
  and passed as props (UX gating only).
- `404` from `/edit` (not found or not owned by this seller) → not-found/error state.
- Service non-throwing convention respected (`if (!res?.success) throw ...`),
  errors routed to `LogError` and a translated inline `ErrorState`.

## 9. Out of scope

- Attached-products picker (`product_resources` / `related_product_ids`) — deferred;
  existing ids preserved untouched.
- Product edit/create, boutique **create**, and any admin-only fields
  (`request_status`, `position`, `slug`) — read-only / untouched.
- Any change to other dashboard tabs beyond the additive boutique-card link.

## 10. Files touched (summary)

**New:** the route page + 4 `boutiqueEdit/` component files.
**Edited (additive only):** `services/sellerDashboard/index.ts` (3 methods),
`utils/Requests.ts` (reqTitle entries), the `renderBoutiques()` card link in the
dashboard `page.tsx`, and the three translation files.
