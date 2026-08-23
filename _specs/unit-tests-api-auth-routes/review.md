---
ticket: unit-tests-api-auth-routes
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: reviewer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Review — unit-tests-api-auth-routes

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Fourth and final run of this gate**, against `plan.md` revision 4. Major
findings by round: **7 → 3 → 4 → 1**. All three lenses returned an explicit
readiness verdict this round, and all three said a fifth round is not warranted.
Decision: **APPROVED**.

## Review Scope

`spec.md` (AC-1..AC-38) and `plan.md` **revision 4**, with the round-3 `review.md`
follow-ups. Each lens was asked to confirm, per earlier finding, whether revision
4 resolved it *in substance*, to raise anything new, and to give a plain
readiness verdict at a bar of "would this produce a broken or misleading test
suite" rather than polish.

Verified directly rather than taken from a lens: `utils/serviceTokens.ts` does
map service names to opaque wire tokens in both directions, so a test sending a
readable name would land on the unknown-service refusal.

## Plan Summary

Call each route handler directly. Three stand-ins in every file — the request
reader, the network, the error reporter — plus a fourth in the sign-in file for
the guest-name helper, whose module pulls in the store and translations. The
credential helper, the renewal helper and the secure-logging helper run for real
and are named. Ten files in the `tests/` mirror, every backend address stubbed
per file on a distinct role-named unresolvable host. Logout first. No production
code changes.

## Risks

- AC-33 cannot be demonstrated with bare-origin fixtures; the guard's path prefix
  collapses to a single slash and a climb-out target passes it. One fixture edit
  fixes this, and it is a binding follow-up below.
- AC-34 is deliberately recorded as *not satisfied* — it pins a real divergence
  and will go red the day the route is fixed, which is why its comment must carry
  the follow-up ticket id.
- Two follow-up tickets are promised and do not yet exist. One of them covers a
  route that is reachable and un-gated today.
- The proxy's wire contract is easy to get wrong in a way that is green for the
  wrong reason.

## Assumptions

- The routes load in a node-environment file under the shared setup; eight
  existing files already do.
- `after()` behaviour in a direct handler call remains unknown, contained by
  sending no push token in the cookie-assertion tests.
- The existing client-side tests hold the correct contract where they and a route
  test disagree; step 9 records any divergence rather than assuming.

## Open Questions

None. OQ-1..OQ-8 are all answered — OQ-4..OQ-8 in `spec.md`, OQ-1..OQ-3 and OQ-8
in `plan.md`.

## Panel Findings (advisory)

> Round 4 over `plan.md` revision 4 (ADR-010 / RP-1). **Advisory only** (RP-2).
> Rounds 1–3 findings and their dispositions are in the ticket's history; every
> one was resolved and re-verified against the repository by the lens that raised
> it.

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| senior | major | AC-33 is unprovable with the plan's fixtures: every base is a bare origin, so the path prefix collapses to `/` and a climb-out target resolves to a path that still starts with it. The test would fail at implement time or be quietly rewritten into a duplicate of AC-32 — a green test proving nothing. | plan Environment values, step 8; AC-33 | Accept — **binding follow-up 1**. The two storefront fixtures gain a path component. AC-35's equality check is unaffected, because the resolver returns the environment value verbatim. |
| security | minor | AC-34 mandates a follow-up ticket id in the comment, but no ticket exists and the links field is empty everywhere — the implementer cannot write the comment, and the pinned divergence loses its trail. | plan step 8, Out of scope | Accept — **binding follow-up 2**. Both tickets are opened before the proxy file is written and their ids recorded. |
| senior | minor | The proxy's wire contract is absent from the plan and the Integration surface: the service header carries an opaque token, so sending a readable name lands every proxy test on the unknown-service refusal. | plan step 8, Integration surface | Accept — **binding follow-up 3**. The module is named in `implement.md` and the tests send the wire token, keeping a readable name only for the AC-34 unknown-service case. |
| senior | minor | The decode-header host-escape case may not refuse at all: the first decode leaves an escaped slash encoded, so the target survives both guards and is forwarded. That is a real gap, not a test bug. | plan step 8; AC-32 | Accept — recorded now as **expected to become a finding against AC-32**, never rewritten green around the bypass. The route is not changed (AC-38). |
| performance | minor | The "nine light plus one heavy" estimate is stale under revision 4's own fourth stand-in: with the guest-name helper stood in, the sign-in route's graph is small and all ten files are light. | plan step 1 | Accept — restate as ten light files in `implement.md`. It is an upper bound, so nothing else changes. |
| performance | minor | Six full coverage runs to decide a 20-second threshold is heavier than the thing measured. | plan step 10 | Accept — one before/after pair plus the printed per-file durations; escalate to the three-run median only if that lands within a few seconds of the threshold. |
| performance | info | The plan names the coverage command, but the gate runs the CI variant (coverage plus the machine-readable reporter). | plan step 10 | Accept — measure the gate's own command so the number is the gate's number. |
| performance | info | Suspect ordering is slightly off: the routes are already in the coverage include list at 0%, so the added cost is executing them plus ten more per-file setups, not new instrumentation. | plan step 10 | Accept — put the ten extra file setups first in the suspect list. |
| security | info | Confirmed: the cookie-forging route has no environment or auth gate and writes caller-supplied tokens as HttpOnly cookies. Correctly excluded from this ticket, but the follow-up must actually be filed. | plan Out of scope | Accept — covered by binding follow-up 2. |
| security | info | AC-36 is skipped on pass-through responses, so an upstream error body naming the stack, forwarded verbatim, stays unproven. A stubbed upstream cannot prove it either way. | plan AC-36 section | Accept — keep the narrowing; record at `/verify` as **narrowed, not met**, and let the pass-through case ride the follow-up. |
| security | info | Fixtures are all synthetic; no real credential or backend address enters the repository. No protected runtime path and no observability path is touched. | plan Environment values, Protected-path statement | Accept — no action. |
| performance | info | The secure-logging helper is called only from the proxy route, so silencing the console there covers every console writer this ticket adds. | plan Approach | Accept — no action. |
| senior | info | AC-35 needs both routing branches, and the plan names only the "hosts must differ" half: the gateway branch needs a guest and an allow-listed path, the core branch needs a verified profile or a non-allow-listed path. | plan step 8; AC-35 | Accept — one line in `implement.md` naming both inputs, so the core case is not written as an unreachable-but-green branch. |
| senior + security + performance | info | Readiness: all three lenses verified revision 4's claims against the repository — the stand-ins, the canary target, the module-scope reads, the fake network's missing binary reader, the thirteen cookie names and the two survivors all check out. | plan revision 4 | Accept — proceed. |

## Decision

`APPROVED`

- Rationale: the plan is implementable and its claims have been checked against
  the code rather than against its own account of itself. Security and
  performance returned zero majors and explicit "ready to implement"; senior
  returned one major and called the ticket implementable, with a fifth round not
  warranted. That single major is one fixture cell, not an approach change —
  which is the difference from round 3, where two majors changed what the
  implementer does first and `/implement`'s binding to `plan.md` made another
  revision the right call. Here the four binding follow-ups below are precise
  enough to carry into `implement.md` without re-planning, and the comprehension
  check passed 4/4, so the AC-33 problem was understood before it was accepted.
  The revision history is the argument for stopping: 7 → 3 → 4 → 1 majors, with
  every earlier finding re-verified as resolved in substance.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — reviewed at the gate, comprehension 4/4,
  decision `APPROVED`.

## ADR reference

- ADR: none

## Required Follow-up Actions

**Binding at `/implement` — each must be honoured and recorded in `implement.md`:**

1. **Give the two storefront fixtures a path component**, so AC-33's path guard
   is actually exercised rather than collapsing to a single slash. AC-35 is
   unaffected.
2. **Open both follow-up tickets before the proxy file is written** — the
   cookie-forging route and the enumeration-oracle divergence — and put their ids
   in AC-34's comment and in the ticket's links.
3. **Send the opaque wire token** for the service header, not the readable name;
   name that module in `implement.md`. Keep a readable name only for the AC-34
   unknown-service case.
4. **Record the decode-header host-escape case as a finding against AC-32** if it
   is not refused, and never rewrite the test green around the bypass.

**Recorded for the implementer — do not re-plan for these:** restate the estimate
as ten light files; take one before/after coverage pair using the gate's own
command, escalating to a three-run median only if it lands near the threshold;
put the ten extra file setups first in the suspect list; name both routing inputs
for AC-35's two branches; and record AC-36 at `/verify` as narrowed rather than
met, and AC-34 as not satisfied rather than as a pass.
