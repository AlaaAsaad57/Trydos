import { getUserChat } from "utils/functions";
import RepliedTextMessage from "./RepliedTextMessage";
import RepliedImageMessage from "./RepliedImageMessage";
import RepliedVideoMessage from "./RepliedVideoMessage";
import RepliedVoiceMessage from "./RepliedVoiceMessage";
import RepliedProductMessage from "./RepliedProductMessage";
import RepliedFileMessage from "./RepliedFileMessage";
const getMessageReplyType = ({ sender_user_id, parent_message_sender_id }) => {
  if (
    sender_user_id === parent_message_sender_id &&
    sender_user_id === getUserChat()?.id
  ) {
    return "me-to-me";
  } else if (
    (sender_user_id === parent_message_sender_id &&
      sender_user_id !== getUserChat()?.id) ||
    (sender_user_id !== parent_message_sender_id &&
      sender_user_id !== getUserChat()?.id &&
      parent_message_sender_id !== getUserChat()?.id)
  ) {
    return "him-to-him";
  } else if (
    sender_user_id !== parent_message_sender_id &&
    sender_user_id === getUserChat()?.id
  ) {
    return "me-to-him";
  } else if (
    sender_user_id !== parent_message_sender_id &&
    sender_user_id !== getUserChat()?.id &&
    parent_message_sender_id === getUserChat()?.id
  ) {
    return "him-to-me self-align";
  }
};
function RepliedMessageWrapper({
  parent_message,
  sender_user_id,
  isDeleted,
  channel_member,
  onClick,
}) {
  return (
    <div
      className={`${getMessageReplyType({
        parent_message_sender_id: parent_message?.sender_user_id,
        sender_user_id: sender_user_id,
      })} replied-message-container static min-w-full translate-y-[20px] `}
    >
      {parent_message?.message_type?.name === "TextMessage" && (
        <RepliedTextMessage
          content={parent_message?.message_content?.content}
          deleted_by_user_id={isDeleted}
          onClick={onClick}
          channel_member={channel_member?.user}
        />
      )}
      {parent_message?.message_type?.name === "ImageMessage" && (
        <RepliedImageMessage
          deleted_by_user_id={isDeleted}
          onClick={onClick}
          channel_member={channel_member?.user}
        />
      )}
      {parent_message?.message_type?.name === "VideoMessage" && (
        <RepliedVideoMessage
          deleted_by_user_id={isDeleted}
          onClick={onClick}
          channel_member={channel_member?.user}
        />
      )}
      {parent_message?.message_type?.name === "VoiceMessage" && (
        <RepliedVoiceMessage
          deleted_by_user_id={isDeleted}
          onClick={onClick}
          channel_member={channel_member?.user}
        />
      )}
      {parent_message?.message_type?.name === "ShareProduct" && (
        <RepliedProductMessage
          deleted_by_user_id={isDeleted}
          onClick={onClick}
          channel_member={channel_member?.user}
        />
      )}
      {parent_message?.message_type?.name === "FileMessage" && (
        <RepliedFileMessage
          channel_member={channel_member}
          deleted_by_user_id={isDeleted}
          onClick={onClick}
        />
      )}
    </div>
  );
}

export default RepliedMessageWrapper;
