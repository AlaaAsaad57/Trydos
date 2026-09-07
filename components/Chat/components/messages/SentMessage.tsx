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

  const {
    datesRef,
    setContentRef,
    isOpen,
    close,
    swipeHandlers,
  } = useMessageSwipe({
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
        <div className="relative flex items-center justify-end max-w-full">
          <div
            ref={setContentRef}
            {...swipeHandlers}
            onClick={() => {
              if (isOpen) {
                close();
              }
            }}
            className="relative flex items-center justify-end max-w-full touch-pan-y select-none"
            style={{
              willChange: "transform",
            }}
          >
            {/* The dates container positioned strictly to the LEFT of the message bubble */}
            <div
              ref={datesRef}
              style={{
                position: "absolute",
                right: "100%",
                marginRight: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0,
                pointerEvents: "none",
                willChange: "opacity, transform",
              }}
            >
              <MessageHoverDates
                created_at={created_at || ""}
                message_status={message_status}
              />
            </div>
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default SentMessage;
