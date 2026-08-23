---
ticket: auth-closeout-tests
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-23
links:
  clickup:
  github:
---

# Verify — auth-closeout-tests

Every `AC-n` validated at depth `all-ac` (VF-4). No implementation file was
edited and no commit was made here (VF-7 / VF-10).

## The live check really ran

`RECOV-01` was run against real staging — a real sign-in, a real one-time code,
the access credential deliberately spoiled, and the recovery watched.

```
pnpm e2e:health                          → staging health check passed
npx tsx tests/e2e/cli.ts run --skip-build --project=live \
    tests/e2e/session-recovery.live.spec.ts
  ✓ RECOV-01 a signed-in shopper survives a credential refused mid-action (1.2m)
  1 passed (1.3m)
```

The health check was run **first**, deliberately: it is what separates "staging
is down" from "the recovery is broken", and a red live check read without it is
not a finding.

**A correction worth recording.** Before this run I reported that the test
account was not configured and that AC-1..AC-5 could therefore not be verified.
That was wrong — the keys are in `.env.development`, and my check had a broken
pattern in it. Nothing was missing; I mis-read it. The criteria below are proved
by a real run, not by a skip.

## Acceptance criteria

| AC | Verdict | Evidence |
|---|---|---|
| AC-1 | **met** | `RECOV-01`, step "the action the shopper started still completes" — the cart read was answered by the core backend after the credential was refused |
| AC-2 | **met** | step "it is the same shopper, not a new guest" — the same account id before and after, and still phone-verified |
| AC-3 | **met** | step "the shopper was never asked to sign in again" — neither the session-expired prompt nor the phone-entry screen appeared |
| AC-4 | **met** | step "the credentials really were exchanged" (both rotated) and step "the replacement credential is still kept from page scripts" (`httpOnly` boolean off the jar) |
| AC-5 | **met** | the rotation poll sits between AC-1 and AC-2 and is compared against the **spoiled** snapshot; the identity is read only after it settles |
| AC-6 | **met** | `PersonalInfoForm.test.tsx` — 5 cases: empty name, short name, cleared phone, invalid e-mail (and empty e-mail accepted), missing gender, each with the message the screen really shows |
| AC-7 | **met** | same file — "takes the message away once the field it belongs to is fixed" |
| AC-8 | **met** | same file — 2 cases: the sign-in surface opens, nothing is saved, and no validation messages are shown because a guest never reaches them |
| AC-9 | **met** | same file — a changed number opens the re-verify step and does **not** save; an unchanged number saves directly |
| AC-10 | **met** | `VerifyUser.test.tsx` — Verified vs Verify Now, and the two branches behind Verify Now |
| AC-11 | **met** | same file — the overlay stands down for both global surfaces and **does not come back** when they clear |
| AC-12 | **met** | `UploadProfilePhoto.test.tsx` — choosing, removing, and the refused upload proved to have been *attempted* before its three outcomes are asserted |
| AC-13 | **met** | `index.test.tsx` — signed-in, guest, and all five placeholder values including the misspelled `verfied_guest` |
| AC-15 | **met** | `auth.profile.test.ts` — all eight mirrored fields by name, `image` by transformed value, and the one-time token asserted **absent** |

**14 of 14 met.**

## Validation profile `logic-change`

| Check | Result |
|---|---|
| `pnpm lint` | **0 errors**, 64 warnings — all pre-existing, none in the new files |
| `node_modules/.bin/tsc --noEmit` | **clean**, exit 0 |
| `pnpm test:run` | **57 files, 1468 tests, all passing** (1432 before; +36 is exactly what was added) |

Beyond the profile: `pnpm e2e:health` passed, and the live check ran green.
`pnpm lint:i18n-parity` was not run and is not required — no user-visible string
was added or changed anywhere in this work.

## Three checks were proved able to fail

Recorded because a criterion met by a check that cannot fail is not met at all.
Each was broken on purpose during `implement`, seen red with a message naming the
fault, and restored:

- **AC-11** — removing the reset effect from the verify control produced *"the
  settings overlay came back on its own once the global surface closed"*.
- **AC-12** — a stub returning a placeholder instead of a real data URL produced
  *"the upload was never attempted … check the editor stub returns a real data
  URL"* on **both** refused cases.
- **AC-15** — removing `gender` from the mirror, the original defect, produced
  *"`gender` was sent to the backends but the app's own stored copy still holds
  the old value"*.

Both application files were restored with `git checkout`; `git status` over
`app components services utils proxy.ts next.config.ts .github` returns **0
entries**.

## Did the plan's Integration surface hold?

**Yes, and it is checkable rather than asserted.** The plan declared: no
application file, no shared helper, no shared config, no protected runtime path;
one added sign-in against the shared staging account; the search backend in front
of AC-1; and an ordering constraint on the file name.

What the working tree actually contains:

```
 M docs/testing/AUTH_CLOSEOUT_PLAN.md
 M docs/testing/E2E_SCENARIOS.md
 M tests/services/auth.profile.test.ts
?? tests/components/setting/  tests/components/settings/
?? tests/e2e/session-recovery.live.spec.ts
?? _specs/auth-closeout-tests/
```

Exactly the declared list. No existing spec file was touched, so the line
citations in the case register stayed valid — which is why the register needed
only the new row, the count and the summary line.

The one prediction that could not be observed on a green run is the search-backend
dependency: the home page rendered, so the message that names search was never
exercised. It is written and unproven, and that is stated rather than implied.

## Findings

No new defect was found by this work. **Five** are recorded in
`docs/testing/AUTH_CLOSEOUT_PLAN.md > Findings`, none ticketed — one work item is
open at a time. The one this work confirmed with its own case is that a refused
profile-picture upload **tells the shopper nothing**; `UploadProfilePhoto.test.tsx`
pins that silence and says in its own message that whoever fixes it should replace
the case rather than delete it.

## Outstanding — one line, and it is not an `AC-n`

`tests/e2e/session-recovery.live.spec.ts:102` still carries its **`MEASURE ME`**
note, and the timeout is still the estimated `240_000`.

The measurement now exists: **1.2 minutes observed**, against an estimate of 240s.
The review's follow-up said the cap should then drop to measured-plus-margin —
roughly `150_000` — which buys back about 90 seconds of the shared 30-minute run
budget.

It was **not** applied here on purpose: `verify` may not edit an implementation
file (VF-7), and verification that fixes what it finds is not verification. It is
a one-line `implement` touch-up before the pull request, not a defect, and no
acceptance criterion depends on it.

## Outcome

**PASSED.** All 14 criteria met, every validation check green, the live criteria
proved by a real staging run rather than a skip, and the declared integration
surface held exactly.
