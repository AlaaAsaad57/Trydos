"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import home from "services/home";

import ModalIframe from "./ModalIframe";
import { SlideWidget } from "components/global/SlideNavigation";
import dynamic from "next/dynamic";
const CartContainer = dynamic(() => import("."), {
  ssr: false,
  loading: () => <CartSkeleton />,
});
const OrdersPage = dynamic(() => import("./OrdersPage"), {
  ssr: false,
  loading: () => <OrdersPageSkeleton />,
});
import { useAppStore } from "store";
import {
  DetectScreen,
  EnableScroll,
  getCurrency,
  getReferralSource,
} from "utils/tinyUtils";
import AddToCartComponent from "./AddToCart/AddToCartComponent";
import { GA_GLOBAL_SCREEN, GA_EVENT_NAMES } from "utils/GAEvents";

import { GAevent } from "utils/gtag";
import { ORDER_EVENTS, startOrderAttempt, trackOrder } from "utils/orderFunnel";
import auth from "services/auth";
import { getCookie } from "utils/cookies/cookie-manager";
import SearchParamUpdater from "components/global/ParamsUpdater";
import { markBackClosing, takeSelfConsume } from "utils/popupHistory";
import CartSkeleton from "components/skeleton/CartSkeleton";
import OrdersPageSkeleton from "components/skeleton/OrdersPageSkeleton";

const CartProvider = ({ language, country }) => {
  const {
    enableCart,
    disableAddToCartOption,
    setEnableSearch,
    setLoginOpen,
    setSelectedStory,
    setAppLanguage,
    setAppCountry,
    setCurrency,
    setChatOpen,
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
    enableCart(s);
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
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.isPopup) {
        // A popup closing via React state consumes its own history entry with
        // history.back(); that lands here on the entry underneath. Leave any
        // popup still open below it alone (e.g. the cart during checkout→login).
        if (takeSelfConsume()) return;

        // A real user back-press: tell the unmount cleanups it triggers not to
        // history.back() again.
        markBackClosing();

        // Read the LIVE location, not the pathname/searchParams captured when
        // this listener was registered. CartProvider lives in the persistent
        // layout, so the closure would otherwise always point at the page the
        // app first loaded (usually home) and yank the user there from any
        // other route (e.g. /settings) when an orphaned `isPopup` history
        // entry — pushed by a popup that was closed via React state instead of
        // history.back() — is traversed.
        const params = new URLSearchParams(window.location.search);
        params.delete("cart");
        params.delete("modal");
        params.delete("story");
        params.delete("search");
        const query = params.toString();
        router.push(
          query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname,
          // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
          { shallow: true },
        );
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
    };
    window.addEventListener("popstate", handlePopState);
    setAppLanguage(language);
    setAppCountry(country);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
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
  const Search_Params = useSearchParams();
  return (
    <>
      {enable ? <StepSlider enableCart={(e) => enableCartAction(e)} /> : <></>}
      {selected_product_for_add_to_cart && (
        <AddToCartComponent
          color={
            selected_product_for_add_to_cart?.active_color ??
            Search_Params?.get("color") ??
            selected_product_for_add_to_cart?.sync_color_images?.[0]
              ?.color_option ??
            selected_product_for_add_to_cart?.sync_color_images?.[0]?.color_name
          }
          product={selected_product_for_add_to_cart}
          slug={selected_product_for_add_to_cart?.slug}
        />
      )}
      {openIframe.isShow && (
        <div
          ref={modalIframeRef}
          className={` ${
            openIframe?.isShow ? "z-9999999999" : "z-0"
          } flex fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[12px] gap-[10px] p-px text-[#5D5D5D] items-center justify-start rounded-[10px] h-[90vh] w-[90vw] bg-[#FCFCFC] border border-dashed border-[#006AFF5b]`}
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
const StepSlider = ({ enableCart }) => {
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
    // Funnel anchor: mint the attempt id BEFORE the begin_checkout event so it
    // carries the correlation id, then every later step shares it.
    startOrderAttempt();
    trackOrder(ORDER_EVENTS.BEGIN_CHECKOUT, {
      value: total_cash,
      item_count: cart.length,
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
    <div className="w-full h-screen fixed z-9999999999 cart-provider bg-[#fafafa]">
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
