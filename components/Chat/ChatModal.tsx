"use client";
import { useEffect } from "react";
const Chat = dynamic(() => import("./ChatWindowModal"), { ssr: false });

import { ChatConroller } from "utils/tinyUtils";

import { SSRDetect, getUserChat, translateFunction } from "utils/functions";
import ChatService from "services/chat";
import dynamic from "next/dynamic";
import { useAppStore } from "store";
import chat from "services/chat";
import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { showErrorNotification } from "@/store/notifications/reducer";
function ChatModal() {
  const { isCallIncoming, callInProgress, chatVar } = useAppStore();
  useEffect(() => {
    if (chatVar) {
      chat.getChats(false);
    }
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.CHAT_SCREEN,
        platform: GA_GLOBAL_PLATFORM.WEB,
        timestamp: new Date().toISOString(),
        screen_path: window.location.pathname,
      },
    });
  }, []);
  return (
    <>
      {chatVar && SSRDetect() && (
        <Chat
          open={chatVar}
          close={async () => {
            ChatConroller(false);
            const { requestFirebaseNotificationPermission } = await import(
              "utils/firebaseInitv1"
            );
            typeof window !== "undefined" &&
              "serviceWorker" in navigator &&
              requestFirebaseNotificationPermission().then((firebaseToken) => {
                try {
                  if (!firebaseToken) {
                    showErrorNotification(
                      translateFunction(
                        "Please Check Notifications Premissions"
                      )
                    );
                  } else {
                    localStorage.setItem("firebase_token", firebaseToken);

                    firebaseToken &&
                      getUserChat()?.id &&
                      ChatService.StoreToken({
                        id: getUserChat()?.id,
                        token: firebaseToken,
                        user: getUserChat(),
                      });
                  }
                } catch (e) {}
              });
          }}
          callInProgress={callInProgress}
        />
      )}
    </>
  );
}

export default ChatModal;
