import { getMessageStatusIcon, getUser } from "../chatsFunctions";

import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
function LastMessageBody({ message, status }) {
  const { language } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const getMessage = () => {
    if (message?.auth_message_status?.is_deleted === 1) {
      return (
        <>
          {message.sender_user_id === getUser()?.id &&
            getMessageStatusIcon(message.message_status, message.mid)}
          <p>{translate("this message was deleted", language)}</p>
        </>
      );
    }
    if (message.message_type.name === "TextMessage") {
      return (
        <>
          {message.sender_user_id === getUser()?.id &&
            getMessageStatusIcon(message.message_status, message.mid)}
          <p>{message.message_content && message.message_content.content}</p>
        </>
      );
    }
    if (message.message_type.name === "ImageMessage") {
      return (
        <>
          {message.sender_user_id === getUser()?.id &&
            getMessageStatusIcon(message.message_status, message.mid)}
          <img src="/icons/image.svg" className="message-type-icon" />{" "}
          {translate("Image", language)}
        </>
      );
    }
    if (message.message_type.name === "ShareProduct") {
      return (
        <>
          {message.sender_user_id === getUser()?.id &&
            getMessageStatusIcon(message.message_status, message.mid)}

          {translate("Product", language)}
        </>
      );
    }
    if (message.message_type.name === "VoiceMessage") {
      return (
        <>
          {message.sender_user_id === getUser()?.id &&
            getMessageStatusIcon(message.message_status, message.mid)}
          <img src="/icons/chat/audio.svg" className="message-type-icon" />{" "}
          {translate("Audio", language)}
        </>
      );
    }
    if (message.message_type.name === "VideoMessage") {
      return (
        <>
          {message.sender_user_id === getUser()?.id &&
            getMessageStatusIcon(message.message_status, message.mid)}
          <img src="/icons/chat/video.svg" className="message-type-icon" />{" "}
          {translate("Video", language)}
        </>
      );
    }
    if (message.message_type.name === "FileMessage") {
      return (
        <>
          {message.sender_user_id === getUser()?.id &&
            getMessageStatusIcon(message.message_status, message.mid)}
          {translate("File", language)}
        </>
      );
    }
    if (message.message_type.name === "VoiceCall") {
      return <>{translate("Voice Call", language)}</>;
    }
    if (message.message_type.name === "VideoCall") {
      return <>{translate("Video Call", language)}</>;
    }
  };
  return (
    <div
      className={`last-message-body ${
        message.message_type.name !== "TextMessage" && "inline-flex"
      }`}
      style={{ maxHeight: status ? "15px" : "40px" }}
    >
      {getMessage()}
    </div>
  );
}

export default LastMessageBody;
