---
ticket: e2e-guest-token-lifecycle
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-19
links:
  clickup:
  github:
---

# Research — e2e-guest-token-lifecycle

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Add browser tests that follow a guest's token through its whole life: issued on
a first visit, rotated when it is refused, and replaced by a new guest when the
rotation itself cannot happen.

## Relevant directories

- `tests/e2e/` — the browser suite these cases join. Already holds 31 passing
  guest cases and no auth coverage at all.
- `tests/e2e/actions/` — where a thing a visitor does belongs. `nav.ts` has
  `gotoHome` and `openCart`, which are the two moves all three cases need;
  `locale.ts` shows the pattern for an action that talks to the server directly
  instead of driving the browser.
- `tests/e2e/harness/` — starting the server, the staging guard, the secret
  redactor (`redact.ts`). Nothing here should need changing, but `redact.ts` is
  the existing answer to "how does this suite avoid printing a secret".
- `app/api/auth/` — every route the three cases exercise: `me`,
  `register-device`, `refresh`, `expire`, `update-user`.
- `utils/server/` — `tokenManager.ts` (reads the cookies, strips tokens out of
  the profile) and `authRefresh.ts` (performs the exchange).
- `services/` — `auth.ts` holds `RefreshSession` and `ExpiredUser`; `cart.ts`
  and `utils/functions.tsx > getCart` are what opening the cart calls.
- `docs/testing/` — `E2E_TEST_DESIGN.md` and `E2E_SCENARIOS.md`. The scenarios
  file lists every case and gains a row per case added.

## Relevant config files

- `playwright.config.ts` — the two projects. The `live` project records no
  trace, video or screenshot, which is what makes it safe to handle tokens in
  these cases at all. Also sets `retries: 0` and `workers: 1`.
- `tests/e2e/fixtures.ts` — the shared `test` object; skips every case when no
  staging addresses are configured.
- `tests/e2e/harness/env.ts` — `LIVE_ORIGIN` (`http://127.0.0.1:3100`) and the
  list of backend addresses the guard checks.
- `.github/workflows/test-e2e.yml` — runs on push to `develop` and `main`, plus
  nightly at 02:30 UTC. One global concurrency group, never cancelled, because a
  killed run can leave data behind on staging.
- `proxy.ts` — read only to confirm the matcher excludes `/api`, so none of the
  auth routes pass through the locale rules. **Protected runtime path — not to
  be changed by this ticket.**

## Possibly affected services

- **The gateway** — issues the guest, refuses a bad token, and performs the
  exchange. Every case depends on it. Case 3 creates one real guest per run,
  which is accepted (see `intake.md`).
- **The core backend** — not used by a guest path here, but shares the
  `MARKET-TOKEN` pair, so a change to the token contract touches both.
- **The cart** — `GET /cart/cart_shipping`, tunnelled through `POST /api/proxy`,
  is the authed call that triggers cases 2 and 3. `getCart` waits for a user id
  before firing, so it is coupled to registration having finished.
- **Sentry and PostHog** — both fire on a first visit. Neither is asserted on,
  but both add calls to anything that records network traffic.

## Test / validation commands available

Listed only; none were run by this command.

- `pnpm test:e2e` — preflight, build, then every spec.
- `pnpm test:e2e:live` — only the real-staging specs.
- `pnpm e2e:preflight` — "is this configured, and is it staging?".
- `pnpm e2e:health` — is the search backend serving? Tells a backend outage
  apart from a code failure.
- `pnpm lint` — also enforces that translate keys exist in all three language
  files.
- `pnpm test:run` — the unit suite, which already covers the auth routes
  (`tests/app/api/auth/*`), `HandleAuthedFetch`, `tokenManager` and
  `authRefresh`. These cases must not duplicate it.
- `npx tsc --noEmit` — needs `npx next typegen` first on a clean checkout.

## Risks and unknowns

- **A guest session lasts about sixty seconds.** `expired_at` is roughly a
  minute after `created_at`, and the owner has confirmed this is intended. The
  app never refreshes on a timer, so nothing happens until the next call — but
  any case that lets the minute lapse before its next authed call will rotate
  the pair on its own. That would make case 1 flaky and could hide what case 2
  exists to prove. High likelihood if the cases are written casually; the fix is
  to keep each case's window short.
- **Guest ids move for reasons that are not ours.** Ids jumped by four during a
  single spike, so other traffic creates guests on the same staging backend. A
  case that asserted an exact id would be wrong; only "the same as before" and
  "different from before" are safe.
- **The identity read comes from a cookie, not the backend.** `/api/auth/me`
  answers from the `User-Data` cookie through `getCurrentUser`. That is the
  right signal for "is this still the same guest as far as the app is
  concerned", but it is not proof the backend agrees. Worth stating in the spec
  so nobody reads more into it later.
- **Concurrent refusals share one exchange.** `services/auth.ts` keeps an
  in-flight promise per server for the refresh and a single one for the expire,
  so several refused calls produce one `/api/auth/refresh`. A case that counted
  calls would be asserting on timing, not behaviour.
- **A spec that reads network traffic is new for this suite.** Every existing
  case asserts on the page or on a redirect. Watching which routes are called is
  a new kind of assertion here, and it is the most brittle kind — the boot
  sequence can change without anything being broken.
- **Tampering needs a token-shaped value.** A value with a valid JWT shape and a
  meaningless signature produced the refusal during the spike. If the backend
  ever starts rejecting malformed values differently from expired ones, the
  cases would still pass while testing something slightly different.
- **The suite is not a pull request gate.** These cases go red when staging is
  down, like every other case here. That is by design and is not a reason to
  weaken them.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Is the cart's content part of this ticket — does it survive the rotation in case 2, and is it lost in case 3? | It is the first thing a reviewer will ask, and it is the difference between testing the token and testing the session. Widening it here is cheap; discovering it later is not. |
| OQ-2 | What proves a rotation happened: that the cookie value changed, or that `POST /api/auth/refresh` was called, or both? | The first is a fact about the outcome, the second about the route taken. Only the second tells case 2 apart from a silent re-registration, but it is also the more brittle of the two. |
| OQ-3 | Does case 1 assert the exact set of boot calls, or only that the guest was registered and both cookies exist? | Pinning the exact set makes an ordinary change to the boot sequence look like a break. Asserting too little makes the case say almost nothing. |
| OQ-4 | Do these cases extend `guest.live.spec.ts`, or go in a new spec with a new action module? | Three cases with shared setup and a new kind of assertion may not belong beside the browsing journeys. |
| OQ-5 | What upper bound does each case put on its own run time, given the sixty-second session, and should exceeding it fail loudly rather than quietly rotating? | A case that silently drifts past a minute stops testing what it claims to. A visible failure is better than a passing test that proves nothing. |
| OQ-6 | Is calling `/api/auth/me` from inside a spec acceptable, or does the identity read belong behind an action? | Every existing spec reads the page, never an internal route. This is a precedent for the suite, not just a choice for this ticket. |
| OQ-7 | Should case 3 also assert that no session-expired prompt appears? | The same code path prompts a seller and a phone-verified shopper. Proving a guest stays silent is what stops a future change from putting a prompt in front of every guest. |
| OQ-8 | Does `docs/testing/E2E_SCENARIOS.md` get a row per case, continuing the `GUEST-nn` numbering? | The file's stated rule is a row per case. These are guest cases, so they either continue that list or start a named group of their own. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
