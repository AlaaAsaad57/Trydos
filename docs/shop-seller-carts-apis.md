# Shop API — Seller Carts (Contract)

Five read-only endpoints that bring the seller panel's cart pages to the shop
dashboard (ClickUp ticket [`z8n6b60zdc`](https://app.clickup.com/t/90182710436/z8n6b60zdc)):

| Shop dashboard screen | Seller panel page it mirrors | Endpoint |
| --- | --- | --- |
| Carts list | `seller/orders/carts/all` | `GET /carts` |
| Cart details | `seller/orders/carts/details/{id}` | `GET /carts/{cartGroupId}` |
| Product carts | `seller/product/carts/{id}` | `GET /products/{productId}/carts` |
| Old carts list | `seller/orders/oldCarts/all` | `GET /old-carts` |
| Old cart details | `seller/orders/oldCarts/details/{id}` | `GET /old-carts/{customerId}` |

- **Base URL:** `{{host}}/api/v1/shop`
- **Auth:** Laravel Passport (Bearer token), guard `auth:api`
- **Audience:** Shop / seller dashboard front end
- **Code:** `app/Http/Controllers/api/v1/Shop/CartController.php`, resources in
  `app/Resources/v1/Shop/Carts/`, tests in `tests/Feature/Shop/ShopSellerCartsTest.php`

A **cart** is every `carts` row sharing one `cart_group_id`; one customer has one
open cart. An **old cart** line is a cart line that expired and was moved to
`old_carts`; old carts are grouped by customer.

---

## 1. Headers

| Header | Required | Value | Notes |
| --- | --- | --- | --- |
| `Authorization` | ✅ | `Bearer <access_token>` | Passport token of the logged-in shop user |
| `X-Seller-ID` | ✅ | `<sellerId>` | Drives permission resolution and scopes every query to this seller |
| `Accept` | ✅ | `application/json` | |
| `lang` | ⬜ | e.g. `en`, `ar` | Locale for color names |
| `country` | ⬜ | e.g. `tr` | |

> ⚠️ Without `X-Seller-ID` no permission is resolved, so every endpoint returns **403**.

### Permission

| Action | Permission |
| --- | --- |
| All five endpoints | `READ_CARTS` (or `SUPER_ADMIN`) |

`READ_CARTS` is new. The seeded roles **Shop Owner**, **Shop Manager** and **Order
Manager** have it.

### Tenant scope

Every endpoint returns only lines where `seller_is = 'seller'` and
`seller_id = X-Seller-ID`. One cart group can hold lines of several sellers; the
other sellers' lines are never returned and never counted.

---

## 2. Response envelope

Every response uses the standard envelope.

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

Errors:

```json
{
  "isSuccessful": false,
  "code": 404,
  "hasContent": false,
  "message": "Cart not found.",
  "detailed_error": [{ "message": "Cart not found." }],
  "data": null
}
```

| Status | When |
| --- | --- |
| `200` | Success |
| `401` | Missing or invalid Bearer token |
| `403` | Caller has neither `READ_CARTS` nor `SUPER_ADMIN` for `X-Seller-ID` (`"You do not have permission to access."`) |
| `404` | Cart, product or old cart not found **for this seller** |
| `422` | Invalid `search` query parameter |

### Pagination `meta`

Paginated lists return their rows under a named key plus `meta`. The page size is
the `pagination_limit` business setting. Pass `?page=N` for other pages.

```json
"meta": {
  "current_page": 1,
  "last_page": 3,
  "per_page": 25,
  "total": 61,
  "from": 1,
  "to": 25,
  "has_more_pages": true,
  "next_page_url": "{{host}}/api/v1/shop/carts?page=2",
  "prev_page_url": null
}
```

---

## 3. Shared objects

### `customer`

```json
{
  "id": 1542,
  "name": "Ahmad Saleh",
  "phone": "+905551234567",
  "email": "ahmad@example.com"
}
```

`name` is `f_name l_name`, or the `name` column when both are empty. `customer` is
`null` when the user row no longer exists.

### Cart line

Used by cart details, product carts and old cart details. `carts` and `old_carts`
lines have the same shape.

```json
{
  "id": 88231,
  "cart_group_id": "1542-aB3dE-1759310000",
  "product_id": 2310,
  "product_variation_id": "9f0c2a51-6f43-4f5e-9d0a-2b7f3c1e8a10",
  "name": "Azure Silk Slip",
  "cart_image": "{{storage}}/product/2025-10-01-abc.webp",
  "color": "Blue",
  "size": "M",
  "quantity": 2,
  "available_stock": 7,
  "unit_price": 25,
  "offer_price": 20,
  "offer_type": "discount",
  "tax": 0,
  "unit_price_in_currency": 1062.5,
  "offer_price_in_currency": 850,
  "currency": { "code": "TRY", "name": "Turkish Lira" },
  "customer_currency": { "code": "USD", "exchange_rate": 1 },
  "customer": { "id": 1542, "name": "Ahmad Saleh", "phone": "+905551234567", "email": "ahmad@example.com" },
  "created_at": "2026-10-01T09:12:44.000000Z",
  "updated_at": "2026-10-01T09:40:02.000000Z"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | `carts.id` or `old_carts.id` |
| `cart_group_id` | string\|null | Old cart lines may have `null` |
| `product_id` | int | |
| `product_variation_id` | uuid\|null | `null` for a product without variations |
| `name` | string\|null | Product name saved on the line when it was added |
| `cart_image` | string | Full URL |
| `color`, `size` | string\|null | From the variation; `null` without one |
| `quantity` | number | |
| `available_stock` | number\|null | Current stock of the variation; `null` without a variation |
| `unit_price`, `offer_price` | number | Per unit, in the **system default currency** (USD) |
| `offer_type` | string | |
| `tax` | number | |
| `unit_price_in_currency`, `offer_price_in_currency` | number\|null | The same prices in the seller's shop currency. `null` when that currency cannot be resolved; then show no currency code. |
| `currency` | object\|null | The seller's shop currency (`code`, `name`) |
| `customer_currency` | object | Currency the customer was browsing in when they added the line |
| `customer` | object\|null | **Product carts only.** Omitted on the other endpoints, which return the customer once at the top. |

The price fields follow the Shop orders API (`OrderDetailResource`). A line is sold
at `offer_price` when it is above 0, else at `unit_price`; line total is that price
times `quantity`.

---

## 4. Endpoints

### 4.1 `GET /carts` — Carts list

The seller's open carts, one row per `cart_group_id`, newest first.

| Query | Type | Rules |
| --- | --- | --- |
| `search` | string | Optional, max 191. Matches part of `cart_group_id`. |
| `page` | int | Optional |

```json
"data": {
  "carts": [
    {
      "cart_group_id": "1542-aB3dE-1759310000",
      "customer": { "id": 1542, "name": "Ahmad Saleh", "phone": "+905551234567", "email": "ahmad@example.com" },
      "items_count": 3,
      "total_quantity": 4,
      "created_at": "2026-10-01T09:12:44.000000Z",
      "updated_at": "2026-10-01T09:40:02.000000Z"
    }
  ],
  "meta": { }
}
```

`items_count`, `total_quantity`, `created_at` (first line) and `updated_at` (latest
change) count this seller's lines only.

### 4.2 `GET /carts/{cartGroupId}` — Cart details

This seller's lines of one cart. Not paginated.

```json
"data": {
  "cart_group_id": "1542-aB3dE-1759310000",
  "customer": { "id": 1542, "name": "Ahmad Saleh", "phone": "+905551234567", "email": "ahmad@example.com" },
  "customer_orders_count": 2,
  "items": [ { "...": "cart line, see §3" } ]
}
```

- `customer_orders_count`: orders this customer placed **with this seller**.
- **404** `Cart not found.` when the group has no line of this seller.

### 4.3 `GET /products/{productId}/carts` — Product carts

Every open cart line holding one of the seller's own products, newest first.
`productId` must be numeric.

```json
"data": {
  "items": [ { "...": "cart line, see §3, with customer" } ],
  "meta": { }
}
```

- **404** `Product not found.` when the product is not added by this seller.
- An owned product with no cart lines returns `200` with an empty `items`.

### 4.4 `GET /old-carts` — Old carts list

Customers with old cart lines of this seller, one row per customer, newest first.

| Query | Type | Rules |
| --- | --- | --- |
| `search` | int | Optional, ≥ 1. Matches `customer_id` **or** `product_id` exactly. |
| `page` | int | Optional |

```json
"data": {
  "old_carts": [
    {
      "customer_id": 1542,
      "customer": { "id": 1542, "name": "Ahmad Saleh", "phone": "+905551234567", "email": "ahmad@example.com" },
      "items_count": 5,
      "last_added_at": "2026-09-28 18:02:11"
    }
  ],
  "meta": { }
}
```

- **422** when `search` is not a positive integer.

### 4.5 `GET /old-carts/{customerId}` — Old cart details

One customer's old cart lines of this seller, newest first. `customerId` must be
numeric.

```json
"data": {
  "customer": { "id": 1542, "name": "Ahmad Saleh", "phone": "+905551234567", "email": "ahmad@example.com" },
  "items": [ { "...": "cart line, see §3" } ],
  "meta": { }
}
```

- **404** `Old cart not found.` when the customer has no old cart line of this seller.

---

## 5. Not included

Compared with the seller panel's cart details page, these are not returned:
profit and purchase price, shipping options and cost, SMS reminder logs, and
"added by". Ask the backend team if a screen needs one of them.

## 6. Rollout

`READ_CARTS` must exist and be assigned before the front end can call these
endpoints. On each environment run:

```bash
php artisan db:seed --class=PermissionSeeder
php artisan db:seed --class=ShopRoleSeeder
```

`ShopRoleSeeder` re-syncs the seeded roles' permissions, so check any role that was
edited by hand first.
