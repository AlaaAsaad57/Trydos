"use client";
import { useAppStore } from "store";

function BuyersCommentTopBar({ children, isRtl }) {
  const { setColorBottomSheet } = useAppStore();
  return (
    <div
      className={`${isRtl && "items-end"} flex-col px-[10px]`}
      onClick={() => {
        setColorBottomSheet({
          is_buyers_comments: true,
        });
      }}
    >
      {children}
    </div>
  );
}

export default BuyersCommentTopBar;
