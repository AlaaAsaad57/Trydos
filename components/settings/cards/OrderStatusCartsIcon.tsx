import React from "react";

function OrderStatusCartsIcon({ status }) {
  const statuses = [
    "pending",
    "preparing",
    "shipping_center",
    "ready_to_shipping",
    "shipped",
    "out_for_delivery",
    "in_delivery_center",
    "delivered",
  ];
  let status_word = status?.toLowerCase();

  return (
    <>
      {status_word === "pending" ? (
        <PendingStatus />
      ) : (
        <NormalStatus
          color={() => {
            let i = statuses.findIndex((s) => s === status_word);
            if (i > 0) return "#FFF5AA";
            else return false;
          }}
        />
      )}
      {status_word === "preparing" ||
      status_word === "shipping_center" ||
      status_word === "ready_to_shipping" ? (
        <PreparingStatus />
      ) : (
        <NormalStatus
          color={() => {
            let i = statuses.findIndex((s) => s === status_word);
            if (i > 1 || i > 2 || i > 3) return "#FFDBAA";
            else return false;
          }}
        />
      )}
      {status_word === "shipped" ||
      status_word === "out_for_delivery" ||
      status_word === "in_delivery_center" ? (
        <ShippedSatus />
      ) : (
        <NormalStatus
          color={() => {
            let i = statuses.findIndex((s) => s === status_word);
            if (i > 4 || i > 5) return "#AADEFF";
            else return false;
          }}
        />
      )}
      {status_word === "delivered" ? (
        <DeliveredStatus />
      ) : (
        <NormalStatus
          color={() => {
            let i = statuses.findIndex((s) => s === status_word);
            if (i === 7) return "#6FE86A";
            else return false;
          }}
        />
      )}
    </>
  );
}

export default OrderStatusCartsIcon;
export const PendingStatus = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <defs>
        <clipPath id="clip-path90">
          <rect
            id="Rectangle_6298"
            data-name="Rectangle 6298"
            width="20"
            height="20"
            transform="translate(0 0.193)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_790"
        data-name="Mask Group 790"
        transform="translate(0 -0.193)"
        clipPath="url(#clip-path90)"
      >
        <g
          id="Group_4033"
          data-name="Group 4033"
          transform="translate(1.461 0.038)"
        >
          <g id="Group_4032" data-name="Group 4032" transform="translate(0 0)">
            <path
              id="Path_15859"
              data-name="Path 15859"
              d="M-1.51-1.536H10.532l2.276,12.557s-1.139,1.747-1.794,1.747a126.942,126.942,0,0,1-13.3-.22c-1.09-.134-1.469-1.525-1.469-1.525Z"
              transform="translate(4.129 7.108)"
              fill="#fff5aa"
            />
            <g id="bag-5">
              <g id="Group_2946" data-name="Group 2946">
                <path
                  id="Path_15168"
                  data-name="Path 15168"
                  d="M52.419,42.447H64.813a2.419,2.419,0,0,0,2.419-2.419.256.256,0,0,0,0-.046L65.216,28.619a1.334,1.334,0,0,0-1.325-1.13H62.443V26.117a3.826,3.826,0,0,0-7.652,0v1.375H53.342a1.334,1.334,0,0,0-1.326,1.127L50,39.981a.261.261,0,0,0,0,.046A2.419,2.419,0,0,0,52.419,42.447Zm2.9-16.33a3.3,3.3,0,0,1,6.6,0v1.375H55.319Zm-2.783,2.6h0a.806.806,0,0,1,.806-.688h1.45v2.088a.269.269,0,1,0,.527,0V28.019h6.6v2.087a.269.269,0,1,0,.528,0V28.019h1.45a.806.806,0,0,1,.806.688h0l2.007,11.338a1.893,1.893,0,0,1-1.891,1.876h-12.4a1.893,1.893,0,0,1-1.892-1.869Z"
                  transform="translate(-49.999 -22.291)"
                  fill="#3c3c3c"
                />
              </g>
            </g>
          </g>
          <path
            id="Path_15172"
            data-name="Path 15172"
            d="M0,0A7.906,7.906,0,0,0,4.378,1.8,9.484,9.484,0,0,0,9.065,0"
            transform="translate(4.086 13.169)"
            fill="none"
            stroke="#1d1d1d"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      </g>
    </svg>
  );
};
export const PreparingStatus = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <defs>
        <clipPath id="clip-path69">
          <rect
            id="Rectangle_6181"
            data-name="Rectangle 6181"
            width="20"
            height="20"
            transform="translate(0 0)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_703"
        data-name="Mask Group 703"
        transform="translate(0 0)"
        clipPath="url(#clip-path69)"
      >
        <g
          id="Group_4033"
          data-name="Group 4033"
          transform="translate(1.45 0.001)"
        >
          <g id="Group_4032" data-name="Group 4032" transform="translate(0 0)">
            <path
              id="Path_15859"
              data-name="Path 15859"
              d="M-1.528-1.536H10.422l2.259,12.46s-1.131,1.733-1.78,1.733a125.962,125.962,0,0,1-13.2-.219c-1.081-.133-1.457-1.513-1.457-1.513Z"
              transform="translate(4.126 7.065)"
              fill="#ffdbaa"
            />
            <g id="bag-5">
              <g id="Group_2946" data-name="Group 2946">
                <path
                  id="Path_15168"
                  data-name="Path 15168"
                  d="M52.4,42.291H64.7a2.4,2.4,0,0,0,2.4-2.4.254.254,0,0,0,0-.045l-2-11.276a1.324,1.324,0,0,0-1.315-1.121H62.347V26.087a3.8,3.8,0,0,0-7.593,0v1.364H53.316A1.324,1.324,0,0,0,52,28.57L50,39.844a.259.259,0,0,0,0,.045A2.4,2.4,0,0,0,52.4,42.291Zm2.876-16.2a3.273,3.273,0,1,1,6.545,0v1.364H55.278Zm-2.761,2.576h0a.8.8,0,0,1,.8-.683h1.439v2.072a.267.267,0,1,0,.523,0V27.975h6.545v2.071a.267.267,0,1,0,.524,0V27.975h1.439a.8.8,0,0,1,.8.683h0l1.992,11.251A1.879,1.879,0,0,1,64.7,41.77H52.4a1.879,1.879,0,0,1-1.877-1.855Z"
                  transform="translate(-49.999 -22.291)"
                  fill="#3c3c3c"
                />
              </g>
            </g>
          </g>
          <path
            id="Path_15172"
            data-name="Path 15172"
            d="M0,0A7.845,7.845,0,0,0,4.344,1.789,9.411,9.411,0,0,0,8.995,0"
            transform="translate(4.054 13.067)"
            fill="none"
            stroke="#1d1d1d"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      </g>
    </svg>
  );
};
export const DeliveredStatus = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <defs>
        <clipPath id="clip-path797">
          <rect
            id="Rectangle_6272"
            data-name="Rectangle 6272"
            width="20"
            height="20"
            transform="translate(-0.041 -0.422)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_771"
        data-name="Mask Group 771"
        transform="translate(0.041 0.422)"
        clipPath="url(#clip-path797)"
      >
        <g
          id="Group_4033"
          data-name="Group 4033"
          transform="translate(1.41 0.127)"
        >
          <g id="Group_4032" data-name="Group 4032" transform="translate(0 0)">
            <path
              id="Path_15859"
              data-name="Path 15859"
              d="M-1.589-1.536H10.033l2.2,12.119s-1.1,1.686-1.731,1.686A122.512,122.512,0,0,1-2.34,12.056c-1.052-.13-1.417-1.472-1.417-1.472Z"
              transform="translate(4.116 6.913)"
              fill="#6fe86a"
            />
            <g id="bag-5">
              <g id="Group_2946" data-name="Group 2946">
                <path
                  id="Path_15168"
                  data-name="Path 15168"
                  d="M52.334,41.743H64.3a2.334,2.334,0,0,0,2.334-2.334.247.247,0,0,0,0-.044L64.685,28.4a1.288,1.288,0,0,0-1.279-1.091h-1.4V25.983a3.693,3.693,0,1,0-7.385,0V27.31h-1.4a1.288,1.288,0,0,0-1.28,1.088L50,39.364a.252.252,0,0,0,0,.044A2.334,2.334,0,0,0,52.334,41.743Zm2.8-15.76a3.183,3.183,0,0,1,6.366,0V27.31H55.133Zm-2.686,2.505h0a.778.778,0,0,1,.778-.664h1.4V29.84a.259.259,0,1,0,.508,0v-2.02H61.5v2.014a.259.259,0,1,0,.51,0V27.819h1.4a.778.778,0,0,1,.778.664h0l1.937,10.942a1.827,1.827,0,0,1-1.825,1.81H52.334a1.827,1.827,0,0,1-1.826-1.8Z"
                  transform="translate(-49.999 -22.291)"
                  fill="#1d1d1d"
                />
              </g>
            </g>
          </g>
          <path
            id="Path_15172"
            data-name="Path 15172"
            d="M0,0A7.63,7.63,0,0,0,4.225,1.74,9.153,9.153,0,0,0,8.748,0"
            transform="translate(3.943 12.709)"
            fill="none"
            stroke="#1d1d1d"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      </g>
    </svg>
  );
};
export const ShippedSatus = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <defs>
        <clipPath id="clip-path767">
          <rect
            id="Rectangle_6268"
            data-name="Rectangle 6268"
            width="20"
            height="20"
            transform="translate(0.004 -0.377)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_765"
        data-name="Mask Group 765"
        transform="translate(-0.004 0.377)"
        clipPath="url(#clip-path767)"
      >
        <g
          id="Group_4033"
          data-name="Group 4033"
          transform="translate(1.413 0.128)"
        >
          <g id="Group_4032" data-name="Group 4032" transform="translate(0 0)">
            <path
              id="Path_15859"
              data-name="Path 15859"
              d="M-1.584-1.536H10.064l2.2,12.146s-1.1,1.69-1.735,1.69a122.788,122.788,0,0,1-12.867-.213c-1.054-.13-1.421-1.475-1.421-1.475Z"
              transform="translate(4.117 6.925)"
              fill="#aadeff"
            />
            <g id="bag-5">
              <g id="Group_2946" data-name="Group 2946">
                <path
                  id="Path_15168"
                  data-name="Path 15168"
                  d="M52.34,41.787H64.328a2.34,2.34,0,0,0,2.34-2.34.249.249,0,0,0,0-.044l-1.95-10.992a1.291,1.291,0,0,0-1.282-1.093h-1.4V25.991a3.7,3.7,0,1,0-7.4,0v1.33h-1.4a1.291,1.291,0,0,0-1.283,1.09L50,39.4a.252.252,0,0,0,0,.044A2.34,2.34,0,0,0,52.34,41.787Zm2.8-15.8a3.19,3.19,0,0,1,6.38,0v1.33H55.145ZM52.452,28.5h0a.78.78,0,0,1,.78-.665h1.4v2.02a.26.26,0,1,0,.509,0V27.832h6.38V29.85a.26.26,0,1,0,.511,0V27.832h1.4a.78.78,0,0,1,.78.665h0l1.942,10.967a1.831,1.831,0,0,1-1.829,1.814H52.34a1.831,1.831,0,0,1-1.83-1.808Z"
                  transform="translate(-49.999 -22.291)"
                  fill="#3c3c3c"
                />
              </g>
            </g>
          </g>
          <path
            id="Path_15172"
            data-name="Path 15172"
            d="M0,0A7.648,7.648,0,0,0,4.235,1.744,9.173,9.173,0,0,0,8.768,0"
            transform="translate(3.952 12.738)"
            fill="none"
            stroke="#3c3c3c"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      </g>
    </svg>
  );
};
export const NormalStatus = ({ color }) => {
  let i = parseInt((Math.random() * 1000).toString());
  return (
    <svg
      className="ml-[4px]"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="15"
      height="15"
      viewBox="0 0 15 15"
    >
      <defs>
        <clipPath id={`clipPath${i}`}>
          <rect
            id="Rectangle_6184"
            data-name="Rectangle 6184"
            width="15"
            height="15"
            transform="translate(0 -0.381)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Mask_Group_706"
        data-name="Mask Group 706"
        transform="translate(0 0.381)"
        clipPath={`url(#clipPath${i})`}
      >
        <g id="Group_4033" data-name="Group 4033" transform="translate(1.06 0)">
          <g id="Group_4032" data-name="Group 4032" transform="translate(0 0)">
            <path
              id="Path_15859"
              data-name="Path 15859"
              d="M-2.127-1.536H6.607L8.258,7.572s-.826,1.267-1.3,1.267a92.073,92.073,0,0,1-9.649-.16c-.79-.1-1.065-1.106-1.065-1.106Z"
              transform="translate(4.027 5.577)"
              fill={color() || "#f8f8f8"}
            />
            <g id="bag-5">
              <g id="Group_2946" data-name="Group 2946">
                <path
                  id="Path_15168"
                  data-name="Path 15168"
                  d="M51.754,36.91h8.99A1.754,1.754,0,0,0,62.5,35.156a.186.186,0,0,0,0-.033L61.036,26.88a.968.968,0,0,0-.961-.82H59.025v-1a2.775,2.775,0,0,0-5.55,0v1H52.424a.968.968,0,0,0-.962.818L50,35.122a.19.19,0,0,0,0,.033A1.754,1.754,0,0,0,51.754,36.91Zm2.1-11.844a2.392,2.392,0,0,1,4.784,0v1H53.857Zm-2.018,1.883h0a.585.585,0,0,1,.585-.5h1.052v1.515a.195.195,0,1,0,.382,0V26.446h4.784v1.514a.195.195,0,1,0,.383,0V26.446h1.052a.585.585,0,0,1,.585.5h0l1.456,8.224a1.373,1.373,0,0,1-1.371,1.361H51.754a1.373,1.373,0,0,1-1.372-1.356Z"
                  transform="translate(-49.999 -22.291)"
                  fill="#8d8d8d"
                />
              </g>
            </g>
          </g>
          <path
            id="Path_15172"
            data-name="Path 15172"
            d="M0,0A5.735,5.735,0,0,0,3.175,1.308,6.879,6.879,0,0,0,6.575,0"
            transform="translate(2.964 9.552)"
            fill="none"
            stroke="#8d8d8d"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      </g>
    </svg>
  );
};
