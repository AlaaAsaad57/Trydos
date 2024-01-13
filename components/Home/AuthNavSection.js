import React from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatIcon from "public/svg/ChatIcon.svg";
import CartIcon from "public/svg/CartIcon.svg";
import { translate } from "utils/functions";
import UserAvatar from "./UserAvatar";
import { ChatConroller } from "store/chat/actions";
import Smartlook from "smartlook-client";
import { EventTrack } from "store/homepage/actions";
function AuthNavSection() {
  const language = useSelector((state) => state.homepage.language);
  const loading = useSelector((state) => state.chat.loading);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  return (
    <>
      {!loading && (
        <div
          aria-details={language}
          className="nav-question-item"
          style={{ marginRight: "30px", marginLeft: "0px" }}
          onClick={() => {
            dispatch(ChatConroller(true));
            EventTrack("chat-opened", null);
          }}
        >
          <ChatIcon />
        </div>
      )}
      <div
        aria-details={language}
        className="nav-question-item"
        style={{ marginRight: "20px", marginLeft: "0px" }}
        onClick={() => {
          dispatch(ChatConroller(true));
          EventTrack("cart-opened", null);
        }}
      >
        <CartIcon />
      </div>
      <div
        aria-details={language}
        className="welcome-user"
        aria-labelledby={language + "-medium"}
        style={{ marginRight: "12px", marginLeft: "0px" }}
      >
        {translate("Hello", language)} <span>,</span>{" "}
        <span aria-labelledby={language + "-light"}>{user?.name}</span>
      </div>
      <UserAvatar avatar={user?.avatar} />
    </>
  );
}

export default AuthNavSection;
