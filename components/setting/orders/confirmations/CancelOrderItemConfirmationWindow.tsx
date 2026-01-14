import React, { useState } from "react";

import { translateFunction } from "utils/functions";
import Order from "services/order";
import Spinner from "components/global/Spinner";
import { CheckBoxElement } from "components/Cart/PlaceOrderButtons";

function OrderItemCancelConfirmationWindow({
  order_id,
  close,
  isRtl,
  callback,
  item_id,
  qty,
}: {
  order_id: number;
  close: () => void;
  isRtl: boolean;
  callback: () => Promise<any>;
  item_id: number;
  qty: number;
}) {
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const ConfirmFunction = async () => {
    try {
      setLoading(true);
      await Order.CancelOrderItem({
        order_id: order_id,
        item_id: item_id,
        qty: qty,
      });
      await callback();
      setLoading(false);
      close();
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <div
      className={`z-[9999999999999] px-[24px]  w-full flex-col ${"justify-start"} items-center h-[calc(100vh)] max-h-full overflow-auto  pb-[30px] fixed top-0 left-0 bg-[#0000006c]  backdrop-blur-[10px]`}
    >
      <div className="w-full overflow-auto flex-col items-center justify-between h-full">
        <div className="flex-col items-center">
          <img src="/icons/OrderCancelConfirm.svg" className="mt-[100px]" />

          <span className="medium text-[#fff] text-[40px] mt-[7px] text-center">
            {translateFunction("Clarification")}
          </span>
          <span className="text-white regular text-[16px] mt-[2px] text-center">
            {translateFunction(`Cancel This Order`)}
          </span>

          <span className="mt-[45px] regular text-white text-[16px] text-center">
            {translateFunction("You Will Not Be Charged Any Fees.")}
          </span>
          <span className="mt-[19px] regular text-white text-[16px] text-center">
            {translateFunction("You Will Receive Your Refund Within 12 Hours.")}
          </span>
          <span className="mt-[45px] regular text-white text-[16px] text-center">
            {translateFunction(
              "Repeated Cancellations Will Affect Your Rating, Which Will Affect Your Ability To Receive New Offers Or Opportunities From Us."
            )}
          </span>
        </div>
        <div className="flex-col mt-auto w-full items-center">
          <img src="/icons/OrderCancelTerms.svg" />
          <span className="mt-[7px] regular text-white text-[14px]">
            {translateFunction("Terms Of Cancellation Terms")}
          </span>
          <p
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } text-[14px] text-white regular mt-[40px] gap-[4px]`}
            onClick={() => {
              setAgree(!agree);
            }}
          >
            <CheckBoxElement active={agree} />
            <span>{translateFunction("I Read And Agree To The")}</span>

            <a
              target="_blank"
              href="#"
              className="medium text-[14px] text-white underline"
            >
              {translateFunction(`Cancellation Terms.`)}
            </a>
          </p>

          <div
            className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${
              !agree ? "bg-[#D3D3D3] text-[#fff]" : "bg-[#3066CC] text-[#fff]"
            } rounded-[15px] text-[16px] text-[#fff] medium`}
            onClick={() => {
              if (!agree) return;
              ConfirmFunction();
            }}
          >
            {loading ? <Spinner /> : translateFunction("I Agree & Cancel")}
          </div>
          <div
            onClick={() => {
              close();
            }}
            className={`w-full h-[53px] items-center justify-center underline  flex cursor-pointer  rounded-[20px] text-[16px] text-[#fff] medium`}
          >
            {translateFunction("I Disagree")}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderItemCancelConfirmationWindow;
