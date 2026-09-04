import { useState } from "react";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { RoundPrice, translateFunction } from "utils/functions";
import { OrderInterface } from "utils/types/OrderInterface";

function CancelOrderWrapper({
  order,
  isRtl,
  setShouldConfirmCancel,
}: {
  order: OrderInterface;
  isRtl: boolean;
  // Passes the selected reasons up so the confirmation step can attach them to
  // the `order_cancelled` analytics event (truthy array also opens the window).
  setShouldConfirmCancel: (e: boolean | string[]) => void;
}) {
  const { currency, language } = useAppStore();
  let options = [
    "I Changed My Mind",
    "I Fear Quality",
    "I Fear The Delivery Time",
    "I’m Afraid Of Sizes",
    "I Saw A Better Price",
  ];

  const [selectedOptions, setSelectedOptions] = useState([]);
  const handleOptionClick = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };
  return (
    <div className="flex-col mt-[20px] flex-1">
      <div className="flex-col w-full items-center pb-[12px] px-[24px]">
        <div className="">
          <img src="/icons/cancelOrderItemIcon.svg" className="mt-[12px]" />
        </div>
        <span className="medium text-[14px] mt-[11px] text-[#1D1D1D]">
          {translateFunction("Cancel This Pack")}
        </span>
        <p
          className={`${
            isRtl ? "dir-rtl" : ""
          } block  text-[#8D8D8D] text-[12px] regular text-center`}
        >
          {translateFunction(
            "You Can Cancel The Product Without Any Conditions According To The Cancel Policy And Get A Full Refund"
          )}
          <span className="bold text-[12px] text-[#8D8D8D] mx-[3px]">
            {RoundPrice({
              num: order.order_amount,
              rate: currency?.exchange_rate,
              language: language,
              returnNumber: true,
            })}
          </span>
          <span className="text-[#8D8D8D] mx-[3px]">{currency?.symbol}</span>
          {translateFunction("To Your Account")}.
        </p>
        <span className="border-[#C4C2C280] border-b w-full mt-[12px]" />
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  w-full  items-center justify-center`}
      >
        <span className="regular text-[12px] text-[#8D8D8D]">
          {translateFunction("Why Was The Order Cancelled?")}
        </span>
        <span className="medium text-[12px] text-[#402CDD] mx-[4px]">
          {translateFunction("Learn More Tips.")}
        </span>
      </div>
      <div className="flex-row w-full flex-wrap items-center mt-[12px] gap-y-[10px]  gap-x-[12px] pr-[30px]">
        {options.map((option, index) => (
          <div
            key={option}
            data-pw="cancel-order-reason"
            className={`px-[12px] w-auto regular text-[12px] text-[#5D5C5D] flex-row h-[39px] justify-start items-center rounded-[12px] bg-[#F8F8F8] `}
            style={{
              flex: "0 1 auto",
              border: selectedOptions.includes(option)
                ? "1px solid #402CDD80"
                : "none",
            }}
            onClick={() => {
              handleOptionClick(option);
            }}
          >
            <span className="regular text-[12px] text-[#8D8D8D]">
              {translateFunction(option)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-[20px]">
        <div className="flex-row w-full items-center justify-center h-[50px] bg-[#388CFF] rounded-[20px] text-white text-[14px] medium">
          {translateFunction(
            "We Have Other Solutions Instead Of Cancellation."
          )}
        </div>
        <div
          data-pw="cancel-order-submit"
          className={`${
            selectedOptions?.length > 0 ? "bg-[#FF5F61]" : "bg-[#D3D3D3]"
          } rounded-[20px] text-white text-[14px] medium h-[50px] flex-row w-full items-center justify-center mt-[20px]`}
          onClick={() => {
            if (selectedOptions?.length > 0) {
              setShouldConfirmCancel(selectedOptions);
            } else {
              showErrorNotification(
                translateFunction(
                  "Please select a reason for canceling this order"
                )
              );
            }
          }}
        >
          {translateFunction("Cancel Order")}
        </div>
      </div>
    </div>
  );
}

export default CancelOrderWrapper;
