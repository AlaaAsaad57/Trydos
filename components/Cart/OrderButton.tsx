import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import {
  GetAppLanguage,
  getCart,
  getUser,
  translateFunction,
} from "utils/functions";
import ConfirmMobile from "./ConfirmMobile";
import { useParams } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import OrderMarquee from "./OrderMarquee";
import DiscoutIcon from "public/svg/cart/Disount.svg";
import GiftIcon from "public/svg/cart/Gift.svg";
import ShippingIcon from "public/svg/cart/Shipping.svg";
function OrderButton({ close, toOrders }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const cart = useSelector((state: StateInterface) => state.cart);
  const [option, setOption] = useState(false);
  const currency_symbol = useSelector(
    (state: StateInterface) => state.homepage.currency
  );
  const ItemsIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="16"
        height="16"
        viewBox="0 0 16 16"
      >
        <defs>
          <clipPath id="clip-path23221">
            <rect
              id="Rectangle_5757"
              data-name="Rectangle 5757"
              width="16"
              height="16"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Mask_Group_531"
          data-name="Mask Group 531"
          clipPath="url(#clip-path23221)"
        >
          <g id="Line_color" transform="translate(1.932 0)">
            <g id="Group_12774" data-name="Group 12774">
              <g
                id="Group_12771"
                data-name="Group 12771"
                transform="translate(0 3.858)"
              >
                <g id="Group_12770" data-name="Group 12770">
                  <g id="Group_12769" data-name="Group 12769">
                    <path
                      id="Path_22218"
                      data-name="Path 22218"
                      d="M12.8,3.866C9.461,1.8,6.024,5.072,6.024,5.072L2.382,8.715s-1.965,1.712.956,4.618c2.906,2.921,4.618.956,4.618.956L11.6,10.646s3.274-3.437,1.206-6.78ZM11.672,6.115a.79.79,0,1,1,0-1.117A.789.789,0,0,1,11.672,6.115Z"
                      transform="translate(-1.543 -2.99)"
                      fill="#1d1d1d"
                    />
                    <g id="Group_12768" data-name="Group 12768">
                      <path
                        id="Path_22219"
                        data-name="Path 22219"
                        d="M12.949,3.748a4.738,4.738,0,0,0-2.894-.692A6.484,6.484,0,0,0,7.6,3.822,7.78,7.78,0,0,0,5.741,5.18L3.175,7.745c-.285.285-.568.573-.855.855a2.419,2.419,0,0,0-.352.431,2.5,2.5,0,0,0-.374,1.457,4.2,4.2,0,0,0,1.028,2.334c1.013,1.267,2.764,2.794,4.532,2.242a2.365,2.365,0,0,0,.93-.537c.136-.13.266-.267.4-.4l2.642-2.642a10.727,10.727,0,0,0,1.291-1.461,6.148,6.148,0,0,0,1.2-4.772,4.813,4.813,0,0,0-.6-1.436c-.129-.211-.461-.018-.331.194a4.4,4.4,0,0,1,.631,2.784,6.123,6.123,0,0,1-.763,2.281,7.348,7.348,0,0,1-1.251,1.69L8.809,13.26l-.89.89-.08.082c-.031.031-.063.061-.1.089l-.068.056c.039-.031-.044.032-.062.044a2.086,2.086,0,0,1-1.235.372,3.7,3.7,0,0,1-2.183-.936C3.031,12.918,1.518,11.269,2.1,9.63a2.137,2.137,0,0,1,.256-.489c.016-.023.064-.087.039-.055.019-.024.039-.048.059-.071s.056-.063.086-.092L2.96,8.5,5.543,5.921a10.511,10.511,0,0,1,1.336-1.2,5.841,5.841,0,0,1,4.487-1.206,4.469,4.469,0,0,1,1.389.566c.211.129.4-.2.193-.331Z"
                        transform="translate(-1.591 -3.038)"
                        fill="#3c3c59"
                      />
                      <path
                        id="Path_22220"
                        data-name="Path 22220"
                        d="M9.437,5.631l-.042.039-.019.016c.027-.024.007-.005,0,0a.891.891,0,0,1-.1.062c-.006,0-.047.022-.027.013s-.008,0-.013,0l-.022.008A.787.787,0,0,1,9.1,5.8l-.023,0c.043-.007.015,0,.005,0l-.054,0H8.976c-.012,0-.073-.008-.025,0a.875.875,0,0,1-.1-.021L8.8,5.767l-.022-.008c-.022-.007.028.014,0,0a.96.96,0,0,1-.1-.054l-.039-.028c.032.024-.015-.014-.024-.022a.917.917,0,0,1-.079-.084c.024.028-.006-.009-.013-.019S8.5,5.515,8.49,5.5s-.017-.033-.025-.049c-.017-.033.007.023,0-.012a.892.892,0,0,1-.033-.111c0-.018-.007-.035-.01-.053.006.04,0,0,0-.018a1.015,1.015,0,0,1,0-.115s0-.03,0,0,0-.006,0-.013.007-.035.011-.053a.857.857,0,0,1,.033-.1c-.014.036,0-.006.01-.018s.017-.033.027-.048.02-.031.03-.047l.014-.02c-.016.022-.005.007.006-.005a.793.793,0,0,1,.075-.076l.025-.021s-.025.018-.007.005S8.68,4.711,8.7,4.7l.048-.027.028-.014s.027-.012.006,0,.029-.01.035-.012l.059-.017.045-.01.03,0s-.035,0-.013,0c.039,0,.076,0,.115,0l.031,0s.03,0,0,0,0,0,0,0l.03.006a.785.785,0,0,1,.111.032l.022.008s-.029-.014-.01,0l.049.025.048.028.02.013s.039.029.019.014,0,0,.006.005l.024.022c.014.013.028.027.041.041l.038.043s-.018-.025-.005-.007l.023.033a.985.985,0,0,1,.061.111c-.017-.034,0,.006.006.019s.013.039.018.059.009.04.013.06,0,.039,0,.013,0,.008,0,.013a.786.786,0,0,1,0,.123c0,.007,0,.04,0,.013s0,.007,0,.013q-.005.03-.013.06c-.005.02-.011.04-.018.059s-.007.019-.011.029c-.009.026.014-.027,0,0a1.157,1.157,0,0,1-.062.11l-.014.02c-.028.041.015-.015,0,.006s-.033.037-.05.055a.192.192,0,1,0,.271.271,1,1,0,0,0,.19-1.12.982.982,0,0,0-.968-.551A.981.981,0,1,0,9.708,5.9a.192.192,0,1,0-.271-.271Z"
                        transform="translate(0.557 -2.642)"
                        fill="#3c3c59"
                      />
                    </g>
                  </g>
                </g>
              </g>
              <g
                id="Group_12773"
                data-name="Group 12773"
                transform="translate(8.626)"
              >
                <g id="Group_12772" data-name="Group 12772">
                  <path
                    id="Path_22221"
                    data-name="Path 22221"
                    d="M10.962,5.146a6.493,6.493,0,0,0,.534-3.27c-.075-.638-.312-1.6-1.077-1.721C9.671.043,9.1.836,8.8,1.405a6.525,6.525,0,0,0-.736,3.135c.012.734.168,2,1.058,2.2.241.053.343-.317.1-.37A.81.81,0,0,1,8.7,5.882a2.908,2.908,0,0,1-.248-1.067,6.222,6.222,0,0,1,.486-2.827,3.757,3.757,0,0,1,.6-1.011,1.188,1.188,0,0,1,.666-.445c.591-.083.806.766.878,1.191a5.928,5.928,0,0,1-.459,3.229c-.1.225.233.42.331.194Z"
                    transform="translate(-8.06 -0.145)"
                    fill="#3c3c59"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    );
  };
  const user = useSelector((state: StateInterface) => state.auth.user);

  const MenuIcon = ({ className }) => {
    return (
      <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="6"
        viewBox="0 0 10 6"
      >
        <g id="Path_15448" data-name="Path 15448" fill="#1d1d1d">
          <path
            d="M 8.818389892578125 5.899997234344482 L 1.181609988212585 5.899997234344482 C 0.7388899922370911 5.899997234344482 0.3578200042247772 5.624197006225586 0.1871100068092346 5.180217266082764 C -0.001460000057704747 4.689786911010742 0.1188699975609779 4.154346942901611 0.4936699867248535 3.81611704826355 L 4.312049865722656 0.3702371418476105 C 4.505149841308594 0.1959771364927292 4.749470233917236 0.100007139146328 5 0.100007139146328 C 5.250529766082764 0.100007139146328 5.494840145111084 0.1959771364927292 5.687940120697021 0.3702371418476105 L 9.506329536437988 3.81611704826355 C 9.881130218505859 4.154346942901611 10.00146007537842 4.689786911010742 9.81289005279541 5.180217266082764 C 9.642180442810059 5.624186992645264 9.261110305786133 5.899997234344482 8.818389892578125 5.899997234344482 Z"
            stroke="none"
          />
          <path
            d="M 5 0.1999969482421875 C 4.774270057678223 0.1999969482421875 4.55374002456665 0.2868170738220215 4.379039764404297 0.4444770812988281 L 0.5606603622436523 3.890357255935669 C 0.2168397903442383 4.200636863708496 0.1068496704101562 4.69284725189209 0.2804498672485352 5.144327163696289 C 0.4383096694946289 5.554887294769287 0.7751903533935547 5.799997329711914 1.181610107421875 5.799997329711914 L 8.818380355834961 5.799997329711914 C 9.224800109863281 5.799997329711914 9.561690330505371 5.554887294769287 9.719550132751465 5.144317150115967 C 9.893150329589844 4.692837238311768 9.783160209655762 4.200627326965332 9.439339637756348 3.890357255935669 L 5.620950222015381 0.4444770812988281 C 5.446249961853027 0.2868170738220215 5.225729942321777 0.1999969482421875 5 0.1999969482421875 M 4.999998569488525 1.9073486328125e-06 C 5.268139839172363 1.9073486328125e-06 5.536280155181885 0.09866714477539062 5.754940032958984 0.295997142791748 L 9.573329925537109 3.74187707901001 C 10.42065048217773 4.506526947021484 9.921339988708496 5.999997138977051 8.818380355834961 5.999997138977051 L 1.181610107421875 5.999997138977051 C 0.07865047454833984 5.999997138977051 -0.420649528503418 4.506526947021484 0.4266700744628906 3.74187707901001 L 4.245049953460693 0.295997142791748 C 4.463715076446533 0.09866714477539062 4.731857299804688 1.9073486328125e-06 4.999998569488525 1.9073486328125e-06 Z"
            stroke="none"
            fill="#fff"
          />
        </g>
      </svg>
    );
  };
  const getDiscount = () => {
    var a = parseInt(
      ((cart.total_discount_on_product / cart.sub_total) * 100).toString()
    );
    return a;
  };
  const dispatch = useDispatch();
  const GoToOrders = async () => {
    try {
      setLoading(true);
      await getCart({
        callback: ([data, res]) => {
          dispatch({ type: "CART-INIT", payload: data ?? { cart: [] } });
        },
      });
      if (user) toOrders();
      else {
        setOption(true);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  const handlers = useSwipeable({
    onSwipedDown: (e) => {
      setExpanded(false);
    },
    delta: 10,
    trackMouse: true,
    trackTouch: true,

    touchEventOptions: {
      passive: false,
    },
  });
  return (
    <>
      {expanded && (
        <div
          className="fixed top-[50px] min-w-[100vw] min-h-screen opacity-40 bg-[black] z-50"
          onClick={() => {
            setExpanded(false);
          }}
        />
      )}
      <div
        style={{
          borderTopLeftRadius: "30px",
          borderTopRightRadius: "30px",
          boxShadow: "0px -3px 20px #0000001a",
          bottom: "calc(env(safe-area-inset-bottom) + 40px)",
        }}
        className="order-bottom-button flex-col z-50 fixed  left-0 bg-white min-h-[100px] w-full"
      >
        {cart.cart.length > 0 && (
          <div
            {...handlers}
            className={`flex-col w-full overflow-hidden ${
              expanded
                ? "h-[405px] pt-[10px] px-[12px] pb-[10px]"
                : "h-[116px] pt-[10px] px-[12px] pb-[10px] "
            }  transition-all`}
          >
            <div className="flex-row w-full justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
              >
                <g
                  id="Group_13008"
                  data-name="Group 13008"
                  transform="translate(-65 -464)"
                >
                  <g
                    id="Group_10756"
                    data-name="Group 10756"
                    transform="translate(65 464)"
                  >
                    <path
                      id="Subtraction_1"
                      data-name="Subtraction 1"
                      d="M.305,11.241a.3.3,0,0,1-.182-.063.338.338,0,0,1-.111-.353L.787,8.273A5.591,5.591,0,0,1,0,5.408,5.313,5.313,0,0,1,5.2,0a5.313,5.313,0,0,1,5.2,5.408,5.314,5.314,0,0,1-5.2,5.41,5.064,5.064,0,0,1-2.917-.926L.478,11.187A.278.278,0,0,1,.305,11.241Zm4.847-3.1a.666.666,0,1,0,.656.666A.652.652,0,0,0,5.152,8.145Zm.134-5.308A1.026,1.026,0,0,1,6.4,3.864c0,.5-.213.816-.815,1.194a1.672,1.672,0,0,0-.953,1.5v.118c0,.373.2.6.521.6.3,0,.47-.189.5-.548.024-.519.211-.78.833-1.162A1.964,1.964,0,0,0,5.331,1.887a2.1,2.1,0,0,0-2.05,1.146,1.384,1.384,0,0,0-.135.6.45.45,0,0,0,.482.506c.261,0,.407-.126.5-.434A1.109,1.109,0,0,1,5.286,2.837Z"
                      transform="translate(0 2.758)"
                      fill="#8e8e8e"
                    />
                    <path
                      id="Path_21380"
                      data-name="Path 21380"
                      d="M11.934,11.258a.3.3,0,0,1-.184.064.277.277,0,0,1-.171-.055L9.773,9.973l-.02.013a6.2,6.2,0,0,0,.469-2.376A5.937,5.937,0,0,0,4.41,1.564a5.512,5.512,0,0,0-1.277.148A5.047,5.047,0,0,1,6.857.079a5.314,5.314,0,0,1,5.2,5.409,5.574,5.574,0,0,1-.787,2.864l.775,2.554a.335.335,0,0,1-.11.352Z"
                      transform="translate(0.79 0.557)"
                      fill="#8e8e8e"
                    />
                    <rect
                      id="Rectangle_4714"
                      data-name="Rectangle 4714"
                      width="13.459"
                      height="14"
                      transform="translate(0.541)"
                      fill="none"
                    />
                  </g>
                </g>
              </svg>
            </div>
            <OrderMarquee />
            {expanded && (
              <div className="flex-col bg-[#F8F8F8] rounded-t-[12px]  mt-3 pt-[15px]">
                <div className="flex-row items-start pl-[12px]">
                  <ItemsIcon />
                  <div className="flex-col ml-[5px]">
                    <span className=" medium text-[#1D1D1D] text-[13px]">
                      {translate("Item")}
                    </span>
                    <span className="regular text-[11px]">
                      {translate("Total Items")}
                      <span className="ml-1 bold">{cart.cart.length}</span>
                    </span>
                  </div>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-4">
                  <div className="flex-col pl-[28px] text-[#1D1D1D]">
                    <span className="medium text-[13px]">
                      {translateFunction("Price")}
                    </span>
                    <span className="regular text-[11px]">
                      {translateFunction("Normal Price")}
                    </span>
                  </div>
                  <span className="ml-[5px] medium text-[#1D1D1D] text-[13px] pr-[13px]">
                    {cart.sub_total} {currency_symbol.symbol}
                  </span>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-2 bg-[#FDFDEF] rounded-[12px] pt-1">
                  <div className="flex-row pl-[12px]">
                    <span className="flex-row translate-y-[3px]">
                      <DiscoutIcon />
                    </span>{" "}
                    <div className="flex-col pl-1 text-[#A28E5B]">
                      <span
                        className={`medium ${
                          languageVariable === "ar" && "dir-rtl"
                        } text-[13px] text-[#A28E5B] flex whitespace-nowrap `}
                      >
                        {translate("Total Discount")}{" "}
                        <span className="bold text-[#A28E5B] ">
                          {getDiscount()}%
                        </span>
                      </span>
                      <span className="regular text-[11px] text-[#A28E5B]">
                        {translate("Click To Show All Discount")}
                      </span>
                    </div>
                  </div>

                  <span className="ml-[5px] bold  text-[13px] pr-[13px] text-[#A28E5B]">
                    {cart.total_discount_on_product} {currency_symbol.symbol}
                  </span>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-2 rounded-[12px] pt-1">
                  <div className="flex-row pl-[12px]">
                    <span className="flex-row translate-y-[3px]">
                      <GiftIcon />
                    </span>{" "}
                    <div className="flex-col pl-1 text-[#5BA260]">
                      <span className="medium text-[13px] text-[#5BA260]">
                        {translate("Gift")}
                      </span>
                      <span className="regular text-[11px] text-[#5BA260]">
                        {translate("First Shopping")}
                      </span>
                    </div>
                  </div>

                  <span className="ml-[5px] bold  text-[13px] pr-[13px] text-[#5BA260]">
                    {-10} {currency_symbol.symbol}
                  </span>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-2 rounded-[12px] pt-1">
                  <div className="flex-row pl-[12px]">
                    <span className="flex-row translate-y-[3px]">
                      <ShippingIcon />
                    </span>{" "}
                    <div className="flex-col pl-1 text-[#5BA260]">
                      <span className="medium text-[13px] text-[#5BA260]">
                        {translate("Shipping")}
                      </span>
                      <span className="regular text-[11px] text-[#5BA260]">
                        {translate(
                          "Shipping Is Completely Free Without Any Extras"
                        )}
                      </span>
                    </div>
                  </div>

                  <span className="ml-[5px] bold  text-[13px] pr-[13px] text-[#5BA260]">
                    <span className="line-through">10</span>
                    {cart.total_shipping_cost} {currency_symbol.symbol}
                  </span>
                </div>
              </div>
            )}

            <div
              onClick={() => {
                setExpanded(!expanded);
              }}
              className={`${
                expanded ? "rounded-t-none" : ""
              } cursor-pointer flex-row items-center min-h-[50px] w-full justify-between  rounded-[12px] pt-1 bg-[#F8F8F8]`}
            >
              <div className="flex-row pl-[12px]">
                <div className="flex-col pl-4 text-[#1D1D1D]">
                  <span className="bold text-[13px] text-[#1D1D1D]">
                    {translate("Total")}
                  </span>
                  <span className="medium text-[11px] text-[#8D8D8D]">
                    {translate("All Inclusive Without Additions")}
                  </span>
                </div>
              </div>

              <span className="flex-row justify-center items-center ml-[5px] bold  text-[16px] pr-[13px] text-[#1D1D1D]">
                <span className="line-through regular mr-2">
                  {cart.sub_total}
                </span>{" "}
                {cart.total_cash} {currency_symbol?.symbol}
                <span className="ml-2">
                  <MenuIcon className={expanded && "rotate-180"} />
                </span>
              </span>
            </div>
          </div>
        )}
        <div
          className={`flex-row w-full px-5 `}
          style={{
            boxShadow: "#0000001a 0px -3px 10px",
            paddingBlock: "calc(20px + env(safe-area-inset-bottom))",
          }}
        >
          <div
            className={`${
              loading && "opacity-55"
            } cursor-pointer  flex-col w-full  ${
              option ? "h-[200px]" : "bg-[#3C3C3C] h-[70px]"
            } rounded-[20px] text-center justify-center items-center`}
            style={{
              boxShadow:
                "inset 0px 3px 6px rgba(255,255,255,0.16), 0px 3px 6px rgba(0,0,0,0.1)",
            }}
            onClick={() => {
              if (cart.cart.length === 0) {
                close();
              } else {
                if (!getUser()) {
                  setOption(true);
                } else {
                  GoToOrders();
                }
              }
            }}
          >
            <>
              {option ? (
                <>
                  <ConfirmMobile
                    hasMobile={localStorage.getItem("has-phone")}
                    closeWindow={() => {
                      setOption(false);
                    }}
                  />
                </>
              ) : (
                <>
                  {" "}
                  {cart.cart.length === 0 ? (
                    <>
                      <span className="text-[#FEFEFE] text-[18px] medium ">
                        {translate("Back To HomePage", GetAppLanguage())}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#FEFEFE] text-[18px] medium ">
                        {translate("Confirm And Continue", GetAppLanguage())}
                      </span>
                      <span
                        className={`text-[#FEFEFE] text-[14px] medium ${
                          GetAppLanguage() === "ar" && "dir-rtl"
                        } `}
                      >
                        {cart.cart.length} {translate("items")}{" "}
                        {cart.total_cash} {currency_symbol?.symbol}
                      </span>
                    </>
                  )}
                </>
              )}
            </>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderButton;
