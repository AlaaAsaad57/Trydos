import { useEffect, useState } from "react";
import PhoneIcon from "public/svg/PhoneIcon.svg";
import SolidPhoneIcon from "public/svg/SolidPhoneIcon.svg";
import QuestionIcon from "public/svg/questionIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import { translate } from "utils/functions";
import Border from "../global/Border";
import LeftArrowIcon from "public/svg/LeftArrowIcon.svg";
import CheckedIcon from "public/svg/CheckedIcon.svg";
import PenIcon from "public/svg/PenIcon.svg";
import WAIcon from "public/svg/WAIcon.svg";
import { textMarshal } from "text-marshal";
import { allCountries } from "country-telephone-data";
import replaceString from "replace-string";
import MessageIcon from "public/svg/MessageIcon.svg";
import Timer from "./Timer";
import PinInputs from "./PinInput";
import ManIcon from "public/svg/manIcon.svg";
import {
  CheckPhone,
  ReInitialise,
  SendOtp,
  VerifyOtp,
} from "store/auth/actions";
const { flag } = require("country-emoji");
interface LoginPhoneProps {
  selectedMethod: boolean;
  selectMethod: Function;
  LoginSuccess: Function;
  newAccount: boolean;
}
function LoginPhone({
  selectedMethod,
  selectMethod,
  LoginSuccess,
  newAccount,
}: LoginPhoneProps) {
  const dispatch = useDispatch();
  const [rerender, setRender] = useState(true);
  const [Username, setName] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [disabled, setDisabled] = useState(false);

  const [validNumber, setValidNumber] = useState(false);
  const [MessageMethod, setMessageMethod] = useState(null);
  const getCountry = () => {
    return allCountries.filter((countryItem) =>
      inputValue.startsWith(countryItem.dialCode)
    ).length === 1
      ? allCountries.filter((countryItem) =>
          inputValue.startsWith(countryItem.dialCode)
        )[0]
      : allCountries.filter((countryItem) =>
          inputValue.startsWith(countryItem.dialCode)
        )[0];
  };
  const handleInput = (e) => {
    let pattern = null;
    let country = getCountry();
    if (newAccount) setStepHeight(200);
    else setStepHeight(152);
    if (country) {
      pattern = replaceString(country.format || "", ".", "x");
      pattern = replaceString(pattern, "-", "  ");
      pattern = replaceString(pattern, "+", "");
    }
    pattern = pattern || "xxx xxx xxx xxx xxxxx";
    let data = textMarshal({
      input: e.target.value,
      template: pattern,
      disallowCharacters: [/[a-z]/],
    });
    setInputValue(data.plaintext);
    if (
      data.plaintext.length ===
      pattern?.split("").filter((letter) => letter === "x").length
    ) {
      setValidNumber(true);
    } else {
      setValidNumber(false);
    }

    e.target.value = data.marshaltext;
  };
  const [stepHeight, setStepHeight] = useState(50);
  const language = useSelector((state: any) => state.homepage.language);
  const attempts = useSelector((state: any) => state.auth.attempts);
  const verficationID = useSelector((state: any) => state.auth.verficationID);
  const wrongNumber = useSelector((state: any) => state.auth.wrongNumber);
  useEffect(() => {
    if (selectedMethod) {
      if (newAccount) setStepHeight(200);
      else setStepHeight(152);
    } else setStepHeight(50);
  }, [selectedMethod]);
  useEffect(() => {
    if (attempts === 0) {
      setDisabled(true);
    }
  }, [attempts]);
  useEffect(() => {
    if (wrongNumber.length > 0) {
      setStepHeight(282);
    }
  }, [wrongNumber]);
  useEffect(() => {
    if (newAccount) {
    }
  }, [newAccount]);
  return (
    <div
      className="login-label-container"
      onClick={() => selectMethod()}
      style={{
        height: `${stepHeight}px`,
        marginTop: "10px",
        paddingTop: "15px",
        alignItems: "flex-start",
        cursor: "pointer",
      }}
    >
      <Border width={null} color={null} height={stepHeight} />
      <div
        className="login-label login-extend"
        style={{
          height: `${stepHeight}px`,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        <div className="login-label-title">
          <PhoneIcon className={selectedMethod && "active-login-icon"} />
          <div className={`${language + "-regular"} login-label-text`}>
            {translate("By Mobile Phone Number", language)}
          </div>
        </div>
        <div className="login-qr-section">
          {selectedMethod && (
            <>
              <div className="login-qr-info">
                <QuestionIcon style={{ transform: "scale(0.6666666)" }} />
                <div className={`${language + "-light"} login-qr-info-text`}>
                  {translate(
                    "Enter Your Phone Number Registered With Us",
                    language
                  )}
                </div>
              </div>
              {newAccount && stepHeight === 200 && (
                <>
                  <div className="login-phone-element">
                    {stepHeight <= 200 && (
                      <Border
                        height={50}
                        width={350}
                        color={validNumber && "#4D84FF"}
                      />
                    )}
                    <div className="phone-input-element">
                      <ManIcon style={{ minWidth: "20px" }} />
                      <label htmlFor="phone" className="no-label">
                        Name
                      </label>
                      <input
                        id="Name"
                        disabled={stepHeight > 200}
                        onChange={(e) => setName(e.target.value)}
                        className="login-phone-input"
                      />
                    </div>
                  </div>
                  {Username.length > 0 &&
                    Username.length < 5 &&
                    !Username.includes(" ") && (
                      <span style={{ color: "red", fontSize: "10px" }}>
                        Name Must Be Minimum 5 Characters and should includes
                        first and last name eg:Jhon Stones
                      </span>
                    )}
                </>
              )}
              <div
                className="login-phone-element"
                style={{
                  backgroundColor:
                    wrongNumber.length > 0
                      ? "#FFF5F5"
                      : stepHeight > 200 && "#F5F5F5",
                }}
              >
                {(!newAccount ||
                  (newAccount &&
                    Username.length > 5 &&
                    Username.includes(" "))) && (
                  <>
                    {stepHeight <= 200 && (
                      <Border
                        height={50}
                        width={350}
                        color={validNumber && "#4D84FF"}
                      />
                    )}
                    <div className="phone-input-element">
                      <SolidPhoneIcon />
                      <span className="flag-icon">
                        {getCountry() &&
                          getCountry()?.iso2 &&
                          flag(getCountry()?.iso2)}
                      </span>
                      <span className="plus-icon-phone">+</span>
                      <label htmlFor="phone" className="no-label">
                        Search
                      </label>
                      <input
                        id="phone"
                        disabled={stepHeight > 200}
                        onChange={(e) => handleInput(e)}
                        className="login-phone-input"
                      />
                      {validNumber && stepHeight <= 200 && (
                        <LeftArrowIcon
                          onClick={() => {
                            CheckPhone(
                              inputValue,
                              (e) => setStepHeight(e),
                              newAccount
                            );
                          }}
                          className="phone-arrow"
                        />
                      )}
                      {stepHeight > 200 && (
                        <PenIcon
                          className="phone-arrow"
                          onClick={() => {
                            if (newAccount) setStepHeight(200);
                            else setStepHeight(152);
                            dispatch(ReInitialise());
                            setTimeout(() => {
                              document
                                .querySelector<HTMLInputElement>(
                                  ".login-phone-input"
                                )
                                .focus();
                            }, 400);
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {selectMethod && stepHeight === 282 && wrongNumber.length > 0 && (
          <div className="login-qr-section">
            <div className={`${language + "-regular"} signup-text`}>
              {translate(wrongNumber, language)}
            </div>
            <div className={`${language + "-light"}  login-blue-text`}>
              {translate("Register With Us In A Few Simple Steps", language)}
            </div>
          </div>
        )}
        {stepHeight === 277 && (
          <>
            <div className="login-label-title" style={{ marginTop: "28px" }}>
              <CheckedIcon style={{ marginTop: "2px" }} />
              <div
                className={`${language + "-regular"}  login-label-text`}
                style={{ fontSize: "12px" }}
              >
                {translate("Choose The Verification Method", language)}
              </div>
            </div>
            <div className="login-qr-section">
              {selectedMethod && (
                <>
                  <div className="login-qr-info">
                    <QuestionIcon style={{ transform: "scale(0.6666666)" }} />
                    <div
                      className={`${language + "-light"}  login-qr-info-text`}
                    >
                      {translate("Send Verification Code To", language)}
                    </div>
                  </div>
                  <div className="login-qr-section message-recieve-options">
                    <div
                      className="message-recieve-option"
                      onClick={() => {
                        setMessageMethod("WA");
                        setStepHeight(287);
                        SendOtp(inputValue, 1, (e) => {
                          setStepHeight(e);
                        });
                      }}
                    >
                      <div className="border-option">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="170"
                          height="50"
                          viewBox="0 0 170 50"
                        >
                          <g
                            id="Rectangle_4729"
                            data-name="Rectangle 4729"
                            fill="none"
                            stroke="#4d84ff"
                            strokeLinecap="round"
                            stroke-linejoin="round"
                            strokeWidth="0.5"
                            strokeDasharray="3 3"
                          >
                            <rect
                              width="170"
                              height="50"
                              rx="15"
                              stroke="none"
                            />
                            <rect
                              x="0.25"
                              y="0.25"
                              width="169.5"
                              height="49.5"
                              rx="14.75"
                              fill="none"
                            />
                          </g>
                        </svg>
                      </div>
                      <WAIcon style={{ left: "34px", top: "17px" }} />
                      <div
                        className={`message-recieve-option-text ${
                          language + "-regular"
                        } `}
                      >
                        {translate("WhatsApp", language)}
                      </div>
                    </div>
                    <div
                      className="message-recieve-option"
                      onClick={() => {
                        setMessageMethod("SMS");
                        setStepHeight(287);
                        SendOtp(inputValue, 0, (e) => {
                          setStepHeight(e);
                        });
                      }}
                    >
                      <div className="border-option">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="170"
                          height="50"
                          viewBox="0 0 170 50"
                        >
                          <g
                            id="Rectangle_4729"
                            data-name="Rectangle 4729"
                            fill="none"
                            stroke="#4d84ff"
                            strokeLinecap="round"
                            stroke-linejoin="round"
                            strokeWidth="0.5"
                            strokeDasharray="3 3"
                          >
                            <rect
                              width="170"
                              height="50"
                              rx="15"
                              stroke="none"
                            />
                            <rect
                              x="0.25"
                              y="0.25"
                              width="169.5"
                              height="49.5"
                              rx="14.75"
                              fill="none"
                            />
                          </g>
                        </svg>
                      </div>
                      <MessageIcon style={{ left: "48px", top: "17px" }} />
                      <div
                        className={`${
                          language + "-regular"
                        }  message-recieve-option-text`}
                      >
                        {translate("SMS", language)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        {stepHeight >= 287 && (
          <>
            <div className="login-label-title" style={{ marginTop: "28px" }}>
              {MessageMethod === "SMS" ? (
                <MessageIcon style={{ marginTop: "2px" }} />
              ) : (
                <WAIcon style={{ marginTop: "2px" }} />
              )}
              <div
                className={`${language + "-regular"}  login-label-text`}
                style={{ fontSize: "12px" }}
              >
                {translate(
                  "Please Enter The Verification Code Sent To Your Phone",
                  language
                )}
              </div>
            </div>
            <div className="login-qr-section">
              {selectedMethod && (
                <>
                  <div className="login-qr-info">
                    <QuestionIcon style={{ transform: "scale(0.6666666)" }} />
                    <div
                      className={`${
                        language + "-light"
                      }  login-qr-info-text duartion-login-label`}
                    >
                      {translate("You Can Resend The Code After", language)}
                      <span className={`${language + "-semibold"}  blue-text`}>
                        <Timer
                          onResume={() => setDisabled(false)}
                          onFinish={() => {
                            setDisabled(true);
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="login-qr-section">
              <PinInputs
                onFailedLogin={() => setStepHeight(416)}
                rerender={rerender}
                setRender={(e) => setRender(e)}
                LoginSuccess={() => {
                  LoginSuccess();
                }}
                Login={(value: any) =>
                  VerifyOtp(value, verficationID, Username, () => {})
                }
                disabled={disabled}
              />
            </div>
          </>
        )}
        {stepHeight === 416 && (
          <div
            className="login-qr-section"
            style={{ marginTop: "18px", alignItems: "center" }}
          >
            <div className={`login-light-label ${language + "-light"} `}>
              {translate(
                "Please Enter The Correct Code Sent To Your Phone",
                language
              )}
            </div>
            <div className={`${language + "-medium"}  login-attempt`}>
              {translate("You Have", language)} {attempts}{" "}
              {translate("Attempts", language)}
            </div>
            <div className="login-change-method">
              <div className={` ${language + "-light"} method-change-label`}>
                {translate("Didn`t You Receive A Code?", language)}
              </div>
              <div
                className={`${language + "-regular"}  method-change-anchor`}
                onClick={() => {
                  setStepHeight(277);
                }}
              >
                {translate("Change The Method Of Receiving", language)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPhone;
