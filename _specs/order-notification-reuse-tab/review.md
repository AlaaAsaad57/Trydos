---
ticket: order-notification-reuse-tab
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Review — order-notification-reuse-tab

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (FR-1–FR-10, NFR-1–NFR-3, AC-1–AC-11) and `plan.md` (Approach, Steps
1–7, Files to change, Integration surface, Tests, Validation strategy,
Rollback), with `research.md` as background. The plan passed the validation
checks: an Integration surface is written, no `OQ-n` is open, every `AC-n` has a
Tests row with a disposition, every test file is under Files to change, and the
traceability table is complete.

## Plan Summary

The order-status card gets a `refreshOrderTab` marker and its `order_group_id`.
On click, the worker uses the existing `focusOrOpenOrderTab` helper, which now
takes the message to post: `OPEN_DELIVERY_CHAT` for the chat click (unchanged),
`REFRESH_ORDER_DETAILS` for the order click. The page handler turns the new
message into `REFRESH_ORDER_DETAILS_EVENT`, and `OrderDetailsWrapper` calls
`getOrderDetails()` when the group matches. The default click path gets
`event.waitUntil`. Tests extend three existing test files.

## Risks

- See Panel Findings. The one `major` finding is about test evidence, not about
  runtime behaviour.

## Assumptions

- The push payload for `order status changed…` carries `order_group_id` in its
  body, as the worker and the page already read it today.

## Open Questions

- none

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).** The gate
> examines the owner on these findings, so they have to be readable first; the
> **Decision** and **Approvals** sections below are filled in afterwards. That is
> also why a failed gate leaves this table populated and the decision empty — it
> is what the owner re-reads before the re-run (CG-7).
>
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding, and its disposition once the decision is made. If the panel
> is disabled or returned nothing material, write "none".

| # | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|---|------|----------|---------|--------------------------|---------------------|
| | | | *Dispositions: P-1 (major) was dispositioned by the owner. Minor and info findings need no disposition (RP-1); they are carried as notes for `implement` under Required Follow-up Actions where they ask for something.* | | |
| P-1 | senior | **major** | Step 7 says every new case fails on today's code, except AC-8 and AC-11. That is wrong for three rows: AC-3, AC-4 and AC-9 pass on the old code, because a plain click today always calls `openWindow(targetUrl)` once and never focuses a tab (`firebase-messaging-sw.js:756`, checked). So the AC-9 test as written passes even with no fallback at all, and cannot prove FR-7. Suggested: in AC-9, also check that the reuse path was tried first (`focus` called in the "focus rejects" row, `postMessage` called in the "postMessage throws" row), so AC-9 fails first. Mark AC-3 and AC-4 as regression guards, green before and after, next to AC-8 and AC-11. | plan Step 7; Tests rows AC-3, AC-4, AC-9; Validation strategy | **accept** — the AC-9 case also checks that the reuse path was tried first, and AC-3 / AC-4 are recorded as regression guards (Follow-up 1–2) |
| P-2 | senior | minor | The edge case "the chosen pack stays the active pack" is true only for a pack named in `?order_id=`. A pack the shopper tapped (`setActivePack(s)`, `OrderDetailsWrapper.tsx:635`) goes back to the URL pack or to `data[0]` on refresh (`:153–157`). `handleClear()` also removes `?order_id=` after the delivery chat opens. Today's arrival refresh does the same, so nothing new comes from this ticket, but Step 6's claim is broader than the code, and no Tests row covers the edge case. | spec Edge Cases; plan Step 6 | |
| P-3 | senior | info | The loader `loadBackgroundHandler` already exists twice in `firebaseMessagingSwTags.test.ts` (`:128`, `:211`). Following it as the plan says would make a third copy. Suggested: give one loader a `notificationclick` capture and a `clients` stub in the same file. | plan Tests, "How the worker cases run" | |
| P-4 | senior | info | The Integration surface and the Rollback match the repo: one worker-message listener, one caller of `focusOrOpenOrderTab`, one mount point for `OrderDetailsWrapper`. The `message` argument is the smallest shared form. The arrival load and click load have no cancel, so the answer that returns last is shown (within OQ-3). | plan Integration surface, Rollback, Steps 3 and 6 | |
| P-5 | security | minor | The worker runs for every push of every shopper, and `skipWaiting` + `clients.claim` spread a bad worker fast. Rollback depends on browsers fetching the worker again, and `next.config.ts` sets no `Cache-Control` rule for `/firebase-messaging-sw.js`. Suggested: check the header the host sends for the worker before release, and keep the worker change easy to revert. | plan Step 4, Rollback | |
| P-6 | security | minor | If the page's `order_group_id` prop is ever `undefined`, an event with no detail compares `"undefined" === "undefined"`, so the page reloads. Small impact (one extra load), but weaker than AC-7 says. Suggested: return early when `detail.order_group_id == null`, and add that row to the AC-7 page test. | plan Step 6; AC-7 | |
| P-7 | security | info | Any same-origin script can fire the window event, as with `OPEN_DELIVERY_CHAT_EVENT` today. Worst case is extra loads through the normal token path. A reused tab may belong to another signed-in account on a shared device; the backend's owner check on the order read keeps the data safe, as for a tab opened from the URL today. Keep the message ids-only. `order_group_id` is used only in a same-origin path match. No protected path, endpoint, secret or cookie is touched. | AC-1, AC-2; plan Steps 2–6 | |
| P-8 | performance | minor | One click refresh runs the full `getOrderDetails` fan-out: 1 to 3 calls (the order group, ratings when a pack is delivered, returns when a pack has a return), not one call. NFR-1 still holds, since no endpoint is new, but the plan's "the same order load" sounds like one call. | NFR-1; plan Step 6; `OrderDetailsWrapper.tsx:102–197` | |
| P-9 | performance | minor | The arrival load and the click load mean one status change costs that tab two rounds of 1–3 calls and a second skeleton flash. The spec accepts this (OQ-2, OQ-3). If it grows later, skip the click load when the arrival load finished seconds ago — not in this ticket. | spec Constraints; plan Overlapping flows | |
| P-10 | performance | info | Worker side: one `clients.matchAll` and a scan bounded by the tab count. Page side: one listener per mounted details page. `setShouldUpdateOrders(0)` and a repeated chat-open on `?chat_id=` are the same as today. The new worker test cases cost milliseconds each. | plan Steps 3–6; Tests | |

## Decision

`APPROVED`

- Rationale: the owner approved the plan on 2026-10-21, after passing the
  comprehension gate (3/3, degraded — see `comprehension.md > degraded`). The one
  `major` finding (P-1) is about test evidence. The owner accepted it, and it is
  carried out inside the cases the plan already declares (Follow-up 1–2), so no
  new file or test case is needed.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer, 2026-10-21

## ADR reference

- ADR: none

## Required Follow-up Actions

1. **P-1 (accepted) — AC-9.** In the declared case `an order-status click opens
   a new tab when the open tab cannot be focused`, also check that the reuse path
   was tried before `openWindow`: `focus` was called in the "focus rejects" row,
   and `postMessage` was called in the "postMessage throws" row. That makes the
   case red on today's code. `implement.md` records the red run.
2. **P-1 (accepted) — AC-3 and AC-4.** Record these two declared cases in
   `implement.md` as regression guards, green before and after, next to AC-8 and
   AC-11. Do not claim a red run for them.
3. Notes from minor / info findings, for `implement` to weigh inside the
   declared files and cases only (no new scope):
   - P-2: a tapped pack resets to the URL pack on refresh, as on today's arrival
     refresh. Do not describe Step 6 as keeping "the chosen pack".
   - P-3: add the `notificationclick` capture to the existing worker loader in
     `tests/public/firebaseMessagingSwTags.test.ts` instead of a third copy.
   - P-5: keep the worker change easy to revert. Checking the host's
     `Cache-Control` header for `/firebase-messaging-sw.js` is a release check,
     not part of this ticket.
   - P-6: the page's group-id check is not declared to guard an `undefined`
     prop. Changing it is outside the approved plan; if `implement` finds it
     needed, it stops and asks (IM-4).
