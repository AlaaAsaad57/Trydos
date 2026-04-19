import { deleteCookie, COOKIE_NAMES } from "./cookies/cookie-manager";
import { clearAllUserData } from "./tinyUtils";

/**
 * Check if the simulated user session has expired
 * Returns true if session is still valid, false if expired
 */
export const checkSessionExpiry = (): boolean => {
  if (typeof window === "undefined") return true;

  const sessionExpiry = localStorage.getItem("sessionExpiry");
  if (!sessionExpiry) return true; // No session, so it's "valid"

  const expiryDate = new Date(sessionExpiry);
  const now = new Date();

  // Check if session has expired (more than 30 minutes or current time is past expiry)
  const timeDiff = now.getTime() - expiryDate.getTime();
  const isExpired = timeDiff > 0 || timeDiff < -30 * 60 * 1000; // More than 30 minutes past expiry

  if (isExpired) {
    clearSimulatedUserSession();
    return false;
  }

  return true;
};

/**
 * Clear all simulated user session data
 */
export const clearSimulatedUserSession = (): void => {
  if (typeof window === "undefined") return;

  // Clear all cookies
  clearAllUserData();

  // Clear localStorage
  localStorage.removeItem("sessionExpiry");

  // Clear any other localStorage items that might be related to simulated user
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes("user") ||
        key.includes("session") ||
        key.includes("simulate"))
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

/**
 * Initialize session check on page load
 * Should be called in a useEffect or on page load
 */
export const initializeSessionCheck = (): void => {
  if (typeof window === "undefined") return;

  const isValid = checkSessionExpiry();

  if (!isValid) {
    alert("Session for simulate user has ended");
    window.location.reload();
  }
};
