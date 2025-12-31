import ArrowIcon from "../svg/arrow";
import VideoIcon from "../svg/vcall";
import CallIcon from "../svg/call";

import { getNew, showDate } from "../chatsFunctions";
import { getUserChat } from "utils/functions";
import { makeVideoCall, makeVoiceCall } from "store/chat/callActions";
import { translateFunction } from "../../../utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import ChatPhoto from "./ChatPhoto";

import { showErrorNotification } from "store/notifications/reducer";

function ChatHeader({
  chats,
  activeChat,
  openDetails,
  isPrivate,
  closeWidget,
  close,
}) {
  const {
    callLoading,
    Server_time,
    setMain,
    openChat,
    setReplyMessage,
    language,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const time_differenc = (date) => {
    let value = (new Date(Server_time) - new Date(date)) / 1000 / 60;
    return value;
  };
  const getStatues = () => {
    if (activeChat?.status && activeChat?.status !== "null") {
      return activeChat.status;
    } else {
      if (activeChat?.activeDate) {
        if (time_differenc(activeChat.activeDate) > 5) {
          return `${translate("last Seen ", language)} ${showDate(
            activeChat.activeDate
          )}`;
        } else {
          return translate("Online", language);
        }
      } else {
        return <a></a>;
      }
    }
  };
  const audioCallFunction = async () => {
    let payload = null;
    if (isPrivate && activeChat?.order_chat_participant_id) {
      payload = {
        order_chat_participant_id: activeChat?.order_chat_participant_id,
        receiver_user_id: activeChat?.channel_members?.find(
          (s) => String(s?.user_id) !== String(getUserChat()?.id)
        )?.user_id,
        is_private: true,
      };
    }
    try {
      !callLoading &&
        makeVoiceCall(
          activeChat.id,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id)
          )[0]?.user.name,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id)
          )[0]?.user?.photo_path,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id)
          )[0]?.user.mobile_phone,
          payload
        );
    } catch (error) {
      showErrorNotification(translateFunction("Failed to Initialize Call"));
    }
  };

  const videoCallFunction = async () => {
    let payload = null;
    if (isPrivate && activeChat?.order_chat_participant_id) {
      payload = {
        order_chat_participant_id: activeChat?.order_chat_participant_id,
        receiver_user_id: activeChat?.channel_members?.find(
          (s) => String(s?.user_id) !== String(getUserChat()?.id)
        )?.user_id,
        is_private: true,
      };
    }
    try {
      !callLoading &&
        makeVideoCall(
          activeChat.id,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id)
          )[0]?.user.name,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id)
          )[0]?.user?.photo_path,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id)
          )[0]?.user.mobile_phone,
          payload
        );
    } catch (error) {
      showErrorNotification(translateFunction("Failed to Initialize Call"));
    }
  };
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className={`${isRtl ? "flex-row-reverse" : "flex-row"} chat-screen-top`}
    >
      <ArrowIcon
        className={`${isRtl ? "rotate-[180deg]" : ""}`}
        onClick={() => {
          setMain("main");
          openChat(null);
          close();
          setReplyMessage(null);
          if (isPrivate) {
            closeWidget();
          }
        }}
      ></ArrowIcon>
      {getNew(chats, activeChat).length > 0 && (
        <span className="new-chat-num">
          {getNew(chats, activeChat).length > 0 &&
            getNew(chats, activeChat).length}
        </span>
      )}
      <div
        className={`${
          isRtl
            ? "flex-row-reverse ml-[0px] mr-[11px]"
            : "mr-[0px] ml-[11px] flex-row"
        } user-top-chat`}
      >
        {activeChat && activeChat.channel_members && (
          <div className="img-uer" onClick={() => openDetails()}>
            <ChatPhoto
              user={
                activeChat.channel_members.filter(
                  (user) => String(user.user_id) !== String(getUserChat()?.id)
                )[0]?.user
              }
              width={40}
              height={40}
            />
          </div>
        )}
        {activeChat && activeChat.channel_members && (
          <div
            className={`${
              isRtl ? "mr-[11px] ml-0" : "ml-[11px]"
            } user-name-top-chat`}
          >
            {(activeChat.status || activeChat.activeDate) && (
              <div className="user-status">{getStatues()}</div>
            )}
            {(activeChat.channel_members &&
              activeChat.channel_members.filter(
                (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
              )[0] &&
              activeChat.channel_members.filter(
                (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
              )[0]?.user &&
              activeChat.channel_members.filter(
                (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id)
              )[0]?.user.name) ||
              "User-" + activeChat.id}
          </div>
        )}
      </div>

      <div
        className={`${
          isRtl
            ? "left-[30px] flex-row-reverse right-[initial]"
            : "right-[30px] flex-row left-[initial]"
        } chat-top-contact`}
      >
        <VideoIcon
          className={`${callLoading === "video" && "loading-svg"} vcall ${
            isRtl ? "ml-[20px] mr-0" : "ml-0 mr-[20px]"
          }`}
          onClick={() => {
            videoCallFunction();
          }}
        ></VideoIcon>
        <CallIcon
          className={`${callLoading === "voice" && "loading-svg"} call`}
          onClick={() => {
            audioCallFunction();
          }}
        ></CallIcon>
      </div>
    </div>
  );
}

export default ChatHeader;
