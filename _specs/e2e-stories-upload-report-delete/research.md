---
ticket: e2e-stories-upload-report-delete
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-20
links:
  clickup:
  github:
---

# Research — e2e-stories-upload-report-delete

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Find out what a browser test of the stories journey — upload, report, delete —
actually touches, and find out whether such a test can run at all without
putting a test story in front of a real customer.

## The short version

The three actions exist, all three have working UI, and most of the selectors a
test needs are already in the code. One thing stands in the way, and it is not
small:

**The QA mark for a story is its link, and every reader of the story feed drops a
QA story with no way round it.** So a story that is safe is also invisible — to
the customer, and to the test. Today a test cannot open, report or delete its own
QA story from the home stories bar, because the bar never shows it.

Two ways out were found and both are real. They are written up under `OQ-1`. One
needs an application change; the other does not, and uses a path that was never
filtered — the product page's own story row.

---

## Relevant directories

- `components/Home/Stories/` — the whole customer-facing story journey: the
  upload sheet, the bar, the viewer, the report sheet, the delete confirm.
- `components/SellerDashboard/` — `StoriesTab.tsx`, a **second and different**
  story feature (see "Two different story objects" below).
- `services/` — `story.ts` holds all three calls this ticket exercises.
- `serverRequests/` — `stories.ts` and `product.tsx` are the two server-side
  story readers.
- `utils/` — `qaStoryFilter.ts` is the QA mark and the filter.
- `tests/e2e/` — the browser suite. `actions/` holds the reusable steps,
  `harness/` the setup and the environment gates, `selectors.ts` the locators.
- `tests/` — the unit suite. `tests/services/story.test.ts` and
  `tests/fixtures/story.ts` already exist.

## Relevant config files

- `playwright.config.ts` — `testIdAttribute: "data-pw"` (line 111), `retries: 0`
  (line 48), `workers: 1` (line 54), per-test timeout 120 s (line 60), and
  **three** projects: `setup` (the QA seed, line 134), `live` (line 147, which
  declares `dependencies: ["setup"]` at line 152) and `scripted` (line 168).
  `*.live.spec.ts` runs against real staging and never records a trace;
  `*.scripted.spec.ts` fakes the browser's own calls.
- `tests/e2e/laneConfig.ts` — the two lane lists. **A spec in neither lane makes
  `laneSpecs()` throw** (line 120), so a new spec file must be added to a lane in
  the same change. `ACCOUNT_LANE` is one worker; `SOLO_LANE` is two.
- `vitest.config.mts` — the unit project. It excludes `tests/e2e/` on purpose,
  because those files are also named `*.spec.ts`.
- `.gitignore` — checked for this ticket. Only `tests/e2e/.artifacts/` (line 141)
  and `tests/e2e/.auth/` (line 143) are ignored under `tests/`, plus one named
  file `BOTTOMNAVIGATION.mp4` (line 151). **There is no pattern that would
  silently swallow a committed fixture image or video** under `tests/e2e/`. This
  answers the intake's `Q3` worry about the `scripts/*` trap: it does not apply
  here.
- `.github/workflows/e2e-lane.yml` — writes the environment the harness builds
  and starts, and is where `QA_VIEW_SECRET` and `TEST_ACCOUNT_OTP_2` are added.

## Possibly affected services

The app calls three different backends in this journey. A failure message must
name which one, per the repository testing rules.

| Backend | What it does here | Where |
|---|---|---|
| **stories** | `add_story`, `delete_story`, `report`, `users_stories`, `product_stories` | `services/story.ts:130`, `:164`, `:195`, `:25`, `:303` |
| **media server** | takes the image or video file and returns its address | `services/story.ts:86-118`; needs an upload ticket first (`GetTicket("stories", isVideo, 1)`, line 86) |
| **core** | the profile that decides whether the Add-Story tile is drawn at all | `components/Home/AddStory.tsx:49` reads `userProfile.is_allowed_to_upload_story` |

## What the journey actually looks like (read from the code)

### Upload

1. The tile is drawn **only** when the profile says the account may upload:
   `components/Home/AddStory.tsx:72` returns an empty element otherwise (the test is at `:56`). Selector
   `data-pw="Add-Story-Button"` (line 59).
2. The sheet offers three controls: "Take Photo" (camera, no selector), **Upload
   Photo/Video** (`data-pw="Gallery-Photo-Option"`, `AddStoryWidget.tsx:597`), and
   a link box (`data-pw="link-story-input"`, line 611).
3. The hidden file input is `#stories-input-holder` and accepts
   `.jpg,.jpeg,.png,.gif,.mp4,.mov,.3gp,.avi` (`AddStoryWidget.tsx:649`, `accept` at `:651`).
4. **The share button only exists when media is chosen** —
   `{preview && (<button data-pw="share-story-button" …>)}` — the guard at line 635, the attribute at line 638. So there
   is **no link-only story**. A link is a field attached to a photo or a video
   story, never a story on its own.
5. The file goes to the media server first, then `add_story` carries
   `file_path`, `video_duration_in_second`, `is_video` and `link`
   (`services/story.ts:130-142`).
6. After a successful upload the widget re-reads page 1 through
   `fetchStoriesForUser` and writes it into the store
   (`AddStoryWidget.tsx:263-267` for video, `:311-314` for image). **That reader
   filters QA stories**, which is why a QA story vanishes the moment it is made.

### Report

- The report icon is drawn only for a **signed-in non-owner**:
  `{!isOwner && userStories && …}` at `StoryHolder.tsx:106`. Selector
  `data-pw="report-story-icon"` (line 123). A guest cannot report.
- `isOwner` compares the signed-in stories user with the story **group** id —
  `user?.id === story?.id` (`StoryHolder.tsx:33`), where the group is one
  author's stories.
- The sheet is `ReportStoryModal.tsx`. It has **no `data-pw` attributes at all**,
  so its six reasons, its notes box and its submit button need selectors added.
  The six reason values are stable and language-independent:
  `inappropriate_content`, `harassment`, `spam`, `intellectual_property`,
  `violence`, `other` (`ReportStoryModal.tsx:18-34`).
- Submit needs at least one reason or some text (`canSubmit`, line 87) and sends
  `story_id`, `reasons`, `notes`, `reporter_user_id` (`services/story.ts:195-205`).

### Delete

- The delete icon is drawn only for the **owner**: `{isOwner && …}` at
  `StoryHolder.tsx:88`. Selector `data-pw="delete-story-icon"` (line 100).
- Confirming goes through the shared `ConfirmModal` with
  `dataCy="delete-story-confirm-modal-button"` (`StoryHolder.tsx:173`).
- `deleteStory` throws on failure rather than reporting success
  (`services/story.ts:170-180`), and the holder shows the backend's own message
  (`StoryHolder.tsx:77`). That is good for a test: the failure will carry what
  the stories backend said.

### Both icons live inside the viewer

Report and delete are **only** reachable from the story viewer, and the viewer is
only opened by clicking a story in a bar or row. There is no address that opens
one story directly. That is what makes `OQ-1` the question it is.

---

## The QA mark, and why it hides the test as well

`utils/qaStoryFilter.ts` — a story is QA data when the host of its `link` is
`qa-test.trydos.tech` (line 17), overridable with
`NEXT_PUBLIC_QA_STORY_LINK_HOST`. `dropQaStories` removes such a story and then
removes any author left with none.

**Four readers call it, and there is no bypass in any of them:**

| Reader | Runs | Line |
|---|---|---|
| `services/story.ts` `getStories` | browser | `:38` |
| `serverRequests/stories.ts` `fetchStoriesForUser` | server | `:75` |
| `components/Home/Stories/StoriesBarClient.tsx` | browser | `:71` |
| `components/Home/Stories/StoriesPaginationWrapper.tsx` | browser | `:59` |

`tests/services/story.test.ts:266-289` pins that list by reading the four source
files, so removing a call breaks a unit test on purpose.

**The product-side QA switch cannot simply be copied.** `utils/server/qaMode.ts`
reads `next/headers` and compares `x-qa-view` against `QA_VIEW_SECRET`. It is
server-only by construction, and **three of the four story readers run in the
browser**. A header the server can check is invisible to code running on the
page. So "add QA mode to the story readers" is not a five-line change; it needs a
decision about how the browser learns it is in QA mode.

Two more facts that matter here:

- `tests/e2e/actions/qaProduct.ts:196-227` — `attachQaViewHeader` stamps only
  **Server Actions and document/RSC requests**. It deliberately does not stamp
  `/api/proxy`, which is how every client story call travels.
- `tests/e2e/qaLock.live.spec.ts:519-546` — QA-11 already reads the **raw,
  unfiltered** story feed by calling `/api/proxy` from inside the page, with
  `x-proxy-server: dw4nge` and `x-proxy-url: /api/v1/stories/users_stories?page=1`.
  So a test *can* see its own QA story as **data**. It still cannot see it as a
  **story on screen**, which is what report and delete need.

## The path that was never filtered

`product_stories` is not filtered, on either side:

- client: `services/story.ts:300-310` `getStoriesForProducts` — no
  `dropQaStories`;
- server: `serverRequests/product.tsx:547-583` `GetProductStoriesData` — no
  `dropQaStories`.

That is consistent with the rest of the QA lock rather than an oversight: the
lock filters **discovery** and leaves **direct lookup by address** alone, which is
exactly why `gotoQaProduct` works for a guest with no QA mode
(`tests/e2e/actions/qaProduct.ts:36-63` — it attaches no QA header at all). A QA story attached to the QA product
would therefore be visible on the QA product's page — a page no customer can
discover, because the product is filtered out of search, the home page, the
listing, both sitemaps and the catalogue route.

Whether the ticket should use that, and whether QA-11's promise still reads true
if it does, is `OQ-1` and `OQ-2`.

## Two different story objects

The seller dashboard is **not** the same feature and must not be mistaken for it:

| | Customer story | Seller story |
|---|---|---|
| Create | `POST /api/v1/stories/add_story` (`services/story.ts:130`) | `POST /api/v1/stories/add-seller-story` (`services/sellerDashboard/index.ts:401`) |
| List | `GET users_stories` (`services/story.ts:25`) | `GET seller-stories` (`:380`) |
| Delete | `POST delete_story` (`services/story.ts:164`) | `POST delete-seller-story` (`:426`) |
| Filtered for QA? | yes, all four readers | no |
| Has a product link | no | yes (`product_slug`, `StoriesTab.tsx:155`) |

So the seller dashboard's list is unfiltered and can delete — but it deletes a
**seller** story, through a different endpoint. Using it would test a different
journey from the one this ticket names. `StoriesTab.tsx` also carries **no
`data-pw` attributes**.

## A defect found while reading (not this ticket's to fix)

`serverRequests/stories.ts:92-141` — `fetchStoriesForGuest` filters only empty
authors (line 126) and **never calls `dropQaStories`**. It is however **dead**: a
repository-wide search for its name returns only its own definition. It is not in
the four-reader list pinned by `tests/services/story.test.ts`, and the
"no tests for dead code" rule says not to test it.

Recorded here so it is not re-discovered as a surprise. It is a latent hole: the
day something calls it, QA stories reach that caller. It belongs in a ticket of
its own — delete it, or make it call the filter.

## Test / validation commands available

- `pnpm test:run` — the unit suite (Vitest, `--project unit`). Gates pull
  requests.
- `pnpm test:coverage` — the same with coverage.
- `pnpm lint` — ESLint, including the i18n key rules.
- `pnpm lint:i18n-parity` — `ar` / `tr` / `ku` keys in step.
- `npx tsc --noEmit` — needs `next typegen` first on a clean checkout.
- `pnpm e2e:health` — is staging answering. Run before blaming a test.
- `pnpm e2e:preflight` — the environment gates, without running anything.
- `npx tsx tests/e2e/cli.ts run --lane=account` — the browser lane this ticket's
  spec would join. `--grep=` narrows it; `--skip-build` reuses the last build.
- `pnpm test:e2e` — the whole browser suite (real build, real staging).

None of these were run during research.

## Test layout and naming convention

Recorded because `/plan` has to search this layout before declaring a new file
(`PL-14`).

**Unit suite.** Files live under `tests/`, mirroring the source path: code at
`services/story.ts` is tested at `tests/services/story.test.ts`; code at
`components/Home/Stories/StoriesBarClient.tsx` at
`tests/components/Home/storiesBarClient.test.tsx`. Suffix `.test.ts` /
`.test.tsx`. Runner: **Vitest**, project `unit`. Shared sample data lives in
`tests/fixtures/` — `tests/fixtures/story.ts` already exists.

**Browser suite.** Files live flat in `tests/e2e/`, named
`<journey>.live.spec.ts` (real staging) or `<journey>.scripted.spec.ts` (faked
calls). Reusable steps go in `tests/e2e/actions/<name>.ts`, environment and
setup in `tests/e2e/harness/<name>.ts`, locators in `tests/e2e/selectors.ts`.
Every new spec file must be listed in `ACCOUNT_LANE` or `SOLO_LANE` in
`tests/e2e/laneConfig.ts`.

**Expected-failure marker.** The repository uses **none today** — a search for
`test.fail(` and `it.fails` found no use in `tests/`. If this ticket records a
`BUG-n`, the markers available are Playwright's `test.fail()` and Vitest's
`it.fails()`. Vitest's is strict by default: a test marked `fails` that passes is
reported as a failure, which is the behaviour the governance rule wants.

## Risks and unknowns

| Risk | Impact / likelihood |
|---|---|
| The uploading account may not have `is_allowed_to_upload_story = 1` | **High / unknown.** The Add-Story tile is simply not rendered, so the upload case cannot start. Nothing in the repository can set this flag; it is backend data. Must be checked against staging before the spec is written. |
| `TEST_ACCOUNT_OTP_2` is still not a repository secret | **High / certain.** `tests/e2e/harness/env.ts:189` already reports it. The report case needs a second signed-in identity, so on CI it skips. It must skip loudly, never fall back to one account. |
| Report writes a real row to the stories backend | Medium. Reporting is not reversible from the app — there is no "unreport" call in `services/story.ts`. Every run leaves one report. Reporting only a story the run itself made keeps that harmless, but it does accumulate. |
| A story that fails to delete stays on the environment | Medium. The run makes real stories. If the delete step fails, the QA story stays, marked and hidden, and the next run adds another. |
| Media upload is a separate backend with its own ticket step | Medium. `GetTicket("stories", …)` before the file upload (`services/story.ts:86`) is a second thing that can refuse. The failure message must tell the media server apart from the stories backend. |
| Video upload is slow | Medium. The per-test budget is 120 s (`playwright.config.ts:60`) and includes a real file upload plus index time. The video case will need its own raised timeout, as QA-11 does (`test.setTimeout(180_000)`). |
| Touching `utils/qaStoryFilter.ts` risks the whole lock | **High if chosen.** Four readers and a pinning unit test depend on it. Any change needs its own unit test and must keep QA-11 green. |
| A new spec file not added to a lane | Low but certain to bite: `laneSpecs()` throws and stops the command (`laneConfig.ts:120`). Easy to fix, easy to forget. |
| `ReportStoryModal.tsx` has no selectors | Low. Adding `data-pw` attributes is allowed by the owner and is the same pattern used across the app. |

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | How does the test see its own QA story **on screen**? Option A: give the story readers a QA-mode switch the browser can also read — needs a decision about how the browser learns it, because `utils/server/qaMode.ts` is server-only and three of the four readers run in the browser. Option B: use the product page's story row, which was never filtered (`services/story.ts:300`, `serverRequests/product.tsx:547`), which needs the story to be attached to the QA product. | This decides whether the ticket changes application code at all, and it decides the shape of every case. Nothing else can be specified until it is answered. |
| OQ-2 | If Option B is chosen, can a **customer** story be attached to a product? The home upload sheet sends only `file_path`, `is_video` and `link` (`services/story.ts:130-142`) — no product. Only the **seller** story carries `product_slug` (`StoriesTab.tsx:155`). | If a customer story cannot be attached to a product, Option B only works for seller stories, and the ticket would be testing a different journey than the one requested. |
| OQ-3 | Is a QA story allowed to exist **without** the QA link? | The mark *is* the link, and the share button needs media, so every safe story is a media story carrying a QA link. "A story with a link" is therefore not a separate case from "an image story" — it is every case. The spec has to say what the three requested kinds (link, video, image) actually map to. |
| OQ-4 | Does the account that will upload have `is_allowed_to_upload_story = 1` on staging, and which account is it? | Without the flag the tile does not render and the whole upload case is dead before its first click. It also decides which of the two accounts uploads. |
| OQ-5 | Which account reports, given that the report icon needs a signed-in **non-owner** (`StoryHolder.tsx:106`) and Shopper B cannot sign in on CI (`env.ts:189`)? | Decides whether the report case is normally skipped on CI, and confirms two accounts really are required (they are — one account can never report its own story). |
| OQ-6 | What happens to a story the run made, when the delete case is skipped or fails? Does the suite clean up, and where? | There is already an `orderCleanup.ts` in the harness, so the suite has a precedent for tidying real data. Without an answer every run leaves rows behind. |
| OQ-7 | Where do the fixture image and video live, and how big may they be? | The suite has **no media files today**. `.gitignore` will not hide them under `tests/e2e/`, so the only open part is the path and the size. A video large enough to be realistic is large enough to slow every checkout of the repository. |
| OQ-8 | Which lane does the new spec join, and does it need the QA seed? | `laneConfig.ts` throws on an unlisted spec. If the spec needs the QA product or Shopper B, it belongs in `ACCOUNT_LANE` next to `qaLock.live.spec.ts`, and it must honour the seed's skip contract (`qaSeedRan()` / `NO_QA_SEED_REASON`, `harness/qaSeedState.ts:50-58`). |
| OQ-9 | Is the dead, unfiltered `fetchStoriesForGuest` (`serverRequests/stories.ts:92`) in scope, or a separate ticket? | Leaving it is a latent hole; fixing it grows this change. The repository rule says wrong behaviour outside the files this plan changes is a finding, not a fix. |
| OQ-10 | If application code is changed, which **unit** test proves it? | Only the unit suite gates pull requests. A change proved only in the browser suite is unguarded from the day it lands (`CLAUDE.md`, "Which suite"). |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No command was run against staging; every finding above is read from source.
- Intake's `Q1`–`Q4` are carried forward as `OQ-1`, `OQ-5`, `OQ-7` and `OQ-4` /
  `OQ-5`. Intake's `Q3` (a `.gitignore` trap) is **answered**: no such rule
  applies under `tests/e2e/`.
