import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { store } from "../store/index";
import { getUserChat } from "./functions";
import { GetChats, Recive } from "store/chat/actions";
import { InCall } from "../store/chat/actions";

const firebaseConfig = {
  apiKey: "AIzaSyAl53TxLa2CoTBeXtg9K3Lr8G908ajb6kY",
  authDomain: "trydos-ce234.firebaseapp.com",
  databaseURL: "https://trydos-ce234-default-rtdb.firebaseio.com",
  projectId: "trydos-ce234",
  storageBucket: "trydos-ce234.appspot.com",
  messagingSenderId: "912302743695",
  appId: "1:912302743695:web:17d05f7385b792bf4110fa",
  measurementId: "G-N8LNVEWJSJ",
};
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);
export const messaging =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  getMessaging(firebaseApp);

export const requestFirebaseNotificationPermission = async () => {
  return getToken(messaging)
    .then((currentToken) => {
      if (currentToken) {
        store.dispatch({ type: "Notification", payload: true });
        return currentToken;
        // Track the token -> client mapping, by sending to backend server
        // show on the UI that permission is secured
      } else {
        // shows on the UI that permission is required
      }
    })
    .catch((err) => {
      store.dispatch({ type: "Notification", payload: false });
      console.error(err);
    });
};
export const onMessageListener = async () => {
  const { toast } = await import("react-toastify");
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      if (payload.data.type === "InAnotherCallEvent") {
        // store.dispatch({ type: "USER_END_CALL" });
        store.dispatch({ type: "enableNotifications" });
        toast.info("User In Another Call");
      }
      if (payload.data.type === "RefuseCallEvent") {
        // getCalls();
        let messageID = JSON.parse(payload.data.data).message_id;
        if (store.getState().chat.callInProgress) {
          store.dispatch({
            type: "USER_END_CALL",
            payload: parseInt(messageID),
          });
        } else {
          store.dispatch({ type: "END-CALL", payload: parseInt(messageID) });
        }
      }
      if (payload.data.type === "AnswerCallEvent") {
        let messageID = JSON.parse(payload.data.data).message_id;
        store.dispatch({
          type: "USER_ANSWER_CALL",
          payload: parseInt(messageID),
        });
      }
      if (payload.data.type === "VoiceCallEvent") {
        if (store.getState().chat.call) {
          InCall(
            JSON.parse(payload.data.data).message.channel.id,
            JSON.parse(payload.data.data).message.id
          );
        } else {
          let data = JSON.parse(payload.data.data).payload;
          let channel = store
            .getState()
            .chat.data.filter(
              (ch) => parseInt(ch.id) === parseInt(data.channelId)
            )[0]
            ? store
                .getState()
                .chat.data.filter(
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
                      photo_path: JSON.parse(payload.data.data).message.channel
                        .photo_path,
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
            (!store.getState().chat.callInProgress ||
              store.getState().chat.callInProgress === 2)
          ) {
            store.dispatch({
              type: "INCOMING_VOICE_CALL",
              payload: {
                ...data,
                channelId: JSON.parse(payload.data.data).message.channel.id,
                callerChannel: channel,
                caller: caller,
                message_id: JSON.parse(payload.data.data).message.id,
              },
            });
          }
          store.dispatch({
            type: "SET_LAST_NOTIFICATION_DATE",
            payload: new Date().toLocaleString(),
          });
          store.dispatch({
            type: "REC_CHA",
            payload: parseInt(JSON.parse(payload.data.data).message.channel.id),
          });
          if (
            parseInt(store?.getState()?.chat?.activeChat?.id) ===
            parseInt(JSON.parse(payload.data.data)?.message.channel?.id)
          ) {
            store.dispatch({
              type: "WATCH_CHANNEL",
              payload: parseInt(
                JSON.parse(payload.data.data).message?.channel?.id
              ),
            });
          } else {
            let active = store?.getState()?.chat?.activeChat;
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
          store.dispatch({
            type: "SEND-MESSAGE",
            payload: {
              act: JSON.parse(payload.data.data).message.channel,
              message: {
                ...JSON.parse(payload.data.data).message,
                channel: null,
                message_type: { name: "VoiceCall" },
                message_status: [],
              },
            },
          });
        }
        resolve(payload);
      } else if (payload.data.type === "VideoCallEvent") {
        if (store.getState().chat.call) {
          InCall(
            JSON.parse(payload.data.data).message.channel.id,
            JSON.parse(payload.data.data).message.id
          );
        } else {
          let data = JSON.parse(payload.data.data).payload;
          let channel = store
            .getState()
            .chat.data.filter(
              (ch) => parseInt(ch.id) === parseInt(data.channelId)
            )[0]
            ? store
                .getState()
                .chat.data.filter(
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
                      photo_path: JSON.parse(payload.data.data).message.channel
                        .photo_path,
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
            (!store.getState().chat.callInProgress ||
              store.getState().chat.callInProgress === 2)
          ) {
            store.dispatch({
              type: "INCOMING_CALL",
              payload: {
                ...data,
                channelId: JSON.parse(payload.data.data).message.channel.id,
                callerChannel: channel,
                caller: caller,
                message_id: JSON.parse(payload.data.data).message.id,
              },
            });
          }
          store.dispatch({
            type: "SET_LAST_NOTIFICATION_DATE",
            payload: new Date().toLocaleString(),
          });
          store.dispatch({
            type: "REC_CHA",
            payload: parseInt(JSON.parse(payload.data.data).message.channel.id),
          });
          if (
            parseInt(store?.getState()?.chat?.activeChat?.id) ===
            parseInt(JSON.parse(payload.data.data)?.message?.channel?.id)
          ) {
            store.dispatch({
              type: "WATCH_CHANNEL",
              payload: parseInt(
                JSON.parse(payload.data.data).message?.channel?.id
              ),
            });
          } else {
            let active = store?.getState()?.chat?.activeChat;
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
          store.dispatch({
            type: "SEND-MESSAGE",
            payload: {
              act: JSON.parse(payload.data.data).message.channel,
              message: {
                ...JSON.parse(payload.data.data).message,
                channel: null,
                message_type: { name: "VideoCall" },
                message_status: [],
              },
            },
          });

          resolve(payload);
        }
      } else if (payload.data.type === "message") {
        Recive(parseInt(JSON.parse(payload.data.message).channel.id));
        if (
          store
            ?.getState()
            ?.chat?.data.filter(
              (chat) =>
                parseInt(chat.id) ===
                parseInt(JSON.parse(payload?.data.message)?.channel?.id)
            )[0]
            ?.messages.filter(
              (message) =>
                parseInt(message.id) === parseInt(payload.data.prev_message_id)
            ).length > 0
        ) {
          store.dispatch({
            type: "SET_LAST_NOTIFICATION_DATE",
            payload: new Date().toLocaleString(),
          });
          store.dispatch({
            type: "REC_CHA",
            payload: parseInt(JSON.parse(payload.data.message).channel.id),
          });
          if (
            parseInt(store?.getState()?.chat?.activeChat?.id) ===
            parseInt(JSON.parse(payload?.data.message)?.channel?.id)
          ) {
            store.dispatch({
              type: "WATCH_CHANNEL",
              payload: parseInt(JSON.parse(payload.data.message)?.channel?.id),
            });
          } else {
            let active = store?.getState()?.chat?.activeChat;
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
          store.dispatch({
            type: "SEND-MESSAGE",
            payload: {
              act: JSON.parse(payload.data.message).channel,
              message: { ...JSON.parse(payload.data.message), channel: null },
            },
          });

          resolve(payload);
        } else {
          GetChats(true);
        }
      }
      if (payload.data.type === "ChannelWatchedEvent") {
        store.dispatch({
          type: "WATCH_CHANNEL_RED",
          payload: JSON.parse(payload.data.data).channel_id,
        });
      }
      if (payload.data.type === "ChannelReceivedEvent") {
        store.dispatch({
          type: "REC_CHANNEL_RED",
          payload: JSON.parse(payload.data.data).channel_id,
        });
      }
      if (payload.data.type === "UpdatingMessageEvent") {
        store.dispatch({
          type: "DELETE_MESSAGE",
          payload: {
            ch_id: JSON.parse(payload.data.data).message.channel_id,
            msg_id: JSON.parse(payload.data.data).message.id,
            bool: true,
          },
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
        store.dispatch({
          type: "MUTE_CHAT_REDUCER",
          payload: {
            event: true,
            id: JSON.parse(payload.data.data).channel.id,
            value: parseInt(JSON.parse(payload.data.data).channel.is_mute),
          },
        });
      }
      if (payload.data.type === "ChannelDeletedEvent") {
        let id = JSON.parse(payload.data.data).channel_id;
        store.dispatch({ type: "DELETE_CHAT_REDUCER", payload: { id: id } });
      }
    });
  });
};
