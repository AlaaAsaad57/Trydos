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
      className="fixed inset-0 z-[999999999999] flex items-center justify-center bg-black/40 px-[24px]"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="p-[12px] relative bg-white w-full flex-col max-w-[360px] overflow-hidden rounded-[16px] shadow-xl "
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-[16px] font-semibold text-[#1D1D1D] flex justify-center items-center">
          {modalTitle}
        </h3>

        <div className="flex flex-row w-full justify-center gap-[60px]">
          {options.map((option, index) => (
            <button
              key={index}
              className="flex items-center gap-[12px] w-full px-[20px] py-[14px] text-left text-[#1D1D1D] text-[14px] hover:bg-[#F8F8F8] transition-colors "
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
