# Test Roadmap — Full Application Coverage

**120 phases across 12 tiers.** Each phase is **one ticket** through the full
workflow (`/start-ticket` → `/research` → `/spec` → `/plan` → `/review` →
`/implement` → `/verify` → `/publish-pr`).

Tiers run in order — each depends on the harness and conventions of the tiers
before it. **Within a tier, phases are independent** and can be reordered, run in
parallel by different people, or skipped and picked up later.

Phase sizes are deliberately uneven: they follow where the code actually is, not
a fixed budget. A 2,978-line file gets three phases; six small helpers share one.

---

## Contents

| Tier | Phases | Scope |
|---|---|---|
| 0 | 1–2 | Harness, coverage, fixtures |
| 1 | 3–16 | Pure helpers — no mocks |
| 2 | 17–21 | Cookies, tokens, OTP |
| 3 | 22–26 | Fetch layer |
| 4 | 27–31 | Telemetry and push |
| 5 | 32–41 | Zustand store slices |
| 6 | 42–67 | Services |
| 7 | 68–77 | Server-side data layer |
| 8 | 78–86 | API route handlers |
| 9 | 87–88 | Middleware (`proxy.ts`) |
| 10 | 89–114 | Component tests (RTL) |
| 11 | 115–120 | End-to-end (Playwright) |

**The application surface this covers**

| Area | Files | Lines |
|---|---|---|
| `utils/` | 60 | ~10,300 |
| `services/` | 31 | ~14,300 |
| `serverRequests/` | 24 | ~4,400 |
| `store/` | 14 | ~4,700 |
| `app/api/` | 41 routes | — |
| `app/` (pages, sitemaps, special) | 62 | — |
| `components/` | 491 | — |
| `proxy.ts` | 1 | 598 |

---

## Starting point

Vitest already runs here:

- `vitest.config.mts` — jsdom, `globals: true`, `@vitejs/plugin-react`,
  `vite-tsconfig-paths` (so `store`, `utils/...`, `services/...` resolve)
- `tsconfig.json` already lists `vitest/globals` in `types`
- `utils/functions.test.ts` — a real test file, and the pattern to copy
- `tests/unitTests/init.test.tsx` — a scratch learning file (`Sum(2,3) === 5`)
- `@vitest/coverage-v8@4.1.10` — installed, not yet configured
- `/coverage/*` is already in `.gitignore`

**There is no CI.** `.gitlab-ci.yml` is dead — it runs `yarn`, `nyc`, `cypress`
and `codecov` (none of which exist) and is gated on a branch named `development`
while the branch is `develop`. Everything in this roadmap runs locally. No phase
adds a pipeline.

---

## Four rules every phase follows

**1. Where a test file goes.** Colocated by default
(`utils/orderFunnel.test.ts`), matching the existing `utils/functions.test.ts`.
**Exception:** when the module sits under a `protected_paths` glob, the test goes
in a `tests/` mirror (`tests/serverRequests/HandleAuthedFetch.test.ts`). A new
file inside `serverRequests/**` matches the protected glob and would trigger the
protected-path full stop (GU-2 / IM-5) on that ticket. Testing from outside the
glob avoids it, and no guardrail has to be weakened.

Phases marked **🔒** below touch a protected path and must use the mirror, state
it in `plan.md`, and carry the protected-path statement in `verify.md` (TR-3).

Protected globs: `proxy.ts`, `serverRequests/**`, `utils/cookies/**`,
`app/api/auth/**`, `services/auth.ts`, `services/cart.ts`, `services/order.ts`,
`services/orders.ts`, `store/index.ts`, `next.config.ts`.

**2. Coverage is scoped, never global.** With 491 component files a repo-wide
percentage is meaningless and would be pinned at `0`. `coverage.include` is an
explicit list and **each phase appends its own targets**. The number then
describes what was tested on purpose.

**3. Tests never change the code under test.** If a module resists testing, that
is a finding recorded in the ticket, not licence to refactor. A refactor is its
own ticket. (See "Never over-engineer" in the project rules.)

**4. No test performs real I/O.** No network, no Redis, no Elasticsearch, no
Firebase, no real cookie writes. Tier 0 provides the mock factories so every
later phase mocks the same way instead of inventing its own.

---

# Tier 0 — Harness (Phases 1–2)

Nothing else starts until these land.

### Phase 1 — `unit-test-harness-and-coverage`

Make coverage runnable, write the conventions down, and give `/verify` a way to
run the suite.

- `vitest.config.mts` — add `coverage`: `provider: 'v8'`, reporters `text` and
  `html`, explicit `include`, exclude type-only and test files.
- `package.json` — add `test:run` (`vitest run`) and `test:coverage`
  (`vitest run --coverage`). Leave `test` as watch mode.
- `.claude/project-config.yaml` — add a `unit-tests` check (`pnpm test:run`,
  `pass_when: exit-zero`) and a `tests-and-types` profile (`unit-tests` +
  `typecheck` + `lint`). **Every later phase names that profile in `plan.md`.**
- `docs/testing/UNIT_TESTING.md` — conventions: file placement and the
  protected-path exception, the `vi.mock` pattern, what not to test.
- Delete `tests/unitTests/init.test.tsx`.

**Acceptance criteria (draft)** — `pnpm test:coverage` exits zero and writes to
`coverage/`; the `include` list covers only tested directories; `/verify`
resolves and runs `tests-and-types`; the conventions doc states the placement
rule.

**Validation profile:** `standard-frontend` (the `unit-tests` check does not
exist yet when this phase is planned).

**Risks for `/research`** — `pnpm knip` may flag `tests/testUtils.ts` or the new
devDependency as unused once `init.test.tsx` is deleted. Confirm before the plan
commits to the delete. `.claude/project-config.yaml` is not a protected path but
is the workflow's source of truth, so the plan must name it.

### Phase 2 — `test-fixtures-and-mock-factories`

The shared kit every later phase imports. Skipping this means 118 phases each
inventing their own mocks.

- `tests/fixtures/` — builders for product, user, cart, order, address, story,
  chat message, and an Elasticsearch hit response.
- `tests/mocks/` — reusable mocks for `next/headers`, `utils/cookies/cookie-manager`,
  `utils/fetchData`, `store`, `services/localization`, `posthog-js`, `@sentry/nextjs`.
- A `mockFetch` helper that queues responses and records calls — Tier 3 onward
  depends on asserting call counts, not just return values.

**Acceptance criteria (draft)** — each fixture returns a valid object with
overridable fields; `utils/functions.test.ts` is migrated onto the shared mocks
and still passes; no fixture reaches the network.

**Validation profile:** `tests-and-types`

---

# Tier 1 — Pure helpers (Phases 3–16)

No mocks, no DOM, no network. Fast and green — this is where the habit forms.

**How to spec a phase in this tier.** Test every exported function against its
happy path plus the edges that actually occur: empty input, missing field,
`null`/`undefined`, out-of-range number, wrong type. If a module needs a mock, it
does not belong here — move it to a later tier and say so in the ticket.

| # | Ticket slug | Targets |
|---|---|---|
| 3 | `unit-tests-order-funnel` | `utils/orderFunnel.ts` (244), `utils/orderReportOptions.ts` (59) |
| 4 | `unit-tests-listing-helpers` | `utils/listing/filterItemState.ts` (179), `normalizeListingProduct.ts` (42), `searchPathRedirect.ts` (42) |
| 5 | `unit-tests-error-serialization` | `utils/errorSerialization.ts` (149) |
| 6 | `unit-tests-error-reporting` | `utils/errorReported.tsx` (122), `utils/globalErrorListeners.ts` (118), `utils/serverErrorReporter.ts` (83) |
| 7 | `unit-tests-phone-helpers` | `utils/formatPhone.ts` (77), `utils/phone.ts` (17) |
| 8 | `unit-tests-country-and-maps` | `utils/countryData.ts` (27), `utils/server/country.ts` (10), `utils/mapsConfig.ts` (20) |
| 9 | `unit-tests-sanitize-and-endpoints` | `utils/sanitizeHtml.ts` (41), `utils/endpointConfig.tsx` (37), `utils/fetch/Endpoints.ts` (13), `utils/serviceTokens.ts` (46) |
| 10 | `unit-tests-tinyutils-formatting` | `utils/tinyUtils.tsx` (805) — date, time, number and price formatting |
| 11 | `unit-tests-tinyutils-remainder` | `utils/tinyUtils.tsx` — everything else |
| 12 | `unit-tests-functions-completion` | `utils/functions.tsx` (486) — extend the existing test file to full coverage |
| 13 | `unit-tests-navigation-history` | `utils/history.ts` (109), `utils/popupHistory.ts` (49), `utils/navigationsUtils.tsx` (17) |
| 14 | `unit-tests-session-and-version` | `utils/sessionManager.ts` (70), `utils/version-manager.ts` (118), `utils/startingSettings.ts` (56) |
| 15 | `unit-tests-luck` | `utils/luck/index.ts` (108), `store/luck/reducer.ts` (97) |
| 16 | `unit-tests-request-catalog` | `utils/Requests.ts` (289), `utils/UploadUtils.ts` (14) |

**Tier notes.** Phase 8 must assert `countryData` stays `Intl`-only — it was
deliberately reduced and a regression there re-bloats the client bundle. Phase 10
must pin a fixed timezone and locale, or date assertions will pass locally and
fail elsewhere. Phase 14 covers `startingSettings.ts`, which reads
`starting-setting` from one backend and `starting_setting` from the other — the
test should cover both key shapes.

---

# Tier 2 — Cookies, tokens, OTP (Phases 17–21)

The first place a bug becomes a security problem rather than a display glitch.
Every phase here is 🔒.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 17 | `unit-tests-cookie-manager` | `utils/cookies/cookie-manager.ts` (315), `getRedeemedIds.ts` (14) | 🔒 |
| 18 | `unit-tests-token-manager` | `utils/server/tokenManager.ts` (439) | |
| 19 | `unit-tests-auth-refresh` | `utils/server/authRefresh.ts` (301) | |
| 20 | `unit-tests-otp-identity-and-locks` | `utils/server/otpIdentity.ts` (257), `utils/otpLocks.ts` (108), `utils/server/otpTelemetry.ts` (95) | |
| 21 | `unit-tests-auth-me-and-server-index` | `utils/authMe.ts` (25), `utils/server/index.tsx` (102) | |

**Tier notes.** Assert cookie names, HttpOnly, expiry and the `SameSite` options
— not just that a value round-trips. Token parsing needs a valid, an expired and
a malformed token. `MARKET-TOKEN` is the single auth cookie for guest and
logged-in alike; `DEVICE-TOKEN` is legacy and must appear only in logout-cleanup
lists — a test should lock that in. Phase 20 mocks Redis; no test may reach a
real instance.

---

# Tier 3 — Fetch layer (Phases 22–26)

The three data paths the app is built on. Phase 23 is the single highest-value
test in the repo.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 22 | `unit-tests-fetch-data` | `utils/fetchData.ts` (690) — the client `{url, method, body, server, reqTitle}` path | |
| 23 | `unit-tests-authed-fetch` | `serverRequests/HandleAuthedFetch.ts` (191) | 🔒 |
| 24 | `unit-tests-server-fetch` | `serverRequests/ServerFetch.tsx` (184), `requestDedup.ts` (32) | 🔒 |
| 25 | `unit-tests-server-helpers` | `utils/server/helpers.ts` (614) | |
| 26 | `unit-tests-server-error-plumbing` | `utils/server/mobileErrorLog.ts` (35), `serverRequests/analyticsUtility.ts` (44), `serverRequests/index.tsx` (29) | 🔒 |

**Phase 23 acceptance criteria (draft)** — a 200 passes through with the token
attached; a 401 triggers **exactly one** guest registration and **exactly one**
retry, not a loop; a 401 on the retry gives up and reports rather than recursing;
cookie writes silently no-op during pure render. Set a test timeout — untested
retry logic is exactly where an infinite loop hides.

**Phase 25 note.** `utils/server/helpers.ts` is where `translateFunction`,
`formatTime` and `ShowDayStr` live for server components. The cold async cache
leaks English if it is bypassed — a test must cover a cold-cache first call, not
just a warm one.

**Phase 26 note.** `serverRequests/index.tsx` and `analyticsUtility.ts` are not
`"use server"` and are imported by client components. A test that pulls
`next/headers` into that graph reproduces a real build failure — useful, but the
ticket must expect it.

---

# Tier 4 — Telemetry and push (Phases 27–31)

Analytics break silently. Nothing else in the codebase catches a dropped event.

| # | Ticket slug | Targets |
|---|---|---|
| 27 | `unit-tests-gtag` | `utils/gtag.ts` (264) |
| 28 | `unit-tests-ga-events` | `utils/GAEvents.ts` (192) |
| 29 | `unit-tests-posthog` | `utils/posthog.ts` (158), `utils/posthogEvents.ts` (45) |
| 30 | `unit-tests-notification-handler` | `utils/NotificationHandler.ts` (695) |
| 31 | `unit-tests-firebase-init` | `utils/firebaseInitv1.tsx` (307), `firebaseAdmin.ts` (37), `fcmTopicTracker.ts` (19), `notificationEvents.ts` (4) |

**Tier notes.** Phase 29 must assert that every event emitted in code has a
matching entry in `docs/posthog-events.md` — that doc is required to stay in sync
and a test is the only thing that will enforce it. Phase 31 mocks the Firebase
SDK entirely; no test may initialise a real app or request a real FCM token.

---

# Tier 5 — Zustand store slices (Phases 32–41)

**What this tier deliberately excludes.** `store/Cart/reducer.ts` is 676 lines
but most of it is `setX: (v) => set({ x: v })` one-liners — roughly 40 of them.
Testing a setter asserts that Zustand works, not that your code does. Each spec
here **names the functions under test** rather than the file, and says out loud
that plain setters are excluded on purpose.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 32 | `unit-tests-cart-store-addresses` | `store/Cart/reducer.ts` — `initAddressForm`, `addAddress`, `startUpdateAddress`, `updateAddress`, `setDefaultAddress` | |
| 33 | `unit-tests-cart-store-payment` | `store/Cart/reducer.ts` — coupon/discount, `setCodUser`, `setCryptoUser`, `setCreditUser`, `setWalletUser`, wallet balance | |
| 34 | `unit-tests-details-store` | `store/Details/reducer.ts` (502) | |
| 35 | `unit-tests-search-listing-store` | `store/search/reducer.ts` (261), `store/listing/reducer.ts` (68) | |
| 36 | `unit-tests-homepage-store` | `store/homepage/reducer.ts` (269), `store/homepage/actions.jsx` (80) | |
| 37 | `unit-tests-auth-store` | `store/auth/reducer.tsx` (224) | |
| 38 | `unit-tests-notifications-comments-store` | `store/notifications/reducer.ts` (129), `store/comments/reducer.ts` (61) | |
| 39 | `unit-tests-chat-store-reducer` | `store/chat/reducer.ts` (1240) | |
| 40 | `unit-tests-chat-store-actions` | `store/chat/actions.tsx` (479), `callActions.ts` (305), `chatUtils.tsx` (210) | |
| 41 | `unit-tests-store-composition` | `store/index.ts` (116) — slice spread, no key collisions, devtools only in development | 🔒 |

**Tier notes.** Build each slice in isolation rather than importing the combined
store — that keeps Phases 32–40 clear of the protected `store/index.ts`
entirely. Phase 41 is the one that touches it, and only to assert composition.

---

# Tier 6 — Services (Phases 42–67)

The largest tier: 31 files, ~14,300 lines. Services call `fetchData` and dispatch
via `useAppStore.getState()`, so every phase mocks both using the Tier 0
factories and asserts **the dispatch**, not just the return value.

## Commerce and account services

| # | Ticket slug | Targets | |
|---|---|---|---|
| 42 | `unit-tests-auth-service-session` | `services/auth.ts` (1085) — login, logout, session, guest | 🔒 |
| 43 | `unit-tests-auth-service-otp` | `services/auth.ts` — OTP send/resend/verify, error handling | 🔒 |
| 44 | `unit-tests-cart-service` | `services/cart.ts` (159) | 🔒 |
| 45 | `unit-tests-order-service-placement` | `services/order.ts` (966) — checkout and order placement | 🔒 |
| 46 | `unit-tests-order-service-lifecycle` | `services/order.ts` — status changes, cancel, return; `services/orders.ts` (84) | 🔒 |
| 47 | `unit-tests-home-service` | `services/home.ts` (866) | |
| 48 | `unit-tests-story-service` | `services/story.ts` (360) | |
| 49 | `unit-tests-chat-service` | `services/chat.ts` (325) | |
| 50 | `unit-tests-wallet-service` | `services/wallet/index.ts` (528), `types.ts` (224) | |
| 51 | `unit-tests-seller-service-products` | `services/sellerDashboard/index.ts` (1177) — product create/edit, descriptors, tax | |
| 52 | `unit-tests-seller-service-shop` | `services/sellerDashboard/index.ts` — shop info, gallery, locations, permissions | |
| 53 | `unit-tests-seller-comment-permissions` | `services/sellerDashboard/comments.ts` (64), `commentPermissions.ts` (25) | |
| 54 | `unit-tests-qr-login-service` | `services/qrLogin/index.ts` (127) | |
| 55 | `unit-tests-small-services` | `services/wishlist.ts` (82), `products.ts` (32), `search.ts` (28), `notifications.ts` (48), `localization.ts` (14) | |
| 56 | `unit-tests-rdb-service` | `services/RDB/index.ts` (14), `serverActions.ts` (18) | |

## Elasticsearch services

| # | Ticket slug | Targets |
|---|---|---|
| 57 | `unit-tests-elastic-config-and-keys` | `services/elastic/sortKeys.ts` (16), `INDEXES.ts` (10), `elasticsearch.config.ts` (28) |
| 58 | `unit-tests-elastic-helpers-query` | `services/elastic/helpers.ts` (2978) — query construction |
| 59 | `unit-tests-elastic-helpers-aggregations` | `helpers.ts` — price aggregation and filter buckets |
| 60 | `unit-tests-elastic-helpers-mapping` | `helpers.ts` — hit → product mapping, price resolution |
| 61 | `unit-tests-elastic-search-core` | `services/elastic/elasticSearch.ts` (1197) — search execution, pagination |
| 62 | `unit-tests-elastic-search-filters` | `elasticSearch.ts` — filter and sort application |
| 63 | `unit-tests-elastic-reader` | `services/elastic/elasticsearch-reader.service.ts` (1100) |
| 64 | `unit-tests-elastic-sitemap` | `services/elastic/sitemap.service.ts` (1518) |
| 65 | `unit-tests-elastic-seller-comments` | `services/elastic/sellerComments.ts` (776) |
| 66 | `unit-tests-elastic-recommendations` | `services/elastic/recommendationService.ts` (259) |
| 67 | `unit-tests-search-text-analysis` | `services/elastic/analyzeSearchText.ts` (77), `analyzeSearchTextCerebras.ts` (110) |

**Tier notes.** Phases 58–62 are the highest-value work in this tier: price
aggregation and sort keys are a known live problem (list sorts on root
`offered_price` while the card shows the country or flash price). Lock the
invariants in — `offered_price` always present, per-country override always
nested under `country_offer_prices`.

Phase 57 exists because `services/elastic/helpers.ts` imports `next/headers` and
is server-only; client components must import shared keys from `sortKeys.ts`. A
test should assert `sortKeys.ts` stays free of server imports — `tsc` passes when
it is not, but the build fails.

Phase 67 mocks the Cerebras client. The free tier is ~5 requests/minute, so a
test that calls it for real will flake.

`services/elastic/helpers.ts` at 2,978 lines is the single largest file in the
app. If `/research` on Phase 58 finds the three-way split does not follow real
seams, re-cut it in that ticket rather than forcing the boundaries above.

---

# Tier 7 — Server-side data layer (Phases 68–77)

`serverRequests/` is 🔒 as a whole, so every phase in this tier uses the `tests/`
mirror.

| # | Ticket slug | Targets |
|---|---|---|
| 68 | `unit-tests-server-product-requests` | `serverRequests/product.tsx` (723) |
| 69 | `unit-tests-server-search-requests` | `serverRequests/Search.tsx` (471) |
| 70 | `unit-tests-server-listing-requests` | `serverRequests/listing/index.tsx` (240), `products.ts` (242) |
| 71 | `unit-tests-server-home-requests` | `serverRequests/home.tsx` (214) |
| 72 | `unit-tests-server-stories-currency` | `serverRequests/stories.ts` (138), `currency.ts` (89) |
| 73 | `unit-tests-server-settings-guard` | `serverRequests/settings/index.ts` (54), `sellerShopsGuard.ts` (17) |
| 74 | `unit-tests-redis-layer` | `serverRequests/radis/index.ts` (366) |
| 75 | `unit-tests-meta-builders` | `serverRequests/meta/home.ts` (497), `meta/listing.tsx` (305), `buildAlternates.ts` (30), `constants-meta.ts` (74) |
| 76 | `unit-tests-structured-data` | `serverRequests/meta/StructuredData/` — `utils.ts` (132), `ProductStructuredData.tsx` (117), `ListingBreadcrumbList.tsx` (72), `Organaization.tsx` (47), `Website.tsx` (38) |
| 77 | `unit-tests-product-page-data` | `utils/pagesDataRequests/ProductPageData.ts` (625) |

**Tier notes.** Phase 73 must assert that `GET /shop/info` is never called without
`READ_SHOP_INFO`, and that a missing permission records `permitted: false` rather
than offering a retry. Phase 74 mocks `ioredis` — never connect. Phase 75 covers
`generateMetadata`; a `redirect()` there is inert for browsers and only fires for
bot user-agents, so a test should pin that behaviour rather than assume it
redirects. Phase 76 should validate output against the schema.org shapes.

---

# Tier 8 — API route handlers (Phases 78–86)

41 routes. Each handler takes a `Request` and returns a `Response`; `/research`
on Phase 78 settles how to construct those under jsdom, and every later phase in
the tier reuses that. This is also where `msw` may earn its place — a decision
for Phase 78's `/plan`, not an assumption baked in here.

| # | Ticket slug | Targets | |
|---|---|---|---|
| 78 | `unit-tests-api-auth-session` | `app/api/auth/` — `login`, `logout`, `refresh`, `clear-tokens` | 🔒 |
| 79 | `unit-tests-api-auth-profile` | `app/api/auth/` — `me`, `update-user`, `register-device`, `wallet-token`, `expire`, `simulate` | 🔒 |
| 80 | `unit-tests-api-proxy-otp` | `app/api/proxy/route.ts` — the hard block on `send_otp` | |
| 81 | `unit-tests-api-fcm` | `app/api/fcm/` — `analytics`, `broadcast`, `inspect`, `settings` | |
| 82 | `unit-tests-api-products` | `app/api/products/*`, `related-products/[id]`, `image-search`, `mobile/product/details/[slug]`, `mobile/product/qty/[slug]` | |
| 83 | `unit-tests-api-home-and-info` | `app/api/home/*`, `info`, `subscribe`, `unsubscribe`, `ticket` | |
| 84 | `unit-tests-api-seller` | `app/api/seller/comments*`, `speech-recognition` | |
| 85 | `unit-tests-api-revalidate-and-redis` | `revalidate`, `revalidateStories`, `clearRedis`, `internal/mobile-error-log` | |
| 86 | `unit-tests-sitemap-routes` | `app/sitemap.xml`, `sitemap-{static,search,products,home,boutiques}.xml`, `robots.ts` | |

**Tier notes.** Phase 78 must assert that logout clears **every** cookie in the
cleanup list. Phase 80 must assert `send_otp` is *blocked*, not passed through.
Across the whole tier, assert that no response body, header or error string names
the backend technology — that is a stated security rule, and a test is the only
thing that will hold the line.

---

# Tier 9 — Middleware (Phases 87–88)

`proxy.ts` (598 lines) runs on **every request**. It is 🔒, so tests go in
`tests/`.

| # | Ticket slug | Targets |
|---|---|---|
| 87 | `unit-tests-proxy-locale-routing` | Locale detection for `en`/`ar`/`tr`/`ku`, default `en`; country detection, default `gb`; the rewrite and redirect rules into `app/(client)/[lang]/` |
| 88 | `unit-tests-proxy-bot-and-cookies` | Bot detection (googlebot, facebookexternalhit, …); locale persistence in non-HttpOnly cookies; the matcher config |

**Tier notes.** `main` carries a logo page plus a proxy gate that `develop` does
not, and the gate and matcher are one revertable unit. These tests run against
`develop` behaviour; do not encode the staging gate. The gate redirect is a 307,
never a 308 — worth pinning if a test touches it.

---

# Tier 10 — Component tests (Phases 89–114)

491 files. Phase 89 is a hard prerequisite for the other 25.

### Phase 89 — `rtl-and-msw-harness`

Install `@testing-library/jest-dom`, `@testing-library/user-event` and `msw`
(none are currently installed). Add `setupFiles` to `vitest.config.mts`. Build a
`renderWithProviders` helper that mounts a component with a seeded store and a
resolved locale, so no later phase hand-rolls its own.

**Note.** Only one `<Page variant="scaled">` may ever be mounted — `AppScaler`
uses hardcoded ids and `:root` variables with no refcount. The render helper must
not mount a second one.

| # | Ticket slug | Targets |
|---|---|---|
| 90 | `component-tests-auth-enhanced` | `components/Login/Enhanced/` (22 files) |
| 91 | `component-tests-auth-session-qr` | `Login/` — `Timer`, `SessionTimer`, `SessionExpiredWidget`, `QrScannerModal`, `QrApprovalSheet`, `ConfirmMobilePhoneWidget` |
| 92 | `component-tests-add-to-cart` | `components/Cart/AddToCart/` (12 files) |
| 93 | `component-tests-cart-checkout` | `Cart/` — `PlaceOrderWidget`, `PlaceOrderButtons`, `PaymentMethod`, `ShippingAddressContainer`, `SelectRegion`, `WalletPaymentModal`, `OrderSuccess` |
| 94 | `component-tests-product-card` | `components/products/ProductCard/`, `PricingSection`, `OfferPrice` |
| 95 | `component-tests-product-detail` | `components/products/` remainder — share, views, video, try-on |
| 96 | `component-tests-home-stories` | `components/Home/Stories/` (16 files) |
| 97 | `component-tests-home-search` | `components/Home/Search/` (10 files) |
| 98 | `component-tests-home-shell` | `Home/` remainder — `NavbarClient`, `Menu`, `LandingPage`, `SettingsModal`, `UserNavTopSection`, `Init` |
| 99 | `component-tests-listing` | `components/ListingPage/` (16), `components/Listing/` (11), `components/filterPage/` (3) |
| 100 | `component-tests-server-product` | `components/Server/product/` (42 files) |
| 101 | `component-tests-server-shell` | `Server/` remainder (18), `components/ServerWrapper/` (12) |
| 102 | `component-tests-chat-conversation` | `Chat/components/` — message list, bubbles, conversation view |
| 103 | `component-tests-chat-composer` | `Chat/components/` — composer, attachments, media |
| 104 | `component-tests-chat-calls` | `Chat/components/` — Agora RTC call UI |
| 105 | `component-tests-chat-shell` | `Chat/pages/` (7), `ChatWidget`, `ChatModal`, `ChatWindowModal`, `chatsFunctions` |
| 106 | `component-tests-seller-product-edit` | `SellerDashboard/productEdit/` |
| 107 | `component-tests-seller-boutique-locations` | `SellerDashboard/boutiqueEdit/`, `locations/` |
| 108 | `component-tests-seller-dashboard-shell` | `SellerDashboard/` remainder — `ShopInfo`, `GalleryTab`, `CommentsTab`, `StoriesTab`, `ExcelUploadTab`, `orders`, `ui/` |
| 109 | `component-tests-settings-cards` | `components/settings/cards/` (12 files) |
| 110 | `component-tests-settings-profile` | `settings/` remainder — profile photo, address, countries, wallet transactions, language |
| 111 | `component-tests-setting-orders` | `components/setting/orders/` (23 files) |
| 112 | `component-tests-global` | `components/global/` (42 files) |
| 113 | `component-tests-skeletons-and-modals` | `components/skeleton/` (25), `ModalRoute/` (5), `clientWrapper/` (4) |
| 114 | `component-tests-orders-and-notifications` | `components/Orders/` (9), `Notifications/` (2), `Product/` (4), `static/` (1), root files (3) |

**Tier notes.** Assert against roles and visible text, not class names — Tailwind
breakpoints here are inverted (`xs`/`sm` = max 480px, `lg` = min 769px) and
class-based assertions will mislead.

Phase 113 should assert every `next/dynamic` import has a shape-matched loading
skeleton, never `null` or a bare `div`.

Phases 90–91 have a visual source of truth in `workspace/rdb` — compare OTP boxes
against rdb `OtpInputs`, not `PinInputs`.

React Compiler is on, so do not add `useMemo`/`useCallback` to make a component
testable.

---

# Tier 11 — End-to-end (Phases 115–120)

Real browser, real routing, no mocked network below the API boundary. These are
slow and should stay few.

| # | Ticket slug | Scope |
|---|---|---|
| 115 | `playwright-harness` | Install `@playwright/test`, config, base URL, browser matrix, local run script |
| 116 | `e2e-guest-browse-to-cart` | Guest browse → product detail → add to cart → guest token auto-registers |
| 117 | `e2e-auth-otp` | Phone entry → OTP → session established → re-verify path |
| 118 | `e2e-checkout` | Cart → address → payment method → place order → success |
| 119 | `e2e-i18n-and-rtl` | Language switch across `en`/`ar`/`tr`/`ku`; RTL layout; locale cookie persistence |
| 120 | `e2e-seller-dashboard` | Seller login → product create → edit → shop info under permission gating |

---

## Out of scope for this roadmap

- **CI.** No pipeline, no coverage upload, no artifacts. Coverage runs locally.
  `.gitlab-ci.yml` is dead, but removing it is not part of this roadmap.
- **i18n parity.** Already covered by `pnpm lint:i18n-parity` and the
  `local/translate-key-exists` ESLint rule. Do not duplicate it in tests.
- **Type-only files.** `utils/types/**`, `css.d.ts`, `global.d.ts` — nothing to
  execute.
- **Config and instrumentation.** `next.config.ts`, `sentry.*.config.ts`,
  `instrumentation*.ts`, `migration.staging.ts` — verified by the build, not by
  unit tests.
- **Refactoring for testability.** A module that resists testing produces a
  finding in its ticket, not a refactor inside it.

---

## Using this roadmap

Start at Phase 1. Do not start Tier 1 until Phases 1 and 2 are closed — they set
the conventions the other 118 phases assume.

Within a tier, pick any phase. Across tiers, go in order.

If `/research` on a phase finds the scope is wrong — a file is smaller than it
looks, a split lands mid-seam, a target is dead code — **re-cut it in that
ticket**. The line counts here are a map, not a contract.
