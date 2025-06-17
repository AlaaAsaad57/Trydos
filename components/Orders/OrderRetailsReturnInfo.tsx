import React, { useState } from "react";
import { OrderDetail } from "types/orders";
import { translateFunction } from "utils/functions";
import MiniReturnIcon from "public/svg/MiniReturnIcon.svg";
import ClockIcon from "public/svg/ClockIcon.svg";
import Timer from "components/Login/Timer";
import { useAppStore } from "store";

function OrderRetailsReturnInfo({ product }: { product: OrderDetail }) {
  const [expanded, setExpanded] = useState(false);
  const { selectedOrder, setOrderDetails, SelectedOrderItem } = useAppStore();
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
            <div className="flex-row justify-between items-center text-[#1D1D1D] text-[12px] regular w-full">
              {translateFunction("Product Return Has Been Requested")}
              <div className="text-[#C4C2C2] regular text-[10px] flex-row gap-[4px] flex items-center">
                <span>3H</span>
                <ClockIcon />
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
                  <Timer onFinish={() => {}} onResume={() => {}} minutes={3} />
                </span>
                <ClockIcon className="[&>path]:fill-[#1D1D1D]" />
              </div>
            </div>
          </div>
        </div>
        {expanded && (
          <>
            <div className="flex-row items-start mt-[7px]">
              <MiniReturnIcon className="[&>path]:fill-[#C4C2C2]" />
              <div className="flex-col ml-[6px] w-full">
                <div className="flex-row justify-between items-center text-[#C4C2C2] text-[12px] regular w-full">
                  {translateFunction("Product Return Request Approved")}
                  <div className="text-[#C4C2C2] regular text-[10px] flex-row gap-[4px] flex items-center">
                    <span>3H</span>
                    <ClockIcon />
                  </div>
                </div>
                <div className="flex-row justify-between items-center text-[#C4C2C2] text-[10px] regular w-full">
                  <div className="flex-row items-center gap-[4px]">
                    <span className="mr-[4px] text-[#C4C2C2] ">
                      {translateFunction("Waiting…")}
                    </span>
                    {translateFunction("Product Collection Within 1 Day")}
                  </div>
                  <div className="text-[#C4C2C2] regular text-[10px] flex-row gap-[4px] flex items-center">
                    <span>
                      <Timer
                        onFinish={() => {}}
                        onResume={() => {}}
                        minutes={3}
                      />
                    </span>
                    <ClockIcon className="[&>path]:fill-[#C4C2C2]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-row items-start mt-[7px]">
              <MiniReturnIcon className="[&>path]:fill-[#C4C2C2]" />
              <div className="flex-col ml-[6px] w-full">
                <div className="flex-row justify-between items-center text-[#C4C2C2] text-[12px] regular w-full">
                  {translateFunction("Collected")}
                  <div className="text-[#C4C2C2] regular text-[10px] flex-row gap-[4px] flex items-center">
                    <span>3H</span>
                    <ClockIcon />
                  </div>
                </div>
                <div className="flex-row justify-between items-center text-[#C4C2C2] text-[10px] regular w-full">
                  <div className="flex-row items-center gap-[4px]">
                    <span className="mr-[4px] text-[#C4C2C2] ">
                      {translateFunction("Waiting…")}
                    </span>
                    {translateFunction("Back Your Money 140 usd")}
                  </div>
                  <div className="text-[#C4C2C2] regular text-[10px] flex-row gap-[4px] flex items-center">
                    <span>
                      <Timer
                        onFinish={() => {}}
                        onResume={() => {}}
                        minutes={3}
                      />
                    </span>
                    <ClockIcon className="[&>path]:fill-[#C4C2C2]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-row items-start mt-[7px]">
              <MiniReturnIcon className="[&>path]:fill-[#C4C2C2]" />
              <div className="flex-col ml-[6px] w-full">
                <div className="flex-row justify-between items-center text-[#C4C2C2] text-[12px] regular w-full">
                  {translateFunction("Product Has Been Returned Successfully")}
                  <div className="text-[#C4C2C2] regular text-[10px] flex-row gap-[4px] flex items-center">
                    <span>3H</span>
                    <ClockIcon />
                  </div>
                </div>
                <div className="flex-row justify-between items-center text-[#C4C2C2] text-[10px] regular w-full">
                  <div className="flex-row items-center gap-[4px]">
                    {/* <span className="mr-[4px] text-[#C4C2C2] ">
                    {translateFunction("Waiting…")}
                  </span> */}
                    {translateFunction("Back To Your Wallet 140 usd")}
                  </div>
                  <div className="text-[#C4C2C2] regular text-[10px] flex-row gap-[4px] flex items-center">
                    <span>
                      <Timer
                        onFinish={() => {}}
                        onResume={() => {}}
                        minutes={3}
                      />
                    </span>
                    <ClockIcon className="[&>path]:fill-[#C4C2C2]" />
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
          setExpanded(false);
          let order_details_arry = [];
          selectedOrder.details.map((order_detail) => {
            let details_arry = { ...order_detail, details: [] };
            order_detail.details.map((s) => {
              if (s.id === SelectedOrderItem.id) {
                details_arry.details.push({ ...s, is_returned: true });
              } else {
                details_arry.details.push(s);
              }
            });
            order_details_arry.push(details_arry);
          });
          setOrderDetails({ ...selectedOrder, details: order_details_arry });
        }}
      >
        {translateFunction("Cancel Return Request & Get")}
        <span className="bold mx-[4px]">{translateFunction("3 USD")}</span>
      </p>
    </div>
  );
}

export default OrderRetailsReturnInfo;
