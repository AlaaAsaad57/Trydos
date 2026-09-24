// A muted chat must stay quiet.
//
// Mute is stored per member, not per channel: every row in `channel_members`
// carries its own `mute`, and only the row of the signed-in user counts. See
// `muteChat` in store/chat/reducer.ts, which writes exactly that row, and
// components/Chat/pages/ChatLists.jsx, which reads it back for the row icon.
//
// The push payload never carries the flag, so the foreground handler has to read
// it from the chat list the store already holds. It did not, so every muted chat
// still raised a notification toast.
//
// Unread marks are NOT part of mute: `receiveChannelEvent` and `sendMessage`
// must still run, so the chat list still shows the message and its unread mark.
// That is why each test also checks the message landed in the store — a test
// that only checked "no toast" would pass if the handler had thrown early.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "store";
import { isChannelMutedForMe } from "utils/chatMute";

// The toast we are asserting about. Spied here rather than read off the screen,
// because the handler is not a component and never renders anything itself.
const showChatNotification = vi.fn();

const showSuccessNotification = vi.fn();
const showErrorNotification = vi.fn();

vi.mock("store/notifications/reducer", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    showChatNotification: (...args: any[]) => showChatNotification(...args),
    showSuccessNotification: (...args: any[]) =>
      showSuccessNotification(...args),
    showErrorNotification: (...args: any[]) => showErrorNotification(...args),
  };
});

// Stand-ins used by the handler-branch tests further down. Each one only
// records the call, so no test reaches the cart, chat or error backends.
const getCart = vi.fn(async (_args: any): Promise<any> => ({}));
const LogError = vi.fn(async (_error: any) => {});
vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getCart: (args: any) => getCart(args),
    LogError: (error: any) => LogError(error),
  };
});

const InCall = vi.fn(async (_userId: any, _messageId: any) => {});
vi.mock("store/chat/callActions", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, InCall: (u: any, m: any) => InCall(u, m) };
});

const watchChannelAction = vi.fn();
vi.mock("store/chat/actions", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    watchChannel: (...args: any[]) => watchChannelAction(...args),
  };
});

// The store actions below reach the chat backend on every received message
// (`Recive`, `watchChannel`). None of that is what this test is about, and a
// real request would make the run depend on a server being up.
const fetchData = vi.fn(async (_request: any): Promise<any> => ({
  success: true,
  data: {},
}));

vi.mock("utils/fetchData", () => ({
  fetchData: (request: any) => fetchData(request),
}));

/** The signed-in chat user. */
const ME = 657;
/** The person on the other end, who sends the message. */
const THEM = 672;
/** The chat both of them are in. */
const CHANNEL_ID = "652";
/** The message already in the chat, so the new one counts as linked. */
const PREVIOUS_MESSAGE_ID = "100";
/** The message that arrives in the push. */
const NEW_MESSAGE_ID = "101";

/** One chat in the list, with the signed-in user's own mute setting. */
const buildChannel = (mute: 0 | 1) => ({
  id: CHANNEL_ID,
  channel_name: "Alaa Test123",
  photo_path: null,
  messages: [
    {
      id: PREVIOUS_MESSAGE_ID,
      created_at: "2026-09-19T10:00:00.000Z",
      sender_user_id: THEM,
      message_type: { name: "TextMessage" },
      message_status: [
        { id: 10, user_id: ME, is_received: 0, is_watched: false },
        { id: 11, user_id: THEM, is_received: 1, is_watched: true },
      ],
    },
  ],
  channel_members: [
    { id: 1, user_id: ME, mute, pin: 0, archived: 0, user: { id: ME } },
    { id: 2, user_id: THEM, mute: 0, pin: 0, archived: 0, user: { id: THEM } },
  ],
});

/** The push the service worker forwards to the tab for a new text message. */
const buildMessagePush = () => ({
  data: {
    type: "message",
    body: JSON.stringify({ type: "message" }),
    data: JSON.stringify({
      prev_message_id: PREVIOUS_MESSAGE_ID,
      message: {
        id: NEW_MESSAGE_ID,
        channel_id: CHANNEL_ID,
        created_at: "2026-09-19T10:05:00.000Z",
        sender_user_id: THEM,
        channel: { id: CHANNEL_ID, channel_name: "Alaa Test123" },
        sender_user: { id: THEM, name: "Alaa Test123" },
        message_type: { name: "TextMessage" },
        message_content: { content: "hello" },
        message_files: [],
        message_status: [],
      },
    }),
  },
});

/** Put the store in the state the app is in while the chat list is open. */
function seedStore(mute: 0 | 1) {
  const initial = useAppStore.getInitialState();
  useAppStore.setState(
    {
      ...initial,
      userChat: { id: ME },
      data: [buildChannel(mute)],
      activeChat: null,
      chatVar: false,
      country: "sy",
      language: "en",
    } as any,
    true as any,
  );
}

/** The message ids the chat holds now, so we can see the message arrived. */
const messageIdsInChat = () =>
  (useAppStore.getState() as any).data
    ?.find((chat: any) => String(chat.id) === CHANNEL_ID)
    ?.messages?.map((message: any) => String(message.id)) ?? [];

describe("a muted chat raises no notification", () => {
  beforeEach(() => {
    showChatNotification.mockClear();
  });

  it("shows no notification for a message in a muted chat", async () => {
    seedStore(1);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildMessagePush(),
    );

    expect(
      messageIdsInChat(),
      "the handler stopped before it stored the message, so this test could not have seen a notification either way",
    ).toContain(NEW_MESSAGE_ID);
    expect(
      showChatNotification.mock.calls.length,
      `the chat is muted for user ${ME} yet a notification toast was raised ${showChatNotification.mock.calls.length} time(s)`,
    ).toBe(0);
  });

  it("still shows a notification for a message in a chat that is not muted", async () => {
    seedStore(0);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildMessagePush(),
    );

    expect(
      messageIdsInChat(),
      "the handler stopped before it stored the message, so the missing notification below says nothing about mute",
    ).toContain(NEW_MESSAGE_ID);
    expect(
      showChatNotification.mock.calls.length,
      "an unmuted chat raised no notification toast, so the mute check is silencing everything",
    ).toBe(1);
  });
});

// A long message arrives as a "compact" push.
//
// The push has a size limit, so for a long message the chat backend sends only
// ids: no text, no sender and no channel object. The handler read
// `message.channel.id` straight away, threw, and the message never reached the
// chat list. The fix loads the full message from the chat backend by its id
// (`get_all_messages_between_two_messages`, with the same id twice) and then
// runs the normal path.
describe("a compact push for a long message", () => {
  const LONG_TEXT = "x".repeat(10000);

  /** The push exactly as the chat backend sends it for a long message. */
  const buildCompactPush = () => ({
    data: {
      type: "message",
      body: JSON.stringify({ type: "message" }),
      data: JSON.stringify({
        type: "message",
        contact_name: "Alaa",
        prev_message_id: PREVIOUS_MESSAGE_ID,
        is_private: false,
        channel_id: CHANNEL_ID,
        message_id: NEW_MESSAGE_ID,
        message: {
          id: NEW_MESSAGE_ID,
          channel_id: CHANNEL_ID,
          sender_user_id: THEM,
        },
        compact: true,
      }),
    },
  });

  /** The full message, as the chat backend returns it when asked by id. */
  const fullMessage = {
    id: NEW_MESSAGE_ID,
    channel_id: CHANNEL_ID,
    created_at: "2026-09-19T10:05:00.000Z",
    sender_user_id: THEM,
    channel: { id: CHANNEL_ID, channel_name: "Alaa Test123" },
    sender_user: { id: THEM, name: "Alaa Test123" },
    message_type: { name: "TextMessage" },
    message_content: { content: LONG_TEXT },
    message_files: [],
    message_status: [],
  };

  const MESSAGE_BY_ID_URL =
    "/api/v1/messages/get_all_messages_between_two_messages";

  /** The stored copy of the new message, or undefined when it never landed. */
  const storedNewMessage = () =>
    (useAppStore.getState() as any).data
      ?.find((chat: any) => String(chat.id) === CHANNEL_ID)
      ?.messages?.find((message: any) => String(message.id) === NEW_MESSAGE_ID);

  beforeEach(() => {
    showChatNotification.mockClear();
    fetchData.mockReset();
  });

  it("loads the full message by its id and stores it with its text", async () => {
    fetchData.mockImplementation(async (request: any) =>
      request.url === MESSAGE_BY_ID_URL
        ? { success: true, data: [fullMessage] }
        : { success: true, data: {} },
    );
    seedStore(0);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCompactPush(),
    );

    const lookup = fetchData.mock.calls.find(
      ([request]) => request.url === MESSAGE_BY_ID_URL,
    )?.[0];
    expect(
      lookup,
      "the handler never asked the chat backend for the full message, so a compact push has no text to show",
    ).toBeDefined();
    expect(
      JSON.parse(lookup.body),
      `the chat backend was asked for the wrong message: ${lookup.body}`,
    ).toEqual({
      channel_id: CHANNEL_ID,
      first_message_id: NEW_MESSAGE_ID,
      second_message_id: NEW_MESSAGE_ID,
    });
    expect(
      storedNewMessage()?.message_content?.content,
      "the long message did not reach the chat list with its full text",
    ).toBe(LONG_TEXT);
    expect(
      showChatNotification.mock.calls[0]?.[0],
      "no notification toast named the sender of the long message",
    ).toBe("Alaa Test123");
  });

  it("refreshes the chat list when the chat backend cannot return the message", async () => {
    fetchData.mockImplementation(async (request: any) =>
      request.url === MESSAGE_BY_ID_URL
        ? { success: false, message: "Server Error" }
        : { success: true, data: {} },
    );
    seedStore(0);
    const chat = (await import("services/chat")).default;
    const getChats = vi.spyOn(chat, "getChats").mockResolvedValue(undefined);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCompactPush(),
    );

    expect(
      getChats,
      "the chat backend refused the message lookup and the chat list was not reloaded, so the long message is lost until a page reload",
    ).toHaveBeenCalledWith(true);
    getChats.mockRestore();
  });
});

// The incoming-call bar reads mute off the chat it was handed, `callerChannel`.
// So the handler has to hand it the real chat from the list. When it cannot
// find the chat it builds a stand-in instead, and that stand-in has `mute: 0`
// written into it — which reads as "not muted" and rings.
//
// Finding the chat is the whole point of these tests. The id to look it up by
// is the one the handler already trusts on the next lines,
// `data.message.channel.id`, not the one nested inside the call payload.
describe("a muted chat does not ring", () => {
  /** The call push the backend sends for a voice call. */
  const buildCallPush = () => ({
    data: {
      type: "VoiceCallEvent",
      body: JSON.stringify({ type: "call" }),
      data: JSON.stringify({
        user_id: THEM,
        user: { id: THEM, name: "Alaa Test123", photo_path: null },
        // Two levels deep, because the app posts its own `payload` object and
        // the backend wraps it in another one. store/chat/callActions.ts sends
        // the inner object; public/firebase-messaging-sw.js reads it back as
        // `parsed.payload.payload`.
        payload: {
          payload: {
            user_id: THEM,
            type: "audio",
            channelId: CHANNEL_ID,
            callerName: "Alaa Test123",
            callerPhoto: null,
          },
        },
        message: {
          id: "101",
          channel_id: CHANNEL_ID,
          created_at: "2026-09-19T10:05:00.000Z",
          sender_user_id: THEM,
          channel: {
            id: CHANNEL_ID,
            channel_name: "Alaa Test123",
            photo_path: null,
          },
          sender_user: { id: THEM, name: "Alaa Test123" },
          message_type: { name: "VoiceCall" },
          message_content: { content: "" },
          message_files: [],
          message_status: [],
        },
      }),
    },
  });

  /** What the call bar will read: the chat the handler put in the store. */
  const callerChannelInStore = () =>
    (useAppStore.getState() as any).callerChannel;

  it("hands the call bar the muted chat, not a stand-in that rings", async () => {
    seedStore(1);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCallPush(),
    );

    expect(
      (useAppStore.getState() as any).isCallIncoming,
      "no incoming call was raised at all, so this test cannot tell a silent call from a missing one",
    ).toBe(true);
    expect(
      isChannelMutedForMe(callerChannelInStore(), ME),
      `the call bar was handed a chat that reads as not muted for user ${ME}, so /default.mp3 rings; its members are ${JSON.stringify(
        callerChannelInStore()?.channel_members?.map((member: any) => ({
          user_id: member.user_id,
          mute: member.mute,
        })),
      )}`,
    ).toBe(true);
  });

  it("still rings when the chat is not muted", async () => {
    seedStore(0);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCallPush(),
    );

    expect(
      (useAppStore.getState() as any).isCallIncoming,
      "no incoming call was raised at all, so the check below says nothing about mute",
    ).toBe(true);
    expect(
      isChannelMutedForMe(callerChannelInStore(), ME),
      "an unmuted chat was handed to the call bar as muted, so no call would ever ring",
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Every other push the foreground handler knows about.
//
// These tests hand the handler a store made of spies, so each case can name the
// one store action it expected and see it was called with the right value.
// ---------------------------------------------------------------------------

/** A store made of spies, in the shape the handler reads. */
function seedSpyStore(extra: Record<string, any> = {}) {
  const state: Record<string, any> = {
    LoggingOut: false,
    country: "sy",
    language: "en",
    userChat: { id: ME },
    data: [],
    activeChat: null,
    chatVar: false,
    shouldAuthinticated: false,
    call: null,
    callInProgress: 0,
    sellerOrders: [],
    shouldUpdateOrders: 2,
    orderData: { agree: true },
    showNotificaionCircle: [],
    selected_product_for_add_to_cart: null,
    setSellerOrders: vi.fn(),
    setShouldUpdateOrders: vi.fn(),
    setSelectedProductForCart: vi.fn(),
    setOrderData: vi.fn(),
    setUserAnswerCall: vi.fn(),
    endCall: vi.fn(),
    watchChannelEvent: vi.fn(),
    receiveChannelEvent: vi.fn(),
    deleteMessage: vi.fn(),
    muteChat: vi.fn(),
    deleteChat: vi.fn(),
    setIncomingCall: vi.fn(),
    setIncomingVoiceCall: vi.fn(),
    setLastNotificationDate: vi.fn(),
    watchChannel: vi.fn(),
    sendMessage: vi.fn(),
    showNotificationIndicator: vi.fn(),
    ...extra,
  };
  useAppStore.setState(state as any, true as any);
  return state;
}

/** A market push, as the service worker forwards it. */
const marketPush = (body: Record<string, any>) => ({
  data: { title: "market", body: JSON.stringify(body) },
});

/** A system push (chat, call, channel) with its inner data object. */
const systemPush = (type: string, data: any) => ({
  data: { type, body: JSON.stringify({ type }), data: JSON.stringify(data) },
});

async function handle(payload: any, resolve: any = () => {}) {
  const { foregroundNotificationHandler } = await import(
    "utils/NotificationHandler"
  );
  await foregroundNotificationHandler.handleNotification(resolve, payload);
}

describe("foreground handler — early exits and odd input", () => {
  beforeEach(() => {
    showSuccessNotification.mockClear();
    LogError.mockClear();
  });

  it("does nothing while the shopper is logging out", async () => {
    const state = seedSpyStore({ LoggingOut: true });
    await handle(marketPush({ type: "order status changed", description: "x" }));
    expect(
      state.setShouldUpdateOrders,
      "a push during log-out still changed the order list",
    ).not.toHaveBeenCalled();
  });

  it("re-checks the FCM token two seconds after a greeting push", async () => {
    vi.useFakeTimers();
    const auth = (await import("services/auth")).default;
    const validate = vi
      .spyOn(auth, "validateFCMToken")
      .mockResolvedValue(undefined as any);
    seedSpyStore();
    const done = handle({
      data: { body: JSON.stringify({ showed_type: "greeting" }) },
    });
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect(validate, "the greeting push did not re-check the FCM token").toHaveBeenCalled();
    validate.mockRestore();
    vi.useRealTimers();
  });

  it("reads a body that is not JSON as an empty object", async () => {
    const state = seedSpyStore();
    await handle({ data: { type: "AnswerCallEvent", body: "{not json" } });
    expect(
      state.setUserAnswerCall,
      "a push whose body is broken JSON stopped the handler",
    ).toHaveBeenCalled();
  });

  it("treats a missing body and data as empty", async () => {
    const state = seedSpyStore();
    await handle({ data: { type: "AnswerCallEvent", body: null, data: null } });
    expect(
      state.setUserAnswerCall,
      "a push with no body stopped the handler",
    ).toHaveBeenCalled();
  });

  it("reports a push that throws inside a handler to LogError", async () => {
    seedSpyStore();
    await handle(systemPush("UpdatingMessageEvent", {}));
    expect(
      LogError.mock.calls[0]?.[0],
      "a push that threw was not reported",
    ).toMatchObject({
      scenario: "Error in handleNotification NotificationHandler",
      notification_type: "UpdatingMessageEvent",
    });
  });

  it("reports a thrown value that is not an Error as text", async () => {
    seedSpyStore({
      setUserAnswerCall: () => {
        throw "plain text";
      },
    });
    await handle(systemPush("AnswerCallEvent", {}));
    expect(LogError.mock.calls[0]?.[0]?.error, "the thrown text was not kept").toBe(
      "plain text",
    );
  });

  it("onNotification calls the handler at once with null", async () => {
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );
    const handler = vi.fn();
    foregroundNotificationHandler.onNotification("any", handler);
    expect(handler, "the handler was not called with null").toHaveBeenCalledWith(null);
  });
});

describe("foreground handler — market pushes", () => {
  beforeEach(() => {
    showSuccessNotification.mockClear();
    fetchData.mockReset();
    getCart.mockClear();
    LogError.mockClear();
  });

  it("tells the page a market push arrived", async () => {
    seedSpyStore();
    const heard = vi.fn();
    const { MARKET_NOTIFICATION_RECEIVED_EVENT } = await import(
      "utils/notificationEvents"
    );
    window.addEventListener(MARKET_NOTIFICATION_RECEIVED_EVENT, heard);
    await handle(marketPush({ type: "boutique created" }));
    window.removeEventListener(MARKET_NOTIFICATION_RECEIVED_EVENT, heard);
    expect(heard, "no market-notification window event fired").toHaveBeenCalled();
  });

  it("adds a new seller order to the top of the list and shows a toast", async () => {
    const old = { id: 1 };
    const state = seedSpyStore({ sellerOrders: [old] });
    await handle(
      marketPush({
        type: "seller order added",
        description: "New order",
        data: { id: 2 },
      }),
    );
    expect(
      state.setSellerOrders,
      "the new seller order was not put first in the list",
    ).toHaveBeenCalledWith([{ id: 2 }, old]);
    expect(showSuccessNotification.mock.calls[0]?.[0], "no toast for the new order").toBe(
      "New order",
    );
  });

  it("does not add a seller order that is already in the list", async () => {
    const state = seedSpyStore({ sellerOrders: [{ id: 2 }] });
    await handle(marketPush({ type: "seller order added", data: { id: "2" } }));
    expect(state.setSellerOrders, "the same order was added twice").not.toHaveBeenCalled();
  });

  it("still shows the toast when the store has no seller-orders setter", async () => {
    seedSpyStore({ setSellerOrders: undefined, sellerOrders: undefined });
    await handle(marketPush({ type: "seller order added", description: "d", image: "i.png" }));
    expect(
      showSuccessNotification.mock.calls[0],
      "the toast for a new seller order is missing its image",
    ).toEqual(["d", 5000, undefined, {}, "i.png"]);
  });

  it("merges a realtime update into the seller order it names", async () => {
    const state = seedSpyStore({
      sellerOrders: [{ id: 1, status: "new", total: 9 }, { id: 3 }],
    });
    await handle(
      marketPush({
        type: "seller order with detail realtime",
        data: { id: 1, status: "shipped" },
      }),
    );
    expect(
      state.setSellerOrders,
      "the realtime status was not merged into the existing order",
    ).toHaveBeenCalledWith([{ id: 1, status: "shipped", total: 9 }, { id: 3 }]);
  });

  it("adds a realtime seller order it does not know yet", async () => {
    const state = seedSpyStore({ sellerOrders: [{ id: 3 }] });
    await handle(
      marketPush({ type: "seller order with detail realtime", data: { id: 5 } }),
    );
    expect(state.setSellerOrders, "the unknown order was not added").toHaveBeenCalledWith([
      { id: 5 },
      { id: 3 },
    ]);
  });

  it("refreshes the orders but shows no toast for a plain status change", async () => {
    const state = seedSpyStore();
    await handle({ data: { body: JSON.stringify({ type: "order status changed" }) } });
    expect(state.setShouldUpdateOrders, "the orders were not refreshed").toHaveBeenCalledWith(3);
    expect(showSuccessNotification, "a plain status change raised a toast").not.toHaveBeenCalled();
  });

  it("links a named status change to the order page", async () => {
    seedSpyStore();
    await handle(
      marketPush({
        type: "order status changed to shipped",
        order_group_id: 44,
        description: "Shipped",
      }),
    );
    expect(showSuccessNotification.mock.calls[0], "the toast does not open the order").toEqual([
      "Shipped",
      5000,
      "/sy-en/settings/orders/44",
      { is_settings: true, href: "/sy-en/settings/orders/44" },
      null,
    ]);
  });

  it("links a hurry-up push to the product, and has no link without a product", async () => {
    seedSpyStore();
    await handle(marketPush({ type: "product hurry up", product_id: 7 }));
    await handle(marketPush({ type: "x", showed_type: "product hurry up" }));
    expect(showSuccessNotification.mock.calls[0]?.[2], "the hurry-up toast has no product link").toBe(
      "/products/7",
    );
    expect(
      showSuccessNotification.mock.calls[1]?.[2],
      "a hurry-up toast with no product got a link",
    ).toBeUndefined();
  });

  it("links a boutique push to the boutique, with a default text", async () => {
    seedSpyStore();
    await handle(marketPush({ type: "boutique created", boutique_id: 9 }));
    await handle(marketPush({ type: "boutique created", description: "Hi" }));
    expect(showSuccessNotification.mock.calls[0]?.slice(0, 3), "the boutique toast is wrong").toEqual([
      "New boutique available!",
      5000,
      "/sy-en/filters/boutiques/9",
    ]);
    expect(showSuccessNotification.mock.calls[1]?.slice(0, 3), "the boutique toast without id is wrong").toEqual([
      "Hi",
      5000,
      undefined,
    ]);
  });

  it("opens the cart for a cart-expiry push", async () => {
    seedSpyStore();
    await handle(marketPush({ type: "product cart expiration" }));
    expect(showSuccessNotification.mock.calls[0]?.[2], "the cart-expiry toast does not open the cart").toBe(
      "/?cart=true",
    );
  });

  it("links a new category to its page, and has no link without a slug", async () => {
    seedSpyStore();
    await handle(marketPush({ type: "category created", category_slug: "shoes" }));
    await handle(marketPush({ type: "category created" }));
    expect(showSuccessNotification.mock.calls[0]?.[2], "the category link is wrong").toBe(
      "/sy-en/filters/categories/shoes",
    );
    expect(showSuccessNotification.mock.calls[1]?.[2], "a category without slug got a link").toBeUndefined();
  });

  it("asks the open add-to-cart product to reload when its stock changes", async () => {
    const selected = { id: "12", name: "Shirt" };
    const state = seedSpyStore({ selected_product_for_add_to_cart: selected });
    await handle(
      marketPush({ type: "product availability", product_id: 12, product_slug: "shirt" }),
    );
    expect(
      state.setSelectedProductForCart,
      "the open product was not told to reload",
    ).toHaveBeenCalledWith({ ...selected, shouldUpdate: 1 });
    expect(showSuccessNotification.mock.calls[0]?.[2], "the availability toast has no product link").toBe(
      "/sy-en/products/shirt",
    );
  });

  it("leaves a different add-to-cart product alone", async () => {
    const state = seedSpyStore({ selected_product_for_add_to_cart: { id: 1 } });
    await handle(marketPush({ type: "product availability", product_id: 2 }));
    expect(state.setSelectedProductForCart, "another product was told to reload").not.toHaveBeenCalled();
    expect(showSuccessNotification.mock.calls[0]?.[2], "a push with no slug got a link").toBeUndefined();
  });

  it.each([
    "product discount",
    "product comment",
    "product when change in price",
    "product before stock out",
  ])("links a '%s' push to the product", async (type) => {
    seedSpyStore();
    await handle(marketPush({ type, product_slug: "p" }));
    await handle(marketPush({ type }));
    expect(showSuccessNotification.mock.calls[0]?.[2], "the product link is wrong").toBe(
      "/sy-en/products/p",
    );
    expect(showSuccessNotification.mock.calls[1]?.[2], "a push with no slug got a link").toBeUndefined();
  });

  it("shows nothing for an unknown market push", async () => {
    seedSpyStore();
    await handle(marketPush({}));
    expect(showSuccessNotification, "an unknown market push raised a toast").not.toHaveBeenCalled();
  });

  it("on 'order placed' refreshes the cart, loads the order and shows it", async () => {
    fetchData.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    const state = seedSpyStore();
    await handle({
      data: {
        body: JSON.stringify({
          type: "order placed",
          order_group_id: 77,
          description: "Placed",
        }),
      },
    });
    expect(getCart, "the cart was not refreshed after the order").toHaveBeenCalled();
    expect(state.setShouldUpdateOrders, "the orders were not refreshed").toHaveBeenCalledWith(3);
    expect(fetchData.mock.calls[0]?.[0]?.url, "the order was not loaded from the market backend").toBe(
      "/customer/order/getOrdersByOrderGroupID?order_group_id=77",
    );
    expect(showSuccessNotification.mock.calls[0]?.[2], "the order toast does not open the order").toBe(
      "/sy-en/settings/orders/77",
    );
    expect(state.setOrderData, "the order screen was not given the order").toHaveBeenCalledWith({
      data: [{ id: 1 }],
      success: true,
    });
  });

  it("on 'order placed' does not touch the order screen the shopper did not agree to", async () => {
    fetchData.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    getCart.mockRejectedValueOnce(new Error("cart down"));
    const state = seedSpyStore({ orderData: { agree: false } });
    await handle(marketPush({ type: "order placed", order_group_id: 1 }));
    expect(state.setOrderData, "the order screen was changed without agreement").not.toHaveBeenCalled();
  });

  it("on 'order placed' shows nothing when the order list is empty", async () => {
    fetchData.mockResolvedValue({ success: true, data: [] });
    seedSpyStore();
    await handle(marketPush({ type: "order placed", order_group_id: 1 }));
    expect(showSuccessNotification, "an empty order raised a toast").not.toHaveBeenCalled();
  });

  it("on 'order placed' reports a refused order lookup", async () => {
    fetchData.mockResolvedValue({ success: false, message: "Server Error" });
    seedSpyStore();
    await handle(marketPush({ type: "order placed", order_group_id: 1 }));
    expect(LogError.mock.calls[0]?.[0], "the market backend refusal was not reported").toEqual({
      scenario: "Error in handleOrderPlaced in  NotificationHandler",
      error: "Server Error",
    });
  });

  it("on 'order placed' reports a thrown value that is not an Error", async () => {
    fetchData.mockRejectedValue("offline");
    seedSpyStore();
    await handle(marketPush({ type: "order placed", order_group_id: 1 }));
    expect(LogError.mock.calls[0]?.[0]?.error, "the thrown text was not kept").toBe("offline");
  });
});

describe("foreground handler — call and channel pushes", () => {
  beforeEach(() => {
    showErrorNotification.mockClear();
    InCall.mockClear();
  });

  it("says the other user is in another call", async () => {
    seedSpyStore();
    await handle(systemPush("InAnotherCallEvent", {}));
    expect(showErrorNotification.mock.calls[0], "no 'in another call' error").toEqual([
      "User In Another Call",
      3000,
    ]);
  });

  it("ends the call the other user refused", async () => {
    const state = seedSpyStore();
    await handle(systemPush("RefuseCallEvent", { message_id: "31" }));
    expect(state.endCall, "the refused call was not ended").toHaveBeenCalledWith(31);
  });

  it.each([
    ["ChannelWatchedEvent", "watchChannelEvent", { channel_id: 5 }, 5],
    ["ChannelReceivedEvent", "receiveChannelEvent", { channel_id: 6 }, 6],
    ["ChannelDeletedEvent", "deleteChat", { channel_id: 8 }, { id: 8 }],
    [
      "UpdatingMessageEvent",
      "deleteMessage",
      { message: { channel_id: 4, id: 40 } },
      { ch_id: 4, msg_id: 40, bool: true },
    ],
    [
      "ChannelUpdatedEvent",
      "muteChat",
      { channel: { id: 4, is_mute: "1" } },
      { event: true, id: 4, value: 1 },
    ],
  ])("%s calls %s", async (type, action, data, expected) => {
    const state = seedSpyStore();
    await handle(systemPush(type, data));
    expect(state[action], `${type} did not reach ${action}`).toHaveBeenCalledWith(expected);
  });

  const callData = (extra: Record<string, any> = {}) => ({
    user_id: THEM,
    user: { id: THEM },
    payload: { type: "video" },
    message: {
      id: 90,
      channel: { id: 11, channel_name: "Them", photo_path: "p.png" },
    },
    ...extra,
  });

  it("marks the caller as in another call when a call is already up", async () => {
    seedSpyStore({ call: { id: 1 } });
    const resolve = vi.fn();
    const push = systemPush("VideoCallEvent", callData());
    await handle(push, resolve);
    expect(InCall, "the busy signal was not sent").toHaveBeenCalledWith(THEM, 90);
    expect(resolve, "the push was not resolved").toHaveBeenCalledWith(push);
  });

  it("raises a video call with a stand-in chat for a private delivery call", async () => {
    const state = seedSpyStore({ activeChat: { id: 11 } });
    await handle(systemPush("VideoCallEvent", callData({ is_private: true })));
    const call = state.setIncomingCall.mock.calls[0]?.[0];
    expect(call?.caller?.name, "the private call does not name the delivery worker").toBe(
      "Delivery Worker",
    );
    expect(call?.callerChannel?.id, "the stand-in chat has the wrong id").toBe(11);
    expect(state.watchChannel, "the open chat was not marked as seen").toHaveBeenCalledWith(11);
    expect(state.sendMessage.mock.calls[0]?.[0]?.isPrivate, "the call message lost its private flag").toBe(true);
  });

  it("does not raise a second call while one is ringing", async () => {
    const state = seedSpyStore({ callInProgress: 1 });
    await handle(systemPush("VoiceCallEvent", callData({ user: undefined })));
    expect(state.setIncomingVoiceCall, "a second call was raised").not.toHaveBeenCalled();
    expect(state.receiveChannelEvent, "the call chat was not marked received").toHaveBeenCalledWith(11);
  });
});

describe("foreground handler — chat message pushes", () => {
  beforeEach(() => {
    showChatNotification.mockClear();
    watchChannelAction.mockClear();
  });

  /** A message push for chat 11, sent by the other user. */
  const message = (msg: Record<string, any>, extra: Record<string, any> = {}) =>
    systemPush("message", {
      prev_message_id: "1",
      message: {
        id: 2,
        channel_id: 11,
        channel: { id: 11 },
        sender_user: { id: THEM, name: "Them", photo_path: "t.png" },
        ...msg,
      },
      ...extra,
    });

  const knownChat = { id: 11, messages: [{ id: 1 }], channel_members: [] };

  it.each([
    ["ImageMessage", "image"],
    ["VideoMessage", "video"],
    ["VoiceMessage", "voice message"],
    ["FileMessage", "file"],
    ["OtherMessage", "message"],
  ])("a %s with a file shows '%s' and the file picture", async (type, preview) => {
    seedSpyStore({ data: [knownChat] });
    await handle(
      message({ message_type: { name: type }, message_files: [{ url: "f.png" }] }),
    );
    const call = showChatNotification.mock.calls[0];
    expect(call?.[1], "the preview text is wrong").toBe(preview);
    expect(call?.[5], "the file picture is missing").toBe("f.png");
  });

  it("shows 'Shared a product' for a shared product, and cuts long text", async () => {
    seedSpyStore({ data: [knownChat] });
    await handle(
      message({
        message_type: { name: "ShareProductMessage" },
        message_content: { content: "p" },
      }),
    );
    await handle(message({ message_content: { content: "y".repeat(150) } }));
    expect(showChatNotification.mock.calls[0]?.[1], "the share preview is wrong").toBe(
      "Shared a product",
    );
    expect(showChatNotification.mock.calls[1]?.[1], "long text was not cut at 100").toBe(
      "y".repeat(100) + "...",
    );
  });

  it("names the message type, or says 'New message', when there is no text", async () => {
    seedSpyStore({ data: [knownChat] });
    await handle(message({ message_type: { name: "Sticker" } }));
    await handle(message({}));
    expect(showChatNotification.mock.calls[0]?.[1], "the typed preview is wrong").toBe("Sent a Sticker");
    expect(showChatNotification.mock.calls[1]?.[1], "the empty preview is wrong").toBe("New message");
  });

  it("a ShareProductEvent always says 'Shared a product', and the preview hides when re-auth is needed", async () => {
    seedSpyStore({ data: [knownChat] });
    await handle({
      data: {
        type: "ShareProductEvent",
        data: JSON.stringify({
          prev_message_id: "1",
          message: { id: 2, channel: { id: 11 }, sender_user: { mobile_phone: "x" } },
        }),
      },
    });
    seedSpyStore({ data: [knownChat], shouldAuthinticated: true });
    await handle(message({ message_content: { content: "secret" } }));
    expect(showChatNotification.mock.calls[0]?.[1], "the share event preview is wrong").toBe(
      "Shared a product",
    );
    expect(showChatNotification.mock.calls[1]?.[1], "the preview was shown while re-auth is needed").toBe("");
  });

  it("marks the open chat as seen and shows no toast", async () => {
    const state = seedSpyStore({ data: [knownChat], activeChat: { id: 11 } });
    await handle(message({ message_content: { content: "hi" } }));
    expect(state.watchChannel, "the open chat was not marked as seen").toHaveBeenCalledWith(11);
    expect(showChatNotification, "the open chat raised a toast").not.toHaveBeenCalled();
  });

  it("a private message outside the open chat shows a delivery toast and a red dot", async () => {
    const existing = { order_id: 5, chat_id: 5, order_group_id: 9 };
    const other = { order_id: 6, chat_id: 6, order_group_id: 9 };
    const state = seedSpyStore({ showNotificaionCircle: [existing, other] });
    await handle(
      message(
        { message_content: { content: "hi" }, channel: null },
        { is_private: 1, order_group_id: 9, order_id: 5 },
      ),
    );
    const call = showChatNotification.mock.calls[0];
    expect(call?.[0], "the delivery toast has the wrong title").toBe("Delivery Worker");
    expect(call?.[2], "the toast lost the chat id").toBe(11);
    expect(call?.[8], "the delivery toast does not open the order").toBe(
      "/sy-en/settings/orders/9?order_id=5&chat_id=5&mid=2",
    );
    expect(state.showNotificationIndicator, "the red dot list is wrong").toHaveBeenCalledWith([
      other,
      existing,
    ]);
  });

  it("a private message in the open chat is marked seen and stored", async () => {
    const state = seedSpyStore({ activeChat: { id: 11 } });
    await handle(
      message({ message_content: { content: "hi" } }, { is_private: true, parent_order_id: 3 }),
    );
    expect(watchChannelAction, "the open private chat was not marked seen").toHaveBeenCalledWith(11);
    expect(state.sendMessage.mock.calls[0]?.[0]?.isPrivate, "the private message was not stored").toBe(true);
  });

  it("reloads the chat list for a chat the store does not know, and toasts only when no chat is open", async () => {
    const chat = (await import("services/chat")).default;
    const getChats = vi.spyOn(chat, "getChats").mockResolvedValue(undefined);
    seedSpyStore();
    await handle(message({ message_content: { content: "hi" } }));
    seedSpyStore({ activeChat: { id: 99 } });
    await handle(message({ message_content: { content: "hi" } }));
    seedSpyStore({ activeChat: { id: 11 } });
    await handle(message({ message_content: { content: "hi" } }));
    expect(getChats.mock.calls, "the chat list was not reloaded for each unknown chat").toEqual([
      [true],
      [true],
      [true],
    ]);
    expect(
      showChatNotification.mock.calls.map((c) => c[0]),
      "only the no-open-chat case should toast",
    ).toEqual(["Them"]);
    getChats.mockRestore();
  });

  it("drops a compact push whose message the chat backend did not return", async () => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true });
    const chat = (await import("services/chat")).default;
    const getChats = vi.spyOn(chat, "getChats").mockResolvedValue(undefined);
    LogError.mockClear();
    const state = seedSpyStore();
    await handle(systemPush("message", { compact: true, message: { id: 5, channel_id: 1 } }));
    expect(LogError.mock.calls[0]?.[0]?.error, "the missing message was not reported").toBe(
      "message 5 not returned",
    );
    expect(state.sendMessage, "a message with no body was stored").not.toHaveBeenCalled();
    getChats.mockRestore();
  });

  it("reports a thrown value that is not an Error from the compact lookup", async () => {
    fetchData.mockReset();
    fetchData.mockRejectedValue("offline");
    const chat = (await import("services/chat")).default;
    const getChats = vi.spyOn(chat, "getChats").mockResolvedValue(undefined);
    LogError.mockClear();
    seedSpyStore();
    await handle(systemPush("message", { compact: true, message_id: 5, channel_id: 1 }));
    expect(LogError.mock.calls[0]?.[0]?.error, "the thrown text was not kept").toBe("offline");
    getChats.mockRestore();
  });
});

describe("foreground handler — service worker messages", () => {
  it("listens to the service worker and forwards pushes and delivery-chat requests", async () => {
    let listener: ((event: any) => void) | undefined;
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        addEventListener: (_type: string, fn: any) => {
          listener = fn;
        },
      },
      configurable: true,
    });
    vi.resetModules();
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );
    const { OPEN_DELIVERY_CHAT_EVENT } = await import("utils/notificationEvents");
    const handleSpy = vi
      .spyOn(foregroundNotificationHandler, "handleNotification")
      .mockResolvedValue(undefined);
    const opened = vi.fn();
    const onOpen = (e: any) => opened(e.detail);
    window.addEventListener(OPEN_DELIVERY_CHAT_EVENT, onOpen);

    expect(listener, "no service-worker message listener was added").toBeDefined();
    listener!({ data: null });
    listener!({ data: { type: "FCM_NOTIFICATION", payload: { a: 1 } } });
    listener!({
      data: { type: "OPEN_DELIVERY_CHAT", order_group_id: 1, order_id: 2, chat_id: 3 },
    });
    listener!({ data: { type: "OTHER" } });

    expect(handleSpy.mock.calls[0]?.[1], "the FCM push was not handled").toEqual({ a: 1 });
    expect(opened, "the delivery chat was not opened").toHaveBeenCalledWith({
      order_group_id: 1,
      order_id: 2,
      chat_id: 3,
    });
    window.removeEventListener(OPEN_DELIVERY_CHAT_EVENT, onOpen);
    delete (navigator as any).serviceWorker;
  });
});
