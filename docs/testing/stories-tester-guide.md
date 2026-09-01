# Stories — Tester Guide

A list of test cases for **Stories**. No coding needed. Follow the steps and
compare what you see with the **Expected** line.

Stories appear in three places:

1. **Home stories bar** — the row of story cards on the home page and on
   category pages.
2. **Product stories** — the "Product Story" row on a product page.
3. **Seller shop stories** — the **Stories** tab inside the Seller Dashboard.

---

## 1. Rules that apply in the whole flow

Read these first. Most cases below check one of these rules.

**Who can add a story**

- The **"+"** card in the home stories bar appears **only** if the account is
  allowed to upload stories (have one deleviered order at least). If the account is not allowed, there is no "+"
  card at all.
- In the Seller Dashboard, the **Stories** tab and its buttons follow
  permissions:
  - read stories → the tab is visible.
  - create story → the **Add Story** button is visible.
  - delete story → the **Delete** button on each card is visible.
  - Without the read permission, the **Stories** menu item does not appear.

**Media rules (same in the home flow and the seller shop flow)**

- Max file size: **10 MB**.
- Video max length: **1 minute**.
- Allowed files: **jpg, jpeg, png, gif, mp4, mov, 3gp, avi**.
- **SVG images are refused.**
- Every photo goes through a **crop screen** before it can be shared. Videos
  do not.

**Link rules**

- The link field is optional.
- A link without `http://` or `https://` is saved with `https://` added.
- A link with no dot in it (for example `example`) is refused with a message
  under the field.
- While the link is wrong, the **Share Story** button stays disabled.

**Viewing rules**

- Each photo shows for **5 seconds**. A video shows for its own length.
- A person with **no stories** never appears in the bar.
- Story views are counted **only for signed-in users**. As a guest, opening a
  story does not raise the view count.
- The **report** flag appears only when you are signed in, and only on **other
  people's** stories.
- The **delete** icon appears only on **your own** stories.

---

## 2. Home stories bar

### HS-1 — The bar loads
1. Open the home page.
2. **Expected:** grey placeholder cards appear first, then the real story cards
   replace them.

### HS-2 — The bar is on category pages too
1. Open the home page and pick any main category.
2. **Expected:** the same stories bar appears on the category page.

### HS-3 — Card contents
1. Look at any story card.
2. **Expected:** a picture, the person's name at the bottom, and a small round
   avatar with a ring at the top corner. If the person has no name, the phone
   number is shown; if there is neither, it shows "Unknown".

### HS-4 — More people load while scrolling
1. Scroll the bar sideways to the end.
2. **Expected:** a small loading circle appears and more people are added to the
   bar. Repeat until no more are added.

### HS-5 — Arabic and Kurdish direction
1. Switch the language to Arabic (or Kurdish).
2. **Expected:** the bar starts from the **right** side and scrolls to the left.

### HS-6 — Stories service is down
1. Ask the team to test with the stories service switched off (or test when it
   is down).
2. **Expected:** the grey placeholder cards stay on screen, the rest of the home
   page works normally, and **no error message pops up**. This is on purpose.

---

## 3. Story viewer (home and product pages)

### SV-1 — Open a story
1. Tap any story card.
2. **Expected:** a full black screen opens with the story, thin progress bars at
   the top (one bar per story of that person), and the person's name, photo and
   the story time at the top left.

### SV-2 — Which story opens first
1. Tap **another person's** card.
2. **Expected:** it starts from their **first** story.
3. Tap **your own** card.
4. **Expected:** it starts from your **newest** story.

### SV-3 — Move forward and back by tapping
1. Open a person with more than one story.
2. Tap the **right half** of the screen.
3. **Expected:** it moves to the next story.
4. Tap the **left half**.
5. **Expected:** it moves back to the story before.

### SV-4 — Stories play by themselves
1. Open a photo story and do not touch the screen.
2. **Expected:** the top bar fills in about 5 seconds, then the next story
   starts on its own.
3. Open a video story.
4. **Expected:** the video plays by itself and moves on when it finishes.

### SV-5 — Move between people
1. Open a story and swipe **left** or **right**.
2. **Expected:** the screen turns like a cube and the next (or previous)
   person's stories open.

### SV-6 — End of the last person
1. Keep tapping the right half until the last story of the **last** person
   finishes.
2. **Expected:** the viewer closes and you are back on the page.

### SV-7 — Start of the first person
1. Open the **first** person's **first** story and tap the left half.
2. **Expected:** nothing changes. You stay on the same story.

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

---

## 4. Add a story from the home bar

### AS-1 — The "+" card only for allowed accounts
1. Sign in with an account that is **not** allowed to upload stories.
2. **Expected:** there is no "+" card in the bar.
3. Sign in with an allowed account.
4. **Expected:** the "+" card is the first card in the bar.


### AS-2 — Account with no name
1. Sign in with an account that has no name (or a temporary guest name) and tap
   **"+"**.
2. **Expected:** the "enter your name" screen opens first, not the Add Story
   screen.

### AS-3 — Open the Add Story screen
1. Sign in with a complete account and tap **"+"**.
2. **Expected:** a full screen called **Add Story** opens with a preview area on
   one side and **Take Photo**, **Upload Photo/Video** and a link field on the
   other. The page behind it cannot be scrolled.

### AS-4 — Pick a photo from the device
1. In the Add Story screen tap **Upload Photo/Video** and pick a photo.
2. **Expected:** the **Crop Image** screen opens.
3. Turn the photo with the rotate buttons, drag to choose the area, tap **Save**.
4. **Expected:** the cropped photo shows in the preview and a **Share Story**
   button appears.

### AS-5 — Share a photo story
1. After AS-5, tap **Share Story**.
2. **Expected:** a loading circle shows, then the message **"Story Uploaded"**,
   the screen closes, and your story appears in the bar.

### AS-6 — Remove the chosen photo
1. Choose a photo so the preview shows.
2. Tap the small **X** on the preview.
3. **Expected:** the preview is cleared, the **Share Story** button disappears,
   and you can pick a new file.

### AS-7 — File bigger than 10 MB
1. Tap **Upload Photo/Video** and pick a file over 10 MB.
2. **Expected:** the message **"File size should not exceed 10 MB"** appears and
   nothing is added to the preview.

### AS-8 — SVG image
1. Tap **Upload Photo/Video** and try to pick an `.svg` file.
2. **Expected:** the message **"SVG Images Not Allowed"** appears and nothing is
   added.

### AS-9 — Video longer than one minute
1. Pick a video that is longer than 1 minute.
2. **Expected:** the video shows in the preview.
3. Tap **Share Story**.
4. **Expected:** the message **"1 minutes video only"** appears and the video is
   **not** uploaded.

### AS-10 — Share a short video
1. Pick a video shorter than 1 minute and tap **Share Story**.
2. **Expected:** it uploads, the message **"Story Uploaded"** appears, the
   screen closes, and the video story is in the bar.

### AS-11 — Wrong link
1. Choose any photo.
2. In the link field type `example` (no dot).
3. **Expected:** a red message appears under the field and **Share Story** is
   disabled.
4. Change it to `example.com`.
5. **Expected:** the message goes and **Share Story** works again.

### AS-12 — Link is saved with the story
1. Add a story with the link `example.com`.
2. Open your story in the viewer.
3. **Expected:** the **View More** button is there and opens `https://example.com`.

### AS-13 — Take a photo with the camera
1. In the Add Story screen tap **Take Photo**.
2. **Expected:** the camera screen opens with **Photo** and **Video** tabs.
3. Stay on **Photo**, tap the big round button.
4. **Expected:** the title becomes **Preview Photo** and the picture is shown.
5. Tap the blue share button.
6. **Expected:** the camera closes and the **Crop Image** screen opens with your
   picture.

### AS-14 — Record a video with the camera
1. Tap **Take Photo**, then the **Video** tab, then the red round button.
2. **Expected:** a red timer runs at the top of the camera.
3. Tap the button again to stop.
4. **Expected:** the title becomes **Preview Video** and your video plays.
5. Tap the blue share button.
6. **Expected:** the camera closes and the video is in the Add Story preview.

### AS-15 — Flip the camera
1. In the camera screen tap the flip button on the left.
2. **Expected:** it switches between the front and the back camera.

### AS-16 — No microphone
1. Open the camera, go to the **Video** tab on a device with no microphone, or
   refuse the microphone permission.
2. **Expected:** a red warning shows: **"Microphone not detected or permission
   denied"**.

### AS-17 — Camera permission blocked
1. Block the camera permission in the browser, then tap **Take Photo**.
2. **Expected:** the message **"Please enable camera permissions to use camera
   features"** appears and the camera does not open.

### AS-18 — Discard from the camera
1. Take a photo, then tap the back arrow (top left).
2. **Expected:** the photo is dropped and you are back at the live camera.
3. Tap the back arrow again.
4. **Expected:** the camera closes and you are back in the Add Story screen.

### AS-19 — Close the Add Story screen
1. Choose a photo and type a link, then tap the **X** at the top.
2. **Expected:** the screen closes, nothing is uploaded, and when you open it
   again the preview and the link field are empty.

---

## 5. Delete your own story

### DL-1 — The delete icon is only on your stories
1. Open **your own** story.
2. **Expected:** a bin icon is at the top right.
3. Open **someone else's** story.
4. **Expected:** there is no bin icon.

### DL-2 — Cancel the delete
1. Open your story, tap the bin icon.
2. **Expected:** a box asks **"Are you sure you want to delete this story?"**
   and the story stops playing behind it.
3. Tap **Cancel**.
4. **Expected:** the box closes and the story starts playing again.

### DL-3 — Delete one story out of several
1. Open your own account which has 2 or more stories.
2. Delete one of them and confirm.
3. **Expected:** the message **"Story deleted successfully."** appears, the
   deleted story is gone, and the viewer stays on your remaining stories.
4. Close the viewer.
5. **Expected:** your card is still in the bar, with one story fewer.

### DL-4 — Delete your only story
1. Open your account when it has exactly one story and delete it.
2. **Expected:** the success message appears, the viewer moves to the next
   person, and your card is gone from the bar.


---

## 6. Report someone else's story

### RP-1 — The report flag is only on other people's stories
1. Signed in, open **another person's** story.
2. **Expected:** a flag icon is at the top right.
3. Open **your own** story.
4. **Expected:** there is no flag icon, only the bin.
5. Sign out and open any story.
6. **Expected:** there is no flag icon.

### RP-2 — Open the report sheet
1. Tap the flag icon.
2. **Expected:** a sheet called **Report Story** slides up from the bottom with
   6 reasons, a details box and the buttons **Cancel** and **Submit Report**.
   The story behind it stops playing.

### RP-3 — Submit is blocked when nothing is chosen
1. Open the report sheet and do not choose anything.
2. **Expected:** **Submit Report** is greyed out and cannot be tapped.

### RP-4 — Choose more than one reason
1. Tap two or three reasons.
2. **Expected:** every one you tap gets a purple outline, and tapping it again
   removes it. Several can be chosen at the same time.

### RP-5 — "Other" jumps to the details box
1. Tap the reason **Other**.
2. **Expected:** the cursor moves into the details box straight away, and the
   label above it changes from **Details (optional)** to **Details**.

### RP-6 — Typing details chooses "Other" by itself
1. Without choosing any reason, type something in the details box.
2. **Expected:** **Other** becomes selected on its own.
3. Delete everything you typed.
4. **Expected:** **Other** is no longer selected.

### RP-7 — Details limit
1. Type a very long text in the details box.
2. **Expected:** the counter under the box counts up and stops at **500/500**.
   No more letters can be typed.

### RP-8 — Send a report
1. Choose a reason and tap **Submit Report**.
2. **Expected:** a loading circle shows, then the message **"Story reported
   successfully."**, the sheet closes and the story plays again.
.

### RP-9 — Close the sheet
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

### PS-4 — More product stories load
1. Open a product that has more than 10 stories and scroll the row to the end.
2. **Expected:** a loading circle shows and more cards are added.

### PS-5 — Arabic and Kurdish direction
1. Switch to Arabic (or Kurdish) and open the same product.
2. **Expected:** the story row starts from the **right**.

---

## 8. Seller shop stories (Seller Dashboard → Stories tab)

### SS-1 — Who sees the tab
1. Sign in with a user who has **no** read-stories permission for the shop and
   open the Seller Dashboard menu.
2. **Expected:** there is no **Stories** item in the menu.
3. Sign in with a user who has the read permission.
4. **Expected:** **Stories** is in the menu, with the note "Share photo & video
   stories".

### SS-2 — Open the tab
1. Tap **Stories**.
2. **Expected:** "Loading stories..." shows, then a grid of story cards, with
   the total number in a small round badge next to the title **Stories**.

### SS-3 — What a card shows
1. Look at any card.
2. **Expected:** the picture (or the video's first frame), a **Photo** or
   **Video** label at the top left, an eye icon with the number of viewers at
   the top right, the date at the bottom, and — when they exist — the link and
   the linked product name under the picture. Video cards also show a play
   circle.

### SS-4 — Empty shop
1. Open the Stories tab of a shop with no stories.
2. **Expected:** **"No stories yet"** with the line "Upload your first story to
   get started".

### SS-5 — Loading fails
1. Ask the team to test with the stories service failing.
2. **Expected:** an error box with a **retry** button. Tapping retry loads the
   same page again.

### SS-6 — Open one story
1. Tap a story card.
2. **Expected:** a black screen opens with the full photo, or the video with
   normal play controls, plus the link, the linked product, the viewers count
   and the date under it.
3. Tap the **X**, then open one again and tap outside the picture.
4. **Expected:** it closes both times.

### SS-7 — Paging
1. Open a shop with more than one page of stories.
2. **Expected:** **Previous** and **Next** buttons with the page number between
   them.
3. Tap **Next**, then **Previous**.
4. **Expected:** the grid changes each time. **Previous** is disabled on page 1
   and **Next** is disabled on the last page.

### SS-8 — The Add Story button follows the permission
1. Sign in with a user who can read but **not** create stories.
2. **Expected:** there is no **Add Story** button.
3. Sign in with a user who can create.
4. **Expected:** the **Add Story** button is at the top right of the tab.

### SS-9 — The upload window
1. Tap **Add Story**.
2. **Expected:** a window opens with an empty tall preview box ("No media
   selected", "Photo or video, up to 10MB"), an **Upload Photo/Video** button, a
   **Link** field, a **Link to Product** button, and **Cancel** / **Share
   Story**. **Share Story** is disabled.

### SS-10 — Add a photo story
1. Tap **Upload Photo/Video**, pick a photo.
2. **Expected:** the **Crop Image** screen opens. Tap **Save**.
3. **Expected:** the photo fills the preview box and the button under it changes
   to **Change media**.
4. Tap **Share Story**.
5. **Expected:** the message **"Story uploaded successfully"**, the window
   closes, and the new story is on the **first** page of the grid.

### SS-11 — Add a video story
1. Pick a video shorter than 1 minute and tap **Share Story**.
2. **Expected:** it uploads, the success message shows, and the new card carries
   the **Video** label.

### SS-12 — Video longer than one minute
1. Try to pick a video longer than 1 minute.
2. **Expected:** the message **"1 minutes video only"** appears at once and
   nothing goes into the preview.

### SS-13 — File bigger than 10 MB
1. Try to pick a file over 10 MB.
2. **Expected:** the message **"File size should not exceed 10 MB"** and nothing
   is added.

### SS-14 — SVG image
1. Try to pick an `.svg` file.
2. **Expected:** **"SVG Images Not Allowed"** and nothing is added.

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
2. **Expected:** a **Select Product** window opens with the shop's products.
3. Scroll down and tap **Load more** if it is there.
4. **Expected:** more products are added.
5. Tap a product.
6. **Expected:** the window closes and the product's picture and name are shown
   in the **Linked product** area, with **Change** and **Remove** under it.
7. Tap **Change**, pick another product; then tap **Remove**.
8. **Expected:** **Change** swaps the product, **Remove** clears it and the
   **Link to Product** button comes back.

### SS-18 — The linked product is saved
1. Share a story with a linked product.
2. **Expected:** the new card in the grid shows the product name in green under
   the picture, and the story viewer shows "Linked to product".

### SS-19 — Cancel the upload
1. Open **Add Story**, choose a photo and a link, then tap **Cancel**.
2. **Expected:** the window closes, nothing is added to the grid.

### SS-20 — The Delete button follows the permission
1. Sign in with a user who cannot delete stories.
2. **Expected:** the cards have no **Delete** button.
3. Sign in with a user who can delete.
4. **Expected:** every card has a red **Delete** button.

### SS-21 — Delete a seller story
1. Tap **Delete** on a card.
2. **Expected:** a box asks **"Are you sure you want to delete this story? This
   action cannot be undone."**
3. Tap **Cancel**.
4. **Expected:** the box closes and the card stays.
5. Tap **Delete** again and confirm.
6. **Expected:** the card disappears from the grid.

### SS-22 — Delete fails
1. Ask the team to test with the stories service failing.
2. **Expected:** an error message appears and the card stays in the grid.

---

## 9. Language check (do this for every screen above)

1. Switch the app language to **Arabic**, **Turkish** and **Kurdish**.
2. **Expected:** every button, title, message and placeholder in the stories
   screens is translated. Report any English word left on screen.
3. In Arabic and Kurdish, check that the screens read from **right to left**.

---

## 10. What to write in a bug report

- Which case number failed (for example **AS-10**).
- The account you used and whether it is a seller.
- The language and the country you had selected.
- The device and the browser.
- What you expected and what happened.
- A screenshot or a screen recording, and the exact message text if one showed.
