"use client";
import { useEffect, useState } from "react";
import LogoAuth from "public/svg/LogoAuth.svg";
import { useDispatch, useSelector } from "react-redux";
import { Sendevent, translateFunction } from "utils/functions";
import "public/styles/newLogin.css";
import "public/styles/login.css";
import PrivacyConfirm from "./PrivacyConfirm";
import PhoneInput from "./PhoneInput";
import SendMethod from "./SendMethod";
import LogInPins from "./LogInPins";
import SignSteps from "./SignSteps";
import InputName from "./InputName";
import AuthService from "services/auth";

import LoginMethods from "./LoginMethods";
import { AnimatedComponent } from "components/global/AnimatedComponent";
import { useParams } from "next/navigation";

function NewLoginWidget() {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [stepIndicator, setStepIndicator] = useState(-1);
  const [signStep, setSignStep] = useState("");
  const [operation, setOperation] = useState("login");
  const [showMethods, setShowMethods] = useState(false);
  const loginOpen = useSelector(
    (state: StateInterface) => state.homepage.loginOpen
  );

  const [Name, setName] = useState("");
  const [success, setSuccess] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [rendere, setRender] = useState(true);
  const [pins, setPins] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [MessageMethod, setMessageMethod] = useState("");
  const [failedLogin, setFailed] = useState(false);
  const [wrongNumberVar, setWrongNumber] = useState(false);
  const wrongNumber = useSelector(
    (state: StateInterface) => state.auth.wrongNumber
  );
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );

  const verficationID = useSelector(
    (state: StateInterface) => state.auth.verficationID
  );
  const user = useSelector((state: StateInterface) => state.auth.Tempuser);

  const SendOtpHook = async ({
    errorCallback,
    mobilePhone,
    is_via_whatsapp,
    successCallback,
  }) => {
    try {
      let errorCallbackFunc = (e) => errorCallback(e);
      await AuthService.SendOtp(
        mobilePhone,
        is_via_whatsapp,
        errorCallbackFunc
      );
      successCallback();
    } catch (error) {
      console.log(error);
      errorCallback();
      console.error("SendOtp failed:", error);
    }
  };
  useEffect(() => {
    if (loginOpen) {
      Sendevent({
        event: "button_clicked",
        value: "Open_Login_Widget",
      });
    }
    setTimeout(() => {
      setStepIndicator(0);
      if (!loginOpen) {
      }
    }, 1500);
  }, [loginOpen]);
  const setLoginOpen = (e: boolean) => {
    dispatch({ type: "LOGIN-OPEN", payload: e });
  };
  const VerifyOtpHook = async ({
    code,
    verificationID,
    Username,
    EditPhoneFunc,
    successCallback,
    errorCallback,
  }) => {
    try {
      let [exists, name] = await AuthService.VerifyOtp(
        code,
        verificationID,
        Username,
        EditPhoneFunc
      );
      successCallback(exists, name);
    } catch (error) {
      errorCallback(error);
      console.error("VerifyOtp failed:", error);
    }
  };
  const loginFunc = async (e) => {
    await VerifyOtpHook({
      code: e,
      EditPhoneFunc: () => {},
      Username: "",
      verificationID: verficationID,
      errorCallback: (e) => {
        Sendevent({
          event: "programming_event",
          value: "otp_failed_event",
        });
        setFailed(true);
        setTimeout(() => {
          setPins("");
          setRender(false);
          setFailed(false);
          setTimeout(() => {
            setRender(true);
          }, 300);
        }, 1000);
        if (e.message === "user not found") {
          Sendevent({
            event: "programming_event",

            value: "phone_number_not_registered_event",
          });
          setSignStep("notFound");
          setStepIndicator(6);
        }
      },
      successCallback: (exists, name) => {
        setTimeout(() => {
          if (operation === "signup") {
            Sendevent({
              event: "programming_event",

              value: "verify_otp_signup_success_event",
            });
            if (exists && name.length > 1) {
              Sendevent({
                event: "programming_event",

                value: "user_already_exists_event",
              });
              setSignStep("alreadyExists");
              setStepIndicator(6);
            } else if (exists && !(name.length > 1)) {
              setStepIndicator(7);
            }
            if (!exists) {
              FinaliseLogin();
              setSignStep("welcomeSignup");
              setStepIndicator(7);
            }
          } else {
            if (exists && name.length > 1) {
              Sendevent({
                event: "programming_event",

                value: "verify_otp_signin_success_event",
              });
              FinaliseLogin();
              setSignStep("welcomeLogin");
              setStepIndicator(6);
            } else if (exists && !(name.length > 1)) {
              setStepIndicator(7);
            }
            if (!exists) {
              Sendevent({
                event: "programming_event",

                value: "phone_number_not_registered_event",
              });
              setSignStep("notFound");
              setStepIndicator(6);
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
  const backAction = () => {
    if (operation === "login" && stepIndicator === 2) {
      setStepIndicator(0);
    } else setStepIndicator(stepIndicator - 1);
  };
  const dispatch = useDispatch();
  if (!loginOpen) return <></>;
  return (
    <>
      <div
        data-testid="backdrop-login"
        onClick={() => {
          Sendevent({
            event: "button_clicked",
            value: "later_take_look_button",
          });
          setLoginOpen(false);
        }}
        className="backdrop-login"
      />
      <div
        data-testid="login-widget-container"
        className={`login-widget-container login-w2-container pb-${stepIndicator} step${stepIndicator}`}
        id="widget-auth"
        style={{
          backgroundColor: stepIndicator >= 6 && getPageColor(),
          height: "100%",
          overflow: "hidden",
        }}
      >
        {stepIndicator >= 1 && (
          <div
            className="absolute top-[64px] left-[12px] cursor-pointer p-2"
            onClick={() => {
              backAction();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11.611"
              height="24.216"
              viewBox="0 0 11.611 24.216"
            >
              <path
                id="Path_14693"
                data-name="Path 14693"
                d="M8,0,0,9.715,8,20"
                transform="translate(1.5 2.111)"
                fill="none"
                stroke="#5d5d5d"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            </svg>
          </div>
        )}

        <LogoAuth
          className="logo-auth"
          id="logo-auth"
          style={
            stepIndicator > 0 && window.innerWidth < 601
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

        <div
          data-testid="login-animated-container"
          className={`animation-row-container ${
            stepIndicator === -1 && "margin-none"
          }`}
        >
          <AnimatedComponent
            role="login-animated-container"
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
              data-testid="login-button-group"
              role="login-button-group"
              className="login-button-group"
              style={{ opacity: stepIndicator === -1 ? "0" : "1" }}
            >
              <div
                data-testid="have-account-button"
                className="login-button"
                onClick={() => {
                  Sendevent({
                    event: "button_clicked",
                    value: "i_have_already_account_button",
                  });
                  if (window.innerWidth > 912) {
                    setShowMethods(!showMethods);
                    setOperation("login");
                  } else {
                    setStepIndicator(2);
                    setOperation("login");
                  }
                }}
              >
                {translate("I have Already Account", language)}
              </div>
              {showMethods && (
                <LoginMethods
                  confirm={() => {
                    setStepIndicator(2);
                    setShowMethods(!showMethods);
                  }}
                />
              )}
              <div
                data-testid="create-account-button"
                className="login-button"
                onClick={() => {
                  Sendevent({
                    event: "button_clicked",
                    value: "create_new_account_button",
                  });
                  setStepIndicator(1);
                  setOperation("signup");
                }}
              >
                {translate("Create New Account", language)}
              </div>
            </div>
          </AnimatedComponent>
          <PrivacyConfirm
            stepIndicator={stepIndicator}
            setStepIndicator={(e) => setStepIndicator(e)}
          />

          <PhoneInput
            isForCart={false}
            inputValue={inputValue}
            wrongNumber={wrongNumber}
            setWrongNumber={(e) => {
              setWrongNumber(e);
              dispatch({ type: "WRONG-NUMBER", payload: e });
            }}
            setInputValue={(e) => setInputValue(e)}
            stepIndicator={stepIndicator}
            setStepIndicator={(e) => setStepIndicator(e)}
            operation={operation}
          />
          <SendMethod
            stepIndicator={stepIndicator}
            setWrongNumber={(e) => {
              setWrongNumber(e);
              dispatch({ type: "WRONG-NUMBER", payload: e });
            }}
            setStepIndicator={(e: number) => setStepIndicator(e)}
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

                successCallback: function () {},
                errorCallback: function (msg) {
                  setStepIndicator(3);
                  setWrongNumber(msg);
                },
              });
              setDisabled(false);
              setExpired(false);
            }}
            setStepIndactor={(e) => setStepIndicator(e)}
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
          <AnimatedComponent
            // unmountTime={0.5}
            // className="animated-container"
            show={stepIndicator === 7}
            // mountAnim={mountAnim}
            // style={{
            //   animationFillMode: "forwards",
            // }}
            // unmountAnim={unmountAnim}
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
                setStepIndicator(6);
              }}
            />
          </AnimatedComponent>
          <SignSteps
            signStep={signStep}
            stepIndicator={stepIndicator}
            setStepSign={(e) => {
              setSignStep(e);
            }}
            Name={Name}
            user={user}
            FinaliseLogin={() => FinaliseLogin()}
            cancelLogin={() => {
              AuthService.cancelAuth();
            }}
            close={() => {
              setLoginOpen(false);
              Sendevent({
                event: "button_clicked",
                category: "button_clicked",
                value: "later_take_look_button",
              });
            }}
            setStepIndactor={(e) => setStepIndicator(e)}
            inputValue={inputValue}
          />
        </div>
        <AnimatedComponent
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
            data-testid="take-look-text"
            onClick={() => {
              setLoginOpen(false);
              AuthService.cancelAuth();
              Sendevent({
                event: "button_clicked",
                category: "button_clicked",
                value: "skip login widget",
              });
            }}
            style={{
              opacity: stepIndicator === -1 ? "0" : "1",
              marginTop: stepIndicator === 1 && "29px",
            }}
          >
            {translate("Later, Take A Look At The App", language)}
          </div>
        </AnimatedComponent>
        {(stepIndicator > 1 || window.innerWidth > 600) && (
          <span
            id="login-close-icon"
            data-testid="login-close-icon"
            onClick={() => {
              if (stepIndicator < 6) AuthService.cancelAuth();
              setLoginOpen(false);
              Sendevent({
                event: "button_clicked",
                category: "button_clicked",
                value: "later_take_look_button",
              });
            }}
          >
            {" "}
            <svg
              onClick={() => {
                Sendevent({
                  event: "button_clicked",
                  category: "button_clicked",
                  value: "later_take_look_button",
                });
                if (stepIndicator < 6) AuthService.cancelAuth();
                setLoginOpen(false);
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
                  strokeLinecap="round"
                  strokeWidth="1"
                />
                <line
                  id="Line_793"
                  data-name="Line 793"
                  x2="20.848"
                  transform="matrix(0.719, 0.695, -0.695, 0.719, 1293.849, 98.605)"
                  fill="none"
                  stroke="#ff5f61"
                  strokeLinecap="round"
                  strokeWidth="1"
                />
              </g>
            </svg>
          </span>
        )}
      </div>
    </>
  );
}

export default NewLoginWidget;
