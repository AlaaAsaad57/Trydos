import { translate } from "utils/functions";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import AuthNavSection from "./AuthNavSection";

import CartIcon from "public/svg/CartIcon.svg";
import React from "react";
import NotificationsTest from "components/global/NotificationsTest";

interface UserNavTopSectionProps {
  loginOpen: boolean;
  openLogin: Function;
}
function UserNavTopSection({ loginOpen, openLogin }: UserNavTopSectionProps) {
  const language = useSelector((state: any) => state.homepage.language);
  const user = useSelector((state: any) => state.auth.user);
  useEffect(() => {
    setTimeout(() => {
      if (true) {
        // getStories().then((d) => {
        //   dispatch({ type: "STORY-DATA", payload: d });
        // });
      }
    }, 1000);
  }, [user]);
  const dispatch = useDispatch();
  const enableCart = (s) => {
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: s });
  };
  const searchEnabled = useSelector((state: any) => state.Search.enable);

  return (
    <div
      className={`${
        searchEnabled && "hidden"
      } user-nav-container md:min-w-[400px]`}
    >
      <div
        className="nav-question-item"
        style={{ marginRight: "30px", marginLeft: "0px" }}
      >
        {user && <NotificationsTest />}
      </div>
      <div
        className="nav-question-item"
        style={{ marginRight: "30px", marginLeft: "0px" }}
        onClick={() => {
          // dispatch(ChatConroller(true));
        }}
      >
        <CartIcon onClick={() => enableCart(true)} />
      </div>
      {!user && (
        <>
          <div className={`welcome-user ${language + "-medium"}`}>
            <span className={`${language + "-medium"}`}>
              {" "}
              {translate("Hello", language)}{" "}
            </span>
            <span className={`${language + "-medium"}`}>,</span>{" "}
            <span className={`${language + "-light"}`}>
              {translate("Welcome", language)}
            </span>
          </div>
          <div className="nav-question-item">
            <img
              src="/svg/questionIcon.svg"
              width={15}
              height={15}
              alt="info icon"
            />
            <span
              className={`${language + "-light"}`}
              style={{
                display: "flex",
                color: "rgba(248, 85, 85, 1)",
                fontSize: "14px",
                marginLeft: "5px",
                cursor: "pointer",
              }}
            >
              {translate(
                `${loginOpen ? "Can We Know You ?" : "Why We Know You ?"}`,
                language
              )}
            </span>
          </div>
          <div
            data-testid="login-text"
            className="nav-question-item"
            onClick={() => {
              openLogin(true);
            }}
          >
            <img src="/svg/login.svg" width={15} height={15} alt="login" />

            <span
              className={`${language + "-regular"}`}
              style={{
                display: "flex",
                color: "#707070",
                fontSize: "14px",
                marginLeft: "5px",
                cursor: "pointer",
                left: "-8px",
              }}
            >
              {translate("Login", language)}
            </span>
          </div>
          <div className="nav-question-item">
            <Image
              src="/svg/userIcon.svg"
              width={30}
              height={30}
              alt="user-icon"
            />
          </div>
        </>
      )}
      {user && <AuthNavSection />}
    </div>
  );
}

export default UserNavTopSection;
