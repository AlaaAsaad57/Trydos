import React, { useState } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import OptionsIcon from "public/svg/OptionsIcon.svg";
import { translateFunction } from "utils/functions";
import ChatIcon from "public/svg/ChatIcon.svg";
import ChatWidget from "components/Chat/ChatWidget";

function SettingTopBar({
  Save,
  hasOptions,
  screenName,
  goBack,
  Icon,
  DataCy,
  hasChat = false,
}: {
  Save?: () => void;
  hasOptions?: boolean;
  screenName: string | React.ReactNode;
  goBack: () => void;
  Icon?: React.ReactNode;
  DataCy?: string;
  hasChat?: boolean;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

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
          {hasChat && (
            <ChatIcon
              className="mx-[10px] cursor-pointer"
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
                setIsChatOpen(true);
              }}
            />
          )}
          {hasOptions && <OptionsIcon />}
        </span>
      </div>
      <ChatWidget
        isOpen={isChatOpen}
        onClose={() => {
          document.documentElement.style.overflow = "auto";

          document
            .querySelector("#OrderDetails")
            .classList.remove("overflow-hidden");
          document
            .querySelector("#OrderDetails")
            .classList.add("overflow-auto");
          setIsChatOpen(false);
        }}
      />
    </>
  );
}

export default SettingTopBar;
