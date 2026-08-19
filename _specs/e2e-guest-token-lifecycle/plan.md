---
ticket: e2e-guest-token-lifecycle
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-19
links:
  clickup:
  github:
---

# Plan — e2e-guest-token-lifecycle

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Three browser cases, each driving one guest through one point of the token
lifecycle. Every case runs the same four moves, **in this order, always**:

1. **Obtain the country.** Reuse the value the locale coverage already discovers
   and caches once per run. On a cold cache that helper navigates the page and
   costs one extra navigation and one extra guest; that cost is real and is
   accepted, and it changes nothing that follows because of step 2.
2. **Clear every cookie.** This is the step the previous revision omitted, and
   omitting it is what broke it: obtaining the country can leave a registered
   guest and its credentials in the browser, so without an explicit clear the
   "fresh navigation with no credentials" is not credential-free, the app mounts
   with credentials, and the registration the window depends on never fires.
   Clearing makes the case behave identically whether the cache was warm or
   cold, which also makes a filtered run behave like a full one.
3. **Seed the country and language, then navigate fresh.** No region popup, no
   reload. The app mounts with no credentials and registers a guest.
4. **Measure from that registration.** Spoiling, the authenticated action and the
   assertions all happen inside a 30-second window.

**What separates a renewal from a new guest.** The outcome decides it, never the
absence of a request:

- **A renewal** — the identity is unchanged and both credentials rotated, a
  renewal was requested, and no registration was requested in the window.
- **A new guest** — the identity differs and both credentials rotated, a renewal
  was attempted, and then an expiry was requested. The expiry request *is* the
  re-registration: that route mints the guest server to server, so a
  registration request is never visible to the browser in this path.

The absence of an expiry request is deliberately not a signal: when two refused
requests race, the loser can legitimately reach that route, whose own last-chance
renewal returns a live session with the identity intact.

**The spoiling value keeps the shape the refusal was actually measured with** — a
token-shaped value with a meaningless payload and signature. The previous
revision moved it off that shape to avoid tripping secret scanners; that was
wrong twice over. The recovery is keyed on a refusal, and a differently shaped
value may be answered as a bad request instead, which would exercise nothing. The
reasoning given for the change was also mistaken: masking works on the cookie
name, not on the value's prefix. The scanner concern is solved inside the payload
instead, which leaves the shape intact. **A refinement must never overrule a
measurement.**

**No credential value leaves the harness in any form.** Presence is asserted on
cookie names. Comparison returns only changed or unchanged. Cookie records are
projected to name, domain and path before they reach any assertion, matcher,
step title or message, so a raw record never crosses the harness boundary — the
spoil step reads real records internally to copy their attributes, and returns
none.

**OQ-4 — these cases stand on their own** rather than joining the read-only
browsing file, because they register guests, overwrite credentials and watch
traffic.

**OQ-6 — the identity reading is a step in the `auth` action module the design
document reserves; the credential and request machinery lives in the harness
layer** beside the target guard and the masking helper. Actions are things a
visitor does; spoiling a cookie and recording requests are neither.

### Review follow-ups addressed

| # | Follow-up | Addressed in |
|---|-----------|--------------|
| 1 | State the order; clear every cookie; make it independent of file order | Approach 1–3; step 3 |
| 2 | Restore the measured token shape; drop the wrong rationale | Approach; step 2 |
| 3 | Delete the artifact guard and the file it touched | Files to change; Integration surface; Out of scope |
| 4 | Project cookie records before any assertion; rule covers the spoil step | Approach; step 2 |
| 5 | Carry every attribute from the original cookie | Step 2 |
| 6 | Drop the mechanical secret check | Validation strategy |
| 7 | Recorder attached and cleared before the navigation | Step 2; step 4 |
| 8 | Exact match on the normalised path, discard at capture | Step 2 |
| 9 | Explicit short timeouts summing under the budget; say what a budget failure means | Step 5 |
| 10 | Recorded paths and elapsed split in the failure message | Step 5 |
| 11 | Validation-pass guest figure, recurring rate, error-tracker noise | Cross-cutting criteria; Integration surface |
| 12 | Accepted teardown exception recorded beside the rule | Step 10 |
| 13 | Carry the criterion-to-expiry mapping into verification | Step 8 |

## Steps

1. Add locators for **both** prompts — the session-expired screen and the
   sign-in path — from hooks the app already carries. AC-8 is covered as
   written, not narrowed; amending a criterion would rewind this ticket to the
   specification stage for a wording change.
2. Add the credential machinery to the harness layer:
   - **spoil one or both credentials** — writes a token-shaped constant whose
     payload segment decodes to an obvious marker saying it is not a real
     credential, which answers the secret-scanner concern without changing the
     shape the refusal was measured with. A comment forbids replacing it with a
     captured value. It writes through the browser's cookie store only, never an
     application route. It reads the original record locally to **copy every
     attribute** — not only domain and path, because dropping the rest would
     leave a credential-shaped cookie readable by page scripts while still
     passing a one-per-name check — then asserts exactly one cookie of each name
     survives. It returns name, domain and path only, never a record, and takes
     no caller-supplied logger (AC-9, AC-11).
   - **compare the stored credentials** — returns only changed or unchanged. No
     value, no digest, so nothing exists for an assertion or a message to print
     (AC-9).
   - **record authentication requests** — a passive listener, matching an
     allow-list of authentication paths by **exact match on the normalised path**
     and discarding everything else at capture. Path component only: never the
     full address, which carries origin and query; never headers or bodies;
     never route interception, which would disturb the request coalescing that
     C-3 depends on. It answers "was this path called", never "how many times"
     (AC-3).
3. Add two steps to the reserved `auth` action module:
   - **boot as a new guest** — performs the four moves in the order above:
     obtain the country, **clear every cookie**, seed the country and language,
     navigate, and return once the registration has been observed (AC-1, AC-2).
   - **read who the visitor is** — returns the numeric identifier only, never the
     profile object and never the hashed identifier the masking helper treats as
     a secret (C-4, AC-9).
4. Attach and clear the recorder **before** the fresh navigation, so the
   registration that starts the window is itself recorded. The window's start is
   *marked* at that observed registration; the recorder is never cleared after
   it. Stated literally because the previous revision said both "cleared at the
   start of the window" and "the window starts at the registration", which
   cannot both hold when a case must assert that registration (AC-2).
5. Bound the time (AC-10): the window runs from the observed registration to the
   final assertion and stays within **30 seconds**, inside a session lasting
   about sixty. The suite's default per-case timeout is kept — a shorter one
   would also cover the country discovery and turn slow-but-correct staging into
   a budget failure. Every wait inside the window carries an explicit short
   timeout rather than inheriting the suite's longer defaults, and those
   timeouts are shown to sum under the budget. Elapsed time is asserted before
   the behavioural assertions as well as at the end. The failure message carries
   the recorded path list and the elapsed split, because nothing is recorded for
   these cases and one red run has to be enough to diagnose. The case states
   plainly that a budget failure means re-run, not behaviour changed.
6. Write case 1 (AC-1, AC-2): after booting as a new guest, the visitor holds
   both credentials — asserted on cookie names, never values — the app can name
   who they are, and a registration was requested. Other requests in the window
   do not fail it.
7. Write case 2 (AC-4, AC-5): spoil the working credential, open the cart, then
   assert both credentials changed, the identifier is unchanged, a renewal was
   requested, and no registration was requested in the window. The expiry
   request is recorded for diagnosis and never asserted on.
8. Write case 3 (AC-6, AC-7, AC-8): spoil both credentials, open the cart, then
   assert both credentials changed, the identifier differs, and a renewal was
   attempted and then an expiry requested — the expiry request being where the
   re-registration happens, which the verification stage must carry so AC-7 does
   not read as unproven. Neither prompt appears, asserted after a positive
   anchor with an explicit 2-second timeout counted inside the window and scoped
   to this recovery.
9. Confirm once, by hand, that each prompt locator matches when its prompt is
   forced, and record the result in the implementation notes. An absence
   assertion passes when its locator matches nothing, and inverting it during
   the mutation check fails either way, so nothing else can prove these two
   locators bind.
10. Record the outcome: three rows in the scenario catalogue continuing the
    existing guest numbering (**OQ-8**); the design document's **two** stale
    lines updated, the file map and the action-layer table; and in the suite
    README, one line naming the new file **and** the accepted exception to the
    rule that everything created is registered for teardown, recorded beside
    that rule rather than left to contradict it.
11. Prove it: lint, type check, then the whole browser suite against real
    staging. Then the mutation check — **one representative inversion per case,
    three in total**, each against a single already-built server and filtered to
    the case under test. Because every case clears cookies and seeds the country
    itself, a filtered run behaves the same as a full one.

### Criteria that cut across every case

- **AC-3 — nothing fixed.** No case names a country, a product or a guest, and
  none asserts how many times a path was called. Enforced in steps 2, 3, 7, 8.
- **AC-9 — no credential value anywhere.** Presence on names, comparison as a
  boolean, records projected before they leave the harness, identity as a
  number. Enforced in steps 2 and 3.
- **AC-10 — a bounded window.** Enforced in steps 4 and 5.
- **AC-11 — nothing left behind, nothing reached into.** Every refusal is
  provoked through the browser's own cookie store. The run leaves only guests:
  **about five per clean run** — one per case, one more when case 3
  re-registers, one for the country discovery — and **about twenty for a full
  validation pass**, which is the suite plus three filtered mutation runs that
  each pay discovery again. On the pipeline that is roughly five per push plus
  five nightly. Recorded in the case file so retention can be weighed later.

## Files to change

- `tests/e2e/harness/session.ts` — new. The credential machinery from step 2.
- `tests/e2e/actions/auth.ts` — new. The two verbs from step 3, in the module
  the design document reserves and the ordering ticket will extend.
- `tests/e2e/session.live.spec.ts` — new. The three cases.
- `tests/e2e/selectors.ts` — locators for both prompts.
- `docs/testing/E2E_TEST_DESIGN.md` — two lines: the file map and the
  action-layer table.
- `docs/testing/E2E_SCENARIOS.md` — three rows.
- `tests/e2e/README.md` — the new file, and the accepted teardown exception
  beside the rule it excepts.

No application source changes. No `observability/**` changes. None of the
protected runtime paths are touched. **The suite's global setup is deliberately
not in this list** — see Out of scope.

## Integration surface

> Required (PL-11, ADR-012). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:** the suite's shared locator file and its
  shared test object, which every existing case imports; the country discovery
  in the locale coverage, now a dependency of these cases; and the design
  document, the scenario catalogue and the suite README, which govern and
  describe the whole suite. The application's authentication routes and both
  prompt screens are read from, never changed. The suite's global setup is no
  longer touched at all, which removes the only change that could have failed
  every case.
- **Who else depends on them:** all 31 existing cases share the test object and
  may share the locator file. The locale coverage owns the country discovery
  these cases reuse — a change to its caching changes only their speed, not
  their behaviour, because each case clears and re-seeds regardless. The
  ordering ticket will extend the same `auth` action module, which this ticket
  creates. The pipeline runs the whole suite on every push to the two long-lived
  branches and nightly.
- **Overlapping flows:** four. **(a) The boot sequence** registers a guest on
  mount when it has no user data — these cases depend on exactly that, which is
  why clearing before navigating is load-bearing rather than tidy.
  **(b) The shared recovery handler**, which prompts sellers and phone-verified
  shoppers but not guests; case 3 asserts a guest is not prompted, so a change
  there surfaces here first. **(c) The cart trigger**, shared with an existing
  browsing case. **(d) Refusals from chat, stories, the wallet and comments**
  raise the same prompt from a different cause, which is why the prompt
  assertion is scoped to this recovery's window.
- **Ordering / lockstep dependencies:** none. Nothing here must land alongside
  anything else, and no case depends on another case or another spec file having
  run first.
- **What breaks if this is wrong:** a locator added under a name that already
  means something changes behaviour for existing cases, and the failure appears
  far from this change. Omitting the clear before the navigation produces cases
  that hang and then fail — the defect three previous rounds of this plan
  contained, in three different disguises. Requiring the absence of a request
  that can legitimately occur produces a case that fails against a correct app.
- **Two things inherited rather than enforced, stated plainly:** the real-staging
  project records no trace, video or screenshot, and the pipeline uploads no
  artifact. **Neither is checked by this ticket.** If either changed, these
  cases would put credential-bearing request headers into a world-readable file,
  because this repository is public. A guard was drafted and removed for being
  scope beyond every criterion and the only change able to fail all thirty-four
  cases; the exposure is therefore acknowledged, not closed. These cases also
  push synthetic recovery failures into the error tracker on every run — a
  handful per run, accepted at intake, recorded here so alert tuning is not
  surprised.

## Validation strategy

- Validation profile: none. No profile in the project configuration runs a
  single browser case, so naming the closest would claim this ticket is proven
  by checks that never execute it (VP-5).
- Static checks: the repository's lint and its type check, both covering the
  test directory.
- The whole browser suite against real staging — existing and new cases
  together, since they share one server and one dataset.
- **The mutation check: one representative inversion per case, three in total**,
  each against a single already-built server, filtered to the case under test.
  Required rather than optional — a research spike on this ticket produced a
  case that passed while asserting on something that never happened.
- A one-off manual confirmation that each prompt locator matches when its prompt
  is forced (step 9), because no automated check here can prove it.
- **No separate secret scan.** With the digest gone, these cases produce no
  credential-derived string at all, so scanning their output would assert over
  an empty set. The control is the shape of what the harness returns — booleans,
  numbers and cookie names — plus the suite's existing rule that anything
  printed is masked.

## Rollback

Revert the commit. The suite returns to the cases it has today, and the shared
locator file and the three documents to their current contents. There is no
application code to undo, no configuration change, no migration, and nothing to
unwind on staging beyond the guests the run registered, which are accepted and
need no cleanup. Nothing in this ticket can stop the suite as a whole, now that
the global-setup guard is gone: a failure is confined to the three new cases.
The suite never gates a pull request, so a failure cannot block anyone while a
revert is prepared.

## Out of scope

- Everything the specification lists as out of scope, unchanged.
- **A guard enforcing the artifact policy.** Drafted and deliberately removed:
  the setting it protected is already correct and already documented, no
  criterion asks for it, and it was the only change in the ticket that could
  fail all thirty-four cases from a file that looks unrelated. The exposure is
  recorded in the integration surface instead of being half-closed.
- Enforcing the pipeline's no-upload rule, which stays a comment.
- Prompts raised by refusals from chat, stories, the wallet or comments.
- Adding any hook to an application component; both prompts already have them.
- Correcting the known wrong cart-contents reference in the shared locator file.
  Real, but its own ticket.
- The tester-only debug route that can set auth cookies from a request body:
  known, accepted, slated for removal, and recorded as such in the repository's
  instructions. This plan simply never uses it.
- Any change to the session lifetime or to the recovery itself.
