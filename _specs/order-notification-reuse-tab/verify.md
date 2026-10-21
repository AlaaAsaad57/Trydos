---
ticket: order-notification-reuse-tab
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Verify — order-notification-reuse-tab

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `logic-change` (`.claude/project-config.yaml`, pre-existing)
  → checks `lint`, `typecheck`, `unit-tests`, depth `all-ac`.
- Branch: `ticket/order-notification-reuse-tab` (base `origin/development` at
  `fcc32c99`), 7 changed files, all listed in `plan.md > Files to change`.

### Profile checks

| Check | Command (resolved) | Exit | Output summary | Result |
|-------|--------------------|------|----------------|--------|
| `unit-tests` | `pnpm test:run` (= `vitest run --project unit`) | 0 | `Test Files 657 passed (657)`; `Tests 7692 passed \| 2 expected fail (7694)`; 953 s | pass |
| `typecheck` | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no output | pass |
| `lint` | `pnpm lint` (= `eslint .`) | **1** | `✖ 82 problems (2 errors, 80 warnings)`. Both errors are `local/translate-key-exists`: `"Search a tag"` and `"New tag"` are missing from ar / tr / ku, in `components/Chat/components/TaggedMessages.tsx` and `components/Chat/components/messages/MessageTagPicker.tsx` | **fail — outside this ticket** (see Findings F-1) |
| `lint`, this ticket's files | `npx eslint` on the 7 changed files | 0 | no errors | pass |

The 2 expected failures are existing `it.fails` markers that carry bug ids (for
example `tests/components/Chat/SearchResult.test.tsx` › `BUG-chat-8`). This
ticket added none.

### Per acceptance criterion

All cases below ran inside the `unit-tests` check above (exit 0). They were also
run alone, red on the old code and green on the new code, at `/implement`
(`implement.md > Tests written`).

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1  | `firebaseMessagingSwTags.test.ts` › `a click on a notification` › `a "%s" click focuses the open tab on that order and asks it to refresh`; `chatMuteNotifications.test.ts` › `forwards an order refresh request to the order page, and nothing else` | `pnpm test:run` | 0 | passed (red before) | pass |
| AC-2  | `OrderDetailsWrapper.test.tsx` › `a refresh request from the service worker` › `reloads the order and shows the new status when the service worker asks this tab to refresh` | `pnpm test:run` | 0 | passed (red before) | pass |
| AC-3  | `firebaseMessagingSwTags.test.ts` › `an order-status click opens a new tab when %s` (no tab; order 99; orders list; order 112) | `pnpm test:run` | 0 | passed (regression guard) | pass |
| AC-4  | `firebaseMessagingSwTags.test.ts` › `an order-status click without an order group id reuses no tab` | `pnpm test:run` | 0 | passed (regression guard) | pass |
| AC-5  | AC-1 worker case for `"order status changed"` and `"order status changed to shipped"` | `pnpm test:run` | 0 | passed (red before) | pass |
| AC-6  | `firebaseMessagingSwTags.test.ts` › `with two tabs on the same order, only the most recent one is reused` | `pnpm test:run` | 0 | passed (red before) | pass |
| AC-7  | `OrderDetailsWrapper.test.tsx` › `ignores a refresh request for another order group`; `chatMuteNotifications.test.ts` › the AC-1 handler case (no `handleNotification`, `shouldUpdateOrders` stays `0`) | `pnpm test:run` | 0 | passed (handler row red before; page row green before, no listener existed) | pass |
| AC-8  | `firebaseMessagingSwTags.test.ts` › `a delivery-chat click still focuses the order tab and opens the chat, or opens a new tab` | `pnpm test:run` | 0 | passed (regression guard) | pass |
| AC-9  | `firebaseMessagingSwTags.test.ts` › `an order-status click opens a new tab when %s` (focusing fails; sending fails; both check the tab was tried first) | `pnpm test:run` | 0 | passed (red before) | pass |
| AC-10 | `firebaseMessagingSwTags.test.ts` › `a "%s" click opens one new tab and keeps the worker alive until it is requested` (`order placed`, `product discount`) | `pnpm test:run` | 0 | passed (red before) | pass |
| AC-11 | `firebaseMessagingSwTags.test.ts` › `a plain click on a call card opens no tab` | `pnpm test:run` | 0 | passed (regression guard) | pass |

### Integration surface — did it hold?

- `focusOrOpenOrderTab` has exactly two callers after the change
  (`firebase-messaging-sw.js:757`, `:768`). The chat caller passes the same
  `OPEN_DELIVERY_CHAT` object the helper used to build (AC-8 proves it).
- `handleServiceWorkerMessage` gained one `else if`. It still has no `else`, so
  an unknown message is ignored (the old-page / new-worker case stays safe).
- The arrival path (`sendToForeground` → `FCM_NOTIFICATION` →
  `handleMarketEvent` → `shouldUpdateOrders`) is unchanged; no line of it is in
  the diff.
- The new page listener reloads only on a matching group id (AC-7).
- Held as declared.

## Commands run

- `pnpm test:run`
  ```
  Test Files  657 passed (657)
       Tests  7692 passed | 2 expected fail (7694)
    Duration  953.45s
  exit 0
  ```
- `node_modules/.bin/tsc --noEmit --pretty false`
  ```
  (no output) — exit 0
  ```
- `pnpm lint`
  ```
  components/Chat/components/TaggedMessages.tsx / MessageTagPicker.tsx
    error  i18n key "Search a tag" is missing from: ar, tr, ku  local/translate-key-exists
    error  i18n key "New tag" is missing from: ar, tr, ku       local/translate-key-exists
  ✖ 82 problems (2 errors, 80 warnings) — exit 1
  ```
- `git diff --quiet origin/development -- components/Chat public/translations`
  ```
  identical — the two lint errors exist on the base branch
  ```
- `npx eslint <the 7 changed files>` — exit 0

## Findings — confirmed bugs, out of scope

`implement.md > Findings` recorded none, so no `BUG-n` is carried forward.

| BUG  | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Expected vs actual | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------------------|--------|
| F-1 | `pnpm lint` fails on the base branch: two chat-tag strings are used through the translate function but are missing from the ar / tr / ku translation files. | Not a test: the `lint` check of the `logic-change` profile (`local/translate-key-exists`). | `components/Chat/components/TaggedMessages.tsx` (`"Search a tag"`) and `components/Chat/components/messages/MessageTagPicker.tsx` (`"New tag"`), from commit `1163efd1`. Both files are outside `plan.md > Files to change`, and they are identical on `origin/development`. | Expected: both keys present in `public/translations/translations.{ar,tr,ku}.js`, `pnpm lint` exit 0. Actual: keys missing, exit 1. | _(to open)_ |

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **no**
  (this repository has none; `instrumentation*`, `sentry.*.config.ts`,
  `proxy.ts`, `next.config.ts` and `.github/workflows/**` are not in the diff).
- Runtime impact: the service worker changes for every shopper on the browser's
  next worker update. Review P-5 stays a release check: confirm the host's
  `Cache-Control` header for `/firebase-messaging-sw.js` so a revert spreads
  quickly.

## Sign-off

- Outcome: **verified** — every `AC-n` is satisfied by a test that ran inside
  the profile with exit 0, and the comprehension gate passed (3/3, degraded —
  see `comprehension.md > degraded`). The profile's `lint` check exits 1 only
  because of F-1, which lives outside `plan.md > Files to change` and is present
  on the base branch; lint on this ticket's 7 files exits 0.
- Final ticket state: completed
- Sign-off: developer (owner), 2026-10-21
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: F-1 needs its own small ticket (add the two keys to the three
  translation files). P-5 is a release check.
