---
ticket: ui-migrations-7e-start-flow
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-11-28
result: passed
score: 5/5
threshold: 1.0
decision: APPROVED
missed:
degraded: "5 of 5 administered — CG-8 falsification was done by the authoring agent, not by a blind subagent (this account forbids subagents)"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — ui-migrations-7e-start-flow

## Review gate

Questions derived from `plan.md` + `spec.md` and from the Panel Findings already written to
`review.md` (CG-2, CG-6). Floor 3 + one question per `major` finding (S-1, S-2, S-3), within the
ceiling of 5; Q1 is the integration question (CG-5). Options are listed alphabetically. No earlier
record exists in this workspace, so `attempt: 1` (E1: nothing to retire).

**CG-8 note.** No blind falsifier could run (no subagents on this account). The authoring agent read
each question as a blind reader and reworded where an option leaked the answer:
- Q1 pairs two real components with two real flags.
- Q2's four options are four real plan steps with the same shape.
- Q3's options are four real spec requirements, each with a short gloss of the same length.
- Q4 pairs two real places with two real reasons; the correct reason is project-specific
  (`utils/fetchData.ts:187-193`).
- Q5's options are four real part-1 fixes; the question does not mention the cover's position
  or Safari.

The `degraded` line records that the check was not blind.

| # | Question (from the artifact) | Sources | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | While one of the plan's new hosts has its login layer open, which component stops mounting the session-expired and phone-check widgets, and on which store flag? | `plan.md > Answers (OQ-6)`; `plan.md > Files to change` / `Integration surface` | integration (CG-5) | 2 | AppShell, on loginLayerOpen / AuthSections, on loginOpen / **NavbarClient, on loginLayerOpen** (correct) / NavbarClient, on loginOpen | yes (self, see note) | NavbarClient, on loginLayerOpen | Yes |
| 2 | Finding S-3 describes an open redirect. Which plan step builds the end-of-flow address it is about? | `review.md > Panel Findings` (S-3); `plan.md > Steps` (Step 6) | major finding (CG-6) / security | 2 | Step 5 — picker data props / **Step 6 — AppStartFlow host** (correct) / Step 7 — the Init change / Step 8 — AppSignInAsk host | yes (self, see note) | Step 6 — AppStartFlow host | Yes |
| 3 | Finding S-2 says the "close before a pick" fallback would loop on a `gb-` address. Which spec requirement makes the flow show again there? | `review.md > Panel Findings` (S-2); `spec.md > Functional Requirements` (FR-1) | major finding (CG-6) / flow | 2 | **FR-1: gb- shows the flow** (correct) / FR-12: guest sees the sheet / FR-14: sheet waits 5 s / FR-7: end removes the flags | yes (self, see note) | FR-1: gb- shows the flow | Yes |
| 4 | The plan changes how AC-6's starter-settings read is checked. Where and why does the plan read the starter settings? | `spec.md` AC-6 / FR-6; `plan.md > One clarification of AC-6` | acceptance / data | 2 | At the pick: fetchData / At the pick: the proxy / **New address: fetchData** (correct) / New address: saved copy | yes (self, see note) | New address: fetchData | Yes |
| 5 | Finding S-1 says the plan's server-side cover could undo a fix that part 1 kept. Which part-1 fix is it? | `review.md > Panel Findings` (S-1); `spec.md` NFR-7 / plan Steps 6-7 | major finding (CG-6) / Safari | 2 | The email code sheet / **The in-flow splash mode** (correct) / The session-expired hold / The single media origin | yes (self, see note) | The in-flow splash mode | Yes |

Two-hop share (X7): 5 of 5 questions are two-hop, each with two distinct sources.

## Result

5 of 5 correct (threshold 1.0). Gate passed. Decision recorded by the owner: **APPROVED**, with the
three `major` findings mitigated in implement (see `review.md > Required Follow-up Actions`).
