"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

const BackBar = ({
  local,
  name = null,
  options = null,
  isRtl,
  DataCy = "Back-Button-Icon",
  Icon = null,
  validateFunction = null,
  Save = null,
  preivous_page = null,
  onBackIntercept = null,
}) => {
  const [, language] = local.split("-");
  const { lastPathname } = useAppStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (loading) return;
    // Let the parent handle the back action first (e.g. collapse an
    // expanded area). If it returns true, skip the default navigation.
    if (onBackIntercept && onBackIntercept()) return;
    let element = document.querySelector(".setting-screen");
    if (element) {
      element.classList.add("loading-page-class");
    }
    if (lastPathname) router.back();
    setLoading(true);
    if (preivous_page) {
      router.push(preivous_page);
      return;
    }
    if (pathname === `/${local}/settings` || !lastPathname)
      router.push(`/${local}`);
  };
  return (
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
        onClick={() => handleBack()}
        data-cy={(DataCy && `${DataCy}-back-button`) || "back-button"}
      >
        <img src="/icons/backIcon.svg" />
      </span>
      {name && (
        <div className="flex-row gap-[4px] items-center">
          {Icon && <img src={Icon} className="w-auto h-auto" />}
          <span className={` text-[#1D1D1D] text-[14px] medium`}>{name}</span>
        </div>
      )}
      <span
        className={"cursor-pointer medium text-[#402CDD] text-[14px] flex-row"}
        data-cy={DataCy || "save-button"}
        onClick={() => {
          if (validateFunction && !validateFunction()) return;
          if (Save) Save();
        }}
      >
        {Save ? translateFunction("Save", language) : <></>}

        {options && (
          <img
            className=""
            src="/icons/OptionsIcon.svg"
            onClick={() => {
              options();
            }}
          />
        )}
      </span>
    </div>
  );
};
export default BackBar;
