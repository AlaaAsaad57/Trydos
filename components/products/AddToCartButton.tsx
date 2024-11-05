"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import home from "services/home";
import { getConfiguredImage, getUser, UserToken } from "utils/functions";
import NotifySVG from "public/svg/cart/NotifyCart.svg";
import auth from "services/auth";
function AddToCartButton({
  setOption,
  product,
  loading,
  AddToCartAnimation,
  productVar,
}: {
  setOption: any;
  product: any;
  productVar: any;
  loading?: any;
  AddToCartAnimation: Function;
}) {
  const AddToCartOption = useSelector(
    (state: any) => state.cart.AddToCartOption
  );
  const localCart = useSelector((state: any) => state.cart.localCart);
  const dispatch = useDispatch();
  const AddToCartAction = ({ quantity }) => {
    if (AddToCartOption?.enable)
      dispatch({
        type: "ADD-TO-CART-Quantity",
        payload: {
          ...product,
          selectedColor: AddToCartOption?.selectedColor,
          selectedSize: AddToCartOption?.selectedSize,
          quantity: quantity,
          UID: `${product.id}${AddToCartOption?.selectedColor?.color_name}${AddToCartOption?.selectedSize?.name}`,
        },
      });
  };
  const isAlreayAdded = ({ sku }) => {
    if (localCart.some((s) => s.sku === sku)) {
      return localCart.filter((s) => s.sku === sku)[0]?.item_id;
    } else {
      return false;
    }
  };
  const getQuantity = ({ sku }) => {
    let qty = 0;
    if (
      !AddToCartOption.selectedOptions[0].selectedColor &&
      !AddToCartOption.selectedOptions[0].selectedSize
    ) {
      qty = AddToCartOption.selectedOptions[0].quantity - 1;
    } else if (
      AddToCartOption.selectedOptions[0].selectedColor &&
      AddToCartOption.selectedOptions[0].selectedSize
    ) {
      let selectedVariant = AddToCartOption.selectedOptions.filter(
        (s) =>
          s.selectedColor.color_name ===
            AddToCartOption.selectedColor.color_name &&
          s.selectedSize?.name === AddToCartOption.selectedSize?.name
      )[0];
      qty = selectedVariant?.quantity - 1;
    } else if (
      AddToCartOption.selectedOptions[0].selectedColor &&
      !AddToCartOption.selectedOptions[0].selectedSize
    ) {
      let selectedVariant = AddToCartOption.selectedOptions.filter(
        (s) =>
          s.selectedColor.color_name ===
          AddToCartOption.selectedColor.color_name
      )[0];
      qty = selectedVariant.quantity - 1;
    } else if (
      !AddToCartOption.selectedOptions[0].selectedColor &&
      AddToCartOption.selectedOptions[0].selectedSize
    ) {
      let selectedVariant = AddToCartOption.selectedOptions.filter(
        (s) => s.selectedSize?.name === AddToCartOption.selectedSize?.name
      )[0];
      qty = selectedVariant.quantity - 1;
    }
    if (localCart.some((s) => s.sku === sku)) {
      return localCart.filter((s) => s.sku === sku)[0]?.quantity + qty;
    } else {
      return 1 + qty;
    }
  };
  const getTotalQuantity = () => {
    let num = 0;
    AddToCartOption.selectedOptions?.map((s) => {
      num = num + s.quantity;
    });
    return num;
  };
  const isQuantityEmpty = () => {
    if (getSelectedVariantofProduct() === "") return product.left_stock === 0;
    else
      return (
        product.variation?.filter(
          (s) => s.type === getSelectedVariantofProduct()
        )[0]?.qty === 0
      );
  };
  const setNotify = () => {
    if (UserToken())
      dispatch({
        type: "NOTIFY-PRODUCT",
        payload: getSelectedVariantofProduct(),
      });
  };
  const NotifyAction = () => {
    if (!isNotified()) {
      setNotify();

      auth.NotifyForProducts({
        id: product.id,
        variant: getSelectedVariantofProduct(),
      });
    }
  };
  const isNotified = () => {
    if (!product.variation || product.variation?.length === 0)
      return product.is_product_notify_for_user;
    else
      return product.variation.filter(
        (s) => s.type === getSelectedVariantofProduct()
      )[0]?.variant_notify_for_user;
  };
  const getSelectedVariantofProduct = () => {
    if (
      product.colors &&
      product.colors?.length > 0 &&
      !product.sync_color_images
    ) {
      return `${product.colors[0]?.name}-${AddToCartOption?.selectedSize?.name}`;
    }
    if (
      !productVar.sync_color_images &&
      productVar.choice_options?.length === 0
    ) {
      return "";
    } else if (
      productVar.sync_color_images &&
      productVar.choice_options?.length > 0
    ) {
      return `${AddToCartOption.selectedColor.color_name}-${AddToCartOption.selectedSize.name}`;
    } else if (
      productVar.sync_color_images &&
      productVar.choice_options?.length === 0
    ) {
      return `${AddToCartOption.selectedColor.color_name}`;
    } else if (
      !productVar.sync_color_images &&
      productVar.choice_options?.length > 0
    ) {
      return `${AddToCartOption.selectedSize?.name}`;
    }
  };
  return (
    <>
      {AddToCartOption.enable && isQuantityEmpty() ? (
        <>
          <div
            className={`add-cart-button extended-add-to-cart ${
              !isNotified() ? "bg-[#E6F1FF]" : "bg-[#FFFCE6]"
            } 
       
      `}
            onClick={(e) => {
              // @ts-ignore
              NotifyAction();
            }}
          >
            <NotifySVG className={`plus-icon-button absolute top-0 right-0`} />

            <div className="button-desc">
              <div className="flex-row max-w-[30px] justify-end relative image-container-cart">
                {isNotified() ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                  >
                    <defs>
                      <clipPath id="clip-path">
                        <rect
                          id="Rectangle_4830"
                          data-name="Rectangle 4830"
                          width="30"
                          height="30"
                          transform="translate(200 852)"
                          fill="none"
                        />
                      </clipPath>
                    </defs>
                    <g
                      id="Mask_Group_372"
                      data-name="Mask Group 372"
                      transform="translate(-200 -852)"
                      clip-path="url(#clip-path)"
                    >
                      <g id="ringing-2" transform="translate(200 852)">
                        <g id="Group_11216" data-name="Group 11216">
                          <path
                            id="Path_21482"
                            data-name="Path 21482"
                            d="M27.5,13.6a1.25,1.25,0,0,1-1.25-1.25,13.042,13.042,0,0,0-3.844-9.281A1.25,1.25,0,0,1,24.174,1.3,15.523,15.523,0,0,1,28.75,12.352,1.25,1.25,0,0,1,27.5,13.6Z"
                            fill="#505050"
                          />
                        </g>
                        <g id="Group_11217" data-name="Group 11217">
                          <path
                            id="Path_21483"
                            data-name="Path 21483"
                            d="M2.5,13.6a1.25,1.25,0,0,1-1.25-1.25A15.523,15.523,0,0,1,5.826,1.3,1.25,1.25,0,0,1,7.594,3.071,13.04,13.04,0,0,0,3.75,12.352,1.25,1.25,0,0,1,2.5,13.6Z"
                            fill="#505050"
                          />
                        </g>
                        <g id="Group_11218" data-name="Group 11218">
                          <path
                            id="Path_21484"
                            data-name="Path 21484"
                            d="M26.724,21.141a8.372,8.372,0,0,1-2.974-6.406V11.25a8.757,8.757,0,0,0-7.5-8.65V1.25a1.25,1.25,0,1,0-2.5,0V2.6a8.756,8.756,0,0,0-7.5,8.65v3.485a8.382,8.382,0,0,1-2.985,6.416A2.187,2.187,0,0,0,4.688,25H25.313a2.187,2.187,0,0,0,1.411-3.859Z"
                            fill="#505050"
                          />
                          <path
                            id="Path_21485"
                            data-name="Path 21485"
                            d="M15,30a4.7,4.7,0,0,0,4.592-3.75H10.408A4.7,4.7,0,0,0,15,30Z"
                            fill="#505050"
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                  >
                    <g
                      id="Mask_Group_371"
                      data-name="Mask Group 371"
                      transform="translate(-200 -852)"
                      clip-path="url(#clip-path)"
                    >
                      <g id="ringing" transform="translate(200 852)">
                        <g id="Group_11211" data-name="Group 11211">
                          <path
                            id="Path_21477"
                            data-name="Path 21477"
                            d="M28.125,13.125A.625.625,0,0,1,27.5,12.5a13.657,13.657,0,0,0-4.028-9.722.625.625,0,0,1,.884-.884A14.9,14.9,0,0,1,28.75,12.5.625.625,0,0,1,28.125,13.125Z"
                            fill="#8d8d8d"
                          />
                        </g>
                        <g id="Group_11212" data-name="Group 11212">
                          <path
                            id="Path_21478"
                            data-name="Path 21478"
                            d="M1.875,13.125A.625.625,0,0,1,1.25,12.5,14.9,14.9,0,0,1,5.644,1.894a.625.625,0,0,1,.884.884A13.657,13.657,0,0,0,2.5,12.5a.625.625,0,0,1-.625.625Z"
                            fill="#8d8d8d"
                          />
                        </g>
                        <g id="Group_11213" data-name="Group 11213">
                          <path
                            id="Path_21479"
                            data-name="Path 21479"
                            d="M16.875,5.225A.625.625,0,0,1,16.25,4.6V2.5a1.25,1.25,0,0,0-2.5,0V4.6a.625.625,0,0,1-1.25,0V2.5a2.5,2.5,0,0,1,5,0V4.6A.624.624,0,0,1,16.875,5.225Z"
                            fill="#8d8d8d"
                          />
                        </g>
                        <g id="Group_11214" data-name="Group 11214">
                          <path
                            id="Path_21480"
                            data-name="Path 21480"
                            d="M15,30a4.38,4.38,0,0,1-4.375-4.375.625.625,0,0,1,1.25,0,3.125,3.125,0,0,0,6.25,0,.625.625,0,0,1,1.25,0A4.38,4.38,0,0,1,15,30Z"
                            fill="#8d8d8d"
                          />
                        </g>
                        <g id="Group_11215" data-name="Group 11215">
                          <path
                            id="Path_21481"
                            data-name="Path 21481"
                            d="M25.625,26.25H4.375a1.875,1.875,0,0,1-1.219-3.3A8.69,8.69,0,0,0,6.25,16.3V12.5a8.75,8.75,0,0,1,17.5,0v3.8a8.681,8.681,0,0,0,3.084,6.644,1.875,1.875,0,0,1-1.209,3.309ZM15,5a7.508,7.508,0,0,0-7.5,7.5v3.8a9.931,9.931,0,0,1-3.526,7.6.625.625,0,0,0,.4,1.1h21.25a.625.625,0,0,0,.406-1.1A9.938,9.938,0,0,1,22.5,16.3V12.5A7.508,7.508,0,0,0,15,5Z"
                            fill="#8d8d8d"
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                )}
              </div>
              <span className="mt-1">
                {isNotified()
                  ? "We Will Inform You When this Is Available"
                  : "Notify Me When Size Is Available"}{" "}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className={`add-cart-button ${
              AddToCartOption?.enable && "extended-add-to-cart"
            } ${!loading && " opacity-70"} `}
            onClick={(e) => {
              // @ts-ignore
              if (e.target.closest(".plus-icon-button")) {
              } else {
                if (loading) {
                  if (!AddToCartOption?.enable) {
                    setOption("AddToCart");
                    document.documentElement.style.overflow = "hidden";
                    document.documentElement.scrollTop = 0;
                    dispatch({
                      type: "AddToCartOptionEnable",
                    });
                  } else {
                    if (
                      AddToCartOption.selectedOptions.filter(
                        (s) =>
                          s.UID ===
                          `${product.id}${AddToCartOption?.selectedColor?.color_name}${AddToCartOption?.selectedSize?.name}`
                      ).length === 0
                    ) {
                      AddToCartAction({ quantity: 1 });
                    } else {
                      AddToCartOption.selectedOptions?.map(
                        (selectedCartItem) => {
                          dispatch({ type: "LOADED-CART", payload: false });
                          home.AddToCart({
                            alreadyExist: isAlreayAdded({
                              sku: `${product.id}${
                                selectedCartItem?.selectedColor?.color_name
                                  ? `-${selectedCartItem?.selectedColor?.color_name}`
                                  : ""
                              }${
                                selectedCartItem?.selectedSize?.name
                                  ? `-${selectedCartItem?.selectedSize?.name}`
                                  : ""
                              }`,
                            }),
                            callback: ({ id }) => {
                              try {
                                let elem =
                                  document.querySelector(".add-cart-button");
                                setTimeout(() => {
                                  elem.classList.add("success-add");
                                }, 200);

                                AddToCartAnimation(selectedCartItem.UID);
                                setTimeout(() => {
                                  elem.classList.remove("success-add");
                                  dispatch({
                                    type: "ADD-PRODUCT-TO-CART",
                                    payload: {
                                      id: product.id,
                                      item_id: id,
                                      color: product.colors
                                        ? product.colors.filter(
                                            (s) =>
                                              s?.name ===
                                              selectedCartItem?.selectedColor
                                                ?.color_name
                                          )[0]?.color
                                        : null,
                                      image: product.sync_color_images
                                        ? product.sync_color_images.filter(
                                            (s) =>
                                              s.color_name ===
                                              selectedCartItem?.selectedColor
                                                ?.color_name
                                          )[0].images[0]?.file_path ??
                                          product.sync_color_images.filter(
                                            (s) =>
                                              s.color_name ===
                                              selectedCartItem?.selectedColor
                                                ?.color_name
                                          )[0].images[0]
                                        : product.images[0]?.file_path ??
                                          product.images[0],
                                      quantity: selectedCartItem.quantity || 1,
                                      size:
                                        selectedCartItem?.selectedSize?.name ??
                                        null,
                                      sku: `${product.id}${
                                        selectedCartItem?.selectedColor
                                          ?.color_name
                                          ? `-${selectedCartItem?.selectedColor?.color_name}`
                                          : ""
                                      }${
                                        selectedCartItem?.selectedSize?.name
                                          ? `-${selectedCartItem?.selectedSize?.name}`
                                          : ""
                                      }`,
                                      UID: `${product.id}${selectedCartItem?.selectedColor?.color_name}${selectedCartItem?.selectedSize?.name}`,
                                    },
                                  });
                                  setOption("");
                                }, 1200);
                              } catch (e) {
                                console.log(e);
                              }
                            },
                            errCallback: () => {
                              setOption("");
                            },
                            id: product.id,
                            color:
                              product.colors?.length === 1
                                ? product.colors[0].color
                                : product.colors
                                ? product.colors.filter(
                                    (s) =>
                                      s.name ===
                                      selectedCartItem?.selectedColor
                                        ?.color_name
                                  )[0]?.color
                                : null,
                            image: product.sync_color_images
                              ? product.sync_color_images.filter(
                                  (s) =>
                                    s.color_name ===
                                    selectedCartItem?.selectedColor?.color_name
                                )[0].images[0]?.file_path ??
                                product.sync_color_images.filter(
                                  (s) =>
                                    s.color_name ===
                                    selectedCartItem?.selectedColor?.color_name
                                )[0].images[0]
                              : product.images[0]?.file_path ??
                                product.images[0],
                            quantity: getQuantity({
                              sku: `${product.id}${
                                selectedCartItem?.selectedColor?.color_name
                                  ? `-${selectedCartItem?.selectedColor?.color_name}`
                                  : ""
                              }${
                                selectedCartItem?.selectedSize?.name
                                  ? `-${selectedCartItem?.selectedSize?.name}`
                                  : ""
                              }`,
                            }),
                            size: selectedCartItem?.selectedSize?.name ?? null,
                          });
                        }
                      );
                    }
                  }
                }
              }
            }}
          >
            {
              <img
                src={"/svg/plusCart.svg"}
                className="plus-icon-button"
                onClick={(e) => {
                  e.preventDefault();
                  AddToCartAction({ quantity: 1 });
                }}
              />
            }

            {AddToCartOption.selectedOptions.filter(
              (s) =>
                s.UID ===
                `${product.id}${AddToCartOption?.selectedColor?.color_name}${AddToCartOption?.selectedSize?.name}`
            ).length > 0 &&
              AddToCartOption.selectedOptions.filter(
                (s) =>
                  s.UID ===
                  `${product.id}${AddToCartOption?.selectedColor?.color_name}${AddToCartOption?.selectedSize?.name}`
              )[0]?.quantity > 0 && (
                <span
                  className="absolute top-0 left-0 rounded-2xl bg-white flex justify-center items-center p-2 plus-icon-button"
                  onClick={() => {
                    dispatch({
                      type: "REMOVE-QUANTITY",
                      payload: `${product.id}${AddToCartOption?.selectedColor?.color_name}${AddToCartOption?.selectedSize?.name}`,
                    });
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15.002"
                    height="3.188"
                    viewBox="0 0 15.002 3.188"
                  >
                    <path
                      id="Path_21462"
                      data-name="Path 21462"
                      d="M2.1,2.165A1.567,1.567,0,0,1,.942,1.7,1.573,1.573,0,0,1,.48.544,1.479,1.479,0,0,1,.942-.586,1.623,1.623,0,0,1,2.1-1.02H13.862a1.594,1.594,0,0,1,1.156.449A1.525,1.525,0,0,1,15.48.573a1.525,1.525,0,0,1-.462,1.144,1.594,1.594,0,0,1-1.156.449Z"
                      transform="translate(-0.479 1.021)"
                      fill="#505050"
                    />
                  </svg>
                </span>
              )}

            <div className="button-desc">
              <div className="flex-row max-w-[30px] justify-end relative image-container-cart">
                {AddToCartOption?.enable &&
                  AddToCartOption.selectedOptions
                    .filter((d) => parseInt(d.id) === parseInt(product.id))
                    ?.map((s, key) => {
                      return Array(s.quantity)
                        .fill(1)
                        .map((num) => {
                          return (
                            <img
                              src={getConfiguredImage({
                                src:
                                  s?.selectedColor?.images[0] ??
                                  AddToCartOption.selectedOptions[0]?.images[0]
                                    .file_path ??
                                  AddToCartOption.selectedOptions[0]?.images[0],
                                width: 50,
                                height: 50,
                              })}
                              id={`img${s.UID}`}
                              key={key}
                              className="rounded-md w-8 h-8 static"
                            />
                          );
                        });
                    })}
                {getTotalQuantity() > 0 && (
                  <span className="bg-green-500 text-white rounded-full min-h-3 min-w-[18px] absolute justify-center flex items-center ">
                    {getTotalQuantity()}
                  </span>
                )}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                >
                  <g
                    id="Group_335"
                    data-name="Group 335"
                    transform="translate(0.568 -0.194)"
                  >
                    <g
                      id="Group_11014"
                      data-name="Group 11014"
                      transform="translate(1.192 0.364)"
                    >
                      <g
                        id="Group_4037"
                        data-name="Group 4037"
                        transform="translate(0 0)"
                      >
                        <g id="Group_4033" data-name="Group 4033">
                          <g id="Group_4032" data-name="Group 4032">
                            <path
                              id="Path_15859"
                              data-name="Path 15859"
                              d="M1.077-.921H18.9l3.368,18.583s-1.685,2.585-2.655,2.585c-.735,0-13.582.424-19.695-.325-1.612-.2-2.174-2.257-2.174-2.257Z"
                              transform="translate(2.798 9.169)"
                              fill="#505050"
                            />
                            <g id="bag-5">
                              <g id="Group_2946" data-name="Group 2946">
                                <path
                                  id="Path_15168"
                                  data-name="Path 15168"
                                  d="M33.579,43.2H51.922a3.585,3.585,0,0,0,3.58-3.58.38.38,0,0,0-.006-.068L52.519,22.745a1.976,1.976,0,0,0-1.961-1.673H48.413V19.036a5.662,5.662,0,1,0-11.324,0v2.034H34.944a1.976,1.976,0,0,0-1.962,1.674L30.005,39.556a.386.386,0,0,0-.006.068A3.585,3.585,0,0,0,33.579,43.2Zm4.29-24.168a4.881,4.881,0,0,1,9.762,0v2.034H37.87Zm-4.117,3.841v-.006a1.2,1.2,0,0,1,1.193-1.018h2.145v3.089a.391.391,0,1,0,.781,0v-3.09h9.762v3.089a.391.391,0,1,0,.781,0V21.852h2.145A1.2,1.2,0,0,1,51.75,22.87v.008l2.972,16.779a2.8,2.8,0,0,1-2.8,2.766H33.579a2.8,2.8,0,0,1-2.8-2.766Z"
                                  transform="translate(-29.999 -13.374)"
                                  fill="#505050"
                                />
                              </g>
                            </g>
                          </g>
                          <path
                            id="Path_15172"
                            data-name="Path 15172"
                            d="M0,0S3.125,2.668,6.479,2.668,13.414,0,13.414,0"
                            transform="translate(6.044 19.49)"
                            fill="none"
                            stroke="#ffe836"
                            strokeLinecap="round"
                            strokeWidth="0.3"
                          />
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>
              </div>
              <span className="mt-1">
                Add To Bag{" "}
                {AddToCartOption?.enable &&
                  ` ${
                    AddToCartOption?.selectedColor?.color_name
                      ? `${AddToCartOption?.selectedColor?.color_name} color`
                      : ""
                  }  ${
                    AddToCartOption?.selectedSize?.name
                      ? `${AddToCartOption?.selectedSize?.name} size`
                      : ""
                  }`}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default AddToCartButton;
