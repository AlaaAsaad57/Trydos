"use client";
import { useEffect } from "react";
import { GoogleAnalytics } from "nextjs-google-analytics";
function GAComponent() {
  useEffect(() => {}, []);
  return (
    <>
      <GoogleAnalytics strategy="worker" trackPageViews />
    </>
  );
}

export default GAComponent;
