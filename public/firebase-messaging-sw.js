// Force update - increment this version when you want to force update
const CACHE_VERSION = "v1.0.7";
const BASE_CLOUDINARY_URL =
  "https://res.cloudinary.com/dtcmozf4d/image/upload/v1";
// Get image url function
const GetImageUrl = (url) => {
  if (url?.file_path) {
    if (url?.file_path?.includes("cloudinary")) {
      return url?.file_path;
    } else {
      return BASE_CLOUDINARY_URL + url?.file_path;
    }
  }
  if (!url || typeof url !== "string") return url;
  if (url && url?.includes("http")) return url;
  return BASE_CLOUDINARY_URL + url;
};
// Skip waiting and claim clients immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
  // apiKey: "AIzaSyAl53TxLa2CoTBeXtg9K3Lr8G908ajb6kY",
  // authDomain: "trydos-ce234.firebaseapp.com",
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
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();
// Base origin for this service worker's scope (works per-branch/domain)
const BASE_ORIGIN = self.location.origin;

// Read the active locale ("<country>-<language>", e.g. "gb-en") from the
// non-HttpOnly cookies the client persists (see proxy.ts -> setLocaleCookies).
// Service workers have no `document`, so we use the Cookie Store API, which is
// only available on Chromium. On browsers without it (Firefox/Safari) we return
// "" and let proxy.ts inject the locale via a redirect on navigation — the App
// Router routes are all locale-scoped (`app/(client)/[lang]/...`), so a bare
// path like `/settings/orders/1` is redirected to `/gb-en/settings/orders/1`.
async function getLocalePrefix() {
  try {
    if (typeof self.cookieStore !== "undefined") {
      const [countryCookie, langCookie, languageCookie] = await Promise.all([
        self.cookieStore.get("country"),
        self.cookieStore.get("lang"),
        self.cookieStore.get("language"),
      ]);
      const country = countryCookie && countryCookie.value;
      const language =
        (langCookie && langCookie.value) ||
        (languageCookie && languageCookie.value);
      if (country && language) {
        return `/${country.toLowerCase()}-${language.toLowerCase()}`;
      }
    }
  } catch (e) {
    // Ignore — fall back to an unprefixed path and let proxy.ts redirect.
  }
  return "";
}

// Helper to build absolute URLs on this origin. `localePrefix` is the
// "/<country>-<language>" segment (may be "" when unknown — proxy.ts then adds
// it on navigation). For app routes pass the prefix so the click lands on the
// correct locale-scoped page without an extra redirect hop.
const buildUrl = (path, localePrefix = "") => {
  const prefix = localePrefix || "";
  if (!path || typeof path !== "string") return BASE_ORIGIN + prefix;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  if (path.startsWith("?")) return BASE_ORIGIN + prefix + path;
  if (path.startsWith("/")) return BASE_ORIGIN + prefix + path;
  return BASE_ORIGIN + prefix + "/" + path;
};

// Function to check if any client tabs are open
async function checkIfClientIsOpen() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  return clients.length > 0;
}

// Function to send notification to foreground clients
async function sendToForeground(payload) {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  if (clients.length > 0) {
    // Send to all open tabs
    clients.forEach((client) => {
      client.postMessage({
        type: "FCM_NOTIFICATION",
        payload: payload,
        timestamp: Date.now(),
      });
    });
    return true; // Notification sent to foreground
  }

  return false; // No open tabs, show background notification
}

messaging.onBackgroundMessage(async function (payload) {
  try {
    // Resolve the active locale once so every notification URL points at the
    // correct locale-scoped App Router route (e.g. /gb-en/settings/orders/1).
    const localePrefix = await getLocalePrefix();

    // Check if any tabs are open
    const sentToForeground = await sendToForeground(payload);

    // If no tabs are open, proceed with background notifications

    if (payload.data.title === "market") {
      if (JSON.parse(payload.data.body).type === "boutique created") {
        notificationOptions = {
          body: JSON.parse(payload?.data.body)?.description,
          icon: JSON.parse(payload?.data.body)?.boutique_icon?.file_path,
          image: JSON.parse(payload?.data.body)?.banner[0]?.file_path,
          data: {
            url: buildUrl(
              `filters/boutiques/${
                JSON.parse(payload?.data.body)?.boutique_slug
              }`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ?? "New Boutique",
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type === "category created") {
        notificationOptions = {
          body: JSON.parse(payload?.data.body)?.description,
          icon: JSON.parse(payload?.data.body)?.image,
          // image: JSON.parse(payload?.data.body)?.banner[0].file_path,
          data: {
            url: buildUrl(
              `filters/categories/${
                JSON.parse(payload?.data.body).category_slug
              }`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ?? "New Category",
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type === "product cart expiration") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          data: {
            url: buildUrl(`?cart=true`, localePrefix),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            "product cart expiration",
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type === "product availability") {
        notificationOptions = {
          body: JSON.parse(payload.data.body).description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type,
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type?.includes("product hurry up")) {
        notificationOptions = {
          body: JSON.parse(payload.data.body).description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(`?cart=true`, localePrefix),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type,
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type === "product discount") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type === "product comment") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type === "product before stock out") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions,
        );
      }
      if (
        JSON.parse(payload.data.body).type === "product when change in price"
      ) {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions,
        );
      }
      if (JSON.parse(payload.data.body).type === "order placed") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          // image: JSON.parse(payload.data.body)?.image,
          data: {
            url: buildUrl(`settings/orders`, localePrefix),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions,
        );
      }
      if (
        JSON.parse(payload.data.body).type?.startsWith("order status changed")
      ) {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          // image: JSON.parse(payload.data.body)?.image,
          data: {
            url: buildUrl(
              `settings/orders/${
                JSON.parse(payload.data.body).order_group_id
              }`,
              localePrefix,
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions,
        );
      }
    } else if (
      payload.data.type === "VoiceCallEvent" ||
      payload.data.type === "VideoCallEvent"
    ) {
      // Parse the nested JSON
      const parsed = JSON.parse(payload.data.data);
      const callInfo = parsed.payload.payload;
      const user = parsed.user;
      const photo = user.photo_path;
      const notificationTitle = `${user.name} is calling you… ${
        callInfo.type === "video" ? "🎥" : "📞"
      }`;
      const notificationOptions = {
        body: `Incoming ${
          callInfo.type === "audio" ? "voice" : "video"
        } call from ${user.name}`,
        image: GetImageUrl(photo) || "/profile.png",
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          { action: "reply", title: "Reply" },
          { action: "reject", title: "Reject" },
        ],
        data: {
          call_id: callInfo.channelId,
          receiverId: callInfo.user_id,
          callType: callInfo.type === "audio" ? "voice" : "video",
          url: BASE_ORIGIN,
        },
      };
      self.registration.showNotification(
        notificationTitle,
        notificationOptions,
      );
    } else if (payload.data.type === "message") {
      let notificationTitle = JSON.parse(payload.data.data).message.sender_user
        .name;
      let notificationOptions = {};
      // Derive a stable tag per chat/conversation so that notifications
      // for the same chat are updated instead of stacking as separate cards.
      let messageTag = null;
      try {
        const parsed = JSON.parse(payload.data.data);
        const message = parsed?.message || {};
        const senderUser = message.sender_user || {};
        const chatId =
          parsed.chat_id ||
          message.chat_id ||
          message.chat?.id ||
          message.channelId ||
          message.channel_id ||
          message.channel.id;
        const senderId = senderUser.id || message.sender_user_id;
        if (chatId) {
          messageTag = `chat-${chatId}`;
        } else if (senderId) {
          messageTag = `chat-from-${senderId}`;
        }
      } catch (e) {
        // If parsing fails, we simply skip tagging and fall back to
        // the original behavior (no grouping).
      }
      if (JSON.parse(payload.data.data)?.is_private) {
        const privateData = JSON.parse(payload.data.data);
        const orderGroupId = privateData?.order_group_id;
        const orderId = privateData?.parent_order_id ?? privateData?.order_id;
        const chatId = privateData?.order_id;
        notificationTitle = "Deleivery Worker";
        notificationOptions = {
          body: "there is new message from Deleivery Worker",
          data: {
            url: buildUrl(
              `settings/orders/${orderGroupId}?order_id=${orderId}&chat_id=${chatId}`,
              localePrefix,
            ),
            // Markers consumed by the notificationclick handler to reuse an
            // already-open tab on this order's page instead of opening a new one.
            reuseTab: true,
            order_group_id: orderGroupId,
            order_id: orderId,
            chat_id: chatId,
          },
        };
      } else if (
        JSON.parse(payload.data.data).message.message_type.name ===
        "VoiceMessage"
      ) {
        notificationOptions = {
          body: "Audio",
          icon: JSON.parse(payload.data.data).message?.icon,
          image: JSON.parse(payload.data.data).message?.image,
          data: {
            url: BASE_ORIGIN,
          },
        };
      } else if (
        JSON.parse(payload.data.data).message.message_type.name ===
        "VideoMessage"
      ) {
        notificationOptions = {
          body: "Video",
          icon: JSON.parse(payload.data.data).message.icon,
          image: JSON.parse(payload.data.data).message.image,
          data: {
            url: BASE_ORIGIN,
          },
        };
      } else if (payload.data.type === "vcard") {
        notificationOptions = {
          body: "vcard",
          icon: payload.data.icon,
          image: payload.data.image,
        };
      } else if (
        JSON.parse(payload.data.data).message.message_type.name ===
        "ImageMessage"
      ) {
        notificationOptions = {
          body: "Image",
          icon: JSON.parse(payload.data.data).message.icon,
          image: JSON.parse(payload.data.data).message.image,
          data: {
            url: BASE_ORIGIN,
          },
        };
      } else if (
        JSON.parse(payload.data.data).message.message_type.name ===
        "FileMessage"
      ) {
        notificationOptions = {
          body: "File",
          icon: JSON.parse(payload.data.data).message.icon,
          image: JSON.parse(payload.data.data).message.image,
          data: {
            url: BASE_ORIGIN,
          },
        };
      } else if (
        JSON.parse(payload.data.data).message.message_type.name ===
        "TextMessage"
      ) {
        notificationOptions = {
          body: JSON.parse(payload.data.data).message.message_content.content,
          icon: JSON.parse(payload.data.data).message.icon,
          image: JSON.parse(payload.data.data).message.image,
        };
      } else if (
        JSON.parse(payload.data.data).message.message_type.name ===
        "ShareProduct"
      ) {
        notificationOptions = {
          body: "Shared Product",
          icon: JSON.parse(payload.data.data).message?.icon,
          image: JSON.parse(payload.data.data).message.message_content.content
            .product_image_url,
          data: {
            url: BASE_ORIGIN,
          },
        };
      } else {
        notificationOptions = {
          body: "Missed Call",
          icon: JSON.parse(payload?.data.message)?.icon,
          image: JSON.parse(payload?.data.message)?.image,
          data: {
            url: BASE_ORIGIN,
          },
        };
      }
      if (notificationOptions.body) {
        if (messageTag) {
          const existingNotifications =
            await self.registration.getNotifications({ tag: messageTag });
          if (existingNotifications.length > 0) {
            const existingBody = existingNotifications[0].body || "";
            const countMatch = existingBody.match(/^(\d+) new messages?$/);
            const currentCount = countMatch ? parseInt(countMatch[1], 10) : 1;
            const newCount = currentCount + 1;
            self.registration.showNotification(notificationTitle, {
              ...notificationOptions,
              body: `${newCount} new messages`,
              tag: messageTag,
              renotify: true,
            });
          } else {
            self.registration.showNotification(notificationTitle, {
              ...notificationOptions,
              tag: messageTag,
              renotify: true,
            });
          }
        } else {
          self.registration.showNotification(
            notificationTitle,
            notificationOptions,
          );
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// Reuse an already-open tab that is on this order's detail page and ask it to
// open the delivery-worker chat in place (no reload). Falls back to opening a
// new tab when no matching tab exists.
async function focusOrOpenOrderTab(notificationData, targetUrl) {
  const baseUrl = self.location.origin;
  const groupId = notificationData.order_group_id;
  try {
    const windowClients = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    // matchAll returns window clients most-recently-focused first, so the first
    // match is the tab the user used most recently.
    const match = windowClients.find((client) => {
      if (!client.url.startsWith(baseUrl) || groupId == null) return false;
      try {
        const path = new URL(client.url).pathname;
        return path.endsWith(`/settings/orders/${groupId}`);
      } catch (e) {
        return false;
      }
    });
    if (match) {
      if ("focus" in match) {
        await match.focus();
      }
      match.postMessage({
        type: "OPEN_DELIVERY_CHAT",
        order_group_id: notificationData.order_group_id,
        order_id: notificationData.order_id,
        chat_id: notificationData.chat_id,
      });
      return;
    }
  } catch (e) {
    // Fall through to opening a new tab.
  }
  if (clients.openWindow) {
    await clients.openWindow(targetUrl);
  }
}

// Notification click handler - works for background notifications only
self.addEventListener("notificationclick", function (event) {
  const baseUrl = self.location.origin;
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || baseUrl;
  event.notification.close();
  // Only open the link by default if this is NOT a call notification
  if (!notificationData.callType) {
    if (notificationData.reuseTab) {
      // Delivery-worker chat: reuse an open order tab, else open a new one.
      event.waitUntil(focusOrOpenOrderTab(notificationData, targetUrl));
    } else {
      clients.openWindow(targetUrl); // Android needs explicit close.
    }
  }
  switch (event.action) {
    case "open_url":
      clients.openWindow(targetUrl); // Which we got from above
      break;
    case "any_other_action":
      event.waitUntil(
        clients.matchAll({ type: "window" }).then((windowClients) => {
          // Check if there is already a window/tab open with the target URL
          for (var i = 0; i < windowClients.length; i++) {
            var client = windowClients[i];
            // If so, just focus it.
            if (client.url.indexOf(baseUrl) !== -1 && "focus" in client) {
              return client.focus();
            }
          }
          // If not, then open the target URL in a new window/tab.
          if (clients.openWindow) {
            return clients.openWindow(baseUrl);
          }
        }),
      ); // Default URL (if any)
      break;
    case "reply":
      // Try to focus an existing tab with the URL, or open a new one if not found
      event.waitUntil(
        clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
              const client = windowClients[i];
              // Use startsWith to match the base URL and query params
              if (client.url === targetUrl && "focus" in client) {
                return client.focus();
              }
            }
            // If not found, open a new window
            if (clients.openWindow) {
              return clients.openWindow(targetUrl);
            }
          }),
      );
      event.notification.close();
      break;
    case "reject":
      // Only close the notification, do not open any window
      event.notification.close();
      break;
  }
});
