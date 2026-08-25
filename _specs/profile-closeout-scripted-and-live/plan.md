---
ticket: profile-closeout-scripted-and-live
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer
updated: 2026-08-25
links:
  clickup:
  github:
---

# Plan — profile-closeout-scripted-and-live

> **Revision 6, and the last one.** Revisions 1-5 each failed review because the
> plan's picture of the app's own network calls was incomplete — a thing reading
> cannot fix. The work item was blocked (`BLK-RUNTIME-FACTS-01`) and a throwaway
> spike was run. `spike-runtime-facts.md` holds what it measured. This revision is
> written on those measurements plus the round-5 findings, and the one remaining
> unknown is handed to `implement` as its first output rather than guessed at
> again.

## Approach

Add one new scripted spec carrying the six failure branches, and extend the
existing live spec with the three remaining screens. The scripted spec runs
**closed** (C-8): a call that is not faked and not allowed fails the case and
names the route, instead of reaching staging.

**The mechanism is measured, not assumed** (`spike-runtime-facts.md`, Playwright
1.62.1):

- Both faking helpers change their no-match path from `route.continue()` to
  `route.fallback()`. `continue()` goes to the network and ends the chain;
  `fallback()` passes the call down. `actions/mock.ts` is the only file in
  `tests/e2e/` that registers route handlers, so `SCRIPT-01..05` have no lower
  handler and `fallback()` behaves exactly as `continue()` did for them.
- **The two helpers compose on one page.** Four review rounds recorded this as
  impossible; the spike ran it. Register the **map first, the sequence second**:
  the last-registered handler is tried first, and falls back to the earlier one.
  `SCRIPT-10` needs this.
- **`fallback()` crosses from a page handler down to a context handler.** This is
  the single behaviour the guard rests on, and it works. So the guard is a
  **`context.route`** — and *that*, not registration order, is what makes every
  page-level fake take precedence over it. A `page.route` outranks a
  `context.route` by level. Do not "fix" this later by moving the guard to
  `page.route`; that would break it.
- **Map keys are matched by substring.** The spike's own first run proved the
  trap: a probe named `unknown` was claimed by the key `known`. The three
  save-leg keys must be chosen so that none is a substring of another.

**The guard's policy** — round 5 showed a plain read-versus-write rule is unsafe
here, so it has two named lists rather than one rule:

- A call that only reads passes. **Except** these, which change things using GET
  and are blocked: `/api/auth/login` (spends the one-time code and writes the
  whole cookie set, `app/api/auth/login/route.ts:67`), `/auth/phone/verify_otp`
  (`services/auth.ts:281-289`), `services/order.ts:729,857,943`, and chat's
  `channels/{id}/received` (`services/chat.ts:55`).
- A call that changes something is blocked. **Except** `/api/auth/me` (a POST that
  only reads — blocking it makes `CheckLogin` register a guest) and
  `/api/auth/update-user`, which the app POSTs after **every** leg and **every
  rollback leg** (`services/auth.ts:710,743,791,819,898,927`). Blocking that one
  would fail four cases naming it instead of the branch they test.
- A proxied call whose verb cannot be read is **blocked and recorded**, never
  passed.

The second rule is C-9: a scripted case never hands its session on. Round 5 showed
that alone is not enough, because renewal is server-side and single-use, and
**all three legs can reach it** — `handleUnauthorized` calls `RefreshSession` for
chat (`utils/fetchData.ts:353-361`) and stories (`:369-377`), not only core. So
`/api/auth/refresh` is faked in every case that induces a 401, and every other
case is covered by the guard's default block.

Cases that refuse a leg **fake all three legs** — core carries the branch under
test, stories and chat answer 200 — so nothing real is written and no undo is
needed.

## Steps

**Commit A — the target check**

1. Read the two configured media values first — their **hosts and their schemes**
   (`guard.ts:72-78` hard-stops on `http:` or a missing scheme) — and add every
   host they resolve to. Then add `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` and
   `NEXT_PUBLIC_BASE_MEDIA_URL` to `BACKEND_ADDRESS_KEYS`, require `https:` for
   both, and add `hasMedia()` covering `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`,
   `NEXT_PUBLIC_MEDIA_API_KEY` **and** `NEXT_PUBLIC_BASE_MEDIA_URL`, since
   `PROF-05` reads the picture back through the third.

**Commit B — the session lift**

2. Lift five helpers into `harness/liveSession.ts`, taking the state path **and
   the owning case's name** as parameters — the two existing copies differ
   precisely in whom they blame, and the scripted openers must name `SCRIPT-06`.
   Export the three state paths from there. Repoint both live specs in the same
   commit. Keep video recording for hand-built contexts (see step 12).
3. `PROF-04` gains `handOnSession()` and loses `forgetSavedSession()`;
   `globalTeardown` removes the whole `tests/e2e/.auth/` directory. Update the
   stale file-header comment at `profile.live.spec.ts:75-76`.
4. **Measure.** Take whole-job-minus-journeys minutes and the browser-cache hit
   from a **recent nightly's step timings** first; only run a fresh
   `workflow_dispatch` if Commit B is expected to move journey minutes, and then
   outside the 02:30 UTC window. `PROF-` and `AUTH-` cases must be at their
   current result — this commit is neutral and is reported on its own.

**Commit C — the harness and the faking layer**

5. Change both helpers' no-match path to `route.fallback()`.
6. Add the guard: a **`context.route`** over `/api/proxy`, `/api/auth/**`,
   `**/api/ticket` and the media host, enforcing the policy above. It **aborts and
   records**; the assertion naming every blocked route runs at the **end of the
   case** — a throw inside a route handler is swallowed, and a mid-flight abort
   pushes the app down a different path. Same-origin writes knowingly left outside
   its scope, because none is reachable from the profile screens:
   `/api/fcm/settings`, `/api/subscribe`, `/api/seller/comments*`.
7. Give both helpers a recorder: `mockBackend` reports **which map keys matched**,
   `mockBackendSequence` **how many responses were consumed**. Map keys only,
   never targets — the faked verify's `x-proxy-url` carries the live one-time code
   in its query string. Add the media (`**/gated/upload`) and ticket
   (`**/api/ticket`) patterns to `mockBackend`, with CORS headers on the fulfilled
   media response and an answer for the preflight.
8. Extend `harness/profileWrites.ts`: `carriedExpected: boolean` on the settled
   write, with the expected value as an **optional third argument**; the body read
   inside the existing `if (!leg) return` guard and the comparison inside the
   listener, so **only the boolean survives**; **a second store for "asked"** fed
   by the `request` listener and kept apart from the response-fed status list —
   sharing one store would double `attempts` and turn `PROF-02..04` red;
   `reset()` clears **both**; the header note corrected.
9. Add the named answers to `scenarios/index.ts`, the locators to `selectors.ts`,
   the picture/address/undo actions to `actions/profile.ts`, and the `id_token`
   pattern to `redact.ts` — masker **and** `containsSecret()`.

**Commit D — the cases, the config and the documents**

10. Write the seven scripted cases as tabled below. **Before the branch cases are
    trusted, run one report-only pass and record the call set it names** — that is
    the completeness the spike could not reach without a live run, and it lands in
    `implement.md` as evidence. If it names a route not covered above, the policy
    gains it there, with the reason.
11. Write the three live cases, each registering its undo when it creates
    something, each with `test.setTimeout(180_000)`. `PROF-05` skips on
    `hasMedia()`. The probe media object carries a fixed prefix.
12. `test.describe.configure({ timeout: 90_000 })` on the **new spec file** — not
    60s, because each faked case still does two real page loads and
    `navigationTimeout` alone is 45s, so 60s would kill a case with an unnamed
    timeout instead of naming the step (NFR-1, `AC-13`); and not the project, so
    `SCRIPT-01..05` keep their budget. `SCRIPT-06` and `SCRIPT-12` get 180s.
    `trace: "off"` on the new spec file, **and `recordVideo` passed explicitly for
    the scripted hand-built contexts** — otherwise trace-off plus
    `use.video === "on"` leaves a red scripted case with no artifact at all, and a
    re-run costs another real code. `serviceWorkers: "block"` on the `scripted`
    project. Scripted leg timeout **10s** (the legs are faked and answer at once).
13. Update `docs/testing/E2E_SCENARIOS.md` (ten rows, 54 → **64**, `PROF-01..04`
    line references re-pointed, **a new section with its own preamble**, and the
    `SCRIPT-` summary row corrected — it says "signs in: no, writes: no" and that
    these specs may upload traces), `tests/e2e/README.md` (run cost as a range for
    the whole run; rule 7's exception and its stale sentence; accepted drift for
    the stored media object; the analytics decision below), and
    `docs/testing/AUTH_CLOSEOUT_PLAN.md` (Item F delivered; **Item B "browser half
    delivered, E-2 still open"**; the Item F boundary with roadmap phase 15).

### The seven scripted cases, in order

Every case opens the file `SCRIPT-06` wrote, asserts it is still signed in
(naming `SCRIPT-06` when it is not), discards its own context (C-9), and asserts
its own fake was used (`AC-10`).

| # | Case | Fakes | Helper | Timeout |
|---|------|-------|--------|---------|
| 1 | `SCRIPT-06` — sign in | none | none | **180s.** Deletes any stale file, then `saveSession` before asserting. `maxAttempts: 2`. |
| 2 | `SCRIPT-07` — `AC-1` one leg refuses, rollback, told once | **all three legs** (core **500**, stories + chat 200), `/api/auth/refresh`, `/api/auth/update-user` | `mockBackend` | 90s |
| 3 | `SCRIPT-08` — `AC-2` no chat record | `/api/auth/me` (account's own values, only `chatUser` nulled, installed **before navigation**), **all three legs** 200, `/api/auth/refresh`, `/api/auth/update-user` | `mockBackend` | 90s |
| 4 | `SCRIPT-09` — `AC-3` upload refused | `**/api/ticket` **succeeds**, `**/gated/upload` refuses, `/api/auth/refresh` | `mockBackend` | 90s. Skips on `hasMedia()`. Asserts the shopper-visible message; never prints the upload URL or its headers. |
| 5 | `SCRIPT-10` — `AC-5` credential refused mid-save | core 401 **then** 200 (sequence); stories + chat 200, `/api/auth/refresh`, `/api/auth/update-user` (map) | **both — map registered first, sequence second** | 90s |
| 6 | `SCRIPT-11` — `AC-6` save and renewal both refused | all three legs, `/api/auth/refresh` answers eligible-but-not-refreshed, `/api/auth/expire` answers `{ expired: true, wasVerified: true }` | `mockBackend` | 90s |
| 7 | `SCRIPT-12` — `AC-4` phone change | verify, all three legs, `/api/auth/update-user` | `mockBackend` | **180s.** Runs last. Skips on `hasShopperB()`. |

Core **500** not 401 in `SCRIPT-07`, because a 401 starts credential recovery
instead of the rollback branch. `{ renewed: true }` would short-circuit
`SCRIPT-11` before `cancelAuth`. A refusing ticket in `SCRIPT-09` means the upload
is never attempted and `AC-10` fails for the wrong reason. Stories and chat share
`/api/v1/users/` and are told apart by service token and verb, so name the exact
map keys and expect a chat key to fake chat **reads** on that path too. Once
`SCRIPT-10`'s sequence is exhausted, a further core write falls back to the map —
which is why the map also holds a core 200. The spec-level skip is
`hasShopperA()`. `reset()` is called before each measured save in `SCRIPT-10`,
`PROF-04`, `PROF-05` and `PROF-07`.

### Analytics and error reporting — allowed to escape, deliberately

PostHog ships to same-origin `/ingest/**`, Google Analytics and Sentry go
cross-origin; none is in the guard's scope, and turning them off would mean
editing `instrumentation-client.ts` or `sentry.*.config.ts` — protected runtime
paths this ticket may not touch.

**The owner's decision is to let them run**, as closest to a real shopper's
browser. The cost is accepted and recorded here and in `README.md`, precisely:
`scrubRequestBody` redacts `id_token`, `otp` and tokens
(`utils/fetchData.ts:33-64`) but **not `phone`, `alternative_phone` or `email`**,
and the failed save's body carries all three — so **the shopper's phone number and
e-mail reach Sentry** on these cases, along with the deliberate 500s and 401s
appearing there as real errors. NFR-2 names phone and e-mail explicitly; this is
the one place the ticket knowingly does not meet it, by decision rather than by
oversight.

## Files to change

`tests/e2e/harness/liveSession.ts` (**new** — five helpers, path and case name as
parameters, the three state paths exported), `tests/e2e/harness/session.ts`
(**unchanged**, listed to record why the helpers did not go there),
`tests/e2e/profile.live.spec.ts`, `tests/e2e/auth.live.spec.ts`,
`tests/e2e/profile.scripted.spec.ts` (**new**), `tests/e2e/actions/mock.ts`
(`fallback()`, the guard, the recorders, the media and ticket patterns),
`tests/e2e/scenarios/index.ts`, `tests/e2e/actions/profile.ts`,
`tests/e2e/harness/profileWrites.ts`, `tests/e2e/selectors.ts`,
`tests/e2e/harness/env.ts`, `tests/e2e/harness/guard.ts`,
`tests/e2e/harness/redact.ts`, `tests/e2e/globalTeardown.ts`,
`playwright.config.ts` (**not** a protected runtime path),
`docs/testing/E2E_SCENARIOS.md`, `docs/testing/AUTH_CLOSEOUT_PLAN.md`,
`tests/e2e/README.md`.

**No application file changes. No protected runtime path is touched.**

`research.md:152-155` is **superseded** by step 8, not edited. `spec.md`'s C-4,
C-6, C-8 and C-9 were changed in the spec itself by the owner. **C-6 has one
stated exception:** `SCRIPT-01..05` also fake answers and keep their traces,
because they mint no real token; what covers the test phone in those traces is the
encrypted pack in `test-e2e.yml`, not the exception.

## Integration surface

- **Touched:** `harness/liveSession.ts` (new), `harness/guard.ts` +
  `harness/env.ts` (the pre-run check, before anything is built),
  `harness/profileWrites.ts` (used by `PROF-02..04`), `actions/mock.ts` (used by
  `SCRIPT-01..05`), `selectors.ts`, `actions/profile.ts`, `playwright.config.ts`,
  `globalTeardown.ts`.
- **Who else depends on them:** only `profile.live.spec.ts` and
  `auth.live.spec.ts` hold the session helpers and must be proved neutral in step
  4. `SCRIPT-01..05` are affected by **three** things, all additive or benign: the
  `fallback()` change (measured equivalent for them), the recorder (they await and
  ignore the return), and **`serviceWorkers: "block"`, which is project-level** —
  so those five must be confirmed at their current result in the same run that
  proves the guard.
- **`AC-10` is met for the new cases only.** `SCRIPT-01..05` are not retrofitted.
- **The media host.** Staging because **there is no production environment yet**.
  The comment beside the entry states the checkable claim: one shared media store,
  no staging twin, and the guard compares hostnames only — so it cannot tell a twin
  apart when one appears. Revisit when production exists.
- **Ordering:** Commit B is one change. Commit A before the first live upload.
  **The `fallback()` change and the guard land together** — the guard without it
  is inert, it without the guard is a no-op. The `AC-2` fake is installed before
  navigation. The scripted case order is a dependency. `live` is declared before
  `scripted`.
- **What breaks if this is wrong:** a mistake in the guard or the address list
  **stops the entire suite before it builds** — all 64 cases, which is why step 1
  reads the configured values first. A mistake in the session lift makes signed-in
  cases open as a guest, which reads as an app fault. A shared write store turns
  `PROF-02..04` red. A guard that aborts mid-flight changes the branch under test.
  A media fake without CORS makes `AC-3` pass on a CORS error.

## Validation strategy

- Validation profile: `logic-change`. Types, lint, and the 1499 unit tests
  untouched. None of it runs a browser.
- Against staging: each new case seen **passing** where the product works; each
  seen **failing first** where it asserts a branch, with the red-first runs
  **`--grep`-targeted** so only `SCRIPT-06` and `SCRIPT-12` spend a code; **the
  guard proved by one case whose unfaked write is seen blocked**; the existing 54
  at their current result, `AUTH-01` included.
- **Absence without dead wall-clock.** `AC-2` needs no window: the legs are written
  stories → chat → core, so once the core write is recorded the `asked` store is a
  zero-cost read — and being `request`-fed, an aborted chat write still counts.
  `AC-3` anchors on the failure message, runs 10-15s, and waits the three legs
  concurrently.
- **Wall-clock, corrected.** Five cases at 180s (`SCRIPT-06`, `SCRIPT-12`,
  `PROF-05..07`) and five at 90s (`SCRIPT-07..11`) sum to
  5 × 180 + 5 × 90 = 1350s = **22.5 minutes**, and `globalTimeout` covers
  `globalSetup`'s
  3-minute server start, so the usable budget is about **27 minutes, not 30**.
  That ceiling is only reached on a run that has already failed; step 4's measured
  journey minutes are what the decision turns on. `UpdateProfile`'s hardcoded
  1500 ms sleep per successful save is about 15s across the saving cases and is
  not staging latency.
  **`.github/workflows/test-e2e.yml` is protected**, so the job's 45 minutes are
  fixed. Any raise is capped at `45 − (install + preflight + browser + build +
  pack + upload) − 5`; on a realistic 10-12 minutes of overhead **that yields no
  raise**, so the expected outcome is that the suite must fit as it stands. If it
  does not, that is reported and the timeout work becomes its own work item — the
  lever named in advance is splitting the scripted spec into its own dispatchable
  run.

## Rollback

Four commits, revertable **in reverse order — D → C → B → A** — not
independently: `D` imports from `B` and calls `C`. Before `D` lands, `A` and `B`
are each neutral.

| Commit | Steps | Contents |
|---|---|---|
| **A** | 1 | `harness/guard.ts`, `harness/env.ts` |
| **B** | 2, 3, 4 | `harness/liveSession.ts`, both live specs, `PROF-04`, `globalTeardown.ts` |
| **C** | 5-9 | `actions/mock.ts`, `harness/profileWrites.ts`, `scenarios/index.ts`, `selectors.ts`, `actions/profile.ts`, `harness/redact.ts` |
| **D** | 10-13 | `profile.scripted.spec.ts`, `PROF-05..07`, `playwright.config.ts`, the three documents |

No application behaviour is involved.

## Answers to deferred questions

**OQ-8 — no**, the faked cases cannot reach the profile screen without a real
sign-in: the screen renders on the server from the auth cookie and interception
sees only the browser's calls (C-1). So `SCRIPT-06` signs in once, and every later
case opens that file and discards its own copy.

**`AC-4`'s number:** Shopper B's `TEST_ACCOUNT_PHONE_2`, skipped when
`hasShopperB()` is false, with the verify, all three legs and
`/api/auth/update-user` faked, running last. The backend will not move a number
between two existing accounts, so the destructive branch cannot happen.

**Why C-2 holds:** the send is a **Server Action** — a browser request to the page
URL, not to `/api/**`. That is why it is out of the guard's scope: a choice about
where the guard looks, not an impossibility. `AC-4` therefore spends one real code
purely to reach the PIN screen, deliberately.

**Run cost.** About **8** real codes per full run today; this ticket adds **2**, so
**10 sends**. The worst case is bounded by the case timeout rather than
`maxAttempts`, because `sendOtpWithRetry` sleeps the server cooldown between
attempts — but the eight existing sends still run at the **default
`maxAttempts: 5`**, so their ceiling is a function of that cooldown, which nobody
has measured. `README.md` records 10 best case, the measured cooldown, and the
resulting worst case — not a guessed number.

**Why `AC-5`'s probe field must be the name.** The rollback body is
`JSON.stringify(userProfile)` captured before the optimistic write, so a
per-run-unique name can never appear in it. The case also asserts before the save
that the account does not already carry the probe name. Swapping to size or gender
re-opens the identical-bodies hole and is not allowed.

## Plan ↔ requirement / criterion traceability

| Commit | Steps | Satisfies |
|---|---|---|
| A | 1 | AC-12 (FR-12), AC-15 (NFR-3) |
| B | 2, 3, 4 | AC-11 (FR-11); unblocks AC-7, AC-8, AC-9 |
| C | 5, 6 | **C-8**; AC-1..AC-6 |
| C | 7, 8, 9 | AC-1..AC-6, **AC-10**, NFR-2 |
| D | 10, 12 | AC-1..AC-6, AC-10, AC-13, AC-15, **C-9** |
| D | 11 | AC-7, AC-8, AC-9, AC-13, AC-15 |
| D | 13 | AC-14 |

No `OQ-n` is left open.

## Out of scope

Any application code change; any protected runtime path. Retrofitting the guard or
`AC-10` onto `SCRIPT-01..05`. Item E's second unit guard. A sweeper for orphaned
media objects. Any wider `guard.ts` rewrite beyond the media keys' `https:` check.
Editing `research.md`. The `NextLink` accessible-name defect — `PROF-06` finds the
link by address. The unreachable rollback branch on the core leg. The two remaining
findings on the one-time-code send path. Proving that a phone change is accepted.
`AUTH-01`'s wallet failure, which stays red. Renaming the misspelled test hooks in
the address markup.
