# Live tests — against the real staging backend

**The plan is `docs/testing/LIVE_TEST_ROADMAP.md`** — 27 phases. Everything below
still holds; the roadmap says in which order it gets done, and adds the shared
contracts and the write-safety rules that the phases share.

**Phase 1 is done: the harness is in `harness/`.** Writing a live test is now a
new file that imports it and nothing else.

```ts
import { CookieJar, hasShopperA, proxyJson, registerGuest } from "./harness";
```

| Module | What it does |
|---|---|
| `harness/globalSetup.ts` | guard, then `next build` + `next start` on `127.0.0.1:3100`, then tear down |
| `harness/guard.ts` | refuses to run unless every configured backend address is a known **staging** host |
| `harness/cookieJar.ts` | one jar = one identity; the `fetch` wrapper that resolves relative URLs and carries cookies |
| `harness/browser.ts` | the jsdom `window.location` / `localStorage` shim, for files that drive client code |
| `harness/redact.ts` | masks configured secrets, and tokens by shape |
| `harness/proxy.ts` | builds the real `x-proxy-*` headers, using the app's own service-token map |
| `harness/guest.ts` | `registerGuest(jar)` — the one approved write |
| `harness/env.ts` | reads `.env.development`; decides what is configured |

Three things worth knowing before you write the second live test:

**Every run builds.** There is no reuse-a-running-server option; the suite only
talks to a server it started itself. So an occupied port `3100` is a hard error,
not something it adopts.

**Nothing is built when nothing is configured.** With no staging addresses the
global setup returns immediately and every file skips. `pnpm test:live` on a fresh
checkout is fast and green.

**A file that drives client code needs jsdom.** Put
`/** @vitest-environment jsdom */` on its first line and call
`installBrowserShim(jar)`. A file that only addresses a route handler stays on
`node`. `utils/fetchData.ts` reads `window.location.pathname` for the locale, and
the path is `/gb-en/…` — country first, then language.

---

## What these are for

The isolated suite (`pnpm test:run`, everything else under `tests/`) answers
**"did our code break?"**. It stubs the backend, so it keeps answering that
question correctly even when staging is down.

A live test answers a different question: **"has the backend drifted away from
what our stubs assume?"** That is a contract test. It is red when staging is
down, when a deploy is mid-flight, or when someone changed a response shape —
all useful to know, none of it a reason to block a pull request.

Because they answer different questions, they never run together.

## How to run them

```bash
pnpm test:live      # this folder only
pnpm test:run       # the isolated suite only — never includes this folder
```

`pnpm test:live` is **not** part of `pnpm test:run` and **never runs on a pull
request**. If it did, every future test phase would depend on staging being up,
and a red pull-request check would stop meaning "the code broke".

It does run in CI, twice: on **push** to `develop` and `main` (after the merge,
so nothing is blocked) and **nightly**. Both report to Telegram. Only one live
run may touch staging at a time, and a live run is never cancelled mid-flight —
it would leave the rows it created behind. See
`docs/testing/LIVE_TEST_ROADMAP.md`, phase 4.

## The rules a live test follows

**1. It does not load `tests/setup.ts`.** That file starts msw with
`onUnhandledRequest: "error"`, which would block the very requests these tests
exist to make. The `live` project in `vitest.config.mts` leaves it out; do not
add it back.

**2. It reads the real addresses from the untracked `.env.development`, and
skips cleanly when they are missing.** Both point at **staging**:

| Variable | Backend |
|---|---|
| `BACKEND_URL` | the core backend |
| `GO_BACKEND_URL` | the gateway (name pending the rename to `GATEWAY_BACKEND_URL`) |

Unset means skip, not fail. Someone who has never configured staging must still
be able to run `pnpm test:live` and get a clean result.

Those two decide whether the suite runs at all, but the guard checks **every**
backend address the app resolves — wallet, stories, chat, comments, elastic, and
the fleet and admin products — because proving the front door points at staging
while the wallet points elsewhere proves nothing. The allow-list is
`ALLOWED_HOSTS` in `harness/guard.ts`, and an unknown host stops the run before
anything is built.

**3. Assertions stay loose.** Status code, the *shape* of a token field, whether
a retry happened. Never an exact response body — pinning one turns a harmless
backend addition into a red suite.

**4. Never assert, log, or snapshot a token or an OTP value.** Not in an error
message, not in a failure diff, not in a snapshot file.

**5. Writing to staging is limited to what was approved.** Creating throwaway
guest records through `/auth/register-guest` is approved. Anything that changes
data a person can see — an order, a product, a shop — is not, and needs its own
decision first.

## What comes next

`smoke.live.test.ts` proves the harness. The three targets agreed when the split
was designed are still the ones worth having first, and the roadmap now says which
phase owns each:

- **The guest-token contract, end to end** — a deliberately bad `MARKET-TOKEN` at
  an authed endpoint, and the real `401 → refresh → retry → 200` sequence. This is
  the highest-value live test there is: it is the path
  `serverRequests/HandleAuthedFetch.ts` takes, and the isolated suite can only
  prove our half of it. **Phase 3**, which also builds `withSession()` on top of
  `registerGuest()`.
- **The valid-token half**, using shopper A and the fixed OTP. **Phase 6.**
- **`starting-setting` vs `starting_setting`** — the core backend returns the
  hyphen form, the gateway the underscore form, and the app reads the underscore
  only, so a verified shopper silently gets `0` for the shipping duration and the
  decimal points. **Phase 5.**

## CI

Still to come, and it is **phase 4** — the one phase that touches
`.github/workflows/**`, a protected runtime path. The shape is decided: the live
job runs on `push` to `develop` and `main` and on a nightly schedule, never on a
`pull_request`, so a fork never needs a staging secret. It gets its own
concurrency group with `cancel-in-progress: false`, because a live run killed
halfway has already created rows it will now never clean up, and one global
`live-suite` group so two runs never share one staging shop.
