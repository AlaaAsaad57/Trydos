import * as React from "react";

const OrdersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="32"
    height="25"
    viewBox="0 0 32 25"
    {...props}
  >
    <defs>
      <clipPath id="clip-path">
        <rect
          id="Rectangle_4609"
          data-name="Rectangle 4609"
          width="25"
          height="25"
          fill="none"
        />
      </clipPath>
      <clipPath id="clip-path-2">
        <rect
          id="Rectangle_4561"
          data-name="Rectangle 4561"
          width="15"
          height="15"
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
        <stop offset="0" stop-color="#f53c3c" />
        <stop offset="1" stop-color="#ff9696" />
      </linearGradient>
    </defs>
    <g id="Group_13482" data-name="Group 13482" transform="translate(-17 -194)">
      <g id="_25x25_Back" data-name="25x25 Back" transform="translate(24 194)">
        <g
          id="Mask_Group_665"
          data-name="Mask Group 665"
          clipPath="url(#clip-path)"
        >
          <g
            id="Group_4033"
            data-name="Group 4033"
            transform="translate(1.814)"
          >
            <g id="Group_4032" data-name="Group 4032">
              <path
                id="Path_15859"
                data-name="Path 15859"
                d="M-1.719-1.843H13.218L16.04,13.732S14.628,15.9,13.815,15.9c-.616,0-11.384.355-16.506-.273-1.351-.166-1.822-1.892-1.822-1.892Z"
                transform="translate(4.967 8.754)"
                fill="#3c3c3c"
              />
              <g id="bag-5">
                <g id="Group_2946" data-name="Group 2946">
                  <path
                    id="Path_15168"
                    data-name="Path 15168"
                    d="M63,51.749H78.373a3,3,0,0,0,3-3,.32.32,0,0,0,0-.057L78.873,34.6a1.656,1.656,0,0,0-1.643-1.4h-1.8V31.494a4.745,4.745,0,1,0-9.49,0V33.2h-1.8a1.656,1.656,0,0,0-1.64,1.4L60,48.692a.324.324,0,0,0,0,.057,3,3,0,0,0,3,3Zm3.6-20.255a4.091,4.091,0,1,1,8.182,0V33.2H66.6Zm-3.451,3.219v-.006a1,1,0,0,1,1-.853h1.8v2.589a.327.327,0,0,0,.654,0V33.854h8.182v2.589a.327.327,0,1,0,.654,0V33.854h1.8a1,1,0,0,1,1,.853v.006L80.72,48.776a2.349,2.349,0,0,1-2.346,2.318H63a2.349,2.349,0,0,1-2.346-2.318Z"
                    transform="translate(-60 -26.749)"
                    fill="#3c3c3c"
                  />
                </g>
              </g>
            </g>
            <path
              id="Path_15172"
              data-name="Path 15172"
              d="M0,0S2.619,2.236,5.43,2.236,11.242,0,11.242,0"
              transform="translate(5.066 16.334)"
              fill="none"
              stroke="#fce66e"
              stroke-linecap="round"
              stroke-width="0.6"
            />
          </g>
        </g>
      </g>
      <g
        id="_15x15_photo_back"
        data-name="15x15 photo back"
        transform="translate(17 204)"
      >
        <g
          id="Mask_Group_666"
          data-name="Mask Group 666"
          clipPath="url(#clip-path-2)"
        >
          <g
            id="Group_4033-2"
            data-name="Group 4033"
            transform="translate(1.088)"
          >
            <g id="Group_4032-2" data-name="Group 4032">
              <path
                id="Path_15859-2"
                data-name="Path 15859"
                d="M-2.35-1.644H6.612L8.307,7.7S7.46,9,6.969,9a94.564,94.564,0,0,1-9.9-.168C-3.747,8.736-4.025,7.7-4.025,7.7Z"
                transform="translate(4.298 5.791)"
                fill="url(#linear-gradient)"
              />
              <g id="bag-5-2" data-name="bag-5">
                <g id="Group_2946-2" data-name="Group 2946">
                  <path
                    id="Path_15168-2"
                    data-name="Path 15168"
                    d="M55.325,38.862h9.223a1.8,1.8,0,0,0,1.8-1.8.192.192,0,0,0,0-.034l-1.5-8.453a.994.994,0,0,0-.986-.841H62.784V26.709a2.847,2.847,0,0,0-5.694,0v1.023H56.011a.994.994,0,0,0-.986.841l-1.5,8.454a.2.2,0,0,0,0,.034,1.8,1.8,0,0,0,1.8,1.8Zm2.157-12.153a2.454,2.454,0,0,1,4.906,0v1.023H57.483ZM55.412,28.64h0a.6.6,0,0,1,.6-.512h1.083v1.553a.2.2,0,1,0,.393,0V28.125h4.906v1.553a.2.2,0,0,0,.393,0V28.125h1.079a.6.6,0,0,1,.6.512h0l1.5,8.437a1.41,1.41,0,0,1-1.408,1.391H55.325a1.41,1.41,0,0,1-1.408-1.391Z"
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
);

export default OrdersIcon;
