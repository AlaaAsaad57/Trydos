import React, { useState } from "react";
import { OrderInterface } from "utils/types/OrderInterface";
import OrderItemBanner from "./OrderItemBanner";
import { translateFunction } from "utils/functions";

import ChangeAddressWidget from "components/Orders/ChangeAddressWidget";
import CancelOrderWrapper from "./CancelOrderWrapper";
import OrderCancelConfirmationWindow from "./confirmations/OrderCancelConfirmationWindow";
import { ORDER_MGMT_EVENTS, trackOrderMgmt } from "utils/orderFunnel";
import { createPortal } from "react-dom";
import { ConfirmModal } from "components/global/ConfirmModal";
import Order from "services/order";
import { LogError } from "utils/functions";

function OrderOptionsMenu({
  order,
  close,
  update,
  isRtl,
  onHidden,
}: {
  order: OrderInterface;
  close: () => void;
  update?: () => Promise<any>;
  isRtl: boolean;
  onHidden?: () => void;
}) {
  const [canceled, setCanceled] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [hiding, setHiding] = useState(false);
  const handleHideOrder = async () => {
    try {
      setHiding(true);
      await Order.HideOrder({ order_id: order.id });
      setHiding(false);
      setShowHideConfirm(false);
      close();
      // Hiding an order removes it from the list, so leave the details page and
      // refresh the orders list rather than re-fetching a now-hidden order.
      onHidden?.();
    } catch (error) {
      setHiding(false);
      LogError({
        error: error,
        scenario: "Error In handleHideOrder in OrderOptionsMenu",
      });
    }
  };
  const [ShouldConfirmCancel, setShouldConfirmCancel] = useState<
    boolean | string[]
  >(false);
  const shouldShowChangeAddress = () => {
    return order.can_update_address;
  };
  const [selectedScreen, setSelectedScreen] = useState("options");
  React.useEffect(() => {
    trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_OPTIONS_OPENED, {
      order_id: order?.id,
      order_group_id: order?.order_group_id,
      order_status: order?.order_status?.value,
    });
  }, []);
  const renderScreen = () => {
    if (selectedScreen === "options") {
      return (
        <div className="flex-col max-h-[calc(100vh-100px)] items-center overflow-auto w-full pt-[14px] px-[24px] z-999999999 pb-[27px] absolute bottom-0  left-0 rounded-t-[30px] bg-white">
          <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
          <div className="flex-col  items-center w-full justify-center flex-1">
            <OrderItemBanner
              isRtl={isRtl}
              key={order.order_group_id}
              order={order}
            />
            {!canceled && (
              <>
                <span className="regular text-[12px] mt-[11px] text-[#8D8D8D]">
                  {translateFunction("Action About Your Order")}
                </span>
                <div
                  className="w-full h-px mt-[12px]"
                  style={{ borderTop: "1px solid #C4C2C280" }}
                />
              </>
            )}
            {!canceled && (
              <>
                {shouldShowChangeAddress() && (
                  <div
                    onClick={() => {
                      setSelectedScreen("changeAddress");
                    }}
                    className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                      isRtl ? "flex-row-reverse" : " "
                    }`}
                  >
                    <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                      <img src="/icons/ChangeAddressIcon.svg" />
                    </div>
                    <div className="flex-col ml-[15px]">
                      <span
                        className={`regular text-[14px] text-[#1D1D1D] medium ${
                          isRtl ? " text-right pr-2" : " "
                        }`}
                      >
                        {translateFunction("Change Delivery Address & Note")}
                      </span>
                      <p
                        className={`regular text-[12px] text-[#8D8D8D] ${
                          isRtl ? "pr-2 text-right" : " "
                        }`}
                      >
                        {translateFunction("You Can Change Delivery Address")}
                      </p>
                    </div>
                  </div>
                )}
                {
                  <div
                    onClick={() => {
                      trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_PACK_HIDDEN, {
                        order_id: order?.id,
                        order_group_id: order?.order_group_id,
                      });
                      setShowHideConfirm(true);
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
                        {translateFunction("Hide This Pack")}
                      </span>
                      <p
                        className={`regular text-[12px] text-[#8D8D8D] ${
                          isRtl ? "pr-2 " : " "
                        }`}
                      >
                        {translateFunction("Hide This Pack From My List")}
                      </p>
                    </div>
                  </div>
                }
                {order.can_cancele_order && (
                  <div
                    onClick={() => {
                      setSelectedScreen("cancelOrder");
                      setCanceled(true);
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
                          isRtl ? " text-right pr-2" : " "
                        }`}
                      >
                        {translateFunction("Cancel This Pack")}
                        <span className="mx-1 bold">{order?.id}</span>
                      </span>
                      <p
                        className={`regular text-[12px] text-[#8D8D8D] ${
                          isRtl ? "pr-2 " : " "
                        }`}
                      >
                        {translateFunction(
                          "You Can Cancel This Pack And Back Your Money"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    if (selectedScreen === "changeAddress") {
      return (
        <ChangeAddressWidget
          ActivePacks={order}
          getOrderDetails={update}
          close={() => {
            close();
            setSelectedScreen("options");
          }}
          address_id={order?.shipping_address}
        />
      );
    }
    if (selectedScreen === "cancelOrder") {
      return (
        <div className="flex-col max-h-[calc(100vh-100px)] items-center overflow-auto w-full pt-[14px] px-[24px] z-999999999 pb-[27px] absolute bottom-0  left-0 rounded-t-[30px] bg-white">
          <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
          <div className="flex-col  items-center w-full justify-center flex-1">
            <OrderItemBanner
              isRtl={isRtl}
              key={order.order_group_id}
              order={order}
            />
            {!canceled && (
              <>
                <span className="regular text-[12px] mt-[11px] text-[#8D8D8D]">
                  {translateFunction("Action About Your Order")}
                </span>
                <div
                  className="w-full h-px mt-[12px]"
                  style={{ borderTop: "1px solid #C4C2C280" }}
                />
              </>
            )}
          </div>
          <CancelOrderWrapper
            order={order}
            isRtl={isRtl}
            setShouldConfirmCancel={(e) => setShouldConfirmCancel(e)}
          />
        </div>
      );
    }
  };
  const renderConfirmation = () => {
    if (selectedScreen === "cancelOrder" && canceled && ShouldConfirmCancel) {
      return (
        <OrderCancelConfirmationWindow
          isRtl={isRtl}
          callback={async () => await update()}
          cancelReasons={
            Array.isArray(ShouldConfirmCancel) ? ShouldConfirmCancel : []
          }
          order={order}
          close={() => {
            setCanceled(false);
            setSelectedScreen("options");
            setShouldConfirmCancel(false);
          }}
        />
      );
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
      {renderScreen()}
      {renderConfirmation()}
      {showHideConfirm && (
        <ConfirmModal
          showModal={showHideConfirm}
          loading={hiding}
          type={"Delete"}
          confirmTilte={"Hide This Pack"}
          confirmMessage={"Are you sure you want to hide this order?"}
          onCancel={() => setShowHideConfirm(false)}
          onConfirm={handleHideOrder}
          dataCy="confirm-hide-order"
        />
      )}
    </>,
    document.body
  );
}

export default OrderOptionsMenu;
