import { translate } from "utils/functions";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import dynamic from "next/dynamic";
import Image from "next/image";
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
