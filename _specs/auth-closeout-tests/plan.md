---
ticket: auth-closeout-tests
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-23
links:
  clickup:
  github:
---

# Plan — auth-closeout-tests

> Decide the approach before changing code. Plan only — no implementation here.
>
> **Revision (PL-7)** after `changes_requested` at `review` round 3. Round 2's
> seven `major`s were scaffolding and were removed. Round 3 found two, both on
> AC-12, and both the same species: a check that could report "pass" for a case
> it cannot see. Those are answered below.

## Approach

Write three pieces of coverage. Change **no application file**, and change **no
existing test file except one**.

1. **Item C** — a live check that a signed-in shopper whose credential is refused
   mid-action is recovered as the same shopper.
2. **Item D** — four profile screens, in the unit suite, with no network.
3. **Item E** — one guard on the profile mirror, in the suite that gates every
   pull request.

**What this plan no longer does, and why.** Two earlier drafts began by lifting
shared session helpers into a harness module and by adding an option to the
shared sign-in action. Neither is needed by any acceptance criterion:

- The recovery check **signs in itself and saves no session**, so it needs no
  `storageState` and can take the ordinary `{ page }` fixture — exactly as
  `session.live.spec.ts` does. The live project already supplies `baseURL`,
  `locale`, `video` and both timeouts.
- `test.setTimeout()` **already** aborts the test while the one-time-code send is
  sleeping a cooldown, so the retry budget is bounded without touching the shared
  action; `test.step()` is what names the leg that stalled.

Dropping both removes every edit to a currently-green spec, removes the only
change to a helper three specs call, and makes this item revert as pure
addition. Three further findings existed only because those steps did.

**No red-first work is owed.** That discipline applies to a fix, and this item
fixes nothing. Item E's guard is the one green-from-birth case `spec.md` allows —
it holds a fix PROF-03 already proved.

## Steps

1. **Write the live recovery check** — `RECOV-01`, AC-1..AC-5, each criterion its
   own `test.step()`.
2. **Write the four profile screen checks** (AC-6..AC-13).
3. **Add the mirror parity guard** (AC-15).
4. **Update the two tracked docs** in the same commits as the work they describe.
5. Run the unit suite, lint, typecheck. Run the new live check by hand, record
   what it said, and write its measured wall clock into its own comment.

## Files to change

**Application: none.**

**New tests:**

- `tests/e2e/session-recovery.live.spec.ts` — AC-1..AC-5.
- `tests/components/setting/profile/PersonalInfoForm.test.tsx` — AC-6..AC-9.
- `tests/components/setting/profile/VerifyUser.test.tsx` — AC-10, AC-11.
- `tests/components/setting/profile/index.test.tsx` — AC-13.
- `tests/components/settings/UploadProfilePhoto.test.tsx` — AC-12.

**Existing tests — one file only:**

- `tests/services/auth.profile.test.ts` — one added check, AC-15.

**Tracked docs:**

- `docs/testing/E2E_SCENARIOS.md` — a new section and one row, `RECOV-01`. One
  row for a five-criterion case is how the register already works (`AUTH-02` and
  `PROF-03` are each one row over several criteria). `AUTH`, `GUEST`, `PROF` and
  `SCRIPT` are taken; the guest credential cases carry no prefix and giving them
  one is **not** this item's job.

  It has two invariants beyond the rows: **the header count** ("53 of them
  today … keep the count above in step") goes to 54, and the **per-section
  summary table** gains a row — signs in: yes, a third real code per run; writes
  to staging: no. A new section alone leaves both stale.

  Every row cites `spec.ts:<line>`, so the citations are written when the spec is.
- `docs/testing/AUTH_CLOSEOUT_PLAN.md` — Item C's state in the "Where this
  stands" table.

**Deliberately NOT touched**, each for a stated reason:

| File | Why not |
|---|---|
| `tests/e2e/actions/auth.ts` | The retry budget is already bounded by `test.setTimeout()`. Editing it would reach three spec files, including `auth.scripted.spec.ts` — the one consumer that runs without staging. |
| `tests/e2e/profile.live.spec.ts`, `auth.live.spec.ts` | Nothing is lifted out of them, so their line citations in the case register stay valid. |
| `tests/e2e/session.live.spec.ts` | Nothing is imported from it. Importing a spec re-registers its `test()` calls against the importing file and would run its three live journeys twice per run. |
| `playwright.config.ts` | `globalTimeout` is shared by every live spec, and the end-to-end CI job caps itself at 45 minutes including the build. `.github/workflows/**` is a protected runtime path this plan may not touch, so the shared cap is never raised — see Live timing for the real lever. |

## Integration surface

- **Components / shared config touched:** none. No application file, no shared
  helper, no shared config, no protected runtime path.
- **Who else depends on what this adds:** nothing. Every new file is new, and the
  one existing test file gains a check inside its own `describe`, under that
  file's existing file-level fake-timer rule.
- **What it shares with other work anyway:** the **shared staging account**. Two
  live specs already sign in for real; this adds a third one-time code per run,
  against one number and one rate limit. It also spends part of the single
  30-minute budget the whole live run has.
- **The search backend sits in front of AC-1.** The cart control is not clickable
  on the static page the sign-in uses, so this spec navigates to the home page
  first — which puts it behind search, a known way for the whole document to come
  back blank. That navigation is in the written timing sum, and **a failure
  before the cart names the search backend**, so it is not read as a recovery
  failure.
- **The recovery leg is the core backend.** For a verified shopper the credential
  exchange goes to the **core** backend, not the gateway the guest cases
  exercise. The shared action this spec calls says only "never produced an answer
  from a backend" — so the core backend is named in **this spec's own step titles
  and messages**. The shared action is not edited; `AUTH-02` depends on it.
- **Ordering.** The spec spoils and rotates credentials for the shared account.
  It signs in itself and hands nothing on, so it cannot supersede another spec's
  saved session mid-run — but it must not be renamed to sort before
  `auth.live.spec.ts` or `profile.live.spec.ts`, which is recorded here so a
  rename is not a silent breakage.
- **What breaks if this is wrong:** a spec that spoils the wrong credential burns
  a real sign-in on a guaranteed red every run (see below); one that overruns its
  timeout eats a shared 30-minute budget and can take the whole run's report with
  it.

## Proving AC-1 — and what may be spoiled

**Only the access credential is spoiled.** `spoilCredentials` takes a name list.
Spoiling **both** cannot recover a signed-in session — a refused pair is not
re-registered for a verified shopper, the app asks them to sign in again — so the
case would burn a full real sign-in and a poll on a guaranteed red every night.
The refresh credential stays intact; that is what makes this a recovery.

**AC-1 uses `openCartAndProveBackendAnswered`** (`tests/e2e/actions/auth.ts:719`),
which reads the backend's answer. `AUTH-02` already uses it. The guest spec's
`openCartAndSettle` proves the credentials **rotated** — that is AC-4, not AC-1 —
and using it for both would leave AC-1 unproven while looking covered.

**AC-1 and AC-2 stay in one case, in that order, and AC-1 never stands alone.** A
cart `200` can be answered for a freshly registered guest, so AC-1 alone can go
green as somebody else. AC-2 — the same user id as before — is what closes it.

**AC-4/AC-5** use a short rotation poll written inline, with its own named
timeout. It goes through **`snapshotCredentials` and `credentialsChangedSince`
and asserts on the two booleans only** — no cookie value is read in the spec
file, or a failing comparison would print a live token into a public job log.
That is what `harness/session.ts` exists to make impossible.

**AC-4's proof is the comparison against the *spoiled* snapshot**, never the
original: the test spoiled the access credential itself, so comparing against the
original is trivially true. The guest spec records that mistake as having made one
case intermittently red — and, in the other direction, as something that would
have made an "identity unchanged" case quietly green. AC-5 exists for that.

## Live timing

**Anchored on observed wall clock, not on a sum of caps.** `auth.live.spec.ts`
performs the same full real sign-in today with **no** `test.setTimeout()` at all
— inside the 120s default. Caps are what the app is *allowed* to take, not what
it takes; sizing off them (~400s, ~650s with a cooldown) would reserve up to a
third of the entire run budget for one test.

So: **`test.setTimeout()` ≈ 240s** — an observed sign-in under 120s, plus the
cart poll and the rotation poll, plus headroom. The cap arithmetic goes in the
comment as the worst case, not as the number.

The sign-in and the recovery are separate `test.step()`s with their own
timeouts, so a stall names the leg. **The measured duration is written into that
comment on the first real run**, because the CI log expires and the results file
is gitignored — otherwise the next reader cannot redo this check.

**"Trim the spec" is not the lever** — nearly all of the 240s is the sign-in plus
the two polls, and none of those shortens without dropping a criterion. The real
lever is step 5: **measure the run, then drop the cap to the measured number plus
margin.** That is what buys the headroom back. The shared cap is never raised.

**Budget ~5 minutes for a cooldown night, not 4.** `test.setTimeout()` does end
the test while the send is sleeping — the timer is not interruptible, but the
worker is torn down and the timer dies with it. The cost is that a cooldown burns
the **full** 240s deterministically, then pays a worker restart and a fresh
browser launch. This is the third real code send of a run, so it is the most
likely to draw one; sorting last is what makes it absorb its own risk instead of
pushing it onto the other sign-in specs.

## Answers to deferred questions

**OQ-4 — rendering the picture screen under test.** Its editor is stubbed in its
own file; no AC-12 criterion goes through cropping, and a third party drawing to
a canvas the fake browser does not implement gives a hard failure, not signal.

**The stub must expose `getImage()` and `getImageScaledToCanvas().toDataURL()`.**
This is not optional detail. The upload handler calls both; a stub without them
returns nothing, the file conversion **throws**, and the component's own `catch`
swallows it into a log — so the upload is never attempted and AC-12's refused
case goes green having proved nothing. A stub that hides the code under test is
worse than no test.

The same reasoning, applied consistently — the earlier drafts applied it unevenly
and each gap was a finding:

- **AC-9, AC-10 and AC-11** stub **`AuthOverlay`** — that is the component which
  mounts the scaled canvas; the re-verify flow is only its child, and both screens
  wrap the flow in it. Stubbing the flow alone leaves exactly the leak this bullet
  exists to avoid. Mounting it for real drags
  in the scaled canvas, which writes `:root` variables and appends a `<style>`
  tag that its cleanup never removes — state that leaks into every later case in
  the file, and something `tests/render.tsx` says in writing it will not do. Each
  asserts the flow was **asked to open**, and that the save did not run.
- **AC-13** stubs the QR components **and the verify control**, which the profile
  card also renders and which pulls that same canvas graph. AC-13 asserts nothing
  about either.
- **All four files stub `services/auth`.** The unit setup makes an unhandled
  request an error, and that service pulls a wide graph. AC-9's "an unchanged
  phone saves directly" and AC-12's refused upload both go through it; without
  the stub they fail as network rather than as behaviour.

## Credentials in the unit files

Two of the four handle phone numbers. They use **`buildUser()` from
`tests/fixtures/user.ts`** — an all-zero phone and an `example.com` e-mail, chosen
deliberately — or literals in the same unassigned ranges, and they never read
`envValue` or `process.env`.

**Not the live suite's convention**, which an earlier draft pointed at by mistake:
that suite reads *real* phone numbers from the environment. These files are
committed to a public repository, so copying a neighbour is the wrong default —
several existing unit files use plausible real-range numbers.

## AC-15 — what the guard can honestly claim

**Correcting the property first.** `spec.md` AC-15 says the guard is "driven by
what was sent, so a field added later is covered the day it is added". **That
cannot hold where this guard sits.** In a service-level check the request body is
built from the payload the check itself passes, so the field list is a
written-down list either way — just at the input end.

So the guard seeds its payload with **every field the profile screens send
today**, using the real keys the mirror uses: `weight`, `tall`, `name`, `phone`,
`gender`, `email`, `alternative_phone`, `image`. (`tall`, not "height" — the
screen's label and the stored key differ.) It asserts each reaches the stored
copy. `verify.md` claims "the fields listed here", never "any field added later".

**The store is seeded with *different* old values first, and that is what makes
the guard work at all.** The mirror writes "the value sent, **or else** the
previous one" for every field — so against an empty stored copy the assertion is
satisfied whichever value lands, and a field mirrored from the old profile
instead of from the request would still pass. Seeding a distinct old value for
each field is the difference between a guard and a green tick.

Three fields are handled by name:

- **`id_token` is excluded, and the exclusion is itself asserted.** The form puts
  it in the body; the mirror deliberately leaves it out. It is a one-time
  credential and the stored profile cookie is not where it belongs. A written
  reason is not enough — nothing would stop a later maintainer answering a red
  parity check by mirroring it. So the guard also asserts **positively that the
  stored copy carries no `id_token`**, with the reason in the message. That turns
  the exclusion into something that fails if someone breaks it.
- **`image` is compared by presence, not value.** It is transformed on the way out
  and differently on the way in, so the two are not meant to match.
- **The guard's payload never carries `image: null`.** Removing a picture leaves
  the old one in the stored copy — a real defect, recorded below. A presence check
  would report green on it, so that case is **knowingly not covered** and no green
  tick stands in for it.

The check calls the update through the file's existing settle helper, so a red
run reports a missing field rather than a timeout.

## Validation strategy

- Validation profile: `logic-change`
- **Every new assertion carries a message.** Patterns copied from
  `session.live.spec.ts` gain one on the way — that file has bare assertions at
  `:150` and `:163`.
- **Each timeout message repeats the leg and the backend.** A `test.step()` title
  is not enough: the live CI run uses the `list` and `json` reporters only, so the
  job log shows a bare "Test timeout of 240000ms exceeded" with no step title. The
  message is the only thing that reaches a reader.
- **The sign-in step is wrapped and rethrown through `redact()`.** The plan
  promises no phone, code or token in text output; the sign-in rethrows the
  widget's own text raw and `redact()` is not wired into the reporter path. One
  `try`/`catch` inside this spec makes the promise mechanical. The shared action is
  still not edited.
- **`test.step()` per criterion** in the live check. `profile.live.spec.ts` is the
  model: 15 uses, and the only browser spec that does it.
- It skips with **`test.skip(!hasShopperA(), …)`**, copying `profile.live.spec.ts`.
  Two precedents exist and only one is right: `auth.live.spec.ts` just reads the
  environment and would run with an empty phone and go **red** instead of
  skipping. A skip covers a missing setting only, never a bad answer.
- It writes **no** saved-session file: it signs in itself and hands nothing on, so
  a state file would put a real credential on disk for no reader.
- `trace` stays `off` for the live project — a trace archives request headers, so
  it archives the token. Video and screenshot stay as configured and can show the
  test identity's phone on the login screen; they are gitignored, so this spec's
  obligation is that no phone, code or token appears in **text** output.
- Type only into the field a case is about and seed the rest — the form
  re-renders and re-scans the country list on every keystroke.
- No existing spec needs re-running for a lift, because there is no lift.

## Rollback

Every step is its own commit and reverts alone. There is no application commit
and no edit to any existing spec, so a revert removes new files and one added
check — it cannot change what a shopper sees or what an existing test proves.

## Findings to raise separately

Confirmed against the code, outside this item's scope. None is ticketed — one
work item is open at a time — and all four are written into
`docs/testing/AUTH_CLOSEOUT_PLAN.md > Findings`, which is tracked and committed.
Each is subject to the repository rule when picked up: a check that fails because
of it, seen failing, then the smallest fix.

- **A refused profile-picture upload tells the shopper nothing.** The reply is
  read, it throws, the handler only logs it, and the navigation never happens —
  so the shopper is left on the screen with no message and no idea the upload
  failed. AC-12 was restated because of this; the criterion now records the
  silence rather than pretending to prove a message that does not exist.
- **`id_token` reaches a kept artifact.** Absent from every stored copy, but the
  request body carries it and a failed save ships the whole body to Sentry as
  `request_body`, with no scrub.
- **Removing a profile picture leaves the old one in the stored copy.** The body
  carries `image: null`; the mirror falls back to the previous value. This is the
  case AC-15 knowingly does not cover.
- **The one-time-code cooldown text reaches the public job log unredacted.**
  `redact()` is wired into the CLI, global setup and the server harness — not the
  reporter path — and the send action rethrows the page's own error text raw.
- **The exhausted-retry message names nothing.** The retrying send sleeps the
  cooldown after its final attempt and then throws a generic "Exceeded maximum
  retry attempts", swallowing the cooldown text the widget gave it — against the
  binding testing rule that a failure must say what broke.

## What earlier review passes changed

Three rounds of advisory review; the full record is in `review.md > Panel
Findings` and `comprehension.md`. Round 2 raised seven `major`s and **not one
landed on this plan's substance** — the recovery check, the four screen checks
and the mirror guard came through clean every time. All seven concerned
scaffolding, and the answer to each was to remove it:

| `major` | Answered by |
|---|---|
| The recovery check does not need the helper lift. | Step dropped; the spec uses the ordinary `{ page }` fixture. |
| The shared sign-in edit buys nothing — `test.setTimeout()` already bounds the sleep. | Step dropped; `actions/auth.ts` left Files to change. |
| Its integration surface named the wrong consumers (the guest spec never calls it; the scripted spec does, four times). | Moot — the step is gone. Recorded so it reads as answered, not missed. |
| The tracked case register was missing from the plan. | Both docs added; `RECOV-` chosen as the prefix. |
| Parameterising the saved-session path could write a live token into a tracked file. | Moot — no state file is written at all. |
| The timeout was anchored on a sum of caps, not on observed wall clock. | Anchored on ~240s observed; caps kept as a worst-case comment. |
| Bounding the retry would not have bounded it anyway — the trailing sleep and a generic message. | Moot; the generic message is now a finding to raise separately. |

`minor` acted on in round 2: only the access credential is spoiled; AC-1 and AC-2
stay in one case in that order; the core backend is named in this spec's own
messages; the verify control is stubbed for AC-13; the profile service is stubbed
in all four files; the `id_token` exclusion is asserted rather than described; the
measured duration is recorded on first run.

### Round 3 — two `major`s, both on AC-12

Security and performance returned **no majors** — the first clean axes this item
has had — and both verified round 2's removals as genuinely closed rather than
merely dispositioned.

| `major` | Answered by |
|---|---|
| The stubbed editor would have made AC-12's refused case a silent pass: the upload handler reads two methods off it, and without them the file conversion throws into the component's own `catch` before any upload is attempted. | `OQ-4` now names the two methods the stub must expose, with the reason. |
| AC-12 claimed the case covers "what the screen **says**" when an upload is refused — the screen says nothing at all. | `spec.md` AC-12 restated to the three things that *are* observable; the silence is now the fifth finding to raise separately. |

`minor` acted on in round 3: the store is seeded with different old values, so
AC-15's guard cannot pass on a fallback; the real key `tall` replaces "height";
`AuthOverlay` is what gets stubbed, not the flow inside it; `hasShopperA()` is
named as the skip pattern; each timeout message repeats the leg and the backend,
because the live log carries no step titles; the sign-in step is rethrown through
`redact()`; the rotation poll reads no cookie value; unit fixtures use
`buildUser()`; the case register's count and summary table are named; "trim the
spec" is replaced by measure-then-drop.

## Out of scope

- **The tester simulate feature** — permanently; it is being removed.
- Lifting the shared live-session helpers — no `AC-n` needs it. If it is wanted
  as tidy-up it is its own work item.
- The scripted profile checks and the rollback-mirror defect.
- The mirror guard for that rollback.
- The profile picture and the address, live.
- Giving the guest credential cases a case-id prefix.
- The four findings above, raised separately.
- **Any application change whatsoever.**
- The empty-name message, accepted as-is at spec (OQ-6).
