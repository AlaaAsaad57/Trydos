---
ticket: checkout-address-totals-and-cart-lines
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-05
links:
  clickup:
  github:
---

# Research — checkout-address-totals-and-cart-lines

## In plain words

- **What this ticket touches:** the cart drawer (`components/Cart/index.tsx`),
  the checkout address sheet (`components/Cart/AddressListContainer.tsx`), the
  totals row (`components/Cart/OrderButton.tsx`), two services
  (`services/cart.ts`, `services/order.ts`), one store slice
  (`store/Cart/reducer.ts`), and the two test suites.
- **The facts that matter most:**
  - `cart-total-price` is **not** the total. It shows
    `total + total_discount - total_shipping_cost`, the price before discount and
    before shipping (`components/Cart/OrderButton.tsx:377-388`). The payable
    total is `offer-total-price` (`components/Cart/OrderButton.tsx:572`).
  - The app never computes the total. Every money field comes from the core
    backend through `/cart/cart_shipping` (`utils/functions.tsx:299-336`) and
    `/cart/cart_overview` (`utils/functions.tsx:338-357`).
  - Checkout sends the address whose `is_default === 1`, read from the local
    store, not from a "selected" field (`services/order.ts:74`).
  - Tapping an address calls the backend **and** flips the local default
    (`components/Cart/AddressListContainer.tsx:75-84`); `SetDefault` then
    re-reads the totals (`services/order.ts:242`).
  - A cart line at quantity 1 draws the delete control in place of the minus
    control (`components/Cart/index.tsx:732`, `:758`, `:780`).
- **What I could not check:** how many addresses the staging test account has
  right now, and whether staging charges a non-zero shipping cost for it. Both
  need a live run, so both are open questions (`OQ-1`, `OQ-2`).
- **Easy to confuse:**
  - `cart-total-price` (before discount and shipping) vs `offer-total-price`
    (payable). The selector `cart.total` points at the **first** one
    (`tests/e2e/selectors.ts:420`), so its name is wrong.
  - `getCart` reads `/cart/cart_shipping`; `GetCartOreview` reads
    `/cart/cart_overview`. Different endpoints, different store writers.
  - `removeFromCart` (store action, `store/Cart/reducer.ts:402`) vs
    `RemoveFromCart` (service method, `services/cart.ts:110`) vs
    `RemoveFromCartAction` (drawer handler, `components/Cart/index.tsx:137`).
  - A line price is a **shortened** string (`12K`) while a total is a plain
    number, because only the totals pass `returnNumber: true`
    (`utils/functions.tsx:200`).

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Cover three money-path cases with tests that name the failing step and the
backend: choosing and editing an address at checkout (live), the shipping cost
and the order total against the prices shown (unit + live), and changing a
quantity or removing a line in the cart (unit + live).

## Relevant directories

- `components/Cart/` — the drawer, the checkout screen, the address sheet, the
  totals row. Every screen in scope.
- `services/` — `cart.ts` (add / update / remove) and `order.ts` (address list,
  set default, place order).
- `store/Cart/` — the single slice holding the bag, the address list and every
  money field.
- `tests/` — the unit suite (Vitest).
- `tests/e2e/` — the browser suite (Playwright): specs, `actions/`, `harness/`,
  `selectors.ts`.
- `docs/testing/` — `E2E_SCENARIOS.md` is the scenario register.

## Relevant config files

- `vitest.config.mts` — the unit project: `jsdom`, one setup file, `tests/e2e/**`
  excluded (`vitest.config.mts:82-96`).
- `playwright.config.ts` — the browser suite: two projects split by file name,
  `retries: 0`, `workers: 1` (`playwright.config.ts:48`, `:54`).
- `tests/setup.ts` — what every unit file gets before it runs.
- `.env.development` (untracked) — the live suite reads the real staging
  addresses and the test account from it (`tests/e2e/harness/env.ts:113-137`).

## Possibly affected services

- **core backend** (`server: "market"`) — every call in scope goes here:
  `/cart/update`, `/cart/remove`, `/cart/cart_shipping`, `/cart/cart_overview`,
  `/customer/address/list`, `/customer/address/set-default`,
  `/customer/order/checkout`. A red step must name this backend.
- **gateway** — not called by any path in scope. Searched `services/cart.ts` and
  `services/order.ts` for a server other than `"market"` and found none.

## Verified facts

| # | Fact (one sentence) | Evidence (`path:line`) | How checked |
|---|---------------------|------------------------|-------------|
| F-1 | The cart is a drawer inside a persistent provider, not a route; there is no `/cart` page. | `app/(client)/[lang]/layout.tsx:256`; `components/Cart/CartProvider.tsx:10-13` | opened both files; ran `find app -ipath '*cart*'` and got no route |
| F-2 | `data-pw="cartPage-container"` is on the real drawer **and** on its loading skeleton, so its presence alone does not mean the cart loaded. | `components/Cart/index.tsx:155`; `components/skeleton/CartSkeleton.tsx:13` | ran search `cartPage-container`, opened both hits |
| F-3 | A quantity change goes through `cartService.UpdateCart`, which POSTs `/cart/update` to the core backend with `{key, quantity}`. | `components/Cart/index.tsx:503-507`; `services/cart.ts:74-90` | opened both files |
| F-4 | `UpdateCart` writes the quantity **the backend confirmed** (`response.data.qty`), not the one asked for, and returns `false` on `status !== 1`. | `services/cart.ts:94-101` | opened file |
| F-5 | A rejected quantity change rolls the input back to the previous value and reports to Sentry; it does not throw. | `components/Cart/index.tsx:508-518` | opened file |
| F-6 | After every plus or minus the drawer re-reads the whole cart with `getCart` and re-seeds the store with `initCart`. | `components/Cart/index.tsx:570-575`, `:611-616` | opened file |
| F-7 | The plus control is never disabled: `shouldDisablePlus()` returns a hardcoded `false`, and `max={product.available_quantity}` is passed but unused for disabling. | `components/Cart/index.tsx:623-633`, `:347` | opened file |
| F-8 | At quantity 1 the row draws the delete control **in place of** the minus control; above 1 it draws minus plus a second, differently placed delete control. | `components/Cart/index.tsx:732`, `:758`, `:780` | opened file; the two branches of one ternary |
| F-9 | Only the quantity-1 delete branch reports `CART_ITEM_REMOVED` to the order funnel; the quantity-above-1 delete branch calls `deleteFunction()` with no telemetry. | `components/Cart/index.tsx:763-764` vs `:781-789` | opened file, compared both branches |
| F-10 | Removing a line takes the row out of the store **before** the backend answers, and the service puts it back when the backend refuses. | `components/Cart/index.tsx:137-139`; `services/cart.ts:132` | opened both files |
| F-11 | `errRemoveFromCart` restores the row only when `localCart` no longer holds it, so the widget path cannot double-list a row. | `store/Cart/reducer.ts:418-428` | opened file |
| F-12 | `removeFromCart` filters `cart` by `s.id` and `localCart` by `s.item_id`. **Both keys carry the same value for a row seeded by `initCart`**, which sets `localCart[].item_id` from `cart[].id`, so no list is left behind on that path. Corrected at `/plan` round 1. | `store/Cart/reducer.ts:402-406`; `store/Cart/reducer.ts:373-374` | opened file; corrected by the plan check |
| F-13 | Every money field (`total`, `sub_total`, `total_shipping_cost`, `total_discount`, `total_cash`) starts as `null` and is only ever written from a backend answer. | `store/Cart/reducer.ts:50-56`, `:367-392`, `:394-400` | opened file |
| F-14 | `getCart` reads `/cart/cart_shipping` and writes the answer with `initCart`. | `utils/functions.tsx:314-327` | opened file |
| F-15 | `GetCartOreview` reads `/cart/cart_overview` and writes the answer with `setCartPreview`. | `utils/functions.tsx:338-350` | opened file |
| F-16 | `setCartPreview` spreads the backend answer over the store but deliberately keeps the existing `cart` and `localCart`. | `store/Cart/reducer.ts:394-400` | opened file |
| F-17 | `data-pw="cart-total-price"` renders `getTotaPriceToShow() + total_discount - total_shipping_cost`, under the labels "Price" / "Normal Price". | `components/Cart/OrderButton.tsx:365-388` | opened file |
| F-18 | The payable total is rendered separately as `data-pw="offer-total-price"`, which is `getTotaPriceToShow()` alone. | `components/Cart/OrderButton.tsx:572-578` | opened file |
| F-19 | `getTotaPriceToShow()` returns `total_cash` when a payment method with `id === 0` is chosen, otherwise `total`. | `components/Cart/OrderButton.tsx:60-65` | opened file |
| F-20 | The shipping cost is rendered as `data-pw="Shipping-RoundPrice"`, and the "free shipping" line is drawn only when `total_shipping_cost === 0`. | `components/Cart/OrderButton.tsx:488-511` | opened file |
| F-21 | `RoundPrice` falls back to `currency.exchange_rate` when no `rate` is passed, so the line prices and the totals apply the same rate. | `utils/functions.tsx:195` | opened file |
| F-22 | `RoundPrice` returns the plain converted number only when `returnNumber` is set; otherwise it shortens 100000 and above to `100K` or `1M`. | `utils/functions.tsx:200-215` | opened file |
| F-23 | A line price passes `rate` but **not** `returnNumber`, so a large line price is drawn shortened while the totals beside it are not. | `components/Cart/index.tsx:537-544` vs `components/Cart/OrderButton.tsx:380-386` | opened both files |
| F-24 | `RoundPrice` rounds **up** to the currency's decimal digits before converting. | `utils/functions.tsx:166`, `:197` | opened file |
| F-25 | Checkout posts `address_id` taken from the first address with `is_default === 1` in the local store. | `services/order.ts:74`, `:81` | opened file |
| F-26 | Tapping an address in the sheet calls `order.SetDefault`, `updateAddress` and `setDefaultAddress` together, and closes the sheet. | `components/Cart/AddressListContainer.tsx:75-84` | opened file |
| F-27 | `SetDefault` re-reads the totals with `GetCartOreview()` after the backend accepts, which is how the shipping cost follows an address change. | `services/order.ts:232-242` | opened file |
| F-28 | `SetDefault` swallows a refusal: it logs to Sentry, clears the loading flag, and does **not** undo the local default set beside it. | `services/order.ts:243-248`; `components/Cart/AddressListContainer.tsx:81-83` | opened both files |
| F-29 | The edit control on an address row is `data-pw="Edit-Addres-Icon"`, and the settings address screen uses the same id. | `components/Cart/AddressListContainer.tsx:275`; `components/settings/PersonalInfoAddress.tsx:426` | ran search `Edit-Addres-Icon`, opened both hits |
| F-30 | The address sheet is `data-pw="AddressListContainer"` and has no selector entry in the browser suite. | `components/Cart/AddressListContainer.tsx:63`; `tests/e2e/selectors.ts` has 0 hits for it | ran search, opened file |
| F-31 | `tests/e2e/selectors.ts` exposes `cart.total` pointing at `cart-total-price`, and **nothing in the browser suite uses it**. | `tests/e2e/selectors.ts:420`; searching `tests/e2e` for `cart.total` and `cart-total-price` returns only that line | ran search |
| F-32 | The unit suite already proves the address sheet ships to the address the shopper tapped. | `tests/components/Cart/AddressListContainer.test.tsx:106` | opened file |
| F-33 | The unit suite already proves `updateProductQuantityInCart`, `setDefaultAddress`, `updateAddress`, and the whole of `UpdateCart` and `RemoveFromCart` at service level, including the refusal paths. | `tests/store/cartReducer.test.ts:66`, `:124`, `:356`, `:423`; `tests/services/cart.test.ts:293-356`, `:357-474` | opened both files |
| F-34 | No unit test covers the store actions `removeFromCart`, `initCart` or `setCartPreview`. | searching `tests/store/cartReducer.test.ts` and `tests/services/cart.test.ts` returns 0 for each of the three | ran search per symbol |
| F-35 | `tests/components/Cart/QuantutyInput.test.tsx` exists and covers only the Out-Of-Bag move, not the plus, minus or delete controls. | `tests/components/Cart/QuantutyInput.test.tsx:76-124` | opened file |
| F-36 | The browser suite already has helpers for adding and removing an address, and for counting them. | `tests/e2e/actions/profile.ts:595`, `:649`, `:737` | opened file |
| F-37 | The browser suite already has helpers for the whole money path: empty the bag, go to checkout, check an address exists, confirm shipping and payment, place the order. | `tests/e2e/actions/cart.ts:117`, `:354`, `:400`, `:414`, `:451` | opened file |
| F-38 | The live money path today is two cases, `BUY-01` and `BUY-02`, both in one spec. `BUY-01` signs in for real and budgets `15 * 60 * 1000` ms; `BUY-02` budgets `5 * 60 * 1000` ms. | `tests/e2e/shopper.live.spec.ts:133`, `:140`, `:371`, `:374`; `docs/testing/E2E_SCENARIOS.md:222-223` | opened both files; line numbers corrected by the plan check |
| F-39 | **Both** register rows have drifted: it records `BUY-01` at `shopper.live.spec.ts:117` and `BUY-02` at `:307`; the tests are at `:133` and `:371`. | `docs/testing/E2E_SCENARIOS.md:222`, `:223` vs `tests/e2e/shopper.live.spec.ts:133`, `:371` | opened both files; corrected by the plan check |
| F-41 | A client call never carries the backend path in its URL: it goes out as `POST /api/proxy` with the target in an `x-proxy-url` request header. Matching a response on `/cart/cart_overview` therefore never fires. | `utils/fetchData.ts:626`, `:649`; the working match pattern is `tests/e2e/actions/cart.ts:180-184` | found by the plan check, round 1; opened both files |
| F-42 | The price, discount and shipping block in the totals row renders only when `expanded` is true, and `expanded` starts `false`. The control that opens it is `data-pw="total-expanded"`. | `components/Cart/OrderButton.tsx:41`, `:325`, `:520` | found by the plan check, round 1; opened file |
| F-43 | The totals row renders nothing at all unless `cart.length > 0`, and it reads `currency.symbol` without optional chaining while the store's `currency` starts as `null`. | `components/Cart/OrderButton.tsx:267`, `:388`; `store/homepage/reducer.ts:76` | found by the plan check, round 1; opened both files |
| F-44 | `order.SetDefault` has exactly **one** live caller. The other two call sites are commented out. | `components/Cart/AddressListContainer.tsx:80`; `components/Orders/ChangeAddressWidget.tsx:183` (commented); `components/settings/PersonalInfoAddress.tsx:172` (commented) | found by the plan check, round 1; ran the search and opened all three |
| F-45 | `initCart(` has **15** call sites, not 13. | `utils/functions.tsx:327`; `components/Cart/PlaceOrderButtons.tsx:97`, `:308`; `components/Cart/OrdersPage.tsx:178`, `:384`, `:442`, `:847`; `components/Cart/OrderButton.tsx:186`; `components/Cart/OldCartContainer.tsx:160`; `components/Cart/index.tsx:82`, `:572`, `:617`; `components/Cart/couponElement.tsx:71`; `components/Cart/AddToCart/AddToCartComponent.tsx:318`; `services/home.ts:67` | re-ran the search at the plan check |
| F-46 | Seven spec files use `test.step()`, not one: `profile.live` (21), `shopper.live` (14), `session-recovery.live` (7), `guest.live` (5), `login-design-parity.scripted` (3), `profile.scripted` (3), `auth.scripted` (1). The `CLAUDE.md` line saying no other spec does this is stale. | counted per file across `tests/e2e/*.spec.ts` | ran the count at the plan check |
| F-47 | The live suite holds 56 cases across 8 spec files, and CI runs both projects in one pass with no `--project`. | `.github/workflows/test-e2e.yml:222`; counted across `tests/e2e/*.live.spec.ts` | counted by the plan check, round 1 |
| F-48 | A signed-in session can be handed from one live case to the next; the saved-state paths are named in one place. | `tests/e2e/harness/liveSession.ts:47-51`, `:106`, `:134`; used by `tests/e2e/auth.live.spec.ts:169` and `tests/e2e/profile.live.spec.ts:168` | found by the plan check, round 1; opened file |
| F-49 | Synthetic probe values already exist for live writes to the shared account. | `tests/e2e/profile.live.spec.ts:175`, `:185`, `:218`, `:219` | found by the plan check, round 1; opened file |
| F-50 | A redaction helper exists for text that may carry a secret. | `tests/e2e/harness/redact.ts:109`, `:128` | found by the plan check, round 1; opened file |
| F-40 | No test in either suite uses a strict expected-failure marker; `it.fails`, `test.fails` and `test.fail(` return zero hits across `tests/`. | searched `tests/**` — 0 hits | ran search |

## Shared things (found by search)

| Search term | Hits (`path:line`) | Who uses it / what it does there |
|-------------|--------------------|----------------------------------|
| `cartService.UpdateCart` | `components/Cart/index.tsx:507`; `tests/services/cart.test.ts` (4) | the only production caller is the drawer's quantity control |
| `cartService.RemoveFromCart` | `components/Cart/index.tsx:139`; `tests/services/cart.test.ts` (7) | the only production caller is the drawer's delete control |
| `removeFromCart` | `store/Cart/reducer.ts:402`, `:405`; `services/cart.ts:111`, `:125`; `components/Cart/index.tsx:137`, `:468` (4 uses in file); `tests/services/cart.test.ts` (1) | one store action, two production callers — the drawer removes optimistically, the service removes on success |
| `updateProductQuantityInCart` | `store/Cart/reducer.ts:295`; `services/cart.ts:75`, `:95`; `tests/store/cartReducer.test.ts` (2) | written only by `UpdateCart` |
| `setCartPreview` | `store/Cart/reducer.ts:394`; `utils/functions.tsx:339`, `:349`; `utils/functions.test.ts` (3); `tests/render.test.tsx` (1) | written only by `GetCartOreview` |
| `initCart(` | `utils/functions.tsx:326`; `services/home.ts:65`; `components/Cart/OrdersPage.tsx` (4); `components/Cart/index.tsx` (3); `components/Cart/PlaceOrderButtons.tsx` (2); `components/Cart/OrderButton.tsx` (1); `components/Cart/OldCartContainer.tsx` (1); `components/Cart/couponElement.tsx` (1) | **13 call sites.** Any change to the store's cart shape touches all of them |
| `order.SetDefault` | `components/Cart/AddressListContainer.tsx:81`; `components/settings/PersonalInfoAddress.tsx`; `components/Orders/ChangeAddressWidget.tsx`; `tests/components/Cart/AddressListContainer.test.tsx` (2) | **three** production callers: the checkout sheet, the settings screen, and changing the address on a placed order |
| `setDefaultAddress` | `store/Cart/reducer.ts:268`; `components/Cart/AddressListContainer.tsx` (2); `components/Orders/ChangeAddressWidget.tsx`; `tests/store/cartReducer.test.ts` (4); `tests/components/Cart/AddressListContainer.test.tsx` (1) | the local half of choosing an address, shared with the placed-order widget |
| `GetCartOreview` | `utils/functions.tsx:338`; `services/order.ts:241`, `:285`; `components/Cart/index.tsx` (2); `tests/msw/handlers.ts` (1); `utils/functions.test.ts` (7) | re-reads the totals after set-default, after placing, and after a line change |
| `getCart(` | `utils/functions.tsx:299`; `services/home.ts`; `components/Cart/OrdersPage.tsx` (4); `components/Cart/AddToCart/Button.tsx` (4); `components/Cart/index.tsx` (3); `components/Cart/AddToCart/NotifyButton.tsx` (2); `utils/NotificationHandler.ts` (1); `tests/msw/handlers.ts` (1) | the cart re-read; also fired by the add-to-cart sheet and by a push notification |
| `RoundPrice(` | `utils/functions.tsx:169`; `utils/server/helpers.ts:118`; `components/Cart/OrderButton.tsx` (7); `components/Cart/AddToCart/PricesRow.tsx` (8); `components/Cart/AddToCart/Card.tsx` (8); `components/Cart/PlaceOrderWidget.tsx` (4); `components/setting/orders/OrderDetailsWrapper.tsx` (6); plus tests | **two copies of the helper.** The client copy is the one every screen in scope uses |
| `cartPage-container` | `components/Cart/index.tsx:155`; `components/skeleton/CartSkeleton.tsx:13`; `tests/e2e/selectors.ts:407` | the drawer and its skeleton share one marker |
| `DeleteIcon_CartPage` | `components/Cart/index.tsx:758`, `:780` | two elements, one per branch of a ternary; only one is on screen per line |
| `Edit-Addres-Icon` | `components/Cart/AddressListContainer.tsx:275`; `components/settings/PersonalInfoAddress.tsx:426` | two screens share the marker, so a locator must be scoped |
| `cart-total-price` | `components/Cart/OrderButton.tsx:377`; `tests/e2e/selectors.ts:420` | one render site, one selector, no user |

## Test harness facts

**Unit suite (Vitest)**

- **Runner and config:** `vitest`, a single project named `unit` —
  `vitest.config.mts:78-97`. Run with `pnpm test:run`.
- **Environment:** `jsdom` — `vitest.config.mts:84`.
- **Setup files and global mocks:** `tests/setup.ts` — `vitest.config.mts:88`. It
  globally mocks `next/navigation` (`tests/setup.ts:33-36`),
  `serverActions/sendOtp` (`:42-45`) and `serverRequests/radis` (`:50-53`).
- **Env block and base URLs:** `isolatedEnv` in `vitest.config.mts:57-74`. Media
  hosts are `https://example.com`; the analytics and maps keys are empty on
  purpose (`vitest.config.mts:66-71`).
- **Fake network:** MSW, started with `onUnhandledRequest: "error"`, so a request
  with no handler **fails the test** — `tests/setup.ts:84-95`. Handlers live in
  `tests/msw/handlers.ts`; per-test replies go through `server.use()` and are
  thrown away after each test (`tests/setup.ts:108`).
- **Polyfills present and missing:** `window.matchMedia` is supplied and answers
  `matches: false` to everything (`tests/setup.ts:70-82`). **No
  `IntersectionObserver`** and no `ResizeObserver` — searched `tests/setup.ts`
  for both and found neither.
- **Timers:** real. `useFakeTimers` appears nowhere in `tests/setup.ts`.
- **Module reset:** none globally. `tests/setup.ts` calls `cleanup()`,
  `server.resetHandlers()`, `resetRoute()`, `resetServerActionSpies()` and
  `resetCacheSpies()` after each test (`:97-118`), not `vi.resetModules()`.
- **Hook-order trap:** this file's `afterEach` runs **last**, after a test file's
  own, so unmount effects are counted against the next test's spies
  (`tests/setup.ts:98-104`).
- **Default timeouts:** `testTimeout: 15000` — `vitest.config.mts:95`.
- **Strict expected-failure marker:** `it.fails()` is available in Vitest but is
  used nowhere in this repository (F-40). A `BUG-n` would be its first use.
- **Test layout and naming:** `tests/<area>/<Name>.test.ts(x)`, mirroring the
  source tree — `tests/store/cartReducer.test.ts`, `tests/services/cart.test.ts`,
  `tests/components/Cart/QuantutyInput.test.tsx`.

**Browser suite (Playwright)**

- **Runner and config:** `@playwright/test`, `testDir: ./tests/e2e` —
  `playwright.config.ts:35-36`. Run the live half with `pnpm test:e2e:live`.
- **Environment:** a real `next build` plus `next start` on
  `http://127.0.0.1:3100` — `tests/e2e/harness/env.ts:26-28` — against the real
  staging backends.
- **Projects:** `live` matches `*.live.spec.ts`, `scripted` matches
  `*.scripted.spec.ts` — `playwright.config.ts:102`, `:119`.
- **Setup:** `globalSetup: ./tests/e2e/globalSetup.ts` —
  `playwright.config.ts:41`. The signed-in fixture is `tests/e2e/fixtures.ts:61`.
- **Env block and base URLs:** the real, untracked `.env.development`, loaded once
  per process (`tests/e2e/harness/env.ts:113-137`). A case skips when its keys
  are missing — the shopper gate is `hasShopperA()`
  (`tests/e2e/harness/env.ts:152`).
- **Retries:** `0`, on purpose — a retried checkout leaves duplicate real orders
  (`playwright.config.ts:44-48`).
- **Workers:** `1`, `fullyParallel: false` — one staging dataset, one set of OTP
  limits (`playwright.config.ts:50-55`).
- **Default timeouts:** test `120_000`, expect `15_000`, action `20_000`,
  navigation `45_000`, global `30 * 60 * 1000` — `playwright.config.ts:60`,
  `:61`, `:95`, `:96`, `:65`.
- **Locator attribute:** `testIdAttribute: "data-pw"` — `playwright.config.ts:94`.
- **Artifacts:** the live project records **no trace** (a trace archives the auth
  token) but does record video and failure screenshots —
  `playwright.config.ts:104-114`.
- **Strict expected-failure marker:** `test.fail()` is available and used nowhere
  (F-40).
- **Test layout and naming:** `tests/e2e/<area>.<live|scripted>.spec.ts`, with
  shared steps in `tests/e2e/actions/` and locators in `tests/e2e/selectors.ts`.
  Scenario ids are registered in `docs/testing/E2E_SCENARIOS.md`; the money-path
  family is `BUY-nn` and stops at `BUY-02` (F-38).

## Test / validation commands available

- `pnpm test:run` — the unit suite (`vitest run --project unit`).
- `pnpm test:coverage` — the unit suite with a v8 coverage report.
- `pnpm e2e:health` — asks whether staging is answering, before blaming a test.
- `pnpm e2e:preflight` — checks the browser suite's own configuration.
- `pnpm test:e2e:live` — builds, starts the app, and runs the `live` project.
- `pnpm lint` — ESLint, including the i18n key rules.
- `pnpm lint:i18n-parity` — checks `ar` / `tr` / `ku` key parity.
- None of them was run at this stage.

## Known traps

| Trap | Source (`CLAUDE.md` section / `_specs/<slug>/review.md` row) | What the plan must do |
|------|--------------------------------------------------------------|-----------------------|
| `cartPage-container` is on the skeleton too, so it is not an anchor that the cart loaded (F-2). | `_specs/e2e-live-auth-session-proof/review.md:87` (senior and performance, major) | Every live step that waits for the cart anchors on real content — a line, the header count, or a price — never on the container alone. |
| A test can go green because the component recomputes the value itself, not because the code under test worked. | `_specs/unit-tests-price-resolution/review.md:110`, `:111` (major, found twice) | Each unit row needs a false-green guard. For the totals, assert the store field **and** the rendered string, and prove the rendered string moves when only the backend number moves. |
| jsdom here has no `IntersectionObserver` and no fake timers, and `tests/setup.ts` is not in scope to change. | `_specs/unit-tests-price-resolution/review.md:112` (performance, major); `tests/setup.ts:70-82` | Do not render a component that builds an observer or a real interval. If a case cannot go green without editing `tests/setup.ts`, block — that file is not in scope. |
| MSW fails the test on any unhandled request. | `tests/setup.ts:84-95` | Every new unit case that reaches the network declares its handler with `server.use()`, or uses the service stand-in. |
| A test must name **which** backend refused, and quote what the app said. | `CLAUDE.md > Testing`, rules 1 and 3 | Every assertion message names the core backend and the endpoint, and quotes the app's own message where one exists. |
| Never assert on a count. | `CLAUDE.md > Testing`, rule 5 | Do not assert "the bag has 2 lines". Assert the named line is present, or gone. |
| A partial success is a failure; check content, not presence. | `CLAUDE.md > Testing`, rules 4 and 6 | A total that renders as an empty string, `0`, or `NaN` is a failure even though the element exists. |
| One assertion per step, and a long browser flow uses `test.step()`. | `CLAUDE.md > Testing`, rules 2 and 8; the model is `tests/e2e/profile.live.spec.ts` | Each live case is a chain of `test.step()` calls, one per thing that can break alone. |
| A red test is not a bug report: confirm the app is wrong before touching app code. | `CLAUDE.md > A red test is not a bug report` | If F-9 (the missing telemetry) or F-28 (the swallowed refusal) breaks a case, record it as a finding and open a ticket. Do not fix app code here. |
| A test that proves existing behaviour wrong is a finding, not a fix, unless it sits inside a file the plan already changes. | `CLAUDE.md > Workflows`, IM-12 and VF-12 | `BUG-n` in `implement.md` and `verify.md`, kept under a strict expected-failure marker — which would be this repository's first (F-40). |
| Never name the backing technology. | `CLAUDE.md > Stack-agnostic naming` | Say "the core backend", never the framework behind it, in test names, messages and docs. |
| Any URL opened by hand uses the `sy-en` locale. | `CLAUDE.md > Opening the app by hand` | Any manual check during implement uses `/sy-en/...`. |
| Protected runtime paths may not be touched. | `CLAUDE.md > Project profile` | `proxy.ts`, `next.config.ts`, `instrumentation*`, `sentry.*.config.ts` and `.github/workflows/**` stay out of Files to change. |
| Never test code with no caller. | `CLAUDE.md`-adjacent standing rule; also `PL-14` | `cart.total` in `selectors.ts:420` has no caller today (F-31). Either a new case uses it, or it is corrected — not left as a wrong name nobody calls. |
| `E2E_SCENARIOS.md` line references drift (F-39). | `docs/testing/E2E_SCENARIOS.md:214` | A new `BUY-nn` row records the file and line at the time of writing, and the plan lists that document under Files to change. |

## Risks and unknowns

- **The `cart.total` selector is misnamed** (F-17, F-18, F-31). A live case that
  reads it believes it read the total. Impact: high — it is exactly the false
  green this ticket exists to prevent. Likelihood: certain if unaddressed.
- **Shipping may be free on staging for the test account.** If
  `total_shipping_cost` is `0`, a case that only checks "the shipping row shows
  the shipping cost" proves nothing, because `0` is also what a broken read
  gives (F-20). Impact: high. Likelihood: unknown — `OQ-2`.
- **Per-line prices are rounded up one by one and can be shortened to `12K`**
  (F-22, F-23, F-24). Summing what is on screen and comparing it to the total
  will not match exactly. Impact: high for any "sum the lines" case. Likelihood:
  certain for large prices.
- **The quantity-above-1 delete control reports nothing to the order funnel**
  (F-9). It looks like a real defect, but nothing in this repository states the
  expected behaviour, so it is a candidate finding, not a confirmed bug.
- **`SetDefault` does not undo the local default when the backend refuses**
  (F-28). Same status: a candidate finding, unverified against any stated
  expectation.
- **A live case that changes a quantity writes to the shared staging account.**
  Workers are 1 and retries are 0 (`playwright.config.ts:48`, `:54`), so the risk
  is leftover state, not a race. Impact: medium. The case must restore the bag.
- **Staging can be down.** A red live run may mean the backend, not the code
  (`playwright.config.ts:1-6`). `pnpm e2e:health` runs first.

## Open questions

| ID | Question | Why it matters |
|----|----------|----------------|
| OQ-1 | Does the staging shopper account (`TEST_ACCOUNT_PHONE`) already have two saved addresses, or must the live case create the second one with `addAddress` (`tests/e2e/actions/profile.ts:649`) and remove it afterwards? | Decides whether the address case has a setup and a cleanup step, and whether it can name "the other address". |
| OQ-2 | Is `total_shipping_cost` non-zero on staging for that account, and does it change between two addresses? | If it is always `0`, the case cannot tell a real read from a broken one, and the shipping half must be written differently or recorded as not covered. |
| OQ-3 | Should the totals case assert the exact identity `normal price - total_discount + total_shipping_cost === payable total` (F-17, F-18), or only that each field matches the store value the backend wrote? | The first is a stronger check and is arithmetic the app really does; the second cannot catch a wrong formula. |
| OQ-4 | Is the misnamed `cart.total` selector (F-31) corrected in this ticket, or left alone? | It is test code, so correcting it is in scope, but it is not one of the three cases. `PL-14` and the smallest-change rule pull in opposite directions. |
| OQ-5 | Does the live cart-line case ride inside the existing `BUY-01` journey, or become its own `BUY-nn` case with its own bag setup and teardown? | `BUY-01` already places and cancels a real order. Adding steps to it is cheaper but makes one failure harder to read. |
| OQ-6 | For the unit half of case 3, which file is extended: `tests/components/Cart/QuantutyInput.test.tsx` (F-35) for the controls, `tests/store/cartReducer.test.ts` for `removeFromCart` (F-34), or both? | `PL-14` forbids a second parallel test file for a unit that already has one. |
| OQ-7 | Is the missing telemetry on the quantity-above-1 delete (F-9) recorded as `BUG-n` in this ticket, or left out of scope entirely? | It sits inside `components/Cart/index.tsx`, which this ticket reads but does not plan to change. |
| OQ-8 | Is the swallowed `SetDefault` refusal (F-28) in scope as a case, given that no source states the expected behaviour? | `CLAUDE.md` sends "no sourced expectation" work to this workflow to decide, not to `hotfix`. The spec must either decide it or put it out of scope. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No command was run against staging; `pnpm e2e:health` is listed, not executed.
