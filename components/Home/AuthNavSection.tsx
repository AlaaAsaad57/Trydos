import { useDispatch, useSelector } from "react-redux";
import ChatIcon from "public/svg/ChatIcon.svg";
import { Sendevent, translateFunction } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller } from "store/chat/actions";
import { getNew } from "components/Chat/chatsFunctions";
import ChatNotification from "./ChatNotification";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { changeToken } from "store/homepage/cachedActions";
function AuthNavSection() {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const chatVar = useSelector((state: StateInterface) => state.chat.chatVar);
  const user = useSelector((state: StateInterface) => state.auth.user);

  const chats = useSelector((state: StateInterface) => state.chat.data);
  const dispatch = useDispatch();

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
            marginLeft: "0px",
            transform:
              !chatVar && getNew(chats).length > 0 && "translateY(-1px)",
          }}
          onClick={() => {
            Sendevent({
              event: "button_clicked",
              value: "chat_nav_bar_button",
            });
            dispatch(ChatConroller(true));
          }}
        >
          {!chatVar && getNew(chats).length === 0 ? (
            <ChatIcon />
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
        {translate("Hello", language)} {user?.name && <span>,</span>}{" "}
        <span className={`${language + "-light"}`}>{user?.name}</span>
      </div>
      <UserAvatar
        onClick={() => {
          Sendevent({
            event: "button_clicked",
            value: "me_nav_bar_button",
          });
          localStorage.clear();
          changeToken({ key: "DEVICE-TOKEN", deleteOption: true });
          changeToken({ key: "MARKET-TOKEN", deleteOption: true });
          changeToken({ key: "token", deleteOption: true });
          Cookies.remove("DEVICE-TOKEN");
          Cookies.remove("MARKET-TOKEN");
          Cookies.remove("token");
          window.location.reload();
        }}
        avatar={user?.avatar?.src ?? user.avatar}
      />
    </>
  );
}

export default AuthNavSection;
