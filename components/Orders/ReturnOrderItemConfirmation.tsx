import React, { useState } from "react";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import ClarificationIcon from "public/svg/OrderCancelConfirm.svg";
import OrderCancelTermsIcon from "public/svg/OrderCancelTerms.svg";
import { ReturnOrderItemConfirmationPropsType } from "models/componentType/ReturnOrderItemConfirmationPropsType";
import order from "services/order";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { useParams } from "node_modules/next/navigation";

function ReturnOrderItemConfirmation({
  close,
  setShouldConfirmReturn,
  confirmationData,
  callback,
}: ReturnOrderItemConfirmationPropsType) {
  const { ActivePacks, selectedOrder, setOrderOptions } = useAppStore();
  const ReturnedItems = () => {
    let arr = [];
    if (confirmationData?.item) {
      arr.push({
        already_return: true,
        image: confirmationData.item.image,
        detail_id: confirmationData.item.id,
        img: [],
        images_url: [],
        product_id: confirmationData.item.product_id,
        product_price:
          confirmationData.item?.product_details?.offer_price ??
          confirmationData.item.product_details?.price,
        quantity: confirmationData.qty,
        subtotal:
          confirmationData.qty *
          (confirmationData.item?.product_details?.offer_price ??
            confirmationData.item.product_details?.price),
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
    selectedOrder?.returned_data?.map((ret_ite) => {
      ret_ite?.details?.order_details?.map((s) => {
        if (
          s?.already_return &&
          arr?.filter((d) => d.detail_id === s.detail_id)?.length === 0
        ) {
          arr = [...arr, s];
        }
      });
    });

    return arr;
  };
  const [loading, setLoading] = useState(false);
  const isThereAReturnedProduct = () => {
    let arr: {
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
    }[] = [];

    selectedOrder.returned_data?.map((s) => {
      s.details?.order_details?.map((req) => {
        if (req.already_return || req.detail_id === confirmationData.item.id) {
          if (!arr.find((d) => d === req?.return_request_id))
            arr.push(req?.return_request_id);
        }
      });
    });
    arr = [...arr, ActivePacks?.return_request_id];
    let set = new Set(arr);
    arr = [...set];

    if (arr.length > 0) return arr;
    return false;
  };
  const GetUniqueImagesInArrays = (): string[] => {
    const arr: string[] = confirmationData?.images ?? [];
    const newArr: string[] =
      selectedOrder?.returned_data
        ?.find((s) => s.id === ActivePacks?.return_request_id)
        ?.details?.order_details?.find(
          (s) => s.detail_id === confirmationData?.item?.id
        )?.img ?? [];

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
          req = ActivePacks.return_request_id;
        } else {
          req = await order.ReturnProduct({
            images: confirmationData.images,
            order_detail_id: confirmationData.item.id,
            product_id: confirmationData.item.product_id,
            quantity: confirmationData.item.qty,
            reason_id: confirmationData.reasons,
            return_request_id: ActivePacks.return_request_id,
            order_id: ActivePacks.id,
          });
        }
      }

      if (confirm) {
        await Promise.all(
          // @ts-ignore
          isThereAReturnedProduct()?.map(async (s) => {
            await order.ConfirmReturnRequest({
              return_request_id: s,
            });
          })
        );
      }
      callback();
      close();
      setShouldConfirmReturn(false);
      setLoading(false);
    } catch (error) {
      console.log(error);
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
        <div className="w-full flex-row">
          <RenderReturnedItem returned_items={ReturnedItems()} />
        </div>
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
          {!confirmationData?.update && (
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
                  "Delay Confirmation. I want to Return more product"
                )
              )}
            </div>
          )}
          {!loading && (
            <div
              onClick={() => {
                setOrderOptions(false);
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
      {returned_items.map((return_item, index) => (
        <div
          key={`${return_item.detail_id}-${index}`}
          className="flex-shrink-0 w-[170px] regular mx-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform"
        >
          {/* Image Container */}
          <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
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
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 backdrop-blur-sm">
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
                          return_item.quantity?.toString()
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
