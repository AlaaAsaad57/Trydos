// Every push we show must carry a grouping `tag`, so a new card replaces the
// old one instead of stacking.
//
// Why this matters: the backend pushes to the `market` topic, and a burst of
// pushes used to leave one card per message in the user's notification centre.
// Browsers read that as spam, and so do users. The chat branch of the worker
// already grouped per conversation (`chat-<id>`); `MARKET_TAG_RULES` does the
// same for the eleven `market` types.
//
// The worker is `public/firebase-messaging-sw.js`. Nothing imports it — the
// browser loads it as a classic service worker script, so there is no module to
// import here. Instead we slice the rules block out of the file and evaluate
// just that, which is why a syntax error anywhere else in the worker does not
// reach this test. The narrow slice is the point: it keeps the test about the
// tag table and nothing else.
//
// What a failure here means: somebody added a `market` type to the worker and
// gave it no tag rule (that type is then untagged and stacks again), or changed
// a rule's scope. A scope change is the dangerous one — dropping `product_slug`
// from a product alert makes an alert about one product silently delete the
// alert about another.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

type MarketBody = Record<string, unknown>;
type BuildMarketTag = (body: MarketBody) => string | null;

function loadBuildMarketTag(): BuildMarketTag {
  const source = readFileSync(
    join(process.cwd(), "public/firebase-messaging-sw.js"),
    "utf8",
  );
  const start = source.indexOf("const MARKET_TAG_RULES");
  const end = source.indexOf("messaging.onBackgroundMessage");
  expect(
    start,
    "public/firebase-messaging-sw.js no longer declares MARKET_TAG_RULES — the tag table was renamed or deleted",
  ).toBeGreaterThan(-1);
  expect(
    end,
    "public/firebase-messaging-sw.js no longer calls messaging.onBackgroundMessage — this test cannot find the end of the tag block",
  ).toBeGreaterThan(start);
  const block = source.slice(start, end);
  return new Function(`${block}\nreturn buildMarketTag;`)() as BuildMarketTag;
}

const buildMarketTag = loadBuildMarketTag();

describe("market notification tags", () => {
  // One row per `market` type the worker handles. Adding a type to the worker
  // without adding it here leaves the type untagged in production.
  const cases: Array<[string, MarketBody, string]> = [
    ["boutique created", { type: "boutique created" }, "market-boutique-created"],
    ["category created", { type: "category created" }, "market-category-created"],
    ["product cart expiration", { type: "product cart expiration" }, "market-cart-expiration"],
    ["product hurry up", { type: "product hurry up now" }, "market-cart-hurry-up"],
    ["product availability", { type: "product availability", product_slug: "p-1" }, "market-availability-p-1"],
    ["product discount", { type: "product discount", product_slug: "p-2" }, "market-discount-p-2"],
    ["product comment", { type: "product comment", product_slug: "p-3" }, "market-comment-p-3"],
    ["product before stock out", { type: "product before stock out", product_slug: "p-4" }, "market-before-stock-out-p-4"],
    ["product when change in price", { type: "product when change in price", product_slug: "p-5" }, "market-price-change-p-5"],
    ["order placed", { type: "order placed", order_group_id: 77 }, "market-order-placed-77"],
    ["order status changed", { type: "order status changed to shipped", order_group_id: 88 }, "market-order-status-88"],
  ];

  it.each(cases)(
    'the "%s" push is tagged',
    (type, body, expected) => {
      expect(
        buildMarketTag(body),
        `the "${type}" push carries no grouping tag, so every one of them stacks as its own card`,
      ).toBe(expected);
    },
  );

  it("keeps one card per product, so two product alerts never delete each other", () => {
    const shirt = buildMarketTag({ type: "product availability", product_slug: "shirt" });
    const shoes = buildMarketTag({ type: "product availability", product_slug: "shoes" });
    expect(
      shoes,
      `two products share the tag "${shirt}" — the alert the user asked for on one product is wiped out by the other`,
    ).not.toBe(shirt);
  });

  it("keeps one card per order, so two orders never delete each other", () => {
    const first = buildMarketTag({ type: "order status changed to shipped", order_group_id: 1 });
    const second = buildMarketTag({ type: "order status changed to shipped", order_group_id: 2 });
    expect(
      second,
      `two orders share the tag "${first}" — an update about one order wipes out the update about the other`,
    ).not.toBe(first);
  });

  it("collapses repeated boutique broadcasts into one card", () => {
    const first = buildMarketTag({ type: "boutique created", boutique_slug: "x" });
    const second = buildMarketTag({ type: "boutique created", boutique_slug: "y" });
    expect(
      second,
      "two boutique broadcasts got different tags, so a marketing burst still stacks one card per message",
    ).toBe(first);
  });

  it("leaves an unknown type untagged rather than guessing a tag", () => {
    expect(
      buildMarketTag({ type: "a type the backend added later" }),
      "an unknown type was given a tag — sharing one tag would make two unrelated notifications delete each other",
    ).toBeNull();
  });

  it("leaves a payload with no type untagged", () => {
    expect(
      buildMarketTag({}),
      "a payload with no type was given a tag, which would group it with every other typeless payload",
    ).toBeNull();
  });
});

// A long chat message arrives as a "compact" push: ids only, no text, no
// sender object and no message type. The worker read
// `message.sender_user.name` first, threw, and showed nothing at all — so a
// user with no tab open never heard about a long message.
//
// This runs the whole worker with the browser globals stubbed, then hands the
// background handler the compact push exactly as the chat backend sends it.
describe("a compact chat push in the background", () => {
  function loadBackgroundHandler() {
    const source = readFileSync(
      join(process.cwd(), "public/firebase-messaging-sw.js"),
      "utf8",
    );
    let handler: ((payload: unknown) => Promise<void>) | undefined;
    const showNotification = vi.fn();
    const self = {
      addEventListener: () => {},
      location: { origin: "https://trydos.test" },
      clients: { matchAll: async () => [] },
      registration: { showNotification, getNotifications: async () => [] },
    };
    const firebase = {
      initializeApp: () => {},
      messaging: () => ({
        onBackgroundMessage: (fn: typeof handler) => {
          handler = fn;
        },
      }),
    };
    new Function("self", "importScripts", "firebase", "caches", "clients", source)(
      self,
      () => {},
      firebase,
      {},
      self.clients,
    );
    expect(
      handler,
      "public/firebase-messaging-sw.js no longer registers messaging.onBackgroundMessage",
    ).toBeDefined();
    return { handler: handler!, showNotification };
  }

  const compactPush = {
    data: {
      type: "message",
      body: JSON.stringify({ type: "message" }),
      data: JSON.stringify({
        type: "message",
        contact_name: "Alaa",
        prev_message_id: "339781",
        is_private: false,
        channel_id: "539",
        message_id: "339782",
        message: { id: "339782", channel_id: "539", sender_user_id: 672 },
        compact: true,
      }),
    },
  };

  it("shows a notification named after the sender, grouped with its chat", async () => {
    const { handler, showNotification } = loadBackgroundHandler();

    await handler(compactPush);

    const [title, options] = showNotification.mock.calls[0] ?? [];
    expect(
      title,
      "a compact push showed no notification at all, so a long message arrives in silence",
    ).toBe("Alaa");
    expect(
      options?.tag,
      `the compact push was not grouped with its chat (tag ${options?.tag})`,
    ).toBe("chat-539");
    expect(
      options?.body,
      "the compact push notification has no body text",
    ).toBeTruthy();
  });
});

// A muted chat must not raise a background notification.
//
// Mute is stored per member: each row in `channel.channel_members` has its own
// `mute`, and only the row of the person the push is for counts. The worker
// cannot read the signed-in user (the profile cookie is HttpOnly), but it does
// not need to: the push names the receiver in `message.receiver_user_id`.
//
// The payload below is a real push from staging (phone numbers removed). The
// receiver, user 657, has `mute: 1`; the sender, user 672, has `mute: 0`.
describe("a chat push in the background for a muted chat", () => {
  function loadBackgroundHandler() {
    const source = readFileSync(
      join(process.cwd(), "public/firebase-messaging-sw.js"),
      "utf8",
    );
    let handler: ((payload: unknown) => Promise<void>) | undefined;
    const showNotification = vi.fn();
    const self = {
      addEventListener: () => {},
      location: { origin: "https://trydos.test" },
      clients: { matchAll: async () => [] },
      registration: { showNotification, getNotifications: async () => [] },
    };
    const firebase = {
      initializeApp: () => {},
      messaging: () => ({
        onBackgroundMessage: (fn: typeof handler) => {
          handler = fn;
        },
      }),
    };
    new Function("self", "importScripts", "firebase", "caches", "clients", source)(
      self,
      () => {},
      firebase,
      {},
      self.clients,
    );
    return { handler: handler!, showNotification };
  }

  const buildPush = (receiverMute: 0 | 1) => ({
    from: "817506223106",
    data: {
      type: "message",
      channel_id: "trydos_notifications",
      data: JSON.stringify({
        type: "message",
        contact_name: "Alaa",
        message: {
          id: "339827",
          sender_user_id: 672,
          receiver_user_id: 657,
          channel_id: "539",
          message_content: { message_id: 339827, content: "Hi" },
          message_type: { name: "TextMessage", event_name: "TextMessageEvent" },
          channel: {
            id: "539",
            channel_name: "Trydos Relogin 120844",
            is_mute: 0,
            channel_members: [
              { id: 1077, user_id: 672, mute: 0, archived: 0, pin: 1 },
              { id: 1078, user_id: 657, mute: receiverMute, archived: 0, pin: 0 },
            ],
          },
          message_files: [],
          sender_user: { id: 672, name: "Alaa Test123" },
          body: "Hi",
        },
        prev_message_id: "339789",
        is_private: false,
      }),
    },
  });

  it("shows nothing when the receiver muted the chat", async () => {
    const { handler, showNotification } = loadBackgroundHandler();

    await handler(buildPush(1));

    expect(
      showNotification.mock.calls.length,
      `chat 539 is muted for the receiver (user 657) yet the worker showed ${showNotification.mock.calls.length} notification(s)`,
    ).toBe(0);
  });

  it("still shows the notification when the receiver did not mute the chat", async () => {
    const { handler, showNotification } = loadBackgroundHandler();

    await handler(buildPush(0));

    expect(
      showNotification.mock.calls[0]?.[0],
      "an unmuted chat showed no notification, so the mute check silences everything",
    ).toBe("Alaa Test123");
  });
});

// A click on a notification. Order-status cards reuse a tab that is already
// open on the same order and ask it to load its data again; every other card
// keeps opening a new tab.
//
// The whole worker runs here with the browser globals stubbed, like the blocks
// above, but this loader also keeps the `notificationclick` listener and gives
// the worker a list of open windows the test can change. Each case first hands
// the background handler a real push with no window open, takes the `data`
// the worker gave the card, then clicks that card. So the click runs on the
// data the worker really builds, not on data the test made up.
describe("a click on a notification", () => {
  const ORIGIN = "https://trydos.test";
  const ORDER_URL = `${ORIGIN}/settings/orders/12`;

  type FakeWindow = {
    url: string;
    focus: ReturnType<typeof vi.fn>;
    postMessage: ReturnType<typeof vi.fn>;
  };

  const tab = (path: string): FakeWindow => ({
    url: ORIGIN + path,
    focus: vi.fn(async () => {}),
    postMessage: vi.fn(),
  });

  function loadWorker() {
    const source = readFileSync(
      join(process.cwd(), "public/firebase-messaging-sw.js"),
      "utf8",
    );
    const listeners: Record<string, (event: any) => void> = {};
    let background: ((payload: unknown) => Promise<void>) | undefined;
    const showNotification = vi.fn();
    const windows: FakeWindow[] = [];
    const clients = {
      matchAll: async () => windows,
      openWindow: vi.fn(async (url: string) => ({ url })),
    };
    const self = {
      addEventListener: (type: string, fn: (event: any) => void) => {
        listeners[type] = fn;
      },
      location: { origin: ORIGIN },
      clients,
      registration: { showNotification, getNotifications: async () => [] },
    };
    const firebase = {
      initializeApp: () => {},
      messaging: () => ({
        onBackgroundMessage: (fn: typeof background) => {
          background = fn;
        },
      }),
    };
    new Function("self", "importScripts", "firebase", "caches", "clients", source)(
      self,
      () => {},
      firebase,
      {},
      clients,
    );
    expect(
      listeners.notificationclick,
      "public/firebase-messaging-sw.js no longer listens for notificationclick",
    ).toBeDefined();

    /** Shows the card for `push` (no window open yet) and returns its data. */
    const cardFor = async (push: unknown) => {
      await background!(push);
      const options = showNotification.mock.calls.at(-1)?.[1];
      expect(options, "the push showed no notification card to click").toBeDefined();
      return options.data;
    };

    /** Clicks a card and waits for everything the worker kept alive. */
    const click = async (data: unknown) => {
      const kept: Promise<unknown>[] = [];
      const event = {
        notification: { data, close: vi.fn() },
        action: "",
        waitUntil: vi.fn((promise: Promise<unknown>) => {
          kept.push(promise);
        }),
      };
      listeners.notificationclick(event);
      await Promise.all(kept);
      return event;
    };

    return { windows, clients, cardFor, click };
  }

  const marketPush = (body: Record<string, unknown>) => ({
    data: { title: "market", body: JSON.stringify(body) },
  });

  const statusPush = (type: string) =>
    marketPush({ type, order_group_id: 12, description: "Your order moved on" });

  it.each(["order status changed", "order status changed to shipped"])(
    'a "%s" click focuses the open tab on that order and asks it to refresh',
    async (type) => {
      const worker = loadWorker();
      const data = await worker.cardFor(statusPush(type));
      // Another locale than the card link: the tab is still the same order.
      const open = tab("/sy-ar/settings/orders/12");
      worker.windows.push(open);

      await worker.click(data);

      expect(
        open.focus,
        "the tab already open on order 12 was not brought to the front",
      ).toHaveBeenCalled();
      expect(
        open.postMessage,
        "the open order tab was not asked to load order 12 again",
      ).toHaveBeenCalledWith({ type: "REFRESH_ORDER_DETAILS", order_group_id: 12 });
      expect(
        worker.clients.openWindow,
        "a second tab was opened although order 12 was already open",
      ).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["no tab is open", []],
    ["the open tab shows another order", ["/sy-en/settings/orders/99"]],
    ["the open tab shows the orders list", ["/sy-en/settings/orders"]],
    ["the open tab shows order 112", ["/sy-en/settings/orders/112"]],
  ])(
    "an order-status click opens a new tab when %s",
    async (_case, paths) => {
      const worker = loadWorker();
      const data = await worker.cardFor(statusPush("order status changed to shipped"));
      const open = paths.map(tab);
      worker.windows.push(...open);

      await worker.click(data);

      expect(
        worker.clients.openWindow.mock.calls,
        "the click did not open exactly one new tab on order 12",
      ).toEqual([[ORDER_URL]]);
      for (const window of open) {
        expect(
          window.focus,
          `the tab on ${window.url} was focused, but it does not show order 12`,
        ).not.toHaveBeenCalled();
        expect(
          window.postMessage,
          `the tab on ${window.url} was asked to refresh, but it does not show order 12`,
        ).not.toHaveBeenCalled();
      }
    },
  );

  it("an order-status click without an order group id reuses no tab", async () => {
    const worker = loadWorker();
    const data = await worker.cardFor(marketPush({ type: "order status changed" }));
    const open = tab("/sy-en/settings/orders/undefined");
    worker.windows.push(open);

    await worker.click(data);

    expect(open.focus, "a tab was reused for a card that names no order").not.toHaveBeenCalled();
    expect(
      open.postMessage,
      "a tab was asked to refresh for a card that names no order",
    ).not.toHaveBeenCalled();
    expect(
      worker.clients.openWindow,
      "a card that names no order did not open one new tab",
    ).toHaveBeenCalledTimes(1);
  });

  it("with two tabs on the same order, only the most recent one is reused", async () => {
    const worker = loadWorker();
    const data = await worker.cardFor(statusPush("order status changed to shipped"));
    // matchAll lists the most recently focused window first.
    const recent = tab("/sy-en/settings/orders/12");
    const older = tab("/sy-en/settings/orders/12");
    worker.windows.push(recent, older);

    await worker.click(data);

    expect(recent.focus, "the tab used most recently was not brought to the front").toHaveBeenCalled();
    expect(
      recent.postMessage,
      "the tab used most recently was not asked to refresh",
    ).toHaveBeenCalledWith({ type: "REFRESH_ORDER_DETAILS", order_group_id: 12 });
    expect(older.focus, "the older tab on the same order was focused too").not.toHaveBeenCalled();
    expect(older.postMessage, "the older tab on the same order was asked to refresh too").not.toHaveBeenCalled();
  });

  it.each([
    [
      "focusing it fails",
      (open: FakeWindow) => {
        open.focus.mockRejectedValue(new Error("not allowed to focus"));
      },
      "focus" as const,
    ],
    [
      "sending it the refresh request fails",
      (open: FakeWindow) => {
        open.postMessage.mockImplementation(() => {
          throw new Error("client gone");
        });
      },
      "postMessage" as const,
    ],
  ])(
    "an order-status click opens a new tab when %s",
    async (_case, breakTab, triedStep) => {
      const worker = loadWorker();
      const data = await worker.cardFor(statusPush("order status changed to shipped"));
      const open = tab("/sy-en/settings/orders/12");
      breakTab(open);
      worker.windows.push(open);

      await worker.click(data);

      // Without this check the case passes on a worker that never tries the
      // open tab at all, because a plain click opens a new tab anyway.
      expect(
        open[triedStep],
        `the worker never tried the tab already open on order 12 (no ${triedStep} call)`,
      ).toHaveBeenCalled();
      expect(
        worker.clients.openWindow.mock.calls,
        "the click was lost: no new tab opened after the open tab failed",
      ).toEqual([[ORDER_URL]]);
    },
  );

  it("a delivery-chat click still focuses the order tab and opens the chat, or opens a new tab", async () => {
    const chatPush = {
      data: {
        type: "message",
        data: JSON.stringify({
          type: "message",
          is_private: true,
          order_group_id: 12,
          order_id: 5,
          message: {
            id: "1",
            channel_id: "77",
            sender_user: { id: 9, name: "Driver" },
            message_type: { name: "TextMessage" },
            message_content: { content: "On my way" },
          },
        }),
      },
    };

    const reused = loadWorker();
    const reusedData = await reused.cardFor(chatPush);
    const open = tab("/sy-en/settings/orders/12");
    reused.windows.push(open);
    await reused.click(reusedData);
    expect(open.focus, "the delivery-chat click did not bring the order tab to the front").toHaveBeenCalled();
    expect(
      open.postMessage,
      "the delivery-chat click did not ask the order tab to open the chat",
    ).toHaveBeenCalledWith({
      type: "OPEN_DELIVERY_CHAT",
      order_group_id: 12,
      order_id: 5,
      chat_id: 5,
    });
    expect(
      reused.clients.openWindow,
      "the delivery-chat click opened a second tab although the order was open",
    ).not.toHaveBeenCalled();

    const fresh = loadWorker();
    const freshData = await fresh.cardFor(chatPush);
    await fresh.click(freshData);
    expect(
      fresh.clients.openWindow,
      "the delivery-chat click opened no tab when no order tab was open",
    ).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "order placed",
      marketPush({ type: "order placed", order_group_id: 77, description: "Placed" }),
      `${ORIGIN}/settings/orders`,
    ],
    [
      "product discount",
      marketPush({ type: "product discount", product_slug: "p-2", description: "Cheaper" }),
      `${ORIGIN}/products/p-2`,
    ],
  ])(
    'a "%s" click opens one new tab and keeps the worker alive until it is requested',
    async (_type, push, url) => {
      const worker = loadWorker();
      const data = await worker.cardFor(push);
      worker.windows.push(tab(new URL(url).pathname));

      const event = await worker.click(data);

      expect(
        worker.clients.openWindow.mock.calls,
        `the click did not open exactly one new tab on ${url}`,
      ).toEqual([[url]]);
      expect(
        event.waitUntil,
        "the click did not keep the worker alive until the new tab was requested (no event.waitUntil)",
      ).toHaveBeenCalledWith(worker.clients.openWindow.mock.results[0]?.value);
    },
  );

  it("a plain click on a call card opens no tab", async () => {
    const worker = loadWorker();
    const data = await worker.cardFor({
      data: {
        type: "VoiceCallEvent",
        data: JSON.stringify({
          payload: { payload: { type: "audio", channelId: "c-1", user_id: 3 } },
          user: { name: "Caller", photo_path: "caller.png" },
        }),
      },
    });
    const open = tab("/sy-en");
    worker.windows.push(open);

    await worker.click(data);

    expect(worker.clients.openWindow, "a plain click on a call card opened a tab").not.toHaveBeenCalled();
    expect(open.focus, "a plain click on a call card focused a tab").not.toHaveBeenCalled();
  });
});
