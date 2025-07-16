import React, { useState } from "react";
import { getConfiguredImage, translateFunction } from "utils/functions";
import Image from "next/image";
import ChangeOrderItemIcon from "public/svg/ChangeOrderItemIcon.svg";
import ReturnOrderItemIcon from "public/svg/ReturnOrderItemIcon.svg";
import ReportOrderItemIcon from "public/svg/ReportOrderItemIcon.svg";
import HideOrderItemIcon from "public/svg/HideOrderItemIcon.svg";
import ReturnOrderItem from "./ReturnOrderItem";
import { useAppStore } from "store";
import CancelOrderIcon from "public/svg/OrderCancelIcon.svg";
import CancelOrderItem from "./CancelOrderItem";
import ChangeOrderItem from "./ChangeOrderItem";
import { GetImageUrl } from "utils/tinyUtils";
import { OrderItemOptionsModalPropsType } from "models/componentType/OrderItemOptionsModalPropsType";

function OrderItemOptionsModal({
  close,
  item,
  setShouldConfirmReturn,
  setShouldConfirmCancel,
  setShouldConfirmChange,
  shouldConfirmChange,
  cancelOrderItem,
}: OrderItemOptionsModalPropsType) {
  const [activeWidget, setActiveWidget] = useState<
    "return" | "report" | "hide" | "main" | "cancel" | "ChangeRequest"
  >("main");
  const { selectedOrder, ActivePacks } = useAppStore();
  const GoToChangeOrderItem = () => {
    setActiveWidget("ChangeRequest");
  };
  const RenderWidget = () => {
    if (activeWidget === "main") {
      return (
        <>
          <div className="flex-col w-full items-center  border-[#E6E6E680] border-b-[1px] pb-[12px] px-[24px]">
            <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
            <div className="w-[104px] h-[144px] mt-[20px] relative">
              <span
                className="absolute top-0 left-0 z-10 w-full h-[144px] rounded-[15px]"
                style={{
                  boxShadow: "inset 0px 3px 6px #ffffff80",
                }}
              ></span>
              <Image
                className="rounded-[15px] h-[144px] object-cover"
                style={{
                  border: "1px solid #ffffff80",
                }}
                src={getConfiguredImage({
                  src: GetImageUrl(item.image),
                  width: 104,
                  height: 144,
                  q: 100,
                })}
                width={104}
                height={144}
                alt={item.name}
              />
            </div>
            <span className="regular text-[12px] mt-[11px] text-[#8D8D8D]">
              {translateFunction("Action About This Product")}
            </span>
          </div>
          <div className="flex-col w-full items-center pb-[12px] px-[24px] mt-[20px]">
            {selectedOrder && (
              <div
                onClick={GoToChangeOrderItem}
                className="cursor-pointer flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] h-[60px]"
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <ChangeOrderItemIcon className="absolute top-0 left-0 right-0 mx-auto my-0" />
                  <Image
                    alt={item.name}
                    width={15}
                    height={15}
                    className="rounded-full h-[15px] w-[15px] object-cover"
                    src={getConfiguredImage({
                      src: item.image,
                      width: 15,
                      height: 15,
                      q: 100,
                    })}
                  />
                </div>
                <div className="flex-col ml-[15px]">
                  <span className="regular text-[14px] text-[#1D1D1D] medium">
                    {translateFunction("Change Product Request")}
                  </span>
                  <span className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction("Change Size, Color, Other")}
                  </span>
                </div>
              </div>
            )}
            {ActivePacks.can_cancele_order && (
              <div
                onClick={() => {
                  setActiveWidget("cancel");
                }}
                className="cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px]"
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <CancelOrderIcon />
                </div>
                <div className="flex-col ml-[15px]">
                  <span className="regular text-[14px] text-[#1D1D1D] medium">
                    {translateFunction("Cancel This Product")}
                  </span>
                  <p className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction("Cancel This Product In")}
                    <span className="bold text-[12px] text-[#8D8D8D]  mx-[4px]">
                      3 {translateFunction("Hours")}
                    </span>
                    {translateFunction("And Back Your Money")}
                  </p>
                </div>
              </div>
            )}
            {selectedOrder.can_return_order && (
              <div
                onClick={() => {
                  setActiveWidget("return");
                }}
                className="cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] "
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <ReturnOrderItemIcon className="absolute top-0 left-0 right-0 mx-auto my-0" />
                </div>
                <div className="flex-col ml-[15px]">
                  <span className="regular text-[14px] text-[#1D1D1D] medium">
                    {translateFunction("Return This Product")}
                  </span>
                  <p className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction("Return This Product In")}
                    <span className="bold text-[12px] text-[#8D8D8D]  mx-[2px]">
                      24 {translateFunction("Hours")}
                    </span>
                    {translateFunction("And Back Your Money")}
                  </p>
                </div>
              </div>
            )}
            {selectedOrder && (
              <div
                onClick={() => {
                  setActiveWidget("report");
                }}
                className="cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px]"
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <ReportOrderItemIcon />
                </div>
                <div className="flex-col ml-[15px]">
                  <span className="regular text-[14px] text-[#1D1D1D] medium">
                    {translateFunction("Report This Product")}
                  </span>
                  <span className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction(
                      "Delivery Time, Delivery Man, Delivery Car"
                    )}
                  </span>
                </div>
              </div>
            )}
            {selectedOrder && (
              <div
                onClick={() => {
                  setActiveWidget("hide");
                }}
                className="cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px]"
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <HideOrderItemIcon />
                </div>
                <div className="flex-col ml-[15px]">
                  <span className="regular text-[14px] text-[#1D1D1D] medium">
                    {translateFunction("Hide This Product")}
                  </span>
                  <span className="regular text-[12px] text-[#8D8D8D]">
                    {translateFunction("Hide This Product From My List")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      );
    }
    if (activeWidget === "return") {
      return (
        <ReturnOrderItem
          backToMain={() => {
            setActiveWidget("main");
          }}
          setShouldConfirmReturn={setShouldConfirmReturn}
          closeOptions={close}
          item={item}
        />
      );
    }
    if (activeWidget === "cancel") {
      return (
        <CancelOrderItem
          cancelOrderItem={cancelOrderItem}
          backToMain={() => {
            setActiveWidget("main");
          }}
          setShouldConfirmCancel={setShouldConfirmCancel}
          item={item}
        />
      );
    }
    if (activeWidget === "ChangeRequest") {
      return (
        <ChangeOrderItem
          shouldConfirmChange={shouldConfirmChange}
          close={() => {
            setActiveWidget("main");
          }}
          backToMain={() => {
            setActiveWidget("main");
          }}
          setShouldConfirmChange={setShouldConfirmChange}
          item={item}
        />
      );
    }
  };

  return (
    <>
      <div
        onClick={() => close(false)}
        className="absolute top-[0px]   left-0 min-w-[100vw] z-[999999998] min-h-[100vh] opacity-40 bg-[black]"
      />
      <div className="flex-col items-center max-h-[calc(100vh-100px)] overflow-auto w-full pt-[12px]  z-[999999999] pb-[27px] absolute bottom-[0px]  left-0 rounded-t-[30px] bg-white">
        {RenderWidget()}
      </div>
    </>
  );
}

export default OrderItemOptionsModal;
