"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { expandView, normalizeView } from "utils/functions";
import CartContainer from ".";
import home from "services/home";
import OrdersPage from "./OrdersPage";
import ModalIframe from "./ModalIframe";
import { SlideWidget } from "components/global/SlideNavigation";

import { useAppStore } from "store";
import {
  DetectScreen,
  EnableScroll,
  getCurrency,
  getReferralSource,
} from "utils/tinyUtils";
import AddToCartComponent from "./AddToCartComponent";
import { GA_GLOBAL_SCREEN, GA_EVENT_NAMES } from "utils/GAEvents";

import { GAevent } from "utils/gtag";
import auth from "services/auth";
import { getCookie } from "utils/cookies/cookie-manager";

const CartProvider = () => {
  const {
    enableCart,
    disableAddToCartOption,
    setEnableSearch,
    setLoginOpen,
    setSelectedStory,

    setCurrency,
    setChatOpen,
    filterEnabled,
    openPayIframe,
    payIframeURL,
    cart_enable: enable,
    selected_product_for_add_to_cart,
    setSelectedProductForCart,
    setAddStory,
  } = useAppStore();

  const pathname = usePathname();
  const router = useRouter();
  // @ts-ignore
  const searchParams = useSearchParams();

  const enableCartAction = (s) => {
    disableAddToCartOption();
    window.history.pushState({ isPopup: true }, "open Cart");
    enableCart(s);
    if (s) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("cart", "true");
      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("cart");

      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'

      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    }
  };
  useEffect(() => {
    setTimeout(() => {
      if (
        !searchParams.get("changed-country") &&
        !searchParams.get("no-country")
      ) {
        home.getClientData();
        getCurrency({
          callback: (data) => {
            setCurrency(data.currency);
          },
        });
      }
    }, 10);
    window.addEventListener("popstate", (event) => {
      if (event.state?.isPopup) {
        let params = new URLSearchParams(searchParams);
        params.delete("cart");
        params.delete("modal");
        params.delete("story");
        params.delete("search");
        // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
        router.push(`${pathname}?${params.toString()}`, { shallow: true });
        setSelectedStory(null);
        enableCart(false);
        setLoginOpen(false);
        setChatOpen(false);
        setEnableSearch(false);
        EnableScroll();
        setSelectedProductForCart(null);
        setAddStory(null);
        // @ts-ignore
        document.querySelector(`#search-element`)?.blur();
      }
    });
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 80) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("cart")) {
      enableCartAction(true);
    }
    let couponUrlVar = searchParams.get("coupon");
    let selectedUrlVar = searchParams.get("selected");
    setTimeout(() => {
      if (couponUrlVar?.length > 0) {
        let reffere = getCookie("referer");
        GAevent({
          action: GA_EVENT_NAMES.COUPON_VIEWED,
          params: {
            user_id_custom: auth?.UserID(),
            coupon_id: couponUrlVar,
            coupon_code: couponUrlVar,
            screen_name: DetectScreen(),
            screen_path: window.location.pathname,
            referral_source: getReferralSource(reffere),
          },
        });
        localStorage.setItem("coupon-number", couponUrlVar);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("coupon");
        router.replace(newParams.size ? `${pathname}?${newParams}` : pathname);
      }
      if (selectedUrlVar) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("selected");
        router.replace(newParams.size ? `${pathname}?${newParams}` : pathname);
      }
    }, 1000);
  }, []);
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
      {enable ? <StepSlider enableCart={(e) => enableCartAction(e)} /> : <></>}
      {selected_product_for_add_to_cart && (
        <AddToCartComponent
          enableCartAction={enableCartAction}
          close={() => {
            setSelectedProductForCart(null);
          }}
          product={selected_product_for_add_to_cart}
          slug={selected_product_for_add_to_cart?.slug}
        />
      )}
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
