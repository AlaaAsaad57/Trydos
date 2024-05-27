"use client";
import { useEffect, useState } from "react";
import { registerRouteChangeListener } from "./events";
import LandingPage from "components/Home/LandingPage";

export default function PageLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    registerRouteChangeListener("start", () => {
      setIsLoading(true);
    });

    registerRouteChangeListener("completed", () => {
      setIsLoading(false);
    });
  }, []);

  return <>{isLoading && <LandingPage afterLoad={true} />}</>;
}
