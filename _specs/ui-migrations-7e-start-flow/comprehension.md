---
ticket: ui-migrations-7e-start-flow
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-11-28
result: passed
score: 5/5
threshold: 1.0
decision: PASSED
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

## Verify gate

Questions derived from `implement.md` + `spec.md` (CG-2), including whether the plan's Integration
surface held (CG-5: Q1, the shared `AppShell` bar and the store flag). No panel at verify (ADR-010).
Options are listed alphabetically. The review record is retired as `comprehension-review-1.md`; no
earlier verify record exists, so `attempt: 1`.

**CG-8 note.** No blind falsifier could run (no subagents on this account). The authoring agent read
each question as a blind reader:
- Q1 names four real components with the same AC.
- Q2 mixes the two real page numbers and part 1's login number with two real AC ids.
- Q3 names four real files with the real requirement and one close one.
- Q4 pairs real page-colour facts with the two places a restore can run.
- Q5 pairs real AC ids with two real reasons.

The `degraded` line records that the check was not blind.

| # | Question (from the artifact) | Sources | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | Implement deviation D-8 fixed a 64 px jump after the sign-in request's login closed. Which component got that fix, for which AC? | `implement.md > Deviations` (D-8); `spec.md` AC-15; `plan.md > Integration surface` (AppShell's bar) | integration (CG-5) | 2 | **AppShell, for AC-15** (correct) / AuthSections, for AC-15 / NavbarClient, for AC-15 / SignInAskLayer, for AC-15 | yes (self, see note) | AppShell, for AC-15 | Yes |
| 2 | Which final number for `/sy-en/about` did implement record, against which AC's budget? | `implement.md > Tests written` (AC-18 row) / plan note; `spec.md` AC-18, NFR-1 | acceptance / speed | 2 | +3,622 B vs AC-18 / +5,351 B vs AC-18 / +5,368 B vs AC-17 / **+5,368 B vs AC-18** (correct) | yes (self, see note) | +5,368 B vs AC-18's 1,024 B | Yes |
| 3 | Which file holds the one-line fix for the flagged-home hang, and which spec requirement does it serve? | `implement.md > Changes made`; `spec.md` FR-17 | change / requirement | 2 | DemoApp1/StartCover.tsx, FR-17 / **global/PageCover.tsx, FR-17** (correct) / global/PageCover.tsx, FR-3 / Home/Init.tsx, FR-17 | yes (self, see note) | global/PageCover.tsx, FR-17 | Yes |
| 4 | AC-15 asks that the page keeps its own colours after the sign-in request's login. What broke that, per D-8, and where did the restore move? | `spec.md` AC-15; `implement.md > Deviations` (D-8) | defect found | 2 | --xd-unit left; into an effect / **<body> colour lost; into an effect** (correct) / <body> colour lost; into the handler / <html> colour lost; into an effect | yes (self, see note) | <body> colour lost; into an effect | Yes |
| 5 | Which open item can only be checked after `/wf:publish-pr`, and why? | `implement.md > Validation run` / plan note; `spec.md` AC-14 | open items | 2 | **AC-14 WebKit: guest cookies** (correct) / AC-14 WebKit: the picker / AC-18 WebKit: guest cookies / AC-8 WebKit: guest cookies | yes (self, see note) | AC-14 WebKit: guest cookies | Yes |

Two-hop share (X7): 5 of 5 questions are two-hop, each with two distinct sources.

## Result

5 of 5 correct (threshold 1.0). Gate passed. Decision: **PASSED**, with the exceptions the owner
accepted on 2026-11-28 ("Pass with exceptions"): AC-18 not met as measured; AC-14 (WebKit), AC-17
(Vercel) and AC-20 (CI unit run) are open items for the PR preview and CI (see `verify.md`).
