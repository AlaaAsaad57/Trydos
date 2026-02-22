import {
  getCookie,
  setCookie,
  deleteCookie,
  clearHashedUserId,
} from "./cookies/cookie-manager";
import React from "react";
import { clearAllUserData } from "./tinyUtils";

// Version cookie name
const VERSION_COOKIE_NAME = "APP_VERSION";

// Get the current app version from environment variable
const getCurrentVersion = (): string => {
  return process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
};

// Get the stored version from cookie
const getStoredVersion = (): string | null => {
  try {
    return getCookie<string>(VERSION_COOKIE_NAME);
  } catch (error) {
    console.warn("Failed to get stored version:", error);
    return null;
  }
};

// Set the version cookie
const setVersionCookie = (version: string): void => {
  try {
    setCookie(VERSION_COOKIE_NAME, version, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  } catch (error) {
    console.error("Failed to set version cookie:", error);
  }
};

// Clear all client-side storage
const clearAllStorage = (): void => {
  try {
    // Clear localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.clear();
    }

    // Clear sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.clear();
    }

    // Clear all cookies (except essential ones)
    const essentialCookies = [
      VERSION_COOKIE_NAME, // Keep version cookie
    ];

    // Get all cookies and delete non-essential ones
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const cookieName = cookie.split("=")[0].trim();
      if (!essentialCookies.includes(cookieName)) {
        deleteCookie(cookieName);
      }
    });
    clearHashedUserId();
  } catch (error) {}
};

// Check if version needs update
const checkVersionUpdate = (): boolean => {
  const currentVersion = getCurrentVersion();
  const storedVersion = getStoredVersion();
  if (!storedVersion) {
    setVersionCookie(currentVersion);
    return false;
  }
  // If no stored version or versions don't match, update is needed
  return !storedVersion || storedVersion !== currentVersion;
};

const performVersionUpdate = (): void => {
  try {
    const currentVersion = getCurrentVersion();

    // Clear all storage
    clearAllStorage();
    clearAllUserData();
    // Set new version cookie
    setVersionCookie(currentVersion);

    // Reload the page
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  } catch (error) {}
};

// Main version check function
export const checkAndUpdateVersion = (): void => {
  // Only run on client side
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (checkVersionUpdate()) {
      performVersionUpdate();
    } else {
    }
  } catch (error) {
    console.error("Version check failed:", error);
  }
};
