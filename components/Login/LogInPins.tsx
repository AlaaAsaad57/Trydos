import React, { useEffect } from "react";
import PinInput from "react-pin-input";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import Timer from "./Timer";
import useDetectKeyboardOpen from "use-detect-keyboard-open";

function LogInPins({
  setPin,
  rendere,
  expired,
  pin,
  MessageMethod,
  disabled,
  setStepIndactor,
  setDisabled,
  resend,
  Submit,
  wrongNumber,
  failedLogin,
  successLogin,
  inputValue,
}: {
  inputValue: string;
  rendere: boolean;
  setStepIndactor: Function;
  expired: boolean;
  resend: Function;
  setPin: Function;
  setDisabled: Function;
  Submit: Function;
  pin: string;
  MessageMethod: string;
  wrongNumber: boolean;
  failedLogin: boolean;
  successLogin: boolean;
  disabled: boolean;
}) {
  const user = useSelector((state: any) => state.auth.Tempuser);
  const language = useSelector((state: any) => state.homepage.language);
  useEffect(() => {
    document.querySelector<HTMLInputElement>(".pincode-input-text")?.focus();
  }, []);
  const isKeyboardOpen = useDetectKeyboardOpen(200);

  useEffect(() => {
    if (rendere) {
      setTimeout(() => {
        document
          .querySelector<HTMLInputElement>(".pincode-input-text")
          ?.focus();
      }, 200);
    }
  }, [rendere]);
  useEffect(() => {
    if (isKeyboardOpen) {
      if (window.screen.width < 600) {
        window.ontouchmove = function (e) {
          document
            .querySelector<HTMLInputElement>(".pincode-input-text")
            .focus();
          document
            .querySelector<HTMLInputElement>(".pincode-input-text")
            .blur();
        };

        setTimeout(() => {
          let a = window.visualViewport.height;
          let b = window.visualViewport.pageTop;
          let c = window.innerHeight;
          document.getElementById("logo-auth").style.position = "absolute";
          document.getElementById("logo-auth").style.left = "20px";
          document.getElementById("logo-auth").style.top = `${
            visualViewport.pageTop + 10
          }px`;
          document.getElementById("logo-auth").style.transform = "scale(.75)";

          document.getElementById("logo-auth").style.alignSelf = "flex-start";
          document.getElementById("login-close-icon").style.top = "initial";
          document.getElementById("login-close-icon").style.top = `${
            visualViewport.pageTop + 30
          }px`;
          document.body.style.overflow = "hidden";
          document.body.style.height = `${window.innerHeight}px`;
        }, 250);
      }
    } else {
      window.ontouchmove = function (e) {};
      document.getElementById("logo-auth").style.position = "absolute";
      document.getElementById("logo-auth").style.marginLeft = "0px";
      document.getElementById("logo-auth").style.alignSelf = "initial";
      document.getElementById("logo-auth").style.transform = "none";
      document.getElementById("logo-auth").style.top = "60px";
      document.getElementById("login-close-icon").style.top = "60px";
      document.getElementById("login-close-icon").style.bottom = "initial";
      document.body.style.overflow = "auto";
      document.body.style.height = "auto";
    }
  }, [isKeyboardOpen]);
  useEffect(() => {}, [user, failedLogin]);
  return (
    <>
      <div
        className="phone-input-desc"
        style={{ marginBottom: expired ? "12px" : "25px" }}
      >
        <svg
          id="_15x15"
          data-name="15x15"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="15"
          height="15"
          viewBox="0 0 15 15"
        >
          <defs>
            <clipPath id="clip-path">
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
            clip-path="url(#clip-path)"
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

        <div className="text-login-desc">
          <div className="text-login-item">
            {translate(
              "We Will Send A Verification Code To The Number",
              language
            )}
          </div>
          <div className="icon-detail" style={{ marginTop: "2px" }}>
            <svg
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
            <span style={{ color: "#5d5d5d" }}>+{inputValue}</span>
          </div>
          <div className="icon-detail" style={{ marginTop: "5px" }}>
            {MessageMethod === "SMS" ? (
              <svg
                id="_20x20"
                data-name="20x20"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <defs>
                  <clipPath id="clip-path">
                    <rect
                      id="Rectangle_4612"
                      data-name="Rectangle 4612"
                      width="10"
                      height="10"
                      fill="none"
                    />
                  </clipPath>
                </defs>
                <g
                  id="Mask_Group_302"
                  data-name="Mask Group 302"
                  clip-path="url(#clip-path)"
                >
                  <g
                    id="Group_10750"
                    data-name="Group 10750"
                    transform="translate(0 0.003)"
                  >
                    <g id="Group_10749" data-name="Group 10749">
                      <path
                        id="Path_21414"
                        data-name="Path 21414"
                        d="M7.486.006H2.506A2.511,2.511,0,0,0,0,2.511V7.5A2.509,2.509,0,0,0,2.506,10H7.494A2.511,2.511,0,0,0,10,7.49V2.511A2.523,2.523,0,0,0,7.486.006ZM5.05,7.958a3.033,3.033,0,0,1-1.483-.38l-1.7.539.555-1.625A3.069,3.069,0,1,1,5.052,7.958Z"
                        transform="translate(0 -0.006)"
                        fill="#3c3c3c"
                      />
                    </g>
                  </g>
                </g>
              </svg>
            ) : (
              <svg
                id="_20x20"
                data-name="20x20"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <g
                  id="Mask_Group_303"
                  data-name="Mask Group 303"
                  clip-path="url(#clip-path)"
                >
                  <g
                    id="Mask_Group_300"
                    data-name="Mask Group 300"
                    clip-path="url(#clip-path)"
                  >
                    <g id="whatsapp-5" transform="translate(0 0.004)">
                      <g
                        id="Group_10739"
                        data-name="Group 10739"
                        transform="translate(2.482 2.363)"
                      >
                        <g id="Group_10738" data-name="Group 10738">
                          <path
                            id="Path_21407"
                            data-name="Path 21407"
                            d="M6.291,3.55A2.561,2.561,0,0,0,3.723,6.1a2.532,2.532,0,0,0,.492,1.5l-.325.95.992-.317A2.563,2.563,0,1,0,6.291,3.55ZM7.8,7.158a.782.782,0,0,1-.507.357c-.135.016-.135.111-.9-.182A3.091,3.091,0,0,1,5.1,6.207a1.415,1.415,0,0,1-.309-.769.813.813,0,0,1,.262-.618.3.3,0,0,1,.2-.1c.05,0,.1.008.142.008s.1-.024.167.127.214.516.23.555a.142.142,0,0,1,.008.127,1.023,1.023,0,0,1-.071.127c-.04.04-.08.095-.111.127s-.08.08-.031.15a2.543,2.543,0,0,0,.421.516,2.191,2.191,0,0,0,.6.372c.071.039.119.031.158-.016a2.379,2.379,0,0,0,.238-.294c.05-.071.1-.063.167-.039s.436.206.516.246.127.056.142.087a.544.544,0,0,1-.031.341Z"
                            transform="translate(-3.723 -3.55)"
                            fill="#35ce3f"
                          />
                        </g>
                      </g>
                      <g id="Group_10741" data-name="Group 10741">
                        <g id="Group_10740" data-name="Group 10740">
                          <path
                            id="Path_21408"
                            data-name="Path 21408"
                            d="M7.486.006H2.506A2.512,2.512,0,0,0,0,2.512V7.5A2.51,2.51,0,0,0,2.506,10H7.494A2.511,2.511,0,0,0,10,7.492V2.512A2.523,2.523,0,0,0,7.486.006ZM5.05,7.96a3.033,3.033,0,0,1-1.483-.38l-1.7.539.555-1.625A3.069,3.069,0,1,1,5.052,7.96Z"
                            transform="translate(0 -0.006)"
                            fill="#35ce3f"
                          />
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </svg>
            )}
            <span>
              {translate(
                "Please Enter The Verification Code Sent To Your Whatsapp",
                language
              )}
            </span>
          </div>
          <div
            className="icon-detail"
            style={{ marginTop: "4px", flexWrap: "wrap" }}
          >
            <svg
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

            <span id="text-wrap-element">
              {translate(
                expired
                  ? "Didn’t You Receive A Code?"
                  : "You Can Resend The Code After ",
                language
              )}
            </span>
            {!expired ? (
              <span className={`blue-text`} id="text-wrap-element">
                <Timer
                  onResume={() => setDisabled(false)}
                  onFinish={() => {
                    setDisabled(true);
                  }}
                />
              </span>
            ) : (
              <>
                <span className="blue-text" onClick={() => resend()}>
                  {translate("Resend Code", language)}
                </span>
                <span className="blue-text" style={{ color: "#5d5d5d" }}>
                  OR
                </span>
                <span
                  className="blue-text"
                  id="text-wrap-element"
                  style={{ cursor: "pointer" }}
                  onClick={() => setStepIndactor(4)}
                >
                  {translate("Change ", language)}
                </span>
                <span
                  className="blue-text"
                  id="text-wrap-element"
                  style={{ cursor: "pointer" }}
                  onClick={() => setStepIndactor(4)}
                >
                  {translate("the Method Of Receiving", language)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="pin-inputs-container" style={{ marginTop: "0px" }}>
        <div className="pin-border-container" style={{ zIndex: "1" }}>
          {Array(6)
            .fill(1)
            .map((e, index) => (
              <div
                key={index}
                className={
                  "pin-border-element" +
                  " " +
                  (expired && "input-expired ") +
                  (user && " input-success ") +
                  " " +
                  ((wrongNumber || failedLogin) && !user && "input-failed")
                }
                style={{
                  backgroundColor: wrongNumber
                    ? "#fff5f5"
                    : user
                    ? "#F4FFF4"
                    : pin[index] || disabled
                    ? "#f5f5f5"
                    : "#fafafa",
                  borderRadius: "15px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="60"
                  viewBox="0 0 50 60"
                  style={{
                    opacity:
                      successLogin || wrongNumber || expired || failedLogin
                        ? "1"
                        : pin[index] || disabled
                        ? "0"
                        : "1",
                  }}
                >
                  <g
                    id="Rectangle_4722"
                    data-name="Rectangle 4722"
                    fill={wrongNumber ? "#fff5f5" : "none"}
                    stroke="#4d84ff"
                    strokeLinecap="round"
                    stroke-linejoin="round"
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                  >
                    <rect width="50" height="60" rx="15" stroke="none" />
                    <rect
                      x="0.25"
                      y="0.25"
                      width="49.5"
                      height="59.5"
                      rx="14.75"
                      fill="none"
                    />
                  </g>
                </svg>
              </div>
            ))}
        </div>

        {rendere && (
          <PinInput
            length={6}
            initialValue={pin}
            onChange={(value, index) => {
              setPin(value);
            }}
            type="numeric"
            disabled={disabled}
            inputMode="number"
            placeholder=""
            aria-label=""
            style={{ marginTop: 0 }}
            onComplete={(value, index) => Submit(value)}
            inputStyle={{
              borderRadius: 15,
              backgroundColor: "transparent",
              margin: "initial",
              color: "transparent",

              border: "#ddddddc5 0.5px solid",
              width: 50,
              height: 60,
            }}
            // onComplete={(value, index) => setPin(value)}
            autoSelect={true}
            regexCriteria={/^[ A-Za-z0-9_@./#&+-]*$/}
            focus={true}
            // disabled={disablePin}
          />
        )}
      </div>
      {wrongNumber && (
        <span className="lgiht-text">
          {translate(
            "Please Enter The Correct Code Sent To Your Phone",
            language
          )}
        </span>
      )}
      {expired && (
        <span className="lgiht-text">
          {translate("The Code Sent Has Expired", language)}
        </span>
      )}
    </>
  );
}

export default LogInPins;
