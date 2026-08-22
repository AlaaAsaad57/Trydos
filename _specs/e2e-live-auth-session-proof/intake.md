---
ticket: e2e-live-auth-session-proof
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-22
links:
  clickup:
  github:
---

# Intake — e2e-live-auth-session-proof

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-live-auth-session-proof` — no ClickUp task and no GitHub issue yet.

## Ticket Summary

The browser suite has one live auth test, and it proves less than it looks like
it does: `verifyCookiesSet` checks cookie **names** only, because the assertion
on the `User-Data` payload is commented out (commit `14d2c531`). Nothing covers
logout, and nothing covers a signed-in session surviving a page reload. This
ticket finishes the live auth coverage so the auth journey is closed before the
money-path work starts.

Two parts:

1. Complete `verifyCookiesSet` in `tests/e2e/actions/auth.ts` — assert the
   `User-Data` cookie holds a payload carrying an id, and that `MARKET-TOKEN` is
   `HttpOnly`.
2. Add the missing specs next to the existing login test in
   `tests/e2e/auth.live.spec.ts` — logout clears every cookie in the cleanup
   list, and a signed-in session survives a reload.

Login fans out to five backends and writes about ten cookies, so a partial
failure is invisible today: a shopper can be signed in to the storefront and not
to chat. That is the risk this work makes visible.

Expected to be test-only, plus new `data-pw` hooks in app code if a selector is
missing. No product behaviour changes.

## Ticket Metadata

- id / slug: `e2e-live-auth-session-proof`
- title: Prove login, logout and session survive on staging
- owner: developer
- created: 2026-08-22
- links: none

## User Story

> As the engineer who owns this app, I want the browser suite to prove that a
> real login writes a usable session, that logout removes all of it, and that
> the session survives a reload, so that a partial failure across the five
> backends is caught by a test instead of by a shopper.

## Acceptance Criteria Presence Check

- Present? yes
- Notes: the request carries four outcomes that can each be checked by a test,
  which is what intake needs. They are written as `AC-n` at `/spec`, not here.
  1. A completed login leaves a `User-Data` cookie whose payload carries an id —
     not merely a cookie with that name.
  2. `MARKET-TOKEN` is `HttpOnly` after login.
  3. Logout removes every cookie in the app's logout cleanup list.
  4. A signed-in session still works after a full page reload.

## Test Cases Presence Check

- Present? yes
- Notes: three live cases, all in the browser suite. One extends the existing
  login test through `verifyCookiesSet`; two are new specs next to it. They are
  read-and-write on a real staging session, so they follow the suite's existing
  rule of one session per run rather than logging in per test. Exact spec names
  and scenario ids are decided at `/spec`.

## Missing Information

None that blocks research. Three things research has to settle:

- Whether the logout control already has a `data-pw` hook, or whether the ticket
  has to add one to app code.
- What the authoritative logout cleanup list is, and whether it includes the
  legacy `DEVICE-TOKEN` — the app never sets that cookie but does list it for
  cleanup, so "every cookie in the list" needs a definition the test can read.
- How "the session survives a reload" is proven without a second login, given
  the suite creates one session per run and OTP is rate limited on staging.

One environment note, not a gap in the request: `pnpm e2e:health` fails on this
machine, and the owner confirms Elasticsearch is serving. Probing shows the port
accepts a TCP connection and then answers nothing before resetting, which points
at a network allowlist in front of the node rather than a node that is down.
Since `preflight` and `run` both gate on that probe, verification has to happen
from a machine that can reach the node directly. Carried as `OQ-9` in
`research.md`.

## Readiness Status

`READY`

- Justification: the request names one focused outcome (close the live auth
  coverage), the outcomes above are testable, the files to change are known, and
  nothing is ambiguous enough to need the Workflow Owner. The open points listed
  under Missing Information are ordinary research questions, not missing
  requirements.
