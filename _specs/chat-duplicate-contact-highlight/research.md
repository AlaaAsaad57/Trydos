---
ticket: chat-duplicate-contact-highlight
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-10-04
links:
  clickup:
  github:
---

# Research — chat-duplicate-contact-highlight

> Read-only phase. **No implementation is allowed in this command.**

## Goal

When **Add a new contact** finds a number that is already saved, the contact
list under the form must show the shopper which contact has that number.

## What the code does today

### 1. The manual form finds the duplicate, and keeps it to itself

`components/Chat/components/ChatContactsUpload.tsx`:

- Lines 99-106 build `existingNormalizedMap`: canonical phone → a name. The
  name is `c.contact_user?.name || c.name` (line 103).
- Line 109 builds the typed number with `phoneWithDialCode(dialCode,
  localPhone)`. Line 110 looks it up: `conflictingName`.
- When `conflictingName` is set:
  - the phone input turns orange (`PhoneInput`, `hasConflict`, lines 404-408:
    `border-orange-400 bg-orange-50`);
  - an orange line shows "Already saved as **<name>**" (lines 284-290,
    `text-orange-600`);
  - Confirm is disabled (line 297), and `handleAddContact` returns early
    (line 113).
- **The form tells nobody else.** The map keeps only the name, not the saved
  record or its `mobile_phone`. So nothing outside the form knows which contact
  matched.

### 2. The list can already mark contacts — but only the phone import uses it

`components/Chat/pages/ContactLists.jsx` (added in commit `78801400`,
2026-09-30):

- Line 19: state `alreadySaved = { phones: [], run: 0 }`.
- Lines 21-24: `wasAlreadySaved(contact)` compares the contact's
  `mobile_phone`, with spaces removed, to `alreadySaved.phones`. This is an
  **exact string** compare, not a canonical-phone compare.
- Lines 25-32: `flash()` wraps a marked row in
  `<div className="contact-already-saved">`. The key includes `run`, so the
  flash plays again on each new run.
- Line 60: marked rows are sorted to the top.
- Lines 37-42: `onAlreadySaved` sets the state and scrolls the list to the top
  (`listRef.current?.scrollTo({ top: 0, behavior: "smooth" })`).
- `ChatContactsUpload` calls `onAlreadySaved` **only** from the phone-import path
  (`handleContactSync`, line 204), with the saved `mobile_phone` of each
  match (`mergeContacts`, line 60). The manual form never calls it.

`public/styles/chatcomponent.css:151-165`: `.contact-already-saved` is a
**blue** (`#8fc3ff80`) background that fades to transparent over **3 s**, and
plays once. After 3 s the row stays at the top, but it looks like every other
row.

### 3. Where the form sits

- `ContactLists` renders `ChatContactsUpload` as the first child of the
  scrolling `.chat-list-items` box (lines 36-42). So the form scrolls with the
  list. A row sorted to the top sits right under the open form.
- `ContactLists` is opened from `components/Chat/pages/ChatWindow.tsx:103-105`,
  with `search` from `components/Chat/ChatWindowModal.tsx:31`.
- When `props.search` is not empty, the list draws `ChatSearchResults` instead
  (line 44-45). That path has no `alreadySaved` marking at all.

### 4. Two kinds of row, two name rules

`ContactLists` draws each deduplicated contact (`dedupeContacts`,
`components/Chat/chatSearch.ts:34-57`) as one of two rows:

| Row | When | Name shown |
|---|---|---|
| `ChatItem` | the contact's user already has a chat with the shopper | `getChatName(chat)` = `chat.channel_name \|\| peer user.name` (`components/Chat/chatsFunctions.tsx:25-26`), then the peer's phone, then "User" (`ContactLists.jsx:114-140`) |
| `SearchResult` | no chat yet | `contact.contact_user?.name \|\| contact.name \|\| contact.mobile_phone` (`ContactLists.jsx:193-197`) |

The warning uses `contact_user?.name || name`. So:

- for a contact **with no chat**, the warning and the row show the same name;
- for a contact **with a chat**, the row shows `channel_name`, and the warning
  shows the account name. These can differ.

The screenshot is the second case. The warning says **"qussai2"** (the account
name). The row says **"قصي بدوي"** (the chat's `channel_name`). The shopper
cannot find "qussai2" anywhere in the list.

Commit `437299f7` (2026-10-04, today) changed how chats take names and photos
from contacts (`SearchResult.tsx`, `store/chat/reducer.ts`,
`store/chat/actions.tsx`). It did not touch the warning or `ContactLists`.

### 5. How the two "same person" checks differ

- The form matches by `canonicalPhone` (`components/Chat/contactPhone.ts`,
  libphonenumber-js). So `+963` + `0937288307` matches the saved
  `963937288307`.
- `dedupeContacts` matches by user id, or by the last 9 digits
  (`normalizePhone`). When two records are the same person, it keeps the first
  one, unless a later one has an account (`chatSearch.ts:52`).
- `wasAlreadySaved` matches by the exact `mobile_phone` string.

So the record the form matched can be a record that `dedupeContacts` dropped.
Then the kept row has another `mobile_phone`, and an exact-string mark misses
it. The phone import has the same gap today.

## Relevant directories

- `components/Chat/components/` — `ChatContactsUpload.tsx` (the form),
  `SearchResult.tsx` and `ChatItem` (the two row kinds).
- `components/Chat/pages/` — `ContactLists.jsx` (the list and its marking),
  `ChatWindow.tsx` (opens it).
- `components/Chat/` — `contactPhone.ts` (canonical phone), `chatSearch.ts`
  (`dedupeContacts`, `normalizePhone`, `contactUserId`), `chatsFunctions.tsx`
  (`getChatName`, `getChatPhoto`).
- `public/styles/chatcomponent.css` — `.contact-already-saved` and its keyframes.
- `public/translations/translations.{ar,tr,ku}.js` — "Already saved as" (ar
  line 1724, ku 1755, tr 1730) and "Some contacts already exist" exist in all
  three.
- `tests/components/Chat/components/`, `tests/components/Chat/pages/` — the unit
  tests for these files.
- `tester guide/chat.md` — TC-D-03 (duplicate number) and TC-D-04 (phone import).

## Relevant config files

- `vitest.config.mts` — the unit suite (`--project unit`).
- No `next.config.ts`, `proxy.ts`, Sentry or CI file is involved. **No protected
  runtime path is on this change's path.**

## Possibly affected services

- **None on the backend.** Finding the duplicate and marking the row are both
  client-side. They read the `contacts` already in the store (`useAppStore`). No
  new call to the chat backend is needed.
- The chat backend endpoint `/api/v1/users/save_contact_v2` is not reached for a
  duplicate, because Confirm is disabled. That stays the same.

## Test layout and naming convention

- **Runner:** Vitest (`pnpm test:run` = `vitest run --project unit`), jsdom,
  Testing Library. Render with `renderWithProviders(ui, { store })` from
  `tests/render.tsx`.
- **Where:** `tests/` mirrors the source tree. `components/Chat/components/X.tsx`
  → `tests/components/Chat/components/X.test.tsx`;
  `components/Chat/pages/X.jsx` → `tests/components/Chat/pages/X.test.tsx`.
- **Existing files for this change:**
  - `tests/components/Chat/components/ChatContactsUpload.test.tsx` — has a
    `describe("ChatContactsUpload — adding one by hand")` block. The case "warns
    about a number that is already saved and refuses it" checks the name, the
    disabled button and the orange border (`border-orange-400`). It renders the
    component **without** `onAlreadySaved`.
  - `tests/components/Chat/pages/ContactLists.test.tsx` — **mocks
    `ChatContactsUpload` to `null`**, and stubs `ChatItem` and `SearchResult`
    as `data-row` markers. A test of the list's marking needs a different
    stand-in for `ChatContactsUpload`, one that can call `onAlreadySaved`.
- **Coverage gap:** no unit test calls `onAlreadySaved`, checks the sort to the
  top, or checks `.contact-already-saved`. The phone-import marking from commit
  `78801400` has no test.
- **Expected-failure marker:** `it.fails("BUG-chat-<n>: …")`. Example:
  `tests/components/Chat/components/SearchResult.test.tsx:146`. The last used
  ids in this area are `BUG-chat-6`, `BUG-chat-7` (ChatContactsUpload test) and
  `BUG-chat-8` (SearchResult test).
- **Messages:** every new assertion carries a message (CLAUDE.md, Testing rule 1).
  The existing files already follow that.
- **Browser suite:** no case in `tests/e2e/` touches the add-contact form or the
  contact list marking. This change can be proved in the unit suite.

## Test / validation commands available

- `pnpm test:run` — the unit suite.
- `pnpm vitest run --project unit tests/components/Chat/components/ChatContactsUpload.test.tsx tests/components/Chat/pages/ContactLists.test.tsx`
  — only the two files this change touches.
- `pnpm lint` — ESLint. It also fails on a translation key missing from ar/tr/ku.
- `pnpm lint:i18n-parity` — the three translation files have the same keys.
- `pnpm exec next typegen && pnpm exec tsc --noEmit` — typecheck (`tsc` needs
  `next typegen` first).

Nothing was run in this stage.

## Risks and unknowns

- **The flash restarts on every keystroke.** `conflictingName` is computed on
  each render. If the form calls `onAlreadySaved` on each change while the
  number matches, `run` goes up each time and the 3 s flash restarts. The call
  should happen once when the match **starts**, or the mark should be a steady
  state, not a one-time flash. Medium likelihood, low impact.
- **The mark can miss the row.** `wasAlreadySaved` compares exact
  `mobile_phone` strings, but the row drawn may be a different record of the
  same person (section 5). Low likelihood (needs two saved records for one
  person), but then the shopper sees no mark.
- **A one-time 3 s flash does not meet the tester's ask.** The tester wants the
  row marked so it is easy to see. After 3 s the row looks normal again, while
  the orange warning is still on screen. It is a design question (OQ-1, OQ-4).
- **A search hides the mark.** With text in the search box, the list draws
  `ChatSearchResults`, which has no marking. Low impact: the shopper is
  searching, not adding.
- **The import's own behaviour can change.** The import and the form share
  `alreadySaved` and the CSS class. A change to the look or the matching changes
  both, and the import has no test today.
- **New copy needs translations.** Any new visible text (for example a label on
  the marked row) needs a key in all three files, or `pnpm lint` fails.
- **Name source.** Changing the warning's name to match the row means the form
  needs the chats (`data`) as well as the contacts, or the list must pass the
  name down. Either way the form reads more of the store.

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | How is the matching row marked: moved to the top, a frame (red or another colour), a marked name, or a mix? Should it reuse the import's `.contact-already-saved` look? | The tester accepts any of the three. The choice decides the CSS and the acceptance criteria. |
| OQ-2 | How long does the mark stay: a one-time 3 s flash (as the import does today), or as long as the warning shows? | A 3 s flash leaves an orange warning on screen with no marked row. A steady mark must also be removed when the number changes or the form closes. |
| OQ-3 | When the warning's name and the row's name differ (a contact with a chat), which name does the warning show? Is this fix in scope here, or a separate ticket? | In the screenshot the warning says "qussai2" and the row says "قصي بدوي". The shopper cannot match them, even with the row marked. |
| OQ-4 | Does the warning change colour from orange to red? | The tester's note speaks of red. `tester guide/chat.md` TC-D-03 says orange today and must be updated if the colour changes. |
| OQ-5 | Does the mark use the canonical phone (as the form does), or the exact `mobile_phone` (as the import does today)? If canonical, does the import change to it too? | With the exact compare, a person saved twice may be drawn under the record that was not matched, so no row is marked (section 5). |
| OQ-6 | Should the list scroll to the top when the form finds a duplicate, as the import does? | The form is the first child of the scrolling list, so the shopper usually sees the top already. A scroll on every keystroke would jump. |
| OQ-7 | Is the phone-import marking (no test today) given a regression test in this ticket, since both paths will share the same code? | A shared change can break the import with nothing to show it. |
| OQ-8 | Which tester-guide cases change: TC-D-03 only, or TC-D-04 too? | The tester guide is the source the testers follow. It must match the new behaviour. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- Nothing in this stage ran a test, a lint or a build.
