import SelectSize from "components/products/SelectSize";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { OTP_URL } from "utils/endpointConfig";
import {
  AddToCartAnimation,
  getConfiguredImage,
  getLang,
} from "utils/functions";
import Cookies from "js-cookie";
import AddToCartButton from "components/products/AddToCartButton";

import BackIcon from "public/svg/listing/backIcon.svg";

import { SelectColorsSlider } from "components/products/SelectColor";
import Skeleton from "react-loading-skeleton";
import CartIcon from "public/svg/CartIcon.svg";

function AddToCartWidget() {
  const dispatch = useDispatch();
  const loaded = useSelector((state: any) => state.cart.loaded);
  let QTY_URL = "/web/product/qtyPriceDetails";
  const SelectedProduct = useSelector(
    (state: any) => state.cart.SelectedProduct
  );
  const product = useSelector((state: any) => state.details.product);
  const getDetails = async () => {
    let repo = await fetch(OTP_URL + QTY_URL + `/${SelectedProduct.id}`, {
      headers: {
        Authorization: `Bearer ${
          typeof localStorage !== "undefined" &&
          localStorage.getItem("MARKET-TOKEN")
        }`,
        lang: getLang(null, Cookies.get("language")),
        country: Cookies.get("country"),
      },
    });
    let data = await repo.json();

    dispatch({ type: "GET-PRODUCT-DETAILS-FOR-CART", payload: data.data });
  };
  useEffect(() => {
    getDetails();
  }, []);
  return (
    <div className="flex-col h-[100vh] w-[100vw] flex top-0 left-0 fixed z-[99999999999999999] justify-start ">
      <SelectColor
        close={() => {
          dispatch({ type: "AddToCartOptionDisable" });
        }}
      />
      <div className="product-details-footer z-[9999] min-h-[100px] h-auto">
        {SelectedProduct.choice_options && SelectedProduct?.variation ? (
          <div className="Extended-area-product">
            <svg
              className="border-svg"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="1.7"
            >
              <line
                id="Line_1104"
                data-name="Line 1104"
                x2="100%"
                y2="1"
                transform="translate(0.001 0.35)"
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="0.7"
              />
            </svg>
            {SelectedProduct.choice_options?.length > 0 && (
              <SelectSize
                sizes={
                  SelectedProduct?.choice_options?.filter(
                    (s) => s.title == "Size"
                  )[0]?.options || []
                }
                variants={SelectedProduct?.variation || []}
              />
            )}
          </div>
        ) : (
          <div className="Extended-area-product p-3">
            <div className="flex-row">
              <Skeleton className="w-20 h-20 rounded-full ml-2" />
              <Skeleton className="w-20 h-20 rounded-full ml-2" />
              <Skeleton className="w-20 h-20 rounded-full ml-2" />
              <Skeleton className="w-20 h-20 rounded-full ml-2" />
              <Skeleton className="w-20 h-20 rounded-full ml-2" />
              <Skeleton className="w-20 h-20 rounded-full ml-2" />
            </div>
          </div>
        )}
        <div className="product-options-container">
          {
            <>
              <AddToCartButton
                loading={
                  loaded &&
                  (SelectedProduct.choice_options || product.choice_options)
                }
                setOption={() => {}}
                AddToCartAnimation={(e) => {
                  AddToCartAnimation(e);
                }}
                product={SelectedProduct}
              />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default AddToCartWidget;
const SelectColor = ({ close }) => {
  const AddToCartOption = useSelector(
    (state: any) => state.cart.AddToCartOption
  );
  const SelectedProduct = useSelector(
    (state: any) => state.cart.SelectedProduct
  );

  const dispatch = useDispatch();
  const enableCart = (s) => {
    dispatch({ type: "ENABLE-CART", payload: s });
  };
  return (
    <>
      <div className="blur-md bg-[#f4f4f480] backdrop-blur-[10px] flex fixed top-0 left-0 h-full w-full z-[99]" />
      <div className="back-bar align-center w-100 flex-row min-h-12 bg-[#fff] p-4 z-[99999999] justify-between">
        <div
          className="back-icon p-0"
          onClick={() => {
            close();
          }}
        >
          <BackIcon />
        </div>
        <CartIcon
          className="cart-icon"
          onClick={() => {
            close();
            enableCart(true);
          }}
        />
      </div>
      <div className="flex-col mt-[10px] w-full   top-[103px] items-center z-[9999999999999]">
        <div className="flex-row w-auto justify-center h-available relative rounded-[15px] inset-select-shadow-image image-cart-container">
          <svg
            className="absolute  top-0 left-0"
            xmlns="http://www.w3.org/2000/svg"
            width="calc(100%)"
            height="calc(100%)"
          >
            <g
              id="Rectangle_5686"
              data-name="Rectangle 5686"
              fill="none"
              stroke="#FFF"
              strokeWidth="0.5"
            >
              <rect
                width="calc(100%)"
                height="calc(100%)"
                rx="15"
                stroke="none"
              />
              <rect
                x="0.25"
                y="0.25"
                width="calc(100%)"
                height="calc(100%)"
                rx="14.75"
                fill="none"
              />
            </g>
          </svg>
          <img
            src={getConfiguredImage({
              src:
                (AddToCartOption?.selectedColor?.images &&
                  AddToCartOption?.selectedColor?.images[0]) ||
                SelectedProduct.images[0]?.file_path,
              width: 400,
              height: 400,
            })}
            className={"h-full object-top rounded-[15px]"}
          />
        </div>
        {SelectedProduct.sync_color_images && (
          <div className="flex  w-full max-w-[420px] ">
            <SelectColorsSlider colors={SelectedProduct.sync_color_images} />
          </div>
        )}
      </div>
    </>
  );
};
