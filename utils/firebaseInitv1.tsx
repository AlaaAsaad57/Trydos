import { useAppStore } from "../store";

import { foregroundNotificationHandler } from "./NotificationHandler";
import { getUserChat, LogError } from "./functions";
import auth from "services/auth";
import { REQUESTS_DATA } from "./Requests";
import { fetchData } from "./fetchData";
import ChatService from "services/chat";

const firebaseConfig = {
  apiKey: "AIzaSyC3YInmCP8IqflkPjnpB9X4QCOQTa2bD64",
  authDomain: "trydos-2e2b2.firebaseapp.com",
  projectId: "trydos-2e2b2",
  storageBucket: "trydos-2e2b2.firebasestorage.app",
  messagingSenderId: "817506223106",
  appId: "1:817506223106:web:e9e39c9a34ac2aff82131b",
  databaseURL:
    "https://trydos-2e2b2-default-rtdb.europe-west1.firebasedatabase.app/",
};

// Lazy-initialized Firebase instances — loaded only on first access
let _firebaseApp: any = null;
let _db: any = null;
let _messaging: any = null;

export const getFirebaseApp = async () => {
  if (!_firebaseApp) {
    const { initializeApp } = await import("firebase/app");
    _firebaseApp = initializeApp(firebaseConfig);
  }
  return _firebaseApp;
};

export const getDb = async () => {
  if (!_db) {
    const app = await getFirebaseApp();
    const { getDatabase } = await import("firebase/database");
    _db = getDatabase(app);
  }
  return _db;
};

export const getFirebaseMessaging = async () => {
  if (_messaging) return _messaging;
  if (typeof window === "undefined" || !("serviceWorker" in navigator))
    return null;
  const app = await getFirebaseApp();
  const { getMessaging } = await import("firebase/messaging");
  _messaging = getMessaging(app);
  return _messaging;
};

// Backward-compatible lazy proxy for `db` (used by static imports)
// Falls back to null until getDb() is called
export { _db as db };

export const requestFirebaseNotificationPermission = async () => {
  const { isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) {
    return;
  }
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;
  const { deleteToken, getToken } = await import("firebase/messaging");
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

    await deleteToken(messaging); // Delete old token
  }
  let fcm_token = await getToken(messaging, {
    serviceWorkerRegistration: await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    ),
  })
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
      LogError({
        scenario:
          "Error in getToken in requestFirebaseNotificationPermission in  firebaseInit",
        error: err instanceof Error ? err.message : String(err),
      });
      setNotificationPermission(false);
      LogError(err);
      localStorage.setItem("FCMError", null);
      throw err;
    });
  if (fcm_token) {
    registerFcmToken(fcm_token);
  }
  return fcm_token;
};

const registerFcmToken = async (fcmToken: string) => {
  if (auth.UserID()) {
    try {
      const response = await fetchData({
        url: "/firebase_device_tokens",
        body: JSON.stringify({
          device_token: fcmToken,
          user_id: auth.UserID(),
          auth_token: "some_random_token_for_now",
        }),
        reqTitle: REQUESTS_DATA.REGISTER_FIREBASE_TOKEN,
        method: "POST",
        server: "market",
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      localStorage.setItem("FBID", response.data.id);
    } catch (err) {
      LogError({
        scenario:
          "Error in requestFirebaseNotificationPermission 2nd Block in firebaseInit",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const chatUser = getUserChat();
  if (chatUser?.id) {
    await ChatService.StoreToken({
      id: chatUser.id,
      token: fcmToken,
    });
  }
};

export const onMessageListener = async () => {
  const { isSupported, onMessage } = await import("firebase/messaging");
  if (!(await isSupported())) {
    return;
  }
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;
  // Removed react-toastify import - using new notification system
  return new Promise((resolve) => {
    onMessage(messaging, async (payload) => {
      foregroundNotificationHandler.handleNotification(resolve, payload);
    });
  });
};
