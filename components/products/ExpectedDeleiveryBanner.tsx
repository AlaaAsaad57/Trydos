"use client";
import { useAppStore } from "store";
import ExpectedDeleiveryModal from "./ExpectedDeleiveryModal";
function ExpectedDeleiveryBanner({
  children,
  language,
  country,
  product_id,
  shipping_days,
  allow_return_in_days = 0,
}) {
  const { setColorBottomSheet } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <>
      <ExpectedDeleiveryModal
        product_id={product_id}
        shipping_days={shipping_days}
        allow_return_in_days={allow_return_in_days}
      />
      <div
        className={`${
          isRtl && "items-end"
        } py-[8px] gap-px flex-col cursor-pointer  w-full h-auto text-[#1D1D1D] text-[9px] regular rounded-none`}
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
