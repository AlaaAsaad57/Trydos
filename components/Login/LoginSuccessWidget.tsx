import { translate } from "utils/functions";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import Border from "../global/Border";
import LoginSuccessIcon from "public/svg/LoginSuccessIcon.svg";
function LoginSuccessWidget({ close }) {
  const user = useSelector((state: any) => state.auth.user);
  const language = useSelector((state: any) => state.homepage.language);
  useEffect(() => {
    setTimeout(() => {
      close();
    }, 3000);
  }, []);
  return (
    <div className="login-widget-container" style={{ height: "287px" }}>
      <div
        className="login-label-container"
        style={{ width: "390px", height: "287px" }}
      >
        <Border color={null} height={287} width={390} />
        <div className="login-label login-success-container">
          <LoginSuccessIcon />
          <div className={`${language + "-regular"}  login-success-label`}>
            {translate("Welcome", language)} {user?.name}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginSuccessWidget;
