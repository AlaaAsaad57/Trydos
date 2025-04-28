import { useParams } from "next/navigation";
import { formatPrice, RoundPrice, translateFunction } from "utils/functions";
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
import { toast } from "react-toastify";
import { useAppStore } from "store";
import { useEffect } from "react";
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
      toast.info(
        translateFunction("Only Allowed To Pay through TryDos Wallet")
      );
    } else {
      if (orderData?.payment?.find((s) => s.id === 0)) {
        setOrderData({
          payment: orderData?.payment?.filter((s) => s.id !== 0),
        });
      } else {
        setCodUser();
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
      toast.info(
        translateFunction("Only Allowed To Pay through TryDos Wallet")
      );
    } else {
      if (getWalletInUSD() <= 0) {
        toast.info(translateFunction("your TryDos Wallet balance is empty"));
      }
    }
  };
  const handleCryptoPayment = () => {
    if (getWalletInUSD() >= total) {
      toast.info(
        translateFunction("Only Allowed To Pay through TryDos Wallet")
      );
    } else {
      if (orderData?.payment?.find((s) => s.id === 3)) {
        setOrderData({
          payment: orderData?.payment?.filter((s) => s.id !== 3),
        });
      } else {
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
      toast.info(
        translateFunction("Only Allowed To Pay through TryDos Wallet")
      );
    } else {
      if (orderData?.payment?.find((s) => s.id === 2)) {
        setOrderData({
          payment: orderData?.payment?.filter((s) => s.id !== 2),
        });
      } else {
        setCreditUser();
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
  return (
    <>
      <div className="px-[12px] flex-col">
        <div
          style={{
            border: "1px solid rgb(196 194 194 / 51%)",
            borderRadius: "15px",
          }}
          className={`flex-col payment-valid-border ${"mt-[30px] min-h-[203px]"} pb-[12px] relative pr-[12px] pl-[12px] justify-start pt-[15px] w-full  `}
        >
          <div className="flex-row ">
            <svg
              id="_15x15_photo_back"
              data-name="15x15 photo back"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <defs>
                <clipPath id="clip-path">
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
                clipPath="url(#clip-path)"
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

            <div className="regular text-[#1D1D1D] text-[14px] ml-2">
              {translateFunction("Payment Method", language)}
            </div>
          </div>
          <div className="regular text-[12px] text-[#8D8D8D] ml-[28px]">
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
                  <TryDosWalletInput
                    key={key}
                    active={
                      orderData?.payment?.filter((s) => s.id === 1).length > 0
                    }
                    setActive={() => {
                      if (!orderLoading) {
                        handleWalletPayment();
                      }
                    }}
                  />
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
//             <clipPath id="clip-path">
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
//             clipPath="url(#clip-path)"
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
  const { total_cash, currency } = useAppStore();

  return (
    <div
      onClick={() => {
        setActive();
      }}
      className="w-full cursor-pointer mt-[10px] items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative"
      data-cy="Cach-on-delivery"
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
    >
      <div className="flex-row items-center">
        <WalletIcon />
        <span
          className={`ml-[8px]  ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Cash On Delivery")}
        </span>
      </div>
      <div className="flex-row items-center">
        <span className="text-[#D3D3D3] regular text-[12px]">
          {translateFunction("Total")}
        </span>
        <span className="text-[#1D1D1D] semibold text-[12px] ml-1">
          {RoundPrice({ num: total })} {currency?.symbol}
        </span>
      </div>
    </div>
  );
};
const TryDosWalletInput = ({ active, setActive }) => {
  const { orderLoading, wallet, currency } = useAppStore();
  return (
    <div
      onClick={() => {
        setActive();
      }}
      className={`${
        wallet?.wallet_balance <= 0 && "opacity-45"
      } w-full cursor-pointer mt-[10px] items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative`}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
    >
      <div className="flex-row items-center">
        <WalletIcon />
        <span
          className={`ml-[8px]  ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Trydos Wallet")}
        </span>
        {orderLoading && (
          <span className="bold ml-[11px]">
            <Spinner />
          </span>
        )}
      </div>
      <div className="flex-row items-center">
        <span className="text-[#D3D3D3] regular text-[12px]">
          {translateFunction("Your Balance")}
        </span>
        <span className="text-[#1D1D1D] semibold text-[12px] ml-1">
          {formatPrice(wallet?.wallet_balance)} {currency?.symbol}
        </span>
      </div>
    </div>
  );
};

const CreditInput = ({ active, setActive }) => {
  return (
    <div
      onClick={() => {
        setActive();
      }}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
      className="mt-[6px] cursor-pointer w-full items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative"
    >
      <div className="flex-row items-center">
        <CreditIcon />
        <span
          className={`ml-[8px] ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Credit Cards")}
        </span>
      </div>
      <div className="flex-row items-center">
        <VisaIcon />
        <MasterIcon className="ml-[5px]" />
        <MaestroIcon className="ml-[5px]" />
        <AmericanExpressIcon className="ml-[5px]" />
        <ApplePayIcon className="ml-[5px]" />
        <GooglePayIcon className="ml-[5px]" />
      </div>
    </div>
  );
};
const CryptoInput = ({ active, setActive }) => {
  return (
    <div
      onClick={(e) => {
        // @ts-ignore

        setActive();
      }}
      style={{
        border: active && "1px solid rgb(56 144 255 / 51%)",
      }}
      className="mt-[6px] cursor-pointer w-full items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative"
    >
      <div className="flex-row items-center">
        <CryptoIcon />
        <span
          className={`ml-[8px] ${
            active ? "text-[#1D1D1D]" : "text-[#C4C2C2]"
          } regular text-[12px]`}
        >
          {translateFunction("Crypto")}
        </span>
      </div>
      <div className="flex-row items-center">
        <PaymentIconOne />
        <PaymentIconTwo className="ml-[5px]" />
        <PaymentIconThree className="ml-[5px]" />
        <PaymentIconFour className="ml-[5px]" />
      </div>
    </div>
  );
};
