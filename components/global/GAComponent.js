"use client";
import { useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
function GAComponent() {
  useEffect(() => {}, []);
  let GA_MEASUREMENT_ID = "G-EK7TKN11PV";
  return (
    <>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </>
  );
}

export default GAComponent;
