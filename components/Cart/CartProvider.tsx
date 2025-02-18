"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { expandView, normalizeView, Sendevent } from "utils/functions";
import CartContainer from ".";
import home from "services/home";
import { Swiper, SwiperSlide } from "swiper/react";
import OrdersPage from "./OrdersPage";
import { Swiper as SwiperType } from "node_modules/swiper/types";
import ModalIframe from "./ModalIframe";
import { ToastContainer } from "react-toastify";
const CartProvider = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const filterEnabled = useSelector(
    (state: StateInterface) => state.listing.filterEnabled
  );
  const enableCart = (s) => {
    dispatch({ type: "AddToCartOptionDisable", payload: false });
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: s });
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
      home.getClientData();
      home.GetFireBaseSettings();
    }, 10);
    window.addEventListener("popstate", (event) => {
      if (event.state?.isPopup) {
        dispatch({ type: "STORY-SELECTED", payload: null });
        dispatch({ type: "ENABLE-CART", payload: false });
        dispatch({ type: "LOGIN-OPEN", payload: false });
        dispatch({ type: "CHAT-OPEN", payload: false });
        dispatch({ type: "ENABLE-SEARCH", payload: false });
      }
    });
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 66) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("cart")) {
      enableCart(true);
    }
  }, []);
  const cartEnable = useSelector((state: StateInterface) => state.cart.enable);
  const showMessage = useSelector(
    (state: StateInterface) => state.homepage.showMessage
  );
  const { openPayIframe, payIframeURL } = useSelector(
    (state: StateInterface) => state.cart
  );
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
      {/* {showMessage && <ShowMessageAuth />} */}
      {cartEnable ? <StepSlider enableCart={(e) => enableCart(e)} /> : <></>}
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
  const [step, setStep] = useState(0);
  const ref = useRef<SwiperType | null>();
  return (
    <div className="w-full h-[100vh] fixed z-[9999999999] cart-provider">
      <ToastContainer position="top-right" />
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
              ref.current.slideNext();
              setStep(1);
            }}
            close={() => {
              Sendevent({
                event: "button_clicked",
                value: "appbar_backicon_button",
              });
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
