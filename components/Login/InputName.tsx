import { useEffect, useState } from "react";
import { Sendevent, translateFunction } from "utils/functions";
import LeftArrowIcon from "public/svg/LeftArrowIcon.svg";
import useDetectKeyboardOpen from "use-detect-keyboard-open";
import { useParams } from "next/navigation";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { GA_CLICK_EVENT_VALUES } from "utils/GAEvents";
import { GA_EVENT_NAMES } from "utils/GAEvents";

function InputName({
  value,
  setName,
  submit,
}: {
  value: string;
  submit: Function;
  setName: Function;
}) {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
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
        //     visualViewport.height > 311 ? visualViewport.pageTop + 15 : 0
        //   }px`;
        //   document.getElementById("logo-auth").style.transform = "scale(.75)";

        //   document.getElementById("logo-auth").style.alignSelf = "flex-start";
        //   document.getElementById("login-close-icon").style.top = "initial";
        //   document.getElementById("login-close-icon").style.top = `${
        //     visualViewport.pageTop + 40
        //   }px`;
        //   document.body.style.overflow = "hidden";
        //   document.body.style.height = `${window.innerHeight}px`;
        // }, 250);
      }
    } else {
    }
  }, [isKeyboardOpen]);
  const [loading, setLoading] = useState(false);
  const updateName = async () => {
    setLoading(true);
    await submit();
    setLoading(false);
  };
  return (
    <>
      <div className="phone-input-desc" style={{ marginBottom: "28px" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15.3"
          height="15.3"
          viewBox="0 0 15.3 15.3"
        >
          <g
            id="Group_3290"
            data-name="Group 3290"
            transform="translate(0.15 0.15)"
          >
            <g
              id="Group_3166"
              data-name="Group 3166"
              transform="translate(4.911 5.253)"
            >
              <g id="Group_3165" data-name="Group 3165">
                <path
                  id="Path_15412"
                  data-name="Path 15412"
                  d="M133.912,136.19a.642.642,0,0,0-.908,0l-2.756,2.755-1.151-1.151a.642.642,0,1,0-.908.908l1.6,1.6a.642.642,0,0,0,.908,0l3.21-3.21A.642.642,0,0,0,133.912,136.19Z"
                  transform="translate(-128.002 -136.002)"
                  fill="#37ef9a"
                  stroke="#404040"
                  strokeWidth="0.3"
                />
              </g>
            </g>
            <path
              id="Path_15413"
              data-name="Path 15413"
              d="M14.375,6.875a.625.625,0,0,0-.625.625,6.25,6.25,0,1,1-1.815-4.4.625.625,0,1,0,.887-.881A7.5,7.5,0,1,0,15,7.5.625.625,0,0,0,14.375,6.875Z"
              transform="translate(0 0)"
              fill="#37ef9a"
              stroke="#2c2a2a"
              strokeWidth="0.3"
            />
          </g>
        </svg>

        <div className="text-login-desc">
          <div className="text-login-item">
            {translate("The Number Verified Successfully !", language)}
          </div>
          <div className="icon-detail" style={{ marginTop: "3px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 10 10"
            >
              <g
                id="Group_10807"
                data-name="Group 10807"
                transform="translate(-65 -464)"
              >
                <g
                  id="Group_10756"
                  data-name="Group 10756"
                  transform="translate(65 464)"
                >
                  <path
                    id="Subtraction_1"
                    data-name="Subtraction 1"
                    d="M.218,8.03a.215.215,0,0,1-.13-.045.242.242,0,0,1-.079-.252L.562,5.909A3.994,3.994,0,0,1,0,3.863,3.8,3.8,0,0,1,3.715,0,3.8,3.8,0,0,1,7.428,3.863,3.8,3.8,0,0,1,3.715,7.727a3.617,3.617,0,0,1-2.084-.662l-1.29.925A.2.2,0,0,1,.218,8.03ZM3.68,5.818a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.68,5.818Zm.1-3.792a.733.733,0,0,1,.795.734c0,.36-.152.583-.582.853a1.194,1.194,0,0,0-.681,1.073V4.77c0,.266.143.431.372.431.213,0,.336-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.823-2.633,1.5,1.5,0,0,0-1.465.819.988.988,0,0,0-.1.431.321.321,0,0,0,.345.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.776,2.026Z"
                    transform="translate(0 1.97)"
                    fill="#8e8e8e"
                  />
                  <path
                    id="Path_21380"
                    data-name="Path 21380"
                    d="M9.42,8.064a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039L7.876,7.146l-.015.009a4.428,4.428,0,0,0,.335-1.7A4.241,4.241,0,0,0,4.045,1.14a3.937,3.937,0,0,0-.912.106A3.605,3.605,0,0,1,5.793.079,3.8,3.8,0,0,1,9.507,3.943a3.982,3.982,0,0,1-.562,2.045L9.5,7.813a.239.239,0,0,1-.079.252Z"
                    transform="translate(-0.331 0.375)"
                    fill="#8e8e8e"
                  />
                  <rect
                    id="Rectangle_4714"
                    data-name="Rectangle 4714"
                    width="9.614"
                    height="10"
                    transform="translate(0.386)"
                    fill="none"
                  />
                </g>
              </g>
            </svg>

            <span>
              {translate("Last Step And Enjoy Our Services", language)}
            </span>
          </div>
          <div className="icon-detail" style={{ marginTop: "4px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="10"
              height="10"
              viewBox="0 0 10 10"
            >
              <defs>
                <clipPath id="clipPath">
                  <rect
                    id="Rectangle_4722"
                    data-name="Rectangle 4722"
                    width="10"
                    height="10"
                    fill="none"
                  />
                </clipPath>
              </defs>
              <g
                id="Mask_Group_301"
                data-name="Mask Group 301"
                clipPath="url(#clipPath)"
              >
                <g
                  id="Layer_16"
                  data-name="Layer 16"
                  transform="translate(0.655 0)"
                >
                  <path
                    id="Path_21414"
                    data-name="Path 21414"
                    d="M9.344,4.151V4.145a11.232,11.232,0,0,0-.265-2.33l-.006-.031-.01-.033a.917.917,0,0,0-.6-.548C7.513.834,6.394.409,5.3.048A1.022,1.022,0,0,0,5.022,0H4.978A1.026,1.026,0,0,0,4.7.047C3.607.409,2.487.834,1.536,1.2a.92.92,0,0,0-.6.548l-.011.033-.006.029v0A11.191,11.191,0,0,0,.656,4.145v.006A7.653,7.653,0,0,0,.833,6.283l.01.036A3.689,3.689,0,0,0,1.5,7.5,7.921,7.921,0,0,0,2.824,8.773,11.066,11.066,0,0,0,4.573,9.9l.013.006h0a.944.944,0,0,0,.824,0L5.427,9.9l.007,0A11.122,11.122,0,0,0,7.175,8.774,7.96,7.96,0,0,0,8.5,7.5a3.685,3.685,0,0,0,.655-1.178L9.163,6.3l0-.014a7.652,7.652,0,0,0,.177-2.132ZM4.977,2.5A1.094,1.094,0,1,1,3.884,3.591,1.094,1.094,0,0,1,4.977,2.5ZM6.8,6.328v0a.79.79,0,0,1-.194.434.759.759,0,0,1-.407.245,6.76,6.76,0,0,1-1.139.1,7.465,7.465,0,0,1-1.266-.1.759.759,0,0,1-.407-.246.791.791,0,0,1-.194-.434v0a2.5,2.5,0,0,1-.011-.35,1.724,1.724,0,0,1,.011-.29v0a.671.671,0,0,1,.194-.405.685.685,0,0,1,.408-.2c.226-.024.914-.037,1.264-.037s.911.013,1.137.037a.684.684,0,0,1,.408.2.672.672,0,0,1,.195.406v0a2.507,2.507,0,0,1,.017.288,3.348,3.348,0,0,1-.017.352Z"
                    transform="translate(-0.655 0)"
                    fill="#388cff"
                  />
                </g>
              </g>
            </svg>
            <span style={{ marginLeft: "10px" }}>
              {translate(
                "Your Privacy Is Completely Safe, We Not Share Your Information With Anyone",
                language
              )}
            </span>
          </div>
        </div>
      </div>
      <div
        className="login-button-group"
        data-cy="inputToWriteName"
        style={{
          position: "relative",
          backgroundColor: "transparent",
          marginBottom: "40px",
          padding: "0",
          maxWidth: "calc(100% - 40px)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="calc(100%)"
          height="60"
          style={{ position: "absolute", zIndex: "9" }}
        >
          <g
            id="Rectangle_4715"
            data-name="Rectangle 4715"
            fill="none"
            stroke="#5d5c5d"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          >
            <rect width="calc(100%)" height="60" rx="20" stroke="none" />
            <rect
              x="0.25"
              y="0.25"
              width="calc(100% - 0.5px)"
              height="59.5"
              rx="19.75"
              fill="none"
            />
          </g>
        </svg>

        <input
          className="login-button"
          data-cy="InputFiledForName"
          onChange={(e) => {
            setName(e.target.value);
          }}
          value={value}
          id="phoneInput"
          onFocus={() => {}}
          style={{
            margin: "0",
            border: "none",
            fontSize: "16px",
            zIndex: "10",
            cursor: "text",
            outline: "none",
            backgroundColor: "transparent",
          }}
          onBlur={() => {
            window.ontouchmove = function (e) {};
            // if (window.innerWidth < 900) {
            //   document.getElementById("logo-auth").style.position = "absolute";
            //   document.getElementById("logo-auth").style.marginLeft = "0px";
            //   document.getElementById("logo-auth").style.alignSelf = "initial";
            //   document.getElementById("logo-auth").style.transform = "none";
            //   document.getElementById("logo-auth").style.top = "60px";
            //   document.getElementById("login-close-icon").style.top = "60px";
            //   document.getElementById("login-close-icon").style.bottom =
            //     "initial";
            //   document.body.style.overflow = "auto";
            //   document.body.style.height = "auto";
            // }
          }}
          placeholder={translate("Enter Your Name", language)}
        />
        {value.length > 7 && (
          <>
            {loading ? (
              <span className="phone-arrow">
                <Spinner />
              </span>
            ) : (
              <span
                className="phone-arrow"
                onClick={() => {
                  // AuthService.CheckPhone(
                  //   inputValue,
                  //   (e) => setStepIndicator(e),
                  //   stepIndicator === 3
                  // );
                  Sendevent({
                    event: GA_EVENT_NAMES.CLICK,
                    value: GA_CLICK_EVENT_VALUES.CONFIRM_NAME_BUTTON,
                  });
                  updateName();
                }}
              >
                <LeftArrowIcon />
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex light text-[11px] text-[#ff5858] mt-[20px]">
        {translate("Name Should be atleast 8 characters")}
      </div>
    </>
  );
}

export default InputName;
