"use client";
import { useEffect, useState } from "react";
import Timer from "./Timer";
import {
  checkSessionExpiry,
  clearSimulatedUserSession,
} from "utils/sessionManager";
import { COOKIE_NAMES, deleteCookie } from "utils/cookies/cookie-manager";

interface SessionTimerProps {
  className?: string;
}

const SessionTimer = ({ className = "" }: SessionTimerProps) => {
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check if session is still valid
    const isValid = checkSessionExpiry();
    if (!isValid) {
      setIsExpired(true);
      return;
    }

    // Check if we have a session expiry time stored
    const storedExpiry = localStorage.getItem("sessionExpiry");
    if (storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      setSessionExpiry(expiryDate);

      // Check if session is already expired
      if (expiryDate <= new Date()) {
        handleSessionExpired();
      }
    }
  }, []);

  const handleSessionExpired = () => {
    deleteCookie(COOKIE_NAMES.USER_DATA);
    deleteCookie(COOKIE_NAMES.USER_CHAT);
    deleteCookie(COOKIE_NAMES.USER_STORIES);
    deleteCookie(COOKIE_NAMES.MARKET_TOKEN);
    deleteCookie(COOKIE_NAMES.DEVICE_TOKEN);
    deleteCookie(COOKIE_NAMES.COUNTRY);
    deleteCookie(COOKIE_NAMES.LANG);
    setIsExpired(true);

    // Clear all session data
    clearSimulatedUserSession();

    // Show alert and reload
    alert("Session for simulate user has ended");
    window.location.reload();
  };

  const handleTimerFinish = () => {
    handleSessionExpired();
  };

  // Don't render if no session or already expired
  if (!sessionExpiry || isExpired) {
    return null;
  }

  // Calculate remaining time in minutes and seconds
  const now = new Date();
  const timeDiff = sessionExpiry.getTime() - now.getTime();

  if (timeDiff <= 0) {
    handleSessionExpired();
    return null;
  }

  const remainingMinutes = Math.floor(timeDiff / (1000 * 60));
  const remainingSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return (
    <div
      className={`fixed top-4 right-4 z-[999999999999999] bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg transition-opacity duration-200 opacity-50 hover:opacity-100 ${className}`}
      title="Simulated User Session Timer"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-xs text-gray-300">Session:</span>
        <Timer
          onFinish={handleTimerFinish}
          minutes={remainingMinutes}
          seconds={remainingSeconds}
          onlySeconds={false}
        />
      </div>
    </div>
  );
};

export default SessionTimer;
