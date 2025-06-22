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
import axios from "axios";

import { toast } from "react-toastify";
import { getCalls } from "store/chat/actions";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { UnAuthintacetedAction } from "utils/tinyUtils";
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
      const response = await fetch(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + LOG_IN_CHAT,
        {
          method: "POST",
          body: JSON.stringify({
            otp_id_token: localStorage.getItem("ID-TOKEN"),
            mobile_phone: JSON.parse(localStorage.getItem("USER")).phone,
            name: JSON.parse(localStorage.getItem("USER"))?.name,
            original_user_id: JSON.parse(localStorage.getItem("USER")).id,
          }),
        }
      );
      let repo: {
        data: {
          id: number;
          name: string;
          username: any;
          mobile_phone: string;
          photo_path: any;
          created_at: string;
          access_token: string;
          contact_user: any;
        };
      } = await response.json();
      localStorage.setItem("USER-CHAT", JSON.stringify(repo.data));

      if (repo.data?.id) {
        const { requestFirebaseNotificationPermission } = await import(
          "utils/firebaseInitv1"
        );
        typeof window !== "undefined" &&
          "serviceWorker" in navigator &&
          requestFirebaseNotificationPermission().then(
            (firebaseToken: string) => {
              localStorage.setItem("firebase_token", firebaseToken);
              if (repo.data) {
                try {
                  if (!firebaseToken) {
                  } else {
                    localStorage.setItem("firebase_token", firebaseToken);
                    this.StoreToken({
                      id: repo.data.id,
                      token: firebaseToken,
                      user: repo.data,
                    });
                  }

                  if (typeof window !== "undefined") {
                    _isStoreLastJson() &&
                      localStorage.setItem("LAST_JSON", JSON.stringify(repo));
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
      let response = await axios.post(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          "/api/v1/messages/share_product",
        JSON.stringify({
          receiver_ids: userId,
          content: [
            { ...product, product_image_width: 400, product_image_height: 400 },
          ],
        }),
        { ...ChatHeader() }
      );
      await this.getChats("share");
      toast.success(translate("Shared Successfully", language));
      callback();
    } catch (e) {
      toast.error(translate("Product Share error", language));
    }
  }
  async StoreToken(payload: {
    id?: string | number;
    user?: { access_token: string; id: number };
    token: string;
  }) {
    try {
      const { setFirebaseToken } = useAppStore.getState();
      const response = await fetch(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + "/api/v1/firebase_tokens",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer " +
              (JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token ||
                localStorage.getItem("DEVICE-TOKEN")),
          },
          body: JSON.stringify({
            token: payload.token,
          }),
        }
      );
      if (response.status === 200) {
        let repo = await response.json();

        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
        setFirebaseToken(payload.token);
        localStorage.setItem("firebase_id", repo.data.id);
      } else if (response.status === 401) {
        UnAuthintacetedAction();
        throw new Error();
      } else {
        throw new Error();
      }
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

      let resp = await AxiosPost({
        url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + GET_CHATS_URL,
        body: { role_id: 16 },
        token: JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
      });

      setChats(resp.channels, resp.pinned_channels);
      const { db } = await import("../utils/firebaseInitv1");
      let chats = [...resp.channels, ...resp.pinned_channels];
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
      if (payload !== "share") {
        getCalls(null);

        let response = await AxiosGet({
          url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + GET_CONTATCS_URL,
          title: "Get Contacts",
          token: JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
        });

        setContacts(response);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
export default new ChatService();
