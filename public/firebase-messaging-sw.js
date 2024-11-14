importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyAl53TxLa2CoTBeXtg9K3Lr8G908ajb6kY",
  authDomain: "trydos-ce234.firebaseapp.com",
  projectId: "trydos-ce234",
  storageBucket: "trydos-ce234.appspot.com",
  messagingSenderId: "912302743695",
  appId: "1:912302743695:web:17d05f7385b792bf4110fa",
  measurementId: "G-N8LNVEWJSJ",
};
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();
// let url = `${'http://localhost:3006'}`;
let url = "https://trydos-front.vercel.app/";

messaging.onBackgroundMessage(async function (payload) {
  try {
    if (payload.data.title === "market") {
      if (JSON.parse(payload.data.body).type === "boutique created") {
        notificationOptions = {
          body: "New Boutique",
          icon: JSON.parse(payload?.data.body)?.boutique_icon.file_path,
          image: JSON.parse(payload?.data.body)?.banner[0].file_path,
          data: {
            url:
              url + `boutiques/${JSON.parse(payload?.data.body).boutique_slug}`,
          }, // The URL which we are going to use later
        };
        self.registration.showNotification("New Boutique", notificationOptions);
      }
      if (JSON.parse(payload.data.body).type === "product cart expiration") {
        notificationOptions = {
          body: `${
            JSON.parse(payload.data.body)?.product_name
          } has turned to Old Cart`,

          data: {
            url: url + `?cart=true`,
          }, // The URL which we are going to use later
        };
        self.registration.showNotification(
          "product cart expiration",
          notificationOptions
        );
      }
    } else if (payload.data.message) {
      const notificationTitle = JSON.parse(payload.data.message).sender_user
        .name;
      let notificationOptions = {};
      if (
        JSON.parse(payload.data.message).message_type.name === "VoiceMessage"
      ) {
        notificationOptions = {
          body: "Audio",
          icon: JSON.parse(payload.data.message).icon,
          image: JSON.parse(payload.data.message).image,
        };
      } else if (
        JSON.parse(payload.data.message).message_type.name === "VideoMessage"
      ) {
        notificationOptions = {
          body: "Video",
          icon: JSON.parse(payload.data.message).icon,
          image: JSON.parse(payload.data.message).image,
        };
      } else if (payload.data.type === "vcard") {
        notificationOptions = {
          body: "vcard",
          icon: payload.data.icon,
          image: payload.data.image,
        };
      } else if (
        JSON.parse(payload.data.message).message_type.name === "ImageMessage"
      ) {
        notificationOptions = {
          body: "Image",
          icon: JSON.parse(payload.data.message).icon,
          image: JSON.parse(payload.data.message).image,
        };
      } else if (
        JSON.parse(payload.data.message).message_type.name === "FileMessage"
      ) {
        notificationOptions = {
          body: "File",
          icon: JSON.parse(payload?.data.message).icon,
          image: JSON.parse(payload?.data.message).image,
        };
      } else if (
        JSON.parse(payload.data.message).message_type.name === "TextMessage"
      ) {
        notificationOptions = {
          body: JSON.parse(payload.data.message).body,
          icon: JSON.parse(payload?.data.message).icon,
          image: JSON.parse(payload?.data.message).image,
        };
      } else if (
        JSON.parse(payload.data.message).message_type.name === "ShareProduct"
      ) {
        notificationOptions = {
          body: "Shared Product",
          icon: JSON.parse(payload?.data.message)?.icon,
          image: JSON.parse(payload?.data.message).message_content.content
            .product_image_url,
        };
      } else {
        notificationOptions = {
          body: "Missed Call",
          icon: JSON.parse(payload?.data.message)?.icon,
          image: JSON.parse(payload?.data.message)?.image,
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

async function checkClientIsVisible() {
  return true;
}
self.addEventListener("notificationclick", function (event) {
  let url = `${"https://trydos-front.vercel.app/"}`;
  event.notification.close();
  clients.openWindow(event.notification.data.url); // Android needs explicit close.
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
            if (client.url.contains(url) && "focus" in client) {
              return client.focus();
            }
          }
          // If not, then open the target URL in a new window/tab.
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
      ); // Default URL (if any)
      break;
  }
});
