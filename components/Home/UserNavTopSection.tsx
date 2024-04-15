import { translate } from "utils/functions";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuestionIcon from "public/svg/questionIcon.svg";
import LoginIcon from "public/svg/login.svg";
import UserIcon from "public/svg/userIcon.svg";
import dynamic from "next/dynamic";
import NewLoginWidget from "components/Login/NewLoginWidget";
const LoginWidget = dynamic(() => import("../Login/LoginWidget"), {
  ssr: false,
});
const AuthNavSection = dynamic(() => import("./AuthNavSection"), {
  ssr: false,
});
interface UserNavTopSectionProps {
  loginOpen: boolean;
  openLogin: Function;
}
function UserNavTopSection({ loginOpen, openLogin }: UserNavTopSectionProps) {
  const language = useSelector((state: any) => state.homepage.language);
  const user = useSelector((state: any) => state.auth.user);
  const [loginSuccessVar, setLoginSucces] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    setTimeout(() => {
      if (true) {
        // getStories().then((d) => {
        //   dispatch({ type: "STORY-DATA", payload: d });
        // });
      }
    }, 1000);
  }, [user]);
  return (
    <div className="user-nav-container">
      {loginOpen && (
        <div onClick={() => openLogin(false)} className="backdrop-login" />
      )}
      {loginOpen && (
        // <LoginWidget
        //   loginSuccessVar={loginSuccessVar}
        //   setLoginSucces={(e) => setLoginSucces(e)}
        //   close={() => openLogin(false)}
        // />
        <NewLoginWidget
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
