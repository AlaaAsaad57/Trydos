---
ticket: chat-reminders-tags-archive-unread-edit
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-27
links:
  clickup:
  github:
---

# Plan — chat-reminders-tags-archive-unread-edit

> **Retroactive.** This plan records the approach that the code in `0b6ed034`
> and `7d2a11c6` took. It was written after the code, so it was never approved
> before implement. The Tests table names the tests that exist today, and says
> plainly where an `AC-n` has no test.

## Approach

Add one store action per chat backend call, each with `noMessage: true`, a
translated error toast and a `LogError` scenario. Change the store only after
the backend answers, and change the message in every place the store holds it
(list, open chat, archived list, quotes) through one `patchMessage` reducer.
Reuse what exists instead of adding new paths: the dialog is drawn like the
delete confirm box, the marks take the place of the forward icon, "Read" is the
existing `/watched` call, the jump to a reminded or tagged message is the
jump-to-quote logic moved into the store, and a missing chat is found by walking
the existing `my_channels` pages. This was chosen over a new "get one chat"
call because the chat backend has none.

## Steps

1. Add the endpoint paths, request titles and types (tags, reminder, edit mark,
   archive flag, hand-marked unread).
2. Add the store actions: `EditMessageApi`, `ToggleMessageTag`,
   `SetMessageReminder`, `CancelMessageReminder`, `GetMyReminders`,
   `ArchiveChannel`, `MarkChannelUnread`, `GetArchivedChats`,
   `GetMyChannelsPage`, `GetTaggedMessages`.
3. Add the reducers: `patchMessage`, `archiveChat`, `setArchivedChats`,
   `setUnreadChat` (rewritten), `setReminders`, `removeReminder`,
   `reminderFired`, `setJumpToMessage`; seed `marked_unread` from the backend
   counter in `setChats`; clear it in `watchChannel`.
4. Wire the message menu: Edit dialog, tag picker, reminder picker.
5. Draw the marks in every message type that had the forward icon.
6. Wire the chat row options: Unread/Read and Archive/Unarchive.
7. Add the two folder rows and their lists to the chat list, and keep archived
   chats out of the main list.
8. Add the Tagged messages block to the chat info panel.
9. Move the pending jump id from `ConversationContainer` state to the store, and
   add `openMessageInChat` for the Reminders folder.
10. Read the three meanings of `UpdatingMessageEvent`; handle
    `MessageReminderEvent` in the foreground handler and the service worker.
11. Add the translation keys to `ar`, `tr`, `ku`.
12. Write the unit tests in the Tests table.

## Files to change

Source (both commits):

- `utils/endpointConfig.tsx` — the seven new chat paths.
- `utils/Requests.ts` — request titles and codes 216–223.
- `utils/types/chat/index.ts` — `is_edited`, `tags`, `reminder`, `MyReminder`, `is_archived`, `marked_unread`.
- `store/chat/actions.tsx` — the ten actions in step 2.
- `store/chat/reducer.ts` — the reducers in step 3.
- `components/Chat/chatsFunctions.tsx` — `unreadCount`.
- `components/Chat/components/OptionsMenu.tsx` — Edit, Tag message, Reminder.
- `components/Chat/components/messages/ChatDialog.tsx` — new shared dialog.
- `components/Chat/components/messages/MessageTagPicker.tsx` — new.
- `components/Chat/components/messages/MessageReminderPicker.tsx` — new.
- `components/Chat/components/messages/MessageMarks.tsx` — new.
- `components/Chat/components/messages/messageExtras.ts` — new: tag styles, the 2038 limit, date format.
- `components/Chat/components/messages/Types/{Text,Image,Video,Audio,File,Product}Message.tsx` — draw `MessageMarks`.
- `components/Chat/components/ChatMessage.tsx` — pass `tags`, `reminder`, `is_edited`.
- `components/Chat/components/ChatOptions.tsx` — Unread/Read and Archive/Unarchive.
- `components/Chat/components/ChatItem.tsx` — pass `archived`.
- `components/Chat/components/ChatSearchResults.tsx` — use `unreadCount`.
- `components/Chat/components/ChatFolderRow.tsx` — new: folder row and folder header.
- `components/Chat/components/ArchivedChatsList.tsx` — new.
- `components/Chat/components/RemindersList.tsx` — new.
- `components/Chat/components/TaggedMessages.tsx` — new.
- `components/Chat/components/ChatInfo.tsx` — add the Tagged messages block.
- `components/Chat/components/GetMoreChats.tsx` — export `nextCursor`.
- `components/Chat/openMessageInChat.ts` — new.
- `components/Chat/pages/ChatLists.jsx` — folder rows, folder views, archived filter.
- `components/Chat/pages/ConversationContainer.tsx` — jump id from the store; `openMessage` for the info panel; pass the new fields.
- `utils/NotificationHandler.ts` — `handleUpdatingMessage`, `loadUpdatedMessage`, `handleMessageReminder`.
- `public/firebase-messaging-sw.js` — `showReminderNotification` with its own en/ar/tr/ku words.
- `public/styles/ChatWindow.css` — `.message-mark` and its tooltip.
- `public/translations/translations.{ar,tr,ku}.js` — the new keys.

Tests:

- `tests/components/Chat/components/messages/MessagePickers.test.tsx` — new.
- `tests/components/Chat/MessageOptionsEdit.test.tsx` — new.
- `tests/components/Chat/components/RemindersList.test.tsx` — new.
- `tests/components/Chat/components/TaggedMessages.test.tsx` — new.
- `tests/components/Chat/components/OptionsMenu.test.tsx` — extend.
- `tests/components/Chat/components/ChatMessage.test.tsx` — extend.
- `tests/components/Chat/pages/ChatLists.test.tsx` — extend.
- `tests/components/Chat/pages/ConversationContainer.test.tsx` — extend.
- `tests/components/Chat/DeleteChatConfirm.test.tsx` — extend (the swipe tiles).
- `tests/store/chat/reducer.test.ts` — extend.
- `tests/store/chatSendMessage.test.ts` — extend.
- `tests/utils/chatMuteNotifications.test.ts` — extend (push handler).

## Integration surface

- **Components / shared config touched:** `fetchData` (chat server, 401 rule);
  the chat slice of the one Zustand store; `UpdatingMessageEvent` in the
  foreground handler; `onBackgroundMessage` in the service worker; the three
  translation files; `setChats` and `watchChannel` in the chat reducer.
- **Who else depends on them:** every chat push goes through the same
  foreground handler and service worker. `setChats` feeds the chat list, the
  unread badge on the chat icon (`getNew`), and search. `watchChannel` runs each
  time any chat opens. The jump-to-message id is shared with the jump to a
  quoted message.
- **Overlapping flows:** delete-for-everyone shares `UpdatingMessageEvent` with
  edit and tag change. The order (delivery worker) chat shares `patchMessage`
  through the open chat. Pin, mute and delete share the swipe row with archive
  and unread.
- **Ordering / lockstep dependencies:** the chat backend must ship the new
  endpoints and the `archived` filter on `my_channels` before this reaches
  users. The translation keys must land with the code, or `pnpm lint` fails.
- **What breaks if this is wrong:** reading an edit push as a delete removes the
  message for the other member. An archived chat that is not in `state.data`
  gets no live messages (see `implement.md > Findings`, F-1). An error in the
  service worker's reminder branch is caught by `onBackgroundMessage`, so the
  due reminder shows nothing and no other surface tells the user.

## Tests

| AC    | Existing coverage found | Disposition | Test file | Test case / name |
|-------|-------------------------|-------------|-----------|------------------|
| AC-1  | own / other / unsaved / file cases | existing | `tests/components/Chat/MessageOptionsEdit.test.tsx`; `tests/components/Chat/components/OptionsMenu.test.tsx` | "offers Edit on a message I sent"; "does not offer Edit on a message the other person sent"; "offers no Edit, Tag or Reminder on a message that is still sending"; "hides Forward in an order chat and Copy/Edit on a file" |
| AC-2  | none — searched `tests/components/Chat/**` for the disabled Save state | none — gap: no test checks that Save is disabled for empty or unchanged text | — | — |
| AC-3  | action + marks | existing | `tests/store/chatSendMessage.test.ts`; `tests/components/Chat/MessageOptionsEdit.test.tsx` | "EditMessageApi sends the new text and stores the edited message, not its reminder"; "shows the edited, reminder and tag icons where the forward icon sits, each with its own tooltip" |
| AC-4  | reducer | existing | `tests/store/chat/reducer.test.ts` | "patchMessage changes one message in the list and the open chat, and the quotes of it" |
| AC-5  | action + dialog | existing | `tests/store/chatSendMessage.test.ts`; `tests/components/Chat/components/OptionsMenu.test.tsx` | "EditMessageApi tells the user when the chat backend refuses the edit"; "keeps the edit box open with the text when the chat backend refuses the edit" |
| AC-6  | unsaved + call cases | existing | `tests/components/Chat/components/OptionsMenu.test.tsx` | "offers no Edit, Tag or Reminder on a message that is still sending"; "offers only Delete, and a call can be deleted only for me" |
| AC-7  | picker | existing | `tests/components/Chat/components/messages/MessagePickers.test.tsx` | "marks only the tags I put on the message" |
| AC-8  | picker + action | existing | `MessagePickers.test.tsx`; `tests/store/chatSendMessage.test.ts` | "toggles the pressed tag on the chat backend and stays open"; "ToggleMessageTag toggles the tag and stores the full tag list" |
| AC-9  | action | existing | `tests/store/chatSendMessage.test.ts` | "ToggleMessageTag tells the user when the tag change fails" |
| AC-10 | quick choice + action; the custom-time success path has no test | existing | `MessagePickers.test.tsx`; `tests/store/chatSendMessage.test.ts` | "sets a quick choice about an hour from now and closes"; "SetMessageReminder sends the time in ISO form, stores the reminder and reloads my list" |
| AC-11 | picker | existing | `MessagePickers.test.tsx` | "refuses a time in the past without asking the chat backend" |
| AC-12 | picker | existing | `MessagePickers.test.tsx` | "refuses a time the chat backend cannot store (2038 and later)" |
| AC-13 | picker + action | existing | `MessagePickers.test.tsx`; `tests/store/chatSendMessage.test.ts` | "shows the reminder the message has, and cancels it by its id"; "CancelMessageReminder deletes by the reminder id and clears it everywhere"; "CancelMessageReminder clears a reminder the chat backend no longer has (404), with no error" |
| AC-14 | picker | existing | `MessagePickers.test.tsx` | "stays open when the chat backend refuses the reminder" |
| AC-15 | marks | existing | `tests/components/Chat/MessageOptionsEdit.test.tsx`; `tests/components/Chat/components/ChatMessage.test.tsx` | "shows the edited, reminder and tag icons …"; "does not open the message menu when a mark is tapped for its tooltip"; "hands the tags and my reminder to every other type that can carry them" |
| AC-16 | action + reducer + tile | existing | `tests/store/chatSendMessage.test.ts`; `tests/store/chat/reducer.test.ts`; `tests/components/Chat/DeleteChatConfirm.test.tsx` | "ArchiveChannel sends 1 or 0, never a boolean, and moves the chat"; "ArchiveChannel leaves the chat where it is when the chat backend refuses"; "archiveChat moves a chat to the archived list and back, and keeps it open"; "marks an unread chat read, and unarchives an archived chat" |
| AC-17 | list | existing | `tests/components/Chat/pages/ChatLists.test.tsx` | "keeps an archived chat out of the list and opens it from the Archived folder" |
| AC-18 | action + list + tile | existing | `tests/store/chatSendMessage.test.ts`; `ChatLists.test.tsx`; `DeleteChatConfirm.test.tsx` | "MarkChannelUnread tells the chat backend, then marks the chat"; "draws a chat I marked unread as unread, with a count of 1"; "marks an unread chat read, and unarchives an archived chat" |
| AC-19 | reducer | existing | `tests/store/chat/reducer.test.ts` | "setChats marks a chat unread when its counter says so but no message is unread"; "watchChannel clears the unread mark, in my list and in the archived list" |
| AC-20 | list | existing | `ChatLists.test.tsx` | "shows both folders even when they hold nothing"; "asks the chat backend again each time a folder opens" |
| AC-21 | folder | existing | `tests/components/Chat/components/RemindersList.test.tsx` | "opens the chat on screen at a message that is already loaded"; "loads the messages up to one far up the chat, with a spinner, before it shows the chat"; "finds a chat the list has not loaded yet, and opens it"; "says so, and stays on the list, when the chat cannot be found" |
| AC-22 | none — searched `RemindersList.test.tsx`; the action is tested (AC-13) but not the row's cross button | none — gap: no test taps the cross on a reminder row | — | — |
| AC-23 | block + action + container | existing | `tests/components/Chat/components/TaggedMessages.test.tsx`; `tests/store/chatSendMessage.test.ts`; `tests/components/Chat/pages/ConversationContainer.test.tsx` | "shows a spinner on the tapped row until the jump to the message is done"; "GetTaggedMessages asks the chat's messages with one tag"; "keeps the details open while a tagged message loads, then closes them and scrolls to it" |
| AC-24 | push handler | existing | `tests/utils/chatMuteNotifications.test.ts` | "puts an edited message in place and keeps it"; "never overwrites my reminder with the one in the push"; "still deletes a message the sender deleted for everyone"; "loads a compact edit push from the chat backend, then puts it in place"; "deletes a compact push whose message the chat backend no longer has" |
| AC-25 | push handler + reducer | existing | `tests/utils/chatMuteNotifications.test.ts`; `tests/store/chat/reducer.test.ts` | "shows the reminder in a visible tab and takes it off the message"; "leaves a hidden tab to the service worker's system card"; "reminderFired takes the reminder off the message and out of my list" |
| AC-26 | none — `public/firebase-messaging-sw.js` has no unit test in `tests/` | none — gap: the service worker is not covered by the unit suite | — | — |
| AC-27 | each action test asserts `noMessage: true` in the call | existing | `tests/store/chatSendMessage.test.ts` | the `EditMessageApi`, `ToggleMessageTag`, `SetMessageReminder`, `CancelMessageReminder`, `ArchiveChannel`, `MarkChannelUnread` cases |
| AC-28 | parity check, not a test | none — proven by the `lint` check (i18n rule) in the profile below, and by `pnpm lint:i18n-parity` | — | — |

## Validation strategy

- Validation profile: `logic-change` (lint, typecheck, unit-tests).
- Profile source: `pre-existing`.
- `lint` carries the i18n rule, so it proves AC-28 for keys used in code. Run
  `pnpm lint:i18n-parity` too; the profile does not name it.
- The unit tests run with `vitest run` (`pnpm test:run`).
- AC-2, AC-22 and AC-26 have no test. `/verify` must judge them as not covered,
  not as passed.

## Rollback

- Revert `7d2a11c6`, then `0b6ed034`, on `development`. Neither touches a
  protected runtime path. `8564e64e` came between them and also changed
  `ChatInfo.tsx` and `MessagePickers.test.tsx`, so the revert of `0b6ed034` may
  need those two files fixed by hand. The chat backend endpoints can stay; the
  old web code never calls them.

## Out of scope

- Everything in `spec.md > Out of Scope`.
- Fixing the findings F-1 to F-6 in `implement.md`. Each needs its own ticket and
  a failing test first.
