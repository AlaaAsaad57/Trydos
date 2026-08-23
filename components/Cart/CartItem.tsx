import Timer from "components/Login/Timer";
import FlashDealBanner from "components/products/FlashDealBanner";
import React from "react";
import { useAppStore } from "store";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import Image from "next/image";
function CartItem({ product, index }) {
  const { language, settings } = useAppStore();
  // Read from the store rather than re-parsing the session cache on every
  // render. Both operands are coerced: the previous accessor returned
  // `undefined` when the cache was cold, making the sum NaN and hiding the row.
  const totalShippingDays =
    (Number(product.shipping_days) || 0) +
    (Number(settings?.["starting_setting"]?.shipping_duration_days) || 0);
  const isRtl = language === "ar" || language === "ku";
  const variation = Array.isArray(product?.variations)
    ? (product.variations[0] ?? {})
    : (product?.variations ?? {});
  const colorValue = variation?.color ?? variation?.color_options;
  const sizeValue = variation?.Size ?? variation?.size_options;
  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  w-[110px] h-[160px] relative`}
        data-pw="container-image-onCard"
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
          data-pw="image-onCard"
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
        data-pw="container-ofProduct-information"
      >
        <div
          className="h-[10px] overflow-hidden"
          data-pw="container-ofProduct-information-img"
        >
          <img
            data-pw="img-ofProduct-information"
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
          data-pw="productNameInCart"
        >
          {product.name.substring(0, 50)}
          {product.name.length > 50 ? "..." : ""}
        </div>

        <div
          className={`${isRtl ? "flex-row-reverse" : "flex-row"} flex-wrap`}
          data-pw="color-div"
        >
          {colorValue && (
            <div
              className="flex-row items-center text-[12px] regular text-[#505050] mt-1 mx-2"
              data-pw="color-div2"
            >
              <Image
                src={"/icons/CartColorIcon.svg"}
                alt="cart-color"
                width={10}
                className="max-h-[10px] object-contain"
                height={10}
                data-pw="color-icon"
              />
              <span
                data-pw="color-text"
                className={`${language === "ar" && "dir-rtl"} ml-1.5`}
              >
                {translateFunction("Color")}:{" "}
                <span className="regular" data-pw="color-name">
                  {colorValue}
                </span>
              </span>
            </div>
          )}
          {sizeValue && (
            <div
              className="flex-row items-center text-[12px] light text-[#505050] mt-1"
              data-pw="size-container"
            >
              <Image
                src={"/icons/CartSizeIcon.svg"}
                alt="cart-color"
                className="max-h-[10px] object-contain"
                width={10}
                height={10}
                data-pw="color-icon"
              />

              <span
                className={`ml-1.5 ${language === "ar" && "dir-rtl"}`}
                data-pw="size-container-text"
              >
                {translateFunction("Size")}:
                <span className="regular" data-pw="size-container-size">
                  {sizeValue}
                </span>
              </span>
            </div>
          )}
        </div>
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          }  items-center text-[12px] regular text-[#505050] mt-1 mx-3`}
          data-pw="countPieces-container"
        >
          <Image
            src={"/icons/PiecesIcon.svg"}
            alt="cart-color"
            className="max-h-[10px] object-contain"
            width={10}
            height={10}
            data-pw="color-icon"
          />

          <span
            className={`ml-1.5 ${
              language === "ar" && "dir-rtl"
            } text-[#8D8D8D] regular `}
            data-pw="countPieces-text"
          >
            {translateFunction("Composed Of:")}{" "}
            <span className="regular" data-pw="countPieces-number">
              {product.count_of_pieces} {translateFunction("Piece")}
            </span>
          </span>
        </div>
        {totalShippingDays > 0 ? (
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            }  whitespace-nowrap items-center text-[12px] light text-[#505050] mt-1 mx-3`}
            data-pw="sshipping-container"
          >
            <Image
              src={"/icons/DeleiveryIcon.svg"}
              alt="cart-color"
              className="max-h-[10px] object-contain"
              width={10}
              height={10}
              data-pw="color-icon"
            />
            <span
              className={`ml-1.5 flex whitespace-nowrap ${
                language === "ar" && "dir-rtl"
              } text-[#8D8D8D] regular`}
              data-pw="shipping-text"
            >
              {translateFunction("Shipping")}:{" "}
              <span className="regular whitespace-nowrap" data-pw="days-number">
                {totalShippingDays} {translateFunction("Days")}{" "}
                <span className="ml-1 underline" data-pw="days-text">
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
            <img src="/icons/Error.svg" />
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

      <div
        className={`${isRtl ? "left-1" : "right-1"} absolute top-1 `}
        data-pw="card-numbering-container"
      >
        <input
          data-pw="card-numbering-value"
          defaultValue={index + 1}
          type="number"
          min={1}
          disabled
          max={product.available_quantity}
          className="w-8 h-8 text-center items-center flex justify-center rounded-full border-[#70707079] border border-solid outline-hidden bg-[#F8F8F8] text-[#8D8D8D] text-[14px] medium"
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
              src={"/icons/HurryIcon.svg"}
              alt="cart-color"
              width={10}
              className="max-h-[10px] object-contain"
              height={10}
              data-pw="color-icon"
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
