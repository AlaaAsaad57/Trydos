import BottomSheet from "components/global/BottomSheet";
import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

import { formatTimeForAddress, ShowDayStr } from "utils/tinyUtils";
import { useParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import ThinSepartor from "components/global/ThinSepartor";
import { GetCountries } from "serverRequests/product";
function ExpectedDeleiveryModal() {
  const [countriesData, setCountries] = useState([]);
  const { lang } = useParams();
  const [country, language] = (lang as string)?.split("-");
  const { ColorBottomSheet, setColorBottomSheet, settings, SelectedProduct } =
    useAppStore();
  const getCountries = async () => {
    try {
      if (sessionStorage.getItem(`countries-${country}-${language}`)) {
        let data = sessionStorage.getItem(`countries-${country}-${language}`);
        setCountries(JSON.parse(data));
      } else {
        const data = await GetCountries({ country, language });
        sessionStorage.setItem(
          `countries-${country}-${language}`,
          JSON.stringify(data),
        );
        setCountries(data);
      }
    } catch (error) {}
  };
  useEffect(() => {
    getCountries();
  }, []);

  const rating_arr = [
    { value: 1, days: 1 },
    { value: 3, days: 2 },
    { value: 70, days: 3 },
    { value: 18, days: 4 },
    { value: 1, days: 5 },
    { value: 1, days: 6 },
    { value: 1, days: 7 },
    { value: 1, days: 8 },
    { value: 1, days: 9 },
    { value: 1, days: 10 },
  ];
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      {ColorBottomSheet && ColorBottomSheet?.is_for_deleviery && (
        <BottomSheet
          height={90}
          isOpen={ColorBottomSheet?.is_for_deleviery}
          onClose={() => {
            setColorBottomSheet(false);
          }}
        >
          <div className="w-full px-[12px] h-auto pb-[80px] flex-col text-[#1d1d1d] regular text-[11px]">
            <div className="flex-col gap-[6px]">
              <img
                src="/icons/expectedDelevery.svg"
                className="w-[30px] h-[30px]"
              />
              <span className="flex text-[13px] text-[#1d1d1d] regular">
                {translateFunction(
                  "Expected Shipping & delivery Date",
                  language,
                )}
              </span>
              <span
                className={`text-[#1D1D1D] flex ${
                  isRtl && "dir-rtl"
                } text-[12px] regular mt-[3px] items-center pr-[4px]`}
              >
                <span className="pr-[4px]">
                  {ShowDayStr(
                    new Date(
                      new Date().getTime() +
                        Number(
                          (settings?.["starting-setting"]
                            ?.shipping_duration_days || 0) +
                            SelectedProduct?.shipping_days,
                        ) *
                          24 *
                          60 *
                          60 *
                          1000,
                    )?.getDay(),
                    language,
                  )}
                </span>
                <span className="bold text-[#1D1D1D] text-[12px]  px-[3px]">
                  {formatTimeForAddress(
                    new Date(
                      new Date().getTime() +
                        Number(
                          (settings?.["starting-setting"]
                            ?.shipping_duration_days || 0) +
                            SelectedProduct?.shipping_days,
                        ) *
                          24 *
                          60 *
                          60 *
                          1000,
                    ).toString(),
                  )}
                </span>{" "}
                |
                <span className="bold px-[3px]">
                  {(settings?.["starting-setting"]?.shipping_duration_days ||
                    0) + SelectedProduct?.shipping_days}{" "}
                  {translateFunction("Work Days")}{" "}
                </span>
                {translateFunction("At Your Address In", language)}
                <span className="capitalize px-[3px]">
                  {countriesData?.length ? (
                    countriesData?.find((s) => s.iso?.toLowerCase() === country)
                      ?.name
                  ) : (
                    <Skeleton width="100%" height="100%" borderRadius={16} />
                  )}
                </span>
              </span>
            </div>
            <ThinSepartor className="py-[11px]  w-full" />

            <div className="flex-row items-center gap-[4px] ">
              {translateFunction("Shipping Company")}
              <span className="bold">trydos</span>
            </div>
            <ThinSepartor className="py-[11px]   w-full" />
            <div className="flex-col gap-[12px]">
              <div className="inline">
                {translateFunction(
                  "Based On The Previous Delivery Statistics Below To Your Area, We Conclude That The Expected Delivery Time For Your Product Is",
                )}
                <span className="bold px-[3px]">
                  {(settings?.["starting-setting"]?.shipping_duration_days ||
                    0) + SelectedProduct?.shipping_days}
                  <span className="px-[3px]">{translateFunction("Days")}</span>
                </span>
              </div>
              <div className="flex-col w-full gap-[6px]">
                {rating_arr.map((s, i) => (
                  <ReviewProgress key={i} title={s.days} value={s.value} />
                ))}
              </div>
            </div>
            <ThinSepartor className="py-[11px]   w-full" />
            <div className="flex-col gap-[8px]">
              <img src="/icons/DelevieryGurantee.svg" />
              <div className="flex-col">
                <span className="bold">
                  {translateFunction("Delivery Guarantee", language)}
                </span>
                <span className="flex gap-[4px] mt-[5px]">
                  <img src="/icons/RefundIcon.svg" />
                  <p>
                    <span>{translateFunction("Get a")}</span>
                    <span className="text-[#388CFF] medium px-[4px]">25%</span>
                    {translateFunction(
                      "Refund Of The Product Price If Shipping Is Delayed",
                    )}
                  </p>
                </span>
                <span>
                  {translateFunction("If Delivered After")}
                  <span className="px-[4px]">
                    {ShowDayStr(
                      new Date(
                        new Date().getTime() +
                          Number(
                            (settings?.["starting-setting"]
                              ?.shipping_duration_days || 0) +
                              SelectedProduct?.shipping_days,
                          ) *
                            24 *
                            60 *
                            60 *
                            1000,
                      )?.getDay(),
                      language,
                    )}{" "}
                    |{" "}
                    {formatTimeForAddress(
                      new Date(
                        new Date().getTime() +
                          Number(
                            (settings?.["starting-setting"]
                              ?.shipping_duration_days || 0) +
                              SelectedProduct?.shipping_days,
                          ) *
                            24 *
                            60 *
                            60 *
                            1000,
                      ).toString(),
                    )}
                  </span>
                  {translateFunction(
                    "You Will Get 25 USD To Your Wallet Automatically",
                  )}
                </span>
              </div>
            </div>
            <div className="flex-col gap-[8px] mt-[10px]">
              <img src="/icons/GreenBigTruck.svg" />
              <div className="flex-col">
                <span className="bold">
                  {translateFunction("Free Shipping", language)}
                </span>
                <span>
                  {translateFunction(
                    "Shipping Is Completely Free Without Any Extras",
                    language,
                  )}
                </span>
              </div>
            </div>
            <div className="flex-col gap-[8px] mt-[10px]">
              <img src="/icons/ReturnGurantee.svg" />
              <div className="flex-col">
                <span className="bold">
                  {translateFunction("Delivery Guarantee", language)}
                </span>
                <span>
                  {translateFunction("within", language)}
                  <span className="px-[3px] bold">
                    {(settings?.["starting-setting"]?.shipping_duration_days ||
                      0) + SelectedProduct?.shipping_days}
                  </span>
                  <span>
                    {translateFunction(
                      "Days After Receiving The Product, You Can Return It Without Conditions Or Reasons With Complete Ease And Get The Amount Back",
                      language,
                    )}
                  </span>
                </span>
                <span className="flex gap-[4px] mt-[5px]">
                  <img src="/icons/RefundIcon.svg" />
                  <p>
                    <span>{translateFunction("Get a")}</span>
                    <span className="text-[#388CFF] medium px-[4px]">
                      {translateFunction("Full", language)}
                    </span>
                    {translateFunction("Product Price When Returned")}
                  </p>
                </span>
              </div>
            </div>
            <div className="flex-col gap-[8px] mt-[10px]">
              <img src="/icons/RedBigTruck.svg" />
              <div className="flex-col">
                <span className="bold">
                  {translateFunction("Free Return", language)}
                </span>
                <span>
                  {translateFunction(
                    "Return Is Completely Free Without Any Extras",
                    language,
                  )}
                </span>
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export default ExpectedDeleiveryModal;

const ReviewProgress = ({ value, title }) => {
  return (
    <div className="flex-row gap-[14px] min-w-[280px] w-full">
      <div className="flex-row  w-[75%] max-w-[75%] h-[14px] rounded-[5px] bg-[#FCFCFC] relative flex-1 ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="14"
          viewBox="0 0 100% 14"
          className="absolute top-0 left-0"
        >
          <rect
            x="0.25"
            y="0.25"
            width="calc(100%)"
            height="13.5"
            rx="2.25"
            fill="none"
            stroke="#d3d3d3"
            strokeWidth="0.5"
          />
        </svg>
        <div
          className={`h-[14px] rounded-[5px] flex bg-[#1d1d1d]`}
          style={{
            width: `${value}%`,
          }}
        />
      </div>
      <div className="flex-row items-center text-[#1d1d1d] text-[11px] regular gap-[6px] whitespace-nowrap w-[30px]">
        {value}%
      </div>
      <div className="flex-row gap-[3px] w-[40px]">
        <span className="bold">{title}</span>
        <span>{translateFunction("Days")}</span>
      </div>
    </div>
  );
};
