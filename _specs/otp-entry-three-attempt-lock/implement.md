---
ticket: otp-entry-three-attempt-lock
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Implement — otp-entry-three-attempt-lock

> Record of what was actually built, following `plan.md`.

Branch: `ticket/otp-entry-three-attempt-lock`, cut from a clean `develop` (this
repository's base branch, overriding the plugin default of `main`).

## Changes made

The exact message the shopper reads, written once here so the code and the test
cannot drift apart (FU-5):

- after wrong code 1 — `Please Enter The Correct Code Sent To Your Phone — Tries left: 2`
- after wrong code 2 — `Please Enter The Correct Code Sent To Your Phone — Tries left: 1`
- after wrong code 3 — `Too many wrong codes. Ask for a new code.`

## Changes prepared (uncommitted)

**Source**

- `public/translations/translations.ar.js` — two keys added, once each:
  `Tries left`, `Too many wrong codes. Ask for a new code.`
- `public/translations/translations.tr.js` — the same two keys.
- `public/translations/translations.ku.js` — the same two keys.
- `components/Login/Enhanced/usePhoneVerifyFlow.ts` — exports
  `MAX_VERIFY_ATTEMPTS = 3`; adds `wrongCodes` state and the derived
  `attemptsLocked`, returned to hosts; adds `attemptMessage(next)`, which builds
  the line from the **incremented local**, never from the state value; resets the
  count on both successful sends, beside the two existing `attemptsRef` resets.
  `attemptsRef` itself is untouched.
- `components/Login/Enhanced/screens/EnterPinScreen.tsx` — new optional prop
  `attemptsLocked` (default `false`), fed into both `disabled` **and**
  `isExpired`. The two message branches are unchanged, so the expired line still
  wins when the code is both spent and locked.
- `components/Login/Enhanced/VerifyPhoneFlow.tsx` — takes `attemptsLocked` off
  the hook and passes it down.
- `components/Login/Enhanced/InlineVerifyPanel.tsx` — same flag into `disabled`
  and `isExpired` on its own pin inputs, with a note that `isExpired` is there
  for the dead-box styling, since `disableCustomKeypad` means this panel has no
  keypad to strand.
- `components/Login/Enhanced/FullEnhancedLoginWidget.tsx` — imports
  `MAX_VERIFY_ATTEMPTS`; adds its own `wrongCodes` state, incremented **after**
  the `user not found` early return; builds the same two messages into its own
  `setError` (FU-2); resets on both successful sends; passes `attemptsLocked` to
  `EnterPinScreen`. `attemptsRef.current += 1` and `const attempts` are exactly
  where they were.
- `components/Login/Enhanced/ui/RdbPinInputs.tsx` — **JSDoc only** on `isExpired`,
  recording that it is what closes the keypad and that `disabled` alone does not.
  No logic change.

**Tests**

- `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` — one existing
  assertion updated for the new wording (step 9); eight cases added.
- `tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` — three cases
  added, plus a `keypad()` helper.
- `tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx` — two cases added.
- `tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx` — one case added.
- `tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx` — **new**,
  four cases.
- `tests/e2e/auth.scripted.spec.ts` — the third assertion's message rewritten to
  describe what that step now proves, and one case added.

**Not mine, left alone:** `_tmp-msg.txt` is untracked in the working tree. It is a
commit-message draft about animation work, unrelated to this ticket and not in
`plan.md > Files to change`. It must not be swept into this ticket's commit.

## Deviations from plan

Three, all inside declared files, none changing what the code does.

1. **`framer-motion` was mocked in the new widget test**, which the plan's mock
   list named. Worth recording *how*: the stand-in caches one component per tag.
   The obvious proxy builds a new function on every property read, which hands
   React a different component type each render — the whole screen then remounts
   between keystrokes and the number field keeps only the first digit. That cost
   two debugging rounds and is now written into the file as a comment.
2. **The new widget test seeds `country: "sy"`.** The number field only offers
   its send arrow for a number valid in the route's country, and the test harness
   defaults to `gb`, which rejects the Syrian test number. Not in the plan because
   nobody had mounted this widget in a test before.
3. **The plan's Integration surface claim about `tsc` is still wrong** (FU-6). The
   prop was left optional with a `false` default, so the type checker cannot catch
   a missed call site. Both call sites are wired and were verified by hand. The
   false sentence stays in `plan.md` because a gate may not rewrite what it
   reviewed; `/verify` should record it, and review as the only guard.

## Tests written

| AC | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `usePhoneVerifyFlow.test.tsx` | `says two tries are left after the first wrong code` | extend |
| AC-2 | `usePhoneVerifyFlow.test.tsx` | `counts the second wrong code down to one try left` | extend |
| AC-3 (boxes dead) | `screens/EnterPinScreen.test.tsx` | `takes nothing more once the tries have run out` | extend |
| AC-3 (digits cleared) | `usePhoneVerifyFlow.test.tsx` | `clears the wrong code so the shopper can type the next one` (`:591`) | **existing** — confirmed still covering it; nothing written |
| AC-4 | `usePhoneVerifyFlow.test.tsx` | `drops the count and says to ask for a new code on the third` | extend |
| AC-4 (login surface, FU-2) | `FullEnhancedLoginWidget.test.tsx` | `says how many tries are left, then says the tries ran out` | new |
| AC-5 | `screens/EnterPinScreen.test.tsx` | `closes the keypad when the tries run out` | extend |
| AC-6 | `usePhoneVerifyFlow.test.tsx` | `gives three fresh tries once a new code arrives` | extend |
| AC-7 | `usePhoneVerifyFlow.test.tsx` | `stays locked when the request for a new code fails` | extend |
| AC-8 | `FullEnhancedLoginWidget.test.tsx` | `does not spend a try when the number has no account` | new |
| AC-9 | `usePhoneVerifyFlow.test.tsx` | `spends one try when the boxes report a finished code twice at once` | extend |
| AC-10 | `VerifyPhoneFlow.test.tsx` | `still counts down to a new code while the boxes are locked` | extend |
| AC-11 | `screens/EnterPinScreen.test.tsx` | `says the code ran out of life when it is both spent and locked` | extend |
| AC-13 (re-verify) | `VerifyPhoneFlow.test.tsx` | `locks the boxes after three wrong codes` | extend |
| AC-13 (cart) | `InlineVerifyPanel.test.tsx` | `locks the boxes after three wrong codes` | extend |
| AC-13 (login) | `FullEnhancedLoginWidget.test.tsx` | `locks the boxes after three wrong codes` | new |
| AC-14 (hook) | `usePhoneVerifyFlow.test.tsx` | `keeps the analytics attempt count separate from the cap` | extend |
| AC-14 (widget) | `FullEnhancedLoginWidget.test.tsx` | `keeps the analytics attempt count separate from the cap` | new |
| AC-15 | — | proved by the `lint` check in the `logic-change` profile; `local/translate-key-exists` errors on a key missing from ar, tr or ku | none — as declared |
| AC-16 | `usePhoneVerifyFlow.test.tsx` | `spends a try on a check that never reached a verdict` | extend |
| — (e2e) | `tests/e2e/auth.scripted.spec.ts` | `the code boxes stop taking a fourth code` | extend |

Every declared row was carried out. No `extend` became a second parallel file, and
no test was written that the plan did not name.

**FU-1 was applied to all four per-surface cases.** Each clears the field between
codes and asserts the check ran **exactly three times**. This is not tidiness: the
hidden field reports a finished code on every keystroke once six digits are
already in it, so typing over the last code spends several tries at once — the
boxes would lock after two codes and a case that only looked at the end state
would still have gone green.

**AC-5 was seen red before it was seen green.** With
`isExpired={codeExpired || attemptsLocked}` reverted to `isExpired={codeExpired}`,
`closes the keypad when the tries run out` failed with
*"the keypad must come down with the boxes — left standing it covers dead boxes
and cannot be tapped away: expected `<button …>` to be null"*. The wiring was
restored and the file went back to 18 passing. That was the panel's highest-risk
finding, so it is the one proved by hand rather than argued.

## Findings — confirmed bugs, out of scope

none.

No test written here proved existing behaviour wrong. Two pre-existing defects
were identified at review and are already recorded in `spec.md > Out of Scope` as
their own tickets — neither was confirmed by a test in this change, so neither is
a `BUG-n` here:

- the sign-in call does work **after** the code is judged, so a fault in that work
  reads as a wrong code (`services/auth.ts` around the `response.data.user` read,
  reachable when `app/api/auth/login/route.ts` answers 200 with no user);
- a number with no account can never get through the cart panel, because the
  shared flow has no `user not found` branch. Already true before this change.

## Validation run during implementation

Profile `logic-change` — `lint`, `typecheck`, `unit-tests`:

- `pnpm lint` — **pass**. 0 errors, 65 warnings, all pre-existing. This is AC-15's
  proof: `local/translate-key-exists` is an error and did not fire, so both new
  keys resolve in ar, tr and ku.
- `node_modules/.bin/tsc --noEmit --pretty false` — **pass**, exit 0.
- `pnpm test:run` — **pass**. 110 files, 1951 tests, 0 failures.

Beyond the profile:

- `pnpm lint:i18n-parity` — **pass**. "2165 keys present in all three files."

Not run: `pnpm test:e2e:scripted`. The browser suite needs a build plus staging
and configured test phones; it does not gate pull requests. The case added to
`tests/e2e/auth.scripted.spec.ts` is therefore **written but unrun**, and
`/verify` must not read it as evidence.

No commit and no push (IM-9). The working tree carries the change.
