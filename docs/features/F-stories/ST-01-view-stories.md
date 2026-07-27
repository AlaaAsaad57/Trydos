# ST-01 — View Stories

| | |
|---|---|
| **Feature ID** | ST-01 |
| **Domain** | F · Stories |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Home/Stories/StoryViewer.tsx`, `components/Home/Stories/StoryHolder.tsx`, `components/Home/Stories/NewStories.tsx`, `services/story.ts` |

---

## What it is

The full-screen, Instagram-style story player. A shopper taps a face in the stories bar and watches
that user's images and videos play one after another, swiping between people, and can dismiss by
swiping down. Watching a story counts as a view.

## Where it appears

- **Homepage** — the stories bar sits near the top of the feed (`StoriesBarServer` rendered from
  `app/(client)/[lang]/page.tsx`). Tapping a face opens the viewer globally
  (`components/Home/NavbarClient.tsx`).
- **Product page** — a separate "Product Story" bar (SD-19 / ST-04) opens the same viewer for that
  product's stories.

## Who uses it

Any shopper or guest — viewing is open to everyone (though a guest's view is not counted; see below).

## How it works (verified behaviour)

- **Swipeable 3D carousel.** Users are laid out on a rotating cube (`NewStories.tsx` `Cube` +
  `react-swipeable`); swiping left/right moves between people, swiping down dismisses the viewer.
- **Image vs video.** A story item is treated as video when its `type` is `"video"`, otherwise it
  renders as an image. Video sources are requested with a `?target=story` suffix.
- **Auto-advance & progress bars.** One progress bar per story item runs across the top. Images
  play for a **fixed 5 seconds** (`DEFAULT_DURATION = 5000`); videos play for their own duration
  (`video_duration_in_second`, or the media's real length) and also advance when the video ends.
  Progress is animated with `requestAnimationFrame`.
- **Tap navigation.** Tapping the **left** half goes to the previous item, the **right** half to the
  next; crossing the first/last item moves to the previous/next person. When everyone's stories end,
  the viewer advances/closes.
- **Pause.** Playback pauses (timers cleared, video paused, progress preserved) while a delete or
  report sheet is open, when the tile is inactive, or when a sign-in is required.
- **Adjacent media is preloaded** (`VideoPreloader` / `ImagePreloader`) so the next item starts
  instantly.

## Data source

| Item | Value |
|------|-------|
| Fetch stories (server) | `GET {NEXT_PUBLIC_STORIES_BACKEND_URL}/api/v1/stories/users_stories?page={n}` (`serverRequests/stories.ts`, `revalidate: 0`; only users with ≥1 story returned) |
| Fetch stories (client paging) | `GET /api/v1/stories/users_stories?page={n}` via `/api/proxy`, `server: "stories"` (`services/story.ts` `getStories`) |
| Count a view | `GET /api/v1/stories/increase_viewers/{storyItemId}` (see ST-07) |
| Store slice | `store/homepage/reducer.ts` — `selectedStory`, `storiesData`, `nextStory`/`prevStory`, `watchStory` |

## Technical reference

| Item | Value |
|------|-------|
| Player | `components/Home/Stories/StoryViewer.tsx` — **lazy-loaded**: the player is only downloaded when a shopper opens a story, and a shape-matched skeleton (`components/skeleton/StoryViewerSkeleton.tsx`) stands in while it arrives |
| Per-user holder | `components/Home/Stories/StoryHolder.tsx` |
| Carousel / dismiss | `components/Home/Stories/NewStories.tsx` (`StoriesContainer`, `Cube`, `react-swipeable`) |
| Bar (server) | `components/Server/StoriesBarServer.tsx` → `StoriesWrapper` → `StoryElement` |
| Image duration | `DEFAULT_DURATION = 5000` ms (`StoryViewer.tsx`; also hard-set in `services/story.ts` `configureStory`) |
| Media URL shaping | Cloudinary-style transforms in `configureStory` (`services/story.ts`) |

## Current status & maturity

**Live and stable.** The player fully delivers swipeable image/video playback with progress,
tap-navigation and view counting.

## Known gaps / notes


- Leftover `console.log` debug lines in `StoryHolder.tsx` and `StoryViewer.tsx`. should be logged to backend/analytics

## Related features

ST-02 (Post a customer story) · ST-03 (Seller/admin stories) · ST-04 (Shoppable stories) ·
ST-07 (Viewer tracking) · SD-01 (Homepage feed) · SD-19 (Product page, where product stories open).
