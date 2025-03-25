import { useEffect, useRef } from "react";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import "styles/sizeSlider.css";
import { useDispatch, useSelector } from "react-redux";
import { Sendevent, translateFunction } from "utils/functions";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Swiper as SwiperType } from "node_modules/swiper/types";
function SelectSize({ sizes, variants }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const activeSize = useSelector(
    (state: StateInterface) => state.cart.AddToCartOption.selectedSize
  );
  const SelectedProduct = useSelector(
    (state: StateInterface) => state.cart.SelectedProduct
  );
  const activeColor = useSelector(
    (state: StateInterface) => state.cart.AddToCartOption.selectedColor
  );
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setActive = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("size", e.name);
    router.push(pathname + `?${newParams.toString()}`, {
      scroll: false,
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      shallow: true,
    });
    dispatch({ type: "AddToCartSize", payload: e });
    Sendevent({ event: "button_clicked", value: "slide_choose_size_event" });
  };

  const getVariants = (e?: any | undefined | null) => {
    let variations = SelectedProduct.variation ?? variants;
    let variant = (e
      ? variations.filter((s) => {
          let size = s.type.split("-")[1] || s.type.split("-")[0];
          return s.type.includes(activeColor?.color_name || "") && size === e;
        })[0]
      : variations.filter((s) => {
          let size = s.type.split("-")[1] || s.type.split("-")[0];
          return (
            s.type.includes(activeColor?.color_name || "") &&
            activeSize?.name === size
          );
        })[0]) || { qty: SelectedProduct.current_stock };

    if (variant) {
      if (variant.qty === 0) return 0;
      else {
        if (variant.qty <= 10) return variant.qty;
        else return 100;
      }
    }
    return 0;
  };

  return (
    <div className="flex-col items-center justify-center pt-[20px] w-full h-[235px] regular text-[14px] text-[#505050] pl-5 pr-5">
      <div className="flex-row items-center">
        <svg
          id="Group_3644"
          data-name="Group 3644"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
        >
          <g id="Group_3124" data-name="Group 3124">
            <path
              id="Path_14086"
              data-name="Path 14086"
              d="M40.323,15.228c3.864,0,6.778-1.388,6.778-3.228v3.873c0,1.84-2.915,3.228-6.778,3.228H40V15.224C40.107,15.228,40.213,15.228,40.323,15.228Z"
              transform="translate(-27.424 -8.453)"
              fill="#e6e9ed"
            />
            <path
              id="Path_14087"
              data-name="Path 14087"
              d="M12.974,22h1.291v3.873H6.984A3.007,3.007,0,0,0,3.937,29.1l-.055.1A3.876,3.876,0,0,1,5.873,22h7.1Z"
              transform="translate(-1.677 -15.228)"
              fill="#e6e9ed"
            />
            <path
              id="Path_14089"
              data-name="Path 14089"
              d="M35.582,8.228c1.448,0,2.582-.709,2.582-1.614S37.03,5,35.582,5,33,5.709,33,6.614,34.134,8.228,35.582,8.228Zm0-2.582c1.141,0,1.937.51,1.937.968s-.8.968-1.937.968-1.937-.51-1.937-.968S34.441,5.646,35.582,5.646Z"
              transform="translate(-22.68 -3.709)"
              fill="#404040"
            />
            <path
              id="Path_14090"
              data-name="Path 14090"
              d="M13.9,1c-4.112,0-7.1,1.492-7.1,3.548v2.9H5.194A4.2,4.2,0,0,0,1,11.645v3.871A4.2,4.2,0,0,0,5.194,19.71H9.42A1.616,1.616,0,0,0,11,21h5.484a1.292,1.292,0,0,0,1.29-1.29V15.194a1.292,1.292,0,0,0-1.29-1.29H11a1.616,1.616,0,0,0-1.58,1.29H5.194a3.521,3.521,0,0,1-1.61-.39A2.686,2.686,0,0,1,6.3,11.968h7.6c4.112,0,7.1-1.492,7.1-3.548V4.548C21,2.492,18.015,1,13.9,1Zm0,.645c3.618,0,6.452,1.275,6.452,2.9s-2.834,2.9-6.452,2.9-6.452-1.275-6.452-2.9S10.285,1.645,13.9,1.645ZM7.452,6.095A5.35,5.35,0,0,0,9.675,7.452H7.452ZM1.645,15.516V13.87a4.191,4.191,0,0,0,3.226,1.953v1.307h.645v-1.29h.645v1.29h.645v-1.29h.645v2.581H8.1V15.839h.645v1.29h.645v-1.29h.645v1.29h.645v-1.29h1.29v3.226H5.194A3.553,3.553,0,0,1,1.645,15.516Zm9.677-.645a.323.323,0,0,1,.645,0v.323h-.645Zm0,5.161V19.71h.645v.323a.323.323,0,0,1-.645,0Zm-1.231-.323h.586v.323a.949.949,0,0,0,.045.277A.966.966,0,0,1,10.092,19.71Zm7.037-4.516V19.71a.646.646,0,0,1-.645.645h-3.93a.957.957,0,0,0,.059-.323V14.871a.957.957,0,0,0-.059-.323h3.93A.646.646,0,0,1,17.129,15.194Zm-6.406-.6a.949.949,0,0,0-.045.277v.323h-.586A.966.966,0,0,1,10.723,14.594Zm9.632-6.175c0,1.628-2.834,2.9-6.452,2.9H6.3A3.259,3.259,0,0,0,2.963,14.4,3.543,3.543,0,0,1,4.226,8.234V9.387h.645V8.113c.106-.01.214-.016.323-.016h.323v2.581h.645V8.1h.645v1.29h.645V8.1H8.1v1.29h.645V8.1h.645v2.581h.645V8.1h.645v1.29h.645V8.1h.645v1.29h.645V8.1h.645v2.581H13.9V8.1c.219,0,.433-.006.645-.015V9.387h.645V8.042c.22-.018.435-.041.645-.067V9.387h.645V7.877a6.818,6.818,0,0,0,3.871-1.782Z"
              transform="translate(-1 -1)"
              fill="#404040"
            />
            <path
              id="Path_14091"
              data-name="Path 14091"
              d="M45,47h.646v3.228H45Z"
              transform="translate(-30.806 -32.164)"
              fill="#404040"
            />
            <path
              id="Path_14092"
              data-name="Path 14092"
              d="M41,47h.646v3.228H41Z"
              transform="translate(-28.097 -32.164)"
              fill="#404040"
            />
          </g>
        </svg>

        <span className="ml-[10px]">
          {translate("Please Select The Appropriate")}{" "}
          <span className="medium ml-1"> {translate("Size")}</span>
        </span>
      </div>
      <div className="flex-row h-[96px] w-full max-w-[420px] min-w-[420px] relative">
        <SelectSizeSlider
          getVariants={(e) => getVariants(e)}
          sizes={sizes}
          setActive={(e) => setActive(e)}
        />
      </div>
      {getVariants() === 0 ? (
        <div className="flex-row items-center text-[12px] text-[#FF5F61] mt-[9px] medium [&>span]:ml-1">
          <span>
            {translateFunction("Not Available Now, Stock Is Sold Out")}{" "}
          </span>
        </div>
      ) : (
        <>
          {/* @ts-ignore */}
          {SelectedProduct.collected_after_ordering !== 1 && (
            <div
              className={
                languageVariable === "ar"
                  ? "flex-row-rev items-center text-[12px] text-[#404040] mt-[9px] regular [&>span]:ml-1"
                  : "flex-row items-center text-[12px] text-[#404040] mt-[9px] regular [&>span]:ml-1"
              }
            >
              <span className="bold">M</span>
              <span> {translate("Recommended")} </span>
              <span className="bold">{translate("Size")} </span>
              <span> {translate("For You")} </span>
              {getVariants() < 10 && (
                <>
                  <span className="text-[#FFAF5F]">{translate("Last")} </span>
                  <span className="text-[#FFAF5F] meduim">{getVariants()}</span>
                </>
              )}
            </div>
          )}
        </>
      )}
      <div className="flex-row w-full mt-[10px]">
        <div className="flex bg-[#F8F8F8] rounded-[20px] h-[50px] text-[12px] text-[#505050] items-center justify-center w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <g
              id="Group_3656"
              data-name="Group 3656"
              transform="translate(-9.32)"
            >
              <g
                id="Group_3653"
                data-name="Group 3653"
                transform="translate(9.32)"
              >
                <g id="Group_3130" data-name="Group 3130">
                  <g id="Group_3129" data-name="Group 3129">
                    <g id="Group_3128" data-name="Group 3128">
                      <g id="Group_3127" data-name="Group 3127">
                        <g id="Group_3126" data-name="Group 3126">
                          <g id="Group_3125" data-name="Group 3125">
                            <g id="Group_3124" data-name="Group 3124">
                              <g
                                id="Group_712"
                                data-name="Group 712"
                                transform="translate(8.172 12.564)"
                              >
                                <path
                                  id="Path_14078"
                                  data-name="Path 14078"
                                  d="M34,42h5.311a1.061,1.061,0,0,1,1.062,1.062v4.957a1.061,1.061,0,0,1-1.062,1.062H34a.71.71,0,0,0,.708-.708V42.708A.713.713,0,0,0,34,42Z"
                                  transform="translate(-31.875 -42)"
                                  fill="#95ffe1"
                                />
                                <path
                                  id="Path_14079"
                                  data-name="Path 14079"
                                  d="M29.416,42.708v.708H28A1.416,1.416,0,0,1,29.416,42h.708A.71.71,0,0,0,29.416,42.708Z"
                                  transform="translate(-28 -42)"
                                  fill="#95ffe1"
                                />
                                <path
                                  id="Path_14080"
                                  data-name="Path 14080"
                                  d="M29.416,58.708a.713.713,0,0,0,.708.708h-.708A1.416,1.416,0,0,1,28,58h1.416Z"
                                  transform="translate(-28 -52.335)"
                                  fill="#95ffe1"
                                />
                              </g>
                              <path
                                id="Path_14081"
                                data-name="Path 14081"
                                d="M33.416,58v.708a.71.71,0,0,1-.708.708A.713.713,0,0,1,32,58.708V58Z"
                                transform="translate(-22.067 -39.77)"
                                fill="#37bc9b"
                              />
                              <path
                                id="Path_14082"
                                data-name="Path 14082"
                                d="M33.416,42.708v.708H32v-.708A.71.71,0,0,1,32.708,42a.713.713,0,0,1,.708.708Z"
                                transform="translate(-22.067 -28.863)"
                                fill="#37bc9b"
                              />
                              <path
                                id="Path_14083"
                                data-name="Path 14083"
                                d="M25.541,46h1.416v4.249H22V46h3.541Z"
                                transform="translate(-15.419 -32.019)"
                                fill="#ccd1d9"
                              />
                              <path
                                id="Path_14084"
                                data-name="Path 14084"
                                d="M7.665,38.249H9.082V42.5H6.249A4.248,4.248,0,0,1,2,38.249V34a4.243,4.243,0,0,0,4.249,4.249Z"
                                transform="translate(-1.646 -24.269)"
                                fill="#ccd1d9"
                              />
                              <path
                                id="Path_14085"
                                data-name="Path 14085"
                                d="M20,12c0,1.962,3.02,3.456,7.082,3.537v0H20Z"
                                transform="translate(-14.156 -8.518)"
                                fill="#fcd770"
                              />
                              <path
                                id="Path_14086"
                                data-name="Path 14086"
                                d="M40.354,15.541c4.238,0,7.436-1.523,7.436-3.541v4.249c0,2.018-3.2,3.541-7.436,3.541H40V15.537C40.117,15.541,40.234,15.541,40.354,15.541Z"
                                transform="translate(-28.145 -8.642)"
                                fill="#e6e9ed"
                              />
                              <path
                                id="Path_14087"
                                data-name="Path 14087"
                                d="M14.039,22h1.416v4.249H7.467A3.3,3.3,0,0,0,4.125,29.79l-.06.106A4.252,4.252,0,0,1,6.249,22h7.79Z"
                                transform="translate(-1.646 -15.597)"
                                fill="#e6e9ed"
                              />
                              <path
                                id="Path_14088"
                                data-name="Path 14088"
                                d="M27.436,2c4.238,0,7.436,1.523,7.436,3.541s-3.2,3.541-7.436,3.541c-.12,0-.237,0-.354,0C23.02,9,20,7.5,20,5.541,20,3.523,23.2,2,27.436,2Z"
                                transform="translate(-15.226 -1.646)"
                                fill="#95ffe1"
                              />
                              <ellipse
                                id="Ellipse_98"
                                data-name="Ellipse 98"
                                cx="3.023"
                                cy="0.605"
                                rx="3.023"
                                ry="0.605"
                                transform="translate(9.546 2.606)"
                                fill="#37bc9b"
                              />
                              <path
                                id="Path_14089"
                                data-name="Path 14089"
                                d="M35.833,8.541c1.588,0,2.833-.778,2.833-1.77S37.421,5,35.833,5,33,5.778,33,6.77,34.244,8.541,35.833,8.541Zm0-2.833c1.252,0,2.124.56,2.124,1.062s-.872,1.062-2.124,1.062-2.125-.56-2.125-1.062S34.581,5.708,35.833,5.708Z"
                                transform="translate(-23.029 -3.584)"
                                fill="#404040"
                              />
                              <path
                                id="Path_14090"
                                data-name="Path 14090"
                                d="M13.9,1c-4.112,0-7.1,1.492-7.1,3.548v2.9H5.194A4.2,4.2,0,0,0,1,11.645v3.871A4.2,4.2,0,0,0,5.194,19.71H9.42A1.616,1.616,0,0,0,11,21h5.484a1.292,1.292,0,0,0,1.29-1.29V15.194a1.292,1.292,0,0,0-1.29-1.29H11a1.616,1.616,0,0,0-1.58,1.29H5.194a3.521,3.521,0,0,1-1.61-.39A2.686,2.686,0,0,1,6.3,11.968h7.6c4.112,0,7.1-1.492,7.1-3.548V4.548C21,2.492,18.015,1,13.9,1Zm0,.645c3.618,0,6.452,1.275,6.452,2.9s-2.834,2.9-6.452,2.9-6.452-1.275-6.452-2.9S10.285,1.645,13.9,1.645ZM7.452,6.095A5.35,5.35,0,0,0,9.675,7.452H7.452ZM1.645,15.516V13.87a4.191,4.191,0,0,0,3.226,1.953v1.307h.645v-1.29h.645v1.29h.645v-1.29h.645v2.581H8.1V15.839h.645v1.29h.645v-1.29h.645v1.29h.645v-1.29h1.29v3.226H5.194A3.553,3.553,0,0,1,1.645,15.516Zm9.677-.645a.323.323,0,0,1,.645,0v.323h-.645Zm0,5.161V19.71h.645v.323a.323.323,0,0,1-.645,0Zm-1.231-.323h.586v.323a.949.949,0,0,0,.045.277A.966.966,0,0,1,10.092,19.71Zm7.037-4.516V19.71a.646.646,0,0,1-.645.645h-3.93a.957.957,0,0,0,.059-.323V14.871a.957.957,0,0,0-.059-.323h3.93A.646.646,0,0,1,17.129,15.194Zm-6.406-.6a.949.949,0,0,0-.045.277v.323h-.586A.966.966,0,0,1,10.723,14.594Zm9.632-6.175c0,1.628-2.834,2.9-6.452,2.9H6.3A3.259,3.259,0,0,0,2.963,14.4,3.543,3.543,0,0,1,4.226,8.234V9.387h.645V8.113c.106-.01.214-.016.323-.016h.323v2.581h.645V8.1h.645v1.29h.645V8.1H8.1v1.29h.645V8.1h.645v2.581h.645V8.1h.645v1.29h.645V8.1h.645v1.29h.645V8.1h.645v2.581H13.9V8.1c.219,0,.433-.006.645-.015V9.387h.645V8.042c.22-.018.435-.041.645-.067V9.387h.645V7.877a6.818,6.818,0,0,0,3.871-1.782Z"
                                transform="translate(-1 -1)"
                                fill="#404040"
                              />
                              <path
                                id="Path_14091"
                                data-name="Path 14091"
                                d="M45,47h.708v3.541H45Z"
                                transform="translate(-30.852 -32.665)"
                                fill="#404040"
                              />
                              <path
                                id="Path_14092"
                                data-name="Path 14092"
                                d="M41,47h.708v3.541H41Z"
                                transform="translate(-28.139 -32.665)"
                                fill="#404040"
                              />
                            </g>
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>

          <span className="ml-[10px]">
            {translate("Need Help Finding Your Size?")}
          </span>
        </div>
        <div className="flex bg-[#F8F8F8] rounded-[20px] ml-[10px] h-[50px] items-center justify-center w-[69px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <g
              id="Mask_Group_370"
              data-name="Mask Group 370"
              clipPath="url(#clipPath)"
            >
              <g id="settings">
                <g id="Group_11210" data-name="Group 11210">
                  <ellipse
                    id="Ellipse_268"
                    data-name="Ellipse 268"
                    cx="2.969"
                    cy="2.93"
                    rx="2.969"
                    ry="2.93"
                    transform="translate(7.031 7.051)"
                    fill="#8d8d8d"
                  />
                  <path
                    id="Path_21474"
                    data-name="Path 21474"
                    d="M17.07,8.223h-.035A1.1,1.1,0,0,1,16,7.521a1.143,1.143,0,0,1,.263-1.274.586.586,0,0,0,0-.824L14.6,3.766a.636.636,0,0,0-.854.025,1.1,1.1,0,0,1-1.231.239,1.168,1.168,0,0,1-.754-1.08.586.586,0,0,0-.586-.586H8.828a.617.617,0,0,0-.586.621A1.134,1.134,0,0,1,7.5,4.024a1.147,1.147,0,0,1-1.273-.263.585.585,0,0,0-.824,0L3.746,5.423a.617.617,0,0,0,.025.854A1.1,1.1,0,0,1,4.01,7.507a1.141,1.141,0,0,1-1.08.715.586.586,0,0,0-.586.586v2.344a.617.617,0,0,0,.621.586,1.1,1.1,0,0,1,1.039.7,1.142,1.142,0,0,1-.263,1.273.586.586,0,0,0,0,.824L5.4,16.2a.636.636,0,0,0,.854-.025,1.093,1.093,0,0,1,1.231-.239,1.226,1.226,0,0,1,.754,1.119.586.586,0,0,0,.586.586h2.344a.617.617,0,0,0,.586-.621,1.186,1.186,0,0,1,.742-1.078,1.14,1.14,0,0,1,1.273.263.585.585,0,0,0,.824,0l1.657-1.657a.617.617,0,0,0-.025-.854,1.118,1.118,0,0,1-.24-1.23,1.151,1.151,0,0,1,1.081-.716.586.586,0,0,0,.586-.586V8.809a.586.586,0,0,0-.586-.586ZM10,14.082a4.1,4.1,0,1,1,4.141-4.1A4.14,4.14,0,0,1,10,14.082Z"
                    fill="#8d8d8d"
                  />
                </g>
                <path
                  id="Path_21475"
                  data-name="Path 21475"
                  d="M18.612,6.14a.586.586,0,0,0-.343.755,8.744,8.744,0,0,1,.559,3.086A8.825,8.825,0,0,1,3.735,16.2a.586.586,0,0,0-1,.414v1.658a.586.586,0,0,0,1.172,0V17.9A9.992,9.992,0,0,0,20,9.98a9.918,9.918,0,0,0-.633-3.5.588.588,0,0,0-.755-.343Z"
                  fill="#505050"
                />
                <path
                  id="Path_21476"
                  data-name="Path 21476"
                  d="M16.681,1.108a.612.612,0,0,0-.586.585v.372A10.026,10.026,0,0,0,0,9.98a9.918,9.918,0,0,0,.633,3.5.586.586,0,0,0,1.1-.412A8.744,8.744,0,0,1,1.172,9.98,8.848,8.848,0,0,1,16.263,3.769a.586.586,0,0,0,1-.413l0-1.661a.586.586,0,0,0-.585-.587Z"
                  fill="#505050"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default SelectSize;
const SelectSizeSlider = ({ sizes, setActive, getVariants }) => {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (searchParams.get("size")) {
      let size = sizes.filter((s) => s.name === searchParams.get("size"))[0];
      if (size) dispatch({ type: "AddToCartSize", payload: size });
    }
  }, []);
  const getInitial = () => {
    if (searchParams.get("size")) {
      let index = 0;
      sizes.map((s, i) => {
        if (s.name === searchParams.get("size")) index = i;
      });
      return index;
    }

    return 0;
  };
  const ref = useRef<SwiperRef>();
  return (
    <>
      <SliderRuler />
      <Swiper
        modules={[EffectCoverflow]}
        className=" size-slider-coverflow"
        speed={100}
        ref={ref}
        effect="coverflow"
        coverflowEffect={{
          rotate: 0,
          depth: 100,
          modifier: 0,
          scale: 1,
          stretch: 100,
          slideShadows: false,
        }}
        onSlideChange={(e) => {
          let searchParamsVar = {
            ...searchParams,
            size: sizes[e.activeIndex].name,
          };
          router.push(pathname + `?${searchParamsVar.toString()}`, {
            // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
            shallow: true,
          });

          setActive(sizes[e.activeIndex]);
        }}
        slidesPerView={7}
        threshold={1}
        centeredSlides={true}
        // onSlideChange={(swiper) => {
        //   setActiveColor({ ...colors[swiper.activeIndex], index: 0 });
        // }}

        loop={false}
        initialSlide={getInitial()}
      >
        {sizes.map((size, i) => (
          <SwiperSlide
            key={i}
            onClick={() => {
              // @ts-ignore
              ref.current.swiper.slideTo(i, 400, false);
              setActive(size);
            }}
            style={{
              overflow: "visible",
              minWidth: "70px",
              height: "70px",
            }}
            className={`${
              getVariants(size.name) === 0
                ? "red-bg"
                : getVariants(size.name) < 10
                ? "yellow-bg"
                : ""
            } flex-row items-center justify-center text-[30px] bold select-none flex`}
          >
            {size.name}
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
};
function SliderRuler() {
  return (
    <>
      <svg
        className="absolute top-0 left-0"
        xmlns="http://www.w3.org/2000/svg"
        width="405.298"
        height="8.3"
        viewBox="0 0 405.298 8.3"
      >
        <g
          id="Group_12681"
          data-name="Group 12681"
          transform="translate(-4.85 -642.85)"
        >
          <g
            id="Group_3645"
            data-name="Group 3645"
            transform="translate(5 643)"
          >
            <g id="Group_3093" data-name="Group 3093">
              <line
                id="Line_798"
                data-name="Line 798"
                y2="4.571"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799"
                data-name="Line 799"
                y2="4.571"
                transform="translate(6.079)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800"
                data-name="Line 800"
                y2="4.571"
                transform="translate(12.159)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801"
                data-name="Line 801"
                y2="4.571"
                transform="translate(18.238)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803"
                data-name="Line 803"
                y2="4.571"
                transform="translate(30.397)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804"
                data-name="Line 804"
                y2="4.571"
                transform="translate(36.476)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805"
                data-name="Line 805"
                y2="4.571"
                transform="translate(42.556)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802"
                data-name="Line 802"
                y2="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806"
                data-name="Line 806"
                y2="4.571"
                transform="translate(48.635)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3096"
              data-name="Group 3096"
              transform="translate(181.018)"
            >
              <line
                id="Line_798-2"
                data-name="Line 798"
                y2="4.571"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-2"
                data-name="Line 799"
                y2="4.571"
                transform="translate(6.079)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-2"
                data-name="Line 800"
                y2="4.571"
                transform="translate(12.159)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-2"
                data-name="Line 801"
                y2="4.571"
                transform="translate(18.238)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-2"
                data-name="Line 803"
                y2="4.571"
                transform="translate(30.397)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-2"
                data-name="Line 804"
                y2="4.571"
                transform="translate(36.476)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-2"
                data-name="Line 805"
                y2="4.571"
                transform="translate(42.556)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-2"
                data-name="Line 802"
                y2="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-2"
                data-name="Line 806"
                y2="4.571"
                transform="translate(48.635)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3097"
              data-name="Group 3097"
              transform="translate(242.658)"
            >
              <line
                id="Line_798-3"
                data-name="Line 798"
                y2="4.571"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-3"
                data-name="Line 799"
                y2="4.571"
                transform="translate(6.079)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-3"
                data-name="Line 800"
                y2="4.571"
                transform="translate(12.159)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-3"
                data-name="Line 801"
                y2="4.571"
                transform="translate(18.238)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-3"
                data-name="Line 803"
                y2="4.571"
                transform="translate(30.397)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-3"
                data-name="Line 804"
                y2="4.571"
                transform="translate(36.476)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-3"
                data-name="Line 805"
                y2="4.571"
                transform="translate(42.556)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-3"
                data-name="Line 802"
                y2="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-3"
                data-name="Line 806"
                y2="4.571"
                transform="translate(48.635)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3098"
              data-name="Group 3098"
              transform="translate(301.363)"
            >
              <line
                id="Line_798-4"
                data-name="Line 798"
                y2="4.571"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-4"
                data-name="Line 799"
                y2="4.571"
                transform="translate(6.079)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-4"
                data-name="Line 800"
                y2="4.571"
                transform="translate(12.159)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-4"
                data-name="Line 801"
                y2="4.571"
                transform="translate(18.238)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-4"
                data-name="Line 803"
                y2="4.571"
                transform="translate(30.397)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-4"
                data-name="Line 804"
                y2="4.571"
                transform="translate(36.476)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-4"
                data-name="Line 805"
                y2="4.571"
                transform="translate(42.556)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-4"
                data-name="Line 802"
                y2="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-4"
                data-name="Line 806"
                y2="4.571"
                transform="translate(48.635)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3094"
              data-name="Group 3094"
              transform="translate(58.703)"
            >
              <line
                id="Line_798-5"
                data-name="Line 798"
                y2="4.571"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-5"
                data-name="Line 799"
                y2="4.571"
                transform="translate(6.079)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-5"
                data-name="Line 800"
                y2="4.571"
                transform="translate(12.159)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-5"
                data-name="Line 801"
                y2="4.571"
                transform="translate(18.238)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-5"
                data-name="Line 803"
                y2="4.571"
                transform="translate(30.397)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-5"
                data-name="Line 804"
                y2="4.571"
                transform="translate(36.476)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-5"
                data-name="Line 805"
                y2="4.571"
                transform="translate(42.556)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-5"
                data-name="Line 802"
                y2="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-5"
                data-name="Line 806"
                y2="4.571"
                transform="translate(48.635)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3095"
              data-name="Group 3095"
              transform="translate(120.345)"
            >
              <line
                id="Line_798-6"
                data-name="Line 798"
                y2="4.571"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-6"
                data-name="Line 799"
                y2="4.571"
                transform="translate(6.079)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-6"
                data-name="Line 800"
                y2="4.571"
                transform="translate(12.159)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-6"
                data-name="Line 801"
                y2="4.571"
                transform="translate(18.238)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-6"
                data-name="Line 803"
                y2="4.571"
                transform="translate(30.397)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-6"
                data-name="Line 804"
                y2="4.571"
                transform="translate(36.476)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-6"
                data-name="Line 805"
                y2="4.571"
                transform="translate(42.556)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-6"
                data-name="Line 802"
                y2="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-6"
                data-name="Line 806"
                y2="4.571"
                transform="translate(48.635)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
          </g>
          <g
            id="Group_12680"
            data-name="Group 12680"
            transform="translate(361.363 643)"
          >
            <line
              id="Line_798-7"
              data-name="Line 798"
              y2="4.571"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_799-7"
              data-name="Line 799"
              y2="4.571"
              transform="translate(6.079)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_800-7"
              data-name="Line 800"
              y2="4.571"
              transform="translate(12.159)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_801-7"
              data-name="Line 801"
              y2="4.571"
              transform="translate(18.238)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_803-7"
              data-name="Line 803"
              y2="4.571"
              transform="translate(30.397)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_804-7"
              data-name="Line 804"
              y2="4.571"
              transform="translate(36.476)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_805-7"
              data-name="Line 805"
              y2="4.571"
              transform="translate(42.556)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_802-7"
              data-name="Line 802"
              y2="8"
              transform="translate(24.317)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_806-7"
              data-name="Line 806"
              y2="4.571"
              transform="translate(48.635)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
          </g>
        </g>
      </svg>
      <svg
        className="absolute bottom-0 left-0"
        xmlns="http://www.w3.org/2000/svg"
        width="405.298"
        height="8.3"
        viewBox="0 0 405.298 8.3"
      >
        <g
          id="Group_12682"
          data-name="Group 12682"
          transform="translate(0.15 0.15)"
        >
          <g id="Group_3645" data-name="Group 3645" transform="translate(0)">
            <g id="Group_3093" data-name="Group 3093">
              <line
                id="Line_798"
                data-name="Line 798"
                y1="4.571"
                transform="translate(0 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799"
                data-name="Line 799"
                y1="4.571"
                transform="translate(6.079 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800"
                data-name="Line 800"
                y1="4.571"
                transform="translate(12.159 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801"
                data-name="Line 801"
                y1="4.571"
                transform="translate(18.238 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803"
                data-name="Line 803"
                y1="4.571"
                transform="translate(30.397 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804"
                data-name="Line 804"
                y1="4.571"
                transform="translate(36.476 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805"
                data-name="Line 805"
                y1="4.571"
                transform="translate(42.556 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802"
                data-name="Line 802"
                y1="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806"
                data-name="Line 806"
                y1="4.571"
                transform="translate(48.635 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3096"
              data-name="Group 3096"
              transform="translate(181.018)"
            >
              <line
                id="Line_798-2"
                data-name="Line 798"
                y1="4.571"
                transform="translate(0 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-2"
                data-name="Line 799"
                y1="4.571"
                transform="translate(6.079 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-2"
                data-name="Line 800"
                y1="4.571"
                transform="translate(12.159 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-2"
                data-name="Line 801"
                y1="4.571"
                transform="translate(18.238 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-2"
                data-name="Line 803"
                y1="4.571"
                transform="translate(30.397 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-2"
                data-name="Line 804"
                y1="4.571"
                transform="translate(36.476 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-2"
                data-name="Line 805"
                y1="4.571"
                transform="translate(42.556 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-2"
                data-name="Line 802"
                y1="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-2"
                data-name="Line 806"
                y1="4.571"
                transform="translate(48.635 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3097"
              data-name="Group 3097"
              transform="translate(242.658)"
            >
              <line
                id="Line_798-3"
                data-name="Line 798"
                y1="4.571"
                transform="translate(0 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-3"
                data-name="Line 799"
                y1="4.571"
                transform="translate(6.079 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-3"
                data-name="Line 800"
                y1="4.571"
                transform="translate(12.159 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-3"
                data-name="Line 801"
                y1="4.571"
                transform="translate(18.238 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-3"
                data-name="Line 803"
                y1="4.571"
                transform="translate(30.397 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-3"
                data-name="Line 804"
                y1="4.571"
                transform="translate(36.476 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-3"
                data-name="Line 805"
                y1="4.571"
                transform="translate(42.556 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-3"
                data-name="Line 802"
                y1="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-3"
                data-name="Line 806"
                y1="4.571"
                transform="translate(48.635 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3098"
              data-name="Group 3098"
              transform="translate(301.363)"
            >
              <line
                id="Line_798-4"
                data-name="Line 798"
                y1="4.571"
                transform="translate(0 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-4"
                data-name="Line 799"
                y1="4.571"
                transform="translate(6.079 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-4"
                data-name="Line 800"
                y1="4.571"
                transform="translate(12.159 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-4"
                data-name="Line 801"
                y1="4.571"
                transform="translate(18.238 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-4"
                data-name="Line 803"
                y1="4.571"
                transform="translate(30.397 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-4"
                data-name="Line 804"
                y1="4.571"
                transform="translate(36.476 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-4"
                data-name="Line 805"
                y1="4.571"
                transform="translate(42.556 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-4"
                data-name="Line 802"
                y1="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-4"
                data-name="Line 806"
                y1="4.571"
                transform="translate(48.635 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3094"
              data-name="Group 3094"
              transform="translate(58.703)"
            >
              <line
                id="Line_798-5"
                data-name="Line 798"
                y1="4.571"
                transform="translate(0 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-5"
                data-name="Line 799"
                y1="4.571"
                transform="translate(6.079 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-5"
                data-name="Line 800"
                y1="4.571"
                transform="translate(12.159 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-5"
                data-name="Line 801"
                y1="4.571"
                transform="translate(18.238 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-5"
                data-name="Line 803"
                y1="4.571"
                transform="translate(30.397 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-5"
                data-name="Line 804"
                y1="4.571"
                transform="translate(36.476 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-5"
                data-name="Line 805"
                y1="4.571"
                transform="translate(42.556 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-5"
                data-name="Line 802"
                y1="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-5"
                data-name="Line 806"
                y1="4.571"
                transform="translate(48.635 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
            <g
              id="Group_3095"
              data-name="Group 3095"
              transform="translate(120.345)"
            >
              <line
                id="Line_798-6"
                data-name="Line 798"
                y1="4.571"
                transform="translate(0 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_799-6"
                data-name="Line 799"
                y1="4.571"
                transform="translate(6.079 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_800-6"
                data-name="Line 800"
                y1="4.571"
                transform="translate(12.159 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_801-6"
                data-name="Line 801"
                y1="4.571"
                transform="translate(18.238 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_803-6"
                data-name="Line 803"
                y1="4.571"
                transform="translate(30.397 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_804-6"
                data-name="Line 804"
                y1="4.571"
                transform="translate(36.476 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_805-6"
                data-name="Line 805"
                y1="4.571"
                transform="translate(42.556 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_802-6"
                data-name="Line 802"
                y1="8"
                transform="translate(24.317)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
              <line
                id="Line_806-6"
                data-name="Line 806"
                y1="4.571"
                transform="translate(48.635 3.429)"
                fill="none"
                stroke="#505050"
                strokeLinecap="round"
                strokeWidth="0.3"
              />
            </g>
          </g>
          <g
            id="Group_12680"
            data-name="Group 12680"
            transform="translate(356.363)"
          >
            <line
              id="Line_798-7"
              data-name="Line 798"
              y1="4.571"
              transform="translate(0 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_799-7"
              data-name="Line 799"
              y1="4.571"
              transform="translate(6.079 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_800-7"
              data-name="Line 800"
              y1="4.571"
              transform="translate(12.159 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_801-7"
              data-name="Line 801"
              y1="4.571"
              transform="translate(18.238 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_803-7"
              data-name="Line 803"
              y1="4.571"
              transform="translate(30.397 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_804-7"
              data-name="Line 804"
              y1="4.571"
              transform="translate(36.476 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_805-7"
              data-name="Line 805"
              y1="4.571"
              transform="translate(42.556 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_802-7"
              data-name="Line 802"
              y1="8"
              transform="translate(24.317)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
            <line
              id="Line_806-7"
              data-name="Line 806"
              y1="4.571"
              transform="translate(48.635 3.429)"
              fill="none"
              stroke="#505050"
              strokeLinecap="round"
              strokeWidth="0.3"
            />
          </g>
        </g>
      </svg>
    </>
  );
}
