"use client";

import Spinner from "components/global/Spinner";
import BoutiqueLoader from "components/skeleton/loaders/BoutiqueLoader";
import FilterLoader from "components/skeleton/loaders/FilterLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import HomeLoader from "components/skeleton/loaders/HomeLoader";
import ProductLoader from "components/skeleton/loaders/ProductLoader";
import SettingsLoader from "components/skeleton/loaders/SettingsLoader";

import { useEffect, useState } from "react";
import { registerRouteChangeListener } from "utils/events";

export default function PageLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    let timeout;
    registerRouteChangeListener("start", (data) => {
      document.documentElement.style.overflow = "hidden";
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      if (isLoading) {
        if (timeout) {
          clearTimeout(timeout);
        }
        setIsLoading(null);
        // @ts-ignore
        window.location.href = data?.href;
        return;
      }
      setIsLoading(data);

      timeout = setTimeout(() => {
        // @ts-ignore
        if (data?.href) {
          // @ts-ignore
          window.location.href = data?.href;
        }
      }, 60000);
    });

    registerRouteChangeListener("completed", () => {
      clearTimeout(timeout);
      document.body.style.overflow = "initial";
      document.body.scrollTop = 0;
      setIsLoading(null);
    });
  }, [isLoading]);
  if (!isLoading) return <></>;
  else {
    if (isLoading.is_home) return <HomeLoader />;
    if (isLoading.is_boutique) return <BoutiqueLoader boutique={isLoading} />;
    if (isLoading.is_product) return <ProductLoader product={isLoading} />;
    if (isLoading.is_filter)
      return <FilterLoader isForSearch boutique={isLoading} />;
    if (isLoading.is_full_home) return <FullHomeLoader />;
    if (isLoading.is_settings) return <SettingsLoader />;

    if (isLoading.is_filter_search)
      return <FilterLoader isForSearch boutique={isLoading} />;
  }
  return (
    <>
      {isLoading && (
        <div
          style={{
            zIndex: "99999999999999",
            top: "100px",
          }}
          className="fixed bg-[#fafafa] h-screen max-w-[1365px] mx-auto flex justify-center p-5  w-screen overflow-hidden top-[100px]"
        >
          <span className="scale-[5]">
            <Spinner />
          </span>
        </div>
      )}
    </>
  );
}
