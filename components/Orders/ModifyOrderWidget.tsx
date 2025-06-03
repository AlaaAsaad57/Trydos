import React, { useState } from "react";
import { useAppStore } from "store";
import ModifyOrderIcon from "public/svg/ModifyOrderIcon.svg";
import { translateFunction } from "utils/functions";

import OrderItemCard from "./OrderItemCard";
function ModifyOrderWidget({ order_items, close }) {
  const { selectedOrder, currency } = useAppStore();
  const [orderItemData, setOrderItemData] = useState(order_items);
  const isChanged = () => {
    let bool = false;
    if (orderItemData?.length !== order_items.length) return true;
    orderItemData?.map((s, index) => {
      if (
        s?.variation?.color !==
        order_items?.find((original) => original?.id === s.id)?.variation?.color
      ) {
        bool = true;
      }
      if (
        s?.variation?.Size !==
        order_items?.find((original) => original?.id === s.id)?.variation?.Size
      ) {
        bool = true;
      }
    });

    return bool;
  };
  return (
    <>
      <div className="flex-col max-h-[calc(100vh-150px)] overflow-auto w-full pt-[14px] px-[24px] z-[999999999] pb-[27px] absolute bottom-[100px]  left-0 rounded-t-[30px] bg-white">
        <div className="flex-col  items-center w-full justify-center">
          <ModifyOrderIcon />
          <span className="medium text-[#402CDD] text-[14px] mt-[5px] ">
            {translateFunction("Modify Order")}
          </span>
          <span className="text-[12px] regular text-[#8D8D8D] mt-[8px] text-center">
            {translateFunction(
              "You Can Modify Your Order Within Specific Periods And You Can Also Cancel The Order At Any Time And Get A Full Refund."
            )}
          </span>
          <div
            className="w-full h-[1px] mt-[22px]"
            style={{ borderTop: "1px solid #C4C2C280" }}
          />
        </div>
        <div className="flex-col items-center mt-[20px]  bg-[#fff] h-[481px] w-full max-h-[calc(100vh-200px)] overflow-auto">
          {orderItemData.map((item) => {
            return (
              <>
                <OrderItemCard
                  item={item}
                  editOrderItem={(e) => setOrderItemData(e)}
                  orderItemData={orderItemData}
                />
                <div
                  className="w-full h-[1px] mt-[22px]"
                  style={{ borderTop: "1px solid #C4C2C280" }}
                />
              </>
            );
          })}
        </div>
        <div
          className={`w-full h-[53px] items-center justify-center  flex cursor-pointer ${
            !isChanged() ? "bg-[#D3D3D3] " : "bg-[#402CDD] "
          } rounded-[20px] text-[16px] text-[#fff] medium`}
          onClick={() => {
            if (!isChanged()) {
              close();
            } else {
              close();
              //   setConfirmationData({
              //     enable: true,
              //     currentAddress: addressLists?.find((s) => s.id === address_id),
              //     newAddress: addressLists?.find(
              //       (s) => s.id === selectedAddressId
              //     ),
              //   });
            }
          }}
        >
          {!isChanged()
            ? translateFunction("Close")
            : translateFunction("Modify & Close")}
        </div>
      </div>
    </>
  );
}

export default ModifyOrderWidget;
