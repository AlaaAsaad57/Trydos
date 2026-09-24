---
ticket: seller-dashboard-list-refresh-and-skeletons
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-02
links:
  clickup:
  github:
---

# Spec — seller-dashboard-list-refresh-and-skeletons

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Seller dashboard: fresh lists, and skeletons instead of blank states and spinners.

## Business Goal

A seller must be able to trust what the dashboard says about their own shop. Today
it can show a product list that does not contain the product they just added, and
it can tell them they have no products at the moment their products are loading.
Both are wrong information about the seller's own data, which is the kind of error
that makes a seller stop believing the screen and check somewhere else.

The second half is how the loading looks. Right now the dashboard replaces content
with a spinner and a label, or with a blank state, and the back journey replaces
the whole page with an oversized spinner in a short box, which loses the page
height and the scroll position. Skeletons that keep the shape of the content remove
all three effects.

## User Story

> As a seller managing my shop, I want the dashboard to show my newest changes and
> to load without flashing wrong states, so that I can trust what it tells me about
> my own products and boutiques.

## Functional Requirements

- **FR-1 — The lists are fresh.** Whenever the seller arrives at the dashboard,
  the product list and the boutique list show the current state of the shop,
  including anything the seller has just created, updated or deleted.
- **FR-2 — Freshness does not depend on the list being empty.** The lists reload
  whether or not they already hold items. The current behaviour, where a list that
  already has items is never reloaded, must be gone.
- **FR-3 — A section never claims to be empty before it has looked.** The "no
  products" / "no boutiques" / equivalent empty message appears only after the
  data has actually been fetched and came back empty.
- **FR-4 — Loading is shown as a skeleton.** Every part of the seller dashboard
  that shows a loading state today shows a placeholder shaped like the content it
  is about to replace, instead of a spinner with a label or a blank area.
- **FR-5 — The loading state keeps the page's shape.** A section that is loading
  takes roughly the space its loaded content will take, so the page does not
  collapse and the seller's scroll position is not lost.
- **FR-6 — Returning from a detail screen does not throw the page away.** Pressing
  back from a product or boutique screen shows a dashboard-shaped placeholder, not
  a full-screen oversized spinner, and does not move the seller somewhere else on
  the page.
- **FR-7 — An ordinary page keeps its own scroll behaviour.** The app's overlay
  scroll handling applies only to routes that actually open as an overlay. An
  ordinary page — the seller dashboard among them — is not scrolled to the top by
  it. Routes that do open as overlays keep exactly the behaviour they have today.
- **FR-8 — A section that cannot load says so.** A refused permission still shows
  the permission message, and a failed load still shows the error with its retry.
  Neither is replaced by a placeholder that never ends.

## Non-Functional Requirements

- **NFR-1 — Cost is bounded and known.** Making the lists always fresh adds
  network calls. The added cost must be one list call per dashboard arrival per
  list the seller is looking at — not a call per render, not a repeating poll.
- **NFR-2 — Placeholders carry no information.** A placeholder shows shape only:
  no numbers, no names, no icons, no copy that could be read as real data.
- **NFR-3 — Placeholders are invisible to assistive technology.** A screen reader
  must not read a placeholder out as content.
- **NFR-4 — One visual language.** All placeholders added by this work look like
  each other and like the placeholders this app already uses. A third, new
  placeholder style is a defect.
- **NFR-5 — No regression outside the seller dashboard.** The change to the
  overlay scroll rule (FR-7) touches shared behaviour. Every journey that opens an
  overlay today must behave exactly as it does today, including the position the
  page is restored to when the seller backs out of one.

## Constraints

- **C-1 — No new user-visible copy without translations.** If any new string a
  seller can read is introduced, its key exists in the Arabic, Turkish and Kurdish
  translation files before it is used. Placeholders are expected to carry no copy
  at all, which satisfies this by having nothing to translate.
- **C-2 — No protected runtime path is touched.** The build config, the request
  entry point, the error-reporting wiring and the CI configuration are all outside
  this work.
- **C-3 — No backend change.** No new endpoint, no changed request or response
  shape. The fix is entirely in how the app asks for and shows what already
  exists.
- **C-4 — Every fix is confirmed by a test seen failing first.** Each defect this
  ticket closes has a test that fails because of the defect before the fix and
  passes after it. A test that passes both before and after has not confirmed
  anything.

## Edge Cases

- **E-1 — The seller has no permission for a section.** The permission message
  shows. No placeholder, and nothing that waits forever.
- **E-2 — The list request fails.** The error and its retry show. A retry that
  succeeds replaces the error with the list.
- **E-3 — The shop genuinely has no products or no boutiques.** The empty message
  shows, and it shows *only* after the request has come back.
- **E-4 — Two sections load at once.** The dashboard fetches more than one thing
  at a time on some journeys. One of them finishing must not make the other look
  finished.
- **E-5 — The seller opens the dashboard directly, not from a detail screen.** The
  lists are fetched as normal; nothing depends on having come from somewhere.
- **E-6 — The seller creates the first product in an empty shop.** This is the one
  case that works today by accident. It must still work.
- **E-7 — The seller backs out of an overlay route elsewhere in the app.** The
  page returns to the exact position it was left at, unchanged by this work.
- **E-8 — A section is opened that never fetches anything.** It must not sit in a
  placeholder with nothing on the way to replace it.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **On every dashboard arrival.** The lists reload whenever the seller reaches the dashboard, whether or not they already hold items. Chosen over a change-signal because a signal that is ever missed brings the stale list straight back, and because the cost is one list call per arrival. | FR-1, FR-2, NFR-1, AC-1..AC-6 |
| OQ-2 | **Every loading state in the seller dashboard**, not only the two lists. All the sections that show a loading state today get a shape-matched placeholder. | FR-4, AC-8 |
| OQ-3 | **In scope.** The overlay scroll rule is corrected in this ticket so it applies only to routes that open as an overlay. Without it the page still jumps and the reported problem is only half closed. Its blast radius is handled by NFR-5 and E-7. | FR-7, NFR-5, AC-11, AC-12 |
| OQ-4 | **Deferred to `/plan`.** What the back journey shows is an approach question — it depends on how the dashboard placeholder is built, which `/plan` decides. The requirement is fixed here regardless: a dashboard-shaped placeholder, not an oversized spinner (FR-6, AC-10). | Open Questions |
| OQ-5 | **Deferred to `/plan`.** Which suite confirms each defect, and in which file, is exactly what `/plan` must declare per `AC-n`. The spec fixes only that a red-first test is required (C-4). | Open Questions |
| OQ-6 | **The shared loading flag starts in the loading position.** The seller shop-list page is therefore also covered: it shows its existing placeholder from the first paint instead of an empty grid. That page is in scope for this one behaviour and nothing else. | FR-3, AC-7, AC-9 |
| OQ-7 | **Deferred to `/plan`.** Which of the app's two existing placeholder styles is used, and where the files live, is an approach decision. The spec fixes the outcome: one style, matching what the app already uses (NFR-4). | Open Questions |
| OQ-8 | **Out of scope.** After deleting a boutique the seller lands on the dashboard home rather than back on the boutiques list. It is a real rough edge, but it is about which section opens, not about whether the list is correct, and it was not reported. It needs its own ticket. | Out of Scope |

## Open Questions

- **OQ-4** — what the back-from-detail journey shows while the dashboard loads:
  a dashboard placeholder served by the app's shared navigation loader, or the
  dashboard's own placeholder with no full-screen loader at all. `/plan` decides.
- **OQ-5** — which suite and which file confirms each `AC-n`, and whether the
  stale-list defect can be made to fail in the unit suite. `/plan` declares this
  per `AC-n`, including any `none — <reason>`.
- **OQ-7** — which existing placeholder style the new placeholders follow, and
  where they live. `/plan` decides, bound by NFR-4.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A seller creates a product in a shop that already has products; on returning to the dashboard product list, the new product is in the list. | FR-1, FR-2 |
| AC-2 | A seller edits a product's details; on returning to the dashboard product list, the list shows the edited values, not the previous ones. | FR-1, FR-2 |
| AC-3 | A seller creates a boutique in a shop that already has boutiques; on returning to the dashboard boutique list, the new boutique is in the list. | FR-1, FR-2 |
| AC-4 | A seller edits a boutique; on returning to the dashboard boutique list, the list shows the edited values. | FR-1, FR-2 |
| AC-5 | A seller deletes a boutique; on returning to the dashboard boutique list, the deleted boutique is not in it. | FR-1, FR-2 |
| AC-6 | Arriving at the dashboard requests the list from the backend even when the list already holds items — the request is not skipped because the list is non-empty. | FR-2, NFR-1 |
| AC-7 | Opening a dashboard section never renders its empty message before that section's request has come back. | FR-3 |
| AC-8 | Every dashboard section that shows a loading state today shows a shape-matched placeholder instead of a spinner with a label or a blank area. | FR-4 |
| AC-9 | The seller shop-list page renders its placeholder on its first paint, with no empty grid before it. | FR-3, OQ-6 |
| AC-10 | Pressing back from a product or boutique screen shows a dashboard-shaped placeholder, not a full-screen oversized spinner. | FR-6, FR-5 |
| AC-11 | Arriving at the dashboard does not reset the page scroll position through the app's overlay scroll handling. | FR-7, FR-5 |
| AC-12 | A route that opens as an overlay keeps today's scroll behaviour exactly, including the position restored when the seller backs out of it. | FR-7, NFR-5, E-7 |
| AC-13 | A section the seller has no permission for shows the permission message and no placeholder. | FR-8, E-1 |
| AC-14 | A section whose request fails shows the error and its retry, and a successful retry replaces it with the content. | FR-8, E-2 |
| AC-15 | A section with genuinely no data shows its empty message after the request has come back. | FR-3, E-3 |
| AC-16 | Two sections loading at the same time each show their own placeholder until their own request finishes; the first to finish does not clear the other. | FR-4, E-4 |
| AC-17 | A placeholder is not exposed to assistive technology as content. | NFR-3 |
| AC-18 | Every placeholder added by this work uses one style, and that style is one the app already uses. | NFR-4 |

## Out of Scope

- **Product deletion.** The dashboard has no delete-product journey, so there is
  nothing to keep fresh.
- **Which section opens after a boutique is deleted** (OQ-8). The seller lands on
  the dashboard home rather than the boutiques list. Its own ticket.
- **The shared loading flag's design.** Several fetchers write one flag, and one
  finishing early can clear it for another. AC-16 requires the seller-visible
  effect not to happen; reworking the flag into per-section state beyond what
  AC-16 needs is not part of this work.
- **The seller shop-list page**, apart from AC-9. No other change to it.
- **Any backend or endpoint change** (C-3).
- **Caching or de-duplicating the list requests.** NFR-1 bounds the cost at one
  call per arrival; making it cheaper than that is a separate improvement.
- **The rest of the app's loading states.** Only the seller dashboard, plus the
  one shop-list behaviour in AC-9.
