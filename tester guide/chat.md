# Chat Feature — Manual Tester Guide

**Prepared for:** Non-Technical QA Employees
**Feature:** Chat (messages, contacts, voice and video calls, stories tab, order chat)
**Written from:** the application code only. Every number, limit and message text
below was read in the code, not guessed.

---

## 1. Purpose

Check that the whole chat window works from end to end: opening it, seeing your
chats, sending and receiving every message type, message actions, calls, the
contacts list, the stories tab, and the separate order ("Delivery Worker") chat.

---

## 2. Scope

| Area | Included |
|---|---|
| Opening the chat (login gate, notification gate) | ✅ |
| Chat list: order, unread count, last message, typing | ✅ |
| Chat row options: read/unread, pin, mute, delete, archive | ✅ |
| Contacts list, add contact, sync contacts, invite | ✅ |
| Search for a chat or a contact | ✅ |
| Search inside one conversation | ✅ |
| Sending: text, image, video, file, voice note, camera photo/video | ✅ |
| Receiving messages in real time | ✅ |
| Message status icons (sent / received / read) | ✅ |
| Message actions: reply, forward, copy, delete | ✅ |
| Sharing a product into a chat | ✅ |
| Chat info drawer: media and files, block, delete chat | ✅ |
| Voice calls and video calls | ✅ |
| Calls tab (call log) | ✅ |
| Stories tab inside the chat window | ✅ |
| Order chat with the delivery worker | ✅ |
| Error messages and empty states | ✅ |

---

## 3. Out of Scope

- **Group chats.** The web chat is one-to-one only. There is no way to make a
  chat with three people, and no member list. Do not report a missing group
  feature as a bug.
- Anything the backend decides on its own (push delivery, message storage).
- The mobile app. This guide is for the web app.
- Internal logging and Sentry.
- The story viewer itself. Only the stories **tab inside the chat** is covered
  here. The story viewer has its own guide (`tester guide/stories.md`).

---

## 4. Assumptions

- **Every chat is between two people only.** There are no group chats. You and
  one other person share exactly **one** chat, and it holds every message the
  two of you ever sent. So "a second chat with the same person" cannot exist —
  a second chat always means a **different person**.
- You have **three accounts**. For the message tests, three browsers on one
  computer are enough. For the call tests, read the call rule further down.
  - **User A** — you, the one doing the test.
  - **User B** — the friend you chat with. Almost every test needs User B.
  - **User C** — a second friend. Needed only where a test asks for **two**
    chats at the same time, for example the unread badge and the side bubbles.
- All three accounts are logged in and phone-verified.
- Your browser allows notifications. **The chat does not open without it.**
- **Calls need two real devices — one for each side.** Two tabs, two windows or
  two browsers on the same computer will not work: the first app takes the
  camera and the microphone and holds them, so the second side gets nothing.
  Use, for example, a laptop for User A and a phone for User B. Each device
  needs a working microphone, and a camera for video calls.
- You know which build or link to test on. This guide does not name one.

---

## 5. Preconditions

- User A and User B already have their chat, with old messages in it. Some tests
  need more than 10 messages in it. Remember: the two of you share **one** chat,
  so every message you ever send each other lives there.
- User A and User C also have their chat, used by the tests that need two chats
  at once.
- User A has at least 10 chats in the list — that means 10 **different people**
  — to test loading more.
- User A has at least one saved contact.
- For the order chat tests: an order whose status is **out for delivery**, or a
  return whose status is **out for return**.

---

## 6. Test Data

Prepare these files before you start:

| File | Details |
|---|---|
| `photo.jpg` | A normal photo |
| `photo.png` | A PNG image |
| `clip.mp4` | A short video |
| `document.pdf` | A PDF file |
| `sheet.xlsx` | Any non-media file |
| `song.mp3` | An audio file |
| `under-cap.zip` | A file a little **under** 25 MB, for example 24 MB |
| `over-cap.zip` | A file a little **over** 25 MB, for example 30 MB |

Also prepare one product page link, for the product sharing test.

---

## 7. How to Open the Chat

1. Log in.
2. In the top bar, next to your name, there is a **chat icon**.
3. Click it. The chat window opens on the right side of the screen.
4. On a small screen (mobile width) the chat window fills the whole screen.

The window has three tabs at the top: **Chats**, **Calls**, **Stories**.
In the **top right** corner there are two icons next to each other: the
**contacts icon**, and then the **close (X)** icon on the far right.

---

## 8. Test Scenarios

---

### GROUP A — Opening the chat and its gates

---

**TC-A-01 — A logged-in user with notifications allowed can open the chat**

| | |
|---|---|
| **Precondition** | Logged in. Browser notification permission is "allowed". |
| **Steps** | 1. Click the chat icon in the top bar. |
| **Expected Result** | The chat window opens. The Chats tab is selected. The chat list loads (grey loading rows first, then the real chats). |
| **Severity if Failed** | CRITICAL |

---

**TC-A-02 — Notification permission is still "ask"**

| | |
|---|---|
| **Precondition** | Browser notification permission was never answered for this site. |
| **Steps** | 1. Click the chat icon. |
| **Expected Result** | The chat does **not** open. A window asking you to turn on notifications appears instead. |
| **Severity if Failed** | HIGH |

---

**TC-A-03 — Notification permission is blocked**

| | |
|---|---|
| **Precondition** | You blocked notifications for this site in the browser. |
| **Steps** | 1. Click the chat icon. |
| **Expected Result** | The chat does **not** open. A red error message appears: "Notification Is Not Enabled! please Allow Notification Access". |
| **Severity if Failed** | HIGH |

---

**TC-A-04 — Notifications blocked, but the chat window is already open**

| | |
|---|---|
| **Precondition** | Block notifications while the chat window is open, then reload and open the chat again. |
| **Steps** | 1. Open the chat. |
| **Expected Result** | Instead of the chat you see the line "Please Enable Notification to use Chat". No chat list, no message box. |
| **Severity if Failed** | MEDIUM |

---

**TC-A-05 — A guest has no chat icon at all**

| | |
|---|---|
| **Precondition** | Not logged in, or logged in as a guest whose phone is not set. |
| **Steps** | 1. Look at the top bar. |
| **Expected Result** | There is **no chat icon**. A guest sees a login icon and a plain user icon instead. The chat icon only appears after login, for an account that has a phone number. So a guest has no way to reach the chat from the top bar. |
| **Severity if Failed** | CRITICAL |

---

**TC-A-06 — A user with a phone but no chat account**

| | |
|---|---|
| **Precondition** | The account has a phone number, but the chat session is missing or expired. |
| **Steps** | 1. Click the chat icon. |
| **Expected Result** | The "confirm your phone number" widget opens. After a correct OTP, the chat opens. |
| **Severity if Failed** | HIGH |

---

**TC-A-07 — Unread badge on the chat icon**

| | |
|---|---|
| **Precondition** | Your chat window is closed. User B sends you one message, and User C sends you two. That is 2 chats with new messages, and 3 new messages. |
| **Steps** | 1. Look at the chat icon in the top bar. |
| **Expected Result** | The plain icon is replaced by an icon with the number **2**. The number counts **chats** that have new messages, not messages. So User C's two messages count once. |
| **Severity if Failed** | MEDIUM |

---

**TC-A-08 — Closing the chat**

| | |
|---|---|
| **Steps** | 1. Open the chat. 2. Click the X in the top-right corner. 3. Open it again and this time click the dark area outside the window. |
| **Expected Result** | Both ways close the chat. The page behind can be scrolled again after closing. During a call the dark area does **not** close the chat; that is on purpose. |
| **Severity if Failed** | MEDIUM |

---

### GROUP B — The chat list (Chats tab)

---

**TC-B-01 — The list loads**

| | |
|---|---|
| **Steps** | 1. Open the chat. |
| **Expected Result** | First grey placeholder rows, then the real chats. Each row shows: photo (or the two first letters of the name), name, the last message, and the time of the last message. |
| **Severity if Failed** | CRITICAL |

---

**TC-B-02 — The newest chat is on top**

| | |
|---|---|
| **Steps** | 1. Note the list order. 2. Pick a person whose chat sits low in the list, and ask that person to send you a message. 3. Look at the list again. |
| **Expected Result** | That person's chat moves to the top. Chats are sorted by the newest message. |
| **Severity if Failed** | HIGH |

---

**TC-B-03 — Pinned chats stay on top**

| | |
|---|---|
| **Precondition** | One chat is pinned (see TC-C-02). |
| **Steps** | 1. Look at the list. |
| **Expected Result** | Pinned chats appear above all other chats, whatever their message time is. |
| **Severity if Failed** | MEDIUM |

---

**TC-B-04 — Unread count on a chat row**

| | |
|---|---|
| **Steps** | 1. Ask User B to send you 3 messages. 2. Do not open that chat. 3. Look at its row. |
| **Expected Result** | A small badge on the row shows **3**. Call messages are never counted. |
| **Severity if Failed** | HIGH |

---

**TC-B-05 — Opening a chat clears its unread badge**

| | |
|---|---|
| **Steps** | 1. Open the chat that has unread messages. 2. Go back to the list. |
| **Expected Result** | The badge is gone. On User B's side, the messages now show the "read" icon. |
| **Severity if Failed** | HIGH |

---

**TC-B-06 — The last message line shows the right text per type**

| | |
|---|---|
| **Steps** | 1. Ask User B to send, one after the other: a text, a photo, a video, a file, a voice note, a shared product. 2. Watch the last-message line of that row each time. |
| **Expected Result** | A text message shows its text. The others show a short word with an icon: Image, Video, Audio, File, Product. A call shows "Voice Call" or "Video Call". A deleted message shows "this message was deleted". Never an empty line and never raw data. |
| **Severity if Failed** | MEDIUM |

---

**TC-B-07 — "Typing..." in the list**

| | |
|---|---|
| **Steps** | 1. Ask User B to start typing in your chat and keep typing. 2. Look at that row in your list. |
| **Expected Result** | The last message line is replaced by a blue "Typing..." with three dots. It disappears about **2 seconds** after User B stops typing. Check it in Arabic, Turkish and Kurdish too: the word must be in that language, not English. |
| **Severity if Failed** | MEDIUM |

---

**TC-B-08 — Loading more chats**

| | |
|---|---|
| **Precondition** | The account has more than 10 chats. |
| **Steps** | 1. Open the chat. 2. Scroll the list to the bottom. |
| **Expected Result** | A spinner appears and 10 more chats are added below. The list does **not** jump, and no chat appears twice. When there are no more chats, the spinner disappears for good. |
| **Severity if Failed** | HIGH |

---

**TC-B-09 — New-message bubbles at the side**

| | |
|---|---|
| **Steps** | 1. Open your chat with User B. 2. Ask **User C** to send you a message. |
| **Expected Result** | A small round photo of User C appears at the side of the window. Clicking it opens the chat with User C. The bubble is only for chats you are **not** reading, so a message from User B while their chat is open never makes one. |
| **Severity if Failed** | LOW |

---

### GROUP C — Chat row options (swipe menu)

To open the options of one chat row: **press the row and drag it to the left**
(on a phone, swipe left). The row slides and shows five options: Read/Unread,
Pin, Mute, Delete, Archive.

---

**TC-C-01 — The options row opens and closes**

| | |
|---|---|
| **Steps** | 1. Drag a chat row to the left. 2. Then drag a different row to the left. |
| **Expected Result** | The options appear for the dragged row. When you drag a second row, the first one closes itself. |
| **Severity if Failed** | MEDIUM |

---

**TC-C-02 — Pin a chat**

| | |
|---|---|
| **Steps** | 1. Use a chat that has **no** unread messages. 2. Open its options. 3. Click **Pin**. 4. Reload the page and open the chat again. |
| **Expected Result** | The chat moves up to the pinned group and stays pinned after the reload. A pin icon shows on the row. The icon is only shown while the chat has no unread messages; when a new message arrives, the unread badge takes its place. |
| **Severity if Failed** | HIGH |

---

**TC-C-03 — Unpin a chat**

| | |
|---|---|
| **Precondition** | The chat is pinned. |
| **Steps** | 1. Open its options. 2. Click **Unpin**. 3. Reload. |
| **Expected Result** | The chat is not pinned any more, and it stays that way after the reload. |
| **Severity if Failed** | MEDIUM |

---

**TC-C-04 — The pin limit is 3**

| | |
|---|---|
| **Precondition** | 3 chats are already pinned. |
| **Steps** | 1. Try to pin a fourth chat. |
| **Expected Result** | A red error appears: "only 3 pinned chats allowed". The fourth chat is not pinned. |
| **Severity if Failed** | MEDIUM |

---

**TC-C-05 — Mute a chat**

| | |
|---|---|
| **Steps** | 1. Use a chat with **no** unread messages. 2. Open its options. 3. Click **Mute**. 4. Reload and check the row. |
| **Expected Result** | A mute icon shows on the row, and it survives the reload. The option now reads "Unmute". As with the pin icon, the mute icon is hidden while the chat has unread messages. |
| **Severity if Failed** | MEDIUM |

---

**TC-C-06 — Unmute a chat**

| | |
|---|---|
| **Steps** | 1. Open the options of a muted chat. 2. Click **Unmute**. 3. Reload. |
| **Expected Result** | The mute icon is gone and stays gone. |
| **Severity if Failed** | MEDIUM |

---

**TC-C-07 — Delete a chat from the options**

| | |
|---|---|
| **Steps** | 1. Open the options of a chat. 2. Click **Delete**. 3. Reload the page. |
| **Expected Result** | The chat leaves the list at once, and it is still gone after the reload. There is **no confirm question** before the delete — note this in your report if you think it is wrong. |
| **Severity if Failed** | HIGH |

---

**TC-C-08 — Read / Unread option**

| | |
|---|---|
| **Steps** | 1. Open the options of a chat. 2. Click the first option (Read / Unread). 3. Reload the page. |
| **Expected Result** | See **Known gaps, item 1**. Today this option only changes the screen and is lost on reload. Please still run the test and write down exactly what you see. |
| **Severity if Failed** | LOW |

---

**TC-C-09 — Archive option**

| | |
|---|---|
| **Steps** | 1. Open the options of a chat. 2. Click **Archive**. |
| **Expected Result** | See **Known gaps, item 2**. Nothing happens today. |
| **Severity if Failed** | LOW |

---

### GROUP D — Contacts

Open the contacts list with the **contacts icon** in the top right of the chat
window, the one just left of the close (X) icon. The back arrow returns to the
chat list.

---

**TC-D-01 — Empty contacts list**

| | |
|---|---|
| **Precondition** | An account with no saved contacts. |
| **Steps** | 1. Open the contacts list. |
| **Expected Result** | Two lines are shown: "No Contacts" and "Log in Through our App to access contacts". Plus the two buttons from TC-D-02 and TC-D-04. |
| **Severity if Failed** | LOW |

---

**TC-D-02 — Add a contact by hand**

| | |
|---|---|
| **Steps** | 1. Open contacts. 2. Click "Add Contact Manually". 3. Type a name. 4. Pick the country code and type a phone number. 5. Click "Confirm Add". |
| **Expected Result** | The button is disabled while the name is empty or the number is shorter than 6 digits. After saving, the form closes and the new contact appears in the list. |
| **Severity if Failed** | HIGH |

---

**TC-D-03 — Adding a number you already have**

| | |
|---|---|
| **Steps** | 1. Start adding a contact. 2. Type a phone number that is already saved (try it in a different format too, for example with and without the country code). |
| **Expected Result** | An orange line appears: "Already saved as <the old name>". The confirm button stays disabled. |
| **Severity if Failed** | MEDIUM |

---

**TC-D-04 — Sync contacts from the phone**

| | |
|---|---|
| **Precondition** | A browser that supports the phone contacts picker (Chrome on Android). |
| **Steps** | 1. Open contacts. 2. Click "Get from your contacts". 3. Pick several contacts. |
| **Expected Result** | The button shows "Syncing...". After it finishes, the picked contacts are in the list, with no duplicates. |
| **Severity if Failed** | MEDIUM |

---

**TC-D-05 — Sync on a browser that does not support it**

| | |
|---|---|
| **Precondition** | Desktop Chrome, Firefox or Safari. |
| **Steps** | 1. Click "Get from your contacts". |
| **Expected Result** | A red error appears: "Contacts API not supported on this browser". The app does not freeze. |
| **Severity if Failed** | MEDIUM |

---

**TC-D-06 — A contact who already has a chat**

| | |
|---|---|
| **Steps** | 1. Open contacts. 2. Click a contact you already chat with. |
| **Expected Result** | The contacts list closes and the existing conversation opens, with its old messages. |
| **Severity if Failed** | HIGH |

---

**TC-D-07 — A contact who uses the app but has no chat yet**

| | |
|---|---|
| **Steps** | 1. Open contacts. 2. Click such a contact. |
| **Expected Result** | An empty conversation opens with that person's name at the top. After you send the first message, the chat appears in the chat list. |
| **Severity if Failed** | HIGH |

---

**TC-D-08 — A contact who does not use the app: Invite**

| | |
|---|---|
| **Steps** | 1. Find a contact with an **Invite** link on the row. 2. Click **Invite**. |
| **Expected Result** | On a phone, the system share sheet opens. On a desktop, a small window opens with three buttons: WhatsApp, Telegram, Copy Invite. Each one works. |
| **Severity if Failed** | MEDIUM |

---

**TC-D-09 — The invite text**

| | |
|---|---|
| **Steps** | 1. Click **Copy Invite**. 2. Paste the text somewhere. |
| **Expected Result** | Read the pasted text carefully and report exactly what it says. See **Known gaps, item 5**. |
| **Severity if Failed** | MEDIUM |

---

### GROUP E — Search

---

**TC-E-01 — Search the chat list by name**

| | |
|---|---|
| **Steps** | 1. Open the chat. 2. Type part of a name in the search box at the top. |
| **Expected Result** | Only the matching chats stay in the list. The search is not case sensitive. |
| **Severity if Failed** | HIGH |

---

**TC-E-02 — Search finds people you have no chat with**

| | |
|---|---|
| **Steps** | 1. Type the name of a contact you never chatted with. 2. Wait about half a second. |
| **Expected Result** | That person appears below the chat results. Clicking them opens a new empty conversation. |
| **Severity if Failed** | MEDIUM |

---

**TC-E-03 — Search does not show the same person twice**

| | |
|---|---|
| **Steps** | 1. Search for a name that has both a chat and a contact entry. |
| **Expected Result** | The person is listed once, as the existing chat. |
| **Severity if Failed** | LOW |

---

**TC-E-04 — Clearing the search**

| | |
|---|---|
| **Steps** | 1. Search for something. 2. Delete the text. |
| **Expected Result** | The full chat list comes back, in the same order as before. |
| **Severity if Failed** | MEDIUM |

---

**TC-E-05 — Search inside one conversation**

| | |
|---|---|
| **Precondition** | A conversation with many old messages. |
| **Steps** | 1. Open the conversation. 2. Open the chat details (click the name at the top) and click **Search**. 3. Type a word that exists in an old message. |
| **Expected Result** | The chat scrolls to the matching message and the message flashes with a highlight. |
| **Severity if Failed** | HIGH |

---

**TC-E-06 — Moving between search matches**

| | |
|---|---|
| **Precondition** | A word that appears in several messages. |
| **Steps** | 1. Search for it. 2. Use the up and down arrows next to the search box. |
| **Expected Result** | Each click moves to the next or previous match and highlights it. At the first match the up arrow is faded; at the last match the down arrow is faded. Older messages are loaded when needed. |
| **Severity if Failed** | MEDIUM |

---

**TC-E-07 — A search with no result**

| | |
|---|---|
| **Steps** | 1. Search inside a conversation for a word that is not there. |
| **Expected Result** | The spinner stops. Nothing is highlighted. The app does not freeze and shows no error. |
| **Severity if Failed** | MEDIUM |

---

**TC-E-08 — Closing the conversation search**

| | |
|---|---|
| **Steps** | 1. Click the X next to the search arrows. |
| **Expected Result** | The search bar closes and the conversation goes back to normal. |
| **Severity if Failed** | LOW |

---

### GROUP F — Sending messages

---

**TC-F-01 — Send a text message with the send button**

| | |
|---|---|
| **Steps** | 1. Open a chat. 2. Type "hello". 3. Click the send button (it replaces the camera and microphone icons as soon as you type). |
| **Expected Result** | The message appears at once at the bottom, on your side, with a "waiting" icon. The icon then becomes the "sent" icon. The input box is cleared. |
| **Severity if Failed** | CRITICAL |

---

**TC-F-02 — Send a text message with the Enter key**

| | |
|---|---|
| **Steps** | 1. Type a message. 2. Press Enter. |
| **Expected Result** | Same as TC-F-01. The chat scrolls to the bottom. |
| **Severity if Failed** | HIGH |

---

**TC-F-03 — Empty message**

| | |
|---|---|
| **Steps** | 1. Press Enter with an empty box. 2. Type only spaces and press Enter. |
| **Expected Result** | Nothing is sent. No empty bubble appears. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-04 — A very long message**

| | |
|---|---|
| **Steps** | 1. Paste about 1000 characters and send. |
| **Expected Result** | The whole text is sent and shown. The bubble wraps and does not break the layout. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-05 — Send an image with the "+" button**

| | |
|---|---|
| **Steps** | 1. Click the **+** button on the left of the input box. 2. Pick `photo.jpg`. |
| **Expected Result** | A crop window opens first. After you save the crop, a preview with **Send** and **Cancel** appears. After Send, the image appears in the chat and uploads. |
| **Severity if Failed** | CRITICAL |

---

**TC-F-06 — Cancel an image before sending**

| | |
|---|---|
| **Steps** | 1. Pick an image. 2. Close the crop window, or click Cancel in the preview. |
| **Expected Result** | Nothing is sent. No empty bubble stays in the chat. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-07 — Send a video**

| | |
|---|---|
| **Steps** | 1. Click **+**. 2. Pick `clip.mp4`. |
| **Expected Result** | The video is sent directly, with **no** crop step. It appears in the chat and can be played. |
| **Severity if Failed** | HIGH |

---

**TC-F-08 — Send a file**

| | |
|---|---|
| **Steps** | 1. Click **+**. 2. Pick `document.pdf`. |
| **Expected Result** | A file bubble appears with a download arrow. Clicking it opens or downloads the right file. |
| **Severity if Failed** | HIGH |

---

**TC-F-09 — Send an audio file**

| | |
|---|---|
| **Steps** | 1. Click **+**. 2. Pick `song.mp3`. |
| **Expected Result** | It is sent as a voice message, with a play button. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-10 — The camera button menu**

| | |
|---|---|
| **Steps** | 1. With an empty input box, click the **camera** icon. |
| **Expected Result** | A small window opens with the title "chosse an image or video from camera or files" and two choices: **files** and **camera**. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-11 — "files" only accepts images and videos**

| | |
|---|---|
| **Steps** | 1. Camera icon → **files**. 2. In the file picker, force-select `document.pdf` (choose "All files" if needed). |
| **Expected Result** | A red error appears: "Only image and video files are allowed". Nothing is sent. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-12 — Take a photo with the camera**

| | |
|---|---|
| **Precondition** | The device has a camera. |
| **Steps** | 1. Camera icon → **camera**. 2. Allow the camera when the browser asks. 3. Take a photo and send it. |
| **Expected Result** | The camera view opens. The photo goes through the crop and preview steps, then is sent. |
| **Severity if Failed** | HIGH |

---

**TC-F-13 — Camera permission refused**

| | |
|---|---|
| **Steps** | 1. Block the camera in the browser. 2. Camera icon → **camera**. |
| **Expected Result** | A red error appears: "Please enable camera permissions to use camera features". The camera view does not open. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-14 — Record and send a voice note**

| | |
|---|---|
| **Steps** | 1. With an empty input box, click the red **microphone** icon. 2. Allow the microphone. 3. Speak for a few seconds. 4. Click the send icon on the right of the recorder. |
| **Expected Result** | While recording you see a running timer. After sending, a voice bubble appears with a play button and the length of the recording. |
| **Severity if Failed** | HIGH |

---

**TC-F-15 — Cancel a recording**

| | |
|---|---|
| **Steps** | 1. Start recording. 2. Click **Cancel**. |
| **Expected Result** | The recorder closes and nothing is sent. The normal input box comes back. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-16 — No microphone**

| | |
|---|---|
| **Steps** | 1. Block the microphone in the browser. 2. Click the microphone icon. |
| **Expected Result** | A red error appears: "No available Microphone". The recorder does not start. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-17 — The 25 MB limit for a chat attachment**

| | |
|---|---|
| **Precondition** | A chat attachment may be up to **25 MB**. The app checks nothing before sending; the media server refuses anything bigger with a `413`. |
| **Steps** | 1. Click **+** and pick `under-cap.zip` (24 MB). 2. Wait for it to finish. 3. Click **+** again and pick `over-cap.zip` (30 MB). |
| **Expected Result** | The 24 MB file is sent and can be downloaded again. The 30 MB file is refused: the waiting bubble is **removed** from the chat and a red error appears. What must never happen: the bubble stays stuck as "waiting" for ever, or an unusable message stays in the chat. |
| **Severity if Failed** | HIGH |

---

**TC-F-18 — A slow upload that runs out of time**

| | |
|---|---|
| **Precondition** | Permission to upload is a one-use ticket that lives **120 seconds**, and a failed upload burns it. |
| **Steps** | 1. Slow the network down (in the browser tools, choose a slow connection). 2. Send `under-cap.zip`. 3. If it fails, pick the same file again straight away. |
| **Expected Result** | Either the file arrives, or it fails cleanly: the waiting bubble is removed and a red error appears. Picking the file again must work, because the app asks for a new ticket every time. A second try that always fails is a bug — report it. |
| **Severity if Failed** | MEDIUM |

---

**TC-F-19 — Sending while offline**

| | |
|---|---|
| **Steps** | 1. Turn off the network. 2. Send a text message. |
| **Expected Result** | The message appears, then is removed again, and a red error appears. It does not stay in the chat as if it were sent. |
| **Severity if Failed** | HIGH |

---

**TC-F-20 — First message to a new person**

| | |
|---|---|
| **Steps** | 1. Open a contact you never chatted with (TC-D-07). 2. Send a text. |
| **Expected Result** | The message is sent, the chat is created, and it appears in the chat list. Reload the page: the chat and the message are still there. |
| **Severity if Failed** | CRITICAL |

---

### GROUP G — Receiving messages, status and presence

---

**TC-G-01 — A message arrives while the chat is open**

| | |
|---|---|
| **Steps** | 1. Open the chat with User B. 2. Ask User B to send a text. |
| **Expected Result** | The message appears in the open conversation without a reload. No notification box is shown, because you are already looking at that chat. |
| **Severity if Failed** | CRITICAL |

---

**TC-G-02 — A message arrives while you are reading a different person's chat**

| | |
|---|---|
| **Steps** | 1. Open your chat with User C and keep reading it. 2. Ask User B to send you a message. |
| **Expected Result** | The chat with User B moves to the top of the list, its unread badge grows, and a bubble appears at the side (TC-B-09). The chat with User C, the one you are reading, is not touched. |
| **Severity if Failed** | HIGH |

---

**TC-G-03 — A message arrives while the chat window is closed**

| | |
|---|---|
| **Steps** | 1. Close the chat window but stay on the site. 2. Ask User B to send a message. |
| **Expected Result** | A notification box appears with User B's name, photo and a short preview of the message. Clicking it opens that chat. |
| **Severity if Failed** | HIGH |

---

**TC-G-04 — The notification preview per message type**

| | |
|---|---|
| **Steps** | 1. With the chat closed, ask User B to send: a photo, a file, a voice note, a shared product, and a very long text. |
| **Expected Result** | Each notification shows a sensible short line. For a shared product it reads "Shared a product". A very long text is cut at about 100 characters and ends with "...". |
| **Severity if Failed** | MEDIUM |

---

**TC-G-05 — Message status: sent, received, read**

| | |
|---|---|
| **Steps** | 1. Send a message to User B while User B has the app closed. 2. Ask User B to open the app but not the chat. 3. Ask User B to open the chat. |
| **Expected Result** | The small icon under your message changes in three steps: sent → received → read. It never goes backwards. |
| **Severity if Failed** | HIGH |

---

**TC-G-06 — Typing indicator inside the conversation**

| | |
|---|---|
| **Steps** | 1. Open the chat with User B. 2. Ask User B to type. |
| **Expected Result** | "Typing..." shows in the header of the conversation, in the place of "Online" or "last Seen", while User B types. It disappears about 2 seconds after the last key. |
| **Severity if Failed** | MEDIUM |

---

**TC-G-07 — Online and last seen**

| | |
|---|---|
| **Steps** | 1. Open a chat with User B while User B is also using the site. 2. Then ask User B to close the site and wait more than 5 minutes. 3. Reopen the chat. |
| **Expected Result** | First the header shows "Online". Later it shows "last Seen" with a date or time. The app refreshes your own last-seen every 5 minutes. |
| **Severity if Failed** | MEDIUM |

---

**TC-G-08 — Date separators**

| | |
|---|---|
| **Precondition** | A chat with messages from today, yesterday, 3 days ago and 2 weeks ago. |
| **Steps** | 1. Scroll through the conversation. |
| **Expected Result** | Grey separators read "Today", "Yesterday", the name of the weekday for the last 6 days, and a plain date for anything older. |
| **Severity if Failed** | MEDIUM |

---

**TC-G-09 — Loading older messages**

| | |
|---|---|
| **Precondition** | A chat with more than 20 messages. |
| **Steps** | 1. Open it. 2. Scroll up to the top. |
| **Expected Result** | 10 older messages load above. The view stays on the message you were reading — it must **not** jump to the top or to the bottom. Repeat until the chat starts. No message appears twice. |
| **Severity if Failed** | HIGH |

---

**TC-G-10 — Message order**

| | |
|---|---|
| **Steps** | 1. Send and receive several messages quickly. |
| **Expected Result** | Messages are always in time order, oldest at the top. A slow message never lands in the wrong place. |
| **Severity if Failed** | HIGH |

---

### GROUP H — Message actions

Click a message bubble to open its action menu.

---

**TC-H-01 — Reply to a message**

| | |
|---|---|
| **Steps** | 1. Click a message. 2. Click **Reply**. 3. Type an answer and send it. |
| **Expected Result** | The quoted message shows above the input box before sending, with a cancel button. After sending, the new message shows the quoted message inside it. |
| **Severity if Failed** | HIGH |

---

**TC-H-02 — Jump to the quoted message**

| | |
|---|---|
| **Steps** | 1. Click the quoted part of a reply. |
| **Expected Result** | The chat scrolls to the original message and flashes it. If the original is old and not loaded yet, the app loads it first and then scrolls. |
| **Severity if Failed** | MEDIUM |

---

**TC-H-03 — Cancel a reply**

| | |
|---|---|
| **Steps** | 1. Start a reply. 2. Click the cancel button on the quote. |
| **Expected Result** | The quote disappears. The next message you send is a normal message. |
| **Severity if Failed** | LOW |

---

**TC-H-04 — Copy a text message**

| | |
|---|---|
| **Steps** | 1. Click a text message. 2. Click **Copy**. 3. Paste somewhere. 4. Repeat the same three steps inside the **order chat** (Group M). |
| **Expected Result** | The exact message text is pasted, in both the main chat and the order chat. Note: **Copy** only exists for text messages. |
| **Severity if Failed** | MEDIUM |

---

**TC-H-05 — Forward a message**

| | |
|---|---|
| **Steps** | 1. In your chat with User B, click a message. 2. Click **Forward**. 3. The chat list opens with a "Forward Message" bar. 4. Pick the chat with User C. |
| **Expected Result** | The message is sent to the chosen chat and is marked with the "forwarded" arrow. Works for text, image, video, file, voice and shared product. |
| **Severity if Failed** | HIGH |

---

**TC-H-06 — Cancel a forward**

| | |
|---|---|
| **Steps** | 1. Start a forward. 2. Click the back arrow on the "Forward Message" bar. |
| **Expected Result** | The forward is cancelled and nothing is sent. |
| **Severity if Failed** | LOW |

---

**TC-H-07 — Delete your own message for everyone**

| | |
|---|---|
| **Steps** | 1. Click one of **your** messages. 2. Click **Delete**. 3. In the question "Do you want to delete this message?" choose **For All**. |
| **Expected Result** | The bubble turns into a "deleted message" placeholder on **both** sides. Reload both sides to confirm. |
| **Severity if Failed** | HIGH |

---

**TC-H-08 — Delete a message only for yourself**

| | |
|---|---|
| **Steps** | 1. Click any message. 2. **Delete** → **For Me**. |
| **Expected Result** | It becomes a placeholder on your side only. User B still sees the message. |
| **Severity if Failed** | HIGH |

---

**TC-H-09 — "For All" is not offered for someone else's message**

| | |
|---|---|
| **Steps** | 1. Click a message **from User B**. 2. Click **Delete**. |
| **Expected Result** | The question offers **For Me** and **Cancel** only. There is no "For All". |
| **Severity if Failed** | HIGH |

---

**TC-H-10 — Deleting a message that was quoted**

| | |
|---|---|
| **Steps** | 1. Reply to a message. 2. Delete the original for everyone. |
| **Expected Result** | The quote inside the reply becomes empty or shows it was deleted. It does not still show the old text. |
| **Severity if Failed** | MEDIUM |

---

**TC-H-11 — Closing the delete question**

| | |
|---|---|
| **Steps** | 1. Open the delete question. 2. Click the dark area around it. |
| **Expected Result** | The question closes and nothing is deleted. |
| **Severity if Failed** | LOW |

---

**TC-H-12 — Open an image or video full screen**

| | |
|---|---|
| **Steps** | 1. Click an image message, then the eye icon in its menu. 2. Do the same for a video. |
| **Expected Result** | The image or video opens large over the chat and can be closed again. |
| **Severity if Failed** | MEDIUM |

---

**TC-H-13 — Play a voice message**

| | |
|---|---|
| **Steps** | 1. Click the play button on a voice message. 2. Let it finish. 3. Play it again. |
| **Expected Result** | The button becomes a pause button, the remaining time counts down, and at the end it returns to the start and can be played again. |
| **Severity if Failed** | MEDIUM |

---

**TC-H-14 — Other options in the message menu**

| | |
|---|---|
| **Steps** | 1. Open the menu of one of **your** text messages. 2. Try **Edit**, **Reminder**, and the category icon. |
| **Expected Result** | See **Known gaps, items 3 and 4**. These do nothing useful today. Please write down what you see. |
| **Severity if Failed** | LOW |

---

**TC-H-15 — Swipe a message to see its times**

| | |
|---|---|
| **Steps** | 1. Drag a message bubble a little to the right. |
| **Expected Result** | The exact sent time (and read time) slides into view. Scrolling the chat closes it again. |
| **Severity if Failed** | LOW |

---

### GROUP I — Sharing a product into the chat

---

**TC-I-01 — Share a product with one contact**

| | |
|---|---|
| **Steps** | 1. Open any product page. 2. Open the share window and choose to share inside the app. 3. Pick one contact. 4. Click the send button. |
| **Expected Result** | A green message appears: "Product is Shared Successfully". The share window closes. |
| **Severity if Failed** | HIGH |

---

**TC-I-02 — Share with no contact chosen**

| | |
|---|---|
| **Steps** | 1. Open the share window. 2. Click send without picking anybody. |
| **Expected Result** | A red error appears: "please select one contact at least". Nothing is sent. |
| **Severity if Failed** | MEDIUM |

---

**TC-I-03 — Share with several contacts at once**

| | |
|---|---|
| **Steps** | 1. Pick three contacts. 2. Send. |
| **Expected Result** | All three receive the product message. |
| **Severity if Failed** | MEDIUM |

---

**TC-I-04 — What the receiver sees**

| | |
|---|---|
| **Steps** | 1. As User B, open the chat. |
| **Expected Result** | A message with the product image and a **View Product** button. |
| **Severity if Failed** | HIGH |

---

**TC-I-05 — The View Product button works**

| | |
|---|---|
| **Steps** | 1. Click **View Product**. |
| **Expected Result** | The right product page opens. |
| **Severity if Failed** | HIGH |

---

**TC-I-06 — Share to somebody with no chat yet**

| | |
|---|---|
| **Steps** | 1. Share a product with a contact you never chatted with. |
| **Expected Result** | The share works and a new chat with that product message appears in the chat list. |
| **Severity if Failed** | MEDIUM |

---

### GROUP J — Chat details drawer

Open it by clicking the other person's name or photo at the top of a
conversation.

---

**TC-J-01 — The drawer opens**

| | |
|---|---|
| **Steps** | 1. Click the name at the top of a conversation. |
| **Expected Result** | A panel slides in from the side with the photo, the name and the phone number of the other person. |
| **Severity if Failed** | MEDIUM |

---

**TC-J-02 — Copy the phone number**

| | |
|---|---|
| **Steps** | 1. Click the phone number. |
| **Expected Result** | A green message appears: "The number was copied successfully". Pasting gives that number. |
| **Severity if Failed** | LOW |

---

**TC-J-03 — Media and file counts**

| | |
|---|---|
| **Steps** | 1. Open the drawer and look at the row with the image, video and file icons. |
| **Expected Result** | First a spinner, then three numbers. They match the number of images, videos and files in that chat. |
| **Severity if Failed** | MEDIUM |

---

**TC-J-04 — Media and files list**

| | |
|---|---|
| **Steps** | 1. Click "Media & Files". 2. Switch between the Image, Video and File tabs. |
| **Expected Result** | Each tab shows items of that type from this chat. Only the **newest 10** are listed per tab, even when the count above is higher — that is how the app asks for them. Clicking an item opens it in a new browser tab. |
| **Severity if Failed** | MEDIUM |

---

**TC-J-05 — Start a call from the drawer**

| | |
|---|---|
| **Steps** | 1. Click **Call**, and later **Video**. |
| **Expected Result** | The drawer closes and the call starts, the same as from the top bar buttons. |
| **Severity if Failed** | HIGH |

---

**TC-J-06 — Search from the drawer**

| | |
|---|---|
| **Steps** | 1. Click **Search** in the drawer. |
| **Expected Result** | The drawer closes and the search bar opens inside the conversation. |
| **Severity if Failed** | MEDIUM |

---

**TC-J-07 — Block a user**

| | |
|---|---|
| **Steps** | 1. Click **Block**. |
| **Expected Result** | A spinner shows, then the button reads **UnBlock**. The message box at the bottom of the chat is replaced by the line "You cannot send messages or calls to this user". |
| **Severity if Failed** | HIGH |

---

**TC-J-08 — Calls to a blocked user are refused**

| | |
|---|---|
| **Precondition** | The user is blocked. |
| **Steps** | 1. Try the voice call and the video call buttons at the top. |
| **Expected Result** | A red error appears: "You cannot send messages or calls to this user". No call starts. |
| **Severity if Failed** | HIGH |

---

**TC-J-09 — Unblock a user**

| | |
|---|---|
| **Steps** | 1. Open the drawer. 2. Click **UnBlock**. |
| **Expected Result** | The message box comes back and messages can be sent again. |
| **Severity if Failed** | HIGH |

---

**TC-J-10 — Delete the chat from the drawer**

| | |
|---|---|
| **Steps** | 1. Click **Delete Chat**. |
| **Expected Result** | The drawer and the conversation close, and the chat leaves the list. Reload to confirm it is really gone. |
| **Severity if Failed** | HIGH |

---

**TC-J-11 — The photo strip slides, and there is no "Save To Gallery" row**

| | |
|---|---|
| **Steps** | 1. Open the details drawer of a chat with 4 or more photos. 2. On a phone, swipe the photo strip left and right. 3. On a computer, press the mouse on the strip and drag it left and right. 4. Look below the strip. |
| **Expected Result** | The strip moves with the finger and with the mouse drag. There is no "Save To Gallery" / "Never" row. A web page cannot save photos to the phone gallery, so the row was removed. |
| **Severity if Failed** | LOW |

---

### GROUP K — Voice and video calls

**Read this before you start.** Every test in this group needs **two separate
devices**, one for User A and one for User B. One device cannot hold both sides
of a call: the app that gets the camera and the microphone first keeps them, so
a second tab or window on the same machine is left with no sound and no picture.
A failure you see that way is not a bug in the app.

Both devices must be in the same room only if you want to hear the sound
yourself. If they are, use headphones on one of them, or the two microphones
will pick each other up.

---

**TC-K-01 — Start a voice call**

| | |
|---|---|
| **Steps** | 1. Open a chat. 2. Click the phone icon at the top right. 3. Allow the microphone. |
| **Expected Result** | A full black call screen opens with the other person's photo and the word "Calling ...". |
| **Severity if Failed** | CRITICAL |

---

**TC-K-02 — Microphone refused**

| | |
|---|---|
| **Steps** | 1. Block the microphone. 2. Try to start a voice call. |
| **Expected Result** | A red error appears: "Please enable permissions (camera,mic) to use calls features". No call screen. |
| **Severity if Failed** | HIGH |

---

**TC-K-03 — The other side sees the incoming call**

| | |
|---|---|
| **Steps** | 1. Start a voice call to User B. 2. Watch User B's screen. |
| **Expected Result** | A bar appears at the top with the caller photo, the line "Incoming Voice Call.." and two round buttons: green to accept, red to refuse. A ringtone plays and repeats. |
| **Severity if Failed** | CRITICAL |

---

**TC-K-04 — Answer a call**

| | |
|---|---|
| **Steps** | 1. As User B, click the green button. 2. Allow the microphone. |
| **Expected Result** | The ringtone stops, the call screen opens on both sides, and the timer starts counting. Both sides can hear each other. |
| **Severity if Failed** | CRITICAL |

---

**TC-K-05 — Refuse a call**

| | |
|---|---|
| **Steps** | 1. As User B, click the red button. |
| **Expected Result** | The ringtone stops and the bar closes. The caller's call screen closes too. Both sides see the call in the chat and in the Calls tab. |
| **Severity if Failed** | HIGH |

---

**TC-K-06 — Nobody answers**

| | |
|---|---|
| **Steps** | 1. Start a call and do not answer it. 2. Wait a little over one minute. |
| **Expected Result** | The call ends by itself after about **60 seconds**. The caller's screen closes. |
| **Severity if Failed** | HIGH |

---

**TC-K-07 — Mute during a voice call**

| | |
|---|---|
| **Steps** | 1. During a call, click the microphone button. 2. Speak. 3. Click it again and speak. |
| **Expected Result** | While muted the other side hears nothing, and the button clearly looks "off". After unmuting they hear you again. |
| **Severity if Failed** | HIGH |

---

**TC-K-08 — End a call**

| | |
|---|---|
| **Steps** | 1. During a call, click **End Call**. |
| **Expected Result** | The call screen closes on **both** sides. A call entry appears in the chat with the length of the call. |
| **Severity if Failed** | CRITICAL |

---

**TC-K-09 — The other side hangs up**

| | |
|---|---|
| **Steps** | 1. Ask User B to end the call. |
| **Expected Result** | Your call screen closes by itself, without any click. |
| **Severity if Failed** | HIGH |

---

**TC-K-10 — The 5-minute warning**

| | |
|---|---|
| **Steps** | 1. Keep a call running for more than 5 minutes. |
| **Expected Result** | From minute 5 a line appears: "Call End in 5 minute", and the number goes down each minute. |
| **Severity if Failed** | MEDIUM |

---

**TC-K-11 — Calls stop at 10 minutes**

| | |
|---|---|
| **Steps** | 1. Keep a call running for 10 minutes. |
| **Expected Result** | The call ends by itself at **10 minutes**, on both sides. |
| **Severity if Failed** | MEDIUM |

---

**TC-K-12 — Start a video call**

| | |
|---|---|
| **Steps** | 1. Click the video camera icon at the top right. 2. Allow camera and microphone. |
| **Expected Result** | The video call screen opens. After the other side answers, both see each other. |
| **Severity if Failed** | CRITICAL |

---

**TC-K-13 — Video call controls**

| | |
|---|---|
| **Steps** | 1. During a video call, use the microphone button and the camera button. |
| **Expected Result** | There are exactly **two** buttons plus End Call. Mute stops your sound. Camera off stops your picture for the other side; both sides see this at once. |
| **Severity if Failed** | HIGH |

---

**TC-K-14 — Calling someone who is already in a call**

| | |
|---|---|
| **Precondition** | This one needs a **third device** for User C, because two calls are open at the same time. |
| **Steps** | 1. Let User B and User C start a call and stay in it. 2. From User A, call User B. |
| **Expected Result** | You get a message that the user is in another call. Your call does not connect, and the call between User B and User C is not cut off. |
| **Severity if Failed** | MEDIUM |

---

**TC-K-15 — Call buttons are disabled at the right time**

| | |
|---|---|
| **Steps** | 1. Start a call. 2. While it is connecting, and while a call is ringing for you, look at the call buttons at the top of the chat. |
| **Expected Result** | They are faded and smaller, and clicking them starts nothing new. |
| **Severity if Failed** | MEDIUM |

---

**TC-K-16 — Calls tab shows the call log**

| | |
|---|---|
| **Steps** | 1. Open the **Calls** tab. |
| **Expected Result** | Grey placeholder rows first, then the calls, newest first. Each row shows the photo, the name, the call type, and the date. A call that was answered also shows its length as `mm:ss`. |
| **Severity if Failed** | HIGH |

---

**TC-K-17 — The call direction is right**

| | |
|---|---|
| **Steps** | 1. Make one call that is answered, one that you start and nobody answers, and one that comes in and you do not answer. 2. Open the Calls tab. |
| **Expected Result** | Three different labels with three different icons: "Outgoing Voice Call" for calls you started, "Incoming Voice Call" for answered calls that came in, and "Missed Voice Call" (red) for calls that came in and were never answered. A call **you** started and nobody answered must **not** be shown as missed. Video calls use the same three labels with "Video". |
| **Severity if Failed** | HIGH |

---

**TC-K-18 — Delete a call from the log**

| | |
|---|---|
| **Steps** | 1. Click the small delete icon on a call row. |
| **Expected Result** | The row disappears at once and stays gone after a reload. There is no confirm question. |
| **Severity if Failed** | MEDIUM |

---

**TC-K-19 — Loading older calls**

| | |
|---|---|
| **Precondition** | More than 20 calls in the log. |
| **Steps** | 1. Scroll the Calls tab to the bottom. |
| **Expected Result** | More calls load, with a spinner, and no call appears twice. |
| **Severity if Failed** | MEDIUM |

---

**TC-K-20 — Call messages in the conversation**

| | |
|---|---|
| **Steps** | 1. Make three calls with User B: one that is answered, one you start that nobody answers, and one from User B that you do not answer. 2. Open the conversation. |
| **Expected Result** | Each call is a message showing its direction, and its length when it was answered. Only the **missed** one — the call User B started and nobody answered — is red with the red icon. The answered call and your own unanswered call both look normal (green). Its only action is **Delete**, and the delete question offers only "For Me". |
| **Severity if Failed** | MEDIUM |

---

### GROUP L — Stories tab inside the chat window

---

**TC-L-01 — The stories list loads**

| | |
|---|---|
| **Steps** | 1. Open the **Stories** tab. |
| **Expected Result** | Grey placeholder rows first, then one row per user who has a story, with their photo and name. |
| **Severity if Failed** | MEDIUM |

---

**TC-L-02 — Open a story from the list**

| | |
|---|---|
| **Steps** | 1. Click a row. |
| **Expected Result** | The full-screen story viewer opens with that user's first unseen story. |
| **Severity if Failed** | HIGH |

---

**TC-L-03 — Loading more stories**

| | |
|---|---|
| **Steps** | 1. Scroll the Stories tab to the bottom. |
| **Expected Result** | More rows load with a spinner. When there are no more, the line "No more stories" is shown. |
| **Severity if Failed** | MEDIUM |

---

### GROUP M — The order chat (Delivery Worker)

This is a separate, smaller chat. It opens on the order details page, not from
the chat icon.

---

**TC-M-01 — The chat icon appears for an order that is out for delivery**

| | |
|---|---|
| **Precondition** | An order whose status is "out for delivery". |
| **Steps** | 1. Open that order's details page. |
| **Expected Result** | A chat icon is shown for that order. |
| **Severity if Failed** | HIGH |

---

**TC-M-02 — No chat icon for other order statuses**

| | |
|---|---|
| **Precondition** | An order that is still being prepared, or already delivered. |
| **Steps** | 1. Open its details page. |
| **Expected Result** | No chat icon. |
| **Severity if Failed** | MEDIUM |

---

**TC-M-03 — Open the order chat**

| | |
|---|---|
| **Steps** | 1. Click the order chat icon. |
| **Expected Result** | A chat panel opens on the right. The other side is named **Delivery Worker**, with no phone number. Old messages of that order are shown, oldest first. |
| **Severity if Failed** | HIGH |

---

**TC-M-04 — The chat icon for a return**

| | |
|---|---|
| **Precondition** | A return whose status is "out for return". |
| **Steps** | 1. Open the order details page for that return. |
| **Expected Result** | The chat icon is there and opens the chat for the return. |
| **Severity if Failed** | MEDIUM |

---

**TC-M-05 — Send a message in the order chat**

| | |
|---|---|
| **Steps** | 1. Send a text, then a photo, then a voice note. |
| **Expected Result** | All arrive on the delivery worker's side and stay after a reload. |
| **Severity if Failed** | HIGH |

---

**TC-M-06 — The order chat has fewer options**

| | |
|---|---|
| **Steps** | 1. Look at the top bar, then open the menu of a message. |
| **Expected Result** | There is **no video call** button, **no** chat details drawer, **no** in-chat search, and **no Forward** option. Only a voice call button. This is on purpose. |
| **Severity if Failed** | MEDIUM |

---

**TC-M-07 — Closing the order chat cleans the link**

| | |
|---|---|
| **Steps** | 1. Open the order chat. 2. Look at the address bar: it contains `chat_id=...`. 3. Close the chat and wait one second. |
| **Expected Result** | `chat_id` is removed from the address. The page does **not** reload and does **not** jump back to a previous page. |
| **Severity if Failed** | MEDIUM |

---

**TC-M-08 — A message from the delivery worker while you are elsewhere**

| | |
|---|---|
| **Steps** | 1. Leave the order page. 2. Ask the delivery worker (or a tester account playing that role) to send a message. |
| **Expected Result** | A notification appears with the name "Delivery Worker". Clicking it opens the order page with that chat already open. A red dot marks the order. |
| **Severity if Failed** | HIGH |

---

**TC-M-09 — A message while the order chat is open**

| | |
|---|---|
| **Steps** | 1. Keep the order chat open. 2. Ask the other side to send a message. |
| **Expected Result** | The message appears in the open chat. No notification box, because you are looking at it. |
| **Severity if Failed** | HIGH |

---

**TC-M-10 — Closing the order chat**

| | |
|---|---|
| **Steps** | 1. Click the back arrow at the top, and try the dark area outside as well. |
| **Expected Result** | The chat closes and the order page can be scrolled again. |
| **Severity if Failed** | MEDIUM |

---

### GROUP O — Errors and hard cases

---

**TC-O-01 — Reload with the chat open**

| | |
|---|---|
| **Steps** | 1. Open a conversation. 2. Reload the page. |
| **Expected Result** | The app comes back without an error. Nothing is lost, and no message is duplicated. |
| **Severity if Failed** | HIGH |

---

**TC-O-02 — Two tabs at once**

| | |
|---|---|
| **Steps** | 1. Open the site in two tabs with the same account. 2. Send a message in tab 1. 3. Look at tab 2. |
| **Expected Result** | Tab 2 does not break. Note what it shows — this is worth reporting either way. |
| **Severity if Failed** | MEDIUM |

---

**TC-O-03 — Log out**

| | |
|---|---|
| **Steps** | 1. Open the chat, read a message, then close the chat. 2. Open the user menu and log out. 3. Ask User B to send you a message. |
| **Expected Result** | The page reloads, or goes to the home page. The chat icon is gone, because a guest has no chat icon. No chat notification arrives after the logout. |
| **Severity if Failed** | HIGH |

---

**TC-O-04 — Log in again**

| | |
|---|---|
| **Steps** | 1. Log out and log in again. 2. Open the chat. |
| **Expected Result** | The chat list loads normally. If the app asks you to confirm your phone number a second time, the chat part of the sign-in did not work — report it with the exact message you see. |
| **Severity if Failed** | HIGH |

---

**TC-O-05 — Network lost and found**

| | |
|---|---|
| **Steps** | 1. Open a conversation. 2. Turn off the network for 30 seconds. 3. Turn it on again. 4. Send a message. |
| **Expected Result** | The app shows an error while offline, and works again after the network is back, without a reload. |
| **Severity if Failed** | HIGH |

---

**TC-O-06 — An empty account**

| | |
|---|---|
| **Precondition** | A new account with no chats and no contacts. |
| **Steps** | 1. Open the chat. |
| **Expected Result** | An empty list, no error, no endless spinner. The contacts screen shows its "No Contacts" text. |
| **Severity if Failed** | MEDIUM |

---

**TC-O-07 — A user with no photo**

| | |
|---|---|
| **Steps** | 1. Chat with a user who has no profile photo. |
| **Expected Result** | Everywhere their photo would be, you see the first two letters of their name instead, or a default picture. Never a broken image. |
| **Severity if Failed** | LOW |

---

**TC-O-08 — A user with no name**

| | |
|---|---|
| **Steps** | 1. Chat with a user who has no name set. |
| **Expected Result** | The row shows a fallback text like "User-<number>" or the phone number. It is never empty. |
| **Severity if Failed** | LOW |

---

## 9. Known gaps found in the code

These are **already known**. Do not spend time on them and do not open a bug for
them. They are listed so you know that what you see is not new.

1. **Read / Unread does nothing lasting.** The first chat row option only
   changes the screen. It sends nothing to the server, so the change is lost on
   reload. Its label is also wrong: it almost always reads "Read".
2. **Archive does nothing.** The fifth chat row option has no action behind it
   at all.
3. **Editing a message does not work.** The Edit option opens a window where you
   can change the text, but the save button ("Edt") has no action. Nothing is
   saved and nothing is sent. The same option also shows on **other people's**
   text messages, where editing should not be offered at all.
4. **Reminder and the category icon do nothing.** Both are in the message menu
   with no action behind them.
5. **The invite text has a placeholder.** The app-store link inside the invite
   message still ends with `your.app.id`, which is not a real app.

---

## 10. What to write in a bug report

For every failure, write:

1. The test case number, for example `TC-F-05`.
2. What you did, step by step.
3. What you expected, and what really happened.
4. The exact text of any error message on the screen.
5. Which account saw the problem (User A, User B or User C).
6. Browser, device and screen size.
7. Language (English, Arabic, Turkish, Kurdish).
8. A screenshot or a short screen recording. For a call problem, record both
   sides if you can.
