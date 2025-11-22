import React, { useState } from "react";
import BackIcon from "public/svg/listing/backIcon";
import OptionsIcon from "public/svg/OptionsIcon";
import { translateFunction } from "utils/functions";

import { useAppStore } from "store";
import { SettingTopBarPropsType } from "models/componentType/settingTypes/SettingTopBarPrpsType";
import { DisableScroll } from "utils/tinyUtils";

function SettingTopBar({
  Save,
  hasOptions,
  screenName,
  goBack,
  Icon,
  DataCy,
  validateFunction,
}: SettingTopBarPropsType) {
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
          className={
            "cursor-pointer medium text-[#402CDD] text-[14px] flex-row"
          }
          data-cy={DataCy || "save-button"}
          onClick={() => {
            if (validateFunction && !validateFunction()) return;
            if (Save) Save();
          }}
        >
          {Save ? translateFunction("Save") : <></>}

          {hasOptions && (
            <>
              <OptionsIcon
                onClick={() => {
                  DisableScroll();

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
