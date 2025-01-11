"use client";

import { useParams } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";
import { GetAppLanguage, translateFunction } from "utils/functions";

function BuyButton({ buy }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <div
      className="buy-button light-text flex align-start justify-start cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        buy();
        setTimeout(() => {
          dispatchRouteChangeEvent("completed");
        }, 1000);
      }}
    >
      <span className="f-10 flex align-start">
        {translate("Buy", GetAppLanguage())}
      </span>
      <img
        src={"/svg/BuyButton.svg"}
        width={15}
        height={15}
        alt="buy Button"
        className="max-h-[20px] max-w-[40px]"
      />
    </div>
  );
}

export default BuyButton;
