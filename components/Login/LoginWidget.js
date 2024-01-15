import React, { useState } from "react";
import Border from "../global/Border";
import { translate } from "utils/functions";
import LoginIcon from "public/svg/login.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import AccountIcon from "public/svg/AccountIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import LoginQR from "./LoginQR";
import LoginPhone from "./LoginPhone";
import LoginSuccessWidget from "./LoginSuccessWidget";
import { ReInitialise } from "store/auth/actions";
function LoginWidget({ close, loginSuccessVar, setLoginSucces }) {
  const dispatch = useDispatch();
  const wrongNumber = useSelector((state) => state.auth.wrongNumber);
  const LoginSuccess = () => {};
  const language = useSelector((state) => state.homepage.language);
  const [loginMethod, setLoginMethod] = useState(null);
  return (
    <>
      {loginSuccessVar ? (
        <LoginSuccessWidget close={() => close()} />
      ) : (
        <div className="login-widget-container">
          <div className="login-label-container">
            <Border height={40} />
            <div className="login-label">
              <div className="login-label-title">
                <LoginIcon />
                <div
                  className="login-label-text"
                  aria-labelledby={language + "-medium"}
                >
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
          <LoginQR
            setLoginSucces={() => setLoginSucces(true)}
            selectedMethod={loginMethod === "qr"}
            selectMethod={() => {
              if (loginMethod !== "qr") dispatch(ReInitialise());
              setLoginMethod("qr");
            }}
          />
          <LoginPhone
            LoginSuccess={() => setLoginSucces(true)}
            selectedMethod={loginMethod === "phone"}
            selectMethod={() => {
              if (loginMethod !== "phone") dispatch(ReInitialise());
              setLoginMethod("phone");
            }}
          />
          <div
            className="login-blue-question"
            aria-labelledby={language + "-light"}
          >
            {translate("Don’t Have Account?", language)}
          </div>
          <div
            className={`${
              wrongNumber && "absolute-create-button"
            } login-label-container create-account-button`}
          >
            <Border height={50} />
            <div className="login-label">
              <div className="login-label-title">
                <AccountIcon />
                <div
                  className="login-label-text"
                  aria-labelledby={language + "-regular"}
                >
                  {translate("Create New Account", language)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginWidget;
