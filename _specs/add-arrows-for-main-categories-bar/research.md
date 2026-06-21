---
ticket: add-arrows-for-main-categories-bar
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-06-20
links:
  clickup:
  github:
---

# Research — add-arrows-for-main-categories-bar

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Add edge arrow affordances (with a fade/gradient cue) to the **main categories
bar** so users can tell the bar is horizontally scrollable and that more
categories exist off-screen. Arrows appear conditionally (per scroll position /
overflow), are clickable to scroll toward that side, and behave correctly under
RTL (`ar`/`ku`).

## Relevant directories

- `components/Server/` — server/client storefront chrome. Hosts `Navbar.tsx`
  (the categories bar) and `MainCategories/index.tsx` (its data-fetching parent).
- `components/global/` — shared primitives, incl. `HortiznalScrollBar.tsx`, the
  generic horizontal scroller the categories bar wraps. **Shared by 30+ call
  sites — out of scope to modify (see Risks).**
- `components/Home/` — `CategoryNavMobile` renders each category chip (the
  children of the bar); not expected to change.
- `public/translations/` — `translations.{en?,ar,ku,tr}.js` i18n string tables,
  relevant only if the arrow controls need localized `aria-label`s.
- `_specs/add-arrows-for-main-categories-bar/` — this ticket's workspace (the
  only writable area for non-implement stages).

## Relevant config files

- `.claude/project-config.yaml` — `protected_paths` list + `validation_profiles`.
  **None of the files in scope are protected paths**, so `mode: standard` is
  correct (no `high_risk` trigger; MO-3 not engaged).
- `tailwind` setup (custom inverted max-width breakpoints `xs/sm/md/lg2/lg`,
  per CLAUDE.md) — any responsive show/hide of arrows must use these, not raw px.
- `next.config.ts` (protected) — **not needed**; no new image host / header.
- React Compiler is enabled (`reactCompiler: true`) — avoid manual
  `useMemo`/`useCallback` without a profiled reason.

## Possibly affected services

- **None** (no backend / data service). This is a pure client-side UI affordance.
  `MainCategories/index.tsx` already fetches categories via
  `serverRequests/home > GetMainCategories`; that call is unchanged. No
  `services/`, store slice, API route, or `protected_paths` entry is touched.

## Test / validation commands available

(Per `project-config.yaml > validation_checks` — list only, not run here. No unit
test suite exists in this repo by policy.)

- `pnpm exec tsc --noEmit` — TypeScript type check (check id `typecheck`).
- `pnpm lint` — Next.js ESLint (check id `lint`).
- `pnpm build` — production build (check id `build`).
- `pnpm knip` — unused files/exports/deps (check id `knip`).
- Suggested profile for `/plan`: **`standard-frontend`** (typecheck + lint) — the
  lightweight gate for normal frontend work.
- Manual: `pnpm dev` and visually verify overflow / edge / RTL behavior (no
  automated UI tests by policy).

## Risks and unknowns

- **`HortiznalScrollBar` is shared (30+ consumers).** Editing it to add arrows
  would change every horizontal scroller in the app. Mitigation: add the arrows
  + fades in a wrapper **inside `Navbar.tsx`, around** `HortiznalScrollBar` — do
  not modify the shared primitive. (Confirmed approach from the discarded
  prototype.) — high impact if violated / medium likelihood.
- **RTL scroll math is browser-dependent.** `scrollLeft` sign/origin differs
  across engines in RTL; the conditional show/hide and `scrollBy` logic must
  account for `isRtl` (`ar`/`ku`). Main source of complexity / bugs. — medium.
- **Single fixed element id (`categories-bar-container`).** Client code locates
  the scroller via `document.getElementById`. Only one categories bar renders per
  page, so collision is unlikely, but DOM lookup must be SSR-safe (effect-only,
  guard for `null`). — low.
- **No automated tests** — correctness rests on typecheck/lint + manual visual
  verification across breakpoints and locales. — medium.
- **a11y / i18n of arrow controls** — interactive arrows need accessible labels;
  the prototype hard-coded English `aria-label`s. — low/medium (see open
  questions).

## Open questions

- Should arrows be **localized for a11y** (translated `aria-label`, e.g. via
  `public/translations/*`) or treated as decorative (`aria-hidden`) since the
  same scroll is reachable by drag/swipe? (Resolve at `/spec`.)
- Should arrows be **shown on touch/mobile** (where swipe scroll is natural) or
  hidden below a breakpoint and shown on pointer/desktop only? (Behavior +
  acceptance scope.)
- Scroll **step amount**, exact arrow styling, and fade width — defer to
  `/plan` / design language; not blocking for `/spec` behavior.

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
