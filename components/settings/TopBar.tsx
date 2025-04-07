import React from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import OptionsIcon from "public/svg/OptionsIcon.svg";

function SettingTopBar({
  Save,
  hasOptions,
  screenName,
  goBack,
  Icon,
}: {
  Save?: () => void;
  hasOptions?: boolean;
  screenName: string;
  goBack: () => void;
  Icon?: React.ReactNode;
}) {
  return (
    <div className="flex-row w-full h-[50px] items-center px-[12px] justify-between">
      <span className="cursor-pointer" onClick={() => goBack()}>
        <BackIcon />
      </span>
      <div className="felx-row">
        {Icon || <></>}
        <span
          className={`${Icon && "ml-[4px]"} text-[#1D1D1D] text-[14px] medium`}
        >
          {screenName}
        </span>
      </div>
      <span
        className="cursor-pointer medium text-[#402CDD] text-[14px]"
        onClick={() => {
          if (Save) Save();
        }}
      >
        {Save && "Save"}
        {hasOptions && <OptionsIcon />}
      </span>
    </div>
  );
}

export default SettingTopBar;
