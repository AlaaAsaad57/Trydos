---
ticket: chat-reminders-tags-archive-unread-edit
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-27
links:
  clickup:
  github:
---

# Implement — chat-reminders-tags-archive-unread-edit

> **Retroactive.** The code was written and committed before this ticket
> existed. This file records what the two commits contain.

## Changes made

- `0b6ed034` (2026-09-26) — feat(chat): message edit, tags and reminders; chat
  archive and unread. 45 files. Steps 1–8, 10–12 of `plan.md`.
- `7d2a11c6` (2026-09-27) — feat(chat): open a reminder or a tagged message at
  the message. 19 files. Step 9 of `plan.md`, plus: the folder rows always show
  with their count; each folder asks the chat backend again when it opens; the
  tagged-message row shows a spinner and the panel stays open until the jump is
  done; the "Copy message text" label is translated.

## Changes prepared (uncommitted)

- none. Both commits are already on `development`.

## Deviations from plan

- **The plan came after the code.** No spec, plan or review existed when the
  code was written. `ticket.md` records the review stage as skipped.
- **No ticket branch and no PR.** Both commits went straight onto
  `development`, not through `ticket/<slug>` and `/wf:publish-pr`.
- **`8564e64e` is not part of this ticket**, though it sits between the two
  commits. It changed English title case, the call bubble, and the chat info
  panel (it removed the "Save To Gallery / Never" row). It touched
  `MessagePickers.test.tsx` only to update English text.

## Tests written

| AC    | Test file | Test case | Disposition carried out |
|-------|-----------|-----------|-------------------------|
| AC-1  | `MessageOptionsEdit.test.tsx`; `OptionsMenu.test.tsx` | see `plan.md > Tests` | new; extend |
| AC-2  | — | — | none — gap |
| AC-3  | `chatSendMessage.test.ts`; `MessageOptionsEdit.test.tsx` | see `plan.md > Tests` | extend; new |
| AC-4  | `tests/store/chat/reducer.test.ts` | see `plan.md > Tests` | extend |
| AC-5  | `chatSendMessage.test.ts`; `OptionsMenu.test.tsx` | see `plan.md > Tests` | extend |
| AC-6  | `OptionsMenu.test.tsx` | see `plan.md > Tests` | extend |
| AC-7  | `MessagePickers.test.tsx` | see `plan.md > Tests` | new |
| AC-8  | `MessagePickers.test.tsx`; `chatSendMessage.test.ts` | see `plan.md > Tests` | new; extend |
| AC-9  | `chatSendMessage.test.ts` | see `plan.md > Tests` | extend |
| AC-10 | `MessagePickers.test.tsx`; `chatSendMessage.test.ts` | see `plan.md > Tests` (custom-time success not covered) | new; extend |
| AC-11 | `MessagePickers.test.tsx` | see `plan.md > Tests` | new |
| AC-12 | `MessagePickers.test.tsx` | see `plan.md > Tests` | new |
| AC-13 | `MessagePickers.test.tsx`; `chatSendMessage.test.ts` | see `plan.md > Tests` | new; extend |
| AC-14 | `MessagePickers.test.tsx` | see `plan.md > Tests` | new |
| AC-15 | `MessageOptionsEdit.test.tsx`; `ChatMessage.test.tsx` | see `plan.md > Tests` | new; extend |
| AC-16 | `chatSendMessage.test.ts`; `reducer.test.ts`; `DeleteChatConfirm.test.tsx` | see `plan.md > Tests` | extend |
| AC-17 | `ChatLists.test.tsx` | see `plan.md > Tests` | extend |
| AC-18 | `chatSendMessage.test.ts`; `ChatLists.test.tsx`; `DeleteChatConfirm.test.tsx` | see `plan.md > Tests` | extend |
| AC-19 | `reducer.test.ts` | see `plan.md > Tests` | extend |
| AC-20 | `ChatLists.test.tsx` | see `plan.md > Tests` | extend |
| AC-21 | `RemindersList.test.tsx` | see `plan.md > Tests` | new |
| AC-22 | — | — | none — gap |
| AC-23 | `TaggedMessages.test.tsx`; `chatSendMessage.test.ts`; `ConversationContainer.test.tsx` | see `plan.md > Tests` | new; extend |
| AC-24 | `chatMuteNotifications.test.ts` | see `plan.md > Tests` | extend |
| AC-25 | `chatMuteNotifications.test.ts`; `reducer.test.ts` | see `plan.md > Tests` | extend |
| AC-26 | — | — | none — gap |
| AC-27 | `chatSendMessage.test.ts` | see `plan.md > Tests` | extend |
| AC-28 | — (`pnpm lint`, `pnpm lint:i18n-parity`) | — | none — check, not a test |

## Findings — confirmed bugs, out of scope

> Found on 2026-09-27 by reading the code. **None of these is confirmed by a
> test yet**, so none carries a `BUG-n` id. The repository rule is that each
> needs a test that fails because of it before any fix. Each one needs its own
> ticket.

| ID  | Scenario that is wrong | Confirming test | Where it lives | Ticket |
|-----|------------------------|-----------------|----------------|--------|
| F-1 | An archived chat is open, and the other member sends a message. The message does not appear in the open chat, and the chat is not marked read. The same happens right after the user archives the chat that is open. Cause: `handleChatMessage` adds a pushed message to the store only when the chat is in `state.data`; an archived chat is not there, so it only reloads the main list. | none yet | `utils/NotificationHandler.ts` `handleChatMessage` | _(opened by the owner)_ |
| F-2 | A muted archived chat gets a message while no chat is open. An in-app toast shows. Cause: mute is read from the chat found in `state.data`; an archived chat is not found, so it counts as not muted. | none yet | `utils/NotificationHandler.ts` `handleChatMessage` (`isChannelMutedForMe(chatExists, …)`) | _(opened by the owner)_ |
| F-3 | A new message in an archived chat does not update that chat's row, unread count, or last message in the Archived folder until the folder is opened again. | none yet | `utils/NotificationHandler.ts`; `store/chat/reducer.ts` (no path writes a push into `archivedChats`) | _(opened by the owner)_ |
| F-4 | If the chat backend un-archives a chat on a new message (OQ-2, not known), the web app keeps it hidden from the main list until the Archived folder is opened again, because `ChatLists.jsx` hides every id in the old `archivedChats`. | none yet; depends on OQ-2 | `components/Chat/pages/ChatLists.jsx` | _(opened by the owner)_ |
| F-5 | Search does not look in archived chats. The other person of an archived chat shows as a new contact, not as the existing chat. | none yet | `components/Chat/chatSearch.ts`; `ChatSearchResults.tsx` (searches `state.data` only) | _(opened by the owner)_ |
| F-6 | A reminder in an archived chat outside the first 50 archived chats says "Could not open the chat": `GetArchivedChats` loads 50 with no paging, and the page walk in `openMessageInChat` reads non-archived pages only. | none yet | `store/chat/actions.tsx` `GetArchivedChats`; `components/Chat/openMessageInChat.ts` | _(opened by the owner)_ |

## Validation run during implementation

- 2026-09-27, while writing this record:
  `npx vitest run tests/components/Chat tests/store/chat tests/store/chatSendMessage.test.ts tests/utils/chatMuteNotifications.test.ts`
  — 55 files passed; 649 tests passed, 1 expected fail. The expected fail is
  `SearchResult.test.tsx` "BUG-chat-8", which is not part of this ticket.
- `pnpm lint`, typecheck, `pnpm lint:i18n-parity` and the full unit suite were
  **not** run for this record. `/wf:verify` runs them through the
  `logic-change` profile.
