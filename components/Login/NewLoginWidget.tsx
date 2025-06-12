"use client";
import { useEffect, useState } from "react";
import LogoAuth from "public/svg/LogoAuth.svg";
import { translateFunction } from "utils/functions";
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
import { useAppStore } from "store";
import {
  GA_AUTH_SCREEN,
  GA_BUTTONS_NAMES,
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";

function NewLoginWidget() {
  let { lang } = useParams();
  const {
    setWrongNumber,
    setLoginOpen,
    loginOpen,
    language,
    wrongNumber,
    verficationID,
    Tempuser,
  } = useAppStore();

  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [stepIndicator, setStepIndicator] = useState(-1);
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
      // Sendevent({
      //   event: GA_EVENT_NAMES.CLICK,
      //   value: GA_CLICK_EVENT_VALUES.OPEN_LOGIN_WIDGET,
      // });
      GAevent({
        action: GA_EVENT_NAMES.SCREEN_VIEW,
        params: {
          screen_name: GA_AUTH_SCREEN.SELECT_AUTHINTCTION_METHOD_SCREEN,
          platform: GA_GLOBAL_PLATFORM.WEB,
          timestamp: new Date().toISOString(),
          screen_path: window.location.pathname,
        },
      });
    }
    setTimeout(() => {
      setStepIndicator(0);
    }, 1500);
  }, [loginOpen]);
  const setLoginOpenAction = (e: boolean) => {
    if (!e) {
      GAevent({
        action:
          operation === "login"
            ? GA_EVENT_NAMES.CANCEL_LOGIN
            : GA_EVENT_NAMES.CANCEL_SIGNUP,
        params: {
          context: operation,
          button_name: GA_BUTTONS_NAMES.LATER_TAKE_LOOK_BUTTON,
        },
      });
    }
    if (e === false && stepIndicator === 7) {
      GAevent({
        action: GA_EVENT_NAMES.CREATE_ACCOUNT_CONTINUE,
        params: {
          method: "phone",
          name_entered: false,
          button_name: GA_BUTTONS_NAMES.LATER_TAKE_LOOK_BUTTON,
        },
      });
    }
    setLoginOpen(e);
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
      if (operation === "login")
        GAevent({
          action: "login",
          params: {
            method: "phone",
            login_status: "success",
          },
        });
      else
        GAevent({
          action: "sign_up",
          params: {
            method: "phone",
            signup_status: "success",
          },
        });
    } catch (error) {
      setLoadingPin(false);
      if (operation === "login")
        GAevent({
          action: "login",
          params: {
            method: "phone",
            login_status: "failure",
          },
        });
      else
        GAevent({
          action: "sign_up",
          params: {
            method: "phone",
            signup_status: "failure",
          },
        });
      errorCallback(error);
      console.error("VerifyOtp failed:", error);
    }
  };
  const [loadingPin, setLoadingPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const loginFunc = async (e) => {
    setAttempts(attempts + 1);
    setLoadingPin(true);
    await VerifyOtpHook({
      code: e,
      EditPhoneFunc: () => {},
      Username: "",
      verificationID: verficationID,
      errorCallback: (e) => {
        setFailed(true);
        GAevent({
          action: GA_EVENT_NAMES.VERIFY_OTP,
          params: {
            method: MessageMethod === "WA" ? "whatsapp" : "sms",
            mission_name: operation,
            timestamp: new Date().toISOString(),
            button_name: "N/A",
            status: "failed",
            attempts: attempts,
          },
        });
        GAevent({
          action:
            operation === "login"
              ? GA_EVENT_NAMES.LOGIN
              : GA_EVENT_NAMES.SIGN_UP,
          params: {
            method: "phone",

            timestamp: new Date().toISOString(),

            status: "failed",
          },
        });
        setTimeout(() => {
          setPins("");
          setRender(false);
          setFailed(false);
          setTimeout(() => {
            setRender(true);
          }, 300);
        }, 1000);
        if (e.message === "user not found") {
          // Sendevent({
          //   event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
          //   value:
          //     GA_PROGRAMMING_EVENT_VALUES.PHONE_NUMBER_NOT_REGISTERED_EVENT,
          // });
          setSignStep("notFound");
          setStepIndicator(6);
        }
      },
      successCallback: (exists, name) => {
        GAevent({
          action: GA_EVENT_NAMES.VERIFY_OTP,
          params: {
            method: MessageMethod === "WA" ? "whatsapp" : "sms",
            mission_name: operation,
            timestamp: new Date().toISOString(),
            button_name: "N/A",
            status: "success",
            attempts: attempts,
          },
        });
        GAevent({
          action:
            operation === "login"
              ? GA_EVENT_NAMES.LOGIN
              : GA_EVENT_NAMES.SIGN_UP,
          params: {
            method: "phone",

            timestamp: new Date().toISOString(),

            status: "success",
          },
        });
        setTimeout(() => {
          setLoadingPin(false);
          if (operation === "signup") {
            if (exists && name?.length > 1) {
              setSignStep("alreadyExists");
              setStepIndicator(6);
            } else if (exists && !(name?.length > 1)) {
              setStepIndicator(7);
            }
            if (!exists) {
              FinaliseLogin();
              setSignStep("welcomeSignup");
              setStepIndicator(7);
            }
          } else {
            if (exists && name?.length > 1) {
              FinaliseLogin();
              setSignStep("welcomeLogin");
              setStepIndicator(6);
            } else if (exists && !(name?.length > 1)) {
              FinaliseLogin();
              setStepIndicator(7);
            }
            if (!exists) {
              // Sendevent({
              //   event: GA_EVENT_NAMES.PROGRAMMING_EVENT,
              //   value:
              //     GA_PROGRAMMING_EVENT_VALUES.PHONE_NUMBER_NOT_REGISTERED_EVENT,
              // });
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

  const FinaliseLogin = async () => {
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
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.LOGIN_WIDGET_BACK_ACTION,
    // });
    if (operation === "login" && stepIndicator === 2) {
      setStepIndicator(0);
    } else setStepIndicator(stepIndicator - 1);
  };

  const GetScreenName = (index) => {
    switch (index) {
      case 0: {
        return GA_AUTH_SCREEN.SELECT_AUTHINTCTION_METHOD_SCREEN;
      }
      case 1:
        return GA_AUTH_SCREEN.AGREE_TERMS_SCREEN;
      case 2:
        return GA_AUTH_SCREEN.PHONE_NUMBER_INPUT_SCREEN;
      case 3:
        return GA_AUTH_SCREEN.PHONE_NUMBER_INPUT_SCREEN;
      case 4:
        return GA_AUTH_SCREEN.OTP_RECEIVING_METHOD_SCREEN;
      case 5:
        return GA_AUTH_SCREEN.OTP_INPUT_SCREEN;
      case 6:
        return signStep === "alreadyExists"
          ? GA_AUTH_SCREEN.USER_ALREADY_EXISTS_SCREEN
          : signStep === "notFound"
          ? GA_AUTH_SCREEN.USER_NOT_FOUND_SCREEN
          : GA_AUTH_SCREEN.WELCOME_SCREEN;
      case 7:
        return GA_AUTH_SCREEN.USER_NAME_INPUT_SCREEN;

      default:
        return "";
    }
  };
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GetScreenName(stepIndicator),
        platform: GA_GLOBAL_PLATFORM.WEB,
        timestamp: new Date().toISOString(),
        screen_path: window.location.pathname,
      },
    });
  }, [stepIndicator]);
  return (
    <>
      <div
        data-testid="backdrop-login "
        onClick={() => {
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.LATER_TAKE_LOOK_BUTTON,
          // });
          setLoginOpenAction(false);
        }}
        className="backdrop-login z-[9999999999]"
      />
      <div
        data-testid="login-widget-container"
        data-cy="login-widget-container"
        className={`login-widget-container  z-[99999999999] login-w2-container pb-${stepIndicator} step${stepIndicator}`}
        id="widget-auth"
        style={{
          backgroundColor: stepIndicator >= 6 && getPageColor(),
          height: "100%",
          overflow: "hidden",
        }}
      >
        {stepIndicator >= 1 && stepIndicator < 6 && (
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
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value:
                  //     GA_PROGRAMMING_EVENT_VALUES.I_HAVE_ALREADY_ACCOUNT_BUTTON,
                  // });
                  GAevent({
                    action: GA_EVENT_NAMES.LOGIN_START,
                    params: {
                      method: "phone",
                      button_name:
                        GA_BUTTONS_NAMES.I_HAVE_ALREADY_ACCOUNT_BUTTON,
                    },
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
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value: GA_CLICK_EVENT_VALUES.CREATE_NEW_ACCOUNT_BUTTON,
                  // });
                  GAevent({
                    action: GA_EVENT_NAMES.SIGNUP_START,
                    params: {
                      method: "phone",
                      button_name: GA_BUTTONS_NAMES.CREATE_NEW_ACCOUNT_BUTTON,
                    },
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
            }}
            operation={operation}
            hideEdit={false}
            setShowMobile={() => {}}
            setStepIndicator={(e: number) => setStepIndicator(e)}
            setMessageMethod={(e: string) => setMessageMethod(e)}
            inputValue={inputValue}
          />

          <LogInPins
            loadingPin={loadingPin}
            expired={expired}
            stepIndicator={stepIndicator}
            setDisabled={(e) => {
              setDisabled(e);
              setExpired(e);
            }}
            resend={async () => {
              await SendOtpHook({
                mobilePhone: inputValue,
                is_via_whatsapp: MessageMethod === "WA" ? "1" : "0",

                successCallback: function () {
                  setDisabled(false);
                  setExpired(false);
                },
                errorCallback: function (msg) {
                  setStepIndicator(3);
                  setWrongNumber(msg);
                },
              });
            }}
            init={() => {
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
              submit={async () => {
                await AuthService.UpdateName(Name);
                if (operation === "login") {
                  if (Tempuser.already_exists) setSignStep("welcomeLogin");
                  else setSignStep("welcomeSignup");
                }
                if (operation === "signup") {
                  if (Tempuser.already_exists) {
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
            user={Tempuser}
            FinaliseLogin={() => FinaliseLogin()}
            cancelLogin={() => {
              AuthService.cancelAuth();
            }}
            close={() => {
              setLoginOpenAction(false);
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.LATER_TAKE_LOOK_BUTTON,
              // });
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
              setLoginOpenAction(false);
              AuthService.cancelAuth();
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SKIP_LOGIN_WIDGET,
              // });
              GAevent({
                action: GA_EVENT_NAMES.LATER_TAKE_LOOK_CLICKED,
                params: {
                  screen_name: GetScreenName(stepIndicator),
                  screen_path: window.location.pathname,
                  button_name: GA_BUTTONS_NAMES.LATER_TAKE_LOOK_BUTTON,
                },
              });
            }}
            style={{
              opacity: stepIndicator === -1 ? "0" : "1",
              marginTop: stepIndicator === 1 && "29px",
            }}
          >
            {translate("Later, Take A Look At The Site", language)}
          </div>
        </AnimatedComponent>
        {(stepIndicator > 1 || window.innerWidth > 600) && (
          <span
            id="login-close-icon"
            data-testid="login-close-icon"
            onClick={() => {
              if (stepIndicator < 6) AuthService.cancelAuth();
              setLoginOpenAction(false);
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.LATER_TAKE_LOOK_BUTTON,
              // });
            }}
          >
            {" "}
            <svg
              onClick={() => {
                if (stepIndicator < 6) AuthService.cancelAuth();
                setLoginOpenAction(false);
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
