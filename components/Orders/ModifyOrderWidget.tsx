import React, { useState } from "react";
import { useAppStore } from "store";
import ModifyOrderIcon from "public/svg/ModifyOrderIcon.svg";
import { translateFunction } from "utils/functions";

import OrderItemCard from "./OrderItemCard";
import { ModifyOrderItemModal } from "./ModifyOrderItemModal";

import { ModifyOrderWidgetPropsType } from "models/componentType/ModifyOrderWidgetPropsType";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
function ModifyOrderWidget({ order_items, close }: ModifyOrderWidgetPropsType) {
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
  const [ConfirmationData, setConfirmationData] = useState({
    enable: false,
    loading: false,
    currentColor: null,
    newColor: null,
    currentSize: null,
    newSize: null,
    productDetails: null,
    type: null,
    item: null,
  });

  const getProductDetails = async () => {
    try {
      setConfirmationData({ ...ConfirmationData, loading: true });
      let [data1, data2] = await Promise.all([
        fetchData({
          url: `/web/product/qtyPriceDetails/${ConfirmationData.item?.product_slug}`,
          reqTitle: "Get Product Vriantes",
          method: "GET",
          server: "market",
        }),
        fetchData({
          url: `/web/product/globalDetails/${ConfirmationData.item?.product_slug}`,
          reqTitle: "GEt Product Global Details",
          method: "GET",
          server: "market",
        }),
      ]);

      setConfirmationData({
        ...ConfirmationData,
        productDetails: { ...data1.data, ...data2.data },
        loading: false,
      });
    } catch (e) {
      showErrorNotification(translateFunction("Failed to Load Product Data"));
      setConfirmationData({
        ...ConfirmationData,

        loading: false,
        enable: false,
      });
    }
  };
  return (
    <>
      {ConfirmationData?.enable && (
        <ModifyOrderItemModal
          orderItemData={orderItemData}
          editOrderItem={(e) => setOrderItemData(e)}
          orderItem={ConfirmationData.item}
          setConfirmationData={setConfirmationData}
          type={ConfirmationData.type}
          confirmationData={ConfirmationData}
          getProductDetails={getProductDetails}
        />
      )}
      <div className="flex-col max-h-[calc(100vh)] overflow-auto w-full pt-[14px] px-[24px] z-[999999999] pb-[27px] absolute bottom-[0px]  left-0 rounded-t-[30px] bg-white">
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
        <div className="flex-col items-center mt-[20px]  bg-[#fff] h-[481px] w-full max-h-[calc(100vh)] overflow-auto">
          {orderItemData.map((item) => {
            return (
              <>
                <OrderItemCard
                  ConfirmationData={ConfirmationData}
                  setConfirmationData={setConfirmationData}
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
