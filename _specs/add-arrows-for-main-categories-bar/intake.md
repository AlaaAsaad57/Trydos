---
ticket: add-arrows-for-main-categories-bar
stage: intake
mode: standard
status: in_progress
owner: ai_agent
updated: 2026-06-20
links:
  clickup:
  github:
---

# Intake — add-arrows-for-main-categories-bar

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

add-arrows-for-main-categories-bar — (no ClickUp/GitHub link provided)

## Ticket Summary

Add fixed/persistent arrow affordances to the main categories bar so users can
tell that the bar is horizontally scrollable and that there are more categories
to see beyond the visible edge.

## Ticket Metadata

- id / slug: add-arrows-for-main-categories-bar
- title: Add fixed arrows in the categories bar so user can know that there is more to see
- owner: ai_agent
- created: 2026-06-20
- links:

## User Story

> As a shopper browsing the storefront, I want a clear visual cue (arrows) on the
> main categories bar, so that I know more categories exist off-screen and can
> scroll to reach them.

## Acceptance Criteria Presence Check

- Present? (yes)
- Notes: Behavior clarified (a manual prototype confirmed expected behavior).
  Formal `AC-n` IDs to be authored at `/spec`. Confirmed behavior:
  - Arrows on both the leading and trailing edges of the main categories bar.
  - Arrows are shown **conditionally** — a side's arrow appears only when the bar
    overflows and there is more content to scroll toward in that direction; it
    hides (fades out) when that edge is reached or when no overflow exists.
  - Arrows are **interactive** — clicking an arrow scrolls the bar smoothly
    toward that side.
  - A gradient/blur fade accompanies each arrow as an additional "more content"
    cue.
  - Correct direction and placement under RTL locales (`ar`, `ku`).

## Test Cases Presence Check

- Present? (yes, at behavior level)
- Notes: Formal test cases authored at `/spec`. Scenarios to cover: overflow vs.
  no-overflow, at-start / mid / at-end scroll positions, click-to-scroll on each
  arrow, and RTL (`ar`/`ku`) direction/placement.

## Missing Information

- (resolved) Arrows shown only when overflow exists and not at that edge.
- (resolved) Arrows are interactive (click scrolls toward that side).
- (resolved) RTL (`ar`/`ku`) direction/placement handled.
- (to confirm at `/research`) Host component is `components/Server/Navbar.tsx`
  (`NavbarServer`), wrapping `components/global/HortiznalScrollBar`
  (`#categories-bar-container`).

## Readiness Status

`READY`

- Justification: The request is qualified and the expected behavior is confirmed
  by a manual prototype (now discarded so the workflow can implement it cleanly).
  Open clarifications are resolved; ready for `/research`.
