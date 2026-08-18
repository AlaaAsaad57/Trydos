# End-to-end tests — design

**Replaces `LIVE_TEST_ROADMAP.md`.** That roadmap planned 27 phases of API-level
integration tests against staging. We do not want those. We want a browser
driving the real app. This document is the design for that, and the roadmap is
deleted when this is implemented.

**Status:** designed, not built. The build needs a `/wf:` ticket, because the CI
part touches `.github/workflows/**`, which `CLAUDE.md` protects.

---

## 1. Why this exists

The unit suite (`pnpm test:run`) answers **"did our code break?"**. It stubs the
network, so it keeps answering correctly even when staging is down.

These tests answer a different question: **"does a real person still get through
the real app?"** A browser loads the built app, clicks, types, and buys. Nothing
is simulated. If the backend changed shape, if a component fails to hydrate, if
a translation is missing, if the cart drawer no longer opens — this is what
catches it, and none of it is visible to a test that only calls an endpoint.

Because it depends on staging being up, it is **never** a pull request gate. A
red pull request check must always mean "the code broke".

## 2. In scope

- A real browser (Chromium) against a real `next build` + `next start`.
- Real staging, for every backend the app talks to.
- The money path: browse, log in, add to cart, place an order, cancel it.
- Branches staging cannot produce on demand — signup, wrong OTP, rate limit,
  server error — driven by intercepting the calls the browser makes.
- A reusable action layer, so a spec reads like the journey and never repeats a
  locator.

## 3. Out of scope

- **Pull request gating.** See section 12.
- **Production. Ever.** No flag, no exception.
- **Other browsers.** Chromium only. Add one when a real bug demands it.
- **Visual regression.** Different tool, different problem.
- **Real payment settlement.** Cash on delivery only.
- **Seller dashboard, chat, stories, live video.** Later tickets.
- **A hermetic mode that needs no staging.** Possible later by pointing the
  backend addresses at a local stub, but not now. See section 6.

## 4. How a run works

Three steps, kept separate so a red step means one thing:

```
preflight  node tests/e2e/preflight.mjs   is this configured, and is it staging?
build      pnpm build                     a failure here means the build broke
e2e        pnpm exec playwright test      a failure here means the app broke
```

Locally `pnpm test:e2e` runs all three in order. On CI they are three steps, so
the slow half can be cached and a broken build never looks like a failed test.

**Preflight must come before the build, not inside Playwright.** The build takes
minutes. Discovering after it that the machine has no staging addresses, or that
one of them points somewhere it should not, wastes all of that time and — worse —
means the guard ran late. Preflight loads `.env.development` (`harness/env.ts`)
and runs `assertStagingTarget()` (`harness/guard.ts`), then exits with one of:

- **not configured** — exit 0 with a "skipping" message. The build and the e2e
  step are skipped. Someone who has configured nothing gets a clean, fast
  `pnpm test:e2e` and nothing is built.
- **a host that is not staging** — exit non-zero. Nothing is built, nothing
  starts. **This is not optional and no spec may bypass it.**
- **all good** — exit 0, and the build proceeds.

Playwright's `globalSetup` then:

1. Re-runs the guard. Cheap, and it means the guard holds even if someone runs
   `playwright test` directly instead of through the script.
2. Starts the built server on `127.0.0.1:3100` (`harness/server.ts`) and waits
   until it answers.
3. Logs in once, and saves the session (section 9).

`globalTeardown` stops the whole process tree — `taskkill` on Windows, a signal
elsewhere — then runs the orphan net (section 10).

An already-occupied port 3100 is a hard error. The suite only ever talks to a
server it started itself, so it will not adopt one it did not build.

## 5. The layers

Each layer may only use the one below it.

```
spec          shopper.spec.ts        reads like the journey. No locators, no URLs.
actions/      auth cart order nav    business verbs. Assert their own success.
selectors.ts                         every locator, written exactly once
harness/      guard env server redact
```

On disk:

```
tests/e2e/
  harness/
    guard.ts        refuses to run against anything but staging
    env.ts          reads .env.development, decides what is configured
    server.ts       next start, wait until answering, kill the tree
    redact.ts       masks secrets in anything we print
  globalSetup.ts    guard, start, log in, save the session
  globalTeardown.ts stop the server, cancel any orphan order
  fixtures.ts       the session fixture and the order tracker
  selectors.ts
  actions/          auth.ts cart.ts order.ts nav.ts
  scenarios/        named response sets for scripted mode
  guest.spec.ts
  shopper.spec.ts
playwright.config.ts
```

`harness/` is moved from `tests/live/harness/` almost unchanged. Those four
modules are not integration-test machinery; they are "drive a real staging
server without doing damage" machinery, and a browser needs them more.

## 6. Two modes

Same server, same actions, same selectors. Only the network differs.

| | **live** (default) | **scripted** |
|---|---|---|
| Backend | real staging | real staging, named responses faked |
| Proves | the contract still holds | the UI handles a branch correctly |
| Covers | the money path | signup, wrong OTP, 429, 500, out of stock |
| Writes | real orders, real teardown | nothing |
| Traces | off | allowed |

**How scripted mode works.** Every client-side call to a backend goes through one
endpoint: `utils/fetchData.ts` posts to `/api/proxy` and names the real target in
the `x-proxy-url` header. So one interception point sees all of it, and we choose
what to fake by looking at that header. Calls to `/api/auth/*` are same-origin
routes and are intercepted the same way.

**The limit, stated plainly.** `page.route()` runs in the browser. It cannot see
a request the Node process made before the HTML arrived — anything through
`serverRequests/HandleAuthedFetch.ts`, which is the first paint of the home page,
the listing and the product page. So:

- We can script any branch a **click** drives. That is all of auth, cart and
  checkout, because those services all go through `fetchData`.
- We cannot script the **first render**.

This is why scripted mode still cannot gate a pull request: the page must render
before the first click, and that render needs staging. Making it independent
means pointing the backend addresses at a local stub in the server's environment.
That is a different mechanism and a later ticket.

## 7. The action layer

The point of this layer: **write the way of doing a thing once**. A spec that
wants a logged-in shopper with two items in the cart says so in two lines and
never learns what a selector is.

**Rules.**

1. An action takes `page` first, then one options object. Never positional
   booleans. `login(page, true, false)` is unreadable a month later.
2. An action asserts its own success. A spec does not repeat "expect the button
   to be visible" after every click.
3. An action returns what the spec needs, so nothing reads the DOM twice.
4. An action never takes a raw selector as an argument. That would leak locators
   back into specs, which is the thing this layer exists to stop.
5. Negative cases are a separate function that **returns an outcome**, not a flag
   on the happy one.

**Rule 5, concretely.** `attemptLogin` returns what happened. `login` is
`attemptLogin` plus a throw. One implementation, two readings:

```ts
// happy path — throws unless it succeeds
await login(page, { as: 'shopperA' })

// negative — the spec asserts the outcome
const result = await attemptLogin(page, { as: 'shopperA', otp: 'wrong' })
expect(result.outcome).toBe('wrong-otp')
```

**Starting set.** Built because a spec needs them, not written up front.

| Module | Functions |
|---|---|
| `auth` | `login` `attemptLogin` `logout` `resendOtp` |
| `cart` | `addToCart` `setQuantity` `removeFromCart` `openCart` |
| `order` | `placeOrder` `cancelOrder` `expectOrderVisible` |
| `nav` | `gotoHome` `search` `gotoProduct` |

Cases each grows into later, when a spec asks: cart gains variants, flash deals,
out of stock, and the guest-cart merge on login. Order gains wallet, a
multi-seller split, and changing the address. Auth gains the signup branch, rate
limiting, and QR login.

**What a spec then looks like:**

```ts
test('a shopper buys, then cancels', async ({ shopperPage: page, track }) => {
  await gotoProduct(page, { pick: 'first-in-stock' })
  await addToCart(page, { quantity: 2 })
  const order = await placeOrder(page, { payment: 'cod' })
  track(order)
  await expectOrderVisible(page, order, { status: 'pending' })
  await cancelOrder(page, order)
  await expectOrderVisible(page, order, { status: 'cancelled' })
})
```

**Scripted specs use the same actions:**

```ts
test('a new phone is taken through signup', async ({ page }) => {
  await mockBackend(page, scenarios.signup.newPhone)
  await attemptLogin(page, { phone: ANY_PHONE, otp: TEST_OTP })
  await expectScreen(page, 'input-name')
})
```

`mockBackend` is keyed by the real backend path and passes through anything it is
not told about:

```ts
await mockBackend(page, {
  '/auth/check-phone': { status: 200, body: { exists: false } },
  '/auth/verify':      { status: 429, body: { message: 'too many' } },
})
```

## 8. Selectors

Every locator lives in `selectors.ts`. When copy changes you fix one line, not
thirty specs.

The app renders in four languages through `translateFunction`, so a locator that
matches English text breaks in Arabic. Two decisions follow:

- Journeys run under `/gb-en/`, so role and name locators work.
- `data-testid` is added to the money path, where the text is dynamic or
  ambiguous: `PlaceOrderWidget`, `PlaceOrderButtons`, `CheckoutButton`, the
  `EnterPinScreen` boxes, and the order rows under `settings/orders`.

The repository has three `data-testid` attributes today, so this is new. It edits
application components, not only tests. Keep it to the money path.

## 9. Identities and the session

Identities come from the untracked `.env.development`, and the same names arrive
on CI as repository secrets. **Unset means skip, never fail.**

Both shopper accounts accept one fixed code, `TEST_ACCOUNT_OTP`. The real code
arrives over WhatsApp, which shows it only on the primary handset, so no
unattended run can read one. The fixed code is a staging control and must stay on
staging.

**One login per run.** `globalSetup` drives the real login form once and saves
Playwright's `storageState`. Authenticated specs load it. The rule is enforced by
the architecture, not by everyone remembering it — which matters, because the OTP
send is rate limited for real.

The saved state contains `MARKET-TOKEN`. It is written to a gitignored path and
is never uploaded anywhere.

**Signup is a scripted case, not a live one.** The fixed code is allow-listed to
specific numbers, so a genuinely new number cannot be verified unattended. The
signup screens are covered in scripted mode instead. If the backend ever provides
a pool of disposable allow-listed numbers, a live signup spec becomes possible;
until then it does not exist.

## 10. Write safety

Live mode creates real orders in a real staging shop. Four rules.

**1. Retries are off.** Playwright's usual CI setting is `retries: 2`. A checkout
that flakes at the last step and retries twice leaves three orders. `retries: 0`,
set in the config, so it cannot be forgotten per spec.

**2. Everything created is tagged.** Each run generates `LIVETEST-<8 hex>` once
and writes it into a note field of anything it creates.

**3. Everything created is registered the moment its id is known** — not after
the assertions. A failed assertion must still clean up.

**4. Cancellation goes through the UI**, like a user. The spec navigates to the
order and clicks cancel, which also proves that flow works.

**The net for rule 4.** If a spec dies before it cancels, teardown cancels the
registered ids directly through `/customer/order/cancel` with the saved session.
It only fires when the UI path did not. This exists because teardown through the
UI depends on the UI, and the run where the UI is broken is exactly the run where
an order is left behind.

Cancelled orders still exist as rows. Staging accumulates cancelled test orders
over time. That is accepted, and it is why they carry the marker.

## 11. Secrets, logs and artifacts

**This repository is public, so every CI log is world-readable.** A phone number
or a token in a failure message is published, not merely untidy.

- `redact()` masks tokens, phone numbers, OTP codes, emails and passwords in
  anything printed.
- **Live specs upload nothing.** No trace, no video, no screenshot. A trace
  archives every request header, which is the auth token in a downloadable file.
  A screenshot of a failed login shows the phone number. Debug by re-running
  locally with `--trace on`, where nothing leaves the machine.
- **Scripted specs may upload traces.** No real session, no real secrets.
- The saved `storageState` is gitignored and never uploaded.

## 12. CI

`.github/workflows/**` is a protected runtime path. Changing it needs an approved
`plan.md` that names the file.

| Runs on | Runs |
|---|---|
| `pull_request` → `develop`, `main` | parity, lint, types, unit — unchanged |
| `push` → `develop`, `main` | the above, then build and e2e, after the merge |
| nightly `schedule` + `workflow_dispatch` | build and e2e |

The e2e job is gated on the event being a push or a schedule, never a pull
request. A fork therefore never runs it and never needs a staging secret.

**Two concurrency rules, neither optional:**

1. **The e2e job must never be cancelled.** `tests.yml` today sets
   `cancel-in-progress: true`. A run killed mid-checkout has already created an
   order and will never reach teardown. The e2e job gets its own group with
   `cancel-in-progress: false`.
2. **Only one e2e run may touch staging at a time.** The push job and the nightly
   share one global `live-suite` group. Two runs in the same staging shop break
   each other for reasons that look exactly like product bugs.

Chromium is installed with a cached `~/.cache/ms-playwright`. Results are
reported through the existing `notify-telegram.yml`.

A full run is roughly 15 to 25 minutes: install, build, browser, journey. That is
fine nightly and after a merge, and is another reason it never gates a pull
request.

## 13. What gets deleted

All of it is uncommitted working-tree work, so nothing is lost from history.

| Deleted | Why |
|---|---|
| `tests/live/harness/cookieJar.ts` | a real browser has real cookies |
| `tests/live/harness/browser.ts` | a jsdom shim for `window.location`, pointless with a browser |
| `tests/live/harness/proxy.ts` | hand-built `x-proxy-*` headers for calling APIs directly |
| `tests/live/harness/guest.ts` | the browser gets a guest token by loading the page |
| `tests/live/smoke.live.test.ts` | tests the machinery being removed |
| the `live` project in `vitest.config.mts` | replaced by `playwright.config.ts` |
| the `test:live` script | replaced by `test:e2e` |
| `docs/testing/LIVE_TEST_ROADMAP.md` | replaced by this document |
| `tests/live/README.md` | replaced by a short `tests/e2e/README.md` |

Kept and moved to `tests/e2e/harness/`: `guard.ts`, `env.ts`, `server.ts`,
`redact.ts`.

## 14. Acceptance criteria

- **AC-1** `pnpm test:e2e` on a machine with no staging addresses configured
  finishes green, builds nothing, and starts no server.
- **AC-2** With any backend address set to a host that is not on the staging
  allow-list, the run stops before the server starts.
- **AC-3** `pnpm test:e2e` builds the app, starts it on `127.0.0.1:3100`, runs
  the specs, and leaves no process holding the port.
- **AC-4** `guest.spec.ts` proves: `/` redirects to `/gb-en/`, the home page
  renders with no console error, search reaches a listing, a listing reaches a
  product page, and the cart drawer opens.
- **AC-5** `shopper.spec.ts` proves, against real staging: log in, add to cart,
  place a cash-on-delivery order, see it under `settings/orders`, cancel it
  through the UI, and see it as cancelled.
- **AC-6** The order created by AC-5 carries the run marker, and is cancelled
  even when the spec fails after the order is created.
- **AC-7** A scripted spec reaches the signup name screen using a faked
  `/auth/check-phone` response, and writes nothing to staging.
- **AC-8** Login happens exactly once per run. Running both spec files does not
  send a second OTP.
- **AC-9** No spec, action or helper prints a token, an OTP, a phone number, an
  email or a password. `redact()` covers all of them.
- **AC-10** The CI e2e job does not run on `pull_request`, cannot be cancelled in
  flight, and shares one global concurrency group with the nightly run.
- **AC-11** No artifact from a live spec is uploaded by CI.
- **AC-12** A spec file contains no CSS selector, no `data-testid` string and no
  hardcoded URL. All three live in `selectors.ts` or the actions.

## 15. Dependencies and open items

- **Repository secrets.** Every backend address, plus `TEST_ACCOUNT_PHONE` and
  `TEST_ACCOUNT_OTP`. Telegram is already configured.
- **`data-testid` on money-path components.** Application code, agreed, kept
  small.
- **A disposable-number pool** would unlock a live signup spec. Backend ask.
  Until then signup is scripted only.
- **A hermetic mode** that stubs the server side too, and could gate a pull
  request. Later ticket, only if wanted.
- **Unrelated, found while designing this and worth its own ticket:**
  `app/api/auth/simulate/route.ts` takes a `marketToken` from a POST body and
  sets it as an HttpOnly auth cookie. It is commented as debug-only, and I found
  no environment gate on it. On production that is session fixation. These tests
  must not use it either, since it would skip the login flow we want proven.
