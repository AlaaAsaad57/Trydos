"use client";
import { useEffect, useState } from "react";
import ShippingIcon from "public/svg/product/ShippingIcon.svg";
import ShippingDollar from "public/svg/product/ShippingDollar.svg";
import FastIcon from "public/svg/product/FastIcon.svg";
import PlaneIcon from "public/svg/product/PlaneIcon.svg";
import PackingIcon from "public/svg/product/PackingIcon.svg";
import MarkerIcon from "public/svg/product/MarkerIcon.svg";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import Spinner from "components/global/Spinner";
import { formatTime } from "utils/tinyUtils";
import { useAppStore } from "store";
function ProductShippingOption({ days }) {
  const [countriesData, setCountries] = useState([]);
  const getCountries = async () => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + `/api/countries`,
        {
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_COUNTRIES),
            tags: ["countries"],
          },
        }
      );
      let data = await res.json();
      setCountries(data.countries);
      console.log({
        days,
        formatedTime: formatTime(
          new Date(
            new Date().getTime() + Number(days || 0) * 24 * 60 * 60 * 1000
          ).toString()
        ),
      });
    } catch (error) {
      console.log(error);
    }
  };
  let { lang } = useParams();
  // @ts-ignore
  let [countryIso, languageVariable] = lang.split("-");
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  useEffect(() => {
    getCountries();
  }, []);
  const [extended, setExtended] = useState(false);
  const { settings } = useAppStore();
  return (
    <div
      className={`product-shipping product-colors product-sizes flex-col align-start relative ${
        extended && "extended-address-bar"
      }`}
      data-cy="ProductShiping"
      onClick={() => {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.AT_YOUR_ADDRESS_BUTTON,
        // });
        setExtended(!extended);
      }}
    >
      <div className="colors-label flex-row align-center">
        <ShippingIcon />
        <span style={{ marginLeft: "5px" }}>
          {translate("Product Shipping & Delivery")}
        </span>
      </div>
      <div className="address-container flex-row justify-center align-center">
        <div
          className={
            languageVariable === "ar"
              ? "address-info flex-row-rev align-center justify-center"
              : "address-info flex-row align-center justify-center"
          }
        >
          {translate("At Your Address In")}
          <span className="uppercase">
            {countriesData?.length ? (
              countriesData?.find((s) => s.iso?.toLowerCase() === countryIso)
                ?.name
            ) : (
              <Spinner />
            )}
          </span>
          {translate("Expected Within")}
          <span>
            {(settings?.["starting-setting"]?.shipping_duration_days || 0) +
              days}
          </span>
          <span>{translate("Days")}</span>
        </div>
      </div>
      <div
        className={`extended-address-info flex-col ${
          extended && "enable-address-info"
        }`}
      >
        <div
          className="address-info-row flex-row align-center"
          data-cy="AddresInfo"
        >
          <PackingIcon />
          <div className="flex-col address-row-desc justify-center">
            <div className="flex-row align-center">
              <FastIcon />{" "}
              <span className="blue-address">
                {translate("Fast Packing & Start Shipping")}
              </span>
            </div>
            <span className="gray-address">
              {translate("Same Day Packing & Ship If Buy Before")}
              <span> 13:00 </span> {translate("Today")}
            </span>
          </div>
        </div>
        <div
          className="address-info-row flex-row align-center"
          data-cy="AddresInfo1"
        >
          <PlaneIcon />
          <div className="flex-col address-row-desc justify-center">
            <div className="flex-row align-center">
              <span className="blue-address uppercase">
                {formatTime(
                  new Date(
                    new Date().getTime() +
                      Number(days || 0) * 24 * 60 * 60 * 1000
                  ).toString()
                )}
                {","}
                {countriesData?.length ? (
                  countriesData?.find(
                    (s) => s.iso?.toLowerCase() === countryIso
                  )?.name
                ) : (
                  <Spinner />
                )}
              </span>
            </div>
            <span className="gray-address">
              {translate(
                "Time Is Expected, It May Take More Or Less Than 2 Days"
              )}
            </span>
          </div>
        </div>
        <div
          className="address-info-row flex-row align-center"
          data-cy="AddresInfo2"
        >
          <MarkerIcon />
          <div className="flex-col address-row-desc justify-center">
            <div className="flex-row align-center">
              <span className="blue-address">
                {formatTime(
                  new Date(
                    new Date().getTime() +
                      Number(days || 0) * 24 * 60 * 60 * 1000
                  ).toString()
                )}{" "}
                {translate("In Your Address")}
              </span>
            </div>
            <span className="gray-address">
              {translate("Specify Your Address To Calculate The Delivery Time")}
            </span>
          </div>
        </div>
      </div>
      <div className="green-label flex-row align-center" data-cy="GreenLabel">
        <div className="colors-label flex-row align-center ">
          <ShippingDollar />
          <span style={{ marginLeft: "20px" }}>
            {translate("You Will Get A")}
            <span> 25% </span> <span>{translate("Refund")}</span>{" "}
            {translate("Of The Product Price If Shipping Is Delayed")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductShippingOption;
