import React, { useState } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import OptionsIcon from "public/svg/OptionsIcon.svg";
import { translateFunction } from "utils/functions";

import ChatWidget from "components/Chat/ChatWidget";
import OrderOptions from "components/Orders/OrderOptions";
import { useAppStore } from "store";

function SettingTopBar({
  Save,
  hasOptions,
  screenName,
  goBack,
  Icon,
  DataCy,
}: {
  Save?: () => void;
  hasOptions?: boolean;
  screenName: string | React.ReactNode;
  goBack: () => void;
  Icon?: React.ReactNode;
  DataCy?: string;
  hasChat?: any;
}) {
  const { setOrderOptions } = useAppStore();

  return (
    <>
      <div className="flex-row w-full min-h-[50px] h-[50px] items-center px-[12px] justify-between">
        <span
          className="cursor-pointer"
          onClick={() => goBack()}
          data-cy={(DataCy && `${DataCy}-back-button`) || "back-button"}
        >
          <BackIcon />
        </span>
        <div className="flex-row">
          {Icon || <></>}
          <span
            className={`${
              Icon && "ml-[4px]"
            } text-[#1D1D1D] text-[14px] medium`}
          >
            {typeof screenName === "string"
              ? translateFunction(screenName)
              : screenName}
          </span>
        </div>
        <span
          className="cursor-pointer medium text-[#402CDD] text-[14px] flex-row"
          data-cy={DataCy || "save-button"}
          onClick={() => {
            if (Save) Save();
          }}
        >
          {Save && translateFunction("Save")}

          {hasOptions && (
            <>
              <OptionsIcon
                onClick={() => {
                  document.documentElement.style.overflow = "hidden";
                  document.documentElement.scrollTop = 0;
                  document.querySelector("#OrderDetails").scrollTop = 0;
                  document
                    .querySelector("#OrderDetails")
                    .classList.add("overflow-hidden");
                  document
                    .querySelector("#OrderDetails")
                    .classList.remove("overflow-auto");
                  setOrderOptions(true);
                }}
              />
            </>
          )}
        </span>
      </div>
    </>
  );
}

export default SettingTopBar;
