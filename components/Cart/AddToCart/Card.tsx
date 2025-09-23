import Image from "next/image";
import { useParams } from "node_modules/next/navigation";
import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import { RoundPrice, translateFunction } from "utils/functions";
import { fetchCountries } from "utils/tinyUtils";

function Card({
  image,
  shouldShowOrangeBorder,
  brandImabge,
  name,
  shippingDays,
  offer_price,
  price,
  redeem_price,
}) {
  const [countries, setCountries] = useState([]);
  const getCountries = async () => {
    let data = await fetchCountries(country, language);
    setCountries(data.countries);
  };
  let { lang } = useParams();
  const [country, language] = (lang as string).split("-");
  useEffect(() => {
    getCountries();
  }, []);
  return (
    <div className="flex flex-row justify-start items-start gap-[12px] h-full max-h-[170px] px-[12px]">
      <div className="w-[123px] h-[170px] flex relative">
        <Image
          src={image}
          width={123}
          height={170}
          alt="product-image"
          className="w-full h-full rounded-[15px] shadow-[0px_0px_10px_rgba(0,0,0,0.1)] "
        />
        <div className="absolute w-full h-full rounded-[15px] shadow-[inset_0px_3px_6px_rgb(255,255,255,0.5)] z-20" />
        <ImageBorder isOrange={shouldShowOrangeBorder} />
      </div>
      <div className="flex flex-col  items-start pt-[8px] h-[170px] justify-between">
        <div className="flex flex-col justify-start items-start gap-[3px]">
          <div className="flex items-center flex-row">
            <Image
              src={brandImabge}
              alt="brand"
              height={8}
              width={30}
              className="w-auto max-h-[8px]"
            />
          </div>
          {/*  */}
          <div className="flex flex-row items-center regular text-[#1D1D1D] text-[11px]">
            {name}
          </div>
          {/*  */}
          <div className="flex flex-row regular gap-[4px] text-[10px] items-center">
            <span>
              <Image
                src={"/svg/addtocart/DeleiverIcon.svg"}
                width={13}
                height={13}
                alt="deleivery-icon"
              />
            </span>
            <span className="text-[#8D8D8D]">
              {translateFunction("Shipping", language)}:
            </span>
            <span className="medium text-[#505050]">
              {shippingDays} {translateFunction("Days", language)}
            </span>
            <span className="text-[#505050] underline cursor-pointer">
              {translateFunction("Details", language)}
            </span>
          </div>
          {/*  */}
          <div className="flex flex-row regular text-[10px] items-center gap-[4px]">
            <span>
              <Image
                src={"/svg/addtocart/DeleiveryManIcon.svg"}
                alt="deleivery-icon"
                width={13}
                height={13}
              />
            </span>
            <span className="text-[#388CFF]">
              {translateFunction("Today Shipping", language)}
            </span>
            <span className="regular text-[#8D8D8D]">
              {translateFunction("If Buy Before", language)}
            </span>
            <span className="text-[#1d1d1d] medium">13:00</span>
            <span className="text-[#8d8d8d]">
              {translateFunction("Today", language)}
            </span>
          </div>
          {/*  */}
          <div className="flex flex-row regular text-[10px] items-center gap-[4px]">
            <span>
              <Image
                src={"/svg/addtocart/TwoManDeleivery.svg"}
                alt="deleivery-icon"
                width={13}
                height={13}
              />
            </span>
            <span className="text-[#1d1d1d] gap-[3px] flex items-center">
              {translateFunction("At Your Address In", language)}
              <span>
                {countries?.length &&
                  translateFunction(
                    countries?.find((s) => s.iso?.toLowerCase() === country)
                      ?.name,
                    language
                  )}
              </span>
            </span>
            <span className="medium text-[#1d1d1d]">
              {translateFunction("Monday", language)}
            </span>
            <span className="text-[#1d1d1d] bold">2.Jun</span>
            <span className="text-[#8d8d8d]">{/*Delevery Gurante Icon */}</span>
          </div>
          {/*  */}
          <div className="flex flex-row regular text-[9px] items-center gap-[3px] text-[#1D1D1D]">
            <span className="">{translateFunction("Get a")}</span>
            <span className="text-[#388CFF]">
              25% {translateFunction("Refund")}
            </span>
            <span>
              {translateFunction("Of The Product Price If Shipping Is Delayed")}
            </span>
          </div>
        </div>
        <div className="flex flex-col text-[#1d1d1d] items-start">
          <Prices
            offer_price={offer_price}
            price={price}
            redeem_price={redeem_price}
          />
          <div className="flex items-center text-[10px] regular">
            {translateFunction("All Inclusive Without Additions", language)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;

const ImageBorder = ({ isOrange = false }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="123"
      height="170"
      className="absolute top-0 left-0"
    >
      <rect
        x="0.25"
        y="0.25"
        width="122.5"
        height="169.5"
        fill="none"
        stroke={isOrange ? "#FF6200" : "#fcfcfc"}
        strokeWidth="0.5"
        rx="14.75"
      />
    </svg>
  );
};

const Prices = ({ offer_price, price, redeem_price }) => {
  const { currency } = useAppStore();
  if (redeem_price && redeem_price > 0) {
    if (price === offer_price) {
      return (
        <div className="flex flex-row items-center gap-[4px] regular text-[13px] text-[#1d1d1d]">
          <span className="relative text-[#C4C2C2]">
            <svg
              data-cy="product_addtocart_svg"
              className="top-1/2 left-0 absolute"
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
            {RoundPrice({ num: offer_price, rate: currency?.exchange_rate })}
          </span>
          <span className="relative bold">
            {RoundPrice({ num: redeem_price, rate: currency?.exchange_rate })}
          </span>
          <span>{currency?.symbol}</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-row items-center gap-[4px] regular text-[13px] text-[#1d1d1d]">
          <span className="relative text-[#C4C2C2]">
            <svg
              data-cy="product_addtocart_svg"
              className="top-1/2 left-0 absolute"
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
            {RoundPrice({ num: price, rate: currency?.exchange_rate })}
          </span>
          <span className="relative text-[#C4C2C2]">
            <svg
              data-cy="product_addtocart_svg"
              className="top-1/2 left-0 absolute"
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
            {RoundPrice({ num: offer_price, rate: currency?.exchange_rate })}
          </span>
          <span className="relative bold">
            {RoundPrice({ num: redeem_price, rate: currency?.exchange_rate })}
          </span>
          <span>{currency?.symbol}</span>
        </div>
      );
    }
  } else {
    if (price === offer_price) {
      return (
        <div className="flex flex-row items-center gap-[4px] regular text-[13px] text-[#1d1d1d]">
          <span className="relative text-[#1D1D1D] bold">
            {RoundPrice({ num: price, rate: currency?.exchange_rate })}
          </span>
          <span>{currency?.symbol}</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-row items-center gap-[4px] regular text-[13px] text-[#1d1d1d]">
          <span className="relative text-[#C4C2C2]">
            <svg
              data-cy="product_addtocart_svg"
              className="top-1/2 left-0 absolute"
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
            {RoundPrice({ num: price, rate: currency?.exchange_rate })}
          </span>
          <span className="relative text-[#1D1D1D] bold">
            {RoundPrice({ num: offer_price, rate: currency?.exchange_rate })}
          </span>
          <span>{currency?.symbol}</span>
        </div>
      );
    }
  }
  return <></>;
};
