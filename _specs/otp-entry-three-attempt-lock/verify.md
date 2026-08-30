---
ticket: otp-entry-three-attempt-lock
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Verify — otp-entry-three-attempt-lock

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: **`logic-change`** — `lint`, `typecheck`, `unit-tests`, each
  at depth `all-ac`.

Every declared test file was run **on its own** as well as inside the whole suite,
so each `AC-n` has an exit code of its own rather than sharing one suite-wide pass.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | `usePhoneVerifyFlow.test.tsx::says two tries are left after the first wrong code` | `npx vitest run --project unit tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | 0 | Tests 38 passed (38) | **pass** |
| AC-2 | `usePhoneVerifyFlow.test.tsx::counts the second wrong code down to one try left` | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |
| AC-3 (boxes dead) | `screens/EnterPinScreen.test.tsx::takes nothing more once the tries have run out` | `npx vitest run --project unit tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` | 0 | Tests 18 passed (18) | **pass** |
| AC-3 (digits cleared) | `usePhoneVerifyFlow.test.tsx::clears the wrong code so the shopper can type the next one` — disposition `existing`, nothing written | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |
| AC-4 | `usePhoneVerifyFlow.test.tsx::drops the count and says to ask for a new code on the third` | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |
| AC-4 (login surface) | `FullEnhancedLoginWidget.test.tsx::says how many tries are left, then says the tries ran out` | `npx vitest run --project unit tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx` | 0 | Tests 4 passed (4) | **pass** |
| AC-5 | `screens/EnterPinScreen.test.tsx::closes the keypad when the tries run out` | same as AC-3 | 0 | Tests 18 passed (18) | **pass** |
| AC-6 | `usePhoneVerifyFlow.test.tsx::gives three fresh tries once a new code arrives` | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |
| AC-7 | `usePhoneVerifyFlow.test.tsx::stays locked when the request for a new code fails` | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |
| AC-8 | `FullEnhancedLoginWidget.test.tsx::does not spend a try when the number has no account` | same as AC-4 (login) | 0 | Tests 4 passed (4) | **pass** |
| AC-9 | `usePhoneVerifyFlow.test.tsx::spends one try when the boxes report a finished code twice at once` | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |
| AC-10 | `VerifyPhoneFlow.test.tsx::still counts down to a new code while the boxes are locked` | `npx vitest run --project unit tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx` | 0 | Tests 27 passed (27) | **pass** |
| AC-11 | `screens/EnterPinScreen.test.tsx::says the code ran out of life when it is both spent and locked` | same as AC-3 | 0 | Tests 18 passed (18) | **pass** |
| ~~AC-12~~ | retired before approval, id not reused | — | — | — | n/a |
| AC-13 (re-verify) | `VerifyPhoneFlow.test.tsx::locks the boxes after three wrong codes` | same as AC-10 | 0 | Tests 27 passed (27) | **pass** |
| AC-13 (cart) | `InlineVerifyPanel.test.tsx::locks the boxes after three wrong codes` | `npx vitest run --project unit tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx` | 0 | Tests 23 passed (23) | **pass** |
| AC-13 (login) | `FullEnhancedLoginWidget.test.tsx::locks the boxes after three wrong codes` | same as AC-4 (login) | 0 | Tests 4 passed (4) | **pass** |
| AC-14 (hook) | `usePhoneVerifyFlow.test.tsx::keeps the analytics attempt count separate from the cap` | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |
| AC-14 (widget) | `FullEnhancedLoginWidget.test.tsx::keeps the analytics attempt count separate from the cap` | same as AC-4 (login) | 0 | Tests 4 passed (4) | **pass** |
| AC-15 | no test file — declared `none`, proved by the profile's `lint` check | `pnpm lint` | 0 | 0 errors, 65 pre-existing warnings | **pass** |
| AC-16 | `usePhoneVerifyFlow.test.tsx::spends a try on a check that never reached a verdict` | same as AC-1 | 0 | Tests 38 passed (38) | **pass** |

Every `AC-n` in `spec.md` has a row. Nothing was sampled.

**AC-15 deserves a word**, because it is the one row proved by a check rather than
a test. `local/translate-key-exists` is configured as an **error**, and it resolves
every literal translate key against `ar`, `tr` and `ku`. `pnpm lint` exiting 0 is
therefore positive evidence that both new keys exist in all three files, not merely
an absence of complaint. `pnpm lint:i18n-parity` was run as well and agrees.

## Commands run

- `pnpm lint` — exit **0**
  ```
  ✖ 65 problems (0 errors, 65 warnings)
  ```
- `node_modules/.bin/tsc --noEmit --pretty false` — exit **0**
  ```
  (no output)
  ```
- `pnpm test:run` — exit **0**
  ```
  RUN  v4.1.10 C:/Users/DELL/Desktop/workspace/TrydosApp/trydos
  Test Files  110 passed (110)
       Tests  1951 passed (1951)
  ```
- `pnpm lint:i18n-parity` — exit **0** (outside the profile, run as a cross-check)
  ```
  ✓ i18n parity OK — 2165 keys present in all three files.
  ```

**A correction about how these were obtained.** A first attempt at the per-file
runs reported `exit=1` for all five files, and `node_modules/.bin/tsc` returned
`127`. Neither was a real failure: the shell had drifted into
`_specs/otp-entry-three-attempt-lock` from an earlier `cd`, so the relative paths
resolved against the wrong root and vitest found no test files. Every command above
was re-run from the repository root, and those are the numbers recorded. This is
written down rather than quietly replaced, because "the exit code is the evidence"
only holds if the command ran where the record says it did.

**Not run:** `pnpm test:e2e:scripted`. The browser suite needs a production build,
a live staging backend and configured test phones, and it does not gate pull
requests. The case added to `tests/e2e/auth.scripted.spec.ts`
(`the code boxes stop taking a fourth code`) is therefore **written but unrun**, and
is not counted as evidence for any `AC-n` above. No `AC-n` depends on it.

**Working tree untouched by verification** (VP-2 / VF-7): `git status` reports the
same 17 entries before and after this stage. No implementation file was edited and
no commit was created.

## Integration surface — did it hold?

The plan said one edit to the shared verify flow reaches four product flows, that
the code screen has two callers, and that the pin primitive has three call sites.
Checked against the change as built:

- **Held.** `usePhoneVerifyFlow` gained one returned value; both its hosts
  (`VerifyPhoneFlow`, `InlineVerifyPanel`) consume it, and all four product flows
  behind them are covered by the passing cases for AC-10 and AC-13.
- **Held.** `EnterPinScreen`'s new prop landed at both call sites; `tsc` exit 0.
- **Held.** `RdbPinInputs` took a comment only, so its third call site
  (`NewLoginDesign/NewEnterPinScreen.tsx`) is untouched, as predicted.
- **One claim did not hold** — recorded, not fixed. The plan's ordering note says
  the new prop and its call sites "must land together, or `tsc --noEmit` fails in
  CI". They cannot: the prop is optional with a `false` default, so a missed call
  site still compiles. Both call sites were wired and checked by hand. The false
  sentence stays in `plan.md` — a verify stage does not rewrite what it verifies.

## Findings — confirmed bugs, out of scope

No `BUG-n` was carried forward from `implement.md` (that section records `none`),
and this run confirmed none. No test failed anywhere, so nothing needed a strict
expected-failure marker.

Three items are recorded for the owner to open as separate tickets. None is
confirmed by a test here, so none is a `BUG-n`; all three lie **outside**
`plan.md > Files to change`, which is why `passed` is permitted with them open.

| # | Scenario | Where it lives | Ticket |
|---|----------|----------------|--------|
| 1 | The sign-in call does work **after** the code is judged, so a fault in that work reads as a wrong code. With the cap in place three correct entries can kill the boxes for a shopper the backend has already signed in. | `services/auth.ts` (the `response.data.user` read), reachable when `app/api/auth/login/route.ts` answers 200 with no user | _(to open)_ |
| 2 | A number with no account can never get through the cart panel: the shared flow has no branch for that reply, so each new code buys three more futile tries. Already true before this change. | `components/Login/Enhanced/usePhoneVerifyFlow.ts` | _(to open)_ |
| 3 | The boxes stay open for two minutes on a code the backend gives about one minute, so a slow shopper can spend all three tries without ever guessing wrong. Accepted at spec as `EC-2`. | `components/Login/Enhanced/screens/EnterPinScreen.tsx` (`timerSeconds` default) | _(to open)_ |

Item 3 is the one worth watching: the cap makes an existing mismatch cost
something it did not cost before. It was accepted with the numbers in front of the
owner, and the mitigation is that the wait for a new code ends at about the moment
the code dies.

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **No.** This
  repository declares `observability: false` and owns no such files.
- Were any **protected runtime paths** touched? **No.** `proxy.ts`,
  `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts` and
  `.github/workflows/**` are all absent from the change set.
- Analytics: no event added or removed. AC-14 pins that the existing `attempts`
  field still counts every check, not the wrong codes the cap counts.

## Sign-off

- Outcome: **verified**
- Final ticket state: **closed** — the definition sets the terminal status
  `completed` on the `passed` outcome; the stage stays at `verify`.
- Sign-off: developer (single self sign-off)
- Comprehension gate: passed, `stage: verify`, attempt 1, 3/3 (100%). Administered
  short under CG-8 after four falsifier rounds — see `comprehension.md > degraded`.
  The integration question was asked.
- Commit: none created at verify (VF-10). The change sits uncommitted on
  `ticket/otp-entry-three-attempt-lock`; publishing is `/wf:publish-pr`'s job.
- Notes: `_tmp-msg.txt` is untracked in the working tree and is **not** part of
  this ticket — it is a commit-message draft for unrelated animation work. It must
  not be staged when this branch is published.
