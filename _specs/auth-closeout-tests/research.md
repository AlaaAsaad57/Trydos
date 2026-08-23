---
ticket: auth-closeout-tests
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-23
links:
  clickup:
  github:
---

# Research — auth-closeout-tests

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Prove the auth journey at the two layers that need no application change: a
signed-in shopper survives a credential refused mid-action (Item C), the profile
screens decide correctly without a backend (Item D), and the profile-mirror fix
is guarded in the suite that gates a pull request (Item E).

## Headline finding — Item C's fifth step does not describe this app

**`utils/sessionManager.ts` is not the shopper's session. It is the *simulated
user* session.**

`checkSessionExpiry()` reads one key, `localStorage.sessionExpiry`
(`utils/sessionManager.ts:11`). A repository-wide search finds exactly one writer
of that key: `app/simulateUser/page.tsx:73–74`, the tester-only simulate screen.
Nothing in the real sign-in path writes it — not `services/auth.ts`, not
`app/api/auth/login`, not the cookie manager.

So for a real signed-in shopper the key is absent, `checkSessionExpiry()` returns
`true` at line 12 without looking at anything else, and `initializeSessionCheck()`
does nothing at all.

That matters because the plan's Item C step 5 says the tick "does not undo any of
it". Written against a real account, that assertion **cannot fail** — the code
under test returns on its second line. `CLAUDE.md` calls this out by name: a check
that reports "pass" for a case it cannot see is not finished. The `spec` stage
must either restate the step as something observable or drop it from the live
file and keep it entirely in the unit suite, where the `sessionExpiry` key can
actually be set. `OQ-1` carries the decision.

The unit half is real work and stays: `SessionChecker` is mounted for **every**
visitor through `components/global/DeferredLayoutClients.tsx:14,30`, so this code
runs on every page load and every five minutes for everybody, and it is untested.

## Relevant directories

- `tests/e2e/` — the browser suite. `profile.live.spec.ts` (Item A, 733 lines) is
  the model for Item C; `session.live.spec.ts` is the guest half of the same
  behaviour and the closest template.
- `tests/e2e/harness/` — `session.ts` (credential snapshot/spoil/compare, the auth
  call recorder), `env.ts` (`hasShopperA`, `envValue`), `redact.ts`.
- `tests/e2e/actions/` — `auth.ts` (`attemptAuth`, `bootAsNewGuest`, `whoAmI`,
  `whoAmIWhenReady`, `signedInSession`), `profile.ts`, `nav.ts`.
- `tests/components/` — currently only `Login/**` (10 files) from unit phase 11.
  Item D's five files are new and land here.
- `tests/mocks/` — `authStore.ts`, `device.ts`, `location.ts`, `authGraph.ts`,
  `mockFetch.ts`. Everything Item D needs already exists.
- `tests/services/` — `auth.profile.test.ts` is where Item E's guard goes.
- `components/setting/profile/`, `components/settings/` — Item D's targets.

## Relevant config files

- `playwright.config.ts` / `tests/e2e/cli.ts` — the `live` and `scripted` projects;
  live runs `workers: 1`, `retries: 0`.
- `vitest.config.mts` — the `unit` project; `tests/setup.ts` supplies
  `window.matchMedia` and holds the `afterEach` ordering note.
- `.env` — `TEST_ACCOUNT_PHONE`, `TEST_ACCOUNT_OTP`. Absent → the live file skips.

## Possibly affected services

None. This ticket writes tests only. The three items read from:

- **core / stories / chat** — through Item C's sign-in and its one authenticated
  action, and through the existing fan-out in `services/auth.ts` that Item E
  reads the result of. Item C is a live test, so a wrong answer from any of these
  is a backend finding and stays red.
- **no backend at all** — Items D and E run entirely in jsdom against mocks.

## What each item can already rely on

**Item C.** Everything. `session.live.spec.ts` already performs the whole shape
for a guest: `snapshotCredentials` → `spoilCredentials([ACCESS_COOKIE])` → act →
`credentialsChangedSince` → `whoAmI` unchanged. Item C is the same shape with a
signed-in context instead of `bootAsNewGuest`.

**The action to act with is opening the cart.** `session.live.spec.ts:73–120`
already uses it, and its `openCartAndSettle` helper carries two hard-won lessons
worth reusing verbatim: wait for the credentials to have **rotated**, not for a
request to have been sent, and compare against the **spoiled** snapshot, not the
original — comparing against the original returns the instant the cookie is
overwritten, which made one case intermittently red and would have made the
"identity unchanged" case quietly green. Item C asserts identity unchanged, so it
is exposed to exactly that silent pass. Opening the cart is also read-only on the
account and collides with nothing Item A writes.

**The four session helpers are still trapped.** `SIGNED_IN_STATE`,
`forgetSavedSession`, `newLiveContext` and `handOnSession` are `const`s at
`tests/e2e/profile.live.spec.ts:133–231` with no `export`. Confirmed unchanged.
`handOnSession` is the fix for the stale-snapshot failure and Item C needs it, so
the lift into `tests/e2e/harness/session.ts` is real work in this ticket, not
housekeeping. `openSignedInSession` (same file, line ~214) is a fifth of the same
kind and should move with them.

**Item D.** All five targets are plain client components reading props plus
`useAppStore` per-field selectors — the shape `tests/mocks/authStore.ts` already
serves. Specifics found:

- `PersonalInfoForm.tsx:164–204` — `validateFunction()` is one function with four
  rules: name required, name at least 8 characters (this one **overwrites** the
  required message, so an empty name reports the length message, not the required
  one), phone required then valid, email valid only when non-empty, gender
  required. `handleSave` (line 208) gates on `isNotLoggedIn` first — it opens the
  login surface and returns **before** validating — then branches on
  `isPhoneEdited()` to open the re-verify overlay instead of saving.
- `VerifyUser.tsx` — `isVerified = isValidPhone(phone)` only; it deliberately
  ignores `is_phone_verified`, because register-guest resets that for the same
  user. The stand-down effect (lines 39–43) sets `isModalOpen` false whenever
  `loginOpen || shouldAuthinticated`, which is what stops the overlay popping back
  when the global surface clears.
- `UploadProfilePhoto.tsx` — imports `react-avatar-editor` and builds a camera UI
  by hand with raw DOM calls (`openCamera`, line 30 onward). The plan's three
  cases (choose, remove, refused upload) do not go through `openCamera`; whether
  the import alone renders in jsdom is `OQ-4`.
- `setting/profile/index.tsx` — `isInvalidImage` (line 34) names the placeholders
  treated as "no picture": `guest`, `verified_guest`, `verfied_guest` (sic —
  the misspelling is load-bearing and a test must keep it), `null`, `""`.
- `sessionManager.ts` / `SessionChecker.tsx` — see the headline finding. Both call
  jsdom-unimplemented APIs: `alert()` (line 64) and `window.location.reload()`
  (line 65). `tests/mocks/location.ts` exists for the second; the first needs a
  stub. `SessionChecker` sets a 5-minute `setInterval` and clears it on unmount.

**Item E.** Fully reachable with no application change.
`tests/services/auth.profile.test.ts:150–172` already reads
`store.useAppStore.getState().userProfile` and inspects
`net.calls[].body.updates[0]`. The parity guard reads the same two places. The
file's fake-timer rule and its `withSettle()` helper are file-level and apply.

## Test / validation commands available

Listed, not run.

- `pnpm test:run` — the unit suite (`vitest run --project unit`). Items D and E.
- `pnpm test` — the same, in watch mode.
- `pnpm test:coverage` / `pnpm test:ci` — with coverage.
- `pnpm e2e:health` — is staging answering. Run before blaming Item C.
- `pnpm test:e2e:live` — the live browser suite. Item C.
- `pnpm test:e2e:scripted` — the scripted project (Item B's, not this ticket's).
- `pnpm lint` — ESLint, including the i18n key rules (missing keys are errors).
- `pnpm lint:i18n-parity` — ar/tr/ku key parity.
- `node_modules/.bin/tsc --noEmit` — typecheck. Needs `next typegen` first in a
  clean checkout, because `next-env.d.ts` is gitignored.

## Risks and unknowns

- **A test that cannot fail.** The headline finding is one instance; the same risk
  runs through Item C's identity assertion, where reading too early passes for the
  wrong reason. Mitigation is `session.live.spec.ts`'s settle-on-rotation pattern,
  reused rather than re-derived. High impact, and already demonstrated once in
  this repository.
- **Shared-account drift.** Item C signs in to the same staging account Item A
  writes to. Opening the cart writes nothing, so the exposure is the session file,
  not the account — which is why `handOnSession` has to come along. Medium.
- **A leftover `sessionExpiry` hits a real shopper.** `SessionChecker` runs for
  everybody, so a browser that once used the simulate screen and kept the key gets
  `alert("Session for simulate user has ended")`, a forced reload, and
  `clearAllUserData()` wiping its cookies. Not this ticket's to fix — but Item D's
  tests will pin the behaviour, and if it is confirmed it is a finding for its own
  work item under the new "confirm by test, then fix" rule. `OQ-5`.
- **`react-avatar-editor` in jsdom.** It draws to a canvas. Unknown until tried;
  `OQ-4`.
- **Item C cannot run unattended.** No account configured → the file skips, and a
  skip is not a pass. Low, and correct behaviour.

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Item C's step 5 asserts the session tick leaves a good session alone, but for a real shopper `initializeSessionCheck()` returns at `sessionManager.ts:12` and does nothing. Restate it as something observable, or drop it from the live file and cover it only in Item D? | As written it is a check that cannot fail — the exact silent pass `CLAUDE.md` forbids. It decides whether the live file has four steps or five. |
| OQ-2 | Which authenticated action does Item C use, and is opening the cart accepted? | It must provoke the refusal, be safe to repeat, and write nothing to the shared account. `session.live.spec.ts` already uses the cart for the guest half. |
| OQ-3 | Do the five session helpers move to `tests/e2e/harness/session.ts` in this ticket, with `profile.live.spec.ts` repointed at them? | The plan says the first item to need them lifts them. Repointing edits a file this ticket does not otherwise own, so it belongs in `plan.md > Files to change` or it is out. |
| OQ-4 | Can `UploadProfilePhoto.tsx` render in jsdom given `react-avatar-editor` and its hand-built camera DOM? | If not, its three cases either need a module mock or move out of scope. Decide before the spec promises them. |
| OQ-5 | Item D's `sessionManager` tests will pin behaviour that looks user-affecting: a leftover `sessionExpiry` alerts a real shopper and clears their cookies. Pin it as-is, or raise it? | The new global rule says confirm by test, then fix — in its own work item. This ticket is test-only, so the answer must be "pin and raise", or an explicit deferral. |
| OQ-6 | `validateFunction()` reports the 8-character message for an **empty** name, because the length rule overwrites the required rule. Is that intended copy, or a defect? | It changes what Item D's assertion messages say. If it is a defect, it is `OQ-5`'s treatment again — pin and raise, do not fix here. |
| OQ-7 | Does Item E's parity guard drive its field list from the request body, or from a written-down list of names? | The plan says drive it from what was sent, so a field added later is covered the day it is added. A hardcoded list would have passed the original bug's sibling. |

## Notes

- No code was changed during research. Only `_specs/auth-closeout-tests/` was
  written.
- No observability runtime configs were modified. This repository owns none
  (`project-config.yaml > features.observability: false`).
- No protected runtime path was touched.
- No validation or test command was run in this stage.
