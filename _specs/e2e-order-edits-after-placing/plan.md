---
ticket: e2e-order-edits-after-placing
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-26
links:
  clickup:
  github:
---

# Plan — e2e-order-edits-after-placing

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Add **one** browser case, `ORD-01`, to `tests/e2e/shopper.live.spec.ts`, in its
own `test.describe` with its own `afterEach`. It is one test with one
`test.step()` per action, like `BUY-01`, because the order must live across every
step. It places the order with the same shared actions `BUY-01` uses (no copy of
`BUY-01`, and `BUY-01` itself is not changed). The new shopper actions (change
address, hide, open hidden view, restore, cancel line) go into
`tests/e2e/actions/orders.ts`, next to `attemptCancelOrder`, and follow its shape:
each returns what it found and never throws on a refusal. The order screens get
stable `data-pw` hooks for every control the case presses.

Why this and not a new spec file (OQ-3): `shopper.live.spec.ts` already owns the
order unit — it places and cancels orders, and it holds the probe-address helpers
(`addressProbeBody`, `readSavedAddresses`, `ADDRESS_PROBE_MARKER`) that this case
needs. A second file for the same unit is a defect under PL-14, and moving those
helpers out would be a refactor nobody asked for. The previous order ticket
(`e2e-guest-cart-survives-sign-in`, `BUY-05`) made the same choice.

## Answers to the deferred questions

- **OQ-3 — where the case lives.** `extend` on `tests/e2e/shopper.live.spec.ts`
  (reasons above). The order is placed through the existing shared actions
  (`emptyTheBag`, `addQaProductToBag`, `openCart`, `goToCheckout`,
  `chooseCashOnDelivery`, `confirmShippingAndPayment`, `placeOrder`,
  `gotoOrdersFromSettings`, `findOrderInList`, `openOrderFromList`). No new
  "place an order" helper: each of those steps is already one call plus its own
  check, and a wrapper would hide which one failed.
- **OQ-6 — teardown.** The `afterEach` is **the** clean-up for this case. The
  `orders` fixture's net is not enough, for two reasons:
  - **It may not see a hidden order.** It finds packs through
    `getOrdersByOrderGroupID`. A code comment says that answer leaves hidden packs
    out (`OrderItemOptions.tsx`: "getOrderDetails drops the now-hidden pack"), and
    the order page does no filtering of its own, so the filter would be the
    backend's. This is **probable, not proven**; `/verify` confirms it in the AC-9
    run. The teardown order below is safe either way.
  - **Its session is stale.** The fixture saves `context.storageState()` at
    `orders.register` time. `ORD-01` keeps working for many minutes after that;
    the access token lives 60 s and each refresh token works once. By the time
    the fixture runs, its refresh token is spent, its cancel gets a 401, the
    refresh is refused, and it cancels nothing.

  So the test body does **not** close its own context. It hands `{ context, page }`
  to the hook through a describe-level `openSession`, exactly as `BUY-03` does.

  **Time.** In Playwright, `afterEach` and the fixture teardown share the test's
  own timeout, so a case that dies by timeout would leave the hook no time. The
  case sets `test.setTimeout(15 * 60 * 1000)`, as `BUY-01` does
  (`shopper.live.spec.ts:317`). The **first line** of the hook adds its own time,
  as `BUY-05` does (`:1695`): `testInfo.setTimeout(testInfo.timeout + 6 * 60 * 1000)`.
  Six minutes is the worst case measured from the code: one `throughProxyInPage`
  call can be three requests (send, `/api/auth/refresh`, send again), each with a
  fresh 15 s limit (`orderCleanup.ts:136-180`), so one call can take 45 s, and the
  hook makes about eight. To keep the calls that matter first, the reads that only
  **check** (the address list, `getHiddenOrders`) pass `timeout: 10_000`; the
  restore, cancel and delete keep the 15 s default.

  The `afterEach` then runs, in this order, through that live page:
  1. if the order may be hidden → `PATCH /customer/order/{packId}/visibility`
     `{ is_hidden: false }` for each pack id recorded before the hide;
  2. if the order was not cancelled through the screens → `cancelOrderGroup`,
     then `orders.release(groupId)` when every pack was handled;
  3. put the account's original default address back if it moved (as `BUY-03`),
     then read the list and record whether the original is the default again
     (`restored`);
  4. delete the probe **by the `probeId` the add call returned, and only when
     `restored` is true** — never by title, and never while the probe is the
     default. This is `BUY-03`'s guard (`shopper.live.spec.ts:729-738`). Then
     read the list and assert the probe id is gone. When `restored` is false,
     the probe is left in place and an annotation says so;
  5. in a `finally`: if the order is still registered (not released), call
     `orders.register` again **here**, just before `context.close()`. This is the
     freshest cookie jar the hook can get: every call above may have refreshed
     the token pair in the live page and spent the refresh token an earlier copy
     held. So the fixture's net, the last resort, starts from a live session.
     Then close the context. The session is **not** handed on, because `ORD-01`
     is the last case in the file (see step 6 below).
  Each step reports what it did to `testInfo.annotations` by order number and
  probe title. The order matters: restore before cancel (the net may not see a
  hidden order), and cancel before deleting the probe (the order points at it).
- **OQ-7 — the fields that prove each change.** All read through
  `throughProxyInPage` (the page's own credential, see its header comment):

  | Change | Read | Proof |
  |---|---|---|
  | ids for later steps | `GET /customer/order/getOrdersByOrderGroupID?order_group_id=<g>` right after the order opens | every pack `id`, the one line's `details[0].id`, the pack's `shipping_address` (the address id before the change), `can_update_address`, `can_cancele_order` |
  | address changed | same call after the change | every pack's `shipping_address` equals the probe id |
  | hidden | `GET /customer/order/getHiddenOrders` | a pack with `order_group_id === <g>` and `is_hidden === true` |
  | restored | `GET /customer/order/getHiddenOrders` | no pack with `order_group_id === <g>` |
  | line cancelled | `GET /customer/order/getOrdersByOrderGroupID` | the line with the recorded detail id has `qty === 0`. A line that is missing is **not** a pass: the step fails and says the line was not in the answer |

  The first live run is the real test of these fields. If staging answers with a
  different shape, that is a wrong test, not a bug (`CLAUDE.md > A red test is not
  a bug report`): `/implement` fixes the read and records what staging actually
  sent.

  **Rule for every read-back and every screen check that touches address data
  (SEC-1).** Playwright prints the value it received into the CI log when an
  assertion fails, and the case runs with `stdio: "inherit"` (`cli.ts:566-570`),
  so `redact()` never sees that text — and `redact()` does not mask address text
  anyway (`harness/redact.ts`). So:
  - every compare that touches an address, a recipient or a pack is turned into
    a **true/false first**, and only the boolean is asserted —
    `expect(packs.every((p) => p.shipping_address === probeId), msg).toBe(true)`,
    `expect(shown.includes(probeRecipient), msg).toBe(true)`. Never
    `toHaveText`, `toContainText`, `toEqual` or `toMatchObject` on address data;
  - a message may carry ids, status codes, flags and the backend label — never a
    pack, a `shipping_address_data`, an address row's text, or anything read from
    the account's own addresses;
  - if `shipping_address` turns out to be an object rather than an id, the read
    compares its `id` field, still as a boolean.

## Steps

1. **Test hooks** (FR-10). Add `data-pw` attributes only — no other change:
   - `OrderOptionsMenu.tsx` — the "Change Delivery Address & Note" row
     `change-address-option`; the "Hide This Pack" row `hide-order-option`.
   - `OrderItemOptions.tsx` — the "Cancel This Product" row `cancel-line-option`.
   - `CancelOrderItemWrapper.tsx` — each reason `cancel-line-reason`; the
     Close / Cancel Request button `cancel-line-submit`.
   - `confirmations/CancelOrderItemConfirmationWindow.tsx` — the terms row
     `cancel-line-agree`; the confirm button `cancel-line-confirm`.
   - `ChangeAddressWidget.tsx` — the "Change Request" button
     `change-address-submit` (the address rows already carry `data-pw="Address"`).
   - `ConfirmAddressModal.tsx` — the confirm button `change-address-confirm`.
   - `settings/cards/OrderAddressCard.tsx` — the card `order-address-card`; the
     recipient name `order-address-recipient`.
   The existing hooks are reused: `screen-options-button`, `order-item-options`,
   `confirm-hide-order`, `open-hidden-orders`, `hidden-order-card`,
   `restore-hidden-order`, `confirm-restore`, `order-status`, `order-group-id`.
2. **Selectors** — add the new hooks to `tests/e2e/selectors.ts > orders`, with
   the same one-line "what it is and when it is drawn" comments.
3. **Proxy helper** — in `tests/e2e/harness/orderCleanup.ts`,
   `throughProxyInPage`: accept `method: "PATCH"` and return `backend`
   (`x-market-backend`, `""` when absent) beside `status` and `json`. Both are
   additive; no existing caller changes.
4. **The write watcher — reuse, not a new copy (S-7).** The suite already has
   "wait for the first answer that is not a 401": `watchCommentCall` in
   `tests/e2e/actions/productComments.ts`, already used for core writes
   (`addAddress` passes `backend`). Two additive changes, so the order actions
   can use it:
   - it also matches `PATCH` (today it keeps only `POST` and `DELETE`, so it
     would never see the hide and restore calls);
   - its result gains `label` — the `x-market-backend` value on the answer, `""`
     when absent — so a message names the backend the app says answered
     (NFR-1). Existing callers ignore the new field.
   No new `watchOrderWrite` is written.
5. **Actions** — in `tests/e2e/actions/orders.ts`. Each takes the run's
   `groupId` and **checks it is on its own order before it writes** (SEC-2):
   - **Exact id matching (SEC-2).** A new helper finds a row, card or page by the
     **whole** group id, not a substring: text equal to the id (trimmed), and
     URLs matched with an end anchor, `new RegExp(\`/settings/orders/${id}(?:[/?#]|$)\`)`.
     The new actions use it. `findOrderInList` and `openOrderFromList` get the
     same exact match and anchor — a change to shared code `BUY-01` also uses,
     and a stricter match can only make `BUY-01` more correct.
   - **"Not listed" must prove the list loaded (S-4, P-3).** `findOrderInList`
     swallows its first wait and answers `listed: false` for an empty or unloaded
     list (`orders.ts:72-75`, `:93`). So the absence check in step 8 first asserts
     that **at least one other row** is drawn (the shared account always has
     earlier orders), with its own message, and only then asks for this order
     with `maxScrolls: 0` — the run's own order is the newest, so it is on page
     one, and an absence check need not scroll.
   - `attemptChangeAddress(page, { groupId, recipient })` → `{ offered,
     submitted, confirmed, write }`. Checks the page is `groupId`'s, opens the
     order menu, reports `offered: false` when `change-address-option` never
     appears, picks the row whose text holds the run-tagged probe recipient
     (boolean match, never quoted), presses submit and confirm, waits for the
     write's first non-401 answer.
   - `attemptHideOrder(page, { groupId })` → `{ offered, confirmed, write,
     leftForList }`.
   - `openHiddenOrders(page)` — from the orders list: `screen-options-button` →
     `open-hidden-orders`, and waits for the `?view=hidden` screen.
   - `findHiddenOrder(page, { groupId })` → `{ listed, fullyHidden }` — the card
     is picked by the **exact** id, never `.first()`; `fullyHidden` is the
     `restore-hidden-order` eye in that card's parent.
   - `attemptRestoreOrder(page, { groupId })` → `{ offered, confirmed, write }` —
     presses the eye of the card found by exact id.
   - `attemptCancelLine(page, { groupId })` → `{ offered, confirmationShown,
     write, statusAfter }` — checks the page is `groupId`'s, then the line's
     `order-item-options` → `cancel-line-option` → one reason → submit → agree →
     confirm.
6. **The case** — in `tests/e2e/shopper.live.spec.ts`, a new
   `test.describe("ORD-01 changing an order after it is placed")` holding one
   test, `ORD-01 a shopper moves an order to another address, hides it, restores
   it, and cancels its only line`, with `test.setTimeout(15 * 60 * 1000)` (P-1).

   **It is placed last in the file, after `BUY-05`.** `BUY-04` and `BUY-07` do not
   sign in: they open the session file an earlier case saved
   (`shopper.live.spec.ts:1312`, `:1449`). `ORD-01` signs in for itself, which
   rotates the account's token pair. Placed before them, it would leave that file
   holding a dead pair, and both would fail with a lost session. After `BUY-05`
   no case in the file reads the session file. A comment above the describe says
   this, so nobody moves it up later.

   Steps, each its own `test.step()`:
   1. the shopper signs in (own sign-in, Syria);
   2. the account's default address is noted (id only). **If the account has no
      default address, the step fails** with a message saying so: without one,
      the probe would become the default and the order would go to it. Then a
      probe address titled `${ADDRESS_PROBE_MARKER} ${RUN_TAG} order` is created
      through the API, with the **run-tagged** recipient
      `Trydos E2E Probe ${RUN_TAG}` (SEC-3, S-5). `addressProbeBody` fixes the
      recipient as plain `"Trydos E2E Probe"` (`shopper.live.spec.ts:252`), and
      `BUY-03` uses it, so `ORD-01` spreads its result and overrides only
      `contact_person_name`: `{ ...addressProbeBody(title), contact_person_name:
      probeRecipient }`. The helper does not change. Without the tag, the
      change-address step could pick a probe a killed run left behind. The id the
      add call returns is kept as `probeId`; if the backend made the probe the
      default, the original is put back and checked (AC-2);
   3. the bag starts empty; the QA product goes in; the bag holds one line;
   4. checkout; **the checkout's chosen address is not a probe** — the same
      guard `BUY-01` uses (`chosenAddressTitle` must not hold
      `ADDRESS_PROBE_MARKER`); cash on delivery, confirm, place; the order
      number is registered with the `orders` fixture before it is judged (as
      `BUY-01`);
   5. the order is in the list and opens; the core backend's pack ids, line id,
      and flags are read and kept (OQ-7 row 1);
   6. **the order offers an address change** — `offered` must be true, else the
      message names the core backend and `can_update_address` with the value
      step 5 read (AC-3);
   7. **the core backend holds the probe on the order** (read-back) and **the
      order page shows the probe recipient** — two separate checks (AC-4);
   8. **hiding the order** — the write's first non-401 answer is 2xx from the
      core backend; the list is shown with at least one other row **and** this
      order is not in it (step 5, "not listed"); `getHiddenOrders` lists it as
      hidden — separate checks (AC-5);
   9. **the hidden view shows it fully hidden, and restoring brings it back** —
      the card is found and carries the order-level eye; the restore write is 2xx
      from the core backend; the order is in the list again; `getHiddenOrders` no
      longer holds it (AC-6). Note for `/implement`: the eye
      (`restore-hidden-order`) is a **sibling** of `hidden-order-card`, not inside
      it, so `findHiddenOrder` looks from the card's parent;
   10. **cancelling the only line** — hiding made the app leave for the orders
       list, so the order is opened again from the list first; then `offered`
       (else name `can_cancele_order` and the value read in step 5); the write is
       2xx from the core backend; the core backend's line has `qty` 0; the order
       page status is cancelled (AC-7);
   11. **nothing of the order is still live** — a fresh
       `getOrdersByOrderGroupID` read: every pack reads cancelled and none still
       answers `can_cancele_order: true`. Only then `orders.release(groupId)`
       (AC-8). This read replaces the `orders.swept()` check `BUY-01` makes: the
       fixture fills `swept` only in its own teardown, which runs after the test
       body and after `afterEach`, so a read inside the test always returns `[]`
       and can never fail (FIND-3 below).
   Before every `goto` / reload: `waitForRenewalSettled(page)`; after a popup
   closes: `waitForPopupHistorySettled` (AC-12). Every message names the step
   and, for a read-back or a write, the backend from the app's own label (the
   `label` from `watchCommentCall`, the `backend` from `throughProxyInPage`),
   never a fixed word (AC-11). Every address compare follows the SEC-1 rule
   under OQ-7: booleans only, and no message quotes the account's own address
   text, phone, token or code (AC-11).
7. **The `afterEach`** — as OQ-6 above. After a green run it also asserts the
   other two AC-8 facts: `getHiddenOrders` holds nothing of this group, and the
   probe id is gone from the address list. (The third, "nothing live", is case
   step 11.)
8. **File comments** — the header of `shopper.live.spec.ts`:
   - `ORD-01` in its case list (line 1 onward) and in "What this run costs
     staging";
   - the line "BUY-01 is the only one that places a real order" (`:9`) becomes
     "BUY-01 and ORD-01 are the only ones that place a real order";
   - the code count becomes **five** one-time codes per run, not four (`:99`,
     `:112`), and it says that `ORD-01`'s send is the **fifth in a row on the
     same number**, straight after `BUY-05`'s two, so it is the send most likely
     to wait out a cooldown (P-4). `sendOtpWithRetry` sleeps the cooldown it reads
     from the error (`actions/auth.ts:589-614`), which the 15-minute budget
     covers. Before `/verify`, check that `TEST_ACCOUNT_PHONE` is in
     `OTP_TEST_PHONES` on staging; then only the backend's own per-number
     throttle applies.
9. **Scenario table** — in `docs/testing/E2E_SCENARIOS.md`:
   - a row for `ORD-01` (AC-13), including the manual clean-up for a **killed**
     run from the Rollback section below (SEC-4): the teardown covers a failed
     assertion, not a killed process, and a killed run can leave a hidden, live
     order that nothing else will find;
   - the code count changed from four to five in **all three** places that state
     it (S-6): the money-path summary row (`:12`), "four one-time codes and four
     sign-ins" (`:240`), and "A run spends **four** one-time codes" (`:245`);
   - the summary row (`:12`) no longer says "one real order": two orders per run,
     each cancelled;
   - one line under `BUY-01` recording FIND-3, so the finding lives in a tracked
     doc until it gets its own ticket;
   - after the first green run, the measured `ORD-01` time next to its row
     (P-5).
   The spec file is already in `ACCOUNT_LANE`, so `laneConfig.ts` does not change.

## Files to change

- `components/setting/orders/OrderOptionsMenu.tsx` — two `data-pw` hooks.
- `components/setting/orders/OrderItemOptions.tsx` — one `data-pw` hook.
- `components/setting/orders/CancelOrderItemWrapper.tsx` — two `data-pw` hooks.
- `components/setting/orders/confirmations/CancelOrderItemConfirmationWindow.tsx` — two `data-pw` hooks.
- `components/Orders/ChangeAddressWidget.tsx` — one `data-pw` hook.
- `components/Orders/ConfirmAddressModal.tsx` — one `data-pw` hook.
- `components/settings/cards/OrderAddressCard.tsx` — two `data-pw` hooks.
- `tests/e2e/selectors.ts` — the new hooks under `orders`.
- `tests/e2e/harness/orderCleanup.ts` — `throughProxyInPage`: `PATCH`, and the `backend` label.
- `tests/e2e/actions/productComments.ts` — `watchCommentCall`: also match
  `PATCH`, and return the `x-market-backend` `label` (both additive).
- `tests/e2e/actions/orders.ts` — the new actions; the exact-id helper; the
  exact match and URL anchor in `findOrderInList` and `openOrderFromList`.
- `tests/e2e/shopper.live.spec.ts` — the `ORD-01` describe, test, `afterEach`,
  and header comments.
- `docs/testing/E2E_SCENARIOS.md` — the `ORD-01` row with the killed-run
  clean-up, the code count (three places), the order count in the summary row,
  the FIND-3 line under `BUY-01`, and later the measured time.

No translation file changes: no user-visible string is added or changed.

## Integration surface

- **Components / shared config touched:** seven order-screen components (hooks
  only); the shared proxy helper `throughProxyInPage`; the shared write watcher
  `watchCommentCall`; the shared `tests/e2e/actions/orders.ts` and
  `selectors.ts`; the shared staging shopper account; the QA product's stock;
  the one-time-code budget of that account's phone number.
- **Who else depends on them:**
  - `throughProxyInPage` is called by `BUY-01`'s orphan net (every order case,
    through the `orders` fixture, `harness/orderCleanup.ts` `cancelOrderGroup`),
    `BUY-03`'s address set-up and teardown (`shopper.live.spec.ts`),
    `readShopCurrency` (`actions/cart.ts:1265`, used by `BUY-03`), the seller
    stories actions (`actions/sellerStories.ts:228`), the stories journey
    (`actions/story.ts:100` and `stories.live.spec.ts`, `server: "stories"`). A
    wrong change here breaks the clean-up of every order case, not only this one.
    Both changes are additive and `typecheck` covers every caller.
  - `watchCommentCall` is used by every comment and rating write
    (`actions/productComments.ts`, `actions/productRating.ts`) and by
    `addAddress` (`actions/profile.ts`). Matching `PATCH` too adds calls it can
    see; none of those callers watches an endpoint that is ever sent as `PATCH`,
    so none of them changes what it matches.
  - `actions/orders.ts` and `selectors.ts > orders` are used by `BUY-01`. The
    exact-id match in `findOrderInList` / `openOrderFromList` changes what
    `BUY-01` finds only when a longer id contains its id — which is exactly the
    wrong match it fixes.
  - The QA product's stock: one unit per run, plus one at `/verify` (AC-9 run).
    The seed sets 500 only when it creates the product and never tops it up
    (`harness/qaSeed.ts:153-159`, `:1100`). Whether a cancelled line puts the unit
    back is unknown; `/verify` reads the stock before and after its runs and
    records the answer (P-6).
  - The component unit tests (`OrderOptionsMenu.test.tsx`,
    `OrderItemOptions.test.tsx`, `CancelOrderItemWrapper.test.tsx`,
    `CancelOrderItemConfirmationWindow.test.tsx`, `ChangeAddressWidget.test.tsx`,
    `OrderAddressCard.test.tsx`) render these components; a test that snapshots
    or counts attributes would notice a new one.
- **Overlapping flows:**
  - **`BUY-01`'s probe guard.** `BUY-01` refuses to order when the default
    address title holds `ADDRESS_PROBE_MARKER`. This case's probe carries that
    marker on purpose, so a probe stranded as the default by a killed run stops
    `BUY-01` instead of a real order going to it.
  - **`BUY-03` uses the same probe helpers and the same default-address dance.**
    Both run in the account lane, one worker, so they never overlap in time.
  - **The account lane's credential.** A new sign-in rotates the account's
    token pair. `BUY-04` and `BUY-07` run on a session file an earlier case
    saved, so a sign-in before them would leave that file dead. `ORD-01` is
    therefore the **last** case in `shopper.live.spec.ts`, after `BUY-05`, and it
    does not hand its session on. The other account-lane spec files each keep
    their **own** session file (for example `SIGNED_IN_STATE` in
    `auth.live.spec.ts` and `profile.live.spec.ts`), written by their own
    sign-in, and the lane runs files one after another. So a sign-in at the end
    of `shopper.live.spec.ts` does not touch a file another spec reads.
- **Ordering / lockstep dependencies:** the hooks (step 1) and selectors
  (step 2) must land with the case (step 6) — the case cannot find the controls
  without them. The `throughProxyInPage` change (step 3) must land before the
  `afterEach` uses `PATCH`, and the `watchCommentCall` change (step 4) before
  the hide and restore actions use it. All in one change.
- **What breaks if this is wrong:**
  - A wrong `throughProxyInPage` edit → `BUY-01`'s net cannot cancel a stranded
    order, and a real order stays live on the QA shop. Shows up as a
    `problem` in the `orders` fixture output, and `typecheck` catches a shape
    break.
  - A teardown that deletes the probe before it cancels the order → the backend
    may refuse the delete, and the probe stays on the account. Shows up as the
    "probe still on the account" assertion in the `afterEach`.
  - A teardown that runs cancel before restore → the cancel may see no pack, and
    a hidden live order stays on staging. Proven not to happen at `/verify` (AC-9).
  - `ORD-01` moved above `BUY-04` later → `BUY-04` and `BUY-07` fail with
    "Token is missing" or a guest mid-journey. The comment above the describe
    says why it must stay last.
  - An address assertion written with `toContainText` / `toEqual` → the
    account's real address text reaches the public CI log on a failure. The
    SEC-1 rule under OQ-7 forbids it; `/verify` checks it by reading the diff.
  - A teardown with no time of its own → a case that dies by timeout leaves a
    hidden, live order. The hook's `testInfo.setTimeout` line prevents it.
  - Lane time: about six to eight extra account-lane minutes on a normal night
    (one more sign-in, one more order, about eight proxy reads). On a bad night
    the fifth code may wait out a cooldown first. The lane has run about 30
    minutes, inside `globalTimeout` 85 minutes (`playwright.config.ts:82`) and the
    100-minute job cap; a 15-minute worst case for `ORD-01` still leaves room for
    the account-lane files that run after it.

## Tests

Searched `tests/e2e/*.spec.ts`, `tests/e2e/actions/`, `tests/harness/`,
`tests/components/**/orders/**` and `docs/testing/E2E_SCENARIOS.md` for
`cancel-item`, `change-address`, `visibility`, `getHiddenOrders`, "hide",
"restore". The unit suite covers the screens with fake answers only; the browser
suite covers none of these calls. `shopper.live.spec.ts` owns the order unit, so
every browser row is `extend` on it.

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `shopper.live.spec.ts::BUY-01` places a COD order — but only to cancel the pack | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` steps 1, 3, 4, 5 |
| AC-2 | `shopper.live.spec.ts::BUY-03` creates a probe and restores the default — for the bag, not an order | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step 2, and the `afterEach` default check |
| AC-3 | none — searched `tests/e2e` for `can_update_address`; only `OrderOptionsMenu.test.tsx` (faked) | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step 6 "the order offers an address change" |
| AC-4 | none — searched `tests/e2e` for `change-address` | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step 7 "the core backend holds the probe on the order, and the page shows it" |
| AC-5 | none — searched `tests/e2e` for `visibility`, `getHiddenOrders` | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step 8 "hiding the order" |
| AC-6 | none — same search; `HiddenOrderItem.test.tsx` is faked | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step 9 "restoring the order" |
| AC-7 | none — searched `tests/e2e` for `cancel-item`; `BUY-01` cancels the whole pack | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step 10 "cancelling the only line" |
| AC-8 | `BUY-01` asserts `orders.swept()` is empty — but that check can never fail (FIND-3), so it is not coverage | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step 11 "nothing of the order is still live", and the `afterEach` green-run checks |
| AC-9 | none — no teardown restores a hidden order today | extend | `tests/e2e/shopper.live.spec.ts` | `ORD-01`'s `afterEach`, proven by the injected stop below |
| AC-10 | `OrderOptionsMenu.test.tsx`, `OrderItemOptions.test.tsx`, `CancelOrderItemWrapper.test.tsx`, `CancelOrderItemConfirmationWindow.test.tsx`, `ChangeAddressWidget.test.tsx`, `OrderAddressCard.test.tsx` (and `ConfirmAddressModal` through `ChangeAddressWidget.test.tsx`) | existing — they must stay green; nothing new is written | the six files named | the whole file each, through `pnpm test:run` |
| AC-11 | n/a — a property of the `ORD-01` code | extend | `tests/e2e/shopper.live.spec.ts` | every `ORD-01` step — checked by reading the diff at `/verify`, including the SEC-1 rule: no `toHaveText` / `toContainText` / `toEqual` / `toMatchObject` on address data |
| AC-12 | `renewalGate.ts` / `waitForPopupHistorySettled` exist and are used by `BUY-*`; `watchCommentCall` already waits past a 401 | extend | `tests/e2e/shopper.live.spec.ts`, `tests/e2e/actions/orders.ts`, `tests/e2e/actions/productComments.ts` | every navigation in `ORD-01`; every write through `watchCommentCall` — checked by reading the diff |
| AC-13 | `E2E_SCENARIOS.md` lists `BUY-01..05` only | extend (docs row — checked by reading) | `docs/testing/E2E_SCENARIOS.md` | `ORD-01` row |

**How AC-9 is proven.** A clean-up path is proven only when it has run. At
`/verify`, run `ORD-01` once more with a temporary stop,
`throw new Error("AC9-PROBE")`, placed right after case step 8 (the order is
hidden, the address changed, nothing cancelled). The run must show, in its
annotations: the order restored, the order cancelled by the teardown (not by the
fixture net), the probe deleted, and the default address unchanged. A follow-up
read of `getHiddenOrders` and the address list is recorded in `verify.md`. The
same run also answers the open point under OQ-6: whether
`getOrdersByOrderGroupID` leaves a hidden pack out (read it once while hidden,
before the stop). The stop is never committed: before any commit, `/verify` runs
`git diff --cached | grep -c AC9-PROBE` and records `0`. That run costs one more
one-time code and one more order.

## Validation strategy

- Validation profile: `logic-change` (`lint`, `typecheck`, `unit-tests`, all at
  `all-ac`).
- Profile source: `pre-existing` — `.claude/project-config.yaml` already carries
  it. This ticket does not touch that file.
- **Why this profile.** `unit-tests` runs the six component files of AC-10 and the
  lane guard (`tests/harness/qaHarness.test.ts`). `typecheck` proves the
  `throughProxyInPage` change breaks no caller. `lint` covers every changed file.
  No user-visible string changes, so `i18n-parity` has nothing to see. Nothing
  crosses a server/client boundary, so `build` proves nothing new.
- **The browser case is in no profile** — the browser suite gates no pull
  request and is red whenever staging is down. `/verify` runs it by hand:

  ```
  pnpm e2e:health
  tsx tests/e2e/cli.ts run --lane=account shopper[.]live[.]spec[.]ts --grep "ORD-01|builds or confirms"
  ```

  - **The grep must also match the QA seed (S-1).** `--grep` filters the seed's
    setup project too (`laneConfig.ts:121-125`), and the seed's test is titled
    "builds or confirms this environment's QA shop" (`harness/qaSeed.ts:328`). A
    grep of `ORD-01` alone drops the seed: the run then stops with "No tests
    found", or `ORD-01` skips on `!qaSeedRan()` (`shopper.live.spec.ts:307`) —
    and a skip exits 0.
  - **The exit code is not the evidence.** `/verify` records `ORD-01`'s **own**
    result from the report and requires `passed`. `skipped`, or no `ORD-01` line
    at all, is a failed verification, whatever the exit code says. The same
    applies to the AC-9 run (which must show `failed` with `AC9-PROBE`, plus the
    teardown annotations).
  - **Before either run (S-9):** confirm the account has a default address.
    Run alone, `ORD-01` does not get `BUY-03`'s set-up before it, and staging has
    been seen with addresses and none marked default
    (`orderRating.live.spec.ts:242-249`). Step 2 would then fail on the account's
    state, not the app. Also confirm `TEST_ACCOUNT_PHONE` is in `OTP_TEST_PHONES`
    (P-4), and read the QA product's stock (P-6).

  `e2e:health` first, because a red run with staging down says nothing about
  this change. Always through `cli.ts`, so the staging guard applies. A declared
  case that never ran is a failed verification.
- **The code budget at `/verify`:** the green run and the AC-9 run cost two
  one-time codes and two orders (plus the seed's own sign-in, if it runs its
  short path).

## Rollback

- Revert the one commit. The hooks are attributes only, the helper change is
  additive, and the case is self-contained in its own `describe`, so a revert
  touches no other flow.
- If staging is left with a hidden or live order or a probe address from a
  killed run: restore the pack (`PATCH …/visibility {is_hidden:false}`), cancel
  it (`/customer/order/cancel`), and delete the address marked
  `Trydos E2E Address Probe <tag> order`. The `afterEach` annotations name the
  order number and the probe title.

## Findings

- **FIND-3 — `BUY-01`'s last check can never fail.** `BUY-01` ends with
  `expect(orders.swept()…).toEqual([])` in the test body. The `orders` fixture
  (`tests/e2e/fixtures.ts`) fills `swept` only after `provide(tracker)` returns,
  which is after the test body has finished. So the body always reads `[]`, and
  the check passes even when the net later has to cancel a stranded order. Same
  file-level pattern as the "silent pass" `CLAUDE.md > Testing` forbids. It is
  outside this ticket's files-to-change for code (`BUY-01` is not changed); it is
  recorded under `BUY-01` in `docs/testing/E2E_SCENARIOS.md` (step 9) and needs
  its own ticket after this one closes. `ORD-01` does not copy the check (case
  step 11).

## Out of scope

- Two lines in one order, and hiding or restoring one line (owner decision, OQ-2).
- Changing colour, size or quantity of a line.
- The delivery note (FIND-1) and the cancel reason (FIND-2). The case never types
  a note.
- Any change to `BUY-01`..`BUY-07`, the QA seed, `laneConfig.ts`, or the
  `orders` fixture itself — including the fix for FIND-3.
- Any change to application behaviour.
