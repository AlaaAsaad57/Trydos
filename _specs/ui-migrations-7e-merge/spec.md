---
ticket: ui-migrations-7e-merge
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Spec — ui-migrations-7e-merge

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Stage 7e part 1 — every `development` change since 2026-11-17 on `ui-migrations`.

## Business Goal

The designer approved new screens and the team fixed bugs on `development`. `ui-migrations` is where the
new design becomes the real app. Until it has these changes, the next two Stage 7e tickets (the start flow
and sign-in sheet; the orders screens) have no correct base, and shoppers on the `ui-migrations` preview
miss the session, push, order and email fixes. Both branches are staging.

## User Story

> As the owner of the UI migration, I want every change made on `development` up to `9517cb02b` to be in
> `ui-migrations`, with the conflicts solved, the email fix working on the new Personal Info screen, and the
> Safari splash fix kept without its debug tools, so that the next two tickets start from a branch that has
> every approved design and fix, and pages still open as fast as now.

## Functional Requirements

- **FR-1 — Every commit is in.** `ui-migrations` contains every `development` commit up to and including
  `9517cb02b`.
- **FR-2 — The real login is unchanged in behaviour.** The real login page still: sends the code, verifies
  it, locks after 3 wrong codes, resends, asks for the name, sends its analytics events, and returns the
  shopper to the page they came from.
- **FR-3 — Demo tools stay out of `ui-migrations`.** The tools Stage 1 removed do not come back: the login
  demo control bar, the device info window, the logo motion picker and its saved picks, and the 4 demo-tool
  words ("Hide menu", "Device and browser info", "Tab bar colour", "Reset tab bar colour").
- **FR-4 — `/demo` on `ui-migrations` matches `/demo` on `development`.** It opens with the start animation,
  then the country picker, then the Quick Preview, then Get Started, then the page; the sign-in request
  sheet comes 5 s after the page shows; the orders list and order details demo screens open from the
  profile's Orders card; the start-to-app fade is the one on `development`.
- **FR-5 — The Personal Info screen asks for the email code before it saves a new email.**
  - A new email is one that is not empty and differs from the saved email after trimming and lowercasing.
  - "Add & save" with a new email opens the email code sheet and sends the code to the new email before any
    profile save.
  - The profile save never carries the new email. After a right code, only the other changed fields are saved.
  - When no other field changed, a right code ends the edit with nothing more sent.
  - If the core backend still answers a save with "verify the new email", the sheet opens (second net).
  - Closing the sheet without a right code saves nothing and keeps what the shopper typed.
- **FR-6 — The Safari 26 splash fix stays; its debug tools go.**
  - On iPhone Safari 26 and later, the waiting splash uses the fix that `development` gives by default
    (`in-flow`), on the real login page too.
  - In every other browser, the splash behaves as it does without the fix (`off`).
  - Nothing on screen lets anyone change the mode, show rulers or diagnostics, or pause the splash.
    No address parameter and no saved browser setting changes the mode.
  - The 5 modes that nothing selects any more are gone.
- **FR-7 — Images keep loading from the one media origin**, and the page still opens its early connection to
  the image host.
- **FR-8 — Flags in the real address form and delivery sheet.** The real country shows the design's row flag
  when the design's flag set has that country (Turkiye, Syria, Iraq, Lebanon), and the standard flag of that
  country otherwise. Syria uses its new row flag. The forms still show only real data (the address form
  lists only the page's country; the delivery sheet's Pickup card still says "Soon available").
- **FR-9 — The profile's Orders card on the real app still opens the existing orders page.** The new orders
  screens become real in part 3, not here.
- **FR-10 — The session-expired fixes work on `ui-migrations`.** While the session-expired prompt is open, or
  while the expire step runs, a market call waits for the shopper to sign back in; sign-in calls are never
  held; chat, stories, comments and wallet calls are not held.
- **FR-11 — An "order placed" push opens that order's details page** (the list when the push has no order id).
- **FR-12 — The existing order details page keeps the chosen pack after a refresh**, and the return request
  and the cancel act on the pack of the item.
- **FR-13 — Every new user-visible word is translated** in Arabic, Turkish and Kurdish, and the three
  translation files stay key-parallel.
- **FR-14 — The server setup from `development` is present** (Docker image, observability, request logging)
  and the production build passes.

## Non-Functional Requirements

- **NFR-1 — Same design (S7e-1).** Every screen this ticket touches looks the same as its `/demo` version on
  `development`. The real login's Quick Preview looks and moves as on `development`. The real address form
  and delivery sheet change only their flags.
- **NFR-2 — Speed (S7e-9).** Pages and sheets open as smoothly and as fast as now:
  - The JavaScript that the real login page loads does not grow by more than the start flow's own parts
    need; the removed debug parts and modes are not shipped.
  - Every other real page loads no new JavaScript from this ticket.
  - No cache is added as a speed fix.
  - The login page and one other real page are measured before and after, on a production build with a
    slow phone (4x CPU), and the numbers are written down.
- **NFR-3 — Right to left.** Arabic and Kurdish keep the logical sides on every touched screen.
- **NFR-4 — Reduced motion.** A shopper with reduced motion still gets no slides, as now.

## Constraints

- Work on `ui-migrations`; the ticket branch is cut from it and the PR goes to it (S7e-5).
- No protected runtime path is changed.
- Real data only on real screens: no demo data and no fake success (S7e-3, S7e-6).
- Tests (OQ-2, the owner on 2026-11-28): the email port follows the repo rule — its new test cases are seen
  failing on the old screen first, then passing. The 2 existing cases that describe the old behaviour are
  rewritten. The other test changes are the ones research found (OQ-8). The browser suite is ignored (A-34).
  The full unit suite runs in CI, not on the laptop.
- Nothing is pushed or merged into `ui-migrations` without the owner's OK.

## Edge Cases

- The same email in other capitals, or a cleared email: no code; saved as before.
- A save refused for another field after a right code: the next save asks no second code and does not send
  the email.
- The core backend's "verify the new email" answer on an email the screen saw as the same: the sheet opens;
  after a right code the email is not sent again.
- A wrong code, an expired code, too many tries: the sheet shows the answer; nothing is saved.
- The page's country has no flag in the design's set: the standard flag shows.
- Arabic page: flags and rows keep the logical side.
- iPad, desktop Safari, Chrome, Firefox, Android: no splash fix (`off`).
- An old saved splash setting in a tester's browser, or an old link with the mode parameter: ignored.
- A push with no order id: opens the orders list, never an "undefined" order page.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Yes. The 5 unused modes are deleted; only the default fix and "off" stay (owner, 2026-11-28). | FR-6, AC-7, NFR-2 |
| OQ-2 | The repo rule: new cases for the email port are seen failing on the old screen first, then passing. The 2 existing cases that describe the old behaviour are rewritten (owner, 2026-11-28). | Constraints, AC-5, AC-6 |
| OQ-3 | Yes, the Vercel env of the `ui-migrations` preview already has the single media variable (owner, 2026-11-28). | FR-7, AC-9 |
| OQ-4 | Yes. The early connection to the image host moves to the single media origin. | FR-7, AC-9, NFR-2 |
| OQ-5 | Yes. The design's row flag when the set has the country (Turkiye, Syria, Iraq, Lebanon); the standard flag otherwise. | FR-8, AC-10 |
| OQ-6 | Yes. The demo tools Stage 1 removed stay out. | FR-3, AC-3 |
| OQ-7 | Yes. `/demo` on `ui-migrations` takes the full start flow, the sign-in sheet, the orders demo screens and the start-to-app fade. | FR-4, AC-4 |
| OQ-8 | Yes. The 5 tests that set the removed media variable are updated in this ticket. | FR-7, AC-9 |

## Open Questions

- None. Every `OQ-n` is answered above.

## Acceptance Criteria Mapping

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | `9517cb02b` is an ancestor of the ticket branch head, and the branch head descends from `ui-migrations` at `246536cea`. | FR-1 |
| AC-2 | On the real login page, the existing login tests pass, and a manual run (phone → code → name) on the preview signs in and returns to the page in the return path. A wrong code 3 times shows the lock. | FR-2 |
| AC-3 | No source file outside `/demo`-only code contains the login control bar, the device info window, the logo motion picker or its saved picks; none of the 4 demo-tool words is in the word list; the login page shows no control bar. | FR-3 |
| AC-4 | `/demo` on `ui-migrations` and `/demo` on `development`, opened fresh at 430 x 932 in Chromium, go through the same steps in the same order (animation, picker, Quick Preview, Get Started, page; sign-in sheet after 5 s), and the profile's Orders card opens the orders demo list. Screenshots of each step match within the font-only tolerance used in Stage 7e. | FR-4, NFR-1 |
| AC-5 | On the Personal Info screen, typing a new email and tapping "Add & save" opens the code sheet and asks the core backend for a code for that email (trimmed, lowercase), and sends no profile save. Proved by new unit cases seen failing on the old screen and passing after. | FR-5 |
| AC-6 | After a right code, the profile save carries only the other changed fields (none when nothing else changed); a later save asks no second code; the same email in other capitals and a cleared email open no sheet; the core backend's "verify the new email" answer still opens the sheet; closing the sheet saves nothing. Proved by unit cases (new ones seen failing first; the 2 old-behaviour cases rewritten). | FR-5 |
| AC-7 | The login page ships no debug menu, rulers, diagnostics or pause; a mode parameter in the address and a saved browser setting do not change the mode; only the default fix and "off" exist. The splash unit tests cover: iPhone Safari 26 user agent → the fix; any other user agent → off; the parameter and the saved setting are ignored. | FR-6, NFR-2 |
| AC-8 | In WebKit at an iPhone Safari 26 user agent, the real login's waiting splash takes the fix: the login box is out of fixed position while the splash waits, and the fix's rules reach the login stage. In Chromium the splash looks as before. | FR-6, NFR-1 |
| AC-9 | Images on the preview load from the single media origin; the root page starts an early connection to that origin; the 5 tests that set the old variable pass with the single variable. | FR-7 |
| AC-10 | The real address form and delivery sheet show the design's row flag for Turkiye, Syria, Iraq and Lebanon and the standard flag for another country, on the logical side in Arabic; the address form still lists only the page's country; Pickup still says "Soon available". | FR-8, NFR-1, NFR-3 |
| AC-11 | On the real app, the profile's Orders card opens the existing orders page. | FR-9 |
| AC-12 | The session-expired and push unit tests that come from `development` pass on the ticket branch. | FR-10, FR-11 |
| AC-13 | The order details unit tests that come from `development` pass on the ticket branch. | FR-12 |
| AC-14 | `pnpm lint`, `pnpm lint:i18n-parity`, the typecheck and `pnpm build` pass; the CI unit suite on the ticket branch has no failure that the `ui-migrations` base (`246536cea`) did not have. | FR-13, FR-14 |
| AC-15 | The login page's JavaScript size and one other real page's size, and the time to first paint of both (production build, 4x CPU), are written down before and after; the other page's numbers do not grow; the login page grows only by the start flow's own parts. | NFR-2 |

## Out of Scope

- Making the start flow, the country picker and the sign-in request sheet real (Stage 7e part 2, Steps 4–5).
- Making the orders screens real (Stage 7e part 3, Step 6).
- The browser (e2e) suite (A-34).
- The uncommitted demo files in the `../trydos-checkout-85-102-86-103` and `../trydos-popcheck` worktrees.
- Any change to the backend.
