import React, { useEffect, useState } from "react";

import { getConfiguredImage, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import order from "services/order";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";

import { formatTimeForAddress, GetImageUrl } from "utils/tinyUtils";
import home from "services/home";

import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import { GetCountries } from "serverRequests/product";
function ShippingAddressContainer({ slideNext, slidePrev, openAddressList }) {
  const { setCountries, cart, user } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const [country, language] = lang?.split("-");

  const getOrderData = async () => {
    order.GetWallet();
    order.GetAddressList();
    if (sessionStorage.getItem(`countries-${country}-${language}`)) {
      let data = sessionStorage.getItem(`countries-${country}-${language}`);
      setCountries(JSON.parse(data));
    } else {
      try {
        const data = await GetCountries({ country, language });
        sessionStorage.setItem(
          `countries-${country}-${language}`,
          JSON.stringify(data),
        );
        setCountries(data);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    }
  };
  useEffect(() => {
    if (user) {
      getOrderData();
    }
  }, [user]);
  return (
    <div data-cy="deliveryAddress-viewer" className="flex flex-col w-full p-3">
      <CartItemSelect />
      <ShippingAddressInput
        openAddressList={(e) => {
          openAddressList(e);
        }}
        slideNext={slideNext}
        slidePrev={slidePrev}
      />
    </div>
  );
}

export default ShippingAddressContainer;

const CartItemSelect = () => {
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const [openCart, setOpenCart] = useState(true);
  const { cart } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      data-cy="bag-viewer"
      style={{
        border: "1px solid rgb(196 194 194 / 51%)",
        borderRadius: "15px",
      }}
      className={`flex-col ${
        openCart && "pt-[15px]"
      } relative  justify-center w-full min-h-[50px] cursor-pointer ${
        isRtl ? "pr-[12px] items-end" : "pl-[12px] items-start"
      }`}
      onClick={() => {
        setOpenCart(!openCart);
      }}
    >
      <span
        className={`${
          isRtl ? "left-[12px]" : "right-[12px]"
        } absolute top-[22px]  `}
        data-cy="DropDownIcon"
      >
        <svg
          data-cy="dropDownIcon-svg"
          className={`${openCart && "rotate-180"} transition`}
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 10 6"
        >
          <path
            id="Path_15448"
            data-name="Path 15448"
            d="M4.245,5.7a1.111,1.111,0,0,0,1.51,0L9.573,2.258A1.3,1.3,0,0,0,8.818,0H1.182A1.3,1.3,0,0,0,.427,2.258Z"
            fill="#8d8d8d"
          />
        </svg>
      </span>
      <div data-cy="bag-viewer-inside" className="flex-row ">
        <img src="/icons/orderCartIcon.svg" data-cy="Order-Cart-Icon" />
        <div
          data-cy="Shopping-bag-texts"
          className="regular text-[#1D1D1D] text-[14px] ml-2"
        >
          {translateFunction("Your Shopping Bag", language)}
          <span
            className={language === "ar" ? "mr-1 bold" : "ml-1 bold"}
            data-cy="Count-Of-Shiping"
          >
            {cart.length}
            <span data-cy="items-Shiping-text" className={"ml-1"}>
              {translateFunction("items", language)}
            </span>
          </span>
        </div>
      </div>
      <div
        data-cy="bag-product-viewer"
        className={`${
          !openCart ? "h-0 pb-0 pt-0" : `pl-[11px] pb-[12px] pt-[11px] `
        } transition flex-row `}
      >
        {openCart &&
          cart.map((s, i) => {
            return (
              <div className="flex flex-col items-center">
                <div className="flex relative h-[125px]" key={i} data-cy="Item">
                  <span
                    className="absolute z-20 rounded-full w-[25px] h-[25px] text-center flex items-center justify-center text-[#1d1d1d] light text-[14px] bg-[#bef4cd] shadow-md top-[-5px] right-[-5px]"
                    data-cy="cart-item-quantity-label"
                  >
                    {s.quantity}
                  </span>
                  <span
                    data-cy="span-item"
                    className="absolute w-[91px] h-full z-10 rounded-[15px]"
                    style={{
                      boxShadow: "#ffffff80 0px 3px 6px inset",
                    }}
                  />
                  <img
                    data-cy="img-item"
                    className="w-[91px] h-[125px] rounded-[15px]"
                    src={getConfiguredImage({
                      src: GetImageUrl(s.image),
                      width: 91,
                      height: 150,
                    })}
                  />
                </div>
                <div className="flex text-[12px] text-[#1d1d1d] flex-col items-center mt-1">
                  {s.variations?.Size || s?.variation?.size_options ? (
                    <span>
                      {s.variations?.Size ?? s?.variations?.size_options}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                  {s.variations?.color || s?.variations?.color_options ? (
                    <span>
                      {s.variations?.color ?? s?.variations?.color_options}
                    </span>
                  ) : (
                    <span className="h-[18px]" />
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const ShippingAddressInput = ({ slideNext, slidePrev, openAddressList }) => {
  const { initAddressForm, addressLists, orderLoading } = useAppStore();
  const { lang } = useParams();

  // @ts-ignore
  const language = lang.split("-")[1];

  return (
    <div
      data-cy="delivery-address-viewer"
      style={{
        border: "1px solid rgb(196 194 194 / 51%)",
        borderRadius: "15px",
      }}
      className={`address-valid-border flex-col mt-[11px] pb-[12px] relative pr-[12px] pl-[12px] justify-start pt-[15px] w-full ${" min-h-[203px]"}`}
    >
      <div
        className={`flex-row ${
          language === "ar" || language === "ku" ? "flex-row-reverse" : ""
        }`}
        data-cy="ShipingBox"
      >
        <svg
          data-cy="WrapIcon"
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
        <div
          data-cy="delivery-address-stexts"
          className={`regular text-[#1D1D1D] text-[14px] ml-2 ${
            language === "ar" || language === "ku" ? "text-right" : ""
          }`}
        >
          {translateFunction("Shipping & Delivery Address", language)}
        </div>
        <span data-cy="freeShupping-container" className="bold ml-[11px]">
          <img
            src="/icons/FreeShipping.svg"
            data-cy="WrapIcon1"
            className="w-[30px] h-[30px]"
          />
        </span>
        {orderLoading && (
          <span className="bold ml-[11px]">
            <Spinner />
          </span>
        )}
      </div>
      <div
        data-cy="please-text"
        className={`regular text-[12px] text-[#8D8D8D] ml-[28px] ${
          language === "ar" || language === "ku" ? "text-right" : ""
        }`}
      >
        {translateFunction(
          "Please Enter Shipping Address To Receive Your Bag",
          language,
        )}
      </div>
      <AddressContainer
        lang={language}
        openAddressList={(e) => {
          openAddressList(e);
        }}
      />
      {addressLists?.length > 0 ? (
        <>
          <div
            onClick={() => {
              openAddressList(true);
            }}
            className="flex-row w-full justify-center items-center cursor-pointer mt-[11px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="15"
              height="15"
              viewBox="0 0 15 15"
            >
              <defs>
                <clipPath id="clip-path8780">
                  <rect
                    id="Rectangle_4612"
                    data-name="Rectangle 4612"
                    width="15"
                    height="15"
                    transform="translate(0)"
                    fill="none"
                  />
                </clipPath>
              </defs>
              <g
                id="Group_13042"
                data-name="Group 13042"
                transform="translate(0 -0.389)"
              >
                <g
                  id="Mask_Group_380"
                  data-name="Mask Group 380"
                  transform="translate(0 0.389)"
                  clipPath="url(#clip-path8780)"
                >
                  <g id="delivery_location" transform="translate(0.969 -0.03)">
                    <g id="Group_11335" data-name="Group 11335">
                      <g
                        id="Group_11333"
                        data-name="Group 11333"
                        transform="translate(0 4)"
                      >
                        <path
                          id="Path_21554"
                          data-name="Path 21554"
                          d="M12.273,13.56H7.242a.182.182,0,0,1-.182-.194.189.189,0,0,1,.182-.194h5.03a1.712,1.712,0,0,0,1.758-1.758,1.709,1.709,0,0,0-.436-1.079,1.738,1.738,0,0,0-1.321-.57H9.109a2.061,2.061,0,1,1,0-4.121h2.582a.182.182,0,0,1,.182.194.173.173,0,0,1-.194.17H9.109a1.691,1.691,0,0,0,0,3.382h3.164A2.086,2.086,0,0,1,14.406,11.4a2.112,2.112,0,0,1-2.133,2.158Z"
                          transform="translate(-2.964 -5.645)"
                          fill="#8d8d8d"
                        />
                        <g
                          id="Group_11332"
                          data-name="Group 11332"
                          transform="translate(0 5.261)"
                        >
                          <ellipse
                            id="Ellipse_269"
                            data-name="Ellipse 269"
                            cx="0.812"
                            cy="0.824"
                            rx="0.812"
                            ry="0.824"
                            transform="translate(1.418 1.406)"
                            fill="#8d8d8d"
                          />
                          <path
                            id="Path_21555"
                            data-name="Path 21555"
                            d="M3.843,12.645a2.2,2.2,0,0,0-2.23,2.17,2.053,2.053,0,0,0,.424,1.261v.012l1.636,2.255a.189.189,0,0,0,.145.073.173.173,0,0,0,.145-.073l1.661-2.255a.012.012,0,0,1,.012-.012,2.105,2.105,0,0,0,.424-1.261A2.186,2.186,0,0,0,3.843,12.645Zm0,3.418a1.2,1.2,0,1,1,1.188-1.2A1.192,1.192,0,0,1,3.843,16.063Z"
                            transform="translate(-1.613 -12.645)"
                            fill="#8d8d8d"
                          />
                        </g>
                      </g>
                      <g
                        id="Group_11334"
                        data-name="Group 11334"
                        transform="translate(8.048)"
                      >
                        <path
                          id="Path_21556"
                          data-name="Path 21556"
                          d="M12.323,2.807h5.042L14.844.323Z"
                          transform="translate(-12.323 -0.323)"
                          fill="#8d8d8d"
                        />
                        <path
                          id="Path_21557"
                          data-name="Path 21557"
                          d="M12.984,7.329h1.139v-1.5a.189.189,0,0,1,.182-.194h1.406a.182.182,0,0,1,.182.194v1.5h1.139v-3.2H12.984Z"
                          transform="translate(-12.487 -1.268)"
                          fill="#8d8d8d"
                        />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
            <span
              className="ml-[4px] flex medium text-[12px] text-[#8D8D8D] "
              data-cy="Show-Address-That-Added"
            >
              {translateFunction("Show Address List")}
            </span>
          </div>
        </>
      ) : (
        <AddAddressButton
          onClick={() => {
            initAddressForm();

            slideNext();
          }}
        />
      )}
    </div>
  );
};
const AddressContainer = ({ openAddressList, lang }) => {
  const [loading, setLoading] = useState(false);
  const getData = async () => {
    setLoading(true);
    await home.getClientData();
    setLoading(false);
  };
  useEffect(() => {
    getData();
  }, []);
  const { addressLists, cart, settings, total_shipping_cost } = useAppStore();

  let defaultAddress = addressLists.filter((s) => s.is_default === 1)[0];

  return (
    <div
      data-cy="addresses-viewer"
      onClick={() => {
        if (addressLists?.length > 0) {
          openAddressList(true);
        }
      }}
      style={{
        border: addressLists?.length !== 0 && "#388bff8c 1px solid",
      }}
      className={`flex-col  ${
        addressLists?.length === 0
          ? "items-center h-[84px]   py-[12px]"
          : "items-start h-auto min-h-[90px] px-[24px]  py-[7px]"
      } mt-[10px] rounded-[15px] bg-[#F8F8F8] w-full ${
        lang === "ar" || lang === "ku" ? "text-right" : ""
      } ${lang === "ar" || lang === "ku" ? "flex-row-reverse" : ""}`}
    >
      {defaultAddress ? (
        <>
          <DefaultAddress
            loading={loading}
            defaultAddress={defaultAddress}
            language={lang}
          />
        </>
      ) : (
        <>
          <span data-cy="span-noAddress" className="">
            <svg
              data-cy="span-noAddress-svg"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
            >
              <g
                id="Group_13008"
                data-name="Group 13008"
                transform="translate(-65 -464)"
              >
                <g
                  id="Group_10756"
                  data-name="Group 10756"
                  transform="translate(65 464)"
                >
                  <path
                    id="Subtraction_1"
                    data-name="Subtraction 1"
                    d="M.305,11.241a.3.3,0,0,1-.182-.063.338.338,0,0,1-.111-.353L.787,8.273A5.591,5.591,0,0,1,0,5.408,5.313,5.313,0,0,1,5.2,0a5.313,5.313,0,0,1,5.2,5.408,5.314,5.314,0,0,1-5.2,5.41,5.064,5.064,0,0,1-2.917-.926L.478,11.187A.278.278,0,0,1,.305,11.241Zm4.847-3.1a.666.666,0,1,0,.656.666A.652.652,0,0,0,5.152,8.145Zm.134-5.308A1.026,1.026,0,0,1,6.4,3.864c0,.5-.213.816-.815,1.194a1.672,1.672,0,0,0-.953,1.5v.118c0,.373.2.6.521.6.3,0,.47-.189.5-.548.024-.519.211-.78.833-1.162A1.964,1.964,0,0,0,5.331,1.887a2.1,2.1,0,0,0-2.05,1.146,1.384,1.384,0,0,0-.135.6.45.45,0,0,0,.482.506c.261,0,.407-.126.5-.434A1.109,1.109,0,0,1,5.286,2.837Z"
                    transform="translate(0 2.758)"
                    fill="#c4c2c2"
                  />
                  <path
                    id="Path_21380"
                    data-name="Path 21380"
                    d="M11.934,11.258a.3.3,0,0,1-.184.064.277.277,0,0,1-.171-.055L9.773,9.973l-.02.013a6.2,6.2,0,0,0,.469-2.376A5.937,5.937,0,0,0,4.41,1.564a5.512,5.512,0,0,0-1.277.148A5.047,5.047,0,0,1,6.857.079a5.314,5.314,0,0,1,5.2,5.409,5.574,5.574,0,0,1-.787,2.864l.775,2.554a.335.335,0,0,1-.11.352Z"
                    transform="translate(0.79 0.557)"
                    fill="#c4c2c2"
                  />
                  <rect
                    id="Rectangle_4714"
                    data-name="Rectangle 4714"
                    width="13.459"
                    height="14"
                    transform="translate(0.541)"
                    fill="none"
                  />
                </g>
              </g>
            </svg>
          </span>
          <div
            data-cy="noAddress-text"
            className="flex medium text-[12px] text-[#C4C2C2] mt-[12px]"
          >
            {translateFunction("No Address Selected")}
          </div>
          <div
            data-cy="canAdd-text"
            className="flex regular text-[12px] text-[#C4C2C2] mt-[3px]"
          >
            {translateFunction("You Can Also Create Multiple Addresses To Use")}
          </div>
        </>
      )}
    </div>
  );
};
const AddAddressButton = ({ onClick }) => {
  return (
    <div
      data-cy="AddAddres"
      className="flex cursor-pointer w-full justify-center h-[40px] mt-[8px] items-center bg-[#E8FFED]"
      style={{
        border: "1px solid rgb(196 194 194 / 51%)",
        borderRadius: "15px",
      }}
      onClick={() => {
        onClick();
      }}
    >
      <img src="/icons/AddAddress.svg" data-cy="AddAddres-svg" />
      <div
        data-cy="addShipping-text"
        className="medium text-[12px] ml-1 text-[#1D1D1D]"
      >
        {translateFunction("Add New Shipping Address")}
      </div>
    </div>
  );
};
const DefaultAddress = ({
  defaultAddress,
  loading,
  language,
}: {
  defaultAddress: any;
  loading: boolean;
  language: string;
}) => {
  const { cart, settings, total_shipping_cost } = useAppStore();
  const getDeliveryDate = () => {
    let shippingDay = 0;
    cart.forEach((item) => {
      if (Number(item.shipping_days) > Number(shippingDay)) {
        shippingDay = Number(item.shipping_days);
      }
    });
    shippingDay +=
      Number(settings?.["starting_setting"]?.shipping_duration_days) || 0;
    return formatTimeForAddress(
      new Date(
        new Date().getTime() + Number(shippingDay) * 24 * 60 * 60 * 1000,
      ).toString(),
    );
  };

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
  useEffect(() => {
    if (defaultAddress?.id) {
      GAevent({
        action: GA_EVENT_NAMES.ADD_ADDRESS,
        params: {
          shipping_tier: total_shipping_cost > 0 ? "Paid" : "Free",
          items: cart.map((item) => ({
            item_id: item.product_id,
            item_name: item.name,
            quantity: item.quantity,
          })),
        },
      });
      trackOrder(ORDER_EVENTS.ADDRESS_SELECTED, {
        address_id: defaultAddress.id,
        shipping_tier: total_shipping_cost > 0 ? "Paid" : "Free",
        shipping_cost: total_shipping_cost,
      });
    }
  }, []);
  const isRtl = language === "ar" || language === "ku";
  return (
    <div
      data-cy="flex-cols"
      className={`${isRtl ? "items-end" : "items-start"} flex-col w-full `}
    >
      <div
        data-cy="flex-row items-centers"
        className={`items-center gap-[4px]  ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <svg
          data-cy="flex-col-svg"
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

        <span
          data-cy="regular-addresses"
          className={`regular  text-[12px] text-[#8D8D8D] flex-row ${
            language === "ar" || language === "ku"
              ? "flex-row-reverse pl-2"
              : ""
          }`}
        >
          {defaultAddress?.address}
        </span>
      </div>
      <div
        data-cy="Address-Added-Last"
        className={`flex-row mt-[5px]  items-center regular text-[12px] text-[#8D8D8D] ${
          language === "ar" || language === "ku" ? "flex-row-reverse pl-2" : ""
        }`}
      >
        {GetAddressString(defaultAddress?.region_details)}
      </div>
      <div
        data-cy="Address-Added-Last-flex-row"
        className={`gap-[4px] flex mt-[5px] items-center regular text-[12px] text-[#8D8D8D] ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <svg
          data-cy="Address-Added-Last-flex-row-svg"
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

        <div
          data-cy="defaultAddress-contactinfo"
          className={`items-center regular text-[12px] text-[#8D8D8D] ${
            isRtl ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {defaultAddress?.contact_info?.phone}
        </div>
        <div
          data-cy="flexs-container"
          className="flex-row mx-[17px] gap-[4px]  items-center"
        >
          <svg
            data-cy="flexs-container-svg"
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

          <div
            data-cy="defaultAddress-contactpersonname"
            className={`flex-row   items-center regular text-[12px] text-[#8D8D8D] ${
              language === "ar" || language === "ku" ? "flex-row-reverse" : ""
            }`}
          >
            {defaultAddress?.contact_info?.contact_person_name ||
              // @ts-ignore
              defaultAddress?.contact_info?.name}
          </div>
        </div>
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } gap-[4px] flex text-[10px]  bg-[#FFFFFF] rounded-[12px] w-full h-[31px] justify-center items-center`}
      >
        <span className="text-[#8D8D8D] regular ">
          {translateFunction("Expected Delivery")}
        </span>
        <span className="text-[#1D1D1D] regular">
          {loading ? <Spinner /> : getDeliveryDate()}
        </span>
        <span className="text-[#388CFF] regular underline cursor-pointer">
          {translateFunction("Delivery Note")}
        </span>
      </div>
    </div>
  );
};
