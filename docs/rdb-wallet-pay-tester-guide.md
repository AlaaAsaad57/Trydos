# Tester guide — pay with the RDB wallet (web)

This guide covers the "RDB Wallet" payment on the Trydos website. Cases 1–12
come from the website code. Case 13 checks the RDB wallet balance, which the
backends handle, not the website.

**Questions about RDB itself** (the RDB app, test accounts, how to pay or
cancel a request inside RDB): ask the **RDB frontend developer**.

## How it works

1. The shopper picks **RDB Wallet** at checkout and places the order.
2. The website asks the Trydos core backend to start a payment. The website
   never calls RDB itself.
3. A payment window opens with the amount, a QR code, a payment code and a
   timer.
4. The shopper pays in the RDB app.
5. The website asks the core backend for the payment status every 4 seconds.
6. When the status is `paid`, the website loads the orders and shows the order
   success screen.
7. While a payment waits, the core backend refuses cart changes. The website
   then shows a "payment in progress" sheet.

## Before you start

- Open the site as `/sy-en/...` (not `/gb-en/...`).
- Sign in with an account whose phone is verified.
- Set a **default address**. The website sends the default address.
- Get an RDB test account from the RDB frontend developer.

## Test cases

### 1. Start a payment
- Add items → cart → pick **RDB Wallet** → place the order.
- Expected: the window shows "Waiting for your payment", "Amount to pay",
  a QR code, a "Payment code" and "Time left mm:ss".
- The amount and currency show as the backend sent them.
- On a phone or tablet browser you also see **Open the RDB app**. On a desktop
  browser this button does not show.

### 2. Pay successfully
- Pay the request in the RDB app.
- Expected: within a few seconds the window closes and the order success
  screen shows the new orders.

### 3. Let it expire
- Start a payment and do not pay. Wait until the timer reaches `00:00`.
- Expected: the window shows "Payment expired", and the QR and code go away.

### 4. Cancel from the payment window
- Start a payment, then press **Cancel payment**.
- Expected: the window closes. The cart can be changed again.

### 5. Close the payment window without paying
- Start a payment, then click outside the window.
- Expected: the window closes and the "You have a payment in progress" sheet
  shows at once, with two buttons:
  - **Continue payment** → opens the same payment again (same QR and code).
  - **Cancel payment** → cancels it and unlocks the cart.

### 6. Cart is locked while a payment waits
- With a payment still waiting, try one of these: add an item, change a
  quantity, remove an item, move an item to the old cart, or hide an old-cart
  item.
- Expected: the "payment in progress" sheet shows. Nothing in the cart changes.
  A removed item stays in the cart.

### 7. Place an order again while a payment waits
- With a payment still waiting, place an order again.
- Expected with **RDB Wallet**: the website opens the payment that already
  waits, not a new one.
- Expected with **another method**: the "payment in progress" sheet shows.

### 8. Lock clears by itself
- Leave the "payment in progress" sheet open until the payment ends (for
  example, it expires).
- Expected: the sheet goes away by itself within a few seconds, and the cart
  can be changed again.

### 9. Cancel after it was already paid
- Pay in the RDB app, then quickly press **Cancel payment** on the sheet.
- Expected: the sheet shows "This payment is already paid".

### 10. Close the sheet
- Close the "payment in progress" sheet with the X or by clicking outside it.
- Expected: the sheet hides. The payment still waits and the cart stays locked.
  The sheet does not show again for the same payment.

### 11. Payment cannot start
- Some items in the cart are not available → "Please Review Your Cart Some
  Products Not Available". No payment window opens.
- The backend refuses to start the payment → the window shows the backend's
  reason (or "Could not start the payment. Please try again") and a **Close**
  button.

### 12. Phone not verified
- Use an account without a verified phone.
- Expected: "Please Verify Your Phone Number". No payment starts.

### 13. The RDB wallet balance after buy, cancel and return
- Note your RDB wallet balance in the RDB app before each step.
- **Buy:** pay an order with RDB Wallet → the balance goes down by the amount
  the payment window showed.
- **Cancel:** cancel that order → the money goes back to the RDB wallet.
- **Return:** return an item → the money for that item goes back to the RDB
  wallet.
- Expected: after each step, the RDB wallet balance is correct.
- For how to see the balance, and how long a refund takes, ask the RDB
  frontend developer.

## What to check in DevTools (Network tab)

| Action | Request |
|---|---|
| Start a payment | `POST /customer/order/checkout/rdb`. The body has only `address_id` and `order_note`. |
| Check the status | `GET /customer/order/rdb-request/{reference}`, every 4 seconds |
| Cancel | `POST /customer/order/rdb-request/{reference}/cancel` |
| Cart locked | the cart request answers `409` with `rdb_request_reference` |

- A `401` followed by a good retry is normal (the token was renewed). It is not
  a bug.
- The browser must make no call straight to RDB.

## When you report a bug

Add:
- the page URL and the language,
- the `request_reference` (from the Network tab),
- the status the website showed,
- the answer of the failing request (status code and `message`).
