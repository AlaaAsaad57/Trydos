---
ticket: e2e-stories-upload-report-delete
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-20
links:
  clickup:
  github:
---

# Plan — e2e-stories-upload-report-delete

> Decide the approach before changing code. Plan only — no implementation here.
>
> **Fifth draft.** The first four are recorded in the three **Plan check** tables
> at the end. The fifth applies one change the owner made during `implement` on
> 2026-09-20 — see **Owner change: phones, not ids** directly below.
>
> **Fourth draft, after three plan-check rounds.** Every finding and its answer is
> recorded in the three **Plan check** tables at the end. Round 3 was a
> convergence check: it confirmed most earlier answers and found that one of them
> — the viewer id — rested on a false fact. That is corrected here.

## Owner change: phones, not ids (2026-09-20, during `implement`)

The owner asked for the allow-list to be keyed on the **test phone numbers**
already configured, rather than on stories-service ids, with the goal of "less
manual involving". Three things follow, and they make the change strictly
smaller than what this plan was approved for:

1. **`NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` replaces `…_IDS`.** Matching ignores
   everything that is not a digit, on both sides — the rule
   `utils/server/otpAllowlist.ts` already uses for the test numbers that skip the
   one-time-code limiter.
2. **Nobody configures it.** `tests/e2e/harness/server.ts` derives it from
   `TEST_ACCOUNT_PHONE` and `TEST_ACCOUNT_PHONE_2` when it builds the app. There
   is no id to look up, and no second setting that can drift out of step with the
   accounts in use.
3. **Two things this plan named are no longer needed and were reverted:** the
   change to `.github/workflows/e2e-lane.yml` — so **no protected runtime path is
   touched and the `main` pull request follow-up falls away** — and the
   `storiesId` field on `signedInSession`, which existed only to look the id up.

**What it costs.** A phone number is personal data where an account id is not, so
the value must stay out of every tracked file and out of every message. It is set
in exactly one place: the app the harness builds, starts on a loopback port and
throws away. `AC-18` still checks no tracked file sets it.

**This was not re-reviewed.** It is a change to an approved plan, made during
`implement` on the owner's instruction. The gate can be re-run if wanted.

## Approach

Four parts, in order of weight.

**1. A viewer allow-list on the story filter.** A short list of stories-service
user ids, read from `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES`, that still see QA stories.
Every other viewer — every customer, every guest — keeps seeing exactly what they
see today. The list is empty by default.

**Where the viewer comes from, corrected.** The third draft said
`getUserStories()` falls back to the `User-Data` cookie in the browser. **It does
not.** `USER_DATA` is in `HTTPONLY_COOKIE_NAMES`
(`utils/cookies/cookie-manager.ts:95-110`) and `getCookie` reads `document.cookie`
(`:172-190`), which never holds an HttpOnly cookie. So in the browser the store
value is the **only** source. That matters because the store is seeded after boot
— `components/Home/Init.tsx:37` drives `services/home.ts:353`, which reaches
`loginSuccessStories` at `:395`/`:399` — while the bar's effect runs on mount with
deps `[language, country]` (`StoriesBarClient.tsx:49-82`).

So each reader is handled on its own terms, and the plan says plainly what each
one can and cannot do:

| Reader | Where the viewer's phone comes from | When the store is not yet seeded |
|---|---|---|
| `StoriesBarClient` (bar) | the store, at **render** | nothing is lost — it already subscribes at `:46`, so the render re-runs when the id lands and the QA story appears then |
| `StoriesPaginationWrapper` (paging) | the store, at fetch | fine in practice: paging is triggered by scrolling, long after sign-in |
| `services/story.ts` `getStories` | the store, at fetch | fine in practice: its only app caller is `services/auth.ts:377`, inside the sign-in flow, after the store is filled |
| `serverRequests/stories.ts` | the `User-Data` cookie, read **server-side** | the cookie is readable there, so this one reader is out of the browser's reach |

**Where the real guarantee lives.** The browser readers learn who is looking from
store state a visitor can change, so the browser-side check is **advisory, not a
control**. The guarantee is the one the QA lock already relies on: the variable is
**unset on every build a customer can reach**, so the list is empty, so no id
matches and nothing a browser sets can matter. Only the server reader's cookie
read happens out of reach. Same trust model as `QA_VIEW_SECRET`, same single weak
point — a wrong setting on a deployed environment — so this ticket adds one cheap
check that no tracked file sets it.

**The `otpAllowlist` comparison.** The *shape* is copied from
`utils/server/otpAllowlist.ts` — a short list of things the team owns, empty means
off, one variable. The *exposure is not the same*: that file is
`import "server-only"` (line 1) and its value never reaches a browser, while a
`NEXT_PUBLIC_` list is inlined into the JavaScript bundle. On a build that has it
set, knowing an id is enough to see test stories. That is the price of having
browser readers.

**2. A per-run mark inside the link, built from the app's own host.** The QA mark
is the link's **host** only (`utils/qaStoryFilter.ts:52-60`), so the host alone
cannot tell this run's story from a leftover of an earlier run, from another
run's story, or from another item in the same ring. The upload carries

```
https://<qaStoryLinkHost()>/e2e/<run token>/<photo|video>
```

- **The host comes from `qaStoryLinkHost()`, never typed.** A typo or a stale
  `NEXT_PUBLIC_QA_STORY_LINK_HOST` would upload real, visible media. The case
  asserts `isQaStory({ link })` **before** uploading and asserts the **stored**
  link is still QA-marked after; if it is not, it deletes the story at once and
  fails. `validateLink` accepts any parseable host
  (`AddStoryWidget.tsx:118-153`), so the app will not refuse this link.
- **The run token is opaque and random.** No phone number, account id, e-mail,
  branch name, secret or internal host. It is written into a public field on a
  shared backend and stays there.

**3. Four DOM seams the suite cannot work without**, one attribute each, no
behaviour: the story tile has no id; the story holder does not say which item the
app would act on; the report sheet has no hooks; and the image crop editor's Save
control is matched only by translated text.

**4. Delete the dead guest reader rather than test it.** See **OQ-9 revisited** —
a change from the owner's literal instruction, reversible at the gate.

Rejected: a secret header (a secret that reaches the browser is a secret anybody
can copy); faking the feed inside the test (the owner asked for a rule the app
follows); the product page's unfiltered story row (a customer story cannot be
attached to a product — `OQ-2`).

## Steps

1. Add the allow-list to the story filter: one exported predicate
   `isQaStoryViewer(id)`, read the way the neighbouring `qaStoryLinkHost()` reads
   its own variable — **no memo cache**, because the value is inlined at build
   time. Give `dropQaStories` an optional second argument, hoist the host and the
   list **once per call**, drop empty entries, and compare trimmed strings, never
   with `includes`.
2. Pass the viewer id in: the three browser readers from the store, the server
   reader from the `User-Data` cookie.
3. Make the stories bar keep the **raw** page in state and compute the filtered
   list from `[raw page, viewer id]` only — never on every render.
   `StoriesWrapper` re-seeds the shared store whenever the `stories` prop identity
   changes, and its own comment says re-seeding throws away pages 2+, the watched
   rings and optimistic deletes (`StoriesWrapper.tsx:19-33`).
4. Delete `fetchStoriesForGuest`, which has no caller.
5. Add the DOM seams: the group id on the tile; on the holder, the id of the item
   the app would act on, **rendered only when the holder is `active`**; `data-pw`
   on the report sheet's reasons, notes box and submit; `data-pw` on the crop
   editor's Save.
6. Remove the `console.log` at `StoryHolder.tsx:34`, which prints the signed-in
   stories profile to every browser console on every render. The file is already
   being changed, so it is in scope.
7. Write the unit tests for steps 1–3, red first.
8. Build the photo in memory; no fixture file is kept.
9. Add the stories id to what `signedInSession` brings back.
10. Write the browser steps: sign in, upload, locate, advance-to-item, report,
    delete.
11. Write the browser spec, give it its own session files, and put it in the
    account lane.
12. Add the new variable to the environment the CI harness builds — a repository
    **variable**, not a secret, printing presence only.
13. Open the same CI change against `main`. It touches
    `.github/workflows/e2e-lane.yml` and nothing else: `main` carries the staging
    storefront gate as one revertable unit.
14. Write down in the README: the variable's name and shape, that it must never be
    set on a deployed app, that `NEXT_PUBLIC_*` is inlined so `--skip-build` serves
    a build without it, and how the two stories ids are found. **Never the
    values.**

## Files to change

**Application**

- `utils/qaStoryFilter.ts` — add `isQaStoryViewer(viewerId)`; give
  `dropQaStories` an optional second argument (it declares one parameter today,
  `:81-83`).
- `services/story.ts` — `getStories` destructures only `setStoryData, storiesData`
  (`:21`); read `userStories` from the store and pass its id.
- `components/Home/Stories/StoriesBarClient.tsx` — hold the raw page, compute the
  filtered list from the raw page and the viewer id, pass the filtered list down.
- `components/Home/Stories/StoriesPaginationWrapper.tsx` — pass the store id at
  `:59`.
- `serverRequests/stories.ts` — `fetchStoriesForUser` passes the id from the
  `User-Data` cookie via `getCookieServer`; **`fetchStoriesForGuest` is deleted**
  (`:92-141`).
- `components/Home/Stories/Story.tsx` — add `data-id={story?.id}` beside
  `data-pw="story-element"` (`:17`), matching `ProductStories.tsx:27`.
- `components/Home/Stories/StoryHolder.tsx` — three edits:
  1. add `data-story-id`, **only when `active`** (the condition already used at
     `:86`). The cube carousel mounts up to four holders at once
     (`NewStories.tsx:155-165`), so an unconditional attribute would also match
     three other authors' groups.
  2. the value **mirrors what the report actually posts**:
     `story.stories[currentStoryId]?.id || story.stories[0]?.id` (`:178-180`).
     Delete reads `story.stories[currentStoryId]?.id` (`:38`) with no fallback, so
     the report's expression is the wider of the two and covers both.
  3. remove the `console.log` at `:34`.
- `components/Home/Stories/ReportStoryModal.tsx` — `data-pw` on each reason
  control, the notes box and the submit button.
- `components/global/ImageCropWidget.tsx` — one `data-pw` on Save (`:210-215`).
  Choosing an image opens this editor (`AddStoryWidget.tsx:366-369`, `:502-508`),
  and its Save is matched only by translated text, so without a hook the photo
  case stalls to its cap. The default crop is 100% at 0,0 (`:81-89`), so Save
  passes the original file through.

No copy is added or changed anywhere, so there are no new translation keys.

**Unit tests**

- `tests/utils/qaStoryFilter.test.ts` — **new.** The helper has no test file of
  its own.
- `tests/services/story.test.ts` — **extend.** Reader-level cases; remove the
  deleted guest reader from the pinned list.
- `tests/components/Home/storiesBarClient.test.tsx` — **extend.** It imports the
  changed component (`:3`). Covers the late-arriving viewer id.

**Browser suite**

- `tests/e2e/harness/storyFinder.ts` — **new, and pure.** Takes a `readPage(n)`
  function; no `@playwright/test` import and no `Page`, the seam `qaGrepFor` uses.
- `tests/harness/storyFinder.test.ts` — **new.** Fake pages, the mark on page
  three, and the page cap.
- `tests/e2e/actions/auth.ts` — **extend.** `signedInSession` already reads
  `/api/auth/me` and reduces `storiesUser` to a boolean (`:699-706`), while the
  route keeps the id — `sanitizeServiceUser` strips only tokens
  (`utils/server/tokenManager.ts:295`, `:309-314`). Return `storiesId` as well.
  This is one line in an existing helper, and it is a better source than the
  cookie.
- `tests/e2e/actions/story.ts` — **new.** Upload, locate, advance-to-item, report,
  delete.
- `tests/e2e/stories.live.spec.ts` — **new.** The cases.
- `tests/e2e/harness/liveSession.ts` — add `SESSION_STATE.stories` and
  `SESSION_STATE.storiesReporter`.
- `tests/e2e/harness/orderCleanup.ts` — **extend.** `throughProxyInPage`
  hardcodes `toServiceToken("market")` (`:191`) **and** hardcodes
  `server: "market"` in its 401 refresh body (`:155-169`), while the refresh route
  is per-service and supports `stories` (`app/api/auth/refresh/route.ts:53-74`).
  The new `server` option must feed **both**, or a rotated stories token reads as
  a stories-backend refusal.
- `tests/e2e/laneConfig.ts` — add the spec to `ACCOUNT_LANE` (`:119-127` throws
  otherwise).
- `tests/e2e/selectors.ts` — the story locators.
- `tests/e2e/harness/env.ts` — `hasQaStoryViewers()`, whose skip text says "set
  for this process — rebuild if you changed it".
- `tests/e2e/README.md` — the variable, how the two ids are found, the
  `--skip-build` trap, and the rule. Name and shape only, never values.

**No photo fixture.** `profile.live.spec.ts:204-214` already builds a 1×1 PNG in
memory with the comment "made here rather than kept as a fixture file", and
`tests/e2e/harness/sellerDashboard.ts:275-292` puts those same bytes through the
same ticket-plus-`/gated/upload` chain. It asks for a ticket with `story: false`
while the story path uses `GetTicket("stories", …)`, so `/implement` confirms the
stories folder takes the same bytes.

**CI**

- `.github/workflows/e2e-lane.yml` — **a protected runtime path.** One addition to
  the "Add the QA settings" step (`:182-219`): write
  `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` from a repository **variable** (`vars.`), not
  a secret. A short numeric id kept as a secret would be masked everywhere and
  would hide unrelated numbers in the same log. The step prints presence only,
  copying the `echo "Added …"` shape at `:204-212`.

## Numbers

**The old baseline is dropped, and the reason is not only that it was stale.**
`.github/workflows/e2e-lane.yml:25` says "account ~30 min of work" and `:15` still
says six spec files sign in as that account; `ACCOUNT_LANE` now holds **eight**
(`tests/e2e/laneConfig.ts:39-54`), so besides the QA lock there are seven. More
importantly, **caps do not add up against a global timeout**: the seven other
specs' own caps already sum past 85 minutes on their own
(`shopper.live.spec.ts:286`, `:560`, `:773`, `:1273` alone are 45 minutes;
`profile.live.spec.ts` about 26). Only measured wall time decides.

| Thing | Value | Source |
|---|---|---|
| QA seed deadline | 26 min | `qaSeed.ts:186` (`1500 * 1000`) + `:334` |
| QA lock case caps | ~25.5 min (1530 s) | `qaLock.live.spec.ts`, 12 `test.setTimeout` calls |
| Playwright global cap | 85 min | `playwright.config.ts:82` |
| Lane job cap | 100 min | `.github/workflows/e2e-lane.yml:82` |
| Only measurement on record | 30.0 min inside Playwright, run 33991656686 — **before the lane split** | `playwright.config.ts:66-71`; `docs/architecture-and-deployment.md:60` says 15–45 min for both lanes |

| New case | Budget | Why |
|---|---|---|
| STORY-00a sign in as the uploader, read its stories id | 180 s | `PROF-01` spends the whole 120 s default on one sign-in (`profile.live.spec.ts:234`) |
| STORY-00b sign in as the reporter | 180 s | as above; skipped with no second code |
| STORY-01 photo upload | 240 s | `PROF-05` uploads one 1×1 PNG at 180 s (`profile.live.spec.ts:744`); this adds the crop editor, a ticket call, `add_story`, the feed poll and the link check |
| ~~STORY-02 video upload~~ | — | withdrawn on 2026-09-20; see `BLK-VIDEO-01` |
| STORY-03 the feed shows this run's story | 180 s | one raw read plus the rendered feed |
| STORY-04 report | 180 s | advance to the item, then the sheet |
| STORY-05 delete both + backend check | 240 s | two deletes, two checks |
| `afterAll` cleanup net | 120 s, set explicitly | an `afterAll` otherwise inherits the project default |
| **New total, worst case** | **1320 s = 22 min** | 180×4 + 240×2 + 120 |

**The honest statement: the account lane has not been measured since the lane
split, and this ticket adds up to 22 minutes of caps.** `/verify` records the
measured lane duration before and after. If the measured total passes 70 minutes,
the stories cases move to their own lane rather than raising the cap.

**Bounds:**

- the poll after an upload runs on **page 1 only**, and **breaks on the first
  hit**: at most 12 attempts, 5 s apart. QA-10's 36 attempts
  (`qaLock.live.spec.ts:486-491`) is a **cap it does not normally reach**, not a
  measured need — it breaks on the first hit too;
- paging runs **only** in `STORY-03` and in the cleanup net: at most 5 pages;
- so a locate costs at most 12 reads, not 5 × 12.

**Both upload cases must fail fast, not hang.** The app's upload promise never
settles on two different paths:

- the video branch resolves only when a `setInterval` sees `readyState === 4`,
  with no reject and no cap (`AddStoryWidget.tsx:201-262`), and the
  `duration > 59` branch clears the interval and returns **without resolving**
  (`:213-221`);
- and on **refusal**, the `.catch` logs and shows a toast but calls neither
  `resolve` nor `reject` — in the video branch (`:238-252`) **and** the image
  branch (`:295-305`).

So both cases race the success toast against the "Upload Failed Try Again" toast
and fail at once, naming the media server or the stories backend, instead of
polling the feed for a minute and reporting "the feed never showed the story".
This is what makes edge case `E-2` readable. The video fixture must be proven
decodable in Chromium and **under 59 seconds** before it is committed.

**What is left behind, per run.** `deleteStory` sends only `story_id`
(`services/story.ts:161-170`), so uploaded media stays on the media server for
ever, and a filed report cannot be withdrawn. The suite runs nightly **and on
every push to `development`** (`test-e2e.yml:58-63`), and `cancel-in-progress:
true` (`:88-90`) can kill a run before the net deletes anything. So: one photo,
one video and one report per run. The fixture caps exist for that reason.

**Cost added to the app.** The server reader's extra cookie read is free — it is
a `"use server"` action already reading a cookie (`serverRequests/stories.ts:41-42`)
with `revalidate: 0` (`:54`). In the bar, step 3 moves filtering from "once per
response" to "once per change of the raw page or the viewer id", which is one or
two extra passes over a list of at most one page, not a per-render cost. The other
two browser readers keep filtering once per response.

## Integration surface

- **Components / shared config touched:** `utils/qaStoryFilter.ts` and its
  readers; the stories bar and its paging; the story tile, the story holder, the
  report sheet and the crop editor markup; `tests/e2e/laneConfig.ts`;
  `tests/e2e/harness/liveSession.ts`; `tests/e2e/harness/orderCleanup.ts`;
  `tests/e2e/actions/auth.ts`; one new public build-time variable; one new CI step
  input, on two branches.
- **Who else depends on them:** the QA production-safety lock —
  `qaLock.live.spec.ts` QA-11 (`:508`), and `tests/services/story.test.ts:265-289`,
  which pins that the live readers call the filter by reading their source text.
  **Three** components call `fetchStoriesForUser`: `StoriesList.tsx:31`,
  `FullEnhancedLoginWidget.tsx:232` and the upload sheet itself
  (`AddStoryWidget.tsx:263`, `:311`), the screen the new cases drive. All three
  inherit the new argument's default. `ImageCropWidget` is a **shared** component,
  so `/implement` must check its other callers before touching it — the change is
  one attribute, which none of them can notice.
  `tests/components/Home/storiesWrapper.test.tsx` covers `StoriesWrapper`, which
  is not changed and renders only `StoriesPaginationWrapper` (`:57`);
  `StoriesBarClient` is its **parent** (`StoriesBarClient.tsx:113`), not its child.
- **Overlapping flows:** the home page is a cached tree, which is why the bar
  fetches from the browser and why the viewer id must come from the store rather
  than a request header — `utils/server/qaMode.ts:18` forbids being reachable from
  a `"use cache"` tree and `tests/cache/noRuntimeReadsInCachedTree.test.ts` scans
  for it. `StoriesWrapper` re-seeds the shared story list on every `stories` prop
  identity change (`:19-33`), which is why step 3 pins the recomputation.
- **Ordering / lockstep dependencies:** the filter change and its call sites land
  together — a two-argument call against a one-parameter function is a TypeScript
  error, so the two halves cannot be split across commits. The spec file and its
  lane entry land together. The CI change must reach **both** `development` and
  `main` (`e2e-lane.yml:55-57`); the `main` pull request touches that one file.
- **Cross-case state:** the run token and the uploaded story ids live at module
  scope in the spec file — safe because `workers: 1` and `fullyParallel: false`
  (`playwright.config.ts:54-55`) keep one file in one worker.
  `wishlist.live.spec.ts:81-83` does the same, and `:85-98` is the pattern for a
  module-level page and its teardown.
- **What breaks if this is wrong:** if the list matches too widely on a deployed
  build, customers see test stories and QA-11 goes red. If the viewer id is read
  from a place that is empty at the moment of filtering — the failure round 2 and
  round 3 both circled — the list never matches and every case fails with "the
  feed never showed the story this run uploaded".

## Tests

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `tests/services/story.test.ts::the web feed drops a QA-linked story` (`:136`) — drops with no list set, but never sets one | extend | `tests/services/story.test.ts` | `with no viewer list, a QA story is still dropped for a signed-in viewer` |
| AC-2 | `none — searched tests/ for qaStoryFilter, dropQaStories, isQaStory; only story.test.ts names them` | new | `tests/utils/qaStoryFilter.test.ts` | `keeps a QA story when the viewer is on the list` |
| AC-2 (late id) | `tests/components/Home/storiesBarClient.test.tsx:3` imports the changed component | extend | `tests/components/Home/storiesBarClient.test.tsx` | `shows the QA story when the viewer id arrives after the feed, and does not re-seed the shared list on an unrelated render` |
| AC-3 | `none — searched as AC-2` | new | `tests/utils/qaStoryFilter.test.ts` | `drops a QA story for a viewer who is not on a configured list` |
| AC-4 | `none — searched as AC-2` | new | `tests/utils/qaStoryFilter.test.ts` | `an empty, blank or malformed list changes nothing and never throws` |
| AC-4 (the dangerous direction) | `none — searched as AC-2` | new | `tests/utils/qaStoryFilter.test.ts` | `an empty, null, undefined or zero viewer id is never on the list, and a trailing comma never matches everybody` |
| AC-5 | `none — searched tests/e2e for the add-story sheet; no spec drives it` | new | `tests/e2e/stories.live.spec.ts` | `STORY-01 a photo story is uploaded and carries this run's mark` |
| AC-6 | — | **withdrawn** | — | The video upload was removed from scope by the owner on 2026-09-20, after `BLK-VIDEO-01` showed no tool here can produce an MP4 the app accepts |
| AC-7 | `none — searched as AC-5` | new | `tests/e2e/stories.live.spec.ts` | inside STORY-01: the link is built from `qaStoryLinkHost()`, is QA-marked before upload, and the **stored** link is still QA-marked after |
| AC-8 | `none — searched tests/e2e for report; nothing drives the report sheet` | new | `tests/e2e/stories.live.spec.ts` | `STORY-04 the second account reports the story this run uploaded` |
| AC-9 | `none — searched as AC-5` | new | `tests/e2e/stories.live.spec.ts` | `STORY-05 both stories are deleted from the viewer, and are gone from the stories backend` |
| AC-10 | `none — searched as AC-5` | new | `tests/e2e/stories.live.spec.ts` | inside STORY-04 and STORY-05: the **active** holder's `data-story-id` equals the id this run uploaded — checked before the click, **and again with the report sheet open**, where the viewer is paused, immediately before submit |
| AC-11 | `none — tests/harness/qaHarness.test.ts:37-185 covers the guard, the grep, redaction and unusable-product messages` | new | `tests/harness/storyFinder.test.ts` | `finds the marked story on page three, and stops at five pages` |
| AC-12 | `tests/e2e/harness/qaSeedState.ts:50-58` is the shape to follow | new | `tests/e2e/stories.live.spec.ts` | the file-level skip lines, and `STORY-03 the feed shows this run's own story, wherever it sits` |
| AC-13 | `none — tests/e2e/harness/orderCleanup.ts is the precedent, for orders` | new | `tests/e2e/stories.live.spec.ts` | the `afterAll` net, from a module-level page opened on `SESSION_STATE.stories` — **the uploader's session, not a guest context** — bounded to the same 5 pages, and reporting plainly when that session file is missing |
| AC-14 | `tests/e2e/qaLock.live.spec.ts::QA-11` — it never requires a QA story to exist (`:549-563`), so on its own it can pass vacuously | extend | `tests/e2e/stories.live.spec.ts` | `STORY-03b while this run's story is live, the raw feed holds it and a guest's rendered home page does not` |
| AC-15 | `tests/harness/qaHarness.test.ts::the QA secret is masked` | existing | — | plus `AC-17` |
| AC-16 | `tests/services/story.test.ts:271-276` pins reader **files**, so a change to the guest reader could never go red there | extend | `tests/services/story.test.ts` | the guest reader is deleted, so the rule cannot be skipped there; `fetchStoriesForUser` keeps the file in the pinned list |
| AC-17 | `none — new at round 2` | new | `tests/e2e/actions/story.ts` | every message built from an **unfiltered** feed read names only this run's own token and story ids. **The rule is the control, not redaction**: `redact()` masks configured secrets and tokens (`tests/e2e/harness/redact.ts:118-131`) and cannot mask another author's name |
| AC-18 | `none — new at round 2` | new | `tests/utils/qaStoryFilter.test.ts` | no tracked file in the repository sets `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES`. **Residual, stated:** this cannot see a value set in a deploy platform's own settings, which is the case the finding named |

**Red-first.** `AC-1` to `AC-4` and the late-id case are written against the
current code, run, and **seen to fail**, before the filter is touched.

## OQ-9 revisited — delete the dead reader, do not test it

The owner said on 2026-09-20: *"app also will respect the same rule for it so
dont considering as open."* The second draft honoured that literally. Plan check
showed the weaker reading:

- the repository forbids testing code with no caller, and this function has none;
- a reader that **does not exist** cannot skip the rule, so deleting it satisfies
  `FR-15` more completely than adding a filter call;
- nothing breaks: the pin in `tests/services/story.test.ts:271-276` lists the
  **file**, and `fetchStoriesForUser` keeps that file in the list.

Flagged so the gate can reverse it: say the word and the filter-plus-test version
comes back.

## Validation strategy

- Validation profile: `full` (`lint`, `typecheck`, `unit-tests`, `build`, all at
  `all-ac` — `.claude/project-config.yaml:76-86`). `build` is in on purpose:
  `utils/qaStoryFilter.ts` is imported by both server and browser modules.
- The profile proves `AC-1` to `AC-4`, the late-id case, `AC-11`, `AC-16` and
  `AC-18`.
- The browser cases are **not** run by any profile. `/verify` runs them by hand
  and records the exit code, the output and the **measured lane duration** per
  `AC-n`:

  ```
  pnpm e2e:health
  npx tsx tests/e2e/cli.ts run --lane=account --grep="STORY-"
  npx tsx tests/e2e/cli.ts run --lane=account --grep=@prod-safe
  npx tsx tests/e2e/cli.ts run --lane=account          # the measured total
  ```

  `--skip-build` must **not** be used: the variable is inlined at build time, so a
  reused build has no list in it.

## Rollback

- **The filter and its call sites revert together.** `dropQaStories` declares one
  parameter today (`utils/qaStoryFilter.ts:81-83`), so a two-argument call against
  the reverted function is a TypeScript error and both `typecheck` and `build`
  would fail. The third draft said reverting the one module was enough; that is
  true at runtime and false at build time.
- **Clearing `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` also works, but not instantly.**
  `NEXT_PUBLIC_*` is inlined at build time, so a running build keeps the old list
  until it is **rebuilt** and redeployed. This is *not* the same rule as
  `utils/server/otpAllowlist.ts:47-48`, which says "the next deployment / server
  start" — that variable is server-only and a restart is enough for it.
- Restoring `fetchStoriesForGuest` is a revert of one deletion; nothing calls it.
- The four markup additions and the removed `console.log` carry no behaviour.
- The browser spec is removable on its own: the file, its lane line, its two
  session keys, the `server` option on the cleanup helper, and the `storiesId`
  field on `signedInSession`.

## Deferred questions, now answered

- **OQ-4 — which account uploads.** Both may upload. **Shopper A uploads and
  deletes**; **Shopper B reports**, because the report control is only drawn for a
  signed-in non-owner (`StoryHolder.tsx:106`). With `TEST_ACCOUNT_OTP_2` missing,
  only `STORY-00b` and `STORY-04` skip. Each account signs in **once**, in its own
  case, which writes the session file the later cases open —
  `openSignedInSession` throws when the file is absent (`liveSession.ts:151-157`),
  so something must write it.
- **OQ-7 — the fixtures.** Photo: none kept. The 1×1 PNG is built in memory, the
  way `profile.live.spec.ts:204-214` already does it. Video: **not needed** — the
  owner removed the video upload from scope on 2026-09-20. It was blocked
  (`BLK-VIDEO-01`): measured on this machine, Playwright's bundled `ffmpeg` muxes
  only `webm` and `image2` and encodes only PNG and VP8, while the app's picker
  offers `.mp4,.mov,.3gp,.avi` and no `.webm`, so a webm upload would exercise a
  path no shopper can reach.
- **OQ-8 — the lane.** `ACCOUNT_LANE`, beside `qaLock.live.spec.ts` (`:53`). The
  cases sign in as both shared accounts and write real rows. They do **not**
  depend on the QA seed.

## Open question for the owner

- **Is there a live DNS record for `qa-test.trydos.tech`?**
  (`utils/qaStoryFilter.ts:17`.) It is a subdomain of an apex the team already
  serves, so a stranger cannot register it — the round-2 worry was overstated and
  is narrowed here. What remains is a dangling record: every test story stores a
  permanent public link to that host, and this ticket adds one per run.

## Plan check — round 1

| Lens | Finding | Answer |
|---|---|---|
| security | Browser readers take the viewer id from client state, so a visitor can set it; `FR-2` claimed otherwise | Approach states the browser check is advisory; `spec.md` FR-2 and NFR-2 corrected |
| security | The `otpAllowlist` analogy hid the bundle exposure | Stated explicitly |
| security | Rollback claimed clearing the variable works with no deployment | Corrected (again at round 3) |
| security | A repository **secret** masks unrelated numbers in the log | CI uses a repository **variable** |
| security | The CI change lands only on `development` | Step 13 |
| security | The README could leak the real ids | Step 14: name and shape only |
| security | `AC-8` quotes a backend message, which can carry personal data | `AC-17` |
| senior | Nothing could tell this run's photo story from its video story | Per-run link and `data-story-id` |
| senior | `AC-16` could never go red | The reader is deleted instead |
| senior | No session-state key for a five-case live spec | `liveSession.ts` in Files to change |
| senior | The finder had no pure module to unit-test | `tests/e2e/harness/storyFinder.ts` |
| senior | `hasQaStoryViewers()` proves only that the variable is non-empty | The spec reads the account's stories id and fails early naming the mismatch |
| senior | A memo cache for a build-inlined value adds nothing | Dropped |
| senior | Wrong line reference to `getStories` | Corrected to `:21` |
| performance | No time budget | **Numbers** |
| performance | The finder had no page cap or poll bound | Written down |
| performance | The raw `/api/proxy` read is cheaper | Locating and the net use it |
| performance | Session reuse unstated | Under `OQ-4` |
| performance | Media is never deleted | Under **Numbers** |
| performance | Hoist the list out of the per-story loop | Step 1 |
| claim check | 10 wrong line references | All corrected |
| claim check | `AddStoryWidget` is a third caller of `fetchStoriesForUser` | Integration surface |
| claim check | Two existing unit test files cover changed files | `storiesBarClient.test.tsx` added |
| claim check | Playwright has three projects, not two | `research.md` corrected |

## Plan check — round 2

| id | Lens | Finding | Answer |
|---|---|---|---|
| R2-S1 | senior | The bar filters on mount while the store is seeded after boot, so the viewer id is `null` | Filter at render (step 3). **The third draft's cookie fallback was wrong — corrected at round 3** |
| R2-S2 | senior | Nothing in the suite can read a stories-service id | `signedInSession` returns it (round 3 showed the route already carries it) |
| R2-S3 | senior | The cleanup net cannot work from Node, and the helper hardcodes the wrong service token | Module-level page; `orderCleanup.ts` gains a `server` option — **and it must feed the refresh body too** (round 3) |
| R2-S4 | senior | `data-story-id` on the viewer proves nothing | Moved to the holder — **only when `active`, and mirroring the report's fallback** (round 3) |
| R2-S5 | senior | The viewer opens at the oldest item, so the irreversible report could land elsewhere | Advance to this run's item — **and re-assert with the sheet open** (round 3) |
| R2-S6 | senior | Testing the dead guest reader breaks a repository rule | Deleted instead |
| R2-S7 | senior | `STORY-03` cannot guarantee its own premise | Renamed; `AC-11` owned by the unit test |
| R2-S8 | senior | `--skip-build` serves a build with no list | Gate text, README and verify commands |
| R2-S9 | senior | The net must page as far as the finder | Same 5-page bound |
| R2-S10 | senior | Cross-case state never stated | Stated, with why it is safe |
| R2-Sec1 | security | Raw feed reads hold real customers' stories | `AC-17`; round 3 added that the rule, not redaction, is the control |
| R2-Sec2 | security | Nothing proved the typed link was QA-marked | Built from `qaStoryLinkHost()`, checked before and after |
| R2-Sec3 | security | `AC-14` rested on a vacuous QA-11 | `STORY-03b` |
| R2-Sec4 | security | The dangerous direction was untested | New `AC-4` case |
| R2-Sec5 | security | The run token's makeup was undefined | Opaque and random |
| R2-Sec6 | security | `AC-13` cannot hold past the page cap | Stated as a bounded residual |
| R2-Sec7 | security | Fixtures could contain a real person | Synthetic frames only |
| R2-Sec8 | security | The `main` PR could disturb the storefront gate | One file |
| R2-Sec9 | security | Nothing detects the variable on a deployed app | `AC-18`, with its residual stated (round 3) |
| R2-Sec10 | security | The QA host may not be owned | Narrowed at round 3 to a dangling DNS record; still with the owner |
| R2-P1 | performance | The lane baseline was a stale comment | Rebuilt; round 3 corrected the unit and the conclusion |
| R2-P2 | performance | No sign-in budgeted, and the session files had no writer | `STORY-00a`/`00b` |
| R2-P3 | performance | 120 s is below the suite's own precedent | ≥180 s, 240 s for the heavy cases |
| R2-P4 | performance | The video branch can hang | **Round 3: refusal hangs too, in both branches** — the fail-fast rule now covers both |
| R2-P5 | performance | The photo fixture repeats in-memory work | Dropped |
| R2-P6 | performance | Playwright's ffmpeg may not emit MP4 | Checked at `/implement`, fallback stated |
| R2-P7 | performance | The 30 s poll had no source | 12 attempts at 5 s, breaking on the first hit |
| R2-P8 | performance | The bounds multiplied | Polling is page 1 only |
| R2-P9 | performance | The leftover figure was wrong | Restated per run |
| R2-P10 | performance | The net had no budget or mechanism | Both stated |
| R2-P11 | performance | Five cases where the repo's model is `test.step()` | Kept separate: each writes a different real row |
| R2-C1 | claim check | One wrong line reference | Corrected |

## Plan check — round 3 (convergence)

Every round-1 and round-2 answer was re-checked against the code. Round 1: all
sound. Round 2: sound except where noted below.

| id | Lens | Finding | Answer |
|---|---|---|---|
| R3-S1 | senior + claim check | **`User-Data` is HttpOnly**, so the browser fallback in the third draft's `getUserStories()` story can never run | Approach rewritten with a per-reader table; filtering at render is the whole browser fix |
| R3-S2 | senior | Up to four `StoryHolder`s are mounted at once (cube carousel), so `data-story-id` would match other authors | Rendered only when `active` |
| R3-S3 | senior + security | The viewer auto-advances between the assert and the submit, and at the end of a ring moves to the next **author** — the irreversible report could land on a real customer | Re-assert with the sheet open, where the viewer is paused |
| R3-S4 | senior | The `server` option must feed the 401 refresh body, not only the proxy header | Stated in Files to change |
| R3-S5 | senior | The cleanup net's page must carry the uploader's session; the cited precedent is a guest context | `AC-13` row: opened on `SESSION_STATE.stories` |
| R3-S6 | senior | Filtering at render changes the prop identity, and `StoriesWrapper` re-seeds the shared list on every identity change | Step 3 pins the recomputation to `[raw page, viewer id]` |
| R3-Sec1 | security | The report target uses a fallback the attribute did not model | The attribute mirrors `story.stories[currentStoryId]?.id \|\| story.stories[0]?.id` |
| R3-Sec2 | security | `StoryHolder.tsx:34` logs the signed-in stories profile on every render | Step 6 removes it |
| R3-Sec3 | security | `AC-18` cannot see a value set in a deploy platform's settings | Residual stated in the `AC-18` row |
| R3-P1 | performance | The photo case meets a third screen — `ImageCropWidget`, whose Save has no hook | Added to Files to change |
| R3-P2 | performance | Refusal hangs too, in both upload branches | Fail-fast rule covers both |
| R3-P3 | performance | Caps are not additive against a global timeout; the other specs already sum past 85 min | "leaves ~34" removed; only measured wall time decides |
| R3-P4 | performance | "Unmeasured" was overstated | "Unmeasured **since the lane split**", with the 30-min pre-split run cited |
| R3-P5 | performance | STORY-01 was tight once the poll is counted | Raised to 240 s |
| R3-C1 | claim check | `ACCOUNT_LANE` has eight specs, so "the other six" is wrong | Corrected to seven |
| R3-C2 | claim check | `StoriesWrapper` renders only `StoriesPaginationWrapper`; `StoriesBarClient` is its parent | Corrected |
| R3-C3 | claim check | Reverting the filter alone breaks `typecheck` and `build` | Rollback corrected |
| R3-C4 | claim check | `otpAllowlist:47-48` says "server start", not "rebuild" | Rollback corrected |
| R3-C5 | claim check | "Runs once per response" contradicted the plan's own step 3 | Cost paragraph corrected |
| R3-C6 | claim check | `e2e-lane.yml:25` vs `:15` mis-cited | Corrected |
| R3-C7 | claim check | The `CheckLogin` citation pointed at a comment | Corrected to `Init.tsx:37` → `services/home.ts:353`, `:395`/`:399` |
| R3-C8 | claim check | "All three browser readers use that helper" was present tense | Rewritten as what step 2 adds |
| R3-C9 | claim check | QA-10's 36 attempts is a cap, not a measured need | Stated |
| R3-C10 | claim check | `wishlist.live.spec.ts` cite was off | `:81-83` state, `:85-98` page |
| R3-C11 | claim check | Severity counts in the header could not be checked | Counts removed |
| — | claim check | 78 other cited claims and all arithmetic confirmed | — |

## Out of scope

- The seller story feature and its separate create, list and delete calls.
- Attaching a story to a product.
- The story camera.
- Removing uploaded media from the media server — the app makes no such call.
- Withdrawing a filed report — the app has no such call.
- Deleting stories left by **earlier** runs. The net removes only this run's token,
  because another run may be in flight against the same environment.
- Fixing the never-settling upload promise in `AddStoryWidget.tsx`. It is a real
  defect, it is **not** in a file this plan changes, and fixing it would grow the
  change. `/implement` records it as a `BUG-n` finding and it gets its own ticket;
  the fail-fast rule above makes this suite report it clearly in the meantime.
- Any change to the story mark itself, or to the QA host constant.
- `docs/testing/E2E_SCENARIOS.md` and the dated summaries.
