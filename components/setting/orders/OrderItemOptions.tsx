import Spinner from "components/global/Spinner";

import React, { useState } from "react";
import {
  getConfiguredImage,
  LogError,
  translateFunction,
} from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { OrderInterface, returnDetails } from "utils/types/OrderInterface";
import Order from "services/order";
import { showErrorNotification } from "store/notifications/reducer";
import ChangeOrderItem from "components/Orders/ChangeOrderItem";
import { ModifyOrderItemModal } from "./confirmations/ChangeOrderItemConfirmWindow";
import OrderItemCancelConfirmationWindow from "./confirmations/CancelOrderItemConfirmationWindow";
import CancelOrderItemWrapper from "./CancelOrderItemWrapper";
import ReturnOrderItemWrapper from "./ReturnOrderItemWrapper";

import { createPortal } from "react-dom";
function OrderItemOptions({
  orderItem,
  isRtl,
  update,
  close,
  parentOrder,
  returnDetails,
  setActivePack,
  shouldShowConfirmReturn,
  setShouldConfirmReturn,
  orderData,
}: {
  orderItem: OrderInterface["details"][0];
  parentOrder: OrderInterface;
  isRtl: boolean;
  update: () => Promise<any>;
  close: () => void;
  returnDetails: returnDetails;
  setActivePack: (e: OrderInterface) => void;
  shouldShowConfirmReturn: boolean;
  setShouldConfirmReturn: (e: boolean) => void;
  orderData: OrderInterface[];
}) {
  const [canceled, setCanceled] = useState(false);
  const [ShouldConfirmCancel, setShouldConfirmCancel] = useState(false);
  const [IsInitializing, setIsInitializing] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState("options");
  const [ShowConfirmChangeOrder, setShowConfirmChangeOrder] =
    useState<any>(false);

  const ShouldShowCahngeColor = () => {
    if (parentOrder?.order_status?.value === "delivered") return false;
    if (!parentOrder.can_change_variant) return false;
    if (orderItem.qty === 0) return false;
    else return true;
  };
  const canCancelProduct = () => {
    return parentOrder?.can_cancele_order && orderItem.qty > 0;
  };
  const shouldShowRetutn = () => {
    if (parentOrder?.order_status?.value !== "delivered") return false;
    if (orderItem.qty === 0) return false;
    if (
      returnDetails?.return_requests_data
        ?.find((s) => s.order_id === parentOrder?.id)
        ?.order_details?.find((s) => s.detail_id === orderItem?.id)
        ?.already_return
    ) {
      return parentOrder?.edit_return_request;
    }
    return parentOrder.can_return_order;
  };
  const initializeReturn = async () => {
    if (parentOrder.return_request_id) {
      setSelectedScreen("return");
    }
    try {
      setIsInitializing(true);
      let id = await Order.CreateReturnRequest({ order_id: parentOrder.id });
      if (!id) {
        throw new Error();
      }
      let details = await Order.getReturnRequestDetails({
        order_id: parentOrder.id,
        return_request_id: id,
      });
      setActivePack({
        ...parentOrder,
        return_request_id: id,
      });
      await update();
      if (details?.order_details?.find((s) => s.detail_id === orderItem.id)) {
        setSelectedScreen("return");
      } else {
        showErrorNotification(
          translateFunction("return this product is not allowed"),
        );
      }
      setIsInitializing(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In initializeReturn in OrderItemOptions",
      });
      setIsInitializing(false);
    }
  };
  const renderScreen = () => {
    if (selectedScreen === "options") {
      return (
        <>
          <div className="flex-col w-full items-center  border-[#E6E6E680] border-b pb-[12px] px-[24px]">
            <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
            <div className="w-[104px] h-[144px] mt-[20px] relative">
              <span
                className="absolute top-0 left-0 z-10 w-full h-[144px] rounded-[15px]"
                style={{
                  boxShadow: "inset 0px 3px 6px #ffffff80",
                }}
              ></span>
              <img
                className="rounded-[15px] h-[144px] object-cover"
                style={{
                  border: "1px solid #ffffff80",
                }}
                src={getConfiguredImage({
                  src: GetImageUrl(orderItem?.image),
                  width: 104,
                  height: 144,
                  q: 100,
                })}
                width={104}
                height={144}
                alt={orderItem?.product_details?.name || "Image"}
              />
            </div>
            <span className="regular text-[12px] mt-[11px] text-[#8D8D8D]">
              {translateFunction("Action About This Product")}
            </span>
          </div>
          <div className="flex-col w-full items-center pb-[12px] px-[24px] mt-[20px]">
            {ShouldShowCahngeColor() && (
              <div
                onClick={() => {
                  setSelectedScreen("changeOrder");
                }}
                className={`cursor-pointer flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] h-[60px] ${
                  isRtl ? "flex-row-reverse" : " "
                }`}
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <img
                    src="/icons/ChangeOrderItemIcon.svg"
                    className="absolute top-0 left-0 right-0 mx-auto my-0"
                  />
                  <img
                    alt={orderItem?.product_details?.name || "Image"}
                    width={15}
                    height={15}
                    className="rounded-full h-[15px] w-[15px] object-cover"
                    src={getConfiguredImage({
                      src: GetImageUrl(orderItem?.image),
                      width: 15,
                      height: 15,
                      q: 100,
                    })}
                  />
                </div>
                <div className="flex-col ml-[15px]">
                  <span
                    className={`regular text-[14px] text-[#1D1D1D] medium ${
                      isRtl ? " text-right pr-2" : " "
                    }`}
                  >
                    {translateFunction("Change Product Request")}
                  </span>
                  <span
                    className={`regular text-[12px] text-[#8D8D8D] ${
                      isRtl ? "pr-2 " : " "
                    }`}
                  >
                    {translateFunction("Change Size, Color, Other")}
                  </span>
                </div>
              </div>
            )}
            {canCancelProduct() && (
              <div
                onClick={() => {
                  setSelectedScreen("cancelProduct");
                }}
                className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                  isRtl ? "flex-row-reverse" : " "
                }`}
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <img src="/icons/OrderCancelIcon.svg" />
                </div>
                <div className="flex-col ml-[15px]">
                  <span
                    className={`regular text-[14px] text-[#1D1D1D] medium ${
                      isRtl ? "text-right pr-2" : " "
                    }`}
                  >
                    {translateFunction("Cancel This Product")}
                  </span>
                  <p
                    className={`regular text-[12px] text-[#8D8D8D] ${
                      isRtl ? "pr-2 " : " "
                    }`}
                  >
                    {translateFunction("Cancel This Product In")}
                    <span className="bold text-[12px] text-[#8D8D8D]  mx-[4px]">
                      3 {translateFunction("Hours")}
                    </span>
                    {translateFunction("And Back Your Money")}
                  </p>
                </div>
              </div>
            )}
            {shouldShowRetutn() && (
              <div
                onClick={() => {
                  if (IsInitializing) return;
                  initializeReturn();
                }}
                className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                  isRtl ? "flex-row-reverse" : " "
                }`}
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <img
                    src="/icons/ReturnOrderItemIcon.svg"
                    className="absolute top-0 left-0 right-0 mx-auto my-0"
                  />
                </div>
                {IsInitializing ? (
                  <div className="flex-col ml-[15px] opacity-85">
                    <span className="regular text-[14px] text-[#1D1D1D] medium">
                      {translateFunction("Initializing Return")}
                    </span>
                    <p className="regular text-[12px] text-[#8D8D8D]">
                      <Spinner />
                    </p>
                  </div>
                ) : (
                  <div className="flex-col ml-[15px]">
                    <span
                      className={`regular text-[14px] text-[#1D1D1D] medium ${
                        isRtl ? " text-right pr-2" : " "
                      }`}
                    >
                      {returnDetails?.return_requests_data
                        ?.find((s) => s.order_id === parentOrder?.id)
                        ?.order_details?.find(
                          (s) => s.detail_id === orderItem?.id,
                        )?.already_return
                        ? translateFunction(
                            "Update Return Request For This Product",
                          )
                        : translateFunction("Return This Product")}
                    </span>
                    <p
                      className={`regular text-[12px] text-[#8D8D8D] ${
                        isRtl ? "pr-2 " : " "
                      }`}
                    >
                      {translateFunction("Return This Product In")}
                      <span className="bold text-[12px] text-[#8D8D8D]  mx-[2px]">
                        24 {translateFunction("Hours")}
                      </span>
                      {translateFunction("And Back Your Money")}
                    </p>
                  </div>
                )}
              </div>
            )}
            {
              <div
                onClick={() => {
                  setSelectedScreen("report");
                }}
                className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                  isRtl ? "flex-row-reverse" : " "
                }`}
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <img src="/icons/ReportOrderItemIcon.svg" />
                </div>
                <div className="flex-col ml-[15px]">
                  <span
                    className={`regular text-[14px] text-[#1D1D1D] medium ${
                      isRtl ? " text-right pr-2" : " "
                    }`}
                  >
                    {translateFunction("Report This Product")}
                  </span>
                  <span
                    className={`regular text-[12px] text-[#8D8D8D] ${
                      isRtl ? "pr-2 " : " "
                    }`}
                  >
                    {translateFunction(
                      "Delivery Time, Delivery Man, Delivery Car",
                    )}
                  </span>
                </div>
              </div>
            }
            {
              <div
                onClick={() => {
                  setSelectedScreen("hide");
                }}
                className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                  isRtl ? "flex-row-reverse" : " "
                }`}
              >
                <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                  <img src="/icons/HideOrderItemIcon.svg" />
                </div>
                <div className="flex-col ml-[15px]">
                  <span
                    className={`regular text-[14px] text-[#1D1D1D] medium ${
                      isRtl ? " text-right pr-2" : " "
                    }`}
                  >
                    {translateFunction("Hide This Product")}
                  </span>
                  <span
                    className={`regular text-[12px] text-[#8D8D8D] ${
                      isRtl ? "pr-2 " : " "
                    }`}
                  >
                    {translateFunction("Hide This Product From My List")}
                  </span>
                </div>
              </div>
            }
          </div>
        </>
      );
    }
    if (selectedScreen === "changeOrder") {
      return (
        <ChangeOrderItem
          isRtl={isRtl}
          order_id={parentOrder.id}
          shouldConfirmChange={ShowConfirmChangeOrder}
          backToMain={() => {
            setSelectedScreen("options");
          }}
          setShouldConfirmChange={setShowConfirmChangeOrder}
          item={orderItem}
        />
      );
    }
    if (selectedScreen === "return") {
      return (
        <ReturnOrderItemWrapper
          backToMain={() => {
            setSelectedScreen("options");
          }}
          isRtl={isRtl}
          order_id={parentOrder?.id}
          setShouldConfirmReturn={(e) => {
            setShouldConfirmReturn(e);
          }}
          item={orderItem}
          returnDetails={returnDetails}
        />
      );
    }
    if (selectedScreen === "cancelProduct") {
      return (
        <CancelOrderItemWrapper
          backToMain={() => {
            setSelectedScreen("options");
          }}
          item={orderItem}
          cancelOrderItem={(e) => {
            setShowConfirmChangeOrder({
              type: "CancelQty",
              qty: orderItem?.qty,
              order_id: parentOrder.id,
              item_id: e,
            });
          }}
        />
      );
    }
  };
  const renderConfirmation = () => {
    if (ShowConfirmChangeOrder) {
      if (ShowConfirmChangeOrder?.type === "CancelQty") {
        return (
          <OrderItemCancelConfirmationWindow
            callback={update}
            close={() => {
              setShowConfirmChangeOrder(null);
            }}
            isRtl={isRtl}
            item_id={orderItem?.id}
            order_id={parentOrder.id}
            qty={ShowConfirmChangeOrder?.qty}
          />
        );
      } else
        return (
          <ModifyOrderItemModal
            close={() => {
              close();
              setShowConfirmChangeOrder(null);
            }}
            confirmationData={ShowConfirmChangeOrder}
            getOrderDetails={update}
            orderItem={orderItem}
            setConfirmationData={setShowConfirmChangeOrder}
            type={ShowConfirmChangeOrder?.type}
          />
        );
    }

    if (selectedScreen === "cancel" && canceled && ShouldConfirmCancel) {
      return <></>;
    }
  };

  return createPortal(
    <>
      <div
        className="absolute top-0   left-0 min-w-screen z-999999998 min-h-screen opacity-40 bg-[black]"
        onClick={() => {
          close();
        }}
      />
      <div className="flex-col max-h-[calc(100vh-100px)] items-center overflow-auto w-full pt-[14px] px-[24px] z-999999999 pb-[27px] absolute bottom-0  left-0 rounded-t-[30px] bg-white">
        {renderScreen()}
      </div>

      {renderConfirmation()}
    </>,
    document.body,
  );
}

export default OrderItemOptions;
