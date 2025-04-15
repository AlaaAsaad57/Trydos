import React from "react";
import { getTwoLetters } from "../chatsFunctions";
import { useSelector } from "react-redux";
import ImageIcon from "../svg/image.svg";
import VideoIcon from "../svg/video.svg";
import AudioIcon from "../svg/audio.svg";
import profile from "public/images/profileNo.png";

import out from "../svg/output.png";
import Image from "next/image";
import { getUserChat } from "utils/functions";
function RepliedMessage({
  moving,
  message,
  parent_message,
  message_ref,
  onClick,
}) {
  const activeChat = useSelector((state) => state.chat.activeChat);
  const sameSource = () => {
    if (message.sender_user_id === parent_message.sender_user_id) {
      return true;
    } else return false;
  };
  const getMessageReplyType = () => {
    if (
      message.sender_user_id === parent_message.sender_user_id &&
      message.sender_user_id === getUserChat()?.id
    ) {
      return "me-to-me";
    } else if (
      (message.sender_user_id === parent_message.sender_user_id &&
        message.sender_user_id !== getUserChat()?.id) ||
      (message.sender_user_id !== parent_message.sender_user_id &&
        message.sender_user_id !== getUserChat()?.id &&
        parent_message.sender_user_id !== getUserChat()?.id)
    ) {
      return "him-to-him";
    } else if (
      message.sender_user_id !== parent_message.sender_user_id &&
      message.sender_user_id === getUserChat()?.id
    ) {
      return "me-to-him";
    } else if (
      message.sender_user_id !== parent_message.sender_user_id &&
      message.sender_user_id !== getUserChat()?.id &&
      parent_message.sender_user_id === getUserChat()?.id
    ) {
      return "him-to-me self-align";
    }
  };

  const showMessage = () => {
    if (
      parseInt(parent_message.sender_user_id) === parseInt(getUserChat()?.id)
    ) {
      if (parent_message.message_type.name === "ImageMessage") {
        return (
          <div className={"message-hold"} onClick={() => onClick()}>
            <div
              ref={message_ref}
              className={"message-body message-img-body first-chat"}
            >
              {sameSource() && <div className="bordse"></div>}
              {
                <div
                  className={
                    "absolute-avatar " +
                    `${
                      (!activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.photo_path ||
                        activeChat.channel_members
                          .filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]
                          ?.user?.photo_path?.includes("eu")) &&
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.name &&
                      "text-avatar"
                    }`
                  }
                >
                  {activeChat.channel_members
                    .filter((user) => user.user_id === getUserChat()?.id)[0]
                    ?.user?.photo_path?.includes("eu") ? (
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
                    )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        src={profile}
                        width={30}
                        height={30}
                      />
                    )
                  ) : activeChat.channel_members.filter(
                      (user) => user.user_id === getUserChat()?.id
                    )[0]?.user?.name?.length > 1 ? (
                    <>
                      {getTwoLetters(
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]?.user?.name ||
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.user_name
                      )}
                    </>
                  ) : (
                    <Image
                      alt="user-img"
                      unoptimized
                      className="abs-avva"
                      src={
                        (activeChat &&
                          activeChat.channel_members &&
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.photo_path) ||
                        profile
                      }
                    />
                  )}
                </div>
              }
              <ImageIcon className="message-type-icon"></ImageIcon> Image
            </div>
          </div>
        );
      } else if (parent_message.message_type.name === "VideoMessage") {
        return (
          <>
            <div className={"message-hold"} onClick={() => onClick()}>
              <div
                ref={message_ref}
                className={"message-body message-img-body first-chat"}
              >
                {sameSource() && <div className="bordse"></div>}
                {
                  <div
                    className={
                      "absolute-avatar " +
                      `${
                        (!activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]?.user?.photo_path ||
                          activeChat.channel_members
                            .filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]
                            ?.user?.photo_path?.includes("eu")) &&
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]?.user?.name &&
                        "text-avatar"
                      }`
                    }
                  >
                    {activeChat.channel_members
                      .filter((user) => user.user_id === getUserChat()?.id)[0]
                      ?.user?.photo_path?.includes("eu") ? (
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.name?.length > 1 ? (
                        <>
                          {getTwoLetters(
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.name ||
                              activeChat.channel_members.filter(
                                (a) =>
                                  parseInt(a.user_id) ===
                                  parseInt(getUserChat()?.id)
                              )[0]?.user?.user_name
                          )}
                        </>
                      ) : (
                        <Image
                          alt="user-img"
                          src={profile}
                          width={30}
                          height={30}
                        />
                      )
                    ) : activeChat.channel_members.filter(
                        (user) => user.user_id === getUserChat()?.id
                      )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        className="abs-avva"
                        unoptimized
                        src={
                          (activeChat &&
                            activeChat.channel_members &&
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.photo_path) ||
                          profile
                        }
                      />
                    )}
                  </div>
                }
                <VideoIcon className="message-type-icon"></VideoIcon> Video
              </div>
            </div>
          </>
        );
      }
      if (parent_message.message_type.name === "VoiceMessage") {
        return (
          <div className={"message-hold"} onClick={() => onClick()}>
            <div
              ref={message_ref}
              className={"message-body audio-body " + "first-chat"}
            >
              {
                <div
                  className={
                    "absolute-avatar " +
                    `${
                      (!activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.photo_path ||
                        activeChat.channel_members
                          .filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]
                          ?.user?.photo_path?.includes("eu")) &&
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.name &&
                      "text-avatar"
                    }`
                  }
                >
                  {activeChat.channel_members
                    .filter((user) => user.user_id === getUserChat()?.id)[0]
                    ?.user?.photo_path?.includes("eu") ? (
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
                    )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        src={profile}
                        width={30}
                        height={30}
                      />
                    )
                  ) : activeChat.channel_members.filter(
                      (user) => user.user_id === getUserChat()?.id
                    )[0]?.user?.name?.length > 1 ? (
                    <>
                      {getTwoLetters(
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]?.user?.name ||
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.user_name
                      )}
                    </>
                  ) : (
                    <Image
                      alt="user-img"
                      className="abs-avva"
                      unoptimized
                      src={
                        (activeChat &&
                          activeChat.channel_members &&
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.photo_path) ||
                        profile
                      }
                    />
                  )}
                </div>
              }
              <AudioIcon className="message-type-icon"></AudioIcon> Audio
            </div>
          </div>
        );
      }
      if (parent_message.message_type.name === "TextMessage") {
        return (
          <div className={"message-hold"} onClick={() => onClick()}>
            <div
              ref={message_ref}
              className={"message-body text-message text-body " + "first-chat"}
            >
              {
                <div
                  className={
                    "absolute-avatar " +
                    `${
                      (!activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.photo_path ||
                        activeChat.channel_members
                          .filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]
                          ?.user?.photo_path?.includes("eu")) &&
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.name &&
                      "text-avatar"
                    }`
                  }
                >
                  {activeChat.channel_members
                    .filter((user) => user.user_id === getUserChat()?.id)[0]
                    ?.user?.photo_path?.includes("eu") ? (
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
                    )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        src={profile}
                        width={30}
                        height={30}
                      />
                    )
                  ) : activeChat.channel_members.filter(
                      (user) => user.user_id === getUserChat()?.id
                    )[0]?.user?.name?.length > 1 ? (
                    <>
                      {getTwoLetters(
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]?.user?.name ||
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.user_name
                      )}
                    </>
                  ) : (
                    <Image
                      alt="user-img"
                      className="abs-avva"
                      unoptimized
                      src={
                        (activeChat &&
                          activeChat.channel_members &&
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.photo_path) ||
                        profile
                      }
                    />
                  )}
                </div>
              }
              <span className="message-body-text-content">
                {parent_message.message_content &&
                  parent_message.message_content?.content}
              </span>
            </div>
          </div>
        );
      }
      if (parent_message.message_type.name === "FileMessage") {
        return (
          <>
            <div className={"message-hold"} onClick={() => onClick()}>
              <div
                ref={message_ref}
                className={"message-body message-img-body first-chat"}
              >
                {sameSource() && <div className="bordse"></div>}
                {
                  <div
                    className={
                      "absolute-avatar " +
                      `${
                        (!activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]?.user?.photo_path ||
                          activeChat.channel_members
                            .filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]
                            ?.user?.photo_path?.includes("eu")) &&
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]?.user?.name &&
                        "text-avatar"
                      }`
                    }
                  >
                    {activeChat.channel_members
                      .filter((user) => user.user_id === getUserChat()?.id)[0]
                      ?.user?.photo_path?.includes("eu") ? (
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) === parseInt(getUserChat()?.id)
                      )[0]?.user?.name?.length > 1 ? (
                        <>
                          {getTwoLetters(
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.name ||
                              activeChat.channel_members.filter(
                                (a) =>
                                  parseInt(a.user_id) ===
                                  parseInt(getUserChat()?.id)
                              )[0]?.user?.user_name
                          )}
                        </>
                      ) : (
                        <Image
                          alt="user-img"
                          src={profile}
                          width={30}
                          height={30}
                        />
                      )
                    ) : activeChat.channel_members.filter(
                        (user) => user.user_id === getUserChat()?.id
                      )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        unoptimized
                        className="abs-avva"
                        src={
                          (activeChat &&
                            activeChat.channel_members &&
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.photo_path) ||
                          profile
                        }
                      />
                    )}
                  </div>
                }
                <Image
                  alt="user-img"
                  className="message-type-icon"
                  height={20}
                  width={26}
                  src={out.src}
                />
                File
              </div>
            </div>
          </>
        );
      }
    } else {
      if (parent_message.message_type.name === "ImageMessage") {
        return (
          <div className={"message-hold"} onClick={() => onClick()}>
            <div
              ref={message_ref}
              className={"message-body message-img-body first-chat"}
            >
              {sameSource() && <div className="bordse"></div>}
              {
                <div
                  className={
                    "absolute-avatar " +
                    `${
                      (!activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.photo_path ||
                        activeChat.channel_members
                          .filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]
                          ?.user?.photo_path?.includes("eu")) &&
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.name &&
                      "text-avatar"
                    }`
                  }
                >
                  {activeChat.channel_members
                    .filter((user) => user.user_id !== getUserChat()?.id)[0]
                    ?.user?.photo_path?.includes("eu") ? (
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                    )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) !==
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        src={profile}
                        width={30}
                        height={30}
                      />
                    )
                  ) : activeChat.channel_members.filter(
                      (user) => user.user_id !== getUserChat()?.id
                    )[0]?.user?.name?.length > 1 ? (
                    <>
                      {getTwoLetters(
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]?.user?.name ||
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.user_name
                      )}
                    </>
                  ) : (
                    <Image
                      alt="user-img"
                      unoptimized
                      className="abs-avva"
                      src={
                        (activeChat &&
                          activeChat.channel_members &&
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.photo_path) ||
                        profile
                      }
                    />
                  )}
                </div>
              }
              <ImageIcon className="message-type-icon"></ImageIcon> Image
            </div>
          </div>
        );
      } else if (parent_message.message_type.name === "VideoMessage") {
        return (
          <>
            <div className={"message-hold"} onClick={() => onClick()}>
              <div
                ref={message_ref}
                className={"message-body message-img-body first-chat"}
              >
                {sameSource() && <div className="bordse"></div>}
                {
                  <div
                    className={
                      "absolute-avatar " +
                      `${
                        (!activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]?.user?.photo_path ||
                          activeChat.channel_members
                            .filter(
                              (a) =>
                                parseInt(a.user_id) !==
                                parseInt(getUserChat()?.id)
                            )[0]
                            ?.user?.photo_path?.includes("eu")) &&
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]?.user?.name &&
                        "text-avatar"
                      }`
                    }
                  >
                    {activeChat.channel_members
                      .filter((user) => user.user_id !== getUserChat()?.id)[0]
                      ?.user?.photo_path?.includes("eu") ? (
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.name?.length > 1 ? (
                        <>
                          {getTwoLetters(
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) !==
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.name ||
                              activeChat.channel_members.filter(
                                (a) =>
                                  parseInt(a.user_id) !==
                                  parseInt(getUserChat()?.id)
                              )[0]?.user?.user_name
                          )}
                        </>
                      ) : (
                        <Image
                          alt="user-img"
                          src={profile}
                          width={30}
                          height={30}
                        />
                      )
                    ) : activeChat.channel_members.filter(
                        (user) => user.user_id !== getUserChat()?.id
                      )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        className="abs-avva"
                        unoptimized
                        src={
                          (activeChat &&
                            activeChat.channel_members &&
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.photo_path) ||
                          profile
                        }
                      />
                    )}
                  </div>
                }
                <VideoIcon className="message-type-icon"></VideoIcon> Video
              </div>
            </div>
          </>
        );
      }
      if (parent_message.message_type.name === "VoiceMessage") {
        return (
          <div className={"message-hold"} onClick={() => onClick()}>
            {
              <div
                ref={message_ref}
                className={"message-body audio-body him first-chat"}
              >
                {
                  <div
                    className={
                      "absolute-avatar " +
                      `${
                        (!activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]?.user?.photo_path ||
                          activeChat.channel_members
                            .filter(
                              (a) =>
                                parseInt(a.user_id) !==
                                parseInt(getUserChat()?.id)
                            )[0]
                            ?.user?.photo_path?.includes("eu")) &&
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]?.user?.name &&
                        "text-avatar"
                      }`
                    }
                  >
                    {activeChat.channel_members
                      .filter((user) => user.user_id !== getUserChat()?.id)[0]
                      ?.user?.photo_path?.includes("eu") ? (
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.name?.length > 1 ? (
                        <>
                          {getTwoLetters(
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) !==
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.name ||
                              activeChat.channel_members.filter(
                                (a) =>
                                  parseInt(a.user_id) !==
                                  parseInt(getUserChat()?.id)
                              )[0]?.user?.user_name
                          )}
                        </>
                      ) : (
                        <Image
                          alt="user-img"
                          src={profile}
                          width={30}
                          height={30}
                        />
                      )
                    ) : activeChat.channel_members.filter(
                        (user) => user.user_id !== getUserChat()?.id
                      )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        className="abs-avva"
                        unoptimized
                        src={
                          (activeChat &&
                            activeChat.channel_members &&
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) ===
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.photo_path) ||
                          profile
                        }
                      />
                    )}
                  </div>
                }
                <AudioIcon className="message-type-icon"></AudioIcon> Audio
              </div>
            }
          </div>
        );
      }
      if (parent_message.message_type.name === "TextMessage") {
        return (
          <div className={"message-hold"} onClick={() => onClick()}>
            <div
              ref={message_ref}
              className={"message-body text-message text-body first-chat"}
            >
              {
                <div
                  className={
                    "absolute-avatar " +
                    `${
                      (!activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.photo_path ||
                        activeChat.channel_members
                          .filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]
                          ?.user?.photo_path?.includes("eu")) &&
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.name &&
                      "text-avatar"
                    }`
                  }
                >
                  {activeChat.channel_members
                    .filter((user) => user.user_id !== getUserChat()?.id)[0]
                    ?.user?.photo_path?.includes("eu") ? (
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                    )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) !==
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        src={profile}
                        width={30}
                        height={30}
                      />
                    )
                  ) : activeChat.channel_members.filter(
                      (user) => user.user_id !== getUserChat()?.id
                    )[0]?.user?.name?.length > 1 ? (
                    <>
                      {getTwoLetters(
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]?.user?.name ||
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.user_name
                      )}
                    </>
                  ) : (
                    <Image
                      alt="user-img"
                      className="abs-avva"
                      unoptimized
                      src={
                        (activeChat &&
                          activeChat.channel_members &&
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.photo_path) ||
                        profile
                      }
                    />
                  )}
                </div>
              }
              <span className="message-body-text-content">
                {parent_message.message_content &&
                  parent_message.message_content?.content}
              </span>
            </div>
          </div>
        );
      }
      if (parent_message.message_type.name === "FileMessage") {
        return (
          <div className={"message-hold"} onClick={() => onClick()}>
            <div
              ref={message_ref}
              className={"message-body message-img-body first-chat"}
            >
              {sameSource() && <div className="bordse"></div>}
              {
                <div
                  className={
                    "absolute-avatar " +
                    `${
                      (!activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.photo_path ||
                        activeChat.channel_members
                          .filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]
                          ?.user?.photo_path?.includes("eu")) &&
                      activeChat.channel_members.filter(
                        (a) =>
                          parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                      )[0]?.user?.name &&
                      "text-avatar"
                    }`
                  }
                >
                  {activeChat.channel_members
                    .filter((user) => user.user_id !== getUserChat()?.id)[0]
                    ?.user?.photo_path?.includes("eu") ? (
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                    )[0]?.user?.name?.length > 1 ? (
                      <>
                        {getTwoLetters(
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name ||
                            activeChat.channel_members.filter(
                              (a) =>
                                parseInt(a.user_id) !==
                                parseInt(getUserChat()?.id)
                            )[0]?.user?.user_name
                        )}
                      </>
                    ) : (
                      <Image
                        alt="user-img"
                        src={profile}
                        width={30}
                        height={30}
                      />
                    )
                  ) : activeChat.channel_members.filter(
                      (user) => user.user_id !== getUserChat()?.id
                    )[0]?.user?.name?.length > 1 ? (
                    <>
                      {getTwoLetters(
                        activeChat.channel_members.filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]?.user?.name ||
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.user_name
                      )}
                    </>
                  ) : (
                    <Image
                      alt="user-img"
                      className="abs-avva"
                      unoptimized
                      src={
                        (activeChat &&
                          activeChat.channel_members &&
                          activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.photo_path) ||
                        profile
                      }
                    />
                  )}
                </div>
              }
              <Image
                alt="user-img"
                width={26}
                className="message-type-icon"
                height={20}
                src={out.src}
              />{" "}
              File
            </div>
          </div>
        );
      }
    }
  };
  return (
    <div
      style={{ top: `-${message_ref.current?.clientHeight * 0.84}px` }}
      className={`${
        (moving || !message_ref.current) && "hide-element"
      } ${getMessageReplyType()} replied-message-container`}
    >
      {showMessage()}
    </div>
  );
}

export default RepliedMessage;
