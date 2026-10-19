# Seller Dashboard Orders — Tester Guide

How to test the **orders** part of the Seller Dashboard. No coding needed.
Everything here was read from the code, not from older docs.

The orders part has two screens:

- **A. The Orders tab** — the shop's order list, one order's detail, and the
  item actions (confirm, pack, cancel).
- **B. The product Orders modal** — the **Orders** button on a product card.
  It lists the orders that hold that one product. It is read-only.

Source files:

- `components/SellerDashboard/orders.tsx` (the Orders tab)
- `components/SellerDashboard/productOrders/ProductOrdersModal.tsx` and
  `types.ts` (the product Orders modal)
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`
  (menu, permission checks, product card buttons)
- `services/sellerDashboard/index.ts` (the API calls)
- Backend contract for the product orders API: `shop-seller-orders-apis.md`

---

## 1. Purpose

Check that a seller can:

1. see the orders of their shop, filtered by status;
2. open one order and read its items correctly;
3. move each item through the steps **Confirm → Packed → Ready To Collect**, or
   cancel it;
4. see, from a product card, which orders hold that product.

Also check that users without the right permission cannot do these things.

## 2. Scope

- Orders tab: open, list, filter tabs, empty state, error state, Retry, more
  pages on scroll, order detail, item actions, back buttons, push refresh.
- Product Orders modal: open, filters, cards, empty states, error, paging,
  close.
- Permissions for both screens.
- The four languages (`en`, `ar`, `tr`, `ku`) and right-to-left layout.
- The effect of a seller action on the **shopper's** own order page.

## 3. Out of scope

- **Changing the status of a whole order.** The code has a status dropdown,
  but it is switched off (commented out). You will not see it. Do not report
  it as missing.
- Payments, refunds, shipping, delivery man and tracking. The permissions
  exist, but there is no screen for them.
- The **Carts** button and the Carts tab.
- The shopper's checkout. Use it only to create test orders.

## 4. Assumptions

- Staging is up. Run `pnpm e2e:health` or open the storefront home first.
- The test shop has orders in several states. If it does not, create them from
  a shopper account (see section 7).
- All prices on the Orders tab are in **USD**. The product Orders modal shows
  the **shop currency** when the backend sends it. See section 12, note 3.

## 5. Preconditions

1. A seller account that belongs to a shop.
2. Accounts (or roles) for these permission cases:

   | Case | Permissions |
   | --- | --- |
   | P1 — full | `SUPER_ADMIN` |
   | P2 — reader | `READ_ORDERS` only |
   | P3 — other order permission | for example `CHANGE_ORDER_STATUS` only, **no** `READ_ORDERS` |
   | P4 — no orders | no permission from the Orders group |

3. A shopper account in country `sy`. Cash on delivery exists only in `sy`, so
   that is the easiest way to place orders.

## 6. Environment and build

- Use the `sy-en` locale in every URL you type. `gb-en` opens the region picker
  over the page and every click lands on it.
- Open the Orders tab:
  1. Sign in → **Seller Profile** → pick a shop → **Enter Dashboard**.
  2. Click **Orders** in the side menu (☰), or the **Orders** tile on the
     dashboard home.
  3. The URL becomes
     `/sy-en/sellerProfile/sellerDashboard/<sellerId>?tab=orders`.
- Open the product Orders modal:
  1. Open the **Products** tab.
  2. On a product card, click the small **Orders** button (top corner of the
     picture, under **Carts**).
- Browsers: Chrome desktop, and one phone (Safari on iPhone or Chrome on
  Android). The Orders tab is built like a phone screen, so check it on a
  phone width too.

## 7. Test data

Create these orders for the test shop from the shopper account. Write down
every order id.

| Id | What to make | Used in |
| --- | --- | --- |
| D1 | An order with 1 product, qty 1, **no offer price** | O-21, BUG-2 |
| D2 | An order with 1 product, qty 3, with an offer price | O-12, O-21 |
| D3 | An order with 3 different products | O-11, O-20–O-24 |
| D4 | An order with 5 or more products | O-10 (only 4 pictures show) |
| D5 | An order the shopper then cancels | O-25 |
| D6 | The **same product** in 2–3 orders, one in each colour or size | M-04, M-05 |
| D7 | A product with **no** orders | M-07 |
| D8 | Enough orders for more than one page (ask the backend team for the page size) | O-08, M-09 |

The shop and the shopper account are shared by other testers. Before you
start, write down what is already there. Never assume the account is clean.

---

## 8. What the screens show

### A. Orders tab — list card

| Part | Where it comes from | What to check |
| --- | --- | --- |
| Clock + time | `created_at` (or `updated_at`) | A date and time. "N/A" only if the backend sends no date. |
| Blue `Nm` after the time | `remaining_in_minutes` | Minutes left to act, for example `45m`. Hidden when 0. On the list it is **always minutes** (`125m`), not hours. |
| Bag + number | order `id` | The order id |
| Bell + status | `order_status` | The backend's label, for example **Waiting Confirm** |
| `N Item` | sum of `qty` of all lines | 3 lines with qty 1, 1, 2 → **4 Item** |
| `. amount USD` | `order_amount` | The total in USD |
| Pictures | first 4 lines | At most 4 pictures. "No image" box when a line has no picture. "No items" box when the order has no lines. |

### A. Orders tab — filter tabs

| Tab | Sends `status=` |
| --- | --- |
| All | nothing |
| In Progress | `in_progress` (pending, processing or packaged) |
| Collected | `collected` |
| Returned | `returned` |
| Cancelled | `canceled` |

The tabs are greyed out and cannot be clicked while a list is loading.

### A. Orders tab — order detail

| Part | What to check |
| --- | --- |
| **Order Number** | Same id as the card |
| **Order Date** | Same time as the card |
| **Order Invoice** | Same amount as the card, in USD |
| **Collect Type** + 4 icons | Icon 1 is always black. Icon 2 turns black when **all** items are confirmed. Icon 3 when all are packed. Icon 4 when all are collected. Otherwise they are light grey. |
| **Duration To Do Action** | `Remaining 2h 5m`, `Remaining 2h`, `Remaining 45m`, or **No remaining time** |
| **Order Details / Order Status** | `N Item`, then `Confirmed x/N`, `Packed x/N`, `Collected x/N`. These count **quantity**, not lines. |
| One block per item | Picture, brand logo, product name, **Color:**, **Size:**, **ID:** (product id), **Quantity:**, price, **Status:** |

Item price: qty 1 shows one number. Qty 2 or more shows
`unit price / line total`, for example `20 / 60 USD`.

Item status and its buttons:

| Item state | **Status:** reads | Buttons |
| --- | --- | --- |
| Not confirmed | Pending | **Confirm & Start Packing** (blue) and **Cancel** (red) |
| Confirmed, not packed | Confirmed | **Packed** (purple) |
| Packed | Packed | **Ready To Collect** label — not a button |

All buttons are greyed out when the order status is `canceled`, or the item
quantity is 0.

### B. Product Orders modal

| Part | What to check |
| --- | --- |
| Header | Product picture, product name, **Product ID: N**, and a close (×) button |
| Filter | All · In Progress · Collected · Returned · Canceled — translated in every language |
| Card, top | Time as `Today | 14:05:00`, `Yesterday | …` or `5 Oct 2026 | …`, and the order id |
| Card, middle | Status (**Waiting Confirm**, **Confirmed**, **Packed**, or the backend's word), item count and total |
| Card, pictures | Only **this product's** lines — one picture per ordered colour/size |
| Total | Shop currency with its code (for example `850.00 TRY`) when the backend sends it. Otherwise USD. Always 2 decimals. |
| Item count | Lines in the **whole order** (`items`), not only this product |
| Paging | **Previous / Next** only when there is more than one page |
| Footer | **Close** button |

---

## 9. Test scenarios — A. Orders tab

Severity: **S1** blocks the seller's work or leaks data · **S2** wrong data or
a broken action · **S3** wrong text, layout or translation · **S4** cosmetic.

### Opening and permissions

| ID | Precondition | Steps | Expected result | Sev. if failed |
| --- | --- | --- | --- | --- |
| O-01 | P1 | Open the dashboard. Look at the side menu and the home tiles. | **Orders** shows in the menu and as a tile ("Track and fulfil customer orders"). | S1 |
| O-02 | P3 | Same as O-01. | **Orders** shows. Any one permission from the Orders group is enough. | S2 |
| O-03 | P4 | Same as O-01. | No **Orders** item and no tile. | S1 |
| O-04 | P4 | Type the URL `...?tab=orders` by hand. | Text **Access Denied** and "You need order viewing permissions to see this section". No call to `/shop/orders` in the Network tab. | S1 |
| O-05 | P3 (no `READ_ORDERS`) | Open the Orders tab. | The list call goes out. Record what the backend answers. If it refuses (403), you see the error text and **Retry**. Report the result either way — see section 12, note 6. | S2 |

### The list

| ID | Precondition | Steps | Expected result | Sev. if failed |
| --- | --- | --- | --- | --- |
| O-06 | P1 | Open the Orders tab. | 4 grey placeholder cards, then the orders, newest first. The **All** tab is dark. | S2 |
| O-07 | P1 | Check every part of 3 cards against section 8. | Time, id, status, item count, USD amount and pictures match the order. | S2 |
| O-08 | P1, D8 | Scroll to the bottom of the list. | The first page stays on screen, with one grey placeholder under it. The next page is added under the first page. No order shows twice. It stops when there are no more pages. | S2 |
| O-09 | P1 | Click each filter tab in turn. | Each click sends a new call with the `status` from section 8. Only matching orders show. | S2 |
| O-10 | P1, D4 | Find D4 on the list. | Exactly 4 pictures. | S4 |
| O-11 | P1, D3 | Compare D3's `N Item` with the quantities. | `N` is the sum of the quantities. | S3 |
| O-12 | P1 | Pick a tab that has no orders. | Text **No orders found**. No placeholder left on screen. | S3 |
| O-13 | P1 | Make the list call fail (see section 13). Open the tab. | The backend's message in red and a **Retry** button. Retry loads the list again. | S2 |
| O-14 | P1 | On Slow 3G, click a tab and then quickly click another. | While a list or a next page is loading, the tabs are greyed and cannot be clicked. The list shown matches the dark tab. | S2 |
| O-15 | P1 | Click the back arrow at the top of the list. | You go back to the dashboard home. | S3 |

### The detail

| ID | Precondition | Steps | Expected result | Sev. if failed |
| --- | --- | --- | --- | --- |
| O-16 | P1 | Click an order card. | **Order Details** screen of **that** order. Number, date and invoice match the card. | S2 |
| O-17 | P1, D3 | Check each item block against section 8. | Name, colour, size, product id, quantity and picture are right for each line. Missing colour or size shows **N/A**. | S2 |
| O-18 | P1 | Check **Duration To Do Action** for an order with time left and one without. | `Remaining …` in hours and minutes, or **No remaining time**. | S3 |
| O-19 | P1 | Click the back arrow on the detail. | Back to the list, on the same filter tab. | S3 |

### Item actions — the main flow

Use a new order (D3) for this. Every step changes real data.

| ID | Precondition | Steps | Expected result | Sev. if failed |
| --- | --- | --- | --- | --- |
| O-20 | P1, D3, item 1 is Pending | Click **Confirm & Start Packing** on item 1. | The button says **Updating...**, then the item shows **Status: Confirmed** and one **Packed** button. `Confirmed 1/N` goes up. Other items do not change. | S1 |
| O-21 | P1, item 1 Confirmed | Click **Packed**. | **Updating...**, then **Status: Packed** and the **Ready To Collect** label. `Packed x/N` goes up. | S1 |
| O-22 | P1 | Confirm and pack **all** items of D3. | Collect Type icons 2 and 3 turn black. | S3 |
| O-23 | P1, an item that is Pending | Click **Cancel**. | The call is sent at once — **there is no "are you sure?"**. The **whole quantity** is cancelled. The item leaves the list. Cancel was broken before BUG-1 was fixed; if it fails, report it as S1. | S1 |
| O-24 | P1 | After O-20, O-21 and O-23, go back and open the order again. Then reload the page and open it again. | The state you set is still there after the reload. The data comes from the backend, not only from the screen. | S1 |
| O-25 | P1, D5 | Open D5 (cancelled by the shopper). | All item buttons are greyed out. | S2 |
| O-26 | P2 (`READ_ORDERS` only) | Open a Pending item and click **Confirm & Start Packing**. | The buttons are shown (the screen does not check per-action permissions). The backend should refuse. The item must stay **Pending** after the call, and the red line with the reason must show (BUG-3). | S1 if the change lands |
| O-27 | P1 | Click **Confirm & Start Packing** twice, fast. | Only one call. The button is greyed out while it says **Updating...**. | S2 |

### The shopper's side — cross-flow

| ID | Precondition | Steps | Expected result | Sev. if failed |
| --- | --- | --- | --- | --- |
| O-28 | After O-20 | As the shopper, open **Settings → Orders** and open the same order. | The shopper sees the order as being prepared. | S2 |
| O-29 | After O-21 | Same, after packing. | The shopper sees the packed state. | S2 |
| O-30 | After O-23 | Same, after the cancel. | The shopper sees the item cancelled, and the total changes. | S1 |

### Live refresh

| ID | Precondition | Steps | Expected result | Sev. if failed |
| --- | --- | --- | --- | --- |
| O-31 | P1, Orders tab open, browser notifications allowed | From another browser, place a new order as the shopper. | A notification appears. Click it. Then come back to the Orders tab if the click opened another page. The new order is on the list. | S2 |
| O-32 | Same | Do not click the notification. Wait 1 minute. | The list does **not** reload by itself. Only a click on the notification, a filter tab or a page reload loads it again. That is how the code works today. Note it, do not report it as a bug. | — |

---

## 10. Test scenarios — B. Product Orders modal

| ID | Precondition | Steps | Expected result | Sev. if failed |
| --- | --- | --- | --- | --- |
| M-01 | P1 | Open the Products tab. | Each product card has an **Orders** button. | S2 |
| M-02 | P3 (no `READ_ORDERS`) | Same. | **No** Orders button on the cards, although the Orders tab shows (O-02). This modal needs `READ_ORDERS` itself. | S1 |
| M-03 | P1 | Click **Orders** on a product card. | The modal opens. The product card does **not** open underneath. Header shows the product picture, name and **Product ID**. | S2 |
| M-04 | P1, D6 | Open the modal for the D6 product. | Every D6 order is listed, newest first. | S1 |
| M-05 | P1, D6 | Look at the pictures of each card. | Only this product's lines show. An order that also holds other products does not show their pictures. | S2 |
| M-06 | P1, D6 | Compare one card with the same order in the Orders tab. | Same id and same status. The **item count** and **total** can differ — see section 12, note 3. | S2 |
| M-07 | P1, D7 | Open the modal for D7. | **No orders found** and "No customer has ordered this product yet." | S3 |
| M-08 | P1 | Pick a filter with no orders for this product. | **No orders found** and "No orders of this product have this status." | S3 |
| M-09 | P1, a product with many orders | Use **Next** and **Previous**. | The page changes. The buttons are greyed out while loading. No paging bar when there is one page only. | S2 |
| M-10 | P1, Slow 3G | Click **In Progress**, then quickly **Canceled**. | The list at the end matches **Canceled**. A late answer for In Progress must not replace it. | S2 |
| M-11 | P1 | Make the call fail (section 13). Open the modal. | An error card with a **Retry** button. Retry calls again. | S2 |
| M-12 | P1 | Close the modal four ways: ×, **Close**, click the dark area outside, press **Esc**. | Each one closes it. Clicking **inside** the white box does not close it. | S3 |
| M-13 | P1 | Look for any action button on a card. | None. The modal is read-only. | S2 |
| M-14 | P1 | Check the time on a card from today and from yesterday. | **Today \| 14:05:00** and **Yesterday \| …**, translated in other languages. | S3 |

---

## 11. Negative and edge cases

| ID | Case | Expected result | Sev. |
| --- | --- | --- | --- |
| E-01 | Order with an item whose quantity is 0 | That item's buttons are greyed out. | S2 |
| E-02 | Item with no picture | "No image" box, same size as a picture. | S4 |
| E-03 | Item with no name | "Product #<product id>". | S3 |
| E-04 | Confirm is refused by the backend (for example the line was already collected) | The item stays **Pending**, and a red line with the reason shows at the top (BUG-3). | S2 |
| E-05 | A next page fails while the first page is on screen | The first page stays, and a red line with the reason shows above the list. | S3 |
| E-06 | Two sellers act on the same item at the same time | The second seller's action is refused, or has no effect. After a reload, both see the same state. | S2 |
| E-07 | Open an order, then a refresh removes it from the list (for example it was cancelled elsewhere) | Detail shows **No order selected** and a back arrow. | S3 |
| E-08 | Switch to another shop and open Orders | Only the new shop's orders. Nothing from the old shop. | S1 |

---

## 12. Fixed bugs — check these first

These five bugs were found while this guide was written. Each one was confirmed
by a unit test that went red, and is now fixed in code. The details are in
`docs/testing/unit-coverage-bugs.md`. After the fix is deployed to staging,
check each one on the real app.

1. **BUG-1 (BUG-seller-701) — Cancel always failed.** The cancel call went to
   `/api/v1/api/v1/shop/...` and got a **404**. **Check:** cancel an item. In
   DevTools → Network, the `/api/proxy` call has `x-proxy-url:
   /shop/orders/details/cancel` and does not answer 404. The item leaves the
   order, and it is still gone after a reload. Severity if it fails: **S1**.
2. **BUG-2 (BUG-seller-702) — Price 0 for items with no offer.** **Check:** open
   D1. The item shows its normal price, not `0 USD`. With qty 2 or more it
   shows `unit price / line total`. Severity: **S2**.
3. **BUG-3 (BUG-seller-703) — A refused action showed no message.** **Check:**
   make Confirm, Packed or Cancel fail (block the request, or use a P2 account).
   A red line with the reason appears at the top of the order detail. It goes
   away when you go back to the list. Severity: **S2**.
4. **BUG-4 (BUG-seller-704) — English text in other languages.** **Check:** in
   `sy-ar`, `sy-tr` and `sy-ku`, the filter tabs, the status on each card, and
   the "Product #…" name of an item with no name are translated. ("N/A" is
   "N/A" in every language on purpose.) Severity: **S3**.
5. **BUG-5 (BUG-seller-705) — Scrolling for more orders reset the list.**
   **Check:** scroll to the bottom of a long list. The orders you see stay on
   screen. One grey placeholder card shows under them until the next page
   arrives. The filter tabs are greyed out during that time. Severity: **S3**.

### Notes — differences that are by design today

1. The **Cancel** button has no confirmation step and always cancels the
   whole quantity of that item.
2. The Orders tab says **Cancelled**. The product modal says **Canceled**.
3. The same order can show different numbers in the two screens:
   - **Item count:** the Orders tab adds up quantities. The modal counts the
     lines of the whole order.
   - **Total:** the Orders tab shows USD. The modal shows the shop currency
     when the backend sends it.
4. Remaining time is `125m` on the list card and `2h 5m` on the detail.
5. The **Change status** dropdown for a whole order is switched off in code.
6. The Orders tab opens for **any** order permission. The list call itself may
   still need `READ_ORDERS` on the backend. Record what O-05 shows.

---

## 13. API / network validation

All calls go through `/api/proxy` to the **core** backend (`market-dashboard`).
In DevTools → Network, filter by `proxy`. Each request carries:

- `x-proxy-url` — the backend path
- `x-proxy-method` — GET / PUT
- `x-seller-id` — the shop id. It must match "Seller ID:" in the page header.

| Action | Method and path | Body | Request title (code) |
| --- | --- | --- | --- |
| Order list | GET `/shop/orders?page=&status=` | — | `GET_SELLER_ORDERS` (150) |
| Confirm item | PUT `/shop/orders/details/status/confirmed` | `{ "order_detail_id": 123 }` | `UPDATE_SELLER_ORDER_DETAIL_STATUS` (157) |
| Pack item | PUT `/shop/orders/details/status/packed` | `{ "order_detail_id": 123 }` | `UPDATE_SELLER_ORDER_DETAIL_STATUS` (157) |
| Cancel item | PUT `/api/v1/shop/orders/details/cancel` (see BUG-1) | `{ "detail_id": 123, "order_id": 45, "qty": 2 }` | `CANCEL_SELLER_ORDER_DETAIL` (158) |
| Product orders | GET `/shop/products/<productId>/orders?status=&page=` | — | `GET_SELLER_PRODUCT_ORDERS` (224) |

Check for each call:

- `page` is left out for page 1. `status` is left out for **All**.
- The ids in the body are the ids of the item you clicked.
- The response has `success: true` before the screen changes.

**How to make a call fail on purpose:** in DevTools → Network, right-click the
`/api/proxy` request → **Block request URL**, then reload or click again.
Remove the block when you finish.

**A 401 is not a bug on its own.** The sign-in token lives for 60 seconds. The
app renews it and sends the same call again. Judge the **second** answer. A
`refresh` call followed by a good retry is the normal path.

The backend may also answer:

- **404** "Product not found." — the product is not this shop's.
- **404** "Order not found." — the order is another shop's.
- **422** — a wrong `status` value.
- **403** — no permission, or a missing `x-seller-id`.

## 14. UI, language and screen size

| ID | Steps | Expected result | Sev. |
| --- | --- | --- | --- |
| U-01 | Repeat O-06, O-16 and M-03 in `sy-ar` and `sy-ku`. | Layout flips to right-to-left. The back arrows point the other way. Report any text still in English (BUG-4 is fixed). | S3 |
| U-02 | Repeat in `sy-tr`. | Turkish text, left-to-right. | S3 |
| U-03 | In Arabic, look at the number badge (1, 2, 3) on each item block. | It must not cover the item name or picture. | S4 |
| U-04 | Open the Orders tab at 375 px, 440 px, 768 px and full desktop width. | No text cut off. The filter tabs scroll sideways on a small screen. | S3 |
| U-05 | Open the product modal on a phone. | It fits the screen (90% of the height at most) and its body scrolls. | S3 |

## 15. Performance checks

| ID | Steps | Expected result |
| --- | --- | --- |
| P-01 | Open the Orders tab with a normal network. | The list shows in under 3 seconds. Write down the time. |
| P-02 | Click a filter tab. | Exactly **one** list call per click. |
| P-03 | Scroll to the end of a long list. | One call per new page. No repeated calls for the same page. |
| P-04 | Slow backend (502 / 503 / 504 / 429). | The app retries up to 3 times (1 s, then 2 s). An error can take about 5 seconds to appear. That is not a hang. |

## 16. Evidence to capture for every bug

- The account and its role (P1–P4), the shop id ("Seller ID:" in the header),
  the language, and the full URL.
- The order id and the item (product id, colour, size).
- A screenshot or a short screen recording.
- From DevTools → Network: the `/api/proxy` request with its `x-proxy-url`
  header, the request body, the status code and the response body.
- The time of the test, so the backend team can find it in their logs.
- **Never** put a password, a one-time code, a token or a phone number in the
  report.

## 17. Severity and priority

| Severity | Meaning | Examples here |
| --- | --- | --- |
| S1 — blocker | The seller cannot fulfil orders, or sees data that is not theirs | Cancel never works; another shop's orders show; a user with no permission changes an order |
| S2 — major | Wrong data or an action without feedback | Wrong price; wrong counts; refused action with no message |
| S3 — minor | Wrong text, translation or layout | English tab names in Arabic |
| S4 — cosmetic | Looks only | A badge a few pixels off |

## 18. Exit criteria

The orders part passes when:

- All S1 and S2 scenarios in sections 9, 10 and 11 pass, or each failure has a
  ticket.
- The BUG-1 to BUG-5 checks in section 12 pass on staging.
- O-24 passes: every action is still there after a page reload.
- O-28 to O-30 pass: the shopper sees what the seller did.
- The permission cases O-03, O-04 and M-02 pass.

## 19. Risks and notes

- **Item actions change real orders.** Use orders you made yourself (section
  7). Never confirm, pack or cancel another tester's order.
- **There is no undo.** A cancelled item cannot be brought back from the
  dashboard. A packed item cannot go back to Confirmed.
- **Automated tests already cover** the Orders tab logic
  (`tests/components/SellerDashboard/orders.test.tsx`) and the product modal
  (`tests/components/SellerDashboard/productOrders/ProductOrdersModal.test.tsx`).
  BUG-1 to BUG-5 each have a test there.
  Those tests run with fake backend answers. Your manual run is the only check
  of the real backend today.
