# Test Roadmap — Critical User Journeys

**29 phases across 5 journeys.** Each phase is **one ticket** through the full
workflow (`/start-ticket` → `/research` → `/spec` → `/plan` → `/review` →
`/implement` → `/verify` → `/publish-pr`).

This roadmap does **not** chase repo-wide coverage. It follows the paths a real
user walks, in order of how badly the app breaks when that path breaks. A phase
covers one slice of a journey **through every layer it touches** — helper,
store, service, route handler, component — so a passing phase means that slice
of the journey actually works, not that one file's functions return the right
shape.

Journeys run in order. **Within a journey, phases run in the order listed** —
later phases assert against behaviour the earlier ones pinned down. Phases in
different journeys are independent and can run in parallel.

---

## Contents

| # | Journey | Phases | Why it ranks here |
|---|---|---|---|
| 0 | Foundation | 1–3 | Nothing else can be written without it |
| 1 | Reach the page | 4 | Runs on every request; if it breaks, no journey starts |
| 2 | Sign in and stay signed in | 5–11 | A bug locks every user out or leaks a token |
| 3 | Buy | 12–20 | Money. A wrong price or a lost order is unrecoverable |
| 4 | Find | 21–25 | Nothing gets bought that cannot be found; known live bug |
| 5 | Sell | 26–29 | Breaks the seller, not the shopper |

**Journey 1 is here because you selected four journeys and all four begin with a
request through `proxy.ts`.** It is one phase, not a journey's worth of work,
but it sits ahead of the rest because every other phase assumes it works.

---

## Starting point

Phases 1 and 2 are closed. What they left behind:

- `vitest.config.mts` — jsdom, `globals: true`, `@vitejs/plugin-react`,
  `vite-tsconfig-paths`, and a `v8` coverage block whose `include` is an
  explicit list (currently `utils/functions.tsx` only)
- `tests/fixtures/` — `product`, `user`, `cart`, `order`, `address`, `story`,
  `chat`, `elastic` builders
- `tests/mocks/` — `nextHeaders`, `cookieManager`, `fetchData`, `store`,
  `localization`, `posthog`, `sentry`, and `mockFetch`
- `docs/testing/UNIT_TESTING.md` — the conventions every phase follows
- `pnpm test:run` / `pnpm test:coverage`

**There is CI, and no phase adds to it.** `.github/workflows/tests.yml` runs on
every pull request into `develop` and `main`, and on every push to them. One
job, four gates: `pnpm lint:i18n-parity`, `pnpm lint`, `next typegen` +
`tsc --noEmit`, and `pnpm test:run`. It was added outside this roadmap, as its
own change, and a phase neither edits it nor needs to know it is there — write
the tests, and the gate picks them up.

Two things about it that will otherwise cost you an afternoon:

- **`tsc --noEmit` on its own fails on a fresh checkout.** `next-env.d.ts` is
  gitignored and imports `./.next/types/routes.d.ts`, so neither file exists
  until `next typegen` writes them. Reproduce a CI type failure locally by
  running `pnpm exec next typegen` first.
- **Lint is errors-only.** The repo has 39 warnings; the gate does not use
  `--max-warnings 0`. Clearing them is somebody's ticket, not a phase's job.

Coverage is still local only — nothing is uploaded and no artifact is kept.
`.gitlab-ci.yml` is dead and removing it is not part of this roadmap.

---

## Five rules every phase follows

**1. A phase covers a journey slice, not a file.** The spec names the user-facing
behaviour it protects ("a 401 mid-checkout does not lose the cart"), then lists
the modules that behaviour runs through. If a module in the list has nothing to
do with the journey, drop it from the phase — do not test it for completeness.

**2. Where a test file goes.** In the `tests/` mirror of the source path
(`utils/server/authRefresh.ts` → `tests/utils/server/authRefresh.test.ts`),
mirroring the full path, not a flattened one. This is required for a module under
a `protected_paths` glob — a new file inside `serverRequests/**` would trigger the
protected-path full stop (GU-2 / IM-5) — and it is the convention for everything
else too, so one suite lives in one place. `utils/functions.test.ts` is the single
colocated leftover; leave it, do not copy it. See `UNIT_TESTING.md`.

Phases marked **🔒** touch a protected path, must use the mirror, must state it
in `plan.md`, and must carry the protected-path statement in `verify.md` (TR-3).

Protected globs: `proxy.ts`, `serverRequests/**`, `utils/cookies/**`,
`app/api/auth/**`, `services/auth.ts`, `services/cart.ts`, `services/order.ts`,
`services/orders.ts`, `store/index.ts`, `next.config.ts`.

**3. Coverage covers the whole app.** `coverage.include` names whole folders, so
a phase adds nothing to it. The headline share is honest — every file the app
ships is counted, and an untested file shows as 0%, which makes the report the
list of what is left. (It was an explicit per-phase list once; that only ever
reported on files somebody had already tested.)

**4. Tests never change the code under test.** If a module resists testing, that
is a finding recorded in the ticket, not licence to refactor. A refactor is its
own ticket.

**5. No test performs real I/O.** No network, no Redis, no Elasticsearch, no
Firebase, no real cookie writes. Use the Phase 2 factories; do not invent new
ones.

This rule is unchanged by the `live` vitest project (`tests/live/`,
`pnpm test:live`), which does talk to the staging backend. That project is
**outside this roadmap**, is empty today, and is never part of `pnpm test:run`
or of CI — precisely so that no phase here ever depends on staging being up. A
phase writes into the `unit` project and nowhere else. See
`tests/live/README.md`.

**Validation profile:** every phase names `logic-change` in `plan.md` — lint,
typecheck and the unit tests. (This line used to say `tests-and-types`, which is
not a profile this project defines; the profiles in
`.claude/project-config.yaml` are `ui-change`, `logic-change` and `full`, and
naming one that does not exist makes `/wf:plan` abort on VP-1.)

---

# Journey 0 — Foundation (Phases 1–3)

### Phase 1 — `unit-test-harness-and-coverage` — **closed**

### Phase 2 — `test-fixtures-and-mock-factories` — **closed**

### Phase 3 — `rtl-render-harness` — **done**

Every component phase (10, 19, 20, 25, 28, 29) was blocked on this one. It is
unblocked. The work was done straight on `develop`, by the owner's decision.

**Acceptance criteria** — all three met, and proved in `tests/render.test.tsx`:
a component that reads the store renders with seeded state; a component that
calls `translateFunction` renders translated copy for a chosen locale; the helper
makes no network call.

**What a component phase now has**

| Use this | For |
|---|---|
| `tests/render.tsx` → `renderWithProviders` | Put a component on the page with a seeded store, a chosen language, and a route. Always `await` it. |
| `tests/mocks/nextNavigation.ts` | The App Router hooks. Registered for the whole run — no test file has to ask. Read `routerSpies` to see where a component sent the user. |
| `tests/msw/handlers.ts` → `proxyRoute` | Answer a backend call. The app never asks a backend directly, so match on the path, not the address (see below). |
| `tests/mocks/serverActions.ts` | The Server Actions. Also registered for the whole run. |
| `tests/mocks/serverRequests.ts` | The cache layer. Also registered for the whole run, and the one you must not remove — see finding 2. |

`renderWithProviders` gives the component the **real** store, with the real
reducers and real actions, so a store change re-renders the component. It resets
the store before every render, so no test inherits the one before it.

**The msw decision — yes, it is in.** The two Phase 2 stand-ins
(`tests/mocks/fetchData.ts`, `tests/mocks/mockFetch.ts`) work by replacing a
module, so the code they replace stops running. They cannot cover a component
that calls `fetch` itself and still needs the real code path — which
`components/global/compare.tsx` does, straight to
`/api/products/searchInCatalog`. msw answers at the network layer instead.
It runs in Node only: no service worker, nothing added to `public/`. An
unhandled request now fails the test rather than reaching the real network.
Reach for the cheaper Phase 2 stand-ins first; use msw when the real path has to
run.

**Are the component phases ready to start? Yes — checked, not assumed.**
All **68** components in the phase 19, 20, 25, 28 and 29 folders load under the
harness. Three of them (`ColorSelect`, `PricesRow`, `ProductCard`) were rendered
end to end, in English and in Arabic, reading the store and `next/image`.

One caveat worth knowing: `components/Cart/AddToCart/AddToCartComponent.tsx`
takes about 4.5 seconds to load the first time, which is longer than the default
5-second limit for a single test. It only matters if a test loads it with
`await import(...)` *inside* the test. A normal `import` at the top of the file
happens before the test starts and is not timed, so this costs nothing in
practice.

**Three things this phase found**

1. **The app never asks a backend by its address.** `utils/fetchData.ts` sends
   every external call to `POST /api/proxy` with the real path in an
   `x-proxy-url` header, and the service name as an opaque token in
   `x-proxy-server`. A handler written for `/customer/info` would match nothing.
   `proxyRoute()` reads those headers for you and decodes the service name.
2. **The client module graph reaches the server side, and it opens a socket.**
   `services/auth.ts` imports `serverActions/sendOtp.ts`, and the shared store
   reaches `serverRequests/radis` — which loads `ioredis`. **ioredis opens a real
   connection the moment it is loaded, before anything calls it.** Next cuts both
   chains at the `"use server"` line; the test runner does not, so importing the
   store first failed outright (`server-only` will not resolve) and then, once it
   loaded, quietly connected to a Redis server that was not there. `tests/setup.ts`
   cuts both in the same place with stand-ins, and `tests/setup.test.tsx` fails if
   anyone removes the cache one. **No production code was changed** (rule 4): this
   is recorded as a finding, and a refactor would be its own ticket.
3. **Tests need their own settings.** The runner does not read `.env.development`,
   and it should not — those addresses are real. Without a media address,
   `next/image` is handed `"undefined/…"` and throws before a component can
   render. `vitest.config.mts > test.env` now sets obviously fake values;
   `example.com` is the media host because it is reserved for this and is already
   in the `next.config.ts` allow-list. Add a key there when a component needs one,
   and never point it at something real.

**Note.** Only one `<Page variant="scaled">` may ever be mounted — `AppScaler`
uses hardcoded ids and `:root` variables with no refcount. `renderWithProviders`
never mounts one.

---

# Journey 1 — Reach the page (Phase 4)

`proxy.ts` (598 lines) runs on **every request**. A locale bug here does not
degrade a feature; it makes the whole site unreachable for a language.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 4 | `unit-tests-proxy-routing` | `proxy.ts` — locale detection for `en`/`ar`/`tr`/`ku` with default `en`; country detection with default `gb`; the rewrite and redirect rules into `app/(client)/[lang]/`; bot detection; locale persistence in the non-HttpOnly cookies; the matcher config | 🔒 |

**Notes.** `main` carries a logo page plus a proxy gate that `develop` does not,
and the gate and matcher are one revertable unit. These tests run against
`develop` behaviour — do not encode the staging gate. If `/research` finds 598
lines of routing plus bot detection do not fit one honest ticket, split it in
two there.

---

# Journey 2 — Sign in and stay signed in (Phases 5–11)

The user opens the app as a guest, gets a token without noticing, enters a phone
number, receives an OTP, becomes a logged-in user, and stays that way. The
failure modes are: nobody can log in, everybody gets logged out mid-action, or a
token leaks. Every phase below is on the critical path of every other journey.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 5 | `unit-tests-authed-fetch` | `serverRequests/HandleAuthedFetch.ts` (191), `ServerFetch.tsx` (184) | 🔒 |
| 6 | `unit-tests-cookie-and-token` | `utils/cookies/cookie-manager.ts` (315), `utils/server/tokenManager.ts` (439) | 🔒 |
| 7 | `unit-tests-client-fetch-data` | `utils/fetchData.ts` (690) — the client `{url, method, body, server, reqTitle}` path | |
| 8 | `unit-tests-otp-locks-refresh-and-dedup` | `utils/server/otpIdentity.ts` (258), `utils/otpLocks.ts` (108), `utils/server/otpTelemetry.ts` (95), `utils/server/authRefresh.ts` (415), `serverRequests/requestDedup.ts` (32) | 🔒 |
| 9 | `unit-tests-auth-service` | `services/auth.ts` (1085) — login, logout, session, guest, OTP send/resend/verify; `store/auth/reducer.tsx` (224) | 🔒 |
| 10 | `unit-tests-api-auth-routes` | `app/api/auth/` — `login`, `logout`, `refresh`, `clear-tokens`, `me`, `update-user`, `register-device`, `wallet-token`, `expire`; `app/api/proxy/route.ts` — the hard block on `send_otp` | 🔒 |
| 11 | `component-tests-auth-flow` | `components/Login/Enhanced/` (`VerifyPhoneFlow`, `InlineVerifyPanel`, `usePhoneVerifyFlow`, `screens/`, `ui/`); `Login/` — `Timer`, `SessionTimer`, `SessionExpiredWidget`, `ConfirmMobilePhoneWidget` | 🔒 |

**Also in this journey, outside the numbered phases:**
`unit-tests-otp-send-and-limiter` — `serverActions/sendOtp.ts` (166) and the
`otpRateLimit` wrapper in `serverRequests/radis/index.ts` 🔒. It is deliberately
**not** given a phase number: the numbers above are referenced elsewhere and
renumbering them would break those references, and the count in the contents
table ("29 phases") counts the numbered phases only.

Why it exists at all: both files were in no phase, and both are replaced by
stand-ins for the whole test run (`tests/setup.ts`), so neither had ever been
executed by a test. The send action owns the rate-limit decision and every
refusal message a user sees; the wrapper owns what happens when the counter store
is unreachable — it fails **open**. Each test file lifts only its own stand-in,
which is why they are separate files.

The counter script itself is **not** covered here. It needs a real store, and it
belongs to `LIVE_TEST_ROADMAP.md` phase 6.

**Phase 5 is the single highest-value test in the repo.** Draft acceptance
criteria: a 200 passes through with the token attached; a 401 triggers **exactly
one** guest registration and **exactly one** retry, not a loop; a 401 on the
retry gives up and reports rather than recursing; cookie writes silently no-op
during pure render. Set a test timeout — untested retry logic is exactly where an
infinite loop hides.

**Phase 6.** Assert cookie names, `HttpOnly`, expiry and the `SameSite` options —
not just that a value round-trips. Token parsing needs a valid, an expired and a
malformed token. `MARKET-TOKEN` is the single auth cookie for guest and logged-in
alike; `DEVICE-TOKEN` is legacy and must appear only in logout-cleanup lists — a
test should lock that in.

**Phase 8** mocks Redis. No test may reach a real instance. It also carries
`serverRequests/requestDedup.ts`, which was a Phase 5 target and was left
untested there — that is why the phase is now 🔒 and its dedup test goes in the
`tests/serverRequests/` mirror. `authRefresh.ts` grew from 301 to 415 lines
while the refresh flow was reworked; the counts above are current.

**Phase 9** asserts **the dispatch into the store**, not just the return value.
Build the auth slice in isolation so the phase stays clear of the protected
`store/index.ts`.

**Phase 10.** Logout must clear **every** cookie in the cleanup list. `send_otp`
must be *blocked*, not passed through. No response body, header or error string
may name the backend technology — that is a stated security rule and a test is
the only thing that will hold the line.

**Phase 11.** `workspace/rdb` is the visual source of truth for these screens;
compare OTP boxes against rdb `OtpInputs`, not `PinInputs`. Assert against roles
and visible text, not class names.

Three things it left behind for every later component phase:

- **`tests/mocks/device.ts`** — say whether the test is on a phone or at a desk.
  Both input primitives render a different interface per device, and jsdom
  answers the question inconsistently (it carries `ontouchstart` while claiming
  a fine pointer), so left alone every component test silently gets the phone
  branch.
- **`tests/mocks/location.ts`** — watch where a component sent the browser.
  jsdom implements neither `location.reload()` nor assigning `location.href`.
- **`tests/setup.ts` now supplies `window.matchMedia`**, which jsdom lacks
  entirely; a component that asks for one otherwise fails to render with nothing
  on screen to say why. The same file now carries a note about `afterEach`
  order — unmount effects land on the *next* test's spies.

It also found and fixed a bug: `EnterPinScreen` read "no send cooldown running"
as "the code has expired", so a code sent to an allow-listed test number, or
sent in any browser that will not give `utils/otpLocks` storage, arrived at a
screen that said it had expired and would not take it. The screen now counts the
code's own life separately from the send cooldown.

---

# Journey 3 — Buy (Phases 12–20)

Product page → variant → add to cart → coupon → address → payment method → place
order → order lifecycle. This is where a defect costs money, and where a wrong
number is worse than a crash because nobody notices.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 12 | `unit-tests-money-and-time-formatting` | `utils/tinyUtils.tsx` (805) — price, number, date and time formatting; `utils/startingSettings.ts` (56) | |
| 13 | `unit-tests-product-detail-data` | `serverRequests/product.tsx` (723), `utils/pagesDataRequests/ProductPageData.ts` (625) | 🔒 |
| 14 | `unit-tests-price-resolution` | `components/products/ProductCard/flashPrice.ts` — the flash-deal rule: which price a card shows while a deal runs, and the time left. **Row corrected 2026-08-26**: the two files this row used to name hold no price rule — `derivedProps.ts` copies fields, and `store/Details/reducer.ts` is the listing filter store. The per-country override is already covered by `tests/services/elastic/helpers.test.ts`; the variant price belongs to phase 19 | |
| 15 | `unit-tests-cart-store` | `store/Cart/reducer.ts` (676) — `initAddressForm`, `addAddress`, `startUpdateAddress`, `updateAddress`, `setDefaultAddress`, coupon and discount, `setCodUser`, `setCryptoUser`, `setCreditUser`, `setWalletUser`, wallet balance | |
| 16 | `unit-tests-cart-service` | `services/cart.ts` (159) | 🔒 |
| 17 | `unit-tests-order-placement` | `services/order.ts` (966) — checkout and the place-order payload | 🔒 |
| 18 | `unit-tests-order-lifecycle` | `services/order.ts` — status changes, cancel, return; `services/orders.ts` (84); `utils/orderFunnel.ts` (244) | 🔒 |
| 19 | `component-tests-add-to-cart` | `components/Cart/AddToCart/` (12 files) — `ColorSelect`, `SizeSelect`, `PricesRow`, `Button`, `NotifyButton`, `CartContentOfProduct`, `FlashDealBannerCart` | |
| 20 | `component-tests-checkout` | `Cart/` — `PlaceOrderWidget`, `PlaceOrderButtons`, `PaymentMethod`, `ShippingAddressContainer`, `AddAddressForm`, `SelectRegion`, `couponElement`, `CheckoutButton`, `WalletPaymentModal`, `OrderSuccess`, `CartItem`, `CartErrorComponent` | |

**Phase 12** is first in this journey because every price the user sees passes
through it. Pin a fixed timezone and locale, or date assertions pass locally and
fail elsewhere. `startingSettings.ts` reads `starting-setting` from the core
backend and `starting_setting` from the gateway; the app reads the underscore
form only, so verified users silently get `0` for `decimal points` and
`shipping_duration_days`. Cover **both** key shapes and assert what the app does
when the value is missing.

**Phase 14** pins the flash-deal rule the shopper sees on a card: the deal price
while the deal runs, the ordinary price once it has ended, and the time left. The
rule reads the end of the deal's last day in **local** time, so a test that writes
the date as `"2026-08-27"` is timezone-dependent and one that writes
`"2026-08-27T00:00:00"` is not. **Four other copies of the same end-of-day logic
are still uncovered** — `ListingPage/Product.tsx:34`,
`Server/product/ProductPhotoSliderWrapper.tsx:48`,
`Cart/AddToCart/FlashDealBannerCart.tsx:18` and `FlashDealBanner.tsx:31` — so this
phase pins one copy, not the behaviour everywhere.

**Phase 15** deliberately excludes the ~40 `setX: (v) => set({ x: v })`
one-liners in the Cart slice. Testing a setter asserts that Zustand works, not
that your code does. The spec **names the functions under test** and says out
loud that plain setters are excluded on purpose. Build the slice in isolation so
this phase stays clear of the protected `store/index.ts`.

**Phases 16–18** mock `fetchData` and the store, and assert **the dispatch**.
Phase 17's core criterion is the outgoing payload: the exact body sent to place
an order, including the address, the payment method and the applied coupon.

**Phases 19–20.** Assert against roles and visible text, not class names —
Tailwind breakpoints here are inverted (`xs`/`sm` = max 480px, `lg` = min 769px)
and class-based assertions mislead. React Compiler is on; do not add
`useMemo`/`useCallback` to make a component testable.

---

# Journey 4 — Find (Phases 21–25)

Search box or category → query → results → filters → sort → product card. This
journey has a **known live defect**: the list sorts on root `offered_price` while
the card shows the country or flash price, so a "cheapest first" list is not
cheapest first. Phase 22 exists to lock the invariants that make that visible.

| # | Ticket slug | Targets |
|---|---|---|
| 21 | `unit-tests-elastic-query-build` | `services/elastic/helpers.ts` (2978) — query construction |
| 22 | `unit-tests-elastic-price-and-sort` | `helpers.ts` — price aggregation and filter buckets; `services/elastic/sortKeys.ts` (16) |
| 23 | `unit-tests-elastic-hit-mapping` | `helpers.ts` — hit → product mapping and price resolution |
| 24 | `unit-tests-search-execution-and-filters` | `services/elastic/elasticSearch.ts` (1197) — execution, pagination, filter and sort application; `store/search/reducer.ts` (261), `store/listing/reducer.ts` (68); `utils/listing/filterItemState.ts` (179), `normalizeListingProduct.ts` (42), `searchPathRedirect.ts` (42) |
| 25 | `component-tests-listing-and-filters` | `components/ListingPage/` (9), `components/Listing/` (11), `components/filterPage/` (3), `components/products/ProductCard/` — **`tests/components/products/ProductCard/index.test.tsx` already exists** (phase 14). Extend it; a second parallel file for the same component is a defect (PL-14) |

**Phase 22** carries the invariants: `offered_price` is always present, and a
per-country override is **always** nested under `country_offer_prices`, never
flat-only. Assert the sort key the list uses and the price the card renders come
from the same resolution — and if they do not, that is a recorded finding, not a
fix inside this ticket.

**Phase 22** must also assert `sortKeys.ts` stays free of server imports.
`services/elastic/helpers.ts` imports `next/headers` and is server-only; client
components import shared keys from `sortKeys.ts`. `tsc` passes when that leaks —
the build is what fails.

**Phase 24** should pin query-param refetch behaviour: `staleTimes.dynamic: 30`
reuses a stale RSC payload on `?query=` navigation.

`services/elastic/helpers.ts` at 2,978 lines is the largest file in the app. If
`/research` on Phase 21 finds the three-way split (21 / 22 / 23) does not follow
real seams, re-cut it in that ticket.

---

# Journey 5 — Sell (Phases 26–29)

Seller signs in → creates or edits a product → manages the shop. Lower severity
than the first four: a break here stops sellers, not shoppers, and it is caught
by a human within hours rather than silently.

| # | Ticket slug | Targets |
|---|---|---|
| 26 | `unit-tests-seller-product-payload` | `services/sellerDashboard/index.ts` (1177) — product create and edit body, descriptors, tax |
| 27 | `unit-tests-seller-shop-and-permissions` | `services/sellerDashboard/index.ts` — shop info, gallery, locations, permissions; `comments.ts` (64), `commentPermissions.ts` (25) |
| 28 | `component-tests-seller-product-edit` | `components/SellerDashboard/productEdit/` |
| 29 | `component-tests-seller-shop-and-boutique` | `components/SellerDashboard/` — `ShopInfo`, `ShopInfoLoader`, `boutiqueEdit/`, `locations/` |

**Phase 26.** The code-verified shop-product body contract is the authority for
what this payload looks like — it beats any conflicting comment or tracked doc.
Descriptors are **value-per-descriptor** (`string_choice` single-select, numeric
input, `options` is a JSON string). The save payload is not wired yet because the
backend key is unknown; the test pins what the code sends today and records the
gap, it does not invent a key.

**Phase 27.** Assert `GET /shop/info` is **never** called without
`READ_SHOP_INFO`, and that a missing permission records `permitted: false`
rather than offering a retry.

---

## Out of scope for this roadmap

Cut on purpose. Not "later phases" — no phase numbers, no schedule. If one of
these becomes critical, it gets its own ticket outside this roadmap.

- **Chat and calls** — `store/chat/`, `services/chat.ts`, `components/Chat/`,
  Agora RTC. Large surface, not on a purchase or sign-in path.
- **Push and telemetry** — FCM, `utils/NotificationHandler.ts`, Firebase init,
  `gtag`, `GAEvents`, PostHog. Analytics break silently, but they break
  reporting, not the product. `docs/posthog-events.md` stays a manual discipline.
- **Sitemaps, metadata and structured data** — `app/sitemap-*.xml`, `robots.ts`,
  `serverRequests/meta/`. Verified by crawling, not by unit tests.
- **The remaining ~490 component files** — skeletons, modals, settings, global
  chrome, stories, home shell.
- **Everything else in `utils/`** not named in a phase above — error
  serialization, history, session and version managers, luck, maps, sanitize,
  request catalog.
- **End-to-end (Playwright).** Nothing installed and nothing planned. The
  journeys above are covered at unit and component level; a browser suite is a
  separate decision.
- **CI.** The pipeline exists (`.github/workflows/tests.yml`, see **Starting
  point**) but no phase touches it — it was added as its own change and needs no
  per-phase edit. Still no coverage upload and no artifacts. `.gitlab-ci.yml` is
  dead; removing it is not part of this roadmap.
- **i18n parity.** Covered by `pnpm lint:i18n-parity` and the
  `local/translate-key-exists` ESLint rule. Do not duplicate it in tests.
- **Type-only files, config and instrumentation** — `utils/types/**`, `css.d.ts`,
  `global.d.ts`, `next.config.ts`, `sentry.*.config.ts`, `instrumentation*.ts`.
- **Refactoring for testability.** A module that resists testing produces a
  finding in its ticket, not a refactor inside it.

---

## Using this roadmap

Start at Phase 3. Journeys go in order; within a journey, phases go in order.
Phase 3 blocks every component phase.

If `/research` on a phase finds the scope is wrong — a file is smaller than it
looks, a split lands mid-seam, a target is dead code — **re-cut it in that
ticket**. The line counts here are a map, not a contract.

If a phase turns up a real defect (Phase 22 is expected to), the ticket records
it as a finding and the test pins the current behaviour. Fixing it is a
different ticket.
