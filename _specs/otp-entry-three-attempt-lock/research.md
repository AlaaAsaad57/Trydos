---
ticket: otp-entry-three-attempt-lock
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-08-30
links:
  clickup:
  github:
---

# Research — otp-entry-three-attempt-lock

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Count the failed OTP verifies per sent code, show how many tries are left after
the first failure, and make the code boxes dead after the third — on the three
wired entry surfaces, with no storage, no timer and no backend change.

## What the intake assumed, and what the code actually says

Four intake statements do not survive contact with the files. They are corrected
here so `spec` writes the right `AC-n` and `plan` the right steps.

### C-1 — "Disable it the same way the expired case does" exists on only one surface

`EnterPinScreen.tsx:283-285` builds the dead state from `codeExpired`:

```
disabled={loading === 'verify-pin' || isValidPin === 'valid' || codeExpired}
isExpired={codeExpired}
```

`InlineVerifyPanel.tsx:264-269` does **not** use `EnterPinScreen`. It renders its
own `RdbPinInputs` with `disabled={busy || isValidPin === 'valid'}`. That panel
has no `codeSpent`, no `codeExpired`, no `isExpired`, and no "the code expired"
message anywhere in the file. So on the cart surface there is no existing pattern
to copy — the locked state is the first dead state that panel will ever have.

Surface map, confirmed by import:

| Surface | Pin UI it renders | Has an expired state today |
|---|---|---|
| `FullEnhancedLoginWidget.tsx:618` | `EnterPinScreen` | yes |
| `VerifyPhoneFlow.tsx:134` | `EnterPinScreen` | yes |
| `InlineVerifyPanel.tsx:264` | `RdbPinInputs` direct | **no** |

### C-2 — The attempt counter is a `ref`, so it cannot draw "tries left"

Both counters are refs on purpose:

- `usePhoneVerifyFlow.ts:127` — `const attemptsRef = useRef(0)`, with the comment
  saying it is a ref because it is read inside an async callback and must hold
  the count as of the request, not of render.
- `FullEnhancedLoginWidget.tsx:110` — the same, read at `:300` into the GA payload.

A ref change causes no re-render. "Tries left: 2" and the dead boxes both have to
be drawn, so the new count must be **state**. The existing refs stay exactly as
they are, because the GA payload depends on their read-at-request behaviour.

### C-3 — "Resend is the way out" is invisible for about the first 50 seconds

`EnterPinScreen.tsx:218` renders the resend link only inside `canAskAgain`
(`:140` — `canResend && !loading`), and `canResend` comes from the per-number send
cooldown in `utils/otpLocks`. That cooldown is armed on every successful send
(`services/auth.ts:109`) and its length is `OTP_COOLDOWN_SECONDS`, default **60**
(`serverActions/sendOtp.ts:129`). Three wrong codes take roughly ten seconds. So
for roughly fifty seconds the boxes are dead and the resend link is not on screen
at all. On the cart panel the button is on screen but `disabled={busy || blocked}`
(`InlineVerifyPanel.tsx:276`).

This is not fatal, and D-5 below accepts it, with the numbers.

### C-4 — An existing browser test already types exactly three wrong codes

`tests/e2e/auth.scripted.spec.ts:103-142` — "verify errors are surfaced on the PIN
screen" — submits three wrong codes in a row against a mocked login endpoint and
polls `visibleVerifyError` after each. The third submit is now the one that locks
the boxes.

Two mechanics decide whether that test stays green:

- `submitOtp` (`tests/e2e/actions/auth.ts:432-441`) waits for the boxes to be
  **enabled** before filling. All three fills happen before the lock lands, so no
  fill is blocked.
- `visibleVerifyError` (`:496-504`) reads `data-pw="verify-otp-error"`, which
  `EnterPinScreen.tsx:292-294` renders only when `!codeExpired && error`.

So the test stays green **only if** the locked message is delivered through the
existing `error` string and the existing element. D-3 decides exactly that.

## Decisions

Each decision is written so `spec` can copy it into an `AC-n` and `plan` into a
step. Every one names the file and line it rests on. The matching `OQ-n` is the
traceability handle; the answer is already written here.

### D-1 (OQ-1) — Where the count lives, and what type it is

Add `const [wrongCodes, setWrongCodes] = useState(0)` in **both** copies:
`usePhoneVerifyFlow.ts` and `FullEnhancedLoginWidget.tsx`. Increment it in the
failure branch only. Leave `attemptsRef` untouched in both files — it keeps
feeding GA and it counts every verify, not only the failed ones. The two numbers
differ on purpose and must keep different names.

Derived, not stored: `locked = wrongCodes >= MAX_VERIFY_ATTEMPTS` and
`triesLeft = MAX_VERIFY_ATTEMPTS - wrongCodes`.

No refactor of `FullEnhancedLoginWidget` onto the hook — the intake forbids it,
and the duplication is four lines.

### D-2 (OQ-2) — Where the number 3 lives

`export const MAX_VERIFY_ATTEMPTS = 3;` in
`components/Login/Enhanced/usePhoneVerifyFlow.ts`, imported by
`FullEnhancedLoginWidget.tsx`. No new file, no env var, no store slice. That file
already owns the shared verify logic for two of the three surfaces, so it is the
nearest honest home.

### D-3 (OQ-3) — What the shopper reads, and in which element

One element, the existing one. Both messages are set into the existing `error`
state, so they land in `EnterPinScreen.tsx:292-296`
(`data-pw="verify-otp-error"`, `role="alert"`) and in
`InlineVerifyPanel.tsx:334-338`. Nothing new is added to the message area.

- Failure 1 and 2 — the existing line, plus the count:
  `` `${translate('Please Enter The Correct Code Sent To Your Phone')} ${translate('Tries left')}: ${triesLeft}` ``
- Failure 3 — the count is dropped and the text is replaced by
  `translate('Too many wrong codes. Ask for a new code.')`

Two reasons for this shape and not another: it keeps
`tests/e2e/auth.scripted.spec.ts` green (C-4), and it interpolates a number into a
translated static sentence, which is the rule in CLAUDE.md. Writing
"Tries left: 1" also avoids a second key for the singular.

### D-4 (OQ-4) — How the boxes are made dead, and why the keypad matters

`EnterPinScreen` gets one new optional prop, `attemptsLocked?: boolean` (default
`false`), and passes it into the two existing props:

```
disabled={loading === 'verify-pin' || isValidPin === 'valid' || codeExpired || attemptsLocked}
isExpired={codeExpired || attemptsLocked}
```

`InlineVerifyPanel` does the same on its own `RdbPinInputs`:
`disabled={busy || isValidPin === 'valid' || locked}` and `isExpired={locked}`.

**`isExpired` is not decoration, and passing only `disabled` is a bug.**
`RdbPinInputs.tsx:219` closes the on-screen keypad with
`open={keypadOpen && isValidPin !== 'valid' && !isExpired}` — `disabled` is not in
that gate. And the outside-click closer returns early while disabled (`:90`, via
`disabledRef`). So a lock that sets only `disabled` leaves the mobile keypad open,
over dead boxes, and tapping outside will not close it.

**`RdbPinInputs` itself is not changed.** Two alternatives were weighed and
rejected:

- Add `!disabled` to the `:219` gate. That closes the keypad during every
  in-flight verify too, because `disabled` is true while `loading === 'verify-pin'`.
  The keypad would blink shut and reopen on each try — a behaviour change for all
  callers, to fix one.
- Rename `isExpired` to something neutral, such as `isSpent`. Mechanical, but it
  touches a shared primitive, three call sites and
  `tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx` for no behaviour gain.

Instead the prop's JSDoc at `RdbPinInputs.tsx:16` is updated to say it means "the
boxes are spent — the code expired, or the tries ran out". Doc only, no logic.

### D-5 (OQ-5) — Locked while the resend is still on cooldown: accepted

No new unlock control, and no change to when the resend appears. The reason is
arithmetic, not shrugging:

- the send cooldown is 60 seconds (`serverActions/sendOtp.ts:129`);
- the owner states the backend gives a code about 60 seconds of life (intake,
  decision 2).

So the resend opens at almost exactly the moment the code in the shopper's hand
stops working. Until then the screen is not silent: `EnterPinScreen.tsx:196-208`
shows a live "Resend After - mm:ss" countdown, and `InlineVerifyPanel.tsx:304-311`
shows the same as `data-pw="otp-resend-countdown"`. Together with the D-3 lock
message the shopper is told what happened and when the way out opens.

### D-6 (OQ-6) — When the count resets

Only on a send that succeeded, at the four places that already reset
`attemptsRef`: `usePhoneVerifyFlow.ts:180` and `:213`,
`FullEnhancedLoginWidget.tsx:273` and `:417`. `setWrongCodes(0)` goes on the same
lines. A resend that fails leaves the lock standing, which is right — no new code
arrived.

### D-7 (OQ-7) — "user not found" does not spend a try

`FullEnhancedLoginWidget.tsx:379-384` catches the backend saying the number is not
registered, clears the pin and leaves for the `not-registered` screen. The
increment must sit **after** that early return, next to
`setIsValidPin('notvalid')` at `:386`.

This is a narrow, named exception to intake decision 3 ("every failed verify
counts"). The reason: the shopper is not guessing a code, and they are moved off
the pin screen entirely, so counting it would arm a lock on a screen nobody is
looking at.

**How much this changes today: nothing a shopper can see.** No path returns to
the same code boxes with the same code. From the `not-registered` screen,
*Create account* goes to `input-name` (`:665-668`), *Cancel* closes the widget,
and back goes to `enter-phone` (`:179-180`) — where the next successful send
resets the count anyway (D-6). So the decision is about where one line sits, and
about staying correct if a path back to the code screen is ever added. The owner
chose the safer placement.

**A disagreement between surfaces, noted and left alone.**
`InlineVerifyPanel.tsx:68` calls the same `AuthService.VerifyOtp`, but
`usePhoneVerifyFlow` has no `user not found` branch. On the cart panel a number
with no account already reads "Please Enter The Correct Code Sent To Your Phone",
and under this ticket it would also spend a try. That gap exists before this
change. Adding the branch was offered and **declined** as a second behaviour
change riding in this ticket. It stays out of scope.

### D-8 (OQ-8) — The 1500 ms clear stays as it is

After a failure both copies clear `isValidPin` and `pin` 1500 ms later
(`usePhoneVerifyFlow.ts:255-258`, `FullEnhancedLoginWidget.tsx:389-392`). Keep it.
On the third failure that leaves empty, dead, dashed boxes — the same picture the
expired state gives. No change, no new timer.

### D-9 (OQ-9) — `timerSeconds` stays 120; it is not this ticket

The intake left this open. Decision: leave it. `EnterPinScreen.tsx:46` keeps its
`timerSeconds = 120` default and no caller starts passing it.

The interaction is real and is worth writing down: between second 60 and second
120 the boxes are open on a code the backend has already killed, so a slow shopper
can spend all three tries without ever guessing. The mitigation is already in the
build — at second 60 the resend opens, and the lock message tells them to use it
(D-5). Changing the code lifetime changes the expired behaviour, needs the real
backend number, and is independent of the cap. It belongs in its own ticket.

### D-10 (OQ-10) — No new analytics event

`attempts` already rides on `VERIFY_OTP` (`FullEnhancedLoginWidget.tsx:311-320`
success, `:348-356` failure) and on `RESEND_OTP` (`:409`,
`usePhoneVerifyFlow.ts:198`). Nothing is added and nothing is removed. Note for
`plan`: `attempts` counts every verify and `wrongCodes` counts only failures, so
the GA number will not equal the lock number and must not be re-pointed at it.

### D-11 (OQ-11) — `NewLoginDesign/` stays untouched

Confirmed unwired: the only import outside itself is the `/loginDemo` page.
Nothing in this ticket goes near it.

## Relevant directories

- `components/Login/Enhanced/` — all three surfaces, the shared hook, the pin
  primitive. Every source change lives here.
- `components/Login/Enhanced/screens/` — `EnterPinScreen.tsx` only.
- `components/Login/Enhanced/ui/` — `RdbPinInputs.tsx`; doc-only change (D-4).
- `public/translations/` — the three language files; two new keys (D-3).
- `tests/components/Login/Enhanced/` — four existing test files, mirroring the
  source tree.
- `tests/e2e/` — the scripted spec that already types three wrong codes (C-4).

## Relevant config files

- `vitest.config.mts` — one project, `unit`, jsdom, `tests/setup.ts`, with
  `tests/e2e/**` excluded. `pnpm test:run` runs this and CI gates on it.
- `eslint.config.mjs:36` — `local/translate-key-exists` is set to **error**. Using
  a translate key that is not in all three files fails `pnpm lint`.
- `.github/workflows/tests.yml:103-110` — CI runs `next typegen` before
  `tsc --noEmit`. A new prop on `EnterPinScreen` must type-check there.
- `serverActions/sendOtp.ts:129` — `OTP_COOLDOWN_SECONDS`, default 60. Read only
  here; it sets the 50-second window in C-3.

## Possibly affected services

Nothing on the wire changes. `AuthService.VerifyOtp`, `VerifyOtpForUpdatePhone`
and `SendOtp` keep their call sites and their arguments. What changes is who is
allowed to call verify, and that is decided in the browser only.

The flows that reach the changed code, through the two hosts of the hook:

- `NavbarClient` → `ConfirmMobilePhoneWidget` (re-auth) and `SessionExpiredWidget`
- settings → `PersonalInfoForm` / `VerifyUser`, which pass a **different** verify
  function (`VerifyOtpForUpdatePhone`) into the same hook
- cart → `OrderButton` → `InlineVerifyPanel`
- navbar / add-story / like → `AuthSections` → `FullEnhancedLoginWidget`

One edit to `usePhoneVerifyFlow.ts` lands on four of those at once. That is the
integration surface `plan` must write out.

## Test / validation commands available

- `pnpm test:run` — the unit suite (vitest, project `unit`). Gates every PR.
- `pnpm lint` — eslint, including `local/translate-key-exists` as an error.
- `pnpm lint:i18n-parity` — checks the three translation files hold the same keys.
- `pnpm exec next typegen && pnpm exec tsc --noEmit` — the CI type check.
- `pnpm test:e2e:scripted` — the browser suite against mocked endpoints; holds the
  spec in C-4. Does not gate PRs.
- `pnpm e2e:health` — is staging answering. Run before blaming a live failure.

None were run in this stage.

## Test layout and naming convention (for `plan`, PL-14)

- Layout: `tests/` mirrors the source path. `components/Login/Enhanced/X.tsx` →
  `tests/components/Login/Enhanced/X.test.tsx`.
- Naming: `<SourceName>.test.tsx`. Browser specs are `*.spec.ts` under
  `tests/e2e/` and are excluded from vitest by `vitest.config.mts`.
- Runner: vitest, jsdom, `renderWithProviders` from `tests/render.tsx`.
- Expected-failure marker: vitest's `test.fails`, which is strict — it fails the
  run if the test passes. **No file in the suite uses it today**, so a `BUG-n`
  raised at implement would be its first use.

What already exists for the units this ticket touches:

| Unit | Test file | Lines | Disposition |
|---|---|---|---|
| `usePhoneVerifyFlow.ts` | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | 651 | extend — `describe("verifying the code")` at `:490` |
| `InlineVerifyPanel.tsx` | `tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx` | 499 | extend |
| `VerifyPhoneFlow.tsx` | `tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx` | 577 | extend |
| `EnterPinScreen.tsx` | `tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` | 299 | extend — `describe("what the screen says about the code")` at `:196` |
| `RdbPinInputs.tsx` | `tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx` | 238 | existing — doc-only change, nothing to add |
| `FullEnhancedLoginWidget.tsx` | **none** | — | **new** — see D-12 |

A second, parallel file for any unit above would be a defect. `extend` means the
new cases go into the file named.

### D-12 (OQ-12) — `FullEnhancedLoginWidget` gets its first test file

That surface keeps its own copy of the counter (D-1). Leaving it unproven is the
silent pass CLAUDE.md forbids, so a new file is declared:
`tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx`, holding the
lock cases **only** — not a suite for the whole 711-line widget.

Feasibility was checked read-only, not run:

- `next/navigation` is already mocked for every test (`tests/setup.ts:33`), and
  `window.matchMedia` is supplied (`:70`).
- The mock set from `VerifyPhoneFlow.test.tsx:13-28` (`services/auth`,
  `utils/gtag`, `LogError`) carries over.
- Two things no existing test has exercised, and they are the risk: the widget
  imports `public/styles/rdb-auth.css` at `:9`, and renders `scaling/Page` at
  `:503`, which mounts `AppScaler`. `AppScaler` uses only
  `document.documentElement`, `getElementById` and a `resize` listener — all
  present in jsdom — but it writes hardcoded ids and `:root` variables, and only
  one instance may ever be mounted.
- `serverRequests` (`fetchStoriesForUser`, imported at `:15`) needs a stand-in.

If the widget genuinely will not mount, the fallback is **not** to drop the
criterion. It is to prove that surface by extending
`tests/e2e/auth.scripted.spec.ts`, which already drives this exact widget against
mocked endpoints. `plan` must record which of the two it declares, and if it takes
the fallback it must say plainly that the browser suite does not gate PRs.

## New translation keys (D-3)

Neither string exists in any of the three files. Confirmed by exact-string grep on
`public/translations/translations.{ar,tr,ku}.js`.

| English key (the source) | Where it is used |
|---|---|
| `Tries left` | appended after the existing wrong-code line, as `Tries left: N` |
| `Too many wrong codes. Ask for a new code.` | replaces the wrong-code line on the third failure |

Both must be added to all three files **before** any code uses them, or
`pnpm lint` fails on `local/translate-key-exists`. All three files go in
`plan.md > Files to change`.

## Risks and unknowns

- **The keypad stays open if the lock only sets `disabled`.** High impact on
  mobile, and easy to write by accident. `RdbPinInputs.tsx:219` is the reason;
  D-4 is the guard. It needs its own test case.
- **The browser spec at `tests/e2e/auth.scripted.spec.ts:103-142` turns red** if
  the lock message moves out of the `data-pw="verify-otp-error"` element. Medium
  likelihood, fully avoided by D-3. That file stays in scope either way, so the
  third assertion's wording can be checked against the new text.
- **`FullEnhancedLoginWidget` may not mount in jsdom** (CSS import, `AppScaler`
  singleton). Medium likelihood, and it decides only *where* the proof lives, not
  whether there is one. D-12 names the fallback.
- **The duplicated counter drifts.** Two copies of the same four lines. Low impact
  now, and both are covered by tests; the shared constant (D-2) keeps at least the
  number in one place.
- **A locked shopper with a failing resend is stuck** until the cooldown ends.
  Accepted: no new code arrived, so the lock is correct. D-6.
- **`translate-key-exists` is an error, not a warning.** Adding the keys after the
  code is written breaks the build, not only the lint report. Ordering matters.
- **Two clocks get mixed up here, and have twice before.**
  `EnterPinScreen.tsx:53-70` is a written warning about it. This ticket must not
  wire the lock to either clock — it counts failures and nothing else.

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Where does the failure count live, and is it state or a ref? | A ref cannot redraw "tries left" or the dead boxes. Answered: **D-1** — new `useState` in both copies, existing `attemptsRef` untouched. |
| OQ-2 | Where does the number 3 live? | Two surfaces must agree without a new module. Answered: **D-2** — exported `MAX_VERIFY_ATTEMPTS` in `usePhoneVerifyFlow.ts`. |
| OQ-3 | What is shown after failure 1, 2 and 3, and in which element? | The browser spec reads one specific element. Answered: **D-3** — the existing `error` string and `data-pw="verify-otp-error"`. |
| OQ-4 | Which props make the boxes dead, and does the keypad close? | `disabled` alone leaves the keypad stuck open. Answered: **D-4** — `disabled` **and** `isExpired`, with no logic change to `RdbPinInputs`. |
| OQ-5 | The lock lands about 50s before the resend appears — is that accepted? | It decides whether a new control is needed. Answered: **D-5** — accepted; the countdown plus the lock message already explain it. |
| OQ-6 | What resets the count? | Decides whether a failed resend clears the lock. Answered: **D-6** — a successful send only, at the four lines that already reset `attemptsRef`. |
| OQ-7 | Does "user not found" spend a try? | It is a named exception to intake decision 3, so the owner must confirm it. Answered: **D-7** — it does not. |
| OQ-8 | Does the 1500 ms clear stay? | Decides what the locked boxes look like. Answered: **D-8** — unchanged; empty dead boxes. |
| OQ-9 | Is `timerSeconds` (120) aligned with the backend's ~60? | Between 60s and 120s a shopper can spend all three tries on a dead code. Answered: **D-9** — out of scope, own ticket, mitigation named. |
| OQ-10 | Any new analytics event? | A rewrite silently drops events. Answered: **D-10** — none added, none removed; `attempts` is not `wrongCodes`. |
| OQ-11 | Does `NewLoginDesign/` get anything? | The intake's exclusion, re-confirmed by import. Answered: **D-11** — no. |
| OQ-12 | Does `FullEnhancedLoginWidget` get its first test file? | Its counter is a separate copy; unproven means a silent pass. Answered: **D-12** — yes, lock cases only, with a named fallback. |

Every `OQ-n` above carries a decided answer, and `spec.md` must still record each
one in its own words (SP-9) — an answer given only here or in chat does not
count.

The two that needed the owner rather than the code now have him:

- **OQ-7** — the owner chose "does not count": the increment moves after the
  `user not found` early return. Fixing the matching gap on the cart panel was
  offered and declined as out of scope.
- **OQ-9** — the owner chose "leave 120": the clock is not touched here, and the
  mismatch between the 120-second boxes and the ~60-second code goes to its own
  ticket. `spec` must carry the accepted consequence in writing — a slow shopper
  can spend all three tries on a code the backend has already killed.

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No commands were run.
