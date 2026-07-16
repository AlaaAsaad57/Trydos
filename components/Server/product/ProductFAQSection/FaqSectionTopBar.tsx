"use client";
import { useAppStore } from "store";

function FaqSectionTopBar({ children, isRtl }) {
  const { setColorBottomSheet } = useAppStore();
  return (
    <div
      className={`${isRtl && "items-end"} flex-col px-[10px] cursor-pointer`}
      onClick={() => {
        setColorBottomSheet({
          is_for_faq: true,
        });
      }}
    >
      {children}
    </div>
  );
}

export default FaqSectionTopBar;
