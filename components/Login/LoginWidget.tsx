import { useState } from "react";
import Border from "../global/Border";
import { translate } from "utils/functions";
import LoginIcon from "public/svg/login.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import AccountIcon from "public/svg/AccountIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import LoginPhone from "./LoginPhone";
import LoginSuccessWidget from "./LoginSuccessWidget";
import { ReInitialise } from "store/auth/actions";
import "styles/login.css";
import { UpdateName } from "../../store/auth/actions";
import ManIcon from "public/svg/manIcon.svg";
import LeftArrowIcon from "public/svg/LeftArrowIcon.svg";
interface LoginWidgetProps {
  close: Function;
  loginSuccessVar: boolean;
  setLoginSucces: Function;
}
function LoginWidget({
  close,
  loginSuccessVar,
  setLoginSucces,
}: LoginWidgetProps) {
  const dispatch = useDispatch();
  const [step, setStep] = useState("");
  const [value, setValue] = useState("");
  const wrongNumber = useSelector((state: any) => state.auth.wrongNumber);
  const user = useSelector((state: any) => state.auth.user);
  const language = useSelector((state: any) => state.homepage.language);
  const [loginMethod, setLoginMethod] = useState(null);
  return (
    <>
      {loginSuccessVar ? (
        user.already_exists === false && (!user.name || user.name === " ") ? (
          <div className="login-widget-container" style={{ height: "287px" }}>
            <div
              className="login-label-container"
              style={{
                width: "290px",
                height: "134px",
                flexDirection: "column",
                padding: "10px",
              }}
            >
              <>
                {" "}
                <div
                  className="phone-input-element"
                  style={{ height: "50px", fontSize: "12px", color: "#5d5d5d" }}
                >
                  {translate("Enter Your Name", language)}
                </div>
                <div
                  className="phone-input-element"
                  style={{ height: "50px", padding: "12px" }}
                >
                  <Border color={null} height={50} width={250} />
                  <ManIcon style={{ minWidth: "20px" }} />
                  <label htmlFor="phone" className="no-label">
                    Name
                  </label>
                  <input
                    className="login-phone-input"
                    style={{ zIndex: "2" }}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                    }}
                  />
                  {value.length > 1 && (
                    <LeftArrowIcon
                      style={{
                        position: "absolute",
                        right: "36px",
                        top: "20px",
                        zIndex: "3",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        UpdateName(value);
                      }}
                    />
                  )}
                </div>
              </>
            </div>
          </div>
        ) : (
          <LoginSuccessWidget close={() => close()} />
        )
      ) : (
        <div className="login-widget-container">
          <div className="login-label-container">
            <Border color={null} width={null} height={40} />
            <div className="login-label">
              <div className="login-label-title">
                <LoginIcon />
                <div className={`${language + "-medium"}  login-label-text`}>
                  {translate("Login", language)}
                </div>
              </div>
              <div
                className="login-close-icon"
                onClick={() => {
                  close();
                  setLoginMethod(null);
                }}
              >
                <CloseIcon />
              </div>
            </div>
          </div>
          {/* <LoginQR
            setLoginSucces={() => setLoginSucces(true)}
            selectedMethod={loginMethod === "qr"}
            selectMethod={() => {
              if (loginMethod !== "qr") dispatch(ReInitialise());
              setLoginMethod("qr");
            }}
          /> */}
          <LoginPhone
            newAccount={step === "SignUp"}
            LoginSuccess={() => setLoginSucces(true)}
            selectedMethod={loginMethod === "phone"}
            selectMethod={() => {
              if (loginMethod !== "phone") {
                dispatch({ type: "RE-INITILIASE" });
              }
              setLoginMethod("phone");
            }}
          />
          <div className={`${language + "-regular"}  login-blue-question`}>
            {translate("Don’t Have Account?", language)}
          </div>
          {step !== "SignUp" && (
            <div
              className={`${
                wrongNumber && "absolute-create-button"
              } login-label-container create-account-button`}
            >
              <Border color={null} width={null} height={50} />
              <div
                className="login-label"
                onClick={() => {
                  ReInitialise();
                  setStep("SignUp");
                  setLoginMethod("phone");
                }}
              >
                <div className="login-label-title">
                  <AccountIcon />
                  <div className={`${language + "-regular"}  login-label-text`}>
                    {translate("Create New Account", language)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default LoginWidget;
