# CO-10 — Payment Method Selection

| | |
|---|---|
| **Feature ID** | CO-10 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Cart/PaymentMethod.tsx`, `components/Cart/PlaceOrderWidget.tsx`, `store/Cart/reducer.ts`, `utils/functions.tsx` |

---

## What it is

The **"how will you pay"** step of checkout — the shopper picks a single payment method from the ones
the backend offers for their cart: **Cash on Delivery, wallet, card, or crypto**.

## Where it appears

On the checkout screen inside the cart slide-over (below the shipping address). A read-only summary
of the chosen method also appears on the place-order review screen.

## Who uses it

Any shopper at checkout.

## How it works (verified behaviour)

- **The available methods are backend-driven.** The cart response carries an
  `available_payment_method` list; the UI renders only the matching options — `cash_on_delivery`,
  `trydos_wallet` (shown as **"RDB Wallet"**), `card`, `crypto`.
- **Single choice.** Selecting a method sets it as the sole payment; tapping the active one
  deselects. Methods are identified by id: **0 = Cash on Delivery, 1 = Wallet, 2 = Card, 3 = Crypto**.
- **Effect on the total.** Cash on Delivery uses the **cash total** (`total_cash`) and shows the COD
  fee; wallet/card/crypto use the standard `total`. The place-order button's displayed amount
  switches accordingly.
- **Presentation.** Cash on Delivery has its own icon (it used to reuse the wallet icon), and in
  Arabic / Kurdish the icon and its label swap sides so the row reads correctly right-to-left.
- **Wallet auto-selection & gating.** If the wallet balance (converted to the shopper's currency)
  **fully covers the total**, wallet is auto-selected and all other methods are disabled. If the
  wallet is insufficient, the wallet option is disabled and removed from the selection (see CO-13 —
  wallet is **full-payment-only** here).

## Data source

| Item | Value |
|------|-------|
| Available methods | `available_payment_method[]` inside the cart payload — `GET /cart/cart_shipping` / `GET /cart/cart_overview` (`getCart` / `GetCartOreview`) |
| Backend | Cart reads follow the market routing rule: both cart paths are on the **gateway** allow-list for guests, while **verified shoppers are served entirely by the core backend** |
| Method submitted | On place-order, id → string map (`0→cash_on_delivery`, `2→card`, else `crypto`; `1`=wallet handled separately) — `services/order.ts` |

## Technical reference

| Item | Value |
|------|-------|
| Selector | `components/Cart/PaymentMethod.tsx` (`CODInput`, `TryDosWalletInput`, `CreditInput`, `CryptoInput`) |
| Review summary | `PaymentOrder` in `components/Cart/PlaceOrderWidget.tsx` |
| Store | `store/Cart/reducer.ts` — `orderData.payment` (`[{ id, balance }]`), `available_payment_method`, `setOrderData`; totals `total` / `total_cash` / `cod_cost` / `wallet` |
| Wallet coverage | `getWalletInUSD() = wallet_balance / currency.exchange_rate` vs `total` |

## Current status & maturity

**Live and stable.** Method availability, single-select, COD-total switching and wallet
auto-selection all work off the backend-supplied method list.

## Known gaps / notes


- **Empty-list render bug:** an `array.length && array.map(...)` guard renders a literal `0` when no
  methods are available (should be a boolean check).


## Related features

CO-11 (Place order — submits the chosen method) · CO-12 (External gateway — card/crypto) · CO-13
(Pay with wallet) · PW-04 (Pay an order with the wallet) · CO-14 (Confirmation — shows the method).
