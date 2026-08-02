---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: in_progress     # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Intake — remove-debug-pages-and-any-leaking-servers-info

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`remove-debug-pages-and-any-leaking-servers-info`

Source of scope: `docs/security/backend-disclosure-decisions.md` (decisions
D1–D4, dated 2026-07-19). No ClickUp task or GitHub issue linked.

## Ticket Summary

A penetration tester reading the JS bundle or replaying requests against
`/api/proxy` can currently enumerate our backend hosts, tell which services
exist, and tell which backend (Go vs Laravel) serves a given endpoint. This
ticket removes those disclosure surfaces by adopting all four decisions recorded
in `docs/security/backend-disclosure-decisions.md`: deleting the unauthenticated
debug pages, making the backend base URLs server-only environment variables,
removing the backend-topology response header, and replacing the human-readable
service identifiers in the proxy contract with opaque tokens.

## Ticket Metadata

- id / slug: `remove-debug-pages-and-any-leaking-servers-info`
- title: Remove client-facing backend disclosure surfaces
- owner: developer
- created: 2026-07-19
- links: none

## User Story

> As the operator of the Trydos storefront, I want the browser-facing surface to
> disclose nothing about our backend hosts, service inventory, or Go-vs-Laravel
> split, so that an attacker performing reconnaissance gains no free map of our
> internal architecture.

## Scope (confirmed at intake)

All four decisions, **D1–D4**, are in scope for this ticket.

| # | Decision | Notes |
|---|----------|-------|
| D1 | Remove the debug pages | Delete `app/(client)/api-test/` (incl. `CurrencyTestCard`) and `app/(client)/requests-log/`. Both are unauthenticated and ungated. |
| D2 | Base URLs become server-only env | Drop the `NEXT_PUBLIC_` prefix from the seven backend base URLs. **Excludes** `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` — see Constraints. |
| D3 | Remove the `IS-FROM-GO` response header | **Already applied in the working tree** — see Prior Work below. |
| D4 | Opaque service identifiers | Replace readable `x-proxy-server` values with meaningless tokens; mapping stays server-side. |

Ordering constraint carried from the decisions doc: **D1 must land before D2**,
because deleting `/api-test` removes the last client-side reader of four of the
seven base URLs, which is what makes the D2 rename mechanical. D3 and D4 are
independent.

## Prior Work Already In The Working Tree

**D3 appears to be complete and is currently uncommitted on the `develop`
branch.** Verified at intake: `IS-FROM-GO` returns zero matches repo-wide, the
dead `"fullUrl": ''` header is gone, and the ungated `console.log` in
`utils/server/tokenManager.ts` is removed. Four files are modified:

- `app/api/proxy/route.ts`
- `app/api/auth/register-device/route.ts`
- `app/api/internal/mobile-error-log/route.ts`
- `utils/server/tokenManager.ts`

**Decision taken at intake:** these changes are to be **moved onto the ticket
branch**, not committed to `develop`. They stay stashed until `/implement`
creates `ticket/remove-debug-pages-and-any-leaking-servers-info`, then are
restored there so D3 ships inside this ticket's single publishable commit.

This has two consequences that later stages must respect:

1. `/implement` requires a clean `develop` to branch from (IM-3, IM-8). The
   stash must happen **before** the branch is created, or `/implement` will
   block on a dirty tree.
2. `plan.md` must list these four files under "Files to change" even though
   their edits already exist, otherwise restoring the stash on the ticket branch
   registers as unplanned modification (IM-4).

`/research` should re-verify the current state of these files rather than trust
this note, since the working tree can change before implementation.

## Constraints Carried From The Decisions Doc

- **D2 excludes the media host.** `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` must stay
  public: it is read from genuine client code that uploads directly to the media
  server from the browser. De-publicising it requires routing uploads through a
  server route first, which belongs to the separate `NEXT_PUBLIC_MEDIA_API_KEY`
  workstream.
- **D2 has out-of-repo impact.** Renaming the seven variables requires updating
  Vercel project environment variables across all environments, plus
  `.env.example` and deployment docs. A rename that lands in code before the
  platform env is updated takes the backends down.
- **D4 must ship atomically.** A half-migrated identifier map means live
  requests receive `400 "Invalid server type"`.
- **D4 is obfuscation, not access control.** The decisions doc is explicit that
  it raises recon cost without stopping a determined attacker, who can still
  enumerate tokens by replaying each and observing which return `400`. It must
  not be treated as having secured the proxy.

## Explicitly Out Of Scope

Recorded in the decisions doc as separate tickets; this ticket must not absorb
them:

- `/api/proxy` CSRF / origin guard
- Proxy path allowlist
- `NEXT_PUBLIC_MEDIA_API_KEY` exposure (a live credential in the client bundle)
- Error sanitization across the ~24 API routes returning `error.message`
- `next.config.ts` `images.domains` naming staging and S3 hosts

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: The decisions doc states intent and constraints but contains no
  testable acceptance criteria. These are authored at `/spec`, not here. Each of
  D1–D4 needs at least one verifiable criterion — e.g. the routes 404, the seven
  variables appear nowhere in the built client bundle, the header is absent from
  proxy responses, and every service identifier round-trips through the proxy.

## Test Cases Presence Check

- Present? **no**
- Notes: This repo has no test suite by policy (`CLAUDE.md`), so verification
  will be command- and inspection-based — grep over `.next/static` for the
  renamed variables, response-header inspection against `/api/proxy`, route
  404 checks, and a `pnpm build` typecheck. Defined at `/spec` and `/plan`.

## Missing Information

- **Final D4 token values.** The decisions doc marks the table illustrative and
  defers the real values to implementation. They must be meaningless, with no
  decodable abbreviation and no stable prefix pattern.
- **Who updates the Vercel environment variables for D2, and when relative to
  the code merge.** This is a deploy-ordering question with production impact
  and is not answerable from the repo.
- **Whether `market` and `market-dashboard` should remain separate identifiers
  under D4.** They currently resolve to the same base URLs and the same token,
  so the split grants no separation today. Collapsing or keeping them is a
  design decision for `/plan`.

## Readiness Status

`READY`

- Justification: The request is qualified and its scope is confirmed at D1–D4
  with a clear source document. The goal, the affected surfaces, the ordering
  constraint, the out-of-repo impact, and the exclusions are all stated. The
  three open items above are design and deploy-sequencing decisions that belong
  to `/spec` and `/plan` respectively — none of them blocks read-only
  investigation, so `/research` can proceed.
