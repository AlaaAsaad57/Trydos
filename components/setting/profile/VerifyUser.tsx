"use client";
import React, { useState, useEffect } from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { isValidPhone } from "utils/phone";
import AuthService from "services/auth";
import AuthOverlay from "components/Login/Enhanced/AuthOverlay";
import VerifyPhoneFlow from "components/Login/Enhanced/VerifyPhoneFlow";

function VerifyUser({ phone: serverPhone }) {
  // Per-field selectors: a whole-store destructure would re-render this
  // button on any unrelated store write. `loginOpen` / `shouldAuthinticated`
  // are read so this settings overlay can stand down when one of the global
  // auth surfaces is active (see isModalOpen below).
  const setLoginOpen = useAppStore((s) => s.setLoginOpen);
  const userProfile = useAppStore((s) => s.userProfile);
  const user = useAppStore((s) => s.user);
  const loginOpen = useAppStore((s) => s.loginOpen);
  const shouldAuthinticated = useAppStore((s) => s.shouldAuthinticated);
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

  // The overlay below stands down while a global auth surface is active (see
  // the comment near it), but that alone leaves `isModalOpen` true. Left
  // alone, the overlay would pop back the moment the global surface clears —
  // mid-flow state gone, at a moment the user never asked for it. Reset the
  // flag as soon as the gate closes it, so it stays closed after.
  useEffect(() => {
    if (loginOpen || shouldAuthinticated) {
      setIsModalOpen(false);
    }
  }, [loginOpen, shouldAuthinticated]);

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

      {/* AppScaler (the overlay's scaled canvas) is single-instance-only —
          it hardcodes #app-outer/#master-canvas and :root vars, so a second
          mounted instance corrupts both. The global auth surface wins:
          if the token just died (session expired / re-verify needed), this
          own-account re-verify can't complete anyway, so it stands down. */}
      {isModalOpen && mounted && !loginOpen && !shouldAuthinticated && (
        <AuthOverlay>
          <VerifyPhoneFlow
            initialPhone={phone}
            phoneLocked
            // The account already owns this number — a plain login verify.
            verify={(code, verificationId) =>
              AuthService.VerifyOtp(code, verificationId)
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
