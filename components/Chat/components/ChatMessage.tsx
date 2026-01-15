import React, { useEffect, useRef, useState } from "react";
import { getUserChat } from "utils/functions";
import { useAppStore } from "store";
import { Message, MessageContent, MessageFile } from "utils/types/chat";
import SentMessage from "./messages/SentMessage";
import ReceivedMessage from "./messages/ReceivedMessage";
import DeletedMessage from "./messages/DeletedMessage";
import TextMessage from "./messages/Types/TextMessage";
import ImageMessage from "./messages/Types/ImageMessage";
import VideoMessage from "./messages/Types/VideoMessage";
import AudioMessage from "./messages/Types/AudioMessage";
import FileMessage from "./messages/Types/FileMessage";
import ProductMessage from "./messages/Types/ProductMessage";
import CallMessage from "./messages/Types/CallMessage";
// Add a helper to sanitize IDs
const getSafeId = (id) => {
  if (!id) return "";
  let str = String(id);
  // Remove all non-alphanumeric characters and ensure it starts with a letter
  str = str.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!/^[a-zA-Z]/.test(str)) str = "m" + str;
  return str;
};

function ChatMessage({
  isPrivate,
  setVid,
  setImg,
  GetMessage,
  type,
  message_content,
  message_files,
  message_type,
  message_status,
  mid,
  id,
  created_at,
  auth_message_status,
  is_forward,
  sender_user_id,
  parent_message,
  parent_message_id,
  duration_in_seconds,
}: {
  isPrivate: boolean;
  setVid: (e: any) => void;
  setImg: (e: any) => void;
  GetMessage: (e: any, b: any) => void;
  type: any;
  message_content: MessageFile[] | MessageContent;
  message_files: any[];
  message_type: {
    name: string;
    event_name: string;
    created_at: string | null;
  };
  message_status: Message["message_status"];
  mid: string | number;
  id: number | string;
  created_at: string;
  auth_message_status: Message["auth_message_status"];
  is_forward: number;
  sender_user_id: number | string;
  parent_message: Message;
  parent_message_id: number | string;
  duration_in_seconds: number | null;
}) {
  const { activeChat } = useAppStore();
  let message = {
    message_content,
    message_files,
    message_type,
    message_status,
    mid,
    id,
    created_at,
    auth_message_status,
    is_forward,
    sender_user_id,
    parent_message,
    parent_message_id,
    duration_in_seconds,
  };

  const [opens, setOpen] = useState<any>(false);
  // const AudioRef = useRef<any>();
  const [playing, setPlay] = useState(false);
  const [DeleteModal, setDelete] = useState(false);
  // useEffect(() => {
  //   if (AudioRef.current && AudioRef.current.ended) {
  //     setPlay(false);
  //     AudioRef.current.currentTime = 0;
  //   }
  // }, [AudioRef]);
  const isSentByMe = sender_user_id === getUserChat()?.id;
  const isDeleted = auth_message_status?.is_deleted === 1;
  const Wrapper = isSentByMe ? SentMessage : ReceivedMessage;
  if (!activeChat) return null;
  return (
    <Wrapper
      channel_member={activeChat?.channel_members?.find(
        (member) => member.user_id === parent_message?.sender_user_id
      )}
      isDeleted={parent_message?.auth_message_status?.is_deleted === 1}
      onClick={() => {
        GetMessage(id, parent_message?.id);
      }}
      sender_message_id={sender_user_id}
      closeMenu={() => {
        setOpen(false);
      }}
      isLonely={true}
      id={id ?? mid}
      message_type={message_type}
      parent_message={parent_message}
    >
      {isDeleted ? (
        <DeletedMessage type={type} activeChat={activeChat} />
      ) : (
        <React.Fragment>
          {message_type?.name === "TextMessage" && (
            <TextMessage
              sender_user_id={sender_user_id}
              is_from_sender={isSentByMe}
              DeleteModal={DeleteModal}
              GetMessage={GetMessage}
              created_at={created_at}
              id={id}
              isPrivate={isPrivate}
              is_forward={is_forward}
              message_content={message_content}
              message_status={message_status}
              openMenu={opens === id}
              mid={mid}
              parent_message={parent_message}
              parent_message_id={parent_message_id}
              setDelete={setDelete}
              setOpen={setOpen}
              type={type}
              channel_id={activeChat?.id}
              channel_member={
                isSentByMe
                  ? activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  : activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
              }
            />
          )}
          {message_type?.name === "ImageMessage" && (
            <ImageMessage
              sender_user_id={sender_user_id}
              is_from_sender={isSentByMe}
              message_files={message_files}
              setImg={setImg}
              DeleteModal={DeleteModal}
              GetMessage={GetMessage}
              created_at={created_at}
              id={id}
              isPrivate={isPrivate}
              is_forward={is_forward}
              message_content={message_content}
              message_status={message_status}
              openMenu={opens === id}
              mid={mid}
              parent_message={parent_message}
              parent_message_id={parent_message_id}
              setDelete={setDelete}
              setOpen={setOpen}
              type={type}
              channel_id={activeChat?.id}
              channel_member={
                isSentByMe
                  ? activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  : activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
              }
            />
          )}
          {message_type?.name === "VideoMessage" && (
            <VideoMessage
              sender_user_id={sender_user_id}
              is_from_sender={isSentByMe}
              channel_id={activeChat.id}
              channel_member={
                isSentByMe
                  ? activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  : activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
              }
              message_files={message_files}
              setVid={setVid}
              DeleteModal={DeleteModal}
              GetMessage={GetMessage}
              created_at={created_at}
              id={id}
              isPrivate={isPrivate}
              is_forward={is_forward}
              message_content={message_content}
              message_status={message_status}
              openMenu={opens === id}
              mid={mid}
              parent_message={parent_message}
              parent_message_id={parent_message_id}
              setDelete={setDelete}
              setOpen={setOpen}
              type={type}
            />
          )}
          {message_type?.name === "VoiceMessage" && (
            <AudioMessage
              sender_user_id={sender_user_id}
              is_from_sender={isSentByMe}
              message_files={message_files}
              DeleteModal={DeleteModal}
              GetMessage={GetMessage}
              created_at={created_at}
              id={id}
              isPrivate={isPrivate}
              is_forward={is_forward}
              message_status={message_status}
              openMenu={opens === id}
              mid={mid}
              parent_message={parent_message}
              parent_message_id={parent_message_id}
              setDelete={setDelete}
              setOpen={setOpen}
              type={type}
              channel_id={activeChat?.id}
              channel_member={
                isSentByMe
                  ? activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  : activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
              }
            />
          )}
          {message_type?.name === "FileMessage" && (
            <FileMessage
              sender_user_id={sender_user_id}
              message_files={message_files}
              is_from_sender={isSentByMe}
              DeleteModal={DeleteModal}
              GetMessage={GetMessage}
              created_at={created_at}
              id={id}
              isPrivate={isPrivate}
              is_forward={is_forward}
              message_status={message_status}
              openMenu={opens === id}
              mid={mid}
              parent_message={parent_message}
              parent_message_id={parent_message_id}
              setDelete={setDelete}
              setOpen={setOpen}
              type={type}
              channel_id={activeChat?.id}
              channel_member={
                isSentByMe
                  ? activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  : activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
              }
            />
          )}
          {message_type?.name === "ShareProduct" && (
            <ProductMessage
              sender_user_id={sender_user_id}
              is_from_sender={isSentByMe}
              DeleteModal={DeleteModal}
              setImg={setImg}
              created_at={created_at}
              id={id}
              isPrivate={isPrivate}
              is_forward={is_forward}
              message_content={message_content}
              message_status={message_status}
              openMenu={opens === id}
              mid={mid}
              setDelete={setDelete}
              setOpen={setOpen}
              type={type}
              channel_id={activeChat?.id}
              channel_member={
                isSentByMe
                  ? activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  : activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
              }
            />
          )}
          {message_type?.name?.includes("Call") && (
            <CallMessage
              sender_user_id={sender_user_id}
              DeleteModal={DeleteModal}
              created_at={created_at}
              id={id}
              isPrivate={isPrivate}
              openMenu={opens === id}
              duration_in_seconds={duration_in_seconds}
              message_type={message_type}
              setDelete={setDelete}
              setOpen={setOpen}
              type={type}
              channel_id={activeChat?.id}
              channel_member={
                isSentByMe
                  ? activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  : activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
              }
            />
          )}
        </React.Fragment>
      )}
    </Wrapper>
  );
}

export default ChatMessage;
