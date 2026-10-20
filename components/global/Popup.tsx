// components/global/CustomPopup.tsx
import React, { useEffect } from "react";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";

type CustomPopupOption = {
  render: () => React.ReactNode;
  onClick: () => void;
};

type CustomPopupProps = {
  options: CustomPopupOption[];
  modalTitle: string;
  close: () => void;
};

const CustomPopup: React.FC<CustomPopupProps> = ({
  options,
  modalTitle,
  close,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    DisableScroll();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      EnableScroll();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-999999999999 flex items-center justify-center bg-black/40 px-[24px]"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="p-[20px] pb-[16px] relative bg-white w-full max-w-[320px] overflow-hidden rounded-[16px] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-[15px] sm:text-[16px] font-normal text-[#1D1D1D] text-left rtl:text-right leading-[22px]">
          {modalTitle}
        </h3>

        <div className="flex flex-row w-full items-center justify-around mt-[28px]">
          {options.map((option, index) => (
            <button
              key={index}
              className="flex-1 flex items-center justify-center py-[8px] text-[#1D1D1D] text-[15px] font-normal hover:bg-[#F8F8F8] transition-colors rounded-[8px]"
              onClick={() => {
                option.onClick();
                close();
              }}
            >
              {option.render()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomPopup;
