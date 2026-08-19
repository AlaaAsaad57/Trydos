---
ticket: e2e-guest-token-lifecycle
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-19
links:
  clickup:
  github:
---

# Review — e2e-guest-token-lifecycle

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

Fourth and final review round, over the fourth revision of `plan.md`. Rounds one
to three returned `CHANGES_REQUESTED` with eleven, fifteen and thirteen
follow-ups. `spec.md` is unchanged since it was written.

The panel ran again, each lens told which fixes were claimed and asked to verify
them against the source rather than against the plan's account of itself. The
senior lens was also asked to state whether the plan is now implementable as
written.

The comprehension check was run and passed at **6/6** — the floor of three
including the mandatory integration question, plus one question for each of the
three `major` findings (CG-1, CG-5, CG-6, CG-4). It is recorded in
`comprehension.md`.

## Plan Summary

Three browser cases. Each obtains the country, **clears every cookie**, seeds the
country and language, and navigates fresh so the app mounts with no credentials
and registers a guest; the window is measured from that registration. A refusal
is provoked by overwriting the visitor's own credential through the browser's
cookie store, using a value of the shape the refusal was actually measured with.
The cart is the authenticated action. A renewal is proven by the identity
surviving with both credentials rotated; a new guest by the identity differing
with an expiry request, which is where the re-registration happens server to
server. No credential value leaves the harness in any form. Test-only, seven
files, no application source and no protected runtime path.

## Risks

- On a cold country cache the work before the measured window — a discovery
  navigation and the fresh navigation — is unbounded by anything except the
  suite's per-case timeout, so a case can exhaust that timeout before its own
  budget applies. Accepted with a required measurement during implementation.
- A failing case restarts the worker and drops the cached country, so the stated
  guest and time figures are green-run figures. A red run costs more of both.
- Case 3 needs several staging round trips inside a window capped by a session
  of about sixty seconds, so it is the case most able to go red on a correct
  app. Its real window is to be measured once and recorded.
- The artifact policy and the no-upload rule are inherited and unenforced. If
  either changed, these cases would put credential-bearing request headers into a
  world-readable file. Judged an acceptable residual risk for this repository —
  see Assumptions.
- An absence assertion passes when its locator matches nothing, and no automated
  check here can prove otherwise. A one-off manual confirmation is the mitigation
  and it cannot protect itself against a later rename.

## Assumptions

- The backend refuses a credential of the measured shape and that refusal drives
  the recovery. Measured during research; the plan was corrected this round after
  a previous refinement had moved it off that shape.
- A guest is recovered without a prompt. Read from the recovery handler and
  confirmed again this round in the code that sets the cancelled outcome when the
  dead session was not verified.
- Guests created on staging need no cleanup. Owner decision at intake.
- Accepting the unenforced artifact policy is reasonable for this repository.
  Verified this round: the real-staging project records nothing, the pipeline has
  no upload step at all, results are gitignored and masked before they are sent
  anywhere, and the credentials in flight are short-lived guest tokens carrying
  no personal data. The realistic worst case would already expose far more
  through the thirty-one existing cases, so the guard belongs to a suite-wide
  ticket rather than this one.
- The tester-only debug route that can set auth cookies is known, accepted and
  slated for removal; recorded in the repository's instructions and correctly not
  raised this round.

## Open Questions

- None. Every `OQ-n` from `research.md` is answered: OQ-1, OQ-2, OQ-3, OQ-5 and
  OQ-7 in `spec.md`; OQ-4, OQ-6 and OQ-8 in `plan.md` (PL-12 satisfied, RV-3
  checked).

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | major | The integration surface states the app registers on mount "when it has no user data"; the real gate is the absence of the token cookie. The plan's action is correct under either reading, and the true gate is also what makes case 2's "no registration requested" safe — a present-but-spoiled token suppresses registration. | plan Integration surface, Approach; AC-2, AC-5 | Accept as an implementation note. A wording correction to one clause, not a behavioural change; the implementer records the accurate gate when writing the cases. Understood at the gate (question 4). |
| performance | major | On a cold country cache the pre-window cost plus the window can exceed the suite's per-case timeout, so a case dies before its own budget applies. | plan Approach 1–3, step 5; AC-10 | Accept as an implementation note, with a required action: the discovery gets its own explicit short timeout and the per-case arithmetic is written down during implementation. Understood at the gate (question 5). |
| performance | major | A failing case restarts the worker and drops the cached country, so later cases pay a cold discovery again and the stated figures inflate. | plan AC-11 figures | Accept as an implementation note: the figures are recorded as green-run figures, with the red-run cost stated beside them. Understood at the gate (question 6). |
| performance | minor | The country could be read from a redirect with a single request instead of rendering the home page and its picker, removing the extra navigation, the extra guest and the cold-cache question entirely. | plan Approach 1, step 3 | Mitigate during implementation — this is the preferred resolution of both performance majors and uses a helper the suite already has. Recorded as a follow-up rather than another plan revision, because it simplifies rather than changes what is proven. |
| senior | minor | The second recovery implementation, the server-side authed fetch, also reacts to the refused credential during a render inside the window. Verified benign — it mints no guest and rotates nothing — but a red case would be misdiagnosed there. | plan Integration surface | Accept — recorded here so a future debugger looks in the right place. |
| senior | minor | The restored constant is right but the reasoning is not: masking does key on the value's shape, and no secret scanner runs in this pipeline, so the payload-marker justification designs around a constraint that does not exist. | plan Approach, step 2 | Accept — keep the constant, drop the rationale during implementation. The measurement was always the reason; the rest was decoration. |
| security | minor | With the mechanical check dropped, the masking rule is the sole output control, but the plan never says the new failure message passes through it. | plan step 5 | Mitigate during implementation — the failure message is built through the masking helper. One clause. |
| security | minor | "Copy every attribute" is bounded by what the browser automation exposes; anything it does not surface is silently dropped and the one-per-name check cannot detect it. | plan step 2; AC-11 | Accept — the attribute set is named explicitly during implementation and the copied record is asserted on, not just counted. |
| security | minor | The restored token-shaped constant will still be matched by shape-based masking and would make the secret helper answer true on a value that is not a secret. | plan step 2 | Accept — expect the noise; never assert the secret helper over output containing this constant. |
| senior | minor | The existing cart-opening step returns straight after the click, so the cases must do their own waiting and must not change that shared step. | plan steps 7, 8 | Accept — the wait belongs in the case; the shared step is not touched. |
| senior | minor | The claim that masking is the fallback control is broader than the truth: it is applied on the reporting path, not to the default reporter's assertion output. | plan Validation strategy; NFR-1 | Accept — the design produces no credential value, so the exposure is nil; the claim is softened during implementation and sits beside the other inherited-and-unenforced item. |
| senior | minor | Case 3 needs about five staging round trips inside a window capped by the session, so it is the case most able to go red on a correct app. | plan step 5; AC-10, C-1 | Mitigate — its real window is measured once during implementation and the figure recorded. |
| senior | minor | Reusing the locale coverage's discovery couples these cases to another area's cache, which the plan then spends two paragraphs neutralising; a self-contained alternative costs the same. | plan Approach 1 | Accept — resolved by the cheaper single-request discovery above, which removes the coupling rather than neutralising it. |
| performance | minor | Only one in-window timeout is given as a number, so "they sum under the budget" cannot be checked. | plan step 5 | Mitigate during implementation — every in-window timeout and their sum are written down. |
| performance | minor | The accepted response to a budget overrun is a re-run, whose pipeline cost is a full build plus the whole suite, and that cost is not stated. | plan step 5 | Accept — recorded, with the local traced re-run named as the intended first response. |
| security | info | The criterion still permits observing a credential's length; the plan is stricter and produces no value at all. | AC-9 vs plan Approach | Accept — implement to the stricter rule; the divergence is noted at verification so it is not read as licence later. |
| security | info | Clearing every cookie is context-scoped and safe today, but the ordering ticket will introduce a shared authenticated session that must never be cleared. | plan Approach 2 | Accept — recorded for that ticket. |
| security | info | Verified holding: records projected before any assertion, the spoil helper returns none and takes no logger, comparison is boolean, identity numeric and excluding the hashed identifier, recorder passive and path-only with exact matching, provocation browser-side only. | plan Approach, steps 2–3 | Accept. |
| security | info | No runtime configuration, no protected runtime path, no application source; rollback is a single revert. | plan Files to change, Rollback | Accept. |
| senior | info | **All three claimed fixes hold against the code, and the plan is implementable as written** — registration is browser-visible, the renewal rotates both credentials, the expiry route behaves as described, a guest is never prompted, both prompts already carry hooks, opening the cart really does fetch, the project records nothing and the pipeline uploads nothing. | plan | Accept — this is the finding the decision rests on. |
| senior | info | The design document's stale lines are exactly the two named, and the teardown rule the plan excepts is the one identified. | plan Files to change | Accept. |
| senior | info | The manual locator confirmation cannot protect itself against a later rename; the scripted project exists for that question if it ever becomes worth the cost. | plan step 9; AC-8 | Accept — smallest option, deliberately not expanded now. |
| performance | info | The guest arithmetic is conservative rather than wrong — the breakdown totals fewer than the figure stated. | plan AC-11 | Accept — over-estimating a resource figure is safe. |
| performance | info | Guests accumulate permanently at roughly ten a day in steady state; retention is deferred. | plan AC-11; C-2 | Accept — decided at intake, the rate is recorded so the retention decision has a number. |
| performance | info | Synthetic recovery failures reach the error tracker every run, but the volume is an adjective rather than a figure. | plan Integration surface | Accept — the observed count is recorded during implementation. |
| performance | info | The recorder's footprint is sound: passive, exact-match, discarded at capture, bounded, no interception. | plan step 2 | Accept. |
| performance | info | Clearing cookies is cheaper than the throwaway-context alternative, and asserting elapsed early costs nothing. | plan Approach 2, step 5 | Accept. |

## Decision

`APPROVED`

- Rationale: the recurring defect is fixed at its root. Three rounds found the
  same failure in three disguises — the plan asserting a precondition it never
  established: waiting for a registration in the expiry path, clearing
  credentials on a page already loaded, and letting the country discovery leave
  credentials behind. The revision now states the order literally and clears
  every cookie before the fresh navigation, which also removes the cold-cache
  fragility that made a filtered run behave differently from a full one. The
  other two blockers were resolved by restoring the token shape the refusal was
  actually measured with, and by deleting the artifact guard rather than scoping
  it. The senior lens verified every claimed fix against the source and states
  the plan is implementable as written; the security lens returned no major
  finding and judged the one open exposure a reasonable residual risk for this
  repository. Three `major` findings remain, and all three are accepted as
  implementation notes rather than plan changes: one is a wording correction to a
  dependency the plan already handles correctly, and two are cost and timing
  facts whose preferred resolution — reading the country from a single request
  instead of a rendered page — simplifies the plan rather than changing what it
  proves. Each was understood at the comprehension gate before being accepted
  (questions 4, 5 and 6). Over four rounds this plan has become smaller, not
  larger: a guard, a mechanical check and a digest helper were all removed. The
  panel did not force this decision and could not (RP-2).

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approval recorded, comprehension gate passed
  6/6 (`comprehension.md`).

## ADR reference

- ADR: none.

## Required Follow-up Actions

None block implementation. The following are carried into `/wf:implement` as
binding notes, each traceable to a finding accepted above.

1. Read the country from a single request rather than a rendered page, using the
   helper the suite already has. This is the preferred resolution of both
   performance majors: it removes the discovery navigation, the extra guest and
   the cold-cache question in one change.
2. Give the pre-window work an explicit short timeout and write down the
   per-case arithmetic, so the budget claim is arithmetic rather than assertion.
   List every in-window timeout and its sum.
3. Record the guest and time figures as green-run figures, with the red-run cost
   stated beside them, and record the observed error-tracker volume as a number.
4. Measure case 3's real window once and record the figure; it is the case most
   able to go red on a correct app.
5. State the registration gate accurately — the absence of the token cookie, not
   of user data — and add the server-side authed fetch to the overlapping flows,
   noting it is benign but is where a red case would be misdiagnosed.
6. Build the failure message through the masking helper; name the cookie
   attribute set explicitly and assert on the copied record rather than only
   counting; keep the restored constant and drop its rationale; soften the claim
   about what masking covers.
7. Do the waiting for the cart inside the case; do not change the shared
   cart-opening step, which an existing case depends on.
