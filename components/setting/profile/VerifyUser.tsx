"use client";
import React, { useState, useEffect } from "react";
import { translateFunction } from "utils/functions";
import { createPortal } from "react-dom";
import { ConfirmationModal } from "components/settings/PersonalInfo";
import { useAppStore } from "store";

function VerifyUser({ is_phone_verified, phone }) {
  const { setLoginOpen } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // نستخدم useEffect لضمان أننا في جهة العميل (Client-side) قبل استخدام Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenModal = () => {
    if (is_phone_verified === 0) {
      if (phone && phone !== "0") setIsModalOpen(true);
      else setLoginOpen(true);
    }
  };

  return (
    <div
      className="flex flex-col items-center cursor-pointer justify-center h-full self-navigate"
      onClick={handleOpenModal}
    >
      {/* SVG Icon */}
      <svg width="16.413" height="16.412" viewBox="0 0 16.413 16.412">
        <g transform="translate(-37.223 -62.334)">
          <g transform="translate(42.657 68.141)">
            <path
              d="M34.744,30.414a.684.684,0,0,0-.968,0l-2.939,2.939-1.228-1.228a.685.685,0,1,0-.968.968l1.71,1.712a.684.684,0,0,0,.968,0l3.425-3.423a.684.684,0,0,0,0-.968Z"
              transform="translate(-28.418 -30.213)"
              fill="#707070"
              stroke="#3c3c3c"
              strokeWidth="0.111"
            />
          </g>
          <path
            d="M15.332,7.332A.667.667,0,0,0,14.665,8a6.668,6.668,0,1,1-1.936-4.7.667.667,0,1,0,.945-.94A8,8,0,1,0,16,8a.667.667,0,0,0-.667-.667Z"
            transform="translate(37.438 62.538)"
            fill={is_phone_verified === 1 ? "#4cff79" : "none"}
            stroke="#707070"
            strokeWidth="0.4"
          />
        </g>
      </svg>

      {/* Label */}
      <span
        className={`text-[10px] regular mt-[4px] ${
          is_phone_verified === 1 ? "text-[#1d1d1d]" : "text-[#FF5F61]"
        }`}
      >
        {is_phone_verified === 1
          ? translateFunction("Verified")
          : translateFunction("Verify Now")}
      </span>

      {/* Portal لضمان ظهور الـ Modal فوق الأنيميشن تماماً */}
      {isModalOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
              <ConfirmationModal
                forVerify={true}
                closeWindow={() => setIsModalOpen(false)}
                value={phone}
                successCallback={(idToken) => {
                  setIsModalOpen(false);
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default VerifyUser;
