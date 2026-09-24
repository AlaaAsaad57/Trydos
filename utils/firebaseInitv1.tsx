import { useAppStore } from "../store";

import { foregroundNotificationHandler } from "./NotificationHandler";
import { getUserChat, LogError } from "./functions";
import auth from "services/auth";
import { REQUESTS_DATA } from "./Requests";
import { fetchData } from "./fetchData";
import ChatService from "services/chat";
import { getSubscribedTopics } from "./fcmTopicTracker";

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

// Guard: network recovery listener is registered at most once per page load
let _networkHandlerSetup = false;

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

const waitForServiceWorkerActivation = (
  registration: ServiceWorkerRegistration,
  timeoutMs = 8000,
) => {
  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    if (registration.active) {
      resolve(registration);
      return;
    }

    const worker = registration.installing || registration.waiting;
    if (!worker) {
      reject(new Error("Service worker registration has no worker instance"));
      return;
    }

    const timeout = setTimeout(() => {
      worker.removeEventListener("statechange", onStateChange);
      reject(new Error("Timed out waiting for service worker activation"));
    }, timeoutMs);

    const onStateChange = () => {
      if (worker.state === "activated" && registration.active) {
        clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        resolve(registration);
      }
    };

    worker.addEventListener("statechange", onStateChange);
  });
};

const getActiveServiceWorkerRegistration = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Service worker is not supported in this environment");
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );

  if (registration.active) return registration;

  const readyRegistration = await navigator.serviceWorker.ready;
  if (readyRegistration.active) return readyRegistration;

  return waitForServiceWorkerActivation(registration);
};

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

    // Best-effort. When Google has already dropped this registration — e.g. a
    // logout whose local cleanup was cut short by the reload, leaving Firebase's
    // IndexedDB record behind — the DELETE answers 404 and throws. Letting that
    // propagate would abort the whole permission flow and surface
    // "Notification Is Not Enabled" on every retry, so swallow and continue to
    // `getToken` below.
    try {
      await deleteToken(messaging); // Delete old token
    } catch (err) {
      LogError({
        scenario: "deleteToken in requestFirebaseNotificationPermission",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  const serviceWorkerRegistration = await getActiveServiceWorkerRegistration();

  let fcm_token = await getToken(messaging, {
    serviceWorkerRegistration,
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
      localStorage.removeItem("FCMError");
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

// Re-subscribes all tracked topics with an explicit token.
// Called when the FCM token rotates after network recovery.
const resubscribeAllTopics = async (token: string): Promise<void> => {
  const topics = Array.from(getSubscribedTopics());
  if (topics.length === 0) return;

  await Promise.allSettled(
    topics.map((topic) =>
      fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, topic }),
      }).catch(() => {}),
    ),
  );
};

/**
 * Registers a one-time `online` event listener that forces an FCM token
 * refresh whenever the browser regains network connectivity.
 *
 * If the token has rotated while offline (e.g. WiFi → 4G switch), the new
 * token is immediately registered with the backend and all tracked topics are
 * re-subscribed so seller shop notifications keep working.
 *
 * Safe to call multiple times — only one listener is ever registered.
 */
export const setupNetworkRecoveryHandler = (): void => {
  if (_networkHandlerSetup || typeof window === "undefined") return;
  _networkHandlerSetup = true;

  window.addEventListener("online", async () => {
    console.log("Network connectivity restored — checking FCM token");
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;

    try {
      const { isSupported, getToken } = await import("firebase/messaging");
      if (!(await isSupported())) return;

      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const serviceWorkerRegistration =
        await getActiveServiceWorkerRegistration();

      const newToken = await getToken(messaging, {
        serviceWorkerRegistration,
      });
      if (!newToken) return;

      const oldToken = localStorage.getItem("FB-DEVICE-TOKEN");
      const tokenChanged = oldToken !== newToken;

      localStorage.setItem("FB-DEVICE-TOKEN", newToken);
      localStorage.setItem("FBTokenExpiry", new Date().toISOString());
      useAppStore.getState().setNotificationPermission(true);

      // Always re-register: backend may have expired or cleaned the record
      await registerFcmToken(newToken);

      // When the token rotated, FCM topic subscriptions on the old token are
      // gone — re-subscribe all topics the user was actively listening to.
      if (tokenChanged) {
        await resubscribeAllTopics(newToken);
      }
    } catch (err) {
      LogError({
        scenario: "Error in network recovery FCM refresh",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
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
