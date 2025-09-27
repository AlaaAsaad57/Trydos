import Spinner from "components/global/Spinner";
import Image from "next/image";
import React from "react";
import auth from "services/auth";
import cart from "services/cart";
import { useAppStore } from "store";
import { getCart, translateFunction } from "utils/functions";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { DetectScreen } from "utils/tinyUtils";

function AddToCartButton({
  colors,
  sizes,
  selectedSize,
  selectedColor,
  selectedVariant,
  fullQty,
  updateQuantity,
  loading,
  setLoading,
  id,
  product,

  initialLoading,
}) {
  const { localCart, currency } = useAppStore();
  const IsValid = () => {
    let color_valid = false,
      size_valid = false;

    if (!colors || colors?.length === 0) color_valid = true;
    else {
      color_valid = Boolean(selectedColor);
    }
    if (!sizes || sizes?.length === 0) size_valid = true;
    else {
      size_valid = Boolean(selectedSize);
    }
    return color_valid && size_valid;
  };

  const Validate = () => {
    if (colors && colors?.length > 0 && !selectedColor) {
      shake("#color-select");
      return false;
    }
    if (sizes && sizes?.length > 0 && !selectedSize) {
      shake("#size-select");
      return false;
    }
    return true;
  };
  const shake = (v) => {
    if (document.querySelector(`${v}`)) {
      document.querySelector(`${v}`).scrollIntoView({ block: "center" });
      document.querySelector(`${v}`).classList.add("shake-anim");
      document.querySelector<HTMLDivElement>(`${v}`).style.backgroundColor =
        "#ffe2e2";
      setTimeout(() => {
        document.querySelector(`${v}`).classList.remove("shake-anim");
        document.querySelector<HTMLDivElement>(`${v}`).style.backgroundColor =
          "transparent";
      }, 1300);
    }
  };
  const getTotalQuantity = () => {
    let num = 0;
    localCart?.map((s) => {
      if (s.id == id) num = num + s.quantity;
    });
    return num;
  };
  const productInCart = () => {
    return localCart.filter((s) => s.id === id);
  };
  const isVariantInCart = ({ exact }) => {
    if (product?.variation?.length === 0)
      return localCart?.find((s) => s.id === id);

    if (
      localCart.find(
        (s) =>
          s.id === id &&
          (s.color === selectedColor?.color_option ||
            s.color ===
              product?.colors?.find(
                (cl) =>
                  cl.option === selectedColor?.color_option ||
                  cl.name === selectedColor?.selected_option
              )?.color) &&
          s.size === (selectedSize?.option ?? selectedSize)
      )
    )
      return localCart.find(
        (s) =>
          s.id === id &&
          (s.color === selectedColor?.color_option ||
            s.color ===
              product?.colors?.find(
                (cl) =>
                  cl.option === selectedColor?.color_option ||
                  cl.name === selectedColor?.color_option
              )?.color) &&
          s.size === (selectedSize?.option ?? selectedSize)
      );
    if (exact) return localCart?.find((s) => s.id === id);
  };

  const animateButton = () => {
    let icon = document.querySelector<HTMLDivElement>(".bagIcon");
    icon.classList.add("animated");
    setTimeout(() => {
      icon.classList.remove("animated");
    }, 2000);
  };
  const animateText = (text) => {
    let container = document.querySelector<HTMLDivElement>(
      "#button-text-container"
    );
    let newText = document.querySelector<HTMLDivElement>(
      "#text-request-response"
    );
    let oldText = document.querySelector<HTMLDivElement>("#button-cart-text");
    newText.innerText = translateFunction(text);
    newText.style.transform = "translateY(22px)";
    oldText.style.transform = "translateY(22px)";
    setTimeout(() => {
      newText.style.transform = "translateY(0px)";
      oldText.style.transform = "translateY(0px)";
    }, 1500);
    setTimeout(() => {
      newText.innerText = "";
    }, 1800);
  };
  const clickHandler = async ({ variant }) => {
    let type = selectedVariant?.type;

    try {
      setLoading(true);
      if (isVariantInCart({ exact: false })) {
        animateButton();
        let response = await cart.UpdateCart({
          cart_id: isVariantInCart({ exact: false })?.item_id,
          qty: (isVariantInCart({ exact: false })?.quantity ?? 0) + 1,
          isFromAddWidget: true,
          is_redeem: product?.is_redeem,
        });
        if (response === false) {
          throw "error";
        }
        GAevent({
          action: GA_EVENT_NAMES.ADD_TO_CART,
          params: {
            currency: currency?.code,
            value: selectedVariant?.offer_price,
            items: [
              {
                item_id: id,
                item_name: product?.name,
                price: selectedVariant?.offer_price,
                quantity:
                  (isVariantInCart({ exact: false })?.quantity ?? 0) + 1,
                brand: product?.brand?.name,
                brand_id: product?.brand?.id,
                category:
                  product?.category?.name || product?.categories?.[0]?.name,
                category_id:
                  product?.category?.id || product?.categories?.[0]?.id,
                count_likes: product?.count_of_likes,
                review_count: product?.views_count ?? product?.view_count,
                item_variant: selectedVariant?.type,
              },
            ],
            interaction_type: "add_to_cart",
            user_id_custom: auth.UserID(),
            screen_name: DetectScreen(),
            screen_path: window.location.pathname,
          },
        });

        animateText("Added To Your Bag");
        await updateQuantity(
          true,
          isVariantInCart({ exact: false })?.type,
          "add"
        );
      } else {
        animateButton();
        await cart.AddToCart({
          product_id: id,
          color: product?.colors?.find(
            (s) =>
              s.option === selectedColor?.color_option ||
              s.name === selectedColor?.color_option
          )?.color,
          type: type,
          choice_1: selectedSize?.option || selectedSize,
          qty: 1,
          image:
            selectedColor?.images[0]?.file_path ||
            selectedColor?.images[0] ||
            product?.images[0]?.file_path ||
            product?.images[0],
          isFromAddWidget: true,
          is_redeem: product?.showRedeemPrice && product?.is_redeem,
          offer_price:
            product?.showRedeemPrice && product?.is_redeem
              ? selectedVariant?.redeem_price
              : selectedVariant.offer_price,
        });

        GAevent({
          action: GA_EVENT_NAMES.ADD_TO_CART,
          params: {
            currency: currency?.code,
            value: selectedVariant?.offer_price,
            items: [
              {
                item_id: id,
                item_name: product?.name,
                price: selectedVariant?.offer_price,
                quantity: 1,
                brand: product?.brand?.name,
                brand_id: product?.brand?.id,
                category: product?.category?.name,
                category_id: product?.category?.id,
                count_likes: product?.count_of_likes,
                review_count: product?.views_count ?? product?.view_count,
                item_variant: selectedVariant?.type,
              },
            ],
            user_id_custom: auth.UserID(),
            interaction_type: "add_to_cart",
            screen_name: DetectScreen(),
            screen_path: window.location.pathname,
          },
        });
        animateText("Added To Your Bag");
        await updateQuantity(
          true,
          [selectedColor?.color_option, selectedSize?.option || selectedSize]
            .filter((e) => Boolean(e))
            .join("-"),
          "add"
        );
      }
      setLoading(false);
    } catch (error) {
      console.log("add/update", error);
      await updateQuantity(false);
      setLoading(false);
    }
  };
  const decreaseHandler = async ({ variant }) => {
    try {
      if (isVariantInCart({ exact: true })?.quantity > 1) {
        setLoading(true);
        animateButton();
        let response = await cart.UpdateCart({
          cart_id: isVariantInCart({ exact: true })?.item_id,
          qty: isVariantInCart({ exact: true })?.quantity - 1,
          isFromAddWidget: true,
        });

        if (response === false) {
          throw "error";
        }
        animateText("Removed From Your Bag");
        setLoading(false);
        await updateQuantity(
          true,
          isVariantInCart({ exact: true })?.type,
          "decrease"
        );
      } else if (isVariantInCart({ exact: true })?.quantity === 1) {
        setLoading(true);
        animateButton();
        await cart.RemoveFromCart({
          cart_item: isVariantInCart({ exact: true }),
          isFromAddWidget: true,
        });
        GAevent({
          action: GA_EVENT_NAMES.REMOVE_FROM_CART,
          params: {
            items: [
              {
                item_id: product.id,
                item_name: product.name,
                item_variant: variant?.type,
                quantity: 1,
                price: variant?.offer_price,
              },
            ],
          },
        });
        animateText("Removed From Your Bag");
        setLoading(false);
        await updateQuantity(
          true,
          isVariantInCart({ exact: true })?.type,
          "decrease"
        );
      }
    } catch (error) {
      console.log("decrease", error);
      await updateQuantity(false);
      setLoading(false);
    }
  };
  return (
    <div className="w-full  px-[20px] flex overflow-hidden">
      <div
        onClick={(e) => {
          if ((e.target as any).closest(".minuse-qty-icon")) return false;
          let val = Validate();
          if (!val) return;
          if (!loading && !initialLoading) {
            clickHandler({ variant: selectedVariant });
          }
        }}
        className={`${
          IsValid() ? "bg-[#513AAF]" : "bg-[#C4C2C2]"
        } w-full h-[70px]   text-[#FFFFFF] ${
          (loading || initialLoading) && "opacity-40 scale-95"
        } gap-[4px] text-[15px]  shadow-[inset_0px_3px_6px_rgb(255,255,255,0.16)] duration-300 transition-all  rounded-[20px] relative flex-col regular  items-center justify-center`}
        id={"add-to-cart-button-container"}
      >
        <PlusIconHolder isValid={IsValid()} />
        {initialLoading ? (
          <Spinner />
        ) : (
          <>
            {getTotalQuantity() > 0 && (
              <RemoveIconHolder
                qty={getTotalQuantity()}
                decreaseHandler={() => {
                  decreaseHandler({ variant: selectedVariant });
                }}
              />
            )}
            <div className="flex gap-[4px]">
              <Image
                className="bagIcon"
                src={"/svg/addtocart/CartButtonIcon.svg"}
                alt={"cart-icon"}
                width={20}
                height={20}
              />
              {fullQty > 0 && <span>X {fullQty}</span>}
            </div>
            <div
              className="flex flex-col overflow-hidden max-h-[22px] gap-[4px] items-center justify-end transition-all ease-in-out duration-700"
              id={"button-text-container"}
            >
              <span
                id={"text-request-response"}
                className="transition-all ease-in-out duration-700"
              >
                {translateFunction("Added To Your Bag")}
              </span>
              <span
                id="button-cart-text"
                className="transition-all ease-in-out duration-700"
              >
                {translateFunction("Add To Bag")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AddToCartButton;

const PlusIconHolder = ({ isValid }) => {
  return (
    <>
      <div className="w-[55px] h-[55px] rounded-[20px] shadow-[0px_3px_6px_rgb(255,255,255,0.16)] bg-[#fff] p-[5px] flex-row justify-start items-end absolute top-[-33px] right-[-33px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 15 15"
        >
          <path
            id="Path_21462"
            data-name="Path 21462"
            d="M2.1,2.165A1.567,1.567,0,0,1,.942,1.7,1.573,1.573,0,0,1,.48.544,1.479,1.479,0,0,1,.942-.586,1.623,1.623,0,0,1,2.1-1.02H13.862a1.594,1.594,0,0,1,1.156.449A1.525,1.525,0,0,1,15.48.573a1.525,1.525,0,0,1-.462,1.144,1.594,1.594,0,0,1-1.156.449ZM7.937,7.812a1.847,1.847,0,0,1-1.344-.521,1.78,1.78,0,0,1-.535-1.332V-5.335a1.756,1.756,0,0,1,.549-1.332,1.9,1.9,0,0,1,1.358-.521,1.787,1.787,0,0,1,1.344.521,1.834,1.834,0,0,1,.506,1.332V5.959A1.806,1.806,0,0,1,9.3,7.291,1.835,1.835,0,0,1,7.937,7.812Z"
            transform="translate(-0.48 7.188)"
            fill={isValid ? "#513aaf" : "#C4C2C2"}
          />
        </svg>
      </div>
    </>
  );
};

const RemoveIconHolder = ({ qty, decreaseHandler }) => {
  return (
    <>
      <div
        onClick={() => {
          decreaseHandler();
        }}
        style={{
          paddingBottom: qty > 1 ? "9px" : "7px",
        }}
        className={`w-[55px] minuse-qty-icon h-[55px] rounded-[20px] shadow-[0px_3px_6px_rgb(255,255,255,0.16)] bg-[#fff] pr-[5px]  flex-row justify-end items-end absolute top-[-33px] left-[-33px]`}
      >
        {qty > 1 ? (
          <svg
            className="minuse-qty-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="3.185"
            viewBox="0 0 15 3.185"
          >
            <path
              id="Path_23679"
              data-name="Path 23679"
              d="M2.1,2.165A1.567,1.567,0,0,1,.942,1.7,1.573,1.573,0,0,1,.48.544,1.479,1.479,0,0,1,.942-.586,1.623,1.623,0,0,1,2.1-1.02H13.862a1.594,1.594,0,0,1,1.156.449A1.525,1.525,0,0,1,15.48.573a1.525,1.525,0,0,1-.462,1.144,1.594,1.594,0,0,1-1.156.449Z"
              transform="translate(-0.48 1.02)"
              fill="#513aaf"
            />
          </svg>
        ) : (
          <svg
            className="minuse-qty-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="12.186"
            height="15.003"
            viewBox="0 0 12.186 15.003"
          >
            <g id="delete" transform="translate(0 -3)">
              <path
                id="Path_14710"
                data-name="Path 14710"
                d="M222.7,154.7a.3.3,0,0,0-.3.3v5.633a.3.3,0,0,0,.6,0V155A.3.3,0,0,0,222.7,154.7Zm0,0"
                transform="translate(-214.511 -147.816)"
                fill="#ff5f61"
              />
              <path
                id="Path_14711"
                data-name="Path 14711"
                d="M104.7,154.7a.3.3,0,0,0-.3.3v5.633a.3.3,0,0,0,.6,0V155A.3.3,0,0,0,104.7,154.7Zm0,0"
                transform="translate(-100.696 -147.816)"
                fill="#ff5f61"
              />
              <path
                id="Path_14712"
                data-name="Path 14712"
                d="M.995,4.465v8.657a1.939,1.939,0,0,0,.515,1.337A1.73,1.73,0,0,0,2.766,15H9.414a1.73,1.73,0,0,0,1.255-.543,1.939,1.939,0,0,0,.515-1.337V4.465a1.342,1.342,0,0,0-.344-2.64h-1.8V1.387A1.38,1.38,0,0,0,7.65,0H4.53A1.38,1.38,0,0,0,3.138,1.387v.439h-1.8a1.342,1.342,0,0,0-.344,2.64ZM9.414,14.3H2.766A1.113,1.113,0,0,1,1.7,13.122V4.5h8.784v8.626A1.113,1.113,0,0,1,9.414,14.3ZM3.841,1.387A.677.677,0,0,1,4.53.7H7.65a.677.677,0,0,1,.689.685v.439h-4.5Zm-2.5,1.142h9.5a.632.632,0,1,1,0,1.265h-9.5a.632.632,0,1,1,0-1.265Zm0,0"
                transform="translate(0.003 3.001)"
                fill="#ff5f61"
              />
              <path
                id="Path_14713"
                data-name="Path 14713"
                d="M163.7,154.7a.3.3,0,0,0-.3.3v5.633a.3.3,0,0,0,.6,0V155A.3.3,0,0,0,163.7,154.7Zm0,0"
                transform="translate(-157.604 -147.816)"
                fill="#ff5f61"
              />
            </g>
          </svg>
        )}
      </div>
    </>
  );
};
