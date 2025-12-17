import React, { useState } from "react";
import { OrderDetail } from "types/orders";
import { RoundPrice, translateFunction } from "utils/functions";
import MiniReturnIcon from "public/svg/MiniReturnIcon";
import ClockIcon from "public/svg/ClockIcon";
import Timer from "components/Login/Timer";
import order from "services/order";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";

function OrderRetailsReturnInfo({
  product,
  return_request_id,
  callback,
  price,
}: {
  product: OrderDetail;
  return_request_id: number;
  callback: () => void;
  price: number | string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const { language, ActivePacks } = useAppStore();

  const CancelReturn = async () => {
    setLoading(true);
    await order.CancelReturn({ return_request_product_id: return_request_id });
    callback();
    setLoading(false);
  };

  const status = [
    {
      index: 1,
      label: "pending",
      title: "Product Return Has Been Requested",
      desc: "Product Return Request Approve",
    },
    {
      index: 2,
      label: "approved",
      title: "Product Return Request Approved",
      desc: "Product Collection Within 1 Day",
    },
    {
      index: 3,
      label: "out_for_return",
      title: "Out For Return",
      desc: "Out For Return",
    },
    {
      index: 4,
      label: "returned_to_location",
      title: "Product Has Been Returned Successfully",
      desc: `${price} ${translateFunction("Back To Your Wallet")}`,
    },
    {
      index: 5,
      label: "resolved",
      title: "Product Has Been Resolved Successfully",
    },
    { index: 6, label: "cancelled", title: "Return Request Canceled" },
    { index: 7, label: "rejected", title: "Return Request Rejected" },
  ];

  const isRtl = language === "ar" || language === "ku";

  const currentStatus = status.find(
    (s) =>
      s.label === product?.return_status?.value ||
      s.label?.toLowerCase() === product?.return_status?.value?.toLowerCase()
  );

  const isActive = (i: number) => {
    return i === currentStatus?.index;
  };

  // Special case for canceled or rejected
  if (
    currentStatus?.label === "cancelled" ||
    currentStatus?.label === "rejected" ||
    currentStatus?.label === "resolved"
  ) {
    return (
      <div className="w-full flex-col items-center h-auto mt-[12px]">
        <div className="flex-col w-full bg-[#FFFCF0] rounded-[10px] px-[10px] py-[8px]">
          <div className="flex-row items-start">
            <MiniReturnIcon className="text-[#D32F2F] [&>path]:fill-[#D32F2F]" />
            <div className="flex-col ml-[6px] w-full">
              <div className="text-[#D32F2F] text-[14px] medium ">
                {translateFunction(currentStatus.title)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-col items-center h-auto mt-[12px]">
      <div
        className={`flex-col w-full bg-[#FFFCF0] rounded-[10px] px-[10px] py-[8px] ${
          expanded ? "h-auto" : "h-[52px]"
        }`}
      >
        {status
          .filter((s) => s.index <= 4) // process flow statuses only
          .map((s, idx) => {
            const completed = s.index < (currentStatus?.index || 0);
            const active = isActive(s.index);
            const upcoming = s.index > (currentStatus?.index || 0);

            return (
              <div key={s.index} className="flex-row items-start mt-[7px]">
                <svg
                  className="mt-[3px]"
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                >
                  <g
                    id="Group_12947"
                    data-name="Group 12947"
                    transform="translate(0 0)"
                  >
                    <path
                      id="refund"
                      d="M15.437,5.256c-.215-.245-.417-.932-.834-.689-.33.325.247.675.362.982a.278.278,0,1,0,.472-.294Zm.718,1.829c-.146-.3-.162-1.008-.628-.882a.279.279,0,0,0-.148.365c.184.273.136.946.591.864a.278.278,0,0,0,.185-.347Zm.221,1.953c-.065-.322.1-1.018-.378-1.015a.278.278,0,0,0-.237.313c.108.312-.112.935.338.988a.278.278,0,0,0,.278-.287Zm-.291,1.944c.021-.33.363-.954-.1-1.078-.464,0-.3.648-.437.952a.278.278,0,0,0,.541.126Zm-1.028,1.95c.363-.056.412-.582.576-.852a.278.278,0,1,0-.514-.21C15.035,12.191,14.458,12.824,15.056,12.932Zm-1.383,1.01a.28.28,0,0,0,.2.469c.322-.063.488-.462.7-.684a.278.278,0,1,0-.443-.336,6.971,6.971,0,0,1-.464.551Zm-1.319,1.591a2.641,2.641,0,0,0,.785-.487.279.279,0,0,0,.049-.391c-.325-.33-.673.248-.981.363a.28.28,0,0,0,.147.515Zm-1.76.69c.29-.1,1.12-.206.961-.641-.229-.4-.713.064-1.041.1a.279.279,0,0,0,.081.545ZM1.376,8.9a7.746,7.746,0,0,0,7.779,7.5.278.278,0,0,0,0-.557A7.183,7.183,0,0,1,1.931,8.9,6.924,6.924,0,0,1,13.566,3.81h-1.1a.278.278,0,0,0,0,.557h1.761a.288.288,0,0,0,.278-.3V2.415a.278.278,0,1,0-.556,0v.993A7.479,7.479,0,0,0,1.376,8.9Z"
                      transform="translate(-1.376 -1.403)"
                      fill={
                        s.label === "returned_to_location"
                          ? "#FF7600"
                          : "#1d1d1d"
                      }
                    />
                    <g id="box" transform="translate(4.428 4.06)">
                      <path
                        id="Path_22816"
                        data-name="Path 22816"
                        d="M7.281,1.071H2.612a.738.738,0,0,0-.737.737V7.215a.738.738,0,0,0,.737.737H7.281a.738.738,0,0,0,.737-.737V1.809A.738.738,0,0,0,7.281,1.071Zm.491,6.143a.491.491,0,0,1-.491.491H2.612a.491.491,0,0,1-.491-.491V1.809a.491.491,0,0,1,.491-.491H3.841V3.194a.371.371,0,0,0,.533.33l.518-.259a.124.124,0,0,1,.108,0l.518.257a.368.368,0,0,0,.533-.329V1.317H7.281a.491.491,0,0,1,.491.491Z"
                        transform="translate(-1.875 -1.071)"
                        fill="#1d1d1d"
                      />
                      <path
                        id="Path_22817"
                        data-name="Path 22817"
                        d="M5.861,10.446H4.386a.37.37,0,0,0-.369.369v1.149a.369.369,0,0,0,.369.369H5.861a.369.369,0,0,0,.369-.369V10.815A.37.37,0,0,0,5.861,10.446ZM4.509,11.636a.122.122,0,0,1,.123-.123h.983a.123.123,0,1,1,0,.246H4.632A.123.123,0,0,1,4.509,11.636Zm1.106-.369H4.632a.123.123,0,1,1,0-.246h.983a.123.123,0,1,1,0,.246Z"
                        transform="translate(-3.035 -6.146)"
                        fill="#1d1d1d"
                      />
                      <path
                        id="Path_22818"
                        data-name="Path 22818"
                        d="M11.1,14.023H9.737a.123.123,0,1,0,0,.246H11.1a.123.123,0,1,0,0-.246Z"
                        transform="translate(-6.064 -8.082)"
                        fill="#1d1d1d"
                      />
                      <path
                        id="Path_22819"
                        data-name="Path 22819"
                        d="M11.552,12.77h-.983a.123.123,0,1,0,0,.246h.983a.123.123,0,1,0,0-.246Z"
                        transform="translate(-6.515 -7.404)"
                        fill="#1d1d1d"
                      />
                    </g>
                  </g>
                </svg>

                <div className="flex-col mx-[6px] w-full">
                  <div
                    className={`flex-row justify-between items-center ${
                      completed || active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                    } text-[12px] regular w-full`}
                  >
                    {translateFunction(s.title)}
                    <div
                      className={`flex-row justify-between items-center ${"text-[#C4C2C2]"} text-[12px] regular `}
                    >
                      {
                        <div className="regular text-[10px] flex-row gap-[4px] flex items-center">
                          3 H
                          <ClockIcon className="[&>g>path]:fill-[#C4C2C2]" />
                        </div>
                      }
                    </div>
                  </div>

                  {/* Only active status shows waiting for the next step */}
                  {s.desc && (
                    <div className="flex-row justify-between items-center text-[#1D1D1D] text-[10px] regular w-full">
                      <div
                        className={`${
                          isRtl && "dir-rtl"
                        } flex-row items-center gap-[4px]
                         ${active ? "text-[#1d1d1d]" : "text-[#C4C2C2]"}
                        `}
                      >
                        <span
                          className={`mr-[4px] ${
                            active ? "text-[#388CFF]" : "text-[#C4C2C2]"
                          } `}
                        >
                          {translateFunction("Waiting…")}
                        </span>
                        {translateFunction(s.desc)}
                      </div>
                      {
                        <div
                          className={`${
                            active ? "text-[#1d1d1d]" : "text-[#C4C2C2]"
                          } regular text-[10px] flex-row gap-[4px] flex items-center`}
                        >
                          {active ? (
                            <Timer onFinish={() => {}} minutes={60 * 3} />
                          ) : (
                            " 3 H"
                          )}
                          <ClockIcon className="[&>g>path]:fill-[#1D1D1D]" />
                        </div>
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Cancel return button */}
      {ActivePacks?.edit_return_request && (
        <p
          className="flex-row mt-[11px] items-center justify-center underline text-[##1D1D1D] text-[12px] regular cursor-pointer"
          onClick={() => {
            if (loading) return;
            CancelReturn();
          }}
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              {translateFunction("Cancel Return Request & Get")}
              <span className="bold mx-[4px]">
                {translateFunction("3 USD")}
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

export default OrderRetailsReturnInfo;
