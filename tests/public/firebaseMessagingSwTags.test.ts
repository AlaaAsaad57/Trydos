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
