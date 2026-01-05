import { useState } from "react";
import { getCart, RoundPrice, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import NextLink from "components/global/NextLink";

import { showErrorNotification } from "@/store/notifications/reducer";
import { isSamePage } from "utils/navigationsUtils";

function PlaceOrderButtons({ orderLoading, successOrder, backToCart, close }) {
  const {
    setOrderData,
    initCart,
    currency,
    orderData,
    total,
    total_cash,
    cart,
    setCouponDiscount,
    userProfile,
    language,
  } = useAppStore();

  const { lang } = useParams();
  const shake = (v) => {
    if (document.querySelector(`.${v}`)) {
      document.querySelector(`.${v}`).scrollIntoView({ block: "end" });
      document.querySelector(`.${v}`).classList.add("shake-anim");
      setTimeout(() => {
        document.querySelector(`.${v}`).classList.remove("shake-anim");
      }, 1300);
    }
  };
  const isValid = () => {
    if (orderData.agree) {
      return true;
    } else if (!orderData.agree) {
      return false;
    }
  };
  const Validate = () => {
    if (!orderData.agree) {
      shake("agree-valid-border");
    }
  };
  const setAgree = async (e) => {
    if (loading || agreeLoading) return;
    setAgreeLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setOrderData({ agree: e });
    setAgreeLoading(false);
  };
  const [loading, setLoading] = useState(false);
  const [agreeLoading, setAgreeLoading] = useState(false);
  const VerifyCart = async () => {
    try {
      setLoading(true);
      let a = (
        await getCart({
          callback: ([data, res]) => {
            initCart(data ?? { cart: [] });
          },
        })
      ).cart;
      if (userProfile.is_phone_verified === 0) {
        backToCart();
        setLoading(false);
        showErrorNotification(
          translateFunction("Please Verify Your Phone Number")
        );
      }
      if (a.length === 0) {
        backToCart();
        setLoading(false);
      }
      if (
        a?.filter(
          (s) =>
            s?.check_availability === false ||
            s.is_country_restricted === true ||
            s.is_active === false
        ).length === 0
      ) {
        setLoading(false);
        successOrder();
      } else {
        throw Error("Please Review Your Cart Info");
      }
    } catch (error) {
      showErrorNotification(
        translateFunction("Please Review Your Cart Some Products Not Available")
      );

      backToCart();
      setLoading(false);
    }
  };
  const getTotalPrice = () => {
    if (orderData.payment.filter((s) => s.id === 0).length > 0) {
      return total_cash;
    } else {
      return total;
    }
  };
  const isRtl = language === "ar" || language === "ku";
  return (
    <div className="absolute flex-col items-center payment-order-bottom left-0 w-full">
      {!orderData.success && (
        <div className="px-[24px] mb-[12px] w-full">
          <div
            className={`${orderData.agree ? "bg-[#F5FFF8]" : "bg-[#F8F8F8]"} ${
              isRtl ? "flex-row-reverse" : "flex-row"
            } gap-[34px] w-full cursor-pointer agree-valid-border px-[26px] h-[40px] rounded-[15px] regular flex-row items-center text-[12px] text-[#1D1D1D]`}
            data-cy="read-and-agree"
            style={{
              border: "1px solid rgb(56 144 255 / 51%)",
            }}
            onClick={() => {
              setAgree(!orderData.agree);
            }}
          >
            <span className="cursor-pointer">
              {!agreeLoading ? (
                <CheckBoxElement active={orderData.agree} />
              ) : (
                <Spinner />
              )}
            </span>
            <div className={` ${isRtl ? "dir-rtl" : ""} flex `}>
              <span>{translateFunction("I read and agree to the")}</span>
              <span
                className={`underline ${
                  LocalizationServiceClass.GetAppLanguage() === "ar"
                    ? "mr-[4px]"
                    : "ml-[4px]"
                } text-[#388CFF]`}
              >
                {translateFunction("policies")}
              </span>
              <span
                className={` ${
                  LocalizationServiceClass.GetAppLanguage() === "ar"
                    ? "mr-[4px]"
                    : "ml-[4px]"
                }`}
              >
                {translateFunction("and")}
              </span>
              <span
                className={`underline  ${
                  LocalizationServiceClass.GetAppLanguage() === "ar"
                    ? "mr-[4px]"
                    : "ml-[4px]"
                } text-[#388CFF]`}
              >
                {translateFunction("terms")}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          boxShadow: "0px -3px 20px #0000001a",
        }}
        className={` ${
          orderLoading && "opacity-55"
        }  text-center  left-0 w-full h-[100px] bg-[#fff] px-[20px] pt-[12px]`}
      >
        {!orderData.success && (
          <div
            data-cy="Place-Order-Buttons"
            onClick={() => {
              if (orderData.success) {
                setOrderData({
                  payment: [],
                  coupon: false,
                  agree: false,
                  coupon_number: "",
                  loading: false,
                  success: false,
                  data: [],
                });

                close();
                return;
              }
              Validate();
              if (isValid() && !(orderData.loading || loading)) {
                VerifyCart();
              }
            }}
            className={`  w-full text-center  justify-center cursor-pointer flex-col items-center h-[70px] ${
              orderData.success
                ? "bg-[#1D1D1D]"
                : isValid()
                ? "bg-[#346BFF]"
                : "bg-[#C4C2C2]"
            } text-[#FEFEFE] text-[18px] medium rounded-[20px]`}
          >
            {orderData.loading || loading ? (
              <Spinner />
            ) : (
              <>
                <span>{translateFunction("Place Order")}</span>
                <span
                  className={`text-[#FEFEFE] text-[14px] medium ${
                    LocalizationServiceClass.GetAppLanguage() === "ar" &&
                    "dir-rtl"
                  } `}
                >
                  {cart.length} {translateFunction("items")}{" "}
                  {RoundPrice({
                    num: getTotalPrice(),
                    returnNumber: true,
                    points: currency?.decimal_digits,
                  })}{" "}
                  {currency?.symbol}
                </span>
              </>
            )}
          </div>
        )}
        {orderData.success && (
          <div
            className="flex w-full"
            onClick={() => {
              setOrderData({
                payment: [],
                coupon: false,
                agree: false,
                coupon_number: "",
                loading: false,
                success: false,
                data: [],
              });
              initCart({ cart: [] });
              setCouponDiscount(null);
              close();
              return;
            }}
          >
            <NextLink
              sameHref={isSamePage(`/${lang}`)}
              href={`/${lang}`}
              data-cy="back-to-home-page"
              data={{
                is_full_home: true,
              }}
              className={`w-full text-center  justify-center cursor-pointer flex-col items-center h-[70px]
             bg-[#1D1D1D] text-[#FEFEFE] text-[18px] medium rounded-[20px]`}
            >
              <span>{translateFunction("Done")}</span>
              <span
                className={`text-[#FEFEFE] text-[14px] medium ${
                  LocalizationServiceClass.GetAppLanguage() === "ar" &&
                  "dir-rtl"
                } `}
              >
                {translateFunction("Back To HomePage")}
              </span>
            </NextLink>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaceOrderButtons;
export const CheckBoxElement = ({ active }) => {
  return (
    <>
      {active ? (
        <>
          <svg
            className="cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <g
              id="Mask_Group_434"
              data-name="Mask Group 434"
              transform="translate(-50 -243.139)"
            >
              <g
                id="Group_11944"
                data-name="Group 11944"
                transform="translate(50 243.139)"
              >
                <g
                  id="Group_11943"
                  data-name="Group 11943"
                  transform="translate(0 0)"
                >
                  <g
                    id="Ellipse_427"
                    data-name="Ellipse 427"
                    fill="none"
                    stroke="#388cff"
                    strokeWidth="0.5"
                  >
                    <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                    <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                  </g>
                  <circle
                    id="Ellipse_428"
                    data-name="Ellipse 428"
                    cx="4.5"
                    cy="4.5"
                    r="4.5"
                    transform="translate(3 3)"
                    fill="#388cff"
                  />
                </g>
              </g>
            </g>
          </svg>
        </>
      ) : (
        <>
          <svg
            className="cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <g
              id="Mask_Group_434"
              data-name="Mask Group 434"
              transform="translate(-50 -243.139)"
            >
              <g
                id="Group_11944"
                data-name="Group 11944"
                transform="translate(50 243.139)"
              >
                <g
                  id="Group_11943"
                  data-name="Group 11943"
                  transform="translate(0 0)"
                >
                  <g
                    id="Ellipse_427"
                    data-name="Ellipse 427"
                    fill="none"
                    stroke="#1d1d1d"
                    strokeWidth="0.5"
                  >
                    <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                    <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                  </g>
                  <circle
                    id="Ellipse_428"
                    data-name="Ellipse 428"
                    cx="4.5"
                    cy="4.5"
                    r="4.5"
                    transform="translate(3 3)"
                    fill="#e8e8e8"
                  />
                </g>
              </g>
            </g>
          </svg>
        </>
      )}
    </>
  );
};
