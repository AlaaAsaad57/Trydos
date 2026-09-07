import React from "react";
import { getUserChat } from "utils/functions";
import { getMessageTime } from "store/chat/chatUtils";
import { MessageStatus } from "utils/types/chat";

interface MessageHoverDatesProps {
  created_at: string;
  message_status?: MessageStatus[];
  isVisible: boolean;
}

export const MessageHoverDates: React.FC<MessageHoverDatesProps> = ({
  created_at,
  message_status,
  isVisible,
}) => {
  const user = getUserChat();
  const otherStatus = Array.isArray(message_status)
    ? message_status.find((a) => String(a.user_id) !== String(user?.id))
    : undefined;

  return (
    <div
      className={`message-date hovers ${isVisible ? "visible" : ""}`}
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 0.2s ease-in-out",
      }}
      aria-hidden={!isVisible}
    >
      {created_at && (
        <div className="sent-date" title="Sent">
          <img src="/icons/chat/sent.svg" alt="sent" />
          <span>{getMessageTime(created_at, true)}</span>
        </div>
      )}

      {otherStatus?.is_received === 1 && otherStatus?.received_at && (
        <div className="recieve-date" title="Delivered">
          <img src="/icons/chat/recieved.svg" alt="received" />
          <span>{getMessageTime(otherStatus.received_at, false)}</span>
        </div>
      )}

      {otherStatus?.is_watched && otherStatus?.watched_at && (
        <div className="recieve-date read-date" title="Read">
          <img
            src="/icons/chat/read.svg"
            className="w-[10px] h-[10px]"
            alt="read"
          />
          <span>{getMessageTime(otherStatus.watched_at, false)}</span>
        </div>
      )}
    </div>
  );
};

export default MessageHoverDates;
