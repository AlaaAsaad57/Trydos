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
- `pnpm test:run` / `pnpm test:coverage`, and a `tests-and-types` validation
  profile in `.claude/project-config.yaml`

**There is no CI.** `.gitlab-ci.yml` is dead. Everything here runs locally. No
phase adds a pipeline.

---

## Five rules every phase follows

**1. A phase covers a journey slice, not a file.** The spec names the user-facing
behaviour it protects ("a 401 mid-checkout does not lose the cart"), then lists
the modules that behaviour runs through. If a module in the list has nothing to
do with the journey, drop it from the phase — do not test it for completeness.

**2. Where a test file goes.** Colocated by default (`utils/orderFunnel.test.ts`),
matching `utils/functions.test.ts`. **Exception:** when the module sits under a
`protected_paths` glob, the test goes in a `tests/` mirror
(`tests/serverRequests/HandleAuthedFetch.test.ts`). A new file inside
`serverRequests/**` matches the protected glob and would trigger the
protected-path full stop (GU-2 / IM-5) on that ticket. Testing from outside the
glob avoids it, and no guardrail has to be weakened.

Phases marked **🔒** touch a protected path, must use the mirror, must state it
in `plan.md`, and must carry the protected-path statement in `verify.md` (TR-3).

Protected globs: `proxy.ts`, `serverRequests/**`, `utils/cookies/**`,
`app/api/auth/**`, `services/auth.ts`, `services/cart.ts`, `services/order.ts`,
`services/orders.ts`, `store/index.ts`, `next.config.ts`.

**3. Coverage is scoped, never global.** `coverage.include` is an explicit list
and **each phase appends its own targets**. The number then describes what was
tested on purpose.

**4. Tests never change the code under test.** If a module resists testing, that
is a finding recorded in the ticket, not licence to refactor. A refactor is its
own ticket.

**5. No test performs real I/O.** No network, no Redis, no Elasticsearch, no
Firebase, no real cookie writes. Use the Phase 2 factories; do not invent new
ones.

**Validation profile:** every phase names `tests-and-types` in `plan.md`.

---

# Journey 0 — Foundation (Phases 1–3)

### Phase 1 — `unit-test-harness-and-coverage` — **closed**

### Phase 2 — `test-fixtures-and-mock-factories` — **closed**

### Phase 3 — `rtl-render-harness`

Every component phase (10, 19, 20, 25, 28, 29) is blocked on this one.

- `@testing-library/react` and `@testing-library/dom` are already installed. Add
  `@testing-library/jest-dom` and `@testing-library/user-event` — neither is.
- Add `setupFiles` to `vitest.config.mts`.
- Build a `renderWithProviders` helper that mounts a component with a seeded
  store and a resolved locale, so no later phase hand-rolls its own.
- Whether `msw` earns its place is a decision for this phase's `/plan`, driven by
  what the component phases actually need. Do not assume it.

**Acceptance criteria (draft)** — a component that reads the store renders with
seeded state; a component that calls `translateFunction` renders translated copy
for a chosen locale; the helper mounts no network call.

**Note.** Only one `<Page variant="scaled">` may ever be mounted — `AppScaler`
uses hardcoded ids and `:root` variables with no refcount. The render helper must
not mount a second one.

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
| 5 | `unit-tests-authed-fetch` | `serverRequests/HandleAuthedFetch.ts` (191), `ServerFetch.tsx` (184), `requestDedup.ts` (32) | 🔒 |
| 6 | `unit-tests-cookie-and-token` | `utils/cookies/cookie-manager.ts` (315), `utils/server/tokenManager.ts` (439) | 🔒 |
| 7 | `unit-tests-client-fetch-data` | `utils/fetchData.ts` (690) — the client `{url, method, body, server, reqTitle}` path | |
| 8 | `unit-tests-otp-locks-and-refresh` | `utils/server/otpIdentity.ts` (257), `utils/otpLocks.ts` (108), `utils/server/otpTelemetry.ts` (95), `utils/server/authRefresh.ts` (301) | |
| 9 | `unit-tests-auth-service` | `services/auth.ts` (1085) — login, logout, session, guest, OTP send/resend/verify; `store/auth/reducer.tsx` (224) | 🔒 |
| 10 | `unit-tests-api-auth-routes` | `app/api/auth/` — `login`, `logout`, `refresh`, `clear-tokens`, `me`, `update-user`, `register-device`, `wallet-token`, `expire`; `app/api/proxy/route.ts` — the hard block on `send_otp` | 🔒 |
| 11 | `component-tests-auth-flow` | `components/Login/Enhanced/` (`VerifyPhoneFlow`, `InlineVerifyPanel`, `usePhoneVerifyFlow`, `screens/`, `ui/`); `Login/` — `Timer`, `SessionTimer`, `SessionExpiredWidget`, `ConfirmMobilePhoneWidget` | |

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

**Phase 8** mocks Redis. No test may reach a real instance.

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

---

# Journey 3 — Buy (Phases 12–20)

Product page → variant → add to cart → coupon → address → payment method → place
order → order lifecycle. This is where a defect costs money, and where a wrong
number is worse than a crash because nobody notices.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 12 | `unit-tests-money-and-time-formatting` | `utils/tinyUtils.tsx` (805) — price, number, date and time formatting; `utils/startingSettings.ts` (56) | |
| 13 | `unit-tests-product-detail-data` | `serverRequests/product.tsx` (723), `utils/pagesDataRequests/ProductPageData.ts` (625) | 🔒 |
| 14 | `unit-tests-price-resolution` | `components/products/ProductCard/derivedProps.ts`, `store/Details/reducer.ts` (502) — variant selection driving the displayed price | |
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

**Phase 14** pins the precedence a shopper actually sees: root `offered_price`,
the per-country override nested under `country_offer_prices`, and the flash-deal
price. Getting this wrong shows one price on the card and charges another.

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
| 25 | `component-tests-listing-and-filters` | `components/ListingPage/` (9), `components/Listing/` (11), `components/filterPage/` (3), `components/products/ProductCard/` |

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
- **CI.** No pipeline, no coverage upload, no artifacts. `.gitlab-ci.yml` is
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
