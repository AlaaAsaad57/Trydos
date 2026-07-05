# ST-05 — Delete Own Story

| | |
|---|---|
| **Feature ID** | ST-05 |
| **Domain** | F · Stories |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Home/Stories/StoryHolder.tsx`, `services/story.ts` |

---

## What it is

Lets a shopper remove a story they posted, from inside the story viewer, after a confirmation prompt.

## Where it appears

In the full-screen story viewer (ST-01): when you are watching **your own** story, a delete (trash)
icon appears in the top-right controls.

## Who uses it

The author of a story. The delete icon is shown only to the owner; other viewers see a **Report**
option instead (ST-06).

## How it works (verified behaviour)

- **Owner check.** The viewer compares the logged-in stories user against the story owner
  (`isOwner = user?.id === story?.id`); the delete icon (`DeleteIcon.svg`,
  `data-cy="delete-story-icon"`) renders only when `isOwner`.
- **Confirmation.** Tapping the icon opens a confirm sheet ("Are you sure you want to delete this
  story?"); playback pauses while it is open.
- **Deletes the current item.** Confirming deletes the currently-viewed story item
  (`story.stories[currentStoryId].id`), optimistically advances/removes it from the bar
  (`removeStory`), and shows a "Story deleted successfully." toast. On failure the real error surfaces
  ("Failed to delete story.").

## Data source

| Item | Value |
|------|-------|
| Delete | `POST /api/v1/stories/delete_story`, body `{ story_id }`, `server: "stories"`, `noMessage: true` (`services/story.ts` `deleteStory`) |
| Optimistic UI | `removeStory(userId, storyItemId)` in `store/homepage/reducer.ts` |
| Request code | `DELETE_STORY` code 50 (`utils/Requests.ts`) |

## Technical reference

| Item | Value |
|------|-------|
| Delete UI + handler | `components/Home/Stories/StoryHolder.tsx` (`handleDeleteStory`, `ConfirmModal type="Delete"`) |
| Service | `StoryServiceClass.deleteStory(storyId)` (`services/story.ts`) |
| Seller equivalent | `deleteSellerStory` (`POST /api/v1/stories/delete-seller-story`) — see ST-03 |

## Current status & maturity

**Live.** Delete works from the viewer with a confirmation and optimistic removal.

## Known gaps / notes

No dedicated gaps found.

## Related features

ST-02 (Post a customer story) · ST-06 (Report a story — the non-owner counterpart) · ST-01 (View
stories) · ST-03 (Seller/admin story delete).
