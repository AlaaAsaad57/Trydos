import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  deleteToken,
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import { useAppStore } from "../store";

import { foregroundNotificationHandler } from "./NotificationHandler";
import { getUserChat, LogError } from "./functions";
import auth from "services/auth";
import { REQUESTS_DATA } from "./Requests";
import { fetchData } from "./fetchData";
import ChatService from "services/chat";
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
  // measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  databaseURL:
    "https://trydos-2e2b2-default-rtdb.europe-west1.firebasedatabase.app/",
};
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);
export const messaging =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  getMessaging(firebaseApp);

export const requestFirebaseNotificationPermission = async () => {
  if (!isSupported()) {
    return;
  }
  const { setNotificationPermission } = useAppStore.getState();
  const tokenExpiry = localStorage.getItem("FBTokenExpiry");
  const tokenDate = tokenExpiry ? new Date(tokenExpiry) : null;
  const nowDate = new Date();
  let should_register_fcm = true;

  // Check if tokenDate exists and is older than 1 day
  if (
    !tokenDate ||
    nowDate.getTime() - tokenDate.getTime() > 24 * 60 * 60 * 1000
  ) {
    should_register_fcm = true;
    console.log("FCM token is older than 1 day. Refreshing...");
    await deleteToken(messaging); // Delete old token
  }
  let fcm_token = await getToken(messaging)
    .then((currentToken) => {
      if (currentToken) {
        setNotificationPermission(true);
        localStorage.setItem("FBTokenExpiry", nowDate.toISOString());
        localStorage.setItem("FB-DEVICE-TOKEN", currentToken);
        return currentToken;
      } else {
      }
    })
    .catch((err) => {
      setNotificationPermission(false);
      LogError(err);
      localStorage.setItem("FCMError", null);
      throw err;
    });
  if (fcm_token) {
    if (auth.UserToken() && auth.UserID()) {
      try {
        const response = await fetchData({
          url: "/firebase_device_tokens",
          body: JSON.stringify({
            device_token: fcm_token,
            user_id: auth.UserID(),
            auth_token: auth.UserToken(),
          }),
          reqTitle: REQUESTS_DATA.REGISTER_FIREBASE_TOKEN,
          method: "POST",
          server: "market",
        });
        if (!response.success) {
          throw new Error(response.message);
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Store chat token if chat user exists
    if (getUserChat()?.id) {
      await ChatService.StoreToken({
        id: getUserChat()?.id,
        token: fcm_token,
        user: getUserChat(),
      });
    }
  }
  return fcm_token;
};

export const onMessageListener = async () => {
  if (!isSupported()) {
    return;
  }
  // Removed react-toastify import - using new notification system
  return new Promise((resolve) => {
    onMessage(messaging, async (payload) => {
      foregroundNotificationHandler.handleNotification(resolve, payload);
    });
  });
};
