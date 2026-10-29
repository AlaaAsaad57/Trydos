# Chat and calls — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Web chat and web calls work end to end. But the mobile-app call pages leak the chat token, one of them cannot connect, production points at the staging chat host, and a few user-facing faults must be fixed first.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
A verified shopper taps the chat icon in the top bar (`components/Home/AuthNavSection.tsx` → `openChatAction`). The chat window opens with three tabs: Chats, Calls, Stories.
In a conversation the shopper sends text, photos, videos, files and voice notes. The shopper also manages each message and each chat (reply, edit, tag, reminder, pin, mute, archive, block, delete).
Voice and video calls run on Agora. Live events (new message, read, call) arrive as FCM pushes.
The order page opens a separate chat with the delivery worker. The mobile app opens the web call pages `/call_direct`, `/callInProg` and `/endCall`.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Verified shopper with notifications allowed taps the chat icon → chat window opens and loads chats, contacts and calls | chat | `components/Home/AuthNavSection.tsx:40`, `components/Chat/ChatModal.tsx`, `services/chat.ts` (`getChats`, `getContacts`, `getCalls`) | `tests/components/Home/AuthNavSection.test.tsx`, `tests/components/Chat/ChatModal.test.tsx`; e2e CHAT-01 |
| W-2 | Guest taps the chat icon → login opens. Signed-in shopper with no chat account → phone verify opens | — | `AuthNavSection.tsx:66-72` | e2e SCRIPT-29 |
| W-3 | Notifications not asked yet → the app asks first. Notifications denied → the chat stays shut and a toast says why | — | `services/home.ts:312` `getNotificationPermissionStatus`, `components/Home/Init.tsx` | e2e SCRIPT-27, SCRIPT-28 |
| W-4 | Top-bar icon and Chats tab show how many chats have unread messages | — | `chatsFunctions.tsx` `getNew`, `components/Chat/components/ChatWindowTabs.tsx` | `tests/components/Home/ChatNotification.test.tsx`, `ChatWindowTabs.test.tsx`; e2e SCRIPT-30 |
| W-5 | Chat list: pinned chats first, then newest. Archived chats left out. Skeleton while loading | chat | `components/Chat/pages/ChatLists.jsx` | `tests/components/Chat/pages/ChatLists.test.tsx`; e2e SCRIPT-31 |
| W-6 | Scroll to the end of the chat list → the next page of chats loads | chat | `components/Chat/components/GetMoreChats.tsx`, `store/chat/actions.tsx` `GetMyChannelsPage` | `GetMoreChats.test.tsx` |
| W-7 | Type in the list search → matching chats and other users (by name or phone) appear. Tap one → it opens | chat | `ChatSearchResults.tsx`, `store/chat/actions.tsx` `SearchContact` (`/api/v1/users/search/`) | `ChatListSearch.test.tsx`; e2e CHAT-02 |
| W-8 | Contacts tab → saved contacts, one row per person. Tap a contact → the existing chat opens, or a new empty chat starts | chat | `components/Chat/pages/ContactLists.jsx`, `chatSearch.ts` `dedupeContacts` | `tests/components/Chat/pages/ContactLists.test.tsx`; e2e CHAT-02 |
| W-9 | Add a contact by hand → saved, and the list refreshes. A number already saved is flagged with the saved name | chat | `ChatContactsUpload.tsx:140` (`/api/v1/users/save_contact_v2`) | `ChatContactsUpload.test.tsx` (BUG-1, BUG-chat-6, BUG-chat-7) |
| W-10 | Send a text (Enter or send button) → the bubble shows at once as "sending", then becomes the saved message | chat | `ConversationContainer.tsx` `sendTextMessage`, `store/chat/actions.tsx` `SendMessage` (`/api/v1/messages/send`), reducer `sendRealMessage` | `tests/store/chatSendMessage.test.ts`, `ConversationContainer.test.tsx`; e2e CHAT-03 |
| W-11 | Chat backend refuses a send with an error status → the bubble is taken back and a toast says "Failed to send message" | chat | `store/chat/actions.tsx` `SendMessage` catch → `deleteErrorMessage` | e2e SCRIPT-32 |
| W-12 | First message to a person with no chat yet → the backend creates the chat, and the list shows it with the real name | chat | `store/chat/actions.tsx:132-160`, reducer `sendNewMessage` | `chatSendMessage.test.ts` |
| W-13 | Send a photo → crop → preview → upload to the media server → message sent | media + chat | `ConversationContainer.tsx` `handleFileChange` / `handleImagePreviewSend`, `chatsFunctions.tsx:640` `uploadFile` (`/gated/chat/upload_file` with an upload ticket) | `ChatImagePreviewBeforeSend.test.tsx`, `ImageMessage.test.tsx` |
| W-14 | Send a video or any file → it uploads, with a cancel button on the bubble. A file over 25 MB, or a video format no browser plays, is refused before upload | media + chat | `ConversationContainer.tsx` `handleMediaMessage`, `chatsFunctions.tsx:677` `upload`, `videoSupport.ts`, `uploadCancel.ts` | `chatUploadSizeCap.test.ts`, `chatVideoFormatGate.test.ts`, `FileMessage.test.tsx`; e2e SCRIPT-40 |
| W-15 | Record a voice note → cancel it, or send it → uploaded and sent | media + chat | `ConversationContainer.tsx` `startNativeRecording`, `sendAudio` | `AudioMessage.test.tsx` |
| W-16 | Camera → take a photo or record a video (up to 59 s), switch front/back camera → preview → send | media + chat | `components/Chat/components/CameraComponent.tsx` | `CameraComponent.test.tsx` |
| W-17 | Tap an image or video → full-screen preview. Tap a file → download | media | `MediaMessagePreview.tsx`, `videoSupport.ts` `toDownloadUrl` | `MediaMessagePreview.test.tsx`, `videoMessageDownloadFallback.test.tsx`, `VideoMessagePlayIcon.test.ts` |
| W-18 | Reply to a message (menu or swipe) → the reply carries the quote. Tap a quote → the chat jumps to it, and loads older messages when needed | chat | `OptionsMenu.tsx`, `useMessageSwipe.ts`, `ConversationContainer.tsx` `GetMessage`, `getMessagesBetweenTwoMessages` | `ReplyMessage.test.tsx`, `useMessageSwipe.test.tsx`, `RepliedMessage/index.test.tsx`; e2e CHAT-05 |
| W-19 | Edit my own text message → saved; both sides see the new text and the "edited" mark. A refused edit keeps the old text and shows a toast | chat | `OptionsMenu.tsx` `submitEdit`, `store/chat/actions.tsx` `EditMessageApi` (`/api/v1/messages/update`) | `MessageOptionsEdit.test.tsx`, `OptionsMenu.test.tsx` (BUG-chat-9, BUG-chat-10); e2e CHAT-06, SCRIPT-38, SCRIPT-43 |
| W-20 | Delete a message for me, or for everyone (writer only) | chat | `OptionsMenu.tsx`, `store/chat/chatUtils.tsx:161` `DeleteMessage` (`/api/v1/messages/destroy`) | `DeletedMessage.test.tsx`; e2e CHAT-10, SCRIPT-38 |
| W-21 | Forward a text, image, voice, video, file or product message to another chat | chat | `chatsFunctions.tsx:263` `forwardMessage` | e2e CHAT-09 |
| W-22 | Copy a text message | — | `store/chat/chatUtils.tsx:178` `copyText` | `MessageMenuStacking.test.tsx` |
| W-23 | Tag a message (suggested or free text), then remove the tag | chat | `MessageTagPicker.tsx`, `store/chat/actions.tsx` `ToggleMessageTag` | `MessagePickers.test.tsx`; e2e CHAT-07 |
| W-24 | Set, move or cancel a reminder on a message. The Reminders folder lists them and opens the chat at the message. A due reminder shows a toast | chat | `MessageReminderPicker.tsx`, `RemindersList.tsx`, `store/chat/actions.tsx` `SetMessageReminder` / `CancelMessageReminder` / `GetMyReminders`, `utils/NotificationHandler.ts` `handleMessageReminder` | `RemindersList.test.tsx`, `MessagePickers.test.tsx`; e2e CHAT-08, SCRIPT-42 |
| W-25 | The other person types, records or picks a file → a status ("Typing..." and others) shows in the header and in the list | Firebase RTDB | `ConversationContainer.tsx` `handleTyping` / `sendStatus`, `services/chat.ts:193-221`, `TypingIndicator.js` | `ChatHeader.test.tsx` |
| W-26 | Read receipts: opening a chat sends `/watched`, a received message sends `/received`, and the sender's ticks update from the push | chat + FCM | reducer `watchChannel` / `receiveChannelEvent`, `services/chat.ts:40`, `NotificationHandler.ts` `ChannelWatchedEvent` / `ChannelReceivedEvent` | `tests/store/chat/reducer.test.ts`; e2e CHAT-04 |
| W-27 | Header shows "Online" or "last seen …" for the other person | chat + Firebase RTDB | `store/chat/actions.tsx` `setLastSeen` / `GetLastSeen`, `ChatHeader.tsx:46` | `ChatHeader.test.tsx` |
| W-28 | Scroll to the top of a conversation → older messages load, and the view keeps its place | chat | `ConversationContainer.tsx` `fetchOlderMessages`, `store/chat/actions.tsx` `getPage` | `ConversationContainer.test.tsx` (BUG-chat-4); e2e SCRIPT-41 |
| W-29 | Search inside a chat → jumps to the newest match first. Arrows walk to older and newer matches. A match outside the loaded window is loaded first | chat | `ChatSearch.tsx` (`/api/v1/channels/channelSearch`), reducer `setChatSearchRequest` | `ChatSearch.test.tsx`, `chatSearch.test.ts`; e2e SCRIPT-39 |
| W-30 | Chat details: photo gallery and media/files, copy the phone number, call / video / search shortcuts | chat | `ChatInfo.tsx`, `store/chat/actions.tsx` `GetChatDetails`, `getMedia` | `ChatInfo.test.tsx` |
| W-31 | Pin and unpin a chat | chat | `ChatOptions.tsx:54`, `store/chat/actions.tsx` `PinnChat` (`/api/v1/channels/update`), then a list reload | e2e CHAT-11 |
| W-32 | Mute and unmute a chat → a muted chat shows no message toast; a call still rings (mute silences messages only) | chat + FCM | `ChatOptions.tsx:69`, `MuteChat`, `NotificationHandler.ts` `isChannelMutedForMe`, `CallComponent.jsx` | `tests/utils/chatMuteNotifications.test.ts`, `tests/components/Chat/CallComponent.test.tsx`; e2e CHAT-12 |
| W-33 | Mark a chat unread, then read | chat | `ChatOptions.tsx:38`, `MarkChannelUnread`, reducer `watchChannel` | e2e CHAT-13 |
| W-34 | Archive and unarchive a chat. The Archived folder lists archived chats | chat | `ChatOptions.tsx:96`, `ArchiveChannel`, `GetArchivedChats`, `ArchivedChatsList.tsx` | e2e CHAT-14 |
| W-35 | Delete a chat (with a confirm box) → it is gone for me; the other person keeps it | chat | `ChatOptions.tsx:111`, `ChatInfo.tsx`, `store/chat/actions.tsx` `deleteChat` (`/api/v1/channels/destroy`) | `DeleteChatConfirm.test.tsx`; e2e CHAT-16 |
| W-36 | Block and unblock a person → the input is replaced by "You cannot send messages or calls to this user", and the call buttons refuse | chat | `ChatInfo.tsx:97-145` (`/api/v1/users/block/…`, `/unblock/…`), `ConversationContainer.tsx` `isBlockedEachOther` | `ChatInfo.test.tsx`; e2e CHAT-15, SCRIPT-36 |
| W-37 | A message arrives while the chat window is closed → a toast with sender, preview and picture. The list updates | FCM | `utils/NotificationHandler.ts` `handleChatMessage` | `chatMuteNotifications.test.ts`, `NewChatsSide.test.tsx` |
| W-38 | The other side edits, tags or deletes for everyone → my copy updates. This also works for compact pushes that carry only ids | FCM + chat | `NotificationHandler.ts` `handleUpdatingMessage`, `loadUpdatedMessage` | `chatMuteNotifications.test.ts` |
| W-39 | Product page → Share → pick contacts → the product goes out as a chat message, and a toast says "Product is Shared Successfully" | chat | `components/products/ShareButton.tsx`, `services/chat.ts:74` (`/api/v1/messages/share_product`) | `tests/components/products/ShareButton.test.tsx`, `ProductShareButton.test.tsx` |
| W-40 | Tap a shared product bubble → its menu opens and leads to the product | — | `messages/Types/ProductMessage.tsx` | `ProductMessage.test.tsx` (BUG-chat-11) |
| W-41 | Order page → chat icon → the chat with the delivery worker opens, or a new one starts. Text, media and voice calls work as in a normal chat | chat | `components/setting/orders/OrderDetailsWrapper.tsx:276` (`/api/v1/channels/orderChatParticipant/get-recipient`), `components/Chat/ChatWidget.tsx` | `OrderDetailsWrapper.test.tsx`, `tests/components/settings/OrderChatIcon.test.tsx` |
| W-42 | An order-chat message arrives while that chat is closed → a toast plus a red dot on the order | FCM | `NotificationHandler.ts:761-800` | none |
| W-43 | Start a voice call → mic permission, old calls ended, `/voice_call`, Agora join. Timer, mute and end work. The call ends by itself after 60 s with no answer. Warning at 5 min, hard end at 10 min | chat + Agora | `store/chat/callActions.ts` `makeVoiceCall`, `ChatVoiceCall.tsx`, `components/callDurationConstants.ts` | `ChatVoiceCall.test.tsx` (BUG-chat-5), `tests/store/chat/callActions.test.ts`, `callDurationConstants.test.ts` |
| W-44 | Start a video call → camera + mic, the same flow, camera on/off, switch camera | chat + Agora | `callActions.ts` `makeVideoCall`, `ChatVideoCall.tsx` | `ChatVideoCall.test.tsx` (BUG-chat-5), `callActions.test.ts` |
| W-45 | Incoming call → a bar with the caller and a ring tone. Answer → `agora_token` + `answer_call` → call screen. Decline → `end_call` + `refuse_call` | chat + FCM + Agora | `NotificationHandler.ts` `handleIncomingCall`, `CallComponent.jsx`, `callActions.ts` `AnswerCall` / `RefuseCall` / `Answer` | `CallComponent.test.tsx`, `callActions.test.ts` |
| W-46 | The call was already answered on another device → "Call Answered from another account", and the bar closes | chat | `callActions.ts` `AnswerCall` | `callActions.test.ts` |
| W-47 | A second call arrives during a call → the app tells the backend (`in_another_call`), and the caller sees "User In Another Call" | chat + FCM | `NotificationHandler.ts:595`, `callActions.ts` `InCall` | `callActions.test.ts` |
| W-48 | The other side hangs up or refuses → my call screen closes | FCM | `NotificationHandler.ts` `handleRefuseCall`, reducer `endCall` | `CallContainer.test.tsx` |
| W-49 | Calls tab → call history, newest first, more on scroll, delete one entry, badge for missed calls | chat | `pages/CallList.jsx`, `services/chat.ts:263` (`/api/v1/channels/my_calls`) | `CallList.test.tsx`, `CallItem.test.tsx`, `tests/services/chat.test.ts` (BUG-chat-1) |
| W-50 | Call bubbles in the conversation show missed / incoming / outgoing and the duration | — | `messages/Types/CallMessage.tsx` | `CallMessage.test.tsx` |
| W-51 | Stories tab → a paged list of people's stories. Tap → the story viewer opens | stories | `pages/StoriesList.tsx` (`/api/v1/stories/users_stories`) | `tests/components/Chat/pages/StoriesList.test.tsx` |
| W-52 | Chat token expired → exchange, wait 2 s, retry, and the list loads. Exchange refused → chat cookies cleared, and phone verify is asked | chat | `utils/fetchData.ts:98` `STALE_TOKENS_FOR`, `services/auth.ts` `RefreshSession` | e2e SCRIPT-34, SCRIPT-35 |

## ⚠️ Works, with limits
- **L-1 Chat needs push notifications.** The chat opens only when the browser has granted notifications (`ChatWindowModal.tsx:114`). A browser with no Notification API gets the "not supported" box and no chat. Examples: iPhone Safari when the site is not added to the Home Screen, and many in-app browsers. A shopper who denied notifications gets only a toast.
- **L-2 Contact sync works only on browsers with the Contact Picker API** (in practice Android Chrome). Other browsers get "Contacts API not supported on this browser" (`ChatContactsUpload.tsx:202`). Adding a contact by hand works everywhere.
- **L-3 In-chat search limits come from the chat backend.** Results are newest first. Only whole words of 3+ letters match, and Arabic never matches. The app asks for at most 100 matches and has no next page (`ChatSearch.tsx:122`). A failed search looks the same as "no results".
- **L-5 Calls have fixed limits.** An unanswered call ends after 60 s. Every call ends at 10 min, with a warning at 5 min (`components/callDurationConstants.ts`).
- **L-6 Every failed outgoing call says "User in Another Call"** (`store/chat/callActions.ts:85`, `:156`). This text shows even for a network or server error. The unit test `callActions.test.ts` expects this text.
- **L-7 Some actions change the screen first and never check the answer.** Delete message (`store/chat/actions.tsx:195`), delete chat (`:204`) and mute (`:308` + `ChatOptions.tsx:73`) do not undo the change when the backend refuses. The shopper sees success; the old state comes back after a reload.
- **L-8 Voice notes are saved under a wrong type.** The browser records in its own format (WebM in Chrome, MP4 in Safari). The app labels the file `audio/wav` and `.wav` (`ConversationContainer.tsx:833`, `:713`). Playback on the other device depends on that device's format support.
- **L-9 Camera video asks for WebM only, with no check** (`CameraComponent.tsx:90`). On a browser that cannot record WebM, `new MediaRecorder` throws. The timer runs, but no video is made. Videos stop at 59 s.
- **L-10 "Online" is approximate.** The app writes "last seen" only every 5 minutes, and only while the chat window is open (`pages/ChatWindow.tsx:23-30`). "Online" means "pinged in the last 5 minutes".
- **L-11 The Archived folder loads the first 50 chats only** (`store/chat/actions.tsx:719`). There is no next page.
- **L-12 Call history rows have no "call back".** The only action on a row is delete (`components/Chat/components/CallItem.tsx:29`).
- **L-13 Text typed in the list search is wiped when the chat list refreshes.** A pin, a share or an unknown push calls `getChats`. That makes a new `activeChat` object, and `ConversationContainer.tsx:505` clears the search. No test covers this (CHAT-APP-4).
- **L-14 Firebase listeners pile up.** Every `getChats` call adds one `onValue` listener per chat (`services/chat.ts:202`). Every chat opened from search adds one more (`store/chat/actions.tsx:47`). None is removed, so a long session holds many duplicate listeners.
- **L-15 A failed order-chat open shows no message from the app.** `OrderDetailsWrapper.tsx` `getChatWithShipping` only logs the error and stops the spinner.
- **L-16 A failed block or unblock is only logged** (`ChatInfo.tsx:113`, `:138`). The app adds no message of its own.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | The production chat backend URL is the same staging (`.dev`) host as preview and development | Production chat would read and write staging data | `.env.production` `NEXT_PUBLIC_CHAT_BACKEND_URL` (same value as `.env.preview` and `.env.development`) | Ops | Yes — no production chat backend is set |
| M-2 | The mobile-app call page leaks the chat bearer token. The token sits in the URL query. A "debug" button is always shown; it copies the full URL and shows it in an `alert`. The error panel prints the URL. `LogError` sends the token to Sentry | A "DEBUG" button on every call screen. The token is visible on screen and is stored in Sentry | `components/global/WebviewCall.tsx:312-336` (button), `:249` (panel), `:150` and `:190` (`token: data.authToken` sent to `LogError`) | Frontend + Mobile | Yes — security: a live credential reaches the screen, the clipboard and Sentry |
| M-3 | The mobile-app voice call uses a different Agora App ID from the other three call screens (the last character differs) | A voice call from the mobile app cannot join the Agora channel | `components/global/WebViewVoiceCall.tsx:26` vs `WebViewVideoCall.tsx:25`, `ChatVoiceCall.tsx:27`, `ChatVideoCall.tsx:30` | Frontend | Yes — when the mobile app still opens `/call_direct` for voice |
| M-4 | The Agora App ID is hardcoded in 4 files, not in config | Production would use the same Agora project as staging | the same 4 files as M-3 | Frontend + Ops | Yes — there is no way to point production at its own Agora project |
| M-5 | CHAT-APP-1: a send refused inside a 200 (`isSuccessful: false`) is neither swapped in nor taken back | The message stays as "sending" for ever, with no error | `store/chat/actions.tsx:132` (`if (response?.data?.id)` with no `else`) | Frontend | Yes — the shopper thinks a refused message is on its way |
| M-6 | The mobile-app call end pages are hardcoded English, with no translation key | "Call Answered from another Account" and "Call Ended." in English for every language | `app/(special)/callInProg/page.jsx:32`, `app/(special)/endCall/page.jsx:28` | Frontend | Yes — repo rule: every visible string is translated |
| M-7 | Other untranslated chat strings: "Recording..." and "Sending file..." have no keys and show raw to the receiver; "Delivery Worker" is not wrapped; "User" and "User-<id>" fallbacks; "Failed to upload file"; the dynamic key `Sent a ${messageType}` | English text inside an Arabic, Turkish or Kurdish chat | `ConversationContainer.tsx:910`, `:1231`, `:1267`; `OrderDetailsWrapper.tsx:317`, `:342`, `:346`; `NotificationHandler.ts:585`, `:587`, `:771`, `:745`; `chatsFunctions.tsx:50`, `:658`, `:703`; `ChatHeader.tsx:179` | Frontend | Yes — repo rule: every visible string is translated |
| M-8 | **Fixed 2026-10-29.** The Play Store link comes from `NEXT_PUBLIC_PLAY_STORE_URL` (BUG-chat-8); an empty value leaves the store line out. The invite text, the Telegram greeting and the share-sheet title are translation keys now. | — | `components/Chat/components/SearchResult.tsx` (`getTheApp`, `inviteText`, `telegramText`) | Frontend | No |
| M-9 | When adding a contact by hand fails, the app sends the contact's name and phone number to Sentry | Nothing on screen; personal data is stored in Sentry | `components/Chat/components/ChatContactsUpload.tsx:165-170` | Frontend | Yes — privacy: phone numbers must not reach logs |
| M-10 | CHAT-APP-2: the 3-pin limit never applies. Nothing fills `state.pinnedChats`, and `PinnChat` goes to the backend before the check | Any number of chats can be pinned | `store/chat/reducer.ts`, `components/Chat/components/ChatOptions.tsx` | Frontend | **Fixed 2026-10-29** — with 3 pinned, Pin is disabled on the other chats and a tap shows the translated toast |
| M-11 | CHAT-APP-3: when Firebase cannot get a push token, the app sets the notification flag to false | An open chat turns into "Please Enable Notification to use Chat", although permission is granted | `utils/firebaseInitv1.tsx:163` | Frontend | No — only devices where FCM fails, but those users lose chat |
| M-12 | A failed product share leaves the Share button busy. `ShareProduct` throws again, and `ShareButton` neither awaits it nor resets `shareLoading` | The Share button stays grey and does nothing until the page reloads | `components/products/ShareButton.tsx:47-58`, `services/chat.ts:108` | Frontend | No |
| M-13 | The "messages by tag" view is switched off with `{false && …}` | Tags can be set, but there is no way to list the tagged messages of a chat | `components/Chat/components/ChatInfo.tsx:323` | Product + Frontend | No |
| M-14 | The mobile-app call pages call the chat backend straight from the browser, with the token from the URL and no renewal. The access token lives 60 s; a call can run 10 min | Ending a long call may fail; the shopper then sees the raw error text | `components/global/WebViewActions.tsx`, `WebviewCall.tsx` `onDecline` | Frontend + Backend | No — confirm with the backend first (see the questions below) |

## 🔒 Must do before launch
- [ ] Set a production chat backend URL in `.env.production` (M-1).
- [ ] Remove the "debug" button and the URL/error panel from `WebviewCall.tsx`, and stop sending `authToken` to Sentry (M-2).
- [ ] Move the chat token out of the `/call_direct` URL, or agree a short-lived call-only token with the backend and mobile teams (M-2).
- [ ] Fix the Agora App ID in `WebViewVoiceCall.tsx`, and read the App ID from config for each environment (M-3, M-4).
- [ ] Take back a message refused inside a 200 and tell the shopper. Then remove `test.fail` from SCRIPT-33 (M-5).
- [ ] Translate the call end pages and the other chat strings in M-6 and M-7 (add the keys to `ar`, `tr` and `ku`).
- [x] Replace the `your.app.id` invite link with the real Play Store link (M-8, done 2026-10-29). Set `NEXT_PUBLIC_PLAY_STORE_URL` on every deployment.
- [x] Translate the invite text (M-8, done 2026-10-29). Proof: "the invite is in the app language" in `tests/components/Chat/components/SearchResult.test.tsx`, seen red first.
- [ ] Remove the name and phone number from the contact-save error log (M-9).

## ❓ Needs confirmation from the backend team
- Which chat backend host and which Agora project (App ID and certificate) will production use?
- Does `POST /api/v1/messages/send` ever answer 200 with `isSuccessful: false`? In which cases? (M-5)
- Do `/api/v1/messages/destroy`, `/api/v1/channels/destroy` and `/api/v1/channels/update` (mute) refuse inside a 200? The app does not check their answers (L-7).
- Does the backend enforce a pin limit? If yes, what is the number? (M-10)
- The voice call body nests the payload twice (`payload.payload`, `callActions.ts` `makeVoiceCall`); the video call body does not. Which shape is the contract?
- The app sends `role_id: 16` to `my_channels` (`services/chat.ts:163`, `store/chat/actions.tsx` `GetMyChannelsPage`). What does it mean, and is it the same in production?
- When the caller's 60-second timer ends an unanswered call, does the backend push `RefuseCallEvent` to the callee, so the ring stops?
- Does the mobile app still open `/call_direct` for voice and video calls? Do `end_call` and `refuse_call` accept an access token older than 60 s? (M-3, M-14)
- `channelSearch`: is Arabic support planned? (L-3)
- Do the media server and the mobile app play voice notes that are WebM or MP4 inside but named `.wav`? (L-8)
- Live chat events come only through FCM pushes (there is no socket). What delivery delay is expected in production?

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/components/Chat/`: `CallComponent.test.tsx`, `CallItem.test.tsx`, `CallList.test.tsx`, `CallMessage.test.tsx`, `ChatModal.test.tsx`, `chatSearch.test.ts`, `ChatSearch.test.tsx`, `chatUploadSizeCap.test.ts` (BUG-chat-2, BUG-chat-3), `chatVideoFormatGate.test.ts`, `ChatWidget.test.tsx`, `ChatWindowModal.test.tsx`, `DeleteChatConfirm.test.tsx`, `MessageMenuStacking.test.tsx`, `MessageOptionsEdit.test.tsx`, `videoMessageDownloadFallback.test.tsx`, `VideoMessagePlayIcon.test.ts`
- `tests/components/Chat/components/`: `CameraComponent`, `ChatContactsUpload` (BUG-1, BUG-chat-6, BUG-chat-7), `ChatHeader`, `ChatImagePreviewBeforeSend`, `ChatInfo`, `ChatItem`, `ChatListSearch`, `ChatMessage`, `ChatVideoCall` (BUG-chat-5), `ChatVoiceCall` (BUG-chat-5), `ChatWindowTabs`, `GetMoreChats`, `LastMessageBody`, `MediaMessagePreview`, `NewChatsSide`, `OptionsMenu` (BUG-chat-9, BUG-chat-10), `RemindersList`, `ReplyMessage`, `SearchResult`, `TaggedMessages`, and `messages/` (`DeletedMessage` BUG-chat-14, `MessageHoverDates`, `MessagePickers`, `RepliedMessage/index` BUG-chat-12 and BUG-chat-13, `Types/AudioMessage`, `Types/FileMessage`, `Types/ImageMessage`, `Types/ProductMessage` BUG-chat-11, `useMessageSwipe`)
- `tests/components/Chat/pages/`: `CallContainer`, `ChatLists`, `ChatWindow`, `ContactLists`, `ConversationContainer` (BUG-chat-4), `StoriesList`
- `tests/store/chat/reducer.test.ts`, `tests/store/chat/callActions.test.ts`, `tests/store/chat/chatUtils.test.tsx`, `tests/store/chatSendMessage.test.ts`, `tests/services/chat.test.ts` (BUG-chat-1)
- `tests/utils/chatMuteNotifications.test.ts`, `tests/utils/firebaseInitv1.test.ts`, `tests/utils/firebaseMessagingSwTags.test.ts`, `tests/components/callDurationConstants.test.ts`
- `tests/components/Home/AuthNavSection.test.tsx`, `tests/components/Home/ChatNotification.test.tsx`, `tests/components/products/ShareButton.test.tsx`, `tests/components/setting/orders/OrderDetailsWrapper.test.tsx`, `tests/components/settings/OrderChatIcon.test.tsx`, `tests/app/special/routes.test.tsx` (the call end pages render)

**Expected-failure markers:**
- `tests/components/Chat/components/SearchResult.test.tsx` — **BUG-chat-8** (Play Store link from the env, M-8). Fixed 2026-10-29; now a normal passing test.
- `tests/e2e/chat.scripted.spec.ts:416` — `test.fail` **CHAT-APP-1** in SCRIPT-33 (send refused inside a 200, M-5).

**Browser (Playwright):**
- `tests/e2e/chat.live.spec.ts` — CHAT-01 to CHAT-16 (staging, Shopper A and Shopper B): sign in and open, find by phone, send, read receipt, reply, edit, tag, reminder, forward, delete, pin, mute, unread, archive, block, delete chat.
- `tests/e2e/chat.scripted.spec.ts` — SCRIPT-27 to SCRIPT-43 (mocked backend): notification gate, unread count, list order, refused sends, token renewal, blocked chat, pin limit, edit and delete rights, search order, 25 MB cap, older messages, Reminders folder, refused edit.

**Important cases with NO test:**
- No browser test places, answers or ends a voice or video call. The unit tests mock Agora, so a real join (and the wrong App ID in M-3) is never exercised.
- `components/global/WebviewCall.tsx`, `WebViewVoiceCall.tsx`, `WebViewVideoCall.tsx` and `WebViewActions.tsx` have no unit test. The route test mocks `WebviewCall`.
- No browser test sends a photo, video, file, voice note or camera capture.
- No test covers CHAT-APP-3 (an FCM failure turns the chat into the notification gate, M-11) or CHAT-APP-4 (the list search text is wiped, L-13).
- No test covers the order-chat push with its deep link and red dot (W-42), the busy Share button after a failure (M-12), or presence timing (L-10).
