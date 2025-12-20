import * as React from "react";

const DimondPay = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="15"
    height="15"
    viewBox="0 0 15 15"
    {...props}
  >
    <defs>
      <clipPath id="clip-path">
        <rect
          id="Rectangle_4644"
          data-name="Rectangle 4644"
          width="15"
          height="15"
          transform="translate(-0.001 0)"
          fill="none"
        />
      </clipPath>
    </defs>
    <g
      id="Mask_Group_488"
      data-name="Mask Group 488"
      transform="translate(0.001 0)"
      clipPath="url(#clip-path)"
    >
      <g id="coins" transform="translate(2.425 0)">
        <path
          id="Path_22108"
          data-name="Path 22108"
          d="M2.464,8.331,7.189.614l4.725,7.717L7.189,11.083Z"
          transform="translate(-2.464 -0.614)"
          fill="#c4c2c2"
        />
        <path
          id="Path_22109"
          data-name="Path 22109"
          d="M7.174,9.118l4.574-2.839-4.574,6.5-4.681-6.5Z"
          transform="translate(-2.45 2.218)"
          fill="#c4c2c2"
        />
      </g>
    </g>
  </svg>
);

export default DimondPay;
