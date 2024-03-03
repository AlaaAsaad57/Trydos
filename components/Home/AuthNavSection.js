import React from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatIcon from "public/svg/ChatIcon.svg";
import CartIcon from "public/svg/CartIcon.svg";
import { translate } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller } from "store/chat/actions";
function AuthNavSection() {
  const language = useSelector((state) => state.homepage.language);
  const loading = useSelector((state) => state.chat.loading);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  return (
    <>
      {!loading && (
        <div
          className="nav-question-item"
          style={{ marginRight: "30px", marginLeft: "0px" }}
          onClick={() => {
            dispatch(ChatConroller(true));
          }}
        >
          <ChatIcon />
        </div>
      )}
      <div
        className="nav-question-item"
        style={{ marginRight: "20px", marginLeft: "0px" }}
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
