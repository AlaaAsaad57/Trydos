---
ticket: e2e-order-edits-after-placing
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-26
links:
  clickup:
  github:
---

# Implement — e2e-order-edits-after-placing

> Record of what was actually built, following `plan.md`.

Branch: `ticket/e2e-order-edits-after-placing`, created from `development`
(local and `origin/development` were level, `0 0`). The repository profile names
`development` as the base branch, not `main`.

## Changes made

Plan step 1 — test hooks (attributes only, no behaviour change):

- `components/setting/orders/OrderOptionsMenu.tsx` — `change-address-option`, `hide-order-option`.
- `components/setting/orders/OrderItemOptions.tsx` — `cancel-line-option`.
- `components/setting/orders/CancelOrderItemWrapper.tsx` — `cancel-line-reason` (each chip), `cancel-line-submit`.
- `components/setting/orders/confirmations/CancelOrderItemConfirmationWindow.tsx` — `cancel-line-agree`, `cancel-line-confirm`.
- `components/Orders/ChangeAddressWidget.tsx` — `change-address-submit`.
- `components/Orders/ConfirmAddressModal.tsx` — `change-address-confirm`, and `change-address-agree` (see Deviations, D-1).
- `components/settings/cards/OrderAddressCard.tsx` — `order-address-card`, `order-address-recipient`.

Plan step 2 — `tests/e2e/selectors.ts > orders`: the new hooks, plus the
existing ones the case uses (`confirm-hide-order`, `open-hidden-orders`,
`hidden-orders-screen-back-button`, `hidden-order-card`, `restore-hidden-order`,
`confirm-restore`, `order-item-options`, the address rows `Address`).

Plan step 3 — `tests/e2e/harness/orderCleanup.ts`, `throughProxyInPage`: accepts
`method: "PATCH"` (sent in `x-proxy-method`, as the app's `fetchData` does) and
returns `backend` (`x-market-backend`, `""` when absent, and `""` on a call that
got no answer). Additive; `tsc` passes for every caller.

Plan step 4 — `tests/e2e/actions/productComments.ts`, `watchCommentCall`:
`CallOutcome` gains `label` (the `x-market-backend` value, `""` when there is
none). No `PATCH` match was added (D-2).

Plan step 5 — `tests/e2e/actions/orders.ts`:
- `exactGroupId`, `orderPageAddress` (end-anchored, escaped), `onOrderPage`.
- `findOrderInList` and `openOrderFromList` now match the whole id and use the
  anchored address (SEC-2 in the plan).
- New: `listShowsOtherOrders`, `attemptChangeAddress`, `pageShowsRecipient`,
  `attemptHideOrder`, `openHiddenOrders`, `findHiddenOrder`,
  `attemptRestoreOrder`, `leaveHiddenOrders`, `attemptCancelLine`.
- Every write action checks it is on its own order page first, watches the full
  endpoint path (the pack id is in the visibility path), and returns booleans /
  ids only. `attemptChangeAddress` finds the probe row **inside the page** and
  gets back only its index; its click error is caught, so no address row can
  reach a failure line.

Plan step 6/7 — `tests/e2e/shopper.live.spec.ts`: the `ORD-01` describe, **last
in the file** (after `BUY-05`), with its own header comment saying why; one test
(`test.setTimeout(15 min)`) with nine `test.step()`s; module-level helpers
`readOrderGroup`, `readHiddenOrders`, `shippingAddressIdOf`, `packStatusOf`; the
existing `backendNamed` is reused, not copied. The describe-level `afterEach`
does the clean-up (see D-3, D-4).

Plan step 8 — the file header: `ORD-01` in the case list, "BUY-01 and ORD-01 are
the only ones that place a real order", `ORD-01`'s cost, and **five** codes per
run with the "fifth send in a row" note and `OTP_TEST_PHONES`.

Plan step 9 — `docs/testing/E2E_SCENARIOS.md`: the money-path summary row (cases,
five codes, two orders, two addresses); the FIND-3 known-gap paragraph under
BUY-01; "five one-time codes and five sign-ins … two orders"; "A run spends
**five**"; and the `ORD-01` row with the killed-run clean-up. The measured `ORD-01`
time is not added yet — it needs the first green run (`/verify`).

## Changes prepared (uncommitted)

No commit, no push (IM-9). `git diff --stat`:

- `components/Orders/ChangeAddressWidget.tsx` — +1
- `components/Orders/ConfirmAddressModal.tsx` — +2
- `components/setting/orders/CancelOrderItemWrapper.tsx` — +2
- `components/setting/orders/OrderItemOptions.tsx` — +1
- `components/setting/orders/OrderOptionsMenu.tsx` — +2
- `components/setting/orders/confirmations/CancelOrderItemConfirmationWindow.tsx` — +2
- `components/settings/cards/OrderAddressCard.tsx` — +2
- `docs/testing/E2E_SCENARIOS.md` — +19 / −
- `tests/e2e/actions/orders.ts` — the new actions, exact-id matching
- `tests/e2e/actions/productComments.ts` — `label`
- `tests/e2e/harness/orderCleanup.ts` — `PATCH`, `backend`
- `tests/e2e/selectors.ts` — the new hooks
- `tests/e2e/shopper.live.spec.ts` — `ORD-01` and the header

Every file is in `plan.md > Files to change`. No protected runtime path was
touched.

## Deviations from plan

- **D-1 — one hook more than planned.** `ConfirmAddressModal.tsx` has its own
  terms tick (`setActive`, line 318); its confirm button does nothing until it is
  ticked. The plan named only `change-address-confirm`. Added
  `change-address-agree` in the same, declared file. 12 hooks, not 11.
- **D-2 — the `PATCH` match in `watchCommentCall` was not added.** Review
  follow-up (G-SEC-3 / G-S-2 / G-P-2): `fetchData` sends every proxied call as
  `POST /api/proxy` and the real verb only in `x-proxy-method`
  (`utils/fetchData.ts:618-649`), so the watcher already sees hide and restore.
  The change would be dead code. Only the `label` field was added. The hide and
  restore watchers pass the full path with the pack id, so a line's
  `…/detail/{id}/visibility` can never match.
- **D-3 — G-SEC-1 mitigation (owner disposition: mitigate).** The teardown does
  not use `cancelOrderGroup`'s "handled" count. It reads the group, cancels only
  packs whose id is one this case read in its step 5, re-reads, and releases the
  order only when **every** saved pack id is in the answer **and** none still
  answers `can_cancele_order: true`. Otherwise it keeps the order registered and
  annotates "order may still be live". The case's last step fails when any saved
  pack is missing from the answer, so an empty answer is a failure, not a pass.
  With it, and in the same code: the teardown skips the order calls when the
  group id is empty, and `readOrderGroup` ignores any pack whose
  `order_group_id` is another group's (G-SEC-4 — not dispositioned by the owner,
  taken here because it is the same lines).
- **D-4 — G-S-1 mitigation (owner disposition: mitigate).** The hook's first
  lines are `waitForRenewalSettled(page)` then `page.goto("/robots.txt")`, before
  any clean-up call and before the re-register in `finally`.
- **D-5 — the teardown's time comment follows Playwright 1.62.1.** The plan said
  after-hooks share the test's timeout; they get their own slot (review G-P-1,
  checked at `workerProcessEntry.js:1651`). The `+6 min` line is kept as the plan
  says, and its comment states the real reason.
- **D-6 — leaving the hidden view is its own action.** `leaveHiddenOrders` presses
  the hidden screen's back arrow and waits for `view=hidden` to leave the address
  before the "back in the list" check, which also asserts a non-null status
  (review G-S-3). The plan's step 9 needs this move; it did not name it.
- **Not done (minor, not dispositioned, plan text stands):** a per-row address-id
  hook (G-SEC-2 — the index-inside-the-page approach is used instead), and a cap
  on the one-time-code cooldown wait (G-P-3). The header notes the cooldown risk.

## Resume after verify (2026-09-26, `implementation-resumed`)

`/verify` failed (`verify.md`): `ORD-01` step 4 read the checkout's address
block before it had loaded and reported "no delivery address" for an account
whose default the core backend had just confirmed. Confirmed as a wrong test,
not an app fault (screenshot: spinner, "No Address Selected").

- Branch checked, not created: already on `ticket/e2e-order-edits-after-placing`.
- `tests/e2e/shopper.live.spec.ts`, `ORD-01` step 4: waits up to 45 s for
  `checkout.chosenAddress` to be visible before `hasDeliveryAddress` and
  `chosenAddressTitle` judge it. The message now says how long it waited and
  that step 2 confirmed the default. No other file changed.
- `tsc` exit 0; `eslint tests/e2e/shopper.live.spec.ts` exit 0.

## Resume after verify attempt 2 (2026-09-26, `implementation-resumed`)

`/verify` attempt 2 passed case steps 1–9 on staging and failed at step 10: the
order page draws its product lines (and their `order-item-options` menu) only
after the "Order Details · N Items" card is tapped
(`OrderDetailsWrapper.tsx:694`, `OrderItemsList.tsx:53-59`). Confirmed as a wrong
test, not an app fault.

- Branch checked, not created: already on `ticket/e2e-order-edits-after-placing`.
- `tests/e2e/selectors.ts > orders`: `productsCount` — the existing
  `order-products-count` hook, inside the card's click target.
- `tests/e2e/actions/orders.ts`, `attemptCancelLine`: when no line menu shows
  within 3 s, taps the card once (it toggles, so never twice), then waits for the
  line menu. The failure messages now say which of the two was missing.
- No app file changed. `tsc` exit 0; `eslint` on both files exit 0.

## Tests written

| AC | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `tests/e2e/shopper.live.spec.ts` | `ORD-01` steps "the shopper signs in", "the bag holds one line of the QA product", "the order is placed with cash on delivery, to the account's own address", "the order is listed, opens, and the core backend holds its packs" | extend |
| AC-2 | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step "a probe address exists, and the account's default is unchanged", and the `afterEach` default-address check | extend |
| AC-3 | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step "the order offers an address change, and the core backend holds the probe" — the `offered` check names `can_update_address` with the value read | extend |
| AC-4 | `tests/e2e/shopper.live.spec.ts` | same step — the core backend read-back (every pack on the probe id) and the page's recipient, two booleans | extend |
| AC-5 | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step "hiding the order takes it off the list, and the core backend holds it hidden" | extend |
| AC-6 | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step "the hidden view shows it fully hidden, and restoring brings it back" | extend |
| AC-7 | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step "cancelling the only line leaves nothing to deliver" | extend |
| AC-8 | `tests/e2e/shopper.live.spec.ts` | `ORD-01` step "nothing of the order is still live", and the `afterEach` green-run checks (not hidden; probe gone) | extend |
| AC-9 | `tests/e2e/shopper.live.spec.ts` | `ORD-01`'s `afterEach`; proven at `/verify` by the injected `AC9-PROBE` stop | extend (the proof run belongs to `/verify`) |
| AC-10 | the six component unit files | whole files, unchanged | existing — confirmed present and green (see below) |
| AC-11 | `tests/e2e/shopper.live.spec.ts`, `tests/e2e/actions/orders.ts` | every `ORD-01` step has its own message; no `toHaveText` / `toContainText` / `toEqual` / `toMatchObject` on address data (the one `toEqual([])` compares pack ids and states) | extend — checked by reading at `/verify` |
| AC-12 | `tests/e2e/shopper.live.spec.ts`, `tests/e2e/actions/orders.ts` | `waitForRenewalSettled` before `gotoHome` / `gotoSettings`; every write through `watchCommentCall` | extend — checked by reading at `/verify` |
| AC-13 | `docs/testing/E2E_SCENARIOS.md` | `ORD-01` row | extend — checked by reading |

## Findings — confirmed bugs, out of scope

| BUG | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------|
| BUG-1 (plan FIND-3) | `BUY-01`'s last check `expect(orders.swept()…).toEqual([])` runs in the test body, before the fixture fills `swept`, so it passes even when the net later cancels a stranded order. | none written — the approved plan declared no test for it and put its fix out of scope ("including the fix for FIND-3"); found by reading `tests/e2e/fixtures.ts`, not by a failing test | `tests/e2e/shopper.live.spec.ts` (`BUY-01`, after its `finally`) | _(opened by the owner; recorded in `docs/testing/E2E_SCENARIOS.md` under BUY-01)_ |

Note on BUG-1: it lives in a file this plan changes, which would normally make it
in scope (IM-12). The approved plan and the owner's `APPROVED` decision put it
out of scope by name, so it is recorded, not fixed, and no strict-marker test was
added (none was declared).

## Validation run during implementation

- `node_modules/.bin/tsc --noEmit --pretty false` — exit 0.
- `node_modules/.bin/eslint` on the 12 changed code files — exit 0.
- `node_modules/.bin/vitest run --project unit` on
  `OrderOptionsMenu.test.tsx`, `OrderItemOptions.test.tsx`,
  `CancelOrderItemWrapper.test.tsx`, `CancelOrderItemConfirmationWindow.test.tsx`,
  `ChangeAddressWidget.test.tsx`, `OrderAddressCard.test.tsx`,
  `tests/harness/qaHarness.test.ts` — 7 files passed; 61 tests passed, 1 expected
  fail (an `it.fails` marker already in those files before this change).
- `playwright test --list --project live --grep "ORD-01|builds or confirms"` —
  collects the QA seed and `shopper.live.spec.ts:2228 › ORD-01 …` (2 tests).
- **Not run here:** the full `pnpm test:run`, `pnpm lint`, and the live `ORD-01`
  run against staging. Those belong to `/verify` (profile `logic-change`, and the
  hand run the plan names).
