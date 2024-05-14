"use client";
import { useEffect } from "react";
import { GoogleAnalytics } from "nextjs-google-analytics";
function GAComponent() {
  useEffect(() => {}, []);
  let GA_MEASUREMENT_ID = "G-EK7TKN11PV";
  return (
    <>
      <GoogleAnalytics strategy="lazyOnload" trackPageViews />
    </>
  );
}

export default GAComponent;
