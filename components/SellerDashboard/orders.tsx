"use client";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getConfiguredImage, translateFunction, LogError } from "utils/functions";
import SellerDashboardService from "services/sellerDashboard";
import home from "services/home";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import Spinner from "components/global/Spinner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatTime, GetImageUrl } from "utils/tinyUtils";
import BackBar from "components/setting/BackBar";

// --- 1. Icons (Inline SVGs) ---
const Icons = {
  ChevronLeft: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="20"
      viewBox="0 0 11 20"
    >
      <path
        id="back"
        d="M16.394,4.06a1.168,1.168,0,0,1,1.674,0,1.222,1.222,0,0,1,0,1.705l-6.959,7.089a1.222,1.222,0,0,0,0,1.705l6.959,7.089a1.222,1.222,0,0,1,0,1.705,1.168,1.168,0,0,1-1.674,0L7.761,14.56a1.222,1.222,0,0,1,0-1.705Z"
        transform="translate(-7.414 -3.707)"
        fillRule="evenodd"
      />
    </svg>
  ),
  MoreVertical: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  ),
  Filter: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4612"
            data-name="Rectangle 4612"
            width="20"
            height="20"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_518"
        data-name="Mask Group 518"
        clipPath="url(#clip-path)"
      >
        <g id="Layer_x0020_1">
          <g id="_2457398961808">
            <g id="Group_12433" data-name="Group 12433">
              <g id="Group_12432" data-name="Group 12432">
                <path
                  id="Path_22184"
                  data-name="Path 22184"
                  d="M.991,2.9H13.852"
                  fill="none"
                  stroke="#388cff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="0.625"
                  fillRule="evenodd"
                />
                <path
                  id="Path_22185"
                  data-name="Path 22185"
                  d="M.991,17.1H13.852"
                  fill="none"
                  stroke="#388cff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="0.625"
                  fillRule="evenodd"
                />
                <path
                  id="Path_22186"
                  data-name="Path 22186"
                  d="M.991,12.347H7.42"
                  fill="none"
                  stroke="#388cff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="0.625"
                  fillRule="evenodd"
                />
                <path
                  id="Path_22187"
                  data-name="Path 22187"
                  d="M.991,7.622H7.42"
                  fill="none"
                  stroke="#388cff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="0.625"
                  fillRule="evenodd"
                />
              </g>
              <path
                id="Path_22188"
                data-name="Path 22188"
                d="M16.8,10a3.282,3.282,0,1,1-3.282-3.285A3.284,3.284,0,0,1,16.8,10Z"
                fill="none"
              />
              <path
                id="Path_22189"
                data-name="Path 22189"
                d="M16.8,10a3.282,3.282,0,1,1-3.282-3.285A3.284,3.284,0,0,1,16.8,10Z"
                fill="#388cff"
                stroke="#388cff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="10"
                strokeWidth="0.625"
                fillRule="evenodd"
              />
              <path
                id="Path_22190"
                data-name="Path 22190"
                d="M19.012,15.493l-3.175-3.172"
                fill="none"
                stroke="#388cff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit="10"
                strokeWidth="0.625"
                fillRule="evenodd"
              />
            </g>
            <path
              id="Path_22191"
              data-name="Path 22191"
              d="M0,0H20V20H0Z"
              fill="none"
              fillRule="evenodd"
            />
          </g>
        </g>
      </g>
    </svg>
  ),
  Item: ({ className }: { className?: string }) => (
    <svg
      id="_20x20"
      data-name="20x20"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4612"
            data-name="Rectangle 4612"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_701"
        data-name="Mask Group 701"
        clipPath="url(#clip-path)"
      >
        <g id="_x31_8_Invoice" transform="translate(1.812 0.001)">
          <g id="Group_13612" data-name="Group 13612">
            <g id="Group_13611" data-name="Group 13611">
              <path
                id="Path_22986"
                data-name="Path 22986"
                d="M13.259,8.38a.177.177,0,0,0,.169-.183V4.9a1.3,1.3,0,0,0-.333-.869C13.079,4.014,9.931.613,9.916.6h0a1.108,1.108,0,0,0-.8-.357H3.191A1.185,1.185,0,0,0,2.053,1.467V14.014a1.186,1.186,0,0,0,1.137,1.226h9.1a1.185,1.185,0,0,0,1.137-1.226V9.835a.17.17,0,1,0-.339,0v4.179a.832.832,0,0,1-.8.86h-9.1a.832.832,0,0,1-.8-.86V1.467a.831.831,0,0,1,.8-.86h5.92a.749.749,0,0,1,.233.038V3.424A1.185,1.185,0,0,0,10.48,4.65h2.573a.865.865,0,0,1,.037.25V8.2a.177.177,0,0,0,.169.183Z"
                transform="translate(-2.053 -0.241)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22987"
                data-name="Path 22987"
                d="M11.868,10H4.752a.244.244,0,0,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -2.741)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22988"
                data-name="Path 22988"
                d="M11.868,12.4H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -3.358)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22989"
                data-name="Path 22989"
                d="M11.868,14.812H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -3.975)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22990"
                data-name="Path 22990"
                d="M11.868,17.221H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -5.241)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22991"
                data-name="Path 22991"
                d="M15.73,10H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -2.741)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22992"
                data-name="Path 22992"
                d="M15.73,12.374H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -3.35)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22993"
                data-name="Path 22993"
                d="M15.73,14.751H14.31a.244.244,0,1,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -3.959)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22994"
                data-name="Path 22994"
                d="M15.73,17.129H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -5.241)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22995"
                data-name="Path 22995"
                d="M5.949,6.829a.8.8,0,0,1-.8-.8.244.244,0,0,0-.488,0A1.286,1.286,0,0,0,5.705,7.293V7.74a.244.244,0,1,0,.488,0V7.293a1.284,1.284,0,0,0-.244-2.545.8.8,0,1,1,.8-.8.244.244,0,1,0,.488,0A1.286,1.286,0,0,0,6.193,2.691V2.244a.244.244,0,1,0-.488,0v.447a1.284,1.284,0,0,0,.244,2.545.8.8,0,1,1,0,1.593Z"
                transform="translate(-2.999 -0.241)"
                fill="#8d8d8d"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  ),
  Bag: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="23"
      height="18"
      viewBox="0 0 23 18"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4609"
            data-name="Rectangle 4609"
            width="18"
            height="18"
            transform="translate(0)"
            fill="none"
          />
        </clipPath>
        <clipPath id="clip-path-2">
          <rect
            id="Rectangle_4561"
            data-name="Rectangle 4561"
            width="11"
            height="11"
            transform="translate(0)"
            fill="none"
          />
        </clipPath>
        <linearGradient
          id="linear-gradient"
          x1="0.5"
          y1="0.955"
          x2="0.5"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor="#f53c3c" />
          <stop offset="1" stopColor="#ff9696" />
        </linearGradient>
      </defs>
      <g
        id="Group_15203"
        data-name="Group 15203"
        transform="translate(-17.039 -194)"
      >
        <g
          id="_25x25_Back"
          data-name="25x25 Back"
          transform="translate(22.039 194)"
        >
          <g
            id="Mask_Group_665"
            data-name="Mask Group 665"
            transform="translate(0)"
            clipPath="url(#clip-path)"
          >
            <g
              id="Group_4033"
              data-name="Group 4033"
              transform="translate(1.306 0)"
            >
              <g
                id="Group_4032"
                data-name="Group 4032"
                transform="translate(0 0)"
              >
                <path
                  id="Path_15859"
                  data-name="Path 15859"
                  d="M-2.5-1.843H8.253L10.285,9.371s-1.017,1.561-1.6,1.561a113.3,113.3,0,0,1-11.884-.2c-.973-.12-1.312-1.362-1.312-1.362Z"
                  transform="translate(4.841 6.819)"
                  fill="#3c3c3c"
                />
                <g id="bag-5">
                  <g id="Group_2946" data-name="Group 2946">
                    <path
                      id="Path_15168"
                      data-name="Path 15168"
                      d="M62.16,44.749H73.228a2.16,2.16,0,0,0,2.16-2.16.231.231,0,0,0,0-.041L73.588,32.4a1.192,1.192,0,0,0-1.183-1.008h-1.3V30.165a3.416,3.416,0,0,0-6.833,0v1.228h-1.3A1.192,1.192,0,0,0,61.8,32.4L60,42.548a.234.234,0,0,0,0,.041,2.16,2.16,0,0,0,2.16,2.16Zm2.592-14.584a2.946,2.946,0,0,1,5.891,0v1.228H64.752Zm-2.485,2.318v0a.72.72,0,0,1,.72-.614h1.3v1.864a.235.235,0,0,0,.471,0V31.865h5.891v1.864a.235.235,0,0,0,.471,0V31.865h1.3a.72.72,0,0,1,.72.614v0l1.786,10.125a1.691,1.691,0,0,1-1.689,1.669H62.16a1.691,1.691,0,0,1-1.689-1.669Z"
                      transform="translate(-59.999 -26.749)"
                      fill="#3c3c3c"
                    />
                  </g>
                </g>
              </g>
              <path
                id="Path_15172"
                data-name="Path 15172"
                d="M0,0A7.06,7.06,0,0,0,3.91,1.61,8.466,8.466,0,0,0,8.094,0"
                transform="translate(3.648 11.76)"
                fill="none"
                stroke="#fce66e"
                strokeLinecap="round"
                strokeWidth="0.6"
              />
            </g>
          </g>
        </g>
        <g
          id="_15x15_photo_back"
          data-name="15x15 photo back"
          transform="translate(17.039 201)"
        >
          <g
            id="Mask_Group_666"
            data-name="Mask Group 666"
            transform="translate(0)"
            clipPath="url(#clip-path-2)"
          >
            <g
              id="Group_4033-2"
              data-name="Group 4033"
              transform="translate(0.783 0)"
            >
              <g
                id="Group_4032-2"
                data-name="Group 4032"
                transform="translate(0)"
              >
                <path
                  id="Path_15859-2"
                  data-name="Path 15859"
                  d="M-2.819-1.644H3.634l1.22,6.728s-.61.936-.963.935A68.086,68.086,0,0,1-3.238,5.9c-.586-.069-.787-.814-.787-.814Z"
                  transform="translate(4.222 4.63)"
                  fill="url(#linear-gradient)"
                />
                <g id="bag-5-2" data-name="bag-5">
                  <g id="Group_2946-2" data-name="Group 2946">
                    <path
                      id="Path_15168-2"
                      data-name="Path 15168"
                      d="M54.821,34.662h6.641a1.3,1.3,0,0,0,1.3-1.3.139.139,0,0,0,0-.024L61.68,27.255a.716.716,0,0,0-.71-.606h-.778v-.737a2.05,2.05,0,0,0-4.1,0v.737h-.777a.716.716,0,0,0-.71.606l-1.08,6.087a.14.14,0,0,0,0,.024,1.3,1.3,0,0,0,1.3,1.3Zm1.553-8.75a1.767,1.767,0,0,1,3.533,0v.737H56.374ZM54.884,27.3h0a.434.434,0,0,1,.431-.369h.78v1.118a.141.141,0,1,0,.283,0V26.931H59.91v1.118a.141.141,0,0,0,.283,0V26.931h.777a.434.434,0,0,1,.431.369h0l1.076,6.075a1.015,1.015,0,0,1-1.014,1H54.821a1.015,1.015,0,0,1-1.014-1Z"
                      transform="translate(-53.525 -23.862)"
                      fill="#3c3c3c"
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  ),
  Bag2: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_6211"
            data-name="Rectangle 6211"
            width="15"
            height="15"
            transform="translate(0 -0.412)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_726"
        data-name="Mask Group 726"
        transform="translate(0 0.412)"
        clipPath="url(#clip-path)"
      >
        <g
          id="Group_13514"
          data-name="Group 13514"
          transform="translate(1.063 -0.103)"
        >
          <g id="bag-5">
            <g id="Group_2946" data-name="Group 2946">
              <path
                id="Path_15168"
                data-name="Path 15168"
                d="M61.763,41.44H70.8a1.763,1.763,0,0,0,1.763-1.763.188.188,0,0,0,0-.033l-1.469-8.28a.973.973,0,0,0-.966-.825H69.068v-1a2.788,2.788,0,1,0-5.577,0v1H62.435a.973.973,0,0,0-.966.825L60,39.644a.19.19,0,0,0,0,.033,1.763,1.763,0,0,0,1.763,1.763Zm2.114-11.9a2.4,2.4,0,1,1,4.808,0v1H63.876Zm-2.027,1.891h0a.588.588,0,0,1,.588-.5h1.057v1.521a.2.2,0,1,0,.385,0V30.924h4.808v1.521a.2.2,0,1,0,.385,0V30.924h1.057a.588.588,0,0,1,.588.5h0L72.18,39.69A1.38,1.38,0,0,1,70.8,41.052H61.763a1.38,1.38,0,0,1-1.379-1.362Z"
                transform="translate(-59.999 -26.753)"
                fill="#8d8d8d"
              />
            </g>
          </g>
          <path
            id="Path_15172"
            data-name="Path 15172"
            d="M0,0A5.762,5.762,0,0,0,3.191,1.314,6.914,6.914,0,0,0,6.606,0"
            transform="translate(2.977 9.176)"
            fill="none"
            stroke="#f74949"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      </g>
    </svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg
      id="deadline"
      xmlns="http://www.w3.org/2000/svg"
      width="13.727"
      height="15"
      viewBox="0 0 13.727 15"
      className={className}
    >
      <path
        id="Path_22971"
        data-name="Path 22971"
        d="M11.42,5.094a2,2,0,0,0,.311-1.324.778.778,0,0,0-.4-.5.7.7,0,0,0-.556-.052,1.415,1.415,0,0,0-.73.813,5.917,5.917,0,0,0-3.2-.77l-.083-.8c.1-.019.2-.04.319-.059A4.4,4.4,0,0,0,8.45,2a1.115,1.115,0,0,0,.216-.162.761.761,0,0,0,.243-.656A1.084,1.084,0,0,0,8.37.4,2.041,2.041,0,0,0,6.962.31L4.532.785C4.471.8,4.4.809,4.333.824,3.591.957,2.352,1.18,2.481,2.3a.873.873,0,0,0,.376.654,1.159,1.159,0,0,0,.644.169,2.565,2.565,0,0,0,.7-.112c.271-.081.544-.143.825-.2l.155.768a5.936,5.936,0,0,0-2.465,1.6.252.252,0,0,0-.081-.093A2.306,2.306,0,0,0,1.43,4.749a.766.766,0,0,0-.72.366.624.624,0,0,0,.1.661,2.052,2.052,0,0,0,.758.449c.1.045.2.093.288.136a5.986,5.986,0,0,0,5.231,8.87,6.157,6.157,0,0,0,1.194-.119A5.99,5.99,0,0,0,11.42,5.094ZM10.925,3.66a.222.222,0,0,1,.19.024.3.3,0,0,1,.164.2,1.452,1.452,0,0,1-.209.873,5.753,5.753,0,0,0-.63-.485.143.143,0,0,0,.021-.031A1.057,1.057,0,0,1,10.925,3.66Zm-6.857-1.1a1.26,1.26,0,0,1-.958,0,.407.407,0,0,1-.169-.319c-.071-.628.625-.806,1.472-.958l.207-.038L7.05.769A3.224,3.224,0,0,1,7.642.7a1,1,0,0,1,.492.107.631.631,0,0,1,.311.433.3.3,0,0,1-.1.264.772.772,0,0,1-.133.1A4.049,4.049,0,0,1,7,1.941c-.162.029-.311.057-.437.086-.326.076-.663.138-.991.2a14.094,14.094,0,0,0-1.5.333Zm1.415.157.171-.031c.214-.04.43-.081.649-.126l.078.742c-.155.019-.309.043-.464.074-.1.019-.195.043-.29.067ZM1.763,5.8a2.886,2.886,0,0,1-.575-.3c-.055-.074-.076-.138-.057-.174s.131-.107.3-.107a1.861,1.861,0,0,1,.963.264A.174.174,0,0,0,2.44,5.5c-.119.15-.233.3-.338.464-.1-.05-.214-.1-.34-.159Zm6.429,8.854A5.52,5.52,0,1,1,6.011,3.831a5.575,5.575,0,0,1,1.1-.109A5.52,5.52,0,0,1,8.191,14.653Z"
        transform="translate(-0.655 -0.231)"
        fill="#8d8d8d"
      />
      <path
        id="Path_22972"
        data-name="Path 22972"
        d="M7.416,3.813A.235.235,0,0,0,7.1,3.9L5.488,6.659a.851.851,0,0,0-.43-.024.882.882,0,0,0,.174,1.747.859.859,0,0,0,.174-.017A.882.882,0,0,0,6.1,7.327a.86.86,0,0,0-.214-.418L7.5,4.131a.235.235,0,0,0-.086-.319Zm-2.1,4.1a.416.416,0,1,1-.164-.815.492.492,0,0,1,.083-.007.415.415,0,0,1,.228.069.415.415,0,0,1-.147.754Z"
        transform="translate(1.193 1.544)"
        fill="#8d8d8d"
      />
      <path
        id="Path_22973"
        data-name="Path 22973"
        d="M4.839,11.3A3.888,3.888,0,0,1,2.5,7.04,4.288,4.288,0,0,1,6.265,3.579a.233.233,0,0,0-.05-.464A4.755,4.755,0,0,0,2.043,6.957a4.387,4.387,0,0,0,2.589,4.762.232.232,0,0,0,.1.024.231.231,0,0,0,.1-.44Z"
        transform="translate(0.004 1.21)"
        fill="#8d8d8d"
      />
      <path
        id="Path_22974"
        data-name="Path 22974"
        d="M9.209,5.14a4.783,4.783,0,0,0,.04,1.1,4.956,4.956,0,0,0,.133,1.094,3.064,3.064,0,0,0,.031-1.108A3.066,3.066,0,0,0,9.209,5.14Z"
        transform="translate(3.613 2.223)"
        fill="#8d8d8d"
      />
      <path
        id="Path_22975"
        data-name="Path 22975"
        d="M9.882,6.459a2.968,2.968,0,0,0-.221-1.213,9.915,9.915,0,0,0,.055,1.217,10.435,10.435,0,0,0,.033,1.217A2.953,2.953,0,0,0,9.882,6.459Z"
        transform="translate(3.841 2.276)"
        fill="#8d8d8d"
      />
      <path
        id="Path_22976"
        data-name="Path 22976"
        d="M1.23,8.776c-.045,0-.043.262.136.511s.423.335.44.295-.152-.176-.3-.392S1.278,8.769,1.23,8.776Z"
        transform="translate(-0.379 4.041)"
        fill="#8d8d8d"
      />
      <path
        id="Path_22977"
        data-name="Path 22977"
        d="M.894,8.749a1.349,1.349,0,0,0,.152.92,1.339,1.339,0,0,0,.6.713c.033-.036-.247-.333-.452-.782S.944,8.747.894,8.749Z"
        transform="translate(-0.549 4.028)"
        fill="#8d8d8d"
      />
    </svg>
  ),
  FileText: ({ className }: { className?: string }) => (
    <svg
      id="_20x20"
      data-name="20x20"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4612"
            data-name="Rectangle 4612"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_701"
        data-name="Mask Group 701"
        clipPath="url(#clip-path)"
      >
        <g id="_x31_8_Invoice" transform="translate(1.812 0.001)">
          <g id="Group_13612" data-name="Group 13612">
            <g id="Group_13611" data-name="Group 13611">
              <path
                id="Path_22986"
                data-name="Path 22986"
                d="M13.259,8.38a.177.177,0,0,0,.169-.183V4.9a1.3,1.3,0,0,0-.333-.869C13.079,4.014,9.931.613,9.916.6h0a1.108,1.108,0,0,0-.8-.357H3.191A1.185,1.185,0,0,0,2.053,1.467V14.014a1.186,1.186,0,0,0,1.137,1.226h9.1a1.185,1.185,0,0,0,1.137-1.226V9.835a.17.17,0,1,0-.339,0v4.179a.832.832,0,0,1-.8.86h-9.1a.832.832,0,0,1-.8-.86V1.467a.831.831,0,0,1,.8-.86h5.92a.749.749,0,0,1,.233.038V3.424A1.185,1.185,0,0,0,10.48,4.65h2.573a.865.865,0,0,1,.037.25V8.2a.177.177,0,0,0,.169.183Z"
                transform="translate(-2.053 -0.241)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22987"
                data-name="Path 22987"
                d="M11.868,10H4.752a.244.244,0,0,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -2.741)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22988"
                data-name="Path 22988"
                d="M11.868,12.4H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -3.358)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22989"
                data-name="Path 22989"
                d="M11.868,14.812H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -3.975)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22990"
                data-name="Path 22990"
                d="M11.868,17.221H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                transform="translate(-2.053 -5.241)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22991"
                data-name="Path 22991"
                d="M15.73,10H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -2.741)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22992"
                data-name="Path 22992"
                d="M15.73,12.374H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -3.35)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22993"
                data-name="Path 22993"
                d="M15.73,14.751H14.31a.244.244,0,1,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -3.959)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22994"
                data-name="Path 22994"
                d="M15.73,17.129H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                transform="translate(-7.053 -5.241)"
                fill="#8d8d8d"
              />
              <path
                id="Path_22995"
                data-name="Path 22995"
                d="M5.949,6.829a.8.8,0,0,1-.8-.8.244.244,0,0,0-.488,0A1.286,1.286,0,0,0,5.705,7.293V7.74a.244.244,0,1,0,.488,0V7.293a1.284,1.284,0,0,0-.244-2.545.8.8,0,1,1,.8-.8.244.244,0,1,0,.488,0A1.286,1.286,0,0,0,6.193,2.691V2.244a.244.244,0,1,0-.488,0v.447a1.284,1.284,0,0,0,.244,2.545.8.8,0,1,1,0,1.593Z"
                transform="translate(-2.999 -0.241)"
                fill="#8d8d8d"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  ),
  ShoppingCart: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4644"
            data-name="Rectangle 4644"
            width="20"
            height="20"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_321"
        data-name="Mask Group 321"
        clipPath="url(#clip-path)"
      >
        <g id="_07_Pickup" data-name="07 Pickup" transform="translate(0.046 0)">
          <path
            id="Path_21437"
            data-name="Path 21437"
            d="M14.8,12.857a1.182,1.182,0,0,0,.835-1.447L13.853,4.737A1.184,1.184,0,0,0,12.4,3.9L5.733,5.69A1.186,1.186,0,0,0,4.9,7.137l1.818,6.782a1.068,1.068,0,0,0,1.308.754Z"
            transform="translate(1.128 0.078)"
            fill="#1d1d1d"
          />
          <path
            id="Path_21439"
            data-name="Path 21439"
            d="M21.507,16.451l-1.25-.722a2.4,2.4,0,0,0-1.823-.241L12,17.212a3.329,3.329,0,0,0-.438-.716l6.229-1.669a1.182,1.182,0,0,0,.835-1.447L16.846,6.708A1.184,1.184,0,0,0,15.4,5.875L8.727,7.661a1.186,1.186,0,0,0-.835,1.447l1.662,6.2a3.34,3.34,0,0,0-.9-.032L5.784,4.578a2.391,2.391,0,0,0-1.12-1.459l-2-1.154a.534.534,0,1,0-.534.925l2,1.154a1.325,1.325,0,0,1,.628.81l2.861,10.7a3.314,3.314,0,1,0,4.658,2.688L18.71,16.52a1.323,1.323,0,0,1,1.013.135l1.25.722a.534.534,0,1,0,.534-.925Zm-8.87-7.543A1.348,1.348,0,0,1,11.6,8.772a1.363,1.363,0,0,1-.562-.622l2.609-.7A1.368,1.368,0,0,1,12.637,8.909ZM9,8.7l.989-.267a2.438,2.438,0,0,0,4.7-1.256l.991-.265a.064.064,0,0,1,.028,0,.113.113,0,0,1,.111.083L17.6,13.657a.113.113,0,0,1-.079.139l-6.671,1.786a.111.111,0,0,1-.139-.079L8.923,8.832A.115.115,0,0,1,9,8.693Zm.562,12.062a2.256,2.256,0,1,1,1.375-1.05,2.256,2.256,0,0,1-1.375,1.05Z"
            transform="translate(-1.865 -1.893)"
            fill="#1d1d1d"
          />
        </g>
      </g>
    </svg>
  ),
  Bell: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_6282"
            data-name="Rectangle 6282"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_784"
        data-name="Mask Group 784"
        clipPath="url(#clip-path)"
      >
        <g id="_07_Pickup" data-name="07 Pickup" transform="translate(0.034 0)">
          <path
            id="Path_23382"
            data-name="Path 23382"
            d="M12.314,10.608a.886.886,0,0,0,.627-1.085l-1.337-5a.888.888,0,0,0-1.087-.625l-5,1.34a.889.889,0,0,0-.627,1.085L6.252,11.4a.8.8,0,0,0,.981.566Z"
            transform="translate(-0.369 -0.907)"
            fill="#1d1d1d"
          />
          <path
            id="Path_23383"
            data-name="Path 23383"
            d="M16.6,12.812l-.938-.542a1.8,1.8,0,0,0-1.367-.181L9.468,13.382a2.5,2.5,0,0,0-.329-.537l4.671-1.252a.886.886,0,0,0,.627-1.085L13.1,5.5a.888.888,0,0,0-1.087-.625l-5,1.34A.889.889,0,0,0,6.385,7.3l1.247,4.647a2.5,2.5,0,0,0-.676-.024L4.8,3.906a1.793,1.793,0,0,0-.84-1.095l-1.5-.865a.4.4,0,1,0-.4.694l1.5.865a.994.994,0,0,1,.471.607L6.181,12.14a2.486,2.486,0,1,0,3.494,2.016L14.5,12.863a.992.992,0,0,1,.76.1l.938.542a.4.4,0,1,0,.4-.694ZM9.944,7.155a1.011,1.011,0,0,1-.78-.1,1.022,1.022,0,0,1-.421-.466L10.7,6.062A1.026,1.026,0,0,1,9.944,7.155ZM7.22,6.994l.742-.2a1.829,1.829,0,0,0,3.526-.942l.744-.2a.048.048,0,0,1,.021,0,.085.085,0,0,1,.083.063l1.332,5a.085.085,0,0,1-.059.1l-5,1.34a.083.083,0,0,1-.1-.059l-1.341-5a.087.087,0,0,1,.061-.1Zm.421,9.047a1.692,1.692,0,1,1,1.031-.787,1.692,1.692,0,0,1-1.031.787Z"
            transform="translate(-1.865 -1.893)"
            fill="#1d1d1d"
          />
        </g>
      </g>
    </svg>
  ),
  // Small process icons
  CheckCircle: ({ className }: { className?: string }) => (
    <svg
      id="_15x15_photo_back"
      data-name="15x15 photo back"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4561"
            data-name="Rectangle 4561"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_760"
        data-name="Mask Group 760"
        clipPath="url(#clip-path)"
      >
        <path
          id="claim"
          d="M1.1,9.718a.217.217,0,0,1-.418.112A7.477,7.477,0,1,1,5.563,15a.217.217,0,1,1,.136-.411A7.043,7.043,0,1,0,1.1,9.718Zm9.3-4.011a.615.615,0,0,1,.852.888L7.635,10.069a.615.615,0,0,1-.848,0l-2.225-2.1a.615.615,0,1,1,.844-.9l1.8,1.7Zm-5.14,5.018a.217.217,0,1,1-.309-.3l.309-.314a.217.217,0,0,1,.309.3Zm-1.3-.474a.217.217,0,0,1-.419-.109l.11-.426a.217.217,0,0,1,.419.109Zm1.6,1.876a.217.217,0,1,1-.115-.417l.424-.117a.217.217,0,1,1,.115.417Zm-3.055,2L1.345,15.288a.155.155,0,0,1-.219,0L.433,14.6a.155.155,0,0,1,0-.219L1.59,13.219l-.734-.4a.155.155,0,0,1,.021-.281l3.34-1.229a.155.155,0,0,1,.2.2l-1.229,3.34a.155.155,0,0,1-.281.021Z"
          transform="translate(-0.388 -0.389)"
          fillRule="evenodd"
        />
      </g>
    </svg>
  ),
  ProductImage: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="91"
      height="125"
      viewBox="0 0 91 125"
    >
      <defs>
        <pattern
          id="pattern"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 550 825"
        >
          <image
            width="550"
            height="825"
            xlinkHref="data:image/jpeg;base64,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aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOmF1eD0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC9hdXgvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIgogICAgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpjcnM9Imh0dHA6Ly9ucy5hZG9iZS5jb20vY2FtZXJhLXJhdy1zZXR0aW5ncy8xLjAvIgogICB4bXA6Q3JlYXRlRGF0ZT0iMjAyMy0wMS0wMlQxNjo0MToyNSIKICAgeG1wOlJhdGluZz0iMyIKICAgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgTGlnaHRyb29tIENsYXNzaWMgMTIuMSAoTWFjaW50b3NoKSIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjMtMDEtMTJUMDI6MDk6MzYrMDM6MDAiCiAgIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMDEtMTJUMDI6MDk6MzYrMDM6MDAiCiAgIGF1eDpTZXJpYWxOdW1iZXI9IjA3ODAyMjAwMDQ5OCIKICAgYXV4OkxlbnNJbmZvPSIyNC8xIDcwLzEgMC8wIDAvMCIKICAgYXV4OkxlbnM9IkNhbm9uIEVGIDI0LTcwbW0gZi8yLjhMIElJIFVTTSIKICAgYXV4OkxlbnNTZXJpYWxOdW1iZXI9IjI3MjUwMDQ0MzMiCiAgIGF1eDpGbGFzaENvbXBlbnNhdGlvbj0iMC8xIgogICBhdXg6RmlybXdhcmU9IkZpcm13YXJlIFZlcnNpb24gMS4xLjQiCiAgIGF1eDpBcHByb3hpbWF0ZUZvY3VzRGlzdGFuY2U9IjAvMSIKICAgcGhvdG9zaG9wOkRhdGVDcmVhdGVkPSIyMDIzLTAxLTAyVDE2OjQxOjI1IgogICB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjQxNjA5YjdlLTY3MTUtNDI1OC04ZWZhLWY4OGJiOGU1NDNiOCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0MTYwOWI3ZS02NzE1LTQyNTgtOGVmYS1mODhiYjhlNTQzYjgiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iMzYzMTg2MDBGODgxOUJGMjQ2OTg0MjU1OTlCNDk0RTUiCiAgIHhtcE1NOlByZXNlcnZlZEZpbGVOYW1lPSJLb2RzdXpfMTM4NS5wc2QiCiAgIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIKICAgY3JzOlJhd0ZpbGVOYW1lPSJLb2RzdXpfMTM4NS5wc2QiCiAgIGNyczpWZXJzaW9uPSIxNS4xIgogICBjcnM6UHJvY2Vzc1ZlcnNpb249IjExLjAiCiAgIGNyczpXaGl0ZUJhbGFuY2U9IkFzIFNob3QiCiAgIGNyczpJbmNyZW1lbnRhbFRlbXBlcmF0dXJlPSIwIgogICBjcnM6SW5jcmVtZW50YWxUaW50PSIwIgogICBjcnM6RXhwb3N1cmUyMDEyPSIwLjAwIgogICBjcnM6Q29udHJhc3QyMDEyPSIwIgogICBjcnM6SGlnaGxpZ2h0czIwMTI9IjAiCiAgIGNyczpTaGFkb3dzMjAxMj0iMCIKICAgY3JzOldoaXRlczIwMTI9IjAiCiAgIGNyczpCbGFja3MyMDEyPSIwIgogICBjcnM6VGV4dHVyZT0iMCIKICAgY3JzOkNsYXJpdHkyMDEyPSIwIgogICBjcnM6RGVoYXplPSIwIgogICBjcnM6VmlicmFuY2U9IjAiCiAgIGNyczpTYXR1cmF0aW9uPSIwIgogICBjcnM6UGFyYW1ldHJpY1NoYWRvd3M9IjAiCiAgIGNyczpQYXJhbWV0cmljRGFya3M9IjAiCiAgIGNyczpQYXJhbWV0cmljTGlnaHRzPSIwIgogICBjcnM6UGFyYW1ldHJpY0hpZ2hsaWdodHM9IjAiCiAgIGNyczpQYXJhbWV0cmljU2hhZG93U3BsaXQ9IjI1IgogICBjcnM6UGFyYW1ldHJpY01pZHRvbmVTcGxpdD0iNTAiCiAgIGNyczpQYXJhbWV0cmljSGlnaGxpZ2h0U3BsaXQ9Ijc1IgogICBjcnM6U2hhcnBuZXNzPSIwIgogICBjcnM6THVtaW5hbmNlU21vb3RoaW5nPSIwIgogICBjcnM6Q29sb3JOb2lzZVJlZHVjdGlvbj0iMCIKICAgY3JzOkh1ZUFkanVzdG1lbnRSZWQ9IjAiCiAgIGNyczpIdWVBZGp1c3RtZW50T3JhbmdlPSIwIgogICBjcnM6SHVlQWRqdXN0bWVudFllbGxvdz0iMCIKICAgY3JzOkh1ZUFkanVzdG1lbnRHcmVlbj0iMCIKICAgY3JzOkh1ZUFkanVzdG1lbnRBcXVhPSIwIgogICBjcnM6SHVlQWRqdXN0bWVudEJsdWU9IjAiCiAgIGNyczpIdWVBZGp1c3RtZW50UHVycGxlPSIwIgogICBjcnM6SHVlQWRqdXN0bWVudE1hZ2VudGE9IjAiCiAgIGNyczpTYXR1cmF0aW9uQWRqdXN0bWVudFJlZD0iMCIKICAgY3JzOlNhdHVyYXRpb25BZGp1c3RtZW50T3JhbmdlPSIwIgogICBjcnM6U2F0dXJhdGlvbkFkanVzdG1lbnRZZWxsb3c9IjAiCiAgIGNyczpTYXR1cmF0aW9uQWRqdXN0bWVudEdyZWVuPSIwIgogICBjcnM6U2F0dXJhdGlvbkFkanVzdG1lbnRBcXVhPSIwIgogICBjcnM6U2F0dXJhdGlvbkFkanVzdG1lbnRCbHVlPSIwIgogICBjcnM6U2F0dXJhdGlvbkFkanVzdG1lbnRQdXJwbGU9IjAiCiAgIGNyczpTYXR1cmF0aW9uQWRqdXN0bWVudE1hZ2VudGE9IjAiCiAgIGNyczpMdW1pbmFuY2VBZGp1c3RtZW50UmVkPSIwIgogICBjcnM6THVtaW5hbmNlQWRqdXN0bWVudE9yYW5nZT0iMCIKICAgY3JzOkx1bWluYW5jZUFkanVzdG1lbnRZZWxsb3c9IjAiCiAgIGNyczpMdW1pbmFuY2VBZGp1c3RtZW50R3JlZW49IjAiCiAgIGNyczpMdW1pbmFuY2VBZGp1c3RtZW50QXF1YT0iMCIKICAgY3JzOkx1bWluYW5jZUFkanVzdG1lbnRCbHVlPSIwIgogICBjcnM6THVtaW5hbmNlQWRqdXN0bWVudFB1cnBsZT0iMCIKICAgY3JzOkx1bWluYW5jZUFkanVzdG1lbnRNYWdlbnRhPSIwIgogICBjcnM6U3BsaXRUb25pbmdTaGFkb3dIdWU9IjAiCiAgIGNyczpTcGxpdFRvbmluZ1NoYWRvd1NhdHVyYXRpb249IjAiCiAgIGNyczpTcGxpdFRvbmluZ0hpZ2hsaWdodEh1ZT0iMCIKICAgY3JzOlNwbGl0VG9uaW5nSGlnaGxpZ2h0U2F0dXJhdGlvbj0iMCIKICAgY3JzOlNwbGl0VG9uaW5nQmFsYW5jZT0iMCIKICAgY3JzOkNvbG9yR3JhZGVNaWR0b25lSHVlPSIwIgogICBjcnM6Q29sb3JHcmFkZU1pZHRvbmVTYXQ9IjAiCiAgIGNyczpDb2xvckdyYWRlU2hhZG93THVtPSIwIgogICBjcnM6Q29sb3JHcmFkZU1pZHRvbmVMdW09IjAiCiAgIGNyczpDb2xvckdyYWRlSGlnaGxpZ2h0THVtPSIwIgogICBjcnM6Q29sb3JHcmFkZUJsZW5kaW5nPSI1MCIKICAgY3JzOkNvbG9yR3JhZGVHbG9iYWxIdWU9IjAiCiAgIGNyczpDb2xvckdyYWRlR2xvYmFsU2F0PSIwIgogICBjcnM6Q29sb3JHcmFkZUdsb2JhbEx1bT0iMCIKICAgY3JzOkF1dG9MYXRlcmFsQ0E9IjAiCiAgIGNyczpMZW5zUHJvZmlsZUVuYWJsZT0iMCIKICAgY3JzOkxlbnNNYW51YWxEaXN0b3J0aW9uQW1vdW50PSIwIgogICBjcnM6VmlnbmV0dGVBbW91bnQ9IjAiCiAgIGNyczpEZWZyaW5nZVB1cnBsZUFtb3VudD0iMCIKICAgY3JzOkRlZnJpbmdlUHVycGxlSHVlTG89IjMwIgogICBjcnM6RGVmcmluZ2VQdXJwbGVIdWVIaT0iNzAiCiAgIGNyczpEZWZyaW5nZUdyZWVuQW1vdW50PSIwIgogICBjcnM6RGVmcmluZ2VHcmVlbkh1ZUxvPSI0MCIKICAgY3JzOkRlZnJpbmdlR3JlZW5IdWVIaT0iNjAiCiAgIGNyczpQZXJzcGVjdGl2ZVVwcmlnaHQ9IjAiCiAgIGNyczpQZXJzcGVjdGl2ZVZlcnRpY2FsPSIwIgogICBjcnM6UGVyc3BlY3RpdmVIb3Jpem9udGFsPSIwIgogICBjcnM6UGVyc3BlY3RpdmVSb3RhdGU9IjAuMCIKICAgY3JzOlBlcnNwZWN0aXZlQXNwZWN0PSIwIgogICBjcnM6UGVyc3BlY3RpdmVTY2FsZT0iMTAwIgogICBjcnM6UGVyc3BlY3RpdmVYPSIwLjAwIgogICBjcnM6UGVyc3BlY3RpdmVZPSIwLjAwIgogICBjcnM6R3JhaW5BbW91bnQ9IjAiCiAgIGNyczpQb3N0Q3JvcFZpZ25ldHRlQW1vdW50PSIwIgogICBjcnM6U2hhZG93VGludD0iMCIKICAgY3JzOlJlZEh1ZT0iMCIKICAgY3JzOlJlZFNhdHVyYXRpb249IjAiCiAgIGNyczpHcmVlbkh1ZT0iMCIKICAgY3JzOkdyZWVuU2F0dXJhdGlvbj0iMCIKICAgY3JzOkJsdWVIdWU9IjAiCiAgIGNyczpCbHVlU2F0dXJhdGlvbj0iMCIKICAgY3JzOkNvbnZlcnRUb0dyYXlzY2FsZT0iRmFsc2UiCiAgIGNyczpPdmVycmlkZUxvb2tWaWduZXR0ZT0iRmFsc2UiCiAgIGNyczpUb25lQ3VydmVOYW1lMjAxMj0iTGluZWFyIgogICBjcnM6Q2FtZXJhUHJvZmlsZT0iRW1iZWRkZWQiCiAgIGNyczpDYW1lcmFQcm9maWxlRGlnZXN0PSI1NDY1MEEzNDFCNUI1Q0NBRTg0NDJEMEI0M0E5MkJDRSIKICAgY3JzOkhhc1NldHRpbmdzPSJUcnVlIgogICBjcnM6Q3JvcFRvcD0iMCIKICAgY3JzOkNyb3BMZWZ0PSIwIgogICBjcnM6Q3JvcEJvdHRvbT0iMSIKICAgY3JzOkNyb3BSaWdodD0iMSIKICAgY3JzOkNyb3BBbmdsZT0iMCIKICAgY3JzOkNyb3BDb25zdHJhaW5Ub1dhcnA9IjAiCiAgIGNyczpIYXNDcm9wPSJGYWxzZSIKICAgY3JzOkFscmVhZHlBcHBsaWVkPSJUcnVlIj4KICAgPHhtcE1NOkhpc3Rvcnk+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YjEyZGMwMTgtZDc0MC00MGI0LTk3YzYtYjhhMmI0MzQyMDkxIgogICAgICBzdEV2dDp3aGVuPSIyMDIzLTAxLTExVDAwOjA4OjE5KzAzOjAwIgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjQuMSAoTWFjaW50b3NoKSIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIvPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiCiAgICAgIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gaW1hZ2UvanBlZyB0byBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIi8+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249ImRlcml2ZWQiCiAgICAgIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGltYWdlL2pwZWcgdG8gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCIvPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2ZDVkYWEzNC03ZGNhLTQ2NDctODkxMS00MjU1MTI2ZjQ0MjQiCiAgICAgIHN0RXZ0OndoZW49IjIwMjMtMDEtMTFUMDA6MDg6MTkrMDM6MDAiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNC4xIChNYWNpbnRvc2gpIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvIi8+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIKICAgICAgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3ZuZC5hZG9iZS5waG90b3Nob3AiLz4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIKICAgICAgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gaW1hZ2Uvdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9qcGVnLCBzYXZlZCB0byBuZXcgbG9jYXRpb24iLz4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NDE2MDliN2UtNjcxNS00MjU4LThlZmEtZjg4YmI4ZTU0M2I4IgogICAgICBzdEV2dDp3aGVuPSIyMDIzLTAxLTEyVDAyOjA5OjM2KzAzOjAwIgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgTGlnaHRyb29tIENsYXNzaWMgMTIuMSAoTWFjaW50b3NoKSIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgIDx4bXBNTTpEZXJpdmVkRnJvbQogICAgc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2ZDVkYWEzNC03ZGNhLTQ2NDctODkxMS00MjU1MTI2ZjQ0MjQiCiAgICBzdFJlZjpkb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6Y2U3ZDYzNjktNmI1MS1iYTQzLTgzYmUtYzcyODc4ZDQwYzVmIgogICAgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSIzNjMxODYwMEY4ODE5QkYyNDY5ODQyNTU5OUI0OTRFNSIvPgogICA8Y3JzOlRvbmVDdXJ2ZVBWMjAxMj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGk+MCwgMDwvcmRmOmxpPgogICAgIDxyZGY6bGk+MjU1LCAyNTU8L3JkZjpsaT4KICAgIDwvcmRmOlNlcT4KICAgPC9jcnM6VG9uZUN1cnZlUFYyMDEyPgogICA8Y3JzOlRvbmVDdXJ2ZVBWMjAxMlJlZD4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGk+MCwgMDwvcmRmOmxpPgogICAgIDxyZGY6bGk+MjU1LCAyNTU8L3JkZjpsaT4KICAgIDwvcmRmOlNlcT4KICAgPC9jcnM6VG9uZUN1cnZlUFYyMDEyUmVkPgogICA8Y3JzOlRvbmVDdXJ2ZVBWMjAxMkdyZWVuPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT4wLCAwPC9yZGY6bGk+CiAgICAgPHJkZjpsaT4yNTUsIDI1NTwvcmRmOmxpPgogICAgPC9yZGY6U2VxPgogICA8L2NyczpUb25lQ3VydmVQVjIwMTJHcmVlbj4KICAgPGNyczpUb25lQ3VydmVQVjIwMTJCbHVlPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT4wLCAwPC9yZGY6bGk+CiAgICAgPHJkZjpsaT4yNTUsIDI1NTwvcmRmOmxpPgogICAgPC9yZGY6U2VxPgogICA8L2NyczpUb25lQ3VydmVQVjIwMTJCbHVlPgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz7/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8f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"
          />
        </pattern>
        <filter
          id="PNORSSM823IY-BE29_view2"
          x="0"
          y="0"
          width="91"
          height="125"
          filterUnits="userSpaceOnUse"
        >
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood flood-color="#fff" flood-opacity="0.502" result="color" />
          <feComposite operator="out" in="SourceGraphic" in2="blur" />
          <feComposite operator="in" in="color" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>
      <g data-type="innerShadowGroup">
        <rect
          id="PNORSSM823IY-BE29_view2-2"
          data-name="PNORSSM823IY-BE29_view2"
          width="91"
          height="125"
          rx="15"
          fill="url(#pattern)"
        />
        <g
          transform="matrix(1, 0, 0, 1, 0, 0)"
          filter="url(#PNORSSM823IY-BE29_view2)"
        >
          <rect
            id="PNORSSM823IY-BE29_view2-3"
            data-name="PNORSSM823IY-BE29_view2"
            width="91"
            height="125"
            rx="15"
            fill="#fff"
          />
        </g>
        <g
          id="PNORSSM823IY-BE29_view2-4"
          data-name="PNORSSM823IY-BE29_view2"
          fill="none"
          stroke="#fff"
          strokeWidth="0.5"
        >
          <rect width="91" height="125" rx="15" stroke="none" />
          <rect
            x="0.25"
            y="0.25"
            width="90.5"
            height="124.5"
            rx="14.75"
            fill="none"
          />
        </g>
      </g>
    </svg>
  ),
  PackImage: ({ className }: { className?: string }) => (
    <svg
      id="_15x15_photo_back"
      data-name="15x15 photo back"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4561"
            data-name="Rectangle 4561"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_761"
        data-name="Mask Group 761"
        clipPath="url(#clip-path)"
      >
        <g id="hotel-supplier">
          <path
            id="Path_23351"
            data-name="Path 23351"
            d="M5.415,10.371,3.656,9.285l.182-.5-.021.008A1.267,1.267,0,0,1,2.089,7.757L1.837,5.5c0-.038,0-.075,0-.112L.786,8.276A1.918,1.918,0,0,0,.866,9.487c.022.078.739,2.07.739,2.07L.174,13.493A.887.887,0,1,0,1.6,14.547l1.718-2.325a.887.887,0,0,0,.117-.84l-.073-.195.654.4L3.8,13.94a.887.887,0,0,0,.8.963c.027,0,.054,0,.081,0A.887.887,0,0,0,5.57,14.1l.263-2.895A.887.887,0,0,0,5.415,10.371Z"
            fill="currentColor"
          />
          <path
            id="Path_23352"
            data-name="Path 23352"
            d="M4.355,5.223l.067.6L4.977,5.6A1.514,1.514,0,0,0,2.2,4.48a1.26,1.26,0,0,1,2.159.743Z"
            fill="currentColor"
          />
          <path
            id="Path_23353"
            data-name="Path 23353"
            d="M4.363,3.229A1.568,1.568,0,1,0,2.8,1.661,1.568,1.568,0,0,0,4.363,3.229Z"
            fill="currentColor"
          />
          <path
            id="Path_23354"
            data-name="Path 23354"
            d="M14.335,9.278H9.647a.665.665,0,0,0-.665.665v1.869a.665.665,0,0,0,.665.665h4.688A.665.665,0,0,0,15,11.812V9.943A.665.665,0,0,0,14.335,9.278Z"
            fill="currentColor"
          />
          <path
            id="Path_23355"
            data-name="Path 23355"
            d="M9.108,8.359h2.613a.665.665,0,0,0,.665-.665V6.029a.665.665,0,0,0-.665-.665H9.108a.665.665,0,0,0-.665.665V7.694A.665.665,0,0,0,9.108,8.359Z"
            fill="currentColor"
          />
          <path
            id="Path_23356"
            data-name="Path 23356"
            d="M13.733,13.174H7.9v-5.8A.507.507,0,0,0,7.4,6.87H6.635a.759.759,0,0,0-.985-.989l-1.658.66L3.851,5.28a.76.76,0,1,0-1.511.169L2.593,7.7a.76.76,0,0,0,1.036.622l1.652-.658a.5.5,0,0,0,.406.219h1.2v5.8a.507.507,0,0,0,.507.507h.619a.839.839,0,0,0,1.645,0h1.9a.839.839,0,0,0,1.645,0h.524a.507.507,0,0,0,0-1.014Z"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
  ),
  CollectImage: ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_6265"
            data-name="Rectangle 6265"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_758"
        data-name="Mask Group 758"
        clipPath="url(#clip-path)"
      >
        <g id="work" transform="translate(0 0.298)">
          <path
            id="Path_23331"
            data-name="Path 23331"
            d="M4.739,10.128v5.131H7.132V12.182h4.288v3.077h.312V12.182H15.4V10.128Z"
            transform="translate(-0.79 -1.192)"
            fill="currentColor"
          />
          <path
            id="Path_23332"
            data-name="Path 23332"
            d="M12.173,8.75h2.919v.877H12.173Z"
            transform="translate(-2.029 -0.962)"
            fill="currentColor"
          />
          <path
            id="Path_23333"
            data-name="Path 23333"
            d="M12.416,7.484h2.919v.878H12.416Z"
            transform="translate(-2.069 -0.751)"
            fill="currentColor"
          />
          <path
            id="Path_23334"
            data-name="Path 23334"
            d="M6.376,4.568l.3.2.294-.114a.5.5,0,0,1,.182-.034.5.5,0,0,1,.444.745l.139.09H9.283l.02-.03L6.854,3.832Z"
            transform="translate(-1.063 -0.143)"
            fill="currentColor"
          />
          <path
            id="Path_23335"
            data-name="Path 23335"
            d="M11.714,12.868H10.243V14.4l-.167-.114-.151.114-.141-.114-.161.114-.158-.114-.108.114v-1.53H7.886v3.183h3.829Z"
            transform="translate(-1.314 -1.649)"
            fill="currentColor"
          />
          <path
            id="Path_23336"
            data-name="Path 23336"
            d="M13.406,16.051h3.829V12.868H15.763V14.4l-.167-.114-.151.114-.141-.114-.161.114-.158-.114-.108.114v-1.53H13.406Z"
            transform="translate(-2.234 -1.649)"
            fill="currentColor"
          />
          <path
            id="Path_23337"
            data-name="Path 23337"
            d="M1.91,13.695a.574.574,0,0,0,.523.621l.05,0a.574.574,0,0,0,.571-.525l.289-3.358h0a.571.571,0,0,0,0-.068s0-.008,0-.013,0-.036-.006-.055c0,0,0-.006,0-.009L2.919,7.826a6.407,6.407,0,0,1,.135-2.172L2.062,4.6a.505.505,0,0,1,.368-.851.507.507,0,0,1,.368.159l.936.994.179.143a.373.373,0,0,0,.428.027l.95-.583,0,0,.622-.957.648.421,0-.008a.373.373,0,0,0-.16-.5L6.139,3.3a.373.373,0,0,0-.367.013l-1.6.981L2.912,3.29A.372.372,0,0,0,2.8,3.23.929.929,0,0,0,1.438,3.9c-.225.757.537,1.127-.367,3.1a1.276,1.276,0,0,0-.122.438.57.57,0,0,0,.037.351l1.2,2.7Z"
            transform="translate(-0.156 -0.023)"
            fill="currentColor"
          />
          <path
            id="Path_23338"
            data-name="Path 23338"
            d="M1.742,1.227a1.372,1.372,0,0,1,.042-.2C1.344,1.073.827,1.3.742,2.278.66,3.237.32,3.354.063,3.314s.32.523.992-.04c.517-.433.312-1.529.678-1.8A1.367,1.367,0,0,1,1.742,1.227Z"
            transform="translate(0 0.325)"
            fill="currentColor"
          />
          <circle
            id="Ellipse_547"
            data-name="Ellipse 547"
            cx="1.234"
            cy="1.234"
            r="1.234"
            transform="translate(1.366 1.503) rotate(-37.523)"
            fill="currentColor"
          />
          <path
            id="Path_23339"
            data-name="Path 23339"
            d="M7.146,5.983l-1.023.395L5.707,8.384l.223.046.28-1.35V9.166h3.829V7.08l.28,1.35.223-.046-.5-2.4h-2.9Z"
            transform="translate(-0.951 -0.501)"
            fill="currentColor"
          />
          <path
            id="Path_23340"
            data-name="Path 23340"
            d="M6.607,5.5a.373.373,0,1,0-.269-.7L4.288,5.6,2.925,4.152a.373.373,0,1,0-.543.512l1.535,1.63a.373.373,0,0,0,.406.092Z"
            transform="translate(-0.38 -0.176)"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
  ),
  CollectedImage: ({ className }: { className?: string }) => (
    <svg
      id="_15x15_photo_back"
      data-name="15x15 photo back"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4561"
            data-name="Rectangle 4561"
            width="15"
            height="15"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_762"
        data-name="Mask Group 762"
        clipPath="url(#clip-path)"
      >
        <g id="box" transform="translate(0.804)">
          <path
            id="Path_22820"
            data-name="Path 22820"
            d="M16.147,2.492H5.97A1.608,1.608,0,0,0,4.362,4.1V15.884A1.608,1.608,0,0,0,5.97,17.492H16.147a1.608,1.608,0,0,0,1.608-1.608V4.1a1.608,1.608,0,0,0-1.608-1.608Zm1.07,13.392a1.07,1.07,0,0,1-1.07,1.07H5.97a1.07,1.07,0,0,1-1.07-1.07V4.1a1.07,1.07,0,0,1,1.07-1.07H8.648V7.12a.807.807,0,0,0,1.163.721l1.124-.565a.27.27,0,0,1,.233,0l1.131.561a.8.8,0,0,0,1.163-.717V3.025h2.685a1.07,1.07,0,0,1,1.07,1.07Z"
            transform="translate(-4.362 -2.492)"
            fill="currentColor"
          />
          <path
            id="Path_22821"
            data-name="Path 22821"
            d="M13.364,24.3H10.151a.805.805,0,0,0-.8.8v2.5a.805.805,0,0,0,.8.8h3.213a.805.805,0,0,0,.8-.8v-2.5a.805.805,0,0,0-.8-.805ZM10.419,26.9a.268.268,0,0,1,.268-.268h2.143a.268.268,0,1,1,0,.535H10.686a.268.268,0,0,1-.268-.268Zm2.41-.8H10.686a.268.268,0,0,1,0-.535h2.143a.268.268,0,1,1,0,.535Z"
            transform="translate(-7.206 -14.933)"
            fill="currentColor"
          />
          <path
            id="Path_22822"
            data-name="Path 22822"
            d="M25.612,32.627H22.636a.268.268,0,0,0,0,.535H25.61a.268.268,0,0,0,0-.535Z"
            transform="translate(-14.632 -19.677)"
            fill="currentColor"
          />
          <path
            id="Path_22823"
            data-name="Path 22823"
            d="M26.715,29.711H24.572a.268.268,0,1,0,0,.535h2.143a.268.268,0,1,0,0-.535Z"
            transform="translate(-15.735 -18.015)"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
  ),
  Clock2Image: ({ className }: { className?: string }) => (
    <svg
      id="_20x20"
      data-name="20x20"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      className={className}
    >
      <defs>
        <clipPath id="clip-path">
          <rect
            id="Rectangle_4612"
            data-name="Rectangle 4612"
            width="20"
            height="20"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_783"
        data-name="Mask Group 783"
        clipPath="url(#clip-path)"
      >
        <g id="timer-2">
          <g id="Group_13739" data-name="Group 13739">
            <path
              id="Path_23379"
              data-name="Path 23379"
              d="M14.127,2.245l-.672,1.162,2.327,1.343.672-1.162a.673.673,0,0,0-.247-.918L15.045,2A.671.671,0,0,0,14.127,2.245Z"
              fill="#1d1d1d"
            />
            <path
              id="Path_23380"
              data-name="Path 23380"
              d="M10,3.025a8.809,8.809,0,0,1,1.25.1V2.038l.859-.007V.625A.625.625,0,0,0,11.484,0H8.522A.625.625,0,0,0,7.9.625V2.031l.853.007V3.125A8.809,8.809,0,0,1,10,3.025Z"
              fill="#1d1d1d"
            />
            <path
              id="Path_23381"
              data-name="Path 23381"
              d="M10,3.75a8.125,8.125,0,1,0,8.125,8.125A8.125,8.125,0,0,0,10,3.75Zm3.8,11.944L9.062,12.416V7.789h1.366V11.7l4.146,2.87Z"
              fill="#1d1d1d"
            />
          </g>
        </g>
      </g>
    </svg>
  ),
};

const formatStatusLabel = (status?: string | null): string => {
  if (!status) return translateFunction("N/A");
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const parseOrderItems = (order: any) => {
  if (!order || !Array.isArray(order.details)) return [];
  return order.details;
};

const parseProductDetails = (item: any) => {
  if (!item?.product_details) return null;
  if (typeof item.product_details === "string") {
    try {
      return JSON.parse(item.product_details);
    } catch (_err) {
      return null;
    }
  }
  return item.product_details;
};

const getItemImage = (item: any, productDetails: any) => {
  const images = productDetails?.images
    ? typeof productDetails.images === "string"
      ? (() => {
          try {
            return JSON.parse(productDetails.images);
          } catch (_err) {
            return [];
          }
        })()
      : productDetails.images
    : [];
  const image = item?.cart_image || productDetails?.thumbnail || images?.[0];
  return image ? GetImageUrl(image) : "";
};

const getItemCount = (items: any[]) => {
  const qtySum = items.reduce(
    (total, item) => total + Number(item?.qty || 0),
    0,
  );
  return qtySum || items.length || 0;
};

const formatCreatedAt = (createdAt: any) => {
  if (!createdAt) return "";
  if (typeof createdAt === "string") return formatTime(createdAt);
  if (createdAt?.date && createdAt?.time) {
    return `${createdAt.date} ${createdAt.time}`;
  }
  return createdAt?.date || createdAt?.time || "";
};

const formatRemainingDuration = (minutes: number) => {
  const totalMinutes = Math.max(0, Number(minutes || 0));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatItemStatus = (item: any) => {
  if (item?.is_packed) return translateFunction("Packed");
  if (item?.is_confirm) return translateFunction("Confirmed");
  return translateFunction("Pending");
};

const updateOrderDetailItem = (
  order: any,
  detailId: number | string,
  updateFn: (item: any) => any,
) => {
  if (!order || !Array.isArray(order.details)) return order;

  const updatedDetails = order.details.map((group: any) => {
    if (Array.isArray(group)) {
      return group.map((item: any) =>
        item?.id === detailId ? updateFn(item) : item,
      );
    }

    if (group?.id === detailId) {
      return updateFn(group);
    }

    return group;
  });

  return { ...order, details: updatedDetails };
};

const applyCancelToOrderDetail = (
  order: any,
  detailId: number | string,
  qtyToCancel: number,
) => {
  if (!order || !Array.isArray(order.details)) return order;

  const updatedDetails = order.details
    .map((group: any) => {
      if (Array.isArray(group)) {
        return group
          .map((item: any) => {
            if (item?.id !== detailId) return item;
            const currentQty = Number(item?.qty || 0);
            const nextQty = Math.max(0, currentQty - qtyToCancel);
            return { ...item, qty: nextQty };
          })
          .filter((item: any) => Number(item?.qty || 0) > 0);
      }

      if (group?.id === detailId) {
        const currentQty = Number(group?.qty || 0);
        const nextQty = Math.max(0, currentQty - qtyToCancel);
        return nextQty > 0 ? { ...group, qty: nextQty } : null;
      }

      return group;
    })
    .filter((group: any) => group !== null);

  return { ...order, details: updatedDetails };
};

const ORDER_FILTER_TABS = [
  { label: "All", status: undefined },
  { label: "In Progress", status: "in_progress" },
  { label: "Collected", status: "collected" },
  { label: "Returned", status: "returned" },
  { label: "Cancelled", status: "canceled" },
] as const;

type OrderFilterTabLabel = (typeof ORDER_FILTER_TABS)[number]["label"];

const getOrderStatusFromTab = (tab: OrderFilterTabLabel) => {
  return ORDER_FILTER_TABS.find((item) => item.label === tab)?.status;
};

// --- 3. Components ---

// A1. Skeleton for a single order card
const SellerOrderCardSkeleton = () => (
  <div className="bg-[#F8F8F8] rounded-2xl p-4 w-full">
    {/* Header row */}
    <div className="flex justify-between items-center mb-4">
      <Skeleton width={110} height={14} borderRadius={8} />
      <Skeleton width={60} height={14} borderRadius={8} />
    </div>
    {/* Stats row */}
    <div className="flex justify-between items-center mb-4">
      <Skeleton width={90} height={14} borderRadius={8} />
      <Skeleton width={120} height={14} borderRadius={8} />
    </div>
    {/* Image gallery */}
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width={91} height={125} borderRadius={15} />
      ))}
    </div>
  </div>
);

// A. Order List Screen
const OrderListScreen = ({
  orders,
  onSelectOrder,
  selectedTab,
  onSelectTab,
  isLoading,
}: {
  orders: any[];
  onSelectOrder: (order: any) => void;
  selectedTab: OrderFilterTabLabel;
  onSelectTab: (tab: OrderFilterTabLabel) => void;
  isLoading: boolean;
}) => {
  const { language } = useAppStore();
  const { lang: local } = useParams();
  const isRtl = language === "ar" || language === "ku";
  return (
    <div className="flex flex-col h-full bg-white font-sans w-full">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 w-full">
        <BackBar
          isRtl={isRtl}
          Icon={"/icons/OrderDetailsIcon.svg"}
          local={local}
          name={translateFunction("Orders", language)}
          preivous_page={`/${local}/sellerProfile`}
          DataCy="seller-dashboard-screen-top"
        />

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          <button className="p-2 rounded-lg flex-shrink-0">
            <Icons.Filter />
          </button>
          {ORDER_FILTER_TABS.map((tabItem) => (
            <button
              key={tabItem.label}
              onClick={() => !isLoading && onSelectTab(tabItem.label)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-opacity ${
                selectedTab === tabItem.label
                  ? "bg-gray-800 text-white"
                  : "bg-[#F8F8F8] text-[#8D8D8D]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="p-2 flex-1 overflow-y-auto w-full">
        <div className="space-y-3">
          {isLoading ? (
            [0, 1, 2, 3].map((i) => <SellerOrderCardSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-[#8D8D8D]">
                {translateFunction("No orders found")}
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const items = parseOrderItems(order);
              const itemCount = getItemCount(items);
              const createdAt = order?.created_at || order?.updated_at || "";
              const imageItems = items.slice(0, 4);
              const remainingMinutes = Number(order?.remaining_in_minutes || 0);
              const remainingLabel =
                remainingMinutes > 0 ? `${remainingMinutes}m` : "";

              return (
                <div
                  key={order.id || order.order_group_id}
                  onClick={() => onSelectOrder(order)}
                  data-cy="order-shop-card"
                  className="bg-[#F8F8F8] rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform w-full"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4 w-full">
                    <div className="flex items-center text-xs text-[#8D8D8D]">
                      <Icons.Clock className="text-gray-400 w-4 h-4" />
                      <span className="font-[12px] text-[#1D1D1D] ml-2">
                        {formatCreatedAt(createdAt) || "N/A"}
                      </span>
                      {remainingLabel && (
                        <span className="text-blue-500 font-medium ml-1">
                          {" "}
                          {remainingLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-medium text-[#1D1D1D]">
                      <Icons.Bag2 className="w-[15px] h-[15px]" /> {order.id}
                    </div>
                  </div>

                  {/* Card Stats */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-1">
                      <Icons.Bell />
                      <span className="font-medium text-[#1D1D1D] text-[12px]" data-cy="order-shop-status">
                        {formatStatusLabel(order.order_status)}
                      </span>
                      <div className="bg-gray-100 p-1 rounded-full">
                        <Icons.CheckCircle />
                      </div>
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <Icons.Item />
                      <span className="font-bold text-[#505050] text-[12px]">
                        {itemCount}
                      </span>
                      <span className="text-[#505050] text-[12px]">{translateFunction("Item")}</span>
                      <span className="text-[#505050] text-[12px]">.</span>
                      <span className="font-bold text-[#505050] text-[12px]">
                        {order.order_amount ?? 0}
                      </span>
                      <span className="text-[#505050] text-[12px]">{translateFunction("USD")}</span>
                    </div>
                  </div>

                  {/* Image Gallery */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar rounded-xl">
                    {imageItems.length === 0 ? (
                      <div className="w-[91px] h-[125px] bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                        {translateFunction("No items")}
                      </div>
                    ) : (
                      imageItems.map((item: any, idx: number) => {
                        const productDetails = parseProductDetails(item);
                        const image = getItemImage(item, productDetails);
                        return (
                          <div
                            key={item.id || `${order.id}-img-${idx}`}
                            className="w-[91px] h-[125px] bg-gray-100 relative overflow-hidden flex-shrink-0 rounded-[15px]"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt="item"
                                className="object-cover w-full h-full mix-blend-multiply"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                {translateFunction("No image")}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>
    </div>
  );
};

// B. Order Detail Screen
const OrderDetailScreen = ({
  order,
  onBack,
  orderStatusOptions,
  selectedOrderStatuses,
  setSelectedOrderStatuses,
  orderActionLoading,
  onChangeOrderStatus,
  orderDetailActionLoading,
  onConfirmItem,
  onPackItem,
  onCancelItem,
}: {
  order: any | null;
  onBack: () => void;
  orderStatusOptions: string[];
  selectedOrderStatuses: Record<string, string>;
  setSelectedOrderStatuses: Dispatch<SetStateAction<Record<string, string>>>;
  orderActionLoading: string | null;
  onChangeOrderStatus: (orderId: number | string) => void;
  orderDetailActionLoading: string | null;
  onConfirmItem: (orderId: number | string, item: any) => void;
  onPackItem: (orderId: number | string, item: any) => void;
  onCancelItem: (orderId: number | string, item: any) => void;
}) => {
  if (!order) {
    return (
      <div className="flex flex-col h-full bg-gray-50 w-full">
        <div className="bg-white flex items-center justify-between sticky top-0 z-20 w-full mb-4">
          <button onClick={onBack} className="p-2">
            <Icons.ChevronLeft />
          </button>
          <h1 className="text-[14px] font-bold text-[#1D1D1D] flex items-center gap-2 w-full justify-center">
            <Icons.Bag2 className="text-red-500 fill-red-500" />
            {translateFunction("Order Details")}
          </h1>
          <div className="w-6" />
        </div>
        <div className="flex-1 flex items-center justify-center text-[#8D8D8D] text-sm w-full">
          {translateFunction("No order selected")}
        </div>
      </div>
    );
  }

  const items = parseOrderItems(order);
  const itemCount = getItemCount(items);
  const createdAt = order?.created_at || order?.updated_at || "";
  const orderTotal = order?.order_amount ?? 0;
  const confirmedCount = items.reduce(
    (total, item) =>
      total + (item?.is_confirm ? Number(item?.qty || 0) || 1 : 0),
    0,
  );
  const packedCount = items.reduce(
    (total, item) =>
      total + (item?.is_packed ? Number(item?.qty || 0) || 1 : 0),
    0,
  );
  const collectedCount = items.reduce(
    (total, item) =>
      total + (item?.is_collected ? Number(item?.qty || 0) || 1 : 0),
    0,
  );
  const allConfirmed = itemCount > 0 && confirmedCount >= itemCount;
  const allPacked = itemCount > 0 && packedCount >= itemCount;
  const allCollected = itemCount > 0 && collectedCount >= itemCount;
  const remainingMinutes = Number(order?.remaining_in_minutes || 0);

  return (
    <div className="flex flex-col h-full bg-white font-sans w-full">
      {/* Header */}
      <div className="bg-white flex items-center justify-between sticky top-0 z-20 w-full mb-4">
        <button onClick={onBack} className="p-2">
          <Icons.ChevronLeft />
        </button>
        <div className="font-medium text-[#1D1D1D] text-[14px] flex items-center gap-1 w-full justify-center">
          <Icons.Bag className="text-red-500 fill-red-500" />{" "}
          {translateFunction("Order Details")}
        </div>
        <button>
          <Icons.MoreVertical />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 w-full bg-white">
        {/* Top Stats Grid */}
        <div className="grid grid-cols-3 gap-1 w-full">
          <div className="bg-[#F4F4F4] px-3 py-2 rounded-[15px] flex flex-col justify-start h-[74px] items-start">
            <Icons.Bag2 className="w-[18px] h-[18px]" />
            <span className="text-[9px] text-[#8D8D8D] mt-[5px]">
              {translateFunction("Order Number")}
            </span>
            <span className="text-[12px] text-[#1D1D1D] font-bold">
              {order.id}
            </span>
          </div>
          <div className="bg-[#F4F4F4] px-3 py-2 rounded-[15px] flex flex-col justify-start h-[74px] items-start">
            <Icons.Clock className="w-[18px] h-[18px]" />
            <span className="text-[9px] text-[#8D8D8D] mt-[5px]">
              {translateFunction("Order Date")}
            </span>
            <span className="text-[12px] text-[#1D1D1D]">
              {formatCreatedAt(createdAt) || "N/A"}
            </span>
          </div>
          <div className="bg-[#F4F4F4] px-3 py-2 rounded-[15px] flex flex-col justify-start h-[74px] items-start">
            <Icons.FileText className="w-[18px] h-[18px]" />
            <span className="text-[9px] text-[#8D8D8D] mt-[5px]">
              {translateFunction("Order Invoice")}
            </span>
            <div className="text-[12px] text-[#1D1D1D] font-bold">
              {orderTotal}
              <span className="font-semibold"> {translateFunction("USD")}</span>
            </div>
          </div>
        </div>

        {/* Action Status Cards */}
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-[#F4F4F4] py-[8px] px-[12px] rounded-[15px] h-[74px]">
            <div className="flex items-center">
              <Icons.ShoppingCart />
            </div>
            <span className="text-[10px] text-[#8D8D8D]">{translateFunction("Collect Type")}</span>
            <div className="flex">
              <div className="text-[12px] mr-[22px] text-[#1D1D1D]">
                {translateFunction("Collect")}
              </div>
              <div className="flex flex-row gap-x-[8px]">
                <Icons.CheckCircle className="w-[15px] h-[15px] text-[#000000]" />
                <Icons.PackImage
                  className={`w-[15px] h-[15px] ${
                    allConfirmed ? "text-[#000000]" : "text-[#C4C2C2]"
                  }`}
                />
                <Icons.CollectImage
                  className={`w-[15px] h-[15px] ${
                    allPacked ? "text-[#000000]" : "text-[#C4C2C2]"
                  }`}
                />
                <Icons.CollectedImage
                  className={`w-[15px] h-[15px] ${
                    allCollected ? "text-[#000000]" : "text-[#C4C2C2]"
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F4F4F4] py-[8px] px-[12px] rounded-[15px] h-[74px]">
            <div className="flex flex-col items-start">
              <Icons.Clock2Image />
            </div>
            <span className="text-[10px] text-[#8D8D8D]">
              {translateFunction("Duration To Do Action")}
            </span>
            <div className="text-[12px] text-[#388CFF]">
              {remainingMinutes > 0
                ? `${translateFunction("Remaining")} ${formatRemainingDuration(remainingMinutes)}`
                : translateFunction("No remaining time")}
            </div>
          </div>
        </div>
        {/* {orderStatusOptions.length > 0 && (
          <div className="bg-[#F4F4F4] p-4 rounded-[15px]">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Bell />
              <span className="text-xs text-[#8D8D8D]">
                {translateFunction("Change status")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedOrderStatuses[String(order.id)] || ""}
                onChange={(e) =>
                  setSelectedOrderStatuses((prev) => ({
                    ...prev,
                    [String(order.id)]: e.target.value,
                  }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{translateFunction("Select")}</option>
                {orderStatusOptions.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {formatStatusLabel(statusOption)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onChangeOrderStatus(order.id)}
                disabled={
                  orderActionLoading === String(order.id) ||
                  !selectedOrderStatuses[String(order.id)]
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {orderActionLoading === String(order.id)
                  ? translateFunction("Updating...")
                  : translateFunction("Update")}
              </button>
            </div>
          </div>
        )} */}
        <div className="bg-[#F4F4F4] py-[8px] px-[12px] rounded-[15px] h-[74px]">
          <div className="flex items-center mb-1">
            <Icons.Bag />
          </div>
          <div className="grid grid-cols-6 gap-x-[18px]">
            <span className="text-[10px] text-[#8D8D8D] col-span-1 min-w-[60px]">
              {translateFunction("Order Details")}
            </span>
            <span className="text-[10px] text-[#8D8D8D] col-span-5">
              {translateFunction("Order Status")}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-x-[18px]">
            <span className="text-[12px] text-[#1D1D1D]">
              <span className="font-bold">{itemCount}</span>{" "}
              {translateFunction("Item")}
            </span>
            <div className="flex items-center gap-[18px] col-span-5">
              <span className="text-[12px] text-[#1D1D1D]">
                {translateFunction("Confirmed")} {confirmedCount}/{itemCount}
              </span>
              <span className="text-[12px] text-[#1D1D1D]">
                {translateFunction("Packed")} {packedCount}/{itemCount}
              </span>
              <span className="text-[12px] text-[#1D1D1D]">
                {translateFunction("Collected")} {collectedCount}/{itemCount}
              </span>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-4 px-[12px]">
          {items.map((item: any, idx: number) => {
            const productDetails = parseProductDetails(item);
            const productName =
              item.product_name ||
              productDetails?.product_name ||
              (item?.product_id
                ? `Product #${item.product_id}`
                : `Item #${item.id ?? idx + 1}`);
            const brandImage = GetImageUrl(
              getConfiguredImage({
                src: item.brand_icon,
                width: 100,
                height: 100,
              }),
            );
            const image = getItemImage(item, productDetails);
            const variantColor = item.color || "";
            const variantSize = item.size || "";
            const unitPrice = Number(item.unit_price || 0);
            const offerPrice = Number(item.offer_price || 0) ?? unitPrice;
            const qty = Number(item.qty || 0);
            const itemTotalPrice = offerPrice * qty;
            const isConfirmed = Boolean(item?.is_confirm);
            const isPacked = Boolean(item?.is_packed);
            const isCanceled=order.order_status === "canceled"||item.qty===0;
            const isWaiting = !isConfirmed;
            const isActionLoading =
              orderDetailActionLoading === String(item?.id);
            const statusLabel = formatItemStatus(item);

            return (
              <div
                key={item.id || `${order.id}-item-${idx}`}
                className="bg-white p-4 rounded-2xl relative"
              >
                {/* Index Badge */}
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  {idx + 1}
                </div>

                <div className="flex gap-4 mb-4">
                  {image ? (
                    <img
                      src={image}
                      alt="product"
                      className="w-[104px] h-[144px] object-cover rounded-lg bg-gray-100"
                    />
                  ) : (
                    <div className="w-[104px] h-[144px] rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                      {translateFunction("No image")}
                    </div>
                  )}
                  <div className="flex-1 pt-1">
                    <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs mb-[5px]">
                      <img
                        src={brandImage}
                        alt="brand"
                        className="w-auto h-[30px]"
                      />
                    </h3>
                    <p className="text-sm text-gray-600 mb-[5px]">
                      {productName}
                    </p>

                    <div className="space-y-1">
                      <div className="flex flex-row items-center gap-10">
                        <div className="text-xs flex mb-[5px]">
                          <span className="text-gray-400 mr-[5px]">{translateFunction("Color:")}</span>{" "}
                          <span className="text-gray-700 font-medium">
                            {variantColor || translateFunction("N/A")}
                          </span>
                        </div>
                        <div className="text-xs flex mb-[5px]">
                          <span className="text-gray-400 mr-[5px]">{translateFunction("Size:")}</span>{" "}
                          <span className="text-gray-700 font-medium">
                            {variantSize || translateFunction("N/A")}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs flex mb-[5px]">
                        <span className="text-gray-400 mr-[5px]">{translateFunction("ID:")}</span>{" "}
                        <span className="text-gray-700 font-medium">
                          {item?.product_id ?? item?.id ?? "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mb-[5px]">
                      <div className="text-xs text-[#8D8D8D]">
                        {translateFunction("Quantity:")}{" "}
                        <span className="text-gray-900 font-bold">{qty}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#1D1D1D] text-[12px]">
                          {qty > 1
                            ? `${offerPrice} / ${itemTotalPrice}`
                            : `${itemTotalPrice}`}{" "}
                        </span>
                        <span className="text-[12px] text-[#1D1D1D]">{translateFunction("USD")}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#8D8D8D]">
                      {translateFunction("Status:")}{" "}
                      <span className="text-[#505050]">{statusLabel}</span>
                    </div>
                  </div>
                </div>

                {isWaiting ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => onConfirmItem(order.id, item)}
                      disabled={isActionLoading||isCanceled}
                      className="flex-1 py-2.5 rounded-[10px] border border-[#388CFF] text-[#388CFF] bg-white font-medium text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActionLoading
                        ? translateFunction("Updating...")
                        : translateFunction("Confirm & Start Packing")}
                    </button>
                    <button
                      onClick={() => onCancelItem(order.id, item)}
                     disabled={isActionLoading||isCanceled}
                      className="px-6 py-2.5 rounded-[10px] border border-[#FF9FA5] text-[#FF6B6B] bg-white font-medium text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {translateFunction("Cancel")}
                    </button>
                  </div>
                ) : !isPacked ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => onPackItem(order.id, item)}
                      disabled={isActionLoading||isCanceled}
                      className="flex-1 py-2.5 rounded-[10px] border border-[#402CDD] text-[#402CDD] bg-[#EFEDFD] font-medium text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActionLoading
                        ? translateFunction("Updating...")
                        : translateFunction("Packed")}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1 py-2.5 rounded-[10px] border border-[#388CFF] text-[#388CFF] bg-[#EDFDFD] font-medium text-[12px] flex items-center justify-center cursor-default">
                      {translateFunction("Ready To Collect")}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export const RenderOrders = ({
  canViewOrders,
  sellerId,
  activeTab,
}: {
  canViewOrders: boolean;
  sellerId: string;
  activeTab: string;
}) => {
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderStatusOptions, setOrderStatusOptions] = useState<string[]>([]);
  const [selectedOrderStatuses, setSelectedOrderStatuses] = useState<
    Record<string, string>
  >({});
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(
    null,
  );
  const [orderDetailActionLoading, setOrderDetailActionLoading] = useState<
    string | null
  >(null);

  const [ordersMeta, setOrdersMeta] = useState<any>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [screen, setScreen] = useState<"list" | "detail">("list");
  const [selectedOrderId, setSelectedOrderId] = useState<
    number | string | null
  >(null);
  const [selectedOrderFilterTab, setSelectedOrderFilterTab] =
    useState<OrderFilterTabLabel>("All");

  const sellerOrders = useAppStore((state) => state.sellerOrders);
  const setSellerOrders = useAppStore((state) => state.setSellerOrders);

  const selectedOrder =
    sellerOrders.find((o) => String(o.id) === String(selectedOrderId)) ?? null;

  const shouldUpdateOrders = useAppStore((state) => state.shouldUpdateOrders);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const getSellerOrders = async (page: number = 1) => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const status = getOrderStatusFromTab(selectedOrderFilterTab);
      const res = await SellerDashboardService.getSellerOrders(
        sellerId,
        page,
        status,
      );
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load orders");
      }
      const orders = res.data?.orders || res.data || [];
      const normalizedOrders = Array.isArray(orders) ? orders : [];
      setSellerOrders(normalizedOrders);
      setOrdersMeta(res.data?.meta || null);
      setHasMore(res.data?.meta?.has_more_pages || false);
      setOrderStatusOptions(
        res.data?.user_abilities?.change_order_status || [],
      );
      setOrdersPage(page);
    } catch (error: any) {
      LogError({
        scenario: "SellerOrders.getSellerOrders",
        error: error instanceof Error ? error.message : String(error),
      });
      setOrdersError(
        error?.message || translateFunction("Failed to load orders"),
      );
    } finally {
      setOrdersLoading(false);
    }
  };
  const handleChangeOrderStatus = async (orderId: number | string) => {
    const status = selectedOrderStatuses[String(orderId)];
    if (!status) return;
    try {
      setOrderActionLoading(String(orderId));
      setOrdersError(null);
      const res = await SellerDashboardService.updateOrderStatus(sellerId, {
        id: Number(orderId),
        status,
      });
      if (!res?.success) {
        throw new Error(res?.message || "Failed to update order status");
      }
      setSellerOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, order_status: status, order_group_status: status }
            : order,
        ),
      );
    } catch (error: any) {
      LogError({
        scenario: "SellerOrders.handleChangeOrderStatus",
        error: error instanceof Error ? error.message : String(error),
      });
      setOrdersError(
        error?.message || translateFunction("Failed to update order status"),
      );
    } finally {
      setOrderActionLoading(null);
    }
  };

  const syncOrderDetailUpdate = (
    orderId: number | string,
    detailId: number | string,
    updateFn: (item: any) => any,
  ) => {
    setSellerOrders(sellerOrders.map((order) =>
      order.id === orderId
        ? updateOrderDetailItem(order, detailId, updateFn)
        : order,
    ));
  };

  const syncOrderDetailCancel = (
    orderId: number | string,
    detailId: number | string,
    qty: number,
  ) => {
    setSellerOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? applyCancelToOrderDetail(order, detailId, qty)
          : order,
      ),
    );
  };

  const handleConfirmItem = async (orderId: number | string, item: any) => {
    const detailId = item?.id;
    if (!detailId) return;
    try {
      setOrderDetailActionLoading(String(detailId));
      setOrdersError(null);
      const res = await SellerDashboardService.confirmOrderDetailStatus(
        sellerId,
        {
          order_detail_id: Number(detailId),
        },
      );
      if (!res?.success) {
        throw new Error(res?.message || "Failed to confirm order item");
      }
      syncOrderDetailUpdate(orderId, detailId, (current) => ({
        ...current,
        is_confirm: true,
      }));
    } catch (error: any) {
      LogError({
        scenario: "SellerOrders.handleConfirmItem",
        error: error instanceof Error ? error.message : String(error),
      });
      setOrdersError(
        error?.message || translateFunction("Failed to confirm order item"),
      );
    } finally {
      setOrderDetailActionLoading(null);
    }
  };

  const handlePackItem = async (orderId: number | string, item: any) => {
    const detailId = item?.id;
    if (!detailId) return;
    try {
      setOrderDetailActionLoading(String(detailId));
      setOrdersError(null);
      const res = await SellerDashboardService.packOrderDetailStatus(sellerId, {
        order_detail_id: Number(detailId),
      });
      if (!res?.success) {
        throw new Error(res?.message || "Failed to pack order item");
      }
      syncOrderDetailUpdate(orderId, detailId, (current) => ({
        ...current,
        is_confirm: true,
        is_packed: true,
      }));
    } catch (error: any) {
      LogError({
        scenario: "SellerOrders.handlePackItem",
        error: error instanceof Error ? error.message : String(error),
      });
      setOrdersError(
        error?.message || translateFunction("Failed to pack order item"),
      );
    } finally {
      setOrderDetailActionLoading(null);
    }
  };

  const handleCancelItem = async (orderId: number | string, item: any) => {
    const detailId = item?.id;
    if (!detailId) return;
    const qty = Number(item?.qty || 0);
    if (!qty) return;
    try {
      setOrderDetailActionLoading(String(detailId));
      setOrdersError(null);
      const res = await SellerDashboardService.cancelOrderDetail(sellerId, {
        detail_id: Number(detailId),
        order_id: Number(orderId),
        qty,
      });
      if (!res?.success) {
        throw new Error(res?.message || "Failed to cancel order item");
      }
      syncOrderDetailCancel(orderId, detailId, qty);
    } catch (error: any) {
      LogError({
        scenario: "SellerOrders.handleCancelItem",
        error: error instanceof Error ? error.message : String(error),
      });
      setOrdersError(
        error?.message || translateFunction("Failed to cancel order item"),
      );
    } finally {
      setOrderDetailActionLoading(null);
    }
  };

  useEffect(() => {
    if (activeTab === "orders" && canViewOrders) {
      getSellerOrders(1);
    }
  }, [activeTab, canViewOrders, sellerId, selectedOrderFilterTab]);

  useEffect(() => {
    const orderTopic = `shop_${sellerId}_order`;
    const orderDetailTopic = `shop_${sellerId}_order_detail`;

    void home.subscribeToTopic({ topic: orderTopic });
    void home.subscribeToTopic({ topic: orderDetailTopic });

    return () => {
      // void home.UnsubscripeFromTopic({ topic: orderTopic });
      // void home.UnsubscripeFromTopic({ topic: orderDetailTopic });
    };
  }, [activeTab, canViewOrders, sellerId, sellerOrders]);

  useEffect(() => {
    if (
      activeTab === "orders" &&
      canViewOrders &&
      sellerId &&
      shouldUpdateOrders > 0
    ) {
      getSellerOrders(1);
    }
  }, [shouldUpdateOrders, activeTab, canViewOrders, sellerId]);

  if (!canViewOrders) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-[16px] font-medium text-[#1d1d1d] mb-2">
            {translateFunction("Access Denied")}
          </p>
          <p className="text-[14px] text-[#8D8D8D]">
            {translateFunction(
              "You need order viewing permissions to see this section",
            )}
          </p>
        </div>
      </div>
    );
  }

  if (ordersError && sellerOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">{ordersError}</p>
        <button
          onClick={() => getSellerOrders(1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {translateFunction("Retry")}
        </button>
      </div>
    );
  }
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (ordersLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreOrders(ordersPage + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [ordersLoading, hasMore, ordersPage],
  );
  const loadMoreOrders = async (page) => {
    if (!ordersLoading && hasMore) {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const status = getOrderStatusFromTab(selectedOrderFilterTab);
        const res = await SellerDashboardService.getSellerOrders(
          sellerId,
          page,
          status,
        );
        if (!res?.success) {
          throw new Error(res?.message || "Failed to load orders");
        }
        const orders = res.data?.orders || res.data || [];
        const normalizedOrders = Array.isArray(orders) ? orders : [];
        setSellerOrders([...sellerOrders, ...normalizedOrders]);
        setOrdersMeta(res.data?.meta || null);
        setHasMore(res.data?.meta?.has_more_pages || false);
        setOrderStatusOptions(
          res.data?.user_abilities?.change_order_status || [],
        );
        setOrdersPage(page);
      } catch (error: any) {
        LogError({
          scenario: "SellerOrders.loadMoreOrders",
          error: error instanceof Error ? error.message : String(error),
        });
        setOrdersError(
          error?.message || translateFunction("Failed to load orders"),
        );
      } finally {
        setOrdersLoading(false);
      }
    }
  };
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {/* Mobile Frame */}
      <div className="min-h-screen w-full bg-white rounded-[3rem] relative flex flex-col">
        {/* Screen Content */}
        <div className="flex-1relative bg-white w-full">
          {screen === "list" ? (
            <>
              <OrderListScreen
                orders={sellerOrders}
                selectedTab={selectedOrderFilterTab}
                isLoading={ordersLoading}
                onSelectTab={(tab) => {
                  setSelectedOrderFilterTab(tab);
                  setScreen("list");
                  setSelectedOrderId(null);
                }}
                onSelectOrder={(order) => {
                  setSelectedOrderId(order?.id ?? null);
                  setScreen("detail");
                }}
              />

              {sellerId.length > 0 && !ordersLoading && (
                <div ref={lastElementRef} className="h-4" />
              )}
            </>
          ) : (
            <OrderDetailScreen
              order={selectedOrder}
              onBack={() => { setScreen("list"); setSelectedOrderId(null); }}
              orderStatusOptions={orderStatusOptions}
              selectedOrderStatuses={selectedOrderStatuses}
              setSelectedOrderStatuses={setSelectedOrderStatuses}
              orderActionLoading={orderActionLoading}
              onChangeOrderStatus={handleChangeOrderStatus}
              orderDetailActionLoading={orderDetailActionLoading}
              onConfirmItem={handleConfirmItem}
              onPackItem={handlePackItem}
              onCancelItem={handleCancelItem}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RenderOrders;
