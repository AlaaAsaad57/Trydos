# CO-12 — External Payment Gateway

| | |
|---|---|
| **Feature ID** | CO-12 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Cart/ModalIframe.tsx`, `components/Cart/CartProvider.tsx`, `services/order.ts`, `store/Cart/reducer.ts` |

---

## What it is

The **hosted card / crypto payment page** — when a shopper pays by card or crypto, the payment
provider's own secure page is shown inside an in-app window so they can complete payment without
leaving Trydos.

## Where it appears

As a centred modal (≈90% of the screen) overlaying the app, opened automatically after placing a
card/crypto order.

## Who uses it

Shoppers who chose **card** or **crypto** at checkout (CO-10).

## How it works (verified behaviour)

- **The gateway URL comes from the checkout response.** When the place-order call (CO-11) returns a
  `url` for the order, the app stores it and opens the payment modal.
- **It's an embedded `<iframe>`** loading the provider's hosted page — not a new browser window and
  not a native webview.
- **Return / success detection is a postMessage handshake.** The hosted page is expected to post the
  message **`"close-iframe"`** back when done; on receiving it, the app closes the modal and does a
  **one-time order lookup** by cart-group id to confirm the order was created, then shows the success
  screen (CO-14).
- **Manual close.** An **X** button does the same close-and-check, so a shopper who finishes (or
  abandons) can close it and the app re-checks whether an order exists.

## Data source

| Item | Value |
|------|-------|
| Gateway URL | From the checkout response `data[0].url` (CO-11) — external provider's hosted page |
| Confirm order created | `GET /customer/order/getOrdersByCartGroupID?cart_group_id=…` — **legacy backend** |
| Store | `store/Cart/reducer.ts` — `openPayIframe`, `payIframeURL`, `setCryptoCardPayment` |

## Technical reference

| Item | Value |
|------|-------|
| Iframe modal | `components/Cart/ModalIframe.tsx` |
| Mount / trigger | `components/Cart/CartProvider.tsx` (watches `openPayIframe` / `payIframeURL`) |
| Open action | `services/order.ts` — `setCryptoCardPayment(response.data[0])` when `data[0].url` present |
| Return signal | `window` `message` listener for `"close-iframe"` + manual X |
| Analytics | `PAYMENT_REDIRECT_OPENED` |

## Current status & maturity

**Live.** The gateway opens, embeds the provider page, and confirms the resulting order via a cart-
group lookup. Works end to end for the happy path.

## Known gaps / notes

- **Fragile return detection.** Success confirmation depends on the hosted page posting the exact
  string `"close-iframe"`. If the provider doesn't send it, the shopper must press the manual **X** —
  there is **no redirect-callback route and no polling fallback** for this card/crypto flow (unlike
  the wallet flow, which polls; see CO-13). Worth hardening.
- Card Payment is Not Active right now (we depend on backend data to show it and never implemented).

## Related features

CO-10 (Payment method — card/crypto selection) · CO-11 (Place order — produces the gateway URL) ·
CO-13 (Wallet payment — the alternative in-app payment) · CO-14 (Confirmation).
