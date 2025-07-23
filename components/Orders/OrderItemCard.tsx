import Image from "node_modules/next/image";
import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "store";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import OrderStatusIcon from "components/settings/cards/OrderStatusIcon";
import CancelOrderItemIcon from "public/svg/cancelOrderItemIcon.svg";

import { GetImageUrl } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";

function OrderItemCard({
  item,
  editOrderItem,
  orderItemData,
  ConfirmationData,
  setConfirmationData,
}) {
  const { selectedOrder, currency } = useAppStore();

  const getProductDetails = async () => {
    setConfirmationData({ ...ConfirmationData, loading: true });
    let [data1, data2] = await Promise.all([
      fetchData({
        url: `/web/product/qtyPriceDetails/${item?.product_slug}`,
        reqTitle: "Get Product Vriantes",
        method: "GET",
        server: "market",
      }),
      fetchData({
        url: `/web/product/globalDetails/${item?.product_slug}`,
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
  };
  return (
    <>
      <div className="flex-row w-full h-[170px] bg-[#fff] py-[6px]">
        <Image
          src={GetImageUrl(item.image)}
          width={104}
          height={144}
          alt="image"
          className="object-cover object-center rounded-[15px] w-[104px] h-[144px]"
        />
        <div className="py-[6px] ml-[12px] flex-col h-full w-full pr-[20px]">
          {item.brand?.image ? (
            <span className="flex-row">
              <Image
                alt="image"
                src={getConfiguredImage({
                  height: 150,
                  width: 150,
                  src: GetImageUrl(item.brand?.image),
                })}
                height={10}
                style={{
                  top: "0px",
                  maxHeight: "100%",
                  display: "flex",
                }}
                className="object-contain h-4 max-w-[90px] w-auto"
              />
            </span>
          ) : (
            <span className="h-[10px]"></span>
          )}
          <span className="text-[12px]  regular text-[#505050]">
            {item?.product_details?.name}
          </span>
          {item.variation?.color && (
            <div className="flex-row items-center justify-between">
              <p className="text-[10px]   regular text-[#8D8D8D]">
                {translateFunction("Color")}:
                <span className="text-[12px] ml-[3px] medium text-[#505050]">
                  {item.variation?.color}
                </span>
              </p>
              <div
                className="flex-row items-center"
                onClick={() => {
                  setConfirmationData({
                    ...ConfirmationData,
                    enable: true,
                    type: "Color",
                    loading: true,
                    currentColor: item.variation.color,
                    item: item,
                  });
                }}
              >
                <span className="text-[10px] regular text-[#388CFF]  underline">
                  {translateFunction("Change")}
                </span>
              </div>
            </div>
          )}
          {item.variation?.Size && (
            <div className="flex-row items-center justify-between">
              <p className="text-[10px]   regular text-[#8D8D8D]">
                {translateFunction("Size")}:
                <span className="text-[12px] ml-[3px] medium text-[#505050]">
                  {item.variation?.Size}
                </span>
              </p>
              <div
                className="flex-row items-center"
                onClick={() => {
                  setConfirmationData({
                    ...ConfirmationData,
                    enable: true,
                    type: "Size",
                    loading: true,
                    currentSize: item.variation?.Size,
                    item: item,
                  });
                }}
              >
                <span className="text-[10px] regular text-[#388CFF]  underline">
                  {translateFunction("Change")}
                </span>
              </div>
            </div>
          )}
          <p className="text-[10px]   regular text-[#8D8D8D] flex-row items-center">
            {translateFunction("Item Status")}:
            <span className="text-[12px] ml-[3px] medium text-[#505050]">
              {item?.order_status}
            </span>
            <span className="ml-[12px]">
              <OrderStatusIcon status={item?.order_status?.value || ""} />
            </span>
          </p>
          <div className="flex-row items-center">
            {item.price_after_discount >= 0 && (
              <div className="line-through text-[#C4C2C2] regular text-[12px]  line-through-[#C4C2C2]">
                {RoundPrice({ num: item.price })}
              </div>
            )}
            <div className="text-[#1D1D1D] text-[12px] ml-[4px] bold">
              {RoundPrice({ num: item.price_after_discount })}
            </div>
            <span className="text-[#1D1D1D] light text-[10px] ml-[4px]">
              {currency?.symbol}
            </span>
          </div>
          <div
            className="flex-row items-center mt-auto"
            onClick={() => {
              editOrderItem([
                ...orderItemData?.filter((s) => s.id !== item?.id),
              ]);
            }}
          >
            <CancelOrderItemIcon />
            <span className="text-[10px] regular text-[#FF5F61] ml-[4px] underline">
              {translateFunction("Cancel This Product")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderItemCard;
