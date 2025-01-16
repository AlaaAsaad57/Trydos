import React, { useRef, useState } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import { Sendevent, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import ShippingAddressContainer from "./ShippingAddressContainer";
import { Swiper as SwiperType } from "node_modules/swiper/types";
import AddAddressIcon from "public/svg/cart/AddAddress.svg";
import AddAddressForm from "./AddAddressForm";
import { useDispatch } from "node_modules/react-redux/es";
import SelectRegion from "./SelectRegion";

function OrdersPage({ setStep }: { setStep: (e: number) => void }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };
  const [orderStep, setOrderStep] = useState(0);
  const ref = useRef<SwiperType>();
  const dispatch = useDispatch();
  const setAddressDetails = (e) => {
    dispatch({ type: "set-address-details", payload: e });
  };
  const [openSelect, setOpenSelect] = useState(false);
  const colseSelect = () => {
    document
      .querySelector(".select-animation-in")
      .classList.add("select-animation-out");
    setTimeout(() => {
      setOpenSelect(false);
    }, 300);
  };
  return (
    <div
      className={`pb-[10px]
     flex-col relative  top-0 left-0 min-h-[100vh] max-h-[100vh] h-auto overflow-hidden w-full bg-[#ffffff] min-w-[100vw] z-[9999999999] pt-1`}
    >
      {openSelect && (
        <SelectRegion
          closeSelect={() => {
            colseSelect();
          }}
        />
      )}
      <Swiper
        initialSlide={orderStep}
        navigation={false}
        onInit={(swiper) => {
          ref.current = swiper;
        }}
        allowTouchMove={false}
        draggable={false}
        className="w-full"
        slidesPerView={1}
        wrapperClass="flex  h-[100vh]"
      >
        <SwiperSlide className="min-w-[100vw] h-[100vh] relative cart-widget">
          <div className="flex-col pl-2 pr-2 bg-[#fff] p-1">
            <div className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center ">
              <BackIcon
                className="cursor-pointer z-50"
                onClick={() => {
                  Sendevent({
                    event: "button_clicked",
                    value: "appbar_backicon_button",
                  });
                  setStep(0);
                }}
              />
              <span className="text-[13px] text-[#505050] regular flex-row items-center ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                >
                  <defs>
                    <clipPath id="clip-path22">
                      <rect
                        id="Rectangle_4612"
                        data-name="Rectangle 4612"
                        width="18"
                        height="18"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_380"
                    data-name="Mask Group 380"
                    clip-path="url(#clip-path22)"
                  >
                    <g
                      id="delivery_location"
                      transform="translate(1.163 -0.036)"
                    >
                      <g id="Group_11335" data-name="Group 11335">
                        <g
                          id="Group_11333"
                          data-name="Group 11333"
                          transform="translate(0 4.8)"
                        >
                          <path
                            id="Path_21554"
                            data-name="Path 21554"
                            d="M13.317,15.143H7.281a.218.218,0,0,1-.218-.233.227.227,0,0,1,.218-.233h6.036a2.054,2.054,0,0,0,2.109-2.109,2.05,2.05,0,0,0-.524-1.295,2.085,2.085,0,0,0-1.585-.684h-3.8a2.473,2.473,0,1,1,0-4.945h3.1a.218.218,0,0,1,.218.233.207.207,0,0,1-.233.2H9.521a2.029,2.029,0,0,0,0,4.058h3.8a2.5,2.5,0,0,1,2.56,2.414,2.534,2.534,0,0,1-2.56,2.589Z"
                            transform="translate(-2.147 -5.645)"
                            fill="#1d1d1d"
                          />
                          <g
                            id="Group_11332"
                            data-name="Group 11332"
                            transform="translate(0 6.313)"
                          >
                            <ellipse
                              id="Ellipse_269"
                              data-name="Ellipse 269"
                              cx="0.975"
                              cy="0.989"
                              rx="0.975"
                              ry="0.989"
                              transform="translate(1.702 1.687)"
                              fill="#1d1d1d"
                            />
                            <path
                              id="Path_21555"
                              data-name="Path 21555"
                              d="M4.289,12.645a2.645,2.645,0,0,0-2.676,2.6,2.464,2.464,0,0,0,.509,1.513v.015l1.964,2.705a.227.227,0,0,0,.175.087.207.207,0,0,0,.175-.087l1.993-2.705a.014.014,0,0,1,.015-.015,2.526,2.526,0,0,0,.509-1.513A2.623,2.623,0,0,0,4.289,12.645Zm0,4.1a1.44,1.44,0,1,1,1.425-1.44A1.431,1.431,0,0,1,4.289,16.747Z"
                              transform="translate(-1.613 -12.645)"
                              fill="#1d1d1d"
                            />
                          </g>
                        </g>
                        <g
                          id="Group_11334"
                          data-name="Group 11334"
                          transform="translate(9.658)"
                        >
                          <path
                            id="Path_21556"
                            data-name="Path 21556"
                            d="M12.323,3.3h6.051L15.348.323Z"
                            transform="translate(-12.323 -0.323)"
                            fill="#1d1d1d"
                          />
                          <path
                            id="Path_21557"
                            data-name="Path 21557"
                            d="M12.984,7.969h1.367v-1.8a.227.227,0,0,1,.218-.233h1.687a.218.218,0,0,1,.218.233v1.8h1.367V4.129H12.984Z"
                            transform="translate(-12.388 -0.696)"
                            fill="#1d1d1d"
                          />
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>
                <span className="regular ml-[8px]">
                  <>{translate("Bag Shipping & Delivery Address")}</>
                </span>
              </span>
              <span />
            </div>
          </div>
          <ShippingAddressContainer
            slideNext={() => {
              ref.current.slideNext();
            }}
            slidePrev={() => {
              ref.current.slidePrev();
            }}
          />
        </SwiperSlide>
        <SwiperSlide className="min-w-[100vw] relative max-h-[100vh]  h-[100vh] cart-widget overflow-hidden pb-[165px]">
          <div className="flex-col pl-2 pr-2 bg-[#fff] p-1">
            <div className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center ">
              <BackIcon
                className="cursor-pointer z-50"
                onClick={() => {
                  Sendevent({
                    event: "button_clicked",
                    value: "appbar_backicon_button",
                  });
                  ref.current.slidePrev();
                }}
              />
              <span className="text-[13px] text-[#505050] regular flex-row items-center ">
                <AddAddressIcon />
                <span className="regular ml-[8px]">
                  <>{translate("Add Shipping Address")}</>
                </span>
              </span>
              <span />
            </div>
          </div>
          <AddAddressForm
            setOpenSelect={() => {
              setOpenSelect(true);
            }}
            slidePrev={() => {
              ref.current.slidePrev();
            }}
            setAddressDetails={(e) => {
              setAddressDetails(e);
            }}
          />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}

export default OrdersPage;
