import React, { useState } from "react";
import LogoAuth from "public/svg/LogoAuth.svg";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import "public/styles/newLogin.css";
import "public/styles/login.css";
import PrivacyConfirm from "./PrivacyConfirm";
import PhoneInput from "./PhoneInput";
import SendMethod from "./SendMethod";
import LogInPins from "./LogInPins";
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
  const [operation, setOperation] = useState("login");
  const [pins, setPins] = useState("");
  const [inputValue, setInputValue] = useState("login");
  const [MessageMethod, setMessageMethod] = useState("");
  const failedLogin = useSelector((state: any) => state.auth.failedLogin);
  const wrongNumber = useSelector((state: any) => state.auth.wrongNumber);
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
            <div
              className="login-button"
              onClick={() => {
                setStepIndcator(2);
                setOperation("login");
              }}
            >
              {translate("I have Already Account", language)}
            </div>
            <div
              className="login-button"
              onClick={() => {
                setStepIndcator(1);
                setOperation("signup");
              }}
            >
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
          inputValue={inputValue}
          setInputValue={(e) => setInputValue(e)}
          stepIndicator={stepIndicator}
          setStepIndcator={(e) => setStepIndcator(e)}
          operation={operation}
        />
      )}
      {stepIndicator <= 1 && (
        <div className="take-look-text" onClick={() => close()}>
          {translate("Later, Take A Look At The App", language)}
        </div>
      )}
      {stepIndicator > 1 && (
        <svg
          onClick={() => close()}
          style={{
            position: "absolute",
            top: "60px",
            right: "30px",
            cursor: "pointer",
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="16.411"
          height="16.411"
          viewBox="0 0 16.411 16.411"
        >
          <g
            id="Group_10735"
            data-name="Group 10735"
            transform="translate(-1293.141 -97.641)"
          >
            <line
              id="Line_792"
              data-name="Line 792"
              x2="20.848"
              transform="matrix(0.695, -0.719, 0.719, 0.695, 1294.105, 113.345)"
              fill="none"
              stroke="#ff5f61"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_793"
              data-name="Line 793"
              x2="20.848"
              transform="matrix(0.719, 0.695, -0.695, 0.719, 1293.849, 98.605)"
              fill="none"
              stroke="#ff5f61"
              stroke-linecap="round"
              stroke-width="1"
            />
          </g>
        </svg>
      )}
      {stepIndicator === 4 && (
        <SendMethod
          setStepIndcator={(e) => setStepIndcator(e)}
          setMessageMethod={(e) => setMessageMethod(e)}
          inputValue={inputValue}
        />
      )}
      {stepIndicator === 5 && (
        <LogInPins
          inputValue={inputValue}
          disabled={false}
          Submit={() => setStepIndcator(6)}
          successLogin={false}
          wrongNumber={wrongNumber}
          failedLogin={failedLogin}
          setPin={(e) => setPins(e)}
          pin={pins}
          MessageMethod={MessageMethod}
        />
      )}
    </div>
  );
}

export default NewLoginWidget;
