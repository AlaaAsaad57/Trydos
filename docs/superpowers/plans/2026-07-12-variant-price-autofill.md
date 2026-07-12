# Variant Price Auto-fill + Load Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make existing variant prices actually load in the seller product editor, auto-fill empty variant price fields from the product-level defaults, fix the single-file bulk-upload response, and add a "gallery vs device" image-picker menu.

**Architecture:** All changes are client-only, in `components/SellerDashboard/productEdit/` (plus one new modal). Task 1 fixes `buildFormFromEdit` (helpers.ts) so the reconstructed color/size axes and the variation-map keys line up with `combos()`. Task 2 adds a pure `seedVariantDefaults` helper and a `useEffect` in `VariantsSection`. Task 3 fixes `extractNames` (ProductEditor.tsx) for the single-file `{ url }` response. Tasks 4–5 add a `GalleryPickerModal` and a two-choice source menu on the product-image and meta-image pickers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TailwindCSS 4. Client components only. Package manager: **pnpm**.

## Global Constraints

- **No automated tests.** This repo has a no-test-suite policy (CLAUDE.md). Do **not** add test files. Verify each task with `pnpm lint`, a type-check (`npx tsc --noEmit`), and the manual check described in the task.
- **React Compiler is enabled** — do not add manual `useMemo`/`useCallback`; a `useEffect` with an explicit dependency list is fine and required here.
- All changes confined to `components/SellerDashboard/productEdit/helpers.ts` and `components/SellerDashboard/productEdit/sections.tsx`.
- Reference data (real API response) for manual verification: `product-edit-json.json` — product "Portugal T-shirt", one variant `type: "Aqua-S"` (color Aqua `#00FFFF`/id 75, size id 20), `unit_price: 60`, `discount_price: 55`, `luck_price: 0`, `selected_colors: []`.
- Branch: `feature/variant-price-autofill` (already created from `develop`). Never touch `main`/`develop` directly.

---

## File Structure

- **Modify** `components/SellerDashboard/productEdit/helpers.ts`
  - `buildFormFromEdit` — reconstruct `colors`/`sizes`, key `variations` by `cleanKey(v.type)`.
  - Add exported `seedVariantDefaults(form): Record<string, VariantRow>`.
- **Modify** `components/SellerDashboard/productEdit/sections.tsx`
  - `VariantsSection` — add `useEffect` (keyed on the combo-key set + `disabled`) that calls `seedVariantDefaults` and `patch`es when it differs. Add `useEffect` and `seedVariantDefaults` to imports.
  - `SectionProps` — add `sellerId: string` and `canUseGallery?: boolean`.
  - Add a local `SourceMenu` popover; wire it into `MediaSection` (multi) and `SeoSection` (single) to offer gallery vs device. Import `ImageItem`, `fileName`, `GalleryPickerModal`.
- **Modify** `components/SellerDashboard/productEdit/ProductEditor.tsx`
  - `extractNames` — handle the single-file `{ url }` response.
  - `sectionProps` — supply `sellerId` and `canUseGallery: has("READ_PRODUCT_IMAGES")`.
- **Create** `components/SellerDashboard/productEdit/GalleryPickerModal.tsx`
  - Lightweight modal listing the seller's uploaded images via `getProductImages`, with grid + (multi/single) select + "Load more"; returns `{ url, name }[]`.

---

## Task 1: Fix variant load (colors/sizes reconstruction + type-based keys)

**Files:**
- Modify: `components/SellerDashboard/productEdit/helpers.ts:255-284` (inside `buildFormFromEdit`)

**Interfaces:**
- Consumes: existing `colorByCode`, `colorById`, `sizeById` maps (helpers.ts:249-253); existing `cleanKey` (helpers.ts:178), `variantKey` (helpers.ts:181), `numStr` (helpers.ts:369), `SelColor`/`SelSize`/`VariantRow` types.
- Produces: a `ProductForm` whose `colors`/`sizes` include colors/sizes that only appear in `color_image_mappings` or `variations`, and a `variations` map keyed identically to `combos()` (via `cleanKey(type)`).

- [ ] **Step 1: Replace the colors + sizes reconstruction**

In `helpers.ts`, replace the current block (helpers.ts:255-266):

```ts
  const colors: SelColor[] = (product.selected_colors || []).map(
    (code: string) => {
      const c = colorByCode.get(String(code).toUpperCase());
      return { code, name: c?.name || code, id: c?.id };
    },
  );
  const sizes: SelSize[] = (product.selected_size_ids || [])
    .map((id: number) => {
      const s = sizeById.get(id);
      return s ? { id: s.id, name: s.name } : null;
    })
    .filter(Boolean) as SelSize[];
```

with (the Go backend can return an empty `selected_colors` for a product that
has colored variants, so rebuild the color axis from `selected_colors` **and**
`color_image_mappings`, deduped by uppercased code; rebuild sizes from
`selected_size_ids` **and** the variations):

```ts
  // The Go backend sometimes returns an empty `selected_colors` even when the
  // product has colored variants (its colors still appear in
  // `color_image_mappings`). Rebuild the color axis from every explicit source
  // and dedupe by uppercased color code so the matrix isn't silently dropped.
  const colorsByCode = new Map<string, SelColor>();
  const addColor = (code?: string, name?: string, id?: number) => {
    if (!code) return;
    const k = String(code).toUpperCase();
    if (colorsByCode.has(k)) return;
    colorsByCode.set(k, { code, name: name || code, id });
  };
  for (const code of product.selected_colors || []) {
    const c = colorByCode.get(String(code).toUpperCase());
    addColor(code, c?.name, c?.id);
  }
  for (const m of product.color_image_mappings || []) {
    if (m?.color_code) addColor(m.color_code, m.color_name, m.color_id);
  }
  const colors: SelColor[] = [...colorsByCode.values()];

  // Rebuild sizes from the selection and from any size referenced by a
  // variation (union, resolved through the size lookup, unresolved ids dropped).
  const sizeIds = new Set<number>();
  for (const id of product.selected_size_ids || []) sizeIds.add(id);
  for (const v of product.variations || [])
    if (v?.size_id != null) sizeIds.add(v.size_id);
  const sizes: SelSize[] = [...sizeIds]
    .map((id) => {
      const s = sizeById.get(id);
      return s ? { id: s.id, name: s.name } : null;
    })
    .filter(Boolean) as SelSize[];
```

- [ ] **Step 2: Key the variations map by `cleanKey(v.type)`**

Replace the current loop (helpers.ts:269-284):

```ts
  // Variations -> keyed map.
  const variations: Record<string, VariantRow> = {};
  for (const v of product.variations || []) {
    const cName = v.color_id != null ? colorById.get(v.color_id)?.name : undefined;
    const sName = v.size_id != null ? sizeById.get(v.size_id)?.name : undefined;
    const key = variantKey(cName, sName);
    if (!key) continue;
    variations[key] = {
      price: numStr(v.unit_price),
      discount: numStr(v.discount_price),
      extra: numStr(v.extra_price),
      luck: numStr(v.luck_price),
      qty: numStr(v.quantity),
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
    };
  }
```

with:

```ts
  // Variations -> keyed map. Prefer the backend's canonical `type` ("Aqua-S");
  // cleanKey(type) is byte-identical to combos()'s variantKey(color, size)
  // (cleanKey only strips whitespace / dots, never the "-" separator), so
  // loaded keys line up with the matrix keys and the update payload. Fall back
  // to resolving ids only when `type` is absent.
  const variations: Record<string, VariantRow> = {};
  for (const v of product.variations || []) {
    let key = v.type ? cleanKey(v.type) : "";
    if (!key) {
      const cName = v.color_id != null ? colorById.get(v.color_id)?.name : undefined;
      const sName = v.size_id != null ? sizeById.get(v.size_id)?.name : undefined;
      key = variantKey(cName, sName);
    }
    if (!key) continue;
    variations[key] = {
      price: numStr(v.unit_price),
      discount: numStr(v.discount_price),
      extra: numStr(v.extra_price),
      luck: numStr(v.luck_price),
      qty: numStr(v.quantity),
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
    };
  }
```

- [ ] **Step 3: Lint + type-check**

Run: `pnpm lint`
Expected: no new errors in `helpers.ts`.

Run: `npx tsc --noEmit`
Expected: passes (no type errors). If a pre-existing unrelated error appears, confirm it is not in `productEdit/`.

- [ ] **Step 4: Manual verification**

Start the dev server (`pnpm dev`), open the product editor for a colored product whose `selected_colors` comes back empty (the "Portugal T-shirt" / `product-edit-json.json` case):
`/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/[productId]`.

Expected: the variant table shows a single row **Aqua · S** with **Price 60**, **Discount 55** (previously the row was keyed "S" with empty inputs). The Aqua color chip shows as selected.

If you cannot reach that product, trace it on paper instead: `combos()` now produces `variantKey("Aqua","S") = "Aqua-S"`, and the variation is stored under `cleanKey("Aqua-S") = "Aqua-S"` → they match, so `form.variations["Aqua-S"]` renders real values.

- [ ] **Step 5: Commit**

```bash
git add components/SellerDashboard/productEdit/helpers.ts
git commit -m "fix(product-edit): load real variant prices when selected_colors is empty

Reconstruct the color axis from color_image_mappings (not just selected_colors,
which the Go backend can return empty) and key variations by cleanKey(type) so
loaded keys match combos(). Also fixes a latent save bug where the wrong
variant key (price_S vs price_Aqua-S) would be posted.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Auto-fill empty variant prices from product-level defaults

**Files:**
- Modify: `components/SellerDashboard/productEdit/helpers.ts` (add `seedVariantDefaults`, after `emptyVariantRow` at helpers.ts:175)
- Modify: `components/SellerDashboard/productEdit/sections.tsx:1-17` (imports) and `sections.tsx:557-582` (`VariantsSection` body)

**Interfaces:**
- Consumes: `combos` and `emptyVariantRow` (helpers.ts), `ProductForm`/`VariantRow` types, the `patch` prop and `disabled` prop already on `SectionProps`.
- Produces: exported `seedVariantDefaults(form: ProductForm): Record<string, VariantRow>` — returns `form.variations` **unchanged (same reference)** when nothing needs filling, otherwise a new map where each current combo's empty `price`/`discount`/`luck` is filled from `form.unit_price`/`discount_price`/`luck_price`.

- [ ] **Step 1: Add `seedVariantDefaults` to helpers.ts**

Insert immediately after `emptyVariantRow` (helpers.ts:175):

```ts
/**
 * Fill each current variant's empty price / discount / luck from the
 * product-level defaults, as real editable values. A field that already holds a
 * value — and `extra` / `qty` / `sku` / `barcode` — is left untouched. Combos
 * whose defaults are also empty are NOT materialized (avoids phantom rows /
 * diffs). Returns the SAME `form.variations` reference when nothing changed, so
 * callers can skip a needless patch.
 */
export function seedVariantDefaults(
  form: ProductForm,
): Record<string, VariantRow> {
  let changed = false;
  const next: Record<string, VariantRow> = { ...form.variations };
  for (const c of combos(form)) {
    const base = next[c.key] || emptyVariantRow();
    const price = base.price === "" ? form.unit_price : base.price;
    const discount = base.discount === "" ? form.discount_price : base.discount;
    const luck = base.luck === "" ? form.luck_price : base.luck;
    if (price !== base.price || discount !== base.discount || luck !== base.luck) {
      next[c.key] = { ...base, price, discount, luck };
      changed = true;
    }
  }
  return changed ? next : form.variations;
}
```

- [ ] **Step 2: Import `useEffect` and `seedVariantDefaults` in sections.tsx**

Change the React import (sections.tsx:2) from:

```ts
import React, { useRef, useState } from "react";
```

to:

```ts
import React, { useEffect, useRef, useState } from "react";
```

Add `seedVariantDefaults` to the helpers import (sections.tsx:10-17):

```ts
import {
  combos,
  ProductForm,
  Lookups,
  UNITS,
  VariantRow,
  emptyVariantRow,
  seedVariantDefaults,
} from "./helpers";
```

- [ ] **Step 3: Add the auto-fill effect in `VariantsSection`**

In `VariantsSection` (sections.tsx:557-562), directly after `const cmb = combos(form);` and the `setVariant` definition, add the effect. The final head of the component reads:

```ts
export function VariantsSection({ form, patch, errors, lookups, disabled }: SectionProps) {
  const cmb = combos(form);

  // Auto-fill empty variant prices from the product-level defaults so the seller
  // sees what each variant will cost. Keyed on the SET of combo keys (+ edit
  // mode), not on field values: it fires on entering edit mode and whenever a
  // color/size is added, but never re-fills a field the seller cleared.
  const comboKeys = cmb.map((c) => c.key).join("|");
  useEffect(() => {
    if (disabled) return;
    const seeded = seedVariantDefaults(form);
    if (seeded !== form.variations) patch({ variations: seeded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboKeys, disabled]);

  const setVariant = (key: string, field: keyof VariantRow, value: string) => {
    const row = form.variations[key] || emptyVariantRow();
    patch({ variations: { ...form.variations, [key]: { ...row, [field]: value } } });
  };
```

(Leave `toggleColor` / `toggleSize` / `toggleColorImage` and the rest of the component unchanged.)

- [ ] **Step 4: Lint + type-check**

Run: `pnpm lint`
Expected: no new errors in `sections.tsx` / `helpers.ts`.

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 5: Manual verification**

With `pnpm dev`, open the same product editor and click **Edit**:

1. **Empty-on-load fill:** a variant that loaded with no discount/luck now shows the product-level Discount/Luck in its inputs (black, editable). A fully-priced variant is unchanged.
2. **New variant:** toggle on a new color or size → its **Price / Discount / Luck** inputs prefill from the product-level Unit/Discount/Luck values; **Extra** stays `0`/empty.
3. **No re-fill after clear:** clear a prefilled field and click elsewhere → it stays empty (the effect does not re-run on edits).
4. **Override persists:** type a different price into a prefilled field → it keeps your value; on **Save Changes** the confirm dialog lists "Variant Pricing / Stock" and the value saved is what's shown.

- [ ] **Step 6: Commit**

```bash
git add components/SellerDashboard/productEdit/helpers.ts components/SellerDashboard/productEdit/sections.tsx
git commit -m "feat(product-edit): auto-fill empty variant prices from product defaults

New/empty variants prefill Price/Discount/Luck from unit_price/discount_price/
luck_price as real editable values, keyed on the combo-key set so a cleared
field is never silently re-filled.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Part 1 load fix (reconstruct colors/sizes, key by `cleanKey(type)`) → Task 1 ✓
- Colorless/size-only invariant preserved → Task 1 (empty `color_image_mappings` → no colors; unresolved `size_id` dropped) ✓
- No phantom diffs → Task 1 (`initial` and `form` from same reconstruction) + Task 2 (`seedVariantDefaults` doesn't materialize empty-default rows) ✓
- Part 2 mapping (price←unit_price, discount←discount_price, luck←luck_price, extra untouched) → Task 2 Step 1 ✓
- Trigger keyed on combo-key set; no re-fill on clear → Task 2 Step 3 ✓
- Real editable values, persist on save → Task 2 Step 1 (writes into `form.variations`) ✓
- Skip needless patch → `seedVariantDefaults` returns same reference when unchanged ✓
- `qty`/`sku` untouched; price within allowed band → Task 2 (only price/discount/luck filled) ✓

**Placeholder scan:** none — every step shows full code and exact commands.

**Type consistency:** `seedVariantDefaults(form: ProductForm): Record<string, VariantRow>` is defined in Task 2 Step 1 and consumed with the same signature in Task 2 Step 3. `cleanKey`, `variantKey`, `numStr`, `combos`, `emptyVariantRow` all reference existing helpers. `addColor`/`colorsByCode`/`sizeIds` are local to `buildFormFromEdit`.
