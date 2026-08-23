---
ticket: unit-tests-auth-service
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-16
links:
  clickup:
  github:
---

# Implement — unit-tests-auth-service

> Applies only what `plan.md` lists. No commit is created here (IM-9) —
> `/publish-pr` owns the single publishable commit.

## Changes prepared

Branch `ticket/unit-tests-auth-service`, cut from `develop` (this repository's
base branch). All edits are uncommitted working-tree changes.

### Source — removals, plus one behaviour-preserving reorder

| File | What changed |
|---|---|
| `services/auth.ts` | Removed the `localStorage["ID-TOKEN"]` write and **reordered** the changed-phone path (token read into a local value before the verified writes, returned at the end); removed the `idToken` property from the sign-in success dispatch; removed the never-called `normalizePhone`; removed the unused `EditPhoneFunc` parameter; removed the commented-out `CheckUserName` block and the dangling reference to it. **1096 → 945 lines.** |
| `services/chat.ts` | Removed `loginChat()` and the three imports it alone used (`LOG_IN_CHAT`, `HomeService`, `COOKIE_NAMES`). |
| `services/story.ts` | Removed `loginStories()` and the two imports it alone used (`LOG_IN_STORIES`, `COOKIE_NAMES`). |
| `services/home.ts` | Removed the `idToken` property from both sign-in dispatches, and the dangling `// auth.CheckUserName();`. |
| `store/auth/reducer.tsx` | Moved the two explanatory comment blocks onto `shouldAuthinticated` and `expiredSessionPhone`, then removed the never-applied `AuthState` interface and the `FirebaseSettings`, `User` and `ReAuthResult` types that existed only to describe it. **224 → 170 lines.** |
| `components/Login/ConfirmMobilePhoneWidget.tsx`, `components/Login/Enhanced/FullEnhancedLoginWidget.tsx`, `components/Login/Enhanced/InlineVerifyPanel.tsx`, `components/setting/profile/VerifyUser.tsx` | Dropped the `() => {}` passed as the removed parameter — one argument each. |
| `tests/mocks/auth.ts` | Removed the unread `_refreshPromise` module variable. |

**The token chain went whole**, re-proved by repo-wide search at the moment of
removal: four write sites (`services/auth.ts` ×2, `services/home.ts` ×2) and
four read sites (`services/chat.ts`, `services/story.ts`, and the same two
`services/home.ts` lines, which read the key and write the field in one
expression). Nothing reads the key or the field afterwards.

**Nothing was done about values already in shoppers' browser storage**, as
planned. No release dependency was taken.

### Tests — new

| File | Covers | Tests |
|---|---|---|
| `tests/mocks/authStore.ts` | A store built from the **real** auth reducer, plus stubs for the three members the service reads from other slices, and the per-test reset. | — |
| `tests/mocks/authGraph.ts` | Stand-in factory bodies for the service's import graph, plus a reply queue whose default is a loud failure. Imports nothing but the test framework. | — |
| `tests/services/auth.otp.test.ts` | AC-1..AC-12 | 16 |
| `tests/services/auth.session.test.ts` | AC-13..AC-22 | 19 |
| `tests/services/auth.profile.test.ts` | AC-23..AC-29 | 16 |
| `tests/store/auth/reducer.test.ts` | AC-30..AC-34 | 17 |

**68 new tests.** `tests/services/authRefreshSession.test.ts` was not touched and
still passes (AC-40).

## Deviations from plan

1. **No commit was created.** `plan.md` step 6 says "Commit" after the removal
   checkpoint. `/implement` may not commit (IM-9) — `/publish-pr` is the single
   git delivery boundary. The checks were run at that point as planned; only the
   commit was skipped. The two-commit split described in the plan's Rollback is
   therefore something `/publish-pr` would have to arrange, and the plan already
   says the real undo is a revert of the merge.
2. **Unused imports were removed alongside the two deleted routines.** The plan
   anticipated this ("plus any import left unused by its removal"); naming them
   here for the record: `LOG_IN_CHAT`, `HomeService`, `COOKIE_NAMES` in
   `services/chat.ts`; `LOG_IN_STORIES`, `COOKIE_NAMES` in `services/story.ts`.
3. **Two new lint warnings**, both the same false positive: the
   `react-hooks/rules-of-hooks` rule fires because `useAuthStore` — a plain
   factory, not a hook — is called inside `makeSlice` / `makeAuthStoreModule`.
   The name predates this ticket. Warnings only; `pnpm lint` still exits zero.
4. **One required follow-up is NOT done — see "Outstanding" below.**

## Review follow-ups (round 4) — how each was satisfied

| # | Where |
|---|---|
| 1 | `auth.session.test.ts` `load()` — `vi.resetModules()` first, then service, store and stand-ins imported from the same generation. |
| 2 | Order-independence run used `--sequence.shuffle.tests` (within-file), not only file order. |
| 3 | Each file resets the spies it queues on (`sendOtpAction`, `fetchData`, `fetchAuthMe`) and re-arms their defaults. |
| 4 | Justification corrected — see "The spy-reset reasoning was wrong" below. |
| 5 | The local gated stub raises, naming the address, on any call with no queued reply. |
| 6 | `withSettle()` in `auth.profile.test.ts`: start the call, advance the clock asynchronously, then await. |
| 7 | `reducer.test.ts` builds a fresh slice per test via `makeSlice()`. |
| 8 | `SEND_OTP_NO_REPLY` in `authGraph.ts` is the explicit failure default, re-armed each test. |
| 9 | The AC-12 shape test asserts the values are **carried**, never the literal URL. |
| 10 | Both dangling comments removed (`services/auth.ts` and `services/home.ts`). |
| 11 | **Not done — see Outstanding.** |
| 12 | Recorded below (F-14). |
| 13 | Per-file runtimes recorded below. |

**The spy-reset reasoning was wrong (follow-up 4).** The plan says a blanket
`vi.resetAllMocks()` would strip the implementations of the globally registered
stand-ins. On this runner it would not: vitest is `^4.1.10`, `sendOtpAction` is
built as `vi.fn(impl)` so a reset restores that implementation, and the
navigation stand-in's hooks are plain closures rather than spies. The targeted
reset was kept anyway — it is explicit about which stand-ins a file drives — but
the stated reason was incorrect and is corrected here.

## Findings

> **Superseded on 2026-08-16 — all fourteen were fixed after this ticket closed.**
> See "Post-closure fix pass" at the end of this file. The table below is what
> the ticket found and what its tests originally pinned; five of those tests now
> assert the fixed behaviour instead.

Recorded, not fixed (roadmap rule 4). Each behavioural one is pinned by a test.

| # | Finding | Pinned by |
|---|---|---|
| F-1 | `SendOtp`'s catch overwrites the message with the empty string it started with, so a send that never reached the server leaves the screen with no reason at all. | AC-4 |
| F-2 | The throw that protects the changed-phone path is an **incidental property read**, not a check. Adding optional chaining or a default there would mark a phone verified on a reply the server never confirmed. Said so in the test's own comment. | AC-12 |
| F-3 | A raw engine error message reaches the shopper untranslated: the catch passes `error.message` to the state the screen renders. | — (tests never assert the text) |
| F-4 | **Injection shape.** `VerifyOtpForUpdatePhone` interpolates the caller's code and verification id straight into the query string with no encoding, so a separator character in either can add parameters upstream. The fix is `encodeURIComponent` on both. | AC-12 (values carried, not the literal URL) |
| F-5 | `UpdateName` has no rollback: a service refusal leaves the new name in the state and in three profile copies, and the shopper is never told. | AC-23 |
| F-6 | `updateName` writes the signed-in user but not the profile record, and the service's own `getUser()` reads the profile — so a rename is visible in one place and not the other. | AC-34 |
| F-7 | `loginFailed` has no floor; repeated failures take the attempt counter negative. The screens stop at zero, not the state. | AC-32 |
| F-8 | `uploadToMediaServer` reads `data.error` from a null value when a failed upload's reply will not parse, so it throws instead of returning the failure it was built to return. | AC-29 |
| F-9 | `new Error("Wrong Code", response?.message)` passes a string where the second argument is an options object, so the detail is silently dropped. | — |
| F-10 | `UpdateProfile`'s market rollback sends `body: userProfile` — an object, where every other call sends a JSON string. | — |
| F-11 | The "send a name with the code" branch is unreachable in practice: all four call sites pass an empty name. Left alone because the server still accepts the field. | — |
| F-12 | Comments in `services/auth.ts` name the backend technology, against the stack-agnostic naming rule. Out of scope for this ticket. | — |
| F-13 | `tests/mocks/authGraph.ts` holds a second copy of the registration list `tests/services/authRefreshSession.test.ts` declares inline. AC-40 forbids touching that file, so the two can drift as the service's imports change. | — |
| F-14 | `spec.md`'s research-questions table cites stale AC numbers: OQ-3 says "AC-27 … AC-31" where FR-12 is AC-30..AC-34, and OQ-4 says "AC-24, AC-25, AC-26" where FR-11 is AC-28, AC-29. **The Acceptance Criteria Mapping table is correct and authoritative** — coverage is unaffected. | — |

### One behaviour that is not literally identical

Removing the browser-storage write also removes a failure mode: today that write
can itself throw on blocked or full storage (private browsing), which aborts the
method before the verified writes. Afterwards it cannot, so a shopper whose
storage is blocked completes a verification the server had already confirmed.
The direction is safe. Stated in the plan; no test written for it.

### Departures from the roadmap document

`docs/testing/UNIT_TEST_ROADMAP.md` was left untouched, so these stand:

1. It tells every phase to name the `tests-and-types` validation profile. No such
   profile exists in `.claude/project-config.yaml`; this ticket used `full`.
2. Rule 4 says tests never change the code under test. This ticket removed dead
   code by the owner's standing decision — code with no caller is not tested, it
   is removed.
3. Rule 5 says to use the Phase 2 factories and not invent new ones. Two new
   stand-ins were added (`authStore.ts`, `authGraph.ts`) because nothing existing
   supplies a real-reducer store or this service's import graph. The shared
   network stand-in was reused unchanged.

### Hot paths

The removals take work off two of them: two `localStorage` reads off the session
check that runs on every page load, and one write off the sign-in path.

## Validation run

Profile `full` — every check passed.

| Check | Result |
|---|---|
| `lint` | 0 errors, 39 warnings (37 pre-existing, 2 new false positives — deviation 3) |
| `typecheck` | clean |
| `unit-tests` | **22 files, 664 tests, all passing** (51.3 s) |
| `build` | compiled successfully, 48 static pages generated |

**Order independence (AC-39):** a second run over the four new files with
`--sequence.shuffle.tests --sequence.shuffle.files` — 68 tests, all passing.

**Per-file runtime baseline** (test time, excluding environment setup). No
threshold is set: there is no CI to enforce one.

| File | Tests | Test time |
|---|---|---|
| `tests/services/auth.otp.test.ts` | 16 | 120 ms |
| `tests/services/auth.session.test.ts` | 19 | 230 ms |
| `tests/services/auth.profile.test.ts` | 16 | 183 ms |
| `tests/store/auth/reducer.test.ts` | 17 | 56 ms |

**Protected path (TR-3):** `services/auth.ts` is the only protected glob touched.
Its edits are the removals and the one reorder listed in the approved plan. Every
test for it sits in the `tests/services/` mirror; no test file was added inside
`services/`. `store/index.ts` was not modified.

## Outstanding

**Review follow-up 11 is resolved differently.** It asked that the encoding fix
(F-4) be filed as a tracked ticket. It was instead **fixed directly** in the
post-closure pass below, so there is nothing left to track.

---

# Post-closure fix pass — 2026-08-16

**Owner's decision, taken after this ticket was verified and closed:** fix all
fourteen findings directly on this branch rather than open a follow-up ticket.
The cost was stated before the work and accepted — this branch stops being a
tests-only ticket, `verify.md`'s record describes the code as it was **before**
this pass, and a behaviour change to a protected path ships without its own
review gate.

## What changed

### Source

| Finding | Fix |
|---|---|
| F-1 | `SendOtp`'s catch keeps a reason: `msg \|\| translateFunction("Failed to send verification code")`, instead of overwriting with the empty string it started with. The refusal path uses the same translated fallback. |
| F-2 | The changed-phone path now has a **real check** — `if (!idToken) throw` — instead of relying on an incidental property read. The reorder is still what keeps it ahead of the verified writes; now nothing can "tidy" the guard away. |
| F-3 | That method's catch no longer hands a raw engine message to the screen: our own errors pass through, anything else becomes `translateFunction("Something went wrong")`. |
| F-4 | Both interpolated values are wrapped in `encodeURIComponent`, on the changed-phone call **and** on the sign-in call. |
| F-5 | `UpdateName` captures the previous name and, on failure, puts it back in the state and in all three stored copies, then shows `translateFunction("Failed to update name")`. |
| F-8 | `uploadToMediaServer` reads `data?.error ?? "Upload failed"`, so an unreadable reply is reported instead of throwing. The stray `console.log(data)` went with it. |
| F-9 | All three `new Error("Wrong Code", response?.message)` now pass `{ cause: … }`. |
| F-10 | The market rollback body is `JSON.stringify(userProfile)`, like every other call. |
| F-11 | The unreachable `Username` parameter and its `&name=` branch are gone, with the argument dropped at all four call sites. |
| F-12 | The three comments naming the backend technology now say "the gateway". |

### State slice

| Finding | Fix |
|---|---|
| F-6 | `updateName` also merges `userProfile`, so a rename is visible everywhere — including through `auth.getUser()`, which reads that record. |
| F-7 | `loginFailed` floors the attempt counter at zero. |

### Tests and artifacts

| Finding | Fix |
|---|---|
| F-13 | `tests/services/authRefreshSession.test.ts` now registers its stand-ins from `tests/mocks/authGraph.ts`, so the module list exists once. Its own tests are unchanged and still pass. **AC-40's "unchanged" no longer holds** — the file's mock block was rewritten; its assertions were not. |
| F-14 | The stale AC numbers in `spec.md`'s OQ-3 and OQ-4 rows are corrected. |

### Copy

Two keys added to all three translation files, key-parallel: **"Failed to update
name"** and **"Failed to send verification code"** (the latter existed in code as
an untranslated literal). `"Something went wrong"` was reused rather than
inventing a synonym. `pnpm lint:i18n-parity` reports 2159 keys in all three files.

## Tests updated

Five tests pinned behaviour that is now fixed, and were rewritten to assert the
fix. Three tests were added.

| Test | Now asserts |
|---|---|
| AC-4 | the screen keeps a reason after a send that never reached the server |
| AC-12 (no token) | the explicit check stops before any verified write |
| AC-12 (new) | the catch shows our own wording, never a raw internal error |
| AC-12 (new) | the code and the verification id are percent-encoded |
| AC-23 | a refused rename is put back, in the state and the stored copies, with a toast |
| AC-29 | an unreadable upload reply is reported, not thrown |
| AC-32 | the attempt counter stops at zero |
| AC-34 | a rename reaches the profile record too (+ a new test for an absent profile) |

## Validation after the fix pass

| Check | Result |
|---|---|
| `lint` | 0 errors, 36 warnings |
| `i18n-parity` | 2159 keys in all three files |
| `typecheck` | clean |
| `unit-tests` | **22 files, 667 tests, all passing** |
| `build` | see below |

## What this leaves stale

- `verify.md` records PASSED against the code **before** this pass. Its AC table
  still describes AC-4, AC-12, AC-23, AC-29, AC-32 and AC-34 as pinning the old
  behaviour. The criteria themselves still pass; the descriptions no longer match.
- AC-40 ("the earlier refresh tests are unchanged") is no longer literally true —
  see F-13.
- The ticket is `closed`. This pass was not gated by `/review` or `/verify`.
