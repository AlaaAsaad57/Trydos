---
ticket: chat-duplicate-contact-highlight
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-10-04
links:
  clickup:
  github:
---

# Plan — chat-duplicate-contact-highlight

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

The add-contact form already finds the duplicate. It will now also find the
**row the list draws** for that person, and report that row up to the contact
list through a new optional callback, `onDuplicate(row | null)`. The list keeps
that row in state, draws it first, and wraps it in a steady red frame. The
warning takes its name from **one shared rule**, the rule the list already uses
to name a row. So the warning and the row can never show two different names.

Why this way:

- **The form already holds the match**, so the list needs no second phone
  search. The list only compares object identity: `dedupeContacts` returns the
  original contact objects, so the form and the list point at the same object
  for the same contacts array.
- **A steady class, not the import's flash.** The owner chose "while the warning
  shows" (OQ-2). A class added and removed with the match has no restart problem
  and is visible with reduced motion on (NFR-1). The import's `alreadySaved`
  state and its flash stay as they are (FR-10).
- **One name rule in one place.** Today the row's name rule is written inline in
  `ContactLists.jsx`, twice. Moving it into one exported function, and calling
  it from both the list and the form, is what makes FR-6 true by construction.
  A copy in the form would drift.

Rejected:

- *Pass the name down from the list to the form.* That makes a loop: the form
  reports the match up, and the list sends a name back down. The shared function
  is simpler.
- *Reuse `onAlreadySaved` for the manual form.* It fires a one-time flash, keyed
  by an exact `mobile_phone` string (research section 5). It meets neither OQ-2
  nor FR-9.

## Steps

Red first, on every step that changes behaviour (CLAUDE.md, "Every bug is
confirmed by a test"). The `tdd` capability is not selected for this work item;
the repository rule still applies.

1. **Write the tests in the Tests table** below, and run the two Chat files and
   `chatSearch.test.ts`. Record which cases are red against the current code,
   and why. Expected red: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-10, and the
   nameless-contact case under AC-9 (see Findings). Expected green already:
   AC-7, AC-9 (named contact), AC-11 — these are guards for behaviour that exists
   today.
2. **`components/Chat/chatSearch.ts`** — add `drawnContactFor(contacts, match)`.
   It returns the row that `dedupeContacts(contacts)` keeps for the person
   `match`. Order: the same object; else the kept row with the same user
   (`contactUserId`); else the kept row with the same `normalizePhone`. It
   returns `null` for no match. Pure, no imports, like the rest of the file.
3. **`components/Chat/chatsFunctions.tsx`** — add `contactRowName(contact,
   chats)`. It returns the exact name `ContactLists` draws today:
   - the contact's user has a chat (first chat with a member whose `user_id`
     equals `contact.contact_user.id`) → `getChatName(chat)`, else the peer's
     `mobile_phone`, else `"User"`;
   - no chat → `contact_user?.name || name || mobile_phone`.
4. **`components/Chat/pages/ContactLists.jsx`**:
   - replace the two inline `SenderName` expressions with `contactRowName`.
     The names drawn do not change (guarded by the existing ContactLists cases);
   - add state `duplicate` (row or `null`), set from a new `onDuplicate` prop on
     `ChatContactsUpload`;
   - sort: the `duplicate` row first, then the import's `alreadySaved` rows, then
     the rest, in their old order;
   - wrap the `duplicate` row in a `<div>` with a steady red frame. Use Tailwind
     classes, for example `rounded-[8px] outline-2 outline-red-500
     -outline-offset-2`, plus a `contact-duplicate` marker class. An outline does
     not change the row's size, so nothing below it moves. The import's flash
     wrapper stays inside it, unchanged.
5. **`components/Chat/components/ChatContactsUpload.tsx`**:
   - `existingNormalizedMap` maps canonical phone → **the saved contact record**,
     not the name. A conflict is now "a record was found", so a saved contact
     with no name is refused too (Findings, BUG-1);
   - `drawnContactFor(ContactsData, record)` gives the drawn row;
     `contactRowName(row, chats)` gives the warning's name (`chats` = the store's
     `data`);
   - a `useEffect` on `[row, showAddForm]` calls `onDuplicate?.(showAddForm ?
     row : null)`. It fires only when the matched row changes, not on every
     keystroke, and it sends `null` when the form closes (FR-4);
   - the warning line `text-orange-600` → `text-red-600`; the phone input
     conflict style `border-orange-400 bg-orange-50` → `border-red-400
     bg-red-50`.
6. **`tester guide/chat.md`** — rewrite the Expected Result of TC-D-03: a red
   line "Already saved as <the name shown in the list>", Confirm stays off, and
   that contact is first in the list with a red frame until the number changes
   or the form closes. TC-D-04 is not touched.
7. **Run the same tests again** and see every step-1 red case green. Then run
   the `logic-change` profile.

## Files to change

- `components/Chat/chatSearch.ts` — new export `drawnContactFor` (FR-9).
- `components/Chat/chatsFunctions.tsx` — new export `contactRowName` (FR-6).
- `components/Chat/pages/ContactLists.jsx` — `duplicate` state, sort, red frame,
  row names through `contactRowName` (FR-1 … FR-5, FR-6).
- `components/Chat/components/ChatContactsUpload.tsx` — map holds records,
  `onDuplicate`, warning name from `contactRowName`, red colours (FR-2 … FR-9).
- `tests/components/Chat/chatSearch.test.ts` — extend: `drawnContactFor`.
- `tests/components/Chat/components/ChatContactsUpload.test.tsx` — extend:
  `onDuplicate`, warning name, red colours, nameless contact.
- `tests/components/Chat/pages/ContactLists.test.tsx` — extend: the
  `ChatContactsUpload` stand-in keeps its props, so a test can call
  `onDuplicate` / `onAlreadySaved`; new cases for the frame, the order and the
  import regression.
- `tester guide/chat.md` — TC-D-03 Expected Result (FR-11).

No translation file changes: no new user-visible text. "Already saved as" is
reused as it is. The existing `"User"` fallback is moved, not added.

## Integration surface

- **Components / shared config touched:**
  - `ContactLists.jsx` — the contacts panel of the chat widget. It also draws
    the phone-import result (`alreadySaved`, `.contact-already-saved`).
  - `chatsFunctions.tsx` — imported by most chat components. Only a new export
    is added; `getChatName`, `getChatPeer`, `getChatPhoto` are not changed.
  - `chatSearch.ts` — shared by the chats tab, the contacts tab and the search
    (`ChatSearchResults`, `ChatLists`). Only a new export is added;
    `dedupeContacts`, `normalizePhone`, `contactUserId` are not changed.
  - `ChatContactsUpload.tsx` — used only by `ContactLists.jsx`.
- **Who else depends on them:**
  - the **phone import** ("Get from your contacts") draws into the same list,
    with its own sort and flash;
  - **every contact row's name** in the contacts tab now comes from
    `contactRowName`; the chats tab and the search do not use it;
  - `tester guide/chat.md` TC-D-03 is what the testers follow.
- **Overlapping flows:**
  - import vs. manual add: both change the list's order. The new sort puts the
    `duplicate` row before the `alreadySaved` rows. The two cannot be active
    from one action: the form replaces the import button while it is open. But
    an import's `alreadySaved` state stays after the import, so a later manual
    duplicate must still go first (covered by the AC-1 case with both set);
  - the contact row's name vs. the chat row's name in the chats tab: both use
    `getChatName`, so a chat keeps one name everywhere.
- **Ordering / lockstep dependencies:** `drawnContactFor` and `contactRowName`
  must exist before the form and the list use them (steps 2-3 before 4-5). The
  form's `onDuplicate` and the list's handler land in the same change. Each
  side is safe alone: the prop is optional, and the list ignores a missing
  call.
- **What breaks if this is wrong:**
  - a row's name changes in the contacts tab (wrong `contactRowName`) — the
    existing ContactLists cases that read `SenderName` go red;
  - the import's rows lose their place or flash (wrong sort) — the AC-11 case
    goes red;
  - the frame stays after the form closes, or lands on the wrong row (wrong
    effect deps or identity) — the AC-4 / AC-5 cases go red;
  - an infinite render loop if `onDuplicate` fires on every render — the effect
    depends on the row object, which is stable for one contacts array.

## Tests

Search done in the layout `research.md` recorded: `tests/components/Chat/**`,
`tests/components/Chat/chatSearch.test.ts`, and `tests/e2e/**` (no case touches
this form or list).

| AC   | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | none — searched `tests/components/Chat/pages/ContactLists.test.tsx` (stand-in for the form is `null`; no case sorts) | extend | `tests/components/Chat/pages/ContactLists.test.tsx` | "draws the contact the form matched first — a contact with a chat, and one without" (one case per kind; the no-chat case also sets an import `alreadySaved` row and checks the matched row is still first) |
| AC-2 | none — searched the same file | extend | `tests/components/Chat/pages/ContactLists.test.tsx` | "frames the matched row in red, and no other row" |
| AC-3 | none — searched the same file and `ChatContactsUpload.test.tsx` | extend | `tests/components/Chat/pages/ContactLists.test.tsx` and `tests/components/Chat/components/ChatContactsUpload.test.tsx` | list: "keeps the frame after 4 seconds" (fake timers); form: "reports the same row once while the typed number still matches it" (`0937288307` → `937288307`) |
| AC-4 | none — searched both files | extend | `tests/components/Chat/components/ChatContactsUpload.test.tsx` and `tests/components/Chat/pages/ContactLists.test.tsx` | form: "reports no match when the number changes to an unsaved one, is cleared, or the form closes"; list: "removes the frame and restores the order when the match ends" |
| AC-5 | none — searched both files | extend | `tests/components/Chat/components/ChatContactsUpload.test.tsx` and `tests/components/Chat/pages/ContactLists.test.tsx` | form: "reports contact B after the number changes from A's to B's"; list: "moves the frame from A to B" |
| AC-6 | none — `ChatContactsUpload.test.tsx::warns about a number that is already saved and refuses it` checks the account name, with no chat in the store | extend | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "names a contact the shopper chats with as the chat row does, not by the account name" (chat `channel_name` "قصي بدوي", account name "qussai2") |
| AC-7 | `ChatContactsUpload.test.tsx::warns about a number that is already saved and refuses it` shows "Ali Saved" (`contact_user.name`), which is also the row's name for a contact with no chat — but it does not compare with the row | extend | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "names a contact with no chat as its row does" (contact with no account: its saved name) |
| AC-8 | `ChatContactsUpload.test.tsx::warns about a number that is already saved and refuses it` asserts `border-orange-400` — it proves the **old** colour | extend | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | same case, assertion changed to `border-red-400` on the phone field, plus `text-red-600` on the warning line |
| AC-9 | `ChatContactsUpload.test.tsx::warns about a number that is already saved and refuses it` (Confirm disabled) and `::warns about a saved number typed with the local 0` | extend | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "BUG-1: refuses a saved number whose contact has no name" (Confirm off, no request on a forced click); the existing named case gains "no save request sent" |
| AC-10 | `chatSearch.test.ts` covers `dedupeContacts`, not which row a match maps to | extend | `tests/components/Chat/chatSearch.test.ts` and `tests/components/Chat/components/ChatContactsUpload.test.tsx` | helper: "drawnContactFor gives the kept row for either record of a person saved twice"; form: "reports the drawn row when the person is saved twice in two formats" |
| AC-11 | none — searched `tests/components/Chat/**` for `onAlreadySaved`, `alreadySaved`, `contact-already-saved` | extend | `tests/components/Chat/pages/ContactLists.test.tsx` | "after an import, the contacts already saved move to the top and flash" (regression guard; green from the start — the behaviour exists and is not being fixed) |
| AC-12 | none — documentation | none — docs-only change; checked by reading TC-D-03 at `/verify` | `tester guide/chat.md` | — |

## Findings

- **BUG-1 — a saved contact with no name can be added again.** The form maps a
  phone to `c.contact_user?.name || c.name`. For a saved contact with no account
  and an empty name, the value is `""`, so `conflictingName` is falsy. The
  warning does not show, and Confirm turns on. This is inside a file this plan
  changes (`ChatContactsUpload.tsx`), and step 5 removes it with no extra code:
  the map holds the record, so the check no longer depends on the name. The
  AC-9 "BUG-1" case proves it red before step 5 and green after. Under FR-6 the
  warning then shows the row's name for that contact, which is its phone.

## Validation strategy

- Validation profile: `logic-change` (lint, typecheck, unit-tests).
- Profile source: `pre-existing` — `.claude/project-config.yaml` carries it; this
  plan does not touch that file.
- Red-first evidence: before steps 2-5, run
  `pnpm vitest run --project unit tests/components/Chat/chatSearch.test.ts tests/components/Chat/components/ChatContactsUpload.test.tsx tests/components/Chat/pages/ContactLists.test.tsx`
  and record the red cases in `implement.md`. Run it again after step 5 and
  record them green.
- `/verify` runs the `logic-change` profile. `pnpm test:run` is
  `vitest run --project unit`, which writes nothing. The unit suite often has
  **one** random failure on a full run (known); a red case outside the three
  files is re-run alone before it is judged.
- `pnpm lint` also proves no new untranslated text came in.
- AC-12 is checked by reading TC-D-03 in `tester guide/chat.md`.

## Rollback

- Revert the one commit. No data, no backend, no config and no translation key
  is involved, so a revert restores the old form and list fully.
- The phone import is guarded by the AC-11 case, so a partial revert that breaks
  it shows up in the unit suite.

## Out of scope

- Marking contacts in chat search results.
- Scrolling the list when a duplicate is found.
- Any change to the phone import's matching, sort or flash.
- Changing which name a list row shows (the rule is moved, not changed).
- The browser (e2e) suite.
- Translating the existing `"User"` fallback name. It is existing text that this
  plan only moves; it is noted here, not fixed here.
