---
ticket: e2e-guest-cart-survives-sign-in
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-09-23
links:
  clickup:
  github:
---

# Review — e2e-guest-cart-survives-sign-in

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (with the FR-8 / AC-9 wording changed in plan round 2) and `plan.md`
revision 3. Context: `research.md`. Two advisory panel rounds ran before this
gate at the owner's request, and their findings were folded into the plan
directly; the plan lists them under "Panel findings addressed". This gate ran
the panel a third time, on revision 3.

## Plan Summary

A new live case `BUY-05` in `tests/e2e/shopper.live.spec.ts`: sign in as
Shopper A, empty the bag, sign out, add the QA product as a guest (gateway),
sign in again from the navigation, prove core answers the bag, that the line
survived with the same quantity and nothing else is in the bag, then remove it
and prove it stays out after a reload. Small helper additions in
`tests/e2e/actions/cart.ts` (backend label, `bagLineQuantity`, `bagLineNames`,
`waitForGoodRead`), one selector (`cart.orderBar`), and a docs row. No
application code changes.

## Risks

- Four one-time codes per run on one shared phone, and about nine in the
  `/verify` session.
- The account lane loses 3–5 minutes of margin on a normal run.
- The "drawer read finished" proof (see panel major S-1) and the good-read loop
  (see panel major S-2).

## Assumptions

- The core backend merges the guest's bag at sign-in (docs AC-12, GV-4).
- `TEST_ACCOUNT_PHONE` can take the planned number of sends (checked at step 9).

## Open Questions

- none

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).**
>
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| # | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|---|------|----------|---------|--------------------------|---------------------|
| S-1 | senior | major | `order-bottom-button` does **not** prove the drawer's read had no error. On a failed read `getCart` sets the error and throws, then its `catch` calls the callback with `{ cart: [] }`, and `initCart` resets `cartShippingSuccess` to `null` (`utils/functions.tsx:322-334`, `store/Cart/reducer.ts:391-394`). So a failed read draws an **empty bag with the order bar**, not the error panel. Step 5.9's "line absent" can pass on a failed read (a `200` with `success: false` also passes), and step 5.6 can turn a failed read into a false AC-6 red. The bar does show on an empty bag, so it is a "loading finished" signal, not an "error-free" one. Fix: add `success` to `CartMoneyAnswer`; after the bar is visible wait until `seen === sent` for `shipping`, then require the last answer to be `200`, `success === true`, `backend === "core"`. | plan step 4, steps 5.6, 5.9; AC-5, AC-8 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| S-2 | senior | major | `waitForGoodRead` spins without end if `after` is not moved on after a `401`: `waitForAnswer` returns at once when `answers[which].seq > after` (`cart.ts:1107-1109`), so calling it again with the same `after` returns the same `401` every time, until the 90 s deadline — a false red on the normal token-expiry path. Fix: set `after = answer.seq` after each `401`; count `401`s by answer, not by loop turn. | plan step 3; AC-5, AC-8 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| S-3 | senior | minor | The judged answer can still be the home page's read, not the drawer's (`CartProvider.tsx:77` → `services/home.ts:67`; `getCart` polls for a user id first). S-1's "judge `last` once the bar is visible and `seen === sent`" rule fixes this too. | step 5.6 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| S-4 | senior | minor | "The browser never asked" needs a `sent` baseline taken with the mark; `sent()` is a running total (`cart.ts:1097`). | steps 3, 5.6 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| S-5 | senior | info | `openCart` waits 45 s for a first line on an empty bag (`cart.ts:113-117`), so healthy runs pay about 45 s in steps 5.2 and 5.9. Count it in the time estimate. | steps 5.2, 5.9 | Noted (info — no action required) |
| C-1 | security | minor | Slicing before `redact()` can leak part of a secret: `redact()` matches whole values only (`harness/redact.ts:121-123`). Redact the full body, then slice. | step 1 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| C-2 | security | minor | The quoted `message` field skips `redact()`; backend messages can echo request data (`auth.ts:887-893`). Redact the whole `said()` string on every branch. | step 1 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| C-3 | security | minor | The `AC9-PROBE` check covers the staged diff at one moment only, and `grep` may be missing on Windows. Also run `git grep -n AC9-PROBE` on the working tree and on `HEAD` before push; record both as empty. | "How AC-9 is proven" | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| C-4 | security | minor | The code budget has no rule for re-runs. Every re-run counts; before any send past the confirmed limit, stop and ask the owner. | steps 9, 10 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| C-5 | security | info | Account ids can reach public logs if a message prints both. Word it as "the id did not change", or accept ids as non-secret. | steps 5.3, 5.5 | Noted (info — no action required) |
| P-1 | performance | minor | The Time budget table leaves out `waitForRenewalSettled` (about 4 calls × up to 20 s, `renewalGate.ts:44`) and the repeated waits inside `emptyTheBag` / `removeLineNamed`; the worst case is about 18 min. The 15 min limit can stay ("a limit, not a sum"). | Time budget | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| P-2 | performance | minor | The `afterEach` clean-up shares the test's time, so a late failure can leave `emptyTheBag` no time. Extend the timeout at the top of the signed-in branch (`testInfo.setTimeout(testInfo.timeout + 2 * 60_000)`). | step 6; AC-9 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| P-3 | performance | minor | `bagLineQuantity`: `inputValue()` waits up to `actionTimeout` 20 s (`playwright.config.ts:112`) when the field is absent. Check `count()` first and return `null` at 0. | step 3 | Mitigate at `/wf:implement` (owner, 2026-09-23) — same files as `plan.md > Files to change` |
| P-4 | performance | info | Lane margin is recorded, not enforced. If the measured margin is under 15 min, open the follow-up before merge. | Validation strategy | Noted (info — no action required) |

## Decision

`APPROVED`

- Rationale: the owner passed the comprehension check 5/5 (`comprehension.md`,
  attempt 1) and approved spec + plan revision 3. The two `major` findings and
  the nine `minor` findings are to be mitigated at `/wf:implement`. Every fix
  stays inside the three files `plan.md > Files to change` already lists
  (`tests/e2e/actions/cart.ts`, `tests/e2e/shopper.live.spec.ts`,
  `tests/e2e/selectors.ts`) plus the docs row, so the file scope does not grow.
  `plan.md` itself is not edited here (RV-11); the fixes are carried as the
  follow-up actions below, and `/implement` records each one in `implement.md`.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approval, 2026-09-23

## ADR reference

- ADR: none

## Required Follow-up Actions

At `/wf:implement`, in addition to `plan.md` revision 3, and within the same files:

- **S-1** — add `success: boolean | null` to `CartMoneyAnswer` (parsed in the
  branch that already parses the body). In steps 5.6 and 5.9: once
  `cart.orderBar` is visible, wait until `seen("shipping") === sent("shipping")`,
  then require `last("shipping")` to be status `200`, `success === true` and
  `backend === "core"`, quoting `said` on failure. Fix the `cart.orderBar`
  comment: it means "loading finished", not "no error".
- **S-2** — in `waitForGoodRead`, set `after = answer.seq` after each `401`;
  count `401`s by answer, not by loop turn.
- **S-3** — judge `last("shipping")` only after the rule in S-1 (covers the
  home page's own read).
- **S-4** — take `sentAtMark = watch.sent("shipping")` with the mark; "never
  asked" compares against it.
- **C-1 / C-2** — `redact()` the whole `said()` text on every branch, and on
  the fallback redact the full body **before** slicing to 400.
- **C-3** — before any push, also run `git grep -n AC9-PROBE` on the working
  tree and on `HEAD`; record both empty in `verify.md`.
- **C-4** — every re-run counts against the code budget; before any send past
  the confirmed limit, stop and ask the owner.
- **P-1** — add `waitForRenewalSettled` (about 4 × 20 s) and the waits inside
  `emptyTheBag` / `removeLineNamed` to the Time budget comment; the 15-minute
  limit stays.
- **P-2** — at the top of the clean-up's signed-in branch,
  `testInfo.setTimeout(testInfo.timeout + 2 * 60_000)`.
- **P-3** — `bagLineQuantity` checks `count()` first and returns `null` at 0
  before calling `inputValue()`.
