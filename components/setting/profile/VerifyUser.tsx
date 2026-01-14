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
      {is_phone_verified === 1 ? (
        <img
          src="/icons/settings/VerifiedUserIcon.svg"
          className="w-[16px] h-[16px]"
        />
      ) : (
        <img
          src="/icons/settings/verifyUserIcon.svg"
          className="w-[16px] h-[16px]"
        />
      )}

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
