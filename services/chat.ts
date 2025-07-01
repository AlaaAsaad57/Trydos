import {
  GET_CHATS_URL,
  GET_CONTATCS_URL,
  LOG_IN_CHAT,
} from "utils/endpointConfig";
import HomeService from "services/home";
import Cookies from "js-cookie";
import { useAppStore } from "store";
import {
  _isStoreLastJson,
  getLang,
  getUserChat,
  translateFunction as translate,
} from "utils/functions";

import { UnAuthintacetedAction } from "utils/tinyUtils";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
const ChatHeader = () => {
  return {
    headers: {
      Authorization:
        "Bearer " +
        JSON.parse(
          typeof localStorage !== "undefined" &&
            localStorage.getItem("USER-CHAT")
        )?.access_token,
      lang: getLang(null, Cookies.get("language")),
      country: Cookies.get("country"),
    },
  };
};
class ChatService {
  async loginChat() {
    try {
      const response = await fetchData({
        url: LOG_IN_CHAT,
        body: JSON.stringify({
          otp_id_token: localStorage.getItem("ID-TOKEN"),
          mobile_phone: JSON.parse(localStorage.getItem("USER")).phone,
          name: JSON.parse(localStorage.getItem("USER"))?.name,
          original_user_id: JSON.parse(localStorage.getItem("USER")).id,
        }),
        method: "POST",
        server: "chat",
        reqTitle: "Login Chat",
      });

      localStorage.setItem("USER-CHAT", JSON.stringify(response.data));

      if (response.data?.id) {
        const { requestFirebaseNotificationPermission } = await import(
          "utils/firebaseInitv1"
        );
        typeof window !== "undefined" &&
          "serviceWorker" in navigator &&
          requestFirebaseNotificationPermission().then(
            (firebaseToken: string) => {
              localStorage.setItem("firebase_token", firebaseToken);
              if (response.data) {
                try {
                  if (!firebaseToken) {
                  } else {
                    localStorage.setItem("firebase_token", firebaseToken);
                    this.StoreToken({
                      id: response.data.id,
                      token: firebaseToken,
                      user: response.data,
                    });
                  }
                } catch (e) {}
              }
            }
          );
        HomeService.CheckLogin();
      } else {
        throw new Error();
      }
    } catch (e) {}
  }
  async ShareProduct({ userId, product, callback }) {
    const { language } = useAppStore.getState();
    try {
      await fetchData({
        url: "/api/v1/messages/share_product",
        body: JSON.stringify({
          receiver_ids: userId,
          content: [
            { ...product, product_image_width: 400, product_image_height: 400 },
          ],
        }),
        method: "POST",
        server: "chat",
        reqTitle: "Share Product",
      });
      await this.getChats("share");
      showSuccessNotification(translate("Shared Successfully", language));
      callback();
    } catch (e) {
      showErrorNotification(translate("Product Share error", language));
    }
  }
  async StoreToken(payload: {
    id?: string | number;
    user?: { access_token: string; id: number };
    token: string;
  }) {
    try {
      const { setFirebaseToken } = useAppStore.getState();
      const response = await fetchData({
        url: "/api/v1/firebase_tokens",
        method: "POST",
        server: "chat",
        reqTitle: "Store Token",
        body: JSON.stringify({
          token: payload.token,
        }),
      });
      setFirebaseToken(payload.token);
      localStorage.setItem("firebase_id", response.data.id);
    } catch (error) {
      console.log(error);
    }
  }
  async getChats(payload) {
    const {
      setChatLoading,
      setChatDone,
      setChats,
      setIsTyping,
      setLastNotificationDate,
      setContacts,
    } = useAppStore.getState();

    const { onValue, ref } = await import("firebase/database");
    try {
      if (!payload) {
        setChatLoading();
      }

      let response = await fetchData({
        url: GET_CHATS_URL,
        body: JSON.stringify({ role_id: 16 }),
        reqTitle: "Get Chats",
        method: "POST",
        server: "chat",
      });

      setChats(response.data.channels, response.data.pinned_channels);
      const { db } = await import("../utils/firebaseInitv1");
      let chats = [...response.data.channels, ...response.data.pinned_channels];
      chats.map((chat) => {
        let friendID = chat.channel_members.filter(
          (member) => parseInt(member.user_id) !== parseInt(getUserChat().id)
        )[0]?.user_id;
        let MyId = getUserChat().id;
        //wew

        const dbRef = ref(db, `Transaction/${friendID}/${MyId}`);
        onValue(dbRef, (snapshot) => {
          const desc = snapshot.val();

          if (!!desc) {
            if (typeof desc === "string") {
              setIsTyping({ id: chat.id, desc: desc });
            } else {
              setIsTyping({
                id: chat.id,
                desc:
                  Object.keys(desc).length > 0
                    ? desc[Object.keys(desc)[0]]
                    : null,
              });
            }
          } else {
            setIsTyping({ id: chat.id, desc: null });
          }
        });
      });

      setLastNotificationDate(new Date().toLocaleString());
      setChatDone();
    } catch (e) {
      console.error(e);
    }
  }
  async getContacts() {
    const { setContacts } = useAppStore.getState();

    let response = await fetchData({
      url: GET_CONTATCS_URL,
      reqTitle: "Get Contacts",
      server: "chat",
      method: "GET",
    });

    setContacts(response.data);
  }
  async getCalls(id?: number) {
    const { setCallLoading, setCalls } = useAppStore.getState();
    try {
      setCallLoading(true);
      let response = await fetchData({
        url: "/api/v1/channels/my_calls",
        body: JSON.stringify({ limit: "20", last_message_id: id }),
        method: "POST",
        reqTitle: "Get Calls",
        server: "chat",
      });

      setCalls(response.data);
      setCallLoading(false);
    } catch (e) {
      setCallLoading(false);
      console.error(e);
    }
  }
}
export default new ChatService();
