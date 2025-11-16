import { GetAddressString } from "components/Cart/AddressListContainer";
import { OrderAddressCardPropsType } from "models/componentType/OrderAddressCardPropsType";
import React from "react";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
function OrderAddressCard({ address }: OrderAddressCardPropsType) {
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      className={`bg-[#F4F4F4] mt-[8px] ml-[8px] w-full min-h-[155px] h-auto  rounded-[15px] py-[7px] px-[12px] flex-col`}
    >
      <span
        className={`text-[#8D8D8D] text-[10px] regular ${
          isRtl ? " text-right " : " "
        }`}
      >
        {translateFunction("Shipping & Delivery Address")}
      </span>
      <span
        className={`text-[#8D8D8D] text-[12px] medium mt-[3px] ${
          isRtl ? " text-right " : " "
        }`}
      >
        {address?.address}
      </span>
      <span
        className={`text-[#1D1D1D] text-[12px] regular mt-[3px] ${
          isRtl ? " text-right " : " "
        }`}
      >
        {GetAddressString(address)}
      </span>
      <span
        className={`text-[#8D8D8D] text-[10px] regular mt-[3px] ${
          isRtl ? " text-right " : " "
        }`}
      >
        {translateFunction("Recipient")}
      </span>
      <span
        className={`text-[#1D1D1D] text-[12px] regular mt-[3px] ${
          isRtl ? " text-right " : " "
        }`}
      >
        {address?.contact_person_name}
      </span>
      <span
        className={`text-[#8d8d8d] text-[10px] regular mt-[3px] ${
          isRtl ? " text-right " : " "
        }`}
      >
        {translateFunction("Recipient Phone")}
      </span>
      <span
        className={`text-[#1D1D1D] text-[12px] regular mt-[3px] ${
          isRtl ? " text-right " : " "
        }`}
      >
        {address?.phone}
      </span>
    </div>
  );
}

export default OrderAddressCard;
