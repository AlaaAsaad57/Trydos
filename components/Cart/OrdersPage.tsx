import { useRef, useState } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import {
  GetAppLanguage,
  getCart,
  RoundPrice,
  Sendevent,
  translateFunction,
} from "utils/functions";
import { useParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import ShippingAddressContainer from "./ShippingAddressContainer";
import { Swiper as SwiperType } from "node_modules/swiper/types";
import AddAddressIcon from "public/svg/cart/AddAddress.svg";
import AddAddressForm from "./AddAddressForm";
import { useDispatch, useSelector } from "react-redux";
import SelectRegion from "./SelectRegion";
import AddressListContainer from "./AddressListContainer";
import TrashIcon from "public/svg/cart/TrashIcon.svg";
import order from "services/order";
import PaymentMethod from "./PaymentMethod";
import PlaceOrderWidget from "./PlaceOrderWidget";
import PlaceOrderButtons from "./PlaceOrderButtons";

import { toast } from "react-toastify";
import Spinner from "components/global/Spinner";

const DeleteIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="18"
      height="18"
      viewBox="0 0 18 18"
    >
      <defs>
        <clipPath id="clip-path918">
          <rect
            id="Rectangle_4561"
            data-name="Rectangle 4561"
            width="18"
            height="18"
            transform="translate(0 0.385)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Group_13363"
        data-name="Group 13363"
        transform="translate(-386 -240.385)"
      >
        <g
          id="Mask_Group_510"
          data-name="Mask Group 510"
          transform="translate(386 240)"
          clipPath="url(#clip-path918)"
        >
          <g id="trash-can" transform="translate(2.023 0.386)">
            <path
              id="Path_22129"
              data-name="Path 22129"
              d="M11.7,18.555H7.789a3.52,3.52,0,0,1-3.506-3.149L3.118,4.516a.415.415,0,0,1,.412-.459H15.958a.415.415,0,0,1,.412.459L15.2,15.405A3.519,3.519,0,0,1,11.7,18.555ZM3.992,4.886,5.108,15.317a2.692,2.692,0,0,0,2.681,2.409H11.7a2.692,2.692,0,0,0,2.681-2.409L15.5,4.886Z"
              transform="translate(-2.767 -0.557)"
              fill="#f85555"
            />
            <path
              id="Path_22130"
              data-name="Path 22130"
              d="M16.364,3.349H3.24a.415.415,0,0,1,0-.829H16.364a.415.415,0,0,1,0,.829Z"
              transform="translate(-2.825 -0.864)"
              fill="#f85555"
            />
            <path
              id="Path_22131"
              data-name="Path 22131"
              d="M8.709,13.153a.415.415,0,0,1-.415-.415V7.768a.415.415,0,0,1,.829,0v4.97A.415.415,0,0,1,8.709,13.153Z"
              transform="translate(-1.732 0.102)"
              fill="#f85555"
            />
            <path
              id="Path_22132"
              data-name="Path 22132"
              d="M10.781,13.153a.415.415,0,0,1-.415-.415V7.768a.415.415,0,1,1,.829,0v4.97A.415.415,0,0,1,10.781,13.153Z"
              transform="translate(-1.318 0.102)"
              fill="#f85555"
            />
            <path
              id="Path_22133"
              data-name="Path 22133"
              d="M10.643,3.624H7.33a.415.415,0,0,1-.415-.415,2.069,2.069,0,0,1,4.138-.066.428.428,0,0,1,0,.066.415.415,0,0,1-.415.415ZM7.816,2.8h2.337a1.24,1.24,0,0,0-2.337,0Z"
              transform="translate(-2.008 -1.14)"
              fill="#f85555"
            />
            <path
              id="Path_22134"
              data-name="Path 22134"
              d="M6.637,13.153a.415.415,0,0,1-.415-.415V7.768a.415.415,0,0,1,.829,0v4.97A.415.415,0,0,1,6.637,13.153Z"
              transform="translate(-2.146 0.102)"
              fill="#f85555"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
function OrdersPage({ setStep }: { setStep: (e: number) => void }) {
  let { lang } = useParams();
  const addressDetails = useSelector(
    (state: StateInterface) => state.cart.addressDetails
  );

  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };

  const [orderStep, setOrderStep] = useState(0);
  const [AddressListsOpen, openAddressList] = useState(false);
  const ref = useRef<SwiperType>();
  const dispatch = useDispatch();
  const setAddressDetails = (e) => {
    dispatch({ type: "set-address-details", payload: e });
  };
  const [openSelect, setOpenSelect] = useState(false);
  const colseSelect = () => {
    setTimeout(() => {
      setOpenSelect(false);
    }, 300);
  };
  const colseAddressList = () => {
    setTimeout(() => {
      openAddressList(false);
    }, 300);
  };
  const [deleteModal, setDeleteModal] = useState<any>(false);
  const setOrderSuccess = async (e) => {
    try {
      if (orderData?.payment?.length === 1) {
        let payment_method =
          orderData?.payment[0]?.id === 0
            ? "COD"
            : orderData?.payment[0]?.id === 1
            ? "TrydosWallet"
            : orderData?.payment[0]?.id === 2
            ? "Card"
            : "Crypto";
        setLoading(true);
        await order.PlaceOrder({
          payment_method,
          pay_by_wallet: false,
        });
        setLoading(false);
      } else {
        if (
          orderData.payment.length &&
          orderData?.payment?.filter((one) => one.id === 2).length
        ) {
          setLoading(true);
          await order.PlaceOrder({
            payment_method: "Card",
            pay_by_wallet: true,
          });
          setLoading(false);
        }
        if (
          orderData.payment.length &&
          orderData?.payment?.filter((one) => one.id === 3).length
        ) {
          setLoading(true);
          await order.PlaceOrder({
            payment_method: "Crypto",
            pay_by_wallet: true,
          });
          setLoading(false);
        }
        if (
          orderData.payment.length &&
          orderData?.payment?.filter((one) => one.id === 0).length
        ) {
          setLoading(true);
          await order.PlaceOrder({
            payment_method: "COD",
            pay_by_wallet: true,
          });
          setLoading(false);
        }
      }
    } catch (error) {
      getCart({
        callback: ([data, res]) => {
          dispatch({
            type: "CART-INIT",
            payload: data ?? { cart: [] },
          });
        },
      });
      setStep(0);
    }
  };

  const setLoading = (e) => {
    dispatch({ type: "ORDER-DATA", payload: { loading: e } });
  };
  const orderData = useSelector(
    (state: StateInterface) => state.cart.orderData
  );
  const [nextStep, setNextStep] = useState(false);

  return (
    <div
      className={`pb-[10px]
     flex-col relative  top-0 left-0 min-h-[100vh] max-h-[100vh] h-auto overflow-hidden w-full bg-[#ffffff] min-w-[100vw] z-[9999999999] pt-1`}
    >
      {deleteModal && (
        <DeleteModalComponent
          slidePrev={() => {
            ref.current.slidePrev();
          }}
          deletedAddress={deleteModal}
          closeModal={() => setDeleteModal(false)}
        />
      )}
      {openSelect && (
        <SelectRegion
          closeSelect={() => {
            colseSelect();
          }}
        />
      )}
      <Swiper
        initialSlide={orderStep}
        keyboard={{
          enabled: false,
        }}
        navigation={false}
        onInit={(swiper) => {
          ref.current = swiper;
        }}
        allowTouchMove={false}
        draggable={false}
        className="w-full"
        slidesPerView={1}
        wrapperClass="flex  h-full"
      >
        <SwiperSlide
          className={` min-w-[100vw] h-[100vh] relative cart-widget`}
        >
          {AddressListsOpen && (
            <AddressListContainer
              Delete={(e) => {
                setDeleteModal(e);
              }}
              slideNext={() => {
                ref.current.slideNext();
              }}
              closeSelect={(e) => {
                colseAddressList();
              }}
            />
          )}
          <div className="flex-col pl-2 pr-2 bg-[#fff] p-1 ">
            <div className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center ">
              <BackIcon
                className="cursor-pointer z-50"
                onClick={() => {
                  Sendevent({
                    event: "button_clicked",
                    value: "appbar_backicon_button",
                  });
                  setStep(0);
                  setOrderStep(0);
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
                    clipPath="url(#clip-path22)"
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
          <div className="flex-col overflow-auto pb-[292px] max-h-full">
            <ShippingAddressContainer
              openAddressList={(e) => {
                openAddressList(e);
              }}
              slideNext={() => {
                ref.current.slideNext();
              }}
              slidePrev={() => {
                ref.current.slidePrev();
              }}
            />
            <PaymentMethod />
          </div>
          <OrderButtons
            setNext={() => {
              setNextStep(true);
              setTimeout(() => {
                ref.current.slideNext();
              }, 600);
            }}
            setPrev={() => {
              setNextStep(false);
              getCart({
                callback: ([data, res]) => {
                  dispatch({
                    type: "CART-INIT",
                    payload: data ?? { cart: [] },
                  });
                },
              });
              ref.current.slidePrev();
              setStep(0);
            }}
            orderLoading={false}
          />
        </SwiperSlide>
        <SwiperSlide className="min-w-[100vw] relative max-h-[100vh]  h-[100vh] cart-widget overflow-hidden">
          {({ isActive }) => (
            <>
              {nextStep ? (
                <>
                  <div className="flex-col pl-2 pr-2 bg-[#fff] p-1">
                    {!orderData.success && (
                      <div className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center ">
                        <BackIcon
                          className="cursor-pointer z-50"
                          onClick={() => {
                            Sendevent({
                              event: "button_clicked",
                              value: "appbar_backicon_button",
                            });
                            ref.current.slidePrev();
                            setNextStep(false);
                          }}
                        />
                        <span className="text-[13px] text-[#505050] regular flex-row items-center ">
                          <AddAddressIcon />
                          <span className="regular ml-[8px]">
                            <>{translateFunction("Shipping & Payment")}</>
                          </span>
                        </span>
                        <span
                          onClick={() => {
                            if (addressDetails.id) {
                              setDeleteModal(addressDetails);
                            }
                          }}
                        >
                          {addressDetails.id && <DeleteIcon />}
                        </span>
                      </div>
                    )}
                    <PlaceOrderWidget />
                  </div>
                  <PlaceOrderButtons
                    orderLoading={false}
                    backToCart={() => {
                      getCart({
                        callback: ([data, res]) => {
                          dispatch({
                            type: "CART-INIT",
                            payload: data ?? { cart: [] },
                          });
                        },
                      });
                      setStep(0);
                    }}
                    successOrder={() => setOrderSuccess(true)}
                  />
                </>
              ) : (
                <>
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
                          setNextStep(false);
                        }}
                      />
                      <span className="text-[13px] text-[#505050] regular flex-row items-center ">
                        <AddAddressIcon />
                        <span className="regular ml-[8px]">
                          <>
                            {addressDetails.id
                              ? translate("Edit Shipping Address")
                              : translate("Add Shipping Address")}
                          </>
                        </span>
                      </span>
                      <span
                        onClick={() => {
                          if (addressDetails.id) {
                            setDeleteModal(addressDetails);
                          }
                        }}
                      >
                        {addressDetails.id && <DeleteIcon />}
                      </span>
                    </div>
                  </div>
                  <AddAddressForm
                    activeIndex={isActive}
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
                </>
              )}
            </>
          )}
        </SwiperSlide>
      </Swiper>
    </div>
  );
}

export default OrdersPage;
const DeleteModalComponent = ({ closeModal, deletedAddress, slidePrev }) => {
  const dispatch = useDispatch();
  const addressLists = useSelector(
    (state: StateInterface) => state.cart.addressLists
  );
  const GetAddressString = (location) => {
    let str = "";
    if (
      location.province &&
      location.province.length > 0 &&
      location.province !== "null"
    )
      str += `${location.province}`;
    if (location.city && location.city.length > 0 && location.city !== "null")
      str += ` | ${location.city}`;
    if (location.town && location.town.length > 0 && location.town !== "null")
      str += ` | ${location.town}`;
    if (
      location.street &&
      location.street.length > 0 &&
      location.street !== "null"
    )
      str += ` | ${location.street}`;
    if (
      location.building &&
      location.building.length > 0 &&
      location.building !== "null"
    )
      str += ` | ${location.building}`;
    return str;
  };
  return (
    <>
      <div
        className="absolute top-0 left-0 min-w-[100vw] z-[999999998] min-h-[100vh] opacity-60 bg-[black]"
        onClick={() => {
          closeModal();
        }}
      />
      <div
        className="flex-col w-full h-full px-[24px] absolute z-[999999999]  justify-between"
        style={{
          backdropFilter: "blur(7px) brightness(1.3)",
        }}
      >
        <span />
        <div className="flex-col items-center">
          <TrashIcon />
          <span className="medium text-[16px] mt-[1px] text-[#fff]">
            {translateFunction("Delete Below Address?")}
          </span>
          <div
            style={{
              border: "#D3D3D38c 1px solid",
            }}
            className={`flex-col pl-[24px] relative h-auto max-w-[600px]  min-h-[90px] items-center justify-center  mt-[12px] rounded-[15px] bg-[#f8f8f800] w-full `}
          >
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
                    fill="#D3D3D3"
                  />
                </svg>

                <span className="regular ml-[4px] text-[12px] text-[#D3D3D3]">
                  {deletedAddress.address}
                </span>
              </div>
              <div className="flex-row mt-[5px]  items-center regular text-[12px] text-[#D3D3D3]">
                {GetAddressString(deletedAddress.region_details)}
              </div>
              <div className="flex-row mt-[5px] items-center regular text-[12px] text-[#D3D3D3]">
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
                        fill="#D3D3D3"
                      />
                    </g>
                  </g>
                </svg>

                <div className="flex-row ml-[4px]   items-center regular text-[12px] text-[#D3D3D3]">
                  {deletedAddress.contact_info.phone}
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
                          fill="#D3D3D3"
                        />
                        <path
                          id="Path_21"
                          data-name="Path 21"
                          d="M643.18,174.122l.141-.584a.341.341,0,0,1,.1-.169l-.042-.032-1.261-1.044-.768.184a2.785,2.785,0,0,0-2.214,2.662v1.653a.613.613,0,0,0,.635.585h3.247l.495-2.822a.344.344,0,0,1-.333-.432Z"
                          transform="translate(-639.136 -165.377)"
                          fill="#D3D3D3"
                        />
                        <path
                          id="Path_22"
                          data-name="Path 22"
                          d="M662.939,172.471l-.756-.184-1.259,1.044-.042.032a.341.341,0,0,1,.1.169l.141.584a.344.344,0,0,1-.333.425l.495,2.822h3.246a.59.59,0,0,0,.61-.585v-1.653a2.772,2.772,0,0,0-2.2-2.655Z"
                          transform="translate(-655.714 -165.376)"
                          fill="#D3D3D3"
                        />
                      </g>
                    </g>
                  </svg>

                  <div className="flex-row  ml-[4px]  items-center regular text-[12px] text-[#D3D3D3]">
                    {deletedAddress.contact_info.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-col w-full  delete-button-address">
          <div
            onClick={() => {
              slidePrev();
              closeModal();
              order.DeleteAddressList({ address: deletedAddress.id });
              dispatch({ type: "DELETE-ADDRESS", payload: deletedAddress.id });
            }}
            className="w-full cursor-pointer flex justify-center items-center rounded-[15px] h-[50px] bg-[#F8F8F8] bold text-[16px] text-[#FF5F61]"
            style={{
              border: "#ff5f6282 1px solid",
            }}
          >
            {translateFunction("Yes Delete")}
          </div>
          <div
            onClick={() => {
              closeModal();
            }}
            className="w-full flex justify-center items-center cursor-pointer  rounded-[15px] h-[50px] bg-transparent regular text-[16px] text-[#fff]"
          >
            {translateFunction("Cancel")}
          </div>
        </div>
      </div>
    </>
  );
};
const OrderButtons = ({ orderLoading, setNext, setPrev }) => {
  const cart = useSelector((state: StateInterface) => state.cart);
  const currency_symbol = useSelector(
    (state: StateInterface) => state.homepage.currency
  );
  const orderData = useSelector(
    (state: StateInterface) => state.cart.orderData
  );

  const address = useSelector(
    (state: StateInterface) => state.cart.addressLists
  );
  const shake = (v) => {
    if (document.querySelector(`.${v}`)) {
      document.querySelector(`.${v}`).scrollIntoView({ block: "end" });
      document.querySelector(`.${v}`).classList.add("shake-anim");
      setTimeout(() => {
        document.querySelector(`.${v}`).classList.remove("shake-anim");
      }, 1300);
    }
  };
  const wallet = useSelector((state: StateInterface) => state.cart.wallet);
  const totalBalance = () => {
    let val = 0;
    orderData.payment.map((s) => {
      val += s.balance;
    });
    return val;
  };
  const isBalanceEnough = () => {
    return (
      RoundPrice({ num: totalBalance(), returnNumber: true }) >=
      RoundPrice({ num: cart.total_cash, returnNumber: true })
    );
  };
  const isValid = () => {
    let defaultAddress =
      address.filter((s) => s.is_default === 1)?.length > 0 &&
      address.filter((s) => s.is_default === 1)[0];
    if (
      defaultAddress &&
      defaultAddress?.id &&
      orderData.payment.length > 0 &&
      isBalanceEnough()
    ) {
      return true;
    } else {
      return false;
    }
  };
  const Validate = () => {
    if (!isBalanceEnough()) {
      shake("payment-valid-border");
      // alert(translateFunction("Your Balance Not meet purchase value"));
    }
    if (!address[0]?.id) {
      shake("address-valid-border");
    }
    if (orderData.payment?.length === 0) {
      shake("payment-valid-border");
    }
  };
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const VerifyCart = async () => {
    setLoading(true);
    let a = (
      await getCart({
        callback: ([data, res]) => {
          dispatch({ type: "CART-INIT", payload: data ?? { cart: [] } });
        },
      })
    ).cart.filter((s) => s.check_availability === false);

    if (a?.length === 0) {
      setNext();
    } else {
      toast.error("Please Review Your Cart Some Products Not Available");
      setPrev();
    }
    setLoading(false);
  };
  return (
    <div className="absolute flex-col items-center payment-order-bottom left-0 w-full">
      <div
        style={{
          boxShadow: "0px -3px 20px #0000001a",
        }}
        className={`   text-center  left-0 w-full h-[100px] bg-[#fff] px-[20px] pt-[12px]`}
      >
        <div
          onClick={() => {
            Validate();
            if (isValid() && !orderLoading) {
              VerifyCart();
            }
          }}
          className={` ${
            orderData.loading && "opacity-65 scale-95"
          } w-full text-center  justify-center cursor-pointer flex-col items-center h-[70px] ${
            isValid() ? "bg-[#346BFF]" : "bg-[#C4C2C2]"
          } text-[#FEFEFE] text-[18px] medium rounded-[20px]`}
        >
          {orderLoading || loading ? (
            <Spinner />
          ) : (
            <>
              <span>{translateFunction("Confirm Shipping & Payment")}</span>
              <span
                className={`text-[#FEFEFE] text-[14px] medium ${
                  GetAppLanguage() === "ar" && "dir-rtl"
                } `}
              >
                {cart.cart.length} {translateFunction("items")}{" "}
                {RoundPrice({ num: cart.total_cash })} {currency_symbol?.symbol}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
