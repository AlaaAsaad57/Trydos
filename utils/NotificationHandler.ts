// Foreground Notification Handler
// This file handles FCM notifications when the app is in the foreground

import { useAppStore } from "store";
import {
  showErrorNotification,
  showSuccessNotification,
  showChatNotification,
} from "store/notifications/reducer";
import { fetchData } from "./fetchData";
import { InCall } from "store/chat/callActions";
import { getCart, getUserChat, LogError, translateFunction } from "./functions";

import chat from "services/chat";
import { watchChannel as watchChannelAction } from "store/chat/actions";

import { REQUESTS_DATA } from "./Requests";
import { isChannelMutedForMe } from "./chatMute";

import auth from "services/auth";
import {
  MARKET_NOTIFICATION_RECEIVED_EVENT,
  OPEN_DELIVERY_CHAT_EVENT,
} from "./notificationEvents";

// --- Interfaces ---

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: any;
  type?: string;
}

// --- Helper Functions ---

const safeParse = (data: any) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return data || {};
};

const getMessageNotificationPreview = (messageType: string) => {
  switch (messageType) {
    case "ImageMessage":
      return translateFunction("image");
    case "VideoMessage":
      return translateFunction("video");
    case "VoiceMessage":
      return translateFunction("voice message");
    case "FileMessage":
      return translateFunction("file");
    default:
      return translateFunction("message");
  }
};

/**
 * Whether a message from an `UpdatingMessageEvent` was deleted for everyone.
 * See `handleUpdatingMessage` for why a message with no status rows counts
 * as deleted.
 */
const isDeletedForAll = (message: any): boolean => {
  if (!message || !Array.isArray(message.message_status)) return true;
  if (message.deleted_by_user_id != null) return true;
  if (message.auth_message_status?.delete_for_all) return true;
  return message.message_status.some((status: any) => !!status?.delete_for_all);
};

class ForegroundNotificationHandler {
  private isListening: boolean = false;

  constructor() {
    this.initializeListener();
  }

  // --- Initialization ---

  // --- Initialization ---

  private initializeListener(): void {
    if (this.isListening) return;

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        this.handleServiceWorkerMessage(event);
      });
      this.isListening = true;
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const message: any = event.data;
    if (!message) return;
    if (message.type === "FCM_NOTIFICATION") {
      this.handleNotification(() => {}, message.payload);
    } else if (message.type === "OPEN_DELIVERY_CHAT") {
      // Sent by the service worker when it focused an already-open order tab.
      // Re-broadcast as a window event the order page listens for.
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(OPEN_DELIVERY_CHAT_EVENT, {
            detail: {
              order_group_id: message.order_group_id,
              order_id: message.order_id,
              chat_id: message.chat_id,
            },
          }),
        );
      }
    }
  }

  public onNotification(type: string, handler: (data: any) => void): void {
    handler(null);
  }

  // --- Main Entry Point ---

  // --- Main Entry Point ---

  public async handleNotification(resolve: any, payload: any): Promise<void> {
    try {
      console.log("Received foreground notification:", payload);
      const state = useAppStore.getState();
      if (state.LoggingOut) return;

      // Unify data parsing
      const rawData = payload?.data || {};
      const body = safeParse(rawData.body);
      const data = safeParse(rawData?.data || "{}");
      if (body.type === "greeting" || body.showed_type==="greeting") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        auth.validateFCMToken();
      }
      // This is the inner 'data' object used in most events
      // console.log(data, body);
      // 1. Handle Market/E-commerce Notifications
      const eventTypeFromBody = body?.type;
      const isOrderMarketEvent =
        typeof eventTypeFromBody === "string" &&
        (eventTypeFromBody.startsWith("seller order") ||
          eventTypeFromBody.startsWith("order status changed") ||
          eventTypeFromBody.startsWith("seller order added") ||
          eventTypeFromBody.startsWith("seller order with detail realtime") ||
          eventTypeFromBody === "order placed");

      if (rawData.title === "market" || isOrderMarketEvent) {
        await this.handleMarketEvent(body, state);
        return;
      }

      // 2. Handle System/Chat/Call Notifications
      const eventType = rawData.type;

      switch (eventType) {
        case "InAnotherCallEvent":
          showErrorNotification(translateFunction("User In Another Call"), 3000);
          break;

        case "RefuseCallEvent":
          this.handleRefuseCall(data, state);
          break;

        case "AnswerCallEvent":
          state.setUserAnswerCall();
          break;

        case "VoiceCallEvent":
        case "VideoCallEvent":
          this.handleIncomingCall(eventType, data, state, resolve, payload);
          break;

        case "message":
        case "ShareProductEvent": {
          const fullData = data?.compact
            ? await this.loadCompactMessage(data)
            : data;
          if (fullData) {
            this.handleChatMessage(eventType, fullData, state, resolve, payload);
          }
          break;
        }

        case "ChannelWatchedEvent":
          state.watchChannelEvent(data.channel_id);
          break;

        case "ChannelReceivedEvent":
          state.receiveChannelEvent(data.channel_id);
          break;

        case "UpdatingMessageEvent":
          await this.handleUpdatingMessage(data, state);
          break;

        case "MessageReminderEvent":
          this.handleMessageReminder(data, state);
          break;

        case "ChannelUpdatedEvent":
          state.muteChat({
            event: true,
            id: data.channel.id,
            value: parseInt(data.channel.is_mute),
          });
          break;

        case "ChannelDeletedEvent":
          state.deleteChat({ id: data.channel_id });
          break;
      }
    } catch (error) {
      LogError({
        scenario: "Error in handleNotification NotificationHandler",
        notification_type: payload?.data?.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // --- Domain Specific Handlers ---

  /**
   * `UpdatingMessageEvent` means one of three things: the sender deleted the
   * message for everyone, the sender edited it, or someone changed its tags.
   * The push does not say which. The message it carries does:
   *
   *   deleted  -> `deleted_by_user_id` is set, and every `message_status`
   *               row has `delete_for_all: true`
   *   edited or tagged -> neither, and the message is complete
   *
   * A message with no `message_status` array cannot be read either way, so
   * it keeps the old meaning (delete). That was the only meaning of this
   * event before edit and tags existed.
   *
   * An edit or tag change replaces the message, but keeps the local
   * `reminder`: it is personal, and the push never carries it.
   */
  private async handleUpdatingMessage(data: any, state: any) {
    let message = data?.message;
    const channelId = data?.channel_id ?? message?.channel_id;
    const messageId = data?.message_id ?? message?.id;
    if (messageId == null) {
      // Nothing to find. Throw, so the caller reports the broken push.
      throw new Error("UpdatingMessageEvent carried no message id");
    }

    if (data?.compact) {
      // Too big for a push: only ids arrived. Load the message itself.
      const loaded = await this.loadUpdatedMessage(channelId, messageId);
      if (loaded === "gone") {
        state.deleteMessage({ ch_id: channelId, msg_id: messageId, bool: true });
        return;
      }
      if (!loaded) {
        chat.getChats(true);
        return;
      }
      message = loaded;
    }

    if (isDeletedForAll(message)) {
      state.deleteMessage({ ch_id: channelId, msg_id: messageId, bool: true });
      return;
    }

    const { reminder, ...update } = message;
    state.patchMessage({ ch_id: channelId, msg_id: messageId, patch: update });
  }

  /**
   * Load one message by id, for a compact `UpdatingMessageEvent`.
   * Answers the message, "gone" when the backend no longer returns it (it
   * answers 404 for a message deleted for everyone), or null on any other
   * failure.
   */
  private async loadUpdatedMessage(
    channelId: any,
    messageId: any,
  ): Promise<any | "gone" | null> {
    try {
      const response = await fetchData({
        url: "/api/v1/messages/get_all_messages_between_two_messages",
        reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
        method: "POST",
        server: "chat",
        noMessage: true,
        body: JSON.stringify({
          channel_id: channelId,
          first_message_id: messageId,
          second_message_id: messageId,
        }),
      });
      if (!response.success) {
        if (response.httpStatus === 404) return "gone";
        throw new Error(response.message);
      }
      const message = (response.data || []).find(
        (m: any) => String(m.id) === String(messageId),
      );
      return message || "gone";
    } catch (error) {
      LogError({
        scenario: "Error in loadUpdatedMessage NotificationHandler",
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * A reminder I set came due. The push has no visible text, so the app
   * shows it. The service worker shows a system notification when no tab of
   * the app is visible; a visible tab shows the in-app chat toast instead.
   * Either way the reminder is no longer active, so it leaves the message.
   */
  private handleMessageReminder(data: any, state: any) {
    const reminder = data?.payload || {};
    const channelId = data?.channel_id ?? null;
    state.reminderFired({
      ch_id: channelId,
      msg_id: data?.message_id,
      reminder_id: reminder.reminder_id,
    });

    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    const channel =
      channelId == null
        ? null
        : [...(state.data || []), ...(state.archivedChats || [])].find(
            (ch: any) => String(ch.id) === String(channelId),
          ) || null;
    const preview = reminder.message_content
      ? `${translateFunction("Reminder")}: ${reminder.message_content}`
      : `${translateFunction("Reminder")}: ${getMessageNotificationPreview(reminder.message_type)}`;
    showChatNotification(
      reminder.sender_name || translateFunction("Reminder"),
      preview,
      channelId,
      channel,
    );
  }

  /**
   * A long message arrives as a "compact" push: the push has a size limit, so
   * the chat backend sends only ids (`message_id`, `channel_id`) — no text, no
   * sender and no channel object. Load the full message by its id; asking for
   * the range from the message to itself returns just that message.
   *
   * Returns the push data with the full message in place, or null when the
   * lookup failed. On a failure the chat list is reloaded instead, so the
   * message still shows up.
   */
  private async loadCompactMessage(data: any) {
    const messageId = data.message_id ?? data.message?.id;
    const channelId = data.channel_id ?? data.message?.channel_id;
    try {
      const response = await fetchData({
        url: "/api/v1/messages/get_all_messages_between_two_messages",
        reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
        method: "POST",
        server: "chat",
        body: JSON.stringify({
          channel_id: channelId,
          first_message_id: messageId,
          second_message_id: messageId,
        }),
      });
      if (!response.success) throw new Error(response.message);
      const message = (response.data || []).find(
        (m: any) => String(m.id) === String(messageId),
      );
      if (!message) throw new Error(`message ${messageId} not returned`);
      return { ...data, message };
    } catch (error) {
      LogError({
        scenario: "Error in loadCompactMessage NotificationHandler",
        error: error instanceof Error ? error.message : String(error),
      });
      chat.getChats(true);
      return null;
    }
  }

  /**
   * Handles e-commerce related notifications (Orders, Products, Boutiques)
   */
  private async handleMarketEvent(data: any, state: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(MARKET_NOTIFICATION_RECEIVED_EVENT));
    }
    // console.log("Handling market notification with data:", data);
    const { country, language, sellerOrders = [], setSellerOrders } = state;
    const lang = `${country?.toLowerCase()}-${language?.toLowerCase()}`;
    const type = data?.type || "";
    const showed_type=data?.showed_type||"";
    // Helper for common market notifications
    const notify = (url?: string, extra?: any) => {
      showSuccessNotification(
        data.description,
        5000,
        url,
        extra || {},
        data.image || null,
      );
    };

    if (type === "seller order added") {
      // Add the order directly from notification data (no API call)
      if (typeof setSellerOrders === "function") {
        // Avoid duplicates: check if order already exists
        const exists = sellerOrders.some(
          (o: any) => String(o.id) === String(data?.data?.id),
        );
        if (!exists) {
          setSellerOrders([data?.data, ...sellerOrders]);
        }
      }
      notify();
      return;
    }

    // For other types, update status if order exists
    if (type === "seller order with detail realtime" && data?.data?.id) {
      // console.log(
      //   "Updating order status from notification for order ID:",
      //   data?.data?.id,
      // );
      const idx = sellerOrders.findIndex(
        (o: any) => String(o.id) === String(data?.data?.id),
      );
      if (idx !== -1) {
        // Update only the status fields (shallow merge)
        const updated = sellerOrders.map((order: any, i: number) =>
          i === idx ? { ...order, ...data?.data } : order,
        );
        // console.log("Updated seller orders after status change:", updated);
        setSellerOrders(updated);
      } else {
        // If order not found, add it (handles cases where order is created and status changes before user sees notification)
        setSellerOrders([data?.data, ...sellerOrders]);
      }
    }

    // --- Existing notification logic for other types ---
    if (type.startsWith("order status changed")) {
      state.setShouldUpdateOrders(state.shouldUpdateOrders + 1);
      if (type !== "order status changed") {
        const url = `/${lang}/settings/orders/${data?.order_group_id}`;
        notify(url, {
          is_settings: true,
          href: `/${lang}/settings/orders/${data?.order_group_id}`,
        });
      }
    } else if (type.includes("product hurry up")||showed_type?.includes('product hurry up')) {
      notify(data?.product_id ? `/products/${data.product_id}` : undefined, {
        is_product: true,
      });
    } else if (type === "boutique created") {
      showSuccessNotification(
        data.description || "New boutique available!",
        5000,
        data?.boutique_id
          ? `/${lang}/filters/boutiques/${data.boutique_id}`
          : undefined,
        { is_boutique: true },
        data.image,
      );
    } else if (type === "product cart expiration") {
      notify("/?cart=true");
    } else if (type === "category created") {
      notify(
        data?.category_slug
          ? `/${lang}/filters/categories/${data.category_slug}`
          : undefined,
        { is_boutique: true },
      );
    } else if (type === "product availability") {
      // Logic to update cart if selected product matches
      if (
        state.selected_product_for_add_to_cart?.id &&
        parseInt(state.selected_product_for_add_to_cart.id) ===
          parseInt(data.product_id)
      ) {
        state.setSelectedProductForCart({
          ...state.selected_product_for_add_to_cart,
          shouldUpdate: 1,
        });
      }
      const url = data?.product_slug
        ? `/${lang}/products/${data.product_slug}`
        : undefined;
      notify(url, { is_product: true, href: url });
    } else if (
      type === "product discount" ||
      type === "product comment" ||
      type === "product when change in price" ||
      type === "product before stock out"
    ) {
      const url = data?.product_slug
        ? `/${lang}/products/${data.product_slug}`
        : undefined;
      notify(url, { is_product: true, href: url });
    } else if (type === "order placed") {
      state.setShouldUpdateOrders(state.shouldUpdateOrders + 1);
      await this.handleOrderPlaced(data, lang, state);
    }
  }

  /**
   * Special logic for Order Placed which requires data fetching
   */
  private async handleOrderPlaced(data: any, lang: string, state: any) {
    // The cart may have been purchased from another account/device, so refresh
    // the cart from the server (cart_shipping) to clear the stale cart-item
    // indicator.
    getCart({ callback: null }).catch(() => {});

    try {
      const response = await fetchData({
        url: `/customer/order/getOrdersByOrderGroupID?order_group_id=${data.order_group_id}`,
        reqTitle: REQUESTS_DATA.GETORDERBYORDERGROUPID_REQUEST,
        method: "GET",
        server: "market",
      });

      if (!response.success) throw new Error(response.message);

      if (response.data && response.data?.length > 0) {
        const url = `/${lang}/settings/orders/${data?.order_group_id}`;
        showSuccessNotification(
          data.description,
          5000,
          url,
          { is_settings: true, href: url },
          null,
        );
        if (state.orderData.agree) {
          state.setOrderData({ data: response.data, success: true });
        }
      }
    } catch (error) {
      LogError({
        scenario: "Error in handleOrderPlaced in  NotificationHandler",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handles refusing a call
   */
  private handleRefuseCall(data: any, state: any) {
    const messageID = data.message_id;
    state.endCall(parseInt(messageID));
  }

  /**
   * Handles both Voice and Video incoming calls
   */
  private handleIncomingCall(
    eventType: string,
    data: any,
    state: any,
    resolve: any,
    payload: any,
  ) {
    const isVideo = eventType === "VideoCallEvent";
    const msgType = isVideo ? "VideoCall" : "VoiceCall";

    // Delivery worker logic
    const isPrivateCall = data?.is_private;
    const privateData = isPrivateCall
      ? {
          name: "Delivery Worker",
          photo_path: null,
          channel_name: "Delivery Worker",
          isPrivate: true,
        }
      : {};

    const currentUser = getUserChat();

    // If we are already in a call, just update the call state
    if (state.call) {
      InCall(data.user?.id, data.message.id);
      resolve(payload);
      return;
    }

    // Determine Channel Data
    const payloadData = data.payload;

    // The chat this call belongs to.
    //
    // `data.message.channel.id` is the id the rest of this method already
    // trusts: it builds the stand-in below with it, hands it to
    // `receiveChannelEvent`, and writes it into `callData.channelId`.
    //
    // The id inside the call payload sits one level deeper — the app posts its
    // own `payload` object (store/chat/callActions.ts) and the backend wraps it
    // in another one, which is why the service worker reads it back as
    // `parsed.payload.payload` (public/firebase-messaging-sw.js). Reading
    // `payloadData.channelId` therefore found nothing, so every call fell back
    // to the stand-in — and the stand-in has `mute: 0` written into both of its
    // member rows, so a muted chat rang.
    const callChannelId =
      data.message?.channel?.id ??
      payloadData?.payload?.channelId ??
      payloadData?.channelId;
    const existingChannel = state.data?.find(
      (ch: any) => parseInt(ch.id) === parseInt(callChannelId),
    );

    // Construct mock channel if it doesn't exist in store
    const channel = existingChannel || {
      id: data.message.channel.id,
      messages: [{ ...data.message, message_type: { name: msgType } }],
      channel_members: [
        {
          user_id: data.user?.id,
          user: {
            id: data.user?.id,
            name: data.message.channel.channel_name,
            photo_path: data.message.channel.photo_path,
            ...privateData,
          },
          mute: 0,
          pin: 0,
          archived: 0,
          ...privateData,
        },
        {
          mute: 0,
          pin: 0,
          archived: 0,
          user_id: currentUser?.id,
          user: currentUser,
        },
      ],
      ...privateData,
      isPrivate: true,
    };

    const caller = {
      ...data.message.channel,
      ...privateData,
      isPrivate: true,
    };

    // If not the current user and not currently in an active call (or in limbo)
    if (
      data.user_id !== currentUser?.id &&
      (!state.callInProgress || state.callInProgress === 2)
    ) {
      const callData = {
        ...payloadData,
        channelId: data.message.channel.id,
        callerChannel: channel,
        caller: caller,
        message_id: data.message.id,
      };

      if (isVideo) {
        state.setIncomingCall(callData);
      } else {
        state.setIncomingVoiceCall(callData);
      }
    }

    // Update UI/State
    state.setLastNotificationDate(new Date().toLocaleString());
    state.receiveChannelEvent(parseInt(data.message.channel.id));

    // Watch channel if active
    if (
      parseInt(state.activeChat?.id) === parseInt(data.message?.channel?.id)
    ) {
      state.watchChannel(parseInt(data.message?.channel?.id));
    }

    // Send phantom message to update UI list
    state.sendMessage({
      act: data.message.channel,
      message: {
        ...data.message,
        channel: null,
        message_type: { name: msgType },
        message_status: [],
      },
      isPrivate: isPrivateCall,
    });

    resolve(payload);
  }

  /**
   * Handles Standard Messages and Product Shares
   */
  private handleChatMessage(
    eventType: string,
    data: any,
    state: any,
    resolve: any,
    payload: any,
  ) {
    const { activeChat, chatVar, country, language } = state;
    const currentUser = getUserChat();
    const messageData = data.message;
    const senderUser = messageData?.sender_user;
    const channel = messageData?.channel;

    // Determine content for notification
    let messagePreview = "";
    let messageImage = null;
    const senderName = senderUser?.name || senderUser?.mobile_phone;
    const senderPhoto = senderUser?.photo_path;

    const messageFiles = messageData?.message_files || [];
    const messageType = messageData?.message_type?.name;

    if (messageFiles.length > 0) {
      messageImage = messageFiles[0]?.file_path || messageFiles[0]?.url;
      messagePreview = getMessageNotificationPreview(messageType);
    } else if (messageData?.message_content?.content) {
      if (messageType?.includes("ShareProduct")) {
        messagePreview = translateFunction("Shared a product");
      } else {
        messagePreview = messageData.message_content.content;
      }
      if (messagePreview.length > 100) {
        messagePreview = messagePreview.substring(0, 100) + "...";
      }
    } else if (messageType) {
      messagePreview = translateFunction(`Sent a ${messageType}`);
    } else {
      messagePreview = translateFunction("New message");
    }

    // Override for ShareProduct event type specific logic
    if (eventType === "ShareProductEvent") {
      messagePreview = translateFunction("Shared a product");
    }

    // When re-auth is required, hide message preview and show only sender name
    const displayPreview = state.shouldAuthinticated ? "" : messagePreview;

    // --- Private/Delivery Logic ---
    const isPrivate = data?.is_private === true || data?.is_private === 1;

    if (isPrivate) {
      // If not in the active chat, show notification
      if (parseInt(activeChat?.id) !== parseInt(messageData?.channel_id)) {
        const orderGroupId = data.order_group_id;
        const orderId = data?.parent_order_id ?? data?.order_id;
        const chatId = data?.order_id;

        const deepLink = `/${country}-${language}/settings/orders/${orderGroupId}?order_id=${orderId}&chat_id=${chatId}&mid=${messageData?.id}`;

        showChatNotification(
          "Delivery Worker",
          displayPreview,
          channel?.id || messageData?.channel_id,
          channel,
          null,
          messageImage,
          messageType,
          5000,
          deepLink,
        );

        // Add red circle indicator
        const newItem = {
          order_id: orderId,
          chat_id: chatId,
          order_group_id: orderGroupId,
        };
        const existingItems = state.showNotificaionCircle.filter(
          (item: any) =>
            !(
              item.order_id === newItem.order_id &&
              item.chat_id === newItem.chat_id &&
              item.order_group_id === newItem.order_group_id
            ),
        );
        state.showNotificationIndicator([...existingItems, newItem]);
        return; // Exit for private msg not in view
      } else {
        // User is looking at the chat
        watchChannelAction(parseInt(messageData?.channel?.id));
        state.sendMessage({
          act: messageData?.channel,
          message: { ...messageData, channel: null },
          isPrivate: true,
        });
        return; // Exit for private msg in view
      }
    }

    // --- Standard Chat Logic ---

    // Update "Last Notification" date if the message connects to previous history
    const chatExists = state.data?.find(
      (c: any) => parseInt(c.id) === parseInt(messageData.channel.id),
    );
    const isLinkedMessage = chatExists?.messages.some(
      (m: any) => parseInt(m.id) === parseInt(data.prev_message_id),
    );

    // A muted chat raises no toast. The message itself still goes into the
    // store below, so the chat list, its order and its unread mark are
    // unchanged — mute silences the popup, it does not hide the message.
    //
    // The push says nothing about mute, so the flag comes from the chat we just
    // looked up. When the chat is not in the store yet there is nothing to read,
    // and an unknown chat is treated as not muted.
    const isMuted = isChannelMutedForMe(chatExists, currentUser?.id);

    if (isLinkedMessage || chatExists) {
      state.setLastNotificationDate(new Date().toLocaleString());
      state.receiveChannelEvent(parseInt(messageData.channel.id));

      // If active chat is the one receiving message
      if (parseInt(activeChat?.id) === parseInt(messageData?.channel?.id)) {
        state.watchChannel(parseInt(messageData?.channel?.id));

        // Should we show notification even if active? (Only if sender is not me and chatVar logic applies)
        if (String(currentUser?.id) !== String(senderUser?.id) && !chatVar) {
          // Logic from original: seemed to allow notif even if active in some cases?
          // Preserving original flow inside the if block for activeChat
          // Actually, original code shows notification inside active check if !active?.id which contradicts.
          // The cleanest interpretation of the original spaghetti:
          // If active, just update list.
        }
      } else {
        // Chat is not active
        if (
          String(currentUser?.id) !== String(senderUser?.id) &&
          !chatVar &&
          !isMuted
        ) {
          showChatNotification(
            senderName,
            displayPreview,
            channel?.id || messageData?.channel_id,
            channel,
            senderPhoto,
            messageImage,
            messageType,
            5000,
          );
        }
      }

      state.sendMessage({
        act: messageData?.channel,
        message: { ...messageData, channel: null },
      });

      // Fallback for "activeChat" check inside the list update
      // The original code had redundant checks. Simplify:
      // If not active, we already showed notification above.
      resolve(payload);
    } else {
      // Chat doesn't exist in store or not linked -> Refresh list
      // Logic for Notification when completely new or out of sync
      if (parseInt(activeChat?.id) !== parseInt(messageData?.channel?.id)) {
        if (
          !activeChat?.id &&
          String(currentUser?.id) !== String(senderUser?.id) &&
          !chatVar &&
          !isMuted
        ) {
          showChatNotification(
            senderName,
            displayPreview,
            channel?.id || messageData?.channel_id,
            channel,
            senderPhoto,
            messageImage,
            messageType,
            5000,
          );
        }
      }
      chat.getChats(true);
    }
  }
}

// Export singleton instance
export const foregroundNotificationHandler =
  new ForegroundNotificationHandler();
