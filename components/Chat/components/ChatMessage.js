import { useEffect, useRef, useState } from "react";
import SendIcon from "../svg/sent";
import ReadIcon from "../svg/read";
import ReceiveIcon from "../svg/recieved";
import WaveIcon from "../svg/wave";
import PlayIcon from "../svg/play";
import PauseIcon from "../svg/pause";
import RecordIcon from "../svg/record";
import RedRecord from "../svg/recordme";
import ForwardIcon from "../svg/forwarded";
import MissedIcon from "../svg/misscall";
import VideoIconMissed from "../svg/VideoMissed";
import OptionsMenu from "./OptionsMenu";
import RepliedMessage from "./RepliedMessage";
import SpinIcon from "../svg/spinn";
import DownIcon from "../svg/down";
import fil from "../svg/output.png";
import VideoIcon from "../svg/vcall";
import CallIcon from "../svg/call";
import Spinner from "../../global/Spinner";
import {
  SSRDetect,
  getConfiguredImage,
  getUserChat,
  translateFunction,
} from "utils/functions";
import Image from "next/image";
import { DeleteMessageApi } from "store/chat/actions";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import ChatPhoto from "./ChatPhoto";

import { getUser } from "../chatsFunctions";
import { GetImageUrl } from "utils/tinyUtils";
import { isSamePage } from "utils/navigationsUtils";
// Add a helper to sanitize IDs
const getSafeId = (id) => {
  if (!id) return "";
  let str = String(id);
  // Remove all non-alphanumeric characters and ensure it starts with a letter
  str = str.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!/^[a-zA-Z]/.test(str)) str = "m" + str;
  return str;
};

function ChatMessage(props) {
  const calculate = (duration) => {
    if (duration <= 0) return "";
    // Ensure duration is a positive number
    const totalSeconds = Math.max(0, Math.floor(duration));

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // PadStart ensures we always have two digits (e.g., "02")
    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    return `(${paddedMinutes}:${paddedSeconds})`;
  };
  const user = getUser();
  const { language, activeChat, deleteMessage } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const { setImg, setVid } = props;
  const message_ref = useRef();

  const [opens, setOpen] = useState(false);
  const refmessage = useRef();
  const AudioRef = useRef();

  const [playing, setPlay] = useState(false);
  const [DeleteModal, setDelete] = useState(false);

  const getStatues = () => {
    let a = props.message.message_status.filter(
      (a) => a.user_id !== getUserChat()?.id
    );
    if (a.length > 0) {
      return a[0];
    } else {
      return { is_watched: false, is_received: 0 };
    }
  };
  const getMessageStatus = () => {
    if (props.message?.mid) {
      return (
        <>
          {
            <div className="sent-date">
              {
                <>
                  <svg
                    fill="#3C3C3C"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="800px"
                    height="800px"
                    viewBox="0 0 473.068 473.068"
                    xmlSpace="preserve"
                    className="animate-spin"
                  >
                    <g>
                      <g id="Layer_2_31_">
                        <g>
                          <path
                            d="M355.507,181.955c8.793-6.139,29.39-20.519,29.39-55.351v-71.77h9.814c4.49,0,8.17-3.679,8.17-8.169v-38.5
				c0-4.49-3.681-8.165-8.17-8.165H78.351c-4.495,0-8.165,3.675-8.165,8.165v38.5c0,4.491,3.67,8.169,8.165,8.169h9.82v73.071
				c0,34.499,10.502,42.576,29.074,53.89l80.745,49.203v20.984c-20.346,12.23-73.465,44.242-80.434,49.107
				c-8.793,6.135-29.384,20.51-29.384,55.352v61.793h-9.82c-4.495,0-8.165,3.676-8.165,8.166v38.498c0,4.49,3.67,8.17,8.165,8.17
				h316.361c4.49,0,8.17-3.68,8.17-8.17V426.4c0-4.49-3.681-8.166-8.17-8.166h-9.814v-63.104c0-34.493-10.508-42.572-29.069-53.885
				l-80.745-49.202v-20.987C295.417,218.831,348.537,186.822,355.507,181.955z M252.726,272.859l87.802,53.5
				c6.734,4.109,10.333,6.373,12.001,9.002c1.991,3.164,2.963,9.627,2.963,19.768v63.104H117.574v-61.793
				c0-19.507,9.718-26.289,16.81-31.242c5.551-3.865,54.402-33.389,85.878-52.289c4.428-2.658,7.135-7.441,7.135-12.611v-37.563
				c0-5.123-2.671-9.883-7.053-12.55l-87.54-53.339l-0.265-0.165c-6.741-4.105-10.336-6.369-11.998-9.009
				c-1.992-3.156-2.968-9.626-2.968-19.767V54.835h237.918v71.77c0,19.5-9.718,26.288-16.814,31.235
				c-5.546,3.872-54.391,33.395-85.869,52.295c-4.427,2.658-7.134,7.442-7.134,12.601v37.563
				C245.675,265.431,248.346,270.188,252.726,272.859z"
                            fill={
                              !(
                                props.message?.type?.includes("text") ||
                                props?.message?.message_type?.name?.includes(
                                  "Text"
                                )
                              )
                                ? "#fafafa"
                                : "#3C3C3C"
                            }
                          />
                          <path
                            d="M331.065,154.234c0,0,5.291-4.619-2.801-3.299c-19.178,3.115-53.079,15.133-92.079,15.133s-57-11-82.507-11.303
				c-5.569-0.066-5.456,3.629,0.937,7.391c6.386,3.758,63.772,35.681,71.671,40.08c7.896,4.389,12.417,4.05,20.786,0
				C259.246,196.334,331.065,154.234,331.065,154.234z"
                            fill={
                              !(
                                props.message?.type?.includes("text") ||
                                props?.message?.message_type?.name?.includes(
                                  "Text"
                                )
                              )
                                ? "#fafafa"
                                : "#3C3C3C"
                            }
                          />
                          <path
                            d="M154.311,397.564c-6.748,6.209-9.978,10.713,5.536,10.713c12.656,0,139.332,0,155.442,0
				c16.099,0,9.856-5.453,2.311-12.643c-14.576-13.883-45.416-23.566-82.414-23.566
				C196.432,372.068,169.342,383.723,154.311,397.564z"
                            fill={
                              !(
                                props.message?.type?.includes("text") ||
                                props?.message?.message_type?.name?.includes(
                                  "Text"
                                )
                              )
                                ? "#fafafa"
                                : "#3C3C3C"
                            }
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.watched_at,
                    false
                  )}
                </>
              }
            </div>
          }
        </>
      );
    }
    if (
      props.message.message_status.filter((a) => a.user_id !== user?.id)
        .length > 0 &&
      props.message.message_status.filter((a) => a.user_id !== user?.id)[0]
        ?.is_watched === true &&
      props.message.message_status.filter((a) => a.user_id !== user?.id)[0]
        ?.watched_at
    ) {
      return (
        <>
          {
            <div className="sent-date">
              {
                <>
                  <ReadIcon></ReadIcon>
                  {getMessageTime(props.message.created_at, true)}
                </>
              }
            </div>
          }
        </>
      );
    } else if (
      props.message.message_status.filter((a) => a.user_id !== user?.id)
        .length > 0 &&
      props.message.message_status.filter((a) => a.user_id !== user?.id)[0]
        ?.is_received === 1 &&
      props.message.message_status.filter((a) => a.user_id !== user?.id)[0]
        ?.received_at
    ) {
      return (
        <>
          {
            <div className="sent-date">
              {
                <>
                  <ReceiveIcon></ReceiveIcon>
                  {getMessageTime(props.message.created_at, true)}
                </>
              }
            </div>
          }
        </>
      );
    } else {
      return (
        <>
          {
            <div className="sent-date">
              {
                <>
                  <SendIcon></SendIcon>
                  {getMessageTime(props.message.created_at, true)}
                </>
              }
            </div>
          }
        </>
      );
    }
  };
  const DeleteMessage = (ch_id, msg_id, bool) => {
    deleteMessage({ ch_id, msg_id, bool });
    DeleteMessageApi(msg_id, bool);
  };

  const getMessageTime = (ti, zone) => {
    let d;
    if (ti) {
      if (zone) {
        d = new Date(new Date(ti));
        return `${d.getHours() > 9 ? d.getHours() : "0" + d.getHours()}:${
          d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes()
        }`;
      } else {
        d = new Date(new Date(ti).getTime() + 3 * 60 * 60 * 1000);
        return `${d.getHours() > 9 ? d.getHours() : "0" + d.getHours()}:${
          d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes()
        }`;
      }
    } else {
      d = new Date();
      return `${d.getHours() > 9 ? d.getHours() : "0" + d.getHours()}:${
        d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes()
      }`;
    }
  };
  useEffect(() => {
    if (AudioRef.current && AudioRef.current.ended) {
      setPlay(false);
      AudioRef.current.currentTime = 0;
    }
  }, [AudioRef]);
  const showTime = (m) => {
    if (!m) {
      return null;
    }
    let minutes = Math.round(m / 60);
    let seconds = Math.round(m - minutes * 60);
    return `${minutes > 9 ? minutes : "0" + minutes}:${
      seconds > 9 ? seconds : "0" + seconds
    }`;
  };
  const showBord = (type, height) => {
    let arr = [];
    let num = height / 7;
    if (type === "middle-chat") {
      num = (height + 10) / 7;
    }
    for (var i = 0; i < num; i++) {
      arr.push("");
    }
    return arr;
  };

  const copyText = () => {
    let elem = document.querySelector("#text-copy");
    elem.value = props.message?.message_content?.content;
    elem.select();
    document.execCommand("Copy");
  };

  const showMessage = () => {
    const { setForwardMessage, setReplyMessage } = useAppStore.getState();
    // if (
    //   !props.message?.auth_message_status ||
    //   props.message?.auth_message_status.is_deleted !== 1
    // ) {
    if (props.message?.auth_message_status?.is_deleted === 1) {
      return (
        <div
          className={"message-hold" + " " + `${opens && "ac"} deleted-message`}
        >
          <div
            ref={refmessage}
            style={{ backgroundColor: "#cecece" }}
            className={
              "message-element-body message-body text-body " + props.type
            }
          >
            {(props.message.is_forward === true ||
              props.message.is_forward === 1) && (
              <div className="forwarded-message-icon">
                <ForwardIcon></ForwardIcon>
              </div>
            )}
            <div className="border-element">
              {refmessage.current &&
                showBord(props.type, refmessage.current.clientHeight).map(
                  (ad, i) => <div className="border-child" key={i}></div>
                )}
            </div>
            {(props.type === "first-chat" || props.type === "lonely") && (
              <div
                className={
                  "absolute-avatar " +
                  `${
                    (!activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
                    )[0]?.user?.photo_path ||
                      activeChat.channel_members
                        .filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]
                        ?.user?.photo_path?.includes("eu")) &&
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
                    )[0]?.user?.name &&
                    "text-avatar"
                  }`
                }
              >
                <ChatPhoto
                  user={
                    activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  }
                  width={30}
                  className="abs-avva"
                  height={30}
                />
              </div>
            )}
            {translate("this message was deleted", language)}
          </div>
        </div>
      );
    }
    if (
      parseInt(props.message.sender_user_id) === parseInt(getUserChat()?.id)
    ) {
      if (props.message.message_type.name === "ShareProduct") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body flex-col message-body message-img-body product-share-message" +
                props.type +
                " " +
                ` ${opens && "ac"}`
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              {/* <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div> */}
              {props.type === "first-chat" && <div className="bordse"></div>}

              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) === String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <div className="flex justify-center z-[9999999999] absolute bottom-[20px] left-0 right-0 mx-auto my-0">
                <NextLink
                  className="py-2  px-4 text-center flex justify-center light text-[12px] text-[#1d1d1d] bg-slate-50 rounded-md"
                  data={{
                    is_product: true,
                    slug: JSON.parse(props.message.message_content.content)[0]
                      .product_slug,
                    href: `/products/${
                      JSON.parse(props.message.message_content.content)[0]
                        .product_slug
                    }`,
                  }}
                  sameHref={isSamePage(
                    `/products/${
                      JSON.parse(props.message.message_content.content)[0]
                        .product_slug
                    }`
                  )}
                  href={`/products/${
                    JSON.parse(props.message.message_content.content)[0]
                      .product_slug
                  }`}
                  prefetch
                >
                  {translateFunction("View Product")}
                </NextLink>
              </div>
              <img
                alt="user"
                onClick={() =>
                  setImg(
                    getConfiguredImage({
                      src: GetImageUrl(
                        JSON.parse(props.message.message_content.content)[0]
                          .product_image_url
                      ),
                      width: 315,
                      height: 521,
                      q: 80,
                    })
                  )
                }
                className="message-img product-share-image w-full"
                src={getConfiguredImage({
                  src: GetImageUrl(
                    JSON.parse(props.message.message_content.content)[0]
                      .product_image_url
                  ),
                  width: 315,
                  height: 521,
                  q: 80,
                })}
              />
              <span className="product-share-span px-[10px]">
                {
                  JSON.parse(props.message.message_content.content)[0]
                    .product_name
                }
              </span>

              <div className="message-date">{getMessageStatus()}</div>
            </div>
            <div className="message-date hovers">
              {
                <div className="sent-date">
                  {
                    <>
                      <SendIcon></SendIcon>
                      {getMessageTime(props.message.created_at, true)}
                    </>
                  }
                </div>
              }
              {getStatues().is_received === 1 && (
                <div className="recieve-date">
                  <ReceiveIcon></ReceiveIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.received_at,
                    false
                  )}
                </div>
              )}
              {getStatues().is_watched === true && (
                <div className="recieve-date">
                  <ReadIcon></ReadIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.watched_at,
                    false
                  )}
                </div>
              )}
            </div>

            <OptionsMenu
              message={props?.message}
              isSender={true}
              isPrivate={props.isPrivate}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "ImageMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body message-img-body " +
                props.type +
                " " +
                ` ${opens && "ac"}`
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {props.type === "first-chat" && <div className="bordse"></div>}

              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) === String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <img
                alt="user"
                onClick={() =>
                  setImg(props.message.message_files?.[0]?.file_path)
                }
                className="message-img"
                src={props.message.message_files?.[0]?.file_path}
              />

              <div className="message-date">{getMessageStatus()}</div>
            </div>
            <div className="message-date hovers">
              {
                <div className="sent-date">
                  {
                    <>
                      <SendIcon></SendIcon>
                      {getMessageTime(props.message.created_at, true)}
                    </>
                  }
                </div>
              }
              {getStatues().is_received === 1 && (
                <div className="recieve-date">
                  <ReceiveIcon></ReceiveIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.received_at,
                    false
                  )}
                </div>
              )}
              {getStatues().is_watched === true && (
                <div className="recieve-date">
                  <ReadIcon></ReadIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.watched_at,
                    false
                  )}
                </div>
              )}
            </div>

            <OptionsMenu
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              isSender={true}
              setImg={() => {
                setImg(props.message.message_files[0]?.file_path);
              }}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "VideoMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body message-img-body " +
                props.type +
                " " +
                ` ${opens && "ac"}`
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {props.type === "first-chat" && <div className="bordse"></div>}

              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) === String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <PlayIcon
                onClick={() => {
                  setVid(props.message.message_files[0]?.file_path);
                }}
                className="play-vid-icon"
              ></PlayIcon>
              <video
                className="message-img"
                src={props.message.message_files[0]?.file_path}
              >
                <source
                  src={props.message.message_files[0]?.file_path}
                ></source>
              </video>

              <div className="message-date">{getMessageStatus()}</div>
            </div>
            <div className="message-date hovers">
              {
                <div className="sent-date">
                  {
                    <>
                      <SendIcon></SendIcon>
                      {getMessageTime(props.message.created_at, true)}
                    </>
                  }
                </div>
              }
              {getStatues().is_received === 1 && (
                <div className="recieve-date">
                  <ReceiveIcon></ReceiveIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.received_at,
                    false
                  )}
                </div>
              )}
              {getStatues().is_watched === true && (
                <div className="recieve-date">
                  <ReadIcon></ReadIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.watched_at,
                    false
                  )}
                </div>
              )}
            </div>

            <OptionsMenu
              isSender={true}
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "VoiceMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}
            {props.message.message_files &&
              props.message.message_files[0]?.file_path &&
              props.message.message_files[0]?.file_path !== "false" && (
                <div
                  onClick={() => setOpen(true)}
                  ref={refmessage}
                  className={
                    "message-element-body message-body audio-body " + props.type
                  }
                >
                  {(props.message.is_forward === true ||
                    props.message.is_forward === 1) && (
                    <div className="forwarded-message-icon">
                      <ForwardIcon></ForwardIcon>
                    </div>
                  )}
                  <div className="border-element">
                    {refmessage.current &&
                      showBord(props.type, refmessage.current.clientHeight).map(
                        (ad, i) => <div className="border-child" key={i}></div>
                      )}
                  </div>
                  <audio
                    key={props.message.message_files[0]?.file_path}
                    onEnded={() => {
                      setPlay(false);

                      AudioRef.current.currentTime = 0;
                    }}
                    controls={false}
                    ref={AudioRef}
                    src={props.message.message_files[0]?.file_path}
                  >
                    <source src={props.message.message_files[0]?.file_path} />
                  </audio>
                  {(props.type === "first-chat" || props.type === "lonely") && (
                    <div
                      className={
                        "absolute-avatar " +
                        `${
                          (!activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
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
                              parseInt(a.user_id) ===
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name &&
                          "text-avatar"
                        }`
                      }
                    >
                      <ChatPhoto
                        user={
                          activeChat.channel_members.filter(
                            (user) =>
                              String(user.user_id) === String(getUserChat()?.id)
                          )[0]?.user
                        }
                        width={30}
                        className="abs-avva"
                        height={30}
                      />
                    </div>
                  )}
                  <div className="audio-message">
                    {AudioRef.current?.duration ? (
                      !AudioRef.current.paused ? (
                        <PauseIcon
                          className="play-icon"
                          onClick={() => {
                            setPlay(!playing);
                            if (playing) AudioRef.current.pause();
                            else AudioRef.current.play();
                          }}
                        ></PauseIcon>
                      ) : (
                        <PlayIcon
                          className="play-icon"
                          onClick={() => {
                            setPlay(!playing);
                            if (playing) AudioRef.current.pause();
                            else AudioRef.current.play();
                          }}
                        ></PlayIcon>
                      )
                    ) : (
                      <Spinner className="play-icon" />
                    )}{" "}
                    <div className="player-cont">
                      <div className="wave-absolute">
                        {AudioRef.current?.duration !== Infinity &&
                        AudioRef.current?.duration !== undefined &&
                        AudioRef.current?.duration !== NaN &&
                        showTime(AudioRef.current?.duration) !== null &&
                        showTime(AudioRef.current?.duration) !== NaN &&
                        showTime(AudioRef.current?.duration) !== "NaN" ? (
                          <div className="player-time">
                            {AudioRef.current &&
                              AudioRef.current?.duration &&
                              showTime(AudioRef.current?.duration)}
                          </div>
                        ) : (
                          <div className="player-time border-none h-[22px]"></div>
                        )}
                        <div className="wave w-full">
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                        </div>
                      </div>
                      <div className="player-line"></div>
                    </div>
                    <RedRecord className="play-icon-me"></RedRecord>
                  </div>

                  <div className="message-date">{getMessageStatus()}</div>
                </div>
              )}
            <div className="message-date hovers">
              {
                <div className="sent-date">
                  {
                    <>
                      <SendIcon></SendIcon>
                      {getMessageTime(props.message.created_at, true)}
                    </>
                  }
                </div>
              }
              {getStatues().is_received === 1 && (
                <div className="recieve-date">
                  <ReceiveIcon></ReceiveIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.received_at,
                    false
                  )}
                </div>
              )}
              {getStatues().is_watched === true && (
                <div className="recieve-date">
                  <ReadIcon></ReadIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.watched_at,
                    false
                  )}
                </div>
              )}
            </div>
            <OptionsMenu
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              isSender={true}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "TextMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body text-body " + props.type
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) === String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <span className="message-body-text-content">
                {props.message.message_content &&
                  props.message.message_content?.content}
              </span>

              <div className="message-date">{getMessageStatus()}</div>
            </div>
            <div className="message-date hovers">
              {
                <div className="sent-date">
                  {
                    <>
                      <SendIcon></SendIcon>
                      {getMessageTime(props.message.created_at, true)}
                    </>
                  }
                </div>
              }
              {getStatues().is_received === 1 && (
                <div className="recieve-date">
                  <ReceiveIcon></ReceiveIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.received_at,
                    false
                  )}
                </div>
              )}
              {getStatues().is_watched === true && (
                <div className="recieve-date">
                  <ReadIcon></ReadIcon>
                  {getMessageTime(
                    props.message.message_status.filter(
                      (a) => a.user_id !== user?.id
                    )[0]?.watched_at,
                    false
                  )}
                </div>
              )}
            </div>
            <OptionsMenu
              isPrivate={props.isPrivate}
              isSender={true}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "FileMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body text-body " + props.type
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) === String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              {props.message?.message_files &&
                props.message?.message_files[0]?.file_path && (
                  <a
                    target="_blank"
                    href={props.message.message_files[0]?.file_path}
                    download
                    className="replay-msg file-msg"
                  >
                    <Image
                      alt="user-img"
                      src={fil.src}
                      data-cy="FILE-PNG"
                      width={26}
                      height={20}
                      unoptimized
                      style={{ width: "26px" }}
                    />
                    <div className="file-desc">
                      <div className="file-name">{"FILE"}</div>
                      <div className="file-type"></div>
                    </div>
                    {props.message?.type ? (
                      <SpinIcon></SpinIcon>
                    ) : (
                      <DownIcon style={{ minWidth: "34px" }}></DownIcon>
                    )}
                  </a>
                )}
              <div className="message-date hovers">
                {
                  <div className="sent-date">
                    {
                      <>
                        <SendIcon></SendIcon>
                        {getMessageTime(props.message.created_at, true)}
                      </>
                    }
                  </div>
                }
                {getStatues().is_received === 1 && (
                  <div className="recieve-date">
                    <ReceiveIcon></ReceiveIcon>
                    {getMessageTime(
                      props.message.message_status.filter(
                        (a) => a.user_id !== user?.id
                      )[0]?.received_at,
                      false
                    )}
                  </div>
                )}
                {getStatues().is_watched === true && (
                  <div className="recieve-date">
                    <ReadIcon></ReadIcon>
                    {getMessageTime(
                      props.message.message_status.filter(
                        (a) => a.user_id !== user?.id
                      )[0]?.watched_at,
                      false
                    )}
                  </div>
                )}
              </div>
              <div className="message-date">{getMessageStatus()}</div>
            </div>
            <OptionsMenu
              isSender={true}
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (
        props.message.message_type.name === "VideoCall" ||
        props.message.message_type.name === "VoiceCall"
      ) {
        return (
          <div
            className={`${opens && "ac"} flex flex-col gap-[10px] message-hold`}
          >
            <div
              className={` call-body ${
                props.message.duration_in_seconds > 0 && "!bg-teal-100"
              } `}
              onClick={() => setOpen(true)}
            >
              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) === String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <>
                {props?.message?.duration_in_seconds <= 0 ? (
                  props.message.message_type.name === "VoiceCall" ? (
                    <MissedIcon></MissedIcon>
                  ) : (
                    <VideoIconMissed />
                  )
                ) : props.message.message_type.name !== "VoiceCall" ? (
                  <VideoIcon className="scale-90" />
                ) : (
                  <CallIcon className="scale-90" />
                )}
              </>
              <div
                className={
                  "absolute-avatar " +
                  `${
                    (!activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
                    )[0]?.user?.photo_path ||
                      activeChat.channel_members
                        .filter(
                          (a) =>
                            parseInt(a.user_id) === parseInt(getUserChat()?.id)
                        )[0]
                        ?.user?.photo_path?.includes("eu")) &&
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) === parseInt(getUserChat()?.id)
                    )[0]?.user?.name &&
                    "text-avatar"
                  }`
                }
              >
                <ChatPhoto
                  user={
                    activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) === String(getUserChat()?.id)
                    )[0]?.user
                  }
                  width={30}
                  className="abs-avva"
                  height={30}
                />
              </div>
              <div className="missed-body">
                {props.message?.duration_in_seconds <= 0
                  ? props.message.message_type.name === "VideoCall"
                    ? translate("Missed Video Call At", language)
                    : translate("Missed Voice Call At", language)
                  : props.message.message_type.name === "VideoCall"
                  ? translateFunction("Outgoing Video Call", language)
                  : translateFunction("Outgoing Voice Call", language)}{" "}
                {calculate(props.message?.duration_in_seconds)}{" "}
                {getMessageTime(props.message.created_at, true)}
              </div>
            </div>
            <OptionsMenu
              isPrivate={props.isPrivate}
              isCall={true}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
    } else {
      if (props.message.message_type.name === "ShareProduct") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body flex-col message-body message-img-body product-share-message " +
                props.type
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              {/* <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div> */}
              {props.type === "first-chat" && <div className="bordse"></div>}

              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) !== String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <div className="flex justify-center z-[9999999999] absolute bottom-[20px] left-0 right-0 mx-auto my-0">
                <NextLink
                  className="py-2 px-4 text-center flex justify-center light text-[12px] text-[#1d1d1d] bg-slate-50 rounded-md"
                  data={{
                    is_product: true,
                    slug: JSON.parse(props.message.message_content.content)[0]
                      .product_slug,
                    href: `/products/${
                      JSON.parse(props.message.message_content.content)[0]
                        .product_slug
                    }`,
                  }}
                  href={`/products/${
                    JSON.parse(props.message.message_content.content)[0]
                      .product_slug
                  }`}
                  sameHref={isSamePage(
                    `/products/${
                      JSON.parse(props.message.message_content.content)[0]
                        .product_slug
                    }`
                  )}
                  prefetch
                >
                  {translateFunction("View Product")}
                </NextLink>
              </div>
              <img
                alt="user"
                onClick={() =>
                  setImg(
                    getConfiguredImage({
                      src: GetImageUrl(
                        JSON.parse(props.message.message_content.content)[0]
                          .product_image_url
                      ),
                      width: 315,
                      height: 521,
                      q: 80,
                    })
                  )
                }
                className="message-img product-share-image w-full"
                src={getConfiguredImage({
                  src: GetImageUrl(
                    JSON.parse(props.message.message_content.content)[0]
                      .product_image_url
                  ),
                  width: 315,
                  height: 521,
                  q: 80,
                })}
              />
              <span className="product-share-span flex-col px-[10px]">
                {
                  JSON.parse(props.message.message_content.content)[0]
                    .product_name
                }
              </span>
              <div className="other-date">
                {getMessageTime(props.message.created_at, true)}
              </div>
            </div>
            <OptionsMenu
              isPrivate={props.isPrivate}
              isSender={false}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "ImageMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body message-img-body " +
                props.type
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {props.type === "first-chat" && <div className="bordse"></div>}

              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) !== String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <img
                alt="user"
                onClick={() =>
                  setImg(props.message.message_files[0]?.file_path)
                }
                className="message-img"
                src={props.message?.message_files?.[0]?.file_path}
              />
              <div className="other-date">
                {getMessageTime(props.message.created_at, true)}
              </div>
            </div>
            <OptionsMenu
              isSender={false}
              isPrivate={props.isPrivate}
              setImg={() => {
                setImg(props.message.message_files[0]?.file_path);
              }}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "VideoMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body message-img-body " +
                props.type
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {props.type === "first-chat" && <div className="bordse"></div>}

              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) !== String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <PlayIcon
                onClick={() => {
                  setVid(props.message.message_files[0]?.file_path);
                }}
                className="play-vid-icon"
              ></PlayIcon>
              <video
                className="message-img"
                src={props.message.message_files?.[0]?.file_path}
              >
                <source
                  src={props.message.message_files?.[0]?.file_path}
                ></source>
              </video>
              <div className="other-date">
                {getMessageTime(props.message.created_at, true)}
              </div>
            </div>
            <OptionsMenu
              isSender={false}
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "VoiceMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            {props.message.message_files &&
              props.message.message_files[0]?.file_path &&
              props.message.message_files[0]?.file_path !== "false" && (
                <div
                  ref={refmessage}
                  onClick={() => setOpen(true)}
                  className={
                    "message-element-body message-body audio-body him " +
                    props.type
                  }
                >
                  {(props.message.is_forward === true ||
                    props.message.is_forward === 1) && (
                    <div className="forwarded-message-icon">
                      <ForwardIcon></ForwardIcon>
                    </div>
                  )}
                  <div className="border-element">
                    {refmessage.current &&
                      showBord(props.type, refmessage.current.clientHeight).map(
                        (ad, i) => <div className="border-child" key={i}></div>
                      )}
                  </div>
                  {(props.type === "first-chat" || props.type === "lonely") && (
                    <div
                      className={
                        "absolute-avatar " +
                        `${
                          (!activeChat.channel_members.filter(
                            (a) =>
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
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
                              parseInt(a.user_id) !==
                              parseInt(getUserChat()?.id)
                          )[0]?.user?.name &&
                          "text-avatar"
                        }`
                      }
                    >
                      <ChatPhoto
                        user={
                          activeChat.channel_members.filter(
                            (user) =>
                              String(user.user_id) !== String(getUserChat()?.id)
                          )[0]?.user
                        }
                        width={30}
                        className="abs-avva"
                        height={30}
                      />
                    </div>
                  )}
                  <div className="audio-message ">
                    <audio
                      key={props.message.message_files[0]?.file_path}
                      onEnded={() => {
                        setPlay(false);
                        AudioRef.current.currentTime = 0;
                      }}
                      controls={false}
                      ref={AudioRef}
                      src={
                        props.message.message_files &&
                        props.message.message_files[0]?.file_path
                      }
                    >
                      <source
                        src={
                          props.message.message_files &&
                          props.message.message_files[0]?.file_path
                        }
                      />
                    </audio>
                    <RecordIcon></RecordIcon>
                    {AudioRef.current?.duration ? (
                      !AudioRef.current.paused ? (
                        <PauseIcon
                          className="play-icon"
                          onClick={() => {
                            setPlay(!playing);
                            if (playing) AudioRef.current.pause();
                            else AudioRef.current.play();
                          }}
                        ></PauseIcon>
                      ) : (
                        <PlayIcon
                          className="play-icon"
                          onClick={() => {
                            setPlay(!playing);
                            if (playing) AudioRef.current.pause();
                            else AudioRef.current.play();
                          }}
                        ></PlayIcon>
                      )
                    ) : (
                      <Spinner className="play-icon" />
                    )}

                    <div className="player-cont">
                      <div className="wave-absolute">
                        {AudioRef.current?.duration !== Infinity &&
                        AudioRef.current?.duration !== undefined &&
                        AudioRef.current?.duration !== NaN &&
                        showTime(AudioRef.current?.duration) !== null &&
                        showTime(AudioRef.current?.duration) !== NaN &&
                        showTime(AudioRef.current?.duration) !== "NaN" ? (
                          <div className="player-time">
                            {AudioRef.current &&
                              AudioRef.current?.duration &&
                              showTime(AudioRef.current?.duration)}
                          </div>
                        ) : (
                          <div className="player-time border-none h-[22px]">
                            00:00
                          </div>
                        )}
                        <div className="wave w-full">
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                          <WaveIcon></WaveIcon>
                        </div>
                      </div>
                      <div className="player-line"></div>
                    </div>
                  </div>
                  <div className="other-date">
                    {getMessageTime(props.message.created_at, true)}
                  </div>
                </div>
              )}
            <OptionsMenu
              isSender={false}
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "TextMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body text-body " + props.type
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) !== String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <span className="message-body-text-content">
                {props.message.message_content &&
                  props.message.message_content?.content}
              </span>

              <div className="other-date">
                {getMessageTime(props.message.created_at, true)}
              </div>
            </div>
            <OptionsMenu
              isSender={false}
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (props.message.message_type.name === "FileMessage") {
        return (
          <div
            onMouseLeave={() => {
              setOpen(false);
              setDelete(false);
            }}
            className={"message-hold" + " " + `${opens && "ac"}`}
          >
            {props.message.parent_message && (
              <RepliedMessage
                onClick={() =>
                  props.GetMessage(
                    props.message.id,
                    props.message.parent_message_id
                  )
                }
                message_ref={message_ref}
                message={props.message}
                parent_message={props.message.parent_message}
                moving={moving}
              />
            )}

            <div
              onClick={() => setOpen(true)}
              ref={refmessage}
              className={
                "message-element-body message-body text-body " + props.type
              }
            >
              {(props.message.is_forward === true ||
                props.message.is_forward === 1) && (
                <div className="forwarded-message-icon">
                  <ForwardIcon></ForwardIcon>
                </div>
              )}
              <div className="border-element">
                {refmessage.current &&
                  showBord(props.type, refmessage.current.clientHeight).map(
                    (ad, i) => <div className="border-child" key={i}></div>
                  )}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) !== String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              {props.message?.message_files &&
                props.message?.message_files[0]?.file_path && (
                  <a
                    target="_blank"
                    href={props.message.message_files[0]?.file_path}
                    download
                    className="replay-msg file-msg"
                  >
                    <Image
                      alt="user-img"
                      width={26}
                      src={fil.src}
                      height={20}
                      style={{ width: "26px" }}
                      unoptimized
                    />
                    <div className="file-desc">
                      <div className="file-name">{"FILE"}</div>
                      <div className="file-type"></div>
                    </div>
                    {props.message?.type ? (
                      <SpinIcon></SpinIcon>
                    ) : (
                      <DownIcon style={{ minWidth: "34px" }}></DownIcon>
                    )}
                  </a>
                )}

              <div className="other-date">
                {getMessageTime(props.message.created_at, true)}
              </div>
            </div>
            <OptionsMenu
              isSender={false}
              message={props?.message}
              isPrivate={props.isPrivate}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
      if (
        props.message.message_type.name === "VideoCall" ||
        props.message.message_type.name === "VoiceCall"
      ) {
        return (
          <div
            className={`${opens && "ac"} flex flex-col gap-[10px] message-hold`}
          >
            <div
              className={` call-body ${
                props.message.duration_in_seconds > 0 && "!bg-teal-100"
              }`}
              onClick={() => setOpen(true)}
            >
              {(props.type === "first-chat" || props.type === "lonely") && (
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
                  <ChatPhoto
                    user={
                      activeChat.channel_members.filter(
                        (user) =>
                          String(user.user_id) !== String(getUserChat()?.id)
                      )[0]?.user
                    }
                    width={30}
                    className="abs-avva"
                    height={30}
                  />
                </div>
              )}
              <>
                {props.message.duration_in_seconds <= 0 ? (
                  props.message.message_type.name === "VoiceCall" ? (
                    <MissedIcon></MissedIcon>
                  ) : (
                    <VideoIconMissed />
                  )
                ) : props.message.message_type.name !== "VoiceCall" ? (
                  <VideoIcon className="scale-90" />
                ) : (
                  <CallIcon className="scale-90" />
                )}
              </>
              <div
                className={
                  "absolute-avatar " +
                  `${
                    (!activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                    )[0]?.user?.photo_path ||
                      activeChat.channel_members
                        .filter(
                          (a) =>
                            parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                        )[0]
                        ?.user?.photo_path?.includes("eu")) &&
                    activeChat.channel_members.filter(
                      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
                    )[0]?.user?.name &&
                    "text-avatar"
                  }`
                }
              >
                <ChatPhoto
                  user={
                    activeChat.channel_members.filter(
                      (user) =>
                        String(user.user_id) !== String(getUserChat()?.id)
                    )[0]?.user
                  }
                  width={30}
                  className="abs-avva"
                  height={30}
                />
              </div>
              <div className="missed-body">
                {props.message?.duration_in_seconds <= 0
                  ? props.message.message_type.name === "VideoCall"
                    ? translate("Missed Video Call At", language)
                    : translate("Missed Voice Call At", language)
                  : props.message.message_type.name === "VideoCall"
                  ? translateFunction("Incoming Video Call", language)
                  : translateFunction("Incoming Voice Call", language)}{" "}
                {calculate(props.message?.duration_in_seconds)}{" "}
                {getMessageTime(props.message.created_at, true)}
              </div>
            </div>
            <OptionsMenu
              isSender={false}
              isCall={true}
              isPrivate={props.isPrivate}
              message={props?.message}
              DeleteModal={DeleteModal}
              setDelete={(e) => setDelete(e)}
              deleteMessage={(e) =>
                DeleteMessage(activeChat.id, props.message.id, e)
              }
              copy={() => copyText()}
              forward={() => setForwardMessage(props.message)}
              click={() => setReplyMessage(props.message)}
            />
          </div>
        );
      }
    }
  };
  function handleTouchStart(evt, a, index) {
    isMove = null;
    a.style.transform = `translateX(-${Math.abs(0)}px)`;
    a.nextElementSibling.style.opacity = "0";
    a.nextElementSibling.style.right = `${a.offsetWidth - 40}px`;
    setOpen(false);
    a.addEventListener("touchmove", (e) => handleTouchMove(e, a, index), {
      passive: true,
    });
    a.addEventListener("mousemove", (e) => handleTouchMove(e, a, index), {
      passive: true,
    });

    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
  }

  var xDown = null;
  var yDown = null;
  var isMove = null;
  var moving = false;
  function handleTouchEnd(e, a, index) {
    a.removeEventListener("touchmove", (e) => handleTouchMove);
    a.removeEventListener("mousemove", (e) => handleTouchMove);

    xDown = null;
    yDown = null;
  }
  useEffect(() => {
    document
      .querySelectorAll(
        ".message-element.self-align .message-element-body.message-body"
      )
      .forEach((a, index) => {
        a.addEventListener("touchstart", (e) => handleTouchStart(e, a, index), {
          passive: true,
        });
        a.addEventListener(
          "touchend",
          (e) => handleTouchEnd(e, a, index),
          false
        );
        a.addEventListener(
          "mousedown",
          (e) => handleTouchStart(e, a, index),
          false
        );
        a.addEventListener(
          "mouseup",
          (e) => handleTouchEnd(e, a, index),
          false
        );
      });
  }, []);
  useEffect(() => {}, [AudioRef.current]);
  function getTouches(evt) {
    return (
      evt.touches || [evt] // browser API
    ); // jQuery
  }
  function handleTouchMove(evt, a, indexx) {
    if (!xDown || !yDown) {
      return;
    }
    document
      .querySelectorAll(
        ".message-element.self-align .message-element-body.message-body"
      )
      .forEach((v, index) => {
        if (indexx !== index) {
          v.style.transform = "translateX(0px)";
          if (v.nextElementSibling) {
            v.nextElementSibling.style.opacity = "0";
            v.nextElementSibling.style.right = `${a.offsetWidth - 40}px`;
          }
          setOpen(false);
        }
      });
    isMove = true;
    var yUp, xUp;
    if (evt.touches) {
      xUp = evt.touches[0]?.clientX;
      yUp = evt.touches[0]?.clientY;
    } else {
      xUp = evt.clientX;
      yUp = evt.clientY;
    }

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      /*most significant*/
      if (xDiff > 0) {
        if (Math.abs(xDiff) < 250) {
        }
      } else {
        if (Math.abs(xDiff) < 180) {
          moving = true;

          a.style.transform = `translateX(${Math.abs(80)}px)`;
          if (a.nextElementSibling) {
            a.nextElementSibling.style.opacity = "1";
            a.nextElementSibling.style.right = `${a.offsetWidth - 60}px`;
            a.nextElementSibling.style.left = `initial`;
          }
          setOpen(false);
        }
      }
    }
    /* reset values */
  }
  useEffect(() => {
    document.querySelectorAll(".message-element").forEach((a) => {
      a.addEventListener("mouseleave", function () {
        setTimeout(() => {
          document
            .querySelectorAll(
              ".message-element.self-align .message-element-body.message-body"
            )
            .forEach((v, index) => {
              v.style.transform = "translateX(0px)";
              if (v.nextElementSibling) {
                v.nextElementSibling.style.opacity = "0";
                v.nextElementSibling.style.right = `${a.offsetWidth - 40}px`;
              }
              setOpen(false);
            });
        }, 300);
      });
    });
  }, []);
  return (
    <>
      {props.message && (
        <div
          id={`main-container-${props.message.id}`}
          style={{
            marginTop:
              message_ref.current &&
              `${message_ref.current.clientHeight * 0.84}px`,
          }}
          className={
            "message-container message-element" +
            ` ${props.marg && !props.message.parent_message && "mt25"} ${
              parseInt(props.message.sender_user_id) ===
                parseInt(getUserChat()?.id) && "self-align"
            } ${
              (props.message.message_type.name === "VideoCall" ||
                props.message.message_type.name === "VoiceCall") &&
              "center-align"
            }`
          }
        >
          {showMessage()}
        </div>
      )}
    </>
  );
}

export default ChatMessage;
