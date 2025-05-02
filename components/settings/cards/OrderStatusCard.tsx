import React from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";

function OrderStatusCard({ status }: { status: string }) {
  const { settings } = useAppStore();
  return (
    <div className="bg-[#F4F4F4] ml-[8px] w-1/2 min-h-[74px] h-auto  rounded-[15px] py-[8px] px-[12px] flex-col">
      <div className="flex flex-row items-end">
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
              <g
                id="Group_4032"
                data-name="Group 4032"
                transform="translate(0 0)"
              >
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
        <svg
          className="ml-[4px]"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="15"
          height="15"
          viewBox="0 0 15 15"
        >
          <defs>
            <clipPath id="clip-path874">
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
            clipPath="url(#clip-path874)"
          >
            <g
              id="Group_4033"
              data-name="Group 4033"
              transform="translate(1.06 0)"
            >
              <g
                id="Group_4032"
                data-name="Group 4032"
                transform="translate(0 0)"
              >
                <path
                  id="Path_15859"
                  data-name="Path 15859"
                  d="M-2.127-1.536H6.607L8.258,7.572s-.826,1.267-1.3,1.267a92.073,92.073,0,0,1-9.649-.16c-.79-.1-1.065-1.106-1.065-1.106Z"
                  transform="translate(4.027 5.577)"
                  fill="#f8f8f8"
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
        <svg
          className="ml-[4px]"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="15"
          height="15"
          viewBox="0 0 15 15"
        >
          <defs>
            <clipPath id="clip-path8724">
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
            clipPath="url(#clip-path8724)"
          >
            <g
              id="Group_4033"
              data-name="Group 4033"
              transform="translate(1.06 0)"
            >
              <g
                id="Group_4032"
                data-name="Group 4032"
                transform="translate(0 0)"
              >
                <path
                  id="Path_15859"
                  data-name="Path 15859"
                  d="M-2.127-1.536H6.607L8.258,7.572s-.826,1.267-1.3,1.267a92.073,92.073,0,0,1-9.649-.16c-.79-.1-1.065-1.106-1.065-1.106Z"
                  transform="translate(4.027 5.577)"
                  fill="#f8f8f8"
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
      </div>
      <span className="text-[#8D8D8D] regular text-[10px] mt-[5px]">
        {translateFunction("Order Status")}
      </span>
      <div className="text-[#1D1D1D] flex-row text-[12px] regular mt-[3px]">
        <span>{status}</span>
        <svg
          className="ml-[11px]"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="15"
          height="15"
          viewBox="0 0 15 15"
        >
          <defs>
            <clipPath id="clip-path172">
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
            clipPath="url(#clip-path172)"
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
      </div>
    </div>
  );
}

export default OrderStatusCard;
