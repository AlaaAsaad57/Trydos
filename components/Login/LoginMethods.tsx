import { useEffect, useState } from "react";
import Qr from "public/svg/qr.svg";
import LoginCall from "public/svg/loginCall.svg";
import { translateFunction } from "utils/functions";

import Border from "./Border";
import "styles/methods.css";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { GA_EVENT_NAMES } from "utils/GAEvents";

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
          <Qr />
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
              <svg
                className="qr-image"
                xmlns="http://www.w3.org/2000/svg"
                width="200"
                height="200"
                viewBox="0 0 200 200"
              >
                <g
                  id="Group_10734"
                  data-name="Group 10734"
                  transform="translate(-0.102 -0.145)"
                >
                  <g
                    id="Group_3351"
                    data-name="Group 3351"
                    transform="translate(65.773 0.101)"
                  >
                    <g
                      id="Group_3350"
                      data-name="Group 3350"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4156"
                        data-name="Rectangle 4156"
                        width="7"
                        height="7"
                        transform="translate(0.329 0.044)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3353"
                    data-name="Group 3353"
                    transform="translate(79.918 0.101)"
                  >
                    <g
                      id="Group_3352"
                      data-name="Group 3352"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4157"
                        data-name="Rectangle 4157"
                        width="7"
                        height="7"
                        transform="translate(0.185 0.044)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3355"
                    data-name="Group 3355"
                    transform="translate(86.99 0.101)"
                  >
                    <g
                      id="Group_3354"
                      data-name="Group 3354"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4158"
                        data-name="Rectangle 4158"
                        width="9"
                        height="7"
                        transform="translate(0.112 0.044)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3357"
                    data-name="Group 3357"
                    transform="translate(104.165 0.101)"
                  >
                    <g
                      id="Group_3356"
                      data-name="Group 3356"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4159"
                        data-name="Rectangle 4159"
                        width="9"
                        height="7"
                        transform="translate(-0.063 0.044)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3359"
                    data-name="Group 3359"
                    transform="translate(113.258 0.101)"
                  >
                    <g
                      id="Group_3358"
                      data-name="Group 3358"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4160"
                        data-name="Rectangle 4160"
                        width="7"
                        height="7"
                        transform="translate(-0.156 0.044)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3361"
                    data-name="Group 3361"
                    transform="translate(129.423 0.101)"
                  >
                    <g
                      id="Group_3360"
                      data-name="Group 3360"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4161"
                        data-name="Rectangle 4161"
                        width="7"
                        height="7"
                        transform="translate(-0.321 0.044)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3363"
                    data-name="Group 3363"
                    transform="translate(65.773 7.173)"
                  >
                    <g
                      id="Group_3362"
                      data-name="Group 3362"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4162"
                        data-name="Rectangle 4162"
                        width="7"
                        height="9"
                        transform="translate(0.329 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3365"
                    data-name="Group 3365"
                    transform="translate(72.845 7.173)"
                  >
                    <g
                      id="Group_3364"
                      data-name="Group 3364"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4163"
                        data-name="Rectangle 4163"
                        width="7"
                        height="9"
                        transform="translate(0.257 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3367"
                    data-name="Group 3367"
                    transform="translate(79.918 7.173)"
                  >
                    <g
                      id="Group_3366"
                      data-name="Group 3366"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4164"
                        data-name="Rectangle 4164"
                        width="7"
                        height="9"
                        transform="translate(0.185 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3369"
                    data-name="Group 3369"
                    transform="translate(86.99 7.173)"
                  >
                    <g
                      id="Group_3368"
                      data-name="Group 3368"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4165"
                        data-name="Rectangle 4165"
                        width="9"
                        height="9"
                        transform="translate(0.112 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3371"
                    data-name="Group 3371"
                    transform="translate(96.082 7.173)"
                  >
                    <g
                      id="Group_3370"
                      data-name="Group 3370"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4166"
                        data-name="Rectangle 4166"
                        width="8"
                        height="9"
                        transform="translate(0.02 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3373"
                    data-name="Group 3373"
                    transform="translate(104.165 7.173)"
                  >
                    <g
                      id="Group_3372"
                      data-name="Group 3372"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4167"
                        data-name="Rectangle 4167"
                        width="9"
                        height="9"
                        transform="translate(-0.063 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3375"
                    data-name="Group 3375"
                    transform="translate(113.258 7.173)"
                  >
                    <g
                      id="Group_3374"
                      data-name="Group 3374"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4168"
                        data-name="Rectangle 4168"
                        width="7"
                        height="9"
                        transform="translate(-0.156 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3377"
                    data-name="Group 3377"
                    transform="translate(129.423 7.173)"
                  >
                    <g
                      id="Group_3376"
                      data-name="Group 3376"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4169"
                        data-name="Rectangle 4169"
                        width="7"
                        height="9"
                        transform="translate(-0.321 -0.029)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3379"
                    data-name="Group 3379"
                    transform="translate(86.99 16.266)"
                  >
                    <g
                      id="Group_3378"
                      data-name="Group 3378"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4170"
                        data-name="Rectangle 4170"
                        width="9"
                        height="7"
                        transform="translate(0.112 -0.121)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3381"
                    data-name="Group 3381"
                    transform="translate(96.082 16.266)"
                  >
                    <g
                      id="Group_3380"
                      data-name="Group 3380"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4171"
                        data-name="Rectangle 4171"
                        width="8"
                        height="7"
                        transform="translate(0.02 -0.121)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3383"
                    data-name="Group 3383"
                    transform="translate(104.165 16.266)"
                  >
                    <g
                      id="Group_3382"
                      data-name="Group 3382"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4172"
                        data-name="Rectangle 4172"
                        width="9"
                        height="7"
                        transform="translate(-0.063 -0.121)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3385"
                    data-name="Group 3385"
                    transform="translate(129.423 16.266)"
                  >
                    <g
                      id="Group_3384"
                      data-name="Group 3384"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4173"
                        data-name="Rectangle 4173"
                        width="7"
                        height="7"
                        transform="translate(-0.321 -0.121)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3387"
                    data-name="Group 3387"
                    transform="translate(65.773 23.338)"
                  >
                    <g
                      id="Group_3386"
                      data-name="Group 3386"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4174"
                        data-name="Rectangle 4174"
                        width="7"
                        height="9"
                        transform="translate(0.329 -0.194)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3389"
                    data-name="Group 3389"
                    transform="translate(72.845 23.338)"
                  >
                    <g
                      id="Group_3388"
                      data-name="Group 3388"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4175"
                        data-name="Rectangle 4175"
                        width="7"
                        height="9"
                        transform="translate(0.257 -0.194)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3391"
                    data-name="Group 3391"
                    transform="translate(79.918 23.338)"
                  >
                    <g
                      id="Group_3390"
                      data-name="Group 3390"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4176"
                        data-name="Rectangle 4176"
                        width="7"
                        height="9"
                        transform="translate(0.185 -0.194)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3393"
                    data-name="Group 3393"
                    transform="translate(104.165 23.338)"
                  >
                    <g
                      id="Group_3392"
                      data-name="Group 3392"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4177"
                        data-name="Rectangle 4177"
                        width="9"
                        height="9"
                        transform="translate(-0.063 -0.194)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3395"
                    data-name="Group 3395"
                    transform="translate(120.33 23.338)"
                  >
                    <g
                      id="Group_3394"
                      data-name="Group 3394"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4178"
                        data-name="Rectangle 4178"
                        width="9"
                        height="9"
                        transform="translate(-0.228 -0.194)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3397"
                    data-name="Group 3397"
                    transform="translate(79.918 32.431)"
                  >
                    <g
                      id="Group_3396"
                      data-name="Group 3396"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4179"
                        data-name="Rectangle 4179"
                        width="7"
                        height="7"
                        transform="translate(0.185 -0.287)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3399"
                    data-name="Group 3399"
                    transform="translate(104.165 32.431)"
                  >
                    <g
                      id="Group_3398"
                      data-name="Group 3398"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4180"
                        data-name="Rectangle 4180"
                        width="9"
                        height="7"
                        transform="translate(-0.063 -0.287)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3401"
                    data-name="Group 3401"
                    transform="translate(113.258 32.431)"
                  >
                    <g
                      id="Group_3400"
                      data-name="Group 3400"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4181"
                        data-name="Rectangle 4181"
                        width="7"
                        height="7"
                        transform="translate(-0.156 -0.287)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3403"
                    data-name="Group 3403"
                    transform="translate(120.33 32.431)"
                  >
                    <g
                      id="Group_3402"
                      data-name="Group 3402"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4182"
                        data-name="Rectangle 4182"
                        width="9"
                        height="7"
                        transform="translate(-0.228 -0.287)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3405"
                    data-name="Group 3405"
                    transform="translate(129.423 32.431)"
                  >
                    <g
                      id="Group_3404"
                      data-name="Group 3404"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4183"
                        data-name="Rectangle 4183"
                        width="7"
                        height="7"
                        transform="translate(-0.321 -0.287)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3407"
                    data-name="Group 3407"
                    transform="translate(72.845 39.504)"
                  >
                    <g
                      id="Group_3406"
                      data-name="Group 3406"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4184"
                        data-name="Rectangle 4184"
                        width="7"
                        height="10"
                        transform="translate(0.257 -0.359)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3409"
                    data-name="Group 3409"
                    transform="translate(86.99 39.504)"
                  >
                    <g
                      id="Group_3408"
                      data-name="Group 3408"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4185"
                        data-name="Rectangle 4185"
                        width="9"
                        height="10"
                        transform="translate(0.112 -0.359)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3411"
                    data-name="Group 3411"
                    transform="translate(113.258 39.504)"
                  >
                    <g
                      id="Group_3410"
                      data-name="Group 3410"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4186"
                        data-name="Rectangle 4186"
                        width="7"
                        height="10"
                        transform="translate(-0.156 -0.359)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3413"
                    data-name="Group 3413"
                    transform="translate(65.773 49.607)"
                  >
                    <g
                      id="Group_3412"
                      data-name="Group 3412"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4187"
                        data-name="Rectangle 4187"
                        width="7"
                        height="7"
                        transform="translate(0.329 -0.462)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3415"
                    data-name="Group 3415"
                    transform="translate(79.918 49.607)"
                  >
                    <g
                      id="Group_3414"
                      data-name="Group 3414"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4188"
                        data-name="Rectangle 4188"
                        width="7"
                        height="7"
                        transform="translate(0.185 -0.462)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3417"
                    data-name="Group 3417"
                    transform="translate(96.082 49.607)"
                  >
                    <g
                      id="Group_3416"
                      data-name="Group 3416"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4189"
                        data-name="Rectangle 4189"
                        width="8"
                        height="7"
                        transform="translate(0.02 -0.462)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3419"
                    data-name="Group 3419"
                    transform="translate(113.258 49.607)"
                  >
                    <g
                      id="Group_3418"
                      data-name="Group 3418"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4190"
                        data-name="Rectangle 4190"
                        width="7"
                        height="7"
                        transform="translate(-0.156 -0.462)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3421"
                    data-name="Group 3421"
                    transform="translate(129.423 49.607)"
                  >
                    <g
                      id="Group_3420"
                      data-name="Group 3420"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4191"
                        data-name="Rectangle 4191"
                        width="7"
                        height="7"
                        transform="translate(-0.321 -0.462)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3423"
                    data-name="Group 3423"
                    transform="translate(65.773 55.669)"
                  >
                    <g
                      id="Group_3422"
                      data-name="Group 3422"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4192"
                        data-name="Rectangle 4192"
                        width="7"
                        height="10"
                        transform="translate(0.329 0.476)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3425"
                    data-name="Group 3425"
                    transform="translate(72.845 55.669)"
                  >
                    <g
                      id="Group_3424"
                      data-name="Group 3424"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4193"
                        data-name="Rectangle 4193"
                        width="7"
                        height="10"
                        transform="translate(0.257 0.476)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3427"
                    data-name="Group 3427"
                    transform="translate(79.918 55.669)"
                  >
                    <g
                      id="Group_3426"
                      data-name="Group 3426"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4194"
                        data-name="Rectangle 4194"
                        width="7"
                        height="10"
                        transform="translate(0.185 0.476)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3429"
                    data-name="Group 3429"
                    transform="translate(96.082 55.669)"
                  >
                    <g
                      id="Group_3428"
                      data-name="Group 3428"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4195"
                        data-name="Rectangle 4195"
                        width="8"
                        height="10"
                        transform="translate(0.02 0.476)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3431"
                    data-name="Group 3431"
                    transform="translate(113.258 55.669)"
                  >
                    <g
                      id="Group_3430"
                      data-name="Group 3430"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4196"
                        data-name="Rectangle 4196"
                        width="7"
                        height="10"
                        transform="translate(-0.156 0.476)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3433"
                    data-name="Group 3433"
                    transform="translate(0.102 65.772)"
                  >
                    <g
                      id="Group_3432"
                      data-name="Group 3432"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4197"
                        data-name="Rectangle 4197"
                        width="7"
                        height="7"
                        transform="translate(0 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3435"
                    data-name="Group 3435"
                    transform="translate(16.267 65.772)"
                  >
                    <g
                      id="Group_3434"
                      data-name="Group 3434"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4198"
                        data-name="Rectangle 4198"
                        width="7"
                        height="7"
                        transform="translate(-0.165 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3437"
                    data-name="Group 3437"
                    transform="translate(23.339 65.772)"
                  >
                    <g
                      id="Group_3436"
                      data-name="Group 3436"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4199"
                        data-name="Rectangle 4199"
                        width="9"
                        height="7"
                        transform="translate(-0.237 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3439"
                    data-name="Group 3439"
                    transform="translate(39.505 65.772)"
                  >
                    <g
                      id="Group_3438"
                      data-name="Group 3438"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4200"
                        data-name="Rectangle 4200"
                        width="11"
                        height="7"
                        transform="translate(-0.402 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3441"
                    data-name="Group 3441"
                    transform="translate(49.608 65.772)"
                  >
                    <g
                      id="Group_3440"
                      data-name="Group 3440"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4201"
                        data-name="Rectangle 4201"
                        width="6"
                        height="7"
                        transform="translate(0.494 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3443"
                    data-name="Group 3443"
                    transform="translate(55.67 65.772)"
                  >
                    <g
                      id="Group_3442"
                      data-name="Group 3442"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4202"
                        data-name="Rectangle 4202"
                        width="10"
                        height="7"
                        transform="translate(0.433 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3445"
                    data-name="Group 3445"
                    transform="translate(72.845 65.772)"
                  >
                    <g
                      id="Group_3444"
                      data-name="Group 3444"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4203"
                        data-name="Rectangle 4203"
                        width="7"
                        height="7"
                        transform="translate(0.257 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3447"
                    data-name="Group 3447"
                    transform="translate(96.082 65.772)"
                  >
                    <g
                      id="Group_3446"
                      data-name="Group 3446"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4204"
                        data-name="Rectangle 4204"
                        width="8"
                        height="7"
                        transform="translate(0.02 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3449"
                    data-name="Group 3449"
                    transform="translate(113.258 65.772)"
                  >
                    <g
                      id="Group_3448"
                      data-name="Group 3448"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4205"
                        data-name="Rectangle 4205"
                        width="7"
                        height="7"
                        transform="translate(-0.156 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3451"
                    data-name="Group 3451"
                    transform="translate(129.423 65.772)"
                  >
                    <g
                      id="Group_3450"
                      data-name="Group 3450"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4206"
                        data-name="Rectangle 4206"
                        width="7"
                        height="7"
                        transform="translate(-0.321 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3453"
                    data-name="Group 3453"
                    transform="translate(144.578 65.772)"
                  >
                    <g
                      id="Group_3452"
                      data-name="Group 3452"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4207"
                        data-name="Rectangle 4207"
                        width="8"
                        height="7"
                        transform="translate(-0.476 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3455"
                    data-name="Group 3455"
                    transform="translate(167.816 65.772)"
                  >
                    <g
                      id="Group_3454"
                      data-name="Group 3454"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4208"
                        data-name="Rectangle 4208"
                        width="9"
                        height="7"
                        transform="translate(0.287 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3457"
                    data-name="Group 3457"
                    transform="translate(183.98 65.772)"
                  >
                    <g
                      id="Group_3456"
                      data-name="Group 3456"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4209"
                        data-name="Rectangle 4209"
                        width="8"
                        height="7"
                        transform="translate(0.122 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3459"
                    data-name="Group 3459"
                    transform="translate(192.063 65.772)"
                  >
                    <g
                      id="Group_3458"
                      data-name="Group 3458"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4210"
                        data-name="Rectangle 4210"
                        width="8"
                        height="7"
                        transform="translate(0.039 0.373)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3461"
                    data-name="Group 3461"
                    transform="translate(0.102 72.844)"
                  >
                    <g
                      id="Group_3460"
                      data-name="Group 3460"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4211"
                        data-name="Rectangle 4211"
                        width="7"
                        height="7"
                        transform="translate(0 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3463"
                    data-name="Group 3463"
                    transform="translate(16.267 72.844)"
                  >
                    <g
                      id="Group_3462"
                      data-name="Group 3462"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4212"
                        data-name="Rectangle 4212"
                        width="7"
                        height="7"
                        transform="translate(-0.165 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3465"
                    data-name="Group 3465"
                    transform="translate(32.432 72.844)"
                  >
                    <g
                      id="Group_3464"
                      data-name="Group 3464"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4213"
                        data-name="Rectangle 4213"
                        width="7"
                        height="7"
                        transform="translate(-0.33 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3467"
                    data-name="Group 3467"
                    transform="translate(39.505 72.844)"
                  >
                    <g
                      id="Group_3466"
                      data-name="Group 3466"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4214"
                        data-name="Rectangle 4214"
                        width="11"
                        height="7"
                        transform="translate(-0.402 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3469"
                    data-name="Group 3469"
                    transform="translate(55.67 72.844)"
                  >
                    <g
                      id="Group_3468"
                      data-name="Group 3468"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4215"
                        data-name="Rectangle 4215"
                        width="10"
                        height="7"
                        transform="translate(0.433 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3471"
                    data-name="Group 3471"
                    transform="translate(79.918 72.844)"
                  >
                    <g
                      id="Group_3470"
                      data-name="Group 3470"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4216"
                        data-name="Rectangle 4216"
                        width="7"
                        height="7"
                        transform="translate(0.185 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3473"
                    data-name="Group 3473"
                    transform="translate(86.99 72.844)"
                  >
                    <g
                      id="Group_3472"
                      data-name="Group 3472"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4217"
                        data-name="Rectangle 4217"
                        width="9"
                        height="7"
                        transform="translate(0.112 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3475"
                    data-name="Group 3475"
                    transform="translate(96.082 72.844)"
                  >
                    <g
                      id="Group_3474"
                      data-name="Group 3474"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4218"
                        data-name="Rectangle 4218"
                        width="8"
                        height="7"
                        transform="translate(0.02 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3477"
                    data-name="Group 3477"
                    transform="translate(129.423 72.844)"
                  >
                    <g
                      id="Group_3476"
                      data-name="Group 3476"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4219"
                        data-name="Rectangle 4219"
                        width="7"
                        height="7"
                        transform="translate(-0.321 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3479"
                    data-name="Group 3479"
                    transform="translate(136.496 72.844)"
                  >
                    <g
                      id="Group_3478"
                      data-name="Group 3478"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4220"
                        data-name="Rectangle 4220"
                        width="8"
                        height="7"
                        transform="translate(-0.394 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3481"
                    data-name="Group 3481"
                    transform="translate(151.65 72.844)"
                  >
                    <g
                      id="Group_3480"
                      data-name="Group 3480"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4221"
                        data-name="Rectangle 4221"
                        width="7"
                        height="7"
                        transform="translate(0.452 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3483"
                    data-name="Group 3483"
                    transform="translate(183.98 72.844)"
                  >
                    <g
                      id="Group_3482"
                      data-name="Group 3482"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4222"
                        data-name="Rectangle 4222"
                        width="8"
                        height="7"
                        transform="translate(0.122 0.301)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3485"
                    data-name="Group 3485"
                    transform="translate(16.267 79.916)"
                  >
                    <g
                      id="Group_3484"
                      data-name="Group 3484"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4223"
                        data-name="Rectangle 4223"
                        width="7"
                        height="7"
                        transform="translate(-0.165 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3487"
                    data-name="Group 3487"
                    transform="translate(49.608 79.916)"
                  >
                    <g
                      id="Group_3486"
                      data-name="Group 3486"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4224"
                        data-name="Rectangle 4224"
                        width="6"
                        height="7"
                        transform="translate(0.494 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3489"
                    data-name="Group 3489"
                    transform="translate(72.845 79.916)"
                  >
                    <g
                      id="Group_3488"
                      data-name="Group 3488"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4225"
                        data-name="Rectangle 4225"
                        width="7"
                        height="7"
                        transform="translate(0.257 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3491"
                    data-name="Group 3491"
                    transform="translate(96.082 79.916)"
                  >
                    <g
                      id="Group_3490"
                      data-name="Group 3490"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4226"
                        data-name="Rectangle 4226"
                        width="8"
                        height="7"
                        transform="translate(0.02 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3493"
                    data-name="Group 3493"
                    transform="translate(104.165 79.916)"
                  >
                    <g
                      id="Group_3492"
                      data-name="Group 3492"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4227"
                        data-name="Rectangle 4227"
                        width="9"
                        height="7"
                        transform="translate(-0.063 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3495"
                    data-name="Group 3495"
                    transform="translate(113.258 79.916)"
                  >
                    <g
                      id="Group_3494"
                      data-name="Group 3494"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4228"
                        data-name="Rectangle 4228"
                        width="7"
                        height="7"
                        transform="translate(-0.156 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3497"
                    data-name="Group 3497"
                    transform="translate(129.423 79.916)"
                  >
                    <g
                      id="Group_3496"
                      data-name="Group 3496"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4229"
                        data-name="Rectangle 4229"
                        width="7"
                        height="7"
                        transform="translate(-0.321 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3499"
                    data-name="Group 3499"
                    transform="translate(151.65 79.916)"
                  >
                    <g
                      id="Group_3498"
                      data-name="Group 3498"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4230"
                        data-name="Rectangle 4230"
                        width="7"
                        height="7"
                        transform="translate(0.452 0.228)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3501"
                    data-name="Group 3501"
                    transform="translate(0.102 86.989)"
                  >
                    <g
                      id="Group_3500"
                      data-name="Group 3500"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4231"
                        data-name="Rectangle 4231"
                        width="7"
                        height="9"
                        transform="translate(0 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3503"
                    data-name="Group 3503"
                    transform="translate(7.174 86.989)"
                  >
                    <g
                      id="Group_3502"
                      data-name="Group 3502"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4232"
                        data-name="Rectangle 4232"
                        width="9"
                        height="9"
                        transform="translate(-0.072 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3505"
                    data-name="Group 3505"
                    transform="translate(16.267 86.989)"
                  >
                    <g
                      id="Group_3504"
                      data-name="Group 3504"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4233"
                        data-name="Rectangle 4233"
                        width="7"
                        height="9"
                        transform="translate(-0.165 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3507"
                    data-name="Group 3507"
                    transform="translate(23.339 86.989)"
                  >
                    <g
                      id="Group_3506"
                      data-name="Group 3506"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4234"
                        data-name="Rectangle 4234"
                        width="9"
                        height="9"
                        transform="translate(-0.237 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3509"
                    data-name="Group 3509"
                    transform="translate(32.432 86.989)"
                  >
                    <g
                      id="Group_3508"
                      data-name="Group 3508"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4235"
                        data-name="Rectangle 4235"
                        width="7"
                        height="9"
                        transform="translate(-0.33 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3511"
                    data-name="Group 3511"
                    transform="translate(39.505 86.989)"
                  >
                    <g
                      id="Group_3510"
                      data-name="Group 3510"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4236"
                        data-name="Rectangle 4236"
                        width="11"
                        height="9"
                        transform="translate(-0.402 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3513"
                    data-name="Group 3513"
                    transform="translate(55.67 86.989)"
                  >
                    <g
                      id="Group_3512"
                      data-name="Group 3512"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4237"
                        data-name="Rectangle 4237"
                        width="10"
                        height="9"
                        transform="translate(0.433 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3515"
                    data-name="Group 3515"
                    transform="translate(65.773 86.989)"
                  >
                    <g
                      id="Group_3514"
                      data-name="Group 3514"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4238"
                        data-name="Rectangle 4238"
                        width="7"
                        height="9"
                        transform="translate(0.329 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3517"
                    data-name="Group 3517"
                    transform="translate(86.99 86.989)"
                  >
                    <g
                      id="Group_3516"
                      data-name="Group 3516"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4239"
                        data-name="Rectangle 4239"
                        width="9"
                        height="9"
                        transform="translate(0.112 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3519"
                    data-name="Group 3519"
                    transform="translate(96.082 86.989)"
                  >
                    <g
                      id="Group_3518"
                      data-name="Group 3518"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4240"
                        data-name="Rectangle 4240"
                        width="8"
                        height="9"
                        transform="translate(0.02 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3521"
                    data-name="Group 3521"
                    transform="translate(104.165 86.989)"
                  >
                    <g
                      id="Group_3520"
                      data-name="Group 3520"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4241"
                        data-name="Rectangle 4241"
                        width="9"
                        height="9"
                        transform="translate(-0.063 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3523"
                    data-name="Group 3523"
                    transform="translate(113.258 86.989)"
                  >
                    <g
                      id="Group_3522"
                      data-name="Group 3522"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4242"
                        data-name="Rectangle 4242"
                        width="7"
                        height="9"
                        transform="translate(-0.156 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3525"
                    data-name="Group 3525"
                    transform="translate(136.496 86.989)"
                  >
                    <g
                      id="Group_3524"
                      data-name="Group 3524"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4243"
                        data-name="Rectangle 4243"
                        width="8"
                        height="9"
                        transform="translate(-0.394 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3527"
                    data-name="Group 3527"
                    transform="translate(144.578 86.989)"
                  >
                    <g
                      id="Group_3526"
                      data-name="Group 3526"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4244"
                        data-name="Rectangle 4244"
                        width="8"
                        height="9"
                        transform="translate(-0.476 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3529"
                    data-name="Group 3529"
                    transform="translate(167.816 86.989)"
                  >
                    <g
                      id="Group_3528"
                      data-name="Group 3528"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4245"
                        data-name="Rectangle 4245"
                        width="9"
                        height="9"
                        transform="translate(0.287 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3531"
                    data-name="Group 3531"
                    transform="translate(176.908 86.989)"
                  >
                    <g
                      id="Group_3530"
                      data-name="Group 3530"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4246"
                        data-name="Rectangle 4246"
                        width="7"
                        height="9"
                        transform="translate(0.194 0.156)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3533"
                    data-name="Group 3533"
                    transform="translate(0.102 96.082)"
                  >
                    <g
                      id="Group_3532"
                      data-name="Group 3532"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4247"
                        data-name="Rectangle 4247"
                        width="7"
                        height="8"
                        transform="translate(0 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3535"
                    data-name="Group 3535"
                    transform="translate(49.608 96.082)"
                  >
                    <g
                      id="Group_3534"
                      data-name="Group 3534"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4248"
                        data-name="Rectangle 4248"
                        width="6"
                        height="8"
                        transform="translate(0.494 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3537"
                    data-name="Group 3537"
                    transform="translate(55.67 96.082)"
                  >
                    <g
                      id="Group_3536"
                      data-name="Group 3536"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4249"
                        data-name="Rectangle 4249"
                        width="10"
                        height="8"
                        transform="translate(0.433 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3539"
                    data-name="Group 3539"
                    transform="translate(79.918 96.082)"
                  >
                    <g
                      id="Group_3538"
                      data-name="Group 3538"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4250"
                        data-name="Rectangle 4250"
                        width="7"
                        height="8"
                        transform="translate(0.185 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3541"
                    data-name="Group 3541"
                    transform="translate(86.99 96.082)"
                  >
                    <g
                      id="Group_3540"
                      data-name="Group 3540"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4251"
                        data-name="Rectangle 4251"
                        width="9"
                        height="8"
                        transform="translate(0.112 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3543"
                    data-name="Group 3543"
                    transform="translate(104.165 96.082)"
                  >
                    <g
                      id="Group_3542"
                      data-name="Group 3542"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4252"
                        data-name="Rectangle 4252"
                        width="9"
                        height="8"
                        transform="translate(-0.063 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3545"
                    data-name="Group 3545"
                    transform="translate(113.258 96.082)"
                  >
                    <g
                      id="Group_3544"
                      data-name="Group 3544"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4253"
                        data-name="Rectangle 4253"
                        width="7"
                        height="8"
                        transform="translate(-0.156 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3547"
                    data-name="Group 3547"
                    transform="translate(136.496 96.082)"
                  >
                    <g
                      id="Group_3546"
                      data-name="Group 3546"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4254"
                        data-name="Rectangle 4254"
                        width="8"
                        height="8"
                        transform="translate(-0.394 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3549"
                    data-name="Group 3549"
                    transform="translate(144.578 96.082)"
                  >
                    <g
                      id="Group_3548"
                      data-name="Group 3548"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4255"
                        data-name="Rectangle 4255"
                        width="8"
                        height="8"
                        transform="translate(-0.476 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3551"
                    data-name="Group 3551"
                    transform="translate(151.65 96.082)"
                  >
                    <g
                      id="Group_3550"
                      data-name="Group 3550"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4256"
                        data-name="Rectangle 4256"
                        width="7"
                        height="8"
                        transform="translate(0.452 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3553"
                    data-name="Group 3553"
                    transform="translate(158.722 96.082)"
                  >
                    <g
                      id="Group_3552"
                      data-name="Group 3552"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4257"
                        data-name="Rectangle 4257"
                        width="9"
                        height="8"
                        transform="translate(0.38 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3555"
                    data-name="Group 3555"
                    transform="translate(176.908 96.082)"
                  >
                    <g
                      id="Group_3554"
                      data-name="Group 3554"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4258"
                        data-name="Rectangle 4258"
                        width="7"
                        height="8"
                        transform="translate(0.194 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3557"
                    data-name="Group 3557"
                    transform="translate(183.98 96.082)"
                  >
                    <g
                      id="Group_3556"
                      data-name="Group 3556"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4259"
                        data-name="Rectangle 4259"
                        width="8"
                        height="8"
                        transform="translate(0.122 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3559"
                    data-name="Group 3559"
                    transform="translate(192.063 96.082)"
                  >
                    <g
                      id="Group_3558"
                      data-name="Group 3558"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4260"
                        data-name="Rectangle 4260"
                        width="8"
                        height="8"
                        transform="translate(0.039 0.063)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3561"
                    data-name="Group 3561"
                    transform="translate(7.174 104.164)"
                  >
                    <g
                      id="Group_3560"
                      data-name="Group 3560"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4261"
                        data-name="Rectangle 4261"
                        width="9"
                        height="9"
                        transform="translate(-0.072 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3563"
                    data-name="Group 3563"
                    transform="translate(23.339 104.164)"
                  >
                    <g
                      id="Group_3562"
                      data-name="Group 3562"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4262"
                        data-name="Rectangle 4262"
                        width="9"
                        height="9"
                        transform="translate(-0.237 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3565"
                    data-name="Group 3565"
                    transform="translate(32.432 104.164)"
                  >
                    <g
                      id="Group_3564"
                      data-name="Group 3564"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4263"
                        data-name="Rectangle 4263"
                        width="7"
                        height="9"
                        transform="translate(-0.33 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3567"
                    data-name="Group 3567"
                    transform="translate(39.505 104.164)"
                  >
                    <g
                      id="Group_3566"
                      data-name="Group 3566"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4264"
                        data-name="Rectangle 4264"
                        width="11"
                        height="9"
                        transform="translate(-0.402 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3569"
                    data-name="Group 3569"
                    transform="translate(55.67 104.164)"
                  >
                    <g
                      id="Group_3568"
                      data-name="Group 3568"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4265"
                        data-name="Rectangle 4265"
                        width="10"
                        height="9"
                        transform="translate(0.433 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3571"
                    data-name="Group 3571"
                    transform="translate(79.918 104.164)"
                  >
                    <g
                      id="Group_3570"
                      data-name="Group 3570"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4266"
                        data-name="Rectangle 4266"
                        width="7"
                        height="9"
                        transform="translate(0.185 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3573"
                    data-name="Group 3573"
                    transform="translate(86.99 104.164)"
                  >
                    <g
                      id="Group_3572"
                      data-name="Group 3572"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4267"
                        data-name="Rectangle 4267"
                        width="9"
                        height="9"
                        transform="translate(0.112 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3575"
                    data-name="Group 3575"
                    transform="translate(104.165 104.164)"
                  >
                    <g
                      id="Group_3574"
                      data-name="Group 3574"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4268"
                        data-name="Rectangle 4268"
                        width="9"
                        height="9"
                        transform="translate(-0.063 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3577"
                    data-name="Group 3577"
                    transform="translate(113.258 104.164)"
                  >
                    <g
                      id="Group_3576"
                      data-name="Group 3576"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4269"
                        data-name="Rectangle 4269"
                        width="7"
                        height="9"
                        transform="translate(-0.156 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3579"
                    data-name="Group 3579"
                    transform="translate(120.33 104.164)"
                  >
                    <g
                      id="Group_3578"
                      data-name="Group 3578"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4270"
                        data-name="Rectangle 4270"
                        width="9"
                        height="9"
                        transform="translate(-0.228 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3581"
                    data-name="Group 3581"
                    transform="translate(129.423 104.164)"
                  >
                    <g
                      id="Group_3580"
                      data-name="Group 3580"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4271"
                        data-name="Rectangle 4271"
                        width="7"
                        height="9"
                        transform="translate(-0.321 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3583"
                    data-name="Group 3583"
                    transform="translate(144.578 104.164)"
                  >
                    <g
                      id="Group_3582"
                      data-name="Group 3582"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4272"
                        data-name="Rectangle 4272"
                        width="8"
                        height="9"
                        transform="translate(-0.476 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3585"
                    data-name="Group 3585"
                    transform="translate(151.65 104.164)"
                  >
                    <g
                      id="Group_3584"
                      data-name="Group 3584"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4273"
                        data-name="Rectangle 4273"
                        width="7"
                        height="9"
                        transform="translate(0.452 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3587"
                    data-name="Group 3587"
                    transform="translate(158.722 104.164)"
                  >
                    <g
                      id="Group_3586"
                      data-name="Group 3586"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4274"
                        data-name="Rectangle 4274"
                        width="9"
                        height="9"
                        transform="translate(0.38 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3589"
                    data-name="Group 3589"
                    transform="translate(192.063 104.164)"
                  >
                    <g
                      id="Group_3588"
                      data-name="Group 3588"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4275"
                        data-name="Rectangle 4275"
                        width="8"
                        height="9"
                        transform="translate(0.039 -0.019)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3591"
                    data-name="Group 3591"
                    transform="translate(7.174 113.257)"
                  >
                    <g
                      id="Group_3590"
                      data-name="Group 3590"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4276"
                        data-name="Rectangle 4276"
                        width="9"
                        height="7"
                        transform="translate(-0.072 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3593"
                    data-name="Group 3593"
                    transform="translate(16.267 113.257)"
                  >
                    <g
                      id="Group_3592"
                      data-name="Group 3592"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4277"
                        data-name="Rectangle 4277"
                        width="7"
                        height="7"
                        transform="translate(-0.165 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3595"
                    data-name="Group 3595"
                    transform="translate(49.608 113.257)"
                  >
                    <g
                      id="Group_3594"
                      data-name="Group 3594"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4278"
                        data-name="Rectangle 4278"
                        width="6"
                        height="7"
                        transform="translate(0.494 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3597"
                    data-name="Group 3597"
                    transform="translate(55.67 113.257)"
                  >
                    <g
                      id="Group_3596"
                      data-name="Group 3596"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4279"
                        data-name="Rectangle 4279"
                        width="10"
                        height="7"
                        transform="translate(0.433 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3599"
                    data-name="Group 3599"
                    transform="translate(65.773 113.257)"
                  >
                    <g
                      id="Group_3598"
                      data-name="Group 3598"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4280"
                        data-name="Rectangle 4280"
                        width="7"
                        height="7"
                        transform="translate(0.329 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3601"
                    data-name="Group 3601"
                    transform="translate(96.082 113.257)"
                  >
                    <g
                      id="Group_36000"
                      data-name="Group 36000"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4281"
                        data-name="Rectangle 4281"
                        width="8"
                        height="7"
                        transform="translate(0.02 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3603"
                    data-name="Group 3603"
                    transform="translate(113.258 113.257)"
                  >
                    <g
                      id="Group_3602"
                      data-name="Group 3602"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4282"
                        data-name="Rectangle 4282"
                        width="7"
                        height="7"
                        transform="translate(-0.156 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3605"
                    data-name="Group 3605"
                    transform="translate(136.496 113.257)"
                  >
                    <g
                      id="Group_3604"
                      data-name="Group 3604"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4283"
                        data-name="Rectangle 4283"
                        width="8"
                        height="7"
                        transform="translate(-0.394 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3607"
                    data-name="Group 3607"
                    transform="translate(158.722 113.257)"
                  >
                    <g
                      id="Group_3606"
                      data-name="Group 3606"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4284"
                        data-name="Rectangle 4284"
                        width="9"
                        height="7"
                        transform="translate(0.38 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3609"
                    data-name="Group 3609"
                    transform="translate(176.908 113.257)"
                  >
                    <g
                      id="Group_3608"
                      data-name="Group 3608"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4285"
                        data-name="Rectangle 4285"
                        width="7"
                        height="7"
                        transform="translate(0.194 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3611"
                    data-name="Group 3611"
                    transform="translate(183.98 113.257)"
                  >
                    <g
                      id="Group_3610"
                      data-name="Group 3610"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4286"
                        data-name="Rectangle 4286"
                        width="8"
                        height="7"
                        transform="translate(0.122 -0.112)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3613"
                    data-name="Group 3613"
                    transform="translate(0.102 120.329)"
                  >
                    <g
                      id="Group_3612"
                      data-name="Group 3612"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4287"
                        data-name="Rectangle 4287"
                        width="7"
                        height="9"
                        transform="translate(0 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3615"
                    data-name="Group 3615"
                    transform="translate(32.432 120.329)"
                  >
                    <g
                      id="Group_3614"
                      data-name="Group 3614"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4288"
                        data-name="Rectangle 4288"
                        width="7"
                        height="9"
                        transform="translate(-0.33 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3617"
                    data-name="Group 3617"
                    transform="translate(39.505 120.329)"
                  >
                    <g
                      id="Group_3616"
                      data-name="Group 3616"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4289"
                        data-name="Rectangle 4289"
                        width="11"
                        height="9"
                        transform="translate(-0.402 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3619"
                    data-name="Group 3619"
                    transform="translate(79.918 120.329)"
                  >
                    <g
                      id="Group_3618"
                      data-name="Group 3618"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4290"
                        data-name="Rectangle 4290"
                        width="7"
                        height="9"
                        transform="translate(0.185 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3621"
                    data-name="Group 3621"
                    transform="translate(96.082 120.329)"
                  >
                    <g
                      id="Group_3620"
                      data-name="Group 3620"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4291"
                        data-name="Rectangle 4291"
                        width="8"
                        height="9"
                        transform="translate(0.02 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3623"
                    data-name="Group 3623"
                    transform="translate(113.258 120.329)"
                  >
                    <g
                      id="Group_3622"
                      data-name="Group 3622"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4292"
                        data-name="Rectangle 4292"
                        width="7"
                        height="9"
                        transform="translate(-0.156 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3625"
                    data-name="Group 3625"
                    transform="translate(120.33 120.329)"
                  >
                    <g
                      id="Group_3624"
                      data-name="Group 3624"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4293"
                        data-name="Rectangle 4293"
                        width="9"
                        height="9"
                        transform="translate(-0.228 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3627"
                    data-name="Group 3627"
                    transform="translate(136.496 120.329)"
                  >
                    <g
                      id="Group_3626"
                      data-name="Group 3626"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4294"
                        data-name="Rectangle 4294"
                        width="8"
                        height="9"
                        transform="translate(-0.394 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3629"
                    data-name="Group 3629"
                    transform="translate(151.65 120.329)"
                  >
                    <g
                      id="Group_3628"
                      data-name="Group 3628"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4295"
                        data-name="Rectangle 4295"
                        width="7"
                        height="9"
                        transform="translate(0.452 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3631"
                    data-name="Group 3631"
                    transform="translate(158.722 120.329)"
                  >
                    <g
                      id="Group_3630"
                      data-name="Group 3630"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4296"
                        data-name="Rectangle 4296"
                        width="9"
                        height="9"
                        transform="translate(0.38 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3633"
                    data-name="Group 3633"
                    transform="translate(192.063 120.329)"
                  >
                    <g
                      id="Group_3632"
                      data-name="Group 3632"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4297"
                        data-name="Rectangle 4297"
                        width="8"
                        height="9"
                        transform="translate(0.039 -0.185)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3635"
                    data-name="Group 3635"
                    transform="translate(16.267 129.422)"
                  >
                    <g
                      id="Group_3634"
                      data-name="Group 3634"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4298"
                        data-name="Rectangle 4298"
                        width="7"
                        height="7"
                        transform="translate(-0.165 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3637"
                    data-name="Group 3637"
                    transform="translate(32.432 129.422)"
                  >
                    <g
                      id="Group_3636"
                      data-name="Group 3636"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4299"
                        data-name="Rectangle 4299"
                        width="7"
                        height="7"
                        transform="translate(-0.33 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3639"
                    data-name="Group 3639"
                    transform="translate(49.608 129.422)"
                  >
                    <g
                      id="Group_3638"
                      data-name="Group 3638"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4300"
                        data-name="Rectangle 4300"
                        width="6"
                        height="7"
                        transform="translate(0.494 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3641"
                    data-name="Group 3641"
                    transform="translate(86.99 129.422)"
                  >
                    <g
                      id="Group_3640"
                      data-name="Group 3640"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4301"
                        data-name="Rectangle 4301"
                        width="9"
                        height="7"
                        transform="translate(0.112 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3643"
                    data-name="Group 3643"
                    transform="translate(104.165 129.422)"
                  >
                    <g
                      id="Group_3642"
                      data-name="Group 3642"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4302"
                        data-name="Rectangle 4302"
                        width="9"
                        height="7"
                        transform="translate(-0.063 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3645"
                    data-name="Group 3645"
                    transform="translate(129.423 129.422)"
                  >
                    <g
                      id="Group_3644"
                      data-name="Group 3644"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4303"
                        data-name="Rectangle 4303"
                        width="7"
                        height="7"
                        transform="translate(-0.321 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3647"
                    data-name="Group 3647"
                    transform="translate(136.496 129.422)"
                  >
                    <g
                      id="Group_3646"
                      data-name="Group 3646"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4304"
                        data-name="Rectangle 4304"
                        width="8"
                        height="7"
                        transform="translate(-0.394 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3649"
                    data-name="Group 3649"
                    transform="translate(144.578 129.422)"
                  >
                    <g
                      id="Group_3648"
                      data-name="Group 3648"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4305"
                        data-name="Rectangle 4305"
                        width="8"
                        height="7"
                        transform="translate(-0.476 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3651"
                    data-name="Group 3651"
                    transform="translate(151.65 129.422)"
                  >
                    <g
                      id="Group_3650"
                      data-name="Group 3650"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4306"
                        data-name="Rectangle 4306"
                        width="7"
                        height="7"
                        transform="translate(0.452 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3653"
                    data-name="Group 3653"
                    transform="translate(158.722 129.422)"
                  >
                    <g
                      id="Group_3652"
                      data-name="Group 3652"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4307"
                        data-name="Rectangle 4307"
                        width="9"
                        height="7"
                        transform="translate(0.38 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3655"
                    data-name="Group 3655"
                    transform="translate(167.816 129.422)"
                  >
                    <g
                      id="Group_3654"
                      data-name="Group 3654"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4308"
                        data-name="Rectangle 4308"
                        width="9"
                        height="7"
                        transform="translate(0.287 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3657"
                    data-name="Group 3657"
                    transform="translate(176.908 129.422)"
                  >
                    <g
                      id="Group_3656"
                      data-name="Group 3656"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4309"
                        data-name="Rectangle 4309"
                        width="7"
                        height="7"
                        transform="translate(0.194 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3659"
                    data-name="Group 3659"
                    transform="translate(183.98 129.422)"
                  >
                    <g
                      id="Group_3658"
                      data-name="Group 3658"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4310"
                        data-name="Rectangle 4310"
                        width="8"
                        height="7"
                        transform="translate(0.122 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3661"
                    data-name="Group 3661"
                    transform="translate(192.063 129.422)"
                  >
                    <g
                      id="Group_3660"
                      data-name="Group 3660"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4311"
                        data-name="Rectangle 4311"
                        width="8"
                        height="7"
                        transform="translate(0.039 -0.278)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3663"
                    data-name="Group 3663"
                    transform="translate(65.773 136.494)"
                  >
                    <g
                      id="Group_3662"
                      data-name="Group 3662"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4312"
                        data-name="Rectangle 4312"
                        width="7"
                        height="8"
                        transform="translate(0.329 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3665"
                    data-name="Group 3665"
                    transform="translate(72.845 136.494)"
                  >
                    <g
                      id="Group_3664"
                      data-name="Group 3664"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4313"
                        data-name="Rectangle 4313"
                        width="7"
                        height="8"
                        transform="translate(0.257 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3667"
                    data-name="Group 3667"
                    transform="translate(79.918 136.494)"
                  >
                    <g
                      id="Group_3666"
                      data-name="Group 3666"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4314"
                        data-name="Rectangle 4314"
                        width="7"
                        height="8"
                        transform="translate(0.185 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3669"
                    data-name="Group 3669"
                    transform="translate(96.082 136.494)"
                  >
                    <g
                      id="Group_3668"
                      data-name="Group 3668"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4315"
                        data-name="Rectangle 4315"
                        width="8"
                        height="8"
                        transform="translate(0.02 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3671"
                    data-name="Group 3671"
                    transform="translate(129.423 136.494)"
                  >
                    <g
                      id="Group_3670"
                      data-name="Group 3670"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4316"
                        data-name="Rectangle 4316"
                        width="7"
                        height="8"
                        transform="translate(-0.321 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3673"
                    data-name="Group 3673"
                    transform="translate(158.722 136.494)"
                  >
                    <g
                      id="Group_3672"
                      data-name="Group 3672"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4317"
                        data-name="Rectangle 4317"
                        width="9"
                        height="8"
                        transform="translate(0.38 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3675"
                    data-name="Group 3675"
                    transform="translate(176.908 136.494)"
                  >
                    <g
                      id="Group_3674"
                      data-name="Group 3674"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4318"
                        data-name="Rectangle 4318"
                        width="7"
                        height="8"
                        transform="translate(0.194 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3677"
                    data-name="Group 3677"
                    transform="translate(192.063 136.494)"
                  >
                    <g
                      id="Group_3676"
                      data-name="Group 3676"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4319"
                        data-name="Rectangle 4319"
                        width="8"
                        height="8"
                        transform="translate(0.039 -0.35)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3679"
                    data-name="Group 3679"
                    transform="translate(65.773 144.577)"
                  >
                    <g
                      id="Group_3678"
                      data-name="Group 3678"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4320"
                        data-name="Rectangle 4320"
                        width="7"
                        height="8"
                        transform="translate(0.329 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3681"
                    data-name="Group 3681"
                    transform="translate(72.845 144.577)"
                  >
                    <g
                      id="Group_3680"
                      data-name="Group 3680"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4321"
                        data-name="Rectangle 4321"
                        width="7"
                        height="8"
                        transform="translate(0.257 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3683"
                    data-name="Group 3683"
                    transform="translate(79.918 144.577)"
                  >
                    <g
                      id="Group_3682"
                      data-name="Group 3682"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4322"
                        data-name="Rectangle 4322"
                        width="7"
                        height="8"
                        transform="translate(0.185 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3685"
                    data-name="Group 3685"
                    transform="translate(86.99 144.577)"
                  >
                    <g
                      id="Group_3684"
                      data-name="Group 3684"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4323"
                        data-name="Rectangle 4323"
                        width="9"
                        height="8"
                        transform="translate(0.112 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3687"
                    data-name="Group 3687"
                    transform="translate(96.082 144.577)"
                  >
                    <g
                      id="Group_3686"
                      data-name="Group 3686"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4324"
                        data-name="Rectangle 4324"
                        width="8"
                        height="8"
                        transform="translate(0.02 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3689"
                    data-name="Group 3689"
                    transform="translate(113.258 144.577)"
                  >
                    <g
                      id="Group_3688"
                      data-name="Group 3688"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4325"
                        data-name="Rectangle 4325"
                        width="7"
                        height="8"
                        transform="translate(-0.156 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3691"
                    data-name="Group 3691"
                    transform="translate(129.423 144.577)"
                  >
                    <g
                      id="Group_3690"
                      data-name="Group 3690"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4326"
                        data-name="Rectangle 4326"
                        width="7"
                        height="8"
                        transform="translate(-0.321 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3693"
                    data-name="Group 3693"
                    transform="translate(144.578 144.577)"
                  >
                    <g
                      id="Group_3692"
                      data-name="Group 3692"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4327"
                        data-name="Rectangle 4327"
                        width="8"
                        height="8"
                        transform="translate(-0.476 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3695"
                    data-name="Group 3695"
                    transform="translate(158.722 144.577)"
                  >
                    <g
                      id="Group_3694"
                      data-name="Group 3694"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4328"
                        data-name="Rectangle 4328"
                        width="9"
                        height="8"
                        transform="translate(0.38 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3697"
                    data-name="Group 3697"
                    transform="translate(176.908 144.577)"
                  >
                    <g
                      id="Group_3696"
                      data-name="Group 3696"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4329"
                        data-name="Rectangle 4329"
                        width="7"
                        height="8"
                        transform="translate(0.194 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3699"
                    data-name="Group 3699"
                    transform="translate(183.98 144.577)"
                  >
                    <g
                      id="Group_3698"
                      data-name="Group 3698"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4330"
                        data-name="Rectangle 4330"
                        width="8"
                        height="8"
                        transform="translate(0.122 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3701"
                    data-name="Group 3701"
                    transform="translate(192.063 144.577)"
                  >
                    <g
                      id="Group_3700"
                      data-name="Group 3700"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4331"
                        data-name="Rectangle 4331"
                        width="8"
                        height="8"
                        transform="translate(0.039 -0.432)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3703"
                    data-name="Group 3703"
                    transform="translate(65.773 151.649)"
                  >
                    <g
                      id="Group_3702"
                      data-name="Group 3702"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4332"
                        data-name="Rectangle 4332"
                        width="7"
                        height="7"
                        transform="translate(0.329 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3705"
                    data-name="Group 3705"
                    transform="translate(79.918 151.649)"
                  >
                    <g
                      id="Group_3704"
                      data-name="Group 3704"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4333"
                        data-name="Rectangle 4333"
                        width="7"
                        height="7"
                        transform="translate(0.185 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3707"
                    data-name="Group 3707"
                    transform="translate(96.082 151.649)"
                  >
                    <g
                      id="Group_3706"
                      data-name="Group 3706"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4334"
                        data-name="Rectangle 4334"
                        width="8"
                        height="7"
                        transform="translate(0.02 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3709"
                    data-name="Group 3709"
                    transform="translate(120.33 151.649)"
                  >
                    <g
                      id="Group_3708"
                      data-name="Group 3708"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4335"
                        data-name="Rectangle 4335"
                        width="9"
                        height="7"
                        transform="translate(-0.228 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3711"
                    data-name="Group 3711"
                    transform="translate(129.423 151.649)"
                  >
                    <g
                      id="Group_3710"
                      data-name="Group 3710"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4336"
                        data-name="Rectangle 4336"
                        width="7"
                        height="7"
                        transform="translate(-0.321 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3713"
                    data-name="Group 3713"
                    transform="translate(158.722 151.649)"
                  >
                    <g
                      id="Group_3712"
                      data-name="Group 3712"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4337"
                        data-name="Rectangle 4337"
                        width="9"
                        height="7"
                        transform="translate(0.38 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3715"
                    data-name="Group 3715"
                    transform="translate(183.98 151.649)"
                  >
                    <g
                      id="Group_3714"
                      data-name="Group 3714"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4338"
                        data-name="Rectangle 4338"
                        width="8"
                        height="7"
                        transform="translate(0.122 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3717"
                    data-name="Group 3717"
                    transform="translate(192.063 151.649)"
                  >
                    <g
                      id="Group_3716"
                      data-name="Group 3716"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4339"
                        data-name="Rectangle 4339"
                        width="8"
                        height="7"
                        transform="translate(0.039 0.495)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3719"
                    data-name="Group 3719"
                    transform="translate(86.99 158.721)"
                  >
                    <g
                      id="Group_3718"
                      data-name="Group 3718"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4340"
                        data-name="Rectangle 4340"
                        width="9"
                        height="9"
                        transform="translate(0.112 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3721"
                    data-name="Group 3721"
                    transform="translate(96.082 158.721)"
                  >
                    <g
                      id="Group_3720"
                      data-name="Group 3720"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4341"
                        data-name="Rectangle 4341"
                        width="8"
                        height="9"
                        transform="translate(0.02 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3723"
                    data-name="Group 3723"
                    transform="translate(104.165 158.721)"
                  >
                    <g
                      id="Group_3722"
                      data-name="Group 3722"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4342"
                        data-name="Rectangle 4342"
                        width="9"
                        height="9"
                        transform="translate(-0.063 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3725"
                    data-name="Group 3725"
                    transform="translate(129.423 158.721)"
                  >
                    <g
                      id="Group_3724"
                      data-name="Group 3724"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4343"
                        data-name="Rectangle 4343"
                        width="7"
                        height="9"
                        transform="translate(-0.321 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3727"
                    data-name="Group 3727"
                    transform="translate(136.496 158.721)"
                  >
                    <g
                      id="Group_3726"
                      data-name="Group 3726"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4344"
                        data-name="Rectangle 4344"
                        width="8"
                        height="9"
                        transform="translate(-0.394 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3729"
                    data-name="Group 3729"
                    transform="translate(144.578 158.721)"
                  >
                    <g
                      id="Group_3728"
                      data-name="Group 3728"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4345"
                        data-name="Rectangle 4345"
                        width="8"
                        height="9"
                        transform="translate(-0.476 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3731"
                    data-name="Group 3731"
                    transform="translate(151.65 158.721)"
                  >
                    <g
                      id="Group_3730"
                      data-name="Group 3730"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4346"
                        data-name="Rectangle 4346"
                        width="7"
                        height="9"
                        transform="translate(0.452 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3733"
                    data-name="Group 3733"
                    transform="translate(158.722 158.721)"
                  >
                    <g
                      id="Group_3732"
                      data-name="Group 3732"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4347"
                        data-name="Rectangle 4347"
                        width="9"
                        height="9"
                        transform="translate(0.38 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3735"
                    data-name="Group 3735"
                    transform="translate(167.816 158.721)"
                  >
                    <g
                      id="Group_3734"
                      data-name="Group 3734"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4348"
                        data-name="Rectangle 4348"
                        width="9"
                        height="9"
                        transform="translate(0.287 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3737"
                    data-name="Group 3737"
                    transform="translate(183.98 158.721)"
                  >
                    <g
                      id="Group_3736"
                      data-name="Group 3736"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4349"
                        data-name="Rectangle 4349"
                        width="8"
                        height="9"
                        transform="translate(0.122 0.423)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3739"
                    data-name="Group 3739"
                    transform="translate(65.773 167.814)"
                  >
                    <g
                      id="Group_3738"
                      data-name="Group 3738"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4350"
                        data-name="Rectangle 4350"
                        width="7"
                        height="9"
                        transform="translate(0.329 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3741"
                    data-name="Group 3741"
                    transform="translate(79.918 167.814)"
                  >
                    <g
                      id="Group_3740"
                      data-name="Group 3740"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4351"
                        data-name="Rectangle 4351"
                        width="7"
                        height="9"
                        transform="translate(0.185 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3743"
                    data-name="Group 3743"
                    transform="translate(96.082 167.814)"
                  >
                    <g
                      id="Group_3742"
                      data-name="Group 3742"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4352"
                        data-name="Rectangle 4352"
                        width="8"
                        height="9"
                        transform="translate(0.02 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3745"
                    data-name="Group 3745"
                    transform="translate(104.165 167.814)"
                  >
                    <g
                      id="Group_3744"
                      data-name="Group 3744"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4353"
                        data-name="Rectangle 4353"
                        width="9"
                        height="9"
                        transform="translate(-0.063 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3747"
                    data-name="Group 3747"
                    transform="translate(120.33 167.814)"
                  >
                    <g
                      id="Group_3746"
                      data-name="Group 3746"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4354"
                        data-name="Rectangle 4354"
                        width="9"
                        height="9"
                        transform="translate(-0.228 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3749"
                    data-name="Group 3749"
                    transform="translate(129.423 167.814)"
                  >
                    <g
                      id="Group_3748"
                      data-name="Group 3748"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4355"
                        data-name="Rectangle 4355"
                        width="7"
                        height="9"
                        transform="translate(-0.321 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3751"
                    data-name="Group 3751"
                    transform="translate(144.578 167.814)"
                  >
                    <g
                      id="Group_3750"
                      data-name="Group 3750"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4356"
                        data-name="Rectangle 4356"
                        width="8"
                        height="9"
                        transform="translate(-0.476 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3753"
                    data-name="Group 3753"
                    transform="translate(158.722 167.814)"
                  >
                    <g
                      id="Group_3752"
                      data-name="Group 3752"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4357"
                        data-name="Rectangle 4357"
                        width="9"
                        height="9"
                        transform="translate(0.38 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3755"
                    data-name="Group 3755"
                    transform="translate(167.816 167.814)"
                  >
                    <g
                      id="Group_3754"
                      data-name="Group 3754"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4358"
                        data-name="Rectangle 4358"
                        width="9"
                        height="9"
                        transform="translate(0.287 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3757"
                    data-name="Group 3757"
                    transform="translate(176.908 167.814)"
                  >
                    <g
                      id="Group_3756"
                      data-name="Group 3756"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4359"
                        data-name="Rectangle 4359"
                        width="7"
                        height="9"
                        transform="translate(0.194 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3759"
                    data-name="Group 3759"
                    transform="translate(183.98 167.814)"
                  >
                    <g
                      id="Group_3758"
                      data-name="Group 3758"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4360"
                        data-name="Rectangle 4360"
                        width="8"
                        height="9"
                        transform="translate(0.122 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3761"
                    data-name="Group 3761"
                    transform="translate(192.063 167.814)"
                  >
                    <g
                      id="Group_3760"
                      data-name="Group 3760"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4361"
                        data-name="Rectangle 4361"
                        width="8"
                        height="9"
                        transform="translate(0.039 0.33)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3763"
                    data-name="Group 3763"
                    transform="translate(65.773 176.907)"
                  >
                    <g
                      id="Group_3762"
                      data-name="Group 3762"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4362"
                        data-name="Rectangle 4362"
                        width="7"
                        height="7"
                        transform="translate(0.329 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3765"
                    data-name="Group 3765"
                    transform="translate(79.918 176.907)"
                  >
                    <g
                      id="Group_3764"
                      data-name="Group 3764"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4363"
                        data-name="Rectangle 4363"
                        width="7"
                        height="7"
                        transform="translate(0.185 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3767"
                    data-name="Group 3767"
                    transform="translate(86.99 176.907)"
                  >
                    <g
                      id="Group_3766"
                      data-name="Group 3766"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4364"
                        data-name="Rectangle 4364"
                        width="9"
                        height="7"
                        transform="translate(0.112 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3769"
                    data-name="Group 3769"
                    transform="translate(96.082 176.907)"
                  >
                    <g
                      id="Group_3768"
                      data-name="Group 3768"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4365"
                        data-name="Rectangle 4365"
                        width="8"
                        height="7"
                        transform="translate(0.02 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3771"
                    data-name="Group 3771"
                    transform="translate(104.165 176.907)"
                  >
                    <g
                      id="Group_3770"
                      data-name="Group 3770"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4366"
                        data-name="Rectangle 4366"
                        width="9"
                        height="7"
                        transform="translate(-0.063 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3773"
                    data-name="Group 3773"
                    transform="translate(136.496 176.907)"
                  >
                    <g
                      id="Group_3772"
                      data-name="Group 3772"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4367"
                        data-name="Rectangle 4367"
                        width="8"
                        height="7"
                        transform="translate(-0.394 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3775"
                    data-name="Group 3775"
                    transform="translate(144.578 176.907)"
                  >
                    <g
                      id="Group_3774"
                      data-name="Group 3774"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4368"
                        data-name="Rectangle 4368"
                        width="8"
                        height="7"
                        transform="translate(-0.476 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3777"
                    data-name="Group 3777"
                    transform="translate(158.722 176.907)"
                  >
                    <g
                      id="Group_3776"
                      data-name="Group 3776"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4369"
                        data-name="Rectangle 4369"
                        width="9"
                        height="7"
                        transform="translate(0.38 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3779"
                    data-name="Group 3779"
                    transform="translate(176.908 176.907)"
                  >
                    <g
                      id="Group_3778"
                      data-name="Group 3778"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4370"
                        data-name="Rectangle 4370"
                        width="7"
                        height="7"
                        transform="translate(0.194 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3781"
                    data-name="Group 3781"
                    transform="translate(183.98 176.907)"
                  >
                    <g
                      id="Group_3780"
                      data-name="Group 3780"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4371"
                        data-name="Rectangle 4371"
                        width="8"
                        height="7"
                        transform="translate(0.122 0.237)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3783"
                    data-name="Group 3783"
                    transform="translate(72.845 183.98)"
                  >
                    <g
                      id="Group_3782"
                      data-name="Group 3782"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4372"
                        data-name="Rectangle 4372"
                        width="7"
                        height="8"
                        transform="translate(0.257 0.165)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3785"
                    data-name="Group 3785"
                    transform="translate(79.918 183.98)"
                  >
                    <g
                      id="Group_3784"
                      data-name="Group 3784"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4373"
                        data-name="Rectangle 4373"
                        width="7"
                        height="8"
                        transform="translate(0.185 0.165)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3787"
                    data-name="Group 3787"
                    transform="translate(120.33 183.98)"
                  >
                    <g
                      id="Group_3786"
                      data-name="Group 3786"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4374"
                        data-name="Rectangle 4374"
                        width="9"
                        height="8"
                        transform="translate(-0.228 0.165)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3789"
                    data-name="Group 3789"
                    transform="translate(136.496 183.98)"
                  >
                    <g
                      id="Group_3788"
                      data-name="Group 3788"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4375"
                        data-name="Rectangle 4375"
                        width="8"
                        height="8"
                        transform="translate(-0.394 0.165)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3791"
                    data-name="Group 3791"
                    transform="translate(144.578 183.98)"
                  >
                    <g
                      id="Group_3790"
                      data-name="Group 3790"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4376"
                        data-name="Rectangle 4376"
                        width="8"
                        height="8"
                        transform="translate(-0.476 0.165)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3793"
                    data-name="Group 3793"
                    transform="translate(158.722 183.98)"
                  >
                    <g
                      id="Group_3792"
                      data-name="Group 3792"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4377"
                        data-name="Rectangle 4377"
                        width="9"
                        height="8"
                        transform="translate(0.38 0.165)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3795"
                    data-name="Group 3795"
                    transform="translate(176.908 183.98)"
                  >
                    <g
                      id="Group_3794"
                      data-name="Group 3794"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4378"
                        data-name="Rectangle 4378"
                        width="7"
                        height="8"
                        transform="translate(0.194 0.165)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3797"
                    data-name="Group 3797"
                    transform="translate(65.773 192.062)"
                  >
                    <g
                      id="Group_3796"
                      data-name="Group 3796"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4379"
                        data-name="Rectangle 4379"
                        width="7"
                        height="8"
                        transform="translate(0.329 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3799"
                    data-name="Group 3799"
                    transform="translate(72.845 192.062)"
                  >
                    <g
                      id="Group_3798"
                      data-name="Group 3798"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4380"
                        data-name="Rectangle 4380"
                        width="7"
                        height="8"
                        transform="translate(0.257 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3801"
                    data-name="Group 3801"
                    transform="translate(96.082 192.062)"
                  >
                    <g
                      id="Group_3800"
                      data-name="Group 3800"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4381"
                        data-name="Rectangle 4381"
                        width="8"
                        height="8"
                        transform="translate(0.02 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3803"
                    data-name="Group 3803"
                    transform="translate(113.258 192.062)"
                  >
                    <g
                      id="Group_3802"
                      data-name="Group 3802"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4382"
                        data-name="Rectangle 4382"
                        width="7"
                        height="8"
                        transform="translate(-0.156 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3805"
                    data-name="Group 3805"
                    transform="translate(151.65 192.062)"
                  >
                    <g
                      id="Group_3804"
                      data-name="Group 3804"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4383"
                        data-name="Rectangle 4383"
                        width="7"
                        height="8"
                        transform="translate(0.452 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3807"
                    data-name="Group 3807"
                    transform="translate(158.722 192.062)"
                  >
                    <g
                      id="Group_3806"
                      data-name="Group 3806"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4384"
                        data-name="Rectangle 4384"
                        width="9"
                        height="8"
                        transform="translate(0.38 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3809"
                    data-name="Group 3809"
                    transform="translate(167.816 192.062)"
                  >
                    <g
                      id="Group_3808"
                      data-name="Group 3808"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4385"
                        data-name="Rectangle 4385"
                        width="9"
                        height="8"
                        transform="translate(0.287 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3811"
                    data-name="Group 3811"
                    transform="translate(176.908 192.062)"
                  >
                    <g
                      id="Group_3810"
                      data-name="Group 3810"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4386"
                        data-name="Rectangle 4386"
                        width="7"
                        height="8"
                        transform="translate(0.194 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3813"
                    data-name="Group 3813"
                    transform="translate(183.98 192.062)"
                  >
                    <g
                      id="Group_3812"
                      data-name="Group 3812"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4387"
                        data-name="Rectangle 4387"
                        width="8"
                        height="8"
                        transform="translate(0.122 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3815"
                    data-name="Group 3815"
                    transform="translate(192.063 192.062)"
                  >
                    <g
                      id="Group_3814"
                      data-name="Group 3814"
                      transform="translate(0 0)"
                    >
                      <rect
                        id="Rectangle_4388"
                        data-name="Rectangle 4388"
                        width="8"
                        height="8"
                        transform="translate(0.039 0.082)"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_3818"
                    data-name="Group 3818"
                    transform="translate(0.265 0.289)"
                  >
                    <g id="Group_3817" data-name="Group 3817">
                      <g id="Group_3816" data-name="Group 3816">
                        <path
                          id="Path_15505"
                          data-name="Path 15505"
                          d="M70.453,42.022H52.708a10.8,10.8,0,0,0-6.142,1.9,10.644,10.644,0,0,0-3.272,3.592,10.253,10.253,0,0,0-1.295,5V70.678a10.616,10.616,0,0,0,10.711,10.5l8.87,0,8.87,0A10.616,10.616,0,0,0,81.162,70.678V52.512A10.613,10.613,0,0,0,70.453,42.022Z"
                          transform="translate(-33.608 -33.631)"
                          fill="none"
                        />
                        <path
                          id="Path_15506"
                          data-name="Path 15506"
                          d="M36.845.022H19.1A19.109,19.109,0,0,0,.783,13.545,18.534,18.534,0,0,0,.22,16.032,18.771,18.771,0,0,0,0,18.9V37.07A19.016,19.016,0,0,0,19.1,55.957l8.872,0,8.872,0a19.017,19.017,0,0,0,19.1-18.887V18.9A19.015,19.015,0,0,0,36.845.022ZM47.553,37.07a10.616,10.616,0,0,1-10.711,10.5l-8.87,0-8.87,0A10.616,10.616,0,0,1,8.392,37.07V18.9a10.262,10.262,0,0,1,1.294-5,10.644,10.644,0,0,1,3.272-3.592,10.8,10.8,0,0,1,6.142-1.9H36.845A10.613,10.613,0,0,1,47.553,18.9Z"
                          transform="translate(0 -0.022)"
                        />
                      </g>
                    </g>
                  </g>
                  <g
                    id="Group_3821"
                    data-name="Group 3821"
                    transform="translate(144.124 0.289)"
                  >
                    <g id="Group_3820" data-name="Group 3820">
                      <g id="Group_3819" data-name="Group 3819">
                        <path
                          id="Path_15507"
                          data-name="Path 15507"
                          d="M70.453,42.022H52.708a10.8,10.8,0,0,0-6.142,1.9,10.644,10.644,0,0,0-3.272,3.592,10.253,10.253,0,0,0-1.295,5V70.678a10.616,10.616,0,0,0,10.711,10.5l8.87,0,8.87,0A10.616,10.616,0,0,0,81.162,70.678V52.512A10.613,10.613,0,0,0,70.453,42.022Z"
                          transform="translate(-33.608 -33.631)"
                          fill="none"
                        />
                        <path
                          id="Path_15508"
                          data-name="Path 15508"
                          d="M36.845.022H19.1A19.109,19.109,0,0,0,.783,13.545,18.534,18.534,0,0,0,.22,16.032,18.771,18.771,0,0,0,0,18.9V37.07A19.016,19.016,0,0,0,19.1,55.957l8.872,0,8.872,0a19.017,19.017,0,0,0,19.1-18.887V18.9A19.015,19.015,0,0,0,36.845.022ZM47.553,37.07a10.616,10.616,0,0,1-10.711,10.5l-8.87,0-8.87,0A10.616,10.616,0,0,1,8.392,37.07V18.9a10.262,10.262,0,0,1,1.294-5,10.644,10.644,0,0,1,3.272-3.592,10.8,10.8,0,0,1,6.142-1.9H36.845A10.613,10.613,0,0,1,47.553,18.9Z"
                          transform="translate(0 -0.022)"
                        />
                      </g>
                    </g>
                  </g>
                  <g
                    id="Group_3824"
                    data-name="Group 3824"
                    transform="translate(0.265 144.149)"
                  >
                    <g
                      id="Group_3823"
                      data-name="Group 3823"
                      transform="translate(0 0)"
                    >
                      <g id="Group_3822" data-name="Group 3822">
                        <path
                          id="Path_15509"
                          data-name="Path 15509"
                          d="M70.453,42.022H52.708a10.8,10.8,0,0,0-6.142,1.9,10.644,10.644,0,0,0-3.272,3.592,10.253,10.253,0,0,0-1.295,5V70.678a10.616,10.616,0,0,0,10.711,10.5l8.87,0,8.87,0A10.616,10.616,0,0,0,81.162,70.678V52.512A10.613,10.613,0,0,0,70.453,42.022Z"
                          transform="translate(-33.608 -33.631)"
                          fill="none"
                        />
                        <path
                          id="Path_15510"
                          data-name="Path 15510"
                          d="M36.845.022H19.1A19.109,19.109,0,0,0,.783,13.545,18.534,18.534,0,0,0,.22,16.032,18.771,18.771,0,0,0,0,18.9V37.07A19.016,19.016,0,0,0,19.1,55.957l8.872,0,8.872,0a19.017,19.017,0,0,0,19.1-18.887V18.9A19.015,19.015,0,0,0,36.845.022ZM47.553,37.07a10.616,10.616,0,0,1-10.711,10.5l-8.87,0-8.87,0A10.616,10.616,0,0,1,8.392,37.07V18.9a10.262,10.262,0,0,1,1.294-5,10.644,10.644,0,0,1,3.272-3.592,10.8,10.8,0,0,1,6.142-1.9H36.845A10.613,10.613,0,0,1,47.553,18.9Z"
                          transform="translate(0 -0.022)"
                        />
                      </g>
                    </g>
                  </g>
                  <g
                    id="Group_3828"
                    data-name="Group 3828"
                    transform="translate(16.246 16.269)"
                  >
                    <g
                      id="Group_3827"
                      data-name="Group 3827"
                      transform="translate(0)"
                    >
                      <g id="Group_3826" data-name="Group 3826">
                        <g id="XMLID_1_">
                          <g id="Group_3825" data-name="Group 3825">
                            <path
                              id="Path_15511"
                              data-name="Path 15511"
                              d="M6.544,23.977A6.5,6.5,0,0,1-.017,17.549V6.424a6.3,6.3,0,0,1,.791-3.06,6.488,6.488,0,0,1,2-2.2A6.619,6.619,0,0,1,6.541,0H17.409a6.5,6.5,0,0,1,6.558,6.424V17.549a6.5,6.5,0,0,1-6.558,6.428H6.544Z"
                              transform="translate(0.017)"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                  <g
                    id="Group_3832"
                    data-name="Group 3832"
                    transform="translate(160.105 16.269)"
                  >
                    <g
                      id="Group_3831"
                      data-name="Group 3831"
                      transform="translate(0)"
                    >
                      <g id="Group_3830" data-name="Group 3830">
                        <g id="XMLID_1_2" data-name="XMLID_1_">
                          <g id="Group_3829" data-name="Group 3829">
                            <path
                              id="Path_15512"
                              data-name="Path 15512"
                              d="M6.544,23.977A6.5,6.5,0,0,1-.017,17.549V6.424a6.3,6.3,0,0,1,.791-3.06,6.488,6.488,0,0,1,2-2.2A6.619,6.619,0,0,1,6.541,0H17.409a6.5,6.5,0,0,1,6.558,6.424V17.549a6.5,6.5,0,0,1-6.558,6.428H6.544Z"
                              transform="translate(0.017)"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                  <g
                    id="Group_3836"
                    data-name="Group 3836"
                    transform="translate(16.246 160.129)"
                  >
                    <g
                      id="Group_3835"
                      data-name="Group 3835"
                      transform="translate(0)"
                    >
                      <g id="Group_3834" data-name="Group 3834">
                        <g id="XMLID_1_3" data-name="XMLID_1_">
                          <g id="Group_3833" data-name="Group 3833">
                            <path
                              id="Path_15513"
                              data-name="Path 15513"
                              d="M6.544,23.977A6.5,6.5,0,0,1-.017,17.549V6.424a6.3,6.3,0,0,1,.791-3.06,6.488,6.488,0,0,1,2-2.2A6.619,6.619,0,0,1,6.541,0H17.409a6.5,6.5,0,0,1,6.558,6.424V17.549a6.5,6.5,0,0,1-6.558,6.428H6.544Z"
                              transform="translate(0.017)"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </svg>
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
          <LoginCall />
          <span>{translate("By Mobile Phone Number", language)}</span>
        </div>
      )}
    </div>
  );
};

export default LoginMethods;
