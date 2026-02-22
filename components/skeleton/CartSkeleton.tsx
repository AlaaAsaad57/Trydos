import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import { EnableScroll } from "utils/tinyUtils";

function CartSkeleton() {
  const { language, cart, enableCart } = useAppStore();
  return (
    <div
      className={`flex-col ${
        cart.length > 0 ? "pb-[283px]" : "100px"
      }   top-0 left-0 min-h-screen max-h-full h-auto overflow-hidden w-full bg-[#ffffff] min-w-screen z-9999999999 pt-1`}
      data-cy="cartPage-container"
    >
      <div
        className="flex-col pl-2 pr-2 bg-white p-1"
        data-cy="cartPage-header-container"
      >
        <div
          className="flex-row  w-full min-h-[50px] pl-1 pr-2  relative justify-between items-center "
          data-cy="cartPage-headerComponents-container"
        >
          <img
            src="/icons/backIcon.svg"
            className="cursor-pointer z-50"
            data-cy="CartBackIcon"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.APPBAR_BACKICON_BUTTON,
              // });
              EnableScroll();
              enableCart(false);
            }}
          />
          <span
            className="text-[13px] text-[#505050] regular flex-row items-center"
            data-cy="cartPage-textContainer-onHeader"
          >
            <svg
              data-cy="svg-textContainer"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <defs>
                <clipPath id="8876">
                  <rect
                    id="Rectangle_4612"
                    data-name="Rectangle 4612"
                    width="20"
                    height="20"
                    transform="translate(385 60)"
                    fill="none"
                  />
                </clipPath>
                <linearGradient
                  id="linear-gradient"
                  x1="0.5"
                  y1="0.955"
                  x2="0.5"
                  gradientUnits="objectBoundingBox"
                >
                  <stop offset="0" stopColor="#f53c3c" />
                  <stop offset="1" stopColor="#ff9696" />
                </linearGradient>
              </defs>
              <g
                id="Mask_Group_388"
                data-name="Mask Group 388"
                transform="translate(-385 -60)"
                clipPath="url(#8876)"
              >
                <g
                  id="Group_10817"
                  data-name="Group 10817"
                  transform="translate(385 61.666)"
                >
                  <g
                    id="Group_4037"
                    data-name="Group 4037"
                    transform="translate(5.751 0)"
                  >
                    <g
                      id="Group_4033"
                      data-name="Group 4033"
                      transform="translate(0 0)"
                    >
                      <g id="Group_4032" data-name="Group 4032">
                        <path
                          id="Path_15859"
                          data-name="Path 15859"
                          d="M-1.9-1.536H8.059L9.941,8.847S9,10.291,8.458,10.291a104.971,104.971,0,0,1-11-.182c-.9-.111-1.214-1.261-1.214-1.261Z"
                          transform="translate(4.064 6.144)"
                          fill="#2c2a2a"
                        />
                        <g id="bag-5">
                          <g id="Group_2946" data-name="Group 2946">
                            <path
                              id="Path_15168"
                              data-name="Path 15168"
                              d="M52,38.957H62.249a2,2,0,0,0,2-2,.213.213,0,0,0,0-.038l-1.663-9.393a1.1,1.1,0,0,0-1.1-.935h-1.2V25.454a3.164,3.164,0,1,0-6.327,0v1.137h-1.2a1.1,1.1,0,0,0-1.1.936L50,36.919a.216.216,0,0,0,0,.038A2,2,0,0,0,52,38.957Zm2.4-13.5a2.727,2.727,0,1,1,5.454,0v1.137H54.4ZM52.1,27.6v0a.67.67,0,0,1,.667-.569h1.2v1.726a.218.218,0,1,0,.436,0V27.027h5.454v1.726a.218.218,0,1,0,.436,0V27.027h1.2a.67.67,0,0,1,.667.569v0l1.661,9.375a1.566,1.566,0,0,1-1.564,1.546H52a1.566,1.566,0,0,1-1.564-1.546Z"
                              transform="translate(-50 -22.29)"
                              fill="#3c3c3c"
                            />
                          </g>
                        </g>
                      </g>
                      <path
                        id="Path_15172"
                        data-name="Path 15172"
                        d="M0,0A6.538,6.538,0,0,0,3.62,1.491,7.842,7.842,0,0,0,7.5,0"
                        transform="translate(3.377 10.89)"
                        fill="none"
                        stroke="#fce66e"
                        strokeLinecap="round"
                        strokeWidth="0.5"
                      />
                    </g>
                  </g>
                  <g
                    id="Group_10626"
                    data-name="Group 10626"
                    transform="translate(0 5.458)"
                  >
                    <g
                      id="Group_4033-2"
                      data-name="Group 4033"
                      transform="translate(0 0)"
                    >
                      <g id="Group_4032-2" data-name="Group 4032">
                        <path
                          id="Path_15859-2"
                          data-name="Path 15859"
                          d="M-2.508-1.536h6.7L5.456,5.448s-.633.971-1,.971a70.666,70.666,0,0,1-7.4-.122c-.606-.074-.817-.848-.817-.848Z"
                          transform="translate(3.965 4.635)"
                          fill="url(#linear-gradient)"
                        />
                        <g id="bag-5-2" data-name="bag-5">
                          <g id="Group_2946-2" data-name="Group 2946">
                            <path
                              id="Path_15168-2"
                              data-name="Path 15168"
                              d="M51.345,33.5h6.893a1.347,1.347,0,0,0,1.346-1.348.144.144,0,0,0,0-.026l-1.122-6.315a.742.742,0,0,0-.737-.629h-.806v-.764a2.128,2.128,0,0,0-4.256,0v.764h-.806a.742.742,0,0,0-.737.629L50,32.129a.145.145,0,0,0,0,.026A1.347,1.347,0,0,0,51.345,33.5Zm1.611-9.082a1.833,1.833,0,0,1,3.667,0v.764H52.956Zm-1.547,1.444v0a.451.451,0,0,1,.444-.383h.813v1.161a.147.147,0,1,0,.293,0V25.476h3.667v1.161a.147.147,0,1,0,.293,0V25.476h.806a.451.451,0,0,1,.444.383v0l1.117,6.306a1.056,1.056,0,0,1-1.049,1.041H51.345a1.056,1.056,0,0,1-1.052-1.039Z"
                              transform="translate(-49.999 -22.291)"
                              fill="#3c3c3c"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
            <span
              className={`regular ml-[8px] ${
                language === "ar" || language === "ku" ? "text-right" : ""
              }`}
              data-cy="textContainer-textOnHeader"
            >
              {translateFunction("Shopping Bag", language)}{" "}
              {cart.length > 0 && (
                <span className="bold" data-cy="length-ofItems">
                  {cart.length} {translateFunction("Items", language)}
                </span>
              )}
            </span>
          </span>

          <img src="/icons/shareIcon.svg" data-cy="shareIcon-onHeader" />
        </div>
      </div>

      <div className="flex-col overflow-auto max-h-screen">
        <div className="flex-col  w-full h-auto mt-10 pb-[20px]">
          {
            <>
              {[1, 1].map((s, key) => (
                <div
                  className="flex-col bg-white pb-10 pt-2 pl-2 pr-2"
                  key={key}
                >
                  <div className="flex-row min-h-[50px] bg-[#f8f8f8] rounded-2xl justify-between items-center pl-5 pr-5">
                    <Skeleton width={90} height={15} />
                  </div>
                  <div className="flex-col w-full">
                    {[1, 1].map((s, key) => (
                      <div
                        className="flex-row w-full relative  min-h-[191px] h-[191px] bg-[#FEFEFE] mt-3 rounded-2xl overflow-hidden shadow-[0px_3px_10px_rgba(0,0,0,0.1)]"
                        key={key}
                      >
                        <div className="flex-row w-[110px] min-h-[191px] relative">
                          <Skeleton
                            width={110}
                            height={"100%"}
                            borderRadius={15}
                          />
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
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default CartSkeleton;
