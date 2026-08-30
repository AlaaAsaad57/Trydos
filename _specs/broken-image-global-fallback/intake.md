---
ticket: broken-image-global-fallback
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Intake — broken-image-global-fallback

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`broken-image-global-fallback` — no ClickUp task and no GitHub issue yet. The
request came directly from the developer in conversation.

## Ticket Summary

The app shows a huge number of images, and almost all of them come from the media
app. When one of them fails to load, the browser paints its own broken-image icon.
The request is to show our own placeholder instead. It must cost close to nothing
in bundle size and in runtime work, and it must never change how any screen looks
when the images are fine.

## Ticket Metadata

- id / slug: `broken-image-global-fallback`
- title: Show a placeholder when an image fails to load, with no layout change
- owner: developer
- created: 2026-08-30
- links: —

## User Story

> As a shopper, I want a clean placeholder where a picture cannot load, so that
> the page still looks finished instead of showing a broken-image icon.

## Scope Boundary — this ticket is "layer 2" only

The conversation that produced this ticket described two layers:

- **Layer 1 — the media app answers with the placeholder itself.** That is a
  change in the media-serving app, which is a different codebase. It is **out of
  scope here**. It is being handed to that team separately.
- **Layer 2 — one global listener in this app.** That is this ticket. It is the
  safety net for every failure layer 1 cannot cover: a dead network, a wrong host,
  an image on S3 or another host, a URL that never reached the media app at all.

Layer 2 does not depend on layer 1 and does not block on it.

## The constraint that matters most: nothing may change shape

The developer stated this as the top requirement, and the numbers below are why.

Counted on `develop` at intake time:

| Fact | Value | Where |
|---|---|---|
| Raw `<img>` tags in `components/` + `app/` | 499 | `grep -rn "<img" --include=*.tsx` |
| Files importing `next/image` | 63 | `grep -rl "from \"next/image\""` |
| Existing `onError` handlers on images | ~4 | e.g. `components/products/ShareAvatar.tsx:26` |
| Next.js image optimizer | **off** — `images.unoptimized: true` | `next.config.ts:184` |

Two things follow from that table, and the research stage has to treat both as
first-class:

1. **One change touches ~560 places at once.** Any styling the fallback carries —
   a size, a border, an `object-fit`, a background — lands on every failing image
   in the app: product cards, story circles, chat avatars, brand icons, banners,
   the seller dashboard. So the fallback must not set width, height, aspect ratio,
   or position. It may only replace the picture that is drawn inside the box the
   page already gave the element.
2. **`unoptimized: true` means `next/image` renders a plain `<img>`.** So both
   groups above are the same element in the DOM, and one mechanism can cover them
   both. Research must confirm this holds for every `next/image` usage in the repo.

## Acceptance Criteria Presence Check

- Present? **no** — not yet written as testable `AC-n`. The request is clear, the
  criteria are not formal yet. `/wf:spec` writes them.
- Notes: The criteria will need to state, at minimum: the placeholder appears on a
  failed load; the element's own box is unchanged; a working image is untouched;
  the fallback cannot itself fail or loop; the added client cost is bounded.

## Test Cases Presence Check

- Present? **no**.
- Notes: The behaviour is a DOM event listener, so it can be proven without a
  backend. That points at the unit suite (`tests/`, Vitest with a DOM
  environment), which gates every pull request. `/wf:plan` declares the exact
  files and cases, and maps each to an `AC-n`.

## Workflow Type Check

Confirm this is a Development work item and not another workflow type. This is the
only type that cuts a branch and edits source files, so a wrong answer here costs
the most:

- Is the goal to *understand* something that already exists? **No** — the
  behaviour does not exist yet.
- Is the goal to *choose between options*? **No** — the approach was already
  chosen in conversation before this ticket opened. A global capture-phase `error`
  listener was picked over a per-component fallback component, and the reason was
  recorded: a per-component version would need edits at ~560 call sites and would
  add React state and a second render to every image.
- Is the change to make already known, leaving only building it? **Yes.**

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` (via `/wf:start-ticket`, which fixes the type to `development`) |
| ClickUp field said | — |
| Argument said | `development` |

No disagreement to record.

## Missing Information

Everything below is a question for `/wf:research`, not a blocker on intake:

- Which artwork the placeholder uses, and whether an asset for it already exists.
  `public/icons/ProfilePlaceHolder.svg` is the only placeholder-looking file in the
  repo today, and it is profile-shaped, so it is probably not the general one.
- Whether one neutral placeholder can serve every image shape in the app, or
  whether a few contexts (avatar, brand icon, banner) genuinely need their own.
- Where the listener is installed so it is running **before** the first image
  fails. Images start loading before React hydrates, so a listener that only
  starts after hydration misses the first wave.
- Whether React 19 hydration can put the original broken `src` back after the
  listener swaps it, and what that does on screen.
- Which image surfaces the listener cannot reach — CSS `background-image`,
  `<picture><source>`, SVG `<image>`, `srcset` — and whether any of them carry
  media-app images today.
- Whether the ~4 existing `onError` handlers would now run twice, or fight the new
  listener.

## Readiness Status

`READY`

- Justification: The problem, the chosen approach, and the hard constraint are all
  stated. The open points listed above are discovery work, which is exactly what
  the research stage is for. Nothing here needs an answer from outside the team
  before research can start.
