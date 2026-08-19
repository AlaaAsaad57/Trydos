---
ticket: e2e-guest-token-lifecycle
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-19
links:
  clickup:
  github:
---

# Intake — e2e-guest-token-lifecycle

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-guest-token-lifecycle`. No ClickUp task and no GitHub issue. The source is a
direct request from the owner. It follows the browser suite already in the
repository (`tests/e2e`), which has 31 passing guest cases and covers no auth at
all.

## Ticket Summary

Cover a guest's token from end to end in the browser suite: the guest is
registered on a first visit, the token pair is rotated when the access token
stops being accepted, and a new guest is registered when the rotation itself
cannot happen. Three cases, each one a real journey a person takes, none of them
requiring a login.

## Ticket Metadata

- id / slug: `e2e-guest-token-lifecycle`
- title: End-to-end tests for the guest token lifecycle
- owner: developer
- created: 2026-08-19
- links: none

## User Story

> As a shopper who has never signed in, I want the site to keep working when my
> token stops being accepted, so that I never see an error or lose my place
> while I am browsing.

## The three cases requested

1. **A first visit registers the guest.** The guest opens the site, the app
   registers them, the calls that follow all succeed, and the guest ends up
   holding both an access token and a refresh token.
2. **A rejected access token is rotated.** The access token is replaced with one
   the backend will not accept. The guest opens the cart, the app exchanges the
   pair, the cart works, and the guest is still the same guest.
3. **A rejected pair registers a new guest.** Both tokens are replaced, so the
   exchange cannot work either. The guest opens the cart and comes out with a
   new access token, a new refresh token, and a new guest identity.

## What the request is based on

Everything below was measured against a real `next build` by driving one guest
through all three cases. None of it is read off the code.

| Case | What the browser asks for | What comes out |
|---|---|---|
| 1 — first visit | `POST /api/auth/me`, `POST /api/auth/register-device`, `POST /api/proxy`, `POST /api/auth/update-user` | guest id `21172`; access and refresh cookies both set |
| 2 — access replaced | `POST /api/auth/me`, `POST /api/proxy`, **`POST /api/auth/refresh`**, `POST /api/auth/update-user` | both cookies rotated; **same** guest id `21172` |
| 3 — both replaced | `POST /api/auth/me`, `POST /api/proxy`, `POST /api/auth/refresh`, **`POST /api/auth/expire`**, `POST /api/auth/update-user` | both cookies replaced; **new** guest id `21176` |

The three cases are therefore real and distinguishable: case 2 calls `refresh`
and keeps the identity, case 3 calls `refresh`, fails, calls `expire`, and gets a
new identity.

Opening the cart is one `POST /api/proxy` carrying `GET /cart/cart_shipping`, so
the cart is a genuine authed call and is the right trigger for cases 2 and 3.

## Answers to the questions raised at intake

- **How to tell one guest from another.** `POST /api/auth/me` returns
  `user.id`. It went `21172` → `21172` → `21176` across the three cases, which
  is exactly the signal cases 2 and 3 differ on. It is safe to read: the route
  passes the profile through `sanitizeUserData`, which removes `token`,
  `access_token`, `id_token` and `refresh_token` before answering.
- **Whether replacing a token really produces a refusal.** Yes. A token with a
  valid JWT shape and a meaningless signature is refused, and that refusal is
  what starts the rotation. Pure nonsense was not needed.
- **Whether a guest sees a prompt in case 3.** No. The 401 handler in
  `utils/fetchData.ts` only prompts when the request came from a seller page or
  when the dead session belonged to a phone-verified shopper. A guest is
  re-registered silently, which the measurement confirms — case 3 completed with
  no interaction at all.
- **What case 3 leaves on staging.** One new guest per run, and that is
  accepted. No cleanup is required and none will be written; the spec states
  this plainly rather than leaving it implied. Guest ids already moved by more
  than one during a single spike, so guests are being created on staging by
  other traffic regardless.
- **How token material is kept out of the artifacts.** The `live` project
  records nothing — trace, video and screenshot are all off in
  `playwright.config.ts`, because this repository is public. On top of that, no
  case needs to read a real token: each one overwrites the cookie with a fixed
  fake value and then asserts on whether the value changed, on its length, and
  on the token-free answer from `/api/auth/me`. No real token is read, asserted,
  logged or saved at any point.
- **Which suite the cases belong to.** The `live` one. Nothing is faked: the
  real backend issues the tokens, refuses them and rotates them. Changing your
  own cookie is the visitor's own state, not a scripted backend answer.

## Known constraint on how the cases are written

A guest session is short on purpose — `expired_at` is about sixty seconds after
`created_at`. The app never refreshes on a timer (the rotation only ever happens
after a real refusal), but the backend will refuse a call made after that minute
is up. So any case that lets more than a minute pass between registering and its
next authed call will rotate the pair on its own. That would make case 1 flaky
and could hide the very thing case 2 is there to prove. The cases must keep that
window short, and the spec has to say so.

## Acceptance Criteria Presence Check

- Present? no
- Notes: the request describes the three journeys and their outcomes, but not in
  a testable form. Writing them as criteria is spec work. Nothing is missing to
  do it — every outcome now has a measured signal behind it.

## Test Cases Presence Check

- Present? yes
- Notes: three cases, each with a measured trigger (opening the cart) and a
  measured signal (which routes are called, whether the cookies changed, and
  whether `user.id` survived). The table above is the evidence.

## Missing Information

None. All six questions raised at intake are answered above, the two that needed
an owner decision are settled:

- case 3 may leave a guest on staging, with no cleanup;
- the sixty-second guest session is intended, so the cases keep their window
  short rather than trying to change it.

## Readiness Status

`READY`

- Justification: the request is clear, the three journeys are real and were each
  driven end to end against staging, every outcome has an observable signal that
  does not touch token material, and both owner decisions are made. There is
  nothing left to qualify.
