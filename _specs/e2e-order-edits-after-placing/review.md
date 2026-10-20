---
ticket: e2e-order-edits-after-placing
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-09-26
links:
  clickup:
  github:
---

# Review — e2e-order-edits-after-placing

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (AC-1..AC-13) and `plan.md` as they stand on 2026-09-26. Before this
gate, the owner asked for an advisory panel outside the gate, and `plan.md` was
edited directly with those findings (S-1..S-9, SEC-1..SEC-6, P-1..P-8 in the
plan). This gate ran the panel again on the edited plan. The findings below are
from that second round only.

## Plan Summary

One live case, `ORD-01`, placed last in `tests/e2e/shopper.live.spec.ts`. It
places a COD order for one line of the QA product, moves it to a run-tagged probe
address, hides it, restores it from the hidden view, and cancels its only line.
Each change is checked on the screen and on the core backend, with booleans only
for address data. A describe-level `afterEach` restores, cancels, puts the default
address back and deletes the probe, in that order. The order screens get 11
`data-pw` hooks. `throughProxyInPage` gains `PATCH` and a `backend` label;
`watchCommentCall` gains a `label`; `findOrderInList` / `openOrderFromList` match
the id exactly. AC-9 is proven at `/verify` with a temporary injected stop.

## Risks

- A hidden, live order left on staging when the teardown fails or misreads an
  empty answer (G-SEC-1, G-S-1).
- The account's address text reaching the public CI log through Playwright's own
  error output (G-SEC-2).
- One more one-time code per run on a number that is already used four times.

## Assumptions

- `can_update_address` is true for a new COD order on staging. Not proven; the
  case goes red and names the flag if it is false (AC-3).
- `getOrdersByOrderGroupID` leaves hidden packs out. Probable, from a code
  comment; the AC-9 run at `/verify` confirms it.

## Open Questions

- none for the gate. The plan answers OQ-3, OQ-6 and OQ-7.

## Panel Findings (advisory)

> Written before the comprehension gate runs (RP-4). Advisory only (RP-2).

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| security | major | **G-SEC-1 — an empty pack list counts as "done".** `cancelOrderGroup` sets no `problem` when the answer holds 0 packs (`harness/orderCleanup.ts:236-263`). The plan releases the order "when every pack was handled", which is true by default for 0 packs; case step 11's "every pack reads cancelled" is also true for an empty list. Since hidden packs may be left out of that answer (OQ-6), a failed restore gives 0 packs, the order is released, and a hidden, live order stays on staging while AC-8 passes. Fix: release only when the answer holds every pack id read in case step 5; cancel by those saved pack ids; keep the order registered and annotate when none is found. | plan OQ-6 steps 2 and 5; case step 11; AC-8, AC-9 | mitigate (see below) |
| senior | major | **G-S-1 — the teardown races the running app for the refresh token.** The hook calls `throughProxyInPage` on a page where the app is still mounted. Its 401 path posts `/api/auth/refresh` (`orderCleanup.ts:164-180`) while the app may start its own renewal; the refresh token is single-use, so one exchange is refused. If the app's is refused, it registers a guest, restore and cancel run as that guest, and step 5 re-registers the guest jar with the fixture — so nothing cleans up. `harness/liveSession.ts:140-172` and `fixtures.ts:111-115` already avoid this by leaving the app first. Fix: first lines of the hook are `waitForRenewalSettled(page)` then `page.goto("/robots.txt")`. | plan OQ-6 steps 1-5; AC-9 | mitigate (see below) |
| performance | minor | **G-P-4 — the timed-out body keeps running during the hook.** Playwright abandons the body promise but does not cancel it, so a body call inside a 401 → refresh path can race the hook the same way. Fix: wait for renewal to settle before the first teardown write; log a teardown 401 as "session lost". (Same root as G-S-1.) | plan OQ-6; `workerProcessEntry.js:1642-1647` | |
| security | minor | **G-SEC-2 — SEC-1 is incomplete.** Playwright's own locator errors ("strict mode violation", "resolved to …", "intercepts pointer events") print element text. Picking one row among all saved addresses can print the other rows' text through `stdio: "inherit"`. Fix: add an address-id hook to each row in `ChangeAddressWidget.tsx` and select by `probeId`. | plan step 5 `attemptChangeAddress`; step 1; AC-11 | |
| security + senior + performance | minor | **G-SEC-3 / G-S-2 / G-P-2 — the `PATCH` change to `watchCommentCall` rests on a wrong fact.** `fetchData` sends every proxied call as `POST /api/proxy` and the real verb only in `x-proxy-method` (`utils/fetchData.ts:618-649`). The watcher already sees hide and restore. The Integration surface argument about `PATCH` callers rests on the same error. Also, the watcher matches a substring of `x-proxy-url`, and `…/{id}/visibility` and `…/detail/{id}/visibility` share an ending. Fix: drop the `PATCH` change, keep only `label`; always watch the full path with the pack id. | plan step 4; Files to change; Integration surface | |
| security | minor | **G-SEC-4 — the teardown does not check the group id is set.** With an empty id, `getOrdersByOrderGroupID?order_group_id=` may answer other orders of the shared account, and `cancelOrderGroup` would cancel them. Fix: skip steps 1-2 when `groupId` is empty; check `order_group_id === groupId` on each pack before cancelling. | plan OQ-6 steps 1-2 | |
| security | minor | **G-SEC-5 — "the card's parent" must mean the direct parent only.** A wider parent is the whole hidden list, where `.first()` could press another order's eye, which restores all its packs (`HiddenOrderItem.tsx:95-149`, `:144`). Fix: `xpath=..` from the exact-id card; assert exactly one `restore-hidden-order` inside it. | plan step 5 `findHiddenOrder`; case step 9 | |
| senior | minor | **G-S-3 — "back in the list" can read a hidden card.** The hidden view is swapped in place (`OrdersView.tsx:41-52`), and hidden cards carry the same `order-group-id` hook `findOrderInList` uses (`OrderItemId.tsx:65`). Fix: leave the hidden view with its back control, assert the URL has no `view=hidden`, and assert a non-null status. | plan steps 5 and 6.9; AC-6 | |
| performance | minor | **G-P-1 — the timeout reasoning is wrong for Playwright 1.62.1.** `afterEach` and fixture teardown get their own fresh slot (`workerProcessEntry.js:1650-1667`), so the hook's `+6 min` line makes that slot 21 minutes, and the upper limit for `ORD-01` is 36 minutes, not 15. Still inside `globalTimeout` 85 minutes. Fix the text in OQ-6 "Time" and in "Lane time". | plan OQ-6 "Time"; Integration surface | |
| performance | minor | **G-P-3 — the code-cooldown wait has no upper limit.** `sendOtpWithRetry` sleeps the first number it finds in the cooldown or error text, up to 5 times (`actions/auth.ts:589-614`). A few long waits can spend the 15 minutes, possibly after the order exists. Fix: give `ORD-01` its own cap on total cooldown wait (for example 3 minutes) and fail before the order, naming the step. | plan step 8; case step 1 | |
| senior | info | **G-S-4 — AC-8's literal wording is replaced.** The spec says "the leftover-order net catches nothing"; the plan proves it by a backend read instead, because `swept` is empty until fixture teardown. The owner should accept this reading on purpose. | spec AC-8; plan case step 11; FIND-3 | |
| senior | info | **G-S-5 — `maxScrolls: 0` still scrolls once** and waits up to 8 s (`orders.ts:78-111`). The plan's "need not scroll" sentence is not what the code does. | plan step 5 "Not listed" | |
| senior | info | **G-S-6 — `E2E_SCENARIOS.md:12` also says "one address BUY-03 creates"**; `ORD-01` adds a second probe. | plan step 9 | |
| security | info | **G-SEC-6** — `PATCH` in `throughProxyInPage` opens no new surface; escape the id in the new `RegExp` anyway. **G-SEC-7** — the run video shows the account's whole address list; the workflow encrypts it, keep traces off. | `app/api/proxy/route.ts:88`; `playwright.config.ts:163` | |
| performance | info | **G-P-5** — the other-row check, the hidden-orders reads, and QA stock (about 250 runs of stock) are fine. | `OrdersListWrapper.tsx:20`; `qaSeed.ts:159` | |

### Dispositions of `major` findings (owner)

- **G-SEC-1 — mitigate.** `/implement` applies the fix inside the declared
  files: release the order only when the answer holds every pack id read in case
  step 5; cancel by those saved pack ids; when none is found, keep the order
  registered and annotate. Case step 11 fails on an empty answer. Recorded in
  `implement.md` as a deviation from the plan text.
- **G-S-1 — mitigate.** `/implement` makes the first lines of the `afterEach`
  `waitForRenewalSettled(page)` then `page.goto("/robots.txt")`, before any
  clean-up call and before the step-5 re-register. Recorded in `implement.md` as
  a deviation from the plan text.

Minor and info findings were not dispositioned by the owner. They stay advisory;
`/implement` follows the plan text for them (see follow-ups).

## Decision

`APPROVED`

- Rationale: owner decision at the gate, after the comprehension check passed
  3/3. The two `major` findings are mitigated inside the declared files at
  `/implement`, as recorded above.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer, 2026-09-26

## ADR reference

- ADR: none

## Required Follow-up Actions

- `/implement`: apply the G-SEC-1 and G-S-1 mitigations above, and record both
  as deviations in `implement.md`.
- `/implement`: note in `implement.md` that the plan's step 4 `PATCH` change to
  `watchCommentCall` has no effect (G-SEC-3 / G-S-2 / G-P-2): `fetchData` sends
  every proxied call as `POST /api/proxy`. The owner did not disposition this
  minor finding, so the plan text stands.
- `/verify`: the comprehension record is degraded (see `comprehension.md >
  degraded`): the G-S-1 seeded question was lost to falsification. The verify
  gate should ask about the G-S-1 mitigation as it was built.
