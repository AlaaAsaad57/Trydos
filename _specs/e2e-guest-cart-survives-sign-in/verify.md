---
ticket: e2e-guest-cart-survives-sign-in
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-23
links:
  clickup:
  github:
---

# Verify — e2e-guest-cart-survives-sign-in

> Final validation and impact review before the ticket is closed.

## Outcome in one line

**PASSED (round 2).** Every `AC-n` is proven by a run with exit code 0 or by
the two AC-9 probe runs; the profile checks are green; the comprehension gate
passed 4/4 (degraded — see `comprehension.md`). Round 1 had failed on a test
fault, recorded below.

## Checks performed

- Validation profile: `logic-change` (`lint`, `typecheck`, `unit-tests`), from
  `.claude/project-config.yaml`, run on the final code.
- Browser case: run by hand as `plan.md > Validation strategy` says, always
  through `tests/e2e/cli.ts` (the staging guard applies).

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| all   | profile `lint` | `pnpm lint` | 0 | 0 errors; no warning in the changed files | pass |
| all   | profile `typecheck` | `node_modules\.bin\tsc.cmd --noEmit --pretty false` (after `next typegen`) | 0 | no errors | pass |
| all   | profile `unit-tests` (includes the lane guard) | `pnpm test:run` | 0 | 223 files, 3400 tests passed | pass |
| AC-1  | `BUY-05` step "the account's bag starts empty" | runs B and D (below) | 0 | step passed in both | pass |
| AC-2  | `BUY-05` step "signing out leaves a guest" | runs B and D | 0 | step passed in both | pass |
| AC-3  | `BUY-05` step "the guest puts the QA product in the bag, and the gateway takes it" | runs B and D | 0 | step passed — gateway label on the add | pass |
| AC-4  | `BUY-05` step "the guest signs in from the navigation" | runs B and D | 0 | step passed — same account id | pass |
| AC-5  | `BUY-05` step "core answers the bag after sign-in" | runs B and D | 0 | step passed — `200`, `isSuccessful: true`, `backend: core`, drawer's own read (round 1's failure fixed) | pass |
| AC-6  | `BUY-05` step "the guest's line is still in the bag, with the same quantity" | runs B and D | 0 | step passed | pass |
| AC-7  | `BUY-05` step "the bag holds nothing else" | runs B and D | 0 | step passed | pass |
| AC-8  | `BUY-05` step "removing the line takes it out, and it stays out after a reload" | runs B and D | 0 | step passed — good core read proven after the reload before the absence check | pass |
| AC-9  | `BUY-05` `afterEach`, both branches | probe runs P1 and P2 (below) | 1 (by design) | P1 (guest holds the line): annotation `bag left behind` — "\"Trydos QA product\" was left in a guest's bag that no other case uses, …". P2 (signed in, merged): no annotation; the teardown sent `POST /cart/remove` to **core** (200) and `emptyTheBag` completed | pass |
| AC-10 | every step: own `test.step`, own message, no count, no credential | reading the diff; run A's failure line | — | each step is its own `test.step` with its own message; no assertion on a count (lines are judged by name); account ids are compared, never printed; run A's failure named the step and `backend=core` | pass |
| AC-11 | `docs/testing/E2E_SCENARIOS.md` BUY-05 row | reading the file | — | row present; count 115; cost text updated. The row says `shopper.live.spec.ts:1587`, two lines above the case (now `:1589` after the round-2 edit), inside the BUY-05 block. The owner accepted AC-11 with this recorded as a finding (2026-09-23) | pass (owner-accepted, see Findings) |

## Commands run

Runs in time order. Every run used the same build (`--skip-build` after run A).

- **Code budget (plan step 9)** — before run A: Shopper A's number is on
  `.env.development > OTP_TEST_PHONES` (checked with booleans only). A normal
  account-lane run already signs Shopper A in at least 11 times. Planned
  total: about 9. The owner approved going to 11 before run D (review C-4).
  Codes spent on Shopper A: A 2, B 2, P1 1, P2 2, D 4 = **11**. Shopper B: one
  per run (the QA seed), 5.
- `gh run list --status in_progress` / `--status queued` — none, before runs A
  and B.
- `pnpm e2e:health` — passed before runs A and B.
- **Run A — round 1** — `npx tsx tests/e2e/cli.ts run --lane=account "shopper[.]live[.]spec[.]ts" "--grep=BUY-05|@prod-safe"` (with build).
  15:15:28–15:22:40, **exit 1**: BUY-05 failed at "core answers the bag after
  sign-in": `answered 200 (backend=core, success=null) … sub_total=1000`.
  Cause: the check read a body `success` field that the backends never send
  (they send `isSuccessful`; the app's `success` is made from the status at
  `utils/fetchData.ts:784`). Test fault in `tests/e2e/actions/cart.ts`, a
  planned file → recorded `failed`, back to implement, fixed there (see
  `implement.md > Rework`).
- **Run B — round 2, BUY-05 alone** — same command plus `--skip-build`.
  15:26:50–15:32:57, **exit 0**. `✓ [setup] QA seed (1.5m)`,
  `✓ BUY-05 … (2.7m)`, 18 passed.
- **Run P1 — AC-9 probe 1** — temporary `throw new Error("AC9-PROBE")` right
  after `lineInBag = lineName` (the guest step), plus `--reporter=list,json`.
  Exit 1 by design: `Error: AC9-PROBE` (1.5m); JSON report annotation
  `bag left behind` with the guest wording. Probe removed.
- **Run P2 — AC-9 probe 2** — the throw right after the second sign-in's
  account check. Exit 1 by design: `Error: AC9-PROBE` (1.9m); JSON report: **no**
  annotation; server log: `api=/cart/remove m=POST st=200 "backend":"core"`
  after the probe. Probe removed. Unrelated in the same run: `qaLock` QA-09c
  failed (`/sitemap-products.xml` did not answer) — see Findings.
- **Probe clean-up check (review C-3)** — `git grep -n "AC9-PROBE" -- tests docs`
  → no match (exit 1); `git grep -n "AC9-PROBE" HEAD -- tests docs` → no match
  (exit 1); `git diff --cached | grep -c "AC9-PROBE"` → 0.
- **Run D — the whole money-path file** — `npx tsx tests/e2e/cli.ts run --skip-build --lane=account "shopper[.]live[.]spec[.]ts" "--grep=BUY-0|@prod-safe" "--reporter=list,json"`.
  15:48:13–16:02:37, **exit 0**, 22 passed (14.4m):
  ```
  ✓ BUY-01 … (2.2m)   ✓ BUY-02 … (1.4m)   ✓ BUY-03 … (3.4m)
  ✓ BUY-04 … (1.8m)   ✓ BUY-05 … (2.7m)   + seed and QA-01..QA-11
  ```
- **Profile on the final code** — `pnpm lint` 0, `tsc --noEmit` 0,
  `pnpm test:run` 0 (3400 passed).

## The VF-7 exception (owner's decision)

The approved plan proves AC-9 by adding a temporary `AC9-PROBE` throw at
verify. VF-7 says verify edits no implementation file. The owner chose to
allow the probe edits (2026-09-23). Each probe was one line in
`tests/e2e/shopper.live.spec.ts`, added before its run and removed right after
it; the clean-up check above shows no trace in the working tree, in `HEAD`, or
staged. No other file was edited at verify, and no commit was made.

## Findings — confirmed bugs, out of scope

No `BUG-n`: no test proved existing **app** behaviour wrong. Round 1's failure
was this ticket's own test fault, fixed in round 2.

Carried from `implement.md` (recorded, not fixed, not ticketed — one active
work item):

- Unredacted cart bodies in other `tests/e2e/actions/cart.ts` messages
  (address form, quantity change).
- `watchCartAdd` listener left on after a throw in `addOpenProductToBag`.
- `sendOtpWithRetry` has no upper limit on its sleep
  (`tests/e2e/actions/auth.ts:594-608`).
- Stale line numbers for BUY-01..BUY-04 in `docs/testing/E2E_SCENARIOS.md`.
  **The BUY-05 row is now one line off too**: it says `:1587`; the round-2 edit
  moved the case to `:1589`. Same doc, same kind of drift — the whole column
  needs one pass.

New in this stage:

- **A file filter does not limit the `@prod-safe` match.** With
  `"shopper[.]live[.]spec[.]ts" --grep "BUY-05|@prod-safe"`, all sixteen
  `qaLock.live.spec.ts` cases ran too — in `--lane=account` the lane list
  appears to decide the files. It cost about two extra minutes per run and no
  codes. Suite tooling.
- **`qaLock` QA-09c failed once** (probe run P2): "the product sitemap a
  search engine reads did not answer at all (/sitemap-products.xml)". It
  passed in runs A, B, P1 and D. A staging answer that did not come, not this
  ticket's code.

## Integration surface — did it hold?

- **Shared helpers.** `addQaProductToBag` now also returns `backend`;
  BUY-01..BUY-04 read only `bought` and all passed in run D beside BUY-05.
  `watchCartMoney`'s new fields changed only message text for `emptyTheBag`,
  `removeLineNamed` and BUY-03; those all passed.
- **Backends.** The gateway answered the guest's add, and core answered every
  bag read after sign-in and the teardown's removal — as the plan's surface
  says.
- **Shopper A's session and bag.** BUY-05 used its own context and no saved
  session; BUY-01..BUY-04 ran after the seed and before BUY-05 in run D
  without a session fault. The sign-outs revoked no other session.
- **Code budget.** 11 sends on Shopper A in about 50 minutes, with no refusal
  and no cooldown failure.
- **Lane time.** BUY-05 takes 2.7 minutes on a healthy run. The whole account
  lane was **not** run, so its total time against the 85-minute
  `globalTimeout` is not measured here — running it would spend at least 11
  more codes. Recorded, not hidden (review P-4).

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **No.**
- No protected runtime path was touched (`proxy.ts`, `next.config.ts`,
  `instrumentation*`, `sentry.*`, `.github/workflows/**`).

## Sign-off

- Outcome: **verified** (outcome `passed`)
- Final ticket state: `completed`
- Sign-off: developer — self sign-off, comprehension gate 4/4
- Commit: none created at verify (VF-10)
- Notes: Round 1 (`failed`, test fault) is kept in the Commands run list above
  and in `ticket.md`'s history.
