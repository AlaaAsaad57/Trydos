---
ticket: chat-duplicate-contact-highlight
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-10-04
links:
  clickup:
  github:
---

# Spec — chat-duplicate-contact-highlight

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Add contact: show and mark the contact that already has the typed number.

## Business Goal

A shopper who types a number that is already saved sees a warning today, but
cannot see **which** contact in the list has that number. The warning may even
show a name that no row in the list shows. So the shopper may think the
contact is missing, or try again under another name. When the matching contact
is moved to the top and framed, and the warning uses the same name as that row,
the shopper sees at once who it is.

## User Story

> As a shopper adding a contact in the chat widget, I want the contact that
> already has the number I typed to be shown first and framed in red, under the
> same name the warning uses, so that I can see at once who it is and I do not
> add the same person again.

## Functional Requirements

- **FR-1 — Move to the top.** While the typed number belongs to a saved
  contact, the list draws that contact's row first, directly under the form.
- **FR-2 — Red frame.** While the typed number belongs to a saved contact, that
  contact's row has a red frame. No other row has the frame.
- **FR-3 — The mark is steady.** The frame stays for as long as the typed
  number matches. It does not fade, and it does not restart while the shopper
  keeps typing a number that still matches the same contact.
- **FR-4 — The mark goes away.** When the typed number no longer matches a saved
  contact (changed, cleared, or the form is closed), the frame is removed and
  the row goes back to its normal place.
- **FR-5 — The mark follows the match.** When the typed number changes from one
  saved contact's number to another's, only the new contact is moved and
  framed.
- **FR-6 — One name.** The warning ("Already saved as <name>") shows the same
  name that the matching row shows in the list. This holds for a contact the
  shopper already chats with, and for one with no chat yet.
- **FR-7 — Red warning.** The warning line and the phone field are red, not
  orange.
- **FR-8 — Still refused.** A number that is already saved still cannot be
  added: Confirm stays off, and nothing is sent to the chat backend.
- **FR-9 — Every number format.** The match works for every format the form
  already accepts for a duplicate (for example with or without the local `0`).
  The row that the list draws for that person is the one marked, even when the
  person is saved more than once in different formats.
- **FR-10 — The phone import is unchanged.** After **Get from your contacts**,
  contacts that were already saved still move to the top and get the short
  flash, as today.
- **FR-11 — Tester guide.** The tester guide case for adding a number you
  already have says what the shopper now sees: the warning in red with the row's
  name, and the row first in the list with a red frame.

## Non-Functional Requirements

- **NFR-1 — Visible without motion.** The mark is a steady frame, not an
  animation, so it is visible on a device with reduced motion turned on.
- **NFR-2 — No backend call.** Finding and marking the contact uses only the
  contacts and chats the app already holds. No new request is made while the
  shopper types.
- **NFR-3 — No jump.** Typing in the form does not scroll the list.

## Constraints

- No new user-visible text. The warning keeps its existing translated wording.
  If any new text is needed after all, it is translated into ar, tr and ku
  before use.
- The behaviour of the phone import does not change (FR-10).
- Every bug fix to existing behaviour is proved by a test that fails before the
  fix (CLAUDE.md, "Every bug is confirmed by a test").

## Edge Cases

- **Person saved twice in two formats** (for example `+963 944 555 666` and
  `0944555666`). The list draws one row for that person; that row is the one
  marked (FR-9).
- **Contact with a chat vs. without.** The list draws a chat row for the first
  and a contact row for the second. Both kinds can be moved and framed (FR-1,
  FR-2), and the warning name follows the kind of row (FR-6).
- **A chat row with no chat name.** The row falls back to the other person's
  account name, then the phone. The warning uses the same fallback (FR-6).
- **Number typed, then changed to another saved number** (FR-5).
- **Number typed, then the form closed without saving** (FR-4).
- **Text in the chat search box.** The list shows search results instead of the
  contact list. The search results are not marked (Out of Scope).

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Move to the top and draw a frame.** Owner's choice, 2026-10-04. The frame is a new steady mark, not the import's fading flash. | FR-1, FR-2; AC-1, AC-2 |
| OQ-2 | **As long as the warning shows.** The mark goes away when the number no longer matches or the form closes. Owner's choice, 2026-10-04. | FR-3, FR-4, FR-5; AC-3, AC-4, AC-5 |
| OQ-3 | **Fixed in this ticket:** the warning shows the same name as the matching row. Owner's choice, 2026-10-04. | FR-6; AC-6, AC-7 |
| OQ-4 | **Red.** The warning line, the phone field and the row frame are all red. Owner's choice, 2026-10-04. | FR-2, FR-7; AC-2, AC-8 |
| OQ-5 | **The marked row is the row the list draws for the matched person, in any number format** — the same "same person" idea the form already uses to find the duplicate. The import's own matching stays as it is. How the match is carried to the list is the plan's choice. | FR-9, FR-10; AC-10, AC-11 |
| OQ-6 | **No scroll.** The form is the first item of the list, so a row moved to the top is directly under it. Scrolling on each keystroke would make the list jump. | NFR-3; Out of Scope |
| OQ-7 | **Yes.** The import and the form share the list's marking, and the import has no test today. A regression check proves the import still moves and flashes its rows. | FR-10; AC-11 |
| OQ-8 | **TC-D-03 changes; TC-D-04 does not**, because the import behaviour does not change. | FR-11; AC-12 |

## Open Questions

- None. Every `OQ-n` is answered above.

## Acceptance Criteria Mapping

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | With a saved number typed into the form, the matching contact's row is the first row of the list, for both a contact with a chat and one without. | FR-1 |
| AC-2  | With a saved number typed, the matching row has a red frame, and no other row has one. | FR-2, OQ-4 |
| AC-3  | The frame is a steady style, not an animation: it is still there after more than 3 seconds. A change to the typed number that still matches the same contact (for example adding or removing the local `0`) does not remove it. | FR-3, NFR-1 |
| AC-4  | After the number is changed to one that is not saved, or cleared, or the form is closed, no row has the frame and the rows are in their normal order. | FR-4 |
| AC-5  | After the number is changed from contact A's number to contact B's number, B is first and framed, and A is not framed. | FR-5 |
| AC-6  | For a contact the shopper already chats with, the warning shows the same name as that contact's chat row (in the screenshot case: the chat's name, not the account name). | FR-6 |
| AC-7  | For a contact with no chat, the warning shows the same name as that contact's row. | FR-6 |
| AC-8  | The warning line and the phone field are red, not orange. | FR-7 |
| AC-9  | With a saved number typed, Confirm is off and no save request is sent to the chat backend. | FR-8 |
| AC-10 | For a person saved twice in two formats, typing either format marks the one row the list draws for that person. | FR-9 |
| AC-11 | After the phone import finds contacts that were already saved, those contacts still move to the top and get the short flash (regression). | FR-10 |
| AC-12 | The tester guide case for adding a number you already have describes the red warning with the row's name and the red-framed row at the top. | FR-11 |

## Out of Scope

- Marking contacts inside chat **search results** (when the search box has
  text).
- Scrolling the list when a duplicate is found (OQ-6).
- Any change to how the **phone import** matches, moves or flashes contacts,
  beyond keeping it working (FR-10).
- Changing which name a **list row** shows. Only the warning follows the row.
- Changing how the chat backend stores names (`channel_name`, account name,
  contact name).
- The browser (e2e) suite. No e2e case covers this form, and the change can be
  proved in the unit suite.
