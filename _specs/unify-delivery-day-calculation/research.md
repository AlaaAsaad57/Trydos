---
ticket: unify-delivery-day-calculation
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-07-26
links:
  clickup:
  github:
---

# Research — unify-delivery-day-calculation

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Every delivery day count and expected-delivery date in the app must equal the product's
`shipping_days` **plus** the platform `shipping_duration_days`, read from the accepted
(core backend) starting-settings response shape, on the product page, product-page footer,
add-to-cart sheet and its footer, and the cart.

## Relevant directories

- `components/Server/product/` — SSR product page. `ProductExpectedDeleiveryWrapper.tsx`
  computes the delivery offset server-side from the starting-settings promise.
- `components/products/` — `ExpectedDeleiveryBanner.tsx` and `ExpectedDeleiveryModal.tsx`
  (the "Expected Shipping & Delivery" bottom sheet). The modal re-derives the sum inline
  at seven separate points.
- `components/Product/` — `ProductFooter.tsx` (server) passes the platform days down to
  `ProductFooterClient.tsx` (client) as the `shippingDays` prop, which the client forwards
  as `country_shipping_days`. The prop name is misleading: it carries the **platform**
  value, not the product's.
- `components/Server/product/ProductPrices/` — `ProductPricesWrapper.tsx` feeds both the
  product `shipping_days` and the forwarded platform value into the marquee.
- `components/Cart/AddToCart/` — `Card.tsx` (slide-up add-to-cart card, sums inline three
  times), `PropertiesMarquee.tsx` (the "Ship to you accepted <date>" badge, shared with the
  product footer), `PricesRow.tsx`, `AddToCartComponent.tsx` (supplies `shipping_days`).
- `components/Cart/` — `index.tsx` (cart list), `CartItem.tsx` (per-item shipping row),
  `OldCartContainer.tsx` (previous-cart list), `ShippingAddressContainer.tsx` (cart-level
  expected delivery; currently the only implementation that applies the documented
  multi-seller MAX rule).
- `serverRequests/` — **`protected_paths`.** `index.tsx` holds `GetStarttingSetting`, the
  single server-side reader of the starting-settings response; it is where the accepted
  shape must be honoured.
- `services/` — `home.ts` (`getClientData`) is the sole client-side fetcher; it writes the
  response into both the store and `sessionStorage["starttingSetting"]`.
- `store/homepage/` — `reducer.ts` owns the `settings` slice (`setSettings`). Note the
  combined store root `store/index.ts` **is** a protected path, but this slice file is not.
- `utils/server/` — `tokenManager.ts` holds the gateway allow-list (`GO_APIS`) and the
  user-based routing that decides which backend serves this endpoint.
- `utils/` — `tinyUtils.tsx` / `functions.tsx` supply `formatTimeForAddress`, `ShowDayStr`;
  `utils/server` supplies the server-safe `formatTime` / `ShowDayStr` variants.
- `public/translations/` — `translations.{ar,tr,ku}.js`; any new or reworded user-visible
  string must be added to all three before use.
- `components/setting/orders/` and `components/settings/cards/` — order-history and
  order-details delivery estimates. Same defect, **outside** the four surfaces named at
  intake; noted so the spec can decide explicitly whether to include them.

## Relevant config files

- `.env.development` / `.env.production` — `BACKEND_URL` (core) and `GO_BACKEND_URL`
  (gateway). Both files currently carry identical values for these two keys.
- `.claude/project-config.yaml` — `protected_paths` (read only to understand scope; not
  modified) and the `validation_checks` / `validation_profiles` definitions.
- `utils/endpointConfig.tsx` — `STARTER_SETTINGS = "/web/home/startingSettings"`.
- `utils/server/tokenManager.ts` — `GO_APIS` allow-list plus `getServerBaseUrl` /
  `getMarketFetchBase`, which together decide the serving backend per request.
- `package.json` — the available scripts (see validation commands below).
- `tsconfig.json` — path aliases (`@/*`, `services/*`, `components/*`, bare `utils/...`),
  relevant to where a shared helper can live and who may import it.
- `starting-settings-contract-diff.md` (repo root) — the recorded field-by-field backend
  contract diff produced by the pre-ticket investigation.

## Possibly affected services

- **`serverRequests/index.tsx` → `GetStarttingSetting`** — returns the inner settings
  object for SSR. **This file is under `protected_paths` (`serverRequests/**`)**, so any
  change to it must be listed explicitly in `plan.md` "Files to change" and approved at the
  review gate (GU-2 / IM-5).
- **`services/home.ts` → `getClientData`** — populates the client store and session cache.
  A shape change here propagates to every client reader at once.
- **`store/homepage/reducer.ts` → `settings` slice** — typed as `{ data: any }`, so shape
  errors are invisible to the type checker today.
- **Both backends** — the core backend serves verified users and the gateway serves guests
  for this endpoint. Gateway alignment to the accepted shape is a separate backend
  deliverable outside this repository.
- **Order history / order details** — consume the same settings value; in or out of scope
  is a spec decision.
- **Checkout payment summary** — reads a decimal-point field from the same settings object
  and is affected by the same contract divergence.

## Test / validation commands available

Listed only — none were run during research.

- `pnpm exec tsc --noEmit` — TypeScript compiles with no type errors (`typecheck` check).
- `pnpm lint` — ESLint, including the repo's i18n rule that errors on translate keys
  missing from `ar`/`tr`/`ku` (`lint` check).
- `pnpm build` — production build succeeds (`build` check).
- `pnpm lint:i18n-parity` — `node scripts/i18n-parity.mjs`, translation-file key parity.
- `pnpm knip` — no unused files/exports/dependencies introduced.
- Manual scenarios: `tester guide/expected-delivery-date.md` supplies per-surface
  expectations, including the cart MAX rule and the guest-vs-logged-in distinction.
- Defined profiles: `standard-frontend` (typecheck + lint) and `full-build`
  (typecheck + lint + build). `full-build` is the profile matching this ticket's blast
  radius, since a `protected_paths` file is in scope.

## Risks and unknowns

- **Regressing the audience that currently works — highest risk.** Guests are served by the
  gateway, which today emits the *non-accepted* shape, and guests currently see correct
  delivery dates. Switching the frontend to read the accepted shape *only* would invert the
  bug onto guests until the gateway aligns. Sequencing is therefore a correctness concern,
  not a preference.
- **A `protected_paths` file is in scope** (`serverRequests/**`). Requires explicit listing
  in the approved plan; the hard stop in `CLAUDE.md` applies.
- **Breadth of call sites.** The sum is re-derived inline at roughly fifteen points across
  the four surfaces (seven in `ExpectedDeleiveryModal.tsx` alone). Any missed site keeps the
  inconsistency the ticket exists to remove.
- **Two different access styles for the same value.** The product surfaces read the Zustand
  store; `CartItem.tsx` and `OldCartContainer.tsx` read `sessionStorage` directly and
  non-reactively. Consolidating them changes render timing on the cart, not just arithmetic.
- **Server/client shape asymmetry.** `GetStarttingSetting` returns the *inner* settings
  object, while the client store holds the *outer* envelope. A shared helper must not
  assume one of the two.
- **Import-boundary constraint.** Client components must not import `utils/server` (it
  bundles the translation payload) and `serverRequests/index.tsx` is imported by the client
  graph, so a shared helper's placement is constrained — see the notes on server-only
  modules in the repo's existing guidance.
- **Pre-existing defects adjacent to this work**, which the spec should consciously include
  or exclude: a per-item cart row whose day count evaluates to `NaN` and hides itself when
  the session cache is not yet populated; and a checkout decimal-point read that mixes one
  backend's envelope key with the other's field name and so resolves on neither.
- **Correct behaviour that must not regress.** The cart-level expected delivery already
  implements the documented multi-seller rule (max product days, platform days added once);
  a naive unification could turn it into a per-item sum.
- **i18n.** Any new or reworded user-visible copy requires keys in all three translation
  files in the same change, and `pnpm lint` enforces this.
- **React Compiler is enabled** — manual `useMemo`/`useCallback` should not be added without
  a profiled reason.

## Open questions

- Should the frontend **tolerate both response shapes** during the transition, or read the
  accepted shape only once the gateway has aligned? This determines whether the change is
  independently shippable or blocked on a backend release, and it is the single decision
  with a correctness consequence for guests.
- Should the fix be a **shared helper** consumed by all surfaces, or a minimal per-site
  correction? The ticket title says "unify", which implies the former, but the repo's
  standing guidance is the smallest change that meets the requirement.
- Where may a shared helper live so that both server components and client components can
  use it without crossing the `utils/server` import boundary?
- Are the **order history / order details** surfaces in scope? They carry the same defect
  but were not named at intake.
- Are the two adjacent defects (the `NaN` cart row, the checkout decimal-point read) in
  scope for this ticket, or separate tickets?
- Which validation profile should `plan.md` name — `full-build` is indicated by the
  protected-path involvement.
- Who owns the gateway-side alignment, and does this ticket depend on it shipping first?

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
