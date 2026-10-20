import { useEffect, useState } from "react";

import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import {
  getCart,
  LogError,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { pollinateInput } from "@/utils/tinyUtils";
import { REQUESTS_DATA } from "utils/Requests";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";

type CouponElementProps = {
  active: any;
  setActive: any;
  close: any;
  language?: string;
};

const CouponElement = ({
  active,
  setActive,
  close,
  language,
}: CouponElementProps) => {
  const {
    setOrderData,
    initCart,
    orderData,
    currency,
    coupon_discount,
    coupon_code,
  } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  // The cart answer carries the applied code. The typed code covers the moment
  // before the cart reload lands.
  const appliedCode =
    typeof coupon_code === "string" && coupon_code
      ? coupon_code
      : orderData.coupon_number;
  const [coupon, setCoupon] = useState<number | false | string>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (coupon_discount && coupon_discount > 0 && !active) {
      setCoupon(coupon_discount);
      setActive(true);
    }
  }, [coupon_discount, active, setActive]);

  const onChange = (e) => {
    setOrderData({ coupon_number: e });
  };

  const applyCoupon = async (e?) => {
    if (!orderData.coupon_number && !e) return;
    if (coupon) return;
    setLoading(true);
    setError("");

    const couponCode = e ?? orderData.coupon_number;
    trackOrder(ORDER_EVENTS.COUPON_APPLY_ATTEMPT, { coupon_code: couponCode });
    try {
      const response = await fetchData({
        url: `/coupon/apply?code=${encodeURIComponent(couponCode)}`,
        reqTitle: REQUESTS_DATA.APPLY_COUPON_REQUEST,
        method: "GET",
        server: "market",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      if (!response.data.status) {
        localStorage.removeItem("coupon-number");
        throw new Error(response.message);
      }

      await getCart({
        callback: ([data]) => {
          initCart(data ?? { cart: [] });
        },
      });
      localStorage.removeItem("coupon-number");

      setCoupon(response?.data?.discount);
      trackOrder(ORDER_EVENTS.COUPON_APPLY_SUCCEEDED, {
        coupon_code: couponCode,
        discount_value: response?.data?.discount,
      });
    } catch (err) {
      LogError({
        error: err,
        scenario: "Apply Coupon widget",
        coupon: e,
      });
      setError(err.message);
      trackOrder(ORDER_EVENTS.COUPON_APPLY_FAILED, {
        coupon_code: couponCode,
        reason: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (localStorage.getItem("coupon-number")) {
      onChange(localStorage.getItem("coupon-number"));
      applyCoupon(localStorage.getItem("coupon-number"));
      setActive(true);
    }
  }, []);
  return (
    <div
      onClick={(e) => {
        if (!(e.target as Element).closest(".apply-button")) {
          setActive();
        }
      }}
      style={{ border: active ? "1px solid rgb(56 144 255 / 51%)" : undefined }}
      data-pw="coupon-box"
      className={`w-full cursor-pointer pt-[12px] mt-[30px] ${
        active ? "h-[111px] bg-white" : " h-[42px] bg-[#f8f8f8]"
      } rounded-[15px] px-[12px] flex-col`}
    >
      <div
        className={`w-full h-[18px] items-center gap-[8px] ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <CouponIcon />
        <div className="regular text-[#1D1D1D] text-[14px] leading-[18px]">
          {translateFunction("I Have a Discount Coupon")}
        </div>
      </div>

      {active && (
        <>
          <div
            className={`block w-full mt-[1px] regular text-[12px] leading-[18px] text-[#8D8D8D] ${
              isRtl ? "text-right pr-[26px]" : "pl-[26px]"
            }`}
            dir={isRtl ? "rtl" : undefined}
            data-pw="coupon-status"
          >
            {coupon ? (
              <>
                {translateFunction("Your coupon has been applied")}{" "}
                <span className="medium">{appliedCode}</span>
              </>
            ) : (
              translateFunction("Please Enter Coupon Information")
            )}
          </div>
          <div className="mt-[10px] w-full items-center justify-between flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative">
            <div
              className={`flex-row items-center w-full ${
                isRtl ? "flex-row-reverse" : " "
              }`}
            >
              {!coupon && (
                <>
                  <span
                    className={`flex min-w-[15px] ${
                      isRtl ? "mr-[26px]" : "ml-[26px]"
                    }`}
                  >
                    <CouponInputIcon />
                  </span>
                  <input
                    data-pw="coupon-input"
                    placeholder={translateFunction("Coupon No", language)}
                    value={orderData.coupon_number}
                    onChange={(e) => onChange(pollinateInput(e.target.value))}
                    onBlur={(e) => {
                      if (!e.target.value) close();
                    }}
                    className={`coupon-element-input bg-transparent w-full h-[40px] border-none outline-hidden text-[#1D1D1D] text-[12px] placeholder:text-[#C4C2C2] ${
                      isRtl ? "pr-[8px] text-right" : "pl-[8px]"
                    }`}
                  />
                </>
              )}
              <div
                className={`transition-all text-[#1d1d1d] text-[14px] apply-button ${
                  coupon ? "min-w-full bold" : "w-[100px] min-w-[100px] regular"
                } flex items-center justify-center h-[40px] rounded-[15px] bg-white`}
                style={{ border: "1px solid rgb(56 144 255 / 51%)" }}
                data-pw="coupon-apply"
                data-applied={coupon ? "true" : "false"}
                onClick={() => applyCoupon()}
              >
                {loading
                  ? translateFunction("Applying...")
                  : coupon
                    ? `- ${RoundPrice({ charged: true, num: coupon })} ${currency.symbol}`
                    : translateFunction("Apply")}
              </div>
            </div>
          </div>
          {error && (
            <div data-pw="coupon-error" className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// The title icon of the coupon box in the design file (18 x 18).
const CouponIcon = () => (
  <svg
    className="min-w-[18px]"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
  >
    <path
      d="M.245,9.023a.375.375,0,0,0-.223.48l.236.648L2.051,8.358Z"
      fill="#1d1d1d"
    />
    <path
      d="M1.943,14.783l1.08,2.97a.372.372,0,0,0,.194.211A.377.377,0,0,0,3.375,18a.367.367,0,0,0,.13-.023L4.7,17.537Z"
      fill="#1d1d1d"
    />
    <path
      d="M17.977,12.247l-1.236-3.4-2.966,2.966,1.47-.541a.375.375,0,0,1,.259.7l-1.867.688a.375.375,0,0,1-.481-.222s0,0,0-.007L10.012,15.58l7.743-2.853A.374.374,0,0,0,17.977,12.247Z"
      fill="#1d1d1d"
    />
    <path
      d="M17.89,6.11l-6-6a.375.375,0,0,0-.53,0L.11,11.36a.375.375,0,0,0,0,.53l6,6a.371.371,0,0,0,.265.11.377.377,0,0,0,.265-.11L17.89,6.641A.376.376,0,0,0,17.89,6.11ZM4.39,10.391l-1.5,1.5a.375.375,0,0,1-.531-.53l1.5-1.5a.375.375,0,0,1,.531.53Zm6.476.476a1.416,1.416,0,0,1-1.027.393,3.1,3.1,0,0,1-2.086-1,3.436,3.436,0,0,1-.937-1.6A1.567,1.567,0,0,1,7.15,7.151a1.562,1.562,0,0,1,1.517-.334,3.429,3.429,0,0,1,1.6.937C11.305,8.795,11.571,10.163,10.866,10.867ZM15.64,6.641l-1.5,1.5a.375.375,0,0,1-.531-.53l1.5-1.5a.375.375,0,0,1,.531.53Z"
      fill="#1d1d1d"
    />
  </svg>
);

// The icon inside the code input in the design file (15 x 15).
const CouponInputIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 15 15"
  >
    <g transform="translate(-1.072 -1.072)" fill="#c4c2c2">
      <path d="M 13.393 10.179 L 15 10.179 L 15 12.321 L 13.393 12.321 C 12.802 12.321 12.321 11.841 12.321 11.25 C 12.321 10.659 12.802 10.179 13.393 10.179 Z" />
      <path d="M 15 13.125 L 15 15 C 15 15.592 14.521 16.071 13.929 16.071 L 3.214 16.071 C 2.622 16.071 2.143 15.592 2.143 15 L 2.143 7.5 C 2.143 6.908 2.622 6.429 3.214 6.429 L 13.929 6.429 C 14.521 6.429 15 6.908 15 7.5 L 15 9.375 L 13.393 9.375 C 12.359 9.375 11.518 10.216 11.518 11.25 C 11.518 12.284 12.359 13.125 13.393 13.125 L 15 13.125 Z" />
      <path d="M 7.232 2.411 C 7.232 1.671 7.832 1.071 8.571 1.071 C 9.311 1.071 9.911 1.671 9.911 2.411 C 9.911 2.96 9.58 3.43 9.107 3.637 L 9.107 5.625 L 8.036 5.625 L 8.036 3.637 C 7.563 3.43 7.232 2.96 7.232 2.411 Z" />
      <path d="M 2.946 2.946 C 2.946 2.207 3.546 1.607 4.286 1.607 C 5.13 1.607 5.789 2.389 5.586 3.252 L 6.75 4.125 C 6.885 4.226 6.964 4.385 6.964 4.554 L 6.964 5.625 L 5.893 5.625 L 5.893 4.821 L 4.941 4.107 C 4.03 4.624 2.946 3.952 2.946 2.946 Z" />
      <path d="M 14.196 2.946 C 14.196 3.957 13.11 4.622 12.201 4.108 L 11.25 4.821 L 11.25 5.625 L 10.179 5.625 L 10.179 4.554 C 10.179 4.385 10.258 4.226 10.393 4.125 L 11.556 3.253 C 11.353 2.389 12.013 1.607 12.857 1.607 C 13.597 1.607 14.196 2.207 14.196 2.946 Z" />
    </g>
  </svg>
);

export default CouponElement;
