import React from "react";

const OrderItemId = ({ id, isRtl }) => {
  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } gap-[5px] flex items-center`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="15"
        height="15"
        viewBox="0 0 15 15"
      >
        <defs>
          <clipPath id="clip-path23">
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
          clipPath="url(#clip-path23)"
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
      <span
        className=" text-[#1D1D1D] text-[12px] medium"
        data-pw="order-group-id"
      >
        {id}
      </span>
    </div>
  );
};

export default OrderItemId;
