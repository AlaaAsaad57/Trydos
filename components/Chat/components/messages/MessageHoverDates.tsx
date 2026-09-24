import React from "react";
import { getUserChat } from "utils/functions";
import { getMessageTime } from "store/chat/chatUtils";
import { MessageStatus } from "utils/types/chat";

interface MessageHoverDatesProps {
  created_at: string;
  message_status?: MessageStatus[];
}

export const MessageHoverDates: React.FC<MessageHoverDatesProps> = ({
  created_at,
  message_status,
}) => {
  const user = getUserChat();
  const otherStatus = Array.isArray(message_status)
    ? message_status.find((a) => String(a.user_id) !== String(user?.id))
    : undefined;

  return (
    <div className="sent-message-hover-dates">
      {created_at && (
        <div className="hover-date-row" title="Sent">
          <span className="hover-date-time">{getMessageTime(created_at, true)}</span>
          <div className="hover-date-icon">
            <img src="/icons/chat/sent.svg" alt="sent" className="w-[10px] h-[10px]" />
          </div>
        </div>
      )}

      {otherStatus?.is_received === 1 && otherStatus?.received_at && (
        <div className="hover-date-row" title="Delivered">
          <span className="hover-date-time">{getMessageTime(otherStatus.received_at, false)}</span>
          <div className="hover-date-icon">
            <img src="/icons/chat/recieved.svg" alt="delivered" className="w-[10px] h-[10px]" />
          </div>
        </div>
      )}

      {otherStatus?.is_watched && otherStatus?.watched_at && (
        <div className="hover-date-row" title="Read">
          <span className="hover-date-time">{getMessageTime(otherStatus.watched_at, false)}</span>
          <div className="hover-date-icon">
            <img src="/icons/chat/read.svg" alt="read" className="w-[10px] h-[10px]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageHoverDates;
