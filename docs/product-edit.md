# Shop API — Seller Product Edit / Update / Change-Status

Three new endpoints let a shop employee (seller member) **load a product for editing**, **update it**, and **toggle its purchasability**. They reuse the same logic as the web seller dashboard, so a product updated here behaves exactly like one updated on the website (including the admin-approval flow for sellers that require approval).

---

## Base & headers

**Base URL:** `/api/v1/shop`

All three endpoints require these headers:

| Header | Required | Notes |
|---|---|---|
| `Authorization: Bearer <token>` | ✅ | The logged-in user (Passport). |
| `X-Seller-ID` | ✅ | The seller (shop) id the user is acting for. Determines product ownership **and** which role/permissions apply. |
| `lang` | recommended | Locale (e.g. `en`, `ar`). Defaults to `en`. |
| `country` | recommended | 2-letter ISO (e.g. `AE`). Drives currency conversion of prices. |
| `Content-Type: application/json` | for POST | |

### Permissions
| Endpoint | Required permission (any of) |
|---|---|
| `GET .../edit` | `UPDATE_PRODUCT`, `SUPER_ADMIN` |
| `POST .../update` | `UPDATE_PRODUCT`, `SUPER_ADMIN` |
| `POST .../change-status` | `CHANGE_PRODUCT_STATUS`, `SUPER_ADMIN` |

### Standard response envelope
Success:
```json
{ "isSuccessful": true, "hasContent": true, "code": 200, "message": "…", "detailed_error": null, "data": { … } }
```
Error:
```json
{ "isSuccessful": false, "code": 422, "hasContent": false, "message": "<first error>", "detailed_error": [ { "message": "…" } ], "data": null }
```
Common error codes: `403` (no permission), `404` (product not found / not owned by this seller), `422` (validation).

---

## 1) Get product for edit

```
GET /api/v1/shop/products/{productId}/edit
```

Returns the product's editable columns + precomputed current selections, **plus** `lookups` (all datasets needed to render the form).

### Response `data`
```json
{
  "product": {
    "id": 123,
    "name": "Cotton Shirt",
    "unit": "pc",
    "barcode": "100200300",
    "seller_product_id": "SP-123",
    "description": "…",
    "brand_id": 4,
    "boutique_id": 9,
    "label": null,
    "model_number": "M-12",
    "report_ref_number": null,
    "location_id": null,
    "unit_price": 100.0,
    "discount_price": 80.0,
    "purchase_price": 60.0,
    "luck_price": 0,
    "current_stock": 50,
    "weight": 1.5,
    "max_allowed_qty": 10,
    "count_of_pieces": 1,
    "shipping_cost": 10.0,
    "shipping_days": 3,
    "tax": 5,
    "tax_type": "percent",
    "multiply_qty": 0,
    "packed_after_ordering": 0,
    "meta_title": "…",
    "meta_description": "…",
    "meta_image": "https://media_server.ramaaz.dev/image/upload/product/meta/abc.png",
    "origin_country_iso": "AE",
    "status": 1,
    "request_status": 1,
    "tags_ids": [3, 7],
    "images": ["https://media_server.ramaaz.dev/image/upload/product/img1.png"],
    "selected_categories": { "main": [1], "sub": [10], "sub_sub": [100] },
    "restricted_countries_iso": ["AE", "SA"],
    "extra_price_for_country": [ { "country_iso": "SA", "extra_price": 12.0 } ],
    "selected_colors": ["#FF0000", "#000000"],
    "selected_size_ids": [1, 3],
    "color_image_mappings": [
      { "color_id": 5, "color_code": "#FF0000", "color_name": "Red",
        "images": [ { "image": "img1.png", "position": 0 } ], "position": 0 }
    ],
    "variations": [
      { "id": "uuid", "type": "Red-S", "color_id": 5, "size_id": 1, "location_id": null,
        "sku": "RED-S-1", "barcode": "b1", "unit_price": 100, "discount_price": 80,
        "luck_price": 0, "extra_price": 0, "purchase_price": 60, "quantity": 20, "odoo_id": null }
    ],
    "labels": [2],
    "translations": [
      { "language_code": "en", "name": "Cotton Shirt", "details": "…", "similar_words": null }
    ]
  },
  "lookups": {
    "parent_categories": [ { "id": 1, "name": "Clothing" } ],
    "sub_categories": [ { "id": 10, "name": "Men", "parent_id": 1 } ],
    "sub_sub_categories": [ { "id": 100, "name": "Shirts", "parent_id": 10 } ],
    "boutiques": [ { "id": 9, "name": "My Shop" } ],
    "brands": [ { "id": 4, "name": "Brand X" } ],
    "colors": [ { "id": 5, "code": "#FF0000", "name": "Red" } ],
    "sizes": [ { "id": 1, "name": "S" }, { "id": 3, "name": "M" } ],
    "countries": [ { "id": 1, "iso": "AE", "nicename": "United Arab Emirates", … } ],
    "labels": [ { "id": 2, "label": "New" } ],
    "tags": [ { "id": 3, "name": "summer" } ],
    "descriptor_groups": [ … ],
    "units": ["pc", "kg", "gms", "l"]
  }
}
```

> `sub_categories` / `sub_sub_categories` are pre-filtered to the product's currently selected parents. When the user changes a parent in the UI you should re-fetch the relevant children from your existing category endpoints (same as the website).

---

## 2) Update product

```
POST /api/v1/shop/products/{productId}/update
```

Send the **same field set as the website seller edit form** (the backend runs the identical service + validation). All prices are sent in the **display currency** (driven by the `country` header) and are converted to the store's default currency server-side.

### Core fields
| Field | Type | Notes |
|---|---|---|
| `name` | string | required |
| `unit` | string | one of `pc,kg,gms,l` |
| `barcode` | string | |
| `seller_product_id` | string | must stay unique across the marketplace |
| `description` | string | |
| `brand_id` | int | |
| `boutique_id` | int | |
| `label`, `model_number`, `report_ref_number`, `location_id` | string/int | optional |
| `unit_price` | number | |
| `discount_price` | number | ≤ `unit_price` |
| `purchase_price` | number | |
| `luck_price` | number | optional |
| `current_stock` | number | |
| `weight` | number | required for `pc`/`liter` units |
| `max_allowed_qty` | number | |
| `count_of_pieces` | int | |
| `shipping_cost` | number | |
| `shipping_days` | int | |
| `tax` | number | |
| `tax_type` | string | `percent` or `flat` |
| `multiplyQTY` | `on`/absent | shipping × qty |
| `packed_after_ordering` | `on`/absent | |
| `meta_title`, `meta_description` | string | |
| `meta_image` | string | **filename** returned by the media-server upload (`/upload/bulk`, folder `product/meta`) |
| `origin_country_iso` | string(2) | must exist in `countries.iso` |

### Categories
| Field | Type |
|---|---|
| `category_id[]` | int[] (main) |
| `sub_category_id[]` | int[] |
| `sub_sub_category_id[]` | int[] |

### Labels & tags
- `labels[]` — label ids (max 3)
- `tags_ids[]` — tag ids

### Restricted & origin countries / extra price
- `countries_iso[]` — array of 2-letter isos the product is **restricted** to.
- `extra_price_for_country` — JSON string: `[{"country_iso":"SA","extra_price":12}]`.

### Images (required assignment)
- `images[]` — array of product image **filenames** (already uploaded to the media server `/upload/bulk`, folder `product`).
- `sync_color_images` — **JSON string** mapping colors → ordered images. Required and validated server-side:
  - If colors are selected: **every color must have ≥1 image** and **every uploaded image must be assigned** to a color.
  - If no colors: a single group must contain **all** images ordered by priority.
  ```json
  [
    { "color_code": "#FF0000", "color_name": "Red",
      "images": [ { "image": "img1.png", "position": 0 } ], "position": 0 }
  ]
  ```

### Variations (colors × sizes)
- `colors[]` — array of color **codes** (e.g. `#FF0000`).
- `sizes[]` — array of size **names** (e.g. `S`, `M`).

For **each combination** the server expects a set of flat keys whose suffix is the **variant key** = `"{ColorName}-{SizeName}"` with spaces removed and `.`→`_` (color-only ⇒ just `ColorName`; size-only ⇒ just `SizeName`). Example for Red + S ⇒ `Red-S`:

| Key | Meaning |
|---|---|
| `price_Red-S` | variant unit price |
| `price_Red-S_discount` | variant discount price |
| `price_Red-S_extra` | variant extra price |
| `price_Red-S_luck` | variant luck price |
| `qty_Red-S` | variant quantity |
| `sku_Red-S` | variant SKU (unique per product) |
| `barcode_Red-S` | variant barcode |

> Variant prices must stay within the business-configured allowed percentage of `unit_price` (same rule as the website), otherwise a `422` is returned.

### Translations
- `custom_data[]` — array of `{ language_code, name, description, … }` (one per language). An `en` entry is required to later enable the product.

### Videos (optional)
- `cloud_video` — new uploaded video filename.
- `remove_videos[]` — filenames to remove.

### Response
```json
{ "requires_approval": true }
```
`requires_approval = true` means the seller requires approval and the changes were stored as a **pending change** (not yet live) for an admin to approve; `false` means changes are live immediately.

### Errors
- `422` with the color-image assignment message when `sync_color_images` is incomplete.
- `422` with inherited form validations (discount > price, duplicate `seller_product_id`, variant price out of range, weight required for pc/liter, etc.).

---

## 3) Change status (allow to purchase)

```
POST /api/v1/shop/products/{productId}/change-status
```

Toggles the product's `status` column (the “allow to purchase” switch).

### Body
```json
{ "status": 1 }   // 1 = allow to purchase, 0 = disable
```

### Behaviour
- `status = 0` → always succeeds (disables the product).
- `status = 1` → the product is only enabled if it passes activation checks. If it can't be enabled, you get a `422` listing the blocking reasons.

### Success
```json
{ "isSuccessful": true, "message": "status changed successfully",
  "data": { "status": 1, "warnings": [] } }
```

### Blocked (cannot enable)
```json
{ "isSuccessful": false, "code": 422,
  "message": "not having a boutique",
  "detailed_error": [
    { "message": "you need to be approved" },
    { "message": "Missing Translations:en" },
    { "message": "Stock Out" },
    { "message": "not having a boutique" },
    { "message": "Missing Sync color images." }
  ],
  "data": null }
```

---

## Notes
- **Ownership:** every endpoint scopes the product to `X-Seller-ID` (`products.user_id`) with `added_by = seller`; a product belonging to another seller returns `404`.
- **Currency:** prices in `update` are converted from the request's display currency (from the `country` header) to the store default. Send the same `country`/`lang` headers you use elsewhere.
- **Image URLs:** in the `edit` response, `images` and `meta_image` are full media-server URLs; when you `update`, send back only the **filenames** (the part after `…/image/upload/product/` or `…/product/meta/`).
- **Approval flow:** for sellers requiring approval, `update` records a pending change and the product is hidden from the marketplace until an admin approves — identical to the website.
