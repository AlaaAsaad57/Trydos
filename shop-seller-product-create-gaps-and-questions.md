# Shop API — Product Create/Update: Gaps, Conflicts & Questions (FE → BE)

> **From:** Front-end (seller dashboard product editor)
> **To:** Back-end team (ticket `add-shop-product-create-lookups-apis`)
> **Re:** `shop-seller-product.md` (proposed create contract) vs
> `shop-seller-product-boutique-apis.md` (live edit/update contract) vs the
> already-built editor (`components/SellerDashboard/productEdit/*`,
> `services/sellerDashboard/index.ts`).
>
> The **edit / update / change-status / category-lookups** doc matches our wiring
> and works. The **create** contract, as proposed, conflicts with the update
> contract and with what the editor already sends. Before we build (or rewire)
> the create flow, we need the answers below — otherwise we will guess, and a
> wrong guess on fields like `sync_color_images` silently corrupts image/color
> data instead of failing loudly.

---

## 1. BLOCKER — Which create endpoints are canonical? Is anything live?

The proposed doc says create is **not implemented yet** and specifies:

```
GET  /api/v1/shop/products/lookups      (flat lookups under data)
POST /api/v1/shop/products              (flat JSON body)
```

But the front end **already calls** (and the older `docs/product-edit.md` documents):

```
GET  /api/v1/shop/products/create       (lookups under data.lookups, same shape as /edit)
POST /api/v1/shop/products/add          (multipart FormData, mirror of /update)
```

**Q1.** Which pair is canonical? Are `GET /shop/products/create` and
`POST /shop/products/add` live in production today, or do they not exist?
If the new pair replaces them, will the old pair keep working during migration?

Everything below assumes the answer to Q1; several conflicts disappear if the
create body is simply "identical to update".

---

## 2. Direct conflicts between the two documents

| # | Field / topic | Create doc (`shop-seller-product.md`) | Update contract (live, `shop-seller-product-boutique-apis.md` + `docs/product-edit.md`) | Question |
|---|---|---|---|---|
| C1 | `sync_color_images` | `0 \| 1` flag | **JSON string** of mappings: `[{ color_code, color_name, images: [{image, position}], position }]` | **Q2.** Flag or mapping array? If it's a flag on create, **what field carries the color → image assignment**? The create doc says the server 422s on an unassigned image, but as written there is no field to assign images to colors. |
| C2 | `colors` | integer **ids** (`[3, 8]`) | color **codes** (`colors[] = "#000000"`) | **Q3.** Ids or codes? Please make create match update. |
| C3 | `sizes` | integer **ids** (`[1, 2]`) | size **names** (`sizes[] = "S"`) | **Q3** (same). Note the edit response field is even named `selected_size_ids` but contains **names** — please state the truth once. |
| C4 | Body format | `Content-Type: application/json`, flat JSON, `custom_data` as a JSON array | multipart **FormData**, flat variant keys (`price_Red-S`, …), indexed `custom_data[0][name]`, JSON-string fields | **Q4.** JSON or multipart for create? We already have a working multipart builder (`buildUpdateFormData`) shared by edit and add. |
| C5 | Discount field name | `discount_price` | update doc table says `discount`; edit response says `discount_price`; FE sends `discount_price` | **Q5.** One canonical name, please (we assume `discount_price`). |
| C6 | Units vocabulary | example: `["pc", "kg", "liter"]` | live edit lookups return `["pc", "kg", "gms", "l"]` (FE validates against these) | **Q6.** Canonical unit strings? `l` vs `liter`? Is `gms` valid? If create returns `liter` while edit returns `l`, client validation and the weight rule both break. |
| C7 | Weight rule | §4 note says "weight/volume units also require `weight`" but the field table says "required when unit is `pc` or `liter`" (internally contradictory) | "Required (> 0) when `unit` is `pc` or `liter`" | **Q7.** Exact rule: weight is required for which unit values? |
| C8 | Lookups nesting | create lookups sit **flat under `data`** | edit (and current `/products/create`) nest under **`data.lookups`** | **Q8.** Confirm final nesting so we wire the reader once. |
| C9 | Category cascading lookups permission | create flow depends on `GET /shop/products/categories/{id}/lookups` | that endpoint is documented as requiring **`UPDATE_PRODUCT`** | **Q9.** A seller role holding only `CREATE_PRODUCT` cannot load sub-categories / descriptors mid-create. Please accept `CREATE_PRODUCT` **or** `UPDATE_PRODUCT` there. |

---

## 3. Gaps — fields the editor sends today that the create contract never mentions

The create doc claims the payload "matches the existing product update
endpoint's request shape", but documents only a subset. The editor currently
sends **all** of the following on save. For each: **accepted, silently ignored,
or 422?**

- `tags_ids[]` (the create lookups even return `tags`, but the body has no tags field)
- `meta_title`, `meta_description`, `meta_image`
- `tax`, `tax_type`
- `shipping_days`
- `max_allowed_qty`
- `purchase_price`
- `luck_price`
- `model_number`, `report_ref_number`, `location_id`
- `countries_iso[]` (restricted countries)
- `extra_price_for_country` (JSON string: `[{"country_iso":"SA","extra_price":12}]`)
- `multiplyQTY` ("on"), `packed_after_ordering` ("on")
- videos: `cloud_video`, `remove_videos[]`
- per-variant keys beyond the three documented: `price_<k>_discount`,
  `price_<k>_extra`, `price_<k>_luck`, `barcode_<k>`

**Q10.** Please confirm the exhaustive accepted-field list for create (and flag
any of the above that would 422 so we can strip them client-side).

---

## 4. Standing gap — descriptor values cannot round-trip (create AND update)

- The category lookups return `descriptor_groups[].descriptors[]`
  (`string_choice` with JSON-string `options`, or `numeric`). The editor renders
  them and collects `{ descriptor_id → value }`.
- **Neither** the create nor the update contract documents a field to **save**
  those values, and the `/edit` response has **no saved-descriptor-values
  field**, so edit mode always starts empty.
- We deliberately do **not** send a guessed key (a wrong key risks clearing or
  mis-saving data).

**Q11.** What is the request key + shape to save descriptor values on
create/update (e.g. `descriptors: [{descriptor_id, value}]`?), and please add a
selected-values field to the `/edit` response so the form can prefill.

---

## 5. Minor / confirmations

- **Q12.** `seller_product_id`: create doc marks it optional; is it truly
  optional server-side? (FE currently requires it — we'll align to your answer.)
- **Q13.** `count_of_pieces` 1–100: enforced server-side only on create, or on
  update too?
- **Q14.** Create success returns `data.product_id` only — confirm the new
  product is immediately readable via `GET /products/{id}/edit` (we redirect to
  the edit page right after create).
- **Q15.** Confirm `images[]` on create takes the same value we send on update:
  the **stored filename** (last path segment of the media-server URL), not the
  full URL and not a `products/2026/07/...` relative path — the create doc's
  example shows a different shape than what update accepts today.

---

## 6. The ask — real, verified body examples (this is the important part)

Docs drift; working requests don't. To wire **add** and **edit** with zero
guessing, please attach to your reply **real captured payloads** — taken from an
actual successful request against a real environment (Postman collection,
`curl -v`, or a HAR export), not hand-written examples:

1. **One complete, successful `POST …/products` (or `/products/add`) create
   request** for a product that has: 2 colors × 2 sizes (so the variant keys are
   visible), per-color image assignments, 2 translations (`en` + `ar`), at least
   one label, one tag, one restricted country, one per-country extra price, and
   descriptor values — with the **exact raw body** (JSON or the multipart
   field list) and the exact headers.
2. **One complete, successful `POST …/products/{id}/update` request** for the
   same product, same coverage.
3. The **`GET …/products/{id}/edit` response** for that product *after* the
   save, so we can verify every field round-trips (especially descriptor values,
   color-image mappings, and sizes/colors representation).
4. The **create-lookups response** (`GET /products/lookups` or
   `/products/create` — whichever is canonical per Q1), unedited.

With those four artifacts we can wire both flows in one pass and validate our
payload byte-for-byte against a known-good one. Without them, every conflict in
§2 is a coin flip that only surfaces as corrupted product data in production.

---

*FE references: `components/SellerDashboard/productEdit/helpers.ts`
(`buildUpdateFormData`, `validate`), `services/sellerDashboard/index.ts`
(`addProduct`, `updateProduct`, `getProductCreateForm`, `getCategoryLookups`),
`docs/product-edit.md` (the contract the current wiring was built against).*
