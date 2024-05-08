import React, { useEffect, useState } from "react";
import LogoAuth from "public/svg/LogoAuth.svg";
import { useDispatch, useSelector } from "react-redux";
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
import dynamic from "next/dynamic";
const LoginMethods = dynamic(() => import("./LoginMethods"));
interface LoginWidgetProps {
  close: Function;
}
import Animated from "react-mount-animation";
function NewLoginWidget({ close }: LoginWidgetProps) {
  const [stepIndicator, setStepIndcator] = useState(-1);
  const [signStep, setSignStep] = useState("");
  const [operation, setOperation] = useState("login");
  const [showMethods, setShowMethods] = useState(false);

  const [Name, setName] = useState("");
  const [success, setSuccess] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [rendere, setRender] = useState(true);
  const [pins, setPins] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [MessageMethod, setMessageMethod] = useState("");
  const [failedLogin, setFailed] = useState(false);
  const [wrongNumber, setWrongNumber] = useState(false);
  const language = useSelector((state: any) => state.homepage.language);
  const { VerifyOtpHook, SendOtpHook } = useAuthHooks();
  const verficationID = useSelector((state: any) => state.auth.verficationID);
  const user = useSelector((state: any) => state.auth.Tempuser);
  useEffect(() => {
    setTimeout(() => {
      setStepIndcator(0);
    }, 1500);
  }, []);
  const loginFunc = async (e) => {
    await VerifyOtpHook({
      code: e,
      EditPhoneFunc: () => {},
      Username: "",
      verificationID: verficationID,
      errorCallback: () => {
        setFailed(true);
        setTimeout(() => {
          setPins("");
          setRender(false);
          setFailed(false);
          setTimeout(() => {
            setRender(true);
          }, 300);
        }, 1000);
      },
      successCallback: (exists, name) => {
        setTimeout(() => {
          if (operation === "signup") {
            if (exists && name.length > 1) {
              setSignStep("alreadyExists");
              setStepIndcator(6);
            } else if (exists && !(name.length > 1)) {
              setStepIndcator(7);
            }
            if (!exists) {
              FinaliseLogin();
              setSignStep("welcomeSignup");
              setStepIndcator(7);
            }
          } else {
            if (exists && name.length > 1) {
              FinaliseLogin();
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
        }, 2000);
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

  const FinaliseLogin = () => {
    AuthService.ConfirmSignIn();
  };
  const mountAnim = ` 
  0% {transform:translateX(800px)}
  100% {transform:translateX(0px)}
`;
  const unmountAnim = `
0% {transform:translateX(0px)}
100% {transform:translateX(-800px)}
`;

  return (
    <div
      className={`login-widget-container login-w2-container pb-${stepIndicator} step${stepIndicator}`}
      id="widget-auth"
      style={{
        backgroundColor: stepIndicator >= 6 && getPageColor(),
        height: "100%",
        overflow: "hidden",
      }}
    >
      <LogoAuth
        className="logo-auth"
        id="logo-auth"
        style={
          stepIndicator > 0 && window.innerWidth < 900
            ? {
                position: "absolute",
                top: "50px",
                left: "40px",
              }
            : {
                justifySelf: "center",
                alignSelf: "flex-start",
                marginLeft: "82px",
              }
        }
      />

      {window.innerWidth > 601 ? (
        <>
          {
            <div
              className={`animation-row-container ${
                stepIndicator === -1 && "margin-none"
              }`}
            >
              <Animated.div
                unmountTime={0.5}
                className="animated-container"
                show={stepIndicator === 0}
                mountAnim={mountAnim}
                style={{
                  animationFillMode: "forwards",
                }}
                unmountAnim={unmountAnim}
              >
                <div
                  className="login-privacy-text"
                  style={{ opacity: stepIndicator === -1 ? "0" : "1" }}
                >
                  {translate(
                    "To Take Advantage Of All The Advantages Of The Application, Please Join Us In Quick And Easy Steps And For Just One Time",
                    language
                  )}
                </div>
                <div
                  className="login-privacy-text-2"
                  style={{ opacity: stepIndicator === -1 ? "0" : "1" }}
                >
                  {translate("Why We Know You ?", language)}
                </div>
                <div
                  className="login-button-group"
                  style={{ opacity: stepIndicator === -1 ? "0" : "1" }}
                >
                  <div
                    className="login-button"
                    onClick={() => {
                      if (window.innerWidth > 912) {
                        setShowMethods(!showMethods);
                        setOperation("login");
                      } else {
                        setStepIndcator(2);
                        setOperation("login");
                      }
                    }}
                  >
                    {translate("I have Already Account", language)}
                  </div>
                  {showMethods && (
                    <LoginMethods
                      confirm={() => {
                        setStepIndcator(2);
                        setShowMethods(!showMethods);
                      }}
                    />
                  )}
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
              </Animated.div>
              <PrivacyConfirm
                stepIndicator={stepIndicator}
                setStepIndcator={(e) => setStepIndcator(e)}
              />

              <PhoneInput
                inputValue={inputValue}
                wrongNumber={wrongNumber}
                setWrongNumber={(e) => setWrongNumber(e)}
                setInputValue={(e) => setInputValue(e)}
                stepIndicator={stepIndicator}
                setStepIndcator={(e) => setStepIndcator(e)}
                operation={operation}
              />
              <SendMethod
                stepIndicator={stepIndicator}
                setWrongNumber={(e) => setWrongNumber(e)}
                setStepIndcator={(e: number) => setStepIndcator(e)}
                setMessageMethod={(e: string) => setMessageMethod(e)}
                inputValue={inputValue}
              />

              <LogInPins
                expired={expired}
                stepIndicator={stepIndicator}
                setDisabled={(e) => {
                  setDisabled(e);
                  setExpired(e);
                }}
                resend={() => {
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
                  setDisabled(false);
                  setExpired(false);
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
              <Animated.div
                unmountTime={0.5}
                className="animated-container"
                show={stepIndicator === 7}
                mountAnim={mountAnim}
                style={{
                  animationFillMode: "forwards",
                }}
                unmountAnim={unmountAnim}
              >
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
              </Animated.div>
            </div>
          }
        </>
      ) : (
        <>
          <Animated.div
            unmountTime={0.5}
            className="animated-container"
            show={stepIndicator === 0}
            mountAnim={mountAnim}
            style={{
              animationFillMode: "forwards",
            }}
            unmountAnim={unmountAnim}
          >
            <div
              className="login-privacy-text"
              style={{ opacity: stepIndicator === -1 ? "0" : "1" }}
            >
              {translate(
                "To Take Advantage Of All The Advantages Of The Application, Please Join Us In Quick And Easy Steps And For Just One Time",
                language
              )}
            </div>
            <div
              className="login-privacy-text-2"
              style={{ opacity: stepIndicator === -1 ? "0" : "1" }}
            >
              {translate("Why We Know You ?", language)}
            </div>
            <div
              className="login-button-group"
              style={{ opacity: stepIndicator === -1 ? "0" : "1" }}
            >
              <div
                className="login-button"
                onClick={() => {
                  if (window.innerWidth > 912) {
                    setShowMethods(!showMethods);
                    setOperation("login");
                  } else {
                    setStepIndcator(2);
                    setOperation("login");
                  }
                }}
              >
                {translate("I have Already Account", language)}
              </div>
              {showMethods && (
                <LoginMethods
                  confirm={() => {
                    setStepIndcator(2);
                    setShowMethods(!showMethods);
                  }}
                />
              )}
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
          </Animated.div>
          <PrivacyConfirm
            stepIndicator={stepIndicator}
            setStepIndcator={(e) => setStepIndcator(e)}
          />

          <PhoneInput
            inputValue={inputValue}
            wrongNumber={wrongNumber}
            setWrongNumber={(e) => setWrongNumber(e)}
            setInputValue={(e) => setInputValue(e)}
            stepIndicator={stepIndicator}
            setStepIndcator={(e) => setStepIndcator(e)}
            operation={operation}
          />
          <SendMethod
            stepIndicator={stepIndicator}
            setWrongNumber={(e) => setWrongNumber(e)}
            setStepIndcator={(e: number) => setStepIndcator(e)}
            setMessageMethod={(e: string) => setMessageMethod(e)}
            inputValue={inputValue}
          />

          <LogInPins
            expired={expired}
            stepIndicator={stepIndicator}
            setDisabled={(e) => {
              setDisabled(e);
              setExpired(e);
            }}
            resend={() => {
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
              setDisabled(false);
              setExpired(false);
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
          <Animated.div
            unmountTime={0.5}
            className="animated-container"
            show={stepIndicator === 7}
            mountAnim={mountAnim}
            style={{
              animationFillMode: "forwards",
            }}
            unmountAnim={unmountAnim}
          >
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
          </Animated.div>
        </>
      )}
      <SignSteps
        signStep={signStep}
        stepIndicator={stepIndicator}
        setStepSign={(e) => {
          setSignStep(e);
        }}
        Name={Name}
        user={user}
        operation={operation}
        FinaliseLogin={() => FinaliseLogin()}
        close={() => close()}
        setStepIndactor={(e) => setStepIndcator(e)}
        inputValue={inputValue}
      />
      <Animated.div
        unmountTime={0.5}
        className="animated-container"
        show={stepIndicator === 1 || stepIndicator === 0}
        mountAnim={mountAnim}
        style={{
          animationFillMode: "forwards",
        }}
        unmountAnim={unmountAnim}
      >
        <div
          className="take-look-text"
          onClick={() => close()}
          style={{
            opacity: stepIndicator === -1 ? "0" : "1",
            marginTop: stepIndicator === 1 && "29px",
          }}
        >
          {translate("Later, Take A Look At The App", language)}
        </div>
      </Animated.div>

      {(stepIndicator > 1 || window.innerWidth > 600) && (
        <span id="login-close-icon" onClick={() => close()}>
          {" "}
          <svg
            onClick={() => close()}
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
        </span>
      )}
    </div>
  );
}

export default NewLoginWidget;
