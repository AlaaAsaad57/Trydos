---
ticket: e2e-stories-upload-report-delete
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-20
links:
  clickup:
  github:
---

# Intake — e2e-stories-upload-report-delete

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-stories-upload-report-delete`. No ClickUp task and no GitHub issue. The
request came straight from the owner in chat on 2026-09-20.

## Ticket Summary

Add browser (Playwright) cases for the stories journey: **upload** a story,
**report** a story, and **delete** a story. Cover all three story kinds — link,
video and image. Two test accounts take part: one uploads, the other reports. No
real customer may ever see a test story, and the test may never report a story
that belongs to a real user.

## Ticket Metadata

- id / slug: `e2e-stories-upload-report-delete`
- title: Browser tests for the stories journey — upload, report and delete, with no real shopper ever seeing them
- owner: developer
- created: 2026-09-20
- links: none

## User Story

> As the person who owns the Trydos test suite, I want the stories journey
> (upload, report, delete) checked in a real browser against staging, so that a
> break in uploading, reporting or deleting a story is found by the suite and not
> by a shopper — and so that running the suite never puts test content in front
> of a real customer and never files a report against a real person's story.

## What the request asks for, in one list

1. Upload a story, in each of the three kinds the app offers: **link**, **video**,
   **image**.
2. **Report** a story. The account that reports is not the account that uploaded.
3. **Delete** a story.
4. Every story the suite makes must respect the **QA safety lock** from
   `_specs/e2e-production-safety-lock/`, so no real customer sees it.
5. The report case must only ever report **the story this run uploaded**. Never a
   real seller's story, never a real user's story.
6. The test must find its own story **even when it is not on the first page** of
   the feed.
7. Changing application code to make that find reliable — for example adding a
   `data-pw` attribute, or a lookup by id — is **allowed** by the owner.

## What the repository already has (facts, with lines)

These are read-only findings from intake. They are here to show the request is
real and buildable, not to plan the work.

| Thing | Where | Note |
|---|---|---|
| The three story calls | `services/story.ts:130` (`add_story`), `services/story.ts:164` (`delete_story`), `services/story.ts:195` (`report`) | All three go to the **stories** backend (`server: "stories"`) |
| Every story carries a `link` | `services/story.ts:141` — `upload(file, callback, is_video, endUpload, link)` sends `link` next to the file | A video story and an image story can both carry a link |
| The QA mark for a story **is its link** | `utils/qaStoryFilter.ts:17` — `QA_STORY_LINK_HOST = "qa-test.trydos.tech"` | A story linking to that host is QA data |
| Four readers drop QA stories | `services/story.ts:38`, `serverRequests/stories.ts:75`, `components/Home/Stories/StoriesBarClient.tsx:71`, `components/Home/Stories/StoriesPaginationWrapper.tsx:59` | All four call `dropQaStories` |
| The report screen | `components/Home/Stories/ReportStoryModal.tsx` | Reached from the story viewer |
| The seller's own story list, with delete | `components/SellerDashboard/StoriesTab.tsx:200` | This list does **not** call `dropQaStories` |
| The feed is paged | `services/story.ts:25` — `users_stories?page=N` | This is why "not on the first page" is a real problem |
| Two accounts already exist in the harness | `tests/e2e/harness/env.ts:157` (Shopper A) and `:167` (Shopper B) | Shopper B needs `TEST_ACCOUNT_OTP_2` (`env.ts:181`) |
| The lock already has a stories case | `tests/e2e/qaLock.live.spec.ts` — QA-11, "A QA story never reaches the feed" | It must stay green |

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: the request names the journeys and the safety rules but writes no
  numbered criteria. The `spec` stage writes them. Enough is given to write them
  without asking: three kinds of story, three actions, two accounts, the QA mark,
  and the "find it past page one" rule.

## Test Cases Presence Check

- Present? **no** (and this ticket's *product* is tests)
- Notes: this is a test-writing ticket, so `plan.md > Tests` will name the
  browser cases themselves. The ticket adds cases to the **browser** suite
  (`tests/e2e/`), because uploading real media to the media server and driving
  the story viewer cannot be reproduced without a backend. If any change is made
  to application code, that change needs its own **unit** test as well — the
  repository rule prefers the unit suite because only the unit suite gates pull
  requests (`CLAUDE.md`, "Which suite").

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the goal is
  new test files, and possibly a small application change to make a story
  findable.
- Is the goal to *choose between options*? **no.** One real open question does
  exist (see Missing Information, Q1), but it is a design decision inside this
  change, not a standalone comparison of products or directions. The `research`
  and `spec` stages settle it.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **no.** Nothing is reported broken. Nothing has been run and found red. This is
  not a `hotfix`.
- Is the change to make already known, leaving only building it? **yes** — write
  browser cases for upload, report and delete, under the QA lock.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

Four open points. None of them stops the next stage — `research` is exactly the
stage that answers them — but each one must be answered before `spec` is written.

**Q1 — A QA story is hidden from the test as well. How does the test see it?**
This is the central tension of the ticket, and it is not a small detail.
`utils/qaStoryFilter.ts` hides a QA story from **every** reader of the feed, with
no way round it. The product side of the QA lock does have a way round it — a
secret header turns QA mode on — but that switch is wired only into the product
and boutique readers (`utils/server/qaMode.ts` is read by the Elastic and
boutique paths, not by any story reader). So today:

- Mark the story as QA, and no customer sees it — but **the test cannot see it
  either**, so it cannot open it, report it, or find it in the feed.
- Do not mark it, and the test can see it — and so can every real customer. That
  breaks the whole point of the safety lock.

`research` must find every way out and name the cost of each. Two candidates are
listed here only to make the question concrete: give the story readers the same
QA-mode switch the product readers have; or drive report and delete from a
surface that never filtered — the seller dashboard's own story list
(`components/SellerDashboard/StoriesTab.tsx`) is one such surface.

**Q2 — Can the reporting account see the other account's story at all?**
Reporting is done from the story viewer, and the viewer is opened from the feed.
If Shopper B's feed cannot show Shopper A's QA story, there is no report case to
write until Q1 is answered. `research` must confirm, by reading the code, how the
report modal is reached and what it needs.

**Q3 — The browser suite has no media files to upload.** A search of `tests/`
found no `.png`, `.jpg`, `.mp4` or `.webp` at all. An image story and a video
story both need a real file. So this ticket has to add two small fixture files,
and the plan must check they are not silently ignored — `scripts/*` is ignored
wholesale in this repository, and the same trap could apply elsewhere.

**Q4 — Shopper B still cannot sign in on CI.** `TEST_ACCOUNT_OTP_2` is not yet a
repository secret. The harness already knows this and names it
(`tests/e2e/harness/env.ts:185`). The `report` case needs a second signed-in
account, so on CI it will skip until that secret exists. The plan must say
plainly that the case skips rather than passes, and must not fall back to
Shopper A reporting its own story unless the product really allows that.

## Readiness Status

`READY`

- Justification: the request names the journeys (upload, report, delete), the
  three story kinds, the two accounts, and the two safety rules that may not be
  broken. The repository already holds every part the work builds on — the three
  service calls, the QA story mark, the report screen, the paged feed and the two
  account slots — and each was checked and is listed above with its line. The
  four open points are real, but all four are questions about **how**, and
  answering them is the job of `research` and `spec`. None of them changes what
  is being asked for.
