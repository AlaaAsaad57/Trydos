"use client";
import React from "react";
import { checkAndUpdateVersion } from "utils/version-manager";
interface VersionCheckerProps {
  children?: React.ReactNode;
}

const VersionChecker = () => {
  React.useEffect(() => {
    console.log("🚀 VersionChecker mounted:", new Date().toISOString());
    // Run version check on component mount
    checkAndUpdateVersion();
  }, []);

  // This component doesn't render anything visible
  return <></>;
};

export default VersionChecker;
