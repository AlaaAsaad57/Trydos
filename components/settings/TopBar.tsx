import OptionsIcon from "public/svg/OptionsIcon";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { DisableScroll } from "utils/tinyUtils";

function SettingTopBar({
  Save,
  hasOptions,
  screenName,
  goBack,
  Icon,
  DataCy,
  validateFunction,
}: any) {
  const { setOrderOptions, language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      <div
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
        className="flex-row w-full min-h-[50px] h-[50px] items-center px-[12px] justify-between"
      >
        <span
          className="cursor-pointer"
          style={{
            transform: isRtl ? "rotate(180deg)" : "rotate(0)",
          }}
          onClick={() => goBack()}
          data-cy={(DataCy && `${DataCy}-back-button`) || "back-button"}
        >
          <img src="/icons/backIcon.svg" />
        </span>
        <div className="flex-row gap-[4px] items-center">
          {Icon || <></>}
          <span className={` text-[#1D1D1D] text-[14px] medium`}>
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
