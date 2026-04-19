import React from "react";
import RepliedMessageWrapper from "./RepliedMessage";

function SentMessage({
  id,
  parent_message,
  message_type,
  children,
  isLonely,
  closeMenu,
  channel_member,
  isDeleted,
  onClick,
  sender_message_id,
}) {
  return (
    <div
      onMouseLeave={() => {
        closeMenu();
      }}
      id={`main-container-${id}`}
      style={{
        marginTop: !parent_message && `12px`,
      }}
      className={`message-container ${
        parent_message && "flex-wrap"
      } message-element self-align    ${
        (message_type === "VideoCall" || message_type === "VoiceCall") &&
        " center-align"
      }
      `}
    >
      {parent_message && (
        <RepliedMessageWrapper
          channel_member={channel_member}
          isDeleted={isDeleted}
          onClick={onClick}
          parent_message={parent_message}
          sender_user_id={sender_message_id}
        />
      )}
      {children}
    </div>
  );
}

export default SentMessage;
