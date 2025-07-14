"use client";
import React from "react";
import { checkAndUpdateVersion } from "utils/version-manager";
import { showSuccessMessage } from "./AddToCartMessage";
import { showSuccessNotification } from "store/notifications/reducer";

interface VersionCheckerProps {
  children?: React.ReactNode;
}

const VersionChecker: React.FC<VersionCheckerProps> = () => {
  React.useEffect(() => {
    // Run version check on component mount
    checkAndUpdateVersion();
  }, []);

  // This component doesn't render anything visible
  return <></>;
};

export default VersionChecker;
