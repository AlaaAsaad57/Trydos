# Stories — Production readiness

**Status:** ✅ Closed — the owner closed this section on 2026-10-20. No code work is left. The Ops values and the iPhone check under "Must do before launch" are still needed.
**In one line:** Watching, uploading, recording, deleting and reporting stories work end to end, and no code blocker is left. Before launch, Ops must set the production values and someone must check story video on a real iPhone.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.
**Fixed after the first check:** M-1, M-2, M-6 and M-8 and the limits L-2, L-6 and L-8 are fixed, and M-4 was confirmed not to be a bug. They are now W-22 to W-29. Each code fix has a unit test that was seen red before the fix and green after it.

## What this section is
- The shopper sees a row of story tiles on the home page (`StoriesBarClient`) and taps one to open a full-screen viewer (a cube carousel).
- An allowed shopper taps the "+" tile to add a photo or video story, with an optional link.
- The shopper can delete their own story and report another person's story.
- Stories that are linked to a product also show on that product's page, and in the "Stories" tab of the chat window. Seller stories in the seller dashboard are in the seller file, not here.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Open the home page → a skeleton shows, then the story tiles of page 1 | stories `GET /api/v1/stories/users_stories?page=1` through `/api/proxy` (the proxy adds the HttpOnly stories token) | `components/Home/Stories/StoriesBarClient.tsx:75-108`, `components/clientWrapper/StoriesWrapper.tsx` | `tests/components/Home/storiesBarClient.test.tsx`, `tests/components/Home/storiesWrapper.test.tsx`; e2e STORY-03 |
| W-2 | Scroll the bar to the end → the next page loads and is added | stories `users_stories?page=n` | `components/Home/Stories/StoriesPaginationWrapper.tsx:31-85` | `tests/components/Home/Stories/StoriesPaginationWrapper.test.tsx`; e2e SST-03 |
| W-3 | A tile shows the first story the shopper has not seen; the ring turns grey when all are seen; the shopper's own tile shows their newest story | none (local) | `components/Home/Stories/StoryElement.tsx`, `store/homepage/actions.jsx` (`GetUnviewedStory`) | `tests/components/Home/Stories/Story.test.tsx`, `tests/store/homepageActions.test.ts` |
| W-4 | Tap a tile → the viewer opens full screen on that author's first unseen story | none | `Story.tsx:16` → `SelectStory` → `components/Home/NavbarClient.tsx:50` → `NewStories.tsx` → `StoryHolder.tsx:28-32` | `tests/components/Home/Stories/NewStories.test.tsx`, `StoryHolder.test.tsx` |
| W-5 | Watch → a progress bar runs (photo 5 s, video = its length); tap the right or left half → next or previous story; end of an author → next author; after the last author the viewer closes | none | `StoryViewer.tsx:142-186, 329-336`; `store/homepage/reducer.ts:149-183` | `tests/components/Home/Stories/StoryViewer.test.tsx`, `tests/store/homepageReducer.test.ts` |
| W-6 | Swipe sideways → the cube turns to the next author; swipe down or tap X → the viewer closes | none | `NewStories.tsx:101-153, 195-238`; `StoryHolder.tsx:195-218` | `NewStories.test.tsx`, `StoryHolder.test.tsx` |
| W-7 | The story pauses while the delete dialog, the report sheet or a sign-in prompt is open, and goes on from the same point | none | `StoryHolder.tsx:262-264`; `StoryViewer.tsx:249-275` | `StoryViewer.test.tsx` (pause cases, BUG-home-6 guard) |
| W-8 | Watch a story → the ring greys at once for every viewer; a signed-in viewer with a stories account also reports the view, once per story | stories `GET /api/v1/stories/increase_viewers/{storyId}` | `StoryHolder.tsx:59-85`; `services/story.ts:59-85` | `tests/services/story.test.ts`, `StoryHolder.test.tsx` |
| W-9 | Tap "View More" on a story with a link → the link opens in a new tab (`https://` added when missing) | none | `StoryViewer.tsx:406-436` | `StoryViewer.test.tsx` |
| W-10 | Tap "View Product" on a product story → the viewer closes and the product page opens | none | `StoryViewer.tsx:437-460` | `StoryViewer.test.tsx`; e2e SST-05, SST-08 |
| W-11 | Tap "+" → no phone: login opens; no real name: the name form opens; no stories account: the re-auth prompt opens; otherwise the add-story sheet opens. The "+" tile shows only when `is_allowed_to_upload_story` is 1 | none | `components/Home/AddStory.tsx:20-56` | `tests/components/Home/AddStory.test.tsx` |
| W-12 | Pick a photo from the gallery → crop it → add an optional link → "Share Story" → "Story Uploaded", and the new story is in the bar | `POST /api/ticket` → media server `/gated/ticket`; media server `POST /gated/upload`; stories `POST /api/v1/stories/add_story`; then `users_stories` again (server action) | `components/Home/Stories/AddStoryWidget.tsx:313-361, 384-421, 514-531`; `services/story.ts:86-165`; `utils/UploadUtils.ts`; `app/api/ticket/route.ts` | `tests/components/Home/addStoryWidget.test.tsx` (BUG-1 guard, green), `tests/services/story.test.ts`; e2e STORY-01 |
| W-13 | Take a photo with the in-app camera (front/back switch) → crop → share | same as W-12 | `components/Home/Stories/CameraStory.tsx:73-78, 269-279`; `AddStoryWidget.tsx:552-562` | `tests/components/Home/Stories/CameraStory.test.tsx` |
| W-14 | Pick a video (up to 10 MB and 59 s) from the gallery on a desktop or Android browser → it uploads | media server `/gated/upload?story=true`; stories `add_story` with `is_video: 1` and the length | `AddStoryWidget.tsx:205-312`; `services/story.ts:96-98, 139` | `tests/components/Home/addStoryWidget.test.tsx`; e2e none |
| W-15 | Bad input is refused with a message: an SVG, a file over 10 MB, a video over 59 s, a link that is not a URL | none | `AddStoryWidget.tsx:191-202, 241-251, 384-405, 507-513` | `tests/components/Home/addStoryWidget.test.tsx` |
| W-16 | Own story → trash icon → confirm → the story leaves the viewer and the bar, "Story deleted successfully."; on a refusal the story stays and the backend's message shows | stories `POST /api/v1/stories/delete_story` | `StoryHolder.tsx:87-132, 235-249`; `services/story.ts:166-190`; `store/homepage/reducer.ts:189-204` | `StoryHolder.test.tsx`; e2e STORY-05 |
| W-17 | Another person's story → flag icon → pick reasons (6) and/or write details (500 characters) → "Story reported successfully."; on a refusal the sheet stays open with the choices kept | stories `POST /api/v1/stories/report` | `components/Home/Stories/ReportStoryModal.tsx:89-119`; `services/story.ts:191-227` | `tests/components/Home/Stories/ReportStoryModal.test.tsx`; e2e STORY-04 |
| W-18 | Product page → "Product Story" row (only when the product has stories) → tap → the viewer opens over the product page; more stories load on scroll; the home bar gets its list back on close | stories `GET /api/v1/stories/product_stories/{productId}?page=n` (server side) | `components/Server/product/ProductStoriesWrapper.tsx`; `components/products/ProductStories.tsx`; `serverRequests/product.tsx:548-600` | `tests/components/products/ProductStories.test.tsx`, `tests/components/Server/product/ProductStoriesWrapper.test.tsx`, `tests/serverRequests/product.test.ts` (`GetProductStoriesData`); e2e SST-06 |
| W-19 | Chat window → "Stories" tab → a list of authors with paging → tap a row → the viewer opens | stories `users_stories` through `/api/proxy` (token renewal works here) | `components/Chat/pages/StoriesList.tsx:28-77` | `tests/components/Chat/pages/StoriesList.test.tsx` |
| W-20 | A QA story (link host `qa-test.trydos.tech`) never reaches a normal shopper or a guest; only phones listed in `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` see it. The filter runs in every reader: bar, paging, sign-in, chat tab, product row, server reader | none | `utils/qaStoryFilter.ts`; callers `StoriesBarClient.tsx:70`, `StoriesPaginationWrapper.tsx:63`, `services/story.ts:43`, `StoriesList.tsx:51`, `serverRequests/stories.ts:83`, `serverRequests/product.tsx:596` | `tests/utils/qaStoryFilter.test.ts`, `tests/serverRequests/stories.test.ts`, `tests/services/story.test.ts`; e2e QA-11, STORY-03b, SST-04 |
| W-21 | A stories call answers 401 → the client renews the stories token, waits 2 s and sends the call again (the normal path, not a bug) | `/api/auth/refresh` → stories | `utils/fetchData.ts` (client path) | `tests/services/authRefreshSession.test.ts` |
| W-22 | A story author with no name is shown as "Unknown" (translated) on the home bubble, in the viewer header and in the chat Stories tab — never by their phone number. | none | `services/story.ts` (`authorName`), `components/Home/Stories/StoryElement.tsx`, `components/Chat/components/StoryChatRow.js` | `tests/services/story.test.ts` "configureStory never shows the phone as the name…", `tests/components/Home/Stories/StoryElement.test.tsx` |
| W-23 | In-app video recording uses a type the browser can record: WebM where it works, MP4 otherwise (Safari before 18.4). The shared file has the matching type and name (`.webm` or `.mp4`). | none (browser) | `components/Home/Stories/CameraStory.tsx` (`pickRecordingType`, `recordingTypeRef`) | `CameraStory.test.tsx` "records in MP4 on a browser that cannot record WebM…" |
| W-24 | A browser with no `MediaRecorder` → the red timer does not start, and the shopper sees "Not Supported". | none | `CameraStory.tsx` (`handleStartCapture`) | `CameraStory.test.tsx` "does not start the timer on a browser that has no MediaRecorder" |
| W-25 | The product-page story row shows for a signed-in shopper even when their stories token has expired. Checked on staging on 2026-10-20: `product_stories` answers 200 with no token and with a bad token, so it is a public read and the token does not matter. | Stories `GET /api/v1/stories/product_stories/{id}` | `serverRequests/product.tsx` (`GetProductStoriesData`) | none (checked by hand on staging) |
| W-26 | No open cache route for stories. `/api/revalidateStories` was removed: it had no auth, allowed any origin, and cleared the `stories` tag, which no cache entry uses. | none | route removed | none (removed) |
| W-27 | The stories request fails → the bar shows no tiles (only the "+" tile), not an endless skeleton, and no error message. A dead stories service does not stop browsing. | Stories `GET users_stories` | `components/Home/Stories/StoriesBarClient.tsx` | `tests/components/Home/storiesBarClient.test.tsx` "shows an empty bar, not an endless skeleton…" |
| W-28 | After an upload, the bar keeps the people from the later pages the shopper already loaded, and the shopper's own tile shows the new story. | Stories `GET users_stories?page=1` | `store/homepage/reducer.ts` (`mergeFirstStoriesPage`), `components/Home/Stories/AddStoryWidget.tsx` | `tests/components/Home/addStoryWidget.test.tsx` "keeps the people from later pages on the bar after an upload" |
| W-29 | The product story row keeps loading while the backend has another page, even when the QA filter made a page short. It stops when the backend has no next page. | Stories `GET product_stories/{id}` | `serverRequests/product.tsx` (`has_more`), `components/Server/product/ProductStoriesWrapper.tsx`, `components/products/ProductStories.tsx` | `tests/components/products/ProductStories.test.tsx`, `tests/serverRequests/product.test.ts` "says whether the backend has another page…" |

## ⚠️ Works, with limits
- **L-1 — Guest views are not counted.** A guest has no stories account. So `WatchStory` only greys the ring and sends nothing (`services/story.ts:66-68`). View numbers come from signed-in shoppers only.
- **L-2 — Video plays with sound, and `play()` has no error handler.** `muted={activeId !== id}` is always false, because both values are `String(story.id)` (`StoryViewer.tsx:370`). The `play()` calls at lines 376 and 381 have no `.catch`. If a browser blocks autoplay with sound, the video may stay still while the progress bar runs on. Check this on a real iPhone.
- **L-3 — Gallery video check may time out on iPhone.** The sheet waits until a hidden `<video>` that never plays reaches `readyState === 4` (`AddStoryWidget.tsx:224-238`), for 10 s at most. iOS Safari often loads no media data before play. In that case the shopper sees "Upload Failed Try Again". This is not proved. It needs a real iPhone test.
- **L-4 — Any external link is allowed.** The sheet only checks that the link is a URL (`AddStoryWidget.tsx:102-153`). A story can point to any site. The only control is the report button.
- **L-5 — The chat "Stories" tab replaces the list when it opens.** It reads page 1 and writes it over the shared list (`StoriesList.tsx:55-58`), so pages the home bar loaded before are dropped until the bar loads them again.
- **L-6 — Screen-reader text is English only.** The `aria-label` values "Delete story", "Report story", "Close story viewer" (`StoryHolder.tsx:149, 170, 201`), "Story link" (`StoryViewer.tsx:415`) and `alt="story"` are not translated. Visible text is translated.
- **L-7 — `components/Home/UploadVideo.tsx` is only a preview.** It is an 8-line `<video controls>` wrapper with an empty `useEffect`. It uploads nothing. The story camera preview and the chat camera use it.
- **L-8 — The media upload key is public.** The browser sends `NEXT_PUBLIC_MEDIA_API_KEY` as `x-api-key` (`services/story.ts:15, 103`), so the key is in the bundle. The real gate is the upload ticket from `/api/ticket`. That route needs a market token, and a guest token is enough.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | A WebM story may not play on iPhones even when the recording works. It depends on the media server (see questions) | A black or stuck video for iPhone viewers | `CameraStory.tsx:126-129`; `services/story.ts:96-98` | Backend | No — confirm first |
| M-2 | View-time analytics are dead. `StoryViewer` has an `onStoryViewTime` callback, but `StoryHolder` never passes it. Six GA click events in the add-story sheet are commented out. The GA `view_story` event sends `item_name: s.product_id` | Nothing (an analytics gap) | `StoryViewer.tsx:51, 129`; `StoryHolder.tsx:258-313`; `AddStoryWidget.tsx:269-272, 473-476, 484-487, 492-495, 526-529, 660-663`; `StoryHolder.tsx:72` | Frontend | No |
| M-3 | A shopper cannot see how many people (or who) viewed their own story. Only the seller dashboard shows `viewers_count` | No view count on own stories | `components/SellerDashboard/StoriesTab.tsx:163` (seller only); nothing in `components/Home/Stories/` | Product | No |

## 🔒 Must do before launch
- [ ] Test story video on a real iPhone (iOS 17 and iOS 18): record in the app (W-23, MP4 on older Safari), upload from the gallery (L-3), and watch a video story with sound (L-2). Fix or hide what fails.
- [ ] Ops: in the Vercel production build, `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` must be empty. The value is inlined into the browser bundle.
- [ ] Ops: set `STORIES_BACKEND_URL`, `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` and `NEXT_PUBLIC_MEDIA_API_KEY` for the production build. Without the two media values every upload fails with "Media server upload is not configured" (`services/story.ts:87-89`).

## ❓ Needs confirmation from the backend team
- Does `users_stories` answer a guest (no token) with the public feed? The home bar and e2e STORY-03b expect this.
- Does the `users_stories` feed send `mobile_phone` for each author? The app no longer shows it (W-22), but it should not be in a public answer at all. (`product_stories` does not send it — checked on staging, 2026-10-20.)
- Does `POST /api/v1/stories/report` take the reporter from the token? The browser sends `reporter_user_id = userProfile.id`, which is the market user id (`services/story.ts:206`, `ReportStoryModal.tsx:103`).
- Does `delete_story` check that the caller owns the story?
- Does `add_story` refuse a user whose `is_allowed_to_upload_story` is 0? The app only hides the "+" tile.
- Does `increase_viewers` count one view per viewer, or every call?
- Do stories expire (for example after 24 h) on the backend? The app has no expiry logic.
- Does the media server convert WebM, MP4 and MOV uploads (`?story=true`) to a format that iPhones play? Does `?target=snapshot` give a thumbnail for every video type?
- Is the story `link` checked on the server (allowed hosts, length)?
- Is `NEXT_PUBLIC_MEDIA_API_KEY` meant to be public, with the upload ticket as the only real gate?

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/components/Home/storiesBarClient.test.tsx`, `tests/components/Home/storiesWrapper.test.tsx`
- `tests/components/Home/AddStory.test.tsx`, `tests/components/Home/addStoryWidget.test.tsx` (holds the `BUG-1` guard "the upload sheet always stops"; it is green, so that bug is fixed)
- `tests/components/Home/Stories/AddStoryWidgetLazy.test.tsx`, `CameraStory.test.tsx`, `StoryElement.test.tsx`, `NewStories.test.tsx`, `ReportStoryModal.test.tsx`, `StoriesPaginationWrapper.test.tsx`, `Story.test.tsx`, `StoryHolder.test.tsx`, `StoryViewer.test.tsx`
- `tests/components/products/ProductStories.test.tsx`, `tests/components/Server/product/ProductStoriesWrapper.test.tsx`, `tests/serverRequests/product.test.ts` (`GetProductStoriesData` block)
- `tests/components/Chat/pages/StoriesList.test.tsx`
- `tests/services/story.test.ts`, `tests/serverRequests/stories.test.ts`, `tests/utils/qaStoryFilter.test.ts`
- `tests/store/homepageReducer.test.ts`, `tests/store/homepageActions.test.ts`
- `tests/harness/storyFinder.test.ts`

**E2E (Playwright, staging):**
- `tests/e2e/stories.live.spec.ts`: STORY-00a and STORY-00b (the uploader and the reporter sign in), STORY-01 (photo upload), STORY-03 (own story in the feed), STORY-03b (a guest never sees the QA story), STORY-04 (report), STORY-05 (delete).
- `tests/e2e/sellerStories.live.spec.ts`: SST-01 to SST-09 (seller stories, product button, product row).
- `tests/e2e/qaLock.live.spec.ts`: QA-11 (a QA story never reaches the feed).

**Markers:** there is no `it.fails` or `test.fail` in these files. `tests/e2e/sellerStories.live.spec.ts:296` still says STORY-03b "passes for the wrong reason" (`BUG-2`). STORY-03b now checks the story tiles (`stories.live.spec.ts:330`), so that comment describes the old version.

**Important cases with NO test:**
- Video upload end to end (no e2e; unit tests only, with mocks).
- In-app recording on a real iPhone. The unit tests use a fake recorder; only a device shows that the MP4 file plays and uploads.
- The view counter on staging (`increase_viewers`), and the chat "Stories" tab, in e2e.
