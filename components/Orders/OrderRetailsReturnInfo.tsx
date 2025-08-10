import React, { useState } from "react";
import { OrderDetail } from "types/orders";
import { translateFunction } from "utils/functions";
import MiniReturnIcon from "public/svg/MiniReturnIcon.svg";
import ClockIcon from "public/svg/ClockIcon.svg";
import Timer from "components/Login/Timer";
import { useAppStore } from "store";
import order from "services/order";
import Spinner from "components/global/Spinner";

function OrderRetailsReturnInfo({
  product,
  return_request_id,
  callback,
}: {
  product: OrderDetail;
  return_request_id: number;
  callback: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currency } = useAppStore();
  const CancelReturn = async () => {
    setLoading(true);
    await order.CancelReturn({ return_request_product_id: return_request_id });
    callback();
    setLoading(false);
  };
  let status = [
    { index: 1, label: "draft return request" },
    { index: 2, label: "pending" },
    { index: 3, label: "approved " },
    { index: 4, label: "returned" },
    { index: 4, label: "resolved" },
  ];
  const shouldShowStatus = (i) => {
    let currentStatus = status.find(
      (s) => s.label?.toLowerCase() === product.return_status?.toLowerCase()
    );

    return i <= currentStatus.index;
  };
  const activeTimer = (i) => {
    let currentStatus = status.find(
      (s) => s.label?.toLowerCase() === product.return_status?.toLowerCase()
    );

    return i === currentStatus.index;
  };
  const showFirstLevelStatus = () => {
    if (product.return_status !== "draft return request") {
      return (
        <>
          <div className="flex-row justify-between items-center text-[#1D1D1D] text-[12px] regular w-full">
            {translateFunction("Product Return Has Been Requested")}
            <div className="text-[#1d1d1d] regular text-[10px] flex-row gap-[4px] flex items-center">
              <span>3H</span>
              <ClockIcon className="[&>g>path]:fill-[#1D1D1D]" />
            </div>
          </div>
          <div className="flex-row justify-between items-center text-[#1D1D1D] text-[10px] regular w-full">
            <div className="flex-row items-center gap-[4px]">
              <span className="mr-[4px] text-[#388CFF] ">
                {translateFunction("Waiting…")}
              </span>
              {translateFunction("Product Return Request Approve")}
            </div>
            <div className="text-[#1D1D1D] regular text-[10px] flex-row gap-[4px] flex items-center">
              <span>
                {activeTimer(1) || activeTimer(2) ? (
                  <Timer onFinish={() => {}} minutes={60 * 3} />
                ) : (
                  "03:00:00"
                )}
              </span>
              <ClockIcon className="[&>g>path]:fill-[#1D1D1D]" />
            </div>
          </div>
        </>
      );
    } else if (product.return_status === "draft return request") {
      return (
        <>
          <div className="flex-row justify-between items-center text-[#1D1D1D] text-[12px] regular w-full">
            {translateFunction("Product Return Needs Confirm")}
          </div>
          <div className="flex-row justify-between items-center text-[#1D1D1D] text-[10px] regular w-full">
            <div className="flex-row items-center gap-[4px]">
              <span className="mr-[4px] text-[#388CFF] ">
                {translateFunction("Waiting…")}
              </span>
              {translateFunction("You Need To Confirm Your Request")}
            </div>
          </div>
        </>
      );
    }
  };
  return (
    <div className="w-full flex-col items-center h-auto mt-[12px]">
      <div
        onClick={() => setExpanded(!expanded)}
        className={`flex-col w-full bg-[#FFFCF0] rounded-[10px] px-[10px] py-[8px]  ${
          expanded ? "h-auto" : "h-[52px]"
        }`}
      >
        <div className="flex-row items-start">
          <MiniReturnIcon />
          <div className="flex-col ml-[6px] w-full">
            {showFirstLevelStatus()}
          </div>
        </div>
        {expanded && (
          <>
            <div className="flex-row items-start mt-[7px]">
              <MiniReturnIcon
                className={`${
                  shouldShowStatus(3)
                    ? "[&>g>path]:fill-[#1D1D1D]"
                    : "[&>g>path]:fill-[#C4C2C2]"
                }`}
              />
              <div className="flex-col ml-[6px] w-full">
                <div
                  className={`flex-row justify-between items-center ${
                    shouldShowStatus(3) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                  }  text-[12px] regular w-full`}
                >
                  {translateFunction("Product Return Request Approved")}
                  <div className="regular text-[10px] flex-row gap-[4px] flex items-center">
                    <span>3H</span>
                    <ClockIcon
                      className={`${
                        shouldShowStatus(3)
                          ? "[&>g>path]:fill-[#1D1D1D]"
                          : "[&>g>path]:fill-[#C4C2C2]"
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`flex-row justify-between items-center ${
                    shouldShowStatus(3) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                  } text-[10px] regular w-full`}
                >
                  <div className="flex-row items-center gap-[4px]">
                    {!shouldShowStatus(3) && (
                      <span className={"mr-[4px] text-[#C4C2C2] "}>
                        {translateFunction("Waiting…")}
                      </span>
                    )}
                    {translateFunction("Product Collection Within 1 Day")}
                  </div>
                  <div
                    className={`${
                      shouldShowStatus(3) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                    } regular text-[10px] flex-row gap-[4px] flex items-center`}
                  >
                    <span>
                      {activeTimer(3) ? (
                        <Timer onFinish={() => {}} minutes={60 * 3} />
                      ) : (
                        `03:00:00`
                      )}
                    </span>
                    <ClockIcon
                      className={`${
                        shouldShowStatus(3)
                          ? "[&>g>path]:fill-[#1D1D1D]"
                          : "[&>g>path]:fill-[#C4C2C2]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="flex-row items-start mt-[7px]">
              <MiniReturnIcon
                className={`${
                  shouldShowStatus(4)
                    ? "[&>path]:fill-[#1D1D1D]"
                    : "[&>path]:fill-[#C4C2C2]"
                }`}
              />
              <div className="flex-col ml-[6px] w-full">
                <div
                  className={`flex-row justify-between items-center ${
                    shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                  } text-[12px] regular w-full`}
                >
                  {translateFunction("Collected")}
                  <div
                    className={`${
                      shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                    } regular text-[10px] flex-row gap-[4px] flex items-center`}
                  >
                    <span>3H</span>
                    <ClockIcon />
                  </div>
                </div>
                <div
                  className={`flex-row justify-between items-center ${
                    shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                  } text-[10px] regular w-full`}
                >
                  <div className="flex-row items-center gap-[4px]">
                    {!shouldShowStatus(4) && (
                      <span className="mr-[4px] text-[#C4C2C2] ">
                        {translateFunction("Waiting…")}
                      </span>
                    )}
                    {translateFunction("Back Your Money")} {currency?.symbol}
                  </div>
                  <div
                    className={`${
                      shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                    } regular text-[10px] flex-row gap-[4px] flex items-center`}
                  >
                    <span>
                      <Timer onFinish={() => {}} minutes={3} />
                    </span>
                    <ClockIcon
                      className={`${
                        shouldShowStatus(4)
                          ? "[&>path]:fill-[#1D1D1D]"
                          : "[&>path]:fill-[#C4C2C2]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div> */}
            <div className="flex-row items-start mt-[7px]">
              <MiniReturnIcon
                className={`${
                  shouldShowStatus(4)
                    ? "[&>g>path]:fill-[#1D1D1D]"
                    : "[&>g>path]:fill-[#C4C2C2]"
                }`}
              />
              <div className="flex-col ml-[6px] w-full">
                <div
                  className={`flex-row justify-between items-center ${
                    shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                  } text-[12px] regular w-full`}
                >
                  {translateFunction("Product Has Been Returned Successfully")}
                  <div
                    className={`${
                      shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                    } regular text-[10px] flex-row gap-[4px] flex items-center`}
                  >
                    <span>3H</span>
                    <ClockIcon
                      className={`${
                        shouldShowStatus(4)
                          ? "[&>g>path]:fill-[#1D1D1D]"
                          : "[&>g>path]:fill-[#C4C2C2]"
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`flex-row justify-between items-center ${
                    shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                  } text-[10px] regular w-full`}
                >
                  <div className="flex-row items-center gap-[4px]">
                    {!shouldShowStatus(4) && (
                      <span className="mr-[4px] text-[#C4C2C2] ">
                        {translateFunction("Waiting…")}
                      </span>
                    )}
                    {translateFunction("Back To Your Wallet 140 usd")}
                  </div>
                  <div
                    className={`${
                      shouldShowStatus(4) ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                    } regular text-[10px] flex-row gap-[4px] flex items-center`}
                  >
                    <span>
                      {activeTimer(4) ? (
                        <Timer onFinish={() => {}} minutes={60 * 3} />
                      ) : (
                        `03:00:00`
                      )}
                    </span>
                    <ClockIcon
                      className={`${
                        shouldShowStatus(4)
                          ? "[&>g>path]:fill-[#1D1D1D]"
                          : "[&>g>path]:fill-[#C4C2C2]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
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
            <span className="bold mx-[4px]">{translateFunction("3 USD")}</span>
          </>
        )}
      </p>
    </div>
  );
}

export default OrderRetailsReturnInfo;
