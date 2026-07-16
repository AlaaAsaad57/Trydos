# Shop API — Product Create / Create-Lookups (Proposed Contract)

> 🚧 **Status: PROPOSED — not yet implemented.** This is the agreed contract for
> two new endpoints tracked by ticket `add-shop-product-create-lookups-apis`. It is
> shared with the front-end team **for alignment before build**. Field names may
> still change during implementation/review. The already-live product endpoints
> (edit / update / change-status / category-lookups) are documented separately in
> `docs/api/shop-seller-product-boutique-apis.md` and
> `docs/api/shop-product-category-lookups-api.md`.

> 🚫 **There is no delete-product endpoint.** Deleting a product is not permitted in
> TryDos. To take a product off sale, deactivate it via **Change Product Status**
> (`POST /shop/products/{productId}/change-status` with `{ "status": 0 }`).

Two endpoints that let a seller add a product from the Go-Inventory dashboard:
**load the "add product" form data**, and **create** a new product. They mirror the
boutique create/lookups endpoints (`docs/api/shop-boutique-create-delete-apis.md`).

- **Base URL:** `{{host}}/api/v1/shop`
- **Auth:** Laravel Passport (Bearer token) — guard `auth:api`
- **Audience:** Shop / seller dashboard front end

---

## 1. Authentication & Required Headers

| Header | Required | Value | Notes |
| --- | --- | --- | --- |
| `Authorization` | ✅ | `Bearer <access_token>` | Passport token of the logged-in shop user |
| `X-Seller-ID` | ✅ | `<sellerId>` | The seller workspace; drives **tenant scoping** and **permission resolution** |
| `Accept` | ✅ | `application/json` | Forces JSON responses |
| `Content-Type` | ✅ (POST) | `application/json` | For the create body |
| `lang` | ⬜ | e.g. `en`, `ar` | Locale for translated lookup names (defaults to system locale) |

> ⚠️ **`X-Seller-ID` is mandatory.** Without it the server cannot resolve the caller's
> permissions and the request is treated as unauthorized. It also scopes every
> read/write to that seller's own records.

### Permissions

Permissions are resolved **per seller** from the caller's role. `SUPER_ADMIN` bypasses all checks.

| Action | Permission |
| --- | --- |
| Get create lookups | `CREATE_PRODUCT` |
| Create product | `CREATE_PRODUCT` |

---

## 2. Standard Response Envelope

**All** endpoints return this envelope; endpoint-specific payload is under `data`.

### Success

```json
{
  "isSuccessful": true,
  "hasContent": true,
  "code": 200,
  "message": "Data Got",
  "detailed_error": null,
  "data": { }
}
```

### Error

```json
{
  "isSuccessful": false,
  "code": 422,
  "hasContent": false,
  "message": "The name field is required.",
  "detailed_error": [
    { "code": "name", "message": "The name field is required." }
  ],
  "data": null
}
```

- `message` = first error message (safe to show as a toast).
- `detailed_error` = all errors. Validation errors carry a `code` (field name); manually raised errors carry only `{ "message": "..." }`.

### Common Status Codes

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `403` | Caller lacks `CREATE_PRODUCT` → `{"message": "You do not have permission to access."}` |
| `422` | Validation failed |

---

## 3. Get Product Create Lookups

Returns the **product-context-independent** reference datasets to render the
**"add product"** form. Call it once when the create screen opens.

```
GET /api/v1/shop/products/lookups
```

**Permission:** `CREATE_PRODUCT`
**Request body:** none.

**Example**

```
GET /api/v1/shop/products/lookups
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
X-Seller-ID: 55
Accept: application/json
lang: en
```

**Success `200` — `data` shape**

```json
{
  "parent_categories": [ { "id": 2, "name": "Clothing" } ],
  "brands":     [ { "id": 4, "name": "Acme" } ],
  "boutiques":  [ { "id": 7, "name": "My Boutique" } ],
  "colors":     [ { "id": 3, "code": "#000000", "name": "Black" } ],
  "sizes":      [ { "id": 1, "name": "S" } ],
  "countries":  [ /* active countries that have a shipping method */ ],
  "labels":     [ { "id": 1, "label": "New" } ],
  "tags":       [ { "id": 1, "name": "summer" } ],
  "units":      [ "pc", "kg", "liter" ]
}
```

| Field | Type | Description |
| --- | --- | --- |
| `parent_categories[]` | array | Active top-level categories (`parent_id = 0`) — the main category dropdown |
| `brands[]` | array | Active brands |
| `boutiques[]` | array | The **caller's own** boutiques (resolved from `X-Seller-ID`) |
| `colors[]` | array | Available colors (`id`, `code`, `name`) |
| `sizes[]` | array | Available sizes (`id`, `name`) |
| `countries[]` | array | Active countries with a shipping method — for `origin_country_iso` |
| `labels[]` | array | Selectable product labels |
| `tags[]` | array | Selectable tags |
| `units[]` | array | Allowed unit values |

> 🔗 **Sub-categories, sub-sub-categories and descriptor groups are NOT in this
> response.** They depend on the chosen main category, so fetch them on demand from
> **`GET /shop/products/categories/{categoryId}/lookups`** when the user picks a
> category (see `docs/api/shop-product-category-lookups-api.md`).

---

## 4. Create Product

Creates a new product owned by `X-Seller-ID`.

```
POST /api/v1/shop/products
```

**Permission:** `CREATE_PRODUCT`

> ⚠️ **The create payload is FLAT — it does NOT use the `product_global_data` /
> `boutique_custom_data` envelope that the boutique create endpoint uses.** Product
> fields sit at the top level, and per-language rows go under `custom_data[]`. This
> matches the existing product **update** endpoint's request shape.

### Body

```json
{
  "name": "Blue Cotton T-Shirt",
  "default_language_code": "en",
  "description": "Soft cotton tee",
  "seller_product_id": "SKU-1001",
  "barcode": "6291000000001",
  "category_id": [2],
  "sub_category_id": [10],
  "sub_sub_category_id": [55],
  "boutique_id": 7,
  "brand_id": 4,
  "unit": "pc",
  "count_of_pieces": 1,
  "unit_price": 120.0,
  "discount_price": 99.0,
  "current_stock": 50,
  "shipping_cost": 10.0,
  "origin_country_iso": "SA",
  "labels": [1, 3],
  "colors": [3, 8],
  "sizes": [1, 2],
  "sync_color_images": 1,
  "images": [
    "products/2026/07/img-1.webp",
    "products/2026/07/img-2.webp"
  ],
  "custom_data": [
    { "language_code": "en", "name": "Blue Cotton T-Shirt", "description": "Soft cotton tee" },
    { "language_code": "ar", "name": "تيشيرت قطني أزرق", "description": "تيشيرت قطن ناعم" }
  ]
}
```

### Core fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | ✅ | Base product name |
| `default_language_code` | string | ✅ | Base language; must exist in `languages` |
| `description` | string | ✅ | Base product description |
| `category_id` | integer[] | ✅ | One or more active main category ids |
| `boutique_id` | integer | ✅ | One of the caller's boutiques |
| `brand_id` | integer | ✅ | An active brand id |
| `unit` | string | ✅ | One of the `units` from lookups (weight/volume units also require `weight`) |
| `count_of_pieces` | integer | ✅ | Between 1 and 100 |
| `unit_price` | number | ✅ | Base price (≥ 0) |
| `discount_price` | number | ✅ | ≥ 0 and **not greater than** `unit_price` |
| `current_stock` | number | ✅ | Available quantity (≥ 0) |
| `shipping_cost` | number | ✅ | Shipping cost (≥ 0) |
| `images` | string[] | ✅ | At least one already-uploaded image path (see note below) |
| `sub_category_id` | integer[] | ⬜ | From `categories/{categoryId}/lookups` |
| `sub_sub_category_id` | integer[] | ⬜ | From `categories/{categoryId}/lookups` |
| `seller_product_id` | string | ⬜ | Seller's own SKU; **must be unique across the marketplace** |
| `barcode` | string | ⬜ | Optional, but **must be unique** across products when provided |
| `origin_country_iso` | string(2) | ⬜ | ISO-2 code of an active country |
| `labels` | integer[] | ⬜ | Up to 3 label ids |
| `weight` | number | ⬜ | Required when `unit` is `pc` or `liter` |

### Variants & images

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `colors` | integer[] | ⬜ | Selected color ids |
| `sizes` | integer[] | ⬜ | Selected size ids |
| `sync_color_images` | 0 \| 1 | ⬜ | Whether images are grouped per color |
| `price_<variant>` | number | ⬜ | Per-variant price override; must stay within the seller's allowed extra-price % |
| `qty_<variant>` | integer | ⬜ | Per-variant stock |
| `sku_<variant>` | string | ⬜ | Per-variant SKU |

> 🖼️ **Upload images first.** `images[]` are **paths returned by the media/upload
> service**, not raw files. Upload each image, then send the returned paths here.
> Every image must be assigned to a color (when using color variants) or placed in
> the general order group — the server rejects an unassigned image with `422`.

### `custom_data[]` (per-language) fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `language_code` | string | ✅ (per entry) | e.g. `en`, `ar` |
| `name` | string | ✅ (per entry) | Localized product name |
| `description` | string | ⬜ | Localized description |

> 🔒 **A newly created product starts inactive** (`status = 0`) and **pending
> approval** (`request_status = 0`). Activate it later via **Change Product Status**
> (`POST /shop/products/{productId}/change-status` with `{ "status": 1 }`) once it is
> approved — that call validates the activation pre-conditions.

### Success `200`

```json
{
  "isSuccessful": true,
  "code": 200,
  "message": "Product created successfully",
  "data": { "product_id": 4821 }
}
```

- `product_id` — the id of the new product; use it for the follow-up edit / change-status calls.

### Validation `422`

Returned for a missing required field (`name`, `default_language_code`, `description`,
`category_id`, `boutique_id`, `brand_id`, `unit`, `count_of_pieces`, `unit_price`,
`discount_price`, `current_stock`, `shipping_cost`, `images`), a `discount_price`
greater than `unit_price`, a duplicate `barcode` / `seller_product_id`, an
out-of-range per-variant price, or an unassigned image. All messages come back in
`detailed_error`.

---

## 5. Front-End Usage Notes

- **Create flow:** on opening the "add product" screen, call `GET /shop/products/lookups`
  to populate categories/brands/boutiques/colors/sizes/countries/labels/tags/units.
  When the user picks a main category, call
  `GET /shop/products/categories/{categoryId}/lookups` for the dependent sub / sub-sub
  categories and descriptor groups. Upload images to the media service first, then
  `POST /shop/products` with the returned paths.
- **After create**, the product is inactive and pending approval. To request it go
  live, call `POST /shop/products/{product_id}/change-status` with `{ "status": 1 }`.
- **No delete.** Products cannot be deleted. To pull a product from sale, deactivate
  it with `POST /shop/products/{product_id}/change-status` and `{ "status": 0 }`.
- **Payload shape:** product create is **flat** (`name`, `category_id[]`, `custom_data[]`, …)
  — unlike boutique create, which nests under `boutique_global_data` /
  `boutique_custom_data`. Do not reuse the boutique envelope here.
- **Permission-gate the UI:** hide/disable the create button unless the seller has
  `CREATE_PRODUCT` — the API enforces the same rule and returns `403` otherwise.

---

## 6. Quick Reference

| Method | Endpoint | Permission | Body | Success `data` |
| --- | --- | --- | --- | --- |
| GET | `/shop/products/lookups` | `CREATE_PRODUCT` | — | `{ parent_categories, brands, boutiques, colors, sizes, countries, labels, tags, units }` |
| POST | `/shop/products` | `CREATE_PRODUCT` | flat product payload + `custom_data[]` | `{ product_id }` |

**Every request needs:** `Authorization: Bearer …` + `X-Seller-ID: …` + `Accept: application/json`.

See also:
- **`docs/api/shop-product-category-lookups-api.md`** — cascading category → sub / descriptor-group lookups (live).
- **`docs/api/shop-seller-product-boutique-apis.md`** — product & boutique edit / update / change-status (live).
- **`docs/api/shop-boutique-create-delete-apis.md`** — the boutique create/delete/lookups sibling this contract mirrors.
