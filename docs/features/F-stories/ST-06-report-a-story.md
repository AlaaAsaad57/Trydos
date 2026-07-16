# ST-06 — Report a Story

| | |
|---|---|
| **Feature ID** | ST-06 |
| **Domain** | F · Stories |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Home/Stories/StoryHolder.tsx`, `components/Home/Stories/ReportStoryModal.tsx`, `services/story.ts` |

---

## What it is

Lets a viewer flag someone else's story as inappropriate, choosing one or more reasons and optionally
adding a note.

## Where it appears

In the full-screen story viewer (ST-01): a flag icon (`data-cy="report-story-icon"`,
`aria-label="Report story"`) in the top-right controls, shown only when watching **another user's**
story.

## Who uses it

Any signed-in stories viewer, on stories that are **not** their own. The report icon appears only for
non-owners **and** only when the viewer is logged into the stories subsystem; owners see the delete
icon instead (ST-05).

## How it works (verified behaviour)

- **Opens a bottom-sheet** (portalled to `document.body`, RTL-aware for ar/ku); playback pauses while
  it is open.
- **Reasons (multi-select, hardcoded).** `Inappropriate Content` (`inappropriate_content`),
  `Harassment or Hate Speech` (`harassment`), `Spam or Scam` (`spam`),
  `Intellectual Property Violation` (`intellectual_property`),
  `Violence or Dangerous Content` (`violence`), `Other` (`other`). More than one may be selected.
- **Free-text details.** A textarea (max **500** chars). Typing details auto-adds the "Other" reason;
  selecting "Other" focuses the textarea.
- **Submit gate.** Requires at least one reason **or** some details, else a "Please select at least
  one reason or provide details." error shows.
- **On submit.** Calls the report service; on success shows "Story reported successfully." and closes
  the sheet. On failure it keeps the sheet open with selections intact and shows the error.

## Data source

| Item | Value |
|------|-------|
| Submit report | `POST /api/v1/stories/report`, `server: "stories"`, body `{ story_id, reasons, notes, reporter_user_id }` (`services/story.ts` `reportStory`) |
| Reporter id | `userProfile?.id` (from the app store) |
| Notifications | `showSuccessNotification` / `showErrorNotification` (notifications slice) |
| Request code | `REPORT_STORY` code 123 (`utils/Requests.ts`) |

## Technical reference

| Item | Value |
|------|-------|
| Report icon + trigger | `components/Home/Stories/StoryHolder.tsx` (`setShowReportModal`) |
| Report sheet | `components/Home/Stories/ReportStoryModal.tsx` (`REPORT_REASONS`, `DETAILS_MAX = 500`) |
| Service | `StoryServiceClass.reportStory(storyId, userId, reasons, details)` (`services/story.ts`) |
| Note | UI label is "Details" but it is sent as the `notes` field |

## Current status & maturity

**Live.** The report flow — reason selection, optional note, validation and submit — is fully
implemented.

## Known gaps / notes


- **No "already reported" guard** — a user can submit a report on the same story repeatedly.

- The report icon requires being logged into the stories subsystem — a viewer who isn't sees no
  report affordance even on others' stories.

## Related features

ST-05 (Delete own story — the owner counterpart) · ST-01 (View stories) · CO-21 (Report an order
item — a separate reporting flow).
