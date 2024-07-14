import React, { useEffect } from "react";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import BoutiquePhoto from "./BoutiquePhoto";
import BoutiqueCategoryFilter from "./BoutiqueCategoryFilter";
import { useDispatch, useSelector } from "react-redux";
import BoutiqueBrandFilter from "./filterComponents/BoutiqueBrandFilter";
import BoutiqueOfferFilter from "./filterComponents/BoutiqueOfferFilter";
import BoutiquePriceFilter from "./filterComponents/BoutiquePriceFilter";
import BoutiqueSizeFilter from "./filterComponents/BoutiqueSizeFilter";
import { expandView, normalizeView } from "utils/functions";
import FilterButtons from "./filterComponents/FilterButtons";
import FilterComponentLoader from "./filterComponents/FilterComponentLoader";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

function BoutiqueHeader({ boutique }) {
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const filterLoading = useSelector(
    (state: any) => state.details.filterLoading
  );
  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
  const activeFiltersShouldUpdate = useSelector(
    (state: any) => state.details.activeFiltersShouldUpdate
  );
  const filters = useSelector((state: any) => state.details.filters);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: "enable-handling-filter" });
  }, []);
  useEffect(() => {
    if (searchParams.size > 0) {
      dispatch({
        type: "ACTIVE-FILTER",
        payload: {
          // @ts-ignore
          categories: searchParams.get("categories")
            ? searchParams
                .get("categories")
                .split(",")
                .map((s) => {
                  return {
                    id: s,
                  };
                })
            : [],
          brands: searchParams.get("brands")
            ? searchParams
                .get("brands")
                .split(",")
                .map((s) => {
                  return {
                    id: s,
                  };
                })
            : [],
          sizes: searchParams.get("sizes")
            ? searchParams.get("sizes").split(",")
            : [],
          prices: searchParams.get("min-pr")
            ? {
                min: searchParams.get("min-pr"),
                max: searchParams.get("max-pr"),
              }
            : null,
          offers: [],
          searchText: searchParams.get("searchText"),
        },
      });
    }
    dispatch({
      type: "ACTIVE-ROUTE",
      payload: `${window.location.pathname}`,
    });
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 66) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    });
  }, []);
  return (
    <div className="boutique-header flex-col align-center">
      <div className="boutique-top-info flex-col items-center">
        <div className="boutique-logo-container flex-row align-center">
          <img width={130} height={20} src={boutique.icon} />
          <VerificationIcon />
          <TopStarIcon />
        </div>
        <div className="boutique-text">{boutique.name}</div>
      </div>
      <BoutiquePhoto photo={boutique.photo} />
      {filters?.categories.length > 0 && (
        <BoutiqueCategoryFilter filterEnabled={filterEnabled} />
      )}
      {filterEnabled && (
        <>
          {filters?.brands.length > 0 && <BoutiqueBrandFilter />}
          {filters?.offers?.length > 0 && <BoutiqueOfferFilter />}
          {filters?.prices?.min_price >= 0 && <BoutiquePriceFilter />}
          {filters?.sizes?.length > 0 && <BoutiqueSizeFilter />}
          <FilterButtons />
          {filterLoading && <FilterComponentLoader />}
        </>
      )}
    </div>
  );
}

export default BoutiqueHeader;
