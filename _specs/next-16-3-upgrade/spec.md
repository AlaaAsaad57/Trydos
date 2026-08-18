---
ticket: next-16-3-upgrade
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-18
links:
  clickup:
  github:
---

# Spec — next-16-3-upgrade

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Next.js 16.3 upgrade, without Cache Components.

## Business Goal

The app runs on Next.js 16.2.11. Version 16.3 gives three things this app wants
and can have without changing how it caches anything:

- Much lower memory use in the dev server, which matters because the machine
  used for development is constrained enough that build-time optimisations are
  deliberately switched off in dev today.
- Faster repeat builds and faster type checking, which shortens both the local
  loop and the CI gate.
- More requests served per unit of server work, because the render path moved to
  native streams. On a pay-per-use platform this is a direct cost reduction.

The value is developer speed and running cost. It is **not** a change to what a
user sees — that is the point of the ticket, and it is what makes the work safe
to ship in one pass.

## User Story

> As the owner of the storefront, I want the app running on Next.js 16.3 with
> the parts of that release that need no caching migration, so that dev memory,
> build time and server throughput improve without changing how any page behaves
> for a user.

## Functional Requirements

- **FR-1 — The app runs on 16.3.** The framework, its lint config and its bundle
  analyzer all come from the same 16.3 release. They are version-pinned today
  and stay pinned together, because skew between them is a known way to break
  the build.
- **FR-2 — Error reporting keeps working.** The build wraps the whole app in the
  error-reporting tool. After the upgrade that wrapper still applies and errors
  still reach the reporting service.
- **FR-3 — Type checking runs on TypeScript 7.** The type gate and the
  production build both type-check the project with TypeScript 7 and both pass.
- **FR-4 — The locale value is read directly by server-rendered code.** Server
  Components that need the locale segment read it from the framework instead of
  receiving it as a passed-down property. Code that cannot do this keeps its
  current way of getting the value.
- **FR-5 — The error boundaries match the installed framework contract.** The
  app's error boundaries use the recovery property the installed version
  defines, and a user who hits one can still recover from the screen exactly as
  they can today.
- **FR-6 — The component optimiser runs everywhere.** The React Compiler runs in
  development as well as in production builds, using the native compiler path
  rather than the JavaScript one.
- **FR-7 — Nothing a user can see changes.** Every page renders the same content
  in the same language and direction, every link goes to the same place, and
  every flow the browser suite covers still completes.

## Non-Functional Requirements

- **NFR-1 — Everything is verified before the ticket closes.** The complete gate
  set — translation parity, lint, framework type generation, the type check, the
  unit suite and the browser suite — passes. The only work left after closure is
  the owner's own live manual test on the branch.
- **NFR-2 — Each change can be reverted on its own.** The configuration changes
  in this ticket are independent switches. If one causes a problem in
  production, it can be turned off without reverting the upgrade.
- **NFR-3 — The upgrade must not make the deploy path less safe than it is
  today.** The deploy platform installs dependencies differently from CI, and a
  green CI run does not prove the deploy install resolves the same tree. This
  ticket must not widen that gap.
- **NFR-4 — No measurement is claimed that was not taken.** The memory, build
  and throughput gains are the reason for the ticket, but no gate measures them.
  They are accepted as unmeasured rather than reported as proven.

## Constraints

- **C-1 — The locale segment holds a country and a language joined together, not
  a language.** The framework generates the accessor name from the folder name,
  so the name cannot be chosen, and the value still has to be split by every
  consumer exactly as it is today. Renaming or restructuring the segment is a
  routing change and is not part of this ticket.
- **C-2 — Reading the locale from the framework works only in Server
  Components.** It does not work in client components, in server actions, in
  route handlers, or inside the older caching helper. The large majority of this
  app's server-side data modules are server actions, so they are excluded by the
  framework, not by choice.
- **C-3 — The new default type-checking path is accepted as the framework ships
  it.** In 16.3 the production build runs the project's own type-checker binary
  by default. Turning that off while TypeScript 7 is installed makes the build
  refuse to run, so the type-checker choice and the TypeScript version are a
  single decision, not two.
- **C-4 — The production build will now type-check a wider set of files than
  before,** including test files. The type gate already covers that same wider
  set today and passes, but the build has never checked it.
- **C-5 — The native React Compiler path is an experimental switch that changes
  what ships to the browser.** The owner accepted this risk at intake. It must
  stay a single switch so it can be turned off on its own.
- **C-6 — The framework configuration is a protected runtime path.** Most of
  this ticket's switches live there, so the plan must name it or the
  implementation stage is not allowed to touch it.
- **C-7 — The dependency lock file must be regenerated in the same change.** CI
  installs with a frozen lock file and fails otherwise.
- **C-8 — One safety setting lives outside this repository.** The deploy
  platform's install command must keep installing development dependencies. If
  it does not, the build installs a type-checker of its own choosing, which is
  what broke the builds in July 2026. Nothing in this repository can verify it.

## Edge Cases

- A page that is reached directly by URL rather than by navigation must resolve
  the locale the same way as one reached by a link.
- Right-to-left languages must keep their text direction, which is derived from
  the locale segment today.
- A server-rendered page that is also reachable through the intercepted modal
  route must resolve the locale identically in both presentations.
- An error boundary reached with no network available must still offer a way out
  of the screen.
- A locale value that is missing or malformed must fail the same way it does
  today — this ticket must not turn a bad URL into a different kind of failure.
- The bundled lint configuration may add or rename rules between 16.2 and 16.3.
  The lint gate fails on errors, so new findings must be resolved rather than
  suppressed wholesale.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Dropped as written.** The intake asked to convert the error boundaries to the new component-level boundary helper. That helper does not replace the error-boundary file convention — the two coexist, and the helper is for boundaries you place by hand around part of a tree. There is nothing to convert. Adding new hand-placed boundaries would be new feature work with no criterion to define where they go, so it is excluded. What survives of this scope item is OQ-2. | Out of Scope; replaced by FR-5 |
| OQ-2 | **In scope.** 16.3 documents the recovery property on error boundaries under a different name than this app uses. All four boundaries are brought in line with the installed version's contract, and the user-facing recovery path is unchanged. Whether the old name is still accepted is a fact to confirm against the installed package, not a scope decision. | FR-5, AC-6 |
| OQ-3 | **Accept the framework default.** The new type-checker path is on by default in 16.3 and is not turned off. It cannot be turned off anyway once TypeScript 7 is installed, so this is one decision with OQ-8, not an independent one. | C-3, AC-4 |
| OQ-4 | **Accept the widened set.** The build will type-check test files and generated type files. The type gate already covers that same set today and passes, so the expectation is that it holds; if the build reports errors the wider check exposes, fixing them is part of this ticket. Narrowing the checked project is not done — it would hide real errors to make a build pass. | C-4, AC-4 |
| OQ-5 | **Keep the current shape.** The accessor name is generated from the folder name and cannot be chosen, and the value stays a joined country-and-language string that consumers split as they do today. No renaming, no wrapper abstraction — the ticket removes property passing, nothing else. | C-1, FR-4 |
| OQ-6 | **Server Components in the locale-scoped route tree only.** Server actions, route handlers, client components and the older caching helper are excluded by the framework itself. The exact set of call sites is an approach question and is deferred. | FR-4, C-2; file set deferred to `/plan` |
| OQ-7 | **Error reporting must keep working; a reporting-tool version bump is in scope only if 16.3 requires it.** If the current version works, it is not touched. If it does not, bumping it is allowed inside this ticket rather than blocking, because the ticket cannot ship without a working build. Anything beyond a version bump — new reporting features, configuration changes — is excluded. | FR-2, AC-2 |
| OQ-8 | **TypeScript 7 is in scope, with a defined fallback.** The full gate set must pass on TypeScript 7. If any gate tool cannot run on it, TypeScript 7 is dropped from this ticket and everything else still ships; the ticket is not blocked and the type gate is not weakened to accommodate it. Which tools actually work is a fact for the approach stage. | FR-3, AC-3; tool-by-tool result deferred to `/plan` |
| OQ-9 | **Remove the development guard.** The component optimiser runs in development as well as production. Removing that guard is the reason the native compiler path is wanted; keeping a switch to disable it in development would preserve the very workaround this ticket exists to retire. | FR-6, AC-7 |
| OQ-10 | **The rollback signal is any rendering fault found in the owner's live test or in production that does not reproduce with the switch off, and it is reverted on its own** — one switch, not the whole ticket. This is why NFR-2 requires the changes to be independent. | NFR-2, C-5, AC-10 |
| OQ-11 | **All three pin exactly, to the same patch release.** They are pinned exactly today and version skew between them is a known failure source. The specific patch number is chosen when the work is done, since it is whatever the current 16.3 patch is at that time. | FR-1, AC-1; the number deferred to `/plan` |
| OQ-12 | **Regenerating the repository's lock file is in scope. Adding a lock file for the deploy platform is not.** The deploy path uses a different package manager with no committed lock file. Closing that gap is real work with its own risk and belongs to its own ticket; this ticket must simply not make it worse. | C-7, NFR-3, AC-1; deploy lock file Out of Scope |
| OQ-13 | **Out of Scope, but it must be confirmed before implementation.** Moving the deploy install command into a versioned file changes how every deploy installs, which is a bigger and riskier change than this upgrade. It stays a platform setting. The owner confirms it is still correct before the implementation stage begins — this is the one item nothing in this repository can check. | Out of Scope; confirmation is AC-11 |
| OQ-14 | **In scope, with a limit.** If the bundled lint configuration reports new findings, they are fixed so the lint gate stays green. If the volume is large enough that fixing it would dominate the ticket, that is a signal to stop and raise it rather than to silently suppress the rules or grow the ticket. | Edge Cases, AC-8 |

## Open Questions

- **OQ-6** *(deferred to `/plan`)* — which specific server-rendered call sites
  convert to reading the locale directly. The rule is settled here; the list is
  an approach question.
- **OQ-8** *(deferred to `/plan`)* — whether every gate tool actually runs on
  TypeScript 7. The decision and the fallback are settled here; the factual
  answer needs the approach stage.
- **OQ-11** *(deferred to `/plan`)* — the exact patch version to pin.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | The framework, its lint config and its bundle analyzer all resolve to the same exact 16.3 patch release, and the repository's dependency lock file is regenerated in the same change so a frozen install succeeds. | FR-1, C-7 |
| AC-2 | A production build completes with the error-reporting wrapper applied, and error reporting is still wired to the reporting service. | FR-2 |
| AC-3 | The project type-checks under TypeScript 7 with no errors — or, if a gate tool cannot run on TypeScript 7, TypeScript 7 is dropped and the type gate passes on the current version, with the reason recorded. | FR-3 |
| AC-4 | A production build passes its own type-checking step, over the full project the type configuration selects, with the framework's default checker path left on. | FR-3, C-3, C-4 |
| AC-5 | Server Components in the locale-scoped route tree read the locale from the framework rather than receiving it as a passed-down property, and no client component, server action or route handler attempts to. | FR-4, C-2 |
| AC-6 | All four error boundaries use the recovery property the installed version defines, and each one still lets a user leave the error screen the same way it does today. | FR-5 |
| AC-7 | The React Compiler runs in development as well as in production builds, on the native compiler path, and a production build succeeds with it on. | FR-6 |
| AC-8 | The whole gate set is green: translation parity, lint, framework type generation, the type check, the unit suite and the browser suite. | NFR-1, FR-7 |
| AC-9 | The browser suite passes without any test being changed to make it pass. A test edited to accommodate new behaviour fails this criterion. | FR-7 |
| AC-10 | Each configuration switch introduced by this ticket can be turned off on its own, without reverting the upgrade or any other switch. | NFR-2, C-5 |
| AC-11 | The owner has confirmed, before implementation begins, that the deploy platform's install command still installs development dependencies. | C-8 |
| AC-12 | No caching-migration feature is introduced: no cache components, no partial prefetching, no loading shells, no instant-navigation test helper. | Out of Scope |

## Out of Scope

- Cache Components, partial prefetching, loading shells, the incremental
  regeneration changes, and the instant-navigation browser test helper. These
  are the ticket that follows this one, and they are where the real user-facing
  navigation gain lives.
- Adding new hand-placed component-level error boundaries (see OQ-1). Only the
  four existing boundaries are brought in line with the installed contract.
- Renaming or restructuring the locale route segment (see C-1).
- Moving the deploy platform's install command into a versioned file (see
  OQ-13), and adding a lock file for the deploy platform's package manager (see
  OQ-12).
- The long-deprecated image host configuration style. It will keep warning after
  this upgrade; it is unrelated to 16.3 and is its own cleanup.
- Any measured proof of the memory, build-time or throughput gains (see NFR-4).
- Changing the offline behaviour, the prefetch tuning, or the wildcard-import
  feature that 16.3 also ships. None was requested.
