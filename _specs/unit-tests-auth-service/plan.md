---
ticket: unit-tests-auth-service
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-16
links:
  clickup:
  github:
---

# Plan — unit-tests-auth-service

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Two pieces of work on one branch, in this order: **delete the dead paths first,
then write the tests against the code that actually ships.** Four new test files
in the `tests/` mirror (three for the service, one for the state slice) plus two
small shared stand-ins, and seven source files trimmed of code that has no
caller. **No behaviour changes**, with one stated exception in decision 5.

Six decisions carry the ticket, and each rules out the obvious alternative:

- **The tests drive the real state slice, not a bag of spies (answers OQ-1).** A
  new helper builds a store from the **real** auth reducer — the same function
  `store/index.ts` spreads — with plain stubs for the three members the service
  reads from other slices (`LoggingOut`, `setIsRegisteringReady`, `language`).
  Every state criterion is then proved by reading the state afterwards, which is
  what AC-38 demands. The alternative — `makeStoreMock` plus a `vi.fn()` per
  action — cannot satisfy it: it proves the service called something, not that a
  shopper ended up signed in. The reducer file imports nothing, so pulling the
  real slice in costs nothing. The shared `tests/mocks/store.ts` is **not**
  modified: other suites depend on its current default state, and this helper
  sits beside it instead. The helper exposes a **reset to fresh initial state**,
  because the store lives inside a `vi.mock` factory and therefore outlives a
  single test — see the isolation table.
- **One mechanism for the outbound boundary, with one stated exception (answers
  OQ-2).** Calls through the shared request helper use the existing module
  stand-in; everything on the global `fetch` is installed with `vi.stubGlobal`
  and replied to by the shared **`tests/mocks/mockFetch.ts`**, which records
  every call and **raises a clear error naming the address when its queue runs
  out** — the property AC-37 rests on.
  **Replies are set per call, never left to a default.** The request-helper
  stand-in answers every call with success unless told otherwise, which would
  make an unplanned profile leg indistinguishable from a deliberately skipped one
  — and "skipped" is a real outcome on those legs (FR-9). So the OTP and profile
  files queue a reply per expected call and assert on the recorded parameters.
  *(Review follow-up 4.)*
  **The exception, stated rather than hidden:** the session file's concurrency
  cases need a reply the test can **hold open and release**, to prove two callers
  share one exchange. The shared stand-in has no such reply — only an ordered
  queue with an optional real delay — and this ticket will not add one to a file
  every other suite loads. So `auth.session.test.ts` keeps a **local** gated
  stub, exactly as the neighbouring `authRefreshSession.test.ts` already does for
  the same reason. (An earlier draft claimed that suite used the shared helper;
  it does not.)
- **Four files, split by journey step (answers OQ-7).** Sending and verifying a
  code; keeping or losing the session; changing the profile. Plus the state slice
  on its own. Each of the three service files carries **its own** registration
  block of about twenty `vi.mock` lines: those ids are hoisted per file and
  several are relative (`"./home"`, `"./wallet"`), so a shared module can hold
  the factory **bodies** but cannot collapse the registrations.
- **Removals land first, in their own commit (answers OQ-8).** Writing tests
  against a parameter that is about to be deleted wastes the work, and C-9
  forbids testing anything scheduled for removal. The split is for readability
  only — see Rollback.
- **One deletion is reordered, not just deleted, because it is load-bearing.**
  The browser-storage write on the changed-phone path is the line that **throws
  first** today when the reply carries no data — before the phone is marked
  verified in the store and in the profile cookie. Deleting it naively would let
  a reply the server never confirmed flip a verification flag. So the token is
  read into a local value **before** the verified writes and returned at the end:
  the same read, in the same position, throwing the same error, with the storage
  write gone.
  **The one place behaviour is not literally identical:** today the storage write
  can itself throw — blocked or full storage, as in private browsing — and that
  aborts the method before the verified writes. Afterwards that failure mode
  simply does not exist, so a shopper whose storage is blocked now completes a
  verification the server had already confirmed. The direction is safe and no
  test is written for it; it is stated here rather than hidden under a claim of
  identity. *(Review follow-up 7.)*
  **The throw is an incidental property access, not a check.** That is recorded
  as a finding and said plainly in the test's own comment, so a later "cleanup"
  with optional chaining cannot quietly restore the weakness this reorder exists
  to prevent. *(Review follow-up 5.)*
- **Isolation is a file-level rule, and the store is part of it.** Named below.
  The runner turns on neither `unstubGlobals` nor `restoreMocks`, and — the point
  the previous revision got wrong — dropping the module reset does not remove the
  need for isolation, it moves it. One module instance per file is fine; one
  store **state** across a file is not. *(Review follow-ups 1, 2, 3.)*

### Isolation, timers and teardown, per file

| File | `beforeEach` | Timers | `afterEach` |
|---|---|---|---|
| `auth.otp.test.ts` | reset the store to fresh initial state; `mockReset()` **the spies this file queues replies on** (the send-code action, the request helper) and re-install their defaults | real | `vi.unstubAllGlobals()`, `vi.unstubAllEnvs()`, `vi.clearAllMocks()`, clear `localStorage` **and** `sessionStorage` |
| `auth.session.test.ts` | `vi.resetModules()` **as the first statement**, then import the service **after** it; reset the store; same targeted spy reset | real; concurrency uses the local gated reply, never a clock advance | same |
| `auth.profile.test.ts` | install fake timers; reset the store; same targeted spy reset | **fake**; the fixed 1500 ms wait is advanced, not waited on; the shared stand-in's **delayed replies are not used in this file** — its delay awaits a real timeout and would never resolve | `vi.useRealTimers()` **first**, then the same list as above |
| `tests/store/auth/reducer.test.ts` | nothing | real | `vi.clearAllMocks()` only — it registers no stand-ins and imports only the reducer |

Three points behind the table:

- **The store outlives the test even without a module reset**, because it is built
  inside a `vi.mock` factory. `attempts` starts at 4 and the failed-attempt action
  decrements it, so without a per-test reset AC-9 ("does not decrement") and
  AC-32 would read a leaked counter and the suite would be order-dependent.
- **The spy reset is targeted, not blanket.** `vi.clearAllMocks()` clears call
  logs but keeps queued one-off implementations, so a reply set in one test would
  survive into the next. The fix is **not** `vi.resetAllMocks()`: that would also
  strip the implementations of the navigation, send-code and cache stand-ins that
  `tests/setup.ts` registers globally, leaving later tests with hollow stand-ins.
  Each file resets only the spies it queues on, and re-arms their defaults.
- **Order matters in two places.** The session file's module reset is the first
  statement of `beforeEach` — not the teardown, because a file's teardown runs
  before the shared setup's, which re-imports three stand-ins dynamically; after a
  reset those would resolve to fresh instances and the real leftovers would never
  be cleared. And a reset only isolates the service singleton if the handle is
  imported **after** it; a top-of-file import keeps the old instance and turns the
  reset into pure cost. In the profile file, restoring real timers is the first
  statement of the teardown, before the shared setup's own hook runs.

Two further ambient inputs are pinned per file: `window.location.pathname` is set
once in each service file's setup (it drives the locale headers on the expire
call), and the media environment values are stubbed with `vi.stubEnv` for the
upload success case and released by `vi.unstubAllEnvs()`.

## Steps

1. **Prove each removal again at the moment of removal.** Repo-wide search for
   every caller and reader of each item in FR-13, opening each hit. Anything that
   still has one is left alone and recorded. This is AC-35 and it is done first,
   not assumed from research.
2. **Remove the token chain, whole — every write site and every read site.**
   Four write sites: the browser-storage write on the changed-phone path, the
   `idToken` property in the sign-in success dispatch, and the two properties on
   the session check. Four read sites: the two uncalled service-login routines,
   and the same two lines on the session check, which read the stored key and
   write the unread field in one expression. Four files, and whole or not at all
   (C-8).
3. **Reorder the changed-phone path while removing its storage write**, per
   decision 5: read the token into a local value first, keep the verified writes
   after it, return the local value. Pinned by a test in **step 8**.
4. **Move the two comment blocks that explain the re-verification markers**
   (`shouldAuthinticated`'s `"expired"` / `"expired-login"` values, and the
   expired-phone field) onto the matching initial-state fields **before** deleting
   the type that currently carries them. They document exactly the markers AC-18,
   AC-19 and AC-21 pin.
5. **Remove the rest of the dead code.** The unused phone helper; the
   commented-out consistency check **and** the dangling reference to it left in
   the session check; the never-applied state type and the three types that exist
   only to describe it; the unused callback parameter of the verify call **and**
   the empty callbacks its four call sites pass; and the unread module variable in
   the auth stand-in. Type checking catches a missed call site, which is why the
   parameter goes last.
6. **Run lint, typecheck and the build.** The checkpoint for the whole removal:
   exported routines have been deleted from three service modules, and the build
   is the only check that catches a stale import path (C-5). Commit.
7. **Add the two shared stand-ins:** the real-slice store builder — which exposes
   a reset to fresh initial state — and the module of stand-in factory bodies for
   the service's import graph. That module **imports nothing but the test
   framework**, and every factory returns plain objects and spies. It covers the
   full list the existing refresh suite registers: the shared store, both
   notification-store ids, the shared utilities module, the send-code action, the
   lock store, the three sibling services under both their absolute and relative
   ids, both analytics helpers, the order funnel, the request helper, the
   session-read helper, the two constant modules, the error reporter, the wallet
   check and the upload helper. Every credential, phone number and id in these
   files is obviously fake, and no test reads a real environment value or an env
   file.
8. **Write the OTP tests** (AC-1..AC-12): sending, the four rejection branches of
   verifying, the success path's four service records, and the changed-phone path
   — including the reordering pinned in step 3. That test asserts **that it
   throws** and that the phone is left unverified in both the store and the
   profile copy; it never asserts the error message text, which is a raw engine
   string and differs between engines. *(Review follow-up 6.)*
9. **Write the session tests** (AC-13..AC-22): the exchange result mapping only —
   the single-flight is already covered and is not repeated (C-7) — then the
   expiry cycle, including the late read of the armed-flow marker, proved by
   changing the store between the reply and the assertion. Concurrency uses the
   local gated reply.
10. **Write the profile tests** (AC-23..AC-29): the rename that stays after a
    refusal, the three ordered legs and their rollback, the two-way picture path
    mapping, and the upload including the unreadable-reply case.
11. **Write the state-slice tests** (AC-30..AC-34), driving the reducer directly.
    Plain setters are excluded.
12. **Run the validation profile's checks.** The order-independence pass (AC-39)
    is a **second run over the four new files only**, in shuffled order.
13. **Write `implement.md`**, carrying:
    - every finding, including: the unencoded query interpolation on the
      changed-phone call — named as a **follow-up ticket candidate** with the
      injection shape spelled out (user-typed values interpolated into an auth
      query string with no encoding, so a separator character can add upstream
      parameters), and marked in the test's own comment as a pinned defect rather
      than a contract; the fact that the preserved throw is an incidental property
      read, not a check; and that a raw internal error message reaches the shopper
      untranslated through the existing catch. *(Review follow-ups 5, 6, 8.)*
    - the note that the shared factory module duplicates the registration list the
      existing refresh suite declares inline, and that the two can drift as the
      service's imports change;
    - the three places this ticket departs from the roadmap document;
    - the measured runtime **per file** for the four new files — recorded numbers,
      with **no threshold**, because there is no CI to enforce one *(review
      follow-up 13)*;
    - the note that the removals take work off two hot paths.

## Files to change

### Source — removals, plus one behaviour-preserving reorder

- `services/auth.ts` — **modified.** Remove the `localStorage["ID-TOKEN"]` write
  (line 297) and, in the same edit, **reorder** the changed-phone path so the
  token is read before the verified writes (step 3). Remove the `idToken:
  user.id_token` property in the sign-in success dispatch (line 211), the
  never-called `normalizePhone` (line 69), the unused `EditPhoneFunc` parameter
  of `VerifyOtp` (line 126), and the commented-out `CheckUserName` block (lines
  954–1094). **This is the protected-path file**: `services/auth.ts` is a
  protected glob, its tests go in the `tests/services/` mirror, and `verify.md`
  carries the protected-path statement (C-1, TR-3).
- `services/chat.ts` — **modified.** Remove `loginChat()`, which nothing calls,
  plus any import left unused by its removal.
- `services/story.ts` — **modified.** Remove `loginStories()`, same.
- `services/home.ts` — **modified.** Remove the `idToken:
  localStorage.getItem("ID-TOKEN")` property from the two sign-in dispatches
  (lines 379, 396) — each of those lines is one read site and one write site at
  once — and the dangling `// auth.CheckUserName();` (line 404).
- `store/auth/reducer.tsx` — **modified.** Move the two explanatory comment
  blocks onto the matching initial-state fields, then remove the `AuthState`
  interface (lines 16–65) and the `FirebaseSettings`, `User` and `ReAuthResult`
  types that exist only to describe it.
- `components/Login/ConfirmMobilePhoneWidget.tsx`,
  `components/Login/Enhanced/FullEnhancedLoginWidget.tsx`,
  `components/Login/Enhanced/InlineVerifyPanel.tsx`,
  `components/setting/profile/VerifyUser.tsx` — **modified, one argument each.**
  Drop the `() => {}` passed as the removed parameter. The screens behave
  identically.
- `tests/mocks/auth.ts` — **modified.** Remove the unread `_refreshPromise`
  module variable. This is a **shared stand-in** other suites load, which is why
  it also appears in the integration surface.

**Not removed, and why — the values already stored on returning shoppers'
devices are left alone, and nothing is done about them.** The key is a
single-use verification token that, after this ticket, no code reads. No cleanup
is added: a `removeItem` would be new behaviour that becomes dead the moment it
has run once. **This ticket takes no dependency on the release process.** Two
existing paths already bound the residue, neither of them this ticket's business:
the logout cleanup ends with a full storage clear and runs on **every** logout
path — the menu, the session timer, an expiry — so an ordinary sign-out removes
it; and the app's version check clears storage when the app version changes. For
the record, so that nobody reaches for the second one as a cleanup: that version
check also deletes every non-HttpOnly cookie, posts to the logout route,
detaches the device's push registration and reloads. It is a sign-out for every
returning shopper, it is one-way, and reverting this ticket cannot undo it. Note
it; never trigger it. *(Review follow-ups 2 and 11.)*

### Tests — all new

- `tests/mocks/authStore.ts` — **new.** Builds a store from the real auth reducer
  plus stubs for `LoggingOut`, `isRegisteringReady` / `setIsRegisteringReady` and
  `language`, and exposes a reset to fresh initial state for `beforeEach`. Used
  by the three service files only.
- `tests/mocks/authGraph.ts` — **new.** Stand-in factory bodies for every module
  the sign-in service imports (list in step 7). Imports nothing but the test
  framework; plain factory exports, no wrapper API.
- `tests/services/auth.otp.test.ts` — **new.** AC-1..AC-12.
- `tests/services/auth.session.test.ts` — **new.** AC-13..AC-22. Holds the local
  gated reply for the concurrency cases.
- `tests/services/auth.profile.test.ts` — **new.** AC-23..AC-29. Fake timers at
  file level.
- `tests/store/auth/reducer.test.ts` — **new.** AC-30..AC-34.
- `_specs/unit-tests-auth-service/implement.md` — **new,** written by
  `/implement`; carries everything listed in step 13.

**Not changed, on purpose:** `store/index.ts` (protected, and the slice is
imported directly instead), `tests/services/authRefreshSession.test.ts` (AC-40),
`tests/mocks/mockFetch.ts` (used as it is — nothing added to it, which is why the
session file keeps its own gated reply), `tests/mocks/store.ts` and
`tests/setup.ts` (shared with every other suite), `tests/msw/handlers.ts`,
`vitest.config.mts` (no new alias and no coverage change — C-6), `docs/testing/*`,
`utils/version-manager.ts` and the version environment value, and the disabled
profile leg.

## Integration surface

- **Components / shared config touched:** three sibling services (`chat`,
  `story`, `home`), four sign-in screens, the auth state slice that
  `store/index.ts` spreads into the store every component reads, and one **shared
  test stand-in** (`tests/mocks/auth.ts`, which other suites load — the removed
  variable is unread, so the risk is nil, but the list is complete). Nothing
  outside the branch: no environment value, no release action, no platform
  setting. Indirectly touched: the global stand-ins in `tests/setup.ts` and the
  fake network, which apply to the four new files whether they ask for them or
  not — which is why the profile file restores real timers before that teardown
  runs, why the session file resets modules in `beforeEach` rather than after,
  and why no file uses a blanket mock reset.
- **Who else depends on them:** `services/home.ts` runs its session check on
  **every page load**, so the properties removed there are on the hottest path in
  the app — dropped only because nothing reads the field they fill. The four
  screens are every entrance to sign-in, and all four call the same verify method
  whose signature changes. The changed-phone path feeds the profile save in
  `components/setting/profile/PersonalInfoForm.tsx`, which is why its reordering
  must keep the same failure behaviour. The chat and stories login endpoints keep
  their traffic: `app/api/auth/login` calls them server-side with the same
  one-time token, which is why the client copies are dead. Later roadmap phases
  depend on what this ticket pins: the auth routes phase branches on the same
  exchange outcomes, and the sign-in component phase asserts against the state
  written here. `tests/mocks/mockFetch.ts` is used unchanged, so no other suite is
  disturbed.
- **Overlapping flows:** three. First, the auth state slice is shared by the whole
  app — the tests drive the real reducer, so a behaviour they pin is a contract
  for every screen that reads `userProfile`, `user`, `shouldAuthinticated` or
  `reAuthResult`. Second, the expiry cycle and the concurrent-401 handlers write
  the same two markers, which is why the cycle reads the armed-flow marker late —
  AC-18 and AC-21 pin that shared rule, and the comments moved in step 4 are the
  only written explanation of it. Third, the one-time verification token is
  produced by the changed-phone flow and consumed by the profile save; after this
  ticket they meet **only** through the return value, which is why that value must
  still be produced under exactly the same conditions as today.
- **Ordering / lockstep dependencies:** the token chain is removed in one step —
  all four write sites and all four read sites together (C-8). The reorder happens
  in the same edit as the storage-write deletion, never separately. The comment
  blocks move **before** the type that carries them is deleted. The removals
  precede the tests (OQ-8), and the build check runs after the removals and before
  the tests are called done. Inside a test file, the three ordering rules under
  the isolation table apply. Nothing has to ship in lockstep with anything outside
  this branch.
- **What breaks if this is wrong:** the removal carries the runtime risk. If a
  caller of the two service-login routines exists that the search missed — a
  dynamic lookup, a string-keyed call — chat or stories sign-in would fail
  silently at runtime, with no error the app surfaces. Mitigation is three-layered:
  repo-wide search with every hit opened, the type check, and the production build
  (C-5); plus the server route already performing both logins. If the reorder is
  done carelessly — the verified writes left before the token read — a reply the
  server never confirmed would mark a shopper's phone verified in the store and in
  the profile cookie, which downstream checks read as a confirmed number; the test
  in step 8 exists to catch exactly that. If the store is not reset per test, the
  attempt-counter criteria pass or fail on execution order — a green suite that
  proves nothing, which is why AC-39's shuffled second run is a required step and
  not a nicety. A missed call site of the changed signature is the benign case:
  extra arguments are a type error.

## Validation strategy

- Validation profile: `full`
- Every acceptance criterion is proved by a test in the file named for it above;
  `/verify` maps AC-1..AC-42 to the assertions that cover them.
- Five things are proved by inspection rather than by an assertion, and
  `verify.md` must say so plainly: **AC-35** (every removal had no remaining
  caller or reader, and the reorder preserved behaviour) by the search record, the
  diff and the build result; **AC-36** (nothing removed was given a test) by the
  diff; **AC-41** (no test text names a backend technology) by reading the four
  files; **AC-42** (every left-alone defect has a test and a written finding) by
  the findings list in `implement.md`; and — added here so the gate has something
  to check — that **every fixture credential, phone and id is obviously fake and
  no test reads a real environment value**, by reading the same four files.
  *(Review follow-up 9.)*
- **AC-39** (repeatable, order-independent) is proved by a second run over the
  four new files only, in shuffled order.
- The protected-path statement required by TR-3 goes in `verify.md`: the tests for
  `services/auth.ts` sit in the `tests/services/` mirror, no test file is added
  inside `services/`, and `store/index.ts` is untouched. The edits to
  `services/auth.ts` itself are the removals and the one reorder listed above,
  approved at this gate.

## Rollback

The undo is **`git revert` of the merge commit** — one step, and the only undo
that is safe. The branch carries two commits (removals, then tests) for
readability, and they are **not** independently revertable: reverting the removal
commit alone restores the deleted parameter on the verify call while the new
tests call it with three arguments, which fails the type check. Revert both
together or revert the merge. Nothing ships a behaviour change and nothing outside
the branch is touched, so a rollback returns the app exactly to where it was — no
cleared storage, no signed-out shoppers, nothing one-way.

## Out of scope

- Fixing anything a finding records — the rename that survives a refusal, the
  unreadable upload reply, the rename that skips the profile record, the
  unencoded query interpolation, the incidental-property-read guard, and the raw
  internal error shown to the shopper are pinned or recorded as they behave today
  (AC-23, AC-29, AC-34, and step 13).
- Any cleanup of tokens already in browser storage, and any dependency on the
  release process or the app version value.
- The disabled profile leg marked "under development", and its unreachable
  rollback. Switched off is not dead.
- The unreachable "send a name with the code" branch: recorded as a finding, left
  alone, because the server still accepts the field.
- Source comments generally, including the ones that name a backend technology.
  The only comment work here is moving two explanatory blocks in the state slice
  and deleting one dangling reference whose target is removed.
- The auth route handlers, the send-code server action, the server-side limiter,
  and the sign-in screens' own behaviour — later phases.
- Any change to the shared network stand-in, the shared store stand-in, the shared
  setup file, the network handlers, the runner configuration, or the coverage
  settings (C-6). The one shared test file this ticket does touch is
  `tests/mocks/auth.ts`, listed above.
- Correcting the roadmap document's stale rules; the departures are recorded in
  `implement.md` and the correction is its own ticket.
- Any pipeline, coverage threshold, or browser-level test suite.
