---
ticket: chat-duplicate-contact-highlight
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-10-04
links:
  clickup:
  github:
---

# Review — chat-duplicate-contact-highlight

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

- `spec.md` (FR-1 … FR-11, NFR-1 … NFR-3, AC-1 … AC-12, OQ-1 … OQ-8 resolved).
- `plan.md` (approach, steps 1-7, files to change, integration surface, tests,
  BUG-1, validation `logic-change`, rollback).
- The advisory panel also read the source files the plan names:
  `ContactLists.jsx`, `ChatContactsUpload.tsx`, `chatSearch.ts`,
  `chatsFunctions.tsx`, `public/styles/chatcomponent.css`.

## Plan Summary

The add-contact form finds the row the list draws for the matched person
(`drawnContactFor`) and reports it to the list through a new optional
`onDuplicate(row | null)`. The list draws that row first, inside a steady red
outline. The warning name and the row name both come from one new function,
`contactRowName`. The warning and the phone field turn red. TC-D-03 in the
tester guide is rewritten. Tests extend three existing files; no new test file.

## Risks

- The import's flash replays when the duplicate row moves the other rows (panel
  finding S-1).
- The list's "chat row or contact row" choice and `contactRowName` could still
  drift apart (S-2).
- A short red flicker after a successful save (S-4).

## Assumptions

- `dedupeContacts` returns the original contact objects, so the form and the
  list can compare by identity for one contacts array.
- React Compiler memoizes the form's derived values; the plan does not depend on
  it for correctness (P-2).

## Open Questions

- None from the spec. The panel findings below are dispositioned at the decision.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).**
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| ID | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|----|------|----------|---------|--------------------------|---------------------|
| S-1 | senior | **major** | The rows are keyed by their **index** after the sort, and the import's flash wrapper is keyed `${alreadySaved.run}-${key}` (`ContactLists.jsx:27`, `:76`, `:186`). When the duplicate row moves to index 0, every `alreadySaved` row shifts by one, so its key changes. React remounts the wrapper, and the 3 s `contactAlreadySaved` animation (`chatcomponent.css:152-155`) plays again — and again when the match ends. `alreadySaved` is never cleared, so this repeats for the session. That breaks FR-10 ("import unchanged"), and the planned AC-11 case (import alone) cannot see it. Suggested: key rows by a stable id (contact id or phone) in the row and the flash wrapper; add an AC-11 assertion that setting and clearing `onDuplicate` does not remount the flashed rows. Verified by the gate author against `ContactLists.jsx:25-32, 61`. | plan step 4; FR-10; AC-11 | **accept** — owner, 2026-10-04: at implement, key the rows and the flash wrapper by a stable id, and add the AC-11 "no remount" assertion. Both files are already in plan > Files to change. |
| S-2 | senior | minor | FR-6 is only half "by construction". `contactRowName` would decide "chat row or contact row" with its own copy of the chat lookup, while the list still decides the branch inline (`ContactLists.jsx:62-71`). If one copy changes, the warning name and the row can disagree again. Suggested: the list's branch and `contactRowName` use the same lookup. Do not use `directChatWith` (it skips order chats and would change row names). | plan steps 3-4; AC-6, AC-7 | noted — not a major finding; no owner disposition required |
| S-3 | senior | minor | The AC-3 list case "keeps the frame after 4 seconds" (fake timers) cannot fail for the reason it claims: jsdom runs no CSS animation and nothing changes on a timer. Suggested: assert the framed wrapper carries the outline classes and **not** `contact-already-saved` or any `animate-*` class; keep the form case "same row reported once". | Tests table, AC-3 | noted — not a major finding; no owner disposition required |
| S-4 | senior | minor | After a successful save, `getContacts()` updates the store before the form clears `localPhone` and closes (`ChatContactsUpload.tsx:133-136`). For one render the new contact matches the typed number, so the form may report it through `onDuplicate` and flash a red frame and warning. Suggested: clear/close the form before `await getContacts()`, or check in the AC-4 form case that after a save the last `onDuplicate` call is `null` with no frame call before it. | plan step 5; AC-4 | noted — not a major finding; no owner disposition required |
| S-5 | senior | info | The Integration surface claims hold. It leaves out one shared item: the CSS flash in `public/styles/chatcomponent.css`, which depends on stable keys (S-1). | plan > Integration surface | noted — not a major finding; no owner disposition required |
| S-6 | senior | info | BUG-1 is inside a file the plan changes and the map change fixes it with a red-first case. In scope, fits FR-8. | plan > Findings; AC-9 | noted — not a major finding; no owner disposition required |
| S-7 | senior | info | Scope is small and fits the ACs: no config, no new layer, no translation key; the rollback is real. | plan.md | noted — not a major finding; no owner disposition required |
| P-1 | performance | minor | Index keys (`ContactLists.jsx:61, 76, 186`): adding or removing the wrapper `<div>` changes the element type at that place, so React remounts that `ChatItem`/`SearchResult` and reloads its photo; moving a row to index 0 re-renders the rows above its old place. Once per match change. Suggested: always draw the same wrapper and only switch the class, or key rows by contact id. | plan step 4 | noted — not a major finding; no owner disposition required |
| P-2 | performance | minor | `drawnContactFor` runs `dedupeContacts` over the whole list, O(n), on each keystroke unless memoized. Suggested: return `null` before any list work when there is no record. | plan steps 2, 5 | noted — not a major finding; no owner disposition required |
| P-3 | performance | minor | When contacts refresh while a match is shown, the list renders twice: the parent holds the old `duplicate` object, so the first render finds no identity match; the child effect then sends the new row. Rare. Suggested: accept and note it, or compare by `contactUserId` / `normalizePhone` instead of identity. | plan steps 4-5 | noted — not a major finding; no owner disposition required |
| P-4 | performance | info | No render loop is likely: the effect depends on `[row, showAddForm]`, and `setDuplicate` with the same object bails out. Suggested: a short comment on why `onDuplicate` is not in the deps. | plan step 5 | noted — not a major finding; no owner disposition required |
| P-5 | performance | info | `contactRowName` replaces 2 of about 10 identical `chats.filter(...)` calls per chat row; `useAppStore()` with no selector re-renders the list on any store change. Both exist today; not made worse. Out of scope. | plan steps 3-4 | noted — not a major finding; no owner disposition required |
| P-6 | performance | info | NFR-2 holds (no request per keystroke); the outline adds no layout or animation cost. | spec NFR-1, NFR-2, NFR-3 | noted — not a major finding; no owner disposition required |
| X-1 | security | info | The warning now may show `channel_name`, which another user may control. It is rendered as JSX text, so React escapes it. Keep it out of `dangerouslySetInnerHTML` and out of HTML-built translated strings. | AC-6; plan steps 3, 5 | noted — not a major finding; no owner disposition required |
| X-2 | security | info | The duplicate refusal is client-only; a direct `POST /api/v1/users/save_contact_v2` skips it. The backend stays the only real guard. Do not describe AC-9 as server-side protection. | AC-9; FR-8; BUG-1 | noted — not a major finding; no owner disposition required |
| X-3 | security | info | Small blast radius: UI only, 4 source files, no endpoint, cookie, token, config or protected path. One-commit revert. | plan > Files to change, Rollback | noted — not a major finding; no owner disposition required |
| X-4 | security | info | The form will pass full contact records (with the phone number) to the list. Do not put the record into `LogError`, PostHog or gtag payloads. | plan step 5 | noted — not a major finding; no owner disposition required |

## Decision

`APPROVED`

- Rationale: The owner chose APPROVED after reading the plan and the panel
  findings, and after passing the comprehension gate (2/2, degraded — see
  `comprehension.md`). The one major finding, S-1, was accepted. Its fix stays
  inside files the plan already lists (`ContactLists.jsx`,
  `ContactLists.test.tsx`), so the plan was not sent back.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer (self-approval), 2026-10-04

## ADR reference

- ADR: none

## Required Follow-up Actions

- **S-1 (accepted):** in `ContactLists.jsx`, key each row and the import's flash
  wrapper by a stable id (the contact id, or its phone), not by the index. In
  `ContactLists.test.tsx`, the AC-11 case also asserts that setting and clearing
  `onDuplicate` after an import does not remount the flashed rows (same DOM node).
  Record both in `implement.md` against S-1.
- The minor and info findings were not dispositioned by the owner. They are left
  to `/implement` only where they fit inside the plan's declared steps and files.
