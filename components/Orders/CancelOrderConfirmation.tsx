import React, { useState } from "react";
import ClarificationIcon from "public/svg/OrderCancelConfirm";
import OrderCancelTermsIcon from "public/svg/OrderCancelTerms";
import { translateFunction } from "utils/functions";
import { CancelOrderConfirmationPropsType } from "models/componentType/CancelOrderConfirmationPropsType";
import Spinner from "components/global/Spinner";
import { CheckBoxElement } from "components/Cart/PlaceOrderButtons";
import { useAppStore } from "store";

function CancelOrderConfirmation({
  setShouldConfirmCancel,
  close,
  topic = "About Cancel Your Order",
  callback,
  setShouldConfirmChange,
}: CancelOrderConfirmationPropsType) {
  const [loading, setLoading] = useState(false);
  const ConfirmFunction = async () => {
    try {
      setLoading(true);
      await callback();
      setLoading(false);
      close();
      setShouldConfirmCancel(false);
      setShouldConfirmChange(false);
    } catch (error) {
      setLoading(false);
    }
  };
  const [active, setActive] = useState(false);
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`z-[9999999999999] px-[24px]  w-full flex-col ${"justify-start"} items-center h-[calc(100vh)] overflow-auto  pb-[70px] max-h-[calc(100vh)] fixed top-0 left-0 bg-[#0000006c]  backdrop-blur-[10px]`}
    >
      <div className="w-full overflow-auto flex-col items-center justify-between h-full">
        <div className="flex-col items-center">
          <ClarificationIcon className="mt-[100px]" />
          <span className="medium text-[#fff] text-[40px] mt-[7px] text-center">
            {translateFunction("Clarification")}
          </span>
          <span className="text-white regular text-[16px] mt-[2px] text-center">
            {translateFunction(`${topic}`)}
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
          <OrderCancelTermsIcon />
          <span className="mt-[7px] regular text-white text-[14px]">
            {translateFunction("Terms Of Cancellation Terms")}
          </span>
          <p
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } text-[14px] text-white regular mt-[40px] gap-[4px]`}
            onClick={() => {
              setActive(!active);
            }}
          >
            <CheckBoxElement active={active} />
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
              !active ? "bg-[#D3D3D3] " : "bg-[#402CDD] "
            } rounded-[15px] text-[16px] text-[#fff] medium`}
            onClick={() => {
              if (!active) return;
              ConfirmFunction();
            }}
          >
            {loading ? <Spinner /> : translateFunction("I Agree & Cancel")}
          </div>
          <div
            onClick={() => {
              setShouldConfirmCancel(false);
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

export default CancelOrderConfirmation;
