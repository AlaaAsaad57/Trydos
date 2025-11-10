import { useEffect } from "react";

import OrderSuccessIcon from "public/svg/cart/OrderSuccess";
import { RoundPrice, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import auth from "services/auth";
function OrderSuccess() {
  const { orderData, currency, total_shipping_cost, cart } = useAppStore();
  const getTotalCash = () => {
    let total = 0;
    orderData.data.map((item) => {
      total += item.order_amount;
    });
    return total;
  };
  useEffect(() => {
    if (orderData.success) {
      setTimeout(() => {
        document.querySelector(".order-sucess").scrollIntoView();
      }, 200);
      GAevent({
        action: GA_EVENT_NAMES.SCREEN_VIEW,
        params: {
          screen_name: GA_GLOBAL_SCREEN.ORDER_SUCCESS_SCREEN,

          screen_path: window.location.pathname,
        },
      });
      GAevent({
        action: GA_EVENT_NAMES.PURCHASE,
        params: {
          transaction_id: orderData?.data[0]?.order_group_id,
          value: getTotalCash(),
          currency: currency?.code,
          shipping: total_shipping_cost,
          coupon_code: orderData.coupon_number,
          coupon_id: orderData.coupon_number,
          coupon_discount_rate: orderData.coupon,
          items: cart.map((item) => ({
            item_id: item.product_id,
            item_name: item.name,
            quantity: item.quantity,
            price: item.offer_price,
            brand: item.brand?.name ?? "N/A",
            brand_id: item.brand?.id ?? "N/A",
            category: item?.category_name ?? "N/A",
            category_id: item?.category?.id ?? "N/A",
            item_variant: item.variant ?? "N/A",
          })),
          user_id_custom: auth.UserID(),
          interaction_type: "purchase",
          screen_name: GA_GLOBAL_SCREEN.ORDER_SUCCESS_SCREEN,
          screen_path: window.location.pathname,
        },
      });
      if (orderData?.coupon_number?.length > 0) {
        GAevent({
          action: GA_EVENT_NAMES.COUPON_USED,
          params: {
            user_id_custom: auth.UserID(),
            coupon_id: orderData.coupon_number,
            coupon_code: orderData.coupon_number,
            coupon_discount_rate: orderData.coupon,
            transaction_id: orderData?.data[0]?.order_group_id,
          },
        });
      }
    }
  }, [orderData.success]);
  return (
    <div
      className={`transition-all justify-center  order-sucess items-center flex-col ${
        orderData.success ? "min-h-[300px]" : "h-0 overflow-hidden"
      }`}
      data-cy="The-Purchas"
    >
      <OrderSuccessIcon />
      <span className="regular text-[14px] text-[#1d1d1d] mt-[11px]">
        {translateFunction("The Purchase Was Completed Successfully")}
      </span>
      <span className="regular text-[12px] text-[#1d1d1d] mt-[11px]">
        {translateFunction("Your Order Number")}
      </span>
      <span
        className="bold text-[20px] text-[#404040] mt-[6px]"
        data-cy="order-group-id"
      >
        {/* @ts-ignore */}
        {orderData?.data[0]?.order_group_id}
      </span>
      <div className="flex-row mt-[11px] items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="14"
          viewBox="0 0 12 14"
        >
          <path
            id="invoices"
            d="M38.3,1.721a3.035,3.035,0,0,0-3,3.062,3,3,0,1,0,6,0A3.035,3.035,0,0,0,38.3,1.721Zm-.068,2.8.273.087a.7.7,0,0,1,.481.668v.094a.7.7,0,0,1-.543.685v.074a.229.229,0,1,1-.457,0V5.989a.7.7,0,0,1-.371-.622.229.229,0,1,1,.457,0,.229.229,0,1,0,.457,0V5.272a.232.232,0,0,0-.16-.223L38.1,4.963a.7.7,0,0,1-.481-.668V4.2a.7.7,0,0,1,.457-.66v-.1a.229.229,0,1,1,.457,0v.1a.7.7,0,0,1,.457.66.229.229,0,1,1-.457,0,.229.229,0,1,0-.457,0v.094A.232.232,0,0,0,38.233,4.517Zm2.175,9.016a1.156,1.156,0,0,1-1.135-1.167v-3.9A.229.229,0,0,0,39,8.241a3.482,3.482,0,0,1-4.155-3.457A3.482,3.482,0,0,1,39,1.326a.229.229,0,0,0,.274-.228V.933A.924.924,0,0,0,38.358,0H30.929a.924.924,0,0,0-.914.933V12.367A1.617,1.617,0,0,0,31.615,14h8.8a.231.231,0,0,0,.228-.252A.236.236,0,0,0,40.408,13.533ZM32.244,3.413h1.943a.233.233,0,0,1,0,.467H32.244a.233.233,0,0,1,0-.467Zm0,2.625h1.943a.233.233,0,0,1,0,.467H32.244a.233.233,0,0,1,0-.467Zm4.8,5.542h-4.8a.233.233,0,0,1,0-.467h4.8a.233.233,0,0,1,0,.467Zm0-2.45h-4.8a.233.233,0,0,1,0-.467h4.8a.233.233,0,0,1,0,.467Zm4.971,2.887a1.142,1.142,0,1,1-2.284,0c0-2.155,0-2.995,0-3.327a.231.231,0,0,1,.229-.232H41.1a.922.922,0,0,1,.91.841Z"
            transform="translate(-30.015 0)"
            fill="#1d1d1d"
          />
        </svg>
        <span className="regular text-[12px] text-[#404040] ml-[6px]">
          {translateFunction("Order Invoice")}
        </span>
      </div>
      <InfoOrder />
    </div>
  );
}

export default OrderSuccess;
const InfoOrder = () => {
  return (
    <div className="flex-col items-center mt-[20px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 18 18"
      >
        <g
          id="Group_3387"
          data-name="Group 3387"
          transform="translate(-52.863 -489.277)"
        >
          <path
            id="Path_15434"
            data-name="Path 15434"
            d="M177.934,126.993h-.047a1.6,1.6,0,1,0,0,3.192h.047a1.6,1.6,0,1,0,0-3.192Z"
            transform="translate(-117.209 366.685)"
            fill="#388cff"
          />
          <path
            id="Path_15435"
            data-name="Path 15435"
            d="M179.184,237.18h-2.547a.346.346,0,0,0-.346.346v6.316a.346.346,0,0,0,.346.346h2.547a.346.346,0,0,0,.346-.346v-6.316A.346.346,0,0,0,179.184,237.18Z"
            transform="translate(-117.209 260.783)"
            fill="#388cff"
          />
          <path
            id="Path_15436"
            data-name="Path 15436"
            d="M7.845,60.315A7.693,7.693,0,0,0,2.3,62.674,8.2,8.2,0,0,0,2.535,74.3l-.126,1.479a.365.365,0,0,0,.134.315.346.346,0,0,0,.331.058l1.538-.537a7.6,7.6,0,0,0,3.433.81,7.693,7.693,0,0,0,5.548-2.359,8.2,8.2,0,0,0,0-11.387A7.693,7.693,0,0,0,7.845,60.315Zm0,15.383A6.915,6.915,0,0,1,4.6,74.9a.345.345,0,0,0-.274-.02l-1.166.407.094-1.106a.366.366,0,0,0-.118-.3A7.421,7.421,0,0,1,.7,68.368a7.245,7.245,0,0,1,7.14-7.331,7.333,7.333,0,0,1,0,14.661Z"
            transform="translate(52.863 430.857)"
            fill="#388cff"
          />
          <path
            id="Path_15437"
            data-name="Path 15437"
            d="M379.867,5.522a.346.346,0,1,0,0,.692,3.553,3.553,0,0,1,3.544,3.553.346.346,0,0,0,.692,0A4.245,4.245,0,0,0,379.867,5.522Z"
            transform="translate(-313.24 483.755)"
            fill="#388cff"
          />
          <path
            id="Path_15438"
            data-name="Path 15438"
            d="M390.388,56.12a.346.346,0,1,0,0,.692,1.438,1.438,0,0,1,1.434,1.438.346.346,0,1,0,.692,0A2.13,2.13,0,0,0,390.388,56.12Z"
            transform="translate(-323.399 434.907)"
            fill="#388cff"
          />
        </g>
      </svg>
      <div className="flex-col items-center regular text-[12px] text-[#388CFF]">
        <span className="">
          {translateFunction("You Can Track The Status Of Your Order Through ")}
        </span>
        <span className="medium">
          {translateFunction("My Account / My Orders")}
        </span>
      </div>
    </div>
  );
};
