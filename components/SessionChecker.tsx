"use client";

import { useEffect } from "react";
import { initializeSessionCheck } from "utils/sessionManager";

/**
 * Global session checker component
 * Should be added to the root layout to check session validity across the entire app
 */
const SessionChecker = () => {
  useEffect(() => {
    // Check session validity on app load
    initializeSessionCheck();

    // Set up periodic session checks (every 5 minutes)
    const interval = setInterval(() => {
      initializeSessionCheck();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
};

export default SessionChecker;
