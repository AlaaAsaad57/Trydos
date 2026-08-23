---
ticket: unit-tests-api-auth-routes
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Plan — unit-tests-api-auth-routes

> Decide the approach before changing code. Plan only — no implementation here.

**Revision 4** — the four must-fix edits from the third review, plus the items it
recorded for the implementer so this file is self-contained. `/implement` follows
this plan, not the review.

## Approach

Drive each route the way the framework does: build a request, call the exported
handler, then read the status, the body, and the cookie writes and deletes it
made. Every helper inside these handlers is private, so this is the only way in,
and it pins the behaviour a caller gets rather than the shape of the code.

### What is stood in, and what runs for real

**Three stand-ins in every file:**

- **The request reader (`next/headers`)** — the existing cookie-store stand-in,
  which records each write with its options and each delete in order. The
  credential helper and the renewal helper run **for real** on top of it, so
  AC-1, AC-3, AC-15, AC-18, AC-19 and AC-24 assert real cookie names and real
  options rather than "a helper was called".
- **The network (global `fetch`)** — the existing fake network, which records
  every call and raises a named error when the code asks for one more reply than
  the test queued. Its delay field is never used: it performs a real sleep.
  Ordering among the parallel sub-service calls is read from the recorded list.
- **The error reporter** — reused from the existing shared stand-in
  (`makeErrorReporterMock` in `tests/mocks/authGraph.ts`, already used by four
  files). No new helper file is created. It is not passive: it reaches
  `/mobile_error_log/store` through a real `fetch`, so left alone it consumes a
  queued reply and, un-awaited, leaks into the next file. **One stand-in of that
  module covers both reporting channels** — the direct calls and the ones the
  secure-logging helper makes — because both import the same module.

**A fourth stand-in, in the sign-in file only.** The sign-in route imports
`isGuestName` from `utils/tinyUtils`, and that module's first seven lines pull in
the shared store, the translations module, analytics, the client fetch helper and
the image component — the very graph `tests/mocks/authGraph.ts` exists to cut.
So `utils/tinyUtils` is stood in for that file. **AC-6 is unaffected by this**:
the guard's own behaviour is already proven in `tests/utils/tinyUtils.test.ts`,
so AC-6 asserts what this ticket is actually about — that the route **applies**
the guard, blanking the name when the guard says the value is a placeholder. That
is exactly the spec's rule that these tests assert route decisions and do not
re-prove helpers earlier tickets already cover.

**Two things run for real and must be named, because the earlier "nothing else"
claim was wrong twice:**

- **The secure-logging helper.** The proxy calls it on both the success and the
  catch path. It reads the token cookie, prints the whole log entry to the
  console on any non-production run, and on the catch path reports through the
  error reporter — so that path reports **twice**. The console is silenced in the
  proxy file (and its payload asserted, so a future widening of that line is
  caught), while the reporter assertions still run.
- **The renewal helper.** It runs for real for the renewal and expiry routes,
  reading cookies and base addresses of its own.

**The `.invalid` hosts are the net, not msw.** Stubbing global `fetch` replaces
the very `fetch` msw patched at start-up, so nothing reaches the interceptor.
What stops a stray call leaving the machine is that every address is a reserved
`.invalid` host that cannot resolve, and every "must not call" criterion asserts
the recorded call count **and** the exact refusal status and body.

**OQ-1 — one test file per route, in the exact `tests/` mirror.** Ten files.
**OQ-3 — the outgoing call is stood in with the existing fake network**, because
several criteria are about a call that must *not* happen and the recorded list is
the only direct evidence for them.

## Steps

1. **`logout` first.** Its real work is the deferred-call question and the cost
   estimate; the environment check is a one-line note, not a gate — eight
   existing files already run under the node-environment docblock with this same
   shared setup.
   - *The deferred detach (AC-20).* Establish whether the deferred call runs when
     the handler is invoked directly. If not, record the finding against AC-20,
     assert only what is observable, and do not reshape the route.
   - *Contain it.* The AC-18 and AC-19 tests **send no push token**, so the
     detach is never prepared and the deferred call is never reached. Otherwise a
     throw there is caught by the route itself and returned as a 500, which would
     derail the cookie criteria in the same file, not just AC-20.
   - *AC-18.* Assert an **explicit literal list of the thirteen cookie names**
     written into the file — not the list imported from source, which would
     compare the code against itself. Add a **canary** against the exported
     array: its length is thirteen and it equals the literal list, and nothing
     outside it is deleted. Name the two survivors explicitly: **`VISIT-ID` and
     `LOGOUT-GUARD` are never deleted.**
   - *AC-19.* Pin `httpOnly`, `sameSite`, `path` and the short lifetime, and the
     `secure` rule below.
   - *Cost estimate.* Time this file in isolation. It is one of the **light**
     files, so the estimate is **nine light plus one heavy** (the sign-in file
     carries the store and translations graph) and is an **upper bound** only —
     the post-hoc measurement in step 10 is what decides the follow-up.
2. `clear-tokens` — the allow-list and the scoped re-auth marking (AC-21, AC-22).
3. `refresh` — the four branches and the credential-free answers (AC-9..AC-12).
4. `expire` — guard, last-chance renewal, the full clearing, the verified flag
   read before the clearing, the failed-registration path (AC-13..AC-17).
5. `register-device` — guard, identity replacement, success-without-token, the
   stripped answer (AC-23..AC-26), and AC-36 on the failure text it composes.
6. `me`, `wallet-token`, `update-user` — the reads and the merge (AC-27..AC-30).
7. `login` — AC-1..AC-8, the reporter-payload check, AC-36 on its own error body,
   and the fourth stand-in described above. Failure combinations are **capped**
   at four single sub-service failures plus one multi-failure case; the cap goes
   in `implement.md`.
8. `proxy` — AC-31..AC-35, plus the decoded-input cases: the decode header with
   an escaped host-escape, an escaped send path, and a double-escaped send path.
   - *Every refusal asserts its exact status and body* — `400 Invalid target
     URL`, `403 Forbidden` — never the call count alone. A missing base address
     otherwise produces the same observable as a working guard.
   - *AC-35.* The two storefront addresses must be **different values**, or the
     label branch is decided by the first comparison and the core case is
     unreachable while still green.
   - *AC-34 — written green, never red.* The two refusals **should** be
     indistinguishable and today they are not: the allow-list refusal carries a
     no-store cache header, the catch-all does not. The assertion **positively
     pins that divergence** and carries the follow-up ticket id in a comment, so
     whoever fixes the route knows to update it. It is **not** written as a
     failing test and **not** as `it.fails`: a failing test turns the gated suite
     red for every later pull request, contradicting the spec's own requirement
     that the suite keeps passing, and `it.fails` passes on *any* throw — a
     mis-queued reply or a missing stub would satisfy it just as well as the real
     divergence. AC-34 is therefore recorded as **not satisfied, finding raised,
     follow-up ticket opened** rather than as a green proof of the property.
   - *Scope the reporter assertion.* "The reporter was not called" applies to the
     **unknown-service refusal** only; the catch-all legitimately reports twice,
     and exactly two reports are asserted there so a branch swap is visible.
   - *Stay on the JSON and 204 branches.* The fake response exposes no binary
     reader, so a non-JSON reply throws inside the route and is swallowed into
     the catch-all 503 — the very shape AC-34 examines.
9. **Cross-check against the existing client tests.** Bounded to the routes the
   four client files actually assert. Output is **one line per route in
   `implement.md`, including "no divergence"**, so a skipped step is visible.
   Confirm at this step which routes the OTP client file touches rather than
   assuming it adds none.
10. Confirm AC-37 and AC-38, and record the cost: measured with the **coverage**
    command, because that is how the gate runs the suite and where the added
    minutes land; the **median of three warm runs** to one decimal, before and
    after, plus the per-file durations the runner already prints. If the delta
    exceeds **20 seconds**, raise a follow-up ticket and name the real suspects —
    coverage instrumentation of the newly-executed route and credential graph
    first, the fake network's per-file start-up second. Note that these files
    carry no browser-like environment, so a small increase is expected rather
    than a mis-measurement.
11. Run the validation profile's checks and record the result.

## Files to change

Ten new files, all tests. **No production file is touched** (AC-38); no existing
test, mock or configuration file is edited; **no new helper module** is created.

- `tests/app/api/auth/login/route.test.ts` — AC-1..AC-8, AC-36
- `tests/app/api/auth/logout/route.test.ts` — AC-18..AC-20, AC-36
- `tests/app/api/auth/refresh/route.test.ts` — AC-9..AC-12
- `tests/app/api/auth/expire/route.test.ts` — AC-13..AC-17
- `tests/app/api/auth/clear-tokens/route.test.ts` — AC-21, AC-22
- `tests/app/api/auth/register-device/route.test.ts` — AC-23..AC-26, AC-36
- `tests/app/api/auth/me/route.test.ts` — AC-27
- `tests/app/api/auth/wallet-token/route.test.ts` — AC-28
- `tests/app/api/auth/update-user/route.test.ts` — AC-29, AC-30
- `tests/app/api/proxy/route.test.ts` — AC-31..AC-35, AC-36

### Environment values — the complete list (OQ-2)

Read from the code. Eight are stubbed per file with `vi.stubEnv` on **role-named,
mutually distinct, unresolvable** hosts and unstubbed after each test; **two more
are read at module load** and need a different technique. `vitest.config.mts` is
not touched: a value added there is handed to every other file in the suite.

| Value | Fixture | Note |
|---|---|---|
| `BACKEND_URL` | `https://core.invalid` | the core storefront backend |
| `GO_BACKEND_URL` | `https://gateway.invalid` | **must differ** from the core address or AC-35 collapses |
| `NEXT_PUBLIC_CHAT_BACKEND_URL` | `https://chat.invalid` | the shared configuration sets it to a **resolvable** `example.com`, so leaving it unstubbed is worse than leaving it empty |
| `STORIES_BACKEND_URL` | `https://stories.invalid` | stories sub-service |
| `COMMENT_BACKEND_URL` | `https://comments.invalid` | comments sub-service |
| `WALLET_BACKEND_URL` | `https://wallet.invalid` | wallet sub-service |
| `ELASTIC_BACKEND_URL` | `https://search.invalid` | reached by the proxy's resolver. Named for the role, not the technology — the naming rule applies to fixtures too |
| `WALLET_PUBLIC_API_KEY` | `test-wallet-api-key` | sent as a header by the wallet sign-in leg |
| `NODE_ENV` | *(read at import)* | decides the `secure` flag and the console lines. **Evaluated when the credential module loads**, so a test that needs a different value must pin it and then import dynamically, as the middleware test already does |
| `TOKEN_COOKIE_MAX_AGE` | *(read at import)* | overrides the access-cookie lifetime, also at module scope. A stray shell value would silently redefine the lifetime AC-3 pins, so **lifetimes are asserted as literals** — 48 hours for an access cookie, 30 days for a renewal cookie — never derived from the environment |

**One assertion per file that the stubbed hosts are all distinct**, so a
copy-paste duplicate fails loudly instead of collapsing a branch quietly.

**Fixture values.** Every credential, token and key is an **obviously synthetic
literal**, never copied from a real session, a browser or an untracked file. The
token fixture is **twelve characters or longer**: the mask returns three stars
for anything shorter, so a short token would make the masking assertion vacuous.

### The `secure` flag

Assert the **literal value** the runner produces (`false`) **and that the key is
present** — never an expression mirroring `NODE_ENV === "production"`, which
re-computes the source and would stay green if the option were hardcoded or
deleted. Add **one case with the environment stubbed to production** asserting
`true`. That case needs a reset-then-import, because the shared options are built
at module scope; the logout guard's inline options are read at call time and need
no reset.

### AC-36 — the term list and where it applies

Whole words, case-insensitive, across the response body, every response header
name and value, and any status text: `go`, `golang`, `gin`, `fiber`, `laravel`,
`php`, `django`, `rails`, `symfony`, `nest`, `nestjs`, plus `node`, `next`,
`vercel`, `express` as header-value terms, and the `x-powered-by` and `server`
headers by name.

`go` is included: it is the one term this repository actually leaks, and the
"ordinary storefront vocabulary" worry does not apply where AC-36 is asserted —
those routes emit fixed literals, not translated copy. The exclusion survives
only for translated user copy, which none of these routes produce.

**Where it applies:** the four files marked above — sign-in, logout,
guest-registration and the proxy — each of which composes its own error text. It
is skipped where a route **echoes the fixture back**, because there the check
would read back the string the test itself wrote. This narrows the spec's "any
route in scope" and is recorded here as a **deliberate deviation**, so `/verify`
reads it as intended rather than as missing evidence.

### Protected-path statement

The routes under test sit under `app/api/auth/**`, which the testing convention
treats as a protected glob — which is why every file above is in the `tests/`
mirror and none of those routes is edited. This is the convention's list, not the
plugin's: the plugin's rule (GU-2 / IM-5) governs `observability/**`, and this
repository declares `features.observability: false` and owns no such runtime.
CLAUDE.md's own protected runtime paths are not touched either. This answers
**OQ-8**.

## Integration surface

> Required (PL-11, ADR-012). What this change touches **beyond its own files**.

- **Components / shared config touched:** nothing is edited, but eight shared
  pieces are relied on. **`next/headers`** is the most-shared — all nine auth
  routes and the credential helper write through it. **`utils/tinyUtils`** is new
  to this list and is why the earlier "nothing else" claim was wrong: the sign-in
  route reaches it, and through it the store, translations, analytics and the
  client fetch helper. **`utils/server/authRefresh`** runs for real for two
  routes and has its own test file, which those two now exercise a second time.
  **`utils/server/tokenManager`** runs for real and brings the secure-logging
  helper with it — a second reporting channel and a console writer.
  **`tests/mocks/authGraph.ts`** supplies the reporter stand-in, shared with four
  existing files. **`tests/setup.ts`** installs the run-wide stand-ins and starts
  the fake network, dead weight here but not trimmed. The **`server-only` alias**
  decides whether a server module loads. **Coverage** already names `app/**`.
- **Who else depends on them:** every other test file shares `tests/setup.ts`,
  the msw server and the reporter stand-in. A global left stubbed — `fetch` above
  all — or an environment value left set leaks into whichever file the runner
  picks next, and the failure surfaces somewhere unrelated. Each file undoes its
  own stubs explicitly.
- **Overlapping flows:** three, and the first is the sharpest.
  (1) These routes are already exercised **from the client side** by passing
  tests — the three sign-in service files and the client fetch helper's file,
  which is the only caller of the renewal route. If a route test encodes a
  contract those contradict, one of the two is wrong and **the suite stays
  green**. Step 9 acts on this and has a required output.
  (2) The logout guard is half owned here: this ticket asserts logout **arms**
  it; `proxy.ts` **clears** it, covered by its own test. Neither half proves the
  guard end to end.
  (3) `expire` and `register-device` call the same guest-registration path, and
  `clear-tokens` and `update-user` both write the chat and stories profile blobs.
- **Ordering / lockstep dependencies:** none in production. Inside the ticket,
  step 1 comes first for the deferred-call question and the cost estimate. Across
  tickets, two follow-ups are opened **immediately and independently**, not
  sequenced behind these ten files: the cookie-forging route, and the
  enumeration-oracle divergence AC-34 pins.
- **What breaks if this is wrong:** a leaked global stub turns an unrelated suite
  red in a way that reads as a code bug. An unstubbed base address makes a guard
  test pass while proving nothing, which is invisible once the suite is green. A
  red AC-34 test blocks every other pull request on the base branch. And a route
  test that pins the wrong contract makes the live suite's results unreadable in
  exactly the case this ticket exists to make readable.

## Validation strategy

- Validation profile: `logic-change`
- Every criterion is proven by an assertion in the file that owns it, per the
  mapping above. AC-37 is proven by the suite staying offline: every address is
  an unresolvable, role-named `.invalid` host, hosts are asserted distinct, and
  every "must not call" criterion asserts the recorded call count **and** the
  exact refusal status and body. AC-38 is proven by the change containing no
  production file.
- **The reporter payload is asserted on both channels**: neither may carry a
  token, a renewal value or the wallet key; only the four-and-four mask may
  appear, and the fixture token is long enough for masking to be observable.
- **Cost** is measured with the coverage command as the median of three warm
  runs, before and after, with the 20-second threshold judged against that number.
- A criterion that cannot be asserted without changing a route is recorded as a
  finding against its AC id, and the route is left alone. **AC-34 is deliberately
  one of these** — pinned green against today's behaviour, recorded as not
  satisfied, with a follow-up ticket.

## Rollback

Delete the ten test files, or revert the commit. Nothing else changes: no
production code, no shared test file, no mock, no configuration, no workflow. The
app behaves identically with these files present or absent, so a rollback carries
no runtime risk and needs no coordination.

## Out of scope

- **The cookie-forging route (`app/api/auth/simulate/`).** Its own ticket, opened
  **now** and independently: the route is reachable and un-gated today, and the
  live harness is about to depend on it.
- **The enumeration-oracle fix behind AC-34.** Its own ticket. This one pins the
  divergence and records it; it does not change the route. The ticket notes that
  the header is not the whole channel — the allow-list path returns before any
  upstream call, so a timing difference remains.
- **The proxy's credential-injection branch** — one exact service-and-path pair
  causes the real bearer to be written into the forwarded body. It is the only
  place the proxy writes a token into a body and deserves its own criterion, but
  no AC covers it, so it is named here rather than left to look like missing
  evidence.
- Any change to production code, including a refactor that would make a route
  easier to test.
- Any change to `vitest.config.mts`, the run-wide stand-ins, the existing mocks,
  or coverage settings — including a lighter setup for node-only files and
  trimming the fake network's start-up. If the measured cost justifies it, that is
  a follow-up ticket.
- Marking phase 10 closed in `docs/testing/UNIT_TEST_ROADMAP.md`. No acceptance
  criterion covers a documentation edit.
- Re-proving the helpers these routes use, including the guest-name guard.
- Proving any of this against the real backend. That is the live suite.
