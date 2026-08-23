---
ticket: e2e-live-auth-session-proof
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-22
links:
  clickup:
  github:
---

# Research — e2e-live-auth-session-proof

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Make the browser suite prove that a real login writes a usable session, that
logout removes all of it, and that the session survives a page reload — so the
auth journey is closed before the money-path work starts.

## Relevant directories

- `tests/e2e/` — the browser suite. The two files this ticket touches are
  `auth.live.spec.ts` (one test today) and `actions/auth.ts`.
- `tests/e2e/actions/` — the action layer. `auth.ts` holds `attemptAuth`,
  `currentAuthScreen` and `verifyCookiesSet`; `nav.ts` holds `gotoAbout`, which
  the login test uses so a search outage cannot hide the auth widget.
- `tests/e2e/harness/` — `env.ts` (addresses and `envValue`), `session.ts`
  (`snapshotCredentials`, `credentialsHeld`, `credentialsChangedSince`,
  `spoilCredentials`, `recordAuthCalls`), `guard.ts`, `server.ts`, `health.ts`,
  `redact.ts`. `session.ts` already has most of the reading helpers this ticket
  needs; it was built for the guest-token specs.
- `utils/cookies/` — `cookie-manager.ts` holds `COOKIE_NAMES` and
  `HTTPONLY_COOKIE_NAMES`. It is the client-safe module (names only), so a spec
  can import from it.
- `utils/server/tokenManager.ts` — server side of the same thing:
  `SECURE_COOKIE_NAMES` and `deleteSecureCookie`.
- `app/api/auth/logout/` — the route that performs the logout.
- `components/Home/Menu.tsx` — where the visitor actually logs out.
- `docs/testing/` — `E2E_SCENARIOS.md` (every case has a row and an id),
  `E2E_TEST_DESIGN.md` (the rules the suite follows).

## Relevant config files

- `playwright.config.ts` — `testIdAttribute: "data-pw"`, `retries: 0`,
  `workers: 1`, `fullyParallel: false`, 120s test timeout, and the live/scripted
  split. The `live` project records **no trace** (a trace is the auth token in a
  file) but does record video and failure screenshots.
- `tests/e2e/fixtures.ts` — the shared `test` object. It skips every spec when no
  staging addresses are configured. **It sets no `storageState`,** so each spec
  gets a fresh browser context and carries no session in from another file.
- `tests/e2e/globalSetup.ts` / `globalTeardown.ts` — build and start the server
  around the run.
- `.env.development` / `.env.production` — untracked, both point at staging.
  `TEST_ACCOUNT_PHONE` and `TEST_ACCOUNT_OTP` come from here (or from CI
  secrets) and are read through `envValue`.
- `.github/workflows/test-e2e.yml` — the browser suite's own CI workflow. It is a
  **protected runtime path**; this ticket has no reason to change it.

## Possibly affected services

- **Core backend / gateway (`/auth/login`, `/auth/phone/send_otp`)** — a live
  login is a real OTP send and a real login against staging. Every extra login
  this ticket adds is real traffic and real rate-limit budget.
- **Chat, stories and wallet backends** — login fans out to five backends and
  writes about ten cookies. This is exactly the fan-out the ticket wants to make
  visible: a shopper can be signed in to the storefront and not to chat.
- **`/api/auth/logout` (own route)** — deletes every name in
  `SECURE_COOKIE_NAMES`, which is `[...HTTPONLY_COOKIE_NAMES]` (13 cookies:
  `MARKET-TOKEN`, `MARKET-REFRESH-TOKEN`, `DEVICE-TOKEN`, `CHAT-TOKEN`,
  `CHAT-REFRESH-TOKEN`, `STORIES-TOKEN`, `STORIES-REFRESH-TOKEN`, `rdb_at`,
  `USER_ID_HASH`, `User-Data`, `USER-CHAT`, `USER-STORIES`, `WALLET_USER`), then
  **sets `LOGOUT-GUARD`** and defers an FCM detach with `after()`.
- **`proxy.ts`** — clears `LOGOUT-GUARD` on the first navigation after logout.
  Read-only for this ticket, but it decides what the cookie jar looks like at
  the moment a test inspects it.
- **Redis OTP limiter** — cooldowns are real on staging (`otpRateLimit`), which
  is why the suite avoids logging in more than it must.

Findings that already answer part of the ticket:

- **The logout control has a hook.** `components/Home/Menu.tsx:297` renders
  `<MenuItem dataCy="logout">`, and `MenuItem` puts `dataCy` straight into
  `data-pw` (lines 70 and 82). So `page.getByTestId("logout")` works today and no
  app change is needed for the button itself. The **menu trigger** that opens it
  still has to be checked.
- **Logout reloads the page.** `handleLogout` (`Menu.tsx:100`) calls
  `clearAllUserData()`, resets the store, and finishes with
  `window.location.reload()` at line 123.
- **The item is conditional.** `shouldShowLogout()` (`Menu.tsx:126`) hides it for
  an account whose phone is missing or `"0"`, so it appears for a signed-in
  shopper and not for a plain guest.
- **`User-Data` is HttpOnly** (it is in `HTTPONLY_COOKIE_NAMES`), which is why
  page JavaScript cannot read it — but Playwright's `context.cookies()` can, and
  that is how the existing name assertions already work. The commented-out
  payload assertion in `verifyCookiesSet` is therefore implementable.
- **No shared session between specs.** `fixtures.ts` sets no `storageState`, so
  today every live auth spec would have to log in for itself.

## Test / validation commands available

Listed, not run.

- `pnpm e2e:health` — asks whether staging is answering before anything is built.
- `pnpm e2e:preflight` — the pre-run checks (addresses, identity, guards).
- `pnpm test:e2e:live` — build, start, and run the `live` project.
- `pnpm e2e:report` — open the last HTML report (local only).
- `pnpm test:run` — the unit suite; unaffected by this ticket but the CI gate.
- `pnpm lint` — ESLint, including the i18n rules.
- `npx next typegen && npx tsc --noEmit` — types. `next typegen` first, because
  `next-env.d.ts` is gitignored.

## Risks and unknowns

- **`pnpm e2e:health` fails from this machine, and Elasticsearch is not the
  reason.** The owner confirms the node is serving. Probing it from here shows
  why the two disagree: TCP connects to `:9200` in 184 ms, then **neither** a TLS
  request **nor** a plain-HTTP request gets any answer, and the connection is
  reset (`ECONNRESET` after ~15–20 s). Something accepts the connection and drops
  the traffic — the signature of a network allowlist in front of the node, not of
  a node that is down. A wrong scheme is ruled out, because plain HTTP fails the
  same way.
  This matters beyond one developer's machine: `probeStaging` is a **direct**
  request to the Elasticsearch node, and `cli.ts` calls it from both `preflight`
  and `run` (`checkStaging`), so any runner that is not on that allowlist skips
  the whole live suite and reports it as a backend outage. Impact: this ticket
  cannot be verified from a machine that cannot reach `:9200` directly, however
  healthy staging is.
- **Every live login is a real OTP.** Redis cooldowns are real on staging. Three
  separate specs that each log in could rate-limit the run and produce a red
  result that says nothing about the code. This is the main design constraint.
- **`retries: 0` on purpose.** A flaky wait around the post-logout reload turns
  into a red run, not a retry. Any wait this ticket adds must key on a state, not
  a timeout.
- **Asserting an empty jar is easy to get wrong.** After logout the jar is not
  empty: `LOGOUT-GUARD` is set on purpose, and the locale cookies (`country`,
  `lang`, `language`) are not part of the auth session. "Every cookie" has to
  mean the auth list, not the whole jar.
- **The reload assertion can pass while the session is broken.** Cookies
  surviving a reload is not the same as the app still treating the visitor as
  signed in.
- **Artifacts show the phone number.** The live project records video, and the
  login screen carries `TEST_ACCOUNT_PHONE`. Already handled by the workflow's
  encryption step; the ticket must not weaken it or add a trace.
- **`verifyCookiesSet` is written in a different style** from the rest of the
  action layer (no doc comment, tight spacing, an assertion left commented). Any
  edit should leave it matching the file it lives in.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | How many real logins may this ticket spend per run, and how are the three cases arranged to stay inside that — one serial spec sharing a context, a saved `storageState`, or one login per case? | Decides the whole shape of the change. Three independent logins is three OTP sends per run against a live limiter. |
| OQ-2 | Is `TEST_ACCOUNT_PHONE` on the staging `OTP_TEST_PHONES` allowlist, so repeated sends skip the limiter? | If it is, OQ-1 is a cost question only. If it is not, OQ-1 is a correctness question. |
| OQ-3 | Which list defines "every cookie" for the logout assertion — `HTTPONLY_COOKIE_NAMES` imported from `utils/cookies/cookie-manager`, or a list written out in the test? | Importing keeps the test true when a cookie is added later; writing it out makes the test say what it means without following an import. |
| OQ-4 | Is the logout assertion made before or after the post-logout reload, and is `LOGOUT-GUARD` expected to be present, absent, or ignored at that moment? | `Menu.tsx:123` reloads and `proxy.ts` clears the guard on that navigation, so the answer changes what the jar looks like. |
| OQ-5 | What proves "the session survives a reload" — the auth cookies still being present, or an authenticated signal from the app (the account's id via `whoAmI`, or the logout item still being offered)? | Cookie presence alone would pass even if the app can no longer use the session, which is the failure worth catching. |
| OQ-6 | Why was the `User-Data` id assertion commented out in commit `14d2c531`, and does this account's payload actually carry `id`? | If the payload legitimately has no `id`, the acceptance criterion must name a field that exists instead. |
| OQ-7 | Does this ticket add a `logout` entry (and a menu-open action) to `selectors.ts` / `actions/auth.ts`, and does the **menu trigger** need a new `data-pw` in app code? | The logout item already has `data-pw="logout"`; the control that opens the menu has not been checked, and it decides whether app code is touched at all. |
| OQ-8 | Do the new cases continue the `GUEST-nn` numbering in `E2E_SCENARIOS.md`, or start an `AUTH-nn` range? | The document says a row is added for every case; the ids are how a failure is discussed. Signed-in cases are not guest journeys. |
| OQ-9 | Which machine verifies this ticket, and can it reach the Elasticsearch node on `:9200` directly? | `preflight` and `run` both gate on that one probe, so a runner outside the node's allowlist skips the suite and calls it an outage. If the verifying machine is outside it, the ticket needs a verification route that does not depend on the probe. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
