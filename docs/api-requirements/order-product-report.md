# API Requirement — Report a Delivered Product

**Requested by:** Frontend (order details → per-item report)
**Backend:** Laravel **market** (inventory) service — the base URL the frontend
calls with `server: "market"` (same host as the other `/customer/order/*`
endpoints, e.g. cancel, return, hide).
**Auth:** customer `MARKET-TOKEN` (same as other `/customer/order/*` endpoints).

A delivered order item can be reported across four points. Each point is a
multi-select list of predefined options; there is one overall free-text note.

## 1. New endpoint — submit a report

`POST /customer/order/report`

### Request body
```json
{
  "order_id": 123,
  "order_detail_id": 456,
  "product_id": 789,
  "order_group_id": "G-123",
  "points": [
    { "point": "product_quality", "values": ["damaged", "wrong_item"] },
    { "point": "delivery_time", "values": ["too_late"] },
    { "point": "delivery_car", "values": ["dirty_vehicle"] }
  ],
  "note": "free text the user typed (may be empty string)"
}
```

- `order_detail_id` is the specific delivered line item being reported.
- `points` contains only the points the user selected something for (empty
  points are omitted by the client). Each `values` array is non-empty.
- `note` is an optional free-text string (whole-report, not per point).

### Success response (200)
```json
{ "success": true, "message": "Report submitted", "data": { "report_id": 1 } }
```

### Error response
```json
{ "success": false, "message": "Reason (e.g. already reported / invalid value)" }
```

The frontend treats `success: true` (or `isSuccessful: true`) as success and
anything else as an error (it shows a toast and keeps the form open).

## 2. Validation — canonical point/value contract

Reject (`success: false`) any `point` or `value` not in this table. This list
is frozen and mirrored in the frontend (`utils/orderReportOptions.ts`). Display
labels live on the frontend; the backend only needs the keys/values below.

| `point` | allowed `values` |
|---|---|
| `product_quality` | `damaged`, `not_as_described`, `poor_material`, `wrong_item`, `expired` |
| `delivery_time` | `too_late`, `missed_window`, `no_eta`, `faster_than_expected` |
| `delivery_worker` | `rude`, `unprofessional`, `no_show`, `asked_extra_fee`, `polite` |
| `delivery_car` | `dirty_vehicle`, `no_cooling`, `unsafe_handling`, `no_vehicle` |

Also validate that `order_detail_id` belongs to `order_id` / the requesting
customer, and that the order is in a `delivered` state.

## 3. New flag — `is_reported` on order details

Add `is_reported: boolean` to **every** `order_detail` object returned by:

`GET /customer/order/getOrdersByOrderGroupID?order_group_id=...`

- `false` (default) until a report exists for that `order_detail`.
- Set to `true` after a successful `POST /customer/order/report` for that item.

The frontend uses this to switch the report row to an inert "we received your
report" state, so the value MUST be present and accurate on the **details
response** (not only on the report response).

## 4. Uniqueness / open questions

1. **One report per `order_detail`?** Preferred: yes — once `is_reported` is
   true, reject a second `POST` with `success: false`. Confirm, or propose
   upsert (allow editing an existing report) instead.
2. Storage shape is backend's call, but the report should retain: customer id,
   order / order_detail / product / order_group ids, the selected
   `points` + `values`, the `note`, and a timestamp.
3. Endpoint path `/customer/order/report` is a proposal — confirm or provide
   the final path. The frontend has it in exactly one place
   (`services/order.ts → ReportOrderItem`), so changing it is a one-line edit.
4. Should the client send empty-`values` points too, or keep omitting them?
   Current client behavior: **omit** points with no selected values.
5. as a backend dev you have the full control to edit the endpoint's path,body,.. just tell me what i should change.