import React from "react";
import { useAppStore } from "store";
import { getUserChat } from "utils/functions";
import ChatPhoto from "../../ChatPhoto";

function RepliedVideoMessage({ deleted_by_user_id, onClick, channel_member }) {
  const user = getUserChat();
  const { activeChat } = useAppStore();
  const showTextAvatar = React.useMemo(() => {
    if (!activeChat) return false;
    const member = activeChat.channel_members.find(
      (a) => parseInt(a.user_id.toString()) === parseInt(user?.id)
    );
    return (
      (!member?.user?.photo_path || member?.user?.photo_path?.includes("eu")) &&
      !!member?.user?.name
    );
  }, [activeChat, user]);
  return (
    <div
      className={"message-hold"}
      onClick={() => {
        if (!deleted_by_user_id) onClick();
      }}
    >
      <div className={"message-body text-body " + "first-chat"}>
        <div
          className={"absolute-avatar " + `${showTextAvatar && "text-avatar"}`}
        >
          <ChatPhoto
            user={channel_member}
            width={20}
            fontSize={12}
            height={20}
            className=""
          />
        </div>
        <img
          src="/icons/chat/video.svg"
          className="message-type-icon w-[10px] h-[10px]"
        />{" "}
        Video
      </div>
    </div>
  );
}
export default RepliedVideoMessage;
