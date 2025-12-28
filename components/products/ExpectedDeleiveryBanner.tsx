"use client";
import { useAppStore } from "store";
import ExpectedDeleiveryModal from "./ExpectedDeleiveryModal";
function ExpectedDeleiveryBanner({ children, language, country }) {
  const { setColorBottomSheet } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <>
      <ExpectedDeleiveryModal />
      <div
        className={`${
          isRtl && "items-end"
        } py-[8px] gap-[1px] flex-col  w-full h-auto text-[#1D1D1D] text-[9px] regular rounded-none`}
        onClick={() => {
          setColorBottomSheet({
            is_for_deleviery: true,
          });
        }}
        style={{
          borderBottom: "#D3D3D37f 1px solid",
        }}
      >
        {children}
      </div>
    </>
  );
}

export default ExpectedDeleiveryBanner;
