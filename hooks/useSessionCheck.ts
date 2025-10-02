import { useEffect } from "react";
import { initializeSessionCheck } from "utils/sessionManager";

/**
 * Hook to check session validity on component mount
 * Should be used in components that need to verify session status
 */
export const useSessionCheck = () => {
  useEffect(() => {
    initializeSessionCheck();
  }, []);
};
