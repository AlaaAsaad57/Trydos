"use client";
import { useEffect, useState } from "react";
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
import SlideWidget from "components/global/SlideNavigation";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useAppStore } from "store";
import {
  GA_AUTH_SCREEN,
  GA_BUTTONS_NAMES,
  GA_EVENT_NAMES,
  GA_EXCEPTIONS_DESCRIPTIONS,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import auth from "services/auth";
import Image from "next/image";
import SearchParamUpdater from "components/global/ParamsUpdater";

function NewLoginWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      GAevent({
        action: GA_EVENT_NAMES.EXCEPTION,
        params: {
          description: GA_EXCEPTIONS_DESCRIPTIONS.OTP_SEND_FAILED,
          context: operation === "login" ? operation : "signup",
          mission_name: operation === "login" ? operation : "signup",
        },
      });
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
          screen_path: window.location.pathname,
        },
      });
    }
    setTimeout(() => {
      setStepIndicator(0);
    }, 1500);
  }, [loginOpen]);
  const setLoginOpenAction = (e: boolean) => {
    if (!e && stepIndicator < 6) {
      GAevent({
        action:
          operation === "login"
            ? GA_EVENT_NAMES.CANCEL_LOGIN
            : GA_EVENT_NAMES.CANCEL_SIGNUP,
        params: {
          context: operation,
          button_name: GA_BUTTONS_NAMES.CLOSE_LOGIN,
        },
      });
    }
    if (e === false && stepIndicator === 7) {
      GAevent({
        action: GA_EVENT_NAMES.CREATE_ACCOUNT_CONTINUE,
        params: {
          method_otp: "phone",
          name_entered: false,
          button_name: GA_BUTTONS_NAMES.LATER_TAKE_LOOK_BUTTON,
        },
      });
    }
    setLoginOpen(e);
  };
  const laterTakeAlook = (e: boolean) => {
    if (!e && stepIndicator < 6) {
      GAevent({
        action: GA_EVENT_NAMES.LATER_TAKE_LOOK_CLICKED,
        params: {
          screen_name: GetScreenName(stepIndicator),
          screen_path: window.location.pathname,
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
    } catch (error) {
      setLoadingPin(false);
      GAevent({
        action: GA_EVENT_NAMES.EXCEPTION,
        params: {
          description: GA_EXCEPTIONS_DESCRIPTIONS.OTP_INCORRECT,
          context: operation === "login" ? operation : "signup",
          mission_name: operation === "login" ? operation : "signup",
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
            mission_name: operation === "login" ? operation : "signup",

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
            method_otp: "phone",
            success: false,
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
            method_otp: "phone",

            success: true,
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
    if (stepIndicator > 0) {
      GAevent({
        action: GA_EVENT_NAMES.SCREEN_VIEW,
        params: {
          screen_name: GetScreenName(stepIndicator),
          screen_path: window.location.pathname,
        },
      });
    }
  }, [stepIndicator]);
  return (
    <>
      <SearchParamUpdater searchKey="login" searchValue="true" />
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
        className={`login-widget-container  z-[99999999999] login-w2-container lg2:right-5 lg2:top-[82px] pb-${stepIndicator} step${stepIndicator}`}
        id="widget-auth"
        style={{
          backgroundColor: stepIndicator >= 6 && getPageColor(),
          height: "100%",
          overflow: "hidden",
        }}
      >
        {stepIndicator >= 1 && stepIndicator < 6 && (
          <div
            className="absolute top-[64px] left-[12px] cursor-pointer p-2 z-50"
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
        <Image
          src={"/svg/LogoAuth.svg"}
          className="logo-auth"
          width={210}
          height={94}
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
          alt="logo"
        />

        <div
          data-testid="login-animated-container"
          className={`animation-row-container h-full ${
            stepIndicator === -1 && "margin-none"
          }`}
        >
          <SlideWidget step={Math.max(0, stepIndicator)} duration={500}>
            {[
              // Step 0 - Login/Signup choice
              <div className="animated-container" key="login-widget-step-0">
                <div
                  className="login-privacy-text"
                  style={{ opacity: stepIndicator === -1 ? 0 : 1 }}
                >
                  {translate(
                    "To Take Advantage Of All The Advantages Of The Application, Please Join Us In Quick And Easy Steps And For Just One Time",
                    language
                  )}
                </div>
                <div
                  className="login-privacy-text-2"
                  style={{ opacity: stepIndicator === -1 ? 0 : 1 }}
                >
                  {translate("Why We Know You ?", language)}
                </div>
                <div
                  data-testid="login-button-group"
                  role="login-button-group"
                  className="login-button-group"
                  style={{ opacity: stepIndicator === -1 ? 0 : 1 }}
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
                          method_otp: "phone",
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
                          method_otp: "phone",
                          button_name:
                            GA_BUTTONS_NAMES.CREATE_NEW_ACCOUNT_BUTTON,
                        },
                      });
                      setStepIndicator(1);
                      setOperation("signup");
                    }}
                  >
                    {translate("Create New Account", language)}
                  </div>
                </div>
              </div>,
              // Step 1 - Privacy Confirm
              <PrivacyConfirm
                key="login-widget-step-1"
                stepIndicator={stepIndicator}
                setStepIndicator={(e) => setStepIndicator(e)}
              />,
              // Step 2 - Phone Input
              <PhoneInput
                key="login-widget-step-2"
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
              />,
              // Step 3 - Phone Input (duplicate for login flow)
              <PhoneInput
                key="login-widget-step-3"
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
              />,
              // Step 4 - Send Method
              <SendMethod
                key="login-widget-step-4"
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
              />,
              // Step 5 - Login Pins
              <LogInPins
                key="login-widget-step-5"
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
              />,
              // Step 6 - Sign Steps
              <SignSteps
                key="login-widget-step-6"
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
              />,
              // Step 7 - Input Name
              <InputName
                key="login-widget-step-7"
                value={Name}
                setName={(e) => setName(e)}
                submit={async () => {
                  await auth.ConfirmSignIn();
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
              />,
            ]}
          </SlideWidget>
        </div>
        {(stepIndicator === 0 || stepIndicator === 1) && (
          <div
            className="take-look-text"
            data-testid="take-look-text"
            onClick={() => {
              laterTakeAlook(false);
              AuthService.cancelAuth();
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SKIP_LOGIN_WIDGET,
              // });
            }}
            style={{
              marginTop: stepIndicator === 1 ? "29px" : "0",
            }}
          >
            {translate("Later, Take A Look At The Site", language)}
          </div>
        )}
        {(stepIndicator > 1 || window.innerWidth > 600) && (
          <span
            id="login-close-icon"
            data-testid="login-close-icon"
            className="z-50"
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
