import { CheckBoxElement } from "components/Cart/PlaceOrderButtons";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { useAppStore } from "store";
import {
  getConfiguredImage,
  LogError,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { OrderInterface, returnDetails } from "utils/types/OrderInterface";

import order from "services/order";
function OrderItemReturnConfirmationWindow({
  close,
  setShouldConfirmReturn,
  confirmationData,
  callback,
  orderData,
  returnDetails,
  orderItem,
}: {
  close: () => void;
  setShouldConfirmReturn: (e) => void;
  confirmationData: any;
  callback: () => Promise<any>;
  orderData: OrderInterface[];
  returnDetails: returnDetails;
  orderItem: OrderInterface;
}) {
  const { setOrderOptions, language } = useAppStore();
  const ReturnedItems = () => {
    let arr = [];
    if (confirmationData?.item) {
      let product_price =
        (confirmationData.item?.offer_price ?? confirmationData.item?.price) /
        confirmationData?.item?.quantity;
      let sub_total =
        ((confirmationData.item?.offer_price ?? confirmationData.item?.price) /
          confirmationData?.item?.quantity) *
        confirmationData?.qty;
      arr.push({
        already_return: true,
        image: confirmationData.item.image,
        detail_id: confirmationData.item.id,
        img: [],
        images_url: [],
        product_id: confirmationData.item.product_id,
        product_price: product_price,
        quantity: confirmationData.qty,
        subtotal: sub_total,
        name:
          confirmationData.item.name ||
          confirmationData.item?.product_details?.name,
        return_request_id: null,
        return_request_product_details: null,
        return_request_product_id: null,
        return_request_product_quantity: confirmationData.qty,
        return_request_product_reason_id: null,
        return_request_product_status: null,
        variant: confirmationData.item.variant,
      });
    }

    returnDetails?.return_requests_data?.map((ret_ite) => {
      if (!ret_ite?.status?.value || ret_ite.status?.name?.includes("draft")) {
        ret_ite?.order_details?.map((s) => {
          if (s.already_return) {
            let product = orderData
              ?.find(
                (order_data_item) => order_data_item.id === ret_ite.order_id,
              )
              ?.details?.find(
                (order_detail) => order_detail.id === s.product_id,
              );
            if (arr?.filter((d) => d.detail_id === s.detail_id)?.length === 0) {
              arr = [...arr, { ...product, ...s }];
            }
          }
        });
      }
    });
    return arr;
  };
  const [loading, setLoading] = useState(false);
  const isThereAReturnedProduct = () => {
    let arr = [];

    returnDetails?.return_requests_data?.map((s) => {
      s.order_details?.map((req) => {
        if (
          req.already_return ||
          req.detail_id === confirmationData?.item?.id
        ) {
          if (!arr.find((d) => d === req?.return_request_id))
            arr.push(req?.return_request_id);
        }
      });
    });
    let set = new Set(arr);
    arr = [...set];
    if (arr.length > 0) return arr;
    return false;
  };
  const GetUniqueImagesInArrays = (): string[] => {
    const arr: string[] = confirmationData?.images ?? [];
    const newArr: string[] =
      returnDetails?.return_requests_data
        ?.find((s) => s.return_request_id === orderItem?.return_request_id)
        ?.order_details?.find((s) => s.detail_id === confirmationData?.item?.id)
        ?.img ?? [];
    if (!arr.length) return [];
    if (!newArr.length) return arr;
    const newArrSet = new Set(newArr);
    const diff = arr.filter((img) => !newArrSet.has(img));
    return diff;
  };

  const ReturnRequest = async (confirm?) => {
    try {
      setLoading(true);
      let req;
      if (confirmationData?.item) {
        if (confirmationData.update) {
          await order.UpdateReturnedProduct({
            images: GetUniqueImagesInArrays(),
            quantity: confirmationData.item.qty,
            reason_id: confirmationData.reasons,
            id: confirmationData.return_request_product_id,
          });
          req = orderItem.return_request_id;
        } else {
          req = await order.ReturnProduct({
            images: confirmationData.images,
            order_detail_id: confirmationData.item.id,
            product_id: confirmationData.item.product_id,
            quantity: confirmationData.item.qty,
            reason_id: confirmationData.reasons,
            return_request_id: orderItem.return_request_id,
            order_id: orderItem.id,
          });
        }
      }

      if (confirm) {
        await order.ConfirmReturnRequest({
          return_request_id: isThereAReturnedProduct(),
        });
      }
      await callback();
      close();
      setShouldConfirmReturn(false);
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In ReturnRequest in OrdreItemReturnConfirmation",
      });
      setLoading(false);
    }
  };
  const [active, setActive] = useState(false);
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`z-9999999999999 px-[24px] pb-[70px]  w-full flex-col ${"justify-start"} items-center h-[calc(100vh)] overflow-auto max-h-full fixed top-0 left-0 bg-[#0000006c]  backdrop-blur-[10px]`}
    >
      <div className="w-full overflow-auto flex-col items-center max-w-[800px] justify-between h-full">
        <div className="flex-col items-center">
          <img src="/icons/OrderCancelConfirm.svg" className="mt-[100px]" />
          <span className="medium text-white text-[40px] mt-[7px] text-center">
            {translateFunction("Clarification")}
          </span>
          <span className="text-white regular text-[16px] mt-[2px] text-center">
            {translateFunction("About Return Your Product")}
          </span>

          {!confirmationData?.additon_cost && (
            <span className="mt-[45px] regular text-white text-[16px] text-center">
              {translateFunction("You Will Not Be Charged Any Fees.")}
            </span>
          )}
          <span className="mt-[19px] regular text-white text-[16px] text-center">
            {translateFunction("You Will Receive Your Refund Within 12 Hours.")}
          </span>
          <span className="mt-[45px] regular text-white text-[16px] text-center">
            {translateFunction(
              "Repeated Cancellations Will Affect Your Rating, Which Will Affect Your Ability To Receive New Offers Or Opportunities From Us.",
            )}
          </span>
        </div>
        <div className="w-full flex-row">
          <RenderReturnedItem returned_items={ReturnedItems()} />
        </div>
        <div className="flex-col mt-auto w-full items-center">
          <img src="/icons/OrderCancelTerms.svg" />
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
            {translateFunction("I Read And Agree To The")}
            <a
              target="_blank"
              href="#"
              className=" medium text-[14px] text-white underline"
            >
              {translateFunction(`Cancellation Terms.`)}
            </a>
          </p>

          <div
            className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${
              !active ? "bg-[#D3D3D3] text-white" : "bg-[#3066CC] text-white"
            } rounded-[15px] text-[16px] text-white medium`}
            style={{
              border: "1px solid #F8F8F880",
            }}
            onClick={() => {
              if (loading || !active) return;
              ReturnRequest(true);
            }}
          >
            {loading ? <Spinner /> : translateFunction("I Agree & Return")}
          </div>
          {
            <div
              className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${
                !active ? "bg-[#D3D3D3] text-white" : "bg-[#84afff] text-white"
              } rounded-[15px] text-[16px]  medium`}
              style={{
                border: "1px solid #F8F8F880",
              }}
              onClick={() => {
                if (loading || !active) return;
                ReturnRequest(false);
              }}
            >
              {loading ? (
                <Spinner />
              ) : (
                translateFunction(
                  "Delay Confirmation. I want to Return more product",
                )
              )}
            </div>
          }
          {!loading && (
            <div
              onClick={() => {
                setOrderOptions(false);
                setShouldConfirmReturn(false);
              }}
              className={`w-full h-[53px] items-center justify-center underline  flex cursor-pointer  rounded-[20px] text-[16px] text-white medium`}
            >
              {translateFunction("I Disagree")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderItemReturnConfirmationWindow;

const RenderReturnedItem = ({
  returned_items,
}: {
  returned_items: {
    detail_id: number;
    product_id: number;
    return_request_id: number;
    quantity: number;
    image: string;
    name: string;
    variant: string;
    product_price: number;
    subtotal: number;
    already_return: boolean;
    return_request_product_id: number;
    return_request_product_quantity: string;
    return_request_product_reason_id: number;
    return_request_product_details: any;
    return_request_product_status: string;
    images_url: Array<string>;
    img: Array<string>;
  }[];
}) => {
  const { currency } = useAppStore();
  const { lang } = useParams();
  const [country, language] = (lang as string).split("-");
  return (
    <HortiznalScrollBar
      className="w-full px-[10px] flex-row mt-[10px]"
      id="returned-products-container"
    >
      {(returned_items as any).map((return_item, index) => (
        <div
          key={`${return_item.detail_id}-${index}`}
          className="shrink-0 w-[170px] regular mx-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform"
        >
          {/* Image Container */}
          <div className="relative h-48 bg-linear-to-br from-gray-50 to-gray-100">
            <img
              src={getConfiguredImage({
                src: return_item.image,
                width: 100,
                height: 200,
              })}
              alt={return_item.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.src = "/images/placeholder-product.png";
              }}
            />

            {/* Quantity Badge */}
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 backdrop-blur-xs">
                Qty: {parseInt(return_item.return_request_product_quantity)}
              </span>
            </div>
          </div>

          {/* Content Container */}
          <div className="p-4">
            {/* Product Name */}
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">
              {return_item.name}
            </h3>

            {/* Variant */}
            {return_item.variant && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                {return_item.variant}
              </p>
            )}

            {/* Price and Subtotal */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Price</span>
                <span className="text-sm font-medium text-gray-900">
                  {RoundPrice({
                    num: return_item.product_price,
                    language: language,
                  })}
                  {currency?.symbol}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500">Subtotal</span>
                <span className="text-sm font-semibold text-blue-600">
                  {RoundPrice({
                    num:
                      return_item.product_price *
                      parseInt(
                        return_item.return_request_product_quantity ||
                          return_item.quantity?.toString(),
                      ),
                    language: language,
                  })}
                  {currency?.symbol}
                </span>
              </div>
            </div>

            {/* Return Details */}
          </div>
        </div>
      ))}
    </HortiznalScrollBar>
  );
};
