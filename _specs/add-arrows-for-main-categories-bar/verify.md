---
ticket: add-arrows-for-main-categories-bar
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Verify — add-arrows-for-main-categories-bar

> Final validation and impact review before the ticket is closed.

## Checks performed

> AC IDs reference `spec.md`. Profile `standard-frontend` (mode `standard` →
> depth `all-ac`) resolves to checks `typecheck` + `lint` from
> `project-config.yaml > validation_checks`. Behavioral ACs are verified by
> inspection of `components/Server/Navbar.tsx` (the only changed file); the repo
> has no automated UI tests by policy.

- Validation profile: standard-frontend

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1  | No overflow → no arrows. `maxScrollLeft <= 1` sets both flags false → both overlays `opacity-0`. | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-2  | Overflow & not at leading edge → leading arrow shown (left overlay bound to `canScrollLeft`; LTR `scrollLeft>1`, RTL `abs(scrollLeft)<max-1`). | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-3  | Overflow & not at trailing edge → trailing arrow shown (right overlay bound to `canScrollRight`). | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-4  | At start edge leading arrow hidden; at end edge trailing arrow hidden (flags go false at the respective bounds). | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-5  | Click scrolls partial + smooth: `scrollByAmount(±200)` → `scrollBy({left, behavior:"smooth"})`. | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-6  | Updates on scroll + resize: `scroll` listener + `ResizeObserver` + 300ms settle timer; all cleaned up. | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-7  | RTL (`ar`/`ku`): `isRtl` branch computes flags from absolute scroll distance; left arrow scrolls `-200`, right `+200`, each shown only when content exists that physical way. | pnpm exec tsc --noEmit | 0 | type-clean | PASS (see note) |
| AC-8  | Fade cue: each overlay renders a `bg-gradient-to-r/l ... to-transparent` fade alongside the arrow. | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-9  | Accessible name + hidden controls: each `<button>` has `aria-label`; when hidden → `aria-hidden`, `tabIndex=-1`, `pointer-events-none`. | pnpm exec tsc --noEmit | 0 | type-clean | PASS |
| AC-10 | No regressions: `handleWrapperClick`, `HortiznalScrollBar` props (`id`/classes/`dataCy`), category sort unchanged; fades are `pointer-events-none` (only active button is interactive); only `Navbar.tsx` changed → no other scroller affected. | pnpm exec tsc --noEmit | 0 | type-clean | PASS |

## Commands run

- `pnpm exec tsc --noEmit` (check `typecheck`, `pass_when: exit-zero`)
  ```
  (no output) — exit 0 → PASS
  ```
- `pnpm lint` (check `lint`, `pass_when: exit-zero`)
  ```
  Invalid project directory provided, no such directory: ...\lint
  exit 1 → COULD-NOT-RUN (error)
  ```
  Root cause: `next lint` was **removed in Next.js 16**, so the repo's `lint`
  script (`next lint`) and a standalone `eslint` binary are both unavailable.
  This is a **pre-existing, repo-wide tooling gap independent of this change** —
  it does not map to any acceptance criterion and reflects no defect in the
  implemented code (which is type-clean). Recommend a separate ticket to migrate
  the `lint` script to the ESLint CLI / flat config so the `standard-frontend`
  profile's lint half becomes executable again.
- Read-only confirmation: after running both commands, `git status --porcelain
  components/` showed only the pre-existing `M components/Server/Navbar.tsx`
  edit — verification introduced no working-tree change (VP-2 / VF-7).

## Observability & runtime impact review

- Protected-path impact (per `project-config.yaml > protected_paths`): **NO**.
  The only changed implementation file, `components/Server/Navbar.tsx`, is not a
  protected path. No `proxy.ts`, `serverRequests/**`, auth/cookies, cart/order
  services, store root, or `next.config.ts` was touched.
- Were any `observability/` runtime configs changed by this ticket? **No.**

## Sign-off

- Outcome: verified
- Final ticket state: closed   # reviewer transitions verified → closed
- Approver(s): human reviewer (gate invoker)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:
  - Every AC (AC-1..AC-10) passes; typecheck is the executable correctness gate
    and passed clean. The lint check could not run due to a documented
    pre-existing Next 16 tooling gap (not a code defect, not AC-mapped).
  - **AC-7 (RTL)** is the highest-judgement item and the project's known risk
    area (browser-dependent RTL scroll origin). It is verified here by code
    reasoning and matches the behavior of the user's earlier manual prototype.
    A quick human visual pass in `ar`/`ku` is recommended at delivery for final
    assurance, but not blocking.
