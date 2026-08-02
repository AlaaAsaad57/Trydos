# Manual Test — user-based-go-laravel-routing

> Step-by-step checklist to confirm the user-based Go/Laravel routing works.
> Uses the dev-only `[MarketRouting]` logs in `utils/server/tokenManager.ts`.
> **The logs are server-side: they print in the TERMINAL running the dev
> server, NOT in the browser DevTools console.**

## 0. Setup

- [ ] `pnpm dev` (or `pnpm turbo`) and keep the terminal visible.
- [ ] Open a **fresh incognito window** (no cookies) at `http://localhost:3000`.
- [ ] Confirm `[MarketRouting]` lines start appearing in the terminal.
  - Every line shows: `source` (`proxy` = client call via /api/proxy,
    `server-fetch` = server-rendered fetch), `verified`, `backend`
    (`go` / `laravel`), and for proxy lines the `url`.

## 1. Guest / tokenless — Go-first (AC-3, AC-4)

- [ ] First load as fresh incognito: terminal shows `verified: false` on every
      `[MarketRouting]` line.
- [ ] Home page loads → `source: 'server-fetch', verified: false, backend: 'go'`
      lines appear (startingSettings / currency).
- [ ] Open any product page → more `server-fetch … backend: 'go'` lines
      (globalDetails / qtyPriceDetails / product-meta).
- [ ] Add a product to cart (guest) → proxy line with `url: '/cart/add'`,
      `verified: false, backend: 'go'`; the cart UI updates correctly.
- [ ] Open cart overview → `/cart/cart_overview` → `backend: 'go'`.
- [ ] Trigger a NON-allow-listed call as guest (e.g. open the notifications
      list, or any `/user-notifications/get` call) → proxy line shows
      `verified: false, backend: 'laravel'` — the fallback still works.

## 2. Login transition — next request flips to Laravel (AC-1, AC-2, AC-6)

- [ ] Log in with a real phone via OTP.
- [ ] Immediately after login completes, the very next market calls show
      `verified: true, backend: 'laravel'` — no refresh needed beyond the
      normal post-login flow.
- [ ] Add to cart again → `url: '/cart/add'`, `backend: 'laravel'`; cart still
      behaves identically (same response shape — nothing breaks in the UI).
- [ ] Toggle a wishlist item → `/checklist` → `backend: 'laravel'`; wishlist
      works.
- [ ] Open a product page → `server-fetch` lines now `verified: true,
      backend: 'laravel'` (AC-7 — server paths follow the same rule).
- [ ] Sanity: browse home, currency/startingSettings lines are `laravel` too —
      a verified user NEVER logs `backend: 'go'` anywhere (AC-1). If you see
      one, the test FAILS.

## 3. Invalid-phone profile is a guest (AC-5) — optional, via debug page

- [ ] Open `/simulateUser` and paste a payload whose `userData.phone` is `"0"`
      (or `0` / empty), with a `marketToken`.
- [ ] Browse → all `[MarketRouting]` lines show `verified: false` → Go-first.
- [ ] Repeat with a real phone string in `userData.phone` → `verified: true`
      → Laravel.

## 4. Fail-open / no cookie context (AC-8)

- [ ] While logged in, clear ALL site cookies from DevTools (Application →
      Cookies → clear), then navigate WITHOUT reloading twice.
- [ ] Requests keep working (no 500s): lines show `verified: false` and the
      app self-heals via guest re-register (`/auth/register-guest` on Go —
      AC-9). Nothing crashes.

## 5. Bootstrap + expiry stay correct (AC-6 second half, AC-9)

- [ ] In the fresh-guest flow (step 1) the guest register happened against Go
      and the session works — that's AC-9 covered.
- [ ] Optional (hard to trigger manually): when a verified session's token
      expires, the app re-registers a guest but the profile KEEPS the phone —
      so routing **stays `laravel`**. Seeing `verified: true` after an expiry
      re-register is CORRECT, not a bug (owner-confirmed AC-6 semantics).

## 6. Untouched surfaces (AC-10)

- [ ] Seller dashboard loads and works — dashboard calls produce NO
      `[MarketRouting]` change in behavior (market-dashboard keeps URL-only
      routing; its requests aren't user-routed).
- [ ] Chat / stories / wallet / search (elastic) all function as before.

## 7. Production silence (AC-11 hygiene)

- [ ] `pnpm build` succeeds.
- [ ] Optional: `pnpm start` → no `[MarketRouting]` lines are printed in
      production mode (logs are dev-only).

## Pass criteria

Every checked step behaved as described — in particular:
1. Verified (real phone) ⇒ **only `laravel`**, everywhere, both `proxy` and
   `server-fetch` sources.
2. Guest/tokenless/invalid-phone ⇒ `go` for allow-listed, `laravel` fallback.
3. No UI feature broke when the backend flipped (cart, wishlist, product page,
   currency).
