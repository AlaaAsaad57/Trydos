---
ticket: profile-closeout-scripted-and-live
stage: review
attempt: 5
status: complete
owner: developer
updated: 2026-08-25
result: passed
score: 5/5
threshold: 1.0
decision: APPROVED
missed:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — profile-closeout-scripted-and-live

> Gate record for the `review` stage, **round 5**. Rounds 1-4 are retired to
> `comprehension-review-1.md` … `-4.md`, so this round earns `attempt: 5` —
> strictly greater than the highest retired attempt (X5).
>
> Five questions: floor 3, ceiling 5 (CG-1). One on the mandatory integration
> axis (CG-5). Nine `major` findings this round, so the four largest blast radii
> seeded questions (CG-6); every `major` is dispositioned in `review.md`.
>
> **New questions again (CG-7b).** Earlier rounds asked about the session lift,
> the scripted trace, `profileWrites.ts`, the run-cost floor, the media host, the
> `PROF-04` deletion, `AC-10`'s missing mechanism, the cookie mirror, the expire
> route, wall-clock headroom, route precedence, server-side rotation, analytics
> escape and the project timeout. This round asks about the spike's result, the
> policy's two lists, the app's own success path, the remaining unknown, and the
> gap the plan knowingly accepts.
>
> All findings were on disk before the first question (RP-4), and the spike
> evidence (`spike-runtime-facts.md`) was written before the decision. Options are
> alphabetical. Questions are in plain words at the owner's request; the technical
> content is unchanged.

## Review gate

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|--------|------|---------------------------------|----------------|----------|
| 1 | The spike ran the interception offline. What did it settle that four review rounds could not? | `spike-runtime-facts.md` Part 1; plan Approach | **integration (CG-5)** | (a) **The two fake helpers do compose on one page, and an unmatched call does fall through to the guard** ✅ · (b) That the guard must be a page route, not a context route · (c) That staging is reachable and the sign-in flow still works · (d) That the three save legs answer in a fixed order | (a) | Yes |
| 2 | Why is "allow reads, block writes" not enough on its own in this app? | panel:security (U1); `app/api/auth/login/route.ts:67` | criterion ↔ mechanism | (a) Reads and writes use the same route, so the two cannot be told apart at all · (b) **Some calls change things using GET — the login route spends the one-time code and writes every cookie — so the rule needs a named deny-list too** ✅ · (c) The guard cannot see the method of any call, so the rule never applies · (d) Writes are rare enough that blocking them changes nothing | (b) | Yes |
| 3 | The guard sits inside `/api/auth/**`. Why does `/api/auth/update-user` need naming as an allowed exception? | panel:security (U2); `services/auth.ts:710,743,791,819,898,927` | security / own success path | (a) It is a GET, so the write rule does not reach it anyway · (b) It is outside the guard's scope, so naming it is only documentation · (c) It is the only route that carries the one-time code, so it must not be aborted · (d) **The app posts it after every leg and every rollback leg, so blocking it would fail four cases naming the guard instead of the branch under test** ✅ | (d) | Yes |
| 4 | One thing is still unknown after the spike. How does the plan handle it? | plan step 10; `spike-runtime-facts.md` "What is still unknown" | blast radius / evidence | (a) It is left out of scope and deferred to a separate ticket · (b) Nothing is unknown — the spike measured the complete call set · (c) The plan lists every call it could find by reading and treats that as complete · (d) **The full list of calls the save makes is found by a report-only pass that implement runs first, and its output is recorded as evidence** ✅ | (d) | Yes |
| 5 | The plan knowingly does not meet one part of its own spec. Which part, and why is it accepted? | panel:security (U12); plan "Analytics"; NFR-2 | cost / accepted risk | (a) A one-time code is spent on every case, exceeding the stated run cost · (b) Nothing is accepted — every part of the spec is met in full · (c) **The shopper's phone and e-mail reach Sentry on the deliberate failure cases; turning that off would mean editing a protected runtime path** ✅ · (d) The tests write to the shared account with no undo, because the rollback is the thing under test | (c) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
