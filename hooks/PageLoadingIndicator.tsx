"use client";

import Spinner from "components/global/Spinner";
import BoutiqueLoader from "components/skeleton/loaders/BoutiqueLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import HomeLoader from "components/skeleton/loaders/HomeLoader";
import ProductLoader from "components/skeleton/loaders/ProductLoader";
import SettingsLoader from "components/skeleton/loaders/SettingsLoader";

import { type ReactNode, useEffect, useState } from "react";
import {
  dispatchRouteChangeEvent,
  registerRouteChangeListener,
} from "utils/events";

export default function PageLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    let timeout;
    registerRouteChangeListener("start", (data) => {
      document.documentElement.style.overflow = "hidden";
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      setIsLoading(data);
      console.log(data);
      timeout = setTimeout(() => {
        // @ts-ignore
        window.location.href = data?.href;
      }, 15000);
    });

    registerRouteChangeListener("completed", () => {
      document.body.style.overflow = "initial";
      document.body.scrollTop = 0;
      setIsLoading(null);
    });
  }, []);
  if (!isLoading) return <></>;
  else {
    if (isLoading.is_home) return <HomeLoader />;
    if (isLoading.is_boutique) return <BoutiqueLoader boutique={isLoading} />;
    if (isLoading.is_product) return <ProductLoader product={isLoading} />;
    if (isLoading.is_filter) return <BoutiqueLoader boutique={isLoading} />;
    if (isLoading.is_full_home) return <FullHomeLoader />;
    if (isLoading.is_settings) return <SettingsLoader />;
    if (isLoading.is_filter_search)
      return <BoutiqueLoader boutique={isLoading} isForSearch={true} />;
  }
  return (
    <>
      {isLoading && (
        <div
          style={{
            zIndex: "99999999999999",
          }}
          className="fixed bg-[#fafafa] h-screen    w-screen overflow-hidden rounded-full"
        >
          <span className="scale-[5]">
            <Spinner />
          </span>
        </div>
      )}
    </>
  );
}
