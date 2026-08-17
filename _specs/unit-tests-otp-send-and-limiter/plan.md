---
ticket: unit-tests-otp-send-and-limiter
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Plan — unit-tests-otp-send-and-limiter

> Decide the approach before changing code. Plan only — no implementation here.

**Revision 4.** Addresses the eight follow-ups in `review.md` against revision 3.
Net smaller than revision 3: one file leaves scope, and the rest are one-line
corrections. The approach has not changed since revision 1.

## Approach

Test each of the two modules for real, in its own file, by lifting only that
module's run-wide stand-in there and naming **every** module stood in around it,
in registration order. The alternative — testing them through the sign-in service,
which is already covered — was rejected because the service only ever sees the
stand-ins, so it can never reach the branches this ticket exists to prove.

The shared stand-in for the limiter is corrected first, because it replies with a
shape the real code never returns, and the guard test that pins that reply moves
with it.

Lifting a stand-in registered in the shared setup file is documented behaviour,
hoisted and file-scoped. No file in this suite does it yet, so it is proven with
one assertion in the first minutes of implementation, **before either test file is
written**. No fallback path is planned: adding one before knowing it is needed
would be speculation.

`spec.md` deferred no open questions, so there is no `OQ-n` for this plan to
answer (PL-12): all five were resolved at spec.

## What changed since revision 3

| Follow-up | Answer |
|-----------|--------|
| 1. Strike the suite configuration from scope | Done — it is gone from **Files to change**, and with it the round's only new major. The hoisted client stand-in is the protection, as it always was. |
| 2. Say that the action's run-wide stand-in is lifted | Step 3, first item in the registration list |
| 3. Single-use replies only where the limiter is consulted | Step 3, last item |
| 4. Stub the cooldown value in the action test | Step 3 |
| 5. Clear the module's cached client; state the module is imported once | Step 2, `AC-11` paragraph |
| 6. Restore the documentation-range rule for address fixtures | Step 3 |
| 7. Treat the cache-clearing route like the number-guard finding | Step 2 comment, Step 4, and **Out of scope** |
| 8. Correct the Validation strategy wording | Validation strategy |

## Steps

1. **Correct the shared limiter stand-in and its guard together.** The default
   reply becomes the real result — allowed, with a reason and a lock time — and the
   guard test that pins the old reply is updated in the same step. These two cannot
   be split: the suite is red between them.

2. **Write the limiter's own test.** The file opens with the node-environment
   docblock, imports the module **once at the top**, and registers, in this order:
   - a stand-in for the cache client library, **hoisted above every other
     registration and above any dynamic import**. Its fake client:
     - implements the script call, returning a **chosen status-and-lock pair** per
       case — without this every call falls into the wrapper's error handler and
       the refusal cases pass on the fail-open path;
     - throws if a delete, scan or key-listing operation is reached;
     - records whether a connection was ever attempted;
   - a lift of the run-wide stand-in for the limiter module, so the real module
     loads;
   - a stand-in for the error reporter, because the store-failure case runs the
     real one otherwise, and the real one reads cookies and awaits an outbound
     request.

   It covers the two allow-anyway paths, each refusal name, the lock-time
   fallback, and the limits read from configuration. Two assertions guard the file
   itself: the fake client was never asked to connect, and its destructive
   operations were **never called** — the throw alone is not enough, because the
   module's own error handling would swallow it. Both are **tripwires, not
   guards**: the hoisted stand-in is what actually prevents a connection, and the
   assertions only report if it failed.

   **`AC-11`.** The module leaves its client unset only when the runtime marker
   reads `edge` at load time. That case stubs the marker, resets the module
   registry, **clears the module's cached client on the global object**, and
   imports the module again **inside its own block** — then restores the marker,
   resets the registry and clears that cache again at the end of the block.
   Without the restore, the module stays loaded in its edge form and every later
   case silently returns the no-store result. Clearing the global cache matters
   because it survives a registry reset, so a re-import would otherwise reuse the
   client built by the first evaluation. Since the module is imported once at the
   top, **this block is the only extra module evaluation in the file**.

   **`AC-15`.** No re-load is needed: the four limits are read inside the function
   on every call, not at load time. The defaults case therefore **unsets** all four
   values rather than stubbing them to numbers — otherwise it proves nothing on a
   machine that has them set — and restores them afterwards. The limits are
   deliberately **not** passed as arguments: that would bypass the configuration
   read `AC-15` exists to prove.

   The two fail-open cases carry a comment naming what still protects the endpoint
   when the limiter yields — the platform edge, the refusal of a direct send at
   the proxy, and the backend's own per-number throttle — **and stating that the
   counters can currently be flushed by an unauthenticated endpoint** (see **Out
   of scope**). Without that sentence the comment lists compensating controls while
   omitting that one of them is resettable by anyone.

3. **Write the send action's test.** Same docblock, and it registers, in this
   order:
   - **a lift of the run-wide stand-in for the action itself** — this is the line
     that makes the file exercise the real action instead of the stub, and without
     it the file can pass while proving nothing;
   - the error reporter, because the unexpected-failure case calls it without
     waiting; left real, its cookie read and outbound request outlive the test and
     its own error handling hides the fake network's complaint, so the file would
     break the no-real-input-or-output rule **in silence**;
   - the framework's header API, through the existing header stand-in factory, for
     the cookie the action reads;
   - the authed-fetch helper, so the backend reply is chosen directly and no
     request is built for real;
   - the identity layer, returning a **fixed identity** — the module is replaced
     wholesale, so no hashing and no salt are involved. Its address value comes
     from the documentation ranges only, never a real-looking address;
   - the telemetry recorder, so the three recorded outcomes are read off a spy
     rather than through the deferred, error-swallowing real recorder;
   - the run-wide limiter stand-in is **kept**, and a **single-use** reply is set
     only in the cases that actually reach the limiter — an unconsumed one would
     survive into the next case, because the suite's reset between tests clears
     recorded calls without draining a queued reply. The file restores the default
     in its own teardown.

   Two environment values are stubbed and restored: the backend address, so the
   request is asserted against a real path rather than `"undefined/…"`, and the
   cooldown value, which the action reads when reporting a lock time — otherwise
   `AC-5` and `AC-7` depend on whatever the machine exports.

   It covers the number guard, the normalised number, both refusal messages, both
   reply shapes carrying a verification id, the message pass-through, the
   unexpected-failure path, the three recorded outcomes, and that the limiter is
   asked about the identity the action resolved — asserted as **pass-through of the
   resolved identity, never as a fixed hash value**.

   It also covers a **very long run of digits**. The guard has no upper bound; the
   guard is not changed (the no-production-change rule holds).

4. **Record the two findings this ticket refuses to fix**, both the same way: an
   entry in `verify.md > findings` and its own ticket — the number guard's missing
   upper bound (slug `otp-phone-length-upper-bound`), and the unauthenticated
   cache-clearing route (slug `secure-clear-redis-route`). Neither is fixed here.
   Recording them identically is deliberate: a finding with no destination is a
   comment nobody reads again.

5. **Record both files in the unit roadmap** as their own entry in journey 2,
   marked so the existing phase counts stay true and no phase number changes; and
   **record the hand-off in the live roadmap** so the live phase that owns the
   limiter knows the wrapper is covered and the counter script is still its own. In
   the same pass, correct the stale validation-profile line in **both** roadmaps.
   The one-line correction to this ticket's own spec is made as its **own commit**,
   with the reason in the message, so a change to an approved gate artifact is
   visible rather than buried.

6. **Run the validation profile**, then read the coverage summary once to confirm
   both modules have left zero.

## Files to change

- `tests/mocks/serverRequests.ts` — correct the limiter stand-in's default reply to
  the real result shape (allowed, with a reason and a lock time). Satisfies AC-17.
  Loaded by every test file in the suite; see Integration surface.
- `tests/setup.test.tsx` — update the guard that pins the stand-in's exact reply.
  Moves with the file above; not a separate decision.
- `tests/serverActions/sendOtp.test.ts` — **new**, and it creates the
  `tests/serverActions/` mirror folder, which does not exist yet. Satisfies AC-1 to
  AC-10 and AC-16.
- `tests/serverRequests/radis/index.test.ts` — **new**. The full source path is
  mirrored, not flattened, per the testing convention. Satisfies AC-11 to AC-16.
  **Protected-path statement:** the *module under test*
  (`serverRequests/radis/index.ts`) sits under the protected glob
  `serverRequests/**`. No file inside that glob is edited — the mirror location
  exists precisely so a new test does not trigger the protected-path stop — and the
  statement must still be carried at verify (TR-3).
- `docs/testing/UNIT_TEST_ROADMAP.md` — record both files as their own entry in
  journey 2, marked so the phase counts stay true; and correct the line telling
  every phase to name a validation profile that does not exist in this project's
  configuration. Satisfies AC-18, plus that correction.
- `docs/testing/LIVE_TEST_ROADMAP.md` — record in phase 6 that the wrapper is
  covered by unit tests and the counter script stays with that phase; and correct
  the same stale profile line, which appears here too. Satisfies AC-19, plus that
  correction.
- `_specs/unit-tests-otp-send-and-limiter/spec.md` — correct the one non-functional
  line naming the non-existent profile, so the spec and the plan agree. A workflow
  artifact, not code; listed here because the review gate may not write it, and
  made as its own commit so the edit to an approved artifact is visible.

**Removed from scope in this revision:** the suite configuration file. Revision 3
added it to pin fake cache credentials. It is not backed by any acceptance
criterion, it duplicates a per-file pattern five existing test files already use,
and its safety claim did not hold — the client retries without limit on an
unresolvable host just as it does on a local one, so pinning would not have
prevented the hang it was justified by. The hoisted client stand-in is the
protection.

No production file is touched. No file under a protected **runtime** path
(`proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`,
`.github/workflows/**`) is touched. This repository owns no `observability/**`.

## Integration surface

> Required (PL-11, ADR-012). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:** the shared cache stand-in, which the
  setup file registers for the **whole suite**; the two run-wide stand-in
  registrations in that setup file (depended on, not edited); the guard test that
  pins the stand-in's reply; **shared process state** — the runtime marker (also
  read by the instrumentation entry point), the module registry, and the module's
  cached client on the global object outside production; both testing roadmaps;
  this ticket's spec artifact; and the coverage summary CI posts to Telegram, whose
  headline numbers move when two files leave zero.
- **Who else depends on them:** every test file in the unit suite loads the cache
  stand-in through the setup file, so its default reply is shared state for the
  whole suite, and the reset between tests only clears recorded calls — it does
  **not** drain a queued single-use reply. That is why a once-reply is set only
  where it is certain to be consumed. The guard test asserts the stand-in's reply
  exactly and goes red the moment it changes. The identity layer the action uses is
  shared with the OTP debug statistics action, which derives the same keys, so an
  expectation written here describes both flows. The runtime marker is read by the
  instrumentation entry point, so stubbing it must not outlive the one block that
  needs it.
- **Overlapping flows:** the limiter module is one file serving three unrelated
  jobs — OTP limiting, generic fixed-window limiting, and caching. Loading it for
  real **loads all three**, including a maintenance function that scans for every
  OTP counter key and deletes them. They are loaded and never called: no test may
  call that function, the fake client throws if a destructive operation is reached,
  and the file asserts at the end that none was.
- **Ordering / lockstep dependencies:** the stand-in correction and its guard
  update are lockstep — the suite is red between them. In each new test file the
  lift is stated in registration order, and in the limiter test the client stand-in
  must come **above** the lift and above any dynamic import; registered after, it
  is too late, because the module builds its client while being evaluated. The
  `AC-11` block must restore the marker, the registry and the global client cache
  before any later case runs. The limiter test is written before the action test so
  the real result shape is pinned before anything relies on the stand-in imitating
  it. The roadmap, spec and finding records depend on nothing.
- **What breaks if this is wrong:** if the guard is not updated with the stand-in,
  the suite goes red in a file nobody in this ticket was working on, and it reads
  as "the harness broke". If the client stand-in is missing or registered too late,
  the real client is built at import against whatever address the machine holds and
  retries without limit, which can hang the run — the fake network cannot catch it,
  because it is not HTTP, and **nothing else stands between that mistake and a real
  connection**; that residual risk is accepted knowingly, because pinning a fake
  address would not have bounded it. If the fake client has no script call, the
  refusal cases pass through the error handler and prove nothing. If the `AC-11`
  block does not restore what it changed, every later case in that file silently
  returns the no-store result. If the action's own lift is omitted, that file tests
  the stub and the ticket's central claim is false while everything looks green. If
  a lifted stand-in leaked past its own file, unrelated tests would start loading
  the server-side graph and the client library — the exact failure the run-wide
  stand-ins exist to prevent.

## Validation strategy

- Validation profile: `logic-change`
- **That profile is the gate, and nothing here adds a check to it.** Its checks are
  resolved by `/verify` from the project configuration.
- **The whole suite is run, not only the two new files** — the shared stand-in in
  `tests/mocks/serverRequests.ts` is loaded by every test file, so a green pair of
  new files says nothing about the rest.
- Separately from the gate, the coverage summary is read **once** at the end as a
  one-off confirmation that both modules have left zero. It is not a check, no
  acceptance criterion depends on it, and no threshold is set.

## Rollback

Everything here is test files and documentation — no production code, no runtime
behaviour, nothing deployed. Two levels are available:

- **Full:** revert the commit. That restores the previous state completely and
  needs no coordination.
- **Partial:** if the shared stand-in correction alone turns out to be wrong,
  `tests/mocks/serverRequests.ts` and `tests/setup.test.tsx` revert **together as a
  pair** — they are lockstep — and **the two new test files stay in place**,
  because each sets its own replies and neither depends on the stand-in's default.

## Out of scope

- Any change to production code, including any refactor that would make either
  module easier to test.
- **The number guard's missing upper bound.** A test covers the behaviour; the
  guard is not changed. Recorded in `verify.md > findings` and raised as
  `otp-phone-length-upper-bound`.
- **`app/api/clearRedis/route.ts`** — an unauthenticated route with a permissive
  cross-origin header that calls the maintenance function, clearing every OTP
  counter, and then deletes the product cache. Anyone who knows the URL can reset
  the caps this ticket pins. Found by the review panel and confirmed by reading the
  file. **Not fixed here:** it is production code and a security change, and it
  does not belong in a test ticket. Recorded in `verify.md > findings` and raised as
  `secure-clear-redis-route`, and named in the fail-open comment so the green tests
  from this ticket can never be read as "the OTP limiter is safe".
- Proving the counter script itself — its counting, its fixed windows, its
  behaviour under two callers at once. That stays with the live suite.
- The generic fixed-window limiter's stand-in, which carries the same kind of shape
  drift. It belongs to whichever ticket tests that function.
- The refusal-name drift between the module's comments and its code: expected names
  are taken from the result type and the script's status codes, and the drift is
  recorded, not fixed.
- The other untested parts of sign-in: the authentication route handlers, the
  proxy's refusal of a direct send, and the sign-in screens.
- Any change to coverage settings or to a coverage target, and any change to how an
  OTP send behaves for a real user.
