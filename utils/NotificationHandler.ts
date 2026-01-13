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
import { getUserChat, translateFunction } from "./functions";
import chat from "services/chat";
import { Recive, watchChannel as watchChannelAction } from "store/chat/actions";
import { REQUESTS_DATA } from "./Requests";
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

class ForegroundNotificationHandler {
  private isListening: boolean = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.initializeListener();
  }

  // Initialize the listener for service worker messages
  private initializeListener(): void {
    if (this.isListening) return;

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        this.handleServiceWorkerMessage(event);
      });
      this.isListening = true;
    }
  }

  // Handle messages from service worker
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const message: ServiceWorkerMessage = event.data;

    if (message.type === "FCM_NOTIFICATION") {
      this.handleNotification(() => {}, message.payload);
      // this.processNotification(message.payload);
    }
  }

  // Process the notification based on its type
  // Play notification sound

  public onNotification(type: string, handler: (data: any) => void): void {
    handler(null);
  }
  public async handleNotification(resolve: any, payload: any): Promise<void> {
    try {
      const {
        setOrderData,
        shouldUpdateOrders,
        setShouldUpdateOrders,
        endCall,
        orderData,
        watchChannelEvent,
        receiveChannelEvent,
        language,
        country,
        setIncomingCall,
        callInProgress,
        activeChat,
        setUserAnswerCall,
        call,
        data: chatData,
        setIncomingVoiceCall,
        setLastNotificationDate,
        watchChannel,
        sendMessage,
        deleteMessage,
        muteChat,
        deleteChat,
        showNotificationIndicator,
        showNotificaionCircle,
        setAppCountry,
        LoggingOut,
      } = useAppStore.getState();
      if (LoggingOut) return;
      console.log({
        ...payload,
        data: {
          ...(payload?.data ?? {}),
          body:
            typeof payload?.data?.body === "string"
              ? JSON.parse(payload?.data?.body ?? "{}")
              : "",
          data:
            typeof payload?.data?.data === "string"
              ? JSON.parse(payload.data.data)
              : payload.data.data,
        },
      });
      if (payload.data.title === "market") {
        let lang = `${country?.toLocaleLowerCase()}-${language?.toLocaleLowerCase()}`;
        const data = JSON.parse(payload.data.body);
        if (data?.type?.startsWith("order status changed")) {
          if (data.type === "order status changed") {
            setShouldUpdateOrders(shouldUpdateOrders + 1);
          } else {
            setShouldUpdateOrders(shouldUpdateOrders + 1);
            showSuccessNotification(
              data.description,
              5000,
              `/${lang}/settings/orders/${data?.order_group_id}`,
              {
                is_settings: true,
                href: `/${lang}/setting/orders/${data?.order_group_id}`,
              },
              null
            );
          }
        }
        if (JSON.parse(payload.data.body)?.type?.includes("product hurry up")) {
          showSuccessNotification(
            data.description,
            5000,
            data?.product_id ? `/products/${data.product_id}` : undefined,
            { is_product: true },
            data.image
          );
        }
        if (JSON.parse(payload.data.body).type === "boutique created") {
          showSuccessNotification(
            data.description || "New boutique available!",
            5000,
            data?.boutique_id
              ? `/${lang}/filters/boutiques/${data.boutique_id}`
              : undefined,
            { is_boutique: true },
            data.image
          );
        }
        if (JSON.parse(payload.data.body).type === "product cart expiration") {
          showSuccessNotification(
            data.description,
            5000,
            "/?cart=true",
            {},
            null
          );
        }
        if (JSON.parse(payload.data.body).type === "category created") {
          showSuccessNotification(
            data.description,
            5000,
            data?.category_slug
              ? `/${lang}/filters/categories/${data.category_slug}}`
              : undefined,
            { is_boutique: true },
            data.image
          );
        }
        if (JSON.parse(payload.data.body).type === "product availability") {
          let { setSelectedProductForCart, selected_product_for_add_to_cart } =
            useAppStore.getState();
          if (
            selected_product_for_add_to_cart &&
            selected_product_for_add_to_cart?.id &&
            parseInt(selected_product_for_add_to_cart?.id) ===
              parseInt(data.product_id)
          ) {
            setSelectedProductForCart({
              ...selected_product_for_add_to_cart,
              shouldUpdate: 1,
            });
          }
          showSuccessNotification(
            data?.description,
            5000,
            data?.product_id
              ? `/${lang}/products/${data.product_slug}`
              : undefined,
            {
              is_product: true,
              href: `/${lang}/products/${data.product_slug}`,
            },
            data.image
          );
        }
        if (JSON.parse(payload.data.body).type === "product discount") {
          showSuccessNotification(
            data?.description,
            5000,
            data?.product_slug
              ? `/${lang}/products/${data.product_slug}`
              : undefined,
            {
              is_product: true,
              href: `/${lang}/products/${data.product_slug}`,
            },
            data.image
          );
        }
        if (JSON.parse(payload.data.body).type === "product comment") {
          showSuccessNotification(
            data?.description,
            5000,
            data?.product_slug
              ? `/${lang}/products/${data.product_slug}`
              : undefined,
            {
              is_product: true,
              href: `/${lang}/products/${data.product_slug}`,
            },
            data.image
          );
        }
        if (JSON.parse(payload.data.body).type === "order placed") {
          try {
            let response = await fetchData({
              url: `/customer/order/getOrdersByOrderGroupID?order_group_id=${
                JSON.parse(payload.data.body).order_group_id
              }`,
              reqTitle: REQUESTS_DATA.GETORDERBYORDERGROUPID_REQUEST,
              method: "GET",
              server: "market",
            });
            if (!response.success) {
              throw new Error(response.message);
            }
            if (response.data && response.data?.length > 0) {
              showSuccessNotification(
                data.description,
                5000,
                `/${lang}/setting/orders/${data?.order_group_id}`,
                {
                  is_settings: true,
                  href: `/${lang}/setting/orders/${data?.order_group_id}`,
                },
                null
              );
              if (orderData.agree) {
                setOrderData({ data: response.data, success: true });
              }
            }
          } catch (error) {
            console.error(error);
          }
        }
        if (
          JSON.parse(payload.data.body).type === "product when change in price"
        ) {
          showSuccessNotification(
            data?.description,
            5000,
            data?.product_slug
              ? `/${lang}/products/${data.product_slug}`
              : undefined,
            {
              is_product: true,
              href: `/${lang}/products/${data.product_slug}`,
            },
            data.image
          );
        }
        if (JSON.parse(payload.data.body).type === "product before stock out") {
          showSuccessNotification(
            data?.description,
            5000,
            data?.product_slug
              ? `/${lang}/products/${data.product_slug}`
              : undefined,
            {
              is_product: true,
              href: `/${lang}/products/${data.product_slug}`,
            },
            data.image
          );
        }
      } else {
        if (payload.data.type === "InAnotherCallEvent") {
          showErrorNotification("User In Another Call", 3000);
        }
        if (payload.data.type === "RefuseCallEvent") {
          // getCalls();
          let messageID = JSON.parse(payload.data.data).message_id;
          if (callInProgress) {
            endCall(parseInt(messageID));
          } else {
            endCall(parseInt(messageID));
          }
        }
        if (payload.data.type === "AnswerCallEvent") {
          setUserAnswerCall();
        }
        if (payload.data.type === "VoiceCallEvent") {
          let Private = {};
          if (JSON.parse(payload.data.data)?.is_private) {
            Private = {
              name: "Deleivery Worker",
              photo_path: null,
              channel_name: "Deleivery Worker",
            };
          }
          try {
            if (call) {
              InCall(
                JSON.parse(payload.data.data).user?.id,
                JSON.parse(payload.data.data).message.id
              );
            } else {
              let data = JSON.parse(payload.data.data).payload;
              let channel = chatData.filter(
                (ch) => parseInt(ch.id) === parseInt(data.channelId)
              )[0]
                ? chatData.filter(
                    (ch) => parseInt(ch.id) === parseInt(data.channelId)
                  )[0]
                : {
                    id: JSON.parse(payload.data.data).message.channel.id,

                    messages: [
                      {
                        ...JSON.parse(payload.data.data).message,
                        message_type: { name: "VoiceCall" },
                      },
                    ],
                    channel_members: [
                      {
                        user_id: JSON.parse(payload.data.data).user?.id,
                        user: {
                          id: JSON.parse(payload.data.data).user?.id,
                          name: JSON.parse(payload.data.data).message.channel
                            .channel_name,
                          photo_path: JSON.parse(payload.data.data).message
                            .channel.photo_path,
                          ...Private,
                        },
                        ...Private,
                        mute: 0,
                        pin: 0,
                        archived: 0,
                        ...Private,
                      },
                      {
                        mute: 0,
                        pin: 0,
                        archived: 0,
                        user_id: getUserChat()?.id,
                        user: getUserChat(),
                      },
                    ],
                    ...Private,
                    isPrivate: true,
                  };
              let caller = {
                ...JSON.parse(payload.data.data).message.channel,
                ...Private,
                isPrivate: true,
              };

              if (
                data.user_id !== getUserChat()?.id &&
                (!callInProgress || callInProgress === 2)
              ) {
                setIncomingVoiceCall({
                  ...data,
                  channelId: JSON.parse(payload.data.data).message.channel.id,
                  callerChannel: channel,
                  caller: caller,
                  message_id: JSON.parse(payload.data.data).message.id,
                });
              }
              setLastNotificationDate(new Date().toLocaleString());
              receiveChannelEvent(
                parseInt(JSON.parse(payload.data.data).message.channel.id)
              );

              if (
                parseInt(activeChat?.id) ===
                parseInt(JSON.parse(payload.data.data)?.message.channel?.id)
              ) {
                watchChannel(
                  parseInt(JSON.parse(payload.data.data).message?.channel?.id)
                );
              } else {
                let active = activeChat;
                if (
                  active?.id &&
                  active?.channel_members.filter(
                    (mem) =>
                      mem.user_id === getUserChat()?.id && mem.user.mute === 1
                  ).length > 0
                ) {
                } else {
                  // let not = new Audio("/wa.mp3");
                  // not.volume = 0.5;
                  // not.play();
                }
              }
              sendMessage({
                act: JSON.parse(payload.data.data).message.channel,
                message: {
                  ...JSON.parse(payload.data.data).message,
                  channel: null,
                  message_type: { name: "VoiceCall" },
                  message_status: [],
                },
                isPrivate: JSON.parse(payload.data.data)?.is_private,
              });
            }
            resolve(payload);
          } catch (error) {
            console.error(error);
          }
        } else if (payload.data.type === "VideoCallEvent") {
          let Private = {};
          if (JSON.parse(payload.data.data)?.is_private) {
            Private = {
              name: "Deleivery Worker",
              photo_path: null,
              channel_name: "Deleivery Worker",
            };
          }
          if (call) {
            InCall(
              JSON.parse(payload.data.data).user?.id,
              JSON.parse(payload.data.data).message.id
            );
          } else {
            let data = JSON.parse(payload.data.data).payload;
            let channel = chatData.filter(
              (ch) => parseInt(ch.id) === parseInt(data.channelId)
            )[0]
              ? chatData.filter(
                  (ch) => parseInt(ch.id) === parseInt(data.channelId)
                )[0]
              : {
                  id: JSON.parse(payload.data.data).message.channel.id,
                  messages: [
                    {
                      ...JSON.parse(payload.data.data).message,
                      message_type: { name: "VideoCall" },
                    },
                  ],
                  channel_members: [
                    {
                      user_id: JSON.parse(payload.data.data).user?.id,
                      user: {
                        id: JSON.parse(payload.data.data).user?.id,
                        name: JSON.parse(payload.data.data).message.channel
                          .channel_name,
                        photo_path: JSON.parse(payload.data.data).message
                          .channel.photo_path,
                        ...Private,
                      },
                      ...Private,
                      mute: 0,
                      pin: 0,
                      archived: 0,
                    },
                    {
                      mute: 0,
                      pin: 0,
                      archived: 0,
                      user_id: getUserChat()?.id,
                      user: getUserChat(),
                    },
                  ],
                  ...Private,
                  isPrivate: true,
                };
            let caller = {
              ...JSON.parse(payload.data.data).message.channel,
              ...Private,
              isPrivate: true,
            };
            if (
              data.user_id !== getUserChat()?.id &&
              (!callInProgress || callInProgress === 2)
            ) {
              setIncomingCall({
                ...data,
                channelId: JSON.parse(payload.data.data).message.channel.id,
                callerChannel: channel,
                caller: caller,
                message_id: JSON.parse(payload.data.data).message.id,
              });
            }
            setLastNotificationDate(new Date().toLocaleString());
            receiveChannelEvent(
              parseInt(JSON.parse(payload.data.data).message.channel.id)
            );
            if (
              parseInt(activeChat?.id) ===
              parseInt(JSON.parse(payload.data.data)?.message?.channel?.id)
            ) {
              watchChannel(
                parseInt(JSON.parse(payload.data.data).message?.channel?.id)
              );
            } else {
              let active = activeChat;
              if (
                active?.id &&
                active?.channel_members.filter(
                  (mem) =>
                    mem.user_id === getUserChat()?.id && mem.user.mute === 1
                ).length > 0
              ) {
              } else {
                // let not = new Audio("/wa.mp3");
                // not.volume = 0.5;
                // not.play();
              }
            }
            sendMessage({
              act: JSON.parse(payload.data.data).message.channel,
              message: {
                ...JSON.parse(payload.data.data).message,
                channel: null,
                message_type: { name: "VideoCall" },
                message_status: [],
              },
              isPrivate: JSON.parse(payload.data.data)?.is_private,
            });
            resolve(payload);
          }
        } else if (payload.data.type === "message") {
          // Notification for new chat message
          const messageData = JSON.parse(payload.data.data).message;
          const messageContent = messageData?.message_content;
          const messageType = messageData?.message_type?.name;
          const messageFiles = messageData?.message_files || [];
          const senderUser = messageData?.sender_user;
          const channel = messageData?.channel;
          let messagePreview = "";
          let messageImage = null;
          const senderName = senderUser?.name || senderUser?.mobile_phone;
          const senderPhoto = senderUser?.photo_path;
          if (messageFiles && messageFiles.length > 0) {
            messageImage = messageFiles[0]?.file_path || messageFiles[0]?.url;
            messagePreview = getMessageNotificationPreview(messageType);
          } else if (messageContent?.content) {
            if (messageType?.includes("ShareProduct")) {
              messagePreview = translateFunction("Shared a product");
            } else messagePreview = messageContent?.content;
            // Truncate long messages
            if (messagePreview.length > 100) {
              messagePreview = messagePreview?.substring(0, 100) + "...";
            }
          } else if (messageType) {
            messagePreview = translateFunction(`Sent a ${messageType}`);
          } else {
            messagePreview = translateFunction("New message");
          }
          // Handle private messages differently

          if (
            JSON.parse(payload.data.data)?.is_private === true ||
            JSON.parse(payload.data.data)?.is_private === 1
          ) {
            if (
              parseInt(activeChat?.id) !==
              parseInt(JSON.parse(payload?.data.data)?.message?.channel_id)
            ) {
              showChatNotification(
                "Deleivery Worker",
                messagePreview,
                channel?.id || messageData?.channel_id,
                channel,
                null,
                messageImage,
                messageType,
                5000,
                `/${country}-${language}/settings/orders/${
                  JSON.parse(payload.data.data).order_group_id
                }?order_id=${
                  JSON.parse(payload.data.data)?.parent_order_id ??
                  JSON.parse(payload?.data?.data)?.order_id
                }&chat_id=${JSON.parse(payload?.data?.data)?.order_id}&mid=${
                  messageData?.id
                }`
              );

              const parsedData = JSON.parse(payload?.data?.data);
              const newItem = {
                order_id: parsedData?.parent_order_id ?? parsedData?.order_id,
                chat_id: parsedData?.order_id,
                order_group_id: parsedData?.order_group_id,
              };

              // Ensure uniqueness by all three fields
              showNotificationIndicator([
                ...showNotificaionCircle.filter(
                  (item) =>
                    !(
                      item.order_id === newItem.order_id &&
                      item.chat_id === newItem.chat_id &&
                      item.order_group_id === newItem.order_group_id
                    )
                ),
                newItem,
              ]);
              return;
            }
            if (
              parseInt(activeChat?.id) ===
              parseInt(JSON.parse(payload?.data.data)?.message?.channel_id)
            ) {
              watchChannelAction(
                parseInt(JSON.parse(payload.data.data)?.message?.channel?.id)
              );
              sendMessage({
                act: JSON.parse(payload.data.data)?.message?.channel,
                message: {
                  ...JSON.parse(payload.data.data).message,
                  channel: null,
                },
                isPrivate: true,
              });
              return;
            }
          }

          if (
            chatData
              .filter(
                (chat) =>
                  parseInt(chat.id) ===
                  parseInt(JSON.parse(payload.data.data).message.channel.id)
              )[0]
              ?.messages.filter(
                (message) =>
                  parseInt(message.id) ===
                  parseInt(JSON.parse(payload.data.data).prev_message_id)
              ).length > 0
          ) {
            setLastNotificationDate(new Date().toLocaleString());
            receiveChannelEvent(
              parseInt(JSON.parse(payload.data.data).message.channel.id)
            );
            if (
              parseInt(activeChat?.id) ===
              parseInt(JSON.parse(payload?.data.data)?.message?.channel?.id)
            ) {
              watchChannel(
                parseInt(JSON.parse(payload.data.data)?.message?.channel?.id)
              );
            } else {
              let { chatVar } = useAppStore.getState();
              if (String(getUserChat()?.id) !== String(senderUser?.id)) {
                if (!chatVar)
                  showChatNotification(
                    senderName,
                    messagePreview,
                    channel?.id || messageData?.channel_id,
                    channel,
                    senderPhoto,
                    messageImage,
                    messageType,
                    5000
                  );
              }
            }
            sendMessage({
              act: JSON.parse(payload.data.data)?.message?.channel,
              message: {
                ...JSON.parse(payload.data.data).message,
                channel: null,
              },
            });
            if (
              parseInt(activeChat?.id) ===
              parseInt(JSON.parse(payload?.data.data)?.message?.channel?.id)
            ) {
              let active = activeChat;
              // Show chat notification if not muted
              if (
                !active?.id ||
                active?.channel_members.filter(
                  (mem) =>
                    mem.user_id === getUserChat()?.id && mem.user.mute === 1
                ).length === 0
              ) {
                // Check if message has image

                // Show chat notification
                let { chatVar } = useAppStore.getState();
                if (String(getUserChat()?.id) !== String(senderUser?.id)) {
                  if (!chatVar)
                    showChatNotification(
                      senderName,
                      messagePreview,
                      channel?.id || messageData?.channel_id,
                      channel,
                      senderPhoto,
                      messageImage,
                      messageType,
                      5000
                    );
                }
              }
            }
            resolve(payload);
          } else {
            if (
              parseInt(activeChat?.id) !==
              parseInt(JSON.parse(payload?.data.data)?.message?.channel?.id)
            ) {
              let active = activeChat;
              const messageData = JSON.parse(payload.data.data).message;
              const senderUser = messageData?.sender_user;
              const messageContent = messageData?.message_content;
              const messageType = messageData?.message_type?.name;
              const messageFiles = messageData?.message_files || [];
              const channel = messageData?.channel;

              // Show chat notification if not muted
              if (
                !active?.id ||
                active?.channel_members.filter(
                  (mem) =>
                    mem.user_id === getUserChat()?.id && mem.user.mute === 1
                ).length === 0
              ) {
                // Show chat notification
                let { chatVar } = useAppStore.getState();
                if (String(getUserChat()?.id) !== String(senderUser?.id)) {
                  if (!chatVar)
                    showChatNotification(
                      senderName,
                      messagePreview,
                      channel?.id || messageData?.channel_id,
                      channel,
                      senderPhoto,
                      messageImage,
                      messageType,
                      5000
                    );
                }
              }
            }
            chat.getChats(true);
          }
        } else if (payload.data.type === "ShareProductEvent") {
          let data = JSON.parse(payload.data.data);
          const messageData = JSON.parse(payload.data.data).message;
          const messageContent = messageData?.message_content;
          const messageType = messageData?.message_type?.name;
          const messageFiles = messageData?.message_files || [];
          const senderUser = messageData?.sender_user;
          const channel = messageData?.channel;

          let messageImage = null;
          const senderName = senderUser?.name || senderUser?.mobile_phone;
          const senderPhoto = senderUser?.photo_path;
          let messagePreview = translateFunction("Shared a product");

          if (
            chatData
              .filter(
                (chat) =>
                  parseInt(chat.id) ===
                  parseInt(JSON.parse(payload.data.data).message.channel.id)
              )[0]
              ?.messages.filter(
                (message) =>
                  parseInt(message.id) ===
                  parseInt(JSON.parse(payload.data.data).prev_message_id)
              ).length > 0
          ) {
            setLastNotificationDate(new Date().toLocaleString());
            receiveChannelEvent(
              parseInt(JSON.parse(payload.data.data).message.channel.id)
            );
            if (
              parseInt(activeChat?.id) ===
              parseInt(JSON.parse(payload?.data.data)?.message?.channel?.id)
            ) {
              watchChannel(
                parseInt(JSON.parse(payload.data.data)?.message?.channel?.id)
              );
            } else {
              let { chatVar } = useAppStore.getState();
              if (String(getUserChat()?.id) !== String(senderUser?.id)) {
                if (!chatVar)
                  showChatNotification(
                    senderName,
                    messagePreview,
                    channel?.id || messageData?.channel_id,
                    channel,
                    senderPhoto,
                    messageImage,
                    messageType,
                    5000
                  );
              }
            }
            sendMessage({
              act: JSON.parse(payload.data.data)?.message?.channel,
              message: {
                ...JSON.parse(payload.data.data).message,
                channel: null,
              },
            });
            if (
              parseInt(activeChat?.id) ===
              parseInt(JSON.parse(payload?.data.data)?.message?.channel?.id)
            ) {
              let active = activeChat;
              // Show chat notification if not muted
              if (
                !active?.id ||
                active?.channel_members.filter(
                  (mem) =>
                    mem.user_id === getUserChat()?.id && mem.user.mute === 1
                ).length === 0
              ) {
                // Check if message has image

                // Show chat notification
                let { chatVar } = useAppStore.getState();
                if (String(getUserChat()?.id) !== String(senderUser?.id)) {
                  if (!chatVar)
                    showChatNotification(
                      senderName,
                      messagePreview,
                      channel?.id || messageData?.channel_id,
                      channel,
                      senderPhoto,
                      messageImage,
                      messageType,
                      5000
                    );
                }
              }
            }
            resolve(payload);
          } else {
            if (
              parseInt(activeChat?.id) !==
              parseInt(JSON.parse(payload?.data.data)?.message?.channel?.id)
            ) {
              let active = activeChat;
              // Show chat notification if not muted
              if (
                !active?.id ||
                active?.channel_members.filter(
                  (mem) =>
                    mem.user_id === getUserChat()?.id && mem.user.mute === 1
                ).length === 0
              ) {
                // Show chat notification
                let { chatVar } = useAppStore.getState();
                if (String(getUserChat()?.id) !== String(senderUser?.id)) {
                  if (!chatVar)
                    showChatNotification(
                      senderName,
                      messagePreview,
                      channel?.id || messageData?.channel_id,
                      channel,
                      senderPhoto,
                      messageImage,
                      messageType,
                      5000
                    );
                }
              }
            }
            chat.getChats(true);
          }
        }
        if (payload.data.type === "ChannelWatchedEvent") {
          watchChannelEvent(JSON.parse(payload.data.data).channel_id);
        }
        if (payload.data.type === "ChannelReceivedEvent") {
          receiveChannelEvent(JSON.parse(payload.data.data).channel_id);
        }
        if (payload.data.type === "UpdatingMessageEvent") {
          deleteMessage({
            ch_id: JSON.parse(payload.data.data).message.channel_id,
            msg_id: JSON.parse(payload.data.data).message.id,
            bool: true,
          });
        }
        if (payload.data.type === "ChannelUpdatedEvent") {
          // store.dispatch({
          //   type: "PIN_CHAT_REDUCER",
          //   payload: {
          //     event: true,
          //     id: parseInt(JSON.parse(payload.data.data).channel.id),
          //     value: parseInt(JSON.parse(payload.data.data).channel.is_mute),
          //   },
          // });
          muteChat({
            event: true,
            id: JSON.parse(payload.data.data).channel.id,
            value: parseInt(JSON.parse(payload.data.data).channel.is_mute),
          });
        }
        if (payload.data.type === "ChannelDeletedEvent") {
          let id = JSON.parse(payload.data.data).channel_id;
          deleteChat({ id: id });
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

// Export singleton instance
export const foregroundNotificationHandler =
  new ForegroundNotificationHandler();

function getMessageNotificationPreview(messageType: string) {
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
}
