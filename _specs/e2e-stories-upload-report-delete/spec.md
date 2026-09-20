---
ticket: e2e-stories-upload-report-delete
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-20
links:
  clickup:
  github:
---

# Spec — e2e-stories-upload-report-delete

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Browser tests for the stories journey, and a test-account rule that lets them run
safely.

## Business Goal

Uploading, reporting and deleting a story are three things a shopper does and
nothing checks. Each one crosses two or three backends, so a break in any of them
is found today by a shopper, not by the suite.

The suite cannot check them yet. A story it makes is either unsafe — a real
customer sees test content in the story bar — or invisible, because the safety
mark that hides it from customers hides it from the test too. This ticket removes
that choice, then uses the result to cover the three journeys.

## User Story

> As the person who owns the Trydos test suite, I want the stories journey
> checked in a real browser, so that a break in uploading, reporting or deleting a
> story is found by the suite — and so that running the suite never shows test
> content to a real customer, and never files a report against a real person's
> story.

## Functional Requirements

**The visibility rule** — the heart of this ticket.

- **FR-1.** A test story is never shown to an ordinary customer, anywhere. Every
  place that lists stories keeps hiding it, exactly as it does today.
- **FR-2.** A test story **is** shown to an account on a configured list of test
  accounts, named by the phone number the account signs in with. The list decides
  by **who is looking**, not by any secret the request carries, and it is worked
  out from the accounts the suite already uses rather than configured by hand.

  **What this rule is worth, honestly.** Most story readers run in the browser and
  learn who is looking from state the browser holds, which a visitor can change.
  So on a build where the list **is** set, the rule is advisory: somebody who
  knows a listed id and edits their own browser state can see test stories. The
  real protection is FR-3 — the list is empty on every build a customer can
  reach, so there is nothing to match and nothing to spoof.
- **FR-3.** The list is empty by default. With no list configured, the app behaves
  exactly as it does today: every viewer, signed in or not, is an ordinary
  customer. Turning the feature on is an act somebody has to perform on an
  environment, and it is never on by accident.
- **FR-4.** An entry on the list that is blank, malformed, or names nobody changes
  nothing, and never makes the app fail. Getting the list wrong makes test stories
  invisible — it never makes real stories visible to the wrong person.
- **FR-15.** **No** reader of the story feed skips FR-1 to FR-4 — including a
  reader that no screen calls today. A reader that is unused now is a reader that
  will be used later, and the rule must already be there when that happens. A
  reader may satisfy this either by following the rule or by not existing.

**The journeys the suite must cover.**

- **FR-5.** The suite uploads a story with a **photo**, through the screens a
  shopper uses, and the story it makes carries the test mark. This is the only
  upload in scope.
- **FR-6.** ~~The suite uploads a story with a **video**.~~ **Removed from scope
  by the owner on 2026-09-20: "no video upload required only image".** The reason
  it came up at all is recorded under `BLK-VIDEO-01` in `implement.md` — no tool
  available here can make an MP4 the app's picker accepts, and a webm would
  exercise a path no shopper can reach.
- **FR-7.** The uploaded story carries a **link**, and the suite proves the link
  that was typed is the link the story ends up with. (The mark a story carries
  *is* its link, and the app offers no story without media — so "a link story" is
  not a separate kind. See `OQ-3`.)
- **FR-8.** A **second** test account opens a story the first one made, and
  reports it through the report screen. The report reaches the stories backend and
  is accepted.
- **FR-9.** The account that made a story **deletes** it, through the delete
  screen, and the story is afterwards gone from the stories backend.
- **FR-10.** The suite never reports or deletes a story it did not make itself. It
  identifies its own story by the mark it wrote, never by position in a list and
  never by "the first story on screen".
- **FR-11.** The suite finds its own story even when the story is **not on the
  first page** of the feed.

**How the suite behaves when it cannot run.**

- **FR-12.** Every case skips — never fails, never passes quietly — when a setting
  it needs is missing, and the skip names the missing setting. This covers at
  least: no second account code, no media store, and no test-account list.
- **FR-13.** A case that is red because a **backend** refused says which backend
  and quotes what that backend said.
- **FR-14.** The suite leaves nothing behind, and the clearing up **is** the proof.
  The last case of the stories journey deletes every story the run uploaded,
  through the delete screen a shopper uses. That one act does both jobs: it is the
  delete case, and it is the cleanup. A story the run made and did not delete
  through a case is still removed before the run ends.

## Non-Functional Requirements

- **NFR-1.** No credential, one-time code, phone number, e-mail or token reaches
  any test output, message or kept artifact. This repository is public and every
  CI log is world-readable.
- **NFR-2.** The list of test accounts is not a secret and must not be handled as
  one — masking it in logs hides unrelated numbers in the same output. It is also
  **not harmless**: on a build that has it set, the list is readable by every
  visitor of that build, and knowing an id is enough to see test stories from it.
  It grants no access to anything else, and on a build without it set it means
  nothing at all. It must therefore never be set on a deployed app, and its
  values must never be written into a tracked file — this repository is public.
- **NFR-3.** A failure names the step and the backend it crossed, readable on its
  own with no code open and no re-run.
- **NFR-4.** Each new case carries its own time budget where the work is slow. A
  real media upload crossing two backends does not fit the suite's ordinary
  per-case budget — the comparable case in this suite is given 180 seconds for a
  single small picture.
- **NFR-5.** The change to the app is the smallest one that satisfies FR-1 to
  FR-4. It adds no new screen, no new setting beyond the list itself, and no
  second way to see test data.

## Constraints

- **C-1.** The existing safety lock stays intact. The story mark, the filtering,
  and the case that proves a test story never reaches the home feed must all still
  hold and still pass.
- **C-2.** No new secret. The visibility rule is decided by identity, not by a
  shared secret in a header — a secret in the browser is a secret anybody can
  copy, and it would turn every viewer who has it into a test account.
- **C-3.** The app may be changed, and the owner has said so. Any application
  change must be proved by a test in the suite that gates pull requests, not only
  by the browser suite.
- **C-4.** No test may fall back to a real person's story or a real seller's
  story, for any reason, including "there was nothing else to use".
- **C-5.** Reporting cannot be undone — the app offers no way to withdraw a
  report. So a report may only ever be filed against a story the run itself made.
- **C-6.** Test stories are made on a real environment by real accounts. They are
  real rows and must be cleaned up like real rows.
- **C-7.** Every user-visible string the work adds or changes must exist in all
  three translation files before it is used.

## Edge Cases

- **E-1.** The upload control is not drawn. Both test accounts are allowed to
  upload stories, so this is a **fault, not a missing setting**: the case fails and
  says that the account's profile no longer permits uploading, rather than waiting
  for a button that will never appear.
- **E-2.** The media store refuses the file, or the upload ticket is refused. That
  is a different backend from the stories backend, and the failure must say which
  one refused.
- **E-3.** The story is uploaded but the feed has not caught up yet. The suite must
  wait for its own story rather than deciding immediately that the upload failed.
- **E-4.** The story is on page three of the feed. Covered by FR-11.
- **E-5.** An earlier run left a test story behind. A new run must not be confused
  by it, and must not report or delete a story from an earlier run by mistake.
  Reporting cannot be undone, so the case must prove the item it is about to act
  on is its own **before** it acts — not after.
- **E-6.** The report screen is opened, then closed with nothing chosen. Nothing is
  sent, and the story is unchanged.
- **E-7.** The delete fails on the backend. The app must not claim the story was
  deleted, and the case must report what the stories backend said.
- **E-8.** The second account cannot sign in, because its code is not configured.
  The report case skips; it never reports as the same account that uploaded, and it
  never reports somebody else's story instead.
- **E-9.** The test-account list is configured with an account that does not exist.
  Nothing changes for anyone. See FR-4.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Neither of the two options researched. The owner set the rule instead: **a test story is hidden from real customers and shown to test accounts.** So visibility is decided by the identity of the viewer, against a configured list of test accounts — not by faking a response in the test, and not by a secret header. The repository already has this exact shape for the one-time-code limiter, where a short configured list of numbers the team owns is exempt. | FR-1, FR-2, FR-3, FR-4, C-2, AC-1…AC-4 |
| OQ-2 | **No.** A customer story cannot be attached to a product: the upload screen sends only the file, whether it is a video, and the link. Only a *seller* story carries a product, and a seller story is a different object with its own create, list and delete calls. So the product page's unfiltered story row is not a way in, and this ticket does not use it. | Out of Scope |
| OQ-3 | **No — a test story always carries a link,** because the link *is* the mark, and the app has no story without media. The three kinds the request named therefore collapse: a "link story" is every story, and after the owner removed the video on 2026-09-20 what remains is **one** upload — a photo carrying a checked link. | FR-5, FR-7, AC-5, AC-7 |
| OQ-4 | **Answered by the owner on 2026-09-20: both test accounts are allowed to upload stories.** So the permission is not a gate on this ticket, and the choice of which account uploads is free — `/plan` picks it on other grounds (which account can sign in on CI). Because the permission is known to be there, an upload control that is missing is a fault and not a skip. | E-1, AC-5 |
| OQ-5 | Two accounts are **required**, not preferred. The report control is only drawn for a signed-in viewer who is **not** the owner, and the delete control only for the owner. One account can never report its own story. Both accounts must be on the test-account list: the uploader to see and delete its own story, the reporter to see it at all. | FR-8, FR-9, FR-10, E-8 |
| OQ-6 | The suite cleans up after itself. The delete case is the cleanup for the story it covers, and any story a run makes but does not delete through a case must still be removed before the run ends. | FR-14, C-6, E-5 |
| OQ-7 | Deferred to `/plan`: where the sample photo and video live, and how large they may be. The ticket needs them small enough that every checkout of the repository stays cheap, and real enough that the media store accepts them. | Open Questions |
| OQ-8 | Deferred to `/plan`: which lane the new cases join, and whether they depend on the existing setup step. The rule itself is not in doubt — a spec file in no lane stops the command, so it must be listed. | Open Questions |
| OQ-9 | **In scope**, on the owner's instruction of 2026-09-20: the app follows the same rule everywhere, so the unused, unfiltered story reader follows it too. It is not a separate ticket and it is not an open question. | FR-15, AC-16 |
| OQ-10 | The application change is proved by unit tests, which are what gates pull requests: the list off, the list on, and a malformed list. | AC-1, AC-2, AC-3, AC-4, C-3 |

## Open Questions

- **OQ-7** (deferred to `/plan`) — where the sample photo and video live, and
  their size limit.
- **OQ-8** (deferred to `/plan`) — which lane the new cases join, and whether they
  depend on the existing setup step.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | With no test-account list configured, a test story is absent from the feed for every viewer — signed in or not. Today's behaviour is unchanged. | FR-1, FR-3 |
| AC-2 | With a viewer who is on the test-account list, a test story is kept in the feed and reaches the screen. | FR-2 |
| AC-3 | With a viewer who is **not** on a configured list, a test story is still absent. Configuring the list for one account does not open it for anybody else. | FR-1, FR-2 |
| AC-4 | A list that is blank, malformed, or names nobody leaves every feed exactly as it is, and raises no error. | FR-4 |
| AC-5 | The suite uploads a **photo** story through the shopper's own screens, and the story that results carries the test mark. | FR-5 |
| AC-6 | ~~The suite uploads a **video** story.~~ **Withdrawn on 2026-09-20 by the owner.** Not deferred to a follow-up and not silently skipped — removed. | — |
| AC-7 | For the upload, the link is built from the app's own test-mark host, is a test link **before** the upload starts, and the link **stored on the story** is still a test link afterwards. A story that comes back unmarked is deleted at once and the case fails. | FR-7, FR-1 |
| AC-8 | A second test account opens a story the first account made and reports it; the stories backend accepts the report. The failure, if any, names the stories backend and quotes what it said. | FR-8, FR-13 |
| AC-9 | The last case of the journey deletes **every** story this run uploaded, through the delete screen, from the account that made it. Each one is afterwards absent from the stories backend — checked at the backend, not only on screen. This single case is both the delete proof and the clearing up. | FR-9, FR-14 |
| AC-10 | Every story the suite reports or deletes is one this run uploaded, identified by the mark it wrote. | FR-10, C-4, C-5 |
| AC-11 | The suite finds its own story when the story is not on the first page of the feed. | FR-11 |
| AC-12 | With any needed setting missing, each case skips and the skip names the missing setting. No case fails for a missing setting, and none passes without doing its work. | FR-12, E-8 |
| AC-13 | After a full run, no story the run made is left on the environment — including a story whose own case failed earlier. This holds **inside the feed window the suite reads** (the first five pages); a story pushed past it is a recorded residual, not a silent one. | FR-14, C-6 |
| AC-16 | No reader of the story feed skips the rule. The unused reader that did is gone, so it cannot, and no remaining reader can be changed to skip it without a test going red. | FR-15 |
| AC-17 | Nothing the suite prints from an **unfiltered** feed read names another author. A message may carry this run's own token and story ids, and nothing else. The rule itself is the control: the suite's redaction masks secrets and tokens, and cannot mask a stranger's name. | NFR-1 |
| AC-18 | No tracked file in the repository sets the test-account list. **Residual, stated:** a value set in a hosting platform's own settings cannot be seen from here, so this check narrows the risk rather than closing it. | NFR-2, FR-3 |
| AC-14 | The existing proof that a test story never reaches the home feed for an ordinary customer still passes, unchanged. | C-1 |
| AC-15 | No credential, one-time code, phone number or token appears in any test output or kept artifact produced by the new cases. | NFR-1 |

## Out of Scope

- The **seller** story feature — its own create, list and delete calls, and its
  own screen in the seller dashboard. It is a different object from the story
  this ticket covers.
- Attaching a story to a product.
- The story camera. The suite uploads a file; it does not drive the device
  camera.
- Viewing counts, seen/unseen rings, and story ordering.
- Any change to how stories are marked as test data. The existing mark stays as
  it is.
- Reporting or deleting anything the suite did not create.
