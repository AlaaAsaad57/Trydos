"use client";

import React, { useState } from "react";
import TryOnWidget from "./TryOnWidget";
import MalicanIcon from "public/svg/MailcanIcon.svg";
import { useAppStore } from "store";

interface VirtualTryOnProps {
  language: string;
  product: any;
}

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ language, product }) => {
  const isRtl = language === "ar" || language === "ku";
  const { setIsModalOpen } = useAppStore();
  return (
    <>
      <span
        onClick={() => {
          setIsModalOpen(product);
        }}
        className={`
            malican-span
            ${
              isRtl
                ? "rounded-[6px] rounded-br-[15px] right-[0px]"
                : "rounded-[6px] rounded-bl-[15px] left-[0px]"
            }  bg-[#513AAF] z-50 flex items-center justify-center w-[25px] h-[25px] bottom-[6px]  absolute`}
      >
        <MalicanIcon />
      </span>
    </>
  );
};

export default VirtualTryOn;
