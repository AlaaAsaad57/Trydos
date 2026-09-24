---
ticket: checkout-address-totals-and-cart-lines
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-05
links:
  clickup:
  github:
---

# Plan — checkout-address-totals-and-cart-lines

## In plain words

- **What we will do and why:** add tests only, in the two suites that already
  exist, and change no application code. Six unit cases prove the money numbers
  and the line controls. Two live scenarios prove the address choice and the real
  figures on staging. Setup and cleanup go through the backend API; only the parts
  that **are** a criterion go through the screen.
- **Each file and why it changes:**
  - `tests/store/cartReducer.test.ts` — extend, for `AC-5` and `AC-11`.
  - `tests/components/Cart/OrderButton.test.tsx` — **new**; nothing covers that
    component today. `AC-6`, `AC-7`.
  - `tests/components/Cart/QuantutyInput.test.tsx` — extend, for `AC-12`, `AC-13`.
  - `tests/e2e/harness/liveSession.ts` — one new key, `SESSION_STATE.shopper`.
  - `tests/e2e/harness/orderCleanup.ts` — export `throughProxy`; a bare request
    context carries no `MARKET-TOKEN`.
  - `tests/e2e/selectors.ts` — add the missing locators, delete `cart.total`.
  - `tests/e2e/actions/cart.ts` — add eight live steps; adds exports only.
  - `tests/e2e/shopper.live.spec.ts` — `BUY-03`, `BUY-04`, the hand-on, the
    teardowns, and the `BUY-01` guard.
  - `docs/testing/E2E_SCENARIOS.md` — four edits registering the two scenarios.
- **Each criterion and its test:**
  - `AC-1` → `shopper.live.spec.ts::BUY-03` "shows the tapped address" (extend) —
    red if the tap stops moving the default.
  - `AC-2` → same case, "the backend stored it" (extend) — red if `SetDefault`
    stops reaching the core backend.
  - `AC-3` → same case, "the edited title shows" (extend) — red if the edit stops
    reaching the backend.
  - `AC-4` → same file, the `test.afterEach` (extend) — red if the cleanup stops
    running.
  - `AC-5` → `cartReducer.test.ts` "the store keeps the money numbers" (extend) —
    red if a writer rounds, defaults or drops a field.
  - `AC-6` → `OrderButton.test.tsx` "the payable total" (**new**) — red if the
    figure stops coming from the backend total.
  - `AC-7` → same file, "the Normal Price" (**new**) — red if the formula changes
    sign or drops a term.
  - `AC-8` → `BUY-03` "the shipping shown in the bag" (extend) — red if the figure
    stops coming from `total_shipping_cost`.
  - `AC-9` → `BUY-03` "the payable total in the bag" (extend) — red if it stops
    coming from `total`.
  - `AC-10` → `BUY-03` "the shop re-prices" (extend) — red if `SetDefault` stops
    re-reading the totals.
  - `AC-11` → `cartReducer.test.ts` "clears both lists" (extend) — red if either
    filter changes key.
  - `AC-12` → `QuantutyInput.test.tsx` "one more, one fewer" (extend) — red on any
    off-by-one.
  - `AC-13` → same file, "quantity 1 offers delete" (extend) — red if that branch
    changes.
  - `AC-14` → `BUY-04` "plus makes it 2" (extend) — red if plus stops reaching the
    backend.
  - `AC-15` → `BUY-04` "the removed line is gone" (extend) — red if removal stops
    reaching the backend.
  - `AC-16` → `BUY-04` teardown "the bag is left empty" (extend) — red if a
    removal is silently refused.
- **What else touches these files:**
  - `tests/e2e/selectors.ts` is imported by 10 of the 12 spec files;
    `tests/e2e/actions/cart.ts` by 3; `tests/e2e/harness/liveSession.ts` by 6, one
    of which is `shopper.live.spec.ts` itself.
  - `order.SetDefault` has exactly **one** live caller — the checkout sheet. The
    other two are commented out. But the account default it writes is read by
    `PlaceOrder`, which is why the cleanup is a safety matter, not tidiness.
  - `initCart` has **15** call sites, so the store shape `AC-5` asserts is shared
    far beyond the cart drawer. `RoundPrice` has two copies and 113 call places;
    none is changed.
- **Rollback in one line:** revert the commit — every changed file is a test, a
  locator, a harness key or a document — but note `tests/e2e/selectors.ts` is
  currently dirty from another session, so the branch needs a clean base first.
- **Numbers to remember:** fixture total 80, discount 20, shipping 15, so
  "Normal Price" is 85 and the four wrong formulas give 100, 65, 95, 80. `BUY-03`
  795 s, `BUY-04` 585 s, teardown 60 s — **24 minutes** of new ceiling on a suite
  whose `globalTimeout` is 30 min and whose ceiling already sums to 138 min.
  **0** new one-time codes. **10** new staging writes.
- **Plan-check majors and what we did:** 41 majors over three rounds. Two were
  **not reproduced** — both times a lens read a stale git snapshot and claimed
  five dirty files where there is one. One dispute between two lenses over
  Playwright fixture timing was settled from the installed source, in the senior
  lens's favour. Every other major is fixed in this draft, but **round 3's fixes
  reached this draft after the last check round, so no checker has seen them** —
  the two worth the panel's attention are the API-based setup and teardown, and
  whether 24 minutes of new ceiling is acceptable while the expected run duration
  is still unmeasured.
- **Easy to confuse:**
  - `AC-6` is the payable total (`offer-total-price`, needs no click); `AC-7` is
    the "Normal Price" (`cart-total-price`, hidden until `total-expanded` is
    clicked).
  - `AC-8`'s reference is the `/cart/cart_shipping` answer; `AC-10`'s is
    `/cart/cart_overview`. One recorder, two targets.
  - `AC-4` restores the **account**; `AC-16` empties the **bag**. Both are
    `test.afterEach`, and both cases have one.
  - The money figures are in the **cart drawer**; the address is on the
    **checkout screen**. `BUY-03` moves between them, and back again with
    `swiperSlide-backIcon`.
  - Everything is done through the **API** except `AC-3`'s edit — that one is on
    the screen because the edit *is* the criterion.

## Scope reduction — 2026-09-05, owner's decision

**This work item now covers the unit half only: `AC-5`, `AC-6`, `AC-7`, `AC-11`,
`AC-12`, `AC-13`.**

The ten live criteria — `AC-1` to `AC-4`, `AC-8` to `AC-10`, `AC-14` to `AC-16` —
are **deferred to a follow-up work item**. They are not withdrawn and not
weakened; they move unchanged.

**Why.** `implement` measured what the review gate made a precondition, and it
removed the plan's premise. GitHub Actions run `33951875379` is the most recent
run that actually executed the live suite:

```
Timed out waiting 1800s for the test suite to run
3 failed · 5 did not run · 69 passed (30.0m)
```

`1800 s` is exactly the `globalTimeout` in `playwright.config.ts:65`. The suite
already exhausts it and already drops five cases, before this work item adds
anything. The only fix — raising that timeout — needs a file
`plan.md > Files to change` does not list, which `IM-4` forbids. Staging login was
also reported broken the same day, and the three failing cases (`AUTH-01`,
`PROF-08`, `BUY-01`) are the three that sign in.

**What the follow-up inherits.** Everything already learned, so it does not start
cold: the timeout evidence above, the twelve `major` findings in
`review.md > Panel Findings` with their dispositions, the `x-proxy-url` fact
(`F-41`), the closed-context teardown (`review.md` `P-3` / `S-1`), the collapsed
totals row (`F-42`), the missing `swiperSlide-backIcon` locator, and the panel's
`P-4` suggestion to move the bag setup to `/cart/add` and `/cart/remove`.

**What this plan still declares.** Three files, six criteria, one validation
profile:

| File | Disposition | Criteria |
|------|-------------|----------|
| `tests/store/cartReducer.test.ts` | extend | `AC-5`, `AC-11` |
| `tests/components/Cart/OrderButton.test.tsx` | new | `AC-6`, `AC-7` |
| `tests/components/Cart/QuantutyInput.test.tsx` | extend | `AC-12`, `AC-13` |

**Steps 5 to 12 and the six live files are deferred with the criteria they
serve** — `liveSession.ts`, `orderCleanup.ts`, `selectors.ts`, `actions/cart.ts`,
`shopper.live.spec.ts` and `E2E_SCENARIOS.md` are untouched by this work item.
Everything below this line is kept as written, because it is the brief the
follow-up work item starts from.

## Approach

Add coverage in the two suites that already exist, and change no application
code. The unit half seeds the store and renders the two cart components that draw
money and quantity, because the store is where the backend's numbers land
(`F-13`) and the components are where a wrong formula would show. The live half
adds **two** scenarios to the money-path spec that already owns the `BUY-nn`
family (`F-38`), because a real address list and a real re-price cannot be
reached any other way.

Two live scenarios, not three. `BUY-03` already has a bag open, so reading the
money figures costs nothing extra; a third scenario would repeat the whole prefix
for no new signal. `BUY-04` covers the cart lines.

**The money figures are in the bag, not on the checkout screen.** `OrderButton`
is mounted only in the cart drawer (`components/Cart/index.tsx:447`), and the
checkout screen's own totals (`components/Cart/PlaceOrderWidget.tsx:643-648`)
carry no `data-pw` at all. So `BUY-03` reads the figures in the bag first, then
moves to the checkout for the address work, then slides back to the bag to read
the re-priced figures. `spec.md > FR-4`, `FR-5`, `AC-8` and `AC-9` were corrected
at round 2 from "at checkout" to "in the bag".

**Setup and cleanup go through the backend; only the criterion goes through the
screen.** Round 3 showed two reasons. First, a live case closes its own context
in its `finally` (`tests/e2e/shopper.live.spec.ts:357-359`), so a screen-driven
teardown has no page left to drive and simply never runs — leaving the probe as
the account default, which `BUY-01` would post a real order to. Second, driving
the region picker costs up to six 20-second waits
(`tests/e2e/actions/profile.ts:665-708`) to set up something that is not the
behaviour under test. So the probe address is created, restored and deleted
through `throughProxy` (`tests/e2e/harness/orderCleanup.ts:78`), and only the
**edit** — which is `AC-3` itself — is done on screen.

The alternative — one new live spec file — was rejected: `PL-14` treats a second
parallel file for a unit that already has one as a defect, and
`tests/e2e/shopper.live.spec.ts` is that unit's file. It ends at line 413 with 2
cases today; `tests/e2e/profile.live.spec.ts` is 1331 lines with 8, so the file
stays in line with the repository.

## Steps

1. **Extend the store test with the money numbers.** Call `initCart` and
   `setCartPreview` with a backend answer and read the four money fields back.
   Evidence: `F-13`, `F-15`, `F-16`; `store/Cart/reducer.ts:367-400`.
2. **Extend the store test with line removal.** Call `removeFromCart` and read
   both `cart` and `localCart`. The action is untested today; it is **not** the
   case that the two lists can disagree — `initCart` sets `localCart[].item_id`
   from `cart[].id`, so both filters see the same value on that path. Evidence:
   `F-12` (corrected at round 1), `F-34`; `store/Cart/reducer.ts:373-374`,
   `:402-406`.
3. **Add a unit test file for the totals row.** Render `OrderButton` with a
   seeded store. The payable total (`offer-total-price`,
   `components/Cart/OrderButton.tsx:572`) sits **outside** the collapsed block and
   needs no click. The "Normal Price" and shipping figures sit **inside**
   `{expanded && …}` (`:325`) and `expanded` starts `false` (`:41`), so `AC-7`
   clicks `total-expanded` (`:520`) first — and only once, because it is a
   toggle. The
   store must also carry a non-empty `cart` and a `currency` object, because the
   whole row is gated on `cart.length > 0` and `currency.symbol` is read without
   optional chaining. Evidence: `F-42`, `F-43`;
   `components/Cart/OrderButton.tsx:41`, `:267`, `:325`, `:388`, `:520`;
   the seeding pattern is `tests/components/Cart/QuantutyInput.test.tsx:62-70`.
4. **Extend the quantity-control test.** Press plus and minus and read the
   quantity sent to the service; render at quantity 1 and above 1 and read which
   controls exist. Evidence: `F-3`, `F-8`; `components/Cart/index.tsx:503-507`,
   `:732`, `:758`, `:780`.
5. **Add the missing browser locators.** The address sheet
   (`AddressListContainer`), the opener (`addresses-viewer`), the address **title**
   on the checkout (`regular-addresses`), the edit control (`Edit-Addres-Icon`),
   the totals opener (`total-expanded`), the three line controls
   (`PlusIcon_CartPage`, `MinusIcon_CartPage`, `DeleteIcon_CartPage`), the
   quantity field (`QuantityInCart`), the shipping figure
   (`Shipping-RoundPrice`) and the payable total (`offer-total-price`) have no
   entry today. One more is needed: an **address row inside the sheet**, matched
   by `hasText` on the probe title, because every row carries the same `Address`
   marker and the title sits in an unmarked span
   (`components/Cart/AddressListContainer.tsx:93`, `:125`); the pattern is
   `tests/e2e/actions/profile.ts:742`. And one more still: the **back control
   that returns from the checkout to the bag**, `swiperSlide-backIcon`
   (`components/Cart/OrdersPage.tsx:242`), which appears nowhere in `tests/e2e`
   today — `AC-8`, `AC-9` and `AC-10` cannot be carried out without it.
   Evidence: `F-30`, `F-31`, `F-42`; the cart locator block is
   `tests/e2e/selectors.ts:413-448`.
6. **Remove the misnamed money locator and add two honest ones.** `cart.total`
   (`tests/e2e/selectors.ts:430`) returns the figure *before* discount and
   shipping, and has no caller. Round 2 showed that renaming it would leave the
   renamed entry still uncalled, because `AC-9` reads the payable total, which is
   a different element. So: delete `cart.total`, add `cart.payableTotal`
   (`offer-total-price`, `components/Cart/OrderButton.tsx:572`) and
   `cart.normalPrice` (`cart-total-price`, `:377`). Deleting is the smaller
   change and removes the trap outright. Evidence: `F-17`, `F-18`, `F-31`.
7. **Add a shopper session key, and hand it on twice.** `BUY-01` calls
   `forgetSavedSession(SESSION_STATE.shopper)` first — both specs that own a
   session do (`tests/e2e/auth.live.spec.ts:99`,
   `tests/e2e/profile.live.spec.ts:238`) — then hands its session on in its
   `finally`. `BUY-03` opens it and **hands it on again**, because a case that
   does not can leave `BUY-04` with a superseded credential. `BUY-02` sits between
   them and is harmless: it builds its own context with no storage state and never
   writes the file (`tests/e2e/shopper.live.spec.ts:376`). Evidence: `F-48`;
   `tests/e2e/harness/liveSession.ts:54`, `:57`, `:106`, `:134`.
8. **Add the live steps to the cart action module.** Eight steps: a **passive**
   money recorder; the address-list opener (`addresses-viewer`); tapping a row
   matched by title; **editing an address from the sheet** (open
   `Edit-Addres-Icon`, refill `add-address-input`, press save — the checkout edit
   path is `startUpdateAddress` plus `slideNext`,
   `components/Cart/AddressListContainer.tsx:270-273`; `addAddress` cannot be
   reused because it starts on a blank form, `tests/e2e/actions/profile.ts:653`);
   **returning from the checkout to the bag** (`swiperSlide-backIcon`); changing a
   line quantity; removing a named line; and reading the money figures.

   Three rules the recorder must follow, all from round 3:
   - **It watches two targets, not one.** The bag's money on open comes from
     `/cart/cart_shipping` (`getCart` then `initCart`,
     `components/Cart/index.tsx:80-83`); only the re-price after the tap comes
     from `/cart/cart_overview` (`services/order.ts:241`). Each read says which
     answer is its reference.
   - **It stops in a `finally`**, the way `watchCartAdd` does
     (`tests/e2e/actions/cart.ts:203`), so the listener never outlives its step.
   - **Every read waits for the figure's own non-empty text before comparing.**
     `openCart` anchors on `cartPage-container`, which the skeleton shares
     (`F-2`), and the totals row draws nothing until `cart.length > 0`
     (`components/Cart/OrderButton.tsx:267`) — so an early read gives an empty
     string, which `spec.md > C-3` blocks only for `0`.

   **Every new wait passes `CART_ANSWER_MS` explicitly** — a handed-on context
   defaults to a 20 s action timeout (`tests/e2e/harness/liveSession.ts:86-87`)
   and `expect` to 15 s (`playwright.config.ts:61`), so an unqualified wait dies
   at 20 s. The recorder takes its own budget as an argument, bound to the 45 s
   re-price allowance, and polls the way `tests/e2e/harness/session.ts:403-410`
   does. Evidence: `F-37`, `F-41`; `tests/e2e/actions/cart.ts:117-481`, and the
   working `x-proxy-url` match at `:180-184`.
9. **Add `BUY-03` — the money figures, then the address.** In order:

   1. Open the handed-on session in `CASH_ON_DELIVERY_COUNTRY`. That is the
      country the probe address and the shipping figure must both sit in, because
      `startUpdateAddress` overwrites a saved address's country with the URL's
      (`tests/store/cartReducer.test.ts:337`).
   2. **Through the API, before anything else:** read the address list and store
      which id is `is_default === 1`. If none is, record that the account had no
      default and take the "no default" branch in the teardown.
   3. **Through the API:** create the probe with `POST /customer/address/add`
      (`services/order.ts:275`). Unconditionally — so the case always owns
      something of its own to tap and to edit, whatever the account already holds.
      If the create fails, `AC-3` records itself as not covered rather than
      falling back to a real address.
   4. Fill a bag, open it, and read the shipping and the payable total against
      the `/cart/cart_shipping` answer.
   5. Move to the checkout, open the address list, tap the probe, and watch the
      `/cart/cart_overview` re-price with the recorder installed **before** the
      tap — `SetDefault` fires the re-read immediately after the backend accepts
      (`services/order.ts:238-242`).
   6. Return to the bag with `swiperSlide-backIcon` and re-read both figures.
   7. Edit the probe's title on screen. **This is the only part done through the
      UI, because it is `AC-3` itself.**
   8. **Never choose cash on delivery.** With a payment method of `id === 0` in
      the store the payable figure silently becomes `total_cash`, not `total`
      (`components/Cart/OrderButton.tsx:60-65`), and `AC-9`'s reference field is
      `total`.

   **The teardown is `test.afterEach` in this spec, registered with its own
   timeout, and it runs entirely through the API.** Kept local rather than put in
   the shared `tests/e2e/fixtures.ts`, which all 12 specs import — Playwright runs
   `afterEach` and fixture teardown in the same fresh after-hooks slot, so a
   shared fixture buys nothing here. The slot is sized
   `max(project.timeout, case.timeout)`, verified in the installed
   Playwright 1.62.1 worker source, so a body that overruns cannot eat it. The
   steps, in this order:
   restore the original default with `POST /customer/address/set-default`
   (`services/order.ts:232`); **verify it with the list read** and assert hard
   that `is_default === 1` on the original id — the screen alone can lie, because
   `SetDefault` swallows a refusal (`F-28`, `services/order.ts:243-248`); only
   then delete the probe with
   `POST /customer/address/delete?address_id=` (`services/order.ts:355`);
   confirm the probe id is absent in a final list read. **Never delete an address
   that is currently the default.** If the restore cannot be verified, leave the
   named probe, push a test annotation, and fail loudly. Doing all of it through
   `throughProxy` on a request context built from the saved session
   (`tests/e2e/fixtures.ts:88-91`) is what makes it work at all: the case has
   already closed its browser context by then
   (`tests/e2e/shopper.live.spec.ts:357-359`), so nothing can be clicked.
   Evidence: `F-25`, `F-26`, `F-27`, `F-44`; `services/order.ts:74`, `:202`,
   `:232`, `:275`, `:355`; `tests/e2e/harness/orderCleanup.ts:78`.
10. **Add `BUY-04` — changing and removing a cart line.** It presses plus, reads
    the confirmed quantity **after the plus path re-reads the bag**
    (`components/Cart/index.tsx:615-619` — `:570-575` is the *minus* path),
    removes the named line, and empties the bag in a teardown. Evidence: `F-6`,
    `F-8`, `F-10`; `components/Cart/index.tsx:615-619`, `:732`.
11. **Register the two scenarios, and correct what the registration makes
    stale.** Four edits in the register: the two new rows in the case table, the
    case count at the top, the money-path summary row, and the per-run cost
    column. Plus the spec file's own header comment, which lists its cases.
    Evidence: `F-38`, `F-39`; `docs/testing/E2E_SCENARIOS.md:3`, `:12`,
    `:216-218`, `:222`, `:223`; `tests/e2e/shopper.live.spec.ts:1-4`.
12. **Add one guard to `BUY-01`.** Before it places its real order, refuse if the
    account's default address carries the `Trydos E2E` probe marker. A killed run
    can leave a probe behind — the teardown covers a failed assertion, not a
    killed process — and without this guard the next run posts a real order to a
    fake address. `shopper.live.spec.ts` is already a file this plan changes.
    Evidence: `services/order.ts:74`.
13. **Re-read every cited line before using it.** The working tree moved during
    the plan check (see Plan check, Blocker). The owner decided on 2026-09-05 to
    proceed and re-verify at `/implement`. This step is that verification: open
    every `path:line` this plan cites, confirm it still says what the plan says,
    and record any that moved in `implement.md > Deviations` (`EV-9`).

## Files to change

- `tests/store/cartReducer.test.ts` — extend. `AC-5`, `AC-11`.
- `tests/components/Cart/OrderButton.test.tsx` — **new**. Nothing covers this
  component today. `AC-6`, `AC-7`.
- `tests/components/Cart/QuantutyInput.test.tsx` — extend. `AC-12`, `AC-13`.
- `tests/e2e/harness/liveSession.ts` — add one key, `shopper`, to
  `SESSION_STATE`. No existing key changes. **Six files import this module**, not
  two: `auth.live`, `profile.live`, `profile.scripted`, `checkout.scripted`,
  `globalTeardown`, and `shopper.live` (`tests/e2e/shopper.live.spec.ts:100`),
  which is itself a target file.
- `tests/e2e/harness/orderCleanup.ts` — export `throughProxy`
  (`tests/e2e/harness/orderCleanup.ts:78`, currently module-private). `AC-2` needs
  it: a bare request context carries no `MARKET-TOKEN` and none of the
  country/lang headers the core backend reads.
- `tests/e2e/fixtures.ts` — **not changed.** Round 3: a `BUY-03`-shaped teardown
  in a file all 12 specs import buys nothing over a `test.afterEach` in the spec
  itself, because Playwright runs both in the same fresh after-hooks slot. The
  teardown lives in `tests/e2e/shopper.live.spec.ts`.
- `tests/e2e/selectors.ts` — add the locators in step 5; delete the misnamed
  `cart.total` and add `cart.payableTotal` and `cart.normalPrice`.
- `tests/e2e/actions/cart.ts` — add the live steps in step 8. Adds exports only.
- `tests/e2e/shopper.live.spec.ts` — extend. `BUY-01` hands its session on;
  `BUY-03` and `BUY-04` are added.
- `docs/testing/E2E_SCENARIOS.md` — the four edits in step 11.

Not changed, and used as they are: `tests/fixtures/cart.ts` (its `buildCart`
takes overrides), `tests/render.tsx`, `tests/e2e/actions/profile.ts`
(`addAddress` and `removeAddress` are called, not edited),
`tests/e2e/harness/redact.ts`, `tests/setup.ts`.

## Integration surface

- **Components / shared config touched:** none in application code. In test code:
  `tests/e2e/selectors.ts` (search term `cart.total`, `cart-total-price`) is
  imported by **10 of the 12** spec files; `tests/e2e/actions/cart.ts` (search
  term `actions/cart`) is imported by the money-path, guest and scripted-checkout
  specs; `tests/e2e/harness/liveSession.ts` (search term `SESSION_STATE`) is
  imported by `auth.live.spec.ts` and `profile.live.spec.ts`.
- **Who else depends on them:**
  - `cart.total` — **no caller today** (`F-31`, `tests/e2e/selectors.ts:430`), so
    deleting it in step 6 breaks nothing. Three text mentions exist and none is a
    caller: a comment at `playwright.config.ts:87`,
    `docs/testing/E2E_TEST_DESIGN.md:255`, and `docs/posthog-events-mobile.md:205`
    (an unrelated mobile field of the same name). All three name the `data-pw`
    marker or a different thing; the marker itself is not renamed.
  - `tests/e2e/selectors.ts` — two spec files import nothing from it
    (`locale.live.spec.ts:31-32`, `login-design-parity.scripted.spec.ts:21`), so
    "every spec" was wrong. Step 5 adds entries and step 6 renames one unused
    entry; no other entry changes.
  - `tests/e2e/actions/cart.ts` — imported by `shopper.live.spec.ts`,
    `guest.live.spec.ts` and `checkout.scripted.spec.ts`. Step 8 **adds** exports
    only.
  - `tests/e2e/harness/liveSession.ts` — `SESSION_STATE` is a frozen object of
    paths; step 7 adds a key. `globalTeardown` clears the whole directory by
    name, so a new key needs no teardown change
    (`tests/e2e/harness/liveSession.ts:54`).
  - `tests/store/cartReducer.test.ts` and
    `tests/components/Cart/QuantutyInput.test.tsx` — extended, not rewritten. The
    existing cases stay and must still pass.
  - `Edit-Addres-Icon` is also named in a comment at `tests/e2e/selectors.ts:313`
    (search term `Edit-Addres-Icon`), above the settings address locators. The new
    entry must be scoped to the checkout sheet so the two do not collide.
  - `tests/e2e/harness/orderCleanup.ts` — `throughProxy` is used twice inside that
    file (`:129`, `:150`). Exporting it changes no existing behaviour, but the
    file is now in scope, so its two existing callers must still pass.
  - `tests/e2e/fixtures.ts` — the `orders` fixture (`:61`) is used by `BUY-01`.
    Adding a second fixture must not change how `orders` behaves.
- **Overlapping flows:**
  - `order.SetDefault` has exactly **one** live caller, the checkout sheet
    (`F-44`, search term `order.SetDefault`,
    `components/Cart/AddressListContainer.tsx:80`). The two other call sites are
    commented out (`components/Orders/ChangeAddressWidget.tsx:183`,
    `components/settings/PersonalInfoAddress.tsx:172`). The account default it
    writes is still read by `PlaceOrder` (`services/order.ts:74`), which is what
    makes the cleanup in `AC-4` a safety matter and not tidiness.
  - `initCart` has **15** call sites (`F-45`, search term `initCart(`), so the
    store shape `AC-5` asserts is shared far beyond the cart drawer. One of them
    is inside `OrderButton` itself (`components/Cart/OrderButton.tsx:186`), which
    step 3 renders; it sits in an event handler, not on mount.
  - `getCart(` has five production hits the research row missed (search term
    `getCart(`): `components/Cart/PlaceOrderButtons.tsx:95`,
    `components/Cart/OrderButton.tsx:184`,
    `components/Cart/OldCartContainer.tsx:158`,
    `components/Cart/couponElement.tsx:69`,
    `components/Cart/AddToCart/AddToCartComponent.tsx:316`. Only
    `OrderButton.tsx:184` matters here, and it is in a handler, not on mount, so
    step 3's render makes no request.
  - `RoundPrice` exists in **two** copies (search term `RoundPrice(`,
    `utils/functions.tsx:170` and `utils/server/helpers.ts:118`) and the term hits
    36 files / 113 places, not the 7 the research row named — among them
    `components/Cart/index.tsx`, `couponElement.tsx`, `PlaceOrderButtons.tsx`,
    `PaymentMethod.tsx`, `OrdersPage.tsx`,
    `components/ServerWrapper/ProductWrapper/RenderPrice.tsx`,
    `components/Server/product/ProductPrices/ProductPricesWrapper.tsx`,
    `components/ListingPage/FilterItem.tsx`,
    `components/products/ProductCard/index.tsx`. **None is changed here.** `AC-6`
    and `AC-7` render `OrderButton` only and assert its output, so the helper's
    other callers are untouched; the server copy is already covered by
    `tests/utils/server/helpers.test.ts`.
  - `getCart(` also has six test call sites (`utils/functions.test.ts:875`, `:895`,
    `:916`, `:928`, `:938`, `:953`) that the research row missed. None is changed.
  - Several feature documents mention these symbols by name
    (`docs/features/B-cart-checkout-orders/CO-03…CO-10`,
    `docs/market-api-inventory.md:82`, `:92`). None is a caller and none is
    changed.
  - The `DeleteIcon_CartPage` marker is already used by
    `tests/e2e/actions/cart.ts:122` to empty the bag, and it matches one element
    per line, so the new locator must be scoped to a line.
  - `setDefaultAddress`'s placed-order caller is commented out
    (`components/Orders/ChangeAddressWidget.tsx:185`), so the store action has one
    live caller, not two.
- **Ordering / lockstep dependencies:**
  - Step 6 (the rename) and step 9 (`BUY-03`, the only reader of the new name)
    land together. A rename with no reader would leave dead test code.
  - `BUY-03` and `BUY-04` depend on `BUY-01` handing its session on. Playwright
    runs a file's cases in declaration order with `workers: 1`
    (`playwright.config.ts:54`), so the order holds. If `BUY-01` fails before the
    hand-on, the two new cases have no session — the same exposure
    `profile.live.spec.ts` already accepts for `PROF-02..08`
    (`tests/e2e/profile.live.spec.ts:168`).
- **What breaks if this is wrong:** a scenario that leaves a probe address as the
  account default makes `BUY-01` place a **real order to that address** on the
  next run (`services/order.ts:74`). A scenario that leaves a non-empty bag makes
  the next one fail for a reason that looks like a product bug. `AC-4` and
  `AC-16` exist for that, and both run in a `finally`.
- **The tree is not clean, and it is moving.** Round 1's report was dismissed on a
  `git status` that was empty at the time; round 2 disproved that. Now:
  `tests/e2e/selectors.ts` — a target file — and
  `components/skeleton/loaders/FeaturedProductsSkeleton.tsx` are both modified,
  changed at 10:46 and 10:43 while this check was running, by one of two other
  interactive sessions open on this repository. The earlier cart and e2e work
  *is* committed (`79a0d8fb`), but that is not the whole story. Consequences:
  the one-commit rollback claim is weakened, `/implement` has no clean base
  (`IM-3`), and every cited line can go stale. The owner decided on 2026-09-05 to
  proceed and re-verify at `/implement`; step 12 is that verification.

## Answers to deferred questions

> Required (`PL-12`, ADR-013). `spec.md > Open Questions` deferred one question to
> this stage. The answer must carry its id, or the trail from the question to the
> answer is broken.

**`OQ-6` — Which existing unit test file each of `AC-5`, `AC-6`, `AC-7`, `AC-11`,
`AC-12` and `AC-13` extends, and whether any needs a new file.**

Answered by the `PL-14` search recorded in the **Tests** table below. Three files,
not six:

| `AC-n` | File | Disposition | Why |
|--------|------|-------------|-----|
| `AC-5` | `tests/store/cartReducer.test.ts` | extend | The slice already has a test file. Searching it for `initCart`, `setCartPreview` and `total_shipping_cost` returns 0 hits, so the case is missing but the file is not. |
| `AC-11` | `tests/store/cartReducer.test.ts` | extend | Same file, same reason: 0 hits for `removeFromCart` (`tests/services/cart.test.ts:359` is a comment, not coverage). |
| `AC-6` | `tests/components/Cart/OrderButton.test.tsx` | **new** | `tests/components/Cart/` holds only `AddAddressForm`, `AddressListContainer` and `QuantutyInput`. No test imports `components/Cart/OrderButton`, so there is no file to extend. |
| `AC-7` | `tests/components/Cart/OrderButton.test.tsx` | **new** | Same file as `AC-6`. One new file for one untested unit — **not** a second file per criterion. |
| `AC-12` | `tests/components/Cart/QuantutyInput.test.tsx` | extend | The component's file exists and covers the Out-Of-Bag move only (`:76-124`). |
| `AC-13` | `tests/components/Cart/QuantutyInput.test.tsx` | extend | Same file, same reason. |

**No unit criterion gets a second, parallel file.** `PL-14` treats that as a
defect, and the only `new` row is for a unit that has no test file at all. All
three files are listed under **Files to change**, which is what puts them in
scope for `/implement` (`IM-4`).

## Numbers

| Number | Value | Inputs (`path:line`) | Arithmetic |
|--------|-------|----------------------|------------|
| Saved addresses needed | 2 | `spec.md > C-5` (the request itself) | — |
| Quantity after one plus | 2 | `spec.md > C-6`; a line starts at 1 | 1 + 1 = 2 |
| Money fixture — total | 80 | `tests/fixtures/cart.ts:97` (`buildCart` default) | reused unchanged |
| Money fixture — discount | 20 | `tests/fixtures/cart.ts:93` (`buildCart` default `total_discount`) | reused unchanged |
| Money fixture — shipping | 15 | overrides the `buildCart` default of `0` at `tests/fixtures/cart.ts:89` | chosen so shipping is neither the discount nor zero, per `spec.md > AC-7 > Could pass wrongly if` |
| Money fixture — exchange rate | 1 | `currency` must be seeded: the store default is `null` (`store/homepage/reducer.ts:76`), `RoundPrice` multiplies by it (`utils/functions.tsx:195`), and `OrderButton` reads `currency.symbol` without optional chaining (`components/Cart/OrderButton.tsx:388`). Shape copied from `tests/components/Cart/QuantutyInput.test.tsx:67` | rate 1, so the drawn figure equals the stored figure |
| "Normal Price" the fixture must draw | 85 | the rows above; the formula at `components/Cart/OrderButton.tsx:379-383` | 80 + 20 − 15 = 85 |
| Wrong formulas the fixture separates | 4 | same inputs | 80 + 20 = 100; 80 − 15 = 65; 80 + 15 = 95; 80 alone = 80. All four differ from 85 |
| One cart answer allowance | 45_000 ms | `CART_ANSWER_MS`, `tests/e2e/actions/cart.ts:30` | the existing constant, reused, and passed explicitly on every new wait |
| Recorder wait budget | 45_000 ms | the row above | the passive recorder polls until this, then reports `observed: false` |

**The prefix allowances below are estimates, and the per-case cap is a stop-loss,
not a budget.** Round 3 measured what the helpers really wait and the earlier
figures were too low, so each row now carries the wait it is built from. Where a
row is still below a helper's absolute worst case, the row says so: a slow
staging run is cut on purpose rather than budgeted for.

| Allowance | Value | Inputs (`path:line`) | Arithmetic |
|--------|-------|----------------------|------------|
| Empty the bag | 270_000 ms | `openCart`'s 3 × 15 s press loop plus two 45 s waits (`tests/e2e/actions/cart.ts:72-96`), `CART_ANSWER_MS` per line (`:117-131`), `closeCart`'s 45 s and the badge poll's 45 s (`:137-144`) | 45 + 45 + 45 + 45 + 45 + 45 = 270, for one leftover line |
| Add a product | 180_000 ms | one attempt allows 45 s navigation + 45 s sheet (`tests/e2e/actions/cart.ts:246-249`), 45 s `data-loading` (`:255-259`) and a 45 s bag poll (`:287-291`) | 45 × 4 = 180. The 6-product walk (`:330-343`) is **not** budgeted — it is the stop-loss |
| Open the bag and read | 45_000 ms | `CART_ANSWER_MS` | one cart answer |
| Reach the checkout | 60_000 ms | `CHECKOUT_MS`, `tests/e2e/actions/cart.ts:36` | the existing constant |
| Create the probe address | 15_000 ms | one `throughProxy` call to `POST /customer/address/add` (`services/order.ts:275`) | round 3 moved this off the UI: the region picker's 6 × 20 s of waits (`tests/e2e/actions/profile.ts:665-708`) is not the behaviour under test |
| Edit the probe address | 90_000 ms | the same form, already filled — no region walk (`components/Cart/AddressListContainer.tsx:270-273`) | the one part still on the UI, because it **is** `AC-3` |
| Open the sheet and tap | 45_000 ms | `CART_ANSWER_MS` | one answer |
| Return to the bag | 45_000 ms | `CART_ANSWER_MS`; the control is `swiperSlide-backIcon` (`components/Cart/OrdersPage.tsx:242`) | one answer |
| The re-price after the tap | 45_000 ms | the recorder budget above | one cart answer |
| `BUY-03` per-case timeout | 795_000 ms ≈ 13 min | the nine rows above | 270 + 180 + 45 + 60 + 15 + 90 + 45 + 45 + 45 = 795 s |
| `BUY-04` per-case timeout | 585_000 ms ≈ 10 min | the bag rows plus two line operations | 270 (empty) + 180 (add) + 45 (open and read) + 45 + 45 (two line operations) = 585 s |
| The `BUY-03` teardown | 60_000 ms | four `throughProxy` calls: set-default, list, delete, list (`services/order.ts:232`, `:202`, `:355`, `:202`) | 4 × 15 = 60 s. Round 3 moved this off the UI too, so `removeAddress`'s 5 × (10 + 20) s no longer applies. It runs in the after-hooks slot, which is sized `max(project.timeout, case.timeout)` and starts fresh |
| Worst-case wall clock added | 1440 s = 24 min | the three rows above | 795 + 585 + 60 = 1440 |
| Real one-time codes added per run | 0 | step 7; `BUY-01` already spends one (`tests/e2e/shopper.live.spec.ts:157`) | the two new cases open the handed-on session and never call `attemptAuth` |
| Staging writes added per run | 10, plus one cart delete per leftover line, three times | steps 9 and 10 | 1 address create + 1 address edit + 1 address delete + 2 set-default + **2** add-to-bag (both cases fill one) + 1 quantity update + 2 line removals = 10. `emptyTheBag` runs at the start of `BUY-03`, the end of `BUY-03`, and the start of `BUY-04` (`tests/e2e/actions/cart.ts:117-131`) |
| Extra authenticated request contexts | 2 | `AC-2` and the teardown | both through `throughProxy`, both disposed in a `finally` |
| Live suite today | 56 cases in 8 files | `F-47` | — |
| Sum of every live ceiling today | ≈ 142 min | 9 cases carry an explicit `setTimeout` (shopper 2 = 1200 s, session-recovery 1 = 150 s, profile 6 = 180 × 5 + 420 = 1320 s); the other **47** sit at the 120 s default (`playwright.config.ts:60`) | 1200 + 150 + 1320 + 47 × 120 = 8310 s ≈ 138 min. With the two new cases and the teardown: 8310 + 1440 = 9750 s ≈ **163 min** |
| Live suite `globalTimeout` | 30 min | `playwright.config.ts:65` | **The ceiling has never been the bound.** 163 min of ceiling against a 30 min budget means the budget bounds *observed elapsed time*, not the sum of caps. A run that reaches a cap has already failed. |
| **Expected** duration added, healthy run | **not measured** | — | EV-10, and round 3's sharpest open point. Caps are not expectations, and no live run was made in this session. `/verify` records the observed duration of the run it makes. **If the run overruns, `shopper.live.spec.ts` is 7th of 8 live files by path, so what is silently dropped is these two new cases *and* `staticPages.live.spec.ts` — not only the new ones.** |
| Video added to the artifacts | 2 files | `video: "on"` (`playwright.config.ts:113`), honoured by `tests/e2e/harness/liveSession.ts:78-83`; one per browser context, and the teardown opens no browser context | accepted; the CI archive is encrypted and `tests/e2e/.artifacts` is gitignored |

## Tests

**These are coverage rows, not bug fixes.** No defect is being repaired, so no row
can be "red on old code" in the usual sense — the test does not exist yet. The
column therefore names the **change that would turn the row red**. A row whose
answer is "nothing would turn it red" is a vacuous test and must be rewritten.

Four rules apply to every live row, each fixed at round 2:

1. **Read the wire through `x-proxy-url`, never the URL.** A client call goes out
   as `POST /api/proxy` with the target path in a request header (`F-41`,
   `utils/fetchData.ts:626`), so matching a response on `/cart/cart_overview`
   would never fire and would burn the whole timeout. The working pattern is
   `tests/e2e/actions/cart.ts:180-184`.
2. **Use a passive recorder with its own budget, never a blocking wait.** A
   refusal inside `SetDefault` returns without re-reading the totals (`F-28`,
   `services/order.ts:243-248`), so a `waitForResponse` would hang and die
   namelessly. The recorder polls to the 45 s budget and then reports
   `observed: false`, which fails closed with a message
   (`tests/e2e/harness/session.ts:403-410`).
3. **A real address string is never an `expect` argument, and never part of a
   message.** This is a code rule, not a discipline note — round 3 showed why.
   CI runs the `list` reporter into a world-readable job log
   (`.github/workflows/test-e2e.yml:222`; only the Telegram path is redacted,
   `:243-249`), so one failed `toHaveText` publishes whatever it was comparing.
   The mechanism, copied from `tests/e2e/actions/profile.ts:598-606` — which
   returns a boolean for exactly this reason: **compare in code, assert the
   boolean.** For an API read, assert the HTTP status as its own step, then pull
   `id` and `is_default` into locals and assert only those; the parsed body
   (`tests/e2e/harness/orderCleanup.ts:106-109`) never reaches an `expect`.
   **`redact()` is not the control here**: round 2 confirmed it masks configured
   secrets and tokens only and has no rule for a name, a street or a contact
   phone (`tests/e2e/harness/redact.ts:20-34`).
4. **Pass `CART_ANSWER_MS` on every wait.** A handed-on context defaults to a
   20 s action timeout (`tests/e2e/harness/liveSession.ts:86-87`), so an
   unqualified wait dies early.

| AC | Existing coverage found | Disposition | Test file | Test case / name | Red on old code because | False-green guard |
|------|-------------------------|-------------|-----------|------------------|-------------------------|-------------------|
| AC-1 | `none — searched tests/e2e for "addresses-viewer" and "AddressListContainer": 0 hits` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-03` step "the checkout shows the address that was tapped" | red if the tap stops moving the default, so the screen keeps showing the first address | reads the address **title** (`regular-addresses`), not the region string (`Address-Added-Last`) which two addresses in one city share. Reads it **before** the tap, compares in code, and asserts a **boolean** — the real title is never an `expect` argument, because a failure would publish it to the CI log |
| AC-2 | `none — same search` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-03` step "the core backend stored the tapped address as the default" | red if `SetDefault` stops reaching the core backend | the app makes **no** address-list call after set-default (`services/order.ts:238-242`), so the case issues its own read through the exported `throughProxy` (`tests/e2e/harness/orderCleanup.ts:78`), which carries `MARKET-TOKEN` and the country/lang headers a bare request context would not. Asserts the HTTP status first, then pulls `id` and `is_default` into locals and asserts only those; disposes the context in a `finally`. Every `target` stays a literal with a backend-supplied id interpolated — `throughProxy` only `encodeURI`s it (`:90`) |
| AC-3 | `none — same search` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-03` step "the edited address title shows on the checkout" | red if the edit stops reaching the backend, or the checkout stops re-reading | edits the **title** (`address`), the only address field the checkout draws (`components/Cart/ShippingAddressContainer.tsx:695`); `address_detail` is drawn nowhere there. The probe is created **unconditionally and through the API** (`POST /customer/address/add`, `services/order.ts:275`), so the case always owns the address it edits and never touches a pre-existing one; if creation fails the step records itself as not covered rather than falling back. The **edit** stays on the UI, because that is the criterion. The new title carries a fresh run marker, so the old value cannot satisfy it |
| AC-4 | `none — same search` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-03` `test.afterEach` "the account is left as it was found" | red if the cleanup stops running | **Runs entirely through the API**, because the case has already closed its browser context by then (`tests/e2e/shopper.live.spec.ts:357-359`) — a screen-driven teardown would never run at all. It is a `test.afterEach` with its own registered timeout, in the after-hooks slot, which starts fresh and is sized `max(project.timeout, case.timeout)`, so an overrunning body cannot eat it. Order: restore the original default (`POST /customer/address/set-default`); **verify with the list read** and assert hard that `is_default === 1` on the original id — the screen alone can lie, because `SetDefault` swallows a refusal (`services/order.ts:243-248`); only then delete the probe by **id** (`POST /customer/address/delete?address_id=`, `services/order.ts:355`); confirm absence by id in a final read. **The original default id is captured before the probe is created**, so the probe can never be mistaken for it; if the account had none, that branch is recorded and the probe is simply deleted. **Never deletes an address that is currently the default** — if the restore cannot be verified it leaves the named probe, pushes a test annotation and fails loudly, so `PlaceOrder` is never handed `address_id=undefined` (`services/order.ts:74`, `:81`). It never calls `removeAddress`, whose locator matches the same `Address` marker the checkout sheet rows carry |
| AC-5 | `none — searched tests/store/cartReducer.test.ts and tests/services/cart.test.ts for "initCart", "setCartPreview", "total_shipping_cost": 0 hits` | extend | `tests/store/cartReducer.test.ts` | `the store keeps the money numbers the core backend sent` | red if either writer starts rounding, defaulting or dropping a money field | the four expected numbers are plain literals in the test, not recomputed from the input the same way the code does |
| AC-6 | `none — no OrderButton test file exists; searched tests/components/Cart/` | new | `tests/components/Cart/OrderButton.test.tsx` | `the payable total on the cart is the total the core backend sent` | red if the payable figure starts showing anything other than the backend total | seeds a non-empty `cart` and a `currency` with `exchange_rate: 1` — the row is gated on `cart.length > 0` and reads `currency.symbol` unguarded. `offer-total-price` sits **outside** the collapsed block, so no click is needed. Asserts the exact string, then re-renders with a different backend total and asserts the figure moved |
| AC-7 | `none — same search` | new | `tests/components/Cart/OrderButton.test.tsx` | `the Normal Price is the total plus the discount minus the shipping` | red if the formula changes sign or drops a term | clicks `total-expanded` **once** — the block is hidden until then and the control is a toggle. Total 80, discount 20, shipping 15 make the four wrong formulas give 100, 65, 95 and 80, none of them 85 |
| AC-8 | `none — searched tests/e2e for "Shipping-RoundPrice": 0 hits` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-03` step "the shipping shown in the bag is the shipping the shop sent" | red if the shipping figure stops being drawn from `total_shipping_cost` | read **in the bag**, not at the checkout — `OrderButton` is mounted only in the drawer (`components/Cart/index.tsx:447`). Opens `total-expanded` first, and waits for the figure's own non-empty text — the row draws nothing until `cart.length > 0` (`:267`), and an empty string is not blocked by `C-3`. The reference for this first read is the **`/cart/cart_shipping`** answer (`components/Cart/index.tsx:80-83`), not `/cart/cart_overview`; compares against that number, never against `0` or any literal |
| AC-9 | `none — searched tests/e2e for "offer-total-price": 0 hits; "cart-total-price" is an unused locator at selectors.ts:430` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-03` step "the payable total shown in the bag is the total the shop sent" | red if the payable figure stops being drawn from `total` | reads `offer-total-price`, which needs no toggle, and not the "Normal Price"; waits for non-empty text first. The reference field is **`total`**, and the case never chooses cash on delivery — with a payment method of `id === 0` in the store the figure silently becomes `total_cash` (`components/Cart/OrderButton.tsx:60-65`). The "the two differ" check runs **only when this run has a non-zero discount or shipping** — with both `0` they are equal by arithmetic, so the step records itself as not covered rather than going red |
| AC-10 | `none — same search` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-03` step "choosing the other address makes the shop re-price the bag" | red if `SetDefault` stops re-reading the totals | the recorder is installed **before** the tap — `SetDefault` fires the re-read immediately after the backend accepts (`services/order.ts:238-242`), so a waiter installed after the click can miss it. Its reference here is the **`/cart/cart_overview`** answer, the second of the recorder's two targets. After the tap the case returns to the bag with `swiperSlide-backIcon` (`components/Cart/OrdersPage.tsx:242`) and re-reads there, rather than asserting on an element that is off screen. The recorder reports `observed: false` on nothing arriving, and stops in a `finally` |
| AC-11 | `none — searched tests/store/cartReducer.test.ts for "removeFromCart": 0 hits (tests/services/cart.test.ts:359 is a comment, not coverage)` | extend | `tests/store/cartReducer.test.ts` | `removing a line clears it from both cart lists` | red if either filter changes key, or one list stops being filtered | asserts on `cart` **and** `localCart` in the same case, so dropping either filter is caught |
| AC-12 | `tests/components/Cart/QuantutyInput.test.tsx::moving a cart row to Out-Of-Bag — covers the move only` | extend | `tests/components/Cart/QuantutyInput.test.tsx` | `plus asks for one more and minus asks for one fewer` | red on any off-by-one in either handler | asserts the quantity inside the service call, not that the service was called |
| AC-13 | `none — same file, no case reads the controls` | extend | `tests/components/Cart/QuantutyInput.test.tsx` | `a line at quantity 1 offers delete and no minus` | red if the branch at quantity 1 changes | asserts the minus control is **absent** at quantity 1 and **present** above 1, in the same file, so "any delete marker exists" cannot pass |
| AC-14 | `none — searched tests/e2e for "PlusIcon_CartPage": 0 hits` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-04` step "pressing plus makes the line quantity 2" | red if the plus stops reaching the core backend | reads `QuantityInCart` **after the plus path re-reads the bag** (`components/Cart/index.tsx:615-619`; `:570-575` is the minus path), so the optimistic value cannot pass |
| AC-15 | `tests/e2e/actions/cart.ts:122 uses the delete marker to empty the bag, but no case asserts a named line went` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-04` step "the removed line is gone from the bag" | red if removal stops reaching the core backend | names the product that must be absent; it does not count lines. Scopes the delete locator to a line, because the marker matches one element per line |
| AC-16 | `none — searched tests/e2e for a bag-empty assertion outside emptyTheBag` | extend | `tests/e2e/shopper.live.spec.ts` | `BUY-04` teardown "the bag is left empty" | red if a removal is silently refused | runs in a teardown and asserts the bag is empty afterwards, rather than assuming `emptyTheBag` worked. `BUY-03` empties its own bag in its own `test.afterEach` for the same reason, so it does not hand leftover lines to `BUY-04` — `spec.md > NFR-5` applies to both cases, not only this one |

## Validation strategy

- **Validation profile: `logic-change`** — `lint`, `typecheck`, `unit-tests`, each
  at depth `all-ac` (`.claude/project-config.yaml:66-74`). It runs `AC-5`, `AC-6`,
  `AC-7`, `AC-11`, `AC-12` and `AC-13`.
- **No profile can run the live rows, and none is added.** A validation check must
  be read-only (`VP-2`) and deterministic (`VP-3`). The live suite writes to
  staging and depends on it being up, so it is not a legal check. `AC-1` to
  `AC-4`, `AC-8` to `AC-10` and `AC-14` to `AC-16` are run by hand at `/verify`
  with `pnpm e2e:health` then `pnpm test:e2e:live`, and the exit code is recorded
  per `AC-n` (`VF-11`). This copies `_specs/profile-closeout-scripted-and-live`,
  which named `logic-change` and recorded its live runs separately.
- **`/verify` also records the observed elapsed time of that live run** and
  compares it against the 30-minute `globalTimeout`. The Numbers table says
  plainly that this figure is not measured yet.
- **Every new assertion carries a message** naming the step, and — where the step
  crossed a backend — naming the **core** backend and the endpoint
  (`spec.md > NFR-1`, `NFR-2`).
- **Every live case uses `test.step()`.** `shopper.live.spec.ts` already uses it
  **13** times and `profile.live.spec.ts` 21; the earlier claim that only one spec
  does this was wrong, and the `CLAUDE.md` line saying so is stale.
- **Every live case skips on a missing setting only**, with
  `test.skip(!hasShopperA(), …)` (`tests/e2e/harness/env.ts:152`). A skip never
  covers a bad answer.
- **No personal detail in text output** (`spec.md > NFR-3`, narrowed by the owner
  on 2026-09-05). Assertions print ids and booleans; a failure prints an
  allow-list of keys, never a body. The probe address reuses the synthetic values
  the profile spec already uses — title `Trydos E2E Probe`, detail
  `Trydos E2E probe address, please delete`, recipient `Trydos E2E Probe`, phone
  `963900000001` (`tests/e2e/profile.live.spec.ts:175`, `:185`, `:218`, `:219`) —
  never `envValue("TEST_ACCOUNT_PHONE")`, which `addAddress` would otherwise type
  on screen and save on staging (`tests/e2e/actions/profile.ts:719-722`).
- **Video is accepted, by the owner's decision on 2026-09-05.** The checkout draws
  the delivery address's contact phone
  (`components/Cart/ShippingAddressContainer.tsx:755`) and the live project
  records video (`playwright.config.ts:113`), so the recording shows it. `NFR-3`
  was narrowed to text output to match what the project already accepts for the
  login screen. The CI archive is 7z-encrypted before upload
  (`.github/workflows/test-e2e.yml:300`) and local `tests/e2e/.artifacts` is
  gitignored (`.gitignore:141`) and must not be shared.
- **Accepted, and stated:** if the run hits `globalTimeout`, Playwright orders by
  file path and `shopper.live.spec.ts` is 7th of 8, so what is silently lost —
  absent, not red — is the two new cases **and `staticPages.live.spec.ts`**, which
  sorts after it. An abort mid-`BUY-03` can also leave a probe address behind: the
  `test.afterEach` covers a failed assertion, not a killed process. Step 12's
  guard in `BUY-01` is the net for that, and a killed run also leaves the session
  file on the runner.
- **The existing suites must stay green**: the unit suite in full, and `BUY-01`,
  `BUY-02` at their current result in the same live run. The exact unit case count
  is not asserted here — the figure quoted in earlier tickets was copied, not
  measured (EV-10).

## Rollback

Revert the commit. Every changed file is a test, a locator, a harness key or a
document, so a revert removes coverage and changes no application behaviour. The
two new `BUY-nn` rows in the register go with it.

**One caution.** The working tree is not clean and is being changed by another
session (see Integration surface). `tests/e2e/selectors.ts` is both a target file
and currently modified by that other work. Before `/implement` the branch must be
cut from a base that does not carry someone else's half-finished edit, or the
revert takes their work with it. Step 12 re-reads every cited line for the same
reason.

## Plan check

| Round | Checker / lens | Severity or status | Finding (short) | What changed in the draft |
|-------|----------------|--------------------|-----------------|---------------------------|
| 1 | claim-checker | WRONG | `order.SetDefault` has three production callers | Corrected to **one**; the other two are commented out. `research.md` F-44 added |
| 1 | claim-checker | WRONG | `initCart` has 13 call sites | Corrected to **15**. `research.md` F-45 added |
| 1 | claim-checker | WRONG | Register rows at `E2E_SCENARIOS.md:213-214` | Corrected to `:222-223` |
| 1 | claim-checker | WRONG | Fixture lines `:86`, `:83`, `:80` | Corrected to `:97`, `:93`, `:89`. Values were right |
| 1 | claim-checker | WRONG | Only `profile.live.spec.ts` uses `test.step()` | Corrected: **seven** spec files do. `research.md` F-46 added |
| 1 | claim-checker | WRONG | `selectors.ts` imported by every browser spec | Corrected to **10 of 12**; two import nothing from it |
| 1 | claim-checker | WRONG | `AddressListContainer.tsx:81`, `utils/functions.tsx:169` | Corrected to `:80` and `:170` |
| 1 | claim-checker | WRONG | `BUY-01` at `:117`, `BUY-02` at `:349` | Corrected to `:133` and `:371`. `research.md` F-38 fixed |
| 1 | claim-checker | WRONG | Only `BUY-02`'s register line has drifted | Corrected: **both** rows have. `research.md` F-39 fixed |
| 1 | claim-checker | MISSING-HIT | `getCart(` — five production hits absent | All five added to the Integration surface, with why only `OrderButton.tsx:184` matters |
| 1 | claim-checker | MISSING-HIT | `initCart(` — `AddToCartComponent.tsx:318` absent | Added |
| 1 | claim-checker | MISSING-HIT | `cart-total-price` — two text mentions absent | Both added, with why neither is a caller |
| 1 | claim-checker | MISSING-HIT | `Edit-Addres-Icon` — `selectors.ts:303` absent | Added, with the scoping requirement |
| 1 | claim-checker | MISSING-HIT | `removeFromCart` / `setCartPreview` wrong second lines | Corrected in `research.md` |
| 1 | claim-checker | MISSING-HIT | `setDefaultAddress` widget caller is commented out | Corrected |
| 1 | claim-checker | UNVERIFIED | "1499 unit cases" was copied, not measured | Claim removed; the strategy now says the suite must stay green without quoting a count |
| 1 | senior | **major** | `AC-7` and `AC-8` read elements behind `{expanded && …}`, which starts `false` | Step 3, step 5 and both rows now open `total-expanded` first. `research.md` F-42 added |
| 1 | senior | **major** | `AC-3` asserts `address_detail`, which the checkout never draws | `AC-3` now edits and asserts the address **title** (`regular-addresses`) |
| 1 | senior | **major** | `AC-1`'s only existing locator is the region string, shared by two addresses in one city | `AC-1` now asserts the title element, added in step 5 |
| 1 | senior | **major** | No sign-in strategy: three cases would cost three real one-time codes | Step 7 added: `BUY-01` hands its session on; `liveSession.ts` added to Files to change; cost row says **0** codes added |
| 1 | senior | **major** | Uncommitted work in 4 of 7 files makes "revert the commit" untrue | **Not reproduced.** `git status --porcelain` shows only this work item's `_specs/`; the earlier work is in `79a0d8fb`. Recorded in the Integration surface |
| 1 | senior | minor | `x-proxy-url`, not the URL | Folded into the `x-proxy-url` fix below |
| 1 | senior | minor | `AC-2`: the app makes no address-list call after set-default | `AC-2` now issues its own authenticated request |
| 1 | senior | minor | The unit fixture needs `cart` and `currency` | Added to step 3 and to Numbers |
| 1 | senior | minor | `BUY-04` at 120 s repeats `BUY-01`'s prefix | Scenario folded away; see below |
| 1 | senior | minor | `BUY-04` adds no signal `BUY-03` does not already set up | **Accepted.** Three scenarios became two: `AC-8`/`AC-9` are now steps inside `BUY-03` |
| 1 | senior | minor | Step 11 misses three other stale places in the register | Step 11 now names four edits plus the spec header |
| 1 | senior | minor | Step 2's premise is wrong — the two keys carry the same value | Premise dropped; `AC-11` kept as coverage of an untested action. `research.md` F-12 fixed |
| 1 | senior | info | One-file-too-big worry does not hold | No change; the reasoning is now in Approach |
| 1 | senior | info | Step 6 is not gold-plating | No change |
| 1 | security | **major** | A live failure can print the account's phone and street into a world-readable CI log | Every live assertion is on an id or a boolean; any body text goes through `redact()`. Stated above the Tests table |
| 1 | security | **major** | `AC-3` could overwrite a pre-existing address for good | `AC-3` now edits **only the probe the case created** |
| 1 | security | **major** | No `try/finally` and no cleanup order, so a mid-case death leaves a probe as the account default and `BUY-01` posts a real order to it | `AC-4` and `AC-16` now run in `finally`; the default is restored **before** the probe is deleted |
| 1 | security | **major** | `addAddress` needs a recipient and a phone, and neither was named — the obvious choice is the configured identity | The synthetic values are now named in Validation strategy |
| 1 | security | minor | `AC-9`'s "they differ" guard goes red when discount and shipping are both `0` | The check is now conditional on a non-zero discount or shipping, and records itself as not covered otherwise |
| 1 | security | minor | The address sheet now appears on the live video | **Accepted and stated** in Validation strategy |
| 1 | security | info | The rename is safe; no protected path is touched; writes stay inside the staging allow-list | No change |
| 1 | performance | **major** | 180 s copied from `PROF-07`, which does different work | Every timeout rebuilt from named allowances; see Numbers |
| 1 | performance | **major** | Three sign-ins against a suite that signs in once per run | Fixed by step 7 |
| 1 | performance | **major** | Matching `/cart/cart_overview` can never fire — everything is `POST /api/proxy` with the path in `x-proxy-url` | Stated above the Tests table and in step 8. `research.md` F-41 added |
| 1 | performance | **major** | `AC-10`'s blocking wait dies slowly and namelessly on a refusal | Replaced with a passive recorder that fails closed with a message |
| 1 | performance | **major** | The `globalTimeout` row is reasoned and scoped wrong | Rewritten: 56 cases, ≈143 min of ceiling against a 30 min budget, so the ceiling is not the bound; the observed duration is **not measured** and becomes a `/verify` figure |
| 1 | performance | **major** | An aborted run cuts exactly the new cases and can leave a real order | Stated in Validation strategy |
| 1 | performance | minor | Cleanup not in `finally` | Fixed with the security finding of the same shape |
| 1 | performance | minor | No Numbers row for the repeated setup | Added as the bag-and-checkout prefix allowance |
| 1 | performance | minor | The recorder must be installed before the tap | Made explicit in `AC-10` and step 8 |
| 1 | performance | info | Three new contexts, three more guest registrations | Reduced to two by folding a scenario; the handed-on session is used instead of arriving as a guest |
| 1 | performance | info | The unit half is cheap; step 3's claim holds | No change |

| 2 | claim-checker | WRONG ×19 | Line numbers stale across `plan.md` and `research.md`: `cart.total` is `:430` not `:420`; `Edit-Addres-Icon` comment `:313` not `:303`; `cartPage-container` `:417` not `:407`; the cart locator block is `:411-446`; `shopper.live.spec.ts` ends at `:413`; `setCartPreview` call `:351`; `Math.ceil` `:164`; `max=` `:346`; the plus path re-reads at `:614-619` not `:570-575`; `fixtures.ts:61` is the order tracker, not a signed-in fixture | **Not yet applied — see the blocker below.** The tree moved during the check, so every line must be re-read before it is written down |
| 2 | claim-checker | WRONG | `services/cart.ts` / `services/order.ts` use only `server: "market"` | Wrong: `services/order.ts:381` uses `"elastic"`, `:669` and `:692` use `"comments"`. The cart and address paths in scope are still `"market"` |
| 2 | claim-checker | WRONG | The ceiling arithmetic contradicts its own value | 45 cases at the default, not 42: 1200 + 150 + 1560 + 5400 = 8310 s ≈ 138 min today, ≈ 148 min with the two new cases |
| 2 | claim-checker | MISSING-HIT ×4 | `cart.total` in a mobile doc; six `getCart(` test call sites; `RoundPrice(` hits 36 files not 7; several feature-doc mentions | To be recorded; none is a caller |
| 2 | claim-checker | UNVERIFIED | "the working tree is clean" | **Disproved.** It observed `selectors.ts` gain two lines mid-check |
| 2 | senior | **major** | The money markers live in the cart **drawer**, not the checkout screen — `OrderButton` is mounted only at `components/Cart/index.tsx:447`, and `PlaceOrderWidget`'s totals carry no `data-pw` | Confirmed by hand. `spec.md` `AC-8`/`AC-9` say "at checkout" and are wrong |
| 2 | senior | **major** | `BUY-03` never hands the session on, so `BUY-04` opens a superseded credential | To apply: `handOnSession` in `BUY-03` too |
| 2 | senior | **major** | `AC-2` needs `throughProxy`, which is module-private in a file the plan does not change | To apply: export it and add `tests/e2e/harness/orderCleanup.ts` to Files to change |
| 2 | senior | **major** | `AC-3` has no mechanism — step 8 lists no "edit an address" action and `addAddress` cannot be reused | To apply: add the edit step to step 8 |
| 2 | senior | **major** | "Not reproduced" is wrong; the tree is dirty | **Accepted.** `tests/e2e/selectors.ts` is modified right now. The one-commit rollback claim does not hold |
| 2 | senior | minor ×6 | `BUY-03` leaves a bag; the country is never stated; no `forgetSavedSession`; no address-row locator; the step-6 ordering claim is wrong (the renamed entry still has no caller — deleting is smaller) | To apply |
| 2 | senior | info | `offer-total-price` sits **outside** `{expanded && …}`, so only `AC-7`/`AC-8` need the toggle; `BUY-02` cannot clobber the hand-on | Confirmed by hand |
| 2 | security | **major** | The `finally` restore taps the sheet, and `SetDefault` swallows a refusal — the screen can look restored while the backend still holds the probe as default, and `BUY-01` then posts a real order to it | To apply: verify the restore with the authenticated read, hard, not `expect.soft` |
| 2 | security | **major** | Conditional probe creation leaves `AC-3` editing a real address on an account that already has two | To apply: create the probe unconditionally; skip `AC-3` if creation fails |
| 2 | security | **major** | `removeAddress` returns `true` as soon as no card matches, and `AC-3` renames what the cleanup searches for | To apply: delete by `address_detail`, confirm absence by id |
| 2 | security | **major** | `redact()` masks configured secrets only — it has no rule for a name, a street or a contact phone | To apply: drop the `redact()` claim; ids and booleans are the only control |
| 2 | security | minor | Deleting an address that is currently default leaves the account with no default, so `PlaceOrder` sends `address_id=undefined` | To apply: restore, verify, then delete; never delete the current default |
| 2 | security | minor | The checkout draws the address's contact phone and the live project records video, which contradicts `NFR-3` as written | **Owner decision at `/review`** — narrow `NFR-3` to text output, or pass `recordVideo: false` for the two new contexts |
| 2 | security | info | The session file holds a real token but is gitignored and cleared at teardown | No change |
| 2 | performance | **major** | The 120 s prefix allowance is the project default re-labelled, not derived | To apply |
| 2 | performance | **major** | `BUY-03`'s 360 s has no allowance for **creating** the address | To apply |
| 2 | performance | **major** | The 60 s cleanup allowance sits inside the case cap, so an overrun leaves no cleanup time — the exact hazard the plan names | To apply: move the restore to a fixture teardown with its own slot |
| 2 | performance | **major** | The passive recorder has no named wait budget | To apply: bind it to the 45 s re-price allowance |
| 2 | performance | minor ×5 | Ceiling sum wrong; `BUY-03` leaves a bag; new waits die at the 20 s action default unless explicit; no staging-writes row; artifact growth | To apply |
| 2 | performance | info | The unit half is confirmed cheap — `posthogCapture` returns early outside production, so MSW is not tripped | No change |

- **Round 2 result: 13 majors, 19 WRONG claims, 4 MISSING-HITs.** Round 2's
  findings are recorded above but **not yet applied**, and round 3 has not run.
  See the blocker below.

### Blocker — the working tree is being edited by another session

`EV-1` requires every fact to carry a `path:line` that was opened and read. That
cannot hold while the file is moving. Evidence:

- Two other interactive sessions are open on this repository (`trydos-22`,
  `trydos-e7`).
- `tests/e2e/selectors.ts` — one of this plan's eight target files — was modified
  at 10:46, and `components/skeleton/loaders/FeaturedProductsSkeleton.tsx` at
  10:43, while the plan check was running.
- The claim checker observed `cart-total-price` move from line 428 to line 430
  **between two of its own searches**.
- `git status --porcelain` was empty when this work item was opened at intake.

Two consequences: every line number written down goes stale, and `/implement`
has no clean base to branch from (`IM-3`). Round 3 is not run until the tree is
still.

| 3 | claim-checker | WRONG ×24 | Mostly `research.md > Shared things`, which round 2 did not rewrite: `cart.total` `:430` (4 places), `cartPage-container` `:417`, `initCart(` 13→15 and `utils/functions.tsx:327`, `order.SetDefault` three→one caller and `:80`, `RoundPrice(` `:170`, `setCartPreview` `:351`, `removeFromCart` `:402`/`:418` and **three** call sites (`components/Cart/index.tsx:138`, `:648`, `services/cart.ts:125`), `errRemoveFromCart` `:418-426`, F-6 plus path `:615-619`, F-7 `:346`, F-15 `:351`, F-24 `:164`, F-39 `:222`/`:223`, "signed-in fixture at `fixtures.ts:61`" (that is the order tracker) | **Not applied.** Round 3 is the last round `EV-6` allows. Recorded, and step 12 re-reads every citation at `/implement` |
| 3 | claim-checker | WRONG | The ceiling row's inputs: profile's six caps are 1320 s not 1560, and 47 cases sit at the default not 45 (47 × 120 = 5640) | The two errors cancel — the stated 8310 s and 9465 s totals are both right — but the inputs are wrong. Not applied |
| 3 | claim-checker | WRONG | `shopper.live.spec.ts` uses `test.step()` **13** times, not 14 | Confirmed by hand. Not applied |
| 3 | claim-checker | WRONG | Staging writes is **10**, not 9 — both new cases fill a bag | Not applied |
| 3 | claim-checker | WRONG | `tests/e2e/harness/liveSession.ts` is imported by **six** files, not two, and one of them (`tests/e2e/shopper.live.spec.ts:100`) is a target file | Confirmed by hand. Not applied; it widens the integration surface |
| 3 | claim-checker | WRONG | The 240 s teardown row has one 45 s term with no source | Not applied |
| 3 | claim-checker | WRONG | The skeleton file is not modified | **Disputed.** Three direct `git status --porcelain` runs show it modified. The lens has no shell |
| 3 | claim-checker | UNVERIFIED ×2 | The commit `79a0d8fb` claim and the other-session attribution | Both were checked by hand in the parent session; the lens has no shell |
| 3 | claim-checker | OK | ~170 claims, every sum re-done: 600, 315, 240, 1155, 8310, 9465, 85 with 100/65/95/80 | No change |
| 3 | senior | **major** | Five target files carry another session's work, and `E2E_SCENARIOS.md` already says 71 | **Not reproduced, again.** Direct `git status` shows two modified files; `tests/e2e/checkout.scripted.spec.ts` is **tracked**; the "71" and the SCRIPT rows are committed content from `79a0d8fb`. The lens read the stale session-start snapshot, the same error it made at round 1. The real overlap is one target file, `tests/e2e/selectors.ts` |
| 3 | senior | **major** | "Slides back to the bag" has no locator and no action — the control is `swiperSlide-backIcon` (`components/Cart/OrdersPage.tsx:242-251`) and appears nowhere in `tests/e2e`. `AC-8`, `AC-9` and `AC-10` cannot be carried out | **Open.** Step 5 and step 8 must add it |
| 3 | senior | **major** | The first bag read comes from `/cart/cart_shipping` (`components/Cart/index.tsx:80-83`), not `/cart/cart_overview`; only the re-price uses the latter. One recorder bound to the wrong target leaves the first read with no reference | **Open.** Two recorder targets are needed, and each read must say which answer is its reference |
| 3 | senior | **major** | The teardown has no stated way to reach the account: every live case closes its context in its own `finally` (`tests/e2e/shopper.live.spec.ts:357-359`), and `removeAddress` drives a live page | **Open.** Agrees with security round 3. The fix is a backend teardown through `throughProxy` with a captured `storageState` |
| 3 | senior | **major** | `removeAddress` matches `getByTestId("Address")`, the same marker every checkout-sheet row carries, and the cart overlay stays mounted | **Open.** The cleanup can click the wrong row and fail silently |
| 3 | senior | **major** | `BUY-03` carries 7 `AC-n`, a 10-minute cap, an unconditional create, an edit, two set-defaults and a teardown; the unit half shares no file with it and gates every pull request | **Escalated to the owner.** See the final result below |
| 3 | senior | minor ×4 | Add a `BUY-01` guard refusing to order to a probe default; keep the teardown local to the spec rather than in shared `fixtures.ts`; `BUY-03` must never choose cash on delivery or the payable total becomes `total_cash` (`components/Cart/OrderButton.tsx:60-65`); the cart locator block is `:413-448` | **Open** |
| 3 | senior | info | The fixture-timing claim **does** hold in Playwright 1.62.1 — the after-hooks slot is fresh and sized `max(project.timeout, test.timeout)` | Settles the dispute against the performance lens. The wording should be "a fresh slot of `max(config, case)`", not "outside the case cap" |
| 3 | security | **major** | The fixture teardown is screen-driven but the case closes its context first, so the restore cannot run at all and the probe stays as the account default | **Open.** Same finding as senior; the fix is the backend teardown |
| 3 | security | **major** | The plan never says **when** the original default id is captured, and has no branch for "there was no default" | **Open.** Capture it through the authenticated read **before** creating the probe |
| 3 | security | **major** | CI's `list` reporter writes a failed `toHaveText` argument into a world-readable job log, and `AC-1` asserts against the **real** address title | **Open.** `tests/e2e/actions/profile.ts:598-606` already solves this: compare in code, assert a boolean |
| 3 | security | minor ×4 | `AC-2`'s "never prints the body" is discipline, not mechanism; "fails loudly" does not stop the next run; the bag reads have no non-empty anchor; `throughProxy`'s `target` is only `encodeURI`d | **Open** |
| 3 | security | info | The video decision is sound under the narrowed `NFR-3`; no protected path is touched | No change |
| 3 | performance | **major** | The allowances are still below what the cited helpers wait — one leftover line is ~270 s, one product attempt ~180 s. Recomputed honestly, `BUY-03` is near 900 s and `BUY-04` near 500 s | **Open** |
| 3 | performance | **major** | "A teardown gets its own time slot" needs an explicit `{ timeout }` on the fixture tuple | **Partly disputed.** The senior lens read the same Playwright 1.62.1 source and found the after-hooks slot is fresh and sized `max(project, test)`. Registering the timeout explicitly is still the safer instruction |
| 3 | performance | **major** | ≈420 s of the new ceiling buys UI work `throughProxy` does in seconds | **Open, and it is the better design.** Create the probe and do the restore through the API; keep only `AC-3`'s edit on the UI |
| 3 | performance | **major** | The one number that decides the 30-minute question — **expected** duration on a healthy run — is still absent, and is deferred to `/verify`, after the code is written | **Open** |
| 3 | performance | minor ×5 | Ceiling inputs; the teardown's own context is uncosted; staging writes miss the cart deletes; an overrun also drops `staticPages.live.spec.ts`; the video row should be size and file count, not minutes | **Open** |
| 3 | performance | info | The recorder must `stop()` in a `finally`; the unit half is confirmed cheap | **Open** (the first) |

- **Round 3 result: 13 majors, 24 WRONG claims.** Two majors were **not
  reproduced** (both from the stale git snapshot). One dispute between two lenses
  was settled by reading the installed Playwright source. **The check did not
  converge**: rounds 1, 2 and 3 produced 15, 13 and 13 majors. `EV-6` stops the
  loop at three rounds, so the round-3 findings above are recorded, not applied.
| 3 | (owner, post-check) | documentation | `PL-12` failed at the review gate's Step 1: `plan.md` answered `OQ-6` in substance, in the Tests table, but never named the id — so the trail from the deferred question to its answer was broken | **Fixed.** An `Answers to deferred questions` section now states `OQ-6` and its answer, pointing at the same Tests rows. **No approach, file, criterion, number or test changed** — this is a traceability label, so it is recorded here as a documentation correction under round 3 rather than opening a fourth check round, which `EV-6` does not allow in any case |

- **Final round result: NOT CLEAN after three rounds — 41 majors and ~53 wrong
  claims in total, and the rate was not falling.** `EV-6` stops the loop at three.

**What happened after the loop stopped, and it matters for the gate.** The owner
was shown the split of the findings — across three rounds the **unit half**
(`AC-5`, `AC-6`, `AC-7`, `AC-11`, `AC-12`, `AC-13`) drew two remarks, both `info`,
both saying it is fine, while the **live half** drew every major in round 3 and
almost every one before it — and was offered three ways forward: split the live
half into its own work item, fix round 3 and take everything to review, or go to
review untouched. **The owner chose to fix round 3 and take all 16 criteria to
review** (2026-09-05).

So the following changes were made to this draft **after the last check round,
and no checker has seen them**:

- Setup and cleanup moved off the UI and onto `throughProxy`; only `AC-3`'s edit
  stays on screen. This is what makes the teardown able to run at all.
- The `test.afterEach` teardown replaced the shared-fixture teardown, with its own
  registered timeout.
- The original default id is captured **before** the probe is created, with a
  branch for an account that had none.
- The back-to-the-bag control `swiperSlide-backIcon` was added to steps 5 and 8;
  without it `AC-8`, `AC-9` and `AC-10` could not be carried out.
- The recorder watches **two** targets, `/cart/cart_shipping` and
  `/cart/cart_overview`, and each read names its reference.
- Real address strings are barred from `expect` arguments and messages by a code
  rule, not a discipline note.
- The timings were rebuilt again from what the helpers actually wait: `BUY-03`
  795 s, `BUY-04` 585 s, teardown 60 s — **24 minutes** of new ceiling, up from
  the 19 the last round rejected as too low.
- A guard was added to `BUY-01` refusing to place a real order when the default
  address carries the probe marker.
- Corrections: `test.step()` count 13; staging writes 10; `liveSession.ts` has six
  importers; the ceiling inputs; the cart locator block `:413-448`;
  `cartReducer.test.ts:337`; an overrun also drops `staticPages.live.spec.ts`.

**Two things the review panel should look at first**, because nothing has checked
them: whether the API-based setup and teardown really work as described, and
whether 24 minutes of new ceiling is acceptable when the **expected** duration of
a live run is still not measured. The round-3 claim-checker also left ~24 stale
line numbers in `research.md > Shared things` unfixed; step 13 re-reads every
citation at `/implement`.

### Blocker — the working tree is being edited by another session

`EV-1` requires every fact to carry a `path:line` that was opened and read. That
cannot hold while the file is moving. Evidence:

- Two other interactive sessions are open on this repository (`trydos-22`,
  `trydos-e7`).
- `tests/e2e/selectors.ts` — one of this plan's eight target files — was modified
  at 10:46, and `components/skeleton/loaders/FeaturedProductsSkeleton.tsx` at
  10:43, while the plan check was running.
- The claim checker observed `cart-total-price` move from line 428 to line 430
  **between two of its own searches**.
- `git status --porcelain` was empty when this work item was opened at intake.

Two consequences: every line number written down goes stale, and `/implement`
has no clean base to branch from (`IM-3`). Round 3 is not run until the tree is
still.

- **Round 1 result: 15 majors, 10 WRONG claims, 7 MISSING-HITs.** One major
  (uncommitted work) was **not reproduced** and is recorded with its evidence.
  Every other finding is fixed in this draft. Round 2 is required.
- **Round 2 result carried forward.** Round 2's fixes were applied before round 3 ran.

## Out of scope

- Any change to application code (`spec.md > C-1`).
- The missing funnel event on the delete control above quantity 1 (`F-9`) and the
  swallowed refusal in `SetDefault` (`F-28`). Both are follow-up work items
  (`spec.md > Out of Scope`).
- The server copy of `RoundPrice` (`utils/server/helpers.ts:118`), already covered
  by `tests/utils/server/helpers.test.ts`.
- `tests/setup.ts`. Step 3 renders a component that needs no observer and no fake
  timers (`F-42`, verified at round 1), so no edit is needed. If that turns out to
  be wrong at `/implement`, block under `IM-8` rather than editing the file.
- The `Out-Of-Bag` move, already covered by
  `tests/components/Cart/QuantutyInput.test.tsx`.
- Placing a real order in any new scenario. `BUY-01` owns that.
- Correcting the two drifted line numbers already in the register (`F-39`). Step
  11 writes correct lines for the new rows only; fixing the old ones is a
  separate tidy-up.
- The stale `CLAUDE.md` line claiming only one spec uses `test.step()` (`F-46`).
  Recorded, not corrected here — `CLAUDE.md` is not in this ticket's scope.

## Traceability

| AC | Requirement | Step(s) | Live case |
|----|-------------|---------|-----------|
| AC-1 | FR-1 | 5, 8, 9 | BUY-03 |
| AC-2 | FR-2 | 9 | BUY-03 |
| AC-3 | FR-3 | 5, 9 | BUY-03 |
| AC-4 | NFR-5, C-2 | 9 | BUY-03 |
| AC-5 | FR-4, FR-5 | 1 | — |
| AC-6 | FR-5 | 3 | — |
| AC-7 | FR-6 | 3 | — |
| AC-8 | FR-4, NFR-2 | 5, 8, 9 | BUY-03 |
| AC-9 | FR-5, NFR-2 | 5, 6, 8, 9 | BUY-03 |
| AC-10 | FR-7 | 8, 9 | BUY-03 |
| AC-11 | FR-9 | 2 | — |
| AC-12 | FR-8 | 4 | — |
| AC-13 | FR-10 | 4 | — |
| AC-14 | FR-8, NFR-2 | 5, 8, 10 | BUY-04 |
| AC-15 | FR-9, NFR-2, NFR-4 | 5, 8, 10 | BUY-04 |
| AC-16 | NFR-5 | 10 | BUY-04 |
