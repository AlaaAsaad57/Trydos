"use client";

import { useState, useEffect } from "react";
import {
  getCookie,
  COOKIE_NAMES,
  type UserData,
} from "@/utils/cookies/cookie-manager";

interface GuestSession {
  isLoading: boolean;
  hasValidSession: boolean;
  userData: UserData | null;
  deviceToken: string | null;
  isAuthenticated: boolean;
  ensureSession: () => Promise<void>;
}

/**
 * Hook for managing guest sessions on the client side
 * Note: Guest registration should primarily happen in middleware,
 * but this hook can be used for edge cases or manual session management
 */
export function useGuestSession(): GuestSession {
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  // Check current session from cookies
  const checkSession = () => {
    const token = getCookie<string>(COOKIE_NAMES.DEVICE_TOKEN);
    const marketToken = getCookie<string>(COOKIE_NAMES.MARKET_TOKEN);
    const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);

    setDeviceToken(token || marketToken);
    setUserData(user);

    // Check if session is valid
    let isValid = !!(token || marketToken) && !!user;

    // Check expiration

    setHasValidSession(isValid);
    return isValid;
  };

  // Ensure guest session exists
  const ensureSession = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // First check if we already have a valid session
      if (checkSession()) {
        return;
      }

      // Call API to ensure session
      const response = await fetch("/api/auth/ensure-guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Session created/updated, check again
          checkSession();
        } else {
          console.error("Failed to ensure guest session:", result.error);
        }
      } else {
        console.error("Guest session API call failed:", response.status);
      }
    } catch (error) {
      console.error("Error ensuring guest session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check session on mount and when cookies change
  useEffect(() => {
    checkSession();

    // Listen for cookie changes (if needed)
    const interval = setInterval(checkSession, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const isAuthenticated = !!getCookie<string>(COOKIE_NAMES.MARKET_TOKEN);

  return {
    isLoading,
    hasValidSession,
    userData,
    deviceToken,
    isAuthenticated,
    ensureSession,
  };
}
