---
ticket: profile-closeout-scripted-and-live
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: in_progress     # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-24
links:
  clickup:
  github:
---

# Intake — profile-closeout-scripted-and-live

> First stage. Qualify the request only. **No technical planning allowed.**
>
> This file is longer than an intake usually is, on purpose. The source plan was
> written before two of its own findings were fixed, so a short intake would send
> `research` and `review` back over ground that is already settled. Everything
> below is a checked fact with the file, line or commit it came from. Where
> something is not known, it says so and is listed under **Missing Information**.

## Ticket Reference

`profile-closeout-scripted-and-live`. No ClickUp task and no GitHub issue.

The source is `docs/testing/AUTH_CLOSEOUT_PLAN.md` — **Item B** (the scripted
profile branches) and **Item F** (the picture and the address, live). That file
is committed and is the authority for what these two items owe.

## Ticket Summary

Write the profile cases that cannot run against a healthy staging backend
(`tests/e2e/profile.scripted.spec.ts`), and the two live cases Item A named and
did not deliver — the profile picture and the address. Finishing both closes
Journey 2 ("sign in and stay signed in") at every layer.

## Ticket Metadata

- id / slug: `profile-closeout-scripted-and-live`
- title: Close the profile journey: scripted failure branches, and the picture and address live
- owner: developer
- created: 2026-08-24
- links: none

## User Story

> As a shopper changing my own details, I want the app to behave correctly when
> one of the backends behind it refuses, so that a half-finished save never
> leaves me looking at a change that did not happen — and as the person keeping
> this app running, I want those branches proved rather than assumed.

## Acceptance Criteria Presence Check

- Present? **no** — not as `AC-n`. That is `spec`'s job and this stage may not
  do it.
- Notes: the raw material is unusually complete. `AUTH_CLOSEOUT_PLAN.md` gives
  Item B six named cases in a table with the reason each cannot run live, and
  Item F three. `spec` has to turn nine cases into `AC-n` and decide which
  survive contact with the constraints in **Constraints** below — it does not
  have to discover them.

## Test Cases Presence Check

- Present? **yes** — nine, named in the source plan.

**Item B — scripted** (`AUTH_CLOSEOUT_PLAN.md` § Item B):

| # | Case | Why it cannot be live |
|---|---|---|
| B-1 | A leg refuses (stories answers 500) → completed legs are put back, and the shopper is told **once** | staging will not fail on request |
| B-2 | A leg the shopper has no record for is skipped, and skipping is not a failure | needs an account with a missing service record |
| B-3 | The media upload is refused → **no** profile write follows | staging accepts uploads |
| B-4 | Saving with a changed number → the overlay appears, and the save that follows carries the `id_token` from `VerifyOtpForUpdatePhone` | needs a second real number and a real code |
| B-5 | The credential is refused mid-save → the exchange runs and the save completes | timing cannot be arranged live |
| B-6 | The exchange itself is refused → the sign-in-again prompt is armed, with the phone kept | staging will not refuse on request |

**Item F — live** (`AUTH_CLOSEOUT_PLAN.md` § Item F):

| # | Case |
|---|---|
| F-1 | Choose a picture, save, reload, it is the one chosen — then remove it and reload again, so the case restores what it found |
| F-2 | The profile card links to the picture page (`selectors.ts` `profile.card` matches the info link only, on purpose) |
| F-3 | Add an address, see it listed, remove it — `components/settings/PersonalInfoAddress.tsx` and `PersonalInfoAddressModal.tsx`, both confirmed present |

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no**
- Is the goal to *choose between options*? **no**
- Is the change to make already known, leaving only building it? **yes** — nine
  named cases in a committed plan.

It edits files under `tests/e2e/`, so it is `development` and it cuts a branch.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — (no ClickUp task) |
| Argument said | `development` |

No disagreement to record.

## What has changed since the source plan was written

**Read this before `research`. Four of the plan's statements are now out of
date, and three of them shrink this ticket.**

**1. Item B no longer carries an application fix. It is test-only.**
The plan says: *"This item carries an app fix… the rollback case is written
first, seen red, then `services/auth.ts` is changed."* That fix is **done and
merged**, and it was not done here — the defect turned out to be reproducible
with no backend at all, so it was proved and fixed in the unit suite instead.

- Commit `6f08a4ee`, on `develop` and `main`.
- Confirming test: `tests/services/auth.profile.test.ts` → *"puts the OLD value
  into the shopper's own copies when a leg is rolled back (AC-25)"*.
- It was **seen red first** — `expected 'Ada' to be 'old'` on the chat copy in
  the store — and green after. Suite 1469/1469 at the time.
- The fix: `revertChat` reads `userProfile`, not `userObj`.

This matters for scope. The plan's own reason for keeping B and F as two tickets
was *"B is its own ticket because it carries the rollback-mirror fix."* That
reason is gone, so they are one work item here — same surface, same harness lift,
both test-only. Anyone re-reading the plan will expect two tickets; this is why
there is one.

**2. One of the five open planning findings is fixed, and must not be re-raised.**
*"Removing a profile picture leaves the old one in the stored copy"* — fixed in
commit `189e4627`, proved red-first by
`tests/services/auth.profile.test.ts` → *"clears the picture in the shopper's own
copy when the picture is removed (AC-24)"* (`expected '/customers/profile/ada.png'
to be null`). Two green regression guards went in beside it, covering a cleared
e-mail and alternative phone, and a field a save never mentioned.

`gender`, `email` and `alternative_phone` were checked at the same time and are
**not** affected: `UploadProfilePhoto.tsx:156` is the only caller that ever
passes `null`, and clearing a text field sends `""`, which `??` already handles.
That question is closed; do not reopen it.

**3. The address-boundary question is resolved, and the answer is "no conflict".**
The plan says: *"Decide the boundary before writing the address case…
`LIVE_TEST_ROADMAP.md` phase 15 (`live-addresses`) owns the customer address
endpoints at the request level."*

**That suite does not exist.** There is no `tests/live/` directory and no
`test:live` script in `package.json` — checked 2026-08-24. `LIVE_TEST_ROADMAP.md`
describes a Vitest-based live suite that was never built and was superseded by
the Playwright browser suite. So phase 15 is not being written, there is no
second suite to collide with, and **F-3 owns the address ground outright**. No
decision is owed.

**4. `revertMarket` is a new finding, recorded and deliberately not fixed.**
It carries the same defect the chat rollback did, and it is **unreachable**: the
legs run stories → chat → market, so `market_done` is only ever true on the path
that returns, and nothing between it and the `return` can raise
(`updateSecureUserData` swallows every error and is not awaited). Fixing dead
code is out of scope and a test for it would have no caller. Whether the block is
deleted, or whether the leg order is what should change, is its own decision and
is **not** this ticket's. It is written up in `AUTH_CLOSEOUT_PLAN.md` § Findings.

## Constraints that bound what can be tested

These are hard limits, not preferences. They decide which of the nine cases are
writable at all, and `spec` should treat a case that collides with one as a case
to re-cut, not to force.

**1. `page.route()` only sees the browser's own calls.** Anything rendered
through `serverRequests/HandleAuthedFetch.ts` happened in Node before the HTML
arrived. A scripted spec can change what happens **after a click**, never what
the page was rendered with. (`AUTH_CLOSEOUT_PLAN.md` § Which suite gets which
case.)

**2. Sending a one-time code cannot be faked.** `/api/proxy` deliberately blocks
`/auth/phone/send_otp`, so the app sends it through the `"use server"` action
`serverActions/sendOtp.ts`, which the browser never sees. Faking the action means
hand-building an RSC payload. A scripted auth spec therefore lets the **real**
send happen and fakes the verify — which is also the honest reason a *scripted*
spec still needs staging up. This is written at the top of
`tests/e2e/scenarios/index.ts` and that note is authoritative.

**3. B-4 is the case most at risk from the two above.** It needs a second real
number and a real code. The plan itself lists that under "why it cannot be live",
but a real send cannot be faked either, so `research` must establish whether B-4
is writable at all with the identities configured, or whether it splits into a
scripted half and an unwritable half. **Do not assume it is writable.**

**4. Live specs mutate a shared account.** `workers: 1`, `retries: 0`, and every
write must restore itself — at the moment it is created, not after the
assertions, so a failed assertion still cleans up (`tests/e2e/README.md` rule 6).

**5. Reads may retry. Writes never.** `retries: 0` is in the config because a
retried write is a duplicated write.

**6. One login per identity per run.** The one-time-code send is rate limited for
real. The session is created once in global setup and shared.

**7. The browser suite never gates a pull request.** It runs on push to `develop`
and `main`, and nightly. So any application defect this ticket finds is
**unguarded by CI** unless a unit test is added for it — which is exactly how the
two fixes above ended up in `tests/`, not `tests/e2e/`. Expect the same answer
again.

**8. Nothing may print a credential.** No token, one-time code, phone number,
e-mail or password may appear in an assertion message, a failure diff, or any
kept artifact. `harness/redact.ts` masks them; use it on anything printed. This
repository is public and CI artifacts are world-readable.

**9. Artifacts differ by spec kind.** `*.live.spec.ts` records **nothing**;
`*.scripted.spec.ts` records traces and video on failure. That split is a
security rule, not a preference — a trace archives every request header, which is
the auth token.

**10. A backend fault stays red.** If a step fails because a backend answered
wrongly, refused, or lost a write, the test **stays red** and names the backend,
quoting what it said. It may not be skipped, `fixme`'d, wrapped in a `try`,
loosened, retried, or narrowed. Only a **missing setting** may skip — "the
backend is unreachable" and "the backend is wrong" are different findings.

**11. Unset means skip, never fail.** Someone with no staging credentials
configured must still get a clean run.

## Open findings this work item will meet

**Both application defects that sat in this ticket's path were fixed on
2026-08-24, before `research`, by the owner's instruction. They are no longer
this ticket's to confirm.** What changes is what B-3 and B-4 assert: they now
prove the **fixed** behaviour rather than discovering the broken one.

- **A refused profile-picture upload told the shopper nothing — FIXED.** The
  screen now records the refusal and shows `"File upload failed."`. Proved by
  `tests/components/settings/UploadProfilePhoto.test.tsx` -> "tells the shopper
  the upload failed", seen red first. **B-3 must now assert the message appears**
  and that no profile write follows — not that nothing happens.
- **`id_token` reached a kept artifact — FIXED, and it was two leaks.** The body
  carried `id_token`; the *address* carried the one-time code
  (`/auth/login?...&otp=`), which the original finding missed. Both are scrubbed
  in `utils/fetchData.ts`. Proved by `tests/utils/fetchData.test.ts` -> "never
  sends a credential from the request body to the error reporter", seen red
  first. **B-4 no longer carries a security fix**; it asserts the overlay and
  the `id_token` on the outgoing save, and nothing about Sentry.

Two findings remain open and are **out of scope** — both live on the one-time-code
send path, not the profile: the cooldown text reaching the public job log
unredacted, and the exhausted-retry message naming nothing.

**This ticket now carries no known application change.** If B-1, B-2, B-5 or B-6
turns up a new defect, the four-step rule applies as normal and the proving test
goes in the unit suite.

**Also open, and not a defect this ticket may fix silently:**
`components/global/NextLink.tsx` declares `ariaLabel`, destructures it, and never
puts it on the `<Link>`. All **22** call sites that pass it get an unlabelled
link. `selectors.ts` finds the profile card by `href` as a documented workaround.
**Case F-2 adds a second link and will meet this.** The decision on whether
`NextLink` should render the label is open and belongs to the owner, not to this
ticket.

## What is already built, and must be reused rather than rewritten

Item A left a harness behind. `research` should confirm each still exists rather
than re-deriving it, and `plan` must not duplicate any of it.

| Exists | Where |
|---|---|
| `recordProfileWrites`, `PROFILE_LEGS`, `ProfileLeg` / `LegWrite` / `LegOutcome` | `tests/e2e/harness/profileWrites.ts` |
| `snapshotCredentials`, `credentialsChangedSince`, `credentialsHeld`, `spoilCredentials`, `recordAuthCalls`, `recordSignInOutcome` | `tests/e2e/harness/session.ts` |
| `attemptAuth`, `currentAuthScreen`, `signedInSession`, `whoAmI`, `whoAmIWhenReady` | `tests/e2e/actions/auth.ts` |
| 25 profile page actions incl. `attemptSave`, `readGender`, `typeEmail`, `attemptSizeSave` | `tests/e2e/actions/profile.ts` |
| `mockBackend`, `MockMap`, `ENDPOINTS` | `tests/e2e/actions/mock.ts`, `tests/e2e/scenarios/index.ts` |

`recordProfileWrites` already tells a `401` retry apart from a rollback, by
reading whether the outgoing body carried the new value, and it judges the
**settled** write rather than the first one. B-1 needs exactly this and should
not reimplement it.

**One thing that must be lifted, and copying is explicitly not acceptable.**
`SIGNED_IN_STATE`, `forgetSavedSession`, `newLiveContext` and `handOnSession` are
still `const`s local to `profile.live.spec.ts:133–223` — confirmed 2026-08-24,
not exported. The plan says the first of B, C or F to need a saved session lifts
all four into `tests/e2e/harness/session.ts` and repoints Item A at them. Item C
shipped without needing them, so **this ticket is the first**, and the lift is
owed. `handOnSession` is the fix for a real trap: a shared `storageState` file
goes stale the moment one case makes the app exchange a refused credential, and
the next case opens as a **guest** and reports the account's details as simply
missing. Two copies of that logic will drift, and the drift is invisible.

## Facts about the shared test account

Neither is a defect. Both change what a case may assert.

- The account carries **no e-mail**. The existing e-mail case sets one and clears
  it again.
- A **size cannot be cleared** once set, because the form makes both fields
  required. `PROF-04` leaves what it creates and records that in a run
  annotation. The drift is one-time; later runs restore what they find.

## One assertion this ticket is expected to prove

`PROF-02` asserts that no leg was rolled back, and **no run has ever seen that
assertion go red** — staging accepted all three legs every time. It is written
but unproven. Case B-1 is what makes a leg fail on purpose, and proving that the
rollback branch is really watched is a deliverable of this ticket, not a
side-effect.

## Cost and risk of a run

- **One-time codes are rate limited for real.** A cooldown retry costs more than
  one. B-4, if it survives `research`, needs a **second** real number.
- Live cases write to the shared staging account and must restore what they
  change.
- Nothing here touches a protected runtime path. `proxy.ts`, `next.config.ts`,
  `instrumentation*`, `sentry.*.config.ts` and `.github/workflows/**` are all
  untouched by both items. **If a confirmed application fix is needed for B-3 or
  B-4, it lands in `services/auth.ts` or a profile component — neither is a
  protected runtime path in this repository.**

## Missing Information

**All four questions opened at intake were answered on 2026-08-24, before
`research`, and the one decision they produced was made by the owner the same
day. They are kept here with their answers so no later stage re-opens them.
Nothing in this section is outstanding.**

### Q1 — Is B-4 writable? **YES.** Answered.

Both identities are configured and the code does not have to be read from an
SMS:

| Check | Result |
|---|---|
| `TEST_ACCOUNT_PHONE` configured | yes |
| `TEST_ACCOUNT_PHONE_2` configured | yes, and different from the first |
| `TEST_ACCOUNT_OTP` configured | yes, 6 digits |
| Both numbers in `OTP_TEST_PHONES` | yes — the allowlist holds exactly these two |

The decisive detail is in `tests/e2e/harness/env.ts:137-141`: `hasShopperA()` is
`TEST_ACCOUNT_PHONE` + `TEST_ACCOUNT_OTP`, and `hasShopperB()` is
`TEST_ACCOUNT_PHONE_2` + **the same** `TEST_ACCOUNT_OTP`. The code is a shared
static value for allow-listed numbers. So Constraint 2 (a send cannot be faked)
does **not** block B-4: the real send happens, and the code is already known.

*(No value is recorded here. Presence and membership were checked without
printing either number or the code.)*

### Q2 — How to give a shopper a missing service record for B-2? **Answered.**

It is scriptable. `getServiceUsersFromCookies()` calls `fetchAuthMe()`, and
`utils/authMe.ts:18` is a plain browser `fetch("/api/auth/me")`. `page.route()`
sees it, so the record can be removed by answering with `chatUser: null`.

**One trap, and it decides where the route is installed.** `UpdateProfile` reads
`effectiveUserChat = userChat ?? chatUserFromCookies`, and `userChat` comes from
`useAppStore.getState()` (`services/auth.ts:602-613`), which is hydrated at page
load from that same endpoint. Faking the call only at save time leaves the store
copy populated and the leg still runs. **The route must be installed before
navigation**, so hydration and the in-flight lookup both see `null`.

### Q3 — Can B-5 and B-6 be arranged through `page.route()` alone? **YES.** Both.

`RefreshSession` is a browser `fetch("/api/auth/refresh")`
(`services/auth.ts:477`), so the exchange is visible to `page.route()` just as
the write is.

- **B-5** — refuse the profile write on `/api/proxy` with a `401`, let
  `/api/auth/refresh` reach the real backend, and let the retry succeed.
- **B-6** — refuse the write, then refuse `/api/auth/refresh` as well.

Neither needs a new harness. `recordProfileWrites` already tells a `401` retry
apart from a rollback, which is what keeps B-5 from being misread as B-1.

### Q4 — Has `RECOV-01` had its first staging run? **YES, and it passed.**

Run `32731077445`, 2026-08-24, `RECOV-01 a signed-in shopper survives a
credential refused mid-action` — ✓ in 46.1s. The plan's "awaiting its first
staging run" is stale. This ticket does not inherit an unproven neighbour.

**The same run answered a question nobody asked.** The suite is **53 passed, 1
failed**, staging confirmed up by the workflow's own recheck. The single failure
is `AUTH-01`:

> `Error: the wallet sign-in did not land (the app reported WALLET)`

That is a **backend fault**, and it is behaving exactly as the rules require: the
app labelled the failing leg itself through `is_failed`, and the test quoted that
label rather than inferring it. Under `AUTH_CLOSEOUT_PLAN.md` § "A backend fault
stays red" it **must stay red** until the wallet backend is fixed. It is **not**
this ticket's to fix, silence, or work around.

It does not block this ticket. The wallet leg of `UpdateProfile` is commented out
(`services/auth.ts`, the block above the stories call) and `wallet_done` stays
`false`, so the profile fan-out has three legs — core, stories, chat — and none
of them is wallet. All four `PROF-` cases passed in the same run.

### The one decision that was owed — **MADE by the owner, 2026-08-24**

**Question.** What number does B-4 change the phone to, given that a real change
moves the shared account and is not obviously reversible?

**Decision.** **B-4 is scripted end to end. The phone change is never allowed to
land.**

**The owner's reason, and it is the decisive fact:** *both* configured numbers
already have accounts. So a real phone change is a duplicate, the backend refuses
it, and **there is no happy path to observe live** — the live version of this
case could only ever watch a refusal. Scripting it is not a convenience, it is
the only way the case can assert what it exists to assert.

**What this settles:**

- `TEST_ACCOUNT_PHONE_2` is now **safe** to use as the "new" number. The earlier
  worry — that moving it onto shopper A would collapse two identities into one —
  cannot happen, because the save that would move it is faked. The number is used
  only to make the form see a *changed*, allow-listed value.
- The shared account is never mutated by B-4, so the restore problem disappears
  and Constraint 4 is satisfied trivially.

**What B-4 will prove:**

1. Changing the number opens the change-number overlay **instead of** saving.
2. The save that follows carries the `id_token` from `VerifyOtpForUpdatePhone`.

**What B-4 will NOT prove, and this must be said in `spec` rather than implied:**
that a backend accepts a phone change and the new number really becomes the
account's. **That criterion is not covered by this ticket and cannot be, with the
identities available.** Both numbers are taken, so there is no number to move to.
Recording it as uncovered is required — `CLAUDE.md` § Testing forbids letting a
green tick stand in for a case the suite cannot see.

**One real cost that survives.** The overlay triggers the code send itself, and a
send cannot be intercepted (Constraint 2), so B-4 fires **one real one-time code
per run** to `TEST_ACCOUNT_PHONE_2`. The number is allow-listed and the code is
the shared static value, so nothing has to read an SMS — but it counts against
the real rate limit and `spec` should budget it alongside the sign-in code.

## Readiness Status

`READY` — with every intake question answered and the one open decision made.

- **Justification.** The work is nine named cases from a committed plan, on a
  surface whose harness is already built and confirmed present. The four
  statements in the plan that had gone stale are corrected above with commits and
  file references, so `research` does not have to rediscover them and `review`
  does not have to send the ticket back over them. The four genuinely open
  questions are listed, are all `research`-answerable, and none of them prevents
  `research` from starting — the worst case is that B-4 is re-cut in `spec`,
  which is the stage that exists to do exactly that.
- **Nothing is outstanding at this stage.** The four questions raised when this
  intake was first written were answered the same day (see **Missing
  Information**), and the single decision they produced — how B-4 handles the
  phone change — was made by the owner. `research` starts with no open question
  of its own to inherit.
- **What would make this NOT READY.** If Item B's application fix were still
  outstanding, this ticket would carry a change to `services/auth.ts` with no
  decision recorded, and it would not be ready. It is not outstanding; commit
  `6f08a4ee` closed it and the test that proved it is in the suite that gates
  pull requests.
