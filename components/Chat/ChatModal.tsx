"use client";
import { useEffect } from "react";
import { ChatConroller } from "utils/tinyUtils";
import { SSRDetect } from "utils/functions";

import dynamic from "next/dynamic";
import { useAppStore } from "store";
import chat from "services/chat";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import LandingPage from "components/Home/LandingPage";

const Chat = dynamic(() => import("./ChatWindowModal"), {
  ssr: false,
  loading: () => <LandingPage afterLoad={true} />,
});

function ChatModal() {
  const { callInProgress, chatVar } = useAppStore();
  useEffect(() => {
    if (chatVar) {
      chat.getChats(false);
      chat.getContacts();
      chat.getCalls();
    }
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.CHAT_SCREEN,
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
          }}
          callInProgress={callInProgress}
        />
      )}
    </>
  );
}

export default ChatModal;
