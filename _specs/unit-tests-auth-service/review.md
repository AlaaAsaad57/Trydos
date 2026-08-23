---
ticket: unit-tests-auth-service
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-16
links:
  clickup:
  github:
---

# Review — unit-tests-auth-service

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Fourth and final round — APPROVED.** `major` findings by round: 5 → 3 → 2 → 1.
Every structural objection is closed and verified in the source. The one `major`
left is **dismissed at the gate** (RP-2 / CG-6) after the comprehension check
proved it was understood, and it is carried below as a binding note for
`/implement` rather than as a plan change — see the rationale for why that is
legitimate here and was not in rounds 2 and 3.

## Review Scope

`spec.md` (AC-1..AC-42) and the **third revision** of `plan.md`: six approach
decisions, an isolation / timers / teardown table with three ordering rules, 13
steps, 7 source files + 6 test files, integration surface, validation profile
`full`, rollback. The panel re-verified the load-bearing source claims this round
rather than reading them off the plan: the single storage write site and its four
read sites; that the server login route performs the chat, stories and wallet
logins itself, so the two client routines are genuinely dead; that the storage
write does precede the verified writes, so the reorder claim and its one stated
exception are both accurate; the four verify call sites; and the runner version
behind the spy-reset question.

## Plan Summary

Delete the dead paths first — the token chain whole across four write sites and
four read sites, plus the unused declarations, parameter and type — with the
changed-phone path reordered so its failure behaviour is preserved. Then write
four test files in the `tests/` mirror covering the sign-in service and the auth
state slice. State is observed through the real auth reducer, the outbound
boundary uses the existing stand-in with one stated exception for the session
file's gated reply, isolation is a per-file rule, and the profile of record is
`full`.

## Risks

- The removal, not the tests, carries the runtime risk: a caller the search
  missed would break chat or stories sign-in silently. Three layers guard it —
  search with every hit opened, the type check, and the production build.
- **Test-generation coupling in the session file.** `vi.resetModules()` replaces
  the service, the store and the spies together; a handle imported before the
  reset belongs to a dead generation. Two negative criteria (AC-20, AC-21) would
  pass vacuously and a gated reply could hang. Carried as follow-up 1.
- AC-39's shuffled re-run proves file order, not within-file order — the leak
  class this ticket actually risks. Carried as follow-up 2.
- A spy that queues a one-off reply and is not reset re-introduces order
  dependence on whichever spy was forgotten. Carried as follow-up 3.

## Assumptions

- The four sign-in screens behave identically after one argument is dropped;
  verified that all four pass an empty callback and the parameter is required.
- The server login route continues to perform the sub-service logins.
- Nothing reads the `idToken` field from the store — verified across `store/`
  and `components/` in two separate rounds.
- The state slice imports nothing, so driving the real reducer costs nothing.

## Open Questions

None. OQ-1..OQ-9 are answered in `spec.md` or `plan.md` (PL-12), and no question
raised at this gate is left open — each is a numbered follow-up below.

## Panel Findings (advisory)

> Advisory only (RP-2). This table covers **round 4**, against the third
> revision.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior + performance | major | `vi.resetModules()` detaches **every** handle, not only the service: the re-run factories build a new store and new spies, so a store handle or reset imported at file top belongs to a dead generation the service never writes to. AC-20 and AC-21 are negative assertions and would pass vacuously; a gated reply queued on a detached spy never releases and hangs to the timeout. | `plan.md` isolation table row 2; AC-19..AC-22 | **Dismissed as a blocker, accepted as binding guidance.** Understood at the gate (comprehension Q1). It changes no file, no scope and no dependency — only how one authorised test file is written — so it is follow-up 1 for `/implement`, with the in-repo `loadAuth()` pattern named. |
| senior | minor | AC-39's proof is a shuffled re-run **over files**, which does not exercise within-file order dependence — exactly the leak class round 3 raised. | `plan.md > Steps` 12; AC-39 | **Accept.** Follow-up 2: shuffle tests within each file, not just file order. |
| senior | minor | The targeted-reset rule names two spies by example, but the profile file also queues one-off replies on the session-read helper, the upload ticket helper and the global fetch stub. | `plan.md` isolation table rows 1 and 3; AC-24..AC-29 | **Accept.** Follow-up 3: enumerate the spies per file, keeping the rule "every spy this file queues on". |
| senior + performance | minor | The plan's stated reason for rejecting a blanket reset is wrong for this runner: on vitest ^4.1.10 a reset restores the implementation each stand-in was built with, and the navigation hooks are plain closures. | `plan.md` "Three points behind the table", bullet 2 | **Accept — verified independently.** Follow-up 4: correct the justification. The targeted reset stays; only the reasoning was wrong. |
| security | minor | The session file's local gated stub carries no "unqueued call fails" property, though the shared stand-in does — so in the file that owns AC-13 and AC-22 an unexpected outbound call resolves quietly and the test still passes. | `plan.md > Approach` decision 2; AC-13, AC-22, AC-37 | **Accept.** Follow-up 5: the local stub throws on any call with no queued reply, naming the address. |
| performance | minor | The fixed 1500 ms wait sits inside an awaited chain, so a synchronous clock advance either side of the call never fires it and each completing-leg test hangs to the default timeout. | `plan.md` isolation table row 3; AC-24, AC-26 | **Accept.** Follow-up 6: start the call, advance the clock asynchronously, then await. |
| performance | minor | The state-slice file has no per-test reset while the attempt counter starts at 4 and topics accumulate. | `plan.md` isolation table row 4; AC-30, AC-32, AC-33 | **Accept.** Follow-up 7: each test builds a fresh slice from the reducer factory — cheap, since the reducer imports nothing. |
| senior | info | Each service file registers its own send-code stand-in, shadowing the shared one whose default is a loud "no reply was set" failure; a bare spy default would let a forgotten reply pass quietly. | `plan.md > Steps` 7; AC-37 | **Accept.** Follow-up 8: the re-armed default is the same explicit failure reply. |
| security | info | If the step-8 test asserts the literal query string rather than that the typed values were carried, the future encoding fix reads as a regression. | `plan.md > Steps` 8, 13 | **Accept.** Follow-up 9. |
| senior | info | `spec.md`'s research-questions table cites stale AC numbers (OQ-3 → AC-27..AC-31 where FR-12 is AC-30..AC-34; OQ-4 → AC-24..AC-26 where FR-11 is AC-28, AC-29). The AC mapping table itself is correct. | `spec.md` OQ-3, OQ-4 rows | **Accept as a known artifact defect.** `/plan` may write only `plan.md` and `ticket.md`, and no command reopens `spec.md` from this state, so it is recorded here and noted in `implement.md`. It misleads nobody about coverage: the mapping table is authoritative. |
| senior | info | `services/auth.ts:250` holds a second dangling comment pointing at the block being deleted, while its twin in the session check is removed — the diff looks half-done. | `plan.md > Steps` 5 | **Accept.** Follow-up 10: remove both, or state why one stays. |
| security | info | The unencoded query interpolation stays unfixed with its remediation recorded as a "follow-up ticket candidate" — an artifact note with no owner or id. | `plan.md > Steps` 13 | **Accept.** Follow-up 11: file the follow-up ticket during `/implement` and put its id in `implement.md`. |
| performance | info | A blanket module reset per test re-executes the whole graph for every case in the session file, though only two singletons need it. | `plan.md` isolation table row 2 | **Dismiss.** Correctness before speed; the recorded per-file runtime will show whether it matters, and the loader in follow-up 1 is where it would be tuned. |
| security + performance | info | The residue position is correctly argued and takes no release dependency; per-file runtimes are recorded with no threshold; the hot-path effect stays net positive. | `plan.md > Files to change`; Steps 13 | **Accept.** No action. |
| senior | info | No over-engineering found: two new stand-ins with three callers each, no new config, no new alias, no coverage change; the integration surface matches the repo and the rollback is honest about the type-check coupling. | `plan.md` Integration surface; Rollback | **Accept.** No action. |

### Rounds 1–3 — closed

Round 1 raised 5 `major` findings and 14 follow-ups; round 2, 3 and 9; round 3, 2
and 13. All are confirmed resolved, and the substantive ones were re-verified in
the source rather than in the artifact: the token chain is whole; the duplicate
fetch stand-in is gone and the session file's local gated stub is stated openly
with the earlier false claim corrected; the release dependency is removed and the
version check's real side effects recorded; the changed-phone reorder preserves
the failure behaviour with its one exception stated; the reducer's explanatory
comments move before the type is deleted; the store is reset per test; the
rollback is honest; and the counts and cross-references agree throughout.

## Decision

`APPROVED`

- Rationale: the plan is sound, and four rounds of adversarial review have closed
  every objection that touched scope, the file list, a dependency, or behaviour.
  What remains is one `major` and ten smaller notes that all live **inside test
  files the plan already authorises** — they change no source file, add no file,
  remove no guarantee, and alter nothing the ticket depends on. That is the line
  this gate has been holding: rounds 2 and 3 were sent back because their findings
  changed *what would be deleted* and *what the ticket depended on*, which
  `/implement` may not decide for itself. Writing a test file's loader correctly
  is `/implement`'s own work, bounded by the approved plan and checked by the
  acceptance criteria it must satisfy. The `major` was dismissed only after the
  comprehension check proved the failure mode was understood — vacuous passes on
  two negative criteria and a possible hang — and it is recorded below with the
  in-repo pattern that fixes it, so nothing depends on memory. Continuing to
  revise the plan for details at this altitude would be polish, not diligence.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — approved 2026-08-16 after a comprehension check
  scored 4/4 on the third revision (floor of 3, one mandatory integration
  question, one for the surviving `major`). Earlier runs: 8/8, 6/6, 5/5.

## ADR reference

- ADR: none

## Required Follow-up Actions

Binding on `/implement`. None is a precondition for starting — the plan is
approved as written — but each must be satisfied before `/verify`, and
`implement.md` must say how.

1. **Session file generations.** Obtain the service, the store and the spies
   **after** `vi.resetModules()`, in one loader, in the same generation — the
   `loadAuth()` pattern in `tests/services/authRefreshSession.test.ts`. A handle
   imported at file top belongs to a dead generation: AC-20 and AC-21 would pass
   vacuously and a gated reply would never release. The per-test store reset in
   that row becomes redundant once the loader supplies the store.
2. **Order-independence proof.** AC-39's second run shuffles tests **within**
   each file, not only file order.
3. **Spy reset list.** Enumerate, per file, every spy that file queues a reply on
   — including the session-read helper, the upload ticket helper and the global
   fetch stub in the profile file — and reset each one.
4. **Correct the reset justification** in `implement.md`: on this runner a
   blanket reset restores each stand-in's built-in implementation rather than
   stripping it. The targeted reset stays; the reason recorded in the plan was
   wrong.
5. **The local gated stub throws** on any call it has no queued reply for, naming
   the address — the same property the shared stand-in gives every other file.
6. **Fake-timer pattern for the fixed wait:** start the call, advance the clock
   asynchronously, then await the promise. A synchronous advance never fires a
   timer inside an awaited chain.
7. **The state-slice file builds a fresh slice per test** from the reducer
   factory; the attempt counter and the topic list accumulate otherwise.
8. **Re-armed defaults are the explicit failure reply**, never a bare spy, so a
   forgotten reply fails loudly.
9. **The step-8 test asserts that the typed values were carried**, not a literal
   query string, so the later encoding fix does not read as a regression.
10. **Both dangling comments go**, or `implement.md` says why one stays.
11. **File the encoding follow-up ticket** during `/implement` and record its id
    in `implement.md`.
12. **Record in `implement.md`** that `spec.md`'s research-questions table cites
    stale AC numbers in the OQ-3 and OQ-4 rows; the AC mapping table is correct
    and authoritative.
