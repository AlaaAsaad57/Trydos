---
ticket: otp-entry-three-attempt-lock
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Plan — otp-entry-three-attempt-lock

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Count failed verifies in **drawn state**, once per flow, and feed that count into
the dead-box state each pin surface already has. The count is a new `useState` in
the two places that already keep an attempt counter; the existing `attemptsRef`
in both is left alone, because it is a ref on purpose (it is read inside the async
callback for the analytics payload) and because it counts every verify, not only
the failed ones.

Two alternatives were rejected. **Reusing `attemptsRef`** cannot work: a ref
change draws nothing, so "Tries left: 2" would never appear. **Extracting a
shared counting hook** would remove the four-line duplication between the two
copies, but the intake rules out reworking `FullEnhancedLoginWidget`, and the
wiring in that widget would still need its own proof — so the abstraction buys no
test and adds one.

The dead state is expressed through the two props `RdbPinInputs` already has:
`disabled` **and** `isExpired`. The reason differs by surface, and the two must
not be muddled:

- **On `EnterPinScreen`, passing only `disabled` is a bug.**
  `RdbPinInputs.tsx:219` closes the on-screen keypad from `isExpired` alone, and
  the outside-click closer returns early while disabled (`:90`), so a
  `disabled`-only lock strands an open keypad over dead boxes with no way to shut
  it.
- **On `InlineVerifyPanel` that argument does not apply.** That panel passes
  `disableCustomKeypad` (`:271`), so no keypad is ever rendered there and none can
  be stranded. `isExpired` is passed for the other half of its effect: the dashed
  dead-box styling (`RdbPinInputs.tsx:160-161`), so a locked shopper reads the
  same picture on all three surfaces.

`RdbPinInputs` itself gets no logic change (see OQ-4 below for the two rejected
alternatives).

**The cap counts every failed check**, including one that never reached a
verdict — offline, a server fault, a "too many requests" reply. Review raised the
cost of that and the owner reaffirmed it; it is recorded as `spec.md > EC-9` and
pinned by AC-16, so it is a decision rather than an oversight. Two consequences
follow for the code: the counting sits in the plain `catch`, with no inspection of
the error, and AC-8's exception is written **only** in the login / signup widget,
which is the only surface whose failure branch already tells `user not found`
apart.

**Two additions were considered and cut**, to keep this the size the request
actually is. Neither is a shopper-facing behaviour anyone asked for.

- *An early return so a locked flow issues no verify request.* The dead boxes
  already stop it: the input is disabled and the keypad closed, so nothing can
  fire a check. The guard only covered a future caller that forgets the prop, no
  declared test proved it, and it would have changed when a request is sent for
  all four flows sharing the hook.
- *Putting the lock message back after a failed request for a new code.* The two
  screens ask for a new code through different functions, so it would have needed
  doing twice, plus a rule for which message wins when the send itself failed.
  `spec.md > EC-4` records the resulting quiet screen as accepted.

## Steps

Order matters at step 1: `local/translate-key-exists` is an ESLint **error**, so
using a key before it exists in all three files breaks `pnpm lint`.

1. **Add the two translation keys to all three language files**, before any code
   uses them. Exact strings are in *Files to change*. Then **look at the rendered
   line in `ar` and `ku`**: the message puts an LTR digit and a colon at the end
   of an RTL sentence, so `Tries left: 2` can render with the number thrown to the
   wrong end of the line. If it flips, wrap the digit in a bidi-isolating span. No
   new key is needed for that — it is punctuation direction, not wording.
2. **`usePhoneVerifyFlow.ts`** — export `MAX_VERIFY_ATTEMPTS = 3`. Add
   `const [wrongCodes, setWrongCodes] = useState(0)`. Then, in order:
   - In the `verifyPin` catch (`:251-259`), compute the next value **into a
     local** — `const next = wrongCodes + 1` — call `setWrongCodes(next)`, and
     build the message from `next`. Reading `wrongCodes` after the setter gives
     the stale render value, which would show "Tries left: 3" on the first
     failure and make the cap four checks, not three.
   - Reset to `0` on the two lines that already reset `attemptsRef` (`:180`,
     `:213`).
   - **Leave `attemptsRef` alone.** It stays a ref, it keeps incrementing on
     every verify at `:227`, and it keeps feeding the analytics payload. Only
     `wrongCodes` is new.
   - Return **`attemptsLocked` only** and add it to `UsePhoneVerifyFlowResult`.
     Not `triesLeft`: the message is built inside the hook, so no host would read
     it, and a public value with no caller is exactly the speculative surface the
     no-over-engineering rule targets.
3. **`EnterPinScreen.tsx`** — add optional prop `attemptsLocked?: boolean`
   (default `false`). Add it to the `disabled` expression and to `isExpired`
   (`:283-285`). Do **not** touch the two message branches at `:287-297`: the
   expired line must keep winning when both are true (AC-11), and the lock text
   arrives through the existing `error` slot.
4. **`VerifyPhoneFlow.tsx`** — take `attemptsLocked` off the hook and pass it to
   `EnterPinScreen` (`:134-151`).
5. **`InlineVerifyPanel.tsx`** — take `attemptsLocked` off the hook; add it to
   `disabled` and pass it as `isExpired` on its own `RdbPinInputs` (`:264-269`),
   **for the dead-box styling, not for the keypad** — that panel passes
   `disableCustomKeypad` at `:271`, so it has no keypad to strand. Nothing else in
   that file changes; the lock text already lands in its `error` block at
   `:334-338`.
6. **`FullEnhancedLoginWidget.tsx`** — import `MAX_VERIFY_ATTEMPTS`. Add its own
   `wrongCodes` state, incremented **after** the `user not found` early return
   (`:379-384`), next to `setIsValidPin('notvalid')` at `:386`, using the same
   local-`next` pattern as step 2. Reset on `:273` and `:417`. Pass
   `attemptsLocked` to `EnterPinScreen` at `:618`.

   **Do not touch `attemptsRef.current += 1` or `const attempts = attemptsRef.current`
   at `:299-300`.** They stay exactly where they are. `wrongCodes` is a second,
   separate counter added lower down. Moving the existing pair would silently
   repoint the `attempts` field on the verify and resend analytics events — the
   breakage this plan lists as number 4, caused by the fix for it.
7. **`RdbPinInputs.tsx`** — JSDoc only on the `isExpired` prop (`:16`), so the
   next reader knows it means "the boxes are spent — the code expired, or the
   tries ran out". No logic change.
8. **Write the declared tests**, and only those (see *Tests*).
9. **Fix the one existing unit assertion the new wording breaks.**
   `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx:582` asserts
   `.toBe("Please Enter The Correct Code Sent To Your Phone")` — exact equality —
   and the failure-1 message now carries `" Tries left: 2"` after it. Update that
   expected string. The sibling assertions in `VerifyPhoneFlow.test.tsx:390`,
   `InlineVerifyPanel.test.tsx:429` and `:459` use `toHaveTextContent`, so they
   survive untouched — do not change them.
10. **Re-read the third assertion in `tests/e2e/auth.scripted.spec.ts:136-142`**
    against the new wording, and add the locked-boxes case there. **Assert the
    input is disabled directly**, with a message — do **not** route that case
    through the shared `submitOtp` helper (`tests/e2e/actions/auth.ts:432-441`),
    which waits for the input to be *enabled* and would fail as a bare Playwright
    timeout naming nothing. That helper is shared by four spec files and is not
    edited here.

## Files to change

**Source**

- `public/translations/translations.ar.js` — add `"Tries left": "المحاولات المتبقية"` and
  `"Too many wrong codes. Ask for a new code.": "محاولات خاطئة كثيرة. اطلب رمزاً جديداً."`
- `public/translations/translations.tr.js` — add `"Tries left": "Kalan deneme"` and
  `"Too many wrong codes. Ask for a new code.": "Çok fazla yanlış kod. Yeni bir kod isteyin."`
- `public/translations/translations.ku.js` — add `"Tries left": "هەوڵی ماوە"` and
  `"Too many wrong codes. Ask for a new code.": "کۆدی هەڵەی زۆر. داوای کۆدێکی نوێ بکە."`
- `components/Login/Enhanced/usePhoneVerifyFlow.ts` — the shared counter, the
  constant, the two messages, the two resets, two new returned values.
- `components/Login/Enhanced/FullEnhancedLoginWidget.tsx` — its own copy of the
  same four things, plus the `user not found` placement (C-5).
- `components/Login/Enhanced/screens/EnterPinScreen.tsx` — one new optional prop,
  wired into `disabled` and `isExpired`.
- `components/Login/Enhanced/VerifyPhoneFlow.tsx` — pass the flag through.
- `components/Login/Enhanced/InlineVerifyPanel.tsx` — `disabled` + `isExpired` on
  its own pin inputs.
- `components/Login/Enhanced/ui/RdbPinInputs.tsx` — **JSDoc only**, no logic.

**Tests** (every file in the *Tests* table appears here, as PL-13 requires)

- `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` — extend
- `tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx` — extend
- `tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx` — extend
- `tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` — extend
- `tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx` — **new**
- `tests/e2e/auth.scripted.spec.ts` — extend

**Not changed, on purpose:** `tests/components/Login/Enhanced/ui/RdbPinInputs.test.tsx`.
The change to that file is a comment. `utils/otpLocks.ts` and everything about
sending a code are untouched (spec C-2).

**A trap for step 1.** All three files already carry `"The Code Sent Has Expired"`
**twice** and `"Resend Code"` **twice** — counted, four duplicate entries per file
in `ar`, `tr` and `ku` alike. In a JS object the last one wins, silently. Add each
new key **once per file**, and grep all three first to confirm it is not already
there. Do not tidy the existing duplicates: that is a separate change and it would
alter strings this ticket has no business touching.

## Integration surface

- **Components / shared config touched:** `usePhoneVerifyFlow` (the shared verify
  flow), `EnterPinScreen` (the shared fullscreen pin screen), `RdbPinInputs` (the
  shared pin primitive, comment only), and the three translation files, which
  every screen in the app reads.

- **Who else depends on them:** `usePhoneVerifyFlow` has two hosts, and those two
  are reached from four product flows — the navbar re-auth widget
  (`ConfirmMobilePhoneWidget`), the expired-session prompt (`SessionExpiredWidget`),
  the settings phone change (`PersonalInfoForm` / `VerifyUser`, which injects a
  **different** verify function, `VerifyOtpForUpdatePhone`), and the cart order
  button (`OrderButton` → `InlineVerifyPanel`). `EnterPinScreen` has two callers:
  `VerifyPhoneFlow` and `FullEnhancedLoginWidget`. `RdbPinInputs` has **three**
  source call sites, not two — `EnterPinScreen`, `InlineVerifyPanel` and
  `NewLoginDesign/NewEnterPinScreen.tsx:257`. The third is the unwired design, and
  it is unaffected only because the change to that primitive is a comment; any
  logic change there would have reached it too.

- **Overlapping flows:** one edit to `usePhoneVerifyFlow` lands on all four of
  those product flows at once. The settings phone change is the one to watch,
  because it is the only host whose verify call goes to a different endpoint — the
  cap must behave identically there, since the counting happens before the
  injected function is called and knows nothing about which endpoint it is.

- **Ordering / lockstep dependencies:** the three translation files must be
  written **before** any code that references the keys, or `pnpm lint` fails on
  `local/translate-key-exists`. The new prop on `EnterPinScreen` and its two call
  sites must land together, or `tsc --noEmit` fails in CI (which runs
  `next typegen` first).

- **What breaks if this is wrong:**
  1. Lock via `disabled` only → an on-screen keypad stranded open over dead boxes
     on mobile, unclosable. Shows up as a stuck keypad, not as an error. Guarded
     by AC-5.
  2. The lock message drawn anywhere other than the existing error slot →
     `tests/e2e/auth.scripted.spec.ts:136-142` reads `data-pw="verify-otp-error"`
     and gets `null`; that spec turns red. Guarded by AC-4 and the e2e row.
  2b. **The unit suite, which does gate pull requests.** The new wording changes
     one existing exact-equality assertion
     (`usePhoneVerifyFlow.test.tsx:582`). Step 9 declares that edit. Skip it and
     `pnpm test:run` goes red at `/implement` with no instruction covering it,
     and fixing it then would be scope creep (IM-4). A full search of `tests/`
     found no other assertion the new wording or the lock breaks — the siblings
     use `toHaveTextContent`, and `profile.scripted.spec.ts:549-557` only checks
     visibility.
  5. **The shared browser helper.** `submitOtp`
     (`tests/e2e/actions/auth.ts:432-441`) waits for the code input to be
     **enabled**. It is used by four spec files and is not edited here, so the
     new locked-boxes case must assert the disabled state directly rather than
     call it — see step 10.
  3. The counter reset moved off the successful-send lines → a shopper who asks
     for a new code stays locked with no way out for the rest of the session.
     Guarded by AC-6.
  4. `attemptsRef` repointed at the new count → the `attempts` field on the
     existing verify and resend analytics events silently changes meaning, with
     no error anywhere. Guarded by AC-14.

## Tests

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `usePhoneVerifyFlow.test.tsx::says the code was wrong, and reports it` (`:564`) — proves the message, not any count | extend | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | `says how many tries are left after the first wrong code` |
| AC-2 | none — searched `usePhoneVerifyFlow.test.tsx` `describe("verifying the code")` (`:490`) | extend | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | `counts the second wrong code down to one try left` |
| AC-3 (boxes dead) | `EnterPinScreen.test.tsx::holds the boxes closed while the code is being checked` (`:226`) — proves the busy case only | extend | `tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` | `takes nothing more once the tries have run out` |
| AC-3 (digits cleared) | `usePhoneVerifyFlow.test.tsx::clears the wrong code so the shopper can type the next one` (`:591`) — the third failure runs the same `catch` and the same 1500 ms clear (`usePhoneVerifyFlow.ts:255-258`), so this is already proven | **existing** | — | write nothing |
| AC-4 | `usePhoneVerifyFlow.test.tsx::says the code was wrong, and reports it` (`:564`) — wrong-code text only, no cap text | extend | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | `drops the tries-left count and says to ask for a new code on the third` |
| AC-5 | `RdbPinInputs.test.tsx` — searched; covers the keypad for the valid and expired cases, nothing for a lock | extend | `tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` | `closes the keypad when the tries run out` — **this case is a silent pass unless it is written in a very particular way, and two separate things make it so.** (1) The file's `beforeEach` sets `setDevice("pointer")` (`:54`), and `RdbPinInputs.tsx:39` then skips the keypad entirely — so call `setDevice("touch")` first. (2) `RdbPinInputs.tsx:53-57` only opens the keypad when it is **not** disabled at mount, so a component rendered already locked never had a keypad to strand. The case must therefore **drive the change**: render with `attemptsLocked={false}`, wait for the keypad to open (a 300 ms timer), then rerender with `attemptsLocked={true}` and assert it is gone. Only that order can go red if `isExpired` is not passed. |
| AC-6 | `usePhoneVerifyFlow.test.tsx::starts the attempt count again after a code is resent` (`:446`) — resets the analytics ref, not the cap | extend | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | `a code that arrives gives three fresh tries` |
| AC-7 | none — searched `usePhoneVerifyFlow.test.tsx` `describe("resending the code")` (`:353`) | extend | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | `a resend that fails leaves the boxes locked` |
| AC-8 | none — searched all four Enhanced test files for `user not found` | new | `tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx` | `a number with no account does not spend a try` — **login / signup surface only**, per the narrowed AC-8. No case is written for the other two surfaces: there the same reply does spend a try, by decision (spec C-5, OQ-7). |
| AC-16 | none — searched `usePhoneVerifyFlow.test.tsx` `describe("verifying the code")` (`:490`); every existing failure case asserts the message, none asserts a count | extend | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | `a check that never reached a verdict still spends a try` — drive three failures that are **not** wrong-code replies (a thrown transport error) and assert the boxes end dead. This pins spec EC-9 so the accepted behaviour cannot drift. |
| AC-9 | `usePhoneVerifyFlow.test.tsx::checks a code once, however many times the boxes fire` (`:544`) — proves one request, not one count | extend | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` | `boxes that fire twice in one moment spend one try` |
| AC-10 | `VerifyPhoneFlow.test.tsx::counts down to the resend rather than offering it at once` (`:393`) — proves the countdown, not that it survives a lock | extend | `tests/components/Login/Enhanced/VerifyPhoneFlow.test.tsx` | `still counts down to a new code while the boxes are locked` |
| AC-11 | `EnterPinScreen.test.tsx::declares the code expired once its own life runs out` (`:133`) — expired alone | extend | `tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` | `says the code ran out of life when it is both expired and locked` |
| AC-13 | per-surface files exist but none covers the cap | extend + new | `VerifyPhoneFlow.test.tsx`, `InlineVerifyPanel.test.tsx`, `FullEnhancedLoginWidget.test.tsx` | `locks the boxes after three wrong codes` — one case in each of the three files |
| AC-14 | `usePhoneVerifyFlow.test.tsx::reports the resend with the attempts made since the last send` (`:415`) — proves today's meaning in the hook, nothing in the widget | extend + new | `tests/components/Login/Enhanced/usePhoneVerifyFlow.test.tsx` **and** `tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx` | `the reported attempts still counts every check, not only the wrong ones` — needed in **both** files. The widget keeps its own `attemptsRef` at `:299-300`, so the hook's case cannot guard it; the widget case asserts the failed-verify analytics payload still reports every check. |
| AC-15 | none — no test file asserts translation keys; this is what the lint check is for | none — proved by the `lint` check in the validation profile, which errors on a key missing from any of ar/tr/ku (`eslint-rules/translate-key-exists.js`), not by a test file | — | — |

**Why `FullEnhancedLoginWidget.test.tsx` is `new` and not a second file for a
covered unit:** that widget has no test file at all today (searched
`tests/components/Login/Enhanced/`). It keeps its **own** copy of the counter, so
proving the hook does not prove it. It holds the lock cases only — AC-8 and its
AC-13 row — not a suite for the whole 711-line component.

**The known risk on that file, and how to avoid it.** No existing test mounts a
component that imports `public/styles/rdb-auth.css` or renders `scaling/Page`
(`AppScaler` writes hardcoded ids and `:root` variables and allows only one
instance). `next/navigation` and `window.matchMedia` are already handled in
`tests/setup.ts`, and the mock set from `VerifyPhoneFlow.test.tsx:13-28`
(`services/auth`, `utils/gtag`, `LogError`) carries over.

**Mock these at the top of the new file**, so no scaled canvas is ever created and
the widget's module graph does not enter the unit run wholesale:

- `scaling/Page` — a pass-through wrapper, so `AppScaler` never mounts
- `serverRequests` — `fetchStoriesForUser` is called on the success path
- `framer-motion` — the screen transitions are not what these cases prove
- `./screens/QrLoginScreen` — a static import at `:35` that pulls in
  `services/qrLogin` and `ui/CustomQRCode`, which imports the whole `qrcode`
  package (`CustomQRCode.tsx:4`). Nothing here needs it.

**Write one shared helper in that file** that walks get-started → terms →
enter-phone → select-method → enter-pin, the way `usePhoneVerifyFlow.test.tsx`
already does. Every case needs that walk, and `handleSendPhone` holds a real
300 ms timer on the way, so writing it once keeps the cost to about a second
across the file instead of repeating it per case.

**If the widget still cannot be mounted, that is a blocker to report at
`/implement` (IM-10) — not a quiet downgrade.** Two fallbacks, in this order:

1. **Extract the four-line counter** into something both copies call, and prove it
   there. It stays in the unit suite, so it still gates pull requests. This is the
   abstraction the *Approach* rejects — the rejection holds only while the widget
   mounts.
2. **Prove it in `tests/e2e/auth.scripted.spec.ts`**, which already drives this
   exact widget against mocked endpoints and is already in *Files to change*.
   **This one is worse and must be stated as such: the browser suite does not gate
   pull requests, so a fix proved only there is unguarded from the day it lands.**

**The browser-suite row that is not an AC.** `tests/e2e/auth.scripted.spec.ts:103-142`
already submits three wrong codes and polls for a visible error after each. The
third submit is now the locking one. That file is in scope so its third assertion
can be checked against the new wording, and it gains one case:
`the boxes stop taking a fourth code`.

## Validation strategy

- Validation profile: **`logic-change`** — `lint`, `typecheck`, `unit-tests`.
- Why this profile and not the others:
  - **not `ui-change`** — it has no `unit-tests` check. Fourteen `AC-n` rows above
    declare unit tests, and a declared test with nothing to run it is an error at
    `/verify` (VF-11).
  - **not `full`** — `build` adds nothing here. The change adds no import across
    the server/client boundary and no new module; the only new import is one
    constant between two client files.
  - `lint` is load-bearing, not routine: it runs `local/translate-key-exists`,
    which errors when a literal key is missing from ar, tr or ku and names the
    languages. That check **is** the proof for AC-15.
  - `typecheck` catches the new `EnterPinScreen` prop landing at only one of its
    two call sites.
- Beyond the profile, run `pnpm lint:i18n-parity` once by hand after step 1. The
  lint rule proves every *used* key exists in all three files; parity proves the
  three files did not drift in some other way while they were open.
- Every check is read-only and deterministic. `pnpm test:run` is
  `vitest run --project unit` — the non-writing mode, already pinned.
- **Keep the new cases off the clock.** No file under
  `tests/components/Login/Enhanced/` uses fake timers, so any case that waits for
  the 1500 ms clear burns that time for real in the suite that gates every pull
  request. None of the declared cases needs to: AC-1, AC-2, AC-4, AC-13 and AC-16
  all assert the count and the locked state **straight after** the third failure,
  before the clear runs. The one existing case that does wait for it
  (`usePhoneVerifyFlow.test.tsx:591`) already exists and is not being changed.

## Rollback

One revert. Every source change is additive and local: one new exported constant,
one new `useState` in each of two files, one new optional prop with a `false`
default, and two keys in three data files. Nothing is renamed, no shared logic is
altered (`RdbPinInputs` gets a comment), and no request, route or stored value
changes. Reverting the commit restores the previous behaviour exactly — the boxes
accept unlimited wrong codes again — with no data to migrate back and nothing left
behind. The two translation keys may be left in place harmlessly if a partial
revert is ever wanted.

## Deferred questions from `spec.md` (PL-12)

| OQ | Decision |
|------|----------|
| OQ-1 | A new `useState` named `wrongCodes` in `usePhoneVerifyFlow.ts` and, separately, in `FullEnhancedLoginWidget.tsx`. The existing `attemptsRef` in both files is untouched and keeps feeding the analytics `attempts` field. The two numbers never merge — AC-14 guards it. |
| OQ-2 | `export const MAX_VERIFY_ATTEMPTS = 3` in `components/Login/Enhanced/usePhoneVerifyFlow.ts`, imported by `FullEnhancedLoginWidget.tsx`. No new file, no env var, no store slice. |
| OQ-3 (placement) | Both messages are written into the existing `error` state, so they draw in the slot that already exists — `data-pw="verify-otp-error"` in `EnterPinScreen.tsx:292-296` and the error block in `InlineVerifyPanel.tsx:334-338`. No new element. This is what keeps `tests/e2e/auth.scripted.spec.ts` green. |
| OQ-4 | `disabled` **and** `isExpired`, both fed by the new flag, at all three surfaces. `RdbPinInputs` keeps its logic. Rejected: (a) adding `!disabled` to the keypad gate at `:219` — `disabled` is also true during every in-flight verify, so the keypad would blink shut and reopen on each try, a behaviour change for every caller to fix one; (b) renaming `isExpired` to `isSpent` — mechanical, but it touches a shared primitive, three call sites and its test file for no behaviour gain. Instead the prop's JSDoc is corrected. |
| OQ-12 | A new file, `tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx`, holding the lock cases only, with the mount risk and the worse browser-suite fallback written out above. |

No `OQ-n` is left open.

## Traceability — plan ↔ requirement / AC

| AC | Requirement | Step(s) | Proved by |
|------|-------------|---------|-----------|
| AC-1 | FR-1, FR-2 | 1, 2 | `usePhoneVerifyFlow.test.tsx` |
| AC-2 | FR-1, FR-2 | 1, 2 | `usePhoneVerifyFlow.test.tsx` |
| AC-3 | FR-3 | 3, 5, 6 | `EnterPinScreen.test.tsx` (boxes dead) + `usePhoneVerifyFlow.test.tsx` (digits cleared) |
| AC-4 | FR-4 | 1, 2, 6 | `usePhoneVerifyFlow.test.tsx` |
| AC-5 | FR-3, EC-6 | 3, 5 | `EnterPinScreen.test.tsx` |
| AC-6 | FR-5, EC-7 | 2, 6 | `usePhoneVerifyFlow.test.tsx` |
| AC-7 | FR-5, EC-4 | 2, 6 | `usePhoneVerifyFlow.test.tsx` |
| AC-8 | C-5 | 6 | `FullEnhancedLoginWidget.test.tsx` |
| AC-9 | FR-1, EC-5 | 2 | `usePhoneVerifyFlow.test.tsx` |
| AC-10 | FR-6, EC-1 | 3, 4 | `VerifyPhoneFlow.test.tsx` |
| AC-11 | EC-3 | 3 | `EnterPinScreen.test.tsx` |
| AC-13 | FR-7 | 4, 5, 6 | `VerifyPhoneFlow.test.tsx`, `InlineVerifyPanel.test.tsx`, `FullEnhancedLoginWidget.test.tsx` |
| AC-14 | Non-functional, OQ-10 | 2, 6 | `usePhoneVerifyFlow.test.tsx` |
| AC-15 | FR-8 | 1 | the `lint` check in the `logic-change` profile |
| AC-16 | C-4, EC-9 | 2 | `usePhoneVerifyFlow.test.tsx` |

Every `AC-n` in `spec.md` has a row. Every test file named here is in *Files to
change*. `AC-3` is the one criterion with two halves, and each half names the file
that can actually observe it.

## Out of scope

- Any change to `utils/otpLocks.ts`, the per-number wait, the session limit, the
  server limiter or the IP rules (spec C-2).
- Aligning `EnterPinScreen`'s `timerSeconds` (120) with the backend's code
  lifetime (~60). Own ticket — spec EC-2, OQ-9.
- Adding a `user not found` branch to `usePhoneVerifyFlow`, so the cart panel
  stops reading a number with no account as a wrong code. Declined at spec, OQ-7.
- `NewLoginDesign/` and the `/loginDemo` page.
- Any logic change to `RdbPinInputs`, and any edit to its test file.
- Telling a refused code apart from a check that never reached a verdict. Raised
  at review with the cost in numbers; the owner reaffirmed the intake decision.
  Recorded as spec EC-9 and pinned by AC-16.
- Correcting the stale `120-second cooldown` comment at `InlineVerifyPanel.tsx:325-326`.
  It contradicts the confirmed `OTP_COOLDOWN_SECONDS=60`, but it is a comment
  about sending, and sending is out of scope (spec C-2).
- Tidying the four duplicate translation keys that already exist in each of the
  three language files.
- Storing the count, a lockout timer, a countdown to unlock, an automatic unlock,
  or a new store slice.
- Reworking `FullEnhancedLoginWidget` onto `usePhoneVerifyFlow`, and extracting a
  shared counting hook.
- Any backend, API route or endpoint change.
