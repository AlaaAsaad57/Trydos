# SD-33 — Redeem / "Luck" Rewards

| | |
|---|---|
| **Feature ID** | SD-33 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟡 Partial — a working time-limited discount claim, but the timer duration is hardcoded, the one-time limit is enforced only by a browser cookie, and the charged price relies on the backend honouring the flag (not verifiable here) |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `utils/luck/index.ts`, `store/luck/reducer.ts`, `hooks/useLuckTimer.ts`, `components/ServerWrapper/ProductWrapper/ProductButtonWrapper.tsx`, `components/Cart/AddToCart/Button.tsx` |

---

## What it is

A **time-limited "grab it now" discount**. When a shopper views an eligible product, a short
countdown (~50 seconds) starts and the product's price is struck through in favour of a lower
**"redeem" price**. If the shopper adds the item to the bag before the timer hits zero, they claim
the discount. Each product can be redeemed **once**.

Despite the "luck / lucky draw" naming in the code, it is **not** a random lottery — every eligible
product deterministically gets the countdown and discount. It behaves as a per-product flash offer.

## Where it appears

- **Product cards** in listings and search results: an orange **"Luck! Add To Bag Within N
  seconds"** badge, an orange strikethrough on the price, and a live `-N s` counter on the buy
  button.
- **Product detail page:** the same countdown as an overlay on the first product image, and in the
  add-to-cart sheet, where the discounted redeem price is shown on the buy button.

## Who uses it

Any shopper viewing a luck-eligible product — no account step is involved.

## How it works (verified behaviour)

- **Eligibility** comes from a single backend field: a product is "luck" when its Elasticsearch
  `redeem_price` is greater than 0 (surfaced as `is_luck` + `luck_price`).
- **The countdown is ~50 seconds**, a hardcoded client constant — the backend supplies only the
  discounted price, not a duration or end-date.
- **Fair-play pausing:** the timer pauses when the tab is hidden, when the shopper navigates
  in-app, or when the product card scrolls off-screen (via an intersection observer), and resumes
  where it left off — so a shopper isn't cheated of seconds while not looking.
- **On expiry** the badge and discount disappear, and the product is recorded as **redeemed** so it
  won't offer the discount again.
- **Claiming = normal add-to-cart** carrying the luck context: the add-to-cart request sends
  `is_luck` to `/cart/add`, and the redemption is immediately burned (marked expired) so it can't be
  reused.
- **One-time enforcement** is stored client-side in a cookie of redeemed product IDs (capped, LRU-
  evicted). The server also gates eligibility by reading that cookie during listing rendering.
- **Timer freeze bug — fixed.** A recent fix (commit `9654b375`) moved the countdown clock into
  React state so it ticks correctly under the React Compiler; previously `luckTimer` could freeze on
  a value until a pause/resume.

## Data source

| Item | Value |
|------|-------|
| Eligibility + price | Elasticsearch `redeem_price` → normalized to `is_luck` (`> 0`) and `luck_price` (`services/elastic/helpers.ts`, `elasticSearch.ts`) |
| Timer duration | **Hardcoded** `DEFAULT_LUCK_SECONDS = 50` (`utils/luck/index.ts`) |
| Timer state | Zustand `luck` slice + `localStorage["luck_timers"]` (capped, LRU) |
| One-time record | Cookie `redemed_ids` *(sic — misspelling is load-bearing)*; read server-side in `utils/cookies/getRedeemedIds.ts` |
| Claim | `POST /cart/add` with `is_luck` (`services/cart.ts`) |
| Redeem API | **None** — no dedicated redeem endpoint exists |

## Technical reference

| Item | Value |
|------|-------|
| Engine constants / persistence | `utils/luck/index.ts` |
| Store slice | `store/luck/reducer.ts` (`startLuck` / pause / resume / `expireLuck`) |
| Countdown hook | `hooks/useLuckTimer.ts` (single source of truth per product) |
| Card render | `components/ServerWrapper/ProductWrapper/ProductButtonWrapper.tsx`, `ProductColorsCards.tsx`, `components/products/ProductCard/index.tsx` |
| Detail render | `components/Server/product/ProductPhotoSliderWrapper.tsx` (`ProductRedeemCounter`), `components/Cart/AddToCart/*` |
| Claim button | `components/Cart/AddToCart/Button.tsx` (sends `is_luck`, then `expireLuck`) |
| Server gating | `utils/listing/normalizeListingProduct.ts` (`is_luck` only if not already redeemed) |
| Badge colours | Hardcoded `#FF6200` / `#FFF3E8` |

## Current status & maturity

**Functional but not fully hardened.** The countdown, pause/resume, expiry and one-time gating all
work, and the recent freeze bug is fixed. What holds it back from "Live" is the mix of hardcoded and
client-trust pieces below, plus an in-progress migration between two timer implementations.

## Known gaps / notes



- ⚠️ **Two timer implementations coexist.** A modern shared `useLuckTimer` hook and an older
  `BuyButtonProduct` / `RedeemButton` / `LuckyDrawTimer` path both exist; a migration onto the hook
  (see `docs/superpowers/plans/2026-07-01-luck-price-engine.md`) appears partial.


## Related features

SD-04 (Flash deals — the other time-limited pricing mechanic) · SD-22 (Product labels & view
counts — sibling card decorations) · CO-01 (Add to cart — the claim path) · SD-14 (Product listing
page — where luck cards render).
