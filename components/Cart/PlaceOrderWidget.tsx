import {
  formatPrice,
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import OrderCartIcon from "public/svg/cart/orderCartIcon.svg";
import FreeShippingIcon from "public/svg/product/FreeShipping.svg";
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
import OrderSuccess from "./OrderSuccess";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
function PlaceOrderWidget() {
  const { orderData } = useAppStore();

  return (
    <div className="flex-col overflow-auto pb-[292px] max-h-[100vh]">
      {orderData.success && <OrderSuccess />}
      <OrderCartItem />
      <AddressOrder success={orderData.success} />
      <PaymentOrder success={orderData.success} />
    </div>
  );
}

export default PlaceOrderWidget;

const OrderCartItem = () => {
  const { cart, orderData } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];

  return (
    <div
      style={{
        borderRadius: "15px",
      }}
      className={`flex-col relative pl-[12px] justify-center w-full min-h-[170px] cursor-pointer`}
    >
      <div className="flex-row ">
        <OrderCartIcon />
        <div className="regular text-[#1D1D1D] text-[14px] ml-2">
          {translateFunction("Your Shopping Bag", language)}
          <span className={language === "ar" ? "mr-1 bold" : "ml-1 bold"}>
            {/* @ts-ignore */}
            {cart.length || orderData?.data?.length}
            <span className={"ml-1"}>
              {translateFunction("items", language)}
            </span>
          </span>
        </div>
      </div>
      <div
        className={`${`pl-[11px] pb-[12px] pt-[11px] `} transition flex-row `}
      >
        {cart.length
          ? cart.map((s, i) => {
              return (
                <div className="flex relative h-[125px]" key={i}>
                  <span
                    className="absolute w-[91px] h-full z-10 rounded-[15px]"
                    style={{
                      boxShadow: "#ffffff80 0px 3px 6px inset",
                    }}
                  />
                  <img
                    className="w-[91px] h-[125px] rounded-[15px]"
                    src={getConfiguredImage({
                      src: s.image,
                      width: 91,
                      height: 150,
                    })}
                  />
                </div>
              );
            })
          : orderData &&
            // @ts-ignore
            orderData?.data?.map((s, i) => {
              return (
                <div className="flex relative h-[125px]" key={i}>
                  <span
                    className="absolute w-[91px] h-full z-10 rounded-[15px]"
                    style={{
                      boxShadow: "#ffffff80 0px 3px 6px inset",
                    }}
                  />
                  <img
                    className="w-[91px] h-[125px] rounded-[15px]"
                    src={getConfiguredImage({
                      src: s?.details[0].product_details?.images[0],
                      width: 91,
                      height: 150,
                    })}
                  />
                </div>
              );
            })}
      </div>
    </div>
  );
};
const AddressOrder = ({ success }) => {
  const { addressLists } = useAppStore();
  const GetAddressString = (location) => {
    let str = "";
    if (
      location?.province &&
      location?.province.length > 0 &&
      location?.province !== "null"
    )
      str += `${location?.province}`;
    if (
      location?.city &&
      location?.city.length > 0 &&
      location?.city !== "null"
    )
      str += ` | ${location?.city}`;
    if (
      location?.town &&
      location?.town.length > 0 &&
      location?.town !== "null"
    )
      str += ` | ${location?.town}`;
    if (
      location?.street &&
      location?.street?.length > 0 &&
      location?.street !== "null"
    )
      str += ` | ${location.street}`;
    if (
      location?.building &&
      location?.building?.length > 0 &&
      location?.building !== "null"
    )
      str += ` | ${location?.building}`;
    return str;
  };

  let defaultAddress = addressLists.filter((s) => s.is_default === 1)[0];
  return (
    <div
      style={{
        borderRadius: "15px",
      }}
      className={`address-valid-border flex-col mt-[11px] pb-[12px] relative pr-[12px] pl-[12px] justify-start pt-[15px] w-full `}
    >
      <div className="flex-row ">
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
            clipPath="url(#clip-path22)"
          >
            <g id="delivery_location" transform="translate(1.163 -0.036)">
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
        <div className="regular text-[#1D1D1D] text-[14px] ml-2">
          {translateFunction("Shipping & Delivery Address")}
        </div>
        <span className="bold ml-[11px]">
          <FreeShippingIcon />
        </span>
      </div>
      {/* <div className="regular text-[12px] text-[#8D8D8D] ml-[28px]">
        {translateFunction("Please Enter Shipping Address To Receive Your Bag")}
      </div> */}
      <div
        style={{
          border: "#C4C2C28c 1px solid",
        }}
        className={`flex-col  ${
          addressLists?.length === 0
            ? "items-center h-[84px]   py-[12px]"
            : "items-start h-[auto] min-h-[90px] px-[24px]  py-[7px]"
        } mt-[10px] rounded-[15px] bg-[#F8F8F8] w-full `}
      >
        <>
          <div className="flex-col">
            <div className="flex-row items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <path
                  id="home-3"
                  d="M11.677,5.219h0L6.781.324a1.1,1.1,0,0,0-1.563,0L.325,5.216l0,.005A1.1,1.1,0,0,0,1.056,7.1l.034,0h.2v3.6A1.294,1.294,0,0,0,2.578,12H4.493a.352.352,0,0,0,.352-.352V8.824a.591.591,0,0,1,.59-.59h1.13a.591.591,0,0,1,.59.59v2.824A.352.352,0,0,0,7.506,12H9.421a1.294,1.294,0,0,0,1.293-1.293V7.1H10.9a1.1,1.1,0,0,0,.782-1.885Zm0,0"
                  transform="translate(0.001)"
                  fill="#8d8d8d"
                />
              </svg>

              <span className="regular ml-[4px] text-[12px] text-[#8D8D8D]">
                {defaultAddress?.address}
              </span>
            </div>
            <div className="flex-row mt-[5px]  items-center regular text-[12px] text-[#8D8D8D]">
              {GetAddressString(defaultAddress?.region_details)}
            </div>
            <div className="flex-row mt-[5px] items-center regular text-[12px] text-[#8D8D8D]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <defs>
                  <clipPath id="clip-path1213">
                    <rect
                      id="Rectangle_6097"
                      data-name="Rectangle 6097"
                      width="12"
                      height="12"
                      transform="translate(-0.245)"
                      fill="#8d8d8d"
                    />
                  </clipPath>
                </defs>
                <g
                  id="Mask_Group_646"
                  data-name="Mask Group 646"
                  transform="translate(0.245)"
                  clipPath="url(#clip-path1213)"
                >
                  <g id="XMLID_7_" transform="translate(0.202 0.583)">
                    <path
                      id="XMLID_10_"
                      d="M10.461,8.411c-.055-.042-.111-.085-.164-.128-.281-.226-.579-.434-.868-.635l-.18-.125a1.791,1.791,0,0,0-1.016-.386,1.317,1.317,0,0,0-1.1.695.583.583,0,0,1-.5.3.993.993,0,0,1-.4-.1A4.848,4.848,0,0,1,3.7,5.568c-.236-.529-.159-.876.255-1.157A1.171,1.171,0,0,0,4.6,3.383,5.865,5.865,0,0,0,2.534.569a1.172,1.172,0,0,0-.8,0A2.306,2.306,0,0,0,.3,1.747,2.194,2.194,0,0,0,.334,3.518,14.288,14.288,0,0,0,3.469,8.291a15.2,15.2,0,0,0,4.756,3.158,2.634,2.634,0,0,0,.47.14c.044.01.081.018.109.026a.183.183,0,0,0,.046.006h.015a2.7,2.7,0,0,0,2.241-1.705C11.388,9.12,10.874,8.727,10.461,8.411Z"
                      transform="translate(-0.131 -0.498)"
                      fill="#8d8d8d"
                    />
                  </g>
                </g>
              </svg>

              <div className="flex-row ml-[4px]   items-center regular text-[12px] text-[#8D8D8D]">
                {defaultAddress?.contact_info.phone}
              </div>
              <div className="flex-row ml-[17px]  items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <defs>
                    <clipPath id="clip-path232323">
                      <rect
                        id="Rectangle_6098"
                        data-name="Rectangle 6098"
                        width="12"
                        height="12"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_647"
                    data-name="Mask Group 647"
                    clipPath="url(#clip-path232323)"
                  >
                    <g
                      id="Group_13"
                      data-name="Group 13"
                      transform="translate(1.162 0)"
                    >
                      <path
                        id="Path_20"
                        data-name="Path 20"
                        d="M651.622,148c.318-.068.611-.331.658-.913.04-.476-.083-.722-.264-.846.5-2.042-.88-2.441-.88-2.441a2.072,2.072,0,0,0-3.047-.522,3.6,3.6,0,0,0-.891.765,3.182,3.182,0,0,0-.681,2.132c-.246.092-.44.331-.391.918.05.609.367.868.7.918a2.435,2.435,0,0,0,4.794-.008Zm-2.4,1.5c-1.218,0-2.2-1.653-2.2-3.025,0-.184.005-.362.017-.523a4.18,4.18,0,0,0,3.411-1.257,4,4,0,0,1,.971,1.736v.044c.008,1.371-.973,3.026-2.192,3.026Z"
                        transform="translate(-644.484 -142.822)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21"
                        data-name="Path 21"
                        d="M643.18,174.122l.141-.584a.341.341,0,0,1,.1-.169l-.042-.032-1.261-1.044-.768.184a2.785,2.785,0,0,0-2.214,2.662v1.653a.613.613,0,0,0,.635.585h3.247l.495-2.822a.344.344,0,0,1-.333-.432Z"
                        transform="translate(-639.136 -165.377)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_22"
                        data-name="Path 22"
                        d="M662.939,172.471l-.756-.184-1.259,1.044-.042.032a.341.341,0,0,1,.1.169l.141.584a.344.344,0,0,1-.333.425l.495,2.822h3.246a.59.59,0,0,0,.61-.585v-1.653a2.772,2.772,0,0,0-2.2-2.655Z"
                        transform="translate(-655.714 -165.376)"
                        fill="#8d8d8d"
                      />
                    </g>
                  </g>
                </svg>

                <div className="flex-row  ml-[4px]  items-center regular text-[12px] text-[#8D8D8D]">
                  {defaultAddress?.contact_info.contact_person_name ||
                    // @ts-ignore
                    defaultAddress?.contact_info.name}
                </div>
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  );
};
const PaymentOrder = ({ success }) => {
  const { orderData, coupon_discount, currency, wallet, total, total_cash } =
    useAppStore();
  const getWalletInUSD = () => {
    if (wallet?.wallet_balance > 0)
      return wallet?.wallet_balance / currency?.exchange_rate;
    else return 0;
  };
  const showCodValue = () => {
    if (getWalletInUSD() <= 0 || getWalletInUSD() >= total) return total_cash;
    if (getWalletInUSD() > 0 && getWalletInUSD() < total) {
      return total_cash - getWalletInUSD();
    }
  };
  return (
    <div className="px-[12px] flex-col">
      <div
        style={{
          borderRadius: "15px",
        }}
        className={`flex-col payment-valid-border pb-[12px] relative pr-[12px] pl-[12px] justify-start pt-[15px] w-full  `}
        data-cy="Payment-Container-Cart-Page"
      >
        <div className="flex-row ">
          <svg
            data-cy="svg-payment"
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

          <div
            className="regular text-[#1D1D1D] text-[14px] ml-2"
            data-cy="Payment-Method-Statement"
          >
            {translateFunction("Payment Method")}
          </div>
        </div>
        {/* <div className="regular text-[12px] text-[#8D8D8D] ml-[28px]">
          {translateFunction(
            "Please Choose Your Payment Method About Your Bag"
          )}
        </div> */}
        {orderData?.payment?.filter((s) => s.id === 0).length > 0 && (
          <CODInput total={showCodValue()} />
        )}
        {orderData?.payment?.filter((s) => s.id === 1).length > 0 && (
          <TryDosWalletInput
            total={
              orderData?.data?.order_amount ||
              orderData?.data?.partial_payment_by_wallet ||
              orderData?.payment?.filter((s) => s.id === 1)[0].balance
            }
          />
        )}
        {orderData?.payment?.filter((s) => s.id === 2).length > 0 && (
          <CreditInput
            total={
              orderData?.data?.order_amount ||
              orderData?.payment?.filter((s) => s.id === 2)[0].balance
            }
          />
        )}
        {orderData?.payment?.filter((s) => s.id === 3).length > 0 && (
          <CryptoInput
            total={
              orderData?.data?.order_amount ||
              orderData?.payment?.filter((s) => s.id === 3)[0].balance
            }
          />
        )}
        {coupon_discount > 0 && (
          <div
            className={`w-full cursor-pointer pt-[12px] mt-[30px] ${" h-[42px] bg-[#f8f8f8]"} rounded-[15px] flex-col items-start px-[12px]`}
          >
            <div className="flex-row ">
              <div className="regular text-[#1D1D1D] text-[14px] ml-2">
                {translateFunction("Discount Coupon")}
              </div>
            </div>

            <div className="mt-[10px] w-full items-center justify-between flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative">
              <div className="flex-row items-center w-full">
                <div
                  className={`transition-all text-[#1d1d1d] apply-button 
                    min-w-full
                    flex items-center justify-center h-[40px] rounded-[15px] bg-white`}
                  style={{ border: "1px solid rgb(56 144 255 / 51%)" }}
                >
                  {`- ${RoundPrice({
                    num: coupon_discount,
                    returnNumber: true,
                  })} ${currency.symbol}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* {
                  <CouponElement
                    active={orderData.coupon}
                    setActive={() => {
                      setOrderData({ coupon: true });
                    }}
                    close={() => {
                      setOrderData({ coupon: false });
                    }}
                  />
                } */}
    </div>
  );
};
const CODInput = ({ total }) => {
  const { currency, cod_cost } = useAppStore();
  return (
    <div
      className="w-full cursor-pointer mt-[10px] items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative"
      style={{
        border: "#C4C2C28c 1px soild",
      }}
      data-cy="cachondelivry-cartpage"
    >
      <div className="flex-row items-center">
        <WalletIcon />
        <span className={`ml-[8px]  ${"text-[#1D1D1D]"} regular text-[12px]`}>
          {translateFunction("Cash On Delivery")}
        </span>
      </div>
      <div className="flex-row items-center">
        <span className="text-[#D3D3D3] regular text-[12px]">
          {translateFunction("Total")}
        </span>
        <span className="text-[#1D1D1D] semibold text-[12px] ml-1">
          {RoundPrice({ num: cod_cost, returnNumber: true })} {currency?.symbol}
        </span>
      </div>
    </div>
  );
};
const TryDosWalletInput = ({ total }) => {
  const { currency } = useAppStore();

  return (
    <div
      className="w-full cursor-pointer mt-[10px] items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative"
      style={{
        border: "#C4C2C28c 1px soild",
      }}
    >
      <div className="flex-row items-center">
        <WalletIcon />
        <span className={`ml-[8px]  ${"text-[#1D1D1D]"} regular text-[12px]`}>
          {translateFunction("Trydos Wallet")}
        </span>
      </div>
      <div className="flex-row items-center">
        <span className="text-[#D3D3D3] regular text-[12px]">
          {translateFunction("Total")}
        </span>
        <span className="text-[#1D1D1D] semibold text-[12px] ml-1">
          {RoundPrice({ num: total, returnNumber: true })} {currency?.symbol}
        </span>
      </div>
    </div>
  );
};
const CreditInput = ({ total }) => {
  return (
    <div
      style={{
        border: "#C4C2C28c 1px soild",
      }}
      className="mt-[6px] cursor-pointer w-full items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative"
    >
      <div className="flex-row items-center">
        <CreditIcon />
        <span className={`ml-[8px] ${"text-[#1D1D1D]"} regular text-[12px]`}>
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
const CryptoInput = ({ total }) => {
  return (
    <div
      onClick={(e) => {
        // @ts-ignore

        setActive();
      }}
      style={{
        border: "#C4C2C28c 1px soild",
      }}
      className="mt-[6px] cursor-pointer w-full items-center pl-[23px] justify-between pr-[26px] flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative"
    >
      <div className="flex-row items-center">
        <CryptoIcon />
        <span className={`ml-[8px] ${"text-[#1D1D1D]"} regular text-[12px]`}>
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
