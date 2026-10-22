---
ticket: chat-reminders-tags-archive-unread-edit
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-27
links:
  clickup:
  github:
---

# Verify — chat-reminders-tags-archive-unread-edit

> Final validation and impact review before the ticket is closed.
>
> **No comprehension gate was held.** The owner asked on 2026-09-27 to run the
> checks and write this file only: "no gate just verify and write the verify
> doc". So there is no `comprehension.md`, no gate decision, and `ticket.md` was
> not moved. The results below are the evidence; the decision stays with the
> owner.
>
> Branch: `development` at `a037b192` (the feature is in `0b6ed034` and
> `7d2a11c6`). No ticket branch was created.

## Checks performed

- Validation profile: `logic-change` (lint, typecheck, unit-tests), from
  `.claude/project-config.yaml`. `pnpm lint:i18n-parity` was run as well, as
  `plan.md > Validation strategy` asks.

### Profile checks

| Check | Command (resolved) | Exit | Output summary | Result |
|-------|--------------------|------|----------------|--------|
| lint | `pnpm lint` | 0 | 0 errors, 79 warnings. No warning is in a file this ticket added. One is in `tests/store/chat/reducer.test.ts:41` (`useChatStore` called in `makeStore`); that line comes from `6f5fe514`, before this ticket. | PASS |
| typecheck | `npx next typegen` then `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no errors | PASS |
| unit-tests | `pnpm test:run` | 1 | 642 files: 641 passed, 1 failed. 7213 tests: 7209 passed, 3 expected fail, 1 failed. The failure: `tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx` "shows the boutique name, icon, Active pill and id once the edit form loads" (a banner was not preloaded in time). That file is not in `plan.md > Files to change`. Run alone, it passes: 33 of 33. | FAIL in the full run — outside this ticket; see note 1 |
| i18n-parity (extra) | `pnpm lint:i18n-parity` | 0 | "i18n parity OK — 2383 keys present in all three files." | PASS |

Note 1. The full unit suite often has one random timing failure on this machine.
The failing test is in the seller dashboard, which this ticket did not touch,
and it passed when run alone. It is not this ticket's failure. It still means
the profile's `unit-tests` check did not exit 0 on this run.

### Ticket tests

The 12 test files in `plan.md > Tests` were run on their own:

`npx vitest run <the 12 files> --reporter=verbose` — exit 0; 12 files passed,
287 tests passed. Each of the 50 test cases the plan names was found in the
output with a pass mark (✓), once each.

| AC ID | Check / test case | Exit | Result |
|-------|-------------------|------|--------|
| AC-1  | "offers Edit on a message I sent"; "does not offer Edit on a message the other person sent"; "offers no Edit, Tag or Reminder on a message that is still sending"; "hides Forward in an order chat and Copy/Edit on a file" | 0 | PASS |
| AC-2  | none — the plan declared a gap: no test checks that Save is disabled for empty or unchanged text | — | NOT COVERED |
| AC-3  | "EditMessageApi sends the new text and stores the edited message, not its reminder"; "shows the edited, reminder and tag icons …" | 0 | PASS |
| AC-4  | "patchMessage changes one message in the list and the open chat, and the quotes of it" | 0 | PASS |
| AC-5  | "EditMessageApi tells the user when the chat backend refuses the edit"; "keeps the edit box open with the text when the chat backend refuses the edit" | 0 | PASS |
| AC-6  | "offers no Edit, Tag or Reminder on a message that is still sending"; "offers only Delete, and a call can be deleted only for me" | 0 | PASS |
| AC-7  | "marks only the tags I put on the message" | 0 | PASS |
| AC-8  | "toggles the pressed tag on the chat backend and stays open"; "ToggleMessageTag toggles the tag and stores the full tag list" | 0 | PASS |
| AC-9  | "ToggleMessageTag tells the user when the tag change fails" | 0 | PASS |
| AC-10 | "sets a quick choice about an hour from now and closes"; "SetMessageReminder sends the time in ISO form, stores the reminder and reloads my list" | 0 | PASS for the quick choice. The custom-time success path has no test (declared in the plan). |
| AC-11 | "refuses a time in the past without asking the chat backend" | 0 | PASS |
| AC-12 | "refuses a time the chat backend cannot store (2038 and later)" | 0 | PASS |
| AC-13 | "shows the reminder the message has, and cancels it by its id"; "CancelMessageReminder deletes by the reminder id and clears it everywhere"; "CancelMessageReminder clears a reminder the chat backend no longer has (404), with no error" | 0 | PASS |
| AC-14 | "stays open when the chat backend refuses the reminder" | 0 | PASS |
| AC-15 | "shows the edited, reminder and tag icons …"; "does not open the message menu when a mark is tapped for its tooltip"; "hands the tags and my reminder to every other type that can carry them" | 0 | PASS |
| AC-16 | "ArchiveChannel sends 1 or 0, never a boolean, and moves the chat"; "ArchiveChannel leaves the chat where it is when the chat backend refuses"; "archiveChat moves a chat to the archived list and back, and keeps it open"; "marks an unread chat read, and unarchives an archived chat" | 0 | PASS |
| AC-17 | "keeps an archived chat out of the list and opens it from the Archived folder" | 0 | PASS |
| AC-18 | "MarkChannelUnread tells the chat backend, then marks the chat"; "draws a chat I marked unread as unread, with a count of 1"; "marks an unread chat read, and unarchives an archived chat" | 0 | PASS |
| AC-19 | "setChats marks a chat unread when its counter says so but no message is unread"; "watchChannel clears the unread mark, in my list and in the archived list" | 0 | PASS |
| AC-20 | "shows both folders even when they hold nothing"; "asks the chat backend again each time a folder opens" | 0 | PASS |
| AC-21 | "opens the chat on screen at a message that is already loaded"; "loads the messages up to one far up the chat, with a spinner, before it shows the chat"; "finds a chat the list has not loaded yet, and opens it"; "says so, and stays on the list, when the chat cannot be found" | 0 | PASS |
| AC-22 | none — the plan declared a gap: no test taps the cross on a reminder row | — | NOT COVERED |
| AC-23 | "shows a spinner on the tapped row until the jump to the message is done"; "GetTaggedMessages asks the chat's messages with one tag"; "keeps the details open while a tagged message loads, then closes them and scrolls to it" | 0 | PASS |
| AC-24 | "puts an edited message in place and keeps it"; "never overwrites my reminder with the one in the push"; "still deletes a message the sender deleted for everyone"; "loads a compact edit push from the chat backend, then puts it in place"; "deletes a compact push whose message the chat backend no longer has" | 0 | PASS |
| AC-25 | "shows the reminder in a visible tab and takes it off the message"; "leaves a hidden tab to the service worker's system card"; "reminderFired takes the reminder off the message and out of my list" | 0 | PASS |
| AC-26 | none — the plan declared a gap: `public/firebase-messaging-sw.js` has no unit test | — | NOT COVERED |
| AC-27 | the `EditMessageApi`, `ToggleMessageTag`, `SetMessageReminder`, `CancelMessageReminder`, `ArchiveChannel` and `MarkChannelUnread` cases in `tests/store/chatSendMessage.test.ts`, each of which checks `noMessage: true` in the call | 0 | PASS |
| AC-28 | `pnpm lint` (i18n rule) and `pnpm lint:i18n-parity` | 0 / 0 | PASS |

**Summary:** 25 of 28 `AC-n` pass. AC-2, AC-22 and AC-26 are **not covered** —
no test proves them. They are not counted as passed.

## Commands run

- `git branch --show-current`
  ```
  development
  ```
- `pnpm lint:i18n-parity`
  ```
  ✓ i18n parity OK — 2383 keys present in all three files.
  exit 0
  ```
- `pnpm lint`
  ```
  ✖ 79 problems (0 errors, 79 warnings)
  exit 0
  ```
- `npx next typegen` → exit 0; `node_modules/.bin/tsc --noEmit --pretty false` → exit 0, no output.
- `pnpm test:run`
  ```
  FAIL tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx
       > BoutiqueEditor — loading > shows the boutique name, icon, Active pill and id once the edit form loads
  AssertionError: the other language's banner was not warmed in the cache
  Test Files  1 failed | 641 passed (642)
       Tests  1 failed | 7209 passed | 3 expected fail (7213)
  Duration  1078.29s
  exit 1
  ```
- `npx vitest run tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx`
  ```
  Test Files  1 passed (1)
       Tests  33 passed (33)
  ```
- `npx vitest run` on the 12 ticket test files, `--reporter=verbose`
  ```
  Test Files  12 passed (12)
       Tests  287 passed (287)
  exit 0
  ```

## Findings — confirmed bugs, out of scope

Carried from `implement.md`. **None is confirmed by a test yet**, so none has a
`BUG-n` id. This stage wrote no new test. Each needs a test that fails because
of it before any fix, and its own ticket.

| ID  | Scenario that is wrong | Confirming test | Where it lives | Expected vs actual | Ticket |
|-----|------------------------|-----------------|----------------|--------------------|--------|
| F-1 | An archived chat is open and the other member sends a message. | none yet | `utils/NotificationHandler.ts` `handleChatMessage` | Expected: the message shows and the chat is marked read. Actual (from the code): the handler only reloads the main list. | _(to open)_ |
| F-2 | A muted archived chat gets a message while no chat is open. | none yet | `utils/NotificationHandler.ts` `handleChatMessage` | Expected: no toast. Actual (from the code): a toast shows. | _(to open)_ |
| F-3 | A new message arrives in an archived chat. | none yet | `utils/NotificationHandler.ts`; `store/chat/reducer.ts` | Expected: the Archived folder row updates. Actual (from the code): it updates only when the folder is opened again. | _(to open)_ |
| F-4 | The chat backend un-archives a chat on a new message (not known — OQ-2). | none yet | `components/Chat/pages/ChatLists.jsx` | Expected: the chat shows in the main list. Actual (from the code): it stays hidden until the Archived folder is opened. | _(to open, after OQ-2 is answered)_ |
| F-5 | The user searches for the person of an archived chat. | none yet | `components/Chat/chatSearch.ts`; `ChatSearchResults.tsx` | Expected: the existing chat. Actual (from the code): a new-contact row. | _(to open)_ |
| F-6 | A reminder is in an archived chat outside the first 50. | none yet | `store/chat/actions.tsx` `GetArchivedChats`; `components/Chat/openMessageInChat.ts` | Expected: the chat opens. Actual (from the code): "Could not open the chat". | _(to open)_ |

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? No.
- Protected runtime paths (`proxy.ts`, `next.config.ts`, `instrumentation*.ts`,
  `sentry.*.config.ts`, `.github/workflows/**`): none changed by `0b6ed034` or
  `7d2a11c6`.
- Runtime impact outside the chat: `public/firebase-messaging-sw.js` handles
  every background push. The new reminder branch runs only for
  `type === "MessageReminderEvent"` and returns; other pushes take the old path.
  AC-26 has no test, so this branch is checked only by reading.

## Sign-off

- Outcome: **not decided.** No comprehension gate was held, by the owner's
  instruction. Evidence for the decision: profile checks pass except one
  unrelated flaky unit test; 25 of 28 AC pass; AC-2, AC-22, AC-26 not covered;
  six findings open.
- Final ticket state: unchanged — `ticket.md` stays at `current_stage: verify`,
  `status: active`.
- Sign-off: none.
- Commit: none created at verify (VF-10).
- Notes: this is a retroactive ticket. The code was committed on
  `development` before the spec and plan existed, and the review stage was
  skipped (see `ticket.md`).
