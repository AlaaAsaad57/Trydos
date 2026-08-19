---
ticket: e2e-guest-token-lifecycle
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-19
links:
  clickup:
  github:
---

# Verify — e2e-guest-token-lifecycle

> Final validation and impact review before the ticket is closed.

## Checks performed

> Reference acceptance-criteria IDs from `spec.md` (AC-1, AC-2, …).
> If `plan.md` named a validation profile, record each executed check resolved
> from `project-config.yaml` (profile → check → command), incl. exit code and a
> bounded output summary.

- Validation profile: **none** (VP-5). No profile in the project configuration
  runs a single browser case, so naming the closest one would have claimed this
  ticket was proven by checks that never execute it. The validation below is the
  free-form strategy the plan set out.

Every criterion at depth `all-ac` (VF-4).

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | GUEST-32 — after booting as a new guest, both credentials are held by name and the app can name who they are | `npx playwright test --project live` | 0 | `34 passed (1.3m)`; case at `session.live.spec.ts:110` green in 3.6s | **pass** |
| AC-2 | GUEST-32 — a registration was requested during the visit; other requests do not fail it | same run | 0 | `sawSince(mark, /api/auth/register-device)` true; no assertion on the rest of the boot sequence | **pass** |
| AC-3 | No case names a country, a product or a guest, and none asserts a call count | inspection + same run | 0 | The country comes from the app's own answer to four candidates; the recorder exposes `sawSince` only and has no count; identity is compared to an earlier reading of itself | **pass** |
| AC-4 | GUEST-33 — the working credential is spoiled, the cart opened, and both stored credentials end up different | same run | 0 | `changed.access` and `changed.refresh` both true; case green in 5.6s | **pass** |
| AC-5 | GUEST-33 — the identity is unchanged, a renewal was requested, no registration was | same run | 0 | `whoAmI` equal to the earlier reading; `refresh` seen since the spoil; `register-device` not seen since the spoil | **pass** |
| AC-6 | GUEST-34 — both credentials spoiled, the cart opened, both end up different | same run | 0 | `changed.access` and `changed.refresh` both true; case green in 5.3s | **pass** |
| AC-7 | GUEST-34 — the identity differs, a renewal was attempted, then an expiry requested | same run | 0 | `whoAmI` differs from the earlier reading; `refresh` then `expire` both seen since the spoil. The expiry request **is** the re-registration — that route mints the guest server to server, so no registration request is visible in this path | **pass** |
| AC-8 | GUEST-34 — neither prompt appears | same run | 0 | `session-expired-login` and `input-phone-number-field` both hidden, asserted after a positive anchor with a 2s timeout. **See the caveat below** | **pass (with caveat)** |
| AC-9 | No credential value is compared, printed or stored | inspection of `harness/session.ts` | n/a | The module returns booleans, names, and a snapshot whose `toJSON`/`toString` yield a label. No digest and no length is produced anywhere. The spoil helper reads real records only to copy attributes and returns name, domain and path | **pass** |
| AC-10 | Each case starts from a freshly registered guest and reaches its final assertion inside the budget, failing visibly otherwise | same run | 0 | Whole-case durations 3.6s, 5.6s, 5.3s — the measured window is a subset of each, far inside the 30s budget. `withinWindow` asserts elapsed before and after the behavioural assertions and reports the recorded path list on failure | **pass** |
| AC-11 | The run leaves only the guests it registered and never alters the backend to provoke a refusal | same run + inspection | 0 | Four registrations per clean run of this spec. Every refusal is provoked by writing the browser's own cookie store; the app's debug route that can set auth cookies is never used | **pass** |

**Outcome: PASSED** — every criterion passes.

### Caveat recorded against AC-8

The assertion runs and passes, but the plan asked for each prompt locator to be
confirmed by forcing its prompt on screen once. Forcing them needs a
phone-verified session this ticket does not have. The hooks were confirmed by
reading the components instead
(`components/Login/Enhanced/screens/SessionExpiredScreen.tsx:61,68` and
`components/Login/Enhanced/ui/RdbPhoneInput.tsx:333`).

This is weaker in a specific way worth stating: **an absence assertion passes
when its locator matches nothing.** If either hook is renamed, AC-8 keeps
passing while proving nothing, and the mutation check cannot catch it — inverting
an absence assertion fails whether or not the locator binds. The criterion is
met today; the guard against it silently stopping being met is not in place. The
ordering ticket, which will have a verified session, is where that becomes
cheap.

## Commands run

- `npx eslint tests/e2e/`
  ```
  exit 0 — no output
  ```
- `npx tsc --noEmit`
  ```
  exit 0 — no error in tests/e2e
  ```
- `npx playwright test --project live`
  ```
  ✓ 1–31  the existing guest and locale cases
  ✓ 32    a first visit registers the guest and leaves them able to act (3.6s)
  ✓ 33    a refused credential is exchanged, and the guest stays the same guest (5.6s)
  ✓ 34    a refused pair issues a new guest, and never asks anyone to sign in (5.3s)
  34 passed (1.3m)
  ```
- Working-tree check, before and after the suite ran
  ```
  git status --porcelain | md5sum
  0061d862543732596ac5a2a9894cd0bf   (before)
  0061d862543732596ac5a2a9894cd0bf   (after)
  ```
  Identical, so validation modified no file (VF-7 / VP-2).

**Mutation check, carried out during implementation and recorded here as
evidence** — one representative inversion per case; all three went red, then were
restored and the suite re-run green. This was required rather than optional: a
research spike on this ticket produced a case that passed while asserting on
something that never happened, so "it is green" is not by itself evidence here.

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **No.**
- Were any of this repository's protected runtime paths changed? **No** —
  `proxy.ts`, `next.config.ts`, the instrumentation and Sentry configuration, and
  `.github/workflows/**` are all untouched. The seven changed files are four test
  files and three documents.
- **Runtime impact on the product: none.** No application source changed.
- **Runtime impact on the pipeline:** the suite gains three cases, adding roughly
  fifteen seconds to a job dominated by the build. It creates four real guests on
  staging per run, on every push to the two long-lived branches and nightly,
  with no cleanup — accepted at intake and now recorded beside rule 6 in
  `tests/e2e/README.md` so the exception is visible where the rule is.
- **One exposure remains open and is stated rather than closed:** the
  real-staging project records no trace, video or screenshot, and the pipeline
  uploads no artifact, but **neither is enforced by this ticket**. A guard was
  drafted and deliberately removed at review for being scope beyond every
  criterion and the only change able to fail all thirty-four cases. If either
  setting changed, these cases would put credential-bearing request headers into
  a world-readable file. It belongs to a suite-wide ticket.
- **Not measured:** the volume of synthetic recovery failures these cases push
  into the error tracker. A follow-up asked for a number rather than an
  adjective; reading it needs access to the Sentry project, which this
  environment does not have. Left open rather than guessed at.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: developer (single self sign-off; comprehension gate passed 4/4 at
  this gate, 6/6 at review — see `comprehension.md`)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: the plan's declared Integration surface held, with one addition found
  during implementation — `serverRequests/HandleAuthedFetch.ts` reacts to the
  same refused credential during a server render inside the window. Verified
  benign: its cookie-writability probe throws in a pure render, so it returns the
  refusal unchanged, mints no guest and rotates nothing. It is recorded because a
  red case 2 or 3 would be misdiagnosed there first.
