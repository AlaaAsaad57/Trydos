# Variant price auto-fill + variant-load fix — Design

**Date:** 2026-07-12
**Area:** Seller dashboard → product editor (`components/SellerDashboard/productEdit/`)
**Status:** Approved (brainstorming), pending implementation plan

## Problem

In the seller product editor, the per-variant price inputs (Price / Discount / Extra / Luck)
are wrong in two related ways:

1. **Real variant data does not load.** When editing an existing product, variants that
   have saved prices render as **empty inputs**. Root cause, confirmed against the real
   `GET /shop/products/{id}/edit` response (`product-edit-json.json`):
   - The Go backend returned `selected_colors: []` for a product that genuinely has a
     colored variant (`variations[0] = { type: "Aqua-S", color_id: 75, size_id: 20,
     unit_price: 60, discount_price: 55, … }`, and `color_image_mappings` carries
     `{ color_id: 75, color_code: "#00FFFF", color_name: "Aqua" }`).
   - `combos()` builds the color×size matrix from `form.colors`, which derives from
     `selected_colors`. Empty `selected_colors` → `form.colors = []` → `combos()` takes
     the *size-only* branch → it emits key `"S"`.
   - `buildFormFromEdit` keys the loaded variation `variantKey(colorName, sizeName)` →
     `"Aqua-S"`.
   - `"Aqua-S" !== "S"`, so every cell falls back to `emptyVariantRow()` → empty inputs.
   - **Latent save corruption:** because `combos()` yields `"S"`, `buildUpdateFormData`
     would post `price_S` instead of `price_Aqua-S`, silently writing the wrong variant
     key on save. The load fix repairs this too.

2. **No auto-fill for empty variant prices.** When a variant has no prices (a newly added
   color/size, or one that loaded empty), the seller must retype every field and cannot
   see what the variant will cost on the website. The product-level prices
   (`unit_price` / `discount_price` / `luck_price`) already exist and are the natural
   defaults, but today only the base `price` inherits `unit_price`, and only at save time.

Part 1 is a **prerequisite** for Part 2: if real prices load as "empty," an auto-fill that
"fills empty fields" would overwrite genuine data. Fixing load makes auto-fill safe by
construction.

## Scope

**In scope**
- Fix variant-price loading in `buildFormFromEdit` (`helpers.ts`).
- Auto-fill empty variant price fields from product-level defaults, as real editable
  values, in `VariantsSection` (`sections.tsx`).

**Out of scope**
- Per-country variant prices (none exist at the variant level).
- `purchase_price` (no variant-level equivalent).
- Changing the save-time fallback in `buildUpdateFormData` (kept as a safety net).
- Any backend change; we make the client resilient to the current Go response.

## Part 1 — Fix variant load (`helpers.ts` → `buildFormFromEdit`)

The backend cannot be trusted to populate `selected_colors`, so reconstruct the selection
axes from reliable sources, and key variations by the backend's own canonical key.

1. **Reconstruct `form.colors`** as the union, deduped by uppercased color code, of:
   - `selected_colors` codes resolved via `colorByCode`, then
   - every color in `color_image_mappings` (`{ code: color_code, name: color_name,
     id: color_id }`), then
   - any distinct **non-zero/non-null** `variation.color_id` resolved via the mappings
     (by id) or `colorById`.
   For the sample product this yields `[{ code: "#00FFFF", name: "Aqua", id: 75 }]`.

2. **Reconstruct `form.sizes`** as the union of `selected_size_ids` and the distinct
   `variation.size_id`s, each resolved via `sizeById`. (Already correct in the sample;
   made robust symmetrically.)

3. **Key the `variations` map by `cleanKey(v.type)`** (e.g. `cleanKey("Aqua-S") === "Aqua-S"`),
   falling back to the existing `variantKey(cName, sName)` only when `v.type` is absent.
   Because `cleanKey` only strips whitespace and replaces `.`—neither touches the `-`
   separator—`cleanKey("<colorName>-<sizeName>")` provably equals `combos()`'s
   `variantKey(colorName, sizeName)`. This guarantees **loaded keys == matrix keys ==
   update-payload keys**.

**Invariants preserved**
- **Colorless / size-only products:** no `color_image_mappings` and `color_id` of `0`/null
  → no color is reconstructed → keys stay size-only, exactly as before.
- **No phantom diffs:** `initial` and `form` are both built from the same reconstruction,
  so `buildDiff` sees them equal until the seller actually edits.
- `SelColor.code` from the mappings (`"#00FFFF"`) matches the key `colorImages` already
  uses (`m.color_code`) and what `buildUpdateFormData` posts as `colors[]`.

## Part 2 — Auto-fill empty variant prices (`sections.tsx` → `VariantsSection`)

Mapping (fill only when the target field is empty; `extra` never auto-fills):

| Variant field | Fills from          |
|---------------|---------------------|
| `price`       | `form.unit_price`   |
| `discount`    | `form.discount_price` |
| `luck`        | `form.luck_price`   |
| `extra`       | — (stays `0`/empty) |

**Values are real and editable** — written into `form.variations` (not placeholders), so
the seller sees exactly what will be saved and shown on the website, and can override any
field. Seeded values therefore appear in the confirm-diff and persist on save (intended).

**Trigger — a `useEffect` keyed on the set of combo keys** (`combos(form).map(c => c.key)`),
not on field values:
- **On mount** → seeds empty price fields of every currently-loaded variant
  ("empty-on-load"). After Part 1, this only touches genuinely-empty variants.
- **When a color/size is toggled on** → the key set changes, the effect re-runs and seeds
  the new combo's empty fields ("newly added").
- Because it keys on the *key set*, editing or **clearing** a price does **not** re-run it,
  so a field the seller deliberately empties is never silently re-filled.

**Implementation shape**
- New pure helper in `helpers.ts`, e.g. `seedVariantDefaults(form): Record<string, VariantRow>`,
  returning a variations map where each current combo is present and its empty
  `price` / `discount` / `luck` are filled from the product defaults. Returns an equivalent
  (deep-equal) map when nothing changes so the effect can skip a needless `patch`.
- `VariantsSection` calls it inside the `useEffect` and `patch`es only if the result differs.

**Safety**
- `price` = `unit_price` stays within the backend's allowed-percentage band → no new 422.
- `qty` / `sku` are untouched → existing `validate()` rules unaffected.

## Validation strategy

No test suite in this repo (per project policy). Validate by:
- `pnpm lint` and a type-check/build pass.
- Manual check against the real product (`product-edit-json.json` shape): open the
  "Portugal T-shirt" editor → the `Aqua-S` row shows price 60 / discount 55 (Part 1);
  add a new color/size → its Price/Discount/Luck prefill from the product-level values
  (Part 2); clear a prefilled field → it stays cleared.

## Rollback

Both parts are confined to `helpers.ts` and `sections.tsx`. Reverting those two files
restores prior behavior; no data migration or backend coordination is involved.
