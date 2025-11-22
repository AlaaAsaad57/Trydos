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
function ChatInfo({
  activeChat,
  cancel,
  callLoading,
  makeAudioCall,
  makeVideoCall,
  enableSearch,
}) {
  const { deleteChat } = useAppStore();
  const ref = useRef();
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
          <div className="chat-user-info">
            <div className="chat-info-user-name">
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
              <span>Call</span>
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
              <span>Video</span>
            </div>
            <div
              className="chat-user-info-option"
              style={{ marginLeft: "98px" }}
              onClick={() => enableSearch()}
            >
              <InfoSearchIcon></InfoSearchIcon> <span>Search</span>
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
                Media & Files
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
              <span> Never</span> <InfoArrowIcon></InfoArrowIcon>
            </div>
            <div className="chat-user-files-icon">
              <InfoGalleryIcon></InfoGalleryIcon>
            </div>
            <div className="chat-user-files-info" style={{ height: "auto" }}>
              <div className=".chat-user-files-info-text text-[#8d8d8d]">
                Save To Gallery
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
              <DeleteInfoIcon /> <span>Delete Chat</span>
            </div>
            <div className="chat-user-option">
              <BlockInfoIcon />
              <span>Block</span>
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
