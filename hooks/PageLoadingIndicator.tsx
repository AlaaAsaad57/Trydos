"use client";
import Spinner from "components/global/Spinner";
import BoutiqueLoader from "components/skeleton/loaders/BoutiqueLoader";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";
import FilterLoader from "components/skeleton/loaders/FilterLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import HomeLoader from "components/skeleton/loaders/HomeLoader";
import ProductLoader from "components/skeleton/loaders/ProductLoader";
import SettingsLoader from "components/skeleton/loaders/SettingsLoader";
import { useAppStore } from "store";
export default function PageLoadingIndicator() {
  const { isNavigating } = useAppStore();

  if (!isNavigating) return <></>;
  else {
    if (isNavigating.is_home) return <HomeLoader />;
    if (isNavigating.is_boutique)
      return <BoutiqueLoader boutique={isNavigating} />;
    if (isNavigating.is_product)
      return <ProductLoader product={isNavigating} />;
    if (isNavigating.is_filter)
      return <FilterLoader isForSearch boutique={isNavigating} />;
    if (isNavigating.is_full_home) return <FullHomeLoader />;
    if (isNavigating.is_settings) return <SettingsLoader />;

    if (isNavigating.is_filter_search)
      return <FilterLoader isForSearch boutique={isNavigating} />;
  }
  if (isNavigating.is_compare) {
    return <CompareSkeleton />;
  }
  return (
    <>
      {isNavigating && (
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
