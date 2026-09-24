---
ticket: e2e-guest-cart-survives-sign-in
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-23
links:
  clickup:
  github:
---

# Research — e2e-guest-cart-survives-sign-in

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Add one browser journey. A guest puts the QA product in the bag, then signs in.
The journey proves the product is still in the bag after sign-in. At the end it
removes the product from the bag.

## How the app does it today (read from the code)

The flow crosses two backends. The steps are below, in order.

1. **The guest's bag lives on the gateway.** `utils/server/tokenManager.ts:73-101`
   (`GATEWAY_APIS`) lists `/cart/add`, `/cart/remove`, `/cart/cart_shipping` and
   `/cart/cart_overview`. A guest's call to them goes to the gateway. A verified
   shopper's call goes to the core backend. `/api/proxy` names the backend that
   answered in the `x-market-backend` header.
2. **Sign-in sends the guest's token to the core backend.**
   `app/api/auth/login/route.ts:120-160` reads the guest's `MARKET-TOKEN` and
   posts the verify call to `BACKEND_URL` with `Authorization: Bearer <guest
   token>`. The comment at line 139 says the call "returns a fresh token pair on
   promote and on merge". So the **core backend** moves the guest's data into
   the account. This repository does not move any cart line itself.
3. **The shared shopper account already exists**, so a sign-in with its phone is
   the **merge** case, not the promote case.
4. **The client reads the bag again after sign-in.** `services/auth.ts:256` calls
   `home.getClientData()`. That calls `getCart()` (`services/home.ts:67`), which
   reads `/cart/cart_shipping` and calls `initCart` (`utils/functions.tsx:299-341`).
   The new read goes to core, because the shopper is now verified.
5. **Removing a line is optimistic and can be undone.**
   `services/cart.ts > RemoveFromCart` drops the row first, and puts it back
   when core refuses. The existing helper `removeLineNamed`
   (`tests/e2e/actions/cart.ts:2142`) already waits for the re-price
   (`/cart/cart_overview`) before it judges the removal.

The product docs already expect this journey:

- `docs/features/README.md:264` — AC-12 "Guest → verified upgrade — Merges guest
  data into the real account on verification."
- `docs/testing/LIVE_TEST_ROADMAP.md:511` — ticket 7 names "guest cart survives
  verification" as planned coverage.
- `docs/testing/E2E_TEST_DESIGN.md:204` — "the guest-cart merge on login" is
  listed as a case the cart module grows into later.
- `docs/testing/homepage-add-to-cart-tester-guide.md:500-503` (GV-4) — the manual
  case: account bag + guest bag, then verify with the same phone. "Expected: the
  two bags merged."

No spec in `tests/e2e/` covers this today. `shopper.live.spec.ts` signs in from
a new guest context, but the guest bag is empty at that moment. It then empties
the account's bag and adds the product **after** sign-in.

## Relevant directories

- `tests/e2e/` — the browser suite (Playwright). The new journey goes here. The
  flow needs the real core backend to merge the bag, so the unit suite cannot
  reproduce it.
- `tests/e2e/actions/` — reusable steps. The ones this journey can reuse:
  - `cart.ts` — `addQaProductToBag` (401), `openCart` (66), `bagLineCount` (54),
    `bagLineName` (1929), `removeLineNamed` (2142), `emptyTheBag` (148),
    `watchCartMoney` (1011).
  - `qaProduct.ts` — `gotoQaProduct` (36). The QA product opens by address for a
    guest with no QA mode (note at the top of the file).
  - `auth.ts` — `bootAsNewGuest` (165), `attemptAuth` (706),
    `requireSignedInShopper` (871), `whoAmI` (260), `signOutAndSettle` (1454).
- `tests/e2e/harness/` — `liveSession.ts` (`newLiveContext`, `SESSION_STATE`,
  `saveSession`, `handOnSession`, `forgetSavedSession`), `session.ts`
  (`recordAuthCalls`, `recordSignInOutcome`, `credentialsHeld`),
  `renewalGate.ts` (`waitForRenewalSettled`), `qaSeedState.ts`
  (`readQaSeedState` — the QA product slug).
- `app/api/auth/login/route.ts`, `services/auth.ts`, `services/cart.ts`,
  `utils/functions.tsx`, `utils/server/tokenManager.ts` — the app code the
  journey exercises. Read only; this ticket does not plan to change them.

## Relevant config files

- `tests/e2e/laneConfig.ts` — `ACCOUNT_LANE` / `SOLO_LANE`. A new spec file must
  be listed in exactly one lane, or `laneSpecs()` stops the run.
- `.env` for e2e (`tests/e2e/harness/env.ts`) — `TEST_ACCOUNT_PHONE`,
  `TEST_ACCOUNT_OTP` (Shopper A), `TEST_ACCOUNT_PHONE_2`, `TEST_ACCOUNT_OTP_2`
  (Shopper B, the QA seller).
- `.github/workflows/test-e2e.yml`, `e2e-lane.yml` — protected paths. The lane
  runner reads the lane lists, so a new spec needs no CI change.

## Test layout and naming convention

- **Browser suite:** `tests/e2e/<area>.live.spec.ts` (real staging) or
  `<area>.scripted.spec.ts` (mocked backend). Runner: Playwright, imported
  through `tests/e2e/fixtures.ts` (`import { expect, test } from "./fixtures"`).
- **Case ids** sit in the test title and in a header comment block, e.g.
  `BUY-01`..`BUY-04`, `RECOV-01`, `AUTH-01`.
- **Long flows** use one `test()` with `test.step()` per step;
  `profile.live.spec.ts` is the named model (`CLAUDE.md` rule 8).
- **Expected failure marker:** Playwright `test.fail()` — the strict marker (a
  case marked `test.fail()` that passes turns the run red). No live spec uses
  it today. A case red on a backend fault stays red and names the backend
  instead (`AUTH-01`).
- **Unit suite:** `tests/**/*.test.ts(x)`, Vitest. Not the right home here: the
  merge happens inside the core backend.
- **Scenario list:** `docs/testing/E2E_SCENARIOS.md` lists every case with its
  file and line. A new case gets a row there.

## Possibly affected services

- **gateway** — takes the guest's `/cart/add`.
- **core backend** — verifies the code, merges the guest's bag into the account,
  and answers every bag call after sign-in.
- **chat / stories / comments / wallet** — sign-in fans out to them.
  `AUTH-01` already judges each one. This journey should not fail on them
  (`requireSignedInShopper` exists for that reason).
- **Search (Elasticsearch)** — not on the path. The QA product opens by
  address, which is a direct lookup.

## Test / validation commands available

- `pnpm e2e:health` — is staging answering. Run first.
- `pnpm test:e2e:live` / `tsx tests/e2e/cli.ts run --lane=account` — build, start
  and run the browser suite, or one lane.
- `pnpm lint`, `pnpm test:run`, `pnpm lint:i18n-parity` — the gates on a pull
  request. `tests/e2e/laneConfig.ts` is read by `tests/harness/qaHarness.test.ts`, so
  `pnpm test:run` checks that the new file sits in a lane.
- `npx tsc --noEmit` (after `next typegen`) — type check.

## Risks and unknowns

- **The shared account's bag is not empty at the start.** An earlier run can
  leave the QA product in the account's bag. Then "the QA product is in the bag
  after sign-in" passes even when the merge dropped the guest's line. This is
  the silent pass the testing rules forbid. Likelihood: real — `BUY-04` notes a
  bag holding a line restored by a refused removal (`cart.ts:157-163`).
- **Each real sign-in costs one one-time code**, against a limit that is not
  ours (`shopper.live.spec.ts:97`, `laneConfig.ts:25`). Emptying the account's
  bag before the guest part needs a signed-in session. That means either a
  second sign-in, or a session another spec saved, and file order is not
  reliable (`session-recovery.live.spec.ts:40-45`).
- **The merge rule for a product that is in both bags is not documented.** If
  the account already holds the QA product, core may add the quantities, keep
  one line, or keep two lines. The code in this repository does not say.
- **Leaving the page during the token exchange loses the new pair.** The journey
  must call `waitForRenewalSettled(page)` before any `goto` or reload on the
  signed-in page (`CLAUDE.md`, "Browser suite — causes we have already met").
- **A removal can be refused and restored.** Only `removeLineNamed` /
  `emptyTheBag` judge it correctly; a direct click-and-count would pass wrongly.
- **Country.** `gotoQaProduct` defaults to `sy`. The QA product may not be
  offered in the suite's default `iq`. This journey places no order, so cash on
  delivery does not matter here, but the bag reads the country cookie.
- **Two places to sign in.** The login widget in the navigation (`attemptAuth`)
  and the verify panel inside the bag (GV-1 / GV-2, reached in `BUY-02`). They
  may take different paths after the code is accepted.
- **Clean-up after a failure.** If the journey fails between "sign in" and
  "remove", the QA product stays in the shared account's bag. The next run of
  `BUY-01` empties the bag first, so it is not harmed, but other readers of the
  account are.

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | How does the journey make sure the account's bag holds no QA product before the guest adds one? (a) sign in first, empty the bag, sign out, then start as a guest — two codes; (b) open a session another spec saved — depends on file order; (c) something else. | Without a clean start the survival check can pass when the merge lost the line (silent pass). |
| OQ-2 | What does "the cart survives" mean exactly: the QA product line is present by name, or also the same quantity and the same colour / size the guest chose? | Decides the assertions. Rule 6: check the content, not only presence. |
| OQ-3 | Which sign-in entry does the journey use: the navigation login widget (`attemptAuth`), or the verify panel inside the bag? | They are different entry points; the request says only "signing in". |
| OQ-4 | Must the journey prove the bag answer after sign-in came from **core** (`x-market-backend: core`) and the guest's add from the **gateway**? | Rule 3: name the backend at each step. It also proves the bag was really re-read as the account, not shown from the guest's store. |
| OQ-5 | Should the journey also check that the product is gone after a reload (the removal stuck on core), or is `removeLineNamed`'s re-price wait enough? | Decides whether the last step has one check or two. |
| OQ-6 | Which spec file holds the journey: a new file (e.g. `cart-merge.live.spec.ts`) in the account lane, or a new case in `shopper.live.spec.ts`? | A new file needs a lane entry and a scenario row; a case in `shopper.live` shares its sign-in and code budget. |
| OQ-7 | If the journey fails after sign-in, must it still remove the QA product from the account's bag (an `afterEach` / `finally` clean-up)? | The account is shared; a left-behind line affects other cases. |
| OQ-8 | Which case id does the journey get (e.g. `CART-01`)? | Case ids appear in titles, `E2E_SCENARIOS.md` and failure reports. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No protected runtime path is expected to change. The lane list in
  `tests/e2e/laneConfig.ts` is test configuration, not a protected path.
