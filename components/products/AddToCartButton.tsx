"use client";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import home from "services/home";
import { getConfiguredImage } from "utils/functions";

function AddToCartButton({
  setOption,
  product,
  loading,
  AddToCartAnimation,
}: {
  setOption: any;
  product: any;
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
    console.log(sku);
    if (localCart.some((s) => s.sku === sku)) {
      return localCart.filter((s) => s.sku === sku)[0]?.item_id;
    } else {
      return false;
    }
  };
  const getQuantity = ({ sku }) => {
    if (localCart.some((s) => s.sku === sku)) {
      return localCart.filter((s) => s.sku === sku)[0]?.quantity;
    } else {
      return 1;
    }
  };
  return (
    <div
      className={`add-cart-button ${
        AddToCartOption?.enable && "extended-add-to-cart"
      } ${!loading && " opacity-70"} `}
      onClick={() => {
        if (loading) {
          if (!AddToCartOption?.enable) {
            setOption();
            document.documentElement.style.overflow = "hidden";
            document.documentElement.scrollTop = 0;
            dispatch({
              type: "AddToCartOptionEnable",
              payload: { ...product, quantity: 0 },
            });
          } else {
            dispatch({ type: "LOADED-CART", payload: false });

            home.AddToCart({
              alreadyExist: isAlreayAdded({
                sku: `${product.id}${
                  AddToCartOption?.selectedColor?.color_name
                    ? `-${AddToCartOption?.selectedColor?.color_name}`
                    : ""
                }${
                  AddToCartOption?.selectedSize?.name
                    ? `-${AddToCartOption?.selectedSize?.name}`
                    : ""
                }`,
              }),
              callback: ({ id }) => {
                dispatch({
                  type: "ADD-PRODUCT-TO-CART",
                  payload: {
                    id: product.id,
                    item_id: id,
                    color: product.colors
                      ? product.colors.filter(
                          (s) =>
                            s.name ===
                            AddToCartOption?.selectedColor?.color_name
                        )[0].color
                      : null,
                    image: product.sync_color_images
                      ? product.sync_color_images.filter(
                          (s) =>
                            s.color_name ===
                            AddToCartOption?.selectedColor?.color_name
                        )[0].images[0]?.file_path ??
                        product.sync_color_images.filter(
                          (s) =>
                            s.color_name ===
                            AddToCartOption?.selectedColor?.color_name
                        )[0].images[0]
                      : product.images[0]?.file_path ?? product.images[0],
                    quantity: 1,
                    size: AddToCartOption?.selectedSize?.name ?? null,
                    sku: `${product.id}${
                      AddToCartOption?.selectedColor?.color_name
                        ? `-${AddToCartOption?.selectedColor?.color_name}`
                        : ""
                    }${
                      AddToCartOption?.selectedSize?.name
                        ? `-${AddToCartOption?.selectedSize?.name}`
                        : ""
                    }`,
                  },
                });
                try {
                  let elem = document.querySelector(".add-cart-button");
                  setTimeout(() => {
                    elem.classList.add("success-add");
                    console.log(elem);
                  }, 200);

                  AddToCartAnimation({});
                  setTimeout(() => {
                    elem.classList.remove("success-add");
                  }, 1200);
                } catch (e) {
                  console.log(e);
                }
              },
              id: product.id,
              color: product.colors
                ? product.colors.filter(
                    (s) => s.name === AddToCartOption?.selectedColor?.color_name
                  )[0].color
                : null,
              image: product.sync_color_images
                ? product.sync_color_images.filter(
                    (s) =>
                      s.color_name ===
                      AddToCartOption?.selectedColor?.color_name
                  )[0].images[0]?.file_path ??
                  product.sync_color_images.filter(
                    (s) =>
                      s.color_name ===
                      AddToCartOption?.selectedColor?.color_name
                  )[0].images[0]
                : product.images[0]?.file_path ?? product.images[0],
              quantity: getQuantity({
                sku: `${product.id}${
                  AddToCartOption?.selectedColor?.color_name
                    ? `-${AddToCartOption?.selectedColor?.color_name}`
                    : ""
                }${
                  AddToCartOption?.selectedSize?.name
                    ? `-${AddToCartOption?.selectedSize?.name}`
                    : ""
                }`,
              }),
              size: AddToCartOption?.selectedSize?.name ?? null,
            });
          }
        }
      }}
    >
      <img
        src={"/svg/plusCart.svg"}
        onClick={() => {
          AddToCartAction({ quantity: 1 });
        }}
      />

      <div className="button-desc">
        <div className="flex-row max-w-[30px] justify-end">
          {AddToCartOption?.enable &&
            localCart
              .filter((d) => parseInt(d.id) === parseInt(product.id))
              ?.map((s, key) => {
                return (
                  <img
                    src={getConfiguredImage({
                      src: s.image,
                      width: 50,
                      height: 50,
                    })}
                    key={key}
                    className="rounded-md w-8 h-8 static"
                  />
                );
              })}
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
  );
}

export default AddToCartButton;
