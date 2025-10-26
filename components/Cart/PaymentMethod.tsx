import { useParams } from "next/navigation";
import { RoundPrice, translateFunction } from "utils/functions";
import WalletIcon from "assets/svg/cart/WalletIcon.svg";
import CreditIcon from "assets/svg/cart/CreditIcon.svg";
import PaymentIconOne from "assets/svg/cart/Payment/DimondPay.svg";
import PaymentIconTwo from "assets/svg/cart/Payment/DimondPay1.svg";
import PaymentIconThree from "assets/svg/cart/Payment/DimondPay2.svg";
import PaymentIconFour from "assets/svg/cart/Payment/DimondPay3.svg";
import VisaIcon from "assets/svg/cart/Payment/Visa.svg";
import MasterIcon from "assets/svg/cart/Payment/Master.svg";
import MaestroIcon from "assets/svg/cart/Payment/Maestro.svg";
import AmericanExpressIcon from "assets/svg/cart/Payment/AmericanExpress.svg";
import ApplePayIcon from "assets/svg/cart/Payment/ApplePay.svg";
import GooglePayIcon from "assets/svg/cart/Payment/GooglePay.svg";
import CryptoIcon from "assets/svg/cart/CryptoIcon.svg";
import Spinner from "components/global/Spinner";
import CouponElement from "./couponElement";
import { useAppStore } from "store";
import { useEffect, useState } from "react";
import { TryDosWalletInputPropsType } from "models/componentType/TryDosWalletInputPropsType";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_PAYMENTS } from "utils/GAEvents";
import { showErrorNotification } from "@/store/notifications/reducer";
import RefreshIcon from "public/svg/RefreshIcon.svg";
import order from "services/order";
function PaymentMethod() {
  const {
    setWalletBalance,
    setCodUser,
    setCryptoUser,
    setCreditUser,
    orderLoading,
    orderData,
    available_payment_method,
    setOrderData,
    wallet,
    total,
    total_cash,
    currency,
    cart,
    cod_cost,
  } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const getWalletInUSD = () => {
    if (wallet?.wallet_balance > 0)
      return wallet?.wallet_balance / currency?.exchange_rate;
    else return 0;
  };
  useEffect(() => {
    if (getWalletInUSD() > 0 && getWalletInUSD() < total) {
      setWalletBalance();
      GAevent({
        action: GA_EVENT_NAMES.ADD_PAYMENT,
        params: {
          payment_type: GA_PAYMENTS.WALLET,
          items: cart.map((item) => ({
            item_id: item.product_id,
            item_name: item.name,

            quantity: item.quantity,
          })),
        },
      });
      setOrderData({
        payment: [
          ...orderData.payment?.filter((s) => s.id !== 1),
          {
            id: 1,
            balance: getWalletInUSD(),
          },
        ],
      });
    }
    if (getWalletInUSD() >= total) {
      setWalletBalance();
      GAevent({
        action: GA_EVENT_NAMES.ADD_PAYMENT,
        params: {
          payment_type: GA_PAYMENTS.WALLET,
          items: cart.map((item) => ({
            item_id: item.product_id,
            item_name: item.name,

            quantity: item.quantity,
          })),
        },
      });
      setOrderData({
        payment: [
          ...orderData.payment?.filter((s) => s.id !== 1),
          {
            id: 1,
            balance: total,
          },
        ],
      });
    }
  }, [available_payment_method, wallet]);
  const handleCODPayment = () => {
    if (getWalletInUSD() >= total) {
      showErrorNotification(
        translateFunction("Only Allowed To Pay through TryDos Wallet")
      );
    } else {
      if (orderData?.payment?.find((s) => s.id === 0)) {
        setOrderData({
          payment: orderData?.payment?.filter((s) => s.id !== 0),
        });
      } else {
        setCodUser();
        GAevent({
          action: GA_EVENT_NAMES.ADD_PAYMENT,
          params: {
            payment_type: GA_PAYMENTS.COD,
            items: cart.map((item) => ({
              item_id: item.product_id,
              item_name: item.name,

              quantity: item.quantity,
            })),
          },
        });
        setOrderData({
          payment: [
            ...orderData.payment?.filter((s) => s.id === 1),
            {
              id: 0,
              balance: total_cash - (getWalletInUSD() || 0),
            },
          ],
        });
      }
    }
  };
  const handleWalletPayment = () => {
    if (orderData?.payment?.find((s) => s.id === 1)) {
      showErrorNotification(translateFunction("Wallet Already Selected"));
    } else {
      if (getWalletInUSD() <= 0) {
        showErrorNotification(
          translateFunction("your TryDos Wallet balance is empty")
        );
      }
    }
  };
  const handleCryptoPayment = () => {
    if (getWalletInUSD() >= total) {
      showErrorNotification(
        translateFunction("Only Allowed To Pay through TryDos Wallet")
      );
    } else {
      if (orderData?.payment?.find((s) => s.id === 3)) {
        setOrderData({
          payment: orderData?.payment?.filter((s) => s.id !== 3),
        });
      } else {
        GAevent({
          action: GA_EVENT_NAMES.ADD_PAYMENT,
          params: {
            payment_type: GA_PAYMENTS.CRYPTO,
            items: cart.map((item) => ({
              item_id: item.product_id,
              item_name: item.name,

              quantity: item.quantity,
            })),
          },
        });
        setCryptoUser();
        setOrderData({
          payment: [
            ...orderData.payment?.filter((s) => s.id === 1),
            {
              id: 3,
              balance: total - (getWalletInUSD() || 0),
            },
          ],
        });
      }
    }
  };
  const handleCardPayment = () => {
    if (getWalletInUSD() >= total) {
      showErrorNotification(
        translateFunction("Only Allowed To Pay through TryDos Wallet")
      );
    } else {
      if (orderData?.payment?.find((s) => s.id === 2)) {
        setOrderData({
          payment: orderData?.payment?.filter((s) => s.id !== 2),
        });
      } else {
        setCreditUser();
        GAevent({
          action: GA_EVENT_NAMES.ADD_PAYMENT,
          params: {
            payment_type: GA_PAYMENTS.CREDIT,
            items: cart.map((item) => ({
              item_id: item.product_id,
              item_name: item.name,

              quantity: item.quantity,
            })),
          },
        });
        setOrderData({
          payment: [
            ...orderData.payment?.filter((s) => s.id === 1),
            {
              id: 2,
              balance: total - (getWalletInUSD() || 0),
            },
          ],
        });
      }
    }
  };
  const showCodValue = () => {
    if (getWalletInUSD() <= 0 || getWalletInUSD() >= total) return total_cash;
    if (getWalletInUSD() > 0 && getWalletInUSD() < total) {
      return total_cash - getWalletInUSD();
    }
  };
  const [walletLoading, setWalletLoading] = useState(false);
  const refreshWallet = async () => {
    if (walletLoading) return;
    try {
      setWalletLoading(true);
      await order.GetWallet();
      setWalletLoading(false);
    } catch (error) {
      setWalletLoading(false);
    }
  };
  const isRtl = language === "ar" || language === "ku";

  return (
    <>
      <div data-cy="payment-viewer" className="px-[12px] flex-col">
        <div
          data-cy="payment-viewer-container"
          style={{
            border: "1px solid rgb(196 194 194 / 51%)",
            borderRadius: "15px",
          }}
          className={`flex-col payment-valid-border ${"mt-[30px] min-h-[203px]"} pb-[12px] relative pr-[12px] pl-[12px] justify-start pt-[15px] w-full  `}
        >
          <div
            data-cy="first-bay-way"
            className={`flex-row ${
              language === "ar" || language === "ku" ? "flex-row-reverse" : ""
            }`}
          >
            <svg
              data-cy="payment-viewer-svg"
              id="_15x15_photo_back"
              data-name="15x15 photo back"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <defs>
                <clipPath id="13256">
                  <rect
                    id="Rectangle_4561"
                    data-name="Rectangle 4561"
                    width="18"
                    height="18"
                    fill="none"
                  />
                </clipPath>
              </defs>
              <g
                id="Mask_Group_658"
                data-name="Mask Group 658"
                clipPath="url(#13256)"
              >
                <g id="money-9">
                  <g id="Group_13431" data-name="Group 13431">
                    <g id="Group_13430" data-name="Group 13430">
                      <path
                        id="Path_22865"
                        data-name="Path 22865"
                        d="M.245,9.023a.375.375,0,0,0-.223.48l.236.648L2.051,8.358Z"
                        fill="#1d1d1d"
                      />
                    </g>
                  </g>
                  <g id="Group_13433" data-name="Group 13433">
                    <g id="Group_13432" data-name="Group 13432">
                      <path
                        id="Path_22866"
                        data-name="Path 22866"
                        d="M1.943,14.783l1.08,2.97a.372.372,0,0,0,.194.211A.377.377,0,0,0,3.375,18a.367.367,0,0,0,.13-.023L4.7,17.537Z"
                        fill="#1d1d1d"
                      />
                    </g>
                  </g>
                  <g id="Group_13435" data-name="Group 13435">
                    <g id="Group_13434" data-name="Group 13434">
                      <path
                        id="Path_22867"
                        data-name="Path 22867"
                        d="M17.977,12.247l-1.236-3.4-2.966,2.966,1.47-.541a.375.375,0,0,1,.259.7l-1.867.688a.375.375,0,0,1-.481-.222s0,0,0-.007L10.012,15.58l7.743-2.853A.374.374,0,0,0,17.977,12.247Z"
                        fill="#1d1d1d"
                      />
                    </g>
                  </g>
                  <g id="Group_13437" data-name="Group 13437">
                    <g id="Group_13436" data-name="Group 13436">
                      <path
                        id="Path_22868"
                        data-name="Path 22868"
                        d="M17.89,6.11l-6-6a.375.375,0,0,0-.53,0L.11,11.36a.375.375,0,0,0,0,.53l6,6a.371.371,0,0,0,.265.11.377.377,0,0,0,.265-.11L17.89,6.641A.376.376,0,0,0,17.89,6.11ZM4.39,10.391l-1.5,1.5a.375.375,0,0,1-.531-.53l1.5-1.5a.375.375,0,0,1,.531.53Zm6.476.476a1.416,1.416,0,0,1-1.027.393,3.1,3.1,0,0,1-2.086-1,3.436,3.436,0,0,1-.937-1.6A1.567,1.567,0,0,1,7.15,7.151a1.562,1.562,0,0,1,1.517-.334,3.429,3.429,0,0,1,1.6.937C11.305,8.795,11.571,10.163,10.866,10.867ZM15.64,6.641l-1.5,1.5a.375.375,0,0,1-.531-.53l1.5-1.5a.375.375,0,0,1,.531.53Z"
                        fill="#1d1d1d"
                      />
                    </g>
                  </g>
                </g>
              </g>
            </svg>

            <div
              data-cy="payment-viewer-text"
              className={`regular text-[#1D1D1D] text-[14px] ml-2 ${
                language === "ar" || language === "ku" ? "text-right pr-2" : ""
              }`}
            >
              {translateFunction("Payment Method", language)}
            </div>
          </div>
          <div
            data-cy="payment-viewer-text2"
            className={`regular text-[12px] text-[#8D8D8D] ml-[28px] ${
              language === "ar" || language === "ku" ? "text-right" : ""
            }`}
          >
            {translateFunction(
              "Please Choose Your Payment Method About Your Bag",
              language
            )}
          </div>
          {available_payment_method &&
            available_payment_method.length &&
            available_payment_method.map((item, key) => {
              if (item?.toLowerCase() === "cash_on_delivery".toLowerCase()) {
                return (
                  <CODInput
                    key={key}
                    active={
                      orderData?.payment?.filter((s) => s.id === 0).length > 0
                    }
                    setActive={() => {
                      if (!orderLoading) {
                        handleCODPayment();
                      }
                    }}
                    total={showCodValue()}
                  />
                );
              }
              if (item?.toLowerCase() === "trydos_wallet".toLowerCase()) {
                return (
                  <div
                    className={`flex-row items-end gap-[8px] ${
                      isRtl ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <TryDosWalletInput
                      key={key}
                      balance={wallet?.wallet_balance?.toFixed(8)}
                      active={
                        orderData?.payment?.filter((s) => s.id === 1).length > 0
                      }
                      setActive={() => {
                        if (!orderLoading) {
                          handleWalletPayment();
                        }
                      }}
                    />
                    <div
                      className={`rounded-[10px]  justify-center items-center flex h-[40px] min-w-[45px] bg-[#f8f8f8] cursor-pointer`}
                      data-cy="refresh-wallet"
                      onClick={() => {
                        refreshWallet();
                      }}
                    >
                      <RefreshIcon
                        className={`${walletLoading && "animate-spin"}`}
                      />
                    </div>
                  </div>
                );
              }
              if (item?.toLowerCase() === "crypto".toLowerCase()) {
                return (
                  <CryptoInput
                    key={key}
                    active={
                      orderData?.payment?.filter((s) => s.id === 3).length > 0
                    }
                    setActive={() => {
                      if (!orderLoading) {
                        handleCryptoPayment();
                      }
                    }}
                  />
                );
              }
              if (item?.toLowerCase() === "card".toLowerCase()) {
                return (
                  <CreditInput
                    key={key}
                    active={
                      orderData?.payment?.filter((s) => s.id === 2).length > 0
                    }
                    setActive={() => {
                      handleCardPayment();
                    }}
                  />
                );
              }
              return <span key={key}></span>;
            })}
        </div>
        {
          <CouponElement
            active={orderData.coupon}
            setActive={() => {
              setOrderData({ coupon: true });
            }}
            close={() => {
              setOrderData({ coupon: false });
            }}
            language={language}
          />
        }
      </div>
    </>
  );
}

export default PaymentMethod;
// const CouponElement = ({ active, setActive, close }) => {
//   const dispatch = useDispatch();
//   const coupon_number = useSelector(
//     (state: StateInterface) => state.cart.orderData.coupon_number
//   );
//   const onChange = (e) => {
//   };
//   useEffect(() => {
//     if (active) {
//       setTimeout(() => {
//         // @ts-ignore
//         document.querySelector(".coupon-element-input")?.focus();
//       }, 200);
//     }
//   }, [active]);
//   const [coupon, setCoupon] = useState(false);
//   const currency = useSelector(
//     (state: StateInterface) => state.homepage.currency
//   ) || { exchange_rate: 1, symbol: "" };
//   return (
//     <div
//       onClick={(e) => {
//         setTimeout(() => {
//           // @ts-ignore
//           document.querySelector(".coupon-element-input")?.focus();
//         }, 200);
//         // @ts-ignore
//         if (e.target.closest(".apply-button")) {
//           // close();
//         } else {
//           setActive();
//         }
//       }}
//       style={{
//         border: active && "1px solid rgb(56 144 255 / 51%)",
//       }}
//       className={`w-full cursor-pointer pt-[12px] ite mt-[30px] ${
//         active ? "h-[111px] bg-[#fff]" : " h-[42px] bg-[#f8f8f8]"
//       } rounded-[15px]  flex-col items-start px-[12px]`}
//     >
//       <div className="flex-row ">
//         <svg
//           id="_15x15_photo_back"
//           data-name="15x15 photo back"
//           xmlns="http://www.w3.org/2000/svg"
//           xmlnsXlink="http://www.w3.org/1999/xlink"
//           width="18"
//           height="18"
//           viewBox="0 0 18 18"
//         >
//           <defs>
//             <clipPath id="clipPath">
//               <rect
//                 id="Rectangle_4561"
//                 data-name="Rectangle 4561"
//                 width="18"
//                 height="18"
//                 fill="none"
//               />
//             </clipPath>
//           </defs>
//           <g
//             id="Mask_Group_658"
//             data-name="Mask Group 658"
//             clipPath="url(#clipPath)"
//           >
//             <g id="money-9">
//               <g id="Group_13431" data-name="Group 13431">
//                 <g id="Group_13430" data-name="Group 13430">
//                   <path
//                     id="Path_22865"
//                     data-name="Path 22865"
//                     d="M.245,9.023a.375.375,0,0,0-.223.48l.236.648L2.051,8.358Z"
//                     fill="#1d1d1d"
//                   />
//                 </g>
//               </g>
//               <g id="Group_13433" data-name="Group 13433">
//                 <g id="Group_13432" data-name="Group 13432">
//                   <path
//                     id="Path_22866"
//                     data-name="Path 22866"
//                     d="M1.943,14.783l1.08,2.97a.372.372,0,0,0,.194.211A.377.377,0,0,0,3.375,18a.367.367,0,0,0,.13-.023L4.7,17.537Z"
//                     fill="#1d1d1d"
//                   />
//                 </g>
//               </g>
//               <g id="Group_13435" data-name="Group 13435">
//                 <g id="Group_13434" data-name="Group 13434">
//                   <path
//                     id="Path_22867"
//                     data-name="Path 22867"
//                     d="M17.977,12.247l-1.236-3.4-2.966,2.966,1.47-.541a.375.375,0,0,1,.259.7l-1.867.688a.375.375,0,0,1-.481-.222s0,0,0-.007L10.012,15.58l7.743-2.853A.374.374,0,0,0,17.977,12.247Z"
//                     fill="#1d1d1d"
//                   />
//                 </g>
//               </g>
//               <g id="Group_13437" data-name="Group 13437">
//                 <g id="Group_13436" data-name="Group 13436">
//                   <path
//                     id="Path_22868"
//                     data-name="Path 22868"
//                     d="M17.89,6.11l-6-6a.375.375,0,0,0-.53,0L.11,11.36a.375.375,0,0,0,0,.53l6,6a.371.371,0,0,0,.265.11.377.377,0,0,0,.265-.11L17.89,6.641A.376.376,0,0,0,17.89,6.11ZM4.39,10.391l-1.5,1.5a.375.375,0,0,1-.531-.53l1.5-1.5a.375.375,0,0,1,.531.53Zm6.476.476a1.416,1.416,0,0,1-1.027.393,3.1,3.1,0,0,1-2.086-1,3.436,3.436,0,0,1-.937-1.6A1.567,1.567,0,0,1,7.15,7.151a1.562,1.562,0,0,1,1.517-.334,3.429,3.429,0,0,1,1.6.937C11.305,8.795,11.571,10.163,10.866,10.867ZM15.64,6.641l-1.5,1.5a.375.375,0,0,1-.531-.53l1.5-1.5a.375.375,0,0,1,.531.53Z"
//                     fill="#1d1d1d"
//                   />
//                 </g>
//               </g>
//             </g>
//           </g>
//         </svg>

//         <div className="regular text-[#1D1D1D] text-[14px] ml-2">
//           {translateFunction("I Have Discount Coupon")}
//         </div>
//       </div>
//       {active && (
//         <>
//           <div className="regular text-[12px] text-[#8D8D8D] ml-[28px]">
//             {translateFunction("Please Enter Coupon Information")}
//           </div>
//           <div className="mt-[10px] w-full items-center  justify-between flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative">
//             <div className="flex-row items-center w-full">
//               <WalletIcon className="absolute left-[26px] top-[12px]" />

//               {!coupon && (
//                 <input
//                   placeholder="Coupon No"
//                   onChange={(e) => {
//                     onChange(e.target.value);
//                   }}
//                   onBlur={(e) => {
//                     if (e.target.value?.length === 0) {
//                       close();
//                     }
//                   }}
//                   className={`coupon-element-input pl-[49px]  bg-transparent w-full h-[42px] border-none outline-none  text-[#1D1D1D] regular text-[12px] placeholder:text-[#C4C2C2]`}
//                 />
//               )}
//               <div
//                 className={`transition-all text-[#1d1d1d] apply-button ${
//                   coupon ? "min-w-full " : "w-[100px] min-w-[100px] "
//                 } flex items-center justify-center h-[40px] rounded-[15px] bg-white`}
//                 style={{
//                   border: "1px solid rgb(56 144 255 / 51%)",
//                 }}
//                 onClick={() => {
//                   if (coupon_number.length > 0) {
//                     // @ts-ignore
//                     setCoupon(100);
//                   }
//                 }}
//               >
//                 {coupon
//                   ? `- ${coupon} ${currency.symbol}`
//                   : translateFunction("Apply")}
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };
const CODInput = ({ active, setActive, total }) => {
  const { language, cod_cost, currency } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      data-cy="Cash-on-delivery"
      onClick={() => {
        setActive();
      }}
      className={`${
        isRtl
          ? "flex-row-reverse pr-[23px] pl-[26px]"
          : "flex-row pr-[26px] pl-[23px]"
      } w-full cursor-pointer mt-[10px] items-center  justify-between  flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative`}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
    >
      <div data-cy="WalletIcon-container" className="flex-row items-center">
        <WalletIcon
          className={`${active && "[&_path]:fill-[#1D1D1D]"}`}
          data-cy="WalletIcon-container-svg"
        />
        <span
          data-cy="Cash-texts"
          className={`ml-[8px]  ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Cash On Delivery")}
        </span>
      </div>
      <div data-cy="total-container" className="flex-row items-center">
        <span
          data-cy="total-container-span"
          className="text-[#D3D3D3] regular text-[12px]"
        >
          {translateFunction("Shipping Cost")}
        </span>
        {currency && (
          <span className="text-[#1D1D1D] semibold text-[12px] ml-1">
            {RoundPrice({ num: cod_cost, returnNumber: true })}{" "}
            {currency?.symbol}
          </span>
        )}
      </div>
    </div>
  );
};
const TryDosWalletInput = ({
  active,
  setActive,
  balance,
}: TryDosWalletInputPropsType) => {
  const { orderLoading, wallet, currency, settings, language } = useAppStore();
  const points = settings["starting-setting"]?.decimal_point_settings || 0;
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      data-cy="second-bay-way"
      onClick={() => {
        setActive();
      }}
      className={`${wallet?.wallet_balance <= 0 && "opacity-45"} ${
        isRtl
          ? "flex-row-reverse pr-[23px] pl-[26px]"
          : "flex-row pr-[26px] pl-[23px]"
      } w-full cursor-pointer mt-[10px] items-center  justify-between  flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative`}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
    >
      <div data-cy="second-bay-way-con" className="flex-row items-center">
        <WalletIcon
          data-cy="second-bay-way-svg"
          className={`${active && "[&_path]:fill-[#1D1D1D]"}`}
        />
        <span
          data-cy="second-bay-way-con-text"
          className={`ml-[8px]  ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Trydos Wallet")}
        </span>
        {orderLoading && (
          <span
            data-cy="second-bay-way-con-text-load"
            className="bold ml-[11px]"
          >
            <Spinner />
          </span>
        )}
      </div>
      <div data-cy="third-bay-way" className="flex-row items-center">
        <span
          data-cy="third-bay-way-text"
          className="text-[#D3D3D3] regular text-[12px]"
        >
          {translateFunction("Your Balance")}
        </span>
        <span
          className="text-[#1D1D1D] semibold text-[12px] ml-1"
          data-cy="wallet-balance"
        >
          {!orderLoading && balance} {currency?.symbol}
        </span>
      </div>
    </div>
  );
};

const CreditInput = ({ active, setActive }) => {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      data-cy="dredit-way"
      onClick={() => {
        setActive();
      }}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
      className={`${
        isRtl
          ? "flex-row-reverse pr-[23px] pl-[26px]"
          : "flex-row pr-[26px] pl-[23px]"
      } mt-[6px] cursor-pointer w-full items-center  justify-between  flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative`}
    >
      <div data-cy="dredit-way-con" className="flex-row items-center">
        <CreditIcon
          data-cy="dredit-way-svg"
          className={`${active && "[&_path]:fill-[#1D1D1D]"}`}
        />
        <span
          data-cy="dredit-way-text"
          className={`ml-[8px] ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Credit Cards")}
        </span>
      </div>
      <div data-cy="container-icons" className="flex-row items-center">
        <VisaIcon data-cy="Visa-Icon" />
        <MasterIcon data-cy="Master-Icon" className="ml-[5px]" />
        <MaestroIcon data-cy="Maestro-Icon" className="ml-[5px]" />
        <AmericanExpressIcon
          data-cy="AmericanExpress-Icon"
          className="ml-[5px]"
        />
        <ApplePayIcon data-cy="ApplePay-Icon" className="ml-[5px]" />
        <GooglePayIcon data-cy="GooglePay-Icon" className="ml-[5px]" />
      </div>
    </div>
  );
};
const CryptoInput = ({ active, setActive }) => {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      data-cy="crypto-bay-way"
      onClick={(e) => {
        // @ts-ignore

        setActive();
      }}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
      className={`${
        isRtl
          ? "flex-row-reverse pr-[23px] pl-[26px]"
          : "flex-row pr-[26px] pl-[23px]"
      } mt-[6px] cursor-pointer w-full items-center justify-between flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative`}
    >
      <div data-cy="crypto-bay-way-container" className="flex-row items-center">
        <CryptoIcon
          data-cy="crypto-bay-way-svg"
          className={`${active && "[&_path]:fill-[#1D1D1D]"}`}
        />
        <span
          data-cy="crypto-bay-way-text"
          className={`ml-[8px] ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Crypto")}
        </span>
      </div>
      <div data-cy="containers-icons" className="flex-row items-center">
        <PaymentIconOne data-cy="PaymentIconOne-icons" />
        <PaymentIconTwo data-cy="PaymentIconTwo-icons" className="ml-[5px]" />
        <PaymentIconThree
          data-cy="PaymentIconThree-icons"
          className="ml-[5px]"
        />
        <PaymentIconFour data-cy="PaymentIconFour-icons" className="ml-[5px]" />
      </div>
    </div>
  );
};
