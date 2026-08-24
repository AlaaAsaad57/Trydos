---
ticket: auth-closeout-tests
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-23
links:
  clickup:
  github:
---

# Spec — auth-closeout-tests

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Close the auth journey: prove session recovery for a signed-in shopper, cover the
profile screens that need no backend, and guard the profile mirror.

## Business Goal

Two of the three failure modes this journey names — *everybody gets logged out
mid-action* and *a change saved but shown back wrong* — are today either unproven
or proven only in a suite that never runs on a pull request. This work item turns
both into checks that run.

## User Story

> As a signed-in shopper, I want an expired credential to be swapped behind my
> back and my own details to be shown back to me correctly, so that I keep
> shopping as myself instead of being thrown out in the middle of what I was
> doing.

## Functional Requirements

- **FR-1** A signed-in shopper whose working credential is refused during an
  action finishes that action, as the same shopper, without being asked to sign
  in again.
- **FR-2** The recovery is shown to have really happened — the stored credentials
  moved on — rather than assumed from the absence of an error.
- **FR-3** Every decision the profile screens make without a backend is covered:
  what the form refuses, what a guest gets instead of a save, when a re-verify
  step replaces a save, what the card shows for each kind of visitor, and what
  the picture screen does when an upload is refused.
- **FR-4** A saved profile keeps **every** field that was sent to the backends, in
  the copy the app renders its own screens from.

## Non-Functional Requirements

- The unit checks run with no network and no real timers where a fixed wait would
  otherwise cost seconds.
- The live check leaves the shared staging account exactly as it found it. The
  action it performs writes nothing to the account.
- No credential, phone number, one-time code or token appears in any assertion
  message, failure output, or kept artifact.
- Every assertion carries a message. Every step that crosses a backend names that
  backend. A partial success is a failure.

## Constraints

- **A check must be able to fail for the reason it names.** This is the binding
  constraint of the whole item, and the reason FR-1's proof is worded as it is: a
  check that reads the shopper's identity before the credentials have finished
  rotating passes for the wrong reason. Reading too early is a silent pass and is
  treated as a defect in the check, not a passing run.
- **No application code changes.** This work item adds coverage only. Anything it
  finds is recorded as a finding and raised as its own work item, under the
  repository rule — a check that fails because of the fault, seen failing, then
  the smallest fix.
- Only a missing test-account setting may cause the live check to be skipped. A
  backend answering wrongly stays red and names the backend.
- No count is asserted anywhere. Fields, steps and services are asserted by name.

## Edge Cases

- The shopper's credential is refused, and the means to renew it still works —
  the shopper survives.
- The stored session handed from one check to the next has been superseded — the
  next check must not silently run as a guest and report the account's details as
  missing.
- A name box left empty. Today the screen answers with the minimum-length
  message rather than the required message. **Accepted as-is** (OQ-6); the check
  records what it really says.
- A picture value that is a guest placeholder rather than a real picture.
- **An upload the media backend refuses.** AC-12 was restated at `review` round 3.
  It previously said the case covers "what the screen **says**" — the screen says
  nothing. A refused upload throws while the reply is read, the handler only logs
  it, and the shopper is left where they were with no message. A criterion that
  cannot be proved is not finished (`CLAUDE.md`), so AC-12 now names the three
  things that *are* observable. **That silence is itself a defect** and is raised
  as its own finding; this work item records the behaviour, it does not fix it.
- A leg of the profile save that the shopper has no record for — skipping it is
  not a failure.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | The live check has four steps, not five. The fifth described code that has since left this work item entirely. | Out of Scope |
| OQ-2 | The live check acts by opening the cart. It provokes the refusal, is safe to repeat, and writes nothing to the shared account — the guest half of this behaviour already acts the same way. | AC-1 |
| OQ-3 | **Answer reversed at `review` round 2.** The helpers are *not* lifted: the recovery check signs in itself and saves no session, so it needs none of them. No `AC-n` needs the lift, so it is out of scope. | Out of Scope |
| OQ-4 | **Deferred to `plan`.** Whether the picture screen renders under test as-is, or needs its editor stood in for, is an approach question. It does not change what AC-12 must be true of. | Open Questions |
| OQ-5 | **Answer reversed at `review`.** The work it covered is out of scope permanently and is not deferred. This item carries no application change. | Out of Scope |
| OQ-6 | Not a defect. An empty name is also a name below the minimum length, so the message is blunt rather than wrong. The check records what the screen really says and no separate work item is opened. | AC-6, Edge Cases |
| OQ-7 | **Corrected at `review` round 2.** "Driven by what was sent" cannot hold at a service-level check — the body is built from the payload the check passes, so it is a written-down list either way. The guard seeds every field the profile screens send today and claims only those. | AC-15 |

## Open Questions

- **OQ-4** — deferred to `plan`: how the picture screen is made to render under
  test. It changes the approach, not the criterion.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A signed-in shopper whose working credential is refused mid-action completes that action. | FR-1 |
| AC-2 | After that recovery the app names the **same** shopper as before it — not a new guest. | FR-1 |
| AC-3 | No sign-in prompt and no phone-entry screen appears at any point in the recovery. | FR-1 |
| AC-4 | Both stored credentials are replaced, and the storefront credential is still unreadable to page scripts afterwards. | FR-2 |
| AC-5 | The identity in AC-2 is read only after the credentials have finished rotating, and the check says so when it times out waiting. | FR-2 |
| AC-6 | The personal-details form refuses an empty name, a name below the minimum length, a missing or invalid phone, an invalid e-mail when one is given, and a missing gender — each with the message the screen really shows. | FR-3 |
| AC-7 | A validation message goes away once the field it belongs to is corrected. | FR-3 |
| AC-8 | A visitor who is not signed in gets the sign-in surface when they touch the form, and nothing is saved. | FR-3 |
| AC-9 | A changed phone number opens the re-verify step **instead of** saving; an unchanged one saves directly. | FR-3 |
| AC-10 | An account with a usable phone reads **Verified** and opens nothing; one without reads **Verify Now**. | FR-3 |
| AC-11 | The settings re-verify overlay stands down while a global sign-in surface is up, and does **not** come back when that surface closes. | FR-3 |
| AC-12 | The picture screen covers choosing a picture, removing one, and — when the upload is refused — that **no picture is saved, the shopper is not navigated away, and the failure is logged**. | FR-3 |
| AC-13 | The profile card is correct for a signed-in shopper, for a guest, and for each placeholder value the app treats as "no picture" — including the misspelled one. | FR-3 |
| AC-15 | Every field carried in a profile save reaches the copy the app renders from — driven by what was sent, so a field added later is covered the day it is added. | FR-4 |

## Out of Scope

- **A fifth requirement and three criteria that were briefly in scope.** They
  covered a feature that is being removed from the product. There is no follow-up
  work item and no finding to carry — the code they described is going away.
  `intake.md` is left as it was written; it records what was true at the stage
  that wrote it.

- **Lifting the shared live-session helpers.** No `AC-n` needs it (`OQ-3`,
  reversed at `review` round 2). If it is wanted as tidy-up it is its own work
  item.

- **The scripted profile checks** and the rollback-mirror defect they exercise —
  the app writes the new value after putting the old one back. Its own work item,
  because its fix must be proved by the check that exercises it.
- **The mirror guard for that rollback** — it can only be written once that fix
  exists, or it would fail for a defect that is knowingly open.
- **The profile picture and the address, live** — additive, and the address needs
  a boundary decision against the live roadmap's own address phase first.
- **A live check on the session tick** (OQ-1) — it cannot fail for a real shopper,
  so it is not written.
- **Any application change at all.** Everything found is recorded as a finding and
  raised as its own work item — five so far, listed in `plan.md`.
- Bank cards and the wallet screens.
