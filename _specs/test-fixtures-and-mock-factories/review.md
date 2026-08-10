---
ticket: test-fixtures-and-mock-factories
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Review — test-fixtures-and-mock-factories

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

Second review of this ticket. The first review recorded `CHANGES_REQUESTED` with
seven required follow-up actions; `plan.md` was rewritten and this review checks
the rewrite.

Reviewed `spec.md` (15 acceptance criteria, `AC-1`..`AC-15`) and the rewritten
`plan.md` (approach, a "how the follow-ups are dealt with" table, 10 steps, 19
files, integration surface, validation, rollback), with `research.md` for context.
The advisory panel (senior, security, performance) ran again on the new plan and
its findings are recorded below.

All seven follow-ups from the first review are dealt with, and the senior lens
confirmed each one against the repository:

1. Cookie names — the plan now chooses a copy plus one comparison test, and says
   why (Approach, step 5).
2. "Whole public surface" — narrowed for the two third-party modules only, kept
   as it was for our own five (step 4).
3. Step 9 (was step 8) — now names the four replacements that are swapped and the
   six that stay.
4. The fake-network helper — an empty queue now raises a clear error naming the
   address (step 6).
5. Sample data — every token, id, email and phone is an obviously fake constant
   (step 2).
6. The analytics stand-in sits on a `default` key (step 4).
7. The cookie stand-in's dependency on the browser-like environment is noted, and
   now applies only to the comparison test (step 5).

## Plan Summary

Add a test-only `tests/` folder holding sample-data builders and module stand-ins,
plus one helper that fakes network calls and records them. Builders are plain
functions that merge caller overrides over a default — no data-generating library,
so the suite gives the same result every run. Stand-ins are exported factory
functions rather than ready-made objects, because the test runner needs the module
name at the top of each test file, and a factory also hands every test a fresh
copy. The cookie stand-in keeps its own copy of the cookie names, with one test
that compares the copy against the real module. Nothing that ships to users
changes. The one test file that already exists moves four of its ten replacements
onto the shared stand-ins.

## Risks

- The kit is a contract for 118 later tickets. A builder whose shape does not
  match the real backend produces a green suite that proves nothing — the failure
  does not show up as a broken build. The plan names this as the worst outcome and
  ties every builder to a shape already written in the repository (C-5).
- The copied cookie names can drift from the real ones. The plan accepts that risk
  in exchange for keeping the token library out of every test file, and pays for
  it with one comparison test. If that test is weak, a later Tier 2 test locks in
  a wrong name.
- Whether one registration covers both ways of loading the shared state store is
  still unproven. Step 8 proves it rather than assuming it, which is the right
  treatment — but the senior lens is right that the proof only counts if it goes
  through a module whose specifier differs from `"store"`. Carried as a follow-up
  action below.
- `spec.md` AC-6 still reads "everything the real module makes available", while
  the plan narrows that for the two third-party modules. `/plan` cannot edit the
  spec, so the narrowed reading has to be recorded as the AC-6 result at
  `/verify`. This is a bookkeeping risk at the next gate, not a fault in the plan.

## Assumptions

- The test environment provides a browser window, so the one file that loads the
  real cookie module does not reach the server-only path.
- The i18n lint rules do not reach `tests/`, so English text in a builder is fine.
- `tests/...` can be imported by plain path, because of the existing path mapping.
- The unused-file check is not part of this ticket's gate group
  (`tests-and-types`), so the expected report on the new files cannot block it.

The senior lens checked all four against the repository on this pass
(`vitest.config.mts`, `tsconfig.json`, `eslint.config.mjs`,
`utils/cookies/cookie-manager.ts`) and all four hold.

## Open Questions

- None. All eight `OQ-n` from `research.md` were answered in `spec.md`, and none
  were pushed forward to `/plan` (PL-12 satisfied).

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| performance | major | The plan never says whether a stand-in is hand-written or built by importing the real module. If it imports the real module, `tests/mocks/store.ts` pulls in nine slice reducers plus the big translations module, `services/chat` and `utils/gtag` — once per test file, across the hundreds of files the later phases add — and, like the cookie case, it would import its own replacement. | plan.md step 4; AC-6, AC-9; `tests/mocks/store.ts` | **Accept, and act at `/implement`.** The owner understood the finding at the gate (comprehension Q2) and does not reopen the plan for it. Every stand-in is hand-written from the module's surface and imports no production module at run time; a type-only import is fine, because the compiler drops it. This is the same decision the plan already took for the cookie names, applied to the rest of the kit — it changes no file in "Files to change" and no acceptance criterion, so it is a follow-up action rather than a rewrite. |
| senior | minor | The plan says the repository imports three methods from the error-reporting client. It actually imports seven symbols across seven files: `captureException`, `setUser`, `withScope`, `lastEventId`, `captureRequestError`, `captureRouterTransitionStart` and `init`. The plan's own rule is "what this repository actually imports", so the number it quotes does not meet its own rule. | plan.md step 4; AC-6; `tests/mocks/sentry.ts` | **Accept the correction; the rule stands.** The rule in the plan is right and the count behind it is wrong. `/implement` follows the rule, not the number: the stand-in covers the repo-wide list of seven. The file is already in "Files to change", so nothing about the plan's scope changes. Recorded as a follow-up action. |
| senior | minor | `spec.md` FR-5 / AC-6 still say "everything the real module makes available". `/plan` can only write `plan.md`, so the plan now reads differently from an AC it will be verified against. | plan.md step 4 vs spec.md FR-5 / AC-6 | **Accept.** The narrowed reading is the reviewed and approved one: our own five modules get their whole surface; the two third-party ones get what this repository imports. `/verify` records the AC-6 result against that reading and says so. Rewriting `spec.md` to match would send the ticket back through `/spec`, which buys nothing the written decision does not already buy. |
| senior | minor | Step 9 has to keep `expect(getUserChat()).toEqual({ id: "chat-1" })` passing, which needs the test to seed the store stand-in's state. The plan never says the store stand-in factory takes a starting state. | plan.md step 9; AC-12; `utils/functions.test.ts` | **Accept, and act at `/implement`.** The store stand-in factory takes an overrides object for the state it returns. That is inside `tests/mocks/store.ts`, already listed in "Files to change", and AC-12 already requires the existing assertions to keep passing — so this is how the step is carried out, not a change to it. Recorded as a follow-up action. |
| senior | minor | Step 8's proof of AC-8 can prove nothing. If the proving test imports `"store"` itself, it uses the same specifier as the registration and shows nothing. Going through the real `utils/fetchData.ts` does prove it, but that file also pulls `components/global/AddToCartMessage`, `services/auth` and `store/notifications/reducer`, so the proof needs extra stand-ins of its own. | plan.md step 8; AC-8; `utils/fetchData.ts` | **Accept, and act at `/implement`.** The proof must go through a module whose specifier differs from `"store"`, and `implement.md` records which module it used and which extra stand-ins that needed. If it turns out one registration does not cover both, step 8 already says what to do: record the finding and provide a second way in the kit, without touching the module that loads the store late. Recorded as a follow-up action. |
| senior | info | The plan names the `default` key for the analytics stand-in, but `services/localization.ts` also has a default export (a class instance with `GetAppLanguage` / `GetAppCountry`), so a flat localization stand-in would hand back nothing. | plan.md step 4; `tests/mocks/localization.ts` | **Accept.** The same rule applies to the localization stand-in. Covered by the plan's own rule that our own five modules get everything the module makes available — a default export is part of that. |
| senior | info | The Approach paragraph quotes AC-9 as "no state leaks between tests". AC-9 actually says the store stand-in contains no state the real store does not have. The Validation strategy reads it correctly. | plan.md Approach; spec.md AC-9 | **Accept.** A wrong quote, not a wrong plan. Both things are true and both are required — a fresh copy per test (an edge case in `spec.md`) and no invented state (AC-9). `/implement` follows AC-9 as written in `spec.md`. |
| security | info | The earlier finding about real values in sample data is dealt with: every token, id, email and phone is an obviously fake constant built from the type shapes, never pasted from a real session or response. | plan.md step 2; AC-7; `tests/fixtures/user.ts` | **Accept.** Nothing further needed. |
| security | info | No `protected_paths` file changes. The file list is `tests/**` plus `utils/functions.test.ts`; the cookie module and the store are read from or imitated, never edited, and step 8 forbids changing the module that loads the store late. | plan.md Files to change; AC-15 | **Accept.** Those paths stay read-only at `/implement`. |
| security | info | No confirmed advisory affects the installed versions. `vitest@4.1.10`, `jsdom@30.0.1` and `@vitest/coverage-v8@4.1.10` are what the lockfile has. The 2026 vitest advisories are against `@vitest/browser` and `@vitest/ui`, neither of which is installed; the one against `vitest` itself was fixed well before 4.1.x. | `pnpm-lock.yaml`, `package.json` | **Accept.** No upgrade needed for this ticket. |
| performance | info | The kit has no barrel file, so a test that wants one builder loads one small file. A barrel added later would make every one of the 118 later phases load all eight builders and all seven stand-ins. | plan.md Files to change | **Accept.** The plan's per-file list already gives this. Keep it that way; no barrel. |
| performance | info | The rewrite removes the cost the last panel flagged. Copying the cookie names means only `tests/mocks/mocks.test.ts` loads the real cookie module and its token library, instead of every test file paying it. | plan.md step 5; AC-7 | **Accept.** This confirms the rewrite; no action. |

The panel blocked nothing (RP-2). The decision below is the owner's, taken after
the comprehension check, and the one `major` finding was carried into that check
as an extra question (CG-6) rather than being allowed to force an outcome.

## Decision

`APPROVED`

- Rationale: the rewrite deals with all seven follow-up actions from the first
  review, and the senior lens confirmed each one against the repository rather
  than taking the plan's word for it — the ten `vi.mock` calls in
  `utils/functions.test.ts`, the four that are swapped, the seven analytics
  methods, and the jsdom behaviour of the cookie module all check out. The four
  step-level errors that caused `CHANGES_REQUESTED` are gone. Every acceptance
  criterion has a step behind it, the file list is exact, no production or
  `protected_paths` file is touched, the integration surface is real and specific,
  and the rollback is one delete plus one restore.

  What the panel found this time is different in kind from last time. Nothing
  named is wrong about the approach, the scope, or the file list. Each finding is
  about how a file already in the plan gets written — hand-write the stand-ins
  instead of importing the real modules, cover seven error-reporting symbols
  instead of three, let the store stand-in take a starting state, and route the
  AC-8 proof through a different specifier. All four stay inside "Files to change"
  and change no acceptance criterion, so they belong in `/implement` and in
  `implement.md`, not in another rewrite. Sending the plan back a second time for
  these would cost a full cycle and buy nothing the follow-up actions below do not
  already buy.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): `reviewer` (the ticket owner running their own gate — ADR-011,
  RA-1), 2026-08-10, after passing the comprehension check 4/4 (CG-4).

## ADR reference

> Optional — record an ADR only if the decision is notable; otherwise "none".

- ADR: none

## Required Follow-up Actions

These do **not** send the plan back. They are carried into `/implement` and must
be recorded in `implement.md`:

1. **Every stand-in is hand-written.** No stand-in imports a production module at
   run time. A type-only import is fine, because the compiler drops it. This is
   the `major` panel finding.
2. **The error-reporting stand-in covers seven symbols, not three:**
   `captureException`, `setUser`, `withScope`, `lastEventId`,
   `captureRequestError`, `captureRouterTransitionStart` and `init`. The plan's
   rule — what this repository actually imports — is the one that counts.
3. **The store stand-in factory takes a starting state**, so step 9 can keep the
   existing `getUserChat()` assertion passing (AC-12).
4. **The AC-8 proof goes through a module whose specifier differs from `"store"`.**
   `implement.md` records which module was used and which extra stand-ins that
   needed. If one registration turns out not to cover both ways of loading, step 8
   already says what to do.
5. **The localization stand-in covers its default export too**, alongside the
   analytics one.
6. **`/verify` records the AC-6 result against the narrowed reading** approved
   here: our own five modules get their whole surface; the two third-party ones
   get what this repository imports.
