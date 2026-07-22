# Shop API — Sync Product Descriptors

**Endpoint:** `POST /api/v1/shop/products/{productId}/descriptors`
**Purpose:** Replace **all** descriptor values of a seller product in one call (full-replace sync — what you send becomes the complete new set).

> Code-verified against `routes/api/v1/shop.php:48` and
> `app/Http/Controllers/api/v1/Shop/ProductController.php:353-460`.

---

## 1. Request

### Headers

| Header | Required | Value |
|---|---|---|
| `Authorization` | yes | `Bearer <passport access token>` |
| `X-Seller-ID` | yes | The acting shop/seller id. Ownership is checked against it — wrong/missing id ⇒ `404 Product not found.` |
| `Content-Type` | yes | `application/json` |

### Path

| Param | Type | Notes |
|---|---|---|
| `productId` | integer | Must be numeric (route constraint `whereNumber`). Must be a product owned by the seller (`user_id = X-Seller-ID` and `added_by = seller`), else 404. |

### Permission

Caller's shop role must have `UPDATE_PRODUCT` (or `SUPER_ADMIN`), else **403**.

### Body

One required key: `descriptors` — a **map of maps**:

```
descriptors: {
  "<descriptor_group_id>": {
    "<descriptor_id>": "<value>",
    ...
  },
  ...
}
```

- `descriptor_group_id` — positive integer (as object key). Get the available groups + their descriptors from `GET /api/v1/shop/products/categories/{categoryId}/lookups` → `data.descriptor_groups[]` (each group includes its `descriptors[]`).
- `descriptor_id` — positive integer; **must belong to the group it is nested under**, else the whole request is rejected (all-or-nothing).
- `value` — the seller's value for that descriptor. Stored **as a string** (numbers/booleans are cast). `null` or the string `"null"` means "remove this descriptor" — such entries are silently dropped before saving.

#### Example request

```http
POST /api/v1/shop/products/1234/descriptors HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
X-Seller-ID: 42
Content-Type: application/json

{
  "descriptors": {
    "7": {
      "31": "Cotton",
      "32": "Machine wash 30°"
    },
    "9": {
      "55": "Made in Türkiye"
    }
  }
}
```

Meaning: product 1234 ends up with exactly these 3 descriptor values, grouped under descriptor groups 7 and 9. Anything the product had before that is not in this payload is **deleted**.

### Replace semantics (important)

| You send | Result |
|---|---|
| A map with groups/values | Old descriptor rows are deleted, payload rows are created (in one DB transaction). |
| A group without one of its previous descriptors | That descriptor value is removed. |
| `"31": null` or `"31": "null"` | Entry pruned → descriptor 31 removed. A group left with no entries is removed too. |
| `"descriptors": {}` (empty object) | **Clears all descriptors** from the product. Valid call. |
| Body without the `descriptors` key | 422. |

There is **no partial/merge mode** — always send the complete desired set. Read the current values first from `GET /api/v1/shop/products/{productId}/edit` → `data.descriptor_values[]` (flat list of `{descriptor_group_id, descriptor_id, value}`).

---

## 2. Responses

All responses use the standard envelope:

```json
{
  "isSuccessful": true|false,
  "hasContent": true|false,
  "code": <http status>,
  "message": "<first message>",
  "detailed_error": null | [ { "message": "..." }, ... ],
  "data": { ... } | null
}
```

### 200 — Success

```json
{
  "isSuccessful": true,
  "hasContent": true,
  "code": 200,
  "message": "Descriptors synced successfully",
  "detailed_error": null,
  "data": { "product_id": 1234 }
}
```

### Errors (checked in this order)

| Status | When | `message` |
|---|---|---|
| 403 | Role lacks `UPDATE_PRODUCT` / `SUPER_ADMIN` | `You do not have permission to access.` |
| 404 | Product doesn't exist, isn't seller-added, or isn't owned by `X-Seller-ID` | `Product not found.` |
| 422 | `descriptors` key missing | `The descriptors field must be present.` |
| 422 | `descriptors` is not an object/array | `The descriptors field must be a map of {descriptor_group_id: {descriptor_id: value}}.` |
| 422 | Non-integer / non-positive group key | `Descriptor group id '<x>' must be a positive integer.` |
| 422 | Group value isn't a map | `Descriptor group '<x>' must map descriptor ids to values.` |
| 422 | Non-integer / non-positive descriptor key | `Descriptor id '<x>' (group '<y>') must be a positive integer.` |
| 422 | Descriptor doesn't exist in that group | `Descriptor '<x>' does not exist in descriptor group '<y>'.` |
| 404 | Seller record for `X-Seller-ID` not found | `Seller not found.` |

Validation is **all-or-nothing**: any invalid id/pair rejects the entire request and nothing is changed. Multiple problems are returned together in `detailed_error`, e.g.:

```json
{
  "isSuccessful": false,
  "code": 422,
  "hasContent": false,
  "message": "Descriptor '31' does not exist in descriptor group '9'.",
  "detailed_error": [
    { "message": "Descriptor '31' does not exist in descriptor group '9'." },
    { "message": "Descriptor '99' does not exist in descriptor group '7'." }
  ],
  "data": null
}
```

---

## 3. Typical frontend flow

1. `GET /api/v1/shop/products/categories/{categoryId}/lookups` → render descriptor form from `data.descriptor_groups[]` (group → `descriptors[]`).
2. (Edit screen) `GET /api/v1/shop/products/{productId}/edit` → prefill from `data.descriptor_values[]`.
3. Build the full map from the form state (skip empty inputs or send them as `null` — same effect).
4. `POST /api/v1/shop/products/{productId}/descriptors` with the complete map.
5. On 422 show `detailed_error[].message`; on 200 the product's descriptors now equal what was sent.
6.