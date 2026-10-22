# Stories — Tester Guide

A list of test cases for **Stories**. No coding needed. Follow the steps and
compare what you see with the **Expected** line.

**Checked against the code:** branch `development`, 2026-10-21.

Every **Expected** line says what the app does **today**, as written in the
code. Where the code does something wrong, the case says so and points to a
problem in **section 11**. Those problems come from reading the code. Most of
them have not been seen on a real device yet. Your job there is to confirm them.

Stories appear in four places:

1. **Home stories bar** — the row of story cards on the home page and on
   category pages.
2. **Product stories** — the "Product Story" row on a product page.
3. **Chat window → Stories tab** — a list of people with stories inside the
   chat window.
4. **Seller shop stories** — the **Stories** tab inside the Seller Dashboard.

Places 1, 2 and 3 open the **same full-screen viewer**. Test the viewer once
(section 3) and then only check that each place opens it. The product page has
some differences (section 7).

**About the message text in this guide.** In **English**, the app shows every
message in Title Case. For example, "No stories yet" shows as **"No Stories
Yet"**, and "1 minutes video only" shows as **"1 Minutes Video Only"**. This is
normal. The quotes below use the text as it is written in the code.

**Two messages at once.** For some failures the app shows the backend's own
message **and** its own message. Two messages for one
action are expected in the cases that say so. Report the exact text of both.

---

## 1. Rules that apply in the whole flow

Read these first. Most cases below check one of these rules.

**Who can add a story**

- The **"+"** card in the home stories bar appears **only** when the account
  profile is marked as allowed to upload stories. The app only reads that flag
  (`is_allowed_to_upload_story` = 1). The backend decides who gets the flag.
  The team says the rule is: **a customer with at least one delivered order**.
  The app cannot check this rule, so test it with the team's accounts.
- In the Seller Dashboard, the **Stories** tab and its buttons follow three
  permissions:
  - `READ_STORY` → the **Stories** menu item, the Stories tile on the
    dashboard home, and the tab.
  - `CREATE_STORY` → the **Add Story** button.
  - `DELETE_STORY` → the **Delete** button on each card.
  - A user with `SUPER_ADMIN` gets **all three**, even without the three
    permissions above.

**Media rules**

- Max file size: **10 MB** (10 × 1024 × 1024 bytes = 10,485,760 bytes). A file
  that your computer shows as "10.2 MB" may still pass. To test the limit, use a
  file over **10.5 MB**. Message: **"File size should not exceed 10 MB"**.
- Video max length: **1 minute**. Message: **"1 minutes video only"**.
  - Home flow: a video **longer than 59 seconds** is refused (so 59.5 s is
    refused too). The check runs when you tap **Share Story**, not when you
    pick the video.
  - Seller flow: a video **longer than 60 seconds** is refused. The check runs
    when you pick the video.
- The file picker offers only: **jpg, jpeg, png, gif, mp4, mov, 3gp, avi**.
- **SVG images are refused** with **"SVG Images Not Allowed"**.
- Every photo goes through a **Crop Image** screen before it can be shared.
  Videos do not. If you tap **Save** without any change, the original file is
  kept (a GIF stays animated). Any crop or rotate saves the photo as JPEG.
- The in-app camera records in the format the browser supports: **WebM** first,
  otherwise **MP4**. A browser that cannot record at all shows **"Not
  Supported"**.

**Link rules (same in both flows)**

- The link field is optional.
- A link without `http://` or `https://` is saved with `https://` added.
- A link with no dot in it (for example `example`) is refused with the message
  **"Please enter a valid URL (e.g., example.com or www.example.com)"**.
- While the link is wrong, the **Share Story** button stays disabled.
- The app **removes these characters while you type**: `< > , # $ % ^ & * ( )`.
  It also cuts the link at **90 characters**. So a link with `&`, `%` or `#` is
  saved changed, with no message. See AS-24.
- Any website is allowed. The app does not check where the link goes.
  One exception: a story whose link goes to the QA test site is hidden from
  everyone outside the QA list. Do not use the QA site link in normal tests.

**Viewing rules**

- Each photo shows for **5 seconds**. A video shows for its own length (the
  length the backend reports, or the video file's own length if the backend
  sends none).
- A person with **no stories** never appears in the bar.
- A person with **no name** is shown as **"Unknown"** (translated). The app only
  shows the name the backend sends. If you see a phone number as a name, report
  it — the backend sent it.
- Views are sent **only when your stories account is loaded**. Being signed in
  is not always enough: if the stories sign-in failed, you are treated like a
  guest here. As a guest, opening a story does not raise the view count.
- The app does **not** promise one view per story. It can send the view again
  for the same story (problem P-7). Whether the count goes up twice depends on
  the backend.
- The **report** flag appears only when your stories account is loaded, and
  only on **other people's** stories.
- The **delete** (bin) icon appears only on **your own** stories.
- If the stories service is down, the bar shows **no cards** (only the "+" card
  for an allowed account). There is no error message, and the rest of the page
  keeps working. The app retries 3 times first, so the grey cards stay about
  **3 seconds** longer than normal.

---

## 2. Home stories bar

### HS-1 — The bar loads
1. Open the home page.
2. **Expected:** nine grey cards appear first, then the real story cards
   replace them. For an allowed account the real **"+"** card is first. The
   "+" card is not a placeholder: it may appear a moment later, when your
   profile loads. Guests and accounts that are not allowed see no "+" card.

### HS-2 — The bar is on category pages too
1. Open the home page and pick any main category.
2. **Expected:** the same stories bar appears on the category page. Moving
   between home and a category loads the bar again from the start: the grey
   cards show again, and only the first page of people is there.

### HS-3 — Card contents
1. Look at any story card.
2. **Expected:** a picture, the person's name at the bottom, and a small round
   avatar at the top corner. If the person has no name, the card shows
   **"Unknown"**.

### HS-4 — The ring changes after you watch
1. Open a person with one story, watch it, and close the viewer.
2. **Expected:** that person's avatar circle changes from **orange** to
   **white** without a page reload.

### HS-5 — The card picture
1. Open one story of a person who has several, then close the viewer.
2. **Expected:** the card now shows the first story you have **not** seen. If
   you have seen all of them, the card shows their **first** story. Your
   **own** card always shows your **newest** story.

### HS-6 — More people load while scrolling
1. Scroll the bar sideways to the end.
2. **Expected:** a small loading circle appears and more people are added.
   Repeat until no more are added.
3. If loading a later page fails, a red message with the backend's text shows.
   (The first page fails silently, see HS-9. Later pages do not.)

### HS-7 — Signed out
1. Sign out and open the home page.
2. **Expected:** the bar still loads and the stories open. There is no "+" card.

### HS-8 — Arabic and Kurdish direction
1. Switch the language to Arabic (or Kurdish).
2. **Expected:** the bar starts from the **right** side and scrolls to the
   left. The "+" card is the first card on the right.

### HS-9 — The stories service is down
1. Ask the team to test with the stories service failing, then open the home
   page.
2. **Expected:** after about 3 seconds the grey cards go away and the bar is
   **empty** (only the "+" card for an allowed account). No error message. The
   rest of the home page loads as normal. The grey cards must **not** stay on
   screen for ever.
3. If the failure is an expired sign-in that cannot be renewed, the app opens
   the **phone check** screen instead. That is expected for that case.

---

## 3. Story viewer (home, product page and chat Stories tab)

### SV-1 — Open a story
1. Tap any story card.
2. **Expected:** a full black screen opens with the story, thin progress bars at
   the top (one bar per story of that person), the person's photo, name and the
   story time at the top left, and an **X** at the top right.
3. The address bar gets `?stories=true` at the end.

### SV-2 — The story time label
1. Open a story added today, then one added earlier.
2. **Expected:** today shows **"Today | 14:03:27"** (hours, minutes and
   seconds), the day before shows **"Yesterday | 14:03:27"**, and an older one
   shows **"05/03/2025 | 14:03:27"** — day first, then month, then year. The
   time is in your device's time zone. The words **Today** and **Yesterday** are
   translated (but see problem P-10 for Kurdish).

### SV-3 — Which story opens first
1. Tap **another person's** card.
2. **Expected:** it starts from their **first story you have not seen**. If you
   have seen them all, it starts from their first story.
3. Tap **your own** card.
4. **Expected:** it starts from your **newest** story.

### SV-4 — Move forward and back by tapping
1. Open a person with more than one story.
2. Tap the **right half** of the screen.
3. **Expected:** it moves to the next story.
4. Tap the **left half**.
5. **Expected:** it moves back to the story before. On the first story of a
   person, the left half opens the **previous person**.
6. Do the same in Arabic.
7. **Expected:** the halves are **not** mirrored. The right half still goes
   forward and the left half still goes back.
8. Open the **first** person in the bar, stay on their first story, and tap the
   left half. See problem P-6: the screen may stay black with the loader. Report
   what you see.

### SV-5 — Stories play by themselves
1. Open a photo story and do not touch the screen.
2. **Expected:** the top bar fills in about 5 seconds, then the next story
   starts on its own.
3. Open a video story.
4. **Expected:** the video plays by itself, **with sound**, and moves on when it
   finishes (or when the top bar is full, whichever comes first).
5. There is no press-and-hold to pause. Holding a finger on the screen does
   nothing special.

### SV-6 — Move between people
1. Open a story and swipe **left** or **right**. Drag more than half the screen,
   or flick fast.
2. **Expected:** the screen turns like a cube and the next (or previous)
   person's stories open, starting at **their** first unseen story (not at the
   position of the person before). A short, slow drag springs back.
3. Swipe toward "previous" on the first person, or toward "next" on the last
   person.
4. **Expected:** nothing happens.

### SV-7 — End of the last person
1. Keep tapping the right half until the last story of the **last** person
   finishes.
2. **Expected:** the viewer closes and you are back on the page.

### SV-8 — Close by swiping down
1. Open a story and pull it **down** with your finger (or mouse).
2. **Expected:** the screen follows your finger. Pull more than **20 %** of the
   screen height and the viewer closes. Pull a little (more than 5 % but less
   than 20 %) and let go — it snaps back and keeps playing.
3. Pull only a very small amount (5 % or less) and let go.
4. **Expected (problem P-15):** the screen may stay a little lower and not snap
   back. Report what you see.

### SV-9 — Close with the X
1. Open a story and tap the **X** at the top right.
2. **Expected:** the viewer closes.
3. Open a story again and press the browser **Back** button.
4. **Expected:** the viewer closes and you stay on the same page.

### SV-10 — "View More" link button
1. Open a story that was added with a link.
2. **Expected:** a **View More** button is at the bottom.
3. Tap it.
4. **Expected:** the link opens in a **new tab**.

### SV-11 — "View Product" button
1. Open a story that is linked to a product.
2. **Expected:** a **View Product** button is at the bottom.
3. Tap it.
4. **Expected:** the viewer closes and the product page opens.

### SV-12 — A story with a link and a product
1. Open a seller story that has both a link and a linked product.
2. **Expected:** both **View More** and **View Product** are at the bottom.

### SV-13 — Guest view
1. Sign out and open any story.
2. **Expected:** there is no bin icon and no flag icon. The X, **View More** and
   **View Product** still work.

### SV-14 — How many views are sent
1. Signed in, open another person's story **A** and watch it. Let it move on to
   story **B**, then tap back to **A**.
2. Ask the team (or the shop owner, in the Seller Dashboard) for the viewers
   count of story A before and after.
3. **Expected:** the count of A went up. The app sends a view for A again each
   time you come back to it (problem P-7). The backend decides whether the
   second view counts. Write down how much the count went up.

---

## 4. Add a story from the home bar

### AS-1 — The "+" card only for allowed accounts
1. Sign in with an account that is **not** allowed to upload stories.
2. **Expected:** there is no "+" card in the bar.
3. Sign in with an allowed account.
4. **Expected:** the "+" card is the first card in the bar.

### AS-2 — The "+" card stays first
1. Add a story, then look at the bar again.
2. **Expected:** the "+" card is still the first card, before every person.

### AS-3 — Account with no name
1. Sign in with an account that has no name (or a temporary guest name) and tap
   **"+"**.
2. **Expected:** the "enter your name" screen opens first, not the Add Story
   screen.

### AS-4 — Open the Add Story screen
1. Sign in with a complete account and tap **"+"**.
2. **Expected:** on the first tap, a dark grey loading screen may show for a
   moment. Then a full screen called **Add Story** opens with a preview area on
   one side and **Take Photo**, **Upload Photo/Video** and a link field on the
   other. The empty preview says **"No media selected"**. The page behind it
   cannot be scrolled.

### AS-5 — Pick a photo from the device
1. In the Add Story screen tap **Upload Photo/Video** and pick a photo.
2. **Expected:** the **Crop Image** screen opens.
3. Turn the photo with the two rotate buttons, drag to choose the area, tap
   **Save**.
4. **Expected:** the cropped photo shows in the preview and a **Share Story**
   button appears.

### AS-6 — Share a photo story
1. After AS-5, tap **Share Story**.
2. **Expected:** a loading circle shows inside the button, then the message
   **"Story Uploaded"**, the screen closes, and your story appears in the bar.
3. The "+" card does **not** show a spinner after the upload (problem P-3). The
   bar just updates.

### AS-7 — Remove the chosen photo
1. Choose a photo so the preview shows.
2. Tap the small **X** at the top right of the preview.
3. **Expected:** the preview is cleared, the **Share Story** button disappears,
   and you can pick a new file.

### AS-8 — File bigger than 10 MB
1. Tap **Upload Photo/Video** and pick a file over 10.5 MB.
2. **Expected:** the message **"File size should not exceed 10 MB"** appears and
   nothing is added to the preview.

### AS-9 — Other file types
1. Open the file picker and look at the file types it offers.
2. **Expected:** only jpg, jpeg, png, gif, mp4, mov, 3gp and avi can be chosen.
3. If your device lets you force an **SVG** file through, pick one.
4. **Expected:** the message **"SVG Images Not Allowed"** and nothing is added.
5. If your device lets you force a non-media file (for example a PDF) through,
   pick one.
6. **Expected:** nothing happens and no message shows.

### AS-10 — Video longer than 59 seconds
1. Pick a video that is **60 seconds or longer**.
2. **Expected:** the video shows in the preview as a still frame (no play
   controls).
3. Tap **Share Story**.
4. **Expected:** the message **"1 minutes video only"** appears and the video is
   **not** uploaded. The video **stays** in the preview and **Share Story**
   stays on screen (problem P-2). Tap the X on the preview to clear it.

### AS-11 — Share a short video
1. Pick a video of **50 seconds or less** and tap **Share Story**.
2. **Expected:** it uploads, the message **"Story Uploaded"** appears, the
   screen closes, and the video story is in the bar.

### AS-12 — Wrong link
1. Choose any photo.
2. In the link field type `example` (no dot).
3. **Expected:** the red message **"Please enter a valid URL (e.g.,
   example.com or www.example.com)"** appears under the field and **Share
   Story** is disabled.
4. Change it to `example.com`.
5. **Expected:** the message goes and **Share Story** works again.

### AS-13 — Link is saved with the story
1. Add a story with the link `example.com`.
2. Open your story in the viewer.
3. **Expected:** the **View More** button is there and opens
   `https://example.com`.

### AS-14 — Upload fails
1. Turn the network off, then tap **Share Story**.
2. **Expected:** the message **"Upload Failed Try Again"** appears, the Add
   Story screen stays open with your photo, and no story is added. A second
   red message with the browser's own error (for example **"Failed to fetch"**)
   may show first.
3. **"Error Uploading Story"** means something failed **after** the story was
   saved — most often the bar could not reload. In that case the story **was**
   added, the screen stays open, and the message still says error. Close the
   screen, reload the page and check whether the story is there. Report the
   exact steps.

### AS-15 — Take a photo with the camera
1. In the Add Story screen tap **Take Photo**.
2. **Expected:** a camera screen called **Create Story** opens with **Photo**
   and **Video** tabs.
3. Stay on **Photo**, tap the big round button.
4. **Expected:** the title becomes **Preview Photo** and the picture is shown.
5. Tap the blue share button.
6. **Expected:** the camera closes and the **Crop Image** screen opens with your
   picture.

### AS-16 — Record a video with the camera
1. Tap **Take Photo**, then the **Video** tab, then the red round button.
2. **Expected:** a red timer runs at the top of the camera.
3. Record about **10 seconds**, then tap the button again to stop.
4. **Expected:** the title becomes **Preview Video** and your video shows with
   play controls. Press play to watch it — it does not start by itself.
5. Tap the blue share button.
6. **Expected:** the camera closes and the video is in the Add Story preview as
   a still frame. There is no crop screen for video.
7. Tap **Share Story**.
8. **Expected:** **"Story Uploaded"**, and the video story plays in the viewer.

### AS-17 — Recording stops by itself
1. Start recording and do not stop.
2. **Expected:** the recording stops on its own at **59 seconds** and the
   preview opens.
3. Tap the blue share button, then tap **Share Story**.
4. **Expected (problem P-1):** the app will probably refuse it with **"1
   minutes video only"**, because the recording is slightly longer than 59
   seconds. Report what you see.

### AS-18 — Flip the camera
1. In the camera screen tap the flip button on the left.
2. **Expected:** it switches between the front and the back camera. On a device
   with only one camera the button is greyed out.

### AS-19 — No microphone
1. On a device with no microphone, or with the microphone permission refused,
   tap **Take Photo**.
2. **Expected (problem P-4):** the camera does **not** open, because the app
   asks for camera **and** microphone together. The first tap shows no message.
   The second tap shows **"Please enable camera permissions to use camera
   features"**.
3. The red banner **"Microphone not detected or permission denied"** shows only
   if the microphone is removed **after** the camera has opened once in the
   same page visit.

### AS-20 — Camera permission blocked
1. Block the camera permission in the browser, then tap **Take Photo**.
2. **Expected (problem P-4):** the camera does not open and **no message**
   shows on the first tap.
3. Tap **Take Photo** again.
4. **Expected:** the message **"Please enable camera permissions to use camera
   features"** appears, and the **Take Photo** button is greyed out.

### AS-21 — Discard from the camera
1. Take a photo, then tap the back arrow (top left) or the X (bottom right).
2. **Expected:** the photo is dropped and you are back at the live camera.
3. Tap it again.
4. **Expected:** the camera closes and you are back in the Add Story screen.

### AS-22 — Close the Add Story screen
1. Choose a photo and type a link, then tap the **X** at the top.
2. **Expected:** the screen closes, nothing is uploaded, and when you open it
   again the preview and the link field are empty.
3. Choose a photo, tap **Share Story**, and tap the **X** while it uploads.
4. **Expected:** the screen closes, the upload goes on, and **"Story Uploaded"**
   appears a little later.

### AS-23 — The bar keeps the people you already loaded
1. Scroll the bar to the end until a second page of people has loaded (HS-6).
   Note the name of a person from the end of the bar.
2. Add a story (AS-6).
3. **Expected:** after the bar reloads, your new story is in your card **and**
   the person you noted is still in the bar. Nobody disappears.

### AS-24 — The link is changed while you type
1. Choose a photo. In the link field type `example.com/a?x=1&y=2#top`.
2. **Expected:** the field shows `example.com/a?x=1y=2top`. The `&` and `#` are
   removed as you type, with no message (problem P-16).
3. Paste a link longer than 90 characters.
4. **Expected:** the field keeps only the first 90 characters.

---

## 5. Delete your own story

### DL-1 — The delete icon is only on your stories
1. Open **your own** story.
2. **Expected:** a bin icon is at the top right.
3. Open **someone else's** story.
4. **Expected:** there is no bin icon.

### DL-2 — Cancel the delete
1. Open your **photo** story, tap the bin icon.
2. **Expected:** a box titled **Delete Story** asks **"Are you sure you want to
   delete this story?"** with **Cancel** and a red **Confirm**. The story
   picture and the **View More** / **View Product** buttons are hidden, and the
   story stops. The name, time and top bars stay on screen. Tapping the dark
   area outside the box does nothing.
3. Tap **Cancel**.
4. **Expected:** the box closes and the photo story continues from the same
   point.
5. Do the same on your **video** story.
6. **Expected (problem P-5):** the video starts again from **0:00**, but the
   top bar continues from where it stopped. So the viewer moves on before the
   video ends.

### DL-3 — Delete one story out of several
1. Open your own account which has 2 or more stories.
2. Tap the bin and tap **Confirm**.
3. **Expected:** a spinner replaces the buttons, then the message **"Story
   deleted successfully."** appears, the deleted story is gone, and the viewer
   stays on your remaining stories.
4. Close the viewer.
5. **Expected:** your card is still in the bar, with one story fewer.

### DL-4 — Delete your only story
1. Open your account when it has exactly one story and delete it.
2. **Expected:** the success message appears, the viewer moves to the next
   person, and your card is gone from the bar. If your card was the **last**
   one in the bar, the viewer closes instead.

### DL-5 — Delete fails
1. Ask the team to test with the stories service failing, then delete a story.
2. **Expected:** an error message appears (the backend's own message, or
   **"Failed to delete story."**) and the story stays. The box closes and the
   story plays again. There is no success message. The backend's message may
   not be translated, and it may show twice.

---

## 6. Report someone else's story

### RP-1 — The report flag is only on other people's stories
1. Signed in, open **another person's** story.
2. **Expected:** a flag icon is at the top right.
3. Open **your own** story.
4. **Expected:** there is no flag icon, only the bin.

### RP-2 — No report flag for a guest
1. Sign out and open any story.
2. **Expected:** there is no flag icon.

### RP-3 — Open the report sheet
1. Tap the flag icon.
2. **Expected:** a sheet called **Report Story** appears at the bottom of the
   screen at once (it does not slide). It has an **X** at the top, a **Report
   Reason** label, 6 reasons, a details box and the buttons **Cancel** and
   **Submit Report**. The story picture stops and is hidden.
3. The 6 reasons are: **Inappropriate Content**, **Harassment or Hate Speech**,
   **Spam or Scam**, **Intellectual Property Violation**, **Violence or
   Dangerous Content**, **Other**.

### RP-4 — Submit is blocked when nothing is chosen
1. Open the report sheet and do not choose anything.
2. **Expected:** **Submit Report** is greyed out and cannot be tapped.

### RP-5 — Choose more than one reason
1. Tap two or three reasons.
2. **Expected:** every one you tap gets a purple outline, and tapping it again
   removes it. Several can be chosen at the same time.

### RP-6 — "Other" jumps to the details box
1. Tap the reason **Other**.
2. **Expected:** the cursor moves into the details box straight away, and the
   label above it changes from **Details (optional)** to **Details**.

### RP-7 — Typing details chooses "Other" by itself
1. Without choosing any reason, type something in the details box.
2. **Expected:** **Other** becomes selected on its own. Spaces alone do not
   select it.
3. Delete everything you typed.
4. **Expected:** **Other** is no longer selected. (This happens even if you had
   picked **Other** by hand before typing.)

### RP-8 — Details limit
1. Type a very long text in the details box.
2. **Expected:** the counter under the box counts up and stops at **500/500**.
   No more letters can be typed.

### RP-9 — Send a report
1. Choose a reason and tap **Submit Report**.
2. **Expected:** a loading circle shows, then the message **"Story reported
   successfully."**, the sheet closes and the story plays again. On a video
   story, the video starts again from 0:00 (problem P-5).

### RP-10 — Report fails
1. Ask the team to test with the stories service failing, then send a report.
2. **Expected:** an error message appears (for example **"Failed to report
   story."**), the sheet stays open, and your reasons and details are kept. The
   backend's error may show twice.

### RP-11 — Close the sheet
1. Open the report sheet and tap **Cancel**.
2. **Expected:** it closes with nothing sent.
3. Open it again and tap the **X**, then open it again and tap outside the
   sheet.
4. **Expected:** it closes both times with nothing sent.
5. Tap **Submit Report** and, while it sends, tap the **X**.
6. **Expected:** **Cancel** is disabled while it sends, but the X still closes
   the sheet. The report is still sent and its message still appears.

---

## 7. Product stories (product page)

### PS-1 — The section only shows when there are stories
1. Open a product that has stories.
2. **Expected:** a row called **Product Story** appears under the product, with
   story cards.
3. Open a product with no stories.
4. **Expected:** there is no **Product Story** row at all.

### PS-2 — Border colour and card picture
1. Look at the product story cards.
2. **Expected:** a card with a story you did not watch has a **purple** border;
   the others have a **grey** border. The cards have no name and no avatar. Each
   card shows the person's **first** story, not the first unseen one.
3. Watch a story and close the viewer.
4. **Expected:** the border stays purple until you reload the page.

### PS-3 — Open a product story
1. Tap a card in the **Product Story** row.
2. **Expected:** the same full screen viewer opens. Tapping, swiping, closing and
   report work as in sections 3 and 6.
3. Delete your own story from here (section 5).
4. **Expected (problem P-8):** the success message shows, but the deleted story
   may stay in the viewer and in the row until you reload the page.
5. Close the viewer.
6. **Expected:** you are back on the product page, and the home stories bar
   (go back to the home page) still shows its own list.

### PS-4 — More product stories load
1. Open a product that has more than one page of stories (ask the team for
   one).
2. **Expected:** a loading circle shows and more cards are added. Repeat until
   no more are added.
3. Open a person from the second page and let their stories finish.
4. **Expected (problem P-8):** the viewer may jump to the **first** person in
   the row instead of the next one.
5. Open a product with only one page of stories.
6. **Expected:** no loading circle.

### PS-5 — A product story with a link and a product
1. Open a product story that carries both.
2. **Expected:** **View More** and **View Product** both show at the bottom, and
   **View Product** may open a different product from the page you started on.

### PS-6 — Arabic and Kurdish direction
1. Switch to Arabic (or Kurdish) and open the same product.
2. **Expected:** the story row starts from the **right**.

---

## 8. Chat window → Stories tab

Open the chat window (the chat button in the app). It has three tabs shown as
**icons** (no text): chats, calls and stories.

To open the chat you must be signed in **and** have a chat account **and**
allow browser notifications:

- If notifications are **blocked**, the app shows **"Notification Is Not
  Enabled! please Allow Notification Access"** and the chat does not open.
- If you have not answered the notification question yet, the app opens the
  notification window first.

### CS-1 — The tab loads
1. Tap the **Stories** tab.
2. **Expected:** five grey placeholder rows show first, then a list of people:
   a small round story picture and the person's name on each row. The list from
   the home bar may show for a moment before the grey rows.
3. If the first load fails, there are no grey rows and no error message. The tab
   shows the list the home bar had. Report it only if the tab is empty and says
   nothing.

### CS-2 — The ring colour
1. Look at the rows.
2. **Expected:** a person with a story you did not watch has a **green** ring
   round the picture; a person whose stories you have all seen has a **grey**
   ring.

### CS-3 — The row picture
1. Compare a row with the same person's card in the home bar.
2. **Expected:** the row shows the same story: your own row your **newest**
   story, another person's row the first story you have **not** seen.

### CS-4 — Open a story from the tab
1. Tap a row.
2. **Expected:** the same full screen viewer opens (section 3), starting at the
   same story as from the home bar (SV-3).

### CS-5 — More people load while scrolling
1. Scroll the list down to the end.
2. **Expected:** a small loading circle shows and more people are added. Repeat
   until no more are added. At the end, the line **"No more stories"** shows.

### CS-6 — Name and "Unknown"
1. Find a person with no name (ask the team for one).
2. **Expected:** the row shows **"Unknown"**.

### CS-7 — Signed in for a long time
1. Open the Stories tab, wait **2 minutes**, then scroll to load more people.
2. **Expected:** more people load as normal. The list does not go empty and
   nobody disappears.

### CS-8 — The tab resets the home bar
1. Scroll the home bar to the end so that a second page of people is loaded
   (HS-6). Note a person from the end.
2. Open the chat window and the **Stories** tab, then close the chat window.
3. **Expected (problem P-9):** the home bar now shows only the first page. The
   person you noted is gone, and scrolling the bar again usually does **not**
   bring them back. A page reload does. Report what you see.

---

## 9. Seller shop stories (Seller Dashboard → Stories tab)

### SS-1 — Who sees the tab
1. Sign in with a user who has **no** `READ_STORY` permission (and no
   `SUPER_ADMIN`) for the shop and open the Seller Dashboard.
2. **Expected:** there is no **Stories** item in the side menu and no
   **Stories** tile on the dashboard home.
3. Sign in with a user who has it.
4. **Expected:** **Stories** is in the side menu, and the dashboard home has a
   **Stories** tile with the note **"Share photo & video stories"**.

### SS-2 — Open the tab
1. Tap **Stories**.
2. **Expected:** six grey placeholder tiles show, then a grid of story cards.
   The total number sits in a small round badge next to the title **Stories**.
   The address bar now ends with `?tab=stories`.

### SS-3 — What a card shows
1. Look at any card.
2. **Expected:** the picture (or the video's first frame), a **Photo** or
   **Video** label at the top left, an eye icon with the number of viewers at
   the top right, and the date (like `2026-08-30`) at the bottom. Video cards
   also show a play circle.

### SS-4 — The card footer
1. Look at a card whose story has a link or a linked product.
2. **Expected:** the link shows in blue and the product **slug** shows in green
   under the picture.
3. Look at a card with no link and no product, using an account that cannot
   delete.
4. **Expected:** the card has no footer at all — only the picture.

### SS-5 — Empty shop
1. Open the Stories tab of a shop with no stories.
2. **Expected:** **"No stories yet"** with the line **"Upload your first story
   to get started"**.

### SS-6 — Loading fails
1. Ask the team to test with the stories service failing.
2. **Expected:** after about 3 seconds (the app retries first), a red message
   with the backend's text shows, and an error box with the same text and a
   **retry** button. If the backend sends no text, the box says **"Failed to
   load stories"** — in English, in every language (problem P-11). The
   empty-shop text (SS-5) must **not** show.
3. Load page 1, tap **Next**, and make page 2 fail.
4. **Expected (problem P-13):** the old page 1 grid stays under the error box.
   **Retry** loads page 1 again, not page 2.

### SS-7 — Open one story
1. Tap a story card.
2. **Expected:** a black screen opens with the full photo, or the video with
   normal play controls. Under it: the link, **"Linked to product"** with the
   slug, the viewers count and the date.
3. Tap the **X**, then open one again and tap outside the picture.
4. **Expected:** it closes both times.

### SS-8 — Paging
1. Open a shop with more than 40 stories (20 stories per page).
2. **Expected:** **Previous** and **Next** buttons with **"Page 1 of 3"**
   between them. If the backend does not send the page count, the text is only
   **"Page 1"**.
3. Tap **Next**, then **Previous**.
4. **Expected:** the grid changes each time. **Previous** is disabled on page 1
   and **Next** is disabled on the last page.
5. Open a shop with 20 stories or fewer.
6. **Expected:** no paging buttons at all.

### SS-9 — The Add Story button follows the permission
1. Sign in with a user who has `READ_STORY` but **not** `CREATE_STORY` (and no
   `SUPER_ADMIN`).
2. **Expected:** there is no **Add Story** button.
3. Sign in with a user who has `CREATE_STORY`.
4. **Expected:** the **Add Story** button is at the top right of the tab.

### SS-10 — The upload window
1. Tap **Add Story**.
2. **Expected:** a window called **Add Story** opens with an empty tall preview
   box (**"No media selected"**, **"Photo or video, up to 10MB"**), an **Upload
   Photo/Video** button, a **Link** field, a **Link to Product** button, and
   **Cancel** / **Share Story**. **Share Story** is disabled. Tapping the empty
   preview box also opens the file picker. Tapping outside the window does
   **not** close it.

### SS-11 — Add a photo story
1. Tap **Upload Photo/Video**, pick a photo.
2. **Expected:** the **Crop Image** screen opens. Tap **Save**.
3. **Expected:** the photo fills the preview box and the button under it changes
   to **Change media**.
4. Tap **Share Story**.
5. **Expected:** while it uploads, the whole window ignores taps (Cancel and X
   too). Then the message **"Story uploaded successfully"** shows, the window
   closes, and the grid reloads from the **first** page.

### SS-12 — Add a video story
1. Pick a video shorter than 1 minute and tap **Share Story**.
2. **Expected:** it uploads, the success message shows, and the new card carries
   the **Video** label.

### SS-13 — Video longer than one minute
1. Try to pick a video longer than 60 seconds.
2. **Expected:** the message **"1 minutes video only"** appears at once and
   nothing goes into the preview.

### SS-14 — File bigger than 10 MB
1. Try to pick a file over 10.5 MB.
2. **Expected:** the message **"File size should not exceed 10 MB"** and nothing
   is added.

### SS-15 — Remove the chosen media
1. Choose a photo, then tap the small **X** on the preview.
2. **Expected:** the preview is empty again and **Share Story** is disabled.

### SS-16 — Wrong link
1. Choose a photo and type `example` in the **Link** field.
2. **Expected:** a red message under the field and **Share Story** is disabled.
3. Change it to `example.com`.
4. **Expected:** the message goes and **Share Story** works. The link field
   removes the same characters as the home flow (AS-24).

### SS-17 — Link a product
1. Tap **Link to Product**.
2. **Expected:** a **Select Product** window opens. It shows a loading state
   first, then the shop's products.
3. Scroll down and tap **Load more** if it is there.
4. **Expected:** more products are added.
5. Tap a product.
6. **Expected:** the window closes and the product's picture and name show in
   the **Linked product** area, with **Change** and **Remove** under it. A
   product with no name shows **"Product"** here, in English (problem P-11).
7. Tap **Change**, pick another product; then tap **Remove**.
8. **Expected:** **Change** opens the list again from the first page and swaps
   the product. **Remove** clears it and the **Link to Product** button comes
   back.

### SS-18 — A shop with no products
1. Open **Link to Product** for a shop that has no products.
2. **Expected:** the window says **"No products found"**. The same text shows
   when the product list **fails** to load — there is no separate error
   message.

### SS-19 — The linked product is saved
1. Share a story with a linked product.
2. **Expected:** the new card in the grid shows the product slug in green under
   the picture, and the story viewer shows **"Linked to product"** with it.

### SS-20 — Upload fails
1. Turn the network off (or ask the team to break the upload) and tap **Share
   Story**.
2. **Expected:** the message **"Upload Failed Try Again"** shows, the window
   stays open, and nothing is added to the grid. If the backend refused the
   save with its own message, that message shows too (two red messages).

### SS-21 — Cancel the upload
1. Open **Add Story**, choose a photo and a link, then tap **Cancel**.
2. **Expected:** the window closes, nothing is added to the grid.

### SS-22 — The Delete button follows the permission
1. Sign in with a user without `DELETE_STORY` (and no `SUPER_ADMIN`).
2. **Expected:** the cards have no **Delete** button.
3. Sign in with a user who has it.
4. **Expected:** every card has a red **Delete** button.

### SS-23 — Delete a seller story
1. Tap **Delete** on a card.
2. **Expected:** a box titled **Delete Story** asks **"Are you sure you want to
   delete this story? This action cannot be undone."** with **Cancel** and
   **Delete**. The box has no X, and tapping outside it does not close it.
3. Tap **Cancel**.
4. **Expected:** the box closes and the card stays.
5. Tap **Delete** again and confirm.
6. **Expected (problem P-12):** the card disappears from the grid. There is
   **no** success message, and the number in the badge does **not** go down
   until you reload. If you delete every card on a page, **"No stories yet"**
   shows while the paging buttons are still there.

### SS-24 — Delete fails
1. Ask the team to test with the stories service failing.
2. **Expected:** an error message appears (the backend's message, or **"Failed
   to delete story"** in English in every language — problem P-11) and the card
   stays in the grid. The confirm box **stays open** (problem P-12).

### SS-25 — Direct link to the tab
1. Open the Stories tab, copy the address (it ends with `?tab=stories`), open a
   new browser tab and paste it.
2. **Expected:** six grey rows may show for a moment, then the Seller Dashboard
   opens **on the Stories tab**, not on the dashboard home.
3. Change `stories` in the address to a wrong word (for example `storiez`).
4. **Expected:** the dashboard home opens, with no error.
5. Open the `?tab=stories` address with a user who has no `READ_STORY`.
6. **Expected:** **"Access Denied"** with **"You don't have permission to view
   stories"**. It does not open the dashboard home.



