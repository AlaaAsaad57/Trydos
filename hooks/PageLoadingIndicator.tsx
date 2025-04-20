"use client";

import BoutiqueLoader from "components/skeleton/loaders/BoutiqueLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import HomeLoader from "components/skeleton/loaders/HomeLoader";
import { type ReactNode, useEffect, useState } from "react";
import { registerRouteChangeListener } from "utils/events";

export default function PageLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    registerRouteChangeListener("start", (data) => {
      console.log("start", data);
      setIsLoading(data);
    });

    registerRouteChangeListener("completed", () => {
      setIsLoading(null);
    });
  }, []);
  if (!isLoading) return <></>;
  else {
    if (isLoading.is_home) return <HomeLoader />;
    if (isLoading.is_boutique) return <BoutiqueLoader boutique={isLoading} />;
    if (isLoading.is_product) return <></>;
    if (isLoading.is_filter) return <></>;
    if (isLoading.is_full_home) return <FullHomeLoader />;
    if (isLoading.is_settings) return <></>;
  }
  return (
    <>
      {isLoading && (
        <div
          style={{
            zIndex: "99999999999999",
          }}
          className="fixed bg-black h-screen    w-screen animate-progress animate-pulse overflow-hidden rounded-full bg-gradient-to-r from-primary to-orange-300"
        >
          <div
            className={
              "h-full w-2/6 animate-progress rounded-full bg-green-900"
            }
          ></div>
        </div>
      )}
    </>
  );
}
