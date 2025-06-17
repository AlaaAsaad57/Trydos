import ChatIcon from "public/svg/ChatIcon.svg";
import { translateFunction } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller } from "utils/tinyUtils";
import { getNew } from "components/Chat/chatsFunctions";
import ChatNotification from "./ChatNotification";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { GA_EVENT_NAMES } from "utils/GAEvents";

function AuthNavSection({ onClick }: { onClick: () => void }) {
  const {
    language,
    userProfile,
    user,
    chatVar,
    data: chats,
    currency,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };

  return (
    <>
      {
        <div
          className={`${chatVar && "active-nav-item"} nav-question-item`}
          style={{
            marginRight:
              (!chatVar && getNew(chats).length === 0) || chatVar
                ? "30px"
                : "20px",
            marginLeft: "30px",
            transform:
              !chatVar && getNew(chats).length > 0 && "translateY(-1px)",
          }}
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CHAT_ICON,
            // });
            ChatConroller(true);
          }}
        >
          {!chatVar && getNew(chats).length === 0 ? (
            <ChatIcon data-cy="Chat-Icon" />
          ) : (
            !chatVar && <ChatNotification num={getNew(chats).length} />
          )}
          {chatVar && <ChatIcon />}
        </div>
      }

      <div
        className={`welcome-user ${language + "-medium"}`}
        style={{ marginRight: "12px", marginLeft: "0px" }}
      >
        {translate("Hello", language)}{" "}
        {(userProfile?.name || user?.name) && <span>,</span>}{" "}
        <span className={`${language + "-light"}`} data-cy="NavUserName">
          {userProfile?.name}
        </span>
      </div>
      <UserAvatar
        onClick={() => {
          onClick();
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.OPEN_SIDE_MENU,
          // });
        }}
        avatar={userProfile?.image}
      />
    </>
  );
}

export default AuthNavSection;
