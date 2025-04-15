import { GetAddressString } from "components/Cart/AddressListContainer";
import React from "react";
import { translateFunction } from "utils/functions";

function OrderAddressCard({ address }: { address: any }) {
  return (
    <div className="bg-[#F4F4F4] mt-[8px] ml-[8px] w-full min-h-[155px] h-auto  rounded-[15px] py-[7px] px-[12px] flex-col">
      <span className="text-[#8D8D8D] text-[10px] regular">
        {translateFunction("Shipping & Delivery Address")}
      </span>
      <span className="text-[#8D8D8D] text-[12px] medium mt-[3px]">
        {address.address}
      </span>
      <span className="text-[#1D1D1D] text-[12px] regular mt-[3px]">
        {GetAddressString(address)}
      </span>
      <span className="text-[#8D8D8D] text-[10px] regular mt-[3px]">
        {translateFunction("Recipient")}
      </span>
      <span className="text-[#1D1D1D] text-[12px] regular mt-[3px]">
        {address.contact_person_name}
      </span>
      <span className="text-[#8d8d8d] text-[10px] regular mt-[3px]">
        {translateFunction("Recipient Phone")}
      </span>
      <span className="text-[#1D1D1D] text-[12px] regular mt-[3px]">
        {address.phone}
      </span>
    </div>
  );
}

export default OrderAddressCard;
