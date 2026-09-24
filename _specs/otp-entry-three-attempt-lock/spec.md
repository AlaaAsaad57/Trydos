---
ticket: otp-entry-three-attempt-lock
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Spec — otp-entry-three-attempt-lock

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Three-try cap on entering a verification code.

## Business Goal

A shopper can type a wrong verification code as many times as they like. Nothing
on screen stops them, and nothing tells them they are getting it wrong. Two
things change:

1. A person cannot sit and guess a code by hand. After three wrong codes the
   boxes go dead until a new code is sent.
2. A shopper who mistypes is told how many tries are left, instead of guessing in
   the dark.

This is help for the shopper and a speed bump for a guesser. It is **not** a
security control, and the constraints below say so plainly.

## User Story

> As the Trydos team, we want the code boxes to go dead after three wrong codes,
> so that a person cannot sit and guess a code, and so that a shopper who
> mistypes is told how many tries are left.

## Functional Requirements

- **FR-1** — Every failed check of a typed code counts as one try, against the
  code that was last sent.
- **FR-2** — After the first and the second wrong code, the shopper reads how
  many tries are left, alongside the message they already get today.
- **FR-3** — After the third wrong code, the boxes stop taking input. Nothing the
  shopper types reaches the check.
- **FR-4** — When the boxes go dead, the message says the tries ran out and that
  a new code is needed. The remaining-tries wording is gone at that point.
- **FR-5** — A code that is sent again, and arrives, clears the dead state and
  gives a fresh set of three tries.
- **FR-6** — Asking for a new code stays the only way out of the dead state.
- **FR-7** — The cap applies on all three places a shopper types a code today:
  the login / signup screen, the re-verify screen (re-auth, expired session,
  changing the number in settings), and the checkout panel in the cart.
- **FR-8** — Every new word the shopper reads is available in all four languages.

## Non-Functional Requirements

- The count is held in the running screen only. Nothing is stored, and nothing
  outlives the page.
- No new request to any backend, and no change to any request that exists.
- No new analytics event, and no change to what the existing verification events
  report.
- The dead boxes look and behave like the dead boxes a shopper already sees when
  a code has run out of life. A shopper should not have to learn a second shape
  for "these boxes are finished".

## Constraints

- **C-1** — Three is fixed in the build. No environment variable, no remote
  setting, no per-screen override.
- **C-2** — Nothing about *sending* a code changes. The per-number wait and the
  session limit stay exactly as they are.
- **C-3** — The count lives in memory. A page reload starts it over, and that is
  accepted. Review found the reload is even less useful to a guesser than assumed:
  the id that ties a typed code to the sent code is also held in memory, so after
  a reload **no code can be checked at all** until a new one is sent — and sends
  are limited. Real enforcement stays on the backend and in the send limits.
- **C-4** — Every failed check counts the same, whatever the reason — a wrong
  code, a network fault, a server fault and a "too many requests" reply are not
  told apart. The owner reaffirmed this after review raised it. Its cost is
  written down in EC-9, not left implied. One exception, in C-5.
- **C-5** — **On the login / signup screen only**, a reply that says the number
  is not registered is not a wrong code. The shopper typed the right digits and
  simply has no account, so it does not spend a try. **On the re-verify screen
  and the checkout panel that same reply does spend a try**, because those two
  share a flow that has no such branch today. Adding one was offered and
  declined (OQ-7), so the difference is deliberate and AC-8 names the surface it
  applies to.
- **C-6** — The newest login design is not wired into the app and gets nothing.

## Edge Cases

- **EC-1 — Dead boxes before the new code can be asked for.** Three wrong codes
  take about ten seconds. The wait before a new code may be sent is sixty. So for
  roughly fifty seconds the boxes are dead and the shopper cannot yet ask for a
  new code. **Accepted.** The countdown to the next code is already on screen, and
  the message tells them what to wait for. No new control is added.

  **One correction that matters, found at review.** That sixty-second wait is
  counted **per internet address, not per phone number** — one code per address
  per minute, whoever asks. The countdown the shopper sees is drawn from a
  copy the browser keeps for their own number, so on an address shared by many
  people — an office, a café, a mobile network — **the countdown reaching zero
  does not mean a new code will be given.** They may ask and be refused. EC-9
  carries the full cost of this.

- **EC-2 — A known limit this ticket does not fix.** The boxes stay open for two
  minutes after a code is sent, but the backend gives a code only about one
  minute. In that second minute every code is refused because it is dead, not
  because it is wrong — and under this change each refusal spends a try. So a
  slow shopper can be locked out having never guessed. **Accepted and recorded**
  (OQ-9): the wait before a new code may be asked for ends at about the same
  moment the code dies, so the way out opens right then. Aligning the two clocks
  is a separate ticket, because it changes when a code is declared dead and needs
  the backend's real number, which nobody has confirmed.

- **EC-3 — The code runs out of life *and* the tries run out.** Both make the
  boxes dead. The shopper reads that the code has run out of life, because that
  is the older fact and it is still true.

- **EC-4 — A request for a new code fails.** The dead state stays. No new code
  arrived, so nothing has been earned back. Asking for a new code clears the
  message on screen, so the shopper is left with dead boxes and no words until the
  countdown or the send error fills the line. **Accepted as it is**: putting the
  message back was considered and cut, because the two screens ask for a new code
  through different functions and the fix would have needed a rule for which
  message wins. Not worth it for one line of text.

- **EC-5 — The boxes report a finished code twice in one moment.** That is one
  try, not two. The shopper must never lose two tries for typing once.

- **EC-6 — The on-screen keypad.** When the boxes go dead, a keypad must not be
  left standing open over them with no way to close it.

- **EC-7 — The shopper changes the number or the way the code arrives.** The next
  code that arrives is a new code, so the tries start again at three.

- **EC-8 — The shopper reloads the page.** The count starts over, but they cannot
  check a code with it: the id linking their typed code to the sent one is gone
  too, so they must ask for a new code either way. Accepted, per C-3.

- **EC-9 — A check that never got a verdict still spends a try.** This is the
  cost of C-4, and the owner accepted it with the numbers in front of him. A
  shopper who is offline, or who meets a server fault, or who is already being
  throttled, spends a try on each attempt even though nobody judged their code.
  Three of those in a row and the boxes are dead. **Today that shopper can
  simply keep typing.**

  What makes it worth writing down rather than waving through: the only way out
  is a new code, and new codes are scarce. **Both limits are counted per internet
  address, not per phone number** — one code per address per minute, and at most
  **four codes per address per hour**. On an office, café or mobile-carrier
  address that budget is shared by strangers. So a bad connection now costs a
  code; a few unlucky shoppers on one address can use up that hour's codes for
  everyone; and somebody sending codes on purpose from the same address can leave
  a locked shopper **with no way out for the rest of the hour**. That is the real
  worst case and it is stated here rather than softened.

  **A second way in, also accepted.** A code the backend *accepted* can still
  spend a try: the sign-in call does more work after the code is judged, and if
  that work throws, the app cannot tell it from a refused code. That is a fault in
  the sign-in call, not in the cap — the cap only makes it terminal instead of
  merely confusing. No `AC-n` covers it, because proving it means changing how
  that call handles its own errors. Own ticket, listed in Out of Scope.

  **Accepted, on purpose.** Telling a refused code apart from a check that never
  landed would change what the cap means, and the owner chose to keep the cap
  simple. AC-16 pins the "no verdict" half so it cannot drift by accident later.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Deferred to `/plan`.** Where the count is kept, and whether it is drawn state or a value read only inside a request, is an approach question. Research proved it cannot be the value used today, because that value never redraws the screen. The spec only requires that the count is drawn (FR-2) and that the existing analytics number keeps its own meaning (OQ-10). | Open Questions — `/plan` |
| OQ-2 | **Deferred to `/plan`.** Where the number three is written so two screens agree on it is an approach question. The spec fixes only that it is three and that it is fixed in the build. | C-1; Open Questions — `/plan` |
| OQ-3 | **Answered, in two halves.** *What is read:* after failures one and two, the existing wrong-code message plus how many tries remain; after failure three, a message that the tries ran out and a new code is needed, with the remaining-tries wording dropped. *Where it is drawn:* deferred to `/plan` — research showed one existing message slot is already watched by a browser test, and choosing it is an approach call. | FR-2, FR-4, AC-1, AC-2, AC-4; placement → `/plan` |
| OQ-4 | **Deferred to `/plan`.** Which switches make the boxes dead is an approach question, and research found a real trap: the way that looks obvious leaves the on-screen keypad open over dead boxes with no way to shut it. The spec states the outcome instead — the boxes take nothing (FR-3) and no keypad is left stranded (EC-6). | FR-3, EC-6, AC-3, AC-5; approach → `/plan` |
| OQ-5 | **Answered: accepted, no new control.** The boxes can go dead about fifty seconds before a new code may be asked for. The countdown already on screen, plus the message, is the whole answer. | EC-1, AC-10 |
| OQ-6 | **Answered: only a code that is sent and arrives clears the count.** A request for a new code that fails clears nothing. | FR-5, EC-4, AC-6, AC-7 |
| OQ-7 | **Answered by the owner: on the login / signup screen it does not spend a try.** That reply means the shopper typed the right digits and has no account. Research showed no path returns to those boxes today, so this is invisible now and protects the behaviour if such a path is added later. Review then found the criterion was written as if it held everywhere: the re-verify screen and the checkout panel share a flow with no such branch, so there it **does** spend a try, and a guest at checkout can be locked out by replies that were never wrong codes. Adding the branch was offered and **declined**. AC-8 now names the surface, and the difference is recorded rather than assumed away. | C-5, AC-8; Out of Scope |
| OQ-8 | **Answered: what the shopper already sees after a wrong code does not change.** A short moment after the third wrong code the typed digits clear, exactly as they do after the first and second, leaving empty dead boxes — the same picture a code that ran out of life gives. No new timer, no new wait. | Non-functional; AC-3, AC-11 |
| OQ-9 | **Answered by the owner: leave the clocks as they are; separate ticket.** The consequence is accepted with eyes open and is written as a named limit in EC-2, not left implied: in the second minute after a code is sent, a shopper can spend all three tries on a code the backend has already killed, without ever guessing wrong. | EC-2; Out of Scope |
| OQ-10 | **Answered: no new event, and no existing event changes.** The number the verification events already report counts every check, not only the failed ones. It is not the number this cap counts, and it must not be repointed at it. | Non-functional; AC-14 |
| OQ-11 | **Answered: nothing.** The newest login design is not wired into the app — the only thing that opens it is a demo page. | C-6; Out of Scope |
| OQ-12 | **Deferred to `/plan`.** Which suite proves the login / signup screen, and whether that needs a test file that does not exist yet, is a plan decision (PL-14). The spec requires only that all three screens in FR-7 are proved, and that none is left to a criterion no test covers. | Open Questions — `/plan` |

## Open Questions

- **OQ-1** — where the drawn count is kept, and how it stays separate from the
  number the existing analytics event reports. `/plan` decides.
- **OQ-2** — where the number three is written so the screens agree. `/plan`
  decides.
- **OQ-3 (placement half)** — which existing message slot carries both new
  messages. `/plan` decides, and must say what it does to the browser test that
  already reads that slot after three wrong codes.
- **OQ-4** — which switches make the boxes dead, without stranding the on-screen
  keypad. `/plan` decides, and must not change shared behaviour for screens that
  are not part of this ticket.
- **OQ-12** — how the login / signup screen is proved, given it has no test file
  today. `/plan` decides, and if it falls back to the browser suite it must say
  plainly that the browser suite does not gate pull requests.

No question is dropped. No new question was opened at this stage.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | After the first wrong code, the shopper reads the existing wrong-code message **and** that two tries are left, and the boxes still take input. | FR-1, FR-2 |
| AC-2 | After the second wrong code, the same message shows **one** try left. | FR-1, FR-2 |
| AC-3 | After the third wrong code, the boxes take no further input, and the digits already typed are cleared. | FR-3, OQ-8 |
| AC-4 | After the third wrong code, the shopper reads that the tries ran out and a new code is needed, and no longer reads a remaining-tries count. | FR-4 |
| AC-5 | When the boxes go dead from the cap, no on-screen keypad is left open over them. | FR-3, EC-6 |
| AC-6 | A new code that is asked for and arrives makes the boxes live again and restores three tries — a wrong code after it shows two left, not zero. | FR-5, EC-7 |
| AC-7 | A request for a new code that fails leaves the boxes dead and the count spent. | FR-5, EC-4 |
| AC-8 | **On the login / signup screen**, a reply saying the number is not registered does not reduce the tries left. On the re-verify screen and the checkout panel it does, and that difference is deliberate. | C-5 |
| AC-9 | Boxes that report a finished code twice in one moment spend one try, not two. | FR-1, EC-5 |
| AC-10 | While the boxes are dead and the wait for a new code is still running, the shopper is shown that countdown; no new unlock control exists anywhere. | FR-6, EC-1 |
| AC-11 | When the code has run out of life **and** the tries have run out, the shopper reads that the code ran out of life. | EC-3 |
| ~~AC-12~~ | **Retired before approval, id not reused.** It said a reload gives three tries again. Two reasons it went: it is green with or without the change, so it proves nothing; and review found it is not even true — a reload also wipes the verification id, so the shopper cannot check a code at all afterwards. C-3 states the memory-only design in words, which is all it needed. | — |
| AC-13 | Each of the three screens in FR-7 caps at three and goes dead, proved for each screen on its own. | FR-7 |
| AC-14 | No analytics event is added or removed, and the number the existing verification and resend events report keeps counting every check, not only the failed ones. | Non-functional, OQ-10 |
| AC-15 | Every new word the shopper reads exists in Arabic, Turkish and Kurdish. English is the key itself and has no file, so three files are checked, not four. | FR-8 |
| AC-16 | A check that fails without the backend judging the code — offline, a server fault, a "too many requests" reply — still spends a try, and three of them make the boxes dead. This pins the accepted behaviour in EC-9 so it cannot drift unnoticed. | C-4, EC-9 |

Each row is one thing that can break on its own. `plan.md` must map every row to
the test that proves it, or record `none — <reason>` for it.

## Out of Scope

- **Sending a code.** The per-number wait, the session limit, the server limiter
  and the IP rules all stay untouched.
- **Aligning the box lifetime with the backend's code lifetime** (OQ-9, EC-2). A
  separate ticket. It needs the backend's real number first.
- **The mismatch on the checkout panel** where a number with no account reads as
  a wrong code (OQ-7). It exists before this change and is declined here. Review
  noted that such a shopper can never get through however many codes they ask
  for — but that is already true today, without the cap, so the cap does not make
  it worse.
- **The sign-in call doing work after the code is judged**, so that a fault in
  that work reads as a wrong code (EC-9). A real defect, and older than this
  ticket. Own ticket.
- **The newest login design**, which nothing but a demo page opens (OQ-11).
- **Storing the count**, a lockout timer, a countdown to unlock, or an automatic
  unlock.
- **Telling a wrong code apart from a network fault** (C-4).
- **Any backend, API route or endpoint change.**
- **Reworking the login / signup screen to share the re-verify screen's flow.**
