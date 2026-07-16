import React, { useEffect, useRef, useState } from "react";
import { getTwoLetters, getUser } from "../chatsFunctions";
import Image from "next/image";
import Spinner from "components/global/Spinner";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";

import MediaContainer from "./MediaContainer";
import { useAppStore } from "store";
import ChatPhoto from "./ChatPhoto";
import { LogError, translateFunction } from "utils/functions";
import { deleteChat as DeleteChatAction } from "store/chat/actions";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
function ChatInfo({
  activeChat,
  cancel,
  callLoading,
  makeAudioCall,
  makeVideoCall,
  enableSearch,
}) {
  const { deleteChat, language, updateChannelBlockStatus } = useAppStore();
  const ref = useRef<any>(null);
  const otherUserId = activeChat?.channel_members?.filter(
    (user) => String(user.user_id) !== String(getUser()?.id),
  )?.[0]?.user?.id;
  const handleCopyPhone = async (phoneNumber) => {
    try {
      if (typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(phoneNumber);
        showSuccessNotification(
          translateFunction("The number was copied successfully"),
        );
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "handleCopyPhone in chat info - chat widget",
      });
      showErrorNotification(translateFunction("Number copy failed"));
    }
  };
  const [showMedia, setMedia] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.style.display = "flex";
    setTimeout(() => {
      ref.current.style.right = "0px";
    }, 300);

    return () => {};
  }, []);

  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (
      activeChat?.channel_members?.find((s) => s.user_id !== getUser()?.id)
        ?.is_blocked === 1
    ) {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
    }
  }, []);
  const updateBlockedState = (blocked) => {
    if (!activeChat?.id || !otherUserId) return;

    updateChannelBlockStatus({
      channelId: activeChat.id,
      userId: otherUserId,
      isBlocked: blocked,
    });
  };
  const BlockUser = async () => {
    try {
      if (!otherUserId) return;
      setLoading(true);
      const response = await fetchData({
        url: `/api/v1/users/block/${otherUserId}`,
        server: "chat",
        method: "POST",
        reqTitle: REQUESTS_DATA.BLOCK_USER,
        body: "",
      });
      if (response?.success === false) {
        throw new Error(response?.message || "Block request failed");
      }
      setIsBlocked(true);
      updateBlockedState(true);
    } catch (error) {
      LogError({
        error: error,
        scenario: "BlockUser in chat info - chat widget",
      });
    } finally {
      setLoading(false);
    }
  };
  const UnBlockUser = async () => {
    try {
      if (!otherUserId) return;
      setLoading(true);
      const response = await fetchData({
        url: `/api/v1/users/unblock/${otherUserId}`,
        server: "chat",
        method: "POST",
        reqTitle: REQUESTS_DATA.UNBLOCK_USER,
        body: "",
      });
      if (response?.success === false) {
        throw new Error(response?.message || "Unblock request failed");
      }
      setIsBlocked(false);
      updateBlockedState(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "UnBlock in chat info - chat widget",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div ref={ref} className="chat-user-info-container">
      <div
        onClick={() => {
          ref.current.style.right = "-430px";
          setTimeout(() => {
            cancel();
            setMedia(false);
          }, 300);
        }}
        className="arrow-icon"
      >
        <img src="/icons/chat/arrow.svg" />
      </div>
      {!showMedia ? (
        <>
          <div className="chat-info-user-avatar">
            {activeChat?.channel_members?.filter(
              (user) => user.user_id !== getUser()?.id,
            )[0]?.user?.photo_path ? (
              <ChatPhoto
                user={
                  activeChat?.channel_members.filter(
                    (user) => user.user_id !== getUser()?.id,
                  )[0]?.user
                }
                className="w-full h-full"
                height={150}
                width={150}
              />
            ) : (
              <div className="text-avatar">
                {getTwoLetters(
                  activeChat?.channel_members.filter(
                    (user) => user.user_id !== getUser()?.id,
                  )[0]?.user.name ||
                    activeChat?.channel_members.filter(
                      (user) => user.user_id !== getUser()?.id,
                    )[0]?.user.username,
                )}
              </div>
            )}
          </div>
          <div className="chat-user-info w-full flex items-center">
            <div className="chat-info-user-name p-0">
              {activeChat?.channel_members.filter(
                (user) => user.user_id !== getUser()?.id,
              )[0]?.user?.name ||
                activeChat?.channel_members.filter(
                  (user) => user.user_id !== getUser()?.id,
                )[0]?.user?.username}
            </div>
            <div className="chaat-info-user-phone">
              <span
                className="cursor-pointer text-[#388cff]"
                onClick={() =>
                  handleCopyPhone(
                    activeChat?.channel_members.filter(
                      (user) => user.user_id !== getUser()?.id,
                    )[0]?.user?.mobile_phone,
                  )
                }
              >
                {
                  activeChat?.channel_members.filter(
                    (user) => user.user_id !== getUser()?.id,
                  )[0]?.user?.mobile_phone
                }
              </span>
            </div>
          </div>
          <div className="chat-user-info-options">
            <div
              className="chat-user-info-option"
              onClick={() => {
                makeAudioCall();
                cancel();
              }}
            >
              <img
                src="/icons/chat/InfoCall.svg"
                className={`${
                  callLoading === "voice" && " opacity-40 scale-75"
                }`}
              />{" "}
              <span>{translateFunction("Call")}</span>
            </div>
            <div
              className="chat-user-info-option"
              onClick={() => {
                makeVideoCall();
                cancel();
              }}
              style={{ marginLeft: "106px" }}
            >
              <img
                src="/icons/chat/videocall.svg"
                className={`${
                  callLoading === "video" && " opacity-40 scale-75"
                }`}
              />{" "}
              <span>{translateFunction("Video")}</span>
            </div>
            <div
              className="chat-user-info-option"
              style={{ marginLeft: "98px" }}
              onClick={() => enableSearch()}
            >
              <img src="/icons/chat/InfoSearch.svg" />{" "}
              <span>{translateFunction("Search")}</span>
            </div>
          </div>
          <div className="chat-user-files-container">
            <div className="chat-user-files-icon">
              <img src="/icons/chat/InfoGallery.svg" />
            </div>
            <div
              className="chat-user-files-info"
              onClick={() => setMedia(true)}
            >
              <div className=".chat-user-files-info-text text-[#8d8d8d]">
                {translateFunction("Media & Files")}
              </div>
              <div className="chat-user-files-info-content">
                <div className="chat-user-files-info-content-item">
                  <img src="/icons/chat/imageInfo.svg" />{" "}
                  {activeChat?.message_counts ? (
                    activeChat?.message_counts?.image_messages_count
                  ) : (
                    <Spinner />
                  )}
                </div>
                <div className="chat-user-files-info-content-item">
                  <img src="/icons/chat/VideoInfo.svg" />{" "}
                  {activeChat?.message_counts ? (
                    activeChat?.message_counts?.video_messages_count
                  ) : (
                    <Spinner />
                  )}
                </div>
                <div className="chat-user-files-info-content-item">
                  <img src="/icons/chat/FileInfo.svg" />{" "}
                  {activeChat?.message_counts ? (
                    activeChat?.message_counts?.file_messages_count
                  ) : (
                    <Spinner />
                  )}
                </div>
              </div>
              <div className="chat-user-info-arrow">
                <img
                  src="/icons/chat/arrowRight.svg"
                  className="w-[3px] h-[13px]"
                />
              </div>
            </div>
          </div>
          {
            <div className="slider-gallery">
              {activeChat?.message_counts?.image_messages?.map(
                (image, index) => (
                  <div className="slider-gallery-item" key={index}>
                    <Image
                      className="max-h-[140px]"
                      width={100}
                      src={image.message_files[0]?.file_path}
                      height={130}
                      objectFit="cover"
                      objectPosition="center"
                      alt="Image"
                    />
                  </div>
                ),
              )}
            </div>
          }
          <div className="chat-user-gallery-container">
            <div className="chat-user-info-arrow gallery-option">
              <span> {translateFunction("Never")}</span>{" "}
              <img
                src="/icons/chat/arrowRight.svg"
                className="w-[3px] h-[13px]"
              />
            </div>
            <div className="chat-user-files-icon">
              <img src="/icons/chat/InfoGallery.svg" />
            </div>
            <div className="chat-user-files-info" style={{ height: "auto" }}>
              <div className=".chat-user-files-info-text text-[#8d8d8d]">
                {translateFunction("Save To Gallery")}
              </div>
            </div>
          </div>
          <div className="chat-user-options">
            <div
              className="chat-user-option delete-option"
              onClick={() => {
                DeleteChatAction(activeChat?.id);
                deleteChat({ id: activeChat?.id });
                cancel();
              }}
            >
              <img src="/icons/chat/deleteInfo.svg" />{" "}
              <span>{translateFunction("Delete Chat")}</span>
            </div>
            <div
              className="chat-user-option"
              onClick={() => {
                if (loading) return;
                if (isBlocked) UnBlockUser();
                else BlockUser();
              }}
            >
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <img src="/icons/chat/BlockInfo.svg" />
                  <span>
                    {isBlocked
                      ? translateFunction("UnBlock")
                      : translateFunction("Block")}
                  </span>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <MediaContainer
          mediaFiles={activeChat?.message_counts}
          id={activeChat?.id}
        />
      )}
    </div>
  );
}

export default ChatInfo;
