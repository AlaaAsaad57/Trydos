---
ticket: e2e-stories-upload-report-delete
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-20
links:
  clickup:
  github:
---

# Implement — e2e-stories-upload-report-delete

> Record of what was actually built, following `plan.md`.

Branch `ticket/e2e-stories-upload-report-delete`, cut from a clean
`development` (this repository's base branch, overriding IM-3's `main`).

**Everything in the approved plan is applied.**

One thing changed shape along the way. The video fixture could not be produced
with the tools on this machine (`BLK-VIDEO-01` below), so this stage was recorded
`blocked` while the owner decided. On 2026-09-20 the owner answered: *"no video
upload required only image"*. `AC-6` is **withdrawn**, not deferred and not
silently skipped — the case was deleted from the spec file rather than left
skipping, so nothing in the suite claims to cover a journey it does not.

## Changes made

**Application — the rule**

- `utils/qaStoryFilter.ts` — added `isQaStoryViewer(viewerPhone)` and the
  `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` list; `dropQaStories` gained an optional
  second argument carrying the viewer's phone. The host and the list are read
  **once per call**, not once per story, and `isQaStoryForHost` was split out to
  make that possible. Matching ignores everything that is not a digit on both
  sides, so `+999 000 000 001` and `999000000001` are one entry. `""`, blanks,
  `null`, `undefined`, `0` and `"0"` all mean "nobody is signed in yet" and can
  never match; empty list entries are dropped, so a trailing comma cannot produce
  an entry that matches every viewer.
- `services/story.ts` — `getStories` now reads the viewer's phone from the store.
  Safe here because its only app caller is the sign-in flow
  (`services/auth.ts:377`), which runs after the store is filled.
- `tests/e2e/harness/server.ts` — **`childEnv()` derives the list** from
  `TEST_ACCOUNT_PHONE` and `TEST_ACCOUNT_PHONE_2` before the build, so nobody
  configures anything. An explicit value still wins. This is the only place the
  variable is ever set.
- `components/Home/Stories/StoriesBarClient.tsx` — holds the **raw** page in
  state and computes the filtered list from `[raw page, viewer id]`. This is the
  fix for the timing fault the panel found: the store is filled after boot, so a
  filter applied inside the `.then` would run with no viewer id and drop the test
  account's own story with no second request to bring it back.
- `components/Home/Stories/StoriesPaginationWrapper.tsx` — passes the store's id.
  Safe at fetch time: paging is triggered by scrolling, long after sign-in.
- `serverRequests/stories.ts` — `fetchStoriesForUser` reads the phone from the
  HttpOnly `User-Data` cookie, the one place the viewer is out of the browser's
  reach. **`fetchStoriesForGuest` deleted** (50 lines): it read the
  feed and never filtered it, and had no caller anywhere.

**Application — the seams**

- `components/Home/Stories/Story.tsx` — `data-id={story?.id}` on the tile.
- `components/Home/Stories/StoryHolder.tsx` — `data-story-id`, rendered **only
  when the holder is `active`** (the carousel mounts several at once), carrying
  `story.stories[currentStoryId]?.id || story.stories[0]?.id` — the report's own
  expression, fallback included, which also covers delete. The `console.log` that
  printed the signed-in stories profile to every browser console on every render
  is removed.
- `components/Home/Stories/ReportStoryModal.tsx` — `data-pw` on each reason
  (keyed by the backend's stable value, never the translated label), the notes
  box, submit and cancel.
- `components/global/ImageCropWidget.tsx` — `data-pw` on Save. A photo upload
  cannot get past this editor without it, and its label is translated.

No copy was added or changed anywhere, so there are no new translation keys.

**Browser suite**

- `tests/e2e/harness/storyFinder.ts` — **new, pure.** Paging, the 5-page cap, the
  page-one-only poll (12 attempts, 5 s, breaking on the first hit), and matching
  on the whole link or this run's prefix. No Playwright import, so the unit suite
  can drive it.
- `tests/e2e/actions/story.ts` — **new.** Builds the link from `qaStoryLinkHost()`
  and checks it with `isQaStory()` before uploading; watches the media-server and
  `add_story` requests so a refusal names the backend instead of hanging;
  advances the viewer to this run's own item; reports and deletes only after the
  id on screen matches.
- `tests/e2e/stories.live.spec.ts` — **new.** STORY-00a, 00b, 01, 03, 03b, 04, 05
  and the `afterAll` net.
- `tests/e2e/harness/liveSession.ts` — `SESSION_STATE.stories` and
  `.storiesReporter`.
- `tests/e2e/harness/env.ts` — `hasQaStoryViewers()` and
  `NO_QA_STORY_VIEWERS_REASON`.
- `tests/e2e/harness/orderCleanup.ts` — `throughProxyInPage` gained a `server`
  option feeding **both** the proxy header and the `/api/auth/refresh` body.
- `tests/e2e/laneConfig.ts` — the spec added to `ACCOUNT_LANE`; the guard now
  reports 9 specs and passes.
- `tests/e2e/selectors.ts` — the `stories` locator group.
- `tests/e2e/README.md` — the new setting, its four traps, how the ids are found,
  how a run aims at its own story, and what it leaves behind.

**CI — nothing.**

The approved plan added a step to `.github/workflows/e2e-lane.yml`. The owner's
change of 2026-09-20 removed the need for it: the harness derives the list from
the two phones the environment blob already carries. The file is **reverted and
untouched**, so this change modifies **no protected runtime path**, and the
`main` pull request follow-up from `review.md` falls away.

## Changes prepared (uncommitted)

No commit was created (IM-9). `git status` shows exactly the files above, plus
the ticket's own `_specs/` folder.

**One file in the working tree is not mine and must not be included:**
`scaling/AppScaler.tsx` carries a sibling session's iOS keyboard work (a
`TOUCH_SETTLE_MS` rubber-band delay). Checked before it could be swept in.

## Deviations from plan

1. **No video case and no video fixture.** `AC-6` was withdrawn by the owner
   after `BLK-VIDEO-01`; `STORY-02` was written and then deleted, so the file
   carries no case that skips for ever.
2. **No photo fixture file**, as planned: the 1×1 PNG is built in memory in
   `actions/story.ts`, the same way `profile.live.spec.ts` does.
3. **`tests/services/story.test.ts`'s pinned reader list was left as it is.** The
   plan said to remove the guest reader from it; the list names **files**, not
   functions, and `serverRequests/stories.ts` stays in it through
   `fetchStoriesForUser`. A new case pins the deletion instead.
4. **The viewer is advanced by a coordinate click**, not a selector. The next
   control is an unmarked half-width zone in `StoryViewer.tsx`, and that file is
   not in the approved file list — adding a hook there would be scope creep under
   IM-4.
5. **Keyed on phone numbers, not stories ids**, and derived rather than
   configured — the owner's change of 2026-09-20, written up in
   `plan.md > Owner change`. It reverted two files the plan had named:
   `.github/workflows/e2e-lane.yml` and the `storiesId` addition to
   `tests/e2e/actions/auth.ts`.
6. **`StoriesBarClient` uses `useMemo`.** The repository discourages manual
   memoisation without a profiled reason; the reason here is correctness, not
   speed. `StoriesWrapper` re-seeds the shared story list whenever the `stories`
   prop identity changes, and re-seeding discards pages 2+, the watched rings and
   optimistic deletes.

## Tests written

| AC | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `tests/services/story.test.ts` | `with no viewer list, a QA story is still dropped for a signed-in viewer` | extend |
| AC-2 | `tests/utils/qaStoryFilter.test.ts` | `keeps a QA story when the viewer is on the list` | new |
| AC-2 (late id) | `tests/components/Home/storiesBarClient.test.tsx` | `shows the QA story when the viewer id arrives after the feed` | extend |
| AC-3 | `tests/utils/qaStoryFilter.test.ts` | `drops a QA story for a viewer who is not on a configured list` | new |
| AC-4 | `tests/utils/qaStoryFilter.test.ts` | `a malformed list changes nothing and never throws` (4 cases) | new |
| AC-4 (dangerous direction) | `tests/utils/qaStoryFilter.test.ts` | `refuses %s as a viewer id` (8 cases) + `drops the empty entries a trailing comma leaves behind` | new |
| AC-5 | `tests/e2e/stories.live.spec.ts` | `STORY-01 a photo story is uploaded and carries this run's mark` | new |
| AC-6 | — | **withdrawn by the owner on 2026-09-20.** `STORY-02` was written, then removed from the file; no skipping case is left behind | n/a |
| AC-7 | `tests/e2e/stories.live.spec.ts` | asserted inside STORY-01: built from `qaStoryLinkHost()`, `isQaStory()` before upload, stored link checked after, deleted at once if unmarked | new |
| AC-8 | `tests/e2e/stories.live.spec.ts` | `STORY-04 the second account reports the story this run uploaded` | new |
| AC-9 | `tests/e2e/stories.live.spec.ts` | `STORY-05 every story this run uploaded is deleted, and is gone from the backend` | new |
| AC-10 | `tests/e2e/actions/story.ts` | identity checked before the click **and** again with the report sheet open | new |
| AC-11 | `tests/harness/storyFinder.test.ts` | `finds the marked story when it is on page three` + `stops at the page limit` (7 cases) | new |
| AC-12 | `tests/e2e/stories.live.spec.ts` | the file-level skip lines + `STORY-03` | new |
| AC-13 | `tests/e2e/stories.live.spec.ts` | the `afterAll` net, from `SESSION_STATE.stories`, bounded to 5 pages | new |
| AC-14 | `tests/e2e/stories.live.spec.ts` | `STORY-03b a guest never sees this run's story, while it is live` | new |
| AC-15 | `tests/harness/qaHarness.test.ts` | unchanged; the new cases print no credential | existing |
| AC-16 | `tests/services/story.test.ts` | `serverRequests/stories.ts no longer exports an unfiltered guest reader` | extend |
| AC-17 | `tests/e2e/actions/story.ts` | the rule is written into `readStoryFeedPage`'s contract; messages carry only this run's token and ids, and backend text is capped at 200 characters | new |
| AC-18 | `tests/utils/qaStoryFilter.test.ts` | `is set by no tracked env file` | new |

### Red before green

- `tests/utils/qaStoryFilter.test.ts` — run against the current filter with the
  change stashed: **13 failed, 8 passed** (ids version), and **18 failed, 8
  passed** after the move to phones. With the change restored: **21** then **26
  passed**. The 8 that passed both ways are the "still dropped" guards, which are
  meant to hold in both directions.
- `tests/components/Home/storiesBarClient.test.tsx` — the late-id case run with
  `StoriesBarClient.tsx` stashed: **1 failed, 6 passed**. Restored: **7 passed**.

## Findings — confirmed bugs, out of scope

| BUG | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------|
| BUG-1 | The story upload promise **never settles** on three paths, so the screen sits on its spinner for ever: the video branch resolves only when a poll sees `readyState === 4`, with no reject and no cap; the `duration > 59` branch clears that poll and returns without resolving; and on a refusal both the video and the image branch log, show a message, and call neither `resolve` nor `reject`. | **None — found by reading, not by a test.** A confirming test would have to drive a real refusal through the media server, which the browser suite cannot force. `actions/story.ts` works around it by watching the two requests, so this suite reports the refusing backend instead of hanging. | `components/Home/Stories/AddStoryWidget.tsx:201-262`, `:238-252`, `:295-305` | _(opened by the owner)_ |

`BUG-1` is **outside** `plan.md > Files to change`, so it is a finding and not
this ticket's to fix (IM-12). No expected-failure marker is left behind, because
there is no confirming test to mark — recorded plainly rather than implied.

## Blockers

**`BLK-VIDEO-01` is resolved** — by the owner removing `AC-6` from scope on
2026-09-20, not by finding a fixture. Kept here because the measurement is the
reason the scope changed, and the next person to want a video story needs it.

| Blocker | What was blocked | Why |
|---|---|---|
| `BLK-VIDEO-01` (resolved) | `AC-6` — the video upload case | The repository tracks no video, and no tool on this machine can make one the app would accept. Playwright's bundled `ffmpeg` (`ms-playwright/ffmpeg-1011`) muxes **only `webm` and `image2`** and encodes **only PNG and VP8** — measured, not assumed — while the app's picker offers `.mp4,.mov,.3gp,.avi` and no `.webm`. Uploading a webm would exercise a path no shopper can reach, which proves nothing. The plan's stated fallback was "a small public-domain clip", which means bringing a binary into a public repository — the owner's call, not mine. |

**How it was resolved:** option 3 — the owner dropped the video from scope.
Should a video story ever be wanted, the two remaining ways in are a committed
MP4 (under 200 KB, under 59 seconds, synthetic frames, decodable in Chromium), or
an authorised download of a named public-domain clip.

## Validation run during implementation

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `pnpm lint` | **0 errors**, 73 warnings — all pre-existing; none in any file this ticket touched (checked by name) |
| `pnpm test:run` | **195 files, 2986 tests, all passed** (before the phone change) |
| `pnpm test:run` (after the phone change) | see `verify.md` |
| `npx tsc --noEmit` (after the video case was removed, and again after the phone change) | exit 0 |
| `pnpm lint` (after the phone change) | 0 errors |
| `pnpm build` | exit 0 — the production build succeeds with the filter change in both graphs |
| `npx tsx -e "laneSpecs('account')"` | 9 specs, guard passes |
| `python -c "yaml.safe_load(e2e-lane.yml)"` | parses |

The browser cases were **not** run. They need `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES`
set to both accounts' stories ids and a rebuild, and `/verify` owns that run.
