import React from "react";
import { useAppStore } from "store";
import { getUser } from "../chatsFunctions";
import VideoCall from "../components/VideoCall";
import VoiceCall from "../components/VoiceCall";
import Spinner from "components/global/Spinner";

function CallContainer() {
  const { activeChat, call, AgoraToken } = useAppStore();
  const receiver = activeChat?.channel_members?.find(
    (m: any) => +m.user_id !== +getUser()?.id
  );
  const senderId = getUser()?.id;
  const receiverId = receiver?.user_id;
  return (
    <div className="fixed right-0 top-0 min-w-[330px] w-screen h-[calc(100vh)] pb-[100px] bg-black z-[9999999999999999]">
      {(!activeChat?.id || !call || !AgoraToken) && (
        <div className="flex items-center justify-center h-full w-full">
          <span>
            <Spinner />
          </span>
        </div>
      )}
      {activeChat?.id && call?.includes("vid") && AgoraToken && (
        <VideoCall
          audio={call.includes("outgoing")}
          token={AgoraToken}
          name={activeChat?.channel_name || activeChat?.mobile_phone}
          active={activeChat}
          user_id={receiverId}
        />
      )}

      {activeChat?.id && call?.includes("aud") && AgoraToken && (
        <VoiceCall
          audio={call.includes("outgoing")}
          token={AgoraToken}
          name={activeChat?.channel_name || activeChat?.mobile_phone}
          active={activeChat}
          user_id={receiverId}
        />
      )}
    </div>
  );
}

export default CallContainer;
