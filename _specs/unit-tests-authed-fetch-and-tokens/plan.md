---
ticket: unit-tests-authed-fetch-and-tokens
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Plan — unit-tests-authed-fetch-and-tokens

> Decide the approach before changing code. Plan only — no implementation here.

**Revision 2.** Rewritten to address the eight Required Follow-up Actions in
`review.md`. The approach is unchanged; four decisions inside it were wrong and
are corrected. Each follow-up is marked **FU-n** where it is answered.

## Approach

Test each file from the outside, at the seam the real code already has, and fake
only the framework's request store, the network, and the failure reporter. The
request-store stand-in is extended so it accepts the object form of a write,
records the options, resets between tests, and can be told to refuse writes —
without that, several criteria cannot be expressed at all.

Chosen over replacing the inner helpers everywhere: that would stop the code
under test from running, which is the mistake the fake network exists to avoid.
Three collaborators are deliberately stood in — the refresh exchange (it belongs
to a later ticket, OQ-3), the failure reporter (it reaches Sentry and fires its
own outbound request, FU-2), and nothing else.

Where the code proves untestable or wrong, the test pins today's behaviour, says
so in words, and the defect goes into the implementation record (AC-20).

## Steps

1. **Extend the request-store stand-in (FU-7).** Accept a write passed as a
   single object; record every option written so a test can read it back; allow a
   mode where any write throws; add a reset that clears the jar and the recorded
   calls between tests, in the same shape as the resets the shared setup file
   already uses for the route and the cache. Keep the existing two-argument form
   working. Nothing else.
2. **Cover the successful path and the identity header** — a call with a stored
   token, and a call with none (AC-1, AC-2).
3. **Cover the five rejection outcomes, one test each** (AC-3..AC-8), asserting
   how many times each collaborator was called, not only what came back: logout
   in flight, writes refused, refresh present, verified shopper without refresh,
   guest without refresh. The token module is replaced **partially**, keeping its
   real options object, so the cookie-shape assertions are about the real
   constants and not about a stand-in's own values (FU-7).
4. **Cover the loop guards** — a rejection on the retry ends the flow, and a
   failed guest creation leaves every existing cookie untouched (AC-9, AC-10).
5. **Cover the transport layer** (AC-11) — temporary statuses and network errors
   retried to the limit then reported, a permanent status returned at once with
   no retry, and the failure report carrying status, address and a length-bounded
   body. The report is read through the stand-in for the reporter (FU-2, FU-3).
   Delay values are asserted by watching the delay function, not by advancing a
   simulated clock (FU-5).
6. **Cover the cookie contract** — the single auth cookie, the legacy cookie that
   is never read or written, the unreadable-by-browser set, and each cookie's
   lifetime, same-site rule and path (AC-13, AC-14, and the fixed half of AC-15).
7. **Cover the environment-dependent half of AC-15 (FU-4)** by discarding the
   loaded modules and importing them again with the environment set to
   production, and with the token lifetime override set explicitly so the
   48-hour assertion does not depend on whatever the ambient environment holds.
   Both branches are asserted, so deleting the production branch fails the test.
8. **Cover credential lookup, verified detection and routing** (AC-16..AC-18) —
   the right credential per service, the six phone values that are not verified,
   failure treated as not verified, and role-based routing including query
   strings and trailing dynamic segments. Routing is asserted on the **resolved
   address**, never on the debug log, so the forbidden backend-technology naming
   is not copied into new files (FU-1).
9. **Cover the outward-facing cleaners** (AC-19) — profile data stripped of
   tokens and flagged private fields, and credential masking including the
   short-value case.
10. **Write up every finding** — location, what the code does now, what was
    expected — in the implementation record, and mark each pinned test as pinning
    behaviour that is wrong (AC-20, FU-6).

## Files to change

- `tests/mocks/nextHeaders.ts` — extend the request-store stand-in: object form
  of a write, options recorded, a refuse-writes mode, and a per-test reset.
  Additive only (OQ-4, FU-7).
- `tests/serverRequests/HandleAuthedFetch.test.ts` — new. AC-1..AC-10.
- `tests/serverRequests/ServerFetch.test.ts` — new. AC-11.
- `tests/utils/cookieManager.test.ts` — new. AC-13, AC-14.
- `tests/utils/tokenManager.test.ts` — new. AC-15..AC-19.

**No file outside `tests/` is created or modified.** In particular the shared
runner settings, the global setup file and the shared network handler list are
left alone.

**Removed from this ticket (FU-8):** `tests/serverRequests/requestDedup.test.ts`
and AC-12. The per-request memoisation module is snapshot dedupe for the listing
and modal flow, not token plumbing — it shares a folder with this ticket, not a
flow. Its likely outcome here was prose plus a test pinning "no memoisation
outside a render", which a later reader would take as the opposite of the
module's stated contract. `spec.md` still lists AC-12, because this command may
only write `plan.md` and `ticket.md`; at verify, AC-12 is recorded as moved out
of scope rather than passed or failed. OQ-10 is answered by that removal.

**On placement (OQ-1):** the spec settled that neither source area is protected,
so colocated files would be legal. They still go in the `tests/` mirror, because
both areas are server-only and a test file sitting inside them would be picked up
by the app's own module graph. A placement choice, not a protected-path
exception; no protected-path statement is required at verify.

**On the backend addresses (OQ-7, FU-1) — this replaces the previous answer.**
Both backend addresses are provided to the tests as obviously fake values,
stubbed **file-locally** so the shared runner settings stay untouched. That was
the only thing the previous answer was protecting, and a file-local stub protects
it just as well. The previous answer — match the address as the code builds it,
including the literal `undefined` prefix — was wrong three times over: with both
addresses absent the resolver returns an empty string for a verified shopper and
a guest alike, so AC-18 could not be proved; the resulting address is not
parseable, so the request is rejected before the fake network sees it and the
wrapper retries it as a network error, meaning AC-8 and AC-10 would have
exercised the retry path instead of guest creation; and the assertion pinned a
gap in the runner settings rather than anything about the product. The missing
runner values are recorded as a note in the implementation record instead.

**On the client-side cookie helpers.** The three browser-only helpers in the
cookie module are out of scope here: this ticket is the *server-side* token
plumbing, and those helpers only run in a browser-like environment, which these
files deliberately do not use. They belong with the client-side phase.

## Integration surface

- **Components / shared config touched:** one shared test helper — the
  request-store stand-in (`tests/mocks/nextHeaders.ts`). Nothing else shared is
  written to: not the global setup file, not the shared network handler list, not
  the runner settings, not the fixtures.
- **Dependencies stood in per test file, not modified:** the refresh exchange
  (`utils/server/authRefresh.ts`, OQ-3) and **the failure reporter**
  (`utils/serverErrorReporter.ts`, FU-2). The reporter was missing from this
  section in revision 1 and is a real dependency of AC-11: the transport layer
  calls it on every non-successful response and every transport error.
- **Who else depends on them:** the request-store stand-in has **no callers
  today** — built in an earlier phase, unused since. This ticket is its first
  consumer, so extending it cannot break existing behaviour. It is, however, the
  stand-in every later phase in this journey will use for cookies, so this ticket
  is setting its shape for phases 6 through 11.
- **Overlapping flows:** the code under test is shared far beyond this ticket.
  The cookie names and options are read by the sign-out path, the auth routes,
  the request proxy and the OTP rate limiter; the routing helpers decide which
  backend serves every server-rendered page. This ticket only reads them, but it
  **pins** them: a later ticket that changes a cookie lifetime, a same-site rule
  or the routing allow-list will now fail these tests, and that is intended.
- **Ordering / lockstep dependencies:** the stand-in must be extended before any
  test that asserts cookie options or counts cookie writes (step 1 before steps 3
  and 6). The refresh exchange is stood in rather than exercised, so this ticket
  must not be read as covering the refresh path — its own ticket still owes that.
- **What breaks if this is wrong:**
  - If the stand-in records options loosely, the cookie tests pass while
    asserting nothing, and a future change that drops the unreadable-by-browser
    marking or widens a lifetime ships unnoticed. The failure would surface as a
    browser-readable auth token, not as a red test.
  - If the stand-in changes its existing two-argument behaviour, every later
    phase in this journey inherits the break.
  - **If the failure reporter is not stood in, a test can reach a real backend
    (FU-3).** The reporter fires its own outbound request, and that call is
    swallowed by two separate catch blocks — so the fake network's
    unhandled-request rule *cannot* fail the test on it. Isolation here comes
    from standing the reporter in, not from the network rule. This is the one
    place where the suite's "no real input or output" guarantee is not enforced
    by the harness.

## Validation strategy

- Validation profile: `logic-change`   # answers OQ-6
- Every acceptance criterion is proven by a named test, and the mapping from
  criterion to test is recorded at verify. AC-12 is recorded as moved out of
  scope. AC-19 is expected to produce findings alongside its assertions.
- **On timing and limits (OQ-9, FU-5) — this replaces the previous answer.**
  - Only the **transport layer** accepts its own retry count, delay and timeout
    parameters. The previous answer claimed this held generally; it does not. The
    **authed layer** exposes none of them, so its 15-second request abort is not
    tunable on any of AC-1..AC-10. Those tests instead guarantee that **every
    address has an immediate reply**, so no request is ever left to age out.
  - Simulated clocks are **not** used. The one place the previous answer allowed
    them — the backoff ceiling — sits on a recursive asynchronous retry, where
    advancing the clock deadlocks, and the request abort timer is not covered by
    the simulated clock anyway. The delay values are asserted by watching the
    delay function directly, which proves the ceiling without any waiting.
  - Each file declares a time limit of **5 seconds**, below the 15-second request
    abort, so a mis-wired reply fails fast instead of idling.
  - Each file selects the **server-style environment** rather than inheriting the
    browser-like default, since every module under test is server-only.

## Rollback

Every change is a new file under `tests/`, except one additive change to a shared
test helper that has no callers today. Deleting the new files and reverting that
helper restores the previous state exactly. No application behaviour changes, so
there is nothing to roll back in the running product, and no migration, flag or
deployment step is involved.

## Out of scope

- **Changing any code under test**, including refactoring for testability or
  fixing a defect these tests reveal. Defects are written into the implementation
  record and the test pins today's behaviour (AC-20).
- **Fixing the recorded findings (OQ-8, FU-6).** Recorded and reported here,
  fixed in their own tickets. The list now carries six:
  1. the backing technology named in identifiers and comments;
  2. the routing debug log printing the backend name outside production;
  3. the unused parsing library import in the cookie module;
  4. **the failure reporter copying raw auth, chat, stories and wallet tokens and
     the user-id hash into every report it sends** — this contradicts FR-13
     directly and is the most serious of the six;
  5. **the two unreadable-by-browser lists disagreeing** — one carries the chat
     refresh token, the other does not;
  6. **the profile cleaner not stripping the refresh-token field**, while its
     sibling cleaner does.
- **The refresh exchange as code under test (OQ-3)** — stood in; its own ticket
  owes its coverage.
- **The per-request memoisation module and AC-12 (FU-8, OQ-10)** — moved out; it
  belongs with the listing and modal work.
- **The browser-only cookie helpers** — this ticket is the server-side plumbing.
- **Any test that contacts a real backend.** Agreed separately, deferred.
- **Roadmap phases 7 to 11** — the client request helper, the one-time-code
  paths, the auth service and store slice, the auth routes, and the sign-in
  screens.
- **Changing the shared runner settings, the global setup file, or the shared
  network handler list.**
