---
ticket: broken-image-global-fallback
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Spec — broken-image-global-fallback

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Placeholder for a remote image that fails to load.

## Business Goal

The storefront draws hundreds of pictures per page, and nearly all of them come
from the media app. When one fails, the browser paints its own broken-image icon.
The page then looks unfinished, and on a product grid a few failures make the whole
shop look broken.

Showing our own placeholder keeps the page looking finished. The cost must stay
near zero: the shopper already paid for a slow or failing image, so the fix must
not add more download or more work on top of that.

## User Story

> As a shopper, I want a clean placeholder where a picture cannot load, so that
> the page still looks finished instead of showing a broken-image icon.

## Functional Requirements

- **FR-1** — When a remote image fails to load, the app draws its own placeholder
  in that image's place instead of the browser's broken-image icon.
- **FR-2** — The failing element keeps the exact box the page already gave it. Its
  width, height, aspect ratio, margins and position do not change.
- **FR-3** — An image that loads normally is left completely alone. Nothing about a
  healthy page changes.
- **FR-4** — An image whose source is a file shipped with the app is left alone,
  even when it fails. Only remote sources are covered.
- **FR-5** — An image with no usable source is left alone. An empty or missing
  source is a spot the design meant to leave blank, not a failure to cover.
- **FR-6** — The placeholder can never itself fail, and no sequence of failures on
  one element can repeat without end.
- **FR-7** — The mechanism is already working before the first image in the
  server-rendered page can fail. Images start loading before the app becomes
  interactive, so a mechanism that starts later would miss the first failures.
- **FR-8** — An image that appears after the first render is covered by the same
  mechanism. This includes images added by a client-side navigation, and images
  inside HTML the backend sends for product descriptions and notifications.
- **FR-9** — The placeholder is drawn whole, whatever the shape of the box. A wide
  banner, a tall product card and a small round avatar all show the complete
  placeholder, never a cropped part of it.
- **FR-10** — The four images that handle their own failure today stop doing so.
  The new mechanism is the only one, so two rules never act on the same element.

## Non-Functional Requirements

- **NFR-1** — No new package is added, and the first-load JavaScript grows by no
  more than 1 KB.
- **NFR-2** — Nothing runs while images are loading normally. Work happens only
  when an image actually fails.
- **NFR-3** — A failure costs no network request. The placeholder is already in the
  page when it is needed.
- **NFR-4** — A page with many failing images does no more than a small, fixed
  amount of work per failure. Two hundred failures must not produce two hundred
  network calls, log calls, or React re-renders.
- **NFR-5** — No new words are shown to the shopper, so no new translation keys are
  needed in `ar`, `tr` or `ku`.

## Constraints

- **C-1** — The global rule that makes every image in the app fill its box is not
  changed. Only an image that has already failed may paint differently.
- **C-2** — No protected runtime path is touched: the request-entry middleware, the
  build configuration, the error-reporting wiring, and the CI workflow files all
  stay as they are.
- **C-3** — The image-optimizer setting stays off. The solution must not depend on
  turning it on.
- **C-4** — No change to the Content-Security-Policy is required.
- **C-5** — The solution must not require editing the ~560 places that draw an
  image. Editing them is the cost this ticket exists to avoid.

## Edge Cases

- **A failure before the app is interactive.** The most common case, because
  images in the server-rendered HTML start loading immediately.
- **The original failing source is put back on the element** after the placeholder
  was already drawn. The placeholder must come back, and the pair must not swap
  back and forth without end.
- **Hundreds of failures at once**, when the media app is down.
- **An image inside backend HTML** (product description, notification body). It is
  a real image on the page and must be covered, without editing those screens.
- **An image added by client-side navigation**, after the first page render.
- **A source that is neither a remote address nor an app file** — for example a
  temporary in-memory address used while a shopper is uploading a photo. Treated as
  not remote, so it is left alone.
- **A local icon fails.** Left exactly as today: the browser's own icon. A grey
  placeholder box inside a 16-pixel toolbar slot would draw more attention to the
  fault than the current small broken icon.

### Two accepted changes to what is drawn today

Removing the four existing handlers (FR-10) changes two spots on purpose. Both were
weighed and accepted:

- **Chat contacts, the country-flag slot.** Today a failed flag is hidden and the
  space is left empty. From now on it shows the placeholder.
- **Two avatar spots** (chat search results, and the share list). Today a failed
  avatar falls back to the person-shaped default picture. From now on it shows the
  same general placeholder every other image uses.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | One placeholder is used for every shape: a small "no picture" mark on a light tint. It is never cropped, because a failed image is drawn whole rather than filling its box. Owner's decision, taken at spec time. | FR-9, AC-9 |
| OQ-2 | Yes. A failed image is allowed to paint differently from a working one, strongly enough to beat the global rule. This is accepted because it can only ever apply to an image that already failed — no working image changes. | C-1, FR-9, AC-3, AC-9 |
| OQ-3 | **Deferred to `/plan`.** The requirement is fixed here: the mechanism must already be working before the first image in the server-rendered page can fail. How that is achieved is an approach question. | Open Questions; requirement is FR-7 / AC-7 |
| OQ-4 | **Deferred to `/plan`.** The requirement is fixed here: if the failing source returns, the placeholder returns, and nothing loops without end. Whether the framework's hydration actually restores it must be established before the guard is designed. | Open Questions; requirement is FR-6 / AC-6, AC-11 |
| OQ-5 | All four handlers are removed. The new mechanism is the only one. Owner's decision. The two visible consequences are written above under "Two accepted changes". The pre-existing defect — a fallback pointing at a file that does not exist, with no loop guard — disappears with the handler, so it needs no separate ticket. | FR-10, AC-10 |
| OQ-6 | Remote images only. Files shipped with the app are left exactly as they are today. Owner's decision. | FR-4, AC-4 |
| OQ-7 | Yes, it must be excluded. An image with an empty or missing source is left alone. This also follows from OQ-6: an empty source is not a remote source. | FR-5, AC-5 |
| OQ-8 | **Out of scope.** The four call and video screens that draw an avatar as a CSS background already name a default picture themselves, so they are not left without one. Covering them would need a different mechanism. | Out of Scope |
| OQ-9 | **Out of scope.** No failure is reported to error tracking, the backend log, or product analytics in this ticket. One dead media host would otherwise produce hundreds of events per page view, which works against the cost requirement. Counting broken images belongs with the media app, which already knows which asset is missing. | Out of Scope, NFR-4 |
| OQ-10 | **Deferred to `/plan`.** The plan names the exact test file and cases (PL-13/PL-14). Two facts are fixed here: the proof belongs in the unit suite, because it needs no backend; and the unit runner never loads a real image, so the failure must be raised by hand there. Any criterion the unit suite genuinely cannot see must be named as not covered rather than assumed. | Open Questions |
| OQ-11 | No new alt text and no new copy of any kind. The element keeps whatever alt it already has. The global styling paints alt text invisible anyway, so new words would never be read. No translation keys are added. | NFR-5, AC-14 |

## Open Questions

- **OQ-3** — Deferred to `/plan`: by what means the mechanism is already working
  before the first server-rendered image can fail.
- **OQ-4** — Deferred to `/plan`: whether the framework's hydration puts a failed
  source back on the element, and what guard both survives that and cannot loop.
- **OQ-10** — Deferred to `/plan`: which test file and which cases prove each
  `AC-n`, and which criteria the unit runner cannot see.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A remote image that fails to load shows the app's placeholder, not the browser's broken-image icon. | FR-1 |
| AC-2 | After the placeholder is drawn, the element's box is identical to what it was before: same width, same height, same position. Nothing on the page moves. | FR-2 |
| AC-3 | A remote image that loads normally is not modified at all — no attribute, class or style is added to it, and it still fills its box the way it does today. | FR-3, C-1 |
| AC-4 | An image whose source is a file shipped with the app is not modified when it fails. It behaves exactly as it does today. | FR-4 |
| AC-5 | An image with an empty or missing source is not modified when it fails. No placeholder appears where the design left a blank. | FR-5 |
| AC-6 | The placeholder itself cannot fail to load, and needs no network request to appear. | FR-6, NFR-3 |
| AC-7 | The mechanism is already active when the first image of the server-rendered page fails, before the app becomes interactive. | FR-7 |
| AC-8 | An image added after the first render — by a client-side navigation, or inside HTML sent by the backend — gets the same placeholder, with no change to the screens that draw it. | FR-8, C-5 |
| AC-9 | The placeholder is drawn whole in every box shape: a wide banner, a tall product card, and a small round avatar each show the complete mark, never a cropped part of it. | FR-9, OQ-1, OQ-2 |
| AC-10 | None of the four images that handle their own failure today still does so. Exactly one mechanism acts on any failing image. | FR-10 |
| AC-11 | When a failing source is put back on an element that already shows the placeholder, the placeholder returns; and no element can swap between the two without end. | FR-6, OQ-4 |
| AC-12 | The change adds no new package, and adds no more than 1 KB to the JavaScript downloaded on first load. | NFR-1 |
| AC-13 | When images fail, no network request is made for the placeholder, and no report is sent to error tracking, the backend log, or product analytics. | NFR-3, NFR-4, OQ-9 |
| AC-14 | No new user-visible text is added, so the three translation files need no new key and stay key-parallel. | NFR-5, OQ-11 |

## Out of Scope

- **The media app change ("layer 1")** — making the media app answer a missing
  asset with the placeholder itself. A different codebase, handled separately. This
  ticket does not depend on it and is not blocked by it.
- **Avatars drawn as a CSS background** on the call and video screens (OQ-8). They
  already name their own default picture.
- **Reporting or counting broken images** (OQ-9). No error-tracking, backend-log or
  analytics traffic is added.
- **Videos, audio and their poster frames.** This ticket covers images only.
- **Any change to how images are addressed or sized**, including the image-optimizer
  setting and the media address helpers.
- **A different placeholder per context** (product, avatar, brand, banner). One
  placeholder serves every case.
- **A loading placeholder.** This ticket is about failure, not about what is shown
  while an image is still arriving.
