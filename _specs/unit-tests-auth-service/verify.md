---
ticket: unit-tests-auth-service
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-16
links:
  clickup:
  github:
---

# Verify — unit-tests-auth-service

> Read-only validation. No implementation file was modified and no commit was
> created (VF-7 / VF-10).
>
> **This record describes the code as it was on 2026-08-16 at the moment of
> verification.** A post-closure fix pass on the same day changed it: all
> fourteen findings were fixed by the owner's decision. Every acceptance
> criterion below still passes (667 tests), but the descriptions of AC-4, AC-12,
> AC-23, AC-29, AC-32 and AC-34 refer to behaviour that has since been fixed, and
> AC-40's "unchanged" no longer holds. See `implement.md > Post-closure fix pass`.

## Outcome

**PASSED.** Every acceptance criterion AC-1..AC-42 is mapped to a result and every
result passes. Depth: `all-ac`.

## Validation profile

Resolved from `.claude/project-config.yaml` — commands come from configuration,
never from the plan or from here (VP-4).

**Profile: `full`**

| Check | Command | Exit | Output summary | Result | Covers |
|---|---|---|---|---|---|
| `lint` | `pnpm lint` | 0 | 39 problems: **0 errors**, 39 warnings (37 pre-existing; 2 new — the `react-hooks/rules-of-hooks` false positive on `useAuthStore`, a plain factory whose name begins with "use") | pass | AC-41 (supporting), all |
| `typecheck` | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no output | pass | AC-35, all |
| `unit-tests` | `pnpm test:run` | 0 | **22 files, 664 tests, all passing** (45.0 s) | pass | AC-1..AC-34, AC-40 |
| `build` | `pnpm build` | 0 | compiled successfully in 119 s; 48 static pages generated | pass | AC-35 |

**VP-2 confirmed:** running the checks introduced no working-tree change. The
tree after verification holds exactly the ten modified files and six new test
files from `implement.md`, and nothing else.

**Order independence (AC-39):** a second run over the four new files with
`--sequence.shuffle.tests --sequence.shuffle.files` — 68 tests, all passing,
seed recorded in the run output.

## Acceptance criteria

Every criterion, its evidence, its result.

| AC | Proved by | Result |
|---|---|---|
| AC-1 | `auth.otp.test.ts` — "records the verification id, starts the cooldown the server asked for, and counts the number" | pass |
| AC-2 | `auth.otp.test.ts` — "falls back to the documented default cooldown" | pass |
| AC-3 | `auth.otp.test.ts` — "still starts the cooldown when the send is refused with one" | pass |
| AC-4 | `auth.otp.test.ts` — "reports, calls the caller's error hook and raises … starts no cooldown" | pass |
| AC-5 | `auth.otp.test.ts` — "writes all four service records, each marked verified" | pass |
| AC-6 | `auth.otp.test.ts` — "releases the re-verification wait and clears the prompt marker" | pass |
| AC-7 | `auth.otp.test.ts` — "reports the guest-to-user mapping only when the id actually changed" + "does not report a mapping when the shopper was already this user" | pass |
| AC-8 | `auth.otp.test.ts` — "reports back whether the account already existed, and under what name" | pass |
| AC-9 | `auth.otp.test.ts` — "leaves a message and spends NO attempt when the user is unknown" | pass |
| AC-10 | `auth.otp.test.ts` — "spends an attempt and flags the failure on a wrong code" + "shows the refusal and raises" | pass |
| AC-11 | `auth.otp.test.ts` — "reports a failed verification with the flow it was opened from" | pass |
| AC-12 | `auth.otp.test.ts` — three tests: marks verified + mirrors + returns the token; fails WITHOUT marking verified on a data-less reply; carries the code and id to the call | pass |
| AC-13 | `auth.session.test.ts` — "attempts nothing at all while a logout is running" (×2, exchange and expiry) | pass |
| AC-14 | `auth.session.test.ts` — three tests over the result mapping | pass |
| AC-15 | `auth.session.test.ts` — "treats a network failure as eligible-but-not-refreshed" | pass |
| AC-16 | `auth.session.test.ts` — "asks for a plain exchange when it is given no request to name" + "names the request when it is given one" | pass |
| AC-17 | `auth.session.test.ts` — "ends the cycle without cancelling what the renewal just saved" + "sends the shopper's country and language" | pass |
| AC-18 | `auth.session.test.ts` — "does NOT release a re-verification that is already on screen" | pass |
| AC-19 | `auth.session.test.ts` — "arms the log-in-again prompt and keeps the phone for it" + "does not keep a placeholder phone" | pass |
| AC-20 | `auth.session.test.ts` — "cancels a guest session silently" + "skips the request entirely when asked to" | pass |
| AC-21 | `auth.session.test.ts` — "never replaces a re-verification that is already armed" | pass |
| AC-22 | `auth.session.test.ts` — "shares one cycle and hands both callers the same outcome" + "releases the cycle" + "restores the registering flag" | pass |
| AC-23 | `auth.profile.test.ts` — "writes the new name … before any request" + "leaves the rename in place when a service refuses it" | pass |
| AC-24 | `auth.profile.test.ts` — "writes both the shared state and that service's own copy" + "skips a leg the shopper has no record for" + "sends the picture path in the form each service expects" | pass |
| AC-25 | `auth.profile.test.ts` — "puts every completed leg back when a later one fails, and tells the shopper once" + "does not roll back a leg that never ran" | pass |
| AC-26 | `auth.profile.test.ts` — "looks up the missing service records before running the legs" | pass |
| AC-27 | `auth.profile.test.ts` — four tests over the path mapping, both directions, empty and already-in-form | pass |
| AC-28 | `auth.profile.test.ts` — "refuses to run when the upload is not configured" + "reports where the picture was stored" + "reports a failure rather than a picture" | pass |
| AC-29 | `auth.profile.test.ts` — "raises when a refused upload's reply cannot be read at all" | pass |
| AC-30 | `store/auth/reducer.test.ts` — four `cancelAuth` tests (expiry keeps and marks; plain clears; both reset the counter; an empty session stays empty) | pass |
| AC-31 | `store/auth/reducer.test.ts` — merge vs replace, plus the three other merge shapes | pass |
| AC-32 | `store/auth/reducer.test.ts` — "flags the failure and spends one attempt" + "keeps counting past zero" | pass |
| AC-33 | `store/auth/reducer.test.ts` — three notification-topic tests | pass |
| AC-34 | `store/auth/reducer.test.ts` — "updates the signed-in user but NOT the profile record" | pass |
| AC-35 | Inspection + `build`: every removal target was re-searched repo-wide at the moment of removal (4 write sites, 4 read sites, plus the five local items); the type check and the production build both pass, which is what catches a stale reference | pass |
| AC-36 | Inspection: a search of the six new test files for `loginChat`, `loginStories`, `EditPhoneFunc`, `normalizePhone`, `AuthState`, `ID-TOKEN`, `idToken` returns **nothing** | pass |
| AC-37 | Design + inspection: all three service test files install a recording `fetch` stand-in that raises on an unqueued call; the request-helper queue raises by default; the fake network remains the outer backstop with `onUnhandledRequest: "error"` | pass |
| AC-38 | Inspection: every state criterion above reads the state through the **real** auth reducer afterwards. No criterion is satisfied by "an action was called" | pass |
| AC-39 | The shuffled second run over the four new files (test-level shuffle), 68 tests passing | pass |
| AC-40 | `tests/services/authRefreshSession.test.ts` is untouched (absent from the diff) and passes inside the 664 | pass |
| AC-41 | Inspection: a case-insensitive search of the six new files for backend technology names returns **nothing** | pass |
| AC-42 | `implement.md > Findings` records fourteen findings; every behavioural one names the test that pins it (F-1→AC-4, F-2→AC-12, F-4→AC-12, F-5→AC-23, F-6→AC-34, F-7→AC-32, F-8→AC-29) | pass |

## Observability & runtime impact review (VF-9 / TR-3)

**Observability impact: no.** This repository owns no `observability/**` runtime
files (`features.observability: false` in `.claude/project-config.yaml`), and none
was created or modified. No protected runtime path was touched: `proxy.ts`,
`next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts` and
`.github/workflows/**` are all absent from the diff.

**Protected-path statement (TR-3).** `services/auth.ts` is the only protected glob
in the change set. Its edits are exactly the removals and the one reorder listed
in the approved `plan.md > Files to change`. Every test for it lives in the
`tests/services/` mirror; **no test file was added inside `services/`**.
`store/index.ts` was not modified — the auth slice is imported directly instead.

**Runtime impact.** No behaviour changes, with one stated exception recorded in
`implement.md`: removing the browser-storage write also removes the failure mode
where that write itself throws on blocked or full storage, so a shopper in that
state now completes a verification the server had already confirmed. The
direction is safe. Two hot paths get slightly lighter: two `localStorage` reads
come off the session check that runs on every page load, and one write comes off
sign-in. Nothing was done about values already in shoppers' browser storage, and
the ticket takes no dependency on the release process.

**Suite cost.** 68 new tests adding ~589 ms of test time across four files
(120 / 230 / 183 / 56 ms). No threshold is set — there is no CI to enforce one.

## Sign-off

- Outcome: **PASSED**
- Owner (self sign-off): developer, 2026-08-16
- Comprehension check: **4/4** at this gate (floor of 3 plus the mandatory
  integration question). Recorded in `comprehension.md > Verify gate`.

### Open item carried past this gate

**Review follow-up 11 is not done.** It asks that the encoding fix (finding F-4 —
the caller's code and verification id are interpolated into an auth query string
with no encoding) be filed as a tracked ticket with its id recorded in
`implement.md`. Filing in an external tracker is an outward-facing action and no
id was supplied, so it was left for the owner. It fails no acceptance criterion:
AC-42 requires a test and a written finding, and F-4 has both. It is recorded
here so closing this ticket does not bury it.
