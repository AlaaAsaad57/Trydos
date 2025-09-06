import React, { useState } from "react";
import { OrderDetail } from "types/orders";
import { RoundPrice, translateFunction } from "utils/functions";
import MiniReturnIcon from "public/svg/MiniReturnIcon.svg";
import ClockIcon from "public/svg/ClockIcon.svg";
import Timer from "components/Login/Timer";
import order from "services/order";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";

function OrderRetailsReturnInfo({
  product,
  return_request_id,
  callback,
}: {
  product: OrderDetail;
  return_request_id: number;
  callback: () => void;
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
      label: null,
      title: "Product Return Needs Confirm",
      desc: "You Need To Confirm Your Request",
    },
    {
      index: 2,
      label: "pending",
      title: "Product Return Has Been Requested",
      desc: "Product Return Request Approve",
    },
    {
      index: 3,
      label: "approved",
      title: "Product Return Request Approved",
      desc: "Product Collection Within 1 Day",
    },
    {
      index: 4,
      label: "out_for_return",
      title: "Out For Return",
      desc: "Out For Return",
    },
    {
      index: 5,
      label: "returned_to_location",
      title: "Product Has Been Returned Successfully",
    },
    {
      index: 6,
      label: "resolved",
      title: "Product Has Been Resolved Successfully",
      desc: "",
    },
    { index: 7, label: "canceled", title: "Return Request Canceled" },
    { index: 8, label: "rejected", title: "Return Request Rejected" },
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
    currentStatus?.label === "canceled" ||
    currentStatus?.label === "rejected" ||
    currentStatus?.label === "resolved"
  ) {
    return (
      <div className="w-full flex-col items-center h-auto mt-[12px]">
        <div className="flex-col w-full bg-[#FFFCF0] rounded-[10px] px-[10px] py-[8px]">
          <div className="flex-row items-start">
            <MiniReturnIcon />
            <div className="flex-col ml-[6px] w-full">
              <div className="text-[#D32F2F] text-[14px] bold">
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
          .filter((s) => s.index <= 5) // process flow statuses only
          .map((s, idx) => {
            const completed = s.index < (currentStatus?.index || 0);
            const active = isActive(s.index);
            const upcoming = s.index > (currentStatus?.index || 0);

            return (
              <div key={s.index} className="flex-row items-start mt-[7px]">
                <MiniReturnIcon
                  className={
                    completed || active
                      ? "[&>g>path]:fill-[#1D1D1D]"
                      : "[&>g>path]:fill-[#C4C2C2]"
                  }
                />
                <div className="flex-col ml-[6px] w-full">
                  <div
                    className={`flex-row justify-between items-center ${
                      completed || active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
                    } text-[12px] regular w-full`}
                  >
                    {translateFunction(s.title)}
                    {active && s.desc && (
                      <div className="regular text-[10px] flex-row gap-[4px] flex items-center">
                        <Timer onFinish={() => {}} minutes={60 * 3} />
                        <ClockIcon className="[&>g>path]:fill-[#1D1D1D]" />
                      </div>
                    )}
                  </div>

                  {/* Only active status shows waiting for the next step */}
                  {active && s.desc && (
                    <div className="flex-row justify-between items-center text-[#1D1D1D] text-[10px] regular w-full">
                      <div
                        className={`${
                          isRtl && "dir-rtl"
                        } flex-row items-center gap-[4px]`}
                      >
                        <span className="mr-[4px] text-[#388CFF] ">
                          {translateFunction("Waiting…")}
                        </span>
                        {translateFunction(s.desc)}
                      </div>
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
