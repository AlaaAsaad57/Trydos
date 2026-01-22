import React, { useEffect, useState } from "react";
import home from "services/home";
import { useAppStore } from "store";
import {
  areProductsEqual,
  getConfiguredImage,
  getOldCart,
  LogError,
  translateFunction,
} from "utils/functions";
import { CartItemLink, QuantutyInput } from ".";
import { GetImageUrl } from "utils/tinyUtils";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";

function OldCartContainer() {
  const { cart, language, storeOldCart, oldCart, hideOldCart } = useAppStore();
  const filteredOldCart =
    oldCart?.oldCart?.filter(
      (oldProduct) =>
        !cart.some((cartProduct) => areProductsEqual(oldProduct, cartProduct)),
    ) || [];
  let shippingDurationDays = 0;
  if (sessionStorage.getItem("starttingSetting")) {
    const settingsStr = sessionStorage.getItem("starttingSetting");
    if (settingsStr) {
      try {
        const settingsObj = JSON.parse(settingsStr);
        shippingDurationDays =
          parseInt(settingsObj?.["starting-setting"]?.shipping_duration_days) ||
          0;
      } catch (e) {
        shippingDurationDays = 0;
      }
    }
  }
  const [loading, setLoading] = useState(false);
  const getInitialData = async () => {
    try {
      setLoading(true);
      await getOldCart();
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "getInitialData for old cart widget",
      });
      setLoading(false);
    }
  };
  useEffect(() => {
    getInitialData();
  }, []);
  if (loading) {
    return (
      <div
        className="flex-col bg-[#F8F8F8]  w-full h-auto mt-10"
        data-cy="oldCart-outOfBag"
      >
        <hr className="p-4" data-cy="line" />
        <div
          className="flex-row mt-0 min-h-[30px] w-full items-center justify-start bg-[#F8F8F8] rounded-[10px]"
          data-cy="oldCart-viewer"
        >
          <span className="ml-[32px]" data-cy="spanContainer-oldCartIcon">
            <Image
              src={"/icons/OldCartIcon.svg"}
              alt="cart-color"
              width={20}
              height={20}
              data-cy="color-icon"
            />
          </span>{" "}
          <span
            className="regular text-[#505050] text-[15px] ml-1"
            data-cy="outOfBag-text"
          >
            {translateFunction("Out Of Bag!", language)}
          </span>
        </div>
        <div
          className="flex-col  w-full h-auto mt-3 pb-[200px]"
          data-cy="Product_Non_Available_In_Cart"
        >
          {[1, 1, 1, 1, 1].map((s, key) => (
            <div className="flex-col bg-white pb-10 pt-2 pl-2 pr-2" key={key}>
              <div className="flex-row min-h-[50px] bg-[#f8f8f8] rounded-2xl justify-between items-center pl-5 pr-5">
                <Skeleton width={90} height={15} />
              </div>
              <div className="flex-col w-full">
                {[1, 1].map((s, key) => (
                  <div
                    className="flex-row w-full relative  min-h-[191px] bg-[#FEFEFE] mt-3 rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                    key={key}
                  >
                    <div className="flex-row w-[116px] min-h-[191px] relative">
                      <Skeleton width={110} height={"100%"} borderRadius={15} />
                    </div>
                    <div className="flex-col mt-4 ml-5">
                      <div className="h-[10px] overflow-hidden">
                        <Skeleton
                          width={"90"}
                          height={10}
                          style={{
                            top: "0px",
                            maxHeight: "100%",
                            display: "flex",
                          }}
                        />
                      </div>
                    </div>
                    <div className="absolute right-4 bottom-3">
                      <div className="product-info-price">
                        <div className="product-old-price text-[18px] text-[#C4C2C2] regular">
                          <svg
                            className="bottom-3"
                            xmlns="http://www.w3.org/2000/svg"
                            width="100%"
                            height="2"
                          >
                            <line
                              id="Line_1104"
                              data-name="Line 1104"
                              x2="100%"
                              transform="translate(0 1)"
                              fill="none"
                              stroke="#C4C2C2"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                        <div className="product-new-price text-[18px] bold"></div>
                        <div className="product-currency text-[8px] text-[#C4C2C2] regular"></div>
                      </div>
                    </div>
                    <div className="absolute top-1 right-1"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const isRtl = language === "ar" || language === "ku";
  if (filteredOldCart?.length === 0) return <></>;
  return (
    <div
      className="flex-col bg-[#F8F8F8]  w-full h-auto mt-10"
      data-cy="oldCart-outOfBag"
    >
      <hr className="p-4" data-cy="line" />
      <div
        className="flex-row mt-0 min-h-[30px] w-full items-center justify-start bg-[#F8F8F8] rounded-[10px]"
        data-cy="oldCart-viewer"
      >
        <span className="ml-[32px]" data-cy="spanContainer-oldCartIcon">
          <Image
            src={"/icons/OldCartIcon.svg"}
            alt="cart-color"
            width={20}
            height={20}
            data-cy="color-icon"
          />
        </span>{" "}
        <span
          className="regular text-[#505050] text-[15px] ml-1"
          data-cy="outOfBag-text"
        >
          {translateFunction("Out Of Bag!", language)}
        </span>
        <span
          data-cy="hideAll"
          className="cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]"
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.REMOVE_OLD_PRODUCTS_BUTTON,
            // });
            home.hideOldCart({});
            storeOldCart([]);
          }}
        >
          {translateFunction("Hide All", language)}
        </span>
      </div>
      <div
        className="flex-col  w-full h-auto mt-3 pb-[200px]"
        data-cy="Product_Non_Available_In_Cart"
      >
        {filteredOldCart.map((product, key) => (
          <div
            className="relative px-[12px]"
            key={key}
            data-cy="oldProduct-card"
          >
            <CartItemLink
              normalHeight="208px"
              product={product}
              key={key}
              // onClick={(e) => {
              //   EnableScroll();
              //   close();
              // }}
            >
              <div className="flex-row w-[116px] h-auto rounded-[15px] max-h-[160px]  relative">
                <img
                  src={getConfiguredImage({
                    height: 150,
                    width: 150,
                    src: GetImageUrl(product.image),
                  })}
                  width={110}
                  height={"100%"}
                  className="rounded-[15px] opacity-50"
                />
              </div>
              <div
                className={`${
                  isRtl ? "items-end" : "items-start"
                } flex-col mt-4 mx-5`}
              >
                <div className="h-[10px] overflow-hidden">
                  <img
                    src={getConfiguredImage({
                      height: 150,
                      width: 150,
                      src: GetImageUrl(product?.brand?.icon?.file_path),
                    })}
                    height={10}
                    style={{
                      top: "0px",
                      maxHeight: "100%",
                      display: "flex",
                    }}
                    className="object-contain h-4 max-w-[90px] w-auto"
                  />
                </div>
                <div className="text-[12px] mt-1 text-[#505050] flex regular">
                  {product.name.substring(0, 30)}
                </div>
                <div className="flex-row items-center text-[12px] light text-[#505050] mt-1">
                  <span className="ml-1.5"></span>
                </div>
                <div className="flex-row flex-wrap">
                  {product.variations[0]?.color && (
                    <div className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mr-3">
                      <Image
                        src={"/icons/CartColorIcon.svg"}
                        alt="cart-color"
                        width={10}
                        height={10}
                        data-cy="color-icon"
                      />

                      <span
                        className={`ml-1.5 ${language === "ar" && "dir-rtl"}`}
                      >
                        {translateFunction("Color")}:
                        <span className="regular">
                          {product.variations[0].color}
                        </span>
                      </span>
                    </div>
                  )}
                  {product.variations[0]?.Size && (
                    <div className="flex-row items-center text-[12px] regular text-[#505050] mt-1">
                      <Image
                        src={"/icons/CartSizeIcon.svg"}
                        alt="cart-color"
                        width={10}
                        height={10}
                        data-cy="color-icon"
                      />

                      <span
                        className={`ml-1.5 ${language === "ar" && "dir-rtl"}`}
                      >
                        {translateFunction("Size")}:
                        <span className="regular">
                          {product.variations[0].Size}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mr-3">
                  <Image
                    src={"/icons/PiecesIcon.svg"}
                    alt="cart-color"
                    width={10}
                    height={10}
                    data-cy="color-icon"
                  />

                  <span
                    className={`ml-1.5 text-[#8D8D8D] regular ${
                      language === "ar" && "dir-rtl"
                    }`}
                  >
                    {translateFunction("Composed Of:")}{" "}
                    <span className="regular">
                      {product.count_of_pieces} {translateFunction("Piece")}
                    </span>
                  </span>
                </div>
                {product.shipping_days && (
                  <div className="flex-row whitespace-nowrap items-center text-[12px] regular text-[#505050] mt-1 mr-3">
                    <Image
                      src={"/icons/DeleiveryIcon.svg"}
                      alt="cart-color"
                      width={10}
                      height={10}
                      data-cy="color-icon"
                    />

                    <span
                      className={`ml-1.5 whitespace-nowrap text-[#8D8D8D] regular ${
                        language === "ar" && "dir-rtl"
                      }`}
                    >
                      {translateFunction("Shipping")}{" "}
                      <span className="regular whitespace-nowrap">
                        {product.shipping_days + shippingDurationDays}{" "}
                        {translateFunction("Days")}{" "}
                        <span className="ml-1 underline">
                          {translateFunction("Details")}
                        </span>
                      </span>
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute top-1 right-1">
                <input
                  defaultValue={key + 1}
                  type="number"
                  min={1}
                  disabled
                  max={product.available_quantity}
                  className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border-[1px] border-solid outline-none bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
                />
              </div>
              <div className="absolute flex-row cursor-pointer items-center pl-3 pr-3 max-w-[90vw] bottom-[8px] left-[9px] mx-auto right-[0px] w-full h-[32px] rounded-[15px] bg-[#F8F8F8]">
                <span
                  style={{
                    height: "15px",
                    scale: "0.8",
                    transform: "translateY(-3px)",
                  }}
                >
                  <Image
                    src={"/icons/OldCartIcon.svg"}
                    alt="cart-color"
                    width={20}
                    height={20}
                    data-cy="color-icon"
                  />
                </span>
                <span className="text-[#8D8D8D] bold text-[12px] ml-1">
                  {translateFunction("Out Of Bag!", language)}{" "}
                  <span className="regular">
                    {translateFunction("Time Running Out.")}{" "}
                    <span className="bold">-30:00</span> |{" "}
                    {translateFunction("Add Again?")}
                  </span>
                </span>
                <span className="ml-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                  >
                    <g
                      id="Group_11624"
                      data-name="Group 11624"
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
                          d="M.262,9.636a.258.258,0,0,1-.156-.054.29.29,0,0,1-.1-.3L.675,7.091A4.792,4.792,0,0,1,0,4.636,4.554,4.554,0,0,1,4.458,0,4.554,4.554,0,0,1,8.914,4.636,4.555,4.555,0,0,1,4.458,9.273a4.341,4.341,0,0,1-2.5-.794L.409,9.589A.238.238,0,0,1,.262,9.636ZM4.416,6.982a.571.571,0,1,0,.562.571A.558.558,0,0,0,4.416,6.982Zm.115-4.55a.879.879,0,0,1,.954.88c0,.432-.183.7-.7,1.023a1.433,1.433,0,0,0-.817,1.288v.1c0,.319.171.518.447.518.255,0,.4-.162.426-.469.021-.445.181-.669.714-1a1.684,1.684,0,0,0-.987-3.16A1.8,1.8,0,0,0,2.812,2.6a1.186,1.186,0,0,0-.115.518.386.386,0,0,0,.413.434c.224,0,.349-.108.43-.372A.951.951,0,0,1,4.531,2.432Z"
                          transform="translate(0 2.364)"
                          fill="#8e8e8e"
                        />
                        <path
                          id="Path_21380"
                          data-name="Path 21380"
                          d="M10.677,9.661a.259.259,0,0,1-.157.055.237.237,0,0,1-.147-.047L8.824,8.559l-.017.011a5.314,5.314,0,0,0,.4-2.036A5.089,5.089,0,0,0,4.227,1.352a4.724,4.724,0,0,0-1.094.127A4.326,4.326,0,0,1,6.325.079a4.555,4.555,0,0,1,4.457,4.636,4.778,4.778,0,0,1-.675,2.455l.664,2.189a.287.287,0,0,1-.094.3Z"
                          transform="translate(0.23 0.466)"
                          fill="#8e8e8e"
                        />
                        <rect
                          id="Rectangle_4714"
                          data-name="Rectangle 4714"
                          width="11.536"
                          height="12"
                          transform="translate(0.464)"
                          fill="none"
                        />
                      </g>
                    </g>
                  </svg>
                </span>
              </div>
            </CartItemLink>
            <div
              className={`${
                isRtl ? "left-4" : "right-4"
              } absolute  top-[35px] hide-btn cursor-pointer z-40`}
              onClick={(e) => {
                e.preventDefault();
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value:
                //     GA_CLICK_EVENT_VALUES.REMOVE_OLD_PRODUCT_ITEM_BUTTON,
                // });
                hideOldCart(product.id);
                home.hideOldCart({ id: product.id });
              }}
            >
              <span className="hide-btn cursor-pointer border border-solid border-[#69a8ff80] mx-2  rounded-md flex-row items-center justify-center px-3 py-2 text-[#69a8ff]">
                {translateFunction("Hide", language)}
              </span>
            </div>
            <QuantutyInput
              id={product.id}
              product={product}
              updateData={async () => {}}
              isCollectedAfterOrdering={false}
              maxAllowed={product.max_allowed_qty}
              disabled={true}
              isHurry={false}
              value={product.quantity}
              max={product.available_quantity}
              setValue={() => {}}
              deleteFunction={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default OldCartContainer;
