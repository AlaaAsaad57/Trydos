// Force update - increment this version when you want to force update
const CACHE_VERSION = "v2.0.0";
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
  console.log("Service worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
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

// Helper to build absolute URLs on this origin
const buildUrl = (path) => {
  if (!path) return BASE_ORIGIN;
  if (typeof path !== "string") return BASE_ORIGIN;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  if (path.startsWith("/")) return BASE_ORIGIN + path;
  if (path.startsWith("?")) return BASE_ORIGIN + "/" + path;
  return BASE_ORIGIN + "/" + path;
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
    console.log("📱 FCM payload received:", payload);

    // Check if any tabs are open
    const sentToForeground = await sendToForeground(payload);

    if (sentToForeground) {
      console.log(
        "✅ Notification sent to foreground, skipping background notification"
      );
    }

    // If no tabs are open, proceed with background notifications
    console.log("📋 No open tabs, showing background notification");

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
              }`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ?? "New Boutique",
          notificationOptions
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
              }`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ?? "New Category",
          notificationOptions
        );
      }
      if (JSON.parse(payload.data.body).type === "product cart expiration") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          data: {
            url: buildUrl(`?cart=true`),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            "product cart expiration",
          notificationOptions
        );
      }
      if (JSON.parse(payload.data.body).type === "product availability") {
        notificationOptions = {
          body: JSON.parse(payload.data.body).description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type,
          notificationOptions
        );
      }
      if (JSON.parse(payload.data.body).type?.includes("product hurry up")) {
        notificationOptions = {
          body: JSON.parse(payload.data.body).description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(`?cart=true`),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type,
          notificationOptions
        );
      }
      if (JSON.parse(payload.data.body).type === "product discount") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions
        );
      }
      if (JSON.parse(payload.data.body).type === "product comment") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions
        );
      }
      if (JSON.parse(payload.data.body).type === "product before stock out") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          image: JSON.parse(payload.data.body).image,
          data: {
            url: buildUrl(
              `products/${JSON.parse(payload.data.body).product_slug}`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions
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
              `products/${JSON.parse(payload.data.body).product_slug}`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions
        );
      }
      if (JSON.parse(payload.data.body).type === "order placed") {
        notificationOptions = {
          body: JSON.parse(payload.data.body)?.description,
          // image: JSON.parse(payload.data.body)?.image,
          data: {
            url: buildUrl(`setting?tab=Orders`),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions
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
              `setting?tab=Orders&id=${
                JSON.parse(payload.data.body).order_group_id
              }`
            ),
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          JSON.parse(payload?.data.body)?.showed_type ??
            JSON.parse(payload.data.body).description,
          notificationOptions
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
        notificationOptions
      );
    } else if (payload.data.type === "message") {
      const notificationTitle = JSON.parse(payload.data.data).message
        .sender_user.name;
      let notificationOptions = {};
      if (JSON.parse(payload.data.data)?.is_private) {
        notificationTitle = "Deleivery Worker";
        notificationOptions = {
          body: "there is new message from Deleivery Worker",
          data: {
            url: buildUrl(
              `setting?tab=Orders&id=${
                JSON.parse(payload?.data.data)?.order_group_id
              }&order_id_chat=${
                JSON.parse(payload?.data?.data).parent_order_id ??
                JSON.parse(payload?.data?.data).order_id
              }&chat_id=${JSON.parse(payload?.data?.data)?.order_id}`
            ),
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
      if (notificationOptions.body)
        self.registration.showNotification(
          notificationTitle,
          notificationOptions
        );
    }
  } catch (error) {
    console.error(error);
  }
});

// Notification click handler - works for background notifications only
self.addEventListener("notificationclick", function (event) {
  const baseUrl = self.location.origin;
  event.notification.close();
  // Only open the link by default if this is NOT a call notification
  if (!event.notification.data || !event.notification.data.callType) {
    clients.openWindow(event.notification.data.url); // Android needs explicit close.
  }
  switch (event.action) {
    case "open_url":
      clients.openWindow(event.notification.data.url); // Which we got from above
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
        })
      ); // Default URL (if any)
      break;
    case "reply":
      // Try to focus an existing tab with the URL, or open a new one if not found
      event.waitUntil(
        clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((windowClients) => {
            const targetUrl = event.notification.data.url;
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
          })
      );
      event.notification.close();
      break;
    case "reject":
      // Only close the notification, do not open any window
      event.notification.close();
      break;
  }
});
