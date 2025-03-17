import SelectSize from "components/products/SelectSize";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getConfiguredImage, RoundPrice, Sendevent } from "utils/functions";

import AddToCartButton from "components/products/AddToCartButton";

import BackIcon from "public/svg/listing/backIcon.svg";

import { SelectColorsSlider } from "components/products/SelectColor";
import Skeleton from "react-loading-skeleton";
import CartIcon from "public/svg/CartIcon.svg";
import { LogData } from "store/homepage/actions";
import auth from "services/auth";
import home from "services/home";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ToastContainer } from "react-toastify";
import { AxiosGet } from "utils/AxiosApi";
import { QuantityDetailsProductApi } from "models/Api";
import ProductInfo from "components/products/ProductInfo";

function AddToCartWidget() {
  const dispatch = useDispatch();

  const loaded = useSelector((state: StateInterface) => state.cart.loaded);
  let QTY_URL = "/web/product/qtyPriceDetails";
  const SelectedProduct = useSelector(
    (state: StateInterface) => state.cart.SelectedProduct
  );

  const product = useSelector((state: StateInterface) => state.details.product);
  const getDetails = async () => {
    if (!localStorage.getItem("DEVICE-TOKEN")) await home.RegisterDevice();
    let data: QuantityDetailsProductApi["data"] = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        QTY_URL +
        `/${SelectedProduct.slug}`,
      title: "Get Product",
    });
    let additionalData = await auth.getProductNotify({
      id: SelectedProduct.slug,
    });
    dispatch({ type: "GET-PRODUCT-DETAILS-FOR-CART", payload: data });
    dispatch({
      type: "STORE-PRODUCT-Boutique",
      payload: { ...product, ...data },
    });
    if (data.choice_options) {
      let a = data?.choice_options?.filter((s) => s.title == "Size")[0]
        ?.options[0];
      dispatch({ type: "AddToCartSize", payload: a });
    }
    let arr = [];
    if (additionalData?.variation?.length) {
      additionalData.variation.map((s) => {
        let d = (product.variation || data.variation).filter(
          (w) => w.type === s.type
        )[0];
        arr.push({ ...s, ...d });
      });
    }
    dispatch({
      type: "GET-PRODUCT-VARIATION",
      payload: {
        ...product,
        // @ts-ignore
        is_product_notify_for_user: additionalData?.is_product_notify_for_user,
        variation: arr,
        likes: null,
        is_liked: null,
      },
    });
  };
  useEffect(() => {
    getDetails();
  }, []);
  const decimal_point_settings = useSelector(
    (state: StateInterface) => state.homepage.settings
  );
  const AddToCartOption = useSelector(
    (state: StateInterface) => state.cart.AddToCartOption
  );
  const currency = useSelector(
    (state: StateInterface) => state.homepage.currency
  );
  const getPrice = (num) => {
    if (currency?.exchange_rate === null || !currency?.exchange_rate)
      return null;
    if (
      decimal_point_settings &&
      Object.keys(decimal_point_settings).includes("starting-setting")
    )
      return RoundPrice({
        num: num,
        rate: currency?.exchange_rate,
        points:
          decimal_point_settings["starting-setting"]?.decimal_point_settings ||
          0,
      });
  };
  return (
    <div className="flex-col h-full w-[100vw] flex top-0 left-0 fixed z-[99999999999999999] justify-start ">
      {AddToCartOption.enable && (
        <ToastContainer
          position="top-right"
          style={{ zIndex: "9999999999999999" }}
        />
      )}
      <SelectColor
        close={() => {
          dispatch({ type: "AddToCartOptionDisable" });
          Sendevent({
            event: "button_clicked",
            value: "trydos_appbar_backicon_button",
          });
        }}
      />
      <div className="product-details-footer z-[9999] min-h-[100px] h-auto">
        <ProductInfo
          shipping={SelectedProduct?.shipping_cost || 0}
          currency={currency?.symbol}
          newPrice={
            AddToCartOption.price?.offer_price
              ? getPrice(AddToCartOption?.price?.offer_price)
              : getPrice(product?.offer_price)
          }
          oldPrice={
            AddToCartOption.price?.price
              ? getPrice(AddToCartOption?.price?.price)
              : getPrice(product.price)
          }
        />
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
            <div className="flex-row justify-center w-full">
              <Skeleton
                containerClassName="h-20 items-center flex-row"
                className="w-20 h-20 rounded-full ml-2 items-center flex-row"
              />
              <Skeleton
                containerClassName="h-20 items-center flex-row"
                className="w-20 h-20 rounded-full ml-2 flex-row"
              />
              <Skeleton
                containerClassName="h-20 items-center flex-row"
                className="w-20 h-20 rounded-full ml-2 flex-row"
              />
              <Skeleton
                containerClassName="h-20 items-center flex-row"
                className="w-20 h-20 rounded-full ml-2 flex-row"
              />
              <Skeleton
                containerClassName="h-20 items-center flex-row"
                className="w-20 h-20 rounded-full ml-2 flex-row"
              />
              <Skeleton
                containerClassName="h-20 items-center flex-row"
                className="w-20 h-20 rounded-full ml-2 flex-row"
              />
            </div>
          </div>
        )}
        <div className="product-options-container">
          {
            <>
              <AddToCartButton
                showLoading={
                  !(
                    loaded &&
                    (SelectedProduct.choice_options || product.choice_options)
                  )
                }
                loading={
                  loaded &&
                  (SelectedProduct.choice_options || product.choice_options)
                }
                setOption={() => {}}
                productVar={product}
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
    (state: StateInterface) => state.cart.AddToCartOption
  );
  const SelectedProduct = useSelector(
    (state: StateInterface) => state.cart.SelectedProduct
  );
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const enableCart = (s) => {
    window.history.pushState({ isPopup: true }, "open Cart");
    if (s) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("cart", "true");

      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("cart");

      // Use router.push with pathname and updated query
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
    }
    dispatch({ type: "ENABLE-CART", payload: s });
  };
  const cart = useSelector((state: StateInterface) => state.cart?.localCart);

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
        <span
          className="relative"
          onClick={() => {
            Sendevent({
              event: "button_clicked",
              value: "cart_nav_bar_button",
            });
            close();
            dispatch({ type: "AddToCartOptionDisable", payload: false });
            enableCart(true);
          }}
        >
          {cart?.length > 0 && (
            <span className="bg-green-500 right-[-8px] top-[-4px] text-white rounded-full min-h-3 min-w-[18px] absolute justify-center flex items-center ">
              {cart.length}
            </span>
          )}
          <CartIcon id={"cart-icon"} className="cart-icon" data-cy="CartIcon" />
        </span>
      </div>
      <div className="flex-col mt-[10px] w-full   top-[103px] items-center z-[999999999]">
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
            id={"added-to-cart"}
            src={getConfiguredImage({
              src:
                (AddToCartOption?.selectedColor?.images &&
                  AddToCartOption?.selectedColor?.images[0]) ||
                SelectedProduct.images[0],
              width: 400,
              height: 400,
            })}
            className={`min-h-[80px] h-full object-top rounded-[15px]`}
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
