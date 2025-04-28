import { LOG_IN_CHAT } from "utils/endpointConfig";
import HomeService from "services/home";
import Cookies from "js-cookie";
import { useAppStore } from "store";
import {
  _isStoreLastJson,
  getLang,
  translateFunction as translate,
} from "utils/functions";
import axios from "axios";
import { GetChats } from "store/chat/actions";
import { toast } from "react-toastify";
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
      localStorage.setItem("CHAT-TOKEN", repo.data.access_token);
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
      await GetChats("share");
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

    let repo = await response.json();

    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(repo));
    }
    setFirebaseToken(payload.token);
    localStorage.setItem("firebase_id", repo.data.id);
  }
}
export default new ChatService();
