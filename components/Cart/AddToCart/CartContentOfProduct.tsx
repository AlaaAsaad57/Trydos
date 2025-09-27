import Image from "next/image";
import React from "react";
import { useAppStore } from "store";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

function CartContentOfProduct() {
  const { localCart, selected_product_for_add_to_cart, currency } =
    useAppStore();

  const renderVaritionString = (s) => {
    if (s.color && s.size) {
      return (
        <div className="flex flex-row items-center gap-[3px]">
          <span>{translateFunction("Color")}</span>
          <span className="bold">
            {
              selected_product_for_add_to_cart.colors?.find(
                (color) =>
                  color.code === s.color ||
                  color.name === s.color ||
                  color?.option === s.color
              )?.name
            }
          </span>
          <span>|</span>
          <span>{translateFunction("Size")}</span>
          <span className="bold">{s.size}</span>
        </div>
      );
    } else {
      if (s.color) {
        <div className="flex flex-row items-center gap-[3px]">
          <span>{translateFunction("Color")}</span>
          <span className="bold">
            {
              selected_product_for_add_to_cart.colors?.find(
                (color) =>
                  color.code === s.color ||
                  color.name === s.color ||
                  color?.option === s.color
              )?.name
            }
          </span>
        </div>;
      }
      if (s.size) {
        <div className="flex flex-row items-center gap-[3px]">
          <span>{translateFunction("Size")}</span>
          <span className="bold">{s.size}</span>
        </div>;
      }
    }
  };
  const getPriceOfProductInCart = () => {
    let total_products = localCart.filter(
      (s) =>
        s.id === selected_product_for_add_to_cart?.product_id ||
        selected_product_for_add_to_cart?.id
    );
    console.log(total_products);
    let total_price = 0;
    total_products.map((s) => {
      total_price += s.offer_price * s.quantity;
    });
    return RoundPrice({ num: total_price, rate: currency?.exchange_rate });
  };

  return (
    <div className="flex-row flex items-center min-h-[40px] max-h-[85px] w-full px-[20px]">
      <div className="flex flex-col rounded-[10px] justify-start items-center  relative pt-[30px] max-h-[69px]  min-h-[54px] w-full">
        <div className="flex-col flex items-start gap-[3px] z-10 max-h-full  overflow-auto w-fit horizntal-scroll">
          {localCart
            .filter(
              (s) =>
                s.id ===
                (selected_product_for_add_to_cart?.product_id ??
                  selected_product_for_add_to_cart?.id)
            )
            .map((s) => (
              <div className="flex-row flex items-center justify-center gap-[3px]">
                <ProductImageCircle image={s.image} />
                <div className="text-[10px] text-[#1D1D1D] items-center regular flex flex-row">
                  <span className="medium px-[2px]"> {s.quantity} </span>{" "}
                  <span>{translateFunction("Item")}</span>
                  {renderVaritionString(s)}
                </div>
              </div>
            ))}
        </div>

        <div className="absolute left-0 top-0 z-20 bg-[#513AAF] rounded-[10px] flex items-center justify-center text-[#FCFCFC] text-[10px] medium h-[25px] w-full">
          {translateFunction("Added")} {1} {translateFunction("Item")}{" "}
          {getPriceOfProductInCart()}
          {currency.symbol}
          {translateFunction("To Your Bag")}
        </div>
        <svg
          className="absolute left-0 top-0 "
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <rect
            x="0.25"
            y="0.25"
            width="calc(100% - 0.5px)"
            height="calc(100% - 0.5px)"
            rx="9.75"
            stroke="#513AAF"
            stroke-width="0.5"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

export default CartContentOfProduct;

const ProductImageCircle = ({ image }) => {
  return (
    <div className="w-[13px] h-[13px] rounded-full relative">
      <Image
        src={GetImageUrl(
          getConfiguredImage({ src: image, width: 20, height: 20, q: 100 })
        )}
        alt="product-image h-[13px]"
        width={13}
        height={13}
        className="rounded-full"
      />
      <svg
        className="absolute left-0 top-0 z-10"
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
      >
        <rect
          x="0.25"
          y="0.25"
          width="12.5"
          height="12.5"
          rx="100"
          stroke="#513AAF"
          stroke-width="0.5"
          fill="none"
        />
      </svg>
    </div>
  );
};
