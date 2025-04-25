import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  deleteToken,
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";
import { useAppStore } from "../store";
import { getUserChat } from "./functions";
import { GetChats, Recive } from "store/chat/actions";
import { InCall } from "store/chat/callActions";
import Boutique from "components/Notifications/Boutique";
import { Id } from "react-toastify";
import ProductToOldCart from "components/Notifications/ProductToOldCart";
import Category from "components/Notifications/Category";
import ProductAvailable from "components/Notifications/ProductAvailable";
import "firebase/analytics";
import { initializeAnalytics, isSupported } from "firebase/analytics";
import OrderPlaced from "components/Notifications/OrderPlaced";
import { AxiosGet } from "./AxiosApi";
import ProductHurryUp from "components/Notifications/ProductHurry";
import OrderStatusChanged from "components/Notifications/OrderStatusChanged";
const firebaseConfig = {
  // apiKey: "AIzaSyAl53TxLa2CoTBeXtg9K3Lr8G908ajb6kY",
  // authDomain: "trydos-ce234.firebaseapp.com",
  // databaseURL: "https://trydos-ce234-default-rtdb.firebaseio.com",
  // projectId: "trydos-ce234",
  // storageBucket: "trydos-ce234.appspot.com",
  // messagingSenderId: "912302743695",
  // appId: "1:912302743695:web:17d05f7385b792bf4110fa",
  // measurementId: "G-N8LNVEWJSJ",

  apiKey: "AIzaSyC3YInmCP8IqflkPjnpB9X4QCOQTa2bD64",
  authDomain: "trydos-2e2b2.firebaseapp.com",
  projectId: "trydos-2e2b2",
  storageBucket: "trydos-2e2b2.firebasestorage.app",
  messagingSenderId: "817506223106",
  appId: "1:817506223106:web:e9e39c9a34ac2aff82131b",
  measurementId: "G-NZ5P3EHDH3",
  databaseURL:
    "https://trydos-2e2b2-default-rtdb.europe-west1.firebasedatabase.app/",
};
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);
export const messaging =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  getMessaging(firebaseApp);
export const analytics =
  isSupported && typeof window !== "undefined"
    ? initializeAnalytics(firebaseApp)
    : null;

export const requestFirebaseNotificationPermission = async () => {
  const { setNotificationPermission } = useAppStore.getState();
  const tokenExpiry = localStorage.getItem("FBTokenExpiry");
  const tokenDate = tokenExpiry ? new Date(tokenExpiry) : null;
  const nowDate = new Date();

  // Check if tokenDate exists and is older than 1 day
  if (
    tokenDate &&
    nowDate.getTime() - tokenDate.getTime() > 24 * 60 * 60 * 1000
  ) {
    console.log("FCM token is older than 1 day. Refreshing...");
    await deleteToken(messaging); // Delete old token
  }

  return getToken(messaging)
    .then((currentToken) => {
      if (currentToken) {
        setNotificationPermission(true);
        localStorage.setItem("FBTokenExpiry", nowDate.toISOString());

        return currentToken;
      } else {
      }
    })
    .catch((err) => {
      setNotificationPermission(false);
      console.error(err);
    });
};

export const onMessageListener = async () => {
  const {
    setOrderData,
    endCall,
    watchChannelEvent,
    receiveChannelEvent,
    setVideoCall,
    setAudioCall,
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
  const { toast } = await import("react-toastify");
  return new Promise((resolve) => {
    onMessage(messaging, async (payload) => {
      console.log(payload);
      if (payload.data.title === "market") {
        const data = JSON.parse(payload.data.body);
        if (data?.type === "order status changed") {
          const toaster = (myProps, toastProps): Id =>
            toast(<OrderStatusChanged {...myProps} />, { ...toastProps });
          toaster.info = (myProps, toastProps): Id =>
            toast.info(<OrderStatusChanged {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body)?.type?.includes("product hurry up")) {
          const toaster = (myProps, toastProps): Id =>
            toast(<ProductHurryUp {...myProps} />, { ...toastProps });
          toaster.info = (myProps, toastProps): Id =>
            toast.info(<ProductHurryUp {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "boutique created") {
          const toaster = (myProps, toastProps): Id =>
            toast(<Boutique {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<Boutique {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "product cart expiration") {
          const toaster = (myProps, toastProps): Id =>
            toast(<ProductToOldCart {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<ProductToOldCart {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "category created") {
          const toaster = (myProps, toastProps): Id =>
            toast(<Category {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<Category {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "product availability") {
          const toaster = (myProps, toastProps): Id =>
            toast(<ProductAvailable {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<ProductAvailable {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "product discount") {
          const toaster = (myProps, toastProps): Id =>
            toast(<ProductAvailable {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<ProductAvailable {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "product comment") {
          const toaster = (myProps, toastProps): Id =>
            toast(<ProductAvailable {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<ProductAvailable {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "order placed") {
          let dataReq = await AxiosGet({
            url:
              process.env.NEXT_PUBLIC_BACKEND_URL +
              `/customer/order/getOrdersByOrderGroupID?order_group_id=${
                JSON.parse(payload.data.body).order_group_id
              }`,
            title: "getOrderByOrderGroupID request",
          });

          if (dataReq && dataReq?.length > 0) {
            const toaster = (myProps, toastProps): Id =>
              toast(<OrderPlaced {...myProps} />, { ...toastProps });

            toaster.info = (myProps, toastProps): Id =>
              toast.info(<OrderPlaced {...myProps} />, { ...toastProps });
            toaster.info({ data: data }, { data: data });
            setOrderData({ data: dataReq, success: true });
          }
        }
        if (
          JSON.parse(payload.data.body).type === "product when change in price"
        ) {
          const toaster = (myProps, toastProps): Id =>
            toast(<ProductAvailable {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<ProductAvailable {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
        if (JSON.parse(payload.data.body).type === "product before stock out") {
          const toaster = (myProps, toastProps): Id =>
            toast(<ProductAvailable {...myProps} />, { ...toastProps });

          toaster.info = (myProps, toastProps): Id =>
            toast.info(<ProductAvailable {...myProps} />, { ...toastProps });
          toaster.info({ data: data }, { data: data });
        }
      } else {
        if (payload.data.type === "InAnotherCallEvent") {
          toast.info("User In Another Call");
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
            GetChats(true);
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
    });
  });
};
