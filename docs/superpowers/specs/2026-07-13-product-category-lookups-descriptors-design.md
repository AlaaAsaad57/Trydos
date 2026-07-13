# Seller Dashboard — Dynamic Category Lookups + Descriptors Section

**Date:** 2026-07-13
**Status:** Design approved (pending spec review)
**Author:** ai_agent
**Related API contracts:** `shop-category-lookup.md` (cascading lookups), `shop-seller-product-boutique-apis.md` §3 (Products)

## 1. Goal

In the seller-dashboard product editor (`components/SellerDashboard/productEdit/`),
make the category selectors **dynamic** and surface the **descriptor groups** that
today are fetched but discarded:

- On **every** category selection change (main, sub, and sub-sub), fetch that
  category's branch lookups (`sub_categories`, `sub_sub_categories`,
  `descriptor_groups`) via the cascading-lookup API and merge them into the form's
  option pools.
- Add a new **Descriptors section** that renders the merged descriptor groups as
  multi-select chips and carries the seller's choices into the save payload.

Applies to both `mode="edit"` and `mode="create"` of `ProductEditor`.

## 2. Current state (what exists)

- `CategoriesSection` (`sections.tsx:331`) renders Main / Sub / Sub-sub categories
  as chips from `lookups.parent_categories` / `sub_categories` /
  `sub_sub_categories` bound to `form.category_id` / `sub_category_id` /
  `sub_sub_category_id`. **Static** — populated once from the `/edit` (or
  `/create`) response; the section copy tells users to re-open the page after
  changing parents.
- `Lookups.descriptor_groups: any[]` (`helpers.ts:57`) is returned in the payload
  but **never rendered**, has **no `ProductForm` field**, and is **not sent** in
  `buildUpdateFormData` (`helpers.ts:562`).
- Only `getProductForEdit` / `getProductCreateForm` fetch lookups; **no** method
  calls the cascading-lookup endpoint.
- The `/edit` response (`product-edit-json.json`) carries `selected_categories`
  (`main`/`sub`/`sub_sub`) but **no selected-descriptors field** — so edit mode
  cannot pre-check previously-saved descriptor values.

## 3. Decisions (locked)

| Topic | Decision |
| --- | --- |
| Fire trigger | **Every level** — main, sub, and sub-sub toggles all fetch. |
| Merge model | **Merge + dedupe** across all currently-selected categories; deselecting removes only that category's contribution. |
| Descriptor UI | **Multi-select chips, optional** (no required groups). |
| Save contract | Assume flat **`descriptor_ids[]`** in the update/create payload. |
| Loading UX | **Section-scoped** loading on Categories + Descriptors cards (not full-page). |

## 4. Architecture

### 4.1 API service (1 new method)

`services/sellerDashboard/index.ts`:

```ts
// GET /shop/products/categories/{categoryId}/lookups — UPDATE_PRODUCT | SUPER_ADMIN
// Returns { sub_categories, sub_sub_categories, descriptor_groups } for the
// category's whole branch. Empty arrays are valid (not an error).
async getCategoryLookups(sellerId: string, categoryId: string | number)
```

Uses `fetchData` with `server: "market-dashboard"` and `sellerId` (which attaches
`X-Seller-ID` + `lang`), mirroring `getProductForEdit`. A new
`REQUESTS_DATA.GET_CATEGORY_LOOKUPS` request title (in `utils/Requests.ts`).
Unwraps the envelope; returns
`res.data` (defaulting missing arrays to `[]`).

### 4.2 Types (`helpers.ts`)

- New field on `ProductForm`: `descriptor_ids: number[]`.
- `emptyProductForm()` → `descriptor_ids: []`.
- `buildFormFromEdit()` → `descriptor_ids: []` (backend returns no pre-selection).
- Tighten `Lookups.descriptor_groups` from `any[]` to a typed shape:
  ```ts
  interface DescriptorLookup { id: number; name: string; descriptor_group_id: number }
  interface DescriptorGroup { id: number; name: string; descriptors: DescriptorLookup[] }
  ```

### 4.3 Lookup cache + merge (in `ProductEditor.tsx`)

A cache keyed by category id holds each fetched branch result:

```ts
Map<number, { sub_categories: CategoryLookup[];
              sub_sub_categories: CategoryLookup[];
              descriptor_groups: DescriptorGroup[] }>
```

On any category-selection change, a single `syncCategoryLookups(selectedIds)`
routine:

1. Fetches lookups for each selected id **not** already cached; deletes cache
   entries for ids no longer selected. `selectedIds` = union of
   `form.category_id ∪ sub_category_id ∪ sub_sub_category_id`.
2. Sets a `catLoading` flag while any fetch is in flight (drives §4.5).
3. **Race guard:** an incrementing request-sequence ref; responses from a
   superseded sequence are ignored so rapid toggling can't apply stale data.
4. Recomputes **merged lookups**:
   - `sub_categories`, `sub_sub_categories` → union across cache, deduped by `id`.
   - `descriptor_groups` → union deduped by group `id`; within a group,
     `descriptors` deduped by descriptor `id`.
   - Merged results are layered over the base lookups from `/edit` (base
     `parent_categories`, `boutiques`, `brands`, etc. are preserved; the three
     cascading arrays are replaced by the merged union).
5. **Prunes** stale selections: any `sub_category_id` / `sub_sub_category_id` /
   `descriptor_ids` not present in the recomputed pools is dropped from `form`.

Invoked from a `useEffect` on the three category-id arrays (and once after initial
load, so edit mode hydrates descriptor groups for the product's saved categories).

> **Merge note:** the endpoint already returns the full branch (category + sub +
> sub-sub) descriptors for a single id, so firing on every level is redundant-safe
> — dedupe makes duplicate coverage harmless; it only adds freshness/robustness.

### 4.4 Descriptors section (new)

`DescriptorsSection` in `sections.tsx`, following the existing `Section` +
`Chip` pattern (like `ClassificationSection`):

- One block per merged `descriptor_groups[]` entry: group name heading + its
  `descriptors[]` as multi-select `Chip`s toggling `form.descriptor_ids`.
- Reuses the existing `toggleId` helper.
- Empty/pre-selection state: if no groups are loaded, show the same muted hint
  used elsewhere (e.g. "Select a category to see its attributes.").
- Added to `SectionProps` consumers and rendered in `ProductEditor` immediately
  after `CategoriesSection`.

### 4.5 Loading UX

`CategoriesSection` and `DescriptorsSection` receive a `busy` prop (from
`catLoading`). While busy: a light overlay / reduced opacity on those two cards
and their chips disabled, so mid-fetch the rest of the form stays interactive.
No full-page spinner (the page-level `loading` remains reserved for initial load).

### 4.6 Save payload (`buildUpdateFormData`)

Append `descriptor_ids[]` **only when `form.descriptor_ids.length > 0`**:

```ts
form.descriptor_ids.forEach((id) => fd.append("descriptor_ids[]", String(id)));
```

**Why the non-empty guard:** the edit response returns no saved descriptors, so
edit mode starts empty. Always sending an empty `descriptor_ids[]` on an unrelated
save would risk the backend **clearing** the product's real descriptors. Omitting
the key when empty preserves existing server-side selections. (Documented trade-off
in §6.)

### 4.7 Change-diff (`buildDiff`)

Add a `descriptor_ids` count entry (`cnt("Descriptors", …)` via the existing
`eqArr` guard) so descriptor changes appear in the confirm-save dialog like the
other id-array fields.

## 5. Data flow (end to end)

```
seller toggles a category chip
   → patch({ category_id / sub_category_id / sub_sub_category_id })
   → useEffect fires syncCategoryLookups(union of selected ids)
       → catLoading = true  (Categories + Descriptors cards show busy)
       → getCategoryLookups() for each newly-selected id (cache misses)
       → race-guarded: apply only if sequence is current
       → recompute merged sub/sub-sub/descriptor pools; prune stale selections
       → setLookups(merged); catLoading = false
   → DescriptorsSection renders merged groups; seller picks descriptor chips
   → Save → buildUpdateFormData appends descriptor_ids[] (only if non-empty)
```

## 6. Open items / backend follow-ups (out of scope here)

- **Descriptor pre-selection & clearing:** requires the `/products/{id}/edit`
  response to return the product's currently-selected descriptor ids (e.g.
  `selected_descriptors: number[]`). Until then, edit mode starts descriptors
  empty and sellers cannot clear *all* descriptors via this form (the non-empty
  guard). Flag to backend.
- **Confirm the exact update field name** (`descriptor_ids[]` assumed) with the
  Go/inventory team; adjust `buildUpdateFormData` if it differs.

## 7. Out of scope

- No changes to categories data model, other product-form sections, or the
  boutique editor.
- No new route; this is entirely within the existing product editor.
- No required-descriptor validation (all groups optional in v1).

## 8. Files touched

| File | Change |
| --- | --- |
| `services/sellerDashboard/index.ts` | `getCategoryLookups` method |
| `utils/Requests.ts` | `GET_CATEGORY_LOOKUPS` request title (where `REQUESTS_DATA` lives) |
| `components/SellerDashboard/productEdit/helpers.ts` | `descriptor_ids` field, typed descriptor lookups, `emptyProductForm`/`buildFormFromEdit`/`buildUpdateFormData`/`buildDiff` updates |
| `components/SellerDashboard/productEdit/sections.tsx` | new `DescriptorsSection`; `busy` prop on Categories + Descriptors |
| `components/SellerDashboard/productEdit/ProductEditor.tsx` | lookup cache, `syncCategoryLookups`, `catLoading`, render `DescriptorsSection` |
