# Shop API — Product Orders and Order Details (Contract)

Two new read-only endpoints for the shop dashboard (ClickUp ticket
[`z8n6b616pa`](https://app.clickup.com/t/90182710436/z8n6b616pa) — "show product
orders in seller shop"). They sit next to the seller carts APIs
(`docs/api/shop-seller-carts-apis.md`) and follow the same rules.

| Shop dashboard screen | Page it mirrors | Endpoint |
| --- | --- | --- |
| Product orders | Admin `product/orders/{id}` | `GET /products/{productId}/orders` **(new)** |
| Order details | Seller panel order details | `GET /orders/{orderId}` **(new)** |
| Orders list | — | `GET /orders` (existing, unchanged) |

- **Base URL:** `{{host}}/api/v1/shop`
- **Auth:** Laravel Passport (Bearer token), guard `auth:api`
- **Audience:** Shop / seller dashboard front end
- **Code:** `app/Http/Controllers/api/v1/Shop/OrderController.php`, resources in
  `app/Resources/v1/Shop/Orders/`, tests in `tests/Feature/Shop/ShopSellerOrdersTest.php`

The product orders screen is the orders version of the existing **Product carts**
screen (`GET /products/{productId}/carts`): from a product, the seller sees who
has it in a cart, and who has ordered it.

---

## 1. Headers

| Header | Required | Value | Notes |
| --- | --- | --- | --- |
| `Authorization` | ✅ | `Bearer <access_token>` | Passport token of the logged-in shop user |
| `X-Seller-ID` | ✅ | `<sellerId>` | Drives permission resolution and scopes every query to this seller |
| `Accept` | ✅ | `application/json` | |
| `lang` | ⬜ | e.g. `en`, `ar` | Locale for product and color names (falls back to `en`) |
| `country` | ⬜ | e.g. `tr` | |

> ⚠️ Without `X-Seller-ID` no permission is resolved, so every endpoint returns **403**.

### Permission

| Action | Permission |
| --- | --- |
| Both new endpoints | `READ_ORDERS` (or `SUPER_ADMIN`) |

`READ_ORDERS` already exists, the same as for `GET /orders`. No new permission and
no seeding is needed.

### Tenant scope

Both endpoints return only orders where `seller_is = 'seller'` and
`seller_id = X-Seller-ID`. Another seller's order or product is answered with
**404**, never with its data.

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
  "message": "Order not found.",
  "detailed_error": [{ "message": "Order not found." }],
  "data": null
}
```

| Status | When |
| --- | --- |
| `200` | Success |
| `401` | Missing or invalid Bearer token |
| `403` | Caller has neither `READ_ORDERS` nor `SUPER_ADMIN` for `X-Seller-ID` (`"You do not have permission to access."`) |
| `404` | Product or order not found **for this seller** |
| `422` | Invalid `status` query parameter (product orders only) |

### Pagination `meta`

The product orders list returns its rows under `orders` plus `meta`. The page size
is the `pagination_limit` business setting. Pass `?page=N` for other pages.

```json
"meta": {
  "current_page": 1,
  "last_page": 2,
  "per_page": 25,
  "total": 31,
  "from": 1,
  "to": 25,
  "has_more_pages": true,
  "next_page_url": "{{host}}/api/v1/shop/products/2310/orders?page=2",
  "prev_page_url": null
}
```

---

## 3. Shared objects

### Order card

This is the **same object** as each row of the existing `GET /orders` list, so the
front end can reuse the same order card. The two new endpoints add `customer`.

```json
{
  "id": 50211,
  "order_status": "Waiting Confirm",
  "available_order_status_change": ["processing", "canceled"],
  "order_amount": 45,
  "order_amount_in_currency": 1912.5,
  "currency": { "code": "TRY", "name": "Turkish Lira" },
  "created_at": { "date": "Today ", "time": "10:42:05" },
  "items": 3,
  "remaining_in_minutes": 95,
  "details": [ { "...": "order line, see below" } ],
  "customer": { "id": 1542, "name": "Ahmad Saleh", "phone": "+905551234567", "email": "ahmad@example.com" }
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | `orders.id` |
| `order_status` | string | Display label: `Waiting Confirm` (pending), `Confirmed` (processing), `Packed` (packaged), else the raw status |
| `available_order_status_change` | string[] | Raw statuses the order can move to next |
| `order_amount` | number | In the **system default currency** (USD) |
| `order_amount_in_currency` | number\|null | The same amount in the seller's shop currency. `null` when that currency cannot be resolved; then show no currency code. |
| `currency` | object\|null | The seller's shop currency (`code`, `name`) |
| `created_at` | object | `date` is `Today `, `Yesterday ` or like `5 Oct 2026`; `time` is `H:i:s` |
| `items` | int | Number of lines in the **whole order** |
| `remaining_in_minutes` | int | Minutes left before the expected time of the current status (0 when late) |
| `details` | array | Order lines. **Product orders: only the lines of this product.** Order details: every line. |
| `customer` | object\|null | **New endpoints only.** Not sent by `GET /orders`. `null` when the user row no longer exists. |

### Order line (`details[]`)

Unchanged from `GET /orders`.

```json
{
  "id": 90871,
  "order_id": 50211,
  "cart_image": "{{storage}}/product/2025-10-01-abc.webp",
  "brand_icon": "{{storage}}/brand/2025-09-02-xyz.png",
  "qty": 2,
  "unit_price": 25,
  "offer_price": 20,
  "unit_price_in_currency": 1062.5,
  "offer_price_in_currency": 850,
  "currency": { "code": "TRY", "name": "Turkish Lira" },
  "offer_type": "discount",
  "is_confirm": true,
  "is_packed": false,
  "is_collected": false,
  "product_name": "Azure Silk Slip",
  "color": "Blue",
  "size": "M",
  "is_reported": false
}
```

A line is sold at `offer_price` when it is above 0, else at `unit_price`; the line
total is that price times `qty`.

### `customer`

The same object as in the carts APIs.

```json
{
  "id": 1542,
  "name": "Ahmad Saleh",
  "phone": "+905551234567",
  "email": "ahmad@example.com"
}
```

`name` is `f_name l_name`, or the `name` column when both are empty.

---

## 4. Endpoints

### 4.1 `GET /products/{productId}/orders` — Product orders

The seller's orders that hold one of the seller's own products, newest first.
`productId` must be numeric.

| Query | Type | Rules |
| --- | --- | --- |
| `status` | string | Optional. One of `in_progress`, `collected`, `returned`, `canceled`, `all` (default `all`). Same values as `GET /orders`. |
| `page` | int | Optional |

`in_progress` means `pending`, `processing` or `packaged`.

```json
"data": {
  "orders": [ { "...": "order card, see §3, with customer" } ],
  "user_abilities": {
    "change_order_status": ["processing", "packaged", "canceled"]
  },
  "meta": { }
}
```

- `details` holds **only this product's lines** of each order (one line per
  variation that was ordered). `items` still counts every line of the order.
- `user_abilities.change_order_status`: the statuses the logged-in user may set,
  the same as in `GET /orders`.
- **404** `Product not found.` when the product is not added by this seller.
- An owned product with no orders returns `200` with an empty `orders`.
- **422** when `status` is not one of the values above.

### 4.2 `GET /orders/{orderId}` — Order details

One order of this seller, with every line. Not paginated. `orderId` must be numeric.

```json
"data": {
  "order": {
    "...": "every field of the order card, see §3, with customer",
    "order_group_id": "1542-aB3dE-1759310000",
    "status": "pending",
    "payment_method": "cash_on_delivery",
    "payment_method_label": "Cash On Delivery",
    "payment_status": "unpaid",
    "discount_amount": 5,
    "discount_amount_in_currency": 212.5,
    "shipping_cost": 7,
    "shipping_cost_in_currency": 297.5,
    "order_note": "Please ring twice",
    "shipping_address": {
      "contact_person_name": "Ahmad Saleh",
      "phone": "+905551234567",
      "country": "Turkey",
      "city": "Istanbul",
      "address": "Main street 1",
      "zip": "34000"
    }
  },
  "user_abilities": {
    "change_order_status": ["processing", "packaged", "canceled"]
  }
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `order_group_id` | string | Shared by the orders of one checkout (one order per seller) |
| `status` | string | Raw status (`pending`, `processing`, `packaged`, …). Use it for logic; use `order_status` for display. |
| `payment_method` | string\|null | `cash_on_delivery`, `trydos_wallet`, `crypto`, `rdb`, `card` |
| `payment_method_label` | string\|null | English label of the payment method |
| `payment_status` | string | `paid` or `unpaid` |
| `discount_amount`, `shipping_cost` | number | In the system default currency (USD) |
| `discount_amount_in_currency`, `shipping_cost_in_currency` | number\|null | In the seller's shop currency; `null` as for `order_amount_in_currency` |
| `order_note` | string\|null | Note the customer wrote at checkout |
| `shipping_address` | object\|null | Address saved on the order at checkout. Only these keys can appear: `contact_person_name`, `phone`, `alternative_phone`, `email`, `country`, `country_iso`, `province`, `city`, `town`, `street`, `building`, `address`, `address_detail`, `zip`, `latitude`, `longitude`. A key that was not saved is missing. `null` when the order has no saved address. |

- **404** `Order not found.` when the order does not exist or belongs to another
  seller.
- The actions on this screen use the existing endpoints: `PUT /orders/status`,
  `PUT /orders/details/status/confirmed`, `PUT /orders/details/status/packed` and
  `PUT /orders/details/cancel`.

---

## 5. Not included

Compared with the admin product orders page, these are not returned: the seller
name (it is always the current shop), COD cost, transaction reference, customer
type and the delivery man. Ask the backend team if a screen needs one of them.

## 6. Rollout

Nothing to run. `READ_ORDERS` already exists and is assigned to the seeded shop
roles. There is no migration.
