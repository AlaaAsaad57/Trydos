import React from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import OptionsIcon from "public/svg/OptionsIcon.svg";
import { translateFunction } from "utils/functions";

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
}) {
  return (
    <div className="flex-row w-full min-h-[50px] h-[50px] items-center px-[12px] justify-between">
      <span
        className="cursor-pointer"
        onClick={() => goBack()}
        data-cy={(DataCy && `${DataCy}-back-button`) || "back-button"}
      >
        <BackIcon />
      </span>
      <div className="felx-row">
        {Icon || <></>}
        <span
          className={`${Icon && "ml-[4px]"} text-[#1D1D1D] text-[14px] medium`}
        >
          {typeof screenName === "string"
            ? translateFunction(screenName)
            : screenName}
        </span>
      </div>
      <span
        className="cursor-pointer medium text-[#402CDD] text-[14px]"
        data-cy={DataCy || "save-button"}
        onClick={() => {
          if (Save) Save();
        }}
      >
        {Save && translateFunction("Save")}
        {hasOptions && <OptionsIcon />}
      </span>
    </div>
  );
}

export default SettingTopBar;
