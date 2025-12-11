import Timer from "components/Login/Timer";
import FlashDealBanner from "components/products/FlashDealBanner";
import React, { useCallback } from "react";
import { useAppStore } from "store";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import ErrorIcon from "public/svg/cart/Error";
import Image from "next/image";
function CartItem({ product, index }) {
  const { language } = useAppStore();
  const getShippingDay = useCallback(() => {
    let shippingDurationDays = 0;
    if (sessionStorage.getItem("starttingSetting")) {
      const settingsStr = sessionStorage.getItem("starttingSetting");
      if (settingsStr) {
        try {
          const settingsObj = JSON.parse(settingsStr);
          shippingDurationDays =
            parseInt(
              settingsObj?.["starting-setting"]?.shipping_duration_days
            ) || 0;
          return shippingDurationDays;
        } catch (e) {
          shippingDurationDays = 0;
          return shippingDurationDays;
        }
      }
    }
  }, []);
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  w-[110px] min-h-[161px] max-h-[161px] relative`}
        data-cy="container-image-onCard"
      >
        {product.flash_deal_details?.end_date && (
          <div className="relative top-[8px]">
            <FlashDealBanner
              language={language}
              end_data={product.flash_deal_details?.end_date}
            />
          </div>
        )}
        <img
          data-cy="image-onCard"
          src={getConfiguredImage({
            height: 150,
            width: 150,
            src: GetImageUrl(product.image),
          })}
          width={110}
          height={"100%"}
          className="rounded-2xl"
        />
      </div>
      <div
        className={`${isRtl ? "items-end" : "items-start"} flex-col mt-4 mx-5`}
        data-cy="container-ofProduct-information"
      >
        <div
          className="h-[10px] overflow-hidden"
          data-cy="container-ofProduct-information-img"
        >
          <img
            data-cy="img-ofProduct-information"
            src={getConfiguredImage({
              height: 150,
              width: 150,
              src: GetImageUrl(product.brand?.icon?.file_path),
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
        <div
          className={`${
            isRtl && "dir-rtl"
          } text-[12px] mt-1 text-[#505050] flex regular`}
          data-cy="productNameInCart"
        >
          {product.name.substring(0, 50)}
          {product.name.length > 50 ? "..." : ""}
        </div>

        <div
          className={`${isRtl ? "flex-row-reverse" : "flex-row"} flex-wrap`}
          data-cy="color-div"
        >
          {product.variations[0]?.color && (
            <div
              className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mx-2"
              data-cy="color-div2"
            >
              <Image
                src={"/svg/cart/CartColorIcon.svg"}
                alt="cart-color"
                width={10}
                height={10}
                data-cy="color-icon"
              />
              <span
                data-cy="color-text"
                className={`${language === "ar" && "dir-rtl"} ml-1.5`}
              >
                {translateFunction("Color")}:{" "}
                <span className="regular" data-cy="color-name">
                  {product.variations[0].color}
                </span>
              </span>
            </div>
          )}
          {product.variations[0]?.Size && (
            <div
              className="flex-row items-center text-[12px] light text-[#505050] mt-1"
              data-cy="size-container"
            >
              <Image
                src={"/svg/cart/CartSizeIcon.svg"}
                alt="cart-color"
                width={10}
                height={10}
                data-cy="color-icon"
              />

              <span
                className={`ml-1.5 ${language === "ar" && "dir-rtl"}`}
                data-cy="size-container-text"
              >
                {translateFunction("Size")}:
                <span className="regular" data-cy="size-container-size">
                  {product.variations[0].Size}
                </span>
              </span>
            </div>
          )}
        </div>
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          }  items-center text-[12px] regular text-[#505050] mt-1 mx-3`}
          data-cy="countPieces-container"
        >
          <Image
            src={"/svg/cart/PiecesIcon.svg"}
            alt="cart-color"
            width={10}
            height={10}
            data-cy="color-icon"
          />

          <span
            className={`ml-1.5 ${
              language === "ar" && "dir-rtl"
            } text-[#8D8D8D] regular `}
            data-cy="countPieces-text"
          >
            {translateFunction("Composed Of:")}{" "}
            <span className="regular" data-cy="countPieces-number">
              {product.count_of_pieces} {translateFunction("Piece")}
            </span>
          </span>
        </div>
        {product.shipping_days ? (
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            }  whitespace-nowrap items-center text-[12px] light text-[#505050] mt-1 mx-3`}
            data-cy="sshipping-container"
          >
            <Image
              src={"/svg/cart/DeleiveryIcon.svg"}
              alt="cart-color"
              width={10}
              height={10}
              data-cy="color-icon"
            />

            <span
              className={`ml-1.5 flex whitespace-nowrap ${
                language === "ar" && "dir-rtl"
              } text-[#8D8D8D] regular`}
              data-cy="shipping-text"
            >
              {translateFunction("Shipping")}:{" "}
              <span className="regular whitespace-nowrap" data-cy="days-number">
                {product.shipping_days + getShippingDay()}{" "}
                {translateFunction("Days")}{" "}
                <span className="ml-1 underline" data-cy="days-text">
                  {translateFunction("Details")}
                </span>
              </span>
            </span>
          </div>
        ) : (
          <></>
        )}

        {(!product.check_availability ||
          product.is_country_restricted === true ||
          product.is_active === false) && (
          <div className="flex-row items-center mt-1 text-[12px] light text-[#fd445d]">
            <ErrorIcon />
            <div className={`${language === "ar" && "dir-rtl"}`}>
              <span className="ml-1.5">
                {translateFunction("Availabilty")}:
              </span>
              <span className="regular ml-1">
                {translateFunction("Out Of Stock")}
              </span>
            </div>
          </div>
        )}
      </div>
      {product?.is_redeem && (
        <div
          className={`${
            isRtl ? "left-[-6px]" : "right-[-6px]"
          } flex absolute origin-center scale-75 top-[30px]  bg-gradient-to-r rounded-[6px] from-[#f64f64] to-[#d73a49] p-[6px] text[12px] text-white items-center justify-center gap-[4px]`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="white"
            className="animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 7h-2.18A3 3 0 0015 2a3.002 3.002 0 00-2.83 2H11.83A3.002 3.002 0 009 2a3 3 0 00-2.82 5H4a1 1 0 00-1 1v3a1 1 0 001 1h1v9a1 1 0 001 1h12a1 1 0 001-1v-9h1a1 1 0 001-1V8a1 1 0 00-1-1zM15 4a1 1 0 110 2h-2a1 1 0 110-2h2zM9 4a1 1 0 110 2H7a1 1 0 110-2h2zM5 9v-1h14v1H5zm2 2h10v8H7v-8z" />
          </svg>
          <span>{translateFunction("Redeem")}</span>
        </div>
      )}
      <div
        className={`${isRtl ? "left-1" : "right-1"} absolute top-1 `}
        data-cy="card-numbering-container"
      >
        <input
          data-cy="card-numbering-value"
          defaultValue={index + 1}
          type="number"
          min={1}
          disabled
          max={product.available_quantity}
          className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border-[1px] border-solid outline-none bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
        />
      </div>
      {(product.have_hurry_up_notify_time_left ||
        product?.have_hurry_up_notify_qty) && (
        <div
          className={`${
            isRtl ? "right-2 flex-row-reverse" : "left-2 flex-row"
          } absolute   text-[#A28E5B] text-[12px] bottom-[8px] px-3 w-[95%] h-[32px] bg-[#FDFDEF] rounded-[5px] flex items-center`}
        >
          <span className="ml-1">
            <Image
              src={"/svg/cart/HurryIcon.svg"}
              alt="cart-color"
              width={10}
              height={10}
              data-cy="color-icon"
            />
          </span>
          <span className="bold ml-1">
            {translateFunction("Hurry Up!", language)}
          </span>
          {product?.have_hurry_up_notify_time_left && (
            <>
              <span className="regular ml-1">
                {product.have_hurry_up_notify_time_left &&
                  translateFunction("Time Running Out. ", language)}
              </span>

              <span className="bold">
                -
                <Timer
                  minutes={product.time_left_in_minutes}
                  onFinish={() => {}}
                />
              </span>
            </>
          )}
          {product?.have_hurry_up_notify_qty && (
            <>
              <span className="regular ml-1">
                {product.have_hurry_up_notify_qty &&
                  translateFunction("Quantity Running Out. ", language)}
              </span>

              <span className="bold">-{product?.qty_left}</span>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default CartItem;
