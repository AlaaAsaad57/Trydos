---
ticket: e2e-live-auth-session-proof
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-22
links:
  clickup:
  github:
---

# Review — e2e-live-auth-session-proof

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

**Round 3.** The amended `spec.md` (`AC-1`..`AC-8`, with `AC-3` split into
`AC-3` / `AC-3b` / `AC-3c`) and `plan.md` **revision 3**. The advisory panel
re-ran read-only over both, and was asked to **verify specific claims** rather
than review generally — that is where rounds 1 and 2 found their real defects.

The gate was opened with `APPROVED`, moved to `CHANGES_REQUESTED` once the
re-review evidence was surfaced, and was then recorded as **`APPROVED`** when the
owner, having seen and understood all six majors, chose to carry them as accepted
risk rather than run a fourth planning round. The panel blocked nothing at any
point (RP-2); the comprehension gate was the only control, and it passed 7/7.

## Plan Summary

Three cases, declaration order, one shared context, one real sign-in, no serial
mode and no `beforeAll`. `AC-4` by outcome — reload, open the cart, wait for it
to settle, then assert the session-expired and phone-entry prompts never appeared
and the account is unchanged and still phone-verified, with rotation allowed.
Sign-out settled by waiting for the replacement guest's registration. Per-backend
judgement from a reduced `/api/auth/me` read, the comments token through the
opaque credential helpers, and the app's own labels for naming. No cookie parsed
anywhere.

## Risks

- **Four acceptance criteria pass green on a broken session.** `AC-3`, `AC-3b`
  and `AC-3c` read a jar that never received its replacement guest; `AC-4` reads
  an absence before the failure it must catch can arrive.
- The per-backend check for the storefront backend passes for a plain guest.
- The plan proposes extending shared helpers whose semantics were built for guest
  rotation, where "changed" and "a request happened" are the right questions. For
  sign-out and reload they are the wrong ones.
- Extending those helpers widens a printing weakness from two token values to
  name, phone and email.

## Assumptions

- The wallet backend stays broken on staging (`C-10`).
- The test number stays on the app-side one-time-code allowlist (`C-1`).
- Verification happens from a machine that can reach the staging search node
  (`C-7`, `OQ-9`).

## Open Questions

- What is the concrete post-recovery anchor for `AC-4`? The refused-token chain
  needs two round trips after the cart request settles, so any absence read
  before that point is meaningless.
- Do the harness changes this ticket needs belong to this ticket at all, or to a
  ticket of their own? Three of the six majors are properties of shared code that
  `GUEST-32`..`GUEST-34` already depend on.

## Panel Findings (advisory)

> Advisory only (RP-2). De-duplicated across the three lenses; the higher
> severity is kept where lenses overlapped. Claims the owner verified directly
> against the code are marked *(verified)*.
>
> **Disposition for this gate: the six `major` findings are carried as ACCEPTED
> RISK into `/implement`, not as blockers.** Each was understood at the
> comprehension gate first (CG-6 — one question per major, 7/7, see
> `comprehension.md > Attempt 3`). Each row's disposition below is the fix
> `/implement` applies where it is cheap, and the consequence the owner is
> knowingly accepting where it is not.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior + security + performance | major | **The sign-out settle signal is a no-op, and unsound even if fixed** *(verified)*. `waitFor` scans the whole history (`harness/session.ts:272`), so case 1's boot registration satisfies it instantly. And it fires on the **request** (`page.on("request")`), at which moment the jar is still post-sign-out: the three shared names are absent, `credentialsChangedSince` scores absent-now as "changed", and the app names nobody. `AC-3`, `AC-3b` and `AC-3c` therefore **all pass** on a jar that never received its guest. | plan Approach (AC-3/3b/3c), step 6; `C-5` | **Accept.** Needs a mark-aware wait **and** a wait on the guest *landing* — poll until the credentials are present again, the `bootAsNewGuest` pattern — before any jar read. A timeout is a failure, not a proceed. |
| senior + performance | major | **`AC-4` has no positive signal, and reads too early even with one** *(verified)*. `openCart` only clicks (`nav.ts:225-229`) and no market path is on `WATCHED_PATHS`, so nothing can observe the cart request settling. Worse, the refused-token chain is 401 → `RefreshSession` → `ExpiredUser` → arm prompt — two further round trips **after** the cart settles — so `toBeHidden` returns instantly and the absence passes on a dead session. | plan Approach (AC-4) step 2; `AC-4` | **Accept.** Name a concrete post-recovery anchor: race the prompt against loaded cart contents, or wait until the recovery could no longer arrive. Note `cartPage-container` is on the skeleton as well as the real cart, so it is not an anchor on its own. |
| senior | major | **The storefront backend's boolean is a false green** *(verified)*. `/api/auth/me` returns `user` from `User-Data`, which `register-device` writes for a plain guest too, so "user is non-null" is true with no sign-in at all. Only `is_phone_verified === 1` separates them. | plan step 2; `AC-6` | **Accept.** The storefront judgement is the phone-verified flag, not the presence of a profile. |
| security + senior | major | **`credentialsChangedSince` counts present→absent as "changed"** *(verified, `harness/session.ts:126`)*. A comments token that was **cleared** reads as "the comments part landed" — a false green on the exact per-backend failure class `AC-6`/`AC-7` exist for, and the same flaw weakens `AC-3b`. | plan step 3; `AC-6`, `AC-3b` | **Accept.** Assert changed **and** currently held; extend the names-only held check rather than reusing the change check alone. |
| security | major | **The credential snapshot is not opaque to a printer** *(verified, `harness/session.ts:105-108`)*. `values` is an enumerable own property; `toJSON`/`toString` are bypassed by `util.inspect` and pretty-format printers. Extending it to carry `User-Data` and `USER_ID_HASH` turns one accidental print from two tokens into name, phone and email. | plan step 3 | **Accept.** Hold values in a module-level `WeakMap` keyed by the snapshot (or non-enumerable plus an inspect override) so the returned object carries only `taken`. State it in the plan; do not inherit the current shape. |
| security | major | **"No parse anywhere / closed by construction" is overstated.** It holds for cookies, but the kept sign-in outcome recorder still reads the app's richest body (`data.user` = phone, email, name). A rejection inside the async handler surfaces as an unhandled rejection whose message quotes the body prefix into the unmasked reporter log. | plan Approach, step 4 | **Accept.** Round 2's discipline stays as worded: every body read in try/catch rethrowing a fixed sentence, never `err.message` in an assertion, a failed read maps to the fail-closed "not observed" outcome. |
| senior | minor | **The "existing sign-in row is replaced" claim is false** *(verified)*: `E2E_SCENARIOS.md` holds only `GUEST-01`..`GUEST-41` and has no row for `auth.live.spec.ts`. Its preamble also says "Nothing logs in", which the new section falsifies. | plan steps 7-8 | **Accept.** Drop the claim; add the rows and amend the preamble. |
| senior | minor | **`openCart` is misattributed.** `GUEST-33`/`GUEST-34` use their own `openCartAndSettle`; the shared `openCart` is deliberately a click-and-return because a browsing case depends on it staying that way. | plan Approach, Integration surface | **Accept.** Leave `nav.ts` untouched, put the wait in the new spec, correct the attribution. |
| senior | minor | `AUTH-03` inherits the Elasticsearch coupling too, not just `AUTH-02`, because one shared page left on the home page signs out from an ES-backed page. | plan Integration surface | **Accept.** Say both carry it, or return to the static page before signing out. |
| senior | minor | Extending the shared helpers is safe only if `credentialsHeld` and the `{access, refresh}` keys stay frozen — `GUEST-32` asserts the held list is exactly two names and `bootAsNewGuest` polls its length. | plan step 3 | **Accept.** State both explicitly as unchanged. |
| security + performance + senior | minor | A hand-built context inherits **none** of the fixture behaviour the plan assumed: not `actionTimeout`/`navigationTimeout`, not `screenshot: only-on-failure`, and `recordVideo.dir` must be pointed at the artifacts directory or the video lands outside the encrypted, gitignored path. | plan Integration surface, Validation | **Accept.** List every option explicitly, and close the context in teardown so the video flushes. |
| performance | minor | The wall-clock sum still omits `chooseRegionIfAsked`'s flat **10s** wait *(verified, `nav.ts:44`)*, paid on every `gotoAbout`/`gotoHome`, plus two ES-backed home renders in `AUTH-02`. | plan Validation | **Accept.** Restate the per-case sums with the region wait counted. |
| performance | minor | "The realistic ceiling is 2 sends" still assumes a bounded retry; the cooldown is scraped and slept uncapped, so a single retry can consume the whole case. | plan Validation | **Accept.** Say "a single cooldown retry may consume the whole case". |
| performance | minor | The plan never says whether the three cases share one page. The recorder is page-scoped, so a new page silently loses its history. | plan Approach, step 7 | **Accept.** State "one context, one page, one recorder, created in case 1". |
| performance | minor | `gotoHome` does not seed the locale; `AUTH-02` escapes the region picker only because case 1 seeded it. Run alone it pays the picker plus a reload. | plan Approach | **Accept.** Record the ordering dependency or seed before the home navigation. |
| security | minor | The recorder listener lives on the shared page for all three cases, so the post-sign-out boot also hits watched paths and re-triggers body reads outside the case that owns them. | plan step 4 | **Accept.** Scope the recorder to case 1, or stop mapping once the first sign-in outcome is captured. |
| security | minor | `AC-3`'s "gone" check must not repeat the pattern being deleted: the current `verifyCookiesSet` asserts over whole cookie records, which prints the jar **with values** on failure. | plan step 5 | **Accept.** Assert over a sorted array of cookie **names**; never pass a cookie record to an assertion. |
| senior | minor | Over-engineering: the recorder is kept for failure wording alone and is the only component that reads a response body, on the one route whose body is richest. `C-9` says "should", and the spec's own edge case says an empty answer counts exactly like no answer. | plan step 4 | **Accept as a question for the revision.** Re-decide; if kept, say plainly it buys wording only. |
| senior | info | **`prompt.phoneEntry` and the auth widget's phone input share one testid** *(verified — `selectors.ts:105` and `:119`, both `input-phone-number-field`)*, so `AC-4`'s "phone-entry prompt never appeared" also goes red if `AUTH-01` merely leaves the widget open. | plan Approach (AC-4) | **Accept.** `AUTH-01` must end with the widget closed. |
| senior | info | `register-device` refuses while `LOGOUT-GUARD` is set, and the guard is cleared only on a real render, never on a redirect hop. A post-sign-out reload that redirects registers no guest at all, and the failure would read as "sign-out never settled". | plan step 6 | **Accept.** One sentence so a red run is diagnosed as the guard, not the app. |
| performance | info | **The `servedCountry()` claim is confirmed correct.** It is called only from `bootAsNewGuest`; `gotoHome` and `gotoAbout` do not reach it, so the untimed four-candidate lookup is genuinely off this ticket's path. | plan Validation | **Accept** — no action; the plan's statement stands. |
| senior | info | As planned, `AC-1` proves only "the stored profile carries an id and is phone-verified" — the run knows the phone, never the account id, so it cannot be checked harder. | plan step 2; `AC-1`, `OQ-6` | **Accept.** Record the limit so `/verify` does not read `AC-1` as more than it proves. |
| security | info | No `observability/**` path and no protected runtime path; test and documentation files only, revertable in one commit. | plan Files to change, Rollback | **Accept** — proceed. |

## Decision

`APPROVED`

- Rationale: the part of this ticket that carries its business value is sound and
  is blocked by none of the findings. The five-backend sign-in proof (`AC-1`,
  `AC-2`, `AC-5`, `AC-6`, `AC-7`, `AC-8`) needs no shared-harness change, no
  settle timing and no response-body read, and it is what makes the current
  wallet outage visible and named. Three planning rounds have each converged on
  the same two hard proofs — `AC-3`/`AC-3b`/`AC-3c` and `AC-4` — whose remaining
  questions are about timing and ordering against a live backend. A written plan
  cannot settle those; a run can. The owner therefore proceeds to implementation
  with the six majors understood and accepted, rather than planning around them
  a fourth time.

- **What the findings mean for `/implement`.** As *planned*, four criteria can
  report success on a session that is gone: `AC-3`, `AC-3b` and `AC-3c` are read
  while the jar is still post-sign-out, and `AC-4` reads an absence before the
  recovery it must catch could arrive. The storefront judgement additionally
  passes for a plain guest unless it is taken from the phone-verified flag.

- **None of these is accepted as a shipped weakness** (owner's direction,
  recorded after the decision). Every one of the six majors is a **required fix**
  in `/implement`: the five cheap ones as written below, and the two hard ones —
  the sign-out settle and the `AC-4` anchor — as real signals that fail when the
  session is broken. What is accepted is the **order of work**: implementation
  proceeds now, and the two hard signals are solved in running code rather than
  in a fourth written plan. `/verify` still records every criterion honestly, and
  "not proven" is a failure to fix, not an acceptable result.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — decision recorded after the comprehension check
  passed **7/7** (`comprehension.md > Review gate > Attempt 3`), which satisfies
  CG-6 in full: one question per `major` panel finding, because a finding carried
  as accepted risk is a finding that must be understood before it is waved past.

## ADR reference

- ADR: none — but see Required Follow-up Action 1: whether the harness work
  belongs to this ticket is a decision worth recording if it is split out.

## Required Follow-up Actions

These do **not** block implementation — the ticket is approved. They are the
corrections `/implement` applies as it goes, ordered so the cheap ones that
remove a false green come first.

**Cheap, and each removes a false green — apply them:**

1. **Storefront judgement is the phone-verified flag**, not the presence of a
   profile. One condition, and it removes a criterion that passes for a guest.
2. **Comments: assert the token is currently held**, by name, not only that it
   changed — a cleared token must never read as "the comments part landed".
3. **`AC-1`/`AC-2`: assert scalars** — the id and the `httpOnly` boolean. Never
   pass a cookie record or a decoded profile to an assertion.
4. **`AUTH-01` ends with the auth widget closed.** `prompt.phoneEntry` and the
   widget's phone input share one testid, so an open widget makes `AC-4` red for
   the wrong reason.
5. **Assert cookie absence over a sorted array of names**, never over records.

**Constraints — do not make things worse:**

6. **Do not extend the shared credential helpers.** `credentialsHeld` and the
   `{access, refresh}` keys stay exactly as they are; `GUEST-32`..`GUEST-34`
   depend on both, and the snapshot is not opaque to a printer. If the sign-out
   case needs a different comparison, build it in the new spec.
7. **Keep the body-read discipline** for the sign-in outcome recorder — pathname
   only, no URL, no query string, closed union out, try/catch rethrowing a fixed
   sentence, fail-closed. "Closed by construction" covers cookies only.
8. **List every context option explicitly** (action and navigation timeouts,
   screenshot, video directory) and close the context in teardown so the video
   flushes.

**MUST FIX — no longer accepted risk (owner's direction, after approval):**

9. **Sign-out settle: fix it.** Wait for the replacement guest to **land**
   (credentials present again), not for the registration request. The existing
   `waitFor` is not mark-aware, so do not rely on it — build the wait in the new
   spec, not in the shared helper. `AC-3`/`AC-3b`/`AC-3c` must be genuinely
   proven. Parking them as "not proven" is **not** an acceptable outcome.
10. **`AC-4` anchor: fix it.** Find a signal that exists only after the
    401 → refresh → expire → prompt chain could have completed. `openCart` alone
    is not one, and `cartPage-container` also matches the skeleton, so it is not
    one either. `AC-4` must be genuinely proven.

**If either of these turns out to be blocked by the application rather than the
test**, the project rule in `CLAUDE.md` applies: confirm the bug in application
code first, then fix the smallest thing, then prove it with a test that was red
before the fix and green after. Application code may not be touched before that
confirmation.

**Documentation corrections:**

11. There is no existing scenario row to replace, and the `E2E_SCENARIOS.md`
    preamble says "Nothing logs in" — amend it. `openCart` belongs to neither
    guest case, so leave `nav.ts` untouched and put any wait in the new spec.
    `AUTH-03` carries the search dependency as well as `AUTH-02`.
12. Restate the wall clock with the 10s region wait counted, and say plainly that
    a single cooldown retry may consume a whole case.
