"use client";
import Spinner from "components/global/Spinner";
import BoutiqueLoader from "components/skeleton/loaders/BoutiqueLoader";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";
import FilterLoader from "components/skeleton/loaders/FilterLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import HomeLoader from "components/skeleton/loaders/HomeLoader";
import ProductLoader from "components/skeleton/loaders/ProductLoader";
import SettingsLoader from "components/skeleton/loaders/SettingsLoader";

/**
 * In-flow navigation loader picker. Rendered INSIDE `.main-content` (normal
 * document flow) — never fixed/absolute. Chooses the tailored skeleton from the
 * `isNavigating` payload. Mirrors the retired hooks/PageLoadingIndicator switch.
 */
export default function InFlowPageLoader({ nav }: { nav: any }) {
  if (!nav) return null;
  if (nav.is_home) return <HomeLoader />;
  if (nav.is_boutique) return <BoutiqueLoader boutique={nav} />;
  if (nav.is_product) return <ProductLoader product={nav} />;
  if (nav.is_filter) return <FilterLoader isForSearch boutique={nav} />;
  if (nav.is_full_home) return <FullHomeLoader />;
  if (nav.is_settings) return <SettingsLoader />;
  if (nav.is_filter_search) return <FilterLoader isForSearch boutique={nav} />;
  if (nav.is_compare) return <CompareSkeleton />;

  // Bare-truthy isNavigating (e.g. setIsNavigating(true)) → generic spinner.
  return (
    <div className="w-full flex justify-center p-5 min-h-[50vh]">
      <span className="scale-[5]">
        <Spinner />
      </span>
    </div>
  );
}
