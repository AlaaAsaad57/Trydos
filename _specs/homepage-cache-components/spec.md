---
ticket: homepage-cache-components
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-08-31
links:
  clickup:
  github:
---

# Spec — homepage-cache-components (phase 1)

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

> **Second version — narrowed.** The first defined "done" for the whole homepage
> conversion. The owner split the work on 2026-08-31 after three advisory review
> rounds; the conversion is now `docs/homepage-cache-phase-2.md`. This spec
> covers **phase 1 only**: switch the caching feature on, convert nothing.
>
> The fourteen criteria that belonged to the conversion moved to the parked
> document with the decisions and findings behind them. Narrowing this file was
> directed by the owner while the work item sits at `review`; no lifecycle field
> was touched.

## Feature Name

Enable the caching feature across the application, without converting any page.

## Business Goal

The homepage cannot be cached until the framework's caching feature is switched
on, and that switch is application-wide: every route must keep working before
any route can be improved.

Doing that on its own has two benefits. It can be undone by itself, which the
combined attempt could not. And it is the only way to learn several facts about
this application that cannot be settled by reading — the real route list, the
real build cost, and which parts of the code the new build rules refuse.

Nothing a shopper sees gets faster in this phase. This is the groundwork that
makes the next phase possible and safe.

## User Story

> As an engineer preparing the homepage caching work, I want the application to
> build and run with the caching feature switched on, so that the conversion can
> be planned against measured facts instead of guesses, and undone on its own if
> it goes wrong.

## Functional Requirements

- **FR-1** The application builds and starts with the caching feature switched
  on.
- **FR-2** Every route still answers, including a locale the build did not list
  in advance.
- **FR-3** No page that carries signed-in details may be stored by a shared
  cache.
- **FR-4** Analytics collection keeps working after its runtime setting is
  removed.
- **FR-5** The analytics collection path stops being publicly cacheable.
- **FR-6** The staging gate still serves its logo page.
- **FR-7** The facts handed to the next phase state plainly what they cover and
  what they do not.
- **FR-8** The one visible change this phase brings is written down and owned.

## Non-Functional Requirements

- **NFR-1 Revertability.** The whole change can be undone in one step, and
  undoing it returns the application to today's behaviour.
- **NFR-2 No new dependency.** Nothing external is added — no cache service, no
  new package, no new environment value.
- **NFR-3 No conversion.** No page is cached, and no page's data reading
  changes.

## Constraints

- **C-1** The caching feature is switched on for the whole application, not for
  one page. Every route must keep working.
- **C-2** Route-level rendering settings are refused once the feature is on, so
  all of them must be removed in the same change.
- **C-3** The edge runtime is not supported by the feature. Nothing may keep
  using it.
- **C-4** Only the approved implement stage may change the protected runtime
  paths, and only when the approved plan names them.
- **C-5** Verification uses the unit suite plus recorded manual checks. No
  browser test is added.
- **C-6** Component state stops resetting when a shopper navigates away and
  back. This arrives with the feature and cannot be switched off. Repairing the
  affected screens is explicitly **not** part of this work item.
- **C-7** The conversion itself is out of scope and is recorded separately.

## Edge Cases

- **E-1** A visitor opens a locale the build did not list in advance. It must
  still answer.
- **E-2** A signed-in shopper and a signed-out shopper request the same page.
  Neither may receive the other's details from a shared cache.
- **E-3** A shopper fills a form, navigates away, and returns. The form keeps its
  values — expected under C-6, and it must be recorded rather than discovered.
- **E-4** A build runs while the search backend is unavailable.
- **E-5** A measurement this phase hands over cannot actually be taken. It must
  be reported as not taken, never as empty.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Deferred — and now known to be unanswerable here.** Whether an error area saves a build prerender needs a cached page and an error boundary, and this phase creates neither. It becomes the next phase's first task. | Out of Scope; parked document |
| OQ-2 | **Not applicable.** No module is split and nothing is cached. | Out of Scope |
| OQ-3 | **Partly, and labelled.** The clock reads the build refuses are fixed where they are already known. The build's own list will be incomplete because the render stops earlier, so the handover must say so. | FR-7, AC-5 |
| OQ-4 | **Answered: it keeps working.** The analytics path uses only standard request and response features, none specific to the edge runtime. | FR-4, AC-3 |
| OQ-5 | **Deferred — unanswerable here.** Nothing is stored, so there is nothing to test reuse against. | Out of Scope; parked document |
| OQ-6 | **Answered for an empty page only.** A crawler receives a document; that it is a complete one cannot be shown until pages are cached. | AC-1 |
| OQ-7 | **Answered.** The setting that controlled unknown addresses was already at its default, so removing it changes nothing this work item controls. | C-2 |
| OQ-8 | **Answered.** The parallel slot that renders intercepted modals is an ordinary segment and is treated like any other. | C-1 |
| OQ-9 | **Answered.** The staging logo page reads no data, so its settings can be removed with no change in behaviour. | FR-6, AC-4 |
| OQ-10 | **Expected not to apply**, because the opt-out is the documented fix for that error class. If the build disagrees, the affected components are already named in the plan as a contingency. | C-1 |

## Open Questions

None for this phase. OQ-1 and OQ-5 are carried to the next work item in
`docs/homepage-cache-phase-2.md`, which records why neither can be answered here.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | The application builds and starts with the caching feature on, and every route answers — including a locale the build did not list in advance. | FR-1, FR-2, E-1, OQ-6 |
| AC-2 | No page carrying signed-in details is served in a form a shared cache may store. | FR-3, E-2 |
| AC-3 | Analytics collection still works after its runtime setting is removed, including a large session-replay upload. | FR-4, OQ-4 |
| AC-4 | The staging gate still serves its logo page, and the existing gate checks pass unchanged. | FR-6, OQ-9 |
| AC-5 | Every fact handed to the next phase records what it covers, and any fact that could not be taken is marked as not taken rather than reported empty. | FR-7, E-4, E-5, OQ-3 |
| AC-6 | The analytics collection path is no longer publicly cacheable. | FR-5 |
| AC-7 | The state-retention change is recorded as a known, accepted consequence, with the affected screens named. | FR-8, C-6, E-3 |

## Out of Scope

- The entire conversion — the homepage, the category route, the layout
  boundaries, stories, lucky badges, recommendations, currency, and the cache
  profile. All in `docs/homepage-cache-phase-2.md`.
- Answering OQ-1 and OQ-5, which need a cached page to exist.
- Repairing screens affected by the state-retention change (C-6).
- The clock reads that only matter once page data is cached.
- The seventh sitemap route's repeated-query problem, and its unbounded page
  parameter.
- The recommendations endpoint's open cross-origin policy and its error body.
- Any browser test (C-5).
