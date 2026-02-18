import { GET_CONTATCS_URL, LOG_IN_CHAT } from "utils/endpointConfig";
import HomeService from "services/home";
import { useAppStore } from "store";
import {
  _isStoreLastJson,
  getUserChat,
  translateFunction as translate,
} from "utils/functions";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { REQUESTS_DATA } from "utils/Requests";
import home from "services/home";
import UPDATED_API_DATA from "migration.staging";
import { LogServerError } from "utils/serverErrorReporter";

class ChatService {
  async loginChat() {
    try {
      const { loginSuccessChat, userProfile } = useAppStore.getState();
      const user = userProfile;
      const response = await fetchData({
        url: LOG_IN_CHAT,
        body: JSON.stringify({
          otp_id_token: localStorage.getItem("ID-TOKEN"),
          mobile_phone: user?.phone,
          name: user?.name,
          original_user_id: user?.id,
        }),
        method: "POST",
        server: "chat",
        reqTitle: REQUESTS_DATA.LOGIN_CHAT,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      // Update HttpOnly cookie via server route
      fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ name: COOKIE_NAMES.USER_CHAT, value: response.data }],
        }),
        credentials: "include",
      });
      loginSuccessChat({
        ...response.data,
      });
      if (response.data?.id) {
        HomeService.CheckLogin();
      } else {
        throw new Error();
      }
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In loginChat in services/chat",
      });
    }
  }
  async ShareProduct({ userId, product, callback }) {
    const { language } = useAppStore.getState();
    try {
      let res = await fetchData({
        url: "/api/v1/messages/share_product",
        body: JSON.stringify({
          receiver_ids: userId,
          content: [
            { ...product, product_image_width: 400, product_image_height: 400 },
          ],
        }),
        method: "POST",
        server: "chat",
        reqTitle: REQUESTS_DATA.SHARE_PRODUCT,
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      await this.getChats("share");
      showSuccessNotification(
        translate("Product is Shared Successfully", language),
      );
      callback();
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In ShareProduct in services/chat",
      });
      showErrorNotification(translate("Product Share error", language));
      throw new Error(e);
    }
  }
  async StoreToken(payload: {
    id?: string | number;

    token: string;
  }) {
    try {
      const { setFirebaseToken } = useAppStore.getState();
      const response = await fetchData({
        url: "/api/v1/firebase_tokens",
        method: "POST",
        server: "chat",
        reqTitle: REQUESTS_DATA.STORE_TOKEN,
        body: JSON.stringify({
          token: payload.token,
        }),
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setFirebaseToken(payload.token);
      localStorage.setItem("firebase_id", response.data.id);
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In StoreToken in services/chat",
      });
    }
  }
  async getChats(payload, limit = 10, messages_limit = 10, timestamp = null) {
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
      let body: any = {};
      body = { limit, messages_limit, role_id: 16 };
      let params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("messages_limit", messages_limit.toString());
      if (timestamp) {
        params.set("timestamp", timestamp);
        body = { ...body, timestamp };
      }
      let response = await fetchData({
        url: UPDATED_API_DATA.MOD_CHAT_URL + `?${params.toString()}`,
        body: JSON.stringify(body),
        reqTitle: REQUESTS_DATA.GET_CHATS,
        method: "POST",
        server: "chat",
      });

      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }

      setChats(response.data.channels, response.data.pinned_channels);
      const { getDb } = await import("../utils/firebaseInitv1");
      const db = await getDb();
      let chats = [...response.data.channels, ...response.data.pinned_channels];
      const userChat = await getUserChat();
      chats.map((chat) => {
        let friendID = chat.channel_members.filter(
          (member) =>
            parseInt(member.user_id) !== parseInt(userChat.id?.toString()),
        )[0]?.user_id;
        let MyId = userChat.id;
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
      return [...response.data.channels, ...response.data.pinned_channels];
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In getChats in services/chat",
      });
    }
  }
  async getContacts() {
    const { setContacts } = useAppStore.getState();
    try {
      let response = await fetchData({
        url: GET_CONTATCS_URL,
        reqTitle: REQUESTS_DATA.GET_CONTACTS,
        server: "chat",
        method: UPDATED_API_DATA.MOD_CONTACTS_METHOD as any,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setContacts(response.data);
    } catch (err) {
      LogServerError({
        error: err,
        scenario: "Error In getContacts in services/chat",
      });
    }
  }
  async getCalls(id?: number) {
    const { setCallLoading, setCalls } = useAppStore.getState();
    try {
      setCallLoading(true);
      let response = await fetchData({
        url: "/api/v1/channels/my_calls",
        body: JSON.stringify({ limit: "20", last_message_id: id }),
        method: "POST",
        reqTitle: REQUESTS_DATA.GET_CALLS,
        server: "chat",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setCalls(response.data);
      setCallLoading(false);
    } catch (err) {
      LogServerError({
        error: err,
        scenario: "Error In getCalls in services/chat",
      });
      setCallLoading(false);
    }
  }
}
export default new ChatService();
