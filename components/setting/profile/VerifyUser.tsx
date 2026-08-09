"use client";
import React, { useState, useEffect } from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { isValidPhone } from "utils/phone";
import AuthService from "services/auth";
import AuthOverlay from "components/Login/Enhanced/AuthOverlay";
import VerifyPhoneFlow from "components/Login/Enhanced/VerifyPhoneFlow";

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

      {isModalOpen && mounted && (
        <AuthOverlay>
          <VerifyPhoneFlow
            initialPhone={phone}
            phoneLocked
            // The account already owns this number — a plain login verify.
            verify={(code, verificationId) =>
              AuthService.VerifyOtp(code, verificationId, "", () => {})
            }
            onSuccess={() => setIsModalOpen(false)}
            onClose={() => setIsModalOpen(false)}
          />
        </AuthOverlay>
      )}
    </div>
  );
}

export default VerifyUser;
