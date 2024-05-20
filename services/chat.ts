import axios from "axios";
import { CHAT_URL, LOG_IN_CHAT } from "utils/endpointConfig";
import HomeService from "services/home";
import Cookies from "js-cookie";
import { store } from "store";
import { _isStoreLastJson, getLang } from "utils/functions";
class ChatService {
  http = axios.create({
    baseURL: CHAT_URL,
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
  });
  async loginChat() {
    try {
      const response = await this.http.post(LOG_IN_CHAT, {
        otp_id_token: localStorage.getItem("ID-TOKEN"),
        mobile_phone: JSON.parse(localStorage.getItem("USER")).phone,
        name: JSON.parse(localStorage.getItem("USER"))?.name,
        original_user_id: JSON.parse(localStorage.getItem("USER")).id,
      });
      localStorage.setItem("USER-CHAT", JSON.stringify(response.data.data));
      localStorage.setItem("CHAT-TOKEN", response.data.data.access_token);
      if (response.data.data?.id) {
        const { requestFirebaseNotificationPermission } = await import(
          "utils/firebaseInitv1"
        );
        typeof window !== "undefined" &&
          "serviceWorker" in navigator &&
          requestFirebaseNotificationPermission().then(
            (firebaseToken: string) => {
              localStorage.setItem("firebase_token", firebaseToken);
              if (response.data.data) {
                try {
                  if (!firebaseToken) {
                  } else {
                    localStorage.setItem("firebase_token", firebaseToken);
                    this.StoreToken({
                      id: response.data.data.id,
                      token: firebaseToken,
                      user: response.data.data,
                    });
                  }

                  if (typeof window !== "undefined") {
                    _isStoreLastJson() &&
                      localStorage.setItem(
                        "LAST_JSON",
                        JSON.stringify(response)
                      );
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
  async StoreToken(payload: {
    id: string | number;
    user: { access_token: string; id: number };
    token: string;
  }) {
    const response = await this.http.post(
      "/api/v1/firebase_tokens",
      JSON.stringify({
        token: payload.token,
      }),
      {
        headers: {
          Authorization:
            "Bearer " +
            JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
        },
      }
    );

    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(response));
    }
    store.dispatch({ type: "STORE_TOKEN_RED", payload: payload.token });
    localStorage.setItem("firebase_id", response.data.data.id);
  }
}
export default new ChatService();
