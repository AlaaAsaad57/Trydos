---
ticket: profile-closeout-scripted-and-live
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-25
branch: ticket/profile-closeout-scripted-and-live
links:
  clickup:
  github:
---

# Implement — profile-closeout-scripted-and-live

Branch `ticket/profile-closeout-scripted-and-live`, cut from `develop` (this
repository's base branch, overriding the framework default of `main`). **No
commit has been made** — the edits sit on the working tree, which is where
`implement` leaves them.

## Validation

| Check | Result |
|---|---|
| `tsc --noEmit` | **0 errors** |
| `pnpm lint` | **0 errors** (62 warnings, all pre-existing, none in changed files) |
| `pnpm test:run` | **1512 passed** |
| `pnpm e2e:preflight` | **passes, 12 staging addresses** (was 10) |

## What was changed, against the plan's declared list

Every file below is in `plan.md > Files to change`. Nothing outside it was
touched, and no application file was changed.

**Commit A — the target check.** `harness/env.ts` gains both media keys in
`BACKEND_ADDRESS_KEYS`, a `HTTPS_ONLY_KEYS` list and `hasMedia()`;
`harness/guard.ts` gains `media_server.ramaaz.dev` with the reason beside it and
an `https:` requirement for the browser-reached keys.

**Commit B — the session lift.** `harness/liveSession.ts` is new and holds five
helpers, each taking the state path **and the owning case's id**. Both live specs
import them instead of keeping copies. `PROF-04` gains `handOnSession()` and
loses `forgetSavedSession()`; `globalTeardown` removes the whole
`tests/e2e/.auth/` directory.

**Commit C — the harness and the faking layer.** `actions/mock.ts`: every
no-match path is `route.fallback()`; both helpers return recorders (matched map
keys / responses consumed); the media and ticket patterns are added with CORS and
a preflight answer; `closeUnnamedCalls` is the context-level guard.
`harness/profileWrites.ts`: `carriedExpected` computed inside the listener with
only the boolean surviving, a separate `asked` store fed by `request`, and
`reset()` clearing both. `scenarios/index.ts`, `selectors.ts`,
`actions/profile.ts` and `harness/redact.ts` as planned.

**Commit D — the cases, config and documents.** `profile.scripted.spec.ts` is new
with `SCRIPT-06..12`; `PROF-05..07` are added to `profile.live.spec.ts`;
`playwright.config.ts` gains `serviceWorkers: "block"` on the scripted project and
a corrected head comment; the three documents are updated (64 cases, a new
scripted-profile section with its own preamble, the corrected `SCRIPT-` summary
row, the run cost, rule 7's exception and its stale sentence, the accepted drift,
Item F delivered and Item B recorded as half delivered).

## Measured, not assumed

**The session lift is neutral.** Full live project after Commit B:

```
✓ PROF-01  ✓ PROF-02  ✓ PROF-03  ✓ PROF-04  ✓ RECOV-01
48 passed, 1 failed — 8.4 min
```

The one failure is `AUTH-01` on the wallet backend — its known pre-existing state,
which the plan says stays red.

**The wall-clock question is answered.** The live project takes **8.4 minutes**
against a usable budget of roughly 27. There is real headroom, and no
`globalTimeout` raise is needed — which is the outcome the plan predicted.

**Both media keys resolve to one host over https**, so Commit A's
highest-blast-radius risk (a wrong entry stopping all 64 cases) did not
materialise, and preflight confirms it.

**`route.fallback()` is safe for `SCRIPT-01..05`.** The spike measured it offline;
the real run confirms it — all five still pass.

## The report-only pass (plan step 10)

**No call was ever refused by the guard**, across eight runs and every case. The
closed-mode machinery did not misfire once, and no unnamed write reached staging.
The policy in `plan.md` needs no additions from what has run.

## Result — all ten new cases pass

**Scripted (`profile.scripted.spec.ts`): 11 passed, 0 failed.** `SCRIPT-01..05`
untouched and green, which is the running proof that the `route.fallback()`
change is safe; `SCRIPT-07..12` all pass.

**Live (`profile.live.spec.ts`): `PROF-05`, `PROF-06`, `PROF-07` all pass**, on
top of the existing `PROF-01..04`.

`SCRIPT-07` (rollback) and `SCRIPT-10` (a credential refused mid-save, told apart
from a rollback by the value the second write carried) are the two branches this
ticket exists for. `SCRIPT-10`'s mechanism is the one `profileWrites.ts` had
removed as unworkable and that two review rounds argued about. It works.

**The guard never refused a call** across every run. No unnamed write reached
staging, and the policy in `plan.md` needed no additions.

## Two red cases, both in `auth.live.spec.ts`, neither caused here

- **`AUTH-01`** — the wallet backend. Its known pre-existing state; the plan says
  it stays red and that turning it green is not a success.
- **`AUTH-03`** — *"the saved session is not signed in, so there is nothing to
  sign out of."* **Pre-existing and intermittent.** `auth.live.spec.ts` never
  hands its session on: `AUTH-01` saves one snapshot at line 134, and `AUTH-02`
  and `AUTH-03` each open that same ageing copy. `AUTH-02` opens the cart, which
  can make the app exchange the credential and rotate the pair server-side —
  which is exactly the failure `handOnSession` was written for and which
  `profile.live.spec.ts` documents at length. That file never adopted it, before
  or after this change. It passed earlier in the same session, so it bites only
  when `AUTH-02`'s activity actually triggers an exchange.

  **Not fixed here.** It is a sibling fault outside this plan's declared change,
  and this repository requires a bug to be confirmed by its own test before it is
  fixed. The one-line remedy is now available to it — `handOnSession` is exported
  from `harness/liveSession.ts` — so the follow-up is small.

## What the runs taught, and what only reading could tell

Roughly a dozen staging runs. The honest lesson is that too many of them were
spent learning things the source already stated:

- **Emergent, and genuinely needed a run:** route precedence and `fallback()`
  crossing from page to context (the spike); a shared session ageing out mid-run;
  the per-number one-time-code cooldown; that a locale prefix is read off the
  address.
- **Readable, and should not have cost a run:** which marker actually renders,
  what a click handler does, what a screen shows when a flag is set. Three
  markers in `AddAddressForm.tsx` are written as props on components that never
  spread them (`add-address-buttons`, `select-region`) — present in source, absent
  from the DOM. A fourth, `Firstly-Search-Result`, is on **two lists that behave
  oppositely**: a province drills a level deeper, a leaf sets the region and
  closes the picker. Grep cannot distinguish any of that; reading the component
  can.

Every diagnosis that came from reading the component was right first time. Every
one that came from re-running was not.

## Deviations from the plan, and why

1. **The guard is installed after the page has loaded.** The plan requires it
   before the fakes, which holds. Installing it before navigation would police the
   page's own load traffic, which is not the branch under test.
2. **`SCRIPT-06` was removed.** With no shared session there is nothing for it to
   create, and `C-9` is satisfied absolutely rather than by convention.
3. **Six sign-ins instead of one**, alternating identities — the owner's decision,
   recorded with its cost in `README.md` (15 sends per run, not 10).
4. **`SCRIPT-08` reads the account's own `/api/auth/me` and nulls one field**,
   rather than using a fixture, so nothing synthetic reaches the real account.
5. **The unit count is 1512, not the 1499 the plan quotes.** The suite grew; nothing
   here changed it.

## Not yet done

- `SCRIPT-12`, above.
- `PROF-05..07` have never been run — they need the live project, and the live run
  in this session predates them.
- A final full-suite run across both projects.
