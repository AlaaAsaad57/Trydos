import React from "react";
import RepliedMessageWrapper from "./RepliedMessage";
import MessageHoverDates from "./MessageHoverDates";
import { useMessageSwipe } from "./useMessageSwipe";
import { MessageStatus } from "utils/types/chat";

interface SentMessageProps {
  id: string | number;
  parent_message?: any;
  message_type?: any;
  children: React.ReactNode;
  isLonely?: boolean;
  closeMenu: () => void;
  channel_member?: any;
  isDeleted?: boolean;
  onClick?: () => void;
  sender_message_id?: string | number;
  created_at?: string;
  message_status?: MessageStatus[];
}

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
  created_at,
  message_status,
}: SentMessageProps) {
  const isCall =
    message_type === "VideoCall" ||
    message_type === "VoiceCall" ||
    message_type?.name === "VideoCall" ||
    message_type?.name === "VoiceCall";

  const isSwipeable = !isDeleted && !isCall;

  const { offset, isOpen, isDragging, close, swipeHandlers } = useMessageSwipe({
    id,
    enabled: isSwipeable,
  });

  return (
    <div
      onMouseLeave={() => {
        closeMenu();
        if (isSwipeable) {
          close();
        }
      }}
      id={`main-container-${id}`}
      style={{
        marginTop: !parent_message ? "12px" : undefined,
      }}
      className={`message-container ${
        parent_message ? "flex-wrap" : ""
      } message-element self-align ${isCall ? " center-align" : ""}`}
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
      {isSwipeable ? (
        <div className="relative flex items-center justify-end overflow-visible max-w-full">
          <div
            {...swipeHandlers}
            onClick={() => {
              if (isOpen) {
                close();
              }
            }}
            style={{
              transform: `translateX(${offset}px)`,
              transition: isDragging
                ? "none"
                : "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
              willChange: "transform",
            }}
            className="flex items-center justify-end max-w-full select-none"
          >
            {children}
          </div>
          <MessageHoverDates
            created_at={created_at || ""}
            message_status={message_status}
            isVisible={isOpen || offset < -15}
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default SentMessage;
