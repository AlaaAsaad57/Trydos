import Border from "components/global/Border";
import { useEffect, useRef, useState } from "react";
import SolidPhoneIcon from "public/svg/SolidPhoneIcon.svg";
import { allCountries } from "country-telephone-data";
import LeftArrowIcon from "public/svg/LeftArrowIcon.svg";
import LoginIcon from "public/svg/LoginIcon.svg";
import BlueCall from "public/svg/BlueCall.svg";
import PrivacyIcon from "public/svg/privacyicon.svg";
import useDetectKeyboardOpen from "use-detect-keyboard-open";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import {
  GA_AUTH_SCREEN,
  GA_BUTTONS_NAMES,
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { PhoneInputPropsType } from "models/componentType/settingTypes/PhoneInputPropsType";
import { FlagIcon, formatPhone } from "utils/tinyUtils";

function PhoneInput({
  stepIndicator,
  isForCart,
  setStepIndicator,
  wrongNumber,
  setWrongNumber,
  operation,
  inputValue,
  setInputValue,
}: PhoneInputPropsType) {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  // useEffect(() => {
  //   document
  //     .querySelector<HTMLInputElement>(".login-phone-input")
  //     ?.focus({ preventScroll: true });
  // }, []);

  const [active, setActive] = useState(false);
  const mountAnim = ` 
  0% {transform:translateX(800px)}
  100% {transform:translateX(0px)}
`;
  const unmountAnim = `
0% {transform:translateX(0px)}
100% {transform:translateX(-800px)}
`;
  useEffect(() => {
    if (stepIndicator === 2 || stepIndicator === 3) {
      setTimeout(() => {
        setActive(true);
      }, 50);
    } else {
      setTimeout(() => {
        setActive(false);
      }, 50);
    }
  }, [stepIndicator]);
  const ref = useRef();
  const handleInput = (e) => {
    setWrongNumber(false);
    let { data, pattern, valid } = formatPhone(e.target.value);

    // let data = textMarshal({
    //   input: e.target.value,
    //   template: pattern,
    //   disallowCharacters: [/[a-z]/],
    // });
    setInputValue(data.plaintext);

    // if (
    //   data.plaintext.length ===
    //   pattern?.split("").filter((letter) => letter === "x").length
    // ) {
    //   setValidNumber(true);
    // } else {
    //   setValidNumber(false);
    // }
    if (valid) {
      setValidNumber(true);
    } else {
      setValidNumber(false);
    }
    // @ts-ignore
    ref.current.value = data.marshaltext;
    e.target.value = data.marshaltext;
  };
  const [validNumber, setValidNumber] = useState(false);
  const getCountry = (text?: string) => {
    return allCountries.filter((countryItem) =>
      (text || inputValue).startsWith(countryItem.dialCode)
    ).length === 1
      ? allCountries.filter((countryItem) =>
          (text || inputValue).startsWith(countryItem.dialCode)
        )[0]
      : allCountries.filter((countryItem) =>
          (text || inputValue).startsWith(countryItem.dialCode)
        )[0];
  };

  const isKeyboardOpen = useDetectKeyboardOpen(200);
  useEffect(() => {
    if (isKeyboardOpen) {
      if (window.innerWidth < 900) {
        window.ontouchmove = function (e) {
          document.getElementById("phoneInput").blur();
        };
        // setTimeout(() => {
        //   document.getElementById("logo-auth").style.position = "absolute";
        //   document.getElementById("logo-auth").style.left = "20px";
        //   document.getElementById("logo-auth").style.top = `${
        //     visualViewport.pageTop + 60
        //   }px`;
        //   document.getElementById("logo-auth").style.transform = "scale(.75)";

        //   document.getElementById("logo-auth").style.alignSelf = "flex-start";
        //   document.getElementById("login-close-icon").style.top = "initial";
        //   document.getElementById("login-close-icon").style.top = `${
        //     visualViewport.pageTop + 60
        //   }px`;
        // }, 300);
      }
    } else {
    }
  }, [isKeyboardOpen]);
  useEffect(() => {
    if (inputValue && ref.current) {
      // @ts-ignore
      ref.current.value = inputValue;
    }
  }, []);

  return (
    // <Animated.div
    //   unmountTime={0.5}
    //   className="animated-container phone-animate"
    //   show={active}
    //   mountAnim={mountAnim}
    //   style={{
    //     animationFillMode: "forwards",
    //   }}
    //   unmountAnim={unmountAnim}
    // >

    // </Animated.div>

    <div className="flex-col items-center w-full pb-[40px]">
      {operation === "login" && (
        <div
          data-cy="login-operation"
          className="phone-input-desc mb-4v"
          id="phone-desc"
        >
          <LoginIcon
            data-cy="login-operation-svg"
            style={{ marginTop: "2px" }}
            className="show-logo"
          />
          <div data-cy="text-loginDesc" className="text-login-desc">
            <div data-cy="text-loginDesc-text" className="text-login-item">
              {isForCart
                ? translate("Enter Your Phone Number To Complete Order")
                : translate("Enter Your Phone Number To Login", language)}
            </div>
            <div
              data-cy="login-detail"
              className="icon-detail"
              style={{ marginTop: "3px" }}
            >
              <svg
                data-cy="login-detail-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="7.727"
                height="8.03"
                viewBox="0 0 7.727 8.03"
              >
                <path
                  id="Subtraction_1"
                  data-name="Subtraction 1"
                  d="M.227,8.03a.229.229,0,0,1-.135-.045.236.236,0,0,1-.083-.252L.585,5.909A3.846,3.846,0,1,1,1.7,7.066L.355,7.991A.212.212,0,0,1,.227,8.03Zm3.6-2.212a.476.476,0,1,0,.487.476A.475.475,0,0,0,3.828,5.818Zm.1-3.792a.75.75,0,0,1,.827.734c0,.36-.159.583-.606.853a1.19,1.19,0,0,0-.708,1.073V4.77a.381.381,0,0,0,.387.431c.221,0,.349-.135.369-.391.018-.371.157-.557.619-.83a1.4,1.4,0,0,0,.775-1.254A1.454,1.454,0,0,0,3.961,1.348a1.569,1.569,0,0,0-1.523.819.956.956,0,0,0-.1.431.327.327,0,0,0,.358.361c.194,0,.3-.09.372-.31A.82.82,0,0,1,3.928,2.026Z"
                  fill="#8e8e8e"
                />
              </svg>
              <span data-cy="FieldToInputNumber">
                {translate(
                  "Enter Your Phone Number Registered With Us",
                  language
                )}
              </span>
            </div>
            <div
              data-cy="login-detail-Verification"
              className="icon-detail"
              style={{ marginTop: "4px" }}
            >
              <svg
                data-cy="login-detail-Verification-svg"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <defs>
                  <clipPath id="clipPath">
                    <rect
                      id="Rectangle_4632"
                      data-name="Rectangle 4632"
                      width="10"
                      height="10"
                      fill="none"
                    />
                  </clipPath>
                </defs>
                <g
                  id="Group_10809"
                  data-name="Group 10809"
                  transform="translate(-45 -444)"
                >
                  <g
                    id="Mask_Group_304"
                    data-name="Mask Group 304"
                    transform="translate(45 444)"
                    clipPath="url(#clipPath)"
                  >
                    <g id="password" transform="translate(0.093 0)">
                      <path
                        id="Path_21415"
                        data-name="Path 21415"
                        d="M2.417,11.5H6.463a.777.777,0,0,0,.776-.776V8.048a.2.2,0,1,0-.4,0v2.676a.376.376,0,0,1-.376.376H2.417a.378.378,0,0,1-.378-.376V2.278A.378.378,0,0,1,2.417,1.9H6.463a.378.378,0,0,1,.376.378v1.4a.2.2,0,1,0,.4,0v-1.4A.778.778,0,0,0,6.463,1.5H2.417a.779.779,0,0,0-.778.778v8.446A.778.778,0,0,0,2.417,11.5Z"
                        transform="translate(-1.639 -1.5)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21416"
                        data-name="Path 21416"
                        d="M6.424,2.67a.2.2,0,0,0-.2-.2H4.285a.2.2,0,0,0,0,.4H6.224A.2.2,0,0,0,6.424,2.67Z"
                        transform="translate(-2.454 -1.823)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21417"
                        data-name="Path 21417"
                        d="M5.531,15.331h.277a.2.2,0,1,0,0-.4H5.531a.2.2,0,1,0,0,.4Z"
                        transform="translate(-2.87 -5.977)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21418"
                        data-name="Path 21418"
                        d="M8.258,2.814a.209.209,0,0,0,.058-.142.2.2,0,0,0-.058-.142.209.209,0,0,0-.284,0,.2.2,0,0,0-.058.142.2.2,0,0,0,.342.142Z"
                        transform="translate(-3.731 -1.825)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21419"
                        data-name="Path 21419"
                        d="M5.54,5.869v3.57a.2.2,0,0,0,.114.18.181.181,0,0,0,.086.02.2.2,0,0,0,.126-.044l.928-.756h5.76a.2.2,0,0,0,.2-.2V5.869a.2.2,0,0,0-.2-.2H5.74a.2.2,0,0,0-.2.2Zm5.026,1.276a.2.2,0,1,1,.2-.346l.189.109V6.69a.2.2,0,1,1,.4,0v.218l.188-.109a.2.2,0,1,1,.2.346l-.189.109.189.109a.2.2,0,1,1-.2.346L11.355,7.6v.218a.2.2,0,1,1-.4,0V7.6l-.189.109a.2.2,0,1,1-.2-.346l.189-.109Zm-2.008,0a.2.2,0,1,1,.2-.346l.188.109V6.69a.2.2,0,0,1,.4,0v.218L9.535,6.8a.2.2,0,1,1,.2.346l-.189.109.189.109a.2.2,0,1,1-.2.346L9.347,7.6v.218a.2.2,0,1,1-.4,0V7.6l-.188.109a.2.2,0,1,1-.2-.346l.189-.109Zm-2.008,0a.2.2,0,1,1,.2-.346l.188.109V6.69a.2.2,0,1,1,.4,0v.218L7.528,6.8a.2.2,0,1,1,.2.346l-.189.109.189.109a.2.2,0,1,1-.2.346L7.339,7.6v.218a.2.2,0,1,1-.4,0V7.6l-.188.109a.2.2,0,0,1-.2-.346l.189-.109Z"
                        transform="translate(-2.939 -2.89)"
                        fill="#8d8d8d"
                      />
                    </g>
                  </g>
                </g>
              </svg>

              <span data-cy="login-detail-Verification-text">
                {translate(
                  "We Will Send A Verification Code To The Number",
                  language
                )}
              </span>
            </div>
          </div>
        </div>
      )}
      {operation === "signup" && (
        <div className="phone-input-desc mb-4v" id="phone-desc">
          <BlueCall
            style={{ minWidth: "12px", transform: "translateY(2px)" }}
          />
          <div className="text-login-desc">
            <div className="text-login-item" data-cy="FieldToInputNumber">
              {translate(
                "Enter Your Phone Number Registered With Us",
                language
              )}
            </div>
            <div className="icon-detail" style={{ marginTop: "3px" }}>
              <PrivacyIcon
                style={{ transform: "translateY(2px)", minWidth: "10px" }}
              />
              <span>
                {translate(
                  "Your Privacy Is Completely Safe, We Not Share Your Information With Anyone",
                  language
                )}
              </span>
            </div>
            <div className="icon-detail" style={{ marginTop: "4px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="10"
                height="10"
                style={{ minWidth: "10px" }}
                viewBox="0 0 10 10"
              >
                <defs>
                  <clipPath id="clipPath">
                    <rect
                      id="Rectangle_4632"
                      data-name="Rectangle 4632"
                      width="10"
                      height="10"
                      fill="none"
                    />
                  </clipPath>
                </defs>
                <g
                  id="Group_10809"
                  data-name="Group 10809"
                  transform="translate(-45 -444)"
                >
                  <g
                    id="Mask_Group_304"
                    data-name="Mask Group 304"
                    transform="translate(45 444)"
                    clipPath="url(#clipPath)"
                  >
                    <g id="password" transform="translate(0.093 0)">
                      <path
                        id="Path_21415"
                        data-name="Path 21415"
                        d="M2.417,11.5H6.463a.777.777,0,0,0,.776-.776V8.048a.2.2,0,1,0-.4,0v2.676a.376.376,0,0,1-.376.376H2.417a.378.378,0,0,1-.378-.376V2.278A.378.378,0,0,1,2.417,1.9H6.463a.378.378,0,0,1,.376.378v1.4a.2.2,0,1,0,.4,0v-1.4A.778.778,0,0,0,6.463,1.5H2.417a.779.779,0,0,0-.778.778v8.446A.778.778,0,0,0,2.417,11.5Z"
                        transform="translate(-1.639 -1.5)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21416"
                        data-name="Path 21416"
                        d="M6.424,2.67a.2.2,0,0,0-.2-.2H4.285a.2.2,0,0,0,0,.4H6.224A.2.2,0,0,0,6.424,2.67Z"
                        transform="translate(-2.454 -1.823)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21417"
                        data-name="Path 21417"
                        d="M5.531,15.331h.277a.2.2,0,1,0,0-.4H5.531a.2.2,0,1,0,0,.4Z"
                        transform="translate(-2.87 -5.977)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21418"
                        data-name="Path 21418"
                        d="M8.258,2.814a.209.209,0,0,0,.058-.142.2.2,0,0,0-.058-.142.209.209,0,0,0-.284,0,.2.2,0,0,0-.058.142.2.2,0,0,0,.342.142Z"
                        transform="translate(-3.731 -1.825)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21419"
                        data-name="Path 21419"
                        d="M5.54,5.869v3.57a.2.2,0,0,0,.114.18.181.181,0,0,0,.086.02.2.2,0,0,0,.126-.044l.928-.756h5.76a.2.2,0,0,0,.2-.2V5.869a.2.2,0,0,0-.2-.2H5.74a.2.2,0,0,0-.2.2Zm5.026,1.276a.2.2,0,1,1,.2-.346l.189.109V6.69a.2.2,0,1,1,.4,0v.218l.188-.109a.2.2,0,1,1,.2.346l-.189.109.189.109a.2.2,0,1,1-.2.346L11.355,7.6v.218a.2.2,0,1,1-.4,0V7.6l-.189.109a.2.2,0,1,1-.2-.346l.189-.109Zm-2.008,0a.2.2,0,1,1,.2-.346l.188.109V6.69a.2.2,0,0,1,.4,0v.218L9.535,6.8a.2.2,0,1,1,.2.346l-.189.109.189.109a.2.2,0,1,1-.2.346L9.347,7.6v.218a.2.2,0,1,1-.4,0V7.6l-.188.109a.2.2,0,1,1-.2-.346l.189-.109Zm-2.008,0a.2.2,0,1,1,.2-.346l.188.109V6.69a.2.2,0,1,1,.4,0v.218L7.528,6.8a.2.2,0,1,1,.2.346l-.189.109.189.109a.2.2,0,1,1-.2.346L7.339,7.6v.218a.2.2,0,1,1-.4,0V7.6l-.188.109a.2.2,0,0,1-.2-.346l.189-.109Z"
                        transform="translate(-2.939 -2.89)"
                        fill="#8d8d8d"
                      />
                    </g>
                  </g>
                </g>
              </svg>

              <span>
                {translate(
                  "We Will Send A Verification Code To The Number",
                  language
                )}
              </span>
            </div>
          </div>
        </div>
      )}
      <div
        data-cy="container-enterPhone"
        className="phone-input-element"
        id="phone"
        data-testid="hihh"
      >
        <Border
          height={60}
          width={"100%"}
          color={wrongNumber ? "#ff5f61" : validNumber ? "#4D84FF" : ""}
        />
        <SolidPhoneIcon
          data-cy="solidPhhone-enterPhone-svg"
          style={{ position: "absolute", top: "22px", left: "20px" }}
        />
        <span
          data-cy="span-flag"
          className="flag-icon"
          style={{
            position: "absolute",
            top: "22px",
            left: "54px",
            marginLeft: "0px",
          }}
        >
          {getCountry() && getCountry()?.iso2 && (
            <FlagIcon iso={getCountry()?.iso2} />
          )}
        </span>
        <span data-cy="plus-icon-span" className="plus-icon-phone">
          +
        </span>
        <label htmlFor="phoneInput" className="no-label">
          Search
        </label>
        <input
          data-cy="phone-number-input"
          ref={ref}
          value={inputValue}
          data-testid="phone-number-input"
          id="phoneInput"
          aria-autocomplete="both"
          aria-haspopup="false"
          spellCheck="false"
          placeholder="XXX XXX XXX XXX"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          onBlur={() => {
            window.ontouchmove = function (e) {};
            // if (window.innerWidth < 900) {
            //   document.getElementById("logo-auth").style.position =
            //     "absolute";
            //   document.getElementById("logo-auth").style.marginLeft = "0px";
            //   document.getElementById("logo-auth").style.alignSelf =
            //     "initial";
            //   document.getElementById("logo-auth").style.transform = "none";
            //   document.getElementById("logo-auth").style.top = "60px";
            //   document.getElementById("login-close-icon").style.top = "60px";
            //   document.getElementById("login-close-icon").style.bottom =
            //     "initial";
            //   document.body.style.overflow = "auto";
            //   document.body.style.height = "auto";
            // }
          }}
          style={{
            zIndex: "9",
            paddingLeft: "93px",
            paddingBottom: "0px",
            height: "100%",
            width: "100%",
          }}
          disabled={false}
          type="number"
          autoFocus={false}
          inputMode="numeric"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" ||
              // @ts-ignore

              e.key === "Tab"
            ) {
              e.preventDefault();
              // @ts-ignore
              e.target.blur();
              if (validNumber && stepIndicator <= 3) {
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.CONFIRM_PHONE_NUMBER_BUTTON,
                // });
                setStepIndicator(4);
              }
            }
          }}
          // @ts-ignore
          enterKeyHint="done"
          // @ts-ignore
          tabIndex="-1"
          onChange={(e) => handleInput(e)}
          className="login-phone-input"
        />
        {validNumber && stepIndicator <= 3 && (
          <span
            data-testid="phone-arrow"
            className="phone-arrow"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.CONFIRM_PHONE_NUMBER_BUTTON,
              // });
              GAevent({
                action: GA_EVENT_NAMES.CONFIRM_PHONE_NUMBER,
                params: {
                  input_valid: true,
                  mission_name: operation,
                  button_name: GA_BUTTONS_NAMES.CONFIRM_PHONE_NUMBER_BUTTON,
                },
              });
              setStepIndicator(4);
            }}
          >
            <LeftArrowIcon />
          </span>
        )}
      </div>
      {wrongNumber && (
        <div
          className="blue-text"
          style={{ color: "#ff5f61", fontSize: "12px", marginTop: "10px" }}
        >
          {wrongNumber || translate("Invalid Phone Number", language)}
        </div>
      )}
    </div>
  );
}

export default PhoneInput;
