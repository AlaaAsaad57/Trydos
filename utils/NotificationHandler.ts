// Foreground Notification Handler
// This file handles FCM notifications when the app is in the foreground

import { useAppStore } from "store";
import {
  showErrorNotification,
  showSuccessNotification,
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
      console.log("🔔 Foreground notification handler initialized");
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
      } = useAppStore.getState();
      console.log(payload);
      if (payload.data.title === "market") {
        let lang = `${country?.toLocaleLowerCase()}-${language?.toLocaleLowerCase()}`;
        const data = JSON.parse(payload.data.body);
        if (data?.type?.startsWith("order status changed")) {
          setShouldUpdateOrders(shouldUpdateOrders + 1);
          showSuccessNotification(
            data.description,
            5000,
            `/${lang}/setting?tab=Orders&id=${data?.order_group_id}`,
            {
              is_setting: true,
              href: `/${lang}/setting?tab=Orders&id=${data?.order_group_id}`,
            },
            null
          );
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
                `/${lang}/setting?tab=Orders&id=${data?.order_group_id}`,
                {
                  is_setting: true,
                  href: `/${lang}/setting?tab=Orders&id=${data?.order_group_id}`,
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
          try {
            if (call) {
              InCall(
                JSON.parse(payload.data.data).message.channel.id,
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
                        user_id: data.user_id,
                        user: {
                          id: data.user_id,
                          name: JSON.parse(payload.data.data).message.channel
                            .channel_name,
                          photo_path: JSON.parse(payload.data.data).message
                            .channel.photo_path,
                        },
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
                  };
              let caller = { ...JSON.parse(payload.data.data).message.channel };

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
                  let not = new Audio("/wa.mp3");
                  not.volume = 0.5;
                  not.play();
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
              });
            }
            resolve(payload);
          } catch (error) {
            console.error(error);
          }
        } else if (payload.data.type === "VideoCallEvent") {
          if (call) {
            InCall(
              JSON.parse(payload.data.data).message.channel.id,
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
                      user_id: data.user_id,
                      user: {
                        id: data.user_id,
                        name: JSON.parse(payload.data.data).message.channel
                          .channel_name,
                        photo_path: JSON.parse(payload.data.data).message
                          .channel.photo_path,
                      },
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
                };
            let caller = { ...JSON.parse(payload.data.data).message.channel };
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
                let not = new Audio("/wa.mp3");
                not.volume = 0.5;
                not.play();
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
            });
            resolve(payload);
          }
        } else if (payload.data.type === "message") {
          if (JSON.parse(payload.data.data)?.is_private === true) {
            showSuccessNotification(
              translateFunction(
                "You Have New Messages From Deleivery Worker..click for more"
              ),
              6000,
              `/${country}-${language}/setting?tab=Orders&id=${
                JSON.parse(payload.data.data).order_group_id
              }&order_id_chat=${
                JSON.parse(payload.data.data)?.parent_order_id ??
                JSON.parse(payload?.data?.data)?.order_id
              }&chat_id=${JSON.parse(payload?.data?.data)?.order_id}`
            );
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
          Recive(parseInt(JSON.parse(payload.data.data).message.channel.id));
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
              let active = activeChat;
              if (
                active?.id &&
                active?.channel_members.filter(
                  (mem) =>
                    mem.user_id === getUserChat()?.id && mem.user.mute === 1
                ).length > 0
              ) {
              } else {
                let not = new Audio("/wa.mp3");
                not.volume = 0.5;
                not.play();
              }
            }
            sendMessage({
              act: JSON.parse(payload.data.data)?.message?.channel,
              message: {
                ...JSON.parse(payload.data.data).message,
                channel: null,
              },
            });

            resolve(payload);
          } else {
            chat.getChats(true);
          }
        } else if (payload.data.type === "ShareProductEvent") {
          let data = JSON.parse(payload.data.data);
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
