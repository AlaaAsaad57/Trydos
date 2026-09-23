---
ticket: e2e-guest-cart-survives-sign-in
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-23
links:
  clickup:
  github:
---

# Plan — e2e-guest-cart-survives-sign-in

> Decide the approach before changing code. Plan only — no implementation here.

> **Revision 3.** The owner ran the advisory panel twice before the gate and
> asked both times for the findings to be folded in directly (2026-09-23),
> without a `CHANGES_REQUESTED` round. Round 2 also changed one line of
> `spec.md` (FR-8 / AC-9). Every finding and where it landed is listed under
> **Panel findings addressed** at the end.

## Approach

Add one live case, `BUY-05`, to the money-path file `tests/e2e/shopper.live.spec.ts`.
The case is one `test()` with one `test.step()` per step, in its own
`test.describe`, with an `afterEach` clean-up (the BUY-04 shape). It reuses the
existing helpers for sign-in, sign-out, the QA product and the bag. Small
changes to `tests/e2e/actions/cart.ts` let the case read **which backend**
answered a bag call: the proxy already stamps `x-market-backend` on every
market answer it routes (`app/api/proxy/route.ts:380-441`), and the two cart
watchers today throw that label away. One new selector marks the moment the
bag drawer has finished its own read.

Why this over the alternatives:

- **A local listener inside the spec** would repeat the `x-proxy-url` matching
  that `watchCartAdd` and `watchCartMoney` already own. Two copies drift.
- **A separate watcher for the label** would add a third listener on the same
  responses. Adding one field to the two existing answers is smaller.
- **No application code changes.** The merge is the core backend's job. If the
  case shows the merge is broken, that is a finding with its own ticket.

## Steps

1. **`actions/cart.ts` — keep the backend label on the add, and say less.**
   - `watchCartAdd` reads `response.headers()["x-market-backend"]` in the
     **synchronous** part of `onResponse`, before `response.text()`, so the
     label is set by the time the bag badge grows. It exposes
     `backend: () => string` (`""` when no answer came or the answer carried no
     label).
   - `said()` no longer quotes a slice of the raw body. It parses the answer and
     quotes only `success` and `message`. Only when the body is not JSON does it
     fall back to the first 400 characters, and then through `redact()`
     (`harness/redact.ts`). Reason: `redact()` masks known values only, and a
     cart answer can carry a name, an address or a phone in another format.
   - The fixed words "the core backend" become the real label. When the label is
     `""`, the text says "an answer with no backend label (a proxy failure, or
     no market answer)". This changes the two strings at `cart.ts:266`
     ("the core backend was never asked" → "the cart backend was never asked")
     and `cart.ts:369-372` (the throw in `addOpenProductToBag`).
   - `addOpenProductToBag` returns `backend` in its result (`""` on the
     `addable: false` path).
   - `addQaProductToBag` returns `{ bought, backend }`. Existing callers read
     only `bought`, or nothing, so they are not affected.
2. **`actions/cart.ts` — keep the backend label on the bag reads.**
   `CartMoneyAnswer` gains `backend: string`, read from the same header in
   `watchCartMoney`'s `onResponse` and used in both the parsed and the
   unreadable-body branch. `said` appends `(backend=<label>)`, or
   `(no backend label)` when it is `""`. Existing callers read other fields
   only.
3. **`actions/cart.ts` — two small readers.**
   - `bagLineQuantity(page, name): Promise<number | null>` reads
     `cart.quantity(line).inputValue()` for the named line (the field is a
     disabled `<input>`, so `textContent` is always empty — see
     `changeLineQuantity`). Returns `null` when the line draws no quantity
     field.
   - `bagLineNames(page): Promise<string[]>` returns every line name the drawer
     shows, in **one** `allTextContents()` call on
     `cart.lineName(cart.lines(page))`, trimmed. No per-index waits. Call it
     only after the drawer's read is proven finished (step 4.6).
   - `waitForGoodRead(watch, which, { after, deadline })` — the bounded loop
     that steps 4.6 and 4.9 share. It calls `watch.waitForAnswer(which, {
     after, timeout: Math.max(0, deadline - Date.now()) })` again after every
     `401`, and stops at the first answer that is not a `401`, or at the
     deadline. It returns `{ answer, sent, seen401 }` and never throws; the
     caller words the failure. It judges the **latest** answer after `after`
     at each wake-up; a `500` followed by a `200` inside one wait is judged as
     the `200`. That small gap is accepted and stated in the helper's comment.
4. **`selectors.ts` — the drawer's "read finished" marker.** New
   `cart.orderBar(page)` → `getByTestId("order-bottom-button")`
   (`components/Cart/OrderButton.tsx:258`). The drawer draws `OrderButton` only
   when `!cart_loading && cartShippingSuccess === null`
   (`components/Cart/index.tsx:448`), and `cart_loading` starts `true` on every
   page load (`store/Cart/reducer.ts:109`). So this element is on screen only
   after the drawer's **own** read came back without an error. The comment says
   so.
5. **`shopper.live.spec.ts` — the `BUY-05` case**, after `BUY-04`, in
   `test.describe("BUY-05 a guest's bag survives sign-in", …)`. It inherits the
   file's `beforeEach` (skips when the account or the QA seed is missing).
   `test.setTimeout(15 * 60 * 1000)` — see **Time budget**. Two describe-level
   variables, kept apart as BUY-04 keeps `openBag`: `opened` (the context and
   page, set as soon as the context exists) and `lineInBag` (the clean-up flag,
   with the line name). Country `CASH_ON_DELIVERY_COUNTRY` (`sy`) for every
   step. `snapshotCredentials` is imported from `harness/session.ts`. Steps,
   each a `test.step()`:
   1. *"the shopper signs in to clear the bag"* — `gotoAbout`, `attemptAuth`
      (login, Shopper A), `requireSignedInShopper`. Record `accountId`; assert
      it is not `null`. `Escape`, `waitForRenewalSettled`, `gotoHome` — the
      BUY-01 shape (`shopper.live.spec.ts:331-335`), so no widget left open can
      cover the navigation.
   2. *"the account's bag starts empty"* (AC-1) — `emptyTheBag`. It already
      judges each removal after core re-priced it, and quotes core.
   3. *"signing out leaves a guest"* (AC-2) — `waitForRenewalSettled`,
      `snapshotCredentials`, `signOutAndSettle`, then `signedInSession`. Three
      checks, each with its own message:
      - `accountId` is not `null` — "the app named no visitor after sign-out"
        (`signedInSession` returns `null` / `false` when `/api/auth/me` fails,
        so the next two checks alone could pass on a failed read; a real guest
        always has an id, `app/api/auth/register-device/route.ts:118-124`);
      - `phoneVerified` is `false`;
      - `accountId` differs from step 1's.
   4. *"the guest puts the QA product in the bag, and the gateway takes it"*
      (AC-3) — `addQaProductToBag`. Assert `backend === "gateway"`; the message
      quotes the label, or says the answer carried none. Then `openCart`,
      `bagLineName` → `lineName`. **The bag's own string is the name from here
      on** — the product-page title is a different string and is never compared
      with it (`cart.ts:1916-1927`). `bagLineQuantity(page, lineName)` →
      `guestQuantity`, which must be a number ≥ 1. `closeCart`. **Set
      `lineInBag = lineName` here**, before the second sign-in starts.
   5. *"the guest signs in from the navigation"* (AC-4) — `attemptAuth` (login,
      Shopper A; it opens the navigation login widget), then
      `requireSignedInShopper` with `outcome`. Its message already quotes the
      backend legs the app says did not land. Assert `accountId` equals step
      1's. Then `Escape`, `waitForRenewalSettled`, `gotoHome`: a failed wallet
      leg leaves the widget on the PIN screen (`auth.ts:851-862`, AUTH-01), and
      the widget would take every `openCart` press and turn the next failure
      into "the cart did not open".
   6. *"core answers the bag after sign-in"* (AC-5) — inside `try { … } finally
      { watch.stop() }`:
      - start `watchCartMoney`; take `mark = watch.seen("shipping")` **after**
        the home page's own load read has had its chance to land and just
        before `openCart` — so the answer judged is the drawer's own read;
      - `openCart`; `waitForGoodRead(watch, "shipping", { after: mark,
        deadline: now + 2 × CART_ANSWER_MS })` (90 s);
      - assert the answer's status is `200`, and its `backend === "core"`;
      - assert `cart.orderBar(page)` is visible — the drawer's own read ended
        without an error.
      On failure the message separates the cases with `sent`: the browser never
      asked; it asked and only `401`s came (with how many); or an answer came
      with the wrong status or label (both quoted, `no backend label` when
      `""`).
   7. *"the guest's line is still in the bag, with the same quantity"* (AC-6) —
      the line `lineName` is visible; `bagLineQuantity(page, lineName)` equals
      `guestQuantity`. The message states both numbers, or says the line is
      missing and lists `bagLineNames(page)`.
   8. *"the bag holds nothing else"* (AC-7) — `bagLineNames(page)` without
      `lineName` must equal `[]`. The message names every extra line. No
      assertion on the line count.
   9. *"removing the line takes it out, and it stays out after a reload"*
      (AC-8) —
      - `removeLineNamed(page, lineName)` (it waits for the re-price and quotes
        core); `closeCart`.
      - `waitForRenewalSettled`; `page.reload({ waitUntil: "load" })`.
      - Inside `try { … } finally { watch.stop() }`: the same sequence as step
        4.6 — start the watcher, take the mark just before `openCart`, bounded
        good read, status `200`, `backend === "core"`, **and `cart.orderBar`
        visible**. Only a drawer whose own read finished can say a line is
        absent: while it loads it draws skeletons and no `one-product` row, and
        on an error it draws an error panel (`components/Cart/index.tsx:323-330`).
      - Only then: `cart.lineNamed(page, lineName)` has count `0`. The message
        quotes that answer's `said`.
      - Clear `lineInBag`.
6. **The `afterEach` clean-up** (AC-9) — the BUY-03 / BUY-04 shape. It never
   fails the case (the case is already red whenever the clean-up has work to
   do):
   - Returns at once when `opened` is `null`. Otherwise it takes `opened` and
     sets it to `null`, and everything below runs inside `try { … } finally {
     await context.close() }`, so the context is closed on a pass and on every
     failure.
   - When `lineInBag` is clear, there is nothing more to do.
   - Otherwise it asks `signedInSession(page)`. **"Signed in" means
     `phoneVerified === true` and `accountId` equals step 1's id.**
     - **Signed in** (the case failed at or after step 5 — core may have merged
       the bag even if a sign-in leg failed, `auth.ts:851-856`): run
       `emptyTheBag(page)` inside `try`. A failure is recorded as a
       `testInfo.annotations` entry of type `bag left behind`, text through
       `redact()`, saying the account's bag may still hold "`<line>`" and the
       next `BUY-01` / `BUY-04` empties it first.
     - **Not signed in** (the case failed during step 4, or the second code was
       refused): record a `bag left behind` annotation naming both possible
       states — the line is in a throwaway **guest's** bag that no other case
       uses, or the code was refused and nothing was merged. It does not spend
       a third code to find out.
7. **The file header of `shopper.live.spec.ts`** — add `BUY-05` to the case
   list. Correct the code count: a run spends **four** one-time codes —
   `BUY-01`, `BUY-03`, and two by `BUY-05` — and say why BUY-05 needs its own
   two (OQ-1). (The present text "One one-time code is spent per run, by
   BUY-01" is already wrong, because BUY-03 signs in too,
   `shopper.live.spec.ts:799-804`.) Add BUY-05 to "What this run costs
   staging", and say that the clean-up empties the **whole** bag of Shopper A,
   so that account is for this suite only.
8. **`docs/testing/E2E_SCENARIOS.md`** (AC-11) — the money-path summary row
   becomes "BUY-01 to BUY-05"; the code-cost paragraph says four codes (BUY-01,
   BUY-03, two by BUY-05); a `BUY-05` row goes after `BUY-04`, in the same shape.
9. **Before the first run — the code budget for the whole `/verify` session.**
   `/verify` spends about **nine** codes on `TEST_ACCOUNT_PHONE`: AC-9 proof
   run 1 = 1, proof run 2 = 2, BUY-05 alone = 2, the whole file = 4. Confirm,
   and record in `verify.md`:
   - that `TEST_ACCOUNT_PHONE` is on staging's `OTP_TEST_PHONES` allow-list
     (our Redis limiter);
   - the core backend's own send limit for that number **per time window**,
     if it has one.
   If nine sends in one session could lock the number, **stop and ask the
   owner** — a lock stops every Shopper A spec, for CI and for other people
   too. Space the runs out: at least the send cooldown (`OTP_COOLDOWN_SECONDS`,
   default 60 s) between the end of one run and the start of the next.
10. **Run** — `pnpm e2e:health`, then the case alone:
    `tsx tests/e2e/cli.ts run --lane=account shopper[.]live[.]spec[.]ts --grep BUY-05`.
    Then the whole file once, to show BUY-01..BUY-04 still pass beside it.
    Record how long each code send took, BUY-05's own time, and the
    account-lane time.

## Files to change

- `tests/e2e/shopper.live.spec.ts` — the new `BUY-05` describe, case and
  `afterEach`; the header comment (case list, code count, cost, account use).
- `tests/e2e/actions/cart.ts` — `watchCartAdd` keeps the backend label and
  quotes only `success` / `message`; the two fixed "core backend" strings;
  `addOpenProductToBag` and `addQaProductToBag` return the label;
  `CartMoneyAnswer` gains `backend`; new `bagLineQuantity`, `bagLineNames`,
  `waitForGoodRead`.
- `tests/e2e/selectors.ts` — new `cart.orderBar`.
- `docs/testing/E2E_SCENARIOS.md` — the BUY-05 row and the two text updates.

No application file, no protected runtime path, and no lane list changes
(`shopper.live.spec.ts` is already in `ACCOUNT_LANE`).

## Integration surface

- **Components / shared config touched:** the shared bag helpers in
  `tests/e2e/actions/cart.ts` (`watchCartAdd`, `addOpenProductToBag`,
  `addQaProductToBag`, `watchCartMoney` / `CartMoneyAnswer`); the shared
  selector map `tests/e2e/selectors.ts` (one addition); the shared staging
  account Shopper A (`TEST_ACCOUNT_PHONE` / `TEST_ACCOUNT_OTP`) and its bag; the
  QA product from the seed (`readQaSeedState`); the one-time-code budget of that
  phone number.
- **Who else depends on them:**
  - `addQaProductToBag` — `BUY-01`, `BUY-02`, `BUY-03`, `BUY-04`
    (`shopper.live.spec.ts`) and `orderRating.live.spec.ts`. They read only
    `bought`, or nothing.
  - `addOpenProductToBag` — only `addQaProductToBag` calls it.
  - `watchCartAdd` `said()` text — appears in failure messages of every case
    that adds to the bag. The wording changes (real label, `success` /
    `message` only); no assertion reads it.
  - `watchCartMoney` — `emptyTheBag`, `removeLineNamed`, `changeLineQuantity`,
    `BUY-03`'s money checks. They read `seq`, `status`, the money numbers and
    `said`.
  - `selectors.ts > cart` — every bag action. The change only adds a key.
  - Shopper A's phone number and session — every spec in the account lane that
    signs in as Shopper A or opens a jar saved for it (`auth`, `profile`,
    `comments`, `wishlist-signed-in`, `session-recovery`, `orderRating`,
    `stories`).
- **Overlapping flows:**
  - BUY-05's sign-out runs the same `/api/auth/logout` path `AUTH-03` runs. That
    route clears this browser's cookies and detaches the FCM token
    (`app/api/auth/logout/route.ts:95-131`); it does not revoke the account's
    other sessions, so jars saved by other specs stay valid.
  - BUY-05's two sign-ins mint two new token pairs for Shopper A. They do not
    touch the pairs in other contexts or in saved jars. Only
    `shopper.live.spec.ts` reads `SESSION_STATE.shopper`, and BUY-05 runs last
    and neither reads nor writes it.
  - The bag is the account's bag. BUY-01, BUY-04 and `orderRating`
    (`orderRating.live.spec.ts:199-201`) empty it before they add, so a line
    BUY-05 leaves after a killed run cannot change their result. A local run
    at the same time as a CI run on Shopper A can still empty the other run's
    bag; the header note says the account is for this suite only.
  - The code sends share one cooldown per phone number with BUY-01, BUY-03 and
    every later Shopper A sign-in in the lane (`sendOtpWithRetry`,
    `actions/auth.ts:589-614`).
- **Ordering / lockstep dependencies:**
  - Steps 1–4 (helper and selector changes) land in the same change as step 5;
    the case reads the new fields.
  - BUY-05 runs after BUY-04 in the same file on one worker. It opens its own
    context and uses no saved session.
  - Step 9's check comes before step 10's first run.
- **What breaks if this is wrong:**
  - A wrong header read in `watchCartMoney` would make `said` wrong in BUY-03 /
    BUY-04 messages (text only; no assertion there reads `backend`).
  - A changed return shape of `addQaProductToBag` that drops `bought` would
    break BUY-01/03/04 and `orderRating`. `typecheck` catches that.
  - A code limit below four sends per run would make a **later** sign-in in the
    lane fail with a message that blames the core backend. Step 9 checks this
    first.
  - The account lane has an 85-minute `globalTimeout` (`playwright.config.ts:82`)
    and a 100-minute CI job cap (`e2e-lane.yml:82`). BUY-05 adds about 3–5
    minutes on a normal run and up to its 15-minute limit in the worst case. A
    lane that runs out of time leaves the last cases unstarted, and BUY-05 is
    near the end of its file.

## Time budget

`test.setTimeout(15 * 60 * 1000)` — the same as BUY-01. The default is 120 s
(`playwright.config.ts:60`), which a healthy BUY-05 run exceeds.

**This is a limit, not a sum of the worst cases.** The worst waits the steps
name add up to more than any one run meets:

| Wait | Worst case |
|---|---|
| 2 sign-ins × (`VERIFY_ANSWER_MS` 60 s + `SIGNED_IN_ANSWER_MS` 45 s) (`auth.ts:308`, `:315`) | 210 s |
| 2 code sends × `SEND_OTP_MS` 20 s, plus widget screen waits | about 60 s |
| 1 sign-out (`auth.ts:1093` 20 s, `:1100` 25 s, `:368` 30 s) | 75 s |
| 5 bag waits × `CART_ANSWER_MS` 45 s (`cart.ts:40`) | 225 s |
| 2 bounded good-read loops × 90 s | 180 s |
| 4 navigations and 1 reload × `navigationTimeout` 45 s | 225 s |
| **Sum** | **about 16 minutes** |

A healthy run takes 3–5 minutes. Fifteen minutes covers a slow run with one or
two code cooldowns (about 60 s each). A run that meets every worst case at once
fails on the limit, and Playwright names the step it was in. `sendOtpWithRetry`
can sleep much longer than one cooldown — see **Findings recorded, not fixed
here**.

## Tests

The acceptance criteria are about a new browser case, so the tests are the case
itself. Searched `tests/e2e/*.spec.ts`, `tests/**/*.test.ts(x)` and
`docs/testing/E2E_SCENARIOS.md` for a guest bag followed by a sign-in: none.
`shopper.live.spec.ts` is the money-path file and already holds `BUY-01..04`,
so every row is `extend` on that file (OQ-6).

| AC    | Existing coverage found | Disposition | Test file | Test case / name |
|-------|-------------------------|-------------|-----------|------------------|
| AC-1  | `shopper.live.spec.ts::BUY-01` "the bag starts empty" — signed-in bag only, not followed by a guest | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the account's bag starts empty" |
| AC-2  | `auth.live.spec.ts::AUTH-03` signs out, but does not check the visitor is a guest by `phoneVerified` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "signing out leaves a guest" |
| AC-3  | `BUY-02` adds as a guest but never reads the backend label | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the guest puts the QA product in the bag, and the gateway takes it" |
| AC-4  | `BUY-01` signs in from a guest with an empty bag | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the guest signs in from the navigation" |
| AC-5  | none — searched `tests/e2e` for `x-market-backend` on a cart path (only wishlist, shop info, shop locations read it) | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "core answers the bag after sign-in" |
| AC-6  | none — searched `tests/e2e` and `tests/` for a guest bag read after sign-in | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the guest's line is still in the bag, with the same quantity" |
| AC-7  | none — same search | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the bag holds nothing else" |
| AC-8  | `BUY-04` "removing the line takes that product out of the bag" — no reload after | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "removing the line takes it out, and it stays out after a reload" |
| AC-9  | `BUY-04`'s `afterEach` empties the bag for BUY-04 only | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-05`'s `test.afterEach` clean-up |
| AC-10 | n/a — a property of the BUY-05 case itself | extend | `tests/e2e/shopper.live.spec.ts` | every `BUY-05` step: own `test.step`, own message, no count, no credential — checked by reading the diff at `/verify` |
| AC-11 | none — `E2E_SCENARIOS.md` lists BUY-01..04 only | extend (docs row, no runner — checked by reading the file at `/verify`) | `docs/testing/E2E_SCENARIOS.md` | `BUY-05` row |

**How AC-9 is proven.** A clean-up path is only proven when it has run. At
`/verify`, run BUY-05 twice with a temporary local failure:

1. right after `lineInBag` is set in step 5.4 (a guest holds the line) — see the
   "not signed in" branch record its `bag left behind` annotation;
2. right after the accountId check in step 5.5 (signed in, the line merged) —
   see the "signed in" branch empty the account's bag, and no annotation.

The injected line is `throw new Error("AC9-PROBE")`, and it is removed after
each run. It is never committed: before any commit, `/verify` runs
`git diff --cached | grep -c AC9-PROBE` and records `0` in `verify.md`. Both run
outputs go into `verify.md`. Both runs count in step 9's code budget.

## Validation strategy

- Validation profile: `logic-change` (`lint`, `typecheck`, `unit-tests`, all at
  `all-ac`).
- Profile source: `pre-existing` — `.claude/project-config.yaml` already carries
  it. This ticket does not touch that file.
- **Why this profile.** `typecheck` proves the new return fields do not break
  any caller of the shared helpers. `lint` covers the changed files. The unit
  suite holds the lane guard (`tests/harness/qaHarness.test.ts`). No
  user-visible string changes, so the translation check has nothing to see.
  Nothing crosses a server/client boundary, so `build` would prove nothing new.
- **The browser case is in no profile** — the browser suite gates no pull
  request and is red whenever staging is down. `/verify` runs it by hand and
  records the exit code and the output per `AC-n`:

  ```
  pnpm e2e:health
  tsx tests/e2e/cli.ts run --lane=account shopper[.]live[.]spec[.]ts
  ```

  `e2e:health` runs first, because a red run with staging down says nothing
  about this change. A declared case that never ran is a failed verification.
  Always through `cli.ts`, never `playwright test` with a hand-set environment,
  so the staging guard (`harness/guard.ts`) applies.
- `/verify` also records the measured account-lane time against the 85-minute
  `globalTimeout`, and says so in `verify.md` when less than about 15 minutes of
  margin is left.

## Findings recorded, not fixed here

Outside this plan's changes, so `/implement` records each one as a finding and
`/verify` carries it into `verify.md > Findings`. Not ticketed yet (one active
work item).

- **Unredacted cart bodies in other messages.** `cart.ts:1450`, `:1817` and
  `:2062` put raw answer text into failure messages without `redact()`.
- **`watchCartAdd` listener left on after a throw.** `addOpenProductToBag` calls
  `stop()` only on its normal exits (`cart.ts:298-378`). Harmless, because the
  context closes.
- **`sendOtpWithRetry` has no upper limit on its sleep.** It sleeps for the
  first number it finds in any error text, up to five times per sign-in
  (`auth.ts:594-608`). An error text holding `502` gives an 8.4-minute sleep,
  and the case then ends on its own time limit instead of naming a step. Every
  signing-in case shares this.

## Rollback

- Revert the commit. The change is test code and one docs file; no application
  behaviour, config or data schema changes.
- If a run leaves the QA product in Shopper A's bag, the next `BUY-01` or
  `BUY-04` empties it before it starts.

## Out of scope

- Any application code change, including a fix if the merge is found broken
  (that becomes `BUG-n` and its own ticket).
- The verify panel inside the bag as the sign-in entry.
- Merging two non-empty bags (GV-4), and a product that is in both bags.
- Checking colour / size after sign-in.
- Judging the chat / stories / comments / wallet sign-in legs (`AUTH-01`).
- Refactoring `changeLineQuantity` to use `bagLineQuantity`.
- Fixing the three items under **Findings recorded, not fixed here**.

## Panel findings addressed

### Round 1 (revision 2)

| Reviewer | Severity | Finding | Where it landed |
|---|---|---|---|
| senior | major | Line name compared with the product-page title → false red | Step 5.4: the bag's own name only |
| senior | major | AC-8 "gone after reload" passes on a failed or unfinished read | Step 5.9 (tightened again in round 2) |
| performance | major | No `test.setTimeout`; 120 s default | Step 5, **Time budget** (raised in round 2) |
| senior | minor | AC-2 passes when `/api/auth/me` fails | Step 5.3: `accountId` not null |
| senior | minor | Code count is four, not three (BUY-03 signs in) | Steps 7, 8 |
| perf / security / senior | minor | Code cooldown and limit on one phone number | Step 9, Time budget, Integration surface |
| perf / senior | minor | AC-5 loop unbounded; tell "never asked" from "only 401s" | Step 3 `waitForGoodRead`, step 5.6 |
| performance | minor | `watchCartMoney` not stopped | Steps 5.6, 5.9: `finally { stop() }` |
| performance | minor | Backend label set asynchronously | Steps 1, 2: read before `.text()` |
| security / senior | minor | Empty label and fixed "core backend" words | Steps 1, 2 |
| security | minor | Clean-up misses a bag merged before a leg failed | Step 5.4 (flag before sign-in), step 6 |
| senior | minor | Unreachable re-throw in the clean-up | Step 6: annotation only |
| security | minor | Cart body in `said()` not redacted | Step 1 (tightened in round 2); other sites under **Findings recorded** |
| performance | minor | Lane margin shrinks | Integration surface, Validation strategy |
| performance | info | `watchCartAdd` leak on throw | **Findings recorded** |
| security | info | Clean-up empties the whole account bag | Step 7 header note |
| senior | info | BUY-02 missing from callers | Integration surface |
| senior | info | `snapshotCredentials` lives in `harness/session.ts` | Step 5 |

### Round 2 (revision 3)

| Reviewer | Severity | Finding | Where it landed |
|---|---|---|---|
| senior | major | AC-8 can judge the page-load read while the drawer still loads, so "no line" passes on skeletons | Step 4 `cart.orderBar`; steps 5.6 and 5.9: mark taken just before `openCart`, and `orderBar` visible before any absence check |
| performance | minor | Time budget sum wrong; 12 min too short | **Time budget**: 15 min, table, "a limit, not a sum" |
| performance | minor | `sendOtpWithRetry` sleep has no upper limit | **Findings recorded** (shared helper, not changed here) |
| performance | minor | Loop overruns its deadline by one 45 s wait | Step 3: `timeout: Math.max(0, deadline - Date.now())` |
| performance | minor | AC-7 per-index loop unbounded, 45 s per extra index | Step 3 `bagLineNames`: one `allTextContents()` call |
| perf / security | minor | `/verify` spends about nine codes, not four | Step 9: session total, per-window limit, spacing |
| senior | minor | Widget may stay open after a failed leg and block `openCart` | Steps 5.1, 5.5: `Escape`, `waitForRenewalSettled`, `gotoHome` |
| senior | minor | Nobody closes the context on a pass or an early failure | Steps 5, 6: `opened` kept apart from `lineInBag`; `finally { close }` |
| senior / security | minor | "Signed in" undefined in the clean-up; annotation names the wrong bag; AC-9 text too strong | Step 6: defined as `phoneVerified` + same id; two annotations; `spec.md` FR-8 / AC-9 reworded |
| security | minor | `redact()` masks known values only | Step 1: quote `success` / `message` only |
| security | minor | The AC-9 probe could be committed | **How AC-9 is proven**: `AC9-PROBE` token and a staged-diff check |
| senior | info | Loop judges the latest answer, not the first | Step 3: stated in the helper's comment |
| senior | info | `watchCartMoney` label was never set late | Step 2: kept; harmless |
| security | info | Annotation text reaches uploaded reports | Step 6: through `redact()` |
