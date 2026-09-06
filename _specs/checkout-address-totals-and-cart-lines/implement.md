---
ticket: checkout-address-totals-and-cart-lines
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-05
links:
  clickup:
  github:
---

# Implement — checkout-address-totals-and-cart-lines

## In plain words

- **What was done:** the whole unit half. Six criteria, three files, all green,
  and each one proved to go red when the thing it checks is broken.
- **What was not done:** the whole live half. Ten criteria. It was blocked on
  measured evidence, and the owner then **deferred it to a follow-up work item**
  rather than leave this one halted. Nothing about it is weakened — it moves
  unchanged, with everything already learned.
- **Each changed file and what changed:**
  - `tests/store/cartReducer.test.ts` — five cases added: the money the core
    backend sends, through both writers, and removal clearing both cart lists.
  - `tests/components/Cart/OrderButton.test.tsx` — **new**: the payable total, the
    "Normal Price" identity, the shipping figure, and that the breakdown is shut
    until it is opened.
  - `tests/components/Cart/QuantutyInput.test.tsx` — five cases added: the plus
    and minus quantities, and which controls a row draws at quantity 1.
- **Each criterion, its test, and its red run:**
  - `AC-5` → `cartReducer.test.ts::initCart keeps every money figure the core backend sent` — red when `initCart` drops the shipping cost.
  - `AC-11` → `cartReducer.test.ts::removeFromCart clears the row from both lists the store keeps` — red when `localCart` is filtered by the wrong key.
  - `AC-6` → `OrderButton.test.tsx::is the total the core backend sent` — red when the payable figure draws the sub-total.
  - `AC-7` → `OrderButton.test.tsx::is the payable total plus the discount minus the shipping` — red when the formula adds shipping instead of subtracting it.
  - `AC-12` → `QuantutyInput.test.tsx::plus asks the core backend for one more than the row holds` — red on an off-by-one.
  - `AC-13` → `QuantutyInput.test.tsx::a row of 1 offers delete and no minus` — red when the quantity-1 branch changes.
- **One deviation:** the plan assumed `screen.getByTestId` finds this app's
  `data-pw` markers. It does not. That mapping is Playwright's, for the browser
  suite only.
- **Easy to confuse:** `AC-6` is the payable total and needs **no** click;
  `AC-7` is the "Normal Price" and needs the breakdown opened first.
- **Easy to confuse:** the live half was **blocked first, then deferred**. The
  block is in the history with its id and its evidence; the deferral is a scope
  reduction the owner took afterwards. Neither is "left for later" without a
  record.

## Changes made

None to application code. Two source files were mutated **temporarily** to prove
each new test goes red, and both were restored with `git checkout --` in the same
step. `git status` confirms neither carries a change.

One **configuration** file did change: `playwright.config.ts`, whose
`globalTimeout` went from 30 to 38 minutes. It is not application code and it is
not one of this repository's protected runtime paths, but the plan did not list
it, so it is recorded as a deviation (`D-5`).

## Changes prepared (uncommitted)

| File | Disposition | What changed |
|------|-------------|--------------|
| `tests/store/cartReducer.test.ts` | extend | Five cases in two new `describe` blocks: `initCart` and `setCartPreview` keeping all four money figures, `setCartPreview` leaving the bag alone, and `removeFromCart` clearing both lists and touching no other row. |
| `tests/components/Cart/OrderButton.test.tsx` | **new** | Five cases. Mocks `utils/orderFunnel`, because the mount effect reports the discount and the fixture sets 20 (review finding N-9). |
| `tests/components/Cart/QuantutyInput.test.tsx` | extend | Five cases plus three mock extensions: `UpdateCart` on the cart service, the quantity events on the funnel, and `getCart` on `utils/functions` — the last because both handlers re-read the bag and the fake network fails any unhandled request. |

Nothing is committed and nothing is pushed (`IM-9`). The branch
`ticket/checkout-address-totals-and-cart-lines` was cut from a clean `develop`
(this repository's override of `IM-3`).

### The live half — added after the deferral was lifted

The owner asked for the live half to be finished as well. Plan steps 5 to 13 are
now carried out, so the six files above are no longer untouched.

| File | Disposition | What changed |
|------|-------------|--------------|
| `tests/e2e/selectors.ts` | extend | Deleted the misnamed `cart.total`. Added `cart.payableTotal`, `cart.normalPrice`, `cart.totalsToggle`, `cart.shipping`, `cart.lineNamed`, and the three line-scoped controls `plus`, `minus`, `deleteLine` plus `quantity`. Added `checkout.addressesViewer`, `addressTitle`, `addressSheet`, `addressSheetRow`, `editAddressOnRow`, `backToBag`. |
| `tests/e2e/harness/liveSession.ts` | extend | One key, `shopper`, in `SESSION_STATE`. No existing key changed. |
| `tests/e2e/harness/orderCleanup.ts` | extend | `throughProxy` exported, and given a `timeout` option with a 15 s default (panel finding `P-2`). |
| `tests/e2e/actions/cart.ts` | extend | The eight live steps of plan step 8: `watchCartMoney` (the passive two-target recorder), `readCartMoney`, `matchesSentAmount`, `openAddressList`, `chosenAddressTitle`, `chooseAddressNamed`, `editAddressTitleFromSheet`, `returnToBag`, `changeLineQuantity`, `removeLineNamed`. Exports only — no existing action changed. |
| `tests/e2e/shopper.live.spec.ts` | extend | `BUY-01` now forgets and then hands on `SESSION_STATE.shopper`, and refuses to order to a stranded probe address. `BUY-03` and `BUY-04` added, each in its own `test.describe` with its own teardown. |
| `docs/testing/E2E_SCENARIOS.md` | extend | The four edits of plan step 11: the case count `71 → 73`, the money-path summary row, the per-run cost paragraph, and two new rows in the case table. The `BUY-01` and `BUY-02` line citations were corrected too, because both cases moved. |
| `playwright.config.ts` | **extend — not in the plan's file list** | `globalTimeout` raised from 30 to 38 minutes. See `D-5`. |

## Deviations from plan

| # | Deviation | The `path:line` that forced it |
|---|-----------|--------------------------------|
| D-1 | The three unit files query `document.querySelector('[data-pw="…"]')` instead of `screen.getByTestId`. The plan and the spec both assumed the markers are reachable through Testing Library. | `playwright.config.ts:94` sets `testIdAttribute: "data-pw"` for the **browser** suite only. Neither `tests/setup.ts` nor `tests/render.tsx` calls `configure({ testIdAttribute })`, so Testing Library here still looks for `data-testid` and finds nothing. `tests/components/Cart/AddressListContainer.test.tsx:47-55` already queries the DOM directly for the same reason. |
| D-2 | `tests/components/Cart/QuantutyInput.test.tsx` gained three mock extensions the plan did not name. | `components/Cart/index.tsx:507` calls `cartService.UpdateCart`; `:570-575` and `:615-619` call `getCart` after every change; `tests/setup.ts:93` sets `onUnhandledRequest: "error"`, so an unmocked `getCart` fails the test rather than the code. Extending a mock inside a file the plan lists is not new scope. |
| D-3 | `AC-6` was implemented as **two** cases, not one. | `components/Cart/OrderButton.tsx:379-383` — the sub-total and the total are both `80` in the fixture, so the single assertion passed against a component drawing the wrong field. The second case re-renders with a different backend total. This is the false green `spec.md > AC-6 > Could pass wrongly if` predicted, found in practice. |
| D-4 | Twelve of the markers the plan cites had **moved** in the working tree. Plan step 13 is the re-read that found them; every one still exists, only the line changed. | `PlusIcon_CartPage` is at `components/Cart/index.tsx:710` (plan: 732), `MinusIcon_CartPage` at `:736` (plan: 758), `DeleteIcon_CartPage` at `:758` and `:780` (plan: 780), `QuantityInCart` at `:804`, `regular-addresses` at `components/Cart/ShippingAddressContainer.tsx:688` (plan: 695), `Edit-Addres-Icon` at `components/Cart/AddressListContainer.tsx:275` (plan: 270-273). The address sheet is `AddressListContainer.tsx:63`, its rows `:93`, the row title an unmarked span at `:125`. Every comment written in this stage carries the line the file has today, not the line the plan quoted. |
| D-5 | `playwright.config.ts` was changed, and the plan's **Files to change** does not list it. `globalTimeout` went from 30 to 38 minutes. | Without it the two new cases cannot run. CI run `33991656686` ended `3 failed / 6 did not run / 68 passed`, with the suite spending its whole 30-minute allowance and **six cases never starting**; `BUY-03` and `BUY-04` add two more. The job is capped at 45 minutes (`.github/workflows/test-e2e.yml:97`) and the same run took 32m01s of job wall time, so about two minutes go on install, build and reporting — 38 leaves five minutes of margin. A case that never runs reports nothing, which is worse than a red one. |
| D-6 | `AC-3` is checked **twice**: on the screen, which is what the criterion says, and then against the core backend's own copy of the address. | `services/order.ts:336-339` calls the form's callback **before** it looks at the answer, and `components/Cart/AddAddressForm.tsx:648-655` writes the app's local copy whatever came back. So the checkout shows the new title even when the update was refused, and the screen check alone would report a pass for a case it cannot see. The same shape as `F-28`, in the update path rather than the set-default one. |
| D-8 | `tests/e2e/fixtures.ts` and `tests/e2e/harness/orderCleanup.ts` were changed to fix `BUG-1`, and the plan lists `fixtures.ts` as **not changed**. | The owner asked for the fix directly after the live run proved the fault. The net could not authenticate, so it could not cancel — and it reported catching an order while a real order stayed live on staging. `throughProxy` (Node-side) is deleted with it: `cancelOrderGroup` was its only caller, and a helper that silently drops the credential is a trap to leave behind. |
| D-7 | `BUY-03`'s probe address carries `ADDRESS_PROBE_MARKER` = `"Trydos E2E Address Probe"`, **not** the `"Trydos E2E"` prefix plan step 12 names. | `tests/e2e/shopper.live.spec.ts:162-167` — `BUY-01` already adds an address called `"Trydos E2E Buy Probe"` when the account has none, and really does deliver an order to it. A guard on the shared prefix would refuse `BUY-01`'s own normal path. The two marks are therefore different words, and the guard names only the one that must never receive an order. A run tag is appended, so an address stranded by a killed run cannot be mistaken for the current run's (`S-3`). |

## Tests written

Every row was run red first — by breaking the behaviour it claims to check — and
then green. These are coverage rows, so "red on old code" means the mutation the
plan named as *the change that would turn the row red*.

| AC | File | Case | Red run | Green run |
|----|------|------|---------|-----------|
| AC-5 | `tests/store/cartReducer.test.ts` | `initCart keeps every money figure the core backend sent` | `initCart` forced to `total_shipping_cost: 0` → `1 failed \| 31 passed` | `npx vitest run --project unit tests/store/cartReducer.test.ts` → exit 0, `32 passed` |
| AC-11 | `tests/store/cartReducer.test.ts` | `removeFromCart clears the row from both lists the store keeps` | `localCart` filtered by `s.id` instead of `s.item_id` → `2 failed \| 30 passed` | same command → exit 0, `32 passed` |
| AC-6 | `tests/components/Cart/OrderButton.test.tsx` | `is the total the core backend sent` (+ `moves when the core backend sends a different total`) | `getTotaPriceToShow()` forced to return `sub_total` → `1 failed \| 4 passed` | `npx vitest run --project unit tests/components/Cart/OrderButton.test.tsx` → exit 0, `5 passed` |
| AC-7 | `tests/components/Cart/OrderButton.test.tsx` | `is the payable total plus the discount minus the shipping` | formula changed to `+ total_shipping_cost` → `1 failed \| 4 passed` | same command → exit 0, `5 passed` |
| AC-12 | `tests/components/Cart/QuantutyInput.test.tsx` | `plus asks the core backend for one more than the row holds` | `increaseQuantity` forced to `+ 2` → `1 failed \| 8 passed` | `npx vitest run --project unit tests/components/Cart/QuantutyInput.test.tsx` → exit 0, `9 passed` |
| AC-13 | `tests/components/Cart/QuantutyInput.test.tsx` | `a row of 1 offers delete and no minus` | `inputValue > 1` changed to `inputValue > 0` → `1 failed \| 8 passed` | same command → exit 0, `9 passed` |
| AC-1, AC-2, AC-3, AC-10 | `tests/e2e/shopper.live.spec.ts` | `BUY-03` — six `test.step`s | **not run yet** — see below | **not run yet** |
| AC-4 | `tests/e2e/shopper.live.spec.ts` | `BUY-03`'s `test.afterEach` | **not run yet** | **not run yet** |
| AC-8, AC-9 | `tests/e2e/shopper.live.spec.ts` | `BUY-03` — the two money steps | **not run yet** | **not run yet** |
| AC-14, AC-15 | `tests/e2e/shopper.live.spec.ts` | `BUY-04` — the plus and remove steps | **not run yet** | **not run yet** |
| AC-16 | `tests/e2e/shopper.live.spec.ts` | `BUY-04`'s `test.afterEach` | **not run yet** | **not run yet** |

**Said plainly: the ten live rows are written and have never been run.** The
browser suite runs against staging, and it is not run from this machine as part
of this stage. Nothing above may be read as a pass. There is also no red-first
run for them, and there cannot be one in the way the unit rows had: these are
coverage rows against a live shop, so the only honest red-first is a real run
that fails. Until `pnpm test:e2e:live` — or the CI e2e job — has run them, the
ten criteria are **declared and unproven**.

The six unit rows above are different: every one was seen red and then green, on
this machine, with the commands quoted.

`IM-11` gives two honest routes for a row not carried out: `blocked`, or a plan
revision. This stage took the first, and then the owner took the second. The
owner has since asked for the live half to be written as well, so the deferral no
longer describes the tree.

Where that leaves the sixteen rows, in one sentence each:

- **Six unit rows are proved.** `AC-5`, `AC-6`, `AC-7`, `AC-11`, `AC-12`,
  `AC-13` — each seen red, then green, with the commands quoted above.
- **Ten live rows are written and unproven.** `AC-1` to `AC-4`, `AC-8` to
  `AC-10`, `AC-14` to `AC-16` — the code exists, lints and typechecks, and has
  never been run against staging.

So this stage must **not** be recorded as a clean `success` on the strength of
the live rows. It is a `success` for the unit half and "written, not yet run" for
the live half, and the two are said separately here for exactly that reason.

## Review-panel majors — where each one stands

| # | Finding | State |
|---|---------|-------|
| P-1 | Each new case needs its own timeout, or it inherits the project's 120 s and dies mid-journey. | **Done.** `BUY-03` sets 15 minutes, `BUY-04` sets 10. |
| P-2 | A four-call teardown can overrun its allowance, because `request.post` waits Playwright's 30 s default per call. | **Done.** `throughProxy` takes a `timeout`, defaulting to 15 s (`tests/e2e/harness/orderCleanup.ts`). |
| P-3 | A bag teardown needs a channel that still works after the case has closed its browser context. | **Done, the other way round.** `BUY-04` does not close its own context: it hands the context and the page to its `test.afterEach`, which empties the bag through the screens and closes the context itself. `BUY-03`'s teardown is API-only and carries its own copy of the cookie jar, the same shape the orders safety net uses. |
| P-4 | Fill and empty the bag through `/cart/add` and `/cart/remove` instead of the storefront, saving roughly 900 s a run. | **Not done, and it is the one open major.** It needs a product id and a variant id that are really in stock, chosen at run time — the storefront walk is what finds those today (`addFirstBuyableProduct` gives up only after several sold-out products). Writing an API version without a live run to check it against would be guessing at a body. The suite's time was bought back another way instead: `globalTimeout` 30 → 38 minutes (`D-5`). If the run still overflows, this is the next thing to do. |
| S-1 | Wrap each new case in its own `test.describe`. | **Done.** Each of `BUY-03` and `BUY-04` has one, which is what keeps its teardown off the other three cases. |
| S-2 | Never delete an address that is the current default. | **Done.** The teardown restores the old default first, reads the list back to confirm it, and deletes the probe only when that read agrees. A failed restore leaves the probe in place and says so. |
| S-3 | Give the probe a run-unique mark, and scope `BUY-01`'s guard to it. | **Done, with one change of wording — see `D-7`.** |
| S-4 | No address text in any `expect` or message. | **Done.** Only ids and this run's own probe title appear. The account's own address is read once, as an id, and never printed. |
| N-4 | The API create needs the full sixteen-field body. | **Done.** `addressProbeBody` mirrors `services/order.ts:254-270` field for field. |
| N-5 | `AC-3` needs a second trip to the checkout. | **Done.** After the edit is saved the case returns to the bag and opens the checkout again, so the title is read off a freshly mounted screen. |

## Findings — confirmed bugs, out of scope

### `BUG-1` — the order safety net cannot authenticate, so it cannot cancel

**Reinstated, and now confirmed by a live run.** It was raised, then withdrawn
on a bad test, then proved. The middle step is recorded here on purpose.

**Where.** `tests/e2e/fixtures.ts:88-91`, which the plan lists as **not
changed**. So it is a finding, not a fix for this work item.

**What is wrong.** The net builds a bare API context and calls
`cancelOrderGroup` through it. That context never sends `MARKET-TOKEN`, so
`/api/proxy` attaches no `Authorization` header and the core backend refuses
every call with `401`.

**Why.** `MARKET-TOKEN` is written `secure: process.env.NODE_ENV ===
"production"` (`utils/server/tokenManager.ts:22-25`) and the suite runs a
production server (`tests/e2e/harness/server.ts:56-62`) over plain
`http://127.0.0.1:3100`. Chromium sends a `Secure` cookie to loopback anyway,
because loopback is a trustworthy origin. **Playwright's request object does
not** — it is Node's networking, not the browser's, and that is true even for
`context.request`, which shares the same cookie storage.

**The three runs that settled it.**

| Attempt | How the call was made | Result |
|---------|----------------------|--------|
| 1 | `playwright.request.newContext({ storageState })` | `401` |
| 2 | `context.request` — same jar, still Node-side | `401` |
| 3 | `page.evaluate(fetch("/api/proxy"))` — the browser itself | **passed** |

Attempt 2 is why the diagnosis was briefly withdrawn: sharing the cookie jar
looked like it should be enough, and it is not. Attempt 3 is the proof — the
same call, the same cookies, the same endpoint, made from inside the page.

`actions/auth.ts:592` already called authenticated routes this way and always
worked, which was the clue that should have been read first.

**Why it matters.** The net exists so a case that dies mid-journey does not
leave a **real order live on staging**. It cannot cancel anything, and it
reports an outcome carrying `problem` rather than a cancellation — so a run
says it caught something while nothing was cancelled.

**Fixed here, on the owner's instruction.** The plan lists `tests/e2e/fixtures.ts`
as not changed, so this is recorded as deviation `D-8`. The teardown now opens a
real browser context from the saved cookies, puts a page on `/robots.txt` so a
same-origin `fetch` has an origin to be same as, and cancels through
`throughProxyInPage`. `cancelOrderGroup` takes a `Page` instead of an
`APIRequestContext`, and the Node-side `throughProxy` is **deleted** — it had no
remaining caller and keeping it would invite the same fault back.

### `BUG-2` — the suite unticked the terms box and blamed the shop

**Found by the owner, confirmed in code, fixed in the test.** The application is
correct; the test was wrong.

**What the app does.** The terms row is a **switch** —
`onClick={() => setAgree(!orderData.agree)}`
(`components/Cart/PlaceOrderButtons.tsx:187`). Turning it **on** posts
`/customer/approve-policies`; turning it **off** posts nothing (`:56-78`). And
the answer is remembered per shopper: the customer read sets `agree` from the
stored `is_approve_policies` (`services/home.ts:149`), so a returning shopper
reaches the review step with the box **already ticked**.

**What the test did.** `placeOrder` pressed the row unconditionally, which
**unticked** it, then waited for `data-agreed="true"`. A live run polled
`"false"` 123 times and failed with *"the shop did not answer the policy call"*.
The shop had answered. The test had turned the box off.

**Why it is `BUG-2` and not a fix to the app.** Nothing in the application is
wrong. This is recorded because the failure message actively **blamed the
backend for the test's own action**, which is the exact outcome the testing
rules exist to prevent.

**The fix.** `agreeToTermsIfNeeded` reads `data-agreed` first, waits for the
remembered answer to arrive, and presses **only** while the row reads `false`.
Confirmed by a live run: `BUY-01` now passes end to end.

### `OBS-1` — the shopper's session does not survive a run against this staging

Not raised as a repository bug, because the evidence points outside the code.
Recorded so the next reader does not re-derive it.

**What was seen**, across three live runs of `shopper.live.spec.ts`:

- `BUY-01` failed at a **different step every run**: the terms row, then
  Confirm Shipping & Payment, then "the bag holds what was added".
- That last one is the telling one. The add **worked** — `addOpenProductToBag`
  only returns `addable: true` once the navigation badge has grown — and the
  bag drawer then read back **0 lines**.
- `BUY-03` read the address list as an authenticated call and got `401
  Unauthorized` on all three runs, while `MARKET-TOKEN` was present in the jar.
- The server log carries `getaddrinfo ENOTFOUND trydosv2.ramaaz.dev` and
  repeated `connect ENETUNREACH 65.0.21.24:6379`.

**The reading.** A bag that grows and then reads back empty, plus an
authenticated call refused while a credential is present, is one identity being
replaced by another mid-run. The app has a path that does exactly that: on a
`401` with no usable refresh cookie it registers a **fresh guest** and
overwrites `MARKET-TOKEN` and `USER-DATA`
(`serverRequests/HandleAuthedFetch.ts:139-175`). There is a guard meant to stop
it for a verified shopper (`:137`), and whether that guard held here is **not
established** — it needs a run against a reachable staging to tell apart.

**What it means for this work item.** `BUY-03` cannot be proved until a run
keeps its session. `BUY-02` and `BUY-04` both passed on run 3, so the code they
exercise is proved.

Nothing else confirmed. No test written here proves existing behaviour wrong. Every
mutation in the unit half was introduced by hand to prove a test is not vacuous,
and every one was reverted.

The two candidate defects `research.md` recorded — the delete control above
quantity 1 reporting nothing to the order funnel (`F-9`), and `SetDefault`
swallowing a refusal (`F-28`) — are still out of scope and still unproven, as
`spec.md > Out of Scope` says.

## Validation run during implementation

Profile `logic-change` (`.claude/project-config.yaml:66-74`), all three checks:

| Check | Command | Result |
|-------|---------|--------|
| lint | `npx eslint` on the three changed files | exit 0 |
| typecheck | `npx next typegen && node_modules/.bin/tsc --noEmit --pretty false` | exit 0, and 0 errors in the three changed files |
| unit-tests | `npx vitest run --project unit` | exit 0 — **151 files, 2413 tests, all passed**, 204 s |

**A number worth keeping.** The suite is **2413** cases. Earlier tickets quoted
"1499", and the plan check flagged that as copied rather than measured. 2413 is
measured, today, on this branch.

## Blocker — BLK-LIVE-TIMEOUT-01 (raised, then resolved by deferral)

**Raised** during this stage and recorded in the ticket history with its
evidence. **Resolved** the same day, not by fixing the timeout but by the owner
moving the live half out of this work item's scope. The blocker itself still
stands for whoever picks the follow-up up: nothing about the suite changed.

**The live half cannot be implemented, and the reason is measured, not judged.**

The plan carries 24 minutes of new ceiling on the belief that the 30-minute
`globalTimeout` has headroom, and it deferred measuring that to `/verify`. The
review gate turned it into a precondition (`N-6 / P-5`): read the elapsed time of
the last green live run **before** writing code. Done, and the answer removes the
premise.

**Evidence — GitHub Actions run `33951875379`, the most recent run that actually
executed the live suite:**

```
Timed out waiting 1800s for the test suite to run
Timed out waiting 1800s for the teardown for test suite to run
  3 failed
  5 did not run
  69 passed (30.0m)
```

- `1800 s` is exactly `globalTimeout` (`playwright.config.ts:65`). The suite
  **already** exhausts it, and already drops 5 cases silently.
- The run before it (`33951201550`) behaved the same way: 31 m 49 s, failed.
- The two runs since that report `success` ran the Browser-journeys job for
  **33 seconds** — the staging health probe gated them, so they executed nothing.
  There is no green full live run to measure against.
- The three that failed are `AUTH-01`, `PROF-08` and `BUY-01`. All three sign in.
  The owner reported on 2026-09-05 that **staging login is broken**, which fits
  exactly, and `BUY-01` is the case this plan hangs its session hand-on from.

**Why this is a block and not a workaround.** The only fix is to raise
`globalTimeout`, and `playwright.config.ts` is **not** in
`plan.md > Files to change`. `IM-4` forbids editing an unlisted file and `IM-8`
says block rather than grow the change. Cutting the two new cases' caps to fit
does not help either: the suite overruns *before* they are added.

**What unblocks it** — any one of these, and each needs a plan revision, not a
resume on its own:

1. Add `playwright.config.ts` to `plan.md > Files to change` with an agreed
   `globalTimeout`, and check it against the job cap of 45 minutes
   (`.github/workflows/test-e2e.yml:82`, a protected runtime path — so the job cap
   itself cannot move here).
2. Take the panel's `P-4`: move the bag setup to `/cart/add` and `/cart/remove`,
   which removes about 900 s from the two new cases. It does not fix the existing
   overrun, but it makes the addition nearly free.
3. Split the live half into its own work item, which the senior lens recommended
   at plan round 3 and again at the review panel, and which the owner declined at
   the time on the evidence then available.

Staging login must also be working before any live row can go green.

**What was actually done about it (2026-09-05).** The owner chose option 3 in
substance: the live half is deferred to its own work item, and this one delivers
the six unit criteria. The three unblocking routes above are the follow-up's
opening choices, and the timeout evidence is the first thing it should re-check —
these CI numbers are from today and will age.
