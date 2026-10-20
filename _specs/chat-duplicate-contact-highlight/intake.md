---
ticket: chat-duplicate-contact-highlight
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-10-04
links:
  clickup:
  github:
---

# Intake — chat-duplicate-contact-highlight

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- Slug: `chat-duplicate-contact-highlight`
- Source: a tester's annotated screenshot, shared by the owner in the
  conversation on 2026-10-04. No ClickUp task and no GitHub issue yet.

## Ticket Summary

In the chat widget, **Add a new contact** finds a phone number that is already
saved and says so ("Already saved as <name>"). But the contact list below the
form does not show which contact is the duplicate. The shopper wants the
existing contact moved to the top of the list, or marked (for example with a red
border), so they can see it at once.

## Ticket Metadata

- id / slug: `chat-duplicate-contact-highlight`
- title: Add contact: mark the existing contact when the number is already saved
- owner: developer
- created: 2026-10-04
- links: none

## What the tester reported

The tester's note on the screenshot is in Arabic. In English it says:

> This is an attempt to add a name that already exists. The message "name
> already saved" appeared. But the name did not appear at the top of the list,
> and it did not appear inside a red frame that points to it (because the search
> is by number). It may be an attempt to add it under a different name. So it
> should appear at the top of the list, or get a red frame, or the name should be
> marked, to make it easier and clearer.

What the screenshot shows:

- Contact name typed: "زرال". Phone: `+963` and `984902640`.
- The phone field turns orange. Under it: "محفوظ بالفعل باسم **qussai2**"
  ("Already saved as qussai2"). The Confirm button is off.
- The same person is in the list below, as the row **"قصي بدوي"**, in its normal
  place (fourth row). Nothing marks that row.
- On the other person's phone the same contact shows as "قصي", number
  `963984902640`.

## User Story

> As a shopper adding a contact in the chat widget, I want the contact that
> already has this number to be shown and marked in the list, so that I can see
> at once who it is and I do not try to add the same person again.

## Acceptance Criteria Presence Check

- Present? no
- Notes: The tester gives the wanted result, not criteria. The tester offers
  three ways: move the row to the top, a red frame, or a marked name. One choice
  (or a mix) must be decided in `spec`.

## Test Cases Presence Check

- Present? no
- Notes: `tester guide/chat.md` TC-D-03 covers the duplicate warning today. Its
  expected result is only "An orange line appears: 'Already saved as <the old
  name>'. The confirm button stays disabled." That case will need a new expected
  result once this change is decided.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **No.** The
  current behaviour is already understood.
- Is the goal to *choose between options*? **No.** The tester names the possible
  ways; picking one is a normal `spec` decision, not a research decision.
- Does a command reproduce behaviour that contradicts a *sourced* expectation?
  **No.** The only source, `tester guide/chat.md` TC-D-03, expects exactly what the
  app does now: an orange line and a disabled button. Marking the list row is new
  behaviour, so this is not a `hotfix`. Also, every backend host is staging, so
  there is no production incident.
- Is the change to make already known, leaving only building it? **Yes.** Show
  the existing contact in the list when the add form finds a duplicate.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `asked` |
| ClickUp field said | — |
| Argument said | — (`/wf:start` ran with no argument; the owner picked `development` when asked) |

## Missing Information

These do not block the start of `research`. Research and spec must answer them.

- **Which marking?** Move the row to the top, a red frame, a marked name, or a
  mix. The tester accepts any of them. The phone-import path already moves
  "already saved" rows to the top and makes them flash once. Should the manual
  add path reuse that same look?
- **Which name should the warning show?** The warning says "qussai2", but the
  list row says "قصي بدوي". The shopper cannot match the two. Is a fix to the
  shown name in scope for this ticket, or a separate one?
- **Warning colour.** The warning is orange today; the tester's note speaks of
  red. Is the colour part of this change?
- **When does the mark go away?** For example: when the number changes, when the
  form closes, or after a time.

## Readiness Status

`READY`

- Justification: The problem is clear and can be reproduced on staging: type a
  saved number into **Add a new contact** and look at the list. The wanted result
  is clear in outline. The open points above are design choices for `spec`, not
  missing facts that stop `research` from starting.
