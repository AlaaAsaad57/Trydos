import React from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import OrderStatusCartsIcon from "./OrderStatusCartsIcon";
import OrderStatusIcon from "./OrderStatusIcon";
import { OrderStatusCardPropsType } from "models/componentType/OrderStatusCardPropsType";
import { useParams } from "node_modules/next/navigation";

function OrderStatusCard({ status, fullWidth }: OrderStatusCardPropsType) {
  const { settings } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className={`bg-[#F4F4F4] ml-[8px] ${
        fullWidth ? "w-full" : "w-1/2"
      } min-h-[74px] h-auto  rounded-[15px] py-[8px] px-[12px] flex-col`}
    >
      <div className={`flex flex-row items-end ${ isRtl ? "flex-row-reverse" : ""}`}>
        <OrderStatusCartsIcon status={status?.value} isRtl={isRtl}/>
      </div>
      <span className={`text-[#8D8D8D] regular text-[10px] mt-[5px] ${ isRtl ? " text-right ": " "}`}>
        {translateFunction("Order Status")}
      </span>
      <div className={`text-[#1D1D1D] flex-row text-[12px] regular mt-[3px] ${ isRtl ? " text-right flex-row-reverse": " "}`}>
        <span className={`capitalize ${ isRtl ? " text-right ": " "}`}>{status?.label}</span>
        <span className="ml-[11px]">
          <OrderStatusIcon status={status?.value} isRtl={isRtl}/>
        </span>
      </div>
    </div>
  );
}

export default OrderStatusCard;
