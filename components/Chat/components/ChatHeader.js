import ArrowIcon from "../svg/arrow";
import VideoIcon from "../svg/vcall";
import CallIcon from "../svg/call";
import CancelCallIcon from "../svg/cancel-call";
import { getNew, showDate } from "../chatsFunctions";
import { getUserChat } from "utils/functions";
import { makeVideoCall, makeVoiceCall } from "store/chat/callActions";
import { translateFunction } from "../../../utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import ChatPhoto from "./ChatPhoto";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { showErrorNotification } from "store/notifications/reducer";
import { useEffect } from "react";
function ChatHeader({
  chats,
  activeChat,
  openDetails,
  isPrivate,
  closeWidget,
}) {
  const {
    callLoading,
    Server_time,
    setMain,
    openChat,
    setReplyMessage,
    cameraPermissions,
    checkCameraPermissions,
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
          return translate("Active Now", language);
        }
      } else {
        return <a></a>;
      }
    }
  };
  const audioCallFunction = async () => {
    try {
      if (cameraPermissions === "revoked") {
        showErrorNotification(
          translateFunction(
            "Please enable notification permissions to use camera features"
          )
        );
        return;
      }
      if (cameraPermissions === "asked") {
        await checkCameraPermissions();
      }
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
          )[0]?.user.mobile_phone
        );
    } catch (error) {
      showErrorNotification(
        translateFunction(
          "Please enable notification permissions to use camera features"
        )
      );
    }
  };
  const videoCallFunction = async () => {
    try {
      if (cameraPermissions === "revoked") {
        showErrorNotification(
          translateFunction(
            "Please enable notification permissions to use camera features"
          )
        );
        return;
      }
      if (cameraPermissions === "asked") {
        await checkCameraPermissions();
      }
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
          )[0]?.user.mobile_phone
        );
    } catch (error) {
      showErrorNotification(
        translateFunction(
          "Please enable notification permissions to use camera features"
        )
      );
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
                  (user) => user.user_id !== getUserChat()?.id
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
      {!isPrivate && (
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
          {/* <CancelCallIcon
            className={`${isRtl ? "pr-4" : "pl-4"} cancel-call `}
            onClick={async () => {
              try {
                let res = await fetchData({
                  url: "/api/v1/end_call",
                  body: JSON.stringify({ user_id: getUserChat()?.id }),
                  method: "POST",
                  server: "chat",
                  reqTitle: REQUESTS_DATA.END_CALL,
                });
                if (!res.success) {
                  throw new Error(res.message);
                }
              } catch (err) {
                console.error("End call failed", err);
              }
            }}
          ></CancelCallIcon> */}
        </div>
      )}
    </div>
  );
}

export default ChatHeader;
