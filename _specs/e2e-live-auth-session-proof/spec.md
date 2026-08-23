---
ticket: e2e-live-auth-session-proof
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-22
links:
  clickup:
  github:
---

# Spec — e2e-live-auth-session-proof

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Browser proof that a real sign-in, a sign-out, and a page reload behave.

## Business Goal

Signing in is not one action. One sign-in writes about ten pieces of session
state, spread over five separate backends, and the shopper sees a single screen
that says they are in. So a part of it can fail and nothing looks wrong: a
shopper can be signed in to the storefront and not to chat, and the first report
comes from that shopper.

The browser suite has one live sign-in case today, and it proves less than it
appears to. It checks that the session cookies **exist by name** — the check on
what the profile cookie actually holds was disabled to get a run green and never
put back. Nothing at all covers signing out, and nothing covers a signed-in
visitor reloading the page.

**The wallet sign-in is failing on staging right now, and the suite is green.**
That is the whole problem in one sentence. A test that says "sign-in failed", or
worse says nothing, costs an afternoon of guessing. A test that says "the wallet
sign-in did not land" costs a minute. So this coverage does not merely have to
catch a broken sign-in — it has to **name the backend that broke it**.

This closes the sign-in journey before work starts on the money path, which
assumes a working session in every one of its cases.

## User Story

> As the engineer who owns this app, I want the browser suite to prove that a
> real sign-in writes a usable session, that signing out removes all of it, and
> that the session survives a reload, so that a partial failure across the five
> backends is caught by a test instead of by a shopper.

## Functional Requirements

- **FR-1** — Prove that a completed real sign-in leaves a session that is both
  **usable** and **protected**: the stored profile carries an identity for the
  account that just signed in, and the credential that must never be readable by
  page scripts is marked so.
- **FR-2** — Prove that signing out removes the **whole** signed-in session, not
  a part of it. Once signing out has settled, none of the per-backend session
  state survives, and nothing the app hands the replacement guest still carries a
  value belonging to the account that signed out. The visitor is a guest again —
  not the same shopper with fewer cookies.
- **FR-3** — Prove that a signed-in visitor who reloads the page is **still
  signed in as far as the app is concerned** — shown by the app treating them as
  signed in, not by session state merely still being present.
- **FR-4** — Record each new case in the suite's scenario record, with an id of
  its own, so a failure can be named and discussed without opening the code.
- **FR-5** — Prove the sign-in **one backend at a time**. Each of the five
  backends a sign-in calls — the storefront sign-in itself, chat, stories,
  comments and wallet — is judged on its own, so a sign-in that landed for four
  of them and not the fifth is a failure and not a pass.
- **FR-6** — When a backend's part of the sign-in did not land, the failure
  **names that backend**. Somebody reading only the failure must know which
  backend to go and look at, without opening a browser, re-running anything, or
  reading the coverage code.

## Non-Functional Requirements

- **NFR-1** — No real credential value may appear in an assertion, in output, or
  in anything the run keeps. The live coverage records no request trace on
  purpose, and this ticket must not add one or weaken the existing protection of
  what is recorded.
- **NFR-2** — The suite does not retry a failed case. Every wait these cases add
  must key on an observable state, never on a fixed delay, so a red run means a
  defect and not a slow moment.
- **NFR-3** — The coverage must spend as few real sign-ins per run as its shape
  allows. A run must never turn red because it exhausted a rate limit rather
  than because something is broken.
- **NFR-4** — The criteria must survive ordinary change on staging. None may
  depend on a particular account's data, a particular number of requests, or a
  fixed count of cookies.
- **NFR-5** — The added coverage must read like the rest of the suite it sits in
  — same shape, same wording, no disabled assertions left behind.
- **NFR-6** — No criterion may be expressed as a count of session pieces. A
  count says a number changed, not which backend died, and it goes wrong the day
  a backend is added. Every judgement is made per backend, by name.
- **NFR-7** — Every check this coverage makes must state, in plain words, what
  was supposed to be true — read on its own, with no code open, the failure says
  which step failed and which backend it was talking to. A check that can only
  report "it did not work" does not meet this ticket, whichever criterion it
  belongs to.

## Constraints

- **C-1** — Every sign-in these cases perform is real traffic against staging: a
  real one-time-code send and a real sign-in. The test number is on the app's
  own test-number allowlist, so the app's own limiter is bypassed for it; the
  backends' own limits are **not** under our control, so the budget still
  matters (OQ-2).
- **C-2** — The three cases together must not each perform an independent
  sign-in.
- **C-3** — After signing out, the cookie jar is **not** empty, and it is not
  meant to be. Three separate things live in it, and they are judged
  differently:
  - **Gone.** The per-backend session state — the chat, stories and wallet
    tokens, the comments token, and the three per-backend profiles. Signing out
    deletes them, and the guest the app registers next deletes them again, so
    nothing legitimately puts them back.
  - **Changed, not gone.** The shared auth token and its renewal token, and the
    stored profile. A signed-out visitor is a **guest**, and the app gives a
    guest all three. Their presence is correct; their **values still belonging
    to the account that signed out** is the failure. They are therefore judged
    by having changed, never by being absent.
  - **Ignored.** The short-lived sign-out marker (written on purpose, then
    cleared by the next navigation) and the language/country cookies, which were
    never part of the session.
- **C-4** — What must be **gone** follows the app's own authoritative cleanup
  list rather than a copy of it, minus the three names C-3 puts in the "changed"
  group, so a piece of session state added later is covered without the
  criterion being edited (OQ-3).
- **C-5** — The sign-out state is read only after signing out has fully settled —
  after the reload **and** after the app has registered the guest that replaces
  the signed-out shopper. That is the state a shopper is actually left in, and
  reading earlier would catch a half-finished jar (OQ-4). The reading must key on
  the guest being registered, not on a delay.
- **C-6** — No product behaviour changes. App code may gain only inert markers
  that let a control be found reliably, and only where a control cannot be
  reached without one (OQ-7).
- **C-7** — Verification requires a machine that can reach the staging search
  node directly, because the suite refuses to run at all when its own health
  check cannot reach it. That check is not relaxed, bypassed, or changed by this
  ticket; if no such machine is available, the ticket is blocked rather than the
  gate being weakened (OQ-9).
- **C-8** — A sign-in that loses a backend still succeeds by design: the app
  answers normally and leaves the shopper browsing on a partial session, because
  a dead wallet must not stop a shopper from shopping. That product behaviour
  does not change. It is the reason the coverage has to look per backend — there
  is no error for it to notice.
- **C-9** — The app already knows and already reports which backend failed. The
  coverage should say what the app says rather than guess from what is missing,
  so the failure and the error report name the same thing.
- **C-10** — **Known condition, and expected:** the wallet sign-in is failing on
  staging today. Once this coverage exists it will be red for that reason, and
  that red is a **correct result**, not a defect in the coverage and not a
  reason to soften a criterion. Fixing the wallet backend is a separate ticket.

## Edge Cases

- The sign-out control is offered only to an account that has a usable phone on
  it, so the sign-out case must start from a genuinely signed-in visitor and
  fail visibly if it did not.
- Signing out reloads the page, so a reading taken too early can describe a jar
  that is about to change (C-5).
- **Signing out leaves the visitor as a guest, and a guest is given a shared auth
  token, a renewal token and a stored profile of their own.** A criterion that
  demands those three be absent fails on correct behaviour; one that accepts them
  without checking whose they are passes while the signed-out shopper's session
  is still usable. Both mistakes are why AC-3b exists (C-3).
- Session state surviving a reload while the app no longer accepts it — the
  exact failure FR-3 exists to catch, and the reason presence alone is not
  enough.
- The stored profile turning out to carry no identity at all for this account
  (see OQ-6).
- A one-time-code send being refused by a limit, which makes a run red for a
  reason that is not a defect (C-1, NFR-3).
- Staging being unreachable, where these behave like the rest of the live
  coverage: the run is skipped or red, and that is not a pull request problem.
- A new piece of session state being added to the app's cleanup list later
  (C-4).
- **A backend losing its part of the sign-in while the shopper is signed in
  normally** — no error, no failed screen, the app working. The case that is
  true on staging today (C-10) and the one FR-5 and FR-6 exist for.
- More than one backend failing at once, where **each** of them must be named,
  not only the first one noticed.
- A sixth backend being added to the sign-in later, which must force a new check
  rather than passing unnoticed inside a group assertion (NFR-6).
- A backend answering but leaving its part of the session empty, which counts as
  not landed exactly like a backend that did not answer.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Partly answered, partly deferred. **Answered here:** the budget. The three cases together must not each sign in independently; the run spends the fewest real sign-ins the shape allows. **Deferred:** how they are arranged to stay inside that budget is an approach decision. | C-2, NFR-3 · rest → Open Questions |
| OQ-2 | Yes. The test number is on the app's test-number allowlist in the environment the suite runs with, so repeated sends skip the app's own limiter. That makes the app-side limit a non-issue, but the backends' own limits are outside our control, so OQ-1 stays a real budget question and not merely a cost one. | C-1 |
| OQ-3 | The app's own authoritative sign-out cleanup list — the one the sign-out itself uses — not a list written out inside the coverage. A copy goes stale the day a cookie is added, and a criterion that quietly stops covering a new cookie is worse than one that is harder to read. This is the scope decision; where that list is read from belongs to the approach. | C-4, AC-3 |
| OQ-4 | After — and after the app has registered the guest that replaces the signed-out shopper, because that is the state a shopper is left in. Waiting that long means three cookies the sign-out deleted are legitimately back, since a guest gets them too; they are judged by having **changed**, not by being absent. The short-lived sign-out marker and the language/country cookies are excluded entirely. | C-3, C-5, AC-3, AC-3b, AC-3c |
| OQ-5 | An authenticated signal from the app. Session state still being present is necessary but not sufficient — it would pass while the app has already stopped accepting that session, which is precisely the failure worth catching. | FR-3, AC-4 |
| OQ-6 | No reason was recorded. Commit `14d2c531` disabled the check to make a run green and its message says only that; nothing anywhere states that this account's profile lacks an identity. The criterion therefore **requires** an identity, and stands. If staging proves the profile genuinely carries none, that is a finding for the owner to decide on — the criterion is not quietly relaxed to match the data. | AC-1 |
| OQ-7 | In scope, narrowly. Adding an inert marker to app code is allowed where a control cannot otherwise be found reliably. It must change nothing a visitor can see or do. Which controls need one is an approach decision. | C-6 |
| OQ-8 | Their own range. These are signed-in journeys, not guest ones, so they get ids of their own rather than continuing the guest numbering, and every new case gets a row in the suite's scenario record. | FR-4, AC-5 |
| OQ-9 | Verification runs from a machine or runner that can reach the staging search node directly. Repairing that network path, and changing or relaxing the suite's health gate so a runner outside the allowlist can proceed, are both **out of scope** — they are their own ticket. If no such machine is available when verification is due, this ticket is blocked instead. | C-7, Out of Scope |

## Open Questions

- **OQ-10** (new, deferred) — where the per-backend judgement gets its answer:
  from what the app itself reports about each backend at sign-in (which names
  the backend for us, C-9), from the piece of session state each backend leaves
  behind, or from both. Whichever it is, FR-6 stands: the failure names the
  backend. This is an approach decision and is answered at `/plan`.
- **OQ-1** (deferred) — how the three cases are arranged so the run stays inside
  the sign-in budget set in C-2: one ordered case that shares a single signed-in
  session, a session saved once and reused, or another shape entirely. The
  budget is settled here; the arrangement is an approach decision and is
  answered at `/plan`.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | After a completed real sign-in, the stored profile is proven to carry an identity for the account that signed in — not merely proven to exist by name. | FR-1 |
| AC-2 | After a completed real sign-in, the session credential that page scripts must never read is proven to be marked unreadable by them. | FR-1 |
| AC-3 | After signing out has fully settled, every piece of per-backend session state on the app's own cleanup list is gone, and none of it is put back by the guest that replaces the signed-out shopper. | FR-2 |
| AC-3b | After signing out has fully settled, the shared auth token, its renewal token and the stored profile have all **changed** — none of them still carries the value it held for the account that signed out. Present is correct; unchanged is a failure. | FR-2 |
| AC-3c | After signing out has fully settled, the account the app now names is **not** the account that signed out, and is not phone-verified. | FR-2 |
| AC-4 | After a signed-in visitor reloads the page, the app is proven to still treat them as signed in. Session state being present is not accepted on its own as proof. | FR-3 |
| AC-5 | Every new case has a row in the suite's scenario record under an id of its own for signed-in journeys, distinct from the guest range. | FR-4 |
| AC-6 | Each of the five backends the sign-in calls is judged separately. A sign-in whose part did not land for any one of them fails the case — a partial sign-in is never reported as a pass, and no judgement is made on a count. | FR-5, NFR-6 |
| AC-7 | The failure names every backend whose part did not land, in words a reader understands without opening the coverage code (for example, that the wallet sign-in did not land while chat, stories and comments did). | FR-6 |
| AC-8 | Run against staging as it stands, the coverage reports the wallet backend by name — or, if the wallet backend has been repaired by then, reports all five as landed. Either result satisfies this criterion; a green run that says nothing about the wallet backend does not. | FR-5, FR-6 |

## Out of Scope

- Any change to product behaviour — the sign-in flow, the sign-out route, the
  request-entry file, or the menu the visitor signs out from. Inert markers that
  change nothing a visitor sees are the only permitted app-code change (C-6).
- Repairing the network path to the staging search node, and changing, relaxing
  or bypassing the suite's health gate that depends on it (OQ-9).
- Sign-up, wrong-code and other failed sign-in paths, more than one account,
  account switching, and seller or wallet journeys.
- Proving that a session is renewed or that it expires — a separate ticket owns
  that shape for guests, and this ticket makes no claim about it for a signed-in
  visitor.
- Anything about what the cart, the notifications, or the account pages contain
  once signed in.
- **Repairing the wallet sign-in**, or any other backend this coverage reports
  as broken. This ticket's job is to make the break visible and named; fixing it
  is a separate ticket (C-10).
- Changing how the app behaves when a backend is lost. It answers normally and
  leaves the shopper on a partial session on purpose, and that stays (C-8).
- Provisioning or rotating staging test accounts.
- Changes to the browser suite's continuous-integration configuration.
