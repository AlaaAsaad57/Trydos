---
ticket: unit-tests-api-auth-routes
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Implement — unit-tests-api-auth-routes

> Applied only what `plan.md` declares. No commit and no push — `/publish-pr`
> owns the single publishable commit.

## Changes prepared

Ten new test files, all on the `ticket/unit-tests-api-auth-routes` branch as
uncommitted working-tree edits. **No production file was touched**, and no
existing test, mock or configuration file was edited (AC-38).

| File | Criteria | Tests |
|---|---|---|
| `tests/app/api/auth/logout/route.test.ts` | AC-18..AC-20, AC-36 | 15 |
| `tests/app/api/auth/clear-tokens/route.test.ts` | AC-21, AC-22 | 10 |
| `tests/app/api/auth/refresh/route.test.ts` | AC-9..AC-12 | 19 |
| `tests/app/api/auth/expire/route.test.ts` | AC-13..AC-17, AC-36 | 14 |
| `tests/app/api/auth/register-device/route.test.ts` | AC-23..AC-26, AC-36 | 10 |
| `tests/app/api/auth/me/route.test.ts` | AC-27, AC-36 | 5 |
| `tests/app/api/auth/wallet-token/route.test.ts` | AC-28 | 3 |
| `tests/app/api/auth/update-user/route.test.ts` | AC-29, AC-30, AC-36 | 10 |
| `tests/app/api/auth/login/route.test.ts` | AC-1..AC-8, AC-36 | 30 |
| `tests/app/api/proxy/route.test.ts` | AC-31..AC-36 | 33 |

**149 tests.** The suite is 1,055 → 1,204.

Binding follow-ups from `review.md` that shaped the code:

1. **The storefront fixtures carry a path** (`https://core.invalid/api/v1`,
   `https://gateway.invalid/api/v1`). Without it AC-33's guard collapses to
   "starts with a slash" and cannot be demonstrated — a test in
   `tests/app/api/proxy/route.test.ts` asserts the fixtures still have a path, so
   the criterion cannot be quietly disarmed later.
2. **The service header carries the opaque wire token**, produced through the
   app's own mapping (`utils/serviceTokens`). Sending a readable name would land
   every proxy test on the unknown-service refusal and pass for the wrong reason.
3. **All eight addresses are stubbed per file**, role-named, mutually distinct
   and unresolvable; each file asserts they are distinct, so a copy-paste
   duplicate fails loudly.
4. **Refusals assert exact status and body**, never the call count alone, so a
   missing address cannot masquerade as a working guard.

## Findings

Every one pins current behaviour. No route was changed (AC-38).

**F-1 — AC-20: the deferred detach cannot be exercised outside a request scope.**
The logout route hands its push-detach to the framework's after-response helper.
That helper needs a real request scope; a test calls the handler directly, so the
hand-off throws and the route's own catch reports a failed logout. That 500 is
the harness meeting a framework boundary, not user-facing behaviour, so it is
**not** asserted as behaviour. The ordering half of AC-20 *is* proven, indirectly
but soundly: preparation reads the chat credential, so if it ran after the
deletions it would always come back empty — and it only comes back empty when the
chat credential was absent at entry. **AC-20 partially satisfied.**

**F-2 — AC-34: the unknown-service refusal is still tellable apart (the
enumeration oracle).** The allow-list refusal sends `Cache-Control: no-store`
and the ordinary failure does not, so the pair can be used to discover which
service names are real. Status and body are identical; the header is not. The
test pins that difference **green**, with the reason in a comment, rather than
being written as a failing test — a red test here would block every pull request
on the base branch and contradict the spec's own requirement that the suite keeps
passing. **AC-34 NOT satisfied — finding raised, follow-up ticket required
(`proxy-service-name-enumeration`).** Note for that ticket: the header alone is
not the whole channel, because the allow-list path returns before any upstream
call, so a timing difference remains.

**F-3 — AC-32: an escaped host-escape survives the decoding header.** With
`x-need-decode: true`, `/%2F%2Fevil.tld/x` is not refused: the decode the route
performs leaves the escaped slashes escaped, so neither guard fires. It stays on
the intended host, so nothing leaves the machine — but it is not refused, and a
refusal is what AC-32 asks for. Pinned as a finding, not rewritten green around
the bypass. **AC-32 satisfied for the four direct forms, with this gap
recorded.**

**F-4 — AC-31: one decode pass is not enough.** A doubly-escaped path
(`/auth/phone/send%255Fotp`) is not refused and is forwarded. The block matches
on the once-decoded path, so a second layer of escaping passes it. **AC-31
satisfied for the direct and singly-escaped forms, with this gap recorded.**

**F-5 — step 9 cross-check: a shared test stand-in does not match reality.**
`makeCookieNamesMock` in `tests/mocks/authGraph.ts` returns values that differ
from the real constants:

| Constant | Real value | Stand-in value |
|---|---|---|
| `USER_DATA` | `User-Data` | `User-Data` — agrees |
| `USER_CHAT` | `USER-CHAT` | `User-Chat` |
| `USER_STORIES` | `USER-STORIES` | `User-Stories` |
| `WALLET_USER` | `WALLET_USER` | `Wallet-User` |

No production defect: the client and the route both use the same constant, so the
names always agree at run time. But the client-side tests that use this stand-in
assert against names that do not exist, which means they could not catch a real
mismatch — for example if the route's allow-list were ever rewritten as literal
strings. Not fixed here: `tests/mocks/authGraph.ts` is not in this ticket's
declared files, and editing it would breach the no-silent-edits rule.

## Step 9 — cross-check against the client-side tests

One line per route the four client files actually assert. Bounded as the plan
requires; the remaining routes are not asserted by those files, so there is no
contract to compare.

| Route | Result |
|---|---|
| `login` | No divergence. The client only drives the 401-retry path against this address; no body contract to disagree with. |
| `refresh` | No divergence. The client sends `{}` for the retired proactive path and `{url, server}` for a real failure — exactly the two shapes AC-11 and AC-10 pin. |
| `expire` | No divergence. The client sends the country and language headers this route reads for guest registration. |
| `update-user` | No divergence **in production** — both sides use the same constants. See F-5: the client test's *fixture* values do not match the real ones. |
| `clear-tokens` | No divergence. The per-service sets the client sends (chat pair, stories pair, comments hash, wallet credential) are all on the route's allowed list. |
| `me`, `wallet-token`, `logout`, `register-device`, `proxy` | Not asserted by the four client files — no contract to compare. |

## Deviations from plan

**D-1 — the renewal helper is stood in for two files.** The plan has it running
for real everywhere. In `refresh` and `expire` it is stood in, because those two
routes' criteria are about *which branch is taken* for each outcome, and driving
all five outcomes through the real helper would mean rebuilding the cookie and
network states its own test file already covers — re-proving an earlier ticket.
No cookie assertion is weakened: the credential helper still runs for real, so
every cookie name and option asserted is the real one.

**D-2 — AC-18's literal list is twelve literals plus one named constant.** The
thirteenth name is a deliberately unreadable generated value; pinning 120
characters of gibberish would add nothing the canary does not already give. The
canary asserts the shared list has thirteen entries and the same members, which
is what catches a credential added to neither the cleanup path nor this file.

**D-3 — the two follow-up tickets were not created here.** Creating another
ticket's workspace would mean writing files this plan does not declare, which the
no-silent-edits rule forbids. They must be opened with `/wf:start-ticket` before
this branch is published:
- `auth-simulate-route-gating` — the cookie-forging route, reachable and
  un-gated today.
- `proxy-service-name-enumeration` — F-2 above; the id belongs in AC-34's comment,
  which currently names the intended slug.

**D-4 — AC-36 is asserted in seven files, not the four the plan lists.** The rule
the plan states is "assert where the route composes its own text", and `expire`,
`me` and `update-user` compose theirs too. A superset, so no criterion loses
coverage.

**D-5 — the login failure matrix is capped**, as the plan requires: four single
sub-service failures plus one case with more than one failing at once. The full
sixteen-way cross-product is not written.

## Validation run

Profile: `logic-change`.

| Check | Result |
|---|---|
| lint | **pass** — 0 errors. 39 warnings, all pre-existing and untouched; the gate is errors-only. |
| typecheck | **pass** — clean after `next typegen`. |
| unit tests | **pass** — 1,204 of 1,204, including the 149 added here. |

**Cost.** Measured with the coverage command, whole suite, before and after (the
new files were moved aside for the baseline rather than filtered, because the
filter flag was silently ignored):

| | Tests | Duration | Statements | Lines |
|---|---|---|---|---|
| before | 1,055 | 53.35 s | 8.76 % | 8.80 % |
| after | 1,204 | 53.85 s | 9.65 % | 9.74 % |

**Delta: +0.5 s for 149 tests** — far below the 20-second threshold, so no
follow-up ticket is raised. A single before/after pair was enough precisely
because the delta is nowhere near the threshold; the three-run median was not
needed. This matches the expectation that these files carry no browser-like
environment: the "+34 % files" headline overstated the cost badly, and coverage
rose about nine tenths of a point on statements and lines.
