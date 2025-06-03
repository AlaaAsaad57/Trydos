import Image from "node_modules/next/image";
import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "store";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import OrderStatusIcon from "components/settings/cards/OrderStatusIcon";
import CancelOrderItemIcon from "public/svg/cancelOrderItemIcon.svg";
import { AxiosGet } from "utils/AxiosApi";
import LargeColorIcon from "public/svg/LargeColorIcon.svg";
import Spinner from "components/global/Spinner";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

function OrderItemCard({ item, editOrderItem, orderItemData }) {
  const { selectedOrder, currency } = useAppStore();
  const [ConfirmationData, setConfirmationData] = useState({
    enable: false,
    loading: false,
    currentColor: item?.variation?.color,
    newColor: null,
    currentSize: item?.variation?.Size,
    newSize: null,
    productDetails: null,
    type: null,
  });
  const getProductDetails = async () => {
    setConfirmationData({ ...ConfirmationData, loading: true });
    let [data1, data2] = await Promise.all([
      AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/product/qtyPriceDetails/${item?.product_slug}`,
        title: "Get Product Vriantes",
      }),
      AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/product/globalDetails/${item?.product_slug}`,
        title: "GEt Product Global Details",
      }),
    ]);

    setConfirmationData({
      ...ConfirmationData,
      productDetails: { ...data1, ...data2 },
      loading: false,
    });
  };
  return (
    <>
      {ConfirmationData?.enable && (
        <ModifyOrderItemModal
          orderItemData={orderItemData}
          editOrderItem={(e) => editOrderItem(e)}
          orderItem={item}
          setConfirmationData={setConfirmationData}
          type={ConfirmationData.type}
          confirmationData={ConfirmationData}
          getProductDetails={getProductDetails}
        />
      )}
      <div className="flex-row w-full h-[170px] bg-[#fff] py-[6px]">
        <Image
          src={item.image}
          width={104}
          height={144}
          alt="image"
          className="object-cover object-center rounded-[15px] w-[104px] h-[144px]"
        />
        <div className="py-[6px] ml-[12px] flex-col h-full w-full pr-[20px]">
          {item.brand?.image ? (
            <span className="flex-row">
              <Image
                alt="image"
                src={getConfiguredImage({
                  height: 150,
                  width: 150,
                  src: item.brand?.image,
                })}
                height={10}
                style={{
                  top: "0px",
                  maxHeight: "100%",
                  display: "flex",
                }}
                className="object-contain h-4 max-w-[90px] w-auto"
              />
            </span>
          ) : (
            <span className="h-[10px]"></span>
          )}
          <span className="text-[12px]  regular text-[#505050]">
            {item?.product_details?.name}
          </span>
          {item.variation?.color && (
            <div className="flex-row items-center justify-between">
              <p className="text-[10px]   regular text-[#8D8D8D]">
                {translateFunction("Color")}:
                <span className="text-[12px] ml-[3px] medium text-[#505050]">
                  {item.variation?.color}
                </span>
              </p>
              <div
                className="flex-row items-center"
                onClick={() => {
                  setConfirmationData({
                    ...ConfirmationData,
                    enable: true,
                    type: "Color",
                    loading: true,
                  });
                }}
              >
                <span className="text-[10px] regular text-[#388CFF]  underline">
                  {translateFunction("Change")}
                </span>
              </div>
            </div>
          )}
          {item.variation?.Size && (
            <div className="flex-row items-center justify-between">
              <p className="text-[10px]   regular text-[#8D8D8D]">
                {translateFunction("Size")}:
                <span className="text-[12px] ml-[3px] medium text-[#505050]">
                  {item.variation?.Size}
                </span>
              </p>
              <div
                className="flex-row items-center"
                onClick={() => {
                  setConfirmationData({
                    ...ConfirmationData,
                    enable: true,
                    type: "Size",
                    loading: true,
                  });
                }}
              >
                <span className="text-[10px] regular text-[#388CFF]  underline">
                  {translateFunction("Change")}
                </span>
              </div>
            </div>
          )}
          <p className="text-[10px]   regular text-[#8D8D8D] flex-row items-center">
            {translateFunction("Item Status")}:
            <span className="text-[12px] ml-[3px] medium text-[#505050]">
              {item?.order_status}
            </span>
            <span className="ml-[12px]">
              <OrderStatusIcon status={item?.order_status || ""} />
            </span>
          </p>
          <div className="flex-row items-center">
            {item.price_after_discount >= 0 && (
              <div className="line-through text-[#C4C2C2] regular text-[12px]  line-through-[#C4C2C2]">
                {RoundPrice({ num: item.price })}
              </div>
            )}
            <div className="text-[#1D1D1D] text-[12px] ml-[4px] bold">
              {RoundPrice({ num: item.price_after_discount })}
            </div>
            <span className="text-[#1D1D1D] light text-[10px] ml-[4px]">
              {currency?.symbol}
            </span>
          </div>
          <div
            className="flex-row items-center mt-auto"
            onClick={() => {
              editOrderItem([
                ...orderItemData?.filter((s) => s.id !== item?.id),
              ]);
            }}
          >
            <CancelOrderItemIcon />
            <span className="text-[10px] regular text-[#FF5F61] ml-[4px] underline">
              {translateFunction("Cancel This Product")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderItemCard;
const ModifyOrderItemModal = ({
  type,
  confirmationData,
  getProductDetails,
  setConfirmationData,
  orderItem,
  editOrderItem,
  orderItemData,
}) => {
  useEffect(() => {
    getProductDetails();
  }, []);
  const isChanged = () => {
    if (
      (type === "Color" &&
        confirmationData?.currentColor?.toLowerCase() !==
          confirmationData?.newColor?.toLowerCase()) ||
      (type === "Size" &&
        confirmationData?.currentSize?.toLowerCase() !==
          confirmationData?.newSize?.toLowerCase())
    )
      return true;
    else return false;
  };
  const ConfirmChange = () => {
    let selectedOrder = orderItemData?.find((s) => s.id === orderItem?.id);
    if (type === "Color") {
      selectedOrder = {
        ...selectedOrder,
        image: confirmationData?.productDetails?.sync_color_images.find(
          (s) =>
            s.color_name?.toLowerCase() ===
            confirmationData?.newColor?.toLowerCase()
        )?.images?.[0],
        variation: {
          ...selectedOrder?.variation,
          color: confirmationData.newColor,
        },
      };
      editOrderItem([
        ...orderItemData?.filter((s) => s.id !== selectedOrder?.id),
        selectedOrder,
      ]);
      setConfirmationData({
        ...confirmationData,
        currentColor: confirmationData.newColor,
        enable: false,
        type: null,
      });
    }
    if (type === "Size") {
      selectedOrder = {
        ...selectedOrder,
        variation: {
          ...selectedOrder?.variation,
          Size: confirmationData.newSize,
        },
      };
      editOrderItem([
        ...orderItemData?.filter((s) => s.id !== selectedOrder?.id),
        selectedOrder,
      ]);
      setConfirmationData({
        ...confirmationData,
        currentSize: confirmationData.newSize,
        enable: false,
        type: null,
      });
    }
  };
  return (
    <div
      className={`z-[9999999999999] px-[24px] w-full flex-col ${
        confirmationData.loading ? "justify-start pt-[30px]" : "justify-end"
      } items-center h-[calc(100vh-150px)] overflow-auto max-h-[calc(100vh-150px)] fixed top-0 left-0 bg-[#0000006c]  backdrop-blur-[10px]`}
    >
      {confirmationData?.loading ? (
        <span className="scale-[4]">
          <Spinner />
        </span>
      ) : (
        <div className="flex-col justify-end items-center h-auto">
          <LargeColorIcon />
          <span className="mt-[11px] text-[#D3D3D3] text-[16px] medium">
            {translateFunction(`Cahnge Below ${type}`)}
          </span>
          <div
            style={{
              border: "#D3D3D380 1px solid",
            }}
            className={`flex-col pl-[10px] relative h-auto max-w-[600px]  min-h-[138px] items-center justify-center  mt-[12px] rounded-[15px]  w-full `}
          >
            <div className="w-auto h-[98px] flex-col items-center justify-center">
              <img
                className="w-[70px] h-[70px] object-cover rounded-full"
                src={
                  confirmationData?.productDetails?.sync_color_images?.find(
                    (s) =>
                      s.color_name?.toLowerCase() ===
                      confirmationData?.currentColor?.toLowerCase()
                  )?.images[0]
                }
              />
              <span className="text-[#fff] text-[14px] medium mt-[9px]">
                {type === "Color"
                  ? confirmationData?.productDetails?.sync_color_images?.find(
                      (s) =>
                        s.color_name?.toLowerCase() ===
                        confirmationData?.currentColor?.toLowerCase()
                    )?.color_name
                  : confirmationData?.currentSize}
              </span>
            </div>
          </div>
          <span className="text-[#fff] text-[16px] medium mt-[15px]">
            {translateFunction(`To New ${type}`)}
          </span>
          <div
            style={{
              border: "#FFFFFF80 1px solid",
            }}
            className={`flex-col overflow-hidden pl-[10px] relative h-auto max-w-[600px]  min-h-[138px] items-center justify-center  mt-[12px] rounded-[15px]  w-full `}
          >
            {type === "Color" ? (
              <ColorList
                currentColor={confirmationData?.currentColor}
                newColor={confirmationData?.newColor}
                colors={confirmationData?.productDetails?.sync_color_images}
                setColor={(e) => {
                  setConfirmationData({ ...confirmationData, newColor: e });
                }}
              />
            ) : (
              <SizeList
                currentSize={confirmationData?.currentSize}
                newSize={confirmationData?.newSize}
                setSize={(e) => {
                  setConfirmationData({ ...confirmationData, newSize: e });
                }}
                image={orderItem?.image}
                sizes={
                  confirmationData?.productDetails?.choice_options?.[0]?.options
                }
              />
            )}
          </div>
          <p className="text-[14px] text-white regular mt-[40px]">
            {translateFunction("I Read And Agree To")}
            <a
              target="_blank"
              href="#"
              className="ml-[4px] medium text-[14px] text-white underline"
            >
              {translateFunction(`The Change ${type} Terms.`)}
            </a>
          </p>
          <p className="text-[14px] text-white medium mt-[40px] text-center ">
            {translateFunction(
              `We Will Ignore The First ${type} And Send Your Order To The New Address.`
            )}
          </p>
          <div
            className={`cursor-pointer mt-[10px] w-full h-[50px] rounded-[15px]  text-[16px] bold flex items-center justify-center ${
              isChanged()
                ? "bg-[#F8F8F8] text-[#402CDD]"
                : "bg-[#C4C2C2] text-[#fff]"
            }`}
            style={{
              border: isChanged() && "1px solid #402CDD80",
            }}
            onClick={() => {
              if (isChanged()) {
                ConfirmChange();
              }
            }}
          >
            {translateFunction("Yes, I Agree")}
          </div>
          <div
            className="cursor-pointer w-full h-[50px] text-[#fff] text-[16px] regular flex items-center justify-center"
            onClick={() => {
              setConfirmationData({
                ...confirmationData,
                enable: false,
                type: null,
              });
            }}
          >
            {translateFunction("Cancel")}
          </div>
        </div>
      )}
    </div>
  );
};
const ColorList = ({ colors, setColor, currentColor, newColor }) => {
  const isActive = (name) => {
    if (!newColor) return name?.toLowerCase() === currentColor?.toLowerCase();
    else if (newColor?.toLowerCase() === name?.toLowerCase()) return true;
    else return false;
  };
  return (
    <HortiznalScrollBar
      className="w-full h-[98px] flex-row gap-[10px]"
      id="color-list-container"
    >
      {colors?.map((s) => (
        <div
          className="w-auto h-[98px] flex-col items-center justify-center"
          onClick={() => {
            setColor(s?.color_name);
          }}
        >
          <img
            style={{
              border: isActive(s?.color_name)
                ? "1px solid #402CDD80"
                : "1px solid #ffffff80",
            }}
            className="w-[70px] h-[70px] object-cover rounded-full"
            src={s?.images[0]}
          />
          <span
            className={`${
              isActive(s.color_name) ? "text-[#fff]" : "text-[#D3D3D3]"
            } text-[14px] medium mt-[9px]`}
          >
            {s?.color_name}
          </span>
        </div>
      ))}
    </HortiznalScrollBar>
  );
};
const SizeList = ({ sizes, setSize, currentSize, newSize, image }) => {
  const SizesRef = useRef<SwiperRef>();
  const isActive = (name) => {
    if (!newSize) return name?.toLowerCase() === currentSize?.toLowerCase();
    else {
      return name?.toLowerCase() === newSize?.toLowerCase();
    }
  };

  return (
    <div
      data-cy="countainer_ofSize_scroller"
      className="flex-row h-[96px] max-h-[96px] w-full max-w-[420px] min-w-[420px] relative"
    >
      <Swiper
        data-cy="slide_components"
        modules={[EffectCoverflow]}
        className=" size-slider-coverflow"
        speed={100}
        ref={SizesRef}
        effect="coverflow"
        coverflowEffect={{
          rotate: 0,
          depth: 100,
          modifier: 0,
          scale: 1,
          stretch: 100,
          slideShadows: false,
        }}
        onSlideChange={(e) => {
          setSize(sizes[e.activeIndex]?.name);
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.SIZE_SLIDE,
          // });
        }}
        slidesPerView={7}
        threshold={1}
        centeredSlides={true}
        loop={false}
        initialSlide={sizes?.length / 2}
      >
        {sizes?.map((size, i) => (
          <SwiperSlide
            data-cy="size_slide"
            key={i}
            onClick={() => {
              // @ts-ignore
              SizesRef.current.swiper.slideTo(i, 400, false);
              setSize(size?.name);
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.SIZE_SLIDE,
              // });
            }}
            style={{
              overflow: "visible",
              minWidth: "70px",
              height: "70px",
            }}
            className={`${
              isActive(size?.name) &&
              "red-bg shadow-[inset_0px_4px_6px_rgba(255,255,255,0.5)] text-[#f8f8f8]"
            } flex-row items-center justify-center text-[30px] bold select-none flex text-[#fff]`}
          >
            {size.name}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
