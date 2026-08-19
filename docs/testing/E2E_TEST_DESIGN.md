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
preflight  pnpm e2e:preflight          is this configured, and is it staging?
build      pnpm e2e:build              a failure here means the build broke
e2e        pnpm exec playwright test   a failure here means the app broke
```

All three are `tests/e2e/cli.ts`, run through `tsx`. One file with three
subcommands rather than three scripts, because they share the environment
loading and the guard, and duplicating those is how they drift apart. `pnpm build`
is not used directly: `next build` in production mode reads `.env.production` and
never `.env.development`, so the build would miss the staging values it has to
bake in.

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
    handle.ts       the running server, shared by setup and teardown
  cli.ts            preflight | build | run
  globalSetup.ts    guard, start, log in, save the session
  globalTeardown.ts stop the server, cancel any orphan order
  fixtures.ts       auto-skip when unconfigured; later, the order tracker
  selectors.ts
  actions/          nav.ts locale.ts auth.ts mock.ts — cart.ts order.ts come with ticket 2
  scenarios/        named response sets for scripted mode
  guest.live.spec.ts
  shopper.live.spec.ts     (ticket 2)
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
| `auth` | `bootAsNewGuest` `whoAmI` — `login` `attemptLogin` `logout` `resendOtp` come with ticket 2 |
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
matches English text breaks in Arabic. Journeys therefore run under `/gb-en/`,
and real locators use an attribute rather than text.

**The attribute is `data-pw`, and the app is already full of it.** The design
first assumed we would add `data-testid` to the money path. That turned out to be
unnecessary: the app carried about 800 `data-cy` attributes left from an earlier
Cypress setup, covering exactly the paths that matter — `addToCartButton`,
`Confirm-Order-Button`, `cachondelivry-cartpage`, `cart-total-price`,
`product-card`, `cart_icon_button`, `phone-number-input`. Nothing in the source
read them.

They were renamed wholesale to `data-pw`, and `playwright.config.ts` points
`getByTestId()` at it. So the money-path ticket needs close to zero new
attributes.

Two details that came out of the rename and are worth keeping written down:

- The unit suite's own files (`tests/render.test.tsx`, `tests/setup.test.tsx`)
  still use `data-testid`, because React Testing Library's `getByTestId` reads
  that name and `tests/setup.ts` does not override it. Renaming those would break
  1210 passing tests for nothing.
- Four elements carried both attributes and became duplicates. Three were the
  same name twice; one (`UserNavTopSection`) had `data-testid="login-text"` and
  `data-cy="login-icon"` on one element, and kept the `data-cy` name.

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
- **No trace is ever recorded for a live spec, and none is ever uploaded.** A
  trace archives every request header, so it is the auth token in a downloadable
  file. There is no encryption story that makes that worth publishing. Debug by
  re-running locally with `--trace on`, where nothing leaves the machine.
- **A video of every spec, and a screenshot of each failing one, are recorded and
  uploaded encrypted.** They carry no headers and no token, but they show what
  the browser showed — on the login screen that is the test identity's phone
  number. So `test-e2e.yml` packs them with
  `7z -p"$E2E_ARTIFACT_PASSPHRASE" -mhe=on` before upload. `-mhe=on` encrypts the
  file names too; without it the archive listing publishes the failing spec
  names. The artifact is `e2e-session`, kept 3 days, and the Telegram message
  links to it.
- **The passphrase is a repository secret, `E2E_ARTIFACT_PASSPHRASE`.** With the
  secret unset nothing is packed and nothing is uploaded, which is the right
  default for a fork.
- **Scripted specs may upload traces.** No real session, no real secrets.
- The saved `storageState` is gitignored and never uploaded.

## 12. CI

`.github/workflows/**` is a protected runtime path. Changing it needs an approved
`plan.md` that names the file.

| File | Runs on | Runs |
|---|---|---|
| `tests.yml` *(unchanged)* | `pull_request` + `push` → `develop`, `main` | parity, lint, types, unit |
| `test-e2e.yml` *(new)* | `push` → `develop`, `main`; nightly; dispatch | preflight, build, browser journeys |

**The e2e job is its own workflow file, not a job in `tests.yml`.** The design
first put it in `tests.yml`. That is wrong, and the reason is worth stating
because it is easy to get back to: `tests.yml` sets `cancel-in-progress: true` at
the **workflow** level, which cancels the entire run — every job in it — as soon
as another push lands on the same branch. A job-level concurrency group cannot
opt out of that. A browser run killed mid-checkout may already have created a
real order and would never reach the teardown that cancels it.

Never on `pull_request`. A fork therefore never runs it and never needs a staging
secret.

**Two concurrency rules, neither optional:**

1. **Never cancelled.** `cancel-in-progress: false`. A queued run is cheap; an
   orphaned order is not.
2. **Only one run may touch staging at a time.** The push run and the nightly
   share one global `live-suite` group. Two runs in the same staging shop break
   each other for reasons that look exactly like product bugs.

**The environment is one secret, `E2E_ENV_FILE`, holding the whole
`.env.development`.** Named secrets were the first plan; the build needs every
`NEXT_PUBLIC_` value baked in, not just the backend addresses, so that list would
silently break the build each time the app read a new one. The trade-off — a blob
is harder to audit and rotate than named secrets — is accepted because the file
already exists in exactly this form on every developer machine, so CI and local
runs cannot drift. No secret means no file, which means preflight reports "not
configured" and the run is green and empty.

Chromium is installed with a cached `~/.cache/ms-playwright`. Results are
reported through the existing `notify-telegram.yml`.

**What the Telegram message says.** A red run has to be readable without opening
GitHub, so the message carries the counts (`e2e 4 passed · 1 failed`) and up to
four failing tests, each with its full title and the reason it failed — the
opening line of the error plus any `Expected` / `Received` / `Timeout` line that
followed it. `cli.ts report` builds this from the JSON reporter's
`e2e-results.json`; console output cannot be scraped reliably.

Two constraints shape it. **Everything goes through `redact()`** — a Playwright
failure message carries whatever the assertion saw, and the step that builds the
text runs in a public log. And the list is capped at four, because Telegram
rejects anything over 4096 characters; the run link covers the rest.

`notify-telegram.yml` previously showed the counts only on a *passing* run, so a
red message never said how many had passed. It shows them on both now, which
improves the unit-test message too.

A full run is roughly 15 to 25 minutes: install, build, browser, journey. That is
fine nightly and after a merge, and is another reason it never gates a pull
request.

## 13. What gets deleted

Almost all of it is uncommitted working-tree work, so almost nothing is lost from
history. The two exceptions are tracked and are removed by the implementing
commit: `tests/live/README.md` and `docs/testing/LIVE_TEST_ROADMAP.md`.

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
  allow-list, the run stops in preflight — before anything is built and before
  any server starts.
- **AC-3** `pnpm test:e2e` builds the app, starts it on `127.0.0.1:3100`, runs
  the specs, and leaves no process holding the port.
- **AC-4** `guest.live.spec.ts` proves: `/` redirects to a country-and-language
  path, the home page renders without throwing, search returns results, a
  listing reaches a product page, and the cart drawer opens.
  *(Not "no console error": third-party scripts on staging log errors that say
  nothing about our code, and a test that fails on those teaches everyone to
  ignore it. An uncaught exception — `pageerror` — is the signal worth failing
  on, and that is what the spec asserts.)*
- **AC-5** `shopper.live.spec.ts` proves, against real staging: log in, add to cart,
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

## 16. Findings carried over

These came out of the research for the roadmap this document replaces. They are
about the app, not about the deleted plan, so they are kept here rather than lost
with it. Full text is in git history.

1. **`POST /api/auth/simulate` is not gated.** It writes any auth cookie —
   including `MARKET-TOKEN` — from an unauthenticated request body, in every
   environment, with no origin check. Needs its own security ticket. Also in
   section 15, because it is the one finding this work must actively avoid using.

2. **OTP rate limiting will fight the suite.** Redis-backed cooldowns are real on
   staging. This is why the session is created once per run, and why the
   rate-limited branch is a scripted scenario rather than a live one.

3. **`x-market-backend` makes routing free to assert.** The response says which
   backend served it. Useful to a future spec; nothing uses it yet.

4. **Login fans out to five backends and writes about ten cookies.** A partial
   failure is invisible today — a shopper can be logged in to the storefront but
   not to chat. Worth a spec once the money path lands.

5. **Chat realtime is Firebase Realtime Database, not sockets.** Anything
   asserting live chat has to account for that.

6. **A test must not import a server module in-process.** `serverRequests/radis`
   opens a Redis connection, and the modules reaching it are server-side. Driving
   the app over HTTP — which is all this suite does — keeps that in the server
   process, which is exactly what production does. A spec that finds itself
   wanting a direct import is reaching for a unit test.

7. **`starting-setting` versus `starting_setting`.** The core backend uses the
   hyphen, the gateway the underscore, and the app reads the underscore only.
   Verified shoppers silently get `0` for the shipping duration and the decimal
   points. Still unfixed; a journey through checkout may well surface it.

8. **The listing price-sort mismatch is real and unfixed.** The sort key is the
   root `offered_price` while the card shows the country or flash price. Needs a
   backend indexed effective-price field.

**New, found by the first run of this suite:**

9. **Changing country has a race window between the cookie and the navigation.**

   `changeCountry` (`components/settings/PersonalInfoCountries.tsx:66`) sets the
   country cookie **first**, then awaits a starter-settings round trip to
   staging, and only then assigns `window.location.href`. For as long as that
   request takes, the cookie already says the new country while the page still
   lists the old one's products. Clicking a card in that window sends an
   old-country slug to a server that now resolves it against the new country, so
   it answers `productNotFound` and redirects to `?message=product_not_found`.

   **Impact is low.** A person cannot click faster than the round trip, and the
   owner confirmed the flow works normally on the deployed site. An automated
   test hits it every time, which is how it was found.

   **This is not an app bug to fix; it is a wait the test owes.**
   `chooseRegionIfAsked` waits for the URL to carry the chosen country before it
   returns. An earlier version called `page.reload()` instead — that also made
   the suite pass, and it was the wrong fix for the wrong diagnosis (I had
   assumed stale rendered content). Recorded because the wrong version was
   plausible and someone will reach for it again.

   *Correction, worth reading if you saw the first version of this note:* the
   redirect comes from the **server** (`products/[productId]/page.tsx:75`), not
   from stale client state, and both country-change paths do a hard navigation.
   Neither fact fits a caching explanation.

10. **The app cannot detect a country over loopback**, so every local and CI run
    lands on `?no-country=true` and gets the region popup. Not a bug — there is
    no geo header to read — but it is why no journey may assume `/gb-en`, and why
    dealing with the popup is part of `gotoHome` rather than a special case.
