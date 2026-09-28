// What a shopper does in the chat: open it, find a person, and send, reply to,
// edit, tag, remind, forward and delete messages; pin, mute, archive, mark
// unread, block and delete whole chats.
//
// **1. Judge the network, not only the screen.** Every chat call is a POST to
// the one address `/api/proxy`, carrying `x-proxy-server` (the chat service's
// wire token) and `x-proxy-url` (the chat backend's path). Most chat writes are
// optimistic: the screen changes before the backend answers, and nothing
// changes back when it refuses. So every write here is judged by what the chat
// backend answered, and only then by what the screen shows.
//
// **2. A 200 is not always a yes.** The chat backend can answer `200` with
// `isSuccessful: false` and an error in `message` (measured on
// `PUT /api/v1/users/{id}`, 2026-09-27). `fetchData` calls any 2xx a success.
// So `watchChatCall` reads the body flag as well as the status, and a refusal
// inside a 200 is reported as the refusal it is.
//
// **3. A 401 is the first half of a renewal.** The chat access token lives 60
// seconds. On a 401 the app exchanges the chat pair, waits 2 seconds and sends
// the call again. The first answer that is not a 401 is the real one.
//
// **4. What a message may print.** The endpoint, the status and the chat
// backend's own error text — never a message body the shopper typed, never a
// phone number. Everything printed goes through `redact()`.

import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";

import { redact } from "../harness/redact";
import { waitForRenewalSettled } from "../harness/renewalGate";
import { chat } from "../selectors";

/** The chat service's wire name on `/api/proxy`.
 *
 *  Taken from `utils/serviceTokens.ts`, where the mapping lives. Written out
 *  rather than imported so this test file has no import into app code, the
 *  same as `MARKET_SERVICE_TOKEN` in `actions/wishlist.ts`. */
export const CHAT_SERVICE_TOKEN = "p9xtrb";

/** The chat backend paths this journey drives, as they appear in
 *  `x-proxy-url`. `store/chat/actions.tsx` and `services/chat.ts` build them. */
export const CHAT_ENDPOINT = {
  channels: "/api/v1/channels/my_channels",
  send: "/api/v1/messages/send",
  edit: "/api/v1/messages/update",
  destroyMessage: "/api/v1/messages/destroy",
  destroyChannel: "/api/v1/channels/destroy",
  /** Pin and mute: one call, the body says which. */
  channelUpdate: "/api/v1/channels/update",
  userSearch: "/api/v1/users/search/",
  channelSearch: "/api/v1/channels/channelSearch",
  myReminders: "/api/v1/messages/reminders",
  block: "/api/v1/users/block/",
  unblock: "/api/v1/users/unblock/",
  tags: (messageId: string | number) => `/api/v1/messages/${messageId}/tags`,
  setReminder: (messageId: string | number) =>
    `/api/v1/messages/${messageId}/reminders`,
  cancelReminder: (reminderId: string | number) =>
    `/api/v1/messages/reminders/${reminderId}`,
  archive: (channelId: string | number) =>
    `/api/v1/channels/${channelId}/archive`,
  unread: (channelId: string | number) =>
    `/api/v1/channels/${channelId}/unread`,
  watched: (channelId: string | number) =>
    `/api/v1/channels/${channelId}/watched`,
} as const;

/** The chat backend, as a failure names it. */
const CHAT_BACKEND = "the chat backend";

/** What one watched chat call answered. */
export type ChatCallOutcome = {
  /** The status the app finally saw: the first answer that is not a 401, or
   *  401 when only 401s came, or 0 when no call was seen at all. */
  status: number;
  /** A 2xx whose body did not say `isSuccessful: false`. */
  accepted: boolean;
  /** Ready to put in a message: redacted, names the backend and the endpoint,
   *  and quotes the backend's own error text when there is one. */
  said: string;
  /** `data` of the answer. Never printed — it holds names and messages. */
  data: any;
  /** The request body the app sent. Never printed, for the same reason. */
  sent: any;
};

const parseJson = (text: string | null | undefined): any => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** Watch for the chat call to `endpoint`, and report what it answered.
 *
 *  **Arm it BEFORE the action that triggers the call.** `waitForResponse`
 *  only sees responses that start after it is armed:
 *
 *      const answered = watchChatCall(page, { endpoint: CHAT_ENDPOINT.send });
 *      await chat.input(page).press("Enter");
 *      const outcome = await answered;
 *
 *  `endpoint` is matched as a substring of `x-proxy-url`, so pass the most
 *  specific path you have. `method` is the chat method (`x-proxy-method`),
 *  not the proxy's, which is always POST. */
export const watchChatCall = async (
  page: Page,
  options: {
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    timeout?: number;
    /** Tells two calls to one endpoint apart by the body the app sent —
     *  `my_channels` serves both the chat list and the Archived folder. */
    sentMatches?: (sent: any) => boolean;
  },
): Promise<ChatCallOutcome> => {
  const timeout = options.timeout ?? 30_000;
  let sawUnauthorised = false;

  const isOurs = (response: Response): boolean => {
    if (!response.url().includes("/api/proxy")) return false;
    // `headers()` and never `allHeaders()`: the latter carries the Cookie
    // header, which is the session.
    const headers = response.request().headers();
    if (headers["x-proxy-server"] !== CHAT_SERVICE_TOKEN) return false;
    const url = decodeURI(headers["x-proxy-url"] ?? "");
    if (!url.includes(options.endpoint)) return false;
    if (
      options.method &&
      (headers["x-proxy-method"] ?? "").toUpperCase() !== options.method
    ) {
      return false;
    }
    if (
      options.sentMatches &&
      !options.sentMatches(parseJson(response.request().postData()))
    ) {
      return false;
    }
    return true;
  };

  const response = await page
    .waitForResponse(
      (candidate) => {
        if (!isOurs(candidate)) return false;
        if (candidate.status() === 401) {
          sawUnauthorised = true;
          return false;
        }
        return true;
      },
      { timeout },
    )
    .catch(() => null);

  if (!response) {
    return {
      status: sawUnauthorised ? 401 : 0,
      accepted: false,
      data: null,
      sent: null,
      said: redact(
        sawUnauthorised
          ? `${CHAT_BACKEND} answered ${options.endpoint} with 401, and the app's chat token exchange did not recover it`
          : `no call to ${options.endpoint} reached ${CHAT_BACKEND} within ${timeout / 1000} seconds`,
      ),
    };
  }

  const status = response.status();
  const body = parseJson(await response.text().catch(() => null));
  const sent = parseJson(response.request().postData());
  // The proxy answers 503 when it cannot reach the service at all, and 400 /
  // 403 for its own refusals. Those are the proxy's words, not the chat
  // backend's, and must not be reported as the chat backend refusing.
  const refusedByProxy =
    response.headers()["x-proxy-error"] !== undefined || status === 503;
  const ok = status >= 200 && status < 300;
  const flaggedFailed = body?.isSuccessful === false;
  const backendWords =
    typeof body?.message === "string" && body.message ? `: "${body.message}"` : "";

  let said: string;
  if (refusedByProxy) {
    said = `the app's own proxy refused the call to ${options.endpoint} with ${status}, so ${CHAT_BACKEND} was never reached`;
  } else if (ok && flaggedFailed) {
    said = `${CHAT_BACKEND} answered ${options.endpoint} with ${status} but isSuccessful: false${backendWords}`;
  } else {
    said = `${CHAT_BACKEND} answered ${options.endpoint} with ${status}${ok ? "" : backendWords}`;
  }

  return {
    status,
    accepted: ok && !flaggedFailed && !refusedByProxy,
    data: body?.data ?? null,
    sent,
    said: redact(said),
  };
};

/** A chat call the journey needs to have worked. */
export const requireChatAccepted = (
  outcome: ChatCallOutcome,
  what: string,
): void => {
  expect(outcome.accepted, `${what}: ${outcome.said}`).toBe(true);
};

// ---------------------------------------------------------------------------
// Opening the chat
// ---------------------------------------------------------------------------

/** The browser a chat spec must run in.
 *
 *  The chat opens only when `Notification.permission` is "granted"
 *  (`ChatWindowModal.tsx`, `services/home.ts`). Playwright's default headless
 *  browser is the "headless shell", and it answers "denied" whatever
 *  permission the context grants — measured 2026-09-27 on Chromium 151, both
 *  with `permissions: ["notifications"]` and with `grantPermissions` for the
 *  app's own origin. Full Chromium in its new headless mode answers "granted"
 *  to the same grant. `playwright install chromium` (CI, `e2e-lane.yml`)
 *  installs both, so a spec opts in with
 *  `test.use({ channel: CHAT_BROWSER_CHANNEL })`. */
export const CHAT_BROWSER_CHANNEL = "chromium";

/** Make a context a browser the chat can open in. Call it before the first
 *  page of the context loads. Needs `CHAT_BROWSER_CHANNEL`.
 *
 *  **1. Notifications are granted**, as a shopper answering the browser's
 *  "Allow notifications?" prompt would.
 *
 *  **2. The browser has no push service.** Chromium ships without Google's
 *  push keys, so Firebase's `getToken` always fails in it. When it fails, the
 *  app sets its notification flag to false (`utils/firebaseInitv1.tsx:163`)
 *  and the open chat turns into "Please Enable Notification to use Chat" —
 *  a race that one run won and the next lost. A browser without
 *  `PushManager` is a real kind of browser, and the app already supports it:
 *  Firebase's `isSupported()` answers false, the token step is skipped, and
 *  the chat stays open (`firebaseInitv1.tsx:108-110`). So that is the browser
 *  these cases use. Push delivery itself is not covered by this suite; every
 *  case reads what the other person did by reloading the chat. */
export const prepareChatBrowser = async (
  context: BrowserContext,
): Promise<void> => {
  await context.grantPermissions(["notifications"]);
  await context.addInitScript(() => {
    delete (window as { PushManager?: unknown }).PushManager;
  });
};

/** The last 9 digits of a phone number — the same rule as `normalizePhone`
 *  in `components/Chat/chatSearch.ts`, because a number is stored with and
 *  without its country code. */
export const phoneKey = (phone: string | null | undefined): string => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
};

/** The direct chat, in a `my_channels` answer, whose other member has this
 *  phone. An order chat with the same person does not count. */
export const channelWithPhone = (
  channels: any[],
  phone: string,
): any | undefined =>
  channels.find(
    (channel) =>
      !channel?.order_chat_participant_id &&
      (channel?.channel_members ?? []).some(
        (member: any) =>
          phoneKey(member?.user?.mobile_phone) === phoneKey(phone),
      ),
  );

/** Wait until the app knows its chat user.
 *
 *  **Why this exists.** The nav chat icon reads `userChat` from the store at
 *  the moment of the click (`AuthNavSection.tsx`). The nav itself can already
 *  be drawn from the server's cookies while the store is still empty, and a
 *  click in that gap opens the phone-verify widget instead of the chat.
 *
 *  Five seconds after the starting settings load, the app asks the chat
 *  backend for the chat list — and only when the store holds a chat user
 *  (`services/home.ts`). So that call is the app's own proof that it is ready.
 *  Arm this before the navigation, and await it after. */
export const watchChatReady = (page: Page): Promise<boolean> =>
  page
    .waitForRequest(
      (request) =>
        request.url().includes("/api/proxy") &&
        request.headers()["x-proxy-server"] === CHAT_SERVICE_TOKEN &&
        decodeURI(request.headers()["x-proxy-url"] ?? "").includes(
          CHAT_ENDPOINT.channels,
        ),
      { timeout: 45_000 },
    )
    .then(() => true)
    .catch(() => false);

/** The main chat list's request — not the Archived folder's
 *  (`GetArchivedChats` sends `archived: true` to the same endpoint). */
export const isMainListRequest = (sent: any): boolean =>
  sent?.archived !== true;

/** Open the chat window from the nav icon, and read the chat list.
 *
 *  Asserts that the window opened past the notification gate and that the
 *  chat backend answered the list. Returns the list the backend sent. */
export const openChat = async (
  page: Page,
): Promise<{ channels: any[]; pinned: any[]; outcome: ChatCallOutcome }> => {
  const opened = await attemptOpenChat(page);
  requireChatAccepted(opened.outcome, "the chat list did not load");
  await waitForListLoaded(page);
  return opened;
};

/** Wait until the app has finished taking in the chat list.
 *
 *  **Why the answer alone is not enough.** The app holds the list back while
 *  it tells the chat backend which unread chats arrived (`/received`, one
 *  round trip), and only then stores it. Storing it resets the active chat,
 *  and that clears the search box (`ConversationContainer.tsx`, the effect on
 *  `activeChat`) — so text typed in that gap is wiped. Measured: CHAT-02
 *  typed a phone number, and the box was empty 15 seconds later. The folder
 *  rows are drawn only once loading is over (`ChatLists.jsx`), so they are
 *  the signal. */
const waitForListLoaded = async (page: Page): Promise<void> => {
  await expect(
    chat.remindersFolder(page),
    "the chat backend answered the chat list, but the chat never finished loading it",
  ).toBeVisible();
};

/** `openChat` without judging the list: returns what the chat backend said. */
const attemptOpenChat = async (
  page: Page,
): Promise<{ channels: any[]; pinned: any[]; outcome: ChatCallOutcome }> => {
  const listed = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.channels,
    method: "POST",
    // Not the Archived folder's call, which asks the same endpoint.
    sentMatches: isMainListRequest,
  });
  await chat.navIconAny(page).first().click();

  await expect(
    chat.window(page),
    "the chat window did not open from the nav chat icon",
  ).toBeVisible();
  await expect(
    chat.notificationGate(page),
    "the chat window opened on 'Please Enable Notification to use Chat' although the browser granted notifications",
  ).toHaveCount(0);

  const outcome = await listed;
  return {
    channels: outcome.data?.channels ?? [],
    pinned: outcome.data?.pinned_channels ?? [],
    outcome,
  };
};

/** Reload the page and open the chat again — how a case reads what the
 *  backend really kept, and what the other person did.
 *
 *  Waits for any token renewal first (`harness/renewalGate.ts`: a reload
 *  cancels a renewal in flight, and the shopper becomes a guest), and for the
 *  app to know its chat user before the click (`watchChatReady`). */
export const reloadAndOpenChat = async (
  page: Page,
): Promise<{ channels: any[]; pinned: any[]; outcome: ChatCallOutcome }> => {
  const reloadOnce = async () => {
    await waitForRenewalSettled(page);
    const ready = watchChatReady(page);
    await page.reload({ waitUntil: "load" });
    expect(
      await ready,
      "after the reload the app never asked the chat backend for the chat list, so it does not know its chat user — the chat session did not survive the reload",
    ).toBe(true);
    return await attemptOpenChat(page);
  };

  let opened = await reloadOnce();
  // **One more read, only when the proxy could not reach the chat backend.**
  // A read may retry; a write never does (tests/e2e/README.md, rule 5). The
  // proxy answers 503 when its own fetch throws — measured three times on
  // 2026-09-27 as `TypeError: fetch failed` between the app's server and the
  // chat backend, with the next call fine. A refusal *from* the chat backend
  // is never retried: that is an answer, and it is judged as one.
  if (opened.outcome.status === 503) {
    await page.waitForTimeout(3_000);
    opened = await reloadOnce();
  }
  requireChatAccepted(opened.outcome, "the chat list did not load");
  await waitForListLoaded(page);
  return opened;
};

/** Cut the page off from the chat's Firebase realtime database.
 *
 *  For scripted cases only. The chat writes "last seen" there for its user
 *  (`setLastSeen`, `ConnectStatus/<id>`), and the database is one shared
 *  project hard-coded in `utils/firebaseInitv1.tsx` — there is no staging copy.
 *  A faked chat user would write a fake key into it. Reads of typing status
 *  are cut too; no scripted case is about them. */
export const cutRealtimeDatabase = async (
  context: BrowserContext,
): Promise<void> => {
  const realtime = /firebasedatabase\.app|firebaseio\.com/;
  await context.routeWebSocket(realtime, (socket) => socket.close());
  await context.route(realtime, (route) => route.abort());
};

/** Close the chat window with its own X. */
export const closeChat = async (page: Page): Promise<void> => {
  await chat.closeButton(page).click();
  await expect(chat.window(page), "the chat window did not close").toHaveCount(
    0,
  );
};

// ---------------------------------------------------------------------------
// Finding a person and opening the conversation
// ---------------------------------------------------------------------------

/** Search the chat list for a phone number and open the conversation it
 *  finds.
 *
 *  The search draws the existing chat with that person when there is one,
 *  and the person as a contact when there is not (`chatSearch.ts`). Either
 *  opens the same conversation screen — a contact opens a `ch-<user id>`
 *  placeholder that becomes a real chat with the first message.
 *
 *  Returns which of the two it was, and the chat id the screen shows. */
export const openConversationByPhone = async (
  page: Page,
  options: { phone: string; who: string },
): Promise<{ via: "chat" | "contact"; chatId: string }> => {
  const searched = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.userSearch,
    method: "GET",
  });
  await chat.listSearch(page).fill(phoneKey(options.phone));
  const outcome = await searched;
  requireChatAccepted(outcome, `searching the chat for ${options.who}`);

  const found = chat.rows(page).or(page.getByTestId("ContactItem"));
  await expect(
    found.first(),
    `searching the chat by ${options.who}'s phone showed neither a chat nor a contact`,
  ).toBeVisible();
  await expect(
    found,
    `searching the chat by ${options.who}'s phone showed more than one row, so the test cannot tell which one is ${options.who}`,
  ).toHaveCount(1);

  const via = (await chat.rows(page).count()) > 0 ? "chat" : "contact";
  if (via === "chat") await chat.rows(page).first().click();
  else
    await page
      .getByTestId("ContactItem")
      .first()
      .locator(".chat-conversation-item")
      .click();

  await expect(
    chat.conversation(page),
    `the conversation with ${options.who} did not open`,
  ).toHaveAttribute("data-open", "true");
  const chatId = (await chat.conversation(page).getAttribute("data-chat-id")) ?? "";
  return { via, chatId };
};

/** Open the conversation whose chat row has this id, from the main list. */
export const openConversationById = async (
  page: Page,
  options: { chatId: string | number; who: string },
): Promise<void> => {
  const row = chat.row(page, options.chatId);
  await expect(
    row,
    `the chat list has no row for the chat with ${options.who} (chat ${options.chatId})`,
  ).toBeVisible();
  await row.click();
  await expect(
    chat.conversation(page),
    `the conversation with ${options.who} did not open from its row`,
  ).toHaveAttribute("data-open", "true");
  await expect(chat.conversation(page)).toHaveAttribute(
    "data-chat-id",
    String(options.chatId),
  );
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** Type a message and send it. Returns what the chat backend answered.
 *
 *  A separate `attempt` because a scripted case sends to a backend that is
 *  meant to refuse, and needs the outcome rather than a failure. */
export const attemptSendText = async (
  page: Page,
  options: { text: string; how?: "enter" | "button" },
): Promise<ChatCallOutcome> => {
  const sent = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.send,
    method: "POST",
  });
  await chat.input(page).fill(options.text);
  if (options.how === "button") await chat.sendButton(page).click();
  else await chat.input(page).press("Enter");
  return await sent;
};

/** Send a text message and prove it landed.
 *
 *  Landed means three things, each its own check: the chat backend accepted
 *  it and gave it an id, the screen shows the text, and the row the text is
 *  in now carries that id — the local "sending" id is gone. */
export const sendText = async (
  page: Page,
  options: { text: string; who: string; how?: "enter" | "button" },
): Promise<{ messageId: string; channelId: string; outcome: ChatCallOutcome }> => {
  const outcome = await attemptSendText(page, options);
  requireChatAccepted(outcome, `sending a message to ${options.who}`);

  const messageId = String(outcome.data?.id ?? "");
  const channelId = String(outcome.data?.channel_id ?? "");
  expect(
    messageId,
    `${CHAT_BACKEND} accepted the message but its answer carried no message id`,
  ).not.toBe("");

  const row = chat.message(page, messageId);
  await expect(
    row,
    `the chat backend saved message ${messageId}, but the conversation never showed a row with that id — the message stayed on its local "sending" id`,
  ).toBeVisible();
  await expect(
    chat.messageText(row),
    `message ${messageId} shows in the conversation, but not with the text that was sent`,
  ).toHaveText(options.text);
  return { messageId, channelId, outcome };
};

/** Open the menu of one message. The menu shows while its bubble is
 *  clicked and hovered, and closes on mouse-out. */
export const openMessageMenu = async (
  page: Page,
  options: { messageId: string | number },
): Promise<Locator> => {
  const row = chat.message(page, options.messageId);
  await row.scrollIntoViewIfNeeded();
  await chat.messageBubble(row).first().click();
  await expect(
    row.locator(".abs-menu"),
    `clicking message ${options.messageId} did not open its menu`,
  ).toBeVisible();
  return row;
};

/** Reply to a message: menu → Reply, then send. Returns the reply's send. */
export const replyTo = async (
  page: Page,
  options: { messageId: string | number; text: string; who: string },
): Promise<{ messageId: string; outcome: ChatCallOutcome }> => {
  const row = await openMessageMenu(page, options);
  await chat.menuReply(row).click();
  await expect(
    chat.replyPreview(page),
    "pressing Reply did not show the quoted message above the input",
  ).toBeVisible();
  const { messageId, outcome } = await sendText(page, {
    text: options.text,
    who: options.who,
  });
  return { messageId, outcome };
};

/** Edit one of the shopper's own text messages. */
export const editMessage = async (
  page: Page,
  options: { messageId: string | number; text: string },
): Promise<ChatCallOutcome> => {
  const row = await openMessageMenu(page, options);
  await chat.menuEdit(row).click();
  await expect(
    chat.editDialog(page),
    "pressing Edit did not open the edit window",
  ).toBeVisible();
  await chat.editInput(page).fill(options.text);

  const saved = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.edit,
    method: "POST",
  });
  await chat.editSave(page).click();
  return await saved;
};

/** Toggle one tag on a message, then close the tag window. */
export const toggleTag = async (
  page: Page,
  options: {
    messageId: string | number;
    tag: "urgent" | "important" | "todo" | "done";
  },
): Promise<ChatCallOutcome> => {
  const row = await openMessageMenu(page, options);
  await chat.menuTag(row).click();
  await expect(
    chat.tagPicker(page),
    "pressing Tag did not open the tag window",
  ).toBeVisible();

  const tagged = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.tags(options.messageId),
    method: "POST",
  });
  await chat.tag(page, options.tag).click();
  const outcome = await tagged;
  await page.keyboard.press("Escape");
  await expect(chat.tagPicker(page)).toHaveCount(0);
  return outcome;
};

/** Set a reminder on a message with one of the quick choices. */
export const setReminder = async (
  page: Page,
  options: { messageId: string | number; preset: "20m" | "1h" | "3h" | "tomorrow" },
): Promise<ChatCallOutcome> => {
  const row = await openMessageMenu(page, options);
  await chat.menuReminder(row).click();
  await expect(
    chat.reminderPicker(page),
    "pressing Reminder did not open the reminder window",
  ).toBeVisible();

  const set = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.setReminder(options.messageId),
    method: "POST",
  });
  await chat.reminderPreset(page, options.preset).click();
  const outcome = await set;
  if (!outcome.accepted) await page.keyboard.press("Escape");
  return outcome;
};

/** Cancel the reminder a message carries, from the reminder window. */
export const cancelReminder = async (
  page: Page,
  options: { messageId: string | number },
): Promise<ChatCallOutcome> => {
  const row = await openMessageMenu(page, options);
  await chat.menuReminder(row).click();
  await expect(
    chat.reminderCancel(page),
    "the reminder window offers no 'Cancel reminder' for a message that has one",
  ).toBeVisible();

  const cancelled = watchChatCall(page, {
    endpoint: "/api/v1/messages/reminders/",
    method: "DELETE",
  });
  await chat.reminderCancel(page).click();
  const outcome = await cancelled;
  if (!outcome.accepted) await page.keyboard.press("Escape");
  return outcome;
};

/** Delete a message, for everyone or only for the shopper. */
export const deleteMessage = async (
  page: Page,
  options: { messageId: string | number; forAll: boolean },
): Promise<ChatCallOutcome> => {
  const row = await openMessageMenu(page, options);
  await chat.menuDelete(row).click();
  const dialog = chat.deleteDialog(page);
  await expect(
    dialog,
    "pressing Delete did not ask 'Do you want to delete this message?'",
  ).toBeVisible();

  const deleted = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.destroyMessage,
    method: "POST",
  });
  if (options.forAll) await chat.deleteChoice(page, "for-all").click();
  else await chat.deleteForMe(page).click();
  return await deleted;
};

/** Forward a message to another chat, picked from the list. */
export const forwardMessage = async (
  page: Page,
  options: { messageId: string | number; toChatId: string | number },
): Promise<ChatCallOutcome> => {
  const row = await openMessageMenu(page, options);
  const sent = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.send,
    method: "POST",
  });
  await chat.menuForward(row).click();
  const target = chat.row(page, options.toChatId);
  await expect(
    target,
    `pressing Forward did not show the chat list to pick chat ${options.toChatId} from`,
  ).toBeVisible();
  await target.click();
  return await sent;
};

// ---------------------------------------------------------------------------
// The options behind a chat row
// ---------------------------------------------------------------------------

/** Slide a chat row to show the options behind it.
 *
 *  The row is a pointer-drag list item (`ChatItem.tsx`): dragging it left
 *  shows mute, delete and archive; dragging it right shows unread and pin. A
 *  mouse drag is a pointer drag, so this is what a shopper's hand does. */
export const slideRow = async (
  page: Page,
  options: { chatId: string | number; to: "left" | "right" },
): Promise<Locator> => {
  const row = chat.row(page, options.chatId);
  await row.scrollIntoViewIfNeeded();
  const box = await row.boundingBox();
  expect(box, `the row of chat ${options.chatId} has no size on screen`).not.toBeNull();
  const { x, y, width, height } = box!;
  const startX = x + width / 2;
  const midY = y + height / 2;
  const distance = options.to === "left" ? -200 : 150;

  await page.mouse.move(startX, midY);
  await page.mouse.down();
  // Slowly, with a rest before lifting, so the row reads a drag and not a
  // flick, and settles open.
  await page.mouse.move(startX + distance, midY, { steps: 12 });
  await page.waitForTimeout(150);
  await page.mouse.up();

  const container = chat.rowContainer(page, options.chatId);
  const probe =
    options.to === "left" ? chat.optionMute(container) : chat.optionPin(container);
  await expect(
    probe,
    `sliding the row of chat ${options.chatId} ${options.to} did not show its options`,
  ).toBeInViewport();
  return container;
};

/** Pin or unpin a chat. */
export const togglePin = async (
  page: Page,
  options: { chatId: string | number },
): Promise<ChatCallOutcome> => {
  const container = await slideRow(page, { chatId: options.chatId, to: "right" });
  const updated = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.channelUpdate,
    method: "POST",
  });
  await chat.optionPin(container).click();
  return await updated;
};

/** Mute or unmute a chat. */
export const toggleMute = async (
  page: Page,
  options: { chatId: string | number },
): Promise<ChatCallOutcome> => {
  const container = await slideRow(page, { chatId: options.chatId, to: "left" });
  const updated = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.channelUpdate,
    method: "POST",
  });
  await chat.optionMute(container).click();
  return await updated;
};

/** Mark a read chat unread, or an unread chat read. */
export const toggleUnread = async (
  page: Page,
  options: { chatId: string | number; markUnread: boolean },
): Promise<ChatCallOutcome> => {
  const container = await slideRow(page, { chatId: options.chatId, to: "right" });
  const answered = watchChatCall(page, {
    endpoint: options.markUnread
      ? CHAT_ENDPOINT.unread(options.chatId)
      : CHAT_ENDPOINT.watched(options.chatId),
  });
  await chat.optionUnread(container).click();
  return await answered;
};

/** Archive or unarchive a chat. */
export const toggleArchive = async (
  page: Page,
  options: { chatId: string | number },
): Promise<ChatCallOutcome> => {
  const container = await slideRow(page, { chatId: options.chatId, to: "left" });
  const archived = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.archive(options.chatId),
    method: "POST",
  });
  await chat.optionArchive(container).click();
  return await archived;
};

/** Delete a whole chat from its row, and confirm. */
export const deleteChat = async (
  page: Page,
  options: { chatId: string | number },
): Promise<ChatCallOutcome> => {
  const container = await slideRow(page, { chatId: options.chatId, to: "left" });
  await chat.optionDelete(container).click();
  await expect(
    chat.confirmDeleteChat(page),
    "pressing Delete on a chat row did not ask to confirm",
  ).toBeVisible();
  const destroyed = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.destroyChannel,
    method: "POST",
  });
  await chat.confirmDeleteChat(page).click();
  return await destroyed;
};

// ---------------------------------------------------------------------------
// The details drawer: search inside the chat, block
// ---------------------------------------------------------------------------

/** Open the details drawer from the conversation header. */
export const openChatDetails = async (page: Page): Promise<void> => {
  await chat.headerUser(page).click();
  await expect(
    chat.infoSearch(page),
    "clicking the name in the conversation header did not open the chat details",
  ).toBeVisible();
};

/** Search inside the open conversation. Returns the ids the backend matched,
 *  newest first (`chat-channelsearch-contract`). */
export const searchInConversation = async (
  page: Page,
  options: { query: string },
): Promise<{ ids: string[]; outcome: ChatCallOutcome }> => {
  await openChatDetails(page);
  await chat.infoSearch(page).click();
  await expect(
    chat.searchInput(page),
    "pressing Search in the chat details did not show the search box",
  ).toBeVisible();

  const searched = watchChatCall(page, {
    endpoint: CHAT_ENDPOINT.channelSearch,
    method: "POST",
  });
  await chat.searchInput(page).fill(options.query);
  const outcome = await searched;
  const ids = ((outcome.data?.messages_ids ?? []) as unknown[]).map(String);
  return { ids, outcome };
};

/** Block or unblock the other person from the chat details. */
export const toggleBlock = async (
  page: Page,
  options: { block: boolean },
): Promise<ChatCallOutcome> => {
  await openChatDetails(page);
  const button = chat.infoBlock(page);
  await expect(
    button,
    options.block
      ? "the chat details offer UnBlock, so the person is already blocked"
      : "the chat details offer Block, so the person is not blocked",
  ).toHaveAttribute("data-blocked", options.block ? "false" : "true");

  const answered = watchChatCall(page, {
    endpoint: options.block ? CHAT_ENDPOINT.block : CHAT_ENDPOINT.unblock,
    method: "POST",
  });
  await button.click();
  return await answered;
};
