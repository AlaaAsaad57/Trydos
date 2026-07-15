# Shop API — Seller Product & Boutique Management

APIs for the Go-Inventory (Shop) seller dashboard to **edit**, **update**, and **change the status** of a seller's own products and boutiques.

- **Base URL:** `{{host}}/api/v1/shop`
- **Auth:** Laravel Passport (Bearer token) — guard `auth:api`
- **Audience:** Shop / seller dashboard front end

---

## 1. Authentication & Required Headers

Every request in this document must include:

| Header | Required | Value | Notes |
| --- | --- | --- | --- |
| `Authorization` | ✅ | `Bearer <access_token>` | Passport token of the logged-in shop user |
| `X-Seller-ID` | ✅ | `<sellerId>` | The boutique/seller workspace being acted on. Drives **tenant scoping** and **permission resolution**. |
| `Accept` | ✅ | `application/json` | Forces JSON error responses |
| `Content-Type` | ✅ (POST) | `application/json` | For `update` / `change-status` bodies |
| `lang` | ⬜ | e.g. `en`, `ar` | Locale for translated content (defaults to `en`) |

> ⚠️ **`X-Seller-ID` is mandatory.** Without it the server cannot resolve the caller's permissions for that seller and the request will be treated as unauthorized. It also scopes every read/write to that seller's own records.

### Permissions

Permissions are resolved **per seller** from the caller's role in that seller workspace. `SUPER_ADMIN` bypasses all checks.

| Action | Product permission | Boutique permission |
| --- | --- | --- |
| `edit` | `UPDATE_PRODUCT` | `UPDATE_BUTIKS` |
| `update` | `UPDATE_PRODUCT` | `UPDATE_BUTIKS` |
| `change-status` | `CHANGE_PRODUCT_STATUS` | `CHANGE_BOUTIQUE_STATUS` |

---

## 2. Standard Response Envelope

**All** endpoints return this envelope.

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
  "message": "Product name is required!",
  "detailed_error": [
    { "code": "name", "message": "Product name is required!" }
  ],
  "data": null
}
```

- `message` = first error message (safe to show directly as a toast).
- `detailed_error` = array of all errors. Validation errors include a `code` (the field name); manually raised errors may contain only `{ "message": "..." }`.

### Common Status Codes

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `403` | Caller lacks the required permission → `{"message": "You do not have permission to access."}` |
| `404` | Record not found **or not owned by `X-Seller-ID`** → `{"message": "Product not found."}` / `"Boutique not found."` |
| `422` | Validation failed / business rule blocked the action |

> 🔒 A record that exists but belongs to another seller returns **`404`** (not `403`) on purpose, so existence is never leaked across sellers.

---

# PRODUCTS

## 3.1 Get Product for Editing

Returns the seller-editable columns of a product plus all lookup datasets needed to render the edit form.

```
GET /api/v1/shop/products/{productId}/edit
```

**Path params**

| Name | Type | Description |
| --- | --- | --- |
| `productId` | integer | The product id (must be owned by `X-Seller-ID` and `added_by = seller`) |

**Success `200` — `data` shape**

```json
{
  "product": {
    "id": 123,
    "name": "Cotton T-Shirt",
    "unit": "pc",
    "barcode": "628...",
    "seller_product_id": "SKU-001",
    "description": "…",
    "brand_id": 5,
    "boutique_id": 12,
    "label": null,
    "model_number": null,
    "report_ref_number": null,
    "location_id": 3,
    "unit_price": 100,
    "discount_price": 10,
    "purchase_price": 60,
    "luck_price": 0,
    "current_stock": 50,
    "weight": 0.3,
    "max_allowed_qty": 10,
    "count_of_pieces": 1,
    "shipping_cost": 0,
    "shipping_days": 3,
    "tax": 0,
    "tax_type": "percent",
    "multiply_qty": 0,
    "packed_after_ordering": 0,
    "meta_title": null,
    "meta_description": null,
    "meta_image": "https://…/meta/xyz.webp",
    "origin_country_iso": "TR",
    "status": 1,
    "request_status": 1,
    "tags_ids": [1, 4],
    "images": ["https://…/product/a.webp", "https://…/product/b.webp"],
    "selected_categories": { "main": [2], "sub": [10], "sub_sub": [55] },
    "restricted_countries_iso": ["SA", "AE"],
    "extra_price_for_country": [ /* … */ ],
    "selected_colors": ["#000000", "#ffffff"],
    "selected_size_ids": ["S", "M", "L"],
    "color_image_mappings": [
      { "color_id": 3, "color_code": "#000000", "color_name": "Black", "images": ["…"], "position": 1 }
    ],
    "variations": [
      { "id": 9, "type": "Black-S", "color_id": 3, "size_id": 1, "location_id": 3,
        "sku": "…", "barcode": "…", "unit_price": 100, "discount_price": 10,
        "luck_price": 0, "extra_price": 0, "purchase_price": 60, "quantity": 5, "odoo_id": null }
    ],
    "labels": [1, 2],
    "translations": [
      { "language_code": "en", "name": "Cotton T-Shirt", "details": "…", "similar_words": "…" },
      { "language_code": "ar", "name": "…", "details": "…", "similar_words": "…" }
    ]
  },
  "lookups": {
    "parent_categories":   [ { "id": 2, "name": "Clothing" } ],
    "sub_categories":      [ { "id": 10, "name": "T-Shirts", "parent_id": 2 } ],
    "sub_sub_categories":  [ { "id": 55, "name": "Basic", "parent_id": 10 } ],
    "boutiques":           [ { "id": 12, "name": "My Boutique" } ],
    "brands":              [ { "id": 5, "name": "BrandX" } ],
    "colors":              [ { "id": 3, "code": "#000000", "name": "Black" } ],
    "sizes":               [ { "id": 1, "name": "S" } ],
    "countries":           [ /* active countries with shipping methods */ ],
    "labels":              [ /* … */ ],
    "tags":                [ { "id": 1, "name": "new" } ],
    "descriptor_groups":   [ /* … */ ],
    "units":               [ "pc", "kg", "liter", "…" ]
  }
}
```

> `sub_categories` / `sub_sub_categories` are pre-filtered to the product's currently selected parents. When the user changes a parent selection, reload children from the categories lookup / a category endpoint accordingly.

---

## 3.2 Update Product

Saves the seller's edits. The request body mirrors the `product` object returned by **Get Product for Editing** (send back the full edited form).

```
POST /api/v1/shop/products/{productId}/update
```

**Body — commonly used fields**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | ✅ | |
| `unit` | string | ⬜ | e.g. `pc`, `kg`, `liter` |
| `unit_price` | number | ⬜ | Must be ≥ `discount` |
| `discount` | number | ⬜ | Cannot be ≥ price |
| `purchase_price` | number | ⬜ | |
| `weight` | number | ⬜ | Required (> 0) when `unit` is `pc` or `liter` |
| `origin_country_iso` | string(2) | ⬜ | Must exist in `countries.iso` |
| `brand_id` | integer | ⬜ | |
| `boutique_id` | integer | ⬜ | One of the seller's boutiques |
| `seller_product_id` | string | ⬜ | Must be unique across the marketplace |
| `category selections`, `colors`, `sizes`, `choice_options`, `variations`, `images`, `translations`, `tags_ids`, `labels` | mixed | ⬜ | Same structure as the edit response; variation prices are constrained to ±`allowed_extra_price_percent` of `unit_price` |

> The product form is rich (variations, per-color images, per-country extra prices, choice options). **Rule of thumb:** take the `product` object from `/edit`, apply the user's changes, and POST it back. Server-side validation returns field-level `422` errors via `detailed_error`.

**Success `200` — `data` shape**

```json
{ "requires_approval": true }
```

- `requires_approval` — `true` when the edit must be approved before going live (e.g. a seller editing an already-approved product). Surface this to the user.

---

## 3.3 Change Product Status

Toggles the product's purchasability (`status` column). Enabling validates activation preconditions.

```
POST /api/v1/shop/products/{productId}/change-status
```

**Body**

| Field | Type | Required | Allowed |
| --- | --- | --- | --- |
| `status` | integer | ✅ | `0` (inactive) or `1` (active) |

```json
{ "status": 1 }
```

**Success `200`**

```json
{
  "isSuccessful": true,
  "code": 200,
  "message": "status changed successfully",
  "data": { "status": 1, "warnings": [] }
}
```

- `warnings` — non-blocking messages returned alongside a successful change.

**Blocked `422`** — when enabling a product that fails activation checks:

```json
{
  "isSuccessful": false,
  "code": 422,
  "message": "you need to be approved",
  "detailed_error": [ { "message": "you need to be approved" } ],
  "data": null
}
```

---

## 3.4 Get Category Cascading Lookups

Given a category id, returns its **sub categories**, **sub-sub categories**, and the **descriptor groups (with descriptors)** linked to that category branch. Use it to populate the dependent dropdowns/attribute inputs when the user selects a category in the product edit form.

```
GET /api/v1/shop/products/categories/{categoryId}/lookups
```

**Path params**

| Name | Type | Description |
| --- | --- | --- |
| `categoryId` | integer | The selected (main/parent) category id |

**Permission:** `UPDATE_PRODUCT` (or `SUPER_ADMIN`).

**Behavior**

- `sub_categories` — active direct children of `categoryId` (`parent_id = categoryId`).
- `sub_sub_categories` — active children of those sub categories.
- `descriptor_groups` — descriptor groups attached to **any category in the branch** (the category itself + its sub / sub-sub categories), each with its `descriptors` nested.
- An unknown or childless category returns empty arrays (still `200`), not an error.

**Success `200` — `data` shape**

```json
{
  "sub_categories": [
    { "id": 10, "name": "T-Shirts", "parent_id": 2 },
    { "id": 11, "name": "Shirts", "parent_id": 2 }
  ],
  "sub_sub_categories": [
    { "id": 55, "name": "Basic", "parent_id": 10 },
    { "id": 56, "name": "Graphic", "parent_id": 10 }
  ],
  "descriptor_groups": [
    {
      "id": 3,
      "name": "Material",
      "descriptors": [
        { "id": 21, "name": "Cotton", "descriptor_group_id": 3 },
        { "id": 22, "name": "Polyester", "descriptor_group_id": 3 }
      ]
    }
  ]
}
```

> Category/descriptor `name` fields are localized by the `lang` header. `descriptor_groups[].descriptors[]` are the selectable values for each group.

---

# BOUTIQUES

## 4.1 Get Boutique for Editing

Returns the seller-editable columns of a boutique plus lookups for the edit form.

```
GET /api/v1/shop/boutiques/{boutiqueId}/edit
```

**Path params**

| Name | Type | Description |
| --- | --- | --- |
| `boutiqueId` | integer | The boutique id (must be owned by `X-Seller-ID` and `added_by_type = seller`) |

**Success `200` — `data` shape**

```json
{
  "boutique": {
    "id": 12,
    "name": "My Boutique",
    "slug": "my-boutique-12",
    "description": "…",
    "bio": "…",
    "icon": "https://…/boutiques/boutiques/icon/xyz.webp",
    "position": 0,
    "status": 1,
    "request_status": 1,
    "availability": 3,
    "restricted_countries_iso": ["SA", "AE"],
    "resource_types": ["product"],
    "related_product_ids": [123, 124, 130],
    "translations": [
      {
        "id": 45,
        "language_code": "en",
        "name": "My Boutique",
        "description": "…",
        "bio": "…",
        "icon": "https://…/boutiques/boutiques/icon/en.webp",
        "banners": [
          { "id": 7, "banner": "https://…/boutiques/boutiques/banner1.webp", "sequence": 1 }
        ]
      }
    ]
  },
  "lookups": {
    "categories": [ { "id": 2, "name": "Clothing" } ],
    "colors":     [ { "id": 3, "code": "#000000", "name": "Black" } ],
    "sizes":      [ { "id": 1, "name": "S" } ],
    "countries":  [ /* active countries with shipping methods */ ],
    "languages":  [ /* languages used in the system */ ],
    "availabilities": [
      { "value": 1, "label": "Web" },
      { "value": 2, "label": "Mobile" },
      { "value": 3, "label": "WebMobile" }
    ]
  }
}
```

**Field reference**

| Field | Meaning |
| --- | --- |
| `status` | `0` inactive / `1` active (change only via `change-status`) |
| `request_status` | Moderation state managed by admin (read-only here) |
| `availability` | `1` Web · `2` Mobile · `3` Web+Mobile |
| `restricted_countries_iso` | ISO codes the boutique is limited to (empty = all) |
| `related_product_ids` | Products currently attached to the boutique |
| `translations[]` | Per-language name/description/bio/icon/banners |

---

## 4.2 Update Boutique

Saves the seller's edits. Uses a nested payload: global data + per-language translations.

```
POST /api/v1/shop/boutiques/{boutiqueId}/update
```

**Body**

The payload has two parts: `boutique_global_data` (the boutique's own row, including its **global icon**) and `custom_data[]` — one entry per language, each carrying that language's **name/description/bio**, its own **icon**, and its own ordered list of **banners**.

```json
{
  "boutique_global_data": {
    "name": "My Boutique",
    "availability": 3,
    "description": "Updated description",
    "bio": "Updated bio",
    "icon": "boutiques/boutiques/icon/global-icon.webp",
    "countries_iso": ["SA", "AE"],
    "product_resources": [123, 124, 130]
  },
  "custom_data": [
    {
      "id": 45,
      "language_code": "en",
      "name": "My Boutique",
      "description": "English description",
      "bio": "English bio",
      "icon": "boutiques/boutiques/icon/en-icon.webp",
      "banners": [
        { "id": 7, "file_path": "boutiques/boutiques/en-banner-1.webp", "sequence": 1 },
        { "id": 8, "file_path": "boutiques/boutiques/en-banner-2.webp", "sequence": 2 },
        {           "file_path": "boutiques/boutiques/en-banner-new.webp", "sequence": 3 }
      ]
    },
    {
      "id": 46,
      "language_code": "ar",
      "name": "متجري",
      "description": "الوصف بالعربية",
      "bio": "نبذة بالعربية",
      "icon": "boutiques/boutiques/icon/ar-icon.webp",
      "banners": [
        { "id": 11, "file_path": "boutiques/boutiques/ar-banner-1.webp", "sequence": 1 }
      ]
    }
  ]
}
```

> **Uploading images first.** `icon` and `banners[].file_path` are **filenames returned by the media/upload service**, not raw files — upload the image first, then send back the returned path here. Send an existing stored filename unchanged to keep the current image.

**`boutique_global_data` fields**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string(≤255) | ✅ | Unique across boutiques (excluding this one) |
| `availability` | integer | ✅ | `1` Web · `2` Mobile · `3` Web+Mobile |
| `description` | string | ⬜ | |
| `bio` | string | ⬜ | |
| `icon` | string(≤191) | ⬜ | Filename of an already-uploaded icon |
| `countries_iso` | string[] | ⬜ | ISO codes; omit/empty = available everywhere |
| `product_resources` | integer[] | ⬜ | Product ids to attach to the boutique |

**`custom_data[]` (per-language translation) fields**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | integer | ⬜ | Existing translation (custom boutique) id — omit to create a new language row |
| `name` | string(≤255) | ✅ (if `custom_data` present) | Localized boutique name |
| `language_code` | string(≤10) | ⬜ | e.g. `en`, `ar` |
| `category_id` | integer | ⬜ | Optional category association for this language |
| `description` | string | ⬜ | |
| `bio` | string | ⬜ | |
| `icon` | string(≤191) | ⬜ | Per-language icon **filename** (already uploaded). Omit to keep the current icon. |
| `banners` | array | ⬜ | Ordered banner list for this language (see below). Omit the key to leave banners untouched. |

**`custom_data[].banners[]` fields**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | integer | ⬜ | Existing banner id — include it to **keep/update** that banner; omit it to **create** a new banner |
| `file_path` | string(≤191) | ⬜ | Banner image **filename** (already uploaded). Send the existing stored path to keep the same image. |
| `sequence` | integer | ✅ (per banner) | Display order (1-based) |

> ⚠️ **Banners are a full-replace list, per language.** For each `custom_data` entry, any existing banner whose `id` is **not** present in the submitted `banners` array is **deleted**. To keep a banner, echo it back with its `id`. To reorder, resend all banners with new `sequence` values. Sending `banners: []` removes all banners for that language; **omitting the `banners` key entirely** leaves them unchanged.

> 🖼️ **Two icon levels.** `boutique_global_data.icon` is the boutique's global icon; each `custom_data[].icon` is the per-language icon shown for that locale. They are independent — set whichever the UI edits.

> 🔒 **`update` never changes `status` / `request_status` / `position`** — those are pinned to their current values server-side. Use **Change Boutique Status** to activate/deactivate.

**Success `200`**

```json
{
  "isSuccessful": true,
  "code": 200,
  "message": "Boutique updated successfully",
  "data": []
}
```

**Validation `422`** — e.g. duplicate name or missing required field, returned via `detailed_error`.

---

## 4.3 Change Boutique Status

Toggles the boutique's active status (`status` column). Enabling validates activation preconditions.

```
POST /api/v1/shop/boutiques/{boutiqueId}/change-status
```

**Body**

| Field | Type | Required | Allowed |
| --- | --- | --- | --- |
| `status` | integer | ✅ | `0` (inactive) or `1` (active) |

```json
{ "status": 1 }
```

**Success `200`**

```json
{
  "isSuccessful": true,
  "code": 200,
  "message": "status changed successfully",
  "data": { "status": 1, "warnings": [] }
}
```

**Blocked `422`** — when enabling a boutique that fails activation checks. Possible messages:

- `"you need to be approved"` — boutique not yet approved / seller suspended
- `"Missing Translations"` — some active languages have no translation
- `"This Boutique Didn't Have active Related Products."` — no active products attached

```json
{
  "isSuccessful": false,
  "code": 422,
  "message": "Missing Translations",
  "detailed_error": [ { "message": "Missing Translations" } ],
  "data": null
}
```

---

## 5. Quick Reference

| Method | Endpoint | Permission | Body | Success `data` |
| --- | --- | --- | --- | --- |
| GET | `/shop/products/{productId}/edit` | `UPDATE_PRODUCT` | — | `{ product, lookups }` |
| POST | `/shop/products/{productId}/update` | `UPDATE_PRODUCT` | product fields | `{ requires_approval }` |
| POST | `/shop/products/{productId}/change-status` | `CHANGE_PRODUCT_STATUS` | `{ status }` | `{ status, warnings }` |
| GET | `/shop/products/categories/{categoryId}/lookups` | `UPDATE_PRODUCT` | — | `{ sub_categories, sub_sub_categories, descriptor_groups }` |
| GET | `/shop/boutiques/{boutiqueId}/edit` | `UPDATE_BUTIKS` | — | `{ boutique, lookups }` |
| POST | `/shop/boutiques/{boutiqueId}/update` | `UPDATE_BUTIKS` | `{ boutique_global_data, custom_data }` | `[]` |
| POST | `/shop/boutiques/{boutiqueId}/change-status` | `CHANGE_BOUTIQUE_STATUS` | `{ status }` | `{ status, warnings }` |

**Every request needs:** `Authorization: Bearer …` + `X-Seller-ID: …` + `Accept: application/json`.
