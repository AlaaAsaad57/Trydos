---
ticket: e2e-guest-token-lifecycle
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-19
links:
  clickup:
  github:
---

# Implement — e2e-guest-token-lifecycle

> Record of what was actually built, following `plan.md`.

## Changes made

Three browser cases covering a guest's credential from issued to replaced, plus
the shared machinery they need and the documents that describe them. Seven
files, exactly the seven the approved plan lists. No application source, no
runtime configuration, no protected runtime path.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `tests/e2e/harness/session.ts` — **new.** The credential machinery: making one
  or both stored credentials unusable, telling whether the stored pair changed,
  and recording which authentication requests a page made. Enforces the one rule
  the ticket rests on — no credential value leaves the module in any form.
  `snapshotCredentials` holds values inside an object whose `toJSON` and
  `toString` return a label, so printing one yields nothing;
  `credentialsChangedSince` answers with two booleans; `credentialsHeld` answers
  with names; `spoilCredentials` reads real records only to copy their
  attributes and returns name, domain and path.
- `tests/e2e/actions/auth.ts` — **new.** The two verbs, in the module the design
  document reserves for them: `bootAsNewGuest` (find a served country, clear
  every cookie, seed the locale, navigate fresh, wait until the guest really is
  registered) and `whoAmI` / `whoAmIWhenReady` (the numeric identifier only).
- `tests/e2e/session.live.spec.ts` — **new.** The three cases.
- `tests/e2e/selectors.ts` — locators for **both** prompts, the session-expired
  screen and the phone entry, so `AC-8` is covered as written rather than
  narrowed.
- `docs/testing/E2E_TEST_DESIGN.md` — the two stale lines: the file map now
  lists `locale.ts` and `auth.ts` under `actions/`, and the action table records
  the two verbs that exist today against the four that arrive with the ordering
  ticket.
- `docs/testing/E2E_SCENARIOS.md` — three rows (GUEST-32 to GUEST-34), and the
  section header corrected: it claimed the guest journeys were read-only, which
  these three are not.
- `tests/e2e/README.md` — the new spec named in the built list, and the accepted
  exception to rule 6 recorded **beside rule 6**, where someone reading the rule
  will meet it.

## Deviations from plan

Six, all discovered by running the cases rather than by reading them. None
changes what is proven.

1. **The country is found by probing candidates, not by reading the app's own
   answer.** The plan said to ask the app which country it serves with a single
   request. Over loopback there is no country to detect, so the app always
   answers with its default — and `components/Home/Init.tsx:196` shows the
   region picker on **any** address under that default, whatever the cookies
   say. The picker is a full-screen backdrop, so every later click in the case
   was swallowed by it. The implementation now offers the app four candidate
   countries, one request each with the redirect not followed, and boots on the
   first it serves. Still no page rendered and no guest created by the lookup,
   which was the point of the plan's instruction; the answer still comes from
   the app, so no country is hard-coded.
2. **Cases boot on the locale home page, not a plain page.** The plan chose
   `/about` because it is cheaper. The cart control in the navigation bar is not
   clickable there, and opening the cart is the authenticated action these cases
   need. The home page is the surface an existing browsing case already proves
   the cart opens from.
3. **`bootAsNewGuest` waits for the credentials to exist, not for the
   registration request.** The recorder listens for requests being *sent*, so it
   reported the registration before the response had written a single cookie.
   The first run failed on exactly this: the case read an empty cookie jar and
   an unnamed guest. It now waits until both credentials are present.
4. **The locale is seeded by `url`, not by `domain` and `path`.** The server is
   reached at an IP address, where a cookie written with an explicit domain is
   not reliably matched back. The seeding silently did nothing and the picker
   appeared anyway.
5. **The mutation check ran as one pass with one inversion per case, rather than
   three filtered passes.** The three cases are separate tests, so a single run
   proves each fails independently — the same evidence for a third of the cost.
6. **Two follow-ups landed here rather than in `plan.md`.** Review follow-up 5
   asked for the registration gate to be stated accurately and for the
   server-side authed fetch to join the overlapping flows. `plan.md` is not in
   the approved list of files to change, so both are recorded below instead of
   edited into it.

**The registration gate, accurately:** `services/home.ts:369` registers when it
finds **no token cookie** (`if (!hasMarketToken)`), not when it finds no user
data. Clearing every cookie is correct under either reading, and the token-cookie
gate is also what makes case 2's "no registration was requested" safe — a
present-but-spoiled token suppresses registration, which is exactly the state
case 2 creates.

**A fifth overlapping flow:** `serverRequests/HandleAuthedFetch.ts` reacts to the
same refused credential during any server render inside the window. It is
benign — the cookie-writability probe throws in a pure render, so it returns the
refusal unchanged, mints no guest and rotates nothing — but it is the other half
of the flow this ticket is about, and a red case 2 or 3 would be misdiagnosed
there first.

## Validation run during implementation

- `npx eslint tests/e2e/` — passes, no output.
- `npx tsc --noEmit` — passes, no error in `tests/e2e`.
- `npx playwright test --project live` — **34 passed** in 1.3m. The 31 existing
  cases and the 3 new ones together, against real staging.
- **Mutation check — one representative inversion per case, all three failed.**
  Case 1: the registration assertion inverted. Case 2: the identity-survives
  assertion inverted. Case 3: the identity-differs assertion inverted. All three
  went red, then were restored and the suite re-run green. This was required
  rather than optional: a research spike on this ticket produced a case that
  passed while asserting on something that never happened.
- **The absence locators bind (plan step 9).** Confirmed by reading the two
  components rather than by forcing the prompts: `session-expired-login` and
  `session-expired-guest` are in
  `components/Login/Enhanced/screens/SessionExpiredScreen.tsx:61,68`, and
  `input-phone-number-field` in
  `components/Login/Enhanced/ui/RdbPhoneInput.tsx:333`. **This is weaker than
  the plan asked for** — the plan wanted the prompts forced on screen once and
  the match observed. Forcing them needs a phone-verified session, which this
  ticket does not have and the ordering ticket will. Recorded as an open
  weakness rather than claimed as done.

### The time arithmetic (review follow-up 2)

Named so the budget claim is arithmetic rather than assertion.

| Phase | Wait | Budget |
|---|---|---|
| Before the window | country lookup (4 requests, no render) | ~1s observed |
| Before the window | boot navigation | 25s cap |
| Before the window | registration and credentials arriving | 15s cap |
| **In the window** | cart button visible and clicked | 10s cap |
| **In the window** | recovery observed | 12s cap |
| **In the window** | settle after the retry | 1.5s fixed |
| **In the window** | prompt absence, twice | 2s each |
| **In-window total** | | **27.5s ≤ 30s budget** |
| Whole case worst credible | 41s before + 27.5s in window | **68.5s ≤ 90s per-case timeout** |

Every in-window wait carries its own short timeout instead of inheriting the
suite defaults (20s action, 45s navigation, 15s expect), which is what makes the
sum meaningful.

### Measured, not estimated

- **Case durations, whole case including boot:** 3.4s, 7.1s, 7.7s. The measured
  window is a subset of each, so it is far inside the 30s budget — the cap
  exists for a slow staging day, not for a normal one.
- **Guests per run:** four registrations per clean run of this spec — one per
  case, plus the one case 3 re-registers. The country lookup creates none, which
  is one better than the plan's estimate of about five.
- **Error-tracker volume: not measured.** Review follow-up 3 asked for a number
  rather than an adjective. Reading it needs access to the Sentry project, which
  this environment does not have. Left as an open item rather than guessed at.
