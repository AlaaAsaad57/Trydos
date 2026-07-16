# Report a Delivered Product — Design Spec

> Date: 2026-06-28
> Area: Order details → per-item options → Report
> Status: Approved (brainstorming), ready for implementation plan

## 1. Goal

Let a customer report a problem with a **delivered** order item across four
points — **Product Quality, Delivery Time, Delivery Worker, Delivery Car** —
each a multi-select list of predefined options, plus one overall free-text note.
The report is submitted to a (dummy, for now) Laravel **market** backend
endpoint. A separate API-requirements doc is produced for the backend engineer.

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Report points | Product Quality, Delivery Time, Delivery Worker, Delivery Car (4) |
| Options source | Hardcoded in frontend; `label` via `translateFunction`, `value` is the wire value |
| Selection | Independent **multi-select** per point |
| Free text | **Single** overall note box for the whole report |
| Report target | **Per product item** (the delivered `order_detail`) |
| Backend | Dummy `POST` on `server: "market"` (Laravel inventory) |
| Visibility | Report row shown only when item's order status === `delivered` |
| Already reported | Backend returns `is_reported: boolean` on each `order_detail`. When `true`, the report row keeps the **same layout** but swaps to a thank-you text and becomes inert (no navigation, no submit) |

## 3. Entry point (already half-wired)

`components/setting/orders/OrderItemOptions.tsx` already renders a
"Report This Product" action row (subtitle "Delivery Time, Delivery Man,
Delivery Car") that calls `setSelectedScreen("report")` and fires
`ORDER_MGMT_EVENTS.ORDER_ITEM_REPORTED`. **There is no `"report"` branch in
`renderScreen()`**, so today the button is dead. This work:

1. Adds the `if (selectedScreen === "report")` branch rendering the new
   `ReportOrderItemWrapper`.
2. Gates the report row to `parentOrder?.order_status?.value === "delivered"`
   (today it is always shown).

## 3a. Already-reported state (`is_reported`)

Backend adds `is_reported: boolean` to every `order_detail` returned by the
order-details endpoint (`getOrdersByOrderGroupID`). Frontend uses it to switch
the report action row into a confirmed state:

- `is_reported === false` (or absent): row reads "Report This Product" /
  subtitle "Delivery Time, Delivery Man, Delivery Car", opens the report form.
- `is_reported === true`: **identical row layout** (same icon, same container),
  but title → "We received your report" and subtitle → "Thanks for your
  thoughts" (i18n). The row is **inert** — `onClick` does nothing, no
  `setSelectedScreen("report")`, cursor not actionable.

After a successful submit, the form calls `update()` (re-fetch order details);
the backend then returns `is_reported: true`, so the row reflects the new state
without optimistic local mutation. (If desired we may optimistically flip it,
but the source of truth is the re-fetch.)

`OrderInterface["details"][number]` gains `is_reported?: boolean` in
`utils/types/OrderInterface.ts`.

## 4. Components & files

### New
- `components/setting/orders/ReportOrderItemWrapper.tsx` — the report form.
  Props mirror the other item screens: `{ item, parentOrder, isRtl,
  backToMain, close, update }`. Internal content only (no portal/scrim — it
  renders inside the existing `OrderItemOptions` bottom-sheet container).
- `utils/orderReportOptions.ts` — the hardcoded options dataset.

### Changed
- `components/setting/orders/OrderItemOptions.tsx` — add `"report"` render
  branch; gate the report row to delivered items; render the inert
  thank-you variant when `orderItem.is_reported === true`.
- `services/order.ts` — add `ReportOrderItem(...)`.
- `utils/Requests.ts` — add `REPORT_ORDER_ITEM` to `REQUESTS_DATA`.
- `utils/types/OrderInterface.ts` — add `is_reported?: boolean` to the
  `details[]` item type.

### Deliverable doc
- `docs/api-requirements/order-product-report.md` — backend contract.

## 5. Options dataset — canonical `point` / `value` contract

This list is the **single source of truth** shared by frontend (rendering +
`value`s sent) and backend (input validation). Backend MUST reject any
`point` or `value` not in this table. Both this spec and the API-requirements
doc carry the exact same list; keep them in sync.

`utils/orderReportOptions.ts` exports an ordered list of points; each option is
`{ value, label }` where `label` is an English source string fed to
`translateFunction` for display, and `value` is the immutable wire value.

| Point (`point`) | Allowed `value`s | Display label (EN) |
|---|---|---|
| `product_quality` | `damaged` | Damaged |
| | `not_as_described` | Not as described |
| | `poor_material` | Poor material / quality |
| | `wrong_item` | Wrong item received |
| | `expired` | Expired / spoiled |
| `delivery_time` | `too_late` | Arrived too late |
| | `missed_window` | Missed the delivery window |
| | `no_eta` | No clear ETA |
| | `faster_than_expected` | Faster than expected (positive) |
| `delivery_worker` | `rude` | Rude behavior |
| | `unprofessional` | Unprofessional |
| | `no_show` | Did not show up |
| | `asked_extra_fee` | Asked for an extra fee |
| | `polite` | Polite & helpful (positive) |
| `delivery_car` | `dirty_vehicle` | Dirty vehicle |
| | `no_cooling` | No cooling / improper temperature |
| | `unsafe_handling` | Unsafe handling |
| | `no_vehicle` | No proper vehicle |

> Labels are starter copy — wordsmith before ship, but **`value`s are frozen**
> once backend validates against them.

Shape:
```ts
export type ReportOption = { value: string; label: string };
export type ReportPoint = { key: string; titleLabel: string; options: ReportOption[] };
export const ORDER_REPORT_POINTS: ReportPoint[] = [ /* 4 points */ ];
```

## 6. UI (design-language conformant)

- Bottom-sheet content: grabber pill, product banner (reuse the image+caption
  block from `OrderItemOptions`), then for each point a section: muted section
  label (`f-12 #8D8D8D`) + a wrapped chip group.
- **Chip**: `px-[12px] h-[39px] rounded-[12px] bg-[#f8f8f8] regular f-12`,
  selected = `1px solid #402CDD80` outline + faint tint (mirrors
  `CancelOrderWrapper`). Multi-select toggles.
- **Note**: floating-label white card (`15px`, hairline border) wrapping a
  `<textarea>`, label "Additional notes (Optional)".
- **Submit CTA**: full-width pill, disabled grey `#D3D3D3` → enabled primary,
  same geometry. Enabled when ≥1 option selected (any point) **OR** note
  non-empty.
- RTL respected via `isRtl` (mirror existing flex-row-reverse handling).
- States: submitting → spinner in CTA; success → success toast +
  `backToMain()` + `update()`; error → `showErrorNotification` + stay open.

## 7. Service + request

`utils/Requests.ts`:
```ts
REPORT_ORDER_ITEM: { reqTitle: "REPORT_ORDER_ITEM", code: 186 },
```

`services/order.ts`:
```ts
async ReportOrderItem({ order_id, order_detail_id, product_id, order_group_id, points, note }) {
  // fetchData({ url: "/customer/order/report", method: "POST",
  //   server: "market", reqTitle: REQUESTS_DATA.REPORT_ORDER_ITEM,
  //   body: JSON.stringify({ order_id, order_detail_id, product_id, order_group_id, points, note }) })
  // throw on !success; LogServerError on catch (existing pattern)
}
```

`points` is the array of `{ point, values }`, including points with empty
`values` (so the backend always sees all four keys) — or filtered to
non-empty; **decision deferred to the API doc** (default: send only non-empty
points + note).

## 8. API contract (dummy, `market`)

```
POST /customer/order/report
Auth: MARKET-TOKEN (customer)

Request:
{
  "order_id": 123,
  "order_detail_id": 456,
  "product_id": 789,
  "order_group_id": "G-123",
  "points": [
    { "point": "product_quality", "values": ["damaged","wrong_item"] },
    { "point": "delivery_time",   "values": ["too_late"] },
    { "point": "delivery_worker", "values": [] },
    { "point": "delivery_car",    "values": ["dirty_vehicle"] }
  ],
  "note": "free text"
}

Success 200:
{ "success": true, "message": "Report submitted", "data": { "report_id": 1 } }

Error (validation / duplicate):
{ "success": false, "message": "..." }
```

**Backend MUST also:**
1. **Validate** `point` and every `value` against the canonical table in §5;
   reject unknown keys with `success: false`.
2. **Set `is_reported = true`** on the reported `order_detail`, and **return
   `is_reported: boolean` on every `order_detail`** in the order-details
   endpoint (`getOrdersByOrderGroupID`) so the frontend can render the
   already-reported state (§3a).
3. Enforce **one report per `order_detail`** — once `is_reported` is true, a
   second submit is rejected (the UI already blocks it, this is defense in
   depth).

Open questions for backend (captured in the API doc):
- Confirm one-report-per-`order_detail` (reject duplicates) vs. upsert.
- Should `points` include empty-value entries or be omitted when empty?
  (Frontend default: omit empty.)

## 9. Analytics

`ORDER_ITEM_REPORTED` already fires on open. Optionally add a
`ORDER_ITEM_REPORT_SUBMITTED` event (order_id, item_id, product_id, selected
point keys, has_note) — to confirm with the events doc per CLAUDE.md if added.

## 10. Out of scope

- Backend implementation (dummy endpoint; frontend wires to the agreed path).
- Editing/viewing a previously submitted report.
- Photo upload in the report (return flow has it; not requested here).
- Per-point free text (single overall note only).
- Fetching options from backend (hardcoded by decision).
```
