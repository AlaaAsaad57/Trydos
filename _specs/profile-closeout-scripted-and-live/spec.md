---
ticket: profile-closeout-scripted-and-live
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer
updated: 2026-08-25
links:
  clickup:
  github:
---

# Spec — profile-closeout-scripted-and-live

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

The profile journey, closed: the failure branches a healthy backend will not
perform, and the two screens Item A left out.

## Business Goal

A shopper changing their own details is talking to three backends at once. When
one refuses, the app is supposed to put the others back and say so — and nothing
has ever checked that it does, because staging accepts everything it is asked.
Two defects have already been found in that exact path by reading it rather than
running it. This work makes the failure behaviour observable, so the next one is
caught by a run instead of by a review.

It also finishes the two screens the profile work named and did not cover: the
picture and the address. Until they are covered, a shopper can remove their
picture or lose an address and nothing tells us.

## User Story

> As a shopper changing my own details, I want the app to behave correctly when
> one of the backends behind it refuses, so that a half-finished save never
> leaves me looking at a change that did not happen.

## Functional Requirements

**The failure branches** — each must be observable without asking a backend to
misbehave:

- **FR-1** When one backend refuses a profile save, the changes already accepted
  by the others are put back, and the shopper is told **once**.
- **FR-2** When the shopper has no record on one of the services, that service is
  skipped, and skipping is not reported as a failure.
- **FR-3** When the picture upload is refused, the shopper is told it failed, and
  no profile change is saved anywhere.
- **FR-4** When the shopper changes their number, the save does not happen
  immediately: they are asked to confirm the new number first, and the save that
  follows carries the confirmation the app was given.
- **FR-5** When the shopper's credential is refused during a save, the app
  renews it and the save still completes.
- **FR-6** When renewing the credential also fails, the app asks the shopper to
  sign in again and keeps the number they were working with.

**The two remaining screens** — against the real backends:

- **FR-7** A picture the shopper chooses is still theirs after a reload, and
  removing it removes it.
- **FR-8** The profile card leads to the picture screen.
- **FR-9** An address the shopper adds is listed with the details they entered,
  and can be removed again.

**Properties the whole suite must keep:**

- **FR-10** A case that fakes a backend answer proves the fake was actually used.
- **FR-11** Session handling shared by more than one case has one definition, not
  a copy per case.
- **FR-12** Every backend this suite sends real traffic to is checked as a
  staging address before anything runs.

## Non-Functional Requirements

- **NFR-1** A failure message names the step that failed and, where the step
  crossed a backend, which backend — quoting what the app itself said rather than
  inferring it.
- **NFR-2** No credential, one-time code, phone number or e-mail appears in an
  assertion message, a failure difference, or any kept artifact.
- **NFR-3** Nothing this work adds is allowed to make an unconfigured checkout
  fail. Missing settings skip; a wrong answer from a backend does not.
- **NFR-4** The real one-time codes consumed per run must be stated, because they
  are spent against a limit that is not ours.

## Constraints

- **C-1** A faked answer can only change what happens **after** the page is
  loaded. Anything the page was rendered with is decided before the browser sees
  it and cannot be faked.
- **C-2** Sending a one-time code cannot be faked. Any case that triggers one
  causes a real send.
- **C-3** Cases that use the real backends share one account. Everything created
  is removed again, and the undo is registered when the thing is created, not
  after the checks.
- **C-4** The test runner never retries. A retried write is a duplicated write.
  The app's own one-time-code send does retry after a cooldown — that is the
  app's behaviour, not the runner's, and its cost is recorded rather than
  changed.
- **C-5** A failure caused by a backend stays failing, names the backend, and is
  reported. It is never skipped, loosened, narrowed or retried.
- **C-6** No credential may appear in any kept artifact. Cases that fake answers
  keep **no** trace recording, because they now hold a real session; a video is
  kept, and it is encrypted before it leaves the job.
- **C-7** Nothing here changes a protected runtime path.
- **C-8** **A case that fakes answers blocks every other call the browser makes.**
  A call that changes something may reach the network only when it is named. A
  call that only reads may pass. Any other call fails the case and names the route
  it tried. Listing the calls to fake one by one is not enough: the app makes calls
  the list does not know about, and each of those reaches a real backend without
  anyone noticing.
  **This covers what the browser sends, and nothing more.** Work the server does
  for itself — rendering a page, or an action the browser triggers without making
  its own request — cannot be seen from the browser and so cannot be blocked here.
  That is the same boundary C-1 already draws for rendering, and it is a limit of
  the technique, not a gap to be closed later.
- **C-9** **A case that fakes answers never passes its session on.** It opens the
  session the sign-in case saved and throws its own copy away at the end. A case
  that damages its own session must not be able to hand that damage to the next
  case.

> **C-8 and C-9 were added after the plan review had run three times** (2026-08-25),
> on the owner's decision. Each round had found one more app call that the fakes
> did not cover — the cookie write, the sign-out route, the token-clearing route,
> the profile read — and each was the same fault wearing a different name. The two
> constraints above replace that list with a rule, so the fault cannot recur under
> a new name. Recorded here rather than in `plan.md`, because a plan may not amend
> its own spec.
>
> **C-8 was narrowed after the fourth review round.** As first written it said the
> case blocks "every other call it could make", which cannot be done: the
> one-time-code send is a server action, and a page render happens on the server,
> so neither is visible to the browser. The wording now says what the technique can
> actually deliver, and names the limit rather than leaving it to be discovered
> again. The read-versus-write rule replaced an earlier idea of discovering the
> allowed calls by running the suite — that would have re-admitted the very writes
> the constraint exists to stop.

## Edge Cases

- A credential refused **during** a save produces two writes to the same backend,
  which looks exactly like a rollback. The two must be told apart by what the
  second write carried, not by counting.
- A faked answer that matches nothing passes silently through to the real
  backend, so the case would test the opposite of what it claims. FR-10 exists
  for this.
- The account's record on a service is read once when the page loads and again
  when the save runs. A case that removes the record must remove it for both, or
  the branch never runs.
- The account carries no e-mail, and a size cannot be cleared once set. Cases
  that touch either must create and restore, or record the drift.
- Removing a picture and removing an address are both undo operations that can
  themselves fail, leaving the shared account dirty for the next run.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | The media fake belongs in the **shared faking layer**, not written inline in one case. The upload is a distinct backend that any later media case will also need, and the suite's own rule is that a faked answer is named once and reused. Exactly where it sits is the approach's business. | FR-3, FR-10 |
| OQ-2 | **One shared sign-in for all the faked cases.** Six sign-ins would be six real one-time codes against a real limit, for six cases that are not testing sign-in. The shared-session handling this needs is the same thing FR-11 requires. | FR-11, NFR-4, C-2 |
| OQ-3 | **In scope.** This work is what starts sending real uploads to the media backend, so making that backend checked before a run is part of doing it safely — not a separate favour. Leaving it out would ship a case that writes a file to an address nothing has verified is staging. Note for the gate: treating a new address as checked is a deliberate act, and this is it being made deliberately. | FR-12 |
| OQ-4 | A **small image created by the case itself**, recognisable as a test artifact, and removed by the same case. Nothing is read from the repository or from the account. | FR-7, C-3 |
| OQ-5 | **Content, not presence.** An address that is listed but has lost its details is a partial success, and a partial success is a failure. The check reads back what was entered. | FR-9 |
| OQ-6 | **The chat leg.** It is the leg whose rollback carried a real defect, so it is the one with a history of getting this wrong and the one most likely to regress. The stories leg was always correct and makes a weaker guard. | FR-2 |
| OQ-7 | **Presence and non-empty only — never the value.** The confirmation the save carries is a credential, and cases that fake answers keep a recording when they fail. Asserting the value would put it in that recording. | FR-4, NFR-2, C-6 |
| OQ-8 | **Deferred to `/plan` (PL-12).** Whether the faked cases can reach the profile screen without a real sign-in depends on the approach taken to establishing a session, which is exactly what `/plan` decides. It changes the run's cost (NFR-4) but not what any criterion asserts. | Open Questions |

## Open Questions

- **OQ-8** — Can the faked cases reach the profile screen without a real sign-in?
  Deferred to `/plan`. If yes, the run cost drops by one real one-time code and
  `AC-14`'s stated number changes with it. No other criterion moves.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | With one backend made to refuse a profile save, the changes already accepted by the other two are put back, and the shopper is told exactly once — not once per backend. | FR-1 |
| AC-2 | With the shopper's chat record absent both when the page loads and when the save runs, the chat backend is not written to, the save still succeeds, and no failure is reported for it. | FR-2 |
| AC-3 | With the picture upload refused, the shopper is shown a message saying it failed, and no profile change is sent to any backend. | FR-3 |
| AC-4 | Changing the number does not save straight away: the shopper is asked to confirm the new number, and the save that follows carries a non-empty confirmation. The confirmation's value is never read into a message or a kept recording. | FR-4, NFR-2 |
| AC-5 | With the credential refused once during a save, the app renews it and the save completes. The second write to the affected backend is shown to be a retry carrying the new value, not a rollback carrying the old one. | FR-5 |
| AC-6 | With both the save and the renewal refused, the shopper is asked to sign in again and the number they were working with is still there. | FR-6 |
| AC-7 | A picture chosen by the case is the one shown after a full reload; after removing it, no picture is shown after another reload. The account is left as the case found it. | FR-7, C-3 |
| AC-8 | From the profile card, the shopper reaches the picture screen. | FR-8 |
| AC-9 | An address added by the case is listed with the details that were entered, read back after a reload; removing it takes it off the list. The account is left as the case found it. | FR-9, C-3 |
| AC-10 | Every case that fakes an answer fails if the faked call was never made, so a fake that matches nothing cannot report a pass. | FR-10 |
| AC-11 | The session handling used by more than one case exists once and is referred to, with no second copy anywhere in the suite. | FR-11 |
| AC-12 | The media backend is checked as a staging address by the same pre-run check that covers every other backend, and an unrecognised address stops the run before anything is built. | FR-12 |
| AC-13 | Every check added here carries a message that names the step; where the step crossed a backend, the message names that backend and quotes what the app reported rather than inferring it. | NFR-1 |
| AC-14 | The number of real one-time codes a full run consumes is stated in the suite's own documentation, and the list of cases is updated to include every case added here. | NFR-4 |
| AC-15 | With no test identity configured, everything added here skips and the run is clean. A backend answering wrongly does **not** skip. | NFR-3, C-5 |

## Out of Scope

- **Fixing the `NextLink` accessible-name defect.** `AC-8` will meet it — the
  card's links carry no accessible name because the label is declared and never
  rendered. It affects 22 places, it is accessibility-only, and the decision is
  the owner's. This work finds the link another way and says so.
- **The unreachable rollback branch on the core leg.** Same defect as the one
  already fixed on the chat leg, but it cannot run: the core backend is the last
  one tried, so the branch is only reachable if code that cannot fail does.
  Whether it is deleted, or whether the order is what should change, is its own
  decision.
- **The two remaining findings on the one-time-code send path** — the cooldown
  text reaching the public job log, and the exhausted-retry message naming
  nothing. Neither is on the profile.
- **Proving that a phone change is accepted and takes effect.** Both configured
  numbers already have accounts, so there is no number to move to and no happy
  path to observe. `AC-4` covers what leads up to the save; **that a change
  actually lands is not covered by this work and is not claimed to be.**
- **The wallet leg**, which is switched off in the app, and the failing sign-in
  case that is red for a wallet fault. That is a backend finding.
- **Bank cards and the wallet screens** under the profile.
- **Any change to a protected runtime path.**
- **Correcting the misspelled test hooks on the address screen.** They are in
  application markup; matching them as they are costs nothing and renaming them
  is a source change with no test value.
