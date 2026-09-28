// The chat journey, against the real chat backend on staging.
//
//   CHAT-01  Shopper A signs in, and the chat opens and lists her chats
//   CHAT-02  A finds Shopper B by phone and opens their conversation
//   CHAT-03  A sends a message; the chat backend keeps it
//   CHAT-04  B reads it, and A sees that it was read
//   CHAT-05  B replies to it, and A sees the reply with its quote
//   CHAT-06  A edits her message, and both see the new text
//   CHAT-07  A tags the message, then removes the tag
//   CHAT-08  A sets a reminder on the message, then cancels it
//   CHAT-09  A forwards a message into the chat
//   CHAT-10  A deletes one message for everyone and one only for herself
//   CHAT-11  A pins the chat, then unpins it
//   CHAT-12  A mutes the chat, then puts it back as it was
//   CHAT-13  A marks the chat unread, then read
//   CHAT-14  A archives the chat, then unarchives it
//   CHAT-15  A blocks B, and both see the chat closed; A unblocks
//   CHAT-16  A deletes the conversation; B still has it
//   CHAT-17  B searches inside the chat for a word only this run wrote
//            (red: chat backend)
//
// **Who talks to whom.** Shopper A signs in here, once (one real one-time
// code). Shopper B is the QA seller, and opens the jar the QA seed saved —
// no second code. Both are test accounts, so every message stays between
// them. Every message carries this run's token.
//
// **A has one more chat on staging, with a real person.** Nothing here may
// touch it. Every write is bound to the chat whose other member has Shopper
// B's phone number (`channelWithPhone`), read from the chat backend's own list.
//
// **How the other side is read.** Push delivery (Firebase) does not run in
// this browser — see `prepareChatBrowser`. So a case reads what the other
// person did the way a shopper who was away would: it reloads and opens the
// chat. That is also how every "the backend kept it" check is made.
//
// **The browser.** These cases need full Chromium, not the headless shell:
// the shell answers "denied" to every notification grant, and the chat does
// not open without one (`CHAT_BROWSER_CHANNEL`).
//
// **What a run leaves behind.** The messages stay in Shopper B's copy of the
// chat for ever: CHAT-16 deletes the conversation only for A, and the chat
// backend has no delete for B's side that A can call. The `afterAll` puts
// back anything a failed case left changed — a block first, because a
// leftover block would close the chat to the next run and to the tester.

import type { Browser, BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { attemptAuth, requireSignedInShopper } from "./actions/auth";
import {
  CHAT_BROWSER_CHANNEL,
  CHAT_ENDPOINT,
  cancelReminder,
  channelWithPhone,
  deleteChat,
  deleteMessage,
  editMessage,
  forwardMessage,
  isMainListRequest,
  openConversationById,
  openConversationByPhone,
  prepareChatBrowser,
  reloadAndOpenChat,
  replyTo,
  requireChatAccepted,
  searchInConversation,
  sendText,
  setReminder,
  toggleArchive,
  toggleBlock,
  toggleMute,
  togglePin,
  toggleTag,
  toggleUnread,
  watchChatCall,
} from "./actions/chat";
import { gotoAbout } from "./actions/nav";
import { newRunToken } from "./actions/story";
import { envValue, hasShopperA, hasShopperB } from "./harness/env";
import {
  forgetSavedSession,
  handOnSession,
  newLiveContext,
  openSignedInSession,
  SESSION_STATE,
} from "./harness/liveSession";
import {
  NO_QA_SEED_REASON,
  QA_SELLER_SESSION_PATH,
  qaSeedRan,
  qaSellerSessionSaved,
} from "./harness/qaSeedState";
import { chat } from "./selectors";

test.use({ channel: CHAT_BROWSER_CHANNEL });

/** The country every case opens the app in. */
const COUNTRY = "sy";

/** This run's mark, inside the text of every message it sends. */
const RUN_TOKEN = newRunToken();
const text = (what: string): string => `trydos qa ${RUN_TOKEN} ${what}`;

/** A word no other message on staging carries: letters only, because the
 *  chat search matches whole words of 3 characters or more
 *  (`chat-channelsearch-contract`), and the token has digits in it. */
const SEARCH_WORD = `zq${RUN_TOKEN.replace(/[^a-z]/g, "")}qz`;

/** The case that creates each thing, named when a later case finds nothing. */
const OWNER = { session: "CHAT-01", chat: "CHAT-03", reply: "CHAT-05" };

/** What the journey created, read by every case after the one that made it. */
const run = {
  /** The channel shared by A and B. */
  chatId: null as string | null,
  /** A's first message: read, replied to, edited, tagged, reminded. */
  firstMessageId: null as string | null,
  firstMessageText: "",
};

/** What a failed case may have left changed, for `afterAll` to put back. */
const leftChanged = {
  blocked: false,
  archived: false,
  pinned: null as boolean | null,
  muted: null as boolean | null,
};

const phoneOfA = (): string => envValue("TEST_ACCOUNT_PHONE");
const phoneOfB = (): string => envValue("TEST_ACCOUNT_PHONE_2");

test.beforeEach(() => {
  test.skip(!hasShopperA(), "needs TEST_ACCOUNT_PHONE and TEST_ACCOUNT_OTP.");
  test.skip(!hasShopperB(), "needs TEST_ACCOUNT_PHONE_2 — Shopper B is who Shopper A chats with.");
});

const shopperBAvailable = (): boolean => qaSeedRan() && qaSellerSessionSaved();

/** Skip a case that needs Shopper B's session, which only the QA seed saves. */
const needShopperB = (): void => {
  test.skip(!shopperBAvailable(), NO_QA_SEED_REASON);
};

/** For one step of an A case that needs B: true when B is here. Otherwise
 *  the step is recorded as not run, with the reason, and the case goes on. */
const shopperBHere = (step: string): boolean => {
  if (shopperBAvailable()) return true;
  test.info().annotations.push({
    type: "step not run",
    description: `${step}: ${NO_QA_SEED_REASON}`,
  });
  return false;
};

// ---------------------------------------------------------------------------
// The two held sessions
//
// One context and one page per shopper, held from their first case to
// `afterAll`, and the jars written once, at the end. A jar is a snapshot of a
// single-use refresh token; re-opening it between cases, or navigating a page
// in the middle of a renewal, spends the token and turns the shopper into a
// guest. `comments.live.spec.ts` measured this and explains it in full.
// ---------------------------------------------------------------------------

type Held = { context: BrowserContext; page: Page };
let shopperA: Held | null = null;
let shopperB: Held | null = null;

/** Shopper A's held page, or — when CHAT-01 never built one — the saved jar,
 *  so a later case reports its own failure instead of a null. */
const heldA = async (browser: Browser): Promise<Page> => {
  if (!shopperA) {
    const context = await openSignedInSession(
      browser,
      SESSION_STATE.chat,
      OWNER.session,
    );
    await prepareChatBrowser(context);
    const page = await context.newPage();
    await gotoAbout(page, { country: COUNTRY });
    shopperA = { context, page };
  }
  return shopperA.page;
};

/** Shopper B's held page, opened from the QA seed's jar on first use. */
const heldB = async (browser: Browser): Promise<Page> => {
  if (!shopperB) {
    const context = await openSignedInSession(
      browser,
      QA_SELLER_SESSION_PATH,
      "the QA seed (setup project)",
    );
    await prepareChatBrowser(context);
    const page = await context.newPage();
    await gotoAbout(page, { country: COUNTRY });
    shopperB = { context, page };
  }
  return shopperB.page;
};

/** The chat id CHAT-03 learned, or a failure naming CHAT-03. */
const chatId = (): string => {
  expect(
    run.chatId,
    `${OWNER.chat} never learned the id of the chat between Shopper A and Shopper B, so this case has nothing to run against. Read that case's failure.`,
  ).toBeTruthy();
  return String(run.chatId);
};

/** A's first message id, or a failure naming CHAT-03. */
const firstMessage = (): string => {
  expect(
    run.firstMessageId,
    `${OWNER.chat} never sent Shopper A's first message, so this case has nothing to run against. Read that case's failure.`,
  ).toBeTruthy();
  return String(run.firstMessageId);
};

/** Reload, open the chat, and open the conversation with the other shopper. */
const reopenConversation = async (
  page: Page,
  who: "Shopper A" | "Shopper B",
): Promise<{ channels: any[]; pinned: any[] }> => {
  const list = await reloadAndOpenChat(page);
  await openConversationById(page, { chatId: chatId(), who });
  return list;
};

/** Open the chat with Shopper A on B's page, found in B's own list —
 *  for the cases outside the journey, which cannot lean on `run.chatId`.
 *  Returns the chat as the chat backend listed it. */
const openChatWithA = async (pageB: Page): Promise<any> => {
  const list = await reloadAndOpenChat(pageB);
  const shared = channelWithPhone([...list.channels, ...list.pinned], phoneOfA());
  expect(
    shared,
    "the chat backend's list for Shopper B has no chat with Shopper A",
  ).toBeTruthy();
  await openConversationById(pageB, { chatId: shared.id, who: "Shopper A" });
  return shared;
};

/** A's own member row in the shared chat, as the chat backend listed it. */
const myMemberIn = (channels: any[], phone: string): any =>
  channelWithPhone(channels, phoneOfB())?.channel_members?.find(
    (member: any) =>
      String(member?.user?.mobile_phone ?? "").replace(/\D/g, "").slice(-9) ===
      phone.replace(/\D/g, "").slice(-9),
  );

test.describe("the chat journey, in order", () => {
  // Serial: every case builds on the one before it, so a failure skips the
  // rest of the journey. CHAT-17 is outside it on purpose.
  test.describe.configure({ mode: "serial" });

  // ---------------------------------------------------------------------------
  // CHAT-01
  // ---------------------------------------------------------------------------

  test("CHAT-01 Shopper A signs in, and the chat opens and lists her chats", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    forgetSavedSession(SESSION_STATE.chat);

    const context = await newLiveContext(browser);
    await prepareChatBrowser(context);
    const page = await context.newPage();
    shopperA = { context, page };

    await test.step("Shopper A signs in, and the chat part of the sign-in lands", async () => {
      await gotoAbout(page, { country: COUNTRY });
      const outcome = await attemptAuth(page, {
        intent: "login",
        phone: phoneOfA(),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });
      const session = await requireSignedInShopper(page, {
        outcome,
        who: "Shopper A, who this journey chats as",
      });
      expect(
        session.chat,
        "Shopper A signed in, but the chat backend's sign-in did not land — the app holds no chat user, so the chat cannot open",
      ).toBe(true);
    });

    await test.step("the nav chat icon opens the chat past the notification gate, and the chat backend lists her chats", async () => {
      await page.keyboard.press("Escape").catch(() => undefined);
      const list = await reloadAndOpenChat(page);
      expect(
        Array.isArray(list.channels),
        "the chat backend answered the chat list without a `channels` list",
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-02
  // ---------------------------------------------------------------------------

  test("CHAT-02 Shopper A finds Shopper B by phone and opens their conversation", async ({
    browser,
  }) => {
    const page = await heldA(browser);
    await reloadAndOpenChat(page);

    let opened: { via: "chat" | "contact"; chatId: string } | null = null;
    await test.step("searching B's phone draws exactly one row, and it opens the conversation", async () => {
      opened = await openConversationByPhone(page, {
        phone: phoneOfB(),
        who: "Shopper B",
      });
    });

    await test.step("the conversation is the one with Shopper B", async () => {
      // The row came from a phone search, so it can only be B's — but a chat row
      // names its channel, and that id is checked against the chat backend's own
      // list, which names its members.
      if (opened!.via === "contact") {
        expect(
          opened!.chatId,
          "a new conversation opened from the contact row, but not as the `ch-<user id>` placeholder a first message turns into a chat",
        ).toMatch(/^ch-\d+$/);
        return;
      }
      const list = await reloadAndOpenChat(page);
      const shared = channelWithPhone([...list.channels, ...list.pinned], phoneOfB());
      expect(
        String(shared?.id ?? ""),
        `the phone search opened chat ${opened!.chatId}, but the chat backend's list says the chat with Shopper B is ${shared?.id ?? "missing"}`,
      ).toBe(opened!.chatId);
      await openConversationById(page, { chatId: opened!.chatId, who: "Shopper B" });
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-03
  // ---------------------------------------------------------------------------

  test("CHAT-03 Shopper A sends a message, and the chat backend keeps it", async ({
    browser,
  }) => {
    const page = await heldA(browser);
    const message = text("first message");

    await test.step("the conversation with Shopper B is open", async () => {
      const onScreen = await chat.conversation(page).getAttribute("data-open");
      if (onScreen !== "true") {
        await reloadAndOpenChat(page);
        await openConversationByPhone(page, { phone: phoneOfB(), who: "Shopper B" });
      }
    });

    await test.step("the chat backend saves the message, and its row swaps the local id for the saved one", async () => {
      const sent = await sendText(page, { text: message, who: "Shopper B" });
      run.chatId = sent.channelId;
      run.firstMessageId = sent.messageId;
      run.firstMessageText = message;
      expect(
        sent.channelId,
        "the chat backend saved the message but named no chat for it",
      ).not.toBe("");
    });

    await test.step("the message shows as sent, not as still sending", async () => {
      await expect(
        chat.messageStatus(chat.message(page, firstMessage())),
        "the saved message still shows the 'sending' clock",
      ).not.toHaveAttribute("data-status", "pending");
    });

    await test.step("after a reload the chat backend still has the message, with its text", async () => {
      const list = await reopenConversation(page, "Shopper B");
      const shared = channelWithPhone([...list.channels, ...list.pinned], phoneOfB());
      expect(
        String(shared?.id ?? ""),
        "after the reload the chat backend's list has no chat with Shopper B",
      ).toBe(chatId());
      await expect(
        chat.messageText(chat.message(page, firstMessage())),
        `after the reload the conversation does not show message ${firstMessage()} with the text that was sent`,
      ).toHaveText(message);
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-04
  // ---------------------------------------------------------------------------

  test("CHAT-04 Shopper B reads the message, and Shopper A sees that it was read", async ({
    browser,
  }) => {
    needShopperB();
    const pageB = await heldB(browser);
    const id = firstMessage();

    await test.step("B's chat list shows the chat with A, with an unread count", async () => {
      const list = await reloadAndOpenChat(pageB);
      const shared = channelWithPhone([...list.channels, ...list.pinned], phoneOfA());
      expect(
        String(shared?.id ?? ""),
        "the chat backend's list for Shopper B has no chat with Shopper A",
      ).toBe(chatId());
      const badge = chat.rowUnread(chat.row(pageB, chatId()));
      await expect(
        badge,
        "Shopper B's row for the chat with A shows no unread count, although A's message is unread",
      ).toBeVisible();
      expect(
        Number(await badge.textContent()),
        "Shopper B's unread count for the chat with A is not a positive number",
      ).toBeGreaterThan(0);
    });

    await test.step("opening the chat tells the chat backend it was read, and shows A's message as received", async () => {
      const watched = watchChatCall(pageB, {
        endpoint: CHAT_ENDPOINT.watched(chatId()),
      });
      await openConversationById(pageB, { chatId: chatId(), who: "Shopper A" });
      requireChatAccepted(await watched, "marking the chat read when Shopper B opened it");
      const row = chat.message(pageB, id);
      await expect(row, `Shopper B does not see A's message ${id}`).toHaveAttribute(
        "data-from",
        "them",
      );
      await expect(
        chat.messageText(row),
        "Shopper B sees A's message with a different text",
      ).toHaveText(run.firstMessageText);
    });

    await test.step("after a reload Shopper A's message shows as read", async () => {
      const pageA = await heldA(browser);
      await reopenConversation(pageA, "Shopper B");
      await expect(
        chat.messageStatus(chat.message(pageA, id)),
        "Shopper B opened the chat, but A's message does not show as read — the chat backend did not record the read",
      ).toHaveAttribute("data-status", "watched");
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-05
  // ---------------------------------------------------------------------------

  test("CHAT-05 Shopper B replies to the message, and Shopper A sees the reply with its quote", async ({
    browser,
  }) => {
    needShopperB();
    const pageB = await heldB(browser);
    const id = firstMessage();
    let replyId = "";

    await test.step("B's reply carries A's message as its parent, and the chat backend saves it", async () => {
      await reopenConversation(pageB, "Shopper A");
      const reply = await replyTo(pageB, {
        messageId: id,
        text: text("reply from B"),
        who: "Shopper A",
      });
      replyId = reply.messageId;
      expect(
        String(reply.outcome.sent?.parent_message_id ?? ""),
        "Shopper B's reply was sent without A's message as its parent",
      ).toBe(id);
    });

    await test.step("after a reload Shopper A sees B's reply with the quote of her message", async () => {
      const pageA = await heldA(browser);
      await reopenConversation(pageA, "Shopper B");
      const row = chat.message(pageA, replyId);
      await expect(row, `Shopper A does not see B's reply ${replyId}`).toHaveAttribute(
        "data-from",
        "them",
      );
      await expect(
        chat.quote(row),
        "Shopper A sees B's reply, but without the quote of the message it answers",
      ).toContainText(run.firstMessageText);
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-06
  // ---------------------------------------------------------------------------

  test("CHAT-06 Shopper A edits her message, and both see the new text", async ({
    browser,
  }) => {
    const page = await heldA(browser);
    const id = firstMessage();
    const edited = text("first message edited");

    await test.step("the chat backend accepts the edit, and the message shows the new text", async () => {
      await reopenConversation(page, "Shopper B");
      const outcome = await editMessage(page, { messageId: id, text: edited });
      requireChatAccepted(outcome, "saving Shopper A's edit");
      await expect(
        chat.messageText(chat.message(page, id)),
        "the chat backend accepted the edit, but the message still shows the old text",
      ).toHaveText(edited);
      run.firstMessageText = edited;
    });

    await test.step("after a reload the chat backend still has the new text", async () => {
      await reopenConversation(page, "Shopper B");
      await expect(
        chat.messageText(chat.message(page, id)),
        "after the reload the message shows the old text — the chat backend did not keep the edit",
      ).toHaveText(edited);
    });

    await test.step("the message carries the Edited mark", async () => {
      // The chat backend answers `is_edited: 1` only when `updated_at` and
      // `created_at` differ, compared to the second (measured 2026-09-28: an
      // edit in the same second as the send stays 0, one 10 s later is 1). A
      // person cannot edit that fast, but a test can — so the edit this mark
      // is checked on is the one made about a minute after CHAT-03 sent it.
      await expect(
        chat.markEdited(chat.message(page, id)),
        "the edited message has no Edited mark after a reload — the chat backend answers is_edited 0 for it",
      ).toBeVisible();
    });

    await test.step("Shopper B sees the new text", async () => {
      if (!shopperBHere("Shopper B sees the new text")) return;
      const pageB = await heldB(browser);
      await reopenConversation(pageB, "Shopper A");
      await expect(
        chat.messageText(chat.message(pageB, id)),
        "Shopper B still sees the text from before A's edit",
      ).toHaveText(edited);
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-07
  // ---------------------------------------------------------------------------

  test("CHAT-07 Shopper A tags the message, then removes the tag", async ({
    browser,
  }) => {
    const page = await heldA(browser);
    const id = firstMessage();

    await test.step("the chat backend adds the 'important' tag, and the message shows the tag mark", async () => {
      await reopenConversation(page, "Shopper B");
      const outcome = await toggleTag(page, { messageId: id, tag: "important" });
      requireChatAccepted(outcome, "adding the 'important' tag");
      expect(
        outcome.data?.action,
        `the chat backend did not add the tag, it answered action "${outcome.data?.action}"`,
      ).toBe("added");
      await expect(
        chat.markTags(chat.message(page, id)),
        "the tag was added, but the message shows no tag mark",
      ).toBeVisible();
    });

    await test.step("after a reload the tag is still on the message", async () => {
      await reopenConversation(page, "Shopper B");
      await expect(
        chat.markTags(chat.message(page, id)),
        "after the reload the message has no tag mark — the chat backend did not keep the tag",
      ).toBeVisible();
    });

    await test.step("pressing the tag again removes it", async () => {
      const outcome = await toggleTag(page, { messageId: id, tag: "important" });
      requireChatAccepted(outcome, "removing the 'important' tag");
      expect(
        outcome.data?.action,
        `the chat backend did not remove the tag, it answered action "${outcome.data?.action}"`,
      ).toBe("removed");
      await expect(
        chat.markTags(chat.message(page, id)),
        "the tag was removed, but the message still shows the tag mark",
      ).toHaveCount(0);
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-08
  // ---------------------------------------------------------------------------

  test("CHAT-08 Shopper A sets a reminder on the message, then cancels it", async ({
    browser,
  }) => {
    const page = await heldA(browser);
    const id = firstMessage();

    await test.step("the chat backend saves a reminder for in 1 hour, and the message shows the reminder mark", async () => {
      await reopenConversation(page, "Shopper B");
      const outcome = await setReminder(page, { messageId: id, preset: "1h" });
      requireChatAccepted(outcome, "setting a reminder");
      expect(
        outcome.data?.id,
        "the chat backend accepted the reminder but gave it no id",
      ).toBeTruthy();
      await expect(
        chat.markReminder(chat.message(page, id)),
        "the reminder was saved, but the message shows no reminder mark",
      ).toBeVisible();
    });

    await test.step("after a reload the Reminders folder lists the message", async () => {
      const listed = watchChatCall(page, {
        endpoint: CHAT_ENDPOINT.myReminders,
        method: "GET",
      });
      await reloadAndOpenChat(page);
      requireChatAccepted(await listed, "loading the Reminders folder");
      await chat.remindersFolder(page).click();
      await expect(
        chat.reminderRow(page, id),
        "the Reminders folder does not list the message the reminder was set on",
      ).toBeVisible();
    });

    await test.step("cancelling removes the reminder mark and the folder row", async () => {
      await reopenConversation(page, "Shopper B");
      const outcome = await cancelReminder(page, { messageId: id });
      requireChatAccepted(outcome, "cancelling the reminder");
      await expect(
        chat.markReminder(chat.message(page, id)),
        "the reminder was cancelled, but the message still shows the reminder mark",
      ).toHaveCount(0);
      await reloadAndOpenChat(page);
      await chat.remindersFolder(page).click();
      await expect(chat.remindersList(page)).toBeVisible();
      await expect(
        chat.reminderRow(page, id),
        "after the reload the Reminders folder still lists the cancelled reminder",
      ).toHaveCount(0);
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-09
  // ---------------------------------------------------------------------------

  test("CHAT-09 Shopper A forwards a message into the chat", async ({ browser }) => {
    const page = await heldA(browser);
    const id = firstMessage();
    let copyId = "";

    await test.step("the chat backend saves the copy as a forwarded message", async () => {
      await reopenConversation(page, "Shopper B");
      const outcome = await forwardMessage(page, { messageId: id, toChatId: chatId() });
      requireChatAccepted(outcome, "forwarding the message");
      expect(
        outcome.sent?.is_forward,
        "the forwarded copy was sent without is_forward",
      ).toBe(1);
      copyId = String(outcome.data?.id ?? "");
      expect(copyId, "the chat backend saved the forwarded copy but gave it no id").not.toBe("");
    });

    await test.step("after a reload the copy shows the Forwarded mark", async () => {
      await reopenConversation(page, "Shopper B");
      await expect(
        chat.markForwarded(chat.message(page, copyId)),
        "after the reload the forwarded copy has no Forwarded mark",
      ).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-10
  // ---------------------------------------------------------------------------

  test("CHAT-10 Shopper A deletes one message for everyone and one only for herself", async ({
    browser,
  }) => {
    const page = await heldA(browser);
    let forAll = "";
    let forMe = "";

    await test.step("A sends the two messages", async () => {
      await reopenConversation(page, "Shopper B");
      forAll = (await sendText(page, { text: text("delete for everyone"), who: "Shopper B" })).messageId;
      forMe = (await sendText(page, { text: text("delete for me"), who: "Shopper B" })).messageId;
    });

    await test.step("'For All' asks the chat backend to delete it for everyone", async () => {
      const outcome = await deleteMessage(page, { messageId: forAll, forAll: true });
      requireChatAccepted(outcome, "deleting a message for everyone");
      expect(
        outcome.sent?.delete_for_all,
        "'For All' was sent as a delete for Shopper A only",
      ).toBe(1);
    });

    await test.step("'For Me' asks the chat backend to delete it only for A", async () => {
      const outcome = await deleteMessage(page, { messageId: forMe, forAll: false });
      requireChatAccepted(outcome, "deleting a message for Shopper A only");
      expect(
        outcome.sent?.delete_for_all,
        "'For Me' was sent as a delete for everyone",
      ).toBe(0);
    });

    await test.step("after a reload A sees both as deleted", async () => {
      await reopenConversation(page, "Shopper B");
      await expect(
        chat.messageDeleted(chat.message(page, forAll)),
        "after the reload the message deleted for everyone is shown again to Shopper A",
      ).toBeVisible();
      await expect(
        chat.messageDeleted(chat.message(page, forMe)),
        "after the reload the message deleted for Shopper A is shown again to her",
      ).toBeVisible();
    });

    await test.step("B sees the first as deleted and the second as it was", async () => {
      if (!shopperBHere("B sees the first as deleted and the second as it was")) return;
      const pageB = await heldB(browser);
      await reopenConversation(pageB, "Shopper A");
      await expect(
        chat.messageDeleted(chat.message(pageB, forAll)),
        "Shopper B still sees the message A deleted for everyone",
      ).toBeVisible();
      await expect(
        chat.messageText(chat.message(pageB, forMe)),
        "Shopper B no longer sees the message A deleted only for herself",
      ).toHaveText(text("delete for me"));
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-11 .. CHAT-14 — the options behind the chat row
  // ---------------------------------------------------------------------------

  test("CHAT-11 Shopper A pins the chat, then unpins it", async ({ browser }) => {
    const page = await heldA(browser);
    let wasPinned = false;

    await test.step("the chat starts unpinned", async () => {
      const list = await reloadAndOpenChat(page);
      wasPinned = list.pinned.some((c: any) => String(c.id) === chatId());
      if (wasPinned) {
        // A failed run left it pinned. Unpin first, so this case still proves both ways.
        requireChatAccepted(await togglePin(page, { chatId: chatId() }), "unpinning a chat a failed run left pinned");
        await reloadAndOpenChat(page);
      }
    });

    await test.step("pinning is saved, and after a reload the chat is pinned and first", async () => {
      const outcome = await togglePin(page, { chatId: chatId() });
      leftChanged.pinned = true;
      requireChatAccepted(outcome, "pinning the chat");
      expect(outcome.sent?.pin, "the pin was sent as an unpin").toBe(1);
      const list = await reloadAndOpenChat(page);
      expect(
        list.pinned.some((c: any) => String(c.id) === chatId()),
        "after the reload the chat backend does not list the chat as pinned",
      ).toBe(true);
      await expect(
        chat.rowPinned(chat.row(page, chatId())),
        "the chat is pinned, but its row shows no pin",
      ).toBeVisible();
      await expect(
        chat.rows(page).first(),
        "the pinned chat is not the first row of the list",
      ).toHaveAttribute("data-chat-id", chatId());
    });

    await test.step("unpinning is saved", async () => {
      const outcome = await togglePin(page, { chatId: chatId() });
      requireChatAccepted(outcome, "unpinning the chat");
      expect(outcome.sent?.pin, "the unpin was sent as a pin").toBe(0);
      const list = await reloadAndOpenChat(page);
      expect(
        list.pinned.some((c: any) => String(c.id) === chatId()),
        "after the reload the chat backend still lists the chat as pinned",
      ).toBe(false);
      leftChanged.pinned = null;
    });
  });

  test("CHAT-12 Shopper A mutes the chat, then puts it back as it was", async ({
    browser,
  }) => {
    const page = await heldA(browser);
    let startMuted = false;

    await test.step("the chat backend says whether the chat starts muted", async () => {
      const list = await reloadAndOpenChat(page);
      const mine = myMemberIn([...list.channels, ...list.pinned], phoneOfA());
      expect(mine, "the chat backend's list has no member row for Shopper A in the chat with B").toBeTruthy();
      startMuted = Number(mine.mute) === 1;
    });

    await test.step("the first press flips the mute, and the chat backend keeps it", async () => {
      const outcome = await toggleMute(page, { chatId: chatId() });
      leftChanged.muted = startMuted;
      requireChatAccepted(outcome, startMuted ? "unmuting the chat" : "muting the chat");
      expect(
        outcome.sent?.mute,
        `the chat started ${startMuted ? "muted" : "unmuted"}, but the press sent mute ${outcome.sent?.mute}`,
      ).toBe(startMuted ? 0 : 1);
      const list = await reloadAndOpenChat(page);
      const mine = myMemberIn([...list.channels, ...list.pinned], phoneOfA());
      expect(
        Number(mine?.mute),
        "after the reload the chat backend did not keep the new mute setting",
      ).toBe(startMuted ? 0 : 1);
    });

    await test.step("the second press puts it back", async () => {
      const outcome = await toggleMute(page, { chatId: chatId() });
      requireChatAccepted(outcome, "putting the mute back");
      const list = await reloadAndOpenChat(page);
      const mine = myMemberIn([...list.channels, ...list.pinned], phoneOfA());
      expect(
        Number(mine?.mute),
        "after the reload the chat's mute is not back where it started",
      ).toBe(startMuted ? 1 : 0);
      leftChanged.muted = null;
    });
  });

  test("CHAT-13 Shopper A marks the chat unread, then read", async ({ browser }) => {
    const page = await heldA(browser);

    await test.step("marking it unread is saved, and after a reload the row shows an unread count", async () => {
      await reloadAndOpenChat(page);
      const outcome = await toggleUnread(page, { chatId: chatId(), markUnread: true });
      requireChatAccepted(outcome, "marking the chat unread");
      await reloadAndOpenChat(page);
      await expect(
        chat.rowUnread(chat.row(page, chatId())),
        "after the reload the chat marked unread shows no unread count — the chat backend did not keep the mark",
      ).toBeVisible();
    });

    await test.step("marking it read is saved, and after a reload the count is gone", async () => {
      const outcome = await toggleUnread(page, { chatId: chatId(), markUnread: false });
      requireChatAccepted(outcome, "marking the chat read");
      await reloadAndOpenChat(page);
      await expect(
        chat.rowUnread(chat.row(page, chatId())),
        "after the reload the chat marked read still shows an unread count",
      ).toHaveCount(0);
    });
  });

  test("CHAT-14 Shopper A archives the chat, then unarchives it", async ({
    browser,
  }) => {
    const page = await heldA(browser);

    await test.step("archiving is saved, and after a reload the chat is out of the main list", async () => {
      await reloadAndOpenChat(page);
      const outcome = await toggleArchive(page, { chatId: chatId() });
      leftChanged.archived = true;
      requireChatAccepted(outcome, "archiving the chat");
      expect(outcome.sent?.archived, "the archive was sent as an unarchive").toBe(1);
      await reloadAndOpenChat(page);
      await expect(
        chat.row(page, chatId()),
        "after the reload the archived chat is still in the main list",
      ).toHaveCount(0);
    });

    await test.step("the Archived folder shows the chat", async () => {
      const folder = watchChatCall(page, {
        endpoint: CHAT_ENDPOINT.channels,
        method: "POST",
        sentMatches: (sent) => !isMainListRequest(sent),
      });
      await chat.archivedFolder(page).click();
      const outcome = await folder;
      requireChatAccepted(outcome, "loading the Archived folder");
      const listed = [...(outcome.data?.channels ?? []), ...(outcome.data?.pinned_channels ?? [])];
      expect(
        listed.some((c: any) => String(c.id) === chatId()),
        "the chat backend's archived list does not include the chat that was archived",
      ).toBe(true);
      await expect(
        chat.row(page, chatId()),
        "the chat backend lists the chat as archived, but the Archived folder does not show it",
      ).toBeVisible();
    });

    await test.step("unarchiving is saved, and after a reload the chat is back in the main list", async () => {
      const outcome = await toggleArchive(page, { chatId: chatId() });
      requireChatAccepted(outcome, "unarchiving the chat");
      expect(outcome.sent?.archived, "the unarchive was sent as an archive").toBe(0);
      await reloadAndOpenChat(page);
      await expect(
        chat.row(page, chatId()),
        "after the reload the unarchived chat is not back in the main list",
      ).toBeVisible();
      leftChanged.archived = false;
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-15
  // ---------------------------------------------------------------------------

  test("CHAT-15 Shopper A blocks Shopper B, and both see the chat closed; A unblocks", async ({
    browser,
  }) => {
    needShopperB();
    const page = await heldA(browser);
    const pageB = await heldB(browser);

    await test.step("the chat backend saves the block", async () => {
      await reopenConversation(page, "Shopper B");
      const outcome = await toggleBlock(page, { block: true });
      leftChanged.blocked = true;
      requireChatAccepted(outcome, "blocking Shopper B");
      await page.keyboard.press("Escape").catch(() => undefined);
    });

    await test.step("after a reload B sees the chat closed and has nowhere to type", async () => {
      await reopenConversation(pageB, "Shopper A");
      await expect(
        chat.blockedBanner(pageB),
        "Shopper A blocked Shopper B, but B's conversation does not say it is closed",
      ).toBeVisible();
      await expect(
        chat.input(pageB),
        "Shopper B was blocked, but still has a message input",
      ).toHaveCount(0);
    });

    await test.step("after a reload A sees the chat closed too", async () => {
      await reopenConversation(page, "Shopper B");
      await expect(
        chat.blockedBanner(page),
        "Shopper A blocked B, but her own conversation does not say it is closed",
      ).toBeVisible();
    });

    await test.step("unblocking is saved, and B can type again", async () => {
      const outcome = await toggleBlock(page, { block: false });
      requireChatAccepted(outcome, "unblocking Shopper B");
      leftChanged.blocked = false;
      await page.keyboard.press("Escape").catch(() => undefined);
      await reopenConversation(pageB, "Shopper A");
      await expect(
        chat.input(pageB),
        "Shopper A unblocked B, but B still has no message input",
      ).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // CHAT-16
  // ---------------------------------------------------------------------------

  test("CHAT-16 Shopper A deletes the conversation, and Shopper B still has it", async ({
    browser,
  }) => {
    const page = await heldA(browser);

    await test.step("the chat backend deletes the chat for A, and after a reload it is gone from her list", async () => {
      await reloadAndOpenChat(page);
      const outcome = await deleteChat(page, { chatId: chatId() });
      requireChatAccepted(outcome, "deleting the chat");
      const list = await reloadAndOpenChat(page);
      expect(
        [...list.channels, ...list.pinned].some((c: any) => String(c.id) === chatId()),
        "after the reload the chat backend still lists the deleted chat for Shopper A",
      ).toBe(false);
      await expect(
        chat.row(page, chatId()),
        "after the reload the deleted chat is still in Shopper A's list",
      ).toHaveCount(0);
    });

    await test.step("B's list still has the chat — deleting is for one person", async () => {
      if (!shopperBHere("B still has the chat")) return;
      const pageB = await heldB(browser);
      const list = await reloadAndOpenChat(pageB);
      expect(
        [...list.channels, ...list.pinned].some((c: any) => String(c.id) === chatId()),
        "Shopper A deleted the chat for herself, but it is gone from Shopper B's list too",
      ).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CHAT-17 — outside the journey, on purpose
//
// Red on staging for the chat backend (measured 2026-09-27 and 2026-09-28).
// Inside the serial journey above, a red case would skip every case after it.
// Out here it runs whatever happened before it. So it may not lean on
// anything the journey learned: it runs as Shopper B, finds the chat with A
// in B's own list, and uses B's own message.
// ---------------------------------------------------------------------------

test("CHAT-17 Shopper B searches inside the chat for a word only this run wrote", async ({
  browser,
}) => {
  needShopperB();
  const pageB = await heldB(browser);
  let wanted = "";

  await test.step("B sends a message with the word", async () => {
    await openChatWithA(pageB);
    const sent = await sendText(pageB, {
      text: text(`${SEARCH_WORD} is the word to find`),
      who: "Shopper A",
    });
    wanted = sent.messageId;
  });

  await test.step("the chat backend's search finds the message", async () => {
    // Red on staging, for the chat backend. Measured 2026-09-28: a new message
    // was still not found after 20 minutes (340092), and the other person
    // reading it did not change that. An edited message is found at once
    // (340089, 340091), and messages from the day before are found now. So a
    // new message reaches the search only much later, and an edit reaches it
    // at once. The search is asked again every 5 seconds for at most 60.
    const { ids, outcome } = await searchInConversation(pageB, {
      query: SEARCH_WORD,
    });
    requireChatAccepted(outcome, "searching inside the chat");
    let found = ids.includes(wanted);
    for (let tries = 0; !found && tries < 12; tries++) {
      await pageB.waitForTimeout(5_000);
      const again = watchChatCall(pageB, { endpoint: CHAT_ENDPOINT.channelSearch });
      await chat.searchInput(pageB).fill("");
      await chat.searchInput(pageB).fill(SEARCH_WORD);
      const answer = await again;
      requireChatAccepted(answer, "searching inside the chat again");
      found = ((answer.data?.messages_ids ?? []) as unknown[])
        .map(String)
        .includes(wanted);
    }
    expect(
      found,
      `the chat backend's search did not find message ${wanted} by a word it contains, within 60 seconds — the chat backend puts a new message into its search only much later (an edited one at once)`,
    ).toBe(true);
  });

  await test.step("the conversation marks that message as the current match", async () => {
    await expect(
      chat.searchHit(pageB),
      "the search found the message, but the conversation did not mark it",
    ).toHaveAttribute("id", `main-container-${wanted}`);
  });
});

// ---------------------------------------------------------------------------
// Put back what a failed case left, and hand both sessions on
// ---------------------------------------------------------------------------

test.afterAll(async () => {
  test.setTimeout(180_000);
  const a = shopperA;
  const b = shopperB;
  shopperA = null;
  shopperB = null;

  // Quiet on purpose: a clean-up that throws replaces the failure the run was
  // reporting.
  if (a && run.chatId) {
    try {
      const page = a.page;
      if (leftChanged.blocked) {
        await reopenConversation(page, "Shopper B");
        await toggleBlock(page, { block: false });
        await page.keyboard.press("Escape").catch(() => undefined);
      }
      if (leftChanged.archived) {
        await reloadAndOpenChat(page);
        await chat.archivedFolder(page).click();
        await toggleArchive(page, { chatId: run.chatId });
      }
      if (leftChanged.pinned) {
        await reloadAndOpenChat(page);
        await togglePin(page, { chatId: run.chatId });
      }
      if (leftChanged.muted !== null) {
        const list = await reloadAndOpenChat(page);
        const mine = myMemberIn([...list.channels, ...list.pinned], phoneOfA());
        if (Number(mine?.mute) !== (leftChanged.muted ? 1 : 0)) {
          await toggleMute(page, { chatId: run.chatId });
        }
      }
    } catch {
      // See above.
    }
  }

  if (a) {
    await handOnSession(a.context, a.page, SESSION_STATE.chat).catch(() => undefined);
    await a.context.close().catch(() => undefined);
  }
  if (b) {
    await handOnSession(b.context, b.page, QA_SELLER_SESSION_PATH).catch(() => undefined);
    await b.context.close().catch(() => undefined);
  }
});
