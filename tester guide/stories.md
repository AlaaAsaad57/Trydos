# Stories Feature — Manual Tester Guide

**Prepared for:** Non-Technical QA Employees  
**Feature:** Stories (Instagram-style stories system)  
**Date:** May 2026

---

## 1. Purpose

Verify that the Stories feature works correctly end-to-end for all user types (guest, authenticated, story owner, non-owner), across all supported interactions: viewing, uploading, navigating, deleting, reporting, and product-linked stories.

---

## 2. Scope

| Area | Included |
|---|---|
| Viewing stories (guest + authenticated) | ✅ |
| Adding a story (image, video, link) | ✅ |
| Camera recording and gallery upload | ✅ |
| Navigating between stories and users | ✅ |
| Deleting own story | ✅ |
| Reporting another user's story | ✅ |
| Product-linked stories | ✅ |
| Pagination / infinite scroll on stories bar | ✅ |
| Authentication gate (guest user) | ✅ |
| Incomplete profile gate | ✅ |
| Loading states and spinners | ✅ |
| Error notifications | ✅ |
| RTL layout (Arabic / Kurdish) | ✅ |
| Analytics event firing | ✅ |

---

## 3. Out of Scope

- Push notification delivery for stories
- Internal Sentry/logging validation (backend concern)
- Stories backend server configuration
- Cloudinary or media server infrastructure
- Any feature not visible in the app UI

---

## 4. Assumptions

- The tester has access to at least **two different accounts** (one to act as owner, one as viewer/reporter).
- The tester has a device with a **working camera** for camera recording tests.
- The app runs on both desktop and mobile.
- Test media files are prepared as listed in Section 8 (Test Data).

---

## 5. Preconditions

- App is running and reachable.
- At least one story exists from another user (to test viewing and reporting).
- The tester's own account is authenticated and has a complete profile (name + phone).
- A separate guest session is available (incognito / second browser).

---

## 6. Environment and Build

- Test on: **latest staging build**
- Browsers: Chrome (desktop), Safari (iOS), Chrome (Android)
- Devices: Desktop (1280px+), Mobile (375px–480px)  
- Languages to test: **English (LTR)** and **Arabic (RTL)**

---

## 7. Test Data

Prepare the following files before starting:

| File | Details |
|---|---|
| `valid-image.jpg` | Standard JPEG, under 10 MB |
| `valid-image.png` | Standard PNG, under 10 MB |
| `valid-video.mp4` | MP4 video, under 60 seconds, under 10 MB |
| `image-too-large.jpg` | JPEG over 10 MB |
| `video-too-long.mp4` | MP4 video over 60 seconds |
| `invalid.svg` | An SVG file |
| Valid URL | Any live website, e.g. `https://google.com` |
| Invalid URL | Plain text, e.g. `not a url` |
| URL without protocol | e.g. `google.com` (expected: app auto-adds `https://`) |

---

## 8. Execution Steps (How to Navigate to Stories)

1. Open the app on the **home page**.
2. The **Stories Bar** is displayed as a horizontal scrollable row of circular thumbnails near the top of the home page.
3. The **"+" (Add Story) button** is the first item in the bar — a special button with a plus icon.
4. Clicking any story thumbnail opens the **fullscreen story viewer**.

---

## 9. Test Scenarios

---

### GROUP A — Viewing Stories (Guest User)

---

**TC-A-01 — Guest can see the stories bar on home page**

| | |
|---|---|
| **Precondition** | User is NOT logged in (guest session / incognito) |
| **Steps** | 1. Open the home page. |
| **Expected Result** | Stories bar is visible with story thumbnails from other users. The "+" button is visible. |
| **Severity if Failed** | CRITICAL |

---

**TC-A-02 — Guest can open and view a story**

| | |
|---|---|
| **Precondition** | At least one story exists in the bar |
| **Steps** | 1. Click on any story thumbnail. |
| **Expected Result** | Fullscreen story viewer opens. Story media (image or video) plays. Progress bar animates at the top. |
| **Severity if Failed** | CRITICAL |

---

**TC-A-03 — Guest cannot add a story**

| | |
|---|---|
| **Precondition** | User is NOT logged in |
| **Steps** | 1. Click the "+" button in the stories bar. |
| **Expected Result** | Login modal or login page opens. Upload modal does NOT appear. |
| **Severity if Failed** | CRITICAL |

---

### GROUP B — Stories Bar Loading and Pagination

---

**TC-B-01 — Stories bar loads correctly on home page**

| | |
|---|---|
| **Precondition** | Logged-in or guest session |
| **Steps** | 1. Open the home page and observe the stories bar. |
| **Expected Result** | Stories thumbnails appear. Each thumbnail shows the user's profile picture. If stories are still loading, a skeleton/loading state is shown first. |
| **Severity if Failed** | MAJOR |

---

**TC-B-02 — Infinite scroll loads more stories**

| | |
|---|---|
| **Precondition** | There are more stories than fit in the initial load |
| **Steps** | 1. Scroll the stories bar horizontally to the right. 2. Continue scrolling toward the last visible story. |
| **Expected Result** | More stories are automatically loaded and appended to the bar. A loading spinner appears briefly during the fetch. |
| **Severity if Failed** | MAJOR |

---

**TC-B-03 — No more stories message (end of list)**

| | |
|---|---|
| **Precondition** | All available stories have been loaded |
| **Steps** | 1. Scroll the stories bar to the end. |
| **Expected Result** | No loading spinner or empty state error. The bar simply stops at the last story. |
| **Severity if Failed** | MINOR |

---

### GROUP C — Opening and Navigating the Story Viewer

---

**TC-C-01 — Click on a story thumbnail to open viewer**

| | |
|---|---|
| **Steps** | 1. Click on any story thumbnail in the bar. |
| **Expected Result** | Fullscreen black viewer opens. The clicked user's stories play immediately. |
| **Severity if Failed** | CRITICAL |

---

**TC-C-02 — Image story displays for 5 seconds then advances**

| | |
|---|---|
| **Precondition** | The story is an image story |
| **Steps** | 1. Open a story that is an image. 2. Wait and observe. |
| **Expected Result** | The image is shown for approximately 5 seconds. The progress bar fills up completely. Then the viewer automatically advances to the next story. |
| **Severity if Failed** | MAJOR |

---

**TC-C-03 — Video story plays and auto-advances**

| | |
|---|---|
| **Precondition** | The story is a video story |
| **Steps** | 1. Open a story that is a video. 2. Let it play. |
| **Expected Result** | The video plays with sound. The progress bar fills based on video duration. On completion, the viewer advances to the next story. |
| **Severity if Failed** | MAJOR |

---

**TC-C-04 — Tap/click right side to go to next story (same user)**

| | |
|---|---|
| **Precondition** | The current user has more than one story |
| **Steps** | 1. Open a story. 2. Click/tap the right half of the screen. |
| **Expected Result** | Advances to the next story of the same user. Progress bar resets and fills again. |
| **Severity if Failed** | MAJOR |

---

**TC-C-05 — Tap/click left side to go to previous story (same user)**

| | |
|---|---|
| **Precondition** | You are on the second or later story of a user |
| **Steps** | 1. Open a story. 2. Click/tap the left half of the screen. |
| **Expected Result** | Goes back to the previous story of the same user. Progress bar resets. |
| **Severity if Failed** | MAJOR |

---

**TC-C-06 — Swipe left (on mobile) to go to next user's stories**

| | |
|---|---|
| **Precondition** | Mobile device, multiple users have stories |
| **Steps** | 1. Open any story. 2. Swipe left across the viewer. |
| **Expected Result** | The viewer transitions (3D cube carousel animation) to the next user's story. |
| **Severity if Failed** | MAJOR |

---

**TC-C-07 — Swipe right (on mobile) to go to previous user's stories**

| | |
|---|---|
| **Precondition** | Mobile device, currently on a user other than the first |
| **Steps** | 1. Open any story. 2. Swipe right across the viewer. |
| **Expected Result** | The viewer transitions back to the previous user's story. |
| **Severity if Failed** | MAJOR |

---

**TC-C-08 — Drag down to close the story viewer**

| | |
|---|---|
| **Precondition** | Story viewer is open |
| **Steps** | 1. Click and hold anywhere on the viewer. 2. Drag downward more than 20% of the screen height. 3. Release. |
| **Expected Result** | The story viewer closes and the user returns to the home page. |
| **Severity if Failed** | MAJOR |

---

**TC-C-09 — Small drag down (less than 20%) does NOT close viewer**

| | |
|---|---|
| **Precondition** | Story viewer is open |
| **Steps** | 1. Click and hold, drag down only slightly (less than 20% of screen height). 2. Release. |
| **Expected Result** | The viewer does NOT close. It snaps back to its normal position. |
| **Severity if Failed** | MINOR |

---

**TC-C-10 — Auto-advancing past last story closes viewer or moves to next user**

| | |
|---|---|
| **Precondition** | You are on the last story of the last user |
| **Steps** | 1. Open the last story of the last user. 2. Let it play to completion. |
| **Expected Result** | The viewer closes and the user returns to the home page. |
| **Severity if Failed** | MAJOR |

---

**TC-C-11 — Story with a link shows the link**

| | |
|---|---|
| **Precondition** | A story was uploaded with an optional link |
| **Steps** | 1. Open that story. 2. Observe the story overlay. |
| **Expected Result** | A clickable link or "Visit" button is visible on the story. Tapping it opens the link in a browser. |
| **Severity if Failed** | MAJOR |

---

**TC-C-12 — Progress bar pauses when delete/report modal is open**

| | |
|---|---|
| **Precondition** | Story viewer is open |
| **Steps** | 1. Click delete (own story) or report (other's story). 2. The confirmation modal appears. 3. Observe the progress bar. |
| **Expected Result** | The story pauses (progress bar stops moving) while the modal is open. |
| **Severity if Failed** | MAJOR |

---

**TC-C-13 — Progress bar resumes after closing modal without confirming**

| | |
|---|---|
| **Precondition** | Delete or report modal is open, story is paused |
| **Steps** | 1. Click "Cancel" or dismiss the modal. |
| **Expected Result** | The story resumes from where it paused. Progress bar continues from where it stopped. |
| **Severity if Failed** | MAJOR |

---

### GROUP D — Adding a Story (Authenticated User)

---

**TC-D-01 — Clicking "+" opens the add story options**

| | |
|---|---|
| **Precondition** | User is logged in with a complete profile |
| **Steps** | 1. Click the "+" button in the stories bar. |
| **Expected Result** | A modal/panel appears with three options: **Camera**, **Gallery**, and a **Link input field**. |
| **Severity if Failed** | CRITICAL |

---

**TC-D-02 — Upload image from gallery — happy path**

| | |
|---|---|
| **Precondition** | Logged in with complete profile. `valid-image.jpg` is ready. |
| **Steps** | 1. Click "+". 2. Select "Gallery". 3. Pick `valid-image.jpg`. 4. A preview of the image appears. 5. Click "Share Story". |
| **Expected Result** | A loading spinner appears on the "+" button. After ~6 seconds, a success notification appears. The new story appears at the start of the stories bar. |
| **Severity if Failed** | CRITICAL |

---

**TC-D-03 — Upload PNG image from gallery**

| | |
|---|---|
| **Steps** | Repeat TC-D-02 with `valid-image.png`. |
| **Expected Result** | Same as TC-D-02. PNG uploads successfully. |
| **Severity if Failed** | MAJOR |

---

**TC-D-04 — Upload video from gallery — happy path**

| | |
|---|---|
| **Precondition** | `valid-video.mp4` (under 60s, under 10MB) is ready. |
| **Steps** | 1. Click "+". 2. Select "Gallery". 3. Pick `valid-video.mp4`. 4. Preview appears. 5. Click "Share Story". |
| **Expected Result** | Spinner appears, then success notification, new story visible in bar. |
| **Severity if Failed** | CRITICAL |

---

**TC-D-05 — SVG file is rejected**

| | |
|---|---|
| **Precondition** | `invalid.svg` is ready. |
| **Steps** | 1. Click "+". 2. Select "Gallery". 3. Try to pick `invalid.svg`. |
| **Expected Result** | The file is rejected. An error notification appears. The upload modal remains open. |
| **Severity if Failed** | MAJOR |

---

**TC-D-06 — File over 10 MB is rejected**

| | |
|---|---|
| **Precondition** | `image-too-large.jpg` (over 10 MB) is ready. |
| **Steps** | 1. Click "+". 2. Select "Gallery". 3. Pick the oversized file. |
| **Expected Result** | An error notification appears saying the file is too large. The upload does NOT proceed. |
| **Severity if Failed** | MAJOR |

---

**TC-D-07 — Video over 60 seconds is rejected**

| | |
|---|---|
| **Precondition** | `video-too-long.mp4` (over 60s) is ready. |
| **Steps** | 1. Click "+". 2. Select "Gallery". 3. Pick the long video file. |
| **Expected Result** | An error notification appears saying the video is too long. The upload does NOT proceed. |
| **Severity if Failed** | MAJOR |

---

**TC-D-08 — Add a link with the story (valid URL)**

| | |
|---|---|
| **Precondition** | `valid-image.jpg` is ready. |
| **Steps** | 1. Click "+". 2. Select "Gallery", pick the image. 3. In the link field, type `https://google.com`. 4. Click "Share Story". |
| **Expected Result** | Upload succeeds. The story is uploaded with the link attached. When the story is later viewed, the link is visible on screen. |
| **Severity if Failed** | MAJOR |

---

**TC-D-09 — URL without https:// is auto-corrected**

| | |
|---|---|
| **Steps** | 1. Click "+". 2. Select a valid image. 3. In the link field, type `google.com`. 4. Click "Share Story". |
| **Expected Result** | The app automatically prepends `https://` and the story uploads successfully with the corrected URL. |
| **Severity if Failed** | MINOR |

---

**TC-D-10 — Invalid URL shows error and blocks submission**

| | |
|---|---|
| **Steps** | 1. Click "+". 2. Select a valid image. 3. In the link field, type `not a url`. |
| **Expected Result** | An error message appears below the link input field. The "Share Story" button is disabled until the URL is corrected or removed. |
| **Severity if Failed** | MAJOR |

---

**TC-D-11 — Camera option records and uploads a story**

| | |
|---|---|
| **Precondition** | Device has a working camera. Browser has camera permissions. |
| **Steps** | 1. Click "+". 2. Select "Camera". 3. Camera preview opens. 4. Record a clip (under 60 seconds). 5. Click the stop/confirm button. 6. Preview appears. 7. Click "Share Story". |
| **Expected Result** | Upload proceeds. Spinner appears. Success notification shown. New story appears in bar. |
| **Severity if Failed** | MAJOR |

---

**TC-D-12 — Camera recording stops automatically at 60 seconds**

| | |
|---|---|
| **Precondition** | Device has a working camera. |
| **Steps** | 1. Click "+". 2. Select "Camera". 3. Start recording. 4. Do NOT stop manually — wait for auto-stop. |
| **Expected Result** | Recording stops automatically at 60 seconds. Preview of the recorded video appears. |
| **Severity if Failed** | MAJOR |

---

**TC-D-13 — Spinner is shown during upload ("+" button)**

| | |
|---|---|
| **Steps** | 1. Start an upload (any valid file). 2. Immediately observe the "+" button. |
| **Expected Result** | A loading spinner overlay appears on the "+" button for approximately 6 seconds while the upload is processing. |
| **Severity if Failed** | MINOR |

---

**TC-D-14 — Upload modal is cleared after successful upload**

| | |
|---|---|
| **Steps** | 1. Upload a story successfully. 2. Click "+" again to open the add story modal. |
| **Expected Result** | The modal is empty — no leftover preview from the previous upload. |
| **Severity if Failed** | MINOR |

---

### GROUP E — Authentication Gate (Incomplete Profile)

---

**TC-E-01 — User without a name is asked to complete profile**

| | |
|---|---|
| **Precondition** | Logged-in user whose profile has no display name |
| **Steps** | 1. Click the "+" button. |
| **Expected Result** | A "Complete your profile" or name/phone prompt modal opens instead of the upload modal. |
| **Severity if Failed** | MAJOR |

---

**TC-E-02 — User without a phone number is asked to complete profile**

| | |
|---|---|
| **Precondition** | Logged-in user whose profile has no phone number |
| **Steps** | 1. Click the "+" button. |
| **Expected Result** | The profile completion modal opens — not the upload modal. |
| **Severity if Failed** | MAJOR |

---

### GROUP F — Deleting a Story (Owner Only)

---

**TC-F-01 — Owner sees delete icon on own story**

| | |
|---|---|
| **Precondition** | Logged-in user views their own story |
| **Steps** | 1. Open the story viewer. 2. Navigate to one of your own stories. 3. Observe the controls. |
| **Expected Result** | A **delete (trash) icon** is visible. A **report icon is NOT shown** (since it's your own story). |
| **Severity if Failed** | CRITICAL |

---

**TC-F-02 — Delete icon opens a confirmation modal**

| | |
|---|---|
| **Steps** | 1. While viewing own story, click the delete icon. |
| **Expected Result** | A confirmation modal appears asking "Are you sure you want to delete this story?" with Confirm and Cancel buttons. |
| **Severity if Failed** | MAJOR |

---

**TC-F-03 — Cancel on delete modal keeps story intact**

| | |
|---|---|
| **Steps** | 1. Click delete icon. 2. Click "Cancel" on the confirmation modal. |
| **Expected Result** | Modal closes. Story is NOT deleted. Story continues playing from where it was paused. |
| **Severity if Failed** | MAJOR |

---

**TC-F-04 — Confirm delete removes the story — happy path**

| | |
|---|---|
| **Steps** | 1. Click delete icon on own story. 2. Click "Confirm" on the modal. |
| **Expected Result** | Story is deleted. A success notification appears. The stories bar refreshes and the deleted story no longer appears. |
| **Severity if Failed** | CRITICAL |

---

**TC-F-05 — Deleting the only story navigates to the next user**

| | |
|---|---|
| **Precondition** | Your account has exactly ONE story |
| **Steps** | 1. Open your story. 2. Delete it. |
| **Expected Result** | After deletion, the viewer automatically navigates to the next user's stories (not a blank/error screen). |
| **Severity if Failed** | MAJOR |

---

**TC-F-06 — Deleting one story keeps remaining stories visible**

| | |
|---|---|
| **Precondition** | Your account has more than one story |
| **Steps** | 1. Open your first story. 2. Delete it. |
| **Expected Result** | Viewer stays open and shows your next story. Stories bar updates to reflect the reduced count. |
| **Severity if Failed** | MAJOR |

---

**TC-F-07 — Non-owner does NOT see a delete icon**

| | |
|---|---|
| **Steps** | 1. Open any story that belongs to another user. 2. Observe the controls. |
| **Expected Result** | No delete icon is visible. Only the report icon is shown. |
| **Severity if Failed** | CRITICAL |

---

### GROUP G — Reporting a Story (Non-Owner Only)

---

**TC-G-01 — Non-owner sees report icon on other user's story**

| | |
|---|---|
| **Precondition** | Logged-in user views another user's story |
| **Steps** | 1. Open a story belonging to another user. 2. Observe the controls. |
| **Expected Result** | A **report (flag) icon** is visible. A **delete icon is NOT shown**. |
| **Severity if Failed** | CRITICAL |

---

**TC-G-02 — Report icon opens a confirmation modal**

| | |
|---|---|
| **Steps** | 1. While viewing another user's story, click the report icon. |
| **Expected Result** | A confirmation modal appears with a message like "Are you sure you want to report this story?" with Confirm and Cancel buttons. |
| **Severity if Failed** | MAJOR |

---

**TC-G-03 — Cancel on report modal keeps story playing**

| | |
|---|---|
| **Steps** | 1. Click report icon. 2. Click "Cancel" on the modal. |
| **Expected Result** | Modal closes. Story resumes playing. No report is submitted. |
| **Severity if Failed** | MAJOR |

---

**TC-G-04 — Confirm report shows success notification**

| | |
|---|---|
| **Steps** | 1. Click report icon. 2. Click "Confirm". |
| **Expected Result** | A success notification appears. |
| **Severity if Failed** | MINOR |

---

**TC-G-05 — Owner does NOT see a report icon on own story**

| | |
|---|---|
| **Steps** | 1. Open one of your own stories. 2. Observe the controls. |
| **Expected Result** | No report icon is shown. Only the delete icon is visible. |
| **Severity if Failed** | CRITICAL |

---

### GROUP H — Product-Linked Stories

---

**TC-H-01 — Product page shows linked stories**

| | |
|---|---|
| **Precondition** | A product exists that has stories linked to it |
| **Steps** | 1. Navigate to that product's page. 2. Look for a stories section. |
| **Expected Result** | A stories bar or stories section is visible on the product page showing stories related to that product. |
| **Severity if Failed** | MAJOR |

---

**TC-H-02 — Clicking a product story opens the story viewer**

| | |
|---|---|
| **Steps** | 1. On the product page stories section, click a story. |
| **Expected Result** | The fullscreen story viewer opens and the story plays. |
| **Severity if Failed** | MAJOR |

---

**TC-H-03 — Product story viewer GA event includes product context**

| | |
|---|---|
| **Steps** | 1. Open a product story. 2. Check browser dev tools → Network tab → look for analytics events. |
| **Expected Result** | The `VIEW_STORY` event logs `screen_name: "product_screen"` and a valid `product_id`. |
| **Severity if Failed** | MINOR |

---

### GROUP I — Analytics and Event Tracking

---

**TC-I-01 — VIEW_STORY event fires when a story starts playing**

| | |
|---|---|
| **Steps** | 1. Open browser dev tools → Network tab. 2. Open any story. |
| **Expected Result** | A network request to Google Analytics is captured containing the `VIEW_STORY` event name with `story_id`, `user_id_custom`, `story_type` (image or video), and `screen_name`. |
| **Severity if Failed** | MINOR |

---

**TC-I-02 — Home screen stories log "home_screen" context**

| | |
|---|---|
| **Steps** | 1. Open a story from the home page stories bar. 2. Check analytics event. |
| **Expected Result** | `VIEW_STORY` event includes `screen_name: "home_screen"`. |
| **Severity if Failed** | MINOR |

---

**TC-I-03 — Story screen view event fires when viewer opens**

| | |
|---|---|
| **Steps** | 1. Open any story. 2. Check analytics. |
| **Expected Result** | A `SCREEN_VIEW` event with `story_screen` is captured when the fullscreen viewer opens. |
| **Severity if Failed** | MINOR |

---

**TC-I-04 — Short "peek" views (under 100ms) do NOT trigger view event**

| | |
|---|---|
| **Steps** | 1. Open a story. 2. Immediately navigate away (in under 1 second). 3. Check analytics. |
| **Expected Result** | No `VIEW_STORY` event is logged for this ultra-short interaction. |
| **Severity if Failed** | MINOR |

---

### GROUP J — Negative and Edge Cases

---

**TC-J-01 — Stories bar shows correct number of user groups**

| | |
|---|---|
| **Steps** | 1. Count visible story thumbnails in the bar. 2. Click through each. |
| **Expected Result** | Each thumbnail represents a unique user. Users with zero stories are NOT shown. |
| **Severity if Failed** | MAJOR |

---

**TC-J-02 — Stories bar is empty when no stories exist**

| | |
|---|---|
| **Precondition** | No users have active stories (requires test environment with cleared data) |
| **Steps** | 1. Open the home page. |
| **Expected Result** | Stories bar is empty or only the "+" button is shown. No crash or error. |
| **Severity if Failed** | MAJOR |

---

**TC-J-03 — Upload with no file selected does not proceed**

| | |
|---|---|
| **Steps** | 1. Open the add story modal. 2. Do NOT select any file. 3. Try to click "Share Story". |
| **Expected Result** | The "Share Story" button is disabled or no upload is triggered. No spinner or success message appears. |
| **Severity if Failed** | MAJOR |

---

**TC-J-04 — Upload fails gracefully on network error**

| | |
|---|---|
| **Steps** | 1. Select a valid file. 2. Disconnect internet or use browser network throttle to block upload. 3. Click "Share Story". |
| **Expected Result** | An error notification appears. The app does NOT crash. The spinner stops. |
| **Severity if Failed** | MAJOR |

---

**TC-J-05 — Camera button is disabled/errors when camera permissions denied**

| | |
|---|---|
| **Precondition** | Browser camera permissions are denied for the site |
| **Steps** | 1. Click "+". 2. Click "Camera". |
| **Expected Result** | An error notification or appropriate message explains that camera access is not allowed. The app does not crash. |
| **Severity if Failed** | MAJOR |

---

**TC-J-06 — Second "+" click during upload is blocked**

| | |
|---|---|
| **Precondition** | An upload is in progress (spinner visible on "+") |
| **Steps** | 1. Start an upload. 2. While the spinner is showing, click "+" again. |
| **Expected Result** | The upload workflow does not restart. The spinner continues without interruption. |
| **Severity if Failed** | MINOR |

---

### GROUP K — UI and Responsiveness

---

**TC-K-01 — Stories bar scrolls horizontally on desktop**

| | |
|---|---|
| **Steps** | 1. View the stories bar on desktop. 2. If many stories are present, scroll left/right. |
| **Expected Result** | The bar scrolls smoothly horizontally. No vertical scroll is triggered. |
| **Severity if Failed** | MAJOR |

---

**TC-K-02 — Stories bar scrolls and swipes on mobile**

| | |
|---|---|
| **Steps** | 1. Open the home page on a mobile device. 2. Swipe the stories bar left and right. |
| **Expected Result** | Bar scrolls horizontally following the swipe gesture. |
| **Severity if Failed** | MAJOR |

---

**TC-K-03 — Fullscreen viewer covers entire screen**

| | |
|---|---|
| **Steps** | 1. Open any story viewer on desktop and mobile. |
| **Expected Result** | On both: the viewer takes up the full screen with a black background. Navigation bars / app chrome are hidden or overlaid. |
| **Severity if Failed** | MAJOR |

---

**TC-K-04 — Story media is centered and not stretched**

| | |
|---|---|
| **Steps** | 1. View an image story. 2. View a video story. |
| **Expected Result** | Media is centered and fits within the screen. No distortion, cropping, or stretching beyond 90% of viewport. Aspect ratio is preserved. |
| **Severity if Failed** | MAJOR |

---

**TC-K-05 — Story loading skeleton appears while stories load**

| | |
|---|---|
| **Steps** | 1. Open the home page with a slow connection. 2. Observe the stories area before stories load. |
| **Expected Result** | Skeleton placeholder shapes are shown in the stories bar while the real stories are being fetched. |
| **Severity if Failed** | MINOR |

---

### GROUP L — RTL Layout (Arabic / Kurdish)

---

**TC-L-01 — Stories bar is mirrored in RTL**

| | |
|---|---|
| **Precondition** | App language is set to Arabic or Kurdish |
| **Steps** | 1. Open the home page. 2. Observe the stories bar. |
| **Expected Result** | The "+" button appears on the **right side** of the bar. Stories flow from right to left. |
| **Severity if Failed** | MAJOR |

---

**TC-L-02 — Story viewer navigation is mirrored in RTL**

| | |
|---|---|
| **Precondition** | App language is Arabic or Kurdish |
| **Steps** | 1. Open a story. 2. Tap/click the left side. 3. Tap/click the right side. |
| **Expected Result** | In RTL: clicking the **right side** goes to the **next** story; clicking the **left side** goes to the **previous** story (opposite of LTR). |
| **Severity if Failed** | MAJOR |

---

**TC-L-03 — Add story modal layout is RTL**

| | |
|---|---|
| **Precondition** | App language is Arabic or Kurdish |
| **Steps** | 1. Click "+". 2. Observe the modal. |
| **Expected Result** | Text, labels, and elements align to the right. Input reads right-to-left. |
| **Severity if Failed** | MINOR |

---

## 10. Expected Results Summary

| Area | Pass Definition |
|---|---|
| Viewing stories | Stories play in sequence. Progress bar works. Image: ~5s, video: full duration. |
| Upload - image | File previews, uploads, appears in bar, success notification shown. |
| Upload - video | Same as image. Video plays correctly in viewer after upload. |
| Link attachment | Link is visible on the story. Tapping opens the URL in a browser. |
| Delete (owner) | Story removed, bar refreshed, viewer navigates away if needed. |
| Report (non-owner) | Confirmation modal shown, success notification after confirm. |
| Access control | Delete only on own story. Report only on others. Guest cannot upload. |
| Error notifications | All invalid inputs (large file, long video, bad URL) show error messages. |
| Gestures | Swipe left/right, drag down all work correctly. |
| Pagination | More stories load as user scrolls the bar. |

---

## 11. API / Network Validation

When checking API behavior using browser dev tools (F12 → Network tab):

| Action | Expected API Call |
|---|---|
| Home page load | `GET /api/v1/stories/users_stories?page=1` |
| Scroll stories bar | `GET /api/v1/stories/users_stories?page=2` (and so on) |
| View a story | `GET /api/v1/stories/increase_viewers/{story_id}` |
| Upload a story | `POST /upload` (media server), then `POST /api/v1/stories/add_story` |
| Delete a story | `POST /api/v1/stories/delete_story` |
| Product page stories | `GET /api/v1/stories/product_stories/{product_id}?page=1` |

For each call confirm:
- Status code is `200` or `201` on success.
- No `500` errors appear in the network tab.
- After upload, a subsequent `GET` to stories returns the newly added story.

---

## 12. Security / Permission Validation

| Check | Expected |
|---|---|
| Guest user clicks "+" | Login flow is triggered. NO upload modal appears. |
| Non-owner tries to access delete API directly | API should return an error (not `200`). |
| SVG file upload attempt | Rejected at the client side before any network call. |
| Link field with `<script>` tag | Input is sanitized. No script is executed. No `<script>` tag is stored or displayed. |
| Large file over 10MB | Rejected before uploading. No server call is made. |

---

## 13. Performance / Latency Checks

| Check | Acceptable Behavior |
|---|---|
| Home page stories bar loads | Stories appear within 3 seconds of page load on a normal connection. |
| Story viewer opens | Viewer opens within 1 second of clicking a thumbnail. |
| Image story displays | Image appears immediately upon opening (no blank screen). |
| Video story starts | Video starts playing within 2 seconds (buffering spinner is acceptable). |
| Pagination fetch | New stories append within 2 seconds of reaching the end of the bar. |
| Upload completion notification | Notification appears within 8 seconds of clicking "Share Story". |

---

## 14. Logging and Evidence to Capture

For every defect found, capture the following:

- **Screenshot** of the UI showing the issue.
- **Screen recording** if the issue is a flow or animation problem.
- **Browser console errors** (F12 → Console tab — paste any red error messages).
- **Network request** that failed (F12 → Network tab — right-click the failed request and copy as cURL).
- **Steps to reproduce** numbered precisely.
- **Device and browser** used (e.g., "iPhone 14 Safari" or "Windows Chrome 124").
- **App language** at the time (EN/AR/KU).
- **Account type** (guest / authenticated / owner / non-owner).

---

## 15. Severity / Priority Guidance

| Severity | Definition | Examples |
|---|---|---|
| **CRITICAL** | Feature is completely broken or a security issue exists | Guest can upload stories; delete icon shown to non-owner; viewer crashes on open |
| **MAJOR** | Important function is broken but a workaround exists | Video over 60s not rejected; delete doesn't refresh stories bar; pagination fails |
| **MINOR** | UI issue or non-blocking inconsistency | Spinner not shown during upload; wrong RTL alignment; link auto-correct missing |

---

## 16. Exit Criteria

Testing is considered complete when:

- [ ] All `CRITICAL` scenarios pass with no failures.
- [ ] All `MAJOR` scenarios pass or have known accepted behavior.
- [ ] All `MINOR` findings are logged and prioritized.
- [ ] Tests run on at least one desktop browser (Chrome) and one mobile browser (Safari iOS or Chrome Android).
- [ ] Tests run in both English (LTR) and Arabic (RTL).
- [ ] Evidence (screenshots/recordings) is captured for any failing test.

---

## 17. Risks and Notes

| Risk | Note |
|---|---|
| Report functionality | Reporting a story currently shows a success notification but the backend reporting action may be a placeholder. Confirm with the dev team whether actual reporting is implemented. |
| View count accuracy | View count increments are fire-and-forget; occasional failures may not show an error to the user. |
| Stories auth token expiry | If the `STORIES-TOKEN` cookie expires mid-session, stories may fail to load without a visible error. Check Network tab for `401` responses.and it will ask for verify your phone |
