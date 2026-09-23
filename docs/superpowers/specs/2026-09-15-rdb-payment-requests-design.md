# RDB payment requests — design

**Date:** 2026-09-15
**Source:** `rdb-payment-client-changes-ar.md` (backend team, branch
`ticket/rdb-merchant-payment-requests`, commits `cccb8cbc` and `3b65077b`).
That file is in Arabic and is not tracked by git. This document is the English
contract the plan is written against.

## 1. The change in one paragraph

The browser stops talking to RDB. Today the storefront signs a merchant request
and posts it straight to the RDB backend. After this change the storefront only
talks to the Trydos core backend. The core backend creates the payment request
on RDB, and hands the storefront a deep link, a QR payload and a short code.
The shopper pays inside the RDB app. The storefront polls one Trydos endpoint
until the payment lands.

**Which backend, which token.** `{base}` in the source document is the **core
backend** (`BACKEND_URL`). All three new endpoints are authorised with the
**`MARKET-TOKEN`** cookie, the single auth cookie this app already uses for
guest and logged-in traffic. In code that means `fetchData({ server: "market" })`
and nothing else: `utils/server/tokenManager.ts:180-190` sends a `market` URL to
`BACKEND_URL` unless the URL is in `GATEWAY_APIS`, and none of the three new
paths is, so they reach the core backend for verified users and guests alike.
`getTokenForServer` (`utils/server/tokenManager.ts:224-229`) attaches
`MARKET_TOKEN` for `market`. **No allow-list entry is needed and none may be
added** — putting these paths in `GATEWAY_APIS` would send them to the gateway,
which does not serve them.

## 2. What the client must delete

- The call to RDB `POST /merchant/checkout`.
- Every merchant key, secret and HMAC signature, and the headers
  `X-Merchant-Api-Key`, `X-Signature`, `X-Timestamp`.
- Every line that works out the RDB amount in the browser. The core backend
  decides the amount (cart total minus discount).

Not affected: the RDB **wallet login** call in `app/api/auth/login/route.ts`,
which sends `X-merchant-api-key` to log the shopper into their own wallet. That
is not the merchant checkout call and stays as it is.

## 3. Start a payment

`POST {base}/api/v1/customer/order/checkout/rdb`

Same headers as the other checkout methods: `Authorization: Bearer <customer
token>`, `Accept: application/json`, `lang`, `country`. The shopper must be
verified (phone or email), as with every payment method.

Body:

| Field | Type | Required | Note |
|---|---|---|---|
| `address_id` | int | yes | must be the shopper's default address |
| `order_note` | string | no | |
| `pay_by_wallet` | 0 or 1 | no | **ignored — stop sending it.** RDB always collects the full amount. |

### 3.1 Success (HTTP 200)

```json
{
  "isSuccessful": true,
  "hasContent": true,
  "code": 200,
  "message": "rdb_payment_request_created",
  "detailed_error": null,
  "data": {
    "request_reference": "0f3c1c1e-6d0a-4b8b-9b7e-2f6a0f9c1d22",
    "status": "awaiting_payment",
    "rdb_request_id": "665a",
    "request_code": "REQ8F3K2M1Q",
    "short_code": "12345678",
    "deep_link": "rdb://pay/REQ8F3K2M1Q",
    "qr_payload": "https://pay.rdb.example/r/v1/REQ8F3K2M1Q",
    "amount": "100.00",
    "currency": "USD",
    "expires_at": "2026-09-15T14:30:00+00:00",
    "paid_at": null,
    "receipt_number": null,
    "failure_reason": null,
    "order_ids": []
  }
}
```

Rules for the screen:

- Show `qr_payload` as a QR image and show `short_code` for manual entry.
- On a phone, also offer `deep_link` to open the RDB app.
- Show `amount` and `currency` **as the strings that arrived**. Never parse them
  into a float for display.
- Keep `request_reference`. It is the key for polling and for cancelling.
- Stop polling at `expires_at` and tell the shopper the request ended.

### 3.2 There is no "the wallet covered it all" case

`checkout/rdb` always answers with the payment request object above, or with an
error. It never creates orders directly and never spends Trydos wallet credit,
whatever `pay_by_wallet` says. The same is now true for cash on delivery and for
crypto: no payment takes a share from the Trydos wallet any more.

### 3.3 Errors

| HTTP | When | Body |
|---|---|---|
| 400 | validation (e.g. `address_id` is not the default address) | validation errors |
| 403 | cart or business rule: quantity gone, cart unavailable, nothing to pay, RDB unreachable | `message` explains; retry after fixing the cause |
| 409 | the shopper already has a pending RDB request | `message`: "You already have a pending RDB payment. Complete or cancel it first." Send the shopper to the existing request, or offer cancel. |
| 500 | unexpected | generic message; retry later |

## 4. Poll the status

`GET {base}/api/v1/customer/order/rdb-request/{request_reference}`

Same auth headers. Returns the same `data` object as §3.1, with the current
`status`:

| `status` | Meaning | What the screen does |
|---|---|---|
| `awaiting_payment` | not paid yet | keep polling every 3 to 5 seconds until `expires_at` |
| `paid` | paid, orders created | `order_ids` is filled, `receipt_number` may be present; go to the order screen through the existing order endpoints |
| `expired` | not paid in time | tell the shopper; the cart can be edited again; they may pay again |
| `cancelled` | cancelled by the shopper or by RDB | same as `expired` |
| `failed` | paid but the order could not be created (e.g. the cart changed), or RDB failed | show `failure_reason`; the money returns to the RDB wallet automatically; the cart can be edited again |

A reference that belongs to another shopper, or does not exist, answers 404.

## 5. Cancel a pending request

`POST {base}/api/v1/customer/order/rdb-request/{request_reference}/cancel`

| HTTP | Meaning |
|---|---|
| 200 | cancelled; `data.status` becomes `cancelled`; the cart can be edited |
| 409 | already paid, cannot cancel (poll it; the orders exist) |
| 404 | unknown reference |
| 500 | RDB unreachable; retry |

The payment screen needs a cancel button so the shopper can go back to the cart.

## 6. The cart is locked while a request is pending

While any request is `awaiting_payment`, every cart write answers **409**:

- `POST /cart/add`, `/cart/update`, `/cart/remove`, `/cart/remove-all`,
  `/cart/convert_to_old`
- `POST /old-cart/convert_to_cart`, `/old-cart/hide`
- `POST /customer/order/checkout/{any method}`

The 409 body:

```json
{
  "isSuccessful": false,
  "code": 409,
  "message": "Your cart is locked until the pending RDB payment is completed or cancelled.",
  "detailed_error": [ { "message": "..." } ],
  "data": {
    "rdb_request_reference": "0f3c1c1e-...",
    "expires_at": "2026-09-15T14:30:00+00:00"
  }
}
```

The screen shows "you have a payment in progress" with two buttons: "Continue
payment" (open the payment screen on `rdb_request_reference`) and "Cancel
payment" (§5). Read requests (`GET`) are never locked.

## 7. What does not change

- Order list, order detail, tracking, order cancel, item cancel: same endpoints.
  For RDB-paid orders the backend sends the refund to the RDB wallet. The
  "refunded" mark is set when RDB confirms, which can take a while for large
  refunds. Nothing is added on the client.
- Payment methods wallet, cash on delivery, crypto, card: unchanged.
- The old server endpoint `POST /api/rdb/order/payment` is deleted. It was never
  a client endpoint.

## 8. Website note

The website uses the same `/api/v1` endpoints as the mobile app, so §3 to §7
apply unchanged, including the cart lock in §6. Do not call any route from
`web.php`; use `/api/v1`.

## 9. Answers from the backend owner (2026-09-15)

1. `available_payment_method` now contains `"rdb"`:
   `["cash_on_delivery", "rdb"]`. The old string `trydos_wallet` is gone.
2. After `paid`, the orders are loaded with the existing cart-to-order lookup
   `GET /customer/order/getOrdersByCartGroupID?cart_group_id=<id>`, which returns
   the orders and their group id.

Still open, and both have a safe fallback in the plan:

3. How long a request lives (`expires_at`). The screen reads the field, so no
   code depends on the number — only the wording does.
4. Whether the **checkout** 409 (§3.3) carries `data.rdb_request_reference` the
   way the cart lock 409 (§6) does. The plan stores the reference locally when
   it is created, so recovery works either way.

## 10. Product decisions (owner, 2026-09-15)

- **RDB is a normal selectable row.** Today the row is force-selected when the
  shown balance covers the total, and cash/card/crypto are disabled. That gate
  goes. The shopper picks RDB like any other method, always for the full amount,
  because they pay and can top up inside the RDB app.
- **QR always, deep-link button on mobile only.** The QR and the short code are
  always drawn. An "Open the RDB app" button appears only on a mobile browser.
  The QR stays as the fallback when the app is not installed.
