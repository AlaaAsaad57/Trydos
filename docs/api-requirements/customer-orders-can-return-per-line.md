# Customer API — "Can Return" per Order Line (Contract)

**Source:** backend contract `docs/api/customer-orders-can-return-per-line.md`
in backend PR #637 (ClickUp [`z8n6b61ez6`](https://app.clickup.com/t/z8n6b61ez6) —
"decide "can return" per order line in the customer order APIs").
**Backend:** the **core** backend (`server: "market"`, same host as the other
`/customer/order/*` endpoints).
**Auth:** customer `MARKET-TOKEN` (Bearer token), as for the other
`/customer/order/*` endpoints.

Two new fields on each order line, and a new rule for `can_return_order`, in the
customer order APIs. With them, the app can show which products of an order the
customer can still return, and for how many days.

| App screen | Endpoint |
| --- | --- |
| My orders | `GET /customer/order/list` |
| Orders of one checkout | `GET /customer/order/getOrdersByOrderGroupID?order_group_id=` |

- **Base URL:** `{{host}}/api/v1`
- **Audience:** Customer app and website
- **Backend source:** the `OrderLineReturnEligibility` service, the `Order` and
  `OrderDetails` resources, and the feature test
  `CustomerOrderCanReturnPerLineTest` (all in backend PR #637).

No field is renamed or removed. `allow_return_in_days` stays with its old value,
so old app versions keep working.

---

## 1. New fields on each line (`details[]`)

```json
{
  "id": 90211,
  "product_id": 5520,
  "qty": 1,
  "allow_return_in_days": 30,
  "can_return_product": true,
  "return_days_limit": 30
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `return_days_limit` | integer | How many days after the delivery the customer can return this line. It is the return days of the product's deepest category. When the product has no category (or it was deleted), it is the store setting (`refund_day_limit`). |
| `can_return_product` | boolean | `true` when the customer can add this line to a return request **now**. |

`can_return_product` is `true` only when **all** of these are true:

1. The order status is `delivered`.
2. Returns are on in the store settings, and the wallet is on.
3. The shipping method of the order accepts returns.
4. The line quantity is above 0.
5. The line is not already in a return request.
6. The days since the delivery are not more than `return_days_limit`.

**The days are counted from the delivery** of the order. Old orders without a
delivery date use the order date.

### `allow_return_in_days` (old field)

It is not changed. It is the category days, but it is `0` when the product has no
category, and it does not say if the line is still in its days. **New app
versions should use `return_days_limit` and `can_return_product`.**

---

## 2. New rule for `can_return_order` (on each order)

| | Before | Now |
| --- | --- | --- |
| Return days of the order | The **shortest** days of all its lines | Each line has its own days |
| Days counted from | The order date | The delivery date (the order date when there is none) |
| `can_return_order` is `true` when | All the order was in the shortest days | **At least one line** is still in its days (and the other order rules hold, as before) |

**Example:** an order delivered 4 days ago, with a line of 3 days and a line of
30 days.

| | Before | Now |
| --- | --- | --- |
| `can_return_order` | `false` | `true` |
| 3-day line `can_return_product` | — | `false` |
| 30-day line `can_return_product` | — | `true` |

- A line that is already in a return request still counts for
  `can_return_order`. So when the order has an open return request, the customer
  can still edit it (`edit_return_request`), as before.
- `order_has_return_request`, `return_request_id`, `show_return_request` and
  `edit_return_request` are not changed.

### How the app should use it

- Show the "return" button of the order when `can_return_order` is `true`.
- In the return screen, let the customer choose only the lines with
  `can_return_product` = `true`. Show the other lines as "cannot be returned".
- To show the days left, use `return_days_limit` and the delivery date of the
  order.

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
    "total": 1,
    "limit": 10,
    "offset": 1,
    "orders": [
      {
        "id": 5012,
        "order_status": { "value": "delivered", "label": "Delivered" },
        "order_has_return_request": false,
        "return_request_id": null,
        "show_return_request": false,
        "edit_return_request": false,
        "can_return_order": true,
        "details": [
          { "id": 90210, "qty": 1, "allow_return_in_days": 3, "can_return_product": false, "return_days_limit": 3 },
          { "id": 90211, "qty": 1, "allow_return_in_days": 30, "can_return_product": true, "return_days_limit": 30 }
        ]
      }
    ],
    "total_order_group": 1
  }
}
```

---

## 4. `GET /customer/order/getOrdersByOrderGroupID?order_group_id=`

The response is not changed, except for the two new line fields and the new
`can_return_order` rule.

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
      "can_return_order": true,
      "details": [
        { "id": 90210, "can_return_product": false, "return_days_limit": 3 },
        { "id": 90211, "can_return_product": true, "return_days_limit": 30 }
      ]
    }
  ]
}
```

---

## 5. Create return request

The create return request API uses the same rule: an order is accepted when **at
least one line** is still in its days. Before, it refused the whole order when the
shortest line had expired. When no line is in its days, the error message is now:

```
Return period has expired ({days} days since delivery, the longest limit is {limit} days)
```

---

## 6. Other endpoints that also get the new fields

The same order object is used by these responses, so they also get the new fields
and the new `can_return_order` rule. Nothing else changes in them:

- `GET /customer/order/details`
- `GET /customer/order/orders_statuses`
- `GET /customer/order/getOrdersByCartGroupID`
- the checkout response (`POST /customer/order/checkout/{method}`)
- the delivery man order APIs

`GET /customer/order/getHiddenOrders` uses another object and does **not** have
the new line fields.

---

## 7. Errors

No new errors. The existing errors of both endpoints are not changed.
