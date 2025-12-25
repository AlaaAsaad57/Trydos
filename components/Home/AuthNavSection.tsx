"use client";
import ChatIcon from "public/svg/ChatIcon";
import { translateFunction } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller } from "utils/tinyUtils";
import { getNew } from "components/Chat/chatsFunctions";
import ChatNotification from "./ChatNotification";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import home from "services/home";
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";

function AuthNavSection({
  onClick,
  userData,
}: {
  onClick: () => void;
  userData: UserData;
}) {
  const {
    language,
    chatVar,
    data: chats,
    userChat,
    setShouldAuthinticated,
    setLoginOpen,
    setNotificationModal,
    setChatOpen,
    LoggingOut,
    showNotificaionCircle,
    setMain,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const openChatAction = async () => {
    try {
      const userChatCookie: any = getCookie(COOKIE_NAMES.USER_CHAT);
      const userDataCookie: any = getCookie(COOKIE_NAMES.USER_DATA);
      if (userChatCookie && userChatCookie?.id) {
        let num = home.getNotificationPermissionStatus();

        if (num === -1) {
          setNotificationModal(true);
          return;
        }
        if (num === 0) {
          showErrorNotification(
            translateFunction(
              "Notification Is Not Enabled! please Allow Notification Access"
            )
          );
          return;
        }
        if (num === 1) {
          setChatOpen(true);
          ChatConroller(true);
          setMain("main");
          await home.AllowNotifications();
        }
        setChatOpen(true);
        ChatConroller(true);
      } else {
        if (userDataCookie && userDataCookie?.phone !== "0") {
          setShouldAuthinticated("open chat");
        } else {
          setLoginOpen(true);
        }
      }
    } catch (error) {
      console.error("Error opening chat:", error);
    }
  };

  return (
    <>
      <div
        className={`${chatVar && "active-nav-item"} nav-question-item ${
          LoggingOut ? "cursor-not-allowed opacity-80" : ""
        }`}
        style={{
          marginRight:
            (!chatVar && getNew(chats).length === 0) || chatVar
              ? "30px"
              : "20px",
          marginLeft: "30px",
          transform: !chatVar && getNew(chats).length > 0 && "translateY(-1px)",
        }}
        onClick={() => {
          openChatAction();
        }}
      >
        {!LoggingOut && !chatVar && getNew(chats).length === 0 ? (
          <ChatIcon data-cy="Chat-Icon" />
        ) : (
          !LoggingOut &&
          !chatVar && <ChatNotification num={getNew(chats).length} />
        )}
        {!LoggingOut && chatVar && <ChatIcon />}
      </div>
      <div
        className={`welcome-user ${language + "-medium"}`}
        style={{ marginRight: "12px", marginLeft: "0px" }}
      >
        {translate("Hello", language)}{" "}
        {(userData?.name || userData?.name) && <span>,</span>}{" "}
        <span className={`${language + "-light"}`} data-cy="NavUserName">
          {userData?.name}
        </span>
      </div>
      <UserAvatar
        showIndicator={Boolean(showNotificaionCircle.length)}
        onClick={() => {
          onClick();
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.OPEN_SIDE_MENU,
          // });
        }}
        avatar={userData?.image}
      />
    </>
  );
}

export default AuthNavSection;
