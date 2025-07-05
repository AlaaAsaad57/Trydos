import { useEffect, useState } from "react";

import { translateFunction } from "utils/functions";
import WAIcon from "public/svg/WAIcon.svg";
import MessageIcon from "public/svg/MessageIcon.svg";
import { AnimatedComponent } from "components/global/AnimatedComponent";
import AuthService from "services/auth";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import {
  GA_AUTH_SCREEN,
  GA_BUTTONS_NAMES,
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import PhoneNumberError from "./PhoneNumberError";
import { SendMethodPropsType } from "models/componentType/settingTypes/SendMethodPropsType";

function SendMethod({
  inputValue,
  setStepIndicator,
  setWrongNumber,
  setMessageMethod,
  stepIndicator,
  setShowMobile,
  hideEdit,
  operation = "login",
}: SendMethodPropsType) {
  const { language, wrongNumber } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };

  const [loading, setLoading] = useState(false);
  const SendOtpHook = async ({
    errorCallback,
    mobilePhone,
    is_via_whatsapp,
    successCallback,
  }) => {
    try {
      setLoading(true);
      setWrongNumber(false);
      let errorCallbackFunc = (e) => errorCallback(e);
      await AuthService.SendOtp(
        mobilePhone,
        is_via_whatsapp,
        errorCallbackFunc
      );

      successCallback();
    } catch (error) {
      setLoading(false);
      // console.log(error);
      errorCallback();
      console.error("SendOtp failed:", error);
    }
  };
  const SendCodeRequest = (method: string) => {
    SendOtpHook({
      mobilePhone: inputValue,
      is_via_whatsapp: method,
      successCallback: function () {
        setLoading(false);
        setStepIndicator(5);
      },
      errorCallback: function (e) {
        setLoading(false);
        setStepIndicator(4);
      },
    });
  };

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
    if (stepIndicator === 4) {
      setTimeout(() => {
        setActive(true);
      }, 50);
    } else {
      setTimeout(() => {
        setActive(false);
      }, 50);
    }
  }, [stepIndicator]);
  return (
    <AnimatedComponent show={active}>
      <>
        <div data-testid="pin-inputs-desc" className="phone-input-desc">
          <svg
            data-cy="pin-inputs-desc-svg"
            id="_15x15"
            data-name="15x15"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <defs>
              <clipPath id="clipPath">
                <rect
                  id="Rectangle_4632"
                  data-name="Rectangle 4632"
                  width="15"
                  height="15"
                  fill="none"
                />
              </clipPath>
            </defs>
            <g
              id="Mask_Group_304"
              data-name="Mask Group 304"
              clipPath="url(#clipPath)"
            >
              <g id="password" transform="translate(-1.5 -1.5)">
                <path
                  id="Path_21415"
                  data-name="Path 21415"
                  d="M2.806,16.5H8.875a1.165,1.165,0,0,0,1.164-1.164V11.322a.3.3,0,1,0-.6,0v4.014a.565.565,0,0,1-.564.564H2.806a.566.566,0,0,1-.567-.564V2.667A.568.568,0,0,1,2.806,2.1H8.875a.566.566,0,0,1,.564.567v2.1a.3.3,0,1,0,.6,0v-2.1A1.167,1.167,0,0,0,8.875,1.5H2.806A1.168,1.168,0,0,0,1.639,2.667V15.336A1.167,1.167,0,0,0,2.806,16.5Z"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_21416"
                  data-name="Path 21416"
                  d="M7.593,2.77a.3.3,0,0,0-.3-.3H4.385a.3.3,0,0,0,0,.6H7.293A.3.3,0,0,0,7.593,2.77Z"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_21417"
                  data-name="Path 21417"
                  d="M5.631,15.531h.416a.3.3,0,0,0,0-.6H5.631a.3.3,0,0,0,0,.6Z"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_21418"
                  data-name="Path 21418"
                  d="M8.429,2.984a.314.314,0,0,0,.087-.213.3.3,0,0,0-.087-.213.314.314,0,0,0-.426,0,.3.3,0,0,0-.087.213.3.3,0,0,0,.513.213Z"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_21419"
                  data-name="Path 21419"
                  d="M5.54,5.969v5.355a.3.3,0,0,0,.171.27.272.272,0,0,0,.129.03.3.3,0,0,0,.189-.066l1.392-1.134h8.64a.3.3,0,0,0,.3-.3V5.969a.3.3,0,0,0-.3-.3H5.84a.3.3,0,0,0-.3.3Zm7.539,1.915a.3.3,0,1,1,.3-.52l.283.163V7.2a.3.3,0,1,1,.6,0v.326l.283-.163a.3.3,0,1,1,.3.52l-.283.163.283.163a.3.3,0,1,1-.3.52l-.283-.163v.326a.3.3,0,1,1-.6,0V8.566l-.283.163a.3.3,0,1,1-.3-.52l.283-.163Zm-3.011,0a.3.3,0,1,1,.3-.52l.283.163V7.2a.3.3,0,1,1,.6,0v.326l.283-.163a.3.3,0,1,1,.3.52l-.283.164.283.163a.3.3,0,1,1-.3.52l-.283-.163v.327a.3.3,0,1,1-.6,0V8.566l-.283.163a.3.3,0,1,1-.3-.52l.283-.163Zm-3.012,0a.3.3,0,1,1,.3-.52l.283.163V7.2a.3.3,0,0,1,.6,0v.326l.283-.163a.3.3,0,0,1,.3.52l-.283.164.283.163a.3.3,0,1,1-.3.52l-.283-.163v.327a.3.3,0,0,1-.6,0V8.566l-.283.163a.3.3,0,0,1-.3-.52l.283-.163Z"
                  fill="#8d8d8d"
                />
              </g>
            </g>
          </svg>

          <div data-cy="send-verification-number" className="text-login-desc">
            <div
              data-cy="send-verification-number-text"
              className="text-login-item"
            >
              {translate(
                "We Will Send A Verification Code To The Number",
                language
              )}
            </div>
            <div
              data-cy="Edit-Phone-Number"
              className="icon-detail"
              style={{ cursor: "pointer", marginTop: "3px" }}
              onClick={() => {
                if (setShowMobile && !hideEdit) {
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value: GA_CLICK_EVENT_VALUES.EDIT_PHONE_NUMBER_BUTTON,
                  // });
                  setShowMobile(true);
                  setStepIndicator(3);
                }
              }}
            >
              <svg
                data-cy="Edit-Phone-Number-svg"
                id="Group_10806"
                data-name="Group 10806"
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <path
                  id="Path_13937"
                  data-name="Path 13937"
                  d="M181.618,115.591a.3.3,0,0,0-.03.1.243.243,0,1,0,.483.04.494.494,0,0,1,.01-.111v-.111a2.663,2.663,0,0,0-.141-.846,2.512,2.512,0,0,0-1.712-1.581,2.671,2.671,0,0,0-.635-.081,1.707,1.707,0,0,0-.222.01l-.212.03a.235.235,0,0,0,.081.463.99.99,0,0,1,.171-.02h.03c.05,0,.1-.01.151-.01a1.992,1.992,0,0,1,1.43.594,2.029,2.029,0,0,1,.594,1.41v.111Z"
                  transform="translate(-174.683 -110.326)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_13938"
                  data-name="Path 13938"
                  d="M173.589,63.952a.243.243,0,1,0,.483.04c.01-.111.01-.222.01-.332a4.512,4.512,0,0,0-.05-.645,3.863,3.863,0,0,0-3.495-3.2c-.1-.01-.212-.01-.312-.01s-.222,0-.332.01-.222.02-.332.04a.235.235,0,1,0,.081.463l.2-.03c.03,0,.06-.01.091-.01.1-.01.2-.01.292-.01a3.471,3.471,0,0,1,.977.141,3.348,3.348,0,0,1,1.42.846,3.459,3.459,0,0,1,.755,1.138,3.4,3.4,0,0,1,.242,1.249v.1A.823.823,0,0,0,173.589,63.952Z"
                  transform="translate(-165.462 -58.423)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_13939"
                  data-name="Path 13939"
                  d="M164.183,6.544A5.229,5.229,0,0,0,160.467,5c-.151,0-.3.01-.453.02a3.493,3.493,0,0,0-.453.06.235.235,0,1,0,.081.463l.2-.03a1.5,1.5,0,0,1,.211-.02c.141-.01.272-.02.413-.02a4.745,4.745,0,0,1,4.754,4.754v.222c0,.06-.01.121-.01.191a.243.243,0,1,0,.483.04c.01-.151.02-.3.02-.443A5.215,5.215,0,0,0,164.183,6.544Z"
                  transform="translate(-155.714 -5.003)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_13940"
                  data-name="Path 13940"
                  d="M9.636,26.481l-1.719-.946c-.573-.319-.593-.11-1.195.548-.146.159-.418.577-.738.5a7.05,7.05,0,0,1-2.331-1.633,5.575,5.575,0,0,1-1.039-1.6c-.019-.518,1.088-.777.729-1.762L2.574,19.82C1.855,18.127-.156,20.836.009,22.1c.427,3.116,5.76,8.154,8.733,6.492C9.4,28.213,10.3,26.889,9.636,26.481Z"
                  transform="translate(0 -18.92)"
                  fill="#8d8d8d"
                />
              </svg>

              <span
                data-cy="Edit-Phone-Number-plus"
                style={{ color: "#5d5d5d" }}
              >
                {inputValue}
              </span>
              {!hideEdit && (
                <span data-cy="span-edit-number">
                  <svg
                    data-cy="span-edit-number-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width="10.001"
                    height="10.001"
                    viewBox="0 0 10.001 10.001"
                  >
                    <path
                      id="Icon_material-create"
                      data-name="Icon material-create"
                      d="M3.125,11.04v2.083H5.208l6.144-6.144L9.269,4.9Zm9.839-5.672a.553.553,0,0,0,0-.783l-1.3-1.3a.553.553,0,0,0-.783,0L9.864,4.3l2.083,2.083Z"
                      transform="translate(-3.125 -3.122)"
                      fill="#388cff"
                    />
                  </svg>
                </span>
              )}
            </div>
            <div
              data-cy="choose"
              className="icon-detail"
              style={{ marginTop: "4px" }}
            >
              <svg
                data-cy="choose-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <g
                  id="Group_10776"
                  data-name="Group 10776"
                  transform="translate(0.163)"
                >
                  <path
                    id="Subtraction_1"
                    data-name="Subtraction 1"
                    d="M.227,8.03a.229.229,0,0,1-.135-.045.236.236,0,0,1-.083-.252L.585,5.909A3.846,3.846,0,1,1,1.7,7.066L.355,7.991A.212.212,0,0,1,.227,8.03Zm3.6-2.212a.476.476,0,1,0,.487.476A.475.475,0,0,0,3.828,5.818Zm.1-3.792a.75.75,0,0,1,.827.734c0,.36-.159.583-.606.853a1.19,1.19,0,0,0-.708,1.073V4.77a.381.381,0,0,0,.387.431c.221,0,.349-.135.369-.391.018-.371.157-.557.619-.83a1.4,1.4,0,0,0,.775-1.254A1.454,1.454,0,0,0,3.961,1.348a1.569,1.569,0,0,0-1.523.819.956.956,0,0,0-.1.431.327.327,0,0,0,.358.361c.194,0,.3-.09.372-.31A.82.82,0,0,1,3.928,2.026Z"
                    transform="translate(0 1.97)"
                    fill="#8e8e8e"
                  />
                  <path
                    id="Path_21380"
                    data-name="Path 21380"
                    d="M9.672,8.064a.23.23,0,0,1-.136.045.211.211,0,0,1-.127-.039L8.066,7.146l-.015.009a4.28,4.28,0,0,0,.348-1.7A4.322,4.322,0,0,0,4.082,1.14a4.252,4.252,0,0,0-.948.106A3.82,3.82,0,0,1,5.9.079,3.865,3.865,0,0,1,9.178,5.988l.576,1.824a.234.234,0,0,1-.082.252Z"
                    transform="translate(-0.218 0.375)"
                    fill="#8e8e8e"
                  />
                  <rect
                    id="Rectangle_4714"
                    data-name="Rectangle 4714"
                    width="10"
                    height="10"
                    transform="translate(-0.163)"
                    fill="none"
                  />
                </g>
              </svg>

              <span data-cy="choose-text">
                {translate(
                  "Choose The Verification Method, Receive Code Via:",
                  language
                )}
              </span>
            </div>
          </div>
        </div>
        <div data-cy="send-way" className="phone-send-options">
          <div
            data-cy="whatssapp-way"
            data-testid={`message-whatsapp-option`}
            className={`${loading && "opacity-55"} message-recieve-option`}
            onClick={() => {
              if (!loading) {
                setLoading(true);
                setMessageMethod("WA");
                SendCodeRequest("1");

                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.CHOOSE_WHATSAPP_BUTTON,
                // });
                GAevent({
                  action: GA_EVENT_NAMES.SEND_OTP,
                  params: {
                    method: "whatsapp",
                    mission_name: operation,
                    button_name: GA_BUTTONS_NAMES.CHOOSE_WHATSAPP_BUTTON,
                  },
                });
              }
              // AuthService.SendOtp(inputValue, 1, (e) => {
              //   setStepHeight(e);
              // });
            }}
          >
            <div data-cy="border-whatssapp-way" className="border-option">
              <svg
                data-cy="border-whatssapp-way-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="193"
                height="50"
                viewBox="0 0 170 50"
              >
                <g
                  id="Rectangle_4729"
                  data-name="Rectangle 4729"
                  fill="none"
                  stroke="#4d84ff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                >
                  <rect width="193" height="50" rx="15" stroke="none" />
                  <rect
                    x="0.25"
                    y="0.25"
                    width="192.5"
                    height="49.5"
                    rx="14.75"
                    fill="none"
                  />
                </g>
              </svg>
            </div>
            <WAIcon data-cy="way-icon" style={{ left: "34px", top: "17px" }} />
            <div
              data-cy="whattsapp-text"
              className={`message-recieve-option-text regular `}
            >
              {translate("WhatsApp", language)}
            </div>
          </div>
          <div
            data-cy="message-way"
            data-testid="message-sms-option"
            className={`${loading && "opacity-55"} message-recieve-option`}
            onClick={() => {
              if (!loading) {
                setLoading(true);
                setMessageMethod("SMS");

                SendCodeRequest("0");
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.CHOOSE_SMS_BUTTON,
                // });
                GAevent({
                  action: GA_EVENT_NAMES.SEND_OTP,
                  params: {
                    method: "sms",
                    mission_name: operation,
                    button_name: GA_BUTTONS_NAMES.CHOOSE_SMS_BUTTON,
                  },
                });
              }
              // AuthService.SendOtp(inputValue, 0, (e) => {
              //   setStepHeight(e);
              // });
            }}
          >
            <div data-cy="message-way-svg-container" className="border-option">
              <svg
                data-cy="message-way-svg"
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
                  strokeLinejoin="round"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                >
                  <rect width="170" height="50" rx="15" stroke="none" />
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
            <MessageIcon
              data-cy="message-icon-svg"
              style={{ left: "48px", top: "17px" }}
            />
            <div
              data-cy="message-text"
              className={`regular  message-recieve-option-text`}
            >
              {translate("SMS", language)}
            </div>
          </div>
        </div>
        {wrongNumber && (
          // <div
          //   data-cy="WaitForTryAgain"
          //   className="blue-text"
          //   style={{ color: "#ff5f61", fontSize: "12px", marginTop: "10px" }}
          // >
          //   {wrongNumber || translate("Invalid Phone Number", language)}
          // </div>
          <PhoneNumberError
            wrongNumber={wrongNumber}
            setLoading={setLoading}
            onTimerFinish={() => {
              setWrongNumber(false);
              setLoading(false);
            }}
          />
        )}
      </>
    </AnimatedComponent>
  );
}

export default SendMethod;
