import React from "react";
const CallComponent = dynamic(
  () => import("components/Chat/components/CallComponent"),
  { ssr: false }
);
const Chat = dynamic(() => import("./index"), { ssr: false });
import { useDispatch, useSelector } from "react-redux";
import { ChatConroller } from "store/chat/actions";

import { SSRDetect, getUserChat } from "utils/functions";
import { StoreToken } from "store/auth/actions";
import dynamic from "next/dynamic";
function ChatModal() {
  const isCallIncoming = useSelector((state) => state.chat.isCallIncoming);
  const callInProgress = useSelector((state) => state.chat.callInProgress);
  const chatVar = useSelector((state) => state.chat.chatVar);
  const dispatch = useDispatch();
  return (
    <>
      {isCallIncoming && (
        <CallComponent reply={() => dispatch(ChatConroller(true))} />
      )}
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
                    dispatch({ type: "enableNotifications" });
                    toast.error("Please Check Notifications Premissions");
                  } else {
                    localStorage.setItem("firebase_token", firebaseToken);

                    firebaseToken &&
                      getUserChat()?.id &&
                      StoreToken({
                        id: getUserChat()?.id,
                        token: firebaseToken,
                        user: getUserChat(),
                      });
                  }
                } catch (e) {}
              });
            dispatch(ChatConroller(false));
          }}
          callInProgress={callInProgress}
        />
      )}
    </>
  );
}

export default ChatModal;
