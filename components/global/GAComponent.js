"use client";
import { useEffect } from "react";
import { GoogleAnalytics } from "nextjs-google-analytics";
function GAComponent() {
  useEffect(() => {}, []);
  let GA_MEASUREMENT_ID = "G-EK7TKN11PV";
  return (
    <>
      <GoogleAnalytics trackPageViews />
    </>
  );
}

export default GAComponent;
