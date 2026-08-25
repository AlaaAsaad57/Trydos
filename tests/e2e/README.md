# Browser tests — against the real staging backend

**The design is `docs/testing/E2E_TEST_DESIGN.md`.** This file is how to run
them and how to add one.

**The list of cases is `docs/testing/E2E_SCENARIOS.md`.** Add a row there when
you add a case.

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

> **One accepted exception: guests.** `session.live.spec.ts` registers guests on
> purpose — that is the behaviour it tests — and there is no way to remove one.
> Roughly five per run, so about ten a day from the push and nightly schedules.
> Decided when that ticket was opened; nothing else in this suite may claim the
> exception without the same decision.

**7. One login per identity per run.** The OTP send is rate limited for real.
Each spec that needs a session creates one and saves it to `tests/e2e/.auth/`,
where its own later cases open it. (It is not created in global setup — that
sentence used to say so and was never true.)

> **One accepted exception: Shopper A signs in twice.** `profile.scripted.spec.ts`
> keeps its own session rather than borrowing the live spec's, because a snapshot
> shared across two projects is exactly the stale-credential trap that handing a
> session on exists to avoid. The `live` project is declared before `scripted` in
> `playwright.config.ts` and `workers` is 1, which is what keeps the two sign-ins
> from superseding each other. **Reordering the project list would break that.**

### What a full run spends in real one-time codes

Fifteen sends: `AUTH-01`, `PROF-01`, `RECOV-01`, five in `auth.scripted.spec.ts`,
and **seven** added by the profile branches — one sign-in for each of
`SCRIPT-07` to `SCRIPT-12`, plus `SCRIPT-12`'s change-number send, which is a
server action and cannot be intercepted.

**Why six sign-ins and not one.** Those cases may not share a session: several
damage their own on purpose, and none may hand that on. A shared session was
tried and measured — nothing renews it, because these cases also fake
`/api/auth/refresh`, so it ages out mid-run and every later case opens as a
guest. Signing in per case is what the constraint costs.

The identities **alternate** between the two configured accounts, because six
sign-ins on one number inside one run is throttled by the per-number cooldown and
a throttled case fails for a reason unrelated to what it tests. `SCRIPT-12` is
pinned to the first identity: it types the second one's number into the
change-number overlay, so that number has to belong to somebody else.

**Fifteen is the best case, not the number.** `sendOtpWithRetry` re-sends after
sleeping the server's own cooldown, so each send is really bounded by the case
timeout rather than by its attempt count. `profile.scripted.spec.ts` passes
`maxAttempts: 2`; the eight older sends still run at the default of five. The
worst case is therefore a function of the backend's cooldown, which nobody has
measured — if you measure it, put the number here rather than a guess.

The suite runs on every push to `develop` and nightly.

### Accepted drift, and what it costs

- **Analytics and error reporting are not blocked**, including in the faked
  cases. Turning them off would mean editing `instrumentation-client.ts` or
  `sentry.*.config.ts`, which are protected runtime paths. So the deliberate
  500s and 401s these cases cause **appear in Sentry as real errors**, and
  because `scrubRequestBody` redacts tokens and one-time codes but **not
  `phone`, `alternative_phone` or `email`**, the failed save's body carries the
  shopper's phone number and e-mail with them. That noise is expected, not a
  signal. It is the one place this suite knowingly does not meet its own rule
  about credentials in kept output.
- **`PROF-05` uploads a real file to the media store on every run.** Removing the
  picture unlinks it from the profile; it does not delete the stored object. The
  probe file is tiny and named `trydos-e2e-probe-picture.png` so an orphan can be
  found later. There is no sweeper.

## What is here now, and what is not

Built: the harness, preflight, the server, both projects, the action and
scenario layers, `guest.live.spec.ts`, `locale.live.spec.ts` and
`session.live.spec.ts`.

Not built yet, each its own ticket:

- **`e2e-money-path`** — the session, `auth`/`cart`/`order` actions, and the
  journey that places a real order and cancels it. The hooks it needs
  (`addToCartButton`, `Confirm-Order-Button`, `cachondelivry-cartpage`) are
  already in the app and already listed in `selectors.ts`.
- **`e2e-scripted-mode`** — the specs that use `scenarios/`. `mockBackend` is
  built and ready; read the note at the top of `scenarios/index.ts` first,
  because sending an OTP goes through a server action and cannot be intercepted.
