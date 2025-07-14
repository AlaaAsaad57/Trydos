import { useEffect } from "react";
import { checkAndUpdateVersion } from "utils/version-manager";

/**
 * Custom hook for version checking
 * Runs version check on component mount
 */
export const useVersionCheck = (): void => {
  useEffect(() => {
    checkAndUpdateVersion();
  }, []);
};

export default useVersionCheck;
