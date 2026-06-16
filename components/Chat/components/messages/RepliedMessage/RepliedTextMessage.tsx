import React from "react";
import { useAppStore } from "store";
import { getUserChat, translateFunction } from "utils/functions";
import ChatPhoto from "../../ChatPhoto";

function RepliedTextMessage({
  deleted_by_user_id,
  onClick,
  channel_member,
  content,
}) {
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
      <div className={"message-body text-message text-body " + "first-chat"}>
        {
          <div
            className={
              "absolute-avatar " + `${showTextAvatar && "text-avatar"}`
            }
          >
            <ChatPhoto
              user={channel_member}
              width={20}
              fontSize={12}
              height={20}
              className=""
            />
          </div>
        }
        {deleted_by_user_id ? (
          <span className="message-body-text-content">
            {translateFunction("this message was deleted")}
          </span>
        ) : (
          <span className="message-body-text-content">{content}</span>
        )}
      </div>
    </div>
  );
}

export default RepliedTextMessage;
