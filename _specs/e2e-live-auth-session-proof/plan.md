---
ticket: e2e-live-auth-session-proof
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-22
links:
  clickup:
  github:
---

# Plan — e2e-live-auth-session-proof

> Decide the approach before changing code. Plan only — no implementation here.
>
> **Revision 3** — written against the amended `spec.md` (`AC-3`, `AC-3b`,
> `AC-3c`) and round 2's nine follow-ups. Follow-up 1 (the spec amendment) is
> done; follow-ups 2-9 are answered here.

## Approach

Three cases in one file, in declaration order, over one shared context and one
real sign-in (`OQ-1`). No serial mode, and **no `beforeAll`** (follow-up 4): the
shared context is created lazily inside the first case, so `fixtures.ts`'s
`beforeEach` skip keeps working exactly as it does today and an unconfigured
machine still skips instead of failing.

**`OQ-10` — where the per-backend judgement gets its answer** — is settled here,
and differently from revision 2. It comes from **three** sources, none of which
is a cookie read in the test process: the reduced `/api/auth/me` answer for the
storefront, chat, stories and wallet parts; the opaque credential comparison for
the comments part; and the app's own failure labels for naming *why* a part is
missing (`AC-6`, `AC-7`). Where they disagree, the app's label is authoritative
for naming and the other two are the independent confirmation.

The revision's central change is that **every proof is now an outcome that
changes when the thing it tests breaks** (follow-up 2). Round 2 killed two proofs
that could not do that. What replaces them:

**`AC-4` — the session survives a reload.** Absence of a guest re-registration is
ruled out: `serverRequests/HandleAuthedFetch.ts:136` returns a verified shopper's
401 unchanged and never re-registers, so that absence is true whether the session
lives or dies. The app's real reaction to a refused token for a verified account
is to **arm the session-expired prompt** and wait for a re-verify
(`utils/fetchData.ts`, `outcome?.wasVerified`). So the case:

1. navigates to the home page and reloads;
2. **opens the cart** (follow-up 3 — this is the named action: `openCart` in the
   navigation actions, the same read-only, idempotent step `GUEST-33` and
   `GUEST-34` already use to provoke a real market-backed request; it creates
   nothing on staging) and waits for that request to settle;
3. only **then** reads the absences, so there is no quiet-period race
   (follow-up 2): the positive signal has already landed.

It asserts the session-expired and phone-entry prompts never appeared, and that
the app still names the **same account** and it is **still phone-verified**. A
token rotation is **allowed** — a successful refresh keeps the same verified
shopper signed in, so counting it as a failure would go red on correct behaviour.

**`AC-3` / `AC-3b` / `AC-3c` — signing out.** The wait keys on the replacement
guest being registered, not on a delay: boot calls `RegisterDevice()` when no
auth token exists (`services/home.ts:369`), and that path is already on the
recorder's watch list, so it is an observable event. Then the three criteria are
checked as the amended spec words them — the nine per-backend names **gone**, the
three shared names **changed**, and the account now named being a different,
unverified one.

**No cookie is parsed anywhere in this coverage.** `AC-1`'s identity comes from
`/api/auth/me`, reduced inside `page.evaluate` to an id and a verified flag; the
comparison of the three shared names goes through the existing opaque credential
helpers, which never let a value leave the module. That removes the parser-message
leak by construction rather than by rule (follow-up 6): there is no `JSON.parse`
and no `decodeURIComponent` in the test to throw a message carrying a fragment.
`AC-2` asserts the `httpOnly` **boolean**, never a cookie record.

**The sign-in outcome recorder stays** (follow-up 8), and here is the case that
cannot be named without it, which round 2 asked for: `/api/auth/me` reports a
failed sub-service as `null`, and `null` means *both* "the backend refused us"
and "the backend answered with nothing". `C-9` requires the coverage to say what
the app said so the test, the log and Sentry name the same thing — and only the
app's own label carries that distinction. It is kept under the discipline round 2
demanded: pathname matching only with no URL and no query string retained (the
sign-in endpoint is a `GET` carrying `otp` in the query), a **typed closed union**
for its output so nothing else can be returned, the body confined to one function
that maps and discards without keeping a reference, and fail-closed — a sign-in
response never observed is a failure, not "nothing failed".

**Which page each case runs on.** The sign-in case stays on `/about`, keeping it
off the search path so a search outage cannot hide the auth widget. The reload
case must move to the home page, because the cart control is not clickable on
`/about`. That couples `AUTH-02` to Elasticsearch; `pnpm e2e:health` is the
existing guard and the failure mode is already documented for the suite.

## Steps

1. **Selectors** — add the account-menu trigger (`avatar-options`) and the
   sign-out item (`logout`). Assert each resolves to exactly one element. The
   marker exists in **three** places — both branches of `UserAvatar.tsx` and the
   guest branch of `UserNavTopSection.tsx` — which are mutually exclusive, so
   exactly-one holds; it is never evidence of a signed-in session.
2. **Session reader** (`actions/auth.ts`) — one `/api/auth/me` call reduced
   **inside `page.evaluate`** to: the account id, whether it is phone-verified,
   and one boolean per backend. No names, no phone, no email, no token, no hash
   ever crosses into the test process.
3. **Credential helpers** (`harness/session.ts`) — extend the existing opaque
   snapshot and change-comparison to cover the comments token and the stored
   profile, so `AC-3b` and the comments check compare **booleans** and no
   credential value reaches a variable in the spec file (follow-up 6).
4. **Sign-in outcome recorder** (`harness/session.ts`) — as described in
   Approach: pathname-only, typed closed union, one mapping function that keeps
   nothing, fail-closed.
5. **Per-backend proof** — replace `verifyCookiesSet`. One assertion per backend
   on values already in hand (`AC-6`), each naming that backend and quoting the
   app's own label when it gave one (`AC-7`). Nothing auto-retries, and no
   judgement is made on a count. Run against staging as it stands, this is what
   reports the wallet by name (`AC-8`).
6. **Sign-out verbs** — open the account menu, sign out, wait for the sign-out
   request, the reload, and the replacement guest's registration.
7. **The spec file** — three cases, lazy shared context inside case 1. **The
   existing live sign-in case is replaced, not kept** (follow-up 7); its scenario
   row is replaced by the new ones.
8. **Scenario rows** (`AC-5`) — new `## Signed-in journeys` section,
   `AUTH-01`..`AUTH-03`, an id range of its own rather than a continuation of the
   guest range, replacing the existing sign-in row (`OQ-8`). No phone, code,
   account id or name in the rows.
9. **Design document** (follow-up 9) — record the shared-session-per-file rule
   and the per-backend rule; correct `E2E_TEST_DESIGN.md`'s present-tense "One
   login per run", which is future work until the money-path ticket lands; note
   the single permitted body reader and its bounded field; and fix the stale
   "90-second per-case timeout" comment in `actions/auth.ts` while in that file.
10. **Run the checks** and record the result, including which backends were
    named and the observed wall clock.

## Files to change

- `tests/e2e/selectors.ts` — two additions to the `auth` group.
- `tests/e2e/harness/session.ts` — credential helpers extended; sign-in outcome
  recorder added beside the existing request recorder under the same discipline;
  header rule amended to name this single permitted body reader.
- `tests/e2e/actions/auth.ts` — session reader, menu and sign-out verbs,
  `verifyCookiesSet` rewritten; stale timeout comment corrected.
- `tests/e2e/auth.live.spec.ts` — rewritten as three cases; the existing case is
  replaced.
- `docs/testing/E2E_SCENARIOS.md` — `AUTH-01`..`AUTH-03`; the existing sign-in
  row replaced.
- `docs/testing/E2E_TEST_DESIGN.md` — step 9.

**No application code changes** (`OQ-7`). No protected runtime path is touched.
`sendOtpWithRetry` is **not** modified — see the budget.

## Integration surface

- **Components / shared config touched:**
  - `tests/e2e/actions/auth.ts`, `tests/e2e/selectors.ts`,
    `tests/e2e/harness/session.ts` — all shared across specs.
  - `tests/e2e/actions/nav.ts` — `gotoHome` and `openCart` are used, not changed.
  - `tests/e2e/fixtures.ts` — **not changed, and deliberately not worked around.**
    Its `beforeEach` skip is why there is no `beforeAll`.
  - **Five application contracts are read, never changed:** the `/api/auth/me`
    response shape; the `is_failed` labels in the sign-in response;
    `HTTPONLY_COOKIE_NAMES`; the boot registration path
    (`/api/auth/register-device`), whose *occurrence* after sign-out is the
    settle signal; and the session-expired prompt, whose *non-appearance* is part
    of `AC-4`.
  - `playwright.config.ts` — read for the options the shared context is given
    explicitly; a hand-built context inherits no `use` block and would lose
    `baseURL`, `video` and `locale`.
- **Who else depends on them:**
  - `session.live.spec.ts` (`GUEST-32`..`GUEST-34`) imports `bootAsNewGuest`,
    `whoAmI`, `recordAuthCalls` and the credential helpers this ticket
    **extends**. Extending a shared helper is the highest-risk edit here: those
    three cases are another ticket's entire output.
  - `auth.scripted.spec.ts` uses the same widget verbs against mocks.
  - `guest.live.spec.ts` and `locale.live.spec.ts` share the selector file;
    `guest.live.spec.ts` also uses `openCart`.
  - `.github/workflows/test-e2e.yml` runs the live project and encrypts the
    artifacts.
  - The money-path ticket owns the future `storageState` login.
- **Overlapping flows:**
  - The credential helpers are extended, not replaced — the guest cases compare
    the same two names and must keep behaving identically.
  - The account menu also carries settings, notifications and compare.
  - The cleanup list must be imported as `HTTPONLY_COOKIE_NAMES` from
    `utils/cookies/cookie-manager`; the server copy pulls in `next/headers` and
    breaks the run.
  - `AUTH-02` runs on the home page and therefore shares the search dependency
    with the guest journeys.
- **Ordering / lockstep dependencies:**
  - Declaration order, one worker, **no serial mode** — a red sign-in case still
    lets the reload and sign-out cases run.
  - **The sign-out case stays last.**
  - **Presence versus absence:** the cleanup list contains the legacy
    `DEVICE-TOKEN`, never written by the app. Absence-only; never presence.
  - If `/api/auth/me`, the `is_failed` shape, or the boot registration path
    changes, these cases change in the same commit.
- **What breaks if this is wrong:**
  - A shared credential helper changed carelessly → `GUEST-32`..`GUEST-34` go
    red inside a ticket nobody is working on.
  - `beforeAll` reintroduced → the suite fails instead of skipping wherever
    staging is not configured, and a hook failure hides two of three cases.
  - Absences read before the cart request settles → a late re-registration or a
    late prompt passes green.
  - The recorder keeping a URL → a live one-time code in a public CI log.
  - Elasticsearch down → `AUTH-02` is red for a reason that is not this ticket's;
    `pnpm e2e:health` first.

## Validation strategy

- **Validation profile: none.** No profile covers the browser suite, and naming
  one would forbid writing the live-run commands here (VP-4). Free-form (VP-5).
- `pnpm lint` · `npx next typegen && npx tsc --noEmit` · `pnpm test:run` ·
  `pnpm e2e:health` · `pnpm test:e2e:live`.
- **Expected per-run cost (follow-up 5), stated honestly:**
  - **1** real one-time-code send expected. `sendOtpWithRetry` may retry, but
    **sends 3-5 are unreachable inside one case**: each attempt costs roughly 70s
    of timeouts before its sleep, against a 120s per-case timeout. The realistic
    ceiling is 2. It is knowingly left as-is (shared with the scripted suite), and
    its consequence is recorded: **a rate-limited run surfaces as a case timeout,
    not as a readable "rate limited" message**, because the cooldown sleep is
    parsed from an error string with no unit and is not capped.
  - **1** real sign-in, fanning out to five backends.
  - **2** guest registrations on staging — one at boot, one after sign-out.
  - **Wall clock:** expected 25-40s for the sign-in case and 10-25s for each of
    the others. There is no meaningful arithmetic worst case — the pure-timeout
    sum exceeds 300s, so **the 120s per-case timeout is the bound**, not a
    calculated figure. The previous "~60s worst case" was invented and is
    withdrawn.
  - **The country lookup is counted** (previously omitted): `servedCountry()`
    tries up to four candidates sequentially and `arriveAsGuest` issues a bare
    `fetch` with **no timeout** — `COUNTRY_LOOKUP_MS` is exported but never
    applied. These cases reach the page through `gotoAbout`/`gotoHome`, which do
    not call it, so it is not on this ticket's path; it is recorded here because
    it is an unbounded wait a future signed-in case would inherit.
  - **One continuous video** for the file rather than three. Size-checked at
    `/verify` **against a run that retried**, not a clean one.
- **Expected result (`C-10`):** the sign-in case red, naming the **wallet**
  backend, with the other four reported as landed. A green run, or a red run that
  names no backend, means the coverage is wrong.
- **Where it runs (`C-7`, `OQ-9`):** a machine or runner that can reach the
  staging search node directly. Otherwise `/verify` blocks the ticket rather than
  the health gate being relaxed.

## Rollback

- Test and documentation only: reverting the commit restores the previous
  behaviour exactly.
- The three cases can be removed without touching the shared files — except the
  credential-helper extension, which is additive and safe to leave, or revertable
  on its own.
- Nothing to clean up on staging beyond two guest registrations per run.

## Out of scope

- Repairing the wallet sign-in, or any backend this coverage names (`C-10`).
- Changing how the app behaves when a backend is lost (`C-8`).
- Capping or rewriting `sendOtpWithRetry`, and bounding the untimed country
  lookup — both shared, both recorded above instead.
- Building or superseding the `globalSetup` `storageState` architecture; the
  design document records the migration path only.
- Repairing the network path to the staging search node, or relaxing the health
  gate (`OQ-9`).
- Any application code change (`OQ-7`).
- Sign-up, wrong-code paths, more than one account, seller or wallet journeys.
- Bringing the rest of the suite up to the `CLAUDE.md` failure-message rule.
- Changes to the browser suite's continuous-integration configuration.
