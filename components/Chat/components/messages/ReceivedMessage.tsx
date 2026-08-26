import RepliedMessageWrapper from "./RepliedMessage";

function ReceivedMessage({
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
      id={`main-container-${id}`}
      onMouseLeave={() => {
        closeMenu();
      }}
      style={{
        marginTop: !parent_message && `12px`,
      }}
      className={`message-container ${
        parent_message && "flex-wrap"
      } message-element ${!parent_message && "mt25"}   ${
        (message_type === "VideoCall" || message_type === "VoiceCall") &&
        " center-align"
      }
      }`}
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

export default ReceivedMessage;
