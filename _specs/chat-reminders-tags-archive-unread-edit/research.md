---
ticket: chat-reminders-tags-archive-unread-edit
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-27
links:
  clickup:
  github:
---

# Research — chat-reminders-tags-archive-unread-edit

> Read-only phase. **No implementation is allowed in this command.**
>
> **Retroactive.** This research was done on 2026-09-27 by reading the shipped
> code and the diffs of `0b6ed034` and `7d2a11c6`. It records the facts the
> spec and plan rest on.

## Goal

Make the five inert chat controls (edit, tag, reminder, archive, unread) work
against the chat backend, in all four languages.

## Relevant directories

- `components/Chat/components/` — the message menu (`OptionsMenu.tsx`), the chat
  row options (`ChatOptions.tsx`), the chat info panel (`ChatInfo.tsx`) and the
  chat row (`ChatItem.tsx`).
- `components/Chat/components/messages/` — the message bubbles
  (`Types/*.tsx`); every type except calls rendered the forward icon in the same
  place, so new marks can sit there.
- `components/Chat/pages/` — `ChatLists.jsx` (the list) and
  `ConversationContainer.tsx` (the open chat, with the jump-to-quote logic).
- `store/chat/` — `actions.tsx` (backend calls) and `reducer.ts` (the chat slice).
- `utils/NotificationHandler.ts` — the foreground push handler.
- `public/firebase-messaging-sw.js` — the background push handler.
- `public/translations/` — `ar`, `tr`, `ku` files.
- `tests/components/Chat/`, `tests/store/chat/`, `tests/store/`, `tests/utils/`
  — the unit tests for the chat. File names follow the unit they test.

## Relevant config files

- `utils/endpointConfig.tsx` — chat endpoint paths.
- `utils/Requests.ts` — `REQUESTS_DATA` titles and codes for `fetchData`.
- `utils/types/chat/index.ts` — the `Message` and `Channel` types.

## Possibly affected services

- **chat backend** — seven new calls and two changed ones (see
  `CHAT_API_CHANGES.md`). All go through `fetchData` with `server: "chat"`, so a
  401 follows the chat rule (exchange, wait 2 s, retry).
- **FCM pushes** — `UpdatingMessageEvent` gains two new meanings (edit, tag
  change) next to the old one (delete for everyone). `MessageReminderEvent` is
  new and data-only, so the app must show it.
- **Sentry** — each new call logs its failure with `LogError`.

## Facts found

1. `fetchData` shows the backend's `message` as a toast unless the call passes
   `noMessage: true`. The chat backend answers in English ("Channel archived
   successfully"), so the new calls must pass it.
2. The chat backend has **no call to fetch one chat by id**. `my_channels` is
   paged by a `timestamp` cursor (`nextCursor` in `GetMoreChats.tsx`).
3. `my_channels` returns only non-archived chats unless the body has
   `archived: true`; then it returns only archived ones.
4. "Mark as unread" sets the backend counter `total_unread_message_count` to at
   least 1. The list counts unread from the messages themselves (`isNew`), so a
   hand-marked chat with no unread message would draw as read.
5. `/watched` (the existing "open the chat" call) sets the counter back to 0.
6. The backend refuses `archived: "false"` as a string; it takes `0 | 1`.
7. The backend stores a reminder time as a 32-bit timestamp, so it refuses
   2038-01-19 and later.
8. A push for an edit or tag change never carries the `reminder` field; the
   reminder is personal to each user.
9. The open chat scrolls to a quoted message through a pending id kept in
   `ConversationContainer` state (`pendingScrollToMessageId`). A reminder opens
   the chat from outside that component, so the pending id cannot live there.
10. The foreground push handler adds a new message to the store only when the
    chat is in `state.data` (`handleChatMessage`). Otherwise it reloads the list.

## Test / validation commands available

- `pnpm test:run` (Vitest, `vitest run`) — the unit suite.
- `pnpm lint` — ESLint, including the i18n rule (a missing translation key is an
  error).
- `pnpm lint:i18n-parity` — the three translation files are key-parallel.
- `node_modules/.bin/tsc --noEmit --pretty false` — types.

## Risks and unknowns

- `UpdatingMessageEvent` now has three meanings, and the push does not say which.
  Reading it wrong would delete an edited message. Impact high; likelihood
  medium.
- An archived chat is not in `state.data`, so fact 10 means pushes for it are
  not added to the store. Impact medium; likelihood high (any archived chat that
  gets a message).
- The service worker cannot load the translation files, so the reminder
  notification needs its own words. Impact low.

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does the chat backend refuse an edit of another user's message, and with which status? | Decides whether hiding the option in the web app is enough. |
| OQ-2 | Does a new message un-archive a chat on the chat backend? | Decides whether the app must hide a chat the backend lists as normal again. |
| OQ-3 | Where does a hand-marked unread live, so it survives a reload? | Decides whether the mark is local or read from the backend. |
| OQ-4 | How must the backend's English success text be kept off screen? | Every new call is affected. |
| OQ-5 | Which surface shows a due reminder? | The push has no visible text; a visible tab and a hidden tab need different paths. |
| OQ-6 | How does a reminder open a chat that the list has not loaded? | The backend has no call for one chat by id (fact 2). |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
