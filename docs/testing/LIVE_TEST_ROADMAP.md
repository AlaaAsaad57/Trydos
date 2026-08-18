# Live Test Roadmap — the real app against the real staging backend

**27 phases across 6 journeys.** Each phase is **one ticket** through the full
workflow (`/wf:start-ticket` → `/wf:research` → `/wf:spec` → `/wf:plan` →
`/wf:review` → `/wf:implement` → `/wf:verify` → `/wf:publish-pr`).

Every test in this roadmap lives under `tests/live/` and runs with
`pnpm test:live`. Nothing here ever runs in `pnpm test:run`, and nothing here
ever gates a pull request. See `tests/live/README.md` for why the two suites are
kept apart.

This roadmap is the companion to `UNIT_TEST_ROADMAP.md`, not a copy of it. They
answer different questions:

| Suite | Question it answers | Red means |
|---|---|---|
| unit (`tests/`) | Did **our code** break? | a developer broke something |
| live (`tests/live/`) | Does the **whole thing** still work end to end? | our code, the backend, or the wiring between them broke |

A live test is allowed — expected, even — to find a **backend** bug. That is one
of the reasons it exists. When it does, the ticket records a finding and opens a
backend ticket. It does not work around it in the test.

---

## Contents

| # | Journey | Phases | Why it ranks here |
|---|---|---|---|
| 0 | Harness | 1–4 | No live test can be written without it |
| 1 | Identity | 5–8 | Every other journey needs a working session |
| 2 | Browse and find | 9–13 | Read-only, safe, and it exercises the harness under load |
| 3 | Buy | 14–19 | Money. The first journey that writes real rows |
| 4 | Communicate | 20–23 | Chat and notifications; needs two live sessions |
| 5 | Publish | 24–27 | Stories, settings, and the seller side |

Journeys run in order. **Within a journey, phases run in the order listed.**
Journey 0 blocks everything. Journey 1 blocks everything after it.

---

## Starting point

What exists today, before phase 1:

- `vitest.config.mts` — a `live` project already exists. It is `node`
  environment, includes `tests/live/**/*.live.test.ts`, and deliberately does
  **not** load `tests/setup.ts` (that file starts msw with
  `onUnhandledRequest: "error"`, which would block every real request).
- `pnpm test:live` — `vitest run --project live --passWithNoTests`.
- `tests/live/README.md` — the rules the split was designed under. Still true.
  This roadmap is what it was waiting for.
- `tests/fixtures/`, `tests/mocks/`, `tests/msw/`, `tests/render.tsx` — built by
  the unit roadmap. Phase 2 below makes some of them shared.
- `.env.development` and `.env.production` — both untracked, and **both already
  point at staging** (`trydos_develop.ramaaz.dev`, `trydosv2.ramaaz.dev`,
  `trydo_story.ramaaz.dev`, `trydoschatnest.ramaaz.dev`,
  `trydos_comments_develop.ramaaz.dev`, `trydos_wallet_develop.ramaaz.dev`).

That last point is convenient and **must not be trusted**. On Vercel the
production environment holds the real addresses. Phase 1 adds a guard that
refuses to run when it cannot prove the target is staging.

---

## How a live test reaches the backend

The suite starts a **real Next server** and drives the **real client code**
against it. Nothing about the request path is simulated except the browser.

```
vitest globalSetup
  └─ next build && next start  →  http://127.0.0.1:3100

a test file
  └─ imports the real service:  services/cart.ts → addToCart()
       └─ utils/fetchData.ts builds the real x-proxy-* headers
            └─ fetch("/api/proxy")  ← resolved against 127.0.0.1:3100
                 └─ real proxy.ts → real route handler → real token injection
                      └─ https://trydosv2.ramaaz.dev   ← REAL staging
```

So a phase proves **"adding to the cart works"**, not "the endpoint answers".
The store dispatch, the request dedup, the read-retry, the 401 recovery — all of
it is the real code.

Three things the harness has to supply, because Node will not:

**1. A cookie jar.** `utils/fetchData.ts` sends `credentials: "include"`, which
does nothing in Node. The harness wraps `fetch`: it attaches `Cookie:` from a jar
before the call and reads `Headers.getSetCookie()` back into the jar after it.
**One jar is one identity.** Two jars is two users, which is what the chat phases
need.

**2. A browser shim.** `fetchData` reads `window.location.pathname` to work out
the locale (the path is `/gb-en/...` — country first, then language), and it uses
`localStorage`. Live test files that drive client code carry
`/** @vitest-environment jsdom */` at the top, and the harness sets the URL.
Files that only talk to a route handler stay on `node`.

**3. A target guard.** Before any test that writes, the harness reads the
resolved backend addresses from the running server and refuses to continue
unless they are the known staging hosts. An unknown host is a hard stop, not a
warning.

### Why not the alternatives

- **Calling the backends directly** would be simpler, but it proves nothing about
  `/api/proxy`, the token injection, the refresh flow, or our service code — which
  is where integration bugs actually live.
- **Importing route handlers in-process** avoids the build, but it needs a
  hand-maintained path→module map and it silently skips `proxy.ts`.
- **Playwright** is still out of scope, as it is in the unit roadmap.

---

## Identities and secrets

Four identities are available on staging, spread over five roles, and all of
them are read from the untracked `.env.development`. **Unset means skip, never
fail** — someone who has configured none of them must still get a clean
`pnpm test:live`.

**No value appears in this file.** This repository is public, so the roadmap
names variables and never the numbers, addresses or passwords behind them.

| Variables | Identity | Unlocks |
|---|---|---|
| `TEST_ACCOUNT_PHONE` + `TEST_ACCOUNT_OTP` | shopper A — **and the seller** | everything from phase 6 on, plus the whole seller side |
| `TEST_ACCOUNT_PHONE_2` | shopper B | chat between two people, contact lists, buying from A's shop |
| `FLEET_BASE_URL` + `FLEET_EMAIL` + `FLEET_PASSWORD` | delivery worker | delivered and returned steps |
| `ADMIN_DASHBOARD_BASE_URL` + `_EMAIL` + `_PASSWORD` | admin | report status |

Three things about this differ from the roadmap's first draft, and each one
changes a phase.

**Shopper A is also the seller.** One account holds both roles, so there is no
separate seller variable and phases 26 and 27 run on shopper A's session. Phase
19 still needs a buyer and a seller on opposite sides of one order, so **shopper
B places it and shopper A confirms it as the seller**. An account may not be
allowed to buy from its own shop, and the phase must not be built on the hope
that it is.

**Fleet and admin are separate projects with email-and-password logins.** They
are not storefront identities: no phone, no OTP, none of our client code and none
of our cookies. So `withSession()` (phase 3) covers shopper A and shopper B
**only**, and fleet and admin are driven as **external tools** — their own base
addresses, their own login, their own helper — so no assertion can imply the
storefront was tested when a different product was. This settles the question the
first draft left open for phase 19: the admin shape is an email and a password,
not a long-lived token. The admin login sits on the core backend host under
`/admin/auth/login`; the fleet has a host of its own.

**The fleet host is a seventh staging address.** The six the storefront uses are
listed under **Starting point**; the fleet is not one of them. The phase 1 target
guard has to allow it explicitly or every fleet call in phase 19 is a hard stop.

### The OTP for test accounts

Both shopper accounts accept one fixed code, read from `TEST_ACCOUNT_OTP`. It is
the code for every storefront identity, and the seller needs no separate one
because it is the same account as shopper A.

**Why a fixed code and not a real one.** The OTP now arrives over WhatsApp, and
WhatsApp shows a one-time code **only on the primary phone**. A linked device —
WhatsApp Web, WhatsApp Desktop, or any library that links itself as one — is
refused by design and sees a placeholder instead of the digits. So no unattended
test can read a real code unless a phone sits somewhere and forwards it. The
fixed code removes that whole dependency: the send still happens for real
against the real backend, and only the six digits come from the environment
instead of from a message.

**The fixed path is a staging control, and it must stay on staging.**
`security-check/remediation-plan.md` B2 tracks that work — an env flag, an
allow-list holding exactly these numbers, and a build that fails if the path is
reachable in production. If B2 is ever closed by removing the fixed code instead
of gating it, every phase from 6 on loses its login and this section has to be
rewritten first.

**Nothing in this table is ever printed at run time.** Not in an assertion
message, not in a failure diff, not in a snapshot, not in a log line. Phase 1
adds a helper that redacts them, and every later phase uses it.

That helper is a security control, not housekeeping: **this repository is
public, so every CI run log is world-readable.** A phone number or a password
reaching a failure message is published, not merely untidy. `redact()` therefore
covers tokens, phone numbers and OTP codes **and email addresses and passwords** —
the last two are live values only because fleet and admin log in that way, which
the first draft of this roadmap did not anticipate.

---

## Nine rules every live phase follows

**1. Auth is the harness's job, not the test's.** A phase asks for
`withSession("shopperA")` and gets a jar that is already logged in and that
survives a `401`. A `401` may only fail a test that is *about* `401`s. This is
the "auth and refresh from day one" requirement, and it is built in phase 3 so
that every phase from 5 onwards inherits it.

**2. Assertions stay loose — assert the contract, not the body.** A phase
asserts the status code, the shape (through the shared zod contract), and the one
or two values it actually cares about. Pinning a whole response body turns a
harmless backend addition into a red suite.

**3. Never log a secret.** Tokens, OTPs, phone numbers and admin credentials
never reach the output.

**4. Everything you create, you tag and you delete.** Every writable resource
carries the run marker `LIVETEST-<8 hex>` in a name or note field, and is
registered for teardown the moment it is created. Phase 4 builds this.

**5. Never point the suite at production.** The guard from phase 1 is not
optional and no phase may bypass it.

**6. A live failure is a finding, not a fix.** If staging is wrong, the ticket
records it and a backend ticket is opened. The test is not softened to pass, and
app code is not changed to work around it. If the app is wrong, that is its own
ticket too — a live phase writes tests, not fixes.

**7. Live never gates a pull request.** It runs **after** a merge (on push to
`develop` and `main`) and **nightly**, never on a `pull_request`. A red pull
request check must always mean "the code broke", never "staging is down", and a
pull request from a fork must keep running without staging secrets.

**8. Reads may retry, writes never.** This mirrors what `fetchData` already
does. A retried write is a duplicated order.

**9. One login per identity per run.** OTP is rate limited for real (see finding
2). Sessions are created once in the harness and shared by every file.

**Validation profile:** every phase names `logic-change` in `plan.md` — lint,
typecheck and the unit tests. (This line used to say `tests-and-types`, which is
not a profile this project defines; the profiles in
`.claude/project-config.yaml` are `ui-change`, `logic-change` and `full`, and
naming one that does not exist makes `/wf:plan` abort on VP-1.)

Phases marked **🔒** touch a protected runtime path (`.github/workflows/**`) and
must say so in `plan.md` and carry the protected-path statement in `verify.md`.

---

## Shared helpers — one contract, two suites

The point of this layer is that the work is done once. Everything below lives
under `tests/`, and **no app code imports any of it**.

```
tests/contracts/*.ts        zod schemas, every object .passthrough()
   ├─ unit suite:  CartLine.parse(buildCartLine())        is our fixture honest?
   └─ live suite:  CartLine.parse(staging.data.items[0])  has staging drifted?
```

A backend that **adds** a field breaks nothing, because every object is
`.passthrough()`. A backend that **renames or drops** one reds the live suite —
and because the unit fixtures are validated against the same schema, the same
failure tells you exactly which fixtures are now lying and which unit tests are
passing against a shape that no longer exists.

| Module | The unit suite uses it to… | The live suite uses it to… |
|---|---|---|
| `tests/contracts/` | prove a fixture matches reality | prove reality matches the fixture |
| `tests/catalog/endpoints.ts` — path, method, service, guest-allow-listed | name msw handlers | know what to call and which backend must answer |
| `tests/fixtures/` *(exists)* | build test data | build **request bodies** for real writes |
| `tests/journeys/` — ordered steps, transport-agnostic | run against msw | run against staging |

`zod` is added as a **devDependency** in phase 2. Do not add a `packageManager`
field to `package.json` while you are in there — Vercel runs yarn, and pinning
pnpm there breaks the deploy.

---

# Journey 0 — Harness (Phases 1–4)

Nothing in journeys 1–5 can start before these four are closed.

| # | Ticket slug | Builds | |
|---|---|---|---|
| 1 | `live-harness-server-and-session` | `tests/live/harness/` — server boot, cookie jar, browser shim, target guard, secret redaction; the `live` project settings in `vitest.config.mts` | |
| 2 | `live-shared-contracts` | `tests/contracts/`, `tests/catalog/endpoints.ts`; `zod` devDependency; fixture-validates-contract test in the **unit** suite | |
| 3 | `live-auth-and-refresh-spine` | `withSession()`, forced-expiry helper, the refresh assertions | |
| 4 | `live-write-safety-and-cleanup` | run marker, teardown registry, orphan sweeper, `.github/workflows/test-live.yml` | 🔒 |

### Phase 1 — `live-harness-server-and-session`

**What it builds.** `globalSetup` runs `next build` then `next start` on
`127.0.0.1:3100`, waits for the server to answer, and tears it down at the end.

**Every run builds. There is no reuse-an-existing-server escape hatch.** An
earlier draft had one (`LIVE_BASE_URL`), to avoid paying for a build while
iterating; it is cut on purpose. The build cost is accepted, so the suite only
ever runs against a server this harness started and configured, and there is one
less way to point it somewhere unintended. A phase that genuinely needs to test a
deployed address should add that knob then, with its own guard.

The server is started with the staging addresses passed **explicitly** in its
environment. Do not rely on `next start` picking up the right `.env` file: it
runs in production mode, and on a real deployment `.env.production` holds real
addresses.

**Also in phase 1.**

- The cookie jar and the `fetch` wrapper described above.
- The jsdom docblock convention and the `window.location` / `localStorage` shim.
- The target guard.
- `redact()` — every assertion message and every log line goes through it.
- Live project settings: `globalSetup`, a raised `testTimeout` (a real request is
  not a 5 ms one), a raised `hookTimeout` for the build, and
  **`fileParallelism: false`**. Files share staging data and share OTP limits;
  running them at once makes failures meaningless.

**Acceptance criteria (draft).** With the environment unset, `pnpm test:live`
passes and reports skipped. With it set, one smoke test registers a guest,
calls `/customer/info`, gets `200`, and reads `x-market-backend: gateway` off the
proxy response. No secret appears anywhere in the output.

### Phase 2 — `live-shared-contracts`

Start with the objects the later phases all need: the response envelope, user,
cart, cart line, address, order, order detail, product, story, chat channel, chat
message, shop.

The unit-suite half matters as much as the live half. Extend
`tests/fixtures/fixtures.test.ts` so every builder is parsed by its contract. A
fixture that cannot parse its own contract is a bug in the fixture, found for
free.

`tests/catalog/endpoints.ts` is seeded from `utils/endpointConfig.tsx`, from the
service files, and from the guest allow-list in `AUTH-TESTING-NOTES.md`. Mark
which entries came from that document — phase 5 checks whether it is still true.

### Phase 3 — `live-auth-and-refresh-spine`

This is the "day one" requirement, and it is a harness capability before it is a
test subject.

`withSession(identity)` returns a jar that has logged in once for the whole run
and that recovers from a `401` by itself. Every phase from 5 onwards uses it, so
a `401` can only ever fail a test that is deliberately about `401`s.

Forcing an expiry needs no waiting: `POST /api/auth/simulate` writes any auth
cookie from the request body, so the harness can plant a corrupt `MARKET-TOKEN`
and keep a good refresh cookie. That is precisely the manual DevTools recipe in
`AUTH-TESTING-NOTES.md`, done from a test. (It is also a security finding — see
finding 1.)

**Assertions (draft), all from `AUTH-TESTING-NOTES.md` section 3.**

- Corrupt token, good refresh cookie → one `401`, then the request succeeds, and
  **both** cookie values changed. Never just one.
- Ten parallel `401`s produce **one** refresh exchange, not ten. The refresh
  token is single-use.
- A failed refresh does **not** delete the refresh cookie. Only teardown does.
- A verified shopper is **never** silently turned into a guest.
- A guest with both cookies corrupt is silently re-registered and browsing
  continues.
- No response body ever carries a token or a refresh token.

### Phase 4 — `live-write-safety-and-cleanup` 🔒

Every phase from 14 onwards writes real rows into staging. This phase is what
makes that safe.

- A run marker, `LIVETEST-<8 hex>`, generated once per run and written into a
  name or note field of everything created.
- `track(resource)` — register a created thing for teardown at the moment it is
  created, not after the assertions. A failed assertion must still clean up.
- `tests/live/sweep.live.test.ts` — finds anything still carrying a `LIVETEST-`
  marker older than 24 hours and **reports** it. It does not delete: a sweeper
  that deletes is a sweeper that one day deletes the wrong thing.

**The CI half of phase 4.** Three workflow files, and the rules that keep them
from fighting each other.

| File | Runs on | Runs |
|---|---|---|
| `tests.yml` *(exists)* | `pull_request` → `develop`, `main` | parity, lint, types, unit |
| `tests.yml` *(new job)* | `push` → `develop`, `main` | the above **plus live**, after the merge |
| `test-live.yml` *(new)* | nightly `schedule` + `workflow_dispatch` | unit **and** live |
| `notify-telegram.yml` *(new)* | `workflow_call` | one message, called by both |

The live job is gated on `github.event_name == 'push'`, so a pull request — and
therefore a fork — never runs it and never needs a staging secret.

**Two concurrency rules, and neither is optional:**

1. **The live job must never be cancelled.** `tests.yml` today sets
   `cancel-in-progress: true`. A live run killed halfway has already created an
   order or a product and will never reach its teardown. The live job gets its
   own group with `cancel-in-progress: false`.
2. **Only one live run may touch staging at a time.** The live job in
   `tests.yml` and the nightly in `test-live.yml` share **one** global
   concurrency group (`live-suite`). Two merges in quick succession would
   otherwise put two runs in the same staging shop, and each would break the
   other's assertions for reasons that look like bugs.

### The Telegram message

Sent by a `workflow_call` job, so the bot token is handled in one file and not
three. The step exits `0` when `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` is
unset: not configured is not a failure, the same rule the suite itself follows.
Secrets are `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, already created.

**A failure says what broke, on what, and where to look.**

```
❌ Trydos — Tests · push
develop · a1b2c3d — "fix(cart): keep the coupon on qty change"

failed: unit tests   (parity ✅  lint ✅  types ✅  live ⏭️)
  • Cart reducer › removes a line
  • Cart reducer › keeps the coupon
  … and 3 more

open the run →
```

Four things, in this order: **which step failed**, the state of the other steps
so a single break is not read as a total collapse, **the first few failing test
names**, and the run link. The names are the part that turns "something is red"
into "I know what to look at from my phone", so they are worth the extra step:
vitest writes a machine-readable report (`--reporter=json --outputFile=…`) and
the notify job pulls the first three or four names out of it with `jq`.

**A success reports coverage as numbers.**

```
✅ Trydos — Tests · push
develop · a1b2c3d

unit 752 passed · live 128 passed
coverage — lines 34.2%  stmts 33.8%  funcs 29.1%  branches 41.5%

open the run →
```

Two changes make that possible, and both belong to this phase:

1. **`vitest.config.mts` gains the `json-summary` coverage reporter.** Today
   `coverage.reporter` is `['text-summary', 'html']` — neither can be read by a
   script. Adding `json-summary` writes `coverage/coverage-summary.json`, whose
   `total` block holds the four percentages, and it changes nothing about the
   console output or the HTML report.
2. **CI runs `pnpm test:coverage`, not `pnpm test:run`.** It is the same suite
   with instrumentation, so it is slower — acceptable on push and nightly, and
   the pull-request gate is left alone.

**The percentages will look low, and that is on purpose.** `coverage.include`
names whole folders, so every file the app ships is counted and an untested file
shows as 0%. The number is the honest share, not the share of files somebody has
already tested. Do not "fix" it by narrowing the include list.

Coverage comes from the **unit** suite only. The live suite drives a built
server, so it produces no meaningful coverage — the message says
`unit … · live …` for test counts, and coverage is unlabelled because there is
only one source for it.

**When it sends.** Every completed run, so a green message doubles as proof the
pipeline itself is still alive. This widens the earlier "failures plus the first
success after a failure" decision, because coverage that arrives only after a
failure is coverage nobody reads. If the channel turns out too noisy, the
recovery-only rule is one condition in the notify job: read the previous run's
conclusion from the Actions API (`actions: read`) rather than from a cache — a
cache is branch-scoped and is evicted after seven quiet days, which is exactly
when the memory would be wanted.

Put the sweeper under `tests/live/`, not under `scripts/`. `scripts/*` is
ignored wholesale by `.gitignore`, so a new file there is silently never
committed until someone adds a `!scripts/<file>` exception.

---

# Journey 1 — Identity (Phases 5–8)

A guest arrives, gets a token without noticing, enters a phone number, receives
an OTP, becomes a verified shopper, and stays that way. Every later journey
depends on all of it.

| # | Ticket slug | Covers |
|---|---|---|
| 5 | `live-guest-and-backend-routing` | `/auth/register-guest`; the guest allow-list walked end to end; `x-market-backend` drift report; `starting-setting` vs `starting_setting` |
| 6 | `live-otp-send-and-verify` | `sendOtpAction`, the Redis cooldown, `/api/auth/login` verify, every refusal case |
| 7 | `live-login-fanout-and-merge` | the five-backend login, all cookies minted, guest cart survives verification |
| 8 | `live-logout-and-expire` | `/api/auth/expire`, `/api/auth/logout`, `/api/auth/clear-tokens`, `/api/auth/me`, the logout guard |

**Phase 5** is the cheapest high-value phase in the roadmap. Every proxied
storefront request comes back with `x-market-backend: gateway | core`, which is
the backend's own answer about which one served it. Walk the whole guest
allow-list as a guest, then again as a verified shopper, and assert:

- every allow-listed path answers `gateway` for a guest;
- every one of them answers `core` for a verified shopper;
- nothing unlisted answers `gateway`.

Where the header and `AUTH-TESTING-NOTES.md` disagree, **the header is right and
the document is out of date** — the phase records the drift and updates the
document. The list changes as endpoints migrate between backends, so this test
is a standing early-warning.

Same phase, second target: the core backend returns `starting-setting` with a
hyphen and the gateway returns `starting_setting` with an underscore, and the app
reads the underscore form only. So a verified shopper silently gets `0` for
`shipping_duration_days` and for the decimal-point count. Assert **both**
spellings against both backends and record what the app does with each. Only a
live test can see this.

**Phase 6.** OTP is rate limited for real. `send_otp` is blocked at `/api/proxy`
with `403` and only runs through the `sendOtpAction` server action, behind a
Redis cooldown (`OTP_COOLDOWN_SECONDS`, `OTP_SESSION_MAX`, `OTP_IP_MAX`,
`OTP_WINDOW_SECONDS`). A phase that logs in freely will lock the suite out of its
own accounts. Log in once per identity per run and cache it — that is rule 9, and
this is the phase that proves the limiter works rather than fighting it.

The send is real; only the code is fixed. The verify step reads
`TEST_ACCOUNT_OTP` (see **The OTP for test accounts** above), so nothing has to
read a WhatsApp message and the `is_via_whatsapp` flag only changes how the
backend is asked to deliver — both values are still worth sending, because both
buttons exist in `SelectMethodScreen.tsx` and a user can press either.

**What this phase does NOT have to prove any more.** The *wrapper* around the
counter script — fail-open when the store is missing or fails, the refusal
names, the lock-time fallback, and the four limits read from configuration — is
covered by unit tests (`tests/serverRequests/radis/index.test.ts`, ticket
`unit-tests-otp-send-and-limiter`). The same ticket covers the send action's own
decisions. **The script itself is still this phase's job**, and only this phase
can do it: its counting, its fixed windows, and its behaviour when two callers
arrive at once all need a real store. Do not re-prove the wrapper here, and do
not read the unit tests as evidence that the limiter works end to end.

Cover the refusals as well as the happy path: wrong code, unknown
`verificationId`, a second send inside the cooldown, the WhatsApp flag, and
resend. Assert `403` on a direct `/api/proxy` attempt at `send_otp` — that block
is the only thing stopping the proxy being used as an open relay to the OTP
endpoint.

**Phase 7.** `/api/auth/login` fans out to **five** backends — core, chat,
stories, comments and wallet — and writes about **ten** cookies. Today a partial
failure is invisible: the user is logged in, and one of the four sub-services
quietly is not. Assert that every cookie is minted: `MARKET-TOKEN` and its
refresh, `CHAT-TOKEN` and its refresh, `STORIES-TOKEN` and its refresh,
`WALLET-TOKEN`, `USER_ID_HASH`, `User-Data`, `User-Chat`, `User-Stories`,
`Wallet-User`. Also assert `already_exists` behaves for a known account, and that
a guest cart built before verification is still there afterwards.

**Phase 8.** Logout must clear **every** cookie in the cleanup list, including
the legacy `DEVICE-TOKEN`, which may appear nowhere else. The logout guard must
hold for its full window: a `401` arriving just after a logout must not create a
new session. `/api/auth/expire` must make one last-chance refresh attempt before
tearing down.

---

# Journey 2 — Browse and find (Phases 9–13)

Read-only, so it is safe to run often, and it puts the harness under real load
before journey 3 starts writing.

| # | Ticket slug | Covers |
|---|---|---|
| 9 | `live-homepage-payloads` | `/api/home/boutiques`, `/api/home/mainCategories`, `/api/products/featured`, flash deals, general stories, `/mobile/home/currency`, `/web/home/startingSettings`, home meta; infinite scroll paging |
| 10 | `live-search-and-filters` | `services/elastic/` against the real index; text, brand, category, boutique, colour, size; sort keys; filter buckets; pagination and the PIT; `/api/products/popular-search`, `/api/products/searchInCatalog`, `/api/image-search` |
| 11 | `live-product-page` | `/web/product/globalDetails/<slug>`, `qtyPriceDetails`, `product-meta`, `/api/related-products/[id]`; ratings, FQA comments, likes, translate, notify-me, checklist, compare, delivery statistics |
| 12 | `live-boutique-page` | boutique detail, banners, in-boutique search, filters and sort, the AI colour/size analysis |
| 13 | `live-locale-and-navigation` | `proxy.ts` over real HTTP: four languages by country, defaults, redirect vs rewrite, bot user agents, cookie persistence, `robots.txt`, sitemaps |

**Phase 9** should assert the home payloads are not merely `200` but **not
empty** — an empty featured list is a valid response and a broken home page. The
cache-life environment variables (`HOME_*_CACHE_LIFE`) mean a second call may not
reach the backend at all; the phase states which calls it expects to be cached
and asserts the cached answer is still contract-valid.

**Phase 10** carries the known live defect. The listing sorts on the root
`offered_price` while the card shows the per-country or flash-deal price, so
"cheapest first" is not cheapest first. Elasticsearch sorting and pagination were
already proved correct — the fix needs an indexed effective-price field from the
backend. **This phase pins the current behaviour and records the finding.** It
does not fix it, and it does not skip it.

Two invariants to assert against the real index while you are there:
`offered_price` is always present, and a per-country override is **always**
nested under `country_offer_prices`, never flat only.

The AI search analyser (phase 10 or 12, wherever it lands) runs on Cerebras and
the free tier is about five requests a minute. Mocking that one call is
explicitly allowed; mocking the search around it is not.

**Phase 11** is the widest single phase in the journey. Split it in `/research`
if the read side (details, ratings, delivery statistics) and the write side (FQA
comment create/update/delete, likes, checklist, notify-me) do not fit one honest
ticket. The write side is the first place a phase creates data — it tags and
cleans up under the phase 4 rules.

**Phase 13** drives real URLs through the running server. Assert against
`develop` behaviour: `main` carries a staging gate and a logo page that `develop`
does not, and the gate and matcher are one revertable unit. Do not encode the
gate. Also note that a `redirect()` in `generateMetadata` is inert for browsers —
if a phase asserts a redirect, assert it against the page, not the metadata.

---

# Journey 3 — Buy (Phases 14–19)

The first journey that writes. Every phase from here obeys phase 4's tagging and
teardown rules without exception.

| # | Ticket slug | Covers |
|---|---|---|
| 14 | `live-cart` | `/cart/add`, `/cart/update`, `/cart/remove`, `/cart/cart_shipping`, `/cart/cart_overview`, `/cart/convert_to_old`, `/old-cart/get_old_cart`, `/old-cart/hide` |
| 15 | `live-addresses` | `/customer/address/list|add|update|delete|set-default`, `/api/addresses/get-provinces-by-iso` |
| 16 | `live-checkout-pricing` | coupon apply / remove / invalid, COD, wallet balance and `/customer/wallet/list`, credit and crypto flags, shipping cost, decimal points |
| 17 | `live-place-order` | `/customer/order/checkout`, `/customer/order/checkout/${payment_method}`, `/customer/order/list`, `/customer/order/getOrdersByOrderGroupID` |
| 18 | `live-order-edit` | `/customer/order/change-item-variant`, `change-address`, `cancel-item`, `cancel`, `${order_id}/visibility`, `detail/${detail_id}/visibility`, `getHiddenOrders` |
| 19 | `live-order-lifecycle-across-roles` | seller confirms and packs, fleet delivers, admin changes report status, shopper returns / reports / rates |

**Phase 14 is the "from multiple screens" phase.** The same product is added from
the product page, from a listing card, from a boutique page, from a story and
from the compare tray, and the resulting cart must be identical every time. That
is the bug this phase is looking for: five entry points, one of which sends a
different body. Assert the cart line, not just the `200`.

Also in phase 14: the difference between `cart_shipping` and `cart_overview` —
they are two reads of the same cart and a phase should say which is authoritative
for what. And `convert_to_old` plus the old-cart pair, which is the flow nobody
remembers until it breaks.

Cart is on the guest allow-list, so run phase 14 **twice** — once as a guest
against the gateway and once as a verified shopper against the core backend — and
assert the two carts behave the same. This is where a backend-shape difference
would show up.

**Phase 16** is where mocking is allowed and should be stated out loud. Shipping
cost depends on a live rate lookup and payment settlement is not something a test
may complete. Mock those two, and nothing else. The coupon, the totals and the
decimal-point count all come from the real backend. Note that
`shipping_duration_days` and the decimal-point count are exactly the values the
`starting-setting` spelling problem breaks (phase 5), so a wrong number here has a
known suspect.

**Phase 17** asserts the **outgoing payload** as much as the response: the exact
body sent to place an order, with the address, the payment method and the applied
coupon. Then it asserts the order really exists, by reading it back through
`getOrdersByOrderGroupID`. Every order created is cancelled in teardown.

**Phase 19 is the phase that could not exist without all four identities, and it
is the one most likely to find a real bug.** One order walks the whole system:

1. **shopper B** places it (phase 17's helper) — B buys, because the seller is
   shopper A and an account may not be able to buy from its own shop;
2. **shopper A**, wearing the seller role, moves it with
   `/shop/orders/details/status/confirmed` then
   `/shop/orders/details/status/packed` — no admin needed for this part;
3. the **fleet** identity takes it to delivered;
4. the shopper opens a return request:
   `/customer/order/return_request_products/store`, `update`,
   `remove_image`, `cancel`, `/customer/order/return_requests/store`,
   `reasons`, `order_details`, `order_details_by_group`,
   `confirm_return_request`, `bulk_cancel`;
5. the shopper files `/customer/order/report` — with a photo, which the API
   changelog says must be `FormData` and without one, which may stay JSON;
6. the **admin** moves the report with
   `PATCH /api/dashboard_v1/order-reports/{id}/status` through `new`,
   `in_review`, `resolved`, and a `403` is asserted for an admin without
   `UPDATE_ORDER_REPORTS`;
7. the shopper rates the order.

The admin authentication shape is now known — an email and a password against
the core backend host, under `/admin/auth/login` — so this phase no longer opens
with that unknown. What `/research` must still settle is the **API** shape behind
that login page: which call exchanges the credentials for a usable token, and
whether `/api/dashboard_v1/…` accepts it as a bearer token or expects a cookie.
The same question applies to the fleet. Both are separate products, so the answer
is read from their responses, not from this repository.

---

# Journey 4 — Communicate (Phases 20–23)

Chat needs two live sessions at once, which is why it comes after the harness is
proven under journeys 2 and 3.

| # | Ticket slug | Covers |
|---|---|---|
| 20 | `live-chat-basics` | `/api/v1/users/my_contacts`, the channel list, `/api/v1/messages/messages_of_channel/${id}` with paging, sending a text message, `${channel}/received` and `${channel}/watched`, `/api/v1/channels/get_date_time` |
| 21 | `live-chat-message-actions` | `/api/v1/messages/share_product`, reply, forward, pin, mute, `/api/v1/messages/destroy`, delete a chat, the contact card, and every message type |
| 22 | `live-chat-realtime-and-calls` | receiving a message, the delivery-worker chat, `/api/v1/channels/my_calls` |
| 23 | `live-notifications` | `/user-notifications/get` with infinite scroll, `/web/notification_types`, `customer-notification-to-choose`, the `firebase_device_tokens` family, the `/api/fcm/*` routes |

**Phase 20** is the first phase that holds two jars at once: shopper A and
shopper B. Everything after it in this journey depends on that pair.

**Phase 21** covers the message types by sending one of each and reading it back:
text, image, video, audio, file, shared product, contact. Reply is asserted
against each type, because "reply to an image" and "reply to a text" are
different payloads. Uploads go to the media server, so this phase needs
`NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` and `NEXT_PUBLIC_MEDIA_API_KEY`, and every
uploaded file is tracked for teardown.

**Phase 22 is the hard one and the roadmap says so.** Receiving a message is not
a REST call: chat is realtime through the **Firebase Realtime Database**
(`firebase/database`'s `onValue`), not a socket. There are two honest options and
`/research` picks one:

- **REST assertion** — B sends, A polls `messages_of_channel` until it appears.
  Cheap, proves the message really arrived, does not prove the live push worked.
- **Real subscription** — A subscribes through the Firebase client and waits for
  the event. Proves the whole thing, and drags the Firebase client, its
  credentials and a timeout policy into the suite.

Start with the REST assertion and record the gap. Agora RTC video calling is out
of scope (see below); `/api/v1/channels/my_calls` is a REST list and is in.

---

# Journey 5 — Publish (Phases 24–27)

| # | Ticket slug | Covers |
|---|---|---|
| 24 | `live-stories` | `/api/v1/stories/users_stories`, `product_stories/${id}`, `increase_viewers`, `add_story`, `delete_story`, `report`; a story that carries a link; ordering and moving between stories; `/api/revalidateStories` |
| 25 | `live-settings-and-profile` | `/customer/update-profile`, `/customer/update-name`, `/customer/approve-policies`, profile image upload, sizes, `/web/get-colors-and-sizes`, language and country change |
| 26 | `live-seller-shop` | `/shop/info`, `/shop/auth/permissions`, `/shop/users`, `/shop/locations`, `/shop/boutiques`, `/languages`, leaving a shop |
| 27 | `live-seller-products-and-comments` | `/shop/products` and its lookups, images, descriptors, status; `/shop/excel/*`; seller stories; `/api/seller/comments` and replies |

**Phase 24.** Adding a story is a media upload followed by a create call, so it
needs the media server and it must delete the story afterwards. A story with a
link, and a story attached to a product, are separate cases — assert both. Report
is a write against someone else's story; use one the suite created, never a real
seller's.

**Phase 25.** Changing language and country changes the locale cookies, which
changes the URL the shim uses, which changes what every later call sends. Assert
the round trip and put the session back the way it was in teardown.

**Phase 26.** `GET /shop/info` must **never** be called without the
`READ_SHOP_INFO` permission — the loader takes a `canReadShopInfo` flag and
records `permitted: false` instead. Assert both branches: with the permission,
and with it withheld. A widget that lacks the permission must say the permission
is missing, not offer a retry.

Confirm in `/research` that a "leave a shop" endpoint actually exists. It is in
the request, but it did not appear in the current service file, so it may be a
gap rather than a feature.

**Phase 27.** The code-verified shop-product body contract is the authority for
what the product payload looks like — it beats any conflicting comment or tracked
document. Descriptors are **value per descriptor** (`string_choice` is
single-select, numeric is an input, and `options` arrives as a JSON string). The
save payload is not wired yet because the backend key is unknown: this phase pins
what the code sends today and records the gap; it does not invent a key.

Two known backend defects belong here as recorded findings, not as fixes:
`custom_data.similar_words` returns `500` on **create** only (the backend skips
the array cast on insert; update is fine), and boutique banners are folded into
`custom_data` per language because there is no dedicated field.

---

## Findings already recorded

These came out of the research for this roadmap. They are true today and each one
shapes a phase.

**1. `POST /api/auth/simulate` is not gated.** It writes any auth cookie —
including `MARKET-TOKEN` — from an unauthenticated request body, in every
environment, with no origin check. It is exactly the tool phase 3 needs to forge
an expired session, and it is a session-fixation risk that needs **its own
security ticket**. This roadmap uses it; it does not bless it.

**2. OTP will rate limit the suite against itself.** Redis-backed cooldowns are
real on staging. One login per identity per run, cached in the harness.

**3. `x-market-backend` makes routing free to assert**, and the guest allow-list
in `AUTH-TESTING-NOTES.md` may already be out of date. Phase 5 reports the drift.

**4. Login fans out to five backends and writes about ten cookies.** A partial
failure is invisible today. Phase 7 makes it visible.

**5. Chat realtime is Firebase Realtime Database, not sockets.** Phase 22 starts
with a REST assertion and records what that does not prove.

**6. ~~The store imports `ioredis`~~ — wrong, and phase 1 settled it.** The claim
was that `store/index.ts` opens a Redis connection when it loads. It does not:
`store/index.ts` imports its slice reducers and `zustand`, nothing else. The only
module that imports `ioredis` is `serverRequests/radis/index.ts`, and it is reached
from server modules — `serverActions/sendOtp.ts`, a few `serverRequests/*`, three
page components and the `/api/fcm/*` and `/api/clearRedis` routes.

So the risk is real but much narrower than written, and the harness's design
removes it: a live test drives the app **over HTTP**, so Redis is opened by the
server process, which is exactly what production does and what phase 6 needs in
order to test the OTP limiter at all. The test process itself imports no server
module and opens no connection. Nothing is stubbed, because there is nothing to
stub.

The rule that follows: **a live test must not import a server module in-process.**
If a phase ever finds it has to, it inherits this problem and must say so — and it
is a sign the phase is reaching for a unit test.

**7. `starting-setting` versus `starting_setting`.** The core backend uses the
hyphen, the gateway uses the underscore, and the app reads the underscore only.
Verified shoppers silently get `0` for the shipping duration and the decimal
points. Phase 5 pins it, phase 16 shows what it costs.

**8. The listing price-sort mismatch is real and unfixed.** Phase 10 pins the
current behaviour. The fix needs a backend indexed effective-price field.

**9. Both env files point at staging today, and both are untracked.** That is
convenient and it is not a guarantee. The phase 1 guard is what makes it a rule.

---

## Out of scope for this roadmap

Cut on purpose. Not "later phases" — no numbers, no schedule. If one becomes
critical it gets its own ticket outside this roadmap.

- **Browser end-to-end (Playwright).** Nothing installed, nothing planned. These
  phases drive real code against a real server without a browser; a browser suite
  is a separate decision, the same as in the unit roadmap.
- **React rendering.** Components are covered by the unit suite's RTL harness.
  A live test drives services and routes, never a rendered tree.
- **Real payment settlement.** No live phase completes a payment against a real
  processor. COD and wallet are in; settlement is not.
- **Agora RTC video and voice calls.** The call *list* is in scope; establishing
  a real call is not.
- **Push notification delivery to a device.** The FCM registration and settings
  endpoints are in scope (phase 23); whether a phone buzzes is not.
- **Load, performance and rate-limit probing.** Vercel Firewall rules are not
  exercised on purpose, and a live suite must not look like an attack.
- **Production.** Never, under any flag, for any phase.
- **The mobile app and the admin dashboard as products.** The admin API is called
  in phase 19 as a *tool* to move an order. Testing the dashboard itself belongs
  to its own repository.
- **i18n parity.** Covered by `pnpm lint:i18n-parity` and the
  `local/translate-key-exists` ESLint rule. Do not duplicate it here.
- **Fixing anything.** A live phase writes tests. Every defect it finds — ours or
  the backend's — becomes a separate ticket.

---

## Using this roadmap

Start at phase 1. Journey 0 blocks everything; journey 1 blocks everything after
it. Inside a journey, phases run in the order listed.

Each phase is expected to **dig deeper than this page does**. The endpoint lists
here are a map, not a contract: `/research` on a phase re-cuts the scope when it
finds the split lands mid-seam, an endpoint is dead, or one phase is honestly two.
Write the finding in that ticket.

A phase that turns up a real defect — and several are expected to — records it,
pins the current behaviour in the test, and opens a separate ticket for the fix.
