"use client";

import { useEffect } from "react";
import { installErrorHandlers } from "@/utils/error-reporter";

export function ErrorReporterInit() {
  useEffect(() => {
    // Install global error handlers when component mounts
    installErrorHandlers();
  }, []);

  // This component doesn't render anything
  return null;
}
