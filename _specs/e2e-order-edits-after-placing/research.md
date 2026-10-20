---
ticket: e2e-order-edits-after-placing
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-26
links:
  clickup:
  github:
---

# Research — e2e-order-edits-after-placing

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Add a browser journey that places a cash-on-delivery order and then changes it
the way a shopper can: cancel one line, change the delivery address, hide and
restore the order, hide and restore one line. Each change is proved on the core
backend, not only on the screen.

## What already covers these actions

**The unit suite covers the screens, with every answer faked.** These files
already exist and test the UI decisions (which row shows, which call is made,
what happens on a refusal):

- `tests/components/setting/orders/OrderOptionsMenu.test.tsx` — the order menu, incl. `can_update_address`
- `tests/components/setting/orders/OrderItemOptions.test.tsx` — the line menu, incl. `can_cancele_order`, hide product
- `tests/components/setting/orders/CancelOrderItemWrapper.test.tsx`
- `tests/components/setting/orders/confirmations/CancelOrderItemConfirmationWindow.test.tsx`
- `tests/components/Orders/ChangeAddressWidget.test.tsx`
- `tests/components/setting/orders/HiddenOrdersWidget.test.tsx`
- `tests/components/Orders/HiddenOrderItem.test.tsx`
- `tests/components/setting/orders/OrderDetailsWrapper.test.tsx`
- `tests/services/orders.test.ts`, `tests/services/orderClass.test.ts`

**The browser suite covers none of them.** A search of `tests/e2e/` for
`cancel-item`, `change-address`, `visibility` and `getHiddenOrders` finds
nothing. The only order change the browser suite makes is `BUY-01` in
`tests/e2e/shopper.live.spec.ts`: it places a COD order and cancels the whole
pack.

So the new journey must add what the unit suite cannot see: **the real core
backend accepts each change, and a read-back shows it held.** Re-proving the UI
decisions is not its job.

## How each action works today (from the code)

All five calls go through `utils/fetchData.ts` with `server: "market"`, so
through `/api/proxy`. A signed-in shopper is served by the **core** backend.
`/api/proxy` names it in the `x-market-backend` header.

| Action | Where the shopper starts | Shown only when | Call (`services/order.ts`, `services/orders.ts`) | Id it takes |
|---|---|---|---|---|
| Cancel one line | order page → line's `order-item-options` → "Cancel This Product" → pick a reason → "Cancel Request" → confirmation window | `parentOrder.can_cancele_order && orderItem.qty > 0` (`OrderItemOptions.tsx:116`) | `POST /customer/order/cancel-item` `{ order_id, detail_id, qty }` | pack id + detail id |
| Change address | order page → `screen-options-button` → "Change Delivery Address & Note" → pick an address → "Change Request" → `ConfirmAddressModal` | `order.can_update_address` (`OrderOptionsMenu.tsx:52`) | `POST /customer/order/change-address` `{ order_group_id, new_shipping_address_id }` | **group** id |
| Hide the order | order page → `screen-options-button` → "Hide This Pack" → `ConfirmModal` (`confirm-hide-order`) | always | `PATCH /customer/order/{id}/visibility` `{ is_hidden: true }` | **pack** id |
| Hide one line | line's `order-item-options` → "Hide This Product" → `ConfirmModal` (`confirm-hide-product`) | always | `PATCH /customer/order/detail/{id}/visibility` `{ is_hidden: true }` | detail id |
| See hidden orders | orders list → `screen-options-button` → `open-hidden-orders` → `?view=hidden` | always | `GET /customer/order/getHiddenOrders` (flat list, no paging) | — |
| Restore an order | hidden view → `restore-hidden-order` → `confirm-restore` | the whole group is hidden (`is_fully_hidden`) | same `visibility` call, `is_hidden: false`, once per pack | pack ids |
| Restore one line | hidden view → `restore-hidden-product` → `confirm-restore` | the group is **not** fully hidden | same `detail/{id}/visibility`, `is_hidden: false` | detail id |

Five facts from the code shape the journey:

1. **"Cancel one line" cancels the whole quantity of that line.** The screen
   always sends `qty: orderItem.qty` (`OrderItemOptions.tsx`, `CancelQty`). There
   is no partial cancel on this path. A partial reduction exists only in the
   "Change Product Request → Change Qty" tab, which needs `can_change_variant`.
2. **Hiding the only product hides the whole order.** `OrderItemOptions.tsx`
   shows "This is the only product in this order, so hiding it will hide the
   whole order", and leaves for the orders list. So "hide one line" is a
   separate case only when the pack has **two or more** lines.
3. **Restoring a line and restoring an order are different controls.** The
   hidden view shows per-line eyes (`restore-hidden-product`) only when the group
   is not fully hidden, and one order-level eye (`restore-hidden-order`) only when
   it is.
4. **The orders list does not filter hidden orders on the client.** No code in
   `components/setting/orders/` reads `is_hidden` for the list. The backend
   leaves them out of `/customer/order/list`. So "the order left the list" is a
   backend answer, and the journey can judge it there.
5. **Orders are read from the core backend, not from Elasticsearch.** The
   Elasticsearch lag rule does not apply to any read in this journey.

## Relevant directories

- `tests/e2e/` — the browser suite. The new cases live here.
- `tests/e2e/actions/orders.ts` — `gotoOrdersFromSettings`, `findOrderInList`,
  `openOrderFromList`, `readOrderStatus`, `attemptCancelOrder`. Its pattern — each
  step returns what it found instead of throwing — fits the new actions.
- `tests/e2e/selectors.ts > orders` — the order hooks the suite uses today.
- `tests/e2e/harness/orderCleanup.ts` — the orphan net: `cancelOrderGroup` reads
  the group's packs and cancels each one that says it can be cancelled.
- `tests/e2e/fixtures.ts` — the `orders` fixture that runs that net after a case,
  pass or fail.
- `tests/e2e/shopper.live.spec.ts` — `BUY-01` (places and cancels a COD order)
  and `BUY-03` (creates a probe address through the API and removes it in
  `afterEach`). The order-placing steps are written inline in the spec, not in an
  action file.
- `tests/e2e/harness/qaSeed.ts` — builds the QA shop. It creates **one** product,
  with no colours or sizes (`QA_PRICE = 1000`, `QA_STOCK = 500`,
  `sync_color_images` holds one group).
- `components/setting/orders/` and `components/Orders/` — the screens above.
- `services/order.ts`, `services/orders.ts` — the calls above.

## Relevant config files

- `tests/e2e/laneConfig.ts` — `ACCOUNT_LANE` / `SOLO_LANE`. A spec in neither list
  never runs. Anything that signs in as the shared shopper goes in `ACCOUNT_LANE`.
- `playwright.config.ts` — retries are off, so a placed order is never placed twice.
- `.claude/project-config.yaml` — validation profiles `ui-change`, `logic-change`,
  `full`. None of them runs the browser suite.
- `docs/testing/E2E_SCENARIOS.md` — the table of browser cases, one row per id.

No protected runtime path (`proxy.ts`, `next.config.ts`, instrumentation,
Sentry config, `.github/workflows/**`) is involved.

## Possibly affected services

- **Core backend** — every call in this journey. Signed in, so never the gateway.
- **The shared shopper account** — one more real order per run, plus one probe
  address. Every account-lane spec shares it.
- **The QA shop** — each run takes stock from the QA product (500 units).
- **Component files** — only if new `data-pw` hooks are added (see OQ-4). The
  unit tests for those components must stay green.

## Test / validation commands available

- `pnpm test:e2e:live` — builds, starts the app, runs the browser suite against staging.
- `E2E_LANE=account` — runs the account lane only (the new spec belongs there).
- `pnpm e2e:health` — is staging answering? Run it first.
- `pnpm test:run` — the unit suite, incl. `tests/e2e/laneConfig` checks.
- `pnpm lint`, `pnpm lint:i18n-parity`, `node_modules/.bin/tsc --noEmit`
  (needs `next typegen` first).

## Test layout and naming convention

- **Browser suite:** `tests/e2e/<area>.live.spec.ts` (real staging) or
  `<area>.scripted.spec.ts` (every answer faked). Runner: **Playwright**.
  Shopper actions in `tests/e2e/actions/<area>.ts`, hooks in `tests/e2e/selectors.ts`
  (`page.getByTestId(...)`, which reads `data-pw`), shared machinery in
  `tests/e2e/harness/`. Case ids are `<AREA>-nn` in the test title, and each id
  gets a row in `docs/testing/E2E_SCENARIOS.md`. Long flows use `test.step()`;
  `tests/e2e/profile.live.spec.ts` is the model.
- **Unit suite:** `tests/` mirrors the source path (`components/X/Y.tsx` →
  `tests/components/X/Y.test.tsx`). Runner: **Vitest**.
- **Expected-failure marker:** Playwright `test.fail()`, Vitest `it.fails()`. No
  browser case uses `test.fail()` today; unit files name a confirmed bug in the
  title as `BUG-<area>-n`.

## Risks and unknowns

- **The backend may not offer an action on a new order.** `can_cancele_order` is
  true for a new COD order — `BUY-01` presses "Cancel This Pack", which needs it.
  `can_update_address` has **no evidence** either way: no staging answer is
  stored anywhere in the repository (`tests/fixtures/order.ts` fakes it `false`).
  If staging answers `false`, the change-address case has no button to press.
- **One QA product cannot make a two-line pack.** Cancelling "one line of two"
  and hiding "one line, not the order" both need a second line in the **same
  pack**. One pack is one seller, so the second line must also come from the QA
  shop. Today the seed builds one product with no variants.
- **A run that dies part-way leaves state on a shared account.** The orphan net
  cancels the order, but nothing restores a hidden order or removes the probe
  address. A later run may then find an order that is hidden and cancelled, or an
  extra address.
- **Code budget.** `shopper.live.spec.ts` says a run spends four one-time codes and
  "do not add a sign-in here without counting it". A new journey that signs in
  spends a fifth, unless it takes a handed-on session.
- **Several controls have no `data-pw` hook.** The rows "Change Delivery Address
  & Note", "Hide This Pack", "Cancel This Product", "Hide This Product"; the
  cancel-line reasons and "Cancel Request" button; the cancel-line confirmation's
  terms tick and confirm button; the change-address "Change Request" button; and
  the `ConfirmAddressModal` confirm. Their text is translated, so a text locator
  ties the case to English copy.
- **A changed address may change the price.** Shipping in `sy` depends on the
  address. The journey should read the order's address, not assert its total,
  unless the spec says otherwise.

## Findings (not in scope — recorded, not fixed)

- **FIND-1 — the delivery note is never saved.** `ChangeAddressWidget.tsx` keeps
  `deliveryNote` in state and sends only `note_added` to analytics. The
  "Change Request" button turns active when only a note is typed, and then posts
  `change-address` with the **same** address, and closes as if it worked.
  `docs/features/B-cart-checkout-orders/CO-19-change-delivery-address.md` already
  lists "Delivery note not persisted yet" as a known gap. This ticket does not
  test the note.
- **FIND-2 — the cancel reason is never sent.** Reasons only unlock the button
  (`CancelOrderItemWrapper.tsx`). Already listed in `CO-18-cancel-single-item.md`.

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does a new COD order in `sy` for the QA product answer `can_update_address: true` on staging? And `can_cancele_order` on the **line** menu (the same flag, read from the parent pack)? | With the flag off, the change-address case has no button. The spec must say what the case does then: fail and name the backend flag, or record "not offered" as its own outcome, as `attemptCancelOrder` does. It must never pass silently. |
| OQ-2 | Where does the second line in the same pack come from: a second QA product added by the seed, a QA product with two variants, or no second line (and then drop "other line still active" and "hide one line")? | "Cancel one line" cancels the whole quantity, and hiding the only line hides the order. Without a second line in the pack, ORD-01's "the other line is still active" and ORD-05 cannot be tested. A seed change runs the long path once per environment (index sync 5–10 min). A real seller's product is never allowed. |
| OQ-3 | A new spec file (e.g. `orders.live.spec.ts`) or new cases in `shopper.live.spec.ts`? Should the order-placing steps of `BUY-01` move into `actions/` so both can share them? | PL-14: a second test file for the same unit is a defect, but the order flow is a new area. Placing the order is inline in `BUY-01` today. |
| OQ-4 | May the ticket add `data-pw` hooks to the component files listed in Risks, or must the cases find those controls another way? | Adding a hook is an application-code edit in files that have unit tests. A text locator depends on the English copy. |
| OQ-5 | How does the journey sign in: its own sign-in (a fifth code per run), or a handed-on session? | The shop rate-limits codes per phone number. `shopper.live.spec.ts` counts them on purpose. |
| OQ-6 | What does teardown put back when the case dies part-way: restore a hidden order and line, remove the probe address, cancel the order? Does `cancelOrderGroup` still find the packs of a hidden order? | The account is shared. A hidden, cancelled order left behind is invisible in the list and may confuse the next run. |
| OQ-7 | Which fields of `getOrdersByOrderGroupID` / `getHiddenOrders` prove each change on the core backend: the pack's `shipping_address` / `shipping_address_data` for the address, the line's `qty` or status for a cancelled line, `is_hidden` on pack and line? | `utils/types/OrderInterface.ts` says `is_hidden` is "present on the getHiddenOrders response". If `getOrdersByOrderGroupID` does not carry it, the read-back for a hidden line must use `getHiddenOrders`. |
| OQ-8 | In which order do the steps run? Change address and cancel line need an order that is still open. Hide and restore work on any order. Can a cancelled order still be hidden and restored? | The final cancel is also the clean-up. If hide/restore runs after it, the order is already safe when those steps fail. |
| OQ-9 | Is the delivery note (FIND-1) and the cancel reason (FIND-2) out of scope? | Both are known gaps in the feature docs. Testing them now would make the journey red for a known reason. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No staging call was made. OQ-1 and OQ-7 need a real answer from staging; the
  spec decides whether a read-only probe is part of the plan.
