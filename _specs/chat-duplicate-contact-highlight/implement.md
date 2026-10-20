---
ticket: chat-duplicate-contact-highlight
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-10-04
links:
  clickup:
  github:
---

# Implement — chat-duplicate-contact-highlight

> Record of what was actually built, following `plan.md` and the accepted review
> follow-up S-1 (`review.md > Required Follow-up Actions`).

Branch: `ticket/chat-duplicate-contact-highlight`, cut from `development`
(`implementation-started`, 2026-10-04).

## Changes made

- `components/Chat/chatSearch.ts` — new export `drawnContactFor(contacts,
  match)`: the row `dedupeContacts` keeps for the matched person (same object,
  else same user, else same 9-digit phone), or `null`. Plan step 2.
- `components/Chat/chatsFunctions.tsx` — new export `contactRowName(contact,
  chats)`: the exact name rule the contacts tab used inline (chat row →
  `getChatName`, else the peer's phone, else `"User"`; contact row →
  `contact_user.name || name || mobile_phone`). Plan step 3.
- `components/Chat/pages/ContactLists.jsx` — plan step 4 and S-1:
  - state `duplicate`, set by the form's new `onDuplicate` prop;
  - sort: the `duplicate` row first, then the import's `alreadySaved` rows, then
    the rest in their old order;
  - the `duplicate` row is wrapped in `<div className="contact-duplicate
    rounded-[8px] outline-2 outline-red-500 -outline-offset-2">` (steady, no
    animation; an outline does not change the row's size);
  - both `SenderName` expressions now call `contactRowName(contact, chats)`; the
    now-unused `getChatName` / `getUserChat` imports are removed;
  - **S-1:** rows, the import's flash wrapper and the frame wrapper are keyed by
    `rowKey(contact, index)` = `contact.id ?? contact.mobile_phone ?? index`,
    not by the index. `myKey` (a prop, not a React key) still gets the index.
- `components/Chat/components/ChatContactsUpload.tsx` — plan step 5:
  - `existingNormalizedMap` maps canonical phone → the saved **record** (fixes
    BUG-1);
  - `conflictingRow = drawnContactFor(ContactsData, savedContact) ??
    savedContact`; `conflictingName = contactRowName(conflictingRow, chats)`
    (`chats` = store `data`). `drawnContactFor` runs only when a record matched
    (panel P-2);
  - `useEffect` on `[conflictingRow, showAddForm]` calls
    `onDuplicate?.(showAddForm ? conflictingRow : null)`, with a comment on why
    `onDuplicate` is not in the deps (panel P-4);
  - Confirm, the early return and the warning now key off `conflictingRow`;
  - warning line `text-orange-600` → `text-red-600`; phone field conflict style
    `border-orange-400 bg-orange-50` → `border-red-400 bg-red-50`.
- `tester guide/chat.md` — TC-D-03 Expected Result rewritten (red warning with
  the row's name, red phone field, the contact first in the list with a red
  frame until the number changes or the form closes). Plan step 6.

## Changes prepared (uncommitted)

No commit was created (IM-9). Working-tree changes:

- `components/Chat/chatSearch.ts`
- `components/Chat/chatsFunctions.tsx`
- `components/Chat/components/ChatContactsUpload.tsx`
- `components/Chat/pages/ContactLists.jsx`
- `tests/components/Chat/chatSearch.test.ts`
- `tests/components/Chat/components/ChatContactsUpload.test.tsx`
- `tests/components/Chat/pages/ContactLists.test.tsx`
- `tester guide/chat.md`

Every file is in `plan.md > Files to change`. No other file was touched.

## Deviations from plan

- **S-1 (accepted at review):** stable row keys instead of index keys in
  `ContactLists.jsx`, and the AC-11 case gained a "no remount" assertion. Both
  are inside files the plan lists; the review recorded this as a required
  follow-up, and the owner chose to fix it here rather than re-open the plan.
- **AC-3 list case (panel S-3):** written as "keeps a steady frame, not the
  import's fading flash" — it asserts the frame wrapper does not carry
  `contact-already-saved` or any `animate-*` class — instead of the planned
  "keeps the frame after 4 seconds" with fake timers, which could not fail in
  jsdom. Same file, same AC.
- **Test helper:** in `ChatContactsUpload.test.tsx`, `openForm` moved from inside
  the "adding one by hand" `describe` to the top level, and `mount`/`openForm`
  gained optional `store` / `props` arguments, so the new `describe` can pass
  `onDuplicate`. Existing calls are unchanged.
- **jsdom stub:** the new `ContactLists.test.tsx` block stubs
  `Element.prototype.scrollTo` (jsdom has none; an import scrolls the list).
- Panel findings S-2, S-4, P-1, P-3 (minor, not dispositioned) were **not**
  acted on.

## Tests written

| AC   | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `tests/components/Chat/pages/ContactLists.test.tsx` | "draws the contact the form matched first — a contact with a chat"; "… — a contact with no chat, above the import's rows" | extend |
| AC-2 | `tests/components/Chat/pages/ContactLists.test.tsx` | "frames the matched row in red, and no other row" | extend |
| AC-3 | `tests/components/Chat/pages/ContactLists.test.tsx`; `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "keeps a steady frame, not the import's fading flash"; "reports the same row once while the typed number still matches it" | extend |
| AC-4 | `tests/components/Chat/components/ChatContactsUpload.test.tsx`; `tests/components/Chat/pages/ContactLists.test.tsx` | "reports no match when the number changes to an unsaved one, is cleared, or the form closes"; "removes the frame and restores the order when the match ends" | extend |
| AC-5 | `tests/components/Chat/components/ChatContactsUpload.test.tsx`; `tests/components/Chat/pages/ContactLists.test.tsx` | "reports contact B after the number changes from A's to B's"; "moves the frame from A to B" | extend |
| AC-6 | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "names a contact the shopper chats with as the chat row does, not by the account name" | extend |
| AC-7 | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "names a contact with no chat as its row does" | extend |
| AC-8 | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "warns about a number that is already saved and refuses it" (now asserts `border-red-400` and `text-red-600`) | extend |
| AC-9 | `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "warns about a number that is already saved and refuses it" (+ no save request on a forced click); "BUG-1: refuses a saved number whose contact has no name" | extend |
| AC-10 | `tests/components/Chat/chatSearch.test.ts`; `tests/components/Chat/components/ChatContactsUpload.test.tsx` | "drawnContactFor gives the kept row for either record of a person saved twice" (+ "… a user saved twice with two phones", "… nothing when there is no match"); "reports the drawn row when the person is saved twice in two formats" | extend |
| AC-11 | `tests/components/Chat/pages/ContactLists.test.tsx` | "after an import, the contacts already saved move to the top and flash" (+ S-1: a manual match does not remount the flashed row) | extend |
| AC-12 | — | none — docs-only; TC-D-03 is read at `/verify` | none (as planned) |

### Red first, then green (CLAUDE.md "Every bug is confirmed by a test")

Command: `pnpm vitest run --project unit tests/components/Chat/chatSearch.test.ts tests/components/Chat/components/ChatContactsUpload.test.tsx tests/components/Chat/pages/ContactLists.test.tsx`

1. **Against the unchanged code** (after fixing two test-side faults: `openForm`
   out of scope, and the jsdom `scrollTo` gap): **14 failed** in the two
   component files, and the 3 `drawnContactFor` cases failed (no such export).
   The reasons, in the runner's words:
   - AC-8: "the phone field was not marked red as a conflict: expected '…' to
     contain 'border-red-400'";
   - BUG-1: "a saved contact with no name could be added again" (Confirm was
     enabled);
   - AC-3/4/5/10 (form): "the saved number was not reported to the list",
     "the list was not told A, then B", … (`onDuplicate` never called);
   - AC-6: the warning showed "qussai2", not "قصي بدوي";
   - AC-1/2/3/4/5/11 (list): `h.upload.onDuplicate is not a function`.
   AC-7 passed already (guard), and the import half of AC-11 passed (guard).
2. **S-1 proof** — with steps 2-5 applied but the list still keyed **by index**
   (the plan as first written): **1 failed, 71 passed**. The only failure:
   AC-11, "a manual match remounted the import's flashed row, so its flash
   played again".
3. **After the stable keys**: **72 passed (72)**.

## Findings — confirmed bugs, out of scope

none. BUG-1 (a saved contact with no name could be added again) lives in
`ChatContactsUpload.tsx`, which this plan changes; it was fixed here and proved
red-then-green by "BUG-1: refuses a saved number whose contact has no name".

## Validation run during implementation

- Targeted run (three files) — **72 passed (72)**, last run after the typecheck
  fix below.
- `logic-change` profile, run once on the whole repository. **All three checks
  exited non-zero. None of the failures is in a file this change touches:**
  - `pnpm lint` — **exit 1**: 2 errors, both in
    `components/SellerDashboard/CommentProductInfo.tsx` (lines 141, 368: i18n keys
    "Standard" and "View product" missing from ar/tr/ku). That file has no local
    edits; the keys have been missing since commit `be5df4f2` (2026-10-01) on
    `development`. `eslint` on the seven changed source and test files alone —
    **exit 0**.
  - typecheck (`next typegen` + `tsc --noEmit`) — first run: 1 error in this
    change's own test (`chatSearch.test.ts:98`, test object missing `name`);
    **fixed**. Second run — **exit 2**, with **0 errors outside `.next/dev/`** and 3
    errors inside `.next/dev/types/validator.ts`. That file is generated by a
    running `next dev` server (last written 13:44), and its tail is garbled. It
    was left alone, because another session's dev server is using it.
  - `pnpm test:run` — **exit 1**: 7447 passed, 3 expected fail, **1 failed**:
    `tests/components/SellerDashboard/CommentProductInfo.test.tsx > renders
    external product link when product slug is present`. It fails alone too,
    every time: the component builds `/products/<slug>` (line 252, commit
    `be5df4f2`), the test expects `/en/product/running-sneakers`. Not related to
    chat; it imports nothing this change touched.
- **Working tree note:** while this stage ran, another session changed
  `components/DemoApp1/*`, `tests/components/DemoApp1/Demo1Shell.test.tsx` and
  added `correct.jpeg`, `temp1.jpeg`, `temp2.jpeg`. They are not part of this
  work item and must not go into its commit.
