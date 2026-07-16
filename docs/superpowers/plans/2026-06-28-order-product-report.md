# Report a Delivered Product — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a customer report a problem with a delivered order item across four points (Product Quality, Delivery Time, Delivery Worker, Delivery Car), each multi-select, plus one overall note — submitted to a dummy Laravel `market` endpoint — and show a "thank you / already reported" state driven by `is_reported`.

**Architecture:** Reuse the existing per-item bottom-sheet in `OrderItemOptions.tsx` (the "report" action row already exists but is a dead button). Add a `"report"` screen branch that renders a new `ReportOrderItemWrapper` form. Options are a hardcoded frontend dataset (`{ value, label }`, label via `translateFunction`). A new `Order.ReportOrderItem()` service posts to `market`. The `is_reported` flag on each `order_detail` (returned by the backend) toggles the row into an inert thank-you variant.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, TailwindCSS 4, `fetchData` client fetch wrapper, `translateFunction` i18n.

## Global Constraints

- **No test files.** Repo policy (CLAUDE.md): no test suite; rely on type-check + lint + manual verification. Do NOT create `*.test.*` / `*.spec.*` files.
- **Fetch path:** client-side calls use `fetchData({ url, method, body, server, reqTitle })`. `server: "market"` for the Laravel inventory backend.
- **i18n:** every user-facing string goes through `translateFunction(...)` (imported from `utils/functions`).
- **Design tokens:** Quicksand `font-sans`; sizes `f-10/12/14` (Tailwind `text-[10px]/[12px]/[14px]`); chip bg `#f8f8f8`, selected outline `1px solid #402CDD80`; primary CTA fill enabled `#FF5F61`-style red used by cancel? NO — use primary indigo `#402CDD`/disabled `#D3D3D3` (match `CancelOrderWrapper` selection + gated CTA geometry). Radius `15px` cards / `12px` chips. Single shadow `0 3px 10px rgba(0,0,0,0.1)`.
- **RTL:** mirror existing `isRtl ? "flex-row-reverse" : ""` handling.
- **Frozen wire values:** the `point` keys and option `value`s in Task 2 are the canonical contract shared with backend (see spec §5). Labels may change; values may NOT.
- **Verification command (type-check):** `npx tsc --noEmit` (run from repo root). Lint: `pnpm lint`.

---

### Task 1: Register the request title

**Files:**
- Modify: `utils/Requests.ts` (end of `REQUESTS_DATA`, after `HIDE_ORDER_DETAIL` code 185)

**Interfaces:**
- Produces: `REQUESTS_DATA.REPORT_ORDER_ITEM = { reqTitle: "REPORT_ORDER_ITEM", code: 186 }`

- [ ] **Step 1: Add the entry**

In `utils/Requests.ts`, add as the last entry of the `REQUESTS_DATA` object (after `HIDE_ORDER_DETAIL: { reqTitle: "HIDE_ORDER_DETAIL", code: 185 },`):

```ts
  REPORT_ORDER_ITEM: { reqTitle: "REPORT_ORDER_ITEM", code: 186 },
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors).

- [ ] **Step 3: Commit**

```bash
git add utils/Requests.ts
git commit -m "feat(orders): register REPORT_ORDER_ITEM request title"
```

---

### Task 2: Report options dataset + types

**Files:**
- Create: `utils/orderReportOptions.ts`

**Interfaces:**
- Produces:
  - `type ReportOption = { value: string; label: string }`
  - `type ReportPoint = { key: string; titleLabel: string; options: ReportOption[] }`
  - `const ORDER_REPORT_POINTS: ReportPoint[]` (4 points, exact `key`/`value`s below)
  - `type ReportPointSelection = { point: string; values: string[] }`

- [ ] **Step 1: Create the file**

Create `utils/orderReportOptions.ts`:

```ts
// Canonical report points + options. The `value`s here are the frozen wire
// contract shared with the backend (see docs/api-requirements/order-product-report.md
// and the design spec §5). `label`/`titleLabel` are English source strings fed
// to translateFunction at render time — safe to reword; values are not.

export type ReportOption = { value: string; label: string };

export type ReportPoint = {
  key: string;
  titleLabel: string;
  options: ReportOption[];
};

export type ReportPointSelection = { point: string; values: string[] };

export const ORDER_REPORT_POINTS: ReportPoint[] = [
  {
    key: "product_quality",
    titleLabel: "Product Quality",
    options: [
      { value: "damaged", label: "Damaged" },
      { value: "not_as_described", label: "Not as described" },
      { value: "poor_material", label: "Poor material / quality" },
      { value: "wrong_item", label: "Wrong item received" },
      { value: "expired", label: "Expired / spoiled" },
    ],
  },
  {
    key: "delivery_time",
    titleLabel: "Delivery Time",
    options: [
      { value: "too_late", label: "Arrived too late" },
      { value: "missed_window", label: "Missed the delivery window" },
      { value: "no_eta", label: "No clear ETA" },
      { value: "faster_than_expected", label: "Faster than expected" },
    ],
  },
  {
    key: "delivery_worker",
    titleLabel: "Delivery Worker",
    options: [
      { value: "rude", label: "Rude behavior" },
      { value: "unprofessional", label: "Unprofessional" },
      { value: "no_show", label: "Did not show up" },
      { value: "asked_extra_fee", label: "Asked for an extra fee" },
      { value: "polite", label: "Polite & helpful" },
    ],
  },
  {
    key: "delivery_car",
    titleLabel: "Delivery Car",
    options: [
      { value: "dirty_vehicle", label: "Dirty vehicle" },
      { value: "no_cooling", label: "No cooling / improper temperature" },
      { value: "unsafe_handling", label: "Unsafe handling" },
      { value: "no_vehicle", label: "No proper vehicle" },
    ],
  },
];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add utils/orderReportOptions.ts
git commit -m "feat(orders): add report points/options dataset"
```

---

### Task 3: Add `is_reported` to the order-detail type

**Files:**
- Modify: `utils/types/OrderInterface.ts` (inside `OrderInterface.details` array item, near `comments: any;` ~line 116)

**Interfaces:**
- Produces: `OrderInterface["details"][number].is_reported?: boolean`

- [ ] **Step 1: Add the field**

In `utils/types/OrderInterface.ts`, inside the `details: Array<{ ... }>` object literal, add after `comments: any;`:

```ts
    is_reported?: boolean;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add utils/types/OrderInterface.ts
git commit -m "feat(orders): add is_reported flag to order detail type"
```

---

### Task 4: `ReportOrderItem` service method

**Files:**
- Modify: `services/order.ts` (add a method inside the `OrderService` class; import `ReportPointSelection`)

**Interfaces:**
- Consumes: `REQUESTS_DATA.REPORT_ORDER_ITEM` (Task 1), `ReportPointSelection` (Task 2), existing `fetchData`, `LogServerError`.
- Produces:
  ```ts
  Order.ReportOrderItem(args: {
    order_id: number;
    order_detail_id: number;
    product_id: number;
    order_group_id: string;
    points: ReportPointSelection[];
    note: string;
  }): Promise<any>   // resolves on success, throws on failure
  ```

- [ ] **Step 1: Add the import**

At the top of `services/order.ts`, add:

```ts
import type { ReportPointSelection } from "utils/orderReportOptions";
```

- [ ] **Step 2: Add the method**

Inside the `OrderService` class (e.g. after `HideOrderDetail`), add:

```ts
  async ReportOrderItem({
    order_id,
    order_detail_id,
    product_id,
    order_group_id,
    points,
    note,
  }: {
    order_id: number;
    order_detail_id: number;
    product_id: number;
    order_group_id: string;
    points: ReportPointSelection[];
    note: string;
  }) {
    try {
      let response = await fetchData({
        url: `/customer/order/report`,
        reqTitle: REQUESTS_DATA.REPORT_ORDER_ITEM,
        method: "POST",
        server: "market",
        body: JSON.stringify({
          order_id,
          order_detail_id,
          product_id,
          order_group_id,
          points,
          note,
        }),
      });
      if (response.success || response.isSuccessful) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In ReportOrderItem in services/order",
      });
      throw error;
    }
  }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add services/order.ts
git commit -m "feat(orders): add ReportOrderItem service (dummy market endpoint)"
```

---

### Task 5: `ReportOrderItemWrapper` form component

**Files:**
- Create: `components/setting/orders/ReportOrderItemWrapper.tsx`

**Interfaces:**
- Consumes: `ORDER_REPORT_POINTS`, `ReportPointSelection` (Task 2); `Order.ReportOrderItem` (Task 4); `OrderInterface` type; `translateFunction`, `LogError` from `utils/functions`; `showErrorNotification`, `showSuccessNotification` from `store/notifications/reducer`; `Spinner`.
- Produces: default export `ReportOrderItemWrapper` with props:
  ```ts
  {
    item: OrderInterface["details"][0];
    parentOrder: OrderInterface;
    isRtl: boolean;
    backToMain: () => void;
    close: () => void;
    update: () => Promise<any>;
  }
  ```

> Note: `showSuccessNotification` and `showErrorNotification` are confirmed exports of `store/notifications/reducer.ts` (lines 63 / 81). Use them as-is.

- [ ] **Step 1: Create the component**

Create `components/setting/orders/ReportOrderItemWrapper.tsx`:

```tsx
import React, { useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import { OrderInterface } from "utils/types/OrderInterface";
import Order from "services/order";
import Spinner from "components/global/Spinner";
import {
  ORDER_REPORT_POINTS,
  ReportPointSelection,
} from "utils/orderReportOptions";
// Adjust these imports to the real exported names verified in Step 1:
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";

function ReportOrderItemWrapper({
  item,
  parentOrder,
  isRtl,
  backToMain,
  close,
  update,
}: {
  item: OrderInterface["details"][0];
  parentOrder: OrderInterface;
  isRtl: boolean;
  backToMain: () => void;
  close: () => void;
  update: () => Promise<any>;
}) {
  // selections: { [pointKey]: string[] }
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (pointKey: string, value: string) => {
    setSelections((prev) => {
      const current = prev[pointKey] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [pointKey]: next };
    });
  };

  const selectedCount = Object.values(selections).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  const canSubmit = selectedCount > 0 || note.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || loading) return;
    const points: ReportPointSelection[] = ORDER_REPORT_POINTS.map((p) => ({
      point: p.key,
      values: selections[p.key] ?? [],
    })).filter((p) => p.values.length > 0); // omit empty points
    try {
      setLoading(true);
      await Order.ReportOrderItem({
        order_id: parentOrder.id,
        order_detail_id: item.id,
        product_id: item.product_id,
        order_group_id: parentOrder.order_group_id,
        points,
        note: note.trim(),
      });
      showSuccessNotification(
        translateFunction("We received your report. Thanks for your thoughts"),
      );
      await update();
      setLoading(false);
      backToMain();
    } catch (error) {
      setLoading(false);
      showErrorNotification(
        translateFunction("Could not submit your report. Please try again"),
      );
      LogError({
        error,
        scenario: "Error In submit in ReportOrderItemWrapper",
      });
    }
  };

  return (
    <div
      className="flex-col w-full items-center"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
    >
      <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]" />
      <span className="medium text-[14px] mt-[12px] text-[#1D1D1D]">
        {translateFunction("Report This Product")}
      </span>
      <span className="regular text-[12px] mt-[4px] text-[#8D8D8D] text-center">
        {translateFunction(
          "Tell us what went wrong so we can improve your experience",
        )}
      </span>
      <span className="border-[#C4C2C280] border-b w-full mt-[12px]" />

      {ORDER_REPORT_POINTS.map((point) => (
        <div key={point.key} className="flex-col w-full mt-[16px]">
          <span className="regular text-[12px] text-[#8D8D8D]">
            {translateFunction(point.titleLabel)}
          </span>
          <div className="flex-row w-full flex-wrap items-center mt-[10px] gap-y-[10px] gap-x-[12px]">
            {point.options.map((opt) => {
              const active = (selections[point.key] ?? []).includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggle(point.key, opt.value)}
                  className="px-[12px] w-auto cursor-pointer flex-row h-[39px] justify-center items-center rounded-[12px] bg-[#F8F8F8]"
                  style={{
                    flex: "0 1 auto",
                    border: active ? "1px solid #402CDD80" : "none",
                  }}
                >
                  <span className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction(opt.label)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex-col w-full mt-[20px]">
        <span className="regular text-[12px] text-[#505050]">
          {translateFunction("Additional notes")}{" "}
          <span className="text-[#929191]">
            ({translateFunction("Optional")})
          </span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          dir={isRtl ? "rtl" : "ltr"}
          placeholder={translateFunction("Write more details here")}
          className="mt-[8px] w-full rounded-[15px] border border-[#E6E6E6] bg-white p-[12px] regular text-[12px] text-[#3c3c3c] outline-none resize-none"
        />
      </div>

      <div
        onClick={submit}
        className={`${
          canSubmit ? "bg-[#402CDD]" : "bg-[#D3D3D3]"
        } rounded-[20px] text-white text-[14px] medium h-[50px] flex-row w-full items-center justify-center mt-[20px] cursor-pointer`}
      >
        {loading ? <Spinner /> : translateFunction("Submit Report")}
      </div>
      <div
        onClick={() => backToMain()}
        className="w-full h-[44px] items-center justify-center underline flex cursor-pointer text-[14px] text-[#8D8D8D] medium mt-[6px]"
      >
        {translateFunction("Cancel")}
      </div>
    </div>
  );
}

export default ReportOrderItemWrapper;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/setting/orders/ReportOrderItemWrapper.tsx
git commit -m "feat(orders): add ReportOrderItemWrapper report form"
```

---

### Task 6: Wire the report screen + gating + already-reported state

**Files:**
- Modify: `components/setting/orders/OrderItemOptions.tsx`
  - Add import for `ReportOrderItemWrapper`.
  - Gate the report row to delivered items; render inert thank-you variant when `orderItem.is_reported`.
  - Add the `selectedScreen === "report"` branch in `renderScreen()`.

**Interfaces:**
- Consumes: `ReportOrderItemWrapper` (Task 5); existing `orderItem`, `parentOrder`, `isRtl`, `update`, `close`, `setSelectedScreen`.

- [ ] **Step 1: Import the component**

At the top of `OrderItemOptions.tsx`, add with the other imports:

```ts
import ReportOrderItemWrapper from "./ReportOrderItemWrapper";
```

- [ ] **Step 2: Add a delivered-gate helper**

Near the other helper predicates (e.g. after `canCancelProduct`), add:

```ts
  const isDelivered = () =>
    parentOrder?.order_status?.value === "delivered";
```

- [ ] **Step 3: Replace the report row with gated + reported-aware variant**

Find the existing report action row (the `<div>` with `onClick` firing `ORDER_MGMT_EVENTS.ORDER_ITEM_REPORTED` and `setSelectedScreen("report")`, containing `/icons/ReportOrderItemIcon.svg`). Replace that entire `{ <div ...> ... </div> }` block with:

```tsx
            {isDelivered() &&
              (orderItem?.is_reported ? (
                <div
                  className={`mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                    isRtl ? "flex-row-reverse" : " "
                  }`}
                >
                  <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                    <img src="/icons/ReportOrderItemIcon.svg" />
                  </div>
                  <div className="flex-col ml-[15px]">
                    <span
                      className={`regular text-[14px] text-[#1D1D1D] medium ${
                        isRtl ? " text-right pr-2" : " "
                      }`}
                    >
                      {translateFunction("We received your report")}
                    </span>
                    <span
                      className={`regular text-[12px] text-[#8D8D8D] ${
                        isRtl ? "pr-2 " : " "
                      }`}
                    >
                      {translateFunction("Thanks for your thoughts")}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_ITEM_REPORTED, {
                      order_id: parentOrder?.id,
                      item_id: orderItem?.id,
                      product_id: orderItem?.product_id,
                    });
                    setSelectedScreen("report");
                  }}
                  className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                    isRtl ? "flex-row-reverse" : " "
                  }`}
                >
                  <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                    <img src="/icons/ReportOrderItemIcon.svg" />
                  </div>
                  <div className="flex-col ml-[15px]">
                    <span
                      className={`regular text-[14px] text-[#1D1D1D] medium ${
                        isRtl ? " text-right pr-2" : " "
                      }`}
                    >
                      {translateFunction("Report This Product")}
                    </span>
                    <span
                      className={`regular text-[12px] text-[#8D8D8D] ${
                        isRtl ? "pr-2 " : " "
                      }`}
                    >
                      {translateFunction(
                        "Delivery Time, Delivery Man, Delivery Car",
                      )}
                    </span>
                  </div>
                </div>
              ))}
```

- [ ] **Step 4: Add the `"report"` render branch**

In `renderScreen()`, after the `if (selectedScreen === "cancelProduct") { ... }` block (and before the closing of `renderScreen`), add:

```tsx
    if (selectedScreen === "report") {
      return (
        <ReportOrderItemWrapper
          item={orderItem}
          parentOrder={parentOrder}
          isRtl={isRtl}
          backToMain={() => setSelectedScreen("options")}
          close={close}
          update={update}
        />
      );
    }
```

- [ ] **Step 5: Type-check + lint**

Run: `npx tsc --noEmit`
Expected: PASS.
Run: `pnpm lint`
Expected: no new errors for the touched files.

- [ ] **Step 6: Manual verification**

Start the app (`pnpm dev`), open a **delivered** order's details → tap a product's kebab → "Report This Product". Verify:
- The report form opens with 4 point sections + chips toggling (outline+tint on select) + note box.
- Submit is grey/disabled until a chip is selected or the note has text.
- Submitting shows the spinner, then returns to the options list (network call to `/customer/order/report` on `market` is fired; a dummy 404/`success:false` will surface the error toast — expected until backend lands).
- For a non-delivered item, the report row is absent.
- (Once backend returns `is_reported: true`) the row shows "We received your report / Thanks for your thoughts" and does nothing on tap.

- [ ] **Step 7: Commit**

```bash
git add components/setting/orders/OrderItemOptions.tsx
git commit -m "feat(orders): wire report screen, gate to delivered, show reported state"
```

---

### Task 7: Backend API-requirements deliverable

**Files:**
- Create: `docs/api-requirements/order-product-report.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Write the doc**

Create `docs/api-requirements/order-product-report.md`:

```markdown
# API Requirement — Report a Delivered Product

**Requested by:** Frontend (order details → per-item report)
**Backend:** Laravel "market" (inventory) service — `NEXT_PUBLIC_GO_BACKEND_URL`? No — the **market** Laravel base URL used by `server: "market"` in the frontend fetch layer.
**Auth:** customer `MARKET-TOKEN` (same as other `/customer/order/*` endpoints).

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

## 2. Validation — canonical point/value contract

Reject (`success: false`) any `point` or `value` not in this table. This list
is frozen and mirrored in the frontend (`utils/orderReportOptions.ts`).

| `point` | allowed `values` |
|---|---|
| `product_quality` | `damaged`, `not_as_described`, `poor_material`, `wrong_item`, `expired` |
| `delivery_time` | `too_late`, `missed_window`, `no_eta`, `faster_than_expected` |
| `delivery_worker` | `rude`, `unprofessional`, `no_show`, `asked_extra_fee`, `polite` |
| `delivery_car` | `dirty_vehicle`, `no_cooling`, `unsafe_handling`, `no_vehicle` |

Also validate that `order_detail_id` belongs to `order_id`/the requesting
customer and that the order/item is in a `delivered` state.

## 3. New flag — `is_reported` on order details

Add `is_reported: boolean` to **every** `order_detail` object returned by:

`GET /customer/order/getOrdersByOrderGroupID?order_group_id=...`

- `false` (default) until a report exists for that `order_detail`.
- Set to `true` after a successful `POST /customer/order/report` for that item.

The frontend uses this to switch the report row to an inert "we received your
report" state, so the value MUST be present and accurate on the details
response (not only on the report response).

## 4. Uniqueness / open questions

1. **One report per `order_detail`?** Preferred: yes — once `is_reported` is
   true, reject a second `POST` with `success: false`. Confirm or propose
   upsert instead.
2. Storage shape is backend's call, but the report should retain: customer id,
   order/order_detail/product/order_group ids, the selected `points`+`values`,
   the `note`, and a timestamp.
3. Endpoint path `/customer/order/report` is a proposal — confirm or provide
   the final path; the frontend has it in one place (`services/order.ts`).
```

- [ ] **Step 2: Commit**

```bash
git add docs/api-requirements/order-product-report.md
git commit -m "docs: API requirements for order product report endpoint"
```

---

## Self-Review

**Spec coverage:**
- Entry point + dead-button wiring → Task 6. ✓
- Delivered-only gating → Task 6 Step 2/3. ✓
- 4 points, multi-select, hardcoded options `{value,label}` → Tasks 2 + 5. ✓
- Single overall note → Task 5. ✓
- Gated CTA (disabled→enabled, same geometry) → Task 5. ✓
- Per-item target (order_detail_id) → Tasks 4 + 5. ✓
- Service + request title + market endpoint → Tasks 1 + 4. ✓
- `is_reported` type + inert thank-you row → Tasks 3 + 6. ✓
- Canonical point/value validation list → Tasks 2 + 7. ✓
- Backend deliverable doc → Task 7. ✓
- Design-language conformance (chips, tokens, RTL) → Task 5 + Global Constraints. ✓

**Placeholder scan:** Task 5 Step 1 intentionally verifies the toast helper name before writing (not a placeholder — a guarded import). No TODO/TBD left.

**Type consistency:** `ReportPointSelection { point, values }` defined in Task 2, consumed identically in Tasks 4 & 5. `ORDER_REPORT_POINTS[].key` used as `point` wire value consistently. `is_reported?: boolean` defined in Task 3, read in Task 6.

**Verified pre-write:** `showSuccessNotification` / `showErrorNotification` confirmed in `store/notifications/reducer.ts`; `HIDE_ORDER_DETAIL` (185) confirmed as the max request code so `186` is free; the dead report row + `ORDER_ITEM_REPORTED` event confirmed present in `OrderItemOptions.tsx`.
