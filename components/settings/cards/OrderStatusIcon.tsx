import React from "react";
import CancelOrderIcon from "public/svg/cancelOrderItemIcon";
import {
  DeliveredStatus,
  NormalStatus,
  PendingStatus,
  PreparingStatus,
  ShippedSatus,
} from "./OrderStatusCartsIcon";

function OrderStatusIcon({ status , isRtl} : {status : string , isRtl?: boolean}) {
  if (!status || typeof status !== "string") return <></>;
  if (status?.toLowerCase() === "pending")
    return (
      <svg
        id="_15x15_photo_back"
        data-name="15x15 photo back"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="15"
        height="15"
        viewBox="0 0 15 15"
      >
        <defs>
          <clipPath id="clipPath">
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
          clipPath="url(#clipPath)"
        >
          <path
            id="claim"
            d="M1.1,9.718a.217.217,0,0,1-.418.112A7.477,7.477,0,1,1,5.563,15a.217.217,0,1,1,.136-.411A7.043,7.043,0,1,0,1.1,9.718Zm9.3-4.011a.615.615,0,0,1,.852.888L7.635,10.069a.615.615,0,0,1-.848,0l-2.225-2.1a.615.615,0,1,1,.844-.9l1.8,1.7Zm-5.14,5.018a.217.217,0,1,1-.309-.3l.309-.314a.217.217,0,0,1,.309.3Zm-1.3-.474a.217.217,0,0,1-.419-.109l.11-.426a.217.217,0,0,1,.419.109Zm1.6,1.876a.217.217,0,1,1-.115-.417l.424-.117a.217.217,0,1,1,.115.417Zm-3.055,2L1.345,15.288a.155.155,0,0,1-.219,0L.433,14.6a.155.155,0,0,1,0-.219L1.59,13.219l-.734-.4a.155.155,0,0,1,.021-.281l3.34-1.229a.155.155,0,0,1,.2.2l-1.229,3.34a.155.155,0,0,1-.281.021Z"
            transform="translate(-0.388 -0.389)"
            fillRule="evenodd"
          />
        </g>
      </svg>
    );

  if (
    status?.toLowerCase() === "preparing" ||
    status?.toLowerCase() === "shipping_center" ||
    status?.toLowerCase() === "ready_to_shipping"
  )
    return (
      <svg
        className="ml-[7px]"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="15"
        height="15"
        viewBox="0 0 15 15"
      >
        <defs>
          <clipPath id="clip-path343">
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
          id="Mask_Group_689"
          data-name="Mask Group 689"
          clipPath="url(#clip-path343)"
        >
          <g id="work" transform="translate(0 0.298)">
            <path
              id="Path_22949"
              data-name="Path 22949"
              d="M4.739,10.128v5.131H7.132V12.182h4.288v3.077h.312V12.182H15.4V10.128Z"
              transform="translate(-0.79 -1.192)"
            />
            <path
              id="Path_22950"
              data-name="Path 22950"
              d="M12.173,8.75h2.919v.877H12.173Z"
              transform="translate(-2.029 -0.962)"
            />
            <path
              id="Path_22951"
              data-name="Path 22951"
              d="M12.416,7.484h2.919v.878H12.416Z"
              transform="translate(-2.069 -0.751)"
            />
            <path
              id="Path_22952"
              data-name="Path 22952"
              d="M6.376,4.568l.3.2.294-.114a.5.5,0,0,1,.182-.034.5.5,0,0,1,.444.745l.139.09H9.283l.02-.03L6.854,3.832Z"
              transform="translate(-1.063 -0.143)"
            />
            <path
              id="Path_22953"
              data-name="Path 22953"
              d="M11.714,12.868H10.243V14.4l-.167-.114-.151.114-.141-.114-.161.114-.158-.114-.108.114v-1.53H7.886v3.183h3.829Z"
              transform="translate(-1.314 -1.649)"
            />
            <path
              id="Path_22954"
              data-name="Path 22954"
              d="M13.406,16.051h3.829V12.868H15.763V14.4l-.167-.114-.151.114-.141-.114-.161.114-.158-.114-.108.114v-1.53H13.406Z"
              transform="translate(-2.234 -1.649)"
            />
            <path
              id="Path_22955"
              data-name="Path 22955"
              d="M1.91,13.695a.574.574,0,0,0,.523.621l.05,0a.574.574,0,0,0,.571-.525l.289-3.358h0a.571.571,0,0,0,0-.068s0-.008,0-.013,0-.036-.006-.055c0,0,0-.006,0-.009L2.919,7.826a6.407,6.407,0,0,1,.135-2.172L2.062,4.6a.505.505,0,0,1,.368-.851.507.507,0,0,1,.368.159l.936.994.179.143a.373.373,0,0,0,.428.027l.95-.583,0,0,.622-.957.648.421,0-.008a.373.373,0,0,0-.16-.5L6.139,3.3a.373.373,0,0,0-.367.013l-1.6.981L2.912,3.29A.372.372,0,0,0,2.8,3.23.929.929,0,0,0,1.438,3.9c-.225.757.537,1.127-.367,3.1a1.276,1.276,0,0,0-.122.438.57.57,0,0,0,.037.351l1.2,2.7Z"
              transform="translate(-0.156 -0.023)"
            />
            <path
              id="Path_22956"
              data-name="Path 22956"
              d="M1.742,1.227a1.372,1.372,0,0,1,.042-.2C1.344,1.073.827,1.3.742,2.278.66,3.237.32,3.354.063,3.314s.32.523.992-.04c.517-.433.312-1.529.678-1.8A1.367,1.367,0,0,1,1.742,1.227Z"
              transform="translate(0 0.325)"
            />
            <circle
              id="Ellipse_536"
              data-name="Ellipse 536"
              cx="1.234"
              cy="1.234"
              r="1.234"
              transform="translate(1.366 1.503) rotate(-37.523)"
            />
            <path
              id="Path_22957"
              data-name="Path 22957"
              d="M7.146,5.983l-1.023.395L5.707,8.384l.223.046.28-1.35V9.166h3.829V7.08l.28,1.35.223-.046-.5-2.4h-2.9Z"
              transform="translate(-0.951 -0.501)"
            />
            <path
              id="Path_22958"
              data-name="Path 22958"
              d="M6.607,5.5a.373.373,0,1,0-.269-.7L4.288,5.6,2.925,4.152a.373.373,0,1,0-.543.512l1.535,1.63a.373.373,0,0,0,.406.092Z"
              transform="translate(-0.38 -0.176)"
            />
          </g>
        </g>
      </svg>
    );
  if (
    status.toLowerCase() === "shipped" ||
    status.toLowerCase() === "out_for_delivery" ||
    status.toLowerCase() === "in_delivery_center"
  )
    return (
      <svg
        id="_15x15_photo_back"
        data-name="15x15 photo back"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="15"
        height="15"
        viewBox="0 0 15 15"
      >
        <defs>
          <clipPath id="clipPath">
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
          id="Mask_Group_768"
          data-name="Mask Group 768"
          clipPath="url(#clipPath)"
        >
          <g id="rocket-2">
            <path
              id="Path_23361"
              data-name="Path 23361"
              d="M2.431,6.932l2.119.16c.223-.55.466-1.1.726-1.623.283-.579.617-1.263,1-1.924A7.412,7.412,0,0,0,2.431,6.932Z"
              fill="#1d1d1d"
            />
            <path
              id="Path_23362"
              data-name="Path 23362"
              d="M7.741,10.231,7.9,12.339a7.519,7.519,0,0,0,3.417-3.8c-.3.168-.629.342-1.006.528-.178.1-.342.179-.493.251-.255.122-.514.241-.791.362-.423.2-.857.381-1.29.553Z"
              fill="#1d1d1d"
            />
            <path
              id="Path_23363"
              data-name="Path 23363"
              d="M14.871.026a12.282,12.282,0,0,0-3.661.3l3.355,3.315a10.862,10.862,0,0,0,.3-1.906c.027-.394.019-1.561.01-1.709Z"
              fill="#1d1d1d"
            />
            <circle
              id="Ellipse_548"
              data-name="Ellipse 548"
              cx="0.907"
              cy="0.907"
              r="0.907"
              transform="translate(9.359 3.668)"
              fill="#1d1d1d"
            />
            <path
              id="Path_23364"
              data-name="Path 23364"
              d="M10.64.484a6.433,6.433,0,0,0-2.715,1.64A14.746,14.746,0,0,0,5.738,5.692,23.981,23.981,0,0,0,4.375,9.1L5.7,10.405A24.614,24.614,0,0,0,9.148,9.058,14.137,14.137,0,0,0,12.759,6.9,6.34,6.34,0,0,0,14.4,4.2Zm-.374,5.6a1.512,1.512,0,1,1,1.512-1.512A1.512,1.512,0,0,1,10.266,6.087Z"
              fill="#1d1d1d"
            />
            <path
              id="Path_23365"
              data-name="Path 23365"
              d="M.531,14.847a.258.258,0,0,1-.185-.433l3.518-3.622a.258.258,0,0,1,.363-.006.255.255,0,0,1,.006.361L.716,14.769a.257.257,0,0,1-.185.078Z"
              fill="#1d1d1d"
            />
            <path
              id="Path_23366"
              data-name="Path 23366"
              d="M3.007,15a.258.258,0,0,1-.192-.425l2.28-2.552A.258.258,0,0,1,5.458,12a.255.255,0,0,1,.021.361L3.2,14.914A.257.257,0,0,1,3.007,15Z"
              fill="#1d1d1d"
            />
            <path
              id="Path_23367"
              data-name="Path 23367"
              d="M.376,12.554a.258.258,0,0,1-.192-.425l2.28-2.552a.258.258,0,0,1,.363-.021.255.255,0,0,1,.021.361L.568,12.468a.257.257,0,0,1-.192.086Z"
              fill="#1d1d1d"
            />
          </g>
        </g>
      </svg>
    );
  if (status.toLowerCase() === "delivered")
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="15"
        height="15"
        viewBox="0 0 15 15"
      >
        <defs>
          <clipPath id="clipPath">
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
          id="Group_13736"
          data-name="Group 13736"
          transform="translate(-94 -401)"
        >
          <g
            id="Mask_Group_688"
            data-name="Mask Group 688"
            transform="translate(94 401)"
            clipPath="url(#clipPath)"
          >
            <g id="shopping-3" transform="translate(0 1.873)">
              <path
                id="Path_22938"
                data-name="Path 22938"
                d="M6.02,7.35a.387.387,0,0,1-.033-.773l.078-.008V5.38H5.156v.763h-.52V5.38H3.727V6.389a1.891,1.891,0,0,0,.21.012,2.358,2.358,0,0,0,.343-.027.387.387,0,1,1,.114.766,3.12,3.12,0,0,1-.457.035h0c-.07,0-.139,0-.206-.008v.552H6.065v-.37H6.02ZM5.3,7.539H5.1v-.2h.2Zm.28,0h-.2v-.2h.2Zm.28,0h-.2v-.2h.2Z"
                transform="translate(-0.621 -0.897)"
              />
              <path
                id="Path_22939"
                data-name="Path 22939"
                d="M4.047,2.742c0-.153-.373-.277-.832-.277H3.169a.871.871,0,1,0,.251.736,2.42,2.42,0,0,1-.247-.026c-.446-.069-.79-.244-.78-.394.059.134.4.237.822.237a1.548,1.548,0,0,0,.731-.145c.064-.039.1-.085.1-.133Z"
                transform="translate(-0.281 -0.369)"
              />
              <path
                id="Path_22940"
                data-name="Path 22940"
                d="M1.549,6.085a2.588,2.588,0,0,1-.414-.9v0a.387.387,0,1,1,.758-.159l0,.019c0,.016.012.044.023.08a1.947,1.947,0,0,0,.115.277l.018-.089c.111-.385-.034-.846-.365-.929a.886.886,0,0,0-1,.664,4.276,4.276,0,0,0-.22,2.149.729.729,0,0,0,.547.648,5.216,5.216,0,0,1,.221,1.5,4.864,4.864,0,0,1-.3,1.7.484.484,0,1,0,.907.336A5.831,5.831,0,0,0,2.2,9.341a6.072,6.072,0,0,0-.352-2.049,3.559,3.559,0,0,1,.007-.861,2.3,2.3,0,0,1-.305-.346Z"
                transform="translate(-0.069 -0.727)"
              />
              <path
                id="Path_22941"
                data-name="Path 22941"
                d="M3.988,6.979A.31.31,0,1,0,3.9,6.367a2.416,2.416,0,0,1-.355.027,1.57,1.57,0,0,1-.8-.2,1.611,1.611,0,0,1-.619-.673A2.017,2.017,0,0,1,2,5.23c-.012-.037-.02-.066-.025-.085l0-.02v0a.31.31,0,0,0-.607.125,2.5,2.5,0,0,0,.4.877,2.123,2.123,0,0,0,.668.61,2.19,2.19,0,0,0,1.1.278h0a3.029,3.029,0,0,0,.445-.034Z"
                transform="translate(-0.227 -0.813)"
              />
              <path
                id="Path_22942"
                data-name="Path 22942"
                d="M2.756,12.12H6.885v.232H2.756Z"
                transform="translate(-0.459 -2.02)"
              />
              <path
                id="Path_22943"
                data-name="Path 22943"
                d="M0,12.12H.465v.232H0Z"
                transform="translate(0 -2.02)"
              />
              <path
                id="Path_22944"
                data-name="Path 22944"
                d="M15.973,0H10.71V10.1h-.554v.232H11.4V9.953h-.483V.207h4.208l-3.467.884v10.16l.018,0,3.588-.915h1.428V10.1h-.72ZM12.041,5.908l.311-.1v1.97l-.311.1Z"
                transform="translate(-1.693)"
              />
              <ellipse
                id="Ellipse_535"
                data-name="Ellipse 535"
                cx="0.871"
                cy="0.871"
                rx="0.871"
                ry="0.871"
                transform="matrix(0.974, -0.227, 0.227, 0.974, 5.553, 2.026)"
              />
              <path
                id="Path_22945"
                data-name="Path 22945"
                d="M9.316,10.989a4.862,4.862,0,0,1-.3-1.7A5.255,5.255,0,0,1,9.192,7.95c.015-.057.03-.109.045-.157a.729.729,0,0,0,.548-.648A4.276,4.276,0,0,0,9.564,5a.886.886,0,0,0-1-.664c-.33.082-.476.543-.365.929.016.079.033.164.051.252a1.264,1.264,0,0,0,.1-.446.389.389,0,0,1,.373-.4h.014a.386.386,0,0,1,.387.373s0,.012,0,.026a2.037,2.037,0,0,1-.712,1.5,3.271,3.271,0,0,1-.01.682,6.071,6.071,0,0,0-.352,2.049,5.829,5.829,0,0,0,.361,2.031.484.484,0,0,0,.907-.336Z"
                transform="translate(-1.341 -0.719)"
              />
              <path
                id="Path_22946"
                data-name="Path 22946"
                d="M8.721,5.152c0-.012,0-.02,0-.023a.31.31,0,0,0-.619.02h0v0a1.345,1.345,0,0,1-.218.684,1.386,1.386,0,0,1-.488.449,2.434,2.434,0,0,1-1.005.278.31.31,0,0,0,.026.618h.026A3.048,3.048,0,0,0,7.7,6.823a1.973,1.973,0,0,0,.879-.991,1.9,1.9,0,0,0,.141-.681Z"
                transform="translate(-1.018 -0.805)"
              />
              <path
                id="Path_22947"
                data-name="Path 22947"
                d="M6.652,10.153h.441V9.716H6.134v.359H5.693v.436h.959v-.359Zm-.441-.359h.8v.282h-.8V9.794Zm-.441.641v-.282h.8v.282Z"
                transform="translate(-0.949 -1.619)"
              />
              <path
                id="Path_22948"
                data-name="Path 22948"
                d="M9.562,1.08V.76H10V.324H9.044V.683H8.6v.437h.959V1.08ZM9.121.4h.8V.683h-.8V.4Zm.363.641h-.8V.76h.8Z"
                transform="translate(-1.434 -0.054)"
              />
            </g>
          </g>
        </g>
      </svg>
    );
  if (status.toLowerCase() === "canceled") return <CancelOrderIcon />;
}

export default OrderStatusIcon;
export const BagStatusIcon = ({ status }) => {
  const statuses = ["pending", "preparing", "shipped", "delivered"];
  let status_word = status.toLowerCase();
  if (status_word === "pending") return <PendingStatus />;
  if (status_word === "preparing") return <PreparingStatus />;
  if (status_word === "shipped") return <ShippedSatus />;
  if (status_word === "delivered") return <DeliveredStatus />;
  return <NormalStatus color={() => false} />;
};
