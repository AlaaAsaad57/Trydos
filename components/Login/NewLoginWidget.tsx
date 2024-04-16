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
import SignSteps from "./SignSteps";
import InputName from "./InputName";
import AuthService from "services/auth";
import { useAuthHooks } from "Hooks/AuthHooks";
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
  const [signStep, setSignStep] = useState("");
  const [Name, setName] = useState("");
  const [success, setSuccess] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [rendere, setRender] = useState(true);
  const [pins, setPins] = useState("");
  const [inputValue, setInputValue] = useState("login");
  const [MessageMethod, setMessageMethod] = useState("");
  const [failedLogin, setFailed] = useState(false);
  const [wrongNumber, setWrongNumber] = useState(false);
  const language = useSelector((state: any) => state.homepage.language);
  const { VerifyOtpHook, SendOtpHook } = useAuthHooks();
  const verficationID = useSelector((state: any) => state.auth.verficationID);
  const user = useSelector((state: any) => state.auth.user);
  const loginFunc = async (e) => {
    await VerifyOtpHook({
      code: e,
      EditPhoneFunc: () => {},
      Username: "",
      verificationID: verficationID,
      errorCallback: () => {
        setFailed(true);
      },
      successCallback: (exists, name) => {
        if (operation === "signup") {
          if (exists && name.length > 1) {
            setSignStep("alreadyExists");
            setStepIndcator(6);
          } else if (exists && !(name.length > 1)) {
            setStepIndcator(7);
          }
          if (!exists) {
            setSignStep("welcomeSignup");
            setStepIndcator(7);
          }
        } else {
          if (exists && name.length > 1) {
            setSignStep("welcomeLogin");
            setStepIndcator(6);
          } else if (exists && !(name.length > 1)) {
            setStepIndcator(7);
          }
          if (!exists) {
            setSignStep("notFound");
            setStepIndcator(6);
          }
        }
      },
    });
  };

  const getPageColor = () => {
    if (stepIndicator === 6 && signStep === "welcomeLogin") {
      return "#E0FFEE";
    }
    if (stepIndicator === 7) {
      return "#F4FFF4";
    }
    if (stepIndicator === 6 && signStep === "welcomeSignup") {
      return "#BCFFDF";
    }
    if (operation === "signup" && signStep === "alreadyExists") {
      return "#F4F8FF";
    } else if (stepIndicator === 6 && signStep === "notFound") {
      return "#FFF9F0";
    } else return "#F4FFF4";
  };
  return (
    <div
      className={`login-widget-container login-w2-container `}
      style={{ backgroundColor: stepIndicator >= 6 && getPageColor() }}
    >
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
          wrongNumber={wrongNumber}
          setWrongNumber={(e) => setWrongNumber(e)}
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
          setWrongNumber={(e) => setWrongNumber(e)}
          setStepIndcator={(e: number) => setStepIndcator(e)}
          setMessageMethod={(e: string) => setMessageMethod(e)}
          inputValue={inputValue}
        />
      )}
      {stepIndicator === 5 && (
        <LogInPins
          expired={expired}
          setDisabled={(e) => {
            SendOtpHook({
              mobilePhone: inputValue,
              is_via_whatsapp: MessageMethod === "WA" ? "1" : "0",
              step: () => {},
              successCallback: function () {},
              errorCallback: function () {
                setStepIndcator(3);
                setWrongNumber(true);
              },
            });
            setDisabled(e);
            setExpired(e);
          }}
          setStepIndactor={(e) => setStepIndcator(e)}
          rendere={rendere}
          inputValue={inputValue}
          disabled={disabled}
          Submit={(e) => loginFunc(e)}
          successLogin={success}
          wrongNumber={wrongNumber}
          failedLogin={failedLogin}
          setPin={(e: string) => setPins(e)}
          pin={pins}
          MessageMethod={MessageMethod}
        />
      )}
      {stepIndicator === 6 && (
        <SignSteps
          signStep={signStep}
          setStepSign={(e) => {
            setSignStep(e);
          }}
          Name={Name}
          user={user}
          operation={operation}
          close={() => close()}
          setStepIndactor={(e) => setStepIndcator(e)}
          inputValue={inputValue}
        />
      )}
      {stepIndicator === 7 && (
        <InputName
          value={Name}
          setName={(e) => setName(e)}
          submit={() => {
            AuthService.UpdateName(Name);
            if (operation === "login") {
              if (user.already_exists) setSignStep("welcomeLogin");
              else setSignStep("welcomeSignup");
            }
            if (operation === "signup") {
              if (user.already_exists) {
                setSignStep("welcomeLogin");
              } else {
                setSignStep("welcomeSignup");
              }
            }
            setStepIndcator(6);
          }}
        />
      )}
    </div>
  );
}

export default NewLoginWidget;
