import Border from "components/global/Border";
import React, { useEffect, useState } from "react";
import SolidPhoneIcon from "public/svg/SolidPhoneIcon.svg";
import { allCountries } from "country-telephone-data";
import replaceString from "replace-string";
import { textMarshal } from "text-marshal";
const { flag } = require("country-emoji");
import LeftArrowIcon from "public/svg/LeftArrowIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import LoginIcon from "public/svg/LoginIcon.svg";
import BlueCall from "public/svg/BlueCall.svg";
import PrivacyIcon from "public/svg/privacyicon.svg";
import { translate } from "utils/functions";
function PhoneInput({
  stepIndicator,
  setStepIndcator,
  operation,
  inputValue,
  setInputValue,
}) {
  useEffect(() => {
    document.querySelector<HTMLInputElement>(".login-phone-input")?.focus();
  }, []);
  const handleInput = (e) => {
    let pattern = null;
    let country = getCountry();
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
  const [validNumber, setValidNumber] = useState(false);
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
  const language = useSelector((state: any) => state.homepage.language);
  const dispatch = useDispatch();
  console.log(operation);
  return (
    <>
      {operation === "login" && (
        <div className="phone-input-desc">
          <LoginIcon style={{ marginTop: "2px" }} />
          <div className="text-login-desc">
            <div className="text-login-item">
              {translate("Enter Your Phone Number To Login", language)}
            </div>
            <div className="icon-detail">
              <svg
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
              <span>
                {translate(
                  "Enter Your Phone Number Registered With Us",
                  language
                )}
              </span>
            </div>
            <div className="icon-detail">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <defs>
                  <clipPath id="clip-path">
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
                    clip-path="url(#clip-path)"
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
      {operation === "signup" && (
        <div className="phone-input-desc">
          <BlueCall />
          <div className="text-login-desc">
            <div className="text-login-item">
              {translate(
                "Enter Your Phone Number Registered With Us",
                language
              )}
            </div>
            <div className="icon-detail">
              <PrivacyIcon style={{ transform: "translateY(2px)" }} />
              <span>
                {translate(
                  "Your Privacy Is Completely Safe, We Not Share Your Information With Anyone",
                  language
                )}
              </span>
            </div>
            <div className="icon-detail">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <defs>
                  <clipPath id="clip-path">
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
                    clip-path="url(#clip-path)"
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
      <div className="phone-input-element">
        <Border height={50} width={"100%"} color={validNumber && "#4D84FF"} />
        <SolidPhoneIcon
          style={{ position: "absolute", top: "16px", left: "20px" }}
        />
        <span
          className="flag-icon"
          style={{
            position: "absolute",
            top: "19px",
            left: "54px",
            marginLeft: "0px",
          }}
        >
          {getCountry() && getCountry()?.iso2 && flag(getCountry()?.iso2)}
        </span>
        <span
          className="plus-icon-phone"
          style={{ position: "absolute", top: "16px", left: "68px" }}
        >
          +
        </span>
        <label htmlFor="phone" className="no-label">
          Search
        </label>
        <input
          id="phone"
          autoComplete={"false"}
          style={{ zIndex: 9, paddingLeft: "88px", paddingBottom: "8px" }}
          disabled={false}
          onChange={(e) => handleInput(e)}
          className="login-phone-input"
        />
        {validNumber && stepIndicator <= 3 && (
          <LeftArrowIcon
            onClick={() => {
              // AuthService.CheckPhone(
              //   inputValue,
              //   (e) => setStepIndcator(e),
              //   stepIndicator === 3
              // );
              setStepIndcator(4);
            }}
            className="phone-arrow"
          />
        )}
      </div>
    </>
  );
}

export default PhoneInput;
