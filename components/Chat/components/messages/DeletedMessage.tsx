import React from "react";
import { getUserChat, translateFunction } from "utils/functions";
import ChatPhoto from "../ChatPhoto";
import { IsTextAvatar } from "store/chat/chatUtils";

function DeletedMessage({ type, activeChat }) {
  return (
    <div className={"message-hold deleted-message"}>
      <div
        style={{ backgroundColor: "#cecece" }}
        className={"message-element-body message-body text-body " + type}
      >
        <div className="border-element"></div>
        {(type === "first-chat" || type === "lonely") && (
          <div
            className={
              "absolute-avatar " + `${IsTextAvatar() && "text-avatar"}`
            }
          >
            <ChatPhoto
              user={
                activeChat.channel_members.filter(
                  (user) => String(user.user_id) === String(getUserChat()?.id)
                )[0]?.user
              }
              width={30}
              className="abs-avva"
              height={30}
            />
          </div>
        )}
        {translateFunction("this message was deleted")}
      </div>
    </div>
  );
}

export default DeletedMessage;
