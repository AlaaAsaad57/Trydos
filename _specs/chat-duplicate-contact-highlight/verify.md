---
ticket: chat-duplicate-contact-highlight
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-10-04
links:
  clickup:
  github:
---

# Verify — chat-duplicate-contact-highlight

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `logic-change` (`lint`, `typecheck`, `unit-tests`), from
  `.claude/project-config.yaml` (pre-existing).
- Branch: `ticket/chat-duplicate-contact-highlight`. Nothing was committed; the
  checks ran on the working tree.
- Declared tests command (same runner as `unit-tests`, read-only `vitest run`):
  `pnpm vitest run --project unit tests/components/Chat/chatSearch.test.ts tests/components/Chat/components/ChatContactsUpload.test.tsx tests/components/Chat/pages/ContactLists.test.tsx`
  → **exit 0, 72 passed (72)**. Every case below is part of that run, and of the
  full `pnpm test:run` run, where it also passed.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | `ContactLists.test.tsx` › "draws the contact the form matched first — a contact with a chat"; "… — a contact with no chat, above the import's rows" | declared tests command | 0 | both passed | met |
| AC-2 | `ContactLists.test.tsx` › "frames the matched row in red, and no other row" | declared tests command | 0 | passed | met |
| AC-3 | `ContactLists.test.tsx` › "keeps a steady frame, not the import's fading flash"; `ChatContactsUpload.test.tsx` › "reports the same row once while the typed number still matches it" | declared tests command | 0 | both passed | met |
| AC-4 | `ChatContactsUpload.test.tsx` › "reports no match when the number changes to an unsaved one, is cleared, or the form closes"; `ContactLists.test.tsx` › "removes the frame and restores the order when the match ends" | declared tests command | 0 | both passed | met |
| AC-5 | `ChatContactsUpload.test.tsx` › "reports contact B after the number changes from A's to B's"; `ContactLists.test.tsx` › "moves the frame from A to B" | declared tests command | 0 | both passed | met |
| AC-6 | `ChatContactsUpload.test.tsx` › "names a contact the shopper chats with as the chat row does, not by the account name" | declared tests command | 0 | passed | met |
| AC-7 | `ChatContactsUpload.test.tsx` › "names a contact with no chat as its row does" | declared tests command | 0 | passed | met |
| AC-8 | `ChatContactsUpload.test.tsx` › "warns about a number that is already saved and refuses it" (`border-red-400`, `text-red-600`) | declared tests command | 0 | passed | met |
| AC-9 | `ChatContactsUpload.test.tsx` › "warns about a number that is already saved and refuses it" (no request); "BUG-1: refuses a saved number whose contact has no name" | declared tests command | 0 | both passed | met |
| AC-10 | `chatSearch.test.ts` › three `drawnContactFor` cases; `ChatContactsUpload.test.tsx` › "reports the drawn row when the person is saved twice in two formats" | declared tests command | 0 | all passed | met |
| AC-11 | `ContactLists.test.tsx` › "after an import, the contacts already saved move to the top and flash" (+ S-1 no-remount assertion) | declared tests command | 0 | passed | met |
| AC-12 | Read `tester guide/chat.md` TC-D-03 | read | — | Expected Result now says: red line "Already saved as <name>" with the list's name, red phone field, Confirm off, the contact first in the list with a red frame until the number changes or the form closes. TC-D-04 unchanged. | met |

### Profile checks (whole repository)

| Check | Command (resolved) | Exit | Output summary | In this ticket's files? |
|-------|--------------------|------|----------------|-------------------------|
| `lint` | `pnpm lint` | **1** | 2 errors, both `components/SellerDashboard/CommentProductInfo.tsx:141,368` (i18n keys "Standard", "View product" missing from ar/tr/ku). `eslint` on the 7 changed source/test files alone: exit 0 (implement stage). | **No** — see BUG-2 |
| `typecheck` | `pnpm exec next typegen` + `node_modules/.bin/tsc --noEmit --pretty false` | **1** | 0 errors outside `.next/dev/`; 3 errors in `.next/dev/types/validator.ts` (lines 926-929), a file a running `next dev` writes and whose tail is garbled. (The first, background attempt exited 127 — `tsc` was not found from that shell; the foreground re-run above is the result of record.) | **No** — see ENV-1 |
| `unit-tests` | `pnpm test:run` | **1** | 7449 passed, 3 expected fail, **1 failed**: `tests/components/SellerDashboard/CommentProductInfo.test.tsx` › "renders external product link when product slug is present". Every Chat test file passed. | **No** — see BUG-3 |

**Integration surface — held.** The full run includes `ChatLists.test.tsx`,
`ChatSearch.test.tsx`, `chatSearch.test.ts`, `SearchResult.test.tsx`,
`ChatWidget.test.tsx` and every other chat suite; all passed. The existing
ContactLists cases that read `SenderName` passed, so `contactRowName` did not
change any row's name. The phone import is guarded by AC-11, including the S-1
no-remount check.

## Commands run

- `pnpm vitest run --project unit tests/components/Chat/chatSearch.test.ts tests/components/Chat/components/ChatContactsUpload.test.tsx tests/components/Chat/pages/ContactLists.test.tsx`
  ```
  Tests  72 passed (72)        exit 0
  ```
- `pnpm lint`
  ```
  ✖ 81 problems (2 errors, 79 warnings)    exit 1
  errors: components/SellerDashboard/CommentProductInfo.tsx 141:40, 368:36 (local/translate-key-exists)
  ```
- `pnpm exec next typegen && ./node_modules/.bin/tsc --noEmit --pretty false`
  ```
  exit 1 — 3 errors, all in .next/dev/types/validator.ts; 0 elsewhere
  ```
- `pnpm test:run`
  ```
  Test Files  1 failed | 649 passed (650)
  Tests  1 failed | 7449 passed | 3 expected fail (7453)    exit 1
  FAIL tests/components/SellerDashboard/CommentProductInfo.test.tsx > … > renders external product link when product slug is present
  ```

## Findings — confirmed bugs, out of scope

| BUG  | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Expected vs actual | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------------------|--------|
| BUG-1 | A saved contact with no name could be added again. **Fixed in this ticket** (in scope: `ChatContactsUpload.tsx` is in Files to change). | `ChatContactsUpload.test.tsx::BUG-1: refuses a saved number whose contact has no name` — no marker, passes (red before the fix, green after; see `implement.md`) | `components/Chat/components/ChatContactsUpload.tsx` | expected: refused, Confirm off · actual before fix: Confirm on, no warning | none needed — fixed here |
| BUG-2 | The product box in seller comments shows two untranslated texts. | `pnpm lint` (`local/translate-key-exists`) — a lint rule, not a test; no marker | `components/SellerDashboard/CommentProductInfo.tsx:141, 368` (commit `be5df4f2`) | expected: "Standard", "View product" in ar/tr/ku · actual: missing in all three | _(to open)_ |
| BUG-3 | A unit test still expects the old product link. | `tests/components/SellerDashboard/CommentProductInfo.test.tsx::renders external product link when product slug is present` — fails, no marker | the test (the component builds `/products/<slug>` at line 252 since `be5df4f2`) | expected by the test: `/en/product/running-sneakers` · actual: `/products/running-sneakers` | _(to open)_ |
| ENV-1 | The typecheck reads a half-written generated file. | `tsc --noEmit` — 3 errors in `.next/dev/types/validator.ts` | the local `.next/dev/` folder of a running `next dev` (not tracked in git) | expected: a whole file · actual: a garbled tail at lines 926-929 | none — local; restart `next dev` or delete `.next/dev/types` when no dev server is running |

None of BUG-2, BUG-3 or ENV-1 lies inside `plan.md > Files to change`. All three
existed before this ticket (BUG-2 and BUG-3 since `be5df4f2`, 2026-10-01).

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **No.** No
  protected runtime path (`proxy.ts`, `next.config.ts`, `instrumentation*`,
  `sentry.*`, `.github/workflows/**`) was touched.
- Runtime impact: client-only UI change in the chat widget's contacts panel. No
  new request, no new event, no new translation key.

## Sign-off

- Outcome: **verified** — every AC-1 … AC-12 is met; the declared tests ran
  (exit 0). The `logic-change` profile exits non-zero on all three checks, but
  every failure is outside this ticket's files and recorded above.
- Final ticket state: completed
- Sign-off: developer (owner), 2026-10-04, after the verify comprehension gate
  (2/2, degraded — see `comprehension.md`).
- Commit: none created at verify (VF-10). **When publishing, stage only this
  ticket's 8 files** — the working tree also holds another session's
  `components/DemoApp1/*`, `tests/components/DemoApp1/Demo1Shell.test.tsx`,
  `correct.jpeg`, `temp1.jpeg`, `temp2.jpeg`.
- Notes: panel findings S-2, S-4, P-1, P-3 (minor) were not acted on; they can
  be raised later if wanted.
