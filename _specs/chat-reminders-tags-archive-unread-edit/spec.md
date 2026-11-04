---
ticket: chat-reminders-tags-archive-unread-edit
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-27
links:
  clickup:
  github:
---

# Spec — chat-reminders-tags-archive-unread-edit

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**
>
> **Retroactive.** Each `AC-n` below describes what the shipped code does, as
> read on 2026-09-27. Where the source ticket said something the code does not
> do, the `AC-n` follows the code, and the gap is named under Out of Scope or
> Open Questions.

## Feature Name

Chat — message edit, tags and reminders; chat archive and unread.

## Business Goal

Busy chat users (shoppers and sellers) can fix a sent message, mark the messages
that matter, get reminded of them on time, and keep the chat list short.

## User Story

> As a chat user (shopper or seller), I want to edit my own text messages, tag a
> message, set a reminder on a message, archive a chat, and mark a chat as
> unread, so that I can fix my mistakes, find important messages again, and keep
> my chat list clean.

## Functional Requirements

- **FR-1 Edit.** I can change the text of my own saved text message.
- **FR-2 Tag.** I can put or take off my tag (Urgent, Important, To do, Done) on
  any saved message that is not a call.
- **FR-3 Reminder.** I can set, move or cancel my own reminder on any saved
  message that is not a call, and I am told when it is due.
- **FR-4 Archive.** I can move a chat out of my main list into an Archived
  folder, and back.
- **FR-5 Unread.** I can mark a read chat as unread, and an unread chat as read.
- **FR-6 Folders.** The chat list shows a Reminders folder and an Archived
  folder.
- **FR-7 Tagged messages.** The chat info panel lists the messages of the chat
  that carry a chosen tag, and opens the chat at one.
- **FR-8 Marks.** A message shows small icons for forwarded, edited, my
  reminder, and tagged.
- **FR-9 Live changes.** An edit or tag change by the other member shows without
  a reload.

## Non-Functional Requirements

- **NFR-1** All new text exists in `en`, `ar`, `tr`, `ku`.
- **NFR-2** The chat backend's own English text never reaches the screen.
- **NFR-3** Every failed call is reported to Sentry with a scenario that names
  the action.
- **NFR-4** The store changes only after the chat backend confirms.

## Constraints

- Archive, unread and reminders are personal to the user. Tags are shared.
- The chat backend has no call for one chat by id.
- The chat backend refuses reminder times from 2038-01-19 on.
- No new analytics event.

## Edge Cases

- A message that is still sending (no id yet) cannot be edited, tagged or
  reminded.
- A reminder that fired, or was cancelled on another device, answers 404 on
  cancel.
- A reminder's chat or message may not be loaded yet.
- A large edit push arrives "compact", with ids only.
- An edit must reach the quotes of the edited message.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | `CHAT_API_CHANGES.md` says "Only the sender can edit". The status code is not written there and was not tested. The web app hides the option on other users' messages. | AC-1; the backend status stays an Open Question |
| OQ-2 | Not written in `CHAT_API_CHANGES.md`, and not tested on staging. | Open Questions (OQ-2) |
| OQ-3 | In the backend counter. A chat whose counter says unread, with no unread message loaded, is drawn as marked unread. So the mark survives a reload and shows on every device. | AC-19 |
| OQ-4 | Each new call asks the fetch layer not to show the backend message; the caller shows its own translated text. | AC-27 |
| OQ-5 | A visible tab shows the in-app chat toast. When no tab is visible, the background worker shows a system notification. | AC-25, AC-26 |
| OQ-6 | Walk the chat pages (up to 500 chats) until the chat turns up; say "Could not open the chat" when it does not. | AC-21 |

## Open Questions

- **OQ-2** (carried): does a new message un-archive a chat on the chat backend?
- **OQ-1** (part): which status does the chat backend answer to an edit of
  another user's message?

## Acceptance Criteria Mapping

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | **Edit** shows only on my own, saved, text message. | FR-1 |
| AC-2  | Edit Save is disabled when the text is empty or the same as before. | FR-1 |
| AC-3  | A saved edit shows the new text and the Edited mark, and keeps my reminder on the message. | FR-1, FR-8 |
| AC-4  | An edit also changes the text inside every quote of that message. | FR-1 |
| AC-5  | A refused edit shows "Failed to edit the message" and keeps the edit dialog open with the text. | FR-1, NFR-4 |
| AC-6  | **Tag message** and **Reminder** show on a saved message; a message still sending shows neither; a call message shows only Delete. | FR-2, FR-3 |
| AC-7  | The tag picker lists the four fixed tags with a count each, and ticks only the tags I put on the message. | FR-2 |
| AC-8  | A tap on a tag toggles it on the chat backend, stores the full tag list it answers, and keeps the picker open. | FR-2 |
| AC-9  | A refused tag change shows "Failed to update the tag". | FR-2, NFR-4 |
| AC-10 | A quick choice or a custom time sends the time in ISO form, stores the reminder, reloads my reminder list, and closes the picker. | FR-3 |
| AC-11 | A past or invalid time shows "Choose a time in the future" and sends nothing. | FR-3 |
| AC-12 | A time after 18 Jan 2038, 23:59 shows "Choose an earlier time" and sends nothing. | FR-3 |
| AC-13 | The picker shows the reminder the message has, and **Cancel reminder** cancels it by the reminder id; a 404 counts as done. | FR-3 |
| AC-14 | A refused reminder shows "Failed to set the reminder" and keeps the picker open. | FR-3, NFR-4 |
| AC-15 | A message shows the forwarded, edited (text only), reminder and tag icons next to its time, each with its own tooltip; a tap on an icon does not open the message menu. | FR-8 |
| AC-16 | **Archive** sends `archived: 1` and moves the chat from the main list to the Archived folder; **Unarchive** sends `0` and moves it back; a refused change leaves the chat where it was. | FR-4, NFR-4 |
| AC-17 | An archived chat stays out of the main list and opens from the Archived folder. | FR-4, FR-6 |
| AC-18 | **Unread** tells the chat backend, then draws the chat as unread with a count of 1; on an unread chat the option reads **Read** and marks it read. | FR-5 |
| AC-19 | A chat whose backend counter says unread, with no unread message loaded, is drawn as marked unread; opening it clears the mark in the main list and the archived list. | FR-5 |
| AC-20 | The Reminders and Archived folder rows always show with their counts, and each folder asks the chat backend again when it opens. | FR-6 |
| AC-21 | A tap on a reminder opens its chat scrolled to the message: it loads the messages up to it first, finds a chat the list has not loaded, and says "Could not open the chat" when the chat cannot be found. | FR-3, FR-6 |
| AC-22 | The cross on a reminder row cancels that reminder. | FR-3, FR-6 |
| AC-23 | The Tagged messages block asks the chat backend for the chat's messages with the chosen tag; a tap on one keeps the panel open with a spinner until the messages up to it load, then closes the panel and scrolls to it. | FR-7 |
| AC-24 | An edit or tag-change push from the other member replaces the message in place and never overwrites my reminder; a delete-for-everyone push still deletes; a compact push is loaded from the chat backend first. | FR-9 |
| AC-25 | A due reminder, in a visible tab, shows the in-app chat toast and takes the reminder off the message and out of my list. | FR-3 |
| AC-26 | A due reminder, with no tab visible, shows a system notification titled "Reminder: <sender>" in the user's language. | FR-3 |
| AC-27 | Every new chat backend call asks the fetch layer not to show the backend's own message. | NFR-2 |
| AC-28 | Every new user-visible string has an `ar`, `tr` and `ku` translation. | NFR-1 |

## Out of Scope

- The mobile app.
- Editing a message that is not text.
- Custom tag names.
- Paging in the Archived folder: it loads the first 50 archived chats only.
- More than 50 messages in the Tagged messages list.
- Searching archived chats.
- Opening the reminded message from the reminder toast or the system
  notification: the toast opens the chat at its newest message, and the system
  notification opens the home page.
- Keeping an open archived chat live when a new message arrives (see
  `implement.md > Findings`, F-1).
- A browser (e2e) test for these features.
