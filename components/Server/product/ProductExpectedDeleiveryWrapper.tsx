import React from "react";
import ExpectedIcon from "public/svg/expectedDelevery";
import { translateFunction } from "utils/server";
import { formatTimeForAddress, ShowDayStr } from "utils/tinyUtils";
import Skeleton from "react-loading-skeleton";
import ExpectedDeleiveryBanner from "components/products/ExpectedDeleiveryBanner";

async function ProductExpectedDeleiveryWrapper({
  language,
  globalPromise,
  country,
  StarttingSettingPromise,
}) {
  let [productData, starttingSetting] = await Promise.all([
    globalPromise,
    StarttingSettingPromise,
  ]);
  let countries = [
    {
      id: 103,
      phonecode: 964,
      iso: "IQ",
      name: "Iraq",
      longitude: "43.6848",
      latitude: "33.2209",
    },
    {
      id: 119,
      phonecode: 961,
      iso: "LB",
      name: "Lebanon",
      longitude: "35.4954",
      latitude: "33.8886",
    },
    {
      id: 208,
      phonecode: 963,
      iso: "SY",
      name: "Syria",
      longitude: "36.2783",
      latitude: "33.5104",
    },
    {
      id: 219,
      phonecode: 90,
      iso: "TR",
      name: "Turkey",
      longitude: "35.6667",
      latitude: "39.1667",
    },
  ];
  const isRtl = language === "ar" || language === "ku";
  return (
    <ExpectedDeleiveryBanner country={country} language={language}>
      <ExpectedIcon />
      <span className="flex-row gap-[12px] items-center">
        {translateFunction("Expected Delivery Date", language)}

        <svg
          id="Group_14553"
          data-name="Group 14553"
          xmlns="http://www.w3.org/2000/svg"
          width="9.996"
          height="9.996"
          viewBox="0 0 9.996 9.996"
        >
          <path
            id="Subtraction_1"
            data-name="Subtraction 1"
            d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
            transform="translate(0 1.969)"
            fill="#c4c2c2"
          />
          <path
            id="Path_21380"
            data-name="Path 21380"
            d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
            transform="translate(-0.332 0.375)"
            fill="#c4c2c2"
          />
          <rect
            id="Rectangle_4714"
            data-name="Rectangle 4714"
            width="9.61"
            height="9.996"
            transform="translate(0.386)"
            fill="none"
          />
        </svg>
      </span>
      <span
        className={`${
          isRtl && "dir-rtl"
        } w-max text-[#1D1D1D] text-[12px] regular mt-[3px] items-center flex  `}
      >
        <span className="pr-[4px]">
          {ShowDayStr(
            new Date(
              new Date().getTime() +
                Number(
                  (starttingSetting?.shipping_duration_days || 0) +
                    productData?.shipping_days
                ) *
                  24 *
                  60 *
                  60 *
                  1000
            )?.getDay(),
            language
          )}
        </span>
        <span className="bold text-[#1D1D1D] text-[12px]  mx-[1px]">
          {formatTimeForAddress(
            new Date(
              new Date().getTime() +
                Number(
                  (starttingSetting?.shipping_duration_days || 0) +
                    productData?.shipping_days
                ) *
                  24 *
                  60 *
                  60 *
                  1000
            ).toString(),
            language
          )}
        </span>{" "}
        |{" "}
        {(starttingSetting?.shipping_duration_days || 0) +
          productData?.shipping_days}{" "}
        {translateFunction("Work Days", language)}{" "}
        {translateFunction("At Your Address In", language)}
        <span className="capitalize px-[3px]">
          {countries?.length ? (
            countries?.find((s) => s.iso?.toLowerCase() === country)?.name
          ) : (
            <Skeleton width="100%" height="100%" borderRadius={16} />
          )}
        </span>
      </span>
    </ExpectedDeleiveryBanner>
  );
}

export default ProductExpectedDeleiveryWrapper;
