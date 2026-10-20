---
ticket: e2e-order-edits-after-placing
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-26
links:
  clickup:
  github:
---

# Verify — e2e-order-edits-after-placing

> Verify attempt 3. `ORD-01` **passed** against real staging, and the AC-9
> injected-stop run proved the teardown on a hidden, live order. The outcome is
> recorded after the comprehension gate (below).

## Entry

- §G E1: no `comprehension.md` in the workspace (attempts 1 and 2 failed before
  their gate; the review record was retired to `comprehension-review-1.md` in
  attempt 1). Nothing to retire.

## Live runs (declared browser case)

| Run | Command | Exit | Result |
|---|---|---|---|
| health | `pnpm e2e:health` | 0 | "search 726ms, gateway 940ms, core backend 6430ms" |
| green | `node_modules/.bin/tsx tests/e2e/cli.ts run --lane=account 'shopper[.]live[.]spec[.]ts' --grep "ORD-01\|builds or confirms"` | **0** | `[setup] QA seed … builds or confirms` ✓ (1.6 m); `[live] ORD-01 …` **✓ passed (2.4 m)**. "2 passed (4.1m)" |
| AC-9 | same, `--skip-build --reporter=list,json`, with the temporary stop after case step 8 | 1 (expected) | seed ✓; `ORD-01` ✘ on `Error: AC9-PROBE` — the injected stop, as planned |

`ORD-01`'s own result is read from the report, not from the exit code alone:
`✓ 2 [live] › … ORD-01 …` in the green run.

### The green run, step by step (core backend answers, from the request log)

`/customer/address/add` 200 → `set-default` 200 →
`/customer/order/checkout/cash_on_delivery` 200 → `/customer/order/list` 200 →
`getOrdersByOrderGroupID` 200 → `change-address` 200 → read-back 200 →
`PATCH /customer/order/970/visibility` 200 → list 200 → `getHiddenOrders` 200 →
`PATCH …/970/visibility` 200 (restore) → `getHiddenOrders` 200 → list 200 →
`cancel-item` 200 → `getOrdersByOrderGroupID` 200 (line qty 0; step 11: no pack
live) → teardown: `/customer/address/delete` 200 → `getHiddenOrders` 200 (AC-8:
not hidden). The order was released by the case itself, so the teardown made no
restore or cancel call.

### The AC-9 run — teardown on a hidden, live order

Stop placed right after case step 8 (order hidden, address changed, nothing
cancelled). Annotations from the JSON report:

- `AC9-PROBE hidden read` — "getOrdersByOrderGroupID while hidden: status 200,
  packs 0". **This settles OQ-6:** the core backend leaves a hidden pack out of
  that answer, so the fixture's old net (`cancelOrderGroup`) would have seen no
  pack and cancelled nothing. The G-SEC-1 mitigation (cancel by saved pack ids,
  restore first) was needed.
- `order restored by the teardown` — "order SA7954FATKUCYSKJ, pack 971: the
  restore answered 200 from the core backend".
- `order cancelled by the teardown` — "… pack 971: the cancel answered 200 from
  the core backend".
- No `order may still be live` note → the order was proven closed and released.
- No `stranded address` note; `/customer/address/delete` 200 → the probe is gone.
- The teardown's default-address assertion passed (the only error is `AC9-PROBE`).

Request order in the log: `PATCH …/971/visibility` (hide) → … →
`PATCH …/971/visibility` (restore, teardown) → `getOrdersByOrderGroupID` →
`/customer/order/cancel` 200 → `getOrdersByOrderGroupID` → `/customer/address/delete` 200.

**The stop was removed before anything else:** `grep -c AC9-PROBE` → 0 in the
file, 0 in `git diff`, 0 in `git diff --cached`.

### Observations — not from this change

- `ReferenceError: window is not defined` at module evaluation of the SSR chunk
  `.next/server/chunks/ssr/_1fbu7i0._.js`, once per run that reaches the order
  screens (attempts 2, 3). This change adds `data-pw` attributes only. Not
  investigated; worth its own ticket.
- An Elasticsearch `TimeoutError` in `getBoutiques` / `fetchFallbackProducts`
  (home page, server side) in the green run — a staging search hiccup; no step of
  `ORD-01` depends on it.

## Validation profile `logic-change` (pre-existing)

| Check | Command | Exit | Summary |
|---|---|---|---|
| lint | `pnpm lint` | 0 | 0 errors, 78 warnings; `eslint` on every changed file (final state) exit 0 |
| typecheck | `tsc --noEmit --pretty false` | 0 | final state, after the probe was removed |
| unit-tests | `pnpm test:run` ×2 (attempt 1) | **1** | 2 failures each time in `compare.test.tsx` and one `Rdb*` input test; not from this change — they pass alone, `compare.test.tsx` passes 3/3 with the change stashed and 5/5 alone with it, and none imports a changed file. The declared AC-10 files passed in both runs. Since then only e2e test files changed, which no unit test imports except `expectedBagFigure.test.ts` (not touching the changed files). |

The unit-tests check exited 1, and that is recorded as it is. The failures are
proven unrelated; they are not caused by this ticket.

## Per-AC status

| AC | Status | Evidence |
|------|--------|----------|
| AC-1 | **met** | green run: sign-in, `checkout/cash_on_delivery` 200, order listed and opened, packs read |
| AC-2 | **met** | probe created (200, id); default put back and confirmed; the teardown's default check passed in both the green and the AC-9 run |
| AC-3 | **met** | the address change was offered (step 6 passed) |
| AC-4 | **met** | `change-address` 200; read-back showed the probe id on every pack; the page showed the probe's recipient (two checks) |
| AC-5 | **met** | hide 200; another row drawn and the order absent; `getHiddenOrders` listed it hidden |
| AC-6 | **met** | hidden screen showed it fully hidden; restore 200; back in the list with a status; `getHiddenOrders` no longer held it |
| AC-7 | **met** | `cancel-item` 200; the line read `qty` 0 on the core backend; the page read cancelled |
| AC-8 | **met** | step 11: every saved pack present, none live; teardown: `getHiddenOrders` held nothing of the group, probe gone |
| AC-9 | **met** | AC-9 run: restore 200 → cancel 200 → released → probe deleted, default unchanged, all from the teardown |
| AC-10 | **met** | the six order-component unit files passed; lint and typecheck exit 0 |
| AC-11 | **met** | read by script over the `ORD-01` block: 0 `toHaveText` / `toContainText` / `toMatchObject`; the one `toEqual([])` compares pack ids and states; every `expect` has a message; 10 named steps |
| AC-12 | **met** | every navigation (`gotoHome`, `gotoSettings`, the teardown's `/robots.txt`) follows `waitForRenewalSettled`; every write goes through `watchCommentCall` (first non-401 answer) |
| AC-13 | **met** | `docs/testing/E2E_SCENARIOS.md` holds the `ORD-01` row |

## Integration surface — did it hold?

- `throughProxyInPage` (`PATCH`, `backend`): used by the seed, the case and the
  teardown in three live runs; `tsc` 0 for every caller.
- `watchCommentCall` (`label`): the case's writes named "the core backend" from
  the label; `tsc` 0; the comment/rating unit tests passed.
- `findOrderInList` / `openOrderFromList` (exact id): used by `ORD-01` in the green
  run; `BUY-01` was not run here (the run used `--grep`).
- Placement last in the file: not exercised by a `--grep` run; the header comment
  states it.
- Shared account: each run left no order live, no order hidden, and no probe
  address.

## Findings

| BUG | Scenario that is wrong | Confirming test | Where | Expected vs actual | Ticket |
|------|------------------------|-----------------|-------|--------------------|--------|
| BUG-1 (plan FIND-3) | `BUY-01`'s last `orders.swept()` check runs before the fixture fills `swept` | none (plan declared none) | `tests/e2e/shopper.live.spec.ts`, `BUY-01` | expected: fails when the net later cancels a stranded order; actual: always reads `[]` | _(owner)_ |

BUG-1 lies inside a file this plan changes, but the approved plan put its fix out
of scope by name; it is recorded, not fixed.

## Not done

- The measured `ORD-01` time next to its row in `E2E_SCENARIOS.md` (plan step 9,
  P-5): measured here — **2.4 min** in the green run — but this stage may not edit
  that file (VF-7). Left for the owner or a follow-up.

## Cost of verification (all attempts)

- **Shopper sign-ins (one-time codes):** four — one per `ORD-01` run (attempts
  1, 2, 3, and the AC-9 run). The QA seed also signed in once per run as
  Shopper B, on its short path.
- **Probe addresses:** four created, four deleted.
- **Real orders:** three — pack 969 (attempt 2) cancelled by the teardown; pack
  970 (attempt 3) cancelled through the screens; pack 971 (AC-9 run) restored and
  cancelled by the teardown. Attempt 1 placed none.
- None left live, hidden or stranded.

## Comprehension gate

- Attempt 1 — **failed**, `0/0`: the falsifier answered its whole final round, so
  nothing could be administered (retired as `comprehension-verify-1.md`, no
  answer key).
- Attempt 2 — **passed**, `3/3`, answered by the owner. One question was dropped
  by the falsifier; the three survivors were shown with four of their six
  falsified options (the question tool's limit), recorded in `degraded:`.

## Outcome

**`passed`** — every `AC-n` (AC-1 to AC-13) is met with the evidence above: the
declared live case `ORD-01` passed on real staging, the AC-9 run proved the
teardown on a hidden, live order, the declared AC-10 unit files passed, and lint
and typecheck exit 0. The comprehension gate passed at attempt 2.

Open items the owner decides on, none inside this plan's scope:
- BUG-1 (FIND-3) — its own ticket.
- The unit-tests check exited 1 on two unrelated, load-dependent failures
  (`compare.test.tsx`, one `Rdb*` input test).
- The SSR `window is not defined` error on the order screens — its own look.
- The measured `ORD-01` time (2.4 min) is not yet written next to its row in
  `E2E_SCENARIOS.md`.
- `OTP_TEST_PHONES` on staging was not checked (it cannot be read from here).
