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

## Task 3: Fix single-file bulk-upload response (`{ url }` vs `{ urls }`)

**Files:**
- Modify: `components/SellerDashboard/productEdit/ProductEditor.tsx:47-60` (`extractNames`)

**Interfaces:**
- Consumes: the raw media-server response from `bulkUploadImages`.
- Produces: `extractNames(data)` now returns the filename(s) for both the multi-file
  (`{ urls: [...] }`) and single-file (`{ url: "..." }`) shapes, so `onUploadImages` and
  `onUploadMeta` no longer throw on a single upload.

- [ ] **Step 1: Handle a scalar `data.url`**

Replace `extractNames` (ProductEditor.tsx:47-60):

```ts
function extractNames(data: any): string[] {
  const arr =
    data?.files ?? data?.urls ?? data?.results ?? data?.data ?? data ?? [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item: any) => {
      const raw =
        typeof item === "string"
          ? item
          : item?.url ?? item?.path ?? item?.file_name ?? item?.name ?? "";
      return fileName(raw);
    })
    .filter(Boolean);
}
```

with (the media server returns `{ url: "..." }` for a single file and
`{ urls: [...] }` for many — mirror the service's `normalizeBulkUpload`):

```ts
function extractNames(data: any): string[] {
  const arr =
    data?.files ??
    data?.urls ??
    data?.results ??
    data?.data ??
    (data?.url ? [data.url] : Array.isArray(data) ? data : []);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item: any) => {
      const raw =
        typeof item === "string"
          ? item
          : item?.url ?? item?.path ?? item?.file_name ?? item?.name ?? "";
      return fileName(raw);
    })
    .filter(Boolean);
}
```

- [ ] **Step 2: Lint + type-check**

Run: `pnpm lint`
Expected: no new errors.

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Manual verification**

With `pnpm dev`, open the product editor in edit mode and upload **exactly one** image
via the Media "Add" tile (device), and one meta image. Both should appear (previously a
single upload failed with "Upload returned no file(s)"). Uploading two-plus images still
works.

- [ ] **Step 4: Commit**

```bash
git add components/SellerDashboard/productEdit/ProductEditor.tsx
git commit -m "fix(product-edit): accept single-file { url } bulk-upload response

The media server returns { url } for one file and { urls } for many; extractNames
handled only the array form, so a single image/meta upload silently returned no
files. Mirror normalizeBulkUpload's scalar-url fallback.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add `GalleryPickerModal`

**Files:**
- Create: `components/SellerDashboard/productEdit/GalleryPickerModal.tsx`

**Interfaces:**
- Consumes: `SellerDashboardService.getProductImages(sellerId, page, perPage)` (returns
  `res.data.images` — `{ id, url|path, name|file_name }[]` + `res.data.meta.last_page`);
  `fileName` from `./helpers`; `DashButton`/`DashIcon` from `components/SellerDashboard/ui`.
- Produces: `export interface PickedImage { url: string; name: string }` and a default
  export `GalleryPickerModal` with props
  `{ sellerId: string; multiple: boolean; onClose: () => void; onPick: (picked: PickedImage[]) => void }`.
  `onPick` is called with `name = fileName(url)` (the filename the update payload expects).

- [ ] **Step 1: Create the modal**

Create `components/SellerDashboard/productEdit/GalleryPickerModal.tsx`:

```tsx
"use client";
import React, { useEffect, useState } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { DashButton, DashIcon } from "components/SellerDashboard/ui";
import { fileName } from "./helpers";

const t = (s: string) => translateFunction(s);

interface GalleryImage {
  id: number | string;
  url?: string;
  path?: string;
  name?: string;
  file_name?: string;
}

export interface PickedImage {
  url: string;
  name: string;
}

export default function GalleryPickerModal({
  sellerId,
  multiple,
  onClose,
  onPick,
}: {
  sellerId: string;
  multiple: boolean;
  onClose: () => void;
  onPick: (picked: PickedImage[]) => void;
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, PickedImage>>({});

  const imgUrl = (im: GalleryImage) => im.url ?? im.path ?? "";
  const imgKey = (im: GalleryImage) => String(im.id ?? imgUrl(im));

  const loadPage = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await SellerDashboardService.getProductImages(sellerId, p, 60);
      const data = res?.data?.images ?? res?.data?.data ?? res?.data ?? [];
      const list: GalleryImage[] = Array.isArray(data) ? data : [];
      setImages((prev) => (p === 1 ? list : [...prev, ...list]));
      const meta = res?.data?.meta ?? res?.meta ?? null;
      setLastPage(Number(meta?.last_page ?? p));
      setPage(p);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "GalleryPickerModal.load", error: msg });
      setError(msg || t("Failed to load gallery"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const toggle = (im: GalleryImage) => {
    const url = imgUrl(im);
    if (!url) return;
    const key = imgKey(im);
    const picked: PickedImage = { url, name: fileName(url) };
    setSelected((prev) => {
      if (prev[key]) {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }
      return multiple ? { ...prev, [key]: picked } : { [key]: picked };
    });
  };

  const chosen = Object.values(selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="relative bg-white rounded-[20px] z-10 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
      >
        <div className="p-5 border-b border-[#ededed] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] bold text-[#3c3c3c]">{t("Choose from gallery")}</h3>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              {multiple ? t("Select one or more images.") : t("Select an image.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center text-[#8e8e8e] text-[18px] leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-auto">
          {error ? (
            <div className="text-center py-10">
              <p className="text-[13px] text-[#f85555] mb-3">{error}</p>
              <DashButton size="sm" variant="secondary" onClick={() => loadPage(1)}>
                {t("Retry")}
              </DashButton>
            </div>
          ) : images.length === 0 && !loading ? (
            <p className="text-center text-[13px] text-[#8e8e8e] py-10">
              {t("No images in your gallery yet.")}
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((im) => {
                const key = imgKey(im);
                const on = !!selected[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(im)}
                    className={`relative aspect-square rounded-[12px] overflow-hidden border-2 transition-colors ${
                      on ? "border-[#5d5d5d]" : "border-transparent opacity-85 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl(im)} alt="" className="w-full h-full object-cover" />
                    {on && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#5d5d5d] text-white flex items-center justify-center">
                        <DashIcon name="check" size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {page < lastPage && !error && (
            <div className="text-center mt-4">
              <DashButton
                size="sm"
                variant="secondary"
                loading={loading}
                onClick={() => loadPage(page + 1)}
              >
                {t("Load more")}
              </DashButton>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#ededed] flex gap-3">
          <DashButton variant="ghost" fullWidth onClick={onClose}>
            {t("Cancel")}
          </DashButton>
          <DashButton
            icon="check"
            fullWidth
            disabled={chosen.length === 0}
            onClick={() => {
              onPick(chosen);
              onClose();
            }}
          >
            {t("Add selected")}
            {chosen.length ? ` (${chosen.length})` : ""}
          </DashButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint + type-check**

Run: `pnpm lint`
Expected: no new errors in `GalleryPickerModal.tsx`.

Run: `npx tsc --noEmit`
Expected: passes. (If `DashIcon`'s `name` type rejects `"check"`, that name is already
used elsewhere in the codebase, e.g. `ProductEditor.tsx` — it is valid.)

- [ ] **Step 3: Commit**

```bash
git add components/SellerDashboard/productEdit/GalleryPickerModal.tsx
git commit -m "feat(product-edit): add GalleryPickerModal for choosing existing images

Lists the seller's uploaded images via getProductImages with multi/single select
and pagination; returns { url, name } (name = fileName(url)). No consumer yet.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire the gallery-vs-device menu into the pickers

**Files:**
- Modify: `components/SellerDashboard/productEdit/sections.tsx` (imports; `SectionProps`; add `SourceMenu`; `MediaSection`; `SeoSection`)
- Modify: `components/SellerDashboard/productEdit/ProductEditor.tsx:345-355` (`sectionProps`)

**Interfaces:**
- Consumes: `GalleryPickerModal` (Task 4), `ImageItem` + `fileName` from `./helpers`,
  `has("READ_PRODUCT_IMAGES")` from `ProductEditor`.
- Produces: `SectionProps` extended with `sellerId: string` and `canUseGallery?: boolean`;
  `MediaSection`/`SeoSection` render a `SourceMenu` (gallery vs device) when `canUseGallery`.

- [ ] **Step 1: Extend imports and `SectionProps` in sections.tsx**

Update the helpers import (sections.tsx:10-17) to add `ImageItem`, `fileName`, and the
modal import:

```ts
import {
  combos,
  ProductForm,
  Lookups,
  UNITS,
  VariantRow,
  emptyVariantRow,
  seedVariantDefaults,
  ImageItem,
  fileName,
} from "./helpers";
import GalleryPickerModal from "./GalleryPickerModal";
```

Add two fields to `SectionProps` (after `uploading` at sections.tsx:30):

```ts
  uploading?: { images?: boolean; meta?: boolean; video?: boolean };
  sellerId: string;
  canUseGallery?: boolean;
}
```

- [ ] **Step 2: Add the `SourceMenu` popover**

Add this local (non-exported) component just above `MediaSection` (sections.tsx:492):

```tsx
/** Small two-choice popover: pick from the gallery or upload from the device.
 *  `trigger` renders the button that toggles the menu. */
function SourceMenu({
  onGallery,
  onDevice,
  trigger,
}: {
  onGallery: () => void;
  onDevice: () => void;
  trigger: (toggle: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {trigger(() => setOpen((v) => !v))}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-40 mt-1 min-w-[200px] bg-white rounded-[12px] border border-[#ededed] p-1.5"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
          >
            <button
              type="button"
              onClick={() => { setOpen(false); onGallery(); }}
              className="w-full flex items-center gap-2.5 px-3 h-[40px] rounded-[10px] text-[13px] text-[#3c3c3c] hover:bg-[#f4f4f4] text-left"
            >
              <DashIcon name="gallery" size={16} /> {t("Choose from gallery")}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onDevice(); }}
              className="w-full flex items-center gap-2.5 px-3 h-[40px] rounded-[10px] text-[13px] text-[#3c3c3c] hover:bg-[#f4f4f4] text-left"
            >
              <DashIcon name="upload" size={16} /> {t("Upload from device")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire `MediaSection` (product images, multi-select)**

Change the `MediaSection` signature (sections.tsx:493) and add state + handlers at the top
of its body:

```tsx
export function MediaSection({ form, patch, errors, disabled, onUploadImages, uploading, sellerId, canUseGallery }: SectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openDevice = () => fileRef.current?.click();
  const addFromGallery = (picked: { url: string; name: string }[]) => {
    const existing = new Set(form.images.map((i) => i.name));
    const items: ImageItem[] = picked
      .filter((p) => p.name && !existing.has(p.name))
      .map((p) => ({ name: p.name, url: p.url, isNew: true }));
    if (items.length) patch({ images: [...form.images, ...items] });
  };
  const addTile = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full aspect-square rounded-[12px] border border-dashed border-[#cfcfcf] bg-[#fafafa] flex flex-col items-center justify-center gap-1.5 text-[#8e8e8e] hover:border-[#5d5d5d] hover:text-[#5d5d5d] transition-colors"
    >
      {uploading?.images ? (
        <span className="text-[11px]">{t("Uploading…")}</span>
      ) : (
        <>
          <DashIcon name="plus" size={22} />
          <span className="text-[11px] medium">{t("Add")}</span>
        </>
      )}
    </button>
  );
  const move = (i: number, dir: -1 | 1) => {
```

(Leave the existing `move` / `remove` bodies unchanged.)

Replace the Add-tile block (sections.tsx:539-550) with:

```tsx
        {!disabled &&
          (canUseGallery ? (
            <SourceMenu
              onGallery={() => setPickerOpen(true)}
              onDevice={openDevice}
              trigger={(toggle) => addTile(toggle)}
            />
          ) : (
            addTile(openDevice)
          ))}
```

Replace the trailing hidden input + close (sections.tsx:552-553) with the input plus the
modal:

```tsx
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { const fs = Array.from(e.target.files || []); if (fs.length) onUploadImages?.(fs); e.target.value = ""; }} />
      {pickerOpen && (
        <GalleryPickerModal
          sellerId={sellerId}
          multiple
          onClose={() => setPickerOpen(false)}
          onPick={addFromGallery}
        />
      )}
    </Section>
  );
}
```

- [ ] **Step 4: Wire `SeoSection` (meta image, single-select)**

Change the `SeoSection` signature (sections.tsx:460) and add state + handler:

```tsx
export function SeoSection({ form, patch, disabled, onUploadMeta, uploading, sellerId, canUseGallery }: SectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openDevice = () => fileRef.current?.click();
  const pickMeta = (picked: { url: string; name: string }[]) => {
    const p = picked[0];
    if (p) patch({ meta_image: p.name, meta_image_url: p.url });
  };
```

Replace the `{!disabled && (...)}` block (sections.tsx:479-486) with:

```tsx
          {!disabled && (
            <div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadMeta?.(f); e.target.value = ""; }} />
              {canUseGallery ? (
                <SourceMenu
                  onGallery={() => setPickerOpen(true)}
                  onDevice={openDevice}
                  trigger={(toggle) => (
                    <DashButton type="button" variant="secondary" size="sm" icon="upload" loading={!!uploading?.meta} onClick={toggle}>
                      {form.meta_image ? t("Change Image") : t("Add Image")}
                    </DashButton>
                  )}
                />
              ) : (
                <DashButton type="button" variant="secondary" size="sm" icon="upload" loading={!!uploading?.meta} onClick={openDevice}>
                  {form.meta_image ? t("Change Image") : t("Upload Image")}
                </DashButton>
              )}
            </div>
          )}
```

Add the modal just before the `SeoSection` closing `</Section>` (sections.tsx:488):

```tsx
      {pickerOpen && (
        <GalleryPickerModal
          sellerId={sellerId}
          multiple={false}
          onClose={() => setPickerOpen(false)}
          onPick={pickMeta}
        />
      )}
    </Section>
  );
}
```

- [ ] **Step 5: Supply the new props from `ProductEditor`**

In `ProductEditor.tsx`, add `sellerId` and `canUseGallery` to the `sectionProps` object
(ProductEditor.tsx:345-355):

```ts
  const sectionProps: SectionProps = {
    form,
    patch,
    errors,
    lookups,
    disabled: !editMode,
    onUploadImages,
    onUploadMeta,
    onUploadVideo,
    uploading,
    sellerId,
    canUseGallery: has("READ_PRODUCT_IMAGES"),
  };
```

- [ ] **Step 6: Lint + type-check**

Run: `pnpm lint`
Expected: no new errors.

Run: `npx tsc --noEmit`
Expected: passes (every `SectionProps` consumer now receives `sellerId`).

- [ ] **Step 7: Manual verification**

With `pnpm dev`, open the product editor in edit mode (as a seller with
`READ_PRODUCT_IMAGES`):
1. Click the Media **Add** tile → a menu shows **Choose from gallery** / **Upload from device**.
2. **Choose from gallery** → modal lists your uploaded images; select several → **Add selected (n)** → they appear in the grid (duplicates by filename are skipped).
3. **Upload from device** → the normal file dialog opens (unchanged).
4. In **SEO / Meta**, the meta-image button offers the same menu; picking from the gallery sets the meta preview + filename; single-select only.
5. As a seller **without** `READ_PRODUCT_IMAGES`, both pickers behave exactly as before (no menu, device-only).

- [ ] **Step 8: Commit**

```bash
git add components/SellerDashboard/productEdit/sections.tsx components/SellerDashboard/productEdit/ProductEditor.tsx
git commit -m "feat(product-edit): offer gallery-or-device menu on image pickers

MediaSection (multi) and SeoSection (single) show a source menu that opens
GalleryPickerModal for reusing already-uploaded images, gated on READ_PRODUCT_IMAGES.

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
- Part 3a single-file `{ url }` fix → Task 3 ✓
- Part 3b gallery picker (getProductImages, multi/single, name=fileName(url)) → Task 4 ✓
- Part 3b menu on product + meta pickers, permission-gated, GalleryTab untouched → Task 5 ✓

**Placeholder scan:** none — every step shows full code and exact commands.

**Type consistency:**
- `seedVariantDefaults(form: ProductForm): Record<string, VariantRow>` — defined Task 2 Step 1, consumed Task 2 Step 3 with the same signature.
- `PickedImage { url, name }` and `GalleryPickerModal` default export (Task 4) are consumed in Task 5 (`addFromGallery`/`pickMeta` take `{ url, name }[]`; `<GalleryPickerModal sellerId multiple onClose onPick />`).
- `SectionProps.sellerId` / `canUseGallery` — added in Task 5 Step 1, supplied in Task 5 Step 5, consumed in `MediaSection`/`SeoSection`. Every other `SectionProps` consumer (CoreSection, PricingSection, etc.) receives the same `sectionProps` object, so `sellerId` is present for all.
- `ImageItem`, `fileName`, `combos`, `emptyVariantRow`, `cleanKey`, `variantKey`, `numStr` all reference existing `helpers.ts` exports.
- `DashIcon` names used (`gallery`, `upload`, `check`, `plus`) are all already used elsewhere in the codebase.
