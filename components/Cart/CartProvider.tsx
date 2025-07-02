"use client";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { expandView, normalizeView, RoundPrice } from "utils/functions";
import CartContainer from ".";
import home from "services/home";
import { Swiper, SwiperSlide } from "swiper/react";
import OrdersPage from "./OrdersPage";
import { Swiper as SwiperType } from "swiper/types";
import ModalIframe from "./ModalIframe";

import { useAppStore } from "store";
import { getCurrency } from "utils/tinyUtils";
import AddToCartComponent from "./AddToCartComponent";
import {
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
  GA_EVENT_NAMES,
} from "utils/GAEvents";

import { GAevent } from "utils/gtag";

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
  } = useAppStore();

  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useParams();
  // @ts-ignore
  const [country, language] = lang?.split("-");
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
        setSelectedStory(null);
        enableCart(false);
        setLoginOpen(false);
        setChatOpen(false);
        setEnableSearch(false);
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
          color={selected_product_for_add_to_cart?.colors?.[0]}
          size={
            selected_product_for_add_to_cart?.choice_options?.[0]?.options?.[0]
          }
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
  const ref = useRef<SwiperType | null>();

  return (
    <div className="w-full h-[100vh] fixed z-[9999999999] cart-provider">
      <Swiper
        initialSlide={step}
        navigation={false}
        keyboard={{
          enabled: false,
        }}
        draggable={false}
        className="w-full h-full"
        wrapperClass="flex flex-row items-stretch"
        noSwiping={false}
        allowTouchMove={false}
        slidesPerView={1}
        onInit={(swiper) => {
          ref.current = swiper;
        }}
      >
        <SwiperSlide className="w-full h-full cart-widget">
          <CartContainer
            toOrders={() => {
              GAevent({
                action: GA_EVENT_NAMES.SCREEN_VIEW,
                params: {
                  screen_name: GA_GLOBAL_SCREEN.CHECKOUT_SCREEN,
                  platform: GA_GLOBAL_PLATFORM.WEB,
                  timestamp: new Date().toISOString(),
                  screen_path: window.location.pathname,
                },
              });
              GAevent({
                action: GA_EVENT_NAMES.BEGIN_CHECKOUT,
                params: {
                  value: RoundPrice({
                    num: total_cash,
                    rate: currency.exchange_rate,
                    returnNumber: true,
                  }),
                  items: cart.map((item) => ({
                    item_id: item.product_id,
                    item_name: item.name,
                    price: RoundPrice({
                      num: item.offer_price,
                      rate: currency.exchange_rate,
                      returnNumber: true,
                    }),
                    quantity: item.quantity,
                    item_variant: item.variant ?? "N/A",
                  })),
                },
              });
              ref.current.slideNext();
              setStep(1);
            }}
            close={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.APPBAR_BACKICON_BUTTON,
              // });
              enableCart(false);
            }}
          />
        </SwiperSlide>
        <SwiperSlide className="w-full h-full cart-widget">
          {({ isActive }) =>
            isActive ? (
              <>
                <OrdersPage
                  setStep={(e) => {
                    setStep(0);
                    ref.current.slidePrev();
                  }}
                  close={() => {
                    enableCart(false);
                  }}
                />
              </>
            ) : (
              <></>
            )
          }
        </SwiperSlide>
      </Swiper>
    </div>
  );
};
