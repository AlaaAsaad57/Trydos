import React, { useState } from "react";
import { translateFunction } from "utils/functions";
import ClarificationIcon from "public/svg/OrderCancelConfirm.svg";
import OrderCancelTermsIcon from "public/svg/OrderCancelTerms.svg";
import { ReturnOrderItemConfirmationPropsType } from "models/componentType/ReturnOrderItemConfirmationPropsType";
import order from "services/order";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";

function ReturnOrderItemConfirmation({
  close,
  setShouldConfirmReturn,
  confirmationData,
  callback,
  setReturnObj,
}: ReturnOrderItemConfirmationPropsType) {
  const { ActivePacks } = useAppStore();

  const [loading, setLoading] = useState(false);
  const ReturnRequest = async (confirm?) => {
    try {
      setLoading(true);
      let req = await order.ReturnProduct({
        images: confirmationData.images,
        order_detail_id: confirmationData.item.id,
        product_id: confirmationData.item.product_id,
        quantity: confirmationData.item.qty,
        reason_id: confirmationData.reasons,
        return_request_id: ActivePacks.return_request_id,
        order_id: ActivePacks.id,
      });
      if (confirm) {
        await order.ConfirmReturnRequest({ return_request_id: req });
      } else {
        if (req)
          setReturnObj({
            order_id: { request_id: req, order_id: ActivePacks?.id },
          });
      }
      callback();
      close();
      setShouldConfirmReturn(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <div
      className={`z-[9999999999999] px-[24px] pb-[70px]  w-full flex-col ${"justify-end"} items-center h-[calc(100vh)] overflow-auto max-h-[calc(100vh)] fixed top-0 left-0 bg-[#0000006c]  backdrop-blur-[10px]`}
    >
      <div className="w-full overflow-auto flex-col items-center">
        <ClarificationIcon className="mt-[100px]" />
        <span className="medium text-[#fff] text-[40px] mt-[7px] text-center">
          {translateFunction("Clarification")}
        </span>
        <span className="text-white regular text-[16px] mt-[2px] text-center">
          {translateFunction("About Return Your Product")}
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
            className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${"bg-[#402CDD] "} rounded-[15px] text-[16px] text-[#fff] medium`}
            style={{
              border: "1px solid #F8F8F880",
            }}
            onClick={() => {
              if (loading) return;
              ReturnRequest(true);
            }}
          >
            {loading ? <Spinner /> : translateFunction("I Agree & Return")}
          </div>
          <div
            className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${"bg-[#a79cfa] "} rounded-[15px] text-[16px] text-[#575757] medium`}
            style={{
              border: "1px solid #F8F8F880",
            }}
            onClick={() => {
              if (loading) return;
              ReturnRequest(false);
            }}
          >
            {loading ? (
              <Spinner />
            ) : (
              translateFunction(
                "Dely Confirmation. I want to Return more product"
              )
            )}
          </div>
          {!loading && (
            <div
              onClick={() => {
                setShouldConfirmReturn(false);
              }}
              className={`w-full h-[53px] items-center justify-center underline  flex cursor-pointer  rounded-[20px] text-[16px] text-[#fff] medium`}
            >
              {translateFunction("I Disagree")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReturnOrderItemConfirmation;
