import React from "react";
import { useAppStore } from "store";
import { getCart, LogError, translateFunction } from "utils/functions";
import { RemoveIconHolder } from "./Button";
import cart from "services/cart";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";

function NotifyButton({
  isNotified,
  notifyAction,
  loading,
  id,
  product,
  selectedVariant,
  setLoading,
  colors,
  sizes,
  selectedColor,
  selectedSize,
  updateQuantity,
}) {
  const { localCart } = useAppStore();
  const getTotalQuantity = () => {
    let num = 0;
    localCart?.map((s) => {
      if (s.id == id) num = num + s.quantity;
    });
    return num;
  };
  const isVariantInCart = ({ exact }) => {
    if (!product?.variation?.length) return localCart?.find((s) => s.id === id);
    let cartItem = getLocalCartItem();
    if (cartItem) return cartItem;
    if (exact) return localCart?.find((s) => s.id === id);
  };
  const getLocalCartItem = () => {
    const pvid = selectedVariant?.product_variation_id ?? selectedVariant?.id;
    if (pvid) {
      return localCart.find((s) => s.product_variation_id === pvid);
    }
    return null;
  };

  const decreaseHandler = async ({ variant }) => {
    try {
      if (isVariantInCart({ exact: true })?.quantity > 1) {
        setLoading(true);

        let response = await cart.UpdateCart({
          cart_id: isVariantInCart({ exact: true })?.item_id,
          qty: isVariantInCart({ exact: true })?.quantity - 1,
          isFromAddWidget: true,
        });

        if (response === false) {
          throw "error";
        }
        await getCart({
          callback: () => {},
        });

        setLoading(false);
        await updateQuantity(
          true,
          isVariantInCart({ exact: true })?.product_variation_id,
          "decrease",
        );
      } else if (isVariantInCart({ exact: true })?.quantity === 1) {
        setLoading(true);

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
                item_variant: variant?.product_variation_id ?? variant?.id,
                quantity: 1,
                price: variant?.offer_price,
              },
            ],
          },
        });
        await getCart({
          callback: () => {},
        });

        setLoading(false);
        await updateQuantity(
          true,
          isVariantInCart({ exact: true })?.product_variation_id,
          "decrease",
        );
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "decrase qty button - add to cart widget",
        slug: product?.slug,
        url: window.location.href,
        variant,
      });
      await updateQuantity(false);
      setLoading(false);
    }
  };
  return (
    <div className="w-full duration-75 transition-all px-[20px] flex overflow-hidden">
      <div className="w-full overflow-hidden flex">
        <div
          data-cy="notify_container_2"
          onClick={(e) => {
            if ((e.target as any).closest(".minuse-qty-icon")) return false;
            notifyAction();
          }}
          className={`${
            !isNotified
              ? "bg-[#513AAF] text-white"
              : "bg-[#F4F2FD] text-[#513AAF]"
          } w-full h-[70px]  duration-300 transition-all ${
            loading && "opacity-40 scale-95"
          } gap-[4px] text-[15px]  shadow-[inset_0px_3px_6px_rgb(255,255,255,0.16)]  rounded-[20px] relative flex-col regular  items-center justify-center`}
          id={"add-to-cart-button-container"}
        >
          {getTotalQuantity() > 0 && (
            <RemoveIconHolder
              qty={getTotalQuantity()}
              decreaseHandler={() => {
                decreaseHandler({ variant: selectedVariant });
              }}
            />
          )}
          <ButtonBorder />
          <NotificationIconHolder isNotified={isNotified} />
          <svg
            className="absolute top-[-33px] right-[-33px] z-50"
            xmlns="http://www.w3.org/2000/svg"
            width="55"
            height="55"
            viewBox="0 0 55 55"
          >
            <rect
              x="0.25"
              y="0.25"
              width="54.5"
              height="54.5"
              strokeWidth={"0.5"}
              stroke="#513AAF"
              rx="19.75"
              fill="none"
            />
          </svg>

          <div className="flex gap-[4px]">
            {!isNotified ? (
              <>
                <svg
                  data-cy="is-not-notified-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                >
                  <defs>
                    <clipPath id="1223">
                      <rect
                        id="Rectangle_4829"
                        data-name="Rectangle 4829"
                        width="20"
                        height="20"
                        transform="translate(199.969 852.074)"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_371"
                    data-name="Mask Group 371"
                    transform="translate(-199.969 -852.074)"
                    clipPath="url(#1223)"
                  >
                    <g id="ringing" transform="translate(200.832 852.017)">
                      <g
                        id="Group_11211"
                        data-name="Group 11211"
                        transform="translate(14.714 1.142)"
                      >
                        <path
                          id="Path_21477"
                          data-name="Path 21477"
                          d="M26.518,9.331a.417.417,0,0,1-.417-.417,9.117,9.117,0,0,0-2.689-6.491.417.417,0,0,1,.59-.59,9.945,9.945,0,0,1,2.933,7.081A.417.417,0,0,1,26.518,9.331Z"
                          transform="translate(-23.29 -1.711)"
                          fill="#fcfcfc"
                        />
                      </g>
                      <g
                        id="Group_11212"
                        data-name="Group 11212"
                        transform="translate(0 1.142)"
                      >
                        <path
                          id="Path_21478"
                          data-name="Path 21478"
                          d="M1.667,9.331a.417.417,0,0,1-.417-.417A9.945,9.945,0,0,1,4.183,1.833a.417.417,0,1,1,.59.59A9.117,9.117,0,0,0,2.085,8.914a.417.417,0,0,1-.417.417Z"
                          transform="translate(-1.25 -1.711)"
                          fill="#fcfcfc"
                        />
                      </g>
                      <g
                        id="Group_11213"
                        data-name="Group 11213"
                        transform="translate(7.511 0)"
                      >
                        <path
                          id="Path_21479"
                          data-name="Path 21479"
                          d="M15.421,3.488A.417.417,0,0,1,15,3.071v-1.4a.835.835,0,1,0-1.669,0v1.4a.417.417,0,1,1-.835,0v-1.4a1.669,1.669,0,1,1,3.338,0v1.4A.417.417,0,0,1,15.421,3.488Z"
                          transform="translate(-12.5 0)"
                          fill="#fcfcfc"
                        />
                      </g>
                      <g
                        id="Group_11214"
                        data-name="Group 11214"
                        transform="translate(6.259 16.69)"
                      >
                        <path
                          id="Path_21480"
                          data-name="Path 21480"
                          d="M13.546,28.338a2.924,2.924,0,0,1-2.921-2.921.417.417,0,1,1,.835,0,2.086,2.086,0,0,0,4.173,0,.417.417,0,1,1,.835,0A2.924,2.924,0,0,1,13.546,28.338Z"
                          transform="translate(-10.625 -25)"
                          fill="#fcfcfc"
                        />
                      </g>
                      <g
                        id="Group_11215"
                        data-name="Group 11215"
                        transform="translate(0.835 2.504)"
                      >
                        <path
                          id="Path_21481"
                          data-name="Path 21481"
                          d="M17.939,18.771H3.752a1.252,1.252,0,0,1-.814-2.2A5.8,5.8,0,0,0,5,12.127V9.592a5.842,5.842,0,1,1,11.683,0v2.535a5.8,5.8,0,0,0,2.059,4.435,1.252,1.252,0,0,1-.807,2.209ZM10.845,4.585A5.012,5.012,0,0,0,5.838,9.592v2.535A6.63,6.63,0,0,1,3.484,17.2a.417.417,0,0,0,.268.737H17.939a.417.417,0,0,0,.271-.734,6.635,6.635,0,0,1-2.358-5.076V9.592a5.012,5.012,0,0,0-5.007-5.007Z"
                          transform="translate(-2.5 -3.75)"
                          fill="#fcfcfc"
                        />
                      </g>
                    </g>
                  </g>
                </svg>
              </>
            ) : (
              <>
                <svg
                  data-cy="is-notified-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                >
                  <defs>
                    <clipPath id="123">
                      <rect
                        id="Rectangle_6496"
                        data-name="Rectangle 6496"
                        width="20"
                        height="20"
                        transform="translate(200 851.892)"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_856"
                    data-name="Mask Group 856"
                    transform="translate(-200 -851.892)"
                    clipPath="url(#123)"
                  >
                    <g id="ringing-2" transform="translate(200.827 852.036)">
                      <g
                        id="Group_14961"
                        data-name="Group 14961"
                        transform="translate(13.76 0.62)"
                      >
                        <path
                          id="Path_23666"
                          data-name="Path 23666"
                          d="M25.654,9.32a.828.828,0,0,1-.827-.827A8.632,8.632,0,0,0,22.282,2.35a.827.827,0,0,1,1.17-1.17,10.274,10.274,0,0,1,3.029,7.313A.828.828,0,0,1,25.654,9.32Z"
                          transform="translate(-22.04 -0.937)"
                          fill="#513aaf"
                        />
                      </g>
                      <g
                        id="Group_14962"
                        data-name="Group 14962"
                        transform="translate(0 0.62)"
                      >
                        <path
                          id="Path_23667"
                          data-name="Path 23667"
                          d="M2.077,9.32a.828.828,0,0,1-.827-.827A10.274,10.274,0,0,1,4.279,1.18a.827.827,0,0,1,1.17,1.17A8.631,8.631,0,0,0,2.9,8.493a.828.828,0,0,1-.827.827Z"
                          transform="translate(-1.25 -0.937)"
                          fill="#513aaf"
                        />
                      </g>
                      <g
                        id="Group_14963"
                        data-name="Group 14963"
                        transform="translate(0.827 0)"
                      >
                        <path
                          id="Path_23668"
                          data-name="Path 23668"
                          d="M18.533,13.993a5.541,5.541,0,0,1-1.968-4.24V7.446A5.8,5.8,0,0,0,11.6,1.721V.827a.827.827,0,1,0-1.655,0v.894A5.8,5.8,0,0,0,4.982,7.446V9.753A5.548,5.548,0,0,1,3.006,14a1.448,1.448,0,0,0,.942,2.547H17.6a1.448,1.448,0,0,0,.934-2.554Z"
                          transform="translate(-2.5 0)"
                          fill="#513aaf"
                        />
                        <path
                          id="Path_23669"
                          data-name="Path 23669"
                          d="M13.447,28.732a3.108,3.108,0,0,0,3.04-2.482H10.407A3.108,3.108,0,0,0,13.447,28.732Z"
                          transform="translate(-5.174 -8.876)"
                          fill="#513aaf"
                        />
                      </g>
                    </g>
                  </g>
                </svg>
              </>
            )}
          </div>
          {isNotified ? (
            <span id="text-request-response">
              {translateFunction("We Will Inform You When Size Is Available")}
            </span>
          ) : (
            <span id="text-request-response">
              {translateFunction("Notify Me When Size Is Available")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotifyButton;
const ButtonBorder = () => {
  return (
    <svg
      className="absolute top-0 right-0 z-30"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="70"
    >
      <rect
        x="0.25"
        y="0.25"
        width="calc(100% - 0.5px)"
        height="69.5"
        strokeWidth={"0.5"}
        stroke="#513AAF"
        rx="19.75"
        fill="none"
      />
    </svg>
  );
};
const NotificationIconHolder = ({ isNotified }) => {
  return (
    <>
      <div className="bagIcon w-[55px] h-[55px] z-40 rounded-[20px] shadow-[0px_3px_6px_rgb(255,255,255,0.16)] bg-white p-[7px] flex-row justify-start items-end absolute top-[-33px] right-[-33px]">
        {isNotified ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <defs>
              <clipPath id="4545">
                <rect
                  id="Rectangle_6497"
                  data-name="Rectangle 6497"
                  width="15"
                  height="15"
                  transform="translate(199.969 852.074)"
                  fill="none"
                />
              </clipPath>
            </defs>
            <g
              id="Mask_Group_857"
              data-name="Mask Group 857"
              transform="translate(-199.969 -852.074)"
              clipPath="url(#4545)"
            >
              <g id="ringing" transform="translate(200.616 852.031)">
                <g
                  id="Group_14964"
                  data-name="Group 14964"
                  transform="translate(11.037 0.857)"
                >
                  <path
                    id="Path_23670"
                    data-name="Path 23670"
                    d="M25.711,7.427a.313.313,0,0,1-.313-.313,6.839,6.839,0,0,0-2.017-4.869.313.313,0,1,1,.443-.443,7.46,7.46,0,0,1,2.2,5.311A.313.313,0,0,1,25.711,7.427Z"
                    transform="translate(-23.29 -1.711)"
                    fill="#513aaf"
                  />
                </g>
                <g
                  id="Group_14965"
                  data-name="Group 14965"
                  transform="translate(0 0.857)"
                >
                  <path
                    id="Path_23671"
                    data-name="Path 23671"
                    d="M1.563,7.427a.313.313,0,0,1-.313-.313A7.46,7.46,0,0,1,3.45,1.8a.313.313,0,0,1,.443.443A6.839,6.839,0,0,0,1.876,7.114a.313.313,0,0,1-.313.313Z"
                    transform="translate(-1.25 -1.711)"
                    fill="#513aaf"
                  />
                </g>
                <g
                  id="Group_14966"
                  data-name="Group 14966"
                  transform="translate(5.634 0)"
                >
                  <path
                    id="Path_23672"
                    data-name="Path 23672"
                    d="M14.691,2.617a.313.313,0,0,1-.313-.313V1.252a.626.626,0,1,0-1.252,0V2.3a.313.313,0,1,1-.626,0V1.252a1.252,1.252,0,1,1,2.5,0V2.3A.313.313,0,0,1,14.691,2.617Z"
                    transform="translate(-12.5 0)"
                    fill="#513aaf"
                  />
                </g>
                <g
                  id="Group_14967"
                  data-name="Group 14967"
                  transform="translate(4.695 12.519)"
                >
                  <path
                    id="Path_23673"
                    data-name="Path 23673"
                    d="M12.816,27.5a2.193,2.193,0,0,1-2.191-2.191.313.313,0,1,1,.626,0,1.565,1.565,0,0,0,3.13,0,.313.313,0,1,1,.626,0A2.193,2.193,0,0,1,12.816,27.5Z"
                    transform="translate(-10.625 -25)"
                    fill="#513aaf"
                  />
                </g>
                <g
                  id="Group_14968"
                  data-name="Group 14968"
                  transform="translate(0.626 1.878)"
                >
                  <path
                    id="Path_23674"
                    data-name="Path 23674"
                    d="M14.08,15.017H3.439a.939.939,0,0,1-.61-1.653,4.352,4.352,0,0,0,1.549-3.331v-1.9a4.382,4.382,0,1,1,8.764,0v1.9a4.347,4.347,0,0,0,1.544,3.327.939.939,0,0,1-.605,1.657ZM8.76,4.376A3.76,3.76,0,0,0,5,8.132v1.9a4.973,4.973,0,0,1-1.766,3.805.313.313,0,0,0,.2.553H14.08a.313.313,0,0,0,.2-.551,4.977,4.977,0,0,1-1.768-3.807v-1.9A3.76,3.76,0,0,0,8.76,4.376Z"
                    transform="translate(-2.5 -3.75)"
                    fill="#513aaf"
                  />
                </g>
              </g>
            </g>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <defs>
              <clipPath id="3467">
                <rect
                  id="Rectangle_4830"
                  data-name="Rectangle 4830"
                  width="15"
                  height="15"
                  transform="translate(200 851.892)"
                  fill="none"
                />
              </clipPath>
            </defs>
            <g
              id="Mask_Group_372"
              data-name="Mask Group 372"
              transform="translate(-200 -851.892)"
              clipPath="url(#3467)"
            >
              <g id="ringing-2" transform="translate(200.62 852)">
                <g
                  id="Group_11216"
                  data-name="Group 11216"
                  transform="translate(10.32 0.465)"
                >
                  <path
                    id="Path_21482"
                    data-name="Path 21482"
                    d="M24.75,7.224a.621.621,0,0,1-.62-.62A6.474,6.474,0,0,0,22.222,2a.62.62,0,0,1,.877-.877A7.705,7.705,0,0,1,25.371,6.6.621.621,0,0,1,24.75,7.224Z"
                    transform="translate(-22.04 -0.937)"
                    fill="#513aaf"
                  />
                </g>
                <g
                  id="Group_11217"
                  data-name="Group 11217"
                  transform="translate(0 0.465)"
                >
                  <path
                    id="Path_21483"
                    data-name="Path 21483"
                    d="M1.87,7.224a.621.621,0,0,1-.62-.62A7.705,7.705,0,0,1,3.522,1.119.62.62,0,0,1,4.4,2,6.473,6.473,0,0,0,2.491,6.6a.621.621,0,0,1-.62.62Z"
                    transform="translate(-1.25 -0.937)"
                    fill="#513aaf"
                  />
                </g>
                <g
                  id="Group_11218"
                  data-name="Group 11218"
                  transform="translate(0.62 0)"
                >
                  <path
                    id="Path_21484"
                    data-name="Path 21484"
                    d="M14.525,10.494a4.156,4.156,0,0,1-1.476-3.18V5.584A4.347,4.347,0,0,0,9.325,1.291V.62a.62.62,0,1,0-1.241,0v.67A4.346,4.346,0,0,0,4.361,5.584v1.73A4.161,4.161,0,0,1,2.88,10.5a1.086,1.086,0,0,0,.706,1.911H13.824a1.086,1.086,0,0,0,.7-1.915Z"
                    transform="translate(-2.5 0)"
                    fill="#513aaf"
                  />
                  <path
                    id="Path_21485"
                    data-name="Path 21485"
                    d="M12.687,28.111a2.331,2.331,0,0,0,2.28-1.861H10.407A2.331,2.331,0,0,0,12.687,28.111Z"
                    transform="translate(-6.482 -13.22)"
                    fill="#513aaf"
                  />
                </g>
              </g>
            </g>
          </svg>
        )}
      </div>
    </>
  );
};
