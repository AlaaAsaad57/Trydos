# Luck-Price Engine Unification — Design

**Date:** 2026-07-01
**Scope:** The "Luck!" limited-time price flow across **all three surfaces** — listing product card (incl. color-variant cards), product detail page, and the Add-to-Cart sheet — plus the shared state, timer, and persistence that connect them.
**Goal:** Replace three incompatible, DOM-mutating luck implementations with **one declarative luck engine**: a single source of truth per product, one shared timer hook, one persistence layer. Fix the reported bug (luck price still shown after the counter expires) at its root, and remove the imperative `classList`/`querySelector`/`localStorage` hacks and cross-component DOM reach-ins.

---

## 1. Decisions (locked)

| Decision | Choice |
|---|---|
| Countdown window | **One window per product**, carried continuously across card → sheet → product page (not a fresh 50s per surface). |
| State home | **New `luck` Zustand slice** (`store/luck/reducer.ts`), spread into `useAppStore` like the other slices. Not folded into `Details`. |
| Timer model | **Deadline-based**, not a decrementing counter: store `deadlineTs` while running / `pausedRemaining` while paused. `secondsLeft` is derived. Drift-free, no per-tick global writes. |
| Pause semantics | **Pause/resume from remaining** (user choice "a"). Navigation, tab-hidden, and off-screen are all *pause inputs* — never expiry killers. |
| Expiry authority | The **timer reaching 0 while visible** is the only expiry trigger; it fires `expireLuck(id)` exactly once. |
| Redeemed record | Keep the existing **`redemed_ids` cookie** as the canonical "already redeemed/expired" record (the server reads it to gate `is_luck`). Fix the `redeemd_ids` misspelled reads. Centralize the key in one constant. |
| DOM manipulation | **Removed entirely.** All luck UI renders declaratively from `luckActive`/`secondsLeft`. |

---

## 2. Current reality (why this refactor)

The luck flow is implemented **three separate ways** that only cooperate through fragile side-channels:

| Surface | Entry | Mechanism |
|---|---|---|
| Listing card | `ProductCard` → `ProductButtonWrapper` + `useLuckyDrawTimer` (`LuckyDrawer.tsx`) | `react-timer-hook` + `product_redeem` CSS class toggled by imperative `classList.remove` |
| Product page | `ProductPhotoSliderWrapper` → `ProductRedeemCounter` | `<Timer>` + `localStorage("counter")` + `querySelector("#product-redeem-counter")` |
| Add-to-Cart sheet | `AddToCartComponent` → `ExtraInfoArea` | `<Timer seconds={product.seconds}>` + `LuckEnd`/`expireLuck` + `querySelector` |

**Shared side-channels (the coupling):**
- `redemed_ids` cookie — the "already redeemed" record; read server-side (`serverRequests/listing`, `ProductListConainer`, `utils/cookies/getRedeemedIds`, `Product.tsx`, `AddToCartButton`, `PricesRowClientLogic`) to decide `is_luck`.
- `localStorage("counter")` — the product page's remaining seconds.
- `selected_product_for_add_to_cart.seconds` (Details store) — carries the card's remaining seconds into the sheet.
- Cross-component DOM queries — the Add-to-Cart sheet reaches into the *listing card's* DOM: `ExtraInfoArea.hideRedeemPriceIfItsStillShown()` → `querySelector("#product-redeem-counter")`.

### 2.1 Root cause of the reported bug (listing card)

Luck UI visibility is driven by **one CSS class**, `product_redeem`, on the card root `#product_${slug}`:

```css
.redeem_show { display: none !important; }
.product_redeem .redeem_show { display: flex !important; }
```

- React writes `product_redeem` from the **static server prop `is_luck`** (`ProductCard/index.tsx:137`) — always true for a luck product.
- On expiry, `ProductButtonWrapper.onExpire` **imperatively** removes it via `querySelector(...).classList.remove("product_redeem")`.

Two concrete failure modes:
1. **Swallowed one-shot expiry.** `useLuckyDrawTimer`'s `onExpire` runs only `if (!isNavigating)`. `react-timer-hook`'s `onExpire` fires exactly once. If the timer reaches 0 while `isNavigating` is true, that expiry is dropped forever — the counter sits at 0/`-0s`, the class is never removed, **the luck price stays visible.** ← the reported bug.
2. **JSX gated on the wrong flag.** The luck price beside Buy is gated on `is_luck` only (never `!redeem_expired`), so it is always in the DOM — only the CSS class hides it. Any reconciliation that re-touches the className can resurrect it.

### 2.2 Aggravating factors
- **Multiple timers racing one class.** `ProductColorsCards` renders one `ProductButtonWrapper` **per color variant**, each with its own `useLuckyDrawTimer`, all calling `classList.remove` on the *same* shared `#product_${slug}` root.
- **Cookie-name bug.** Canonical key is `redemed_ids` (what everything writes and the server reads). But `ProductPhotoSliderWrapper.tsx:27` and `ProductFooter.tsx:37` read `redeemd_ids` (a different misspelling) — a cookie that is never written — so the product page never recognizes an already-redeemed product.

---

## 3. Target architecture

One engine, three consumers.

### 3.1 `luck` store slice (`store/luck/reducer.ts`)

Single source of truth per product id:

```ts
luckByProduct: Record<string, {
  deadlineTs: number | null;      // epoch ms; set while running
  pausedRemaining: number | null; // seconds; set while paused
  expired: boolean;
}>
```

Derived state:
- **running** → `deadlineTs != null`; `secondsLeft = max(0, ceil((deadlineTs - now) / 1000))`.
- **paused** → `pausedRemaining` holds the frozen seconds.
- **expired** → `expired === true`; `secondsLeft = 0`.

Actions:
- `startLuck(id, seconds = 50)` — no-op if already tracked or already in the redeemed record; else set `deadlineTs = now + seconds*1000`, `expired = false`.
- `pauseLuck(id)` — if running: compute remaining, set `pausedRemaining`, clear `deadlineTs`.
- `resumeLuck(id)` — if paused: `deadlineTs = now + pausedRemaining*1000`, clear `pausedRemaining`.
- `expireLuck(id)` — set `expired = true`, clear timers, and record the id in the redeemed cookie (once).

`DEFAULT_LUCK_SECONDS = 50` lives in one constant.

### 3.2 Shared hook `useLuckTimer(id, { visible })`

Replaces `useLuckyDrawTimer`, `ProductRedeemCounter`'s counter logic, and the `<Timer>` redeem branch in `ExtraInfoArea`.

Responsibilities:
- On mount, `startLuck(id)` when the server says `is_luck` and the id isn't already redeemed.
- Compute the single **pause gate**: `paused = isNavigating || document.hidden || !visible || sheetOpenForAnotherProduct`. Drive `pauseLuck`/`resumeLuck` as it changes.
- Emit a 1s tick (local `useState`/`react-timer-hook` seeded from `deadlineTs`) to refresh `secondsLeft` for display only.
- When `secondsLeft` hits 0 while running, call `expireLuck(id)` **once**.
- Return `{ luckActive, secondsLeft }` where `luckActive = is_luck && !expired`.

Because all surfaces read the same store record by `id`, the countdown is continuous across the card → sheet → product-page journey with no `seconds` hand-off. **No React context or prop-drilling is needed** — any consumer (main card, color-variant card, sheet, product page) reads the shared window straight from the `luck` slice by `id`.

### 3.3 Persistence (`utils/luck/*`)

One module owns every luck storage key (no scattered string literals):
- **Timer state** (`deadlineTs` / `pausedRemaining` / `expired`) persisted per product so a hard navigation (e.g. to the product page route) rehydrates the *same* window — replacing both `localStorage("counter")` and the store `seconds` hand-off. The persisted map is **capped at the same `MAX_REDEEMED` (5)** as the redeemed cookie (evicting least-recently-written entries); on expiry the entry is removed (redemption lives in the cookie), so it never grows unbounded.
- **`redemed_ids` cookie** stays the canonical redeemed record read server-side. Fix the two `redeemd_ids` misreads to the canonical key; expose it as a single constant so the misspelling can't recur.

> Note: the cookie value string stays `redemed_ids` (matching all existing writers and the server readers); only the *outlier misspelled reads* are corrected. Renaming the cookie itself is out of scope (would orphan live cookies).

### 3.4 Declarative rendering — DOM hacks deleted

Every surface gates its luck UI (orange badge/counter, orange luck price, price strike-through, orange border, orange Buy text) on `luckActive` from the hook. Removed:
- `classList.remove("product_redeem")` and the `.redeem_show { display:none !important }` / `.product_redeem .redeem_show { display:flex !important }` visibility toggle. `.product_redeem` is **kept only for state-driven styling** (border/text color) and is now set from `luckActive`, not the static prop.
- `querySelector("#product-redeem-counter")`, `.product-redeem-counter`, and `hideRedeemPriceIfItsStillShown` (cross-component DOM reach-in).
- `localStorage("counter")` get/set/remove.

### 3.5 Color-variant cards
`ProductColorsCards` variants of the same product now read the **one** shared window for that product id — no more N racing timers on a shared root class. They pause/expire together with the main card.

---

## 4. Files to change

**Engine (new):**
- `store/luck/reducer.ts` — the slice; wired into `store/index.ts`.
- Shared `useLuckTimer` hook (replaces/absorbs `components/ListingPage/LuckyDrawer.tsx`'s `useLuckyDrawTimer`).
- `utils/luck/*` — storage keys + persistence helpers + `DEFAULT_LUCK_SECONDS`.

**Listing:**
- `components/products/ProductCard/index.tsx` — own the timer via the hook; set `product_redeem` from `luckActive`; render badge/timer from state.
- `components/ServerWrapper/ProductWrapper/ProductButtonWrapper.tsx` — presentational; consume `luckActive`/`secondsLeft`; drop local timer, `onExpire`, `classList`.
- `components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx` — read the shared window per product id from the slice.
- `components/ServerWrapper/ProductWrapper/ProductColorsBottomSheet.tsx` — likely no change (renders children; state is read from the slice, not passed down). Confirm during implementation.
- `components/ServerWrapper/ProductWrapper/RenderPrice.tsx`, `OfferPrice.tsx` — strike-through gated on `luckActive`.

**Product page:**
- `components/products/ProductRedeemCounter.tsx` — rewrite onto `useLuckTimer`.
- `components/Server/product/ProductPhotoSliderWrapper.tsx` — fix `redeemd_ids` → `redemed_ids`; drive from engine.
- `components/Product/ProductFooter.tsx` — fix `redeemd_ids` → `redemed_ids`.
- `components/Server/product/ProductPrices/PricesRowClientLogic.tsx` — read `luckActive`.

**Add-to-Cart:**
- `components/Cart/AddToCart/ExtraInfoArea.tsx` — replace `<Timer>` redeem branch + DOM hacks with the hook.
- `components/Cart/AddToCart/AddToCartComponent.tsx` — drop `LuckEnd`/`expireLuck` DOM `querySelector`; drive from engine.
- `components/Cart/AddToCart/Button.tsx`, `PricesRow.tsx`, `Card.tsx` — consume `luckActive`.

**Styles:**
- `public/styles/product-card.css` — remove `redeem_show` display toggles; keep `.product_redeem` styling.

**Untouched:** `components/Login/Timer.tsx` keeps its OTP usage; only its redeem consumers migrate. Server-side `is_luck` gating (`serverRequests/listing`, `ProductListConainer`, `utils/cookies/getRedeemedIds`) already reads `redemed_ids` and stays as-is.

---

## 5. Data flow (target)

```
Server decides is_luck (reads redemed_ids cookie)
      │
      ▼
Card mounts ─ useLuckTimer(id) ─ startLuck(id, 50) ─┐
      │                                              │
   pause inputs (nav / tab / offscreen / sheet) ─────┤──► luck store  ◄── persisted (utils/luck)
      │                                              │        │
   tick → secondsLeft (display)                      │        │  read by id
      │                                              │        ▼
   secondsLeft==0 while running ─ expireLuck(id) ────┘   sheet / product page
      │                                                   render {luckActive, secondsLeft}
      ▼
   redemed_ids cookie updated  ──► future server render treats product as non-luck
```

---

## 6. Validation strategy (no test suite — manual)

Per surface (card, color-variant card, product page, Add-to-Cart sheet) and across the journey:
1. Counter reaches 0 → **all** luck UI (badge, orange price, strike-through, border, Buy-text color) reverts to the normal price **atomically**.
2. Navigate away and back → countdown **paused** during the skeleton, **resumes from the remaining** seconds (not reset, not stuck).
3. Tab hidden / card scrolled off-screen → pause; back → resume.
4. Card → tap Buy → sheet → product page → the **same** countdown continues (one window per product).
5. After expiry, reloading the page shows the product as **non-luck** (redeemed cookie honored, including on the product page — cookie-name bug fixed).
6. Color-variant cards of one product share one window and expire together.

## 7. Out of scope
- Renaming the `redemed_ids` cookie (only the misspelled reads are corrected).
- Backend/`is_luck` server logic changes (server already gates on `redemed_ids`).
- The OTP/login `Timer` behavior.
- Luck-window duration policy (stays a client constant, default 50s).

## 8. Rollback
All changes are client-side UI plus one additive store slice; no backend or schema change. Revert the touched files and delete the new `luck` slice/hook/util.
