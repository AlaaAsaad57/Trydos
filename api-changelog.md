# API Changelog — Order Report Status, Image & Admin Alerts

**Task:** `add-order-report-status-tracking`
**Date:** 2026-07-08
**Audience:** Web / Frontend developers (customer app + admin dashboard)

This release extends the existing **Order Report** feature. Nothing below is a
breaking change — all additions are backward compatible. Existing calls keep working;
new fields simply appear in responses.

---

## 1. Customer — Submit report now accepts an optional image

**Endpoint:** `POST /api/v1/customer/order/report`
**Auth:** `auth:api` (customer `MARKET-TOKEN`) — unchanged.

### What changed
A new **optional** `image` field was added to the request.

| Field | Type | Required | Rules |
|---|---|---|---|
| `image` | file | No | `image` mime, one of `jpeg, png, jpg, webp`, max **4096 KB** |

- If you send an image, submit the request as **`multipart/form-data`** (use `FormData`).
- If you don't need an image, the endpoint still accepts the **same JSON body as before** — no change required.
- All previously required fields (`order_id`, `order_detail_id`, `product_id`, `order_group_id`, `points`, `note`) are unchanged.

### Request example (multipart, with image)
```
POST /api/v1/customer/order/report
Content-Type: multipart/form-data

order_id=123
order_detail_id=456
product_id=789
order_group_id=G-123
points[0][point]=product_quality
points[0][values][]=damaged
note=Box was crushed
image=<binary file>
```

### Response — unchanged
```json
{ "success": true, "message": "Report submitted", "data": { "report_id": 42 } }
```

### Notes
- Every new report is created with `status = "new"` automatically. The client does **not** send a status.
- Image validation failure → HTTP **400** with the standard validation error body; no report is created.
- Business rejections (order not delivered / already reported / not your order) → HTTP **200** with `{ "success": false, "message": "..." }` (unchanged behavior).

---

## 2. Admin — Report object gained `status`, `image`, `delivery_man`

**Endpoints:**
- `GET /api/dashboard_v1/order-reports` (list, paginated)
- `GET /api/dashboard_v1/order-reports/{id}` (single)

**Auth:** `auth:admin-api` + `READ_ORDER_REPORTS` permission — unchanged.

### New response fields on every order-report object
| Field | Type | Description |
|---|---|---|
| `status` | string | Report lifecycle: `"new"`, `"in_review"`, or `"resolved"`. |
| `image` | string \| null | Absolute URL of the customer's attached photo, or `null` if none. |
| `delivery_man` | object \| null | Driver derived from the order: `{ id, name, phone }`, or `null` if unassigned. |

### Full object shape (after this release)
```json
{
  "id": 42,
  "order_id": 123,
  "order_detail_id": 456,
  "order_group_id": "G-123",
  "product_id": 789,
  "points": [
    { "point": "product_quality", "values": ["damaged"] }
  ],
  "note": "Box was crushed",
  "status": "new",
  "image": "https://<media-server>/image/upload/order-report/2026-07-08-abc123.png",
  "created_at": "2026-07-08T10:15:00+00:00",
  "customer": { "id": 5, "name": "…", "email": "…", "phone": "…" },
  "order": { "id": 123, "order_status": "delivered", "order_group_id": "G-123" },
  "order_detail": { "id": 456, "product_name": "…", "qty": 2, "unit_price": 10, "offer_price": 8 },
  "delivery_man": { "id": 3, "name": "Ali Hassan", "phone": "+9715…" }
}
```

### New list filter
`GET /api/dashboard_v1/order-reports` accepts a new **optional** query parameter:

| Query param | Values | Description |
|---|---|---|
| `status` | `new` \| `in_review` \| `resolved` | Filter reports by lifecycle status. Combines (AND) with existing filters. |

Existing filters are unchanged: `search`, `point`, `order_id`, `customer_id`, `product_id`, `order_group_id`, `date_from`, `date_to`.

---

## 3. Admin — NEW endpoint: update report status

**Endpoint:** `PATCH /api/dashboard_v1/order-reports/{id}/status`
**Auth:** `auth:admin-api` + **`UPDATE_ORDER_REPORTS`** permission (or `SUPER_ADMIN`).

### Request body
```json
{ "status": "in_review" }
```

| Field | Type | Required | Allowed values |
|---|---|---|---|
| `status` | string | Yes | `new`, `in_review`, `resolved` |

### Success — HTTP 200
```json
{
  "success": true,
  "message": "Status updated",
  "data": { "id": 42, "status": "in_review" }
}
```

### Error responses
| Status | When | Body |
|---|---|---|
| `422` | `status` missing or not an allowed value | `{ "success": false, "message": "Invalid status. Allowed values: new, in_review, resolved" }` |
| `403` | Admin lacks `UPDATE_ORDER_REPORTS` (and is not super admin) | `{ "message": "You do not have permission to access." }` |
| `404` | No report with that `{id}` | `{ "success": false, "message": "Report not found" }` |
| `401` | Not authenticated | Standard unauthenticated response |

---

## Status reference

| Value | Suggested UI label | Suggested badge color |
|---|---|---|
| `new` | New | amber / warning |
| `in_review` | In Review | blue / info |
| `resolved` | Resolved | green / success |

New reports always start at `new`. Only admins with `UPDATE_ORDER_REPORTS` can change it via endpoint (3).

---

## Migration / rollout notes for frontend
- **Customer app:** switch the report submit to `FormData` **only when** attaching a photo; JSON path still works otherwise.
- **Admin dashboard:** render `status` as a badge, show `image` (clickable to full size) when non-null, optionally show `delivery_man`, add a status filter and a status-change control calling endpoint (3).
- The `points` → `values` allowed contract is **unchanged** by this release.
