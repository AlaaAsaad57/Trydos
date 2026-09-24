# Test summary — Stories — 22 September 2026

What the tests cover for stories: the home stories bar, watching a story,
keeping QA stories out of the live feed, and the seller's Stories section.

| | |
|---|---|
| Unit checks | 93 |
| Browser cases | 7 |
| Unit result | ✅ all 93 passing (run 22 Sep 2026) |
| Browser result | not run in this session — this file says what the suite covers |

---

## Browser cases (real staging)

| ID | Case | Spec |
|----|------|------|
| STORY-00a | The uploader signs in | `stories.live.spec.ts:150` |
| STORY-00b | The reporter signs in | `stories.live.spec.ts:183` |
| STORY-01 | A photo story is uploaded and carries this run's mark | `stories.live.spec.ts:221` |
| STORY-03 | The feed shows this run's own story, wherever it sits | `stories.live.spec.ts:269` |
| STORY-03b | A guest never sees this run's story, while it is live | `stories.live.spec.ts:296` |
| STORY-04 | The second account reports the story this run uploaded | `stories.live.spec.ts:326` |
| STORY-05 | Every story this run uploaded is deleted, and is gone from the backend | `stories.live.spec.ts:371` |

---

## Unit checks

A check that is repeated over several values (every unit, every field, every
way a number can be written) is listed once here, but counted once per value in
the number above.

### The home stories bar

- Shows the stories the storefront returned.
- Shows the placeholder, not an error, when the stories backend refuses.
- Carries no token of its own.
- Names the stories service, so the token is attached on the server.
- Never shows a QA story on the bar.
- Says nothing to the shopper when the stories service is down.
- Shows a QA story once the viewer id arrives after the feed.

### Paging the bar, and coming back to it

- Asks for page 2 first, and stops paging when there is no next page.
- Never adds a QA story from a later page.
- Keeps the pages already loaded when the route changes and comes back.
- Does not ask for page 3 while page 2 is missing from the bar.
- Does not overwrite a watched ring on a route change.
- Still clears the add-story refreshing flag on a route change.

### Stories on a product page

- Takes the shared story list over while the product page is open.
- Puts the home stories back when the product modal closes.

### Uploading a story

- Stops waiting for a video the browser never decodes.
- Stops when the video is longer than the minute it allows.

### Watching a story

- A guest's watched story is marked as seen.
- A guest's other stories in the group are left untouched.
- A guest's watch calls no stories backend endpoint.
- A signed-in viewer's watched story is marked as seen.
- A signed-in viewer's view is reported to the stories backend.
- The story stays marked as seen even when the stories backend refuses.

### Keeping QA stories out of the live feed

- A QA story is removed and the real ones beside it are kept.
- The filtered feed is written to the store, not the raw answer.
- An author whose only story was a QA one is dropped.
- A story whose link cannot be read is kept, and nothing throws.
- A host that merely contains the QA name is not mistaken for one.
- Every live story reader applies the QA filter.
- With no viewer list, a QA story is still dropped for a signed-in viewer.
- No unfiltered guest reader is exported any more.

### The QA story viewer allow-list

- A QA story is kept when the viewer is on the list.
- It is dropped for a viewer not on a configured list.
- It is dropped when no list is configured at all.
- It is dropped when the caller names no viewer.
- A value that is not a phone number is refused as a viewer.
- Empty entries left by a trailing comma are dropped.
- A malformed list changes nothing and never throws.
- A number written with spaces around it is still recognised.
- A number matches a list written as text.
- A number that merely starts with a listed one never matches.
- The allow-list is given a value by no tracked env file.
- A documented name is told apart from a real value.
- There is an env file to read, so the check cannot pass vacuously.
- A number matches however it is written.
- A list entry that itself carries punctuation still matches.

### The seller's Stories section

- Asks the stories server for this shop's first page.
- Shows a photo story with its view count.
- Treats a story with a video path as a video, with no flag.
- Reads rows that came back under `data.stories`.
- Flattens rows that came back grouped.
- Shows the story's link and linked product on the card.
- Says when the shop has no stories.
- Shows the stories server's own reason for refusing.
- Loads the same page again on Retry.
- Shows no page controls for a single page.
- Offers Next when the answer says there is another page.
- Offers Next when the answer carries only a next-page address.
- Asks before deleting a story.
- Deletes nothing when the seller backs out.
- Names the story, the shop and the user in the delete request.
- Takes the story off the grid once it is gone.
- Keeps the story and reports why the stories server refused.
- Accepts a bare domain as a link, which is how sellers usually type one.
- Accepts a full address as a link.
- Refuses a word with no dot in it.
- Treats an empty link as fine, because the link is optional.
- Hides Add Story without the create permission.
- Hides the bin without the delete permission.
- Still lets a seller with neither permission look at the stories.

---

Another 7 checks cover the test tool that finds a run's own story in the feed.
They protect the tests, not the app, so they are counted but not listed.
