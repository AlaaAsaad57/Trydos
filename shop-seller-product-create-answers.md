# Shop API — Product Create/Update: Answers (BE → FE)

> **From:** Back-end team
> **To:** Front-end (seller dashboard product editor)
> **Re:** `shop-seller-product-create-gaps-and-questions.md`
>
> Every answer below was verified directly against the code on the current
> branch (not against the docs). Where the two docs disagreed, the code wins;
> where the code itself has a bug, it is flagged as **BE follow-up** with the
> current (buggy) behavior described so you can code defensively.
>
> Source of truth for each answer:
> `routes/api/v1/shop.php`,
> `app/Http/Controllers/api/v1/Shop/ProductController.php`,
> `app/Http/Requests/api/v1/shop/Products/CreateProductRequest.php` (extends
> `app/Http/Requests/Products/StoreProductRequest.php`),
> `app/Http/Requests/Products/UpdateProductRequest.php`,
> `app/Services/ProductService/ProductService.php`
> (`storeFromSellerDashboardLaravel`, `updateFromSellerDashboardLaravel`,
> `assertColorImagesAssignment`, `saveProductVariations`,
> `saveProductColorImages`),
> `app/Domain/Products/Products/DTO/ProductDTO.php`,
> `app/Domain/Products/CustomProducts/DTO/CustomProductDTO.php`,
> `app/CPU/Helpers.php` (`units()`).

---

## Q1 — Canonical endpoints (BLOCKER)

**Canonical pair (the only one that exists):**

```
GET  /api/v1/shop/products/lookups      → ProductController::createLookups
POST /api/v1/shop/products              → ProductController::store
```

`GET /shop/products/create` and `POST /shop/products/add` **do not exist** in
this API and never did — there are no such routes in `routes/api/v1/shop.php`
(or anywhere under `routes/api/`). If the FE is "already calling" them, those
calls can only be failing (404) or hitting a different backend (the legacy
seller web dashboard, which is not this API). There is therefore no migration
window to worry about: wire create to the pair above.

Permissions: `GET /products/lookups` requires `CREATE_PRODUCT` (or
`SUPER_ADMIN`); `POST /products` requires `CREATE_PRODUCT` (or `SUPER_ADMIN`),
enforced by the FormRequest.

The create body is **the same flat shape the update endpoint consumes** — both
are fed to the same service-layer functions (`saveProductVariations`,
`saveProductColorImages`, `assertColorImagesAssignment`, `custom_data` loop).
Differences that remain are listed per-question below.

---

## Q2 (C1) — `sync_color_images`: flag or mapping?

**Mapping. Same shape as update.** The create doc's "0 | 1 flag" is wrong.

- Validation rule: `sync_color_images => nullable|json` — it must be a
  **JSON-encoded string** (see Q4 for the JSON-body implication).
- Decoded shape (read by `assertColorImagesAssignment` and
  `saveProductColorImages`):

```jsonc
[
  {
    "color_code": "#000000",        // matches colors[] entries
    "color_name": "Black",          // optional; code is preferred for lookup
    "images": [                      // or "ordered_images"; items may also be plain strings
      { "image": "abc123.webp", "position": 0 },
      { "image": "def456.webp", "position": 1 }
    ],
    "position": 0                    // group position; defaults to array index
  }
]
```

- This field **is** the color → image assignment. Server-side 422s (thrown by
  `assertColorImagesAssignment`, identical on create and update):
  - no images at all → `At least one product image is required.`
  - colors selected but some color has no image group →
    `Every color must have at least one image assigned.`
  - colors selected but some `images[]` entry appears in no group →
    `All uploaded images must be assigned to colors.`
  - no colors: all images must appear in one general group
    (`color_code` null/absent) → `All product images must be ordered by priority.`
- Matching between `images[]` and the groups is by **exact trimmed string
  equality** of the filename — send identical strings in both places.

---

## Q3 (C2/C3) — colors & sizes: ids or codes/names?

**Codes and names, exactly as update.** The create doc's integer ids are wrong.

- `colors[]` = color **codes** (strings, e.g. `"#000000"`).
  `saveProductVariations` resolves them via `Color::where('code', $item)`, and
  `assertColorImagesAssignment` string-matches them against
  `sync_color_images[].color_code`.
- `sizes[]` = size **names** (e.g. `"S"`).
  `saveProductVariations` resolves them via `Size::where('name', $item)`.
- Confirmed: the edit response's `selected_size_ids` field name is misleading —
  it carries names. Treat "names" as the truth everywhere. (Doc cleanup is a BE
  follow-up.)

---

## Q4 (C4) — JSON or multipart?

**Both parse identically server-side; keep your multipart builder.**

- There are **no file uploads** in this payload (images/videos are filenames of
  already-uploaded media), so multipart vs JSON is purely an encoding choice.
  The backend reads flat keys from `$request->all()` either way.
- **Recommendation: reuse `buildUpdateFormData`** for create. It already
  produces the flat variant keys (`price_Black-S`, `qty_Black-S`, …), indexed
  `custom_data[0][name]`, and JSON-string fields that both endpoints consume —
  one builder, zero drift between add and edit.
- If you ever switch to JSON: beware that `sync_color_images` and
  `extra_price_for_country` are validated with the `json` rule / decoded with
  an `is_string` check, so they must remain **JSON-encoded strings inside the
  JSON body**, not native arrays. This is the main trap; multipart avoids it.

---

## Q5 (C5) — Discount field name

**`discount_price`** — canonical on both create and update.

- Create: rule `discount_price => required|numeric|min:0` (+ must not exceed
  `unit_price`); DTO persists `$data['discount_price']`.
- Update (seller path): DTO reads `$data['discount_price']`.
- The `discount` name in the update doc's table is wrong (it exists only inside
  an old cross-check in the base update request and does nothing useful). Keep
  sending `discount_price`; the doc will be corrected.

---

## Q6 (C6) — Units vocabulary

**Canonical: `["pc", "kg", "gms", "l"]`** — hardcoded in `Helpers::units()` and
enforced on create by `unit => required|in:pc,kg,gms,l`.

- `"liter"` is **invalid** and will 422 on create. The create doc's
  `["pc", "kg", "liter"]` example is wrong.
- Both create lookups and edit lookups return the same `Helpers::units()`
  array, so client validation can rely on one vocabulary.

---

## Q7 (C7) — Weight rule, exactly

Current server behavior (create and update are the same logic):

| unit | weight requirement | what is stored |
|---|---|---|
| `pc` | **required, > 0** | the value you send (float) |
| `kg` | optional | **forced to `1000`** (grams) regardless of what you send |
| `gms` | optional | the value you send, or previous/null |
| `l` | optional | the value you send, or previous/null |

The "required for `pc` or `liter`" branch in the validators literally checks
`in_array($unit, ['pc', 'liter'])` — and since `liter` can never pass the
`in:pc,kg,gms,l` rule, **the requirement is effectively `pc` only**. The
`liter` literal is a latent bug (it almost certainly should be `l`).
**BE follow-up:** fix the validator to `['pc', 'l']`. Until then, FE should
require weight > 0 for `pc`, and *also* for `l` if you want to be
future-proof — sending a valid weight for `l` is harmless today.

On update, if `weight` is omitted the existing product weight is kept.

---

## Q8 (C8) — Lookups nesting

- `GET /shop/products/lookups` (create): datasets sit **flat under `data`** —
  `data.parent_categories`, `data.boutiques`, `data.brands`, `data.colors`,
  `data.sizes`, `data.countries`, `data.labels`, `data.tags`, `data.units`.
- `GET /shop/products/{id}/edit`: `data.product` + `data.lookups.*` (same nine
  keys under `lookups`, plus `sub_categories`, `sub_sub_categories`,
  `descriptor_groups`).

Both are generated from the same `productCreateLookups()` helper, so the
dataset shapes are identical — only the nesting differs, as above. Wire one
reader with a nesting parameter.

---

## Q9 (C9) — Category-lookups permission for create-only roles

**Confirmed gap; you are right.**
`GET /shop/products/categories/{id}/lookups` currently gates on
`UPDATE_PRODUCT` (or `SUPER_ADMIN`) only, so a role holding only
`CREATE_PRODUCT` gets 403 mid-create.

**BE follow-up (accepted):** widen the gate to
`CREATE_PRODUCT OR UPDATE_PRODUCT OR SUPER_ADMIN`. Until that ships, a
create-capable role must also be granted `UPDATE_PRODUCT` to use the create
form's cascading dropdowns — flag this in role setup rather than working
around it client-side.

---

## Q10 — Exhaustive accepted-field behavior on create

General rule first: **nothing unknown 422s.** Laravel ignores extra fields at
validation, and the controller forwards `$request->all()` to the service. So
"422" is never the outcome for the fields you listed — each is either persisted
or silently ignored:

| Field | Create behavior |
|---|---|
| `tags_ids[]` | **Persisted** (`nullable|array`, ids validated `exists:tags,id`; stored JSON-encoded on the product; also flattened into per-language tag names on each custom product). |
| `meta_title`, `meta_description`, `meta_image` | **Persisted** (nullable). |
| `tax`, `tax_type` | **Accepted but unvalidated — avoid sending.** There is an operator-precedence bug: any truthy `tax_type` (including `"percent"`) makes the server treat `tax` as a *flat* amount and currency-convert it. **BE follow-up.** Until fixed: **omit both fields**; the server defaults to `tax = 0`, `tax_type = 'percent'`. |
| `shipping_days` | **Persisted**; defaults to `1` when omitted on create. ⚠️ On **update** the DTO reads it unconditionally — omitting it there errors. Always send it on update (see Q10-note below). |
| `max_allowed_qty` | **Persisted**; explicit `null` is kept as null; omitted → defaults to `1`. Cast int for `pc`, float otherwise. |
| `purchase_price` | **Persisted**; when omitted, defaults to `unit_price`. |
| `luck_price` | **Conditionally honored**: only when the seller's `is_new_products_approval == 1`; otherwise forced to `0` on create (kept unchanged on update). Same condition applies to variant `price_<k>_luck`. |
| `model_number`, `report_ref_number`, `location_id` | **Persisted** (nullable; `location_id` validated `exists:locations,id`). ⚠️ On update, `model_number`/`report_ref_number` are read unconditionally — send them (empty string/null is fine). |
| `countries_iso[]` | **Persisted** on create. On update, honored only when `is_new_products_approval == 1`; otherwise existing value kept. |
| `extra_price_for_country` | **Persisted** (JSON **string**: `[{"country_iso":"SA","extra_price":12}]`; prices are currency-converted). Same approval condition on update as `countries_iso`. |
| `multiplyQTY` | ⚠️ **Precedence bug**: the check is effectively "key present and truthy → 1". Sending the string `"off"` **enables** it. **Send `multiplyQTY = "on"` to enable, and OMIT THE KEY ENTIRELY to disable.** Never send `"off"`. **BE follow-up.** |
| `packed_after_ordering` | Persisted; compared strictly to `"on"` (`"on"` → 1, anything else → 0). Sending `"on"` / omitting is safe. |
| `cloud_video`, `remove_videos[]` | **Silently ignored on create** (`videos` is stored as `null`; there is no video path in the create DTO). **Honored on update** (merge new `cloud_video`, delete `remove_videos[]` from storage). If a video is attached during creation, FE must send it in the follow-up update call. |
| `price_<k>`, `price_<k>_discount`, `price_<k>_extra`, `price_<k>_luck` | **All read** by `saveProductVariations`, plus `qty_<k>`, `sku_<k>`, `barcode_<k>`, `location_id_<k>`, `odoo_id_<k>`. ⚠️ Variant *prices* are only honored when `is_new_products_approval == 1`; otherwise the product's base prices are used. Quantity/sku/barcode are always honored. |

Variant key `<k>` format (must match `saveProductVariations`): color **name**
(resolved from the code you sent in `colors[]`) + `-` + size name, with spaces
stripped and `.` replaced by `_` — e.g. colors `["#000000"]` (name "Black") ×
sizes `["S", "M 2"]` → keys `Black-S`, `Black-M2`.

Two more create-body notes you didn't ask about but will hit:

- `barcode` is **optional on the shop create** (unlike the admin form) but must
  be unique across products when provided.
- Do **not** send `status`: the create DTO reads `$data['status'] ?? 0`, so a
  stray `status=1` would make the product purchasable immediately, bypassing
  the intended "starts inactive" flow. (**BE follow-up:** server will pin this
  to 0.)

**Q10-note (update-only required keys):** the seller-update DTO reads these
keys without fallbacks, so on **update** they are required in practice even
though no validation rule says so: `name`, `unit`, `description`,
`current_stock`, `count_of_pieces`, `shipping_days`, `label`, `barcode`,
`model_number`, `report_ref_number`, `meta_title`, `meta_description`,
`shipping_cost` (null is acceptable for the nullable ones — the *key* must be
present). Your `buildUpdateFormData` already sends all of them; don't strip.

---

## Q11 — Descriptor values cannot round-trip: confirmed, with the missing context

Your analysis is correct, and here is what actually exists server-side:

- **The shop create/update API does not save descriptor values at all.** No key
  in either payload reaches descriptor persistence — a guessed `descriptors`
  key is silently ignored (you were right not to send one).
- Persistence **does exist**, but only as a separate **seller web dashboard**
  endpoint: `ProductController::syncDescriptors` (web route
  `…/sync-descriptors`), payload
  `product_id` + `descriptors[<descriptor_group_id>][<descriptor_id>] = <value>`.
  It prunes null/`"null"` values and does a full delete-and-recreate sync into
  `product_descriptor_groups` / `product_descriptor_group_descriptors`.
- The shop `/edit` response indeed has **no saved-values field**, so prefill is
  currently impossible via this API.

**BE follow-up (new ticket needed):**
1. `POST /api/v1/shop/products/{productId}/descriptors` (or a `descriptors`
   key accepted inside create/update) with the same
   `{group_id: {descriptor_id: value}}` shape as the web endpoint, and
2. a `descriptor_values` field in the `/edit` response
   (`[{descriptor_group_id, descriptor_id, value}]`) for prefill.

Until that ships: descriptor inputs can be rendered but not saved through this
API — do not fake it client-side.

---

## Q12 — `seller_product_id`

**Truly optional server-side, on both create and update.**

- Create: no validation rule; DTO stores `$data['seller_product_id'] ?? null`.
- Update: omitted → existing value kept. When provided, it is applied
  **immediately** (never queued for admin approval) and checked for uniqueness
  against all other products — duplicate → 422
  `Another product has the same ID in the marketplace.`
- FE requiring it is stricter than the server; relax to optional if product
  wants that.

---

## Q13 — `count_of_pieces` 1–100

**Enforced only on create** (`required|integer|min:1|max:100`).
On update there is **no range rule** — but the key itself is required in
practice (the DTO reads it unconditionally; see Q10-note). Out-of-range values
on update would be persisted as-is. **Keep your client-side 1–100 check on
update** until BE mirrors the rule there (**BE follow-up**).

---

## Q14 — Is the new product immediately readable via `/edit`?

**Yes.** `store()` creates the product with `added_by = 'seller'` and
`user_id = <X-Seller-ID>`; `edit()` looks it up `withoutGlobalScopes()` with
exactly those two filters and no status/approval filter. The redirect-to-edit
flow works regardless of `status = 0` or pending approval
(`request_status = 0` when the seller requires product approval, `1`
otherwise).

---

## Q15 — `images[]` value format

**Stored filename strings — identical to update.** Rules:
`images => required|array|min:1`, `images.* => required|string`.

- Not full URLs, not `products/2026/07/...` relative paths — send the same
  last-path-segment filename you already send on update.
- Critically, the exact same string must appear both in `images[]` and inside
  `sync_color_images[].images[].image`; assignment matching is exact trimmed
  string equality (see Q2). A URL in one and a filename in the other =
  guaranteed 422 (`All uploaded images must be assigned to colors.`).
- The create doc's differing example is wrong and will be fixed.

Related: `custom_data` (both endpoints) is consumed per entry as
`{ language_code (required), name (required), description, similar_words,
label_names[] }` — indexed multipart style `custom_data[0][name]` is exactly
what the service iterates.

---

## §6 — Real captured payloads

Agreed that hand-written examples are how the §2 conflicts happened. These
cannot be produced from the code alone — they require a live environment.

**BE action item (owner: backend, environment: staging):** capture and attach
to this doc's folder (`docs/api/captures/`):

1. Raw multipart body + headers of one successful `POST /api/v1/shop/products`
   with 2 colors × 2 sizes, per-color image assignments, `en` + `ar`
   `custom_data`, 1 label, 1 tag, 1 restricted country, 1 per-country extra
   price. (Descriptor values excluded — not supported yet, see Q11.)
2. The matching `POST /api/v1/shop/products/{id}/update` body.
3. The `GET /api/v1/shop/products/{id}/edit` response after both saves.
4. The unedited `GET /api/v1/shop/products/lookups` response.

Until the captures land, the field tables in Q2/Q3/Q10 above are verified
against the code line-by-line and are safe to build against.

---

## Consolidated BE follow-up list (from these answers)

| # | Item | Severity |
|---|---|---|
| 1 | Widen `categoryLookups` gate to `CREATE_PRODUCT OR UPDATE_PRODUCT` (Q9) | High — blocks create-only roles |
| 2 | New descriptor-values endpoint + `/edit` prefill field (Q11) | High — feature gap on create AND update |
| 3 | Fix `multiplyQTY` precedence bug (`"off"` enables it) (Q10) | Medium — data corruption risk |
| 4 | Fix `tax_type` precedence bug (`"percent"` triggers flat conversion) (Q10) | Medium |
| 5 | Pin `status` to 0 on create (ignore client value) (Q10) | Medium — approval bypass |
| 6 | Fix weight validator `'liter'` → `'l'` (Q7) | Low |
| 7 | Mirror `count_of_pieces` 1–100 rule on update (Q13) | Low |
| 8 | Honor `cloud_video` on create or document the two-step video flow (Q10) | Low |
| 9 | Correct the create doc: endpoints, `sync_color_images`, colors/sizes, units, `images[]` example, `discount_price`, lookups nesting | Doc |
| 10 | Capture the four §6 payloads on staging | Doc |
