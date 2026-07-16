"use client";
import React, { useState, useEffect } from "react";
import { translateFunction } from "utils/functions";
import { createPortal } from "react-dom";
import { ConfirmationModal } from "components/settings/PersonalInfo";
import { useAppStore } from "store";
import { isValidPhone } from "utils/phone";

function VerifyUser({ phone: serverPhone }) {
  const { setLoginOpen, userProfile, user } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prefer live client state from store, fall back to server-rendered prop
  const phone = userProfile?.phone ?? user?.phone ?? serverPhone;

  // Treat the user as verified when they have a valid phone on record, regardless
  // of `is_phone_verified` (which register-guest resets to 0 for the same user).
  const isVerified = isValidPhone(phone);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenModal = () => {
    if (!isVerified) {
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
      {isVerified ? (
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
          isVerified ? "text-[#1d1d1d]" : "text-[#FF5F61]"
        }`}
      >
        {isVerified
          ? translateFunction("Verified")
          : translateFunction("Verify Now")}
      </span>

      {/* Portal لضمان ظهور الـ Modal فوق الأنيميشن تماماً */}
      {isModalOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-xs">
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
          document.body,
        )}
    </div>
  );
}

export default VerifyUser;
