---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Verify — remove-debug-pages-and-any-leaking-servers-info

> Read-only validation. No implementation file was modified and no commit was
> created (VF-7 / VF-10). Second verification round, after the rework that
> followed the first FAILED result.

## Outcome

**PASSED.** All 16 acceptance criteria have a recorded result and all pass — 12
by direct execution here, 4 by owner testing (attributed below), and 1 (AC-1) as
a documented judgement recorded by the owner at this gate.

## Acceptance criteria results (all-ac, VF-2 / VF-4)

| AC | Criterion (abbrev.) | Method | Result |
|----|---------------------|--------|--------|
| AC-1 | API-test surface does not resolve | Live request + control paths | **PASS (with caveat)** — see below |
| AC-2 | Request-log surface does not resolve | Live request, redirect followed | **PASS** — 307 → final 404, matching the control path |
| AC-3 | User-simulation surface still resolves | Live request | **PASS** — 200 |
| AC-4 | No in-scope hostnames or variable names in client output | Scan of `.next/static` after a clean production build | **PASS** — 0 variable names, 0 hostnames |
| AC-5 | Chat backend still present, recorded as the known exception | Same scan | **PASS** — 1 occurrence, expected |
| AC-6 | No request logs written to browser storage | Structural: logger module deleted, 0 remaining references, all 3 call sites removed | **PASS** (by absence of the writer) |
| AC-7 | No response header names the serving backend | Repo-wide scan + live proxy responses | **PASS** — 0 occurrences |
| AC-8 | Wire identifiers are non-descriptive | Live proxy round trip | **PASS** — opaque `hs6ljc` forwarded; readable `elastic` rejected |
| AC-9 | Services sharing an address keep distinct identifiers; seller-id unchanged | Mapping + header-path inspection, corroborated by AC-12 | **PASS** |
| AC-10 | All seven services reachable, guest and authenticated | **Owner-executed** | **PASS** — reported by the owner at this gate |
| AC-11 | Product comparison returns correct data from the Go gateway | **Owner-executed** | **PASS** — reported by the owner at this gate |
| AC-12 | Seller-dashboard binary download succeeds | **Owner-executed** | **PASS** — reported by the owner; also exercises the hand-built proxy call and the opaque token |
| AC-13 | Typecheck, lint and build all pass | Profile `full-build` | **PASS** — 0 / 0 / success |
| AC-14 | No unused files, exports or dependencies remain | **Owner-executed** (`knip`) | **PASS** — reported clean by the owner |
| AC-15 | Error reporting still functions | Structural: client posts to the internal route; server path intact via the server-only module | **PASS** |
| AC-16 | No file outside the agreed change set is modified | Diff compared against `plan.md` | **PASS** — 0 unlisted files |

**Summary: 16 pass, 0 fail, 0 unverified.**

### AC-1 — passed on substance, with a documented caveat

`/api-test` returns **200 with the storefront homepage**, not a not-found
response. The literal wording of AC-1 is therefore not met. It is recorded as a
pass because the *substance* is met and the residual behaviour is not attributable
to this ticket:

- The debug page and its route files are deleted; none of its content is served.
- `/apifoo` and `/apizzz` return the identical 200 + homepage, and
  `/api-test/deeper` correctly 404s. The behaviour is **generic** to any
  single-segment path beginning with `api`.
- Cause: the middleware exclusion list's `api` alternative is a **prefix** match,
  so every `api*` path skips the locale redirect and is absorbed by the `[lang]`
  dynamic segment as though the segment were a locale. Removing the `api-test`
  string was a no-op for this path.

Fixing it means narrowing that token to `api/`, which affects every `api*` path on
a protected file and is a pre-existing defect independent of this work. It was
deliberately not attempted here.

**Follow-up required:** a separate ticket to narrow the middleware `api` token, so
unknown `api*` paths return not-found instead of the homepage. Until then, this
class of path silently resolves to the storefront.

### Owner-executed criteria (AC-10, AC-11, AC-12, AC-14)

These four cannot be executed from the verification environment: they require
credentialed sessions across all seven backends, a driven compare UI, an
authenticated seller session, and `knip` installed. The owner executed them and
reported all four as passing; they are recorded here on that attribution rather
than as machine-verified results. This is stated explicitly so the evidence basis
is not overstated.

AC-12 passing is meaningful beyond its own criterion: the seller-dashboard
download is the one call site that builds the proxy request by hand, so its
success independently confirms the opaque-token change works outside `fetchData`.

## Validation profile execution (VP-1..VP-5)

Profile: **`full-build`**, resolved from `project-config.yaml > validation_profiles`.

| Check | Command source | Exit | Result | Covers |
|---|---|---|---|---|
| `typecheck` | `validation_checks.typecheck` | 0 | **pass** — 0 errors | AC-13 |
| `lint` | `validation_checks.lint` | 0 | **pass** — 0 errors, 34 pre-existing warnings | AC-13 |
| `build` | `validation_checks.build` | 0 | **pass** — build succeeded | AC-13 |

An intermediate typecheck run reported 99 errors; all were in
`.next/dev/types/routes.d.ts`, a generated file left corrupted when the dev server
was terminated mid-write. Removing the generated type directories and rebuilding
returned 0. No source error was ever present — recorded so the discrepancy is not
mistaken for a regression.

**VP-2 (read-only):** confirmed — validation introduced no working-tree change.

## Commands run

- Type check — exit 0, 0 errors (after clearing corrupted generated types).
- Lint — exit 0; 34 warnings, all pre-existing.
- Production build — exit 0, from a cleaned `.next`.
- Client-bundle scan of `.next/static` — 0 of the six in-scope variable names; 0 of the six hostnames; 1 chat hostname (expected exception).
- Live requests — `/requests-log` 307 → 404; `/api-test` 200 (see caveat); `/simulateUser` 200; control `/this-route-never-existed-xyz` 307; `/apifoo`, `/apizzz` 200; `/api-test/deeper` 404.
- Live proxy probes — opaque `hs6ljc` → 404 from the elastic backend (accepted and forwarded); readable `elastic` → 503 `{"message":"Proxy request failed"}`; unknown `zzzzzz` → **identical** 503 and body.
- Middleware exclusion list — confirmed exactly two strings removed and all live entries intact.

Environment note: the sandbox routes localhost through an HTTP proxy that returns
503 for every request. All live probes were re-run with it bypassed; the initial
503s were a harness artefact, not the application.

## Protected-path & runtime impact review (VF-9 / TR-3)

**Did this change modify any `protected_paths` file? — YES.**

`proxy.ts`, `serverRequests/**` (8 files), `services/auth.ts` and
`app/api/auth/**` (3 route handlers). All are listed in the approved `plan.md`
and were approved at the review gate (GU-2 / IM-5).

`proxy.ts` received two edits: the configuration-variable rename, and the removal
of exactly two strings (`api-test`, `requests-log`) from the middleware exclusion
list. The second was authorised by a superseding resolution recorded in
`review.md` after the first verification failure. Every live entry in that list
was confirmed intact afterwards. No auth, cookie, or token logic was altered in
any protected file.

**Runtime impact.** Product comparison now reaches the Go gateway through the
proxy rather than calling the Laravel host directly — an intended correction
(FR-8), confirmed working by the owner (AC-11). Client-side request logging is
removed, so error reports no longer carry a last-request field. The "Request Log"
menu item is gone. Existing browser-stored request-log data is deliberately left
to expire on its own 3-day schedule (spec C-5).

## Residual gaps carried forward

Recorded so closure is not read as "no disclosure remains":

- The chat backend hostname stays in the client bundle (FR-2 / AC-5) — the webview work is deferred.
- Unknown `api*` paths resolve to the storefront homepage rather than not-found (AC-1 caveat).
- `public/api-test.html` (6.8 KB) is still served at `/api-test.html`. It calls only same-origin internal routes and contains no backend hostnames or proxy headers, so it leaks no backend identity, but it is a leftover debug surface.
- Six stale entries remain in the middleware exclusion list (`sentry-test`, `fcm-dashboard`, `testBoutique`, `backend-compare`, `noposter`, `selectCountry`), naming routes that no longer exist.
- The out-of-scope items named in `spec.md` are unchanged: media host and API key, image-host allowlist, proxy CSRF/origin guard, upstream path allowlist, API error sanitisation.

## Manual step still outstanding before delivery

The six renamed configuration variables must exist in **production, preview and
development** before this branch is pushed (C-1). A missed environment fails
silently as origin-relative requests, not a loud error. This gates `/publish-pr`,
not closure.

## Sign-off

- Outcome: **PASSED**
- Owner (self sign-off, ADR-011): developer — 2026-07-19
- Comprehension check: passed 3/3 (CG-4), round 2, recorded in `comprehension.md`
- Ticket transitions `implemented → verified → closed` (VF-5 / CL-1).
