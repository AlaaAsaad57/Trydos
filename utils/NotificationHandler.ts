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
import { getUserChat, LogError, translateFunction } from "./functions";
import chat from "services/chat";
import { watchChannel as watchChannelAction } from "store/chat/actions";
import { REQUESTS_DATA } from "./Requests";

// --- Interfaces ---

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: any;
  type?: string;
}

interface ServiceWorkerMessage {
  type: string;
  payload: NotificationData;
  timestamp: number;
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

class ForegroundNotificationHandler {
  private isListening: boolean = false;

  constructor() {
    this.initializeListener();
  }

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
    const message: ServiceWorkerMessage = event.data;
    if (message.type === "FCM_NOTIFICATION") {
      this.handleNotification(() => {}, message.payload);
    }
  }

  public onNotification(type: string, handler: (data: any) => void): void {
    handler(null);
  }

  // --- Main Entry Point ---

  public async handleNotification(resolve: any, payload: any): Promise<void> {
    try {
      const state = useAppStore.getState();
      if (state.LoggingOut) return;

      // Unify data parsing
      const rawData = payload?.data || {};
      const body = safeParse(rawData.body);
      const data = safeParse(rawData.data); // This is the inner 'data' object used in most events

      // 1. Handle Market/E-commerce Notifications
      if (rawData.title === "market") {
        await this.handleMarketEvent(body, state);
        return;
      }

      // 2. Handle System/Chat/Call Notifications
      const eventType = rawData.type;

      switch (eventType) {
        case "InAnotherCallEvent":
          showErrorNotification("User In Another Call", 3000);
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
        case "ShareProductEvent":
          this.handleChatMessage(eventType, data, state, resolve, payload);
          break;

        case "ChannelWatchedEvent":
          state.watchChannelEvent(data.channel_id);
          break;

        case "ChannelReceivedEvent":
          state.receiveChannelEvent(data.channel_id);
          break;

        case "UpdatingMessageEvent":
          state.deleteMessage({
            ch_id: data.message.channel_id,
            msg_id: data.message.id,
            bool: true,
          });
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
   * Handles e-commerce related notifications (Orders, Products, Boutiques)
   */
  private async handleMarketEvent(data: any, state: any) {
    const { country, language } = state;
    const lang = `${country?.toLowerCase()}-${language?.toLowerCase()}`;
    const type = data?.type || "";

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

    if (type.startsWith("order status changed")) {
      state.setShouldUpdateOrders(state.shouldUpdateOrders + 1);
      if (type !== "order status changed") {
        const url = `/${lang}/settings/orders/${data?.order_group_id}`;
        notify(url, {
          is_settings: true,
          href: `/${lang}/setting/orders/${data?.order_group_id}`,
        });
      }
    } else if (type.includes("product hurry up")) {
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
      await this.handleOrderPlaced(data, lang, state);
    }
  }

  /**
   * Special logic for Order Placed which requires data fetching
   */
  private async handleOrderPlaced(data: any, lang: string, state: any) {
    try {
      const response = await fetchData({
        url: `/customer/order/getOrdersByOrderGroupID?order_group_id=${data.order_group_id}`,
        reqTitle: REQUESTS_DATA.GETORDERBYORDERGROUPID_REQUEST,
        method: "GET",
        server: "market",
      });

      if (!response.success) throw new Error(response.message);

      if (response.data && response.data?.length > 0) {
        const url = `/${lang}/setting/orders/${data?.order_group_id}`;
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
          name: "Deleivery Worker",
          photo_path: null,
          channel_name: "Deleivery Worker",
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
    const existingChannel = state.data?.find(
      (ch: any) => parseInt(ch.id) === parseInt(payloadData.channelId),
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
          "Deleivery Worker",
          messagePreview,
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
        if (String(currentUser?.id) !== String(senderUser?.id) && !chatVar) {
          showChatNotification(
            senderName,
            messagePreview,
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
          !chatVar
        ) {
          showChatNotification(
            senderName,
            messagePreview,
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
