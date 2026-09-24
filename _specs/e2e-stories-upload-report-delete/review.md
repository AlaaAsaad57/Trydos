---
ticket: e2e-stories-upload-report-delete
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-09-20
links:
  clickup:
  github:
---

# Review — e2e-stories-upload-report-delete

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (18 acceptance criteria) and `plan.md` (fourth draft), with
`research.md` and `intake.md` as context. The plan was checked three times by the
read-only panel before this gate; every round is recorded in `plan.md > Plan
check — round 1 / 2 / 3`.

## Plan Summary

Test stories are hidden from everybody today, so the suite cannot see its own
story and cannot drive report or delete. The plan adds a **viewer allow-list**:
a short list of stories-service user ids in `NEXT_PUBLIC_QA_STORY_VIEWER_IDS`
that still see test stories. Empty by default, so a normal build is unchanged.

Each uploaded story carries a link built from the app's own mark host plus a
random per-run token, so the suite can tell its own story from anyone else's.
Four small DOM seams are added (the story tile, the story holder, the report
sheet, the crop editor), one dead story reader is deleted, and a `console.log`
that prints the signed-in profile is removed.

Seven browser cases follow: two sign-ins, a photo upload, a video upload, a feed
check, a report from the second account, and a delete of both stories that is
also the clean-up. Six unit cases cover the list itself.

## Risks

- The browser half of the rule is **advisory**. Browser readers learn who is
  looking from store state a visitor can change. The guarantee is that the list
  is empty on every build a customer can reach.
- The list is a `NEXT_PUBLIC_` value, so it is inlined into the bundle at build
  time. On a build that has it set, knowing an id is enough to see test stories.
- The account lane has not been measured since the lane split. This ticket adds
  up to 26 minutes of caps to an unknown total.
- Uploaded media is never removed, and a filed report cannot be withdrawn. Both
  accumulate, one of each per run.
- `utils/qaStoryFilter.ts` is the heart of the existing QA safety lock. Five
  readers and a pinning unit test depend on it.

## Assumptions

- Both test accounts may upload stories (stated by the owner on 2026-09-20).
- `signedInSession` can return the stories id, because `/api/auth/me` keeps it.
- The CI harness builds its own app, so the list reaches only that build.
- A subdomain of the team's own apex cannot be registered by a stranger.

## Open Questions

- Is there a live DNS record for `qa-test.trydos.tech`? Every test story stores a
  permanent public link to that host, and this ticket adds one per run.
- The plan **deletes** the dead `fetchStoriesForGuest` rather than making it
  follow the rule, which is a departure from the owner's instruction of
  2026-09-20. Reversible at this gate.

## Panel Findings (advisory)

> Three rounds, read-only, over `plan.md` + `spec.md`. **31 distinct `major`
> findings** were raised and all are answered in the fourth draft. Rounds 1 and 2
> were open reviews; round 3 was a convergence check that re-verified every
> earlier answer and reported only defects.
>
> The `minor` and `info` findings are recorded in full in `plan.md > Plan check —
> round 1 / 2 / 3` and are not repeated here.
>
> The claim checker is not graded by severity and appears at the end.

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| security | major | R1 — the browser can set the viewer id, so `FR-2` overclaimed | `spec.md` FR-2 | mitigated |
| security | major | R1 — the `otpAllowlist` analogy hid the bundle exposure | plan § Approach | mitigated |
| security | major | R1 — rollback claimed no deployment was needed | plan § Rollback | mitigated |
| senior | major | R1 — nothing could tell this run's photo story from its video story | AC-10 | mitigated |
| senior | major | R1 — the declared `AC-16` test could never go red | AC-16 | mitigated |
| senior | major | R1 — `FR-2` depended on state the browser controls | `spec.md` FR-2 | mitigated |
| senior | major | R1 — no session-state key for a multi-case live spec | `liveSession.ts` | mitigated |
| performance | major | R1 — no time budget was added up | plan § Numbers | mitigated |
| performance | major | R1 — the finder had no page cap and no poll bound | plan § Numbers | mitigated |
| performance | major | R1 — a cheaper raw feed read already exists in the repo | plan step 10 | mitigated |
| security | major | R2 — raw feed reads hold real customers' stories | AC-17 | mitigated |
| security | major | R2 — nothing proved the typed link was really QA-marked | AC-7 | mitigated |
| security | major | R2 — `AC-14` rested on QA-11, which passes vacuously | AC-14 | mitigated |
| security | major | R2 — the dangerous direction of a bad list was untested | AC-4 | mitigated |
| senior | major | R2 — the viewer id is `null` when the bar filters | plan step 3 | mitigated |
| senior | major | R2 — nothing in the suite could read a stories-service id | `actions/auth.ts` | mitigated |
| senior | major | R2 — the cleanup net could not work from Node | AC-13 | mitigated |
| senior | major | R2 — `data-story-id` on the viewer proves nothing | `StoryHolder.tsx` | mitigated |
| senior | major | R2 — the report could land on an earlier run's story | AC-10 | mitigated |
| senior | major | R2 — testing the dead reader breaks a repository rule | AC-16 | accepted — owner chose to delete the reader at this gate |
| performance | major | R2 — the lane baseline was a stale comment | plan § Numbers | mitigated |
| performance | major | R2 — no sign-in budgeted, and the session files had no writer | STORY-00a/00b | mitigated |
| performance | major | R2 — 120 s is below the suite's own precedent for a media upload | plan § Numbers | mitigated |
| performance | major | R2 — the video upload branch can hang with no reject | plan § Numbers | mitigated |
| senior + claim | major | R3 — `User-Data` is HttpOnly, so the browser fallback cannot run | plan § Approach | mitigated |
| senior | major | R3 — up to four `StoryHolder`s are mounted at once | `StoryHolder.tsx` | mitigated |
| senior + security | major | R3 — the viewer auto-advances between the check and the submit | AC-10 | mitigated |
| senior | major | R3 — the `server` option must feed the 401 refresh body too | `orderCleanup.ts` | mitigated |
| senior | major | R3 — the cleanup net's page must carry the uploader's session | AC-13 | mitigated |
| performance | major | R3 — the photo case meets a third screen, the crop editor | `ImageCropWidget.tsx` | mitigated |
| performance | major | R3 — a refused upload hangs too, in both branches | plan § Numbers | mitigated |
| claim check | — | R1: 10 wrong line references · R2: 1 · R3: 13 wrong statements, 3 missed facts. All corrected; 78 claims and all arithmetic confirmed in round 3 | plan, research | mitigated — corrected in place |

## Decision

`APPROVED`

- Rationale: the plan is concrete enough to carry out — every file that changes
  is named, every `AC-n` has a test row with a disposition, the integration
  surface is written out, and the rollback says what actually reverts. All 31
  `major` panel findings are answered in the fourth draft. The two that were
  decisions rather than defects were settled at this gate: the dead reader is
  deleted, and the QA host question is carried as a follow-up because it predates
  this ticket and does not block the work.
- The comprehension gate was administered **short** — 2 questions against a floor
  of 3 — under CG-8, after three falsification rounds. Both were answered
  correctly, and the mandatory integration question was one of them.

## Approvals

- Approver (owner): developer (self-approval, ADR-009)

## ADR reference

- ADR: none

## Required Follow-up Actions

1. **Delete `fetchStoriesForGuest`** rather than making it follow the rule —
   decided by the owner at this gate, reversing the instruction of 2026-09-20.
   The plan already reflects this; `AC-16` is proved by the deletion.
2. **Check `qa-test.trydos.tech` has a live DNS record.** Not a blocker: it
   predates this ticket, and a stranger cannot register a subdomain of the team's
   own apex. If the record is dangling, say so in `verify.md`.
3. **Measure the account lane before and after** and record both in `verify.md`.
   The lane has not been measured since the lane split, so the 26 minutes this
   ticket adds is a cap against an unknown total. If the measured total passes 70
   minutes, move the stories cases to their own lane rather than raising the cap.
4. **Check Playwright's bundled `ffmpeg` before building the video fixture.** It
   is a stripped build aimed at webm, and the file picker accepts no `.webm`.
   Record the real command and the measured byte size in `plan.md > OQ-7`, or use
   the stated fallback.
5. **Record the never-settling upload promise as a `BUG-n` finding** in
   `implement.md`. It is a real defect in `AddStoryWidget.tsx`, it is outside the
   files this plan changes, and it needs its own ticket.
6. **Add `NEXT_PUBLIC_QA_STORY_VIEWER_IDS` as a repository variable**, not a
   secret, and open the CI change against `main` as well as `development`.
