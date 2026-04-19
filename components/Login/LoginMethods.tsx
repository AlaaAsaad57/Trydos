import { useEffect, useState } from "react";
import { translateFunction } from "utils/functions";

import Border from "./Border";
import "styles/methods.css";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
const LoginMethods = ({ confirm }) => {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    let e = document.querySelector<HTMLDivElement>(".login-widget-container");
    if (e.classList.contains("qr-extend-comtainer")) {
      e.classList.remove("qr-extend-comtainer");
    } else {
      e.classList.add("qr-extend-comtainer");
    }
  }, [showQr]);
  return (
    <div data-cy="login-methods-container" className="login-method-container">
      <div
        data-testid="login-method-qr"
        className={`${showQr ? "qr-extended" : ""} login-method-qr`}
        onClick={(e) => {
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.LOGIN_METHOD_QR_BUTTON,
          // });
          e.preventDefault();
          setShowQr(!showQr);
        }}
      >
        <Border className="border-button" />
        <div className="flex">
          <img src="/icons/qr.svg" />
          <span>{translate("By Scan Qr From Trydos App", language)}</span>
        </div>
        {showQr && (
          <>
            <div className="icon-detail">
              <svg
                id="Group_10725"
                data-name="Group 10725"
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 10 10"
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
                  fill="none"
                />
              </svg>

              <span>
                {translate(
                  "Scan This Qr Code From You Trydos App In Your Phone",
                  language
                )}
              </span>
            </div>
            <div className="qr-image-container">
              <img src="/icons/qrSample.svg" />
            </div>
          </>
        )}
      </div>
      {!showQr && (
        <div
          data-cy="login-method-phone"
          className="login-method-phone"
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.LOGIN_METHOD_PHONE_BUTTON,
            // });
            confirm();
          }}
        >
          <Border className="border-button" />
          <img src="/icons/loginCall.svg" />
          <span>{translate("By Mobile Phone Number", language)}</span>
        </div>
      )}
    </div>
  );
};

export default LoginMethods;
