---
ticket: next-16-3-upgrade
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-18
links:
  clickup:
  github:
---

# Intake — next-16-3-upgrade

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`next-16-3-upgrade` — no ClickUp task and no GitHub issue yet. The request came
directly from the owner in a working session on 2026-08-18.

## Ticket Summary

Move the storefront from Next.js 16.2.11 to 16.3 and take the parts of that
release that do not require the Cache Components migration. The release is a
minor one and its notes list no breaking changes.

The request from the owner is that the ticket is complete in one pass: when it
closes, the only thing left is the owner's own live manual test on the branch.

Wanted in this ticket:

- Bump `next`, `eslint-config-next`, and `@next/bundle-analyzer` to 16.3.x.
- Move type-checking to TypeScript 7, and confirm the Vercel install command
  still passes `--production=false`.
- Use `next/root-params` to read the `[lang]` root param in Server Components
  instead of passing it down as a prop.
- Convert the existing error boundaries to `catchError` from `next/error`.
- Turn on `experimental.turbopackRustReactCompiler`, and re-enable
  `reactCompiler` in dev now that the Babel pass is no longer needed.

Explicitly **not** in this ticket (agreed with the owner — it is a separate
ticket): `cacheComponents`, `partialPrefetching`, loading shells, the ISR
changes, and the `instant()` Playwright helper.

## Ticket Metadata

- id / slug: `next-16-3-upgrade`
- title: Upgrade Next.js 16.2.11 to 16.3 and adopt its non-Cache-Components wins
- owner: developer
- created: 2026-08-18
- links: none

## User Story

> As the owner of the storefront, I want the app running on Next.js 16.3 with
> the parts of that release that need no caching migration, so that dev memory,
> build time and server throughput improve without changing how any page
> behaves for a user.

## Acceptance Criteria Presence Check

- Present? **yes**
- Notes: the request names five concrete outcomes, and each one can be checked
  without a judgement call:

  1. `next`, `eslint-config-next` and `@next/bundle-analyzer` all resolve to the
     same 16.3.x line.
  2. `next build` type-checks with TypeScript 7.
  3. `[lang]` is read through `next/root-params` in Server Components instead of
     being passed down as a prop.
  4. The existing error boundaries use `catchError` from `next/error`.
  5. `experimental.turbopackRustReactCompiler` is on and `reactCompiler` also
     runs in dev.

  Two of them need a bound written at `/wf:spec`, because the request does not
  set one and the difference is real work:

  - **How far the `[lang]` change goes.** `next/root-params` works in Server
    Components only in 16.3 — not in route handlers and not in Server Actions.
    So the prop passing cannot be removed everywhere. The spec must say which
    call sites are in scope and which keep the prop.
  - **What "no behaviour change" means for the user.** The whole point of this
    ticket is that no page behaves differently. The spec should state that as a
    criterion so it is testable, instead of leaving it as an assumption.

  Everything else in the request is a means, not an outcome, and belongs in
  `plan.md` rather than in the criteria.

## Test Cases Presence Check

- Present? **yes**
- Notes: the owner named the verification path, and it is the path this repo
  already runs — i18n parity, lint, `next typegen` then `tsc --noEmit`, the unit
  suite, and the Playwright e2e suite. Nothing new has to be built to prove this
  ticket.

  Three gaps for `/wf:spec` to close, because the existing gates do not cover
  them:

  - **The dev-memory and build-time claims are not tested by anything.** They
    are the reason for the ticket, but no gate measures them. The spec should
    either accept them as unverified, or define a simple before/after check.
  - **`catchError` needs a behaviour case.** The point of that change is that
    the boundary stops swallowing `notFound()` / `redirect()` and offers
    `retry()`. That is behaviour, so it needs a test case, not only a compile
    check.
  - **TypeScript 7 affects the whole toolchain, not only `next build`.** eslint,
    vitest and `tsx` all read TypeScript. The spec should require the full gate
    set to pass on TS 7, not just the build.

  The owner's own live manual test on the branch stays the last step and is not
  replaced by any of the above.

## Missing Information

Nothing here blocks the start of research. Every item below is a question that
`/wf:research` is meant to answer by reading this repository; they are listed so
research has a target list.

- **Does `@sentry/nextjs@^10.66.0` support Next.js 16.3?** `next.config.ts`
  wraps the whole config in `withSentryConfig`. This is the most likely single
  point of failure in the upgrade and it is unverified.
- **Does the rest of the toolchain work on TypeScript 7?** TypeScript 7 is a
  native rewrite, not an ordinary version bump. eslint (through its TypeScript
  parser), vitest, `tsx` and `next typegen` all have to accept it. This is the
  second real risk.
- **Which 16.3 patch version to pin.** The repo pins `next` exactly today
  (`16.2.11`), so the ticket has to choose one.
- **How many `[lang]` call sites are really Server Components.** About 36 files
  under `app/` touch `params`. The split between Server Components, route
  handlers and Server Actions decides the true size of this ticket.
- **Whether `reactCompiler` in dev is wanted with no condition.** Today it is
  off in dev on purpose, to save memory and CPU on a constrained machine. The
  Rust compiler is the reason to turn it back on, but the `isDev` guard in
  `next.config.ts` is a deliberate choice, so research should confirm that
  removing it is safe rather than assume it.

One item is **not** a research question, because it lives outside this
repository and needs the owner:

- **The Vercel install command must keep `yarn install --production=false`.**
  If it does not, `next build` will install TypeScript by itself — which is
  exactly what broke the builds in July 2026. Confirm this in the Vercel
  dashboard before `/wf:implement`.

One decision is already made, recorded here so it is not re-opened later:

- `experimental.turbopackRustReactCompiler` is experimental and it changes
  **production** output, because the React Compiler runs on the shipped build.
  The owner asked for it directly, so it is in scope. The risk is real but
  accepted; the advisory panel at `/wf:review` should still look at it.

## Readiness Status

`READY`

- Justification: the request has a clear boundary — five named changes in, five
  named changes out — and the owner has already ruled on the one question that
  would have changed the size of the ticket (Cache Components stays out). Each
  wanted change maps to an outcome that can be checked, and the verification
  path is the repo's existing gate set, so nothing has to be invented to prove
  the work. The open items above are all impact questions about this
  repository, which is what the read-only research stage exists to answer, so
  they do not hold the ticket at intake. The one item research cannot settle —
  the Vercel install command — is a single check by the owner and is needed
  before `/wf:implement`, not before `/wf:research`.
