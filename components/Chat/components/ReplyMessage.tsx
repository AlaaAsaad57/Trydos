import React from "react";
import { getConfiguredImage, translateFunction } from "utils/functions";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
function ReplyMessage({ message, cancel }) {
  const showContent = () => {
    if (message.message_type.name === "ShareProduct") {
      return (
        <>
          <Image
            src={getConfiguredImage({
              src: GetImageUrl(
                JSON.parse(message.message_content.content)[0]
                  ?.product_image_url
              ),
              width: 315,
              height: 521,
              q: 80,
            })}
            width={26}
            height={20}
            alt="Image"
          />
          {JSON.parse(message.message_content.content)[0]?.product_name}
        </>
      );
    }
    if (message.message_type.name === "TextMessage") {
      return <>{message.message_content.content}</>;
    }
    if (message.message_type.name === "ImageMessage") {
      return (
        <>
          <Image
            src={message?.message_files[0]?.file_path}
            width={26}
            height={20}
            alt="Image"
          />
          {translateFunction("Image")}
        </>
      );
    }
    if (message.message_type.name === "VideoMessage") {
      return (
        <>
          <img
            src="/icons/chat/video.svg"
            className="message-type-icon w-[10px] h-[10px]"
          />
          {translateFunction("Video")}
        </>
      );
    }
    if (message.message_type.name === "VoiceMessage") {
      return (
        <>
          <img
            src="/icons/chat/audio.svg"
            className="message-type-icon w-[10px] h-[10px]"
          />
          {translateFunction("Audio")}
        </>
      );
    }
    if (message.message_type.name === "FileMessage") {
      return (
        <>
          <Image
            alt="file"
            width={26}
            height={20}
            src={"/icons/chat/output.png"}
            style={{ width: "15px", height: "18px", borderRadius: "0px" }}
          />{" "}
          {translateFunction("File")}
        </>
      );
    }
  };
  return (
    <div className="reply-message-container">
      <div className="reply-icon">
        <img src="/icons/chat/rep.svg" />
      </div>
      <div
        className="cancel-reply-icon"
        onClick={() => cancel()}
        style={{ marginLeft: "15px", cursor: "pointer" }}
      >
        <img src="/icons/chat/cancel.svg" />
      </div>
      <div
        className={`${
          message.message_type.name !== "TextMessage" && "inline-flex"
        } reply-content`}
      >
        {showContent()}
      </div>
      <div className="reply-message-user-avatar"></div>
    </div>
  );
}

export default ReplyMessage;
