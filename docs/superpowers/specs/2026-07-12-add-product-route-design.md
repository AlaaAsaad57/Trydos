# Add-new-product route — Design

**Date:** 2026-07-12
**Area:** Seller dashboard → product editor
**Status:** Approved (brainstorming), pending implementation plan

## Goal

Let a seller with `CREATE_PRODUCT` create a new product using the **same** editor
layout as edit. A new route renders `ProductEditor` in a `create` mode that loads a blank
form + lookups, and submits the same multipart body (`buildUpdateFormData`) to a new
add endpoint.

## Decisions (from brainstorming)

- **Create-form lookups:** `GET /shop/products/create` → `{ data: { lookups } }` (same
  lookups shape as `/shop/products/{id}/edit`).
- **Submit:** `POST /shop/products/add`, body = `buildUpdateFormData(form)` (identical to
  update), `noMessage: true`.
- **After success:** redirect to the new product's edit page
  `.../products/{newId}` (id = `res.data.product_id ?? res.data.id`), so the seller can
  then enable purchasing (change-status) — new products are created disabled.
- **Route segment:** `products/new` (static segment; wins over `[productId]`; product ids
  are numeric so no collision).
- **Editor reuse:** parameterize the existing `ProductEditor` with a `mode` prop rather
  than fork a new component — keeps "same layout" literal and reuses all sections,
  upload handlers, gallery picker, validation, and the confirm dialog.

## Changes

### 1. Endpoints + service methods (`utils/Requests.ts`, `services/sellerDashboard/index.ts`)
- Add `REQUESTS_DATA.GET_PRODUCT_CREATE_FORM` (code 188) and `ADD_PRODUCT` (code 189).
- `getProductCreateForm(sellerId)` → GET `/shop/products/create`; throws on `!success`
  (mirrors `getProductForEdit`).
- `addProduct(sellerId, formData)` → POST `/shop/products/add`, `noMessage: true`
  (mirrors `updateProduct`).

### 2. Blank form factory (`helpers.ts`)
- `emptyProductForm(): ProductForm` — every `ProductForm` field with safe defaults
  (`unit: "pc"`, `tax_type: "percent"`, `status: 0`, number-strings `""`, arrays `[]`,
  booleans `false`, `variations: {}`, `colorImages: {}`). `buildUpdateFormData` is reused
  unchanged for the add body.

### 3. `ProductEditor` create mode (`ProductEditor.tsx`)
- Props: `productId?` optional; add `mode?: "edit" | "create"` (default `"edit"`);
  `isCreate = mode === "create"`.
- `load()`: create → `getProductCreateForm(sellerId)`, set `lookups`, set
  `form = initial = emptyProductForm()`, `status = 0`, `editMode = true`. Edit path
  unchanged. A create-form `403` routes to the existing `denied` state (same as edit).
- `startSave()` unchanged — in create, `initial` is the empty form, so the existing
  `buildDiff(initial, form)` + `ConfirmDialog` doubles as a "review before create". (An
  all-empty form can't reach here: `validate()` requires name/images/en-translation.)
- `confirmSave()`: create → `addProduct` → on success show a success toast and
  `router.replace(.../products/{newId})` (fallback to the products list if no id). Edit
  path unchanged.
- Header in create: title "New Product"; **no** status pill, request-status badge,
  change-status button, or Edit/View toggle; the ID line is hidden; Save label
  "Create Product"; Cancel → products list. `editMode` is always true.
- Permission: `canCreate = has("CREATE_PRODUCT")` (server also enforces via the two
  endpoints).
- Add `useRouter` (`next/navigation`).

### 4. Route page (`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/new/page.tsx`)
- Mirrors the edit page; `BackBar` name "New Product"; renders
  `<ProductEditor sellerId local mode="create" />` (no `productId`).

### 5. Products-tab entry (`page.tsx`)
- An "Add Product" `Link` to `.../products/new`, gated on
  `hasPermission("CREATE_PRODUCT")`, beside the products `SectionHeader` and in the
  empty state ("Add your first product").

## Reuse / no-change
All section components, upload handlers, the gallery picker, `validate`, and
`buildUpdateFormData` are mode-agnostic and used unchanged. Edit-mode behavior is
untouched (all create logic is behind `isCreate`).

## Out of scope
- Enabling purchase during create (done later via change-status on the edit page).
- Any backend change beyond the two agreed endpoints.
- Draft/autosave, duplication-from-existing, or bulk create (that's the Excel flow).

## Validation strategy
No test suite (repo policy). Verify via `pnpm lint` + `npx tsc --noEmit`, and a manual
pass: open `.../products/new` → blank form with lookups populated (colors/sizes/
categories) → fill required fields → Create → confirm dialog lists the values → on
success lands on `.../products/{newId}`; edit flow still works unchanged.

## Rollback
New route file + additive service/helper/Requests entries + one new `ProductEditor` prop.
Reverting the touched files restores prior behavior; no data migration.
