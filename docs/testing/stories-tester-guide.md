# Stories — Tester Guide

A list of test cases for **Stories**. No coding needed. Follow the steps and
compare what you see with the **Expected** line.

**Checked against the code:** branch `development`, 2026-10-20.

Stories appear in four places:

1. **Home stories bar** — the row of story cards on the home page and on
   category pages.
2. **Product stories** — the "Product Story" row on a product page.
3. **Chat window → Stories tab** — a list of people with stories inside the
   chat window.
4. **Seller shop stories** — the **Stories** tab inside the Seller Dashboard.

Places 1, 2 and 3 open the **same full-screen viewer**. Test the viewer once
(section 3) and then only check that each place opens it.

---

## 1. Rules that apply in the whole flow

Read these first. Most cases below check one of these rules.

**Who can add a story**

- The **"+"** card in the home stories bar appears **only** when the account
  profile is marked as allowed to upload stories. The app only reads that flag.
  The rule that decides who gets it lives in the backend — **only customers which had at leaast one deleivered order**
  which accounts get it.
- In the Seller Dashboard, the **Stories** tab and its buttons follow three
  permissions:
  - `READ_STORY` → the **Stories** menu item and the tab.
  - `CREATE_STORY` → the **Add Story** button.
  - `DELETE_STORY` → the **Delete** button on each card.

**Media rules (same in the home flow and the seller shop flow)**

- Max file size: **10 MB**. Message: **"File size should not exceed 10 MB"**.
- Video max length: **1 minute**. Message: **"1 minutes video only"**.
  - Home flow: a video of **60 seconds or more** is refused.
  - Seller flow: a video of **more than 60 seconds** is refused.
- The file picker offers only: **jpg, jpeg, png, gif, mp4, mov, 3gp, avi**.
- **SVG images are refused** with **"SVG Images Not Allowed"**.
- Every photo goes through a **Crop Image** screen before it can be shared.
  Videos do not.
- The in-app camera records in the format the browser supports: **WebM** where
  the browser can, otherwise **MP4** (Safari before 18.4). A browser that cannot
  record at all shows **"Not Supported"**.

**Link rules**

- The link field is optional.
- A link without `http://` or `https://` is saved with `https://` added.
- A link with no dot in it (for example `example`) is refused with the message
  **"Please enter a valid URL (e.g., example.com or www.example.com)"**.
- While the link is wrong, the **Share Story** button stays disabled.
- Any website is allowed. The app does not check where the link goes.

**Viewing rules**

- Each photo shows for **5 seconds**. A video shows for its own length.
- A person with **no stories** never appears in the bar.
- A person with **no name** is shown as **"Unknown"** (translated). The phone
  number is **never** shown as a name — if you see one, report it.
- Story views are counted **only when you are signed in**, and **once per
  story**. As a guest, opening a story does not raise the view count.
- The **report** flag appears only when you are signed in, and only on **other
  people's** stories.
- The **delete** (bin) icon appears only on **your own** stories.
- If the stories service is down, the bar shows **no cards** (only the "+" card
  for an allowed account). There is no error message, and the rest of the page
  keeps working.

---

## 2. Home stories bar

### HS-1 — The bar loads
1. Open the home page.
2. **Expected:** a "+" placeholder and nine grey cards appear first, then the
   real story cards replace them.

### HS-2 — The bar is on category pages too
1. Open the home page and pick any main category.
2. **Expected:** the same stories bar appears on the category page.

### HS-3 — Card contents
1. Look at any story card.
2. **Expected:** a picture, the person's name at the bottom, and a small round
   avatar at the top corner. If the person has no name, the card shows
   **"Unknown"**. A phone number must **never** appear as the name.

### HS-4 — The ring changes after you watch
1. Open a person with one story, watch it, and close the viewer.
2. **Expected:** that person's avatar circle turns white without a page reload.

### HS-5 — The card picture
1. Open one story of a person who has several, then close the viewer.
2. **Expected:** the card now shows the first story you have **not** seen.
   Your **own** card always shows your **newest** story.

### HS-6 — More people load while scrolling
1. Scroll the bar sideways to the end.
2. **Expected:** a small loading circle appears and more people are added.
   Repeat until no more are added.

### HS-7 — Signed out
1. Sign out and open the home page.
2. **Expected:** the bar still loads and the stories open. There is no "+" card.

### HS-8 — Arabic and Kurdish direction
1. Switch the language to Arabic (or Kurdish).
2. **Expected:** the bar starts from the **right** side and scrolls to the left.


---

## 3. Story viewer (home, product page and chat Stories tab)

### SV-1 — Open a story
1. Tap any story card.
2. **Expected:** a full black screen opens with the story, thin progress bars at
   the top (one bar per story of that person), the person's photo, name and the
   story time at the top left, and an **X** at the top right.

### SV-2 — The story time label
1. Open a story added today, then one added earlier.
2. **Expected:** today shows **"Today | 14:03:27"** (hours, minutes and
   seconds), the day before shows **"Yesterday | 14:03:27"**, and an older one
   shows **"05/03/2025 | 14:03:27"**. The words **Today** and **Yesterday** are
   translated.

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
5. **Expected:** it moves back to the story before.

### SV-5 — Stories play by themselves
1. Open a photo story and do not touch the screen.
2. **Expected:** the top bar fills in about 5 seconds, then the next story
   starts on its own.
3. Open a video story.
4. **Expected:** the video plays by itself and moves on when it finishes.

### SV-6 — Move between people
1. Open a story and swipe **left** or **right**.
2. **Expected:** the screen turns like a cube and the next (or previous)
   person's stories open, starting at **their** first unseen story (not at the
   position of the person before).

### SV-7 — End of the last person
1. Keep tapping the right half until the last story of the **last** person
   finishes.
2. **Expected:** the viewer closes and you are back on the page.

### SV-8 — Close by swiping down
1. Open a story and pull it **down** with your finger (or mouse).
2. **Expected:** the screen follows your finger. Pull far enough and the viewer
   closes. Pull a little and let go — it snaps back and keeps playing.

### SV-9 — Close with the X
1. Open a story and tap the **X** at the top right.
2. **Expected:** the viewer closes.

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

### SV-14 — Leave the tab open in the background
1. Open a person with several stories and switch to another browser tab for a
   minute.
2. **Expected:** the stories keep moving on. When you come back you may be on a
   later story, or the viewer may have closed.

### SV-15 — Keyboard
1. Open a story and press **Tab**, then **Enter** on the X.
2. **Expected:** the viewer closes. The bin and flag icons work the same way.
3. Press the **arrow keys** and **Esc**.
4. **Expected:** nothing happens. The viewer has no arrow-key or Esc control.

### SV-16 — Media that will not load
1. Open a story whose picture or video is missing or broken (ask the team for
   one).
2. **Expected:** the loading circle stays and the story does not move on.
   Report what you see.

### SV-17 — A view is counted once
1. Signed in, open another person's story and watch it. Tap back to it with
   the left half and watch it again.
2. Ask the team (or the shop owner, in the Seller Dashboard) for the viewers
   count of that story before and after.
3. **Expected:** the count went up by **1**, not by 2.

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

### AS-3 — Account with no phone
1. Sign in with an account that has no phone number and tap **"+"**.
2. **Expected:** the sign-in screen opens instead of the Add Story screen.

### AS-4 — Account with no name
1. Sign in with an account that has no name (or a temporary guest name) and tap
   **"+"**.
2. **Expected:** the "enter your name" screen opens first, not the Add Story
   screen.

### AS-5 — Stories account needs a phone check
1. Use an account whose stories access needs a new phone check, and tap **"+"**.
2. **Expected:** the phone check screen opens instead of the Add Story screen.

### AS-6 — Open the Add Story screen
1. Sign in with a complete account and tap **"+"**.
2. **Expected:** a full screen called **Add Story** opens with a preview area on
   one side and **Take Photo**, **Upload Photo/Video** and a link field on the
   other. The empty preview says **"No media selected"**. The page behind it
   cannot be scrolled.

### AS-7 — Pick a photo from the device
1. In the Add Story screen tap **Upload Photo/Video** and pick a photo.
2. **Expected:** the **Crop Image** screen opens.
3. Turn the photo with the two rotate buttons, drag to choose the area, tap
   **Save**.
4. **Expected:** the cropped photo shows in the preview and a **Share Story**
   button appears.

### AS-8 — Share a photo story
1. After AS-7, tap **Share Story**.
2. **Expected:** a loading circle shows, then the message **"Story Uploaded"**,
   the screen closes, and your story appears in the bar. The "+" card shows a
   spinner for a few seconds while the bar reloads.

### AS-9 — Remove the chosen photo
1. Choose a photo so the preview shows.
2. Tap the small **X** on the preview.
3. **Expected:** the preview is cleared, the **Share Story** button disappears,
   and you can pick a new file.

### AS-10 — File bigger than 10 MB
1. Tap **Upload Photo/Video** and pick a file over 10 MB.
2. **Expected:** the message **"File size should not exceed 10 MB"** appears and
   nothing is added to the preview.

### AS-11 — Other file types
1. Open the file picker and look at the file types it offers.
2. **Expected:** only jpg, jpeg, png, gif, mp4, mov, 3gp and avi can be chosen.
3. If your device lets you force an **SVG** file through, pick one.
4. **Expected:** the message **"SVG Images Not Allowed"** and nothing is added.

### AS-12 — Video of one minute or longer
1. Pick a video that is **60 seconds or longer**.
2. **Expected:** the video shows in the preview.
3. Tap **Share Story**.
4. **Expected:** the message **"1 minutes video only"** appears, the preview is
   cleared, and the video is **not** uploaded.

### AS-13 — Share a short video
1. Pick a video shorter than 1 minute and tap **Share Story**.
2. **Expected:** it uploads, the message **"Story Uploaded"** appears, the
   screen closes, and the video story is in the bar.

### AS-14 — Wrong link
1. Choose any photo.
2. In the link field type `example` (no dot).
3. **Expected:** the red message **"Please enter a valid URL (e.g.,
   example.com or www.example.com)"** appears under the field and **Share
   Story** is disabled.
4. Change it to `example.com`.
5. **Expected:** the message goes and **Share Story** works again.

### AS-15 — Link is saved with the story
1. Add a story with the link `example.com`.
2. Open your story in the viewer.
3. **Expected:** the **View More** button is there and opens
   `https://example.com`.

### AS-16 — Upload fails
1. Turn the network off, then tap **Share Story**.
2. **Expected:** the message **"Upload Failed Try Again"** appears, the Add
   Story screen stays open with your photo, and no story is added.
3. If you see **"Error Uploading Story"** instead, report it with the exact
   steps — that message means an unexpected error, not a network error.

### AS-17 — Take a photo with the camera
1. In the Add Story screen tap **Take Photo**.
2. **Expected:** a camera screen called **Create Story** opens with **Photo**
   and **Video** tabs.
3. Stay on **Photo**, tap the big round button.
4. **Expected:** the title becomes **Preview Photo** and the picture is shown.
5. Tap the blue share button.
6. **Expected:** the camera closes and the **Crop Image** screen opens with your
   picture.

### AS-18 — Record a video with the camera
1. Tap **Take Photo**, then the **Video** tab, then the red round button.
2. **Expected:** a red timer runs at the top of the camera.
3. Tap the button again to stop.
4. **Expected:** the title becomes **Preview Video** and your video plays.
5. Tap the blue share button.
6. **Expected:** the camera closes and the video is in the Add Story preview.
   There is no crop screen for video.
7. Tap **Share Story**.
8. **Expected:** **"Story Uploaded"**, and the video story plays in the viewer.
   Do this on **Chrome**, on **Safari 18.4 or newer**, and on an **older
   Safari** (before 18.4). The older Safari records MP4, the others WebM. The
   story must play in all three.

### AS-19 — Recording stops by itself
1. Start recording and do not stop.
2. **Expected:** the recording stops on its own at **59 seconds** and the
   preview opens.

### AS-20 — Flip the camera
1. In the camera screen tap the flip button on the left.
2. **Expected:** it switches between the front and the back camera. On a device
   with only one camera the button is greyed out.

### AS-21 — No microphone
1. Open the camera, go to the **Video** tab on a device with no microphone, or
   refuse the microphone permission.
2. **Expected:** a red warning shows: **"Microphone not detected or permission
   denied"**.

### AS-22 — Camera permission blocked
1. Block the camera permission in the browser, then tap **Take Photo**.
2. **Expected:** the message **"Please enable camera permissions to use camera
   features"** appears and the camera does not open.

### AS-23 — Discard from the camera
1. Take a photo, then tap the back arrow (top left) or the X (bottom right).
2. **Expected:** the photo is dropped and you are back at the live camera.
3. Tap it again.
4. **Expected:** the camera closes and you are back in the Add Story screen.

### AS-24 — Close the Add Story screen
1. Choose a photo and type a link, then tap the **X** at the top.
2. **Expected:** the screen closes, nothing is uploaded, and when you open it
   again the preview and the link field are empty.

### AS-25 — The bar keeps the people you already loaded
1. Scroll the bar to the end until a second page of people has loaded (HS-6).
   Note the name of a person from the end of the bar.
2. Add a story (AS-8).
3. **Expected:** after the bar reloads, your new story is in your card **and**
   the person you noted is still in the bar. Nobody disappears.

### AS-26 — Browser that cannot record video
1. On a browser with no video recording (ask the team which one to use), open
   the camera, go to **Video** and tap the red button.
2. **Expected:** the message **"Not Supported"**. The red timer does **not**
   start.

---

## 5. Delete your own story

### DL-1 — The delete icon is only on your stories
1. Open **your own** story.
2. **Expected:** a bin icon is at the top right.
3. Open **someone else's** story.
4. **Expected:** there is no bin icon.

### DL-2 — Cancel the delete
1. Open your story, tap the bin icon.
2. **Expected:** a box titled **Delete Story** asks **"Are you sure you want to
   delete this story?"** with **Cancel** and **Confirm**. The story behind it
   stops and is hidden.
3. Tap **Cancel**.
4. **Expected:** the box closes and the story starts playing again from the
   same point.

### DL-3 — Delete one story out of several
1. Open your own account which has 2 or more stories.
2. Tap the bin and tap **Confirm**.
3. **Expected:** the message **"Story deleted successfully."** appears, the
   deleted story is gone, and the viewer stays on your remaining stories.
4. Close the viewer.
5. **Expected:** your card is still in the bar, with one story fewer.

### DL-4 — Delete your only story
1. Open your account when it has exactly one story and delete it.
2. **Expected:** the success message appears, the viewer moves to the next
   person, and your card is gone from the bar.

### DL-5 — Delete fails
1. Ask the team to test with the stories service failing, then delete a story.
2. **Expected:** an error message appears (the backend's own message, or
   **"Failed to delete story."**) and the story stays. There is no success
   message.

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
2. **Expected:** a sheet called **Report Story** slides up from the bottom with
   6 reasons, a details box and the buttons **Cancel** and **Submit Report**.
   The story behind it stops and is hidden.

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
2. **Expected:** **Other** becomes selected on its own.
3. Delete everything you typed.
4. **Expected:** **Other** is no longer selected.

### RP-8 — Details limit
1. Type a very long text in the details box.
2. **Expected:** the counter under the box counts up and stops at **500/500**.
   No more letters can be typed.

### RP-9 — Send a report
1. Choose a reason and tap **Submit Report**.
2. **Expected:** a loading circle shows, then the message **"Story reported
   successfully."**, the sheet closes and the story plays again.

### RP-10 — Report fails
1. Ask the team to test with the stories service failing, then send a report.
2. **Expected:** an error message appears (for example **"Failed to report
   story."**), the sheet stays open, and your reasons and details are kept.

### RP-11 — Close the sheet
1. Open the report sheet and tap **Cancel**.
2. **Expected:** it closes with nothing sent.
3. Open it again and tap the **X**, then open it again and tap outside the
   sheet.
4. **Expected:** it closes both times with nothing sent.

---

## 7. Product stories (product page)

### PS-1 — The section only shows when there are stories
1. Open a product that has stories.
2. **Expected:** a row called **Product Story** appears under the product, with
   story cards.
3. Open a product with no stories.
4. **Expected:** there is no **Product Story** row at all.

### PS-2 — Border colour
1. Look at the product story cards.
2. **Expected:** a card with a story you did not watch has a **purple** border;
   the others have a **grey** border.

### PS-3 — Open a product story
1. Tap a card in the **Product Story** row.
2. **Expected:** the same full screen viewer opens. Tapping, swiping, closing,
   delete and report all work as in sections 3, 5 and 6.
3. Close the viewer.
4. **Expected:** you are back on the product page, and the home stories bar
   (go back to the home page) still shows its own list.

### PS-4 — More product stories load
1. Open a product that has more than one page of stories (ask the team for
   one) and scroll the row to the end.
2. **Expected:** a loading circle shows and more cards are added. Repeat until
   no more are added. The loading circle must **not** show when the product
   has only one page.

### PS-5 — A product story with a link and a product
1. Open a product story that carries both.
2. **Expected:** **View More** and **View Product** both show at the bottom, and
   **View Product** may open a different product from the page you started on.

### PS-6 — Arabic and Kurdish direction
1. Switch to Arabic (or Kurdish) and open the same product.
2. **Expected:** the story row starts from the **right**.

### PS-7 — Signed in for a long time
1. Sign in, open a product with stories, wait **2 minutes** on the page, then
   open another product with stories.
2. **Expected:** the **Product Story** row is still there. (The row is a public
   read; an expired token must not hide it.)

---

## 8. Chat window → Stories tab

Open the chat window (the chat button in the app). It has three tabs: **Chats**,
**Calls** and **Stories**. You must be signed in to use the chat window.

### CS-1 — The tab loads
1. Tap the **Stories** tab.
2. **Expected:** five grey placeholder rows show first, then a list of people:
   a small round picture and the person's name on each row.

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
   until no more are added.

### CS-6 — Name and "Unknown"
1. Find a person with no name (ask the team for one).
2. **Expected:** the row shows **"Unknown"**, never a phone number.

### CS-7 — Signed in for a long time
1. Open the Stories tab, wait **2 minutes**, then scroll to load more people.
2. **Expected:** more people load as normal. The list does not go empty and
   nobody disappears.

### CS-8 — The tab reloads the list
1. Scroll the home bar to the end so that a second page of people is loaded
   (HS-6). Note a person from the end.
2. Open the chat window and the **Stories** tab, then close the chat window.
3. **Expected (known limit, see section 10):** the home bar may now show only
   the first page; the person you noted comes back once you scroll the bar to
   the end again. Report it only if the person never comes back.

---

## 9. Seller shop stories (Seller Dashboard → Stories tab)

### SS-1 — Who sees the tab
1. Sign in with a user who has **no** `READ_STORY` permission for the shop and
   open the Seller Dashboard menu.
2. **Expected:** there is no **Stories** item in the menu.
3. Sign in with a user who has it.
4. **Expected:** **Stories** is in the menu, with the note "Share photo & video
   stories".

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
2. **Expected:** an error box with the backend's message (or **"Failed to load
   stories"**) and a **retry** button. Tapping retry loads the same page again.
   The empty-shop text (SS-5) must **not** show in this case.

### SS-7 — Open one story
1. Tap a story card.
2. **Expected:** a black screen opens with the full photo, or the video with
   normal play controls. Under it: the link, **"Linked to product"** with the
   slug, the viewers count and the date.
3. Tap the **X**, then open one again and tap outside the picture.
4. **Expected:** it closes both times.

### SS-8 — Paging
1. Open a shop with more than one page of stories.
2. **Expected:** **Previous** and **Next** buttons with **"Page 1 of 3"**
   between them.
3. Tap **Next**, then **Previous**.
4. **Expected:** the grid changes each time. **Previous** is disabled on page 1
   and **Next** is disabled on the last page.
5. Open a shop with one page of stories.
6. **Expected:** no paging buttons at all.

### SS-9 — The Add Story button follows the permission
1. Sign in with a user who has `READ_STORY` but **not** `CREATE_STORY`.
2. **Expected:** there is no **Add Story** button.
3. Sign in with a user who has `CREATE_STORY`.
4. **Expected:** the **Add Story** button is at the top right of the tab.

### SS-10 — The upload window
1. Tap **Add Story**.
2. **Expected:** a window called **Add Story** opens with an empty tall preview
   box (**"No media selected"**, **"Photo or video, up to 10MB"**), an **Upload
   Photo/Video** button, a **Link** field, a **Link to Product** button, and
   **Cancel** / **Share Story**. **Share Story** is disabled.

### SS-11 — Add a photo story
1. Tap **Upload Photo/Video**, pick a photo.
2. **Expected:** the **Crop Image** screen opens. Tap **Save**.
3. **Expected:** the photo fills the preview box and the button under it changes
   to **Change media**.
4. Tap **Share Story**.
5. **Expected:** the message **"Story uploaded successfully"**, the window
   closes, and the grid reloads from the **first** page.

### SS-12 — Add a video story
1. Pick a video shorter than 1 minute and tap **Share Story**.
2. **Expected:** it uploads, the success message shows, and the new card carries
   the **Video** label.

### SS-13 — Video longer than one minute
1. Try to pick a video longer than 1 minute.
2. **Expected:** the message **"1 minutes video only"** appears at once and
   nothing goes into the preview.

### SS-14 — File bigger than 10 MB
1. Try to pick a file over 10 MB.
2. **Expected:** the message **"File size should not exceed 10 MB"** and nothing
   is added.

### SS-15 — Remove the chosen media
1. Choose a photo, then tap the small **X** on the preview.
2. **Expected:** the preview is empty again and **Share Story** is disabled.

### SS-16 — Wrong link
1. Choose a photo and type `example` in the **Link** field.
2. **Expected:** a red message under the field and **Share Story** is disabled.
3. Change it to `example.com`.
4. **Expected:** the message goes and **Share Story** works.

### SS-17 — Link a product
1. Tap **Link to Product**.
2. **Expected:** a **Select Product** window opens. It shows a loading state
   first, then the shop's products.
3. Scroll down and tap **Load more** if it is there.
4. **Expected:** more products are added.
5. Tap a product.
6. **Expected:** the window closes and the product's picture and name show in
   the **Linked product** area, with **Change** and **Remove** under it.
7. Tap **Change**, pick another product; then tap **Remove**.
8. **Expected:** **Change** swaps the product, **Remove** clears it and the
   **Link to Product** button comes back.

### SS-18 — A shop with no products
1. Open **Link to Product** for a shop that has no products.
2. **Expected:** the window says **"No products found"**.

### SS-19 — The linked product is saved
1. Share a story with a linked product.
2. **Expected:** the new card in the grid shows the product slug in green under
   the picture, and the story viewer shows **"Linked to product"** with it.
3. Open the home page.
4. **Expected:** the shop's story is in the home bar, and in the viewer it has
   a **View Product** button that opens that product (SV-11).

### SS-20 — Upload fails
1. Turn the network off (or ask the team to break the upload) and tap **Share
   Story**.
2. **Expected:** the message **"Upload Failed Try Again"** shows, the window
   stays open, and nothing is added to the grid.

### SS-21 — Cancel the upload
1. Open **Add Story**, choose a photo and a link, then tap **Cancel**.
2. **Expected:** the window closes, nothing is added to the grid.

### SS-22 — The Delete button follows the permission
1. Sign in with a user without `DELETE_STORY`.
2. **Expected:** the cards have no **Delete** button.
3. Sign in with a user who has it.
4. **Expected:** every card has a red **Delete** button.

### SS-23 — Delete a seller story
1. Tap **Delete** on a card.
2. **Expected:** a box titled **Delete Story** asks **"Are you sure you want to
   delete this story? This action cannot be undone."** with **Cancel** and
   **Delete**.
3. Tap **Cancel**.
4. **Expected:** the box closes and the card stays.
5. Tap **Delete** again and confirm.
6. **Expected:** the card disappears from the grid.

### SS-24 — Delete fails
1. Ask the team to test with the stories service failing.
2. **Expected:** an error message appears (the backend's message, or **"Failed
   to delete story"**) and the card stays in the grid.

### SS-25 — Direct link to the tab
1. Open the Stories tab, copy the address (it ends with `?tab=stories`), open a
   new browser tab and paste it.
2. **Expected:** the Seller Dashboard opens **on the Stories tab** straight
   away, not on the dashboard home.
3. Change `stories` in the address to a wrong word (for example `storiez`).
4. **Expected:** the dashboard home opens, with no error.

### SS-26 — Arabic and Kurdish direction
1. Switch to Arabic (or Kurdish) and open the Stories tab.
2. **Expected:** the tab is laid out right-to-left: the title and badge sit on
   the right and the **Add Story** button on the left.
3. Open **Add Story**, then **Link to Product**, then (with `DELETE_STORY`) the
   **Delete** box on a card.
4. **Expected:** all three windows are laid out right-to-left too.

---

## 10. Known limits — do not report these as new bugs

The team already knows these. Note them in your report only if they look
**worse** than described here.

- **Guest views are not counted.** A guest has no stories account, so watching
  as a guest only greys the ring.
- **A shopper cannot see the view count of their own story.** Only the Seller
  Dashboard shows a viewers count.
- **Video sound on iPhone.** A video story plays **with sound**. If the browser
  blocks autoplay with sound, the video may stay still while the top bar runs
  on. **This still needs a check on a real iPhone** (iOS 17 and iOS 18). If you
  have one, test SV-5 and AS-13 on it and report the result either way.
- **Picking a video from the gallery on iPhone** may end with **"Upload Failed
  Try Again"** after about 10 seconds, because the browser gives the app no
  video data to check the length. Also needs a real iPhone check — report what
  you see.
- **The chat Stories tab reloads the shared list** (CS-8). People from the
  later pages of the home bar come back when you scroll the bar again.
- **Screen-reader labels are English only** (the hidden names of the X, bin and
  flag buttons). They are not part of the language check in section 11.
- **Any link is allowed** on a story. The only control is the report button.

---

## 11. Language check (do this for every screen above)

1. Switch the app language to **Arabic**, **Turkish** and **Kurdish**.
2. **Expected:** every button, title, message and placeholder in the stories
   screens is translated, including **"Unknown"**, **"Today"**, **"Yesterday"**
   and **"Not Supported"**. Report any English word left on screen.

---

## 12. What to write in a bug report

- Which case number failed (for example **AS-14**).
- The account you used and whether it is a seller.
- The language and the country you had selected.
- The device, the browser and its version (for video cases, say whether Safari
  is older or newer than 18.4).
- What you expected and what happened.
- A screenshot or a screen recording, and the exact message text if one showed.
