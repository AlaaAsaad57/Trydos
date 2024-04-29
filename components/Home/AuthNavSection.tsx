import { useDispatch, useSelector } from "react-redux";
import ChatIcon from "public/svg/ChatIcon.svg";
import CartIcon from "public/svg/CartIcon.svg";
import { translate } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller } from "store/chat/actions";
import { getNew } from "components/Chat/chatsFunctions";
import ChatNotification from "./ChatNotification";
function AuthNavSection() {
  const language = useSelector((state: any) => state.homepage.language);
  const loading = useSelector((state: any) => state.chat.loading);
  const chatVar = useSelector((state: any) => state.chat.chatVar);
  const chats = useSelector((state: any) => state.chat.data);
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();

  return (
    <>
      {!loading && (
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
      )}
      <div
        className="nav-question-item"
        style={{ marginRight: "30px", marginLeft: "0px" }}
        onClick={() => {
          // dispatch(ChatConroller(true));
        }}
      >
        <CartIcon />
      </div>
      <div
        className={`welcome-user ${language + "-medium"}`}
        style={{ marginRight: "12px", marginLeft: "0px" }}
      >
        {translate("Hello", language)} {user?.name && <span>,</span>}{" "}
        <span className={`${language + "-light"}`}>{user?.name}</span>
      </div>
      <UserAvatar
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        avatar={user?.avatar}
      />
    </>
  );
}

export default AuthNavSection;
