"use client";

import { BuyButtonPropsType } from "models/componentType/BuyButtonPropsType";
import { useParams } from "next/navigation";
import LocalizationServiceClass from "services/localization";
import { dispatchRouteChangeEvent } from "utils/events";
import { translateFunction } from "utils/functions";

function BuyButton({ buy }: BuyButtonPropsType) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <>
      <div
        className="buy-button text-[#414141] light-text flex align-start justify-start cursor-pointer absolute z-[50] bottom-0 right-[10px] h-[40px] items-center"
        data-cy="buy-button"
        onClick={(e) => {
          e.preventDefault();
          buy();
        }}
      >
        <span className="text-[10px] pt-[2px] flex align-start">
          {translate("Buy", LocalizationServiceClass.GetAppLanguage())}
        </span>
        <img
          src={"/svg/BuyButton.svg"}
          width={15}
          height={15}
          alt="buy Button"
          className="max-h-[20px] max-w-[40px] ml-[8px]"
        />
      </div>
    </>
  );
}

export default BuyButton;
