"use client";
import { useEffect, useRef, useState } from "react";

import CartContainer from ".";
import OrdersPage from "./OrdersPage";
import ModalIframe from "./ModalIframe";
import { SlideWidget } from "components/global/SlideNavigation";
import { useAppStore } from "store";
import { GA_GLOBAL_SCREEN, GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import SearchParamUpdater from "components/global/ParamsUpdater";

const CartProvider = () => {
  const { openPayIframe, payIframeURL } = useAppStore();

  useEffect(() => {
    if (openPayIframe) {
      _openIframe(payIframeURL);
    }
  }, [openPayIframe, payIframeURL]);
  const [openIframe, setOpenIframe] = useState({ isShow: false, url: "" });
  const [isLoading, setIsLoading] = useState(false);
  const modalIframeRef = useRef<HTMLDivElement>(null);
  const _openIframe = (url: string) => {
    setIsLoading(true);
    setOpenIframe({ isShow: true, url: url });
  };
  const _closeIframe = () => {
    setOpenIframe({ isShow: false, url: "" });
  };
  const handleIframeLoad = () => {
    setIsLoading(false);
    // init();
  };

  return (
    <>
      {openIframe.isShow && (
        <div
          ref={modalIframeRef}
          className={` ${
            openIframe?.isShow ? "z-[9999999999]" : "z-0"
          } flex fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[12px] gap-[10px] p-[1px] text-[#5D5D5D] items-center justify-start rounded-[10px] h-[90vh] w-[90vw] bg-[#FCFCFC] border border-dashed border-[#006AFF5b]`}
        >
          <ModalIframe
            _closeIframe={_closeIframe}
            handleIframeLoad={handleIframeLoad}
            isLoading={isLoading}
            openIframe={openIframe}
          />{" "}
        </div>
      )}
    </>
  );
};
export default CartProvider;
export const StepSlider = ({ enableCart }) => {
  const { cart_enable: enable, cart, currency, total_cash } = useAppStore();
  const [step, setStep] = useState(0);

  const handleToOrders = () => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.CHECKOUT_SCREEN,
        screen_path: window.location.pathname,
      },
    });
    GAevent({
      action: GA_EVENT_NAMES.BEGIN_CHECKOUT,
      params: {
        value: total_cash,
        items: cart.map((item) => ({
          item_id: item.product_id,
          item_name: item.name,
          price: item.offer_price,
          quantity: item.quantity,
          item_variant: item.variant ?? "N/A",
        })),
      },
    });
    setStep(1);
  };

  const handleBackToCart = () => {
    setStep(0);
  };

  const handleClose = () => {
    enableCart(false);
  };

  return (
    <div className="w-full h-[100vh] fixed z-[9999999999] cart-provider bg-[#fafafa]">
      <SearchParamUpdater searchKey="cart" searchValue={"true"} />
      <SlideWidget step={step} duration={400}>
        <div className="w-full h-full cart-widget">
          <CartContainer toOrders={handleToOrders} close={handleClose} />
        </div>
        <div className="w-full h-full cart-widget">
          <OrdersPage setStep={handleBackToCart} close={handleClose} />
        </div>
      </SlideWidget>
    </div>
  );
};
