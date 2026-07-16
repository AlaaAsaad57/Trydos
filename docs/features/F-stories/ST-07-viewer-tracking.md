# ST-07 — Viewer Tracking

| | |
|---|---|
| **Feature ID** | ST-07 |
| **Domain** | F · Stories |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `services/story.ts`, `store/homepage/reducer.ts`, `components/Home/Stories/StoryHolder.tsx`, `components/Home/Stories/StoryElement.tsx` |

---

## What it is

The behind-the-scenes tracking that (a) **marks stories as seen** so the bar can grey out
already-watched rings, and (b) **counts a view** on the backend each time a story item is watched.

## Where it appears

- **Stories bar** — a face's ring shows "all seen" once none of its items are unseen.
- **Seller Dashboard** — a shop story's viewer modal displays its **viewers count** (see ST-03).

## Who uses it

It runs automatically for signed-in stories users as they watch. Shop owners see the resulting
viewers count in the dashboard.

## How it works (verified behaviour)

- **Counting a view.** When a story item starts, the holder calls `WatchStory(itemId, ownerId)`.
  Provided the visitor is logged into the stories service (`getUserStories()?.id` is truthy), this
  (a) optimistically marks the item seen in the store and (b) calls the backend to increment the
  view. A view is also recorded for the first item the moment a story is opened from the bar
  (`SelectStory`). A Google Analytics `VIEW_STORY` event fires per item with `story_type`,
  `product_id` and screen context.
- **Marking seen.** Each item carries `is_seen` from the backend; watching flips it to `true` in the
  store (`watchStory`). The bar computes "all seen" as *no items with `is_seen === false` remain*, and
  opening a user jumps to their first **unseen** item (`GetUnviewedStory`).
- **Viewers count** is incremented via the `increase_viewers` endpoint and surfaced (for shop
  stories) in the dashboard's story modal.

## Data source

| Item | Value |
|------|-------|
| Count a view | `GET /api/v1/stories/increase_viewers/{storyItemId}`, `server: "stories"` (`services/story.ts` `WatchStory`) |
| Mark seen (client) | `watchStory({ pid, id })` in `store/homepage/reducer.ts` (sets `is_seen: true`) |
| Seen state source | `is_seen` per item from `GET /api/v1/stories/users_stories` |
| Analytics | GA `VIEW_STORY` (per item start) |
| Request code | `INCREASE_VIEWERS` code 48 (`utils/Requests.ts`) |

## Technical reference

| Item | Value |
|------|-------|
| View trigger | `onStoryStart` in `StoryViewer.tsx` → `WatchStory` in `StoryHolder.tsx` |
| First-item view | `SelectStory` (`store/homepage/actions.jsx`) |
| Seen ring | `StoryElement.tsx` (`isSeen = stories with is_seen === false = 0`) |
| Start-at-unseen | `GetUnviewedStory` (`store/homepage/actions.jsx`) |
| Viewers count display | Seller Dashboard `StoryViewerModal` (`StoriesTab.tsx`) |

## Current status & maturity

**Live.** Seen-marking and view counting both work for signed-in stories users, and shop stories show
a viewers count in the dashboard.

## Known gaps / notes

- **Guests are not counted.** View counting and seen-marking are gated on being logged into the
  stories service, so guest views never hit `increase_viewers`.
- **No "who viewed my story" list for customer stories.** Only the write (`increase_viewers`) exists
  in the client; the only place a viewers *count* is displayed is the seller dashboard. There is no
  viewer-identity list surfaced to a customer author.
- **Per-story viewing-time analytics are computed but discarded.** `StoryViewer` measures active /
  paused viewing time and exposes an `onStoryViewTime` callback, but the holder never wires it up, so
  the data only reaches a `console.log` — effectively dead code.

## Related features

ST-01 (View stories) · ST-03 (Seller/admin stories — shows the viewers count) · PF-21 (Google
Analytics) · PF-22 (PostHog analytics).
