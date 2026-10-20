// SCRIPT-27 to SCRIPT-43 — the chat's branches that staging cannot be asked
// to produce.
//
//   SCRIPT-27  the browser refuses notifications: the chat stays shut, and
//              the shopper is told why
//   SCRIPT-28  the browser has not been asked yet: the app asks first
//   SCRIPT-29  a verified shopper with no chat account is sent to verify
//              the phone, not into the chat
//   SCRIPT-30  the nav icon counts the chats with unread messages
//   SCRIPT-31  the list: pinned first, then newest; archived chats left out
//   SCRIPT-32  the chat backend refuses a message: it is taken back, and
//              the shopper is told
//   SCRIPT-33  the chat backend refuses a message inside a 200: the same
//   SCRIPT-34  the chat token has expired: it is renewed, and the list loads
//   SCRIPT-35  the chat token cannot be renewed: the chat tokens are
//              cleared, and the shopper is asked to verify the phone
//   SCRIPT-36  a blocked chat has no input, only the "cannot send" line
//   SCRIPT-37  a fourth pin is refused before it reaches the chat backend
//   SCRIPT-38  only the writer may edit a message or delete it for everyone
//   SCRIPT-39  the search walks the matches from the newest
//   SCRIPT-40  a file over 25 MB is refused before any upload
//   SCRIPT-41  reaching the top of a chat loads the older messages
//   SCRIPT-42  the Reminders folder opens the chat at the reminded message
//   SCRIPT-43  the chat backend refuses an edit: the old text stays, and the
//              shopper is told
//
// `chat.live.spec.ts` walks the chat that works, against the real chat
// backend. It cannot walk these: a working backend does not refuse a
// message, a real account cannot be made to lose its chat token on cue, and
// a real list cannot be arranged to hold three pinned chats and a delivery
// chat at once.
//
// ---------------------------------------------------------------------------
// Nobody signs in, and nothing real is written
//
// The app learns its chat user from `/api/auth/me` and its market profile
// from `/customer/info`; both are faked (`scenarios/chat.ts`). Every chat
// call is faked too, and the closed-mode guard (`closeUnnamedCalls`) refuses
// and records any call a case did not name. Each case ends by asserting the
// guard refused nothing.
//
// Two things the guard cannot see, and how they are handled:
//
// * **The chat's Firebase realtime database** is one shared project with no
//   staging copy, and opening the chat writes "last seen" into it. The page
//   is cut off from it (`cutRealtimeDatabase`), so no fake key is written.
// * **The guest registration** happens in the Node process while the first
//   page renders. One throwaway guest per case — the same cost
//   `checkout.scripted.spec.ts` pays.
//
// Messages the app shows are recorded from before the first navigation
// (`harness/notifications.ts`), because each is removed after five seconds.
// No wording is asserted: every message goes through `translateFunction`.

import type { Browser, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  attemptSendText,
  CHAT_BROWSER_CHANNEL,
  cutRealtimeDatabase,
  editMessage,
  openChat,
  openConversationById,
  openMessageMenu,
  prepareChatBrowser,
  searchInConversation,
  slideRow,
  watchChatReady,
} from "./actions/chat";
import { closeUnnamedCalls, mockBackend, mockBackendSequence, type MockMap } from "./actions/mock";
import { gotoAbout } from "./actions/nav";
import { newLiveContext } from "./harness/liveSession";
import { messagesShown, recordNotifications } from "./harness/notifications";
import {
  AUTH_PATHS,
  CHAT_PATHS,
  channel,
  chatAnswer,
  chatShopper,
  fakeArchivedFolder,
  ME,
  PEOPLE,
  type Person,
  textMessage,
} from "./scenarios/chat";
import { auth, chat } from "./selectors";

test.use({ channel: CHAT_BROWSER_CHANNEL });

/** Ids for the faked chats, far from any real row. */
const CHAT = { rana: 900_201, sami: 900_202, lina: 900_203, omar: 900_204, dana: 900_205 };

type Permission = "granted" | "denied" | "default";

/** A chat shopper's page with every fake in place, the guard on, and the
 *  messages recorded — in the order `checkout.scripted.spec.ts` explains.
 *
 *  `permission` is what the browser answers for notifications. "granted" is
 *  the real grant (`prepareChatBrowser`); the other two are set on
 *  `Notification.permission` before the app loads, because a real browser
 *  cannot be told to answer them on cue. */
const openChatShopper = async (
  browser: Browser,
  map: MockMap,
  options: {
    permission?: Permission;
    archived?: Record<string, unknown>[];
    /** Wait for the app to know its chat user (off for a shopper with none). */
    waitForChatUser?: boolean;
  } = {},
) => {
  const context = await newLiveContext(browser);
  const guard = await closeUnnamedCalls(context);
  await cutRealtimeDatabase(context);

  const permission = options.permission ?? "granted";
  if (permission === "granted") {
    await prepareChatBrowser(context);
  } else {
    // Push stays: a browser without it gets "notifications not supported"
    // instead, which is a different branch (see `NotificationWidget.tsx`).
    await context.addInitScript((answer: string) => {
      Object.defineProperty(Notification, "permission", { get: () => answer });
    }, permission);
  }

  const page = await context.newPage();
  await recordNotifications(page);
  const fakes = await mockBackend(page, map);
  await fakeArchivedFolder(page, options.archived ?? []);

  const ready = options.waitForChatUser === false ? null : watchChatReady(page);
  await gotoAbout(page, { country: "sy" });
  if (ready) {
    expect(
      await ready,
      "the app never asked for the chat list, so it never took the faked chat user from /api/auth/me",
    ).toBe(true);
  }
  return { context, page, guard, fakes };
};

/** The end of every case: nothing the case did not name reached staging. */
const expectNothingRefused = (guard: { blocked: () => string[] }): void => {
  expect(
    guard.blocked(),
    "the case made calls it did not fake, and the guard refused them — add them to the case's map, never let them through to staging",
  ).toEqual([]);
};

/** Wait until the app has shown at least one message, and return them. */
const shownMessages = async (page: Page, what: string): Promise<string[]> => {
  await expect
    .poll(async () => (await messagesShown(page)).length, {
      message: `the shopper was told nothing when ${what}`,
      timeout: 10_000,
    })
    .toBeGreaterThan(0);
  return await messagesShown(page);
};

/** A chat with Rana holding one message from each side. */
const chatWithRana = (extra: Partial<Parameters<typeof channel>[0]> = {}) =>
  channel({
    id: CHAT.rana,
    with: PEOPLE.rana,
    messages: [
      textMessage({ id: 900_302, channelId: CHAT.rana, from: ME, to: PEOPLE.rana, text: "probe message from me", minutesAgo: 5 }),
      textMessage({ id: 900_301, channelId: CHAT.rana, from: PEOPLE.rana, to: ME, text: "probe message from rana", minutesAgo: 10 }),
    ],
    ...extra,
  });

// ---------------------------------------------------------------------------
// SCRIPT-27 .. SCRIPT-29 — who may open the chat
// ---------------------------------------------------------------------------

test("SCRIPT-27 the browser refuses notifications: the chat stays shut, and the shopper is told why", async ({
  browser,
}) => {
  const { context, page, guard } = await openChatShopper(
    browser,
    chatShopper({ channels: [chatWithRana()] }),
    { permission: "denied" },
  );
  try {
    await test.step("pressing the chat icon tells the shopper, and opens nothing", async () => {
      await chat.navIconAny(page).first().click();
      await shownMessages(page, "the chat refused to open because notifications are blocked");
      await expect(
        chat.window(page),
        "notifications are blocked, but the chat window opened anyway",
      ).toHaveCount(0);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-28 the browser has not been asked yet: the app asks first", async ({
  browser,
}) => {
  const { context, page, guard } = await openChatShopper(
    browser,
    chatShopper({ channels: [chatWithRana()] }),
    { permission: "default" },
  );
  try {
    await test.step("pressing the chat icon shows the 'allow notifications' window, not the chat", async () => {
      await chat.navIconAny(page).first().click();
      await expect(
        chat.notificationPermissionWidget(page),
        "the browser has not been asked about notifications, but the app did not ask before the chat",
      ).toBeVisible();
      await expect(
        chat.window(page),
        "the chat window opened before the shopper allowed notifications",
      ).toHaveCount(0);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-29 a verified shopper with no chat account is sent to verify the phone, not into the chat", async ({
  browser,
}) => {
  const { context, page, guard, fakes } = await openChatShopper(
    browser,
    chatShopper({ chatUser: null }),
    { waitForChatUser: false },
  );
  try {
    await test.step("the app has read who the shopper is", async () => {
      await expect
        .poll(() => fakes.used(AUTH_PATHS.me) && fakes.used(AUTH_PATHS.customerInfo), {
          message: "the app never asked who the shopper is (/api/auth/me and /customer/info)",
        })
        .toBe(true);
    });

    await test.step("pressing the chat icon opens the phone check, not the chat", async () => {
      await chat.navIconAny(page).first().click();
      await expect(
        auth.whatsappMethod(page).or(auth.smsMethod(page)).first(),
        "a shopper with no chat account pressed the chat icon, but the phone check did not open",
      ).toBeVisible();
      await expect(
        chat.window(page),
        "a shopper with no chat account was let into the chat",
      ).toHaveCount(0);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// SCRIPT-30 .. SCRIPT-31 — the chat list
// ---------------------------------------------------------------------------

test("SCRIPT-30 the nav icon counts the chats with unread messages", async ({
  browser,
}) => {
  const unread = (id: number, person: Person, messages: number) =>
    channel({
      id,
      with: person,
      messages: Array.from({ length: messages }, (_, i) =>
        textMessage({ id: id * 10 + i, channelId: id, from: person, to: ME, text: `unread ${i}`, minutesAgo: 10 + i, read: false }),
      ),
    });
  const readOnly = channel({
    id: CHAT.lina,
    with: PEOPLE.lina,
    messages: [textMessage({ id: 900_331, channelId: CHAT.lina, from: PEOPLE.lina, to: ME, text: "read", minutesAgo: 30 })],
  });

  const { context, page, guard } = await openChatShopper(
    browser,
    chatShopper({ channels: [unread(CHAT.rana, PEOPLE.rana, 2), unread(CHAT.sami, PEOPLE.sami, 1), readOnly] }),
  );
  try {
    await test.step("the nav icon shows 2 — the two chats with unread messages, not the three unread messages", async () => {
      await expect(
        chat.navIconUnread(page),
        "two chats have unread messages, but the nav icon shows no unread count",
      ).toHaveAttribute("data-count", "2");
    });

    await test.step("each row shows its own unread count, and the read chat shows none", async () => {
      await openChat(page);
      await expect(
        chat.rowUnread(chat.row(page, CHAT.rana)),
        "the chat with two unread messages does not show 2",
      ).toHaveText("2");
      await expect(
        chat.rowUnread(chat.row(page, CHAT.sami)),
        "the chat with one unread message does not show 1",
      ).toHaveText("1");
      await expect(
        chat.rowUnread(chat.row(page, CHAT.lina)),
        "the chat whose messages are all read shows an unread count",
      ).toHaveCount(0);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-31 the list: pinned first, then newest; archived chats left out", async ({
  browser,
}) => {
  const withMessageAt = (id: number, person: Person, minutesAgo: number, extra = {}) =>
    channel({
      id,
      with: person,
      messages: [textMessage({ id: id * 10, channelId: id, from: person, to: ME, text: "hello", minutesAgo })],
      ...extra,
    });

  const { context, page, guard } = await openChatShopper(
    browser,
    chatShopper({
      pinned: [withMessageAt(CHAT.omar, PEOPLE.omar, 500, { pin: 1 })],
      channels: [
        withMessageAt(CHAT.sami, PEOPLE.sami, 60),
        withMessageAt(CHAT.rana, PEOPLE.rana, 5),
        withMessageAt(CHAT.dana, PEOPLE.dana, 1, { archived: true }),
      ],
    }),
  );
  try {
    await openChat(page);
    await test.step("the pinned chat is first although its message is the oldest", async () => {
      await expect(chat.rows(page).first(), "the pinned chat is not the first row").toHaveAttribute(
        "data-chat-id",
        String(CHAT.omar),
      );
    });
    await test.step("the other chats follow newest first", async () => {
      await expect(chat.row(page, CHAT.rana)).toBeVisible();
      const order = await chat.rows(page).evaluateAll((rows) =>
        rows.map((row) => row.getAttribute("data-chat-id")),
      );
      expect(
        order.indexOf(String(CHAT.rana)),
        `the chat with the newer message is not above the older one (rows: ${order.join(", ")})`,
      ).toBeLessThan(order.indexOf(String(CHAT.sami)));
    });
    await test.step("the archived chat is not in the main list", async () => {
      await expect(
        chat.row(page, CHAT.dana),
        "an archived chat is shown in the main list",
      ).toHaveCount(0);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// SCRIPT-32 .. SCRIPT-35 — the chat backend says no
// ---------------------------------------------------------------------------

/** Open the chat with Rana on a page whose send answers `sendAnswer`. */
const refusedSend = async (browser: Browser, sendAnswer: MockMap[string]) => {
  const opened = await openChatShopper(browser, {
    ...chatShopper({ channels: [chatWithRana()] }),
    [CHAT_PATHS.send]: sendAnswer,
  });
  await openChat(opened.page);
  await openConversationById(opened.page, { chatId: CHAT.rana, who: "Probe Rana" });
  return opened;
};

test("SCRIPT-32 the chat backend refuses a message: it is taken back, and the shopper is told", async ({
  browser,
}) => {
  const words = "probe message the backend refuses";
  const { context, page, guard } = await refusedSend(browser, chatAnswer(null, 500));
  try {
    await test.step("the send reaches the chat backend and is refused", async () => {
      const outcome = await attemptSendText(page, { text: words });
      expect(outcome.status, "the faked refusal was not what the app received").toBe(500);
    });
    await test.step("the message is taken off the screen", async () => {
      await expect(
        chat.messageWithText(page, words),
        "the refused message is still in the conversation, as if it had been sent",
      ).toHaveCount(0);
    });
    await test.step("the shopper is told it failed", async () => {
      await shownMessages(page, "the chat backend refused the message");
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-33 the chat backend refuses a message inside a 200: it is taken back, and the shopper is told", async ({
  browser,
}) => {
  // Finding CHAT-APP-1 (docs/testing/E2E_SCENARIOS.md). Red against the app:
  // `SendMessage` (store/chat/actions.tsx) checks only `response.success`,
  // which `fetchData` sets for any 2xx, and then finds no `data.id` — so
  // it neither swaps the message in nor takes it back, and says nothing.
  // Strict: when the app is fixed this starts passing, and the marker must go.
  test.fail(true, "CHAT-APP-1: a send refused inside a 200 stays on screen as sending");
  const words = "probe message refused inside a 200";
  // The chat backend answers some refusals with 200 and isSuccessful: false
  // (measured on PUT /api/v1/users/{id}, 2026-09-27). `fetchData` calls any
  // 2xx a success (`utils/fetchData.ts:763`).
  const { context, page, guard } = await refusedSend(browser, {
    status: 200,
    body: { isSuccessful: false, code: 422, message: "faked refusal", data: null },
  });
  try {
    await test.step("the send reaches the chat backend and is refused inside a 200", async () => {
      const outcome = await attemptSendText(page, { text: words });
      expect(outcome.accepted, "the faked refusal was read as accepted").toBe(false);
    });
    await test.step("the message is taken off the screen", async () => {
      await expect(
        chat.messageWithText(page, words),
        "the chat backend refused the message inside a 200, but it stays in the conversation as if it were still sending",
      ).toHaveCount(0);
    });
    await test.step("the shopper is told it failed", async () => {
      await shownMessages(page, "the chat backend refused the message inside a 200");
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-34 the chat token has expired: it is renewed, and the list loads", async ({
  browser,
}) => {
  const renewal = { status: 200, body: { refreshed: true, eligible: true } };
  const context = await newLiveContext(browser);
  const guard = await closeUnnamedCalls(context);
  await cutRealtimeDatabase(context);
  await prepareChatBrowser(context);
  const page = await context.newPage();
  await recordNotifications(page);
  const fakes = await mockBackend(page, {
    ...chatShopper({ channels: [chatWithRana()] }),
    [AUTH_PATHS.refresh]: renewal,
  });
  // The chat list answers 401 once — an access token that aged out — and
  // then the list. The fakes above answer every later call.
  const expired = await mockBackendSequence(page, CHAT_PATHS.channels, [
    { status: 401, body: { message: "Unauthenticated." } },
  ]);
  await fakeArchivedFolder(page, []);

  try {
    const renewed = page.waitForRequest((request) => request.url().includes(AUTH_PATHS.refresh), {
      timeout: 45_000,
    });
    await gotoAbout(page, { country: "sy" });

    await test.step("the 401 makes the app renew the chat token — the chat one, not the market one", async () => {
      const request = await renewed.catch(() => null);
      expect(request, "the chat list answered 401, but the app never asked to renew a token").not.toBeNull();
      expect(expired.consumed(), "the faked 401 was never served").toBe(1);
      expect(
        JSON.parse(request!.postData() ?? "{}").server,
        "the app renewed a token after the chat's 401, but not the chat's",
      ).toBe("chat");
      await expect
        .poll(() => fakes.used(AUTH_PATHS.refresh), {
          message: "the chat renewal was asked for, but the faked answer never served it",
        })
        .toBe(true);
    });

    await test.step("with the new token the chat opens and lists the chats", async () => {
      await openChat(page);
      await expect(
        chat.row(page, CHAT.rana),
        "the chat token was renewed, but the chat list did not load",
      ).toBeVisible();
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-35 the chat token cannot be renewed: the chat tokens are cleared, and the shopper is asked to verify the phone", async ({
  browser,
}) => {
  const { context, page, guard, fakes } = await openChatShopper(
    browser,
    {
      ...chatShopper(),
      [CHAT_PATHS.channels]: { status: 401, body: { message: "Unauthenticated." } },
      [AUTH_PATHS.refresh]: { status: 200, body: { refreshed: false, eligible: false } },
      [AUTH_PATHS.clearTokens]: { status: 200, body: { success: true } },
    },
    // The first list call is the one that fails, so the app never finishes
    // learning its chat list; the ready signal is the call itself.
  );
  try {
    await test.step("the refused renewal clears the chat's own tokens, and only those", async () => {
      const cleared = await page
        .waitForRequest((request) => request.url().includes(AUTH_PATHS.clearTokens), { timeout: 30_000 })
        .catch(() => null);
      expect(cleared, "the chat token could not be renewed, but the app did not clear it").not.toBeNull();
      const tokens: string[] = JSON.parse(cleared!.postData() ?? "{}").tokens ?? [];
      expect(
        tokens.slice().sort(),
        "the app cleared other tokens than the chat's own pair after the chat renewal was refused",
      ).toEqual(["CHAT-REFRESH-TOKEN", "CHAT-TOKEN"]);
      await expect
        .poll(() => fakes.used(AUTH_PATHS.clearTokens), {
          message: "the chat tokens were asked to be cleared, but the faked answer never served it",
        })
        .toBe(true);
    });

    await test.step("the shopper is asked to verify the phone", async () => {
      await expect(
        auth.whatsappMethod(page).or(auth.smsMethod(page)).first(),
        "the chat token could not be renewed, but the shopper was not asked to verify the phone",
      ).toBeVisible();
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// SCRIPT-36 .. SCRIPT-38 — what a chat and a message allow
// ---------------------------------------------------------------------------

test("SCRIPT-36 a blocked chat has no input, only the 'cannot send' line", async ({
  browser,
}) => {
  const { context, page, guard } = await openChatShopper(
    browser,
    chatShopper({ channels: [chatWithRana({ blocked: true })] }),
  );
  try {
    await openChat(page);
    await openConversationById(page, { chatId: CHAT.rana, who: "Probe Rana" });
    await test.step("the conversation says it is closed", async () => {
      await expect(
        chat.blockedBanner(page),
        "a blocked chat does not say that messages cannot be sent",
      ).toBeVisible();
    });
    await test.step("there is nowhere to type", async () => {
      await expect(chat.input(page), "a blocked chat still has a message input").toHaveCount(0);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-37 a fourth pin is refused before it reaches the chat backend", async ({
  browser,
}) => {
  // Finding CHAT-APP-2 (docs/testing/E2E_SCENARIOS.md). Red against the app:
  // the limit is checked against `state.pinnedChats` (store/chat/reducer.ts
  // `pinChat`), which nothing ever fills — so the check always passes. And
  // `ChatOptions` calls `PinnChat` (the backend call) before the reducer,
  // so the pin goes out whatever the check says.
  // Strict: when the app is fixed this starts passing, and the marker must go.
  test.fail(true, "CHAT-APP-2: the three-pin limit never applies");
  const pinnedWith = (id: number, person: Person) =>
    channel({
      id,
      with: person,
      pin: 1,
      messages: [textMessage({ id: id * 10, channelId: id, from: person, to: ME, text: "pinned", minutesAgo: 50 })],
    });
  const { context, page, guard } = await openChatShopper(
    browser,
    {
      ...chatShopper({
        pinned: [pinnedWith(CHAT.omar, PEOPLE.omar), pinnedWith(CHAT.dana, PEOPLE.dana), pinnedWith(CHAT.lina, PEOPLE.lina)],
        channels: [chatWithRana()],
      }),
      // Named so a pin that goes out is recorded as a call, not refused as an
      // unknown one — the assertion below is about whether it went out.
      [CHAT_PATHS.channelUpdate]: chatAnswer({}),
    },
  );
  try {
    await openChat(page);
    const pinCall = page
      .waitForRequest(
        (request) =>
          decodeURI(request.headers()["x-proxy-url"] ?? "").includes(CHAT_PATHS.channelUpdate),
        { timeout: 5_000 },
      )
      .then(() => true)
      .catch(() => false);

    await test.step("pinning a fourth chat tells the shopper only three are allowed", async () => {
      const container = await slideRow(page, { chatId: CHAT.rana, to: "right" });
      await chat.optionPin(container).click();
      await shownMessages(page, "a fourth chat was pinned");
    });
    await test.step("the fourth pin is not sent to the chat backend", async () => {
      expect(
        await pinCall,
        "the app said only three chats may be pinned, but sent the fourth pin to the chat backend anyway",
      ).toBe(false);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-38 only the writer may edit a message or delete it for everyone", async ({
  browser,
}) => {
  const { context, page, guard } = await openChatShopper(
    browser,
    chatShopper({ channels: [chatWithRana()] }),
  );
  try {
    await openChat(page);
    await openConversationById(page, { chatId: CHAT.rana, who: "Probe Rana" });

    await test.step("on the shopper's own message: Edit, and delete 'For All'", async () => {
      const mine = await openMessageMenu(page, { messageId: 900_302 });
      await expect(chat.menuEdit(mine), "the shopper's own message offers no Edit").toBeVisible();
      await chat.menuDelete(mine).click();
      await expect(
        chat.deleteChoice(page, "for-all"),
        "deleting the shopper's own message does not offer 'For All'",
      ).toBeVisible();
      await page.keyboard.press("Escape");
    });

    await test.step("on Rana's message: no Edit, and no delete 'For All'", async () => {
      const theirs = await openMessageMenu(page, { messageId: 900_301 });
      await expect(chat.menuEdit(theirs), "someone else's message offers Edit").toHaveCount(0);
      await chat.menuDelete(theirs).click();
      await expect(
        chat.deleteChoice(page, "cancel"),
        "deleting someone else's message does not offer Cancel in place of 'For All'",
      ).toBeVisible();
      await expect(
        chat.deleteChoice(page, "for-all"),
        "someone else's message may be deleted 'For All'",
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// SCRIPT-39 .. SCRIPT-43 — search, files, history, reminders, edits
// ---------------------------------------------------------------------------

test("SCRIPT-39 the search walks the matches from the newest", async ({ browser }) => {
  // Three matches, all loaded. The chat backend answers newest first
  // (`chat-channelsearch-contract`), and the first match shown must be the
  // newest — the one nearest the bottom of the conversation.
  const matches = [900_313, 900_312, 900_311];
  const { context, page, guard } = await openChatShopper(browser, {
    ...chatShopper({
      channels: [
        channel({
          id: CHAT.rana,
          with: PEOPLE.rana,
          messages: matches.map((id, i) =>
            textMessage({ id, channelId: CHAT.rana, from: PEOPLE.rana, to: ME, text: `probe match ${i}`, minutesAgo: 10 + i * 10 }),
          ),
        }),
      ],
    }),
    [CHAT_PATHS.channelSearch]: chatAnswer({ messages_ids: matches.map(String), offset: String(matches[2]) }),
  });
  try {
    await openChat(page);
    await openConversationById(page, { chatId: CHAT.rana, who: "Probe Rana" });
    await searchInConversation(page, { query: "probe" });

    await test.step("the first match shown is the newest", async () => {
      await expect(chat.searchHit(page), "the search did not start at the newest match").toHaveAttribute(
        "id",
        `main-container-${matches[0]}`,
      );
    });
    await test.step("'older' moves to the next older match", async () => {
      await chat.searchOlder(page).click();
      await expect(chat.searchHit(page), "'older' did not move to the next older match").toHaveAttribute(
        "id",
        `main-container-${matches[1]}`,
      );
    });
    await test.step("'newer' moves back", async () => {
      await chat.searchNewer(page).click();
      await expect(chat.searchHit(page), "'newer' did not move back to the newer match").toHaveAttribute(
        "id",
        `main-container-${matches[0]}`,
      );
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-40 a file over 25 MB is refused before any upload", async ({ browser }) => {
  const { context, page, guard } = await openChatShopper(
    browser,
    chatShopper({ channels: [chatWithRana()] }),
  );
  try {
    await openChat(page);
    await openConversationById(page, { chatId: CHAT.rana, who: "Probe Rana" });
    const uploadAsked = page
      .waitForRequest(
        (request) =>
          request.url().includes(CHAT_PATHS.ticket) ||
          decodeURI(request.headers()["x-proxy-url"] ?? "").includes(CHAT_PATHS.send),
        { timeout: 8_000 },
      )
      .then(() => true)
      .catch(() => false);

    await test.step("choosing a 26 MB file tells the shopper it is too big", async () => {
      await chat.fileInput(page).setInputFiles({
        name: "probe-too-big.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.alloc(26 * 1024 * 1024, 0),
      });
      await shownMessages(page, "a 26 MB file was chosen");
    });
    await test.step("nothing is uploaded and nothing is sent", async () => {
      expect(
        await uploadAsked,
        "a file over the 25 MB limit was still sent to the upload or to the chat backend",
      ).toBe(false);
    });
    await test.step("no message is left behind on the screen", async () => {
      await expect(
        chat.pendingMessages(page),
        "the refused file left a 'sending' message in the conversation",
      ).toHaveCount(0);
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-41 reaching the top of a chat loads the older messages", async ({ browser }) => {
  // Ten loaded messages, the newest first as the backend sends them; one
  // older page behind them.
  const loaded = Array.from({ length: 10 }, (_, i) =>
    textMessage({ id: 900_420 - i, channelId: CHAT.rana, from: PEOPLE.rana, to: ME, text: `loaded ${i}`, minutesAgo: 10 + i }),
  );
  const oldestLoaded = 900_411;
  const olderPage = Array.from({ length: 3 }, (_, i) =>
    textMessage({ id: 900_410 - i, channelId: CHAT.rana, from: PEOPLE.rana, to: ME, text: `older ${i}`, minutesAgo: 100 + i }),
  );

  const { context, page, guard } = await openChatShopper(browser, {
    ...chatShopper({ channels: [channel({ id: CHAT.rana, with: PEOPLE.rana, messages: loaded })] }),
    [CHAT_PATHS.messagesOfChannel]: chatAnswer(olderPage),
  });
  try {
    await openChat(page);
    // Armed before the chat opens: when the messages do not fill the screen
    // the loader is in view the moment it is drawn, and the app asks at once.
    const asked = page.waitForRequest(
      (request) => decodeURI(request.headers()["x-proxy-url"] ?? "").includes(CHAT_PATHS.messagesOfChannel),
      { timeout: 20_000 },
    );
    await openConversationById(page, { chatId: CHAT.rana, who: "Probe Rana" });

    await test.step("reaching the top asks for the page before the oldest loaded message", async () => {
      // The loader is drawn 2 seconds after the chat opens, and the chat
      // scrolls itself to the bottom after 1. Scrolling up before the loader
      // exists is undone by that, so the scroll waits for it.
      await expect(
        chat.olderMessagesLoader(page),
        "the conversation has no loader at the top to load older messages",
      ).toBeAttached();
      await chat.olderMessagesLoader(page).scrollIntoViewIfNeeded();
      const request = await asked.catch(() => null);
      expect(request, "scrolling to the top did not ask for older messages").not.toBeNull();
      expect(
        decodeURI(request!.headers()["x-proxy-url"] ?? ""),
        "the older page was asked for from the wrong message",
      ).toContain(`message_id=${oldestLoaded}`);
    });
    await test.step("the older messages appear", async () => {
      await expect(
        chat.message(page, olderPage[0].id as string),
        "the older page came back, but its messages are not in the conversation",
      ).toBeVisible();
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-42 the Reminders folder opens the chat at the reminded message", async ({
  browser,
}) => {
  const reminded = 900_301;
  const { context, page, guard } = await openChatShopper(browser, {
    ...chatShopper({ channels: [chatWithRana()] }),
    [CHAT_PATHS.reminders]: chatAnswer([
      {
        id: "900701",
        remind_at: "2026-10-01T09:00:00.000Z",
        created_at: "2026-09-20T12:00:00.000Z",
        message_id: String(reminded),
        message: {
          id: String(reminded),
          channel_id: String(CHAT.rana),
          message_type: "TextMessage",
          content: "probe message from rana",
          sender_user: { id: PEOPLE.rana.id, name: PEOPLE.rana.name, photo_path: null },
          created_at: "2026-09-20T11:50:00.000Z",
        },
      },
    ]),
  });
  try {
    await openChat(page);
    await test.step("the folder lists the reminded message", async () => {
      await chat.remindersFolder(page).click();
      await expect(
        chat.reminderRow(page, reminded),
        "the Reminders folder does not list the message the reminder is on",
      ).toBeVisible();
    });
    await test.step("pressing it opens the chat with that message on screen", async () => {
      await chat.reminderRow(page, reminded).locator("button").first().click();
      await expect(
        chat.conversation(page),
        "pressing a reminder did not open its chat",
      ).toHaveAttribute("data-chat-id", String(CHAT.rana));
      await expect(
        chat.message(page, reminded),
        "the reminder's chat opened, but not at the reminded message",
      ).toBeInViewport();
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});

test("SCRIPT-43 the chat backend refuses an edit: the old text stays, and the shopper is told", async ({
  browser,
}) => {
  const { context, page, guard } = await openChatShopper(browser, {
    ...chatShopper({ channels: [chatWithRana()] }),
    [CHAT_PATHS.edit]: chatAnswer(null, 500),
  });
  try {
    await openChat(page);
    await openConversationById(page, { chatId: CHAT.rana, who: "Probe Rana" });
    await test.step("the edit reaches the chat backend and is refused", async () => {
      const outcome = await editMessage(page, { messageId: 900_302, text: "probe edit the backend refuses" });
      expect(outcome.status, "the faked refusal was not what the app received").toBe(500);
    });
    await test.step("the message keeps its old text", async () => {
      await page.keyboard.press("Escape").catch(() => undefined);
      await expect(
        chat.messageText(chat.message(page, 900_302)),
        "the chat backend refused the edit, but the message shows the refused text",
      ).toHaveText("probe message from me");
    });
    await test.step("the shopper is told it failed", async () => {
      await shownMessages(page, "the chat backend refused the edit");
    });
    expectNothingRefused(guard);
  } finally {
    await context.close();
  }
});
