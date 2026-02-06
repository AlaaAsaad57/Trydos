"use client";

import { useAppStore } from "store";

interface VirtualTryOnProps {
  language: string;
  product: any;
}

const VirtualTryOn = ({ language, product }) => {
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
                ? "rounded-[6px] rounded-br-[15px] right-0"
                : "rounded-[6px] rounded-bl-[15px] left-0"
            }  bg-[#513AAF] z-50 flex items-center justify-center w-[25px] h-[25px] bottom-[6px]  absolute`}
      >
        <img src="/icons/MailcanIcon.svg" />
      </span>
    </>
  );
};

export default VirtualTryOn;
