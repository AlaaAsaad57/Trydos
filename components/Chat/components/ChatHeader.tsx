import { getNew, showDate } from "../chatsFunctions";
import { getUserChat, LogError } from "utils/functions";
import { makeVideoCall, makeVoiceCall } from "store/chat/callActions";
import { translateFunction } from "../../../utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import ChatPhoto from "./ChatPhoto";

import { showErrorNotification } from "store/notifications/reducer";

function ChatHeader({
  chats,
  activeChat,
  isBlockedEachOther,
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
    isCallIncoming,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const time_differenc = (date) => {
    let value =
      (new Date(Server_time).getTime() - new Date(date).getTime()) / 1000 / 60;
    return value;
  };
  const getStatues = () => {
    if (activeChat?.status && activeChat?.status !== "null") {
      return activeChat.status;
    } else {
      if (activeChat?.activeDate) {
        if (time_differenc(activeChat.activeDate) > 5) {
          return `${translate("last Seen ", language)} ${showDate(
            activeChat.activeDate,
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
    if (callLoading || isCallIncoming) return;
    let payload = null;
    if (isPrivate && activeChat?.order_chat_participant_id) {
      payload = {
        order_chat_participant_id: activeChat?.order_chat_participant_id,
        receiver_user_id: activeChat?.channel_members?.find(
          (s) => String(s?.user_id) !== String(getUserChat()?.id),
        )?.user_id,
        is_private: true,
      };
    }
    try {
      !callLoading &&
        makeVoiceCall(
          activeChat.id,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id),
          )[0]?.user.name,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id),
          )[0]?.user?.photo_path,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id),
          )[0]?.user.mobile_phone,
          payload,
        );
    } catch (error) {
      LogError({
        error: error,
        scenario: "initial audioCallFunction in chat header - chat widget",
      });
      showErrorNotification(translateFunction("Failed to Initialize Call"));
    }
  };

  const videoCallFunction = async () => {
    if (callLoading || isCallIncoming) return;
    let payload = null;
    if (isPrivate && activeChat?.order_chat_participant_id) {
      payload = {
        order_chat_participant_id: activeChat?.order_chat_participant_id,
        receiver_user_id: activeChat?.channel_members?.find(
          (s) => String(s?.user_id) !== String(getUserChat()?.id),
        )?.user_id,
        is_private: true,
      };
    }
    try {
      !callLoading &&
        makeVideoCall(
          activeChat.id,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id),
          )[0]?.user.name,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id),
          )[0]?.user?.photo_path,
          activeChat.channel_members.filter(
            (s) => parseInt(s.user_id) !== parseInt(getUserChat()?.id),
          )[0]?.user.mobile_phone,
          payload,
        );
    } catch (error) {
      LogError({
        error: error,
        scenario: "initial videoCallFunction in chat header - chat widget",
      });
      showErrorNotification(translateFunction("Failed to Initialize Call"));
    }
  };
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className={`${isRtl ? "flex-row-reverse" : "flex-row"} chat-screen-top`}
    >
      <img
        src="/icons/chat/arrow.svg"
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
      />
      {getNew(chats, activeChat).length > 0 && (
        <span className="new-chat-num">
          {getNew(chats, activeChat).length > 0 &&
            getNew(chats, activeChat).length}
        </span>
      )}
      <div
        onClick={() => openDetails()}
        className={`${
          isRtl
            ? "flex-row-reverse ml-[0px] mr-[11px]"
            : "mr-[0px] ml-[11px] flex-row"
        } user-top-chat`}
      >
        {activeChat && activeChat.channel_members && (
          <div className="img-uer">
            <ChatPhoto
              user={
                activeChat.channel_members.filter(
                  (user) => String(user.user_id) !== String(getUserChat()?.id),
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
            {!isBlockedEachOther &&
              (activeChat.status || activeChat.activeDate) && (
                <div className="user-status">{getStatues()}</div>
              )}
            {(activeChat.channel_members &&
              activeChat.channel_members.filter(
                (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id),
              )[0] &&
              activeChat.channel_members.filter(
                (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id),
              )[0]?.user &&
              activeChat.channel_members.filter(
                (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id),
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
        {!isPrivate && (
          <img
            src="/icons/chat/videocall.svg"
            className={`${
              (callLoading || isCallIncoming) && "opacity-40 scale-75 "
            } vcall ${isRtl ? "ml-[20px] mr-0" : "ml-0 mr-[20px]"}`}
            onClick={() => {
              if (isBlockedEachOther) {
                showErrorNotification(
                  translateFunction(
                    "You cannot send messages or calls to this user",
                    language,
                  ),
                );
                return;
              }
              videoCallFunction();
            }}
          />
        )}
        <img
          src="/icons/chat/call.svg"
          className={`${
            (callLoading || isCallIncoming) && "opacity-40 scale-75 "
          } call`}
          onClick={() => {
            if (isBlockedEachOther) {
              showErrorNotification(
                translateFunction(
                  "You cannot send messages or calls to this user",
                  language,
                ),
              );
              return;
            }
            audioCallFunction();
          }}
        />
      </div>
    </div>
  );
}

export default ChatHeader;
