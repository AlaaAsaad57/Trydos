import { translate } from "utils/functions";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import QuestionIcon from "public/svg/questionIcon.svg";
import LoginIcon from "public/svg/login.svg";
import UserIcon from "public/svg/userIcon.svg";
import dynamic from "next/dynamic";
const LoginWidget = dynamic(() => import("../Login/LoginWidget"), {
  ssr: false,
});
const AuthNavSection = dynamic(() => import("./AuthNavSection"), {
  ssr: false,
});
function UserNavTopSection({ loginOpen, openLogin }) {
  const language = useSelector((state) => state.homepage.language);
  const user = useSelector((state) => state.auth.user);
  const [loginSuccessVar, setLoginSucces] = useState(false);
  return (
    <div className="user-nav-container">
      {loginOpen && (
        <div onClick={() => openLogin(false)} className="backdrop-login" />
      )}
      {loginOpen && (
        <LoginWidget
          loginSuccessVar={loginSuccessVar}
          setLoginSucces={(e) => setLoginSucces(e)}
          close={() => openLogin(false)}
        />
      )}
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
            <QuestionIcon />
            <span
              className={`${language + "-light"}`}
              style={{
                display: "flex",
                color: "#f85555ff",
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
          <div className="nav-question-item" onClick={() => openLogin(true)}>
            <LoginIcon />
            <span
              className={`${language + "-regular"}`}
              style={{
                display: "flex",
                color: "#707070",
                fontSize: "14px",
                marginLeft: "5px",
                cursor: "pointer",
              }}
            >
              {translate("Login", language)}
            </span>
          </div>
          <div className="nav-question-item">
            <UserIcon />
          </div>
        </>
      )}
      {user && <AuthNavSection />}
    </div>
  );
}

export default UserNavTopSection;
