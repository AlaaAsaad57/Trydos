---
ticket: e2e-live-auth-session-proof
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-22
result: passed
score: 4/4
decision: PASSED
missed:
links:
  clickup:
  github:
---

# Comprehension — e2e-live-auth-session-proof

> Single-owner gate control (ADR-009 / ADR-012 / CG-1..CG-7). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. One section per gate — never overwrite another
> gate's section. The gate records its decision **only if 100% of answers are
> correct** (CG-4). Each question's options are listed **alphabetically** — the
> correct answer's position must carry no signal.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), incl. `plan.md >
> Integration surface` and the Step 1a panel findings. Answered before recording
> the `/review` decision.

### Attempt 3 — revision 3 of `plan.md` (current)

**Result: passed, 7/7** — full record (CG-2). New questions per CG-7; none
replayed. Questions 1-4 were answered when the gate was still heading for
`CHANGES_REQUESTED`; 5-7 were added when the owner chose `APPROVED`, so that
CG-6 is satisfied in full — one question per `major` panel finding, since an
accepted-as-risk finding is a finding the owner must first have understood.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | The sign-out settle wait was meant to key on the replacement guest being registered. Why does it fail, and what does it take down with it? | `plan.md > Approach` (AC-3/3b/3c), step 6; `spec.md > C-5`; `panel:senior`, `panel:security`, `panel:performance` | integration (CG-5) | **It fires on the request, and waitFor ignores marks** (correct) · LOGOUT-GUARD blocks the registration entirely · The recorder is page-scoped and the reload replaces the page · register-device is not on the watch list | It fires on the request, and waitFor ignores marks | Yes |
| 2 | Why does the plan's per-backend check for the storefront backend pass for someone who never signed in? | `plan.md > Steps` (2); `spec.md > AC-6`; `panel:senior` | correctness | **guest registration writes User-Data too** (correct) · MARKET-TOKEN is shared by guests and accounts · sanitizeUserData fills in defaults · The route is force-dynamic and uncached | guest registration writes User-Data too | Yes |
| 3 | `AC-4` asserts the session-expired prompt never appeared. Even with a working positive signal, why would that assertion still pass on a dead session? | `plan.md > Approach` (AC-4); `spec.md > AC-4`; `panel:senior` | correctness | **The prompt is armed two round trips after the cart request settles** (correct) · The prompt only renders for guests, never for accounts · The prompt shares a testid with the cart skeleton · video: on suppresses overlay rendering | The prompt is armed two round trips after the cart request settles | Yes |
| 4 | The plan proposed extending the shared credential helpers. What makes that risky beyond this ticket? | `plan.md > Steps` (3), `plan.md > Integration surface`; `panel:senior`, `panel:security` | integration | **GUEST-32 asserts credentialsHeld equals exactly two names** (correct) · The helpers run inside page.evaluate · The module is imported by proxy.ts · They are typed as a closed union | GUEST-32 asserts credentialsHeld equals exactly two names | Yes |
| 5 | The plan's comments-backend check would compare the token with `credentialsChangedSince`. Why is that a false green? | `plan.md > Steps` (3); `spec.md > AC-6`; `panel:security` | correctness (CG-6) | It compares against the wrong baseline · **It counts a cleared cookie as changed** (correct) · It only covers the two market credentials · It runs before the sign-in response lands | It counts a cleared cookie as changed | Yes |
| 6 | Extending the credential snapshot to carry the stored profile widens an existing weakness. What is it? | `plan.md > Steps` (3); `panel:security` | correctness (CG-6) | The snapshot is shared across browser contexts · The snapshot is written to disk between cases · **The snapshot object exposes its values to any printer** (correct) · The values are sent to the page via page.evaluate | The snapshot object exposes its values to any printer | Yes |
| 7 | The plan says no parsing happens anywhere, "closed by construction". Where does that claim not hold? | `plan.md > Approach`, step 4; `panel:security` | correctness (CG-6) | The cookie jar read in AC-3 · The reduced /api/auth/me read · The scenario document · **The sign-in outcome recorder** (correct) | The sign-in outcome recorder | Yes |

- Score: n/a

### Attempt 2 — revision 2 of `plan.md` (superseded)

**Result: passed, 4/4.** Decision recorded: `CHANGES_REQUESTED`. Questions covered
the `AC-4` cookie-read problem, the `User-Data` re-write after sign-out, the
`beforeAll` contradiction and the omitted country lookup. Kept for the record:

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | The revised plan's `AC-4` proof rests on a behaviour in shared application code. Which behaviour, and why does resting on it break the proof? | `plan.md > Approach` (AC-4 bullet), `plan.md > Integration surface`; `panel:senior` | integration (CG-5) | proxy.ts clears LOGOUT-GUARD on first navigation · **Refused tokens for a verified account are returned unchanged** (correct) · register-device deletes the sub-service cookies · The internal proxy injects the token server-side | Refused tokens for a verified account are returned unchanged | Yes |
| 2 | After sign-out and the reload that follows it, which cookie does the revised plan wrongly assume is gone? | `plan.md > "The AC-3 conflict"`, `spec.md > AC-3`; `panel:senior` | correctness | CHAT-TOKEN · LOGOUT-GUARD · **User-Data** (correct) · USER_ID_HASH | User-Data | Yes |
| 3 | The plan places the shared sign-in in two different places — step 6 says a `beforeAll` hook, the budget line says inside case 1. Why does that contradiction matter? | `plan.md > Steps` (6) vs `plan.md > Validation strategy`; `panel:performance` | correctness | A hook cannot create a browser context · **A hook failure skips the whole group** (correct) · Network recording is not allowed in beforeAll · The video would attach to the hook | A hook failure skips the whole group | Yes |
| 4 | Which cost did the plan's stated per-run budget leave out of its sum entirely? | `plan.md > Validation strategy` ("Expected per-run cost"); `panel:performance` | rollback / cost | **The country lookup** (correct) · The guest registration at boot · The sign-out request · The video encoding | The country lookup | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Attempt 1 — revision 1 of `plan.md` (superseded)

**Result: passed, 4/4.** Decision recorded: `CHANGES_REQUESTED`. Questions covered
the recorded one-login-per-run architecture, the `AC-4` cookie-read problem, the
`LOGOUT-GUARD` consumption on the post-sign-out reload, and the comments-token
claim (which later proved to be a wrong panel finding — see `review.md`).

### Note on question count (CG-1 / CG-6)

The floor is 3 with a mandatory integration question (CG-5); every attempt met
both. CG-6 seeds one extra question per `major` panel finding.

**Attempt 3 satisfies CG-6 in full.** Six majors survived de-duplication across
the three lenses, and all seven questions were answered — four on the findings
that invalidate a proof, three more added when the decision became `APPROVED`,
covering the remaining majors one for one. That matters here in a way it did not
at attempts 1 and 2: those gates *accepted* every finding into a revision, so
nothing was dismissed; this gate carries six findings forward as **accepted
risk**, and CG-6 exists precisely so a finding cannot be waved past without being
understood first.

Attempts 1 and 2 asked four questions each against 12 majors apiece, and carried
a recorded deviation for the rest. Both ended in `CHANGES_REQUESTED`, so no
finding was dismissed at either.

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-010) — CG-6 does not apply.

**Result: passed, 4/4.** Outcome recorded: `PASSED`.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan said the three cases would share one browser context held in memory. That turned out to be impossible. Why, and what does the implementation use instead? | `implement.md > Deviations from plan` (1); `plan.md > Integration surface` | integration (CG-5) | The fixtures file forbids building a context · The live project runs cases in parallel · The sign-out case closes the context · **Worker processes are discarded after a failure** (correct) | Worker processes are discarded after a failure | Yes |
| 2 | If this ticket's commit were reverted, what would come with it? | `implement.md > Changes prepared`; `plan.md > Rollback` | rollback | Application behaviour in the sign-in and sign-out routes · **Nothing outside tests and documentation** (correct) · The guest journeys GUEST-32 to GUEST-34 · The one-login-per-run globalSetup architecture | Nothing outside tests and documentation | Yes |
| 3 | `AUTH-01` finishes red on every run. Why does that satisfy `AC-8` rather than fail the ticket? | `spec.md > AC-8`, `C-10`; `implement.md > Validation run` | acceptance criteria | AC-8 is measured by the other four backends landing · AC-8 is satisfied because the case still reports a pass for the storefront · **AC-8 is satisfied by naming the wallet** (correct) · AC-8 only applies once the wallet backend is repaired | AC-8 is satisfied by naming the wallet | Yes |
| 4 | `AUTH-02` first failed with "the cart was opened but no backend answered it". What was actually wrong? | `implement.md > A red test that turned out to be the test, not the app` | runtime impact | The app never sends a cart request for a signed-in shopper · **The cart endpoint travels in a request header** (correct) · The credential had expired · The reload cleared the session | The cart endpoint travels in a request header | Yes |
