---
ticket: auth-closeout-tests
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-23
links:
  clickup:
  github:
---

# Implement — auth-closeout-tests

> Record of what was actually built, following `plan.md`.

Branch `ticket/auth-closeout-tests`, cut from a clean `develop` (this repository
overrides the plugin's `main` default). **No application file was changed.**

## Changes prepared (uncommitted)

`/implement` creates no commit (IM-9). The single publishable commit is made
later by the delivery step.

**New — the live check (AC-1..AC-5):**

- `tests/e2e/session-recovery.live.spec.ts` (251) — `RECOV-01`. Signs in for
  itself, spoils **only** the access credential, then in this order: the cart is
  answered (AC-1) → the credentials really rotated (AC-4/AC-5) → the same shopper
  (AC-2) → no prompt (AC-3) → the replacement is still `httpOnly` (AC-4). Each is
  its own `test.step()`; every assertion carries a message and names the **core**
  backend where it crosses one.

**New — the profile screens (AC-6..AC-13):**

- `tests/components/setting/profile/PersonalInfoForm.test.tsx` (286) — 10 cases.
  What the form refuses and with which message, the message clearing on
  correction, a guest getting the sign-in surface instead of a save, and a
  changed number opening the re-verify step **instead of** saving.
- `tests/components/setting/profile/VerifyUser.test.tsx` (186) — 7 cases.
  Verified vs Verify Now, the branch that re-verifies vs the one that signs in,
  and the overlay standing down for a global auth surface **and not coming back**.
- `tests/components/setting/profile/index.test.tsx` (157) — 12 cases. The card
  for a signed-in shopper, for a guest, and for all five placeholder values the
  app stores instead of a picture — including the misspelled one.
- `tests/components/settings/UploadProfilePhoto.test.tsx` (266) — 5 cases.
  Choosing, removing, and the refused upload.

**Changed — one existing test file (AC-15):**

- `tests/services/auth.profile.test.ts` — two cases added in a new `describe`.
  Field parity across all eight mirrored fields, and the one-time token asserted
  **absent** from the stored copy.

**Changed — the two tracked docs:**

- `docs/testing/E2E_SCENARIOS.md` — new "Signed-in session recovery" section, the
  `RECOV-01` row citing `session-recovery.live.spec.ts:115`, the header count
  53 → **54**, and a summary-table row (signs in: yes, its own, a third real code
  per run; writes: no).
- `docs/testing/AUTH_CLOSEOUT_PLAN.md` — items C, D and E marked in the "Where
  this stands" table, and the five findings this work produced recorded under
  `Findings`.

## Every follow-up from `review.md` was applied

| # | Follow-up | Where |
|---|---|---|
| 1 | AC-15 `image` compared by **value** against the stored-copy transform, not presence | `auth.profile.test.ts`, new describe |
| 2 | Editor stub returns a **real** base64 data URL; the refused case asserts the upload was attempted **first** | `UploadProfilePhoto.test.tsx` |
| 3 | Step order: spoil → cart → poll → identity → prompt | `session-recovery.live.spec.ts` |
| 4 | Fresh `new Error(redact(error))`, no `cause`, no reattached stack | `session-recovery.live.spec.ts`, sign-in step |
| 5 | Fixed sentence names the leg and the core backend, then the redacted original; the exact-match limit written in the comment | same |
| 6 | AC-4 asserts the `httpOnly` **boolean** off the jar, never a cookie record | same |
| 7 | Every seeded value from `buildUser()`; token literal deliberately not token-shaped | all five new files |
| 8 | `utils/functions` stubbed so the error reporter is spyable | `UploadProfilePhoto.test.tsx` |
| 9 | `URL.createObjectURL` / `revokeObjectURL` stubbed; the location mock covers "not navigated away", and the navigating path is covered in the same file so the negative can fail | same |
| — | Image upload stub **resolves `null`** rather than rejecting | same |

## Three checks were proved able to fail

The plan owed no red-first work — it fixes nothing — but `spec.md`'s binding
constraint is that a check must be able to fail for the reason it names. Three
were the most at risk of being green for the wrong reason, so each was broken on
purpose, seen red, and restored:

1. **The overlay not coming back (AC-11).** Removed the reset effect from
   `VerifyUser.tsx` → red with *"the settings overlay came back on its own once
   the global surface closed"*. App file restored with `git checkout`.
2. **The refused-upload guard (AC-12).** Changed the editor stub to return a
   placeholder instead of a real data URL → **both** refused cases red with *"the
   upload was never attempted … check the editor stub returns a real data URL"*.
   Test file restored.
3. **The mirror parity guard (AC-15).** Removed `gender` from the mirror in
   `services/auth.ts` — the original defect — → red with *"`gender` was sent to
   the backends but the app's own stored copy still holds the old value"*. App
   file restored with `git checkout`; `git status` confirms `services/` clean.

## Deviations from plan

**One, and it was my test being wrong, not the app.** The plan said AC-6 covers
"a missing phone". Rendering the form with an empty phone does **not** reach that
rule: a visitor whose stored number is empty is treated as *not signed in*, so
the save handler opens the sign-in surface and returns before validating. That
case was rewritten to seed a real number and **clear the field in the form**,
which is the only way a signed-in shopper reaches the rule. The original version
was seen red first, which is how it was caught — it would otherwise have been
AC-8 passing under AC-6's name.

Two things the plan left open, now settled by what the code required:

- The remove control is queried by its visible words. It carries a `data-pw`
  marker for the browser suite, which is not the attribute the unit suite reads.
- The profile-save mock is typed with its arguments, because these cases read the
  payload back off the call; a no-argument signature made that a type error.

## Left undone, deliberately

- **`RECOV-01` has never run against staging.** It is written but unproven, and
  `AUTH_CLOSEOUT_PLAN.md` says so in the table. Running it is `verify`'s job, and
  its `test.setTimeout()` still carries a `MEASURE ME` note: the first real run
  must replace it with the observed duration and drop the cap accordingly.
- No application defect was fixed. Five are recorded in
  `docs/testing/AUTH_CLOSEOUT_PLAN.md > Findings`, including the one this work
  confirmed: a refused profile-picture upload tells the shopper nothing.

## Validation run during implementation

- `pnpm test:run` — **57 files, 1468 tests, all passing** (1432 before this
  work; +36 is exactly the count added: 10 + 7 + 12 + 5 + 2).
- `node_modules/.bin/tsc --noEmit` — **clean**, after fixing two errors of my own
  in the picture file.
- `pnpm lint` — **0 errors**, 64 warnings, all pre-existing and none in the new
  files.
- `pnpm lint:i18n-parity` — not run and not required: no user-visible string was
  added or changed anywhere in this work.
- The live check was **not** run. It needs staging and a real one-time code; that
  belongs to `verify`, after `pnpm e2e:health`.
