import React, { useState } from "react";
import { useAppStore } from "store";
import Image from "next/image";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";

import CancelOrderItemIcon from "public/svg/OrderCancelIcon";
import { GetImageUrl } from "utils/tinyUtils";

function CancelOrderItem({
  item,
  backToMain,
  setShouldConfirmCancel,
  cancelOrderItem,
}) {
  const { currency, language } = useAppStore();
  const [selectedOptions, setSelectedOptions] = useState([]);
  let options = [
    "I Changed My Mind",
    "I Fear Quality",
    "I Fear The Delivery Time",
    "I’m Afraid Of Sizes",
    "I Saw A Better Price",
  ];
  const handleOptionClick = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  return (
    <>
      <div className="flex-col w-full items-center pb-[12px] px-[24px]">
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
        <div className="">
          <CancelOrderItemIcon className="mt-[12px] [&>path]:fill-[#402CDD]" />
        </div>
        <span className="medium text-[14px] mt-[11px] text-[#1D1D1D]">
          {translateFunction("Cancel This Product")}
        </span>
        <p className="text-[#8D8D8D] text-[12px] regular text-center">
          {translateFunction(
            "You Can Cancel The Product Without Any Conditions According To The Cancel Policy And Get A Full Refund"
          )}
          <span className="bold text-[12px] text-[#8D8D8D] ml-[4px]">
            {RoundPrice({
              num: item.price_after_discount || item.price,
              rate: currency?.exchange_rate,
              language: language,
              returnNumber: true,
            })}
          </span>
          <span className="text-[#8D8D8D] mx-[4px]">{currency?.symbol}</span>
          {translateFunction("To Your Account")}.
        </p>
        <span className="border-[#C4C2C280] border-b-[1px] w-full mt-[12px]" />
      </div>

      <div className="flex-row w-full items-center justify-center mt-[30px]">
        <p className="text-[#8D8D8D] text-[12px] regular text-center">
          {translateFunction("Why Was The Product Return?")}
          <span className="text-[#402CDD] mx-[4px] cursor-pointer">
            {translateFunction("Learn More Tips.")}
          </span>
        </p>
      </div>
      <div className="flex-row w-full flex-wrap items-center mt-[12px] gap-y-[10px]  gap-x-[12px] pr-[50px]  pl-[24px]">
        {options.map((option, index) => (
          <div
            key={option}
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

      <div className="flex-col px-[24px] w-full mt-[15px] gap-[35px]">
        <div className="flex-row w-full items-center justify-center h-[50px] bg-[#388CFF] rounded-[20px] text-white text-[14px] medium">
          {translateFunction(
            "We Have Other Solutions Instead Of Cancellation."
          )}
        </div>
        <div
          className={`w-full h-[53px] items-center justify-center  flex cursor-pointer ${
            selectedOptions.length === 0 ? "bg-[#D3D3D3] " : "bg-[#FF5F61] "
          } rounded-[20px] text-[16px] text-[#fff] medium`}
          onClick={() => {
            if (selectedOptions.length === 0) {
              backToMain();
            } else {
              cancelOrderItem(item.id);
              setShouldConfirmCancel(true);
            }
          }}
        >
          {selectedOptions.length === 0
            ? translateFunction("Close")
            : translateFunction("Cancel Request")}
        </div>
      </div>
    </>
  );
}

export default CancelOrderItem;
