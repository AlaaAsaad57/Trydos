"use client";
import ChatIcon from "public/svg/ChatIcon.svg";
import { translateFunction } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller } from "utils/tinyUtils";
import { getNew } from "components/Chat/chatsFunctions";
import ChatNotification from "./ChatNotification";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { UserData } from "utils/cookies/cookie-manager";

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
    setChatOpen,
    showNotificaionCircle,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };

  return (
    <>
      <div
        className={`${chatVar && "active-nav-item"} nav-question-item`}
        style={{
          marginRight:
            (!chatVar && getNew(chats).length === 0) || chatVar
              ? "30px"
              : "20px",
          marginLeft: "30px",
          transform: !chatVar && getNew(chats).length > 0 && "translateY(-1px)",
        }}
        onClick={() => {
          if (userChat && userChat.id) {
            setChatOpen(true);
            ChatConroller(true);
          } else {
            if (userData && userData?.phone !== "0") {
              setShouldAuthinticated("open chat");
            } else {
              setLoginOpen(true);
            }
          }
        }}
      >
        {!chatVar && getNew(chats).length === 0 ? (
          <ChatIcon data-cy="Chat-Icon" />
        ) : (
          !chatVar && <ChatNotification num={getNew(chats).length} />
        )}
        {chatVar && <ChatIcon />}
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
