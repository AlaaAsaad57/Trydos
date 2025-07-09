import React, { useState } from "react";
import ClarificationIcon from "public/svg/OrderCancelConfirm.svg";
import OrderCancelTermsIcon from "public/svg/OrderCancelTerms.svg";
import { translateFunction } from "utils/functions";
import { CancelOrderConfirmationPropsType } from "models/componentType/CancelOrderConfirmationPropsType";

function CancelOrderConfirmation({
  setShouldConfirmCancel,
  close,
  topic = "About Cancel Your Order",
  callback,
  shouldConfirmCancel,
}: CancelOrderConfirmationPropsType) {
  const [loading, setLoading] = useState(false);
  const ConfirmFunction = async () => {
    try {
      setLoading(true);
      console.log(shouldConfirmCancel, "callback");
      await callback();
      setLoading(false);
      close();
      setShouldConfirmCancel(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <div
      className={`z-[9999999999999] px-[24px]  w-full flex-col ${"justify-end"} items-center h-[calc(100vh)] overflow-auto  pb-[70px] max-h-[calc(100vh)] fixed top-0 left-0 bg-[#0000006c]  backdrop-blur-[10px]`}
    >
      <div className="w-full overflow-auto flex-col items-center">
        <ClarificationIcon className="mt-[100px]" />
        <span className="medium text-[#fff] text-[40px] mt-[7px] text-center">
          {translateFunction("Clarification")}
        </span>
        <span className="text-white regular text-[16px] mt-[2px] text-center">
          {translateFunction(`${topic} `)}
        </span>
        <span className="mt-[45px] regular text-white text-[16px] text-center">
          {translateFunction("You Will Not Be Charged Any Fees.")}
        </span>
        <span className="mt-[19px] regular text-white text-[16px] text-center">
          {translateFunction(
            "You Will Receive Your Full Refund Within 12 Hours."
          )}
        </span>
        <span className="mt-[45px] regular text-white text-[16px] text-center">
          {translateFunction(
            "Repeated Cancellations Will Affect Your Rating, Which Will Affect Your Ability To Receive New Offers Or Opportunities From Us."
          )}
        </span>
        <div className="flex-col mt-auto w-full items-center">
          <OrderCancelTermsIcon />
          <span className="mt-[7px] regular text-white text-[14px]">
            {translateFunction("Terms Of Cancellation Terms")}
          </span>
          <p className="text-[14px] text-white regular mt-[40px]">
            {translateFunction("I Read And Agree To The")}
            <a
              target="_blank"
              href="#"
              className="ml-[4px] medium text-[14px] text-white underline"
            >
              {translateFunction(`Cancellation Terms.`)}
            </a>
          </p>

          <div
            className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${
              false ? "bg-[#D3D3D3] " : "bg-[#402CDD] "
            } rounded-[15px] text-[16px] text-[#fff] medium`}
            onClick={() => {
              ConfirmFunction();
            }}
          >
            {translateFunction("I Agree & Cancel")}
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
