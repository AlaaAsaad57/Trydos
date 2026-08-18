# Browser tests — against the real staging backend

**The design is `docs/testing/E2E_TEST_DESIGN.md`.** This file is how to run
them and how to add one.

A browser drives a real `next build` + `next start` against the real staging
backends. Nothing is simulated.

## Run them

```bash
pnpm test:e2e             # preflight, build, then every spec
pnpm test:e2e:live        # only the real-staging specs
pnpm test:e2e:scripted    # only the specs with faked backend answers
pnpm e2e:preflight        # just "is this configured, and is it staging?"
pnpm e2e:report           # open the last local HTML report
```

CI runs one more command, `tsx tests/e2e/cli.ts report`. It reads the JSON
reporter's `e2e-results.json` and produces the two lines the Telegram message
needs — the counts, and up to four failing tests with the reason each failed.
Everything it emits goes through `redact()` first.

First time on a machine:

```bash
pnpm exec playwright install chromium
```

**Every run builds**, because the suite only ever talks to a server it built and
started itself. An occupied port 3100 is a hard error, not something it adopts.

**Nothing is built when nothing is configured.** With no staging addresses,
preflight exits straight away and every spec skips. `pnpm test:e2e` on a fresh
checkout is fast and green.

## The two kinds of spec

| File name | Backend | Records artifacts |
|---|---|---|
| `*.live.spec.ts` | real staging | **nothing** |
| `*.scripted.spec.ts` | real staging, named answers faked | traces and video on failure |

The artifact split is a security rule, not a preference. **This repository is
public, so anything CI uploads is world-readable.** A Playwright trace archives
every request header, which is the auth token; a screenshot of a failed login
shows the phone number. Debug a live failure locally instead:

```bash
pnpm test:e2e -- --trace on
```

## Writing one

A spec should read like the journey. It never names an element, never builds a
URL, and never waits.

```ts
import { expect, test } from "./fixtures";
import { gotoHome, gotoFirstProduct } from "./actions/nav";

test("a listing leads to a product page", async ({ page }) => {
  await gotoHome(page);
  const opened = await gotoFirstProduct(page);
  expect(opened.url).toContain("/products/");
});
```

Where things go:

| Need | Put it in |
|---|---|
| a locator | `selectors.ts` — never in a spec |
| a thing a user does | `actions/` |
| a faked backend answer | `scenarios/` |
| starting a server, secrets, the target guard | `harness/` |

The rules actions follow are in the design doc, section 7. The short version:
`page` first then one options object, assert your own success, return what the
spec needs, never take a raw selector, and put a failing case in a separate
`attempt*` function that returns an outcome instead of adding a flag.

## Locators use `data-pw`

`getByTestId()` is pointed at `data-pw` in `playwright.config.ts`. Use it.

Do **not** match on visible text. Every string in this app goes through
`translateFunction`, so `getByRole("button", { name: "Add to cart" })` passes in
English and fails in Arabic. If something has no hook, add a `data-pw` to the
component rather than writing a cleverer selector.

## The rules

**1. It never gates a pull request.** It is red when staging is down, when a
deploy is mid-flight, or when someone changed a response shape. All useful to
know, none of it a reason to block a pull request. It runs on push to `develop`
and `main`, and nightly — see `.github/workflows/test-e2e.yml`.

**2. The target guard is not optional.** Preflight refuses to run unless every
configured backend address is a known staging host, and it runs before anything
is built. Adding a host to `ALLOWED_HOSTS` in `harness/guard.ts` is a deliberate
act. **Never production, under any flag.**

**3. Assertions stay loose.** A status, a shape, a count being non-zero. Never an
exact response body or a specific product name — that turns an ordinary
catalogue change into a red suite, which teaches everyone to ignore it.

**4. Never assert, log or snapshot a token, an OTP, a phone number, an email or
a password.** `harness/redact.ts` masks all of them; use it on anything printed.

**5. Reads may retry. Writes never.** `retries: 0` is set in the config, because
a retried checkout is a duplicated order.

**6. Everything you create, you tag and you register for teardown** — at the
moment it is created, not after the assertions, so a failed assertion still
cleans up.

**7. One login per identity per run.** The OTP send is rate limited for real.
The session is created once in global setup and shared.

## What is here now, and what is not

Built: the harness, preflight, the server, both projects, the action and
scenario layers, and `guest.live.spec.ts`.

Not built yet, each its own ticket:

- **`e2e-money-path`** — the session, `auth`/`cart`/`order` actions, and the
  journey that places a real order and cancels it. The hooks it needs
  (`addToCartButton`, `Confirm-Order-Button`, `cachondelivry-cartpage`) are
  already in the app and already listed in `selectors.ts`.
- **`e2e-scripted-mode`** — the specs that use `scenarios/`. `mockBackend` is
  built and ready; read the note at the top of `scenarios/index.ts` first,
  because sending an OTP goes through a server action and cannot be intercepted.
