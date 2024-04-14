import React, { useState } from "react";
import LogoAuth from "public/svg/LogoAuth.svg";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import "public/styles/newLogin.css";
import "public/styles/login.css";
import PrivacyConfirm from "./PrivacyConfirm";
import PhoneInput from "./PhoneInput";
interface LoginWidgetProps {
  close: Function;
  loginSuccessVar: boolean;
  setLoginSucces: Function;
}
function NewLoginWidget({
  close,
  loginSuccessVar,
  setLoginSucces,
}: LoginWidgetProps) {
  const [stepIndicator, setStepIndcator] = useState(0);
  const language = useSelector((state: any) => state.homepage.language);
  return (
    <div className="login-widget-container login-w2-container">
      <LogoAuth
        style={
          stepIndicator > 0
            ? {
                position: "absolute",
                top: "50px",
                left: "40px",
              }
            : {}
        }
      />
      {stepIndicator === 0 && (
        <>
          <div className="login-privacy-text">
            {translate(
              "To Take Advantage Of All The Advantages Of The Application, Please Join Us In Quick And Easy Steps And For Just One Time",
              language
            )}
          </div>
          <div className="login-privacy-text-2">
            {translate("Why We Know You ?", language)}
          </div>
          <div className="login-button-group">
            <div className="login-button" onClick={() => setStepIndcator(2)}>
              {translate("I have Already Account", language)}
            </div>
            <div className="login-button" onClick={() => setStepIndcator(1)}>
              {translate("Create New Account", language)}
            </div>
          </div>
        </>
      )}
      {stepIndicator === 1 && (
        <PrivacyConfirm
          stepIndicator={stepIndicator}
          setStepIndcator={(e) => setStepIndcator(e)}
        />
      )}
      {stepIndicator <= 3 && stepIndicator > 1 && (
        <PhoneInput
          stepIndicator={stepIndicator}
          setStepIndcator={(e) => setStepIndcator(e)}
        />
      )}
      <div className="take-look-text" onClick={() => close()}>
        {translate("Later, Take A Look At The App", language)}
      </div>
    </div>
  );
}

export default NewLoginWidget;
