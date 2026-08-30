---
ticket: otp-entry-three-attempt-lock
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Review — otp-entry-three-attempt-lock

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (15 acceptance criteria, AC-12 retired before approval) and `plan.md`
(nine source files, six test files, validation profile `logic-change`). Context
read but not judged: `research.md`, `intake.md`.

This is the third advisory pass over these two documents. Two earlier rounds ran
outside the gate and both documents were revised after each. The panel below was
told what had been cut, so it would look for what remains rather than re-propose
scope the owner had already removed.

## Plan Summary

Count failed code checks in drawn state — a new `useState` in the shared verify
flow and, separately, in the login / signup widget. Feed that count into the
dead-box state each code screen already has, through the two props the shared pin
component already takes. Show the remaining tries after the first and second
failure; replace the wording with a "tries ran out" line on the third. A code that
is sent and arrives resets the count. Nothing is stored, no request changes, and
no analytics event is added or removed.

## Risks

- The largest single risk is a test that passes whether or not the change is
  there. Two of the three earlier rounds found one, and this round found two more.
- The change touches a hook shared by four product flows and a pin component with
  three call sites, so a mistake is not contained to the screen being worked on.
- The new wording is load-bearing for the unit suite: with `triesLeft` not
  exported, four criteria are observable only through the built message string.

## Assumptions

- A reply of "number is not registered" means the shopper typed the right digits.
  Stated as fact in `spec.md > C-5`; not proved anywhere. The practical bound is
  that the widget leaves for its own screen and no path returns to the same boxes.
- The backend gives a code about 60 seconds of life. The owner's figure; not
  confirmed against the backend.
- `OTP_IP_MAX=4` and `OTP_COOLDOWN_SECONDS=60` are the deployed values. Confirmed
  present in `.env.development` and `.env.production`; both are defaults that an
  environment could override.

## Open Questions

- none. All twelve `OQ-n` were answered in `spec.md` or `plan.md`, and no new
  question was opened at this stage.

## Panel Findings (advisory)

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | **major** | The three per-surface AC-13 cases would lock after **two** typed codes, not three, and so pass for the wrong reason. The hidden input fires `onComplete` on **every keystroke** once the value already holds six digits (`RdbPinInputs.tsx:239-243` — `slice(0,6)` then `if (digits.length === 6) onComplete(digits)`), and `verifyingRef` blocks only a concurrent call, not a sequential one. Every existing case types exactly once, so this has never bitten. | `plan.md > Tests`, AC-13 row | **accept** — carried into implement as follow-up FU-1 |
| senior | **major** | AC-4 has no coverage on the login / signup surface. Step 6 says to add the counter, the resets and the flag to the widget, but never says to write the two new messages there — the widget keeps its own `setError(translate('Please Enter The Correct Code Sent To Your Phone'))` at `FullEnhancedLoginWidget.tsx:387`. A widget that locks correctly but never says "Too many wrong codes" passes every declared unit case, and the browser case asserts the disabled input, not the wording. | `plan.md` step 6; Tests AC-4 row | **accept** — carried into implement as follow-up FU-2 |
| senior | minor | The plan contradicts itself on the hook's public surface: *Files to change* says `usePhoneVerifyFlow.ts` gains "two new returned values", step 2 says return `attemptsLocked` **only**. An implementer working from the file list adds the export the Approach rejects. | `plan.md > Files to change` vs step 2 | accept — FU-3 |
| senior | minor | The new-file mock note is incomplete in three ways that each stop the mount: the borrowed mock set stubs `SendOtp` only, but the widget calls `VerifyOtp` (`:305`) and `UpdateName` (`:460`); and the widget returns `null` unless `loginOpen` is true (`:188`), which must be seeded through the store. | `plan.md > "The known risk on that file"` | accept — FU-4 |
| senior | minor | The exact failure-1 string is never written down, yet step 9 requires the code and `usePhoneVerifyFlow.test.tsx:582` to match character for character. As described the concatenation yields "…Your Phone Tries left: 2" with no separator. | `plan.md` step 1 / step 9 | accept — FU-5 |
| security | minor | The plan's stated guard for a missed call site is not real: `attemptsLocked?: boolean` defaults to `false`, so `tsc --noEmit` cannot fail when a future `EnterPinScreen` caller omits it. With the early return cut, nothing catches an uncapped surface. | `plan.md` Integration surface ("ordering") vs step 3 | accept — FU-6 |
| performance | minor | The shared walk helper removes duplicated **code**, not duplicated wall-clock — each case still pays the real 300 ms timer in `handleSendPhone`, so ~1 second is the cost of the helper, not a saving from it. The wording overstates it. | `plan.md > "Write one shared helper"` | dismiss — wording only, no effect on the work |
| security | info | The per-address correction in EC-1 / EC-9 is confirmed against the limiter and is, if anything, pessimistic — it also fails open on a Redis outage. Suggest adding "by default" to the four-per-hour figure. | `spec.md` EC-1, EC-9 | |
| security | info | C-3 / EC-8 verified accurate: `verficationID` lives only in the store and no `persist` middleware is used, so a reload really does leave nothing to check a code with. | `spec.md` C-3, EC-8 | |
| security | info | EC-9's second half is real and reproducible, which helps the follow-up ticket: `app/api/auth/login/route.ts:148-149` can answer 200 with no user, and `services/auth.ts:189` then throws on `response.data.user`. | `spec.md` EC-9, Out of Scope | |
| senior + performance | info | Cutting the early return is safe and should stay cut. A locked box cannot fire a check twice over: the hidden input carries `disabled` (`RdbPinInputs.tsx:236`) and the keypad is both closed by `!isExpired` (`:219`) and `disabled`-guarded in `NumericKeypad`. | `plan.md > Approach` | |
| senior | info | AC-5's declared shape does go red without the fix, for the reason the plan gives — the restore effect's body only runs on the true→false edge, so a `disabled`-only lock leaves the keypad standing. AC-15's lint proof also holds. | `plan.md > Tests` AC-5, AC-15 | |
| senior | info | Every line reference in the plan was checked and is correct, and the Integration surface is accurate and complete — two hosts, four flows, two callers of the code screen, three call sites of the pin component. No fifth consumer exists. | `plan.md` | |
| performance | info | No material performance risk remains: two integers in memory, no request, no store slice, no new timer, no analytics event. The mock list is complete for the new test file. | `plan.md` steps 2, 6 | |

## Decision

`APPROVED`

- Rationale: the design is settled and the panel raised nothing against it. Both
  `major` findings are gaps in how the plan **declares its tests**, not in what
  the change does, and both are repaired by following FU-1 and FU-2 below while
  writing the already-declared cases. The owner chose to accept them here and
  carry them into `/implement` rather than spend another plan pass on three
  sentences. Two earlier advisory rounds had already shrunk the change: the early
  return and the re-shown resend message were cut, and AC-12 was retired, so what
  remains is the smallest thing that meets the criteria.

- Comprehension gate: passed, attempt 1, 2/2 (100%). Administered short under
  CG-8 — see `comprehension.md > degraded`. The integration question was asked.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approval, 2026-08-30.

## ADR reference

- ADR: none

## Required Follow-up Actions

> Accepted at this gate and carried into `/implement`. FU-1 and FU-2 come from the
> two `major` findings; the rest from the minors. None of them changes what the
> code does — each corrects how a declared case is written, or a statement in the
> plan that is not true. They are recorded here, in the approved review, so that
> acting on them is inside the approved scope rather than new work (IM-4).

- **FU-1** (major) — When writing the three AC-13 cases, clear the code field
  between codes (`await user.clear(...)`) and assert the verify function was
  called **exactly three times**, not only that the boxes ended locked. Without
  the clear, `RdbPinInputs.tsx:239-243` fires `onComplete` on every keystroke once
  six digits are already present, so the boxes lock after two typed codes and the
  case passes for the wrong reason. The browser case is unaffected — Playwright's
  `fill()` fires one change.
- **FU-2** (major) — In `FullEnhancedLoginWidget.tsx`, write the two new messages
  into the widget's **own** `setError` at `:387`, the same way step 2 does for the
  shared flow. Add one assertion for the wording to the already-declared AC-13
  case in `FullEnhancedLoginWidget.test.tsx`. Without this the widget locks but
  never says "Too many wrong codes", and AC-4 reaches `/verify` unproven on that
  surface.
- **FU-3** — `usePhoneVerifyFlow.ts` returns **one** new value (`attemptsLocked`),
  not two. The *Files to change* entry says "two new returned values"; step 2 is
  the correct one. Do not export `triesLeft`.
- **FU-4** — The new widget test also needs `VerifyOtp` (`:305`) and `UpdateName`
  (`:460`) on the `services/auth` stub, and `loginOpen: true` seeded through the
  store, or the widget renders `null` (`:188`). These are setup gaps, **not** the
  IM-10 mount blocker — do not report them as one.
- **FU-5** — Write the exact failure-1 string once, with a separator, and use the
  identical text in the code and in the updated `.toBe(...)` at
  `usePhoneVerifyFlow.test.tsx:582`. As currently described the two would differ.
- **FU-6** — The plan's Integration surface claims `tsc --noEmit` would catch a
  missed `EnterPinScreen` call site. It would not: the prop is optional with a
  `false` default. Either make the prop required — both call sites are in scope —
  or treat review as the only guard and do not rely on the type checker.
- **Dismissed:** the performance lens's note that the shared walk helper saves no
  wall-clock. True, but it is a wording point in the plan with no effect on the
  work.
