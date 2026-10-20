# Customer API — Paid Currency on Orders (Contract)

A new `currency` object on each order in the customer order APIs (ClickUp ticket
[`z8n6b61cmk`](https://app.clickup.com/t/z8n6b61cmk) — "show the paid currency and
exchange rate in the customer order APIs"). With it, the app can show order amounts in
the currency the customer really paid with.

| App screen | Endpoint |
| --- | --- |
| My orders | `GET /customer/order/list` |
| Orders of one checkout | `GET /customer/order/getOrdersByOrderGroupID?order_group_id=` |

- **Base URL:** `{{host}}/api/v1`
- **Auth:** Laravel Passport (Bearer token), guard `auth:api`
- **Audience:** Customer app and website
- **Code:** `app/Resources/v1/Order.php`, test in `tests/Feature/Order/CustomerOrderPaidCurrencyTest.php`

Nothing else changes in these responses: no field is renamed or removed, and **all
amounts stay in USD**.

---

## 1. The `currency` object

Every order object gets one new key, `currency`:

```json
"currency": {
  "code": "SYP",
  "exchange_rate": 13000,
  "symbol": "SYP",
  "decimal_digits": 0
}
```

| Field | Type | Always set | Meaning |
| --- | --- | --- | --- |
| `code` | string (3 letters) | ✅ | The currency the customer paid with. Saved at checkout. |
| `exchange_rate` | number | ✅ | The rate of that currency **at checkout**: 1 USD = `exchange_rate` × currency. `1` for USD. |
| `symbol` | string \| null | ⬜ | The symbol to show. `null` if the currency is no longer in the system. |
| `decimal_digits` | integer \| null | ⬜ | How many decimals to show. `null` if the currency is no longer in the system. |

- `code` and `exchange_rate` belong to the order. They **do not change** when the rate or
  the currency settings change later. Do not use today's rate for an old order.
- Old orders from before multi-currency have `code` = `USD` and `exchange_rate` = `1`.

---

## 2. How to show an amount

```
paid amount = USD amount × currency.exchange_rate
shown value = paid amount rounded to currency.decimal_digits (use 2 when it is null)
label       = shown value + currency.symbol (use currency.code when symbol is null)
```

Use this rule for these fields (all in USD):

| Where | Fields |
| --- | --- |
| Order | `order_amount`, `discount_amount`, `shipping_cost`, `partial_payment_by_wallet` |
| Each line in `details` | `price`, `discount` |
| `details[].product_details` | `price`, `offer_price` |

**Example:** `order_amount` = `12.5`, `exchange_rate` = `13000`, `decimal_digits` = `0`,
`symbol` = `SYP` → `12.5 × 13000 = 162500` → **162500 SYP**.

---

## 3. `GET /customer/order/list`

Query parameters are not changed (`limit`, `offset`, status filters).

### Response 200 (shortened)

```json
{
  "isSuccessful": true,
  "hasContent": true,
  "code": 200,
  "message": "Data Got!",
  "detailed_error": null,
  "data": {
    "total": 2,
    "limit": 10,
    "offset": 1,
    "orders": [
      {
        "id": 5012,
        "customer_id": 881,
        "payment_status": "paid",
        "order_status": { "value": "pending", "label": "Pending" },
        "payment_method": { "value": "trydos_wallet", "label": "Trydos Wallet" },
        "currency": { "code": "SYP", "exchange_rate": 13000, "symbol": "SYP", "decimal_digits": 0 },
        "transaction_ref": "...",
        "order_amount": 12.5,
        "partial_payment_by_wallet": 0,
        "discount_amount": 0,
        "shipping_cost": 2,
        "order_group_id": "...",
        "details": [ "..." ]
      }
    ],
    "total_order_group": 1
  }
}
```

---

## 4. `GET /customer/order/getOrdersByOrderGroupID?order_group_id=`

The response is not changed, except for the new `currency` object on each order.

### Response 200 (shortened)

```json
{
  "isSuccessful": true,
  "hasContent": true,
  "code": 200,
  "message": "Data Got!",
  "detailed_error": null,
  "data": [
    {
      "id": 5012,
      "currency": { "code": "SYP", "exchange_rate": 13000, "symbol": "SYP", "decimal_digits": 0 },
      "order_amount": 12.5,
      "order_group_id": "...",
      "details": [ "..." ]
    }
  ]
}
```

The orders of one checkout share one currency and one rate.

---

## 5. Other endpoints that also get `currency`

The same order object is used by these responses, so they also get the new field. Nothing
else changes in them:

- `GET /customer/order/details`
- `GET /customer/order/orders_statuses`
- `GET /customer/order/getOrdersByCartGroupID`
- the checkout response (`POST /customer/order/checkout/{method}`)
- the delivery man order APIs

`GET /customer/order/getHiddenOrders` uses another object and does **not** have `currency`.

---

## 6. Errors

No new errors. The existing errors of both endpoints are not changed.
