"use client";

import { LogError, translateFunction } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller, isGuestName } from "utils/tinyUtils";
import { getNew } from "components/Chat/chatsFunctions";
import ChatNotification from "./ChatNotification";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { UserData } from "utils/cookies/cookie-manager";
import home from "services/home";
import { showErrorNotification } from "store/notifications/reducer";

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
      const userChatCookie: any = useAppStore.getState().userChat;
      const userDataCookie: any = useAppStore.getState().userProfile;
      if (userChatCookie && userChatCookie?.id) {
        let num = home.getNotificationPermissionStatus();

        if (num === -1) {
          setNotificationModal(true);
          return;
        }
        if (num === 0) {
          showErrorNotification(
            translateFunction(
              "Notification Is Not Enabled! please Allow Notification Access",
            ),
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
      LogError({
        error: error,
        scenario: "error in openChatAction in AuthNavSection ",
      });
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
          <img src="/icons/ChatIcon.svg" data-pw="Chat-Icon" />
        ) : (
          !LoggingOut &&
          !chatVar && <ChatNotification num={getNew(chats).length} />
        )}
        {!LoggingOut && chatVar && <img src="/icons/ChatIcon.svg" />}
      </div>
      <div
        className={`welcome-user ${language + "-medium"}`}
        style={{ marginRight: "12px", marginLeft: "0px" }}
      >
        {translate("Hello", language)}{" "}
        {userData?.name && !isGuestName(userData?.name) && (
          <>
            <span>,</span>{" "}
            <span className={`${language + "-light"}`} data-pw="NavUserName">
              {userData?.name}
            </span>
          </>
        )}
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
