"use client";
import { useEffect } from "react";
const CallComponent = dynamic(
  () => import("components/Chat/components/CallComponent"),
  { ssr: false }
);
const Chat = dynamic(() => import("./index"), { ssr: false });

import { ChatConroller } from "store/chat/actions";

import { SSRDetect, getUserChat } from "utils/functions";
import ChatService from "services/chat";
import dynamic from "next/dynamic";
import { GetChats } from "store/chat/actions";
import { useAppStore } from "store";
function ChatModal() {
  const { isCallIncoming, callInProgress, chatVar } = useAppStore();
  useEffect(() => {
    if (chatVar) {
      GetChats(false);
    }
  }, []);
  return (
    <>
      {isCallIncoming && <CallComponent reply={() => ChatConroller(true)} />}
      {chatVar && SSRDetect() && (
        <Chat
          open={chatVar}
          close={async () => {
            const { requestFirebaseNotificationPermission } = await import(
              "utils/firebaseInitv1"
            );
            typeof window !== "undefined" &&
              "serviceWorker" in navigator &&
              requestFirebaseNotificationPermission().then((firebaseToken) => {
                try {
                  if (!firebaseToken) {
                    toast.error("Please Check Notifications Premissions");
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
            ChatConroller(false);
          }}
          callInProgress={callInProgress}
        />
      )}
    </>
  );
}

export default ChatModal;
