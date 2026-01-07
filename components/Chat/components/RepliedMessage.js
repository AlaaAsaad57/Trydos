import React from "react";
import { getTwoLetters } from "../chatsFunctions";

import ImageIcon from "../svg/image";
import VideoIcon from "../svg/video";
import AudioIcon from "../svg/audio";
import profile from "public/images/profileNo.png";

import out from "../svg/output.png";
import Image from "next/image";
import { getConfiguredImage, getUserChat } from "utils/functions";
import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
function RepliedMessage({
  moving,
  message,
  parent_message,
  message_ref,
  onClick,
}) {
  const { activeChat } = useAppStore();
  const sameSource = () => {
    if (
      String(message.sender_user_id) === String(parent_message.sender_user_id)
    ) {
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
  const MePhoto = () => {
    let photo =
      activeChat &&
      activeChat.channel_members &&
      activeChat.channel_members.filter(
        (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
      )[0]?.user?.photo_path;
    if (photo) return GetImageUrl(photo);
    else return null;
  };
  const OtherPhoto = () => {
    let photo =
      activeChat &&
      activeChat.channel_members &&
      activeChat.channel_members.filter(
        (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
      )[0]?.user?.photo_path;
    if (photo) return GetImageUrl(photo);
    else return null;
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
                      width={30}
                      height={30}
                      unoptimized
                      className="abs-avva"
                      src={MePhoto() || profile}
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
                        width={30}
                        height={30}
                        className="abs-avva"
                        unoptimized
                        src={MePhoto() || profile}
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
                      width={30}
                      height={30}
                      className="abs-avva"
                      unoptimized
                      src={MePhoto() || profile}
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
                      width={30}
                      height={30}
                      unoptimized
                      src={MePhoto() || profile}
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
                        width={30}
                        height={30}
                        className="abs-avva"
                        src={MePhoto() || profile}
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
      if (parent_message.message_type.name === "ShareProduct") {
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
                      width={30}
                      height={30}
                      alt="user-img"
                      className="abs-avva"
                      unoptimized
                      src={MePhoto() || profile}
                    />
                  )}
                </div>
              }
              <span className="message-body-text-content gap-[4px] flex-row items-center">
                <Image
                  width={30}
                  height={30}
                  className="rounded-[8px]"
                  src={getConfiguredImage({
                    src: GetImageUrl(
                      JSON.parse(parent_message.message_content?.content)?.[0]
                        ?.product_image_url
                    ),
                    width: 60,
                    height: 60,
                  })}
                />
                {parent_message.message_content &&
                  parent_message.message_content?.content &&
                  JSON.parse(parent_message.message_content?.content)?.[0]
                    ?.product_name}
              </span>
            </div>
          </div>
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
                      width={30}
                      height={30}
                      className="abs-avva"
                      src={OtherPhoto() || profile}
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
                        width={30}
                        height={30}
                        unoptimized
                        src={OtherPhoto() || profile}
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
                        width={30}
                        height={30}
                        unoptimized
                        src={OtherPhoto() || profile}
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
                      width={30}
                      height={30}
                      unoptimized
                      src={OtherPhoto() || profile}
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
                      width={30}
                      height={30}
                      className="abs-avva"
                      unoptimized
                      src={OtherPhoto() || profile}
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
                      width={30}
                      height={30}
                      alt="user-img"
                      className="abs-avva"
                      unoptimized
                      src={OtherPhoto() || profile}
                    />
                  )}
                </div>
              }
              <span className="message-body-text-content gap-[4px] flex-row items-center">
                <Image
                  width={30}
                  height={30}
                  className="rounded-[8px]"
                  src={getConfiguredImage({
                    src: GetImageUrl(
                      JSON.parse(parent_message.message_content?.content)?.[0]
                        ?.product_image_url
                    ),
                    width: 60,
                    height: 60,
                  })}
                />
                {parent_message.message_content &&
                  parent_message.message_content?.content &&
                  JSON.parse(parent_message.message_content?.content)?.[0]
                    ?.product_name}
              </span>
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
