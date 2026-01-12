"use client";
import React from "react";
import { useAppStore } from "store";

function OrderNotified() {
  const { showNotificaionCircle } = useAppStore();
  return (
    <>
      {showNotificaionCircle.length > 0 ? (
        <span className="absolute w-[10px] h-[10px] bg-[#f64f64] rounded-full top-[-2px] right-[-2px] animate-pulse z-20"></span>
      ) : (
        <></>
      )}
    </>
  );
}

export default OrderNotified;
