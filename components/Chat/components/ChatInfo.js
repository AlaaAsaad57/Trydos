import React, { useEffect, useRef, useState } from "react";
import ArrowIcon from "../svg/arrow";
import InfoCallIcon from "../svg/InfoCall";
import InfoVideoIcon from "../svg/InfoVideo";
import InfoSearchIcon from "../svg/InfoSearch";
import InfoGalleryIcon from "../svg/InfoGallery";
import ImageInfoIcon from "../svg/imageInfo";
import VideoInfoIcon from "../svg/VideoInfo";
import FileInfoIcon from "../svg/FileInfo";
import InfoArrowIcon from "../svg/arrowRight";
// import SaveToGalleryIcon from "../svg/SaveToGallery";
import DeleteInfoIcon from "../svg/deleteInfo";
import BlockInfoIcon from "../svg/BlockInfo";

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
import { translateFunction } from "utils/functions";
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
  const ref = useRef();
  const otherUserId = activeChat?.channel_members?.filter(
    (user) => String(user.user_id) !== String(getUser()?.id)
  )?.[0]?.user?.id;
  const handleCopyPhone = async (phoneNumber) => {
    try {
      if (typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(phoneNumber);
        showSuccessNotification(
          translateFunction("The number was copied successfully")
        );
      }
    } catch (error) {
      showErrorNotification("Number copy failed");
    }
  };
  const [showMedia, setMedia] = useState(false);

  useEffect(() => {
    ref.current.style.display = "flex";
    setTimeout(() => {
      ref.current.style.right = "0px";
    }, 300);

    return () => {};
  }, []);
  if (typeof document !== "undefined") {
    const slider = document?.querySelector(".slider-gallery");
    let isDown = false;
    let startX;
    let scrollLeft;

    slider?.addEventListener("mousedown", (e) => {
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    slider?.addEventListener("mouseleave", () => {
      isDown = false;
      slider.classList.remove("active");
    });
    slider?.addEventListener("mouseup", () => {
      isDown = false;
      slider.classList.remove("active");
    });
    slider?.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 3; //scroll-fast
      slider.scrollLeft = scrollLeft - walk;
    });
  }
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
      console.log(error);
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
      console.log(error);
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
        <ArrowIcon></ArrowIcon>
      </div>
      {!showMedia ? (
        <>
          <div className="chat-info-user-avatar">
            {activeChat?.channel_members?.filter(
              (user) => user.user_id !== getUser()?.id
            )[0]?.user?.photo_path ? (
              <ChatPhoto
                user={
                  activeChat?.channel_members.filter(
                    (user) => user.user_id !== getUser()?.id
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
                    (user) => user.user_id !== getUser()?.id
                  )[0]?.user.name ||
                    activeChat?.channel_members.filter(
                      (user) => user.user_id !== getUser()?.id
                    )[0]?.user.username
                )}
              </div>
            )}
          </div>
          <div className="chat-user-info w-full flex items-center">
            <div className="chat-info-user-name p-0">
              {activeChat?.channel_members.filter(
                (user) => user.user_id !== getUser()?.id
              )[0]?.user?.name ||
                activeChat?.channel_members.filter(
                  (user) => user.user_id !== getUser()?.id
                )[0]?.user?.username}
            </div>
            <div className="chaat-info-user-phone">
              <span
                className="cursor-pointer text-[#388cff]"
                onClick={() =>
                  handleCopyPhone(
                    activeChat?.channel_members.filter(
                      (user) => user.user_id !== getUser()?.id
                    )[0]?.user?.mobile_phone
                  )
                }
              >
                {
                  activeChat?.channel_members.filter(
                    (user) => user.user_id !== getUser()?.id
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
              <InfoCallIcon
                className={`${callLoading === "voice" && "loading-svg"}`}
              ></InfoCallIcon>{" "}
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
              <InfoVideoIcon
                className={`${callLoading === "video" && "loading-svg"}`}
              ></InfoVideoIcon>{" "}
              <span>{translateFunction("Video")}</span>
            </div>
            <div
              className="chat-user-info-option"
              style={{ marginLeft: "98px" }}
              onClick={() => enableSearch()}
            >
              <InfoSearchIcon></InfoSearchIcon>{" "}
              <span>{translateFunction("Search")}</span>
            </div>
          </div>
          <div className="chat-user-files-container">
            <div className="chat-user-files-icon">
              <InfoGalleryIcon></InfoGalleryIcon>
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
                  <ImageInfoIcon></ImageInfoIcon>{" "}
                  {activeChat?.message_counts ? (
                    activeChat?.message_counts?.image_messages_count
                  ) : (
                    <Spinner />
                  )}
                </div>
                <div className="chat-user-files-info-content-item">
                  <VideoInfoIcon></VideoInfoIcon>{" "}
                  {activeChat?.message_counts ? (
                    activeChat?.message_counts?.video_messages_count
                  ) : (
                    <Spinner />
                  )}
                </div>
                <div className="chat-user-files-info-content-item">
                  <FileInfoIcon></FileInfoIcon>{" "}
                  {activeChat?.message_counts ? (
                    activeChat?.message_counts?.file_messages_count
                  ) : (
                    <Spinner />
                  )}
                </div>
              </div>
              <div className="chat-user-info-arrow">
                <InfoArrowIcon></InfoArrowIcon>
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
                )
              )}
            </div>
          }
          <div className="chat-user-gallery-container">
            <div className="chat-user-info-arrow gallery-option">
              <span> {translateFunction("Never")}</span>{" "}
              <InfoArrowIcon></InfoArrowIcon>
            </div>
            <div className="chat-user-files-icon">
              <InfoGalleryIcon></InfoGalleryIcon>
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
              <DeleteInfoIcon /> <span>{translateFunction("Delete Chat")}</span>
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
                  <BlockInfoIcon />
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
